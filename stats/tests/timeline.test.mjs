import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTimelineSeries } from '../timeline.js';

test('aligns games on a shared calendar and fills inactive days with zeros', () => {
  const result = buildTimelineSeries([
    {id:'a',timeline:[{date:'2026-09-20',sessions:2},{date:'2026-09-22',sessions:5}]},
    {id:'b',timeline:[{date:'2026-09-21',sessions:3}]},
    {id:'c'}
  ], 'all', '2026-09-22');
  assert.deepEqual(result.dates,['2026-09-20','2026-09-21','2026-09-22']);
  assert.deepEqual(result.games[0].values,[2,0,5]);
  assert.deepEqual(result.games[1].values,[0,3,0]);
  assert.equal(result.games[2].values,null);
});
test('includes partial first day of rolling period and excludes older records', () => {
  const result=buildTimelineSeries([{timeline:[{date:'2026-09-14',sessions:9},{date:'2026-09-15',sessions:2}]}],'7d','2026-09-22');
  assert.equal(result.dates.length,8);
  assert.equal(result.dates[0],'2026-09-15');
  assert.equal(result.games[0].values.reduce((a,b)=>a+b,0),2);
});
test('empty available sources still have a zero line throughout a period', () => {
  const result=buildTimelineSeries([{timeline:[]}],'30d','2026-03-30');
  assert.equal(result.dates.length,31);
  assert.equal(result.dates.at(-1),'2026-03-30');
  assert.ok(result.games[0].values.every(n=>n===0));
  assert.deepEqual(buildTimelineSeries([{timeline:[]}],'all','2026-09-22').dates,['2026-09-22']);
});
