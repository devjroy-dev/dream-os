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

/* STRIP COMMENTS BEFORE SCANNING FOR CODE. Third time this class has bitten this
   arc: the parity bench counted 147 controls because two greps both read a
   comment describing controls, and cell 2.0b below went red on the word
   "parseInt(value, 10)" inside the very comment explaining that parseInt was
   REMOVED. A scanner that cannot tell code from prose about code is not a
   scanner. Raw text is kept for byte-assertions on copy. */
const decomment = (src) => (src || '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');

const ENGINE_RAW = read('src/agent/brideEngine.js');
const ROUTE_RAW  = read('src/api/couple/me.js');
const ENGINE = decomment(ENGINE_RAW);
const ROUTE  = decomment(ROUTE_RAW);

/* Scope the private-coercion check to the BUDGET ARM. brideEngine legitimately
   uses parseInt elsewhere (a muse list limit); convicting the whole file would
   be a false positive of the opposite kind. */
const ENGINE_BUDGET_ARM = (ENGINE.match(/if \(field === 'budget_total'\)[\s\S]{0,1400}?\n  \}/) || [''])[0];

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

/* ── R-26.5 · THE BENCH CHANGES SHAPE WITH THE CURE ──────────────────────────
   Before the cure the two writers each carried their own coercion, so proving
   「 no clash 」 meant lifting both writers' bytes and racing them. There is now
   ONE seat, so the honest question changed: not "do the two copies agree" but
   "do both doors actually reach the one seat, and does the seat do the right
   thing". Racing two copies that no longer exist would be a vacuous green.
   So §2 drives the SHIPPED coercion, and §2.0 proves neither writer kept a
   private copy — which is the modern form of no-clash. */
/* DYNAMIC, and deliberately. A static import of the seat makes this bench CRASH
   at the uncured tree instead of going red — and a crash is not evidence, it is
   an absent bench. The absent-subject law wants a conviction BY NAME. Loaded
   through a shim so the uncured tree produces a legible red on every cell that
   depends on the cure. */
let coerceBudget, PLAUSIBILITY_FLOOR, SAY;
try {
  const seat = await import('../src/lib/coerceBudget.js');
  ({ coerceBudget, PLAUSIBILITY_FLOOR, SAY } = seat.default || seat);
} catch {
  fail++;
  console.log('  FAIL ——  SUBJECT ABSENT: src/lib/coerceBudget.js (the one coercion seat)');
  coerceBudget = () => ({ ok: false, reason: 'the seat does not exist at this tree' });
  PLAUSIBILITY_FLOOR = null;
  SAY = { readBack: () => '', query: () => '' };
}

const TABLE = [
  //  input            expect            value
  ['a plain integer',            450000,      'ok',      450000],
  ['a numeric string',           '450000',    'ok',      450000],
  ['COMMA GROUPING (F-09.165)',  '12,50,000', 'ok',      1250000],
  ['comma grouping, lakhs',      '4,50,000',  'ok',      450000],
  ['LAKH SHORTHAND (F-09.165)',  '4.5L',      'ok',      450000],
  ['lakhs spelled out',          '4.5 lakhs', 'ok',      450000],
  ['crore spelled out',          '1 crore',   'ok',      10000000],
  ['crore shorthand',            '2Cr',       'ok',      20000000],
  ['a rupee glyph on input',     '\u20B94,50,000', 'ok', 450000],
  ['a bare decimal',             '45.5',      'refused', null],
  ['exponent notation',          '1e6',       'refused', null],
  ['zero',                       0,           'refused', null],
  ['a negative',                 -1,          'refused', null],
  ['a non-numeric string',       'lots',      'refused', null],
  ['an empty string',            '',          'refused', null],
  ['THE MAGNITUDE SLIP (F-09.167)', '50',     'confirm', 50],
  ['the magnitude slip, again',  '45',        'confirm', 45],
  ['THE LIKELIEST REAL SLIP',    '50000',     'confirm', 50000],
  ['one rupee above the floor',  100000,      'ok',      100000],
  ['one rupee below the floor',  99999,       'confirm', 99999],
];

