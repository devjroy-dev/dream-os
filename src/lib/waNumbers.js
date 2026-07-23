// src/lib/waNumbers.js — TDW_05 P4, F5's rider. THE CANONICAL wa.me NUMBER PAIR.
//
// ONE HOME for the two numbers a wa.me link may point at. Every runtime site in
// src/** imports from here; nobody re-declares a default inline. The disease this
// cures is not untidiness — it is that eleven separate `|| '14787788550'` tails
// each independently decided what a link should fall back to, and one of them
// (coupleInvite.js:5) fell back to the WRONG LANE'S number entirely.
//
// THE PAIR (founder's canonical word, CE-62):
//   vendor  917982159047   — the vendor line
//   bride   917011788380   — the bride line
//
// THE DEAD LITERAL: `14787788550` was the Twilio sandbox number. It no longer
// answers. It is gone from every runtime value in src/**; see the ZIP header for
// the four specimen classes where it deliberately survives.
//
// ENV STILL WINS. These are FALLBACKS, not overrides — the env var is read first
// at every site, exactly as before. What changed is that the fallback is now one
// ruled constant instead of eleven independent guesses, and a wrong one cannot
// hide in a single file's tail.
//
// WHY CONSTANTS AND NOT ENV-ONLY: an unset env var must still yield a number that
// ANSWERS. Yielding null here would convert a cosmetic misconfiguration into a
// dead invite link, which is precisely F-05.23's failure mode. The pair is the
// floor, not the policy.
//
// SQL CANNOT READ THIS FILE. db/migrations/0099_circle_invite_link_fix.sql carries
// the bride number as a literal for the same reason and cites the same ruling —
// that is one constant with two homes BY NECESSITY, and both homes say so.
'use strict';

const VENDOR_WA_NUMBER = '917982159047';
const BRIDE_WA_NUMBER  = '917011788380';

// Resolve the wa.me number for a lane, env-first.
//   lane 'vendor' → TDW_WA_NUMBER        || VENDOR_WA_NUMBER
//   lane 'bride'  → TDW_WA_NUMBER_BRIDE  || BRIDE_WA_NUMBER   (NEVER the vendor var)
// The bride chain deliberately does NOT fall through to TDW_WA_NUMBER: that
// fall-through IS the coupleInvite.js:5 mis-route, and a cure that preserves the
// bug's mechanism is not a cure.
function waNumberFor(lane) {
  switch (lane) {
    case 'vendor': return process.env.TDW_WA_NUMBER       || VENDOR_WA_NUMBER;
    case 'bride':  return process.env.TDW_WA_NUMBER_BRIDE || BRIDE_WA_NUMBER;
    default:       throw new RangeError(`waNumberFor: unknown lane '${lane}' (expected 'vendor' | 'bride')`);
  }
}

module.exports = { VENDOR_WA_NUMBER, BRIDE_WA_NUMBER, waNumberFor };
