// src/api/vendor/solutions/env.js
// TDW_19 · THE ENV LEDGER IS CODE (R-19.5).
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS BUYS: turning a row on later is SETTING A KEY, not shipping a build.
// ═══════════════════════════════════════════════════════════════════════════
// Spec §8 is a table in a document. A table in a document is a thing a reader
// must remember to consult. This file is that table with an exit code attached:
// the room index reads `gates()` through `GET /api/v2/vendor/solutions` and
// renders a chip per row, so the difference between "P2 is live" and "P2 is
// coming" is a Railway dashboard change the founder makes in a minute.
//
// ⚠ NO KEY VALUE EVER LEAVES THIS FILE. `gates()` and `keyReport()` return
// BOOLEANS OF PRESENCE and nothing else. `INTEGRATION_TOKEN_KEY` is an AES-256
// secret and `RESELLERCLUB_API_KEY` spends the founder's money; a door that
// echoed either into a response body would be a credential leak wearing a
// status endpoint's clothes. The exported surface makes that mistake
// unavailable rather than merely discouraged.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠ THE ARITHMETIC THAT DOES NOT CLOSE — CE-38 relay #1 item 3, ACCEPTED
// ═══════════════════════════════════════════════════════════════════════════
// R-19.5 asks this file to name "the six keys from spec §8" and export
// `gates()` returning "which of P1–P6 is live". Re-derived at origin, spec §8
// is SIX ROWS but TEN KEYS, and those ten cover P1 AND P2 ONLY.
//
//   P1 — GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET,
//        GBP_QUOTA_APPROVED, INTEGRATION_TOKEN_KEY
//   P2 — RESELLERCLUB_USER_ID, RESELLERCLUB_API_KEY, VERCEL_TOKEN,
//        VERCEL_PROJECT_ID, VERCEL_TEAM_ID, STOREFRONT_ROOT_DOMAIN
//
// P3, P4, P5 and P6 have NO GATE KEY ANYWHERE IN THE SPEC. A `gates()` that
// inferred their liveness from a table describing two phases would be inventing
// a fact, and it would be the comfortable kind of invention — it would look
// right and pass every cell.
//
// SO THEY ARE FALSE BY DECLARATION, NOT BY ACCIDENT. `UNKEYED_PHASES` names
// them, and the honest cost is recorded here rather than discovered later:
// TURNING P3–P6 ON REQUIRES A SPEC AMENDMENT NAMING THEIR KEYS, and spec §8 is
// the amendment site. This file cannot be edited into making them live; the
// table has to grow first. That is the intended friction.

'use strict';

/**
 * Spec §8, whole. `optional` is not a softening — it records that a key's
 * absence is a legitimate configuration rather than a hole.
 */
const KEYS = Object.freeze([
  { name: 'GOOGLE_OAUTH_CLIENT_ID',     phase: 'p1', setAt: 'Railway',           optional: false },
  { name: 'GOOGLE_OAUTH_CLIENT_SECRET', phase: 'p1', setAt: 'Railway',           optional: false },
  { name: 'INTEGRATION_TOKEN_KEY',      phase: 'p1', setAt: 'Railway',           optional: false },
  { name: 'GBP_QUOTA_APPROVED',         phase: 'p1', setAt: 'Railway',           optional: true  },
  { name: 'RESELLERCLUB_USER_ID',       phase: 'p2', setAt: 'Railway',           optional: false },
  { name: 'RESELLERCLUB_API_KEY',       phase: 'p2', setAt: 'Railway',           optional: false },
  { name: 'VERCEL_TOKEN',               phase: 'p2', setAt: 'Railway',           optional: false },
  { name: 'VERCEL_PROJECT_ID',          phase: 'p2', setAt: 'Railway',           optional: false },
  { name: 'STOREFRONT_ROOT_DOMAIN',     phase: 'p2', setAt: 'Railway + Vercel',  optional: false },
  { name: 'VERCEL_TEAM_ID',             phase: 'p2', setAt: 'Railway',           optional: true  },
]);

/**
 * ⚠ TWO `optional: true` MARKS, AND NEITHER IS A GUESS DRESSED AS A RULING.
 *
 * `GBP_QUOTA_APPROVED` — spec §8's own row reads "sync calls withheld until
 * true". It gates the SYNC, not the row. A vendor can complete the OAuth grant
 * with quota still pending; reporting P1 dead because Google has not answered
 * an application would tell her the wrong thing about her own product. It is
 * exported separately as `gbpQuotaApproved()` so the distinction survives.
 *
 * `VERCEL_TEAM_ID` — DERIVE OWED, and marked optional on a stated belief rather
 * than a witness: Vercel's API takes `teamId` only for team-scoped projects and
 * a personal account has none, so requiring it would make P2 permanently dead
 * on a hobby-plan project. THIS SEAT DID NOT VERIFY IT against Vercel's API or
 * against the founder's actual account tier — no derive stands behind it, and
 * per the ledger's own distinction (AMENDMENT 2) that makes it an OPEN QUESTION
 * and not a fact. P2 re-derives before it ships. If it turns out to be required,
 * the cure is one word in this table.
 */
const UNKEYED_PHASES = Object.freeze(['p3', 'p4', 'p5', 'p6']);

/** @returns {boolean} true when the variable is set to a non-empty string. */
function isSet(name) {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * A phase is live when every NON-OPTIONAL key of that phase is set.
 * @param {'p1'|'p2'} phase
 */
function phaseLive(phase) {
  const required = KEYS.filter((k) => k.phase === phase && !k.optional);
  if (required.length === 0) return false;
  return required.every((k) => isSet(k.name));
}

/**
 * Which of P1–P6 is live.
 *
 * P1 and P2 are derived from key presence. P3–P6 are `false` against
 * UNKEYED_PHASES — see the block at the head of this file. They are not false
 * because a key is missing; they are false because no key was ever specified,
 * and those are different facts.
 *
 * @returns {{p1: boolean, p2: boolean, p3: boolean, p4: boolean, p5: boolean, p6: boolean}}
 */
function gates() {
  const out = { p1: phaseLive('p1'), p2: phaseLive('p2') };
  for (const p of UNKEYED_PHASES) out[p] = false;
  return out;
}

/**
 * Spec §8's `GBP_QUOTA_APPROVED`. Held apart from `gates()` because it withholds
 * the SYNC CALLS (conditional-withheld rule), not the row.
 *
 * P0-A's ledger records why this will be false for some time: TDW's own Business
 * Profile was created 2026-08-28 and Google's prerequisite is 60 days, so the
 * application cannot be submitted before roughly 2026-10-27 (AMENDMENT 3).
 */
function gbpQuotaApproved() {
  const v = (process.env.GBP_QUOTA_APPROVED || '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

/**
 * The ledger, for the handover and for a founder who wants to know what is set
 * without opening Railway. PRESENCE ONLY — never a value.
 * @returns {Array<{name: string, phase: string, setAt: string, optional: boolean, set: boolean}>}
 */
function keyReport() {
  return KEYS.map((k) => ({
    name: k.name,
    phase: k.phase,
    setAt: k.setAt,
    optional: k.optional,
    set: isSet(k.name),
  }));
}

module.exports = {
  KEYS,
  UNKEYED_PHASES,
  gates,
  gbpQuotaApproved,
  keyReport,
};
