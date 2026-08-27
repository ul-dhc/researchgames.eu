const SPREADSHEET_ID =
  '1Azl1K0eixwFGj-qGDdpvxG6P_3fjbGUvekq04p19ve0';

const FEEDBACK_SHEET_NAME = 'Feedback';
const GAME_RUNS_SHEET_NAME = 'GameRuns';
const QUESTIONS_SHEET_NAME = 'LV–ENG salīdzinājums';

const FEEDBACK_HEADERS = [
  'Laiks',
  'Sesijas ID',
  'Valoda',
  'Vērtējums',
  'Ieteiktais jautājums',
  'Novēlējums LU',
  'Punkti',
  'Procenti',
  'Tituls',
  'Piekrišana publicēšanai',
  'Statuss',
  'Avots',
  'Spēles versija'
];

const GAME_RUN_HEADERS = [
  'Pabeigšanas laiks',
  'Spēles reizes ID',
  'Sesijas ID',
  'Valoda',
  'Kopējie punkti',
  'Pareizo atbilžu procenti',
  'Tituls',
  '1. LU vēsture',
  '2. LU mūsdienās',
  '3. Kultūra un sports LU',
  '4. Atpazīsti vietu',
  '5. Fināla izaicinājums',
  'Bonusa punkti',
  'Spēles versija'
];

function doGet(e) {
  try {
    const resource = normalizeText(
      e && e.parameter && e.parameter.resource
    ).toLowerCase();

    if (resource === 'questions') {
      return getQuestionsResponse();
    }

    const sheet = getFeedbackSheet();
    const rows = sheet.getDataRange().getDisplayValues();

    const wishes = rows
      .slice(1)
      .filter(function (row) {
        const wish = normalizeText(row[5]);
        const consent = normalizeText(row[9]).toLowerCase();
        const status = normalizeText(row[10]).toLowerCase();

        return (
          wish !== '' &&
          consent === 'jā' &&
          status === 'apstiprināts'
        );
      })
      .map(function (row) {
        return {
          wish: normalizeText(row[5]),
          language: normalizeLanguage(row[2])
        };
      })
      .reverse();

    return jsonResponse({
      ok: true,
      service: 'LU 107 feedback',
      sheet: FEEDBACK_SHEET_NAME,
      count: wishes.length,
      wishes: wishes
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: String(error),
      wishes: []
    });
  }
}

function getQuestionsResponse() {
  const sheet = getSpreadsheet().getSheetByName(
    QUESTIONS_SHEET_NAME
  );

  if (!sheet) {
    throw new Error(
      'Nav atrasta lapa: ' + QUESTIONS_SHEET_NAME
    );
  }

  const rows = sheet.getDataRange().getDisplayValues();
  const headerRowIndex = rows.findIndex(function (row) {
    return normalizeText(row[0]) === 'Valoda / Language';
  });

  if (headerRowIndex === -1) {
    throw new Error(
      'Nav atrasta jautājumu tabulas galvenes rinda.'
    );
  }

  const pairs = {};

  rows.slice(headerRowIndex + 1).forEach(function (row) {
    const language = normalizeLanguage(row[0]);
    const id = normalizeText(row[1]);

    if (!id || (language !== 'LV' && language !== 'ENG')) {
      return;
    }

    if (!pairs[id]) {
      pairs[id] = {};
    }

    pairs[id][language] = row;
  });

  const invalidIds = [];
  const questions = Object.keys(pairs)
    .map(function (id) {
      const question = buildQuestion(id, pairs[id]);
      if (question === null) {
        invalidIds.push(id);
      }
      return question;
    })
    .filter(function (question) {
      return question !== null;
    });

  return jsonResponse({
    ok: true,
    service: 'LU 107 questions',
    sheet: QUESTIONS_SHEET_NAME,
    count: questions.length,
    invalidIds: invalidIds,
    questions: questions
  });
}

function buildQuestion(id, pair) {
  const lv = pair.LV;
  const eng = pair.ENG;

  if (!lv || !normalizeText(lv[5])) {
    return null;
  }

  const options = lv
    .slice(6, 10)
    .map(normalizeText)
    .filter(Boolean);
  const optionsEn = eng
    ? eng.slice(6, 10).map(normalizeText).filter(Boolean)
    : options.slice();
  const editorNotes = normalizeText(lv[20]);
  const existingNotes = normalizeText(lv[19]);
  const time = Number(lv[13]);

  if (!Number.isFinite(time) || time <= 0) {
    return null;
  }

  const question = {
    id: id,
    round: normalizeText(lv[2]),
    subcategory: normalizeText(lv[3]),
    type: normalizeText(lv[4]),
    question_lv: normalizeText(lv[5]),
    question_en: eng ? normalizeText(eng[5]) : '',
    options: options,
    options_en: optionsEn,
    correct: normalizeText(lv[10]).toUpperCase(),
    answer: normalizeText(lv[11]),
    answer_en: eng ? normalizeText(eng[11]) : '',
    explanation_lv: normalizeText(lv[12]),
    explanation_en: eng ? normalizeText(eng[12]) : '',
    time: time,
    difficulty: normalizeText(lv[14]),
    source: normalizeText(lv[15]),
    image_url: normalizeText(lv[16]) || null,
    verification_required: isYes(lv[17]),
    skip_en: isYes(lv[18]),
    notes: editorNotes || existingNotes || null
  };

  return question;
}

