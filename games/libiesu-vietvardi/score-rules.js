/* Shared scoring rules for the game and its tests. */
(function (root) {
  "use strict";
  const POINTS_CORRECT = 10;
  const WRONG_PENALTY = 2;
  const TIME_TARGET_SECONDS = 330;
  const TIME_BONUS_PER_SECOND = 1.5;
  const TIME_BONUS_MAX = 180;
  const TIME_BONUS_MIN = -120;
  function answer(score, correct) {
    const next = Math.max(0, score + (correct ? POINTS_CORRECT : -WRONG_PENALTY));
    return { score: next, delta: next - score };
  }
  function finish(score, elapsedMs, mode) {
    const requested = mode === "full"
      ? Math.max(TIME_BONUS_MIN, Math.min(TIME_BONUS_MAX,
        Math.round((TIME_TARGET_SECONDS - elapsedMs / 1000) * TIME_BONUS_PER_SECOND)))
      : 0;
    const next = Math.max(0, score + requested);
    return { score: next, bonus: next - score };
  }
  function accuracy(correct, attempts) {
    return attempts ? Math.round(correct / attempts * 100) : 100;
  }
  function signed(value) { return value > 0 ? `+${value}` : String(value); }
  const api = { answer, finish, accuracy, signed };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LivonianScoring = api;
})(typeof window === "undefined" ? globalThis : window);
