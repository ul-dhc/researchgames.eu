import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPlantAnalytics} from '../analytics.mjs';
test('first card starts once; final match completes once; replays count independently',()=>{
 const events=[],analytics=createPlantAnalytics(e=>events.push(e));
 analytics.reset(8,{time:true,points:true});analytics.complete();assert.equal(events.length,0);
 analytics.start();analytics.start();analytics.complete();analytics.complete();analytics.skip();
 assert.deepEqual(events.map(e=>e.path),['rg-plant-v1-muns-teirums-start-8-time-points','rg-plant-v1-muns-teirums-complete-8-time-points']);
 analytics.reset(6,{time:false,points:false});analytics.start();analytics.complete();
 assert.equal(events.length,4);assert.match(events[2].path,/-6-untimed-unscored$/);
 assert.ok(events.every(e=>e.event&&e.no_session&&e.referrer===''));
});
test('skipping directly from preview does not invent a started or completed game',()=>{
 const events=[],analytics=createPlantAnalytics(e=>events.push(e));analytics.reset(10,{time:false,points:true});analytics.skip();analytics.skip();analytics.start();analytics.complete();
 assert.deepEqual(events.map(e=>e.path),['rg-plant-v1-muns-teirums-skip-10-untimed-points']);
});
test('tracking errors cannot interrupt a game',()=>{const a=createPlantAnalytics(()=>{throw Error();});a.reset(8,{time:true,points:true});assert.doesNotThrow(()=>{a.start();a.complete();});});
