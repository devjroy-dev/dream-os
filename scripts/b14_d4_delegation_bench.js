#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b14_d4_delegation_bench.js
// TDW_14 · D-4 · C-5 — DELEGATION, DRIVEN THROUGH BOTH LANES.
//
// Runnable from ANY working directory (§9). Paths resolve from __dirname.
//
//   node scripts/b14_d4_delegation_bench.js
//
// ── WHAT THIS DELIVERY IS, AND THEREFORE WHAT THIS BENCH MAY CLAIM ─────────
// D-4 delegates a JOURNEY ITEM to a SEAT in the circle. The load-bearing claims
// are not "a column exists" — they are that the SEAT and not the person is the
// subject, that a member cannot reach an item that is not hers, and that the new
// column can never be confused with the vendor array eighteen inches away in the
// same table. Every cell is written to those.
//
// ── THE MIXED-KEY REFUSAL IS THE POINT OF §5 ──────────────────────────────
// `public.events` already carries `assigned_member_ids uuid[]` — team_members
// id-space, vendor-plane, twelve vendor consumers, zero couple-side readers. A
// circle member's id in that array would surface a wedding guest inside a
// vendor's crew roster. §5 asserts, BY WALKING rather than from a list, that no
// couple- or circle-plane file touches it and no D-4 file reads it.
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

const ASSIGNED  = 'src/api/circle/assigned.js';
const EVENTS    = 'src/api/couple/events.js';
const ROUTER    = 'src/api/router.js';
const MIGRATION = 'db/migrations/0125_event_delegation.sql';

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

// ── FIXTURES OF RECORD — the founder's own rows ───────────────────────────
const MEHEK = {
  seatId:   '895a09a6-78f6-445f-a51c-7ca34933257d',   // circle_members.id — the SEAT
  usersId:  '3c8eb9e0-e746-4d95-9630-17897aa64f05',   // users.id — the person
  coupleId: '9f1f84d5-e688-4d4f-9e44-9f5da6315e52',
  phone:    '+918757788550',
};
const BRIDE = { usersId: '2900c661-4358-42d3-aa74-431053e00c0d', authUserId: '0e0c306d-37ed-4343-b3d9-b83cd5f174a3' };
const OTHER_SEAT = 'de4dbeef-1111-0000-0000-000000000000';
const BRIDE_JWT  = 'header.payload.signature';
// THE EVENT ID MUST BE A REAL UUID. `couple/events.js` guards `:eventId` with
// UUID_RE and 400s before any lookup, so the first cut of this fixture — id 'e1'
// — made every §1 cell fail at the guard while the door underneath was correct.
// A fixture that cannot pass a door's own front gate tests nothing behind it.
const EVENT_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const EV = { id: EVENT_ID, couple_id: MEHEK.coupleId, title: 'Book mehendi trial',
             event_date: '2026-12-01', event_time: null, kind: 'task', state: 'upcoming', notes: null };

