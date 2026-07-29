// src/lib/vendor/profileScore.js — THE COMPLETENESS SCORE, ONE HOME.
//
// TDW_07 P1 · CE ruling §C/F4: this file is BORN at P1 because ranking is its first
// consumer, and P2's Profile Studio EXTENDS this same file (travel policy, the
// spotlight meter's actionable hints). One home, no stub, no second implementation —
// the spec's own words: "single source `src/lib/vendor/profileScore.js`, used by
// ranking AND the meter".
//
// ── FIELD PROVENANCE (every term derived by command at fea5e4d, never from prose) ──
// Read from docs/db/PUBLIC_SCHEMA.md, the WITNESSED prod snapshot (2026-07-23,
// 63 tables / 698 columns, guard 63=63, applied ladder tip 0099; 0100 touches
// public.couples ALONE, so the two tables below are current at this tip):
//
//   public.vendors · 38 columns —
//     16. instagram_handle text          → the IG term
//     26. aesthetic_tags jsonb NOT NULL default '[]'::jsonb → the tags term
//     27. rate_min integer               → the rate term
//     28. rate_max integer               → the rate term
//     34. about text                     → the about term
//   public.vendor_portfolio · 13 columns —
//     5. is_hero boolean NOT NULL default false → the hero term
//     8. approval_state text NOT NULL default 'pending'::text → the photo term's filter
//
// EVERY FIELD THIS FILE READS EXISTS AT THIS TIP. Nothing is skipped, nothing guessed.
// P2's travel-policy term has NO column today (`vendors` carries `travel_notes` at 18
// and `open_to_travel` at 17 — a policy term would read those); it is deliberately NOT
// scored here, because P2 owns the Studio surface that makes it fillable, and a term
// nobody can raise is a score that punishes without a remedy.
//
// ── THE PHOTO FLOOR: ONE CONSTANT, IMPORTED, NEVER RE-DECLARED ────────────────────
// The floor lives at src/lib/vendor/discover.js:6 (MIN_PORTFOLIO_IMAGES), where it is
// ENFORCED server-side on the approval request. This file imports it rather than
// minting a second copy — the F-05.20 class (eleven independent fallbacks, one of them
// wrong) is exactly what a re-declared number becomes. P2 raises that ONE constant
// 5 → 6 and this score moves with it, by construction.
//
// ── A DIVERGENCE, DECLARED NOT PAPERED (filed as F-07.4) ──────────────────────────
// discover.js's gate counts `summary.total` — EVERY portfolio row, pending included
// (portfolio.js:134-144). This score counts APPROVED rows only, because the feed
// renders approved rows only (couple/discover.js:60 `.eq('approval_state','approved')`)
// and a completeness score that credits invisible photos would rank a card above what
// a couple can actually see. The two readings are both defensible and they DISAGREE;
// P2 reconciles them at the 5→6 raise. Named here so the next reader finds the seam
// instead of discovering it.

'use strict';

const { MIN_PORTFOLIO_IMAGES } = require('./discover');

// ── THE WEIGHTS WITHIN THE SCORE ──────────────────────────────────────────────────
// These are the score's INTERNAL shape and are deliberately NOT admin-tunable: the
// admin_config weights (discover.rank.w_*) tune how much COMPLETENESS matters against
// spotlight and freshness. Two tunable layers over one number is a knob nobody can
// reason about. They sum to exactly 1.0 — asserted by the bench, not by hope.
const TERM_WEIGHTS = Object.freeze({
  photos: 0.30,   // the biggest cliff in onboarding (IG_IMPORT_ADDENDUM §1) — weighted as such
  about:  0.15,
  tags:   0.15,
  rate:   0.15,
  hero:   0.15,
  ig:     0.10,
});

const MIN_TAGS = 3;   // the spec's own "tags≥3"

