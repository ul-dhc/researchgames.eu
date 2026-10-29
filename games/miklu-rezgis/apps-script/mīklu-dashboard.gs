const DASHBOARD_SPREADSHEET_ID = '1P4vS-YtPka5V3l4W8Jlro5jFiF-Y6wjmzsLJYqb9Qpk';
const DASHBOARD_SESSIONS_SHEET = 'sessions';
const DASHBOARD_EVALUATIONS_SHEET = 'evaluations';
const DASHBOARD_TIME_ZONE = 'Europe/Riga';
const DASHBOARD_GAME_VERSIONS = [
  { value: '10', label: 'Ātrā spēle' },
  { value: '50', label: 'Vidējā spēle' },
  { value: '100', label: 'Garā spēle' },
  { value: 'daily', label: 'Dienas mīkla' },
  { value: 'child', label: 'Bērnu spēle' },
  { value: 'party', label: 'Ballītes versija' }
];

function doGet(e) {
  if (e && e.parameter && e.parameter.resource === 'stats') {
    return researchGamesSummary_(e.parameter.period);
  }
  return HtmlService.createHtmlOutputFromFile('Dashboard')
    .setTitle('Mīklu režģis – pētniecības dati')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDashboardData(filters) {
  filters = filters || {};
  const spreadsheet = SpreadsheetApp.openById(DASHBOARD_SPREADSHEET_ID);
  spreadsheet.setSpreadsheetTimeZone(DASHBOARD_TIME_ZONE);

  const sessions = readSheet_(spreadsheet, DASHBOARD_SESSIONS_SHEET);
  const evaluations = readSheet_(spreadsheet, DASHBOARD_EVALUATIONS_SHEET);
  const days = normalizeDays_(filters.days);
  const version = text_(filters.version);
  const participation = text_(filters.participation);
  const ageGroup = text_(filters.ageGroup);
  const sessionStatus = text_(filters.sessionStatus);
  const outcome = text_(filters.outcome);
  const heardBefore = text_(filters.heardBefore);
  const solutionMethod = text_(filters.solutionMethod);
  const difficulty = text_(filters.difficulty);

  const periodSessions = filterByDays_(sessions, days, [
    'last_updated_at', 'session_finished_at', 'session_started_at'
  ]);
  let sessionsBeforeAge = periodSessions.filter(function(row) {
    return (!version || text_(row.game_version) === version) &&
      (!participation || text_(row.participation_type) === participation) &&
      (!sessionStatus || completionKey_(row) === sessionStatus);
  });

  const periodEvaluations = filterByDays_(evaluations, days, ['played_at']);
  let sessionIdsBeforeAge = indexSessionIds_(sessionsBeforeAge);
  let matchingEvaluations = periodEvaluations.filter(function(row) {
    return Boolean(sessionIdsBeforeAge[text_(row.session_id)]) &&
      (!outcome || outcomeKey_(row) === outcome) &&
      (!heardBefore || normalizeAnswer_(row.heard_before) === heardBefore) &&
      (!solutionMethod || normalizeAnswer_(row.solution_method) === solutionMethod) &&
      (!difficulty || text_(row.difficulty_rating) === difficulty);
  });

  if (outcome || heardBefore || solutionMethod || difficulty) {
    const matchedSessionIds = {};
    matchingEvaluations.forEach(function(row) {
      matchedSessionIds[text_(row.session_id)] = true;
    });
    sessionsBeforeAge = sessionsBeforeAge.filter(function(row) {
      return Boolean(matchedSessionIds[text_(row.session_id)]);
    });
  }

  const ageChartSessions = sessionsBeforeAge;
  const filteredSessions = ageChartSessions.filter(function(row) {
    return !ageGroup || text_(row.age_group) === ageGroup;
  });
  const sessionIds = indexSessionIds_(filteredSessions);
  const filteredEvaluations = matchingEvaluations.filter(function(row) {
    return Boolean(sessionIds[text_(row.session_id)]);
  });

  return {
    generatedAt: Utilities.formatDate(new Date(), DASHBOARD_TIME_ZONE, 'dd.MM.yyyy HH:mm:ss'),
    filters: {
      days: days,
      version: version,
      participation: participation,
      ageGroup: ageGroup,
      sessionStatus: sessionStatus,
      outcome: outcome,
      heardBefore: heardBefore,
      solutionMethod: solutionMethod,
      difficulty: difficulty,
      versions: DASHBOARD_GAME_VERSIONS.slice(),
      participationTypes: distinct_(periodSessions, 'participation_type')
    },
    metrics: Object.assign(buildMetrics_(filteredSessions, filteredEvaluations), {
      playerQuestions: countPlayerQuestions_(spreadsheet, filteredSessions, days)
    }),
    timeline: buildTimeline_(filteredSessions),
    versions: buildBreakdown_(filteredSessions, 'game_version', versionLabel_),
    participation: buildBreakdown_(filteredSessions, 'participation_type', participationLabel_),
    completion: buildCompletion_(filteredSessions),
    ratings: buildRatings_(filteredSessions),
    ages: buildBreakdown_(ageChartSessions, 'age_group', identity_),
    outcomes: buildOutcomes_(filteredEvaluations),
    heardBefore: buildHeardBefore_(filteredEvaluations),
    solutionMethods: buildSolutionMethods_(filteredEvaluations),
    difficulties: buildDifficulties_(filteredEvaluations),
    riddlePerformance: buildRiddlePerformance_(filteredEvaluations),
    comments: buildComments_(filteredSessions),
    variants: buildVariants_(filteredEvaluations)
  };
}

function readSheet_(spreadsheet, name) {
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) throw new Error('Nav atrasta cilne "' + name + '".');
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(function(value) { return text_(value); });
  return values.slice(1).map(function(row) {
    const result = {};
    headers.forEach(function(header, index) {
      if (header) result[header] = row[index];
    });
    return result;
  }).filter(function(row) {
    return text_(row.session_id) || text_(row.response_id);
  });
}

