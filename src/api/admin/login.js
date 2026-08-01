// src/api/admin/login.js
// POST /api/v2/admin/login   — { password } -> { ok, token, expires_at }
//
// F-2 RULED (a): a NEW json-shaped door for the fetch caller. Panel A's
// redirect door (src/admin/router.js POST /admin/login) stays Panel A's — a
// 302 is the wrong shape for a fetch() and folding them would have made one
// door serve two protocols badly.
//
// ── WHY THIS DOOR EXISTS AT ALL (F-07.84) ────────────────────────────────────
// The admin panel at dreamos-pwa app/admin/login/page.tsx compared the typed
// password against NEXT_PUBLIC_ADMIN_PASSWORD **in the browser**. Next inlines
// NEXT_PUBLIC_* into the public bundle, so the live admin credential was served
// to every visitor of the site. The credential now never reaches the client:
// the browser posts what the operator typed, and receives back session material
// that contains no credential (see src/lib/adminSession.js).
//
// The refusal is deliberately UNIFORM — the same 401 body whether the password
// was absent, wrong, or the service is mis-provisioned is NOT used here; the
// mis-provisioned case answers 503 and says so in the log, because an operator
// locked out by a missing env deserves to learn that from the logs rather than
// by guessing at his own password. The 401 does not distinguish absent from
// wrong.
'use strict';

const express = require('express');
const router  = express.Router();

const { mintAdminSession, safeEquals, TTL_MS } = require('../../lib/adminSession');

router.post('/', (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  // FAIL CLOSED (F-07.77's standing law). With either env absent there is no
  // honest way to admit anyone, so nobody is admitted — loudly.
  if (!adminPassword || !sessionSecret) {
    console.error(
      '[admin/login] ADMIN_PASSWORD and/or ADMIN_SESSION_SECRET is not set on this ' +
      'service — REFUSING every login. This door fails CLOSED by design (F-07.77).'
    );
    return res.status(503).json({ ok: false, error: 'Admin login is not configured on this service.' });
  }

  const password = req.body && req.body.password;
  if (typeof password !== 'string' || !safeEquals(password, adminPassword)) {
    return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  }

  const token = mintAdminSession();
  if (!token) {
    // Unreachable while the guard above holds — mintAdminSession returns null
    // only on an absent secret. Kept because "unreachable" is a claim about
    // today's code and this door must never answer 200 with a null token.
    console.error('[admin/login] mintAdminSession returned null with the secret present — REFUSING.');
    return res.status(503).json({ ok: false, error: 'Admin login is not configured on this service.' });
  }

  return res.json({ ok: true, token, expires_at: Date.now() + TTL_MS });
});

module.exports = router;
