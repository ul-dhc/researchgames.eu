# Direct Tēzaurs TEI migration QA

Version crossword-tei-2026_4-v1. HTTP entry at stable port 8775 returned 200 and exactly matched the final local build: 1,389,171 bytes, SHA-256 `5b3d774f0f7e569d3da07bee2953a113f1d8613126b79ba1fe651bc374a64cff`. Existing loopback server PID 86060 was retained. A separate review origin at port 8780 serves the same verified bytes; no existing user tab was operated or reloaded.

## Source evidence

The official TEI XML checksum matched `eb4cb16e1412c1462b68f3c3be516c46d9bc07905758e85fe967d475e28afd86`. All 327 records mapped uniquely by direct entry lemma plus a sense's direct synset ref, using xml:id or target, and were checked against direct def itertext. Definitions were not normalized, paraphrased or invented. Results: 306 unchanged, 21 changed, zero missing/ambiguous/quarantined. The 21 differences and TEI IDs/checksums are exported to CSV/crosswalk. Four specified editorial concerns carry explicit provisional flags. Importer --check reproduced the bank, crosswalk, CSV, report, quarantine file and TEI content key byte-exactly. Independent TEI tests passed 3,279 assertions.

The Latvian About section was expanded and inspected in actual Chrome. It gives exact release 2026_4 / Autumn 2026, issue date, publisher, official source, license, complete source totals versus selected 327, verbatim extraction, preliminary AI-assisted editorial status and historical WordNet saves. Both LMF and TEI are explicitly the same release. WordNet is retained as compatibility and historical provenance, not the main new-game source label.

## Rules, grids and saves

All 81 unchanged grids passed 9,798 assertions. The original core suite passed 984 assertions. Runtime save integration passed 195 assertions over all 27 historical sets, including old values, hints, active word, set, round, mode and score; original clue retention; reload; new-set TEI source; fresh TEI saves; and rejection of unknown source versions. Generated JavaScript passed Node syntax parsing. Portable and working-project builds matched exactly.

The original and historical tier HTML capsules are byte-exact. Original v10 storage remains separate and untouched. Tier schema/key and frozen save/grid identity stay unchanged; sessions without sourceVersion use the original bank, and newly created sessions use TEI. Full current TEI bank/grid integrity has a separate verified identity. Answers, IDs, grid bytes, provisional difficulty, scoring and CSS are unchanged.

## Actual browser checks

Only newly created tabs on isolated origins 8780 and 8781 were used. In a fresh TEI points game, SĀKUMS completed automatically; a hint on DATORS survived refresh with selection/partial input. Completing DATORS produced 175 points, and refresh retained both answers and score. The source label explicitly says Tēzaurs TEI. No error/warning console entries were reported in the inspected log. A desktop screenshot was visually inspected, including compact clue/input and About placement.

For real upgrade testing on disposable port 8781, the old tier HTML first created a save through UI: ODS solved, OTA selected with one hint, partial OT, score 100. After replacing only that fixture's HTTP document with the TEI app and refreshing that test tab, the selected original WordNet clue, partial letters, hint, solved word and 100 points remained. It displayed the historical WordNet source label. No user save was copied or inspected. Both ?legacy=wordnet and ?legacy=1 rendered the retained historical games in new QA tabs.

## Preservation and limits

Full working-project and local repository rollbacks were CRC-checked before installation. Source guards confirmed affected original files and all 24 repository files matched their preserved versions before replacement. Only the authorized local games/uzmini-vardu folder was synchronized. No push, publication, analytics, installation, user-tab refresh, homepage/catalog edit or network-project change was performed.

Human editorial review, child testing, unique-answer proof, physical phone keyboard/touch validation and exhaustive accessibility review remain pending. The leakage guard detects exact answer tokens, not all possible linguistic hints. Short synonym and specialist clues remain verbatim and flagged. Old sessions intentionally retain old source clues until a new set is created. Concurrent old/new tabs still share the same origin's tier save and can overwrite one another as before; actual user state was not inspected. The added provenance text was checked on desktop; previous narrow-layout evidence is historical, not a new physical-device test.
