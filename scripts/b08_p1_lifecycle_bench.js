#!/usr/bin/env node
// scripts/b08_p1_lifecycle_bench.js — TDW_08 · P1 · THE LIFECYCLE ENGINE BENCH
//
// Runnable from ANY working directory (the repo root is resolved from __dirname,
// never from cwd — the ~/Downloads law's cousin).
//
// EVERY CELL IS BOTH-WAYS. §M mutates PRODUCTION SOURCE — never test setup — and
// asserts the cell goes RED at the uncured tree, then restores the file and
// asserts byte-identity. Every anchor is site-qualified by the line above it
// (CE-127: String.replace takes the FIRST match, so a bare anchor is a coin flip).
//
// WHAT THIS BENCH DOES NOT ASSERT, named rather than silently absent:
//   · no extension cells — the first-open extension was RETIRED by the founder
//     on 2026-08-02 (CE-137 §1). `extension_used` is a dead column.
//   · no remove-page / /demo/remove/:claim_token cells — arm (B) was ruled, the
//     page is not being built.
//   · no template-body cells — FORK C closed 「 tempelate approved stay as is 」.
//   · no onInvited CALLER cell — the caller is P4's admin console, not P1's.

'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(SRC(rel), 'utf8');

let pass = 0, fail = 0, skipped = [];
const H = (s) => console.log(`\n── ${s} ──`);
function t(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); pass++; }
  catch (e) {
    if (e.message === '__SKIP__') { console.log(`  SKIP  ${name}`); return; }
    console.log(`  FAIL  ${name}\n        ${e.message}`); fail++;
  }
}
async function ta(name, fn) {
  try { await fn(); console.log(`  PASS  ${name}`); pass++; }
  catch (e) {
    if (e.message === '__SKIP__') { console.log(`  SKIP  ${name}`); return; }
    console.log(`  FAIL  ${name}\n        ${e.message}`); fail++;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// THE FAKE PLANE — an in-memory stand-in for the PostgREST builder, supporting
// exactly the operators demoLifecycle and prospects actually use. It is test
// setup and is NEVER what a mutation cell breaks.
// ════════════════════════════════════════════════════════════════════════════
function makeDb(seed) {
  const tables = JSON.parse(JSON.stringify(seed || {}));
  let uid = 0;
  const nextId = () => `id-${++uid}`;

  function matches(row, filters) {
    return filters.every((f) => {
      const v = row[f.col];
      if (f.op === 'eq')  return v === f.val;
      if (f.op === 'in')  return f.val.includes(v);
      if (f.op === 'is')  return f.val === null ? (v === null || v === undefined) : v === f.val;
      if (f.op === 'not_is_null') return v !== null && v !== undefined;
      if (f.op === 'lt')  return v != null && String(v) < String(f.val);
      return true;
    });
  }

  function builder(name) {
    const rows = () => (tables[name] = tables[name] || []);
    const q = { _filters: [], _mode: null, _patch: null, _insert: null };

    const api = {
      select() { return api; },
      eq(col, val)  { q._filters.push({ col, op: 'eq', val }); return api; },
      in(col, val)  { q._filters.push({ col, op: 'in', val }); return api; },
      is(col, val)  { q._filters.push({ col, op: 'is', val }); return api; },
      lt(col, val)  { q._filters.push({ col, op: 'lt', val }); return api; },
      not(col, op, val) {
        if (op === 'is' && val === null) q._filters.push({ col, op: 'not_is_null' });
        return api;
      },
      order() { return api; },
      update(patch) { q._mode = 'update'; q._patch = patch; return api; },
      insert(row)   { q._mode = 'insert'; q._insert = row;  return api; },
      _run() {
        if (q._mode === 'insert') {
          const row = Object.assign({ id: nextId() }, q._insert);
          rows().push(row);
          return [row];
        }
        const hit = rows().filter((r) => matches(r, q._filters));
        if (q._mode === 'update') hit.forEach((r) => Object.assign(r, q._patch));
        return hit;
      },
      async maybeSingle() { const r = api._run(); return { data: r[0] || null, error: null }; },
      async single()      {
        const r = api._run();
        return r[0] ? { data: r[0], error: null } : { data: null, error: { message: 'no rows' } };
      },
      then(res, rej) { try { res({ data: api._run(), error: null }); } catch (e) { rej(e); } },
    };
    return api;
  }

  return { from: builder, _tables: tables };
}

const HOUR = 3600 * 1000;
const DAY  = 24 * HOUR;
const iso  = (d) => new Date(d).toISOString();

function seedVendor(over) {
  return Object.assign({
    id: 'demo-1', ig_handle: 'legacy_jewellers', display_name: 'Legacy Jewellers',
    whatsapp_phone: '919888294440', state: 'legacy',
    active: true, discover_eligible: true, discover_eligible_at: iso(Date.now() - 60 * DAY),
    invited_at: null, opened_at: null, engaged_at: null, claimed_at: null,
    removed_at: null, expires_at: null, claim_token: 'tok-1',
    created_at: iso(Date.now() - 65 * DAY),   // the production spread: 2026-05-28..30
  }, over || {});
}

function freshLc() {
  delete require.cache[require.resolve(SRC('src/lib/demoLifecycle.js'))];
  delete require.cache[require.resolve(SRC('src/lib/prospects.js'))];
  return require(SRC('src/lib/demoLifecycle.js'));
}

// ════════════════════════════════════════════════════════════════════════════
(async function main() {

// ── §1 · THE LADDER, as the founder ruled it ───────────────────────────────
H('§1 — the state ladder');
const lc = freshLc();

t('STATES carries exactly the eight ruled values, legacy first', () => {
  assert.deepStrictEqual(lc.STATES,
    ['legacy', 'built', 'invited', 'opened', 'engaged', 'claimed', 'expired', 'removed']);
});
t('CLOCK_STATES is a POSITIVE enumeration and excludes legacy and built', () => {
  assert.deepStrictEqual(lc.CLOCK_STATES, ['invited', 'opened', 'engaged']);
  assert.ok(!lc.CLOCK_STATES.includes('legacy') && !lc.CLOCK_STATES.includes('built'));
});
t('SUNSET_STATES is POSITIVE and now CARRIES legacy and built (CE-142 §1)', () => {
  assert.deepStrictEqual(lc.SUNSET_STATES,
    ['legacy', 'built', 'invited', 'opened', 'engaged', 'expired']);
  assert.ok(!lc.SUNSET_STATES.includes('claimed') && !lc.SUNSET_STATES.includes('removed'),
    'claimed/removed must be absent BY NAME, never by negation');
});
t('the sunset default is 90 days (CE-138), not the retired 30', () => {
  assert.strictEqual(lc.DEFAULT_SUNSET_DAYS, 90);
});
t('extension_used is NOT exported and NOT named as a live mechanism', () => {
  assert.ok(!('extension_used' in lc));
});

// ── §2 · onInvited — refuses the phoneless row ─────────────────────────────
H('§2 — onInvited (CE-135 §4(2): structurally incapable of a false state)');

await ta('REFUSES a phoneless row: no stamp, typed reason no_phone', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ whatsapp_phone: null })], prospects: [] });
  const r  = await lc.onInvited(db, 'demo-1');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'no_phone');
  assert.strictEqual(db._tables.demo_vendors[0].state, 'legacy');
  assert.strictEqual(db._tables.demo_vendors[0].invited_at, null);
});