function isYes(value) {
  const normalized = normalizeText(value).toLowerCase();
  return ['jā', 'yes', 'true', '1'].indexOf(normalized) !== -1;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    lock.waitLock(10000);
    lockAcquired = true;

    const data = parseRequest(e);

    if (data.eventType === 'game_complete') {
      return saveGameRun(data);
    }

    return saveFeedback(data);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: String(error)
    });
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

function saveFeedback(data) {
  const sheet = getFeedbackSheet();
  const source = getSubmissionSource(data.source);

  sheet.appendRow([
    new Date(),
    normalizeText(data.sessionId),
    normalizeLanguage(data.language),
    valueOrEmpty(data.rating),
    normalizeText(data.question),
    normalizeText(data.wish),
    valueOrEmpty(data.score),
    valueOrEmpty(data.percentage),
    normalizeText(data.title),
    toBoolean(data.consent) ? 'Jā' : 'Nē',
    'Saņemts',
    source,
    normalizeText(data.gameVersion)
  ]);

  SpreadsheetApp.flush();

  return jsonResponse({
    ok: true,
    sheet: FEEDBACK_SHEET_NAME,
    row: sheet.getLastRow(),
    source: source
  });
}

function saveGameRun(data) {
  const sheet = getGameRunsSheet();
  const runId = normalizeText(data.runId);

  if (runId && gameRunExists(sheet, runId)) {
    return jsonResponse({
      ok: true,
      duplicate: true,
      sheet: GAME_RUNS_SHEET_NAME,
      runId: runId
    });
  }

  const roundScores = Array.isArray(data.roundScores)
    ? data.roundScores
    : [];

  sheet.appendRow([
    new Date(),
    runId || Utilities.getUuid(),
    normalizeText(data.sessionId),
    normalizeLanguage(data.language),
    valueOrEmpty(data.score),
    valueOrEmpty(data.percentage),
    normalizeText(data.title),
    valueOrZero(roundScores[0]),
    valueOrZero(roundScores[1]),
    valueOrZero(roundScores[2]),
    valueOrZero(roundScores[3]),
    valueOrZero(roundScores[4]),
    valueOrZero(data.bonusPoints),
    normalizeText(data.gameVersion)
  ]);

  SpreadsheetApp.flush();

  return jsonResponse({
    ok: true,
    sheet: GAME_RUNS_SHEET_NAME,
    row: sheet.getLastRow(),
    runId: runId
  });
}

function gameRunExists(sheet, runId) {
  if (sheet.getLastRow() < 2) {
    return false;
  }

  return sheet
    .getRange(2, 2, sheet.getLastRow() - 1, 1)
    .createTextFinder(runId)
    .matchEntireCell(true)
    .findNext() !== null;
}

function getSubmissionSource(source) {
  if (source === 'result') {
    return 'Spēles rezultāts';
  }

  if (source === 'wall') {
    return 'Apsveikumi';
  }

  return 'Par spēli';
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getFeedbackSheet() {
  const sheet = getOrCreateSheet(
    FEEDBACK_SHEET_NAME,
    FEEDBACK_HEADERS
  );

  ensureFeedbackValidation(sheet);
  return sheet;
}

function getGameRunsSheet() {
  return getOrCreateSheet(
    GAME_RUNS_SHEET_NAME,
    GAME_RUN_HEADERS
  );
}

function getOrCreateSheet(sheetName, headers) {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  ensureHeaders(sheet, headers);
  sheet.setFrozenRows(1);

  return sheet;
}

function ensureHeaders(sheet, headers) {
  const headerRange = sheet.getRange(
    1,
    1,
    1,
    headers.length
  );

  const currentHeaders = headerRange.getDisplayValues()[0];
  const headersAreEmpty = currentHeaders.every(function (value) {
    return normalizeText(value) === '';
  });

  if (sheet.getLastRow() === 0 || headersAreEmpty) {
    headerRange.setValues([headers]);
  }
}

function ensureFeedbackValidation(sheet) {
  const numberOfRows = Math.max(sheet.getMaxRows() - 1, 1);

  sheet
    .getRange(2, 2, numberOfRows, 1)
    .clearDataValidations();

  const languageRule = SpreadsheetApp
    .newDataValidation()
    .requireValueInList(['LV', 'EN'], true)
    .setAllowInvalid(false)
    .build();

  const ratingRule = SpreadsheetApp
    .newDataValidation()
    .requireValueInList(['1', '2', '3', '4', '5'], true)
    .setAllowInvalid(false)
    .build();

  const consentRule = SpreadsheetApp
    .newDataValidation()
    .requireValueInList(['Jā', 'Nē'], true)
    .setAllowInvalid(false)
    .build();

  const statusRule = SpreadsheetApp
    .newDataValidation()
    .requireValueInList(
      ['Saņemts', 'Apstiprināts', 'Noraidīts'],
      true
    )
    .setAllowInvalid(false)
    .build();

  sheet
    .getRange(2, 3, numberOfRows, 1)
    .setDataValidation(languageRule);

  sheet
    .getRange(2, 4, numberOfRows, 1)
    .setDataValidation(ratingRule);

  sheet
    .getRange(2, 10, numberOfRows, 1)
    .setDataValidation(consentRule);

  sheet
    .getRange(2, 11, numberOfRows, 1)
    .setDataValidation(statusRule);
}

function parseRequest(e) {
  if (!e) {
    return {};
  }

  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      // Ja saturs nav JSON, izmanto formas parametrus.
    }
  }

  return e.parameter || {};
}

function normalizeLanguage(value) {
  return normalizeText(value).toUpperCase();
}

function valueOrEmpty(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '';
  }

  return value;
}

function valueOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function toBoolean(value) {
  return value === true || value === 'true';
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
