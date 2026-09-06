#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b59_mutations.js — the both-ways harness for b59 (G3.4).
//
//   node scripts/b59_mutations.js
//
// ⚠ IT READS EXIT CODES, NOT FAIL-LINE COUNTS, AND THAT IS THE WHOLE POINT.
// R-40.84/.85's origin: the first cut of this harness counted lines matching
// /FAIL/ in stdout. A mutation that makes the bench CRASH prints no FAIL line at
// all, so the harness scored it `RED cells: 0` — indistinguishable from a
// mutation the bench genuinely survives. The G3.2 seat hit the same thing from
// the other side (a dream-os mutation crashed b57 and was miscounted as zero
// red); two arrivals in one afternoon is a harness class, not an accident.
//
// So every run is judged on `status`:
//   0  → the bench passed        → the mutation was INVISIBLE (a vacuous cell)
//   1  → the bench failed cells  → the mutation was CAUGHT
//   any other / null (signal)    → the bench CRASHED → reported as CRASH, never
//                                  as a pass and never as a catch
// A crash is a harness defect or a mutation that broke the file's syntax; either
// way it proves nothing about the cells and must not be scored as if it did.
//
// The FAIL lines are still captured — they say WHICH cell caught it, which is
// the useful part of the report. They are never the verdict.
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BENCH = path.join(ROOT, 'scripts/b59_g34_reminders_bench.js');

// Each mutation is a real edit to a shipped file. Reverted by REVERSING THE EDIT
// (R-40.65) — never by checkout, which is permanently prohibited in this estate.
const MUTATIONS = [
  ['§1  skip the capitalisation', 'src/lib/vendor/paymentReminders.js',
   'const opened = safe.charAt(0).toUpperCase() + safe.slice(1);', 'const opened = safe;'],
  ['§2  locale grouping dropped', 'src/lib/vendor/paymentReminders.js',
   "return `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)}`;",
   'return `Rs ${n.toLocaleString()}`;'],
  ['§3  gate open on the flag alone', 'src/lib/vendor/paymentReminders.js',
   '    open: flagOn && approved,', '    open: flagOn,'],
  ['§4  the 23505 branch neutralised', 'src/lib/vendor/paymentReminders.js',
   "    if (String(claim.error.code) === '23505') {",
   "    if (false && String(claim.error.code) === '23505') {"],
  ['§5  absent settings row reads ON', 'src/lib/vendor/paymentReminders.js',
   '  return !!(data && data.auto_send);', '  return data ? !!data.auto_send : true;'],
  ['§6  the vendor-tap check dropped', 'src/lib/vendor/paymentReminders.js',
   '      if (!tapped.get(tapKey)) { skipped++; continue; }', '      /* tap check removed */'],
  ['§7  predicate becomes unpaid', 'src/lib/vendor/paymentReminders.js',
   "    .eq('state', 'pending')", "    .eq('state', 'unpaid')"],
  ['§8  nudgeClass true', 'src/lib/vendor/paymentReminders.js',
   '      nudgeClass: false,', '      nudgeClass: true,'],
  // ⚠ THIS ANCHOR TOOK THREE CUTS AND EACH FAILURE WAS A DIFFERENT KIND.
  //   (a) `line: 'bride',` alone — 32 matches; replace() mutated another template.
  //   (b) prefixing `line: 'vendor',` onto the key line — applied cleanly and changed
  //       NOTHING, because a later duplicate key wins in a JS object literal, so the
  //       original `line: 'bride'` further down silently overrode it. A mutation that
  //       the language itself neutralises reports INVISIBLE and is indistinguishable
  //       from a vacuous cell.
  //   (c) the Meta name + the two lines under it — unique, and it edits the live byte.
  // Recorded because (b) is the subtle one: the harness was honest, the mutation was not.
  ['§9  registry line vendor', 'src/lib/templates.js',
   "    name: 'tdw_payment_reminder',\n    language: TEMPLATE_LANGUAGE,\n    line: 'bride',",
   "    name: 'tdw_payment_reminder',\n    language: TEMPLATE_LANGUAGE,\n    line: 'vendor',"],
  ['§10 the kind CHECK widened', 'db/migrations/0139_payment_reminders.sql',
   "CHECK (kind   = ANY (ARRAY['due_3d'::text]))",
   "CHECK (kind   = ANY (ARRAY['due_3d'::text, 'due_7d'::text]))"],
  // ── THE HARNESS'S OWN PROOF, AND IT IS DELIBERATELY LAST ─────────────────
  // A mutation that BREAKS THE FILE rather than its behaviour. Under the old
  // line-counting harness this scored `RED cells: 0` — a clean pass. It must now
  // report CRASH. A harness that cannot detect its own blind spot is the thing
  // this file exists to stop being.
  ['§11 SELF-TEST — syntax broken on purpose', 'src/lib/vendor/paymentReminders.js',
   "function sendGate() {", "function sendGate( {"],
];