/* CORRECTED, and it is a REPEAT of a defect I already caught once this arc —
   parity cell 7.2's first draft asserted an import string too. The require line
   proves a module was named, never that it was USED: mutation S-7 replaced the
   call with an inline parseInt, left the require standing, and this cell sailed
   through green. THE CALL SITE IS THE EVIDENCE. Asserting imports is now twice
   in my record; naming it here so the next reader of this file distrusts the
   pattern rather than the author. */
ok('2.0', 'BOTH writers CALL the seat — the call site, not the import line',
   /const verdict = coerceBudget\(value\);/.test(ENGINE || '') &&
   /const verdict = coerceBudget\(budget_total\);/.test(ROUTE || ''));
ok('2.0b', 'NEITHER writer kept a private coercion beside it',
   ENGINE_BUDGET_ARM.length > 0 &&
   !/parseInt/.test(ENGINE_BUDGET_ARM) &&
   !/parseInt\s*\(\s*budget_total/.test(ROUTE));

let row = 0;
for (const [label, input, expect, value] of TABLE) {
  row++;
  const r = coerceBudget(input);
  const got = !r.ok ? 'refused' : (r.confirm ? 'confirm' : 'ok');
  ok(`2.${row}`, `${label} -> ${expect}`,
     got === expect && (expect === 'refused' || r.value === value),
     `got ${got} ${JSON.stringify(r.value)}`);
}

/* ═══ §3 · THE WRITE IS SUCCESSFUL — refusal is loud, doubt is a question ═ */
section('§3 · the write is successful, or it says so');

ok('3.1', 'the route refuses an unreadable figure with 400 and the seat\'s reason',
   /return errRes\(res, 400, `budget_total \$\{verdict\.reason\}`\);/.test(ROUTE || ''));
ok('3.2', 'budget never rides the `|| null` pattern that silently drops a 0',
   !/couplesPatch\.budget_total\s*=\s*budget_total\s*\|\|\s*null/.test(ROUTE || ''));
ok('3.3', 'the persisted value is echoed so the caller can compare, not assume',
   /budget_total: budgetCoerced/.test(ROUTE || ''));
ok('3.4', 'a supabase failure still returns 500 rather than a cheerful boolean',
   /Could not update profile\./.test(ROUTE || ''));
ok('3.5', 'an ambiguous figure WRITES NOTHING at either door',
   /if \(verdict\.confirm\) \{[\s\S]{0,900}?return res\.status\(409\)/.test(ROUTE || '') &&
   /if \(verdict\.confirm\) \{[\s\S]{0,900}?return \{\s*ok: false/.test(ENGINE || ''));
ok('3.6', 'the route distinguishes invalid (400) from confirm-me (409)',
   /res\.status\(409\)/.test(ROUTE || '') && /errRes\(res, 400/.test(ROUTE || ''));

/* ═══ §4 · THE DECLARED GAPS ARE STILL DECLARED ══════════════════════════ */
section('§4 · gaps stay declared (scope law)');

/* These four assert COMMENT PROSE deliberately — a declared gap that is not
   written down has not been declared. They read ROUTE_RAW, because the
   decommented copy above would have stripped the very sentences under test.
   Two different questions, two different sources, named so the next reader does
   not "helpfully" point them at the same variable. */
ok('4.1', 'the notes-audit asymmetry is named in-file, not silently absent',
   /DECLARED GAP/.test(ROUTE_RAW || '') && /audit row on every change/.test(ROUTE_RAW || ''));
ok('4.2', 'the no-clear decision is named in-file with its reason',
   /NOT SUPPORTED, deliberately: clearing the budget back to null/.test(ROUTE_RAW || ''));
ok('4.3', 'the column carries its schema witness in-comment (SQL-provenance law)',
   /PUBLIC_SCHEMA\.md line 288/.test(ROUTE_RAW || ''));
ok('4.4', 'the route\'s 409 deviation is DECLARED, not silent',
   /DECLARED DEVIATION/.test(ROUTE_RAW || '') && /no next message to listen for/.test(ROUTE_RAW || ''));

/* ═══ §5 · F-09.165 + F-09.167 · CURED — the cells INVERT (R-26.5 §5) ════ */
section('§5 · the two findings are CURED, and the old assertions are reversed');

/* THESE CELLS USED TO ASSERT THE DEFECT. Between the filing and this commit they
   read "F-09.165 STILL OPEN: 12,50,000 is accepted as Rs 12" and went red the day
   someone fixed it — which is exactly what happened. Reversed in the same commit
   that cures, per the ruling, so the record shows the close rather than a silent
   deletion of the evidence. */
const cured = [
  ['12,50,000', 1250000], ['4,50,000', 450000], ['4.5L', 450000],
  ['1 crore', 10000000], ['2Cr', 20000000], ['\u20B94,50,000', 450000],
];
cured.forEach(([input, want], i) => {
  const r = coerceBudget(input);
  ok(`5.${i + 1}`, `F-09.165 CURED: "${input}" -> Rs ${want.toLocaleString('en-IN')}`,
     r.ok && !r.confirm && r.value === want, JSON.stringify(r));
});
ok('5.7', 'F-09.165 CURED: truncation is impossible — no input silently loses digits',
   ['12,50,000', '4,50,000', '2Cr', '1 crore'].every((v) => {
     const r = coerceBudget(v); return r.ok && r.value > 1000;
   }));
ok('5.8', 'F-09.167 CURED: "50" no longer persists silently — it asks',
   (() => { const r = coerceBudget('50'); return r.ok && r.confirm === true; })());
ok('5.9', 'F-09.167 CURED: "45" asks too', (() => { const r = coerceBudget('45'); return r.confirm === true; })());
ok('5.10', 'F-09.167 CURED: "50000" — the likeliest real slip — trips the floor',
   (() => { const r = coerceBudget('50000'); return r.confirm === true; })());
ok('5.11', 'the floor is the founder\'s number', PLAUSIBILITY_FLOOR === 100000);

/* ═══ §6 · THE FOUNDER'S THREE BYTES, VERBATIM ══════════════════════════ */
section('§6 · the bytes are his, character for character');

ok('6.1', 'the read-back is exactly the ruled byte',
   SAY.readBack(1250000) === 'Noted \u2014 Rs 12,50,000.', SAY.readBack(1250000));
ok('6.2', 'the query is exactly the ruled byte, on the ruled specimen',
   coerceBudget('50000').say === 'Rs 50,000 \u2014 is that the full wedding budget, or did you mean Rs 50,00,000?',
   coerceBudget('50000').say);
ok('6.3', 'the read-back carries the money register — grouped, whole, no glyph',
   /^Noted \u2014 Rs [0-9,]+\.$/.test(SAY.readBack(450000)) &&
   !/\u20B9/.test(SAY.readBack(450000)) && !/[LKk]|Cr/.test(SAY.readBack(450000)));
ok('6.4', 'the glyph is accepted on INPUT and never rendered back',
   coerceBudget('\u20B94,50,000').ok && !/\u20B9/.test(coerceBudget('\u20B94,50,000').say));
ok('6.5', 'every accepted figure carries a read-back — none lands mute',
   ['450000', '4.5L', '12,50,000', '1 crore'].every((v) => {
     const r = coerceBudget(v); return r.ok && typeof r.say === 'string' && r.say.length > 0;
   }));
ok('6.6', 'the mechanism comment names the seat as the single home for both doors (F-06.85)',
   (() => { const src = read('src/lib/coerceBudget.js') || '';
     return /F-06\.85 MECHANISM COMMENT/.test(src) &&
            /brideEngine\.js/.test(src) && /me\.js/.test(src) &&
            /CHANGE IT HERE/.test(src); })());
ok('6.7', 'the write-door law is recorded at the seat with its next scope named',
   /WRITE-DOOR LAW/.test(read('src/lib/coerceBudget.js') || '') &&
   /Expenses and Vendors/.test(read('src/lib/coerceBudget.js') || ''));

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
