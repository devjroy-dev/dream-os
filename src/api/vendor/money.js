// src/api/vendor/money.js
// TDW · ROAD STEP 2c · THE TYPED MONEY PLANE — THE READ DOOR AND THE WRITE DOORS.
//
//   GET    /api/v2/vendor/money/books/:vendorId
//   GET    /api/v2/vendor/money/invoices/:vendorId
//   GET    /api/v2/vendor/money/expenses/:vendorId
//   PATCH  /api/v2/vendor/money/invoices/:vendorId/:invoiceId
//   PATCH  /api/v2/vendor/money/expenses/:vendorId/:expenseId
//   POST   /api/v2/vendor/money/invoices/:vendorId
//   PATCH  /api/v2/vendor/money/invoices/:vendorId/:invoiceId/cancel
//   POST   /api/v2/vendor/money/invoices/:vendorId/:invoiceId/payments
//   GET    /api/v2/vendor/money/invoices/:vendorId/:invoiceId/pdf
//   POST   /api/v2/vendor/money/expenses/:vendorId
//   DELETE /api/v2/vendor/money/expenses/:vendorId/:expenseId
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
// THE ZERO-NON-GET CLAUSE IS RETIRED HERE, AND IT MOVED RATHER THAN DIED
// ═══════════════════════════════════════════════════════════════════════════
// At 2b this file declared one route and it was a GET, and `b45`'s cell asserted
// that against the router's own stack. 2c gives it the five money verbs, so the
// clause cannot stand on THIS router — it now belongs to the ROOM.
//
// ⚠ AND THE GUARD CHANGED CHARACTER, WHICH IS THE PART WORTH THE PARAGRAPH.
// Books mounted no verb at 2b partly by ruling and partly by CONSTRUCTION: the
// movement ids it emitted were composites (`invoice:<uuid>`, `expense:<uuid>`,
// `schedule:<invoice_id>:<ordinal>`) and unusable as addresses, so a control
// there had nothing to key on. Those ids are unchanged, but the room now sits
// beside doors that DO take typed ids. The room's read-only ruling is from this
// sitting enforced ONLY by the cell in `scripts/b47_money_crossing_bench.js`
// (symbol: the zero-verb cell, asserted over BooksBody's import graph), never
// again by the id space. Recorded at CE-39 as the band's line.
//
// ── EVERY WRITE BELOW CALLS THE HOME AND NOTHING ELSE ──────────────────────
// `src/lib/vendor/invoices.js` and `src/lib/vendor/expenses.js` are the writer
// homes for their tables (c-39.32). No route in this file opens a table itself;
// the cell mutation for that is an inline insert here, which reds.
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
//     id(1) vendor_id(2) amount(3) category(4) description(5) expense_date(6)
//     client_name(7) created_at(10) deleted_at(13)
//
// THE ROOM READS NAME MORE COLUMNS THAN THE REGISTER DOES, and that is the
// rooms' shape rather than scope creep: `InvoicesResponse` carries
// `client_phone`(6) for the cross-chip's key and `due_date`(11) for the row,
// neither of which the register renders. Witnessed by ordinal like the rest.
//   public.invoices additionally: client_phone(6) due_date(11)
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
const { ok: okRes, err: errRes } = require('../../lib/response');
const {
  createInvoice, updateInvoice, recordPayment, cancelInvoice, invoicePdfSource,
  // R-VS.2 (CE-40, the Victor sitting): the money truth has ONE HOME and it is the
  // writer home. `readOutstanding` and `OUTSTANDING_STATES` are IMPORTED here, never
  // declared — this router's own copies died in the commit that born them, because
  // the fact block Victor reads and the room the vendor reads must not be two
  // derivations of one number (F-04.13's tuition, on this exact table).
  readOutstanding, OUTSTANDING_STATES,
} = require('../../lib/vendor/invoices');
const { createExpense, updateExpense, deleteExpense } = require('../../lib/vendor/expenses');
const { generateInvoicePdf } = require('../../lib/invoicePdf');

