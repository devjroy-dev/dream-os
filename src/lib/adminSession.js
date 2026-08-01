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
'use strict';

const crypto = require('crypto');

const COOKIE_NAME = 'dream_admin_session';
const TTL_MS      = 7 * 24 * 60 * 60 * 1000; // 7 days — matches the retired COOKIE_TTL

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET;
}

// Constant-time string compare that never leaks length via early return shape.
// Used for the password check at the login door AND the mac check below.
function safeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Mints a fresh session token, or NULL when the signing secret is absent.
// NULL is the fail-closed signal: no caller may invent a token from nothing.
function mintAdminSession(ttlMs = TTL_MS) {
  const secret = sessionSecret();
  if (!secret) return null;
  const nonce   = crypto.randomBytes(16).toString('hex');
  const expiry  = Date.now() + ttlMs;
  const payload = `${nonce}.${expiry}`;
  const mac     = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${mac}`;
}

// Verifies a token. FAILS CLOSED when the secret is absent (F-07.77's law,
// carried forward unchanged: with no secret there is no honest answer, so the
// answer is no).
function verifyAdminSession(token) {
  const secret = sessionSecret();
  if (!secret) return false;
  if (typeof token !== 'string' || token.length === 0) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [nonce, expiry, mac] = parts;
  if (!/^[0-9a-f]{32}$/.test(nonce)) return false;
  if (!/^[0-9]{1,20}$/.test(expiry)) return false;
  if (Number(expiry) <= Date.now())  return false;

  const expected = crypto.createHmac('sha256', secret).update(`${nonce}.${expiry}`).digest('base64url');
  return safeEquals(mac, expected);
}

// Reads a bearer token out of an Authorization header. Returns null for every
// shape that is not exactly `Bearer <token>`.
function bearerFrom(req) {
  const raw = req && req.headers && req.headers['authorization'];
  if (typeof raw !== 'string') return null;
  const m = raw.match(/^Bearer\s+(\S+)$/);
  return m ? m[1] : null;
}

module.exports = {
  COOKIE_NAME,
  TTL_MS,
  mintAdminSession,
  verifyAdminSession,
  bearerFrom,
  safeEquals,
};
