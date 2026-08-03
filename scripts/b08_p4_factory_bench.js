#!/usr/bin/env node
// scripts/b08_p4_factory_bench.js — TDW_08 · P4 — THE DEMO FACTORY (dream-os arm)
//
// Runnable from ANY working directory (ROOT resolved from __dirname, never cwd).
//
// EVERY §M CELL IS BOTH-WAYS. It mutates PRODUCTION SOURCE — never test setup —
// asserts the cell goes RED at the broken tree, restores the file, and asserts
// byte-identity. Every anchor is asserted to appear EXACTLY ONCE before the
// replace, so CE-127's String.replace-takes-the-first fault is structurally
// impossible rather than avoided by care.
//
// ── THE COMMENT-BLINDNESS LAW BINDS EVERY TEXTUAL CELL HERE ─────────────────
// P3's dream-os bench broke that law in its own first run. This file's textual
// cells strip comments FIRST and say so, because the code they inspect is buried
// in comment blocks that quote the very strings being asserted absent — the word
// "daily" appears a dozen times in this delivery's prose explaining why nothing
// is CALLED daily, and a naive grep would convict the explanation.
//
// ── WHAT THIS BENCH DOES NOT ASSERT, named rather than silently absent ───────
// (floor-method law — a skipped bench is named with its reason.)
//   · NO cell over a SUCCESSFUL invite send. The pre-check/send/state ordering
//     and `onInvited`'s whole machine are `b08_p1_lifecycle_bench`'s ground, and
//     re-asserting them here would make two owners of one fact. This bench owns
//     the REFUSALS P4 added, which are reachable without a send.
//   · NO auth cells. `requireAdmin` is one guard for every route in this file and
//     `b07_f0791_guard_stack_bench` owns it. The route handlers below are invoked
//     PAST the guard on purpose, which is why that bench must stay green.
//   · NO pwa cells. The board, the funnel, the floor's client half and the
//     deleted `< 10` are the pwa arm's, benched at `tdw08_p4_factory.proof.mjs`.
//   · NO cell over the bulk route's DDL or a real insert. There is no database
//     here; the fake below proves the route's decisions, not Postgres's.
//   · NO cell over the IG pipeline fetch. It is not built (CE ruling FORK A(c)),
//     so there is nothing to assert but its stated absence, which §M.14 does.

'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(SRC(rel), 'utf8');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const code = (rel) => strip(read(rel));

const ADMIN  = 'src/api/admin/demoAdmin.js';
const BATCH  = 'src/lib/demoInviteBatch.js';
const DISC   = 'src/lib/vendor/discover.js';
const PORT   = 'src/lib/vendor/portfolio.js';

let pass = 0, fail = 0;
const H = (s) => console.log(`\n══ ${s} ══`);
function ok(name, cond, msg) {
  try { assert.ok(cond, msg || 'assertion failed'); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n        ${e.message}`); fail++; }
}
function eq(name, a, b) {
  try { assert.deepStrictEqual(a, b); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n        ${e.message}`); fail++; }
}

// ── MODULE RELOAD ───────────────────────────────────────────────────────────
// demoAdmin DESTRUCTURES its constants at require time, so a mutation to
// discover.js is invisible until BOTH modules are re-required. The cache bust
// walks the whole chain rather than the one file — CE-117's caching law: a
// mutation must bust whatever caching the cell's own read path uses.
function freshRouter() {
  for (const rel of [ADMIN, BATCH, DISC, PORT, 'src/lib/demoLifecycle.js']) {
    const abs = SRC(rel);
    if (require.cache[abs]) delete require.cache[abs];
  }
  return require(SRC(ADMIN));
}

