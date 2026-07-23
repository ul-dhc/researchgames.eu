'use strict';

const RIDDLES = {
  1: [
    { q: 'Akmeņa kājas, koka rumpis, salmu cepure.', a: 'Māja', clue: 'Tajā dzīvo cilvēki.' },
    { q: 'Kas stāv pie griestiem ar kājām uz augšu?', a: 'Muša', clue: 'Tas ir mazs kukainis.' },
    { q: 'Maza muciņa, divējāds alutiņš.', a: 'Ola', clue: 'Tai ir čaumala.' },
    { q: 'Kas taisa tiltu bez neviena baļķa?', a: 'Sals', clue: 'Tas atnāk aukstā laikā.' },
    { q: 'Četri taisa vietu, divi rāda uguni, viens pats apgulstas.', a: 'Suns', clue: 'Tas ir cilvēka draugs.' },
    { q: 'Apaļš kā rullis, sarkans kā bullis, šķēres padusē.', a: 'Vēzis', clue: 'Tas dzīvo ūdenī.' },
    { q: 'Mēness skala galā.', a: 'Svece', clue: 'Tā dod gaismu.' }
  ],
  2: [
    { q: 'Mazs, mazs sunītis, simts adatu mugurā.', a: 'Ezis', clue: 'Tam mugurā ir adatas.' },
    { q: 'Bez rokām, bez cirvja uztaisa mājiņu.', a: 'Skudra', clue: 'Tas ir čakls kukainis.' },
    { q: 'Krustiem šķērsiem kauli likti, pati miesa cauri spīd.', a: 'Logs', clue: 'Pa to var skatīties laukā.' },
    { q: 'Kas dara raudas bez gaudām?', a: 'Sīpols', clue: 'To griežot, acīs sariešas asaras.' },
    { q: 'Stabiņš sūnās, galdiņš virsū.', a: 'Sēne', clue: 'Tā aug mežā.' },
    { q: 'Maza, maza mājiņa, ne tai logu, ne durvju.', a: 'Ola', clue: 'No tās var izšķilties cālēns.' }
  ],
  3: [
    { q: 'Mazs, mazs vīriņš, ass, ass cirvītis.', a: 'Bite', clue: 'Tā vāc ziedu nektāru.' },
    { q: 'Lec kā zaķis, nav zaķis. Peld kā zivs, nav zivs.', a: 'Varde', clue: 'Tā dzīvo gan ūdenī, gan uz sauszemes.' },
    { q: 'Kas ziemu nesalst un vasaru neizkūst?', a: 'Akmens', clue: 'Tas ir ciets un atrodams dabā.' },
    { q: 'Pieci kambari, vienas durvis.', a: 'Cimds', clue: 'To velk rokā.' },
    { q: 'Dzelža cūciņa, pakala astīte.', a: 'Adata', clue: 'Ar to šuj.' },
    { q: 'Papriekš sarkans un tad melns.', a: 'Ogle', clue: 'Tā paliek pāri pēc degšanas.' },
    { q: 'Divi mazi zirnīši apsēj visu pasauli.', a: 'Acis', clue: 'Ar tām skatās.' }
  ]
};

const ALPHABET = 'AĀBCČDEĒFGĢHIĪJKĶLĻMNŅOPRSŠTUŪVZŽ';
const GRID_SIZE = 6;
const GAME_LENGTH = 5;
const state = {
  riddles: [],
  index: 0,
  grid: [],
  answerCells: [],
  selectedCells: [],
  dragging: false,
  solved: false,
  hintsUsed: 0,
  totalBirds: 0,
  textLarge: false
};

const el = id => document.getElementById(id);

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function normalize(value) {
  return value.toLocaleUpperCase('lv-LV').replace(/\s+/g, '');
}

function birdLabel(count) {
  if (count === 1) return '1 putniņš';
  if (count === 0) return '0 putniņu';
  return `${count} putniņi`;
}

function chooseRiddles() {
  return [
    ...shuffle(RIDDLES[1]).slice(0, 2).map(item => ({ ...item, level: 1 })),
    ...shuffle(RIDDLES[2]).slice(0, 2).map(item => ({ ...item, level: 2 })),
    ...shuffle(RIDDLES[3]).slice(0, 1).map(item => ({ ...item, level: 3 }))
  ];
}

function directionsForLevel(level) {
  if (level === 1) return [[0, 1], [1, 0]];
  if (level === 2) return [[0, 1], [1, 0], [0, -1]];
  return [[0, 1], [1, 0], [0, -1], [1, 1], [1, -1]];
}

function randomLetter() {
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
}

