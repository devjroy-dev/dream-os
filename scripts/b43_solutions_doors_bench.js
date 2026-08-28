#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b43_solutions_doors_bench.js
// TDW_19 P0-B · THE DOORS (R-19.4) — kickoff §4-2. Bench number ruled by CE-38
// relay #1 item 2: b39 was taken (twice, in fact — b39_telemetry_bench.js and
// b39_worklist_today_bench.js), b40/b41/b42 are reserved to P1/P2/P3 by spec
// §4-§6, so the block's run is b40-b43 with b44 for P4-P6 when chartered.
//
// ── THE BAR, AND HOW IT DIFFERS FROM b38's ─────────────────────────────────
// b38 seated a STUB at `require.cache` for `resolveVendor`, because the thing
// under test was the enquiry door's body and ownership was scenery. The kickoff
// asks for something stricter here: **over real HTTP THROUGH `resolveVendor`.**
//
// So the real middleware runs, against a RECORDING in-memory supabase fake that
// answers the exact query chain `resolveUsersId` + `resolveVendor` make:
//
//   users:   .select('id').eq('auth_user_id', <jwt sub>).maybeSingle()
//            .select('id').eq('id',           <jwt sub>).maybeSingle()   [legacy]
//   vendors: .select('*').eq('user_id', <users.id>).maybeSingle()
//
// That matters because §3 asserts the 403 path. A STUBBED resolveVendor cannot
// produce a 403 — it would have to be told to, which proves nothing. The real
// one produces it by failing to find a vendor row, which is the actual property
// the estate needs: **these doors are behind ownership resolution, not merely
// adjacent to it.** A cell that fakes the guard it is testing has tested the fake.
//
// `requireAuth` IS stubbed, and the distinction is deliberate rather than
// convenient: it verifies a Supabase JWT signature against a live auth service.
// That is a property of Supabase, not of this block, and it is already asserted
// by every other door bench in the estate. It is stubbed to attach `req.auth`
// and nothing else, which is exactly the contract resolveVendor consumes.
//
// ── NO DATABASE, NO CREDENTIAL, NO NETWORK ─────────────────────────────────
// The two env values below are PLACEHOLDER LITERALS, never a read of a real
// environment (secrets law). Every table the fake serves is one this bench
// declares; **the fake THROWS on any table it was not told about**, so a door
// that started reading `vendor_integrations` — a table that does not exist —
// would redden here rather than in production. That is the point of a recording
// fake over a permissive one.
//
// ── IT RUNS ON A DIRTY TREE ────────────────────────────────────────────────
// It reads no floor and mutates nothing at rest, so the founder can satisfy the
// verify line at his apply moment, before commit (the F-05.89 seat's lesson,
// and see F-19.16 for what happens to benches that do otherwise).
//
// Run: node scripts/b43_solutions_doors_bench.js
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

process.env.SUPABASE_URL = 'http://127.0.0.1:1/bench-placeholder-not-a-credential';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'bench-placeholder-not-a-credential';

// THE GATES MUST START CLOSED AND BE SEATED BEFORE env.js LOADS. §6 asserts the
// `coming` state, which is only reachable with the P1/P2 keys absent. A machine
// that happened to carry a real GOOGLE_OAUTH_CLIENT_ID would otherwise flip the
// index to `not_connected` and the cell would fail for a reason having nothing
// to do with the tree.
for (const k of ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET', 'INTEGRATION_TOKEN_KEY',
                 'GBP_QUOTA_APPROVED', 'RESELLERCLUB_USER_ID', 'RESELLERCLUB_API_KEY',
                 'VERCEL_TOKEN', 'VERCEL_PROJECT_ID', 'VERCEL_TEAM_ID', 'STOREFRONT_ROOT_DOMAIN']) {
  delete process.env[k];
}

const path    = require('path');
const http    = require('http');
const express = require('express');

const ROOT = path.join(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);

let pass = 0, fail = 0;
const ok  = (n, why) => { console.log('PASS  ' + n + (why ? '  — ' + why : '')); pass++; };
const no  = (n, why) => { console.log('FAIL  ' + n + '  — ' + why); fail++; };
const chk = (cond, n, why) => (cond ? ok(n, why) : no(n, why));

