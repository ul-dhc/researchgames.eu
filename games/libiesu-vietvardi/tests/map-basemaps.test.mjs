import test from 'node:test';
import assert from 'node:assert/strict';
import basemaps from '../map-basemaps.js';

test('map quiz uses genuinely unlabelled geographic tiles in both themes', () => {
  assert.equal(basemaps.style('light', 'map'), 'light_nolabels');
  assert.equal(basemaps.style('dark', 'map'), 'dark_nolabels');
});

test('other modes retain labels while both themes use neutral basemap colours', () => {
  for (const mode of ['five', 'ten', 'full']) {
    assert.equal(basemaps.style('light', mode), 'light_all');
    assert.equal(basemaps.style('dark', mode), 'dark_all');
  }
});
