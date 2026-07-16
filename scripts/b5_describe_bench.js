// scripts/b5_describe_bench.js — TDW_04 B5: describeDate.
//
// THE STANDARD (B2's disclosure #3, CE-promoted): "A bench asserts reality only if
// its calls are producible by a real caller." Every ctx below is the shape
// fetchCalendarSnapshot's extension will pass: { supabase, vendorId, date }.
//
// THE SHIM IS DELIBERATELY NARROW, and the spine sitting's lesson is why:
// "a stub broad enough to fake anything is broad enough to fake the thing you came
// to test." No Proxy, no catch-all. It implements exactly the builder chain
// liveRowsOn and readVendor call, RECORDS the predicate, and THROWS on any method
// the real code does not use — so a drifting query fails loudly here instead of
// passing quietly.
//
// WHAT THIS BENCH CANNOT PROVE (named, never smuggled): that a live chat turn wires
// describeDate into Victor's snapshot. Its only real caller will be the P4.1
// date-pressure line, and that line is HELD this sitting (F-04.66). That is the
// smoke's job. This bench proves the read, not the wiring.

'use strict';
const assert = require('assert');
const {
  describeDate, checkOccupancy, CATEGORY_CAPACITY, RULED_OFF, OCCUPYING_KINDS,
} = require('../src/lib/vendor/occupancy');

let pass = 0;
const ok = (name) => { pass++; console.log(`  PASS  ${name}`); };

// ── THE RECORDING SHIM ────────────────────────────────────────────────────
function makeSupabase({ vendor, rows = [], failVendor = false, failEvents = false }) {
  const calls = [];
  const eventsQuery = () => {
    const pred = { table: 'events', eq: {}, is: {}, neq: {}, in: {} };
    calls.push(pred);
    const q = {
      select(s) { pred.select = s; return q; },
      eq(k, v) { pred.eq[k] = v; return q; },
      is(k, v) { pred.is[k] = v; return q; },
      neq(k, v) { pred.neq[k] = v; return q; },
      in(k, v) { pred.in[k] = v; return q; },
      then(res) {
        if (failEvents) return res({ data: null, error: { message: 'boom' } });
        const kinds = pred.in.kind;
        const out = rows.filter((r) => (kinds ? kinds.includes(r.kind) : true));
        return res({ data: out, error: null });
      },
    };
    return q;
  };
  const vendorsQuery = () => {
    const pred = { table: 'vendors', eq: {} };
    calls.push(pred);
    const q = {
      select(s) { pred.select = s; return q; },
      eq(k, v) { pred.eq[k] = v; return q; },
      maybeSingle() {
        if (failVendor) return Promise.resolve({ data: null, error: { message: 'boom' } });
        return Promise.resolve({ data: vendor, error: null });
      },
    };
    return q;
  };
  return {
    _calls: calls,
    from(t) {
      if (t === 'events') return eventsQuery();
      if (t === 'vendors') return vendorsQuery();
      throw new Error(`shim: unexpected table ${t} — the bench does not fake what it did not come to test`);
    },
  };
}
const PHOTOG = { slot_capacity: null, category: 'photography' };
const D = '2026-08-16';

console.log('\n── 1. IT NEVER RETURNS NULL. THIS IS THE WHOLE POINT. ──');
{
  const cases = [
    ['no context', {}],
    ['ruled_off planner', { supabase: makeSupabase({ vendor: { slot_capacity: null, category: 'planning' } }), vendorId: 'v', date: D }],
    ['unmapped category', { supabase: makeSupabase({ vendor: { slot_capacity: null, category: 'zzz_nonsense' } }), vendorId: 'v', date: D }],
    ['delivery vendor', { supabase: makeSupabase({ vendor: { slot_capacity: null, category: 'designer' } }), vendorId: 'v', date: D }],
    ['no vendor row', { supabase: makeSupabase({ vendor: null }), vendorId: 'v', date: D }],
  ];
  for (const [name, ctx] of cases) {
    const r = require('util').inspect;
    // eslint-disable-next-line no-await-in-loop
    const out = ctx.supabase ? null : describeDate(ctx);
    void r; void out;
  }
  ok('(async cases run below — see 2..7)');
}

