// src/api/vendor/money.js
// TDW · ROAD STEP 2b · THE TYPED MONEY PLANE — ONE READ DOOR.
//
//   GET /api/v2/vendor/money/books/:vendorId
//
// Auth: vendor JWT, must own :vendorId (requireAuth + resolveVendor mode 2).
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS ROUTER IS, AND — LOUDLY — WHAT IT IS NOT
// ═══════════════════════════════════════════════════════════════════════════
// F-39.3 measured the disease: `engine.records` money is ZERO for all 28
// vendors while the typed plane holds every rupee (DROY550: 2 invoices, 2
// expenses). The Invoices and Expenses rooms read the empty plane.
//
// THE FULL CURE IS NOT THIS SITTING. CE-39 ruled ARM (c) on the 2b seat's
// read-first: the Invoices and Expenses rooms HOLD at engine, because their
// row ids are engine binder uuids and five live controls are keyed on that id
// space — cancel (src/api/vendor/invoices.js, the `/:invoiceId/cancel` arm),
// the PDF arm, mark-paid, expense delete, and both Add paths. Re-pointing the
// READS alone would have swapped which half of each room is broken: the typed
// payment-schedule panel would start working and the four engine-keyed
// controls would start 404ing. That crossing is STEP 2c and it moves reads and
// writes together, in one sitting, pre-cutover.
//
// So this router serves exactly ONE room — Books — which is new, read-only,
// and mounts no verb at all. It exposes no id to any control, so it cannot
// participate in the id-space split above.
//
// ═══════════════════════════════════════════════════════════════════════════
// ZERO NON-GET, BY CONSTRUCTION AND BY CELL
// ═══════════════════════════════════════════════════════════════════════════
// This file declares exactly one route and it is a GET. `scripts/b45_money_
// books_bench.js` (symbol: the zero-non-GET cell) asserts that against the
// router's own stack, not against a grep of this text — a comment saying "no
// writes" is not a guard, and D-38.1 is the doctrine: presence is not
// behaviour, observe at the defect's moment.
//
// ═══════════════════════════════════════════════════════════════════════════
// COLUMN WITNESS — DERIVE-OR-DECLARE (F-P3.12, SQL-PROVENANCE LAW)
// ═══════════════════════════════════════════════════════════════════════════
// ORDINALS BELOW ARE `information_schema.columns.ordinal_position` AS WITNESSED
// IN `docs/db/PUBLIC_SCHEMA.md` (snapshot 2026-08-28, ladder tip 0129), NOT the
// column's place in the printed list. `invoices` skips ordinal 18 and
// `expenses` skips ordinal 12, so the printed position and the ordinal differ.
// Match on the NUMBER. Ladder re-derived at authoring: newest migration is
// `0129_agents_user_id_unique.sql` and `db/migrations/OUT_OF_ORDER.json` holds
// one record (`0090_engagements`) which touches none of these three tables —
// so the snapshot is CURRENT for all of them.
//
//   public.invoices           (21 columns)
//     id(1) vendor_id(2) amount_total(8) amount_paid(10) state(12)
//     created_at(15) last_payment_at(19) deleted_at(20) has_schedule(21)
//   public.payment_schedules  (13 columns)
//     invoice_id(2) vendor_id(3) amount_due(6) state(8) paid_at(9)
//     paid_amount(10) ordinal(11)
//   public.expenses           (12 columns)
//     id(1) vendor_id(2) amount(3) expense_date(6) created_at(10) deleted_at(13)
//
// STATE VOCABULARIES, from each table's own CHECK constraint in the same
// snapshot — named here so a reader can see the lists below are the DATABASE's
// words and not a memory of them:
//   invoices_state_check          {unpaid, advance_paid, paid, cancelled}
//   payment_schedules_state_check {pending, paid, waived}
'use strict';

const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes } = require('../../lib/response');

const INVOICE_SELECT =
  'id, amount_total, amount_paid, state, created_at, last_payment_at, has_schedule';
const SCHEDULE_SELECT = 'invoice_id, amount_due, state, paid_at, paid_amount, ordinal';
const EXPENSE_SELECT = 'id, amount, expense_date, created_at';

