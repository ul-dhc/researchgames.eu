import { createPlantAnalytics } from './analytics.mjs';
// Adapted from the RG landing page's memory-game.js: paired cards, two flips,
// a mismatch lock, shuffled replay, progress and an end state.
import { t } from './translations.mjs';
import { plants } from './plants.js';
import { icons } from './icons.js';
import { makeDeck, createGame, selectCard, resolveMismatch, scoreFor, sampleMeadow, prepareMeadowNames, timeBonusFor, shareResultFor, fitBoardLayout } from './game-model.mjs';

// Keep a small in-memory queue while the existing GoatCounter script loads.
const plantEvents=[];
const analytics=createPlantAnalytics(event=>{plantEvents.push(event);flushPlantEvents();});
function flushPlantEvents(){
  if(typeof window.goatcounter?.count!=='function')return;
  while(plantEvents.length)window.goatcounter.count(plantEvents.shift());
}
const analyticsWait=setInterval(flushPlantEvents,1000);
setTimeout(()=>clearInterval(analyticsWait),30000);
const $ = id => document.getElementById(id);
const grid = $('memory-grid');
// Keep settings in the header, leaving a stable playing area below them.
const boardTools = document.querySelector('.board-tools');
document.querySelector('.site-header').append(boardTools);
for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n, { augu_skaits: 8 });
for (const node of document.querySelectorAll('[data-i18n-text]')) node.firstChild.textContent = t(node.dataset.i18nText) + ' ';
for (const node of document.querySelectorAll('[data-i18n-aria]')) node.setAttribute('aria-label', t(node.dataset.i18nAria));
for (const node of document.querySelectorAll('[data-i18n-content]')) node.content = t(node.dataset.i18nContent);
for (const id of ['toggle-time', 'toggle-points']) $(id).title = $(id).getAttribute('aria-label');
for (const node of document.querySelectorAll('[data-pair-count]')) node.setAttribute('aria-label', t('09.05', { skaits: node.dataset.pairCount }));

function setLargeText(enabled) {
  document.documentElement.classList.toggle('large-text', enabled);
  const label = t(enabled ? '01.13' : '01.12');
  $('toggle-font-size').setAttribute('aria-pressed', String(enabled));
  $('toggle-font-size').setAttribute('aria-label', label);
  $('toggle-font-size').title = label;
}
try { setLargeText(localStorage.getItem('rg-plant-large-text') === 'true'); } catch { setLargeText(false); }
$('toggle-font-size').addEventListener('click', () => {
  const enabled = !document.documentElement.classList.contains('large-text');
  setLargeText(enabled);
  try { localStorage.setItem('rg-plant-large-text', String(enabled)); } catch { /* Optional preference persistence. */ }
});

let game = null, mode = 'preview', mismatchTimeout, finishTimeout, timer;
let elapsed = 0, runningSince = null, aboutPaused = false;
let meadow = [], previousMeadow = [];
let pairCount = 8;
const settings = { time: true, points: true };
let shareText = '';
let revealTimeouts = [];
function cancelReveal() {
  revealTimeouts.forEach(clearTimeout); revealTimeouts = [];
  document.body.classList.remove('is-revealing');
  $('skip-game').disabled = false;
}
try {
  const saved = JSON.parse(localStorage.getItem('rg-plant-last-meadow') || '[]');
  if (Array.isArray(saved)) previousMeadow = saved.filter(id => typeof id === 'string');
} catch { /* The game also works when browser storage is unavailable. */ }

const time = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
const currentSeconds = () => Math.floor((elapsed + (runningSince === null ? 0 : Date.now() - runningSince)) / 1000);
function pauseTimer() {
  if (runningSince !== null) elapsed += Date.now() - runningSince;
  runningSince = null;
  clearInterval(timer);
}
function startTimer() {
  if (!settings.time || runningSince !== null || mode !== 'playing') return;
  runningSince = Date.now();
  timer = setInterval(() => { $('timer').textContent = time(currentSeconds()); }, 250);
}

function faceLabel(item) {
  return item.kind === 'image' ? t('09.09') : (item.plant.cardName ?? item.plant.namesLtg[0]);
}

