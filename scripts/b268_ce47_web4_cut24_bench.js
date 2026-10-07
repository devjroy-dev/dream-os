// scripts/b268_ce47_web4_cut24_bench.js
// TDW · CE-47 · WEB-4 cut 24 · b268 — THE REGISTER'S RECORD FOR 0218 (PTN A2-1, server train 11).
// §1 the record, last, in history order · §2 it says what 0218 does · §3 nothing before it moved · §4 mutations.
// No timing cell.
'use strict';
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const J = JSON.parse(fs.readFileSync(P('db/migrations/OUT_OF_ORDER.json'), 'utf8'));
const BASE = JSON.parse(execSync('git show a75c2bd:db/migrations/OUT_OF_ORDER.json', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
const R = J.register;
// AMENDED BY LABEL, CE-47 WEB-4 cut 25 (b269): the register goes on after 0218 (0201 and 0202 in train 12), so 0218 is held
// at its place in history (the twelfth row), not as the last.
const good = (reg) => { const x = reg.find((r) => r.number === 218); return Boolean(x) && reg[11] === x && reg.filter((r) => r.number === 218).length === 1
  && ['partner_sends', 'partner_answers', 'collab_interest_partner_fk'].every((t) => x.note.includes(t)) && /fills a hole below the applied ladder tip/.test(x.note)
  && x.stale_for === '`public.partner_sends`, `public.partner_answers`, `public.collab_interest`' && /^OWED/.test(x.state); };
const x = R.find((r) => r.number === 218) || { note: '' };

console.log('\n§1  the record for 0218, last, in history order');
ok(() => JSON.stringify(R.slice(0, 12).map((r) => r.number)) === '[183,204,196,200,208,209,205,195,197,198,211,218]', '1.1 the first twelve rows of the register read 183 ... 198, 211, 218 (order is history, never sorted)', JSON.stringify(R.map((r) => r.number)));
ok(() => good(R), '1.2 0218: the two tables and the foreign key named; stale_for the two and collab_interest; OWED until the next PAIR regen');

console.log('\n§2  it says what 0218 does');
ok(() => /RLS on/.test(x.note) && /service_role, in the same transaction/.test(x.note) && /on `collab_interest`/.test(x.note), '2.1 RLS and the four grants in the same transaction; the foreign key on collab_interest (an existing table, so it is named in stale_for)');
ok(() => /server train 11/.test(x.note) && /0216-0219/.test(x.note), '2.2 PTN\'s range; train 11');

console.log('\n§3  nothing before it moved');
ok(() => JSON.stringify(R.slice(0, BASE.register.length)) === JSON.stringify(BASE.register) && JSON.stringify(J._README) === JSON.stringify(BASE._README), '3.1 the eleven rows and the README byte-equal to a75c2bd\'s (only an addition)');

console.log('\n§4  mutations, run');
ok(() => !good(R.filter((r) => r.number !== 218)), '4.1 the record removed: 1.2 reddens');
ok(() => !good([R[11]].concat(R.slice(0, 11), R.slice(12))), '4.2 the record moved first (sorted, not history): 1.2 reddens');

console.log(`\nb268 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
process.exit(fail ? 1 : 0);
