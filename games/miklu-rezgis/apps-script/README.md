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
  and submission period, including the existing version/participation filters.
- `Dashboard.html`: displays “Jautājumi pētniekiem” (EN: “Questions for researchers”)
  below the riddle-response count.

Both existing deployments were updated to version **26** on 2026-10-29:

- Receiver: deployment `AKfycbyAv7G_yZte1RBtUIa6zVdDqGPtBd6y9BOMnG2QOFrv3CAFB1SEOd6_PNx8SNTHv-Yi` (previously v3).
- Dashboard: deployment `AKfycbwzomHmovON2lQiPP2xa40FRCDFXJ38ofD8YDKB63SBrQHBMB2HKaCBDM_bBmgXsLkD` (previously v25).

URLs and access settings are unchanged. Free-text questions stay in the Google
spreadsheet; the dashboard returns only a count. The public `/stats/` summary
keeps its existing explicit whitelist and does not publish question text.

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