function buildCard(item, index, preview = false) {
  const card = document.createElement('button');
  card.type = 'button'; card.className = 'memory-card';
  card.dataset.index = index;
  card.dataset.plantKey = `${item.plant.id}-${item.kind}`;
  card.setAttribute('aria-label', t(preview ? '09.10' : '09.11', { numurs: index + 1 }));
  card.setAttribute('aria-pressed', 'false');
  const inner = document.createElement('span'); inner.className = 'card-inner';
  const back = document.createElement('span'); back.className = 'card-back'; back.setAttribute('aria-hidden', 'true');
  const logo = document.createElement('img'); logo.src = 'assets/rg-violet.svg'; logo.alt = ''; logo.width = 62; logo.height = 62; back.append(logo);
  const front = document.createElement('span'); front.className = 'card-front'; front.setAttribute('aria-hidden', 'true');
  if (item.kind === 'image') {
    const image = document.createElement('img'); image.src = item.plant.image; image.alt = ''; image.draggable = false; front.append(image);
  } else {
    front.classList.add('name-face');
    const name = document.createElement('span'); name.className = 'plant-name'; name.lang = 'ltg';
    name.textContent = item.plant.cardName ?? item.plant.namesLtg[0];
    if (name.textContent.length > 19) name.classList.add('long-name');
    if (name.textContent.split(/\s+/).some(word => word.length >= 9)) name.classList.add('long-word');
    front.append(name);
  }
  const check = document.createElement('span'); check.className = 'match-check'; check.innerHTML = icons.check; front.append(check);
  inner.append(back, front); card.append(inner);
  card.addEventListener('click', () => {
    if (mode === 'preview') { startGame(); flip(index); return; }
    flip(index);
  });
  return card;
}

function updateStats() {
  $('moves').textContent = game.moves;
  $('pairs').textContent = `${game.pairs} / ${pairCount}`;
  $('score').textContent = settings.points ? scoreFor(game.pairs, game.mistakes) : '0';
}

function updateSizeInfo() {
  document.querySelectorAll('[data-pair-count]').forEach(button => {
    if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(Number(button.dataset.pairCount) === pairCount));
  });
  grid.dataset.pairCount = pairCount;
  grid.style.setProperty('--board-rows', Math.ceil(pairCount * 2 / 4));
  // Let responsive CSS scale the whole board while preserving portrait cards.
  grid.closest('.memory-shell').dataset.pairCount = pairCount;
  $('meadow-note').textContent = t('01.05', { augu_skaits: pairCount });
  updateSettingsUI();
}

function updateSettingsUI() {
  $('toggle-time').setAttribute('aria-pressed', String(settings.time));
  $('toggle-points').setAttribute('aria-pressed', String(settings.points));
  $('score-stat').hidden = !settings.points;
  $('moves-stat').hidden = !settings.points;
  $('time-stat').hidden = !settings.time;
  $('game-stats').style.setProperty('--stat-columns', 1 + (settings.points ? 2 : 0) + (settings.time ? 1 : 0));
  $('max-score').textContent = t('03.06', { maksimums: pairCount * (settings.time ? 125 : 100) });
  let explanation = t('07.01');
  if (settings.points && settings.time) {
    explanation = t('07.02', { bonusa_maksimums: pairCount * 25, maksimums: pairCount * 125 });
  } else if (settings.points) {
    explanation = t('07.03', { maksimums: pairCount * 100 });
  } else if (settings.time) {
    explanation = t('07.04');
  }
  $('scoring-explanation').textContent = explanation + ' ' + t('07.05');
}

function setFace(index, open, matched = false) {
  const card = grid.children[index], item = game.deck[index];
  card.classList.toggle('flipped', open);
  card.classList.toggle('matched', matched);
  card.setAttribute('aria-pressed', String(open));
  card.setAttribute('aria-label', matched ? t('09.13', { latgaliskie_nosaukumi: (item.plant.cardName ?? item.plant.namesLtg[0]), latviskais_nosaukums: item.plant.nameLv }) : open ? t('09.12', { saturs: faceLabel(item), numurs: index + 1 }) : t('09.11', { numurs: index + 1 }));
  if (matched) card.setAttribute('aria-disabled', 'true');
}

