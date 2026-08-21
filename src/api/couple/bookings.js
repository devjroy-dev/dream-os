// src/api/couple/bookings.js
// GET /api/v2/couple/bookings/:coupleId
// Returns vendor bookings (couple_bookings table).
// Query: ?state=booked|advance_paid|paid|all  ?limit=50
// Requires couple auth (applied in core.js).
//
// ── ONE VOCABULARY, ONE HOME (F-15.10 · R-35.26) ────────────────────────────
// `VENDOR_CATEGORIES` is imported from `src/agent/categories.js`. It is NOT
// re-declared here. It used to be: a Set of the pre-0123 eleven sat inline in
// the PATCH handler and had drifted out of agreement with the canonical list —
// only `designer`, `decor` and `other` still agreed. Migration 0126 moved
// `couple_bookings_category_check` to the canonical eleven; this file reads that
// same list rather than restating it, so the next edit to the taxonomy cannot
// leave this door behind. `src/api/couple/envelopes.js:50` is the committed
// shape being followed.
//
// ── THE POST DOOR VALIDATES CATEGORY (F-15.23 · R-35.27a) ───────────────────
// It did not. `category: category || 'other'` handed the raw body straight to
// the insert, and the only thing refusing a bad token was the DB CHECK — which
// surfaces to her as a 500 "Could not create booking." A door that refuses by
// crashing is not a door. The guard below is the same guard PATCH has always
// had, on the path that actually creates rows.
//
// ── AND ITS STATE LIST AGREES WITH THE CONSTRAINT (F-15.25 · R-35.27b) ──────
// POST's `VALID_STATES` admitted `considering`, `shortlisted` and
// `in_discussion` — three tokens `couple_bookings_state_check` has never
// accepted — while THIS FILE's own PATCH comment already ruled them rejected.
// Sending one produced a 500. This is obedience to ink already committed a few
// lines below, not new policy.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { VENDOR_CATEGORIES } = require('../../agent/categories');

// The DB CHECK constraint allows exactly these three states.
// considering/shortlisted/in_discussion are NOT in the constraint — reject them.
const ALLOWED_STATES = new Set(['booked', 'advance_paid', 'paid']);

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
    .select('id, vendor_name, vendor_id, category, amount_total, amount_advance, amount_paid, balance_due_date, state, notes, contact_phone, created_at, updated_at')
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

  // R-35.27a. `category` stays OPTIONAL — omitting it still means `other`, which
  // is the founder's own fold-everything-else token and survives 0126. But a
  // token that was SENT and is not one of the eleven is refused HERE, with a
  // 400 that names the fault, instead of reaching Postgres and coming back as a
  // 500 that blames the server for her typo.
  if (category !== undefined && category !== null && category !== '' &&
      !VENDOR_CATEGORIES.includes(category)) {
    return errRes(res, 400, 'Invalid category.');
  }

  // R-35.27b. An explicitly-sent bad state is refused, not silently coerced —
  // quietly turning her `shortlisted` into `booked` would be a lie in her own
  // row. An ABSENT state still defaults to `booked`, which is what every current
  // caller relies on (the pwa's create body sends no state at all).
  if (state !== undefined && state !== null && state !== '' && !ALLOWED_STATES.has(state)) {
    return errRes(res, 400, 'state must be booked, advance_paid, or paid.');
  }
  const resolvedState = ALLOWED_STATES.has(state) ? state : 'booked';

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

  // R-35.26. The inline allowlist that stood here is gone; `VENDOR_CATEGORIES`
  // at module scope is the one home. `ALLOWED_STATES` moved to module scope in
  // the same edit so POST and PATCH cannot disagree about states again.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const { bookingId } = req.params;
  if (!UUID_RE.test(bookingId)) return errRes(res, 400, 'Invalid booking id.');

  const { vendor_name, category, amount_total, amount_advance, balance_due_date, notes, contact_phone, state } = req.body || {};
  const updates = {};

  if (vendor_name !== undefined) {
    if (typeof vendor_name !== 'string' || !vendor_name.trim())
      return errRes(res, 400, 'vendor_name must be a non-empty string.');
    updates.vendor_name = vendor_name.trim().slice(0, 200);
  }
  if (category !== undefined) {
    if (!VENDOR_CATEGORIES.includes(category)) return errRes(res, 400, 'Invalid category.');
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
