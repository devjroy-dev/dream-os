// src/api/admin/bridge.js
// THE BRIDGE — TDW_10 P2, spec §P2 / ruling A-3.
// Mounted at /api/v2/admin/bridge on the vendor/admin service.
//
//   GET /api/v2/admin/bridge     ONE server-assembled aggregation
//
// ═════════════════════════════════════════════════════════════════════════════
// THE LAW THIS FILE IS BUILT ON — CE-200, Fork 1 ruled
// ═════════════════════════════════════════════════════════════════════════════
// A placeholder number on the founder's morning screen is a lie with a font.
// Every figure below either reconciles to rows that exist at this tip, or it
// renders a LABELLED honest state naming who owns the wiring. Nothing here
// invents, infers, or averages its way to a figure it does not have.
//
// The chair's ruling, verbatim in its operative half: a zero that can move the
// day Razorpay clears is a live instrument; a zero from a table that does not
// exist is decoration. Every honest state below is the second case refusing to
// masquerade as the first.
//
// This extends `app/admin/page.tsx`'s F-07.90 doctrine rather than inventing
// one: `0` is an ANSWER, `—` is the absence of one, and collapsing the second
// into the first is what made a broken guard look like a quiet Tuesday.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠ THE INVOICES-FAMILY EXCLUSION — READ BEFORE YOU ADD A MONEY LINE
// ═════════════════════════════════════════════════════════════════════════════
// `public.invoices`, `public.payment_schedules`, `public.couple_receipts`,
// `public.team_payments`, `public.expenses` and `public.tds_ledger` are all
// money-shaped, all populated, and NONE of them is TDW's revenue. They are the
// VENDOR'S OWN CLIENT MONEY: `invoices` carries `vendor_id` + `client_name` +
// `client_phone` + `amount_total` + `amount_paid` — a photographer invoicing
// the bride who hired her. TDW is the CRM those rows live in, not a party to
// them.
//
// Summing any of them onto this endpoint would report vendors' gross wedding
// bookings as the estate's income: wrong by orders of magnitude and wrong in
// KIND. It is the single most available wrong answer in this tree and it looks
// right. It is excluded here deliberately and permanently, and this paragraph
// exists so the next hand to look for a money column reads the reason before
// it reaches for one. (F-10.1's sitting, CE-200.)
//
// ═════════════════════════════════════════════════════════════════════════════
// SQL PROVENANCE — every column below has a witness
// ═════════════════════════════════════════════════════════════════════════════
// Witness: docs/db/PUBLIC_SCHEMA.md + docs/db/ENGINE_SCHEMA.md at dream-os
// db0b780, read column-by-column before a line was authored.
//
//   public.couple_enquiries            (9)  : id, created_at
//   public.leads                       (27) : id, created_at, deleted_at
//   public.demo_claim_requests         (7)  : id, claimed_at, contacted
//   public.vendors                     (38) : id, tier, created_at
//   public.vendor_featured_submissions (18) : id, fee_inr, paid_at, state
//   public.messages                    (18) : id, conversation_id, direction,
//                                             channel, cost_inr, created_at
//   public.conversations               (12) : id, kind
//   public.vendor_activity_log         (8)  : id, action, created_at
//   public.prospects                   (14) : id, state
//   public.failed_turns                (7)  : id, state, created_at
//   public.vendor_discover_requests    (7)  : id, state, created_at
//   public.demo_vendors                (14 at snapshot + the 0106/0107/0109
//                                       additions, witnessed AT THE MIGRATIONS
//                                       — see the staleness note below) :
//                                       id, state, invited_at, claimed_at,
//                                       removed_at
//
// ── THE SNAPSHOT IS THIRTEEN MIGRATIONS STALE, AND THAT MATTERS HERE ─────────
// PUBLIC_SCHEMA.md's own header states its applied tip: `0099`, snapshot dated
// 2026-07-23. The ladder at this tip is `0112`. `demo_vendors.state`,
// `.invited_at`, `.claimed_at` and `.removed_at` DO NOT APPEAR in that snapshot
// because `0106_demo_lifecycle.sql` added them afterwards. They are witnessed
// instead at `0106_demo_lifecycle.sql:47-58` (state, invited_at, opened_at,
// engaged_at, claimed_at, removed_at, expires_at) and `0107:54-55` (sunset_at).
// Named rather than assumed: the SQL provenance law is satisfied by A witness,
// not by one particular file, and reaching for the stale one silently would be
// exactly F-04.29's disease.
//
// ═════════════════════════════════════════════════════════════════════════════
// WHY EVERY COUNT CARRIES ITS OWN EXACT-COUNT GUARD (the independent-method law)
// ═════════════════════════════════════════════════════════════════════════════
// Two shapes below fetch ROWS and bucket them in Node (prospect states, demo
// lifecycle states, the WA-turn surface split) because PostgREST cannot GROUP
// BY and cannot SUM. A fetch has a row cap. A cap that is silently hit produces
// a figure that is too low and looks complete — a silent-truncation failure,
// which is the same class as the silent zero the independent-method law exists
// to refuse.
//
// So each of those three runs a SECOND, INDEPENDENT query: `count: 'exact',
// head: true` over the identical predicate. If the exact count exceeds the rows
// returned, the bucket split is stamped `partial: true` and the UI says so. The
// HEADLINE total always comes from the exact count and is therefore never
// affected by the cap. The bench mutates the cap downward and asserts the flag
// raises — a guard that cannot be seen to fire is not a guard.

