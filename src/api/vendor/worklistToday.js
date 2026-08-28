'use strict';
// src/api/vendor/worklistToday.js
// M-WORKLIST · PHASE 3 — THE TODAY FEED, READ-ONLY.
//   GET /api/v2/vendor/worklist/today
//
// ═══════════════════════════════════════════════════════════════════════════
// THE ADDRESS, AND THE TOMBSTONE THIS FILE IS NOT
// ═══════════════════════════════════════════════════════════════════════════
// `src/api/vendor/today.js` is a TOMBSTONE. It was deleted at f47c732 — the
// commit whose own subject reads "the dead reader deleted with F-09.63 its
// lying header" — because a comment there called it live long after the Phase-4
// flip at core.js had unmounted it. WORKLIST_PARITY §8.8 rules Phase 3 to a
// fresh path for that reason, and §11 takes the ruling.
//
// THE KICKOFF NAMED THE FILE AND NOT THE MOUNT, AND THE MOUNT IS OCCUPIED.
// `GET /api/v2/vendor/today` IS A LIVE ROUTE at this tip: core.js (symbol: the
// '/today' mount) points it at src/api/vendor-engine/today.js, which reads
// `engine.records` and is consumed in production by the pwa Storefront's
// profile score (dreamos-pwa, symbol `fetchToday`, called from the storefront
// page). Under A-1 that is paying vendors. Chair conviction c-37.16 owns the
// miss; F-1 arm (b) rules this module to its OWN segment, and the reason is
// this estate's own sentence:
//
//   the estate deleted a file for asserting a liveness it did not have; a
//   second reader at a live reader's address, distinguished only by a path
//   segment's presence, builds the next instance of that class.
//
// So: `/worklist/today`, not `/today`. No fall-through, nothing to disambiguate
// by arity, and the live reader is not touched by this delivery.
//
// ── §8.9's SECOND CLAUSE IS DEFERRED, NOT DONE (c-37.17) ───────────────────
// §11 rules the typed plane AND "the engine-backed reader retires at the same
// seam". This sitting takes the first clause only. The retirement is a
// CROSS-REPO seam: the engine reader dies in the same motion the Storefront
// consumer repoints, or a paying vendor's profile score goes dark. Chartered
// for Phase 4 or cutover; named here so the debt has an address in the tree.
//
// ═══════════════════════════════════════════════════════════════════════════
// READ-ONLY BY LAW (D-3)
// ═══════════════════════════════════════════════════════════════════════════
// ZERO writes on this path. Every verb on a Today card calls the ROOM's own
// existing write endpoint — the sole-writer law, which is what makes it true
// that Today can never corrupt a table it does not own. The proof is not this
// paragraph: scripts/b39_worklist_today_bench.js §6 drives this router over
// real HTTP against a recording supabase fake and REDDENS on any insert,
// update, upsert or delete. Door cells EXECUTE.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE PLANE, AND EVERY COLUMN'S WITNESS
// ═══════════════════════════════════════════════════════════════════════════
// TYPED PLANE ONLY (§8.9). `public.*` throughout; zero `engine.*` hops. Every
// column below is witnessed at docs/db/PUBLIC_SCHEMA.md by its section, and
// every STATE VOCABULARY is read from that table's own CHECK constraint in the
// constraints addendum — never from habit. Ordinals are recorded per kind in
// the source map beneath. SQL-provenance law: a column with no witness is an
// assumption and the statement is unauthored.
//
// KNOWN DOC-GAP, and it touches nothing here: `public.engagements` is absent
// from the snapshot (§9.6, re-derived at this read-first — the table list
// carries no such section). No kind reads it. If a future kind needs it, that
// is a §0.2 report, not an inference.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE SOURCE MAP — five attention kinds, three done kinds
// ═══════════════════════════════════════════════════════════════════════════
// ORDINALS BELOW ARE `information_schema.columns.ordinal_position` AS WITNESSED
// IN PUBLIC_SCHEMA.md — NOT the column's place in the printed list (F-P3.12).
// The two differ wherever a column was dropped: `public.leads` runs 1–18 then
// 20–28, so the twentieth LINE is `vendor_summary` and `deleted_at(20)` below
// is nonetheless correct. Match on the number, never by counting.
//
// §8.6 parks `shop_nudge`; six of the seven D-4 kinds ship, and the six is
// FIVE in needs_attention plus done_today as the sixth. That arithmetic was
// derived at read-first and CONFIRMED by the chair, because the kickoff and the
// ledger count it differently and a silent disagreement about "six" would have
// shipped a missing kind.
//
//  lead_unanswered    public.leads       (PUBLIC_SCHEMA `## public.leads`, 27 cols)
//                     id(1) name(3) wedding_date(6) wedding_city(7)
//                     budget_min(9) budget_max(10) state(13) created_at(16)
//                     deleted_at(20)
//  invoice_due        public.invoices    (`## public.invoices`, 21 cols)
//                     id(1) invoice_number(4) client_name(5) amount_total(8)
//                     amount_paid(10) due_date(11) state(12) deleted_at(20)
//  events_today       public.events      (`## public.events`, 18 cols)
//                     id(1) title(3) event_date(4) event_time(5) kind(6)
//                     state(8) deleted_at(14) slot(16)
//  contract_unsigned  public.contracts   (`## public.contracts`, 15 cols)
//                     id(1) title(6) state(11) sent_at(12) signed_at(13)
//                     created_at(14)
//  team_tasks         public.team_tasks  (`## public.team_tasks`, 13 cols)
//                     id(1) title(5) due_date(7) priority(8) state(9)
//                     completed_at(10) deleted_at(11) created_at(12)
//
// ── THREE FILTER CORRECTIONS TO THE LEDGER'S §6 SQL, ALL CHAIR-GRANTED ─────
//
// [F-P3.1] INVOICES ARE SELECTED BY A POSITIVE LIST, NEVER BY `<> 'paid'`.
//   `invoices_state_check` is {unpaid, advance_paid, paid, cancelled}. §6.2's
//   proposed filter was `state <> 'paid'`, which returns CANCELLED invoices
//   past their due date as money owed. This is leadSerializer.js's own lesson
//   about `FULL_ACCESS_TIERS` (symbol: FULL_ACCESS_TIERS, and the paragraph
//   above it) applied to money: a negation reads every unknown as included, and
//   the unknown here is any state a future migration adds.
//
// [F-P3.2] CONTRACTS ARE `state = 'sent'`, NOT `NOT IN ('cancelled')`.
//   `contracts_state_check` is {draft, sent, signed, cancelled}. §6.3's filter
//   surfaced DRAFTS as awaiting signature. A draft is the vendor's own
//   unfinished desk; nobody external is waiting on it. If a finish-your-draft
//   nudge is ever wanted it is a NEW KIND by the founder's word, not a leak
//   through this filter.
//
// [F-P3.3] `events_today` IS A DAY. §6.4's query returned everything from today
//   forward. The kickoff's kind is `events_today` and the day governs. The week
//   is not in this contract and enters, if ever, as a LABELLED contract
//   amendment — never by widening this filter quietly.
//
// [§9.7] `public.contracts` HAS NO `deleted_at`. Witnessed by absence from its
//   15-column list, re-derived at this read-first. Four sibling tables have one.
//   A soft-delete filter written here from habit would query a column that does
//   not exist; cancellation is carried in `state` and nowhere else.
//
// [F-P3.5] `done_today` FOR INVOICES IS state='paid' AND the payment landed
//   today. `last_payment_at` is the LAST PAYMENT's clock, not a completion
//   stamp: a deposit taken this morning moves it while `state` stays
//   `advance_paid`. An invoice that took a deposit today is not done today.
//   Both halves are required, and that pair is now §8.7's ruled meaning here.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE LEAD ROWS AND THE CONNECT GATE (R-36.13 / R-37.4)
// ═══════════════════════════════════════════════════════════════════════════
// THIS DOOR SELECTS NO CONTACT COLUMN, AT ANY TIER.
//
// leadSerializer.js is a STRIP: `stripConnectKeys` removes WITHHELD_FIELDS from
// what was selected, and the list door at leads.js (symbol `dataSelect`) selects
// `phone` and then strips it. A strip needs something to strip. This door names
// no contact column in its SELECT, so law ① — PAYLOAD-PROOF, NEVER CLIENT
// MASKING — is satisfied AT THE QUERY rather than at the serializer, and there
// is no second redaction path because there is no redaction to perform.
//
// `redacted` is still carried, and it is computed by importing
// `hasFullLeadAccess` from the serializer's ONE HOME. It is never a local read
// of `vendors.tier` — a second tier-resolution site is exactly how R-36.10's
// fail-to-redacted rule and its loud log would get quietly forked.
//
// A FEED ROW IS NOT A LEAD CARD. It carries enough to decide whether to open
// the Leads room, and the Leads room's own door applies the full gate. The flag
// rides so the surface can place its upsell slot without a second round trip.
//
// [F-P3.4] THE CENSUS GUARD DID NOT COVER A THIRD DOOR. b36 §9 pins five sets —
// `public.leads`' columns, the list SELECT, the detail SELECT, the list wire,
// the detail envelope. R-37.4's alarm was scoped by door COUNT, and this
// sitting adds a door: a future contact column on `public.leads` would red the
// guard for two doors and stay silent about this one. FEED_SELECT_CENSUS is
// added to the serializer's census block (its one home, beside the other five)
// and §5 of this sitting's bench diffs THIS FILE's live SELECT against it by an
// independent method. Updating that constant is a RULING, not a chore.

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { hasFullLeadAccess } = require('../../lib/vendor/leadSerializer');
const { istTodayISO, istDayWindowUtc } = require('../../lib/vendor/istClock');

