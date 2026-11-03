/* Rectangle layout shared by the map and regression tests. Dimensions are measured in the DOM. */
(function (root) {
  "use strict";
  function overlapArea(a, b) {
    return Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0))
      * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  }
  function coversPoint(box, point, radius = 12) {
    const dx = point.x - Math.max(box.x0, Math.min(point.x, box.x1));
    const dy = point.y - Math.max(box.y0, Math.min(point.y, box.y1));
    return dx * dx + dy * dy < radius * radius;
  }
  function layoutLabels(points, viewport, blocked = []) {
    const placed = [];
    const results = [];
    const ordered = points.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    for (const p of ordered) {
      const { w, h } = p;
      const gap = 16;
      const candidates = [
        { dx: gap, dy: -h / 2 }, { dx: -w - gap, dy: -h / 2 },
        { dx: -w / 2, dy: -h - gap }, { dx: -w / 2, dy: gap },
      ];
      const maxRadius = Math.hypot(viewport.x, viewport.y);
      for (let radius = 48; radius <= maxRadius; radius += 24) {
        for (let step = 0; step < 24; step++) {
          const angle = step / 24 * Math.PI * 2 - Math.PI / 2;
          candidates.push({ dx: Math.cos(angle) * radius - w / 2, dy: Math.sin(angle) * radius - h / 2 });
        }
      }
      const valid = candidates.map(c => {
        const box = { x0: p.x + c.dx, y0: p.y + c.dy, x1: p.x + c.dx + w, y1: p.y + c.dy + h };
        return { ...c, box };
      }).filter(c => c.box.x0 >= 8 && c.box.y0 >= 8 && c.box.x1 <= viewport.x - 8 && c.box.y1 <= viewport.y - 8
        // Every marker is protected, including markers whose labels have not been placed yet.
        && !points.some(point => coversPoint(c.box, point))
        && !blocked.some(box => overlapArea(c.box, box) > 0));
      const collides = c => placed.some(b => overlapArea(c.box, { x0: b.x0 - 5, y0: b.y0 - 5, x1: b.x1 + 5, y1: b.y1 + 5 }) > 0);
      let chosen = valid.find(c => !collides(c));
      if (!chosen) {
        chosen = valid.map(c => ({ ...c, score: placed.reduce((sum, box) => sum + overlapArea(c.box, box), 0) * 100
          + Math.hypot(c.dx + w / 2, c.dy + h / 2) })).sort((a, b) => a.score - b.score)[0];
      }
      // If the viewport cannot fit a safe label, retain the visible point and its hover tooltip.
      if (!chosen) continue;
      placed.push(chosen.box);
      results.push({ ...p, dx: chosen.dx, dy: chosen.dy, leader: true });
    }
    return results;
  }
  const api = { layoutLabels, coversPoint };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LivonianMapLabels = api;
})(typeof window === "undefined" ? globalThis : window);