// ── requireAuth, STUBBED AT THE REGISTRY BEFORE THE ROUTER LOADS ───────────
// The door `require`s it at module load, so the stub must win the reference or
// the real one does. It attaches exactly what resolveVendor consumes.
const requireAuthPath = require.resolve(P('src/api/middleware/requireAuth.js'));
let AUTH_SUB = 'auth-sub-vendor';
require.cache[requireAuthPath] = {
  id: requireAuthPath, filename: requireAuthPath, loaded: true,
  exports: (req, _res, next) => { req.auth = { user_id: AUTH_SUB, phone: '+919888294440' }; next(); },
};

// ── THE RECORDING FAKE ─────────────────────────────────────────────────────
// Standing test vendor: 9888294440 (the estate's, from 2026-07-29).
// `routing_handle` is UPPERCASE here because that is how it is minted
// (src/agent/onboarding.js:174-192) — §5 asserts the door lowercases it.
const VENDOR_ROW = Object.freeze({
  id: 'b1f0c2d3-4a5b-4c6d-8e9f-0a1b2c3d4e5f',
  user_id: 'users-id-1',
  business_name: 'Bench Studio',
  city: 'Mumbai',
  routing_handle: 'DEV550',
  tier: 'basic',
});

const READS = [];
let VENDOR_PRESENT = true;   // §3 flips this to prove the 403 is real
let USER_PRESENT   = true;

function fake() {
  return {
    from(table) {
      const q = { table, filters: [], _cols: null };
      q.select = (cols) => { q._cols = cols; return q; };
      q.eq     = (c, v) => { q.filters.push([c, v]); return q; };
      q.maybeSingle = async () => {
        READS.push({ table, filters: q.filters.slice() });
        if (table === 'users') {
          if (!USER_PRESENT) return { data: null, error: null };
          const [col, val] = q.filters[0];
          if (col === 'auth_user_id' && val === AUTH_SUB) return { data: { id: 'users-id-1' }, error: null };
          if (col === 'id'           && val === AUTH_SUB) return { data: { id: 'users-id-1' }, error: null };
          return { data: null, error: null };
        }
        if (table === 'vendors') {
          if (!VENDOR_PRESENT) return { data: null, error: null };
          const [col, val] = q.filters[0];
          if (col === 'user_id' && val === 'users-id-1') return { data: { ...VENDOR_ROW }, error: null };
          return { data: null, error: null };
        }
        // THE REFUSAL THAT MAKES THIS A GATE. A door reaching for a table this
        // bench was not told about is a door reaching for a table that may not
        // exist — which is exactly R-19.4's "no table is read that does not
        // exist". Loud here beats a 500 in production.
        throw new Error(`[fake] UNDECLARED TABLE READ: ${table} — no DDL exists for it (R-19.4)`);
      };
      return q;
    },
  };
}

// ── THE SERVER ─────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.locals.supabase = fake();
app.use('/api/v2/vendor', require(P('src/api/vendor/core.js')));

let server, BASE;
const get = (p) => new Promise((resolve, reject) => {
  http.get(BASE + p, (res) => {
    let b = '';
    res.on('data', (d) => (b += d));
    res.on('end', () => {
      let json = null;
      try { json = JSON.parse(b); } catch { /* non-JSON body is itself a finding */ }
      resolve({ status: res.statusCode, body: json, raw: b });
    });
  }).on('error', reject);
});

const B = '/api/v2/vendor/solutions';

