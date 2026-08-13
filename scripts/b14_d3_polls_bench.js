#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b14_d3_polls_bench.js
// TDW_14 · D-3 · C-4 — POLLS, DRIVEN THROUGH BOTH LANES.
//
// Runnable from ANY working directory (§9). Paths resolve from __dirname.
//
//   node scripts/b14_d3_polls_bench.js
//
// ── WHAT THIS DELIVERY IS, AND THEREFORE WHAT THIS BENCH MAY CLAIM ──────────
// D-3a ships the PLANE and the DOORS. The two web surfaces are held for the copy
// veto, so there is no UI to drive and no cell below pretends there is. What can
// be proven is everything the surfaces will stand on: that the bride is admitted
// (the spec's own instruction would have refused her), that one participant
// casts one vote, that the couple scope is the authorisation, and that the
// linked event's vendor field passes through the ONE HOME.
//
// ── THE BRIDE IS THE POINT OF §2 ───────────────────────────────────────────
// TDW_14 §P5.1 said "member auth (C-9 pattern)" in the same sentence as "one
// vote per participant (bride included)". §2.1 drives her through the door with
// a couple credential and §5.M1 puts the Class A guard back to prove the cell
// is not decorative — the refusal the spec would have shipped, mechanised.
//
// The mutation leg breaks PRODUCTION CODE, never bench setup, and every restore
// is sha256-verified (CE-32 Ruling 1).
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (p) => path.join(ROOT, p);
const read = (p) => fs.readFileSync(SRC(p), 'utf8');
const sha  = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Comments stripped before EVERY source assertion (the comment-blindness law).
const code = (p) => read(p)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');

const POLLS     = 'src/api/circle/polls.js';
const GATE      = 'src/lib/resolveCoupleIfPresent.js';
const RESOLVER  = 'src/lib/resolveCircleIdentityIfPresent.js';
const ROUTER    = 'src/api/router.js';
const MIGRATION = 'db/migrations/0124_circle_polls.sql';

let pass = 0, fail = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; fails.push(name); console.log(`  FAIL ${name}\n         ${e.message}`); }
}
async function ta(name, fn) {
  try { await fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; fails.push(name); console.log(`  FAIL ${name}\n         ${e.message}`); }
}
function H(h) { console.log(`\n${h}`); }

function fresh(p) {
  for (const k of Object.keys(require.cache)) {
    if (k.includes(path.join('src', 'api')) || k.includes(path.join('src', 'lib'))) delete require.cache[k];
  }
  return require(SRC(p));
}

// ── FIXTURES OF RECORD — the founder's own rows ────────────────────────────
// Member and couple from `b07_f0772_circle_auth_bench.js`'s fixture block
// (founder-run SELECT, 2026-08-02). The BRIDE's users.id is BRIDE.usersId there;
// it is the value R-D3.2 makes load-bearing, because she votes on it.
const MEHEK = {
  usersId:  '3c8eb9e0-e746-4d95-9630-17897aa64f05',
  coupleId: '9f1f84d5-e688-4d4f-9e44-9f5da6315e52',
  phone:    '+918757788550',
};
const BRIDE = { usersId: '2900c661-4358-42d3-aa74-431053e00c0d', authUserId: '0e0c306d-37ed-4343-b3d9-b83cd5f174a3' };
const OTHER_COUPLE = 'de4dbeef-0000-0000-0000-000000000000';
const BRIDE_JWT = 'header.payload.signature';   // three parts — a real JWT's shape

