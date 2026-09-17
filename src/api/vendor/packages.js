'use strict';
// src/api/vendor/packages.js
//
// TDW · CE-43 · LC-2 · THE PACKAGES ROOM'S DOOR.
//   GET    /api/v2/vendor/packages              → { ok, packages: [...with split], seeding }   (packet 1)
//   POST   /api/v2/vendor/packages              → { ok, package }                               (packet 2)
//   PATCH  /api/v2/vendor/packages/:id          → { ok, package }   edit and rename             (packet 2)
//   DELETE /api/v2/vendor/packages/:id          → { ok }            soft delete                 (packet 2)
//   POST   /api/v2/vendor/packages/:id/default  → { ok, package }                               (packet 2)
//
// PACKET 2. Every write validates against 0168's CHECKs before it reaches the database, so a
// refusal is a named 422 and not a constraint error. `split` on each listed package is the
// room's payment bar, computed by src/lib/vendor/packageSchedule.js splitShares (F21: shares
// until a fee is set, whole rupees after; never a date in the room).
//
// SET DEFAULT (ratified): clear the live default, then set the target. uq_vendor_packages_default
// refuses a racing second default; that is REPORTED as 409 `default_race`, never retried.
//
// Packet 1 ships the read only (the walk: DEV440 opens Packages and sees her
// category's seeds with the default marked). Add, edit, delete, rename and set
// default land in packet 2 behind controls that answer "Launching soon." until then
// (R-42.14). Package creation and editing are PWA acts (R-42.8); no engine hand
// reaches this router.
//
// SEEDING RIDES THE READ (F-43.50 arm (b)). ensureSeeded runs first and is
// FAIL-SOFT here: a seeding failure is logged and reported in `seeding`, and the
// list is still read and returned. A vendor is never shown an error page because
// the one-time copy failed; the next read tries again.
//
// ORDER. Seeded rows keep the vetoed order (seeded_from `<category>:<n>`), then the
// vendor's own rows by creation. The default is marked, not moved: the walk reads
// "the middle one marked Default".
//
// COLUMN WITNESS: public.vendor_packages is created by db/migrations/0168_vendor_packages.sql
// statement 1; every selected column below is declared there.

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { ensureSeeded } = require('../../lib/vendor/packageSeeds');
const { splitShares } = require('../../lib/vendor/packageSchedule');

// ── the write validator (0168 statement 1's CHECKs, in words the door can refuse with) ──
const BASES = ['on_the_day', 'days', 'handover'];
const WRITABLE = ['name', 'description', 'line_items', 'total', 'deposit_pct', 'middle_pct',
  'middle_enabled', 'delivery_basis', 'delivery_days'];

function cleanLineItems(v) {
  if (!Array.isArray(v) || v.length > 40) return null;
  const out = [];
  for (const it of v) {
    if (!it || typeof it !== 'object') return null;
    const label = typeof it.label === 'string' ? it.label.trim() : '';
    const detail = typeof it.detail === 'string' ? it.detail.trim() : '';
    if (!label || !detail) return null;
    out.push({ label, detail });
  }
  return out;
}

// Validates the MERGED row (current values under the body's), so a PATCH that touches one
// share is still checked against the other. Returns { ok, row } or { ok: false, field }.
//
// F-43.78 (CE-43 LC-2 P2b, the seat's defect): with the middle payment OFF, the middle share
// does not apply and is never a reason to refuse. An absent or invalid share is replaced by
// `fallbackMiddle` (the stored value on an edit, 30 on a new package), because 0168's CHECK
// still needs a stored share between 1 and 98. With the middle payment ON, it is checked as before.
function validatePackage(merged, fallbackMiddle = 30) {
  const row = {};
  const name = typeof merged.name === 'string' ? merged.name.trim() : '';
  if (!name || name.length > 120) return { ok: false, field: 'name' };
  row.name = name;
  if (merged.description != null && typeof merged.description !== 'string') return { ok: false, field: 'description' };
  row.description = (merged.description || '').trim();
  const items = cleanLineItems(merged.line_items == null ? [] : merged.line_items);
  if (!items) return { ok: false, field: 'line_items' };
  row.line_items = items;
  if (merged.total != null && !(Number.isInteger(merged.total) && merged.total > 0)) return { ok: false, field: 'total' };
  row.total = merged.total == null ? null : merged.total;
  if (!(Number.isInteger(merged.deposit_pct) && merged.deposit_pct >= 1 && merged.deposit_pct <= 99)) return { ok: false, field: 'deposit_pct' };
  if (typeof merged.middle_enabled !== 'boolean') return { ok: false, field: 'middle_enabled' };
  const middleValid = Number.isInteger(merged.middle_pct) && merged.middle_pct >= 1 && merged.middle_pct <= 98;
  if (!middleValid) {
    if (merged.middle_enabled) return { ok: false, field: 'middle_pct' };
    merged = { ...merged, middle_pct: fallbackMiddle };
  }
  if (merged.deposit_pct + (merged.middle_enabled ? merged.middle_pct : 0) >= 100) return { ok: false, field: 'remainder' };
  row.deposit_pct = merged.deposit_pct;
  row.middle_pct = merged.middle_pct;
  row.middle_enabled = merged.middle_enabled;
  if (!BASES.includes(merged.delivery_basis)) return { ok: false, field: 'delivery_basis' };
  row.delivery_basis = merged.delivery_basis;
  if (merged.delivery_basis === 'days') {
    if (!(Number.isInteger(merged.delivery_days) && merged.delivery_days >= 1 && merged.delivery_days <= 365)) return { ok: false, field: 'delivery_days' };
    row.delivery_days = merged.delivery_days;
  } else row.delivery_days = null;
  return { ok: true, row };
}

