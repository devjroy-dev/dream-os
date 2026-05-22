// src/api/admin/requireAdmin.js
// REST API admin auth — validates the same cookie as the HTML admin panel.
'use strict';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'dream-os-admin-secret';

function signSession(password) {
  const raw = `${password}:${SESSION_SECRET}`;
  return Buffer.from(raw).toString('base64');
}

function requireAdmin(req, res, next) {
  // Accept either the session cookie (HTML admin panel) or x-admin-password header (dreamos-pwa REST calls).
  const header = req.headers['x-admin-password'];
  if (header) {
    if (header !== ADMIN_PASSWORD) return res.status(403).json({ ok: false, error: 'Forbidden.' });
    return next();
  }
  const cookie = req.cookies?.dream_admin_session;
  if (!cookie) return res.status(401).json({ ok: false, error: 'Admin auth required.' });
  const expected = signSession(ADMIN_PASSWORD);
  if (cookie !== expected) return res.status(403).json({ ok: false, error: 'Forbidden.' });
  next();
}

module.exports = requireAdmin;
