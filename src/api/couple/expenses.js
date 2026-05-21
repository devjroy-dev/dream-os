// src/api/couple/expenses.js
// GET /api/v2/couple/expenses/:coupleId
// Returns couple receipts (the bride's expense vault).
// Query: ?category=  ?limit=50
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

  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  // couple_receipts is the expense vault per 0019_bride_planner.sql
  let query = supabase
    .from('couple_receipts')
    .select('id, booking_id, amount, vendor_name, description, receipt_date, image_url, tags, created_at')
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  const { data: expenses, error } = await query;
  if (error) {
    console.error('[GET /couple/expenses] query error:', error.message);
    return errRes(res, 500, 'Could not fetch expenses.');
  }

  return okRes(res, { expenses: expenses || [] });
}));

module.exports = router;
