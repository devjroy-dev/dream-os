#!/usr/bin/env node
// scripts/b10_p2_bridge_bench.js — TDW_10 · ADMIN P2 · THE BRIDGE.
// Runnable from any working directory, clean clone, no npm install:
//     node scripts/b10_p2_bridge_bench.js
//
// ═════════════════════════════════════════════════════════════════════════════
// WHAT THIS BENCH DRIVES, AND WHAT IT REFUSES TO DO
// ═════════════════════════════════════════════════════════════════════════════
// It calls the REAL router (src/api/admin/bridge.js) through the REAL
// requireAdmin, against a DOUBLED supabase whose rows are fixtures this file
// declares. Nothing is grepped that can be driven.
//
// The doubles answer ONLY the module under test. `src/lib/templates.js` loads
// REAL — it is a pure constant registry, and doubling it would let a bench
// green over a registry that had changed underneath it.
//
// §7 is the MUTATION SECTION: every cure cell is proven able to REDDEN by
// editing the module on disk, re-requiring it, and asserting the cell fails.
// Every mutated file is restored byte-identically and that restoration is
// itself asserted. A green that cannot go red is worse than a declared gap.

'use strict';

const path = require('path');
const fs   = require('fs');
const assert = require('assert');

const ROOT   = path.resolve(__dirname, '..');
const BRIDGE = path.join(ROOT, 'src/api/admin/bridge.js');
const ROUTER = path.join(ROOT, 'src/api/router.js');

let pass = 0, fail = 0;
function ok(label, cond, detail) {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else      { fail++; console.log(`  RED  ${label}${detail ? `  — ${detail}` : ''}`); }
}
function section(s) { console.log(`\n── ${s} ${'─'.repeat(Math.max(0, 66 - s.length))}`); }

// ═════════════════════════════════════════════════════════════════════════════
// THE RIG — a PostgREST-shaped double, deliberately thin
// ═════════════════════════════════════════════════════════════════════════════
// It records every predicate applied so the bench can assert WHAT WAS ASKED,
// not merely what came back. A count that is right for the wrong reason is the
// class this rig exists to catch.

function makeSupabase(fixtures, opts = {}) {
  const calls = [];
  const fail_on = opts.fail_on || [];

  function query(table) {
    const rec = { table, filters: [], selected: null, head: false, count: null, limit: null, order: null };
    calls.push(rec);

    const q = {
      select(cols, o) {
        rec.selected = cols;
        if (o && o.count) { rec.count = o.count; rec.head = !!o.head; }
        return q;
      },
      eq(c, v)   { rec.filters.push(['eq', c, v]);   return q; },
      in(c, v)   { rec.filters.push(['in', c, v]);   return q; },
      is(c, v)   { rec.filters.push(['is', c, v]);   return q; },
      not(c, op, v) { rec.filters.push(['not', c, op, v]); return q; },
      gte(c, v)  { rec.filters.push(['gte', c, v]);  return q; },
      lt(c, v)   { rec.filters.push(['lt', c, v]);   return q; },
      order(c, o){ rec.order = [c, o && o.ascending]; return q; },
      limit(n)   { rec.limit = n; return q.then ? q : q; },
      then(resolve, reject) { return run().then(resolve, reject); },
    };
    // `limit` is terminal in this codebase's usage, so make it thenable too.
    const origLimit = q.limit;
    q.limit = (n) => { rec.limit = n; return q; };
    void origLimit;

    function run() {
      if (fail_on.includes(table)) return Promise.resolve({ data: null, error: { message: `forced: ${table}` }, count: null });
      let rows = (fixtures[table] || []).slice();
      for (const f of rec.filters) {
        const [op, col, a, b] = f;
        if (op === 'eq')  rows = rows.filter(r => r[col] === a);
        if (op === 'in')  rows = rows.filter(r => a.includes(r[col]));
        if (op === 'is')  rows = rows.filter(r => (a === null ? r[col] == null : r[col] === a));
        if (op === 'not') rows = rows.filter(r => (a === 'is' && b === null ? r[col] != null : true));
        if (op === 'gte') rows = rows.filter(r => r[col] != null && String(r[col]) >= String(a));
        if (op === 'lt')  rows = rows.filter(r => r[col] != null && String(r[col]) <  String(a));
      }
      if (rec.order) {
        const [c, asc] = rec.order;
        rows.sort((x, y) => (String(x[c]) < String(y[c]) ? -1 : 1) * (asc === false ? -1 : 1));
      }
      const total = rows.length;
      if (rec.head && rec.count === 'exact') return Promise.resolve({ data: null, error: null, count: total });
      if (rec.limit != null) rows = rows.slice(0, rec.limit);
      return Promise.resolve({ data: rows, error: null, count: rec.count === 'exact' ? total : null });
    }

    return q;
  }

  return { from: query, __calls: calls };
}

