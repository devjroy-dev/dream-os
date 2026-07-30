// src/lib/vendor/rateMet.js
//
// TDW_07 P4b · F4 (WIDENED) — RATE COMPLETENESS HAS ONE PREDICATE, AND IT IS MIN-ONLY.
//
// THE RULE: a vendor's rate is "set" when he has told couples where his work STARTS.
// `rate_max` is not part of that question and never was part of what a couple reads — the
// card renders `starting_price`, singular, and nothing on any couple surface has ever shown
// an upper bound for a real vendor.
//
// WHAT THIS REPLACES: two inline copies of `rateMin != null && rateMax != null` (the
// completeness score and the meter's breakdown) plus the request gate's own separate
// both-bounds test. Requiring both bounds meant a vendor who had honestly answered the only
// question couples ask scored ZERO on the term and was nagged by a hint for a number no
// couple would ever see. The demand created the incompleteness it measured.
//
// THE WEIGHT DOES NOT MOVE. `TERM_WEIGHTS.rate` stays 0.135 by ruling. This changes WHEN the
// term is earned, never what it is worth — so scores stay comparable across the estate and
// no vendor's ranking moves for a reason he was not told about. At the charter's fixture
// derivation `min_only` was ZERO estate-wide: no live vendor holds a min without a max
// today, so the retirement moves no live score on the day it ships. Stated in the walk
// rather than discovered from a leaderboard later.
//
// ── WHY THIS IS ITS OWN FILE, AND THE DEFECT THAT PUT IT HERE ─────────────────────────
// The obvious home is profileScore.js, beside the two consumers the ruling names. I built it
// there first. But `src/lib/vendor/discover.js`'s gate needs the SAME predicate, and
// profileScore.js already requires discover.js for MIN_PORTFOLIO_IMAGES (profileScore.js:69)
// — so importing back closed a cycle. In CommonJS `module.exports = { ... }` REPLACES the
// exports object rather than mutating it, so the module that loads second captures a stale
// empty object and never sees the real one. Binding the module object instead of
// destructuring does NOT fix that; I tried it and the gate still threw
// `profileScore.rateMet is not a function` under the reversed load order. Found by executing
// both orders, not by reading the code.
//
// A LEAF FIXES IT STRUCTURALLY. This file requires nothing. Both consumers require it, and
// no cycle can form through a module with no edges out. The ruling says the predicate is
// "consumed by profileScore.js:154 AND :183" — it names the consumers, not the declaration
// site, and the consumers are unchanged. profileScore.js re-exports the name so any existing
// caller reaching for `profileScore.rateMet` still finds it.

'use strict';

/**
 * Is this vendor's starting rate set?
 *
 * FAIL-CLOSED ON SHAPE: anything that is not a finite number reads as unset.
 *
 * A numeric 0 DOES earn the term. That is deliberate continuity, not an oversight — the
 * retired predicate was `rateMin != null`, under which 0 passed. Rejecting it here would be
 * a second behaviour change riding inside a one-line retirement, and nobody ruled it.
 *
 * SELF-CAUGHT, DISCLOSED: the first draft ran `Number(min)` on a string without checking for
 * emptiness, and `Number('') === 0`, which is finite — so a rate stored as an empty string
 * EARNED the term while the comment above said it must not. Found by exercising the
 * predicate across its shapes rather than by reading it.
 *
 * @param {object} p
 * @param {number|string|null} p.rateMin  vendors.rate_min — the ONLY bound this reads.
 * @returns {boolean}
 */
function rateMet(p = {}) {
  const min = p.rateMin;
  if (min == null) return false;
  if (typeof min === 'string') {
    if (min.trim() === '') return false;
    return Number.isFinite(Number(min));
  }
  return typeof min === 'number' && Number.isFinite(min);
}

module.exports = { rateMet };
