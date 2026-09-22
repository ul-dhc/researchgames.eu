// Cache only public aggregates, independently for each supported period.
function researchGamesSummary_(period) {
  period = period || 'all';
  if (['all', '30d', '7d'].indexOf(period) < 0) return researchGamesUncachedSummary_(period);
  const cache = CacheService.getScriptCache();
  const key = 'researchgames-summary-v1-' + period;
  let cached;
  try { cached = cache.get(key); } catch (error) { console.warn(error); }
  if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
  const response = researchGamesUncachedSummary_(period);
  try {
    const text = response.getContent();
    if (JSON.parse(text).ok === true) cache.put(key, text, 300);
  } catch (error) { console.warn(error); }
  return response;
}
