const DHC_WISH_WALL_URLS = {
  lv: 'https://dhc.lu.lv/LU107/#apsveikumi',
  en: 'https://dhc.lu.lv/LU107/#greetings'
};
const DHC_PROJECT_URLS = {
  lv: 'https://dhc.lu.lv/LU107/#lv',
  en: 'https://dhc.lu.lv/LU107/#en'
};
const WALL_LABEL = /^(Apsveikumu siena|Birthday wall)$/i;

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

function labelProjectLink() {
  const link = document.querySelector('.luHeader');
  if (!link) return;
  const isEnglish = getCurrentLanguage() === 'en';
  link.setAttribute('href', DHC_PROJECT_URLS[isEnglish ? 'en' : 'lv']);
  link.setAttribute('aria-label', isEnglish ? 'Back to the UL107 website' : 'Atpakaļ uz LU107 mājaslapu');
  link.setAttribute('title', isEnglish ? 'Back to the UL107 website' : 'Atpakaļ uz LU107 mājaslapu');
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
  }
});
labelProjectLink();
forwardLegacyWallHash();
