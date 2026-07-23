export function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function norm(s) {
  return s.toUpperCase().replace(/\s+/g, '');
}

export function getWords(answer) {
  return answer.split(/\s+/).filter(w => w.length > 0);
}

export function cellKey(r, c) {
  return `${r},${c}`;
}
