// src/lib/site/limits.js · TDW · CE-46 · WEB-4 cut 2 · EVERY FIELD SHE TYPES HAS A LIMIT.
//
// Why (the chair's relay of WEB-3's Gallery fault, 30 September 2026): at in-between widths the framed photograph
// covered the studio name and headings sat on their labels. The renderer's fix is WEB-3's; the model's part is that no
// field she fills is unbounded, so the renderer can always fit words BESIDE a picture. Each limit below is measured in
// characters as a person counts them (code points, so a Devanagari or emoji character counts once), after trimming.
// The migration mirrors the fixed-column limits as CHECKs; the doors (cut 3) refuse with the line `tooLong` makes.
//
// Prices (the chair's rulings of 30 September 2026): a look's from-price is free text in the money register only
// ("Rs 45,000"; never K, L, Cr or the rupee sign), and a figure in her own free text is NOT refused: when her page is
// set to hide rates (vendors.rate_display false) she gets a gentle warning at save (Q5).
//
// Wording: every line here that she can read is listed for the founder's veto through the chair (R-45.30).
// TOTAL: every export answers and never throws.
'use strict';

const { figuresIn } = require('../vendor/couplePriceState');

// label is the plain name she sees in a refusal; max in characters; lines for a single-line field.
const LIMITS = Object.freeze({
  site_name:        { label: 'Site name', max: 40, lines: 1 },
  monogram:         { label: 'Monogram', max: 3, lines: 1 },
  intro:            { label: 'Introduction', max: 160 },
  announcement:     { label: 'Announcement', max: 48, lines: 1, count: 4 },
  cover_eyebrow:    { label: 'Small heading', max: 32, lines: 1 },
  cover_headline:   { label: 'Headline', max: 48 },
  cover_button:     { label: 'Button', max: 24, lines: 1 },
  category:         { label: 'Category', max: 24, lines: 1, count: 10 },
  trade_items:      { label: 'Name for your work', max: 16, lines: 1 },
  trade_item:       { label: 'Name for one piece of work', max: 16, lines: 1 },
  trade_request:    { label: 'Request button', max: 32, lines: 1 },
  section_eyebrow:  { label: 'Small heading', max: 32, lines: 1 },
  section_heading:  { label: 'Section heading', max: 60 },
  band_line:        { label: 'Line', max: 90, count: 3 },
  rolling_word:     { label: 'Word', max: 16, lines: 1, count: 8 },
  destination:      { label: 'Place', max: 24, lines: 1, count: 12 },
  look_title:       { label: 'Title', max: 60, lines: 1, min: 1 },
  look_description: { label: 'Description', max: 600 },
  look_included:    { label: "What's included", max: 80, lines: 1, count: 12 },
  look_year:        { label: 'Year', max: 12, lines: 1 },
  from_price:       { label: 'From price', max: 32, lines: 1 },
  credit_role:      { label: 'Credit', max: 24, lines: 1 },
  credit_text:      { label: 'Name', max: 48, lines: 1 },
  video_title:      { label: 'Video title', max: 60, lines: 1 },
  photo_caption:    { label: 'Caption', max: 60, lines: 1 },
  photo_alt:        { label: 'Description for screen readers', max: 125 },
  seo_title:        { label: 'Search title', max: 70, lines: 1 },
  seo_description:  { label: 'Search description', max: 160 },
  collection_name:  { label: 'Collection name', max: 40, lines: 1, min: 1 },
  collection_text:  { label: 'Collection description', max: 200 },
  page_title:       { label: 'Page title', max: 40, lines: 1, min: 1 },
  pricing_note:     { label: 'Note under prices', max: 160 },
  studio_heading:   { label: 'Studio heading', max: 90 },
  studio_body:      { label: 'About the studio', max: 900 },
  enquire_line:     { label: 'Enquiry line', max: 40, lines: 1 },
  cities:           { label: 'Cities', max: 60, lines: 1 },
  faq_question:     { label: 'Question', max: 120, min: 1 },
  faq_answer:       { label: 'Answer', max: 600, min: 1 },
  client_name:      { label: 'Your name', max: 40, lines: 1, min: 1 },
  client_occasion:  { label: 'Occasion', max: 40, lines: 1 },
  client_place:     { label: 'Place', max: 40, lines: 1 },
  client_words:     { label: 'Your words', max: 600 },
});

// Counts beyond single fields (the chair's Q9 ruling; raised only by ruling).
const COUNTS = Object.freeze({ photos_per_look: 12, published_looks: 60, credits_per_look: 8, videos_per_look: 4, related_per_look: 4, cover_slides: 3, band_photos: 3, faq: 12 });

const chars = (s) => Array.from(String(s)).length;
const limitOf = (key) => (typeof key === 'string' && Object.prototype.hasOwnProperty.call(LIMITS, key) ? LIMITS[key] : null);
const clean = (v) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim() : '');

