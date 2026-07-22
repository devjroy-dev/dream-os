#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b0453_collab_wiring_bench.js — TDW_04.5 P4, THE WIRING.
//
//   node scripts/b0453_collab_wiring_bench.js
//
// b0452 proved the two one-homes. It said so in its own header: "WHAT IT DOES
// NOT PROVE, NAMED: that the ROUTER calls any of this." This bench is that
// missing witness. b0452 stays BYTE-STABLE at 52 (CE-59, fork 3) — the floor
// stays a floor rather than a moving number.
//
// WHAT IT DRIVES: the REAL src/api/vendor/collab.js and src/api/vendor/roster.js
// routers, mounted in a REAL express app, called over a REAL http listener.
// Nothing under test is stubbed. Two doubles, both transport-only:
//   · the supabase client — an in-memory store honouring the select/eq/in/gt/
//     neq/is/order/upsert/insert/update/delete chain the routers actually use,
//     and — the point of this bench — able to make a table VANISH the way
//     PostgREST does before a migration runs.
//   · the auth middlewares — require() cache injection, so the routers are
//     byte-untouched.
//
// BOTH-WAYS (non-vacuous by PRODUCTION mutation, never test setup):
//   §2  restore `.eq('requirement_type', me.category)` in collab.js's feed query
//   §3  make firstLookFilter return `() => true`
//   §4  drop `items` from the feed serializer
//   §5  make the connect seam skip addEdgesOnAccept
//   §6  make ensureBridgeMember always INSERT (src/lib/vendor/roster.js)
//   §7  remove the allItemsFilled guard on the auto-close
// Each is a real edit to a shipped file, reverted after. Recorded in the
// handover with its RED count.
//
// THE PRE-0096 WORLD IS A FIRST-CLASS CASE HERE, not an afterthought: §1 runs
// the WHOLE feed with collab_post_items, vendor_roster and first_look_until
// absent, and asserts the response is byte-identical to the pre-P4 contract.
// That is the dormancy ruling ((ii)A/(ii)B) under test, and it is the assertion
// that would have caught a 500 on every vendor's Collab tab at deploy.
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
// `absent` is the whole reason this file exists: a table named in `absent`
// answers the way PostgREST answers before its migration has run.
function makeDb(seed = {}, absent = new Set()) {
  const tables = {
    vendors: [], collab_posts: [], collab_responses: [],
    collab_post_items: [], vendor_roster: [], team_members: [],
    admin_config: [],
    ...seed,
  };
  let uid = 0;
  const nextId = (p) => `${p}-${++uid}`;
  const missing = (t) => ({ data: null, error: { message: `relation "public.${t}" does not exist` } });

  function from(table) {
    const gone = absent.has(table);
    const rows = tables[table] || (tables[table] = []);
    const q = { _f: [], _order: null };

    const matched = () => {
      let out = rows.filter(r => q._f.every(f => f(r)));
      if (q._order) {
        const { col, asc } = q._order;
        out = out.slice().sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
      }
      return out;
    };

    // A select naming a column the table doesn't have fails the WHOLE query —
    // the PostgREST behaviour that drove ruling (ii)B.
    q.select = (cols) => {
      if (typeof cols === 'string' && cols.includes('first_look_until') && absent.has('collab_posts.first_look_until')) {
        q._badCol = true;
      }
      if (typeof cols === 'string' && cols.includes('item_id') && absent.has('collab_responses.item_id')) {
        q._badCol = true;
      }
      return q;
    };
    q.eq   = (c, v) => { q._f.push(r => r[c] === v); return q; };
    q.neq  = (c, v) => { q._f.push(r => r[c] !== v); return q; };
    q.is   = (c, v) => { q._f.push(r => (r[c] ?? null) === v); return q; };
    q.gt   = (c, v) => { q._f.push(r => r[c] > v); return q; };
    q.lt   = (c, v) => { q._f.push(r => r[c] < v); return q; };
    q.in   = (c, vs) => { q._f.push(r => vs.includes(r[c])); return q; };
    q.order = (col, o) => { q._order = { col, asc: !!(o && o.ascending) }; return q; };
    // supabase-js's .not(col,'is',null) — the NOT NULL predicate F-04.112 uses.
    q.not = (c, op, v) => {
      if (op === 'is' && v === null) q._f.push(r => (r[c] ?? null) !== null);
      else q._f.push(r => r[c] !== v);
      return q;
    };
    q.limit = (n) => { q._limit = n; return q; };

    const settle = (many) => {
      if (gone) return missing(table);
      if (q._badCol) return { data: null, error: { message: 'column does not exist' } };
      const rows_ = matched();
      return { data: many ? (q._limit ? rows_.slice(0, q._limit) : rows_) : (rows_[0] || null), error: null };
    };
    q.maybeSingle = async () => settle(false);
    q.single      = async () => settle(false);
    q.then        = (resolve, reject) => Promise.resolve(settle(true)).then(resolve, reject);

    q.insert = (payload) => {
      const done = { select: () => done, maybeSingle: async () => res1, single: async () => res1, then: (r, j) => Promise.resolve(res1).then(r, j) };
      let res1;
      if (gone) { res1 = missing(table); return done; }
      const list = Array.isArray(payload) ? payload : [payload];
      const made = list.map(p => {
        const row = { id: nextId(table), member_vendor_id: null, phone: null, category: null, active: true, deleted_at: null, page_token: nextId('token'), roster_vendor_id: null, filled_by_response_id: null, ...p };
        rows.push(row); return row;
      });
      res1 = { data: Array.isArray(payload) ? made : made[0], error: null };
      return done;
    };

    q.upsert = (payload, opts) => {
      const done = { select: () => done, maybeSingle: async () => res1, then: (r, j) => Promise.resolve(res1).then(r, j) };
      let res1;
      if (gone) { res1 = missing(table); return done; }
      const keys = (opts && opts.onConflict ? opts.onConflict.split(',') : ['id']).map(s => s.trim());
      const hit = rows.find(r => keys.every(k => r[k] === payload[k]));
      if (hit) { Object.assign(hit, payload); res1 = { data: hit, error: null }; }
      else { const row = { id: nextId(table), ...payload }; rows.push(row); res1 = { data: row, error: null }; }
      return done;
    };

    q.update = (patch) => {
      const upd = { _f: [], _bad: false };
      upd.eq = (c, v) => { upd._f.push(r => r[c] === v); return upd; };
      upd.is = (c, v) => { upd._f.push(r => (r[c] ?? null) === v); return upd; };
      upd.lt = (c, v) => { upd._f.push(r => r[c] < v); return upd; };
      upd.select = () => upd;
      const run = () => {
        if (gone) return missing(table);
        // Updating a column the migration hasn't added fails, exactly as it
        // does at PostgREST — this is what makes the tolerated writes real.
        for (const k of Object.keys(patch)) {
          if (absent.has(`${table}.${k}`)) return { data: null, error: { message: `column "${k}" does not exist` } };
        }
        const hits = rows.filter(r => upd._f.every(f => f(r)));
        hits.forEach(r => Object.assign(r, patch));
        return { data: hits[0] || null, error: null };
      };
      upd.maybeSingle = async () => run();
      upd.then = (r, j) => Promise.resolve(run()).then(r, j);
      return upd;
    };

    q.delete = () => {
      const del = { _f: [] };
      del.eq = (c, v) => { del._f.push(r => r[c] === v); return del; };
      del.then = (r, j) => {
        if (gone) return Promise.resolve(missing(table)).then(r, j);
        for (let i = rows.length - 1; i >= 0; i--) if (del._f.every(f => f(rows[i]))) rows.splice(i, 1);
        return Promise.resolve({ data: null, error: null }).then(r, j);
      };
      return del;
    };

    return q;
  }
  return { from, _tables: tables };
}

