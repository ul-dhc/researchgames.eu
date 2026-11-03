import test from 'node:test';
import assert from 'node:assert/strict';
import scoring from '../score-rules.js';

test('correct answers add ten; errors deduct only points actually available', () => {
  assert.deepEqual(scoring.answer(0, false), { score: 0, delta: 0 });
  assert.deepEqual(scoring.answer(1, false), { score: 0, delta: -1 });
  assert.deepEqual(scoring.answer(2, false), { score: 0, delta: -2 });
  assert.deepEqual(scoring.answer(10, false), { score: 8, delta: -2 });
  assert.deepEqual(scoring.answer(8, true), { score: 18, delta: 10 });
});

test('perfect games have the documented maximum for every variant', () => {
  for (const [mode, count, maximum] of [['five', 5, 50], ['ten', 10, 100], ['map', 5, 50], ['full', 25, 430]]) {
    let score = 0;
    for (let n = 0; n < count; n++) score = scoring.answer(score, true).score;
    assert.equal(scoring.finish(score, 60_000, mode).score, maximum);
  }
});

test('only the long game receives a time adjustment', () => {
  for (const mode of ['five', 'ten', 'map']) {
    for (const elapsed of [0, 330_000, 1_000_000]) assert.deepEqual(scoring.finish(48, elapsed, mode), { score: 48, bonus: 0 });
  }
});

test('long game time bonus rounds whole points and respects both caps and target', () => {
  for (const [elapsedMs, bonus] of [[0, 180], [210_000, 180], [329_000, 2], [330_000, 0], [331_000, -1], [410_000, -120], [1_000_000, -120]]) {
    assert.deepEqual(scoring.finish(250, elapsedMs, 'full'), { score: 250 + bonus, bonus });
  }
});

test('time penalty never produces a negative total or reports a deduction beyond the score', () => {
  assert.deepEqual(scoring.finish(30, 1_000_000, 'full'), { score: 0, bonus: -30 });
  assert.deepEqual(scoring.finish(0, 1_000_000, 'full'), { score: 0, bonus: 0 });
});

test('mistakes at zero still count in accuracy; round deltas display the correct sign', () => {
  assert.equal(scoring.accuracy(5, 7), 71);
  assert.equal(scoring.accuracy(5, 10), 50);
  assert.equal(scoring.accuracy(5, 5), 100);
  assert.equal(scoring.signed(-8), '-8');
  assert.equal(scoring.signed(0), '0');
  assert.equal(scoring.signed(50), '+50');
});

test('round deltas plus effective time adjustment reconcile with the final total', () => {
  let score = 0;
  const rounds = [];
  for (const answers of [[true, true, true, true, true], [...Array(30).fill(false), true, true, true, true, true], [true, true, false, true, true, true], Array(5).fill(true), Array(5).fill(true)]) {
    const start = score;
    for (const correct of answers) score = scoring.answer(score, correct).score;
    rounds.push(score - start);
  }
  const final = scoring.finish(score, 500_000, 'full');
  assert.equal(rounds.reduce((sum, value) => sum + value, 0) + final.bonus, final.score);
  assert.ok(final.score >= 0);
});
