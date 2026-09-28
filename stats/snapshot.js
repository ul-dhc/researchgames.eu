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
  const stale=entry.failed || now-savedAt>15*60000;
  return [id,{data:entry.data,savedAt,cached:stale,error:stale}];
 }));
}
