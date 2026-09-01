#!/usr/bin/env node
'use strict';
// scripts/b49_writer_hygiene_bench.js — CE-39 · THE WRITER-HYGIENE SITTING.
// The money writers, cleaned before vendors write through them. dream-os side.
//
//   node scripts/b49_writer_hygiene_bench.js
//
// Exit code is the verdict. Counts are DISCLOSED, never padded.
//
// ── WHAT THIS BENCH ASSERTS ────────────────────────────────────────────────
// Three grounds, all STRUCTURAL or BEHAVIOURAL-against-a-stub. No cell talks to
// a database, so no cell claims a row exists. What a cell CAN do — and §1 does —
// is read the CHECK out of the schema doc and hold the code's array to it. That
// is F-15.6's law made mechanical: the doctrine says a cell can be green,
// non-vacuous and mutation-proven while pinning a value the database has never
// accepted, and the only cure for that is to stop hand-writing the expected
// list into the bench and read it from the witness instead.
//
// ⚠ THE EXPECTED LIST IS NOT WRITTEN IN THIS FILE. §1.1 parses
// `expenses_category_check` out of docs/db/PUBLIC_SCHEMA.md. If someone widens
// the array to match a CHECK they only imagined, this bench reds — which is the
// entire point of it, and is exactly the failure F-2c.p1 was.
//
// ⚠ COMMENT-BLINDNESS, EARNED AT F-39.13. Absence cells run on stripped text or
// they read their own documentation as evidence. This file's own headers name
// `[money corrected` and `.from('expenses')` in prose; §3.1 and §2.2 would both
// pass vacuously — or red spuriously — without the strip.
//
// ── THE ISLAND, AND WHY NO CELL HERE POINTS AT IT ──────────────────────────
// F-39.23, F-39.29 and F-2c.p2 were all filed against `src/agent/engine.js`
// below :753 — the defused island, zero callers, byte-frozen. Re-derived from
// the callers down at CE-39: the island writes NOTHING live. Cells asserting
// anything about its money cases would pass over an unreachable path forever.
// `b05_f0550` §4.1/§4.3 and `b47` 1.4 already hold the island's freeze and its
// caller-count; this bench does not duplicate them and does not add its own.
// The island's retirement is its own ruled sitting (post-beta).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const strip = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '')
     .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

let pass = 0; let fail = 0;
const queue = [];
function cell(name, fn) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    if (name === null) { console.log(fn); continue; }
    let ok = false; let why = '';
    try { const r = await fn(); ok = r === true; if (!ok) why = String(r); }
    catch (e) { ok = false; why = e.message; }
    if (ok) { pass += 1; console.log(`  PASS  ${name}`); }
    else { fail += 1; console.log(`  FAIL  ${name}\n        ${why}`); }
  }
}

// THE WITNESS. Parsed, never transcribed.
function checkTokens() {
  const doc = read('docs/db/PUBLIC_SCHEMA.md');
  const i = doc.indexOf('expenses_category_check');
  if (i < 0) return null;
  const window = doc.slice(i, i + 700);
  const m = window.match(/ARRAY\[([^\]]+)\]/);
  if (!m) return null;
  return m[1].split(',').map((t) => {
    const q = t.match(/'([^']+)'/);
    return q ? q[1] : null;
  }).filter(Boolean);
}

console.log('b49 · writer hygiene · dream-os\n');

// ── §1 · THE CATEGORY VOCABULARY == THE DATABASE'S OWN LIST ────────────────
cell(null, "§1 the vocabulary is the CHECK's, read from the witness");

cell('1.1 the schema doc yields twelve tokens for expenses_category_check', () => {
  // PROVEN-ONE-WAY. Green at the cured tree; no production mutation run — its
  // subject is the schema DOC, which is the witness, not the tree under test.
  const t = checkTokens();
  if (!t) return 'could not parse expenses_category_check out of PUBLIC_SCHEMA.md';
  return t.length === 12 || `parsed ${t.length} tokens, expected 12: ${t.join(', ')}`;
  // MUTATION: this cell guards the PARSER. If the schema doc's shape changes,
  // 1.2 and 1.3 would silently compare against [] and pass vacuously. This is
  // the cell that stops that.
});