// The plane honours its filters rather than swallowing them: a fake that ignores
// what it was asked for cannot convict code that fails to ask.
function plane({ events = [], seatStatus = 'active', failEventUpdate = false } = {}) {
  const cap = { updated: [], writes: [] };
  const api = {
    auth: { getUser: async (tok) => (tok === BRIDE_JWT
      ? { data: { user: { id: BRIDE.authUserId } }, error: null }
      : { data: { user: null }, error: new Error('bad') }) },
    from(table) {
      const q = { _eq: {}, _upd: null };
      q.select = () => q;
      q.eq = (c, v) => { q._eq[c] = v; return q; };
      q.is = () => q; q.order = () => q; q.limit = () => q;
      q.update = (u) => { q._upd = u; return q; };
      // `updateCoupleEvent` (the couple plane's ONE WRITER) terminates with
      // `.single()`, not `.maybeSingle()` — derived at coupleEventWrite.js:64-65.
      // The first cut of this plane implemented only `maybeSingle`, so every §1
      // cell drove the door and got `undefined` back. A fake missing a terminal
      // the production path actually uses does not test that path at all.
      q.single = async () => q.maybeSingle();
      q.maybeSingle = async () => {
        if (table === 'users') {
          if (q._eq.auth_user_id === BRIDE.authUserId) return { data: { id: BRIDE.usersId } };
          if (q._eq.id === MEHEK.usersId) return { data: { id: MEHEK.usersId, phone: MEHEK.phone } };
          if (q._eq.id === BRIDE.usersId)  return { data: { id: BRIDE.usersId, phone: '+910000000000' } };
          return { data: null };
        }
        if (table === 'couples') {
          if (q._eq.user_id === BRIDE.usersId) return { data: { id: MEHEK.coupleId } };
          return { data: null };
        }
        if (table === 'circle_members') {
          // OTHER_SEAT EXISTS — it simply belongs to another couple. Without it
          // the plane refused that id on identity alone, so §7.M1 (which drops
          // the couple predicate) changed nothing and reported itself decorative.
          // A fake that makes the forbidden thing NOT EXIST cannot prove the
          // predicate that forbids it.
          const seats = {
            [MEHEK.seatId]: { couple: MEHEK.coupleId, status: seatStatus, phone: MEHEK.phone },
            [OTHER_SEAT]:   { couple: 'de4dbeef-0000-0000-0000-000000000000', status: 'active', phone: '+919999999999' },
          };
          const id = q._eq.id
            || Object.keys(seats).find(k => seats[k].phone === q._eq.invitee_phone);
          const seat = id && seats[id];
          if (!seat) return { data: null };
          if (q._eq.couple_id !== undefined && q._eq.couple_id !== seat.couple) return { data: null };
          if (q._eq.status    !== undefined && q._eq.status    !== seat.status) return { data: null };
          // D-4c: the removal door selects `id, status, invitee_name` and READS
          // `member.status` to decide its idempotent exit. The plane returned
          // `{ id }` alone, so that branch could never be driven. Additive —
          // every existing cell reads `.id` or mere truthiness.
          return { data: { id, status: seat.status, invitee_name: 'Mehek' } };
        }
        if (table === 'events') {
          if (!q._upd) return { data: null, error: null };
          const hit = events.find(e => e.id === q._eq.id
            && (q._eq.couple_id === undefined || e.couple_id === q._eq.couple_id)
            && (q._eq.assigned_circle_member_id === undefined
                || e.assigned_circle_member_id === q._eq.assigned_circle_member_id));
          if (!hit) return { data: null, error: null };
          cap.updated.push({ eq: { ...q._eq }, updates: q._upd });
          return { data: { ...hit, ...q._upd }, error: null };
        }
        return { data: null };
      };
      q.then = (r) => {
        // ── D-4c · THE TERMINAL-LESS WRITE, WITNESSED ────────────────────────
        // The removal door's two writes are AWAITED DIRECTLY — no `.single()`,
        // no `.maybeSingle()` — so they land here and not in the terminal above.
        // Until D-4c this branch recorded nothing, which is why an ordering
        // claim could not be made at all. Recording is ADDITIVE: the resolved
        // shape below is unchanged, so no existing cell moves.
        if (q._upd) cap.writes.push({ table, eq: { ...q._eq }, updates: q._upd });
        if (table === 'events') {
          if (q._upd && failEventUpdate) {
            return Promise.resolve({ data: null, error: { message: 'bench: forced clear failure' } }).then(r);
          }
          const rows = events.filter(e =>
            (q._eq.couple_id === undefined || e.couple_id === q._eq.couple_id) &&
            (q._eq.assigned_circle_member_id === undefined
              || e.assigned_circle_member_id === q._eq.assigned_circle_member_id));
          return Promise.resolve({ data: rows, error: null }).then(r);
        }
        return Promise.resolve({ data: [], error: null }).then(r);
      };
      return q;
    },
  };
  return { api, cap };
}

async function call(router, method, routePath, { body = {}, params = {}, auth, planeOpts = {} } = {}) {
  const { api, cap } = plane(planeOpts);
  const layer = router.stack.find(l => l.route && l.route.path === routePath && l.route.methods[method]);
  assert.ok(layer, `${method.toUpperCase()} ${routePath} is not mounted`);
  const headers = {};
  if (auth) headers.authorization = `Bearer ${auth}`;
  // ── TWO LANES, TWO CREDENTIAL SHAPES, AND THEY ARE NOT INTERCHANGEABLE ──
  // The COUPLE plane's doors read `req.coupleUser`, injected upstream by
  // `requireCoupleAuth` at the mount — they never parse a header themselves. The
  // CIRCLE lane's Class B doors resolve their own identity off a Bearer. The
  // first cut of this harness sent a Bearer to both, so every §1 cell drove the
  // couple door with no `coupleUser` at all and read `undefined`.
  //
  // `coupleUser` is supplied ONLY when the caller is the bride, mirroring what
  // the real middleware would have injected — a harness that supplied it always
  // would prove nothing about who is allowed through.
  const req = { app: { locals: { supabase: api } }, headers, body, params,
                get(h) { return this.headers[String(h).toLowerCase()]; } };
  if (auth === BRIDE_JWT) req.coupleUser = { couple_id: MEHEK.coupleId };
  let status = 200, payload = null;
  const res = { status(s) { status = s; return this; }, json(b) { payload = b; return this; } };
  await new Promise((resolve) => { layer.route.stack[0].handle(req, res, resolve); setTimeout(resolve, 250); });
  return { status, payload, cap };
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
H('§1 — THE BRIDE DELEGATES, THROUGH THE DOOR THE EVENT ALREADY HAD');
// ═══════════════════════════════════════════════════════════════════════════

await ta('§1.1 she assigns a seat, and it rides the existing event PATCH', async () => {
  const r = await call(fresh(EVENTS), 'patch', '/:eventId', {
    auth: BRIDE_JWT, params: { eventId: EVENT_ID },
    body: { assigned_circle_member_id: MEHEK.seatId }, planeOpts: { events: [EV] } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.cap.updated[0].updates.assigned_circle_member_id, MEHEK.seatId);
});

await ta('§1.2 `null` CLEARS it — byte C, "No one"', async () => {
  const r = await call(fresh(EVENTS), 'patch', '/:eventId', {
    auth: BRIDE_JWT, params: { eventId: EVENT_ID }, body: { assigned_circle_member_id: null },
    planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }] } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.cap.updated[0].updates.assigned_circle_member_id, null);
});

