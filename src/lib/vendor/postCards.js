// src/lib/vendor/postCards.js — G4.2 · THE CARDS ARM (roadmap row H, R6 rung 1).
// CE-42 seat R6, packet 4b-1. Base dream-os 548944a847027c35cc3ffbd8131a89f802867ffc.
//
// ═══ WHAT IT DOES ═══════════════════════════════════════════════════════════
// Finds her last gallery, builds the vetoed caption from it, and hands back
// three Cloudinary delivery URLs — a Post (1:1), a Status (9:16) and a Story
// (9:16) — each one her page's first photo with the page's own words on it.
// No bytes are stored: the artifact IS the derived URL (ruling 2a). Cloudinary
// renders it on first fetch and caches it; nothing here touches the network.
//
// ═══ THE RULINGS IT CARRIES (4b read-first, CE-42) ══════════════════════════
//   2a  Cloudinary transformations; the derived URL is the artifact; no bucket.
//   3a  one fixed layout per kind, from tokens; the page's first photo.
//   4a  published AND couple_consent=true only — the door refuses otherwise.
//   5a  the caption is a fixed vetoed byte filled from the page; no model.
//   4b-1 (from the rows) "last gallery" = the newest wedding page with at least
//       one photo; zero-photo pages are skipped, never rendered blank.
//
// ═══ ORDER OF THE TWO RULES — A READING, DECLARED ═══════════════════════════
// "Newest page with a photo" is chosen FIRST and consent is checked on THAT page.
// A newest-with-photos page that is a draft refuses with the consent byte; it
// does not fall back to an older published page. Ruling 4a says the door
// refuses, and falling back would show her a card from a page she did not
// expect. If the chair reads it the other way, the change is the `for` loop in
// `findLastGallery` and cell 2.4 in b73.
//
// ═══ ONE HOME FOR EVERY FACT IT USES ════════════════════════════════════════
//   · pages and photos: `W.listForOwner` (created_at desc) + `W.photosFor`
//     (position, created_at) — src/lib/vendor/weddings.js, the readers the
//     ruling cites. No second query shape.
//   · the site host: `siteBase()` in src/lib/vendor/creditInvite.js.
//   · the category: `normaliseCategory` in src/lib/vendor/categoryFraming.js.
//   · the ink: CARD_INK below is GRAPHITE's values from the pwa's
//     lib/worklist/theme.ts. The backend cannot import that file, so b73 §4
//     READS THE SIBLING'S theme.ts and asserts every value here equals the token
//     it names. A second copy that a bench holds to the first is the estate's
//     answer when a copy cannot be avoided (R-41.140's spirit).
//
// ═══ F-42.172 · THE ROLE LINE — RULED (CE-42, 4b-2) ══════════════════════════
// "Photographed by" claimed a role, and a makeup artist posting the same page is
// not the photographer. The chair's founder-signed set, read BY CATEGORY:
//   photography → "Photographed by" · makeup → "Makeup by" · decor → "Décor by"
//   planning → "Planned by" · mehendi → "Mehendi by"
//   anything without a ruled verb → "By {business_name}".
// MEHENDI READS HER RAW WORD FIRST (ruling (a)): categoryFraming.js aliases
// mehendi/mehndi/henna to 'other' (founder ⑤) and that alias stands untouched, so
// the normalised category alone could never reach "Mehendi by". The raw word is
// read first, then the normalised category, then the fallback.
'use strict';

const W = require('./weddings');
const { siteBase } = require('./creditInvite');
const { normaliseCategory } = require('./categoryFraming');

// ── THE KINDS (ruling 3a) ────────────────────────────────────────────────────
const KINDS = Object.freeze({
  post:   { w: 1080, h: 1080 },
  status: { w: 1080, h: 1920 },
  story:  { w: 1080, h: 1920 },
  // 4b-3b (share card ruled (a)): the Sunday brief as a status-geometry card.
  // NOT in KIND_ORDER — buildCards never mints it; briefCardUrl does, from a brief.
  brief:  { w: 1080, h: 1920 },
});
const KIND_ORDER = Object.freeze(['post', 'status', 'story']);

// ── THE FACES (ruling 2 — uploaded once, founder step, tools/upload_card_fonts.js)
// Cloudinary custom fonts are raw AUTHENTICATED uploads addressed by their full
// public_id INCLUDING the extension, and a custom font's public_id may not carry
// an underscore. These two names are the upload tool's names; one constant.
const CARD_FONTS = Object.freeze({
  display: 'CormorantGaramond-Medium.woff2',
  body:    'DMSans-Medium.woff2',
});

