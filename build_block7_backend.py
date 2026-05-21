#!/usr/bin/env python3
"""
Block 7 backend deploy script.
Drop in dream-os root. Run: python3 build_block7_backend.py
Creates:
  src/lib/vendor/schedules.js
  src/lib/vendor/contracts.js
  src/lib/vendor/tds.js
  src/api/vendor/schedules.js
  src/api/vendor/contracts.js
  src/api/vendor/tds.js
Patches:
  src/api/vendor/core.js     — mount 3 new routers
  src/agent/pwaTools.js      — 6 new tools
  src/agent/pwaEngine.js     — 6 tool case handlers
  src/cron.js                — draft contract cleanup
"""
import os, sys

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"  WROTE  {path}")

def patch(path, old, new, label):
    with open(path, 'r') as f:
        src = f.read()
    if old not in src:
        print(f"  ERROR  {path}: anchor not found for [{label}]")
        sys.exit(1)
    with open(path, 'w') as f:
        f.write(src.replace(old, new, 1))
    print(f"  PATCHED {path} [{label}]")

print("\n=== Block 7: Schedules / Contracts / TDS backend ===\n")

# ─────────────────────────────────────────────────────────────────────────────
# 1. src/lib/vendor/schedules.js
# ─────────────────────────────────────────────────────────────────────────────
write('src/lib/vendor/schedules.js', """\
// src/lib/vendor/schedules.js
// Shared write logic for payment schedules.
// Called by REST handlers and pwaEngine tool executors.
'use strict';

// ── createSchedule ────────────────────────────────────────────────────────
async function createSchedule(supabase, vendorId, invoiceId, milestones) {
  if (!Array.isArray(milestones) || milestones.length === 0)
    return { ok: false, error: 'milestones array is required.' };

  const totalPct = milestones.reduce((s, m) => s + Number(m.pct || 0), 0);
  if (Math.abs(totalPct - 100) > 0.01)
    return { ok: false, error: `Milestone percentages must sum to 100. Got ${totalPct}.` };

  // Fetch invoice — verify ownership and state
  const { data: inv, error: invErr } = await supabase
    .from('invoices').select('id, vendor_id, amount_total, amount_paid, state, has_schedule')
    .eq('id', invoiceId).eq('vendor_id', vendorId).maybeSingle();
  if (invErr) return { ok: false, error: invErr.message };
  if (!inv) return { ok: false, error: 'Invoice not found.' };
  if (inv.state === 'cancelled') return { ok: false, error: 'Cannot add schedule to a cancelled invoice.' };
  if (inv.has_schedule) return { ok: false, error: 'This invoice already has a schedule. Delete it first.' };
  if (inv.amount_paid > 0) return { ok: false, error: 'Cannot add a schedule once payments have been recorded.' };

  const rows = milestones.map((m, idx) => ({
    invoice_id:      invoiceId,
    vendor_id:       vendorId,
    milestone_label: String(m.label || m.milestone_label || `Milestone ${idx + 1}`).trim(),
    pct:             Number(m.pct),
    amount_due:      Math.round(inv.amount_total * Number(m.pct) / 100),
    due_date:        m.due_date || null,
    ordinal:         idx + 1,
    state:           'pending',
  }));

  const { data, error } = await supabase.from('payment_schedules').insert(rows).select();
  if (error) return { ok: false, error: error.message };

  await supabase.from('invoices').update({ has_schedule: true }).eq('id', invoiceId);
  return { ok: true, schedule: data };
}

// ── markMilestonePaid ─────────────────────────────────────────────────────
// Updates milestone state AND bumps invoice amount_paid atomically (JS-level).
async function markMilestonePaid(supabase, vendorId, milestoneId, amountPaid) {
  if (!amountPaid || amountPaid <= 0) return { ok: false, error: 'amount_paid must be greater than zero.' };

  const { data: ms, error: msErr } = await supabase
    .from('payment_schedules').select('*')
    .eq('id', milestoneId).eq('vendor_id', vendorId).maybeSingle();
  if (msErr) return { ok: false, error: msErr.message };
  if (!ms) return { ok: false, error: 'Milestone not found.' };
  if (ms.state === 'paid') return { ok: false, error: 'Milestone is already paid.' };
  if (ms.state === 'waived') return { ok: false, error: 'Milestone is waived — cannot mark paid.' };

  // Fetch parent invoice
  const { data: inv, error: invErr } = await supabase
    .from('invoices').select('id, amount_total, amount_paid, state')
    .eq('id', ms.invoice_id).eq('vendor_id', vendorId).maybeSingle();
  if (invErr || !inv) return { ok: false, error: 'Parent invoice not found.' };
  if (inv.state === 'cancelled') return { ok: false, error: 'Parent invoice is cancelled.' };

  // Update milestone
  const { error: msUpErr } = await supabase.from('payment_schedules').update({
    state:       'paid',
    paid_at:     new Date().toISOString(),
    paid_amount: amountPaid,
  }).eq('id', milestoneId);
  if (msUpErr) return { ok: false, error: msUpErr.message };

  // Update invoice amount_paid + state
  const newAmountPaid = inv.amount_paid + amountPaid;
  const newState = newAmountPaid >= inv.amount_total ? 'paid'
    : inv.state === 'unpaid' ? 'advance_paid'
    : inv.state;

  const { data: invUpdated, error: invUpErr } = await supabase.from('invoices').update({
    amount_paid: newAmountPaid,
    state:       newState,
    updated_at:  new Date().toISOString(),
  }).eq('id', inv.id).select().single();
  if (invUpErr) return { ok: false, error: invUpErr.message };

  const { data: msUpdated } = await supabase.from('payment_schedules')
    .select('*').eq('id', milestoneId).single();

  return { ok: true, milestone: msUpdated, invoice: invUpdated };
}

// ── deleteSchedule ────────────────────────────────────────────────────────
async function deleteSchedule(supabase, vendorId, invoiceId) {
  const { data: paid } = await supabase.from('payment_schedules')
    .select('id').eq('invoice_id', invoiceId).eq('vendor_id', vendorId).eq('state', 'paid');
  if (paid && paid.length > 0)
    return { ok: false, error: 'Cannot delete a schedule with paid milestones.' };

  const { error } = await supabase.from('payment_schedules')
    .delete().eq('invoice_id', invoiceId).eq('vendor_id', vendorId);
  if (error) return { ok: false, error: error.message };

  await supabase.from('invoices').update({ has_schedule: false }).eq('id', invoiceId);
  return { ok: true };
}

module.exports = { createSchedule, markMilestonePaid, deleteSchedule };
""")

