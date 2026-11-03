import test from 'node:test';
import assert from 'node:assert/strict';
import layout from '../map-label-layout.js';
const { layoutLabels, coversPoint } = layout;
const boxOf = p => ({ x0: p.x + p.dx, y0: p.y + p.dy, x1: p.x + p.dx + p.w, y1: p.y + p.dy + p.h });
function checkMarkers(points, labels, viewport) {
  assert.equal(labels.length, points.length, 'each place should get a label when there is room');
  for (const label of labels) {
    const box = boxOf(label);
    assert.ok(box.x0 >= 8 && box.y0 >= 8 && box.x1 <= viewport.x - 8 && box.y1 <= viewport.y - 8);
    for (const point of points) assert.equal(coversPoint(box, point), false, `label ${label.id} covers point ${point.id}`);
  }
}

test('the Sabile point stays visible below nearby Piltene and Puze labels', () => {
  const viewport = { x: 907, y: 647 };
  const points = [
    { id: 'Evazi', x: 343, y: 248, w: 90, h: 36 },
    { id: 'Puze', x: 291, y: 307, w: 106, h: 36 },
    { id: 'Piltene', x: 261, y: 324, w: 116, h: 36 },
    { id: 'Sabile', x: 343, y: 359, w: 108, h: 36 },
    { id: 'Cesis', x: 588, y: 309, w: 106, h: 36 },
  ];
  checkMarkers(points, layoutLabels(points, viewport), viewport);
});

test('clustered five- and ten-place maps protect every marker at phone and desktop sizes', () => {
  for (const viewport of [{ x: 360, y: 380 }, { x: 746, y: 600 }]) {
    for (const count of [5, 10]) {
      for (const large of [false, true]) {
        const points = Array.from({ length: count }, (_, id) => ({ id,
          x: viewport.x * .5 + (id % 3 - 1) * 12,
          y: viewport.y * .5 + (Math.floor(id / 3) - 1) * 12,
          w: large ? 165 : 140, h: large ? 40 : 32,
        }));
        checkMarkers(points, layoutLabels(points, viewport), viewport);
      }
    }
  }
});

test('fallback placement never sacrifices a point, even if the map cannot fit a label', () => {
  const points = [{ id: 1, x: 40, y: 30, w: 150, h: 30 }];
  assert.deepEqual(layoutLabels(points, { x: 80, y: 60 }), []);
});

test('zoom controls and attribution stay clear of labels', () => {
  const viewport = { x: 360, y: 380 };
  const blocked = [{ x0: 290, y0: 280, x1: 360, y1: 380 }];
  const points = [{ id: 1, x: 280, y: 300, w: 120, h: 36 }];
  const labels = layoutLabels(points, viewport, blocked);
  checkMarkers(points, labels, viewport);
  const box = boxOf(labels[0]);
  assert.ok(box.x1 <= 290 || box.y1 <= 280 || box.y0 >= 380);
});
