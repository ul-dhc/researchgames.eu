const API_URL = 'https://script.google.com/macros/s/AKfycbyGbE2KbIAsfQvGqaG0QMusF0jeGptC9AYbH6iZv4-T9bS4OztKznyfwcNQrBVdr18F2w/exec';
const ROUND_COLORS = ['#017592', '#41b449', '#65348c', '#8a2432', '#204592'];
const STATS_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

const copy = {
  lv: {
    analytics: 'Spēles analītika', gameName: 'LU 107. jubilejas spēle', goGame: 'Doties uz spēli', allTime: 'Viss periods', last30: 'Pēdējās 30 dienas', last7: 'Pēdējās 7 dienas', download: 'Lejupielādēt CSV', eyebrow: 'LU 107. jubilejas spēle', title: 'Anonīmo spēles datu pārskats', pageTitle: 'LU 107 spēles analītika', loading: 'Ielādē datus…', activityKicker: 'Aktivitāte', timeline: 'Spēles sesijas laikā', sessions: 'Sesijas', completed: 'Pabeigtas', journeyKicker: 'Spēles ceļš', funnel: 'Spēles pabeigšana', resultsKicker: 'Rezultāti', rounds: 'Vidējie punkti pa kārtām', audienceKicker: 'Auditorija', languages: 'Spēles valodas', devicesKicker: 'Ierīces', devices: 'Kur spēle tiek spēlēta?', phone: 'Telefons', tablet: 'Planšete', desktop: 'Dators', mechanicsKicker: 'Pieredze', mechanics: 'Rezultāti pēc mehānikas', contributionKicker: 'Līdzdalība', contributionTitle: 'Novēlējumi un jautājumu ieteikumi', wishes: 'Novēlējumu skaits', suggestions: 'Jautājumu ieteikumu skaits', wishSessionRate: 'Sesijas ar novēlējumu', suggestionSessionRate: 'Sesijas ar jautājuma ieteikumu', difficultyKicker: 'Salīdzinājums', difficultyTitle: 'Kārtu sarežģītība', difficultyHint: 'Kārtas sakārtotas no sarežģītākās uz vieglāko pēc pareizo atbilžu īpatsvara.', hardestRound: 'Sarežģītākā kārta', questionsKicker: 'Jautājumu banka', questions: 'Jautājumu grūtības analīze', questionsHint: 'Kārto jautājumus, nospiežot uz tabulas kolonnu virsrakstiem.', searchLabel: 'Meklēt jautājumu', searchPlaceholder: 'Meklēt jautājumu', question: 'Jautājums', round: 'Kārta', answers: 'Atbildes', correctRate: 'Pareizi', incorrect: 'Nepareizi', avgTime: 'Vidējais laiks', noQuestions: 'Šajā periodā vēl nav jautājumu datu.', privacy: 'Dashboardā redzami tikai apkopoti anonīmi dati.', updated: 'Atjaunots', noData: 'Vēl nav datu', started: 'Sākta', completedStage: 'Pabeigta', roundShort: 'kārta', players: 'sesijas', ofSessions: 'no sesijām', rating: 'Vērtējums', averageScore: 'Vidējais rezultāts', averageTime: 'Vidējais laiks', completion: 'Pabeigtas', totalSessions: 'Sesijas', completedGamesNote: 'tikai pabeigtajās spēlēs', correct: 'pareizi', ratings: 'vērtējumi', minutes: 'min', seconds: 's', loadErrorTitle: 'Neizdevās ielādēt analītikas datus', loadError: 'Pārbaudi, vai Google Apps Script ir pārpublicēts ar jauno statistikas API versiju.', retry: 'Mēģināt vēlreiz', languageShare: 'sesiju', noMechanics: 'Šajā periodā vēl nav mehāniku datu.', themeLabel: 'Mainīt krāsu režīmu'
  },
  en: {
    analytics: 'Game analytics', gameName: 'UL 107th anniversary game', goGame: 'Go to game', allTime: 'All time', last30: 'Last 30 days', last7: 'Last 7 days', download: 'Download CSV', eyebrow: 'UL 107th anniversary game', title: 'Anonymous game data overview', pageTitle: 'UL 107 game analytics', loading: 'Loading data…', activityKicker: 'Activity', timeline: 'Game sessions over time', sessions: 'Sessions', completed: 'Completed', journeyKicker: 'Player journey', funnel: 'Game completion', resultsKicker: 'Results', rounds: 'Average points by round', audienceKicker: 'Audience', languages: 'Game languages', devicesKicker: 'Devices', devices: 'Where is the game played?', phone: 'Phone', tablet: 'Tablet', desktop: 'Computer', mechanicsKicker: 'Experience', mechanics: 'Results by mechanic', contributionKicker: 'Participation', contributionTitle: 'Birthday messages and question suggestions', wishes: 'Birthday messages', suggestions: 'Question suggestions', wishSessionRate: 'Sessions with a message', suggestionSessionRate: 'Sessions with a question suggestion', difficultyKicker: 'Comparison', difficultyTitle: 'Round difficulty', difficultyHint: 'Rounds are ordered from hardest to easiest by correct answer rate.', hardestRound: 'Hardest round', questionsKicker: 'Question bank', questions: 'Question difficulty analysis', questionsHint: 'Sort questions by selecting a table column heading.', searchLabel: 'Search questions', searchPlaceholder: 'Search questions', question: 'Question', round: 'Round', answers: 'Answers', correctRate: 'Correct', incorrect: 'Incorrect', avgTime: 'Average time', noQuestions: 'There is no question data for this period yet.', privacy: 'Only aggregated anonymous data is shown in this dashboard.', updated: 'Updated', noData: 'No data yet', started: 'Started', completedStage: 'Completed', roundShort: 'round', players: 'sessions', ofSessions: 'of sessions', rating: 'Rating', averageScore: 'Average score', averageTime: 'Average time', completion: 'Completed', totalSessions: 'Sessions', completedGamesNote: 'completed games only', correct: 'correct', ratings: 'ratings', minutes: 'min', seconds: 's', loadErrorTitle: 'Analytics data could not be loaded', loadError: 'Check whether Google Apps Script has been redeployed with the new statistics API version.', retry: 'Try again', languageShare: 'sessions', noMechanics: 'There is no mechanic data for this period yet.', themeLabel: 'Change colour mode'
  }
};

