# Shared colour policy

Both themes share semantic colour roles. The dark theme preserves the original midnight blue surfaces, violet accents and mint feedback. The light theme uses white surfaces and dark petrol text for contrast.

| Role | Light | Dark |
| --- | --- | --- |
| Page background | `#FFFFFF` | `#0A0D18` |
| Main surface | `#FFFFFF` | `#12162A` |
| Secondary surface | `#FFFFFF` | `#171C33` |
| Main text | `#153640` | `#F3F1FA` |
| Supporting text | `#435F6A` | `#8B93B0` |
| Selection, focus, links, progress | `#6541AE` | `#8B6BFF` |
| Map option hover, with white text | `#6741B0` | `#6D5CE8` |
| Correct answer / discovered place | `#157052` | `#3ED598` |
| Incorrect answer | `#B83E38` | `#F2665B` |

## Rules

- Result metrics share one neutral surface, one text colour and neutral icons. A score, time or record does not get a separate decorative colour.
- Violet marks available actions, focus and selection. Both word columns use violet when selected. Primary buttons use a translucent violet wash, a clear outline and a quiet glow. Any gradient stays within this single accent hue. Text keeps the theme’s high-contrast ink colour.
- Green is reserved for positive feedback and completed discoveries. Red is reserved for mistakes. Check marks, feedback text and marker state accompany these colours.
- Map labels are neutral ink badges in both themes. Places use larger circular markers with a translucent fill and soft halo, with no outline; violet and green carry discovery status. Marker size separates game places from the basemap city dots. Basemaps are neutral grey, preserving the same quiet cartographic background in both themes.
- The map quiz keeps all base-map labels hidden in both themes. Discovered names appear only in the final summary overlays.
- There are no independent blue, yellow or orange metric accents. Existing legacy variable names alias the shared semantic tokens.
- Theme values live at the top of `style.css`. Component rules consume tokens and are shared by both themes.

## Contrast checks

`tests/palette-contrast.test.mjs` checks both themes: primary, supporting and secondary text have at least 4.5:1 contrast on the page and card surfaces; action text, feedback text and map label text also meet 4.5:1; interactive outlines have at least 3:1 contrast with their surface.
