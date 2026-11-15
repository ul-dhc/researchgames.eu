# Source and attribution

Current source: Dictionary and Thesaurus of Latvian, Tēzaurs.lv 2026 (Autumn Edition), release 2026_4. Issued 2026-09-23. Andrejs Spektors et al., publisher AiLab IMCS UL. Definitions come directly from selected word senses in TEI/XML, without paraphrase or invented additions.

- [Official release and download](https://repository.clarin.lv/repository/xmlui/handle/20.500.12574/162)
- [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) – dataset and adaptation attribution retained.

TEI XML: tezaurs_2026_4_tei.xml, 405,430,287 bytes, SHA-256 `eb4cb16e1412c1462b68f3c3be516c46d9bc07905758e85fe967d475e28afd86`.
ZIP: 45,249,477 bytes, SHA-256 `c5b8810d0f5bc99c50d36b66b54ac64ad2a6fc4ba28234bfd6a1d41a25b158e8`, official MD5 `40668c6d4492b0cf324662937dca9e95`.
The TEI header reports 415,514 dictionary entries, 460,398 lexemes and 540,011 senses. Entries are not a count of distinct words. The game uses 327 selected records: B94, I195, E38.

The importer matches direct entry form/orth lemmas, then requires exactly one sense with a direct synset ref matching the previous selection. It accepts xml:id or target. It takes only that sense's direct def itertext, preserving the exact text. No subsense definitions are merged. TEI entry/sense IDs, source checksum and release are recorded. The mapping is 327 unique records, 306 verbatim unchanged and 21 changed, zero missing/ambiguous/quarantined. See data/tei-crosswalk.json and data/tei-definition-changes.csv. Ambiguous mappings, non-unique direct definitions and exact canonical-answer token leakage stop the importer and are reported in data/tei-quarantine.json. This token test is not a full linguistic review.

Short synonym clues for krāns, mājvieta and miers, and the specialist/historical faktors sense, carry explicit provisional editorial flags. They were not expanded, substituted or removed. Selection and difficulty are provisional AI-assisted editorial selection. Human review, child testing and proof of unique answers remain pending.

The prior WordNet LMF is also release 2026_4. It supplies synset definitions rather than the TEI word-sense definitions. It is not an older release. Its exact bank remains in data/wordnet-bank-v1.json; lexical IDs, co-members and alternatives remain compatibility/crosswalk metadata. Record IDs retain their historical spelling as opaque grid references. All answers, IDs, provisional tiers and grid bytes are unchanged.

Historical LMF XML SHA-256: `8d05a225bc054680241ac2f7e19dbfb20dec9973d66fe24495396bf66e89bbc7`. [Paikens et al. (2023), Latvian WordNet](https://doi.org/10.18653/v1/2023.gwc-1.23) attribution remains for historical content. Exact historical HTML capsules retain original explanations, source links and licenses. The embedded ResearchGames logo remains unchanged.

No full XML, actual user save, credential, analytics or runtime log is required in the portable game folder. Obtain the official XML separately to reproduce extraction; building existing extracted data is offline.
