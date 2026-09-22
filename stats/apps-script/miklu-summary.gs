// Replace the existing doGet with this version in the Riddle Grid dashboard.
// All existing dashboard helpers remain unchanged.
function doGet(e) {
  if (e && e.parameter && e.parameter.resource === 'stats') {
    return researchGamesSummary_(e.parameter.period);
  }
  return HtmlService.createHtmlOutputFromFile('Dashboard')
    .setTitle('Mīklu režģis – pētniecības dati')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function researchGamesSummary_(period) {
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
