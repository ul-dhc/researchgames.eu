import {readFile,writeFile,rename} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {VARIANTS,ACTIONS,PLANT_PERIODS,eventPath,normalizePlants} from '../latgalian-model.js';
import {visitRange} from '../visits.js';
import {requestVisitSeries} from './update-visits.mjs';
export async function collectPlants(previous,request,now=new Date()){
 const periods={};let failures=0;
 for(const period of PLANT_PERIODS){
  const range=visitRange(period,now);
  try{
   const events=[];
   for(const variant of VARIANTS)for(const action of ACTIONS){
    const result=await request(eventPath(action,variant),range);
    if(!Array.isArray(result.timeline))throw new Error('Missing daily data');
    events.push({game:variant.game,variant:variant.key,action,count:result.visits,timeline:result.timeline.map(d=>({date:d.date,count:d.visits}))});
   }
   periods[period]={...range,fetchedAt:now.toISOString(),failed:false,events};
   // Validate before replacing any previous successful period.
   normalizePlants({version:1,generatedAt:now.toISOString(),periods:{[period]:periods[period]}});
  }catch{failures++;delete periods[period];if(previous?.periods?.[period])periods[period]={...previous.periods[period],failed:true};}
 }
 return {snapshot:normalizePlants({version:1,generatedAt:now.toISOString(),periods}),failures};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const file=process.argv[2]||'stats/latgalian.json';let previous;
 try{previous=normalizePlants(JSON.parse(await readFile(file,'utf8')));}catch{}
 const fetcher=async(...args)=>{await new Promise(r=>setTimeout(r,300));return fetch(...args);};
 const {snapshot,failures}=await collectPlants(previous,(path,range)=>requestVisitSeries([path],range,process.env.GOATCOUNTER_API_TOKEN,fetcher,true));
 await writeFile(file+'.tmp',JSON.stringify(snapshot)+'\n');await rename(file+'.tmp',file);
 console.log(`Saved Latgalian aggregates; ${failures} unavailable periods`);
 if(failures)console.warn('::warning::Latgalian event counts could not refresh. Previous successful periods retain their original timestamps.');
}
