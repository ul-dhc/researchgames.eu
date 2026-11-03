// Only these game pages enter public visit statistics. UL107 is intentionally excluded.
export const VISIT_GAMES = {
  'miklu-rezgis': ['/games/miklu-rezgis', '/games/miklu-rezgis/berniem'],
  'libiesu-vietvardi': ['/games/libiesu-vietvardi'],
  'muns-teirums': ['/games/muns-teirums'],
  'cell-intro': ['/games/cell-intro', '/games/cell-intro-preview']
};
export const VISIT_PAGES = {landing: ['/', '/lv'], ...VISIT_GAMES};
export const VISIT_PERIODS = ['all', '90d', '30d', '7d'];
export function normalizeVisits(raw) {
  if (raw?.version !== 1 || !Number.isFinite(Date.parse(raw.generatedAt))) throw new Error('Invalid visits snapshot');
  const periods = {};
  for (const period of VISIT_PERIODS) {
    periods[period] = {};
    for (const id of Object.keys(VISIT_PAGES)) {
      const entry = raw.periods?.[period]?.[id];
      if (!entry) continue;
      if (!Number.isSafeInteger(entry.visits) || entry.visits < 0 ||
          !Number.isFinite(Date.parse(entry.fetchedAt)) ||
          !Number.isFinite(Date.parse(entry.start)) || !Number.isFinite(Date.parse(entry.end)) ||
          Date.parse(entry.start) >= Date.parse(entry.end)) continue;
      // Project only approved aggregate fields; never publish raw API records.
      periods[period][id] = {visits:entry.visits,start:entry.start,end:entry.end,
        fetchedAt:entry.fetchedAt,failed:entry.failed === true};
      const validDay=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
      if(Array.isArray(entry.timeline)&&validDay(entry.timelineStart)&&validDay(entry.timelineEnd)&&entry.timelineStart<=entry.timelineEnd){
        let valid=true,sum=0;const seen=new Set(),timeline=[];
        for(const day of entry.timeline){
          if(!validDay(day.date)||day.date<entry.timelineStart||day.date>entry.timelineEnd||seen.has(day.date)||!Number.isSafeInteger(day.visits)||day.visits<0){valid=false;break;}
          seen.add(day.date);sum+=day.visits;
          if(day.visits)timeline.push({date:day.date,visits:day.visits});
        }
        if(valid&&sum===entry.visits){
          periods[period][id].timeline=timeline.sort((a,b)=>a.date.localeCompare(b.date));
          periods[period][id].timelineStart=entry.timelineStart;
          periods[period][id].timelineEnd=entry.timelineEnd;
        }
      }
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
