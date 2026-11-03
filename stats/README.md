# ResearchGames overview

Static LV/EN overview at `/stats/`, linked from both homepage footers. It reads one precomputed public JSON file containing all three games and all three periods. The browser immediately displays the already loaded snapshot. If sources are older than 15 minutes, missing, or failed, it refreshes only those sources for the selected period in the background.

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

The browser shows its saved snapshot immediately and checks the public file in the background. Data older than 15 minutes or retained after a failed collection is labeled. While the tab is visible, the browser checks the file every five minutes. Refresh reads the latest published file and refreshes stale sources in the background if needed. If the public file is unavailable, `stats/snapshot.json` supplies a fallback for entries newer than the browser snapshot. Source generation timestamps are compared per game and period; an older network or fallback response never overwrites a newer entry. The collector applies the same protection. Retrieval time alone does not make old data fresh. Both files use the same validated format.

To regenerate the tracked fallback locally:

```sh
node stats/scripts/update-snapshot.mjs
```

The shared `SummaryCache.gs` wrapper still caches successful public summaries per period for 300 seconds in Apps Script. Deployed to Livonian version 24 and Riddle Grid version 25; LU107 retains its existing endpoint. This snapshot change does not modify game ingestion or Apps Script deployments.

## LU107 dashboard recovery

The separate LU107 dashboard keeps its period-specific saved data on reload, retries one transient API failure, and retains the newer source timestamp. Switching periods cancels the previous request, preventing late responses from appearing under the wrong filter. Failed background refreshes keep the dashboard visible with a notice. Reload no longer sends `force=1` to bypass the source cache.

## Page visits (2026-11-03)

The overview, website-hosted Riddle Grid dashboard, and Livonian Apps Script dashboard
share `visits-ui.js` and `visits.css`. UL107 is intentionally excluded from visit
collection and display; its gameplay dashboard and historical summary remain unchanged.
The Livonian source is backed up in `games/libiesu-vietvardi/apps-script/Dashboard.html`.
Visits use each dashboard’s existing period selector. The overview links to the
website-hosted Riddle Grid dashboard and the existing Livonian redirect.
The shared assets are loaded from researchgames.eu by the Apps Script HTML.

`visits.js` is the explicit game-page allowlist. GoatCounter normalizes the observed
paths without trailing slashes. Riddle totals include the main and children's game
pages; dashboard, about and other website pages are excluded. These are summed
page visits, not unique people across pages, gameplay starts, or conversions.
Visit counts respond only to the period selector, not research/session filters.

The existing snapshot workflow calls `scripts/update-visits.mjs` using the repository
Actions secret `GOATCOUNTER_API_TOKEN`. Configure a GoatCounter token with only
Read statistics permission for researchgames.goatcounter.com. Never put the token
in source, public JSON, frontend JavaScript, URLs, or logs. Email verification is
required by GoatCounter before API use. Only aggregate counts and reporting dates
are published to `analytics-data/visits.json`; the API response is never saved.

Periods all/90d/30d/7d are collected sequentially below the API rate limit. Rolling
periods include today and the starting calendar day N days ago in Europe/Riga,
matching the existing dashboard date filters (the starting day is included). All-time
requests start in 2000 and cover only history actually retained by GoatCounter;
they do not reconstruct pre-tracking visits. Missing configuration or collection
failures preserve previous counts, period bounds and timestamps with a failure
flag. Missing data displays a dash, never a fabricated zero. Counts older than
20 minutes show a saved-data notice. The browser caches validated data and never
replaces a newer game/period with an older fallback.

Run `node stats/scripts/update-visits.mjs` with the token supplied through the
environment to refresh the bundled fallback. The scheduled collector automatically
publishes the separate visits file without rebuilding the website. The visits
collector is independent of gameplay analytics, so one source failing does not
prevent the other from refreshing. Verify exact allowlisted paths against GoatCounter
when adding or renaming games. Test with `node --test stats/tests/visits.test.mjs`.

Deployment record: GoatCounter email verified and the scoped Read statistics token
stored as the repository Actions secret on 2026-11-03. Livonian dashboard deployment
updated from v24 to **v26**; Riddle Grid dashboard deployment updated from v31 to
**v33**. Existing deployment URLs and access settings were retained. The riddle
receiver deployment was not changed. The legacy Apps Script riddle dashboard keeps
its existing 30-day default; the website dashboard keeps its all-time default.

The shared visits script uses a cache-busting request for the public snapshot,
so a previously cached missing or incomplete first snapshot does not delay recovery.

## Landing-page visits and overview order (2026-11-03)

The joint overview starts with page visits, before gameplay totals and timelines.
A featured ResearchGames landing-page card sums `/` and `/lv`; individual game
cards follow for Riddle Grid, Livonian place names, Muns teirums, and A world
inside a cell. The cell card includes its public preview. UL107 remains excluded.
`VISIT_PAGES` is the collector allowlist; `VISIT_GAMES` contains only games.
Landing visits are never added to a game count. The existing individual dashboards
continue to show only their own game.
