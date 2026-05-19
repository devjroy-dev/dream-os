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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),

    supabase.from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id),

    supabase.from('expenses')
      .select('amount')
      .eq('vendor_id', vendor.id),
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

module.exports = router;