// ── R-39.12 (CE-39, on the 2b read-first's REPORT 4) · THE OUTSTANDING RULE ──
// OUTSTANDING IS A POSITIVE LIST AND NEVER A NEGATION. F-P3.1 earned this on
// this exact table at src/api/vendor/worklistToday.js (symbol:
// INVOICE_DUE_STATES): `state <> 'paid'` returns CANCELLED invoices as money
// owed, and a negation reads every UNKNOWN as included — the unknown being any
// state a future migration adds. So outstanding sums only these two.
const OUTSTANDING_STATES = ['unpaid', 'advance_paid'];

// ── THE OTHER HALF OF THE SAME RULING, STATED ONCE ──────────────────────────
// A CANCELLED INVOICE STILL CREDITS RECEIVED. Money that arrived is money that
// arrived: cancelling an invoice does not un-collect the advance the vendor
// already banked, and a books register that hid it would fail to reconcile
// against her bank. So `state` gates OUTSTANDING only — the credit side reads
// `amount_paid > 0` and asks nothing about state.
//
// THE FIXTURE CANNOT PROVE EITHER HALF. DROY550's two invoices are both
// 'unpaid', so a positive-list door and a negation door return the identical
// head, and no cancelled row exists to exercise the clause above. Both arms are
// carried by synthetic rows with production-code mutation in
// `scripts/b45_money_books_bench.js` — F-39.p1, in scope by ruling.

/**
 * Movement ordering. STATED ONCE, HERE, AND NOWHERE ELSE.
 *
 * `expense_date` then `created_at` then `id`. The tail is load-bearing rather
 * than decorative: DROY550's two expenses share `expense_date` 2026-07-22, so
 * the date alone leaves the pair — and therefore the third running balance —
 * undetermined. The founder's tie-break SELECT of 2026-08-29 witnessed
 * `created_at` 20:28:20.974117Z and 21:02:55.638485Z, which settles it at
 * Rs 5,001 before Rs 5,000 and the balance at 29,999. `id` is the final tail so
 * the order is TOTAL even where two rows share both clocks; without it the
 * database's incidental order decides, and that is not a rule.
 */
function compareMovements(a, b) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a._tiebreak !== b._tiebreak) return a._tiebreak < b._tiebreak ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