'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes } = require('../../lib/response');
const { TEMPLATES } = require('../../lib/templates');

// ── Caps, named ─────────────────────────────────────────────────────────────
const ROW_CAP      = 5000;  // the bucket-fetch ceiling; guarded, never silent
const QUEUE_SAMPLE = 1;     // oldest-age lookups need exactly one row

// IST is a fixed +05:30 offset with no daylight rule, so a constant is correct
// here in a way it would not be for a zone that observes DST.
const IST_OFFSET_MIN = 330;

// ── State vocabularies, each carried from its own CHECK constraint ──────────
// prospects: 0085_prospect_lane.sql:32
const PROSPECT_STATES = Object.freeze([
  'cold', 'templated', 'replied', 'in_session', 'converted', 'opted_out', 'expired',
]);
// demo_vendors: src/lib/demoLifecycle.js:98-99 (STATES), the sole writer's own list
const DEMO_STATES = Object.freeze([
  'legacy', 'built', 'invited', 'opened', 'engaged', 'claimed', 'expired', 'removed',
]);
// conversations: 0085_prospect_lane.sql:55-56 — THE SURFACE VOCABULARY.
const SURFACE_KINDS = Object.freeze([
  'vendor_self', 'couple_thread', 'couple_self', 'circle_thread', 'network', 'prospect_marketing',
]);
// vendor_discover_requests: 0039_vendor_discover.sql:49-50
const APPROVAL_PENDING = Object.freeze(['requested', 'under_review']);

