import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import modes from '../mode-plans.js';
const source = readFileSync(new URL('../data.js', import.meta.url), 'utf8');
const pairs = vm.runInNewContext(`${source}; GAME_DATA.pairs`).map((pair, id) => ({ ...pair, id }));

function seeded(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

test('five places always contains one unique place from each difficulty level', () => {
  const seen = new Set();
  const orders = new Set();
  const random = seeded(9471);
  for (let sample = 0; sample < 200; sample++) {
    const plan = modes.createPlan(pairs, 'five', random);
    assert.equal(plan.length, 1);
    assert.equal(plan[0].length, 5);
    assert.equal(new Set(plan[0].map(pair => pair.id)).size, 5);
    assert.deepEqual(plan[0].map(pair => pair.round).sort(), [1, 2, 3, 4, 5]);
    plan[0].forEach(pair => { seen.add(pair.id); assert.equal(pairs[pair.id], pair); });
    orders.add(plan[0].map(pair => pair.round).join(','));
  }
  assert.ok(seen.size > 40, 'sampling should cover the source pool');
  assert.ok(orders.size > 50, 'difficulty order should vary too');
});

test('medium game has ten distinct places and a strictly harder second round', () => {
  const random = seeded(36131);
  const seenGames = new Set();
  for (let sample = 0; sample < 200; sample++) {
    const plan = modes.createPlan(pairs, 'ten', random);
    assert.deepEqual(plan.map(round => round.length), [5, 5]);
    assert.equal(new Set(plan.flat().map(pair => pair.id)).size, 10);
    assert.deepEqual(plan[0].map(pair => pair.round).sort(), [1, 1, 2, 2, 3]);
    assert.deepEqual(plan[1].map(pair => pair.round).sort(), [4, 4, 5, 5, 5]);
    assert.ok(Math.min(...plan[1].map(pair => pair.round)) > Math.max(...plan[0].map(pair => pair.round)));
    const similarity = round => round.reduce((sum, pair) => sum + pair.sim, 0) / round.length;
    assert.ok(similarity(plan[1]) < similarity(plan[0]), 'second-round names should be less similar to Latvian');
    plan.flat().forEach(pair => assert.equal(pairs[pair.id], pair));
    seenGames.add(plan.flat().map(pair => pair.id).join(','));
  }
  assert.ok(seenGames.size > 190, 'replays should sample new sets and orders');
});

test('coast follows eight geographic stops across two four-place rounds', () => {
  const plan = modes.createPlan(pairs, 'coast');
  assert.deepEqual(plan.map(round => round.length), [4, 4]);
  assert.deepEqual(plan.flat().map(pair => pair.lv), modes.COAST_STOPS);
  assert.equal(new Set(plan.flat().map(pair => pair.id)).size, 8);
  for (let i = 1; i < plan.flat().length; i++) assert.ok(plan.flat()[i].lon > plan.flat()[i - 1].lon);
});

test('long game samples five unique places from each round without changing source data', () => {
  const snapshot = JSON.stringify(pairs);
  const seen = new Set();
  const plans = new Set();
  for (let seed = 1; seed <= 100; seed++) {
    const plan = modes.createPlan(pairs, 'full', seeded(seed));
    assert.deepEqual(plan.map(round => round.length), [5, 5, 5, 5, 5]);
    assert.equal(new Set(plan.flat().map(pair => pair.id)).size, 25);
    plan.forEach((round, index) => round.forEach(pair => {
      assert.equal(pair.round, index + 1);
      assert.equal(pairs[pair.id], pair);
      seen.add(pair.id);
    }));
    plans.add(plan.flat().map(pair => pair.id).join(','));
  }
  assert.equal(seen.size, pairs.length, 'all places remain available for selection');
  assert.ok(plans.size > 90, 'new sessions should produce varied selections');
  assert.equal(JSON.stringify(pairs), snapshot);
});
