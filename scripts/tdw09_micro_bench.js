'use strict';
// scripts/tdw09_micro_bench.js
// TDW_09 · THE DREAM-OS MICRO — the four limbs' bench.
//
//   node scripts/tdw09_micro_bench.js [TREE_ROOT]
//
// TREE_ROOT defaults to this file's own repo root, so the bench is runnable
// from any working directory (Q-SP-5: a cure nobody can re-run quietly stops
// being a cure). Pass an UNCURED tree root to see the reds — that is the
// both-ways proof, and every red below is a mutation of PRODUCTION code, never
// of test setup.
//
// THE FOUR LIMBS
//   L1  T3-3    waitlist.js retires whole (file + require + mount)
//   L2  F-09.48 pin-status answers for BOTH roles, single-role byte-identical
//   L3  F-09.50 the dead reader deleted; F-09.63 its lying header cured
//   L4  F-09.53 the covenant clause in vendor-engine/today.js's events query
//
// L2 and L4 drive the REAL route handlers off the REAL express routers — the
// module is required from TREE_ROOT and the terminal handler is taken off the
// router's own stack. Auth middleware is skipped deliberately: these cells
// assert the query and the response shape, which is what a caller reaches
// AFTER auth, not the auth itself.

const path = require('path');
const fs   = require('fs');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));

let pass = 0, fail = 0;
const fails = [];

function cell(name, fn) {
  let ok = false, why = '';
  try { const r = fn(); ok = (r === true); if (!ok) why = String(r); }
  catch (e) { ok = false; why = e && e.message ? e.message : String(e); }
  if (ok) { pass++; console.log('  PASS  ' + name); }
  else { fail++; fails.push(name + '  —  ' + why); console.log('  FAIL  ' + name + '  —  ' + why); }
}

async function acell(name, fn) {
  let ok = false, why = '';
  try { const r = await fn(); ok = (r === true); if (!ok) why = String(r); }
  catch (e) { ok = false; why = e && e.message ? e.message : String(e); }
  if (ok) { pass++; console.log('  PASS  ' + name); }
  else { fail++; fails.push(name + '  —  ' + why); console.log('  FAIL  ' + name + '  —  ' + why); }
}

const P    = (rel) => path.join(ROOT, rel);
const has  = (rel) => fs.existsSync(P(rel));
const read = (rel) => fs.readFileSync(P(rel), 'utf8');

// ── the mock supabase: a real filter engine, so a missing clause really does
//    change the returned set (non-vacuity is structural here) ────────────────
function makeSupabase(tables) {
  function builder(table) {
    const eqs = [], isNulls = [], gtes = [], ltes = [], neqs = [];
    const rows = () => (tables[table] || []).filter((r) =>
      eqs.every(([c, v]) => r[c] === v) &&
      isNulls.every(([c]) => r[c] === null || r[c] === undefined) &&
      gtes.every(([c, v]) => String(r[c]) >= String(v)) &&
      ltes.every(([c, v]) => String(r[c]) <= String(v)) &&
      neqs.every(([c, v]) => r[c] !== v)
    );
    const settle = () => Promise.resolve({ data: rows(), error: null, count: rows().length });
    const b = {
      select() { return b; },
      eq(c, v) { eqs.push([c, v]); return b; },
      is(c, v) { if (v === null) isNulls.push([c, v]); return b; },
      gte(c, v) { gtes.push([c, v]); return b; },
      lte(c, v) { ltes.push([c, v]); return b; },
      neq(c, v) { neqs.push([c, v]); return b; },
      in() { return b; },
      order() { return b; },
      limit() { return b; },
      maybeSingle() { const r = rows(); return Promise.resolve({ data: r[0] || null, error: null }); },
      single() { const r = rows(); return Promise.resolve({ data: r[0] || null, error: null }); },
      then(res, rej) { return settle().then(res, rej); },
    };
    return b;
  }
  const api = { from: (t) => builder(t), schema: () => api };
  return api;
}

// terminal handler off a router's own stack
function terminalHandler(routerModule) {
  const layer = routerModule.stack.find((l) => l.route);
  if (!layer) throw new Error('no route layer on this router');
  const stack = layer.route.stack;
  return stack[stack.length - 1].handle;
}

