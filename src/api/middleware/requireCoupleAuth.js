// src/api/middleware/requireCoupleAuth.js
// Express middleware — verifies Supabase Auth JWT for couple-protected endpoints.
//
// On success: attaches req.coupleUser = { id, couple_id } and calls next().
// On failure: returns 401/403 { ok: false, error }.

'use strict';
const { resolveUsersId } = require('../../lib/resolveUsersId');

async function requireCoupleAuth(req, res, next) {
  const supabase = req.app.locals.supabase;

  const header = req.headers['authorization'] || '';
  const cookieToken = req.cookies?.tdw_couple_token || req.cookies?.tdw_vendor_token || '';

  let token = '';
  if (header.startsWith('Bearer ')) {
    token = header.slice(7).trim();
  } else if (cookieToken) {
    token = cookieToken;
  } else {
    return res.status(401).json({ ok: false, error: 'Unauthorised.' });
  }
  if (!token) {
    return res.status(401).json({ ok: false, error: 'Unauthorised.' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ ok: false, error: 'Unauthorised.' });
  }

  const usersId = await resolveUsersId(supabase, user.id);
  const { data: couple } = usersId
    ? await supabase.from('couples').select('id').eq('user_id', usersId).maybeSingle()
    : { data: null };

  if (!couple) {
    return res.status(403).json({ ok: false, error: 'No couple profile found.' });
  }

  req.coupleUser = { id: usersId, user_id: usersId, couple_id: couple.id };
  next();
}

module.exports = requireCoupleAuth;
