'use strict';
// src/api/vendor/leadPackages.js
//
// TDW · CE-43 · LC-2 · packet 2 · THE PACKAGE ON A LEAD (the quote's copy).
//   GET  /api/v2/vendor/leads/:leadId/package  → { ok, lead_package: row | null }
//   POST /api/v2/vendor/leads/:leadId/package  → { ok, lead_package } | 422 { ok:false, error, code|field }
//
// F22 (a): a router of its own. The leads detail envelope is untouched, so the lead gate
// (src/lib/vendor/leadSerializer.js, b36) never sees these keys. Mounted in core.js ABOVE
// `./leads`, the invoiceSchedule pattern: `leads.js` owns `GET /:vendorId` and several
// `/:leadId/...` routes, and adjacency is the whole guarantee that this path is reached first.
//
// F23: the per-couple edits are name, description, line items, fee and handover date. The
// vendor's package row is READ, never written (R-43.3). The lead_packages row holds a
// snapshot of the package with those edits applied, plus the schedule computed by
// src/lib/vendor/packageSchedule.js computeSchedule, and delivery_on.
//
// RE-ATTACH (the order, and what a half-failure leaves): the live row is soft-deleted FIRST,
// then the new row is inserted, because uq_lead_packages_live allows one live row per lead.
// If the insert fails after the delete, the lead has no live package and the vendor attaches
// again; nothing downstream reads a deleted row. Promotion (packet 3) reads only the live row.
//
// REFUSALS (422): `no_fee`, `no_wedding_date` (absent, or not day-precision, F24),
// `no_handover_date` (F25), `bad_package`, and `invalid` with the field. The PWA maps codes to
// the vetoed A9 bytes; this door carries no words.
//
// COLUMN WITNESS: public.lead_packages and public.vendor_packages, 0168 statements 1 and 5;
// public.leads id(1) vendor_id(2) wedding_date(6) deleted_at(20) wedding_date_precision(24),
// docs/db/PUBLIC_SCHEMA.md at ladder 0168.

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { computeSchedule, isDateKey } = require('../../lib/vendor/packageSchedule');
const { istTodayStr } = require('../../lib/istDay');
const { validatePackage } = require('./packages');
const resolveAgent  = require('../middleware/resolveAgent');
const { promoteLead } = require('../../lib/vendor/promotion');

const LEAD_PACKAGE_SELECT =
  'id, lead_id, package_id, snapshot, total, schedule, delivery_on, quoted_at, created_at, updated_at';
const SNAPSHOT_KEYS = ['name', 'description', 'line_items', 'deposit_pct', 'middle_pct',
  'middle_enabled', 'delivery_basis', 'delivery_days'];
const EDITABLE = ['name', 'description', 'line_items', 'total', 'delivery_on'];

async function readLiveLeadPackage(supabase, vendorId, leadId) {
  return supabase
    .from('lead_packages')
    .select(LEAD_PACKAGE_SELECT)
    .eq('lead_id', leadId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .maybeSingle();
}

router.get('/:leadId/package', requireAuth, resolveVendor({ paramName: 'leadId', via: 'leads' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await readLiveLeadPackage(supabase, req.vendor.id, req.params.leadId);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { lead_package: data || null });
}));

