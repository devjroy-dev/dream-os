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
const { executeAndPatch } = require('../../lib/executeAndPatch');
const isErr = (r) => !!r && typeof r.display === 'string' && r.display.startsWith('ERROR');

// shape a money-IN binder as the invoice response object (matches the list view).
function binderToInvoiceShape(b) {
  return {
    id:             b.id,
    invoice_number: null,
    client_name:    b.client,
    amount_total:   b.amount,
    amount_paid:    b.amount_received,
    amount_owed:    (Number(b.amount) || 0) - (Number(b.amount_received) || 0),
    state:          deriveInvoiceState(b),
    due_date:       null,
    created_at:     b.created_at,
  };
}
async function readBinderAsInvoice(eng, agentId, id) {
  const { data } = await eng.from('records')
    .select('id, client, amount, amount_received, amount_pending, hidden, created_at')
    .eq('agent_id', agentId).eq('id', id).maybeSingle();
  return data ? binderToInvoiceShape(data) : null;
}

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

router.patch('/:invoiceId/cancel', requireAuth, resolveVendor(), resolveAgent(), asyncHandler(async (req, res) => {
  // 6-C(ii) — cancel = donna_hide (reversible via unarchive). A fully-paid
  // invoice cannot be cancelled (mirrors the prior guard).
  const eng      = req.app.locals.supabase.schema('engine');
  const agentId  = req.agentId;
  const binderId = req.params.invoiceId;

  const { data: binder, error: readErr } = await eng.from('records')
    .select('id, amount, amount_received, hidden')
    .eq('agent_id', agentId).eq('id', binderId).maybeSingle();
  if (readErr) return errRes(res, 500, readErr.message);
  if (!binder)  return errRes(res, 404, 'Invoice not found.');
  if (binder.hidden) return okRes(res, { already_cancelled: true });
  if (deriveInvoiceState(binder) === 'paid') return errRes(res, 400, 'Cannot cancel a fully paid invoice.');

  const r = await executeAndPatch(agentId, 'donna_hide', { binder_id: binderId });
  if (isErr(r)) return errRes(res, 400, r.display);
  return okRes(res, { invoice: { id: binderId, state: 'cancelled' } });
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

router.post('/', requireAuth, resolveVendor(), resolveAgent(), asyncHandler(async (req, res) => {
  // 6-C(ii) — create through Donna: client binder + money 'in' (+ witnessed
  // advance split). invoice_number + PDF deferred to "generate invoice".
  const eng     = req.app.locals.supabase.schema('engine');
  const agentId = req.agentId;
  const b       = req.body || {};

  if (!b.client_name || !String(b.client_name).trim()) return errRes(res, 400, 'client_name is required.');
  const total = Number(b.amount_total);
  if (!total || total <= 0) return errRes(res, 400, 'amount_total must be greater than zero.');
  const advance = b.amount_advance != null ? Number(b.amount_advance) : null;
  if (advance != null && advance < 0)     return errRes(res, 400, 'amount_advance cannot be negative.');
  if (advance != null && advance > total) return errRes(res, 400, 'amount_advance cannot exceed amount_total.');

  const opened = await executeAndPatch(agentId, 'donna_client', { client: String(b.client_name).trim() });
  if (isErr(opened)) return errRes(res, 400, opened.display);
  const binderId = opened.item && opened.item.ref_id;
  if (!binderId) return errRes(res, 500, 'Could not open binder.');

  if (b.client_phone) await executeAndPatch(agentId, 'donna_phone', { binder_id: binderId, phone: b.client_phone });
  const noteBits = [b.description, b.notes, b.due_date ? `Due: ${b.due_date}` : null].filter(Boolean);
  if (noteBits.length) await executeAndPatch(agentId, 'donna_note', { binder_id: binderId, note: noteBits.join(' — ') });
  await executeAndPatch(agentId, 'donna_stage', { binder_id: binderId, stage: 'client' });

  await executeAndPatch(agentId, 'donna_money', { binder_id: binderId, amount: String(total), direction: 'in' });
  if (advance != null && advance > 0) {
    await executeAndPatch(agentId, 'donna_money_edit', {
      binder_id:       binderId,
      amount_received: advance,
      amount_pending:  total - advance,
      payment_status:  advance >= total ? 'paid' : 'partial',
    });
  }

  const invoice = await readBinderAsInvoice(eng, agentId, binderId);
  return okRes(res, { invoice, pdf_url: null, pdf_pending: true });
}));

// ─── PATCH /api/v2/vendor/invoices/:invoiceId ─────────────────────────
//
// Update invoice fields. Locked after any payment (amount_paid > 0).
// Auth: requireAuth. resolveVendor mode C via invoices table.

router.patch('/:invoiceId', requireAuth, resolveVendor(), resolveAgent(), asyncHandler(async (req, res) => {
  // 6-C(ii) — update through Donna. Locked after any payment (mirrors prior).
  // Non-money -> donna_edit / donna_note; money (amount_total) -> donna_money_edit.
  const eng      = req.app.locals.supabase.schema('engine');
  const agentId  = req.agentId;
  const binderId = req.params.invoiceId;
  const b        = req.body || {};

  const { data: binder, error: readErr } = await eng.from('records')
    .select('id, amount_received')
    .eq('agent_id', agentId).eq('id', binderId).maybeSingle();
  if (readErr) return errRes(res, 500, readErr.message);
  if (!binder)  return errRes(res, 404, 'Invoice not found.');
  if (Number(binder.amount_received) > 0) return errRes(res, 409, 'Invoice locked after payment.', 'LOCKED');

  const edit = {};
  if (b.client_name  != null) edit.client = String(b.client_name);
  if (b.client_phone != null) edit.phone  = String(b.client_phone);
  if (Object.keys(edit).length) {
    const r = await executeAndPatch(agentId, 'donna_edit', { binder_id: binderId, ...edit });
    if (isErr(r)) return errRes(res, 400, r.display);
  }
  const noteBits = [b.description, b.notes, b.due_date ? `Due: ${b.due_date}` : null].filter(Boolean);
  if (noteBits.length) await executeAndPatch(agentId, 'donna_note', { binder_id: binderId, note: noteBits.join(' — ') });
  if (b.amount_total != null) {
    const r = await executeAndPatch(agentId, 'donna_money_edit', { binder_id: binderId, amount: String(b.amount_total) });
    if (isErr(r)) return errRes(res, 400, r.display);
  }

  const invoice = await readBinderAsInvoice(eng, agentId, binderId);
  return okRes(res, { invoice });
}));

// ─── POST /api/v2/vendor/invoices/:invoiceId/payments ─────────────────
//
// Record a payment. Calls the record_payment Postgres function.
// Auth: requireAuth. resolveVendor mode C via invoices table.

router.post('/:invoiceId/payments', requireAuth, resolveVendor(), resolveAgent(), asyncHandler(async (req, res) => {
  // 6-C(ii) — payment through the witnessed money door. Read-before-write:
  // read the binder's current received, compute new ABSOLUTES, then write them.
  const eng      = req.app.locals.supabase.schema('engine');
  const agentId  = req.agentId;
  const binderId = req.params.invoiceId;

  const amount = Number((req.body || {}).amount);
  if (!amount || amount <= 0) return errRes(res, 400, 'amount must be greater than zero.');

  const { data: binder, error: readErr } = await eng.from('records')
    .select('id, amount, amount_received, hidden')
    .eq('agent_id', agentId).eq('id', binderId).maybeSingle();
  if (readErr) return errRes(res, 500, readErr.message);
  if (!binder)  return errRes(res, 404, 'Invoice not found.');

  const total           = Number(binder.amount) || 0;
  const receivedCurrent = Number(binder.amount_received) || 0;
  const receivedNew     = receivedCurrent + amount;
  const pendingNew      = Math.max(0, total - receivedNew);
  const status          = (total > 0 && receivedNew >= total) ? 'paid' : 'partial';

  const r = await executeAndPatch(agentId, 'donna_money_edit', {
    binder_id:       binderId,
    amount_received: receivedNew,
    amount_pending:  pendingNew,
    payment_status:  status,
  });
  if (isErr(r)) return errRes(res, 400, r.display);

  const invoice = await readBinderAsInvoice(eng, agentId, binderId);
  return okRes(res, { invoice, payment_recorded: amount, new_state: invoice.state });
}));

// ─── GET /api/v2/vendor/invoices/:invoiceId/pdf ────────────────────────
//
// Returns the signed Supabase storage URL for the invoice PDF.
// Auth: requireAuth. resolveVendor mode C via invoices table.

// ── generateInvoiceForBinder ───────────────────────────────────────────────
// The ONE "generate invoice" routine (number + PDF), reused by the pwa /pdf door
// and (later) the chat donna_invoice signal. Idempotent: if a formal invoice
// already exists for this binder, returns it WITHOUT assigning a new number.
// The binder (engine.records, direction in) is the money record; this stamps the
// formal numbered document onto it via the proven base-vendor flow + invoices bucket.
async function generateInvoiceForBinder(supabase, vendor, binder) {
  // 1 — idempotent ONLY while the figures are unchanged. A binder accrues several
  // invoices across its life (advance, then balance updates) — vendors run ~3-4
  // payments per booking. Fetch the LATEST invoice for this binder and reuse it
  // only if its amount_paid + amount_total still match the binder's live money.
  // If the money has moved since, that stored PDF is STALE — fall through to mint
  // a FRESH numbered invoice (TDW/.../03) at current figures. Numbers may inflate
  // per booking; that's accepted. What must never happen is serving a stale
  // document whose balance no longer matches the account.
  const { data: existingRows } = await supabase
    .from('invoices')
    .select('id, invoice_number, pdf_url, client_name, amount_total, amount_advance, amount_paid, due_date')
    .eq('binder_id', binder.id).eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })
    .limit(1);
  const latest = (existingRows && existingRows[0]) || null;
  const stillCurrent = latest
    && Number(latest.amount_paid)  === (Number(binder.amount_received) || 0)
    && Number(latest.amount_total) === (Number(binder.amount) || 0);

  let invoice = stillCurrent ? latest : null;

  // 2 — no row yet: create the formal invoice (assigns the next series number)
  if (!invoice) {
    const created = await createInvoice(supabase, vendor.id, {
      client_name:    binder.client || 'Client',
      client_phone:   binder.phone  || null,
      description:    binder.note    || null,
      amount_total:   Number(binder.amount) || 0,
      amount_advance: Number(binder.amount_received) || null,
      due_date:       null,
    });
    if (!created.ok) return created;
    invoice = created.invoice;
    // Link to the money-record binder AND set amount_paid from what's actually
    // been received. createInvoice hardcodes amount_paid:0, but the PDF computes
    // balance = amount_total - amount_paid, so the received money must land here
    // (else "Balance due" shows the full total). amount_advance drives the
    // "received" line; amount_paid drives the balance + UPI QR.
    const received = Number(binder.amount_received) || 0;
    await supabase.from('invoices')
      .update({ binder_id: binder.id, amount_paid: received })
      .eq('id', invoice.id);
    invoice.amount_paid = received;   // keep the in-memory object truthful for the render
  }

  // 3 — already has a stored PDF? serve it (idempotent, no re-render needed)
  if (invoice.pdf_url) {
    return { ok: true, invoice_number: invoice.invoice_number, pdf_url: invoice.pdf_url };
  }

  // 4 — render + store the PDF (proven base-vendor path, invoices bucket)
  const pdfUrl = await generateAndStoreInvoicePdf(supabase, vendor, invoice);
  if (!pdfUrl) return { ok: false, error: 'PDF generation failed.' };
  return { ok: true, invoice_number: invoice.invoice_number, pdf_url: pdfUrl };
}


router.get('/:invoiceId/pdf', requireAuth, resolveVendor(), resolveAgent(), asyncHandler(async (req, res) => {
  // "Generate invoice" (pwa path): :invoiceId is a binder id. Read the money
  // binder, then generate-or-serve the formal numbered PDF (idempotent).
  const supabase = req.app.locals.supabase;
  const eng      = supabase.schema('engine');
  const agentId  = req.agentId;
  const vendor   = req.vendor;
  const binderId = req.params.invoiceId;

  const { data: binder, error } = await eng.from('records')
    .select('id, client, phone, amount, amount_received, note')
    .eq('agent_id', agentId).eq('id', binderId).maybeSingle();
  if (error)   return errRes(res, 500, error.message);
  if (!binder) return errRes(res, 404, 'Invoice not found.');
  if (!Number(binder.amount) || Number(binder.amount) <= 0)
    return errRes(res, 400, 'This invoice has no amount yet — add the amount before generating the PDF.', 'NO_AMOUNT');

  const result = await generateInvoiceForBinder(supabase, vendor, binder);
  if (!result.ok) return errRes(res, 500, result.error || 'Could not generate invoice PDF.');
  return okRes(res, { pdf_url: result.pdf_url, invoice_number: result.invoice_number, expires_in: 3600 });
}));

module.exports = router;
module.exports.generateInvoiceForBinder = generateInvoiceForBinder;
