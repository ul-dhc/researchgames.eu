# ResearchGames.eu

## Page-view analytics

The English and Latvian homepages and the public game, collection, information,
and statistics pages use the same GoatCounter site:
<https://researchgames.goatcounter.com/>.

When adding a public HTML page, include this once in its `<head>`:

```html
<script data-goatcounter="https://researchgames.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
```

GoatCounter uses the canonical URL when present, otherwise the current page path
and query string. Give each page its own canonical URL; do not reuse the homepage
URL. This counts page visits, while the existing game analytics record gameplay.

Redirect-only pages, error pages, and the experimental `sky/` pages are excluded.
Statistics pages containing an iframe count the outer ResearchGames page visit;
they do not add tracking to the external iframe content.

After publishing, visit a game page and check its path in the GoatCounter
dashboard. Ad blockers can prevent tracking, and localhost visits are ignored by
default. No dashboard embedding or access token is needed for page tracking.

Documentation: <https://www.goatcounter.com/help/start> and
<https://www.goatcounter.com/help/js>.
