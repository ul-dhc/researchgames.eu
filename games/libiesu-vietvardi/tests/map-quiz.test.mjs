import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import modes from '../mode-plans.js';
const source = readFileSync(new URL('../data.js', import.meta.url), 'utf8');
const pairs = vm.runInNewContext(`${source}; GAME_DATA.pairs`).map((pair, id) => ({ ...pair, id }));
let seed = 9183;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

test('map game has five unique questions, one target per difficulty level', () => {
  for (let game = 0; game < 100; game++) {
    const plan = modes.createPlan(pairs, 'map', random);
    assert.deepEqual(plan.map(question => question.length), [1, 1, 1, 1, 1]);
    assert.equal(new Set(plan.flat().map(pair => pair.id)).size, 5);
    assert.deepEqual(plan.flat().map(pair => pair.round).sort(), [1, 2, 3, 4, 5]);
  }
});

test('every target appears once among five distinct map points, separated for touch input', () => {
  for (const target of pairs) for (let sample = 0; sample < 20; sample++) {
    const choices = modes.createMapChoices(pairs, target, 5, random);
    assert.equal(choices.length, 5);
    assert.equal(choices.filter(choice => choice.id === target.id).length, 1);
    assert.equal(new Set(choices.map(choice => choice.id)).size, 5);
    for (let i = 0; i < choices.length; i++) for (let j = i + 1; j < choices.length; j++) {
      assert.ok(modes.distanceKm(choices[i], choices[j]) >= 75);
    }
  }
});
