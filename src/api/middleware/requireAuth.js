// src/api/middleware/requireAuth.js
// Express middleware — verifies Supabase Auth JWT on protected endpoints.
//
// Usage:
//   const requireAuth = require('../middleware/requireAuth');
//   router.get('/protected', requireAuth, handler);
//
// On success: attaches req.auth = { user_id, phone } and calls next().
// On failure: returns 401 { error, reason }.

'use strict';

async function requireAuth(req, res, next) {
  const supabase = req.app.locals.supabase;

  const header = req.headers['authorization'] || '';
  // Cookie fallback — iOS Safari may have cleared localStorage but cookie persists
  const cookieToken = req.cookies?.tdw_vendor_token || req.cookies?.tdw_couple_token || '';
  
  let token = '';
  if (header.startsWith('Bearer ')) {
    token = header.slice(7).trim();
  } else if (cookieToken) {
    token = cookieToken;
  } else {
    return res.status(401).json({
      error:  'Missing or malformed Authorization header.',
      reason: 'no_token',
    });
  }
  if (!token) {
    return res.status(401).json({ error: 'Empty token.', reason: 'no_token' });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    console.warn('[requireAuth] invalid token:', error?.message || 'no user');
    return res.status(401).json({
      error:  'Invalid or expired session. Please log in again.',
      reason: 'token_invalid',
    });
  }

  req.auth = {
    user_id: data.user.id,
    phone:   data.user.phone,
  };

  next();
}

module.exports = requireAuth;
