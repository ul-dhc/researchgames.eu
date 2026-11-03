import {readFile,writeFile,rename} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {AUDIENCE_DIMENSIONS,AUDIENCE_PATHS,normalizeAudience} from '../audience.js';
import {VISIT_PERIODS,visitRange} from '../visits.js';
const API='https://researchgames.goatcounter.com/api/v0/stats/';
export async function requestAudience(dimension,range,token,fetcher=fetch){
 if(!AUDIENCE_DIMENSIONS.includes(dimension))throw new Error('Invalid dimension');
 if(!token)throw new Error('Missing token');
 const rows=[],seen=new Set();
 for(let offset=0;offset<2000;){
  const url=new URL(API+dimension);
  for(const [key,value]of Object.entries({...range,path_by_name:'true',include_paths:AUDIENCE_PATHS.join(','),limit:'100',offset:String(offset)}))url.searchParams.set(key,value);
  let raw;
  for(let attempt=0;attempt<2;attempt++){
   try{
    const response=await fetcher(url,{headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error('Audience request failed');
    raw=await response.json();break;
   }catch(error){if(attempt===1)throw error;await new Promise(resolve=>setTimeout(resolve,1500));}
  }
  if(!Array.isArray(raw?.stats)||typeof raw.more!=='boolean'||raw.stats.length>100)throw new Error('Invalid audience response');
  for(const row of raw.stats){
   const key=row.id||row.name||'unknown',name=row.name||row.id||'';
   if(typeof key!=='string'||key.length>120||typeof name!=='string'||name.length>160||!Number.isSafeInteger(row.count)||row.count<0||seen.has(key))throw new Error('Invalid audience row');
   seen.add(key);rows.push({key,name,count:row.count});
  }
  if(!raw.more)return rows;
  if(!raw.stats.length)throw new Error('Incomplete audience pagination');
  offset+=raw.stats.length;
 }
 throw new Error('Audience pagination limit');
}
export async function collectAudience(previous,request,now=new Date()){
 const result={version:1,generatedAt:now.toISOString(),paths:[...AUDIENCE_PATHS],periods:{}};let failures=0;
 for(const period of VISIT_PERIODS){
  result.periods[period]={};const range=visitRange(period,now);
  for(const dimension of AUDIENCE_DIMENSIONS){
   try{
    const rows=await request(dimension,range);
    const candidate=normalizeAudience({...result,periods:{[period]:{[dimension]:{rows,...range,fetchedAt:now.toISOString(),failed:false}}}}).periods[period][dimension];
    if(!candidate)throw new Error('Invalid audience result');
    result.periods[period][dimension]=candidate;
   }catch{
    failures++;console.warn(`${dimension}/${period}: Audience source unavailable or invalid`);
    const old=previous?.periods?.[period]?.[dimension];
    if(old)result.periods[period][dimension]={...old,failed:true};
   }
  }
 }
 return {snapshot:normalizeAudience(result),failures};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const path=process.argv[2]||'stats/audience.json';let previous;
 try{previous=normalizeAudience(JSON.parse(await readFile(path,'utf8')));}catch{}
 const spaced=async(url,options)=>{await new Promise(resolve=>setTimeout(resolve,300));return fetch(url,options);};
 const {snapshot,failures}=await collectAudience(previous,(dimension,range)=>requestAudience(dimension,range,process.env.GOATCOUNTER_API_TOKEN,spaced));
 await writeFile(path+'.tmp',JSON.stringify(snapshot)+'\n');await rename(path+'.tmp',path);
 console.log(`Saved audience aggregates; ${failures} unavailable dimension/period pairs`);
 if(failures)console.warn('::warning::Some audience categories could not refresh. Previous data retain their original dates.');
}