function mockRes() {
  const out = { statusCode: 200, body: null, warned: [] };
  const res = {
    status(c) { out.statusCode = c; return res; },
    json(b) { out.body = b; return res; },
  };
  return { res, out };
}

function dayOffsetISO(n) {
  return new Date(Date.now() + n * 86400000).toISOString().split('T')[0];
}

(async function main() {
  console.log('');
  console.log('TDW_09 MICRO BENCH — tree: ' + ROOT);
  console.log('');

  // ═══ L1 — T3-3: waitlist.js retires whole ═══════════════════════════════
  console.log('§1  L1 · T3-3 — waitlist.js retires whole');

  cell('§1.1 src/api/waitlist.js is GONE', () =>
    !has('src/api/waitlist.js') || 'file still on disk');

  cell('§1.2 router.js carries no waitlist require', () =>
    !/require\(['"]\.\/waitlist['"]\)/.test(read('src/api/router.js')) || 'require survives');

  cell('§1.3 router.js carries no waitlist mount', () =>
    !/router\.use\(\s*['"]\/waitlist['"]/.test(read('src/api/router.js')) || 'mount survives');

  cell('§1.4 the word waitlist appears nowhere in src/api/router.js', () =>
    !/waitlist/i.test(read('src/api/router.js')) || 'a waitlist token survives in the router');

  cell('§1.5 the excision is ATOMIC — no orphaned require of a deleted file', () => {
    // Comment lines are stripped first: router.js's own header quotes an
    // `app.use('/api/v2', require('./api/router'))` line that is prose, not code.
    const src = read('src/api/router.js')
      .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
    const reqs = src.match(/require\(['"]\.\/[A-Za-z0-9_\-\/]+['"]\)/g) || [];
    for (const r of reqs) {
      const rel = r.match(/['"](.+)['"]/)[1];
      const p = path.join(ROOT, 'src/api', rel);
      if (!fs.existsSync(p) && !fs.existsSync(p + '.js') && !fs.existsSync(path.join(p, 'index.js'))) {
        return 'router requires a file that does not exist: ' + rel;
      }
    }
    return true;
  });

  // ═══ L3 — F-09.50 / F-09.63: the dead reader and its lying header ════════
  console.log('');
  console.log('§2  L3 · F-09.50 + F-09.63 — the dead reader and its header');

  cell('§2.1 src/api/vendor/today.js is GONE', () =>
    !has('src/api/vendor/today.js') || 'the legacy reader is still on disk');

  cell('§2.2 nothing in src/ requires the legacy vendor/today', () => {
    const hits = [];
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const f = path.join(d, e.name);
        if (e.isDirectory()) { if (e.name !== 'node_modules') walk(f); continue; }
        if (!/\.(js|ts)$/.test(e.name)) continue;
        const s = fs.readFileSync(f, 'utf8');
        if (/require\(['"][^'"]*vendor\/today['"]\)/.test(s)) hits.push(f);
        if (/vendor\/core/.test(f) && /require\(['"]\.\/today['"]\)/.test(s)) hits.push(f);
      }
    })(path.join(ROOT, 'src'));
    return hits.length === 0 || 'caller survives at: ' + hits.join(', ');
  });

  cell('§2.3 F-09.63 — the header no longer crowns the corpse "the live"', () =>
    !/The live src\/api\/vendor\/today\.js/.test(read('src/api/vendor-engine/today.js'))
    || 'the header still calls the deleted file "The live"');

  cell('§2.4 F-09.63 — the header names THIS file as the live route', () => {
    const s = read('src/api/vendor-engine/today.js').split('const express')[0];
    return /THIS FILE IS THE LIVE/.test(s) || 'the cured header does not claim the route';
  });

  cell('§2.5 F-06.85 — the header names its MECHANISM by path+symbol, not a line', () => {
    const s = read('src/api/vendor-engine/today.js').split('const express')[0];
    if (!/src\/api\/vendor\/core\.js/.test(s)) return 'the flip mechanism is not named by path';
    if (!/symbol:/.test(s)) return 'the mechanism is not named by symbol';
    if (/core\.js:\d+/.test(s)) return 'path-over-range law: a line number was cited across files';
    return true;
  });

  // ═══ L4 — F-09.53: the covenant clause ═══════════════════════════════════
  console.log('');
  console.log('§3  L4 · F-09.53 — the covenant in vendor-engine/today.js');

  cell('§3.1 the events query carries .is(\'deleted_at\', null)', () =>
    /\.is\(\s*['"]deleted_at['"]\s*,\s*null\s*\)/.test(read('src/api/vendor-engine/today.js'))
    || 'the clause is absent');

  cell('§3.2 CONJUNCTION — the live condition is not replaced', () =>
    /\.eq\(\s*['"]state['"]\s*,\s*['"]upcoming['"]\s*\)/.test(read('src/api/vendor-engine/today.js'))
    || 'the state predicate was replaced instead of conjoined');

  // the behavioural cells — the NAMED TEST
  const today = dayOffsetISO(1);
  const eventsFixture = [
    { id: 'ev-live',    vendor_id: 'v1', title: 'Sharma sangeet',  kind: 'wedding', state: 'upcoming',  event_date: today, event_time: null, deleted_at: null },
    { id: 'ev-deleted', vendor_id: 'v1', title: 'Deleted wedding', kind: 'wedding', state: 'upcoming',  event_date: today, event_time: null, deleted_at: '2026-08-01T00:00:00Z' },
    { id: 'ev-cancel',  vendor_id: 'v1', title: 'Cancelled shoot', kind: 'wedding', state: 'cancelled', event_date: today, event_time: null, deleted_at: null },
  ];

  async function runToday() {
    const modPath = path.join(ROOT, 'src/api/vendor-engine/today.js');
    delete require.cache[require.resolve(modPath)];
    const handler = terminalHandler(require(modPath));
    const supabase = makeSupabase({
      users:   [{ id: 'u1', name: 'Dev' }],
      records: [],
      events:  eventsFixture,
    });
    const { res, out } = mockRes();
    const req = {
      app: { locals: { supabase } },
      params: { vendorId: 'v1' },
      vendor: { id: 'v1', user_id: 'u1' },
      agentId: 'a1',
    };
    await handler(req, res);
    return out;
  }

  await acell('§3.3 THE NAMED TEST — a soft-deleted UPCOMING event is ABSENT from this_week', async () => {
    const out = await runToday();
    if (!out.body) return 'handler returned no body';
    const week = out.body.this_week || [];
    return !week.some((e) => e.id === 'ev-deleted')
      || 'the soft-deleted wedding was served to the vendor';
  });

  await acell('§3.4 the cure does not over-filter — the live event still arrives', async () => {
    const out = await runToday();
    const week = out.body.this_week || [];
    return week.some((e) => e.id === 'ev-live') || 'the live event was filtered out too';
  });

  await acell('§3.5 the state predicate still bites — a cancelled row stays out', async () => {
    const out = await runToday();
    const week = out.body.this_week || [];
    return !week.some((e) => e.id === 'ev-cancel') || 'a cancelled row reached this_week';
  });

  // ═══ L2 — F-09.48: pin-status answers for both roles ═════════════════════
  console.log('');
  console.log('§4  L2 · F-09.48 — pin-status, both roles in one call');

  async function runPinStatus(body, tables) {
    const modPath = path.join(ROOT, 'src/api/pin-status.js');
    delete require.cache[require.resolve(modPath)];
    const handler = terminalHandler(require(modPath));
    const supabase = makeSupabase(tables);
    const { res, out } = mockRes();
    await handler({ app: { locals: { supabase } }, body }, res);
    return out;
  }

  const PHONE = '+919888294440';
  const bothTables = {
    users:   [{ id: 'u1', phone: PHONE }],
    vendors: [{ id: 'ven1', user_id: 'u1', pin_hash: 'x' }],
    couples: [],
  };

  await acell('§4.1 BACKWARD COMPAT — role:vendor returns the single-role shape unchanged', async () => {
    const out = await runPinStatus({ phone: PHONE, role: 'vendor' }, bothTables);
    const b = out.body;
    if (out.statusCode !== 200) return 'status ' + out.statusCode;
    if (b.exists !== true || b.pin_set !== true) return 'single-role fields wrong: ' + JSON.stringify(b);
    if (b.role_id !== 'ven1' || b.user_id !== 'u1') return 'ids wrong: ' + JSON.stringify(b);
    if ('vendor' in b || 'couple' in b) return 'the single-role body grew both-roles keys';
    return true;
  });

  await acell('§4.2 BACKWARD COMPAT — role:couple with no couples row is still exists:false', async () => {
    const out = await runPinStatus({ phone: PHONE, role: 'couple' }, bothTables);
    const b = out.body;
    return (b.ok === true && b.exists === false && b.pin_set === false && !('vendor' in b))
      || 'drifted: ' + JSON.stringify(b);
  });

  await acell('§4.3 BACKWARD COMPAT — a PRESENT but bad role is the same 400, byte-identical', async () => {
    const out = await runPinStatus({ phone: PHONE, role: 'planner' }, bothTables);
    return (out.statusCode === 400 && out.body.error === 'role must be vendor or couple.')
      || 'drifted: ' + out.statusCode + ' ' + JSON.stringify(out.body);
  });

  await acell('§4.4 THE CURE — role ABSENT answers for both roles in one call', async () => {
    const out = await runPinStatus({ phone: PHONE }, bothTables);
    const b = out.body;
    if (out.statusCode !== 200) return 'status ' + out.statusCode + ' ' + JSON.stringify(b);
    if (!b.vendor || !b.couple) return 'no both-roles body: ' + JSON.stringify(b);
    if (b.vendor.exists !== true || b.vendor.pin_set !== true) return 'vendor arm wrong';
    if (b.couple.exists !== false) return 'couple arm wrong';
    if (b.user_id !== 'u1') return 'user_id missing';
    return true;
  });

  await acell('§4.5 role ABSENT, unknown phone — both arms absent, user_id null', async () => {
    const out = await runPinStatus({ phone: '+910000000000' }, bothTables);
    const b = out.body;
    return (b.ok === true && b.user_id === null &&
            b.vendor.exists === false && b.couple.exists === false)
      || 'drifted: ' + JSON.stringify(b);
  });

  await acell('§4.6 NON-EXCLUSIVITY (0028:43, XOR on INSERT only) — both rows are REPORTED, not resolved', async () => {
    const out = await runPinStatus({ phone: PHONE }, {
      users:   [{ id: 'u1', phone: PHONE }],
      vendors: [{ id: 'ven1', user_id: 'u1', pin_hash: 'x' }],
      couples: [{ id: 'cou1', user_id: 'u1', pin_hash: null }],
    });
    const b = out.body;
    if (out.statusCode !== 200) return 'the endpoint threw instead of telling the truth';
    if (b.vendor.exists !== true || b.couple.exists !== true) return 'a populated row was silently dropped';
    if (b.couple.pin_set !== false) return 'couple pin_set wrong';
    return true;
  });

  await acell('§4.7 role ABSENT still validates the phone — same 400 string', async () => {
    const out = await runPinStatus({ phone: '98882' }, bothTables);
    return (out.statusCode === 400 &&
            out.body.error === 'phone must be E.164 with leading + (e.g. +918757788550).')
      || 'drifted: ' + JSON.stringify(out.body);
  });

  cell('§4.8 COPY — expected-zero: the four error strings are byte-identical', () => {
    const s = read('src/api/pin-status.js');
    const wanted = [
      "'role must be vendor or couple.'",
      "'phone must be E.164 with leading + (e.g. +918757788550).'",
      "'database_error'",
      "'internal_error'",
    ];
    for (const w of wanted) if (!s.includes(w)) return 'missing or altered: ' + w;
    return true;
  });

  // ═══ verdict ═════════════════════════════════════════════════════════════
  console.log('');
  console.log('─'.repeat(66));
  console.log('  tdw09_micro  ' + pass + '/' + (pass + fail));
  if (fail) {
    console.log('');
    for (const f of fails) console.log('  RED  ' + f);
  }
  console.log('─'.repeat(66));
  console.log('');
  process.exit(fail ? 1 : 0);
})();