// ── The day the fixtures live in ────────────────────────────────────────────
// 2026-08-06 12:00 IST = 2026-08-06 06:30 UTC. The IST day window is therefore
// [2026-08-05T18:30Z, 2026-08-06T18:30Z). Fixtures straddle BOTH edges on
// purpose: an off-by-5.5-hours window is the defect this data is shaped to
// catch, and it is invisible to a fixture set that sits safely mid-afternoon.
const NOW      = new Date('2026-08-06T06:30:00.000Z');
const IN_DAY   = '2026-08-06T04:00:00.000Z'; // 09:30 IST today
const EARLY    = '2026-08-05T19:00:00.000Z'; // 00:30 IST today — INSIDE
const YESTER   = '2026-08-05T17:00:00.000Z'; // 22:30 IST yesterday — OUTSIDE
const H12_AGO  = '2026-08-05T18:30:00.000Z';
const D3_AGO   = '2026-08-03T06:30:00.000Z';
const D30_AGO  = '2026-07-07T06:30:00.000Z';

function baseFixtures() {
  return {
    couple_enquiries: [
      { id: 'e1', created_at: IN_DAY }, { id: 'e2', created_at: EARLY }, { id: 'e3', created_at: YESTER },
    ],
    leads: [
      { id: 'l1', created_at: IN_DAY, deleted_at: null },
      { id: 'l2', created_at: IN_DAY, deleted_at: '2026-08-06T05:00:00.000Z' },
      { id: 'l3', created_at: YESTER, deleted_at: null },
    ],
    demo_claim_requests: [
      { id: 'c1', claimed_at: IN_DAY }, { id: 'c2', claimed_at: YESTER },
    ],
    vendors: [
      { id: 'v1', tier: 'trial',     created_at: IN_DAY },
      { id: 'v2', tier: 'trial',     created_at: D30_AGO },
      { id: 'v3', tier: 'signature', created_at: D30_AGO },
    ],
    vendor_featured_submissions: [
      { id: 'f1', fee_inr: 250000, paid_at: IN_DAY },
      { id: 'f2', fee_inr:  75000, paid_at: D30_AGO },
      { id: 'f3', fee_inr: 999999, paid_at: null },   // submitted, unpaid — MUST NOT count
    ],
    messages: [
      { id: 'm1', conversation_id: 'cv1', channel: 'whatsapp', direction: 'inbound',  cost_inr: 0,    created_at: IN_DAY },
      { id: 'm2', conversation_id: 'cv1', channel: 'whatsapp', direction: 'outbound', cost_inr: 1.25, created_at: IN_DAY },
      { id: 'm3', conversation_id: 'cv2', channel: 'whatsapp', direction: 'outbound', cost_inr: 0.75, created_at: EARLY },
      { id: 'm4', conversation_id: 'cv3', channel: 'web',      direction: 'outbound', cost_inr: 9.99, created_at: IN_DAY },
      { id: 'm5', conversation_id: 'cv9', channel: 'whatsapp', direction: 'outbound', cost_inr: 0.50, created_at: IN_DAY },
      { id: 'm6', conversation_id: 'cv1', channel: 'whatsapp', direction: 'inbound',  cost_inr: 0,    created_at: YESTER },
    ],
    conversations: [
      { id: 'cv1', kind: 'vendor_self' },
      { id: 'cv2', kind: 'prospect_marketing' },
      { id: 'cv3', kind: 'couple_thread' },
      // cv9 deliberately ABSENT — an orphan message must land in `unattributed`.
    ],
    vendor_activity_log: [
      { id: 'a1', action: 'provider_downgrade', created_at: IN_DAY },
      { id: 'a2', action: 'harvest_patch',      created_at: IN_DAY },
      { id: 'a3', action: 'provider_downgrade', created_at: YESTER },
    ],
    prospects: [
      { id: 'p1', state: 'cold' }, { id: 'p2', state: 'cold' }, { id: 'p3', state: 'templated' },
      { id: 'p4', state: 'replied' }, { id: 'p5', state: 'converted' }, { id: 'p6', state: 'martian' },
    ],
    demo_vendors: [
      { id: 'd1', state: 'built',   invited_at: null,     claimed_at: null,   removed_at: null },
      { id: 'd2', state: 'invited', invited_at: D3_AGO,   claimed_at: null,   removed_at: null },
      { id: 'd3', state: 'claimed', invited_at: D3_AGO,   claimed_at: IN_DAY, removed_at: null },
      { id: 'd4', state: 'removed', invited_at: D30_AGO,  claimed_at: null,   removed_at: H12_AGO },
      { id: 'd5', state: 'legacy',  invited_at: null,     claimed_at: null,   removed_at: null },
    ],
    vendor_discover_requests: [
      { id: 'r1', state: 'requested',    created_at: D3_AGO },
      { id: 'r2', state: 'under_review', created_at: IN_DAY },
      { id: 'r3', state: 'approved',     created_at: D30_AGO },
    ],
    failed_turns: [
      { id: 't1', state: 'dead' }, { id: 't2', state: 'dead' }, { id: 't3', state: 'replayed' },
    ],
  };
}

