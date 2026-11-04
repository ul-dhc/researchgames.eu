# Lībiešu vietvārdu spēle


## Data receiver repair – 2026-09-25

The game posts to the bound Apps Script project `1bK6md4ruItdMoOKWEF012GS8I3lBwtCcybKHR9dusjq1ESOVwFlMsWHw`, deployment `AKfycbzZJv4C-LK3cMy-ejINa4Di-Orr37jfLYed2pxw8CnZOneu8H72wJ3okuyd72Xu07FzAg`.

Version 3 rejected incoming sessions when the Games sheet had used columns beyond the 30 game fields, even though those 30 headers were correct. Live diagnostics returned `The header row in the "Games" sheet does not match HEADERS.` The dashboard itself correctly read the stored data, whose latest activity was 2026-07-26.

Receiver version 4 was deployed on 2026-09-25. It validates only the game-owned header prefix and leaves extra columns intact. `apps-script/receiver-sheet.gs` records the replacement helper; all other receiver code is unchanged. A no-write diagnostic request now passes header validation and reaches the expected `Unknown action` response. No synthetic sessions were inserted. Previously rejected payloads are not stored in the sheet and cannot be recovered from dashboard aggregates.

Validation: `node --test games/libiesu-vietvardi/tests/*.test.mjs`.

## Short variants – 2026-10-29

The start screen offers the long game, quick and medium games, and the map game. Direct links:

- `?mode=five` (Ātrā spēle / Quick game): one round, five places randomly sampled without replacement, one from each source difficulty level. The map appears only after all five matches. Replay draws a new sample.
- `?mode=ten` (Vidējā spēle / Medium game): two rounds of five places with increasing difficulty. Round one samples two places from level 1, two from level 2 and one from level 3; round two samples two from level 4 and three from level 5. Names remain random and never repeat within a session. Rounds advance automatically; progress counts all ten places. The final map, score, accuracy and replay appear after all ten matches.
- `?mode=map` (Atrodi kartē / Find on the map): five questions, one randomly selected target per difficulty level. Each question displays only the Livonian name and five clickable points labelled A–E. Wrong guesses identify the selected place and allow another attempt; correct guesses reveal the Livonian/Latvian pair and enable the next question. The final map shows all five discovered targets.
- The former `?mode=coast` URL redirects to `?mode=map`. The coastline option has been removed from the menu.
- No mode query (or `?mode=full`): the long game: five rounds, each sampling five places without replacement from that difficulty pool (25 total). `?mode=long` is also accepted.

The short variants support Latvian and English (`#en`), the existing themes and text sizes, and separate browser-local best scores. Short games use match points and accuracy without the full game's time bonus. They finish directly at the final map and replay controls, without the full game's research questionnaire. They do not post to the existing 53-place research receiver; analytics for variants would need a separately defined schema.

Selection logic lives in `mode-plans.js`; source difficulty levels and place IDs remain unchanged. Run `node --test games/libiesu-vietvardi/tests/*.test.mjs` from the repository root.


### Archived coastal path helpers

The former coastal mode is no longer offered. Its data and helper tests remain available for reference.

`coast-roads.js` caches seven connected coastal path legs, built from the public OpenStreetMap road/path graph on 2026-10-29. Data © OpenStreetMap contributors, ODbL. Two source API boxes are retained in the metadata. The route prefers small tracks and village roads near the coast over beach paths, excludes P roads and penalises routes inland; all seven selected legs have zero metres on the P124/P131 main roads. Way IDs are retained for verification. Private/no-access ways and nodes are excluded unless explicit foot access permits passage. Geometry uses actual connected OSM nodes, without straight-line or beach shortcuts.

For this variant, village centres come from the mapped OSM settlement nodes (IDs retained in `stops[].placeNodeId`) and are snapped to the path network. This corrects misplaced original points, particularly Pitrags, that would otherwise cause detours. Source language/place data is unchanged. Gameplay requires no live routing request or API key.

`road-journey.js` joins cached legs in either direction, measures cumulative distance and samples by distance for smooth travel. The camera approaches zoom 14, follows the traveller, and the new road trace remains. Road legs take 5.5–11 seconds plus the camera approach; the first discovery is a shorter introduction. Restart cancels travel and prevents stale arrival callbacks. The existing reduced-motion preference skips animation.

