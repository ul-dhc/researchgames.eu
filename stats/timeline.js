const DAY = 86400000;
const iso = time => new Date(time).toISOString().slice(0, 10);

// The APIs use rolling 7/30-day windows, including the partial first day.
export function buildTimelineSeries(games, period, today) {
  const end = Date.parse(`${today}T00:00:00Z`);
  const observed = games.flatMap(game => game.timeline?.map(day => day.date) || []).sort();
  const start = period === 'all'
    ? Date.parse(`${observed[0] || today}T00:00:00Z`)
    : end - (period === '7d' ? 7 : 30) * DAY;
  const dates = [];
  for (let time = Math.min(start, end); time <= end; time += DAY) dates.push(iso(time));
  return { dates, games: games.map(game => {
    const counts = new Map();
    for (const day of game.timeline || []) counts.set(day.date, (counts.get(day.date) || 0) + day.sessions);
    return { ...game, values: game.timeline ? dates.map(date => counts.get(date) || 0) : null };
  }) };
}

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderTimeline(container, series, language) {
  container._timelineCleanup?.();
  const lv = language === 'lv';
  const locale = lv ? 'lv-LV' : 'en-GB';
  const format = new Intl.DateTimeFormat(locale, {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  const short = new Intl.DateTimeFormat(locale, {day:'numeric',month:'short',timeZone:'UTC'});
  const dateValue = date => new Date(`${date}T00:00:00Z`);
  const available = series.games.filter(game => game.values);
  if (!available.length) {
    container.innerHTML = `<p class="empty">${lv ? 'Laika grafiks būs redzams, kad būs pieejami dati.' : 'The timeline will appear when data is available.'}</p>`;
    return;
  }
  let selected = series.dates.length - 1;
  let width, x, y;
  const height = 280, left = 38, right = 14, top = 20, bottom = 42;
  const peak = Math.max(1, ...available.flatMap(game => game.values));
  const step = Math.max(1, Math.ceil(peak / 4));
  const max = step * 4;
  const unavailable = lv ? 'Dati nav pieejami' : 'Data unavailable';
  container.innerHTML = `
    <div class="timeline-legend">${series.games.map((game, i) => `<span class="series-key series-${i}${game.values ? '' : ' unavailable'}"><span class="series-swatch" aria-hidden="true"></span>${escape(game.name)}${game.values ? '' : ` (${unavailable})`}</span>`).join('')}</div>
    <p class="timeline-help" id="timeline-help">${lv ? 'Pārvieto rādītāju vai pieskaries grafikam, lai apskatītu dienu. Ar tastatūru izmanto bulttaustiņus.' : 'Move the pointer or touch the chart to inspect a day. Use arrow keys with a keyboard.'}</p>
    <svg class="line-chart" role="slider" tabindex="0" aria-label="${lv ? 'Diena laika grafikā' : 'Day on timeline'}" aria-describedby="timeline-help" aria-valuemin="0" aria-valuemax="${series.dates.length - 1}"></svg>
    <div class="timeline-readout" aria-live="polite" aria-atomic="true"></div>`;
  const svg = container.querySelector('svg');
  const readout = container.querySelector('.timeline-readout');
  const updateSelection = () => {
    const date = series.dates[selected];
    const values = series.games.map(game => `${game.name}: ${game.values ? game.values[selected] : unavailable}`);
    svg.setAttribute('aria-valuenow', selected);
    svg.setAttribute('aria-valuetext', `${format.format(dateValue(date))}. ${values.join('. ')}`);
    const guide = svg.querySelector('.day-guide');
    guide.setAttribute('x1', x(selected)); guide.setAttribute('x2', x(selected));
    svg.querySelectorAll('.selected-point').forEach(point => {
      const game = series.games[Number(point.dataset.series)];
      point.setAttribute('cx', x(selected)); point.setAttribute('cy', y(game.values[selected]));
    });
    readout.innerHTML = `<time datetime="${date}">${escape(format.format(dateValue(date)))}</time><div>${series.games.map((game, i) => `<span class="series-${i}"><span class="series-swatch" aria-hidden="true"></span><span>${escape(game.name)}</span><strong>${game.values ? game.values[selected] : '–'}</strong></span>`).join('')}</div>`;
  };
  const draw = () => {
    width = Math.max(260, container.clientWidth);
    x = index => left + (series.dates.length === 1 ? .5 : index / (series.dates.length - 1)) * (width - left - right);
    y = value => height - bottom - value / max * (height - top - bottom);
    const tickCount = Math.min(series.dates.length, width < 500 ? 3 : 6);
    const ticks = [...new Set(Array.from({length:tickCount}, (_, i) => tickCount === 1 ? 0 : Math.round(i * (series.dates.length - 1) / (tickCount - 1))))];
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = `<g aria-hidden="true">${Array.from({length:5}, (_, i) => `<line class="chart-grid" x1="${left}" x2="${width-right}" y1="${y(i*step)}" y2="${y(i*step)}"/><text class="chart-label" x="${left-10}" y="${y(i*step)+4}" text-anchor="end">${i*step}</text>`).join('')}
      ${ticks.map((index, i) => `<text class="chart-label" x="${x(index)}" y="${height-14}" text-anchor="${i === 0 ? 'start' : i === ticks.length-1 ? 'end' : 'middle'}">${escape(short.format(dateValue(series.dates[index])))}</text>`).join('')}
      ${series.games.map((game,i) => game.values ? `<polyline class="game-line series-${i}" points="${game.values.map((value,index) => `${x(index)},${y(value)}`).join(' ')}"/>` : '').join('')}
      <line class="day-guide" y1="${top}" y2="${height-bottom}"/>
      ${series.games.map((game,i) => game.values ? `<circle class="selected-point series-${i}" data-series="${i}" r="4.5"/>` : '').join('')}</g>`;
    updateSelection();
  };
  const selectPointer = event => {
    const rect = svg.getBoundingClientRect();
    const pixel = (event.clientX - rect.left) / rect.width * width;
    const index = Math.max(0, Math.min(series.dates.length-1, Math.round((pixel-left)/(width-left-right)*(series.dates.length-1))));
    if (index !== selected) { selected = index; updateSelection(); }
  };
  svg.addEventListener('pointermove', event => { if (event.pointerType !== 'touch' || event.buttons) selectPointer(event); });
  svg.addEventListener('pointerdown', selectPointer);
  svg.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    selected = event.key === 'Home' ? 0 : event.key === 'End' ? series.dates.length-1 : Math.max(0,Math.min(series.dates.length-1,selected+(event.key==='ArrowRight'?1:-1)));
    updateSelection();
  });
  draw();
  const observer = new ResizeObserver(draw);
  observer.observe(container);
  container._timelineCleanup = () => observer.disconnect();
}
