import test from 'node:test';
import assert from 'node:assert/strict';
import {collectSnapshot} from '../scripts/update-snapshot.mjs';
import {normalizeSnapshot,snapshotState,PERIODS} from '../snapshot.js';
const data=n=>({generatedAt:new Date().toISOString(),overview:{sessions:n,completed:0},timeline:[{date:'2026-09-28',sessions:n}]});
test('collector preserves only failed source-period pairs and their original timestamps',async()=>{
 const initial=(await collectSnapshot(null,{a:'a',b:'b'},async()=>data(2))).snapshot;
 const previousTime=initial.periods['7d'].a.fetchedAt;
 const {snapshot,failures}=await collectSnapshot(initial,{a:'a',b:'b'},async(url,period)=>{if(url==='a'&&period==='7d')throw Error('offline');return data(4);});
 assert.equal(failures,1);
 assert.equal(snapshot.periods['7d'].a.data.overview.sessions,2);
 assert.equal(snapshot.periods['7d'].a.fetchedAt,previousTime);
 assert.equal(snapshot.periods['7d'].a.failed,true);
 assert.equal(snapshot.periods.all.a.data.overview.sessions,4);
 assert.equal(snapshot.periods['7d'].b.data.overview.sessions,4);
});
test('all periods switch locally and stale snapshots remain honestly labeled',async()=>{
 const {snapshot}=await collectSnapshot(null,{a:'a'},async(url,period)=>data(PERIODS.indexOf(period)+1));
 assert.equal(snapshotState(snapshot,'all').get('a').data.overview.sessions,1);
 assert.equal(snapshotState(snapshot,'7d').get('a').data.overview.sessions,3);
 assert.equal(snapshotState(snapshot,'all',Date.now()+20*60000).get('a').cached,true);
});
test('snapshot validation strips raw fields and tolerates isolated corrupt entries',async()=>{
 const {snapshot}=await collectSnapshot(null,{a:'a',b:'b'},async()=>data(2));
 snapshot.periods.all.a.data.comments=['private'];
 snapshot.periods.all.b.data.timeline=[];
 const safe=normalizeSnapshot(snapshot,['a','b']);
 assert.ok(!JSON.stringify(safe).includes('private'));
 assert.equal(safe.periods.all.b,undefined);
 assert.throws(()=>normalizeSnapshot({version:1,generatedAt:new Date().toISOString(),periods:{}},['a']));
});
