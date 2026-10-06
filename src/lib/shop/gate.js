'use strict';
// src/lib/shop/gate.js · CE-47 · OFF-A1 · flag.off_shop (0204): 'on' opens the shop for every vendor; 'armed' opens it only for
// OFF_WALK_VENDOR_ID (the founder's walk); anything else, or a failed read, keeps it shut. The capabilities read is the estate's
// one (src/lib/capabilities.js), cached by it for 60 seconds (F-44.223's note: a walk waits a minute after the write).
async function shopOpen(vendorId, deps = {}) {
  const capApi = deps.capApi || require('../capabilities');
  const env = deps.env || process.env;
  let row = null; try { row = await capApi.get('flag.off_shop'); } catch (_e) { row = null; }
  const st = row && row.status;
  if (st === 'on') return true;
  if (st === 'armed') { const walk = String(env.OFF_WALK_VENDOR_ID || ''); return Boolean(walk) && walk === vendorId; }
  return false;
}
module.exports = { shopOpen };