# ─────────────────────────────────────────────────────────────────────────────
# 2. src/lib/vendor/contracts.js
# ─────────────────────────────────────────────────────────────────────────────
write('src/lib/vendor/contracts.js', """\
// src/lib/vendor/contracts.js
// Shared write logic for vendor contracts.
'use strict';

const BUCKET = 'contracts';

// ── getUploadUrl ──────────────────────────────────────────────────────────
// Two-phase upload: create draft row, return signed upload URL.
async function getUploadUrl(supabase, vendorId, { title, clientId, leadId, invoiceId, filename }) {
  if (!title || !title.trim()) return { ok: false, error: 'title is required.' };
  if (!filename || !filename.trim()) return { ok: false, error: 'filename is required.' };

  // Create draft row first to get a contract_id
  const { data: row, error: rowErr } = await supabase.from('contracts').insert({
    vendor_id:  vendorId,
    title:      title.trim(),
    client_id:  clientId  || null,
    lead_id:    leadId    || null,
    invoice_id: invoiceId || null,
    state:      'draft',
  }).select().single();
  if (rowErr) return { ok: false, error: rowErr.message };

  const storagePath = `${vendorId}/${row.id}.pdf`;

  const { data: urlData, error: urlErr } = await supabase.storage
    .from(BUCKET).createSignedUploadUrl(storagePath);
  if (urlErr) {
    // Clean up the draft row
    await supabase.from('contracts').delete().eq('id', row.id);
    return { ok: false, error: 'Could not generate upload URL: ' + urlErr.message };
  }

  // Store path so finalize knows where to look
  await supabase.from('contracts').update({ storage_path: storagePath }).eq('id', row.id);

  return {
    ok:          true,
    contract_id: row.id,
    upload_url:  urlData.signedUrl,
    token:       urlData.token,
    expires_in:  300,
  };
}

// ── finalizeContract ──────────────────────────────────────────────────────
async function finalizeContract(supabase, vendorId, contractId) {
  const { data: row, error: rowErr } = await supabase.from('contracts')
    .select('*').eq('id', contractId).eq('vendor_id', vendorId).maybeSingle();
  if (rowErr) return { ok: false, error: rowErr.message };
  if (!row) return { ok: false, error: 'Contract not found.' };
  if (!row.storage_path) return { ok: false, error: 'No upload path recorded.' };

  // Try to get file metadata from storage
  const pathParts = row.storage_path.split('/');
  const folder    = pathParts.slice(0, -1).join('/');
  const fname     = pathParts[pathParts.length - 1];

  let fileSize = null;
  try {
    const { data: files } = await supabase.storage.from(BUCKET).list(folder);
    const match = (files || []).find(f => f.name === fname);
    if (match) fileSize = match.metadata?.size || null;
  } catch (_) {}

  const { data, error } = await supabase.from('contracts').update({
    file_size:  fileSize,
    state:      'draft',
    updated_at: new Date().toISOString(),
  }).eq('id', contractId).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, contract: data };
}

// ── getDownloadUrl ────────────────────────────────────────────────────────
async function getDownloadUrl(supabase, vendorId, contractId) {
  const { data: row } = await supabase.from('contracts')
    .select('storage_path').eq('id', contractId).eq('vendor_id', vendorId).maybeSingle();
  if (!row || !row.storage_path) return { ok: false, error: 'Contract or file not found.' };

  const { data, error } = await supabase.storage
    .from(BUCKET).createSignedUrl(row.storage_path, 3600);
  if (error) return { ok: false, error: error.message };
  return { ok: true, download_url: data.signedUrl, expires_in: 3600 };
}

// ── attachFromUrl ─────────────────────────────────────────────────────────
// WhatsApp path: download file from external URL, upload to storage, create row.
async function attachFromUrl(supabase, vendorId, { title, clientId, fileUrl }) {
  const https = require('https');
  const http  = require('http');

  const contractId  = require('crypto').randomUUID();
  const storagePath = `${vendorId}/${contractId}.pdf`;

  // Download file
  const buffer = await new Promise((resolve, reject) => {
    const proto = fileUrl.startsWith('https') ? https : http;
    proto.get(fileUrl, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });

  // Upload to storage
  const { error: upErr } = await supabase.storage
    .from(BUCKET).upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false });
  if (upErr) return { ok: false, error: 'Storage upload failed: ' + upErr.message };

  // Create row
  const { data, error } = await supabase.from('contracts').insert({
    id:           contractId,
    vendor_id:    vendorId,
    client_id:    clientId || null,
    title:        title || 'Contract',
    storage_path: storagePath,
    file_size:    buffer.length,
    state:        'draft',
  }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, contract: data };
}

// ── cleanupDraftContracts ─────────────────────────────────────────────────
// Cron helper: delete draft contracts older than 24h with no storage_path,
// or where the file never landed.
async function cleanupDraftContracts(supabase) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: stale } = await supabase.from('contracts')
    .select('id, storage_path').eq('state', 'draft').lt('created_at', cutoff);

  let cleaned = 0;
  for (const row of (stale || [])) {
    if (row.storage_path) {
      await supabase.storage.from(BUCKET).remove([row.storage_path]);
    }
    await supabase.from('contracts').delete().eq('id', row.id);
    cleaned++;
  }
  return cleaned;
}

module.exports = { getUploadUrl, finalizeContract, getDownloadUrl, attachFromUrl, cleanupDraftContracts };
""")

