// src/api/vendor/schedules.js
// PATCH  /api/v2/vendor/schedules/:milestoneId        — update milestone
// POST   /api/v2/vendor/schedules/:milestoneId/paid   — mark paid
//
// ⚠ THE THREE /invoices/:invoiceId/schedule ROUTES LEFT THIS FILE (F-40.181).
// They live in `invoiceSchedule.js`, mounted at `/invoices` above the invoices
// router, because at the bare root they sat below `/invoices` and `GET /:vendorId`
// swallowed the GET. This router keeps the `/schedules/:milestoneId*` shape and
// stays on the root mount in its original position, which is what `b46` §0.3
// asserts — `/money` above the bare root. One router per address shape.
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { markMilestonePaid } = require('../../lib/vendor/schedules');

const authMw = [requireAuth, resolveVendor()];

// PATCH /schedules/:milestoneId
router.patch('/schedules/:milestoneId', ...authMw, asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const allowed   = ['milestone_label', 'due_date', 'pct'];
  const updates   = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  if (!Object.keys(updates).length) return errRes(res, 400, 'No valid fields provided.');

  // If pct changes, recompute amount_due
  if (updates.pct !== undefined) {
    const { data: ms } = await supabase.from('payment_schedules')
      .select('invoice_id').eq('id', req.params.milestoneId).eq('vendor_id', req.vendor.id).single();
    if (ms) {
      const { data: inv } = await supabase.from('invoices')
        .select('amount_total').eq('id', ms.invoice_id).single();
      if (inv) updates.amount_due = Math.round(inv.amount_total * Number(updates.pct) / 100);
    }
    // Validate sum still = 100 after change
    const { data: siblings } = await supabase.from('payment_schedules')
      .select('id, pct').eq('invoice_id', (await supabase.from('payment_schedules')
        .select('invoice_id').eq('id', req.params.milestoneId).single()).data?.invoice_id || '');
    if (siblings) {
      const newSum = siblings.reduce((s, m) => s + (m.id === req.params.milestoneId ? Number(updates.pct) : Number(m.pct)), 0);
      if (Math.abs(newSum - 100) > 0.01) return errRes(res, 400, `Percentages would sum to ${newSum}, not 100.`);
    }
  }

  const { data, error } = await supabase.from('payment_schedules')
    .update(updates).eq('id', req.params.milestoneId).eq('vendor_id', req.vendor.id)
    .select().single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Milestone not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { milestone: data });
}));

// POST /schedules/:milestoneId/paid
router.post('/schedules/:milestoneId/paid', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { amount_paid } = req.body || {};
  const result = await markMilestonePaid(supabase, req.vendor.id, req.params.milestoneId, amount_paid);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { milestone: result.milestone, invoice: result.invoice });
}));

module.exports = router;
