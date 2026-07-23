import { RIDDLES_CSV_URL } from './constants.js';
import { FALLBACK_LEVELS, FALLBACK_BONUS } from './riddleData.js';
import { state } from './state.js';

function normalizeCsvHeader(value) {
  return String(value || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function parseCsvObjects(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (char !== '\r') cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  if (!rows.length) return [];

  const headers = rows[0].map(normalizeCsvHeader);
  return rows.slice(1).filter(values => values.some(value => value.trim())).map(values => {
    const record = {};
    headers.forEach((header, index) => { if (header) record[header] = values[index] || ''; });
    return record;
  });
}

export function loadRiddlesFromSheets(callback) {
  if (state.levelsLoaded) { callback(true); return; }

  const loadingEl = document.getElementById('loading-msg');
  if (loadingEl) loadingEl.style.display = 'block';

  fetch(`${RIDDLES_CSV_URL}&t=${Date.now()}`, { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Mīklu CSV atbildēja ar ${response.status}.`);
      return response.text();
    })
    .then(csvText => {
      const levels = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [] };
      const bonusPool = [];
      const riddles = parseCsvObjects(csvText);

      riddles.forEach(r => {
        const mikla = (r.mikla || '').toString().trim();
        const atminejums = (r.atminejums || '').toString().trim();
        const lvl = (r.limenis || '').toString().trim();
        const gameId = (r.game_id || '').toString().trim();
        const vienibasNumurs = (r.vienibas_nr || r.vienibas_numurs || '').toString().trim();
        if (!mikla || !atminejums || !lvl) return;

        const entry = {
          id: gameId,
          gameId: gameId,
          unitNumber: vienibasNumurs,
          q: mikla,
          a: atminejums,
          loc: r.vieta || '',
          kolekcija: r.kolekcija || '',
          sourceUrl: r.id || ''
        };
        if (lvl === 'Bonuss') {
          bonusPool.push(entry);
        } else {
          const n = parseInt(lvl, 10);
          if (n >= 1 && n <= 10 && levels[n]) levels[n].push(entry);
        }
      });

      const totalRiddles = bonusPool.length + Object.values(levels).reduce((n, l) => n + l.length, 0);
      if (totalRiddles === 0) {
        console.warn('Publicētais CSV nesatur nevienu izmantojamu mīklu, izmanto rezerves datus.');
        loadFallbackLevels();
        if (loadingEl) loadingEl.style.display = 'none';
        callback(false);
        return;
      }

      state.levels = levels;
      state.bonusPool = bonusPool;
      state.levelsLoaded = true;
      if (loadingEl) loadingEl.style.display = 'none';
      callback(true);
    })
    .catch(err => {
      console.warn('Nevarēja ielādēt publicēto mīklu CSV, izmanto rezerves datus:', err);
      if (loadingEl) loadingEl.style.display = 'none';
      loadFallbackLevels();
      callback(false);
    });
}

export function loadFallbackLevels() {
  state.levels = FALLBACK_LEVELS;
  state.bonusPool = FALLBACK_BONUS;
  state.levelsLoaded = true;
}
