# Uzmini vārdu – direct Tēzaurs TEI continuation

Version: **crossword-tei-2026_4-v1**. Latvian interface. Portable repository source.

Ready-to-serve entry: index.html. Edit src/runtime.js, src/tier-core.js, src/interface.html and src/styles.css. src/game.js is generated. Python 3.9+ and existing Node suffice.

```sh
python3 scripts/build.py
```

This atomically replaces index.html. All assets are embedded; the folder works under games/uzmini-vardu/ without root-relative assets. No homepage/catalog/deployment change or analytics is included. Do not test with an actual user save. Publish only with explicit authorization.

## Direct source import and checks

The official Tēzaurs.lv 2026 Autumn TEI contains 415,514 entries, 460,398 lexemes and 540,011 senses. The selected game bank has 327 records. The importer maps all 327 uniquely using lemma and explicit sense synset refs: 306 definitions unchanged, 21 changed. See PROVENANCE.md, data/tei-import-report.json, data/tei-crosswalk.json and data/tei-definition-changes.csv. The full XML remains outside this game folder.

```sh
python3 scripts/import_tei.py --tei /path/to/tezaurs_2026_4_tei.xml --check
python3 tests/test_tei.py --tei /path/to/tezaurs_2026_4_tei.xml
python3 tests/validate_rounds.py
node tests/test_core.cjs
node tests/test_tei_saves.cjs
```

Omit --check only for deliberate re-extraction. scripts/extract_bank.py invokes the same direct TEI importer and requires --tei. It no longer extracts the LMF bank. Do not regenerate grids for a clue-only migration. All 81 grids, answers, IDs and tiers remain unchanged. There are 8/11/8 finite sets with 21 distinct words per set; the expert bank contains 38 records. Source-backed same-length alternative handling and scoring are unchanged. No human or child validation or unique-answer proof is claimed.

## Existing saves and historical sources

The original v10 ?legacy=1 game and rg-wordnet-crosswords-levels-v1 key remain untouched. The exact pre-TEI tier game is available at ?legacy=wordnet. Historical HTML and banks are retained byte-exactly.

The current tier key rg-wordnet-crosswords-tiers-v1, schema 1 and frozen compatibility identity are retained because answers and grids did not change. Existing sessions with no sourceVersion use the frozen WordNet bank throughout their three rounds. New sessions/sets have sourceVersion tei-2026_4 and use direct TEI definitions. Existing values, hints, selection, round, mode, set index and scores remain intact. The current source is shown below each clue. A reset repeats the same session source; completing a set and choosing a new one uses TEI. Switching tier/mode preserves independent sessions. Unknown source versions are rejected. data/content-key.txt is the frozen save/grid identity; data/tei-content-key.txt independently pins the full current TEI bank plus unchanged grids. Both are checked at build time.

No actual user save was read or changed during migration. An existing open tab continues its old code until the user reloads. Different hosts, ports and browser profiles have separate saves. Concurrent old and new tabs on one origin can overwrite the same tier save using their own in-memory state, as before; finish or close the old tab before continuing the same save elsewhere.

## Rollback and evidence

The exact original and historical games remain in snapshots/ and data/. Complete local working-project and repository rollbacks are retained outside this folder. See TEI-QA.md and VALIDATION.json for recorded checks. Test scripts write ignored local result files. No network project was modified.