await ta('TRANSITIONS a phoned row: legacy -> invited, invited_at stamped', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  const r  = await lc.onInvited(db, 'demo-1');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(db._tables.demo_vendors[0].state, 'invited');
  assert.ok(db._tables.demo_vendors[0].invited_at);
});

await ta('opens NO clock — expires_at stays NULL at invited (CE-137 §1)', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  await lc.onInvited(db, 'demo-1');
  assert.strictEqual(db._tables.demo_vendors[0].expires_at, null);
});

await ta('writes prospects.demo_vendor_ref IN THE SAME ACT (F-08.5 cured in-arc)', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  const r  = await lc.onInvited(db, 'demo-1');
  assert.strictEqual(r.prospect_linked, true);
  assert.strictEqual(db._tables.prospects.length, 1);
  assert.strictEqual(db._tables.prospects[0].demo_vendor_ref, 'demo-1');
});

// ── §3 · the beacon — stamps once, mutates no clock ────────────────────────
H('§3 — onOpened (CE-137 §2: pure analytics beacon, idempotent on opened_at)');

await ta('first open stamps opened_at and moves invited -> opened', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'invited', invited_at: iso(Date.now()) })] });
  const r  = await lc.onOpened(db, 'legacy_jewellers');
  assert.strictEqual(r.stamped, true);
  assert.strictEqual(db._tables.demo_vendors[0].state, 'opened');
  assert.ok(db._tables.demo_vendors[0].opened_at);
});

await ta('SECOND open changes NO BYTE — the whole row is byte-identical', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'invited', invited_at: iso(Date.now()) })] });
  await lc.onOpened(db, 'legacy_jewellers');
  const afterFirst = JSON.stringify(db._tables.demo_vendors[0]);
  const r = await lc.onOpened(db, 'legacy_jewellers');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.noop, true);
  assert.strictEqual(r.stamped, false);
  assert.strictEqual(JSON.stringify(db._tables.demo_vendors[0]), afterFirst,
    'a second beacon hit mutated the row');
});

await ta('the beacon touches NO clock — expires_at unmoved across both hits', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'invited', invited_at: iso(Date.now()) })] });
  await lc.onOpened(db, 'legacy_jewellers');
  await lc.onOpened(db, 'legacy_jewellers');
  assert.strictEqual(db._tables.demo_vendors[0].expires_at, null);
});

// ── §4 · onEnquiry — the ONLY place expires_at is ever set ─────────────────
H('§4 — onEnquiry (founder: the 72h starts from a vendor getting a query)');

await ta('invited -> engaged sets expires_at to now + 72h', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'invited', invited_at: iso(Date.now()) })] });
  const before = Date.now();
  const r = await lc.onEnquiry(db, 'demo-1');
  assert.strictEqual(r.ok, true);
  const exp = new Date(db._tables.demo_vendors[0].expires_at).getTime();
  assert.ok(Math.abs(exp - (before + 72 * HOUR)) < 5000, `expires_at is not now+72h: ${exp}`);
});

await ta('a mid-window enquiry REFRESHES the clock (G-1)', async () => {
  const stale = iso(Date.now() + 2 * HOUR);
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'engaged', engaged_at: iso(Date.now() - DAY), invited_at: iso(Date.now() - 2 * DAY), expires_at: stale })] });
  await lc.onEnquiry(db, 'demo-1');
  assert.ok(new Date(db._tables.demo_vendors[0].expires_at) > new Date(stale));
});

await ta('engaged_at stamps ONCE — a second enquiry refreshes the clock, not the stamp', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'invited', invited_at: iso(Date.now()) })] });
  await lc.onEnquiry(db, 'demo-1');
  const firstStamp = db._tables.demo_vendors[0].engaged_at;
  await lc.onEnquiry(db, 'demo-1');
  assert.strictEqual(db._tables.demo_vendors[0].engaged_at, firstStamp);
});

await ta('REFUSES a legacy row — reachable on all five feed rows today', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'legacy' })] });
  const r  = await lc.onEnquiry(db, 'demo-1');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'illegal_transition');
  assert.strictEqual(db._tables.demo_vendors[0].expires_at, null);
});

// ── §5 · removal and restore — reversible BY CONSTRUCTION (CE-136 §3) ──────
H('§5 — onRemoved / restore');

await ta('removal flips active ONLY and never touches discover_eligible', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ discover_eligible: true })] });
  await lc.onRemoved(db, 'demo-1', 'stop');
  const row = db._tables.demo_vendors[0];
  assert.strictEqual(row.active, false);
  assert.strictEqual(row.discover_eligible, true, 'removal touched discover_eligible');
  assert.strictEqual(row.state, 'removed');
  assert.ok(row.removed_at);
});

await ta('a legacy row removed then restored returns to legacy, presence exact', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ discover_eligible: true })] });
  const before = JSON.stringify(db._tables.demo_vendors[0]);
  await lc.onRemoved(db, 'demo-1', 'stop');
  const r = await lc.restore(db, 'demo-1');
  assert.strictEqual(r.state, 'legacy');
  const after = db._tables.demo_vendors[0];
  assert.strictEqual(after.active, true);
  assert.strictEqual(after.discover_eligible, true);
  assert.strictEqual(after.state, JSON.parse(before).state);
});

await ta('removed_at is KEPT across restore — it means LAST removed', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()] });
  await lc.onRemoved(db, 'demo-1', 'stop');
  const stamp = db._tables.demo_vendors[0].removed_at;
  await lc.restore(db, 'demo-1');
  assert.strictEqual(db._tables.demo_vendors[0].removed_at, stamp);
});

await ta('restore DERIVES from ladder stamps — engaged_at wins over opened_at', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({
    invited_at: iso(Date.now() - 2 * DAY), opened_at: iso(Date.now() - DAY),
    engaged_at: iso(Date.now() - HOUR), expires_at: iso(Date.now() + 60 * HOUR) })] });
  await lc.onRemoved(db, 'demo-1', 'admin');
  const r = await lc.restore(db, 'demo-1');
  assert.strictEqual(r.state, 'engaged');
  assert.strictEqual(r.derived_from_stamps, true);
});

await ta('a takedown is NEVER refused — a second removal is a no-op, not an error', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()] });
  await lc.onRemoved(db, 'demo-1', 'stop');
  const r = await lc.onRemoved(db, 'demo-1', 'stop');
  assert.strictEqual(r.ok, true, 'G-2 forbids refusing a takedown');
});

// ── §6 · the C-2 cure ──────────────────────────────────────────────────────
H('§6 — setDiscoverEligible (the C-2 cure: revoke CLEARS the stamp)');

await ta('grant sets discover_eligible AND the stamp', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ discover_eligible: false, discover_eligible_at: null })] });
  await lc.setDiscoverEligible(db, 'demo-1', true);
  assert.strictEqual(db._tables.demo_vendors[0].discover_eligible, true);
  assert.ok(db._tables.demo_vendors[0].discover_eligible_at);
});

await ta('revoke CLEARS the stamp — the four-row production drift cannot recur', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ discover_eligible: true, discover_eligible_at: iso(Date.now()) })] });
  await lc.setDiscoverEligible(db, 'demo-1', false);
  assert.strictEqual(db._tables.demo_vendors[0].discover_eligible, false);
  assert.strictEqual(db._tables.demo_vendors[0].discover_eligible_at, null,
    'revoke left the stamp standing — C-2 reproduced');
});

// ── §7 · the two jobs ──────────────────────────────────────────────────────
H('§7 — the cron predicates (POSITIVE enumerations, ruled binding)');

