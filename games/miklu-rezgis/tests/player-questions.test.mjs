import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const backend = readFileSync(new URL('../apps-script/PlayerQuestions.gs', import.meta.url), 'utf8');
const receiverCode = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');

function game({ online = false, failStorage = false, response = { ok: true } } = {}) {
  const elements = new Map();
  const el = id => {
    if (!elements.has(id)) elements.set(id, { value: '', textContent: '', disabled: false });
    return elements.get(id);
  };
  el('player-question-form').reset = () => { el('player-question').value = ''; };
  const storage = new Map();
  const sent = [];
  const context = vm.createContext({
    document: { addEventListener() {}, getElementById: el },
    navigator: { onLine: online }, console: { warn() {} },
    localStorage: {
      getItem: key => storage.get(key) || null,
      setItem(key, value) { if (failStorage) throw new Error('Storage full'); storage.set(key, value); }
    },
    fetch: async (url, options) => { sent.push(JSON.parse(options.body)); return { json: async () => response }; },
    setTimeout() {}, clearInterval() {}
  });
  vm.runInContext(app, context);
  const run = code => vm.runInContext(code, context);
  run("state.sessionId = 'session-1'; state.gameMode = 'daily';");
  return { el, storage, sent, run, context, submit: () => run('submitPlayerQuestion({preventDefault(){}})') };
}

test('both participation types and party can send independently from game feedback; empty answers do not send', () => {
  for (const mode of ['player', 'research', 'party']) {
    const g = game();
    g.run(`state.participationMode = '${mode}'; state.gameMode = '${mode === 'party' ? 'party' : 'daily'}';`);
    g.el('player-question').value = '  ';
    g.submit();
    assert.equal(g.storage.size, 0);
    g.el('player-question').value = '  Kāpēc mīklām ir vairāki varianti?  ';
    g.submit();
    g.submit();
    const records = JSON.parse(g.storage.get('lmg_analytics_queue'));
    assert.equal(records.length, 1);
    assert.equal(records[0].participation_type, mode);
    assert.equal(records[0].question_text, 'Kāpēc mīklām ir vairāki varianti?');
    assert.equal(g.run('state.feedbackSubmitted'), false);
    assert.equal(g.el('player-question').disabled, true);
    assert.match(g.el('player-question-confirm').textContent, /saglabāts/);
    g.run('resetForNewGame()');
    assert.equal(g.el('player-question').value, '');
    assert.equal(g.el('player-question').disabled, false);
    assert.equal(g.el('player-question-submit').disabled, true);
  }
});

test('failed local storage keeps the answer editable and does not claim success', () => {
  const g = game({ failStorage: true });
  g.el('player-question').value = 'No kurienes šī mīkla?';
  g.submit();
  assert.equal(g.run('state.playerQuestionSubmitted'), false);
  assert.equal(g.el('player-question').disabled, false);
  assert.match(g.el('player-question-confirm').textContent, /Neizdevās/);
});

test('delivery is confirmed only after server acknowledgement; failure retains queued answer', async () => {
  for (const ok of [false, true]) {
    const g = game({ online: true, response: { ok } });
    g.el('player-question').value = 'Cik senas ir mīklas?';
    g.submit();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(g.run('state.playerQuestionDelivered'), ok);
    assert.equal(JSON.parse(g.storage.get('lmg_analytics_queue')).length, ok ? 0 : 1);
    assert.equal(g.el('player-question-submit').textContent, ok ? 'Nosūtīts ✓' : 'Nosūtīt');
  }
});

function receiver() {
  const rows = [];
  const sheet = {
    getLastRow: () => rows.length + 1,
    getRange(row, col, count, width) {
      return { getValues: () => row === 1
        ? [['question_id','session_id','submitted_at','game_version','participation_type','question_text','app_version','data_schema_version']]
        : rows.map(record => [record.question_id, record.session_id, record.submitted_at].slice(0, width)) };
    }
  };
  const spreadsheet = { getSheetByName: () => sheet };
  const ctx = vm.createContext({
    getSpreadsheet_: () => spreadsheet,
    findRowById_: (s, col, id) => { const index = rows.findIndex(r => r.question_id === id); return index < 0 ? 0 : index + 2; },
    appendRecord_: (s, headers, record) => rows.push(record)
  });
  // Exercise the real request router and normalization; mock only spreadsheet I/O.
  const io = { getSpreadsheet_: ctx.getSpreadsheet_, findRowById_: ctx.findRowById_, appendRecord_: ctx.appendRecord_ };
  vm.runInContext(receiverCode, ctx);
  Object.assign(ctx, io);
  vm.runInContext(backend, ctx);
  return { rows, ctx, spreadsheet };
}
const valid = { question_id: 's-question', session_id: 's', submitted_at: '2026-10-29T08:00:00Z', game_version: 'daily', participation_type: 'player', question_text: 'Kāpēc tāds atminējums?' };

test('receiver deduplicates retries, validates answers and excludes children', () => {
  const r = receiver();
  r.ctx.record = { ...valid, record_type: 'session_question' };
  assert.equal(vm.runInContext('processRecord_(record).action', r.ctx), 'created');
  assert.equal(vm.runInContext('processRecord_(record).action', r.ctx), 'unchanged');
  assert.equal(r.rows.length, 1);
  for (const patch of [{question_text:' '},{question_text:'a'.repeat(1001)},{game_version:'child'},{question_id:'wrong'},{submitted_at:'bad'}]) {
    r.ctx.record = { ...valid, ...patch };
    assert.throws(() => vm.runInContext('upsertPlayerQuestion_(record)', r.ctx));
  }
});

test('question text is stored literally and cannot become a spreadsheet formula', () => {
  const r = receiver();
  r.ctx.record = { ...valid, question_text: '=IMPORTXML("example", "x")' };
  vm.runInContext('upsertPlayerQuestion_(record)', r.ctx);
  assert.equal(r.rows[0].question_text, '\'=IMPORTXML("example", "x")');
  assert.equal(Object.prototype.toString.call(r.rows[0].submitted_at), '[object Date]');
});

test('dashboard count respects session filters and submission dates without returning question text', () => {
  const r = receiver();
  r.rows.push(valid, {...valid, question_id:'other-question',session_id:'other'});
  r.ctx.spreadsheet = r.spreadsheet;
  assert.equal(vm.runInContext("countPlayerQuestions_(spreadsheet,[{session_id:'s'}],0)", r.ctx), 1);
  assert.equal(vm.runInContext("countPlayerQuestions_(spreadsheet,[{session_id:'missing'}],0)", r.ctx), 0);
  r.rows.push({...valid, question_id:'old-question',submitted_at:'2001-01-01T00:00:00Z'});
  r.rows[0].submitted_at = new Date().toISOString();
  assert.equal(vm.runInContext("countPlayerQuestions_(spreadsheet,[{session_id:'s'}],7)", r.ctx), 1);
});