// A FOREIGN KEY CHECKS EXISTENCE, NEVER OWNERSHIP. It would accept any
// circle_members.id, including another couple's seat.
await ta('§1.3 a seat from ANOTHER circle is 404 and NOTHING is written', async () => {
  const r = await call(fresh(EVENTS), 'patch', '/:eventId', {
    auth: BRIDE_JWT, params: { eventId: EVENT_ID },
    body: { assigned_circle_member_id: OTHER_SEAT }, planeOpts: { events: [EV] } });
  assert.strictEqual(r.status, 404);
  assert.strictEqual(r.cap.updated.length, 0, 'a stranger\u0027s seat was written onto her event');
});

await ta('§1.4 a REMOVED seat cannot be assigned — a chair nobody sits in holds nothing', async () => {
  const r = await call(fresh(EVENTS), 'patch', '/:eventId', {
    auth: BRIDE_JWT, params: { eventId: EVENT_ID },
    body: { assigned_circle_member_id: MEHEK.seatId },
    planeOpts: { events: [EV], seatStatus: 'removed' } });
  assert.strictEqual(r.status, 404);
  assert.strictEqual(r.cap.updated.length, 0);
});

await ta('§1.5 a malformed id is 400 before any lookup', async () => {
  const r = await call(fresh(EVENTS), 'patch', '/:eventId', {
    auth: BRIDE_JWT, params: { eventId: EVENT_ID },
    body: { assigned_circle_member_id: 'not-a-uuid' }, planeOpts: { events: [EV] } });
  assert.strictEqual(r.status, 400);
});

t('§1.6 the couple plane keeps ONE writer — no direct update in the door', () => {
  const c = code(EVENTS);
  assert.ok(/updates\.assigned_circle_member_id/.test(c));
  assert.ok(!/from\('events'\)[\s\S]{0,160}\.update\(/.test(c),
    'events.js writes the table directly — ARC M6 gave the couple plane one writer');
});

t('§1.7 the field REACHES THE WIRE — both projections widened', () => {
  const c = code(EVENTS);
  assert.ok(/created_at, assigned_circle_member_id'\)/.test(c),
    'the GET projection omits the column — an assignment nobody can read');
  assert.ok(/notes, assigned_circle_member_id',/.test(c),
    'the PATCH select omits it — the caller cannot confirm what it just set');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§2 — THE MEMBER HOLDS A SEAT, AND ONLY WHAT IS IN IT');
// ═══════════════════════════════════════════════════════════════════════════

await ta('§2.1 she sees what her seat holds', async () => {
  const r = await call(fresh(ASSIGNED), 'get', '/:brideId', {
    auth: memberToken(), params: { brideId: 'ignored' },
    planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }] } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.payload.data.length, 1);
  assert.strictEqual(r.payload.data[0].title, 'Book mehendi trial');
});

await ta('§2.2 she does NOT see an item assigned to another seat', async () => {
  const r = await call(fresh(ASSIGNED), 'get', '/:brideId', {
    auth: memberToken(), params: { brideId: 'ignored' },
    planeOpts: { events: [{ ...EV, assigned_circle_member_id: OTHER_SEAT }] } });
  assert.deepStrictEqual(r.payload.data, []);
});

// She is not a circle_members row. That is not a refusal: "Yours" is a member's
// tray, and her own view of who-holds-what is the events bloom's.
await ta('§2.3 THE BRIDE is admitted and holds nothing — not refused', async () => {
  const r = await call(fresh(ASSIGNED), 'get', '/:brideId', {
    auth: BRIDE_JWT, params: { brideId: 'ignored' },
    planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }] } });
  assert.strictEqual(r.status, 200, 'the bride was refused at a Class B door');
  assert.deepStrictEqual(r.payload.data, []);
});

await ta('§2.4 NO CREDENTIAL ⇒ 401 at both handlers', async () => {
  for (const [m, p, params] of [['get', '/:brideId', { brideId: 'x' }],
                                ['patch', '/:eventId/state', { eventId: 'e1' }]]) {
    const r = await call(fresh(ASSIGNED), m, p, { params, body: { state: 'done' } });
    assert.strictEqual(r.status, 401, `${m.toUpperCase()} ${p} admitted a credential-less caller`);
  }
});

// ON DELETE SET NULL only fires on a real DELETE. A seat soft-deleted to
// 'removed' still exists, so the status filter is what empties it.
await ta('§2.5 a REMOVED member holds nothing — status is load-bearing', async () => {
  const r = await call(fresh(ASSIGNED), 'get', '/:brideId', {
    auth: memberToken(), params: { brideId: 'ignored' },
    planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }], seatStatus: 'removed' } });
  assert.deepStrictEqual(r.payload.data, []);
});

t('§2.6 the door is mounted BARE — no Class A guard in front', () => {
  const c = code(ROUTER);
  const line = c.split('\n').find(l => l.includes("'/frost/circle/assigned'"));
  assert.ok(line, 'the assigned router is not mounted');
  assert.ok(!/requireCircleMemberAuth/.test(line),
    'mounted behind the Class A guard — the bride would be refused on her own journey');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§3 — SHE MARKS HER OWN ITEM DONE, AND NOTHING ELSE');
// ═══════════════════════════════════════════════════════════════════════════

await ta('§3.1 done, and back to upcoming', async () => {
  for (const state of ['done', 'upcoming']) {
    const r = await call(fresh(ASSIGNED), 'patch', '/:eventId/state', {
      auth: memberToken(), params: { eventId: EVENT_ID }, body: { state },
      planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }] } });
    assert.strictEqual(r.status, 200, `${state} was refused`);
    assert.strictEqual(r.cap.updated[0].updates.state, state);
  }
});