// ── THE INK — GRAPHITE, always (the card is an image, not a themed surface) ──
// Keys are theme.ts's own token names; b73 §4 holds each value to the sibling.
const CARD_INK = Object.freeze({
  'overlay-bg': '0A0B0C',
  'ink':        'EDEEEF',
  'ink-soft':   'C8CACC',
  'metal':      'C9A84C',
});

// ── THE VENDOR-FACING BYTES ──────────────────────────────────────────────────
// Every string below was vetoed by the chair (CE-42 4b rulings, 2026-09-10), or is
// carried verbatim from an existing door (named).
const COPY = Object.freeze({
  NO_GALLERY: 'Publish a wedding page with photos to make cards from it.',
  // R-40.19 / R-40.57: the TYPOGRAPHIC apostrophe on a shipped byte. The veto
  // sheet was typed in chat with a straight one; the estate renders ’.
  NOT_LIVE:   'Publish the page and get the couple\u2019s consent first.',
  // CARRIED from src/api/vendor/studio/weddings.js (the tent-card door's own refusal).
  NO_ADDRESS: 'This page has no address yet.',
});

/** thedreamwedding.in — siteBase() without its scheme or a trailing slash. */
function siteHost() {
  return String(siteBase()).replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

/** "thedreamwedding.in/v/DEV440" — the handle as stored, never re-cased. */
function pageAddress(code) {
  return `${siteHost()}/v/${code}`;
}

/**
 * The title line. Ruling 5a: the venue FOLDS INTO the title as "{title} at
 * {venue}" (vetoed) when the page names one — unless the title already says it,
 * which would print the venue twice.
 */
function titleLine(page) {
  const title = String(page.title || '').trim();
  const venue = String(page.venue || '').trim();
  if (!venue) return title;
  if (title.toLowerCase().includes(venue.toLowerCase())) return title;
  return `${title} at ${venue}`;
}

/** F-42.172 (ruled): the role verbs, the fallback, and the raw words read first. */
const ROLE_LINE = Object.freeze({
  photography: 'Photographed by',
  makeup:      'Makeup by',
  decor:       'D\u00e9cor by',
  planning:    'Planned by',
  mehendi:     'Mehendi by',
});
const ROLE_FALLBACK = 'By';
const RAW_ROLE_WORDS = Object.freeze([
  { re: /\b(mehendi|mehndi|henna)\b/i, role: 'mehendi' },
]);

/** Her role key: the raw word first, then the normalised category; null if unruled. */
function roleOf(category) {
  const raw = String(category || '');
  for (const w of RAW_ROLE_WORDS) if (w.re.test(raw)) return w.role;
  const n = normaliseCategory(category);
  return Object.prototype.hasOwnProperty.call(ROLE_LINE, n) ? n : null;
}

/** "Photographed by Dev Roy Photography" · "By Studio X" · null with no name. */
function creditSentence(vendor) {
  const name = String((vendor && vendor.business_name) || '').trim();
  if (!name) return null;
  const role = roleOf(vendor.category);
  return `${role ? ROLE_LINE[role] : ROLE_FALLBACK} ${name}`;
}

/**
 * THE CAPTION — the vetoed byte, filled; the role line reads by category (F-42.172):
 *   "{title} — {city}. {Role line} {business_name}. More on my page: thedreamwedding.in/v/{code}"
 * A slot with no true value DROPS with its own punctuation; nothing renders bare.
 */
function captionFor({ page, vendor }) {
  const city = String(page.city || '').trim();
  const head = city ? `${titleLine(page)} \u2014 ${city}.` : `${titleLine(page)}.`;
  const credit = creditSentence(vendor);
  const parts = [head];
  if (credit) parts.push(`${credit}.`);
  parts.push(`More on my page: ${pageAddress(vendor.routing_handle)}`);
  return parts.join(' ');
}

/**
 * THE LAST GALLERY. Newest page first (W.listForOwner's own order); the first
 * page with at least one photo wins; its first photo is photosFor's first row.
 * Returns { page, photo } or null. Never throws for a vendor with no pages.
 */
async function findLastGallery(supabase, vendorId, deps = {}) {
  const reader = deps.W || W;
  const pages = await reader.listForOwner(supabase, vendorId);
  for (const page of pages) {
    const photos = await reader.photosFor(supabase, page.id);
    if (photos.length > 0) return { page, photo: photos[0] };
  }
  return null;
}

/** Cloudinary's text layer, wrapped to the card's measure. */
function textLayer(font, size, text, hex, measure) {
  return {
    overlay: { font_family: font, font_size: size, text },
    color: `#${hex}`,
    width: measure,
    crop: 'fit',
  };
}

/**
 * THE LAYOUT, ONE PER KIND (ruling 3a; the frame's posts-cards/-status/-story).
 * y is the distance from the card's bottom edge to the LINE's bottom edge; a
 * text layer anchored south grows upward, so a two-line title never runs into
 * the line beneath it.
 *   Post   — title, credit.                      bottom band.
 *   Status — title, credit, the page address.    A status carries no link.
 *   Story  — title, credit.                      Lifted clear of Instagram's
 *            bottom band (she adds Instagram's own link sticker).
 */
function transformationFor(kind, { page, vendor }) {
  const { w, h } = KINDS[kind];
  const margin = 86;
  const measure = w - margin * 2;
  const base = kind === 'story' ? 470 : (kind === 'status' ? 180 : 110);
  const tSize = kind === 'post' ? 84 : 96;
  const bSize = kind === 'post' ? 34 : 38;

  const lines = [];
  if (kind === 'status') {
    lines.push({ layer: textLayer(CARD_FONTS.body, 30, pageAddress(vendor.routing_handle), CARD_INK['ink-soft'], measure), y: base - 52 });
  }
  const credit = creditSentence(vendor);
  if (credit) lines.push({ layer: textLayer(CARD_FONTS.body, bSize, credit, CARD_INK.metal, measure), y: base });
  lines.push({ layer: textLayer(CARD_FONTS.display, tSize, titleLine(page), CARD_INK.ink, measure), y: base + (credit ? bSize + 26 : 0) });

  const t = [
    { width: w, height: h, crop: 'fill', gravity: 'auto' },
    { effect: 'gradient_fade', y: -0.5, background: `rgb:${CARD_INK['overlay-bg']}` },
  ];
  for (const l of lines) {
    t.push(l.layer);
    t.push({ flags: 'layer_apply', gravity: 'south_west', x: margin, y: l.y });
  }
  return t;
}

// ═══ THE BRIEF CARD (G4.1 S7, CE-42 4b-3b — share card ruled (a)) ═══════════
// The frames' S7: Graphite, "My week on Instagram", the four numbers in gold,
// the page link. No photo — and Cloudinary draws text only ON an asset, so the
// base is one of her own photos filled to the status geometry and then
// COLORIZED at 100% to Graphite (`e_colorize:100,co_rgb:overlay-bg`): the result
// is a solid plate whatever the photo was. (The read-first said "faded over a
// pad"; `o_0` fades the pad with the pixels and a JPEG flattens that to white —
// colorize is the documented way to a solid, c-42.47 mine, named in the handover.) FIVE text layers, south-west anchored as
// transformationFor's: title · reach · new followers · saves+shares · the page
// address. CONJECTURE until the founder's device: the transformation STRING is
// what b77 pins; the pixels are his witness (the same law as every card here).
// The best-post photo as base was refused (its CDN address expires; a signed
// URL over a dead source is a broken card with a signature on it).
const BRIEF_COPY = Object.freeze({
  TITLE:         'My week on Instagram',   // vetoed 4b-3a (SU.shareTitle)
  REACH:         'Reach',
  NEW_FOLLOWERS: 'New followers',
  SAVES:         'Saves',
  SHARES:        'Shares',
  DASH:          '\u2014',
});
const enIn = (n) => Number(n).toLocaleString('en-IN');

function briefTransformation(brief, vendor) {
  const { w, h } = KINDS.brief;
  const margin = 86;
  const measure = w - margin * 2;
  const nf = brief.new_followers && brief.new_followers.value != null ? enIn(brief.new_followers.value) : BRIEF_COPY.DASH;
  const lines = [
    { layer: textLayer(CARD_FONTS.body,    30, pageAddress(vendor.routing_handle), CARD_INK['ink-soft'], measure), y: 180 - 52 },
    { layer: textLayer(CARD_FONTS.body,    44, `${BRIEF_COPY.SAVES} ${enIn(brief.saves.value)} \u00b7 ${BRIEF_COPY.SHARES} ${enIn(brief.shares.value)}`, CARD_INK.metal, measure), y: 180 + 20 },
    { layer: textLayer(CARD_FONTS.body,    44, `${BRIEF_COPY.NEW_FOLLOWERS} ${nf}`, CARD_INK.metal, measure), y: 180 + 20 + 70 },
    { layer: textLayer(CARD_FONTS.body,    44, `${BRIEF_COPY.REACH} ${enIn(brief.reach.value)}`, CARD_INK.metal, measure), y: 180 + 20 + 140 },
    { layer: textLayer(CARD_FONTS.display, 96, BRIEF_COPY.TITLE, CARD_INK.ink, measure), y: 180 + 20 + 140 + 96 },
  ];
  const t = [
    { width: w, height: h, crop: 'fill', gravity: 'auto' },
    { effect: 'colorize:100', color: `#${CARD_INK['overlay-bg']}` },
  ];
  for (const l of lines) {
    t.push(l.layer);
    t.push({ flags: 'layer_apply', gravity: 'south_west', x: margin, y: l.y });
  }
  return t;
}

/**
 * The brief's share card — one signed delivery URL, or null when she has no
 * photo to plate on (no gallery, no portfolio) or Cloudinary is unsigned. The
 * base is her last gallery's first photo, else her first portfolio image; the
 * base's pixels never show.
 */
async function briefCardUrl(supabase, vendor, brief, deps = {}) {
  const env = deps.env || process.env;
  if (!isConfigured(env)) return null;
  if (!String(vendor.routing_handle || '').trim()) return null;
  let photo = null;
  const found = await findLastGallery(supabase, vendor.id, deps);
  if (found) photo = found.photo;
  if (!photo) {
    const { data } = await supabase.from('vendor_portfolio').select('image_url').eq('vendor_id', vendor.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
    if (data && data.image_url) photo = { url: data.image_url };
  }
  if (!photo || !publicIdOf(photo)) return null;
  const cloudinary = deps.cloudinary || require('cloudinary').v2;
  return cloudinary.url(publicIdOf(photo), {
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key:    env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
    sign_url: true,
    urlAnalytics: false,
    type: 'upload',
    format: 'jpg',
    transformation: briefTransformation(brief, vendor),
  });
}

/**
 * THE PHOTO'S CLOUDINARY ID — READ FROM ITS URL, THE COLUMN ONLY AS A FALLBACK.
 * `wedding_photos.public_id` is whatever the browser posted back
 * (app/vendor/(shell)/wedding-pages/page.tsx posts Cloudinary's `j.public_id`),
 * and whether that carries the `weddings/<vendor>/<page>/` folder depends on the
 * account's folder mode, which no file in either repo states. The URL does not
 * depend on it: it is Cloudinary's own `secure_url`, the page already renders it,
 * and its path after `/image/upload/[v<n>/]` minus the extension IS the id.
 */
function publicIdOf(photo) {
  const m = String((photo && photo.url) || '').match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[A-Za-z0-9]+)?$/);
  if (m && m[1]) return decodeURIComponent(m[1]);
  return String((photo && photo.public_id) || '');
}

