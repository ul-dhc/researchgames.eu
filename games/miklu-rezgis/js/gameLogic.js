import { MODE_MAX, MODE_RPL, PENALTY_WRONG, PENALTY_HINT } from './constants.js';
import {
  state, basePoints, currentRiddle, resetForNewGame, resetRiddleState,
  saveProgress, clearProgress, readSavedProgress, startTimer, stopTimer, resetTimer,
} from './state.js';
import { buildGrid, resolveGridSize, shuffleFillers } from './gridBuilder.js';
import { shuffle, norm, getWords, cellKey } from './wordUtils.js';
import { getFinalTitle, getLevelRating, getLevelMsg, generateShareText } from './messages.js';
import { loadRiddlesFromSheets } from './dataLoader.js';
import {
  renderTopBar, renderGrid, renderWordTags, renderPips, renderMiklaNum,
  setStatus, setNextEnabled,
} from './render.js';
import { hideLevelOverlay, unlockGame } from './navigation.js';

export function checkWord(cells) {
  const selected = cells.map(([r, c]) => state.grid[r][c]).join('');
  const selectedReversed = [...selected].reverse().join('');
  let matched = null, matchedWi = -1;

  for (let wi = 0; wi < state.placedWords.length; wi++) {
    const pw = state.placedWords[wi];
    if (state.foundWords.has(pw.word)) continue;
    if (pw.duplicate) continue;
    if (pw.unplaceable) continue;
    if (selected === pw.word || selectedReversed === pw.word) { matched = pw; matchedWi = wi; break; }
  }

  if (matched) {
    matched.cells.forEach(([r, c]) => state.foundCells.add(cellKey(r, c)));
    state.foundWords.add(matched.word);
    state.wordState[matchedWi] = 'found';

    for (let wi = 0; wi < state.placedWords.length; wi++) {
      const pw = state.placedWords[wi];
      if (pw.duplicate && pw.word === matched.word && state.wordState[wi] !== 'found') {
        state.wordState[wi] = 'found';
        state.foundWords.add(pw.word + ':dup:' + wi);
      }
    }

    renderGrid();
    renderWordTags();

    const allFound = state.placedWords.every((_, wi) => state.wordState[wi] === 'found');
    if (allFound) { completeRiddle(); return; }
    setStatus('Atrasts!', '');
  } else {
    flashWrong(cells);
    state.livesLeft--;
    state.totalScore = Math.max(0, state.totalScore - PENALTY_WRONG);
    state.riddleScore = Math.max(0, state.riddleScore - PENALTY_WRONG);
    renderPips();
    renderTopBar();
    if (state.livesLeft <= 0) { giveUp(); return; }
    setStatus(`Nepareizi. Vēl ${state.livesLeft} mēģinājumi.`, 'lose');
  }
}

function flashWrong(cells) {
  cells.forEach(([r, c]) => {
    const el = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (el && !state.foundCells.has(cellKey(r, c))) {
      el.classList.add('wrong-flash');
      setTimeout(() => renderGrid(), 400);
    }
  });
}

function completeRiddle() {
  state.gameOver = true;
  state.totalScore += state.riddleScore;
  state.levelScore += state.riddleScore;
  renderTopBar();
  setStatus(`Pareizi! +${state.riddleScore} punkti ✓`, 'win');
  document.getElementById('give-up-btn').disabled = true;
  document.getElementById('hint-btn').disabled = true;
  setNextEnabled(true);
  saveProgress();
}

export function giveHint() {
  if (state.hintsLeft <= 0 || state.gameOver) return;
  const words = getWords(currentRiddle().a);

  for (let wi = 0; wi < words.length; wi++) {
    const wn = norm(words[wi]);
    if (state.wordState[wi] === 'found' || state.wordState[wi] === 'given-up') continue;
    const revealed = state.hintedLetters[wi] || 0;
    if (revealed < wn.length) {
      state.hintedLetters[wi] = revealed + 1;
      state.wordState[wi] = 'hinted';
      state.hintsLeft--;
      state.totalScore = Math.max(0, state.totalScore - PENALTY_HINT);
      state.riddleScore = Math.max(0, state.riddleScore - PENALTY_HINT);
      renderPips();
      renderWordTags();
      renderTopBar();
      setStatus('Uzvedne: nākamais burts atklāts.', '');
      return;
    }
  }
}

export function giveUp() {
  if (state.gameOver) return;
  state.gameOver = true;

  getWords(currentRiddle().a).forEach((w, wi) => {
    if (state.wordState[wi] !== 'found') {
      state.wordState[wi] = 'given-up';
      state.hintedLetters[wi] = norm(w).length;
    }
  });
  state.placedWords.forEach(pw => {
    if (!state.foundWords.has(pw.word) && pw.cells) {
      pw.cells.forEach(([r, c]) => state.foundCells.add(cellKey(r, c)));
    }
  });

  renderGrid();
  renderWordTags();
  setStatus('Atminējums atklāts. 0 punkti.', 'lose');
  document.getElementById('hint-btn').disabled = true;
  document.getElementById('give-up-btn').disabled = true;
  setNextEnabled(true);
}

export function shuffleLetters() {
  if (state.gameOver) return;
  shuffleFillers(state.grid, state.placedWords, state.gridSize);
  renderGrid();
  setStatus('Burti sajaukti.', '');
}

export function nextRiddle() {
  state.riddleIdx++;
  const total = state.isBonus ? state.bonusRiddles.length : state.shuffledLevel.length;
  if (state.riddleIdx >= total) { showLevelComplete(); return; }
  loadRiddle();
}

