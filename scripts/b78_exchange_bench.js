#!/usr/bin/env node
'use strict';
// scripts/b78_exchange_bench.js — G5.3 · THE INFLUENCER EXCHANGE (CE-42 4c-3b-1s), seat R7.
// Base dream-os 0b7dfc9.
//
// NUMBERED b78, DERIVED ACROSS BOTH REPOS AT THE CUT (b69's rule): dream-os holds
// b72/b73/b75/b77 (b77 is R6's Sunday bench, landed at 0b7dfc9), dreamos-pwa holds
// b74/b75/b76. First free rung: 78.
//
// Every cell drives PRODUCTION source: src/lib/vendor/exchange.js, the door file, me.js's
// field arrays, and 0166. The supabase double answers the PostgREST chains those files
// build over real row shapes (vendors per PUBLIC_SCHEMA.md @0154 :1382 + 0166 §1; the two
// new tables per 0166 §2/§3) and RECORDS EVERY WRITE, so "a refusal writes nothing" and
// "an illegal transition moves zero rows" are ASSERTED rather than argued.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let PASS = 0; const FAILS = [];
async function cell(name, fn) {
  try { await fn(); PASS++; console.log(`  GREEN  ${name}`); }
  catch (e) { FAILS.push(name); console.log(`  RED    ${name}\n         ${e && e.message}`); }
}
const read  = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

// ── the double (b75's, plus `neq` which this plane's browse predicate needs) ───
function makeDb(tables) {
  const db = JSON.parse(JSON.stringify(tables));
  db.__writes = [];
  db.__failInsert = null;
  let seq = 0;
  function q(name) {
    let op = 'select'; let payload = null; const filters = [];
    let orderBy = null; let single = false;
    const apply = () => {
      let r = (db[name] || []).slice();
      for (const f of filters) r = r.filter(f);
      if (orderBy) r.sort((a, b) => (a[orderBy.col] < b[orderBy.col] ? 1 : -1) * (orderBy.asc ? -1 : 1));
      return r;
    };
    const api = {
      select() { return api; },
      eq(c, v)  { filters.push((r) => r[c] === v); return api; },
      neq(c, v) { filters.push((r) => r[c] !== v); return api; },
      in(c, vs) { filters.push((r) => vs.includes(r[c])); return api; },
      order(c, o) { orderBy = { col: c, asc: !o || o.ascending !== false }; return api; },
      insert(p) { op = 'insert'; payload = p; return api; },
      update(p) { op = 'update'; payload = p; return api; },
      single() { single = true; return api; },
      maybeSingle() { single = true; return api; },
      then(resolve) {
        if (op === 'insert') {
          if (db.__failInsert && db.__failInsert.table === name) { const e = db.__failInsert.error; db.__failInsert = null; return resolve({ data: null, error: e }); }
          // `state: 'sent'` here stands in for the COLUMN DEFAULT (0166 §2), so the
          // row looks as Postgres would return it. The PAYLOAD is recorded separately
          // — asserting on `row` would be asserting on this double, not on the writer.
          const row = Object.assign({ id: `${name}-${++seq}`, state: 'sent', created_at: new Date().toISOString() }, payload);
          (db[name] = db[name] || []).push(row);
          db.__writes.push({ table: name, op, row, payload });
          return resolve({ data: single ? row : [row], error: null });
        }
        if (op === 'update') {
          const hit = apply();
          for (const r of hit) Object.assign(r, payload);
          db.__writes.push({ table: name, op, patch: payload, n: hit.length });
          return resolve({ data: hit, error: null });
        }
        const r = apply();
        return resolve({ data: single ? (r[0] || null) : r, error: null });
      },
    };
    return api;
  }
  return Object.assign(db, { from: q });
}

// DEV440 is the sender; SWATI is the creator fixture the founder will make on a clean
// number (§6 of the packet). MEHER is a creator who never opted in; KABIR is a second
// sender. Every id and name here is a FIXTURE and ships nowhere.
const SENDER  = { id: 'v-dev440', business_name: 'DEV440 Studio', category: 'photography', city: 'Delhi NCR' };
const CREATOR = { id: 'v-swati',  business_name: 'Swati Roy',     category: 'content_creator', city: 'Delhi NCR', exchange_discoverable: true };
const day = (n) => new Date(Date.now() - n * 864e5).toISOString();

