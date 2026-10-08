// scripts/b269_ce47_web4_cut25_bench.js
// TDW · CE-47 · WEB-4 cut 25 · b269 — THE REGISTER'S RECORDS FOR 0201 AND 0202 (INS PAY-A, server train 12), from their
// bytes. §1 the records, last, in history order · §2 they say what the files do, and name every table altered ·
// §3 nothing before them moved · §4 mutations. No timing cell.
// EXTENDED BY LABEL, cut 28 (the chair, 8 October): §6 the record for 0203 (INS F-44.420, server train 14), from its
// bytes, last; 0219 held at its place (the fifteenth row). Amended: 1.1, 5.1 (good219), 5.4. Its stale_for names no table:
// the snapshot carries no triggers (public_constraints_dump.sql :72); NOTHING OWED.
// EXTENDED BY LABEL, cut 27 (the chair, 8 October): §5 the record for 0219 (PTN A2-1c, server train 13), from its
// bytes, last; 201 and 202 held at their places (the thirteenth and fourteenth rows). Amended: 1.1, 1.2 (good), 4.2.
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
  return Boolean(a && b) && reg[12] === a && reg[13] === b && reg.filter((r) => r.number === 201 || r.number === 202).length === 2
    && T201.concat(F201).every((t) => a.note.includes(t)) && a.stale_for === st(T201)
    && NEW202.concat(ALT202, F202).every((t) => b.note.includes(t)) && b.stale_for === st(NEW202.concat(ALT202))
    && [a, b].every((x) => /fills a hole/.test(x.note) && /^OWED/.test(x.state)); };
const a = R.find((r) => r.number === 201) || { note: '' }; const b = R.find((r) => r.number === 202) || { note: '' };

console.log('\n§1  the records for 0201 and 0202, last, in history order');
ok(() => JSON.stringify(R.map((r) => r.number)) === '[183,204,196,200,208,209,205,195,197,198,211,218,201,202,219,203]', '1.1 the register reads ... 211, 218, 201, 202, 219, 203 (order is history: 0201 runs before 0202; cut 27: 0219 after them; cut 28: 0203 after 0219)', JSON.stringify(R.map((r) => r.number)));
ok(() => good(R), '1.2 both records: their tables and functions named; stale_for exact; OWED until the next PAIR regen');

console.log('\n§2  they say what the files do');
ok(() => /Alters no existing table's shape/.test(a.note) && /`invoices` and `payment_schedules`/.test(a.note) && /EXECUTE revoked from PUBLIC, anon and authenticated, granted to service_role alone/.test(a.note) && /18dbb3f0/.test(a.note), '2.1 0201: four new tables, three functions service_role only; no table\'s shape altered (its functions write invoice and schedule rows); from its bytes');
ok(() => ['binder_id', 'claimed_at', 'binder_base_received', 'accept_partial', 'vendor_pay_links_one_home', 'vendor_pay_events_not_applied_reason_check', 'drops NOT NULL'].every((t) => b.note.includes(t)) && /0419d5e5/.test(b.note), '2.2 0202: every alteration named (the new columns, invoice_id\'s NOT NULL dropped, the two CHECKs); from its bytes');
ok(() => ALT202.every((t) => b.stale_for.includes('`public.' + t + '`')), '2.3 0202 names every table it alters in stale_for (the chair\'s rule)');

console.log('\n§3  nothing before them moved');
ok(() => JSON.stringify(R.slice(0, BASE.register.length)) === JSON.stringify(BASE.register) && JSON.stringify(J._README) === JSON.stringify(BASE._README), '3.1 the twelve rows and the README byte-equal to 2d349dc\'s (only additions)');

console.log('\n§4  mutations, run');
ok(() => !good(R.filter((r) => r.number !== 202)), '4.1 record 202 removed: 1.2 reddens');
ok(() => !good(R.slice(0, 12).concat([R[13], R[12]], R.slice(14))), '4.2 202 before 201 (not the order they run): 1.2 reddens');
ok(() => !good(R.map((r) => (r.number === 202 ? Object.assign({}, r, { stale_for: st(NEW202) }) : r))), '4.3 an altered table left out of 202\'s stale_for: 1.2 reddens');

