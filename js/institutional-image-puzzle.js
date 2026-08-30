(() => {
  'use strict';

  const ICONS = {
    restart: '<path d="M4 8v-4m0 0h4M4 4l3 3a7 7 0 1 1-1 9"/>',
    shuffle: '<path d="M4 7h2.5c4 0 4.5 10 9 10H20m0 0-3-3m3 3-3 3M4 17h2.5c1.7 0 2.8-1.7 3.8-3.7M14 7c.6-.7 1.4-1 2.5-1H20m0 0-3-3m3 3-3 3"/>',
    hint: '<path d="M9 18h6M10 21h4M8.4 14.7A6 6 0 1 1 15.6 14.7C14.5 15.5 14 16.3 14 18h-4c0-1.7-.5-2.5-1.6-3.3Z"/>'
  };

  class InstitutionalImagePuzzle {
    constructor(root) {
      this.root = root;
      this.cols = Math.max(2, Number(root.dataset.cols) || 4);
      this.rows = Math.max(2, Number(root.dataset.rows) || 4);
      this.total = this.cols * this.rows;
      this.missingCount = Math.min(this.total - 1, Math.max(1, Number(root.dataset.missing) || 5));
      this.images = (root.dataset.images || root.dataset.image || '')
        .split(',')
        .map(path => path.trim())
        .filter(Boolean);
      this.image = this.images[Math.floor(Math.random() * this.images.length)] || root.dataset.image;
      this.title = root.dataset.title || 'Image puzzle';
      this.completeLabel = root.dataset.completeLabel || 'Image complete';
      this.alt = root.dataset.alt || '';
      this.isLatvian = (root.dataset.locale || document.documentElement.lang).toLowerCase().startsWith('lv');
      this.labels = this.isLatvian ? {
        board:'Novieto katru gabaliņu tam atbilstošajā tukšajā vietā.',tray:'Trūkstošie puzles gabaliņi',controls:'Puzles vadīklas',restart:'Sākt puzli no jauna',shuffle:'Sajaukt jaunā izkārtojumā',hint:'Parādīt norādi',skip:'Izlaist puzli',loading:'Ielādē',unavailable:'Nav pieejams',empty:'Tukša puzles vieta',placed:'Puzles gabaliņš, kas jau ievietots',piece:'Puzles gabaliņš',pieceHelp:'Izvēlies un tad norādi tam atbilstošo tukšo vietu.',toPlace:'jāievieto',complete:'Pabeigts',choose:'Izvēlies vietu',select:'Izvēlies gabaliņu',tryAnother:'Izmēģini citu vietu',highlighted:'Pareizā vieta ir izcelta'
      } : {
        board:'Place each piece in its matching empty space.',tray:'Missing puzzle pieces',controls:'Puzzle controls',restart:'Restart puzzle',shuffle:'Shuffle for a new arrangement',hint:'Show a hint',skip:'Skip the puzzle',loading:'Loading',unavailable:'Unavailable',empty:'Empty puzzle position',placed:'Puzzle piece, already placed',piece:'Puzzle piece',pieceHelp:'Select, then choose its matching empty position.',toPlace:'to place',complete:'Complete',choose:'Choose a space',select:'Select a piece',tryAnother:'Try another space',highlighted:'Target highlighted'
      };
      this.selected = null;
      this.initialMissing = [];
      this.pairCueTimer = null;
      this.hasShownEmptyCue = false;
      this.renderFrame();
      this.preload();
    }

    renderFrame() {
      this.root.classList.add('is-loading');
      this.root.innerHTML = `
        <div class="image-puzzle__shell">
          <div class="image-puzzle__board" role="grid" aria-label="${this.escape(this.title)}. ${this.labels.board}"></div>
          <div class="image-puzzle__tray" role="group" aria-label="${this.labels.tray}"></div>
          <p class="image-puzzle__completion">${this.escape(this.completeLabel)}</p>
        </div>
        <div class="image-puzzle__controls" aria-label="${this.labels.controls}">
          ${this.control('restart', this.labels.restart)}
          ${this.control('shuffle', this.labels.shuffle)}
          ${this.control('hint', this.labels.hint)}
          <button class="image-puzzle__skip" type="button" data-action="skip" aria-label="${this.labels.skip}" title="${this.labels.skip}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <span class="image-puzzle__status" role="status" aria-live="polite">${this.labels.loading}</span>`;
      this.board = this.root.querySelector('.image-puzzle__board');
      this.tray = this.root.querySelector('.image-puzzle__tray');
      this.status = this.root.querySelector('.image-puzzle__status');
      this.root.querySelector('[data-action="restart"]').addEventListener('click', () => this.start(this.initialMissing));
      this.root.querySelector('[data-action="shuffle"]').addEventListener('click', () => this.start());
      this.root.querySelector('[data-action="hint"]').addEventListener('click', () => this.hint());
      this.root.querySelector('[data-action="skip"]').addEventListener('click', () => this.skip());
    }

    preload() {
      const image = new Image();
      image.onload = () => {
        this.root.classList.remove('is-loading');
        this.start();
      };
      image.onerror = () => {
        this.root.classList.remove('is-loading');
        this.root.classList.add('is-error');
        this.status.textContent = this.labels.unavailable;
      };
      image.src = this.image;
    }

    start(missing) {
      this.root.classList.remove('is-complete');
      this.selected = null;
      this.missing = missing ? [...missing] : this.pickMissing();
      if (!missing) this.initialMissing = [...this.missing];
      this.board.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
      this.board.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
      const boardFragment = document.createDocumentFragment();
      for (let index = 0; index < this.total; index += 1) {
        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = 'image-puzzle__slot';
        slot.dataset.index = index;
        slot.setAttribute('role', 'gridcell');
        if (this.missing.includes(index)) {
          slot.classList.add('is-empty');
          slot.setAttribute('aria-label', `${this.labels.empty} ${index + 1}`);
          slot.addEventListener('click', () => this.placeSelected(index));
          slot.addEventListener('dragover', event => {
            event.preventDefault();
            slot.classList.add('is-target');
          });
          slot.addEventListener('dragleave', () => slot.classList.remove('is-target'));
          slot.addEventListener('drop', event => {
            event.preventDefault();
            slot.classList.remove('is-target');
            this.place(Number(event.dataTransfer.getData('text/plain')), index);
          });
        } else {
          slot.disabled = true;
          slot.setAttribute('aria-label', `${this.labels.placed} ${index + 1}`);
          this.paint(slot, index);
        }
        boardFragment.append(slot);
      }
      this.board.replaceChildren(boardFragment);
      this.renderTray(this.shuffleArray([...this.missing]));
      this.status.textContent = `${this.missing.length} ${this.labels.toPlace}`;
    }

    renderTray(indices) {
      const fragment = document.createDocumentFragment();
      indices.forEach(index => {
        const piece = document.createElement('button');
        piece.type = 'button';
        piece.className = 'image-puzzle__piece';
        piece.dataset.index = index;
        piece.draggable = false;
        piece.setAttribute('aria-label', `${this.labels.piece} ${index + 1}. ${this.labels.pieceHelp}`);
        piece.setAttribute('aria-pressed', 'false');
        this.paint(piece, index);
        piece.addEventListener('click', () => {
          if ((piece._suppressClickUntil || 0) > Date.now()) return;
          this.select(index);
        });
        piece.addEventListener('mouseenter', () => this.showEmptyCue(piece));
        this.enablePointerDrag(piece, index);
        fragment.append(piece);
      });
      this.tray.replaceChildren(fragment);
    }

    enablePointerDrag(piece, index) {
      let startX = 0;
      let startY = 0;
      let ghost = null;
      let dragging = false;
      let target = null;
      let pointerId = null;

      const clearTarget = () => {
        target?.classList.remove('is-target');
        target = null;
      };

      const move = event => {
        if (event.pointerId !== pointerId) return;
        const distance = Math.hypot(event.clientX - startX, event.clientY - startY);
        if (!dragging && distance < 6) return;
        if (!dragging) {
          dragging = true;
          piece._suppressClickUntil = Date.now() + 250;
          ghost = piece.cloneNode(true);
          ghost.className = 'image-puzzle__drag-ghost';
          ghost.removeAttribute('id');
          document.body.append(ghost);
          piece.classList.add('is-dragging');
          this.root.classList.add('is-dragging-puzzle');
        }
        event.preventDefault();
        ghost.style.left = `${event.clientX}px`;
        ghost.style.top = `${event.clientY}px`;
        const nextTarget = document.elementFromPoint(event.clientX, event.clientY)?.closest('.image-puzzle__slot.is-empty');
        if (nextTarget !== target) {
          clearTarget();
          target = nextTarget;
          target?.classList.add('is-target');
        }
      };

      const finish = event => {
        if (event.pointerId !== pointerId) return;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', finish);
        window.removeEventListener('pointercancel', finish);
        pointerId = null;
        if (dragging) {
          event.preventDefault();
          const slotIndex = target ? Number(target.dataset.index) : -1;
          clearTarget();
          ghost?.remove();
          piece.classList.remove('is-dragging');
          this.root.classList.remove('is-dragging-puzzle');
          dragging = false;
          if (slotIndex >= 0) this.place(index, slotIndex);
        }
      };

      piece.addEventListener('pointerdown', event => {
        if (event.button !== 0 || pointerId !== null) return;
        this.clearPairCue();
        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        window.addEventListener('pointermove', move, { passive: false });
        window.addEventListener('pointerup', finish);
        window.addEventListener('pointercancel', finish);
      });
    }

    showEmptyCue(piece) {
      if (this.hasShownEmptyCue) return;
      this.hasShownEmptyCue = true;
      this.clearPairCue();
      piece.classList.add('is-pair-cue');
      this.board.querySelectorAll('.image-puzzle__slot.is-empty').forEach(slot => slot.classList.add('is-pair-cue'));
      this.pairCueTimer = window.setTimeout(() => this.clearPairCue(), 720);
    }

    clearPairCue() {
      window.clearTimeout(this.pairCueTimer);
      this.pairCueTimer = null;
      this.root.querySelectorAll('.is-pair-cue').forEach(node => node.classList.remove('is-pair-cue'));
    }

    skip() {
      this.clearPairCue();
      this.root.getAnimations({ subtree:true }).forEach(animation => animation.cancel());
      this.missing.forEach(index => {
        const slot = this.board.querySelector(`.image-puzzle__slot[data-index="${index}"]`);
        if (!slot) return;
        slot.classList.remove('is-empty', 'is-target', 'is-wrong', 'is-hinted', 'is-pair-cue');
        slot.disabled = true;
        const completedSlot = slot.cloneNode(true);
        slot.replaceWith(completedSlot);
        this.paint(completedSlot, index);
      });
      this.missing = [];
      this.selected = null;
      this.tray.replaceChildren();
      this.status.textContent = this.labels.complete;
      this.root.classList.add('is-complete');
    }

    select(index) {
      this.selected = this.selected === index ? null : index;
      this.tray.querySelectorAll('.image-puzzle__piece').forEach(piece => {
        piece.setAttribute('aria-pressed', String(Number(piece.dataset.index) === this.selected));
      });
      if (this.selected !== null) this.status.textContent = this.labels.choose;
      else this.status.textContent = `${this.missing.length} ${this.labels.toPlace}`;
    }

    placeSelected(slotIndex) {
      if (this.selected === null) {
        this.flashWrong(slotIndex);
        this.status.textContent = this.labels.select;
        return;
      }
      this.place(this.selected, slotIndex);
    }

    place(pieceIndex, slotIndex) {
      if (!Number.isInteger(pieceIndex) || pieceIndex !== slotIndex || !this.missing.includes(slotIndex)) {
        this.flashWrong(slotIndex);
        this.status.textContent = this.labels.tryAnother;
        return;
      }
      const slot = this.board.querySelector(`[data-index="${slotIndex}"]`);
      slot.classList.remove('is-empty');
      slot.disabled = true;
      slot.replaceWith(slot.cloneNode(true));
      const placedSlot = this.board.querySelector(`[data-index="${slotIndex}"]`);
      this.paint(placedSlot, slotIndex);
      placedSlot.classList.add('is-correct');
      window.setTimeout(() => placedSlot.classList.remove('is-correct'), 720);
      this.tray.querySelector(`[data-index="${pieceIndex}"]`)?.remove();
      this.missing = this.missing.filter(index => index !== slotIndex);
      this.selected = null;
      this.status.textContent = this.missing.length ? `${this.missing.length} ${this.labels.toPlace}` : this.labels.complete;
      if (!this.missing.length) this.root.classList.add('is-complete');
    }

    hint() {
      if (!this.missing.length) return;
      const pieceIndex = this.selected ?? Number(this.tray.querySelector('.image-puzzle__piece')?.dataset.index);
      const slot = this.board.querySelector(`[data-index="${pieceIndex}"]`);
      if (!slot) return;
      slot.classList.remove('is-hinted');
      void slot.offsetWidth;
      slot.classList.add('is-hinted');
      this.status.textContent = this.labels.highlighted;
      window.setTimeout(() => {
        slot.classList.remove('is-hinted');
        if (this.missing.includes(pieceIndex)) this.status.textContent = `${this.missing.length} ${this.labels.toPlace}`;
      }, 1250);
    }

    paint(element, index) {
      const col = index % this.cols;
      const row = Math.floor(index / this.cols);
      element.style.backgroundImage = `url("${this.image}")`;
      element.style.backgroundSize = `${this.cols * 100}% ${this.rows * 100}%`;
      element.style.backgroundPosition = `${this.cols === 1 ? 0 : (col / (this.cols - 1)) * 100}% ${this.rows === 1 ? 0 : (row / (this.rows - 1)) * 100}%`;
    }

    flashWrong(index) {
      const slot = this.board.querySelector(`[data-index="${index}"]`);
      if (!slot) return;
      slot.classList.remove('is-wrong');
      void slot.offsetWidth;
      slot.classList.add('is-wrong');
    }

    pickMissing() {
      return this.shuffleArray(Array.from({ length: this.total }, (_, index) => index)).slice(0, this.missingCount).sort((a, b) => a - b);
    }

    shuffleArray(values) {
      for (let index = values.length - 1; index > 0; index -= 1) {
        const random = Math.floor(Math.random() * (index + 1));
        [values[index], values[random]] = [values[random], values[index]];
      }
      return values;
    }

    control(action, label) {
      return `<button class="image-puzzle__control" type="button" data-action="${action}" aria-label="${label}" title="${label}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[action]}</svg></button>`;
    }

    escape(value) {
      const node = document.createElement('span');
      node.textContent = value;
      return node.innerHTML;
    }
  }

  const init = () => document.querySelectorAll('[data-institutional-image-puzzle]').forEach(root => {
    if (!root.dataset.puzzleReady) {
      root.dataset.puzzleReady = 'true';
      new InstitutionalImagePuzzle(root);
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
