// src/api/couple/moments.js
// GET  /api/v2/couple/moments/:coupleId  — list personal moment photos
// Requires couple auth (applied in core.js).
//
// Moments = muse_saves WHERE surface='moments', newest first.
// Same table as Muse, different surface filter.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

router.get('/:coupleId', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  if (req.params.coupleId !== couple_id) {
    return errRes(res, 403, 'Forbidden.');
  }

  const limit  = Math.min(100, parseInt(req.query.limit, 10) || 50);
  const offset = parseInt(req.query.offset, 10) || 0;

  const { data, error } = await supabase
    .from('muse_saves')
    .select('id, save_number, image_url, caption, saved_by_role, created_at')
    .eq('couple_id', couple_id)
    .eq('surface', 'moments')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[GET /couple/moments] error:', error.message);
    return errRes(res, 500, 'Could not load moments.');
  }

  return okRes(res, { moments: data || [], total: (data || []).length });
}));

module.exports = router;