cell('1.2 ALLOWED_CATEGORIES == the CHECK, as a SET (R-38.19)', () => {
  const want = checkTokens();
  const { ALLOWED_CATEGORIES } = require(path.join(ROOT, 'src/lib/vendor/expenses.js'));
  const extra   = ALLOWED_CATEGORIES.filter((c) => !want.includes(c));
  const missing = want.filter((c) => !ALLOWED_CATEGORIES.includes(c));
  if (extra.length)   return `the home accepts what the DB refuses: ${extra.join(', ')}`;
  if (missing.length) return `the home refuses what the DB accepts: ${missing.join(', ')}`;
  return true;
  // MUTATION, BOTH DIRECTIONS — this is the cell F-2c.p1 needed and never had:
  //   add 'editing' to ALLOWED_CATEGORIES        -> RED (fail-open direction)
  //   remove 'commission' from ALLOWED_CATEGORIES -> RED (fail-closed direction)
  // Both run against production code, not against this file.
});

cell("1.3 the home's order is the CHECK's order", () => {
  const want = checkTokens();
  const { ALLOWED_CATEGORIES } = require(path.join(ROOT, 'src/lib/vendor/expenses.js'));
  return ALLOWED_CATEGORIES.join('|') === want.join('|')
    || `order differs\n        home: ${ALLOWED_CATEGORIES.join(', ')}\n        CHECK: ${want.join(', ')}`;
  // The picker's option order is the mirror's order is this order (founder,
  // 2026-09-01). A set-equal but re-ordered array would pass 1.2 and silently
  // re-shuffle every vendor's dropdown; this cell is why it cannot.
  // MUTATION: swap 'travel' and 'equipment' -> RED.
});

cell('1.4 the refusal sentence is minted ONCE', () => {
  const s = strip(read('src/lib/vendor/expenses.js'));
  const mints = (s.match(/That is not a category we track/g) || []).length;
  if (mints !== 1) return `the sentence is built ${mints} times; one home or it drifts`;
  const uses = (s.match(/CATEGORY_REFUSAL/g) || []).length;
  // one declaration + create door + update door + the export
  return uses === 4 || `CATEGORY_REFUSAL appears ${uses} times, expected 4`;
  // MUTATION: inline the sentence at the update door instead of the constant -> RED.
});

cell('1.5 the refusal names the twelve the database actually takes', () => {
  const want = checkTokens();
  const { CATEGORY_REFUSAL } = require(path.join(ROOT, 'src/lib/vendor/expenses.js'));
  const named = want.filter((c) => CATEGORY_REFUSAL.includes(c));
  if (named.length !== want.length) {
    return `the sentence omits: ${want.filter((c) => !CATEGORY_REFUSAL.includes(c)).join(', ')}`;
  }
  // The founder's veto byte, 2026-09-01. Quoted here in full deliberately: this
  // is a vendor-facing string under copy veto, and a bench that only checked its
  // SHAPE would let the words be rewritten without a ruling.
  const shipped = 'That is not a category we track. Pick one of: travel, equipment, assistant, studio, marketing, software, food, printing, commission, shoot, inventory, other.';
  return CATEGORY_REFUSAL === shipped || `the vetoed sentence changed:\n        ${CATEGORY_REFUSAL}`;
  // MUTATION: change one word of the sentence -> RED.
});

// ── §2 · ONE WRITER FOR public.expenses ────────────────────────────────────
cell(null, '\n§2 one live writer for public.expenses');

