import test from 'node:test';
import assert from 'node:assert/strict';
import {AUDIENCE_PATHS,AUDIENCE_DIMENSIONS,normalizeAudience,mergeAudience,distribution} from '../audience.js';
import {requestAudience,collectAudience} from '../scripts/update-audience.mjs';
const now=new Date('2026-11-03T18:00:00Z'),range={start:'2026-10-03T21:00:00Z',end:now.toISOString()};
const entry=(extra={})=>({rows:[{key:'LV',name:'Latvia',count:7}],...range,fetchedAt:now.toISOString(),...extra});
const snapshot=(extra={})=>({version:1,generatedAt:now.toISOString(),paths:AUDIENCE_PATHS,periods:{all:{locations:entry()}},...extra});
test('audience combines exactly the homepage and active game paths, excluding stats and UL',()=>{
 assert.ok(AUDIENCE_PATHS.includes('/'));assert.ok(AUDIENCE_PATHS.includes('/lv'));
 assert.ok(AUDIENCE_PATHS.includes('/games/muns-teirums'));assert.ok(AUDIENCE_PATHS.includes('/games/miklu-rezgis/berniem'));
 assert.ok(!AUDIENCE_PATHS.some(path=>/stats|LU107/i.test(path)));
 assert.throws(()=>normalizeAudience(snapshot({paths:['/']})),/scope/);
});
test('pagination uses the full exact allowlist and publishes only aggregate rows',async()=>{
 const calls=[];
 const rows=await requestAudience('locations',range,'test-only',async(url,options)=>{
  calls.push(url);assert.equal(options.headers.Authorization,'Bearer test-only');
  assert.deepEqual(url.searchParams.get('include_paths').split(','),AUDIENCE_PATHS);
  assert.equal(url.searchParams.get('path_by_name'),'true');assert.equal(url.searchParams.get('start'),range.start);
  return {ok:true,json:async()=>calls.length===1?{stats:[{id:'LV',name:'Latvia',count:7,ip:'private',session:'private'}],more:true}:{stats:[{id:'EE',name:'Estonia',count:2}],more:false}};
 });
 assert.equal(calls[1].searchParams.get('offset'),'1');
 assert.deepEqual(rows,[{key:'LV',name:'Latvia',count:7},{key:'EE',name:'Estonia',count:2}]);
});
test('screen grouping works when API provides an ID without a display name',async()=>{
 assert.deepEqual(await requestAudience('sizes',range,'test-only',async()=>({ok:true,json:async()=>({stats:[{id:'phone',count:11},{id:'unknown',count:0}],more:false})})),[{key:'phone',name:'phone',count:11},{key:'unknown',name:'unknown',count:0}]);
});
test('incomplete, duplicate and malformed API data cannot become a valid zero report',async()=>{
 for(const raw of [{stats:[],more:true},{stats:[{id:'LV',count:-1}],more:false},{stats:[{id:'LV',count:1},{id:'LV',count:2}],more:false},{stats:[{id:'LV',count:'7'}],more:false}]){
  await assert.rejects(requestAudience('locations',range,'test-only',async()=>({ok:true,json:async()=>raw})));
 }
});
test('failed categories retain their original dates and counts independently of successful updates',async()=>{
 const previous=normalizeAudience(snapshot());
 const {snapshot:result,failures}=await collectAudience(previous,async dimension=>{
  if(dimension==='locations')throw new Error('private network details');
  return [{key:'eng',name:'English',count:8}];
 },new Date('2026-11-04T12:00:00Z'));
 assert.equal(failures,4);assert.deepEqual(result.periods.all.locations,{...previous.periods.all.locations,failed:true});
 assert.equal(result.periods.all.languages.rows[0].count,8);
 assert.equal(result.periods.all.languages.fetchedAt,'2026-11-04T12:00:00.000Z');
 assert.equal(result.periods['7d'].locations,undefined);
});
test('snapshot validation strips private fields and rejects invalid counts and range dates',()=>{
 const raw=snapshot();raw.secret='private';raw.periods.all.locations.ip='private';raw.periods.all.locations.rows[0].userAgent='private';
 const result=normalizeAudience(raw);assert.ok(!JSON.stringify(result).includes('private'));
 raw.periods.all.locations.rows[0].count=Infinity;assert.equal(normalizeAudience(raw).periods.all.locations,undefined);
 assert.throws(()=>normalizeAudience(snapshot({generatedAt:'wrong'})));
});
test('older fallback cannot replace newer data and missing sections can still be filled',()=>{
 const previous=normalizeAudience(snapshot());
 const incoming=normalizeAudience(snapshot({generatedAt:'2026-11-02T18:00:00Z',periods:{all:{locations:entry({fetchedAt:'2026-11-02T18:00:00Z',rows:[]}),languages:entry()}}}));
 const merged=mergeAudience(previous,incoming);
 assert.equal(merged.periods.all.locations.rows[0].count,7);assert.ok(merged.periods.all.languages);
});
test('percentages include unknown values and zero rows never create division by zero',()=>{
 const rows=distribution([{key:'LV',name:'Latvia',count:3},{key:'unknown',name:'',count:1},{key:'EE',name:'Estonia',count:0}]);
 assert.equal(rows.length,2);assert.equal(rows[0].share,.75);assert.equal(rows[1].share,.25);assert.deepEqual(distribution([]),[]);
});
test('an empty successful response remains distinguishable from an unavailable category',async()=>{
 const {snapshot:result,failures}=await collectAudience(undefined,async()=>[],now);
 assert.equal(failures,0);for(const key of AUDIENCE_DIMENSIONS)assert.deepEqual(result.periods.all[key].rows,[]);
});
