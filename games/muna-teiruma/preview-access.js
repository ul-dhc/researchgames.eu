// Temporary preview gate. Remove for public launch; see PUBLICATION_CHECKLIST.md.
(() => {
  'use strict';
  const passwordDigest = '0c064e6e07e4a7951e0050e44a1c440fc36d6266bd6a1c6a3a485ac63d5418ea';
  const sessionKey = 'rg-muns-teirums-preview';
  const gate = document.getElementById('preview-access');
  const form = document.getElementById('preview-access-form');
  const input = document.getElementById('preview-password');
  const button = document.getElementById('preview-unlock');
  const message = document.getElementById('preview-access-message');
  const background = [...document.querySelectorAll('[data-preview-background]')];
  // Keep keyboard focus inside the preview even in browsers without native inert support.
  function containFocus(event) {
    if (!gate.hidden && !gate.contains(event.target)) input.focus({ preventScroll: true });
  }
  document.addEventListener('focusin', containFocus, true);
  gate.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...gate.querySelectorAll('a[href], input, button:not(:disabled)')];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  function unlock() {
    document.documentElement.classList.remove('preview-locked');
    gate.hidden = true;
    background.forEach(element => { element.removeAttribute('inert'); element.removeAttribute('aria-hidden'); });
    document.removeEventListener('focusin', containFocus, true);
    input.value = '';
    document.getElementById('start-game').focus({ preventScroll: true });
  }
  try {
    if (sessionStorage.getItem(sessionKey) === passwordDigest) { unlock(); return; }
  } catch { /* Access also works without browser storage. */ }
  button.disabled = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    button.disabled = true; message.textContent = '';
    input.removeAttribute('aria-invalid');
    try {
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.value));
      const candidate = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
      if (candidate !== passwordDigest) {
        message.textContent = 'Nepareiza parole. Mēģini vēlreiz.';
        input.setAttribute('aria-invalid', 'true'); input.focus(); input.select();
        return;
      }
      try { sessionStorage.setItem(sessionKey, passwordDigest); } catch { /* Optional session persistence. */ }
      unlock();
    } catch {
      message.textContent = 'Neizdevās pārbaudīt paroli. Mēģini atvērt lapu vēlreiz.';
    } finally { button.disabled = false; }
  });
})();
