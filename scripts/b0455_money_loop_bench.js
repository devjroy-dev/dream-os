#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b0455_money_loop_bench.js — TDW_04.5 P5, THE MONEY LOOP.
//
//   node scripts/b0455_money_loop_bench.js
//
// WHAT IT DRIVES: the REAL src/api/vendor/studio/payments.js and the REAL
// src/api/vendor/collab.js routers, mounted in a REAL express app over a REAL
// http listener, plus the REAL src/lib/vendor/binderTitles.js one home. Nothing
// under test is stubbed. Two doubles, both transport-only: the supabase client
// (in-memory, honouring the chain the routers actually use — including
// `.schema('engine')` and `.contains()`), and the three auth middlewares by
// require-cache injection, so the routers are byte-untouched.
//
// THE SECTIONS, against acceptance item 7 + the kickoff's §6 proof list:
//   §1  the stub writes team_payments carrying `collab:<post_id>` VERBATIM
//   §2  F-04.116 — the note SURVIVES mark-paid (the cure, both directions)
//   §3  the By-wedding grouping's subtotal ARITHMETIC, asserted against
//       fixture rows the way the founder counts them on screen
//   §4  the loose lane (E1) — every lawful road into it, R2's included
//   §5  the auto-suggest COMPUTES (per-function, founder-ruled) and NEVER
//       COMMITS — the DB is re-read after every call and must be unmoved
//   §6  absent-honesty — no_rate · no_wedding · not_assigned, never a zero
//   §7  A3 — connect's response carries `roster_id`; THE BOTH-SIDES CLAUSE:
//       this bench drives the NEW shape, and the boolean-only assert that
//       would have passed before is RETIRED, not retained
//   §8  D1 — the extracted hop is ONE home: bands and payments resolve the
//       same binder to the same title from the same fixture
//
// BOTH-WAYS (non-vacuous by PRODUCTION mutation, never test setup). Each is a
// real edit to a shipped file, reverted after; RED counts in the handover:
//   §2  restore `notes: notes || null` in payments.js's mark-paid
//   §3  let the subtotal count cancelled-state PAYMENTS (`in` filter dropped)
//   §4  send binder-less functions to a wedding instead of the loose lane
//   §5  make the suggestion COUNT DISTINCT event_date (the struck unit)
//   §6  return `amount_inr: 0` instead of a null suggestion
//   §7  drop `roster_id` from the connect response
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const http = require('http');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
const ok = (label, cond) => {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else      { fail++; console.log(`  FAIL  ${label}`); }
};
const section = (t) => console.log(`\n── ${t} ──`);

