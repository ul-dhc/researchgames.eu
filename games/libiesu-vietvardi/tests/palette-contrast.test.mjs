import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
function properties(block) {
  return Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]));
}
const dark = properties(css.match(/:root\{([\s\S]*?)\}/)[1]);
const light = { ...dark, ...properties(css.match(/html\[data-theme="light"\]\{([\s\S]*?)\}/)[1]) };
function colour(tokens, name) {
  let value = tokens[name];
  for (let depth = 0; /^var\(/.test(value) && depth < 10; depth++) value = tokens[value.match(/var\((--[\w-]+)\)/)[1]];
  assert.match(value, /^#[\da-f]{6}$/i);
  return value;
}
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255)
    .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(tokens, foreground, background) {
  const values = [luminance(colour(tokens, foreground)), luminance(colour(tokens, background))].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}
for (const [theme, tokens] of Object.entries({ dark, light })) {
  test(`${theme}: ordinary and secondary text stays readable on all UI surfaces`, () => {
    for (const foreground of ['--ink', '--ink-muted', '--ink-dim', '--accent']) {
      for (const background of ['--bg', '--panel', '--panel-2']) {
        const ratio = contrast(tokens, foreground, background);
        assert.ok(ratio >= 4.5, `${foreground} on ${background}: ${ratio.toFixed(2)}:1`);
      }
    }
  });
  test(`${theme}: action, feedback and map labels retain strong text contrast`, () => {
    for (const [foreground, background] of [
      ['--on-action', '--action-fill'], ['--on-action', '--action-hover'],
      ['--success', '--success-soft'], ['--danger', '--danger-soft'],
      ['--on-success', '--success'], ['--on-danger', '--danger'],
      ['--map-label-ink', '--map-label-bg'], ['--map-label-muted', '--map-label-bg'],
    ]) {
      const ratio = contrast(tokens, foreground, background);
      assert.ok(ratio >= 4.5, `${foreground} on ${background}: ${ratio.toFixed(2)}:1`);
    }
  });
  test(`${theme}: interactive outlines are distinct from the control surface`, () => {
    assert.ok(contrast(tokens, '--control-border', '--panel') >= 3);
  });
}
