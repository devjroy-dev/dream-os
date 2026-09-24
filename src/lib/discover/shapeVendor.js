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
// which table the caller meant, which is two functions in one body. It lives at
// src/lib/discover/shapeDemoRow.js, named here so a later reader finds a decision instead
// of an oversight.

'use strict';

const { waNumberFor } = require('../waNumbers');
const { toE164 } = require('../phone');   // F-44.154: the one phone home (FE_2b)

// The enquire deep link's base. Held here rather than at each caller so the preview's
// link and the feed's link cannot drift — a preview whose Enquire button pointed at a
// different number than the live card would be a lie the vendor could not see.
const ENQUIRE_BASE = `https://wa.me/${waNumberFor('vendor')}?text=TDW-`;

// ── §7c · THE ENQUIRY ROUTING RESOLVER · CE-45 G6-1 2a (spec §7c, Amendment 3; ruled into 2a) ──────────
// ONE home for where "Enquire on WhatsApp" sends a couple; every enquiry surface will resolve through it,
// never inline. The switch is vendors.enquiry_routing (0171), hers alone, three rungs:
//   'tdw'        (default, every tier) TDW's vendor line with her handle: EXACTLY today's link.
//   'own_number' her typed enquiry_phone (never users.phone; P0-B's refusal stands). A phone that is not
//                10 to 15 digits falls back to 'tdw' rather than publishing a broken link.
//   'own_waba'   her own number under TDW (G6). In 2a it resolves to 'tdw': the connected number arrives
//                with 2b, which passes it as `ownNumber`; until then no row can hold this value usefully.
// Anything unknown or absent (a row read before 0171 ran) is 'tdw'. Pure; never throws.
// NOT YET WIRED into the four link builders (shapeVendor :169 below, weddingTeam :294, weddingPage :142,
// vendorCard :572; at 46af98d): each reads the vendor through an explicit column list, and until a vendor can set the
// switch (FE_2) every row is 'tdw', whose link is byte-identical to theirs. Declared for the chair.
// FE_2 (e-109's ruling, 2026-09-24): `tdwLink`, when given, is the CALLER'S OWN rung-1 expression passed
// whole, and is returned unchanged for rung 1, so every emitter's TDW link stays byte-identical by
// construction (the emitters spell the handle four ways: upper-cased, raw, `String(x || '')`, templated).
function enquireLinkFor({ handle, tdwLink, enquiry_routing, enquiry_phone, ownNumber } = {}) {
  const tdw = tdwLink !== undefined ? tdwLink : (handle ? `${ENQUIRE_BASE}${handle}` : null);
  // F-44.154 (FE_2b): through toE164 first, so a bare 10-digit mobile links with +91 (a raw value stored before FE_2b
  // included), then digits only for wa.me. 11 to 15 digits after normalising; anything else falls back to rung 1.
  const digits = (p) => { const d = String(toE164(String(p || '').trim()) || '').replace(/\D/g, ''); return d.length >= 11 && d.length <= 15 ? d : null; };
  if (enquiry_routing === 'own_number') { const d = digits(enquiry_phone); return d ? `https://wa.me/${d}` : tdw; }
  if (enquiry_routing === 'own_waba') { const d = digits(ownNumber); return d ? `https://wa.me/${d}` : tdw; }
  return tdw;
}

// ── THE DISPLAY CAP IS OVERTURNED — FOUNDER RULING, TDW_07 MICRO-2 ───────────────────
// FOUNDER'S WORD, 2026-07-31: "couples should be able to see all approved photos on
// discover". The card carries EVERY approved photo. There is no display cap.
//
// WHAT THIS SUPERSEDES, NAMED SO NOBODY RE-DERIVES THE OLD RULE:
//   · P3's Fork 7(b) ("the feed stays at five", chair-ruled) — SUPERSEDED.
//   · P4b's DISPLAY_PHOTO_LIMIT, which moved that five to one home — the home was right,
//     the number is now gone. The constant is retired with the rule it held.
//   · P6's twice-named inheritance ("in-card paging pages through THESE FIVE unless P6
//     re-rules the payload") — RESOLVED IN ADVANCE BY FOUNDER RULING. P6 inherits the full
//     set, and does not need to re-rule the payload.
//
// THE CEILING STILL EXISTS, BY CONSTRUCTION RATHER THAN BY CAP: a vendor cannot hold more
// than MAX_PORTFOLIO_IMAGES (20, src/lib/vendor/portfolio.js:24) approved rows, so "all
// approved" is bounded at twenty without this file asserting a number. That is the right
// place for the bound — the portfolio owns how many photos exist; the card does not get a
// second opinion about how many of them count.
//
// ── THE PAYLOAD DELTA, DERIVED NOT ASSUMED ───────────────────────────────────────────
// P3 capped at five because "quadrupling every card's payload is the jank the spec's own
// measure exists to catch". Measured at this tip, that reasoning was aimed at the wrong
// quantity, and the founder's overturn is better founded than the cap was:
//
//   · The JSON delta is URL TEXT. A page is 20 vendors (couple/discover.js:44) and a
//     storage URL is ~120 bytes, so the worst case — every vendor at the 20-photo ceiling —
//     moves the page from ~11.7KB to ~46.9KB of photo URLs. Real, bounded, and small
//     against a single card image.
//   · IMAGE BYTES DO NOT MOVE ON CARD LOAD. The deck preloads a ROLLING WINDOW OF TWO
//     (canvas page.tsx:652, `imageIdx+1 .. imageIdx+3`), never the whole set. It always
//     did. So "quadrupling the payload" described bytes the deck was never fetching.
//   · The real cost is PER-SWIPE, not per-card: a couple who swipes through twenty photos
//     fetches twenty images, one window at a time. That is the honest jank surface, and it
//     is a founder walk step (Swati's full set, swiped on device) — not something a bench
//     can witness.
//
// The preview mount stays SINGLE-PHOTO by ruling (§2(a), option iii): the DATA parity is
// exact — both mounts receive the identical full array from this function — and the
// affordance gap (the preview cannot swipe) is P6's pager to close, named in its charter.


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
 * @param {string[]} ctx.photos   approved image_urls ALREADY in `position` order. Passed
 *                                through whole — MICRO-2 retired the display cap.
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
    // Every approved photo, in `position` order. No slice: the founder ruled the cap away
    // and the portfolio's own ceiling is the only bound.
    photos:         photos,
    vibe_tags:      v.aesthetic_tags || [],
    about:          v.about          || null,
    enquire_link:   enquireLinkFor({ tdwLink: handle ? `${ENQUIRE_BASE}${handle}` : null, enquiry_routing: v.enquiry_routing, enquiry_phone: v.enquiry_phone }),   // §7c, FE_2
    is_demo:        false,
    // D-3: the chip's source. Stripped of a leading '@' so the client builds
    // instagram://user?username=X without minting a double sigil.
    instagram_handle: normalizeIgHandle(v.instagram_handle),
    // Manual honesty law: marked, always — and marked only where F5's ruling is true.
    featured:       !!ctx.featured,
  };
}

module.exports = {
  enquireLinkFor,
  shapeVendorForDiscover,
  normalizeIgHandle,
  // DISPLAY_PHOTO_LIMIT is GONE, not zeroed — MICRO-2 retired the rule, and a constant left
  // exported at some sentinel value is how a retired rule gets re-consumed by accident.
  ENQUIRE_BASE,
};
