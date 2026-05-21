// src/api/couple/receipts.js
// GET /api/v2/couple/receipts/:coupleId
// Returns receipt vault (couple_receipts table).
// Query: ?booking_id=  ?limit=50
// Requires couple auth (applied in core.js).

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

  const booking_id = req.query.booking_id || null;
  const limit      = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  let query = supabase
    .from('couple_receipts')
    .select('id, booking_id, amount, vendor_name, description, receipt_date, image_url, tags, created_at')
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (booking_id) query = query.eq('booking_id', booking_id);

  const { data: receipts, error } = await query;
  if (error) {
    console.error('[GET /couple/receipts] query error:', error.message);
    return errRes(res, 500, 'Could not fetch receipts.');
  }

  return okRes(res, { receipts: receipts || [] });
}));

module.exports = router;