// ── THE PARTICULAR · D-1 B13, AND ONLY THE PARTICULAR  [F-39.21] ───────────
// The founder's verdict on the 2b room: 「no info about who paid, out of how
// much」. The door already SELECTed `amount_total` and `amount_paid` and threw
// both away per-row. D-1 sealed exactly which facts join them, and the list is
// SHORTER than the 2c kickoff's — the kickoff was authored before the pick.
//
//   credit  ->  client_name(5) · invoice_number(4) · paid-of-total(10 of 8)
//               + milestone_label(4 on payment_schedules) when it is a schedule row
//   debit   ->  category(4) · description(5)
//
// STRUCK, WITH REASON, at CE-39 (a):
//   invoices.description — F-39.23: Victor's money-edit writes an AUDIT LOG
//     carrying the struck rupee glyph into this vendor-facing column. Rendering
//     it would put the glyph on the money surface. Unrenderable, not merely
//     unrendered.
//   invoices.state, invoices.due_date — not on D-1's particular. `state` is
//     still SELECTed because OUTSTANDING is gated on it; it does not ride a row.
//   expenses.client_name — not on D-1's debit particular.
const INVOICE_SELECT =
  'id, invoice_number, client_name, amount_total, amount_paid, state, created_at, last_payment_at, has_schedule';
const SCHEDULE_SELECT =
  'invoice_id, milestone_label, amount_due, state, paid_at, paid_amount, ordinal';
const EXPENSE_SELECT = 'id, amount, category, description, expense_date, created_at';

// ── R-39.12 (CE-39, on the 2b read-first's REPORT 4) · THE OUTSTANDING RULE ──
// OUTSTANDING IS A POSITIVE LIST AND NEVER A NEGATION. F-P3.1 earned this on
// this exact table at src/api/vendor/worklistToday.js (symbol:
// INVOICE_DUE_STATES): `state <> 'paid'` returns CANCELLED invoices as money
// owed, and a negation reads every UNKNOWN as included — the unknown being any
// state a future migration adds. So outstanding sums only these two.
// (moved to src/lib/vendor/invoices.js at R-VS.2 and IMPORTED at the head of this
// file — the rule's text and both its readers travelled together, byte-identical.)

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

    // The schedule credit names its parent invoice, so the parent must be in
    // hand before the loop rather than fetched per row.
    const invoiceById = new Map(invoices.map((i) => [i.id, i]));

    for (const s of schedules) {
      // A milestone is a movement when it has a PAID CLOCK. `state = 'waived'`
      // never sets one, and a 'pending' row has not moved money yet. The clock
      // is the fact; the state word is a label on it.
      if (!s.paid_at) continue;
      const amount = Number(s.paid_amount) || 0;
      if (amount <= 0) continue;
      const parent = invoiceById.get(s.invoice_id) || null;
      credits.push({
        id: `schedule:${s.invoice_id}:${s.ordinal}`,
        date: String(s.paid_at).slice(0, 10),
        _tiebreak: String(s.paid_at),
        amount,
        undated: false,
        // D-1 B13 · the schedule credit names its milestone in the vendor's own
        // words. `milestone_label` is NOT NULL (ordinal 4) so the field is never
        // absent; the parent lookup can miss only if a schedule outlived its
        // invoice, which the FK's ON DELETE CASCADE makes impossible.
        particular: {
          client_name:    parent ? parent.client_name : null,
          invoice_number: parent ? parent.invoice_number : null,
          milestone_label: s.milestone_label || null,
          amount_paid:    amount,
          amount_total:   parent ? (Number(parent.amount_total) || 0) : null,
        },
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
        // `invoice_number`(4) and `client_name`(5) are both NOT NULL, so the
        // register never renders an empty particular against a real row.
        // `amount_paid of amount_total` is the founder's 「out of how much」.
        particular: {
          client_name:    i.client_name || null,
          invoice_number: i.invoice_number || null,
          milestone_label: null,
          amount_paid:    amount,
          amount_total:   Number(i.amount_total) || 0,
        },
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
      // D-1 B13 · the debit particular. `category`(4) is NOT NULL and carries a
      // CLOSED vocabulary at `expenses_category_check`.
      //
      // ⚠ THE DOOR EMITS THE ROW'S OWN WORD, VERBATIM, ALWAYS — IT NEVER
      // VALIDATES. F-2c.p1: `src/lib/vendor/expenses.js`'s ALLOWED_CATEGORIES
      // and the database's CHECK are not the same twelve, so three words the
      // DB holds would be refused by the writer. A door that filtered rows
      // through the writer's list would HIDE money the vendor logged. The row's
      // truth is the register's truth — F-39.8's precedent, one plane over.
      particular: {
        category:    e.category || null,
        description: e.description || null,
      },
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
        particular: m.particular || null,
      };
    });

    // ── THE HEAD ───────────────────────────────────────────────────────────
    const received = credits.reduce((sum, c) => sum + c.amount, 0);
    const outstanding = invoices
      .filter((i) => OUTSTANDING_STATES.includes(i.state))
      .reduce((sum, i) => sum + ((Number(i.amount_total) || 0) - (Number(i.amount_paid) || 0)), 0);

    // ── OPENING AND CLOSING · READ, NEVER SUMMED  [D-1 §B] ─────────────────
    // D-1 states it and this door obeys it: **this surface sums nothing.**
    // OPENING is zero by the register's own construction — the balance runs
    // from zero at the first movement, so the period opens at zero by
    // definition and not by arithmetic. CLOSING is the LAST ROW'S OWN
    // `balance` cell, read back. Neither is a second derivation of the chain.
    //
    // F-04.13's tuition kept rather than repaid: the hub totalled
    // `public.invoices` while the list totalled binders, two derivations of one
    // rule, and they could not agree by luck. A `reduce` here would be the
    // third.
    const opening = 0;
    const closing = rows.length ? rows[rows.length - 1].balance : 0;

    return okRes(res, {
      received,
      outstanding,
      opening,
      closing,
      movements: rows,
      total: rows.length,
    });
  }),
);