// ── THE MUTATION HELPER ─────────────────────────────────────────────────────
async function mutate(rel, anchor, replacement, predicate, label) {
  const abs      = SRC(rel);
  const original = fs.readFileSync(abs, 'utf8');
  const hits     = original.split(anchor).length - 1;
  assert.strictEqual(hits, 1,
    `anchor must appear EXACTLY ONCE in ${rel} (found ${hits}) — a bare anchor is a coin flip`);
  try {
    fs.writeFileSync(abs, original.replace(anchor, replacement), 'utf8');
    let red = false;
    try { await predicate(); } catch { red = true; }
    assert.ok(red, `${label}: the cell stayed GREEN over broken production code — it proves nothing`);
  } finally {
    fs.writeFileSync(abs, original, 'utf8');
    assert.strictEqual(fs.readFileSync(abs, 'utf8'), original,
      `${rel} was NOT restored byte-identically`);
    freshRouter();
  }
}
// A mutation that THROWS must fail its own cell, never abort the run — a bench
// that dies mid-section publishes a partial count, which is worse than a red.
async function okMutate(name, rel, anchor, replacement, predicate, label) {
  try { await mutate(rel, anchor, replacement, predicate, label); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n        ${e.message}`); fail++; }
}

// ── THE FAKE SUPABASE ───────────────────────────────────────────────────────
// A decision harness, not a database. It answers the SHAPES the routes ask for
// and records the writes, so a cell can convict a route for deciding wrongly —
// never for Postgres behaving differently, which it cannot witness anyway.
function makeSupabase(tables) {
  const writes = [];
  class Q {
    constructor(t) { this.t = t; this.f = []; this.ins = null; this.cols = null; }
    // THE FAKE PROJECTS. A select() that returns every column regardless of what
    // was asked for cannot witness a MISSING COLUMN — and a missing column in a
    // pre-check select is exactly what F-08.39 was. §M.13 caught this harness
    // proving nothing on its first run; the projection is that cell's tuition.
    select(cols) {
      if (typeof cols === 'string' && cols.trim() && cols.trim() !== '*') {
        this.cols = cols.split(',').map(c => c.trim()).filter(Boolean);
      }
      return this;
    }
    _project(r) {
      if (!r || !this.cols) return r;
      const out = {};
      for (const c of this.cols) if (c in r) out[c] = r[c];
      return out;
    }
    order()  { return this; }
    limit()  { return this; }
    not()    { this.f.push(['__notnull', true]); return this; }
    eq(c, v) { this.f.push([c, v]); return this; }
    insert(p) { this.ins = p; return this; }
    update(p) { this.ins = p; return this; }
    _rows() {
      let rows = (tables[this.t] || []).slice();
      for (const [c, v] of this.f) {
        if (c === '__notnull') rows = rows.filter(r => r.demo_vendor_ref != null);
        else rows = rows.filter(r => String(r[c]) === String(v));
      }
      return rows;
    }
    async maybeSingle() { const r = this._rows()[0]; return { data: r ? this._project(r) : null, error: null }; }
    async single() {
      if (this.ins) {
        const dup = (tables[this.t] || []).some(r => r.ig_handle && r.ig_handle === this.ins.ig_handle);
        if (dup) return { data: null, error: { code: '23505', message: 'duplicate key' } };
        const row = { id: 'id-' + ((tables[this.t] || []).length + 1), ...this.ins };
        (tables[this.t] = tables[this.t] || []).push(row);
        writes.push({ table: this.t, row });
        return { data: this._project(row), error: null };
      }
      const r = this._rows()[0];
      return { data: r ? this._project(r) : null, error: null };
    }
    then(res, rej) { return Promise.resolve({ data: this._rows().map(r => this._project(r)), error: null }).then(res, rej); }
  }
  return { supabase: { from: (t) => new Q(t) }, writes, tables };
}

// Invoke a route PAST its guard: the route stack is [requireAdmin, handler] and
// the handler is always the last layer. Auth is f0791's ground, not this bench's.
async function call(router, method, routePath, { body = {}, params = {} } = {}) {
  const layer = router.stack.find(l => l.route && l.route.path === routePath && l.route.methods[method]);
  assert.ok(layer, `no ${method.toUpperCase()} ${routePath} on the router`);
  const handler = layer.route.stack[layer.route.stack.length - 1].handle;
  const out = { status: 200, body: null };
  const res = {
    status(s) { out.status = s; return this; },
    json(b) { out.body = b; return this; },
  };
  await handler({ app: { locals: { supabase: call._sb } }, body, params }, res, () => {});
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
H('§1 · THE PHOTO PLANE — IMPORTED, NEVER TYPED (FORK B(a))');

const { MIN_PORTFOLIO_IMAGES } = require(SRC(DISC));
const { MAX_PORTFOLIO_IMAGES } = require(SRC(PORT));

ok('§1.1 demoAdmin REQUIRES the floor from its enforcing home',
  /require\(\s*'\.\.\/\.\.\/lib\/vendor\/discover'\s*\)/.test(code(ADMIN))
  && /MIN_PORTFOLIO_IMAGES/.test(code(ADMIN)));
ok('§1.2 demoAdmin REQUIRES the ceiling from its enforcing home',
  /require\(\s*'\.\.\/\.\.\/lib\/vendor\/portfolio'\s*\)/.test(code(ADMIN))
  && /MAX_PORTFOLIO_IMAGES/.test(code(ADMIN)));

// The three old numbers are GONE from the executable text. Comment-stripped,
// because this delivery's prose explains at length what 3 and 10 used to do.
ok('§1.3 no `< 3` photo gate survives in code',
  !/photos\.length\s*<\s*3/.test(code(ADMIN)));
ok('§1.4 no bare photo-count literal survives in code',
  !/photos\.length\s*[<>]=?\s*\d/.test(code(ADMIN)));
ok('§1.5 no re-typed 6 or 20 in the gate',
  !/MIN_PORTFOLIO_IMAGES\s*=\s*\d/.test(code(ADMIN)) && !/MAX_PORTFOLIO_IMAGES\s*=\s*\d/.test(code(ADMIN)));

async function createWith(n, tables = { demo_vendors: [] }) {
  const h = makeSupabase(tables);
  call._sb = h.supabase;
  const router = freshRouter();
  const photos = Array.from({ length: n }, (_, i) => ({ url: `https://x/${i}.jpg`, is_hero: i === 0 }));
  return { out: await call(router, 'post', '/vendors', { body: { ig_handle: 'a', display_name: 'A', category: 'makeup', city: 'Delhi', photos } }), h };
}

(async () => {
  {
    const { out } = await createWith(MIN_PORTFOLIO_IMAGES - 1);
    eq('§1.6 below the floor → 400', out.status, 400);
    eq('§1.7 the founder-frozen C1 string, floor interpolated',
      out.body.error, `Need at least ${MIN_PORTFOLIO_IMAGES} portfolio images. You have ${MIN_PORTFOLIO_IMAGES - 1}.`);
  }
  {
    const { out } = await createWith(MAX_PORTFOLIO_IMAGES + 1);
    eq('§1.8 above the ceiling → 400 (the demo plane had NO ceiling before P4)', out.status, 400);
    eq('§1.9 the founder-frozen C4 string, "demo" not "portfolio"',
      out.body.error, `Your demo holds ${MAX_PORTFOLIO_IMAGES} photos, the maximum. Remove one to add another.`);
  }
  {
    const { out, h } = await createWith(MIN_PORTFOLIO_IMAGES);
    eq('§1.10 exactly at the floor → created', out.status, 200);
    ok('§1.11 the create still routes presence through demoLifecycle',
      h.writes.length === 1 && h.writes[0].row.state === 'built' && h.writes[0].row.active === true);
  }

  // ── BOTH-WAYS ─────────────────────────────────────────────────────────────
  // The import is LIVE, not a copy: move the enforcing constant and the refusal
  // string moves with it. This is the cell that would have caught 3 and 10.
  await okMutate('§M.1 §1.7 reds when the ENFORCING constant moves (the import is live)',
    DISC, 'const MIN_PORTFOLIO_IMAGES = 6;', 'const MIN_PORTFOLIO_IMAGES = 3;',
    async () => {
      const { out } = await createWith(MIN_PORTFOLIO_IMAGES - 1);
      assert.strictEqual(out.body.error, `Need at least ${MIN_PORTFOLIO_IMAGES} portfolio images. You have ${MIN_PORTFOLIO_IMAGES - 1}.`);
    }, '§1.7');

  await okMutate('§M.2 §1.9 reds when the ceiling constant moves',
    PORT, 'const MAX_PORTFOLIO_IMAGES = 20;', 'const MAX_PORTFOLIO_IMAGES = 99;',
    async () => {
      const { out } = await createWith(MAX_PORTFOLIO_IMAGES + 1);
      assert.strictEqual(out.status, 400);
    }, '§1.9');

  await okMutate('§M.3 §1.6 reds when the gate is cut out of the create route',
    ADMIN, '  const gate = _photoGate(photos);\n  if (gate.ok === false) return res.status(400).json({ ok: false, error: gate.error });',
    '  const gate = { ok: true }; if (gate.ok === false) return res.status(400).json({ ok: false });',
    async () => {
      const { out } = await createWith(1);
      assert.strictEqual(out.status, 400);
    }, '§1.6');

  // ═══════════════════════════════════════════════════════════════════════════
  H('§2 · THE WIRE — THE BOARD READS THE SERVER, NEVER ITSELF');

  const demoLifecycle = require(SRC('src/lib/demoLifecycle.js'));

  async function listWith(tables) {
    const h = makeSupabase(tables);
    call._sb = h.supabase;
    return call(freshRouter(), 'get', '/vendors');
  }

  {
    const out = await listWith({ demo_vendors: [
      { id: 'v1', ig_handle: 'alpha', display_name: 'Alpha', whatsapp_phone: '+919888294440', state: 'built', photos: [], created_at: '2026-08-01' },
      { id: 'v2', ig_handle: 'beta',  display_name: 'Beta',  whatsapp_phone: '919888294440',  state: 'built', photos: [], created_at: '2026-08-01' },
      { id: 'v3', ig_handle: 'gamma', display_name: 'Gamma', whatsapp_phone: '+918700521064', state: 'legacy', photos: [], created_at: '2026-08-01' },
    ], prospects: [
      { phone: '918700521064', demo_vendor_ref: 'v1' },
    ] });

    eq('§2.1 the board\'s columns ARE demoLifecycle.STATES, from the frozen export',
      out.body.states, Array.from(demoLifecycle.STATES));
    eq('§2.2 the floor rides the wire', out.body.min_portfolio_images, MIN_PORTFOLIO_IMAGES);
    ok('§2.3 the CEILING does NOT ride the wire — the client cannot hold an opinion it never receives',
      !('max_portfolio_images' in out.body));

    const byId = Object.fromEntries(out.body.vendors.map(v => [v.id, v]));
    ok('§2.4 shared_handset is true for BOTH members of a pair, across notations',
      byId.v1.shared_handset === true && byId.v2.shared_handset === true);
    ok('§2.5 shared_handset is false for a lone handset', byId.v3.shared_handset === false);
    eq('§2.6 linkage_held_by names the OTHER row the prospect points at', byId.v3.linkage_held_by, 'alpha');
    ok('§2.7 a row is never reported as linked to ITSELF',
      byId.v1.linkage_held_by === null && byId.v2.linkage_held_by === null);
  }

  {
    // THE GUARD'S REACH IS THE NORMALIZER'S REACH, DECLARED NOT DISCOVERED.
    // `normalizeTo` strips `whatsapp:` and a leading `+` and does nothing else —
    // it does NOT infer a country code. So a row held as `9888294440` and one
    // held as `919888294440` are different handsets to this estate, in the
    // prospect lane and here alike. Asserted so the limit is a KNOWN one; the
    // cure is a normalizer change, which would be a second opinion about phone
    // identity (F-07.47) and is nobody's to make inside a route.
    const out = await listWith({ demo_vendors: [
      { id: 'v1', ig_handle: 'alpha', whatsapp_phone: '+919888294440', state: 'built', photos: [], created_at: '2026-08-01' },
      { id: 'v2', ig_handle: 'beta',  whatsapp_phone: '9888294440',    state: 'built', photos: [], created_at: '2026-08-01' },
    ], prospects: [] });
    ok('§2.8 DECLARED LIMIT: country-code notation differences are NOT reconciled',
      out.body.vendors.every(v => v.shared_handset === false));
  }

  await okMutate('§M.4 §2.1 reds if the component is ever handed a hand-written column list',
    ADMIN, '      states: demoLifecycle.STATES,', "      states: ['built', 'invited'],",
    async () => {
      const out = await listWith({ demo_vendors: [], prospects: [] });
      assert.deepStrictEqual(out.body.states, Array.from(demoLifecycle.STATES));
    }, '§2.1');

  await okMutate('§M.5 §2.4 reds if the phone census stops normalizing',
    ADMIN, '      const p = normalizeTo(r.whatsapp_phone || \'\');\n      if (p) phoneCount.set(p, (phoneCount.get(p) || 0) + 1);',
    '      const p = r.whatsapp_phone || \'\';\n      if (p) phoneCount.set(p, (phoneCount.get(p) || 0) + 1);',
    async () => {
      const out = await listWith({ demo_vendors: [
        { id: 'v1', ig_handle: 'alpha', whatsapp_phone: '+919888294440', state: 'built', photos: [], created_at: '2026-08-01' },
        { id: 'v2', ig_handle: 'beta',  whatsapp_phone: '919888294440',  state: 'built', photos: [], created_at: '2026-08-01' },
      ], prospects: [] });
      assert.strictEqual(out.body.vendors[0].shared_handset, true);
    }, '§2.4');

  // ═══════════════════════════════════════════════════════════════════════════
  H('§3 · THE BULK BUILD (FORK A(c)) AND ITS INTRA-BATCH PRE-SCAN (FORK D(c))');

  async function bulk(demos, tables = { demo_vendors: [] }) {
    const h = makeSupabase(tables);
    call._sb = h.supabase;
    return { out: await call(freshRouter(), 'post', '/bulk', { body: { demos } }), h };
  }
  const sixUrls = Array.from({ length: 6 }, (_, i) => `https://x/${i}.jpg`);
  const row = (handle, phone) => ({ ig_handle: handle, display_name: handle, category: 'makeup', city: 'Delhi', whatsapp_phone: phone, photos: sixUrls });

  {
    const { out } = await bulk([row('a', '+919888294440'), row('b', '919888294440'), row('c', '+918700521064')]);
    eq('§3.1 the colliding pair is REFUSED — both members, never a silent winner', out.body.failedCount, 2);
    ok('§3.2 the refusal is named, not generic',
      (out.body.failed || []).every(f => f.error === 'shared_handset_in_batch'));
    eq('§3.3 the lone handset still builds', out.body.insertedCount, 1);
  }
  {
    const { out } = await bulk([{ ...row('a', null), photos: sixUrls.slice(0, 2) }]);
    eq('§3.4 the bulk route fires the SAME photo gate as the console', out.body.failedCount, 1);
    ok('§3.5 with the SAME founder-frozen string',
      out.body.failed[0].error === `Need at least ${MIN_PORTFOLIO_IMAGES} portfolio images. You have 2.`);
  }
  {
    const { out } = await bulk([row('dup', null)], { demo_vendors: [{ id: 'x', ig_handle: 'dup' }] });
    eq('§3.6 a handle already on file is SKIPPED, not failed — the re-run is idempotent', out.body.skippedCount, 1);
    eq('§3.7 and it is not counted as a failure', out.body.failedCount, 0);
  }
  {
    const { h } = await bulk([row('a', null)]);
    const inserted = h.writes[0].row;
    ok('§3.8 bulk routes presence through demoLifecycle.buildInsertPatch, never authoring it',
      inserted.state === 'built' && inserted.active === true && 'discover_eligible' in inserted);
    ok('§3.9 bulk rows are attributable', inserted.created_by === 'admin_bulk');
    ok('§3.10 a bare URL list becomes the object shape, first photo hero',
      Array.isArray(inserted.photos) && inserted.photos[0].is_hero === true && inserted.photos[1].is_hero === false);
  }

  await okMutate('§M.6 §3.1 reds if the intra-batch pre-scan is removed',
    ADMIN, '    if (norm && (phoneSeen.get(norm) || 0) > 1) {', '    if (false) {',
    async () => {
      const { out } = await bulk([row('a', '+919888294440'), row('b', '919888294440')]);
      assert.strictEqual(out.body.failedCount, 2);
    }, '§3.1');

  await okMutate('§M.7 §3.6 reds if a duplicate handle starts erroring instead of skipping',
    ADMIN, "        if (error.code === '23505') skipped.push(ig_handle);",
    '        if (false) skipped.push(ig_handle);',
    async () => {
      const { out } = await bulk([row('dup', null)], { demo_vendors: [{ id: 'x', ig_handle: 'dup' }] });
      assert.strictEqual(out.body.skippedCount, 1);
    }, '§3.6');

  // ═══════════════════════════════════════════════════════════════════════════
  H('§4 · THE SHARED-HANDSET REFUSAL (F-08.17) — BEFORE THE TEMPLATE IS SPENT');

  // The send is FENCED to a spy before demoAdmin is loaded, because demoAdmin
  // destructures `sendWa` at require time. A cell that could not prove NO SEND
  // would be proving nothing at all about a route whose whole point is when a
  // template may be spent.
  const sendWaAbs = require.resolve(SRC('src/lib/sendWa.js'));
  require(sendWaAbs);
  let sends = 0;
  require.cache[sendWaAbs].exports.sendWa = async () => { sends++; };

  async function invite(tables) {
    const h = makeSupabase(tables);
    call._sb = h.supabase;
    sends = 0;
    return call(freshRouter(), 'post', '/vendors/:id/invite', { params: { id: 'v2' } });
  }

  const pair = () => ({
    demo_vendors: [
      { id: 'v1', ig_handle: 'alpha', display_name: 'Alpha', whatsapp_phone: '+919888294440', state: 'built' },
      { id: 'v2', ig_handle: 'beta',  display_name: 'Beta',  whatsapp_phone: '919888294440',  state: 'built' },
    ],
    prospects: [{ phone: '919888294440', demo_vendor_ref: 'v1' }],
  });

  {
    const out = await invite(pair());
    eq('§4.1 the second of a shared-phone pair is REFUSED', out.status, 409);
    eq('§4.2 by name, not by a generic failure', out.body.error, 'shared_handset');
    eq('§4.3 and the refusal names the row that holds the linkage', out.body.detail, 'alpha');
    eq('§4.4 NO TEMPLATE WAS SPENT — the refusal precedes the send', sends, 0);
  }
  {
    const t = pair(); t.prospects = [{ phone: '919888294440', demo_vendor_ref: 'v2' }];
    const out = await invite(t);
    ok('§4.5 a row already holding its OWN linkage is not refused as a collision',
      out.body.error !== 'shared_handset');
  }
  {
    const t = pair(); t.prospects = [];
    const out = await invite(t);
    ok('§4.6 an unlinked handset is not refused as a collision',
      out.body.error !== 'shared_handset');
  }

  ok('§4.7 the invite has ONE home — both routes call it, neither re-implements it',
    (code(ADMIN).match(/async function _inviteOne/g) || []).length === 1
    && (code(ADMIN).match(/_inviteOne\(/g) || []).length === 3);

  await okMutate('§M.8 §4.1 reds if the shared-handset guard is removed',
    ADMIN, "    if (held && held.demo_vendor_ref && held.demo_vendor_ref !== row.id) {",
    '    if (false) {',
    async () => {
      const out = await invite(pair());
      assert.strictEqual(out.body.error, 'shared_handset');
    }, '§4.1');

  await okMutate('§M.9 §4.4 reds if a send is placed ABOVE the guard',
    ADMIN, "  // ── 1b · THE SHARED-HANDSET REFUSAL",
    "  await sendWa({ line: 'marketing', to: row.whatsapp_phone, templateKey: 'demo_invite', vars: {}, supabase });\n"
    + "  // ── 1b · THE SHARED-HANDSET REFUSAL",
    async () => {
      await invite(pair());
      assert.strictEqual(sends, 0);
    }, '§4.4');

  // ═══════════════════════════════════════════════════════════════════════════
  H('§5 · THE BATCH MAX (FORK C(a)) — A PER-RUN BOUND, NAMED AS ONE');

  const batchMod = require(SRC(BATCH));

  async function inviteBatch(ids, tables) {
    const h = makeSupabase(tables);
    call._sb = h.supabase;
    sends = 0;
    return call(freshRouter(), 'post', '/invite-batch', { body: { ids } });
  }

  {
    const many = Array.from({ length: batchMod.DEMO_INVITE_BATCH_MAX + 1 }, (_, i) => 'v' + i);
    const out = await inviteBatch(many, { demo_vendors: [], prospects: [] });
    eq('§5.1 over-length is REFUSED, never truncated', out.status, 400);
    eq('§5.2 by name', out.body.error, 'batch_too_large');
    eq('§5.3 and NOTHING was sent — a truncation the founder cannot see is a false done', sends, 0);
  }
  {
    const out = await inviteBatch(['nope'], { demo_vendors: [], prospects: [] });
    eq('§5.4 a batch collects outcomes instead of aborting on the first refusal', out.status, 200);
    eq('§5.5 and reports the refusal by row', out.body.refusedCount, 1);
  }
  {
    const out = await inviteBatch(['v2'], pair());
    eq('§5.6 the batch fires the SAME shared-handset guard as the single route', out.body.refused[0].error, 'shared_handset');
    eq('§5.7 spending no template', sends, 0);
  }

  eq('§5.8 the key is namespaced beside the demo plane\'s other operator number',
    batchMod.DEMO_INVITE_BATCH_KEY, 'demo.invite_batch_max');
  ok('§5.9 it does NOT share the marketing lane\'s key',
    batchMod.DEMO_INVITE_BATCH_KEY !== 'marketing.daily_template_cap'
    && !/marketing\.daily_template_cap/.test(code(BATCH)));

  // THE NAMING RIDER, MECHANICAL. Comment-stripped, because this delivery's
  // prose says the word "daily" repeatedly to explain that nothing IS daily.
  ok('§5.10 THE NAMING RIDER: no identifier or label in the batch home says "daily"',
    !/daily/i.test(code(BATCH)));
  ok('§5.11 nor does the batch route\'s executable text',
    !/daily/i.test(code(ADMIN).slice(code(ADMIN).indexOf("router.post('/invite-batch'"))));

  {
    const zero = { admin_config: [{ key: 'demo.invite_batch_max', value: '0' }] };
    const h = makeSupabase(zero);
    const n = await batchMod.readDemoInviteBatchMax(h.supabase);
    eq('§5.12 a founder-set ZERO is honoured, not treated as junk', n, 0);
  }
  {
    const junk = { admin_config: [{ key: 'demo.invite_batch_max', value: 'nonsense' }] };
    const h = makeSupabase(junk);
    const n = await batchMod.readDemoInviteBatchMax(h.supabase);
    eq('§5.13 junk collapses to the code default rather than throwing on a live page',
      n, batchMod.DEMO_INVITE_BATCH_MAX);
  }

  await okMutate('§M.10 §5.1 reds if the bound stops bounding',
    ADMIN, '    if (ids.length > batchMax) {', '    if (ids.length > 99999) {',
    async () => {
      const many = Array.from({ length: batchMod.DEMO_INVITE_BATCH_MAX + 1 }, (_, i) => 'v' + i);
      const out = await inviteBatch(many, { demo_vendors: [], prospects: [] });
      assert.strictEqual(out.status, 400);
    }, '§5.1');

  await okMutate('§M.11 §5.12 reds if zero is swallowed by a falsy check',
    BATCH, '    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEMO_INVITE_BATCH_MAX;',
    '    return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEMO_INVITE_BATCH_MAX;',
    async () => {
      delete require.cache[SRC(BATCH)];
      const m = require(SRC(BATCH));
      const h = makeSupabase({ admin_config: [{ key: 'demo.invite_batch_max', value: '0' }] });
      assert.strictEqual(await m.readDemoInviteBatchMax(h.supabase), 0);
    }, '§5.12');

  // ═══════════════════════════════════════════════════════════════════════════
  H('§6 · F-08.38 — CORRECTED ON CONTACT, NEVER SWEPT');

  // ⚠ THE COMMENT-BLINDNESS LAW CONVICTED THIS BENCH IN ITS OWN FIRST RUN.
  // §6.1 and §6.2 originally asserted the stale strings were ABSENT from the
  // file. They fired — on the F-08.38 attribution that QUOTES them in order to
  // record what was corrected. The right assertion is not absence but CONFINEMENT:
  // the stale form survives exactly once, on a line that names the finding.
  const adminLines = read(ADMIN).split('\n');
  const staleCount = (needle) => adminLines.filter(l => l.includes(needle)).length;
  const staleQuoted = (needle) => adminLines
    .filter(l => l.includes(needle))
    .every(l => /F-08\.38|corrected ON CONTACT/.test(l));
  ok('§6.1 no live route-count claim survives — the one occurrence is the correction quoting itself',
    staleCount('ten routes') <= 1 && staleQuoted('ten routes'));
  ok('§6.2 no live `prospects.js:213` cite survives — likewise confined to the correction',
    staleCount('prospects.js:213') <= 1 && staleQuoted('prospects.js:213'));
  ok('§6.3 and its replacement is PATH PLUS SYMBOL, carrying no line number',
    /`runOpenerJob` \(src\/lib\/prospects\.js\)/.test(read(ADMIN)));
  ok('§6.4 the correction is attributed in-file so the next reader knows why',
    /F-08\.38/.test(read(ADMIN)));

  // ═══════════════════════════════════════════════════════════════════════════
  H('§7 · THE TWO ABSENCES, DECLARED IN-FILE RATHER THAN DISCOVERED');

  ok('§7.1 the IG pipeline fetch is named absent with its missing contract enumerated',
    /IG PIPELINE FETCH IS NOT BUILT/.test(read(ADMIN))
    && /PROVIDER/.test(read(ADMIN)) && /CREDENTIAL/.test(read(ADMIN))
    && /RATE LIMIT/.test(read(ADMIN)) && /ToS/.test(read(ADMIN)));
  ok('§7.2 and no fetch was quietly built anyway',
    !/rapidapi/i.test(code(ADMIN)) && !/n8n/i.test(code(ADMIN)));
  ok('§7.3 "also create prospects" is REPORTED with its mechanism, not worked around',
    /ALSO CREATE PROSPECTS.*IS NOT BUILT/s.test(read(ADMIN)) && /F-08\.10/.test(read(ADMIN)));
  ok('§7.4 and no prospect row is created at BUILD time by any bulk path',
    !/from\('prospects'\)[\s\S]{0,200}\.insert\(/.test(code(ADMIN)));

  // ═══════════════════════════════════════════════════════════════════════════
  H('§8 · F-08.39 — AN INACTIVE DEMO IS NOT INVITED TO A DOOR THAT IS LOCKED');

  ok('§8.1 the public landing REQUIRES active — the fact this refusal is conditioned on',
    /\.eq\('active', true\)/.test(code('src/api/demo/vendor.js')));
  ok('§8.2 the invite pre-check now READS active',
    /\.select\('id, ig_handle, display_name, whatsapp_phone, state, active'\)/.test(code(ADMIN)));

  const inactive = (over) => ({
    demo_vendors: [{ id: 'v2', ig_handle: 'swati', display_name: 'Swati', whatsapp_phone: '919888294440', state: 'legacy', active: false, ...over }],
    prospects: [],
  });

  {
    const out = await invite(inactive({}));
    eq('§8.3 an inactive, invite-eligible row is REFUSED', out.status, 409);
    eq('§8.4 by name', out.body.error, 'inactive_demo');
    eq('§8.5 NO TEMPLATE WAS SPENT on a landing that would not render', sends, 0);
  }
  {
    const out = await invite(inactive({ active: true }));
    ok('§8.6 the same row ACTIVE is not refused as inactive', out.body.error !== 'inactive_demo');
  }
  {
    // THE BOUND, ASSERTED. `removed` was already refused before this cure; the
    // finding only ever reached rows whose inactivity predates the P1 fold.
    const out = await invite(inactive({ state: 'removed' }));
    eq('§8.7 THE BOUND: a removed row was already refused, and still is, as an illegal transition',
      out.body.error, 'illegal_transition');
  }
  {
    const h = makeSupabase(inactive({}));
    call._sb = h.supabase;
    sends = 0;
    const out = await call(freshRouter(), 'post', '/invite-batch', { body: { ids: ['v2'] } });
    eq('§8.8 the BATCH inherits the refusal — one home, two doors', out.body.refused[0].error, 'inactive_demo');
    eq('§8.9 spending nothing', sends, 0);
  }

  await okMutate('§M.12 §8.3 reds if the inactive guard is removed',
    ADMIN, '  if (row.active === false) {', '  if (false) {',
    async () => {
      const out = await invite(inactive({}));
      assert.strictEqual(out.body.error, 'inactive_demo');
    }, '§8.3');

  await okMutate('§M.13 §8.3 reds if `active` falls back out of the pre-check select',
    ADMIN, ".select('id, ig_handle, display_name, whatsapp_phone, state, active')",
    ".select('id, ig_handle, display_name, whatsapp_phone, state')",
    async () => {
      const out = await invite(inactive({}));
      assert.strictEqual(out.body.error, 'inactive_demo');
    }, '§8.3');

  // ═══════════════════════════════════════════════════════════════════════════
  H('§9 · F-08.40 — THE HANDSET KEY RIDES THE WIRE SO NO SECOND NORMALIZER EXISTS');

  {
    const out = await listWith({ demo_vendors: [
      { id: 'v1', ig_handle: 'alpha', whatsapp_phone: '+919888294440', state: 'built', photos: [], created_at: '2026-08-01' },
      { id: 'v2', ig_handle: 'beta',  whatsapp_phone: '919888294440',  state: 'built', photos: [], created_at: '2026-08-01' },
      { id: 'v3', ig_handle: 'gamma', whatsapp_phone: null,            state: 'built', photos: [], created_at: '2026-08-01' },
    ], prospects: [] });
    const byId = Object.fromEntries(out.body.vendors.map(v => [v.id, v]));
    eq('§9.1 the key is the NORMALIZED phone, so two notations collapse to one handset',
      byId.v1.handset_key, byId.v2.handset_key);
    eq('§9.2 and it is the estate normalizer\'s own answer', byId.v1.handset_key, '919888294440');
    eq('§9.3 a phoneless row carries no key rather than an empty one', byId.v3.handset_key, null);
  }

  await okMutate('§M.14 §9.1 reds if the key stops being normalized',
    ADMIN, '        handset_key: p || null,', '        handset_key: r.whatsapp_phone || null,',
    async () => {
      const out = await listWith({ demo_vendors: [
        { id: 'v1', ig_handle: 'alpha', whatsapp_phone: '+919888294440', state: 'built', photos: [], created_at: '2026-08-01' },
        { id: 'v2', ig_handle: 'beta',  whatsapp_phone: '919888294440',  state: 'built', photos: [], created_at: '2026-08-01' },
      ], prospects: [] });
      assert.strictEqual(out.body.vendors[0].handset_key, out.body.vendors[1].handset_key);
    }, '§9.1');

  // ═════════════════════════════════════════════════════════════════════════
  console.log(`\n══ b08_p4_factory_bench: ${pass} passed, ${fail} failed, 0 skipped ══\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