// Founder's word: she may finish a thing and un-finish it. Cancelling is a
// decision about the wedding, not about the doing.
await ta('§3.2 she may NOT cancel — narrower than the couple plane, deliberately', async () => {
  const r = await call(fresh(ASSIGNED), 'patch', '/:eventId/state', {
    auth: memberToken(), params: { eventId: EVENT_ID }, body: { state: 'cancelled' },
    planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }] } });
  assert.strictEqual(r.status, 400);
  assert.strictEqual(r.cap.updated.length, 0);
});

await ta('§3.3 she may not touch an item that is not HERS — 404, nothing written', async () => {
  const r = await call(fresh(ASSIGNED), 'patch', '/:eventId/state', {
    auth: memberToken(), params: { eventId: EVENT_ID }, body: { state: 'done' },
    planeOpts: { events: [{ ...EV, assigned_circle_member_id: OTHER_SEAT }] } });
  assert.strictEqual(r.status, 404);
  assert.strictEqual(r.cap.updated.length, 0);
});

t('§3.4 the write carries THREE predicates — id, couple, and seat', () => {
  const c = code(ASSIGNED);
  const body = c.slice(c.indexOf("router.patch('/:eventId/state'"));
  for (const pred of [/\.eq\('couple_id', me\.coupleId\)/,
                      /\.eq\('assigned_circle_member_id', seat\)/,
                      /\.eq\('id', req\.params\.eventId\)/]) {
    assert.ok(pred.test(body), `the state write is missing a predicate: ${pred}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
H('§4 — WHAT THE MEMBER\u0027S PAYLOAD MUST NEVER CARRY');
// ═══════════════════════════════════════════════════════════════════════════
// [F-SW.2] Her tray is her own to-dos, not a window onto the couple's vendor
// plane. The absence is payload-level, never a CSS opinion.
t('§4.1 no vendor field, no money, no lead reaches the member projection', () => {
  const c = code(ASSIGNED);
  for (const bad of ['vendor_id', 'assigned_member_ids', 'linked_lead_id',
                     'linked_binder_id', 'amount', 'budget']) {
    assert.ok(!c.includes(bad), `the member payload carries ${bad}`);
  }
});

t('§4.2 the member reads only the six fields it serves', () => {
  const c = code(ASSIGNED);
  assert.ok(/\.select\('id, title, event_date, event_time, kind, state, notes'\)/.test(c),
    'the member projection is not the narrow one');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§5 — THE MIXED-KEY REFUSAL: the vendor array stays vendor-plane');
// ═══════════════════════════════════════════════════════════════════════════

function walk(dir, out = []) {
  for (const e of fs.readdirSync(SRC(dir), { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(rel, out); }
    else if (e.name.endsWith('.js')) out.push(rel);
  }
  return out;
}
const ALL = walk('src');
const COUPLE_PLANE = ALL.filter(f => /^src\/api\/(couple|circle)\//.test(f) || f === 'src/lib/coupleEventWrite.js');

t('§5.1 NO couple- or circle-plane file touches assigned_member_ids', () => {
  const offenders = COUPLE_PLANE.filter(f => /assigned_member_ids/.test(code(f)));
  console.log(`         couple/circle-plane files walked: ${COUPLE_PLANE.length}`);
  assert.deepStrictEqual(offenders, [],
    `these reach the VENDOR array from the couple plane: ${offenders.join(' · ')}`);
});

t('§5.2 NO D-4 file reads the vendor array', () => {
  for (const f of [ASSIGNED, EVENTS]) {
    assert.ok(!/assigned_member_ids/.test(code(f)), `${f} reads the vendor array`);
  }
});

t('§5.3 the two columns never appear in one expression', () => {
  const c = code(ASSIGNED) + code(EVENTS);
  assert.ok(!/assigned_member_ids[\s\S]{0,80}assigned_circle_member_id/.test(c));
  assert.ok(!/assigned_circle_member_id[\s\S]{0,80}assigned_member_ids/.test(c));
});

// ═══════════════════════════════════════════════════════════════════════════
H('§6 — THE MIGRATION (R-D4.1)');
// ═══════════════════════════════════════════════════════════════════════════

t('§6.1 the column is nullable and references circle_members', () => {
  const m = read(MIGRATION);
  assert.ok(/ADD COLUMN IF NOT EXISTS assigned_circle_member_id uuid NULL/.test(m));
  assert.ok(/REFERENCES public\.circle_members\(id\)/.test(m));
});

// THE RULING LIVES IN THE DELETE RULE. A CASCADE would delete her EVENT.
// COMMENTS STRIPPED FIRST. This migration's header and its Block-2 EXPECT line
// both QUOTE the delete rule to explain it, so an assertion over the raw file
// reads the prose describing the rule rather than the DDL declaring it — and
// §7.M10, which flips the real statement to CASCADE, sailed straight through.
// The comment-blindness law, in SQL this time.
// STRIPPING `--` LINES IS NOT ENOUGH HERE, and that took two passes to see.
// The rule is quoted in three places: the header prose, Block 2's EXPECT line,
// and — the one that fooled the second attempt — the `COMMENT ON COLUMN` body,
// which is a SQL STRING LITERAL, not a comment, and survives any `--` filter.
// §7.M10 flipped the real statement to CASCADE and the assertion went on
// matching the sentence that DESCRIBES the rule.
//
// The cell now reads the ALTER TABLE statement alone — the only place the rule
// is declared rather than discussed.
t('§6.2 ON DELETE SET NULL — a seat emptied returns the task, never deletes it', () => {
  const m = read(MIGRATION);
  const stmt = (m.match(/ALTER TABLE public\.events[\s\S]*?;/) || [''])[0];
  assert.ok(stmt.length > 40, 'the ALTER statement was not found — this cell judged nothing');
  assert.ok(/circle_members\(id\) ON DELETE SET NULL/.test(stmt),
    'the delete rule is not SET NULL — CASCADE here would delete the bride\u0027s event');
  assert.ok(!/ON DELETE CASCADE/.test(stmt),
    'the DDL cascades — removing a member would delete her events');
});

t('§6.3 the verify reads pg_constraint, and each block is pasted ALONE', () => {
  const m = read(MIGRATION);
  assert.ok(/pg_constraint/.test(m), 'the verify infers the delete rule from rows');
  assert.ok((m.match(/paste alone/g) || []).length >= 4);
});

t('§6.4 the address is IN ORDER — no F-SW.3 line owed, and it says so', () => {
  const m = read(MIGRATION).replace(/^--\s?/gm, '').replace(/\s+/g, ' ');
  assert.ok(/F-SW\.3's out-of-order rule DOES NOT APPLY/.test(m));
  // (M-SCHEMA-REG R-34.48) SCOPED TO THE REGISTER, NOT THE WHOLE HEADER.
  // This used to test !/0125/ across the entire header slice. The intent was
  // always right and the scope was always wrong; it merely looked right while
  // the header was frozen. The 2026-08-15 regen advanced the applied tip past
  // 0123, and `0125` now appears in that slice twice for entirely legitimate
  // reasons — as the ladder tip, and inside the `0001`-`0125` range sentence.
  // A false red, and it fired at the regen, before the register was emptied.
  // What the cell means is "0125 is not a ROW in the out-of-order register",
  // so that is what it now reads: the register's own region, table or empty
  // line, and nothing above it.
  const doc = read('docs/db/PUBLIC_SCHEMA.md');
  const header = doc.slice(0, doc.indexOf('## public.'));
  const start = header.indexOf('| out-of-order migration |');
  const region = start === -1 ? '' : header.slice(start);
  assert.ok(!/0125/.test(region),
    'an in-order migration wrongly added itself to the staleness table');
});

t('§6.5 the migration RECORDS why the vendor array was not reused', () => {
  const m = read(MIGRATION);
  assert.ok(/assigned_member_ids/.test(m) && /team_members/.test(m),
    'the refusal is unrecorded — a later hand cannot see why two assignee concepts exist');
});

t('§6.6 no migration in the estate holds shell (F-05.80 class)', () => {
  const files = fs.readdirSync(SRC('db/migrations')).filter(f => f.endsWith('.sql'));
  assert.ok(files.length > 100, `the ladder reads ${files.length} files — too few to be real`);
  const SHELL = /^\s*(npm |node |git |cd |unzip |rm |cp |bash |echo )/m;
  assert.deepStrictEqual(files.filter(f => SHELL.test(fs.readFileSync(SRC(path.join('db/migrations', f)), 'utf8'))), []);
});

// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
H('§8 — D-4c · THE REMOVAL CLEARS THE PLANE (F-14.12, R-33.6)');
// ═══════════════════════════════════════════════════════════════════════════
//
// ── WHY THIS SECTION EXISTS, AND WHY §6 WAS NOT ENOUGH ─────────────────────
// §6 reads 0125's `ON DELETE SET NULL` out of the migration and §7.M10 proves
// that cell bites. Both are correct and both are GREEN OVER A PATH NOTHING
// TAKES: no code in this estate ever DELETEs a `circle_members` row, so the
// constraint has never fired in production and could not.
//
// R-33.6, minted on exactly this: a rule read from the catalogue proves the
// rule EXISTS, never that any live path TAKES it. A behavioural ruling's cell
// asserts the PATH; the constraint is belt-and-braces.
//
// So the cells below DRIVE THE REMOVAL DOOR rather than reading a schema. §8.1
// is the source cell R-33.6 demands; §8.2-§8.5 are the door itself, executed.
const CIRCLE_DOOR = 'src/api/couple/circle.js';

// ── AN UNCURED TREE MUST YIELD A RED SET, NEVER A STACK TRACE ──────────────
// These two derivations were first written at MODULE SCOPE with bare asserts.
// At 6c84830 the clear does not exist, so the bench THREW before its first cell
// and exited 1 — which looks like the red the both-ways leg wants and is not: a
// typo in this file would exit 1 identically, and nothing would name what is
// missing. A CRASH IS NOT A RED. Both are now functions, called inside cells, so
// the uncured tree reports §8.1-§8.5 RED BY NAME.
//
// I wrote this same warning into the D-4b bench's own header and then made the
// mistake here, which is worth leaving on the record: writing a lesson down is
// not the same as having learnt it.
//
// BOUNDED TO THE HANDLER, never the file: `circle.js` is 460 lines and carries
// other `.from('events')` work. A file-wide grep would pass on a clear that
// lives anywhere at all.
const REMOVAL_HANDLER = () => {
  const c = code(CIRCLE_DOOR);
  const i = c.indexOf("router.delete('/member/:memberId'");
  assert.ok(i > -1, 'the removal handler is not where this bench expects it');
  const j = c.indexOf("router.get('/member/:memberId'", i);
  return c.slice(i, j > -1 ? j : c.length);
};

// ── AND BOUNDED AGAIN, TO THE CLEAR STATEMENT ITSELF ───────────────────────
// §8.1's first cut asserted `.eq('couple_id', couple_id)` anywhere in the
// handler — and THE STATUS FLIP twenty lines down carries that same predicate,
// so the assertion passed while reading the wrong statement. Mutation §7.M12,
// which strips the predicate off the clear, went green and reported itself
// decorative. Caught by its own mutation leg, not by the eye.
//
// This is the exact twin of the D-4b bench's §3.1 — where a column assertion
// read `updateEvent`'s patch type while claiming `CoupleEvent` — found the same
// way, one delivery apart. R-33.3: the radius equals the claim, and "the
// handler" is not the claim when the claim is "the clear".
const CLEAR_STMT = () => {
  const h = REMOVAL_HANDLER();
  const i = h.indexOf(".from('events')");
  assert.ok(i > -1, 'the removal door never touches the events plane — the ruling is unenforced');
  return h.slice(i, h.indexOf(';', i));
};

t('§8.1 R-33.6 — the CLEAR lives IN the removal handler, scoped by BOTH keys', () => {
  const s = CLEAR_STMT();
  assert.ok(/\.update\(\{ assigned_circle_member_id: null \}\)/.test(s),
    'the door touches events but does not null the delegation column');
  assert.ok(/\.eq\('couple_id', couple_id\)/.test(s),
    'the CLEAR is not scoped by the proven couple (the status flip carrying it does not count)');
  assert.ok(/\.eq\('assigned_circle_member_id', memberId\)/.test(s),
    'the clear is not scoped by the seat — it would blank the whole couple');
});

await ta('§8.2 the door, DRIVEN: removing a member nulls her delegations', async () => {
  const r = await call(fresh(CIRCLE_DOOR), 'delete', '/member/:memberId', {
    auth: BRIDE_JWT, params: { memberId: MEHEK.seatId },
    planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }] } });
  assert.strictEqual(r.status, 200);
  const clear = r.cap.writes.find(w => w.table === 'events');
  assert.ok(clear, 'the removal completed without ever writing to the events plane');
  assert.strictEqual(clear.updates.assigned_circle_member_id, null);
  assert.strictEqual(clear.eq.couple_id, MEHEK.coupleId);
  assert.strictEqual(clear.eq.assigned_circle_member_id, MEHEK.seatId);
});

await ta('§8.3 THE ORDERING — clear precedes flip, never the reverse', async () => {
  const r = await call(fresh(CIRCLE_DOOR), 'delete', '/member/:memberId', {
    auth: BRIDE_JWT, params: { memberId: MEHEK.seatId },
    planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }] } });
  const tables = r.cap.writes.map(w => w.table);
  assert.deepStrictEqual(tables, ['events', 'circle_members'],
    `writes landed in the order ${tables.join(' -> ')}; the invariant needs events first`);
});

await ta('§8.4 A FAILED CLEAR REFUSES THE REMOVAL WHOLE — nothing half-done', async () => {
  const r = await call(fresh(CIRCLE_DOOR), 'delete', '/member/:memberId', {
    auth: BRIDE_JWT, params: { memberId: MEHEK.seatId },
    planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }],
                 failEventUpdate: true } });
  assert.strictEqual(r.status, 500);
  assert.ok(!r.cap.writes.some(w => w.table === 'circle_members'),
    'the member was removed anyway — a live pointer at somebody gone, the ghost the ruling forbids');
});

await ta('§8.5 THE ALREADY-REMOVED EXIT OWES THE CLEAR TOO — self-healing', async () => {
  // The pre-D-4c handler short-circuited on status==='removed' before touching
  // anything. That exit still ends with status='removed', so the invariant binds
  // it. It is also what repairs a row stranded by the old code: production's one
  // specimen was cleared by founder SQL on 2026-08-14, and this is what keeps
  // the count at zero without a cron.
  const r = await call(fresh(CIRCLE_DOOR), 'delete', '/member/:memberId', {
    auth: BRIDE_JWT, params: { memberId: MEHEK.seatId },
    planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }],
                 seatStatus: 'removed' } });
  assert.strictEqual(r.status, 200);
  assert.ok(r.cap.writes.some(w => w.table === 'events'),
    'an already-removed member exits without clearing — the stranding survives');
});

t('§8.6 THE SOFT DELETE STAYS — the row is not deleted to reach the constraint', () => {
  assert.ok(/\.update\(\{ status: 'removed' \}\)/.test(REMOVAL_HANDLER()));
  assert.ok(!/from\('circle_members'\)[\s\S]{0,200}\.delete\(/.test(code(CIRCLE_DOOR)),
    'the row is hard-deleted — joined_at, the invite token and every activity attribution go with it');
});

t('§8.7 0125 IS UNTOUCHED — LD-8, and the FK remains belt-and-braces', () => {
  const stmt = (read(MIGRATION).match(/ALTER TABLE public\.events[\s\S]*?;/) || [''])[0];
  assert.ok(/ON DELETE SET NULL/.test(stmt),
    'an applied migration was edited, or the constraint was weakened');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§7 — MUTATION: production code broken, each named cell proven to bite');
// ═══════════════════════════════════════════════════════════════════════════

await ta('§7.M1 drop the couple predicate from the seat lookup ⇒ §1.3 RED', async () => {
  await mutate(EVENTS, "        .eq('couple_id', couple_id)      // HER circle — the FK cannot say this\n", '', async () => {
    const r = await call(fresh(EVENTS), 'patch', '/:eventId', {
      auth: BRIDE_JWT, params: { eventId: EVENT_ID },
      body: { assigned_circle_member_id: OTHER_SEAT }, planeOpts: { events: [EV] } });
    assert.strictEqual(r.status, 404);
  });
});

await ta('§7.M2 drop the active-status filter ⇒ §1.4 RED', async () => {
  await mutate(EVENTS, "        .eq('status', 'active')          // and a removed seat holds nothing\n", '', async () => {
    const r = await call(fresh(EVENTS), 'patch', '/:eventId', {
      auth: BRIDE_JWT, params: { eventId: EVENT_ID },
      body: { assigned_circle_member_id: MEHEK.seatId },
      planeOpts: { events: [EV], seatStatus: 'removed' } });
    assert.strictEqual(r.status, 404);
  });
});

await ta('§7.M3 the GET projection loses the column ⇒ §1.7 RED', async () => {
  await mutate(EVENTS, "created_at, assigned_circle_member_id')", "created_at')", async () => {
    assert.ok(/created_at, assigned_circle_member_id'\)/.test(code(EVENTS)));
  });
});

await ta('§7.M4 the member\u0027s seat filter goes ⇒ §2.2 RED (she sees everyone\u0027s)', async () => {
  await mutate(ASSIGNED, "    .eq('assigned_circle_member_id', seat)\n    .is('deleted_at', null)", "    .is('deleted_at', null)", async () => {
    const r = await call(fresh(ASSIGNED), 'get', '/:brideId', {
      auth: memberToken(), params: { brideId: 'ignored' },
      planeOpts: { events: [{ ...EV, assigned_circle_member_id: OTHER_SEAT }] } });
    assert.deepStrictEqual(r.payload.data, []);
  });
});

await ta('§7.M5 the seat lookup stops checking status ⇒ §2.5 RED', async () => {
  await mutate(ASSIGNED, "    .eq('status', 'active')\n    .maybeSingle();\n  return member ? member.id : null;",
                         "    .maybeSingle();\n  return member ? member.id : null;", async () => {
    const r = await call(fresh(ASSIGNED), 'get', '/:brideId', {
      auth: memberToken(), params: { brideId: 'ignored' },
      planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }], seatStatus: 'removed' } });
    assert.deepStrictEqual(r.payload.data, []);
  });
});

await ta('§7.M6 the member gains `cancelled` ⇒ §3.2 RED', async () => {
  await mutate(ASSIGNED, "  if (state !== 'done' && state !== 'upcoming') {", '  if (false) {', async () => {
    const r = await call(fresh(ASSIGNED), 'patch', '/:eventId/state', {
      auth: memberToken(), params: { eventId: EVENT_ID }, body: { state: 'cancelled' },
      planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }] } });
    assert.strictEqual(r.status, 400);
  });
});

await ta('§7.M7 the state write drops the seat predicate ⇒ §3.3 RED', async () => {
  await mutate(ASSIGNED, "    .eq('assigned_circle_member_id', seat)\n    .select('id, title, event_date, event_time, kind, state, notes')",
                         "    .select('id, title, event_date, event_time, kind, state, notes')", async () => {
    const r = await call(fresh(ASSIGNED), 'patch', '/:eventId/state', {
      auth: memberToken(), params: { eventId: EVENT_ID }, body: { state: 'done' },
      planeOpts: { events: [{ ...EV, assigned_circle_member_id: OTHER_SEAT }] } });
    assert.strictEqual(r.status, 404);
  });
});

await ta('§7.M8 the vendor array enters the member payload ⇒ §4.1/§5.2 RED', async () => {
  await mutate(ASSIGNED, "'id, title, event_date, event_time, kind, state, notes'",
                         "'id, title, event_date, event_time, kind, state, notes, assigned_member_ids'", async () => {
    assert.ok(!code(ASSIGNED).includes('assigned_member_ids'));
  });
});

await ta('§7.M9 the door is mounted behind the Class A guard ⇒ §2.6 RED', async () => {
  await mutate(ROUTER, "router.use('/frost/circle/assigned', require('./circle/assigned'));",
                       "router.use('/frost/circle/assigned', requireCircleMemberAuth, require('./circle/assigned'));", async () => {
    const line = code(ROUTER).split('\n').find(l => l.includes("'/frost/circle/assigned'"));
    assert.ok(!/requireCircleMemberAuth/.test(line));
  });
});

// A MUTATION'S PROBE MUST MIRROR THE CELL IT NAMES. This probe read the RAW
// file while §6.2 reads the ALTER statement, so it matched Block 2's EXPECT
// comment — which quotes the rule verbatim to tell the founder what to look for
// — and reported §6.2 decorative while §6.2 was in fact correct. The probe was
// wrong, not the cell. It now runs the same scoping.
await ta('§7.M10 the delete rule becomes CASCADE ⇒ §6.2 RED (her event would be deleted)', async () => {
  // THE TARGET CARRIES `public.` BECAUSE THE PROSE DOES NOT. Filling the apply
  // date quoted the rule in the header, which made the bare text non-unique and
  // sent `String.replace` at a COMMENT — the DDL stayed SET NULL and this
  // mutation reported itself decorative over correct code. Third time in this
  // arc that documenting a rule in its own file broke a mutation target:
  // WRITING A RULE DOWN BESIDE ITS CODE MAKES THE RULE'S TEXT AMBIGUOUS, and
  // the target must be the statement's syntax, never the sentence's words.
  await mutate(MIGRATION, 'public.circle_members(id) ON DELETE SET NULL', 'public.circle_members(id) ON DELETE CASCADE', async () => {
    const stmt = (read(MIGRATION).match(/ALTER TABLE public\.events[\s\S]*?;/) || [''])[0];
    assert.ok(/circle_members\(id\) ON DELETE SET NULL/.test(stmt));
    assert.ok(!/ON DELETE CASCADE/.test(stmt));
  });
});

// ── D-4c's mutations (F-14.12) ─────────────────────────────────────────────
// R-33.4: each target is CODE, and each was verified UNIQUE on the FINAL tree.
await ta('§7.M11 the removal stops clearing the plane ⇒ §8.1/§8.2 RED (F-14.12 returns)', async () => {
  await mutate(CIRCLE_DOOR,
    "  const { error: cErr } = await supabase\n    .from('events')\n    .update({ assigned_circle_member_id: null })",
    "  const cErr = null; await Promise.resolve();\n  if (false) await supabase\n    .from('events')\n    .update({ assigned_circle_member_id: null })", async () => {
    const r = await call(fresh(CIRCLE_DOOR), 'delete', '/member/:memberId', {
      auth: BRIDE_JWT, params: { memberId: MEHEK.seatId },
      planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }] } });
    assert.ok(r.cap.writes.some(w => w.table === 'events'));
  });
});

await ta('§7.M12 the clear drops the couple predicate ⇒ §8.1 RED (it would blank the couple)', async () => {
  await mutate(CIRCLE_DOOR,
    "    .update({ assigned_circle_member_id: null })\n    .eq('couple_id', couple_id)\n    .eq('assigned_circle_member_id', memberId);",
    "    .update({ assigned_circle_member_id: null })\n    .eq('assigned_circle_member_id', memberId);", async () => {
    // A PROBE MUST MIRROR THE CELL IT NAMES (§7.M10's tuition, paid again). The
    // first cut searched the whole handler and matched the STATUS FLIP's own
    // couple predicate, so it passed over the broken clear and reported itself
    // decorative. It now re-derives the CLEAR STATEMENT exactly as §8.1 does.
    assert.ok(/\.eq\('couple_id', couple_id\)/.test(CLEAR_STMT()));
  });
});

await ta('§7.M13 a failed clear stops refusing ⇒ §8.4 RED (the removal goes half-done)', async () => {
  await mutate(CIRCLE_DOOR,
    "    console.error('[DELETE /couple/circle/member] delegation clear error:', cErr.message);\n    return errRes(res, 500, 'Could not remove member.');",
    "    console.error('[DELETE /couple/circle/member] delegation clear error:', cErr.message);", async () => {
    const r = await call(fresh(CIRCLE_DOOR), 'delete', '/member/:memberId', {
      auth: BRIDE_JWT, params: { memberId: MEHEK.seatId },
      planeOpts: { events: [{ ...EV, assigned_circle_member_id: MEHEK.seatId }],
                   failEventUpdate: true } });
    assert.strictEqual(r.status, 500);
    assert.ok(!r.cap.writes.some(w => w.table === 'circle_members'));
  });
});

t('§7.M11 every mutation target above was FOUND before it was broken', () => {
  assert.strictEqual(ledger.length, 13, `expected 13 mutations, the ledger holds ${ledger.length}`);
});

// ═══════════════════════════════════════════════════════════════════════════
H('§8 — THE RESTORE LEDGER');
// ═══════════════════════════════════════════════════════════════════════════

t('§8.1 every mutated file was restored BYTE-IDENTICAL, checked by sha256', () => {
  assert.ok(ledger.length > 0, 'no mutation ran — §7 is missing');
  assert.strictEqual(ledger.filter(m => !m.ok).length, 0);
  console.log(`         ${ledger.length} mutations, ${new Set(ledger.map(m => m.file)).size} files, all restored byte-identical`);
});

console.log('\n' + '─'.repeat(66));
console.log(`  b14_d4_delegation_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
console.log('─'.repeat(66));
if (fail) { fails.forEach(f => console.log(`   RED  ${f}`)); process.exit(1); }
process.exit(0);

})().catch(e => { console.error('BENCH HARNESS ERROR:', e); process.exit(2) /* F-39.67: an unexpected throw is an ERROR, never a FAIL */; });
