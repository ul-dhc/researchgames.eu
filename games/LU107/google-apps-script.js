const SPREADSHEET_ID =
  '1Azl1K0eixwFGj-qGDdpvxG6P_3fjbGUvekq04p19ve0';

const FEEDBACK_SHEET_NAME = 'Feedback';
const GAME_RUNS_SHEET_NAME = 'GameRuns';
const SESSIONS_SHEET_NAME = 'Sessions';
const QUESTION_EVENTS_SHEET_NAME = 'QuestionEvents';
const QUESTIONS_SHEET_NAME = 'LV–ENG salīdzinājums';
const WISH_REMINDER_EMAIL = 'dhc@lu.lv';
const WISH_REMINDER_END = '2026-10-02T00:00:00+03:00';
const WISH_REMINDER_HANDLER = 'sendPendingWishReminders';

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
  'Spēles versija',
  'Atgādinājums nosūtīts'
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
  '3. Studentu dzīve LU',
  '4. Kultūra un sports LU',
  '5. Fināla izaicinājums',
  'Bonusa punkti',
  'Spēles versija'
];

const SESSION_HEADERS = [
  'Spēles reizes ID',
  'Sesijas ID',
  'Sākšanas laiks',
  'Pēdējais atjauninājums',
  'Pabeigšanas laiks',
  'Statuss',
  'Pēdējā pabeigtā kārta',
  'Valoda',
  'Kopējie punkti',
  'Pareizo atbilžu procenti',
  'Ilgums milisekundēs',
  'Tituls',
  '1. LU vēsture',
  '2. LU mūsdienās',
  '3. Studentu dzīve LU',
  '4. Kultūra un sports LU',
  '5. Fināla izaicinājums',
  'Bonusa punkti',
  'Spēles versija',
  'Ierīces veids'
];

const QUESTION_EVENT_HEADERS = [
  'Laiks',
  'Notikuma ID',
  'Spēles reizes ID',
  'Sesijas ID',
  'Valoda',
  'Jautājuma ID',
  'Jautājuma numurs',
  'Kārtas numurs',
  'Kārta',
  'Mehānika',
  'Pareizi',
  'Iegūtie punkti',
  'Atbildes laiks milisekundēs',
  'Izvēlētā atbilde',
  'Pareizā atbilde',
  'Atvērto fragmentu skaits',
  'Pareizi savienoto pāru skaits',
  'Pāru kopskaits',
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

    if (resource === 'stats') {
      return getStatsResponse(e && e.parameter);
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

function getStatsResponse(parameters) {
  const period = normalizeStatsPeriod(
    parameters && parameters.period
  );
  const cache = CacheService.getScriptCache();
  const cacheKey = 'lu107-stats-v1-' + period;
  const cached = cache.get(cacheKey);
  if (cached) {
    return jsonResponse(JSON.parse(cached));
  }

  const cutoff = statsCutoff(period);
  const spreadsheet = getSpreadsheet();
  const sessions = readStatsRows(SESSIONS_SHEET_NAME, spreadsheet)
    .filter(function (row) {
      return isDateInStatsPeriod(row[2], cutoff);
    });
  const events = readStatsRows(QUESTION_EVENTS_SHEET_NAME, spreadsheet)
    .filter(function (row) {
      return isDateInStatsPeriod(row[0], cutoff);
    });
  const completed = sessions.filter(function (row) {
    return normalizeText(row[5]) === 'completed';
  });
  const questionLabels = getQuestionLabels(spreadsheet);
  const feedbackSummary = getFeedbackStats(
    cutoff,
    sessions,
    spreadsheet
  );

  const response = {
    ok: true,
    service: 'LU 107 statistics',
    generatedAt: new Date().toISOString(),
    period: period,
    overview: buildStatsOverview(
      sessions,
      completed,
      feedbackSummary
    ),
    timeline: buildStatsTimeline(sessions),
    funnel: buildStatsFunnel(sessions),
    rounds: buildRoundStats(sessions),
    languages: buildLanguageStats(sessions),
    devices: buildDeviceStats(sessions),
    mechanics: buildMechanicStats(events),
    questions: buildQuestionStats(events, questionLabels)
  };

  cache.put(cacheKey, JSON.stringify(response), 300);
  return jsonResponse(response);
}

function readStatsRows(sheetName, spreadsheet) {
  const source = spreadsheet || getSpreadsheet();
  const sheet = source.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .getValues();
}

function normalizeStatsPeriod(value) {
  const period = normalizeText(value).toLowerCase();
  return ['7d', '30d', 'all'].indexOf(period) !== -1
    ? period
    : 'all';
}

function statsCutoff(period) {
  if (period === 'all') {
    return null;
  }

  const days = period === '7d' ? 7 : 30;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days + 1);
  return cutoff;
}

function isDateInStatsPeriod(value, cutoff) {
  if (!cutoff) {
    return true;
  }

  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime()) && date >= cutoff;
}

