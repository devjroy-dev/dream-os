// src/lib/discover/shapeVendor.js
//
// TDW_07 P4b · F1b — THE COUPLE-FACING SHAPE HAS ONE AUTHOR.
//
// Extracted verbatim-in-behaviour from src/api/couple/discover.js:188–:226 (the
// `shapedReal` map at the P4b charter tip). It exists because P4b gives the vendor a
// PREVIEW of his own card, and a preview that shapes its data differently from the feed
// is not a preview — it is a second implementation wearing the word "preview". The spec's
// §3 guardrail says this about the renderer ("a second implementation anywhere is a failed
// session"); the same sentence is true one layer down, about the data the renderer eats.
//
// STRICT PARITY IS A PROPERTY OF THIS FILE, not of two callers agreeing to behave. Both
// mounts call this function:
//   · GET /api/v2/discover/feed          (couple/discover.js) — the live card
//   · GET /api/v2/vendor/discover/preview (vendor/discover.js) — the vendor's own eyes
// The feed synthesises its input from the public feed query; the preview synthesises the
// SAME input shape from the vendor's own /me row and portfolio. Neither reshapes anything
// afterwards. If a field's rule ever needs to differ between mounts, that difference is a
// §0.2 report, not a second branch added here.
//
// WHAT DELIBERATELY DID NOT MOVE IN: the ranking terms. `completeness`, the three rank
// inputs and `_rank_score` stayed at the feed, because the preview HAS no rank — a vendor
// looking at his own card is not being ordered against anybody. Including them here would
// have forced the preview to pass neutral values for arithmetic it never uses, which is
// how a shared function starts growing a mount-shaped parameter. The boundary is the
// ruling's own: "consumed by feed AND preview mount" can only include what both consume.
// The feed spreads this result and appends `_rank_score` itself.
//
// THE DEMO LEG DOES NOT CALL THIS. demo_vendors is a different table with different
// columns (`display_name`, `ig_handle`, a string `rate_display`, JSONB `photos`) and its
// own constant-`false` featured reasoning. Folding it in would mean a parameter selecting
// which table the caller meant, which is two functions in one body. It stays at :248–:279,
// named here so a later reader finds a decision instead of an oversight.

'use strict';

const { waNumberFor } = require('../waNumbers');

// The enquire deep link's base. Held here rather than at each caller so the preview's
// link and the feed's link cannot drift — a preview whose Enquire button pointed at a
// different number than the live card would be a lie the vendor could not see.
const ENQUIRE_BASE = `https://wa.me/${waNumberFor('vendor')}?text=TDW-`;

// ── THE FIVE-PHOTO DISPLAY RULE — ONE HOME (TDW_07 P3 · Fork 7(b), chair-ruled) ────────
// D-2 raises the portfolio to twenty; twenty does NOT reach a card. Before P4b this cap
// lived inside the feed's photo-accumulation loop (couple/discover.js:135). It moved here
// because the preview must obey the identical rule: a vendor holding ten approved photos
// must see FIVE in his preview, exactly as a couple sees five, or the preview teaches him
// his card shows more than it does.
//
// CONSEQUENCE, DISCLOSED: the feed's `photoMap` now accumulates every approved row rather
// than stopping at five, and this function slices. The rendered output is byte-identical —
// the same first five in the same `position` order — but the intermediate array is longer.
// That is the price of one home, and it is the right price: the alternative is capping in
// two loops and calling the agreement a rule.
//
// INHERITED DECISION, NAMED FOR P6 (carried forward verbatim in substance from the site
// this moved from): P6's in-card horizontal paging pages through THESE FIVE unless P6
// re-rules the payload.
const DISPLAY_PHOTO_LIMIT = 5;

// D-3 — the IG handle as the client will use it. Vendors type the handle a dozen ways;
// the deep link takes a bare username. Strips a leading '@', a full profile URL, and any
// trailing slash. Returns null for anything that isn't a plausible handle, so the chip
// renders on truth or not at all — never on a fragment that deep-links nowhere.
// Mirrors the 0005 convention the spec names (P2's Studio "strips @, mirrors 0005").
//
// MOVED, NOT COPIED: this was couple/discover.js:27–:39 and is now imported back there.
// The demo leg calls it too. Two normalizers would mean a preview chip and a card chip
// could disagree about the same vendor's handle.
function normalizeIgHandle(raw) {
  if (typeof raw !== 'string') return null;
  let h = raw.trim();
  if (h === '') return null;
  h = h.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
  h = h.replace(/^@+/, '');
  h = h.replace(/[/?#].*$/, '');
  h = h.trim();
  if (h === '') return null;
  // Instagram usernames: letters, digits, period, underscore. Anything else is not a
  // handle we can build a working link from.
  if (!/^[A-Za-z0-9._]{1,30}$/.test(h)) return null;
  return h;
}

/**
 * The couple-facing shape of ONE real vendor.
 *
 * @param {object} vendor  a `public.vendors` row carrying at least the columns the feed
 *                         query selects: id, business_name, category, city, routing_handle,
 *                         rate_min, aesthetic_tags, about, instagram_handle, rate_display.
 * @param {object} ctx
 * @param {string[]} ctx.photos   approved image_urls ALREADY in `position` order, uncapped.
 *                                This function applies DISPLAY_PHOTO_LIMIT.
 * @param {boolean}  ctx.featured whether a vendor_featured_submissions row makes this
 *                                vendor FEATURED right now. Passed, never derived here —
 *                                the two mounts read it from different queries and the
 *                                Manual honesty law is about the flag being TRUE, not
 *                                about where it was read.
 * @returns {object} the shape both mounts render.
 */
function shapeVendorForDiscover(vendor, ctx = {}) {
  const v      = vendor || {};
  const photos = Array.isArray(ctx.photos) ? ctx.photos : [];
  const handle = v.routing_handle || null;

  return {
    id:             v.id,
    name:           v.business_name  || null,
    category:       v.category       || null,
    city:           v.city           || null,
    routing_handle: handle,
    // D-1's rate-display toggle. `rate_display` is NOT NULL DEFAULT true in 0101, so
    // every existing vendor keeps today's behaviour; only an explicit false hides.
    //
    // THIS LINE IS THE PREVIEW'S WHOLE POINT ON THE MONEY AXIS. A vendor who hides his
    // rate must see it hidden in his own preview — the suppressed-price parity the P4b
    // fixture ledger names Swati Roy (rate_display=false) as the witness for. One line,
    // one author, and the two mounts cannot disagree.
    starting_price: v.rate_display === false ? null : (v.rate_min || null),
    photos:         photos.slice(0, DISPLAY_PHOTO_LIMIT),
    vibe_tags:      v.aesthetic_tags || [],
    about:          v.about          || null,
    enquire_link:   handle ? `${ENQUIRE_BASE}${handle}` : null,
    is_demo:        false,
    // D-3: the chip's source. Stripped of a leading '@' so the client builds
    // instagram://user?username=X without minting a double sigil.
    instagram_handle: normalizeIgHandle(v.instagram_handle),
    // Manual honesty law: marked, always — and marked only where F5's ruling is true.
    featured:       !!ctx.featured,
  };
}

module.exports = {
  shapeVendorForDiscover,
  normalizeIgHandle,
  DISPLAY_PHOTO_LIMIT,
  ENQUIRE_BASE,
};
