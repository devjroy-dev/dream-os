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

// POST /:coupleId — add a manual expense (receipt without image)
router.post('/:coupleId', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  if (req.params.coupleId !== couple_id) {
    return res.status(403).json({ ok: false, error: 'Forbidden.' });
  }

  const { vendor_name, amount, receipt_date, description, tags } = req.body || {};

  if (!vendor_name && !description) {
    return res.status(400).json({ ok: false, error: 'vendor_name or description required.' });
  }

  const row = {
    couple_id,
    vendor_name:  vendor_name  || null,
    description:  description  || null,
    amount:       amount       ? parseInt(amount, 10) : null,
    receipt_date: receipt_date || null,
    tags:         Array.isArray(tags) ? tags : [],
    image_url:    null,
  };

  const { data, error } = await supabase
    .from('couple_receipts')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[POST /couple/expenses] insert error:', error.message);
    return res.status(500).json({ ok: false, error: 'Could not add expense.' });
  }

  return res.json({ ok: true, expense: data });
}));

module.exports = router;