// ── the supabase double ─────────────────────────────────────────────────────
function makeDb(seed = {}) {
  const tables = {
    vendors: [], events: [], team_members: [], team_payments: [],
    collab_posts: [], collab_responses: [], collab_post_items: [],
    vendor_roster: [], admin_config: [], expenses: [],
    'engine.records': [],
    ...seed,
  };
  let uid = 0;
  const nextId = (p) => `${p}-${++uid}`;

  function makeFrom(prefix) {
    return function from(table) {
      const key  = prefix + table;
      const rows = tables[key] || (tables[key] = []);
      const q = { _f: [], _order: null };

      const matched = () => {
        let out = rows.filter(r => q._f.every(f => f(r)));
        if (q._order) {
          const { col, asc } = q._order;
          out = out.slice().sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
        }
        return out;
      };

      q.select = () => q;
      q.eq   = (c, v) => { q._f.push(r => r[c] === v); return q; };
      q.neq  = (c, v) => { q._f.push(r => r[c] !== v); return q; };
      q.is   = (c, v) => { q._f.push(r => (r[c] ?? null) === v); return q; };
      q.gte  = (c, v) => { q._f.push(r => r[c] >= v); return q; };
      q.lte  = (c, v) => { q._f.push(r => r[c] <= v); return q; };
      q.gt   = (c, v) => { q._f.push(r => r[c] > v); return q; };
      q.lt   = (c, v) => { q._f.push(r => r[c] < v); return q; };
      q.in   = (c, vs) => { q._f.push(r => vs.includes(r[c])); return q; };
      q.not  = (c, op, v) => {
        if (op === 'is' && v === null) q._f.push(r => (r[c] ?? null) !== null);
        else q._f.push(r => r[c] !== v);
        return q;
      };
      // postgres array containment — the predicate the suggestion counts with.
      q.contains = (c, vs) => {
        q._f.push(r => Array.isArray(r[c]) && vs.every(v => r[c].includes(v)));
        return q;
      };
      q.order = (col, o) => { q._order = { col, asc: !!(o && o.ascending) }; return q; };
      q.limit = (n) => { q._limit = n; return q; };

      const settle = (many) => {
        const rows_ = matched();
        return { data: many ? (q._limit ? rows_.slice(0, q._limit) : rows_) : (rows_[0] || null), error: null };
      };
      q.maybeSingle = async () => settle(false);
      q.single      = async () => settle(false);
      q.then        = (resolve, reject) => Promise.resolve(settle(true)).then(resolve, reject);

      q.insert = (payload) => {
        const list = Array.isArray(payload) ? payload : [payload];
        const made = list.map(p => {
          const row = { id: nextId(table), notes: null, description: null,
                        linked_event_id: null, linked_task_id: null,
                        paid_at: null, paid_via: null,
                        created_at: new Date(Date.now() + (uid * 1000)).toISOString(), ...p };
          rows.push(row); return row;
        });
        const res1 = { data: Array.isArray(payload) ? made : made[0], error: null };
        const done = { select: () => done, single: async () => res1, maybeSingle: async () => res1,
                       then: (r, j) => Promise.resolve(res1).then(r, j) };
        return done;
      };

      q.upsert = (payload, opts) => {
        const keys = (opts && opts.onConflict ? opts.onConflict.split(',') : ['id']).map(s => s.trim());
        const hit = rows.find(r => keys.every(k => r[k] === payload[k]));
        let res1;
        if (hit) { Object.assign(hit, payload); res1 = { data: hit, error: null }; }
        else { const row = { id: nextId(table), ...payload }; rows.push(row); res1 = { data: row, error: null }; }
        const done = { select: () => done, maybeSingle: async () => res1, single: async () => res1,
                       then: (r, j) => Promise.resolve(res1).then(r, j) };
        return done;
      };

      q.update = (patch) => {
        const upd = { _f: [] };
        upd.eq = (c, v) => { upd._f.push(r => r[c] === v); return upd; };
        upd.is = (c, v) => { upd._f.push(r => (r[c] ?? null) === v); return upd; };
        upd.select = () => upd;
        const run = () => {
          const hits = rows.filter(r => upd._f.every(f => f(r)));
          hits.forEach(r => Object.assign(r, patch));
          return { data: hits[0] || null, error: hits.length ? null : { code: 'PGRST116', message: 'no rows' } };
        };
        upd.maybeSingle = async () => run();
        upd.single      = async () => run();
        upd.then = (r, j) => Promise.resolve(run()).then(r, j);
        return upd;
      };

      return q;
    };
  }

  return {
    from: makeFrom(''),
    schema: (s) => ({ from: makeFrom(s + '.') }),
    _tables: tables,
  };
}

// ── mount the REAL routers ──────────────────────────────────────────────────
function stubMiddleware(vendorId) {
  const files = {
    'src/api/middleware/requireAuth.js':
      (req, res, next) => { req.auth = { user_id: 'u-1' }; next(); },
    'src/api/middleware/resolveVendor.js':
      () => (req, res, next) => { req.vendor = { id: vendorId, tier: 'prestige', category: 'planning' }; next(); },
    'src/api/middleware/requirePrestige.js':
      (req, res, next) => next(),
    'src/api/middleware/agentBridge.js':
      { resolveAgentForVendor: async () => ({ agentId: 'agent-1' }) },
  };
  for (const [rel, exp] of Object.entries(files)) {
    const f = path.join(ROOT, rel);
    require.cache[require.resolve(f)] = { id: f, filename: f, loaded: true, exports: exp };
  }
}