let language = localStorage.getItem('lu107-stats-language') || 'lv';
let currentData = null;
let questionSort = { key: 'correctRate', direction: 'asc' };

const elements = {
  dashboard: document.querySelector('#dashboard'), status: document.querySelector('#status'), updated: document.querySelector('#updated'), period: document.querySelector('#period'), kpis: document.querySelector('#kpis'), contributions: document.querySelector('#contributions'), timeline: document.querySelector('#timeline'), funnel: document.querySelector('#funnel'), rounds: document.querySelector('#rounds'), languages: document.querySelector('#languages'), devices: document.querySelector('#devices'), mechanics: document.querySelector('#mechanics'), roundDifficulty: document.querySelector('#round-difficulty'), questionTable: document.querySelector('#question-table'), questionEmpty: document.querySelector('#question-empty'), questionSearch: document.querySelector('#question-search'), download: document.querySelector('#download'), theme: document.querySelector('#theme-toggle')
};

function t(key) { return copy[language][key] || key; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
function number(value, maximumFractionDigits = 0) { return new Intl.NumberFormat(language === 'lv' ? 'lv-LV' : 'en-GB', { maximumFractionDigits }).format(Number(value) || 0); }
function percent(value) { return `${number(value, 1)}%`; }
function duration(milliseconds) {
  const totalSeconds = Math.round((Number(milliseconds) || 0) / 1000);
  if (totalSeconds < 60) return `${totalSeconds} ${t('seconds')}`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${minutes} ${t('minutes')} ${seconds} ${t('seconds')}` : `${minutes} ${t('minutes')}`;
}

function translatePage() {
  document.documentElement.lang = language;
  document.title = t('pageTitle');
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => { element.placeholder = t(element.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-language]').forEach(button => button.classList.toggle('active', button.dataset.language === language));
  elements.theme.setAttribute('aria-label', t('themeLabel'));
  if (currentData) render(currentData);
}

async function loadData() {
  const cached = readCachedStats(elements.period.value);
  if (cached) {
    currentData = cached;
    elements.status.hidden = true;
    elements.dashboard.hidden = false;
    render(cached);
  } else {
    elements.dashboard.hidden = true;
    elements.status.hidden = false;
    elements.status.className = 'status';
    elements.status.innerHTML = `<span class="loader" aria-hidden="true"></span><span>${escapeHtml(t('loading'))}</span>`;
  }
  try {
    const response = await fetch(`${API_URL}?resource=stats&period=${encodeURIComponent(elements.period.value)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.ok || !data.overview) throw new Error(data.error || 'Invalid response');
    currentData = data;
    writeCachedStats(elements.period.value, data);
    elements.status.hidden = true;
    elements.dashboard.hidden = false;
    render(data);
  } catch (error) {
    console.error(error);
    if (cached) return;
    elements.status.className = 'status error';
    elements.status.innerHTML = `<strong>${escapeHtml(t('loadErrorTitle'))}</strong><p>${escapeHtml(t('loadError'))}</p><button class="button button-primary" type="button" id="retry">${escapeHtml(t('retry'))}</button>`;
    document.querySelector('#retry')?.addEventListener('click', loadData);
  }
}