router.get(
  '/books/:vendorId',
  requireAuth,
  resolveVendor({ paramName: 'vendorId' }),
  asyncHandler(async (req, res) => {
    const supabase = req.app.locals.supabase;
    const vendorId = req.vendor.id;

    const [inv, sch, exp] = await Promise.all([
      supabase.from('invoices').select(INVOICE_SELECT)
        .eq('vendor_id', vendorId).is('deleted_at', null),
      supabase.from('payment_schedules').select(SCHEDULE_SELECT)
        .eq('vendor_id', vendorId),
      supabase.from('expenses').select(EXPENSE_SELECT)
        .eq('vendor_id', vendorId).is('deleted_at', null),
    ]);

    const firstErr = inv.error || sch.error || exp.error;
    if (firstErr) {
      const which = inv.error ? 'invoices' : sch.error ? 'payment_schedules' : 'expenses';
      console.error('[GET /vendor/money/books] typed read failed:', which, firstErr.message);
      return res.status(500).json({ ok: false, error: 'Lookup failed.' });
    }

    const invoices = inv.data || [];
    const schedules = sch.data || [];
    const expenses = exp.data || [];

    // ── CREDITS ────────────────────────────────────────────────────────────
    // TWO SOURCES, AND THE `has_schedule` GUARD IS WHAT KEEPS THEM FROM
    // DOUBLE-COUNTING. An invoice with a schedule is settled milestone by
    // milestone, so its payments are the `payment_schedules` rows and its own
    // `amount_paid` is their SUM — counting both would credit every scheduled
    // rupee twice. So: scheduled invoices contribute through their milestones,
    // unscheduled invoices contribute their own `amount_paid`.
    const credits = [];

    for (const s of schedules) {
      // A milestone is a movement when it has a PAID CLOCK. `state = 'waived'`
      // never sets one, and a 'pending' row has not moved money yet. The clock
      // is the fact; the state word is a label on it.
      if (!s.paid_at) continue;
      const amount = Number(s.paid_amount) || 0;
      if (amount <= 0) continue;
      credits.push({
        id: `schedule:${s.invoice_id}:${s.ordinal}`,
        date: String(s.paid_at).slice(0, 10),
        _tiebreak: String(s.paid_at),
        amount,
        undated: false,
      });
    }

    for (const i of invoices) {
      if (i.has_schedule) continue;
      const amount = Number(i.amount_paid) || 0;
      if (amount <= 0) continue;
      // ── THE UNDATED CREDIT, AND WHY IT IS FLAGGED RATHER THAN GUESSED ────
      // `last_payment_at` is the payment's own clock. Where it is NULL the
      // money demonstrably arrived (amount_paid > 0) but no writer ever stamped
      // when — F-39.8, filed at the chair's hand: the payment writer leaves
      // `state` and `last_payment_at` stale. It is NOT this door's to cure and
      // this door does not pretend to: the row is dated by `created_at` so it
      // can take a seat in the register at all, and `undated: true` rides the
      // wire so the surface can SAY the date is the invoice's and not the
      // payment's. Silently showing `created_at` as a payment date would be
      // this door inventing a fact the estate does not hold.
      const stamped = i.last_payment_at || null;
      const when = stamped || i.created_at;
      credits.push({
        id: `invoice:${i.id}`,
        date: String(when).slice(0, 10),
        _tiebreak: String(when),
        amount,
        undated: !stamped,
      });
    }

    // ── DEBITS ─────────────────────────────────────────────────────────────
    // `_tiebreak` IS `created_at`, NOT `expense_date`, AND THE DISTINCTION IS THE
    // WHOLE RULE. `expense_date` is a DATE column — two expenses logged on the
    // same day carry the identical value, so a tiebreak set from it is not a
    // tiebreak at all and the pair falls through to `id`. That is not a
    // hypothetical: DROY550's two expenses both read 2026-07-22, and the first
    // cut of this file did exactly that and put Rs 5,000 ahead of Rs 5,001,
    // moving the third running balance to 30,000. `b45`'s §2.4 caught it before
    // it left the seat. The founder's tie-break SELECT exists precisely because
    // `created_at` is the only column that separates them.
    const debits = expenses.map((e) => ({
      id: `expense:${e.id}`,
      date: String(e.expense_date || e.created_at).slice(0, 10),
      _tiebreak: String(e.created_at),
      amount: Number(e.amount) || 0,
      undated: !e.expense_date,
    }));

    // ── THE REGISTER ───────────────────────────────────────────────────────
    // Deleted rows are ABSENT rather than zeroed: both typed reads above filter
    // `deleted_at IS NULL`, so a soft-deleted invoice or expense takes no line
    // and moves no balance. `payment_schedules` carries no `deleted_at` (13
    // columns, witnessed by absence) — its rows die with their invoice through
    // `payment_schedules_invoice_id_fkey ... ON DELETE CASCADE`, which is a HARD
    // delete and therefore invisible here by construction.
    const movements = [
      ...credits.map((c) => ({ ...c, kind: 'credit' })),
      ...debits.map((d) => ({ ...d, kind: 'debit' })),
    ].sort(compareMovements);

    // THE RUNNING BALANCE IS SERVER-COMPUTED, FROM ZERO AT THE FIRST MOVEMENT.
    // It is not the client's to derive: two renderers computing one chain is
    // two homes for it, and the second one drifts (F-04.13's whole lesson,
    // applied before it can happen rather than after).
    let balance = 0;
    const rows = movements.map((m) => {
      balance += m.kind === 'credit' ? m.amount : -m.amount;
      return {
        id: m.id,
        date: m.date,
        undated: m.undated,
        credit: m.kind === 'credit' ? m.amount : null,
        debit: m.kind === 'debit' ? m.amount : null,
        balance,
      };
    });

    // ── THE HEAD ───────────────────────────────────────────────────────────
    const received = credits.reduce((sum, c) => sum + c.amount, 0);
    const outstanding = invoices
      .filter((i) => OUTSTANDING_STATES.includes(i.state))
      .reduce((sum, i) => sum + ((Number(i.amount_total) || 0) - (Number(i.amount_paid) || 0)), 0);

    return okRes(res, {
      received,
      outstanding,
      movements: rows,
      total: rows.length,
    });
  }),
);

module.exports = router;
