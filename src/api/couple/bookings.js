// src/api/couple/bookings.js
// GET /api/v2/couple/bookings/:coupleId
// Returns vendor bookings (couple_bookings table).
// Query: ?state=booked|advance_paid|paid|all  ?limit=50
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

  const state = req.query.state || 'all';
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  let query = supabase
    .from('couple_bookings')
    .select('id, vendor_name, vendor_id, category, amount_total, amount_advance, amount_paid, balance_due_date, state, notes, created_at, updated_at')
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  const VALID_STATES = ['booked', 'advance_paid', 'paid'];
  if (VALID_STATES.includes(state)) query = query.eq('state', state);
  // 'all' — no state filter

  const { data: bookings, error } = await query;
  if (error) {
    console.error('[GET /couple/bookings] query error:', error.message);
    return errRes(res, 500, 'Could not fetch bookings.');
  }

  return okRes(res, { bookings: bookings || [] });
}));

module.exports = router;