function pickWritable(body) {
  const out = {};
  for (const k of WRITABLE) if (body && Object.prototype.hasOwnProperty.call(body, k)) out[k] = body[k];
  return out;
}

const NEW_DEFAULTS = { description: '', line_items: [], total: null, deposit_pct: 30, middle_pct: 30,
  middle_enabled: true, delivery_basis: 'on_the_day', delivery_days: null };

async function readLive(supabase, vendorId, id) {
  const { data, error } = await supabase
    .from('vendor_packages')
    .select(PACKAGE_SELECT)
    .eq('id', id)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .maybeSingle();
  return { data, error };
}

const PACKAGE_SELECT =
  'id, name, description, line_items, total, deposit_pct, middle_pct, middle_enabled, ' +
  'delivery_basis, delivery_days, is_default, seeded_from, created_at, updated_at';

function withSplit(p) {
  return { ...p, split: splitShares(p) };
}

function seedIndex(p) {
  if (!p.seeded_from) return Number.POSITIVE_INFINITY;
  const n = Number(String(p.seeded_from).split(':')[1]);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

function orderPackages(rows) {
  return [...rows].sort((a, b) => {
    const ia = seedIndex(a);
    const ib = seedIndex(b);
    if (ia !== ib) return ia - ib;
    return String(a.created_at).localeCompare(String(b.created_at));
  });
}

router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;

  const seeding = await ensureSeeded(supabase, vendor);
  if (seeding.reason === 'read_failed' || seeding.reason === 'insert_failed') {
    console.error(`[packages:seed] vendor=${vendor.id} ${seeding.reason}: ${seeding.error}`);
  } else if (seeding.seeded) {
    console.log(`[packages:seed] vendor=${vendor.id} seeded ${seeding.count} (${seeding.category})`);
  }

  const { data, error } = await supabase
    .from('vendor_packages')
    .select(PACKAGE_SELECT)
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null);
  if (error) return errRes(res, 500, error.message);

  return okRes(res, {
    packages: orderPackages(data || []).map(withSplit),
    seeding: { seeded: !!seeding.seeded, reason: seeding.seeded ? 'seeded' : seeding.reason },
  });
}));

router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  // Seed first, so a vendor who adds before her first read still receives her category's
  // options exactly once (F-43.50 arm (b)).
  await ensureSeeded(supabase, vendor);
  const v = validatePackage({ ...NEW_DEFAULTS, ...pickWritable(req.body) });
  if (!v.ok) return res.status(422).json({ ok: false, error: 'invalid', field: v.field });
  const { data, error } = await supabase
    .from('vendor_packages')
    .insert({ ...v.row, vendor_id: vendor.id, is_default: false, seeded_from: null })
    .select(PACKAGE_SELECT)
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { package: withSplit(data) });
}));

router.patch('/:id', requireAuth, resolveVendor({ paramName: 'id', via: 'vendor_packages' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const { data: cur, error: readErr } = await readLive(supabase, vendor.id, req.params.id);
  if (readErr) return errRes(res, 500, readErr.message);
  if (!cur) return errRes(res, 404, 'Not found.');
  const v = validatePackage({ ...cur, ...pickWritable(req.body) }, cur.middle_pct);
  if (!v.ok) return res.status(422).json({ ok: false, error: 'invalid', field: v.field });
  const { data, error } = await supabase
    .from('vendor_packages')
    .update({ ...v.row, updated_at: new Date().toISOString() })
    .eq('id', cur.id)
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null)
    .select(PACKAGE_SELECT)
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { package: withSplit(data) });
}));

// Soft delete. The default flag drops with it, so the partial index frees the slot; a
// deleted seed is never re-seeded (uq_vendor_packages_seed keeps its row). Quotes already
// attached keep their snapshot (lead_packages.package_id is SET NULL only on a hard delete,
// which nothing here does).
router.delete('/:id', requireAuth, resolveVendor({ paramName: 'id', via: 'vendor_packages' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('vendor_packages')
    .update({ deleted_at: now, updated_at: now, is_default: false })
    .eq('id', req.params.id)
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null)
    .select('id');
  if (error) return errRes(res, 500, error.message);
  if (!data || !data.length) return errRes(res, 404, 'Not found.');
  return okRes(res, {});
}));

router.post('/:id/default', requireAuth, resolveVendor({ paramName: 'id', via: 'vendor_packages' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const { data: target, error: readErr } = await readLive(supabase, vendor.id, req.params.id);
  if (readErr) return errRes(res, 500, readErr.message);
  if (!target) return errRes(res, 404, 'Not found.');
  if (target.is_default) return okRes(res, { package: withSplit(target) });
  const now = new Date().toISOString();
  const { error: clearErr } = await supabase
    .from('vendor_packages')
    .update({ is_default: false, updated_at: now })
    .eq('vendor_id', vendor.id)
    .eq('is_default', true)
    .is('deleted_at', null);
  if (clearErr) return errRes(res, 500, clearErr.message);
  const { data, error } = await supabase
    .from('vendor_packages')
    .update({ is_default: true, updated_at: now })
    .eq('id', target.id)
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null)
    .select(PACKAGE_SELECT)
    .single();
  if (error) {
    if (error.code === '23505') {
      console.warn(`[packages:default] vendor=${vendor.id} race on set default ${target.id}; reported, not retried`);
      return res.status(409).json({ ok: false, error: 'default_race' });
    }
    return errRes(res, 500, error.message);
  }
  return okRes(res, { package: withSplit(data) });
}));

module.exports = router;
module.exports.orderPackages = orderPackages;
module.exports.PACKAGE_SELECT = PACKAGE_SELECT;
module.exports.validatePackage = validatePackage;
module.exports.pickWritable = pickWritable;
