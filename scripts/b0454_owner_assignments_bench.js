#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b0454_owner_assignments_bench.js — TDW_04.5 P4, the OWNER-SIDE
// assignments door.
//
//   node scripts/b0454_owner_assignments_bench.js
//
// WHAT IT DRIVES: the REAL src/api/vendor/studio/team.js router, mounted in a
// real express app over a real listener — which means it drives the REAL
// buildCrewPage from src/api/crew.js, because that is what the door calls.
// Nothing under test is stubbed.
//
// THE POINT OF THIS BENCH: the ruling was "one assembly, two auth wrappers".
// A bench that re-implemented the assembly would prove the re-implementation.
// So §3 asserts the door's output against the SAME assembly's output through
// the TOKEN door — if the two ever diverge, that assertion is the thing that
// notices.
//
// BOTH-WAYS (non-vacuous by PRODUCTION mutation, never test setup):
//   §2  drop `.eq('vendor_id', req.vendor.id)` from the member lookup
//   §3  re-implement the assembly instead of calling buildCrewPage
//   §4  echo `tasks` into the response
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

const OWNER = 'v-owner', OTHER = 'v-other';
const MEMBER = 'tm-1', FOREIGN = 'tm-2';
const soon = (d) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

function makeDb(seed = {}) {
  const tables = {
    vendors: [], team_members: [], events: [], crew_confirmations: [], team_tasks: [],
    ...seed,
  };
  function from(table) {
    const rows = tables[table] || (tables[table] = []);
    const q = { _f: [], _order: null, _limit: null };
    const matched = () => {
      let out = rows.filter(r => q._f.every(f => f(r)));
      if (q._order) {
        const { col, asc } = q._order;
        out = out.slice().sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
      }
      return q._limit ? out.slice(0, q._limit) : out;
    };
    q.select = () => q;
    q.eq   = (c, v) => { q._f.push(r => r[c] === v); return q; };
    q.neq  = (c, v) => { q._f.push(r => r[c] !== v); return q; };
    q.is   = (c, v) => { q._f.push(r => (r[c] ?? null) === v); return q; };
    q.gte  = (c, v) => { q._f.push(r => r[c] >= v); return q; };
    q.in   = (c, vs) => { q._f.push(r => vs.includes(r[c])); return q; };
    q.contains = (c, vs) => { q._f.push(r => Array.isArray(r[c]) && vs.every(v => r[c].includes(v))); return q; };
    q.order = (col, o) => { q._order = { col, asc: !!(o && o.ascending) }; return q; };
    q.limit = (n) => { q._limit = n; return q; };
    q.maybeSingle = async () => ({ data: matched()[0] || null, error: null });
    q.single      = async () => ({ data: matched()[0] || null, error: null });
    q.then = (res, rej) => Promise.resolve({ data: matched(), error: null }).then(res, rej);
    return q;
  }
  const client = { from, _tables: tables };
  client.schema = () => ({ from: () => {
    const q = { select: () => q, eq: () => q, in: () => q,
                then: (r, j) => Promise.resolve({ data: [], error: null }).then(r, j) };
    return q;
  }});
  return client;
}

function stub(vendorId) {
  const paths = {
    reqAuth: path.join(ROOT, 'src/api/middleware/requireAuth.js'),
    resVen:  path.join(ROOT, 'src/api/middleware/resolveVendor.js'),
    prest:   path.join(ROOT, 'src/api/middleware/requirePrestige.js'),
  };
  require.cache[require.resolve(paths.reqAuth)] =
    { id: paths.reqAuth, filename: paths.reqAuth, loaded: true, exports: (rq, rs, nx) => nx() };
  require.cache[require.resolve(paths.resVen)] =
    { id: paths.resVen, filename: paths.resVen, loaded: true,
      exports: () => (rq, rs, nx) => { rq.vendor = { id: vendorId }; nx(); } };
  require.cache[require.resolve(paths.prest)] =
    { id: paths.prest, filename: paths.prest, loaded: true, exports: (rq, rs, nx) => nx() };
}

