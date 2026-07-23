import { clearProgress, stopTimer } from './state.js';

const CONTROL_IDS = ['hint-btn', 'shuffle-btn', 'give-up-btn'];

export function lockGame() {
  stopTimer();
  document.getElementById('lock-overlay').classList.remove('hidden');
  CONTROL_IDS.forEach(id => { document.getElementById(id).disabled = true; });
  document.getElementById('next-btn').disabled = true;
  hideFinalOverlay();
  hideLevelOverlay();
}

export function unlockGame() {
  document.getElementById('lock-overlay').classList.add('hidden');
  CONTROL_IDS.forEach(id => { document.getElementById(id).disabled = false; });
}

export function showAbout() {
  const aboutScreen = document.getElementById('about-screen');
  document.getElementById('app-shell').style.display = 'none';
  aboutScreen.style.display = 'block';
  window.location.hash = 'about';
}

export function hideAbout() {
  document.getElementById('about-screen').style.display = 'none';
  history.pushState('', '', window.location.pathname);
  document.getElementById('app-shell').style.display = 'grid';
}

export function hideLevelOverlay() {
  document.getElementById('level-overlay').classList.remove('show');
}

export function hideBonusOverlay() {
  document.getElementById('bonus-overlay').classList.remove('show');
}

export function hideFinalOverlay() {
  document.getElementById('final-overlay').classList.remove('show');
}

export function hideContinueOverlay() {
  document.getElementById('continue-overlay').classList.remove('show');
}

export function showRestartConfirm() {
  document.getElementById('restart-overlay').classList.add('show');
}

export function hideRestart() {
  document.getElementById('restart-overlay').classList.remove('show');
}

export function doRestart() {
  hideRestart();
  clearProgress();
  lockGame();
}
