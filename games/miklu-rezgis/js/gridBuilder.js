import { DIRS, LV_ALPHABET } from './constants.js';
import { FILLER_WORDS } from './riddleData.js';
import { shuffle, norm, getWords, cellKey } from './wordUtils.js';

const MAX_GRID_SIZE = 16;

export function computeGridSize(level) {
  if (level === 1) return 7;
  if (level <= 4) return 9;
  return 11;
}

export function resolveGridSize(level, answer) {
  const base = computeGridSize(level);
  const words = getWords(answer).map(w => norm(w).length);
  const longest = words.length ? Math.max(...words) : 0;
  return Math.min(Math.max(base, longest), MAX_GRID_SIZE);
}

export function cellSizePx(size) {
  const maxWidth = Math.min(window.innerWidth, 520) - 32;
  const widthSize = Math.floor((maxWidth - (size - 1) * 3) / size);
  const cap = size === 7 ? 58 : size === 9 ? 48 : 38;
  const gridStageHeight = document.querySelector('.grid-stage')?.clientHeight || 0;
  const gridHeight = window.innerWidth >= 1100
    ? (gridStageHeight > 120 ? gridStageHeight - 76 : Math.max(230, window.innerHeight - 500))
    : window.innerHeight * 0.62;
  const heightSize = Math.floor((gridHeight - (size - 1) * 3) / size);
  return Math.max(24, Math.min(widthSize, heightSize, cap));
}

export function fillerCount(size) {
  if (size <= 7) return 3;
  if (size <= 9) return 5;
  return 7;
}

function tryPlace(grid, word, size, markSet) {
  const wlen = word.length;
  for (let attempt = 0; attempt < 500; attempt++) {
    const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
    const rMin = dr > 0 ? 0 : dr < 0 ? wlen - 1 : 0;
    const rMax = dr > 0 ? size - wlen : dr < 0 ? size - 1 : size - 1;
    const cMin = dc > 0 ? 0 : dc < 0 ? wlen - 1 : 0;
    const cMax = dc > 0 ? size - wlen : dc < 0 ? size - 1 : size - 1;
    if (rMin > rMax || cMin > cMax) continue;

    const sr = rMin + Math.floor(Math.random() * (rMax - rMin + 1));
    const sc = cMin + Math.floor(Math.random() * (cMax - cMin + 1));

    const cells = [];
    let valid = true;
    for (let i = 0; i < wlen; i++) {
      const r = sr + dr * i, c = sc + dc * i;
      if (r < 0 || r >= size || c < 0 || c >= size) { valid = false; break; }
      if (grid[r][c] !== '' && grid[r][c] !== word[i]) { valid = false; break; }
      cells.push([r, c]);
    }
    if (valid) {
      for (let i = 0; i < wlen; i++) grid[cells[i][0]][cells[i][1]] = word[i];
      if (markSet) cells.forEach(([r, c]) => markSet.add(cellKey(r, c)));
      return cells;
    }
  }
  return null;
}

export function shuffleFillers(grid, placedWords, size) {
  const protectedCells = new Set();
  placedWords.forEach(pw => {
    if (pw.cells) pw.cells.forEach(([r, c]) => protectedCells.add(cellKey(r, c)));
  });
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (protectedCells.has(cellKey(r, c))) continue;
      grid[r][c] = LV_ALPHABET[Math.floor(Math.random() * LV_ALPHABET.length)];
    }
  }
  return grid;
}

export function buildGrid(answer, size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(''));
  const placedWords = [];
  const fillerCells = new Set();
  const usedWords = new Set();

  for (const word of getWords(answer)) {
    const wn = norm(word);
    if (usedWords.has(wn)) {
      placedWords.push({ word: wn, cells: null, duplicate: true });
      continue;
    }
    if (wn.length > size) {
      placedWords.push({ word: wn, cells: null, unplaceable: true });
      continue;
    }
    const cells = tryPlace(grid, wn, size, null);
    if (cells) { placedWords.push({ word: wn, cells }); usedWords.add(wn); }
    else placedWords.push({ word: wn, cells: null, unplaceable: true });
  }

  const candidates = shuffle([...FILLER_WORDS].filter(w => w.length <= size));
  for (const fw of candidates.slice(0, fillerCount(size))) {
    if (usedWords.has(fw)) continue;
    const cells = tryPlace(grid, fw, size, fillerCells);
    if (cells) usedWords.add(fw);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) grid[r][c] = LV_ALPHABET[Math.floor(Math.random() * LV_ALPHABET.length)];
    }
  }

  return { grid, placedWords, fillerCells };
}
