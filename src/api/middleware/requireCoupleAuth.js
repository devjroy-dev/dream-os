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
  // ── F-07.65 CURED · EDGE 1 OF 4 · THE CROSS-LANE COOKIE IS REFUSED ──────────
  // THIS READ `|| req.cookies?.tdw_vendor_token`. A vendor's JWT arriving in the
  // vendor cookie was accepted on couple-protected surfaces, resolved to the
  // vendor's users row, found no couples row, and answered 403 "No couple
  // profile found." — 47 bytes, the founder's own production specimen of
  // 2026-07-31. The bride's browser presented an effectively-vendor identity on
  // her own surface and the estate called it a missing profile.
  //
  // F-05.30 IS REVERSED HERE BY RULING, NOT ABSORBED. That finding ratified the
  // cross-lane fallback as defensible-by-design because the alternative was a
  // logged-out bride after an iOS ITP wipe. The P2 prefill specimen proved the
  // fallback does not merely inconvenience — it MIS-SERVES IDENTITY, and a
  // silent wrong-self is worse than an honest sign-in. The CE ruled the reversal
  // explicitly at the auth sitting; this line is that ruling.
  //
  // THE MIRROR IS EDGE 2, AND IT IS NOT OPTIONAL: requireAuth.js:18 carried the
  // byte-identical crossing in the other direction. Curing one edge and not the
  // other is the hollow-green shape — the census found four acceptance edges,
  // two of them crossing, and both crossings die in the same motion.
  const cookieToken = req.cookies?.tdw_couple_token || '';

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
