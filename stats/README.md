# ResearchGames.eu overview

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
A featured ResearchGames.eu landing-page card sums `/` and `/lv`; individual game
cards follow for Riddle Grid, Livonian place names, Muns teirums, and A world
inside a cell. The cell card includes its public preview. UL107 remains excluded.
`VISIT_PAGES` is the collector allowlist; `VISIT_GAMES` contains only games.
Landing visits are never added to a game count. The existing individual dashboards
continue to show only their own game.

## Overview sections

The joint dashboard has four numbered sections: page visits, gameplay, game
dashboards, and about the data. Sticky native anchor links at the top navigate to
`#visits`, `#gameplay`, `#game-reports`, and `#about-data`. Both LV and EN labels
are supported. The visits component uses a lower heading level in this overview;
individual dashboards keep their existing heading structure.

## Shared dropdown controls

`dashboard-select.css` and `dashboard-select.js` provide the themed single-select controls used by the overview, LU dashboard and both Apps Script dashboards. The riddle static dashboard receives them through its build script. Keep these shared assets at the same version in each HTML entry point.

The original selects retain their IDs, values and filter listeners. Enhancement starts only after the stylesheet loads; otherwise the native controls remain usable. Dynamic options, disabled states, translated labels and reset buttons synchronize with the visible control. Keyboard support includes arrows, Home/End, text search, Enter/Space to select, Escape to cancel and Tab to leave. Menus use the popover top layer where available, with viewport-clamped positioning as a fallback.

For UI changes, check both themes and languages, period filtering, the riddle version/participation filters, Escape cancellation and narrow viewport placement. Apps Script HTML integrations require redeploying the existing dashboard deployments; do not update telemetry receiver deployments.

## Shared website audience

`/stats/audience.html` is the separate, bilingual audience report linked from the overview visits section. It combines the exact `VISIT_PAGES` allowlist, including the homepage and active games, and excludes analytics pages and UL107. The five independent distributions are countries (`locations`), browser languages (`languages`), screen-width groups (`sizes`), browsers and operating systems. Screen groups follow GoatCounter: up to 600, 601–1000, 1001–1920, over 1920 CSS pixels, plus unknown.

`update-audience.mjs` uses the existing read-statistics secret. It sends the complete comma-separated path allowlist with `path_by_name=true`, validates every page of results, and strips API records to label/key/count only. Requests are spaced and retried once. Failed categories retain their original date range and timestamp independently. The existing workflow publishes `audience.json` to `analytics-data`; `stats/audience.json` is the bundled fallback. No raw visits, IPs, sessions, referrers or individual profiles are exported.

The UI offers all-time, 90-, 30- and 7-day periods with the same Riga date windows as the visits dashboard. Each distribution uses its own sum (including unknown values) as the percentage denominator. The report does not infer device type, native language, unique people, or cross-category combinations. Native filters are enhanced by the shared themed dropdown component. It reads the raw data snapshot automatically every five minutes while visible, retains validated browser cache, and never replaces newer category data with an older fallback.

API reference: https://www.goatcounter.com/api.html and https://www.goatcounter.com/api.json.

Brand naming: always use **ResearchGames.eu** in visible labels, headings, page titles and metadata in both Latvian and English. Logos may split the name across markup, but must render the complete name including `.eu`.

Audience layout: countries and browser languages show the five most frequent values initially; remaining values stay in a collapsed disclosure. Percentages still use the complete category total.

## Page-visit timeline

The top of the overview, directly below the title/period controls and above the section navigation, renders a daily line chart: total, ResearchGames.eu landing page, Mīklu režģis, Lībiešu vietvārdi, Muns teirums and the cell game. Mīklu režģis and Lībiešu vietvārdi retain their gameplay-chart colors. Series order/colors are fixed in `visit-timeline.js` and the scoped `.visit-timeline-panel` CSS. Dark/light themes, LV/EN labels, keyboard day selection and touch inspection use the shared timeline renderer. Each chart has its own help-text ID.

The existing GoatCounter hits requests already ask for daily data. `requestVisitSeries` now validates and combines each exact path’s daily values, retaining only nonzero `{date, visits}` records and the source’s reporting-day bounds. The daily sum must match the visit count. Dates follow GoatCounter’s daily grouping; range filters still use the established Riga start/end times. All-time rendering starts at the first observed visit, rather than the API’s year-2000 query boundary. Bounded periods retain quiet days, including partial reporting boundary days.

Count-only snapshots remain compatible. Missing history or history ending before the latest reporting day does not become a zero line; the total line requires daily data from every included page group. Source failures preserve the previous count and history together. No new API credentials or additional daily-statistics requests are needed. When adding a game, extend the allowlist and the timeline color assignments together.

Timeline readouts keep each figure directly beside its label, including on narrow screens; do not stretch the label column to push figures to the far edge.

