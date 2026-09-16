'use strict';
// src/lib/vendor/packageSeeds.js
//
// TDW · CE-43 · LC-2 · packet 1 · THE SEED, COPIED ONCE PER VENDOR, EVER.
//
// RULING (CE-43, F-43.50 arm (b)): vendors.category has four writers and may be
// null at sign-up (src/api/vendor/auth.js POST /provision, src/api/vendor/onboarding.js,
// src/agent/onboarding.js, src/api/admin/vendors.js), so "copy at sign-up" has no single
// home. ensureSeeded(supabase, vendor) is called on every package read and by the LC-2
// backfill instead. It copies the vendor's category's options from
// db/seeds/package_seeds.json the first time the vendor is seen with a mapped category,
// and never again: once any seeded row exists for the vendor, LIVE OR DELETED, it does
// nothing (R-43.3: after seeding the rows are hers; a vendor who deletes every seed is
// not re-seeded).
//
// THE GUARD IS THE DATABASE, NOT THIS READ. The read below is a fast path. Two first
// reads racing both see zero rows; both insert; uq_vendor_packages_seed (0168 statement 3)
// refuses the loser's whole multi-row insert (a single INSERT is atomic), and the loser
// reports `seeded: false, reason: 'already_seeded'`. [F-06.85: conditioned on
// 0168's uq_vendor_packages_seed. Mechanism: the 23505 branch below.]
//
// THE DEFAULT. The seed carries the ruled default per category (packageSeedParse.js,
// DEFAULT_OPTION). If the vendor already holds a live default (not possible before her
// first read today, named so a later door cannot surprise it), the seeded rows are all
// inserted without one, because uq_vendor_packages_default would refuse the batch.
//
// A category change later seeds nothing (the "ever" clause). A null or unmapped
// category seeds nothing and leaves the vendor unseeded, so a later read with a
// category set still seeds.

const path = require('path');

const SEED_PATH = path.join(__dirname, '..', '..', '..', 'db', 'seeds', 'package_seeds.json');
let SEEDS = null;
function loadSeeds() {
  if (!SEEDS) {
    // eslint-disable-next-line global-require
    const j = require(SEED_PATH);
    SEEDS = new Map(j.categories.map((c) => [c.category, c]));
  }
  return SEEDS;
}

// The columns a seed row writes, derived from the JSON only.
function seedRowsFor(vendorId, category) {
  const c = loadSeeds().get(category);
  if (!c) return [];
  return c.options.map((o) => ({
    vendor_id: vendorId,
    name: o.name,
    description: o.description,
    line_items: o.line_items,
    total: null,
    deposit_pct: c.deposit_pct,
    middle_pct: c.middle_pct,
    middle_enabled: c.middle_enabled,
    delivery_basis: c.delivery_basis,
    delivery_days: c.delivery_days,
    is_default: o.is_default,
    seeded_from: o.seed_key,
  }));
}

async function ensureSeeded(supabase, vendor) {
  const vendorId = vendor && vendor.id;
  if (!vendorId) return { seeded: false, reason: 'no_vendor' };
  const category = vendor.category ? String(vendor.category).trim() : '';
  if (!category) return { seeded: false, reason: 'no_category' };
  const rows = seedRowsFor(vendorId, category);
  if (!rows.length) return { seeded: false, reason: 'unmapped_category' };

  const { data: prior, error: priorErr } = await supabase
    .from('vendor_packages')
    .select('id')
    .eq('vendor_id', vendorId)
    .not('seeded_from', 'is', null)
    .limit(1);
  if (priorErr) return { seeded: false, reason: 'read_failed', error: priorErr.message };
  if (prior && prior.length) return { seeded: false, reason: 'already_seeded' };

  const { data: liveDefault, error: defErr } = await supabase
    .from('vendor_packages')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('is_default', true)
    .is('deleted_at', null)
    .limit(1);
  if (defErr) return { seeded: false, reason: 'read_failed', error: defErr.message };
  const insertRows = (liveDefault && liveDefault.length)
    ? rows.map((r) => ({ ...r, is_default: false }))
    : rows;

  const { error: insErr } = await supabase.from('vendor_packages').insert(insertRows);
  if (insErr) {
    if (insErr.code === '23505') return { seeded: false, reason: 'already_seeded' };
    return { seeded: false, reason: 'insert_failed', error: insErr.message };
  }
  return { seeded: true, count: insertRows.length, category };
}

module.exports = { ensureSeeded, seedRowsFor, loadSeeds, SEED_PATH };
