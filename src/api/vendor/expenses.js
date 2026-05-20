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
const asyncHandler   = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { createExpense, updateExpense, deleteExpense } = require('../../lib/vendor/expenses');
const asyncHandler   = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { createExpense, updateExpense, deleteExpense } = require('../../lib/vendor/expenses');

router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;

  const limit  = Math.max(1, Math.min(100, parseInt(req.query.limit, 10)  || 20));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

  // Three parallel reads:
  //  1. Paginated expenses (the visible rows).
  //  2. Count of total rows (for pagination metadata).
  //  3. Full set for total_spent aggregation.
  const [
    { data: rows,        error: listErr },
    { count,             error: countErr },
    { data: allExpenses, error: summaryErr },
  ] = await Promise.all([
    supabase.from('expenses')
      .select('id, description, amount, category, expense_date, client_name, created_at')
      .eq('vendor_id', vendor.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),

    supabase.from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .is('deleted_at', null),

    supabase.from('expenses')
      .select('amount')
      .eq('vendor_id', vendor.id)
      .is('deleted_at', null),
  ]);

  if (listErr || countErr || summaryErr) {
    console.error('[GET /vendor/expenses] supabase error:', (listErr || countErr || summaryErr).message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  let totalSpent = 0;
  for (const exp of (allExpenses || [])) {
    totalSpent += (exp.amount || 0);
  }

  return res.json({
    ok:          true,
    expenses:    rows || [],
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