// ── the plane ──────────────────────────────────────────────────────────────
// Honours the filters it is given rather than swallowing them: a fake that
// ignores what it was asked for cannot convict code that fails to ask (the
// f0772 plane's own tuition, and §5.M3 depends on it).
function plane({ polls = [], votes = [], events = [], visibility = {} } = {}) {
  const cap = { inserted: [], upserted: [] };
  const api = {
    auth: {
      getUser: async (tok) => (tok === BRIDE_JWT
        ? { data: { user: { id: BRIDE.authUserId } }, error: null }
        : { data: { user: null }, error: new Error('bad') }),
    },
    from(table) {
      const q = { _eq: {}, _in: null, _sel: null };
      q.select = (c) => { q._sel = typeof c === 'string' ? c : null; return q; };
      q.eq = (c, v) => { q._eq[c] = v; return q; };
      q.in = (c, vs) => { q._in = { c, vs }; return q; };
      q.order = () => q; q.limit = () => q;
      q.insert = (r) => { cap.inserted.push(r); q._ins = r; return q; };
      q.upsert = (r, o) => { cap.upserted.push({ row: r, opts: o }); return Promise.resolve({ error: null }); };
      q.maybeSingle = async () => {
        if (table === 'users') {
          if (q._eq.auth_user_id === BRIDE.authUserId) return { data: { id: BRIDE.usersId } };
          if (q._eq.id === BRIDE.usersId) return { data: { id: BRIDE.usersId } };
          return { data: null };
        }
        if (table === 'couples') {
          if (q._eq.user_id === BRIDE.usersId) return { data: { id: MEHEK.coupleId } };
          return { data: null };
        }
        if (table === 'circle_members') {
          if (q._eq.couple_id === MEHEK.coupleId) return { data: { visibility } };
          return { data: null };
        }
        if (table === 'circle_polls') {
          if (q._ins) return { data: { ...q._ins, id: 'poll-new', created_at: '2026-08-13T00:00:00Z' }, error: null };
          const hit = polls.find(p => p.id === q._eq.id &&
            (q._eq.couple_id === undefined || p.couple_id === q._eq.couple_id));
          return { data: hit || null };
        }
        return { data: null };
      };
      q.then = (r) => {
        if (table === 'circle_polls') {
          const rows = polls.filter(p => p.couple_id === q._eq.couple_id);
          return Promise.resolve({ data: rows, error: null }).then(r);
        }
        if (table === 'circle_poll_votes') {
          const ids = (q._in && q._in.vs) || [];
          return Promise.resolve({ data: votes.filter(v => ids.includes(v.poll_id)), error: null }).then(r);
        }
        if (table === 'events') {
          const ids = (q._in && q._in.vs) || [];
          return Promise.resolve({ data: events.filter(e => ids.includes(e.id)), error: null }).then(r);
        }
        return Promise.resolve({ data: [], error: null }).then(r);
      };
      return q;
    },
  };
  return { api, cap };
}

// Drive one handler on the mounted router.
async function call(method, routePath, { body = {}, params = {}, query = {}, auth, planeOpts = {} } = {}) {
  const router = fresh(POLLS);
  const { api, cap } = plane(planeOpts);
  const layer = router.stack.find(l => l.route && l.route.path === routePath && l.route.methods[method]);
  assert.ok(layer, `${method.toUpperCase()} ${routePath} is not mounted on the polls router`);

  const headers = {};
  if (auth) headers.authorization = `Bearer ${auth}`;
  const req = {
    app: { locals: { supabase: api } }, headers, body, params, query,
    get(h) { return this.headers[String(h).toLowerCase()]; },
  };
  let status = 200, payload = null;
  const res = { status(s) { status = s; return this; }, json(b) { payload = b; return this; } };
  await new Promise((resolve) => { layer.route.stack[0].handle(req, res, resolve); setTimeout(resolve, 250); });
  return { status, payload, cap, req };
}

function memberToken() {
  process.env.CIRCLE_SESSION_SECRET = process.env.CIRCLE_SESSION_SECRET || 'bench-secret-not-a-credential';
  const { mintCircleSession } = require(SRC('src/lib/circleSession.js'));
  const tok = mintCircleSession({ userId: MEHEK.usersId, coupleId: MEHEK.coupleId });
  assert.ok(tok, 'could not mint a member token — the cells below would 401 for the wrong reason');
  return tok;
}

const ledger = [];
async function mutate(file, from, to, probe) {
  const before = read(file), h = sha(before);
  assert.ok(before.includes(from), `MUTATION TARGET ABSENT in ${file}: ${from}`);
  fs.writeFileSync(SRC(file), before.replace(from, to));
  let red = false;
  try { await probe(); } catch { red = true; }
  fs.writeFileSync(SRC(file), before);
  ledger.push({ file, ok: sha(read(file)) === h });
  assert.strictEqual(sha(read(file)), h, `RESTORE FAILED for ${file}`);
  assert.ok(red, 'the named cell PASSED over broken production code — it is decorative');
}

