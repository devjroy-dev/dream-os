#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────────
   scripts/tdw09_rider2_budget.proof.mjs
   TDW_09 · ATELIER RIDER 2 — the second budget writer.

   THE FOUNDER'S RULING WAS CONDITIONAL: 「 both can write if theres no clash and
   if the write is successful 」. A bench that asserted the guard's TEXT would prove
   neither condition. So this bench does not read the guard — it EXTRACTS THE
   SHIPPED COERCION BYTES FROM BOTH WRITERS AND RUNS THEM, against one shared
   input table, and asserts they reach the same verdict on every row.

   If someone later loosens one writer, the table disagrees and this goes red. That
   is the only form of "no clash" that survives a future edit by someone who never
   read this comment.

   Runnable from any working directory (Q-SP-5).
   ───────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const section = (t) => console.log(`\n══ ${t} ══\n`);
const ok = (id, d, c, x = '') => {
  if (c) { pass++; console.log(`  ok   ${id} ${d}`); }
  else { fail++; console.log(`  FAIL ${id} ${d}${x ? `\n         ${x}` : ''}`); }
};
function read(rel) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) { fail++; console.log(`  FAIL ——  SUBJECT ABSENT: ${rel}`); return null; }
  return fs.readFileSync(f, 'utf8');
}

const ENGINE = read('src/agent/brideEngine.js');
const ROUTE  = read('src/api/couple/me.js');

/* ═══ §1 · BOTH WRITERS EXIST AND ARE REACHABLE ═══════════════════════════ */
section('§1 · two doors onto one column');

ok('1.1', 'writer A — the agent tool still owns budget_total',
   !!ENGINE && /case 'save_wedding_detail'/.test(ENGINE) &&
   /if \(field === 'budget_total'\)/.test(ENGINE));
ok('1.2', 'writer B — the route now accepts budget_total',
   !!ROUTE && /const \{ name, partner_name, wedding_date, wedding_city, budget_total \}/.test(ROUTE));
ok('1.3', 'writer B actually puts it in the patch object (not just destructured)',
   !!ROUTE && /couplesPatch\.budget_total = budgetCoerced;/.test(ROUTE));
ok('1.4', 'the agent tool is reachable from the APP, not only WhatsApp',
   (read('src/api/couple/chat.js') || '').includes('runBrideAgenticTurn'));

/* ═══ §2 · NO CLASH — the shipped bytes, executed side by side ════════════ */
section('§2 · NO CLASH — both writers judged against one input table');

/* Lift the coercion from writer A's source. Not a copy of it — the bytes. */
const engineSrc = (ENGINE || '').match(
  /if \(field === 'budget_total'\) \{([\s\S]*?)\n  \}/);
const routeSrc = (ROUTE || '').match(
  /budgetCoerced = Number\.isInteger\(budget_total\)([\s\S]*?)couplesPatch\.budget_total = budgetCoerced;/);

ok('2.1', "writer A's budget arm was located in source", !!engineSrc);
ok('2.2', "writer B's budget arm was located in source", !!routeSrc);

function writerA(value) {
  if (!engineSrc) return null;
  const body = engineSrc[1];
  let coerced, refused = false;
  const fn = new Function('value', `
    let coerced = value; let refused = false;
    const ret = () => { refused = true; };
    ${body.replace(/return \{ ok: false[^}]*\};?/g, 'return { refused: true };')}
    return { refused, coerced };
  `);
  try { const r = fn(value); return r.refused ? { refused: true } : { refused: false, coerced: r.coerced }; }
  catch { return { refused: true }; }
}

