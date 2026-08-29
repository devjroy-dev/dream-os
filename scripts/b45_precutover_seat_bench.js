#!/usr/bin/env node
// scripts/b45_precutover_seat_bench.js
//
// CE-39 · STEP 2a · THE DREAM-OS PRE-CUTOVER SEAT — its cells and their red mutations.
//
//   A · F-39.2   the CORS preflight is cached (Access-Control-Max-Age: 600 ON THE WIRE)
//   B · F-19.50  the mint normalises before it shapes; one rule (^[A-Z0-9]{1,30}$); no truncation
//   C · F-19.49  one address space — the guard refuses a live demo AND a real vendor
//   D · F-19.51  a completion whose mint yields nothing leaves status pending
//   E · F-38.p12 every /vendor/ or /w/ navigation literal in src/ lives in pwaPaths.js
//   F · R-39.6   couture_eligible on /me = invite flag OR tier in {signature, prestige}
//   G · R-39.7   no requirePrestige anywhere; a Basic vendor's studio call is not a 403
//
// EVERY CELL IS BOTH-WAYS (§9 non-vacuity): the mutation that reds it is named in
// the cell header and is a PRODUCTION-CODE mutation, never a test-setup one. The
// seat ran each mutation at the cut and recorded the red in the handover.
//
// DOUBLES, declared: requireAuth / resolveVendor are stubbed through require.cache
// (b0451's shape), and `supabase` is a chainable recorder whose answers the cell
// states per call. Nothing here reaches a network.
'use strict';

const path = require('node:path');
const fs   = require('node:fs');
const http = require('node:http');
const ROOT = path.resolve(__dirname, '..');
const { stripComments, NAIVE_RETIRED } = require('./lib/stripComments');

let pass = 0, fail = 0;
const results = [];
async function cell(name, fn) {
  try {
    const why = await fn();
    if (why) { fail++; results.push(`FAIL  ${name}\n      ${why}`); }
    else     { pass++; results.push(`PASS  ${name}`); }
  } catch (e) { fail++; results.push(`FAIL  ${name}\n      threw: ${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e}`); }
}

// ── the chainable supabase recorder ────────────────────────────────────────────
// answers: (table, op, filters) => { data, error }. Every builder call is recorded
// in `writes` so a cell can assert WHAT was written, not just that something was.
function makeSupabase(answer) {
  const writes = [];
  function builder(table) {
    const st = { table, op: 'select', filters: [], payload: null };
    const b = {};
    const chain = (k) => (...args) => { st.filters.push([k, ...args]); return b; };
    for (const k of ['eq', 'neq', 'not', 'is', 'in', 'order', 'limit', 'select']) b[k] = chain(k);
    b.insert = (p) => { st.op = 'insert'; st.payload = p; return b; };
    b.update = (p) => { st.op = 'update'; st.payload = p; return b; };
    b.upsert = (p) => { st.op = 'upsert'; st.payload = p; return b; };
    b.delete = ()  => { st.op = 'delete'; return b; };
    const settle = () => { if (st.op !== 'select') writes.push({ table, op: st.op, payload: st.payload }); return answer(table, st.op, st.filters, st.payload) || { data: null, error: null }; };
    b.maybeSingle = async () => settle();
    b.single      = async () => settle();
    b.then        = (res, rej) => Promise.resolve().then(settle).then(res, rej);
    return b;
  }
  return { from: builder, writes };
}

function stub(rel, mod) {
  const p = require.resolve(path.join(ROOT, rel));
  require.cache[p] = { id: p, filename: p, loaded: true, exports: mod };
}

function request(app, method, url, headers) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer(app).listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      const req = http.request({ host: '127.0.0.1', port, method, path: url, headers: headers || {} }, (res) => {
        let body = ''; res.on('data', (c) => body += c); res.on('end', () => { srv.close(); resolve({ status: res.statusCode, headers: res.headers, body }); });
      });
      req.on('error', (e) => { srv.close(); reject(e); }); req.end();
    });
  });
}

