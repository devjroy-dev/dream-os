// src/lib/site/contrast.js · TDW · CE-46 · WEB-4 cut 2 · THE CONTRAST GATE (design system Day 1 §2, "Contrast").
//
// Body text reaches 4.5 to 1 against its ground, large text 3 to 1. A role that fails keeps its HUE (and saturation)
// and has its LIGHTNESS moved, in half-percent steps, in the direction that can pass, until it passes. Every palette
// the renderer draws passes through here: the curated eighteen and any palette she builds from her logo colour.
// The gate never edits the registry; it returns what is SENT, and names every role it moved.
//
// TOTAL: every export answers and never throws. A value that is not an opaque colour (#rgb or #rrggbb) is not gated:
// the pair is reported in `skipped`, never guessed at. (The line and glass roles are translucent by design; they
// carry no text.)
'use strict';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function parseHex(v) {
  if (typeof v !== 'string' || !HEX.test(v.trim())) return null;
  let h = v.trim().slice(1).toLowerCase();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}
function toHex(rgb) {
  return '#' + rgb.map((x) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, '0')).join('');
}
function luminance(rgb) {
  const f = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
}
/** The WCAG ratio of two opaque colours, or null when either is not one. */
function ratio(a, b) {
  const A = parseHex(a); const B = parseHex(b);
  if (!A || !B) return null;
  const x = luminance(A); const y = luminance(B);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function toHsl([r, g, b]) {
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min; const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
  return [h / 6, s, l];
}
function fromHsl([h, s, l]) {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q;
  const t = (x) => { let v = x; if (v < 0) v += 1; if (v > 1) v -= 1;
    if (v < 1 / 6) return p + (q - p) * 6 * v; if (v < 1 / 2) return q; if (v < 2 / 3) return p + (q - p) * (2 / 3 - v) * 6; return p; };
  return [t(h + 1 / 3), t(h), t(h - 1 / 3)];
}

/**
 * Move `fg`'s lightness until it reaches `target` against `bg`. Hue and saturation are kept.
 * Returns { value, moved, ratio } or null when either colour is not opaque.
 */
function correct(fg, bg, target) {
  const F = parseHex(fg); const B = parseHex(bg);
  if (!F || !B || !(target > 0)) return null;
  const start = ratio(fg, bg);
  if (start >= target) return { value: toHex(F), moved: false, ratio: start };
  const [h, s, l0] = toHsl(F);
  // Try the direction whose far end reaches further first (darker against a light ground, lighter against a dark one).
  const reach = (l) => ratio(toHex(fromHsl([h, s, l])), bg);
  const dirs = reach(0) >= reach(1) ? [-1, 1] : [1, -1];
  for (const d of dirs) {
    for (let step = 1; step <= 200; step += 1) {
      const l = Math.min(1, Math.max(0, l0 + d * step * 0.005));
      const v = toHex(fromHsl([h, s, l])); const r = ratio(v, bg);
      if (r >= target) return { value: v, moved: true, ratio: r };
      if (l === 0 || l === 1) break;
    }
  }
  // Unreachable while keeping the hue (a mid-grey ground): the nearest pole that passes, said plainly.
  const black = ratio('#000000', bg) >= ratio('#ffffff', bg) ? '#000000' : '#ffffff';
  return { value: black, moved: true, ratio: ratio(black, bg), hueLost: true };
}

// The pairs every palette is held to: [text role, the fill it sits on, target, which of the two is moved].
// Text on the page ground moves the TEXT (the ground is the page). A label on a filled button or band moves the
// FILL, so a light label stays light and the button deepens instead of its words turning black (a label is usually
// white or near-black, where hue means nothing). Order matters: the accent is settled against the ground before its
// label is settled against it, and deepening a fill on a light ground only raises its contrast with that ground.
const PAIRS = Object.freeze([
  ['ink', 'ground', 4.5, 'text'], ['muted', 'ground', 4.5, 'text'], ['ink', 'soft', 4.5, 'text'],
  ['accent', 'ground', 3, 'text'], ['on_accent', 'accent', 4.5, 'fill'],
  ['on_deep', 'deep', 4.5, 'fill'], ['tick_ink', 'tick_bg', 4.5, 'fill'],
]);

/**
 * Gate one palette. `roles` and `extras` as the registry holds them; `pairs` the style's own (styles.gatePairsFor),
 * else the general PAIRS above. Returns copies, never the inputs:
 * { roles, extras, moved: [{ role, from, to, against, target, before, after }], skipped: [[fg, bg]] }.
 */
function gatePalette(roles, extras, pairs) {
  const R = Object.assign({}, roles && typeof roles === 'object' ? roles : {});
  const E = Object.assign({}, extras && typeof extras === 'object' ? extras : {});
  const moved = []; const skipped = [];
  const get = (k) => (k in R ? R[k] : E[k]);
  const set = (k, v) => { if (k in R) R[k] = v; else E[k] = v; };
  const list = Array.isArray(pairs) ? pairs : PAIRS;
  for (const pair of list) {
    if (!Array.isArray(pair)) continue;
    const [fgK, bgK, target, side] = pair;
    const fg = get(fgK); const bg = get(bgK);
    if (fg === undefined || bg === undefined) continue;
    const [mv, other] = side === 'fill' ? [bgK, fgK] : [fgK, bgK];
    const c = correct(get(mv), get(other), target);
    if (!c) { skipped.push([fgK, bgK]); continue; }
    if (c.moved) { moved.push({ role: mv, from: get(mv), to: c.value, against: other, target, before: ratio(get(mv), get(other)), after: c.ratio }); set(mv, c.value); }
  }
  return { roles: R, extras: E, moved, skipped };
}

/** The label colour that reads best on a given fill: the candidate with the highest ratio. */
function bestOn(fill, candidates) {
  let best = null; let r = -1;
  for (const c of Array.isArray(candidates) ? candidates : []) { const x = ratio(c, fill); if (x !== null && x > r) { r = x; best = c; } }
  return best;
}

module.exports = { parseHex, ratio, correct, gatePalette, bestOn, PAIRS };
