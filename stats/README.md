# ResearchGames overview

Static LV/EN overview at `/stats/`, linked from both homepage footers. It reads the three existing Apps Script deployments directly. There is no new service, database, scraping, authentication layer, or scheduled job.

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

The browser sums session/completion counts and groups sessions by date. It does not combine scores, completion rates, average durations, or ratings across games. Missing/failed sources are clearly excluded, never treated as zero. Requests retry once on transient Google errors and have individual timeouts; changing the period cancels the previous requests. Each source's generation time is displayed.

The source dashboards retain their existing period and completion definitions. In particular, Riddle Grid counts a session after the first completed or skipped riddle, and its dates use the last session update; Livonian dates use completion/update/start fallback; LU107 retains its own existing API behavior. This is an overview of existing statistics, not a migration of event tracking.

## Apps Script changes deployed 2026-09-22

The files in `apps-script/` contain the exact small additions, not standalone complete projects. Replace the existing dashboard `doGet` and add the `researchGamesSummary_` helper. Keep the existing calculation functions. The helper deliberately selects aggregate fields and does not return comments, answers or individual sessions.

- Livonian dashboard: `Code.gs`, deployment updated to version 23; access changed from Only myself to Anyone, as requested.
- Riddle Grid: `mīklu-dashboard.gs` in the `mīklu dati` project, deployment updated to version 24; access was already Anyone. Its existing `Code.gs` and separate game ingestion deployment were not changed.
- LU107: existing JSON endpoint reused unchanged.

Regular requests without `resource=stats` still open the original dashboards. Google Sheets sharing was not changed.

If access is restricted later, protect both the dashboard and its data endpoints; a password prompt in static browser JavaScript alone would not protect the data.

## Local verification

```sh
python3 -m http.server 8765 --bind 127.0.0.1
node --test stats/tests/data.test.mjs
node --check stats/app.js
git diff --check
```

Open `http://127.0.0.1:8765/stats/`. No build step is needed.
