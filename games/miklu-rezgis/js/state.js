import {
  LEVEL_BASE, BONUS_RIDDLE_POINTS, MAX_LIVES, MAX_HINTS,
  STORAGE_KEY, PROGRESS_MAX_AGE_MS,
} from './constants.js';

function emptyLevels() {
  return { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [] };
}

export const state = {
  levels: emptyLevels(),
  bonusPool: [],
  levelsLoaded: false,

  gameMode: 10,
  selectedMode: 10,
  riddlesPerLevel: 10,
  maxScore: 20000,

  currentLevel: 1,
  riddleIdx: 0,
  totalScore: 0,
  levelScore: 0,
  isBonus: false,
  bonusRiddles: [],
  shuffledLevel: [],

  grid: [],
  gridSize: 7,
  placedWords: [],
  fillerCells: new Set(),
  foundWords: new Set(),
  foundCells: new Set(),
  hintedLetters: {},
  wordState: {},

  riddleScore: 0,
  livesLeft: MAX_LIVES,
  hintsLeft: MAX_HINTS,
  gameOver: false,

  dragging: false,
  dragCells: [],
  dragStart: null,

  shareText: '',

  timerSeconds: 0,
  timerHandle: null,
};

export function startTimer() {
  stopTimer();
  state.timerHandle = setInterval(() => { state.timerSeconds++; }, 1000);
}

export function stopTimer() {
  if (state.timerHandle) { clearInterval(state.timerHandle); state.timerHandle = null; }
}

export function resetTimer() {
  state.timerSeconds = 0;
}

export function basePoints() {
  return state.isBonus ? BONUS_RIDDLE_POINTS : LEVEL_BASE[state.currentLevel];
}

export function currentRiddle() {
  return state.isBonus ? state.bonusRiddles[state.riddleIdx] : state.shuffledLevel[state.riddleIdx];
}

export function resetForNewGame() {
  state.currentLevel = 1;
  state.riddleIdx = 0;
  state.totalScore = 0;
  state.levelScore = 0;
  state.isBonus = false;
  state.bonusRiddles = [];
}

export function resetRiddleState() {
  state.gameOver = false;
  state.hintsLeft = MAX_HINTS;
  state.livesLeft = MAX_LIVES;
  state.foundCells = new Set();
  state.foundWords = new Set();
  state.hintedLetters = {};
  state.wordState = {};
  state.dragCells = [];
  state.dragStart = null;
  state.dragging = false;
  state.riddleScore = basePoints();
}

export function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      gameMode: state.gameMode,
      currentLevel: state.currentLevel,
      riddleIdx: state.riddleIdx,
      totalScore: state.totalScore,
      levelScore: state.levelScore,
      isBonus: state.isBonus,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Neizdevās saglabāt progresu:', e);
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Neizdevās notīrīt saglabāto progresu:', e);
  }
}

export function readSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > PROGRESS_MAX_AGE_MS) {
      clearProgress();
      return null;
    }
    return data;
  } catch (e) {
    console.warn('Neizdevās nolasīt saglabāto progresu:', e);
    return null;
  }
}