await ta('hourly sweep expires a lapsed engaged row', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'engaged', expires_at: iso(Date.now() - HOUR) })] });
  const r = await lc.runExpirySweep(db);
  assert.strictEqual(r.expired, 1);
  assert.strictEqual(db._tables.demo_vendors[0].state, 'expired');
});

await ta('hourly sweep LEAVES the row in Discover — only the clock dies', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'engaged', expires_at: iso(Date.now() - HOUR) })] });
  await lc.runExpirySweep(db);
  assert.strictEqual(db._tables.demo_vendors[0].discover_eligible, true);
  assert.strictEqual(db._tables.demo_vendors[0].active, true);
});

await ta('hourly sweep NEVER touches a legacy row — the NULL clock excludes it free', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'legacy', expires_at: null })] });
  const r = await lc.runExpirySweep(db);
  assert.strictEqual(r.expired, 0);
  assert.strictEqual(db._tables.demo_vendors[0].state, 'legacy');
});

await ta('an invited row with a NULL clock can never expire (CE-137 §3)', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'invited', invited_at: iso(Date.now() - 400 * DAY), expires_at: null })] });
  assert.strictEqual((await lc.runExpirySweep(db)).expired, 0);
});

await ta('sunset rotates an over-horizon unclaimed row OUT OF THE FEED, active untouched', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'expired', invited_at: iso(Date.now() - 200 * DAY) })], admin_config: [] });
  const r = await lc.runSunsetSweep(db);
  assert.strictEqual(r.sunset, 1);
  assert.strictEqual(r.days, 90);
  assert.strictEqual(db._tables.demo_vendors[0].discover_eligible, false);
  assert.strictEqual(db._tables.demo_vendors[0].active, true, 'sunset is not a takedown');
  assert.strictEqual(db._tables.demo_vendors[0].state, 'expired', 'sunset changed state');
});

await ta('sunset spares a row inside the horizon', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'expired', invited_at: iso(Date.now() - 10 * DAY) })], admin_config: [] });
  assert.strictEqual((await lc.runSunsetSweep(db)).sunset, 0);
});

await ta('THE WIDENING: a legacy row, invited_at NULL, over-horizon created_at, SWEEPS', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({
    state: 'legacy', invited_at: null, created_at: iso(Date.now() - 95 * DAY) })], admin_config: [] });
  const r = await lc.runSunsetSweep(db);
  assert.strictEqual(r.sunset, 1, 'the never-invited row still satisfies no timer');
  assert.strictEqual(r.by_key.created_at, 1, 'it swept on the wrong key');
  assert.strictEqual(r.by_key.invited_at, 0);
  assert.strictEqual(db._tables.demo_vendors[0].discover_eligible, false);
});

await ta('the SAME legacy row with a recent created_at does NOT sweep', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({
    state: 'legacy', invited_at: null, created_at: iso(Date.now() - 10 * DAY) })], admin_config: [] });
  assert.strictEqual((await lc.runSunsetSweep(db)).sunset, 0);
});

await ta('claimed_at IS NULL still guards — a CLAIMED legacy row must not sweep', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({
    state: 'legacy', invited_at: null, created_at: iso(Date.now() - 95 * DAY),
    claimed_at: iso(Date.now() - 2 * DAY) })], admin_config: [] });
  assert.strictEqual((await lc.runSunsetSweep(db)).sunset, 0,
    'a claimed demo was rotated out of the feed');
});

await ta('COALESCE precedence: invited_at WINS over created_at when both are set', async () => {
  // Old created_at, RECENT invited_at -> COALESCE picks invited_at -> survives.
  const db = makeDb({ demo_vendors: [seedVendor({
    state: 'engaged', created_at: iso(Date.now() - 300 * DAY), invited_at: iso(Date.now() - DAY) })],
    admin_config: [] });
  assert.strictEqual((await lc.runSunsetSweep(db)).sunset, 0,
    'created_at overrode a live invited_at — the COALESCE is inverted');
});

await ta('sunset writes NO state and leaves active TRUE (two exits, two flags)', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({
    state: 'legacy', invited_at: null, created_at: iso(Date.now() - 95 * DAY) })], admin_config: [] });
  await lc.runSunsetSweep(db);
  const row = db._tables.demo_vendors[0];
  assert.strictEqual(row.state, 'legacy', 'sunset wrote a state');
  assert.strictEqual(row.active, true, 'sunset flipped active — that is a takedown, not a sunset');
  assert.strictEqual(row.discover_eligible_at, null);
});

await ta('an admin grant is the exact inverse of a sunset', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({
    state: 'legacy', invited_at: null, created_at: iso(Date.now() - 95 * DAY) })], admin_config: [] });
  await lc.runSunsetSweep(db);
  await lc.setDiscoverEligible(db, 'demo-1', true);
  const row = db._tables.demo_vendors[0];
  assert.strictEqual(row.discover_eligible, true);
  assert.ok(row.discover_eligible_at, 'the grant did not restore the stamp');
  assert.strictEqual(row.state, 'legacy');
});

await ta('restore() REFUSES a sunset row — it is not the inverse of a sunset', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({
    state: 'legacy', invited_at: null, created_at: iso(Date.now() - 95 * DAY) })], admin_config: [] });
  await lc.runSunsetSweep(db);
  const r = await lc.restore(db, 'demo-1');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'illegal_transition');
});

// ── §8 · the dial (CE-139) ─────────────────────────────────────────────────
H('§8 — demo.sunset_days reads the CONFIGURED value, not a constant');

await ta('the dial governs the WIDENED states: key=1 sunsets a 2-day-old LEGACY row', async () => {
  const db = makeDb({
    demo_vendors: [seedVendor({ state: 'legacy', invited_at: null, created_at: iso(Date.now() - 2 * DAY) })],
    admin_config: [{ key: 'demo.sunset_days', value: '1' }],
  });
  const r = await lc.runSunsetSweep(db);
  assert.strictEqual(r.days, 1);
  assert.strictEqual(r.sunset, 1, 'the job ignored the dial and used a constant');
});

await ta('the SAME legacy row survives at the default when the key is removed', async () => {
  const db = makeDb({
    demo_vendors: [seedVendor({ state: 'legacy', invited_at: null, created_at: iso(Date.now() - 2 * DAY) })],
    admin_config: [],
  });
  const r = await lc.runSunsetSweep(db);
  assert.strictEqual(r.days, 90);
  assert.strictEqual(r.sunset, 0);
});

for (const [label, value] of [['absent', undefined], ['junk', '"abc"'], ['POISON zero', '0'],
                              ['negative', '-5'], ['empty string', '""']]) {
  await ta(`defensive parse — ${label} falls to 90 and never throws`, async () => {
    const cfg = value === undefined ? [] : [{ key: 'demo.sunset_days', value }];
    const db  = makeDb({ demo_vendors: [], admin_config: cfg });
    assert.strictEqual(await lc.readSunsetDays(db), 90);
  });
}

await ta('a zero in the dial CANNOT drain the lane (the poison arm)', async () => {
  const db = makeDb({
    demo_vendors: [seedVendor({ state: 'legacy', invited_at: null, created_at: iso(Date.now() - 2 * DAY) })],
    admin_config: [{ key: 'demo.sunset_days', value: '0' }],
  });
  const r = await lc.runSunsetSweep(db);
  assert.strictEqual(r.days, 90);
  assert.strictEqual(r.sunset, 0, 'a 0 in admin_config drained the demo lane');
});