// ── THE CEILINGS ───────────────────────────────────────────────────────────
// One cap for every kind, deliberately. A per-kind cap would encode a judgement
// about which kind deserves more of the vendor's screen, and D-4 already ruled
// the ranking; a second, quieter ranking hidden in the limits is not something
// anyone would find later. 20 is chosen against the founder's own test account
// shape and is a CEILING, never a promise — see `truncated` below.
const KIND_CAP = 20;

// The five attention kinds, in D-4's ruled rank order minus the parked
// `shop_nudge`. THE ORDER OF THIS ARRAY IS THE RANK ORDER and the bench asserts
// it by index: unanswered leads → money due → dates → contracts unsigned →
// team asks. Object key order in JSON is insertion order, so the response
// carries the ranking structurally and Phase 4 does not re-sort.
const ATTENTION_KINDS = [
  'lead_unanswered',
  'invoice_due',
  'events_today',
  'contract_unsigned',
  'team_tasks',
];

const DONE_KINDS = ['invoice_paid', 'contract_signed', 'team_task_done'];

// ── THE SELECTS, AS CONSTANTS ──────────────────────────────────────────────
// Named rather than inlined so §5's census cell can read the SELECT this door
// actually sends by an independent method — a regex over this file's source
// would be reproducing the method under test (the independent-method law).
// LEAD_FEED_SELECT is the one FEED_SELECT_CENSUS is pinned to.
const LEAD_FEED_SELECT     = 'id, name, wedding_date, wedding_city, budget_min, budget_max, state, created_at';
const INVOICE_FEED_SELECT  = 'id, invoice_number, client_name, amount_total, amount_paid, due_date, state';
const EVENT_FEED_SELECT    = 'id, title, event_date, event_time, kind, slot, state';
const CONTRACT_FEED_SELECT = 'id, title, state, sent_at, created_at';
const TASK_FEED_SELECT     = 'id, title, due_date, priority, state, created_at';

