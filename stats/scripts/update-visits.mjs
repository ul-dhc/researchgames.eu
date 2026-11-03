import {readFile,writeFile,rename} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {VISIT_PAGES,VISIT_PERIODS,normalizeVisits,visitRange} from '../visits.js';
const API = 'https://researchgames.goatcounter.com/api/v0/stats/hits';
export async function requestVisitSeries(paths, range, token, fetcher=fetch, expectedEvent=false) {
  if (!token) throw new Error('GOATCOUNTER_API_TOKEN is not configured');
  let visits=0, complete=true, timelineStart, timelineEnd;
  const days=new Map();
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
      if (Boolean(hit.event) !== expectedEvent || hit.path !== path || !Number.isSafeInteger(hit.count) || hit.count < 0) throw new Error('Unexpected GoatCounter path/count');
      visits += hit.count;
      if (!Array.isArray(hit.stats)) { complete=false; continue; }
      let sum=0;const seen=new Set();
      for(const day of hit.stats){
        if(typeof day.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day.day)||!Number.isFinite(Date.parse(day.day+'T00:00:00Z'))||new Date(day.day+'T00:00:00Z').toISOString().slice(0,10)!==day.day||!Number.isSafeInteger(day.daily)||day.daily<0||seen.has(day.day))throw new Error('Unexpected daily statistics');
        seen.add(day.day);sum+=day.daily;
        timelineStart=!timelineStart||day.day<timelineStart?day.day:timelineStart;
        timelineEnd=!timelineEnd||day.day>timelineEnd?day.day:timelineEnd;
        if(day.daily)days.set(day.day,(days.get(day.day)||0)+day.daily);
      }
      if(sum!==hit.count)throw new Error('Unexpected daily statistics');
    }
  }
  if (!Number.isSafeInteger(visits)) throw new Error('Invalid visit total');
  const result={visits};
  if(complete){
    const date=value=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Riga'}).format(new Date(value));
    result.timelineStart=timelineStart||date(range.start);result.timelineEnd=timelineEnd||date(range.end);
    result.timeline=[...days].sort(([a],[b])=>a.localeCompare(b)).map(([date,visits])=>({date,visits}));
  }
  return result;
}
// Preserve the count-only helper for existing consumers.
export async function requestVisits(paths,range,token,fetcher=fetch){
  return (await requestVisitSeries(paths,range,token,fetcher)).visits;
}
export async function collectVisits(previous, request, now=new Date()) {
  const result={version:1,generatedAt:now.toISOString(),periods:{}};
  let failures=0;
  for (const period of VISIT_PERIODS) {
    result.periods[period]={};
    const range=visitRange(period,now);
    for (const [id,paths] of Object.entries(VISIT_PAGES)) {
      try {
        const received=await request(paths,range);
        const visits=typeof received==='number'?received:received?.visits;
        if (!Number.isSafeInteger(visits)||visits<0) throw new Error('Invalid visit total');
        result.periods[period][id]={...(typeof received==='object'?received:{}),visits,...range,fetchedAt:now.toISOString(),failed:false};
      } catch(error) {
        failures++;
        // Only our error category is logged; never API bodies, headers or credentials.
        const message=/^GoatCounter HTTP \d+$/.test(error.message)?error.message:
          error.message==='Incomplete GoatCounter result'?error.message:
          error.message==='Unexpected GoatCounter path/count'?error.message:
          error.message==='Unexpected daily statistics'?error.message:
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
  const {snapshot,failures}=await collectVisits(previous,(paths,range)=>requestVisitSeries(paths,range,process.env.GOATCOUNTER_API_TOKEN,request));
  await writeFile(path+'.tmp',JSON.stringify(snapshot)+'\n');await rename(path+'.tmp',path);
  console.log(`Saved visits aggregates; ${failures} unavailable game/period pairs`);
  if(failures) console.warn('::warning::Page visits could not refresh; check the GoatCounter read-statistics secret and API access. Previous counts retain their original dates.');
}