function flip(index) {
  if (mode !== 'playing') return;
  const event = selectCard(game, index);
  if (event.type === 'ignored') return;
  analytics.start();
  startTimer(); setFace(index, true);
  if (event.type === 'first') {
    $('game-status').textContent = t('02.05');
    return;
  }
  updateStats();
  if (event.type === 'match') {
    event.indices.forEach(i => setFace(i, true, true));
    $('game-status').textContent = `${settings.points ? '+100 · ' : ''}${t('02.06', { latgaliskais_nosaukums: event.plant.cardName, latviskais_nosaukums: event.plant.nameLv })}`;
    if (event.complete) {
      analytics.complete();
      mode = 'finishing'; pauseTimer();
      $('timer').textContent = time(currentSeconds());
      finishTimeout = setTimeout(finish, 1250);
    }
  } else {
    event.indices.forEach(i => grid.children[i].classList.add('mismatch'));
    $('game-status').textContent = `${settings.points ? '−10 · ' : ''}${t('02.07')}`;
    // A short recognition pause keeps the next choice responsive.
    mismatchTimeout = setTimeout(() => {
      if (mode !== 'playing') return;
      resolveMismatch(game).forEach(i => { setFace(i, false); grid.children[i].classList.remove('mismatch'); });
      $('game-status').textContent = t('02.08');
    }, 900);
  }
}

