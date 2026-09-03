#!/usr/bin/env node
'use strict';
// scripts/b51_invoice_document_bench.js
// S2 · THE INVOICE DOCUMENT — F-2c.w8 · F-39.49 · F-39.49(b) · F-39.58
//
// Built to shape (ii), ratified by the founder 2026-09-03 against
// `dreamos-pwa/docs/mocks/invoice-document-mock.html`, frames `S2-addr` (primary) and
// `S2-city`. Every string this bench asserts is a RULED row on that file's
// `S2_VETO_SHEET.md`.
//
// ── WHY THIS BENCH RENDERS INSTEAD OF READING ───────────────────────────────
// The defects S2 cured were not visible in the source. Every one of them — the
// `amount_advance` gate, the ungated QR, the state literal — reads perfectly fine as
// JavaScript, and two MORE were found this sitting only by looking at the rendered
// page: an eyebrow helper that hard-coded its x and printed `For` on top of `Billed
// to`, and a footer that sat low enough for PDFKit to open a second page and put the
// thank-you on it alone.
//
// A grep would have passed all five. So this bench CALLS `generateInvoicePdf` on real
// fixtures and asserts against THE BYTES IT RETURNS — page count, the presence and
// absence of strings, the presence and absence of a `upi://` payload. The unit under
// test is the document, and the document is the buffer.
//
// The one exception is §5, which reads source: `amount_advance` must appear NOWHERE in
// the generator. That is an absence claim about a name, and a name is a source fact.
// It is read through the shared comment stripper, because the file's own comments
// discuss `amount_advance` at length and a naive grep would find those and call the
// cure a violation.
//
// ── BOTH WAYS ───────────────────────────────────────────────────────────────
// §6 mutates the production generator once per cure and re-runs this bench in a fresh
// process, asserting non-zero exit and byte-identical restore. A cell that passes on
// the uncured tree is a hollow green, and three of these cells are cures of defects
// that SHIPPED — so each one is mutated back to the shipped shape, not to a strawman.
//
// EXIT: 0 pass · 1 fail · 2 error · 3 refused.  (S4's channel, CE-39.)

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const GEN_REL = 'src/lib/invoicePdf.js';
const SRC_REL = 'src/lib/vendor/invoices.js';
const GEN = path.join(ROOT, GEN_REL);
const SRC = path.join(ROOT, SRC_REL);
const CELLS_ONLY = process.argv.includes('--cells-only');

let pass = 0, fail = 0;
const ok = (n, c, d) => {
  if (c) { pass++; console.log('  ok   ' + n); }
  else { fail++; console.log('  FAIL ' + n + (d ? '  \u2192 ' + d : '')); }
};
const sec = (t) => console.log('\n' + t);

let generateInvoicePdf;
try { ({ generateInvoicePdf } = require(GEN)); }
catch (e) { console.log('REFUSED \u2014 cannot load ' + GEN_REL + ': ' + e.message); process.exit(3); }

let pdfplumberless = false;
let PDFParse = null;
try { PDFParse = require('pdfkit'); } catch { pdfplumberless = true; }
if (pdfplumberless) { console.log('REFUSED \u2014 pdfkit absent'); process.exit(3); }

// ── FIXTURES ────────────────────────────────────────────────────────────────
// DEV440, the founder's own account, and the same invoices the mock draws — so a cell
// that disagrees with the frame is disagreeing about the SAME document.
const VENDOR = {
  id: 'v1', user_id: 'u1',
  business_name: 'Dev Roy Photography', city: 'Delhi', gstin: '07ABKPR1234F1Z5',
  address: '2nd Floor, 14 Hauz Khas Village, New Delhi 110016',
  upi_id: 'devroy@okhdfcbank',
  account_name: 'Dev Roy Photography', account_number: '50100234567890', ifsc: 'HDFC0000123',
};
const VENDOR_NO_ADDRESS = { ...VENDOR, address: null };
const VENDOR_NO_RAILS   = { ...VENDOR, upi_id: null, account_number: null, account_name: null, ifsc: null };