function createGrid(riddle) {
  const answer = normalize(riddle.a);
  const directions = shuffle(directionsForLevel(riddle.level));
  const options = [];

  directions.forEach(([dr, dc]) => {
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        const endRow = row + dr * (answer.length - 1);
        const endCol = col + dc * (answer.length - 1);
        if (endRow >= 0 && endRow < GRID_SIZE && endCol >= 0 && endCol < GRID_SIZE) {
          options.push({ row, col, dr, dc });
        }
      }
    }
  });

  const placement = shuffle(options)[0];
  state.grid = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, randomLetter));
  state.answerCells = [];

  [...answer].forEach((letter, index) => {
    const row = placement.row + placement.dr * index;
    const col = placement.col + placement.dc * index;
    state.grid[row][col] = letter;
    state.answerCells.push({ row, col });
  });
}

function renderAnswerBoxes() {
  const answer = normalize(state.riddles[state.index].a);
  const wrapper = el('answer-boxes');
  wrapper.replaceChildren();
  [...answer].forEach((letter, index) => {
    const box = document.createElement('span');
    box.className = 'answer-box';
    box.textContent = state.solved || state.hintsUsed >= 2 && index === 0 ? letter : '';
    wrapper.append(box);
  });
}

function renderGrid() {
  const grid = el('letter-grid');
  grid.replaceChildren();
  state.grid.forEach((row, rowIndex) => {
    row.forEach((letter, colIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'letter-cell';
      button.textContent = letter;
      button.dataset.row = rowIndex;
      button.dataset.col = colIndex;
      button.setAttribute('role', 'gridcell');
      grid.append(button);
    });
  });
}

function currentCellFromTarget(target) {
  const cell = target.closest('.letter-cell');
  if (!cell) return null;
  return { row: Number(cell.dataset.row), col: Number(cell.dataset.col), node: cell };
}

function isSameCell(a, b) {
  return a.row === b.row && a.col === b.col;
}

function calculatePath(start, end) {
  const rowDelta = end.row - start.row;
  const colDelta = end.col - start.col;
  const rowStep = Math.sign(rowDelta);
  const colStep = Math.sign(colDelta);
  const straight = rowDelta === 0 || colDelta === 0 || Math.abs(rowDelta) === Math.abs(colDelta);
  if (!straight) return [];
  const length = Math.max(Math.abs(rowDelta), Math.abs(colDelta));
  return Array.from({ length: length + 1 }, (_, index) => ({
    row: start.row + rowStep * index,
    col: start.col + colStep * index
  }));
}

function paintSelection() {
  document.querySelectorAll('.letter-cell').forEach(node => node.classList.remove('selected'));
  state.selectedCells.forEach(cell => {
    const node = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
    if (node) node.classList.add('selected');
  });
}

function selectionWord() {
  return state.selectedCells.map(cell => state.grid[cell.row][cell.col]).join('');
}

function pointerCell(event) {
  const target = document.elementFromPoint(event.clientX, event.clientY);
  return target ? currentCellFromTarget(target) : null;
}

function startSelection(event) {
  if (state.solved) return;
  const cell = currentCellFromTarget(event.target);
  if (!cell) return;
  event.preventDefault();
  state.dragging = true;
  state.selectedCells = [{ row: cell.row, col: cell.col }];
  event.currentTarget.setPointerCapture(event.pointerId);
  paintSelection();
}

function moveSelection(event) {
  if (!state.dragging) return;
  const cell = pointerCell(event);
  if (!cell) return;
  const path = calculatePath(state.selectedCells[0], cell);
  if (path.length) {
    state.selectedCells = path;
    paintSelection();
  }
}

function endSelection() {
  if (!state.dragging) return;
  state.dragging = false;
  const answer = normalize(state.riddles[state.index].a);
  const attempt = selectionWord();
  if (attempt === answer || [...attempt].reverse().join('') === answer) {
    solveRiddle();
  } else if (state.selectedCells.length > 1) {
    showMessage('Gandrīz! Pamēģini vēlreiz.', 'try-again');
    setTimeout(() => {
      state.selectedCells = [];
      paintSelection();
    }, 450);
  } else {
    state.selectedCells = [];
    paintSelection();
  }
}

function showMessage(text, type = '') {
  const message = el('message');
  message.textContent = text;
  message.className = `message ${type}`;
}

function celebrate() {
  const container = el('celebration');
  container.replaceChildren();
  for (let i = 0; i < 18; i += 1) {
    const spark = document.createElement('span');
    spark.className = 'spark';
    spark.style.setProperty('--x', `${Math.round((Math.random() - 0.5) * 520)}px`);
    spark.style.setProperty('--y', `${Math.round((Math.random() - 0.65) * 420)}px`);
    spark.style.background = i % 3 === 0 ? 'var(--yellow)' : 'var(--green)';
    container.append(spark);
  }
  setTimeout(() => container.replaceChildren(), 1000);
}