# ─────────────────────────────────────────────────────────────────────────────
# 3. src/lib/vendor/tds.js
# ─────────────────────────────────────────────────────────────────────────────
write('src/lib/vendor/tds.js', """\
// src/lib/vendor/tds.js
// Shared write logic for TDS ledger.
'use strict';

function currentFinancialYear() {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  if (month >= 4) return `FY${year}-${String(year + 1).slice(2)}`;
  return `FY${year - 1}-${String(year).slice(2)}`;
}

// ── createEntry ───────────────────────────────────────────────────────────
async function createEntry(supabase, vendorId, params) {
  const {
    invoice_id, client_id, client_name, client_pan, client_tan,
    gross_amount, tds_rate, section, deduction_date,
    financial_year, certificate_no, notes,
  } = params;

  if (!client_name || !client_name.trim()) return { ok: false, error: 'client_name is required.' };
  if (!gross_amount || gross_amount <= 0)  return { ok: false, error: 'gross_amount must be greater than zero.' };
  if (tds_rate == null || tds_rate < 0)    return { ok: false, error: 'tds_rate is required and must be >= 0.' };
  if (!deduction_date)                      return { ok: false, error: 'deduction_date is required (YYYY-MM-DD).' };

  const tds_amount  = Math.round(gross_amount * tds_rate / 100);
  const net_received = gross_amount - tds_amount;
  if (net_received <= 0) return { ok: false, error: 'net_received must be greater than zero.' };

  const fy = financial_year || currentFinancialYear();

  const { data, error } = await supabase.from('tds_ledger').insert({
    vendor_id:      vendorId,
    invoice_id:     invoice_id     || null,
    client_id:      client_id      || null,
    client_name:    client_name.trim(),
    client_pan:     client_pan     || null,
    client_tan:     client_tan     || null,
    gross_amount,
    tds_rate,
    tds_amount,
    net_received,
    section:        section        || null,
    deduction_date,
    financial_year: fy,
    certificate_no: certificate_no || null,
    notes:          notes          || null,
  }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, entry: data };
}

// ── getSummary ────────────────────────────────────────────────────────────
async function getSummary(supabase, vendorId, financialYear) {
  const fy = financialYear || currentFinancialYear();
  const { data, error } = await supabase.from('tds_ledger')
    .select('gross_amount, tds_amount, net_received, section')
    .eq('vendor_id', vendorId).eq('financial_year', fy);
  if (error) return { ok: false, error: error.message };

  const rows = data || [];
  const bySection = {};
  let totalGross = 0, totalTds = 0, totalNet = 0;
  for (const r of rows) {
    totalGross += r.gross_amount;
    totalTds   += r.tds_amount;
    totalNet   += r.net_received;
    const sec = r.section || 'Unknown';
    if (!bySection[sec]) bySection[sec] = { section: sec, gross: 0, tds: 0, count: 0 };
    bySection[sec].gross += r.gross_amount;
    bySection[sec].tds   += r.tds_amount;
    bySection[sec].count += 1;
  }

  return {
    ok: true,
    financial_year: fy,
    total_gross:    totalGross,
    total_tds:      totalTds,
    total_net:      totalNet,
    entry_count:    rows.length,
    by_section:     Object.values(bySection),
  };
}

module.exports = { createEntry, getSummary, currentFinancialYear };
""")

