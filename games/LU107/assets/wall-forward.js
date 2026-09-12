const DHC_WISH_WALL_URLS = {
  lv: 'https://dhc.lu.lv/LU107/#apsveikumi',
  en: 'https://dhc.lu.lv/LU107/#greetings'
};
const DHC_PROJECT_URLS = {
  lv: 'https://dhc.lu.lv/LU107/#lv',
  en: 'https://dhc.lu.lv/LU107/#en'
};
const WALL_LABEL = /^(Apsveikumu siena|Birthday wall)$/i;

function applyRequestedLanguage() {
  const language = new URLSearchParams(window.location.search).get('lang');
  if (language !== 'lv' && language !== 'en') return;
  try {
    localStorage.setItem('lu107-language', language);
  } catch {}
}

applyRequestedLanguage();

function getCurrentLanguage(control) {
  if (/Birthday wall/i.test(control?.textContent || '')) return 'en';
  try {
    if (localStorage.getItem('lu107-language') === 'en') return 'en';
  } catch {}
  return 'lv';
}

function getDhcWishWallUrl(control) {
  return DHC_WISH_WALL_URLS[getCurrentLanguage(control)];
}

function openDhcWishWall(control) {
  const url = getDhcWishWallUrl(control);
  if (window.top && window.top !== window) {
    window.top.location.assign(url);
    return;
  }
  window.location.assign(url);
}

function openDhcProject(control) {
  const url = DHC_PROJECT_URLS[getCurrentLanguage(control)];
  if (window.top && window.top !== window) {
    window.top.location.assign(url);
    return;
  }
  window.location.assign(url);
}

function ensureProjectBackLink() {
  const logo = document.querySelector('.luHeader');
  const header = logo?.closest('header');
  if (!logo || !header) return null;
  let link = header.querySelector('.projectBackLink');
  if (link) return link;
  link = document.createElement('a');
  link.className = 'projectBackLink';
  link.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg><span></span>';
  logo.insertAdjacentElement('afterend', link);
  return link;
}

function labelProjectLink() {
  const link = document.querySelector('.luHeader');
  if (!link) return;
  const isEnglish = getCurrentLanguage() === 'en';
  const url = DHC_PROJECT_URLS[isEnglish ? 'en' : 'lv'];
  const label = isEnglish ? 'Back to the LU-107 website' : 'Atpakaļ uz LU-107 vietni';
  const backLink = ensureProjectBackLink();
  const homeLabel = isEnglish ? 'Go to the game start' : 'Doties uz spēles sākumu';
  link.setAttribute('href', './');
  link.setAttribute('aria-label', homeLabel);
  link.setAttribute('title', homeLabel);
  if (backLink) {
    backLink.href = url;
    backLink.setAttribute('aria-label', label);
    backLink.setAttribute('title', label);
    const text = backLink.querySelector('span');
    if (text) text.textContent = isEnglish ? 'LU-107 website' : 'LU-107 vietne';
  }
}

function forwardLegacyWallHash() {
  if (window.location.hash.toLowerCase() === '#apsveikumi') {
    openDhcWishWall();
  }
}

document.addEventListener('click', event => {
  const control = event.target.closest('a, button');
  if (!control) return;

  if (control.matches('.luHeader')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign('./');
    return;
  }

  if (control.matches('.projectBackLink')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openDhcProject(control);
    return;
  }

  const href = control.getAttribute('href') || '';
  const isWallControl = WALL_LABEL.test(control.textContent.trim()) || href.endsWith('#apsveikumi');
  if (!isWallControl) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  openDhcWishWall(control);
}, true);

window.addEventListener('hashchange', forwardLegacyWallHash);
window.addEventListener('load', labelProjectLink);
document.addEventListener('click', event => {
  if (event.target.closest('.tools button[aria-label*="English"], .tools button[aria-label*="valodu"]')) {
    setTimeout(labelProjectLink, 0);
    setTimeout(labelProjectLink, 120);
  }
});
const projectLinkObserver = new MutationObserver(() => {
  if (document.querySelector('.luHeader') && !document.querySelector('.projectBackLink')) {
    labelProjectLink();
  }
});
projectLinkObserver.observe(document.documentElement, { childList: true, subtree: true });
labelProjectLink();
setTimeout(labelProjectLink, 250);
forwardLegacyWallHash();
