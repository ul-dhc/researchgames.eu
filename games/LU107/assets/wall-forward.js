const DHC_WISH_WALL_URLS = {
  lv: 'https://dhc.lu.lv/LU107/#apsveikumi',
  en: 'https://dhc.lu.lv/LU107/#greetings'
};
const WALL_LABEL = /^(Apsveikumu siena|Birthday wall)$/i;

function getDhcWishWallUrl(control) {
  if (/Birthday wall/i.test(control?.textContent || '')) return DHC_WISH_WALL_URLS.en;
  try {
    if (localStorage.getItem('lu107-language') === 'en') return DHC_WISH_WALL_URLS.en;
  } catch {}
  return DHC_WISH_WALL_URLS.lv;
}

function openDhcWishWall(control) {
  const url = getDhcWishWallUrl(control);
  if (window.top && window.top !== window) {
    window.top.location.assign(url);
    return;
  }
  window.location.assign(url);
}

function forwardLegacyWallHash() {
  if (window.location.hash.toLowerCase() === '#apsveikumi') {
    openDhcWishWall();
  }
}

document.addEventListener('click', event => {
  const control = event.target.closest('a, button');
  if (!control) return;

  const href = control.getAttribute('href') || '';
  const isWallControl = WALL_LABEL.test(control.textContent.trim()) || href.endsWith('#apsveikumi');
  if (!isWallControl) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  openDhcWishWall(control);
}, true);

window.addEventListener('hashchange', forwardLegacyWallHash);
forwardLegacyWallHash();