# ─────────────────────────────────────────────────────────────────────────────
# 4. src/api/vendor/schedules.js
# ─────────────────────────────────────────────────────────────────────────────
write('src/api/vendor/schedules.js', """\
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
""")

# ─────────────────────────────────────────────────────────────────────────────
# 5. src/api/vendor/contracts.js
# ─────────────────────────────────────────────────────────────────────────────
write('src/api/vendor/contracts.js', """\
// src/api/vendor/contracts.js
// POST   /api/v2/vendor/contracts/upload-url           — get signed upload URL
// POST   /api/v2/vendor/contracts/:id/finalize         — finalize after upload
// GET    /api/v2/vendor/contracts                      — list contracts
// GET    /api/v2/vendor/contracts/:id/download         — signed download URL
// PATCH  /api/v2/vendor/contracts/:id                  — update metadata
// POST   /api/v2/vendor/contracts/:id/send             — mark sent
// DELETE /api/v2/vendor/contracts/:id                  — soft delete (cancelled)
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { getUploadUrl, finalizeContract, getDownloadUrl } = require('../../lib/vendor/contracts');

const authMw = [requireAuth, resolveVendor()];

// POST /upload-url — must be before /:id routes
router.post('/upload-url', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { title, client_id, lead_id, invoice_id, filename } = req.body || {};
  const result = await getUploadUrl(supabase, req.vendor.id, { title, clientId: client_id, leadId: lead_id, invoiceId: invoice_id, filename });
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { contract_id: result.contract_id, upload_url: result.upload_url, expires_in: result.expires_in });
}));

// GET / — list
router.get('/', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { client_id, lead_id, state } = req.query;
  let q = supabase.from('contracts').select('*')
    .eq('vendor_id', req.vendor.id)
    .neq('state', 'cancelled')
    .order('created_at', { ascending: false });
  if (client_id) q = q.eq('client_id', client_id);
  if (lead_id)   q = q.eq('lead_id', lead_id);
  if (state)     q = q.eq('state', state);
  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { contracts: data || [], total: (data || []).length });
}));

// POST /:id/finalize
router.post('/:contractId/finalize', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result = await finalizeContract(supabase, req.vendor.id, req.params.contractId);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { contract: result.contract });
}));

// GET /:id/download
router.get('/:contractId/download', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result = await getDownloadUrl(supabase, req.vendor.id, req.params.contractId);
  if (!result.ok) return errRes(res, 404, result.error);
  return okRes(res, { download_url: result.download_url, expires_in: result.expires_in });
}));

// PATCH /:id
router.patch('/:contractId', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const allowed  = ['title', 'notes', 'state', 'client_id', 'lead_id', 'invoice_id', 'signed_at'];
  const updates  = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  if (!Object.keys(updates).length) return errRes(res, 400, 'No valid fields provided.');
  const { data, error } = await supabase.from('contracts')
    .update(updates).eq('id', req.params.contractId).eq('vendor_id', req.vendor.id)
    .select().single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Contract not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { contract: data });
}));

// POST /:id/send
router.post('/:contractId/send', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result   = await getDownloadUrl(supabase, req.vendor.id, req.params.contractId);
  if (!result.ok) return errRes(res, 404, result.error);

  const { data, error } = await supabase.from('contracts')
    .update({ state: 'sent', sent_at: new Date().toISOString() })
    .eq('id', req.params.contractId).eq('vendor_id', req.vendor.id)
    .select().single();
  if (error) return errRes(res, 500, error.message);

  return okRes(res, { contract: data, download_url: result.download_url });
}));

// DELETE /:id — soft delete
router.delete('/:contractId', ...authMw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('contracts')
    .update({ state: 'cancelled' })
    .eq('id', req.params.contractId).eq('vendor_id', req.vendor.id)
    .select().single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Contract not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { contract: data });
}));

module.exports = router;
""")

