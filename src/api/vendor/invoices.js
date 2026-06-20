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
const resolveAgent   = require('../middleware/resolveAgent');
const asyncHandler         = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { createInvoice, updateInvoice } = require('../../lib/vendor/invoices');
const { generateInvoicePdf }  = require('../../lib/invoicePdf');
const { buildInvoiceMessage } = require('../../lib/invoiceMessage');

// Per schema (SCHEMA.md lines 260-282): invoices.state CHECK constraint values.
const ALLOWED_STATES = ['unpaid', 'advance_paid', 'paid', 'cancelled'];
const DEFAULT_FILTER = ['unpaid', 'advance_paid'];

// 6-C(i) — invoice state is DERIVED from the binder's money figures.
// (engine payment_status is free-text, so we trust the numbers, like the cabinet.)
function deriveInvoiceState(b) {
  if (b.hidden) return 'cancelled';
  const total = Number(b.amount) || 0;
  const recd  = Number(b.amount_received) || 0;
  if (recd <= 0) return 'unpaid';
  if (total > 0 && recd >= total) return 'paid';
  return 'advance_paid';
}

router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), resolveAgent(), async (req, res) => {
  // 6-C(i) — invoices read Harvey/Donna's ledger: money-IN binders in
  // engine.records (direction 'in'). invoice_number + due_date are deferred to
  // the "generate invoice" piece (see ENGINE_PDF_TOOL_PENDING.md); the binder is
  // the money record. Founding-cohort scale: fetch all, derive/filter in JS.
  const eng     = req.app.locals.supabase.schema('engine');
  const agentId = req.agentId;

  const stateQ = (req.query.state || '').trim();
  const limit  = Math.max(1, Math.min(100, parseInt(req.query.limit, 10)  || 20));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

  const ALLOWED = ['unpaid', 'advance_paid', 'paid', 'cancelled'];
  const DEFAULT = ['unpaid', 'advance_paid'];
  let wanted;
  if (!stateQ)                       wanted = DEFAULT;
  else if (stateQ === 'all')         wanted = null;
  else if (ALLOWED.includes(stateQ)) wanted = [stateQ];
  else return res.status(400).json({ ok: false, error: `Invalid state. Must be one of: ${ALLOWED.join(', ')}, all.` });

  const { data: all, error } = await eng.from('records')
    .select('id, client, amount, amount_received, amount_pending, date, hidden, created_at')
    .eq('agent_id', agentId).eq('direction', 'in')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /vendor/invoices] engine read error:', error.message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  const rowsAll = (all || []).map(b => ({ ...b, _state: deriveInvoiceState(b) }));

  // summary over the full set (lifetime money view, ignores the list filter)
  let totalOutstanding = 0, totalCollected = 0;
  for (const b of rowsAll) {
    if (b._state === 'unpaid' || b._state === 'advance_paid') {
      totalOutstanding += (Number(b.amount) || 0) - (Number(b.amount_received) || 0);
    }
    totalCollected += (Number(b.amount_received) || 0);
  }

  const filtered = wanted ? rowsAll.filter(b => wanted.includes(b._state)) : rowsAll;
  const total    = filtered.length;
  const page     = filtered.slice(offset, offset + limit);

  const invoices = page.map(b => ({
    id:             b.id,
    invoice_number: null,
    client_name:    b.client,
    amount_total:   b.amount,
    amount_paid:    b.amount_received,
    amount_owed:    (Number(b.amount) || 0) - (Number(b.amount_received) || 0),
    state:          b._state,
    due_date:       null,
    created_at:     b.created_at,
  }));

  return res.json({
    ok:       true,
    invoices,
    summary: {
      total_outstanding: totalOutstanding,
      total_collected:   totalCollected,
    },
    total,
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

// Generate the invoice PDF, upload to the `invoices` storage bucket, set pdf_url.
// Best-effort: returns the signed URL on success, null on any failure (the invoice
// itself is already created — a PDF failure must never 500 the create call).
async function generateAndStoreInvoicePdf(supabase, vendor, invoice) {
  try {
    const { data: u } = await supabase
      .from('users').select('name').eq('id', vendor.user_id).maybeSingle();

    const pdfBuffer = await generateInvoicePdf({
      invoice,
      vendor,
      vendorName: u?.name || vendor.business_name || 'Vendor',
    });

    const fileName = `${vendor.id}/INVOICE-${invoice.invoice_number.replace(/^TDW\//, '').replace(/\//g, '-').toUpperCase()}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true });
    if (uploadErr) {
      console.error('[invoices:pdf] upload failed:', uploadErr.message);
      return null;
    }

    const { data: signed } = await supabase.storage
      .from('invoices')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);

    if (signed?.signedUrl) {
      await supabase.from('invoices').update({ pdf_url: signed.signedUrl }).eq('id', invoice.id);
      return signed.signedUrl;
    }
    return null;
  } catch (err) {
    console.error('[invoices:pdf] generation error:', err.message);
    return null;
  }
}

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

  // Generate the PDF synchronously so the vendor can download it immediately.
  const pdfUrl = await generateAndStoreInvoicePdf(supabase, vendor, result.invoice);

  return okRes(res, {
    invoice:  { ...result.invoice, pdf_url: pdfUrl },
    pdf_url:  pdfUrl,
    pdf_pending: !pdfUrl,
  });
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
