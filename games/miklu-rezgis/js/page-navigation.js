/* Shared by the game, child game and analytics dashboard. */
(() => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'scroll-top-button';
  button.hidden = true;
  const prefix = document.getElementById('dashboard-icon-arrow-up') ? 'dashboard-icon-' : 'i-';
  button.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><use href="#${prefix}arrow-up"></use></svg>`;
  document.body.append(button);
  let scrollTarget = window;
  const position = () => scrollTarget === window ? window.scrollY : scrollTarget.scrollTop;
  const update = () => {
    const english = document.documentElement.lang === 'en';
    button.setAttribute('aria-label', english ? 'Back to top' : 'Atgriezties augšā');
    button.title = english ? 'Back to top' : 'Atgriezties augšā';
    button.hidden = position() < 300;
  };
  document.addEventListener('scroll', event => {
    scrollTarget = event.target === document ? window : event.target;
    update();
  }, {capture: true, passive: true});
  button.addEventListener('click', () => {
    scrollTarget.scrollTo({top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
  new MutationObserver(() => {
    if (scrollTarget !== window && !scrollTarget.getClientRects().length) scrollTarget = window;
    update();
  }).observe(document.body, {attributes: true, attributeFilter: ['class', 'style'], subtree: true});
  update();
})();
