// src/lib/vendor/cityMatch.js
// CE-42 · SEAT R7 · 4c-1 · F-42.187 — THE SERVER'S HALF OF THE CITY VOCABULARY.
//
// ── A DECLARED TWIN, AND WHERE ITS OTHER HALF LIVES (ruling §4(a)) ─────────────
// The composer's list and alias map live in dreamos-pwa `lib/vendor/cityMatch.ts`
// (TDW_04.5 P4 D2). THIS FILE IS ITS TWIN, NOT A NEW VOCABULARY: `CITIES`, the
// `CITY_ALIASES` body and `matchCity`'s body are byte-identical to that file's,
// and `scripts/b4c1_shoot_board_bench.js` §1 reads BOTH repos and reddens on any
// difference. Edit one, edit the other in the same pair of deliveries.
// Precedent for a declared twin: `safeTerm` (src/lib/vendor/referrals.js, its
// "A DECLARED SECOND HOME" note) and tools/base_guard.sh, byte-identical in both
// repos.
//
// ── WHY THE SERVER NEEDS IT (F-42.187) ────────────────────────────────────────
// The feed's city leg (src/api/vendor/collab.js GET /feed) compared `post.city`
// to `vendors.city` by RAW EQUALITY across two vocabularies: the composer writes
// a CITIES value ('Delhi NCR'), the profile stores what the vendor typed
// ('Delhi'). Witnessed 2026-09-10: all three fixtures say 'Delhi', every DEV440
// post says 'Delhi NCR', so a Delhi vendor with travel off never saw a Delhi NCR
// post. `sameCity` below resolves BOTH sides through the twin before comparing.
//
// `sameCity` is dream-os's own and is NOT part of the twin — the pwa never
// compares two cities; it only resolves one into its select.
'use strict';

const CITIES = [
  'Delhi NCR', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad',
  'Kolkata', 'Jaipur', 'Pune', 'Udaipur', 'Goa', 'Other',
];

// Every value here MUST be a member of CITIES (the pwa twin's own invariant).
const CITY_ALIASES = {
  'delhi':      'Delhi NCR',
  'new delhi':  'Delhi NCR',
  'ncr':        'Delhi NCR',
  'gurgaon':    'Delhi NCR',
  'gurugram':   'Delhi NCR',
  'noida':      'Delhi NCR',
  'ghaziabad':  'Delhi NCR',
  'faridabad':  'Delhi NCR',
  'bengaluru':  'Bangalore',
  'bombay':     'Mumbai',
  'madras':     'Chennai',
  'calcutta':   'Kolkata',
};

/**
 * Resolve a free-text city onto one of CITIES — the twin's ladder, unchanged:
 * exact (case-insensitive) · alias · prefix either way · '' for no match.
 */
function matchCity(raw) {
  const q = (raw || '').trim().toLowerCase();
  if (!q) return '';

  const exact = CITIES.find(c => c.toLowerCase() === q);
  if (exact) return exact;

  const alias = CITY_ALIASES[q];
  if (alias) return alias;

  const prefix = CITIES.find(c => {
    const lc = c.toLowerCase();
    return lc.startsWith(q) || q.startsWith(lc);
  });
  return prefix || '';
}

/**
 * THE FEED'S CITY LEG. Raw equality still answers first (byte-identical to the
 * leg it replaces for every pair that already matched); otherwise both sides are
 * resolved and must land on the SAME NON-EMPTY city.
 *
 * ⚠ NON-EMPTY IS LOAD-BEARING. `matchCity` answers '' for anything it cannot
 * place, so two unplaceable cities would otherwise "match" each other — a
 * vendor in Lucknow seeing a post from Kochi. The empty answer means "unknown",
 * and unknown never equals unknown.
 */
function sameCity(a, b) {
  if (a && b && a === b) return true;
  const ma = matchCity(a);
  return ma !== '' && ma === matchCity(b);
}

module.exports = { CITIES, CITY_ALIASES, matchCity, sameCity };