function tables(over = {}) {
  return Object.assign({
    vendors: [
      { id: SENDER.id,  business_name: SENDER.business_name,  category: 'photography',      city: 'Delhi NCR', status: 'active', instagram_handle: '@dev440',  exchange_discoverable: false, pin_hash: 'SECRET', account_number: 'SECRET' },
      { id: CREATOR.id, business_name: CREATOR.business_name, category: 'content_creator',  city: 'Delhi NCR', status: 'active', instagram_handle: '@swati',   exchange_discoverable: true,  pin_hash: 'SECRET', account_number: 'SECRET' },
      { id: 'v-meher',  business_name: 'Meher Joshi',         category: 'content_creator',  city: 'Jaipur',    status: 'active', instagram_handle: '@meher',   exchange_discoverable: false, pin_hash: 'SECRET' },
      { id: 'v-gone',   business_name: 'Gone Creator',        category: 'content_creator',  city: 'Delhi NCR', status: 'inactive', instagram_handle: '@gone',  exchange_discoverable: true,  pin_hash: 'SECRET' },
      { id: 'v-huge',   business_name: 'Huge Following',      category: 'content_creator',  city: 'Delhi NCR', status: 'active', instagram_handle: '@huge',    exchange_discoverable: true,  pin_hash: 'SECRET' },
      { id: 'v-kabir',  business_name: 'Frames by Kabir',     category: 'photography',      city: 'Delhi NCR', status: 'active', instagram_handle: '@kabir',   exchange_discoverable: false },
    ],
    influencer_reach_snapshots: [
      // SWATI: modest count, STRONG Delhi fit, fresh.
      { vendor_id: CREATOR.id, follower_count: 11200, engagement_rate: '5.30', verified_at: day(2),
        audience_city: [{ city: 'Delhi NCR', pct: 62 }], audience_age: [{ band: '25\u201334', pct: 49 }], audience_gender: [{ k: 'Women', pct: 84 }] },
      // HUGE: three times the followers, WEAK Delhi fit — must sort BELOW Swati.
      { vendor_id: 'v-huge', follower_count: 380000, engagement_rate: '1.10', verified_at: day(3),
        audience_city: [{ city: 'Mumbai', pct: 71 }, { city: 'Delhi NCR', pct: 4 }], audience_age: [], audience_gender: [] },
      // An OLD snapshot for Swati — newest-per-vendor must win over this one.
      { vendor_id: CREATOR.id, follower_count: 900, engagement_rate: '0.10', verified_at: day(400),
        audience_city: [{ city: 'Delhi NCR', pct: 1 }], audience_age: [], audience_gender: [] },
    ],
    exchange_requests: [],
  }, over);
}
const goodBody = { offer_kind: 'makeup', offer_note: 'Bridal look for one styled shoot.', ask_kind: 'Reel', ask_count: 2, date_from: '2026-10-18', date_to: '2026-11-18' };

