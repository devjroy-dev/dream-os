// src/api/circle/feed.js
// GET /api/v2/frost/circle/feed/:brideId
//
// No JWT auth — coplanner sends no Authorization header.
// brideId = couple.id. Validates brideId exists in couples table.
// Response: { success, data: [...] }

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { resolveCircleIdentityIfPresent } = require('../../lib/resolveCircleIdentityIfPresent');

router.get('/:brideId', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { brideId } = req.params;

  // ── F-07.72 · CLASS B · THE RESOLVER IS MOUNTED AND ACCEPTS, NEVER REQUIRES ─
  // This delivery is the MINT-AND-TEACH phase: the lane learns to issue and
  // carry a session and ENFORCES NOTHING. Every answer below — proven, forged,
  // absent — leaves this handler's behaviour byte-identical to the tree before
  // it, and `req.circleIdentity` is written and not yet read.
  //
  // IT IS CALLED ANYWAY, AND THAT IS THE POINT. F-07.72 is itself the finding
  // that a fully-written guard sat unmounted for a block because nothing called
  // it; F-07.99 is the same lesson one plane over. A resolver shipped without a
  // call site would be this sitting reproducing its own disease inside its own
  // cure. Mounting it here makes the enforcement ZIP a REFUSAL LINE beneath this
  // one, on a path already proven to execute, instead of a first mount on a live
  // door.
  //
  // THE ENFORCEMENT LINE GOES HERE, and it is deliberately not written yet:
  //   if (!req.circleIdentity.coupleId) return res.status(401)...
  req.circleIdentity = await resolveCircleIdentityIfPresent(req, supabase);

  // Validate couple exists
  const { data: couple } = await supabase
    .from('couples').select('id').eq('id', brideId).maybeSingle();
  if (!couple) {
    return res.json({ success: false, error: 'Couple not found.' });
  }

  const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit,  10) || 20));
  const offset = Math.max(0,              parseInt(req.query.offset, 10) || 0);

  const { data: activity, error } = await supabase
    .from('circle_activity')
    .select('id, activity_type, actor_name, actor_role, subject_type, subject_id, payload, created_at')
    .eq('couple_id', brideId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[GET /frost/circle/feed] query error:', error.message);
    return res.json({ success: false, error: 'Could not fetch feed.' });
  }

  const shaped = (activity || []).map(a => ({
    id:         a.id,
    event_type: a.activity_type,
    payload: {
      member_name: a.actor_name           || null,
      subject:     a.payload?.vendor_name || a.payload?.content || null,
      vendor_name: a.payload?.vendor_name || null,
      content:     a.payload?.content     || null,
    },
    created_at: a.created_at,
  }));

  return res.json({ success: true, data: shaped });
}));

module.exports = router;