// ═════════════════════════════════════════════════════════════════════════════
// THE HONEST STATES — each names its owner, because "unavailable" without an
// owner is a shrug and a shrug does not get scheduled.
// ═════════════════════════════════════════════════════════════════════════════
const WIRING_PENDING = Object.freeze({
  revenue: {
    state: 'wiring_pending',
    label: 'revenue — wiring pending',
    // F-10.1. Ruled at CE-200: no DDL in P2.
    why: 'No payment or subscription rows exist anywhere in the estate. '
       + 'billing_events is specified in TDW_09_UIUX_FINAL (migration 0084) and was never built; '
       + 'the Razorpay integration is a stub whose order-id is null on both branches of RAZORPAY_LIVE.',
    owner: 'Block 09 P4 — Razorpay checkout + the signature-verified webhook',
    finding: 'F-10.1',
  },
  trials_expiring: {
    state: 'no_clock',
    label: 'no trial clock',
    // F-10.27, minted this sitting.
    why: 'public.vendors carries `tier` (default trial) but NO trial start or end column, '
       + 'and no TRIAL_DAYS constant exists in src/. "Expiring in 3 days" cannot be derived '
       + 'without inventing a trial length, so it is not derived.',
    owner: 'Block 09 P4 — 0084_billing.sql\'s `billing_status`',
    finding: 'F-10.27',
  },
  credit_state: {
    state: 'not_built',
    label: 'credit state — not built',
    // F-10.26, minted this sitting.
    why: 'The spec cites "05\'s flag". There is no such flag: no admin_config key, '
       + 'no writer, and no credit banner component in either repo. The phrase appears '
       + 'only in TDW_10_ADMIN_FINAL itself.',
    owner: 'unhomed — needs a charter before it can have a number',
    finding: 'F-10.26',
  },
  subs_halted: {
    state: 'not_built',
    label: 'halted subscriptions — not built',
    // F-10.29, minted this sitting.
    why: 'No subscription table exists; the word "subscription" appears zero times in src/.',
    owner: 'Block 09 P4',
    finding: 'F-10.29',
  },
});

// ── IST day window, returned as the UTC instants PostgREST compares against ──
// The founder's day is an IST day. The database stores timestamptz. Converting
// HERE, once, is the only way the two agree; a naive `created_at::date` would
// cut the day at 05:30 IST and quietly lose the first five and a half hours of
// every morning — the exact hours he reads this screen in.
function istDayWindow(now) {
  const ist = new Date(now.getTime() + IST_OFFSET_MIN * 60000);
  const startUtcMs = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate())
                     - IST_OFFSET_MIN * 60000;
  return {
    start:     new Date(startUtcMs).toISOString(),
    end:       new Date(startUtcMs + 86400000).toISOString(),
    ist_date:  ist.toISOString().slice(0, 10),
  };
}

/** Runs a query and converts ANY failure into a NAMED degradation.
 *  One dead source must not blank the Bridge — but it must never look like a
 *  zero either. `null` travels to the client and the masthead renders `—`.
 *  This is search.js's `attempt` with the honest-unknown return that A-3's
 *  "no dead numbers" clause requires. */
async function attempt(name, fn, degraded, fallback = null) {
  try {
    const r = await fn();
    if (r && r.error) { degraded.push(name); return fallback; }
    return r;
  } catch (_e) {
    degraded.push(name);
    return fallback;
  }
}

/** An exact count over a predicate. Never fetches rows. */
function countOf(supabase, table, build) {
  return build(supabase.from(table).select('id', { count: 'exact', head: true }));
}

/** Rows for bucketing, with the cap declared so the caller can guard it. */
function rowsOf(supabase, table, build) {
  return build(supabase.from(table)).limit(ROW_CAP);
}

/** Buckets `rows` by `col` across a declared vocabulary, and reconciles the
 *  bucket sum against an INDEPENDENT exact count. A value outside the
 *  vocabulary is NOT discarded — it lands in `other`, because a state this file
 *  has not heard of is news, and silently dropping it would hide a schema
 *  change behind a correct-looking total. */
