(() => {
  'use strict';

  const COLS = 10;
  const ROWS = 18;
  const DROP_MS = 900;
  const AUTOPLAY_DELAY_MS = 8000;
  const RESTART_MS = 1700;
  const COLORS = ['turquoise', 'blue', 'violet', 'green'];
  const SHAPES = {
    I: [[0, 1], [1, 1], [2, 1], [3, 1]],
    O: [[0, 0], [1, 0], [0, 1], [1, 1]],
    T: [[0, 0], [1, 0], [2, 0], [1, 1]],
    S: [[1, 0], [2, 0], [0, 1], [1, 1]],
    Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
    J: [[0, 0], [0, 1], [1, 1], [2, 1]],
    L: [[2, 0], [0, 1], [1, 1], [2, 1]]
  };
  const PIECES = Object.keys(SHAPES);
  const YEARS = [1919, 1923, 1940, 1958, 1991, 2009, 2019, 2026];

  class InstitutionalTetris {
    constructor(root) {
      if (root.dataset.tetrisReady === 'true') return;
      root.dataset.tetrisReady = 'true';
      this.root = root;
      this.title = root.dataset.title || 'Institution tetris';
      this.subtitle = root.dataset.subtitle || '';
      this.autoplayEnabled = root.dataset.autoplay !== 'false';
      this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      this.cells = [];
      this.piece = null;
      this.rows = 0;
      this.yearIndex = 0;
      this.paused = false;
      this.visible = true;
      this.restarting = false;
      this.lastInteraction = Date.now();
      this.lastDownInput = 0;
      this.autoplayStep = 0;
      this.interval = null;
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.build();
      this.bind();
      this.spawn();
      this.render();
      this.startTimer();
    }

    build() {
      this.root.innerHTML = `
        <div class="institutional-tetris__heading">
          <span>${this.escape(this.root.dataset.kicker || 'LU LAIKA LĪNIJA')}</span>
          <b>1919 <i>→</i> 2026</b>
        </div>
        <div class="institutional-tetris__game" tabindex="0" role="application" aria-label="${this.escape(this.title)}, a calm block-arrangement microgame">
          <div class="institutional-tetris__board-wrap">
            <div class="institutional-tetris__board" aria-hidden="true"></div>
            <p class="institutional-tetris__message" aria-live="polite"></p>
          </div>
          <div class="institutional-tetris__controls" aria-label="Game controls">
            <button class="institutional-tetris__control" type="button" data-action="left" aria-label="Move left">←</button>
            <button class="institutional-tetris__control" type="button" data-action="rotate" aria-label="Rotate">↻</button>
            <button class="institutional-tetris__control" type="button" data-action="right" aria-label="Move right">→</button>
            <button class="institutional-tetris__control" type="button" data-action="down" aria-label="Move down">↓</button>
            <button class="institutional-tetris__control" type="button" data-action="pause" aria-label="Pause" aria-pressed="false">Ⅱ</button>
          </div>
          <p class="institutional-tetris__hint">${this.escape(this.subtitle)}</p>
          <span class="institutional-tetris__announcer" aria-live="polite"></span>
        </div>`;
      this.game = this.root.querySelector('.institutional-tetris__game');
      this.boardElement = this.root.querySelector('.institutional-tetris__board');
      this.message = this.root.querySelector('.institutional-tetris__message');
      this.announcer = this.root.querySelector('.institutional-tetris__announcer');
      this.pauseButton = this.root.querySelector('[data-action="pause"]');
    }

    bind() {
      this.game.addEventListener('keydown', (event) => {
        const actions = {
          ArrowLeft: 'left',
          ArrowRight: 'right',
          ArrowDown: 'down',
          ArrowUp: 'rotate',
          ' ': 'rotate',
          p: 'pause',
          P: 'pause'
        };
        const action = actions[event.key];
        if (!action) return;
        event.preventDefault();
        this.interact(action);
      });
      this.root.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action]');
        if (button) this.interact(button.dataset.action);
      });
      this.observer = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.syncTimer();
      }, { threshold: .05 });
      this.observer.observe(this.root);
      document.addEventListener('visibilitychange', () => this.syncTimer());
    }

    escape(value) {
      return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[character]);
    }

    interact(action) {
      if (this.restarting) return;
      this.lastInteraction = Date.now();
      if (action === 'pause') {
        this.setPaused(!this.paused);
        return;
      }
      if (this.paused) return;
      if (action === 'left') this.move(-1, 0);
      if (action === 'right') this.move(1, 0);
      if (action === 'down') {
        const now = Date.now();
        if (now - this.lastDownInput < 420) {
          this.lastDownInput = 0;
          this.settle();
        } else {
          this.lastDownInput = now;
          this.step();
        }
      }
      if (action === 'rotate') this.rotate();
    }

    setPaused(value) {
      this.paused = value;
      this.pauseButton.setAttribute('aria-pressed', String(value));
      this.pauseButton.setAttribute('aria-label', value ? 'Resume' : 'Pause');
      this.pauseButton.textContent = value ? '▶' : 'Ⅱ';
      this.announcer.textContent = value ? 'Paused' : 'Resumed';
      this.syncTimer();
    }

    startTimer() {
      window.clearInterval(this.interval);
      if (this.paused || this.restarting || !this.visible || document.hidden) return;
      this.interval = window.setInterval(() => this.tick(), DROP_MS);
    }

    syncTimer() {
      this.startTimer();
    }

    tick() {
      if (this.autoplayEnabled && Date.now() - this.lastInteraction >= AUTOPLAY_DELAY_MS) {
        this.demoMove();
      }
      this.step();
    }

    demoMove() {
      this.autoplayStep += 1;
      if (this.autoplayStep % 3 === 0 && Math.random() < .52) this.rotate();
      if (this.autoplayStep % 2 === 0) {
        const center = this.piece.x + 1;
        const drift = center < 4 ? 1 : center > 6 ? -1 : (Math.random() < .5 ? -1 : 1);
        if (Math.random() < .72) this.move(drift, 0);
      }
    }

    spawn() {
      const type = PIECES[Math.floor(Math.random() * PIECES.length)];
      this.piece = {
        type,
        cells: SHAPES[type].map(([x, y]) => [x, y]),
        x: type === 'O' ? 4 : 3,
        y: 0,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        year: YEARS[this.yearIndex++ % YEARS.length]
      };
      if (this.collides(this.piece.cells, this.piece.x, this.piece.y)) this.restart();
    }

    collides(cells, offsetX, offsetY) {
      return cells.some(([x, y]) => {
        const boardX = x + offsetX;
        const boardY = y + offsetY;
        return boardX < 0 || boardX >= COLS || boardY >= ROWS ||
          (boardY >= 0 && this.board[boardY][boardX]);
      });
    }

    move(dx, dy) {
      if (!this.piece || this.collides(this.piece.cells, this.piece.x + dx, this.piece.y + dy)) return false;
      this.piece.x += dx;
      this.piece.y += dy;
      this.render();
      return true;
    }

    rotate() {
      if (!this.piece || this.piece.type === 'O') return;
      const rotated = this.piece.cells.map(([x, y]) => [-y, x]);
      const minX = Math.min(...rotated.map(([x]) => x));
      const minY = Math.min(...rotated.map(([, y]) => y));
      const normalized = rotated.map(([x, y]) => [x - minX, y - minY]);
      for (const kick of [0, -1, 1, -2, 2]) {
        if (!this.collides(normalized, this.piece.x + kick, this.piece.y)) {
          this.piece.cells = normalized;
          this.piece.x += kick;
          this.render();
          return;
        }
      }
    }

    step() {
      if (this.paused || this.restarting || !this.piece) return;
      if (this.move(0, 1)) return;
      this.lock();
    }

    settle() {
      if (this.paused || this.restarting || !this.piece) return;
      while (this.move(0, 1)) {}
      this.lock();
    }

    lock() {
      this.piece.cells.forEach(([x, y], index) => {
        const boardY = y + this.piece.y;
        if (boardY >= 0) this.board[boardY][x + this.piece.x] = { color: this.piece.color, year: this.piece.year, label: index === 0 };
      });
      this.clearRows();
    }

    clearRows() {
      const full = [];
      this.board.forEach((row, index) => {
        if (row.every(Boolean)) full.push(index);
      });
      if (!full.length) {
        this.spawn();
        this.render();
        return;
      }
      this.markClearing(full);
      const finish = () => {
        this.board = this.board.filter((row, index) => !full.includes(index));
        while (this.board.length < ROWS) this.board.unshift(Array(COLS).fill(null));
        this.rows += full.length;
        this.spawn();
        this.render();
      };
      if (this.reducedMotion) finish();
      else window.setTimeout(finish, 170);
    }

    markClearing(rows) {
      this.cells.forEach((cell) => {
        if (rows.includes(Number(cell.dataset.y))) cell.classList.add('institutional-tetris__cell--clearing');
      });
    }

    restart() {
      this.restarting = true;
      this.root.classList.add('is-restarting');
      this.message.textContent = 'Beginning again';
      this.announcer.textContent = 'Beginning again';
      this.syncTimer();
      window.setTimeout(() => {
        this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        this.piece = null;
        this.root.classList.remove('is-restarting');
        this.message.textContent = '';
        this.restarting = false;
        this.spawn();
        this.render();
        this.syncTimer();
      }, this.reducedMotion ? 0 : RESTART_MS);
    }

    render() {
      const desired = [];
      this.board.forEach((row, y) => row.forEach((block, x) => {
        if (block) desired.push({ x, y, color: block.color || block, year: block.label ? block.year : null, active: false });
      }));
      if (this.piece) this.piece.cells.forEach(([x, y], index) => {
        desired.push({ x: x + this.piece.x, y: y + this.piece.y, color: this.piece.color, year: index === 0 ? this.piece.year : null, active: true });
      });
      while (this.cells.length < desired.length) {
        const cell = document.createElement('span');
        cell.className = 'institutional-tetris__cell';
        this.boardElement.append(cell);
        this.cells.push(cell);
      }
      this.cells.forEach((cell, index) => {
        const item = desired[index];
        if (!item) {
          cell.hidden = true;
          return;
        }
        cell.hidden = false;
        cell.dataset.y = item.y;
        cell.dataset.year = item.year || '';
        cell.className = `institutional-tetris__cell institutional-tetris__cell--${item.color}${item.active ? ' institutional-tetris__cell--active' : ''}${item.year ? ' institutional-tetris__cell--year' : ''}`;
        cell.style.gridColumn = String(item.x + 1);
        cell.style.gridRow = String(item.y + 1);
      });
    }
  }

  InstitutionalTetris.nextId = 1;
  const init = () => document.querySelectorAll('[data-institutional-tetris]').forEach((root) => new InstitutionalTetris(root));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
