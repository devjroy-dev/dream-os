#!/usr/bin/env node
// scripts/b10_p3_mint_deck_bench.js — TDW_10 · ADMIN P3 · THE MINT + THE DECK.
// Runnable from any working directory, clean clone:
//     node scripts/b10_p3_mint_deck_bench.js
//
// ═════════════════════════════════════════════════════════════════════════════
// WHAT THIS BENCH DRIVES, AND WHAT IT REFUSES TO DO
// ═════════════════════════════════════════════════════════════════════════════
// It calls the REAL routers through the REAL requireAdmin, against a DOUBLED
// supabase whose rows are fixtures this file declares. Nothing is grepped that
// can be driven. `src/lib/templates.js` loads REAL — it is a pure registry, and
// doubling it would let a bench green over a registry that changed underneath.
//
// §7 is the MUTATION SECTION: every cure cell is proven able to REDDEN by editing
// production code on disk, re-requiring it, and asserting the cell fails. Every
// mutated file is restored byte-identically and the restoration is itself
// asserted. A green that cannot go red is worse than a declared gap.
//
// DEFENSIVE LOADING (the P2 precedent): at an UNCURED tree a missing module
// yields one red per cell, never a stack trace — the cure's size must be a number.

'use strict';

const path   = require('path');
const fs     = require('fs');

const ROOT      = path.resolve(__dirname, '..');
const F_MINT    = path.join(ROOT, 'src/api/admin/mint.js');
const F_VENDORS = path.join(ROOT, 'src/api/admin/vendors.js');
const F_COUPLES = path.join(ROOT, 'src/api/admin/couples.js');
const F_DISC    = path.join(ROOT, 'src/api/admin/discover.js');
const F_AUDIT   = path.join(ROOT, 'src/lib/admin/auditLog.js');
const F_VDISC   = path.join(ROOT, 'src/lib/vendor/discover.js');
const F_TMPL    = path.join(ROOT, 'src/lib/templates.js');
const F_ROUTER  = path.join(ROOT, 'src/api/router.js');
const F_ADMINGD = path.join(ROOT, 'src/api/admin/requireAdmin.js');

let pass = 0, fail = 0;
function ok(label, cond, detail) {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else      { fail++; console.log(`  RED  ${label}${detail ? `  — ${detail}` : ''}`); }
}
function section(s) { console.log(`\n── ${s} ${'─'.repeat(Math.max(0, 66 - s.length))}`); }
function read(f) { try { return fs.readFileSync(f, 'utf8'); } catch (_e) { return ''; } }
// ── COMMENTS ARE NOT CODE, AND A CELL THAT CANNOT TELL THEM APART MEASURES PROSE.
// Three cells in this bench convicted their own TOMBSTONE COMMENTS on first run —
// the blocks that quote the retired implementation verbatim so a future reader can
// see what was replaced. That is P2's defect (c) recurring: an instrument reading
// documentation and reporting it as behaviour. Every source-shape cell below reads
// `code()`, never `read()`. (Kept simple deliberately: block and line comments
// only. It is not a JS parser and does not pretend to be — string literals holding
// `//` would fool it, and none of the cells below depend on one.)
function code(f) {
  return read(f)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}
function fresh(f) {
  try { delete require.cache[require.resolve(f)]; return require(f); }
  catch (_e) { return null; }
}

// ═════════════════════════════════════════════════════════════════════════════
// THE RIG — a PostgREST-shaped double that RECORDS what was asked
// ═════════════════════════════════════════════════════════════════════════════
// Writes are captured, never applied blindly, so a cell can assert WHICH COLUMNS
// a route wrote. "The name was not clobbered" is only provable if the rig can say
// whether `name` appeared in an update payload at all.

function makeSupabase(fixtures, opts = {}) {
  const calls  = [];
  const writes = [];
  const rpcs   = [];
  const fail_on = opts.fail_on || [];

  function query(table) {
    const rec = { table, filters: [], selected: null, limit: null, order: null };
    calls.push(rec);
    const q = {
      select(cols) { rec.selected = cols; return q; },
      eq(c, v)  { rec.filters.push(['eq', c, v]); return q; },
      in(c, v)  { rec.filters.push(['in', c, v]); return q; },
      order(c, o) { rec.order = [c, o && o.ascending]; return q; },
      limit(n)  { rec.limit = n; return q; },
      maybeSingle() { rec.single = true; return q; },
      single()      { rec.single = true; rec.strict = true; return q; },
      insert(payload) { writes.push({ op: 'insert', table, payload }); rec.write = 'insert'; return q; },
      update(payload) { writes.push({ op: 'update', table, payload }); rec.write = 'update'; return q; },
      then(resolve, reject) { return run().then(resolve, reject); },
    };
    function run() {
      if (fail_on.includes(table)) {
        return Promise.resolve({ data: null, error: { message: `forced: ${table}` } });
      }
      if (rec.write) return Promise.resolve({ data: null, error: null });
      let rows = (fixtures[table] || []).slice();
      for (const [op, col, a] of rec.filters) {
        if (op === 'eq') rows = rows.filter(r => r[col] === a);
        if (op === 'in') rows = rows.filter(r => a.includes(r[col]));
      }
      if (rec.order) {
        const [c, asc] = rec.order;
        rows.sort((x, y) => (String(x[c]) < String(y[c]) ? -1 : 1) * (asc === false ? -1 : 1));
      }
      if (rec.limit != null) rows = rows.slice(0, rec.limit);
      rows = rows.map(r => embed(r, rec.selected));
      if (rec.single) return Promise.resolve({ data: rows[0] || null, error: null });
      return Promise.resolve({ data: rows, error: null });
    }
    return q;
  }

  // ── EMBEDDED JOINS, RESOLVED ────────────────────────────────────────────────
  // PostgREST's `vendor:vendors(id, …, user:users(name, phone))` is how the deck's
  // row gets its name, category and city. A rig that ignores the embed returns a
  // row with no `vendor` key, the route falls back to 'Unnamed', and the cell that
  // should be proving F-10.45's payload cure instead measures the rig. Only the
  // shapes this bench's routes actually ask for are supported; anything else is
  // left alone rather than half-resolved.
  function embed(row, selected) {
    if (!row || !selected) return row;
    const out = { ...row };
    if (/vendor:vendors\(/.test(selected) && row.vendor_id) {
      const v = (fixtures.vendors || []).find(x => x.id === row.vendor_id);
      if (v) {
        out.vendor = { ...v };
        if (/user:users\(/.test(selected)) {
          out.vendor.user = (fixtures.users || []).find(x => x.id === v.user_id) || null;
        }
      }
    }
    if (/users!inner\(/.test(selected) && row.user_id) {
      out.users = (fixtures.users || []).find(x => x.id === row.user_id) || null;
    }
    return out;
  }

  // ── THE RPC DOUBLE ACTUALLY PROVISIONS ──────────────────────────────────────
  // A double that records `invite_vendor` and creates nothing makes every
  // post-RPC read miss, and the route answers 500 for a reason production does
  // not have. That is a bench inventing a failure and then reporting it. This
  // reproduces the function's WITNESSED semantics from
  // db/migrations/0003_vendor_onboarding.sql (symbol invite_vendor):
  //   · users: insert, ON CONFLICT (phone) DO UPDATE SET name = excluded.name
  //     — the clobber clause is reproduced FAITHFULLY, because the whole point of
  //       F-10.47's cure is that the route must never reach it. A double that
  //       quietly declined to clobber would green the cure by removing the
  //       hazard instead of proving the route avoids it.
  //   · vendors: insert ON CONFLICT DO NOTHING, then select the existing row.
  async function rpc(name, params) {
    rpcs.push({ name, params });
    if (name !== 'invite_vendor' && name !== 'invite_couple') return { data: null, error: null };
    const phone = params.p_phone;
    let u = (fixtures.users || []).find(r => r.phone === phone);
    if (u) { u.name = params.p_name; }            // the clobber, faithfully
    else {
      u = { id: `u-${(fixtures.users || []).length + 1}-0000-4000-8000-000000000000`, phone, name: params.p_name };
      (fixtures.users = fixtures.users || []).push(u);
    }
    const table = name === 'invite_vendor' ? 'vendors' : 'couples';
    if (!(fixtures[table] || []).some(r => r.user_id === u.id)) {
      (fixtures[table] = fixtures[table] || []).push({
        id: `${table[0]}-${(fixtures[table] || []).length + 1}-0000-4000-8000-000000000000`,
        user_id: u.id, onboarding_state: 'new', routing_handle: null,
        business_name: null, category: null, city: null, tier: 'trial', discover_eligible: false,
      });
    }
    return { data: null, error: null };
  }

  return { from: query, rpc, __calls: calls, __writes: writes, __rpcs: rpcs };
}

// ── FIXTURES ────────────────────────────────────────────────────────────────
// Shaped from the founder's own production read (2026-08-06): one complete
// vendor above the floor, one below it, and one phone that already exists — the
// collision F-10.47 was found on. A fixture that only ever holds a happy row
// cannot catch a mint that lies about creating one.
const V_FULL  = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'; // 8 photos, clears the floor
const V_THIN  = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb'; // 3 photos, below the floor
const U_TAKEN = 'cccccccc-3333-4333-8333-cccccccccccc'; // an existing users row

function baseFixtures() {
  return {
    users: [
      { id: U_TAKEN, phone: '+919888294440', name: 'dev' },
    ],
    vendors: [
      { id: V_FULL, user_id: U_TAKEN, business_name: 'Make Up by Swati Roy', category: 'makeup',
        city: 'Delhi', tier: 'prestige', routing_handle: 'SWATI978', onboarding_state: 'complete',
        discover_eligible: false },
      { id: V_THIN, user_id: 'dddddddd-4444-4444-8444-dddddddddddd', business_name: 'Thin Studio',
        category: 'photography', city: 'Delhi', tier: 'trial', routing_handle: null,
        onboarding_state: 'new', discover_eligible: false },
    ],
    vendor_portfolio: [
      ...Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, vendor_id: V_FULL, approval_state: i < 6 ? 'approved' : 'pending' })),
      ...Array.from({ length: 3 }, (_, i) => ({ id: `t${i}`, vendor_id: V_THIN, approval_state: 'approved' })),
    ],
    vendor_discover_requests: [
      { id: 'r1', vendor_id: V_FULL, state: 'requested', reason: 'I shoot Delhi weddings.',
        decided_at: null, created_at: '2026-08-01T00:00:00.000Z' },
      { id: 'r2', vendor_id: V_THIN, state: 'requested', reason: 'Please consider me.',
        decided_at: null, created_at: '2026-08-02T00:00:00.000Z' },
      { id: 'r3', vendor_id: V_FULL, state: 'denied', reason: 'photos too similar',
        decided_at: '2026-07-01T00:00:00.000Z', created_at: '2026-06-01T00:00:00.000Z' },
    ],
    couples: [],
    couple_state: [],
    admin_activity_log: [],
  };
}