function statsCacheKey(period) {
  return `lu107-stats-cache-v1-${period}`;
}

function readCachedStats(period) {
  try {
    const cached = JSON.parse(localStorage.getItem(statsCacheKey(period)) || 'null');
    if (!cached || !cached.savedAt || !cached.data || Date.now() - cached.savedAt > STATS_CACHE_MAX_AGE) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function writeCachedStats(period, data) {
  try {
    localStorage.setItem(statsCacheKey(period), JSON.stringify({ savedAt: Date.now(), data }));
  } catch {}
}

function render(data) {
  elements.updated.textContent = `${t('updated')} ${new Intl.DateTimeFormat(language === 'lv' ? 'lv-LV' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.generatedAt))}`;
  renderKpis(data.overview);
  renderContributions(data.overview);
  renderTimeline(data.timeline);
  renderFunnel(data.funnel);
  renderRounds(data.rounds);
  renderLanguages(data.languages);
  renderDevices(data.devices || []);
  renderMechanics(data.mechanics);
  renderRoundDifficulty(data.questions);
  renderQuestions(data.questions);
  window.lucide?.createIcons({ attrs: { 'stroke-width': 1.8 } });
}

function renderKpis(overview) {
  const cards = [
    { label: t('totalSessions'), value: number(overview.sessions), note: t('players'), icon: 'bar-chart-3', color: 'var(--purple)' },
    { label: t('completion'), value: percent(overview.completionRate), note: `${number(overview.completed)} ${t('ofSessions')}`, icon: 'circle-check', color: 'var(--green)' },
    { label: t('averageScore'), value: overview.completed ? number(overview.averageScore, 1) : '–', note: t('completedGamesNote'), icon: 'star', color: 'var(--blue)' },
    { label: t('averageTime'), value: duration(overview.averageDurationMs), note: language === 'lv' ? 'pabeigtajās spēlēs' : 'in completed games', icon: 'clock-3', color: 'var(--teal)' },
    { label: t('rating'), value: overview.ratingCount ? `${number(overview.averageRating, 1)} / 5` : '–', note: `${number(overview.ratingCount)} ${t('ratings')}`, icon: 'message-square-heart', color: 'var(--yellow)' }
  ];
  elements.kpis.innerHTML = cards.map(card => `<article class="kpi" style="--accent:${card.color}"><div class="kpi-top"><span>${escapeHtml(card.label)}</span><span class="kpi-icon"><i data-lucide="${card.icon}" aria-hidden="true"></i></span></div><strong>${escapeHtml(card.value)}</strong><small>${escapeHtml(card.note)}</small></article>`).join('');
}

function renderContributions(overview) {
  const items = [
    { label: t('wishes'), value: number(overview.wishCount), color: 'var(--red)' },
    { label: t('suggestions'), value: number(overview.suggestionCount), color: 'var(--purple)' },
    { label: t('wishSessionRate'), value: percent(overview.wishSessionRate), color: 'var(--teal)' },
    { label: t('suggestionSessionRate'), value: percent(overview.suggestionSessionRate), color: 'var(--green)' }
  ];
  elements.contributions.innerHTML = items.map(item => `<article class="contribution-stat" style="--accent:${item.color}"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></article>`).join('');
}

function renderTimeline(items) {
  if (!items.length) { elements.timeline.innerHTML = `<p class="empty-message">${escapeHtml(t('noData'))}</p>`; return; }
  const width = 760, height = 250, left = 38, right = 15, top = 18, bottom = 36;
  const max = Math.max(1, ...items.map(item => Math.max(item.sessions, item.completed)));
  const x = index => left + (items.length === 1 ? (width - left - right) / 2 : index * (width - left - right) / (items.length - 1));
  const y = value => top + (max - value) * (height - top - bottom) / max;
  const points = key => items.map((item, index) => `${x(index)},${y(item[key])}`).join(' ');
  const area = `${left},${height - bottom} ${points('sessions')} ${x(items.length - 1)},${height - bottom}`;
  const grid = [0, 0.25, 0.5, 0.75, 1].map(ratio => { const value = Math.round(max * ratio); const py = y(value); return `<line class="chart-grid" x1="${left}" x2="${width - right}" y1="${py}" y2="${py}"/><text class="chart-label" x="${left - 8}" y="${py + 4}" text-anchor="end">${value}</text>`; }).join('');
  const every = Math.max(1, Math.ceil(items.length / 7));
  const labels = items.map((item, index) => index % every === 0 || index === items.length - 1 ? `<text class="chart-label" x="${x(index)}" y="${height - 11}" text-anchor="middle">${formatShortDate(item.date)}</text>` : '').join('');
  const sessionPoints = items.map((item, index) => `<circle class="chart-point" cx="${x(index)}" cy="${y(item.sessions)}" r="4"><title>${item.date}: ${item.sessions}</title></circle>`).join('');
  const completedPoints = items.map((item, index) => `<circle class="chart-point chart-point-completed" cx="${x(index)}" cy="${y(item.completed)}" r="3"><title>${item.date}: ${item.completed}</title></circle>`).join('');
  elements.timeline.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(t('timeline'))}">${grid}<polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${points('sessions')}"/><polyline class="chart-line chart-line-completed" points="${points('completed')}"/>${sessionPoints}${completedPoints}${labels}</svg>`;
}

function formatShortDate(value) { return new Intl.DateTimeFormat(language === 'lv' ? 'lv-LV' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`)); }

