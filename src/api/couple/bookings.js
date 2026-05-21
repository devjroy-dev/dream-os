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

// PATCH /:bookingId — update booking fields
// amount_paid is NOT writable here — use POST /:bookingId/payment (record_payment RPC).
router.patch('/:bookingId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  const ALLOWED_CATEGORIES = new Set([
    'photographer','videographer','mua','designer',
    'venue','caterer','decor','florist','music','planner','other',
  ]);
  // DB CHECK constraint only allows these three states.
  // considering/shortlisted/in_discussion are NOT in the constraint — reject them.
  const ALLOWED_STATES = new Set(['booked', 'advance_paid', 'paid']);
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const { bookingId } = req.params;
  if (!UUID_RE.test(bookingId)) return errRes(res, 400, 'Invalid booking id.');

  const { vendor_name, category, amount_total, amount_advance, balance_due_date, notes, state } = req.body || {};
  const updates = {};

  if (vendor_name !== undefined) {
    if (typeof vendor_name !== 'string' || !vendor_name.trim())
      return errRes(res, 400, 'vendor_name must be a non-empty string.');
    updates.vendor_name = vendor_name.trim().slice(0, 200);
  }
  if (category !== undefined) {
    if (!ALLOWED_CATEGORIES.has(category)) return errRes(res, 400, 'Invalid category.');
    updates.category = category;
  }
  // -1 sentinel clears integer fields (schema CHECK enforces >= 0, so -1 is safe as clear signal)
  if (amount_total !== undefined) {
    if (amount_total === null || amount_total === -1) {
      updates.amount_total = null;
    } else {
      const n = parseInt(amount_total, 10);
      if (isNaN(n) || n < 0) return errRes(res, 400, 'amount_total must be a non-negative integer.');
      updates.amount_total = n;
    }
  }
  if (amount_advance !== undefined) {
    if (amount_advance === null || amount_advance === -1) {
      updates.amount_advance = null;
    } else {
      const n = parseInt(amount_advance, 10);
      if (isNaN(n) || n < 0) return errRes(res, 400, 'amount_advance must be a non-negative integer.');
      updates.amount_advance = n;
    }
  }
  if (balance_due_date !== undefined) {
    if (balance_due_date === null || balance_due_date === '') {
      updates.balance_due_date = null;
    } else {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(balance_due_date))
        return errRes(res, 400, 'balance_due_date must be YYYY-MM-DD.');
      updates.balance_due_date = balance_due_date;
    }
  }
  if (notes !== undefined) {
    updates.notes = (notes === null || notes === '') ? null : String(notes).trim().slice(0, 500);
  }
  if (state !== undefined) {
    if (!ALLOWED_STATES.has(state)) return errRes(res, 400, 'state must be booked, advance_paid, or paid.');
    updates.state = state;
  }
  delete updates.amount_paid;  // never writable via this endpoint
  if (Object.keys(updates).length === 0) return errRes(res, 400, 'No fields to update.');

  const { data, error } = await supabase
    .from('couple_bookings')
    .update(updates)
    .eq('id', bookingId)
    .eq('couple_id', couple_id)
    .select('id, vendor_name, category, amount_total, amount_advance, amount_paid, balance_due_date, state, notes')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Booking not found.');
    console.error('[PATCH /couple/bookings/:bookingId] error:', error.message);
    return errRes(res, 500, 'Could not update booking.');
  }
  return okRes(res, { booking: data });
}));

// POST /:bookingId/payment — record a payment via record_payment() RPC
// Body: { amount: integer (rupees, non-zero), payment_date?: YYYY-MM-DD }
// The RPC atomically updates amount_paid and recomputes state (booked→advance_paid→paid).
router.post('/:bookingId/payment', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const { bookingId } = req.params;
  if (!UUID_RE.test(bookingId)) return errRes(res, 400, 'Invalid booking id.');

  const { amount, payment_date } = req.body || {};
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount === 0)
    return errRes(res, 400, 'amount required (non-zero integer rupees).');
  if (payment_date && !/^\d{4}-\d{2}-\d{2}$/.test(payment_date))
    return errRes(res, 400, 'payment_date must be YYYY-MM-DD.');

  // Couple-scope check before calling RPC — the SQL function does not scope to couple_id.
  const { data: check } = await supabase
    .from('couple_bookings')
    .select('id')
    .eq('id', bookingId)
    .eq('couple_id', couple_id)
    .maybeSingle();
  if (!check) return errRes(res, 404, 'Booking not found.');

  const { data, error } = await supabase.rpc('record_payment', {
    p_booking_id:   bookingId,
    p_amount:       amount,
    p_receipt_id:   null,
    p_payment_date: payment_date || null,
  });

  if (error) {
    if (error.code === 'P0002' || error.code === 'no_data_found')
      return errRes(res, 404, 'Booking not found.');
    console.error('[POST /couple/bookings/:bookingId/payment] rpc error:', error.message);
    return errRes(res, 500, 'Could not record payment.');
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
