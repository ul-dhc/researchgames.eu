import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchStats,newestStats} from '../../games/LU107/stats/data.js';
const fixture={ok:true,generatedAt:'2026-09-28T13:30:00Z',overview:{sessions:9},timeline:[],funnel:[],rounds:[],languages:[],mechanics:[],questions:[]};
test('LU retries a temporary Google error without forcing expensive recalculation',async()=>{
 const urls=[];
 const value=await fetchStats('https://example.invalid/exec','7d',new AbortController().signal,async url=>{
  urls.push(String(url));
  return urls.length===1?{ok:false,status:503}:{ok:true,json:async()=>fixture};
 });
 assert.equal(value.overview.sessions,9);
 assert.equal(urls.length,2);
 assert.ok(urls.every(url=>!url.includes('force=')));
 assert.notEqual(urls[0],urls[1]);
});
test('LU preserves newer cached data and does not retry cancelled requests',async()=>{
 assert.equal(newestStats(fixture,{...fixture,generatedAt:'2026-09-28T08:30:00Z'}),fixture);
 const controller=new AbortController();let calls=0;
 await assert.rejects(fetchStats('https://example.invalid','all',controller.signal,async()=>{calls++;controller.abort();throw Error('cancelled');}));
 assert.equal(calls,1);
});
