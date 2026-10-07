// scripts/b267_ce47_web4_cut23_bench.js
// TDW · CE-47 · WEB-4 cut 23 · b267 — THE REGISTER'S RECORD FOR 0211 (PRO P2, server train 8), written from 0211's bytes.
// §1 the record, last, in history order · §2 it says what 0211 does · §3 nothing before it moved · §4 mutations.
// No timing cell.
'use strict';
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const J = JSON.parse(fs.readFileSync(P('db/migrations/OUT_OF_ORDER.json'), 'utf8'));
const BASE = JSON.parse(execSync('git show d92edea:db/migrations/OUT_OF_ORDER.json', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
const R = J.register;
// AMENDED BY LABEL, CE-47 WEB-4 cut 24 (b268): the register goes on after 0211 (0218 in train 11), so 0211 is held at its
// place in history (the eleventh row), not as the last.
const good = (reg) => { const x = reg.find((r) => r.number === 211); return Boolean(x) && reg[10] === x && reg.filter((r) => r.number === 211).length === 1
  && ['gear_items', 'gear_requests', 'bill_drafts', 'pro_gear_accept'].every((t) => x.note.includes(t)) && /fills a hole below the applied ladder tip/.test(x.note)
  && x.stale_for === '`public.gear_items`, `public.gear_requests`, `public.bill_drafts`' && /^OWED/.test(x.state); };
const x = R.find((r) => r.number === 211) || { note: '' };

console.log('\n§1  the record for 0211, last, in history order');
ok(() => JSON.stringify(R.slice(0, 11).map((r) => r.number)) === '[183,204,196,200,208,209,205,195,197,198,211]', '1.1 the first eleven rows of the register read 183 ... 197, 198, 211 (order is history, never sorted)', JSON.stringify(R.map((r) => r.number)));
ok(() => good(R), '1.2 0211: the three tables and the function named; stale_for the three; OWED until the next PAIR regen');

console.log('\n§2  it says what 0211 does (its bytes, sha256 80cca6b6...)');
ok(() => /RLS on/.test(x.note) && /service_role/.test(x.note) && /SECURITY INVOKER/.test(x.note) && /revoked from PUBLIC, anon and authenticated/.test(x.note), '2.1 RLS and the grants; the function invoker rights, EXECUTE to service_role alone');
ok(() => /alters no existing table/.test(x.note) && /server train 8/.test(x.note) && /0208-0211/.test(x.note), '2.2 additive; PRO\'s range; train 8');

console.log('\n§3  nothing before it moved');
ok(() => JSON.stringify(R.slice(0, BASE.register.length)) === JSON.stringify(BASE.register) && JSON.stringify(J._README) === JSON.stringify(BASE._README), '3.1 the ten rows and the README byte-equal to d92edea\'s (only an addition)');

console.log('\n§4  mutations, run');
ok(() => !good(R.filter((r) => r.number !== 211)), '4.1 the record removed: 1.2 reddens');
ok(() => !good([R[10]].concat(R.slice(0, 10), R.slice(11))), '4.2 the record moved first (sorted, not history): 1.2 reddens');

console.log(`\nb267 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
process.exit(fail ? 1 : 0);