async function serve(db, vendorId) {
  stubMiddleware(vendorId);
  for (const m of ['src/api/vendor/studio/payments.js', 'src/api/vendor/collab.js',
                   'src/api/vendor/bands.js', 'src/lib/vendor/binderTitles.js']) {
    delete require.cache[require.resolve(path.join(ROOT, m))];
  }
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.locals.supabase = db;
  app.use('/pay',    require(path.join(ROOT, 'src/api/vendor/studio/payments.js')));
  app.use('/collab', require(path.join(ROOT, 'src/api/vendor/collab.js')));
  app.use('/bands',  require(path.join(ROOT, 'src/api/vendor/bands.js')));
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const call = async (method, url, body) => {
    const r = await fetch(`http://127.0.0.1:${port}${url}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  return { call, close: () => new Promise(r => server.close(r)) };
}

// ── fixture ─────────────────────────────────────────────────────────────────
// Vera-era names, per the estate's fixture ledger.
const VEND = 'v-1', OTHER = 'v-2';
const BINDER_A = 'binder-malhotra', BINDER_B = 'binder-kapoor';
const M_SWATI = 'tm-swati', M_ISHAAN = 'tm-ishaan', M_EXTERNAL = 'tm-external';
const E_RECCE = 'ev-recce', E_SANGEET = 'ev-sangeet', E_MEHENDI = 'ev-mehendi';
const E_LOOSE = 'ev-loose', E_CANCELLED = 'ev-cancelled';
const POST_ID = 'post-1';

function seed() {
  return {
    vendors: [
      { id: VEND,  category: 'planning', city: 'Jaipur', tier: 'prestige', users: { phone: '+918757788550', name: 'Vera' } },
      { id: OTHER, category: 'photography', city: 'Jaipur', tier: 'signature', users: { phone: '+919000000002', name: 'Ishaan' } },
    ],
    team_members: [
      { id: M_SWATI,    vendor_id: VEND, name: 'Swati Rao',  role: 'makeup',          daily_rate_inr: 40000, active: true, deleted_at: null },
      { id: M_ISHAAN,   vendor_id: VEND, name: 'Ishaan Puri', role: 'second_shooter', daily_rate_inr: null,  active: true, deleted_at: null },
      { id: M_EXTERNAL, vendor_id: VEND, name: 'Nikita Sen', role: 'external_vendor', daily_rate_inr: 25000, active: true, deleted_at: null },
    ],
    events: [
      // The Malhotra wedding: Swati on THREE functions, two of them the SAME DAY.
      // That pair is the founder's unit ruling under test — per-function, not
      // per-calendar-day: an MUA does three makeups, not one day's work.
      { id: E_RECCE,   vendor_id: VEND, title: 'Malhotra recce',   event_date: '2026-08-10', slot: 'morning',   kind: 'recce',    state: 'upcoming', linked_binder_id: BINDER_A, deleted_at: null, assigned_member_ids: [M_SWATI] },
      { id: E_SANGEET, vendor_id: VEND, title: 'Malhotra sangeet', event_date: '2026-08-14', slot: 'evening',   kind: 'shoot',    state: 'upcoming', linked_binder_id: BINDER_A, deleted_at: null, assigned_member_ids: [M_SWATI, M_EXTERNAL] },
      { id: E_MEHENDI, vendor_id: VEND, title: 'Malhotra mehendi', event_date: '2026-08-14', slot: 'morning',   kind: 'ceremony', state: 'upcoming', linked_binder_id: BINDER_A, deleted_at: null, assigned_member_ids: [M_SWATI] },
      // A cancelled function of the Kapoor wedding — crew still owed.
      { id: E_CANCELLED, vendor_id: VEND, title: 'Kapoor haldi',   event_date: '2026-09-02', slot: 'morning',   kind: 'shoot',    state: 'cancelled', linked_binder_id: BINDER_B, deleted_at: null, assigned_member_ids: [M_ISHAAN] },
      // A function with no binder at all — R2's road to the loose lane.
      { id: E_LOOSE,   vendor_id: VEND, title: 'Walk-in shoot',    event_date: '2026-08-20', slot: 'afternoon', kind: 'shoot',    state: 'upcoming', linked_binder_id: null,      deleted_at: null, assigned_member_ids: [M_SWATI] },
    ],
    'engine.records': [
      { id: BINDER_A, agent_id: 'agent-1', client: 'Rhea Malhotra', amount: 500000, direction: 'in', amount_received: 200000, amount_pending: null },
      // BINDER_B deliberately has NO record: an unnameable wedding, title null.
    ],
    collab_posts: [
      { id: POST_ID, vendor_id: VEND, requirement_type: 'makeup', event_date: '2026-08-14',
        city: 'Jaipur', open_to_other_cities: false, budget_inr: 60000, payment_period: null,
        event_type: null, details: null, state: 'open',
        expires_at: '2026-12-01T00:00:00Z', created_at: '2026-07-01T00:00:00Z', first_look_until: null },
    ],
    collab_responses: [
      { id: 'resp-1', post_id: POST_ID, responder_vendor_id: OTHER, state: 'interested',
        contact_shared_at: null, created_at: '2026-07-02T00:00:00Z' },
    ],
    vendor_roster: [],
    team_payments: [],
  };
}

const NOTE = `collab:${POST_ID}`;

async function main() {
  // ═══ §1 — THE STUB WRITES team_payments WITH THE COLLAB NOTE VERBATIM ═════
  section('§1 the settlement stub lands in team_payments');
  {
    const db = makeDb(seed());
    const { call, close } = await serve(db, VEND);

    const r = await call('POST', '/pay/', {
      team_member_id:  M_EXTERNAL,
      amount_inr:      25000,
      description:     'Makeup — Malhotra sangeet',
      linked_event_id: E_SANGEET,
      notes:           NOTE,
    });
    ok('stub POST succeeds', r.status === 200 && r.body.ok === true);
    const row = db._tables.team_payments[0];
    ok('one team_payments row written', db._tables.team_payments.length === 1);
    ok('note carries collab:<post_id> VERBATIM', row.notes === NOTE);
    ok('note is greppable for the post id', String(row.notes).includes(POST_ID));
    ok('linked_event_id persisted from the picker', row.linked_event_id === E_SANGEET);
    ok('counterparty is the team_members row (P4.4 bridge)', row.team_member_id === M_EXTERNAL);
    ok('state is born owed', row.state === 'owed');
    ok('the amount is the vendor\'s, unmodified', row.amount_inr === 25000);

    // The chooser is dead (R4+R6): the stub has ONE shape. A settlement never
    // writes `expenses` directly — mark-paid's existing auto-create is the only
    // road into that ledger, so the two can never disagree.
    ok('the stub writes NO expenses row (the chooser is dead)', db._tables.expenses.length === 0);
    await close();
  }

  // ═══ §2 — F-04.116: THE NOTE SURVIVES MARK-PAID ══════════════════════════
  section('§2 F-04.116 — absent means unchanged');
  {
    const db = makeDb(seed());
    const { call, close } = await serve(db, VEND);
    await call('POST', '/pay/', { team_member_id: M_EXTERNAL, amount_inr: 25000, linked_event_id: E_SANGEET, notes: NOTE });
    const id = db._tables.team_payments[0].id;

    // The founder's own smoke path: Mark Paid, notes box untouched.
    const r = await call('PATCH', `/pay/${id}/mark-paid`, { paid_via: 'upi' });
    ok('mark-paid succeeds', r.status === 200 && r.body.ok === true);
    const row = db._tables.team_payments[0];
    ok('state flipped to paid', row.state === 'paid');
    ok('paid_via recorded', row.paid_via === 'upi');
    ok('THE COLLAB NOTE SURVIVED', row.notes === NOTE);
    ok('acceptance item 7 still greps after settlement', String(row.notes).includes(POST_ID));

    // An empty box is a blank input, not an instruction to erase a thread the
    // vendor cannot see.
    const db2 = makeDb(seed());
    const s2 = await serve(db2, VEND);
    await s2.call('POST', '/pay/', { team_member_id: M_EXTERNAL, amount_inr: 9000, notes: NOTE });
    const id2 = db2._tables.team_payments[0].id;
    await s2.call('PATCH', `/pay/${id2}/mark-paid`, { paid_via: 'cash', notes: '   ' });
    ok('a whitespace-only note does not erase', db2._tables.team_payments[0].notes === NOTE);
    await s2.close();

    // A note the vendor DOES type is still recorded — the cure adds, it does
    // not freeze the column.
    const db3 = makeDb(seed());
    const s3 = await serve(db3, VEND);
    await s3.call('POST', '/pay/', { team_member_id: M_EXTERNAL, amount_inr: 9000, notes: NOTE });
    const id3 = db3._tables.team_payments[0].id;
    await s3.call('PATCH', `/pay/${id3}/mark-paid`, { paid_via: 'cash', notes: 'Settled at the venue' });
    ok('a typed note IS written', db3._tables.team_payments[0].notes === 'Settled at the venue');
    await s3.close();
    await close();
  }

  // ═══ §3 — THE SUBTOTAL ARITHMETIC ════════════════════════════════════════
  section('§3 By wedding — the subtotals reconcile by hand');
  {
    const db = makeDb(seed());
    const { call, close } = await serve(db, VEND);

    // Four payments the founder can count on screen:
    //   Malhotra: 25,000 owed + 40,000 owed + 12,000 PAID
    //   Kapoor  : 18,000 owed (on a CANCELLED function — still owed)
    //   loose   :  7,000 owed (function with no binder)
    await call('POST', '/pay/', { team_member_id: M_EXTERNAL, amount_inr: 25000, linked_event_id: E_SANGEET, notes: NOTE });
    await call('POST', '/pay/', { team_member_id: M_SWATI,    amount_inr: 40000, linked_event_id: E_MEHENDI });
    await call('POST', '/pay/', { team_member_id: M_SWATI,    amount_inr: 12000, linked_event_id: E_RECCE });
    await call('POST', '/pay/', { team_member_id: M_ISHAAN,   amount_inr: 18000, linked_event_id: E_CANCELLED });
    await call('POST', '/pay/', { team_member_id: M_SWATI,    amount_inr:  7000, linked_event_id: E_LOOSE });
    const paidId = db._tables.team_payments.find(p => p.amount_inr === 12000).id;
    await call('PATCH', `/pay/${paidId}/mark-paid`, { paid_via: 'upi' });

    const r = await call('GET', '/pay/by-wedding');
    ok('by-wedding responds', r.status === 200 && r.body.ok === true);
    const byId = Object.fromEntries(r.body.weddings.map(w => [w.binder_id, w]));

    ok('two weddings grouped', r.body.weddings.length === 2);
    ok('Malhotra owed = 25000 + 40000 = 65000', byId[BINDER_A].owed_inr === 65000);
    ok('Malhotra paid = 12000', byId[BINDER_A].paid_inr === 12000);
    ok('Malhotra shows three lines to count', byId[BINDER_A].payments.length === 3);
    ok('the subtotal equals the sum of the lines on screen',
      byId[BINDER_A].owed_inr ===
      byId[BINDER_A].payments.filter(p => p.state === 'owed').reduce((s, p) => s + p.amount_inr, 0));
    ok('the wedding is NAMED from the one home', byId[BINDER_A].title === 'Rhea Malhotra');

    ok('Kapoor owed = 18000 — a CANCELLED function is still owed', byId[BINDER_B].owed_inr === 18000);
    ok('an unnameable wedding has a null title, never a guess', byId[BINDER_B].title === null);
    ok('its line carries the cancelled state honestly', byId[BINDER_B].payments[0].event_state === 'cancelled');

    ok('loose owed = 7000', r.body.loose.owed_inr === 7000);
    ok('totals reconcile: 65000 + 18000 + 7000 = 90000', r.body.total_owed_inr === 90000);
    ok('paid total = 12000', r.body.total_paid_inr === 12000);
    ok('every wedding subtotal + loose sums to the total',
      r.body.weddings.reduce((s, w) => s + w.owed_inr, 0) + r.body.loose.owed_inr === r.body.total_owed_inr);

    // A cancelled PAYMENT is not a debt and never joins a subtotal.
    const cancelId = db._tables.team_payments.find(p => p.amount_inr === 40000).id;
    await call('PATCH', `/pay/${cancelId}/cancel`);
    const r2 = await call('GET', '/pay/by-wedding');
    const a2 = r2.body.weddings.find(w => w.binder_id === BINDER_A);
    ok('a cancelled payment leaves the subtotal', a2.owed_inr === 25000);
    ok('and leaves the total', r2.body.total_owed_inr === 50000);
    // CAUGHT BY THE MUTATION TEST, NOT BY EYE: the two asserts above stayed
    // GREEN when the `state` filter was removed from the query, because the
    // subtotal helper filters by state a second time. The arithmetic was
    // covered; the LINES were not — and "reconciles by hand" means the vendor
    // counts rows, so a deleted payment still on screen is the whole defect.
    ok('a cancelled payment leaves the LINES the vendor counts', a2.payments.length === 2);
    ok('no cancelled row renders anywhere in the view',
      [...r2.body.weddings.flatMap(w => w.payments), ...r2.body.loose.payments]
        .every(p => p.state !== 'cancelled'));
    await close();
  }

  // ═══ §4 — THE LOOSE LANE, EVERY LAWFUL ROAD ══════════════════════════════
  section('§4 the loose lane (E1) — honest, not an error');
  {
    const db = makeDb(seed());
    const { call, close } = await serve(db, VEND);
    // (a) no linked_event_id at all — R2's default for every collab settlement
    //     where the vendor declines to pick a function.
    await call('POST', '/pay/', { team_member_id: M_EXTERNAL, amount_inr: 5000, notes: NOTE });
    // (b) a function with no binder
    await call('POST', '/pay/', { team_member_id: M_SWATI, amount_inr: 6000, linked_event_id: E_LOOSE });
    // (c) a function belonging to somebody else — must not reach across tenancy
    db._tables.events.push({ id: 'ev-foreign', vendor_id: OTHER, title: 'Not yours',
      event_date: '2026-08-01', slot: 'morning', kind: 'shoot', state: 'upcoming',
      linked_binder_id: BINDER_A, deleted_at: null, assigned_member_ids: [] });
    await call('POST', '/pay/', { team_member_id: M_SWATI, amount_inr: 4000, linked_event_id: 'ev-foreign' });

    const r = await call('GET', '/pay/by-wedding');
    ok('no wedding is invented from any of the three', r.body.weddings.length === 0);
    ok('all three land in the loose lane', r.body.loose.payments.length === 3);
    ok('loose subtotal = 5000 + 6000 + 4000 = 15000', r.body.loose.owed_inr === 15000);
    ok('the collab note rides into the loose lane intact',
      r.body.loose.payments.some(p => p.notes === NOTE));
    ok('a foreign function resolves to no title rather than another tenant\'s',
      r.body.loose.payments.find(p => p.amount_inr === 4000).event_title === null);
    ok('an unlinked payment reports no event date', 
      r.body.loose.payments.find(p => p.amount_inr === 5000).event_date === null);
    await close();
  }

  // ═══ §5 — THE SUGGESTION COMPUTES, AND NEVER COMMITS ═════════════════════
  section('§5 suggest-never-commit (F1 + the founder\'s per-function unit)');
  {
    const db = makeDb(seed());
    const { call, close } = await serve(db, VEND);
    const before = JSON.stringify(db._tables.team_payments);

    const r = await call('GET', `/pay/suggest?team_member_id=${M_SWATI}&linked_event_id=${E_SANGEET}`);
    ok('suggest responds', r.status === 200 && r.body.ok === true);
    ok('rate is the member\'s own', r.body.suggestion.rate_inr === 40000);
    // Swati is on THREE Malhotra functions, two of which share 2026-08-14.
    // FOUNDER-RULED: the unit is the ENGAGEMENT, not the calendar day.
    ok('THE UNIT IS FUNCTIONS — three, not two days', r.body.suggestion.functions === 3);
    ok('amount = 40000 x 3 = 120000', r.body.suggestion.amount_inr === 120000);
    ok('no reason is given when a suggestion exists', r.body.reason === null);

    ok('NOTHING WAS WRITTEN — the DB is byte-unmoved',
      JSON.stringify(db._tables.team_payments) === before);
    ok('and no expenses row appeared either', db._tables.expenses.length === 0);

    // The suggestion is scoped to ONE wedding — Kapoor's crew does not inflate
    // Malhotra's number.
    const r2 = await call('GET', `/pay/suggest?team_member_id=${M_ISHAAN}&linked_event_id=${E_CANCELLED}`);
    ok('a rate-less member yields no suggestion', r2.body.suggestion === null);

    db._tables.team_members.find(m => m.id === M_ISHAAN).daily_rate_inr = 15000;
    const r3 = await call('GET', `/pay/suggest?team_member_id=${M_ISHAAN}&linked_event_id=${E_CANCELLED}`);
    ok('the Kapoor scope counts ONE function, not Malhotra\'s three', r3.body.suggestion.functions === 1);
    ok('a cancelled function still earns its suggestion', r3.body.suggestion.amount_inr === 15000);
    await close();
  }

  // ═══ §6 — ABSENT-HONESTY, NEVER A ZERO ═══════════════════════════════════
  section('§6 absent-honesty — unfiled means unfiled, not Rs 0');
  {
    const db = makeDb(seed());
    const { call, close } = await serve(db, VEND);

    const noRate = await call('GET', `/pay/suggest?team_member_id=${M_ISHAAN}&linked_event_id=${E_CANCELLED}`);
    ok('no rate -> null suggestion', noRate.body.suggestion === null);
    ok('no rate -> the reason is NAMED', noRate.body.reason === 'no_rate');

    const noWedding = await call('GET', `/pay/suggest?team_member_id=${M_SWATI}&linked_event_id=${E_LOOSE}`);
    ok('a binder-less function -> null suggestion', noWedding.body.suggestion === null);
    ok('no wedding -> the reason is NAMED', noWedding.body.reason === 'no_wedding');

    // Ishaan is on the KAPOOR haldi and nothing of the Malhotra wedding. Given a
    // rate, he still earns no Malhotra suggestion — the scope is per-wedding.
    // (The external is NOT the right specimen here: he IS on the sangeet, and
    // asserting otherwise would have been the bench lying about the fixture.)
    db._tables.team_members.find(m => m.id === M_ISHAAN).daily_rate_inr = 15000;
    const notOn = await call('GET', `/pay/suggest?team_member_id=${M_ISHAAN}&linked_event_id=${E_RECCE}`);
    ok('a member on none of this wedding\'s functions -> null', notOn.body.suggestion === null);
    ok('not assigned -> the reason is NAMED', notOn.body.reason === 'not_assigned');

    ok('NOT ONE of the three answered with a zero',
      [noRate, noWedding, notOn].every(x => x.body.suggestion === null));

    // The prefill has no quote source to draw on: collab_responses carries no
    // amount, and the POSTER's budget_inr is not the responder's price.
    const post = db._tables.collab_posts[0];
    ok('the poster\'s budget exists on the post and is NOT the stub\'s amount',
      post.budget_inr === 60000 && db._tables.team_payments.length === 0);

    // An empty board says nothing rather than zero-ing every lane.
    const empty = await call('GET', '/pay/by-wedding');
    ok('an empty board reports no weddings', empty.body.weddings.length === 0);
    ok('and an empty loose lane', empty.body.loose.payments.length === 0);
    await close();
  }

  // ═══ §7 — A3: connect carries roster_id (THE BOTH-SIDES CLAUSE) ══════════
  section('§7 A3 — the connect response the NEW caller reads');
  {
    const db = makeDb(seed());
    const { call, close } = await serve(db, VEND);
    const r = await call('POST', `/collab/${POST_ID}/connect/resp-1`);
    ok('connect succeeds', r.status === 200 && r.body.ok === true);
    ok('roster_id RIDES the response', typeof r.body.roster_id === 'string' && r.body.roster_id.length > 0);
    // Optional chaining deliberately: a MISSING roster_id must RED these
    // asserts, not crash the bench. A crash is weaker evidence than a RED, and
    // the hardening is the bench's job, not the code's.
    ok('it is the POSTER-side edge (owner = this vendor)',
      db._tables.vendor_roster.find(e => e.id === r.body.roster_id)?.owner_vendor_id === VEND);
    ok('and it points at the responder',
      db._tables.vendor_roster.find(e => e.id === r.body.roster_id)?.member_vendor_id === OTHER);
    ok('roster_edge stays for readers that already read it', r.body.roster_edge === true);
    ok('the Settle row can now reach the bridge door with this id',
      db._tables.vendor_roster.some(e => e.id === r.body.roster_id));
    // BOTH-SIDES: the old shape's assert is RETIRED. A green over
    // `roster_edge === true` alone is indistinguishable from no test at all now
    // that the client reads the id — so the id is what this bench drives.
    await close();
  }

  // ═══ §8 — D1: ONE HOME, TWO CALLERS ══════════════════════════════════════
  section('§8 D1 — the binder-title hop resolves once for both surfaces');
  {
    const db = makeDb(seed());
    const { call, close } = await serve(db, VEND);
    await call('POST', '/pay/', { team_member_id: M_SWATI, amount_inr: 1000, linked_event_id: E_SANGEET });

    const bands = await call('GET', `/bands/${VEND}?from=2026-08-01&to=2026-08-31`);
    const money = await call('GET', '/pay/by-wedding');
    const bandTitle = bands.body.bands.find(b => b.binder_id === BINDER_A).title;
    const moneyTitle = money.body.weddings.find(w => w.binder_id === BINDER_A).title;
    ok('the band board names the wedding', bandTitle === 'Rhea Malhotra');
    ok('the money view names it IDENTICALLY', moneyTitle === bandTitle);

    const funcs = await call('GET', '/pay/functions');
    ok('the picker lists the vendor\'s functions', funcs.body.functions.length > 0);
    ok('the picker excludes cancelled functions',
      !funcs.body.functions.some(f => f.event_id === E_CANCELLED));
    ok('the picker excludes nothing else it should show',
      funcs.body.functions.some(f => f.event_id === E_LOOSE));
    ok('the picker carries the wedding name from the SAME home',
      funcs.body.functions.find(f => f.event_id === E_SANGEET).wedding_title === bandTitle);
    ok('a binder-less function is honestly nameless in the picker',
      funcs.body.functions.find(f => f.event_id === E_LOOSE).wedding_title === null);
    await close();
  }

  console.log(`\n══ b0455_money_loop_bench: ${pass} passed, ${fail} failed ══\n`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