function normalizeDays_(value) {
  const number = Number(value);
  return isFinite(number) && number >= 0 ? number : 30;
}

function filterByDays_(rows, days, fields) {
  if (days === 0) return rows;
  const threshold = Date.now() - days * 86400000;
  return rows.filter(function(row) {
    const date = firstDate_(row, fields);
    return date && date.getTime() >= threshold;
  });
}

function firstDate_(row, fields) {
  for (let i = 0; i < fields.length; i += 1) {
    const date = parseDate_(row[fields[i]]);
    if (date) return date;
  }
  return null;
}

function buildMetrics_(sessions, evaluations) {
  const completed = sessions.filter(isCompleted_);
  const rated = sessions.map(function(row) {
    return number_(row.game_rating);
  }).filter(function(value) {
    return value >= 1 && value <= 5;
  });
  const researchSessions = sessions.filter(function(row) {
    return text_(row.participation_type) === 'research';
  });
  const solved = evaluations.filter(function(row) {
    return boolean_(row.solved);
  }).length;

  return {
    sessions: sessions.length,
    completed: completed.length,
    completionRate: percent_(completed.length, sessions.length),
    averageScore: average_(completed.map(function(row) {
      return number_(row.total_points);
    }), true),
    averageTimeMs: average_(completed.map(function(row) {
      return number_(row.total_time_ms);
    }), true),
    averageRating: average_(rated, false, 1),
    evaluatedRiddles: evaluations.length,
    solvedRate: percent_(solved, evaluations.length),
    researchSessions: researchSessions.length
  };
}