// ── §9 · the STOP arm, and the cell CE-135 §3 exists for ───────────────────
H('§9 — the STOP seam (fail-open; the opt-out write must stand unconditionally)');

await ta('STOP takes down the linked demo', async () => {
  const db = makeDb({
    demo_vendors: [seedVendor()],
    prospects: [{ id: 'p1', phone: '919888294440', state: 'templated', demo_vendor_ref: 'demo-1' }],
  });
  const r = await lc.removeByPhone(db, '919888294440');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(db._tables.demo_vendors[0].state, 'removed');
  assert.strictEqual(db._tables.demo_vendors[0].active, false);
});

await ta('STOP from an unlinked phone is a typed no-op, never a throw', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  const r = await lc.removeByPhone(db, '910000000000');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'no_linked_demo');
  assert.strictEqual(db._tables.demo_vendors[0].active, true);
});

await ta('THE RULED CELL — opted_out lands even when demoLifecycle THROWS', async () => {
  const lcPath = require.resolve(SRC('src/lib/demoLifecycle.js'));
  delete require.cache[require.resolve(SRC('src/lib/prospects.js'))];
  delete require.cache[lcPath];
  // Inject a demoLifecycle whose removeByPhone throws. This is the failure mode
  // CE-135 §3 wired the seam for; a green happy path proves nothing about it.
  require.cache[lcPath] = {
    id: lcPath, filename: lcPath, loaded: true, exports: {
      removeByPhone: async () => { throw new Error('injected lifecycle fault'); },
    },
  };
  const prospects = require(SRC('src/lib/prospects.js'));
  const db = makeDb({ prospects: [{ id: 'p1', phone: '919888294440', state: 'templated', demo_vendor_ref: 'demo-1' }] });
  const res = await prospects.handleMarketingInbound({
    supabase: db, from: '919888294440', text: 'STOP',
    sendWa: async () => ({ sid: 'x' }), copy: () => 'ack',
  });
  delete require.cache[lcPath];
  assert.strictEqual(res.action, 'opted_out', 'the injected fault propagated and cost the opt-out');
  assert.strictEqual(db._tables.prospects[0].state, 'opted_out',
    'the opt-out write did not stand when the demo half threw');
});

// ══════════════════════════════════════════════════════════════════════════
// §11 · THE INVITE ROUTE — driven as a REAL CALLER, not asserted as text
//
// CE-59's both-sides clause: this sitting adds a caller, so the bench drives the
// caller's payload. A source-shape cell over the route would prove the file
// mentions onInvited; it would not prove the ORDER, and the order is the whole
// design (pre-check, then send, then state). Every cell below runs the actual
// Express handler with a fake supabase and an injected sendWa.
// ══════════════════════════════════════════════════════════════════════════
H('§11 — the invite route, driven end to end');

const WA_PATH    = require.resolve(SRC('src/lib/sendWa.js'));
const GUARD_PATH = require.resolve(SRC('src/api/admin/requireAdmin.js'));
const ADMIN_PATH = require.resolve(SRC('src/api/admin/demoAdmin.js'));
const LC_PATH    = require.resolve(SRC('src/lib/demoLifecycle.js'));
const ALERT_PATH = require.resolve(SRC('src/lib/discover/demoLeadAlert.js'));

// Load the router with the transport and the guard under our control. The GUARD
// is stubbed because auth is F-07.86's sitting, not this one; the SEND is stubbed
// because a bench that reaches Meta is not a bench. Everything else — the
// pre-check, the ordering, the module call, the response shape — is production.
function loadInviteRoute(sendWaImpl) {
  const calls = [];
  for (const p of [WA_PATH, GUARD_PATH, ADMIN_PATH, LC_PATH, ALERT_PATH,
                   require.resolve(SRC('src/lib/prospects.js'))]) {
    delete require.cache[p];
  }
  require.cache[WA_PATH] = {
    id: WA_PATH, filename: WA_PATH, loaded: true,
    exports: {
      sendWa: async (opts) => { calls.push(opts); return sendWaImpl(opts); },
    },
  };
  require.cache[GUARD_PATH] = {
    id: GUARD_PATH, filename: GUARD_PATH, loaded: true,
    exports: (req, res, next) => next(),
  };
  const router = require(ADMIN_PATH);
  const layer = router.stack.find((l) => l.route && l.route.path === '/vendors/:id/invite');
  if (!layer) throw new Error('the invite route is not registered on demoAdmin');
  const handle = layer.route.stack[layer.route.stack.length - 1].handle;
  return { handle, calls };
}

// ── WHY THIS RECORDER EXISTS, and it is the bench convicting its author ─────
// The create limb (seed `templated`) and the promote limb (`cold -> templated`)
// reach the SAME END STATE, so a cell asserting the final row cannot tell them
// apart — and the §M2 mutation proved it: removing the seed left the cell GREEN,
// because the promote covered for it. The seed is still load-bearing, and what it
// buys is not the end state but the ABSENCE OF A WINDOW: without it the row is
// INSERTed `cold` and only then updated, and for that instant runOpenerJob could
// harvest it. Two writes with a gap between them is the shape this estate has
// already paid for once. So the cell asks the question that actually differs —
// what did the INSERT carry — rather than the one that looks the same either way.
function recordInserts(db) {
  const seen = [];
  const origFrom = db.from;
  db.from = (name) => {
    const b = origFrom(name);
    const origInsert = b.insert;
    b.insert = (row) => { seen.push({ table: name, row }); return origInsert(row); };
    return b;
  };
  db._inserts = seen;
  return db;
}

function fakeRes() {
  const out = { code: 200, body: null };
  const res = {
    status(c) { out.code = c; return res; },
    json(b) { out.body = b; return out; },
    _out: out,
  };
  return res;
}

async function fireInvite({ db, id, sendWaImpl }) {
  const { handle, calls } = loadInviteRoute(sendWaImpl || (async () => ({ sid: 'wamid.TEST' })));
  const res = fakeRes();
  await handle({ params: { id }, body: {}, app: { locals: { supabase: db } } }, res);
  for (const p of [WA_PATH, GUARD_PATH, ADMIN_PATH]) delete require.cache[p];
  return { out: res._out, calls };
}

await ta('§11.1 the route REFUSES a non-legacy/built row — 409, and sends NOTHING', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ state: 'engaged' })], prospects: [] });
  const { out, calls } = await fireInvite({ db, id: 'demo-1' });
  assert.strictEqual(out.code, 409);
  assert.strictEqual(out.body.error, 'illegal_transition');
  assert.strictEqual(calls.length, 0, 'a template was spent on a row the module would refuse');
  assert.strictEqual(db._tables.demo_vendors[0].state, 'engaged', 'the row moved on a refusal');
});

await ta('§11.2 the route REFUSES a phoneless row THROUGH THE ROUTE, not only the module', async () => {
  const db = makeDb({ demo_vendors: [seedVendor({ whatsapp_phone: null })], prospects: [] });
  const { out, calls } = await fireInvite({ db, id: 'demo-1' });
  assert.strictEqual(out.code, 409);
  assert.strictEqual(out.body.error, 'no_phone');
  assert.strictEqual(calls.length, 0, 'sendWa was called with a null recipient');
  assert.strictEqual(db._tables.demo_vendors[0].state, 'legacy');
});

await ta('§11.3 an absent row is 404 with the siblings\' own string', async () => {
  const db = makeDb({ demo_vendors: [], prospects: [] });
  const { out } = await fireInvite({ db, id: 'nope' });
  assert.strictEqual(out.code, 404);
  assert.strictEqual(out.body.error, 'Demo vendor not found.');
});