function showLevelComplete() {
  if (state.isBonus) { showFinalResults(); return; }

  const rating = getLevelRating(state.currentLevel, state.levelScore, state.riddlesPerLevel);
  const { badge, msg } = getLevelMsg(state.currentLevel, rating);
  document.getElementById('lo-title').textContent = `${state.currentLevel}. līmenis pabeigts`;
  document.getElementById('lo-score').textContent = `${state.totalScore.toLocaleString('lv-LV')} punkti`;
  document.getElementById('lo-badge').textContent = badge;

  const msgEl = document.getElementById('lo-msg');
  msgEl.textContent = state.gameMode === 100 ? msg : '';
  msgEl.style.marginBottom = state.gameMode === 100 ? '1.5rem' : '0.5rem';

  if (state.currentLevel === 10) {
    showBonusChoice();
    return;
  }

  const btn = document.getElementById('lo-btn');
  btn.textContent = `Uz ${state.currentLevel + 1}. līmeni →`;
  btn.onclick = () => { hideLevelOverlay(); state.currentLevel++; startLevel(); };
  document.getElementById('level-overlay').classList.add('show');
}

export function showBonusChoice() {
  hideLevelOverlay();
  document.getElementById('bo-score').textContent = `${state.totalScore.toLocaleString('lv-LV')} punkti`;
  const rating = getLevelRating(10, state.levelScore, state.riddlesPerLevel);
  const { badge } = getLevelMsg(10, rating);
  const badgeEl = document.getElementById('bo-badge');
  if (badgeEl) badgeEl.textContent = badge;
  document.getElementById('bonus-overlay').classList.add('show');
}

export function startBonusRound() {
  state.isBonus = true;
  state.bonusRiddles = shuffle([...state.bonusPool]).slice(0, 2);
  state.riddleIdx = 0;
  state.levelScore = 0;
  loadRiddle();
}

export function showFinalResults() {
  stopTimer();
  clearProgress();
  ['level-overlay', 'bonus-overlay', 'restart-overlay'].forEach(id => {
    document.getElementById(id)?.classList.remove('show');
  });

  const final = getFinalTitle(state.totalScore, state.maxScore);
  document.getElementById('fo-score').textContent =
    `${state.totalScore.toLocaleString('lv-LV')} / ${state.maxScore.toLocaleString('lv-LV')} punkti`;
  document.getElementById('fo-title').textContent = final.title;
  document.getElementById('fo-msg').textContent = final.msg;

  state.shareText = generateShareText(state.totalScore, state.maxScore, final.title, state.gameMode);
  document.getElementById('share-box').textContent = state.shareText;
  document.getElementById('copy-confirm').textContent = '';
  document.getElementById('final-overlay').classList.add('show');
}

export function copyShare() {
  const confirmEl = document.getElementById('copy-confirm');
  const announce = () => {
    confirmEl.textContent = '✓ Nokopēts!';
    setTimeout(() => { confirmEl.textContent = ''; }, 2500);
  };

  navigator.clipboard.writeText(state.shareText).then(announce).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = state.shareText;
    ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    announce();
  });
}

export function startMode(mode) {
  const startBtn = document.getElementById('start-btn');
  startBtn.disabled = true;
  state.gameMode = mode;
  state.riddlesPerLevel = MODE_RPL[mode];
  state.maxScore = MODE_MAX[mode];
  resetForNewGame();
  resetTimer();
  loadRiddlesFromSheets(() => {
    startLevel();
    unlockGame();
    startTimer();
    startBtn.disabled = false;
  });
}

function startLevel() {
  state.shuffledLevel = shuffle([...state.levels[state.currentLevel]]).slice(0, state.riddlesPerLevel);
  state.riddleIdx = 0;
  state.levelScore = 0;
  loadRiddle();
}

export function loadRiddle() {
  resetRiddleState();
  setStatus('', '');
  const riddle = currentRiddle();
  document.getElementById('riddle-text').textContent = riddle.q;
  document.getElementById('riddle-meta').textContent = riddle.loc ? '📍 ' + riddle.loc : '';

  state.gridSize = resolveGridSize(state.currentLevel, riddle.a);
  const { grid, placedWords, fillerCells } = buildGrid(riddle.a, state.gridSize);
  state.grid = grid;
  state.placedWords = placedWords;
  state.fillerCells = fillerCells;

  placedWords.forEach((pw, wi) => {
    if (pw.unplaceable) {
      state.wordState[wi] = 'found';
      state.foundWords.add(pw.word + ':unplaceable:' + wi);
    }
  });

  renderGrid();
  renderWordTags();
  renderPips();
  renderTopBar();
  renderMiklaNum();

  document.getElementById('give-up-btn').disabled = false;
  document.getElementById('hint-btn').disabled = false;
  setNextEnabled(false);
}

export function loadSavedProgress() {
  const data = readSavedProgress();
  if (!data) { startMode(state.gameMode); return; }

  try {
    state.gameMode = data.gameMode || 10;
    state.riddlesPerLevel = MODE_RPL[state.gameMode];
    state.maxScore = MODE_MAX[state.gameMode];
    state.currentLevel = data.currentLevel || 1;
    state.totalScore = data.totalScore || 0;
    state.levelScore = data.levelScore || 0;
    state.isBonus = data.isBonus || false;

    resetTimer();

    loadRiddlesFromSheets(() => {
      if (state.isBonus) {
        state.bonusRiddles = shuffle([...state.bonusPool]).slice(0, 2);
        state.riddleIdx = 0;
      } else {
        state.shuffledLevel = shuffle([...state.levels[state.currentLevel]]).slice(0, state.riddlesPerLevel);
        state.riddleIdx = Math.min(data.riddleIdx || 0, state.shuffledLevel.length - 1);
      }
      loadRiddle();
      unlockGame();
      startTimer();
    });
  } catch (e) {
    console.warn('Neizdevās atjaunot saglabāto spēli, sāku no jauna:', e);
    startMode(10);
  }
}
