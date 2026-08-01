// src/api/admin/requireAdmin.js
// REST API admin auth — validates the same cookie as the HTML admin panel.
'use strict';

// ── F-07.77 · FORK 5(c) RULED — THE SECOND SECRET LITERAL DIES ───────────────
// THIS READ: `process.env.ADMIN_SESSION_SECRET || '<a literal>'`. The kickoff named
// THIS FILE as the no-fallback precedent, and the ADMIN_PASSWORD line below earns
// the name — but the very next line carried a live session secret in the clear in a
// PUBLIC repo. The read-first census found it; Fork 5(c) ruled it dies with its
// siblings. Env-only, and the cookie limb now fails CLOSED when it is absent rather
// than signing with a value anyone can read off the internet.
//
// ── F-07.82 MINTED, NOT CURED HERE (its own chartered micro) ─────────────────
// `signSession` is REVERSIBLE ENCODING, not a hash: base64(`password:secret`). Any
// captured admin cookie decodes to the plaintext admin password, and while the
// literal stood, an admin cookie was FORGEABLE by anyone who read this file and
// learned the password. Killing the literal removes the forgery arm; it does NOT
// make the cookie safe to capture. The real cure — a true HMAC plus the eviction
// story for cookies already live in the founder's browser — is F-07.82's, filed and
// deliberately unbuilt here. This comment exists so the next reader of this function
// inherits the reason rather than rediscovering it.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

function signSession(password) {
  const raw = `${password}:${SESSION_SECRET}`;
  return Buffer.from(raw).toString('base64');
}

function requireAdmin(req, res, next) {
  // Accept either the session cookie (HTML admin panel) or x-admin-password header (dreamos-pwa REST calls).
  const header = req.headers['x-admin-password'];
  if (header) {
    if (!ADMIN_PASSWORD || header !== ADMIN_PASSWORD) return res.status(403).json({ ok: false, error: 'Forbidden.' });
    return next();
  }
  const cookie = req.cookies?.dream_admin_session;
  if (!cookie) return res.status(401).json({ ok: false, error: 'Admin auth required.' });
  // FAIL-CLOSED (F-07.77): with either secret absent, `expected` would be derived
  // from the string "undefined" — a value anyone can compute. Refuse, never compare.
  if (!ADMIN_PASSWORD || !SESSION_SECRET) {
    console.error(
      '[requireAdmin] ADMIN_PASSWORD and/or ADMIN_SESSION_SECRET is not set on this ' +
      'service — REFUSING every cookie. This door fails CLOSED by design (F-07.77).'
    );
    return res.status(403).json({ ok: false, error: 'Forbidden.' });
  }
  const expected = signSession(ADMIN_PASSWORD);
  if (cookie !== expected) return res.status(403).json({ ok: false, error: 'Forbidden.' });
  next();
}

module.exports = requireAdmin;