# ─────────────────────────────────────────────────────────────────────────────
# 6. src/api/vendor/tds.js
# ─────────────────────────────────────────────────────────────────────────────
write('src/api/vendor/tds.js', """\
// src/api/vendor/tds.js
// GET  /api/v2/vendor/tds/:vendorId          — list entries
// POST /api/v2/vendor/tds                    — create entry
// PATCH /api/v2/vendor/tds/:entryId          — update
// DELETE /api/v2/vendor/tds/:entryId         — hard delete
// GET  /api/v2/vendor/tds/:vendorId/summary  — FY aggregate
// GET  /api/v2/vendor/tds/:vendorId/export   — CSV download
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { createEntry, getSummary, currentFinancialYear } = require('../../lib/vendor/tds');

// GET /:vendorId/summary — must be before /:vendorId
router.get('/:vendorId/summary', requireAuth, resolveVendor({ paramName: 'vendorId' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const fy = req.query.financial_year || currentFinancialYear();
  const result = await getSummary(supabase, req.vendor.id, fy);
  if (!result.ok) return errRes(res, 500, result.error);
  return okRes(res, result);
}));

// GET /:vendorId/export — CSV
router.get('/:vendorId/export', requireAuth, resolveVendor({ paramName: 'vendorId' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const fy = req.query.financial_year;
  if (!fy) return errRes(res, 400, 'financial_year query param is required.');

  const { data, error } = await supabase.from('tds_ledger')
    .select('*').eq('vendor_id', req.vendor.id).eq('financial_year', fy)
    .order('deduction_date', { ascending: true });
  if (error) return errRes(res, 500, error.message);

  const handle = req.vendor.routing_handle || 'VENDOR';
  const cols   = ['Deduction Date','Financial Year','Client Name','PAN','TAN','Section','Gross Amount','TDS Rate','TDS Amount','Net Received','Certificate No','Notes'];
  const rows   = (data || []).map(r => [
    r.deduction_date, r.financial_year, r.client_name, r.client_pan || '', r.client_tan || '',
    r.section || '', r.gross_amount, r.tds_rate, r.tds_amount, r.net_received,
    r.certificate_no || '', r.notes || '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

  const csv = [cols.join(','), ...rows].join('\\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="tds-${fy}-${handle}.csv"`);
  return res.send(csv);
}));

// GET /:vendorId — list
router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { financial_year, client_id, from, to } = req.query;
  let q = supabase.from('tds_ledger').select('*')
    .eq('vendor_id', req.vendor.id)
    .order('deduction_date', { ascending: false });
  if (financial_year) q = q.eq('financial_year', financial_year);
  if (client_id)      q = q.eq('client_id', client_id);
  if (from)           q = q.gte('deduction_date', from);
  if (to)             q = q.lte('deduction_date', to);
  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { entries: data || [], total: (data || []).length });
}));

// POST / — create
router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const result = await createEntry(supabase, req.vendor.id, req.body || {});
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { entry: result.entry });
}));

// PATCH /:entryId — update
router.patch('/:entryId', requireAuth, resolveVendor({ paramName: 'entryId', via: 'tds_ledger' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const allowed  = ['client_name','client_pan','client_tan','gross_amount','tds_rate',
                    'section','deduction_date','financial_year','certificate_no','notes'];
  const updates  = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  if (!Object.keys(updates).length) return errRes(res, 400, 'No valid fields provided.');

  // Recompute tds_amount + net_received if rate or gross changes
  const gross = updates.gross_amount;
  const rate  = updates.tds_rate;
  if (gross !== undefined || rate !== undefined) {
    const { data: cur } = await supabase.from('tds_ledger').select('gross_amount, tds_rate')
      .eq('id', req.params.entryId).single();
    if (cur) {
      const g = gross !== undefined ? gross : cur.gross_amount;
      const r = rate  !== undefined ? rate  : cur.tds_rate;
      updates.tds_amount   = Math.round(g * r / 100);
      updates.net_received = g - updates.tds_amount;
    }
  }

  const { data, error } = await supabase.from('tds_ledger')
    .update(updates).eq('id', req.params.entryId).eq('vendor_id', req.vendor.id)
    .select().single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'TDS entry not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { entry: data });
}));

// DELETE /:entryId — hard delete
router.delete('/:entryId', requireAuth, resolveVendor({ paramName: 'entryId', via: 'tds_ledger' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { error } = await supabase.from('tds_ledger')
    .delete().eq('id', req.params.entryId).eq('vendor_id', req.vendor.id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

module.exports = router;
""")

