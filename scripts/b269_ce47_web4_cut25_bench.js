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
// ── AMENDED BY LABEL, CE-47 WEB-4 cut 29 (the PAIR regen of 8 October 2026, from the founder's four CSVs; ladder 0220) ──
// The record(s) this rung held were PAID by the regen and removed from the register, as ruled ("removed at the next PAIR
// regen"). Each cell that held a record now holds its PAYMENT: the record gone; the snapshot carries what it named; its
// words kept in git at 5058d8c. Each mutation puts the record back, or takes a named table out of the snapshot.
const __DOC = fs.readFileSync(P('docs/db/PUBLIC_SCHEMA.md'), 'utf8');
const __docCols = (doc, t) => { const m = doc.match(new RegExp('## public\\.' + t + ' [^\\n]*\\n\\n```\\n([\\s\\S]*?)```')); return m ? m[1].split('\n').map((l) => (l.match(/^\d+\.\s+(\w+)\s/) || [])[1]).filter(Boolean) : []; };
const __HIST = JSON.parse(execSync('git show 5058d8c:db/migrations/OUT_OF_ORDER.json', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString()).register;
const __paid = (reg, doc, n, tables, names) => !reg.some((r) => r.number === n) && tables.every((t) => __docCols(doc, t).length > 0) && names.every((s) => doc.includes(s));
const __drop = (doc, t) => doc.replace('## public.' + t + ' ', '## gone.' + t + ' ');
const J = JSON.parse(fs.readFileSync(P('db/migrations/OUT_OF_ORDER.json'), 'utf8')); const R = J.register;
const BASE = JSON.parse(execSync('git show 2d349dc:db/migrations/OUT_OF_ORDER.json', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
const SPEC = { 201: { tables: ['vendor_pay_accounts', 'vendor_pay_links', 'vendor_pay_events', 'vendor_pay_settings'], names: [] }, 202: { tables: ['vendor_pay_oauth_states', 'vendor_pay_event_answers', 'vendor_pay_links', 'vendor_pay_events', 'vendor_pay_settings'], names: ['vendor_pay_links_one_home', 'vendor_pay_events_not_applied_reason_check', 'binder_base_received', 'accept_partial', 'claimed_at'] }, 219: { tables: ['partner_send_log', 'partner_orgs'], names: ['whatsapp_opt_at', 'whatsapp_opt_words'] }, 203: { tables: [], names: [] } };
const NUMS = Object.keys(SPEC).map(Number);

console.log('\n§1  the records for 0201, 0202 (INS PAY-A), 0219 (PTN A2-1c) and 0203 (INS F-44.420): paid by the PAIR regen');
ok(() => NUMS.every((n) => !R.some((r) => r.number === n)), `1.1 the register no longer holds ${NUMS.map((n) => String(n).padStart(4, '0')).join(', ')}: paid by the regen and removed, as ruled`, JSON.stringify(R.map((r) => r.number)));
ok(() => NUMS.every((n) => __paid(R, __DOC, n, SPEC[n].tables, SPEC[n].names)), '1.2 the snapshot carries what each record named (its tables, and the columns and constraints it named)');
ok(() => NUMS.every((n) => __HIST.some((r) => r.number === n && SPEC[n].tables.every((t) => r.note.includes(t) || r.stale_for.includes(t)))), '1.3 each record\'s words survive in git at 5058d8c, the tip before the regen');

console.log('\n§2  nothing else moved');
ok(() => JSON.stringify(J._README) === JSON.stringify(BASE._README), '2.1 the README byte-equal to 2d349dc\'s');

console.log('\n§3  mutations, run');
ok(() => NUMS.every((n) => !__paid(R.concat(__HIST.filter((r) => r.number === n)), __DOC, n, SPEC[n].tables, SPEC[n].names)), '3.1 a record put back after the regen: 1.2 reddens');
ok(() => NUMS.filter((n) => SPEC[n].tables.length).every((n) => !__paid(R, __drop(__DOC, SPEC[n].tables[0]), n, SPEC[n].tables, SPEC[n].names)), '3.2 a table the record named, missing from the snapshot: 1.2 reddens');

console.log(`\nb269 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
process.exit(fail ? 1 : 0);