(async () => {
  await new Promise((r) => { server = app.listen(0, '127.0.0.1', r); });
  BASE = 'http://127.0.0.1:' + server.address().port;

  const contract = require(P('src/api/vendor/solutions/contract.js'));

  // ═══ §0 · THE MOUNT IS REAL ══════════════════════════════════════════════
  // Asserted through core.js, not by requiring the router directly — the mount
  // line is the thing that can be wrong, and requiring the file would skip it.
  console.log('\n── §0 · the mount, through core.js ──');
  {
    const r = await get(B);
    chk(r.status !== 404, '§0.1 /solutions is mounted in core.js', `HTTP ${r.status}`);
    chk(r.status === 200, '§0.2 the index answers 200', `HTTP ${r.status}`);
  }

  // ═══ §1 · THE MIRROR AGREES AT THIS TIP ══════════════════════════════════
  console.log('\n── §1 · the cross-repo digest ──');
  chk(contract.CONTRACT_DIGEST === contract.computeDigest(),
      '§1.1 backend literal equals backend computed',
      contract.CONTRACT_DIGEST.slice(0, 12) + '… vs ' + contract.computeDigest().slice(0, 12) + '…');

  // ═══ §2 · EVERY GET ANSWERS, AND IN ITS DECLARED SHAPE ═══════════════════
  // The shape is re-asserted HERE against contract.shape() rather than trusted
  // because the door ran it: the door could be sending a body it never checked.
  console.log('\n── §2 · every GET answers in its contract shape ──');
  const CASES = [
    ['/',            'index',      'SolutionsIndex',  false],
    ['/google',      'google',     'GoogleStatus',    false],
    ['/domain',      'domain',     'DomainStatus',    false],
    ['/seo',         'seo',        'SeoReport',       false],
    ['/marketing',   'drafts',     'MarketingDraft',  true ],
    ['/proof',       'docs',       'ProofDoc',        true ],
    ['/benchmarks',  'benchmarks', 'BenchmarksReport',false],
  ];
  const BODIES = {};
  for (const [route, key, shapeName, isList] of CASES) {
    const r = await get(B + route);
    BODIES[route] = r.body;
    if (r.status !== 200) { no(`§2 GET ${route}`, `HTTP ${r.status} ${r.raw.slice(0, 120)}`); continue; }
    if (!r.body || r.body.ok !== true) { no(`§2 GET ${route}`, 'envelope not { ok: true, … }'); continue; }
    const payload = r.body[key];
    if (payload === undefined) { no(`§2 GET ${route}`, `no '${key}' in the envelope`); continue; }
    if (isList) {
      if (!Array.isArray(payload)) { no(`§2 GET ${route}`, `'${key}' is not an array`); continue; }
      const bad = payload.map((it) => contract.shape(shapeName, it)).filter((v) => !v.ok);
      chk(bad.length === 0, `§2 GET ${route} -> ${shapeName}[]`,
          bad.length ? JSON.stringify(bad[0]) : `${payload.length} item(s), all in shape`);
    } else {
      const v = contract.shape(shapeName, payload);
      chk(v.ok, `§2 GET ${route} -> ${shapeName}`, v.ok ? 'exact, no missing, no extra' : JSON.stringify(v));
    }
  }

  // ═══ §3 · THE DOORS ARE BEHIND resolveVendor — THE REAL ONE ══════════════
  // This is the section a stub cannot produce. The middleware is the estate's
  // own; it 403s because the fake stops returning a vendors row, not because
  // the bench told it to.
  console.log('\n── §3 · behind the REAL resolveVendor ──');
  {
    VENDOR_PRESENT = false;
    const r = await get(B + '/google');
    chk(r.status === 403, '§3.1 no vendor row -> 403 from the real middleware',
        `HTTP ${r.status}` + (r.body ? ` "${r.body.error}"` : ''));
    VENDOR_PRESENT = true;

    USER_PRESENT = false;
    const r2 = await get(B + '/domain');
    chk(r2.status === 403, '§3.2 identity maps to no user -> 403', `HTTP ${r2.status}`);
    USER_PRESENT = true;

    const r3 = await get(B + '/google');
    chk(r3.status === 200, '§3.3 restored -> 200 again (the guard is stateful, not sticky)', `HTTP ${r3.status}`);

    const sawVendors = READS.some((x) => x.table === 'vendors' && x.filters.some(([c]) => c === 'user_id'));
    chk(sawVendors, '§3.4 the vendor was resolved BY JWT, not by a URL param',
        `${READS.filter((x) => x.table === 'vendors').length} vendors read(s), filters: ` +
        JSON.stringify([...new Set(READS.filter((x) => x.table === 'vendors').map((x) => x.filters.map(([c]) => c).join('+')))]));
  }

  // ═══ §4 · NO TABLE IS READ THAT DOES NOT EXIST (R-19.4) ══════════════════
  console.log('\n── §4 · no undeclared table is touched ──');
  {
    const tables = [...new Set(READS.map((x) => x.table))].sort();
    chk(tables.every((t) => t === 'users' || t === 'vendors'),
        '§4.1 only users + vendors are read across every door',
        'tables touched: ' + tables.join(', '));
    // Non-vacuity of the fake's own refusal: prove it THROWS rather than
    // silently returning null, or §4.1 would pass on a fake that tolerates
    // anything.
    let threw = false;
    try { await fake().from('vendor_integrations').select('*').eq('x', 1).maybeSingle(); }
    catch { threw = true; }
    chk(threw, '§4.2 the fake refuses an undeclared table (so §4.1 is not vacuous)',
        'vendor_integrations -> throw, not null');
  }

  // ═══ §5 · THE SUBDOMAIN, LOWERCASED, FROM THE WITNESSED COLUMN ═══════════
  console.log('\n── §5 · the subdomain transform, end to end over HTTP ──');
  {
    const d = BODIES['/domain'] && BODIES['/domain'].domain;
    chk(d && d.status === 'none', '§5.1 status is the ruled empty value', d && d.status);
    chk(d && d.subdomain === 'dev550.thedreamwedding.in',
        '§5.2 UPPERCASE routing_handle arrives lowercased on the wire',
        `stored 'DEV550' -> sent ${JSON.stringify(d && d.subdomain)}`);

    // The null-handle case, which is a real vendor mid-onboarding and not an
    // edge case: routing_handle is nullable with no default
    // (docs/db/PUBLIC_SCHEMA.md:1130).
    const saved = VENDOR_ROW.routing_handle;
    const mutable = { ...VENDOR_ROW, routing_handle: null };
    const origFrom = app.locals.supabase.from;
    app.locals.supabase.from = (t) => {
      const q = origFrom(t);
      if (t !== 'vendors') return q;
      const ms = q.maybeSingle;
      q.maybeSingle = async () => { const r = await ms(); return r.data ? { data: mutable, error: null } : r; };
      return q;
    };
    const r = await get(B + '/domain');
    app.locals.supabase.from = origFrom;
    chk(r.status === 200 && r.body.domain.subdomain === null,
        '§5.3 a null handle sends null, never "null.thedreamwedding.in"',
        `HTTP ${r.status}, subdomain=${JSON.stringify(r.body && r.body.domain && r.body.domain.subdomain)}`);
    void saved;
  }

  // ═══ §6 · THE GATES DRIVE THE INDEX, AND NO KEY LEAKS ════════════════════
  console.log('\n── §6 · the env ledger drives the room index ──');
  {
    const idx = BODIES['/'] && BODIES['/'].index;
    const rows = (idx && idx.rows) || [];
    chk(rows.length === 6, '§6.1 six rows', `${rows.length} rows`);
    chk(JSON.stringify(rows.map((r) => r.slug)) ===
        JSON.stringify(['google', 'website', 'seo', 'marketing', 'proof', 'benchmarks']),
        '§6.2 rows in spec §0 delivery order', rows.map((r) => r.slug).join(' -> '));
    chk(rows.every((r) => r.live === false && r.state === 'coming'),
        '§6.3 every gate closed -> live:false, state:"coming"',
        [...new Set(rows.map((r) => `live=${r.live}/state=${r.state}`))].join(' '));

    const raw = JSON.stringify(BODIES);
    chk(!/CLIENT_SECRET|API_KEY|VERCEL_TOKEN|INTEGRATION_TOKEN/.test(raw),
        '§6.4 no key NAME or value appears in any response body',
        'presence booleans only, per env.js');

    // Both-ways: flip a P1 key and the row must move. Modules are re-required
    // from a cleared cache so `gates()` re-reads the environment.
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'x';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'x';
    process.env.INTEGRATION_TOKEN_KEY = 'x';
    const envMod = require(P('src/api/vendor/solutions/env.js'));
    const g = envMod.gates();
    chk(g.p1 === true && g.p2 === false,
        '§6.5 setting P1 keys flips p1 alone', JSON.stringify(g));
    chk(g.p3 === false && g.p4 === false && g.p5 === false && g.p6 === false,
        '§6.6 P3-P6 stay false by declaration, not by key absence',
        'UNKEYED_PHASES = ' + JSON.stringify(envMod.UNKEYED_PHASES) + ' — spec §8 is the amendment site');
    for (const k of ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET', 'INTEGRATION_TOKEN_KEY']) delete process.env[k];
  }

  // ═══ §7 · THE EMPTY STATES ARE THE RULED ONES ════════════════════════════
  // ⚠ GUARDED, because non-vacuity mutation N4 showed why. When a door 500s,
  // its body is absent and this section's first cut dereferenced it — the bench
  // died with a TypeError and printed §7, §8 and §9 not at all. Exit 2 is still
  // an honest verdict, but a PARTIAL VERDICT SET is exactly what wl_audit's
  // preamble refuses: the reader cannot tell an unreported cell from a passing
  // one. Every cell below now reports FAIL on an absent body and the run
  // completes.
  console.log('\n── §7 · R-19.4\'s ruled empty shapes ──');
  {
    const body = (r, k) => (BODIES[r] && BODIES[r][k]) || null;
    const g = body('/google', 'google');
    chk(g && g.status === 'not_connected', '§7.1 google -> not_connected', g ? g.status : 'no body — the door did not answer');
    const s = body('/seo', 'seo');
    chk(s && Object.values(s.checklist).every((v) => v === false),
        '§7.2 seo checklist -> every item false', s ? JSON.stringify(s.checklist) : 'no body');
    chk(s && !('score' in s), '§7.3 seo carries no score field (spec §6 refuses it by name)', s ? 'absent' : 'no body');
    const b = body('/benchmarks', 'benchmarks');
    chk(b && b.cohort === 0, '§7.4 benchmarks -> cohort 0', b ? String(b.cohort) : 'no body');
    // ⚠ THE MESSAGE IS DERIVED, NOT WRITTEN. Its first cut was the static
    // string "four metrics, all null" — which printed UNCHANGED beside a FAIL
    // when mutation N3 made every metric carry a number. A cell whose message
    // contradicts its own verdict is worse than a silent one: it reads as
    // reassurance at exactly the moment it is reporting a leak.
    chk(b && b.metrics.every((m) => m.mine === null && m.median === null),
        '§7.5 no number ships below the cohort floor — mine AND median null',
        b ? b.metrics.map((m) => `${m.metric}=${m.mine}/${m.median}`).join(' ') : 'no body');
    const docs = body('/proof', 'docs');
    chk(docs && JSON.stringify(docs.map((d) => d.kind)) === JSON.stringify(['rate_card', 'one_pager', 'qa']),
        '§7.6 proof enumerates its three documents rather than sending []',
        docs ? 'the vendor sees which three she will get' : 'no body');
  }

  // ═══ §8 · THE SEARCH DOOR INVENTS NOTHING ════════════════════════════════
  console.log('\n── §8 · domain/search ──');
  {
    const r1 = await get(B + '/domain/search');
    chk(r1.status === 400, '§8.1 missing q -> 400 (a route property, not a registrar one)', `HTTP ${r1.status}`);
    const r2 = await get(B + '/domain/search?q=benchstudio');
    chk(r2.status === 200 && Array.isArray(r2.body.results) && r2.body.results.length === 0 && r2.body.live === false,
        '§8.2 gate closed -> empty results and live:false, never a fabricated price',
        JSON.stringify(r2.body));
  }

  // ═══ §9 · POSTS ARE WITHHELD, NOT HALF-BUILT ═════════════════════════════
  console.log('\n── §9 · the conditional-withheld POSTs ──');
  {
    const r = await new Promise((resolve, reject) => {
      const req = http.request(BASE + B + '/domain/register', { method: 'POST' }, (res) => {
        let b = ''; res.on('data', (d) => (b += d)); res.on('end', () => resolve({ status: res.statusCode, raw: b }));
      });
      req.on('error', reject); req.end();
    });
    chk(r.status === 404, '§9.1 a withheld POST is genuinely absent, not a stub answering 200',
        `HTTP ${r.status} — no handler is mounted`);

    // STRUCTURAL, and it says so: this cell reads SOURCE, because "the uncomment
    // step is stated" is a property of the text and cannot be executed. Every
    // other cell in this file executes.
    const src = require('fs').readFileSync(P('src/api/vendor/solutions/index.js'), 'utf8');
    chk(/UNCOMMENT STEP:/.test(src) && /env\.gates\(\)\.p1/.test(src) && /env\.gates\(\)\.p2/.test(src),
        '§9.2 [SOURCE-READ] each withheld block states its uncomment step and its gate',
        'conditional-withheld rule satisfied in text');
  }

  server.close();
  console.log(`\n${pass} PASS · ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error('BENCH ABORTED —', e && e.stack ? e.stack : e);
  if (server) server.close();
  process.exit(2);
});
