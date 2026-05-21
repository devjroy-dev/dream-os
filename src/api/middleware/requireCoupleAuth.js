// src/api/middleware/requireCoupleAuth.js
// Express middleware — verifies Supabase Auth JWT for couple-protected endpoints.
//
// On success: attaches req.coupleUser = { id, couple_id } and calls next().
// On failure: returns 401/403 { ok: false, error }.

'use strict';

async function requireCoupleAuth(req, res, next) {
  const supabase = req.app.locals.supabase;

  const header = req.headers['authorization'] || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: 'Unauthorised.' });
  }

  const token = header.slice(7).trim();
  if (!token) {
    return res.status(401).json({ ok: false, error: 'Unauthorised.' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ ok: false, error: 'Unauthorised.' });
  }

  const { data: couple } = await supabase
    .from('couples')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!couple) {
    return res.status(403).json({ ok: false, error: 'No couple profile found.' });
  }

  req.coupleUser = { id: user.id, user_id: user.id, couple_id: couple.id };
  next();
}

module.exports = requireCoupleAuth;
