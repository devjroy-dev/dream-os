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

module.exports = { layoutFor, FLAG, ENV_LIST };