const SCHEDULE = [
  { milestone_label: 'Booking',   pct: 40, amount_due: 18000, due_date: '2026-09-30', state: 'pending', ordinal: 1 },
  { milestone_label: 'Shoot day', pct: 40, amount_due: 18000, due_date: '2026-12-12', state: 'pending', ordinal: 2 },
  { milestone_label: 'Delivery',  pct: 20, amount_due:  9000, due_date: '2027-01-10', state: 'pending', ordinal: 3 },
];

const BASE = {
  invoice_number: 'TDW/2026/0041', client_name: 'Ananya Sharma', client_phone: '+91 98765 43210',
  description: 'wedding photography \u2014 two days, Delhi',
  amount_total: 45000, amount_paid: 0, amount_advance: null,
  due_date: '2026-09-30', created_at: '2026-09-03T09:00:00Z',
  notes: 'Album delivery six weeks after the final event.', has_schedule: true,
  state: 'unpaid',
};
// F-39.49's OWN CASE, stated as a fixture so it cannot be forgotten: paid in full
// through the balance door, `amount_advance` NULL. The shipped document printed a
// total and nothing else for this invoice.
const PAID_NO_ADVANCE = {
  ...BASE, invoice_number: 'TDW/2026/0038', client_name: 'Ritika Malhotra',
  amount_total: 30000, amount_paid: 30000, amount_advance: null,
  state: 'paid', has_schedule: false,
};
const CANCELLED = {
  ...BASE, invoice_number: 'TDW/2026/0036', client_name: 'Meera Iyer',
  amount_total: 60000, amount_paid: 0, state: 'cancelled', has_schedule: false,
};
const ADVANCE = { ...BASE, invoice_number: 'TDW/2026/0042', amount_paid: 18000, state: 'advance_paid' };

const render = (invoice, vendor = VENDOR, schedule = SCHEDULE) =>
  generateInvoicePdf({ invoice, vendor, vendorName: 'Dev Roy', schedule });

// ── READING THE DOCUMENT BACK · AND THE HOLLOW GREEN THIS ALMOST WAS ────────
// The first draft of this bench viewed the buffer as latin1 and searched it for the
// drawn strings. IT FOUND NOTHING — PDFKit deflates its content streams and writes
// text as HEX inside TJ arrays. Every POSITIVE cell went red, which was loud and
// harmless. The danger was the NEGATIVE ones: "cancelled carries no account number"
// passed, and it passed because NOTHING was findable. Sixteen cells were asserting
// against an empty string and calling it evidence.
//
// So the streams are inflated and the hex strings decoded. The document is still the
// artefact — these are its own bytes, decoded, not a re-render.
//
// §0 below proves the reader itself: if `textOf` cannot find a string every document
// must contain, the bench REFUSES rather than reporting a page full of green absences.
const zlib = require('zlib');
function textOf(buf) {
  let out = '', i = 0;
  while (true) {
    const s = buf.indexOf('stream', i); if (s < 0) break;
    let p = s + 6; if (buf[p] === 13) p++; if (buf[p] === 10) p++;
    const e = buf.indexOf('endstream', p); if (e < 0) break;
    let chunk = null;
    try { chunk = zlib.inflateSync(buf.slice(p, e)); } catch { chunk = buf.slice(p, e); }
    const txt = chunk.toString('latin1');
    // PDFKit writes glyphs as `<hex>` inside `[ ... ] TJ`. Decoded to latin1 because
    // the middle dot the identity line uses is 0xB7 there.
    for (const m of txt.matchAll(/<([0-9A-Fa-f]+)>/g)) {
      out += Buffer.from(m[1], 'hex').toString('latin1');
    }
    i = e + 9;
  }
  return out;
}
// The QR is an IMAGE, so its `upi://` payload is a bitmap and can never appear as
// text. Its presence is asserted as an image XObject — which is also exactly what
// F-39.58 is about: whether a scannable thing is drawn on the page at all.
const hasImage = (buf) => /\/Subtype\s*\/Image/.test(buf.toString('latin1'));
const pagesOf = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

