'use strict';
// src/lib/vendor/moneyFacts.js — THE MONEY FACT BLOCK. F-39.73's CURE.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY A FACT AND NOT A TOOL  (F-A arm A1, ruled R-VS.2)
// ═══════════════════════════════════════════════════════════════════════════
// F-39.73, walked: 「 no one owes you 」 while public.invoices held Rs 60,000
// unpaid. The read-first's derivation, and the reason arm (a) of the charter
// could not execute as worded: `src/engine/src/core/db.ts:15` binds the engine's
// Supabase client to `db: { schema: 'engine' }`. THE ENGINE CANNOT SEE
// public.invoices AT ALL. Not "does not"; cannot. Every money answer Victor has
// ever given stood on `engine.records`, a second and empty money model
// (recordsView.ts:16 carries amount / amount_received / amount_pending /
// payment_status — the plane is not money-blind, it is money-EMPTY, which is
// the more dangerous shape).
//
// And `loop.ts:530` states the estate's other constraint in its own words:
// 「 Harvey holds NO DB tools 」. A money hand would have been his first. So the
// cure is the seam the estate already built for exactly this — the door tells
// him something only the door knows. Its three siblings, all door-built opaque
// strings, all gated on estateInRoom: `recentActivity` (CE-4), `leadPings`
// (F-05.50(b)), `pendingRelay` (F-06.162/.163). This is the fourth, and it is
// deedState.js's sentence applied to money: the model is not being asked to be
// careful — IT IS BEING HANDED THE ANSWER.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE EQUALITY HANDLES  (R-VS.6 fence 1) — WHY THIS MODULE RETURNS TWO THINGS
// ═══════════════════════════════════════════════════════════════════════════
// F-40.8, found at read-first 2 and ruled before a byte moved: a fact block makes
// Victor a ZERO-HAND answerer on money BY DESIGN, and zero hands is exactly the
// census the wire guard convicts. The 2026-09-01 17:45 production row is the
// rehearsal — a zero-hand rundown that invented a 4-September block, correctly
// caught. To the guard, a fact-grounded TRUE money answer and a snapshot
// confabulation look identical.
//
// So the block does not travel alone. `handles` is the structured set of figures
// and record addresses the block actually contains, and the guard acquits a
// money sentence ONLY where its named figures and handles appear here BY
// EQUALITY. A gate reads a row, never a display string (CE-215). A money-shaped
// sentence carrying a figure this set does not hold stays a costume.
//
// ═══════════════════════════════════════════════════════════════════════════
// FAIL-CLOSED  (R-VS.2's own clause)
// ═══════════════════════════════════════════════════════════════════════════
// A read error does NOT degrade to silence and does NOT degrade to the cabinet.
// It returns a block carrying the founder-vetoed LEDGER_UNREADABLE line and an
// EMPTY handle set — so nothing else about money can be said that turn and every
// money sentence that turn convicts. "Could not be read" is never "there is
// none", and the direction is deliberate: the expensive failure here is a
// confident wrong number, not a refusal.

const { readOutstanding, OUTSTANDING_STATES, invoiceScheduleRows } = require('./invoices');
const { rupees, longDateYear } = require('../witnessLine');
const { VICTOR_LINES, STATE_WORDS } = require('../victorLines');

// ═══════════════════════════════════════════════════════════════════════════
// THE FRAME · F-40.15, CHAIR-CAUGHT · R-VS.10 — NO BRACKET, NO LABEL, NO HOUSE WORD
// ═══════════════════════════════════════════════════════════════════════════
// THE SEAT'S FIRST CUT WAS THE DONOR CLASS THIS SITTING WAS CHARTERED TO RESPECT,
// and the chair caught it from the block's own rendered text. It read:
//
//     [Your invoice book, read fresh this turn.]
//     …
//     These are the only figures for money owed. The cabinet does not hold this —
//     do not answer about money from anywhere else.
//
// TWO FAULTS, BOTH NAMED IN THE RECORD ALREADY. (1) A BRACKETED LABEL two inches
// above the model's answer is F-06.52 exactly: the business room injected
// 「 [Donna's snapshot — what's open and near…] 」 and every M-4 specimen was that
// label echoed back as prose; CE-78's cure was to REMOVE the labels so the
// material arrives as his own standing knowledge, and a new bracket here would
// have re-minted the class the same week the sitting cited it. (2) "the cabinet"
// is HOUSE VOCABULARY — the estate's word for the engine plane, which the vendor
// has never been taught and would hear as furniture.
//
// So the frame is now plain register the vendor could read aloud without
// confusion. It still states the plane, because R-VS.2 requires it ("so Victor
// never cites records for owed") — it states it IN WORDS rather than in a label,
// which is the whole of CE-78's distinction. §12's echo cell is the proof that
// the change worked rather than the claim that it did.
const HEADER = 'Your invoice book, read this turn.';

// Terminal by design. CE-77's position doctrine: position inside a paragraph is
// part of the instruction, so the one sentence that must govern sits last. The
// negative clause names no plane and no furniture — it simply closes the door on
// every other source.
const FOOTER =
  'These are the only figures for money owed. Answer about money from these and nothing else.';

