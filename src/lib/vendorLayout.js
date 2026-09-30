'use strict';
// src/lib/vendorLayout.js · DESIGN-1 · THE LAYOUT SWITCH · THE ONE PREDICATE HOME.
//
// Which vendor layout a vendor sees: 'v2' (the redesign, DESIGN-1 stages 1 to 5) or 'classic' (today's, kept whole as
// the standby). The founder's rule (29 Sept 2026): a per-vendor setting with a global default, default OFF, switching
// back is one setting and no deploy, BOTH on the admin panel's Switchboard. CE-46 F3 (30 Sept 2026), ONE HOME:
//   · flag.vendor_layout_v2 ON (the Switchboard card's master, db/migrations/0185) → every vendor sees 'v2';
//   · otherwise a vendor whose row carries layout_v2 = true (0185 §3; added and removed on the same card) sees 'v2';
//   · everyone else sees 'classic'. No row, an unread switchboard, or a vendor row without the column all read
//     'classic' (fails closed).
// The Railway variable LAYOUT_V2_VENDOR_IDS of the first cut is RETIRED: nothing reads it.
// GET /api/v2/vendor/me carries the answer as `layout`; the pwa reads that field and nothing else.
const cap = require('./capabilities');

const FLAG = 'flag.vendor_layout_v2';
const COLUMN = 'layout_v2';
// the date the master was FIRST turned on, recorded once (its flipped_at); read by the admin panel, never a gate
const FIRST_ON = 'flag.vendor_layout_v2.first_on';
const KEEP_DAYS = 30;

/** 'v2' | 'classic' for this vendor's ROW (resolveVendor selects '*'). Synchronous, from the switchboard's warmed table
 *  (cap.on) and her own row. Never throws. Only a real true on the row counts: 'true', 1 and truthy junk read classic. */
function layoutFor(vendor) {
  try {
    if (cap.on(FLAG)) return 'v2';
    return vendor && typeof vendor === 'object' && vendor[COLUMN] === true ? 'v2' : 'classic';
  } catch (_e) {
    return 'classic';
  }
}

/**
 * THE MASTER, "New layout for everyone": one tap each way, through the switchboard's own flip (no deploy). Turning it on
 * for the first time records the date, once: the FIRST_ON row turns on and keeps that flipped_at for good.
 */
async function setMaster(to, by, opts = {}) {
  const r = await cap.flip(FLAG, to, by, opts);
  if (!r.ok || to !== 'on') return r;
  const mark = await cap.get(FIRST_ON, { ...opts, fresh: true });
  if (mark && mark.status !== 'on') await cap.flip(FIRST_ON, 'on', by, opts);
  return r;
}

/** What the admin panel shows beside the master: on or off, the first-on date, and the date the classic layout is kept until. */
async function masterState(opts = {}) {
  const row = await cap.get(FLAG, { ...opts, fresh: true });
  const mark = await cap.get(FIRST_ON, { ...opts, fresh: true });
  const firstOn = mark && mark.status === 'on' && mark.flipped_at ? mark.flipped_at : null;
  const keptUntil = firstOn ? new Date(Date.parse(firstOn) + KEEP_DAYS * 86400000).toISOString().slice(0, 10) : null;
  return { on: !!row && row.status === 'on', seeded: !!row, first_on_at: firstOn, classic_kept_until: keptUntil };
}

// ── THE PER-VENDOR LIST (CE-46 F3): read and written here only ───────────────────────────────────────────────────
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The vendors on the new layout while the master is off, oldest name first. { ok, vendors: [{ id, name, phone }] } */
async function listVendors({ supabase }) {
  const { data, error } = await supabase.from('vendors')
    .select('id, business_name, users!inner(name, phone)')
    .eq(COLUMN, true)
    .order('business_name', { ascending: true });
  if (error) return { ok: false, reason: 'read_failed', error: error.message };
  return { ok: true, vendors: (data || []).map((v) => ({ id: v.id, name: v.business_name || (v.users && v.users.name) || 'Unnamed', phone: (v.users && v.users.phone) || null })) };
}

/** Add (on true) or Remove (on false) one vendor. Writes exactly one column of exactly one row, or nothing. */
async function setVendor(vendorId, on, { supabase }) {
  if (typeof vendorId !== 'string' || !UUID.test(vendorId)) return { ok: false, reason: 'bad_vendor_id' };
  if (on !== true && on !== false) return { ok: false, reason: 'bad_on' };
  const { data, error } = await supabase.from('vendors').update({ [COLUMN]: on }).eq('id', vendorId).select('id');
  if (error) return { ok: false, reason: 'write_failed', error: error.message };
  if (!data || data.length !== 1) return { ok: false, reason: 'no_vendor' };
  return { ok: true };
}

module.exports = { layoutFor, setMaster, masterState, listVendors, setVendor, FLAG, FIRST_ON, COLUMN, KEEP_DAYS };
