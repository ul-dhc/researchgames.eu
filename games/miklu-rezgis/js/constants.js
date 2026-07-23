export const RIDDLES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSrAe1vIq__WSCT4FUOA2gHDlkL4g7RCm43CJEDAdvKRzbRulSpqHjGwtXBGot0mgWO4yLYUuc7RMJ-/pub?output=csv';

export const LEVEL_BASE = [0, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 500];
export const BONUS_RIDDLE_POINTS = 500;

export const MODE_MAX = { 10: 2900, 50: 10500, 100: 20000 };
export const MODE_RPL = { 10: 1, 50: 5, 100: 10 };

export const MODE_NAMES = { 10: 'Ātrā spēle', 50: 'Vidējā spēle', 100: 'Garā spēle' };

export const MAX_LIVES = 3;
export const MAX_HINTS = 3;
export const PENALTY_WRONG = 15;
export const PENALTY_HINT = 25;

export const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

export const LV_ALPHABET = 'AĀBCČDEĒFGĢHIĪJKĶLĻMNŅOPRSŠTUŪVZŽ';

export const STORAGE_KEY = 'lmg_progress';
export const PROGRESS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
