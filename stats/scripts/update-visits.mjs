import {readFile,writeFile,rename} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {VISIT_PAGES,VISIT_PERIODS,normalizeVisits,visitRange} from '../visits.js';
const API = 'https://researchgames.goatcounter.com/api/v0/stats/hits';
export async function requestVisits(paths, range, token, fetcher=fetch) {
  if (!token) throw new Error('GOATCOUNTER_API_TOKEN is not configured');
  let visits=0;
  // Exact per-path queries avoid accidentally including stats/about pages or events.
  for (const path of paths) {
    const url = new URL(API);
    for (const [key,value] of Object.entries({...range,path_by_name:'true',include_paths:path,limit:'100',daily:'true'})) url.searchParams.set(key,value);
    let raw;
    for (let attempt=0; attempt<2; attempt++) {
      try {
        const response = await fetcher(url,{headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(30000)});
        if (!response.ok) throw new Error(`GoatCounter HTTP ${response.status}`);
        raw = await response.json();
        break;
      } catch(error) {
        if(attempt===1) throw error;
        await new Promise(resolve=>setTimeout(resolve,1500));
      }
    }
    if (!Array.isArray(raw.hits) || raw.more !== false) throw new Error('Incomplete GoatCounter result');
    for (const hit of raw.hits) {
      if (hit.event || hit.path !== path || !Number.isSafeInteger(hit.count) || hit.count < 0) throw new Error('Unexpected GoatCounter path/count');
      visits += hit.count;
    }
  }
  if (!Number.isSafeInteger(visits)) throw new Error('Invalid visit total');
  return visits;
}
export async function collectVisits(previous, request, now=new Date()) {
  const result={version:1,generatedAt:now.toISOString(),periods:{}};
  let failures=0;
  for (const period of VISIT_PERIODS) {
    result.periods[period]={};
    const range=visitRange(period,now);
    for (const [id,paths] of Object.entries(VISIT_PAGES)) {
      try {
        const visits=await request(paths,range);
        if (!Number.isSafeInteger(visits)||visits<0) throw new Error('Invalid visit total');
        result.periods[period][id]={visits,...range,fetchedAt:now.toISOString(),failed:false};
      } catch(error) {
        failures++;
        // Only our error category is logged; never API bodies, headers or credentials.
        const message=/^GoatCounter HTTP \d+$/.test(error.message)?error.message:
          error.message==='Incomplete GoatCounter result'?error.message:
          error.message==='Unexpected GoatCounter path/count'?error.message:
          'Visit source unavailable or invalid';
        console.warn(`${id}/${period}: ${message}`);
        const old=previous?.periods?.[period]?.[id];
        if(old) result.periods[period][id]={...old,failed:true};
      }
    }
  }
  return {snapshot:normalizeVisits(result),failures};
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const path=process.argv[2]||'stats/visits.json';
  let previous;
  try {previous=normalizeVisits(JSON.parse(await readFile(path,'utf8')));} catch {}
  // Space calls below GoatCounter's four-requests/second limit.
  const request=async(url,options)=>{await new Promise(resolve=>setTimeout(resolve,300));return fetch(url,options);};
  const {snapshot,failures}=await collectVisits(previous,(paths,range)=>requestVisits(paths,range,process.env.GOATCOUNTER_API_TOKEN,request));
  await writeFile(path+'.tmp',JSON.stringify(snapshot)+'\n');await rename(path+'.tmp',path);
  console.log(`Saved visits aggregates; ${failures} unavailable game/period pairs`);
  if(failures) console.warn('::warning::Page visits could not refresh; check the GoatCounter read-statistics secret and API access. Previous counts retain their original dates.');
}
