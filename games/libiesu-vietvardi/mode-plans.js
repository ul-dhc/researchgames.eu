/* Shared by the browser and the selection tests. Original pair IDs stay stable. */
(function (root) {
  "use strict";
  const COAST_STOPS = ["Miķeļtornis", "Sīkrags", "Mazirbe", "Košrags", "Pitrags", "Saunags", "Vaide", "Kolka"];
  function shuffled(items, random = Math.random) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function distanceKm(a, b) {
    const rad = Math.PI / 180;
    const lat = (a.lat + b.lat) / 2 * rad;
    return Math.hypot((a.lat - b.lat) * 111.195, (a.lon - b.lon) * Math.cos(lat) * 111.195);
  }
  function createMapChoices(pairs, target, count = 5, random = Math.random) {
    let best = [target];
    for (const separation of [75, 50, 25, 1]) {
      for (let attempt = 0; attempt < 12; attempt++) {
        const choices = [target];
        const pool = shuffled(pairs.filter(pair => pair.id !== target.id), random);
        for (const pair of pool) {
          if (choices.length >= count) break;
          if (choices.every(chosen => distanceKm(chosen, pair) >= separation)) choices.push(pair);
        }
        if (choices.length === count) return shuffled(choices, random);
        if (choices.length > best.length) best = choices;
      }
    }
    return shuffled(best, random);
  }

  function createPlan(pairs, mode, random = Math.random) {
    if (mode === "map") return shuffled(createPlan(pairs, "five", random)[0], random).map(pair => [pair]);
    if (mode === "ten") {
      const pick = (level, count) => shuffled(pairs.filter(pair => pair.round === level), random).slice(0, count);
      return [
        shuffled([...pick(1, 2), ...pick(2, 2), ...pick(3, 1)], random),
        shuffled([...pick(4, 2), ...pick(5, 3)], random),
      ];
    }
    if (mode === "five") {
      const levels = [...new Set(pairs.map(pair => pair.round))].sort((a, b) => a - b);
      const pools = levels.map(level => shuffled(pairs.filter(pair => pair.round === level), random));
      return [shuffled(pools.map(pool => pool[0]), random)];
    }
    if (mode === "coast") {
      const route = COAST_STOPS.map(name => {
        const pair = pairs.find(pair => pair.lv === name);
        if (!pair) throw new Error(`Missing coastal place: ${name}`);
        return pair;
      });
      return [route.slice(0, 4), route.slice(4)];
    }
    return [...new Set(pairs.map(pair => pair.round))].sort((a, b) => a - b)
      .map(level => shuffled(pairs.filter(pair => pair.round === level), random).slice(0, 5));
  }
  const api = { createPlan, createMapChoices, distanceKm, COAST_STOPS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LivonianModes = api;
})(typeof window === "undefined" ? globalThis : window);
