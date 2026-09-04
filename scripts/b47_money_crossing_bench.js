#!/usr/bin/env node
'use strict';
// scripts/b47_money_crossing_bench.js — ROAD STEP 2c · THE MONEY WRITE-PLANE
// CROSSING. dream-os side.
//
//   node scripts/b47_money_crossing_bench.js
//
// Exit code is the verdict. Counts are DISCLOSED, never padded.
//
// ── WHAT THIS BENCH ASSERTS, AND WHAT IT REFUSES TO ────────────────────────
// Every cell below is either STRUCTURAL (a fact about the module graph and the
// text of a file, read raw) or BEHAVIOURAL against a stub supabase. None of
// them talks to a database, so none of them can claim a row exists.
//
// ⚠ COMMENT-BLINDNESS, EARNED AT F-39.13. A text cell that greps a source file
// must strip comments FIRST or it reads its own documentation as evidence —
// F-39.13 caught exactly that in `vendor.ts`, where a comment-strip swallowed
// live code and three absence cells went vacuously green. `strip()` below
// removes block and line comments and every cell that asserts ABSENCE runs on
// the stripped text; cells that assert PRESENCE of a named symbol run on it too,
// so a symbol that exists only in prose cannot pass.
//
// ── THE STRUCK CELL, DECLARED RATHER THAN DROPPED  [CE-39, ruling 3(a)] ─────
// The charter asked for: "every money write that emitted an event still does,
// through writeEvent". It was STRUCK at the read-first and the strike is
// recorded here rather than in a handover nobody re-reads. Derived at 051a413:
// money.js, invoices.js, expenses.js, schedules.js, binderWrite.js and
// ledger.js hold ZERO references to `public.events` or `writeEvent`, and
// engine.js's create_invoice / record_payment / log_expense hold none either.
// NO MONEY VERB EMITS A CALENDAR ENTRY. A cell asserting the preservation of an
// empty coupling passes over an unreachable path — vacuous green, which this
// estate treats as worse than a declared gap. It is therefore NOT WRITTEN, and
// this paragraph is why. If a money verb ever gains an event, this cell is owed.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const strip = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '')
     .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

let pass = 0; let fail = 0;
// Cells may be sync or async; the queue keeps them in declaration order so the
// printout reads as the file reads.
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

console.log('b47 · money write-plane crossing · dream-os\n');

// ── §1 · ONE WRITER HOME ──────────────────────────────────────────────────
cell(null, '§1 one writer home');