cell('2.1 only the home opens public.expenses with a mutation verb', () => {
  // The callers-down sweep's finding, made permanent. Before CE-39,
  // studio/payments.js opened the table inline and the home's validator never
  // saw the row.
  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (!/\/dist$/.test(rel)) walk(rel); }
      else if (/\.(js|ts)$/.test(e.name)) files.push(rel);
    }
  })('src');
  //
  // ── THE ISLAND'S ONE HIT, EXCLUDED BY POSITION AND NOT BY FILENAME ────────
  // First cut of this cell reddened on `src/agent/engine.js` (1 hit) — the
  // `log_expense` case at :1761, inside the defused island below :753. It has
  // zero callers, it is byte-frozen under CE-68 R4, and this sitting is
  // forbidden to edit it, so a cell demanding its removal would red forever on
  // work nobody is allowed to do. F-39.25: the instrument's report was evidence
  // about the instrument.
  //
  // It is excluded BY LINE POSITION, never by filename. A write ABOVE the island
  // header is live and reds here. If the header is ever deleted or moved, the
  // guard below reds instead — so the exclusion cannot outlive the freeze that
  // justifies it, and the island's retirement sitting inherits a cell that
  // notices. This is the retire-with-the-reader seam.
  const ISLAND_FILE = 'src/agent/engine.js';
  const islandLines = read(ISLAND_FILE).split('\n');
  const islandAt = islandLines.findIndex((l) => /F-05\.56 — EVERYTHING BELOW THIS LINE HAS ZERO CALLERS/.test(l));
  if (islandAt < 0) {
    return `REFUSED — the F-05.56 island header is gone from ${ISLAND_FILE}; this cell's exclusion no longer has a basis and must be re-derived, not re-scoped`;
  }
  const offenders = [];
  for (const f of files) {
    if (f === 'src/lib/vendor/expenses.js') continue;
    const lines = read(f).split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      if (!/\.from\('expenses'\)/.test(lines[i])) continue;
      const window = lines.slice(i, i + 5).join(' ');
      if (!/\.(insert|update|upsert|delete)\s*\(/.test(window)) continue;
      if (f === ISLAND_FILE && i > islandAt) continue;   // below the freeze line
      offenders.push(`${f}:${i + 1}`);
    }
  }
  return offenders.length === 0 || `public.expenses written outside the home: ${offenders.join(', ')}`;
  // MUTATION: restore the inline `.from('expenses').insert({...})` in
  // src/api/vendor/studio/payments.js -> RED. Run at the uncured tree: RED.
  // MUTATION: move a `.from('expenses').insert(` ABOVE engine.js:753 -> RED.
});

