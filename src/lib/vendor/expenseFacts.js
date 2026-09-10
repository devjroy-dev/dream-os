'use strict';
// src/lib/vendor/expenseFacts.js — THE EXPENSE FACT BLOCK. F-42.97's CURE.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS AT ALL
// ═══════════════════════════════════════════════════════════════════════════
// 2026-09-10 00:52:38, the founder's handset: 「 I have that on file already —
// Rs 5,000 out on 10 September for assistant payment, confirmed by you. Filed
// this morning at 04:58. 」 ZERO HANDS. His expense book holds Rs 5,000 ·
// assistant · "Payment to Swati" · 1 SEPTEMBER. The AMOUNT was true. The date was
// invented and so was the filing time, and the whole sentence survived a glance
// because it collided with a real row.
//
// The mechanism was derived at 7a18bf6 and it is not subtle: `from('expenses')`
// resolved to four files and none of them was a turn. `moneyFacts`, `snapshot`,
// `cabinet` and `glance` carried no expense token. VICTOR HAD NO PATH TO AN
// EXPENSE ROW. The invoice half of his money got a fact block at F-39.73; the
// expense half got silence — AND HE FILLS SILENCE. That asymmetry is why this
// outranked R-39.18's sequencing at the chair.
//
// This is A1's seam, fourth sibling to `recentActivity` (CE-4), `leadPings`
// (F-05.50(b)), `pendingRelay` (F-06.162/.163) and fifth to `moneyFacts` itself:
// a door-built opaque string, `estateInRoom`-gated, last in loop.ts's dynamic
// tail. deedState.js's sentence, applied one plane over — the model is not being
// asked to be careful, IT IS BEING HANDED THE ANSWER.
//
// ═══════════════════════════════════════════════════════════════════════════
// NO BRACKET, NO LABEL, NO HOUSE WORD  (F-40.15 / R-VS.10)
// ═══════════════════════════════════════════════════════════════════════════
// The seat before this one shipped a bracketed label on the money block and the
// chair caught it from the rendered text: a bracketed header two inches above the
// answer is F-06.52's donor class exactly, and CE-78's cure was to REMOVE labels
// so the material arrives as Victor's own standing knowledge. Every byte below is
// plain register the vendor could read aloud. The frame states its plane IN WORDS.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE HANDLES, AND WHY DATES ARE AMONG THEM  (chair ruling 4, CE-42 V-2)
// ═══════════════════════════════════════════════════════════════════════════
// Derived before a byte moved, against the founder's own rows: the 00:52:38
// specimen speaks exactly ONE figure, `5,000`, and Rs 5,000 IS A HELD ROW. An
// amount-only handle set ADMITS the specimen — the lie lives entirely in the
// date. So `handles.dates` carries every row's effective date in BOTH spellings,
// `shortDate` ("1 Sep") and `longDate` ("1 September"), for the same reason
// `handles.amounts` carries grouped and raw: the fence must not convict a true
// sentence over a spelling it happens not to know (F-42.21's lesson, F-42.119).
//
// `rowAmounts` is the ARM B addend pool and it is PER-BLOCK BY RULING (c-42.23,
// F-42.123). Merging this pool with the invoice block's would let the fence
// manufacture figures that exist on neither plane: against the founder's four
// expense rows a merged pool admitted Rs 55,000 (the invented-figure cell), Rs
// 45,000 (a CANCELLED invoice) and Rs 18,000 and Rs 12,000 (PAID invoices) — 76
// of 91 admitted sums were cross-plane. Equality merges; arithmetic does not.
//
// ═══════════════════════════════════════════════════════════════════════════
// FAIL-CLOSED
// ═══════════════════════════════════════════════════════════════════════════
// A read error does NOT degrade to silence and does NOT degrade to the cabinet.
// It returns the founder-vetoed EXPENSE_UNREADABLE line and an EMPTY handle set,
// so nothing else about spending can be said that turn. LEDGER_UNREADABLE is NOT
// reused here: it says "what's outstanding", which is the other plane, and
// answering the wrong question confidently is the disease this file cures.

const { readRecentExpenses, RECENT_WINDOW_DAYS } = require('./expenses');
const { rupees, shortDate, longDate } = require('../witnessLine');
const { VICTOR_LINES } = require('../victorLines');

// ── THE FRAME · FOUNDER-VETOED 2026-09-10 (V-1…V-6, V-8) ──────────────────
// Exported as FRAME_BYTES so the echo cell reads them FROM HERE and never
// retypes them — R-VS.10(3). A cell carrying its own copy of the bytes it
// polices is a cell that goes green after the frame changes underneath it.
const HEADER = 'Your expense book, read this turn.';
const ZERO_LINE = 'Nothing logged in the last 30 days.';
const FOOTER =
  'These are the only figures for money spent. Answer about expenses from these and nothing else.';