await ta('§11.4 an opted-out handset is 409 and NO STATE IS WRITTEN', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  const { out } = await fireInvite({
    db, id: 'demo-1',
    sendWaImpl: async () => { const e = new Error('opted out'); e.code = 'opted_out'; throw e; },
  });
  assert.strictEqual(out.code, 409);
  assert.strictEqual(out.body.error, 'opted_out');
  assert.strictEqual(db._tables.demo_vendors[0].state, 'legacy',
    'a refused send stamped invited — invited must assert a template was SENT');
  assert.strictEqual(db._tables.demo_vendors[0].invited_at, null);
});

await ta('§11.5 a transport failure is 502 and NO STATE IS WRITTEN', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  const { out } = await fireInvite({
    db, id: 'demo-1',
    sendWaImpl: async () => { const e = new Error('Meta 500'); e.code = 'template_error'; throw e; },
  });
  assert.strictEqual(out.code, 502);
  assert.strictEqual(db._tables.demo_vendors[0].state, 'legacy');
  assert.strictEqual(db._tables.demo_vendors[0].invited_at, null);
});

await ta('§11.6 the happy path — 200, the SIBLING response shape, state invited', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  const { out, calls } = await fireInvite({ db, id: 'demo-1' });
  assert.strictEqual(out.code, 200);
  assert.strictEqual(out.body.ok, true);
  // The contract the grant/revoke siblings return at demoAdmin.js:137 and :152.
  assert.deepStrictEqual(Object.keys(out.body.vendor).sort(),
    ['discover_eligible', 'display_name', 'id'],
    'the response shape drifted from its siblings');
  assert.strictEqual(out.body.state, 'invited');
  assert.strictEqual(db._tables.demo_vendors[0].state, 'invited');
  assert.ok(db._tables.demo_vendors[0].invited_at, 'invited_at was not stamped');
  // The send carried the frozen template on the marketing line with both vars.
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].templateKey, 'demo_invite');
  assert.strictEqual(calls[0].line, 'marketing');
  assert.strictEqual(calls[0].vars.name, 'Legacy Jewellers');
  assert.ok(/^https:\/\/thedreamwedding\.in\/demo\/vendor\//.test(calls[0].vars.claim_link),
    'the claim link is not the founder-given shape');
  assert.ok(calls[0].nudgeClass === undefined,
    'the route declared nudgeClass — an invite is not a nudge');
});

await ta('§11.7 NO CLOCK OPENS ON INVITE — expires_at stays null (founder, CE-137 §1)', async () => {
  const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  await fireInvite({ db, id: 'demo-1' });
  assert.strictEqual(db._tables.demo_vendors[0].expires_at, null,
    'the 72h clock opened at invite — it starts at the enquiry');
});

// ══════════════════════════════════════════════════════════════════════════
// §12 · F-08.10 — THE PROSPECT CURE, BOTH LIMBS
//
// The defect: findOrCreateProspectByPhone defaults state 'cold' and runOpenerJob
// harvests exactly 'cold', so inviting a vendor made his handset eligible for an
// unrelated marketing_opener. The fixture is why this needed TWO limbs — the walk
// row's handset already carries a prospect, so a seed-only cure never fires.
// ══════════════════════════════════════════════════════════════════════════
H('§12 — F-08.10: create-or-promote, and the declared asymmetry');

await ta('§12.1 CREATE limb — the prospect is BORN templated, never cold for an instant', async () => {
  const db = recordInserts(makeDb({ demo_vendors: [seedVendor()], prospects: [] }));
  await fireInvite({ db, id: 'demo-1' });
  const ins = db._inserts.find((i) => i.table === 'prospects');
  assert.ok(ins, 'no prospect row was created');
  // THE WRITE ITSELF, not the end state — see recordInserts' header. A row
  // INSERTed cold and promoted a moment later is harvestable in between.
  assert.strictEqual(ins.row.state, 'templated',
    'the prospect was INSERTed cold — runOpenerJob can harvest it before the promote lands');
  assert.strictEqual(db._tables.prospects[0].state, 'templated');
  assert.strictEqual(db._tables.prospects[0].demo_vendor_ref, 'demo-1');
});

await ta('§12.2 FIND limb — an existing COLD prospect is PROMOTED to templated', async () => {
  const db = makeDb({
    demo_vendors: [seedVendor()],
    prospects: [{ id: 'p1', phone: '919888294440', state: 'cold', demo_vendor_ref: null }],
  });
  await fireInvite({ db, id: 'demo-1' });
  assert.strictEqual(db._tables.prospects.length, 1, 'a duplicate prospect row was created');
  assert.strictEqual(db._tables.prospects[0].state, 'templated',
    'the existing cold row was left cold — the seed-only cure never fires on a real handset');
  assert.strictEqual(db._tables.prospects[0].demo_vendor_ref, 'demo-1');
});

await ta('§12.3 FIND limb — states FURTHER ALONG are never walked backwards', async () => {
  for (const state of ['replied', 'in_session', 'converted']) {
    const db = makeDb({
      demo_vendors: [seedVendor()],
      prospects: [{ id: 'p1', phone: '919888294440', state, demo_vendor_ref: null }],
    });
    await fireInvite({ db, id: 'demo-1' });
    assert.strictEqual(db._tables.prospects[0].state, state,
      `a ${state} prospect was rewritten to templated`);
    assert.strictEqual(db._tables.prospects[0].demo_vendor_ref, 'demo-1',
      'the linkage did not land on a further-along prospect');
  }
});

await ta('§12.4 opted_out is TERMINAL — the promote never touches it', async () => {
  const db = makeDb({
    demo_vendors: [seedVendor()],
    prospects: [{ id: 'p1', phone: '919888294440', state: 'opted_out', demo_vendor_ref: null }],
  });
  // The route would never reach here (sendWa refuses first); this drives the
  // MODULE directly, because onInvited is callable by any future caller.
  const lc = freshLc();
  await lc.onInvited(db, 'demo-1');
  assert.strictEqual(db._tables.prospects[0].state, 'opted_out',
    'an opted-out handset was resurrected to templated — only the founder\'s START may do that');
});

await ta('§12.5 THE DECLARED ASYMMETRY — the invite does NOT stamp last_template_at', async () => {
  // CE-146 §2. demoLeadAlert.js:100-105 states the column is "stamped only after a
  // send THIS MODULE actually made" and reads it at :117-123 to suppress an alert
  // for 48h. A second stamper would make every invite silence the vendor's own
  // lead alert for two days. BOTH LIMBS are driven.
  const created = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
  await fireInvite({ db: created, id: 'demo-1' });
  assert.ok(created._tables.prospects[0].last_template_at == null,
    'the create limb stamped last_template_at — the next demo-lead alert dies for 48h');

  const found = makeDb({
    demo_vendors: [seedVendor()],
    prospects: [{ id: 'p1', phone: '919888294440', state: 'cold', last_template_at: null }],
  });
  await fireInvite({ db: found, id: 'demo-1' });
  assert.ok(found._tables.prospects[0].last_template_at == null,
    'the promote limb stamped last_template_at');
});

// ══════════════════════════════════════════════════════════════════════════
// §13 · F-08.7 — THE SUNSET MARKER, AND THE DIAL IT READS
// ══════════════════════════════════════════════════════════════════════════
H('§13 — sunset_at, and readSunsetDays against the seeded row');