// ── mount the REAL routers ──────────────────────────────────────────────────
function stubMiddleware(vendorId) {
  const reqAuth = path.join(ROOT, 'src/api/middleware/requireAuth.js');
  const resVen  = path.join(ROOT, 'src/api/middleware/resolveVendor.js');
  require.cache[require.resolve(reqAuth)] = { id: reqAuth, filename: reqAuth, loaded: true, exports: (req, res, next) => next() };
  require.cache[require.resolve(resVen)]  = { id: resVen,  filename: resVen,  loaded: true, exports: () => (req, res, next) => { req.vendor = { id: vendorId }; next(); } };
}

async function serve(db, vendorId) {
  stubMiddleware(vendorId);
  for (const m of ['src/api/vendor/collab.js', 'src/api/vendor/roster.js']) {
    delete require.cache[require.resolve(path.join(ROOT, m))];
  }
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.locals.supabase = db;
  app.use('/collab', require(path.join(ROOT, 'src/api/vendor/collab.js')));
  app.use('/roster', require(path.join(ROOT, 'src/api/vendor/roster.js')));
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
const POSTER = 'v-poster', RESP = 'v-responder', OUTSIDER = 'v-outsider';
const FUTURE = new Date(Date.now() + 30 * 86400000).toISOString();

function baseSeed() {
  return {
    vendors: [
      { id: POSTER,   category: 'planning',    city: 'Jaipur', open_to_travel: false, tier: 'prestige', users: { phone: '+919000000001', name: 'Meera' } },
      { id: RESP,     category: 'photography', city: 'Jaipur', open_to_travel: false, tier: 'signature', users: { phone: '+919000000002', name: 'Ishaan' } },
      { id: OUTSIDER, category: 'photography', city: 'Jaipur', open_to_travel: false, tier: 'signature', users: { phone: '+919000000003', name: 'Nikita' } },
    ],
    collab_posts: [],
    admin_config: [{ key: 'collab.first_look_hours', value: '12' }],
  };
}

// A legacy post: NOT NULL requirement_type, zero item rows. The F3 case.
function legacyPost(id, type) {
  return { id, vendor_id: POSTER, requirement_type: type, event_date: FUTURE, city: 'Jaipur',
           open_to_other_cities: false, budget_inr: null, payment_period: null, event_type: null,
           details: null, state: 'open', expires_at: FUTURE, created_at: '2026-07-01T00:00:00Z',
           vendors: { category: 'planning', city: 'Jaipur' } };
}

(async function main() {
  // ══ §1 — THE PRE-0096 WORLD ══════════════════════════════════════════════
  section('§1 the pre-0096 world — the deploy that lands before the migration');
  {
    const absent = new Set(['collab_post_items', 'vendor_roster', 'collab_posts.first_look_until', 'collab_responses.item_id']);
    const db = makeDb({ ...baseSeed(), collab_posts: [legacyPost('p1', 'photography'), legacyPost('p2', 'catering')] }, absent);
    const s = await serve(db, RESP);

    const feed = await s.call('GET', '/collab/feed');
    ok('the feed answers 200 with the items table absent — no 500 on a live surface', feed.status === 200);
    ok('a photographer still sees only the photography post (the .eq did not become no predicate)',
       feed.body?.feed?.length === 1 && feed.body.feed[0].id === 'p1');
    ok('the legacy post carries exactly one wrapped item',
       feed.body?.feed?.[0]?.items?.length === 1 && feed.body.feed[0].items[0].wrapped === true);
    ok('the wrapped item carries the post\'s own requirement_type',
       feed.body?.feed?.[0]?.items?.[0]?.requirement_type === 'photography');
    ok('anonymity holds: category only, no poster name and no poster id',
       feed.body?.feed?.[0]?.poster_category === 'planning'
       && !('poster_name' in (feed.body.feed[0] || {}))
       && !('vendor_id' in (feed.body.feed[0] || {})));

    // A legacy single-type create must not touch the absent table at all.
    const created = await s.call('POST', '/collab', { requirement_type: 'decor', event_date: FUTURE, city: 'Jaipur' });
    ok('a legacy single-type create still succeeds with 0096 unrun', created.status === 200 && created.body?.ok);
    ok('and it wrote no item rows', (db._tables.collab_post_items || []).length === 0);

    // ── THE SHAPE THE PWA ACTUALLY SENDS (F-04.110) ────────────────────────
    // The composer ALWAYS sends `items`, even for one requirement. The asserts
    // above drive the pre-P4 payload, which no live caller produces any more —
    // a green over an unreachable path is not evidence. These two drive the
    // real one.
    const before = db._tables.collab_posts.length;
    const oneItem = await s.call('POST', '/collab', { items: [{ requirement_type: 'venue' }], event_date: FUTURE, city: 'Jaipur' });
    ok('a ONE-item post in the CLIENT\'s payload shape still succeeds pre-0096', oneItem.status === 200 && oneItem.body?.ok);
    ok('the post SURVIVES — it is not rolled back', db._tables.collab_posts.length === before + 1);
    ok('and the post column carries the requirement, so nothing was lost',
       db._tables.collab_posts[db._tables.collab_posts.length - 1].requirement_type === 'venue');

    // A multi-item create must REFUSE, not silently drop items 2..n.
    const multi = await s.call('POST', '/collab', { items: [{ requirement_type: 'decor' }, { requirement_type: 'catering' }], event_date: FUTURE, city: 'Jaipur' });
    ok('a multi-item create REFUSES loudly rather than losing items', multi.status === 503);
    ok('and the refusal SENTENCE reaches the client in the envelope it reads',
       typeof multi.body?.error === 'string' && multi.body.error.length > 0);
    ok('and the half-made post is rolled back, never left as a silent single',
       db._tables.collab_posts.filter(p => p.requirement_type === 'decor' && p.event_type === undefined).length <= 1);

    const roster = await s.call('GET', '/roster');
    ok('the roster tab answers honestly-empty rather than 500ing', roster.status === 200 && roster.body?.roster?.length === 0);

    await s.close();
  }

  // ══ §1b — MY-POSTS CARRIES THE FIRST-LOOK VALUE (F-04.111) ═══════════════
  section('§1b my-posts carries first_look_until — the poster is TOLD, not left to infer');
  {
    const inWindow = new Date(Date.now() + 6 * 3600000).toISOString();
    const past     = new Date(Date.now() - 3600000).toISOString();
    const seed = baseSeed();
    seed.collab_posts = [
      { ...legacyPost('p1', 'photography'), first_look_until: inWindow },
      { ...legacyPost('p2', 'catering'),    first_look_until: past },
      { ...legacyPost('p3', 'decor') },     // predates the column entirely
    ];
    const s = await serve(makeDb(seed), POSTER);
    const mine = await s.call('GET', '/collab/my-posts');
    const byId = Object.fromEntries((mine.body?.posts || []).map(p => [p.id, p]));

    ok('my-posts answers 200', mine.status === 200);
    ok('a windowed post carries its first_look_until — the state line can render at last',
       byId.p1?.first_look_until === inWindow);
    ok('an elapsed window still carries the value, so "Open to everyone." can render',
       byId.p2?.first_look_until === past);
    ok('a pre-0096 post carries an explicit null, never undefined-by-omission',
       byId.p3 && byId.p3.first_look_until === null);
    ok('and every post still carries its items alongside',
       (mine.body?.posts || []).every(p => Array.isArray(p.items) && p.items.length >= 1));
    await s.close();
  }
  {
    // Pre-0096: the column is gone. my-posts must still answer, honestly blank.
    const absent = new Set(['collab_post_items', 'vendor_roster', 'collab_posts.first_look_until']);
    const seed = baseSeed();
    seed.collab_posts = [legacyPost('p1', 'photography')];
    const s = await serve(makeDb(seed, absent), POSTER);
    const mine = await s.call('GET', '/collab/my-posts');
    ok('pre-0096 my-posts still answers 200 with the column absent', mine.status === 200);
    ok('and reports no window rather than crashing or inventing one',
       mine.body?.posts?.[0]?.first_look_until === null);
    await s.close();
  }

  // ══ §1c — F-04.112: NO AUDIENCE, NO WINDOW ═══════════════════════════════
  section('§1c F-04.112 — the window is set only when someone could see it');
  const FUT = { event_date: FUTURE, city: 'Jaipur' };
  const lastPost = (db) => db._tables.collab_posts[db._tables.collab_posts.length - 1];
  {
    // A LINKED member exists — a real audience. The window must be set.
    const seed = baseSeed();
    seed.vendor_roster = [{ id: 'r1', owner_vendor_id: POSTER, member_vendor_id: RESP,
      name: 'Ishaan', phone: '+919000000002', category: 'photography', source: 'collab_accepted' }];
    const db = makeDb(seed);
    const s = await serve(db, POSTER);
    const r = await s.call('POST', '/collab', { items: [{ requirement_type: 'decor' }], ...FUT });
    ok('a post succeeds with a linked roster', r.status === 200);
    ok('and first_look_until IS SET — there is an audience to protect',
       !!lastPost(db).first_look_until);
    await s.close();
  }
  {
    // NO roster at all — the founder's live specimen. No window.
    const db = makeDb(baseSeed());
    const s = await serve(db, POSTER);
    const r = await s.call('POST', '/collab', { items: [{ requirement_type: 'decor' }], ...FUT });
    ok('a post succeeds with an EMPTY roster', r.status === 200);
    ok('and first_look_until stays NULL — the post reaches the board at once',
       !lastPost(db).first_look_until);
    await s.close();
  }
  {
    // THE SHARP CASE: a roster that LOOKS full but is all manual, phone-only
    // rows. firstLookFilter gates on member_vendor_id, so none of them could
    // see an in-window post. An empty audience wearing a full list.
    const seed = baseSeed();
    seed.vendor_roster = [
      { id: 'r1', owner_vendor_id: POSTER, member_vendor_id: null, name: 'Vera',
        phone: '+919876543210', category: 'makeup', source: 'manual' },
      { id: 'r2', owner_vendor_id: POSTER, member_vendor_id: null, name: 'Meera',
        phone: '+919876543211', category: 'decor', source: 'manual' },
    ];
    const db = makeDb(seed);
    const s = await serve(db, POSTER);
    await s.call('POST', '/collab', { items: [{ requirement_type: 'decor' }], ...FUT });
    ok('a MANUAL-ONLY roster sets NO window — it could never have seen the post',
       !lastPost(db).first_look_until);
    await s.close();
  }
  {
    // Someone ELSE's linked roster must not open a window on MY post.
    const seed = baseSeed();
    seed.vendor_roster = [{ id: 'r1', owner_vendor_id: OUTSIDER, member_vendor_id: RESP,
      name: 'Ishaan', phone: '+919000000002', category: 'photography', source: 'collab_accepted' }];
    const db = makeDb(seed);
    const s = await serve(db, POSTER);
    await s.call('POST', '/collab', { items: [{ requirement_type: 'decor' }], ...FUT });
    ok('another vendor\'s roster does not count as MY audience',
       !lastPost(db).first_look_until);
    await s.close();
  }
  {
    // Mixed: one manual + one linked. The linked one is a real audience.
    const seed = baseSeed();
    seed.vendor_roster = [
      { id: 'r1', owner_vendor_id: POSTER, member_vendor_id: null, name: 'Vera',
        phone: '+919876543210', category: 'makeup', source: 'manual' },
      { id: 'r2', owner_vendor_id: POSTER, member_vendor_id: RESP, name: 'Ishaan',
        phone: '+919000000002', category: 'photography', source: 'collab_accepted' },
    ];
    const db = makeDb(seed);
    const s = await serve(db, POSTER);
    await s.call('POST', '/collab', { items: [{ requirement_type: 'decor' }], ...FUT });
    ok('ONE linked member among manual rows is enough to open the window',
       !!lastPost(db).first_look_until);
    await s.close();
  }

  // ══ §2 — DISCOVERY READS ITEMS ═══════════════════════════════════════════
  section('§2 discovery reads items — the census catch');
  {
    const seed = baseSeed();
    seed.collab_posts = [legacyPost('p1', 'planning')];   // post column = planning
    seed.collab_post_items = [
      { id: 'i1', post_id: 'p1', position: 0, requirement_type: 'planning',    note: null, filled_by_response_id: null },
      { id: 'i2', post_id: 'p1', position: 1, requirement_type: 'photography', note: null, filled_by_response_id: null },
    ];
    const db = makeDb(seed);
    const s = await serve(db, RESP);   // RESP is a photographer

    const feed = await s.call('GET', '/collab/feed');
    ok('a photographer reaches a post whose POST COLUMN says planning, via item 2',
       feed.body?.feed?.length === 1 && feed.body.feed[0].id === 'p1');
    ok('both items serialize, in position order',
       feed.body?.feed?.[0]?.items?.map(i => i.requirement_type).join(',') === 'planning,photography');
    ok('neither item is flagged wrapped — these are stored rows',
       feed.body?.feed?.[0]?.items?.every(i => i.wrapped === false));
    await s.close();
  }
  {
    // The mirror: a category matching NO item must not reach the feed.
    const seed = baseSeed();
    seed.collab_posts = [legacyPost('p1', 'planning')];
    seed.collab_post_items = [
      { id: 'i1', post_id: 'p1', position: 0, requirement_type: 'planning', note: null, filled_by_response_id: null },
      { id: 'i2', post_id: 'p1', position: 1, requirement_type: 'decor',    note: null, filled_by_response_id: null },
    ];
    const s = await serve(makeDb(seed), RESP);
    const feed = await s.call('GET', '/collab/feed');
    ok('a photographer does NOT reach a post with no photography item', feed.body?.feed?.length === 0);
    await s.close();
  }

  // ══ §3 — FIRST LOOK, BOTH SIDES ══════════════════════════════════════════
  section('§3 first look — the poster\'s roster contains the viewer');
  {
    const inWindow = new Date(Date.now() + 6 * 3600000).toISOString();
    const seed = baseSeed();
    seed.collab_posts = [{ ...legacyPost('p1', 'photography'), first_look_until: inWindow }];
    seed.vendor_roster = [
      { id: 'r1', owner_vendor_id: POSTER, member_vendor_id: RESP, name: 'Ishaan', phone: '+919000000002', category: 'photography', source: 'collab_accepted' },
    ];

    const inside = await serve(makeDb(JSON.parse(JSON.stringify(seed))), RESP);
    const f1 = await inside.call('GET', '/collab/feed');
    ok('INSIDE the window: a vendor on the poster\'s roster sees the post', f1.body?.feed?.length === 1);
    await inside.close();

    const outside = await serve(makeDb(JSON.parse(JSON.stringify(seed))), OUTSIDER);
    const f2 = await outside.call('GET', '/collab/feed');
    ok('INSIDE the window: an equally-eligible outsider sees NOTHING', f2.body?.feed?.length === 0);
    await outside.close();

    // The same fixture, window elapsed.
    const past = JSON.parse(JSON.stringify(seed));
    past.collab_posts[0].first_look_until = new Date(Date.now() - 3600000).toISOString();
    const after = await serve(makeDb(past), OUTSIDER);
    const f3 = await after.call('GET', '/collab/feed');
    ok('AFTER the window: the same outsider now sees it — the gate opens, it does not latch', f3.body?.feed?.length === 1);
    ok('and the post is STILL anonymous to them — the gate is visibility, the serializer is anonymity',
       f3.body?.feed?.[0]?.poster_category === 'planning' && !('poster_name' in (f3.body.feed[0] || {})));
    await after.close();

    // Direction: the INVERSE edge must not open the gate.
    const inverse = JSON.parse(JSON.stringify(seed));
    inverse.vendor_roster = [{ id: 'r1', owner_vendor_id: OUTSIDER, member_vendor_id: POSTER, name: 'Meera', phone: null, category: 'planning', source: 'manual' }];
    const inv = await serve(makeDb(inverse), OUTSIDER);
    const f4 = await inv.call('GET', '/collab/feed');
    ok('the INVERSE edge does not open the gate — the predicate has a direction', f4.body?.feed?.length === 0);
    await inv.close();
  }

  // ══ §4 — CONNECT: EDGES, FILL, AUTO-CLOSE ════════════════════════════════
  section('§4 the connect seam — edges both ways, the item fills, the post closes');
  {
    const seed = baseSeed();
    seed.collab_posts = [legacyPost('p1', 'photography')];
    seed.collab_post_items = [
      { id: 'i1', post_id: 'p1', position: 0, requirement_type: 'photography', note: null, filled_by_response_id: null },
      { id: 'i2', post_id: 'p1', position: 1, requirement_type: 'decor',       note: null, filled_by_response_id: null },
    ];
    seed.collab_responses = [
      { id: 'resp1', post_id: 'p1', responder_vendor_id: RESP, state: 'interested',
        vendors: { category: 'photography', city: 'Jaipur', users: { phone: '+919000000002', name: 'Ishaan' } } },
    ];
    const db = makeDb(seed);
    const s = await serve(db, POSTER);

    const c = await s.call('POST', '/collab/p1/connect/resp1', { item_id: 'i1' });
    ok('connect succeeds', c.status === 200 && c.body?.connected === true);
    ok('the roster gained BOTH edges — poster gains responder, responder gains poster',
       db._tables.vendor_roster.length === 2);
    ok('both edges are sourced collab_accepted',
       db._tables.vendor_roster.every(r => r.source === 'collab_accepted'));
    ok('the named item is marked filled by this response',
       db._tables.collab_post_items.find(i => i.id === 'i1').filled_by_response_id === 'resp1');
    ok('ONE item still open ⇒ the post stays open (no premature close)',
       db._tables.collab_posts[0].state === 'open' && c.body?.auto_closed === false);

    // Fill the second item — now it must close.
    db._tables.collab_responses.push({ id: 'resp2', post_id: 'p1', responder_vendor_id: OUTSIDER, state: 'interested',
      vendors: { category: 'decor', city: 'Jaipur', users: { phone: '+919000000003', name: 'Nikita' } } });
    const c2 = await s.call('POST', '/collab/p1/connect/resp2', { item_id: 'i2' });
    ok('the last item filled ⇒ the post AUTO-CLOSES', c2.body?.auto_closed === true);
    ok('and it closes to the EXISTING terminal state, not a new one',
       db._tables.collab_posts[0].state === 'filled');
    await s.close();
  }
  {
    // Idempotence of the edge: connecting twice must not duplicate the roster.
    const seed = baseSeed();
    seed.collab_posts = [legacyPost('p1', 'photography')];
    seed.collab_responses = [
      { id: 'resp1', post_id: 'p1', responder_vendor_id: RESP, state: 'interested',
        vendors: { category: 'photography', city: 'Jaipur', users: { phone: '+919000000002', name: 'Ishaan' } } },
      { id: 'resp2', post_id: 'p1', responder_vendor_id: RESP, state: 'interested',
        vendors: { category: 'photography', city: 'Jaipur', users: { phone: '+919000000002', name: 'Ishaan' } } },
    ];
    const db = makeDb(seed);
    const s = await serve(db, POSTER);
    await s.call('POST', '/collab/p1/connect/resp1', {});
    await s.call('POST', '/collab/p1/connect/resp2', {});
    ok('connecting the same vendor twice leaves TWO edges, not four', db._tables.vendor_roster.length === 2);
    await s.close();
  }

  // ══ §5 — THE ROSTER DOOR ═════════════════════════════════════════════════
  section('§5 the roster door — manual add and its dedup refusal');
  {
    const db = makeDb(baseSeed());
    const s = await serve(db, POSTER);

    const a = await s.call('POST', '/roster', { name: 'Vera', phone: '9876543210', category: 'makeup' });
    ok('a manual add succeeds', a.status === 200 && a.body?.created === true);
    ok('the phone was normalised through the ONE home', db._tables.vendor_roster[0].phone === '+919876543210');

    const b = await s.call('POST', '/roster', { name: 'Vera', phone: '+91 98765 43210', category: 'makeup' });
    ok('the same person in a different phone format is REFUSED as a duplicate', b.status === 409);
    ok('and the refusal carries the founder\'s exact bytes', b.body?.message === "They're already on your roster.");
    ok('and the store still holds exactly one row', db._tables.vendor_roster.length === 1);

    const c = await s.call('POST', '/roster', { name: '', phone: '9876543211' });
    ok('a nameless add is refused', c.status === 400);
    await s.close();
  }

  // ══ §6 — THE BRIDGE DOOR ═════════════════════════════════════════════════
  section('§6 the bridge-mint door — idempotent, and it writes no events');
  {
    const seed = baseSeed();
    seed.vendor_roster = [{ id: 'r1', owner_vendor_id: POSTER, member_vendor_id: RESP, name: 'Ishaan', phone: '+919000000002', category: 'photography', source: 'collab_accepted' }];
    const db = makeDb(seed);
    const s = await serve(db, POSTER);

    const b1 = await s.call('POST', '/roster/r1/bridge', {});
    ok('the bridge mints a team_members row', b1.status === 200 && b1.body?.created === true);
    ok('it carries role external_vendor', b1.body?.member?.role === 'external_vendor');
    ok('it carries roster_vendor_id', b1.body?.member?.roster_vendor_id === 'r1');
    ok('it carries a page_token — the crew page works the instant the row exists', !!b1.body?.member?.page_token);
    ok('the phone was copied from the roster row', b1.body?.member?.phone === '+919000000002');

    const firstToken = b1.body.member.page_token;
    const b2 = await s.call('POST', '/roster/r1/bridge', {});
    ok('calling it twice is IDEMPOTENT — no second row', db._tables.team_members.length === 1);
    ok('and the page_token is the same one — a live crew URL is never silently revoked', b2.body?.member?.page_token === firstToken);
    ok('the second call reports created:false honestly', b2.body?.created === false);

    ok('the bridge door wrote NOTHING to events — eventWrite is still the only calendar writer',
       (db._tables.events || []).length === 0);

    // Another vendor's roster row is not reachable.
    const other = await serve(db, RESP);
    const b3 = await other.call('POST', '/roster/r1/bridge', {});
    ok('a vendor cannot bridge someone else\'s roster row', b3.status === 404);
    await other.close();
    await s.close();
  }

  // ══ §6b — D1: THE ROSTER GET REPORTS WHAT IS ALREADY DONE ════════════════
  section('§6b D1 — bridged is reported, so a done action stops offering itself');
  {
    const seed = baseSeed();
    seed.vendor_roster = [
      { id: 'r1', owner_vendor_id: POSTER, member_vendor_id: RESP, name: 'Ishaan',
        phone: '+919000000002', category: 'photography', source: 'collab_accepted' },
      { id: 'r2', owner_vendor_id: POSTER, member_vendor_id: null, name: 'Vera',
        phone: '+919876543210', category: 'makeup', source: 'manual' },
    ];
    const db = makeDb(seed);
    const s = await serve(db, POSTER);

    const before = await s.call('GET', '/roster');
    const b0 = Object.fromEntries((before.body?.roster || []).map(r => [r.id, r]));
    ok('an unbridged entry reports bridged:false', b0.r1?.bridged === false);
    ok('and so does a second one', b0.r2?.bridged === false);

    await s.call('POST', '/roster/r1/bridge', {});

    const after = await s.call('GET', '/roster');
    const b1 = Object.fromEntries((after.body?.roster || []).map(r => [r.id, r]));
    ok('after minting, THAT entry reports bridged:true', b1.r1?.bridged === true);
    ok('and the untouched entry is still false — the flag is per-row',
       b1.r2?.bridged === false);
    ok('the roster count is unchanged — this adds a field, not a row',
       after.body?.count === 2);

    // F8: a deactivated bridge row still counts. ensureBridgeMember REVIVES it,
    // so offering "Add to crew" again would be a no-op dressed as work.
    db._tables.team_members[0].active = false;
    const after2 = await s.call('GET', '/roster');
    const b2 = Object.fromEntries((after2.body?.roster || []).map(r => [r.id, r]));
    ok('a DEACTIVATED bridge row still reports bridged — revival is not minting',
       b2.r1?.bridged === true);
    await s.close();
  }
  {
    // Another vendor's bridge rows must not mark MY roster as done.
    const seed = baseSeed();
    seed.vendor_roster = [{ id: 'r1', owner_vendor_id: POSTER, member_vendor_id: RESP,
      name: 'Ishaan', phone: '+919000000002', category: 'photography', source: 'collab_accepted' }];
    seed.team_members = [{ id: 'tm-x', vendor_id: OUTSIDER, roster_vendor_id: 'r1',
      name: 'Ishaan', role: 'external_vendor', active: true, page_token: 'tok-x' }];
    const s = await serve(makeDb(seed), POSTER);
    const r = await s.call('GET', '/roster');
    ok('another vendor\'s bridge row does not mark MY entry bridged',
       r.body?.roster?.[0]?.bridged === false);
    await s.close();
  }

  // ══ §7 — F8: UNASSIGN NEVER REMOVES ══════════════════════════════════════
  section('§7 F8 — the bridge row is an identity, not an assignment');
  {
    const seed = baseSeed();
    seed.vendor_roster = [{ id: 'r1', owner_vendor_id: POSTER, member_vendor_id: RESP, name: 'Ishaan', phone: '+919000000002', category: 'photography', source: 'collab_accepted' }];
    const db = makeDb(seed);
    const s = await serve(db, POSTER);
    const b1 = await s.call('POST', '/roster/r1/bridge', {});
    const memberId = b1.body.member.id;

    // Simulate the unassign the events PATCH performs: it writes
    // assigned_member_ids and touches nothing else.
    db._tables.events = [{ id: 'e1', vendor_id: POSTER, assigned_member_ids: [memberId] }];
    db._tables.events[0].assigned_member_ids = [];

    ok('after an unassign the bridge row PERSISTS', db._tables.team_members.length === 1);
    ok('and it keeps its page_token — the external\'s crew page still opens',
       db._tables.team_members[0].page_token === b1.body.member.page_token);
    ok('and the roster edge persists too', db._tables.vendor_roster.length === 1);
    await s.close();
  }

  console.log(`\n══ b0453_collab_wiring_bench: ${pass} passed, ${fail} failed ══\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(err => { console.error('BENCH CRASH:', err); process.exit(1); });
