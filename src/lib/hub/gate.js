'use strict';
// src/lib/hub/gate.js · CE-47 · HUB-2b · RULE 1'S ONE HOME (the chair's ruling (a), 7 Oct 2026): "is the Hub open to this
// vendor". Moved word for word out of src/api/vendor/hub.js (HUB2_SRV_2), so every reader asks the same question: the
// Hub's own doors, and PTN's sending (a closed vendor's call is never sent to partners).
// The Hub is open to a vendor on clb.testers (read through testers.js's own reader), or to everyone once admin_config
// 'clb.hub' is 'on'. Both fail closed: junk, a missing row or an unreachable database means closed.
const { testers } = require('../../lib/collab/testers');
const SWITCH_KEY = 'clb.hub';
const CLOSED = 'Collab Hub is not open for your account yet.';
let _swAt = 0; let _sw = false;
async function switchOn(sb) {
  if (Date.now() - _swAt < 60 * 1000) return _sw;
  try {
    const { data, error } = await sb.from('admin_config').select('value').eq('key', SWITCH_KEY).maybeSingle();
    const v = !error && data ? String(data.value == null ? '' : data.value).trim().replace(/^"(.*)"$/, '$1').toLowerCase() : '';
    _sw = v === 'on';
  } catch (_e) { _sw = false; }
  _swAt = Date.now();
  return _sw;
}
async function hubOpen(sb, vendorId) {
  try { if (await switchOn(sb)) return true; return (await testers(sb)).includes(vendorId); } catch (_e) { return false; }
}
function _reset() { _swAt = 0; _sw = false; }   // benches only: the 60 s cache, cleared between cells

module.exports = { hubOpen, CLOSED, _reset };