// ── attachPackage · the attach act, one home ────────────────────────────────────────
// CE-43 · LC-2 · packet 3: lifted out of the route unchanged so POST /clients/direct
// (src/api/vendor/clients.js) attaches through the same code. Returns
// { status, body } for the caller to send; nothing here writes a response.
async function attachPackage(supabase, vendor, leadId, rawBody) {
  const body = rawBody || {};
  const unknown = Object.keys(body).filter((k) => k !== 'package_id' && !EDITABLE.includes(k));
  if (unknown.length) return { status: 422, body: { ok: false, error: 'invalid', field: unknown[0] } };
  if (typeof body.package_id !== 'string' || !body.package_id) return { status: 422, body: { ok: false, error: 'invalid', field: 'package_id' } };

  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('id, vendor_id, wedding_date, wedding_date_precision, deleted_at')
    .eq('id', leadId)
    .eq('vendor_id', vendor.id)
    .maybeSingle();
  if (leadErr) return { status: 500, body: { ok: false, error: leadErr.message } };
  if (!lead || lead.deleted_at) return { status: 404, body: { ok: false, error: 'Not found.' } };

  const { data: pkg, error: pkgErr } = await supabase
    .from('vendor_packages')
    .select('id, name, description, line_items, total, deposit_pct, middle_pct, middle_enabled, delivery_basis, delivery_days, seeded_from')
    .eq('id', body.package_id)
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null)
    .maybeSingle();
  if (pkgErr) return { status: 500, body: { ok: false, error: pkgErr.message } };
  if (!pkg) return { status: 422, body: { ok: false, error: 'invalid', field: 'package_id' } };

  // The snapshot: the package, with the couple's edits laid over it (F23), validated as a
  // package so the same CHECKs hold on the copy.
  const merged = { ...pkg };
  for (const k of ['name', 'description', 'line_items', 'total']) {
    if (Object.prototype.hasOwnProperty.call(body, k)) merged[k] = body[k];
  }
  const v = validatePackage(merged);
  if (!v.ok) return { status: 422, body: { ok: false, error: 'invalid', field: v.field } };
  if (body.delivery_on != null && !isDateKey(body.delivery_on)) return { status: 422, body: { ok: false, error: 'invalid', field: 'delivery_on' } };

  const today = istTodayStr(new Date());
  const sched = computeSchedule({
    ...v.row,
    wedding_date: lead.wedding_date,
    wedding_date_precision: lead.wedding_date_precision,
    delivery_on: body.delivery_on == null ? null : body.delivery_on,
    today,
  });
  if (!sched.ok) return { status: 422, body: { ok: false, error: 'refused', code: sched.code } };

  const snapshot = { source_package_id: pkg.id, source_seeded_from: pkg.seeded_from || null, tells: sched.tells };
  for (const k of SNAPSHOT_KEYS) snapshot[k] = v.row[k];

  const now = new Date().toISOString();
  const { error: delErr } = await supabase
    .from('lead_packages')
    .update({ deleted_at: now, updated_at: now })
    .eq('lead_id', leadId)
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null);
  if (delErr) return { status: 500, body: { ok: false, error: delErr.message } };

  const { data, error } = await supabase
    .from('lead_packages')
    .insert({
      vendor_id: vendor.id,
      lead_id: leadId,
      package_id: pkg.id,
      snapshot,
      total: v.row.total,
      schedule: sched.rows,
      delivery_on: sched.delivery_on,
    })
    .select(LEAD_PACKAGE_SELECT)
    .single();
  if (error) {
    console.error(`[lead-package] vendor=${vendor.id} lead=${leadId} insert failed after the live row was cleared: ${error.message}`);
    return { status: 500, body: { ok: false, error: error.message } };
  }
  return { status: 200, body: { ok: true, lead_package: data } };
}

router.post('/:leadId/package', requireAuth, resolveVendor({ paramName: 'leadId', via: 'leads' }), asyncHandler(async (req, res) => {
  const r = await attachPackage(req.app.locals.supabase, req.vendor, req.params.leadId, req.body);
  return res.status(r.status).json(r.body);
}));

// ── POST /:leadId/promote · THE BOOKING ACT (CE-43 · LC-2 · packet 3) ────────────────
//   body { kind: 'advance_paid' | 'booking_confirmed', advance_received_on?: YYYY-MM-DD }
//   → 200 { ok, promoted } | 422 { ok:false, error:'refused', code } | 422 invalid field
//   | 500 { ok:false, error:'promotion_failed', step }
// One home: src/lib/vendor/promotion.js promoteLead. This door carries no words (F26); the
// PWA maps A9's codes and reads F29 for anything else.
router.post('/:leadId/promote', requireAuth, resolveVendor({ paramName: 'leadId', via: 'leads' }), resolveAgent(), asyncHandler(async (req, res) => {
  const body = req.body || {};
  const r = await promoteLead(req.app.locals.supabase, {
    vendor: req.vendor,
    agentId: req.agentId,
    leadId: req.params.leadId,
    kind: body.kind,
    advanceReceivedOn: body.advance_received_on,
  });
  return res.status(r.status).json(r.body);
}));

module.exports = router;
module.exports.attachPackage = attachPackage;
module.exports.LEAD_PACKAGE_SELECT = LEAD_PACKAGE_SELECT;
