// src/api/admin/featured.js
// Featured promo admin — queue, approve, reject, eligibility toggle.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const requireAuth  = require('../middleware/requireAuth');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// POST /eligible/:vendorId
router.post('/eligible/:vendorId', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const eligible  = (req.body || {}).eligible === true;
  const { error } = await supabase.from('vendors').update({ featured_eligible: eligible }).eq('id', req.params.vendorId);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { featured_eligible: eligible });
}));

// GET /queue
router.get('/queue', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('vendor_featured_submissions')
    .select('id, vendor_id, slot_kind, caption, proposed_start_date, proposed_end_date, fee_inr, state, created_at, vendor:vendors(business_name, routing_handle, user:users(name))')
    .in('state', ['submitted', 'under_review'])
    .order('created_at', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { submissions: data || [], total: (data || []).length });
}));

// POST /:submissionId/approve
router.post('/:submissionId/approve', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const body     = req.body || {};
  if (!body.scheduled_start || !body.scheduled_end) return errRes(res, 400, 'scheduled_start and scheduled_end required.');
  const { error } = await supabase.from('vendor_featured_submissions').update({
    state:            'approved',
    scheduled_start:  body.scheduled_start,
    scheduled_end:    body.scheduled_end,
    decided_by_admin: 'admin',
    decided_at:       new Date().toISOString(),
  }).eq('id', req.params.submissionId);
  if (error) return errRes(res, 500, error.message);
  // TODO: Razorpay capture when Block 4 KYC clears
  return okRes(res, {});
}));

// POST /:submissionId/reject
router.post('/:submissionId/reject', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const reason   = (req.body || {}).reason || null;
  const { error } = await supabase.from('vendor_featured_submissions').update({
    state:            'rejected',
    rejection_reason: reason,
    decided_by_admin: 'admin',
    decided_at:       new Date().toISOString(),
  }).eq('id', req.params.submissionId);
  if (error) return errRes(res, 500, error.message);
  // TODO: Razorpay refund when Block 4 KYC clears
  return okRes(res, {});
}));

module.exports = router;
