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


// POST /:coupleId — create booking
router.post('/:coupleId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  if (req.params.coupleId !== couple_id) return errRes(res, 403, 'Forbidden.');

  const { vendor_name, category, amount_total, amount_advance, balance_due_date, state, notes } = req.body || {};
  if (!vendor_name || typeof vendor_name !== 'string' || !vendor_name.trim())
    return errRes(res, 400, 'vendor_name required.');

  const VALID_STATES = ['considering', 'shortlisted', 'in_discussion', 'booked', 'advance_paid', 'paid'];
  const resolvedState = VALID_STATES.includes(state) ? state : 'booked';

  const { data, error } = await supabase
    .from('couple_bookings')
    .insert({
      couple_id,
      vendor_name: vendor_name.trim().slice(0, 200),
      category: category || 'other',
      amount_total: amount_total ? parseInt(amount_total, 10) : null,
      amount_advance: amount_advance ? parseInt(amount_advance, 10) : null,
      balance_due_date: balance_due_date || null,
      notes: notes ? String(notes).trim().slice(0, 500) : null,
      state: resolvedState,
    })
    .select('id, vendor_name, vendor_id, category, amount_total, amount_advance, amount_paid, balance_due_date, state, notes, created_at')
    .single();

  if (error) {
    console.error('[POST /couple/bookings] insert error:', error.message);
    return errRes(res, 500, 'Could not create booking.');
  }
  return okRes(res, { booking: data });
}));

// DELETE /:bookingId — delete booking
router.delete('/:bookingId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  const { data, error } = await supabase
    .from('couple_bookings')
    .delete()
    .eq('id', req.params.bookingId)
    .eq('couple_id', couple_id)
    .select('id')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Booking not found.');
    console.error('[DELETE /couple/bookings] error:', error.message);
    return errRes(res, 500, 'Could not delete booking.');
  }
  return okRes(res, { deleted: data.id });
}));

module.exports = router;
