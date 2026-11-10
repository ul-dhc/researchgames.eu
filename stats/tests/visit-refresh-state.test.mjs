import test from 'node:test';
import assert from 'node:assert/strict';
import {newestVisitSourceTime,visitRefreshOutcome} from '../visit-refresh-state.js';
const snapshot=(time,visits=5)=>({version:1,generatedAt:'2026-11-04T16:00:00Z',periods:{all:{landing:{fetchedAt:time,visits}}}});
test('a new download or generatedAt does not make old source data fresh',()=>{
 const old=snapshot('2026-11-04T12:46:55Z');
 assert.equal(visitRefreshOutcome(old,{...old,generatedAt:'2026-11-04T17:00:00Z'}),'unchanged');
});
test('new source data counts as refreshed even if visit totals are identical',()=>{
 assert.equal(visitRefreshOutcome(snapshot('2026-11-04T12:46:55Z'),snapshot('2026-11-04T16:00:00Z')),'newer');
});
test('network failure is not concealed by an older cached fallback',()=>{
 assert.equal(visitRefreshOutcome(snapshot('2026-11-04T16:00:00Z'),snapshot('2026-11-04T12:46:55Z'),true),'failed');
});
test('missing source dates remain unavailable and a cold initial source is newer',()=>{
 assert.equal(newestVisitSourceTime({periods:{}}),null);
 assert.equal(visitRefreshOutcome(null,{periods:{}}),'unavailable');
 assert.equal(visitRefreshOutcome(null,snapshot('2026-11-04T16:00:00Z')),'newer');
});

test('each source is compared independently, rather than only the newest timestamp',()=>{
 const previous={periods:{all:{landing:{fetchedAt:'2026-11-04T16:00:00Z'},'miklu-rezgis':{fetchedAt:'2026-11-04T12:00:00Z'}}}};
 const incoming={periods:{all:{landing:{fetchedAt:'2026-11-04T16:00:00Z'},'miklu-rezgis':{fetchedAt:'2026-11-04T15:00:00Z'}}}};
 assert.equal(visitRefreshOutcome(previous,incoming),'newer');
 assert.equal(visitRefreshOutcome(previous,incoming,false,'all',['landing']),'unchanged');
 assert.equal(visitRefreshOutcome(previous,incoming,false,'all',['miklu-rezgis']),'newer');
 assert.equal(visitRefreshOutcome(previous,incoming,false,'7d',['landing']),'unavailable');
});
