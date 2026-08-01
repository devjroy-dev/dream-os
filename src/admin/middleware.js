// middleware.js — admin authentication
// Simple cookie-based session. One password, one admin.

const { COOKIE_NAME, TTL_MS, mintAdminSession, verifyAdminSession, safeEquals } =
  require('../lib/adminSession');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const COOKIE_TTL     = Math.floor(TTL_MS / 1000); // seconds, for Max-Age

// ── F-07.82 CURED (CE ruling F-3) — signSession is GONE from this file ───────
// THIS FILE CARRIED: `Buffer.from(`${password}:${SESSION_SECRET}`).toString('base64')`
// — reversible encoding, byte-identical to the twin at api/admin/requireAdmin.js.
// A captured admin cookie decoded straight back to the plaintext password.
// Both twins are deleted; ONE home mints and verifies (src/lib/adminSession.js),
// HMAC-SHA256 over a mint-time nonce, with no credential inside the token.
//
// EVICTION IS FREE AND STATED: every cookie minted under the retired scheme
// fails the new format gate before its HMAC is computed, so the founder's live
// admin cookies are invalidated by the shape change itself. He signs in once.
// Rotating ADMIN_SESSION_SECRET stays an optional lever, not a requirement.
//
// F-07.77's fail-closed limbs are CARRIED FORWARD, not dropped: verifySession
// refuses when either env is absent, and handleLogin still requires a non-empty
// posted password (the `undefined === undefined` fail-open this file once had
// cannot return through safeEquals, which refuses non-strings outright).
//
// PANEL A IS BREAK-GLASS BY DECISION (CE F-4, founder verbatim: keep). This
// server-rendered panel works when Vercel is down. Its five unique capabilities
// — invite-code mint, unified invite, both cascade deletes with their step-up
// re-prompt, and the per-vendor monthly AI-cost rollup — port nowhere today.
// That is a property held deliberately, and Block 08 inherits a choice.
function verifySession(token) {
  if (!ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    console.error(
      '[admin] ADMIN_PASSWORD and/or ADMIN_SESSION_SECRET is not set — REFUSING every ' +
      'admin session. This panel fails CLOSED by design (F-07.77).'
    );
    return false;
  }
  return verifyAdminSession(token);
}

function requireAuth(req, res, next) {
  const cookie = req.cookies?.[COOKIE_NAME];
  if (cookie && verifySession(cookie)) {
    return next();
  }
  res.redirect('/admin/login');
}

function handleLogin(req, res) {
  const { password } = req.body;
  if (!ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    console.error(
      '[admin] ADMIN_PASSWORD and/or ADMIN_SESSION_SECRET is not set — REFUSING every ' +
      'admin login. This panel fails CLOSED by design (F-07.77).'
    );
    return res.redirect('/admin/login?error=1');
  }
  if (typeof password === 'string' && safeEquals(password, ADMIN_PASSWORD)) {
    const token = mintAdminSession();
    if (token) {
      res.setHeader('Set-Cookie',
        `${COOKIE_NAME}=${token}; HttpOnly; Max-Age=${COOKIE_TTL}; Path=/admin; SameSite=Strict`
      );
      return res.redirect('/admin');
    }
  }
  res.redirect('/admin/login?error=1');
}

module.exports = { requireAuth, handleLogin };
