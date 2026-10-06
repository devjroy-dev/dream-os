'use strict';
// src/lib/collab/gate.js · CE-47 · CLB-1 · WHICH OF TDW'S ACCOUNTS A VENDOR'S CALL MAY GO TO.
// THE CHAIR'S RULING (CE-47, 4 October 2026): house posting is NOT a Meta-gated vendor feature. TDW's own Instagram and
// Threads accounts hold a role on the app and need no App Review, so no sweep reads these rows and they are not in
// metaGates FEATURES. The founder turns each row on by hand once the house values are on Railway and one call has been
// walked, like any TDW readiness switch. on: the tick shows to every vendor and each call's tick is her own choice;
// pending or armed: clb.testers only (ruling 1); off or no row: nobody. No "waiting for Meta" line.
const cap = require('../capabilities');
const social = require('./social');
const { testers } = require('./testers');

const ROWS = Object.freeze({ instagram: 'flag.collab_house_instagram', threads: 'flag.collab_threads' });

async function houseGate(supabase, vendorId, deps = {}) {
  const capApi = deps.cap || cap;
  const list = await (deps.testers || testers)(supabase);
  const out = {};
  for (const p of social.PLATFORMS) out[p] = social.openFor(await capApi.get(ROWS[p], { supabase }), vendorId, list);
  return out;
}

module.exports = { ROWS, houseGate };
