import {normalizeSummary} from './data.js';
export const PERIODS = ['all','30d','7d'];
export function normalizeSnapshot(raw, ids) {
 if (raw?.version !== 1 || !Number.isFinite(Date.parse(raw.generatedAt))) throw new Error('Invalid snapshot');
 const periods = {};
 for (const period of PERIODS) {
  periods[period] = {};
  for (const id of ids) {
   const entry = raw.periods?.[period]?.[id];
   if (!entry) continue;
   try {
    if (!Number.isFinite(Date.parse(entry.fetchedAt))) continue;
    periods[period][id] = {data:normalizeSummary({...entry.data,ok:true}),fetchedAt:entry.fetchedAt,failed:entry.failed === true};
   } catch { /* One damaged source must not hide the other games. */ }
  }
 }
 if (!Object.values(periods).some(p=>Object.keys(p).length)) throw new Error('Empty snapshot');
 return {version:1,generatedAt:raw.generatedAt,periods};
}
export function snapshotState(snapshot, period, now=Date.now()) {
 return new Map(Object.entries(snapshot.periods[period] || {}).map(([id,entry])=> {
  const savedAt=Date.parse(entry.fetchedAt);
  const stale=entry.failed || now-entryTime(entry)>15*60000;
  return [id,{data:entry.data,savedAt,cached:stale,error:stale}];
 }));
}

// Compare source time, not download or whole-file time: a newly downloaded
// cached response can still contain older statistics for one game.
export function entryTime(entry) {
 return Date.parse(entry?.data?.generatedAt) || Date.parse(entry?.fetchedAt) || 0;
}
export function mergeSnapshots(previous, incoming) {
 if (!previous) return {...incoming,periods:Object.fromEntries(PERIODS.map(p=>[p,incoming.periods[p] || {}]))};
 const periods = {};
 for (const period of PERIODS) {
  periods[period] = {...previous.periods[period]};
  for (const [id, entry] of Object.entries(incoming.periods[period] || {})) {
   const old = periods[period][id];
   if (!old || entryTime(entry) >= entryTime(old)) periods[period][id] = entry;
  }
 }
 return {version:1,generatedAt:new Date(Math.max(Date.parse(previous.generatedAt),Date.parse(incoming.generatedAt))).toISOString(),periods};
}

export async function refreshStaleSources(snapshot,period,sources,request,signal,onUpdate,now=Date.now()) {
 await Promise.all(Object.entries(sources).map(async([id,url])=>{
  const entry=snapshot?.periods[period]?.[id];
  if (entry && !entry.failed && now-entryTime(entry)<=15*60000) return;
  try {
   const data=await request(url,period,signal);
   if (signal.aborted) return;
   const time=new Date().toISOString();
   onUpdate({version:1,generatedAt:time,periods:{[period]:{[id]:{data,fetchedAt:time,failed:false}}}});
  } catch { /* Keep the visible snapshot and its original timestamp. */ }
 }));
}