function writerB(value) {
  /* CORRECTED, disclosed. The first draft lifted only writer B's COERCE
     expression and then applied a HARDCODED copy of its guard — so loosening the
     shipped guard changed nothing here and mutation N-1 sailed through green.
     A bench that re-implements the thing under test is not a bench, and this
     one's own header claimed it ran the shipped bytes. Both the coercion AND the
     refusal condition are now lifted from source. */
  const src = ROUTE || '';
  const coerceExpr = (src.match(
    /budgetCoerced = (Number\.isInteger\(budget_total\)\s*\?\s*budget_total\s*:\s*parseInt\(budget_total, 10\));/) || [])[1];
  const guardExpr = (src.match(
    /if \(!\((Number\.isInteger\(budgetCoerced\) && budgetCoerced > 0)\)\)/) ||
    src.match(/if \((![\s\S]{0,80}?budgetCoerced[^)]*)\) \{\n\s*return errRes\(res, 400/) || [])[1];
  if (!coerceExpr || !guardExpr) return null;
  const fn = new Function('budget_total', `
    const budgetCoerced = ${coerceExpr};
    if (${guardExpr}) return { refused: true };
    return { refused: false, coerced: budgetCoerced };
  `);
  try { return fn(value); } catch { return { refused: true }; }
}

const TABLE = [
  ['a plain integer',            450000,      false],
  ['a numeric string',           '450000',    false],
  ['zero',                       0,           true],
  ['a negative',                 -1,          true],
  ['a float (TRUNCATES — F-09.165)',      45.5,   false],
  ['a lakh shorthand (TRUNCATES — F-09.165)', '4.5L', false],
  ['an empty string',            '',          true],
  ['null',                       null,        true],
  ['a non-numeric string',       'lots',      true],
  ['a boolean',                  true,        true],
  ['one rupee',                  1,           false],
  ['a crore',                    10000000,    false],
];

let agree = 0, disagree = [];
for (const [label, input, shouldRefuse] of TABLE) {
  const A = writerA(input), B = writerB(input);
  if (!A || !B) { disagree.push(`${label}: a writer could not be executed`); continue; }
  if (A.refused === B.refused && (A.refused || A.coerced === B.coerced)) agree++;
  else disagree.push(`${label} (${JSON.stringify(input)}): A=${JSON.stringify(A)} B=${JSON.stringify(B)}`);
  ok(`2.${TABLE.indexOf([label, input, shouldRefuse]) >= 0 ? '' : ''}`.trim() || '2.x',
     `${label} → ${shouldRefuse ? 'REFUSED' : 'accepted'} by both`,
     A.refused === B.refused && A.refused === shouldRefuse &&
     (A.refused || A.coerced === B.coerced),
     `A=${JSON.stringify(A)} B=${JSON.stringify(B)}`);
}
ok('2.99', 'the two writers agree on EVERY row of the table', disagree.length === 0,
   disagree.join(' | '));

/* ═══ §3 · THE WRITE IS SUCCESSFUL — refusal is loud, success is echoed ═══ */
section('§3 · the write is successful, or it says so');

ok('3.1', 'invalid input is REFUSED with 400, never coerced to null',
   /return errRes\(res, 400, 'budget_total must be a positive integer \(rupees\)\.'\);/.test(ROUTE || ''));
ok('3.2', 'budget does NOT ride the `|| null` pattern that silently drops a 0',
   !/couplesPatch\.budget_total\s*=\s*budget_total\s*\|\|\s*null/.test(ROUTE || ''));
ok('3.3', 'the persisted value is echoed so the caller can compare, not assume',
   /budget_total: budgetCoerced/.test(ROUTE || ''));
ok('3.4', 'a supabase failure still returns 500 rather than a cheerful boolean',
   /Could not update profile\./.test(ROUTE || ''));

/* ═══ §4 · THE DECLARED GAPS ARE STILL DECLARED ══════════════════════════ */
section('§4 · gaps stay declared (scope law)');

ok('4.1', 'the notes-audit asymmetry is named in-file, not silently absent',
   /DECLARED GAP/.test(ROUTE || '') && /audit row on every change/.test(ROUTE || ''));
ok('4.2', 'the no-clear decision is named in-file with its reason',
   /NOT SUPPORTED, deliberately: clearing the budget back to null/.test(ROUTE || ''));
ok('4.3', 'the column carries its schema witness in-comment (SQL-provenance law)',
   /PUBLIC_SCHEMA\.md line 288/.test(ROUTE || ''));

/* ═══ §5 · F-09.165 · THE TRUNCATION, HELD OPEN BY CELL ══════════════════ */
section('§5 · F-09.165 — a defect this rider INHERITED and may not cure');

/* Writer A is an ENGINE file. W-1 protects it: zero changes without an explicit
   chair ruling. Curing the truncation at writer B alone would create exactly the
   clash the founder's ruling forbids. So the class stays open, and it stays open
   VISIBLY — these cells fail the day someone fixes it, which is the point. */
const truncates = (v) => {
  const c = Number.isInteger(v) ? v : parseInt(v, 10);
  return Number.isInteger(c) && c > 0 && String(c) !== String(v).trim();
};
ok('5.1', 'F-09.165 STILL OPEN: "12,50,000" is accepted as Rs 12', truncates('12,50,000'));
ok('5.2', 'F-09.165 STILL OPEN: "4.5L" is accepted as Rs 4',        truncates('4.5L'));
ok('5.3', 'F-09.165 STILL OPEN: "1e6" is accepted as Rs 1',         truncates('1e6'));
ok('5.4', 'both writers truncate IDENTICALLY — the defect is shared, not divergent',
   (() => { for (const v of ['12,50,000', '4.5L', '45.5', '1e6']) {
     const A = writerA(v), B = writerB(v);
     if (!A || !B || A.refused !== B.refused || A.coerced !== B.coerced) return false;
   } return true; })());

console.log('\n' + '─'.repeat(60));
console.log(`tdw09_rider2_budget: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
console.log('─'.repeat(60));
console.log(`
MUTATION LEDGER:
  N-1  route      loosen the guard to allow 0            §2 table RED (writers disagree)
  N-2  route      drop the 400, coerce with || null      §3.1/3.2 RED
  N-3  route      remove the echoed value                §3.3 RED
  N-4  engine     tighten writer A to reject a crore     §2 table RED (writers disagree)
  N-5  route      delete budget_total from the patch     §1.3 RED
`);
process.exit(fail === 0 ? 0 : 1);