async function serve(db, vendorId) {
  stub(vendorId);
  for (const m of ['src/api/vendor/studio/team.js', 'src/api/crew.js']) {
    delete require.cache[require.resolve(path.join(ROOT, m))];
  }
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.locals.supabase = db;
  app.use('/team', require(path.join(ROOT, 'src/api/vendor/studio/team.js')));
  app.use('/crew', require(path.join(ROOT, 'src/api/crew.js')));
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const call = async (m, u, b) => {
    const r = await fetch(`http://127.0.0.1:${port}${u}`, {
      method: m, headers: { 'content-type': 'application/json' },
      body: b === undefined ? undefined : JSON.stringify(b),
    });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  return { call, close: () => new Promise(r => server.close(r)) };
}

function seedWorld() {
  return {
    vendors: [
      { id: OWNER, user_id: 'u-1', business_name: 'Droy Studio' },
      { id: OTHER, user_id: 'u-2', business_name: 'Someone Else' },
    ],
    team_members: [
      { id: MEMBER,  vendor_id: OWNER, name: 'Swati Roy', role: 'external_vendor',
        active: true, deleted_at: null, page_token: '9561b72b-75bf-4f11-91d4-c3f193f7dff7' },
      { id: FOREIGN, vendor_id: OTHER, name: 'Nikita', role: 'crew',
        active: true, deleted_at: null, page_token: '11111111-2222-3333-4444-555555555555' },
    ],
    events: [
      { id: 'e1', vendor_id: OWNER, title: 'Meera — trial', slot: 'morning',
        event_date: soon(11), event_time: '09:30', linked_binder_id: null,
        assigned_member_ids: [MEMBER], deleted_at: null, state: 'upcoming' },
      { id: 'e2', vendor_id: OWNER, title: 'Kapoor mehendi', slot: 'evening',
        event_date: soon(20), event_time: null, linked_binder_id: null,
        assigned_member_ids: [MEMBER], deleted_at: null, state: 'upcoming' },
      { id: 'e3', vendor_id: OWNER, title: 'Not theirs', slot: 'noon',
        event_date: soon(12), event_time: null, linked_binder_id: null,
        assigned_member_ids: ['tm-other'], deleted_at: null, state: 'upcoming' },
      { id: 'e4', vendor_id: OWNER, title: 'Cancelled one', slot: 'noon',
        event_date: soon(13), event_time: null, linked_binder_id: null,
        assigned_member_ids: [MEMBER], deleted_at: null, state: 'cancelled' },
    ],
    crew_confirmations: [
      { event_id: 'e1', member_id: MEMBER, status: 'declined', note: 'Double booked that morning.' },
    ],
    team_tasks: [
      { id: 'tk1', vendor_id: OWNER, assigned_to_member_id: MEMBER, title: 'Bring the kit',
        description: 'd', due_date: null, priority: null, state: 'open', deleted_at: null },
    ],
  };
}

(async function main() {
  section('§1 the owner sees his member\'s board');
  {
    const s = await serve(makeDb(seedWorld()), OWNER);
    const r = await s.call('GET', `/team/${MEMBER}/assignments`);
    ok('the door answers 200', r.status === 200);
    const a = r.body?.assignments || [];
    ok('it returns THIS member\'s two live functions', a.length === 2);
    ok('a function assigned to someone else is absent',
       !a.some(x => x.title === 'Not theirs'));
    ok('a cancelled function is absent', !a.some(x => x.title === 'Cancelled one'));
    // Optional chaining throughout: a mutation that empties the list must RED
    // these asserts, not crash the bench. A crash is weaker evidence than a RED.
    ok('date, slot, title and call time all travel',
       !!a[0]?.date && a[0]?.slot === 'morning' && a[0]?.title === 'Meera — trial' && a[0]?.call_time === '09:30');
    ok('the confirmation state travels', a[0]?.confirmation === 'declined');
    ok('an unanswered assignment reads pending, never blank',
       a.find(x => x.title === 'Kapoor mehendi')?.confirmation === 'pending');
    ok('THE DECLINE NOTE travels — founder-vetoed, F7 permits it',
       a[0]?.note === 'Double booked that morning.');
    ok('assignments come back in date order', !!a[0]?.date && a[0].date <= a[1]?.date);
    await s.close();
  }

  section('§2 the belongs-to check IS the authorization');
  {
    const s = await serve(makeDb(seedWorld()), OWNER);
    const r = await s.call('GET', `/team/${FOREIGN}/assignments`);
    ok('another vendor\'s member is 404, not 403 — the door does not confirm they exist',
       r.status === 404);
    ok('and no assignments leak in the error body', !r.body?.assignments);
    await s.close();
  }
  {
    const s = await serve(makeDb(seedWorld()), OTHER);
    const r = await s.call('GET', `/team/${MEMBER}/assignments`);
    ok('and the mirror holds — the other vendor cannot read MY member', r.status === 404);
    await s.close();
  }

  section('§3 ONE ASSEMBLY — the owner door and the token door agree');
  {
    const s = await serve(makeDb(seedWorld()), OWNER);
    const owner = await s.call('GET', `/team/${MEMBER}/assignments`);
    const token = await s.call('GET', '/crew/9561b72b-75bf-4f11-91d4-c3f193f7dff7');
    const a = owner.body?.assignments || [];
    const b = token.body?.assignments || [];
    ok('the token door still answers', token.status === 200);
    ok('both doors return the same NUMBER of assignments', a.length === b.length && a.length === 2);
    ok('and the SAME payload, field for field — one assembly, proven not asserted',
       JSON.stringify(a) === JSON.stringify(b));
    await s.close();
  }

  section('§4 what does NOT travel');
  {
    const s = await serve(makeDb(seedWorld()), OWNER);
    const r = await s.call('GET', `/team/${MEMBER}/assignments`);
    ok('tasks are NOT echoed — the owner has his own Tasks screen',
       !('tasks' in (r.body || {})));
    ok('no raw event row is spread in — no `state`, no `deleted_at`',
       (r.body.assignments || []).every(x => !('state' in x) && !('deleted_at' in x)));
    ok('and no assigned_member_ids array rides along',
       (r.body.assignments || []).every(x => !('assigned_member_ids' in x)));
    await s.close();
  }

  section('§5 the honest empty');
  {
    const world = seedWorld();
    world.events = [];
    const s = await serve(makeDb(world), OWNER);
    const r = await s.call('GET', `/team/${MEMBER}/assignments`);
    ok('a member with nothing on returns 200 with an empty list, never an error',
       r.status === 200 && Array.isArray(r.body?.assignments) && r.body.assignments.length === 0);
    await s.close();
  }

  console.log(`\n══ b0454_owner_assignments_bench: ${pass} passed, ${fail} failed ══\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(err => { console.error('BENCH CRASH:', err); process.exit(1); });
