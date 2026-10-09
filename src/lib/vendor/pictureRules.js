'use strict';
// src/lib/vendor/pictureRules.js · TDW · CE-47 · WEB-4 cut 30 · R-47.2, THE FOUNDER'S RULE OF 8 OCTOBER 2026.
// ONE HOME for what a picture's state means, read by every door that shows a picture (both tables:
// vendor_portfolio and vendor_look_photos). Nothing else in the estate decides it.
//
//   a. A vendor's pictures belong to her. An upload is live at once on her own pages (her website, storefront,
//      portfolio, looks, her media kit, her Hub page). No approval step stands before a picture shows.
//   b. Google's image safety check runs on every upload. A picture it flags is HELD for the admin, and nothing else
//      is held.
//   c. The admin's only power over a picture is "hide from Discover" (and its one-tap undo). There is no remove
//      button. A removal for a legal reason is done by hand, logged, and the vendor is told (a notice on her portfolio).
//   d. Discover's Report button files a report for the admin. A report never hides a picture by itself.
//
// THE STATES (0223): safety_state 'unchecked' | 'passed' | 'held'; vendor_portfolio.discover_hidden_at.
//   - Her own pages show every picture that is not 'held'.
//   - Discover shows a picture only when it is 'passed' and not hidden from Discover.
//   - approval_state, reviewed_at, reviewed_by_admin and rejection_reason are HISTORY: read by nothing.

const SAFETY = Object.freeze({ UNCHECKED: 'unchecked', PASSED: 'passed', HELD: 'held' });
const LEVELS = Object.freeze(['UNKNOWN', 'VERY_UNLIKELY', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'VERY_LIKELY']);

// THE HOLD RULE, the chair's ruling of 9 October 2026 from the founder's dry run on the 78 live pictures: hold when
// adult is LIKELY or above, or violence is LIKELY or above. NOTHING ELSE. Racy, spoof and medical are read by
// nothing: no hold, no Discover hide, no admin flag (racy held three ordinary, fully dressed bridal pictures).
// A later change to the rule is this one line.
const HOLD_RULE = Object.freeze({ adult: 'LIKELY', violence: 'LIKELY' });

const level = (v) => { const i = LEVELS.indexOf(String(v || '').toUpperCase()); return i < 0 ? 0 : i; };
/** Google's five likelihoods -> 'held' or 'passed', by HOLD_RULE alone. */
function stateFromScores(scores) {
  const s = scores || {};
  return Object.entries(HOLD_RULE).some(([cat, min]) => level(s[cat]) >= level(min)) ? SAFETY.HELD : SAFETY.PASSED;
}

/** Her own pages (website, storefront, portfolio, looks, media kit, Hub page): every picture that is not held. */
const onHerPages = (row) => Boolean(row) && row.safety_state !== SAFETY.HELD;
/** Discover: passed, and not hidden from Discover. */
const onDiscover = (row) => Boolean(row) && row.safety_state === SAFETY.PASSED && !row.discover_hidden_at;
/** The same two rules as query filters (supabase-js builders), so a door never spells them out itself. */
const herPagesFilter = (q) => q.neq('safety_state', SAFETY.HELD);
const discoverFilter = (q) => q.eq('safety_state', SAFETY.PASSED).is('discover_hidden_at', null);

// THE FOUNDER'S LINES (approved word for word, 8 October 2026, 21:33). They change only on his yes.
const LINES = Object.freeze({
  held: 'TDW is checking this picture. It is not shown yet.',
  hiddenFromDiscover: 'This picture is not shown on Discover.',
  legalRemoval: (reason) => `TDW removed one of your pictures for a legal reason: ${String(reason || '').trim().replace(/[.\s]+$/, '')}.`,
});
const REPORT_REASONS = Object.freeze({
  not_wedding_work: 'This is not wedding work.',
  not_their_work: "This is someone else's work.",
  offensive: 'This picture is offensive.',
  other: 'Something else.',
});

/** The one line she reads on a picture of hers, or null (held first: a held picture is on no page at all). */
function vendorNotice(row) {
  if (!row) return null;
  if (row.safety_state === SAFETY.HELD) return LINES.held;
  if (row.discover_hidden_at) return LINES.hiddenFromDiscover;
  return null;
}

// What her own portfolio door sends her about a picture: never approval_state, never rejection_reason.
const VENDOR_PORTFOLIO_COLS = 'id, image_url, caption, aesthetic_tags, is_hero, in_carousel, created_at, position, source, safety_state, discover_hidden_at';
function vendorPicture(row) {
  if (!row) return row;
  const { safety_state: s, discover_hidden_at: h, ...rest } = row;
  delete rest.approval_state; delete rest.rejection_reason; delete rest.reviewed_by_admin; delete rest.reviewed_at; delete rest.safety_scores;
  return Object.assign(rest, { shown_on_her_pages: s !== SAFETY.HELD, shown_on_discover: s === SAFETY.PASSED && !h, notice: vendorNotice(row) });
}

module.exports = { SAFETY, LEVELS, HOLD_RULE, stateFromScores, onHerPages, onDiscover, herPagesFilter, discoverFilter,
  LINES, REPORT_REASONS, vendorNotice, VENDOR_PORTFOLIO_COLS, vendorPicture };