function buildTimeline_(rows) {
  const counts = {};
  rows.forEach(function(row) {
    const date = firstDate_(row, ['last_updated_at', 'session_finished_at', 'session_started_at']);
    if (!date) return;
    const key = Utilities.formatDate(date, DASHBOARD_TIME_ZONE, 'yyyy-MM-dd');
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.keys(counts).sort().map(function(key) {
    return { date: key, sessions: counts[key] };
  });
}

function buildBreakdown_(rows, field, labeler) {
  const counts = {};
  rows.forEach(function(row) {
    const key = text_(row[field]) || 'Nav norādīts';
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.keys(counts).sort().map(function(key) {
    return { key: key, label: labeler(key), value: counts[key] };
  });
}

function buildCompletion_(rows) {
  const completed = rows.filter(isCompleted_).length;
  const active = rows.filter(function(row) {
    return !isCompleted_(row) && number_(row.completed_riddle_count) > 0;
  }).length;
  return [
    { key: 'completed', label: 'Pabeigta', value: completed },
    { key: 'in_progress', label: 'Pārtraukta', value: active }
  ];
}

function completionKey_(row) {
  return isCompleted_(row) ? 'completed' :
    (number_(row.completed_riddle_count) > 0 ? 'in_progress' : 'not_started');
}

function outcomeKey_(row) {
  if (boolean_(row.solved)) return 'solved';
  if (boolean_(row.gave_up)) return 'gave_up';
  return 'other';
}

function indexSessionIds_(rows) {
  const result = {};
  rows.forEach(function(row) {
    const id = text_(row.session_id);
    if (id) result[id] = true;
  });
  return result;
}

function buildRatings_(rows) {
  const counts = [0, 0, 0, 0, 0];
  rows.forEach(function(row) {
    const rating = number_(row.game_rating);
    if (rating >= 1 && rating <= 5) counts[rating - 1] += 1;
  });
  return counts.map(function(value, index) {
    return { rating: index + 1, value: value };
  });
}

function buildOutcomes_(rows) {
  const solved = rows.filter(function(row) { return boolean_(row.solved); }).length;
  const gaveUp = rows.filter(function(row) { return boolean_(row.gave_up); }).length;
  const other = Math.max(0, rows.length - solved - gaveUp);
  return [
    { key: 'solved', label: 'Atminēta', value: solved },
    { key: 'gave_up', label: 'Padodos', value: gaveUp },
    { key: 'other', label: 'Nav atbildes', value: other }
  ];
}

function buildHeardBefore_(rows) {
  return buildNormalizedAnswers_(rows, 'heard_before', {
    yes: 'Jā',
    no: 'Nē',
    unsure: 'Neatceros',
    unknown: 'Nav atbildes'
  });
}

function buildSolutionMethods_(rows) {
  return buildNormalizedAnswers_(rows, 'solution_method', {
    knew: 'Zināju uzreiz',
    solved_riddle: 'Atminēju mīklu',
    found_grid: 'Atradu režģī',
    hint: 'Palīdzēja uzvedne',
    gave_up: 'Padevos',
    unknown: 'Nav atbildes'
  });
}

function buildDifficulties_(rows) {
  const counts = {};
  rows.forEach(function(row) {
    const value = text_(row.difficulty_rating) || 'Nav atbildes';
    counts[value] = (counts[value] || 0) + 1;
  });
  return Object.keys(counts).sort(function(a, b) {
    return number_(a) - number_(b);
  }).map(function(key) {
    return { key: key, label: key === 'Nav atbildes' ? key : key + ' / 5', value: counts[key] };
  });
}

function buildNormalizedAnswers_(rows, field, labels) {
  const counts = {};
  rows.forEach(function(row) {
    const key = normalizeAnswer_(row[field]);
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.keys(counts).map(function(key) {
    return { key: key, label: labels[key] || key, value: counts[key] };
  }).sort(function(a, b) {
    return b.value - a.value;
  });
}

function buildRiddlePerformance_(rows) {
  const groups = {};
  rows.forEach(function(row) {
    const id = text_(row.riddle_id) || 'Bez ID';
    if (!groups[id]) {
      groups[id] = {
        riddleId: id,
        unitNumber: text_(row.unit_number),
        riddleText: text_(row.riddle_text),
        answer: text_(row.answer),
        plays: 0,
        solved: 0,
        gaveUp: 0,
        timeTotal: 0,
        timeCount: 0,
        hints: 0,
        wrongAttempts: 0,
        difficultyTotal: 0,
        difficultyCount: 0
      };
    }
    const group = groups[id];
    group.plays += 1;
    if (boolean_(row.solved)) group.solved += 1;
    if (boolean_(row.gave_up)) group.gaveUp += 1;
    const time = number_(row.time_ms);
    if (time > 0) {
      group.timeTotal += time;
      group.timeCount += 1;
    }
    group.hints += number_(row.hints_used);
    group.wrongAttempts += number_(row.wrong_attempts);
    const difficulty = number_(row.difficulty_rating);
    if (difficulty >= 1 && difficulty <= 5) {
      group.difficultyTotal += difficulty;
      group.difficultyCount += 1;
    }
  });

  return Object.keys(groups).map(function(key) {
    const group = groups[key];
    return {
      riddleId: group.riddleId,
      unitNumber: group.unitNumber,
      riddleText: group.riddleText,
      answer: group.answer,
      plays: group.plays,
      solved: group.solved,
      solvedRate: percent_(group.solved, group.plays),
      gaveUp: group.gaveUp,
      averageTimeMs: group.timeCount ? Math.round(group.timeTotal / group.timeCount) : 0,
      averageHints: group.plays ? round_(group.hints / group.plays, 1) : 0,
      averageWrongAttempts: group.plays ? round_(group.wrongAttempts / group.plays, 1) : 0,
      averageDifficulty: group.difficultyCount
        ? round_(group.difficultyTotal / group.difficultyCount, 1)
        : 0
    };
  }).sort(function(a, b) {
    if (a.solvedRate !== b.solvedRate) return a.solvedRate - b.solvedRate;
    return b.plays - a.plays;
  });
}

function buildComments_(rows) {
  return rows.filter(function(row) {
    return text_(row.player_comment);
  }).sort(function(a, b) {
    return dateValue_(b, ['last_updated_at', 'session_finished_at']) -
      dateValue_(a, ['last_updated_at', 'session_finished_at']);
  }).slice(0, 12).map(function(row) {
    return {
      date: formatDate_(firstDate_(row, ['last_updated_at', 'session_finished_at'])),
      rating: number_(row.game_rating) || null,
      version: versionLabel_(text_(row.game_version)),
      text: text_(row.player_comment)
    };
  });
}

function buildVariants_(rows) {
  return rows.filter(function(row) {
    return text_(row.similar_variant_text);
  }).sort(function(a, b) {
    return dateValue_(b, ['played_at']) - dateValue_(a, ['played_at']);
  }).slice(0, 12).map(function(row) {
    return {
      date: formatDate_(parseDate_(row.played_at)),
      riddleId: text_(row.riddle_id),
      riddleText: text_(row.riddle_text),
      text: text_(row.similar_variant_text)
    };
  });
}

function distinct_(rows, field) {
  const values = {};
  rows.forEach(function(row) {
    const value = text_(row[field]);
    if (value) values[value] = true;
  });
  return Object.keys(values).sort().map(function(value) {
    return {
      value: value,
      label: field === 'game_version' ? versionLabel_(value) : participationLabel_(value)
    };
  });
}

function isCompleted_(row) {
  return text_(row.session_status).toLowerCase() === 'completed' ||
    (
      number_(row.planned_riddle_count) > 0 &&
      number_(row.completed_riddle_count) >= number_(row.planned_riddle_count)
    );
}

function normalizeAnswer_(value) {
  const normalized = text_(value).toLowerCase();
  if (!normalized) return 'unknown';
  const aliases = {
    'jā': 'yes', 'ja': 'yes', 'yes': 'yes',
    'nē': 'no', 'ne': 'no', 'no': 'no',
    'neatceros': 'unsure', 'i do not remember': 'unsure',
    'zināju uzreiz': 'knew', 'knew': 'knew',
    'atminēju mīklu': 'solved_riddle', 'solved_riddle': 'solved_riddle',
    'atradu režģī': 'found_grid', 'found_grid': 'found_grid',
    'palīdzēja uzvedne': 'hint', 'hint': 'hint', 'used_hint': 'hint',
    'padevos': 'gave_up', 'gave_up': 'gave_up'
  };
  return aliases[normalized] || normalized;
}

function versionLabel_(value) {
  const labels = {
    '10': 'Ātrā spēle',
    '50': 'Vidējā spēle',
    '100': 'Garā spēle',
    daily: 'Dienas mīkla',
    child: 'Bērnu spēle',
    party: 'Ballītes versija',
    diagnostic: 'Diagnostika'
  };
  return labels[value] || value || 'Nav norādīts';
}

function participationLabel_(value) {
  const labels = {
    player: 'Spēlētājs',
    research: 'Pētījuma dalībnieks',
    party: 'Ballītes versija',
    diagnostic: 'Diagnostika'
  };
  return labels[value] || value || 'Nav norādīts';
}

function identity_(value) {
  return value || 'Nav norādīts';
}

function boolean_(value) {
  return value === true || ['true', 'yes', 'jā', '1'].indexOf(text_(value).toLowerCase()) >= 0;
}

function parseDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function dateValue_(row, fields) {
  const date = firstDate_(row, fields);
  return date ? date.getTime() : 0;
}

function formatDate_(date) {
  return date ? Utilities.formatDate(date, DASHBOARD_TIME_ZONE, 'dd.MM.yyyy HH:mm') : '';
}

function text_(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function number_(value) {
  const result = Number(value);
  return isFinite(result) ? result : 0;
}

function average_(values, positiveOnly, decimals) {
  const valid = values.filter(function(value) {
    return isFinite(value) && (!positiveOnly || value > 0);
  });
  if (!valid.length) return 0;
  return round_(valid.reduce(function(sum, value) {
    return sum + value;
  }, 0) / valid.length, decimals || 0);
}

function round_(value, decimals) {
  const factor = Math.pow(10, decimals || 0);
  return Math.round(value * factor) / factor;
}

function percent_(part, total) {
  return total ? Math.round(part / total * 100) : 0;
}

function researchGamesUncachedSummary_(period) {
  const periods = { all: 0, '30d': 30, '7d': 7 };
  let summary;
  try {
    if (!Object.prototype.hasOwnProperty.call(periods, period || 'all')) {
      throw new Error('Invalid period');
    }
    const data = getDashboardData({days: periods[period || 'all']});
    const m = data.metrics;
    summary = {
      ok: true,
      generatedAt: new Date().toISOString(),
      overview: {
        sessions: m.sessions,
        completed: m.completed,
        averageDurationMs: m.averageTimeMs,
        averageRating: m.averageRating,
        ratingCount: data.ratings.reduce((sum, item) => sum + item.value, 0)
      },
      timeline: data.timeline.map(item => ({date: item.date, sessions: item.sessions}))
    };
  } catch (error) {
    console.error(error);
    summary = {ok: false, error: 'Summary unavailable'};
  }
  return ContentService.createTextOutput(JSON.stringify(summary))
    .setMimeType(ContentService.MimeType.JSON);
}
