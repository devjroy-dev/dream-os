// src/api/vendor/schedules.js
// POST   /api/v2/vendor/invoices/:invoiceId/schedule  — create schedule
// GET    /api/v2/vendor/invoices/:invoiceId/schedule  — get schedule
// DELETE /api/v2/vendor/invoices/:invoiceId/schedule  — delete schedule
// PATCH  /api/v2/vendor/schedules/:milestoneId        — update milestone
// POST   /api/v2/vendor/schedules/:milestoneId/paid   — mark paid
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { createSchedule, markMilestonePaid, deleteSchedule } = require('../../lib/vendor/schedules');

const authMw = [requireAuth, resolveVendor()];

// POST /invoices/:invoiceId/schedule
router.post('/invoices/:invoiceId/schedule', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { milestones } = req.body || {};
  const result = await createSchedule(supabase, req.vendor.id, req.params.invoiceId, milestones);
  if (!result.ok) return errRes(res, result.code === 409 ? 409 : 400, result.error);
  return okRes(res, { schedule: result.schedule });
}));

// GET /invoices/:invoiceId/schedule
router.get('/invoices/:invoiceId/schedule', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('payment_schedules')
    .select('*')
    .eq('invoice_id', req.params.invoiceId)
    .eq('vendor_id', req.vendor.id)
    .order('ordinal', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  if (!data || data.length === 0) return errRes(res, 404, 'No schedule found for this invoice.');
  return okRes(res, { schedule: data });
}));

// DELETE /invoices/:invoiceId/schedule
router.delete('/invoices/:invoiceId/schedule', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result = await deleteSchedule(supabase, req.vendor.id, req.params.invoiceId);
  if (!result.ok) return errRes(res, 409, result.error);
  return okRes(res, { deleted: true });
}));

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
