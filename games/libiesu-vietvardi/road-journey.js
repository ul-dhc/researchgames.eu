(function (root) {
  "use strict";
  const roads = typeof module !== "undefined" && module.exports ? require("./coast-roads.js") : root.LivonianRoads;
  function coordinate(name) {
    const stop = roads.stops.find(stop => stop.name === name);
    if (!stop) throw new Error(`Unknown coastal stop: ${name}`);
    return stop.coordinate.slice();
  }
  function pathBetween(from, to) {
    const a = roads.stops.findIndex(stop => stop.name === from);
    const b = roads.stops.findIndex(stop => stop.name === to);
    if (a < 0 || b < 0) throw new Error("Unknown coastal stop");
    if (a === b) return [coordinate(from)];
    const forward = roads.legs.slice(Math.min(a, b), Math.max(a, b))
      .flatMap((leg, index) => index ? leg.coordinates.slice(1) : leg.coordinates);
    return a < b ? forward : forward.slice().reverse();
  }
  function distance(a, b) {
    const rad = Math.PI / 180;
    const dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
  }
  function createTrack(points) {
    if (!points.length) throw new Error("Empty road track");
    const cumulative = [0];
    for (let i = 1; i < points.length; i++) cumulative.push(cumulative[i - 1] + distance(points[i - 1], points[i]));
    return { points, cumulative, length: cumulative[cumulative.length - 1] };
  }
  function sampleTrack(track, fraction) {
    const target = Math.max(0, Math.min(1, fraction)) * track.length;
    let low = 0, high = track.points.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (track.cumulative[mid] < target) low = mid + 1;
      else high = mid;
    }
    const index = Math.max(1, low);
    if (track.points.length === 1) return { coordinate: track.points[0], index: 0 };
    const from = track.points[index - 1], to = track.points[index];
    const span = track.cumulative[index] - track.cumulative[index - 1];
    const t = span ? (target - track.cumulative[index - 1]) / span : 0;
    return { coordinate: [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t], index };
  }
  function googleMapsUrl(stops = roads.stops) {
    if (stops.length < 2) throw new Error("A route needs two stops");
    const value = stop => stop.coordinate.join(",");
    const params = new URLSearchParams({ api: "1", origin: value(stops[0]), destination: value(stops[stops.length - 1]), travelmode: "walking" });
    if (stops.length > 2) params.set("waypoints", stops.slice(1, -1).map(value).join("|"));
    return `https://www.google.com/maps/dir/?${params}`;
  }
  const api = { roads, coordinate, pathBetween, createTrack, sampleTrack, googleMapsUrl };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LivonianJourney = api;
})(typeof window === "undefined" ? globalThis : window);