// ═══════════════════════════════════════════════════════════════════════════
// THE TWO ROOM READS — ROAD STEP 2c, 2a-dreamos
// ═══════════════════════════════════════════════════════════════════════════
// WHY THEY EXIST, STATED PLAINLY BECAUSE THEIR ABSENCE WAS A DEFECT.
// The 2c crossing re-points the Invoices and Expenses rooms off the engine
// plane. The first dream-os ZIP built the six WRITE routes and the Books read
// and stopped, so `fetchInvoices` and `fetchExpenses` had nothing typed to
// point AT — the existing `/vendor/invoices/:vendorId` and
// `/vendor/expenses/:vendorId` both read `eng.from('records')`, so re-pointing
// at them would have swapped one engine reader for another and crossed nothing.
// c-2c.3, the seat's own gap, caught deriving the pwa's re-point target.
//
// ── THE FIGURES ARE SERVER-COMPUTED, LIKE THE BALANCE ──────────────────────
// `amount_owed` per row, and `total_outstanding` / `total_collected` /
// `total_spent` on the summary, are derived HERE. Today `fetchInvoices` does it
// in the client with a `reduce`, which is a second home for arithmetic the
// server can state once — F-04.13's lesson, the same one the running balance
// obeys three hundred lines up. The pwa's own cell asserts it does not
// re-derive them.
//
// ── SHAPE PARITY IS DELIBERATE ────────────────────────────────────────────
// Both responses answer in the shape `lib/vendor/types/vendor.ts` already
// declares (`InvoicesResponse`, `ExpensesResponse`), field for field. A typed
// door that invented a better shape would make the crossing a rewrite of both
// rooms instead of a change of address.

// ── THE GATE, DECLARED ONCE AND ABOVE ITS FIRST READER ────────────────────
// It sat below the write doors when they were the only readers. The two room
// reads are registered EARLIER in this file, so leaving it there would put the
// const in its own temporal dead zone and throw at module load — a defect
// `node --check` is structurally blind to, since it is a runtime binding fact
// and not a syntax one. Caught by requiring the module, not by reading it.
const vendorGate = [requireAuth, resolveVendor({ paramName: 'vendorId' })];

const ROOM_INVOICE_SELECT =
  'id, invoice_number, client_name, client_phone, amount_total, amount_paid, due_date, state, created_at';
const ROOM_EXPENSE_SELECT =
  'id, amount, category, description, expense_date, client_name, created_at';

router.get('/invoices/:vendorId', ...vendorGate, asyncHandler(async (req, res) => {
  // R-VS.2: ONE READER. The map and the summary that used to sit inline here are
  // `readOutstanding`'s body now, byte-for-byte in substance — same select, same
  // `amount_owed = total - paid`, same positive-list OUTSTANDING gate, same
  // state-blind `total_collected`. The response SHAPE is unchanged and the
  // acceptance cell proves it by SET: a moved rupee is a RED.
  //
  // `state` filtering stays a CLIENT concern exactly as it is today
  // (`fetchInvoices(vendorId, state)` filters after the fetch), so this door
  // answers the whole set and no filter vocabulary is minted here. A second
  // vocabulary for the same column is how `invoices_state_check` grows a rival.
  const read = await readOutstanding(req.app.locals.supabase, req.vendor.id);

  if (!read.ok) {
    console.error('[GET /vendor/money/invoices] typed read failed:', read.error);
    return errRes(res, 500, 'Lookup failed.');
  }

  return okRes(res, { invoices: read.rows, summary: read.summary, total: read.rows.length });
}));