# ─────────────────────────────────────────────────────────────────────────────
# 7. Patch core.js — mount 3 new routers
# ─────────────────────────────────────────────────────────────────────────────
patch(
    'src/api/vendor/core.js',
    "router.use('/studio',      require('./studio/index'));",
    "router.use('/studio',      require('./studio/index'));\nrouter.use('/',            require('./schedules'));\nrouter.use('/contracts',   require('./contracts'));\nrouter.use('/tds',         require('./tds'));",
    "mount schedules/contracts/tds routers"
)

# ─────────────────────────────────────────────────────────────────────────────
# 8. Patch pwaTools.js — 6 new tools before clarify
# ─────────────────────────────────────────────────────────────────────────────
NEW_TOOLS = """
  // ── Block 7: Schedules / Contracts / TDS ──────────────────────────────────

  {
    name: 'create_schedule',
    description: 'Create a milestone-based payment schedule on an invoice. Use when vendor says "split this invoice into 30/40/30" or mentions booking/shoot/delivery payment stages. Milestones must sum to 100%.',
    input_schema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string', description: 'UUID of the invoice to attach the schedule to.' },
        milestones: {
          type: 'array',
          description: 'List of payment milestones. Must sum to 100%.',
          items: {
            type: 'object',
            properties: {
              label:    { type: 'string', description: 'Milestone name. e.g. "Booking", "Shoot day", "Delivery"' },
              pct:      { type: 'number', description: 'Percentage of total invoice. e.g. 30 for 30%.' },
              due_date: { type: 'string', description: 'Due date in YYYY-MM-DD. Optional.' },
            },
            required: ['label', 'pct'],
          },
        },
      },
      required: ['invoice_id', 'milestones'],
    },
  },

  {
    name: 'mark_milestone_paid',
    description: 'Mark a payment schedule milestone as paid and update the parent invoice amount. Use when vendor says "Priya paid the booking amount" or "milestone 1 received". Also updates the invoice running total.',
    input_schema: {
      type: 'object',
      properties: {
        milestone_id: { type: 'string', description: 'UUID of the milestone to mark paid.' },
        amount_paid:  { type: 'number', description: 'Amount received in Rs. May differ from amount_due (partial/negotiated).' },
      },
      required: ['milestone_id', 'amount_paid'],
    },
  },

  {
    name: 'attach_contract',
    description: 'Save a contract PDF forwarded by the vendor on WhatsApp. Downloads the file from the media URL and stores it. Use when vendor forwards a PDF and says "save this as X\\'s contract."',
    input_schema: {
      type: 'object',
      properties: {
        title:     { type: 'string',  description: 'Contract title. e.g. "Booking contract — Priya Kapoor"' },
        client_id: { type: 'string',  description: 'UUID of the client to link. Optional.' },
        file_url:  { type: 'string',  description: 'Twilio media URL for the PDF attachment.' },
      },
      required: ['title', 'file_url'],
    },
  },

  {
    name: 'list_contracts',
    description: 'List the vendor\\'s saved contracts. Use when vendor asks "show me contracts" or "do I have a contract for Priya?"',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Filter by client UUID. Optional.' },
      },
    },
  },

  {
    name: 'log_tds',
    description: 'Log a Tax Deducted at Source entry. Use when vendor says "ABC Corp deducted 10% TDS on Rs 1 lakh" or "log TDS from Infosys". Computes tds_amount and net_received automatically. Returns running FY totals.',
    input_schema: {
      type: 'object',
      properties: {
        client_name:     { type: 'string', description: 'Name of the company that deducted TDS.' },
        gross_amount:    { type: 'number', description: 'Gross invoice amount before TDS deduction in Rs.' },
        tds_rate:        { type: 'number', description: 'TDS rate as percentage. e.g. 10 for 10%.' },
        deduction_date:  { type: 'string', description: 'Date TDS was deducted, YYYY-MM-DD. Defaults to today.' },
        section:         { type: 'string', description: 'Income tax section. e.g. "194J" for professional services, "194C" for contractors.' },
        financial_year:  { type: 'string', description: 'Financial year string. e.g. "FY2026-27". Defaults to current FY.' },
        invoice_id:      { type: 'string', description: 'UUID of related invoice. Optional.' },
        client_id:       { type: 'string', description: 'UUID of related client. Optional.' },
        client_pan:      { type: 'string', description: 'Deductor PAN. e.g. "AABCS1234X". Optional.' },
        client_tan:      { type: 'string', description: 'Deductor TAN. e.g. "DELS01234C". Optional.' },
        certificate_no:  { type: 'string', description: 'TDS certificate / Form 16A number. Optional.' },
      },
      required: ['client_name', 'gross_amount', 'tds_rate'],
    },
  },

  {
    name: 'query_tds_summary',
    description: 'Get TDS summary for a financial year — total gross, total TDS deducted, net received, breakdown by section. Use when vendor asks "how much TDS this year?" or "what\\'s my total deduction for FY2026-27?"',
    input_schema: {
      type: 'object',
      properties: {
        financial_year: { type: 'string', description: 'e.g. "FY2026-27". Defaults to current Indian FY if omitted.' },
      },
    },
  },

"""

