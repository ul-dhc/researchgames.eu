/* Adapted from the actual RG Livonian shell.js updateControls/text-size cycle
   and Mīklu režģis applyFontSize/theme controls. See RG-SHELL.md. */
(() => {
  'use strict';
  if (['1', 'wordnet'].includes(new URLSearchParams(location.search).get('legacy'))) return;
  const root = document.documentElement;
  const sizes = ['normal', 'large', 'xlarge'];
  const KEY = 'rg-uzmini-vardu-appearance-v1';
  const font = document.getElementById('font-increase-btn');
  const theme = document.getElementById('sw-theme');
  const status = document.getElementById('appearance-status');
  let prefs = {theme: 'light', textSize: 'normal'};
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && ['light', 'dark'].includes(saved.theme)) prefs.theme = saved.theme;
    if (saved && sizes.includes(saved.textSize)) prefs.textSize = saved.textSize;
  } catch (_) { /* Appearance remains usable without storage. */ }
  function apply(save) {
    root.dataset.theme = prefs.theme;
    root.dataset.textSize = prefs.textSize;
    const index = sizes.indexOf(prefs.textSize);
    const fontLabel = `Mainīt teksta izmēru (${index + 1} no 3; pašlaik: ${['parasts', 'liels', 'ļoti liels'][index]})`;
    font.title = fontLabel;
    font.setAttribute('aria-label', fontLabel);
    const light = prefs.theme === 'light';
    const label = light ? 'Ieslēgt tumšo režīmu' : 'Ieslēgt gaišo režīmu';
    theme.setAttribute('aria-checked', String(!light));
    theme.setAttribute('aria-label', label);
    theme.title = label;
    if (save) {
      status.textContent = `Teksta izmērs: ${['parasts', 'liels', 'ļoti liels'][index]}. ${light ? 'Gaišais' : 'Tumšais'} režīms.`;
      try { localStorage.setItem(KEY, JSON.stringify(prefs)); }
      catch (_) { status.textContent += ' Izskata iestatījumi šoreiz nav saglabāti.'; }
    }
  }
  font.addEventListener('click', () => {
    prefs.textSize = sizes[(sizes.indexOf(prefs.textSize) + 1) % sizes.length];
    apply(true);
  });
  theme.addEventListener('click', () => {
    prefs.theme = prefs.theme === 'light' ? 'dark' : 'light';
    apply(true);
  });
  apply(false);
})();
