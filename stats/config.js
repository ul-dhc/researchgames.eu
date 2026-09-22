// Each existing Apps Script dashboard serves its own aggregated JSON at
// ?resource=stats&period=all|30d|7d. No separate aggregation service is needed.
export const SOURCES = {
  lu107: 'https://script.google.com/macros/s/AKfycbyGbE2KbIAsfQvGqaG0QMusF0jeGptC9AYbH6iZv4-T9bS4OztKznyfwcNQrBVdr18F2w/exec',
  'miklu-rezgis': 'https://script.google.com/macros/s/AKfycbwzomHmovON2lQiPP2xa40FRCDFXJ38ofD8YDKB63SBrQHBMB2HKaCBDM_bBmgXsLkD/exec',
  'libiesu-vietvardi': 'https://script.google.com/macros/s/AKfycbxDvj-dCjgleR3uzc8sFhiRw24Wh7tzz2yJ1oAByxGNHy473dTuvp3U46PdnEZa-Uwu/exec'
};
