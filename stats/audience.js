import {VISIT_PAGES,VISIT_PERIODS} from './visits.js';
export const AUDIENCE_DIMENSIONS=['locations','languages','sizes','browsers','systems'];
export const AUDIENCE_PATHS=[...new Set(Object.values(VISIT_PAGES).flat())];
const date=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
export function normalizeAudience(raw){
 if(raw?.version!==1||!date(raw.generatedAt))throw new Error('Invalid audience snapshot');
 // A scope mismatch must never silently turn into an all-site report.
 if(JSON.stringify(raw.paths)!==JSON.stringify(AUDIENCE_PATHS))throw new Error('Invalid audience scope');
 const periods={};
 for(const period of VISIT_PERIODS){
  periods[period]={};
  for(const dimension of AUDIENCE_DIMENSIONS){
   const entry=raw.periods?.[period]?.[dimension];
   if(!entry||!date(entry.start)||!date(entry.end)||!date(entry.fetchedAt)||Date.parse(entry.start)>=Date.parse(entry.end)||!Array.isArray(entry.rows))continue;
   if(entry.rows.length>2000)continue;
   const rows=[];let valid=true;
   for(const row of entry.rows){
    if(typeof row.key!=='string'||row.key.length>120||typeof row.name!=='string'||row.name.length>160||!Number.isSafeInteger(row.count)||row.count<0){valid=false;break;}
    rows.push({key:row.key,name:row.name,count:row.count});
   }
   if(!valid||!Number.isSafeInteger(rows.reduce((sum,row)=>sum+row.count,0)))continue;
   periods[period][dimension]={rows,start:entry.start,end:entry.end,fetchedAt:entry.fetchedAt,failed:entry.failed===true};
  }
 }
 return {version:1,generatedAt:raw.generatedAt,paths:[...AUDIENCE_PATHS],periods};
}
export function mergeAudience(previous,incoming){
 if(!previous)return incoming;
 const periods={};
 for(const period of VISIT_PERIODS){
  periods[period]={...previous.periods[period]};
  for(const [dimension,entry] of Object.entries(incoming.periods[period]||{})){
   const old=periods[period][dimension];
   if(!old||Date.parse(entry.fetchedAt)>=Date.parse(old.fetchedAt))periods[period][dimension]=entry;
  }
 }
 return {...incoming,generatedAt:new Date(Math.max(Date.parse(previous.generatedAt),Date.parse(incoming.generatedAt))).toISOString(),periods};
}
export function distribution(rows){
 const total=rows.reduce((sum,row)=>sum+row.count,0);
 return rows.filter(row=>row.count>0).map(row=>({...row,share:total?row.count/total:0})).sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key));
}