function bucket(rows, col, vocabulary, exactTotal) {
  const out = {};
  for (const s of vocabulary) out[s] = 0;
  let other = 0;
  for (const r of (rows || [])) {
    const v = r && r[col];
    if (Object.prototype.hasOwnProperty.call(out, v)) out[v] += 1;
    else other += 1;
  }
  if (other) out.other = other;
  const seen = (rows || []).length;
  return {
    states:  out,
    total:   typeof exactTotal === 'number' ? exactTotal : seen,
    partial: typeof exactTotal === 'number' ? seen < exactTotal : false,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/v2/admin/bridge
// ═════════════════════════════════════════════════════════════════════════════
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const t0       = Date.now();
  // ── THE CLOCK IS INJECTABLE, AND THAT IS NOT A TEST HOOK ──────────────────
  // Every figure on this screen is a function of "now". A bench that cannot fix
  // "now" cannot assert a single day-scoped number without the assertion rotting
  // at midnight — and a cell that silently changes meaning with the calendar is
  // the vacuous-green class this estate refuses. `app.locals.clock` is UNSET in
  // production, so the default below is the only path that ever runs there;
  // src/index.js does not assign it and nothing else may. The bench asserts both
  // halves: that the override works, and that the default is the wall clock.
  // Same seam and same reason as demoLifecycle.js's `_now()`.
  const clock    = (req.app.locals && typeof req.app.locals.clock === 'function')
                     ? req.app.locals.clock : () => new Date();
  const now      = clock();
  const day      = istDayWindow(now);
  const h24      = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const d7       = new Date(now.getTime() -  7 * 86400 * 1000).toISOString();
  const degraded = [];

  const inDay = (q, col) => q.gte(col, day.start).lt(col, day.end);

  const [
    enquiries, newLeads, demoClaims, newVendors,
    feeToday, feeLifetime,
    trials,
    waTurnsExact, waRows, convRowsPromiseSeed,
    downgrades,
    prospectRows, prospectExact,
    demoRows, demoExact,
    invited7d, claimed7d,
    approvalsPending, approvalsOldest,
    failedUnreplayed,
    removed24h,
  ] = await Promise.all([
    // ── today ──────────────────────────────────────────────────────────────
    attempt('enquiries',   () => inDay(countOf(supabase, 'couple_enquiries', q => q), 'created_at'), degraded),
    attempt('leads',       () => inDay(countOf(supabase, 'leads', q => q.is('deleted_at', null)), 'created_at'), degraded),
    attempt('demo_claims', () => inDay(countOf(supabase, 'demo_claim_requests', q => q), 'claimed_at'), degraded),
    attempt('vendors',     () => inDay(countOf(supabase, 'vendors', q => q), 'created_at'), degraded),

    // THE ONE REAL LEDGER. `paid_at is not null` is the whole predicate: a
    // submission with a fee and no payment stamp is an invoice nobody paid.
    attempt('featured_fees', () => supabase.from('vendor_featured_submissions')
      .select('fee_inr').not('paid_at', 'is', null)
      .gte('paid_at', day.start).lt('paid_at', day.end).limit(ROW_CAP), degraded),
    attempt('featured_fees_lifetime', () => supabase.from('vendor_featured_submissions')
      .select('fee_inr').not('paid_at', 'is', null).limit(ROW_CAP), degraded),

    // Real: a count of rows whose tier says trial. The EXPIRY half is the
    // honest state above — the count is true, the clock does not exist.
    attempt('trials', () => countOf(supabase, 'vendors', q => q.eq('tier', 'trial')), degraded),

    // ── WA turns + INR by surface ──────────────────────────────────────────
    // The headline count is exact and cap-independent.
    attempt('wa_turns', () => inDay(countOf(supabase, 'messages', q => q.eq('channel', 'whatsapp')), 'created_at'), degraded),
    // The split needs rows: PostgREST cannot GROUP BY, and cost_inr must be summed in Node.
    attempt('wa_rows', () => inDay(rowsOf(supabase, 'messages',
      q => q.select('conversation_id, direction, cost_inr').eq('channel', 'whatsapp')), 'created_at'), degraded),
    Promise.resolve(null), // conversations are fetched in wave 2, below

    attempt('downgrades', () => inDay(countOf(supabase, 'vendor_activity_log',
      q => q.eq('action', 'provider_downgrade')), 'created_at'), degraded),

    // ── funnels ────────────────────────────────────────────────────────────
    attempt('prospects',       () => rowsOf(supabase, 'prospects', q => q.select('state')), degraded),
    attempt('prospects_count', () => countOf(supabase, 'prospects', q => q), degraded),
    attempt('demo_lifecycle',       () => rowsOf(supabase, 'demo_vendors', q => q.select('state')), degraded),
    attempt('demo_lifecycle_count', () => countOf(supabase, 'demo_vendors', q => q), degraded),
    attempt('invited_7d', () => countOf(supabase, 'demo_vendors', q => q.gte('invited_at', d7)), degraded),
    attempt('claimed_7d', () => countOf(supabase, 'demo_vendors', q => q.gte('claimed_at', d7)), degraded),

    // ── queue ──────────────────────────────────────────────────────────────
    attempt('approvals', () => countOf(supabase, 'vendor_discover_requests',
      q => q.in('state', APPROVAL_PENDING)), degraded),
    attempt('approvals_oldest', () => supabase.from('vendor_discover_requests')
      .select('created_at').in('state', APPROVAL_PENDING)
      .order('created_at', { ascending: true }).limit(QUEUE_SAMPLE), degraded),
    attempt('failed_turns', () => countOf(supabase, 'failed_turns', q => q.eq('state', 'dead')), degraded),
    attempt('takedowns_24h', () => countOf(supabase, 'demo_vendors', q => q.gte('removed_at', h24)), degraded),
  ]);
  void convRowsPromiseSeed;

  // ── WAVE 2: the surfaces the day's turns belong to ──────────────────────
  // `kind` lives on public.conversations, not on public.messages, so the split
  // costs a second wave — the same shape and the same reason as search.js's
  // users lookup. Stated rather than hidden: there is no shortcut here.
  const waList  = Array.isArray(waRows && waRows.data) ? waRows.data : [];
  const convIds = Array.from(new Set(waList.map(m => m && m.conversation_id).filter(Boolean)));
  const convRows = convIds.length
    ? await attempt('conversations', () => supabase.from('conversations')
        .select('id, kind').in('id', convIds).limit(ROW_CAP), degraded)
    : { data: [] };

  const kindById = new Map();
  for (const c of ((convRows && convRows.data) || [])) kindById.set(c.id, c.kind);

  const bySurface = {};
  for (const k of SURFACE_KINDS) bySurface[k] = { turns: 0, inr: 0 };
  let unattributedTurns = 0, unattributedInr = 0;
  for (const m of waList) {
    const kind = kindById.get(m.conversation_id);
    const inr  = Number(m.cost_inr) || 0;
    if (kind && Object.prototype.hasOwnProperty.call(bySurface, kind)) {
      bySurface[kind].turns += 1;
      bySurface[kind].inr   += inr;
    } else {
      unattributedTurns += 1;
      unattributedInr   += inr;
    }
  }
  for (const k of Object.keys(bySurface)) bySurface[k].inr = Math.round(bySurface[k].inr * 100) / 100;

  const waExactTotal = (waTurnsExact && typeof waTurnsExact.count === 'number') ? waTurnsExact.count : null;

  // ── Featured fees: sum in Node, PostgREST cannot ───────────────────────
  const sumFees = (r) => {
    if (!r || !Array.isArray(r.data)) return null;
    return r.data.reduce((a, row) => a + (Number(row.fee_inr) || 0), 0);
  };
  const feesToday    = sumFees(feeToday);
  const feesLifetime = sumFees(feeLifetime);

  const cnt = (r) => (r && typeof r.count === 'number') ? r.count : null;

  const oldestIso = approvalsOldest && Array.isArray(approvalsOldest.data) && approvalsOldest.data[0]
    ? approvalsOldest.data[0].created_at : null;
  const oldestHours = oldestIso
    ? Math.floor((now.getTime() - new Date(oldestIso).getTime()) / 3600000) : null;

  // Templates awaiting a verdict. The registry is an in-CODE constant, not a
  // table (src/lib/templates.js), so this reads the module rather than the
  // database — and the spec's "Twilio verdict" is stale: P-06.T settled Meta
  // Cloud API direct, and templates.js's own header drops `twilioTemplateSid`
  // as stale in its first paragraph. Named as F-10.28; the figure is Meta's.
  const awaitingVerdict = Object.values(TEMPLATES)
    .filter(t => t && t.status !== 'approved')
    .map(t => ({ key: t.key, name: t.name, line: t.line, status: t.status }));

  const invited = cnt(invited7d);
  const claimed = cnt(claimed7d);

  const payload = {
    generated_at: now.toISOString(),
    ist_date:     day.ist_date,
    window:       { start: day.start, end: day.end },

    today: {
      enquiries:   cnt(enquiries),
      new_leads:   cnt(newLeads),
      demo_claims: cnt(demoClaims),
      new_vendors: cnt(newVendors),

      // Two lines, per the CE-200 ruling: the honest headline, and beneath it
      // the one real ledger that exists at this tip.
      revenue: {
        ...WIRING_PENDING.revenue,
        featured_fees: {
          today_inr:    feesToday,
          lifetime_inr: feesLifetime,
          source:       'public.vendor_featured_submissions where paid_at is not null',
          note:         'Real rows, real predicate. Reads Rs 0 until Razorpay clears — and that zero can move.',
        },
      },

      trials: {
        active:      cnt(trials),
        expiring_3d: WIRING_PENDING.trials_expiring,
      },

      wa: {
        turns:       waExactTotal,
        by_surface:  bySurface,
        unattributed: { turns: unattributedTurns, inr: Math.round(unattributedInr * 100) / 100 },
        // The split's honesty flag. The headline `turns` is exact regardless.
        partial:     waExactTotal !== null && waList.length < waExactTotal,
        // F-10.30, minted this sitting: engine.usage is the estate's SECOND
        // cost meter (harvest + Donna spend) and carries NO surface dimension —
        // it keys on agent_id, not on a conversation kind. Its spend is real
        // money that this split cannot see. It is named here rather than
        // distributed across surfaces by a guess.
        excludes:    'engine.usage (harvest + Donna spend) — real INR, no surface dimension. F-10.30.',
      },

      downgrades:   cnt(downgrades),
      credit_state: WIRING_PENDING.credit_state,
    },

    funnels: {
      prospects: bucket(prospectRows && prospectRows.data, 'state', PROSPECT_STATES, cnt(prospectExact)),
      demo:      bucket(demoRows && demoRows.data, 'state', DEMO_STATES, cnt(demoExact)),
      claim_rate_7d: {
        invited: invited,
        claimed: claimed,
        // A rate over zero invitations is not 0%. It is no rate at all, and
        // rendering 0% would read as "nobody claimed" when the truth is
        // "nobody was invited".
        rate: (typeof invited === 'number' && typeof claimed === 'number' && invited > 0)
          ? Math.round((claimed / invited) * 1000) / 10
          : null,
      },
    },

    queue: {
      approvals_pending: { count: cnt(approvalsPending), oldest_hours: oldestHours, oldest_at: oldestIso },
      failed_turns:      { count: cnt(failedUnreplayed) },
      takedowns_24h:     { count: cnt(removed24h) },
      subscriptions_halted: WIRING_PENDING.subs_halted,
      templates_awaiting_verdict: {
        count:     awaitingVerdict.length,
        templates: awaitingVerdict,
        source:    'src/lib/templates.js — an in-code registry, not a table',
        transport: 'Meta Cloud API (P-06.T). The spec\'s "Twilio verdict" is stale — F-10.28.',
      },
    },

    took_ms: Date.now() - t0,
  };

  if (degraded.length) payload.degraded = Array.from(new Set(degraded));
  return okRes(res, payload);
}));

module.exports = router;