const INVOICE_DONE_SELECT  = 'id, invoice_number, client_name, amount_total, last_payment_at';
const CONTRACT_DONE_SELECT = 'id, title, signed_at';
const TASK_DONE_SELECT     = 'id, title, completed_at';

// STATE VOCABULARIES, from each table's own CHECK constraint. Named here so a
// reader can see that the positive lists below are the DATABASE's words and not
// a memory of them.
//   invoices_state_check   {unpaid, advance_paid, paid, cancelled}
//   contracts_state_check  {draft, sent, signed, cancelled}
//   events_state_check     {upcoming, done, cancelled}
//   team_tasks_state_check {open, in_progress, done, cancelled}
//   public.leads           HAS NO STATE CHECK — see the note at the lead query.
const INVOICE_DUE_STATES = ['unpaid', 'advance_paid'];
const TASK_OPEN_STATES   = ['open', 'in_progress'];

/** Rows or the error, never a half-answer. */
function rows(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data || [];
}

// THE PATH SEGMENT LIVES HERE, NOT AT THE MOUNT. core.js mounts this router at
// '/worklist'; declaring `'/'` here would have produced
// `GET /api/v2/vendor/worklist` and nothing at `/worklist/today`. That is not a
// hypothetical: the first cut of this file did exactly that and §1.1 answered
// 404 on the first execution. `node --check` passed it, and every cell that
// asserted an ABSENCE passed it too — which is why §2's negative cells now
// assert HTTP 200 alongside the empty list.
router.get(
  '/today',
  requireAuth,
  resolveVendor(),          // TOKEN ARM. The vendor is the JWT's, never a URL's.
  asyncHandler(async (req, res) => {
    const supabase = req.app.locals.supabase;
    const vendorId = req.vendor.id;
    const today    = istTodayISO();
    const window   = istDayWindowUtc(today);

    let raw;
    try {
      raw = await Promise.all([
        // ── lead_unanswered · Candidate A, §8.4 ─────────────────────────────
        // NO CONTACT COLUMN IS NAMED. See the connect-gate paragraph above.
        //
        // `state = 'new'` IS A CODE CONVENTION, NOT A DATABASE GUARANTEE.
        // Derived at read-first: `public.leads` carries NO state CHECK
        // constraint — the {new, contacted, quoted, booked, lost} vocabulary is
        // declared only at src/api/vendor/leads.js (symbol: the PATCH state
        // validator). §8.4 ruled Candidate A knowing it is a proxy for
        // "unanswered" rather than the fact; Candidate B
        // (pending_lead_pings.acknowledged_at) is held as a Phase 3 enrichment
        // by the same ruling. Recorded so the next reader does not mistake the
        // proxy for a guarantee.
        supabase.from('leads')
          .select(LEAD_FEED_SELECT)
          .eq('vendor_id', vendorId).is('deleted_at', null)
          .eq('state', 'new')
          .order('created_at', { ascending: true })   // D-4's tie rule: oldest first
          .limit(KIND_CAP + 1),                       // +1 detects truncation

        // ── invoice_due · §6.2 as corrected by F-P3.1 ───────────────────────
        supabase.from('invoices')
          .select(INVOICE_FEED_SELECT)
          .eq('vendor_id', vendorId).is('deleted_at', null)
          .in('state', INVOICE_DUE_STATES)
          .lte('due_date', today)
          .order('due_date', { ascending: true })
          .limit(KIND_CAP + 1),

        // ── events_today · §6.4 as corrected by F-P3.3 ──────────────────────
        // `event_date` is a DATE column, so an equality against the IST day is
        // exact with no cast. Blocks share this table (kind='blocked'); they are
        // the vendor's own day and belong on it.
        supabase.from('events')
          .select(EVENT_FEED_SELECT)
          .eq('vendor_id', vendorId).is('deleted_at', null)
          .eq('state', 'upcoming')
          .eq('event_date', today)
          .order('event_time', { ascending: true, nullsFirst: true })
          .limit(KIND_CAP + 1),

        // ── contract_unsigned · §6.3 as corrected by F-P3.2 ─────────────────
        // NO `deleted_at` FILTER. The column does not exist on this table
        // (§9.7). This absence is the ruling, not an oversight.
        supabase.from('contracts')
          .select(CONTRACT_FEED_SELECT)
          .eq('vendor_id', vendorId)
          .is('signed_at', null)
          .eq('state', 'sent')
          .order('sent_at', { ascending: true, nullsFirst: true })
          .limit(KIND_CAP + 1),

        // ── team_tasks · §8.5, team_tasks ONLY ──────────────────────────────
        // `team_payments` where state='owed' was the named ALTERNATIVE and was
        // REFUSED: it folds a money fact into a team kind, and money facts do
        // not nest behind a general room. Derived independently at read-first:
        // `public.tasks` does not exist in the snapshot; `public.team_tasks`
        // does. §8.5's arm was a schema fact before it was a ruling.
        supabase.from('team_tasks')
          .select(TASK_FEED_SELECT)
          .eq('vendor_id', vendorId).is('deleted_at', null)
          .in('state', TASK_OPEN_STATES)
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(KIND_CAP + 1),

        // ── done_today · §8.7, THE THREE PROVABLE KINDS ─────────────────────
        // Leads and events are ABSENT here and their absence is the structure
        // that says so: neither table carries a completion timestamp (witnessed
        // by absence from their column lists), so neither can answer "today".
        // The response says this by SHAPE — three keys, not five — which is why
        // no sentence is needed and no copy ships.
        supabase.from('invoices')
          .select(INVOICE_DONE_SELECT)
          .eq('vendor_id', vendorId).is('deleted_at', null)
          .eq('state', 'paid')                                  // F-P3.5, half one
          .gte('last_payment_at', window.start)                 // F-P3.5, half two
          .lt('last_payment_at', window.end)
          .order('last_payment_at', { ascending: false })
          .limit(KIND_CAP + 1),

        supabase.from('contracts')
          .select(CONTRACT_DONE_SELECT)
          .eq('vendor_id', vendorId)
          .eq('state', 'signed')
          .gte('signed_at', window.start).lt('signed_at', window.end)
          .order('signed_at', { ascending: false })
          .limit(KIND_CAP + 1),

        supabase.from('team_tasks')
          .select(TASK_DONE_SELECT)
          .eq('vendor_id', vendorId).is('deleted_at', null)
          .eq('state', 'done')
          .gte('completed_at', window.start).lt('completed_at', window.end)
          .order('completed_at', { ascending: false })
          .limit(KIND_CAP + 1),
      ]);
    } catch (e) {
      // FAIL POSTURE, STATED. This feed has no decoration half: every kind is
      // spine. A vendor's morning must not silently omit the money he is owed
      // because one read hiccuped, and an empty list is indistinguishable from
      // a quiet day — which is the exact lie `has_any` exists to prevent. So a
      // failed read is a FAILED REQUEST. (day.js splits spine from decoration
      // because its decoration is genuinely optional; nothing here is.)
      console.error('[worklist:today] read failed:', e.message);
      return errRes(res, 500, 'Could not read today.');
    }

    // supabase-js builders are thenable: Promise.all resolves each to its
    // {data, error} envelope. `rows` throws on `error`, and the catch above owns
    // it — a per-query error must not become an empty list, because an empty
    // list here is a claim about the vendor's day.
    let leadRows, invoiceRows, eventRows, contractRows, taskRows,
        invoiceDoneRows, contractDoneRows, taskDoneRows;
    try {
      [leadRows, invoiceRows, eventRows, contractRows, taskRows,
       invoiceDoneRows, contractDoneRows, taskDoneRows] = raw.map(rows);
    } catch (e) {
      console.error('[worklist:today] read failed:', e.message);
      return errRes(res, 500, 'Could not read today.');
    }

    // ── THE CAP, AND THE TELL THAT IT FIRED (F-3 arm b) ────────────────────
    // Each query asked for CAP+1. If CAP+1 came back, more exist than shipped
    // and `truncated` says so. A badge that is secretly a floor is the
    // never-a-false-done house law in miniature: the number would understate
    // without ever saying it was understating, and no surface could tell.
    const cap = (list) => ({
      list: list.slice(0, KIND_CAP),
      truncated: list.length > KIND_CAP,
    });

    const attention = {
      lead_unanswered:   cap(leadRows.map((r) => ({
        id: r.id, name: r.name,
        wedding_date: r.wedding_date, wedding_city: r.wedding_city,
        budget_min: r.budget_min, budget_max: r.budget_max,
        state: r.state, created_at: r.created_at,
        // ONE HOME. Not a local tier read — see the connect-gate paragraph.
        redacted: !hasFullLeadAccess(req.vendor.tier, vendorId),
      }))),
      invoice_due:       cap(invoiceRows.map((r) => ({
        id: r.id, invoice_number: r.invoice_number, client_name: r.client_name,
        amount_total: r.amount_total, amount_paid: r.amount_paid,
        // Integers on the wire. `Rs X,XX,XXX` is Phase 4's, at the formatter's
        // one canonical home (D-7). A JSON endpoint formats no money.
        amount_owed: (r.amount_total || 0) - (r.amount_paid || 0),
        due_date: r.due_date, state: r.state,
      }))),
      events_today:      cap(eventRows.map((r) => ({
        id: r.id, title: r.title, event_date: r.event_date,
        event_time: r.event_time, kind: r.kind, slot: r.slot, state: r.state,
      }))),
      contract_unsigned: cap(contractRows.map((r) => ({
        id: r.id, title: r.title, state: r.state,
        sent_at: r.sent_at, created_at: r.created_at,
      }))),
      team_tasks:        cap(taskRows.map((r) => ({
        id: r.id, title: r.title, due_date: r.due_date,
        priority: r.priority, state: r.state, created_at: r.created_at,
      }))),
    };

    const done = {
      invoice_paid:   invoiceDoneRows.slice(0, KIND_CAP).map((r) => ({
        id: r.id, invoice_number: r.invoice_number,
        client_name: r.client_name, amount_total: r.amount_total,
        last_payment_at: r.last_payment_at,
      })),
      contract_signed: contractDoneRows.slice(0, KIND_CAP).map((r) => ({
        id: r.id, title: r.title, signed_at: r.signed_at,
      })),
      team_task_done:  taskDoneRows.slice(0, KIND_CAP).map((r) => ({
        id: r.id, title: r.title, completed_at: r.completed_at,
      })),
    };

    // ── counts · R-37.63 ① ─────────────────────────────────────────────────
    // THE BADGE AND THE FEED READ THE SAME RESPONSE. `counts` is DERIVED from
    // the shipped list's length and cannot be authored independently of it —
    // that is the property, expressed as code rather than promised in a
    // comment, and §4's cell asserts it per kind.
    //
    // COUNTS COVERS THE FIVE ATTENTION KINDS AND NOTHING ELSE. Phase 4 sums
    // these client-side for the masthead numeral (ruled), so a done_today key
    // in here would silently inflate that sum. The endpoint ships no total: it
    // stays ignorant of presentation arithmetic.
    const counts    = {};
    const truncated = {};
    for (const k of ATTENTION_KINDS) {
      counts[k]    = attention[k].list.length;
      truncated[k] = attention[k].truncated;
    }

    const needs_attention = {};
    for (const k of ATTENTION_KINDS) needs_attention[k] = attention[k].list;

    // ── has_any · THE FIRST-RUN DISCRIMINATOR (F-2, R-37.68's contract) ────
    // FirstRun.tsx states the contract it must serve, verbatim from the branch:
    // Phase 4 shows the manual "when the endpoint reports no-data-ever, while
    // quiet days get the resting state instead". So `has_any` answers HAS THIS
    // VENDOR EVER HAD ANYTHING — never "is today busy".
    //
    // THE CHEAP PATH IS THE COMMON PATH. If any list above is non-empty the
    // answer is already true and no further query runs — which is every working
    // vendor, every day. Only on the ALL-EMPTY path do the five existence
    // probes fire, and they are `head:true` counts limited to one row against
    // THE FEED'S OWN TABLES. No new counter, no new column, nothing to keep in
    // sync: existence is derived where the data already lives.
    const anyShipped =
      ATTENTION_KINDS.some((k) => needs_attention[k].length > 0) ||
      DONE_KINDS.some((k) => done[k].length > 0);

    let has_any = anyShipped;
    if (!anyShipped) {
      try {
        const probes = await Promise.all([
          // Unfiltered but for ownership and soft-delete: a vendor whose only
          // lead is `lost` HAS had data, and the manual must not re-appear for
          // him. `contracts` carries no deleted_at (§9.7) — its probe reflects
          // that, deliberately, and not by omission.
          supabase.from('leads').select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendorId).is('deleted_at', null).limit(1),
          supabase.from('invoices').select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendorId).is('deleted_at', null).limit(1),
          supabase.from('events').select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendorId).is('deleted_at', null).limit(1),
          supabase.from('contracts').select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendorId).limit(1),
          supabase.from('team_tasks').select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendorId).is('deleted_at', null).limit(1),
        ]);
        has_any = probes.some((p) => (p && p.count ? p.count > 0 : false));
      } catch (e) {
        // A FAILED PROBE IS NOT A "NO". Reporting no-data-ever off a failed read
        // would show a working vendor the first-run manual — the estate
        // asserting an absence it never checked, which is the class byte 5 of
        // the Phase 1 Today page exists to refuse. Fail toward the quiet day:
        // the resting state is wrong about nothing.
        console.warn('[worklist:today] has_any probe failed, defaulting true:', e.message);
        has_any = true;
      }
    }

    return okRes(res, {
      today,
      has_any,
      needs_attention,
      done_today: done,
      counts,
      truncated,
    });
  })
);