cell('1.1 money.js opens no table itself', () => {
  const s = strip(read('src/api/vendor/money.js'));
  // The read door's three SELECTs are the ONLY `.from(` calls permitted here,
  // and they are reads. Any insert/update/upsert/delete is the defect.
  // ⚠ `router.delete(` IS A ROUTE DECLARATION, NOT A TABLE MUTATION, and the
  // first cut of this cell reddened on it. An instrument's report is evidence
  // about the instrument first (F-39.25). The question is whether a supabase
  // CHAIN mutates, so the match is anchored on `.from(` — that is the only
  // shape a table write can take here.
  const flat = s.replace(/\s+/g, ' ');
  const bad = flat.match(/\.from\('[a-z_]+'\)\s*\.(insert|update|upsert|delete)\s*\(/g) || [];
  return bad.length === 0 || `money.js mutates a table directly: ${bad.join(' ')}`;
  // MUTATION: add `await supabase.from('invoices').insert({});` to any route
  // above `module.exports` -> RED.
});

cell('1.2 money.js write routes import the writer home', () => {
  // PROVEN-ONE-WAY. Green at the cured tree; no production mutation run.
  const s = strip(read('src/api/vendor/money.js'));
  const need = ['createInvoice', 'recordPayment', 'cancelInvoice', 'invoicePdfSource', 'createExpense', 'deleteExpense'];
  const miss = need.filter((n) => !new RegExp(`\\b${n}\\b`).test(s));
  return miss.length === 0 || `money.js does not reach the home for: ${miss.join(', ')}`;
});

cell('1.3 no file outside money.js mounts a /money route onto the typed writers', () => {
  // ── AMENDED AT CE-39 WRITER-HYGIENE. NARROWED, NOT WEAKENED. ─────────────
  //
  // WHAT IT ASSERTS NOW, QUOTED FIRST so a later seat reads the claim before
  // the history: every route whose PATH is under /money reaches the typed
  // writers only from money.js, and no file outside money.js mounts a /money
  // route at all. ONE ADDRESS SPACE FOR THE MONEY VERBS — which is c-2c.4's
  // law, stated as the law rather than as a proxy for it.
  //
  // WHAT IT ASSERTED BEFORE, AND WHY THAT WAS THE WRONG SUBJECT: 「one file
  // mounts the typed money writers, and it is money.js」, enforced as 「no
  // ROUTED FILE outside money.js may call a writer symbol」. That is a proxy.
  // It catches c-2c.4's real defect — two doors onto one table, which is what
  // src/api/vendor/expenses.js was — but it also catches a case that is not a
  // defect at all, and CE-39 walked straight into it: studio/payments.js's
  // mark-paid now logs its expense through createExpense. That route MOUNTS NO
  // MONEY ENDPOINT. It is a STUDIO route writing its own side-effect through
  // the writer home — the correct direction, and the one the hygiene sitting
  // was chartered to force. Under the old wording the cell reddened the cure.
  //
  // ⚠ THE NARROWING IS NOT A LOOSENING, AND THIS IS THE PARAGRAPH THAT PROVES
  // IT. The strong property — 「nothing outside the writer home opens
  // public.expenses with a mutation verb」 — is what c-2c.4 was actually
  // reaching for, and it is now asserted, mutation-proven in BOTH directions,
  // at b49_writer_hygiene_bench §2.1. It is a STRICTER claim than the one
  // removed here: the old line permitted any non-routed file to open the table
  // inline so long as it never named a writer symbol, which is exactly how
  // studio/payments.js opened public.expenses undetected for the whole of 2c.
  // The guard did not shrink; it moved to the file that can state it properly,
  // and got stronger on the way. RETIRE-WITH-THE-READER, across two benches.
  //
  // COUNT PRESERVED: one cell in, one cell out. 1.3b is untouched.
  //
  // THE `generateInvoiceForBinder` EXCEPTION RETIRES WITH THE WORDING THAT
  // NEEDED IT. It existed to exonerate a writer call in a routed file; this
  // cell no longer asks that question of any file. F-39.33 still carries the
  // finding itself, filed OPEN at the chair's hand, cure deferred past beta.
  // ⚠ THE ADDRESS IS DERIVED FROM THE MOUNT TABLE, NEVER FROM THE ROUTE LITERAL.
  // The first cut of this amendment matched `router.post('/invoices…` and the
  // like, and reddened `src/api/vendor/schedules.js` — which mounts at `/` and
  // whose `/invoices/:id/schedule` is therefore NOT under `/money` at all. A
  // route string is not an address; `core.js`'s `router.use` is. Caught by
  // running it, F-39.25's pattern once more on this arc.
  const WRITERS = /\b(createInvoice|updateInvoice|recordPayment|cancelInvoice|createExpense|updateExpense|deleteExpense)\s*\(/;
  const core = strip(read('src/api/vendor/core.js'));
  const mounts = [...core.matchAll(/router\.use\(\s*'([^']+)'\s*,\s*require\('([^']+)'\)/g)]
    .map((m) => ({ at: m[1], file: m[2] }));
  if (!mounts.length) return 'the vendor mount table could not be read from core.js';

  const moneyMounts = mounts.filter((m) => m.at === '/money');
  if (moneyMounts.length !== 1) {
    return `/money is mounted ${moneyMounts.length} time(s); one address space means exactly one`;
  }
  if (!/\/money$/.test(moneyMounts[0].file)) {
    return `/money is mounted from ${moneyMounts[0].file}, not money.js`;
  }

  // AND THE ONE ADDRESS SPACE MUST ACTUALLY BE INHABITED — otherwise this cell
  // passes vacuously the day money.js's routes are moved or deleted.
  const money = strip(read('src/api/vendor/money.js'));
  if (!/router\.(?:get|post|patch|put|delete)\s*\(/.test(money)) {
    return 'money.js mounts no route — the address space is empty and this cell would pass over nothing';
  }
  if (!WRITERS.test(money)) return 'money.js reaches no typed writer — the money door no longer uses the home';

  return !fs.existsSync(path.join(ROOT, 'src/lib/money'))
    || 'src/lib/money/ exists — a second home for public.invoices (c-39.32)';
  // MUTATION (the defect direction): add a second `router.use('/money', ...)` to
  // core.js, or re-point the existing one at another file -> RED.
  // MUTATION (the cure direction): studio/payments.js keeps calling createExpense
  // -> GREEN. Both run at the cut; see the handover's non-vacuity section.
  // MUTATION (the vacuity direction): strip money.js's routes -> RED.
});

cell('1.3b src/lib/money/ was never created', () => {
  // PROVEN-ONE-WAY. Asserts an ABSENCE, and the mutation that would red it
  // is creating the very thing the sitting refused to create. Green-only by
  // construction; labelled rather than padded.
  const p = path.join(ROOT, 'src/lib/money');
  return !fs.existsSync(p) || 'src/lib/money/ exists — a second home for public.invoices (c-39.32)';
});

cell('1.4 the engine tool switch is a DEFUSED ISLAND — no money verb lives there', () => {
  // ── AMENDED MID-SITTING · THE CHARTER'S EXTRACTION CLAUSE WENT VOID ───────
  // This cell asserted that `case 'record_payment'` and `case 'log_expense'`
  // in src/agent/engine.js call the writer home. They were extracted, the
  // floor reddened `b05_f0550_ping_drain_bench` §4.3 — 「a defusal that moves
  // an executable byte is not a defusal」 — and the reason is that BOTH CASES
  // SIT INSIDE THE F-05.56 DEFUSED ISLAND at src/agent/engine.js:753,
  // 「EVERYTHING BELOW THIS LINE HAS ZERO CALLERS SINCE ARC M5」, frozen under
  // CE-68 R4. record_payment is at 1508 and log_expense at 1769; the island
  // opens at 753. The extraction edited dead code and broke a freeze to do it.
  //
  // engine.js reverted byte-identical. The charter's extraction clause is
  // DISCHARGED-AS-VOID: its target was not a live writer.
  //
  // WHAT THIS CELL ASSERTS NOW is the fact that made the clause void, so the
  // next seat cannot re-charter the same extraction: the money cases are BELOW
  // the island line, and the island's two entry points have no callers. If
  // either ever gains one, this reds and the extraction becomes real work.
  const s = strip(read('src/agent/engine.js'));
  const raw = read('src/agent/engine.js');
  const islandAt = raw.split('\n').findIndex((l) => /ZERO CALLERS SINCE ARC M5/.test(l));
  if (islandAt < 0) return 'the F-05.56 island header is gone — re-derive before trusting this cell';
  const lines = raw.split('\n');
  for (const c of ['record_payment', 'log_expense']) {
    const at = lines.findIndex((l) => l.includes(`case '${c}'`));
    if (at < 0) return `case '${c}' not found`;
    if (at < islandAt) return `case '${c}' is ABOVE the island line — it may be live now`;
  }
  // The callers, swept rather than assumed. This is the sweep whose absence
  // produced c-2c.2 and the chair's c-39.33 on F-39.20.
  const callers = /\b(handleOnboarding|executeTool)\s*\(/g;
  const hits = (s.match(callers) || []).filter((h) => !/function/.test(h));
  const decls = (s.match(/async function (handleOnboarding|executeTool)\s*\(/g) || []).length;
  return hits.length === decls
    || `the island's entry points have ${hits.length - decls} caller(s) — it is no longer defused`;
});

// ── §2 · F-39.8 · THE PAYMENT WRITER STAMPS ITS OWN CLOCK ─────────────────
cell(null, '\n§2 F-39.8 — the payment clock and the transition');

cell('2.1 recordPayment stamps last_payment_at', () => {
  const s = strip(read('src/lib/vendor/invoices.js'));
  const i = s.indexOf('async function recordPayment');
  if (i < 0) return 'recordPayment not found in the home';
  const block = s.slice(i, s.indexOf('async function cancelInvoice'));
  return /last_payment_at:\s*stampedAt/.test(block)
    || 'recordPayment does not write last_payment_at — F-39.8 uncured';
  // MUTATION: delete the `last_payment_at: stampedAt,` line -> RED.
});

cell('2.2 the transition is a POSITIVE list, never a negation', () => {
  // PROVEN-ONE-WAY at the text level. Its BEHAVIOURAL twin, 2.3, IS mutation-
  // proven, and 2.3 is the one that would catch a real negation.
  const s = strip(read('src/lib/vendor/invoices.js'));
  if (!/const PAYABLE_STATES = \[\s*'unpaid',\s*'advance_paid'\s*\]/.test(s)) {
    return 'PAYABLE_STATES is not the ruled two-item positive list';
  }
  const i = s.indexOf('async function recordPayment');
  const block = s.slice(i, s.indexOf('async function cancelInvoice'));
  if (/state\s*!==\s*'paid'|state\s*<>\s*'paid'|!\s*\[[^\]]*'cancelled'/.test(block)) {
    return 'recordPayment gates on a negation — R-39.12';
  }
  return /PAYABLE_STATES\.includes\(inv\.state\)/.test(block)
    || 'recordPayment does not gate on PAYABLE_STATES';
  // MUTATION: replace the gate with `inv.state !== 'paid'` -> RED.
});

cell('2.3 behavioural — a short payment cannot be talked into paid', async () => {
  // The table this replaced let `payment_type: 'balance'` close an invoice
  // REGARDLESS of arithmetic. Run the real function against a stub client.
  const { recordPayment } = require(path.join(ROOT, 'src/lib/vendor/invoices.js'));
  const row = {
    id: 'i1', invoice_number: 'TDW/T/01', client_name: 'K', client_phone: null,
    lead_id: null, amount_total: 50000, amount_advance: null, amount_paid: 0,
    state: 'unpaid', due_date: null, created_at: '2026-01-01T00:00:00Z',
  };
  let written = null;
  const chain = () => {
    const o = {};
    o.select = () => o; o.eq = () => o; o.is = () => o;
    o.update = (patch) => { written = patch; return o; };
    o.maybeSingle = async () => ({ data: written ? { ...row, ...written } : row, error: null });
    o.single = o.maybeSingle;
    return o;
  };
  const r = await recordPayment({ from: chain }, 'v1', 'i1', { amount: 1, payment_type: 'balance' });
  if (!r.ok) return `refused outright: ${r.error}`;
  if (!written) return 'no update was issued';
  if (written.state !== 'advance_paid') {
    return `Rs 1 declared 'balance' produced state=${written.state} on a Rs 50,000 invoice`;
  }
  if (!written.last_payment_at) return 'the payment clock was not stamped';
  return true;
  // MUTATION: restore `if (payment_type === 'balance') newState = 'paid'` -> RED.
});

// ── §3 · THE BOOKS DOOR EMITS D-1's PARTICULARS  [F-39.21] ────────────────
cell(null, '\n§3 F-39.21 — the particular on the wire');

cell('3.1 the door SELECTs every field D-1 renders', () => {
  const s = strip(read('src/api/vendor/money.js'));
  const need = {
    'invoices.invoice_number': /INVOICE_SELECT[\s\S]{0,300}?invoice_number/,
    'invoices.client_name': /INVOICE_SELECT[\s\S]{0,300}?client_name/,
    'payment_schedules.milestone_label': /SCHEDULE_SELECT[\s\S]{0,300}?milestone_label/,
    'expenses.category': /EXPENSE_SELECT[\s\S]{0,300}?category/,
    'expenses.description': /EXPENSE_SELECT[\s\S]{0,300}?description/,
  };
  const miss = Object.keys(need).filter((k) => !need[k].test(s));
  return miss.length === 0 || `not selected: ${miss.join(', ')}`;
  // MUTATION: drop `client_name` from INVOICE_SELECT -> RED.
});

cell('3.2 the door PROJECTS the particular onto every movement', () => {
  const s = strip(read('src/api/vendor/money.js'));
  const projected = (s.match(/particular:\s*\{/g) || []).length;
  if (projected < 3) return `only ${projected} particular projections (credit×2 + debit expected)`;
  return /particular:\s*m\.particular/.test(s)
    || 'the movement row does not carry particular onto the wire';
  // MUTATION: delete `particular: m.particular || null,` from the row map -> RED.
});

cell('3.3 invoices.description is NOT on the wire  [F-39.23]', () => {
  // PROVEN-ONE-WAY. An absence cell: green at the cured tree, no mutation run.
  // ⚠ An absence cell can pass VACUOUSLY if INVOICE_SELECT is renamed out from
  // under it, which is why it reads the named const and not the whole file.
  const s = strip(read('src/api/vendor/money.js'));
  const sel = (s.match(/const INVOICE_SELECT =[\s\S]*?;/) || [''])[0];
  return !/description/.test(sel)
    || 'INVOICE_SELECT carries description — F-39.23 puts a rupee glyph audit log on the money surface';
});

cell('3.4 opening/closing are READ, never summed', () => {
  const s = strip(read('src/api/vendor/money.js'));
  if (!/const opening = 0;/.test(s)) return 'opening is not the constructed zero';
  if (!/const closing = rows\.length \? rows\[rows\.length - 1\]\.balance : 0;/.test(s)) {
    return 'closing is not the last row\'s own balance cell';
  }
  // ── AMENDED AT 2a-dreamos · RETIRE-WITH-THE-READER ──────────────────────
  // It counted `.reduce(` across the WHOLE FILE and capped it at two — the
  // register's own received/outstanding. That was the whole truth when the file
  // was only the register. The two room reads now derive `total_outstanding`,
  // `total_collected` and `total_spent` server-side BY RULING, so the count hit
  // five and the cell reddened on work it was written to permit. Same shape as
  // b46 §1.1 one ZIP earlier: a rule written at file scope for a subject that
  // has since grown neighbours.
  //
  // AMENDED, NOT RELAXED. The rule is unchanged — THE REGISTER sums nothing new
  // — and it is now asserted of the register's own route instead of the file
  // that hosts it. The room reads' reduces are covered by 5.6, which asserts
  // they exist; nothing is left unguarded by the narrowing.
  const bI = s.indexOf("'/books/:vendorId'");
  if (bI < 0) return 'the books route is not in this file';
  const bEnd = s.indexOf('router.get(', bI + 10);
  const booksBlock = s.slice(bI, bEnd < 0 ? s.length : bEnd);
  const reduces = (booksBlock.match(/\.reduce\(/g) || []).length;
  return reduces === 2
    || `${reduces} reduce() calls inside the books route — the register must sum nothing new`;
});

// ── §4 · THE FIVE VERBS ARE MOUNTED, TYPED, AND GATED ─────────────────────
cell(null, '\n§4 the five verbs');

cell('4.1 all six typed money routes exist on the router', () => {
  // PROVEN-ONE-WAY. Green at the cured tree; no production mutation run.
  const s = strip(read('src/api/vendor/money.js'));
  const want = [
    /router\.post\('\/invoices\/:vendorId'/,
    /router\.post\('\/expenses\/:vendorId'/,
    /router\.patch\('\/invoices\/:vendorId\/:invoiceId\/cancel'/,
    /router\.post\('\/invoices\/:vendorId\/:invoiceId\/payments'/,
    /router\.delete\('\/expenses\/:vendorId\/:expenseId'/,
    /router\.get\('\/invoices\/:vendorId\/:invoiceId\/pdf'/,
  ];
  const miss = want.filter((r) => !r.test(s)).length;
  return miss === 0 || `${miss} of six typed money routes missing`;
});

cell('4.2 every write route is vendor-JWT gated', () => {
  const s = strip(read('src/api/vendor/money.js'));
  if (!/const vendorGate = \[requireAuth, resolveVendor\(\{ paramName: 'vendorId' \}\)\]/.test(s)) {
    return 'vendorGate is not the requireAuth + resolveVendor pair';
  }
  const routes = s.match(/router\.(post|patch|delete|get)\('\/(invoices|expenses)[^\n]*/g) || [];
  const ungated = routes.filter((r) => !/\.\.\.vendorGate/.test(r));
  return ungated.length === 0 || `ungated route(s): ${ungated.join(' | ')}`;
  // MUTATION: drop `...vendorGate` from the payments route -> RED.
});


cell('4.3 the PDF door answers `pdf_url`, the estate-wide name [F-2c.w7]', () => {
  // THE DOOR IS THE ONE THAT WAS WRONG, not the caller. Every other invoice
  // shape in this estate spells the link `pdf_url` — the column itself
  // (public.invoices ordinal 13), `updateInvoicePdfUrl` in the writer home,
  // the create route's okRes in `src/api/vendor/invoices.js`, the binder
  // `/:invoiceId/pdf` arm, the admin detail view, the agent's send arm. This
  // door alone answered `url`, and the pwa carried a fallback to survive it.
  //
  // ASSERTED POSITIVELY AND NEGATIVELY, because only the pair is the claim: the
  // new name must be there AND the old one must be gone. A door answering both
  // would pass a presence-only cell while leaving the second spelling alive.
  const s = strip(read('src/api/vendor/money.js'));
  const i = s.indexOf("router.get('/invoices/:vendorId/:invoiceId/pdf'");
  if (i < 0) return 'the PDF route could not be located';
  const block = s.slice(i);
  const okLine = (block.match(/return okRes\(res, \{[^\n]*invoice_number[^\n]*/) || [])[0];
  if (!okLine) return 'the PDF door has no success response naming invoice_number';
  if (/\burl:/.test(okLine)) return `the door still answers the bare \`url\`: ${okLine}`;
  return /\bpdf_url:/.test(okLine) || `the door does not answer \`pdf_url\`: ${okLine}`;
  // MUTATION: return `{ url: signed.signedUrl, ... }` -> RED on the negative leg.
  // Run at the uncured tree: RED.
});


// ── §5 · THE TWO ROOM READS  [2a-dreamos, c-2c.3] ─────────────────────────
cell(null, '\n§5 the two room reads');

cell('5.1 the module LOADS — the gate is not in its own dead zone', () => {
  // NOT A SYNTAX CELL. `const vendorGate` sat below the write doors; the two
  // room reads register earlier in the file, so the first cut put the const in
  // its own temporal dead zone and the router threw at module load. `node
  // --check` passed it — a TDZ is a runtime binding fact, not a syntax one.
  // Requiring the module is the only instrument that can see it (D-38.1: observe
  // at the defect's moment).
  const r = require(path.join(ROOT, 'src/api/vendor/money.js'));
  return (r && Array.isArray(r.stack)) || 'the money router did not load';
  // MUTATION: move `const vendorGate = …` below the room reads -> RED.
});

cell('5.2 both room reads are mounted, gated, and GET', () => {
  const r = require(path.join(ROOT, 'src/api/vendor/money.js'));
  const want = ['/invoices/:vendorId', '/expenses/:vendorId'];
  for (const p0 of want) {
    const layer = (r.stack || []).find((l) => l.route && l.route.path === p0);
    if (!layer) return `${p0} is not mounted`;
    const methods = Object.keys(layer.route.methods);
    if (methods.length !== 1 || methods[0] !== 'get') return `${p0} answers ${methods.join(',')}`;
  }
  const s = strip(read('src/api/vendor/money.js'));
  const ungated = (s.match(/router\.get\('\/(invoices|expenses)\/:vendorId'[^\n]*/g) || [])
    .filter((l) => !/\.\.\.vendorGate/.test(l));
  return ungated.length === 0 || `ungated room read: ${ungated.join(' | ')}`;
});

cell('5.3 both room reads filter deleted_at IS NULL', () => {
  const s = strip(read('src/api/vendor/money.js'));
  for (const t of ['invoices', 'expenses']) {
    const i = s.indexOf(`router.get('/${t}/:vendorId'`);
    if (i < 0) return `/${t}/:vendorId not found`;
    const block = s.slice(i, i + 1200);
    if (!/\.is\('deleted_at', null\)/.test(block)) {
      return `/${t}/:vendorId does not filter deleted_at — a soft-deleted row would re-enter the room`;
    }
  }
  return true;
  // MUTATION: drop `.is('deleted_at', null)` from either -> RED.
});

cell('5.4 the room reads SELECT every field their response type declares', () => {
  const s = strip(read('src/api/vendor/money.js'));
  const inv = (s.match(/const ROOM_INVOICE_SELECT =[\s\S]*?;/) || [''])[0];
  const exp = (s.match(/const ROOM_EXPENSE_SELECT =[\s\S]*?;/) || [''])[0];
  // The columns InvoicesResponse / ExpensesResponse name in the pwa's types.
  const needInv = ['id', 'invoice_number', 'client_name', 'client_phone',
                   'amount_total', 'amount_paid', 'due_date', 'state', 'created_at'];
  const needExp = ['id', 'amount', 'category', 'description', 'expense_date',
                   'client_name', 'created_at'];
  const missInv = needInv.filter((c) => !new RegExp(`\\b${c}\\b`).test(inv));
  const missExp = needExp.filter((c) => !new RegExp(`\\b${c}\\b`).test(exp));
  if (missInv.length) return `invoice select misses: ${missInv.join(', ')}`;
  if (missExp.length) return `expense select misses: ${missExp.join(', ')}`;
  return true;
  // MUTATION: drop `client_phone` from ROOM_INVOICE_SELECT -> RED.
});

cell('5.5 outstanding on the ROOM reads the same positive list as the REGISTER', () => {
  // Two doors on one plane disagreeing about what is owed is the
  // two-derivations disease wearing two doors instead of two files. F-P3.1
  // earned the rule on this exact column: `state <> 'paid'` returns cancelled
  // invoices as money owed.
  // ── LABELED AMENDMENT (CE-40, the Victor sitting · R-VS.2). RE-AIMED, TEETH
  // KEPT, COUNT PRESERVED, RATIFY-OR-REVERT. This cell asserted the positive list
  // was read INSIDE this router's own block — true while the derivation lived
  // there, and superseded by ruling: R-VS.2 moved `readOutstanding` and
  // `OUTSTANDING_STATES` to `src/lib/vendor/invoices.js` so the room and Victor's
  // fact block cannot become two derivations of one number. The cell's SUBJECT is
  // unchanged and is the thing that ever mattered — ONE POSITIVE LIST, NEVER A
  // NEGATION — so it now follows the value to its home instead of pinning its old
  // address. F-38.27's class, refused: a bench that reds because a ruled cure
  // landed is asserting a retired spelling, not a property.
  const s = strip(read('src/api/vendor/money.js'));
  const i = s.indexOf("router.get('/invoices/:vendorId'");
  const block = s.slice(i, i + 2600);
  if (/state\s*!==\s*'paid'|!\s*\[[^\]]*'cancelled'/.test(block)) {
    return 'the room read gates outstanding on a negation — R-39.12';
  }
  if (!/readOutstanding\(/.test(block)) {
    return 'the room read no longer reaches the one home — a second derivation is back';
  }
  const home = strip(read('src/lib/vendor/invoices.js'));
  if (/state\s*!==\s*'paid'|!\s*\[[^\]]*'cancelled'/.test(home)) {
    return 'the HOME gates outstanding on a negation — R-39.12';
  }
  if (!/const OUTSTANDING_STATES = \['unpaid', 'advance_paid'\]/.test(home)) {
    return 'the positive list is not declared at its one home';
  }
  return /OUTSTANDING_STATES\.includes/.test(home)
    || 'the home does not gate outstanding on the positive list';
  // MUTATION: replace the home's filter with `r.state !== 'paid'` -> RED.
});

cell('5.7 both EDIT doors are mounted, gated, and reach the home', () => {
  // c-2c.3's second instance: AddSheet's four update sites (:297 :317 :366 :367)
  // had no typed door on either table. The home decides what is editable —
  // updateInvoice refuses a paid or cancelled row, updateExpense validates
  // category and amount — so the door restates neither rule.
  const r = require(path.join(ROOT, 'src/api/vendor/money.js'));
  for (const p0 of ['/invoices/:vendorId/:invoiceId', '/expenses/:vendorId/:expenseId']) {
    const layer = (r.stack || []).find((l) => l.route && l.route.path === p0
      && l.route.methods.patch);
    if (!layer) return `PATCH ${p0} is not mounted`;
  }
  const s2 = strip(read('src/api/vendor/money.js'));
  const lines = (s2.match(/router\.patch\('\/(invoices|expenses)\/:vendorId\/:[a-zA-Z]+'[^\n]*/g) || []);
  if (lines.length !== 2) return `${lines.length} edit routes matched, expected 2`;
  const ungated = lines.filter((l) => !/\.\.\.vendorGate/.test(l));
  if (ungated.length) return `ungated edit route: ${ungated.join(' | ')}`;
  return /updateInvoice\(/.test(s2) && /updateExpense\(/.test(s2)
    || 'the edit doors do not reach the writer home';
  // MUTATION: drop `...vendorGate` from either PATCH -> RED.
});

cell('5.8 expenses.js keeps its engine GET and mounts no write route', () => {
  // c-2c.4. The three typed write routes retired from this file — swept ZERO
  // callers at bb4a9ad — and its engine-plane GET survives until 2a-pwa
  // re-points it. A write route reappearing here is the second home returning.
  const e = require(path.join(ROOT, 'src/api/vendor/expenses.js'));
  const verbs = (e.stack || []).filter((l) => l.route)
    .flatMap((l) => Object.keys(l.route.methods));
  const nonGet = verbs.filter((v) => v !== 'get');
  if (nonGet.length) return `expenses.js mounts ${nonGet.join(', ')} — c-2c.4 returning`;
  return verbs.length === 1 || `expenses.js mounts ${verbs.length} routes, expected 1 GET`;
  // MUTATION: restore `router.post('/', ...)` in expenses.js -> RED.
});

cell('5.6 amount_owed and the summary figures are derived SERVER-side', () => {
  // ── LABELED AMENDMENT (CE-40 · R-VS.2). RE-AIMED, TEETH KEPT, COUNT PRESERVED,
  // RATIFY-OR-REVERT. The subject is SERVER-SIDE DERIVATION — that the client is
  // never handed raw rows to total for itself. That is still true and is now true
  // at one home instead of two. Asserted where the arithmetic lives.
  const home = strip(read('src/lib/vendor/invoices.js'));
  const has = /amount_owed:\s*total - paid/.test(home)
    && /total_outstanding:/.test(home) && /total_collected:/.test(home);
  return has || 'the reader home does not compute amount_owed and the summary itself';
  // MUTATION: emit rows without amount_owed -> RED. The client-side twin (the
  // pwa must not re-derive them) is 2a-pwa's own cell, by ruling.
});

// ── §6 · SEATED ELSEWHERE, BY RULING ──────────────────────────────────────
// The base_guard.sh equality cell is seated in the pwa's `b40`, not here — the
// chair's ruling, and the correct one: the comment-only fork is cured in ZIP 2,
// so a cell here would red at ZIP 1's own floor for work that has not shipped.

// ── VERDICT ───────────────────────────────────────────────────────────────
runAll().then(() => {
  console.log(`\nb47 — ${pass} PASS · ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
});