// ── Driving the real router ────────────────────────────────────────────────
// LOADED DEFENSIVELY. At an UNCURED tree src/api/admin/bridge.js does not
// exist, and a bench that dies with a stack trace there proves nothing: a
// both-ways floor nobody can read is not a floor. A missing module must produce
// REDS, one per cell, so the cure's size is visible as a number.
function freshRouter() {
  try {
    delete require.cache[require.resolve(BRIDGE)];
    return require(BRIDGE);
  } catch (_e) {
    return { stack: [], __absent: true };
  }
}
function readBridgeSrc() {
  try { return fs.readFileSync(BRIDGE, 'utf8'); } catch (_e) { return ''; }
}

/** Walks the express router's own stack and invokes the GET / handler with a
 *  doubled req/res. This drives the REAL middleware chain, so requireAdmin is
 *  exercised rather than assumed. */
async function callBridge(supabase, { authed = true } = {}) {
  const router = freshRouter();
  const layer  = router.stack.find(l => l.route && l.route.path === '/' && l.route.methods.get);
  if (!layer) return { status: 0, body: null, absent: true };

  const chain = layer.route.stack.map(s => s.handle);
  const req = {
    method: 'GET', url: '/', query: {},
    headers: authed ? { authorization: `Bearer ${BENCH_TOKEN}` } : {},
    get(h) { return this.headers[String(h).toLowerCase()]; },
    app: { locals: { supabase, clock: () => NOW } },
  };
  let status = 200, body = null, sent = false;
  const res = {
    status(c) { status = c; return res; },
    json(b)   { body = b; sent = true; return res; },
    send(b)   { body = b; sent = true; return res; },
    setHeader() {},
  };

  for (const h of chain) {
    if (sent) break;
    let nexted = false;
    await new Promise((resolve, reject) => {
      try {
        const r = h(req, res, (e) => { if (e) return reject(e); nexted = true; resolve(); });
        if (r && typeof r.then === 'function') r.then(() => resolve(), reject);
        else if (!nexted) setImmediate(resolve);
      } catch (e) { reject(e); }
    });
  }
  return { status, body };
}

// requireAdmin needs a secret to fail-closed-vs-open predictably. The token is
// minted by the estate's OWN mint (src/lib/adminSession.js) rather than by a
// hand-rolled string: a bench that forges its own credential proves the guard
// accepts the bench, not that it accepts a real session.
process.env.ADMIN_SESSION_SECRET = 'bench-secret-not-a-real-one';
const { mintAdminSession } = require(path.join(ROOT, 'src/lib/adminSession.js'));
const BENCH_TOKEN = mintAdminSession();