// ── The lines she reads (for the founder's veto) ──
const LINES = Object.freeze({
  tooLong: (label, max) => `${label} can be up to ${max} characters.`,
  empty: (label) => `${label} cannot be empty.`,
  oneLine: (label) => `${label} must be on one line.`,
  tooMany: (label, n) => `You can add up to ${n}.`,
  priceForm: 'Write the price as Rs 45,000.',
  priceHidden: 'Your prices are hidden on your page, but this text has a price in it, and that price will show.',
});

/**
 * Check one field. Returns { ok, value, error } where value is the trimmed text (or null when empty and allowed).
 */
function field(key, v) {
  const L = limitOf(key);
  if (!L) return { ok: false, value: null, error: 'unknown field' };
  const s = clean(v);
  if (!s) return L.min ? { ok: false, value: null, error: LINES.empty(L.label) } : { ok: true, value: null, error: null };
  if (L.lines === 1 && /\n/.test(s)) return { ok: false, value: null, error: LINES.oneLine(L.label) };
  if (chars(s) > L.max) return { ok: false, value: null, error: LINES.tooLong(L.label, L.max) };
  return { ok: true, value: s, error: null };
}

/** A list of one field (announcements, categories, included lines...). Empty items are dropped. */
function list(key, arr) {
  const L = limitOf(key);
  if (!L) return { ok: false, value: [], error: 'unknown field' };
  const items = (Array.isArray(arr) ? arr : []).map(clean).filter(Boolean);
  if (L.count && items.length > L.count) return { ok: false, value: [], error: LINES.tooMany(L.label, L.count) };
  const out = [];
  for (const it of items) { const r = field(key, it); if (!r.ok) return { ok: false, value: [], error: r.error }; out.push(r.value); }
  return { ok: true, value: out, error: null };
}

/**
 * A look's from price. Free text, in the house form only when it holds a figure: "Rs 45,000", "From Rs 1,50,000".
 * Refused: the rupee sign, and K, L, lakh, lac, Cr or crore after a number. Returns { ok, text, rupees, error }.
 */
function fromPrice(v) {
  const r = field('from_price', v);
  if (!r.ok) return { ok: false, text: null, rupees: null, error: r.error };
  if (r.value === null) return { ok: true, text: null, rupees: null, error: null };
  const t = r.value;
  if (/₹|\binr\b/i.test(t) || /\d\s*(k|l|lakh|lakhs|lac|cr|crore)\b/i.test(t)) return { ok: false, text: null, rupees: null, error: LINES.priceForm };
  const figs = figuresIn(t);
  if (figs.length > 1) return { ok: false, text: null, rupees: null, error: LINES.priceForm };
  if (figs.length === 1) {
    // The house form: "Rs" then Indian grouping. A bare "45000" or "Rs.45000" is refused rather than rewritten.
    if (!/\bRs (\d{1,2}(,\d{2})*,\d{3}|\d{1,3})(?![,.\d])/.test(t)) return { ok: false, text: null, rupees: null, error: LINES.priceForm };
    return { ok: true, text: t, rupees: figs[0], error: null };
  }
  if (/\d/.test(t)) return { ok: false, text: null, rupees: null, error: LINES.priceForm };
  return { ok: true, text: t, rupees: null, error: null };
}

/** Q5: a figure in her own words while her page hides rates earns a warning, never a refusal. */
function priceWarning(texts, rateDisplay) {
  if (rateDisplay !== false) return null;
  const all = (Array.isArray(texts) ? texts : [texts]).map((x) => (typeof x === 'string' ? x : '')).join('\n');
  return figuresIn(all).length ? LINES.priceHidden : null;
}

/** A slug from a title: lowercase letters, digits and single hyphens, at most 80, never empty. */
function slugFrom(title, taken) {
  const base = (typeof title === 'string' ? title : '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72).replace(/-+$/g, '') || 'look';
  const used = new Set(Array.isArray(taken) ? taken : []);
  if (!used.has(base)) return base;
  for (let n = 2; n < 10000; n += 1) { const s = `${base}-${n}`; if (!used.has(s)) return s; }
  return `${base}-${Date.now()}`;
}
const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;

/** A focal point: x and y in 0..100, the centre when absent or broken. */
function focal(p) {
  const n = (v) => { if (typeof v === 'symbol' || typeof v === 'bigint') return 50; const x = (v === null || v === undefined || v === '') ? NaN : Number(v); return Number.isFinite(x) ? Math.min(100, Math.max(0, Math.round(x * 100) / 100)) : 50; };
  return { x: n(p && p.x), y: n(p && p.y) };
}

module.exports = { LIMITS, COUNTS, LINES, field, list, fromPrice, priceWarning, slugFrom, SLUG, focal, chars };