await ta('§13.1 the sweep STAMPS sunset_at on every row it rotates', async () => {
  const lc = freshLc();
  const old = iso(Date.now() - 200 * DAY);
  const db = makeDb({ demo_vendors: [seedVendor({ created_at: old, invited_at: null })] });
  const r = await lc.runSunsetSweep(db);
  assert.strictEqual(r.sunset, 1);
  const row = db._tables.demo_vendors[0];
  assert.ok(row.sunset_at, 'the row rotated out of the feed with no marker — F-08.7 uncured');
  assert.strictEqual(row.discover_eligible, false);
  assert.strictEqual(row.discover_eligible_at, null);
  assert.strictEqual(row.state, 'legacy', 'the sunset changed state — a rotation is not a takedown');
  assert.strictEqual(row.active, true, 'the sunset flipped active — content must be retained');
});

await ta('§13.2 sunset_at is a HISTORY stamp — an admin grant does NOT clear it', async () => {
  const lc = freshLc();
  const stamp = iso(Date.now() - 3 * DAY);
  const db = makeDb({ demo_vendors: [seedVendor({ discover_eligible: false, sunset_at: stamp })] });
  await lc.setDiscoverEligible(db, 'demo-1', true);
  assert.strictEqual(db._tables.demo_vendors[0].sunset_at, stamp,
    'the grant cleared sunset_at — it was harmonised with discover_eligible_at, the one thing forbidden');
  assert.ok(db._tables.demo_vendors[0].discover_eligible_at, 'the grant did not set the state stamp');
});

await ta('§13.3 readSunsetDays READS THE SEEDED ROW, and 90 is not the only answer it can give', async () => {
  const lc = freshLc();
  const db = makeDb({ admin_config: [{ key: 'demo.sunset_days', value: '45' }] });
  assert.strictEqual(await lc.readSunsetDays(db), 45,
    'the seeded row is ignored — the dial would be inert even once the panel can reach it');
});

await ta('§13.4 absent / junk / zero / negative / empty all fall to 90', async () => {
  const lc = freshLc();
  assert.strictEqual(await lc.readSunsetDays(makeDb({ admin_config: [] })), 90, 'absent');
  for (const [label, value] of [['junk', 'ninety'], ['zero', '0'], ['negative', '-5'],
                                ['empty', ''], ['null', null]]) {
    const db = makeDb({ admin_config: [{ key: 'demo.sunset_days', value }] });
    assert.strictEqual(await lc.readSunsetDays(db), 90, `${label} did not fall to the default`);
  }
});

await ta('§13.5 the sweep uses the DIAL, not the constant — a 45 row halves the horizon', async () => {
  const lc = freshLc();
  const age60 = iso(Date.now() - 60 * DAY);
  const db = makeDb({
    demo_vendors: [seedVendor({ created_at: age60, invited_at: null })],
    admin_config: [{ key: 'demo.sunset_days', value: '45' }],
  });
  const r = await lc.runSunsetSweep(db);
  assert.strictEqual(r.days, 45);
  assert.strictEqual(r.sunset, 1, 'a 60-day row survived a 45-day horizon');
});

// ── §14 · ONE FROZEN AUTHORITY, TWO READERS ────────────────────────────────
H('§14 — INVITE_STATES is exported and the route reads it');

t('§14.1 INVITE_STATES is frozen, positive, and exactly [legacy, built]', () => {
  const lc = freshLc();
  assert.deepStrictEqual(lc.INVITE_STATES, ['legacy', 'built']);
  assert.ok(Object.isFrozen(lc.INVITE_STATES));
});

t('§14.2 the route reads the module\'s list and never re-implements it', () => {
  const code = read('src/api/admin/demoAdmin.js')
    .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  assert.ok(/demoLifecycle\.INVITE_STATES/.test(code),
    'the route does not read the frozen list');
  assert.ok(!/\['legacy',\s*'built'\]/.test(code),
    'the route re-implemented the transition rule as a literal — two authorities again');
});

// ── §10 · shape cells over production source ───────────────────────────────
H('§10 — shape of the shipped source');

const LC_SRC   = read('src/lib/demoLifecycle.js');
const CRON_SRC = read('src/cron.js');
const DEMO_SRC = read('src/api/demo/vendor.js');
const PROS_SRC = read('src/lib/prospects.js');
const ADMIN_SRC = read('src/api/admin/demoAdmin.js');
const ROUTER_SRC = read('src/api/router.js');

