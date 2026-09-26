// Vendor Suit \u2014 Phase 0 smoke test (INERT).
// Proves the dreamai engine (Harvey & Donna) loads inside dream-os as CommonJS.
// It wires nothing, mounts no route, touches no Myra. Run AFTER `npm run build:engine`.
//
//   node src/engine/smoke.js
//
// Placeholders so module-top-level construction (Anthropic client, Supabase client)
// loads without a real .env \u2014 this only proves the code loads, it makes no calls.
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'smoke';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'smoke';

const fs = require('fs');
const path = require('path');
let fail = 0;
function ok(label, cond) { console.log((cond ? '  \u2713 ' : '  \u2717 ') + label); if (!cond) fail++; }

console.log('Vendor Suit \u2014 engine load check (inert):');
try {
  const loop = require('./dist/core/loop.js');
  const donna = require('./dist/core/donna.js');
  ok('loop.runTurn is a function', typeof loop.runTurn === 'function');
  // CE-45 LSP_5 (L5-c, c-45.51): runDonnaTurn and snapshotText are deleted; the live exports are pinned instead.
  ok('donna.rebuildSnapshot is a function', typeof donna.rebuildSnapshot === 'function');
  ok('donna.patchNote is a function', typeof donna.patchNote === 'function');

  // The scar tissue that must survive the port: the open-binder default.
  // (Binders flying off = this missing. Verified present in the landed SOURCE.)
  // RETIRED in CE-45 LSP_5 (K5, flagged to the chair): the two open-binder cells read donna.ts for ATTRIBUTE_ATOMS and
  // currentBinderId, which lived only inside runDonnaTurn's write loop (e07f7fa donna.ts :508 to :734). runDonnaTurn had no
  // live caller before this cut (LSP_5 read-first §1; LSP_3 removed its last) and is deleted by L5-c. Printed, never counted.
  console.log('  RETIRED  open-binder default present (ATTRIBUTE_ATOMS, currentBinderId): lived only in the deleted runDonnaTurn');

  console.log(fail
    ? '\nFAIL \u2014 ' + fail + ' check(s) failed.'
    : '\nPASS \u2014 engine loaded inert. Harvey & Donna intact, nothing wired. Myra untouched.');
  process.exit(fail ? 1 : 0);
} catch (e) {
  console.error('\nLOAD ERROR:', e && e.message ? e.message : e);
  process.exit(1);
}