router.get('/expenses/:vendorId', ...vendorGate, asyncHandler(async (req, res) => {
  const { data, error } = await req.app.locals.supabase
    .from('expenses')
    .select(ROOM_EXPENSE_SELECT)
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .order('expense_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /vendor/money/expenses] typed read failed:', error.message);
    return errRes(res, 500, 'Lookup failed.');
  }

  // THE ROW'S OWN CATEGORY, VERBATIM, NEVER VALIDATED — the same rule the debit
  // particular states above, for the same reason (F-2c.p1: the writer's list
  // and the database's CHECK are not the same twelve, and a door that filtered
  // through the writer's list would hide money the vendor logged).
  const rows = (data || []).map((e) => ({
    id: e.id,
    description: e.description,
    amount: Number(e.amount) || 0,
    category: e.category,
    expense_date: e.expense_date,
    client_name: e.client_name,
    created_at: e.created_at,
  }));

  const total_spent = rows.reduce((sum, r) => sum + r.amount, 0);
  return okRes(res, { expenses: rows, total_spent, total: rows.length });
}));

// ═══════════════════════════════════════════════════════════════════════════
// THE WRITE DOORS — ROAD STEP 2c, THE MONEY WRITE-PLANE CROSSING (F-39.3)
// ═══════════════════════════════════════════════════════════════════════════
// Every one of these is vendor-JWT authed through the SAME pair the read door
// uses (requireAuth + resolveVendor on :vendorId), and every one delegates to
// the writer home. NOT ONE OF THEM OPENS A TABLE. That is asserted by cell, not
// by this paragraph — `scripts/b47_money_crossing_bench.js`, mutation: inline a
// `.from('invoices').insert(` here and it reds.
//
// ── WHAT THEY REPLACE ──────────────────────────────────────────────────────
//   Mark paid       POST /binders/:v/:id/money-edit   (ENGINE)  -> here
//   Delete expense  POST /binders/:v/:id/hide         (ENGINE)  -> here
//   Add             POST /binders/:v/:id/money-edit   (ENGINE)  -> here
//   Cancel          PATCH /vendor/invoices/:id/cancel (binder)  -> here
//   PDF             GET   /vendor/invoices/:id/pdf    (binder)  -> here
// The first three crossed a PLANE; the last two were already on the public
// mount but keyed on an ENGINE BINDER id, which is the same crossing wearing a
// different coat. All five now key on `public.invoices.id` / `public.expenses.id`.


// ── ADD ───────────────────────────────────────────────────────────────────
router.post('/invoices/:vendorId', ...vendorGate, asyncHandler(async (req, res) => {
  const r = await createInvoice(req.app.locals.supabase, req.vendor.id, req.body || {});
  if (!r.ok) return errRes(res, 400, r.error);
  return okRes(res, { invoice: r.invoice });
}));

router.post('/expenses/:vendorId', ...vendorGate, asyncHandler(async (req, res) => {
  const r = await createExpense(req.app.locals.supabase, req.vendor.id, req.body || {});
  if (!r.ok) return errRes(res, 400, r.error);
  return okRes(res, { expense: r.expense });
}));


// ── EDIT ──────────────────────────────────────────────────────────────────
// c-2c.3, second instance. `AddSheet` calls `updateInvoice` at :297/:366 and
// `updateExpense` at :317/:367 — four of the ten money call sites — and the
// typed plane had no edit door for either. The invoice edit lived only at
// `PATCH /vendor/invoices/:invoiceId`, on the engine binder; the expense edit
// lived at `PATCH /vendor/expenses/:expenseId`, typed but on the wrong file
// (c-2c.4, retired below).
//
// The home decides what is editable, not this door: `updateInvoice` refuses a
// row with payments (`INVOICE_LOCKED`) or a cancelled one, and `updateExpense`
// validates category and amount. A door that re-stated either would be a second
// home for the rule.
router.patch('/invoices/:vendorId/:invoiceId', ...vendorGate, asyncHandler(async (req, res) => {
  const r = await updateInvoice(
    req.app.locals.supabase, req.vendor.id, req.params.invoiceId, req.body || {},
  );
  if (!r.ok) return errRes(res, r.code ? 400 : 404, r.error);
  return okRes(res, { invoice: r.invoice });
}));

router.patch('/expenses/:vendorId/:expenseId', ...vendorGate, asyncHandler(async (req, res) => {
  const r = await updateExpense(
    req.app.locals.supabase, req.vendor.id, req.params.expenseId, req.body || {},
  );
  if (!r.ok) return errRes(res, 400, r.error);
  return okRes(res, { expense: r.expense });
}));

