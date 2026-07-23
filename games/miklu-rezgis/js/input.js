import { state } from './state.js';
import { renderGrid } from './render.js';

function getDragLine(sr, sc, er, ec) {
  const dr = er - sr, dc = ec - sc;
  if (dr === 0 && dc === 0) return [[sr, sc]];

  const len = Math.max(Math.abs(dr), Math.abs(dc));
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;

  const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
  const cells = [];
  for (let i = 0; i <= len; i++) cells.push([sr + stepR * i, sc + stepC * i]);
  return cells;
}

function rowColAt(clientX, clientY) {
  const target = document.elementFromPoint(clientX, clientY);
  const cell = target && target.closest ? target.closest('.cell') : null;
  if (!cell || cell.dataset.r === undefined) return null;
  return [+cell.dataset.r, +cell.dataset.c];
}

export function initGridInput(onWordSelected) {
  const gridEl = document.getElementById('grid');
  gridEl.style.touchAction = 'none';

  gridEl.addEventListener('pointerdown', (e) => {
    if (state.gameOver) return;
    e.preventDefault();
    const rc = rowColAt(e.clientX, e.clientY);
    if (!rc) return;

    gridEl.setPointerCapture(e.pointerId);
    state.dragging = true;
    state.dragStart = rc;
    state.dragCells = [rc];
    renderGrid();
  }, { passive: false });

  gridEl.addEventListener('pointermove', (e) => {
    if (!state.dragging || state.gameOver) return;
    e.preventDefault();
    const rc = rowColAt(e.clientX, e.clientY);
    if (!rc) return;
    const line = getDragLine(state.dragStart[0], state.dragStart[1], rc[0], rc[1]);
    state.dragCells = line || [state.dragStart];
    renderGrid();
  }, { passive: false });

  gridEl.addEventListener('pointerup', (e) => {
    if (!state.dragging || state.gameOver) return;
    e.preventDefault();
    state.dragging = false;
    if (state.dragCells.length > 1) onWordSelected(state.dragCells);
    state.dragCells = [];
    state.dragStart = null;
    renderGrid();
  }, { passive: false });

  gridEl.addEventListener('pointercancel', () => {
    state.dragging = false;
    state.dragCells = [];
    state.dragStart = null;
    renderGrid();
  });
}
