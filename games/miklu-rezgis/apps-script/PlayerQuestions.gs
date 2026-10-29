// Included in the deployed Code.gs; kept separately here for clarity. See README.md.
const PLAYER_QUESTIONS_SHEET = 'player_questions';
const PLAYER_QUESTION_HEADERS = [
  'question_id', 'session_id', 'submitted_at', 'game_version',
  'participation_type', 'question_text', 'app_version', 'data_schema_version'
];

// Called inside the existing doPost script lock. One question per session, including retries.
function upsertPlayerQuestion_(record) {
  const sessionId = String(record.session_id || '').trim();
  const questionId = String(record.question_id || '').trim();
  const question = String(record.question_text || '').trim();
  const version = String(record.game_version || '');
  const participation = String(record.participation_type || '');
  if (!sessionId || sessionId.length > 100 || questionId !== sessionId + '-question') {
    throw new Error('Invalid question_id or session_id.');
  }
  if (!question || question.length > 1000) throw new Error('Question must contain 1–1000 characters.');
  if (['10', '50', '100', 'daily', 'party'].indexOf(version) < 0) throw new Error('Invalid game_version.');
  if (['player', 'research', 'party'].indexOf(participation) < 0) throw new Error('Invalid participation_type.');
  const submittedAt = new Date(record.submitted_at);
  if (isNaN(submittedAt.getTime())) throw new Error('Invalid submitted_at.');

  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(PLAYER_QUESTIONS_SHEET);
  if (!sheet) {
    sheet = ensureSheet_(spreadsheet, PLAYER_QUESTIONS_SHEET, PLAYER_QUESTION_HEADERS);
    formatTimestampColumns_(sheet, PLAYER_QUESTION_HEADERS);
  }
  const headers = sheet.getRange(1, 1, 1, PLAYER_QUESTION_HEADERS.length).getValues()[0];
  if (!PLAYER_QUESTION_HEADERS.every(function(header, i) { return headers[i] === header; })) {
    throw new Error('Unexpected player_questions headers.');
  }
  if (findRowById_(sheet, 1, questionId)) {
    return { record_type: 'session_question', id: questionId, action: 'unchanged' };
  }
  const clean = normalizeRecord_(Object.assign({}, record, {
    question_id: questionId, session_id: sessionId, question_text: question, submitted_at: submittedAt
  }), PLAYER_QUESTION_HEADERS);
  appendRecord_(sheet, PLAYER_QUESTION_HEADERS, clean);
  return { record_type: 'session_question', id: questionId, action: 'created' };
}

// Aggregate-only summaries count matching submissions without reading free text.
// Apply the same selected sessions and the question submission period.
function countPlayerQuestions_(spreadsheet, sessions, days) {
  const sheet = spreadsheet.getSheetByName(PLAYER_QUESTIONS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return 0;
  const sessionIds = {};
  sessions.forEach(function(row) { sessionIds[String(row.session_id)] = true; });
  const seen = {};
  const threshold = days ? Date.now() - days * 86400000 : 0;
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues().filter(function(row) {
    const id = String(row[0]);
    const date = new Date(row[2]);
    if (!id || seen[id] || !sessionIds[String(row[1])]) return false;
    if (threshold && (isNaN(date.getTime()) || date.getTime() < threshold)) return false;
    seen[id] = true;
    return true;
  }).length;
}