process.env.ADMIN_SESSION_SECRET = 'bench-secret-not-a-real-one';
const { mintAdminSession } = require(path.join(ROOT, 'src/lib/adminSession.js'));
const BENCH_TOKEN = mintAdminSession();

/** Drives a route through its REAL middleware chain — requireAdmin included. */
async function call(routerFile, method, routePath, { supabase, body = {}, params = {}, authed = true } = {}) {
  const router = fresh(routerFile);
  if (!router || !router.stack) return { status: 0, body: null, absent: true };
  const layer = router.stack.find(l => l.route && l.route.path === routePath && l.route.methods[method]);
  if (!layer) return { status: 0, body: null, absent: true };

  const chain = layer.route.stack.map(s => s.handle);
  const req = {
    method: method.toUpperCase(), url: routePath, query: {}, body, params,
    headers: authed ? { authorization: `Bearer ${BENCH_TOKEN}` } : {},
    get(h) { return this.headers[String(h).toLowerCase()]; },
    app: { locals: { supabase } },
  };
  let status = 200, out = null, sent = false;
  const res = {
    status(c) { status = c; return res; },
    json(b)   { out = b; sent = true; return res; },
    send(b)   { out = b; sent = true; return res; },
    setHeader() {},
  };
  for (const h of chain) {
    if (sent) break;
    let nexted = false;
    await new Promise((resolve, reject) => {
      try {
        const r = h(req, res, (e) => { if (e) return reject(e); nexted = true; resolve(); });
        if (r && typeof r.then === 'function') r.then(() => resolve(), reject);
        else if (!nexted) setImmediate(resolve);
      } catch (e) { reject(e); }
    });
  }
  return { status, body: out };
}