Visit curves use broad, rounded highlighter strokes (4 px; total 5 px) at 40% opacity, with dash spacing adjusted to the wider strokes. Selection markers stay restrained; labels and figures stay fully opaque.

The shared gameplay-session chart follows the same highlighter treatment: rounded 4 px strokes at 40% opacity, spaced dash patterns, and small selection markers.

## Overview text size (A+)

The main overview header offers A+ with three sizes: normal (100%), enlarged (118%) and large (135%). Radio controls work with keyboard arrows; Escape or clicking outside closes the native popover. The selection is stored locally as `rg-dashboard-text-size` and restored before rendering. Both LV and EN labels, graph axis text, readouts, cards and dropdown options scale through `--rg-text-scale`; shared styles default to 1 elsewhere. Text scaling does not change chart data or line thickness. Keep the enlarged mobile layout free from horizontal overflow.

The shared overview opens with the last 7 days selected by default for visits, gameplay and totals.


## Latgalian plant-name series

`latgalian.html` uses the shared stylesheet, accessible dropdowns and timeline
renderer. It has LV/EN, dark/light, persistent 100/118/135% reading sizes, section
shortcuts and a default 7-day period. It currently covers Muns teirums; page visits
stay independent of the gameplay size/mode filters. The shared overview links to
this report without adding aggregate events to its differently defined session
counts. Scores and durations are not collected in this event-based implementation.

`latgalian-model.js` defines the explicit game/variant/action allowlist and strips
all other fields. `scripts/update-latgalian.mjs` uses the existing read-statistics
GoatCounter secret, requests exact event paths and publishes only counts per day
and variant to `analytics-data/latgalian.json`. It reuses the verified daily hit
parser with `expectedEvent:true`; page-visit requests still reject events. A failed
period retains its last successful timestamp and receives `failed:true`. A cold
failure is unavailable, never zero. The bundled JSON starts with no periods until
the first real collection. Five-minute Actions/frontend refreshes maintain it.

Event counters are not linked sessions. Finish and start may occur in different
periods; no completion percentage or inferred abandonment is shown. Direct skips
can occur without a start. GoatCounter blocking/offline use may undercount. Tracking
starts with the 2026-11-03 release, not when the game was originally published.

Adding another series game requires its event instrumentation, a PLANT_GAMES entry,
its visit allowlist entry, and dashboard game/card/visit configuration. Keep event
names versioned and add schema tests before extending variants. For more detailed
research (scores, duration, per-plant errors), add a separate explicit schema and
storage design; do not encode individual results in GoatCounter event paths.

The partner-facing `/games/muns-teirums/stats/` now serves the dashboard directly,
keeping its URL in the address bar. Regenerate it after template changes with
`node stats/scripts/build-latgalian-page.mjs`. Both routes load the same modules,
styles and snapshots; audience links use absolute paths.


## Time zone — Europe/Riga (2026-11-04)

All dashboard timestamps use Europe/Riga, regardless of the viewer's operating
system/browser time zone or LV/EN language. The shared `time.js` formatter handles
winter/summer offsets. The shared overview, visits, audience, Muns/Mums teirums
report and archived LU107 report use this formatter. Riddle snapshot aggregation
and formatted comments already explicitly use Europe/Riga. Calendar-only timeline
keys are not instants; render their existing date without shifting to another day.
Keep ISO timestamps in JSON/records as UTC instants for unambiguous sorting.

The GoatCounter API uses the API token owner's time-zone preference for its daily
hit series. On 2026-11-04 that existing user's preference was changed from UTC to
Europe/Riga, retaining all other settings. Keep this preference if tokens are
rotated. Scheduled visit and plant-event snapshots refresh the day grouping;
previous saved snapshots retain their original retrieval timestamps. Audience
technology/distribution aggregates have the source API's own UTC-based granularity;
our filter bounds and displayed retrieval timestamps use Riga. Do not fabricate a
local-day redistribution from already aggregated audience categories.

The Livonian Apps Script template explicitly formats its update instant in Riga.
Its chart rows are calendar dates, represented as local calendar placeholders for
Google Charts; do not interpret those placeholders as stored event timestamps.
Tests cover midnight, summer/winter transition, and rendering from foreign host
zones. Existing Riga period-boundary tests remain in `tests/visits.test.mjs`.


Livonian dashboard deployment **v29**, 2026-11-04: Riga update timestamps and current
shared visits module. Existing deployment ID, execute-as owner, and public access
are unchanged. The live project time zone was verified as Riga. Public deployed
HTML was read back and matched the committed template exactly. All 100 dashboard,
snapshot, riddle and plant-game checks passed. Bundled GoatCounter visit and plant
fallbacks were refreshed from successful post-change collections, with the last
reporting day verified as 2026-11-04 in Riga.
