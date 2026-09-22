export function normalizeSummary(data) {
  if (!data || data.ok !== true || !data.overview) throw new Error('Invalid summary');
  const o = data.overview;
  if (!Number.isSafeInteger(o.sessions) || o.sessions < 0 || !Number.isSafeInteger(o.completed) || o.completed < 0 || o.completed > o.sessions) throw new Error('Invalid counts');
  const optionalNumber = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : null;
  const timeline = data.timeline;
  if (!Array.isArray(timeline) || timeline.some(d => !/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !Number.isSafeInteger(d.sessions) || d.sessions < 0)) throw new Error('Invalid timeline');
  if (timeline.reduce((sum, d) => sum + d.sessions, 0) !== o.sessions) throw new Error('Timeline does not match sessions');
  return {
    generatedAt: Number.isFinite(Date.parse(data.generatedAt)) ? data.generatedAt : null,
    overview: { sessions:o.sessions, completed:o.completed, averageDurationMs:optionalNumber(o.averageDurationMs), averageRating:optionalNumber(o.averageRating), ratingCount:optionalNumber(o.ratingCount) },
    timeline: timeline.map(d => ({date:d.date, sessions:d.sessions}))
  };
}
export function combineSummaries(summaries) {
  const days = new Map();
  let sessions = 0, completed = 0;
  for (const data of summaries) {
    sessions += data.overview.sessions;
    completed += data.overview.completed;
    for (const d of data.timeline) days.set(d.date, (days.get(d.date) || 0) + d.sessions);
  }
  return { sessions, completed, timeline: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, sessions]) => ({date, sessions})) };
}

// Apps Script occasionally returns a temporary Google error page instead of JSON.
// Retry once with a fresh URL; never retry a cancelled period request.
export async function fetchSummary(source, period, signal, fetcher = fetch) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const url = new URL(source);
      url.searchParams.set('resource', 'stats');
      url.searchParams.set('period', period);
      url.searchParams.set('t', `${Date.now()}-${attempt}`);
      const response = await fetcher(url, { signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return normalizeSummary(await response.json());
    } catch (error) {
      if (signal.aborted || attempt === 1) throw error;
    }
  }
}
