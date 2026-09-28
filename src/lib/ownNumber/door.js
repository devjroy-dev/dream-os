'use strict';
// src/lib/ownNumber/door.js · CE-45 · G6-1 · 2a · WHAT THE ROOM IS TOLD (FK1's wire, FE_1 at dreamos-pwa 24923aa).
// { open, reason, reason_text, launch, number } beside `ok`. FE_1 validates it and renders the shell on
// anything it cannot read, so a failure here is dark, never a broken screen.
//
// ⚠ THE ONE GATE (CE-46 G6-2 2b, the chair's F7 (a), 27 September 2026; `openFor` below, and nothing else).
// It opens for a vendor when EITHER:
//   · walk mode: flag.own_number reads 'armed' AND the vendor is OWN_NUMBER_WALK_VENDOR_ID (unchanged from 2a), OR
//   · flag.own_number reads 'on' AND her tier's row (flag.own_number.<tier>, seeded 'off' by 0171, FQ3) reads 'on'.
// 'on' without her tier's row 'on' stays shut. When the caller passes her number's `status` (the answering seam,
// src/lib/ownNumber/turn.js), the gate is also shut unless that status is 'active': a pending, suspended or
// migrated_out number never answers (§7b constraint 3). The door and the connect pass no status: they decide
// whether she may START connecting, before any row exists.
// R-45.32 still holds by DATA, not by code: flag.own_number stays off for every vendor but DEV440 until the
// founder's word after 2b's walk.
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

/** THE GATE. Pure: the switch rows, the vendor, the env, and (at the answering seam only) her number's status. */
function openFor({ masterRow, tierRow, vendorId, env = process.env, status }) {
  const walkVendor = env.OWN_NUMBER_WALK_VENDOR_ID || '';
  const master = masterRow ? masterRow.status : null;
  const tier = tierRow ? tierRow.status : null;
  const numberOk = status === undefined || status === 'active';
  const numberReason = `her number is ${status || 'not connected'}`;
  if (master === 'armed' && walkVendor && vendorId === walkVendor) return numberOk ? { open: true, reason: null } : { open: false, reason: numberReason };
  if (master === 'on' && tier === 'on') return numberOk ? { open: true, reason: null } : { open: false, reason: numberReason };
  if (!masterRow) return { open: false, reason: `${MASTER} has no row on the switchboard` };
  if (master === 'armed') return { open: false, reason: `${MASTER} is armed for the walk vendor only` };
  if (master === 'on') return { open: false, reason: `${MASTER} is on, but her tier's switch is ${tier || 'absent'}` };
  return { open: false, reason: `${MASTER} is ${master} on the switchboard` };
}

function numberView(row) {
  if (!row) return null;
  return { status: row.status, display_number: row.display_number, way: row.connect_way, quality_rating: row.quality_rating || null };
}

async function answer({ vendor, supabase, env = process.env, capApi = cap }) {
  const masterRow = await capApi.get(MASTER);
  const tk = tierKey(vendor && vendor.tier);
  const tierRow = tk ? await capApi.get(tk) : null;
  const gate = openFor({ masterRow, tierRow, vendorId: vendor && vendor.id, env });
  const launch = gate.open ? launchFrom(env) : null;
  const open = gate.open && !!launch;
  const reason = gate.open && !launch ? 'META_APP_ID or OWN_NUMBER_CONFIG_ID is not set on this service' : gate.reason;
  const { data, error } = await supabase.from('vendor_wabas')
    .select('status, display_number, connect_way, quality_rating, business_token')
    .eq('vendor_id', vendor.id).maybeSingle();
  if (error) throw new Error(`vendor_wabas read: ${error.message}`);
  // CE-46 G6-3 cut three, F-a3b (ruled 28 September 2026): an active or suspended number with NO stored business token (connected
  // before the token cure) cannot be answered on, so the room is told there is no number and offers the connect again; that
  // connect is the in-place re-exchange (connect.js, F-a3 (a)). The column is read for PRESENCE ONLY: it never leaves this function.
  const tokenless = !!data && (data.status === 'active' || data.status === 'suspended') && !data.business_token;
  return {
    open,
    reason: open ? null : `${reason}${tk ? ` · ${tk} is ${tierRow ? tierRow.status : 'absent'}` : ''}`,
    reason_text: open ? null : 'This opens once we finish connecting the service.',
    launch: open ? launch : null,
    number: tokenless ? null : numberView(data),
  };
}

module.exports = { answer, openFor, launchFrom, tierKey, numberViewFrom: numberView, MASTER, TIERS };