module.exports = router;

// ── EXPORTED FOR THE CENSUS CELL, AND ONLY FOR IT (F-P3.4, hole M13) ───────
// The SELECT is exposed so b39 §5 can diff THE COLUMNS THIS DOOR ASKS FOR
// against FEED_SELECT_CENSUS directly, rather than inferring them from the
// wire. The distinction was found by mutation, not by argument: adding `phone`
// to this constant produced NO red, because the mapper below enumerates its
// output keys by hand and never spreads the row — so the column was fetched,
// held in process memory, and dropped one line before the response. The wire
// stayed clean and the guard stayed quiet.
//
// A door that PULLS contact data it does not ship is one careless spread away
// from leaking it, and the census exists to make that a desk decision rather
// than a diff nobody reads. Reading the exported constant is a different
// failure mode from reading the wire, which is what the independent-method law
// asks for; a regex over this file's source would have been the same method
// wearing a different hat.
module.exports.LEAD_FEED_SELECT = LEAD_FEED_SELECT;

// The state vocabularies this door filters on, exported so §7 can diff them
// against the CHECK constraints witnessed in PUBLIC_SCHEMA. Mutation M29 folded
// `'owed'` into TASK_OPEN_STATES — §8.5's REFUSED arm, the one that nests a
// money fact inside a team kind — and nothing reddened, because no fixture
// carried a state the table cannot hold. A filter value outside its table's
// CHECK vocabulary is dead code at best and a category mix at worst; §7.8/§7.9
// make it a red instead of a silent no-op.
module.exports.INVOICE_DUE_STATES = INVOICE_DUE_STATES;
module.exports.TASK_OPEN_STATES   = TASK_OPEN_STATES;
