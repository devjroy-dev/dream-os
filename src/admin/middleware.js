// middleware.js — admin authentication
// Simple cookie-based session. One password, one admin.

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const COOKIE_NAME    = 'dream_admin_session';
const COOKIE_TTL     = 60 * 60 * 24 * 7; // 7 days in seconds

function signSession(password) {
  // Simple HMAC-style token: base64(password + secret)
  const raw = `${password}:${SESSION_SECRET}`;
  return Buffer.from(raw).toString('base64');
}

// ── F-07.77 · FORK 5(c) — THE FOURTH LITERAL DIED ABOVE ──────────────────────
// THIS READ: `process.env.ADMIN_SESSION_SECRET || '<a literal>'`, the twin of
// api/admin/requireAdmin.js:6. Env-only now, and every path below fails CLOSED
// when either secret is absent. F-07.82 (signSession is base64, not a hash) is
// minted against this same function and is NOT cured here — see requireAdmin.js's
// header for the full reason.
//
// DISCLOSED, NOT PAPERED: `handleLogin` carried the SAME fail-open shape the
// read-first convicted at couple/concierge.js:97 — with ADMIN_PASSWORD absent, a
// form posting no password gave `undefined === undefined` and MINTED A VALID ADMIN
// COOKIE. It was outside the chartered two sites and is cured here because it is
// one line, the identical disease, and this delivery is already in the file.
function verifySession(token) {
  if (!ADMIN_PASSWORD || !SESSION_SECRET) {
    console.error(
      '[admin] ADMIN_PASSWORD and/or ADMIN_SESSION_SECRET is not set — REFUSING every ' +
      'admin session. This panel fails CLOSED by design (F-07.77).'
    );
    return false;
  }
  const expected = signSession(ADMIN_PASSWORD);
  return token === expected;
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
  if (ADMIN_PASSWORD && SESSION_SECRET && password && password === ADMIN_PASSWORD) {
    const token = signSession(password);
    res.setHeader('Set-Cookie', 
      `${COOKIE_NAME}=${token}; HttpOnly; Max-Age=${COOKIE_TTL}; Path=/admin; SameSite=Strict`
    );
    return res.redirect('/admin');
  }
  res.redirect('/admin/login?error=1');
}

module.exports = { requireAuth, handleLogin };
