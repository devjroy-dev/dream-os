// src/api/vendor/invoices.js
// GET /api/v2/vendor/invoices/:vendorId
// Auth: vendor JWT (must own vendorId).
// Purpose: Invoice list for the money screen.
//
// Query params:
//   ?state=unpaid|advance_paid|paid|cancelled|all
//     - omitted / empty   -> default (unpaid + advance_paid), the "needs attention" set
//     - explicit value    -> filter to that single state
//     - 'all'             -> no state filter
//   ?limit=20&offset=0    -> default limit 20, max 100
//
// Summary block: ALWAYS aggregates over the vendor's full invoice set,
// independent of the `state` query param. This is the lifetime money view:
//   - total_outstanding = sum of (amount_total - amount_paid) for invoices
//                         currently in unpaid or advance_paid state.
//   - total_collected   = sum of amount_paid across all invoices (any state).
// Mirrors the TODAY money_snapshot pattern — a steady-state dashboard number,
// not a filtered view number.
//
// Per-row amount_owed is computed server-side: amount_total - amount_paid.

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');

// Per schema (SCHEMA.md lines 260-282): invoices.state CHECK constraint values.
const ALLOWED_STATES = ['unpaid', 'advance_paid', 'paid', 'cancelled'];
const DEFAULT_FILTER = ['unpaid', 'advance_paid'];

router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;

  const stateQ = (req.query.state || '').trim();
  const limit  = Math.max(1, Math.min(100, parseInt(req.query.limit, 10)  || 20));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

  // Resolve state filter for the list view.
  let stateFilter;
  if (!stateQ) {
    stateFilter = DEFAULT_FILTER;
  } else if (stateQ === 'all') {
    stateFilter = null;
  } else if (ALLOWED_STATES.includes(stateQ)) {
    stateFilter = [stateQ];
  } else {
    return res.status(400).json({
      ok: false,
      error: `Invalid state. Must be one of: ${ALLOWED_STATES.join(', ')}, all.`,
    });
  }

  // Three parallel reads:
  //  1. Paginated invoice list per filter (the visible rows).
  //  2. Count of total rows matching the filter (for pagination metadata).
  //  3. ALL invoices (any state) for the summary block aggregation.

  let listQuery = supabase.from('invoices')
    .select('id, invoice_number, client_name, amount_total, amount_paid, state, due_date, created_at')
    .eq('vendor_id', vendor.id);

  let countQuery = supabase.from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendor.id);

  if (stateFilter) {
    listQuery  = listQuery.in('state', stateFilter);
    countQuery = countQuery.in('state', stateFilter);
  }

  listQuery = listQuery
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const summaryQuery = supabase.from('invoices')
    .select('amount_total, amount_paid, state')
    .eq('vendor_id', vendor.id);

  const [
    { data: rows,         error: listErr },
    { count,              error: countErr },
    { data: allInvoices,  error: summaryErr },
  ] = await Promise.all([listQuery, countQuery, summaryQuery]);

  if (listErr || countErr || summaryErr) {
    console.error('[GET /vendor/invoices] supabase error:', (listErr || countErr || summaryErr).message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  // Aggregate summary (over full invoice set, ignoring the list filter).
  let totalOutstanding = 0;
  let totalCollected   = 0;
  for (const inv of (allInvoices || [])) {
    if (inv.state === 'unpaid' || inv.state === 'advance_paid') {
      totalOutstanding += (inv.amount_total || 0) - (inv.amount_paid || 0);
    }
    totalCollected += (inv.amount_paid || 0);
  }

  // Shape per-row response — adds amount_owed.
  const invoices = (rows || []).map(inv => ({
    id:             inv.id,
    invoice_number: inv.invoice_number,
    client_name:    inv.client_name,
    amount_total:   inv.amount_total,
    amount_paid:    inv.amount_paid,
    amount_owed:    (inv.amount_total || 0) - (inv.amount_paid || 0),
    state:          inv.state,
    due_date:       inv.due_date,
    created_at:     inv.created_at,
  }));

  return res.json({
    ok:       true,
    invoices,
    summary: {
      total_outstanding: totalOutstanding,
      total_collected:   totalCollected,
    },
    total: count || 0,
  });
});

// PATCH /:invoiceId/cancel
// Direct cancel from list UI — no chat involved.
router.patch('/:invoiceId/cancel', requireAuth, async (req, res) => {
  const supabase   = req.app.locals.supabase;
  const { user_id } = req.auth;
  const { invoiceId } = req.params;

  // Resolve vendor
  const { data: userRow } = await supabase.from('users').select('id').eq('id', user_id).maybeSingle();
  if (!userRow) return res.status(403).json({ ok: false, error: 'User not found.' });
  const { data: vendorRow } = await supabase.from('vendors').select('id').eq('user_id', user_id).maybeSingle();
  if (!vendorRow) return res.status(403).json({ ok: false, error: 'Vendor not found.' });

  const { data: inv, error: fetchErr } = await supabase
    .from('invoices').select('id, invoice_number, client_name, state')
    .eq('id', invoiceId).eq('vendor_id', vendorRow.id).single();

  if (fetchErr?.code === 'PGRST116' || !inv) return res.status(404).json({ ok: false, error: 'Invoice not found.' });
  if (fetchErr) return res.status(500).json({ ok: false, error: fetchErr.message });
  if (inv.state === 'cancelled') return res.json({ ok: true, already_cancelled: true, message: `${inv.invoice_number} was already cancelled.` });
  if (inv.state === 'paid') return res.status(400).json({ ok: false, error: 'Cannot cancel a fully paid invoice.' });

  const { error: cancelErr } = await supabase
    .from('invoices').update({ state: 'cancelled' })
    .eq('id', invoiceId).eq('vendor_id', vendorRow.id);

  if (cancelErr) return res.status(500).json({ ok: false, error: cancelErr.message });

  console.log(`[invoices:cancel] ${inv.invoice_number} cancelled by vendor ${vendorRow.id}`);
  return res.json({ ok: true, message: `${inv.client_name}'s invoice ${inv.invoice_number} cancelled.` });
});

module.exports = router;
