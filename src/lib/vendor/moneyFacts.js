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

const { readOutstanding, OUTSTANDING_STATES } = require('./invoices');
const { rupees } = require('../witnessLine');
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
  const empty = { amounts: [], numbers: [], names: [] };
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
  const lines = outstanding.map(invoiceLine);
  const head =
    outstanding.length === 1
      ? 'One invoice outstanding:'
      : `${outstanding.length} invoices outstanding, ${rupees(total)} in all:`;

  // The handle sets. Amounts carry BOTH the grouped register form and the raw
  // digits, because the guard reads the model's prose and the model may write
  // either — and the fence must not convict a true sentence for a comma.
  const handles = {
    amounts: [],
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

  return {
    ok: true,
    unreadable: false,
    rowCount: outstanding.length,
    handles,
    block: `${HEADER}\n${head}\n${lines.map((l) => `- ${l}`).join('\n')}\n${FOOTER}`,
  };
}

// R-VS.10(3): the frame's own sentences are EXPORTED so the echo cell reads them
// from here and never retypes them — a cell carrying its own copy of the bytes it
// polices is a cell that goes green after the frame changes underneath it.
const FRAME_BYTES = [HEADER, FOOTER, UNREADABLE_HEADER, 'The only honest answer about money this turn is'];

module.exports = { buildMoneyFacts, invoiceLine, HEADER, FOOTER, UNREADABLE_HEADER, FRAME_BYTES };
