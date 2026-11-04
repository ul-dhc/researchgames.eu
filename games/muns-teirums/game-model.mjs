import { t } from './translations.mjs';
export const scoreFor = (pairs, mistakes, bonus = 0) => Math.max(0, pairs * 100 - mistakes * 10 + bonus);

// With both options on, each plant offers up to 25 bonus points.
// One bonus point expires per two active seconds, never below zero.
export const timeBonusFor = (pairCount, seconds) => Math.max(0, pairCount * 25 - Math.floor(Math.max(0, seconds) / 2));

export function sampleMeadow(plants, count = 8, previousIds = [], random = Math.random) {
  if (count > plants.length || count < 1) throw new RangeError('Invalid meadow size');
  const pool = [...plants];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const selected = pool.slice(0, count);
  const previous = new Set(previousIds);
  if (pool.length > count && previous.size === count && selected.every(p => previous.has(p.id))) {
    selected[count - 1] = pool[count];
  }
  return selected;
}

// Keep source names intact. Each round has one card name and an independent gallery order.
export function prepareMeadowNames(plants, random = Math.random) {
  return plants.map(plant => {
    const names = plant.namesLtg;
    const cardName = names[Math.floor(random() * names.length)];
    const galleryNames = [...names];
    for (let i = galleryNames.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [galleryNames[i], galleryNames[j]] = [galleryNames[j], galleryNames[i]];
    }
    return { ...plant, cardName, galleryNames };
  });
}

export function makeDeck(plants, random = Math.random) {
  const cards = plants.flatMap(plant => ['image', 'name'].map(kind => ({ plant, kind, key: `${plant.id}-${kind}` })));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function createGame(deck) {
  return { deck, first: null, pending: null, matched: new Set(), moves: 0, mistakes: 0, pairs: 0, complete: false };
}

export function selectCard(state, index) {
  if (state.complete || state.pending || state.matched.has(index) || state.first === index || !state.deck[index]) return { type: 'ignored' };
  if (state.first === null) {
    state.first = index;
    return { type: 'first', indices: [index] };
  }
  const first = state.first;
  state.first = null;
  state.moves++;
  const a = state.deck[first], b = state.deck[index];
  if (a.plant.id === b.plant.id && a.kind !== b.kind) {
    state.matched.add(first); state.matched.add(index); state.pairs++;
    state.complete = state.matched.size === state.deck.length;
    return { type: 'match', indices: [first, index], plant: b.plant, complete: state.complete };
  }
  state.mistakes++;
  state.pending = [first, index];
  return { type: 'mismatch', indices: state.pending };
}

export function resolveMismatch(state) {
  const indices = state.pending;
  state.pending = null;
  return indices;
}

// Only selected optional metrics appear in the copied result.
export function shareResultFor(meadow, { time = false, points = false, seconds = 0, score = 0 } = {}) {
  const plantNames = meadow.map(plant => plant.cardName ?? plant.namesLtg[0]);
  const names = plantNames.length > 1 ? `${plantNames.slice(0, -1).join(', ')} i ${plantNames.at(-1)}` : plantNames.join('');
  const sentences = [t('04.01', { augu_saraksts: names })];
  const minutes = Math.floor(seconds / 60), rest = seconds % 60;
  const singular = n => n % 10 === 1 && n % 100 !== 11;
  const minuteText = minutes ? t(singular(minutes) ? '04.05' : '04.06', { skaits: minutes }) : '';
  const secondText = rest || !minutes ? t(singular(rest) ? '04.07' : '04.08', { skaits: rest }) : '';
  let duration = minuteText && secondText ? t('04.09', { minūtes: minuteText, sekundes: secondText }) : minuteText || secondText;
  const pointWord = t(score % 10 === 1 || score % 10 === 0 || score % 100 >= 11 && score % 100 <= 19 ? '04.10' : '04.11');
  if (time && points) {
    if (/laikā\s*$/.test(duration) && /\{ilgums\}\s+laikā/.test(t('04.02'))) duration = duration.replace(/\s+laikā\s*$/, '');
    sentences.push(t('04.02', { ilgums: duration, punkti: score, punktu_forma: pointWord }));
  }
  else if (time) {
    // The supplied minute form already includes the time postposition.
    // Keep it only once when the supplied sentence includes it as well.
    if (/laikā\s*$/.test(duration) && /\{ilgums\}\s+laikā/.test(t('04.03'))) duration = duration.replace(/\s+laikā\s*$/, '');
    sentences.push(t('04.03', { ilgums: duration }));
  }
  else if (points) sentences.push(t('04.04', { punkti: score, punktu_forma: pointWord }));
  return sentences.join(' ');
}