(async () => {
  const X = require(path.join(ROOT, 'src/lib/vendor/exchange.js'));
  const libSrc  = strip(read('src/lib/vendor/exchange.js'));
  const doorSrc = strip(read('src/api/vendor/exchange.js'));
  const meSrc   = strip(read('src/api/vendor/me.js'));
  const coreSrc = strip(read('src/api/vendor/core.js'));
  const mig     = read('db/migrations/0166_influencer_exchange.sql');

  console.log('\u00a71 \u00b7 THE ROLE AND THE WINDOW (rulings \u00a75(ii), (ii))');
  // MUTATION → RED: roleOf returns 'creator' for every vendor.
  await cell('1.1 a content_creator is a creator; every other category is a sender; the opt-in does NOT decide the role', async () => {
    assert.strictEqual(X.roleOf({ category: 'content_creator' }), 'creator');
    assert.strictEqual(X.roleOf({ category: 'photography' }), 'sender');
    assert.strictEqual(X.roleOf({ category: 'makeup' }), 'sender');
    assert.strictEqual(X.roleOf(null), 'sender');
    // A creator who switched OFF still has an inbox — she must see requests she
    // already received. The opt-in decides LISTING, never the seat.
    assert.strictEqual(X.roleOf({ category: 'content_creator', exchange_discoverable: false }), 'creator');
  });
  // MUTATION → RED: REACH_FRESH_DAYS = 3650.
  await cell('1.2 N = 30 days: 29 fresh, 31 stale, absent stale, garbage stale', async () => {
    assert.strictEqual(X.REACH_FRESH_DAYS, 30);
    assert.strictEqual(X.isFresh(day(29)), true);
    assert.strictEqual(X.isFresh(day(31)), false);
    assert.strictEqual(X.isFresh(null), false);
    assert.strictEqual(X.isFresh('not a date'), false);
    // ...and it reaches the card as `verified`, decided server-side.
    assert.strictEqual(X.reachView({ verified_at: day(2), follower_count: 1, engagement_rate: '2.0' }).verified, true);
    assert.strictEqual(X.reachView({ verified_at: day(90), follower_count: 1, engagement_rate: '2.0' }).verified, false);
    assert.strictEqual(X.reachView(null), null);
  });

  console.log('\u00a72 \u00b7 THE BROWSE LIST (S2(b), ruling (i))');
  // MUTATION → RED: drop the `.eq('exchange_discoverable', true)` predicate.
  await cell('2.1 three predicates: creators only, opted-in only, active only \u2014 and never herself', async () => {
    const db = makeDb(tables());
    const r = await X.browseCreators(db, SENDER);
    assert.ok(r.ok, r.error);
    const ids = r.creators.map((c) => c.id).sort();
    assert.deepStrictEqual(ids, ['v-huge', 'v-swati'], `listed: ${ids.join(',')}`);
    assert.ok(!ids.includes('v-meher'), 'a creator who never opted in was listed');
    assert.ok(!ids.includes('v-gone'),  'an inactive vendor was listed');
    assert.ok(!ids.includes('v-kabir'), 'a photographer was listed on the creator exchange');
    assert.ok(!ids.includes(SENDER.id), 'the caller was listed to herself');
    assert.strictEqual(db.__writes.length, 0, 'a read wrote');
  });
  // MUTATION → RED: sort by follower_count.
  await cell('2.2 the sort is audience fit then engagement; 380k followers with a 4% fit sorts BELOW 11k with 62%', async () => {
    const r = await X.browseCreators(makeDb(tables()), SENDER, { city: 'Delhi NCR' });
    assert.deepStrictEqual(r.creators.map((c) => c.id), ['v-swati', 'v-huge']);
    // ...and the newest snapshot per vendor won: the 400-day-old row would have
    // made Swati's fit 1% and put her second.
    assert.strictEqual(r.creators[0].reach.follower_count, 11200);
    assert.strictEqual(r.creators[0].reach.verified, true);
  });
  // MUTATION → RED: change CREATOR_COLS to '*'.
  await cell('2.3 the list names four columns \u2014 no pin_hash, no bank row, no follower identity reaches the wire', async () => {
    const r = await X.browseCreators(makeDb(tables()), SENDER);
    for (const c of r.creators) {
      for (const banned of ['pin_hash', 'account_number', 'ifsc', 'upi_id']) assert.ok(!(banned in c), `${banned} on the wire`);
      assert.deepStrictEqual(Object.keys(c).sort(), ['business_name', 'city', 'handle', 'id', 'reach']);
      if (c.reach) assert.deepStrictEqual(Object.keys(c.reach).sort(), ['age', 'cities', 'engagement_pct', 'follower_count', 'gender', 'verified']);
    }
    // ⚠ THE DOUBLE CANNOT CATCH THIS ONE and the first cut of this cell pretended it
    // could: `select()` ignores its argument, so `CREATOR_COLS = '*'` stayed GREEN at
    // runtime. The mapping below is what keeps the wire clean either way — the defect
    // an over-broad select introduces is pin_hash and bank rows pulled into MEMORY, and
    // only the source can assert that. Named, not asserted by a chain that never reads it.
    assert.strictEqual(X.CREATOR_COLS, 'id, business_name, city, instagram_handle');
    assert.ok(!/select\('\*'\)/.test(libSrc), "the writer selects '*' off vendors somewhere");
  });
  // MUTATION → RED: let a creator through browseCreators.
  await cell('2.4 a creator is refused the sender\u2019s doors (the shape ruling, both ways)', async () => {
    const db = makeDb(tables());
    const a = await X.browseCreators(db, CREATOR);
    assert.strictEqual(a.code, X.REFUSE.NOT_A_SENDER);
    const b = await X.listMine(db, CREATOR);
    assert.strictEqual(b.code, X.REFUSE.NOT_A_SENDER);
    const c = await X.listInbox(db, SENDER);
    assert.strictEqual(c.code, X.REFUSE.NOT_A_CREATOR);
    assert.strictEqual(db.__writes.length, 0);
  });

  console.log('\u00a73 \u00b7 THE SEND (S4(b), \u00a77)');
  // MUTATION → RED: delete the banned-key loop in validateRequestBody.
  await cell('3.1 a money key is REFUSED, not stripped \u2014 and nothing is written', async () => {
    for (const k of ['budget', 'fee', 'amount', 'rate', 'price', 'payment']) {
      const db = makeDb(tables());
      const body = Object.assign({}, goodBody, { [k]: 5000 });
      const r = await X.createRequest(db, SENDER, CREATOR.id, body);
      assert.strictEqual(r.ok, false, `${k} was accepted`);
      assert.strictEqual(r.code, X.REFUSE.INVALID);
      assert.strictEqual(db.__writes.length, 0, `${k} wrote a row`);
    }
  });
  // MUTATION → RED: accept any ask_count.
  await cell('3.2 the shape: kind in {post,reel,story}, count 1..20, both dates, order \u2014 each refusal writes nothing', async () => {
    const bad = [
      Object.assign({}, goodBody, { ask_kind: 'tweet' }),
      Object.assign({}, goodBody, { ask_count: 0 }),
      Object.assign({}, goodBody, { ask_count: 21 }),
      Object.assign({}, goodBody, { ask_count: 2.5 }),
      Object.assign({}, goodBody, { date_from: '18-10-2026' }),
      Object.assign({}, goodBody, { date_from: '2026-11-18', date_to: '2026-10-18' }),
      Object.assign({}, goodBody, { offer_kind: '' }),
      Object.assign({}, goodBody, { offer_note: 'x'.repeat(501) }),
    ];
    for (const body of bad) {
      const db = makeDb(tables());
      const r = await X.createRequest(db, SENDER, CREATOR.id, body);
      assert.strictEqual(r.ok, false, `accepted: ${JSON.stringify(body).slice(0, 60)}`);
      assert.strictEqual(db.__writes.length, 0, 'a refused send wrote a row');
    }
  });
  // MUTATION → RED: drop the getCreatorCard re-check inside createRequest.
  await cell('3.3 a send straight at an un-listed creator is NOT_FOUND \u2014 the list\u2019s predicates are re-checked at the write', async () => {
    for (const target of ['v-meher', 'v-gone', 'v-kabir']) {
      const db = makeDb(tables());
      const r = await X.createRequest(db, SENDER, target, goodBody);
      assert.strictEqual(r.ok, false, `${target} accepted a request`);
      assert.strictEqual(r.code, X.REFUSE.NOT_FOUND);
      assert.strictEqual(db.__writes.length, 0);
    }
    const db = makeDb(tables());
    const self = await X.createRequest(db, SENDER, SENDER.id, goodBody);
    assert.strictEqual(self.code, X.REFUSE.INVALID);
    assert.strictEqual(db.__writes.length, 0);
  });
  // MUTATION → RED: insert `state: 'accepted'`.
  await cell('3.4 a good send writes ONE row, state `sent`, ask_kind lowercased, and returns the one row shape', async () => {
    const db = makeDb(tables());
    const r = await X.createRequest(db, SENDER, CREATOR.id, goodBody);
    assert.ok(r.ok, r.error);
    assert.strictEqual(db.__writes.length, 1);
    const w = db.__writes[0];
    assert.strictEqual(w.table, 'exchange_requests');
    assert.strictEqual(w.row.vendor_id, SENDER.id);
    assert.strictEqual(w.row.influencer_vendor_id, CREATOR.id);
    assert.strictEqual(w.row.ask_kind, 'reel', 'the kind was not lowercased for the CHECK constraint');
    assert.ok(!('state' in w.payload), 'the writer named a state the column defaults');
    assert.strictEqual(w.row.state, 'sent', 'the column default did not land');
    for (const k of Object.keys(w.payload)) assert.ok(!/fee|price|amount|budget|payment/i.test(k), `a money key reached the insert: ${k}`);
    assert.deepStrictEqual(Object.keys(r.request).sort(),
      ['ask_count', 'ask_kind', 'counterpart_name', 'date_from', 'date_to', 'id', 'offer_kind', 'offer_note', 'state']);
    assert.strictEqual(r.request.counterpart_name, CREATOR.business_name);
  });

  console.log('\u00a74 \u00b7 THE STATE MACHINE (ruling (iii))');
  const seeded = (state) => tables({ exchange_requests: [{
    id: 'req-1', vendor_id: SENDER.id, influencer_vendor_id: CREATOR.id, offer_kind: 'makeup', offer_note: '',
    ask_kind: 'reel', ask_count: 2, date_from: '2026-10-18', date_to: '2026-11-18', state,
    created_at: day(1), accepted_at: null, declined_at: null, withdrawn_at: null, completed_at: null,
  }] });

  // MUTATION → RED: drop the `.eq('state', rule.from)` guard.
  await cell('4.1 accept moves sent\u2192accepted with its stamp; the SECOND accept moves ZERO rows and says NOT_IN_STATE', async () => {
    const db = makeDb(seeded('sent'));
    const a = await X.transition(db, CREATOR, 'req-1', 'accept');
    assert.ok(a.ok, a.error);
    assert.strictEqual(a.request.state, 'accepted');
    assert.ok(db.exchange_requests[0].accepted_at, 'no stamp landed');
    const b = await X.transition(db, CREATOR, 'req-1', 'accept');
    assert.strictEqual(b.ok, false);
    assert.strictEqual(b.code, X.REFUSE.NOT_IN_STATE);
    const second = db.__writes[db.__writes.length - 1];
    assert.strictEqual(second.n, 0, `the guarded update moved ${second.n} rows on the second tap`);
  });
  // MUTATION → RED: allow decline from any state.
  await cell('4.2 every illegal edge refuses and moves zero rows', async () => {
    const edges = [
      ['accepted',  CREATOR, 'decline'],   // already answered
      ['declined',  CREATOR, 'accept'],
      ['accepted',  SENDER,  'withdraw'],  // withdraw is sent-only
      ['sent',      SENDER,  'complete'],  // complete is accepted-only
      ['withdrawn', CREATOR, 'accept'],
      ['completed', SENDER,  'complete'],
    ];
    for (const [from, actor, verb] of edges) {
      const db = makeDb(seeded(from));
      const r = await X.transition(db, actor, 'req-1', verb);
      assert.strictEqual(r.ok, false, `${verb} was allowed from ${from}`);
      assert.strictEqual(r.code, X.REFUSE.NOT_IN_STATE, `${verb} from ${from} gave ${r.code}`);
      assert.strictEqual(db.exchange_requests[0].state, from, 'the row moved anyway');
      const last = db.__writes[db.__writes.length - 1];
      assert.strictEqual(last.n, 0);
    }
  });
  // MUTATION → RED: let the sender accept.
  await cell('4.3 the sides: only the creator answers, only the sender withdraws or completes', async () => {
    for (const verb of ['accept', 'decline']) {
      const db = makeDb(seeded('sent'));
      const r = await X.transition(db, SENDER, 'req-1', verb);
      assert.strictEqual(r.code, X.REFUSE.NOT_A_CREATOR, `the sender could ${verb}`);
      assert.strictEqual(db.__writes.length, 0, 'a refused side still ran an update');
    }
    for (const [state, verb] of [['sent', 'withdraw'], ['accepted', 'complete']]) {
      const db = makeDb(seeded(state));
      const r = await X.transition(db, CREATOR, 'req-1', verb);
      assert.strictEqual(r.code, X.REFUSE.NOT_A_SENDER, `the creator could ${verb}`);
      assert.strictEqual(db.__writes.length, 0);
    }
  });
  // MUTATION → RED: drop the `.eq(mine, actor.id)` clause.
  await cell('4.4 a stranger with the right id moves zero rows \u2014 and is told nothing about whose row it is', async () => {
    const db = makeDb(seeded('sent'));
    const stranger = { id: 'v-stranger', category: 'content_creator' };
    const r = await X.transition(db, stranger, 'req-1', 'accept');
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.code, X.REFUSE.NOT_IN_STATE, 'the refusal distinguishes "not yours" from "already moved"');
    assert.strictEqual(db.exchange_requests[0].state, 'sent');
    assert.strictEqual(db.__writes[db.__writes.length - 1].n, 0);
  });
  await cell('4.5 the happy path end to end: send \u2192 accept \u2192 complete, one row, four stamps in order', async () => {
    const db = makeDb(tables());
    const made = await X.createRequest(db, SENDER, CREATOR.id, goodBody);
    const id = db.exchange_requests[0].id;
    assert.ok(made.ok);
    const acc = await X.transition(db, CREATOR, id, 'accept');
    assert.strictEqual(acc.request.state, 'accepted');
    const done = await X.transition(db, SENDER, id, 'complete');
    assert.strictEqual(done.request.state, 'completed');
    assert.strictEqual(db.exchange_requests.length, 1, 'a transition minted a second row');
    const row = db.exchange_requests[0];
    assert.ok(row.accepted_at && row.completed_at && !row.declined_at && !row.withdrawn_at);
    // NOT A LEAD, NOT AN EVENT (ruling (iii)).
    const touched = [...new Set(db.__writes.map((w) => w.table))];
    assert.deepStrictEqual(touched, ['exchange_requests'], `the plane wrote: ${touched.join(',')}`);
  });

  console.log('\u00a75 \u00b7 THE TWO LISTS (one row shape)');
  // MUTATION → RED: make listInbox read vendor_id.
  await cell('5.1 the inbox is her side and names the SENDER; the sender\u2019s list names the CREATOR', async () => {
    const db = makeDb(seeded('sent'));
    db.exchange_requests.push({ id: 'req-2', vendor_id: 'v-kabir', influencer_vendor_id: CREATOR.id, offer_kind: 'photography',
      offer_note: '', ask_kind: 'reel', ask_count: 1, date_from: '2026-11-02', date_to: '2026-11-30', state: 'accepted', created_at: day(2) });
    db.exchange_requests.push({ id: 'req-3', vendor_id: SENDER.id, influencer_vendor_id: 'v-huge', offer_kind: 'makeup',
      offer_note: '', ask_kind: 'post', ask_count: 1, date_from: '2026-12-01', date_to: '2026-12-10', state: 'sent', created_at: day(3) });
    const inbox = await X.listInbox(db, CREATOR);
    assert.deepStrictEqual(inbox.requests.map((r) => r.id).sort(), ['req-1', 'req-2']);
    assert.strictEqual(inbox.requests.find((r) => r.id === 'req-1').counterpart_name, SENDER.business_name);
    assert.strictEqual(inbox.requests.find((r) => r.id === 'req-2').counterpart_name, 'Frames by Kabir');
    const mine = await X.listMine(db, SENDER);
    assert.deepStrictEqual(mine.requests.map((r) => r.id).sort(), ['req-1', 'req-3']);
    assert.strictEqual(mine.requests.find((r) => r.id === 'req-1').counterpart_name, CREATOR.business_name);
    // ONE SHAPE on both seats.
    const keys = (r) => Object.keys(r).sort().join(',');
    assert.strictEqual(keys(inbox.requests[0]), keys(mine.requests[0]));
  });
  // MUTATION → RED: filter withdrawn out of the inbox.
  await cell('5.2 a withdrawn request STAYS on her inbox \u2014 a row that vanished without trace is the worse answer', async () => {
    const db = makeDb(seeded('withdrawn'));
    const inbox = await X.listInbox(db, CREATOR);
    assert.deepStrictEqual(inbox.requests.map((r) => r.state), ['withdrawn']);
  });

  console.log('\u00a76 \u00b7 THE LAWS (\u00a77, one writer, ruling (i))');
  // MUTATION → RED: add `fee_paise` to 0166 or a rupee to the lib.
  await cell('6.1 NO MONEY on the plane: not in 0166, not in the writer, not in the doors', async () => {
    // ⚠ TWO LESSONS PAID FOR HERE, BOTH IN THE FIRST CUT OF THIS CELL.
    //   1. `\bfee\b` does not match `fee_paise` — `_` is a word character — so a money
    //      COLUMN walked straight past the guard. Stems are unanchored on the right now.
    //   2. `Rs\s` under /i matched "ALTE**RS** " and "doo**RS** " in the file's own PROSE.
    //      Comments are stripped before the assertion (the estate's strip-first law) and
    //      the rupee stem is word-bounded and case-SENSITIVE.
    const sqlBody = mig.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
    const stems = /(fee|price|amount|budget|rupee|paise|payment|money|formatRs)/i;
    const bare  = /\brate\b/i;
    const rupee = /\bRs\b|\u20b9/;
    for (const [label, src] of [['0166', sqlBody], ['the writer', libSrc], ['the doors', doorSrc]]) {
      // The refusal list in `validateRequestBody` NAMES the banned words on purpose; it
      // is the one place they may appear, and only inside that guard.
      // ⚠ THE WHOLE GUARD BLOCK, not just its header: the refusal SENTENCE ("carries no
      // money field") is the words too, and it is the one place they may appear.
      const body = src.replace(/for \(const banned of \[[^\]]*\]\) \{[\s\S]*?\n  \}/, 'GUARD');
      const hit = body.split('\n').find((l) => (stems.test(l) || bare.test(l) || rupee.test(l)) && !/engagement_rate|_rate\b/.test(l));
      assert.ok(!hit, `${label}: ${hit && hit.trim().slice(0, 70)}`);
    }
  });

  // MUTATION → RED: put a `.from('leads')` chain in the writer.
  await cell('6.2 not a lead, not an event: the plane names neither table', async () => {
    for (const [label, src] of [['the writer', libSrc], ['the doors', doorSrc]]) {
      assert.ok(!/from\('leads'\)|createLead|eventWrite|from\('events'\)/.test(src), `${label} touches leads or events`);
    }
  });
  // MUTATION → RED: build a supabase chain in the door file.
  await cell('6.3 ONE WRITER: the door file holds no PostgREST chain and no state literal', async () => {
    assert.ok(!/supabase\.from\(|\.update\(|\.insert\(/.test(doorSrc), 'the door builds its own query');
    assert.ok(!/'(accepted|declined|withdrawn|completed)'/.test(doorSrc), 'the door names a state');
    // ...and the machine is a table in the writer, not branches.
    assert.deepStrictEqual(Object.keys(X.TRANSITIONS).sort(), ['accept', 'complete', 'decline', 'withdraw']);
    for (const rule of Object.values(X.TRANSITIONS)) assert.ok(rule.from && rule.to && rule.stamp && rule.side);
  });
  // MUTATION → RED: drop `exchange_discoverable` from BOOLEAN_FIELDS.
  await cell('6.4 the opt-in rides me.js: both arrays, `=== true` on the GET shape AND the PATCH echo', async () => {
    const allowed = /const ALLOWED_FIELDS = \[[\s\S]*?\];/.exec(meSrc);
    const booleans = /const BOOLEAN_FIELDS = \[[^\]]*\];/.exec(meSrc);
    assert.ok(allowed && /'exchange_discoverable'/.test(allowed[0]), 'not on ALLOWED_FIELDS');
    assert.ok(booleans && /'exchange_discoverable'/.test(booleans[0]), 'not on BOOLEAN_FIELDS \u2014 a non-boolean would be coerced');
    const coercions = meSrc.match(/exchange_discoverable:\s*\w+\.exchange_discoverable\s*===\s*true/g) || [];
    assert.strictEqual(coercions.length, 2, `\`=== true\` appears ${coercions.length} times \u2014 the GET shape and the PATCH echo both need it`);
    assert.ok(!/exchange_discoverable\s*!==\s*false/.test(meSrc), 'the FALSE-default column was read with the TRUE-default coercion');
    // The writer never writes it: one writer for her posture, and it is me.js.
    assert.ok(!/exchange_discoverable['"]?\s*:/.test(libSrc.replace(/\.eq\('exchange_discoverable', true\)/g, '')), 'the exchange writer sets the opt-in');
  });
  // MUTATION → RED: unmount the router.
  await cell('6.5 the doors have an address, and 0166\u2019s three statements are the file\u2019s record', async () => {
    assert.ok(/router\.use\('\/exchange',\s*require\('\.\/exchange'\)\)/.test(coreSrc), 'the router is not mounted');
    for (const want of ['exchange_discoverable boolean NOT NULL DEFAULT false', 'CREATE TABLE IF NOT EXISTS public.exchange_requests', 'CREATE TABLE IF NOT EXISTS public.influencer_reach_snapshots']) {
      assert.ok(mig.includes(want), `0166 lost: ${want}`);
    }
    // The fourth block ships LIFTED this cut (the chair's word), so the three index
    // statements are live SQL rather than commented.
    const idx = mig.split('\n').filter((l) => /^CREATE INDEX IF NOT EXISTS/.test(l.trim()));
    assert.strictEqual(idx.length, 3, `${idx.length} index statements are live \u2014 expected 3`);
  });

  console.log(`\nb78 \u00b7 ${PASS} GREEN \u00b7 ${FAILS.length} RED${FAILS.length ? ' \u2014 ' + FAILS.join(' | ') : ''}`);
  process.exit(FAILS.length ? 1 : 0);
})();