(async () => {

// ═══════════════════════════════════════════════════════════════════════════
H('§1 — THE GATE LEARNS WHO, ON BOTH ARMS (R-D3.3)');
// ═══════════════════════════════════════════════════════════════════════════

t('§1.1 the gate RETURNS the usersId it had always computed and discarded', () => {
  const c = code(GATE);
  assert.ok(/coupleId: \(couple && couple\.id\) \|\| null, usersId/.test(c),
    'resolveCoupleIfPresent still throws the resolved users id away');
});

t('§1.2 EVERY return shape carries all three keys — no branch-varying shape', () => {
  const c = code(GATE);
  const returns = c.match(/return \{[^}]*\}/g) || [];
  assert.ok(returns.length >= 4, `expected at least 4 return shapes, found ${returns.length}`);
  for (const r of returns) {
    assert.ok(/usersId/.test(r), `a return shape omits usersId: ${r.replace(/\s+/g, ' ')}`);
  }
});

t('§1.3 the widening is ADDITIVE — present and coupleId keep their meanings', () => {
  const c = code(GATE);
  assert.ok(/present: false, coupleId: null, usersId: null/.test(c), 'ABSENT changed meaning');
  assert.ok(/present: true, coupleId: null, usersId: null/.test(c), 'the third answer changed meaning');
});

await ta('§1.4 arm 2 PASSES IT THROUGH — the bride is nameable at last', async () => {
  const { resolveCircleIdentityIfPresent } = fresh(RESOLVER);
  const { api } = plane();
  const req = { headers: { authorization: `Bearer ${BRIDE_JWT}` }, get(h) { return this.headers[String(h).toLowerCase()]; } };
  const out = await resolveCircleIdentityIfPresent(req, api);
  assert.strictEqual(out.source, 'couple');
  assert.strictEqual(out.coupleId, MEHEK.coupleId);
  assert.strictEqual(out.userId, BRIDE.usersId, 'arm 2 still answers null for WHO');
});

await ta('§1.5 arm 1 is UNCHANGED — the member is still named from her token binding', async () => {
  const { resolveCircleIdentityIfPresent } = fresh(RESOLVER);
  const { api } = plane();
  const req = { headers: { authorization: `Bearer ${memberToken()}` }, get(h) { return this.headers[String(h).toLowerCase()]; } };
  const out = await resolveCircleIdentityIfPresent(req, api);
  assert.strictEqual(out.source, 'circle');
  assert.strictEqual(out.userId, MEHEK.usersId);
});

t('§1.6 NO HANDLER-SIDE COUPLES HOP — the resolution has one home', () => {
  const c = code(POLLS);
  assert.ok(!/from\('couples'\)/.test(c),
    'polls.js resolves identity itself — a second implementation of the gate\u0027s own question');
  assert.ok(!/resolveUsersId/.test(c), 'polls.js re-resolves the users plane');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§2 — CLASS B: THE BRIDE IS ADMITTED (R-D3.1)');
// ═══════════════════════════════════════════════════════════════════════════

await ta('§2.1 THE BRIDE VOTES — the refusal the spec would have shipped, absent', async () => {
  const poll = { id: 'p1', couple_id: MEHEK.coupleId, options: [{ id: 'o1', label: 'A' }, { id: 'o2', label: 'B' }] };
  const r = await call('post', '/:pollId/vote', {
    auth: BRIDE_JWT, params: { pollId: 'p1' }, body: { option_id: 'o1' },
    planeOpts: { polls: [poll] },
  });
  assert.strictEqual(r.status, 200, 'the bride was refused at her own poll');
  assert.strictEqual(r.cap.upserted[0].row.voter_user_id, BRIDE.usersId,
    'her vote was not keyed on her users.id');
});

await ta('§2.2 THE MEMBER VOTES — arm 1, same door, same shape', async () => {
  const poll = { id: 'p1', couple_id: MEHEK.coupleId, options: [{ id: 'o1', label: 'A' }, { id: 'o2', label: 'B' }] };
  const r = await call('post', '/:pollId/vote', {
    auth: memberToken(), params: { pollId: 'p1' }, body: { option_id: 'o2' },
    planeOpts: { polls: [poll] },
  });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.cap.upserted[0].row.voter_user_id, MEHEK.usersId);
});

await ta('§2.3 NO CREDENTIAL ⇒ 401 at every handler, and nothing is written', async () => {
  for (const [m, p, params] of [['post', '/', {}], ['post', '/:pollId/vote', { pollId: 'p1' }], ['get', '/:brideId', { brideId: 'x' }]]) {
    const r = await call(m, p, { params, body: { question: 'q', options: ['a', 'b'], option_id: 'o1' } });
    assert.strictEqual(r.status, 401, `${m.toUpperCase()} ${p} admitted a credential-less caller`);
    assert.strictEqual(r.cap.inserted.length + r.cap.upserted.length, 0, 'a refused call still wrote');
  }
});

t('§2.4 the router is mounted BARE — no Class A guard in front of polls', () => {
  const c = code(ROUTER);
  const line = c.split('\n').find(l => l.includes("'/frost/circle/polls'"));
  assert.ok(line, 'the polls router is not mounted');
  assert.ok(!/requireCircleMemberAuth/.test(line),
    'polls is mounted behind the Class A guard — the bride is locked out of her own poll');
});

t('§2.5 the handler carries NO Class A guard of its own either', () => {
  assert.ok(!/requireCircleMemberAuth/.test(code(POLLS)));
});

// ═══════════════════════════════════════════════════════════════════════════
H('§3 — ONE VOTE PER PARTICIPANT, AND THE SCOPE IS THE AUTHORISATION');
// ═══════════════════════════════════════════════════════════════════════════

await ta('§3.1 a repeat vote UPSERTS on the PK — changing your mind is one row', async () => {
  const poll = { id: 'p1', couple_id: MEHEK.coupleId, options: [{ id: 'o1', label: 'A' }, { id: 'o2', label: 'B' }] };
  const r = await call('post', '/:pollId/vote', {
    auth: memberToken(), params: { pollId: 'p1' }, body: { option_id: 'o2' }, planeOpts: { polls: [poll] },
  });
  assert.strictEqual(r.cap.upserted[0].opts.onConflict, 'poll_id,voter_user_id',
    'the write does not target the one-vote key');
});

await ta('§3.2 ANOTHER CIRCLE\u0027S POLL is 404 and NOTHING is written', async () => {
  const poll = { id: 'p1', couple_id: OTHER_COUPLE, options: [{ id: 'o1', label: 'A' }] };
  const r = await call('post', '/:pollId/vote', {
    auth: memberToken(), params: { pollId: 'p1' }, body: { option_id: 'o1' }, planeOpts: { polls: [poll] },
  });
  assert.strictEqual(r.status, 404);
  assert.strictEqual(r.cap.upserted.length, 0, 'a cross-circle vote landed');
});

await ta('§3.3 AN OPTION NOT ON THE POLL is 400 and NOTHING is written', async () => {
  const poll = { id: 'p1', couple_id: MEHEK.coupleId, options: [{ id: 'o1', label: 'A' }, { id: 'o2', label: 'B' }] };
  const r = await call('post', '/:pollId/vote', {
    auth: memberToken(), params: { pollId: 'p1' }, body: { option_id: 'o9' }, planeOpts: { polls: [poll] },
  });
  assert.strictEqual(r.status, 400);
  assert.strictEqual(r.cap.upserted.length, 0, 'a vote for a nonexistent option was recorded');
});

await ta('§3.4 A CLOSED POLL refuses the vote — 409, nothing written', async () => {
  const poll = { id: 'p1', couple_id: MEHEK.coupleId, closes_at: '2020-01-01T00:00:00Z',
                 options: [{ id: 'o1', label: 'A' }, { id: 'o2', label: 'B' }] };
  const r = await call('post', '/:pollId/vote', {
    auth: memberToken(), params: { pollId: 'p1' }, body: { option_id: 'o1' }, planeOpts: { polls: [poll] },
  });
  assert.strictEqual(r.status, 409);
  assert.strictEqual(r.cap.upserted.length, 0);
});

t('§3.5 NO \u0027bride\u0027 SENTINEL EXISTS ANYWHERE IN THE FEATURE (R-D3.2)', () => {
  for (const f of [POLLS, MIGRATION]) {
    const c = f.endsWith('.sql') ? read(f).split('\n').filter(l => !l.trim().startsWith('--')).join('\n') : code(f);
    assert.ok(!/'bride'/.test(c), `${f} carries a 'bride' sentinel — the text-discriminator scar, reopened`);
    assert.ok(!/member_ref/.test(c), `${f} carries the spec's member_ref text key`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
H('§4 — CREATE: the option ids are OURS, the bounds are enforced');
// ═══════════════════════════════════════════════════════════════════════════

await ta('§4.1 a valid poll is created on the PROVEN couple, never a supplied one', async () => {
  const r = await call('post', '/', {
    auth: memberToken(), body: { question: 'Which lehenga?', options: ['Red', 'Gold'], couple_id: OTHER_COUPLE },
  });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.cap.inserted[0].couple_id, MEHEK.coupleId, 'a supplied couple_id was honoured');
  assert.strictEqual(r.cap.inserted[0].created_by_user_id, MEHEK.usersId);
});

await ta('§4.2 OPTION IDS ARE MINTED SERVER-SIDE — a caller cannot collide two', async () => {
  const r = await call('post', '/', {
    auth: memberToken(),
    body: { question: 'q', options: [{ label: 'A', id: 'dup' }, { label: 'B', id: 'dup' }] },
  });
  const ids = r.cap.inserted[0].options.map(o => o.id);
  assert.deepStrictEqual(ids, ['o1', 'o2'], 'caller-supplied option ids were trusted');
  assert.strictEqual(new Set(ids).size, ids.length, 'two options share an id — a tally would merge them');
});

await ta('§4.3 fewer than 2 or more than 4 options is 400, nothing written', async () => {
  for (const opts of [['A'], ['A', 'B', 'C', 'D', 'E']]) {
    const r = await call('post', '/', { auth: memberToken(), body: { question: 'q', options: opts } });
    assert.strictEqual(r.status, 400, `${opts.length} options was accepted`);
    assert.strictEqual(r.cap.inserted.length, 0);
  }
});

await ta('§4.4 a blank question or a blank label is 400, nothing written', async () => {
  for (const body of [{ question: '   ', options: ['A', 'B'] }, { question: 'q', options: ['A', '  '] }]) {
    const r = await call('post', '/', { auth: memberToken(), body });
    assert.strictEqual(r.status, 400);
    assert.strictEqual(r.cap.inserted.length, 0);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
H('§5 — THE FOURTH CONSUMER: the linked event reads through the ONE HOME (R-D3.4)');
// ═══════════════════════════════════════════════════════════════════════════

const EV = { id: 'e1', title: 'Mehendi', event_date: '2026-12-01', vendor_id: 'v1' };
const POLL_WITH_EVENT = { id: 'p1', couple_id: MEHEK.coupleId, question: 'q',
  options: [{ id: 'o1', label: 'A' }, { id: 'o2', label: 'B' }], linked_event_id: 'e1',
  created_at: '2026-08-13T00:00:00Z' };

await ta('§5.1 a member WITHOUT can_see_vendors gets the event, WITHOUT the vendor', async () => {
  const r = await call('get', '/:brideId', {
    auth: memberToken(), params: { brideId: 'ignored' },
    planeOpts: { polls: [POLL_WITH_EVENT], events: [EV], visibility: {} },
  });
  const ev = r.payload.data[0].linked_event;
  assert.strictEqual(ev.title, 'Mehendi', 'the event itself was withheld — the poll lost its subject');
  assert.ok(!('vendor_id' in ev), 'a member with the flag OFF received the vendor id');
});

await ta('§5.2 the SAME member WITH can_see_vendors gets it — the flag is load-bearing', async () => {
  const r = await call('get', '/:brideId', {
    auth: memberToken(), params: { brideId: 'ignored' },
    planeOpts: { polls: [POLL_WITH_EVENT], events: [EV], visibility: { vendors: true } },
  });
  assert.strictEqual(r.payload.data[0].linked_event.vendor_id, 'v1');
});

await ta('§5.3 THE BRIDE is ungated — she sees her own journey whole', async () => {
  const r = await call('get', '/:brideId', {
    auth: BRIDE_JWT, params: { brideId: 'ignored' },
    planeOpts: { polls: [POLL_WITH_EVENT], events: [EV], visibility: {} },
  });
  assert.strictEqual(r.payload.data[0].linked_event.vendor_id, 'v1',
    'the bride was gated by a block she does not have');
});

await ta('§5.4 A POLL IS SHARED BY CREATION — options render WHOLE regardless', async () => {
  const r = await call('get', '/:brideId', {
    auth: memberToken(), params: { brideId: 'ignored' },
    planeOpts: { polls: [POLL_WITH_EVENT], events: [EV], visibility: {} },
  });
  assert.strictEqual(r.payload.data[0].options.length, 2, 'options were filtered — a ballot half the circle cannot answer');
});

t('§5.5 polls.js reaches the ONE HOME by CALL and reads no flag out of the column', () => {
  const c = code(POLLS);
  assert.ok(/require\('\.\.\/\.\.\/lib\/circlePermissions'\)/.test(c), 'polls.js does not reach the one home');
  assert.ok(!/visibility\s*(\?\.|\[|\.)\s*(budget|guests|vendors|contribute_muse)/.test(c),
    'polls.js indexes the visibility column directly — a second resolver');
});

// [F-SW.2] ABSENCE — no new key was invented, the set is still unruled.
t('§5.6 NO NEW PERMISSION KEY was invented for polls', () => {
  const c = code(POLLS);
  const keys = [...c.matchAll(/can_[a-z_]+/g)].map(m => m[0]);
  for (const k of keys) {
    assert.ok(['can_see_budget', 'can_see_guests', 'can_see_vendors', 'can_contribute_muse'].includes(k),
      `polls.js names a permission key that does not exist: ${k}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
H('§6 — TALLIES ARE COMPUTED, NEVER STORED');
// ═══════════════════════════════════════════════════════════════════════════

const VOTES = [
  { poll_id: 'p1', voter_user_id: BRIDE.usersId, option_id: 'o1' },
  { poll_id: 'p1', voter_user_id: MEHEK.usersId, option_id: 'o1' },
  { poll_id: 'p1', voter_user_id: 'u3',          option_id: 'o2' },
];

await ta('§6.1 the tally counts the ROWS, and my_vote is the viewer\u0027s own', async () => {
  const r = await call('get', '/:brideId', {
    auth: memberToken(), params: { brideId: 'ignored' },
    planeOpts: { polls: [POLL_WITH_EVENT], votes: VOTES, events: [EV], visibility: {} },
  });
  const p = r.payload.data[0];
  assert.strictEqual(p.options.find(o => o.id === 'o1').votes, 2);
  assert.strictEqual(p.options.find(o => o.id === 'o2').votes, 1);
  assert.strictEqual(p.total_votes, 3);
  assert.strictEqual(p.my_vote, 'o1', 'the viewer\u0027s own vote was not identified');
});

await ta('§6.2 my_vote is VIEWER-RELATIVE — the bride sees hers, not the member\u0027s', async () => {
  const r = await call('get', '/:brideId', {
    auth: BRIDE_JWT, params: { brideId: 'ignored' },
    planeOpts: { polls: [{ ...POLL_WITH_EVENT }], votes: [VOTES[2]], events: [EV] },
  });
  assert.strictEqual(r.payload.data[0].my_vote, null, 'a stranger\u0027s vote was reported as the viewer\u0027s');
});

t('§6.3 NO STORED COUNTER — the schema holds no tally column to drift', () => {
  const sql = read(MIGRATION);
  assert.ok(!/vote_count|tally|total_votes/i.test(sql.replace(/^--.*$/gm, '')),
    'a denormalised tally column exists — a second source of truth for a number the rows carry');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§7 — THE MIGRATION (R-D3.8)');
// ═══════════════════════════════════════════════════════════════════════════

t('§7.1 both tables, with the PK that IS the one-vote rule', () => {
  const sql = read(MIGRATION);
  assert.ok(/CREATE TABLE IF NOT EXISTS public\.circle_polls/.test(sql));
  assert.ok(/CREATE TABLE IF NOT EXISTS public\.circle_poll_votes/.test(sql));
  assert.ok(/PRIMARY KEY \(poll_id, voter_user_id\)/.test(sql),
    'one-vote-per-participant is not enforced at the plane');
});

t('§7.2 the 2-4 bound is a CHECK at the plane, not only a handler opinion', () => {
  assert.ok(/jsonb_array_length\(options\) BETWEEN 2 AND 4/.test(read(MIGRATION)));
});

t('§7.3 the verify reads pg_constraint and each block is pasted ALONE', () => {
  const sql = read(MIGRATION);
  assert.ok(/pg_constraint/.test(sql), 'the verify infers constraints from rows');
  assert.ok((sql.match(/paste alone/g) || []).length >= 6, 'blocks lack their own paste boundaries');
});

// AN ASSERTION AGAINST PROSE MUST NORMALISE THE WRAPPING. The first cut of this
// cell searched the raw file for a sentence that WRAPS across two comment lines,
// so the `--` and the newline sat inside the phrase and it could never match. It
// reddened against a migration that says exactly what it was asked to say. The
// comment markers and runs of whitespace are collapsed first; the claim is about
// the SENTENCE, not about where the author happened to break the line.
t('§7.4 the address is IN ORDER — no F-SW.3 header line is owed, and it says so', () => {
  const sql = read(MIGRATION).replace(/^--\s?/gm, '').replace(/\s+/g, ' ');
  assert.ok(/F-SW\.3's out-of-order rule DOES NOT APPLY/.test(sql),
    'the migration does not record why it owes the schema doc nothing');
  const doc = read('docs/db/PUBLIC_SCHEMA.md');
  const header = doc.slice(0, doc.indexOf('## public.'));
  assert.ok(!/0124/.test(header), 'an in-order migration wrongly added itself to the staleness table');
});

// ── §7.7 IS BORN OF THIS DELIVERY'S OWN ERROR ─────────────────────────────
// The verify block's EXPECT line shipped reading "8 ROWS: 2 PK, 5 FK, 1 CHECK".
// There are SIX foreign keys. The DDL was correct and the PREDICTION was short
// by one, so the founder ran a block whose stated expectation disagreed with a
// perfectly good result. That direction is the dangerous one to leave unguarded:
// a wrong expectation can make a correct migration look like a failure, and it
// can just as easily wave a real failure through.
//
// "Assert the artifact, never a predicted count" is standing law, and a
// founder-facing EXPECT line is the one place a predicted count legitimately
// has to live. So it gets a cell: the DDL's own constraint declarations are
// counted, and the file's stated expectation must agree with them. Comments are
// stripped first — the prose above quotes these very words, and a count taken
// over the prose would count the explanation instead of the code.
t('§7.7 the verify block\u0027s EXPECTED CONSTRAINT COUNTS match the DDL\u0027s own declarations', () => {
  const raw = read(MIGRATION);
  const ddl = raw.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');

  const fks    = (ddl.match(/REFERENCES/g) || []).length;
  const pks    = (ddl.match(/PRIMARY KEY/g) || []).length;
  const checks = (ddl.match(/CHECK \(/g) || []).length;

  const expect = raw.match(/EXPECT (\d+) ROWS: (\d+) PRIMARY KEY · (\d+) FOREIGN KEY · (\d+) CHECK/);
  assert.ok(expect, 'the constraint verify block states no expectation a reader could check');
  const [, total, ePk, eFk, eCheck] = expect.map(Number);

  assert.strictEqual(eFk,    fks,    `EXPECT says ${eFk} foreign keys; the DDL declares ${fks}`);
  assert.strictEqual(ePk,    pks,    `EXPECT says ${ePk} primary keys; the DDL declares ${pks}`);
  assert.strictEqual(eCheck, checks, `EXPECT says ${eCheck} checks; the DDL declares ${checks}`);
  assert.strictEqual(total,  fks + pks + checks,
    `EXPECT's total (${total}) is not the sum of its own parts (${fks + pks + checks})`);
});

// ── §7.8 CATCHES A STALE HEADER BEFORE IT IS COMMITTED ────────────────────
// 0123's law: a migration header that still says "not yet applied" AFTER it is
// applied is a comment asserting an untrue DB fact — this arc's own defect
// class, and the reason 0098's date is filled by the executor rather than by a
// founder opening the file. Nothing enforced it, so a delivery cut before the
// verify results came back could be committed with its placeholder intact and
// nobody would learn until a reader trusted the line.
//
// This cell is the enforcement, and it earned its place the plain way: TWO
// different D-3a archives were presented under ONE filename, the founder
// downloaded the first, and his tree ran the pre-results build whose header
// still read as unapplied. The bench count told us (47 where 48 was expected)
// and this cell now says it in words instead of arithmetic.
t('§7.8 the Applied line is FILLED — no unapplied placeholder can be committed', () => {
  const sql = read(MIGRATION);
  assert.ok(!/\[FILLED BY THE EXECUTOR/.test(sql),
    'the migration still carries its unfilled placeholder — this build predates the verify results');
  assert.ok(!/NOT YET APPLIED/i.test(sql),
    'the header still claims the migration is unapplied');
  assert.ok(/^-- Applied: \d{4}-\d{2}-\d{2}/m.test(sql),
    'the Applied line carries no date a reader could check');
});

t('§7.5 the PARKED PAIR is untouched — not as SQL, not as comment, not commented-out', () => {
  const sql = read(MIGRATION);
  assert.ok(!/CREATE UNIQUE INDEX[\s\S]{0,200}conversations/.test(sql),
    'a unique index on conversations rode this migration — the parked pair moves together or not at all');
});

t('§7.6 no migration in the estate holds shell (F-05.80/§8.5 class, re-asserted here)', () => {
  const dir = 'db/migrations';
  const files = fs.readdirSync(SRC(dir)).filter(f => f.endsWith('.sql'));
  assert.ok(files.length > 100, `the ladder reads ${files.length} files — too few to be the real directory`);
  const SHELL = /^\s*(npm |node |git |cd |unzip |rm |cp |bash |echo )/m;
  const bad = files.filter(f => SHELL.test(fs.readFileSync(SRC(path.join(dir, f)), 'utf8')));
  assert.deepStrictEqual(bad, []);
});

// ═══════════════════════════════════════════════════════════════════════════
H('§8 — MUTATION: production code broken, each named cell proven to bite');
// ═══════════════════════════════════════════════════════════════════════════

await ta('§8.M1 the gate discards usersId again ⇒ §1.4 RED (the bride goes nameless)', async () => {
  await mutate(GATE, 'couple.id) || null, usersId };', 'couple.id) || null, usersId: null };', async () => {
    const { resolveCircleIdentityIfPresent } = fresh(RESOLVER);
    const { api } = plane();
    const req = { headers: { authorization: `Bearer ${BRIDE_JWT}` }, get(h) { return this.headers[String(h).toLowerCase()]; } };
    const out = await resolveCircleIdentityIfPresent(req, api);
    assert.strictEqual(out.userId, BRIDE.usersId);
  });
});

await ta('§8.M2 arm 2 hard-nulls the identity again ⇒ §2.1 RED (the bride cannot vote)', async () => {
  await mutate(RESOLVER, 'userId:   couple.usersId || null,', 'userId:   null,', async () => {
    const poll = { id: 'p1', couple_id: MEHEK.coupleId, options: [{ id: 'o1', label: 'A' }] };
    const r = await call('post', '/:pollId/vote', {
      auth: BRIDE_JWT, params: { pollId: 'p1' }, body: { option_id: 'o1' }, planeOpts: { polls: [poll] } });
    assert.strictEqual(r.status, 200);
  });
});

await ta('§8.M3 drop the couple scope from the vote lookup ⇒ §3.2 RED', async () => {
  await mutate(POLLS, "    .eq('couple_id', me.coupleId)\n    .maybeSingle();", '    .maybeSingle();', async () => {
    const poll = { id: 'p1', couple_id: OTHER_COUPLE, options: [{ id: 'o1', label: 'A' }] };
    const r = await call('post', '/:pollId/vote', {
      auth: memberToken(), params: { pollId: 'p1' }, body: { option_id: 'o1' }, planeOpts: { polls: [poll] } });
    assert.strictEqual(r.status, 404);
  });
});

await ta('§8.M4 trust the caller\u0027s option ids ⇒ §4.2 RED (two options, one id)', async () => {
  await mutate(POLLS, 'options.push({ id: `o${i + 1}`, label,', 'options.push({ id: rawOpts[i]?.id || `o${i + 1}`, label,', async () => {
    const r = await call('post', '/', { auth: memberToken(),
      body: { question: 'q', options: [{ label: 'A', id: 'dup' }, { label: 'B', id: 'dup' }] } });
    const ids = r.cap.inserted[0].options.map(o => o.id);
    assert.strictEqual(new Set(ids).size, ids.length);
  });
});

await ta('§8.M5 drop the option-membership check ⇒ §3.3 RED', async () => {
  await mutate(POLLS, '  if (!optionId || !known.has(optionId)) {', '  if (false) {', async () => {
    const poll = { id: 'p1', couple_id: MEHEK.coupleId, options: [{ id: 'o1', label: 'A' }] };
    const r = await call('post', '/:pollId/vote', {
      auth: memberToken(), params: { pollId: 'p1' }, body: { option_id: 'o9' }, planeOpts: { polls: [poll] } });
    assert.strictEqual(r.status, 400);
  });
});

await ta('§8.M6 ungate the vendor field ⇒ §5.1 RED (the flag stops being load-bearing)', async () => {
  await mutate(POLLS, 'if (!perms || perms.can_see_vendors)', 'if (true)', async () => {
    const r = await call('get', '/:brideId', { auth: memberToken(), params: { brideId: 'x' },
      planeOpts: { polls: [POLL_WITH_EVENT], events: [EV], visibility: {} } });
    assert.ok(!('vendor_id' in r.payload.data[0].linked_event));
  });
});

await ta('§8.M7 filter the OPTIONS by permission ⇒ §5.4 RED (a ballot nobody can answer)', async () => {
  await mutate(POLLS, '    options:       (poll.options || []).map(o => ({',
                      '    options:       (perms ? [] : (poll.options || [])).map(o => ({', async () => {
    const r = await call('get', '/:brideId', { auth: memberToken(), params: { brideId: 'x' },
      planeOpts: { polls: [POLL_WITH_EVENT], events: [EV], visibility: {} } });
    assert.strictEqual(r.payload.data[0].options.length, 2);
  });
});

await ta('§8.M8 upsert on the wrong key ⇒ §3.1 RED (two votes, one participant)', async () => {
  await mutate(POLLS, "{ onConflict: 'poll_id,voter_user_id' }", "{ onConflict: 'poll_id' }", async () => {
    const poll = { id: 'p1', couple_id: MEHEK.coupleId, options: [{ id: 'o1', label: 'A' }] };
    const r = await call('post', '/:pollId/vote', {
      auth: memberToken(), params: { pollId: 'p1' }, body: { option_id: 'o1' }, planeOpts: { polls: [poll] } });
    assert.strictEqual(r.cap.upserted[0].opts.onConflict, 'poll_id,voter_user_id');
  });
});

await ta('§8.M9 mount polls behind the Class A guard ⇒ §2.4 RED (the spec\u0027s own refusal)', async () => {
  await mutate(ROUTER, "router.use('/frost/circle/polls',    require('./circle/polls'));",
                       "router.use('/frost/circle/polls',    requireCircleMemberAuth, require('./circle/polls'));", async () => {
    const c = code(ROUTER);
    const line = c.split('\n').find(l => l.includes("'/frost/circle/polls'"));
    assert.ok(!/requireCircleMemberAuth/.test(line));
  });
});

await ta('§8.M10 the closed-poll refusal goes away ⇒ §3.4 RED', async () => {
  await mutate(POLLS, '  if (poll.closes_at && new Date(poll.closes_at) <= new Date()) {', '  if (false) {', async () => {
    const poll = { id: 'p1', couple_id: MEHEK.coupleId, closes_at: '2020-01-01T00:00:00Z',
                   options: [{ id: 'o1', label: 'A' }] };
    const r = await call('post', '/:pollId/vote', {
      auth: memberToken(), params: { pollId: 'p1' }, body: { option_id: 'o1' }, planeOpts: { polls: [poll] } });
    assert.strictEqual(r.status, 409);
  });
});

t('§8.M11 every mutation target above was FOUND before it was broken', () => {
  assert.strictEqual(ledger.length, 10, `expected 10 mutations, the ledger holds ${ledger.length}`);
});

// ═══════════════════════════════════════════════════════════════════════════
H('§9 — THE RESTORE LEDGER');
// ═══════════════════════════════════════════════════════════════════════════

t('§9.1 every mutated file was restored BYTE-IDENTICAL, checked by hash', () => {
  assert.ok(ledger.length > 0, 'no mutation ran — §8 is missing');
  assert.strictEqual(ledger.filter(m => !m.ok).length, 0);
  console.log(`         ${ledger.length} mutations, ${new Set(ledger.map(m => m.file)).size} files, all restored byte-identical`);
});

console.log('\n' + '─'.repeat(66));
console.log(`  b14_d3_polls_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
console.log('─'.repeat(66));
if (fail) { fails.forEach(f => console.log(`   RED  ${f}`)); process.exit(1); }
process.exit(0);

})().catch(e => { console.error('BENCH HARNESS ERROR:', e); process.exit(1); });