(async () => {
  const express = require('express');
  const cors    = require('cors');

  // ── §0 · TDW_STRIPPER_CANARY — the stripper itself, driven directly (F-07.74),
  //    its vacuity twin (§0.Y), and this bench's own call-site (§0.Z, F-07.99).
  //    Cells D', E and G below read comment-stripped source; a stripper that
  //    reverts would let them green over a tombstone.
  await cell('§0.X/§0.Y/§0.Z the stripper, its vacuity twin, and its call-site (TDW_STRIPPER_CANARY)', () => {
    const _spec = 'const a = 1;\nconst input = { accept: "image/*" };\nconst KEEP_ME = 2;\n/* real */\nconst ALSO_KEEP = 3;\n';
    if (!(stripComments(_spec).includes('KEEP_ME') && stripComments(_spec).includes('ALSO_KEEP'))) return '§0.X the stripper opened a block on a mid-token /* — F-07.74 has returned';
    if (NAIVE_RETIRED(_spec).includes('KEEP_ME')) return '§0.Y the retired rule no longer swallows — §0.X would be vacuous';
    const self = stripComments(fs.readFileSync(__filename, 'utf8'));
    if (!/stripComments\(/.test(self)) return '§0.Z this bench holds a stripper it does not call — F-07.99 class';
    return null;
  });

  // ── A · F-39.2 ──────────────────────────────────────────────────────────────
  // MUTATION → RED: delete `maxAge` from src/lib/corsOptions.js.
  await cell('A · an OPTIONS preflight from the PWA origin carries Access-Control-Max-Age: 600 on the wire (F-39.2)', async () => {
    const { corsOptions } = require(path.join(ROOT, 'src/lib/corsOptions'));
    const app = express(); app.use(cors(corsOptions)); app.get('/api/v2/vendor/me', (_q, r) => r.json({ ok: true }));
    const r = await request(app, 'OPTIONS', '/api/v2/vendor/me', {
      Origin: 'https://thedreamwedding.in', 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization',
    });
    if (r.headers['access-control-max-age'] !== '600') return `Access-Control-Max-Age on the wire = ${JSON.stringify(r.headers['access-control-max-age'])}, wanted "600"`;
    if (r.headers['access-control-allow-credentials'] !== 'true') return 'credentials flag lost in the move';
    return null;
  });

  // ── B · F-19.50 ─────────────────────────────────────────────────────────────
  // MUTATION → RED: in src/lib/vendor/routingHandle.js, restore `.slice(0, 20)` on the mint.
  const RH = require(path.join(ROOT, 'src/lib/vendor/routingHandle'));
  await cell('B · the mint normalises before it shapes — a pasted URL mints the username, a 22-char name mints whole, 31 is refused not cut (F-19.50)', () => {
    const a = RH.mintRoutingHandle('https://www.instagram.com/makeupbyviaraa?igsh=MXd0c2l0ZnRnbW1oZQ==');
    if (a !== 'MAKEUPBYVIARAA') return `URL fixture minted ${JSON.stringify(a)}`;
    const b = RH.mintRoutingHandle('preetikhandelwalmakeup');
    if (b !== 'PREETIKHANDELWALMAKEUP') return `22-char fixture minted ${JSON.stringify(b)} (the old slice(0,20) cut it mid-word)`;
    const c = RH.mintRoutingHandle('a'.repeat(31));
    if (c !== null) return `31 chars minted ${JSON.stringify(c)} — an over-long candidate is SKIPPED, never truncated`;
    if (RH.shapeRoutingHandle('abc-def') !== 'ABCDEF') return 'the door/tool shape admits a hyphen the inbound lane cannot route';
    if (!RH.ROUTING_HANDLE_RE.test('X') || RH.ROUTING_HANDLE_RE.test('')) return 'the rule is not {1,30}';
    return null;
  });

  // ── C · F-19.49 ─────────────────────────────────────────────────────────────
  // MUTATION → RED: in handleIsFree, remove the demo_vendors query (bypass one direction).
  await cell('C · the one guard refuses a real vendor\'s address AND a live demo\'s, case-folded, and frees an inactive demo\'s (F-19.49)', async () => {
    const sb = makeSupabase((table, _op, filters) => {
      const eq = Object.fromEntries(filters.filter(f => f[0] === 'eq').map(f => [f[1], f[2]]));
      if (table === 'vendors')      return { data: eq.routing_handle === 'REALONE' ? { id: 'v1' } : null };
      if (table === 'demo_vendors') return { data: (eq.ig_handle === 'demoone' && eq.active === true) ? { id: 'd1' } : null };
      return { data: null };
    });
    if (await RH.handleIsFree(sb, 'realone') !== false) return 'a real vendor\'s handle (queried lower) read as free';
    if (await RH.handleIsFree(sb, 'DEMOONE') !== false) return 'a live demo\'s handle (queried UPPER) read as free';
    if (await RH.handleIsFree(sb, 'FRESH')   !== true)  return 'a free handle read as taken';
    const sb2 = makeSupabase((table, _op, filters) => {
      const eq = Object.fromEntries(filters.filter(f => f[0] === 'eq').map(f => [f[1], f[2]]));
      if (table === 'demo_vendors') return { data: eq.active === true ? null : { id: 'd-inactive' } };
      return { data: null };
    });
    if (await RH.handleIsFree(sb2, 'demoone') !== true) return 'an INACTIVE demo blocked the address — live means active=true, the door\'s own predicate';
    return null;
  });

  // ── D · F-19.51 (agent lane) ────────────────────────────────────────────────
  // MUTATION → RED: in src/agent/onboarding.js completeOnboarding, write `status: 'active'`
  // unconditionally (drop the `handle ?` predicate).
  await cell('D · a WhatsApp completion whose mint finds no free address leaves status PENDING; one that mints flips it ACTIVE (F-19.51)', async () => {
    const { nextOnboardingMessage } = require(path.join(ROOT, 'src/agent/onboarding'));
    const vendor = { id: 'v-d', onboarding_state: 'asked_rate', category: 'makeup', city: 'Delhi' };
    const user   = { name: 'Priya Sharma', phone: '919888294440' };
    // every candidate taken: vendors says yes to everything
    const taken = makeSupabase((table) => table === 'vendors' ? { data: { id: 'someone' } } : { data: null });
    await nextOnboardingMessage({ vendor, user, inboundMessage: 'Rs 50,000', supabase: taken });
    const w1 = taken.writes.filter(w => w.table === 'vendors' && w.op === 'update').map(w => w.payload);
    if (!w1.length) return 'no vendors update fired on completion';
    if (w1.some(p => p.status === 'active' || p.routing_handle)) return `status/handle written with no free address: ${JSON.stringify(w1)}`;
    if (!w1.some(p => p.onboarding_state === 'complete')) return 'completion did not complete';
    // everything free
    const free = makeSupabase((table) => table === 'vendors' ? { data: null } : { data: null });
    await nextOnboardingMessage({ vendor, user, inboundMessage: 'Rs 50,000', supabase: free });
    const w2 = free.writes.filter(w => w.table === 'vendors' && w.op === 'update').map(w => w.payload);
    const hit = w2.find(p => p.status === 'active');
    if (!hit) return `mint succeeded but status did not flip active: ${JSON.stringify(w2)}`;
    if (!RH.ROUTING_HANDLE_RE.test(hit.routing_handle || '')) return `active without a valid address: ${JSON.stringify(hit)}`;
    return null;
  });

  // ── D' · F-19.51 (born pending) ─────────────────────────────────────────────
  // MUTATION → RED: drop `status: 'pending'` from either insert in src/api/vendor/auth.js.
  await cell('D\' · both vendors inserts at the OTP door write status pending — no row is born active (F-19.51)', () => {
    const src = stripComments(fs.readFileSync(path.join(ROOT, 'src/api/vendor/auth.js'), 'utf8'));
    const inserts = src.match(/from\('vendors'\)\s*\.insert\(\{[^}]*\}\)/g) || [];
    if (inserts.length !== 2) return `expected the two vendors inserts, found ${inserts.length}`;
    const bad = inserts.filter(s => !/status:\s*'pending'/.test(s));
    return bad.length ? `an insert births a row without status pending: ${bad[0]}` : null;
  });

  // ── E · F-38.p12 ────────────────────────────────────────────────────────────
  // MUTATION → RED: in src/api/vendor/ig.js, inline `const RETURN_PATH = '/vendor/portfolio';`.
  // The CURED tree is GREEN by construction: route registrations and API mounts are
  // excluded by the line's own shape, not by an allow-list of files.
  await cell('E · every /vendor/ or /w/ navigation literal in src/ lives in src/lib/pwaPaths.js and nowhere else (F-38.p12)', () => {
    const hits = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') walk(p); continue; }
        if (!/\.(js|cjs|mjs)$/.test(e.name)) continue;
        const rel = path.relative(ROOT, p);
        if (rel === path.join('src', 'lib', 'pwaPaths.js')) continue;
        const lines = stripComments(fs.readFileSync(p, 'utf8')).split('\n');
        lines.forEach((line, i) => {
          const nav = /['"`]\/(vendor|w)\//.test(line) || /thedreamwedding\.in\/(vendor|w)\//.test(line);
          if (!nav) return;
          if (/demo\.thedreamwedding\.in\/vendor\//.test(line)) return;                       // the demo studio host, its own charter
          if (/\b(router|app)\.(use|get|post|put|patch|delete|all)\s*\(/.test(line)) return;  // route registration
          if (/\/api\/v[12]\//.test(line) || /req\.(path|originalUrl|url)/.test(line)) return; // API mounts, path compares
          hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
        });
      }
    };
    walk(path.join(ROOT, 'src'));
    return hits.length ? `navigation literal outside the one home:\n      ${hits.join('\n      ')}` : null;
  });

  // ── F · R-39.6 ──────────────────────────────────────────────────────────────
  // MUTATION → RED: in src/api/vendor/me.js, restore `couture_eligible: vendor.couture_eligible === true`.
  await cell('F · GET /me answers couture_eligible=true for a Signature vendor with no invite, and false for Basic (R-39.6)', async () => {
    const drive = async (vendorRow) => {
      for (const k of Object.keys(require.cache)) if (/src[\\/]api[\\/]vendor[\\/]me\.js$|middleware[\\/](requireAuth|resolveVendor)\.js$/.test(k)) delete require.cache[k];
      stub('src/api/middleware/requireAuth',   (req, _r, n) => { req.auth = { user_id: 'u1' }; n(); });
      stub('src/api/middleware/resolveVendor', () => (req, _r, n) => { req.vendor = vendorRow; n(); });
      const router = require(path.join(ROOT, 'src/api/vendor/me.js'));
      const app = express(); app.use(express.json());
      app.locals.supabase = makeSupabase((table) => table === 'users' ? { data: { name: 'Dev' } } : { data: null });
      app.use('/me', router);
      const r = await request(app, 'GET', '/me');
      if (r.status !== 200) return { err: `GET /me -> ${r.status} ${r.body.slice(0, 200)}` };
      return JSON.parse(r.body);
    };
    const base = { id: 'v1', user_id: 'u1', tier: 'basic', couture_eligible: false, category: 'makeup', onboarding_state: 'complete', aesthetic_tags: [], service_cities: null };
    const sig = await drive({ ...base, tier: 'signature' });
    if (sig.err) return sig.err;
    const cv = (sig.vendor || sig).couture_eligible;
    if (cv !== true) return `Signature, no invite: couture_eligible=${JSON.stringify(cv)}`;
    const bas = await drive({ ...base, tier: 'basic' });
    if (bas.err) return bas.err;
    const bv = (bas.vendor || bas).couture_eligible;
    if (bv !== false) return `Basic, no invite: couture_eligible=${JSON.stringify(bv)}`;
    const inv = await drive({ ...base, tier: 'basic', couture_eligible: true });
    if (inv.err) return inv.err;
    if ((inv.vendor || inv).couture_eligible !== true) return 'the invite door closed';
    return null;
  });

  // ── G · R-39.7 ──────────────────────────────────────────────────────────────
  // MUTATION → RED: restore `requirePrestige` to one studio mw array (and the file).
  await cell('G · requirePrestige is gone from src/ and a Basic vendor\'s studio call is not a 403 (R-39.7)', async () => {
    if (fs.existsSync(path.join(ROOT, 'src/api/middleware/requirePrestige.js'))) return 'src/api/middleware/requirePrestige.js still exists';
    const offenders = [];
    const walk = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (/\.js$/.test(e.name) && /requirePrestige/.test(stripComments(fs.readFileSync(p, 'utf8')))) offenders.push(path.relative(ROOT, p)); } };
    walk(path.join(ROOT, 'src'));
    if (offenders.length) return `requirePrestige still read at ${offenders.join(', ')}`;
    for (const k of Object.keys(require.cache)) if (/studio[\\/]team\.js$|middleware[\\/](requireAuth|resolveVendor)\.js$/.test(k)) delete require.cache[k];
    stub('src/api/middleware/requireAuth',   (req, _r, n) => { req.auth = { user_id: 'u1' }; n(); });
    stub('src/api/middleware/resolveVendor', () => (req, _r, n) => { req.vendor = { id: 'v1', tier: 'basic' }; n(); });
    const team = require(path.join(ROOT, 'src/api/vendor/studio/team.js'));
    const app = express(); app.use(express.json());
    app.locals.supabase = makeSupabase(() => ({ data: [] }));
    app.use('/studio/team', team);
    const r = await request(app, 'GET', '/studio/team');
    if (r.status === 403) return `a Basic vendor's studio call returned 403: ${r.body.slice(0, 120)}`;
    return null;
  });

  console.log(results.join('\n'));
  console.log(`\n${pass} PASS · ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})();