patch(
    'src/agent/pwaTools.js',
    "  // ── Studio Suite — Prestige only ───────────────────────────────────────────",
    NEW_TOOLS + "  // ── Studio Suite — Prestige only ───────────────────────────────────────────",
    "insert 6 Block 7 tools"
)

# ─────────────────────────────────────────────────────────────────────────────
# 9. Patch pwaEngine.js — 6 tool cases before the Studio Suite section
# ─────────────────────────────────────────────────────────────────────────────
TOOL_CASES = """
    // ── Block 7: Schedules / Contracts / TDS ─────────────────────────────────

    case 'create_schedule': {
      const { createSchedule } = require('./../../lib/vendor/schedules');
      const result = await createSchedule(supabase, vendor.id, input.invoice_id, input.milestones);
      if (!result.ok) return err(result.error);
      console.log(`[pwa-tool:create_schedule] invoice ${input.invoice_id} — ${result.schedule.length} milestones`);
      return write(JSON.stringify({ schedule: result.schedule }));
    }

    case 'mark_milestone_paid': {
      const { markMilestonePaid } = require('./../../lib/vendor/schedules');
      const result = await markMilestonePaid(supabase, vendor.id, input.milestone_id, input.amount_paid);
      if (!result.ok) return err(result.error);
      console.log(`[pwa-tool:mark_milestone_paid] milestone ${input.milestone_id} Rs ${input.amount_paid}`);
      return write(JSON.stringify({ milestone: result.milestone, invoice: result.invoice }));
    }

    case 'attach_contract': {
      const { attachFromUrl } = require('./../../lib/vendor/contracts');
      const result = await attachFromUrl(supabase, vendor.id, {
        title:    input.title,
        clientId: input.client_id || null,
        fileUrl:  input.file_url,
      });
      if (!result.ok) return err(result.error);
      console.log(`[pwa-tool:attach_contract] "${input.title}" saved`);
      return write(JSON.stringify({ contract: result.contract }));
    }

    case 'list_contracts': {
      let q = supabase.from('contracts').select('id, title, state, client_id, created_at')
        .eq('vendor_id', vendor.id).neq('state', 'cancelled')
        .order('created_at', { ascending: false }).limit(20);
      if (input.client_id) q = q.eq('client_id', input.client_id);
      const { data, error: qErr } = await q;
      if (qErr) return err(qErr.message);
      console.log(`[pwa-tool:list_contracts] ${(data || []).length} contracts`);
      return ok(JSON.stringify({ contracts: data || [], total: (data || []).length }));
    }

    case 'log_tds': {
      const { createEntry, getSummary, currentFinancialYear } = require('./../../lib/vendor/tds');
      const params = {
        ...input,
        deduction_date: input.deduction_date || new Date().toISOString().slice(0, 10),
        financial_year: input.financial_year || currentFinancialYear(),
      };
      const result = await createEntry(supabase, vendor.id, params);
      if (!result.ok) return err(result.error);
      // Return running FY totals for the agent to echo back
      const summary = await getSummary(supabase, vendor.id, params.financial_year);
      console.log(`[pwa-tool:log_tds] Rs ${input.gross_amount} gross — ${input.client_name}`);
      return write(JSON.stringify({
        entry: result.entry,
        fy_total_gross: summary.total_gross,
        fy_total_tds:   summary.total_tds,
        fy_total_net:   summary.total_net,
      }));
    }

    case 'query_tds_summary': {
      const { getSummary, currentFinancialYear } = require('./../../lib/vendor/tds');
      const fy = input.financial_year || currentFinancialYear();
      const result = await getSummary(supabase, vendor.id, fy);
      if (!result.ok) return err(result.error);
      console.log(`[pwa-tool:query_tds_summary] ${fy} — ${result.entry_count} entries`);
      return ok(JSON.stringify(result));
    }

"""

