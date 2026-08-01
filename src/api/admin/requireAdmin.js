// src/api/admin/requireAdmin.js
// REST API admin auth — the ONE guard for every /api/v2/admin/* route.
'use strict';

// ── F-07.82 CURED (CE ruling F-3) ────────────────────────────────────────────
// `signSession` lived HERE and, byte-identically, at src/admin/middleware.js:9.
// It was base64(`password:secret`) — reversible encoding, not a hash — so any
// captured admin cookie decoded straight back to the plaintext admin password.
// Both twins are GONE. One home now signs and verifies: src/lib/adminSession.js,
// HMAC-SHA256 over a mint-time nonce, with no credential inside the token.
//
// ── F-07.84/.85 · THE HEADER LIMB IS DELETED (CE ruling F-3, end-state) ──────
// THIS FILE READ, until this delivery:
//     const header = req.headers['x-admin-password'];
//     if (header) { ...compare against ADMIN_PASSWORD...; return next(); }
// That limb existed to serve dreamos-pwa's admin screens, which shipped the
// live admin password into a PUBLIC browser bundle in order to send it. The
// credential has now left the client entirely (see src/api/admin/login.js), so
// the limb it fed dies with it. A door that still accepted a raw password over
// the wire would keep the disease alive in one wing while the panel was cured.
// The header name is also removed from the CORS allowlist at src/index.js.
//
// ── THE END STATE, both limbs, ruled ─────────────────────────────────────────
//   BEARER  — Authorization: Bearer <token>. Panel B (dreamos-pwa, Vercel).
//             The estate's PROVEN cross-origin carrier (lib/frost-api/_base.ts:242).
//   COOKIE  — dream_admin_session. Panel A (src/admin/**, Railway, break-glass).
//
// DISCLOSED, NOT PAPERED: Panel A mints its cookie `Path=/admin`, so a browser
// never sends it to `/api/v2/*`. The cookie limb here is therefore reachable
// today only by a caller that sets the cookie by hand. That was true before
// this delivery too — it is not a regression and it is not silently repaired,
// because widening Panel A's cookie Path is a behaviour change nobody ruled.
// Filed as an observation for the chair; the limb is kept because F-3 ruled it
// kept.

const { COOKIE_NAME, verifyAdminSession, bearerFrom } = require('../../lib/adminSession');

function requireAdmin(req, res, next) {
  const bearer = bearerFrom(req);
  const cookie = req.cookies ? req.cookies[COOKIE_NAME] : undefined;

  if (!bearer && !cookie) {
    return res.status(401).json({ ok: false, error: 'Admin auth required.' });
  }

  // FAIL-CLOSED (F-07.77): verifyAdminSession returns false with the signing
  // secret absent, so an unprovisioned service refuses instead of comparing.
  // The log line is here rather than inside the session home because the home
  // is called on every request and this door is where refusal becomes visible.
  if (!process.env.ADMIN_SESSION_SECRET) {
    console.error(
      '[requireAdmin] ADMIN_SESSION_SECRET is not set on this service — REFUSING ' +
      'every session. This door fails CLOSED by design (F-07.77).'
    );
    return res.status(403).json({ ok: false, error: 'Forbidden.' });
  }

  if (bearer && verifyAdminSession(bearer)) return next();
  if (cookie && verifyAdminSession(cookie)) return next();

  return res.status(403).json({ ok: false, error: 'Forbidden.' });
}

module.exports = requireAdmin;