console.log('\n§5  cut 27: the record for 0219 (PTN A2-1c), from its bytes, last');
const c = R.find((r) => r.number === 219) || { note: '', stale_for: '', state: '' };
const ST219 = st(['partner_send_log', 'partner_orgs']);
const good219 = (reg) => { const x = reg.find((r) => r.number === 219);
  return Boolean(x) && reg[14] === x && reg.filter((r) => r.number === 219).length === 1 && x.stale_for === ST219
    && ['partner_send_log', 'partner_send_log_no_update', 'partner_send_log_append_only', 'partner_send_revive', 'whatsapp_opt_at', 'whatsapp_opt_words',
      'template.tdw_partner_call', 'template.tdw_partner_picked', 'template.tdw_collab_request_sent'].every((t) => x.note.includes(t))
    && /fills a hole/.test(x.note) && /^OWED/.test(x.state); };
ok(() => good219(R), '5.1 0219 the fifteenth row (cut 28: held at its place): the table, its trigger and both functions, the two partner_orgs columns and the three capability rows named; stale_for exact; OWED');
ok(() => /append-only/.test(c.note) && /EXECUTE to service_role alone/.test(c.note) && /RLS on; SELECT, INSERT, UPDATE, DELETE to service_role, in the transaction/.test(c.note) && /adf13f68/.test(c.note) && /rows only; no shape change/.test(c.note), '5.2 0219 says what the file does: append-only, RLS and the four grants, revive service_role only, capabilities rows only; from its bytes');
ok(() => !good219(R.map((r) => (r.number === 219 ? Object.assign({}, r, { stale_for: st(['partner_send_log']) }) : r))), '5.3 mutation: partner_orgs left out of stale_for (the table 0219 alters): 5.1 reddens');
ok(() => !good219(R.slice(0, 13).concat([R[14], R[13]], R.slice(15))), '5.4 mutation: 0219 placed before 0202: 5.1 reddens');
ok(() => !good219(R.filter((r) => r.number !== 219)), '5.5 mutation: record 219 removed: 5.1 reddens');

console.log('\n§6  cut 28: the record for 0203 (INS F-44.420), from its bytes, last');
const g = R.find((r) => r.number === 203) || { note: '', stale_for: '', state: '' };
const good203 = (reg) => { const x = reg.find((r) => r.number === 203);
  return Boolean(x) && reg[reg.length - 1] === x && reg.filter((r) => r.number === 203).length === 1
    && ['invoices_updated_at', 'payment_schedules_set_updated_at', 'invoices_set_updated_at', 'set_updated_at()', '`invoices`', '`payment_schedules`'].every((t) => x.note.includes(t))
    && x.stale_for === 'none: the snapshot carries no triggers' && x.state === 'NOTHING OWED: removed with the others at the next PAIR regen' && /fills a hole/.test(x.note); };
ok(() => good203(R), '6.1 0203 last: both triggers and the dropped old name named; stale_for and state exactly as the chair ruled');
ok(() => /changes nothing/.test(g.note) && /No table, column, grant or policy changes/.test(g.note) && /770bc39f/.test(g.note), '6.2 0203 says what the file does: nothing on live; one trigger per table on a repo-built database; from its bytes');
ok(() => /TRIGGERS\s+ARE\s+ABSENT/.test(fs.readFileSync(P('db/queries/public_constraints_dump.sql'), 'utf8')), '6.3 the reason nothing is owed holds: the constraints dump says triggers are absent, deliberately');
ok(() => !good203(R.map((r) => (r.number === 203 ? Object.assign({}, r, { state: 'OWED' }) : r))), '6.4 mutation: 0203 marked OWED: 6.1 reddens');
ok(() => !good203(R.slice(0, -2).concat([R[R.length - 1], R[R.length - 2]])), '6.5 mutation: 0203 placed before 0219: 6.1 reddens');
ok(() => !good203(R.filter((r) => r.number !== 203)), '6.6 mutation: record 203 removed: 6.1 reddens');

console.log(`\nb269 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
process.exit(fail ? 1 : 0);
