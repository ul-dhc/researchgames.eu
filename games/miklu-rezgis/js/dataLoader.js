import { FALLBACK_LEVELS, FALLBACK_BONUS } from './riddleData.js';
import { state } from './state.js';

export function loadRiddlesFromSheets(callback) {
  if (state.levelsLoaded) { callback(true); return; }

  const loadingEl = document.getElementById('loading-msg');
  if (loadingEl) loadingEl.style.display = 'block';

  RiddleData.load()
    .then(data => {
      const { levels, bonusPool } = data;
      state.levels = levels;
      state.bonusPool = bonusPool;
      state.levelsLoaded = true;
      if (loadingEl) loadingEl.style.display = 'none';
      callback(true);
    })
    .catch(err => {
      console.warn('Nevarēja ielādēt mīklu JSON, izmanto rezerves datus:', err);
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
