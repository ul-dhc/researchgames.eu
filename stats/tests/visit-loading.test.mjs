import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {normalizeVisits,mergeVisits,VISIT_PAGES,VISIT_PERIODS} from '../visits.js';
import {visitRefreshOutcome} from '../visit-refresh-state.js';
const source=(await readFile(new URL('../visits-ui.js',import.meta.url),'utf8'))
 .replace(/^import .*;\n/gm,'').replace('export function renderVisits','function renderVisits')
 .replaceAll('import.meta.url',JSON.stringify('https://researchgames.eu/stats/visits-ui.js'));
function snapshot(time,visits){
 const entry={fetchedAt:time,visits,start:'2026-10-01T00:00:00Z',end:'2026-11-11T00:00:00Z'};
 return normalizeVisits({version:1,generatedAt:time,periods:Object.fromEntries(VISIT_PERIODS.map(period=>[period,Object.fromEntries(Object.keys(VISIT_PAGES).map(id=>[id,entry]))]))});
}
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const response=data=>({ok:true,json:async()=>data});
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function boot(fetcher,cached=null){
 const saved=[];
 const context=vm.createContext({URL,Date,Intl,AbortSignal,normalizeVisits,mergeVisits,visitRefreshOutcome,VISIT_PAGES,VISIT_PERIODS,
  localStorage:{getItem:()=>JSON.stringify(cached),setItem:(key,value)=>saved.push(JSON.parse(value))},setInterval(){},
  document:{hidden:false,documentElement:{lang:'lv'},querySelectorAll:()=>[],getElementById:()=>null,addEventListener(){}},
  MutationObserver:class{observe(){}},fetch:fetcher});
 vm.runInContext(source,context);
 return {context,saved,state:()=>vm.runInContext('({model,visitsLoading,lastVisitCheck})',context)};
}
test('first visit displays fallback while the live server is still waiting',async()=>{
 const live=deferred(),old=snapshot('2026-11-04T10:00:00Z',12),fresh=snapshot('2026-11-10T10:00:00Z',27);
 const {state}=boot(url=>String(url).includes('raw.githubusercontent.com')?live.promise:Promise.resolve(response(old)));
 await settle();
 assert.equal(state().model.periods.all.landing.visits,12);
 assert.equal(state().visitsLoading,true);
 live.resolve(response(fresh));await settle();
 assert.equal(state().model.periods.all.landing.visits,27);
 assert.equal(state().visitsLoading,false);
});
test('fast live data renders without waiting for a slow fallback, which cannot roll it back',async()=>{
 const fallback=deferred(),fresh=snapshot('2026-11-10T10:00:00Z',27);
 const {state}=boot(url=>String(url).includes('raw.githubusercontent.com')?Promise.resolve(response(fresh)):fallback.promise);
 await settle();
 assert.equal(state().model.periods.all.landing.visits,27);
 assert.equal(state().visitsLoading,false);
 assert.ok(state().lastVisitCheck.at);
 fallback.resolve(response(snapshot('2026-11-04T10:00:00Z',12)));await settle();
 assert.equal(state().model.periods.all.landing.visits,27);
});
test('failed live check retains saved counts and records failure rather than freshness',async()=>{
 const old=snapshot('2026-11-04T10:00:00Z',12);
 const {state}=boot(async()=>{throw Error('offline');},old);
 await settle();
 assert.equal(state().model.periods.all.landing.visits,12);
 assert.equal(state().lastVisitCheck.failed,true);
 assert.equal(state().visitsLoading,false);
});