function buildStatsOverview(sessions, completed, feedbackSummary) {
  return {
    sessions: sessions.length,
    completed: completed.length,
    completionRate: percentage(completed.length, sessions.length),
    averageScore: roundedAverage(completed, 8),
    averageAccuracy: roundedAverage(completed, 9),
    averageDurationMs: roundedAverage(completed, 10),
    averageRating: feedbackSummary.averageRating,
    ratingCount: feedbackSummary.ratingCount,
    wishCount: feedbackSummary.wishCount,
    suggestionCount: feedbackSummary.suggestionCount,
    wishSessionRate: percentage(
      feedbackSummary.wishSessions,
      countUniqueSessionIds(sessions)
    ),
    suggestionSessionRate: percentage(
      feedbackSummary.suggestionSessions,
      countUniqueSessionIds(sessions)
    )
  };
}

function buildStatsTimeline(sessions) {
  const days = {};

  sessions.forEach(function (row) {
    const date = row[2] instanceof Date ? row[2] : new Date(row[2]);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = Utilities.formatDate(
      date,
      Session.getScriptTimeZone() || 'Europe/Riga',
      'yyyy-MM-dd'
    );

    if (!days[key]) {
      days[key] = { date: key, sessions: 0, completed: 0 };
    }

    days[key].sessions += 1;
    if (normalizeText(row[5]) === 'completed') {
      days[key].completed += 1;
    }
  });

  return Object.keys(days)
    .sort()
    .map(function (key) {
      return days[key];
    });
}

function buildStatsFunnel(sessions) {
  const counts = [sessions.length, 0, 0, 0, 0, 0, 0];

  sessions.forEach(function (row) {
    const completedRound = Number(row[6]) || 0;
    for (let round = 1; round <= 5; round += 1) {
      if (completedRound >= round) {
        counts[round] += 1;
      }
    }
    if (normalizeText(row[5]) === 'completed') {
      counts[6] += 1;
    }
  });

  return counts.map(function (count, index) {
    return {
      stage: index === 0
        ? 'started'
        : index === 6
          ? 'completed'
          : 'round_' + index,
      count: count,
      rate: percentage(count, sessions.length)
    };
  });
}

function buildRoundStats(sessions) {
  const names = [
    'LU vēsture',
    'LU mūsdienās',
    'Studentu dzīve LU',
    'Kultūra un sports LU',
    'Fināla izaicinājums'
  ];

  return names.map(function (name, index) {
    const values = sessions
      .filter(function (row) {
        return Number(row[6]) >= index + 1;
      })
      .map(function (row) {
        return numericValue(row[12 + index]);
      })
      .filter(function (value) {
        return value !== null;
      });

    return {
      round: index + 1,
      name: name,
      averageScore: averageNumbers(values),
      sessions: values.length
    };
  });
}

function buildLanguageStats(sessions) {
  const counts = { LV: 0, EN: 0 };
  sessions.forEach(function (row) {
    const language = normalizeLanguage(row[7]);
    if (language === 'LV' || language === 'EN') {
      counts[language] += 1;
    }
  });

  return Object.keys(counts).map(function (language) {
    return {
      language: language,
      count: counts[language],
      rate: percentage(counts[language], sessions.length)
    };
  });
}