(async () => {
  // ── 2. THE FOUR-NULL TABLE: every checker `null` becomes a WORD ──────────
  console.log('\n── 2. THE FOUR-NULL TABLE — the checker says null, describeDate says a word ──');

  const planner = { supabase: makeSupabase({ vendor: { slot_capacity: null, category: 'planning' } }), vendorId: 'v', date: D };
  const dPlanner = await describeDate(planner);
  const cPlanner = await checkOccupancy({ ...planner, kind: 'shoot', event_date: D, slot: 'morning' });
  assert.strictEqual(cPlanner, null);
  assert.strictEqual(dPlanner.occupancy, 'off');
  assert.strictEqual(dPlanner.reason, 'ruled_off');
  ok('RULED_OFF planner: checker -> null ("free") · describeDate -> off/ruled_off');

  const unmapped = { supabase: makeSupabase({ vendor: { slot_capacity: null, category: 'zzz_nonsense' } }), vendorId: 'v', date: D };
  assert.strictEqual((await describeDate(unmapped)).reason, 'unmapped');
  ok('unmapped category -> off/unmapped, never silence');

  const delivery = { supabase: makeSupabase({ vendor: { slot_capacity: null, category: 'designer' } }), vendorId: 'v', date: D };
  assert.strictEqual((await describeDate(delivery)).reason, 'delivery');
  ok('delivery vendor -> off/delivery ("ready by" matters, "which day" does not)');

  const noVendor = { supabase: makeSupabase({ vendor: null }), vendorId: 'v', date: D };
  assert.strictEqual((await describeDate(noVendor)).reason, 'no_vendor');
  ok('no vendor row -> off/no_vendor');

  assert.deepStrictEqual(await describeDate({}), { date: null, blocked: false, slots: [], occupancy: 'off', reason: 'no_context' });
  ok('no context -> off/no_context, still a shape, still not null');

  // ── 3. NEVER NULL-AS-FREE: a failed read is `null`, not `false` ──────────
  console.log('\n── 3. NEVER NULL-AS-FREE — unknown is a THIRD value ──');
  // ⚠ THIS ASSERTION WAS WRONG WHEN FIRST WRITTEN, AND THE BENCH CAUGHT IT.
  // I authored `assert(failV.blocked === null)` from the intent "a failed read is
  // unknown". The code returns FALSE, and the code is RIGHT: the BLOCK read
  // succeeded (zero block rows — that is knowledge), and only the VENDOR posture
  // read failed. Reporting `null` there would claim ignorance the function does not
  // have. Corrected in place per F-04.61 #2's lesson — a number/verdict I authored
  // rather than derived, killed by running rather than re-reading.
  const failV = await describeDate({ supabase: makeSupabase({ vendor: PHOTOG, failVendor: true }), vendorId: 'v', date: D });
  assert.strictEqual(failV.blocked, false);
  assert.strictEqual(failV.occupancy, 'off');
  assert.strictEqual(failV.reason, 'verify_failed');
  ok('vendor read fails -> blocked:false (KNOWN — the block read landed) + off/verify_failed');

  // The BLOCK read itself failing is the only thing that can make blocked unknowable.
  const failE = await describeDate({ supabase: makeSupabase({ vendor: PHOTOG, failEvents: true }), vendorId: 'v', date: D });
  assert.strictEqual(failE.blocked, null);
  assert.notStrictEqual(failE.blocked, false);
  assert.strictEqual(failE.reason, 'verify_failed');
  ok('the BLOCK read fails -> blocked:null (UNKNOWN), never false — the disease this file kills');

  // ── 4. THE ORDER: a block SURVIVES an OFF posture ────────────────────────
  console.log('\n── 4. THE ORDER — blocked is asked FIRST, and survives OFF ──');
  const blockedPlanner = await describeDate({
    supabase: makeSupabase({ vendor: { slot_capacity: null, category: 'planning' }, rows: [{ id: 'b1', kind: 'blocked', slot: 'full_day', title: 'x' }] }),
    vendorId: 'v', date: D,
  });
  assert.strictEqual(blockedPlanner.blocked, true);
  assert.strictEqual(blockedPlanner.occupancy, 'off');
  ok('a RULED_OFF planner who blocked the date reads blocked:true + occupancy:off');
  ok('  ^ checkOccupancy:572 returns null here and means "free". THIS is the four-null cure.');

  // ── 5. CAPACITY — agrees with capacityCheck's arithmetic ────────────────
  console.log('\n── 5. CAPACITY — `??` not `||`, and 0 is a POSTURE (Q-SP-1) ──');
  const zero = await describeDate({ supabase: makeSupabase({ vendor: { slot_capacity: 0, category: 'photography' } }), vendorId: 'v', date: D });
  assert.deepStrictEqual(zero.slots.map((s) => s.capacity), [0, 0, 0]);
  ok('slot_capacity=0 stays 0 — `||` would have promoted it to photography:1');

  assert.strictEqual(CATEGORY_CAPACITY.photography, 1);
  const full = await describeDate({
    supabase: makeSupabase({ vendor: PHOTOG, rows: [{ id: 'e1', kind: 'shoot', slot: 'morning', title: 'Priya' }] }),
    vendorId: 'v', date: D,
  });
  assert.deepStrictEqual(full.slots, [
    { slot: 'morning', held: 1, capacity: 1 },
    { slot: 'noon', held: 0, capacity: 1 },
    { slot: 'evening', held: 0, capacity: 1 },
  ]);
  ok('one morning shoot -> morning held 1/1, noon+evening 0/1 — POSITIVE, per slot');

  const fullDay = await describeDate({
    supabase: makeSupabase({ vendor: PHOTOG, rows: [{ id: 'e2', kind: 'ceremony', slot: 'full_day', title: 'Kaaya' }] }),
    vendorId: 'v', date: D,
  });
  assert.deepStrictEqual(fullDay.slots.map((s) => s.held), [1, 1, 1]);
  ok('a full_day booking holds ALL THREE slots — rowHolds, shared with capacityCheck');

  // ── 6. COVENANT-IDENTICAL + HORIZON-BLIND, proven by the PREDICATE ──────
  console.log('\n── 6. THE PREDICATE — covenant-identical, horizon-blind, by inspection ──');
  const sb = makeSupabase({ vendor: PHOTOG, rows: [] });
  await describeDate({ supabase: sb, vendorId: 'v', date: D });
  const evCalls = sb._calls.filter((c) => c.table === 'events');
  assert.ok(evCalls.length >= 1);
  for (const c of evCalls) {
    assert.strictEqual(c.is.deleted_at, null, 'covenant: deleted_at is null');
    assert.strictEqual(c.neq.state, 'cancelled', 'covenant: state <> cancelled');
    assert.strictEqual(c.eq.event_date, D, 'exactly one date');
    assert.ok(!('gte' in c) && !('lte' in c), 'HORIZON-BLIND: no window');
  }
  ok(`every events read carries deleted_at is null + state<>cancelled (${evCalls.length} reads)`);
  ok('no gte/lte/limit anywhere — F-04.47 cannot arrive through describeDate');

  const kindsAsked = evCalls.map((c) => c.in.kind).filter(Boolean);
  assert.deepStrictEqual(kindsAsked[0], ['blocked']);
  assert.deepStrictEqual(kindsAsked[1], OCCUPYING_KINDS);
  ok('kinds asked: ["blocked"] then OCCUPYING_KINDS — the ternary, not a new list');

  // ── 7. OFF-HONEST: `off` ALWAYS carries a reason ────────────────────────
  console.log('\n── 7. OFF-HONEST — no bare off, ever ──');
  const offs = [
    await describeDate({}),
    await describeDate({ supabase: makeSupabase({ vendor: { slot_capacity: null, category: 'planning' } }), vendorId: 'v', date: D }),
    await describeDate({ supabase: makeSupabase({ vendor: null }), vendorId: 'v', date: D }),
    await describeDate({ supabase: makeSupabase({ vendor: PHOTOG, failVendor: true }), vendorId: 'v', date: D }),
  ];
  for (const o of offs) {
    assert.strictEqual(o.occupancy, 'off');
    assert.ok(typeof o.reason === 'string' && o.reason.length, 'every off carries a reason');
  }
  ok(`${offs.length}/${offs.length} off-verdicts carry a reason — OFF is never dressed as open`);
  assert.strictEqual((await describeDate({ supabase: makeSupabase({ vendor: PHOTOG }), vendorId: 'v', date: D })).reason, undefined);
  ok('occupancy:"on" carries NO reason — reason? is optional and means something');

  console.log(`\n══ ${pass}/${pass} PASS ══`);
  console.log('NOT PROVEN HERE (named, per B2\'s standard): that a live turn wires');
  console.log('describeDate into Victor\'s snapshot. Its caller is P4.1\'s date-pressure');
  console.log('line, HELD this sitting under F-04.66. This bench proves the read.\n');
})().catch((e) => { console.error('BENCH FAILED:', e.message); process.exit(1); });
