'use strict';
// src/api/vendor/packages.js
//
// TDW · CE-43 · LC-2 · packet 1 · THE PACKAGES ROOM'S READ.
//   GET /api/v2/vendor/packages   → { ok, packages: [...], seeding: {...} }
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

const PACKAGE_SELECT =
  'id, name, description, line_items, total, deposit_pct, middle_pct, middle_enabled, ' +
  'delivery_basis, delivery_days, is_default, seeded_from, created_at, updated_at';

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
    packages: orderPackages(data || []),
    seeding: { seeded: !!seeding.seeded, reason: seeding.seeded ? 'seeded' : seeding.reason },
  });
}));

module.exports = router;
module.exports.orderPackages = orderPackages;
module.exports.PACKAGE_SELECT = PACKAGE_SELECT;