function buildDeviceStats(sessions) {
  const counts = { phone: 0, tablet: 0, desktop: 0 };
  sessions.forEach(function (row) {
    const device = normalizeText(row[19]).toLowerCase();
    if (counts[device] !== undefined) {
      counts[device] += 1;
    }
  });

  const knownTotal = counts.phone + counts.tablet + counts.desktop;
  return Object.keys(counts).map(function (device) {
    return {
      device: device,
      count: counts[device],
      rate: percentage(counts[device], knownTotal)
    };
  });
}

function buildMechanicStats(events) {
  const mechanics = {};
  events.forEach(function (row) {
    const mechanic = normalizeText(row[9]) || 'Nav norādīta';
    if (!mechanics[mechanic]) {
      mechanics[mechanic] = { mechanic: mechanic, answers: 0, correct: 0 };
    }
    mechanics[mechanic].answers += 1;
    if (normalizeText(row[10]).toLowerCase() === 'jā') {
      mechanics[mechanic].correct += 1;
    }
  });

  return Object.keys(mechanics)
    .map(function (key) {
      const item = mechanics[key];
      item.correctRate = percentage(item.correct, item.answers);
      return item;
    })
    .sort(function (a, b) {
      return b.answers - a.answers;
    });
}

function buildQuestionStats(events, labels) {
  const questions = {};
  events.forEach(function (row) {
    const id = normalizeText(row[5]);
    if (!id) {
      return;
    }

    if (!questions[id]) {
      questions[id] = {
        id: id,
        answers: 0,
        correct: 0,
        responseTimeTotal: 0,
        responseTimeCount: 0,
        pointsTotal: 0,
        roundCounts: {}
      };
    }

    const item = questions[id];
    const responseTime = numericValue(row[12]);
    const eventRound = normalizeText(row[8]);
    item.answers += 1;
    item.pointsTotal += Number(row[11]) || 0;
    if (normalizeText(row[10]).toLowerCase() === 'jā') {
      item.correct += 1;
    }
    if (responseTime !== null && responseTime > 0) {
      item.responseTimeTotal += responseTime;
      item.responseTimeCount += 1;
    }
    if (eventRound) {
      item.roundCounts[eventRound] = (item.roundCounts[eventRound] || 0) + 1;
    }
  });

  return Object.keys(questions)
    .map(function (id) {
      const item = questions[id];
      const label = labels[id] || {};
      const eventRound = Object.keys(item.roundCounts).sort(function (a, b) {
        return item.roundCounts[b] - item.roundCounts[a];
      })[0] || '';
      return {
        id: id,
        questionLv: label.lv || id,
        questionEn: label.en || label.lv || id,
        round: eventRound || label.round || '',
        mechanic: label.mechanic || '',
        answers: item.answers,
        correct: item.correct,
        correctRate: percentage(item.correct, item.answers),
        averageResponseTimeMs: item.responseTimeCount
          ? Math.round(item.responseTimeTotal / item.responseTimeCount)
          : 0,
        averagePoints: item.answers
          ? roundNumber(item.pointsTotal / item.answers, 1)
          : 0
      };
    })
    .sort(function (a, b) {
      return a.correctRate - b.correctRate || b.answers - a.answers;
    });
}

function getQuestionLabels(spreadsheet) {
  const source = spreadsheet || getSpreadsheet();
  const sheet = source.getSheetByName(QUESTIONS_SHEET_NAME);
  if (!sheet) {
    return {};
  }

  const rows = sheet.getDataRange().getDisplayValues();
  const labels = {};
  rows.forEach(function (row) {
    const language = normalizeLanguage(row[0]);
    const id = normalizeText(row[1]);
    if (!id || (language !== 'LV' && language !== 'ENG')) {
      return;
    }

    if (!labels[id]) {
      labels[id] = {};
    }
    labels[id][language === 'LV' ? 'lv' : 'en'] = normalizeText(row[5]);
    if (language === 'LV') {
      labels[id].round = normalizeText(row[2]);
      labels[id].mechanic = normalizeText(row[4]);
    }
  });
  return labels;
}

