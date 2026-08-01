// src/lib/adminSession.js
// THE ONE HOME for admin session material (F-07.82 cure, CE ruling F-3).
//
// ── WHAT THIS REPLACES ───────────────────────────────────────────────────────
// Two BYTE-IDENTICAL `signSession` functions lived at src/admin/middleware.js:9
// and src/api/admin/requireAdmin.js:25. Both read:
//     Buffer.from(`${password}:${SESSION_SECRET}`).toString('base64')
// That is REVERSIBLE ENCODING, not a hash. Any captured admin cookie decoded
// straight back to the plaintext admin password. F-07.82.
//
// Two identical implementations is the second-implementation disease one plane
// down: this sitting does not cure a panel while planting the same geometry in
// its guard. Both call sites now import from here. Ruled F-3.
//
// ── THE MINT ─────────────────────────────────────────────────────────────────
// `nonce.expiry.hmac` — where hmac = HMAC-SHA256(ADMIN_SESSION_SECRET, "nonce.expiry").
// THE PASSWORD IS NOT IN THE TOKEN AT ALL. A captured session now decodes to a
// random nonce and a timestamp; there is no credential inside it to recover.
// That is the whole of F-07.82's cure and the reason the mint takes no password
// argument — a signature that cannot accept the secret cannot leak it.
//
// ── EVICTION IS FREE, AND HERE IS WHY (stated, not assumed) ──────────────────
// The retired scheme's `expected` was DETERMINISTIC — one value, derivable from
// the env pair, matching every live cookie. This scheme has no `expected`: a
// token is checked against its OWN embedded payload. Every cookie minted under
// the old scheme therefore fails `verifyAdminSession` on the FORMAT gate before
// the HMAC is even computed (three dot-separated parts, 32 hex nonce, numeric
// expiry). Eviction is a consequence of the shape change, not a step someone
// must remember to perform. Rotating ADMIN_SESSION_SECRET remains the founder's
// optional lever; it is not required by this cure.
//
// ── F-07.72 · THIS FILE IS NOW CALLER #1 OF src/lib/signedSession.js ─────────
// [F-06.85] THIS PARAGRAPH IS CONDITIONED ON A MECHANISM AND NAMES IT: the mint
// and the verify below no longer hold an implementation — they hold a CALL into
// `src/lib/signedSession.js`, which is where the crypto now lives. If that file
// moves, is re-authored, or changes its token shape, THIS FILE'S every sentence
// above must be re-read before the change ships, because every one of them is a
// claim about machinery that is no longer in this file.
//
// WHY THE EXTRACTION, AND WHY IT COST NOTHING. F-07.72's circle lane needed a
// second signed token. Copying this mint into a circle file would have re-planted
// the very geometry the paragraph above forbids, so the CE ruled the cost cured
// structurally rather than accepted: ONE implementation, TWO callers.
//
// THE BEHAVIOUR IS BYTE-IDENTICAL AND THAT IS PROVEN, NOT CLAIMED. `mintSigned`
// with an EMPTY subject joins its payload to exactly `nonce.expiry` and returns
// exactly `nonce.expiry.mac` over a byte-identical HMAC input — the same shape,
// the same gate, the same verdicts. `scripts/b07_f0772_circle_auth_bench.js` §2
// drives the RETIRED inline implementation beside this one and asserts they
// agree on every input, the malformed ones included. This file's exports, their
// names, their signatures and their five call sites are UNCHANGED:
//   src/admin/middleware.js · src/admin/router.js · src/api/admin/requireAdmin.js
//   src/api/admin/login.js  · src/api/couple/concierge.js
'use strict';

const { mintSigned, verifySigned, bearerFrom, safeEquals } = require('./signedSession');

const COOKIE_NAME = 'dream_admin_session';
const TTL_MS      = 7 * 24 * 60 * 60 * 1000; // 7 days — matches the retired COOKIE_TTL

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET;
}

// Mints a fresh session token, or NULL when the signing secret is absent.
// NULL is the fail-closed signal: no caller may invent a token from nothing.
function mintAdminSession(ttlMs = TTL_MS) {
  return mintSigned({ secret: sessionSecret(), subject: [], ttlMs });
}

// Verifies a token. FAILS CLOSED when the secret is absent (F-07.77's law,
// carried forward unchanged: with no secret there is no honest answer, so the
// answer is no). Returns a BOOLEAN because that is what five call sites read;
// the subject array `verifySigned` hands back is empty by construction here.
function verifyAdminSession(token) {
  return verifySigned({ token, secret: sessionSecret(), subjectCount: 0 }) !== null;
}

module.exports = {
  COOKIE_NAME,
  TTL_MS,
  mintAdminSession,
  verifyAdminSession,
  bearerFrom,
  safeEquals,
};