function solveRiddle() {
  state.solved = true;
  const birds = Math.max(1, 3 - state.hintsUsed);
  state.totalBirds += birds;
  state.selectedCells = state.answerCells;
  paintSelection();
  state.answerCells.forEach(cell => {
    const node = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
    if (node) node.classList.add('found');
  });
  renderAnswerBoxes();
  showMessage(`Tu atminēji! +${birdLabel(birds)}`, 'success');
  el('hint-button').disabled = true;
  el('shuffle-button').disabled = true;
  el('next-button').hidden = false;
  celebrate();
}

function useHint() {
  if (state.solved || state.hintsUsed >= 2) return;
  state.hintsUsed += 1;
  const riddle = state.riddles[state.index];
  if (state.hintsUsed === 1) {
    showMessage(`Papildu norāde: ${riddle.clue}`, 'try-again');
  } else {
    renderAnswerBoxes();
    const start = state.answerCells[0];
    const node = document.querySelector(`[data-row="${start.row}"][data-col="${start.col}"]`);
    if (node) node.classList.add('hinted');
    showMessage(`Atbildes pirmais burts ir “${normalize(riddle.a)[0]}”.`, 'try-again');
  }
  el('hint-count').textContent = String(2 - state.hintsUsed);
  if (state.hintsUsed >= 2) el('hint-button').disabled = true;
}

function shuffleGridLetters() {
  if (state.solved) return;
  createGrid(state.riddles[state.index]);
  renderGrid();
  showMessage('Burti sajaukti. Atbilde joprojām ir režģī.');
}

function renderRiddle() {
  const riddle = state.riddles[state.index];
  state.solved = false;
  state.hintsUsed = 0;
  state.selectedCells = [];
  createGrid(riddle);
  el('progress-label').textContent = `Mīkla ${state.index + 1} no ${GAME_LENGTH}`;
  el('birds-total').querySelector('span').textContent = birdLabel(state.totalBirds);
  el('progress-fill').style.width = `${(state.index / GAME_LENGTH) * 100}%`;
  el('level-label').textContent = `${riddle.level}. līmenis`;
  el('riddle-text').textContent = riddle.q;
  el('hint-count').textContent = '2';
  el('hint-button').disabled = false;
  el('shuffle-button').disabled = false;
  el('next-button').hidden = true;
  showMessage('');
  renderAnswerBoxes();
  renderGrid();
}

function startGame() {
  state.riddles = chooseRiddles();
  state.index = 0;
  state.totalBirds = 0;
  el('start-screen').hidden = true;
  el('game-screen').hidden = false;
  renderRiddle();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextRiddle() {
  if (state.index >= GAME_LENGTH - 1) {
    finishGame();
    return;
  }
  state.index += 1;
  renderRiddle();
}

function finishGame() {
  el('progress-fill').style.width = '100%';
  const maxBirds = GAME_LENGTH * 3;
  const title = state.totalBirds >= 13 ? 'Izcili!' : state.totalBirds >= 9 ? 'Lieliski!' : 'Labs darbs!';
  el('result-title').textContent = title;
  el('result-birds').querySelector('span').textContent = `${state.totalBirds} no ${maxBirds} putniņiem`;
  el('result-copy').textContent = `Tu atminēji visas 5 mīklas un ieguvi ${state.totalBirds} no ${maxBirds} putniņiem.`;
  el('result-dialog').showModal();
  celebrate();
}

function returnHome() {
  el('result-dialog').close();
  el('game-screen').hidden = true;
  el('start-screen').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
}

function toggleTextSize() {
  state.textLarge = !state.textLarge;
  document.documentElement.style.setProperty('--font-scale', state.textLarge ? '1.12' : '1');
  el('text-size-button').textContent = state.textLarge ? 'A−' : 'A+';
}

el('start-button').addEventListener('click', startGame);
el('hint-button').addEventListener('click', useHint);
el('shuffle-button').addEventListener('click', shuffleGridLetters);
el('next-button').addEventListener('click', nextRiddle);
el('play-again').addEventListener('click', () => {
  el('result-dialog').close();
  startGame();
});
el('close-result').addEventListener('click', returnHome);
el('theme-toggle').addEventListener('click', toggleTheme);
el('text-size-button').addEventListener('click', toggleTextSize);
el('letter-grid').addEventListener('pointerdown', startSelection);
el('letter-grid').addEventListener('pointermove', moveSelection);
el('letter-grid').addEventListener('pointerup', endSelection);
el('letter-grid').addEventListener('pointercancel', endSelection);