function getFeedbackStats(cutoff, sessions, spreadsheet) {
  const rows = readStatsRows(FEEDBACK_SHEET_NAME, spreadsheet);
  const validSessionIds = {};
  sessions.forEach(function (row) {
    const sessionId = normalizeText(row[1]);
    if (sessionId) {
      validSessionIds[sessionId] = true;
    }
  });
  const filteredRows = rows.filter(function (row) {
    return isDateInStatsPeriod(row[0], cutoff);
  });
  const ratings = filteredRows
    .map(function (row) {
      return numericValue(row[3]);
    })
    .filter(function (value) {
      return value !== null && value >= 1 && value <= 5;
    });
  const wishSessions = {};
  const suggestionSessions = {};
  let wishCount = 0;
  let suggestionCount = 0;

  filteredRows.forEach(function (row) {
    const sessionId = normalizeText(row[1]);
    if (normalizeText(row[5])) {
      wishCount += 1;
      if (sessionId && validSessionIds[sessionId]) {
        wishSessions[sessionId] = true;
      }
    }
    if (normalizeText(row[4])) {
      suggestionCount += 1;
      if (sessionId && validSessionIds[sessionId]) {
        suggestionSessions[sessionId] = true;
      }
    }
  });

  return {
    averageRating: averageNumbers(ratings),
    ratingCount: ratings.length,
    wishCount: wishCount,
    suggestionCount: suggestionCount,
    wishSessions: Object.keys(wishSessions).length,
    suggestionSessions: Object.keys(suggestionSessions).length
  };
}

function countUniqueSessionIds(sessions) {
  const ids = {};
  sessions.forEach(function (row) {
    const sessionId = normalizeText(row[1]);
    if (sessionId) {
      ids[sessionId] = true;
    }
  });
  return Object.keys(ids).length;
}

function roundedAverage(rows, column) {
  return averageNumbers(
    rows
      .map(function (row) {
        return numericValue(row[column]);
      })
      .filter(function (value) {
        return value !== null;
      })
  );
}

function averageNumbers(values) {
  if (!values.length) {
    return 0;
  }
  const total = values.reduce(function (sum, value) {
    return sum + value;
  }, 0);
  return roundNumber(total / values.length, 1);
}

function percentage(value, total) {
  return total ? roundNumber(value / total * 100, 1) : 0;
}

