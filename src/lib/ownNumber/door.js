'use strict';
// src/lib/ownNumber/door.js · CE-45 · G6-1 · 2a · WHAT THE ROOM IS TOLD (FK1's wire, FE_1 at dreamos-pwa 24923aa).
// { open, reason, reason_text, launch, number } beside `ok`. FE_1 validates it and renders the shell on
// anything it cannot read, so a failure here is dark, never a broken screen.
//
// ⚠ WALK MODE IS THE ONLY WAY THIS DOOR OPENS IN 2a (read-first F2, ruled; c-45.3: a scope stated in
// prose carries a mechanism, and this is it). `open` is true ONLY when flag.own_number reads 'armed' AND
// the vendor is the one named in OWN_NUMBER_WALK_VENDOR_ID. The status 'on' is deliberately NOT
// honoured: until 2b a couple writing to a connected number gets no reply, so no real vendor may
// connect. 2b is the cut that edits `openFor` below; nothing else may.
//
// The per-tier rows (flag.own_number.<tier>, seeded by 0171, FQ3) are read and REPORTED here so the
// switchboard's state is visible in the door's reason, but they gate nothing until 2b.
//
// ⚠ A NUMBER ON FILE IS SHOWN WHETHER OR NOT THE DOOR IS OPEN: a vendor whose number is connected must
// always see its state, pause included (§7b constraint 3).
const cap = require('../capabilities');
const { graphVersion } = require('./meta');

const MASTER = 'flag.own_number';
const TIERS = ['basic', 'essential', 'signature', 'prestige'];
const tierKey = (tier) => (TIERS.includes(tier) ? `${MASTER}.${tier}` : null);

function parseExtras(raw) {
  if (!raw) return null;
  try { const o = JSON.parse(raw); return o && typeof o === 'object' && !Array.isArray(o) ? o : null; } catch (_e) { return null; }
}

/** The launch values, from Railway only. Missing either id means there is nothing to launch. */
function launchFrom(env = process.env) {
  const app_id = env.META_APP_ID || '';
  const config_id = env.OWN_NUMBER_CONFIG_ID || '';
  if (!/^\d{5,20}$/.test(app_id) || !/^\d{5,20}$/.test(config_id)) return null;
  return {
    app_id, config_id, graph_version: graphVersion(env),
    extras: { shared: parseExtras(env.OWN_NUMBER_EXTRAS_SHARED), moved: parseExtras(env.OWN_NUMBER_EXTRAS_MOVED) },
  };
}

/** THE GATE. Pure: the two switch rows, the vendor, the env. 2b edits this function and no other. */
function openFor({ masterRow, vendorId, env = process.env }) {
  const walkVendor = env.OWN_NUMBER_WALK_VENDOR_ID || '';
  const status = masterRow ? masterRow.status : null;
  if (status === 'armed' && walkVendor && vendorId === walkVendor) return { open: true, reason: null };
  if (!masterRow) return { open: false, reason: `${MASTER} has no row on the switchboard` };
  if (status === 'armed') return { open: false, reason: `${MASTER} is armed for the walk vendor only` };
  if (status === 'on') return { open: false, reason: `${MASTER} is on, but 2a honours walk mode only (2b opens it)` };
  return { open: false, reason: `${MASTER} is ${status} on the switchboard` };
}

function numberView(row) {
  if (!row) return null;
  return { status: row.status, display_number: row.display_number, way: row.connect_way, quality_rating: row.quality_rating || null };
}

async function answer({ vendor, supabase, env = process.env, capApi = cap }) {
  const masterRow = await capApi.get(MASTER);
  const tk = tierKey(vendor && vendor.tier);
  const tierRow = tk ? await capApi.get(tk) : null;
  const gate = openFor({ masterRow, vendorId: vendor && vendor.id, env });
  const launch = gate.open ? launchFrom(env) : null;
  const open = gate.open && !!launch;
  const reason = gate.open && !launch ? 'META_APP_ID or OWN_NUMBER_CONFIG_ID is not set on this service' : gate.reason;
  const { data, error } = await supabase.from('vendor_wabas')
    .select('status, display_number, connect_way, quality_rating')
    .eq('vendor_id', vendor.id).maybeSingle();
  if (error) throw new Error(`vendor_wabas read: ${error.message}`);
  return {
    open,
    reason: open ? null : `${reason}${tk ? ` · ${tk} is ${tierRow ? tierRow.status : 'absent'}` : ''}`,
    reason_text: open ? null : 'This opens once we finish connecting the service.',
    launch: open ? launch : null,
    number: numberView(data),
  };
}

module.exports = { answer, openFor, launchFrom, tierKey, numberViewFrom: numberView, MASTER, TIERS };
