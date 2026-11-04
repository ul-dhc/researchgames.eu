import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {freshnessSummary} from '../report-meta.js';
import {reportView} from '../overview-tabs.js';
import {buildTimelineSeries} from '../timeline.js';
test('a new overview defaults to game analytics while old visit links still open visits',()=>{
 assert.equal(reportView(''),'gameplay');assert.equal(reportView('?lang=en'),'gameplay');
 assert.equal(reportView('','#visits'),'visits');assert.equal(reportView('?view=visits'),'visits');
 assert.equal(reportView('?view=gameplay','#visits'),'gameplay');assert.equal(reportView('?view=invalid'),'gameplay');
});
test('freshness exposes the oldest and newest actual source times, stale and unavailable sources',()=>{
 const result=freshnessSummary([{name:'riddle',updatedAt:'2026-11-04T10:00:00Z'},{name:'livonian',updatedAt:'2026-11-03T23:00:00Z',stale:true},{name:'missing'}]);
 assert.equal(result.oldest,Date.parse('2026-11-03T23:00:00Z'));assert.equal(result.newest,Date.parse('2026-11-04T10:00:00Z'));assert.equal(result.missing,1);assert.equal(result.stale,1);
 assert.deepEqual(freshnessSummary([]),{oldest:null,newest:null,missing:0,stale:0});
});
test('an older gameplay snapshot never invents zero activity on newer days',()=>{
 const series=buildTimelineSeries([{name:'older',timeline:[{date:'2026-11-03',sessions:52}],throughDate:'2026-11-03'},{name:'current',timeline:[],throughDate:'2026-11-04'}],'7d','2026-11-04');
 assert.equal(series.games[0].values.at(-1),null);assert.equal(series.games[0].values.at(-2),52);assert.equal(series.games[1].values.at(-1),0);
 assert.equal(buildTimelineSeries([{timeline:[],throughDate:'2026-01-01'}],'7d','2026-11-04').games[0].values,null);
});
test('gameplay snapshot refresh bypasses old browser/CDN URLs and keeps the requested signal',async()=>{
 const app=await readFile(new URL('../app.js',import.meta.url),'utf8');
 const source=app.slice(app.indexOf('async function readSnapshot('),app.indexOf('function rememberSnapshot('));
 const requests=[],signal=new AbortController().signal;
 const context={URL,Date,location:{href:'https://researchgames.eu/stats/'},normalizeSnapshot:x=>x,games:[],fetch:async(url,options)=>{requests.push({url:String(url),options});return {ok:true,json:async()=>({version:1})};}};
 vm.runInNewContext(source,context);
 await context.readSnapshot('https://raw.githubusercontent.com/ul-dhc/researchgames.eu/analytics-data/stats.json',signal);
 assert.ok(new URL(requests[0].url).searchParams.has('t'));assert.equal(requests[0].options.signal,signal);assert.equal(requests[0].options.cache,'no-store');
});
