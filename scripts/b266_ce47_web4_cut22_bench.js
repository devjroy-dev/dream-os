// scripts/b266_ce47_web4_cut22_bench.js
// TDW · CE-47 · WEB-4 cut 22 · b266 — THE REGISTER'S RECORD FOR 0198 (CLB HUB-1, server train 7). WEB-4 is the one
// writer of db/migrations/OUT_OF_ORDER.json. §1 the record, last, in history order · §2 nothing before it moved ·
// §3 mutations. No timing cell.
'use strict';
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const J = JSON.parse(fs.readFileSync(P('db/migrations/OUT_OF_ORDER.json'), 'utf8'));
const BASE = JSON.parse(execSync('git show d5ae450:db/migrations/OUT_OF_ORDER.json', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
const R = J.register; const r198 = R.find((r) => r.number === 198);
// AMENDED BY LABEL, CE-47 WEB-4 cut 23 (b267): the register goes on after 0198 (0211 in train 8), so 0198 is held at its
// place in history (the tenth row), not as the last.
const good = (reg) => { const x = reg.find((r) => r.number === 198); return Boolean(x) && reg[9] === x && /hub_profiles/.test(x.note) && /hub_credits/.test(x.note) && /fills a hole below the applied ladder tip/.test(x.note) && x.stale_for === '`public.hub_profiles`, `public.hub_credits`' && /^OWED/.test(x.state) && reg.filter((r) => r.number === 198).length === 1; };

console.log('\n§1  the record for 0198, last, in history order');
ok(() => JSON.stringify(R.slice(0, 10).map((r) => r.number)) === '[183,204,196,200,208,209,205,195,197,198]', '1.1 the first ten rows of the register read 183, 204, 196, 200, 208, 209, 205, 195, 197, 198 (order is history, never sorted)', JSON.stringify(R.map((r) => r.number)));
ok(() => good(R), '1.2 0198: the two new tables named; stale_for the two; OWED until the next PAIR regen');
ok(() => /alters no existing table/.test(r198.note) && /server train 7/.test(r198.note), '1.3 additive, nothing existing altered; lands in server train 7');

console.log('\n§2  nothing before it moved');
ok(() => JSON.stringify(R.slice(0, BASE.register.length)) === JSON.stringify(BASE.register) && JSON.stringify(J._README) === JSON.stringify(BASE._README), '2.1 the nine rows and the README byte-equal to d5ae450\'s (only an addition)');

console.log('\n§3  mutations, run');
ok(() => !good(R.filter((r) => r.number !== 198)), '3.1 the record removed: 1.2 reddens');
ok(() => !good([R[9]].concat(R.slice(0, 9), R.slice(10))), '3.2 the record moved first (sorted, not history): 1.2 reddens');

console.log(`\nb266 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
process.exit(fail ? 1 : 0);
