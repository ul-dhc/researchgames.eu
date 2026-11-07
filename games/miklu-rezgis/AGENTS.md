# Mīklu režģis: interface icons

- Use only official Lucide icons for interface controls, navigation, feedback,
  progress, rewards and result views, including the child game and dashboard.
- Do not draw substitute SVG icons or use emoji / Unicode glyphs as icons.
  Ordinary text controls such as A+, mathematical notation, and punctuation are text.
- Preserve the actual game and partner logos as brand assets; they are not UI icons.
  Confetti, the letter grid and other game graphics are also not icon substitutes.
- Canonical Lucide SVGs and the pinned version live in `assets/lucide/`.
  `manifest.json` maps the existing symbol IDs to official icon names.
- To add an icon, vendor its unchanged SVG from the pinned official package,
  retain the license, and add its mapping to the manifest. Never edit icon geometry.
- Run `node games/miklu-rezgis/scripts/build-icons.mjs`, then
  `node games/miklu-rezgis/scripts/build-dashboard.mjs` to regenerate the sprites
  and dashboard. Verify with the game tests before delivering changes.

# Typography

Use en dashes (–), never em dashes, in interface copy and authored documentation.

# Release approval

The user explicitly approved publishing “Bez režģa” on 2026-11-07 after local
iteration. Publish the tested version with count-based common-letter help,
missing-letter completion, the new help-based scoring and compact About copy.
Preserve the existing grid modes and their scoring.

# Points vocabulary

Do not use payment language (such as “bez maksas”, “maksa”, “maksāt”, or
“nemaksā”) in authored game UI copy. Describe points being awarded or deducted
explicitly instead.
