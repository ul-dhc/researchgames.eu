import { MAX_LIVES, MAX_HINTS } from './constants.js';
import { state, currentRiddle } from './state.js';
import { cellSizePx } from './gridBuilder.js';
import { getWords, norm, cellKey } from './wordUtils.js';

export function renderTopBar() {
  const badge = document.getElementById('level-badge');
  badge.className = 'level-pill' + (state.isBonus ? ' bonus' : '');
  badge.textContent = state.isBonus ? '⭐ Bonusa kārta' : `${state.currentLevel}. līmenis`;
  document.getElementById('score-display').textContent = state.totalScore.toLocaleString('lv-LV');
  document.getElementById('score-max').textContent = `/ ${state.maxScore.toLocaleString('lv-LV')}`;
  document.getElementById('progress-bar').style.width =
    Math.min(100, (state.totalScore / state.maxScore) * 100) + '%';
}

export function renderTimer() {
  const el = document.getElementById('timer-display');
  if (!el) return;
  const total = state.timerSeconds || 0;
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  el.textContent = `${m}:${s}`;
}

export function renderMiklaNum() {
  const total = state.isBonus ? state.bonusRiddles.length : state.shuffledLevel.length;
  document.getElementById('mikla-num').textContent = `${state.riddleIdx + 1} / ${total}`;
}

export function renderGrid() {
  const size = state.gridSize;
  const cs = cellSizePx(size);
  const el = document.getElementById('grid');
  el.style.gridTemplateColumns = `repeat(${size},${cs}px)`;
  el.style.gap = '3px';
  el.innerHTML = '';

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const d = document.createElement('div');
      const k = cellKey(r, c);
      let cls = 'cell';
      if (state.foundCells.has(k)) cls += ' found';
      else if (state.fillerCells.has(k)) cls += ' filler';
      if (state.dragCells.some(([dr, dc]) => dr === r && dc === c) && !state.foundCells.has(k)) {
        cls += ' highlight';
      }
      d.className = cls;
      const fontSize = cs <= 26 ? 11 : cs <= 32 ? 13 : cs <= 38 ? 14 : 16;
      d.style.cssText = `width:${cs}px;height:${cs}px;font-size:${fontSize}px;`;
      d.textContent = state.grid[r][c];
      d.dataset.r = r;
      d.dataset.c = c;
      el.appendChild(d);
    }
  }
}

export function renderWordTags() {
  const el = document.getElementById('words-row');
  el.innerHTML = '';
  getWords(currentRiddle().a).forEach((w, wi) => {
    const wn = norm(w);
    const wState = state.wordState[wi] || 'normal';
    const revealed = state.hintedLetters[wi] || 0;

    const group = document.createElement('div');
    group.className = 'word-group';
    const boxes = document.createElement('div');
    boxes.className = 'letter-boxes';

    for (let i = 0; i < wn.length; i++) {
      const box = document.createElement('div');
      if (wState === 'found') { box.className = 'letter-box found'; box.textContent = w[i]; }
      else if (wState === 'given-up') { box.className = 'letter-box given-up'; box.textContent = w[i]; }
      else if (i < revealed) { box.className = 'letter-box hinted'; box.textContent = w[i]; }
      else { box.className = 'letter-box'; box.textContent = ''; }
      boxes.appendChild(box);
    }
    group.appendChild(boxes);
    el.appendChild(group);
  });
}

export function renderPips() {
  const headerHintsEl = document.getElementById('hints-display');
  if (headerHintsEl) headerHintsEl.textContent = state.hintsLeft;

  const hintsEl = document.getElementById('hints-left-badge');
  if (hintsEl) hintsEl.textContent = state.hintsLeft;

  document.getElementById('hint-btn').disabled = state.hintsLeft <= 0 || state.gameOver;
}

export function setStatus(msg, cls) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status-line' + (cls ? ' ' + cls : '');
}

export function setNextEnabled(val) {
  document.getElementById('next-btn').disabled = !val;
}
