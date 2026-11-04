(() => {
  'use strict';
  const apiKey = window.LIVONIAN_MAPTILER_API_KEY;
  delete window.LIVONIAN_MAPTILER_API_KEY;
  const status = document.querySelector('.winter-status');
  const styles = new Map();
  // Sync through MapLibre's public camera API. Reset canvas transforms left by
  // Leaflet transitions before resizing, so both renderers use the same origin.
  L.MaplibreGL.include({
    _update() {
      if (!this._map || !this._glMap || this._zooming) return;
      const map = this._map, gl = this._glMap;
      if (!map.getContainer().clientWidth || !map.getContainer().clientHeight) return;
      const size = this.getSize();
      const offset = map.getSize().multiplyBy(this.options.padding);
      const topLeft = map.containerPointToLayerPoint([0, 0]).subtract(offset);
      this._offset = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(this._container, this._roundPoint(topLeft));
      this._container.style.width = size.x + 'px';
      this._container.style.height = size.y + 'px';
      L.DomUtil.setTransform(gl.getCanvas(), L.point(0, 0), 1);
      gl.resize();
      const center = map.getCenter();
      gl.jumpTo({ center: [center.lng, center.lat], zoom: map.getZoom() - 1, bearing: 0, pitch: 0 });
    },
    _resize() { this._zooming = false; this._update(); },
    _transitionEnd() { this._zooming = false; this._update(); },
  });
  function getStyle(theme) {
    if (styles.has(theme)) return styles.get(theme);
    const styleId = theme === 'dark' ? 'winter-v4-dark' : 'winter-v4';
    const ready = fetch(`https://api.maptiler.com/maps/${styleId}/style.json?key=${encodeURIComponent(apiKey || '')}`, { credentials: 'omit' })
    .then(response => {
      if (!response.ok) throw new Error('MapTiler access unavailable');
      return response.json();
    })
    .then(style => {
      if (theme === 'dark') {
        const land = { Scrub: '#155324', Forest: '#123D1D', Wood: '#16711E', Grass: '#237D2B', Residential: '#12304A', Industrial: '#102F47', Commercial: '#13314B' };
        style.layers.forEach(layer => {
          if (layer.type === 'background') layer.paint = { ...layer.paint, 'background-color': '#0C302B' };
          if (layer.type === 'fill' && layer['source-layer'] === 'water') layer.paint = { ...layer.paint, 'fill-color': '#182C4B' };
          if (layer.type === 'fill' && land[layer.id]) {
            layer.paint = { ...layer.paint, 'fill-color': land[layer.id] };
            delete layer.paint['fill-pattern'];
          }
          if (layer.id === 'Wood') layer.paint['fill-opacity'] = .3;
          if (layer.id === 'Forest') layer.paint['fill-opacity'] = .28;
          if (layer.id === 'Grass') layer.paint['fill-opacity'] = .32;
          if (layer.type === 'line' && ['country_border', 'country_border_disputed', 'sub_border'].includes(layer['source-layer'])) layer.paint = { ...layer.paint, 'line-color': '#708BAA', 'line-opacity': .35 };
        });
      }
      let hidden = 0, hiddenTransport = 0;
      const transport = new Set(['road', 'pathway', 'railway', 'ferry', 'aviation_line', 'ski', 'aerialway']);
      // These are basemap symbols only; the game's own Leaflet points stay visible.
      style.layers.forEach(layer => {
        const isSymbol = layer.type === 'symbol';
        const isTransport = transport.has(layer['source-layer']);
        if (!isSymbol && !isTransport) return;
        layer.layout = { ...layer.layout, visibility: 'none' };
        if (isSymbol) hidden++;
        if (isTransport && !isSymbol) hiddenTransport++;
      });
      document.documentElement.dataset.winterLabelsHidden = String(hidden);
      document.documentElement.dataset.winterTransportHidden = String(hiddenTransport);
      return style;
    });
    styles.set(theme, ready);
    return ready;
  }
  window.LivonianWinter = {
    createLayer(theme = 'light') {
      const ready = getStyle(theme);
      const layer = L.maplibreGL({
        style: { version: 8, sources: {}, layers: [{ id: 'pending', type: 'background', paint: { 'background-color': '#D7E9ED' } }] },
        interactive: false, padding: 0,
        attribution: '<a class="maptiler-attribution-logo" href="https://www.maptiler.com/" target="_blank" rel="noopener"><img class="maptiler-on-light" src="assets/maptiler-logo-monochrome.png" alt="MapTiler" width="64"><img class="maptiler-on-dark" src="assets/maptiler-logo-white.png" alt="MapTiler" width="64"></a> © <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
        transformRequest(url) {
          const target = new URL(url, location.href);
          if (target.hostname === 'api.maptiler.com' && !target.searchParams.has('key')) target.searchParams.set('key', apiKey);
          return { url: target.href };
        },
      });
      layer.bringToBack = () => {
        const container = layer.getContainer();
        if (container?.parentElement) container.parentElement.prepend(container);
        return layer;
      };
      layer.on('add', () => {
        const gl = layer.getMaplibreMap();
        const observer = new ResizeObserver(() => {
          cancelAnimationFrame(layer._syncFrame);
          layer._syncFrame = requestAnimationFrame(() => {
            if (!layer._map || !layer._map.getContainer().clientWidth || !layer._map.getContainer().clientHeight) return;
            layer._map.invalidateSize({ pan: false });
            layer._update();
          });
        });
        observer.observe(layer._map.getContainer());
        layer.once('remove', () => { observer.disconnect(); cancelAnimationFrame(layer._syncFrame); });
        let requested = false, failed = false;
        gl.on('error', () => {
          failed = true;
          if (status) {
            status.hidden = false;
            status.textContent = document.documentElement.lang === 'en' ? 'The map could not be loaded. Please check your internet connection.' : 'Karti neizdevās ielādēt. Pārbaudi interneta savienojumu.';
          }
        });
        gl.on('idle', () => {
          if (layer._map) {
            const map = layer._map;
            const checks = [[22.598,57.75],[21.56,57.39],[24.105,56.95]].map(([lon,lat]) => {
              const a = map.latLngToContainerPoint([lat,lon]);
              const b = gl.project([lon,lat]);
              const host = map.getContainer(), hostBox = host.getBoundingClientRect();
              const canvas = gl.getCanvas(), canvasBox = canvas.getBoundingClientRect();
              const scale = hostBox.width / host.clientWidth;
              return [Math.round(((canvasBox.left-hostBox.left)/scale+b.x*canvasBox.width/canvas.clientWidth/scale-a.x)*100)/100,
                Math.round(((canvasBox.top-hostBox.top)/scale+b.y*canvasBox.height/canvas.clientHeight/scale-a.y)*100)/100];
            });
            map.getContainer().dataset.basemapAlignment = JSON.stringify(checks);
          }
          if (!requested || failed) return;
          document.documentElement.dataset.winterReady = 'true';
          if (status) status.hidden = true;
        });
        ready.then(style => {
          if (!layer._map) return;
          requested = true;
          if (document.documentElement.dataset.theme === theme) document.documentElement.dataset.winterStyle = theme === 'dark' ? 'winter-v4-dark' : 'winter-v4';
          gl.setStyle(JSON.parse(JSON.stringify(style)));
          layer._update();
        }).catch(() => {
          document.documentElement.dataset.winterReady = 'false';
          if (status) {
            status.hidden = false;
            status.textContent = document.documentElement.lang === 'en' ? 'The map is currently unavailable. Please try again later.' : 'Karte pašlaik nav pieejama. Mēģini vēlreiz vēlāk.';
          }
        });
      });
      return layer;
    },
  };
})();
