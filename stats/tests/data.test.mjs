import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSummary, combineSummaries } from '../data.js';
const sample = (sessions = 3, completed = 2) => ({ok:true,generatedAt:'2026-09-22T00:00:00Z',overview:{sessions,completed},timeline:[{date:'2026-09-22',sessions}]});
test('combines games by day without averaging incomparable rates or scores',()=>{
 const result=combineSummaries([normalizeSummary(sample()),normalizeSummary(sample(10,1))]);
 assert.deepEqual(result,{sessions:13,completed:3,timeline:[{date:'2026-09-22',sessions:13}]});
});
test('missing optional metrics stay missing, zero activity remains valid',()=>{
 const result=normalizeSummary(sample(0,0));
 assert.equal(result.overview.averageDurationMs,null);
 assert.equal(result.overview.sessions,0);
});
test('rejects invalid counts and inconsistent timelines rather than silently publishing zeros',()=>{
 assert.throws(()=>normalizeSummary(sample(3,4)));
 assert.throws(()=>normalizeSummary(sample(-1,0)));
 const data=sample();data.timeline[0].sessions=100;
 assert.throws(()=>normalizeSummary(data));
 assert.throws(()=>normalizeSummary({ok:false}));
});
test('only exposes aggregate fields',()=>{
 const data=sample();data.comments=['private'];data.sessions=[{id:'private'}];
 assert.ok(!JSON.stringify(normalizeSummary(data)).includes('private'));
});

test('recovers from a transient Google error page',async()=>{
 const {fetchSummary}=await import('../data.js');
 let calls=0;
 const data=await fetchSummary('https://example.com/exec','7d',new AbortController().signal,async url=>{
  assert.equal(url.searchParams.get('period'),'7d');
  if (++calls===1) return {ok:false,status:404};
  return {ok:true,json:async()=>sample()};
 });
 assert.equal(calls,2);assert.equal(data.overview.sessions,3);
});
test('does not retry a cancelled period request',async()=>{
 const {fetchSummary}=await import('../data.js');
 const controller=new AbortController();let calls=0;
 await assert.rejects(fetchSummary('https://example.com/exec','7d',controller.signal,async()=>{
  calls++;controller.abort();throw new Error('aborted');
 }));
 assert.equal(calls,1);
});
