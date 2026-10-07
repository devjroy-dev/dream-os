// scripts/b269_ce47_web4_cut25_bench.js
// TDW · CE-47 · WEB-4 cut 25 · b269 — THE REGISTER'S RECORDS FOR 0201 AND 0202 (INS PAY-A, server train 12), from their
// bytes. §1 the records, last, in history order · §2 they say what the files do, and name every table altered ·
// §3 nothing before them moved · §4 mutations. No timing cell.
'use strict';
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const J = JSON.parse(fs.readFileSync(P('db/migrations/OUT_OF_ORDER.json'), 'utf8'));
const BASE = JSON.parse(execSync('git show 2d349dc:db/migrations/OUT_OF_ORDER.json', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
const R = J.register;
const T201 = ['vendor_pay_accounts', 'vendor_pay_links', 'vendor_pay_events', 'vendor_pay_settings'];
const F201 = ['pay_record_milestone', 'pay_settle_invoice', 'pay_record_invoice'];
const NEW202 = ['vendor_pay_oauth_states', 'vendor_pay_event_answers']; const ALT202 = ['vendor_pay_links', 'vendor_pay_events', 'vendor_pay_settings'];
const F202 = ['pay_sweep_oauth_states', 'pay_take_off_refund', 'pay_hold_binder_payment', 'pay_claim_binder_event', 'pay_keep_binder_base', 'pay_finish_binder_event', 'pay_resolve_binder_event'];
const st = (ts) => ts.map((t) => '`public.' + t + '`').join(', ');
const good = (reg) => { const a = reg.find((r) => r.number === 201); const b = reg.find((r) => r.number === 202);
  return Boolean(a && b) && reg[reg.length - 2] === a && reg[reg.length - 1] === b && reg.filter((r) => r.number === 201 || r.number === 202).length === 2
    && T201.concat(F201).every((t) => a.note.includes(t)) && a.stale_for === st(T201)
    && NEW202.concat(ALT202, F202).every((t) => b.note.includes(t)) && b.stale_for === st(NEW202.concat(ALT202))
    && [a, b].every((x) => /fills a hole/.test(x.note) && /^OWED/.test(x.state)); };
const a = R.find((r) => r.number === 201) || { note: '' }; const b = R.find((r) => r.number === 202) || { note: '' };

console.log('\n§1  the records for 0201 and 0202, last, in history order');
ok(() => JSON.stringify(R.map((r) => r.number)) === '[183,204,196,200,208,209,205,195,197,198,211,218,201,202]', '1.1 the register reads ... 211, 218, 201, 202 (order is history: 0201 runs before 0202)', JSON.stringify(R.map((r) => r.number)));
ok(() => good(R), '1.2 both records: their tables and functions named; stale_for exact; OWED until the next PAIR regen');

console.log('\n§2  they say what the files do');
ok(() => /Alters no existing table's shape/.test(a.note) && /`invoices` and `payment_schedules`/.test(a.note) && /EXECUTE revoked from PUBLIC, anon and authenticated, granted to service_role alone/.test(a.note) && /18dbb3f0/.test(a.note), '2.1 0201: four new tables, three functions service_role only; no table\'s shape altered (its functions write invoice and schedule rows); from its bytes');
ok(() => ['binder_id', 'claimed_at', 'binder_base_received', 'accept_partial', 'vendor_pay_links_one_home', 'vendor_pay_events_not_applied_reason_check', 'drops NOT NULL'].every((t) => b.note.includes(t)) && /0419d5e5/.test(b.note), '2.2 0202: every alteration named (the new columns, invoice_id\'s NOT NULL dropped, the two CHECKs); from its bytes');
ok(() => ALT202.every((t) => b.stale_for.includes('`public.' + t + '`')), '2.3 0202 names every table it alters in stale_for (the chair\'s rule)');

console.log('\n§3  nothing before them moved');
ok(() => JSON.stringify(R.slice(0, BASE.register.length)) === JSON.stringify(BASE.register) && JSON.stringify(J._README) === JSON.stringify(BASE._README), '3.1 the twelve rows and the README byte-equal to 2d349dc\'s (only additions)');

console.log('\n§4  mutations, run');
ok(() => !good(R.filter((r) => r.number !== 202)), '4.1 record 202 removed: 1.2 reddens');
ok(() => !good(R.slice(0, -2).concat([R[R.length - 1], R[R.length - 2]])), '4.2 202 before 201 (not the order they run): 1.2 reddens');
ok(() => !good(R.map((r) => (r.number === 202 ? Object.assign({}, r, { stale_for: st(NEW202) }) : r))), '4.3 an altered table left out of 202\'s stale_for: 1.2 reddens');

console.log(`\nb269 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
process.exit(fail ? 1 : 0);
