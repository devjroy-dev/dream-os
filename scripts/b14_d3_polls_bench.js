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
function plane({ polls = [], votes = [], events = [], visibility = {}, memberCount = 2 } = {}) {
  const cap = { inserted: [], upserted: [], deleted: [] };
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
      // D-3e: the delete leg. Recorded with its FILTERS so a cell can prove the
      // couple scope reached the WRITE and not merely the read before it.
      q.delete = () => { q._del = true; return q; };
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
        if (q._del) { cap.deleted.push({ eq: { ...q._eq } }); return Promise.resolve({ error: null }).then(r); }
        // The eligible-count query: `.select('id', { count:'exact', head:true })`
        // asks for a NUMBER and no rows. A plane that returned rows here would
        // let a door that forgot `head:true` pass while carrying a roster.
        if (table === 'circle_members') {
          return Promise.resolve({ count: memberCount, data: null, error: null }).then(r);
        }
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

// ── §3.4 IS NOW A FROZEN-COPY CELL (CE-33's standing note) ────────────────
// Byte ⑩ was vetoed at the founder's D-3b sitting AT ITS EXISTING HOME. It ships
// server-side rather than in `lib/circle/pollCopy.ts` because it is an API
// refusal the server must speak whether or not a browser is listening —
// duplicating it client-side would give one byte two homes. So this cell stops
// checking only the status code and pins the SENTENCE. If it moves, the bench
// reds and the veto sheet is the authority.
await ta('§3.4 [FROZEN ⑩] A CLOSED POLL refuses — 409, the vetoed byte, nothing written', async () => {
  const poll = { id: 'p1', couple_id: MEHEK.coupleId, closes_at: '2020-01-01T00:00:00Z',
                 options: [{ id: 'o1', label: 'A' }, { id: 'o2', label: 'B' }] };
  const r = await call('post', '/:pollId/vote', {
    auth: memberToken(), params: { pollId: 'p1' }, body: { option_id: 'o1' }, planeOpts: { polls: [poll] },
  });
  assert.strictEqual(r.status, 409);
  assert.strictEqual(r.payload.error, 'This poll has closed.',
    'the vetoed byte moved — the veto sheet is the authority, not this code');
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

// ── §4.3 IS NOW A FROZEN-COPY CELL — byte ② (see §3.4's note) ─────────────
await ta('§4.3 [FROZEN ②] under 2 or over 4 options is 400, the vetoed byte, nothing written', async () => {
  for (const opts of [['A'], ['A', 'B', 'C', 'D', 'E']]) {
    const r = await call('post', '/', { auth: memberToken(), body: { question: 'q', options: opts } });
    assert.strictEqual(r.status, 400, `${opts.length} options was accepted`);
    assert.strictEqual(r.payload.error, 'A poll needs between 2 and 4 options.',
      'the vetoed byte moved — the veto sheet is the authority, not this code');
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
H('§5 — [M-TRUST] THE LINKED EVENT SERVES WHOLE: no consumer, no gate, no flag');
// ═══════════════════════════════════════════════════════════════════════════

const EV = { id: 'e1', title: 'Mehendi', event_date: '2026-12-01', vendor_id: 'v1' };
const POLL_WITH_EVENT = { id: 'p1', couple_id: MEHEK.coupleId, question: 'q',
  options: [{ id: 'o1', label: 'A' }, { id: 'o2', label: 'B' }], linked_event_id: 'e1',
  created_at: '2026-08-13T00:00:00Z' };

// ── THE CELLS BELOW ARE THE OLD ONES INVERTED, AND THAT IS THE DELIVERY ────
// D-3 authored §5.1/§5.2 as a matched pair proving a FLAG WAS LOAD-BEARING: the
// vendor withheld with `vendors` off, served with it on. The founder's trust
// ruling of 2026-08-14 retired the flag — 「 1- mehek always sees the vendor
// info 」 — so the pair inverts. §5.1 now proves the vendor serves to a member
// carrying NOTHING; §5.2 proves it serves EVEN TO A MEMBER WHOSE LEGACY COLUMN
// SAYS NO. §5.2 is the stronger of the two and the reason the pair survives at
// all: 0098's column is still on the plane, still writable by hand, and a cell
// that only tested `{}` would go green on a build where the old gate had been
// quietly restored. RETIRE-WITH-THE-READER — the subject moved, the cells moved.
await ta('§5.1 an active member gets the linked event WITH the vendor, carrying nothing', async () => {
  const r = await call('get', '/:brideId', {
    auth: memberToken(), params: { brideId: 'ignored' },
    planeOpts: { polls: [POLL_WITH_EVENT], events: [EV], visibility: {} },
  });
  const ev = r.payload.data[0].linked_event;
  assert.strictEqual(ev.title, 'Mehendi', 'the event itself was withheld — the poll lost its subject');
  assert.strictEqual(ev.vendor_id, 'v1',
    'a member was denied the vendor id — the M-TRUST ruling says membership is the permission');
});

await ta('§5.2 a LEGACY {vendors:false} column CANNOT re-gate her — the flag is inert', async () => {
  const r = await call('get', '/:brideId', {
    auth: memberToken(), params: { brideId: 'ignored' },
    planeOpts: { polls: [POLL_WITH_EVENT], events: [EV], visibility: { vendors: false } },
  });
  assert.strictEqual(r.payload.data[0].linked_event.vendor_id, 'v1',
    'a stored flag still closes the vendor — the gate was restored, or never left');
});

// §5.3 survives with its assertion unchanged and its MEANING changed. It used
// to be a CONTRAST — the bride ungated where a member was gated. There is no
// contrast left; it is now a regression guard, holding that the ruling did not
// accidentally cost the bride anything on its way through.
await ta('§5.3 THE BRIDE still sees her own journey whole — the ruling cost her nothing', async () => {
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

t('§5.5 [M-TRUST] polls.js consults NO permission machinery — comment-stripped', () => {
  const c = code(POLLS);
  assert.ok(!/circlePermissions|permissionsFor/.test(c),
    'polls.js reaches a permission resolver — the module retired at M-TRUST');
  assert.ok(!/visibility\s*(\?\.|\[|\.)\s*(budget|guests|vendors|contribute_muse)/.test(c),
    'polls.js indexes the visibility column directly — a second resolver');
  assert.ok(!/\bperms\b/.test(c),
    'a `perms` binding survives in polls.js — the threaded parameter did not fully retire');
});

// The old §5.6 asked whether polls.js had invented a NEW key. The question is
// retired with the key set itself: there are no keys. The cell asks the harder
// question the ruling opened — whether ANY permission vocabulary survives here.
t('§5.6 [M-TRUST] polls.js names NO permission key at all — the vocabulary is gone', () => {
  const c = code(POLLS);
  const keys = [...c.matchAll(/can_[a-z_]+/g)].map(m => m[0]);
  assert.deepStrictEqual(keys, [],
    `polls.js still names permission keys after the retirement: ${keys.join(', ')}`);
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
H('§10 — eligible_count: the denominator the FROZEN BYTE ⑤ needs');
// ═══════════════════════════════════════════════════════════════════════════
// D-3a shipped without it because nothing had asked. The copy veto asked: ⑤ is
// frozen as "{n} of {total} voted", and its denominator is THE CIRCLE — how many
// people could answer — which no client can derive. Served from here, counting
// the bride in, because R-D3.2's whole point is that she is a participant.

await ta('§10.1 the payload carries eligible_count = active members + THE BRIDE', async () => {
  const r = await call('get', '/:brideId', {
    auth: memberToken(), params: { brideId: 'x' },
    planeOpts: { polls: [POLL_WITH_EVENT], memberCount: 2 },
  });
  assert.strictEqual(r.payload.data[0].eligible_count, 3,
    'two active members and the bride is three — a denominator that excludes her would say "2 of 2 voted" while three people held a vote');
});

await ta('§10.2 a circle with NO members still counts the bride — never zero', async () => {
  const r = await call('get', '/:brideId', {
    auth: BRIDE_JWT, params: { brideId: 'x' },
    planeOpts: { polls: [POLL_WITH_EVENT], memberCount: 0 },
  });
  assert.strictEqual(r.payload.data[0].eligible_count, 1,
    'a zero denominator would render "0 of 0 voted" and divide the surface by nothing');
});

await ta('§10.3 CREATE returns it too — the byte renders on a brand-new poll', async () => {
  const r = await call('post', '/', {
    auth: memberToken(), body: { question: 'q', options: ['A', 'B'] }, planeOpts: { memberCount: 2 },
  });
  assert.strictEqual(r.payload.data.eligible_count, 3);
});

t('§10.4 the count asks for a NUMBER, not a roster', () => {
  const c = code(POLLS);
  assert.ok(/count: 'exact', head: true/.test(c),
    'the eligible count fetches rows — a door carrying names it has no reason to hold');
});

await ta('§10.5 ONE count per page, never one per poll', async () => {
  const c = code(POLLS);
  const listBody = c.slice(c.indexOf("router.get('/:brideId'"));
  assert.strictEqual((listBody.match(/eligibleCountFor/g) || []).length, 1,
    'the roster is counted more than once on a page of polls');
});


// ═══════════════════════════════════════════════════════════════════════════
H('§11 — DELETE: a question can be taken back (D-3e)');
// ═══════════════════════════════════════════════════════════════════════════
// Founder's word 2026-08-14: DELETE ONLY, NO EDIT — a question can be unmade,
// never quietly rewritten under the votes it has already drawn.

await ta('§11.1 the bride unmakes her own poll', async () => {
  const poll = { id: 'p1', couple_id: MEHEK.coupleId, options: [{ id: 'o1', label: 'A' }] };
  const r = await call('delete', '/:pollId', {
    auth: BRIDE_JWT, params: { pollId: 'p1' }, planeOpts: { polls: [poll] } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.payload.data.deleted, true);
  assert.strictEqual(r.cap.deleted.length, 1, 'nothing was deleted');
});

await ta('§11.2 ANOTHER CIRCLE\u0027S POLL is 404 and NOTHING is deleted', async () => {
  const poll = { id: 'p1', couple_id: OTHER_COUPLE, options: [{ id: 'o1', label: 'A' }] };
  const r = await call('delete', '/:pollId', {
    auth: BRIDE_JWT, params: { pollId: 'p1' }, planeOpts: { polls: [poll] } });
  assert.strictEqual(r.status, 404);
  assert.strictEqual(r.cap.deleted.length, 0, 'a cross-circle delete landed');
});

await ta('§11.3 NO CREDENTIAL ⇒ 401 and NOTHING is deleted', async () => {
  const poll = { id: 'p1', couple_id: MEHEK.coupleId, options: [{ id: 'o1', label: 'A' }] };
  const r = await call('delete', '/:pollId', { params: { pollId: 'p1' }, planeOpts: { polls: [poll] } });
  assert.strictEqual(r.status, 401);
  assert.strictEqual(r.cap.deleted.length, 0);
});

// The scope must reach the WRITE, not only the read that precedes it. A handler
// that checks ownership and then deletes by id alone is one refactor away from
// deleting the row it merely looked at.
await ta('§11.4 the couple scope reaches the DELETE itself, not just the lookup', async () => {
  const poll = { id: 'p1', couple_id: MEHEK.coupleId, options: [{ id: 'o1', label: 'A' }] };
  const r = await call('delete', '/:pollId', {
    auth: BRIDE_JWT, params: { pollId: 'p1' }, planeOpts: { polls: [poll] } });
  assert.strictEqual(r.cap.deleted[0].eq.couple_id, MEHEK.coupleId,
    'the delete is scoped by id alone — ownership was checked and then not enforced');
  assert.strictEqual(r.cap.deleted[0].eq.id, 'p1');
});

// [F-SW.2] ABSENCE — the votes are the PLANE's job. A handler that also swept
// them would be a second implementation of a rule the schema enforces.
// THE SLICE IS BOUNDED AT BOTH ENDS. Its first cut ran from the delete handler
// to the END OF FILE and caught the LIST handler's vote query — an absence cell
// convicting a door it was never about. Third time this class has bitten in this
// arc; the lesson is the same each time: bound the slice or assert where the
// claim lives.
t('§11.5 the handler NEVER touches circle_poll_votes — the cascade owns them', () => {
  const c = code(POLLS);
  const a = c.indexOf("router.delete('/:pollId'");
  const b = c.indexOf("router.get('/:brideId'", a);
  assert.ok(a >= 0 && b > a, 'the delete handler slice was not found — this cell judged nothing');
  assert.ok(!/circle_poll_votes/.test(c.slice(a, b)),
    'the delete handler sweeps votes by hand — 0124 already cascades them');
});

// The ruled silence, asserted so a later hand does not "fix" it.
t('§11.6 unmaking writes NO activity row — the ruled silence', () => {
  const c = code(POLLS);
  assert.ok(!/circle_activity/.test(c),
    'a poll door writes an activity row; asking writes none and neither does unmaking');
});

// NO EDIT. The founder ruled delete-only; a PATCH or PUT on a poll would let a
// question be rewritten under votes already cast for the old wording.
t('§11.7 [F-SW.2] there is NO edit door — a question is unmade, never rewritten', () => {
  const c = code(POLLS);
  assert.ok(!/router\.(patch|put)\(/.test(c),
    'an edit door appeared — the founder ruled delete-only, and votes cast for old wording would survive a rewrite');
});

t('§11.8 the asker-scope arm is DECLARED, not silently built', () => {
  const raw = read(POLLS);
  assert.ok(/created_by_user_id/.test(raw) && /RE-READ THIS PARAGRAPH/.test(raw),
    'the collapsed fork is not recorded — a later reader cannot see that couple-scope and asker-scope are the same set only while create is bride-only');
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

// M6 RE-AIMED. Its old target (`if (!perms || perms.can_see_vendors)`) no longer
// exists, so the mutation would have been ABSENT and the ledger would have said
// so. It now breaks the unconditional serve the ruling installed — the same
// question asked of the new code.
await ta('§8.M6 withhold the vendor field again ⇒ §5.1 RED (the serve is load-bearing)', async () => {
  await mutate(POLLS, '      vendor_id:  linkedEvent.vendor_id || null,', '', async () => {
    const r = await call('get', '/:brideId', { auth: memberToken(), params: { brideId: 'x' },
      planeOpts: { polls: [POLL_WITH_EVENT], events: [EV], visibility: {} } });
    assert.strictEqual(r.payload.data[0].linked_event.vendor_id, 'v1');
  });
});

// M6b is NEW and it is the cell that guards the retirement itself: restore the
// gate by hand, reading the legacy column directly, and §5.2 must catch it. A
// bench that only proved the vendor serves today would go green on a tree where
// someone re-introduced the flag from the column that is still on the plane.
await ta('§8.M6b restore a hand-rolled gate off the legacy column ⇒ §5.2 RED', async () => {
  await mutate(POLLS,
    '      vendor_id:  linkedEvent.vendor_id || null,',
    '      vendor_id:  (poll && poll.__vis && poll.__vis.vendors === false) ? undefined : (linkedEvent.vendor_id || null),',
    async () => {
      const r = await call('get', '/:brideId', { auth: memberToken(), params: { brideId: 'x' },
        planeOpts: { polls: [{ ...POLL_WITH_EVENT, __vis: { vendors: false } }], events: [EV], visibility: { vendors: false } } });
      assert.strictEqual(r.payload.data[0].linked_event.vendor_id, 'v1');
    });
});

// M7's OLD replacement read `perms ? [] : …` — a binding this file no longer
// has. It would have reddened §5.4 on a ReferenceError rather than on filtering:
// a HOLLOW RED, green-looking proof of nothing. Self-caught at the re-author and
// declared rather than quietly corrected. The replacement now filters honestly.
await ta('§8.M7 filter the OPTIONS ⇒ §5.4 RED (a ballot nobody can answer)', async () => {
  await mutate(POLLS, '    options:       (poll.options || []).map(o => ({',
                      '    options:       ([]).map(o => ({', async () => {
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

await ta('§8.M11 drop the bride from the denominator ⇒ §10.1 RED', async () => {
  await mutate(POLLS, '  return (count || 0) + 1;   // + the bride', '  return (count || 0);   // + the bride', async () => {
    const r = await call('get', '/:brideId', { auth: memberToken(), params: { brideId: 'x' },
      planeOpts: { polls: [POLL_WITH_EVENT], memberCount: 2 } });
    assert.strictEqual(r.payload.data[0].eligible_count, 3);
  });
});

await ta('§8.M12 [FROZEN ⑩] move one character of the vetoed closed-poll byte ⇒ §3.4 RED', async () => {
  await mutate(POLLS, "'This poll has closed.'", "'This poll is closed.'", async () => {
    const poll = { id: 'p1', couple_id: MEHEK.coupleId, closes_at: '2020-01-01T00:00:00Z',
                   options: [{ id: 'o1', label: 'A' }] };
    const r = await call('post', '/:pollId/vote', {
      auth: memberToken(), params: { pollId: 'p1' }, body: { option_id: 'o1' }, planeOpts: { polls: [poll] } });
    assert.strictEqual(r.payload.error, 'This poll has closed.');
  });
});

await ta('§8.M13 [FROZEN ②] move one character of the vetoed option-count byte ⇒ §4.3 RED', async () => {
  await mutate(POLLS, 'A poll needs between ${MIN_OPTIONS} and ${MAX_OPTIONS} options.',
                      'A poll needs ${MIN_OPTIONS} to ${MAX_OPTIONS} options.', async () => {
    const r = await call('post', '/', { auth: memberToken(), body: { question: 'q', options: ['A'] } });
    assert.strictEqual(r.payload.error, 'A poll needs between 2 and 4 options.');
  });
});

await ta('§8.M14 drop the couple scope from the DELETE write ⇒ §11.4 RED', async () => {
  await mutate(POLLS, "    .delete()\n    .eq('id', poll.id)\n    .eq('couple_id', me.coupleId);", "    .delete()\n    .eq('id', poll.id);", async () => {
    const poll = { id: 'p1', couple_id: MEHEK.coupleId, options: [{ id: 'o1', label: 'A' }] };
    const r = await call('delete', '/:pollId', { auth: BRIDE_JWT, params: { pollId: 'p1' }, planeOpts: { polls: [poll] } });
    assert.strictEqual(r.cap.deleted[0].eq.couple_id, MEHEK.coupleId);
  });
});

// THE TARGET MUST BE UNIQUE TO THE DOOR UNDER TEST. `if (!poll) return 404` is
// written IDENTICALLY in the vote handler and the delete handler, and
// `String.replace` takes the FIRST — so the first cut of this mutation broke the
// VOTE path, left the delete guard intact, and §11.2 stayed green over it. The
// harness reported it decorative rather than passing quietly. The target now
// carries the delete's own `.select('id')`, which the vote handler does not use.
await ta('§8.M15 drop the ownership lookup ⇒ §11.2 RED (a cross-circle delete lands)', async () => {
  await mutate(POLLS, "    .select('id')\n    .eq('id', pollId)\n    .eq('couple_id', me.coupleId)\n    .maybeSingle();\n\n  if (!poll) return",
                      "    .select('id')\n    .eq('id', pollId)\n    .maybeSingle();\n\n  if (false) return", async () => {
    const poll = { id: 'p1', couple_id: OTHER_COUPLE, options: [{ id: 'o1', label: 'A' }] };
    const r = await call('delete', '/:pollId', { auth: BRIDE_JWT, params: { pollId: 'p1' }, planeOpts: { polls: [poll] } });
    assert.strictEqual(r.status, 404);
  });
});

t('§8.M16 every mutation target above was FOUND before it was broken', () => {
  assert.strictEqual(ledger.length, 16, `expected 16 mutations, the ledger holds ${ledger.length}`);
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

})().catch(e => { console.error('BENCH HARNESS ERROR:', e); process.exit(2) /* F-39.67: an unexpected throw is an ERROR, never a FAIL */; });