patch(
    'src/agent/pwaEngine.js',
    "    // ── Studio Suite — Prestige-gated tools ──────────────────────────────────",
    TOOL_CASES + "    // ── Studio Suite — Prestige-gated tools ──────────────────────────────────",
    "insert 6 Block 7 tool cases"
)

# ─────────────────────────────────────────────────────────────────────────────
# 10. Patch cron.js — draft contract cleanup
# ─────────────────────────────────────────────────────────────────────────────
patch(
    'src/cron.js',
    "function startCronJobs({ supabase }) {",
    """const { cleanupDraftContracts } = require('./lib/vendor/contracts');

function startCronJobs({ supabase }) {""",
    "import cleanupDraftContracts"
)

patch(
    'src/cron.js',
    "  // ── Morning briefing — 8:00am IST = 2:30am UTC ─────────────────",
    """  // ── Draft contract cleanup — 3:00am IST = 9:30pm UTC ──────────────
  cron.schedule('30 21 * * *', async () => {
    console.log('[cron:contracts] starting draft cleanup');
    try {
      const cleaned = await cleanupDraftContracts(supabase);
      console.log(`[cron:contracts] cleaned ${cleaned} stale draft contracts`);
    } catch (e) {
      console.error('[cron:contracts] cleanup error:', e.message);
    }
  });

  // ── Morning briefing — 8:00am IST = 2:30am UTC ─────────────────""",
    "add contract cleanup cron"
)

print("\n=== All files written and patches applied ===")
print("""
Next steps in dream-os Codespace:
  1. python3 build_block7_backend.py
  2. node --check src/lib/vendor/schedules.js
  3. node --check src/lib/vendor/contracts.js
  4. node --check src/lib/vendor/tds.js
  5. node --check src/api/vendor/schedules.js
  6. node --check src/api/vendor/contracts.js
  7. node --check src/api/vendor/tds.js
  8. node --check src/agent/pwaEngine.js
  9. node --check src/agent/pwaTools.js
  10. node --check src/cron.js
  11. git add -A && git commit -m "feat(block7): payment schedules, contracts, TDS — 16 endpoints + 6 agent tools"
  12. git push
""")
