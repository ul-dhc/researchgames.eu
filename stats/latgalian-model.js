export const PLANT_GAMES=[{id:'muns-teirums',name:'Muns teirums',url:'/games/muns-teirums/',pairs:[6,8,10]}];
export const PLANT_PERIODS=['all','30d','7d'];
export const ACTIONS=['start','complete','skip'];
export const VARIANTS=PLANT_GAMES.flatMap(game=>game.pairs.flatMap(pairs=>[true,false].flatMap(time=>[true,false].map(points=>({game:game.id,pairs,time,points,key:`${pairs}-${time?'time':'untimed'}-${points?'points':'unscored'}`})))));
export const eventPath=(action,variant)=>`rg-plant-v1-${variant.game}-${action}-${variant.key}`;
const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(Date.parse(d))&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d;
export function normalizePlants(raw){
 if(raw?.version!==1||!Number.isFinite(Date.parse(raw.generatedAt)))throw new Error('Invalid plant snapshot');
 const periods={};
 for(const period of PLANT_PERIODS){
  const entry=raw.periods?.[period];if(!entry)continue;
  if(!Number.isFinite(Date.parse(entry.fetchedAt))||!Number.isFinite(Date.parse(entry.start))||!Number.isFinite(Date.parse(entry.end))||Date.parse(entry.start)>=Date.parse(entry.end))throw new Error('Invalid range');
  if(!Array.isArray(entry.events)||entry.events.length!==VARIANTS.length*ACTIONS.length)throw new Error('Incomplete events');
  const seen=new Set();
  const events=entry.events.map(event=>{
   const variant=VARIANTS.find(v=>v.game===event.game&&v.key===event.variant);
   const key=event.game+event.action+event.variant;
   if(!variant||!ACTIONS.includes(event.action)||seen.has(key)||!Number.isSafeInteger(event.count)||event.count<0||!Array.isArray(event.timeline))throw new Error('Invalid event');
   seen.add(key);const days=new Set();let sum=0;
   const timeline=event.timeline.map(day=>{if(!validDate(day.date)||days.has(day.date)||!Number.isSafeInteger(day.count)||day.count<0)throw new Error('Invalid day');days.add(day.date);sum+=day.count;return {date:day.date,count:day.count};});
   if(sum!==event.count)throw new Error('Invalid sum');
   return {game:variant.game,variant:variant.key,action:event.action,count:event.count,timeline};
  });
  periods[period]={start:entry.start,end:entry.end,fetchedAt:entry.fetchedAt,failed:entry.failed===true,events};
 }
 return {version:1,generatedAt:raw.generatedAt,periods};
}
export function selectPlants(entry,{game='all',pairs='all',mode='all'}={}){
 if(!entry)return null;
 const variants=VARIANTS.filter(v=>(game==='all'||v.game===game)&&(pairs==='all'||v.pairs===Number(pairs))&&(mode==='all'||mode===`${v.time?'time':'untimed'}-${v.points?'points':'unscored'}`));
 const events=entry.events.filter(e=>variants.some(v=>v.game===e.game&&v.key===e.variant));
 const counts=Object.fromEntries(ACTIONS.map(action=>[action,events.filter(e=>e.action===action).reduce((n,e)=>n+e.count,0)]));
 const timeline=Object.fromEntries(ACTIONS.map(action=>{const days=new Map();for(const e of events.filter(e=>e.action===action))for(const d of e.timeline)days.set(d.date,(days.get(d.date)||0)+d.count);return [action,[...days].sort(([a],[b])=>a.localeCompare(b)).map(([date,sessions])=>({date,sessions}))];}));
 return {counts,timeline};
}