function renderFunnel(items) {
  const labels = [t('started'), `1. ${t('roundShort')}`, `2. ${t('roundShort')}`, `3. ${t('roundShort')}`, `4. ${t('roundShort')}`, `5. ${t('roundShort')}`, t('completedStage')];
  elements.funnel.innerHTML = items.map((item, index) => `<div class="funnel-row"><span>${escapeHtml(labels[index] || item.stage)}</span><div class="funnel-track"><div class="funnel-fill" style="width:${Math.max(0, Math.min(100, item.rate))}%"></div></div><strong class="funnel-value">${number(item.count)} <small>(${percent(item.rate)})</small></strong></div>`).join('');
}

function renderRounds(items) {
  const max = Math.max(1, ...items.map(item => item.averageScore));
  elements.rounds.innerHTML = items.map((item, index) => `<div class="round-bar"><strong>${number(item.averageScore, 1)}</strong><div class="round-column" style="height:${Math.max(3, item.averageScore / max * 150)}px;--round-color:${ROUND_COLORS[index]}"></div><span>${escapeHtml(localRoundName(item, index))}</span></div>`).join('');
}

function localRoundName(item, index) {
  if (language === 'lv') return item.name;
  return ['UL History', 'UL Today', 'Student Life at UL', 'Culture and Sports at UL', 'Final Challenge'][index] || item.name;
}

function translatedRoundName(name) {
  if (language === 'lv') return name;
  const names = {
    'LU vēsture': 'UL History',
    'LU mūsdienās': 'UL Today',
    'Studentu dzīve LU': 'Student Life at UL',
    'Kultūra un sports LU': 'Culture and Sports at UL',
    'Fināla izaicinājums': 'Final Challenge'
  };
  return names[name] || name;
}