const UNREADABLE_HEADER = 'Your invoice book could not be read this turn.';

/**
 * Renders one invoice line in R-40.2 line 4's SHAPE, from this vendor's own row.
 *
 * The ratified exemplars (victorLines.MONEY_SHAPE) name Priya Nair and Rohan
 * Mehta — DEV440's fixture. They are the FORMAT CONTRACT and the bench's
 * assertion, and they are deliberately NOT injected into a turn: putting one
 * vendor's fixture into another vendor's context is the neighbouring-line donor
 * pool ruling A-3 closed (F-04.70's mechanism).
 *
 * Register: `rupees()` from src/lib/witnessLine.js — the house formatter, hand
 * rolled rather than Intl-dependent because the Indian grouping IS the safety
 * property. `Rs`, never the glyph; no k/L/Cr; no truncation.
 */
function invoiceLine(row) {
  const owed = rupees(row.amount_owed);
  const state = STATE_WORDS[row.state] || row.state;
  const handle = row.invoice_number ? ` (${row.invoice_number}, ${state})` : ` (${state})`;
  return `${row.client_name} — ${owed} owed${handle}`;
}

// ── F-44.12 · THE INSTALMENTS BENEATH A PACKAGE INVOICE (chair-ruled, CE-44) ──
// WHY THIS EXISTS. The block gave Victor a total and no schedule, so on a turn
// about a package couple he held the sum owed and nothing about how it is owed.
// He filled the gap himself: on 18 September he invented Rs 26,667 for a middle
// payment that stands at Rs 24,000, and an entire schedule dated 22 December 2026
// and 8 February 2027 against rows that carry neither date (F-44.10). The vacuum
// does not excuse the assertion, but it is a vacuum and this closes it.
//
// ONE HOME, NO NEW READER. The rows come from `invoiceScheduleRows` in
// `src/lib/vendor/invoices.js`, already the single home for a document's
// milestones and already the source `invoicePdfSource` reads, so the block and
// the PDF cannot disagree about a couple's instalments.
//
// UNPAID ONLY, IN ORDINAL ORDER. A paid milestone is not money owed, and this
// block's last sentence governs money owed. Listing a settled instalment would
// invite it back into an answer about what is outstanding.
//
// THE FIGURES BECOME HELD, WHICH IS THE OTHER HALF OF THE CURE. Every amount
// rendered here is pushed into `handles.amounts`, so the equality fence admits a
// true instalment and convicts an invented one on any turn that reaches it.
// They are NOT pushed into `rowAmounts`: that is ARM B's addend set, and adding
// instalments to it would let a spoken "subtotal" be assembled from an invoice's
// own parts plus another invoice's whole, which is the book counted twice in a
// new shape.
// THE BOUND (chair, CE-44). A book of 20 package invoices renders 60 body lines,
// so the instalments are capped. Invoice lines are NEVER dropped: the block's last
// sentence governs money owed and an unlisted invoice makes it false. The budget is
// spent in the block's existing order, which `invoices.js:546` orders by created_at
// DESCENDING, newest first. An invoice is never split — the budget stops before one
// it cannot list whole, so a vendor never sees half a couple's schedule.
const MILESTONE_LINE_CAP = 40;
// Model-facing, and it is mechanics rather than decoration: without it an invoice
// whose instalments were cut looks exactly like an invoice that has none, which is
// the false sentence F-44.10 already produced once.
const CUT_LINE = (n) =>
  `Instalments are shown for the first ${n} invoices only. The others have instalments that are not listed here.`;

async function milestoneLines(supabase, vendorId, row) {
  if (!row.lead_package_id || !row.id) return [];
  let rows = [];
  try {
    rows = await invoiceScheduleRows(supabase, vendorId, row.id);
  } catch (e) {
    console.warn('[money:milestones]', e && e.message);
    return [];
  }
  return (rows || [])
    .filter((m) => m && m.state === 'pending')
    .slice()
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((m) => ({
      amount: Math.round(Number(m.amount_due) || 0),
      text: `${String(m.milestone_label || '').trim()} — ${rupees(m.amount_due)} due ${longDateYear(m.due_date)}`,
    }))
    .filter((m) => m.amount > 0);
}

/**
 * buildMoneyFacts(supabase, vendorId)
 *   -> { ok, block, handles: { amounts, numbers, names }, rowCount, unreadable }
 *
 * `block` is the opaque string the door hands to runTurn. `handles` is the
 * equality set the guard reads. NEVER THROWS — the caller's fail-safe is the
 * same one leadPings and pendingRelay carry ("a Victor without the block is
 * diminished, never wrong"), except that here the degraded state is LOUD rather
 * than absent, because an absent money block would let him answer from the
 * cabinet again and that is the disease.
 */
