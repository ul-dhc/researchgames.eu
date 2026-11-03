import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizePlants,selectPlants,VARIANTS,eventPath} from '../latgalian-model.js';
import {collectPlants} from '../scripts/update-latgalian.mjs';
import {requestVisitSeries} from '../scripts/update-visits.mjs';
import {buildVisitTimeline} from '../visit-timeline.js';
const now=new Date('2026-11-03T12:00:00Z');
const result=()=>({visits:2,timeline:[{date:'2026-11-03',visits:2}]});
test('collects every allowlisted variant and period and selects without mixing modes',async()=>{
 const {snapshot,failures}=await collectPlants(null,async path=>{assert.ok(VARIANTS.some(v=>['start','complete','skip'].some(a=>eventPath(a,v)===path)));return result();},now);
 assert.equal(failures,0);assert.equal(snapshot.periods['7d'].events.length,36);
 assert.equal(selectPlants(snapshot.periods['7d']).counts.start,24);
 assert.equal(selectPlants(snapshot.periods['7d'],{pairs:'6',mode:'time-points'}).counts.complete,2);
 assert.equal(selectPlants(snapshot.periods['7d'],{pairs:'6'}).counts.start,8);
 const raw=structuredClone(snapshot);raw.periods['7d'].events[0].secret='private';
 assert.ok(!JSON.stringify(normalizePlants(raw)).includes('private'));
 raw.periods['7d'].events[0].timeline[0].count=3;assert.throws(()=>normalizePlants(raw));
});
test('failed period retains its original data and timestamp; cold failures remain unavailable',async()=>{
 const good=(await collectPlants(null,async()=>result(),now)).snapshot;
 const later=new Date('2026-11-04T12:00:00Z');const bad=async()=>{throw Error('offline');};
 const {snapshot,failures}=await collectPlants(good,bad,later);assert.equal(failures,3);
 assert.equal(snapshot.periods['7d'].fetchedAt,now.toISOString());assert.equal(snapshot.periods['7d'].failed,true);
 assert.deepEqual((await collectPlants(null,bad,later)).snapshot.periods,{});
});
test('event parser accepts only expected events; visits still reject them',async()=>{
 const path=eventPath('start',VARIANTS[0]);const fetcher=async()=>({ok:true,json:async()=>({hits:[{path,event:true,count:2,stats:[{day:'2026-11-03',daily:2}]}],more:false})});
 const range={start:'2026-11-03T00:00:00Z',end:now.toISOString()};
 assert.equal((await requestVisitSeries([path],range,'test',fetcher,true)).visits,2);
 await assert.rejects(requestVisitSeries([path],range,'test',fetcher));
});
test('game-specific visit chart excludes every other game and the landing page',()=>{
 const entry=n=>({timelineStart:'2026-11-01',timelineEnd:'2026-11-03',timeline:[{date:'2026-11-03',visits:n}]});
 const series=buildVisitTimeline({'muns-teirums':entry(4),landing:entry(99)},'7d',{'muns-teirums':'Muns teirums'},'Total',['muns-teirums']);
 assert.equal(series.games.length,1);assert.deepEqual(series.games[0].values,[0,0,4]);
});
