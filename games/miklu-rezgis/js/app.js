'use strict';

const RIDDLES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSrAe1vIq__WSCT4FUOA2gHDlkL4g7RCm43CJEDAdvKRzbRulSpqHjGwtXBGot0mgWO4yLYUuc7RMJ-/pub?output=csv';
const ANALYTICS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyAv7G_yZte1RBtUIa6zVdDqGPtBd6y9BOMnG2QOFrv3CAFB1SEOd6_PNx8SNTHv-Yi/exec';

const LEVEL_BASE = [0, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 500];
const BONUS_RIDDLE_POINTS = 500;

const MODE_MAX = { 10: 3335, 50: 12075, 100: 23000, daily: 115, party: 0 };
const MODE_RPL = { 10: 1, 50: 5, 100: 10, daily: 1, party: 1 };

const MODE_NAMES = { 10: 'Ātrā spēle', 50: 'Vidējā spēle', 100: 'Garā spēle', daily: 'Dienas mīkla', party: 'Ballītes versija' };

const MAX_LIVES = 3;
const MAX_HINTS = 3;
const MAX_HINTS_HARD = 5;
const PENALTY_WRONG = 15;
const PENALTY_HINT = 25;

const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

const LV_ALPHABET = 'AĀBCČDEĒFGĢHIĪJKĶLĻMNŅOPRSŠTUŪVZŽ';

const STORAGE_KEY = 'lmg_progress';
const ANALYTICS_QUEUE_KEY = 'lmg_analytics_queue';
const DAILY_PLAYED_PREFIX = 'lmg_daily_played_';
const PROGRESS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// ==== wordUtils.js ====
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function norm(s) {
  return s.toUpperCase().replace(/\s+/g, '');
}

function getWords(answer) {
  return answer.split(/\s+/).filter(w => w.length > 0);
}

function cellKey(r, c) {
  return `${r},${c}`;
}

function dailyDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dailyDateLabel() {
  return new Intl.DateTimeFormat('lv-LV', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
}

function dailyIndex(key, length) {
  let hash = 2166136261;
  for (const char of key) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % length;
}

function dailyDifficultyLabel(level) {
  if (level <= 2) return 'diezgan viegla';
  if (level <= 4) return 'samērā viegla';
  if (level <= 6) return 'ne visai grūta';
  if (level <= 8) return 'diezgan grūta';
  return 'ļoti izaicinoša';
}

function getDailySelection() {
  const pool = [];
  for (let level = 1; level <= 10; level += 1) {
    (state.levels[level] || []).forEach(riddle => {
      if (riddle && riddle.q && riddle.a) pool.push({ riddle, level });
    });
  }
  if (!pool.length) return null;
  return pool[dailyIndex(dailyDateKey(), pool.length)];
}

function updateDailyModeSummary() {
  const summary = document.getElementById('daily-mode-sub');
  if (!summary) return;
  const selection = getDailySelection();
  summary.textContent = selection
    ? `1 mīkla · katru dienu cita · šodien tā varētu būt ${dailyDifficultyLabel(selection.level)}`
    : '1 mīkla · katru dienu cita';
}

function hasPlayedDaily() {
  try { return Boolean(localStorage.getItem(DAILY_PLAYED_PREFIX + dailyDateKey())); }
  catch (e) { return false; }
}

function markDailyPlayed(solved) {
  if (state.gameMode !== 'daily') return;
  try {
    localStorage.setItem(DAILY_PLAYED_PREFIX + dailyDateKey(), JSON.stringify({ solved, score: state.totalScore, playedAt: Date.now() }));
  } catch (e) { /* ignore */ }
}

// ==== riddleData.js ====
const FILLER_WORDS = [
"MĀJA","LAIKS","SAULE","MĀTE","TĒVS","BĒRNS","ŪDENS","MAIZE","GAISS","ZEME","NAKTS","DIENA","MEŽS","CEĻŠ","LIETUS","SNIEGS","VĒJŠ","UGUNS","ZĀLE","PUTNS","ZIVS","ZIRGS","GOVS","KAĶIS","SUNS","BITE","LAPA","KOKS","ROKAS","KĀJAS","GALVA","SIRDS","ACIS","MUTE","AUSIS","MATI","ISTABA","LOGS","DURVIS","JUMTS","GALDS","KRĒSLS","GULTA","PIENS","SIERS","GAĻA","ĀBOLS","MEDUS","RUDENS","VASARA","ZIEMA","RĪTS","VAKARS","GADS","STUNDA","SKOLA","PILSĒTA","CIEMS","EZERS","UPE","KALNS","PĻAVA","JŪRA","DRAUGS","SIEVA","VĪRS","MĀSA","BRĀLIS","DARBS","NAUDA","LAIME","MIERS","PRIEKS"
];

const FALLBACK_LEVELS = {
1:[{q:"Sarkans gailis zemē dzied.",a:"Burkāns"},{q:"Akmeņa kājas, koka rumpis, salmu cepure.",a:"Māja"},{q:"Kas stāv pie griestiem ar kājām uz augšu?",a:"Muša"},{q:"Mežā dzimis, mežā audzis, atnāk mājā par saimnieku būt.",a:"Galds"},{q:"Balta zeme, melna sēkla.",a:"Grāmata"},{q:"Maza muciņa divejāds alutiņš.",a:"Ola"},{q:"Kas taisa tiltu bez neviena baļķa.",a:"Sals"},{q:"Četri taisa vietu, divi rāda uguni, viens pats apgulstas.",a:"Suns"},{q:"Apaļš kā rullis, sarkans kā bullis, šķēres padusē.",a:"Vēzis"},{q:"Mēness skala galā.",a:"Svece"}],
2:[{q:"Sarkans vīriņš, zaļa bārdiņa.",a:"Burkāns"},{q:"Mazs, mazs sunītis simts adatu mugurā.",a:"Ezis"},{q:"Bez rokām, bez cirvja uztaisa mājiņu.",a:"Skudra"},{q:"Krustiem šķērsiem kauli likti, pati miesa cauri spīd.",a:"Logs"},{q:"Kas dara raudas bez gaudām?",a:"Sīpols"},{q:"Cērt ledu, uzcērt sudrabu, cērt sudrabu, uzcērt zeltu.",a:"Ola"},{q:"Aka bez dibena.",a:"Gredzens"},{q:"Stabiņš sūnās, galdiņš virsū.",a:"Sēne"},{q:"Maza, maza mājiņa, ne tai logu, ne durvju.",a:"Ola"},{q:"Melns pirtī ienāk, sarkans iznāk.",a:"Vēzis"}],
3:[{q:"Mazs, mazs vīriņš, ass, ass cirvīts.",a:"Bite"},{q:"Lec kā zaķis, nav zaķis. Peld kā zivs, nav zivs.",a:"Varde"},{q:"Kas ziemu nesalst un vasaru neizkūst.",a:"Akmens"},{q:"Ik rītus viešiņa pa istabu skrien.",a:"Izkapts"},{q:"Pieci kambari, vienas durvis.",a:"Cimds"},{q:"Mazs, mazs vīriņš līkām kājām zaļi svārki mugurā.",a:"Sienāzis"},{q:"Dzelža cūciņa, pakala astīte.",a:"Adata"},{q:"Mežs kalnā. Es lejā. Es par mežu lielāks.",a:"Kāposti un vagas"},{q:"Papriekš sarkans un tad melns.",a:"Ogle"},{q:"Divi mazi zirnīši apsēj visu pasauli.",a:"Acis"}],
4:[{q:"Pelēka aitiņa – astīte sānos.",a:"Cimds"},{q:"Caurums pie cauruma, bet tomēr stipris.",a:"Ķēde"},{q:"Maza, maza mājiņa stāv uz tievas kājiņas. Simtu kambaru, katrā kambarī pa simts mamzelīšu.",a:"Magone"},{q:"Mazs, mazs vīriņš, deviņas ādiņas. Kas tās dīrās, tas gauži raudās.",a:"Sīpols"},{q:"Galds runā – saime klusē.",a:"Cūka ar sivēniem"},{q:"Pieci baļķi māju taisa visi pieci atliekās.",a:"Audekls"},{q:"Pilna kūtiņa sarkanu aitiņu, ieiet garais izvajā!",a:"Krāsns"},{q:"Maza, maza muciņa, melns alutiņš.",a:"Tintnīca"},{q:"Ne čiku, ne grabu, labrīt pie loga.",a:"Gaisma"},{q:"Kas iet uz galvas baznīcā?",a:"Kāja zābakā"}],
5:[{q:"Div pilnas laktiņas baltu vistiņu.",a:"Zobi un mēle"},{q:"Divas ielas bērza malkas, vidū elkšņa pagale.",a:"Zobi un mēle"},{q:"Mazs, mazs zirdziņš, dienu nakti jājams.",a:"Slieksnis"},{q:"Sarkans suns lēkā aiz kaula sētiņas.",a:"Mēle"},{q:"Pakulu ķēve – linu aste.",a:"Adata un diegs"},{q:"Ozola dēlīts purviņā mirkst.",a:"Mute un mēle"},{q:"Pīpīts lēca, pīpīts deja, pīpa pēdu nepazina.",a:"Šūpulis"},{q:"Maza, maza sieviņa franciski runā.",a:"Bezdelīga"},{q:"Stabiņš sūnās, galdiņš virsū.",a:"Sēne"},{q:"Vīrs sēd uz jumta un pīpē.",a:"Skurstenis"}],
6:[{q:"Divas māsiņas viena vienā ceļa malā, otra otrā. Viena otru neredz.",a:"Acis"},{q:"Pēdu garš, tomēr pēda nav.",a:"Kurpe"},{q:"Četri brāļi iet pa ceļu, visiem bārdas atpakaļ.",a:"Zirga kājas"},{q:"Četri mācītāji zem vienas cepures.",a:"Galda kājas"},{q:"Pa dienu apkārt staigā, pa nakti karājas.",a:"Pastalas"},{q:"Mūsu pašu lielam kungam lūku ritens uz pakaļas.",a:"Suns ar asti"},{q:"Sarkana cūciņa astru astīte.",a:"Dzērvene sūnās"},{q:"Plikais līkais karājās, spalvainais lūrējās.",a:"Kaķis un desa"},{q:"Papriekš bērni dzimst, tad tik māte.",a:"Siens un siena guba"},{q:"Maza, maza sieviņa simtu miču galvā.",a:"Kāpostgalva"}],
7:[{q:"Ar kājām min, ar vēderu trin – papleš un iebāž.",a:"Auž"},{q:"Mežā dzimis, mežā audzis – pārnāk mājās – cilā asti.",a:"Akas vinda"},{q:"Mežā dzimis, mežā audzis, pārnāk mājās, gauži raud.",a:"Vijole"},{q:"Nasta pūš – nesējs nē.",a:"Jātnieks un zirgs"},{q:"Vīrs niķu niķiem svārks stiķu stiķiem; kaula seja, gaļas bārda.",a:"Gailis"},{q:"Tālāk nosviežu kā noeju.",a:"Prāts"},{q:"Divi dur, divi vēzās.",a:"Maizi mīca"},{q:"Sarkana telīte astē piesieta.",a:"Ķirsis"},{q:"Līdaka aizskrēja, līdaka atskrēja. Daugava sasala trinkšķēdama.",a:"Audekls"},{q:"Vienā galā tā kā kārts, otrā galā tā kā ķeksis, vidū kā kumoss, danco kā jaunava.",a:"Žagata"}],
8:[{q:"Divi rulles, divi tulles, četri zemes mērītāji, devīts kaŗa vajātājs.",a:"Govs"},{q:"Jo cūciņa skrien, jo barojas.",a:"Ratiņa spole"},{q:"Melns dejo, melns lec, pēdas vien nepaliek.",a:"Blusa kož cilvēkam"},{q:"Sešders siekstu kustināja.",a:"Blusa kož cilvēkam"},{q:"Simtacs gāja viesus lūgt.",a:"Tīkls"},{q:"Zila govs zemi laiza.",a:"Izkapts"},{q:"Ielāps uz ielāpa nav ielāp, zied kā puķe nav puķe.",a:"Kāpostgalva"},{q:"Šmurgulīts ar vienu ausi.",a:"Ķipītis"},{q:"Avens vērša vēderā.",a:"Zeķe zābakā"},{q:"Tieva, gaŗa jumprava – utu pilna galva.",a:"Kaņepe"}],
9:[{q:"Kad es biju maziņa, man bij balta kleitiņa. Nu es esmu liela – mana sirds ir tik cieta kā akmens.",a:"Ķirsis"},{q:"Kāpi, puisīti, man virsū, krati, grūsti – tev būs labums, man būs vieglums.",a:"Ābele"},{q:"Ej tu pa vienu pusi, es iešu pa otru pusi, un uz putras kalna satiksimies.",a:"Josta ap vidukli"},{q:"Tēvs vēl nav dzimis, jau dēls skursteņa galā.",a:"Uguns un dūmi"},{q:"Vēl zirgs nav sajūgts, jau stāvus.",a:"Dūmi un uguns"},{q:"Velns iet pa riju, boms mugurā.",a:"Kaķis"},{q:"Tieva gaŗa freilenīte – tālu spļauj.",a:"Šautene"},{q:"Pārcērt ledu, atrod sudrabu. Pārcērt sudrabu, atrod zeltu.",a:"Ola"},{q:"Balta, balta baznīciņa, ne logi, ne durvis. Ubags vidū dzied.",a:"Cālis olā"},{q:"Teļš bez mēles kalnu starpā bļauj.",a:"Pirdiens"}],
10:[{q:"Viņa viņu mīl, viņš viņu nemīl. Ja viņa viņu atrod, tad viņa ir laimīga, bet ja viņš viņu atrod, tad viņai ir nāve.",a:"Suns un blusa"},{q:"Viņā zemē zirgu jūdzu, šai zemē loks atsprāga.",a:"Varavīksne"},{q:"Vīrs brauc pa mežu – zarnas klēpī.",a:"Braucējs un groži"},{q:"Arājs ar tīrumā samta svārki mugurā.",a:"Kurmis"},{q:"Cik vajag naglu labi apkaltam zirgam?",a:"Nevienas"},{q:"Kur gailis lec, kad gadu vecs?",a:"Otrā gadā"},{q:"Kurā krūzē nevar ieliet ūdeni?",a:"Pilnā"},{q:"Kas tas par suni, kas tikai septītā dienā rej.",a:"Mācītājs"},{q:"Jo atņem – top lielāks, liek klāt – mazāks.",a:"Bedre"},{q:"Mežā dzimis, mežā audzis, pārnāk mājās, gauži raud.",a:"Vijole"}],
};

const FALLBACK_BONUS = 
[{q:"Tieva mana kājiņa, maza mana galviņa, bet kad meitas ģērbties sāk, bez manis maz ko darīt māk.",a:"Kniepadata"},{q:"Pelēks auns cauru muguru apēd visu vasaras krājumu.",a:"Dzirnavas"},{q:"Ne ugunī deg, ne ūdenī slīkst.",a:"Ēna"}];

// ==== state.js ====
function emptyLevels() {
  return { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [] };
}

const state = {
  levels: emptyLevels(),
  bonusPool: [],
  levelsLoaded: false,

  gameMode: 10,
  selectedMode: null,
  participationMode: 'player',
  riddlesPerLevel: 10,
  maxScore: 20000,

  currentLevel: 1,
  riddleIdx: 0,
  totalScore: 0,
  levelScore: 0,
  totalTimeBonus: 0,
  currentTimeBonus: 0,
  isBonus: false,
  dailySolved: false,
  party: null,
  bonusRiddles: [],
  shuffledLevel: [],

  grid: [],
  gridSize: 7,
  placedWords: [],
  fillerCells: new Set(),
  foundWords: new Set(),
  foundCells: new Set(),
  hintedLetters: {},
  wordState: {},

  riddleScore: 0,
  livesLeft: MAX_LIVES,
  hintsLeft: MAX_HINTS,
  hintLimit: MAX_HINTS,
  gameOver: false,

  dragging: false,
  dragCells: [],
  dragStart: null,

  shareText: '',
  sessionId: '',
  sessionStartedAt: '',
  survey: { rating: '', ageGroup: '', comment: '' },
  feedbackSubmitted: false,
  researchAnswers: {},
  riddleOutcome: '',
  currentAwardedPoints: 0,
  currentShuffleCount: 0,
  evaluationSaved: false,
  sessionRiddleRecorded: false,
  sessionFinishedAt: '',
  sessionStats: null,
  dailyReplay: false,

  timerSeconds: 0,
  riddleSeconds: 0,
  timerHandle: null,
};

function startTimer() {
  stopTimer();
  state.timerHandle = setInterval(() => {
    if (document.hidden) return;
    state.timerSeconds++;
    if (!state.gameOver) state.riddleSeconds++;
  }, 1000);
}

function stopTimer() {
  if (state.timerHandle) { clearInterval(state.timerHandle); state.timerHandle = null; }
}

function resetTimer() {
  state.timerSeconds = 0;
}

function basePoints() {
  return state.isBonus ? BONUS_RIDDLE_POINTS : LEVEL_BASE[state.currentLevel];
}

function calculateTimeBonus(base, seconds) {
  if (seconds <= 30) return Math.round(base * 0.15);
  if (seconds <= 60) return Math.round(base * 0.10);
  if (seconds <= 90) return Math.round(base * 0.05);
  return 0;
}

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function currentRiddle() {
  return state.isBonus ? state.bonusRiddles[state.riddleIdx] : state.shuffledLevel[state.riddleIdx];
}

function resetForNewGame() {
  state.sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `lmg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.sessionStartedAt = new Date().toISOString();
  state.survey = { rating: '', ageGroup: '', comment: '' };
  state.feedbackSubmitted = false;
  state.sessionFinishedAt = '';
  state.sessionStats = {
    completed: 0,
    solved: 0,
    givenUp: 0,
    hintsUsed: 0,
    wrongAttempts: 0,
    shuffleCount: 0,
    lastCompletedRiddle: ''
  };
  state.dailyReplay = false;
  state.currentLevel = 1;
  state.riddleIdx = 0;
  state.totalScore = 0;
  state.levelScore = 0;
  state.totalTimeBonus = 0;
  state.currentTimeBonus = 0;
  state.isBonus = false;
  state.dailySolved = false;
  state.bonusRiddles = [];
}

function plannedRiddleCount() {
  if (state.gameMode === 'party' && state.party) return state.party.riddlesPerPlayer * 2;
  if (state.gameMode === 'daily') return 1;
  return Number(state.gameMode) || 0;
}

function sessionTotals() {
  if (state.gameMode === 'party' && state.party) {
    return {
      points: state.party.scores.reduce((sum, value) => sum + value, 0),
      timeBonus: state.party.timeBonuses.reduce((sum, value) => sum + value, 0),
      timeMs: state.party.totalTimes.reduce((sum, value) => sum + value, 0) * 1000
    };
  }
  return {
    points: state.totalScore,
    timeBonus: state.totalTimeBonus,
    timeMs: state.timerSeconds * 1000
  };
}

function queueSessionUpdate(status, extra = {}) {
  const stats = state.sessionStats;
  // A session only becomes analytics data after at least one riddle was completed or given up.
  if (!stats || stats.completed < 1) return;
  const totals = sessionTotals();
  const now = new Date().toISOString();
  if (status === 'completed' && !state.sessionFinishedAt) state.sessionFinishedAt = now;
  queueAnalyticsRecord({
    record_type: 'session_update',
    session_id: state.sessionId,
    session_started_at: state.sessionStartedAt,
    last_updated_at: now,
    session_finished_at: state.sessionFinishedAt,
    session_status: status,
    game_version: String(state.gameMode),
    participation_type: state.gameMode === 'party' ? 'party' : state.participationMode,
    research_consent: state.gameMode !== 'party' && state.participationMode === 'research',
    planned_riddle_count: plannedRiddleCount(),
    completed_riddle_count: stats.completed,
    last_completed_riddle: stats.lastCompletedRiddle,
    total_time_ms: totals.timeMs,
    total_points: totals.points,
    time_bonus_points: totals.timeBonus,
    solved_riddles: stats.solved,
    given_up_riddles: stats.givenUp,
    hints_used: stats.hintsUsed,
    wrong_attempts: stats.wrongAttempts,
    shuffle_count: stats.shuffleCount,
    device_type: window.innerWidth < 768 ? 'mobile' : (window.innerWidth < 1100 ? 'tablet' : 'desktop'),
    screen_size_group: `${window.innerWidth}x${window.innerHeight}`,
    theme: document.documentElement.dataset.theme || 'dark',
    font_size: document.documentElement.dataset.fontSize || 'default',
    daily_replay: state.dailyReplay,
    feedback_submitted: state.feedbackSubmitted,
    app_version: 'demo-2026-07-23',
    data_schema_version: '1',
    ...extra
  });
}

function recordCompletedRiddleForSession() {
  if (state.sessionRiddleRecorded || !state.sessionStats) return;
  const riddle = currentRiddle();
  const stats = state.sessionStats;
  stats.completed++;
  if (state.riddleOutcome === 'solved') stats.solved++;
  if (state.riddleOutcome === 'gave_up') stats.givenUp++;
  stats.hintsUsed += state.hintLimit - state.hintsLeft;
  stats.wrongAttempts += Math.max(0, MAX_LIVES - state.livesLeft);
  stats.shuffleCount += state.currentShuffleCount;
  stats.lastCompletedRiddle = datasetRiddleId(riddle);
  state.sessionRiddleRecorded = true;
  queueSessionUpdate('in_progress');
}

function queueAnalyticsRecord(record) {
  try {
    const queue = JSON.parse(localStorage.getItem(ANALYTICS_QUEUE_KEY) || '[]');
    queue.push(record);
    localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue.slice(-250)));
    flushAnalyticsQueue();
  } catch (e) {
    console.warn('Neizdevās saglabāt analītikas ierakstu lokāli:', e);
  }
}

let analyticsFlushInProgress = false;

function flushAnalyticsQueue() {
  if (analyticsFlushInProgress || !ANALYTICS_SCRIPT_URL || !navigator.onLine) return;

  let queuedRecords;
  try {
    queuedRecords = JSON.parse(localStorage.getItem(ANALYTICS_QUEUE_KEY) || '[]');
  } catch (e) {
    return;
  }
  if (!queuedRecords.length) return;

  analyticsFlushInProgress = true;
  const batch = queuedRecords.slice(0, 50);

  fetch(ANALYTICS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ records: batch }),
    redirect: 'follow'
  })
    .then(response => response.json())
    .then(result => {
      if (!result || result.ok !== true) throw new Error(result?.error || 'Analytics request failed.');
      const latestQueue = JSON.parse(localStorage.getItem(ANALYTICS_QUEUE_KEY) || '[]');
      localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(latestQueue.slice(batch.length)));
    })
    .catch(error => console.warn('Analītikas dati palika lokālajā rindā:', error))
    .finally(() => {
      analyticsFlushInProgress = false;
      try {
        const remaining = JSON.parse(localStorage.getItem(ANALYTICS_QUEUE_KEY) || '[]');
        if (remaining.length) setTimeout(flushAnalyticsQueue, 1200);
      } catch (e) { /* ignore */ }
    });
}

function stableRiddleId(riddle) {
  const source = `${riddle?.q || ''}|${riddle?.a || ''}`;
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `riddle-${(hash >>> 0).toString(16)}`;
}

function datasetRiddleId(riddle) {
  const lookupKey = String(riddle?.q || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
  const embeddedMetadata = typeof RIDDLE_DATASET_METADATA !== 'undefined'
    ? RIDDLE_DATASET_METADATA[lookupKey]
    : null;
  return String(riddle?.gameId || embeddedMetadata?.gameId || stableRiddleId(riddle)).trim();
}

function datasetUnitNumber(riddle) {
  const lookupKey = String(riddle?.q || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
  const embeddedMetadata = typeof RIDDLE_DATASET_METADATA !== 'undefined'
    ? RIDDLE_DATASET_METADATA[lookupKey]
    : null;
  return String(riddle?.unitNumber || embeddedMetadata?.unitNumber || '').trim();
}

function datasetSourceMetadata(riddle) {
  const lookupKey = String(riddle?.q || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
  const embeddedMetadata = typeof RIDDLE_DATASET_METADATA !== 'undefined'
    ? RIDDLE_DATASET_METADATA[lookupKey]
    : null;
  return {
    teller: String(riddle?.teller || embeddedMetadata?.teller || '').trim(),
    recorder: String(riddle?.recorder || embeddedMetadata?.recorder || '').trim(),
    place: String(riddle?.loc || embeddedMetadata?.place || '').trim(),
    year: String(riddle?.year || embeddedMetadata?.year || '').trim(),
    unitNumber: String(riddle?.unitNumber || embeddedMetadata?.unitNumber || '').trim(),
    sourceUrl: String(riddle?.sourceUrl || embeddedMetadata?.sourceUrl || '').trim()
  };
}

function currentResponseId() {
  const partyTurn = state.gameMode === 'party' && state.party
    ? `-p${state.party.currentPlayer + 1}-t${state.party.round + 1}`
    : '';
  return `${state.sessionId}-l${state.currentLevel}-r${state.riddleIdx + 1}${partyTurn}`;
}

function queueCurrentEvaluation(researchAnswers = {}, skipped = false) {
  if (state.evaluationSaved) return;
  const riddle = currentRiddle();
  if (!riddle) return;
  const hintsUsed = state.hintLimit - state.hintsLeft;
  const wrongAttempts = Math.max(0, MAX_LIVES - state.livesLeft);
  const solutionMethod = researchAnswers.solution_method || '';
  queueAnalyticsRecord({
    record_type: 'evaluation',
    response_id: currentResponseId(),
    session_id: state.sessionId,
    played_at: new Date().toISOString(),
    riddle_order: `${state.currentLevel}.${state.riddleIdx + 1}`,
    riddle_id: datasetRiddleId(riddle),
    unit_number: datasetUnitNumber(riddle),
    riddle_level: state.currentLevel,
    game_version: String(state.gameMode),
    participation_type: state.gameMode === 'party' ? 'party' : state.participationMode,
    party_player_slot: state.gameMode === 'party' && state.party ? state.party.currentPlayer + 1 : '',
    riddle_text: riddle.q || '',
    answer: riddle.a || '',
    riddle_location: riddle.loc || '',
    riddle_collection: riddle.kolekcija || riddle.collection || '',
    solved: state.riddleOutcome === 'solved',
    gave_up: state.riddleOutcome === 'gave_up',
    time_ms: state.riddleSeconds * 1000,
    points: state.currentAwardedPoints,
    time_bonus_points: state.currentTimeBonus,
    hints_used: hintsUsed,
    wrong_attempts: wrongAttempts,
    shuffle_count: state.currentShuffleCount,
    heard_before: researchAnswers.heard_before || '',
    knew_answer_before_search: solutionMethod === 'knew' ? 'yes' : (solutionMethod ? 'no' : ''),
    solution_method: solutionMethod,
    difficulty_rating: researchAnswers.difficulty_rating || '',
    knows_similar_variant: researchAnswers.knows_similar_variant || '',
    similar_variant_text: researchAnswers.similar_variant_text || '',
    variant_source: '',
    research_questions_skipped: skipped
  });
  state.evaluationSaved = true;
}

function resetRiddleState() {
  state.gameOver = false;
  state.hintLimit = state.currentLevel >= 6 ? MAX_HINTS_HARD : MAX_HINTS;
  state.hintsLeft = state.hintLimit;
  state.livesLeft = MAX_LIVES;
  state.foundCells = new Set();
  state.foundWords = new Set();
  state.hintedLetters = {};
  state.wordState = {};
  state.dragCells = [];
  state.dragStart = null;
  state.dragging = false;
  state.riddleScore = basePoints();
  state.currentTimeBonus = 0;
  state.currentAwardedPoints = 0;
  state.currentShuffleCount = 0;
  state.riddleOutcome = '';
  state.researchAnswers = {};
  state.evaluationSaved = false;
  state.sessionRiddleRecorded = false;
  state.riddleSeconds = 0;
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      gameMode: state.gameMode,
      participationMode: state.participationMode,
      currentLevel: state.currentLevel,
      riddleIdx: state.riddleIdx,
      totalScore: state.totalScore,
      levelScore: state.levelScore,
      totalTimeBonus: state.totalTimeBonus,
      isBonus: state.isBonus,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Neizdevās saglabāt progresu:', e);
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Neizdevās notīrīt saglabāto progresu:', e);
  }
}

function readSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > PROGRESS_MAX_AGE_MS) {
      clearProgress();
      return null;
    }
    return data;
  } catch (e) {
    console.warn('Neizdevās nolasīt saglabāto progresu:', e);
    return null;
  }
}

// ==== gridBuilder.js ====
const MAX_GRID_SIZE = 16;

function computeGridSize(level) {
  if (level === 1) return 7;
  if (level <= 4) return 9;
  return 11;
}

function resolveGridSize(level, answer) {
  const base = computeGridSize(level);
  const words = getWords(answer).map(w => norm(w).length);
  const longest = words.length ? Math.max(...words) : 0;
  return Math.min(Math.max(base, longest), MAX_GRID_SIZE);
}

function cellSizePx(size) {
  const maxWidth = Math.min(window.innerWidth, 520) - 32;
  const widthSize = Math.floor((maxWidth - (size - 1) * 3) / size);
  const cap = size === 7 ? 58 : size === 9 ? 48 : 38;
  const gridStageHeight = document.querySelector('.grid-stage')?.clientHeight || 0;
  const gridHeight = window.innerWidth >= 1100
    ? (gridStageHeight > 120 ? gridStageHeight - 76 : Math.max(230, window.innerHeight - 500))
    : window.innerHeight * 0.62;
  const heightSize = Math.floor((gridHeight - (size - 1) * 3) / size);
  return Math.max(24, Math.min(widthSize, heightSize, cap));
}

function fillerCount(size) {
  if (size <= 7) return 3;
  if (size <= 9) return 5;
  return 7;
}

function tryPlace(grid, word, size, markSet) {
  const wlen = word.length;
  for (let attempt = 0; attempt < 500; attempt++) {
    const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
    const rMin = dr > 0 ? 0 : dr < 0 ? wlen - 1 : 0;
    const rMax = dr > 0 ? size - wlen : dr < 0 ? size - 1 : size - 1;
    const cMin = dc > 0 ? 0 : dc < 0 ? wlen - 1 : 0;
    const cMax = dc > 0 ? size - wlen : dc < 0 ? size - 1 : size - 1;
    if (rMin > rMax || cMin > cMax) continue;

    const sr = rMin + Math.floor(Math.random() * (rMax - rMin + 1));
    const sc = cMin + Math.floor(Math.random() * (cMax - cMin + 1));

    const cells = [];
    let valid = true;
    for (let i = 0; i < wlen; i++) {
      const r = sr + dr * i, c = sc + dc * i;
      if (r < 0 || r >= size || c < 0 || c >= size) { valid = false; break; }
      if (grid[r][c] !== '' && grid[r][c] !== word[i]) { valid = false; break; }
      cells.push([r, c]);
    }
    if (valid) {
      for (let i = 0; i < wlen; i++) grid[cells[i][0]][cells[i][1]] = word[i];
      if (markSet) cells.forEach(([r, c]) => markSet.add(cellKey(r, c)));
      return cells;
    }
  }
  return null;
}

function shuffleFillers(grid, placedWords, size) {
  const protectedCells = new Set();
  placedWords.forEach(pw => {
    if (pw.cells) pw.cells.forEach(([r, c]) => protectedCells.add(cellKey(r, c)));
  });
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (protectedCells.has(cellKey(r, c))) continue;
      grid[r][c] = LV_ALPHABET[Math.floor(Math.random() * LV_ALPHABET.length)];
    }
  }
  return grid;
}

function buildGrid(answer, size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(''));
  const placedWords = [];
  const fillerCells = new Set();
  const usedWords = new Set();

  for (const word of getWords(answer)) {
    const wn = norm(word);
    if (usedWords.has(wn)) {
      placedWords.push({ word: wn, cells: null, duplicate: true });
      continue;
    }
    if (wn.length > size) {
      placedWords.push({ word: wn, cells: null, unplaceable: true });
      continue;
    }
    const cells = tryPlace(grid, wn, size, null);
    if (cells) { placedWords.push({ word: wn, cells }); usedWords.add(wn); }
    else placedWords.push({ word: wn, cells: null, unplaceable: true });
  }

  const candidates = shuffle([...FILLER_WORDS].filter(w => w.length <= size));
  for (const fw of candidates.slice(0, fillerCount(size))) {
    if (usedWords.has(fw)) continue;
    const cells = tryPlace(grid, fw, size, fillerCells);
    if (cells) usedWords.add(fw);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) grid[r][c] = LV_ALPHABET[Math.floor(Math.random() * LV_ALPHABET.length)];
    }
  }

  return { grid, placedWords, fillerCells };
}

// ==== messages.js ====
const LEVEL_MSGS = {
  1:{excellent:"Lielisks sākums! Tu atrisināji gandrīz visas vai visas mīklas un uzreiz parādīji īstu attapību.",good:"Labs sākums! Daļa mīklu jau ir pieveikta, un tavs prāts ir gatavs nākamajam izaicinājumam.",try:"Pirmais līmenis ir tikai iesildīšanās. Pat ja šoreiz neizdevās daudz, nākamās mīklas dos jaunu iespēju!"},
  2:{excellent:"Brīnišķīgi! Tu mini droši un vērīgi, un tautas mīklu viltības tevi nemaz nebiedē.",good:"Ļoti labi! Tu jau sāc pamanīt pavedienus un atkost mīklu noslēpumus.",try:"Šīs mīklas nemaz nebija tik vieglas, bet nepadodies – ar katru līmeni attapība aug."},
  3:{excellent:"Malacis! Tu lieliski atpazīsti seno gudrību noslēpumus un dodies uz priekšu pārliecinoši.",good:"Lieliski! Tu atrisināji vairākas mīklas un parādīji, ka proti domāt radoši.",try:"Dažām mīklām atminējumi bija tiešām izaicinoši. Dodies uz priekšu bez raizēm – arī minēšanas process ir daļa no prieka!"},
  4:{excellent:"Teicami! Tavs prāts ir ass, un atbildes birst kā graudi no labi izkulta rudzu kūļa.",good:"Lieliski! Pat sarežģītākās mīklās Tev izdodas atrast pareizo virzienu.",try:"Nebēdā! Arī neatminēta mīkla māca domāt gudrāk un uzmanīgāk."},
  5:{excellent:"Puse ceļa pieveikta izcili! Tu mini veikli, droši un ar īstu tautas attapības garu.",good:"Puse spēles jau pieveikta! Tu krāj punktus, pieredzi un topi viedāks un viedāks.",try:"Puse ceļa vēl nav beigas. Saņemies – otrajā pusē vari krietni atspēlēties!"},
  6:{excellent:"Brīnišķīgi! Tu atrisināji lielāko daļu mīklu un pierādīji, ka Tava attapība kļūst arvien jaudīgāka.",good:"Labs veikums! Šis līmenis nebija viegls, bet Tu neatlaidīgi tiki galā ar vairākām mīklām.",try:"Šis līmenis bija ciets rieksts. Bet katrs rieksts reiz padodas pacietīgam minētājam!"},
  7:{excellent:"Iespaidīgi! Tu mini kā īsts meistars un neļauj mīklām sevi apvest ap stūri.",good:"Ļoti pieklājīgs veikums! Tu atradi vairākas pareizās atbildes, pat ja mīklas ir vēl sarežģītākas.",try:"Šoreiz mīklas lika pasvīst. Neapstājies – vēl ir iespēja uzlabot rezultātu!"},
  8:{excellent:"Tu esi ļoti tuvu meistara līmenim! Tavas atbildes rāda gan vērīgumu, gan attapību.",good:"Labs sniegums! Tu jau esi ticis tālu, un katra atminētā mīkla ved tuvāk finišam.",try:"Vēl mazliet pacietības! Jo tuvāk beigām, jo mīklas kļūst viltīgākas."},
  9:{excellent:"Gandrīz galā, un Tava attapība spīguļot spīguļo! Jau tagad Tev pienākas uzslavas.",good:"Tu esi gandrīz finišā! Vairākas mīklas izdevās atrisināt, un tas tiešām ir labs panākums.",try:"Šis bija nopietns pārbaudījums. Neļauj grūtībām apturēt Tavu aizrautību!"},
  10:{excellent:"Apsveicam! Tu izgāji pēdējo līmeni izcili un pierādīji, ka esi īsts tautas gudrības zinātājs.",good:"Apsveicam! Tu esi ticis līdz galam un godam pabeidzis latviešu tautas mīklu spēli.",try:"Ceļš ir pabeigts! Pat ja pēdējais līmenis bija grūts, katra mīkla deva pieredzi nākamajam mēģinājumam."},
};

const FINAL_TITLES = [
  {pct:0,   title:"Pastarītis",          msg:"Tu vēl tikai sāc iepazīt latviešu tautas mīklu viltības. Katra atminēta mīkla ir solis uz priekšu. Nepadodies!"},
  {pct:20,  title:"Stiprais Ansis",      msg:"Tu jau sāc uztvert latviešu tautas mīklu viltības. Spēka Tev daudz, un gan jau arī attapība vairosies. Turpini un Tev izdosies!"},
  {pct:40,  title:"Gudrais zellis",      msg:"Labs rezultāts! Mīklu minēšanas amats Tev jau ir rokā. Turpini minēt, kamēr kļūsti par īstu meistaru!"},
  {pct:60,  title:"Apķērīgais ganuzēns", msg:"Ļoti labi! Tu vari lepoties ar savu attapību. Tev izdevās pieveikt patiešām lielu daļu mīklu."},
  {pct:75,  title:"Gudrā ķēniņa meita",  msg:"Izcili! Tavas mīklu minēšanas prasmes ir lieliskas, un Tu proti atrast atbildes pat visviltīgākajām mīklām."},
  {pct:90,  title:"Attapīgais Mačatiņš", msg:"Neviena mīkla Tev nav par grūtu un apvest ap stūri Tu varētu ikvienu, un zupu spētu izvārīt pat no cirvja kāta. Apsveicam! Tu esi sasniedzis augstāko iespējamo mīklu attapības pakāpi."},
];

function getFinalTitle(score, maxScore) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  let result = FINAL_TITLES[0];
  for (const t of FINAL_TITLES) {
    if (pct >= t.pct) result = t;
  }
  return result;
}

function getLevelRating(level, levelScore, riddlesPerLevel) {
  const max = Math.round(LEVEL_BASE[level] * riddlesPerLevel * 1.15);
  const ratio = max > 0 ? levelScore / max : 0;
  if (ratio >= 0.7) return 'excellent';
  if (ratio >= 0.4) return 'good';
  return 'try';
}

function getLevelMsg(level, rating) {
  const m = LEVEL_MSGS[level];
  if (rating === 'excellent') return { badge: 'Izcili ✦', msg: m.excellent };
  if (rating === 'good') return { badge: 'Labi', msg: m.good };
  return { badge: 'Mēģini vēl', msg: m.try };
}

function modeLabel(mode) {
  const riddleCounts = { 10: 10, 50: 50, 100: 100, daily: 1 };
  return `${MODE_NAMES[mode]} (${riddleCounts[mode]} mīklas)`;
}

function generateShareText(score, maxScore, title, mode) {
  return `Minēju mīklas.\nMans tituls: ${title}\n\n⭐ ${score.toLocaleString('lv-LV')} / ${maxScore.toLocaleString('lv-LV')} punkti\nSpēles versija: ${modeLabel(mode)}\n\nVai Tu vari labāk?\nhttps://researchgames.eu/games/miklu-rezgis/\n\n#mīklurežģis`;
}

function generateDailyShareText() {
  const solvedLine = state.dailySolved ? '✅ Atminēju dienas mīklu' : 'Apskatīju dienas mīklas atminējumu';
  const hintsUsed = state.hintLimit - state.hintsLeft;
  const attemptsUsed = MAX_LIVES - state.livesLeft + (state.dailySolved ? 1 : 0);
  return `${solvedLine}\n⭐ ${state.totalScore} / 115 punkti\nĀtruma bonuss: +${state.totalTimeBonus}\nUzvednes: ${hintsUsed} · Mēģinājumi: ${Math.max(1, attemptsUsed)}\nLaiks: ${formatDuration(state.timerSeconds)}\n\nCik raiti Tev izdosies atminēt šodienas mīklu?\nhttps://researchgames.eu/games/miklu-rezgis/\n\n#mīklurežģis #dienasmīkla`;
}

// ==== dataLoader.js ====
function normalizeCsvHeader(value) {
  return String(value || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function parseCsvObjects(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (char !== '\r') cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  if (!rows.length) return [];

  const headers = rows[0].map(normalizeCsvHeader);
  return rows.slice(1).filter(values => values.some(value => value.trim())).map(values => {
    const record = {};
    headers.forEach((header, index) => { if (header) record[header] = values[index] || ''; });
    return record;
  });
}

function loadRiddlesFromSheets(callback) {
  if (state.levelsLoaded) { callback(true); return; }

  const loadingEl = document.getElementById('loading-msg');
  if (loadingEl) loadingEl.style.display = 'block';

  fetch(`${RIDDLES_CSV_URL}&t=${Date.now()}`, { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Mīklu CSV atbildēja ar ${response.status}.`);
      return response.text();
    })
    .then(csvText => {
      const levels = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [] };
      const bonusPool = [];
      const riddles = parseCsvObjects(csvText);

      riddles.forEach(r => {
        const mikla = (r.mikla || '').toString().trim();
        const atminejums = (r.atminejums || '').toString().trim();
        const lvl = (r.limenis || '').toString().trim();
        const gameId = (r.game_id || '').toString().trim();
        const vienibasNumurs = (r.vienibas_nr || r.vienibas_numurs || '').toString().trim();
        if (!mikla || !atminejums || !lvl) return;

        const entry = {
          id: gameId,
          gameId: gameId,
          unitNumber: vienibasNumurs,
          q: mikla,
          a: atminejums,
          loc: r.vieta || '',
          teller: r.teicejs || '',
          recorder: r.pierakstitajs || '',
          year: r.gads || '',
          kolekcija: r.kolekcija || '',
          sourceUrl: r.id || ''
        };
        if (lvl === 'Bonuss') {
          bonusPool.push(entry);
        } else {
          const n = parseInt(lvl, 10);
          if (n >= 1 && n <= 10 && levels[n]) levels[n].push(entry);
        }
      });

      const totalRiddles = bonusPool.length + Object.values(levels).reduce((n, l) => n + l.length, 0);
      if (totalRiddles === 0) {
        console.warn('Publicētais CSV nesatur nevienu izmantojamu mīklu, izmanto rezerves datus.');
        loadFallbackLevels();
        if (loadingEl) loadingEl.style.display = 'none';
        callback(false);
        return;
      }

      state.levels = levels;
      state.bonusPool = bonusPool;
      state.levelsLoaded = true;
      if (loadingEl) loadingEl.style.display = 'none';
      callback(true);
    })
    .catch(err => {
      console.warn('Nevarēja ielādēt publicēto mīklu CSV, izmanto rezerves datus:', err);
      if (loadingEl) loadingEl.style.display = 'none';
      loadFallbackLevels();
      callback(false);
    });
}

function loadFallbackLevels() {
  state.levels = FALLBACK_LEVELS;
  state.bonusPool = FALLBACK_BONUS;
  state.levelsLoaded = true;
}

// ==== render.js ====
function renderTopBar() {
  const badge = document.getElementById('level-badge');
  badge.className = 'level-pill' + (state.isBonus ? ' bonus' : '') + (state.gameMode === 'party' && state.party ? ' party-player-pill' : '');
  badge.replaceChildren();
  if (state.gameMode === 'party' && state.party) {
    const round = document.createElement('span');
    round.className = 'party-round-label';
    round.textContent = `${state.party.round + 1}. kārta`;
    const player = document.createElement('strong');
    player.className = 'party-player-name';
    player.textContent = state.party.names[state.party.currentPlayer];
    badge.append(round, player);
  } else {
    badge.textContent = state.gameMode === 'daily'
      ? 'Dienas mīkla'
      : state.isBonus ? '⭐ Bonusa kārta' : `${state.currentLevel}. līmenis`;
  }
  document.getElementById('score-display').textContent = state.totalScore.toLocaleString('lv-LV');
  document.getElementById('score-max').textContent = `/ ${state.maxScore.toLocaleString('lv-LV')}`;
  document.getElementById('progress-bar').style.width =
    Math.min(100, (state.totalScore / state.maxScore) * 100) + '%';
}

function renderTimer() {
  const el = document.getElementById('timer-display');
  if (!el) return;
  const total = state.riddleSeconds || 0;
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  el.textContent = `${m}:${s}`;
}

function renderMiklaNum() {
  const total = state.isBonus ? state.bonusRiddles.length : state.shuffledLevel.length;
  document.getElementById('mikla-num').textContent = `${state.riddleIdx + 1} / ${total}`;
}

function renderGrid() {
  const size = state.gridSize;
  const cs = cellSizePx(size);
  const el = document.getElementById('grid');
  el.style.gridTemplateColumns = `repeat(${size},${cs}px)`;
  el.style.gap = '3px';
  el.innerHTML = '';

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const d = document.createElement('div');
      const k = cellKey(r, c);
      let cls = 'cell';
      if (state.foundCells.has(k)) cls += ' found';
      else if (state.fillerCells.has(k)) cls += ' filler';
      if (state.dragCells.some(([dr, dc]) => dr === r && dc === c) && !state.foundCells.has(k)) {
        cls += ' highlight';
      }
      d.className = cls;
      const fontSize = cs <= 26 ? 11 : cs <= 32 ? 13 : cs <= 38 ? 14 : 16;
      d.style.cssText = `width:${cs}px;height:${cs}px;font-size:${fontSize}px;`;
      const letter = document.createElement('span');
      letter.textContent = state.grid[r][c];
      d.appendChild(letter);
      d.dataset.r = r;
      d.dataset.c = c;
      el.appendChild(d);
    }
  }
}

function renderWordTags() {
  const el = document.getElementById('words-row');
  el.innerHTML = '';
  getWords(currentRiddle().a).forEach((w, wi) => {
    const wn = norm(w);
    const wState = state.wordState[wi] || 'normal';
    const revealed = state.hintedLetters[wi] || 0;

    const group = document.createElement('div');
    group.className = 'word-group';
    const boxes = document.createElement('div');
    boxes.className = 'letter-boxes';

    for (let i = 0; i < wn.length; i++) {
      const box = document.createElement('div');
      if (wState === 'found') { box.className = 'letter-box found'; box.textContent = w[i]; }
      else if (wState === 'given-up') { box.className = 'letter-box given-up'; box.textContent = w[i]; }
      else if (i < revealed) { box.className = 'letter-box hinted'; box.textContent = w[i]; }
      else { box.className = 'letter-box'; box.textContent = ''; }
      boxes.appendChild(box);
    }
    group.appendChild(boxes);
    el.appendChild(group);
  });
}

function renderPips() {
  const headerHintsEl = document.getElementById('hints-display');
  if (headerHintsEl) headerHintsEl.textContent = state.hintsLeft;

  const hintsEl = document.getElementById('hints-left-badge');
  if (hintsEl) hintsEl.textContent = state.hintsLeft;

  document.getElementById('hint-btn').disabled = state.hintsLeft <= 0 || state.gameOver;
}

function setStatus(msg, cls) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status-line' + (cls ? ' ' + cls : '');
}

function setNextEnabled(val) {
  const button = document.getElementById('next-btn');
  button.disabled = !val;
  const label = val && state.participationMode === 'research' && state.gameMode !== 'party'
    ? 'Novērtēt mīklu'
    : state.gameMode === 'daily'
      ? 'Pabeigt'
      : state.gameMode === 'party'
        ? 'Turpināt'
        : 'Nākamā';
  button.innerHTML = `${label} <svg width="15" height="15"><use href="#i-arrow-right"/></svg>`;
}

// ==== input.js ====
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

function initGridInput(onWordSelected) {
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

// ==== theme.js ====
const THEME_KEY = 'lmg_theme';
const FONT_SIZE_KEY = 'lmg_font_size';
const FONT_SIZES = ['small', 'medium', 'large', 'extra-large'];

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-switch .sw').forEach(sw => {
    sw.setAttribute('aria-checked', theme === 'light' ? 'true' : 'false');
  });
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
}

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function toggleTheme() {
  applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    applyTheme('light');
  }

  document.querySelectorAll('.theme-switch .sw').forEach(sw => {
    sw.addEventListener('click', toggleTheme);
    sw.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleTheme();
      }
    });
  });
}

function applyFontSize(size) {
  const safeSize = FONT_SIZES.includes(size) ? size : 'medium';
  document.documentElement.setAttribute('data-font-size', safeSize);
  const index = FONT_SIZES.indexOf(safeSize);
  const decrease = document.getElementById('font-decrease-btn');
  const increase = document.getElementById('font-increase-btn');
  if (decrease) decrease.disabled = index === 0;
  if (increase) increase.disabled = index === FONT_SIZES.length - 1;
  try { localStorage.setItem(FONT_SIZE_KEY, safeSize); } catch (e) { /* ignore */ }
}

function initFontSizeControls() {
  let saved = 'medium';
  try { saved = localStorage.getItem(FONT_SIZE_KEY) || 'medium'; } catch (e) { /* ignore */ }
  applyFontSize(saved);

  document.getElementById('font-decrease-btn').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-font-size') || 'medium';
    applyFontSize(FONT_SIZES[Math.max(0, FONT_SIZES.indexOf(current) - 1)]);
  });
  document.getElementById('font-increase-btn').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-font-size') || 'medium';
    applyFontSize(FONT_SIZES[Math.min(FONT_SIZES.length - 1, FONT_SIZES.indexOf(current) + 1)]);
  });
}

// ==== navigation.js ====
const CONTROL_IDS = ['hint-btn', 'shuffle-btn', 'give-up-btn'];

function lockGame() {
  stopTimer();
  document.body.classList.remove('game-active');
  document.getElementById('lock-overlay').classList.remove('hidden');
  CONTROL_IDS.forEach(id => { document.getElementById(id).disabled = true; });
  document.getElementById('next-btn').disabled = true;
  hideFinalOverlay();
  hideLevelOverlay();
}

function unlockGame() {
  document.body.classList.add('game-active');
  document.getElementById('lock-overlay').classList.add('hidden');
  CONTROL_IDS.forEach(id => { document.getElementById(id).disabled = false; });
}

function showAbout() {
  const aboutScreen = document.getElementById('about-screen');
  document.body.classList.add('about-open');
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('start-screen').style.display = 'none';
  document.querySelector('.site-footer').style.display = '';
  aboutScreen.style.display = 'block';
  window.location.hash = 'about';
}

function hideAbout() {
  document.body.classList.remove('about-open');
  document.getElementById('about-screen').style.display = 'none';
  document.querySelector('.site-footer').style.display = '';
  history.pushState('', '', window.location.pathname);
  if (document.body.classList.contains('game-active')) showGameScreen();
  else showLandingScreen();
}

function showGameScreen() {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'grid';
}

function showLandingScreen() {
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('start-screen').style.display = 'flex';
}

function hideLevelOverlay() {
  document.getElementById('level-overlay').classList.remove('show');
}

function hideBonusOverlay() {
  document.getElementById('bonus-overlay').classList.remove('show');
}

function hideFinalOverlay() {
  document.getElementById('final-overlay').classList.remove('show');
}

function returnToLandingFromFinal() {
  hideFinalOverlay();
  renderLockedGrid();
  lockGame();
  state.party = null;
  setParticipationMode('player');
  selectMode(null);
  showLandingScreen();
}

function showFeedbackOverlay() {
  document.getElementById('feedback-overlay').classList.add('show');
  document.getElementById('feedback-confirm').textContent = '';
}

function hideFeedbackOverlay() {
  document.getElementById('feedback-overlay').classList.remove('show');
}

function selectSurveyOption(selector, value, stateKey, dataKey) {
  state.survey[stateKey] = value;
  document.querySelectorAll(selector).forEach(button => {
    button.classList.toggle('selected', button.dataset[dataKey] === value);
  });
}

function submitGameFeedback() {
  state.survey.comment = document.getElementById('feedback-comment').value.trim();
  const party = state.gameMode === 'party' ? state.party : null;
  const totalPoints = party ? party.scores.reduce((sum, points) => sum + points, 0) : state.totalScore;
  queueAnalyticsRecord({
    record_type: 'session_feedback',
    session_id: state.sessionId,
    submitted_at: new Date().toISOString(),
    session_started_at: state.sessionStartedAt,
    game_version: String(state.gameMode),
    participation_type: state.gameMode === 'party' ? 'party' : state.participationMode,
    total_time_ms: state.timerSeconds * 1000,
    total_points: totalPoints,
    game_rating: state.survey.rating,
    age_group: state.survey.ageGroup,
    player_comment: state.survey.comment
  });
  state.feedbackSubmitted = true;
  document.getElementById('open-feedback-btn').textContent = 'Atsauksme nosūtīta ✓';
  document.getElementById('open-feedback-btn').disabled = true;
  document.getElementById('feedback-confirm').textContent = 'Paldies par atsauksmi!';
  setTimeout(hideFeedbackOverlay, 700);
}

function hideContinueOverlay() {
  document.getElementById('continue-overlay').classList.remove('show');
}

function showRestartConfirm() {
  document.getElementById('restart-overlay').classList.add('show');
}

function hideRestart() {
  document.getElementById('restart-overlay').classList.remove('show');
}

function doRestart() {
  hideRestart();
  clearProgress();
  state.party = null;
  lockGame();
  renderLockedGrid();
  showLandingScreen();
}

// ==== gameLogic.js ====
function checkWord(cells) {
  const selected = cells.map(([r, c]) => state.grid[r][c]).join('');
  const selectedReversed = [...selected].reverse().join('');
  let matched = null, matchedWi = -1;

  for (let wi = 0; wi < state.placedWords.length; wi++) {
    const pw = state.placedWords[wi];
    if (state.foundWords.has(pw.word)) continue;
    if (pw.duplicate) continue;
    if (pw.unplaceable) continue;
    if (selected === pw.word || selectedReversed === pw.word) { matched = pw; matchedWi = wi; break; }
  }

  if (matched) {
    matched.cells.forEach(([r, c]) => state.foundCells.add(cellKey(r, c)));
    state.foundWords.add(matched.word);
    state.wordState[matchedWi] = 'found';

    for (let wi = 0; wi < state.placedWords.length; wi++) {
      const pw = state.placedWords[wi];
      if (pw.duplicate && pw.word === matched.word && state.wordState[wi] !== 'found') {
        state.wordState[wi] = 'found';
        state.foundWords.add(pw.word + ':dup:' + wi);
      }
    }

    renderGrid();
    renderWordTags();

    const allFound = state.placedWords.every((_, wi) => state.wordState[wi] === 'found');
    if (allFound) { completeRiddle(); return; }
    setStatus('Atrasts!', '');
  } else {
    flashWrong(cells);
    state.livesLeft--;
    state.riddleScore = Math.max(0, state.riddleScore - PENALTY_WRONG);
    renderPips();
    renderTopBar();
    if (state.livesLeft <= 0) { giveUp(); return; }
    setStatus(`Nepareizi. Vēl ${state.livesLeft} mēģinājumi.`, 'lose');
  }
}

function flashWrong(cells) {
  cells.forEach(([r, c]) => {
    const el = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (el && !state.foundCells.has(cellKey(r, c))) {
      el.classList.add('wrong-flash');
      setTimeout(() => renderGrid(), 400);
    }
  });
}

function completeRiddle() {
  state.gameOver = true;
  state.currentTimeBonus = calculateTimeBonus(basePoints(), state.riddleSeconds);
  const awardedPoints = state.riddleScore + state.currentTimeBonus;
  state.riddleOutcome = 'solved';
  state.currentAwardedPoints = awardedPoints;
  if (state.gameMode === 'party') {
    recordPartyTurn(true, awardedPoints);
  } else {
    state.totalTimeBonus += state.currentTimeBonus;
    state.totalScore += awardedPoints;
    state.levelScore += awardedPoints;
  }
  if (state.gameMode === 'daily') {
    state.dailySolved = true;
    markDailyPlayed(true);
  }
  renderTopBar();
  const bonusText = state.currentTimeBonus > 0 ? ` · ātruma bonuss +${state.currentTimeBonus}` : '';
  setStatus(`Pareizi! +${awardedPoints} punkti${bonusText} ✓`, 'win');
  document.getElementById('give-up-btn').disabled = true;
  document.getElementById('hint-btn').disabled = true;
  setNextEnabled(true);
  if (state.gameMode !== 'daily' && state.gameMode !== 'party') saveProgress();
  recordCompletedRiddleForSession();
}

function recordPartyTurn(solved, awardedPoints) {
  const party = state.party;
  if (!party) return;
  const player = party.currentPlayer;
  party.scores[player] += awardedPoints;
  party.timeBonuses[player] += state.currentTimeBonus;
  party.totalTimes[player] += state.riddleSeconds;
  party.hintsUsed[player] += state.hintLimit - state.hintsLeft;
  party.attemptsUsed[player] += Math.max(1, MAX_LIVES - state.livesLeft + (solved ? 1 : 0));
  if (solved) party.solved[player]++;
  state.totalScore = party.scores[player];
  state.totalTimeBonus = party.timeBonuses[player];
}

function giveHint() {
  if (state.hintsLeft <= 0 || state.gameOver) return;
  const words = getWords(currentRiddle().a);

  for (let wi = 0; wi < words.length; wi++) {
    const wn = norm(words[wi]);
    if (state.wordState[wi] === 'found' || state.wordState[wi] === 'given-up') continue;
    const revealed = state.hintedLetters[wi] || 0;
    if (revealed < wn.length) {
      state.hintedLetters[wi] = revealed + 1;
      state.wordState[wi] = 'hinted';
      state.hintsLeft--;
      state.riddleScore = Math.max(0, state.riddleScore - PENALTY_HINT);
      renderPips();
      renderWordTags();
      renderTopBar();
      setStatus('Uzvedne: nākamais burts atklāts.', '');
      return;
    }
  }
}

function giveUp() {
  if (state.gameOver) return;
  state.gameOver = true;
  state.riddleOutcome = 'gave_up';
  state.currentAwardedPoints = 0;

  getWords(currentRiddle().a).forEach((w, wi) => {
    if (state.wordState[wi] !== 'found') {
      state.wordState[wi] = 'given-up';
      state.hintedLetters[wi] = norm(w).length;
    }
  });
  state.placedWords.forEach(pw => {
    if (!state.foundWords.has(pw.word) && pw.cells) {
      pw.cells.forEach(([r, c]) => state.foundCells.add(cellKey(r, c)));
    }
  });

  renderGrid();
  renderWordTags();
  setStatus('Atminējums atklāts. 0 punkti.', 'lose');
  document.getElementById('hint-btn').disabled = true;
  document.getElementById('give-up-btn').disabled = true;
  setNextEnabled(true);
  if (state.gameMode === 'party') recordPartyTurn(false, 0);
  if (state.gameMode === 'daily') {
    state.dailySolved = false;
    markDailyPlayed(false);
  }
  recordCompletedRiddleForSession();
}

function shuffleLetters() {
  if (state.gameOver) return;
  state.currentShuffleCount++;
  shuffleFillers(state.grid, state.placedWords, state.gridSize);
  renderGrid();
  setStatus('Burti sajaukti.', '');
}

function showResearchQuestions() {
  state.researchAnswers = {};
  document.querySelectorAll('#research-overlay .research-options button').forEach(button => button.classList.remove('selected'));
  const solutionMethodField = document.querySelector('#research-overlay [data-question="solution_method"]');
  const gaveUp = state.riddleOutcome === 'gave_up';
  solutionMethodField.hidden = gaveUp;
  if (gaveUp) state.researchAnswers.solution_method = 'gave_up';
  document.getElementById('research-similar-text').value = '';
  document.getElementById('research-overlay').classList.add('show');
}

function continueAfterEvaluation() {
  if (state.gameMode === 'party') { advancePartyTurn(); return; }
  if (state.gameMode === 'daily') { showFinalResults(); return; }
  state.riddleIdx++;
  const total = state.isBonus ? state.bonusRiddles.length : state.shuffledLevel.length;
  if (state.riddleIdx >= total) { showLevelComplete(); return; }
  loadRiddle();
}

function nextRiddle() {
  if (!state.gameOver) return;
  if (state.gameMode !== 'party' && state.participationMode === 'research' && !state.evaluationSaved) {
    showResearchQuestions();
    return;
  }
  queueCurrentEvaluation({}, false);
  continueAfterEvaluation();
}

function submitResearchQuestions(skipped = false) {
  state.researchAnswers.similar_variant_text = document.getElementById('research-similar-text').value.trim();
  queueCurrentEvaluation(state.researchAnswers, skipped);
  document.getElementById('research-overlay').classList.remove('show');
  continueAfterEvaluation();
}

function showLevelComplete() {
  if (state.isBonus) { showFinalResults(); return; }

  const rating = getLevelRating(state.currentLevel, state.levelScore, state.riddlesPerLevel);
  const { badge, msg } = getLevelMsg(state.currentLevel, rating);
  document.getElementById('lo-title').textContent = `${state.currentLevel}. līmenis pabeigts`;
  document.getElementById('lo-score').textContent = `${state.totalScore.toLocaleString('lv-LV')} punkti`;
  document.getElementById('lo-badge').textContent = badge;

  const msgEl = document.getElementById('lo-msg');
  msgEl.textContent = state.gameMode === 100 ? msg : '';
  msgEl.style.marginBottom = state.gameMode === 100 ? '1.5rem' : '0.5rem';

  if (state.currentLevel === 10) {
    showBonusChoice();
    return;
  }

  const btn = document.getElementById('lo-btn');
  btn.textContent = `Uz ${state.currentLevel + 1}. līmeni →`;
  btn.onclick = () => { hideLevelOverlay(); state.currentLevel++; startLevel(); };
  document.getElementById('level-overlay').classList.add('show');
}

function showBonusChoice() {
  hideLevelOverlay();
  document.getElementById('bo-score').textContent = `${state.totalScore.toLocaleString('lv-LV')} punkti`;
  const rating = getLevelRating(10, state.levelScore, state.riddlesPerLevel);
  const { badge } = getLevelMsg(10, rating);
  const badgeEl = document.getElementById('bo-badge');
  if (badgeEl) badgeEl.textContent = badge;
  document.getElementById('bonus-overlay').classList.add('show');
}

function startBonusRound() {
  state.isBonus = true;
  state.bonusRiddles = shuffle([...state.bonusPool]).slice(0, 2);
  state.riddleIdx = 0;
  state.levelScore = 0;
  loadRiddle();
}

function showFinalResults() {
  stopTimer();
  clearProgress();
  queueSessionUpdate('completed');
  document.getElementById('research-thanks').hidden =
    state.gameMode === 'party' || state.participationMode !== 'research';
  const feedbackBtn = document.getElementById('open-feedback-btn');
  feedbackBtn.disabled = state.feedbackSubmitted;
  feedbackBtn.textContent = state.feedbackSubmitted ? 'Atsauksme nosūtīta ✓' : 'Novērtēt spēli';
  ['level-overlay', 'bonus-overlay', 'restart-overlay'].forEach(id => {
    document.getElementById(id)?.classList.remove('show');
  });

  if (state.gameMode === 'party' && state.party) {
    const p = state.party;
    const winner = p.scores[0] === p.scores[1] ? -1 : (p.scores[0] > p.scores[1] ? 0 : 1);
    document.getElementById('fo-score').textContent = `${p.names[0]} ${p.scores[0].toLocaleString('lv-LV')} · ${p.names[1]} ${p.scores[1].toLocaleString('lv-LV')}`;
    document.getElementById('fo-title').textContent = winner < 0 ? 'Neizšķirts! ✨' : `${p.names[winner]} uzvar! ✨`;
    document.getElementById('fo-msg').textContent = `${p.riddlesPerPlayer} mīklas katram · ātruma bonuss ${p.names[0]} +${p.timeBonuses[0]}, ${p.names[1]} +${p.timeBonuses[1]} · laiks ${formatDuration(p.totalTimes[0])} un ${formatDuration(p.totalTimes[1])}`;
    const resultLines = winner < 0
      ? [`${p.names[0]} – ${p.scores[0]} punkti`, `${p.names[1]} – ${p.scores[1]} punkti`]
      : [`🏆 ${p.names[winner]} – ${p.scores[winner]} punkti`, `🥈 ${p.names[1 - winner]} – ${p.scores[1 - winner]} punkti`];
    state.shareText = [`Mīklu režģis – Ballītes versija 🎉`, ...resultLines, `${p.riddlesPerPlayer} mīklas katram`, `Ātruma bonuss: ${p.names[0]} +${p.timeBonuses[0]} · ${p.names[1]} +${p.timeBonuses[1]}`, '#mīklurežģis'].join('\n');
    document.getElementById('share-box').textContent = state.shareText;
    document.getElementById('copy-confirm').textContent = '';
    document.getElementById('final-overlay').classList.add('show');
    return;
  }

  if (state.gameMode === 'daily') {
    const hintsUsed = state.hintLimit - state.hintsLeft;
    const attemptsUsed = Math.max(1, MAX_LIVES - state.livesLeft + (state.dailySolved ? 1 : 0));
    document.getElementById('fo-score').textContent = `${state.totalScore} / 115 punkti`;
    document.getElementById('fo-title').textContent = state.dailySolved ? 'Dienas mīkla atminēta!' : 'Dienas mīkla pabeigta';
    document.getElementById('fo-msg').textContent = `${dailyDateLabel()} · ātruma bonuss +${state.totalTimeBonus} · ${hintsUsed} uzvednes · ${attemptsUsed} mēģinājumi · ${formatDuration(state.timerSeconds)}`;
    state.shareText = generateDailyShareText();
    document.getElementById('share-box').textContent = state.shareText;
    document.getElementById('copy-confirm').textContent = '';
    document.getElementById('final-overlay').classList.add('show');
    return;
  }

  const final = getFinalTitle(state.totalScore, state.maxScore);
  document.getElementById('fo-score').textContent =
    `${state.totalScore.toLocaleString('lv-LV')} / ${state.maxScore.toLocaleString('lv-LV')} punkti`;
  document.getElementById('fo-title').textContent = final.title;
  document.getElementById('fo-msg').textContent = `${final.msg}\nĀtruma bonuss: +${state.totalTimeBonus} punkti. Kopējais laiks: ${formatDuration(state.timerSeconds)}.`;

  state.shareText = generateShareText(state.totalScore, state.maxScore, final.title, state.gameMode);
  document.getElementById('share-box').textContent = state.shareText;
  document.getElementById('copy-confirm').textContent = '';
  document.getElementById('final-overlay').classList.add('show');
}

function copyShare() {
  const confirmEl = document.getElementById('copy-confirm');
  const announce = () => {
    confirmEl.textContent = '✓ Nokopēts!';
    setTimeout(() => { confirmEl.textContent = ''; }, 2500);
  };

  navigator.clipboard.writeText(state.shareText).then(announce).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = state.shareText;
    ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    announce();
  });
}

function startMode(mode, repeatDaily = false) {
  if (mode === 'daily' && hasPlayedDaily() && !repeatDaily) {
    document.getElementById('daily-repeat-overlay').classList.add('show');
    return;
  }
  const startBtn = document.getElementById('start-btn');
  const researchStartBtn = document.getElementById('research-start-btn');
  startBtn.disabled = true;
  researchStartBtn.disabled = true;
  state.gameMode = mode;
  state.riddlesPerLevel = MODE_RPL[mode];
  state.maxScore = MODE_MAX[mode];
  resetForNewGame();
  state.dailyReplay = mode === 'daily' && repeatDaily;
  resetTimer();
  loadRiddlesFromSheets(() => {
    if (mode === 'daily') startDailyGame();
    else startLevel();
    showGameScreen();
    unlockGame();
    startTimer();
    startBtn.disabled = false;
    researchStartBtn.disabled = false;
  });
}

function buildPartyPlan(count) {
  const pools = {};
  const cursors = {};
  for (let level = 1; level <= 10; level++) {
    pools[level] = shuffle([...state.levels[level]]);
    cursors[level] = 0;
  }
  const take = (level, avoid) => {
    if (!pools[level].length) return null;
    if (cursors[level] >= pools[level].length) {
      pools[level] = shuffle([...state.levels[level]]);
      cursors[level] = 0;
    }
    let item = pools[level][cursors[level]++];
    if (avoid && item === avoid && pools[level].length > 1) {
      if (cursors[level] >= pools[level].length) cursors[level] = 0;
      item = pools[level][cursors[level]++];
    }
    return item;
  };
  const plan = [];
  for (let round = 0; round < count; round++) {
    const level = Math.min(10, Math.floor(round * 10 / count) + 1);
    const first = take(level);
    plan.push({ level, riddles: [first, take(level, first)] });
  }
  return plan;
}

function beginPartyGame(names, count) {
  const startBtn = document.getElementById('start-btn');
  setParticipationMode('player');
  startBtn.disabled = true;
  state.gameMode = 'party';
  resetForNewGame();
  resetTimer();
  loadRiddlesFromSheets(() => {
    const plan = buildPartyPlan(count);
    const maxScore = plan.reduce((sum, entry) => sum + Math.round(LEVEL_BASE[entry.level] * 1.15), 0);
    state.party = {
      names, riddlesPerPlayer: count, round: 0, currentPlayer: 0, plan, maxScore,
      scores: [0, 0], timeBonuses: [0, 0], totalTimes: [0, 0], hintsUsed: [0, 0],
      attemptsUsed: [0, 0], solved: [0, 0]
    };
    state.maxScore = maxScore;
    loadPartyTurn();
    showGameScreen();
    unlockGame();
    startTimer();
    startBtn.disabled = false;
  });
}

function loadPartyTurn() {
  const p = state.party;
  const entry = p.plan[p.round];
  state.currentLevel = entry.level;
  state.shuffledLevel = [entry.riddles[p.currentPlayer]];
  state.riddleIdx = 0;
  state.totalScore = p.scores[p.currentPlayer];
  state.totalTimeBonus = p.timeBonuses[p.currentPlayer];
  state.maxScore = p.maxScore;
  loadRiddle();
}

function advancePartyTurn() {
  const p = state.party;
  if (p.currentPlayer === 1 && p.round >= p.riddlesPerPlayer - 1) {
    showFinalResults();
    return;
  }
  if (p.currentPlayer === 0) {
    const previousPlayer = p.names[0];
    p.currentPlayer = 1;
    renderPartyPassHandoff(previousPlayer, p.names[1]);
  } else {
    const previousPlayer = p.names[1];
    p.currentPlayer = 0;
    p.round++;
    renderPartyPassHandoff(previousPlayer, p.names[0]);
  }
  document.getElementById('party-pass-overlay').classList.add('show');
}

function renderPartyPassHandoff(previousPlayer, nextPlayer) {
  const title = document.getElementById('party-pass-title');
  const completedLine = document.createElement('div');
  completedLine.className = 'party-handoff-line';
  const completedLabel = document.createElement('span');
  completedLabel.textContent = 'Gājienu pabeidza: ';
  const previous = document.createElement('strong');
  previous.className = 'party-handoff-name';
  previous.textContent = previousPlayer;
  completedLine.append(completedLabel, previous);

  const continuesLine = document.createElement('div');
  continuesLine.className = 'party-handoff-line';
  const continuesLabel = document.createElement('span');
  continuesLabel.textContent = 'Turpina: ';
  const next = document.createElement('strong');
  next.className = 'party-handoff-name';
  next.textContent = nextPlayer;
  continuesLine.append(continuesLabel, next);
  title.replaceChildren(completedLine, continuesLine);

  const message = document.getElementById('party-pass-msg');
  message.textContent = 'Kad var turpināt, klikšķini uz zaļās pogas.';
}

function startDailyGame() {
  const selection = getDailySelection();
  if (!selection) return;
  state.currentLevel = 1;
  state.riddlesPerLevel = 1;
  state.maxScore = 115;
  state.shuffledLevel = [selection.riddle];
  state.riddleIdx = 0;
  state.levelScore = 0;
  loadRiddle();
}

function startLevel() {
  state.shuffledLevel = shuffle([...state.levels[state.currentLevel]]).slice(0, state.riddlesPerLevel);
  state.riddleIdx = 0;
  state.levelScore = 0;
  loadRiddle();
}

function renderRiddleMetadata(riddle) {
  const { teller, recorder, place, year, unitNumber } = datasetSourceMetadata(riddle);
  const details = [];

  if (teller) details.push(`Šo mīklu teica ${teller}.`);
  else if (recorder) details.push(`Šo mīklu pierakstīja ${recorder}.`);
  if (place || year) details.push(`${place}${place && year ? ', ' : ''}${year}.`);

  const meta = document.getElementById('riddle-meta');
  const text = document.getElementById('riddle-meta-text');
  const unitNumberText = document.getElementById('riddle-unit-number');
  const formattedUnitNumber = unitNumber
    ? (/^LFK\b/i.test(unitNumber) ? unitNumber : `LFK ${unitNumber}`)
    : '';
  text.textContent = details.join(' ');
  unitNumberText.hidden = !unitNumber;
  unitNumberText.textContent = formattedUnitNumber;
  meta.hidden = details.length === 0 && !unitNumber;
}

function loadRiddle() {
  resetRiddleState();
  setStatus('', '');
  const riddle = currentRiddle();
  document.getElementById('riddle-text').textContent = riddle.q;
  renderRiddleMetadata(riddle);

  state.gridSize = resolveGridSize(state.currentLevel, riddle.a);
  const { grid, placedWords, fillerCells } = buildGrid(riddle.a, state.gridSize);
  state.grid = grid;
  state.placedWords = placedWords;
  state.fillerCells = fillerCells;

  placedWords.forEach((pw, wi) => {
    if (pw.unplaceable) {
      state.wordState[wi] = 'found';
      state.foundWords.add(pw.word + ':unplaceable:' + wi);
    }
  });

  renderGrid();
  renderWordTags();
  renderPips();
  renderTopBar();
  renderMiklaNum();

  document.getElementById('give-up-btn').disabled = false;
  document.getElementById('hint-btn').disabled = false;
  setNextEnabled(false);
}

function loadSavedProgress() {
  const data = readSavedProgress();
  if (!data) { startMode(state.gameMode); return; }

  try {
    showGameScreen();
    state.gameMode = data.gameMode || 10;
    setParticipationMode(data.participationMode === 'research' ? 'research' : 'player');
    state.riddlesPerLevel = MODE_RPL[state.gameMode];
    state.maxScore = MODE_MAX[state.gameMode];
    state.currentLevel = data.currentLevel || 1;
    state.totalScore = data.totalScore || 0;
    state.levelScore = data.levelScore || 0;
    state.totalTimeBonus = data.totalTimeBonus || 0;
    state.isBonus = data.isBonus || false;

    resetTimer();

    loadRiddlesFromSheets(() => {
      if (state.isBonus) {
        state.bonusRiddles = shuffle([...state.bonusPool]).slice(0, 2);
        state.riddleIdx = 0;
      } else {
        state.shuffledLevel = shuffle([...state.levels[state.currentLevel]]).slice(0, state.riddlesPerLevel);
        state.riddleIdx = Math.min(data.riddleIdx || 0, state.shuffledLevel.length - 1);
      }
      loadRiddle();
      unlockGame();
      startTimer();
    });
  } catch (e) {
    console.warn('Neizdevās atjaunot saglabāto spēli, sāku no jauna:', e);
    startMode(10);
  }
}

// ==== main.js ====
function selectMode(mode) {
  state.selectedMode = mode;
  document.querySelectorAll('.mode-card[data-mode]').forEach(card => {
    const cardMode = parseMode(card.dataset.mode);
    card.classList.toggle('selected', cardMode === mode);
  });
  updateStartPaths(mode);
}

function updateStartPaths(mode) {
  const actions = document.querySelector('.start-actions');
  const modeList = document.querySelector('.landing-mode-list');
  const participationLabel = document.getElementById('participation-label');
  const regularBtn = document.getElementById('start-btn');
  const researchBtn = document.getElementById('research-start-btn');
  actions.hidden = mode === null || mode === undefined;
  modeList.classList.toggle('has-selection', !actions.hidden);
  if (actions.hidden) {
    actions.classList.remove('party-only');
    return;
  }
  const isParty = mode === 'party';
  const isChild = mode === 'child';
  actions.classList.toggle('party-only', isParty || isChild);
  participationLabel.hidden = isParty || isChild;
  researchBtn.hidden = isParty || isChild;
  regularBtn.querySelector('strong').textContent = isParty ? 'Sākt sacensību' : isChild ? 'Bērnu spēle' : 'Spēlētājs';
  regularBtn.querySelector('small').textContent = isParty ? 'Ievadīt spēlētāju vārdus' : isChild ? 'Sākt spēli' : 'Spēlē';
}

function setParticipationMode(mode) {
  state.participationMode = mode;
  document.body.dataset.participationMode = mode;
}

function parseMode(value) {
  return value === 'daily' || value === 'party' || value === 'child' ? value : Number(value);
}

function wireModeCards() {
  document.querySelectorAll('.mode-card[data-mode]').forEach(card => {
    card.addEventListener('click', () => {
      const mode = parseMode(card.dataset.mode);
      if (mode === 'child') {
        window.location.href = 'berniem/';
        return;
      }
      selectMode(mode);
    });
  });
  setParticipationMode('player');
  selectMode(state.selectedMode);

  document.getElementById('start-btn').addEventListener('click', () => {
    if (state.selectedMode === null || state.selectedMode === undefined) return;
    setParticipationMode('player');
    if (state.selectedMode === 'party') document.getElementById('party-setup-overlay').classList.add('show');
    else if (state.selectedMode === 'child') window.location.href = 'berniem/';
    else startMode(state.selectedMode);
  });
  document.getElementById('research-start-btn').addEventListener('click', () => {
    if (state.selectedMode === null || state.selectedMode === undefined || state.selectedMode === 'party' || state.selectedMode === 'child') return;
    setParticipationMode('research');
    startMode(state.selectedMode);
  });
  document.getElementById('change-mode-btn').addEventListener('click', () => {
    selectMode(null);
  });
}

function renderLockedGrid() {
  const size = 9;
  const el = document.getElementById('grid');
  if (!el) return;
  const cs = cellSizePx(size);
  el.style.gridTemplateColumns = `repeat(${size},${cs}px)`;
  el.style.gap = '3px';
  el.innerHTML = '';
  for (let i = 0; i < size * size; i++) {
    const d = document.createElement('div');
    d.className = 'cell filler';
    d.style.width = cs + 'px';
    d.style.height = cs + 'px';
    d.textContent = LV_ALPHABET[Math.floor(Math.random() * LV_ALPHABET.length)];
    el.appendChild(d);
  }
}

function wireEvents() {
  wireModeCards();

  document.querySelectorAll('.about-link').forEach(link => {
    link.addEventListener('click', (e) => { e.preventDefault(); showAbout(); });
  });
  document.getElementById('about-back-btn').addEventListener('click', hideAbout);

  document.getElementById('hint-btn').addEventListener('click', giveHint);
  document.getElementById('next-btn').addEventListener('click', nextRiddle);
  document.getElementById('give-up-btn').addEventListener('click', giveUp);
  document.getElementById('shuffle-btn').addEventListener('click', shuffleLetters);
  document.getElementById('restart-btn').addEventListener('click', showRestartConfirm);

  document.getElementById('daily-repeat-yes-btn').addEventListener('click', () => {
    document.getElementById('daily-repeat-overlay').classList.remove('show');
    startMode('daily', true);
  });
  document.getElementById('daily-repeat-no-btn').addEventListener('click', () => {
    document.getElementById('daily-repeat-overlay').classList.remove('show');
  });

  const partyRange = document.getElementById('party-riddle-range');
  const partyCount = document.getElementById('party-riddle-count');
  const clampPartyCount = value => Math.max(3, Math.min(100, Number(value) || 4));
  const updatePartyRangeProgress = () => {
    const progress = ((Number(partyRange.value) - 3) / 97) * 100;
    partyRange.style.setProperty('--party-range-progress', `${progress}%`);
  };
  updatePartyRangeProgress();
  partyRange.addEventListener('input', () => {
    partyCount.value = partyRange.value;
    updatePartyRangeProgress();
  });
  partyCount.addEventListener('input', () => {
    const value = clampPartyCount(partyCount.value);
    partyRange.value = value;
    updatePartyRangeProgress();
  });
  partyCount.addEventListener('change', () => {
    partyCount.value = clampPartyCount(partyCount.value);
    partyRange.value = partyCount.value;
    updatePartyRangeProgress();
  });
  document.getElementById('party-setup-cancel-btn').addEventListener('click', () => {
    document.getElementById('party-setup-overlay').classList.remove('show');
  });
  document.getElementById('party-start-btn').addEventListener('click', () => {
    const count = clampPartyCount(partyCount.value);
    const first = document.getElementById('party-player-1').value.trim() || 'Spēlētājs 1';
    const second = document.getElementById('party-player-2').value.trim() || 'Spēlētājs 2';
    partyCount.value = count;
    partyRange.value = count;
    updatePartyRangeProgress();
    document.getElementById('party-setup-overlay').classList.remove('show');
    beginPartyGame([first, second], count);
  });
  document.getElementById('party-ready-btn').addEventListener('click', () => {
    document.getElementById('party-pass-overlay').classList.remove('show');
    loadPartyTurn();
  });

  document.getElementById('copy-btn').addEventListener('click', copyShare);
  document.getElementById('open-feedback-btn').addEventListener('click', showFeedbackOverlay);
  document.getElementById('feedback-close-btn').addEventListener('click', hideFeedbackOverlay);
  document.getElementById('feedback-skip-btn').addEventListener('click', hideFeedbackOverlay);
  document.getElementById('feedback-submit-btn').addEventListener('click', submitGameFeedback);
  document.querySelectorAll('.rating-option').forEach(button => {
    button.addEventListener('click', () => selectSurveyOption('.rating-option', button.dataset.rating, 'rating', 'rating'));
  });
  document.querySelectorAll('.age-option').forEach(button => {
    button.addEventListener('click', () => selectSurveyOption('.age-option', button.dataset.age, 'ageGroup', 'age'));
  });
  document.querySelectorAll('#research-overlay .research-fieldset').forEach(fieldset => {
    fieldset.querySelectorAll('.research-options button').forEach(button => {
      button.addEventListener('click', () => {
        state.researchAnswers[fieldset.dataset.question] = button.dataset.value;
        fieldset.querySelectorAll('.research-options button').forEach(option => {
          option.classList.toggle('selected', option === button);
        });
      });
    });
  });
  document.getElementById('research-submit-btn').addEventListener('click', () => submitResearchQuestions(false));
  document.getElementById('research-skip-btn').addEventListener('click', () => submitResearchQuestions(true));
  document.getElementById('final-close-btn').addEventListener('click', returnToLandingFromFinal);
  document.getElementById('fo-new-game-btn').addEventListener('click', returnToLandingFromFinal);

  document.getElementById('bo-yes-btn').addEventListener('click', () => {
    hideBonusOverlay();
    startBonusRound();
  });
  document.getElementById('bo-no-btn').addEventListener('click', showFinalResults);

  document.getElementById('co-continue-btn').addEventListener('click', () => {
    hideContinueOverlay();
    loadSavedProgress();
  });
  document.getElementById('co-restart-btn').addEventListener('click', () => {
    hideContinueOverlay();
    clearProgress();
    renderLockedGrid();
    lockGame();
  });

  document.getElementById('ro-confirm-btn').addEventListener('click', doRestart);
  document.getElementById('ro-cancel-btn').addEventListener('click', hideRestart);

  initGridInput(checkWord);
}

function checkAboutDeepLink() {
  if (window.location.hash === '#about') {
    document.body.classList.add('about-open');
    document.getElementById('app-shell').style.display = 'none';
    document.getElementById('start-screen').style.display = 'none';
    document.querySelector('.site-footer').style.display = '';
    document.getElementById('about-screen').style.display = 'block';
  }
}

function checkContinuePrompt() {
  const data = readSavedProgress();
  if (!data) return;
  const desc = document.getElementById('co-desc');
  if (desc) {
    desc.textContent =
      `${MODE_NAMES[data.gameMode] || ''} · ${data.currentLevel || 1}. līmenis · ${(data.totalScore || 0).toLocaleString('lv-LV')} punkti`;
  }
  document.getElementById('continue-overlay').classList.add('show');
}

function init() {
  console.log('Latviešu tautas mīklu režģis');
  initTheme();
  initFontSizeControls();
  renderLockedGrid();
  lockGame();
  wireEvents();
  loadRiddlesFromSheets(() => updateDailyModeSummary());
  checkAboutDeepLink();
  checkContinuePrompt();
  flushAnalyticsQueue();
  setInterval(renderTimer, 1000);
  window.addEventListener('online', flushAnalyticsQueue);
  window.addEventListener('resize', () => {
    if (document.getElementById('lock-overlay').classList.contains('hidden')) {
      if (state.grid && state.grid.length) renderGrid();
    } else {
      renderLockedGrid();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