cell("2.2 mark-paid's expense leg reaches the home", () => {
  const s = strip(read('src/api/vendor/studio/payments.js'));
  if (!/require\(.*lib\/vendor\/expenses.*\)/.test(s)) return 'payments.js does not import the writer home';
  if (!/createExpense\(/.test(s)) return 'payments.js never calls createExpense';
  return true;
  // MUTATION: drop the require -> RED (and node would throw at the call, which
  // is the honest second witness).
});

cell('2.3 a failed expense leg is DECLARED, not swallowed', () => {
  const s = strip(read('src/api/vendor/studio/payments.js'));
  if (!/expense_logged/.test(s)) return 'the mark-paid response does not carry expense_logged';
  if (!/expense_error/.test(s))  return 'the mark-paid response does not carry expense_error';
  // The old shape: a bare try/catch whose only witness was console.warn, so a
  // 23514 reached the vendor as an unqualified success.
  const okLine = (s.match(/return okRes\(res, \{ payment: data[^\n]*/g) || []).pop() || '';
  return /expense_logged/.test(okLine) || `mark-paid's success response does not declare the partial: ${okLine}`;
  // MUTATION: return `okRes(res, { payment: data })` alone -> RED.
});

cell('2.4 the expense leg does not reverse a committed money row', () => {
  // PROVEN-ONE-WAY, and declared as such. The team_payments update is committed
  // above the expense leg; a failure there must not un-settle it. Asserting the
  // ABSENCE of a rollback is the shape this can take without a database.
  const s = strip(read('src/api/vendor/studio/payments.js'));
  const tail = s.slice(s.indexOf('let expenseLogged'));
  const bad = tail.match(/\.from\('team_payments'\)\s*\.(update|delete)/g) || [];
  return bad.length === 0 || `the expense leg touches team_payments again: ${bad.join(' ')}`;
});

// ── §3 · THE NOTE IS THE VENDOR'S; THE LOG IS THE MACHINE'S ────────────────
cell(null, "\n§3 F-39.23 — audit prose leaves the vendor's column");

cell("3.1 no live writer appends '[money corrected' into a narrative column", () => {
  // AGAINST THE LIVE SITE. F-39.23 was filed against invoices.description; the
  // writer is donna_money_edit in the compiled engine, and the column is
  // engine.records.note. This cell asserts of the LIVE source, and — because
  // the engine ships COMPILED — of the emitted artifact too. A cure that fixes
  // the .ts and leaves a stale dist is not a cure.
  const src = strip(read('src/engine/src/core/tools/recordPrimitives.ts'));
  if (/\[money corrected/.test(src)) return 'the prose is still written in recordPrimitives.ts';
  const distRel = 'src/engine/dist/core/tools/recordPrimitives.js';
  if (!fs.existsSync(path.join(ROOT, distRel))) {
    return `REFUSED — ${distRel} absent; run \`npm run build\` before this bench`;
  }
  const dist = strip(read(distRel));
  return !/\[money corrected/.test(dist) || 'the prose survives in the compiled engine — dist is stale';
  // MUTATION: restore `patch.note = \`[money corrected ...\`` and rebuild -> RED.
  // Run at the uncured tree: RED at both legs.
});

cell('3.2 the audit trail the prose duplicated is still written', () => {
  // The cure is a DELETION, which is only lawful because the trail exists twice
  // on this same write. If either witness goes, the deletion becomes a loss.
  const s = strip(read('src/engine/src/core/tools/recordPrimitives.ts'));
  if (!/logEvent\(agentId, 'update', data\.id, label\)/.test(s)) {
    return 'writeFields no longer writes the audit log — the deletion is now a loss';
  }
  if (!/ALWAYS_APPEND = \['reason_for_action'\]/.test(s)) {
    return 'the always-append diary is gone — the deletion is now a loss';
  }
  const outcome = s.match(/const outcome = await writeFields\(agentId, rid, patch,[^\n]*/);
  if (!outcome) return 'the money-edit write site could not be located';
  return /money corrected/.test(outcome[0]) || `the audit label no longer names the correction: ${outcome[0]}`;
  // MUTATION: drop the logEvent call from writeFields -> RED.
});

cell('3.3 donna_money_edit no longer opts note into the append set', () => {
  const s = strip(read('src/engine/src/core/tools/recordPrimitives.ts'));
  const outcome = s.match(/const outcome = await writeFields\(agentId, rid, patch,[^\n]*/);
  if (!outcome) return 'the money-edit write site could not be located';
  return !/new Set\(\['note'\]\)/.test(outcome[0])
    || 'the money-edit still opts `note` into the append set';
  // MUTATION: restore the `new Set(['note'])` argument -> RED.
});

cell('3.4 invoices.description is untouched by any live writer', () => {
  // PROVEN-ONE-WAY. Asserts an ABSENCE that was already absent before this
  // sitting; the mutation that would red it is the writing of a defect nobody
  // has written. Kept as a forward guard, disclosed as one-way.
  // F-39.23's ORIGINAL claim, tested rather than assumed. It was misfiled; this
  // cell is what makes that a finding rather than an opinion, and it stands as
  // the guard if a writer ever does start putting prose there.
  const files = ['src/lib/vendor/invoices.js', 'src/api/vendor/invoices.js', 'src/api/vendor/money.js'];
  const bad = [];
  for (const f of files) {
    const flat = strip(read(f)).replace(/\s+/g, ' ');
    if (/description:\s*`?\[/.test(flat) || /\[money corrected/.test(flat)) bad.push(f);
  }
  return bad.length === 0 || `audit prose reaching invoices.description: ${bad.join(', ')}`;
});

// ── VERDICT ───────────────────────────────────────────────────────────────
runAll().then(() => {
  console.log(`\nb49 — ${pass} PASS · ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
});
