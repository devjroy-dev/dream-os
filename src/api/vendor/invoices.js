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
const asyncHandler         = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { createInvoice, updateInvoice } = require('../../lib/vendor/invoices');
const { generateInvoicePdf }  = require('../../lib/invoicePdf');
const { buildInvoiceMessage } = require('../../lib/invoiceMessage');

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
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null);

  let countQuery = supabase.from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null);

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
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null);

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
// ─── PATCH /api/v2/vendor/invoices/:invoiceId/cancel ──────────────────
//
// Cancel invoice. Preserved for dreamai list page CRUD.
// Auth: requireAuth. resolveVendor mode C via invoices table.

router.patch('/:invoiceId/cancel', requireAuth, resolveVendor({ paramName: 'invoiceId', via: 'invoices' }), asyncHandler(async (req, res) => {
  const supabase   = req.app.locals.supabase;
  const vendor     = req.vendor;
  const invoiceId  = req.params.invoiceId;

  const { data: inv, error: fetchErr } = await supabase
    .from('invoices').select('id, invoice_number, client_name, state')
    .eq('id', invoiceId).eq('vendor_id', vendor.id).is('deleted_at', null).single();

  if (fetchErr?.code === 'PGRST116' || !inv) return errRes(res, 404, 'Invoice not found.');
  if (fetchErr) return errRes(res, 500, fetchErr.message);
  if (inv.state === 'cancelled') return okRes(res, { already_cancelled: true });
  if (inv.state === 'paid') return errRes(res, 400, 'Cannot cancel a fully paid invoice.');

  const { error: cancelErr } = await supabase
    .from('invoices').update({ state: 'cancelled' })
    .eq('id', invoiceId).eq('vendor_id', vendor.id);

  if (cancelErr) return errRes(res, 500, cancelErr.message);
  console.log('[invoices:cancel] ' + inv.invoice_number + ' cancelled by vendor ' + vendor.id);
  return okRes(res, { invoice: { id: invoiceId, state: 'cancelled' } });
}));

// ─── POST /api/v2/vendor/invoices ──────────────────────────────────────
//
// Create invoice. Auto-assigns invoice_number. Counter never resets.
// Auth: requireAuth. resolveVendor mode A.

router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const body     = req.body || {};

  const result = await createInvoice(supabase, vendor.id, {
    client_name:    body.client_name    || null,
    client_phone:   body.client_phone   || null,
    client_id:      body.client_id      || null,
    lead_id:        body.lead_id        || null,
    description:    body.description    || null,
    amount_total:   body.amount_total   || null,
    amount_advance: body.amount_advance != null ? body.amount_advance : null,
    due_date:       body.due_date       || null,
    notes:          body.notes          || null,
  });

  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { invoice: result.invoice, pdf_pending: true });
}));

// ─── PATCH /api/v2/vendor/invoices/:invoiceId ─────────────────────────
//
// Update invoice fields. Locked after any payment (amount_paid > 0).
// Auth: requireAuth. resolveVendor mode C via invoices table.

router.patch('/:invoiceId', requireAuth, resolveVendor({ paramName: 'invoiceId', via: 'invoices' }), asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const vendor    = req.vendor;
  const invoiceId = req.params.invoiceId;
  const body      = req.body || {};

  const result = await updateInvoice(supabase, vendor.id, invoiceId, body);
  if (!result.ok && result.code) return errRes(res, 409, result.error, result.code);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { invoice: result.invoice });
}));

// ─── POST /api/v2/vendor/invoices/:invoiceId/payments ─────────────────
//
// Record a payment. Calls the record_payment Postgres function.
// Auth: requireAuth. resolveVendor mode C via invoices table.

router.post('/:invoiceId/payments', requireAuth, resolveVendor({ paramName: 'invoiceId', via: 'invoices' }), asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const vendor    = req.vendor;
  const invoiceId = req.params.invoiceId;
  const body      = req.body || {};

  const amount = Number(body.amount);
  if (!amount || amount <= 0) return errRes(res, 400, 'amount must be greater than zero.');

  const { data: result, error: fnErr } = await supabase
    .rpc('record_payment', { p_invoice_id: invoiceId, p_amount: amount });

  if (fnErr) return errRes(res, 500, fnErr.message);
  if (!result.ok) return errRes(res, 409, result.error);

  // Fetch updated invoice row
  const { data: inv } = await supabase
    .from('invoices')
    .select('id, invoice_number, client_name, amount_total, amount_paid, state, due_date')
    .eq('id', invoiceId).single();

  // Audit note (non-fatal)
  if (body.note) {
    const noteContent = 'Payment of Rs ' + amount + ' recorded on ' + (inv ? inv.invoice_number : invoiceId) + '. Note: ' + body.note;
    await supabase.from('notes').insert({
      vendor_id: vendor.id,
      content:   noteContent,
      tags:      ['payment', 'invoice'],
    });
  }

  console.log('[invoices:payment] Rs ' + amount + ' on ' + invoiceId + ' -> ' + result.state);
  return okRes(res, {
    invoice:          inv || null,
    payment_recorded: amount,
    new_state:        result.state,
  });
}));

// ─── GET /api/v2/vendor/invoices/:invoiceId/pdf ────────────────────────
//
// Returns the signed Supabase storage URL for the invoice PDF.
// Auth: requireAuth. resolveVendor mode C via invoices table.

router.get('/:invoiceId/pdf', requireAuth, resolveVendor({ paramName: 'invoiceId', via: 'invoices' }), asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const invoiceId = req.params.invoiceId;

  const { data: inv } = await supabase
    .from('invoices').select('id, pdf_url, invoice_number')
    .eq('id', invoiceId).maybeSingle();

  if (!inv || !inv.pdf_url) {
    return errRes(res, 404, 'PDF not generated yet. Try again in a moment.', 'PDF_PENDING');
  }

  return okRes(res, { pdf_url: inv.pdf_url, expires_in: 3600 });
}));

module.exports = router;
