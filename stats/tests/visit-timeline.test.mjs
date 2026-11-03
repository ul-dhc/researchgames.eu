import test from 'node:test';
import assert from 'node:assert/strict';
import {requestVisitSeries,collectVisits} from '../scripts/update-visits.mjs';
import {normalizeVisits,VISIT_PAGES,visitRange} from '../visits.js';
import {buildVisitTimeline} from '../visit-timeline.js';
const now=new Date('2026-11-03T18:00:00Z');
const range=visitRange('7d',now);
const response=(path,count,stats)=>({ok:true,json:async()=>({more:false,hits:[{path,event:false,count,path_id:999,stats}]})});
test('daily visits merge main and children pages without losing overlapping dates or exporting raw metadata',async()=>{
 const result=await requestVisitSeries(['/games/miklu-rezgis','/games/miklu-rezgis/berniem'],range,'test-only',async url=>{
  const path=url.searchParams.get('include_paths');
  return response(path,3,[{day:'2026-10-27',daily:path.endsWith('berniem')?1:2,hourly:['private']},{day:'2026-11-03',daily:path.endsWith('berniem')?2:1,session:'private'}]);
 });
 assert.deepEqual(result,{visits:6,timelineStart:'2026-10-27',timelineEnd:'2026-11-03',timeline:[{date:'2026-10-27',visits:3},{date:'2026-11-03',visits:3}]});
 assert.ok(!JSON.stringify(result).includes('private'));
});
test('missing history is distinct from zero history and malformed daily totals are rejected',async()=>{
 const path='/games/muns-teirums';
 const missing=await requestVisitSeries([path],range,'test-only',async()=>response(path,5,undefined));
 assert.deepEqual(missing,{visits:5});
 const empty=await requestVisitSeries([path],range,'test-only',async()=>({ok:true,json:async()=>({hits:[],more:false})}));
 assert.deepEqual(empty.timeline,[]);assert.equal(empty.visits,0);
 for(const stats of [[{day:'2026-11-03',daily:4}],[{day:'2026-02-30',daily:5}],[{day:'2026-11-03',daily:-5}],[{day:'2026-11-03',daily:2},{day:'2026-11-03',daily:3}]]){
  await assert.rejects(requestVisitSeries([path],range,'test-only',async()=>response(path,5,stats)),/daily/);
 }
});
async function fixture(){
 return (await collectVisits(null,async paths=>({visits:paths.includes('/')?3:2,timelineStart:'2026-10-27',timelineEnd:'2026-11-03',timeline:[{date:'2026-11-03',visits:paths.includes('/')?3:2}]}),now)).snapshot;
}
const names=Object.fromEntries(Object.keys(VISIT_PAGES).map(id=>[id,id]));
test('shared calendar and total line include landing and every active game exactly once',async()=>{
 const snapshot=await fixture(),entries=snapshot.periods['7d'];
 const series=buildVisitTimeline(entries,'7d',names,'Total');
 assert.equal(series.dates.length,8);assert.equal(series.dates[0],'2026-10-27');
 assert.deepEqual(series.games.map(game=>game.id),['total',...Object.keys(VISIT_PAGES)]);
 assert.equal(series.games[0].values.at(-1),11);
 for(const game of series.games.slice(1))assert.equal(game.values.reduce((a,b)=>a+b,0),entries[game.id].visits);
 assert.deepEqual(series.games[1].values,[0,0,0,0,0,0,0,3]);
});
test('all-time graph starts at the first recorded visit rather than the API history boundary',async()=>{
 const snapshot=await fixture(),entries=snapshot.periods.all;
 for(const entry of Object.values(entries))entry.timelineStart='1999-12-31';
 const series=buildVisitTimeline(entries,'all',names,'Total');
 assert.deepEqual(series.dates,['2026-11-03']);assert.equal(series.games[0].values[0],11);
});
test('missing or older-day histories never become zero lines or an incomplete total',async()=>{
 const snapshot=await fixture(),entries=snapshot.periods['7d'];
 delete entries.landing.timeline;
 entries['muns-teirums'].timelineEnd='2026-11-02';
 const series=buildVisitTimeline(entries,'7d',names,'Total');
 assert.equal(series.games.find(game=>game.id==='total').values,null);
 assert.equal(series.games.find(game=>game.id==='landing').values,null);
 assert.equal(series.games.find(game=>game.id==='muns-teirums').values,null);
 assert.equal(series.games.find(game=>game.id==='miklu-rezgis').values.at(-1),2);
});
test('validation keeps count-only compatibility and strips mismatching or private daily fields',async()=>{
 const raw=await fixture();raw.periods.all.landing.timeline[0].ip='private';
 let result=normalizeVisits(raw);assert.ok(!JSON.stringify(result).includes('private'));
 raw.periods.all.landing.timeline[0].visits=4;
 result=normalizeVisits(raw);assert.equal(result.periods.all.landing.visits,3);assert.equal(result.periods.all.landing.timeline,undefined);
 delete raw.periods['7d'].landing.timeline;result=normalizeVisits(raw);
 assert.equal(result.periods['7d'].landing.visits,3);
 assert.deepEqual(buildVisitTimeline({},'all',names,'Total'),{dates:[],games:[]});
});
test('daily reporting dates are preserved, including a partial boundary day',async()=>{
 const raw=await fixture(),entry=raw.periods['7d'].landing;
 entry.timelineStart='2026-10-26';entry.timeline=[{date:'2026-10-26',visits:1},{date:'2026-11-03',visits:2}];
 const series=buildVisitTimeline(normalizeVisits(raw).periods['7d'],'7d',names,'Total');
 assert.equal(series.dates[0],'2026-10-26');assert.equal(series.games[1].values.reduce((a,b)=>a+b,0),3);
});