function renderLanguages(items) {
  const lv = items.find(item => item.language === 'LV') || { count: 0, rate: 0 };
  const en = items.find(item => item.language === 'EN') || { count: 0, rate: 0 };
  elements.languages.innerHTML = `<div class="donut" style="background:conic-gradient(var(--teal) 0 ${lv.rate}%, var(--purple) ${lv.rate}% 100%)"><div class="donut-center"><strong>${percent(lv.rate)}</strong><span>LV</span></div></div><div class="language-legend"><span><i class="legend-dot sessions-dot" style="background:var(--teal)"></i> LV <b>${number(lv.count)}</b></span><span><i class="legend-dot sessions-dot"></i> EN <b>${number(en.count)}</b></span></div>`;
}

function renderDevices(items) {
  const icons = { phone: 'smartphone', tablet: 'tablet', desktop: 'monitor' };
  elements.devices.innerHTML = ['phone', 'tablet', 'desktop'].map(device => {
    const item = items.find(entry => entry.device === device) || { count: 0, rate: 0 };
    return `<div class="device-row"><span class="device-label"><i data-lucide="${icons[device]}" aria-hidden="true"></i>${escapeHtml(t(device))}</span><div class="bar-track"><div class="bar-fill" style="width:${item.rate}%"></div></div><strong>${percent(item.rate)}</strong></div>`;
  }).join('');
}

function renderMechanics(items) {
  if (!items.length) { elements.mechanics.innerHTML = `<p class="empty-message">${escapeHtml(t('noMechanics'))}</p>`; return; }
  elements.mechanics.innerHTML = items.slice(0, 7).map(item => `<div class="mechanic-row"><span title="${escapeHtml(item.mechanic)}">${escapeHtml(item.mechanic)}</span><div class="bar-track"><div class="bar-fill" style="width:${item.correctRate}%"></div></div><strong>${percent(item.correctRate)}</strong></div>`).join('');
}

function renderRoundDifficulty(items) {
  const validRounds = new Set(['LU vēsture', 'LU mūsdienās', 'Studentu dzīve LU', 'Kultūra un sports LU', 'Fināla izaicinājums']);
  const groups = new Map();
  items.forEach(item => {
    const name = item.round || '';
    if (!validRounds.has(name)) return;
    const group = groups.get(name) || { name, answers: 0, correct: 0, responseTimeTotal: 0 };
    const answers = Number(item.answers || 0);
    group.answers += answers;
    group.correct += Number(item.correct || 0);
    group.responseTimeTotal += Number(item.averageResponseTimeMs || 0) * answers;
    groups.set(name, group);
  });
  const rounds = [...groups.values()].filter(item => item.answers > 0).map(item => ({
    ...item,
    correctRate: item.correct / item.answers * 100,
    averageResponseTimeMs: item.responseTimeTotal / item.answers
  })).sort((a, b) => a.correctRate - b.correctRate || b.averageResponseTimeMs - a.averageResponseTimeMs);
  if (!rounds.length) { elements.roundDifficulty.innerHTML = `<p class="empty-message">${escapeHtml(t('noQuestions'))}</p>`; return; }
  elements.roundDifficulty.innerHTML = rounds.map((item, index) => `<article class="difficulty-row${index === 0 ? ' is-hardest' : ''}"><span class="difficulty-rank">${index + 1}</span><div class="difficulty-copy"><div><strong>${escapeHtml(translatedRoundName(item.name))}</strong>${index === 0 ? `<span class="difficulty-badge">${escapeHtml(t('hardestRound'))}</span>` : ''}</div><div class="difficulty-track"><span style="width:${Math.max(2, item.correctRate)}%"></span></div></div><div class="difficulty-metric"><strong>${percent(item.correctRate)}</strong><span>${escapeHtml(t('correctRate'))}</span></div><div class="difficulty-metric"><strong>${duration(item.averageResponseTimeMs)}</strong><span>${escapeHtml(t('avgTime'))}</span></div><div class="difficulty-metric"><strong>${number(item.answers)}</strong><span>${escapeHtml(t('answers'))}</span></div></article>`).join('');
}

