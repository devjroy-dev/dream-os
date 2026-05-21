// src/api/circle/feed.js
// GET /api/v2/frost/circle/feed/:brideId
//
// Returns circle activity feed. brideId = couple.id.
// Requires circle member auth.
// Response: { success, data: [...] }

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

router.get('/:brideId', asyncHandler(async (req, res) => {
  const supabase     = req.app.locals.supabase;
  const { brideId }  = req.params;
  const { couple_id } = req.circleMember;

  if (brideId !== couple_id) {
    return res.status(403).json({ success: false, error: 'Forbidden.' });
  }

  const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit,  10) || 20));
  const offset = Math.max(0,              parseInt(req.query.offset, 10) || 0);

  const { data: activity, error } = await supabase
    .from('circle_activity')
    .select('id, activity_type, actor_name, actor_role, subject_type, subject_id, payload, created_at')
    .eq('couple_id', couple_id)
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
      member_name: a.actor_name              || null,
      subject:     a.payload?.vendor_name    || a.payload?.content || null,
      vendor_name: a.payload?.vendor_name    || null,
      content:     a.payload?.content        || null,
    },
    created_at: a.created_at,
  }));

  return res.json({ success: true, data: shaped });
}));

module.exports = router;
