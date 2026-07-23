const THEME_KEY = 'lmg_theme';
const FONT_SIZE_KEY = 'lmg_font_size';
const FONT_SIZES = ['small', 'medium', 'large', 'extra-large'];

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
}

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function toggleTheme() {
  applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
}

export function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    applyTheme('light');
  }

  document.querySelectorAll('.theme-switch .sw').forEach(sw => {
    sw.addEventListener('click', toggleTheme);
  });
}

function applyFontSize(size) {
  const safeSize = FONT_SIZES.includes(size) ? size : 'medium';
  document.documentElement.setAttribute('data-font-size', safeSize);
  const index = FONT_SIZES.indexOf(safeSize);
  document.getElementById('font-decrease-btn').disabled = index === 0;
  document.getElementById('font-increase-btn').disabled = index === FONT_SIZES.length - 1;
  try { localStorage.setItem(FONT_SIZE_KEY, safeSize); } catch (e) { /* ignore */ }
}

export function initFontSizeControls() {
  let saved = 'medium';
  try { saved = localStorage.getItem(FONT_SIZE_KEY) || 'medium'; } catch (e) { /* ignore */ }
  applyFontSize(saved);
  document.getElementById('font-decrease-btn').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-font-size') || 'medium';
    applyFontSize(FONT_SIZES[Math.max(0, FONT_SIZES.indexOf(current) - 1)]);
  });
  document.getElementById('font-increase-btn').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-font-size') || 'medium';
    applyFontSize(FONT_SIZES[Math.min(FONT_SIZES.length - 1, FONT_SIZES.indexOf(current) + 1)]);
  });
}
