// middleware.js — admin authentication
// Simple cookie-based session. One password, one admin.

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'dream-os-admin-secret';
const COOKIE_NAME    = 'dream_admin_session';
const COOKIE_TTL     = 60 * 60 * 24 * 7; // 7 days in seconds

function signSession(password) {
  // Simple HMAC-style token: base64(password + secret)
  const raw = `${password}:${SESSION_SECRET}`;
  return Buffer.from(raw).toString('base64');
}

function verifySession(token) {
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
  if (password === ADMIN_PASSWORD) {
    const token = signSession(password);
    res.setHeader('Set-Cookie', 
      `${COOKIE_NAME}=${token}; HttpOnly; Max-Age=${COOKIE_TTL}; Path=/admin; SameSite=Strict`
    );
    return res.redirect('/admin');
  }
  res.redirect('/admin/login?error=1');
}

module.exports = { requireAuth, handleLogin };
