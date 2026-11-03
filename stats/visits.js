// Only these game pages enter public visit statistics. UL107 is intentionally excluded.
export const VISIT_GAMES = {
  'miklu-rezgis': ['/games/miklu-rezgis', '/games/miklu-rezgis/berniem'],
  'libiesu-vietvardi': ['/games/libiesu-vietvardi']
};
export const VISIT_PERIODS = ['all', '90d', '30d', '7d'];
export function normalizeVisits(raw) {
  if (raw?.version !== 1 || !Number.isFinite(Date.parse(raw.generatedAt))) throw new Error('Invalid visits snapshot');
  const periods = {};
  for (const period of VISIT_PERIODS) {
    periods[period] = {};
    for (const id of Object.keys(VISIT_GAMES)) {
      const entry = raw.periods?.[period]?.[id];
      if (!entry) continue;
      if (!Number.isSafeInteger(entry.visits) || entry.visits < 0 ||
          !Number.isFinite(Date.parse(entry.fetchedAt)) ||
          !Number.isFinite(Date.parse(entry.start)) || !Number.isFinite(Date.parse(entry.end)) ||
          Date.parse(entry.start) >= Date.parse(entry.end)) continue;
      // Project only approved aggregate fields; never publish raw API records.
      periods[period][id] = {visits:entry.visits,start:entry.start,end:entry.end,
        fetchedAt:entry.fetchedAt,failed:entry.failed === true};
    }
  }
  return {version:1,generatedAt:raw.generatedAt,periods};
}
export function mergeVisits(previous,incoming) {
  if(!previous) return incoming;
  const periods={};
  for(const period of VISIT_PERIODS){
    periods[period]={...previous.periods[period]};
    for(const [id,entry] of Object.entries(incoming.periods[period]||{})){
      const old=periods[period][id];
      if(!old||Date.parse(entry.fetchedAt)>=Date.parse(old.fetchedAt))periods[period][id]=entry;
    }
  }
  return {version:1,generatedAt:new Date(Math.max(Date.parse(previous.generatedAt),Date.parse(incoming.generatedAt))).toISOString(),periods};
}
// Match existing dashboard date filters: include today and the starting day N days ago.
export function visitRange(period, now = new Date()) {
  if (!VISIT_PERIODS.includes(period)) throw new Error('Unknown visits period');
  const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Riga'}).format(now);
  const date = new Date(today + 'T00:00:00Z');
  if (period === 'all') date.setUTCFullYear(2000, 0, 1);
  else date.setUTCDate(date.getUTCDate() - parseInt(period));
  // Resolve the zone offset at local midnight, including daylight-saving changes.
  let midnight = date.getTime();
  for (let i=0; i<3; i++) {
    const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Riga',timeZoneName:'longOffset'}).formatToParts(new Date(midnight));
    const offset = parts.find(p=>p.type==='timeZoneName').value.match(/GMT([+-])(\d{2}):(\d{2})/);
    const minutes = offset ? (Number(offset[2])*60+Number(offset[3]))*(offset[1]==='+'?1:-1) : 0;
    midnight = date.getTime() - minutes*60000;
  }
  return {start:new Date(midnight).toISOString(),end:now.toISOString()};
}