function numericValue(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function roundNumber(value, decimals) {
  const factor = Math.pow(10, decimals || 0);
  return Math.round(value * factor) / factor;
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

    if (data.eventType === 'game_start') {
      return saveSessionEvent(data, 'started');
    }

    if (data.eventType === 'game_progress') {
      return saveSessionEvent(data, 'in_progress');
    }

    if (data.eventType === 'question_answered') {
      return saveQuestionEvent(data);
    }

    if (data.eventType === 'game_complete') {
      saveSessionEvent(data, 'completed');
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

function sendPendingWishReminders() {
  const now = new Date();
  const reminderEnd = new Date(WISH_REMINDER_END);

  if (now >= reminderEnd) {
    removeWishReminderTriggers();
    return;
  }

  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    lock.waitLock(10000);
    lockAcquired = true;

    const sheet = getOrCreateSheet(
      FEEDBACK_SHEET_NAME,
      FEEDBACK_HEADERS
    );
    if (sheet.getLastRow() < 2) {
      return;
    }

    const rows = sheet
      .getRange(2, 1, sheet.getLastRow() - 1, FEEDBACK_HEADERS.length)
      .getValues();
    const minimumAge = 60 * 60 * 1000;
    const pending = [];

    rows.forEach(function (row, index) {
      const submittedAt = row[0] instanceof Date
        ? row[0]
        : new Date(row[0]);
      const wish = normalizeText(row[5]);
      const status = normalizeText(row[10]).toLowerCase();
      const reminderSentAt = row[13];

      if (
        wish &&
        status === 'saņemts' &&
        !reminderSentAt &&
        !Number.isNaN(submittedAt.getTime()) &&
        now.getTime() - submittedAt.getTime() >= minimumAge
      ) {
        pending.push({
          rowNumber: index + 2,
          submittedAt: submittedAt,
          language: normalizeLanguage(row[2]),
          wish: wish
        });
      }
    });

    if (!pending.length) {
      return;
    }

    if (MailApp.getRemainingDailyQuota() < 1) {
      throw new Error('Nav pieejama e-pasta saņēmēju dienas kvota.');
    }

    const spreadsheetUrl =
      'https://docs.google.com/spreadsheets/d/' +
      SPREADSHEET_ID +
      '/edit#gid=' +
      sheet.getSheetId();
    const pendingLabel = pending.length === 1
      ? '1 neapstrādāts novēlējums'
      : pending.length + ' neapstrādāti novēlējumi';
    const subject = 'LU107: ' + pendingLabel;
    const plainItems = pending.map(function (item, index) {
      return (
        (index + 1) +
        '. [' +
        item.language +
        '] ' +
        item.wish
      );
    });
    const htmlItems = pending.map(function (item) {
      return (
        '<li><strong>' +
        escapeHtmlForEmail(item.language) +
        '</strong>: ' +
        escapeHtmlForEmail(item.wish) +
        '</li>'
      );
    });

    MailApp.sendEmail({
      to: WISH_REMINDER_EMAIL,
      subject: subject,
      body:
        'Vismaz vienu stundu statusā “Saņemts” ' +
        (pending.length === 1 ? 'ir palicis ' : 'ir palikuši ') +
        pendingLabel +
        '.\n\n' +
        plainItems.join('\n\n') +
        '\n\nAtvērt Google Sheets: ' +
        spreadsheetUrl,
      htmlBody:
        '<p>Vismaz vienu stundu statusā <strong>Saņemts</strong> ' +
        (pending.length === 1 ? 'ir palicis ' : 'ir palikuši ') +
        escapeHtmlForEmail(pendingLabel) +
        '.</p><ol>' +
        htmlItems.join('') +
        '</ol><p><a href="' +
        spreadsheetUrl +
        '">Atvērt Google Sheets</a></p>',
      name: 'LU107 novēlējumu siena'
    });

    pending.forEach(function (item) {
      sheet.getRange(item.rowNumber, 14).setValue(now);
    });
    SpreadsheetApp.flush();
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

function installWishReminderTrigger() {
  removeWishReminderTriggers();

  if (new Date() >= new Date(WISH_REMINDER_END)) {
    throw new Error('LU107 novēlējumu atgādinājumu periods ir beidzies.');
  }

  ScriptApp
    .newTrigger(WISH_REMINDER_HANDLER)
    .timeBased()
    .everyHours(1)
    .create();
}

function removeWishReminderTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === WISH_REMINDER_HANDLER) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function escapeHtmlForEmail(value) {
  return normalizeText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function saveSessionEvent(data, status) {
  const sheet = getSessionsSheet();
  const runId = normalizeText(data.runId) || Utilities.getUuid();
  const rowNumber = findRowByExactValue(sheet, 1, runId);
  const existing = rowNumber
    ? sheet.getRange(rowNumber, 1, 1, SESSION_HEADERS.length).getValues()[0]
    : new Array(SESSION_HEADERS.length).fill('');
  const now = new Date();
  const roundScores = Array.isArray(data.roundScores) ? data.roundScores : [];
  const startedAt = existing[2] || dateOrFallback(data.startedAt, now);
  const completedAt = status === 'completed'
    ? dateOrFallback(data.completedAt, now)
    : existing[4];
  const effectiveStatus = sessionStatusRank(existing[5]) > sessionStatusRank(status)
    ? existing[5]
    : status;

  if (rowNumber && effectiveStatus !== status) {
    return jsonResponse({
      ok: true,
      ignoredOlderEvent: true,
      sheet: SESSIONS_SHEET_NAME,
      runId: runId,
      status: effectiveStatus
    });
  }

  const row = [
    runId,
    normalizeText(data.sessionId) || existing[1],
    startedAt,
    now,
    completedAt,
    effectiveStatus,
    numberOrExisting(data.lastCompletedRound, existing[6]),
    normalizeLanguage(data.language) || existing[7],
    numberOrExisting(data.score, existing[8]),
    numberOrExisting(data.percentage, existing[9]),
    numberOrExisting(data.durationMs, existing[10]),
    normalizeText(data.title) || existing[11],
    numberOrExisting(roundScores[0], existing[12]),
    numberOrExisting(roundScores[1], existing[13]),
    numberOrExisting(roundScores[2], existing[14]),
    numberOrExisting(roundScores[3], existing[15]),
    numberOrExisting(roundScores[4], existing[16]),
    numberOrExisting(data.bonusPoints, existing[17]),
    normalizeText(data.gameVersion) || existing[18],
    normalizeText(data.deviceType) || existing[19]
  ];

  if (rowNumber) {
    sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  SpreadsheetApp.flush();
  return jsonResponse({
    ok: true,
    sheet: SESSIONS_SHEET_NAME,
    runId: runId,
    status: effectiveStatus
  });
}

function saveQuestionEvent(data) {
  const sheet = getQuestionEventsSheet();
  const eventId = normalizeText(data.eventId);

  if (eventId && findRowByExactValue(sheet, 2, eventId)) {
    return jsonResponse({
      ok: true,
      duplicate: true,
      sheet: QUESTION_EVENTS_SHEET_NAME,
      eventId: eventId
    });
  }

  sheet.appendRow([
    new Date(),
    eventId || Utilities.getUuid(),
    normalizeText(data.runId),
    normalizeText(data.sessionId),
    normalizeLanguage(data.language),
    normalizeText(data.questionId),
    valueOrEmpty(data.questionIndex),
    valueOrEmpty(data.roundIndex),
    normalizeText(data.roundName),
    normalizeText(data.mechanic),
    toBoolean(data.correct) ? 'Jā' : 'Nē',
    valueOrZero(data.points),
    valueOrZero(data.responseTimeMs),
    normalizeText(data.selectedAnswer),
    normalizeText(data.correctAnswer),
    valueOrEmpty(data.revealedFragments),
    valueOrEmpty(data.correctPairs),
    valueOrEmpty(data.totalPairs),
    normalizeText(data.gameVersion)
  ]);

  SpreadsheetApp.flush();
  return jsonResponse({
    ok: true,
    sheet: QUESTION_EVENTS_SHEET_NAME,
    eventId: eventId
  });
}

function sessionStatusRank(status) {
  return {
    started: 1,
    in_progress: 2,
    completed: 3
  }[normalizeText(status)] || 0;
}

function findRowByExactValue(sheet, column, value) {
  if (!value || sheet.getLastRow() < 2) {
    return 0;
  }

  const match = sheet
    .getRange(2, column, sheet.getLastRow() - 1, 1)
    .createTextFinder(value)
    .matchEntireCell(true)
    .findNext();

  return match ? match.getRow() : 0;
}

function dateOrFallback(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function numberOrExisting(value, existing) {
  if (value === null || value === undefined || value === '') {
    return existing === null || existing === undefined ? '' : existing;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : existing;
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

function getSessionsSheet() {
  return getOrCreateSheet(
    SESSIONS_SHEET_NAME,
    SESSION_HEADERS
  );
}

function getQuestionEventsSheet() {
  return getOrCreateSheet(
    QUESTION_EVENTS_SHEET_NAME,
    QUESTION_EVENT_HEADERS
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
  const headersMatch = currentHeaders.every(function (value, index) {
    return normalizeText(value) === normalizeText(headers[index]);
  });

  if (!headersMatch) {
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