/**
 * One signed delivery URL. The SDK is handed its credentials PER CALL, read from
 * env at call time (cloudinarySign.js's posture) — no global `config()` here, so
 * this module never becomes a second place the SDK is configured.
 * `sign_url` makes the URL work whether or not the account enforces strict
 * transformations; `urlAnalytics: false` keeps the SDK's `?_a=` tag off it.
 */
function cardUrl(kind, { photo, page, vendor }, deps = {}) {
  const env = deps.env || process.env;
  const cloudinary = deps.cloudinary || require('cloudinary').v2;
  return cloudinary.url(publicIdOf(photo), {
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key:    env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
    sign_url: true,
    urlAnalytics: false,
    type: 'upload',
    format: 'jpg',
    transformation: transformationFor(kind, { page, vendor }),
  });
}

function isConfigured(env = process.env) {
  return !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

/**
 * THE ARM. Returns either
 *   { ok: true, page: {id, slug, title}, caption, cards: {post, status, story} }
 * or a refusal the door forwards unchanged:
 *   { ok: false, code: 'no_gallery' | 'not_live' | 'no_address' | 'not_configured', error }
 */
async function buildCards(supabase, vendor, deps = {}) {
  const env = deps.env || process.env;
  const found = await findLastGallery(supabase, vendor.id, deps);
  if (!found) return { ok: false, code: 'no_gallery', error: COPY.NO_GALLERY };

  const { page, photo } = found;
  if (page.visibility !== 'published' || page.couple_consent !== true) {
    return { ok: false, code: 'not_live', error: COPY.NOT_LIVE };
  }
  if (!String(vendor.routing_handle || '').trim()) {
    return { ok: false, code: 'no_address', error: COPY.NO_ADDRESS };
  }
  // A server with no Cloudinary keys cannot sign; that is the estate's fault, not
  // hers, so the words are the door's generic ones and the log names the cause.
  if (!isConfigured(env)) return { ok: false, code: 'not_configured', error: 'Cloudinary is not configured.' };

  const cards = {};
  for (const kind of KIND_ORDER) cards[kind] = cardUrl(kind, { photo, page, vendor }, deps);
  return {
    ok: true,
    page: { id: page.id, slug: page.slug, title: page.title },
    caption: captionFor({ page, vendor }),
    cards,
  };
}

module.exports = {
  KINDS, KIND_ORDER, CARD_FONTS, CARD_INK, COPY,
  ROLE_LINE, ROLE_FALLBACK, roleOf,
  siteHost, pageAddress, titleLine, creditSentence, captionFor,
  findLastGallery, transformationFor, publicIdOf, cardUrl, isConfigured, buildCards,
  BRIEF_COPY, briefTransformation, briefCardUrl,
};
