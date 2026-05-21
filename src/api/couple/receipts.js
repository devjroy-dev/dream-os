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


// POST /:coupleId — create receipt (expense log from PWA)
router.post('/:coupleId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  if (req.params.coupleId !== couple_id) return errRes(res, 403, 'Forbidden.');

  const { vendor_name, amount, description, receipt_date, tags, notes } = req.body || {};

  const { data, error } = await supabase
    .from('couple_receipts')
    .insert({
      couple_id,
      vendor_name:  vendor_name  ? String(vendor_name).trim().slice(0,200)  : null,
      amount:       amount       ? parseInt(amount, 10)                      : null,
      description:  description  ? String(description).trim().slice(0,500)  : null,
      receipt_date: receipt_date || null,
      tags:         Array.isArray(tags) ? tags : (notes ? [notes] : null),
    })
    .select('id, amount, vendor_name, description, receipt_date, image_url, tags, created_at')
    .single();

  if (error) {
    console.error('[POST /couple/receipts] insert error:', error.message);
    return errRes(res, 500, 'Could not create receipt.');
  }
  return okRes(res, { expense: data });
}));

// DELETE /:receiptId — delete receipt
router.delete('/:receiptId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  const { data, error } = await supabase
    .from('couple_receipts')
    .delete()
    .eq('id', req.params.receiptId)
    .eq('couple_id', couple_id)
    .select('id')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Receipt not found.');
    console.error('[DELETE /couple/receipts] error:', error.message);
    return errRes(res, 500, 'Could not delete receipt.');
  }
  return okRes(res, { deleted: data.id });
}));

module.exports = router;
