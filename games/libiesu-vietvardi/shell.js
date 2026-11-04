(() => {
  'use strict';
  const root = document.documentElement;
  const sizes = ['normal', 'large', 'xlarge'];
  const en = () => root.lang === 'en';
  const icon = id => `<svg width="18" height="18" aria-hidden="true"><use href="vendor/lucide-icons.svg#${id}"/></svg>`;
  function localize(container) {
    const lang = en() ? 'en' : 'lv';
    container.querySelectorAll('[data-lv][data-en]').forEach(el => { el.textContent = el.dataset[lang]; });
    container.querySelectorAll('[data-logo-lang]').forEach(el => { el.hidden = el.dataset.logoLang !== lang; });
    container.querySelectorAll('[data-copy-lang]').forEach(el => { el.hidden = el.dataset.copyLang !== lang; });
    container.querySelectorAll('[data-aria-lv][data-aria-en]').forEach(el => el.setAttribute('aria-label', el.dataset[en() ? 'ariaEn' : 'ariaLv']));
    container.querySelectorAll('[data-livonian-footer-link]').forEach(el => { el.href = en() ? 'https://www.livonian.lv/en/home/' : 'https://www.livonian.lv/lv/sakums/'; });
    const more = container.querySelector('.about-more');
    if (more) more.href = en() ? 'https://fennougria.ee/en/peoples/baltic-finnic-peoples/livonians/' : 'https://livones.net';
    const faculty = container.querySelector('.partner-logo-link--faculty');
    if (faculty) faculty.href = en() ? 'https://www.hzf.lu.lv/en/' : 'https://www.hzf.lu.lv/';
  }
  function updateControls() {
    const current = sizes.indexOf(root.dataset.textSize);
    document.querySelectorAll('.font-increase').forEach(button => {
      const label = en() ? `Change text size (${current + 1} of 3)` : `Mainīt teksta izmēru (${current + 1} no 3)`;
      button.title = label;
      button.setAttribute('aria-label', label);
    });
    document.querySelectorAll('.header-theme-toggle').forEach(button => {
      const light = root.dataset.theme === 'light';
      const label = en() ? (light ? 'Switch to dark mode' : 'Switch to light mode') : (light ? 'Ieslēgt tumšo režīmu' : 'Ieslēgt gaišo režīmu');
      button.setAttribute('aria-checked', String(light));
      button.setAttribute('aria-label', label);
      button.title = label;
    });
  }
  if (!sizes.includes(root.dataset.textSize)) root.dataset.textSize = sizes.includes(localStorage.getItem('liv-game-text-size')) ? localStorage.getItem('liv-game-text-size') : 'normal';
  // Keep the same control order in every header: language, A+, theme, information, restart.
  document.querySelectorAll('.topbar').forEach(header => {
    const controls = header.querySelector('.header-settings,.game-header-controls');
    if (!controls) return;
    const lang = controls.querySelector('.lang-switch');
    if (lang) controls.prepend(lang);
    if (!controls.querySelector('.about-icon-link')) {
      const info = document.createElement('a');
      info.className = 'about-icon-link';
      info.href = 'about.html';
      info.innerHTML = icon('i-info');
      info.setAttribute('aria-label', en() ? 'About this game' : 'Par šo spēli');
      controls.append(info);
    }
  });
  localize(document);
  updateControls();
  new MutationObserver(() => { localize(document); updateControls(); }).observe(root, { attributes: true, attributeFilter: ['lang', 'data-theme', 'data-text-size'] });
  let pendingAbout = null;
  let aboutFrame = null;
  let header = null;
  let headerHome = null;
  let opener = null;
  let savedScroll = 0;
  function closeAbout() {
    if (!aboutFrame) return;
    aboutFrame.remove();
    aboutFrame = null;
    headerHome.replaceWith(header);
    headerHome = null;
    document.body.classList.remove('about-open');
    document.dispatchEvent(new Event('livonian:about-close'));
    window.scrollTo(0, savedScroll);
    opener?.focus({ preventScroll: true });
  }
  async function openAbout(link) {
    if (aboutFrame || pendingAbout) return;
    const target = new URL(link.href, location.href);
    pendingAbout = fetch(target, { cache: 'no-cache' }).then(response => {
      if (!response.ok) throw new Error('About content unavailable');
      return response.text();
    });
    try {
      const markup = await pendingAbout;
      const page = new DOMParser().parseFromString(markup, 'text/html');
      const main = page.querySelector('.about-main');
      if (!main) throw new Error('About content missing');
      opener = link;
      savedScroll = window.scrollY;
      aboutFrame = document.importNode(main, true);
      aboutFrame.id = 'about-screen';
      aboutFrame.setAttribute('aria-label', en() ? 'About the game' : 'Par spēli');
      header = document.querySelector('.screen:not(.hidden) .topbar');
      headerHome = document.createComment('game header');
      header.before(headerHome);
      document.body.prepend(header);
      document.querySelector('.site-footer').before(aboutFrame);
      localize(aboutFrame);
      document.body.classList.add('about-open');
      document.dispatchEvent(new Event('livonian:about-open'));
      window.scrollTo(0, 0);
      aboutFrame.querySelector('.about-close-top').focus({ preventScroll: true });
    } catch {
      location.href = target.href;
    } finally {
      pendingAbout = null;
    }
  }
  // The brand closes About before the game's restart handler can run.
  document.addEventListener('click', event => {
    if (!aboutFrame || !event.target.closest('.topbar .brand')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeAbout();
  }, true);
  document.querySelectorAll('.topbar .brand:not(a)').forEach(brand => {
    brand.setAttribute('role', 'button');
    brand.tabIndex = 0;
    brand.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      brand.click();
    });
  });
  document.addEventListener('click', event => {
    const font = event.target.closest('.font-increase');
    if (font) {
      const index = sizes.indexOf(root.dataset.textSize);
      root.dataset.textSize = sizes[(index + 1) % sizes.length];
      localStorage.setItem('liv-game-text-size', root.dataset.textSize);
      document.dispatchEvent(new Event('livonian:text-size'));
      window.dispatchEvent(new Event('resize'));
      return;
    }
    const close = event.target.closest('.about-close');
    if (close && aboutFrame) { event.preventDefault(); closeAbout(); return; }
    const link = event.target.closest('[data-about-link],.about-icon-link');
    if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
      if (document.body.classList.contains('about-page')) { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      event.preventDefault();
      openAbout(link);
    }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAbout(); });
})();
