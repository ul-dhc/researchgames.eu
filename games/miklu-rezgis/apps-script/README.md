# Player questions — 2026-10-29

The final results screen asks all main-game participants what they would like to
learn about riddles. It is optional and independent of the game-rating survey and
the per-riddle research questions. The separate `berniem/` game is unchanged.

## Data flow

The existing durable browser queue sends `record_type: session_question` to the
existing game receiver. `question_id` is `<session_id>-question`: retries are
idempotent and never create another response. The UI confirms delivery only after
the server acknowledges the batch; failed requests remain queued locally. Blank
questions are not sent; both client and receiver limit text to 1000 characters.
The receiver uses the existing script lock and formula-safe cell normalization.

Google spreadsheet: [miklu-rezgis-data](https://docs.google.com/spreadsheets/d/1P4vS-YtPka5V3l4W8Jlro5jFiF-Y6wjmzsLJYqb9Qpk/edit#gid=20261029).
New sheet: `player_questions` (sheet ID `20261029`), columns A:H:

| Column | Field | Meaning |
| --- | --- | --- |
| A | question_id | Stable response ID for retry deduplication |
| B | session_id | Link to existing session; does not create a new session |
| C | submitted_at | Submission time, stored as a date, Europe/Riga spreadsheet timezone |
| D | game_version | 10, 50, 100, daily or party |
| E | participation_type | player, research or party |
| F | question_text | Optional free-text question |
| G | app_version | Client version |
| H | data_schema_version | Record schema version |

The original `sessions` and `evaluations` schemas and the riddle source dataset
are unchanged. A question does not mark game-rating feedback as submitted.

## Apps Script source and deployment

Project: [mīklu dati](https://script.google.com/home/projects/1QRlAuJ8QrZiNpINYR8_LGpVrem35bKAKNjwgAHh18hTOxoeDsmWZy5mw/edit).

These files capture the updated live source. `PlayerQuestions.gs` is maintained
separately here, but its contents were appended to `Code.gs` in the live project.
When syncing files, either concatenate those two files or use them as separate
Apps Script files; do not include the helper code twice.

- `Code.gs`: existing receiver with `session_question` routing in `processRecord_`.
- `PlayerQuestions.gs`: question validation/storage and aggregate counting.
- `mīklu-dashboard.gs`: adds `metrics.playerQuestions`, using the selected sessions
  and submission period, including the existing version/participation filters,
  and returns `playerQuestions` with date, version, participation type and text.
- `Dashboard.html`: displays the count and a separate “Iesniegtie jautājumi par
  mīklām” section. All matching questions are shown newest first in a scrollable
  list. The text is HTML-escaped, preserves line breaks and wraps long words;
  session IDs are not included in the list. Both LV and EN labels are supported.

Both existing deployments were updated to version **26** on 2026-10-29:

- Receiver: deployment `AKfycbyAv7G_yZte1RBtUIa6zVdDqGPtBd6y9BOMnG2QOFrv3CAFB1SEOd6_PNx8SNTHv-Yi` (previously v3).
- Dashboard: deployment `AKfycbwzomHmovON2lQiPP2xa40FRCDFXJ38ofD8YDKB63SBrQHBMB2HKaCBDM_bBmgXsLkD` (previously v25).

The dashboard was updated to version **27** on 2026-10-29 after explicit approval
to show submitted question text and metadata on the existing public dashboard.
The receiver stays on v26 and does not require an update.

Dashboard version **28** (2026-10-29) shortens timeline date labels and rotates
them 45 degrees, with label density adapted to chart width. Full dates remain in
tooltips; labels include the year when the period spans more than one year.

Dashboard version **29** (2026-10-29) puts each donut percentage directly beside
its category name, colour and count in the legend at every width. Ambiguous
external leader lines are removed. Flat segment caps and exact arc lengths avoid
overlapping or inflating tiny response categories. Clicking segments or legend
entries still applies the corresponding filter.
Keep the existing `SummaryCache.gs` file when updating the project.

URLs and access settings are unchanged. The connected research dashboard is public
and displays submitted questions, like its existing comments and variants.
The separate `/stats/` overview keeps its explicit aggregate whitelist; its backend
also requests `includeQuestions: false` and does not retrieve question text.

## Verification

From the repository root:

```sh
node --test games/miklu-rezgis/tests/*.test.mjs
node --check games/miklu-rezgis/js/app.js
git diff --check
```

Browser checks covered the player result screen, independent submission, the
research path, and unchanged game-rating access. A real receiver smoke test sent
the same diagnostic question twice in one batch: the server returned `created`
then `unchanged`; connector readback confirmed one row with the expected columns.
The diagnostic row was cleared after verification. No test sessions were added
to production gameplay analytics. The live dashboard loaded the new count.

The question-list tests cover filters, date ordering, more than twelve questions,
missing/empty data, HTML escaping, language labels and the aggregate-only overview.
