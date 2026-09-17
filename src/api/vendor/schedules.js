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
const { markMilestonePaid, milestoneAmounts, doorAgentResolver } = require('../../lib/vendor/schedules');

const authMw = [requireAuth, resolveVendor()];

// PATCH /schedules/:milestoneId
//
// CE-43 · LC-2 · packet 3.
//   F-43.81 (beyond packet 3's scope, disclosed): every read here is scoped to the vendor.
//     The sibling and invoice reads were not, so a PATCH naming another vendor's milestone
//     read that vendor's invoice total and siblings before the scoped update refused it.
//   F7: a pct change recomputes the amounts through the one remainder helper
//     (src/lib/vendor/schedules.js milestoneAmounts): the changed milestone is rounded and
//     the LAST milestone absorbs the difference, so the rows still add up to the invoice.
router.patch('/schedules/:milestoneId', ...authMw, asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const vendorId  = req.vendor.id;
  const allowed   = ['milestone_label', 'due_date', 'pct'];
  const updates   = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  if (!Object.keys(updates).length) return errRes(res, 400, 'No valid fields provided.');

  let lastPatch = null;
  if (updates.pct !== undefined) {
    const { data: ms } = await supabase.from('payment_schedules')
      .select('id, invoice_id').eq('id', req.params.milestoneId).eq('vendor_id', vendorId).maybeSingle();
    if (!ms) return errRes(res, 404, 'Milestone not found.');
    const { data: inv } = await supabase.from('invoices')
      .select('amount_total').eq('id', ms.invoice_id).eq('vendor_id', vendorId).maybeSingle();
    const { data: siblings } = await supabase.from('payment_schedules')
      .select('id, pct, ordinal, amount_due').eq('invoice_id', ms.invoice_id).eq('vendor_id', vendorId);
    if (!inv || !siblings) return errRes(res, 404, 'Milestone not found.');
    const ordered = siblings.slice().sort((a, b) => a.ordinal - b.ordinal)
      .map((m) => ({ id: m.id, amount_due: m.amount_due, pct: m.id === ms.id ? Number(updates.pct) : Number(m.pct) }));
    const newSum = ordered.reduce((s, m) => s + m.pct, 0);
    if (Math.abs(newSum - 100) > 0.01) return errRes(res, 400, `Percentages would sum to ${newSum}, not 100.`);
    const money = milestoneAmounts(inv.amount_total, ordered.map((m) => ({ pct: m.pct })));
    if (!money.ok) return errRes(res, 400, money.error);
    const idx = ordered.findIndex((m) => m.id === ms.id);
    updates.amount_due = money.amounts[idx];
    const last = ordered[ordered.length - 1];
    const lastAmount = money.amounts[ordered.length - 1];
    if (last.id !== ms.id && Number(last.amount_due) !== lastAmount) lastPatch = { id: last.id, amount_due: lastAmount };
  }

  const { data, error } = await supabase.from('payment_schedules')
    .update(updates).eq('id', req.params.milestoneId).eq('vendor_id', vendorId)
    .select().single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Milestone not found.');
    return errRes(res, 500, error.message);
  }
  if (lastPatch) {
    const { error: lastErr } = await supabase.from('payment_schedules')
      .update({ amount_due: lastPatch.amount_due }).eq('id', lastPatch.id).eq('vendor_id', vendorId);
    if (lastErr) {
      console.error(`[schedules:patch] remainder not moved on ${lastPatch.id}: ${lastErr.message}`);
      return errRes(res, 500, lastErr.message);
    }
  }
  return okRes(res, { milestone: data });
}));

// POST /schedules/:milestoneId/paid
// F6: `received_on` (YYYY-MM-DD, optional) dates the payment; the invoice's due date moves
// to its next unpaid milestone.
router.post('/schedules/:milestoneId/paid', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { amount_paid, received_on } = req.body || {};
  const result = await markMilestonePaid(supabase, req.vendor.id, req.params.milestoneId, amount_paid,
    received_on == null || received_on === '' ? undefined : received_on,
    { resolveAgentId: doorAgentResolver(req) });
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { milestone: result.milestone, invoice: result.invoice });
}));

module.exports = router;
