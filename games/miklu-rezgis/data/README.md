# Static data delivery

Google Sheets remains the editing and collection system. The game reads static
`riddles.json`; the detailed dashboard reads `miklu-dashboard.json`. Neither
visitor-facing read path calls Sheets or Apps Script. Game submissions retain the
existing durable local queue and Apps Script receiver.

## Refresh and publication

The existing `.github/workflows/analytics-snapshot.yml` workflow refreshes analytics
on a five-minute target schedule. Riddle content is checked only when 24 hours have
elapsed since the last successful check, on relevant main-branch changes, or when
manually dispatched with “Refresh riddle content now” enabled (the default).
`riddles-refresh.json` on the data branch records successful checks separately from
content timestamps, so unchanged content does not cause repeated Sheets requests.
A failed check keeps the previous file and is retried on the next workflow run.
GitHub schedules can be delayed;
this is not a real-time delivery promise. Files are published on the existing
`analytics-data` branch without rebuilding the website. Each page has a bundled
last-valid copy; the dashboard also caches the newest model in the browser.
The game tries the static published file for at most four seconds, then the bundled
copy or a newer saved copy, finally its existing built-in emergency data. Files
can use ordinary HTTP caching. Data collection failures and older responses keep
the previous valid version. Content must have unique IDs and all ten levels.

The detailed dashboard updates visible data every five minutes and filters locally.
The displayed update time belongs to the data, not the page load. Failed refreshes
and snapshots older than 20 minutes show a saved-data notice. Its local filters
use calendar dates in Europe/Riga, including the partial first day of each period.
This avoids publishing exact session timestamps. Text submission timestamps remain
as already displayed in the public dashboard.

## Public model

Only grouped cohorts, aggregate statistics per riddle, and the already-public
comments, variants and player questions are exported. Cohorts group sessions with
the same public dimensions and evaluation-facet/date membership; weighted totals
preserve session counts under combined filters. Original session, response,
question and device IDs, raw answer records, and raw per-session timings are not
published. Text is escaped by the existing dashboard renderers. Public free text
should continue to follow the project's existing moderation policy.

## Maintenance

- `node games/miklu-rezgis/scripts/update-data.mjs` refreshes bundled copies.
- `node games/miklu-rezgis/scripts/build-dashboard.mjs` regenerates the static
  dashboard from `apps-script/Dashboard.html` and mirrors the shared model to GAS.
- Live `mīklu-dashboard.gs` is the concatenation of the repository's
  `mīklu-dashboard.gs`, `SnapshotModel.gs`, and `SnapshotExport.gs`, in that order.
  Do not also add duplicate copies as separate files.
- Apps Script deployment v31 adds `?resource=dashboard-snapshot`; the existing
  receiver deployment stays v26. Legacy HTML and aggregate summary endpoints remain.
- `node --test games/miklu-rezgis/tests/*.test.mjs stats/tests/*.test.mjs` verifies
  legacy parity, combined filters, privacy projection, CSV validation, recovery,
  stale versions and existing submission/summary contracts.
