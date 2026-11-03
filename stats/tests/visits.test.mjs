import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeVisits,mergeVisits,visitRange,VISIT_GAMES,VISIT_PAGES} from '../visits.js';
import {collectVisits,requestVisits} from '../scripts/update-visits.mjs';
const now=new Date('2026-11-03T17:00:00Z');
test('Riga calendar windows include today and handle daylight-saving changes',()=>{
 assert.equal(visitRange('7d',now).start,'2026-10-26T22:00:00.000Z');
 assert.equal(visitRange('30d',now).start,'2026-10-03T21:00:00.000Z');
 assert.equal(visitRange('all',now).start,'1999-12-31T22:00:00.000Z');
 assert.throws(()=>visitRange('bogus',now));
});
test('collector excludes UL and preserves failed values with their original period and date',async()=>{
 assert.equal(VISIT_GAMES.lu107,undefined);
 const {snapshot}=await collectVisits(null,async()=>12,now);
 const {snapshot:failed,failures}=await collectVisits(snapshot,async()=>{throw new Error('offline');},new Date('2026-11-04T17:00:00Z'));
 assert.equal(failures,Object.keys(VISIT_PAGES).length*4);
 assert.deepEqual(failed.periods['7d']['miklu-rezgis'],{...snapshot.periods['7d']['miklu-rezgis'],failed:true});
 const {snapshot:missing}=await collectVisits(null,async()=>{throw new Error('no token');},now);
 assert.deepEqual(missing.periods.all,{});
});
test('validation strips non-public fields and rejects invalid counts without losing other games',async()=>{
 const {snapshot}=await collectVisits(null,async()=>0,now);
 snapshot.periods.all['miklu-rezgis'].token='secret';
 snapshot.periods.all['libiesu-vietvardi'].visits=-1;
 const safe=normalizeVisits(snapshot);
 assert.equal(safe.periods.all['miklu-rezgis'].visits,0);
 assert.equal(safe.periods.all['miklu-rezgis'].token,undefined);
 assert.equal(safe.periods.all['libiesu-vietvardi'],undefined);
});
test('exact paths, authentication and complete results; raw referrers and IDs do not enter output',async()=>{
 const requests=[];
 const fetcher=async(url,options)=>{
  requests.push({url,options});
  return {ok:true,json:async()=>({more:false,hits:[{path:url.searchParams.get('include_paths'),event:false,count:9,path_id:123,ref:'private'}]})};
 };
 assert.equal(await requestVisits(VISIT_GAMES['miklu-rezgis'],visitRange('all',now),'example',fetcher),18);
 assert.equal(requests.length,2);
 assert.equal(requests[0].options.headers.Authorization,'Bearer example');
 assert.equal(requests[0].url.searchParams.get('path_by_name'),'true');
 for(const raw of [{more:true,hits:[]},{more:false,hits:[{path:'/stats/',count:20}]},{more:false,hits:[{path:'/games/miklu-rezgis',event:true,count:20}]}]){
  await assert.rejects(requestVisits(['/games/miklu-rezgis'],visitRange('all',now),'example',async()=>({ok:true,json:async()=>raw})));
 }
 await assert.rejects(requestVisits(['/games/miklu-rezgis'],visitRange('all',now),''));
});

test('a transient API failure is retried before abandoning a game-period',async()=>{
 let calls=0;
 const fetcher=async url=>{calls++;return calls===1?{ok:false,status:502}:{ok:true,json:async()=>({more:false,hits:[{path:'/games/miklu-rezgis',count:17}]})};};
 assert.equal(await requestVisits(['/games/miklu-rezgis'],visitRange('all',now),'example',fetcher),17);
 assert.equal(calls,2);
});

test('an older fallback fills missing game-periods without replacing newer counts',async()=>{
 const {snapshot:old}=await collectVisits(null,async()=>12,now);
 const {snapshot:fresh}=await collectVisits(null,async()=>19,new Date('2026-11-04T17:00:00Z'));
 delete fresh.periods.all['miklu-rezgis'];
 const merged=mergeVisits(fresh,old);
 assert.equal(merged.periods.all['miklu-rezgis'].visits,12);
 assert.equal(merged.periods.all['libiesu-vietvardi'].visits,19);
 assert.equal(merged.periods['7d']['miklu-rezgis'].visits,19);
});

test('landing and active game visits stay separate, with UL excluded',async()=>{
 assert.deepEqual(VISIT_PAGES.landing,['/','/lv']);
 assert.deepEqual(VISIT_GAMES['muns-teirums'],['/games/muns-teirums']);
 assert.equal(VISIT_PAGES.lu107,undefined);
 const {snapshot}=await collectVisits(null,async paths=>paths.includes('/')?100:8,now);
 assert.equal(snapshot.periods.all.landing.visits,100);
 assert.equal(snapshot.periods.all['miklu-rezgis'].visits,8);
 assert.equal(snapshot.periods.all['muns-teirums'].visits,8);
});

test('browser refresh requests the public snapshot with a cache-busting URL',async()=>{
 const {snapshot}=await collectVisits(null,async()=>5,now);
 const requests=[];
 const source=(await readFile(new URL('../visits-ui.js',import.meta.url),'utf8'))
   .replace(/^import .*;\n/gm,'').replace('export function renderVisits','function renderVisits')
   .replaceAll('import.meta.url',JSON.stringify('https://researchgames.eu/stats/visits-ui.js'));
 const context={URL,Date,Intl,AbortSignal,normalizeVisits,mergeVisits,VISIT_PAGES,VISIT_PERIODS:['all','90d','30d','7d'],
   localStorage:{getItem:()=>null,setItem(){}},setInterval(){},
   document:{hidden:false,documentElement:{lang:'lv'},querySelectorAll:()=>[],addEventListener(){}},
   MutationObserver:class{observe(){}},
   fetch:async url=>{requests.push(String(url));return {ok:true,json:async()=>snapshot};}};
 vm.runInNewContext(source,context);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requests.length,1);
 const url=new URL(requests[0]);
 assert.equal(url.origin,'https://raw.githubusercontent.com');
 assert.ok(url.searchParams.has('t'));
});