function startGame() {
  cancelReveal();
  document.body.classList.remove('is-gallery-transition');
  clearTimeout(mismatchTimeout); clearTimeout(finishTimeout); pauseTimer();
  elapsed = 0; runningSince = null; mode = 'playing';
  meadow = prepareMeadowNames(sampleMeadow(plants, pairCount, previousMeadow));
  previousMeadow = meadow.map(p => p.id);
  try { localStorage.setItem('rg-plant-last-meadow', JSON.stringify(previousMeadow)); } catch { /* Optional persistence. */ }
  game = createGame(makeDeck(meadow));
  analytics.reset(pairCount,settings);
  updateSizeInfo();
  buildGallery();
  document.body.classList.add('is-playing'); document.body.classList.remove('is-complete');
  $('start-game').hidden = true; $('restart-game').hidden = false;
  $('result').hidden = true; $('herbarium').hidden = true;
  $('game-stats').hidden = false; $('timer').textContent = '00:00';
  $('board-title').textContent = t('02.01');
  $('board-kicker').hidden = true;
  $('game-status').textContent = t(settings.time ? '02.03' : '02.04');
  grid.classList.remove('preview');
  grid.replaceChildren(...game.deck.map((item, index) => buildCard(item, index)));
  updateStats();
  grid.children[0].focus({ preventScroll: true });
  if (matchMedia('(max-width:760px)').matches) $('game').scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function finish(skipped = false) {
  cancelReveal(); pauseTimer();
  mode = 'transitioning';
  document.body.classList.add('is-gallery-transition');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  finishTimeout = setTimeout(() => {
    document.body.classList.remove('is-gallery-transition');
    finishToGallery(skipped);
  }, reduced ? 0 : 1550);
}

function finishToGallery(skipped) {
  cancelReveal();
  if (grid.contains(document.activeElement)) document.activeElement.blur();
  mode = 'complete';
  const seconds = currentSeconds();
  const bonus = !skipped && settings.points && settings.time ? timeBonusFor(pairCount, seconds) : 0;
  const score = settings.points ? scoreFor(game.pairs, game.mistakes, bonus) : 0;
  $('result-score').hidden = !settings.points;
  $('final-score').textContent = score;
  $('score').textContent = score;
  const mistakesText = t(game.mistakes % 10 === 1 && game.mistakes % 100 !== 11 ? '03.08' : '03.09', { skaits: game.mistakes });
  const details = [];
  if (settings.points) details.push(t('03.07', { gājieni: game.moves }), mistakesText);
  if (settings.time) details.push(time(seconds));
  $('result-detail').textContent = details.length ? details.join(' · ') : t('03.10', { augu_skaits: pairCount });
  $('result').hidden = skipped || !settings.points && !settings.time;
  document.body.classList.add('is-complete');
  $('start-game').hidden = false; $('start-game').firstChild.textContent = t('03.02') + ' ';
  $('restart-game').hidden = true;
  $('herbarium-count').textContent = t('03.01', { augu_skaits: pairCount });
  $('herbarium').hidden = false;
  shareText = shareResultFor(meadow, { time: !skipped && settings.time, points: !skipped && settings.points, seconds, score });
  $('share-text').textContent = shareText;
  $('copy-status').textContent = '';
  $('herbarium-title').tabIndex = -1;
  $('herbarium-title').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $('herbarium').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1500, easing: 'ease-out' });
    [...$('plant-gallery').children].forEach((card, index) => card.animate([
      { opacity: 0, transform: 'translateY(16px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 1900, delay: 200 + index * 110, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'backwards' }));
  }
}

function returnToStart() {
  cancelReveal();
  clearTimeout(mismatchTimeout); clearTimeout(finishTimeout); pauseTimer();
  elapsed = 0; runningSince = null; game = null; mode = 'preview';
  document.body.classList.remove('is-playing', 'is-complete', 'is-gallery-transition');
  $('herbarium').hidden = true; $('result').hidden = true;
  $('restart-game').hidden = true; $('start-game').hidden = false;
  $('start-game').firstChild.textContent = t('01.06') + ' ';
  $('board-title').textContent = t('01.09');
  $('board-kicker').hidden = true;
  $('game-status').textContent = '';
  $('game-stats').hidden = false;
  $('score').textContent = '0'; $('moves').textContent = '0'; $('timer').textContent = '00:00';
  $('copy-status').textContent = ''; shareText = '';
  preview();
  $('start-game').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

function preview() {
  updateSizeInfo();
  grid.classList.add('preview');
  const deck = prepareMeadowNames(plants.slice(0, pairCount)).flatMap(plant => ['image', 'name'].map(kind => ({ plant, kind })));
  grid.replaceChildren(...deck.map((item, index) => buildCard(item, index, true)));
  $('pairs').textContent = `0 / ${pairCount}`;
}

function buildGallery() {
  $('plant-gallery').replaceChildren(...meadow.map(plant => {
    const article = document.createElement('article'); article.className = 'gallery-plant';
    const image = document.createElement('img'); image.src = plant.image; image.alt = plant.nameLv;
    const title = document.createElement('h3'); title.className = 'plant-names'; title.lang = 'ltg';
    plant.galleryNames.forEach((name, index) => {
      if (index) { const separator = document.createElement('span'); separator.className = 'name-separator'; separator.textContent = ' · '; title.append(separator); }
      const variant = document.createElement('span'); variant.className = 'plant-name-variant'; variant.textContent = name; title.append(variant);
    });
    const lv = document.createElement('p'); lv.className = 'lv-name'; lv.textContent = t('05.01', { nosaukums: plant.nameLv });
    const link = document.createElement('a'); link.href = `https://tezaurs.lv/${encodeURIComponent(plant.nameLv)}`; link.target = '_blank'; link.rel = 'noopener'; link.textContent = t('05.06') + ' ';
    const linkIcon = document.createElement('span'); linkIcon.innerHTML = icons['arrow-up-right']; link.append(linkIcon);
    article.append(image, title);
    if (plant.scientificName) {
      const latin = document.createElement('p'); latin.className = 'scientific-name'; latin.lang = 'la';
      const scientificName = document.createElement('i'); scientificName.textContent = plant.scientificName;
      latin.append(scientificName); article.append(latin);
    }
    article.append(lv);
    if (plant.namesOther) {
      for (const [lang, label] of [['en', '05.02'], ['de', '05.03'], ['pl', '05.04']]) {
        const row = document.createElement('p'); row.className = 'other-name';
        row.append(t(label, { nosaukums: '' }).trimEnd() + ' ');
        const name = document.createElement('span'); name.lang = lang; name.textContent = plant.namesOther[lang]; row.append(name);
        article.append(row);
      }
    }
    const links = document.createElement('div'); links.className = 'plant-links';
    if (plant.factUrl) {
      const source = document.createElement('a'); source.href = plant.factUrl; source.target = '_blank'; source.rel = 'noopener'; source.className = 'fact-source'; source.textContent = t('05.05') + ' ';
      if (plant.natureLinkNote) source.title = t(plant.natureLinkKind === 'family' ? '05.07' : plant.id === 'asinszale' ? '05.08' : '05.09');
      const arrow = document.createElement('span'); arrow.innerHTML = icons['arrow-up-right']; source.append(arrow);
      links.append(source);
    }
    links.append(link); article.append(links); return article;
  }));
}

$('start-game').addEventListener('click', startGame);
$('restart-game').addEventListener('click', returnToStart);
$('skip-game').addEventListener('click', () => {
  if (['finishing', 'revealing', 'transitioning', 'complete'].includes(mode)) return;
  if (mode === 'preview') startGame();
  analytics.skip();
  clearTimeout(mismatchTimeout); clearTimeout(finishTimeout); pauseTimer();
  mode = 'revealing';
  document.body.classList.add('is-revealing');
  $('skip-game').disabled = true;
  $('game-status').textContent = t('02.09');
  $('board-title').textContent = t('02.10');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const closed = [...grid.children].map((card, index) => ({ card, index })).filter(({ card }) => !card.classList.contains('flipped'));
  [...grid.children].forEach(card => card.classList.remove('mismatch'));
  closed.forEach(({ index }, order) => {
    revealTimeouts.push(setTimeout(() => {
      if (mode === 'revealing') setFace(index, true);
    }, reduced ? 0 : 180 + order * 145));
  });
  // Let the final flip settle, then give the whole meadow a quiet moment.
  const revealDuration = reduced ? 650 : 180 + Math.max(0, closed.length - 1) * 145 + 1800;
  finishTimeout = setTimeout(() => { if (mode === 'revealing') finish(true); }, revealDuration);
});
document.querySelectorAll('.pair-picker button').forEach(button => button.addEventListener('click', () => {
  const count = Number(button.dataset.pairCount);
  if (![6, 8, 10].includes(count) || count === pairCount) return;
  pairCount = count;
  if (mode === 'preview') preview();
  else startGame();
}));
for (const option of ['time', 'points']) {
  $(`toggle-${option}`).addEventListener('click', () => {
    settings[option] = !settings[option];
    if (mode === 'preview') updateSettingsUI();
    else startGame();
  });
}
$('new-meadow').addEventListener('click', returnToStart);
document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icons[node.dataset.icon]; });
$('copy-result').addEventListener('click', async () => {
  let copied = false;
  try { await navigator.clipboard.writeText(shareText); copied = true; } catch {
    const field = document.createElement('textarea'); field.value = shareText;
    field.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.append(field);
    field.select();
    try { copied = document.execCommand('copy'); } catch { /* Visible text remains available for manual copying. */ }
    field.remove(); $('copy-result').focus({ preventScroll: true });
  }
  $('copy-status').textContent = t(copied ? '03.04' : '03.05');
});
$('about-button').addEventListener('click', () => {
  aboutPaused = runningSince !== null; pauseTimer(); $('about-dialog').showModal();
});
$('close-about').addEventListener('click', () => $('about-dialog').close());
let aboutBackdropPress = false;
function outsideAbout(event) {
  const rect = $('about-dialog').getBoundingClientRect();
  return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
}
$('about-dialog').addEventListener('pointerdown', event => {
  aboutBackdropPress = event.target === $('about-dialog') && outsideAbout(event);
});
$('about-dialog').addEventListener('click', event => {
  if (aboutBackdropPress && event.target === $('about-dialog') && outsideAbout(event)) $('about-dialog').close();
  aboutBackdropPress = false;
});
$('about-dialog').addEventListener('pointercancel', () => { aboutBackdropPress = false; });

$('about-dialog').addEventListener('close', () => { if (aboutPaused && !document.hidden) startTimer(); aboutPaused = false; });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseTimer();
  else if (mode === 'playing' && (game.moves > 0 || game.first !== null) && !$('about-dialog').open) startTimer();
});
const desktopBoard = matchMedia('(min-width: 1000px) and (min-height: 600px)');
let boardFitFrame;
function scheduleBoardFit() {
  cancelAnimationFrame(boardFitFrame);
  boardFitFrame = requestAnimationFrame(() => {
    if (!desktopBoard.matches || document.body.classList.contains('is-complete')) return;
    const fitted = fitBoardLayout(grid.children.length, grid.clientWidth, grid.clientHeight);
    grid.style.setProperty('--fit-columns', fitted.columns);
    grid.style.setProperty('--fit-rows', fitted.rows);
    grid.style.setProperty('--fit-card-width', `${fitted.cardWidth}px`);
  });
}
new ResizeObserver(scheduleBoardFit).observe(grid);
new MutationObserver(scheduleBoardFit).observe(grid, { childList: true });
desktopBoard.addEventListener('change', scheduleBoardFit);
window.addEventListener('resize', scheduleBoardFit);
document.fonts.ready.then(scheduleBoardFit);
preview();
