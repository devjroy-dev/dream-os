// src/lib/vendor/igSignedRequest.js
// TDW_07 P4a · ZIP 2 — META'S `signed_request`, PARSED AND VERIFIED.
//
// Meta POSTs this to the deauthorize and data-deletion callbacks. It is the ONLY
// thing authenticating those two doors: they are unauthenticated by necessity,
// exactly like /callback, because Meta's servers hold no vendor session.
//
// ── THE SHAPE (derived from Meta's own callback documentation at authoring) ──
//   body:   application/x-www-form-urlencoded, one field: signed_request
//   value:  {base64url(signature)}.{base64url(payload)}
//   sig:    HMAC-SHA256 over the ENCODED PAYLOAD STRING — not the decoded JSON,
//           not the whole value. Getting this wrong produces a verifier that
//           rejects every legitimate request, which then gets "fixed" by
//           skipping verification. Written down so that never happens here.
//   payload: JSON, `algorithm` = "HMAC-SHA256", plus the user id.
//
// ── WHY THE ALGORITHM FIELD IS CHECKED ──────────────────────────────────────
// The payload NAMES its own algorithm. A verifier that reads that field and
// obeys it lets an attacker send `"algorithm":"none"` and walk in — the classic
// JWT-family defect. We read it only to REFUSE anything that is not
// HMAC-SHA256; we never let it choose the comparison.
'use strict';

const crypto = require('crypto');

function b64urlDecode(input) {
  const s = String(input).replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s + pad, 'base64');
}

/**
 * Verify and parse. Returns { ok, userId, payload } or { ok:false, error }.
 * NOTHING downstream may act on an unverified payload — a deletion callback
 * that trusts its input is a door for deleting other people's connections.
 */
function parseSignedRequest(signedRequest, secret = process.env.IG_APP_SECRET) {
  if (!secret) return { ok: false, error: 'not_configured' };
  if (typeof signedRequest !== 'string' || !signedRequest.includes('.')) {
    return { ok: false, error: 'malformed' };
  }
  const [encodedSig, encodedPayload] = signedRequest.split('.', 2);
  if (!encodedSig || !encodedPayload) return { ok: false, error: 'malformed' };

  let payload;
  try { payload = JSON.parse(b64urlDecode(encodedPayload).toString('utf8')); }
  catch { return { ok: false, error: 'unreadable_payload' }; }

  // See the header: read the field to REFUSE on it, never to select on it.
  if (!payload || String(payload.algorithm).toUpperCase() !== 'HMAC-SHA256') {
    return { ok: false, error: 'bad_algorithm' };
  }

  const expected = crypto.createHmac('sha256', secret).update(encodedPayload).digest();
  const actual   = b64urlDecode(encodedSig);
  // Length-guard first: timingSafeEqual THROWS on unequal lengths, and a throw
  // here would be a 500 where a 403 is the truth.
  if (actual.length !== expected.length) return { ok: false, error: 'bad_signature' };
  if (!crypto.timingSafeEqual(actual, expected)) return { ok: false, error: 'bad_signature' };

  // Meta's field is `user_id`. For Instagram Login this is the
  // Instagram-SCOPED user id — the same value the token exchange returned and
  // the same value vendor_ig_connections.ig_user_id holds, which is what makes
  // the lookup possible at all.
  const userId = payload.user_id != null ? String(payload.user_id) : null;
  if (!userId) return { ok: false, error: 'no_user_id' };

  return { ok: true, userId, payload };
}

module.exports = { parseSignedRequest };
