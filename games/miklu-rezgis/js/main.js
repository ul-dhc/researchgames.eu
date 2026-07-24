import { LV_ALPHABET, MODE_NAMES } from './constants.js';
import { readSavedProgress, clearProgress, state } from './state.js';
import { initGridInput } from './input.js';
import { initTheme, initFontSizeControls } from './theme.js';
import { renderGrid, renderTimer } from './render.js';
import { cellSizePx } from './gridBuilder.js';
import {
  checkWord, giveHint, giveUp, nextRiddle, copyShare, shuffleLetters,
  startMode, startBonusRound, showFinalResults, loadSavedProgress,
} from './gameLogic.js';
import {
  showAbout, hideAbout, hideBonusOverlay, hideFinalOverlay,
  hideContinueOverlay, showRestartConfirm, hideRestart, doRestart,
  lockGame, unlockGame,
} from './navigation.js';

function selectMode(mode) {
  state.selectedMode = mode;
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.toggle('selected', Number(card.dataset.mode) === mode);
  });
}

function wireModeCards() {
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => selectMode(Number(card.dataset.mode)));
  });
  selectMode(state.selectedMode);

  document.getElementById('start-btn').addEventListener('click', () => startMode(state.selectedMode));
}

function renderLockedGrid() {
  const size = 9;
  const el = document.getElementById('grid');
  if (!el) return;
  const cs = cellSizePx(size);
  el.style.gridTemplateColumns = `repeat(${size},${cs}px)`;
  el.style.gap = '3px';
  el.innerHTML = '';
  for (let i = 0; i < size * size; i++) {
    const d = document.createElement('div');
    d.className = 'cell filler';
    d.style.width = cs + 'px';
    d.style.height = cs + 'px';
    d.textContent = LV_ALPHABET[Math.floor(Math.random() * LV_ALPHABET.length)];
    el.appendChild(d);
  }
}

function wireEvents() {
  wireModeCards();

  document.querySelectorAll('.about-link').forEach(link => {
    link.addEventListener('click', (e) => { e.preventDefault(); showAbout(); });
  });
  document.getElementById('about-back-btn').addEventListener('click', hideAbout);

  document.getElementById('hint-btn').addEventListener('click', giveHint);
  document.getElementById('next-btn').addEventListener('click', nextRiddle);
  document.getElementById('give-up-btn').addEventListener('click', giveUp);
  document.getElementById('shuffle-btn').addEventListener('click', shuffleLetters);
  document.getElementById('restart-btn').addEventListener('click', showRestartConfirm);

  document.getElementById('copy-btn').addEventListener('click', copyShare);
  document.getElementById('fo-new-game-btn').addEventListener('click', () => {
    hideFinalOverlay();
    renderLockedGrid();
    lockGame();
  });

  document.getElementById('bo-yes-btn').addEventListener('click', () => {
    hideBonusOverlay();
    startBonusRound();
  });
  document.getElementById('bo-no-btn').addEventListener('click', showFinalResults);

  document.getElementById('co-continue-btn').addEventListener('click', () => {
    hideContinueOverlay();
    loadSavedProgress();
  });
  document.getElementById('co-restart-btn').addEventListener('click', () => {
    hideContinueOverlay();
    clearProgress();
    renderLockedGrid();
    lockGame();
  });

  document.getElementById('ro-confirm-btn').addEventListener('click', doRestart);
  document.getElementById('ro-cancel-btn').addEventListener('click', hideRestart);

  initGridInput(checkWord);
}

function checkAboutDeepLink() {
  if (window.location.hash === '#about') {
    document.getElementById('app-shell').style.display = 'none';
    document.getElementById('about-screen').style.display = 'block';
  }
}

function checkContinuePrompt() {
  const data = readSavedProgress();
  if (!data) return;
  const desc = document.getElementById('co-desc');
  if (desc) {
    desc.textContent =
      `${MODE_NAMES[data.gameMode] || ''} · ${data.currentLevel || 1}. līmenis · ${(data.totalScore || 0).toLocaleString('lv-LV')} punkti`;
  }
  document.getElementById('continue-overlay').classList.add('show');
}

function init() {
  console.log('Latviešu tautas mīklu režģis');
  initTheme();
  initFontSizeControls();
  renderLockedGrid();
  lockGame();
  wireEvents();
  checkAboutDeepLink();
  checkContinuePrompt();
  setInterval(renderTimer, 1000);
  window.addEventListener('resize', () => {
    if (document.getElementById('lock-overlay').classList.contains('hidden')) {
      if (state.grid && state.grid.length) renderGrid();
    } else {
      renderLockedGrid();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
