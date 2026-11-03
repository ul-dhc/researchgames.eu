import test from 'node:test';
import assert from 'node:assert/strict';
import journey from '../road-journey.js';
import modes from '../mode-plans.js';
const { roads, coordinate, pathBetween, createTrack, sampleTrack, googleMapsUrl } = journey;

test('cached coastal paths connect all eight stops exactly and avoid the main road', () => {
  assert.deepEqual(roads.stops.map(stop => stop.name), modes.COAST_STOPS);
  assert.equal(roads.legs.length, 7);
  assert.equal(roads.profile, 'coastal_walking');
  assert.ok(roads.stops.every(stop => stop.placeNodeId && stop.snapDistanceMetres < 65));
  for (let i = 0; i < 7; i++) {
    const leg = roads.legs[i];
    assert.equal(leg.from, roads.stops[i].name);
    assert.equal(leg.to, roads.stops[i + 1].name);
    assert.ok(leg.coordinates.length > 20);
    assert.equal(leg.majorRoadMetres, 0);
    assert.ok(leg.osmWayIds.length > 0);
    assert.deepEqual(leg.coordinates[0], coordinate(leg.from));
    assert.deepEqual(leg.coordinates.at(-1), coordinate(leg.to));
    const length = createTrack(leg.coordinates).length;
    assert.ok(Math.abs(length - leg.distanceMetres) / leg.distanceMetres < .02);
  }
});

test('any matching order follows the road network, including backwards and nonadjacent stops', () => {
  for (const from of modes.COAST_STOPS) for (const to of modes.COAST_STOPS) {
    const path = pathBetween(from, to);
    assert.deepEqual(path[0], coordinate(from));
    assert.deepEqual(path.at(-1), coordinate(to));
    assert.deepEqual(path, pathBetween(to, from).slice().reverse());
    const track = createTrack(path);
    assert.deepEqual(sampleTrack(track, 0).coordinate, coordinate(from));
    assert.deepEqual(sampleTrack(track, 1).coordinate, coordinate(to));
  }
});

test('animation progresses by road distance rather than uneven vertex spacing', () => {
  const track = createTrack([[57, 22], [57.001, 22], [57.01, 22]]);
  const middle = sampleTrack(track, .5);
  assert.ok(Math.abs(middle.coordinate[0] - 57.005) < .000001);
  assert.equal(middle.index, 2);
  assert.deepEqual(sampleTrack(track, -1).coordinate, track.points[0]);
  assert.deepEqual(sampleTrack(track, 2).coordinate, track.points.at(-1));
});

test('Google Maps links preserve road-snapped stops in order and support two mobile sections', () => {
  const full = new URL(googleMapsUrl());
  assert.equal(full.origin, 'https://www.google.com');
  assert.equal(full.pathname, '/maps/dir/');
  assert.equal(full.searchParams.get('api'), '1');
  assert.equal(full.searchParams.get('travelmode'), 'walking');
  assert.equal(full.searchParams.get('origin'), roads.stops[0].coordinate.join(','));
  assert.equal(full.searchParams.get('destination'), roads.stops.at(-1).coordinate.join(','));
  assert.deepEqual(full.searchParams.get('waypoints').split('|'), roads.stops.slice(1, -1).map(stop => stop.coordinate.join(',')));
  const first = new URL(googleMapsUrl(roads.stops.slice(0, 5)));
  const last = new URL(googleMapsUrl(roads.stops.slice(4)));
  assert.equal(first.searchParams.get('destination'), last.searchParams.get('origin'));
  assert.ok(first.searchParams.get('waypoints').split('|').length <= 3);
  assert.ok(last.searchParams.get('waypoints').split('|').length <= 3);
});