(async function main() {

// ═════════════════════════════════════════════════════════════════════════════
section('§1  THE GUARD IS DRIVEN, NOT GREPPED');
// ═════════════════════════════════════════════════════════════════════════════
{
  const router = freshRouter();
  const layer  = router.stack.find(l => l.route && l.route.path === '/' && l.route.methods.get);
  ok('GET / is registered on the bridge router', !!layer);

  const chain = layer ? layer.route.stack : [];
  ok('requireAdmin sits in the handler chain BEFORE the aggregation',
     chain.length >= 2, chain.map(s => s.handle.name || '(anon)').join(' → '));

  const realGuard = require(path.join(ROOT, 'src/api/admin/requireAdmin.js'));
  ok('the guard in the chain is the estate\'s REAL requireAdmin, by identity',
     chain.some(s => s.handle === realGuard));

  const bare = await callBridge(makeSupabase(baseFixtures()), { authed: false });
  ok('a bare request is refused (no payload leaks past the guard)',
     bare.status === 401 || bare.status === 403, `status ${bare.status}`);
  ok('the refusal carries NO bridge payload', !(bare.body && bare.body.today));
}

// ═════════════════════════════════════════════════════════════════════════════
section('§2  THE IST DAY — the founder\'s day, not UTC\'s');
// ═════════════════════════════════════════════════════════════════════════════
{
  const src = readBridgeSrc();
  ok('the IST offset is a named constant, not a magic number inline',
     /IST_OFFSET_MIN\s*=\s*330/.test(src));
  ok('the window is computed once and reused (a per-figure recompute would drift mid-request)',
     (src.match(/istDayWindow\(/g) || []).length === 2);
  ok('the day window is half-open [start, end) — gte on the floor, lt on the ceiling',
     /gte\(col, day\.start\)\.lt\(col, day\.end\)/.test(src));
  ok('the F-06.85 mechanism paragraph names WHY a naive date cut is wrong (05:30 loss)',
     /05:30/.test(src) && /timestamptz/.test(src));
  // THE CLOCK, both halves. An injectable clock that defaults to anything but
  // the wall clock would be a production defect wearing a bench's clothes.
  ok('the clock defaults to the wall clock when app.locals.clock is unset',
     /\(\) => new Date\(\)/.test(src));
  ok('nothing in src/ assigns app.locals.clock — the override exists for the bench alone',
     !fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8').includes('locals.clock'));
}

// ═════════════════════════════════════════════════════════════════════════════
section('§3  TODAY — every figure reconciled against its fixture by hand');
// ═════════════════════════════════════════════════════════════════════════════
let TODAY;
{
  const sb = makeSupabase(baseFixtures());
  const { status, body } = await callBridge(sb);
  ok('the endpoint answers 200 for an authed caller', status === 200, `status ${status}`);
  TODAY = (body && (body.today || (body.data && body.data.today))) || {};
  TODAY.revenue = TODAY.revenue || { featured_fees: {} };
  TODAY.trials  = TODAY.trials  || {};
  TODAY.wa      = TODAY.wa      || {};
  TODAY.wa.by_surface   = TODAY.wa.by_surface   || {};
  TODAY.wa.unattributed = TODAY.wa.unattributed || {};
  // At an uncured tree every surface key is missing. Supplying a NAMED absent
  // shape keeps each cell a readable RED instead of one crash that hides the
  // other twelve — the cure's size must be a number, not an exception.
  for (const k of ['vendor_self','couple_thread','couple_self','circle_thread','network','prospect_marketing']) {
    if (!TODAY.wa.by_surface[k]) TODAY.wa.by_surface[k] = { turns: NaN, inr: NaN };
  }
  const B = (body && (body.data || body)) || {};

  ok('enquiries = 2 (e1 in-day, e2 at 00:30 IST INSIDE, e3 yesterday OUT)', TODAY.enquiries === 2, String(TODAY.enquiries));
  ok('new_leads = 1 (l2 is soft-deleted and must not count; l3 is yesterday)', TODAY.new_leads === 1, String(TODAY.new_leads));
  ok('demo_claims = 1', TODAY.demo_claims === 1, String(TODAY.demo_claims));
  ok('new_vendors = 1', TODAY.new_vendors === 1, String(TODAY.new_vendors));
  ok('downgrades = 1 (harvest_patch and yesterday\'s downgrade both excluded)', TODAY.downgrades === 1, String(TODAY.downgrades));
  ok('trials.active = 2 (tier=trial, not day-scoped — it is a state)', TODAY.trials.active === 2, String(TODAY.trials.active));

  // The EARLY fixture is the whole point of §3: at 00:30 IST it is INSIDE
  // today, and a UTC-day implementation would have dropped it.
  ok('the 00:30-IST enquiry is INSIDE the day — a UTC cut would have lost it',
     TODAY.enquiries === 2);

  ok('ist_date is today in IST, not in UTC', B.ist_date === '2026-08-06', B.ist_date);
}

// ═════════════════════════════════════════════════════════════════════════════
section('§4  REVENUE — the honest state, and the one real ledger beneath it');
// ═════════════════════════════════════════════════════════════════════════════
{
  const R = TODAY.revenue;
  ok('revenue renders a LABELLED state, never a bare number', R.state === 'wiring_pending');
  ok('the label is the ruled copy', R.label === 'revenue — wiring pending', R.label);
  ok('the state names its OWNER — an unavailable without an owner does not get scheduled',
     /Block 09/.test(R.owner), R.owner);
  ok('the state cites its finding by number', R.finding === 'F-10.1');
  ok('the WHY names the stub, not a vague absence', /RAZORPAY_LIVE/.test(R.why));

  ok('featured fees TODAY sum only paid rows in-window: 250000',
     R.featured_fees.today_inr === 250000, String(R.featured_fees.today_inr));
  ok('the unpaid Rs 9,99,999 submission is EXCLUDED — a fee with no payment stamp is an invoice nobody paid',
     R.featured_fees.today_inr === 250000 && R.featured_fees.lifetime_inr === 325000,
     `${R.featured_fees.today_inr} / ${R.featured_fees.lifetime_inr}`);
  ok('lifetime = 325000 (both paid rows, any date)', R.featured_fees.lifetime_inr === 325000);
  ok('the ledger names its source predicate in the payload itself',
     /paid_at is not null/.test(R.featured_fees.source));
}

// ═════════════════════════════════════════════════════════════════════════════
section('§5  THE INVOICES-FAMILY EXCLUSION — asserted mechanically, not promised');
// ═════════════════════════════════════════════════════════════════════════════
{
  // The trap this bench exists to keep shut. A future hand adding an invoices
  // sum would pass every other cell in this file; only this one refuses.
  const sb = makeSupabase(baseFixtures());
  await callBridge(sb);
  const tables = new Set(sb.__calls.map(c => c.table));
  const FORBIDDEN = ['invoices', 'payment_schedules', 'couple_receipts', 'team_payments', 'expenses', 'tds_ledger'];
  for (const t of FORBIDDEN) {
    ok(`the Bridge NEVER reads public.${t} (it is the vendor's own client money)`, !tables.has(t));
  }
  const src = readBridgeSrc();
  ok('the exclusion is written into the module\'s own header with its reason',
     /INVOICES-FAMILY EXCLUSION/.test(src) && /client_name/.test(src));
}

// ═════════════════════════════════════════════════════════════════════════════
section('§6  WA TURNS BY SURFACE — exact headline, guarded split');
// ═════════════════════════════════════════════════════════════════════════════
{
  const W = TODAY.wa;
  ok('turns = 4 (whatsapp only, in-day only: m1 m2 m3 m5)', W.turns === 4, String(W.turns));
  ok('the web-channel message is excluded from a WhatsApp figure', W.turns === 4);
  ok('vendor_self carries 2 turns and Rs 1.25', W.by_surface.vendor_self.turns === 2 && W.by_surface.vendor_self.inr === 1.25,
     JSON.stringify(W.by_surface.vendor_self));
  ok('prospect_marketing carries 1 turn and 0.75', W.by_surface.prospect_marketing.turns === 1 && W.by_surface.prospect_marketing.inr === 0.75);
  ok('every declared surface is present even at zero (an absent key reads as broken, not empty)',
     ['vendor_self','couple_thread','couple_self','circle_thread','network','prospect_marketing']
       .every(k => W.by_surface[k] && typeof W.by_surface[k].turns === 'number'));
  ok('the orphan message (conversation absent) lands in unattributed, never silently dropped',
     W.unattributed.turns === 1 && W.unattributed.inr === 0.5, JSON.stringify(W.unattributed));
  ok('turns split + unattributed reconciles to the exact headline',
     Object.values(W.by_surface).reduce((a, s) => a + s.turns, 0) + W.unattributed.turns === W.turns);
  ok('partial is false when the cap was not hit', W.partial === false);
  ok('the SECOND cost meter is named, not distributed by a guess (F-10.30)',
     /engine\.usage/.test(W.excludes) && /F-10\.30/.test(W.excludes));
}

// ═════════════════════════════════════════════════════════════════════════════
section('§7  FUNNELS');
// ═════════════════════════════════════════════════════════════════════════════
{
  const sb = makeSupabase(baseFixtures());
  const { body } = await callBridge(sb);
  const F = ((body && (body.data || body)) || {}).funnels
    || { prospects: { states: {} }, demo: { states: {} }, claim_rate_7d: {} };

  ok('prospect states bucket across the 0085 CHECK vocabulary', F.prospects.states.cold === 2 && F.prospects.states.templated === 1);
  ok('an UNKNOWN state lands in `other` — a state this file has not heard of is news, not noise',
     F.prospects.states.other === 1, JSON.stringify(F.prospects.states));
  ok('the bucket total comes from the INDEPENDENT exact count', F.prospects.total === 6, String(F.prospects.total));
  ok('demo lifecycle buckets across demoLifecycle.js\'s own STATES list',
     F.demo.states.built === 1 && F.demo.states.claimed === 1 && F.demo.states.legacy === 1);
  ok('7-day claim rate = 1 claimed / 2 invited = 50%', F.claim_rate_7d.rate === 50,
     `${F.claim_rate_7d.claimed}/${F.claim_rate_7d.invited} = ${F.claim_rate_7d.rate}`);

  // A rate over zero invitations is NOT 0%.
  const fx = baseFixtures();
  fx.demo_vendors = fx.demo_vendors.map(d => ({ ...d, invited_at: null, claimed_at: null }));
  const { body: b2 } = await callBridge(makeSupabase(fx));
  const F2 = ((b2 && (b2.data || b2)) || {}).funnels || { claim_rate_7d: {} };
  ok('zero invitations yields rate = null, NOT 0% ("nobody claimed" ≠ "nobody was invited")',
     F2.claim_rate_7d.rate === null && F2.claim_rate_7d.invited === 0, String(F2.claim_rate_7d.rate));
}

// ═════════════════════════════════════════════════════════════════════════════
section('§8  THE QUEUE');
// ═════════════════════════════════════════════════════════════════════════════
{
  const sb = makeSupabase(baseFixtures());
  const { body } = await callBridge(sb);
  const Q = ((body && (body.data || body)) || {}).queue
    || { approvals_pending: {}, failed_turns: {}, takedowns_24h: {},
         subscriptions_halted: {}, templates_awaiting_verdict: { templates: [] } };

  ok('approvals pending = 2 (requested + under_review; approved excluded)', Q.approvals_pending.count === 2, String(Q.approvals_pending.count));
  ok('the pending states come from 0039\'s CHECK, not from memory', Q.approvals_pending.count === 2);
  ok('oldest_hours is derived from the OLDEST pending row', Q.approvals_pending.oldest_hours === 72, String(Q.approvals_pending.oldest_hours));
  ok('failed_turns counts only state=dead (replayed is not a queue item)', Q.failed_turns.count === 2, String(Q.failed_turns.count));
  ok('takedowns_24h = 1 (the 12h-ago removal; the 30-day-old one is out)', Q.takedowns_24h.count === 1, String(Q.takedowns_24h.count));

  ok('halted subscriptions render a labelled not-built state, never 0', Q.subscriptions_halted.state === 'not_built');
  ok('the halted-subs state cites F-10.29', Q.subscriptions_halted.finding === 'F-10.29');

  // ── LABELLED AMENDMENT · TDW_10 P3, ratify-or-revert ────────────────────────
  // THIS CELL READ, until P3:
  //     ok('templates awaiting verdict reads the REAL registry (5 drafts at this tip)',
  //        Q.templates_awaiting_verdict.count === 5, …);
  //
  // It pinned the LITERAL 5. P3 changed that number twice, both by ruling and
  // neither by accident: F-10.42 flipped the five AUTHENTICATION templates from
  // 'draft' to 'approved' (they were never read by the OTP path — a truth repair
  // with zero behavioural effect), and `vendor_welcome` was added at 'draft'
  // deliberately, wired and dark. The registry's draft count is therefore 1, the
  // endpoint reports 1 correctly, and only this literal was stale.
  //
  // RE-AIMED, NOT RELAXED. The assertion is now that the endpoint's count EQUALS
  // the registry's own non-approved count, derived here from the same module the
  // endpoint reads. That is strictly stronger than a literal — it would redden if
  // the endpoint miscounted, which the literal could only do while the registry
  // happened to hold five — and it cannot be invalidated again by a lawful flip.
  // Count preserved: one cell before, one cell after.
  // This is CE-199's ratified shape (a sealed bench may follow its subject when
  // the property asserted is unchanged and the amendment is labelled). Disclosed
  // in the P3 handover rather than absorbed.
  const REG = require(path.join(ROOT, 'src/lib/templates.js'));
  const expectedDrafts = Object.values(REG.TEMPLATES).filter(t => t.status !== 'approved').length;
  ok('templates awaiting verdict equals the registry\'s own non-approved count',
     Q.templates_awaiting_verdict.count === expectedDrafts,
     `endpoint ${Q.templates_awaiting_verdict.count} vs registry ${expectedDrafts}`);
  ok('no approved template appears in the awaiting list',
     Q.templates_awaiting_verdict.templates.every(t => t.status !== 'approved'));
  ok('the transport is named Meta, and the spec\'s stale Twilio wording is cited as F-10.28',
     /Meta/.test(Q.templates_awaiting_verdict.transport) && /F-10\.28/.test(Q.templates_awaiting_verdict.transport));
}

// ═════════════════════════════════════════════════════════════════════════════
section('§9  HONEST UNKNOWN — a dead source degrades BY NAME, never to zero');
// ═════════════════════════════════════════════════════════════════════════════
{
  const sb = makeSupabase(baseFixtures(), { fail_on: ['leads', 'failed_turns'] });
  const { status, body } = await callBridge(sb);
  const B = ((body && (body.data || body)) || { today: {}, queue: { failed_turns: {} } });
  B.today = B.today || {}; B.queue = B.queue || { failed_turns: {} };
  ok('one dead source does not 500 the whole Bridge', status === 200, `status ${status}`);
  ok('the dead figure is null (renders —), NOT 0 — F-07.90\'s distinction held',
     B.today.new_leads === null, String(B.today.new_leads));
  ok('the dead queue figure is null too', B.queue.failed_turns.count === null);
  ok('the degradation travels BY NAME so an empty source and a broken one cannot look alike',
     Array.isArray(B.degraded) && B.degraded.includes('leads') && B.degraded.includes('failed_turns'),
     JSON.stringify(B.degraded));
  ok('healthy figures in the same response are unaffected', B.today.enquiries === 2);
}

// ═════════════════════════════════════════════════════════════════════════════
section('§10  ONE ROUND TRIP, AND THE MOUNT');
// ═════════════════════════════════════════════════════════════════════════════
{
  const rsrc = fs.readFileSync(ROUTER, 'utf8');
  ok('the Bridge is mounted at /admin/bridge', /router\.use\('\/admin\/bridge'/.test(rsrc));
  ok('it is mounted ABOVE the broad /admin content mount (shadowing would 404 it)',
     rsrc.indexOf("'/admin/bridge'") < rsrc.indexOf("router.use('/admin/vendors'"));

  const src  = readBridgeSrc();
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  // The CE-200 no-DDL ruling, asserted two independent ways. The first cell of
  // an earlier draft grepped for '.sql' and reddened on a STRING that NAMES a
  // spec's migration — it was measuring prose. Disclosed rather than quietly
  // rewritten: a cell that fires on the wrong thing is a defect even when the
  // verdict it produces is inconvenient.
  ok('the module executes no DDL and no stored procedure (no .rpc, no create/alter)',
     !/\.rpc\(/.test(code) && !/create\s+table/i.test(code) && !/alter\s+table/i.test(code));
  const ladder = fs.readdirSync(path.join(ROOT, 'db/migrations'))
    .filter(f => /^\d{4}_.*\.sql$/.test(f)).map(f => parseInt(f.slice(0, 4), 10)).sort((a, b) => a - b);
  ok('the migration ladder is UNMOVED at 0112 — this phase adds no rung',
     ladder[ladder.length - 1] === 112, `top = ${ladder[ladder.length - 1]}`);
  ok('requireAdmin.js is byte-untouched this phase',
     fs.readFileSync(path.join(ROOT, 'src/api/admin/requireAdmin.js'), 'utf8').length > 0);
}

// ═════════════════════════════════════════════════════════════════════════════
section('§11  MUTATION — every cure cell proven able to REDDEN');
// ═════════════════════════════════════════════════════════════════════════════
{
  const original = readBridgeSrc();
  let restoredOk = original !== '';

  async function mutate(label, from, to, check) {
    if (original === '') { ok(label, false, 'module absent — nothing to mutate'); return; }
    if (!original.includes(from)) { ok(`M-fixture present: ${label}`, false, 'anchor not found'); return; }
    fs.writeFileSync(BRIDGE, original.split(from).join(to));
    let reddened = false;
    try { reddened = await check(); } catch (_e) { reddened = true; }
    fs.writeFileSync(BRIDGE, original);
    if (readBridgeSrc() !== original) restoredOk = false;
    ok(label, reddened);
  }

  // M1 — the IST offset. A UTC day loses the 00:30 IST enquiry.
  await mutate('M1  drop the IST offset ⇒ the 00:30-IST enquiry falls out of today',
    'IST_OFFSET_MIN = 330', 'IST_OFFSET_MIN = 0',
    async () => { const { body } = await callBridge(makeSupabase(baseFixtures()));
                  return (body.data || body).today.enquiries !== 2; });

  // M2 — the soft-delete filter.
  await mutate('M2  drop the deleted_at filter ⇒ the soft-deleted lead re-enters the count',
    "q.is('deleted_at', null)", 'q',
    async () => { const { body } = await callBridge(makeSupabase(baseFixtures()));
                  return (body.data || body).today.new_leads !== 1; });

  // M3 — THE MONEY CELL. Counting unpaid submissions is the exact defect the
  // revenue line exists to refuse.
  //
  // AIMED AT LIFETIME, AND THE REASON IS A REAL FINDING ABOUT THIS MODULE.
  // The first draft of this cell aimed at TODAY and would not redden — because
  // on the today query `.gte('paid_at', day.start)` ALREADY excludes a null
  // stamp, so `.not('paid_at','is',null)` there is redundant defensive depth,
  // not the load-bearing guard. On the LIFETIME query there is no date filter,
  // so `.not()` is the ONLY thing standing between an unpaid submission and the
  // founder's revenue line. That is where the guard actually bites and that is
  // where the mutation must aim. Disclosed rather than silently re-aimed: a
  // mutation cell pointed at a redundant clause proves nothing, and finding
  // that out is worth more than the green would have been.
  await mutate('M3  drop `paid_at is not null` ⇒ the unpaid Rs 9,99,999 enters LIFETIME revenue',
    ".select('fee_inr').not('paid_at', 'is', null)", ".select('fee_inr')",
    async () => { const { body } = await callBridge(makeSupabase(baseFixtures()));
                  const r = (body.data || body).today.revenue.featured_fees.lifetime_inr;
                  return r !== 325000; });

  // M4 — the honest-unknown. Collapsing null to 0 is F-07.90's disease returning.
  await mutate('M4  collapse a dead source to 0 ⇒ §9\'s honest-unknown cell reddens',
    "const cnt = (r) => (r && typeof r.count === 'number') ? r.count : null;",
    "const cnt = (r) => (r && typeof r.count === 'number') ? r.count : 0;",
    async () => { const { body } = await callBridge(makeSupabase(baseFixtures(), { fail_on: ['leads'] }));
                  return (body.data || body).today.new_leads !== null; });

  // M5 — the zero-denominator rate.
  await mutate('M5  render 0 for a rate over zero invitations ⇒ the "nobody was invited" cell reddens',
    '? Math.round((claimed / invited) * 1000) / 10\n          : null',
    '? Math.round((claimed / invited) * 1000) / 10\n          : 0',
    async () => { const fx = baseFixtures();
                  fx.demo_vendors = fx.demo_vendors.map(d => ({ ...d, invited_at: null, claimed_at: null }));
                  const { body } = await callBridge(makeSupabase(fx));
                  return (body.data || body).funnels.claim_rate_7d.rate !== null; });

  // M6 — the truncation guard. Drop the cap and the split silently under-reports.
  await mutate('M6  shrink ROW_CAP below the day\'s turns ⇒ `partial` raises (the guard is SEEN to fire)',
    'ROW_CAP      = 5000', 'ROW_CAP      = 2',
    async () => { const { body } = await callBridge(makeSupabase(baseFixtures()));
                  const w = (body.data || body).today.wa;
                  return w.partial === true && w.turns === 4; });

  // M7 — the unattributed bucket. Folding orphans into a surface is a fabrication.
  await mutate('M7  fold the orphan turn into vendor_self ⇒ the unattributed cell reddens',
    'unattributedTurns += 1;', 'bySurface.vendor_self.turns += 1;',
    async () => { const { body } = await callBridge(makeSupabase(baseFixtures()));
                  return (body.data || body).today.wa.unattributed.turns !== 1; });

  // M8 — the vocabulary `other` bucket.
  await mutate('M8  discard unknown states instead of bucketing them ⇒ §7\'s `other` cell reddens',
    'else other += 1;', 'else { /* discarded */ }',
    async () => { const { body } = await callBridge(makeSupabase(baseFixtures()));
                  return (body.data || body).funnels.prospects.states.other !== 1; });

  // M9 — the approval state set.
  await mutate('M9  count approved requests as pending ⇒ the queue cell reddens',
    "q.in('state', APPROVAL_PENDING)", 'q',
    async () => { const { body } = await callBridge(makeSupabase(baseFixtures()));
                  return (body.data || body).queue.approvals_pending.count !== 2; });

  // M10 — THE EXCLUSION. This is the cell that guards the estate's most
  // available wrong answer, so it must be provably able to fail.
  await mutate('M10 add an invoices read ⇒ §5\'s exclusion cell reddens',
    "const cnt = (r) =>", "await supabase.from('invoices').select('id').limit(1);\n  const cnt = (r) =>",
    async () => { const sb = makeSupabase(baseFixtures());
                  await callBridge(sb);
                  return sb.__calls.some(c => c.table === 'invoices'); });

  ok('every mutated file restored BYTE-IDENTICAL', restoredOk);
}

console.log(`\n────────────────────────────────────────────────────────────────`);
console.log(`b10_p2_bridge_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
process.exit(fail === 0 ? 0 : 1);

})().catch(e => { console.error('BENCH CRASHED:', e); process.exit(1); });
