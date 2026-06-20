// src/api/vendor/expenses.js
// GET /api/v2/vendor/expenses/:vendorId
// Auth: vendor JWT (must own vendorId).
// Purpose: Expenses list for the money screen.
//
// Query params:
//   ?limit=20&offset=0    -> default limit 20, max 100
//
// total_spent: ALWAYS aggregates over the vendor's full expense set,
// independent of pagination. Same steady-state-dashboard pattern as
// invoices.summary (lifetime money view, not a filtered view number).
//
// Sort order: newest first by created_at. Matches the rest of the system —
// vendors checking expenses are usually verifying "did the one I just logged
// appear?" so the most recent entries should be at the top.

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');
const resolveAgent   = require('../middleware/resolveAgent');
const asyncHandler   = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { createExpense, updateExpense, deleteExpense } = require('../../lib/vendor/expenses');

router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), resolveAgent(), async (req, res) => {
  // 6-B — expenses now read Harvey/Donna's ledger: money-OUT binders in
  // engine.records (donna_money direction 'out'). "Paid Rs X to Y for abc"
  // is a binder; client=payee, note=what-for, amount=spend. category folds
  // away (the engine ledger is category-free). Writes below are untouched.
  const eng     = req.app.locals.supabase.schema('engine');
  const agentId = req.agentId;

  const limit  = Math.max(1, Math.min(100, parseInt(req.query.limit, 10)  || 20));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

  const baseOut = () => eng.from('records')
    .eq('agent_id', agentId).eq('direction', 'out').eq('hidden', false);

  const [
    { data: rows,    error: listErr },
    { count,         error: countErr },
    { data: allOut,  error: sumErr },
  ] = await Promise.all([
    baseOut()
      .select('id, client, amount, date, note, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    baseOut().select('*', { count: 'exact', head: true }),
    baseOut().select('amount'),
  ]);

  if (listErr || countErr || sumErr) {
    console.error('[GET /vendor/expenses] engine read error:', (listErr || countErr || sumErr).message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  let totalSpent = 0;
  for (const r of (allOut || [])) totalSpent += (r.amount || 0);

  const expenses = (rows || []).map(r => ({
    id:           r.id,
    description:  r.note   || null,
    amount:       r.amount,
    category:     null,
    expense_date: r.date   || null,
    client_name:  r.client || null,
    created_at:   r.created_at,
  }));

  return res.json({
    ok:          true,
    expenses,
    total_spent: totalSpent,
    total:       count || 0,
  });
});

// ─── POST /api/v2/vendor/expenses ─────────────────────────────────────
//
// Log a new expense.
// Auth: requireAuth. resolveVendor mode A.

router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const body     = req.body || {};

  const result = await createExpense(supabase, vendor.id, {
    amount:         body.amount         || null,
    category:       body.category       || null,
    description:    body.description    || null,
    expense_date:   body.expense_date   || null,
    client_name:    body.client_name    || null,
    linked_lead_id: body.linked_lead_id || null,
    notes:          body.notes          || null,
  });

  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { expense: result.expense });
}));

// ─── PATCH /api/v2/vendor/expenses/:expenseId ─────────────────────────
//
// Partial update.
// Auth: requireAuth. resolveVendor mode C via expenses table.

router.patch('/:expenseId', requireAuth, resolveVendor({ paramName: 'expenseId', via: 'expenses' }), asyncHandler(async (req, res) => {
  const supabase   = req.app.locals.supabase;
  const vendor     = req.vendor;
  const expenseId  = req.params.expenseId;
  const body       = req.body || {};

  const result = await updateExpense(supabase, vendor.id, expenseId, body);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { expense: result.expense });
}));

// ─── DELETE /api/v2/vendor/expenses/:expenseId ────────────────────────
//
// Soft delete.
// Auth: requireAuth. resolveVendor mode C via expenses table.

router.delete('/:expenseId', requireAuth, resolveVendor({ paramName: 'expenseId', via: 'expenses' }), asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const vendor    = req.vendor;
  const expenseId = req.params.expenseId;

  const result = await deleteExpense(supabase, vendor.id, expenseId);
  if (!result.ok) return errRes(res, 404, result.error);
  return okRes(res, { deleted: true });
}));

module.exports = router;