t('NO P1 PATH ISSUES A DELETE AGAINST demo_vendors (CE-134 §3)', () => {
  for (const [name, src] of [['demoLifecycle', LC_SRC], ['demo/vendor', DEMO_SRC],
                             ['demoAdmin', ADMIN_SRC], ['cron', CRON_SRC], ['prospects', PROS_SRC]]) {
    // `router.delete(` is an Express VERB, not a supabase delete. The hazard is a
    // supabase delete against the table, so the cell must name that shape.
    const dbDeletes = src.replace(/router\.delete\s*\(/g, 'router.DELETEVERB(');
    assert.ok(!/\.delete\s*\(/.test(dbDeletes), `${name} carries a supabase .delete( — the FK cascades 8 leads`);
  }
});

t('demoAdmin no longer writes any presence column directly', () => {
  // Strip line comments first: this file DOCUMENTS the writes it used to carry
  // ("Was `.update({ active: false })` …"), and a cell that convicts its own
  // explanation is the comment-counting fault F-07.52 was labelled for.
  const code = ADMIN_SRC.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  assert.ok(!/update\(\{\s*active:\s*false\s*\}\)/.test(code), 'the raw active:false write survives');
  assert.ok(!/discover_eligible:\s*true,\s*discover_eligible_at/.test(code), 'the raw grant write survives');
  assert.ok(/demoLifecycle/.test(ADMIN_SRC));
});

t('the beacon answers at BOTH mounted paths (CE-136 §2)', () => {
  assert.ok(/router\.use\('\/demo\/vendor'/.test(ROUTER_SRC));
  assert.ok(/router\.use\('\/demo\/discover'/.test(ROUTER_SRC));
  assert.ok(/router\.post\('\/:handle\/opened'/.test(DEMO_SRC));
});

t('the PWA calls the MOUNTED path, not the spec path', () => {
  const pwa = path.resolve(ROOT, '..', 'dreamos-pwa');
  if (!fs.existsSync(pwa)) {
    // A SKIP IS NAMED, NEVER COUNTED AS A PASS (floor-method law). This cell is
    // cross-repo; it is real only where both trees are checked out as siblings.
    skipped.push('the PWA calls the MOUNTED path — dreamos-pwa is not a sibling of this repo');
    throw new Error('__SKIP__');
  }
  // The path literal lives in the API AUTHORITY, not the page — lib/demo/api.ts
  // is the one place a demo URL is written (the F-07.70 one-authority shape), so
  // the cell asks each file for the thing it actually owns.
  const api  = fs.readFileSync(path.join(pwa, 'lib/demo/api.ts'), 'utf8');
  const page = fs.readFileSync(path.join(pwa, 'app/demo/vendor/[handle]/page.tsx'), 'utf8');
  assert.ok(/\/api\/v2\/demo\/vendor\/\$\{handle\}\/opened/.test(api),
    'lib/demo/api.ts does not call the mounted beacon path');
  assert.ok(!/\/api\/v2\/demo\/\$\{handle\}\/opened/.test(api),
    'lib/demo/api.ts calls the SPEC path, which is not a mounted route');
  assert.ok(/pingDemoOpened\(handle\)/.test(page), 'the landing never fires the beacon');
  assert.ok(/beaconFired\.current/.test(page), 'the landing has no once-per-mount guard');
  // Comments stripped FIRST — api.ts's own header declares "ZERO localStorage",
  // and this cell convicted that declaration on its first run. Second instance of
  // F-07.52's comment-counting fault in this bench, both caught by the bench.
  const apiCode = api.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  assert.ok(!/localStorage|sessionStorage/.test(apiCode), 'the beacon reached for storage (G-6)');
});

t('the limiter is REUSED from crew, never re-implemented', () => {
  assert.ok(/require\('\.\.\/crew'\)/.test(DEMO_SRC));
  assert.ok(!/new Map\(\)/.test(DEMO_SRC), 'demo/vendor re-implemented a bucket');
});

// ── RE-AIMED, TDW_08 SITTING A · F-08.6 CURED ──────────────────────────────
// WAS: "the phantom job is LABELLED, not silently adjacent" — it asserted the
// DEFECT's containment, because deleting the job was not P1's charter. The job is
// now DELETED and this cell asserts the cure and the marker together.
//
// AND IT IS THE COMMENT-BLINDNESS LAW'S OWN SPECIMEN. The old cell's second
// assertion, /demo_active/ over raw source, was meant to prove THE JOB was still
// there — but the ⚠ label above the job contains the literal string
// `vendors.demo_active` in its own prose. Delete the job, keep the label, and the
// old cell passes GREEN over a deletion it was written to detect: it would have
// been convicted by a comment. That is exactly the fault the law was promoted
// for, one sitting earlier, and it was sitting in this file.
//
// The law's shape is two-part, and both parts are here: the CODE assertion runs
// over comment-stripped source, and the SPECIMEN assertion requires the tombstone
// to survive in the raw text.
t('F-08.6 CURED — the phantom job is gone from CODE and the tombstone survives', () => {
  const code = CRON_SRC.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  assert.ok(!/demo_active/.test(code),
    'the phantom job (or a new reference to a column that does not exist) is in cron CODE');
  assert.ok(!/demo_handle/.test(code),
    'the phantom filter column is in cron CODE');
  assert.ok(!/\.from\('vendors'\)[\s\S]{0,200}demo_active/.test(code),
    'a job still updates the phantom presence column on vendors');
  // THE SPECIMEN. The marker outlives the job on purpose — a reader who finds no
  // job and no explanation re-derives the whole question.
  assert.ok(/THE TOMBSTONE — F-08\.6, DELETED/.test(CRON_SRC),
    'the tombstone was removed — the next hand will write the same job again');
  assert.ok(/demo_active/.test(CRON_SRC),
    'the tombstone no longer names the column, so it cannot warn about it');
});

t('exactly FIVE cron jobs survive, and the two demo lifecycle jobs are among them', () => {
  const code = CRON_SRC.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  const jobs = code.match(/cron\.schedule\(/g) || [];
  assert.strictEqual(jobs.length, 5,
    `cron.js holds ${jobs.length} scheduled jobs, expected 5 after the phantom's deletion`);
  assert.ok(/runExpirySweep\(supabase\)/.test(code), 'the hourly demo expiry job is gone');
  assert.ok(/runSunsetSweep\(supabase\)/.test(code), 'the nightly demo sunset job is gone');
});

t('the :136-139 opt-out confirmation bypass is byte-stable', () => {
  assert.ok(/isOptedOut: async \(\) => false/.test(PROS_SRC),
    'the single documented bypass for the opt-out acknowledgement was disturbed');
});

// ── §M · MUTATION — production source broken, then restored ────────────────
H('§M — both-ways: every cell above goes RED at the uncured tree');

function mutateSrc(rel, from, to, cellName, assertOnFresh) {
  const abs = SRC(rel);
  const original = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (original === null || original.split(from).length - 1 !== 1) {
    t(`§M ${cellName} goes RED when its production code is broken`, () => {
      throw new Error(`anchor absent or ambiguous (must appear exactly once): ${rel} <- ${from}`);
    });
    return;
  }
  fs.writeFileSync(abs, original.replace(from, to));
  let wentRed = false;
  try {
    const r = assertOnFresh();
    if (r && typeof r.then === 'function') throw new Error('assertOnFresh must be synchronous');
  } catch (_e) { wentRed = true; }
  fs.writeFileSync(abs, original);
  assert.strictEqual(fs.readFileSync(abs, 'utf8'), original, `${rel} not restored byte-identical`);
  t(`§M ${cellName} goes RED when its production code is broken`, () => {
    assert.ok(wentRed, `${cellName} passed over broken production code — the cell is VACUOUS`);
  });
}

// The mutation cells run against freshly-required modules, so they are driven
// through a synchronous re-read of the source rather than a re-execution — the
// mutation-helper caching law (CE-117): a mutation must bust whatever caching
// the cell's own read path uses. These cells read the FILE, so re-reading it is
// the correct bust.

mutateSrc('src/lib/demoLifecycle.js',
  "    .in('state', CLOCK_STATES)\n    .lt('expires_at'",
  "    .not('state', 'eq', 'claimed')\n    .lt('expires_at'",
  'the hourly sweep is a POSITIVE enumeration',
  () => {
    const fresh = read('src/lib/demoLifecycle.js');
    assert.ok(/\.in\('state', CLOCK_STATES\)/.test(fresh),
      'the hourly predicate was rewritten negated — legacy rows would be swept');
  });

mutateSrc('src/lib/demoLifecycle.js',
  "const SUNSET_STATES = Object.freeze(['legacy', 'built', 'invited', 'opened', 'engaged', 'expired']);",
  "const SUNSET_STATES = Object.freeze(['invited', 'opened', 'engaged', 'expired']);",
  'the widening — legacy and built are in SUNSET_STATES',
  () => {
    const fresh = read('src/lib/demoLifecycle.js');
    assert.ok(/Object\.freeze\(\['legacy', 'built', 'invited'/.test(fresh),
      'legacy/built dropped from SUNSET_STATES — nine of twelve rows satisfy no timer again');
  });

mutateSrc('src/lib/demoLifecycle.js',
  "  const neverInvited = await base().is('invited_at', null).lt('created_at', cutoff)",
  "  const neverInvited = await base().is('invited_at', null).lt('invited_at', cutoff)",
  'the COALESCE second pass keys on created_at',
  () => {
    const fresh = read('src/lib/demoLifecycle.js');
    assert.ok(/\.is\('invited_at', null\)\.lt\('created_at', cutoff\)/.test(fresh),
      'the never-invited pass stopped keying on created_at — the COALESCE is dead again');
  });

mutateSrc('src/lib/demoLifecycle.js',
  "    .in('state', SUNSET_STATES)\n    .is('claimed_at', null)",
  "    .not('state', 'eq', 'claimed')\n    .is('claimed_at', null)",
  'the sunset sweep is a POSITIVE enumeration',
  () => {
    const fresh = read('src/lib/demoLifecycle.js');
    assert.ok(/\.in\('state', SUNSET_STATES\)/.test(fresh));
  });

mutateSrc('src/lib/demoLifecycle.js',
  "    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULT_SUNSET_DAYS;",
  "    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEFAULT_SUNSET_DAYS;",
  'the poison arm (n >= 1, not the house n >= 0)',
  () => {
    const fresh = read('src/lib/demoLifecycle.js');
    assert.ok(/n >= 1 \? Math\.floor\(n\)/.test(fresh),
      'the guard was loosened to n >= 0 — a 0 in admin_config would drain the lane');
  });

mutateSrc('src/lib/demoLifecycle.js',
  "    removed_at: _iso(_now()),\n    active: false,\n  });",
  "    removed_at: _iso(_now()),\n    active: false,\n    discover_eligible: false,\n  });",
  'removal flips active ONLY',
  () => {
    const fresh = read('src/lib/demoLifecycle.js');
    assert.ok(!/removed_at: _iso\(_now\(\)\),\n    active: false,\n    discover_eligible: false/.test(fresh),
      'removal touched discover_eligible — restore() can no longer be its exact inverse');
  });

mutateSrc('src/lib/demoLifecycle.js',
  "  if (!row.whatsapp_phone) {",
  "  if (false) {",
  'onInvited refuses the phoneless row',
  () => {
    const fresh = read('src/lib/demoLifecycle.js');
    assert.ok(/if \(!row\.whatsapp_phone\) \{/.test(fresh),
      'the phoneless guard was removed — invited would assert a send that cannot happen');
  });

mutateSrc('src/lib/demoLifecycle.js',
  "  if (row.opened_at) {",
  "  if (false) {",
  'the beacon is idempotent on opened_at',
  () => {
    const fresh = read('src/lib/demoLifecycle.js');
    assert.ok(/if \(row\.opened_at\) \{/.test(fresh),
      'the idempotency key was removed — a second beacon hit would re-stamp');
  });

mutateSrc('src/lib/demoLifecycle.js',
  "    discover_eligible_at: eligible ? _iso(_now()) : null,",
  "    discover_eligible_at: eligible ? _iso(_now()) : undefined,",
  'the C-2 cure — revoke CLEARS the stamp',
  () => {
    const fresh = read('src/lib/demoLifecycle.js');
    assert.ok(/discover_eligible_at: eligible \? _iso\(_now\(\)\) : null,/.test(fresh),
      'revoke stopped clearing the stamp — C-2 reproduced in the cure itself');
  });

// ── §M2 · BEHAVIOURAL MUTATION — this sitting's code broken, then DRIVEN ───
//
// The §M cells above mutate production source and re-read the FILE. That is the
// right bust for a cell whose read path is the file. But every cell this sitting
// adds asserts BEHAVIOUR through a live handler, so proving those non-vacuous
// means breaking the source and RUNNING it — the mutation-helper caching law
// (CE-117) reaching its other case: the bust must match the cell's own read path,
// and these cells' read path is `require`.
H('§M2 — both-ways: this sitting\'s cells go RED when their production code breaks');

async function mutateAndDrive(rel, from, to, cellName, driveAndAssert) {
  const abs = SRC(rel);
  const original = fs.readFileSync(abs, 'utf8');
  if (original.split(from).length - 1 !== 1) {
    await ta(`§M2 ${cellName} goes RED when its production code is broken`, async () => {
      throw new Error(`anchor absent or ambiguous (must appear exactly once): ${rel} <- ${from}`);
    });
    return;
  }
  fs.writeFileSync(abs, original.replace(from, to));
  let wentRed = false;
  try { await driveAndAssert(); } catch (_e) { wentRed = true; }
  fs.writeFileSync(abs, original);
  assert.strictEqual(fs.readFileSync(abs, 'utf8'), original, `${rel} not restored byte-identical`);
  await ta(`§M2 ${cellName} goes RED when its production code is broken`, async () => {
    assert.ok(wentRed, `${cellName} passed over broken production code — the cell is VACUOUS`);
  });
}

await mutateAndDrive('src/api/admin/demoAdmin.js',
  '    if (demoLifecycle.INVITE_STATES.includes(row.state) === false) {',
  '    if (false) {',
  'the pre-check refuses an ineligible row BEFORE the template is spent',
  async () => {
    const db = makeDb({ demo_vendors: [seedVendor({ state: 'engaged' })], prospects: [] });
    const { calls } = await fireInvite({ db, id: 'demo-1' });
    assert.strictEqual(calls.length, 0);
  });

await mutateAndDrive('src/api/admin/demoAdmin.js',
  "      const code = (e && e.code) || 'send_failed';",
  "      const code = (e && e.code) || 'send_failed';\n      await demoLifecycle.onInvited(supabase, row.id, { via: 'admin_console' });",
  'a REFUSED send writes no state (the order is the design)',
  async () => {
    const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
    await fireInvite({
      db, id: 'demo-1',
      sendWaImpl: async () => { const e = new Error('opted out'); e.code = 'opted_out'; throw e; },
    });
    assert.strictEqual(db._tables.demo_vendors[0].state, 'legacy');
  });

await mutateAndDrive('src/lib/demoLifecycle.js',
  "      supabase, row.whatsapp_phone, { state: 'templated' },",
  '      supabase, row.whatsapp_phone,',
  'F-08.10 create limb — the prospect is BORN templated (the window, not the end state)',
  async () => {
    const db = recordInserts(makeDb({ demo_vendors: [seedVendor()], prospects: [] }));
    await fireInvite({ db, id: 'demo-1' });
    assert.strictEqual(db._inserts.find((i) => i.table === 'prospects').row.state, 'templated');
  });

await mutateAndDrive('src/lib/demoLifecycle.js',
  "    if (p.state === 'cold') patch.state = 'templated';",
  '    if (false) patch.state = \'templated\';',
  'F-08.10 promote limb — an existing cold row is lifted out of the harvest',
  async () => {
    const db = makeDb({
      demo_vendors: [seedVendor()],
      prospects: [{ id: 'p1', phone: '919888294440', state: 'cold', demo_vendor_ref: null }],
    });
    await fireInvite({ db, id: 'demo-1' });
    assert.strictEqual(db._tables.prospects[0].state, 'templated');
  });

await mutateAndDrive('src/lib/demoLifecycle.js',
  '    const patch = { demo_vendor_ref: row.id };',
  '    const patch = { demo_vendor_ref: row.id, last_template_at: _iso(_now()) };',
  'F-08.11 the declared asymmetry — the invite never stamps last_template_at',
  async () => {
    const db = makeDb({ demo_vendors: [seedVendor()], prospects: [] });
    await fireInvite({ db, id: 'demo-1' });
    assert.ok(db._tables.prospects[0].last_template_at == null);
  });

await mutateAndDrive('src/lib/demoLifecycle.js',
  "    .update({ discover_eligible: false, discover_eligible_at: null, sunset_at: _iso(at) })",
  "    .update({ discover_eligible: false, discover_eligible_at: null })",
  'F-08.7 the sweep stamps sunset_at',
  async () => {
    const lc = freshLc();
    const db = makeDb({ demo_vendors: [seedVendor({ created_at: iso(Date.now() - 200 * DAY) })] });
    await lc.runSunsetSweep(db);
    assert.ok(db._tables.demo_vendors[0].sunset_at);
  });

// ── close ──────────────────────────────────────────────────────────────────
if (skipped.length) {
  console.log('\nNAMED SKIPS (floor-method law — a skip is disclosed, never counted as a pass):');
  skipped.forEach((r) => console.log(`  · ${r}`));
}
console.log(`\n══ b08_p1_lifecycle_bench: ${pass} passed, ${fail} failed, ${skipped.length} skipped ══\n`);
process.exit(fail === 0 ? 0 : 1);

})().catch((e) => { console.error('BENCH CRASHED:', e); process.exit(2); });
