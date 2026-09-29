'use strict';
// src/lib/vendorLayout.js · DESIGN-1 · THE LAYOUT SWITCH · THE ONE PREDICATE HOME.
//
// Which vendor layout a vendor sees: 'v2' (the redesign, DESIGN-1 stages 1 to 5) or 'classic' (today's, kept whole as
// the standby). The founder's rule (29 Sept 2026): a per-vendor setting with a global default, default OFF, switching
// back is one setting and no deploy. The estate's switchboard carries it, the IG_DM_WALK_VENDOR_IDS way:
//   · flag.vendor_layout_v2 ON (the Switchboard card, db/migrations/0185) → every vendor sees 'v2' (the global default);
//   · otherwise a vendor named in LAYOUT_V2_VENDOR_IDS (a Railway variable, comma separated) sees 'v2';
//   · everyone else sees 'classic'. No row, an unread switchboard or an empty variable all read 'classic' (fails closed).
// GET /api/v2/vendor/me carries the answer as `layout`; the pwa reads that field and nothing else.
const cap = require('./capabilities');

const FLAG = 'flag.vendor_layout_v2';
const ENV_LIST = 'LAYOUT_V2_VENDOR_IDS';
// the date the master was FIRST turned on, recorded once (its flipped_at); read by the admin panel, never a gate
const FIRST_ON = 'flag.vendor_layout_v2.first_on';
const KEEP_DAYS = 30;

function listed(vendorId, env) {
  const ids = String((env && env[ENV_LIST]) || '').split(',').map((x) => x.trim()).filter(Boolean);
  return vendorId != null && ids.includes(String(vendorId));
}

/** 'v2' | 'classic' for this vendor. Synchronous, from the switchboard's warmed table (cap.on). Never throws. */
function layoutFor(vendorId, env = process.env) {
  try {
    if (cap.on(FLAG)) return 'v2';
    return listed(vendorId, env) ? 'v2' : 'classic';
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

module.exports = { layoutFor, setMaster, masterState, FLAG, FIRST_ON, ENV_LIST, KEEP_DAYS };