async function buildMoneyFacts(supabase, vendorId) {
  // Same SHAPE as the populated set, F-42.116 included — an unreadable or empty
  // book must hand ARM B an empty addend pool rather than an absent one, so the
  // fence's arithmetic degrades to "nothing is admissible" and never to a crash.
  const empty = { amounts: [], rowAmounts: [], numbers: [], names: [] };
  let read;
  try {
    read = await readOutstanding(supabase, vendorId);
  } catch (e) {
    read = { ok: false, error: e && e.message };
  }

  if (!read || !read.ok) {
    return {
      ok: false,
      unreadable: true,
      rowCount: 0,
      handles: empty,
      block: `${UNREADABLE_HEADER}\nThe only honest answer about money this turn is exactly this: "${VICTOR_LINES.LEDGER_UNREADABLE}"`,
    };
  }

  const outstanding = read.rows.filter(
    (r) => OUTSTANDING_STATES.includes(r.state) && r.amount_owed > 0,
  );

  if (!outstanding.length) {
    // THE HONEST ZERO, AND IT IS NOT THE SAME SENTENCE AS THE UNREADABLE ONE.
    // F-39.73's walk produced 「 no one owes you 」 from an empty engine plane; the
    // same words are TRUE here and must remain sayable. The discriminator is
    // this block's presence — which is exactly what R-VS.6 fence 2 persists, so
    // a true zero and a confabulated zero stop being one shape in the record.
    return {
      ok: true,
      unreadable: false,
      rowCount: 0,
      handles: empty,
      block: `${HEADER}\nNothing outstanding — every invoice is settled or cancelled.\n${FOOTER}`,
    };
  }

  const total = outstanding.reduce((sum, r) => sum + r.amount_owed, 0);
  // F-44.12: each outstanding invoice's line, then its own unpaid instalments
  // indented beneath it. A non-package invoice has none and renders exactly as
  // it does today, so the pre-cure bytes are untouched wherever there is no
  // schedule to show.
  const lines = [];
  const milestoneAmounts = [];
  let spent = 0;
  let listed = 0;
  let cut = false;
  for (const r of outstanding) {
    lines.push(`- ${invoiceLine(r)}`);
    if (cut) continue;
    const ms = await milestoneLines(supabase, vendorId, r);
    if (!ms.length) continue;
    if (spent + ms.length > MILESTONE_LINE_CAP) { cut = true; continue; } // never split an invoice
    for (const m of ms) {
      lines.push(`  - ${m.text}`);
      milestoneAmounts.push(m.amount);
    }
    spent += ms.length;
    listed += 1;
  }
  if (cut) lines.push(CUT_LINE(listed));
  const head =
    outstanding.length === 1
      ? 'One invoice outstanding:'
      : `${outstanding.length} invoices outstanding, ${rupees(total)} in all:`;

  // The handle sets. Amounts carry BOTH the grouped register form and the raw
  // digits, because the guard reads the model's prose and the model may write
  // either — and the fence must not convict a true sentence for a comma.
  // F-42.116 · `rowAmounts` — ARM B's ADDEND SET, AND IT IS A SEPARATE FIELD
  // ON PURPOSE. `amounts` below is a flat interleaved list of grouped-and-raw
  // pairs with the GRAND TOTAL PUSHED LAST, so the only way to recover the
  // per-row figures from it is by position — in another file, across a push
  // order this module is free to change. A gate reads a row, never a display
  // string (CE-215), and this is that row. The total is excluded by
  // construction: ARM B admits a spoken SUBTOTAL, and a "subtotal" that may use
  // the total as an addend is just the book counted twice.
  const handles = {
    amounts: [],
    rowAmounts: outstanding.map((r) => Math.round(Number(r.amount_owed) || 0)),
    numbers: outstanding.map((r) => r.invoice_number).filter(Boolean),
    names: outstanding.map((r) => r.client_name).filter(Boolean),
  };
  const pushAmount = (n) => {
    if (!(Number(n) > 0)) return;
    const grouped = rupees(n);
    if (grouped) handles.amounts.push(grouped.replace(/^Rs\s*/, ''));
    handles.amounts.push(String(Math.round(Number(n))));
  };
  outstanding.forEach((r) => pushAmount(r.amount_owed));
  pushAmount(total);
  // F-44.12: the instalment figures are HELD (admitted by the equality fence) but
  // never enter `rowAmounts` above, for the reason stated at milestoneLines.
  milestoneAmounts.forEach(pushAmount);

  return {
    ok: true,
    unreadable: false,
    rowCount: outstanding.length,
    handles,
    block: `${HEADER}\n${head}\n${lines.join('\n')}\n${FOOTER}`,
  };
}

// R-VS.10(3): the frame's own sentences are EXPORTED so the echo cell reads them
// from here and never retypes them — a cell carrying its own copy of the bytes it
// polices is a cell that goes green after the frame changes underneath it.
const FRAME_BYTES = [HEADER, FOOTER, UNREADABLE_HEADER, 'The only honest answer about money this turn is'];

module.exports = { buildMoneyFacts, invoiceLine, HEADER, FOOTER, UNREADABLE_HEADER, FRAME_BYTES, MILESTONE_LINE_CAP, CUT_LINE };