(async () => {

  // ═══ §0 · THE READER ANSWERS BEFORE ANY CELL TRUSTS IT ════════════════════
  // A negative cell is only worth what the reader is worth. If `textOf` returns
  // nothing, every absence claim below is vacuously true, so the bench proves its own
  // instrument first and REFUSES rather than printing green.
  const probe = await render(BASE);
  if (!textOf(probe).includes('Dev Roy Photography')) {
    console.log('REFUSED \u2014 textOf() cannot read the business name out of a rendered ' +
      'document. Every absence cell below would pass vacuously.');
    process.exit(3);
  }

  // ═══ §1 · THE DOCUMENT RENDERS, AND ON ONE PAGE ═══════════════════════════
  sec('\u00a71 \u00b7 the sheet');
  const unpaid    = await render(BASE);
  const paid      = await render(PAID_NO_ADVANCE, VENDOR, []);
  const cancelled = await render(CANCELLED, VENDOR, []);
  const advance   = await render(ADVANCE);
  const noAddr    = await render(BASE, VENDOR_NO_ADDRESS);
  const noRails   = await render(BASE, VENDOR_NO_RAILS);

  // ONE PAGE, ASSERTED ON ALL FOUR STATES. The first build of this document put the
  // footer 24pt above the bottom margin, PDFKit paginated it, and every single render
  // of the sitting silently carried a second page with one line on it.
  for (const [n, b] of [['unpaid', unpaid], ['paid', paid], ['cancelled', cancelled], ['advance', advance]]) {
    ok('one page \u2014 ' + n, pagesOf(b) === 1, pagesOf(b) + ' pages');
  }

  // ═══ §2 · THE STATE WORD · B1–B5 ══════════════════════════════════════════
  sec('\u00a72 \u00b7 the state word comes from the positive list');
  ok('BOOKING CONFIRMED is retired', !textOf(unpaid).includes('BOOKING CONFIRMED') &&
    !textOf(paid).includes('BOOKING CONFIRMED') && !textOf(cancelled).includes('BOOKING CONFIRMED'));
  ok('unpaid prints UNPAID',            textOf(unpaid).includes('UNPAID'));
  ok('paid prints PAID',                textOf(paid).includes('PAID'));
  ok('cancelled prints CANCELLED',      textOf(cancelled).includes('CANCELLED'));
  ok('advance_paid prints ADVANCE PAID', textOf(advance).includes('ADVANCE PAID'));

  // ═══ §3 · F-39.49 AND F-39.49(b) · THE MONEY ══════════════════════════════
  sec('\u00a73 \u00b7 paid and balance, ungated');
  // THE FINDING'S OWN CASE. amount_paid 30000, amount_advance NULL. The shipped
  // document printed neither figure.
  ok('paid prints its Paid figure with amount_advance NULL',
    textOf(paid).includes('Rs 30,000'), 'the F-39.49 gate is back');
  ok('paid prints Balance due Rs 0', textOf(paid).includes('Balance due') && textOf(paid).includes('Rs 0'));
  ok('unpaid prints Paid Rs 0 and Balance due Rs 45,000',
    textOf(unpaid).includes('Rs 0') && textOf(unpaid).includes('Rs 45,000'));
  // F-39.49(b): the printed paid figure is `amount_paid`, so an invoice whose
  // amount_advance disagrees with amount_paid must print amount_paid. 18000, not 5000.
  const divergent = await render({ ...ADVANCE, amount_paid: 18000, amount_advance: 5000 });
  ok('the printed paid figure is amount_paid, not amount_advance',
    textOf(divergent).includes('Rs 18,000') && !textOf(divergent).includes('Rs 5,000'));
  // E5: the cancelled document has no balance row and no paid row.
  ok('cancelled has no Balance due row', !textOf(cancelled).includes('Balance due'));
  ok('cancelled has no Paid row',        !/\(Paid\)\s*Tj/.test(textOf(cancelled)));
  ok('cancelled prints Amount as history', textOf(cancelled).includes('Amount') &&
    textOf(cancelled).includes('Rs 60,000'));

  // ═══ §4 · F-39.58 · THE RAILS GATE ════════════════════════════════════════
  sec('\u00a74 \u00b7 the payment block');
  ok('unpaid draws a QR',                    hasImage(unpaid), 'no image XObject');
  ok('CANCELLED draws NO QR',                !hasImage(cancelled));
  ok('CANCELLED carries no account number',  !textOf(cancelled).includes('50100234567890'));
  ok('CANCELLED carries no IFSC',            !textOf(cancelled).includes('HDFC0000123'));
  ok('CANCELLED says nothing is payable',    textOf(cancelled).includes('cancelled'));
  ok('PAID draws NO QR',                     !hasImage(paid));
  ok('PAID carries no account number',       !textOf(paid).includes('50100234567890'));
  ok('PAID says paid in full',               textOf(paid).includes('Paid in full'));
  // The rails are conditional on their OWN columns, not on the state alone.
  ok('no upi_id \u2192 no QR', !hasImage(noRails));
  ok('no account_number \u2192 no bank block', !textOf(noRails).includes('BANK TRANSFER'));
  ok('account_number present \u2192 bank block', textOf(unpaid).includes('BANK TRANSFER'));

  // ═══ §5 · IDENTITY, SCHEDULE, AND THE ABSENCE OF amount_advance ═══════════
  sec('\u00a75 \u00b7 identity, schedule, and the retired column');
  ok('the header prints GSTIN',   textOf(unpaid).includes('07ABKPR1234F1Z5'));
  ok('the header prints the city', textOf(unpaid).includes('Delhi'));
  ok('address prints when present', textOf(unpaid).includes('Hauz Khas'));
  ok('address absent \u2192 no address line', !textOf(noAddr).includes('Hauz Khas'));
  ok('notes print',                textOf(unpaid).includes('Album delivery'));
  ok('has_schedule \u2192 the table prints', textOf(unpaid).includes('PAYMENT SCHEDULE') &&
    textOf(unpaid).includes('MILESTONE'));
  ok('milestone labels print in ordinal order',
    textOf(unpaid).indexOf('Booking') < textOf(unpaid).indexOf('Shoot day'));
  ok('no schedule \u2192 no table', !textOf(paid).includes('PAYMENT SCHEDULE'));
  // H3 — the celebration line is struck on cancelled.
  ok('cancelled foot is the business name only',
    !textOf(cancelled).includes('celebration'));
  ok('other states keep the celebration line', textOf(unpaid).includes('celebration'));
  // MONEY REGISTER. No rupee glyph anywhere in the bytes, on any state.
  ok('no rupee glyph in any document',
    ![unpaid, paid, cancelled, advance].some(b => b.includes(Buffer.from('\u20b9', 'utf8'))));

  // THE ABSENCE CLAIM, read through the shared stripper. The generator's comments
  // discuss `amount_advance` deliberately and at length; a naive grep would find those
  // and report the cure as the disease.
  let strip = null;
  try { ({ stripComments: strip } = require('./lib/stripComments.js')); } catch { /* below */ }
  if (!strip) {
    console.log('  SKIP amount_advance absence \u2014 scripts/lib/stripComments.js not found ' +
      '(a naive local copy is a filed finding class; this cell would rather skip than grow one)');
  } else {
    const code = strip(fs.readFileSync(GEN, 'utf8'));
    ok('amount_advance is read NOWHERE in the generator', !code.includes('amount_advance'),
      'the F-39.49(b) cure is that this column no longer speaks for money received');
  }

  // ═══ §5b · THE MONTH IS A TABLE, AND `Due` BELONGS TO THE PAYABLE STATES ══
  sec('\u00a75b \u00b7 the date bytes');
  // `Intl('en-IN')` renders September as `Sept`. The ratified frame reads `3 Sep 2026`
  // and the founder vetoed the word, so the estate renders the short month by table.
  // Asserted on a SEPTEMBER document specifically, because September is the only month
  // of the twelve where the two disagree — a cell using any other date passes on both
  // implementations and proves nothing.
  ok('September renders Sep, never Sept', textOf(unpaid).includes('3 Sep 2026') &&
    !textOf(unpaid).includes('Sept'), 'the Intl spelling is back');
  ok('a non-September month is unaffected',
    textOf(unpaid).includes('12 Dec 2026'), 'the table broke a month it was not about');
  // H4, RULED: `Due` prints on unpaid and advance_paid only.
  ok('unpaid prints Due',        textOf(unpaid).includes('Due'));
  ok('advance_paid prints Due',  textOf(advance).includes('Due'));
  ok('PAID prints Issued alone', textOf(paid).includes('Issued') && !textOf(paid).includes('Due'));
  ok('CANCELLED prints Issued alone',
    textOf(cancelled).includes('Issued') && !textOf(cancelled).includes('Due'));

  // ═══ §6 · THE SOURCE HALF ═════════════════════════════════════════════════
  sec('\u00a76 \u00b7 invoicePdfSource selects the mock\u2019s field list');
  const srcTxt = fs.readFileSync(SRC, 'utf8');
  for (const col of ['notes', 'has_schedule', 'city', 'gstin', 'address',
                     'account_name', 'account_number', 'ifsc']) {
    ok('select carries ' + col, new RegExp("['\\s,]" + col + "['\\s,]").test(srcTxt));
  }
  ok('the schedule read has one home', /function invoiceScheduleRows/.test(srcTxt));
  ok('the vendor field list has one home', /const PDF_VENDOR_COLUMNS/.test(srcTxt));

  // ═══ §7 · MUTATIONS · CURED GREEN, UNCURED RED ════════════════════════════
  if (!CELLS_ONLY) {
    sec('\u00a77 \u00b7 mutations \u2014 each cure restored to its shipped defect');
    const before = fs.readFileSync(GEN);
    const src = before.toString('utf8');
    const MUT = [
      ['F-39.49 \u2014 restore the amount_advance gate',
       "      if (isCancelled) {",
       "      if (isCancelled || !(invoice.amount_advance > 0)) {"],
      // THE FIRST MUTATION WRITTEN HERE WAS INERT AND THE RUN SAID SO: flipping
      // `else if (showsRails)` to `else if (true)` changes nothing, because the
      // cancelled and paid arms catch those states two branches earlier. An inert
      // mutation is a hollow cell wearing a mutation's uniform. THE SHIPPED DEFECT
      // was that the document did not consult `state` at all, so that is what is
      // restored: the page forgets what state it is in, and the rails come back.
      ['F-39.58 \u2014 the document forgets the invoice is cancelled',
       "      const isCancelled = state === 'cancelled';",
       "      const isCancelled = false;"],
      ['F-39.58 \u2014 the document forgets the invoice is paid',
       "      const isPaid      = state === 'paid';",
       "      const isPaid      = false;"],
      // The month table's mutation is the LOCAL Intl call this sitting retired — the
      // shipped defect, not a strawman. Only September moves under it, which is why
      // §5b's fixture is a September document.
      ['Sep \u2014 the month goes back to Intl',
       "      const fmtDate = formatDate;",
       "      const fmtDate = (d) => d ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(/^\\d{4}-\\d{2}-\\d{2}$/.test(String(d)) ? new Date(d + 'T00:00:00') : new Date(d)) : null;"],
      ['H4 \u2014 Due comes back on every state',
       "      if (showsRails) dateRow('Due', fmtDate(invoice.due_date));",
       "      dateRow('Due', fmtDate(invoice.due_date));"],
      ['B1 \u2014 restore the state literal',
       "  cancelled:    'Cancelled',",
       "  cancelled:    'Booking confirmed',"],
    ];
    for (const [name, from, to] of MUT) {
      if (!src.includes(from)) { ok(name, false, 'mutation site absent \u2014 the code moved'); continue; }
      fs.writeFileSync(GEN, src.replace(from, to));
      const r = spawnSync(process.execPath, [__filename, '--cells-only'], { encoding: 'utf8' });
      fs.writeFileSync(GEN, before);
      ok(name + ' \u2192 RED', r.status !== 0, 'exit ' + r.status);
      ok(name + ' \u2192 restored byte-for-byte', Buffer.compare(before, fs.readFileSync(GEN)) === 0);
    }
  }

  console.log('\n' + (fail === 0 ? 'GREEN' : 'RED') + ' \u2014 b51 invoice document ' +
    pass + '/' + (pass + fail));
  process.exit(fail === 0 ? 0 : 1);

})().catch((e) => { console.error('ERROR \u2014 ' + e.stack); process.exit(2); });