function runBench() {
  const r = spawnSync(process.execPath, [BENCH], {
    cwd: ROOT, encoding: 'utf8',
    env: { ...process.env, SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'dummy' },
  });
  const fails = (r.stdout || '').split('\n').filter((l) => l.includes('FAIL')).map((l) => l.trim());
  // ⚠ THE EXIT CODE ALONE CANNOT TELL A CRASH FROM A CELL FAILURE. node exits 1 for an
  // uncaught SyntaxError AND for `process.exit(fail ? 1 : 0)`. The discriminator is the
  // bench's own summary line, which prints ONLY on a structured completion: no summary
  // means the bench never reached its verdict, whatever the status says.
  const judged = /\d+\/\d+ cells green\./.test(r.stdout || '');
  const verdict = !judged ? 'CRASH' : r.status === 0 ? 'PASS' : 'FAILED';
  return { status: r.status, signal: r.signal, verdict, judged, fails, stderr: (r.stderr || '').trim() };
}

const baseline = runBench();
if (baseline.verdict !== 'PASS') {
  console.error(`BASELINE IS NOT GREEN (${baseline.verdict}, status=${baseline.status}). Nothing below would mean anything.`);
  if (baseline.stderr) console.error(baseline.stderr.split('\n').slice(0, 3).join('\n'));
  process.exit(1);
}
console.log('baseline: GREEN (exit 0)\n');

let caught = 0, invisible = 0, crashed = 0, unapplied = 0, unrestored = 0;

for (const [name, rel, oldStr, newStr] of MUTATIONS) {
  const file = path.join(ROOT, rel);
  const src = fs.readFileSync(file, 'utf8');
  const selfTest = name.startsWith('§11');

  if (!src.includes(oldStr)) {
    unapplied++;
    console.log(`  ${name.padEnd(36)} ANCHOR MISSING — mutation never applied, proves nothing`);
    continue;
  }
  const hits = src.split(oldStr).length - 1;
  if (hits !== 1) {
    unapplied++;
    console.log(`  ${name.padEnd(36)} ANCHOR AMBIGUOUS (${hits} matches) — replace() would mutate the wrong site`);
    continue;
  }

  fs.writeFileSync(file, src.replace(oldStr, newStr));
  const out = runBench();
  fs.writeFileSync(file, src);                       // revert by reversing the edit
  const back = runBench();

  const restored = back.verdict === 'PASS';
  if (!restored) unrestored++;

  let label;
  if (out.verdict === 'CRASH')        { label = `CRASH (status=${out.status}${out.signal ? ' signal=' + out.signal : ''})`; crashed++; }
  else if (out.verdict === 'FAILED')  { label = `CAUGHT — ${out.fails.length} cell(s) red`; caught++; }
  else                                { label = 'INVISIBLE — the bench passed; this cell proves nothing'; invisible++; }

  // The self-test is EXPECTED to crash. It is scored inverted so a green run
  // means the harness detected its own blind spot.
  const mark = selfTest ? (out.verdict === 'CRASH' ? 'as designed' : 'HARNESS BLIND') : '';
  console.log(`  ${name.padEnd(36)} ${label}${mark ? '  ← ' + mark : ''}  | restored: ${restored}`);
  if (out.fails.length && !selfTest) console.log(`      ${out.fails[0].slice(0, 92)}`);
}

console.log(`\ncaught=${caught}  invisible=${invisible}  crashed=${crashed}  anchor-missing=${unapplied}  not-restored=${unrestored}`);
// GREEN means: every behavioural mutation was CAUGHT, the self-test CRASHED as
// designed, nothing was left mutated, and no anchor went missing.
const green = invisible === 0 && unapplied === 0 && unrestored === 0 && crashed === 1;
console.log(green ? 'BOTH-WAYS: GREEN' : 'BOTH-WAYS: NOT GREEN');
process.exit(green ? 0 : 1);
