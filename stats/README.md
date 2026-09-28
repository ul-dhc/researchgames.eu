# ResearchGames overview

Static LV/EN overview at `/stats/`, linked from both homepage footers. It reads one precomputed public JSON file containing all three games and all three periods. The browser never waits for Apps Script requests. Period changes use the already loaded file.

## Data contract

Each URL in `config.js` supports `?resource=stats&period=all`, `30d`, or `7d` and returns:

```json
{
  "ok": true,
  "generatedAt": "2026-09-22T08:00:00.000Z",
  "overview": {
    "sessions": 3,
    "completed": 2,
    "averageDurationMs": 120000,
    "averageRating": 4.5,
    "ratingCount": 2
  },
  "timeline": [{"date": "2026-09-22", "sessions": 3}]
}
```

The browser sums session/completion counts and groups sessions by date. It does not combine scores, completion rates, average durations, or ratings across games. Missing/failed sources are clearly excluded, never treated as zero. The scheduled collector requests sources concurrently, with a 90-second limit per source/period. Each source's generation time is displayed.

The source dashboards retain their existing period and completion definitions. In particular, Riddle Grid counts a session after the first completed or skipped riddle, and its dates use the last session update; Livonian dates use completion/update/start fallback; LU107 retains its own existing API behavior. This is an overview of existing statistics, not a migration of event tracking.

## Apps Script changes deployed 2026-09-22

The files in `apps-script/` contain the exact small additions, not standalone complete projects. Replace the existing dashboard `doGet` and add the `researchGamesUncachedSummary_` helper and `SummaryCache.gs`. Keep the existing calculation functions. The helper deliberately selects aggregate fields and does not return comments, answers or individual sessions.

- Livonian dashboard: `Code.gs`, deployment updated to version 23; access changed from Only myself to Anyone, as requested.
- Riddle Grid: `mīklu-dashboard.gs` in the `mīklu dati` project, deployment updated to version 24; access was already Anyone. Its existing `Code.gs` and separate game ingestion deployment were not changed.
- LU107: existing JSON endpoint reused unchanged.

Regular requests without `resource=stats` still open the original dashboards. Google Sheets sharing was not changed.

If access is restricted later, protect both the dashboard and its data endpoints; a password prompt in static browser JavaScript alone would not protect the data.

## Local verification

```sh
python3 -m http.server 8765 --bind 127.0.0.1
node --test stats/tests/*.test.mjs
node --check stats/app.js
git diff --check
```

Open `http://127.0.0.1:8765/stats/`. No build step is needed.

The shared interactive timeline draws one colored, patterned line per game on a continuous daily axis. Missing calendar days are zero for available sources; unavailable sources have no line. Pointer/touch selection and keyboard arrows show exact daily values. The existing period selector controls the chart. No new backend or chart library is needed.

## Precomputed snapshot (2026-09-28)

`.github/workflows/analytics-snapshot.yml` collects all/30d/7d summaries on relevant pushes to main, manual dispatch, and a five-minute schedule. After the implementation is pushed, the first run creates the `analytics-data` branch containing only `stats.json`. No extra credentials are needed; the workflow uses the repository token with contents-write permission. Actions must be enabled in the repository.

The browser reads `https://raw.githubusercontent.com/ul-dhc/researchgames.eu/analytics-data/stats.json`. Data updates do not rebuild the website. This also avoids relying on Pages builds from commits made by `GITHUB_TOKEN`, which do not trigger a Pages build.

GitHub schedules can be delayed, so five minutes is a target, not a delivery guarantee. Public-repository schedules can also be disabled after 60 days without repository activity. See [GitHub scheduled workflow documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). Existing Apps Script caches may add up to five minutes of source latency.

Each source and period keeps its own retrieval timestamp. If collection fails, its previous data remains and is marked as awaiting an update. Missing sources are excluded, not counted as zero. Only validated aggregate fields are published; individual sessions, answers, and comments are excluded.

The browser shows its saved snapshot immediately and checks the public file in the background. Data older than 15 minutes or retained after a failed collection is labeled. While the tab is visible, the browser checks the file every five minutes. Refresh reads the latest published file; it does not trigger Google collection. If the public file is unavailable, `stats/snapshot.json` supplies a fallback when it is newer than the browser snapshot. Both files use the same validated format.

To regenerate the tracked fallback locally:

```sh
node stats/scripts/update-snapshot.mjs
```

The shared `SummaryCache.gs` wrapper still caches successful public summaries per period for 300 seconds in Apps Script. Deployed to Livonian version 24 and Riddle Grid version 25; LU107 retains its existing endpoint. This snapshot change does not modify game ingestion or Apps Script deployments.
