(() => {
  const dialog = document.createElement('dialog');
  dialog.className = 'game-confirm';
  dialog.setAttribute('aria-labelledby', 'game-confirm-title');
  dialog.setAttribute('aria-describedby', 'game-confirm-description');
  dialog.innerHTML = `<form method="dialog">
    <button class="game-confirm-close" value="cancel" type="submit"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
    <div class="game-confirm-icon" aria-hidden="true"><svg width="26" height="26"><use href="vendor/lucide-icons.svg#i-restart-play"/></svg></div>
    <h2 id="game-confirm-title"></h2>
    <p id="game-confirm-description"></p>
    <div class="game-confirm-actions">
      <button class="btn btn-ghost" value="cancel" autofocus type="submit" data-confirm-cancel></button>
      <button class="btn btn-primary" value="accept" type="submit" data-confirm-accept></button>
    </div>
  </form>`;
  document.body.append(dialog);
  window.LivonianConfirm = {
    ask({ title, description, accept, cancel, close }) {
      if (dialog.open) return Promise.resolve(false);
      const trigger = document.activeElement;
      dialog.querySelector('h2').textContent = title;
      dialog.querySelector('p').textContent = description;
      dialog.querySelector('[data-confirm-accept]').textContent = accept;
      dialog.querySelector('[data-confirm-cancel]').textContent = cancel;
      dialog.querySelector('.game-confirm-close').setAttribute('aria-label', close);
      dialog.returnValue = 'cancel';
      return new Promise(resolve => {
        dialog.addEventListener('close', () => {
          trigger?.focus({ preventScroll: true });
          resolve(dialog.returnValue === 'accept');
        }, { once: true });
        dialog.showModal();
      });
    },
  };
})();