The final screen offers the complete walking route in Google Maps, plus two overlapping sections (Miķeļtornis–Pitrags and Pitrags–Kolka) for mobile browsers. The overlap preserves the full route while keeping each section within three intermediate stops, following [Google Maps URL documentation](https://developers.google.com/maps/documentation/urls/get-started#directions). Google Maps calculates its own current walking route through these stops; its exact roads may differ from the cached game geometry.

Rebuild the cache with `python3 scripts/build-coast-route.py SOURCE.json [OUTPUT.js]`, where `SOURCE.json` merges the OSM API map JSON from the two source boxes. Raw map downloads are not committed.

## Summary map label visibility – 2026-11-03

Summary labels reserve clearance around every visible place marker, including markers whose labels have not yet been placed. Text boxes are measured from the actual map DOM, so font loading, responsive styling and the larger-text preference are respected. The map reflows labels after zoom, resize and text-size changes. Labels fade in at their final positions; arrival animations no longer slide across markers. Map controls are protected too. If a label cannot fit safely, its point remains visible with a hover tooltip.

`map-label-layout.js` contains the shared geometry logic. Regression tests cover the reported Sabile/Piltene/Puze/Ēvaži/Cēsis set, clustered five- and ten-place sets, normal/large text dimensions, narrow maps and map control clearance.


## Map quiz – 2026-11-03

The map game uses the existing theme, active timer, per-mode best score and final results. Each correct answer earns 10 points; a wrong guess costs 2 points with a floor of zero. Repeated guesses at the same point and repeated clicks after solving do not change the result. Answers use native buttons inside Leaflet markers and support keyboard activation. The next-question button remains accessible at the bottom of the screen on phones.

`createMapChoices` in `mode-plans.js` samples distractors without duplication, preferring geographically separated places so points remain easy to select. Place names are not shown on the choices until the player has made a guess. The map quiz does not submit sessions to the existing full-game research receiver.

## Shared colour policy and map labels

Both themes follow [PALETTE.md](PALETTE.md). Surfaces and text share a petrol neutral family; violet marks actions and selection, green means correct/discovered, and red means incorrect. All result metrics use the same neutral card styling. Component rules are shared across themes, with theme-specific values defined in CSS tokens. Automated checks verify text and control contrast in both themes.

`map-basemaps.js` selects neutral CARTO Positron and Dark Matter basemaps. The map quiz uses the label-free version in both themes, so geographic names cannot reveal answers after zooming or a theme change. Summary overlays show the discovered names. Other modes retain base-map labels. Changing modes refreshes the tiles immediately.

## Scoring audit – 2026-11-03

`score-rules.js` is shared by the browser and scoring tests. Each correct answer earns 10; errors deduct up to 2 without taking the total below zero. Accuracy counts every checked answer, including mistakes at zero. Best scores are separate for each mode; the 25-place long game uses its own key rather than the previous 53-place record.

Only the long game retains the time adjustment: target 330 seconds, 1.5 points per second saved or exceeded, rounded to a whole point, capped at +180 / -120, with a nonnegative final total. Perfect maxima: quick 50, medium 100, map 50, long 250 plus up to 180 (430). Timers stop on the last correct answer, excluding the completion animation and result-screen pauses. The final note reports the effective adjustment after the zero floor. Optional research answers do not affect scoring; their target is drawn from the played fourth/fifth rounds.

The bilingual About page describes all four modes, random selection, increasing difficulty, map choices, scoring limits, pauses, separate records and which modes submit research sessions. Its colours and return button use the shared theme styles.

Browser validation in an isolated local preview (research submission disabled): long game with one error per round finished at 422 points / 83%; quick game with two errors at 48 / 71%; perfect medium game at 100 / 100%; map game with one error per question at 42 / 50%. Short/map results showed no time bonus. The long-game timer remained unchanged throughout each completion animation. About was checked in Latvian and English, including returning to the selected variant. All 32 tests pass.

## Three text sizes – 2026-11-03

The game toolbar offers A, A+ and A++ (`normal`, `large`, `xlarge`). The selection is shared across game screens and saved in the browser. Larger text changes typography, not marker or map dimensions. On desktop the start map has its own viewport-based height instead of stretching with the text column. Font changes no longer refit its bounds; a single bounds calculation handles actual map-container resizes.

Browser checks for both quick and long start screens: all three levels retained identical 740 × 550 map dimensions, marker paths and tile coordinates; text increased from 16 to 18 to 20.88 px. No horizontal overflow occurred. A++ persisted after reload, with the map unchanged.

## Partner logos – 2026-11-03

The About footer keeps the Livonian Institute, Faculty of Humanities, Digital Humanities Centre and ResearchGames logos in two rows: ResearchGames centred above the Livonian Institute, Digital Humanities Centre and Faculty of Humanities, with reduced institute/RG widths. The faculty logo switches between native Latvian and English artwork and the light/dark versions. Faculty assets are from the existing local HZF logo bundle; official source: https://www.hzf.lu.lv/en/about-us/the-faculty-of-humanities-brand/.

The Digital Humanities Centre logo also switches between Latvian/English and black/white native artwork. Assets are copied from the existing local ludhc.lu.lv project. Both languages and both themes were checked in the browser; all four logos load in the two-row arrangement.

## Winter map and responsive shell (2026-11-04)

The public entry point now defaults to the long game. MapTiler Winter and Winter Dark replace the CARTO layers in the running app; the legacy basemap helper and tests remain for reference. Place-name symbols and transport layers are hidden in both Winter styles. The browser token in `map-config.js` is intentionally public and must be restricted to the website origins in the MapTiler console.

The continuous map extends beneath the translucent header and footer. Correct-answer text and discovered markers have separate contrast tokens. Long-game instructions and all five difficulty levels remain visible on desktop; phones initially collapse them into one native disclosure. The landing camera reserves the space above that guide. Restart and exit actions use a native HTML dialog styled for both themes, with Escape, focus restoration and a paused active timer.

The running assets are `map-background.css`, `mode-layout.css`, `palette.css`, `responsive-layout.css`, `winter-basemap.js`, `game-confirm.js`, `mode-icons.js`, `shell-map-background.js` and `guide-disclosure.js`. Prototype and QA pages are excluded from publication.