// ── CANCEL ────────────────────────────────────────────────────────────────
router.patch('/invoices/:vendorId/:invoiceId/cancel', ...vendorGate, asyncHandler(async (req, res) => {
  const r = await cancelInvoice(req.app.locals.supabase, req.vendor.id, req.params.invoiceId);
  if (!r.ok) return errRes(res, r.code === 'INVOICE_PAID' ? 400 : 404, r.error);
  return okRes(res, { invoice: r.invoice, already_cancelled: !!r.already_cancelled });
}));

// ── MARK PAID ─────────────────────────────────────────────────────────────
// `amount` is REQUIRED and the caller computes it. The room passes the row's
// own `owed`; the agent passes what the vendor said arrived. Neither the door
// nor the home guesses a figure on a money surface.
router.post('/invoices/:vendorId/:invoiceId/payments', ...vendorGate, asyncHandler(async (req, res) => {
  const { amount, payment_type } = req.body || {};
  const r = await recordPayment(
    req.app.locals.supabase, req.vendor.id, req.params.invoiceId, { amount, payment_type },
  );
  if (!r.ok) return errRes(res, r.code ? 400 : 404, r.error);
  return okRes(res, { invoice: r.invoice, transitioned: r.transitioned, balance: r.balance });
}));

// ── DELETE EXPENSE ────────────────────────────────────────────────────────
// SOFT delete, exactly as the home has always done it: `deleted_at` is stamped
// and the Books read filters it, so the row leaves the register without leaving
// the database.
router.delete('/expenses/:vendorId/:expenseId', ...vendorGate, asyncHandler(async (req, res) => {
  const r = await deleteExpense(req.app.locals.supabase, req.vendor.id, req.params.expenseId);
  if (!r.ok) return errRes(res, 404, r.error);
  return okRes(res, { deleted: true });
}));

// ── PDF ───────────────────────────────────────────────────────────────────
// The generator and the bucket are NOT this door's — `src/lib/invoicePdf.js`
// renders and the `invoices` bucket stores, both already one home each. This
// route asks the writer home for the typed source and hands it over.
router.get('/invoices/:vendorId/:invoiceId/pdf', ...vendorGate, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const src = await invoicePdfSource(supabase, req.vendor.id, req.params.invoiceId);
  if (!src.ok) return errRes(res, 404, src.error);

  try {
    const buffer = await generateInvoicePdf({
      invoice: src.invoice, vendor: src.vendor, vendorName: src.vendorName || 'Vendor',
      schedule: src.schedule,
    });
    const fileName = `${req.vendor.id}/INVOICE-` +
      `${src.invoice.invoice_number.replace(/^TDW\//, '').replace(/\//g, '-').toUpperCase()}.pdf`;

    const { error: upErr } = await supabase.storage
      .from('invoices').upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });
    if (upErr) return errRes(res, 500, 'Could not store the PDF.');

    const { data: signed } = await supabase.storage
      .from('invoices').createSignedUrl(fileName, 60 * 60 * 24 * 365);
    if (!signed?.signedUrl) return errRes(res, 500, 'Could not sign the PDF link.');

    // `pdf_url` is a column on public.invoices, so the stamp goes through the
    // writer home rather than through a `.from()` here — the sole-writer rule
    // does not take an exception for a one-field update.
    const { updateInvoicePdfUrl } = require('../../lib/vendor/invoices');
    await updateInvoicePdfUrl(supabase, req.vendor.id, src.invoice.id, signed.signedUrl);

    // ── F-2c.w7's dream-os HALF · THE WIRE SAYS `pdf_url` NOW ───────────────
    // THIS FIELD WAS `url`, AND IT WAS THE ONLY PLACE IN THE ESTATE THAT SPELLED
    // IT THAT WAY. The column is `pdf_url` (public.invoices ordinal 13), the
    // stamp one line above writes `pdf_url`, `POST /` at
    // `src/api/vendor/invoices.js` (symbol: the create route's okRes) answers
    // `pdf_url`, the binder door's `/:invoiceId/pdf` answers `pdf_url`, and the
    // admin detail view and the agent both read `pdf_url`. One door said `url`
    // and every caller of it had to know that.
    //
    // The pwa carried a `url ?? pdf_url` fallback for exactly this, declared
    // conditional-withheld with its retirement condition written down: it
    // retires when THIS line ships. It does, in the pair — dream-os first so no
    // deploy window has a client reading a name the server does not send.
    return okRes(res, { pdf_url: signed.signedUrl, invoice_number: src.invoice.invoice_number });
  } catch (e) {
    console.error('[GET /vendor/money/invoices/:id/pdf]', e.message);
    return errRes(res, 500, 'Could not generate the PDF.');
  }
}));

module.exports = router;