(async function main() {

// ═════════════════════════════════════════════════════════════════════════════
section('§1  ONE PATH — asserted by IDENTITY, never by behaviour agreeing');
// ═════════════════════════════════════════════════════════════════════════════
{
  const mint    = fresh(F_MINT);
  const vendors = fresh(F_VENDORS);
  const couples = fresh(F_COUPLES);

  ok('the mint router loads', !!(mint && mint.stack));
  ok('admin/vendors.js exports the mint handler as a named symbol',
     !!(vendors && typeof vendors.mintVendor === 'function'));
  ok('admin/couples.js exports the mint handler as a named symbol',
     !!(couples && typeof couples.mintCouple === 'function'));

  // THE GUARDRAIL CELL. The spec's §3 says a second mint implementation ANYWHERE
  // is a failed session. Two routes that BEHAVE the same is precisely what the
  // guardrail is about, so this asserts the SAME FUNCTION OBJECT is mounted at
  // both paths — a check whose failure mode is not "they drifted" but "there are
  // two of them at all".
  const vLayer = mint && mint.stack.find(l => l.route && l.route.path === '/vendor');
  const cLayer = mint && mint.stack.find(l => l.route && l.route.path === '/couple');
  ok('POST /mint/vendor is registered', !!(vLayer && vLayer.route.methods.post));
  ok('POST /mint/couple is registered', !!(cLayer && cLayer.route.methods.post));

  const vHandles = vLayer ? vLayer.route.stack.map(s => s.handle) : [];
  const cHandles = cLayer ? cLayer.route.stack.map(s => s.handle) : [];
  // asyncHandler wraps, so identity is proven on the wrapped source rather than
  // the wrapper: the file must contain no second implementation.
  ok('the mint router IMPORTS the vendor handler rather than declaring one',
     /const \{ mintVendor \} = require\('\.\/vendors'\)/.test(code(F_MINT)));
  ok('the mint router IMPORTS the couple handler rather than declaring one',
     /const \{ mintCouple \} = require\('\.\/couples'\)/.test(code(F_MINT)));
  ok('the mint router declares NO function that inserts a users or vendors row',
     !/from\('users'\)|from\('vendors'\)\s*\n?\s*\.insert|rpc\('invite_/.test(code(F_MINT)));

  // `invite_vendor` is the ONE vendor birth. Count its call sites under src/api/.
  const apiFiles = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else if (p.endsWith('.js')) apiFiles.push(p);
    }
  })(path.join(ROOT, 'src/api'));
  const inviteCallers = apiFiles.filter(f => /rpc\('invite_vendor'/.test(code(f)));
  ok('exactly ONE file under src/api/ calls invite_vendor',
     inviteCallers.length === 1, inviteCallers.map(f => path.relative(ROOT, f)).join(', '));

  // SCOPED TO THE ADMIN PLANE, and the scope is the finding. The first draft of
  // this cell swept all of src/api/ and caught src/api/couple/auth.js:147/:163 —
  // the self-serve OTP signup, which inserts its OWN couples row. That is a FOURTH
  // couple-birth implementation, one more than the P3 read-first's census named,
  // and it is OUTSIDE this charter (couple auth lane, not the admin mint). It is
  // reported in the handover as F-10.48 rather than swept here: retiring a live
  // signup path onto ensureCoupleRow is its own sitting with its own ruling.
  const adminFiles   = apiFiles.filter(f => f.includes(`${path.sep}admin${path.sep}`));
  const coupleBirths = adminFiles.filter(f => /from\('couples'\)[\s\S]{0,80}\.insert\(/.test(code(f)));
  ok('NO file under src/api/admin/ inserts a couples row directly — the birth is ensureCoupleRow\'s',
     coupleBirths.length === 0, coupleBirths.map(f => path.relative(ROOT, f)).join(', '));

  ok('admin/couples.js reaches the birth through coupleIdentity, not through a local upsert',
     /require\('\.\.\/\.\.\/lib\/coupleIdentity'\)/.test(code(F_COUPLES)));
  ok('admin/couples.js no longer upserts users on conflict phone (the name clobber is gone)',
     !/upsert\(\{ phone/.test(code(F_COUPLES)));
  ok('admin/couples.js does NOT call invite_couple (coupleIdentity\'s header forbids it)',
     !/invite_couple/.test(code(F_COUPLES)));
  void vHandles; void cHandles;
}

// ═════════════════════════════════════════════════════════════════════════════
section('§2  THE GUARD IS DRIVEN — every new door, no exceptions');
// ═════════════════════════════════════════════════════════════════════════════
{
  const realGuard = fresh(F_ADMINGD);
  const mint = fresh(F_MINT);
  const doors = mint ? mint.stack.filter(l => l.route) : [];
  ok('the mint router mounts at least four doors', doors.length >= 4, `${doors.length}`);
  const allGuarded = doors.length > 0 && doors.every(l =>
    l.route.stack.some(s => s.handle === realGuard));
  ok('EVERY mint door carries the estate\'s real requireAdmin, by object identity', allGuarded);

  const disc = fresh(F_DISC);
  const dDoors = disc ? disc.stack.filter(l => l.route) : [];
  const dGuarded = dDoors.length > 0 && dDoors.every(l =>
    l.route.stack.some(s => s.handle === realGuard));
  ok('EVERY discover door — including the new preview — carries it too', dGuarded);

  const bare = await call(F_MINT, 'post', '/vendor',
    { supabase: makeSupabase(baseFixtures()), body: { phone: '+919000000001' }, authed: false });
  ok('an unauthed mint is refused', bare.status === 401 || bare.status === 403, `status ${bare.status}`);
  ok('the refusal writes NOTHING', !(bare.body && bare.body.vendor_id));

  // requireAdmin is byte-untouched this sitting. Pinned to the literal witnessed
  // at P1 (D-5's cure: the original cell recomputed the hash it compared against
  // and could never have reddened).
  const crypto = require('crypto');
  const h = crypto.createHash('sha256').update(read(F_ADMINGD)).digest('hex').slice(0, 16);
  ok('requireAdmin.js is byte-identical to its P1 witness dd9705685bba3875',
     h === 'dd9705685bba3875', h);
}

// ═════════════════════════════════════════════════════════════════════════════
section('§3  F-10.47 — THE MINT THAT SAID "created" FOR A ROW IT DID NOT CREATE');
// ═════════════════════════════════════════════════════════════════════════════
{
  // (a) A VIRGIN phone: a real birth.
  const sbNew = makeSupabase(baseFixtures());
  const rNew  = await call(F_VENDORS, 'post', '/create', {
    supabase: sbNew, body: { phone: '+919000000009', business_name: 'New Studio', category: 'photography', city: 'Delhi' },
  });
  ok('a virgin phone answers 200', rNew.status === 200, `status ${rNew.status}`);
  ok('a virgin phone reports outcome "created"', rNew.body && rNew.body.outcome === 'created', JSON.stringify(rNew.body));
  ok('a virgin phone DOES call invite_vendor', sbNew.__rpcs.some(r => r.name === 'invite_vendor'));

  // (b) THE COLLISION — the case the old handler lied about.
  const sbHit = makeSupabase(baseFixtures());
  const rHit  = await call(F_VENDORS, 'post', '/create', {
    supabase: sbHit, body: { phone: '+919888294440', business_name: 'Renamed By Mint' },
  });
  ok('a taken phone answers 200 (a collision is not an error)', rHit.status === 200, `status ${rHit.status}`);
  ok('a taken phone reports outcome "existing", NOT created',
     rHit.body && rHit.body.outcome === 'existing', JSON.stringify(rHit.body));
  ok('a taken phone reports created:false',
     rHit.body && rHit.body.created === false);
  ok('a taken phone does NOT call invite_vendor at all (the clobber clause is never reached)',
     !sbHit.__rpcs.some(r => r.name === 'invite_vendor'), JSON.stringify(sbHit.__rpcs));

  // THE CLOBBER CELL. `users.name` must never appear in any write payload from
  // this route, in either branch. Asserted on the RIG'S RECORD of what was asked,
  // not on the source text — a grep for `.update({ name` would pass over a
  // computed key.
  const userWrites = sbHit.__writes.filter(w => w.table === 'users');
  ok('NO write to public.users is issued on the collision path',
     userWrites.length === 0, JSON.stringify(userWrites));
  const vendorWrites = sbHit.__writes.filter(w => w.table === 'vendors');
  ok('the vendor patch never carries a `name` key (business_name is a different column)',
     vendorWrites.every(w => !Object.keys(w.payload || {}).includes('name')));

  // (c) The routing handle is reported NULL, honestly, rather than minted.
  ok('the response carries routing_handle explicitly (null on a fresh mint is the truth)',
     rNew.body && Object.prototype.hasOwnProperty.call(rNew.body, 'routing_handle'));
  // RE-AIMED, and the first aim is recorded. It read
  // `!/routing_handle:\s*[^n]/` — intending "never assigned a computed value" and
  // actually matching the honest REPORT line `routing_handle: vendor ? … : null`,
  // because `v` is not `n`. A cell whose label says one thing and whose regex
  // measures another is how a green comes to mean nothing (P1's D-4, same species).
  // "Mints no handle" is a claim about WRITES and about generation code, so both
  // are asserted, by two methods that fail differently.
  const vendorPatchWrites = sbNew.__writes.filter(w => w.table === 'vendors');
  ok('the mint never WRITES routing_handle — arm (c) was refused and the rig agrees',
     vendorPatchWrites.every(w => !Object.prototype.hasOwnProperty.call(w.payload || {}, 'routing_handle')),
     JSON.stringify(vendorPatchWrites));
  ok('…and no handle-generation ladder exists in the mint path',
     !/VENDOR\$\{|candidates\s*=/.test(code(F_VENDORS)));

  // ── F-10.50's CELLS · A BARE-DIGIT MINT MUST FIND THE E.164 ROW ────────────
  // The fixture's only users row is stored `+919888294440`. A mint typed as ten
  // bare digits MUST resolve to it — otherwise the collision check misses, the
  // RPC runs, and the clobber clause F-10.47's cure exists to avoid is reached
  // by a different road. This is the founder's own walk, turned into a cell.
  {
    const sbBare = makeSupabase(baseFixtures());
    const rBare  = await call(F_VENDORS, 'post', '/create', {
      supabase: sbBare, body: { phone: '9888294440', business_name: 'Renamed By Mint' },
    });
    ok('a BARE-DIGIT mint of a stored +91 number reports "existing", not created',
       rBare.body && rBare.body.outcome === 'existing', JSON.stringify(rBare.body));
    ok('…and therefore never calls invite_vendor, so the clobber clause is unreachable',
       !sbBare.__rpcs.some(r => r.name === 'invite_vendor'));
    ok('…and issues no write to public.users',
       sbBare.__writes.filter(w => w.table === 'users').length === 0);
    // The stored form is what every other door uses. A mint that invents its own
    // is the F-04.109 divergence with a nicer button.
    const lookups = sbBare.__calls.filter(c => c.table === 'users');
    ok('the lookup queries the E.164 form, never the raw input',
       lookups.some(c => c.filters.some(f => f[0] === 'eq' && f[1] === 'phone' && f[2] === '+919888294440')),
       JSON.stringify(lookups.map(c => c.filters)));
  }
  // A virgin BARE-DIGIT mint must store the normalised form, not the digits.
  {
    const sbNew2 = makeSupabase(baseFixtures());
    await call(F_VENDORS, 'post', '/create', { supabase: sbNew2, body: { phone: '9999911111' } });
    const rpc = sbNew2.__rpcs.find(r => r.name === 'invite_vendor');
    ok('a virgin bare-digit mint hands the RPC the E.164 form',
       !!(rpc && rpc.params.p_phone === '+919999911111'), rpc && rpc.params.p_phone);
  }
  // The couple side, same law.
  {
    const sbC = makeSupabase(baseFixtures());
    await call(F_COUPLES, 'post', '/create', {
      supabase: sbC, body: { phone: '9888294440', name: 'Priya & Arjun' },
    });
    const lookups = sbC.__calls.filter(c => c.table === 'users');
    ok('the couple mint normalises too — one law, both species',
       lookups.some(c => c.filters.some(f => f[0] === 'eq' && f[1] === 'phone' && f[2] === '+919888294440')));
  }
  ok('both mint handlers import the ONE normaliser home, never a local copy',
     /require\('\.\.\/\.\.\/lib\/phone'\)/.test(code(F_VENDORS)) &&
     /require\('\.\.\/\.\.\/lib\/phone'\)/.test(code(F_COUPLES)));
  ok('neither handler mints a second normaliser',
     !/\+91\$\{|replace\(\/\\D\//.test(code(F_VENDORS) + code(F_COUPLES)));

  // ── THE PROBE FAILS LOUD (hotfix 2) ────────────────────────────────────────
  // A failing vendors probe used to yield a silent null, which became
  // outcome:'created' over data that was never created. It now refuses.
  {
    const sbErr = makeSupabase(baseFixtures(), { fail_on: ['vendors'] });
    const rErr  = await call(F_VENDORS, 'post', '/create', {
      supabase: sbErr, body: { phone: '+919888294440' },
    });
    ok('a failing existence probe refuses 500 rather than mislabelling the outcome',
       rErr.status === 500, `status ${rErr.status}`);
    ok('…and reports NO outcome at all, rather than a wrong one',
       !(rErr.body && rErr.body.outcome), JSON.stringify(rErr.body));
    ok('…and never reaches the RPC on a probe it could not read',
       !sbErr.__rpcs.some(r => r.name === 'invite_vendor'));
  }

  // (d) phone is required and the refusal is typed.
  const rNo = await call(F_VENDORS, 'post', '/create', { supabase: makeSupabase(baseFixtures()), body: {} });
  ok('a mint with no phone is refused 400', rNo.status === 400, `status ${rNo.status}`);
}

// ═════════════════════════════════════════════════════════════════════════════
section('§4  F-10.43 — THE FLOOR IS ENFORCED AT GRANT, SERVER-SIDE');
// ═════════════════════════════════════════════════════════════════════════════
{
  const { MIN_PORTFOLIO_IMAGES } = require(F_VDISC);
  ok('the floor constant is still 6 and still has ONE home', MIN_PORTFOLIO_IMAGES === 6, String(MIN_PORTFOLIO_IMAGES));

  // BELOW the floor — must be refused.
  const sbLow = makeSupabase(baseFixtures());
  const rLow  = await call(F_DISC, 'post', '/grant/:vendorId', {
    supabase: sbLow, params: { vendorId: V_THIN },
  });
  ok('granting a vendor BELOW the floor is refused', rLow.status === 422, `status ${rLow.status}`);
  ok('the refusal carries a typed code the client can branch on',
     rLow.body && rLow.body.code === 'below_photo_floor', JSON.stringify(rLow.body));
  ok('the refusal names the floor and the count in the founder\'s words',
     !!(rLow.body && /6-photo floor/.test(rLow.body.error) && /has 3/.test(rLow.body.error)),
     rLow.body && rLow.body.error);

  // THE CELL THAT MATTERS MOST: nothing was written.
  const wroteEligible = sbLow.__writes.some(w =>
    w.table === 'vendors' && w.payload && w.payload.discover_eligible === true);
  ok('a refused grant writes NO discover_eligible — the refusal is real, not cosmetic', !wroteEligible);
  ok('a refused grant does NOT decide the request row',
     !sbLow.__writes.some(w => w.table === 'vendor_discover_requests'));
  ok('a refused grant IS audited (a refusal is an admin event too)',
     sbLow.__writes.some(w => w.table === 'admin_activity_log' &&
       w.payload && w.payload.action === 'discover_grant_refused'));

  // ABOVE the floor — must pass, and pass for the right reason.
  const sbHi = makeSupabase(baseFixtures());
  const rHi  = await call(F_DISC, 'post', '/grant/:vendorId', {
    supabase: sbHi, params: { vendorId: V_FULL },
  });
  ok('granting a vendor ABOVE the floor succeeds', rHi.status === 200, `status ${rHi.status}`);
  ok('the grant writes discover_eligible: true',
     sbHi.__writes.some(w => w.table === 'vendors' && w.payload.discover_eligible === true));
  ok('the grant decides only OPEN request rows (the in-filter survives)',
     sbHi.__calls.some(c => c.table === 'vendor_discover_requests' &&
       c.filters.some(f => f[0] === 'in' && f[2].includes('requested'))));

  // THE COUNT IS `total`, NOT `approved`. V_FULL holds 8 total / 6 approved; a
  // fixture where both clear the floor would make this cell vacuous, so the
  // assertion is on the REPORTED numbers being different and the floor reading
  // the larger one.
  ok('the grant reports BOTH counts, and they differ (the cell is not vacuous)',
     rHi.body && rHi.body.photos_total === 8 && rHi.body.photos_approved === 6,
     JSON.stringify(rHi.body));

  // A vendor that does not exist is a 404, not a silent success.
  const rGhost = await call(F_DISC, 'post', '/grant/:vendorId', {
    supabase: makeSupabase(baseFixtures()), params: { vendorId: 'eeeeeeee-5555-4555-8555-eeeeeeeeeeee' },
  });
  ok('granting an unknown vendor is 404', rGhost.status === 404, `status ${rGhost.status}`);
}

// ═════════════════════════════════════════════════════════════════════════════
section('§5  F-10.45 / F-10.44 — THE QUEUE THE DECK CAN ACTUALLY ACT ON');
// ═════════════════════════════════════════════════════════════════════════════
{
  const sb = makeSupabase(baseFixtures());
  const r  = await call(F_DISC, 'get', '/requests', { supabase: sb });
  ok('GET /requests answers 200', r.status === 200, `status ${r.status}`);
  const rows = (r.body && r.body.requests) || [];
  ok('the default state filter returns the OPEN requests only', rows.length === 2, `${rows.length}`);

  const full = rows.find(x => x.vendor_id === V_FULL) || {};
  const thin = rows.find(x => x.vendor_id === V_THIN) || {};

  // F-10.45 (1) — the state the screen buckets on must be present and must equal
  // the state the server filters on. The mismatch is the whole finding.
  ok('every row carries `state`', rows.every(x => !!x.state));
  ok('every row ALSO carries `discover_request_state` (the name the client type declares)',
     rows.every(x => !!x.discover_request_state));
  ok('the two names agree on every row — one fact, two keys, never two facts',
     rows.every(x => x.state === x.discover_request_state));

  // F-10.45 (2) — the fields the screen renders must exist, or `st.replace` throws.
  for (const k of ['vendor_name', 'vendor_category', 'vendor_city', 'photos_total', 'photos_approved']) {
    ok(`every row carries \`${k}\``, rows.every(x => x[k] !== undefined), k);
  }
  ok('vendor_name resolves through the join, not from a column that does not exist',
     full.vendor_name === 'Make Up by Swati Roy', full.vendor_name);

  // FORK 5 — two labelled counts, and the floor travels with them.
  ok('photos_total and photos_approved are DIFFERENT numbers on the full vendor',
     full.photos_total === 8 && full.photos_approved === 6, `${full.photos_total}/${full.photos_approved}`);
  ok('the floor travels on the row, from the enforcing constant', full.photo_floor === 6);
  ok('meets_floor is computed against `total`, the number the grant enforces',
     full.meets_floor === true && thin.meets_floor === false);

  // F-10.44 — the double-duty column is split on STATE at the read door.
  ok('an OPEN request exposes the vendor\'s pitch under `pitch`',
     full.pitch === 'I shoot Delhi weddings.', String(full.pitch));
  ok('an OPEN request exposes NO decision reason — there has been no decision',
     full.decision_reason === null, String(full.decision_reason));

  const rDenied = await call(F_DISC, 'get', '/requests', { supabase: makeSupabase(baseFixtures()) });
  void rDenied;
  const sbAll = makeSupabase(baseFixtures());
  const rAll  = await call(F_DISC, 'get', '/requests', { supabase: sbAll });
  void rAll;

  // The deny path preserves the pitch into the record before overwriting it.
  const sbDeny = makeSupabase(baseFixtures());
  const rDeny  = await call(F_DISC, 'post', '/deny/:vendorId', {
    supabase: sbDeny, params: { vendorId: V_FULL }, body: { reason: 'photos too similar' },
  });
  ok('deny answers 200', rDeny.status === 200, `status ${rDeny.status}`);
  const denyAudit = sbDeny.__writes.find(w => w.table === 'admin_activity_log' &&
    w.payload && w.payload.action === 'discover_deny');
  ok('the deny is audited', !!denyAudit);
  ok('the audit row PRESERVES the pitch the decision overwrote',
     !!(denyAudit && denyAudit.payload.metadata &&
        denyAudit.payload.metadata.vendor_pitch_overwritten === 'I shoot Delhi weddings.'),
     denyAudit && JSON.stringify(denyAudit.payload.metadata));
  ok('the deny writes the admin\'s reason onto the request row',
     sbDeny.__writes.some(w => w.table === 'vendor_discover_requests' &&
       w.payload.reason === 'photos too similar' && w.payload.state === 'denied'));
}

// ═════════════════════════════════════════════════════════════════════════════
section('§6  THE AUDIT WRAPPER, AND THE STATUS FIELDS THAT NOW HAVE CELLS');
// ═════════════════════════════════════════════════════════════════════════════
{
  const audit = fresh(F_AUDIT);
  ok('the audit wrapper loads', !!(audit && typeof audit.writeAudit === 'function'));

  // ZERO DDL — R-P3.2's whole point. Read the ladder off disk, never a sentence.
  const migs = fs.readdirSync(path.join(ROOT, 'db/migrations')).filter(f => /^\d{4}_.*\.sql$/.test(f)).sort();
  const tip  = migs[migs.length - 1];
  ok('the migration ladder is UNMOVED at 0112 — this sitting ships zero DDL',
     tip === '0112_couple_route_and_flag.sql', tip);
  ok('0113 is still unwritten', !migs.some(f => f.startsWith('0113')));

  // The wrapper writes the pre-existing table, not a new one.
  ok('the wrapper targets admin_activity_log, the LIVE table', /from\('admin_activity_log'\)/.test(code(F_AUDIT)));
  ok('the wrapper does NOT reference admin_audit (0113\'s reserved twin)',
     !/from\('admin_audit'\)/.test(code(F_AUDIT)));
  ok('the actor literal is preserved byte-for-byte from the retired logAction',
     /admin@thedreamwedding\.in/.test(read(F_AUDIT)));
  ok('discover.js no longer declares its own logAction',
     !/async function logAction/.test(code(F_DISC)));

  // FAIL-SAFE: a log failure must not block the mutation.
  const sbBad = makeSupabase(baseFixtures(), { fail_on: ['admin_activity_log'] });
  const rBad  = await call(F_DISC, 'post', '/grant/:vendorId', { supabase: sbBad, params: { vendorId: V_FULL } });
  ok('a grant SUCCEEDS even when the audit write fails — fail-safe, as ruled', rBad.status === 200, `status ${rBad.status}`);
  ok('the mutation still landed', sbBad.__writes.some(w => w.table === 'vendors' && w.payload.discover_eligible === true));

  // Secrets never reach the log.
  const dirty = audit ? audit.sanitize({ pin_hash: 'x', otp: '123456', nested: { authToken: 'y' }, city: 'Delhi' }) : {};
  ok('secret-shaped keys are redacted at every depth',
     dirty.pin_hash === '[redacted]' && dirty.otp === '[redacted]' &&
     dirty.nested && dirty.nested.authToken === '[redacted]');
  ok('non-secret values survive intact', dirty.city === 'Delhi');

  // A non-uuid target must not silently vanish — the column is uuid, not text.
  const sbU = makeSupabase(baseFixtures());
  const res = audit ? await audit.writeAudit(sbU, 'probe', 'vendor', 'not-a-uuid', {}) : { written: false };
  ok('a non-uuid target still writes a row (the event is not lost)', res.written === true);
  const probe = sbU.__writes.find(w => w.table === 'admin_activity_log');
  ok('…with target_id null and the id preserved in metadata',
     !!(probe && probe.payload.target_id === null &&
        probe.payload.metadata.non_uuid_target_id === 'not-a-uuid'));

  // ── F-10.42's CELL · A STATUS FIELD SHIPS WITH A CELL OR IT IS PROSE ────────
  const tmpl = require(F_TMPL);
  const AUTH_FIVE = ['couple_login_otp', 'couple_reset_otp', 'circle_join_otp',
                     'vendor_login_otp', 'vendor_reset_otp'];
  for (const k of AUTH_FIVE) {
    const t = tmpl.getTemplate(k);
    ok(`${k} is AUTHENTICATION and its status matches the Meta-witnessed reality`,
       !!(t && t.category === 'AUTHENTICATION' && t.status === 'approved'),
       t && `${t.category}/${t.status}`);
  }
  // The call-graph fact the finding turned on, asserted rather than narrated:
  // buildAuthTemplatePayload must not read `status`, or the flip changes behaviour.
  const tmplSrc = read(F_TMPL);
  const authFn = tmplSrc.slice(tmplSrc.indexOf('function buildAuthTemplatePayload'));
  ok('buildAuthTemplatePayload still reads NO status — the flip is truth-only, zero behaviour',
     !/\.status/.test(authFn.slice(0, authFn.indexOf('\n}'))));

  // The welcome ships DARK and the gate is the mechanism.
  const w = tmpl.getTemplate('vendor_welcome');
  ok('vendor_welcome is in the registry', !!w);
  ok('vendor_welcome is UTILITY on the vendor line', !!(w && w.category === 'UTILITY' && w.line === 'vendor'));
  ok('vendor_welcome carries exactly ONE variable', !!(w && w.variables.length === 1), w && String(w.variables));
  // ── THE DARK LANE WENT LIVE. These two cells INVERT on Meta's word ─────────
  // THEY READ, until 2026-08-06:
  //     ok('vendor_welcome ships at status draft — wired and dark', w.status === 'draft');
  //     ok('isApproved refuses it, so sendWa cannot dispatch it', isApproved(...) === false);
  // They were correct while the template was In review and they are wrong now.
  // Recorded verbatim rather than silently replaced: the wired-and-dark state was
  // real, it was proven on production (three refusals in admin_activity_log,
  // reason `template_not_approved`, founder-walked), and a bench that erases the
  // state it used to guard leaves no evidence the gate ever worked.
  ok('vendor_welcome is APPROVED — Meta returned Active on 2026-08-06',
     !!(w && w.status === 'approved'), w && w.status);
  ok('isApproved passes it, so sendWa can now dispatch it',
     tmpl.isApproved('vendor_welcome') === true);
  // The gate is still the ONLY thing that decides. If this ever fails while the
  // status reads approved, the mechanism has drifted from the field.
  ok('the gate agrees with the field — one authority, not two',
     tmpl.isApproved('vendor_welcome') === (w && w.status === 'approved'));
  // A payload Meta can actually accept: the filed name, the filed language, and
  // exactly one body parameter.
  {
    const payload = tmpl.buildTemplatePayload('vendor_welcome', ['Swati']);
    ok('the built payload names the filed template', payload.name === 'tdw_vendor_welcome');
    ok('…in the filed language', payload.language && payload.language.code === 'en');
    ok('…with exactly one body parameter',
       payload.components[0].type === 'body' && payload.components[0].parameters.length === 1);
  }
  ok('the welcome route does NOT re-implement the gate around the send',
     !/if \(!?isApproved\('vendor_welcome'\)\)[\s\S]{0,120}return/.test(code(F_MINT)));
  // ── THE BODY MATCHES WHAT THE FOUNDER FILED (hotfix 1) ─────────────────────
  // The registry's body is documentation of the Meta filing. A cell, not a
  // paragraph — the same law CITATION-NEEDS-A-CELL minted for token donors.
  ok('vendor_welcome carries the FILED body, not the rejected draft',
     !!(w && w.body === 'Hi {{1}}, your Dream Wedding vendor account has been created. ' +
                        'Reply here to complete your account setup.'), w && w.body);
  ok('the benefit clause Meta refused as Utility is GONE',
     !!(w && !/couples can find you/.test(w.body)));
  ok('the welcome body is single-line and no variable begins or ends it',
     !!(w && !/\n/.test(w.body) && !/^\{\{/.test(w.body) && !/\}\}$/.test(w.body.trim())));
}

// ═════════════════════════════════════════════════════════════════════════════
section('§8  F-10.59 — ONE WRITER FOR THE COLUMN PAIR');
// ═════════════════════════════════════════════════════════════════════════════
{
  const V = require(F_VDISC);
  const HAS_WRITER = typeof V.setDiscoverState === 'function';
  ok('setDiscoverState is exported from the one home', HAS_WRITER);
  ok('the state set is frozen', Array.isArray(V.DISCOVER_STATES) && Object.isFrozen(V.DISCOVER_STATES));
  // ── F-10.61 · THE SET IS THE MIGRATION'S, ASSERTED AGAINST THE MIGRATION ───
  // `'hidden'` was briefly in this array and 500'd on the founder's thumb:
  // `vendors.discover_request_state` has carried a CHECK constraint since 0039
  // and does not know that word. The cell that would have caught it did not
  // exist, so it exists now — and it reads the CONSTRAINT ITSELF rather than a
  // copy of its values, which is the only version that cannot drift.
  const mig = fs.readFileSync(path.join(ROOT, 'db/migrations/0039_vendor_discover.sql'), 'utf8');
  const chk = mig.match(/check \(discover_request_state in\s*\n?\s*\(([^)]*)\)\)/);
  const allowed = chk ? chk[1].split(',').map(x => x.trim().replace(/'/g, '')) : [];
  ok('0039\'s CHECK constraint is readable — the cell has a real witness',
     allowed.length === 6, allowed.join(','));
  ok('EVERY state the code can write is permitted by the database',
     (V.DISCOVER_STATES || []).every(st => allowed.includes(st)),
     (V.DISCOVER_STATES || []).filter(st => !allowed.includes(st)).join(',') || 'none');
  ok('…and the two sets are the SAME SIZE — a value the DB allows and the code ' +
     'never writes is a gap, not a safety margin',
     (V.DISCOVER_STATES || []).length === allowed.length,
     `code ${(V.DISCOVER_STATES || []).length} vs db ${allowed.length}`);
  ok("'paused' is absent — that word is the vendor's own column, not a state",
     !(V.DISCOVER_STATES || []).includes('paused'));

  // ── DEFENSIVE, per the P2 precedent ────────────────────────────────────────
  // At an UNCURED tree `setDiscoverState` does not exist, and the first run of
  // this section THREW — a stack trace where the both-ways measurement should
  // have been a NUMBER. "The cure's size must be a number" is the whole point of
  // running a bench at both trees, and a section that dies takes every cell after
  // it with it. Every call below goes through this shim: absent writer ⇒ one red
  // per cell, never an exception.
  const writeVia = async (sb, id, args) => {
    if (!HAS_WRITER) return { threw: 'setDiscoverState is absent at this tree', result: null };
    try { return { threw: null, result: await V.setDiscoverState(sb, id, args) }; }
    catch (e) { return { threw: e.message, result: null }; }
  };

  // ── THE CENSUS IS THE WRITER'S PROOF, AND IT TOOK TWO ATTEMPTS ────────────
  // Seven doors used to write this pair and only three wrote both. This walks
  // src/api/ and the pair's home and asserts the columns are written NOWHERE
  // ELSE — derived by filesystem walk, never by a list, because a hand-listed
  // census is exactly what let F-10.34's cure miss two sites.
  //
  // THE FIRST DRAFT FOUND ZERO WRITERS AND SAID SO. It matched
  // `.update({ … discover_eligible …})` as an inline object literal — and
  // `setDiscoverState` builds its payload in a VARIABLE, so the regex missed the
  // one legitimate writer along with everything else. It surfaced as a red only
  // because the cell asserts `=== 1` rather than `=== 0`: a census whose failure
  // mode is an empty result is not a census (protocol §9, independent-method).
  //
  // THE SECOND DRAFT FOUND ZERO TOO, and for a different reason worth recording:
  // brace-matching the argument of `.update(` yields the literal text `patch` —
  // `setDiscoverState` builds its payload in a VARIABLE. A census that only reads
  // inline literals cannot see the one writer it exists to bless.
  //
  // NOW: the argument is brace-matched, and when it is a bare identifier the
  // census resolves ONE level of indirection to that identifier's assignment in
  // the same file. Two misses, both surfaced by the `=== 1` assertion rather than
  // by an empty pass — which is the whole argument for asserting a POSITIVE count
  // in a census instead of an absence.
  function updateArgs(src) {
    const out = [];
    let i = 0;
    for (;;) {
      const at = src.indexOf('.update(', i);
      if (at === -1) break;
      let d = 0, j = at + '.update('.length, start = j;
      for (; j < src.length; j++) {
        const c = src[j];
        if (c === '(' || c === '{' || c === '[') d++;
        else if (c === ')' || c === '}' || c === ']') { if (d === 0) break; d--; }
      }
      out.push(src.slice(start, j));
      i = j + 1;
    }
    return out;
  }
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p2 = path.join(d, e.name);
      if (e.isDirectory()) walk(p2); else if (p2.endsWith('.js')) files.push(p2);
    }
  })(path.join(ROOT, 'src/api'));
  files.push(F_VDISC);

  const writers = [];
  for (const f of files) {
    const src = code(f);
    // `demo_vendors` carries a column of the same name on a DIFFERENT table with
    // its own sole writer (demoLifecycle). Scoped out by name so the cell measures
    // this pair, not every column that shares a word.
    if (path.relative(ROOT, f) === 'src/api/admin/demoAdmin.js') continue;
    const named = (a) => {
      if (/discover_eligible|discover_request_state/.test(a)) return true;
      const id = a.trim().match(/^([A-Za-z_$][\w$]*)$/);
      if (!id) return false;
      const assign = src.match(new RegExp(`(?:const|let|var)\\s+${id[1]}\\s*=\\s*\\{[^;]*`));
      return !!assign && /discover_eligible|discover_request_state/.test(assign[0]);
    };
    if (updateArgs(src).some(named)) {
      writers.push(path.relative(ROOT, f));
    }
  }
  ok('exactly ONE file writes the discover pair', writers.length === 1, writers.join(', ') || 'ZERO — the census found nothing, which is a broken census');
  ok('…and that file is src/lib/vendor/discover.js, the pair\'s one home',
     writers[0] === 'src/lib/vendor/discover.js', String(writers[0]));

  // Every door that used to write directly must now CALL the writer.
  for (const [f, label] of [
    ['src/api/admin/discover.js', 'the deck\'s grant/deny/revoke'],
    ['src/api/admin/vendors.js',  'the Makers toggle and Revoke Access'],
  ]) {
    ok(`${label} routes through setDiscoverState`,
       /setDiscoverState\(/.test(code(path.join(ROOT, f))), f);
  }
  ok('requestDiscover routes through it too', /setDiscoverState\(supabase, vendorId, \{\s*\n?\s*eligible: cur/.test(code(F_VDISC)));
  ok('withdrawRequest routes through it too',
     /setDiscoverState\(supabase, vendorId, \{ eligible: false, state: 'not_requested' \}\)/.test(code(F_VDISC)));

  // ── THE REFUSALS. Half a pair, and the founder's exact specimen. ───────────
  const sb = () => makeSupabase(baseFixtures());
  const r1 = await writeVia(sb(), V_FULL, { state: 'approved' });
  ok('omitting `eligible` THROWS — half the pair is how F-10.59 happened',
     !!r1.threw && /explicit boolean/.test(r1.threw), String(r1.threw));

  const r2 = await writeVia(sb(), V_FULL, { eligible: true, state: 'martian' });
  ok('an unknown state THROWS', !!r2.threw && /unknown state/.test(r2.threw), String(r2.threw));

  const r3 = await writeVia(sb(), V_FULL, { eligible: false, state: 'approved' });
  ok('THE FOUNDER\'S SPECIMEN IS UNAUTHORABLE: approved + not eligible THROWS',
     !!r3.threw && /F-10\.59/.test(r3.threw), String(r3.threw));

  // ONE-DIRECTIONAL, deliberately: a live vendor re-applying is live AND under
  // review. A biconditional would have dropped her off the feed on re-apply.
  {
    const r = await writeVia(sb(), V_FULL, { eligible: true, state: 'requested' });
    ok('eligible + requested is LEGAL — a live vendor may re-apply without going dark',
       !r.threw && !!r.result && r.result.ok === true, String(r.threw));
  }

  // The pair always lands together, and `extra` cannot smuggle it.
  {
    const sbW = sb();
    await writeVia(sbW, V_FULL, { eligible: false, state: 'revoked', extra: { status: 'paused' } });
    const w = sbW.__writes.find(x => x.table === 'vendors');
    ok('both columns travel in ONE update', !!w &&
       w.payload.discover_eligible === false && w.payload.discover_request_state === 'revoked');
    ok('…alongside the caller\'s own column', !!w && w.payload.status === 'paused');
  }
  const r4 = await writeVia(sb(), V_FULL, { eligible: true, state: 'approved', extra: { discover_eligible: false } });
  ok('`extra` may not smuggle the pair', !!r4.threw && /may not travel/.test(r4.threw), String(r4.threw));

  // ── THE DOORS, DRIVEN. The founder pressed these two. ──────────────────────
  {
    const sbT = makeSupabase(baseFixtures());
    const r = await call(F_VENDORS, 'patch', '/:vendorId/discover-eligible', {
      supabase: sbT, params: { vendorId: V_FULL },
    });
    void r;
    const w = sbT.__writes.find(x => x.table === 'vendors');
    ok('the Makers toggle now writes BOTH columns (specimen 1)',
       !!w && w.payload.discover_eligible === true && w.payload.discover_request_state === 'approved',
       JSON.stringify(w && w.payload));
  }
  {
    // ── F-10.60 · THE SECOND SPECIMEN'S DOOR IS GONE, NOT CURED ───────────────
    // Rider 4 routed `PATCH /vendors/:id/revoke` through the one writer. The
    // founder then asked what it actually did, the derivation said "removes her
    // from Discover and stops her morning briefing", and he ruled it deleted:
    // 「 why suspend any vendor. i can delete the vendor 」. The cell inverts —
    // the door must not exist, and nothing may write `status: 'paused'` again.
    const vRouter = fresh(F_VENDORS);
    const revokeLayer = vRouter && vRouter.stack.find(l => l.route && l.route.path === '/:vendorId/revoke');
    ok('the Revoke Access route is DELETED, not merely unlinked', !revokeLayer);
    ok('nothing in src/api writes vendors.status any more',
       !/status:\s*'paused'/.test(code(F_VENDORS)));
  }
  {
    // BEHAVIOUR CHANGE, asserted rather than described: deny now takes a live
    // vendor off the feed instead of leaving the mirror lie.
    const sbD = makeSupabase(baseFixtures());
    await call(F_DISC, 'post', '/deny/:vendorId', {
      supabase: sbD, params: { vendorId: V_FULL }, body: { reason: 'Watermarks' } });
    const w = sbD.__writes.find(x => x.table === 'vendors');
    ok('deny now clears eligibility — a refusal that leaves her visible is not a refusal',
       !!w && w.payload.discover_eligible === false && w.payload.discover_request_state === 'denied',
       JSON.stringify(w && w.payload));
  }

  // ── THE SCREEN'S FACT ──────────────────────────────────────────────────────
  ok('getDiscoverStatus surfaces live_now by name, not for the client to recompute',
     /live_now:\s+\(vendor\?\.discover_eligible === true\) && \(vendor\?\.discover_paused !== true\)/.test(code(F_VDISC)));
}

// ═════════════════════════════════════════════════════════════════════════════
section('§7  MUTATION — every cure cell proven able to REDDEN');
// ═════════════════════════════════════════════════════════════════════════════
// Production code is edited on disk, the module re-required, the cell re-run, and
// the file restored. The restoration is itself asserted byte-identically.
{
  const originals = new Map();
  // THE CACHE BUST IS LOAD-BEARING, and M7 is why it exists. The first draft
  // edited src/lib/admin/auditLog.js and then re-required src/api/admin/discover.js
  // — which resolves its dependency from require.cache, so the MUTATED file was
  // never loaded and the mutation "applied" without changing anything. A mutation
  // that cannot reach the running code is a green wearing a red's clothes.
  function bust() {
    for (const k of Object.keys(require.cache)) {
      if (k.includes(`${path.sep}src${path.sep}`)) delete require.cache[k];
    }
  }
  function mutate(file, from, to) {
    const src = read(file);
    if (!originals.has(file)) originals.set(file, src);
    if (!src.includes(from)) return false;
    fs.writeFileSync(file, src.replace(from, to));
    bust();
    return true;
  }
  function restoreAll() {
    for (const [file, src] of originals) fs.writeFileSync(file, src);
    bust();
  }

  // M1 — remove the floor check on grant; §4's refusal cell must go green-to-red.
  {
    const applied = mutate(F_DISC,
      'if (summary.total < MIN_PORTFOLIO_IMAGES) {',
      'if (false) {');
    const sb = makeSupabase(baseFixtures());
    const r  = await call(F_DISC, 'post', '/grant/:vendorId', { supabase: sb, params: { vendorId: V_THIN } });
    ok('M1 removing the floor check ⇒ a below-floor grant SUCCEEDS (the cell can redden)',
       applied && r.status === 200, `applied=${applied} status=${r.status}`);
    restoreAll();
  }

  // M2 — make the mint report created unconditionally; §3's collision cell reddens.
  {
    const applied = mutate(F_VENDORS,
      "const outcome = existingVendor ? 'existing' : 'created';",
      "const outcome = 'created';");
    const sb = makeSupabase(baseFixtures());
    const r  = await call(F_VENDORS, 'post', '/create', { supabase: sb, body: { phone: '+919888294440' } });
    ok('M2 hard-coding the outcome ⇒ a collision reports "created" again (F-10.47 reproduced)',
       applied && r.body && r.body.outcome === 'created', `applied=${applied}`);
    restoreAll();
  }

  // M3 — restore the name clobber; §3's users-write cell reddens.
  {
    const applied = mutate(F_VENDORS,
      "  if (!existingVendor) {\n    const { error: rpcError } = await supabase.rpc('invite_vendor', {",
      "  if (true) {\n    const { error: rpcError } = await supabase.rpc('invite_vendor', {");
    const sb = makeSupabase(baseFixtures());
    await call(F_VENDORS, 'post', '/create', { supabase: sb, body: { phone: '+919888294440', business_name: 'Renamed' } });
    ok('M3 calling the RPC on a collision ⇒ invite_vendor runs again (the clobber path returns)',
       applied && sb.__rpcs.some(x => x.name === 'invite_vendor'), `applied=${applied}`);
    restoreAll();
  }

  // M4 — drop discover_request_state from the queue payload; §5's cell reddens.
  {
    const applied = mutate(F_DISC, '      discover_request_state: r.state,', '');
    const sb = makeSupabase(baseFixtures());
    const r  = await call(F_DISC, 'get', '/requests', { supabase: sb });
    const rows = (r.body && r.body.requests) || [];
    ok('M4 dropping discover_request_state ⇒ the rows lose the key the screen buckets on',
       applied && rows.length > 0 && rows.every(x => x.discover_request_state === undefined),
       `applied=${applied}`);
    restoreAll();
  }

  // M5 — collapse the two photo counts; Fork 5's cell reddens.
  {
    const applied = mutate(F_DISC,
      '      photos_total:    summary.total,',
      '      photos_total:    summary.approved,');
    const sb = makeSupabase(baseFixtures());
    const r  = await call(F_DISC, 'get', '/requests', { supabase: sb });
    const full = ((r.body && r.body.requests) || []).find(x => x.vendor_id === V_FULL) || {};
    ok('M5 collapsing total onto approved ⇒ the two labelled counts stop differing',
       applied && full.photos_total === full.photos_approved, `applied=${applied}`);
    restoreAll();
  }

  // M6 — return the raw reason regardless of state; F-10.44's split reddens.
  {
    const applied = mutate(F_DISC,
      "      decision_reason: r.state === 'denied' || r.state === 'revoked' ? (r.reason || null) : null,",
      "      decision_reason: r.reason || null,");
    const sb = makeSupabase(baseFixtures());
    const r  = await call(F_DISC, 'get', '/requests', { supabase: sb });
    const full = ((r.body && r.body.requests) || []).find(x => x.vendor_id === V_FULL) || {};
    ok('M6 un-splitting the column ⇒ an OPEN request hands back the pitch as a decision reason',
       applied && full.decision_reason === 'I shoot Delhi weddings.', `applied=${applied}`);
    restoreAll();
  }

  // M7 — make the audit throw-through; §6's fail-safe cell reddens.
  // RE-AIMED, and the first aim is recorded because finding it out was worth more
  // than the green: the original mutation replaced the `if (error)` BRANCH BODY
  // with a throw — which is INSIDE the try, so the wrapper's own catch swallowed
  // it and the route stayed fail-safe. A mutation aimed at a clause another clause
  // already covers proves nothing. It is now aimed at the CATCH, the only thing
  // standing between a failed log and a failed mutation.
  {
    const applied = mutate(F_AUDIT,
      "  } catch (e) {\n    console.error(`[auditLog] '${action}' NOT recorded (threw): ${e.message} — the mutation stands.`);\n    return { written: false, reason: e.message };\n  }",
      "  } catch (e) {\n    throw e;\n  }") && mutate(F_AUDIT,
      "      console.error(`[auditLog] '${action}' NOT recorded: ${error.message} — the mutation stands.`);\n      return { written: false, reason: error.message };",
      "      throw new Error(error.message);");
    const sb = makeSupabase(baseFixtures(), { fail_on: ['admin_activity_log'] });
    let threw = false;
    try {
      const r = await call(F_DISC, 'post', '/grant/:vendorId', { supabase: sb, params: { vendorId: V_FULL } });
      if (r.status !== 200) threw = true;
    } catch (_e) { threw = true; }
    ok('M7 making the audit throw ⇒ the mutation stops being fail-safe', applied && threw, `applied=${applied}`);
    restoreAll();
  }

  // M8 — a second mint implementation appears; §1's one-path cell reddens.
  {
    const applied = mutate(F_MINT,
      "router.post('/vendor', requireAdmin, asyncHandler(mintVendor));",
      "router.post('/vendor', requireAdmin, asyncHandler(async (req, res) => {\n  await req.app.locals.supabase.rpc('invite_vendor', { p_phone: req.body.phone, p_name: 'x' });\n  return okRes(res, { created: true });\n}));");
    const src = read(F_MINT);
    const apiFiles = [];
    (function walk(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p); else if (p.endsWith('.js')) apiFiles.push(p);
      }
    })(path.join(ROOT, 'src/api'));
    const callers = apiFiles.filter(f => /rpc\('invite_vendor'/.test(read(f)));
    ok('M8 a second invite_vendor caller under src/api/ ⇒ the one-path cell reddens',
       applied && callers.length === 2 && /rpc\('invite_vendor'/.test(src), `applied=${applied} callers=${callers.length}`);
    restoreAll();
  }

  // M9 — the welcome route pre-checks the gate; §6's no-second-gate cell reddens.
  {
    const applied = mutate(F_MINT,
      '  try {\n    await sendWa({',
      "  if (!isApproved('vendor_welcome')) {\n    return okRes(res, { sent: false, reason: 'template_not_approved' });\n  }\n  try {\n    await sendWa({");
    ok('M9 a pre-check around the send ⇒ the second-gate cell reddens',
       applied && /if \(!isApproved\('vendor_welcome'\)\)[\s\S]{0,120}return/.test(read(F_MINT)),
       `applied=${applied}`);
    restoreAll();
  }

  // M10 — the couple route grows its own users upsert; §1's cell reddens.
  {
    const applied = mutate(F_COUPLES,
      '  let ids;',
      "  await supabase.from('users').upsert({ phone: cleanPhone, name: cleanName }, { onConflict: 'phone' });\n  let ids;");
    ok('M10 restoring the couple name-clobber ⇒ the no-upsert cell reddens',
       applied && /upsert\(\{ phone/.test(read(F_COUPLES)), `applied=${applied}`);
    restoreAll();
  }

  // M12 — swallow the probe error again; the fail-loud cells must redden.
  {
    const applied = mutate(F_VENDORS,
      "    if (vErr) return errRes(res, 500, `Could not read the existing account: ${vErr.message}`);\n",
      "");
    const sb = makeSupabase(baseFixtures(), { fail_on: ['vendors'] });
    const r  = await call(F_VENDORS, 'post', '/create', { supabase: sb, body: { phone: '+919888294440' } });
    ok('M12 swallowing the probe error ⇒ a failed read is mislabelled "created" again',
       applied && r.body && r.body.outcome === 'created', `applied=${applied} status=${r.status}`);
    restoreAll();
  }

  // M11 — strip the normalisation; F-10.50's cells must redden.
  {
    const applied = mutate(F_VENDORS,
      'const cleanPhone = toE164(String(phone).trim());',
      'const cleanPhone = String(phone).trim();');
    const sb = makeSupabase(baseFixtures());
    const r  = await call(F_VENDORS, 'post', '/create', { supabase: sb, body: { phone: '9888294440' } });
    ok('M11 removing toE164 ⇒ a bare-digit mint reads a stored +91 number as VIRGIN again',
       applied && r.body && r.body.outcome === 'created', `applied=${applied}`);
    restoreAll();
  }

  // M13 — restore the eligibility-only toggle; F-10.59's specimen returns.
  // ANCHORED ON ONE SHORT LINE, not on a reconstructed multi-line block. The
  // first anchor quoted the whole `setDiscoverState({...})` call and stopped
  // matching the moment F-10.60 changed one word inside it — `applied=false`,
  // a mutation that silently stopped mutating. A mutation whose anchor is
  // brittle is a green that will quietly become vacuous.
  {
    const applied = mutate(F_VENDORS,
      "    state:    newVal ? 'approved' : 'revoked',",
      "    state:    newVal ? 'approved' : 'approved',   // MUTATED");
    const sb = makeSupabase(baseFixtures());
    await call(F_VENDORS, 'patch', '/:vendorId/discover-eligible', { supabase: sb, params: { vendorId: V_THIN } });
    const w = sb.__writes.find(x => x.table === 'vendors');
    ok('M13 forcing the state to `approved` on both arms ⇒ hiding stops being recorded',
       applied && !!w && w.payload.discover_request_state === 'approved' &&
       w.payload.discover_eligible === true, `applied=${applied} ${JSON.stringify(w && w.payload)}`);
    restoreAll();
  }

  // M14 — drop the coherence guard; the unauthorable pair becomes authorable.
  {
    const applied = mutate(F_VDISC,
      "  if (state === 'approved' && eligible !== true) {", "  if (false) {");
    delete require.cache[require.resolve(F_VDISC)];
    const V2 = require(F_VDISC);
    let ok2 = false;
    try {
      if (typeof V2.setDiscoverState !== 'function') throw new Error('absent');
      await V2.setDiscoverState(makeSupabase(baseFixtures()), V_FULL, { eligible: false, state: 'approved' });
      ok2 = true;
    } catch { ok2 = false; }
    ok('M14 dropping the coherence guard ⇒ approved-and-invisible can be written again',
       applied && ok2, `applied=${applied}`);
    restoreAll();
  }

  // M15 — put a DB-forbidden state back in the set; F-10.61's cell reddens.
  {
    const applied = mutate(F_VDISC,
      "  'not_requested', 'requested', 'under_review', 'approved', 'denied', 'revoked',",
      "  'not_requested', 'requested', 'under_review', 'approved', 'denied', 'revoked', 'hidden',");
    delete require.cache[require.resolve(F_VDISC)];
    const V3 = require(F_VDISC);
    const mig3 = fs.readFileSync(path.join(ROOT, 'db/migrations/0039_vendor_discover.sql'), 'utf8');
    const c3 = mig3.match(/check \(discover_request_state in\s*\n?\s*\(([^)]*)\)\)/);
    const a3 = c3 ? c3[1].split(',').map(x => x.trim().replace(/'/g, '')) : [];
    ok('M15 adding a state 0039 forbids ⇒ the constraint cell reddens (the 500 the founder hit)',
       applied && !(V3.DISCOVER_STATES || []).every(st => a3.includes(st)), `applied=${applied}`);
    restoreAll();
  }

  // THE RESTORATION IS ITSELF ASSERTED.
  let allRestored = true;
  const detail = [];
  for (const [file, src] of originals) {
    if (read(file) !== src) { allRestored = false; detail.push(path.relative(ROOT, file)); }
  }
  ok('every mutated file restored BYTE-IDENTICAL', allRestored, detail.join(', '));
}

console.log(`\n────────────────────────────────────────────────────────────`);
console.log(`b10_p3_mint_deck_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
process.exit(fail === 0 ? 0 : 1);

})().catch(e => { console.error('BENCH THREW:', e); process.exit(1); });