function renderQuestions(items) {
  const query = elements.questionSearch.value.trim().toLocaleLowerCase(language === 'lv' ? 'lv-LV' : 'en-GB');
  const filtered = items
    .filter(item => `${item.questionLv} ${item.questionEn} ${item.round}`.toLocaleLowerCase(language === 'lv' ? 'lv-LV' : 'en-GB').includes(query))
    .sort((a, b) => {
      const value = item => questionSort.key === 'incorrect' ? Number(item.answers || 0) - Number(item.correct || 0) : Number(item[questionSort.key] || 0);
      const difference = value(a) - value(b);
      return (questionSort.direction === 'asc' ? difference : -difference) || String(a.id).localeCompare(String(b.id));
    });
  elements.questionTable.innerHTML = filtered.map(item => { const question = language === 'lv' ? item.questionLv : item.questionEn; const incorrect = Number(item.answers || 0) - Number(item.correct || 0); return `<tr><td class="question-cell">${escapeHtml(question)}</td><td><span class="round-pill">${escapeHtml(translatedRoundName(item.round) || '–')}</span></td><td>${number(item.answers)}</td><td class="rate-cell"><div><strong class="${item.correctRate < 50 ? 'rate-low' : ''}">${percent(item.correctRate)}</strong><span>${number(item.correct)} / ${number(item.answers)}</span></div><div class="bar-track"><div class="bar-fill" style="width:${item.correctRate}%"></div></div></td><td>${number(incorrect)}</td><td>${duration(item.averageResponseTimeMs)}</td></tr>`; }).join('');
  elements.questionEmpty.hidden = filtered.length > 0;
  updateQuestionSortHeaders();
}

function updateQuestionSortHeaders() {
  document.querySelectorAll('[data-sort]').forEach(button => {
    const active = button.dataset.sort === questionSort.key;
    const direction = active ? questionSort.direction : null;
    button.closest('th').setAttribute('aria-sort', active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none');
    button.querySelector('svg')?.remove();
    button.querySelector('i')?.remove();
    button.insertAdjacentHTML('beforeend', `<i data-lucide="${active ? (direction === 'asc' ? 'arrow-up' : 'arrow-down') : 'chevrons-up-down'}" aria-hidden="true"></i>`);
  });
  window.lucide?.createIcons({ attrs: { 'stroke-width': 1.8 } });
}

function downloadCsv() {
  if (!currentData) return;
  const headers = ['ID', 'Question LV', 'Question EN', 'Round', 'Mechanic', 'Answers', 'Correct', 'Correct rate', 'Average response time ms', 'Average points'];
  const rows = currentData.questions.map(item => [item.id, item.questionLv, item.questionEn, item.round, item.mechanic, item.answers, item.correct, item.correctRate, item.averageResponseTimeMs, item.averagePoints]);
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
  link.download = `lu107-stats-${elements.period.value}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function setTheme(dark) {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('lu107-stats-theme', dark ? 'dark' : 'light');
  elements.theme.innerHTML = `<i data-lucide="${dark ? 'sun' : 'moon'}" aria-hidden="true"></i>`;
  window.lucide?.createIcons({ attrs: { 'stroke-width': 1.8 } });
}

document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => { language = button.dataset.language; localStorage.setItem('lu107-stats-language', language); translatePage(); }));
elements.period.addEventListener('change', loadData);
elements.questionSearch.addEventListener('input', () => currentData && renderQuestions(currentData.questions));
document.querySelectorAll('[data-sort]').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.sort;
  questionSort = questionSort.key === key
    ? { key, direction: questionSort.direction === 'asc' ? 'desc' : 'asc' }
    : { key, direction: key === 'correctRate' ? 'asc' : 'desc' };
  if (currentData) renderQuestions(currentData.questions);
}));
elements.download.addEventListener('click', downloadCsv);
elements.theme.addEventListener('click', () => setTheme(!document.documentElement.classList.contains('dark')));

setTheme((localStorage.getItem('lu107-stats-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark');
translatePage();
loadData();