const UNREADABLE_HEADER = 'Your expense book could not be read this turn.';
// V-8. THE CAP MUST NOT LIE SILENTLY (chair, ruled). Without this sentence a
// forty-row ceiling reads to Victor as a complete book and he says "that's
// everything" — a false absence, which is the §2.1 s3 class the estate already
// files against. It renders ONLY when rows were actually dropped.
const TRUNCATION_LINE = 'Older entries exist beyond these; this is the most recent stretch only.';

/**
 * One expense line, in the invoice block's own grammar.
 *
 * `{DATE} — {AMOUNT} on {CATEGORY} ({DESCRIPTION})`, veto V-3. The CATEGORY is
 * the RAW TOKEN and the chair ruled it stands: the picker's title-cased labels
 * are authored at the pwa mirror and never stored, so title-casing here would
 * open a second home for that list (F-15.10's class, and expenses.js's own
 * header is the standing warning about it).
 */
function expenseLine(row) {
  const when = shortDate(row.effective_date) || row.effective_date;
  const amount = rupees(row.amount);
  const tail = row.description ? ` (${String(row.description).trim()})` : '';
  return `${when} — ${amount} on ${row.category}${tail}`;
}

/**
 * buildExpenseFacts(supabase, vendorId, today)
 *   -> { ok, block, handles: { amounts, rowAmounts, dates, categories }, rowCount,
 *        truncated, unreadable }
 *
 * `block` is the opaque string the door hands to runTurn. `handles` is what the
 * guard reads. NEVER THROWS.
 */
async function buildExpenseFacts(supabase, vendorId, today) {
  const empty = { amounts: [], rowAmounts: [], dates: [], categories: [] };
  let read;
  try {
    read = await readRecentExpenses(supabase, vendorId, today);
  } catch (e) {
    read = { ok: false, error: e && e.message };
  }

  if (!read || !read.ok) {
    return {
      ok: false,
      unreadable: true,
      truncated: false,
      rowCount: 0,
      handles: empty,
      block: `${UNREADABLE_HEADER}\nThe only honest answer about spending this turn is exactly this: "${VICTOR_LINES.EXPENSE_UNREADABLE}"`,
    };
  }

  const rows = read.rows || [];

  if (!rows.length) {
    // THE HONEST ZERO, and it is not the same sentence as the unreadable one —
    // moneyFacts.js's own distinction, kept. "Could not be read" is never "there
    // is none", and the discriminator downstream is this block's presence.
    return {
      ok: true,
      unreadable: false,
      truncated: false,
      rowCount: 0,
      handles: empty,
      block: `${HEADER}\n${ZERO_LINE}\n${FOOTER}`,
    };
  }

  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const head =
    rows.length === 1
      ? 'One expense in the last 30 days:'
      : `${rows.length} expenses in the last ${RECENT_WINDOW_DAYS} days, ${rupees(total)} in all:`;

  const handles = { amounts: [], rowAmounts: [], dates: [], categories: [] };
  const pushAmount = (n) => {
    if (!(Number(n) > 0)) return;
    const grouped = rupees(n);
    if (grouped) handles.amounts.push(grouped.replace(/^Rs\s*/, ''));
    handles.amounts.push(String(Math.round(Number(n))));
  };
  rows.forEach((r) => {
    pushAmount(r.amount);
    handles.rowAmounts.push(Math.round(Number(r.amount) || 0));
    // BOTH SPELLINGS. See the header — this is the handle that catches 00:52:38.
    const s = shortDate(r.effective_date);
    const l = longDate(r.effective_date);
    if (s) handles.dates.push(s);
    if (l) handles.dates.push(l);
    if (r.category) handles.categories.push(r.category);
  });
  // The window total is a HELD FIGURE (chair ruling 3) but NEVER AN ADDEND — it
  // is a sum of the rowAmounts and admitting it as an addend would let ARM B
  // double-count the whole book into a second tier of manufactured figures.
  pushAmount(total);

  const body = rows.map((l) => `- ${expenseLine(l)}`).join('\n');
  const truncation = read.truncated ? `\n${TRUNCATION_LINE}` : '';

  return {
    ok: true,
    unreadable: false,
    truncated: !!read.truncated,
    rowCount: rows.length,
    handles,
    block: `${HEADER}\n${head}\n${body}${truncation}\n${FOOTER}`,
  };
}

const FRAME_BYTES = [
  HEADER, ZERO_LINE, FOOTER, UNREADABLE_HEADER, TRUNCATION_LINE,
  'The only honest answer about spending this turn is',
];

module.exports = {
  buildExpenseFacts, expenseLine,
  HEADER, ZERO_LINE, FOOTER, UNREADABLE_HEADER, TRUNCATION_LINE, FRAME_BYTES,
};
