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
  ok('donna.runDonnaTurn is a function', typeof donna.runDonnaTurn === 'function');
  ok('donna.snapshotText is a function', typeof donna.snapshotText === 'function');

  // The scar tissue that must survive the port: the open-binder default.
  // (Binders flying off = this missing. Verified present in the landed SOURCE.)
  const src = fs.readFileSync(path.join(__dirname, 'src/core/donna.ts'), 'utf8');
  ok('open-binder default present (ATTRIBUTE_ATOMS)', src.includes('ATTRIBUTE_ATOMS'));
  ok('open-binder default present (currentBinderId)', src.includes('currentBinderId'));

  console.log(fail
    ? '\nFAIL \u2014 ' + fail + ' check(s) failed.'
    : '\nPASS \u2014 engine loaded inert. Harvey & Donna intact, nothing wired. Myra untouched.');
  process.exit(fail ? 1 : 0);
} catch (e) {
  console.error('\nLOAD ERROR:', e && e.message ? e.message : e);
  process.exit(1);
}
