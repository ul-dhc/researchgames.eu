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

test('older downloaded snapshots cannot replace newer source data; missing games survive',async()=>{
 const {mergeSnapshots}=await import('../snapshot.js');
 const {snapshot:old}=await collectSnapshot(null,{a:'a',b:'b'},async()=>({...data(2),generatedAt:'2026-09-28T08:30:00Z'}));
 const {snapshot:recent}=await collectSnapshot(null,{a:'a'},async()=>({...data(9),generatedAt:'2026-09-28T13:30:00Z'}));
 old.generatedAt='2026-09-28T17:00:00Z';
 const merged=mergeSnapshots(recent,old);
 assert.equal(merged.periods.all.a.data.overview.sessions,9);
 assert.equal(merged.periods.all.b.data.overview.sessions,2);
 assert.equal(mergeSnapshots(merged,recent).periods.all.b.data.overview.sessions,2);
 // A genuinely newer correction may reduce a count.
 recent.periods.all.a.data={...data(1),generatedAt:'2026-09-28T18:00:00Z'};
 assert.equal(mergeSnapshots(merged,recent).periods.all.a.data.overview.sessions,1);
});
test('collector rejects successful but older source responses',async()=>{
 const {snapshot:previous}=await collectSnapshot(null,{a:'a'},async()=>({...data(9),generatedAt:'2026-09-28T13:30:00Z'}));
 const {snapshot,failures}=await collectSnapshot(previous,{a:'a'},async()=>({...data(2),generatedAt:'2026-09-28T08:30:00Z'}));
 assert.equal(failures,3);
 assert.equal(snapshot.periods.all.a.data.overview.sessions,9);
 assert.equal(snapshot.periods.all.a.fetchedAt,previous.periods.all.a.fetchedAt);
 assert.equal(snapshot.periods.all.a.failed,true);
});

test('background recovery only requests stale or missing sources and preserves data on failures',async()=>{
 const {refreshStaleSources,mergeSnapshots}=await import('../snapshot.js');
 let {snapshot}=await collectSnapshot(null,{a:'a',b:'b'},async()=>data(4));
 snapshot.periods.all.a.data.generatedAt='2026-09-28T08:30:00Z';
 const now=Date.parse(snapshot.periods.all.b.data.generatedAt);
 const calls=[];
 await refreshStaleSources(snapshot,'all',{a:'a',b:'b',c:'c'},async url=>{calls.push(url);if(url==='c')throw Error('offline');return data(8);},new AbortController().signal,incoming=>{snapshot=mergeSnapshots(snapshot,incoming);},now);
 assert.deepEqual(calls.sort(),['a','c']);
 assert.equal(snapshot.periods.all.a.data.overview.sessions,8);
 assert.equal(snapshot.periods.all.b.data.overview.sessions,4);
 assert.equal(snapshot.periods.all.c,undefined);
 assert.equal(snapshot.periods['7d'].a.data.overview.sessions,4);
});