// Clamp to [0,1]. Every term is a 0–1 fraction by contract; this is the floor under
// a caller that hands nonsense rather than a silent NaN travelling into an ORDER BY.
function clamp01(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

// `aesthetic_tags` is jsonb defaulting to '[]' — it arrives as an array from the
// client, but a hand-written row could hold anything. Count only what is countable.
function tagCount(tags) {
  if (Array.isArray(tags)) return tags.filter(t => typeof t === 'string' && t.trim() !== '').length;
  return 0;
}

function hasText(v) {
  return typeof v === 'string' && v.trim() !== '';
}

/**
 * The completeness score, 0–1.
 *
 * @param {object} p
 * @param {number} p.approvedPhotoCount  rows in vendor_portfolio with approval_state='approved'
 * @param {boolean} p.hasHero            any approved row with is_hero=true
 * @param {string|null} p.about          vendors.about
 * @param {Array|null} p.aestheticTags   vendors.aesthetic_tags
 * @param {number|null} p.rateMin        vendors.rate_min
 * @param {number|null} p.rateMax        vendors.rate_max
 * @param {string|null} p.instagramHandle vendors.instagram_handle
 * @returns {number} 0–1
 */
function computeCompleteness(p = {}) {
  const {
    approvedPhotoCount = 0,
    hasHero            = false,
    about              = null,
    aestheticTags      = null,
    rateMin            = null,
    rateMax            = null,
    instagramHandle    = null,
  } = p;

  // Photos: partial credit up to the floor, full credit at or above it. A vendor with
  // 3 of 5 reads 0.6 on this term rather than 0 — the meter's hints (P2) need a number
  // that MOVES as photos arrive, or the hint "add 2 more" has nothing to point at.
  const photosTerm = clamp01(
    MIN_PORTFOLIO_IMAGES > 0
      ? Number(approvedPhotoCount || 0) / MIN_PORTFOLIO_IMAGES
      : (Number(approvedPhotoCount || 0) > 0 ? 1 : 0),
  );

  const aboutTerm = hasText(about) ? 1 : 0;
  const tagsTerm  = clamp01(tagCount(aestheticTags) / MIN_TAGS);
  // Rate is set only when BOTH bounds exist — requestDiscover (discover.js:11-12)
  // requires both and rejects min>max, so a half-set rate is not a state the estate
  // considers valid. Scoring it as half-complete would credit an invalid shape.
  const rateTerm  = (rateMin != null && rateMax != null) ? 1 : 0;
  const heroTerm  = hasHero ? 1 : 0;
  const igTerm    = hasText(instagramHandle) ? 1 : 0;

  const score =
      TERM_WEIGHTS.photos * photosTerm
    + TERM_WEIGHTS.about  * aboutTerm
    + TERM_WEIGHTS.tags   * tagsTerm
    + TERM_WEIGHTS.rate   * rateTerm
    + TERM_WEIGHTS.hero   * heroTerm
    + TERM_WEIGHTS.ig     * igTerm;

  return clamp01(score);
}

/**
 * The per-term breakdown, for P2's meter hints. Ranking does not use it; it exists so
 * P2 extends this file rather than re-deriving the same arithmetic on a screen.
 */
function completenessBreakdown(p = {}) {
  const approvedPhotoCount = Number(p.approvedPhotoCount || 0);
  return {
    photos: { have: approvedPhotoCount, need: MIN_PORTFOLIO_IMAGES, met: approvedPhotoCount >= MIN_PORTFOLIO_IMAGES },
    about:  { met: hasText(p.about) },
    tags:   { have: tagCount(p.aestheticTags), need: MIN_TAGS, met: tagCount(p.aestheticTags) >= MIN_TAGS },
    rate:   { met: p.rateMin != null && p.rateMax != null },
    hero:   { met: !!p.hasHero },
    ig:     { met: hasText(p.instagramHandle) },
  };
}

module.exports = {
  computeCompleteness,
  completenessBreakdown,
  TERM_WEIGHTS,
  MIN_TAGS,
  MIN_PORTFOLIO_IMAGES,
};
