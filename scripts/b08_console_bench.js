#!/usr/bin/env node
// scripts/b08_console_bench.js — TDW_08 · THE CONSOLE SITTING (dream-os arm)
//
// Runnable from ANY working directory (ROOT resolved from __dirname, never cwd).
//
// COVERS: F-08.44's typed-money gate at the two create doors · its CE-ruled
// SITING (row-intrinsic before cross-row) · FORK 3(c)'s `invite_states` on the
// wire · F-08.47's three-leg asymmetry mechanism.
//
// NOT HERE, and named so the absence is not read as coverage:
//   · F-08.42, F-08.45's console half, F-08.46, V1 — all pwa, benched at
//     scripts/tdw08_console.proof.mjs.
//   · the twelve stored production rows. This gate binds NEW WRITES ONLY;
//     remediation of stored values is founder-run SQL on a later ruling and
//     there is no database here to witness it.
//
// EVERY §M CELL IS BOTH-WAYS: it mutates PRODUCTION SOURCE — never test setup —
// asserts the cell goes RED at the broken tree, restores the file, and asserts
// byte-identity. Every anchor is asserted to appear EXACTLY ONCE before the
// replace, so CE-127's String.replace-takes-the-first fault is structurally
// impossible rather than avoided by care.

'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(SRC(rel), 'utf8');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const code = (rel) => strip(read(rel));

const ADMIN = 'src/api/admin/demoAdmin.js';
const GATE  = 'src/lib/moneyRegisterGate.js';
const LIFE  = 'src/lib/demoLifecycle.js';

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

function freshRouter() {
  for (const rel of [ADMIN, GATE, LIFE]) {
    const abs = SRC(rel);
    if (require.cache[abs]) delete require.cache[abs];
  }
  return require(SRC(ADMIN));
}
function freshGate() {
  const abs = SRC(GATE);
  if (require.cache[abs]) delete require.cache[abs];
  return require(SRC(GATE));
}

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
    freshRouter(); freshGate();
  }
}
async function okMutate(name, rel, anchor, replacement, predicate, label) {
  try { await mutate(rel, anchor, replacement, predicate, label); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n        ${e.message}`); fail++; }
}

// ── THE FAKE SUPABASE ────────────────────────────────────────────────────────
// A decision harness, not a database. It answers the SHAPES the routes ask for
// and records writes, so a cell can convict a route for deciding wrongly — never
// for Postgres behaving differently, which it cannot witness anyway.
function makeSupabase(tables) {
  const writes = [];
  class Q {
    constructor(t) { this.t = t; this.f = []; this.ins = null; this.cols = null; }
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
    order() { return this; }
    limit() { return this; }
    not()   { this.f.push(['__notnull', true]); return this; }
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

const SIX = Array.from({ length: 6 }, (_, i) => ({ url: `https://x/${i}.jpg`, is_hero: i === 0 }));
const SIXURL = Array.from({ length: 6 }, (_, i) => `https://x/${i}.jpg`);

async function createWith(extra, tables = { demo_vendors: [] }) {
  const h = makeSupabase(tables);
  call._sb = h.supabase;
  const body = { ig_handle: 'a', display_name: 'A', category: 'makeup', city: 'Delhi', photos: SIX, ...extra };
  return { out: await call(freshRouter(), 'post', '/vendors', { body }), h };
}
async function bulkWith(demos, tables = { demo_vendors: [] }) {
  const h = makeSupabase(tables);
  call._sb = h.supabase;
  return { out: await call(freshRouter(), 'post', '/bulk', { body: { demos } }), h };
}
const brow = (extra) => ({
  ig_handle: 'a', display_name: 'A', category: 'makeup', city: 'Delhi',
  whatsapp_phone: null, photos: SIXURL, ...extra,
});

(async () => {

// ════════════════════════════════════════════════════════════════════════════
H('§1 · THE GATE ITSELF — IT REFUSES MALFORMED MONEY, IT NEVER REQUIRES MONEY');

const G = freshGate();

// §1.1 IS LOAD-BEARING FOR A SEALED BENCH. Nine of twelve production rows carry
// no rate; b08_p4_factory §3.2/§3.5 drive fixtures supplying neither column. A
// gate that refused emptiness would redden that bench and be wrong about the
// estate. §M.1 proves this cell is not vacuous.
for (const v of ['', '   ', null, undefined]) {
  ok(`§1.1 absence is LAWFUL and passes — ${JSON.stringify(v)} (rate)`, G.checkRateDisplay(v).ok === true);
  ok(`§1.1 absence is LAWFUL and passes — ${JSON.stringify(v)} (about)`, G.checkAbout(v).ok === true);
}

ok('§1.2 the console placeholder the founder is SHOWN passes its own gate',
  G.checkRateDisplay('Rs 50,000 – Rs 2,00,000').ok === true,
  'the placeholder at app/admin/demo/page.tsx (symbol: the Rate Display FieldInput) must be lawful');
ok('§1.3 grouped Indian money passes — two-digit lakh group',
  G.checkRateDisplay('Rs 1,00,000').ok === true);

eq('§1.4 the glyph is refused', G.checkRateDisplay('\u20B950,000').reason, G.REASONS.GLYPH);
eq('§1.5 K shorthand is refused', G.checkRateDisplay('Rs 50K').reason, G.REASONS.SHORTHAND);
eq('§1.6 L shorthand is refused', G.checkRateDisplay('2L').reason, G.REASONS.SHORTHAND);
eq('§1.7 Cr shorthand is refused', G.checkRateDisplay('1 crore').reason, G.REASONS.SHORTHAND);
eq('§1.8 the founder\'s own specimen — bare `50000` — is refused',
  G.checkRateDisplay('50000').reason, G.REASONS.UNGROUPED);
eq('§1.9 Western grouping is refused (the law is Indian grouping)',
  G.checkRateDisplay('Rs 100,000').reason, G.REASONS.GROUPING);

// The two modes, and the reason the split exists at all.
ok('§1.10 PROSE MODE: "We shoot in 4K" is a resolution, not four thousand rupees',
  G.checkAbout('We shoot in 4K').ok === true,
  'the prose mode exists to stop exactly this false refusal on a vendor-facing surface');
ok('§1.11 PROSE MODE: a year is four digits and passes',
  G.checkAbout('Established 2015').ok === true);
eq('§1.12 PROSE MODE: shorthand DOES fire once the text is money-marked',
  G.checkAbout('Packages from Rs 50K onwards').reason, G.REASONS.SHORTHAND);
eq('§1.13 PROSE MODE: the glyph is refused unconditionally, marker or not',
  G.checkAbout('Packages from \u20B950K onwards').reason, G.REASONS.GLYPH);
eq('§1.14 PROSE MODE: a bare five-digit run is refused unconditionally',
  G.checkAbout('50000').reason, G.REASONS.UNGROUPED);
ok('§1.15 MONEY MODE refuses shorthand with NO marker — the field IS money',
  G.checkRateDisplay('4K').ok === false);

// ════════════════════════════════════════════════════════════════════════════
H('§2 · THE SINGLE-CREATE DOOR');

{
  const { out, h } = await createWith({ rate_display: 'Rs 50K' });
  eq('§2.1 a shorthand rate is REFUSED 400', out.status, 400);
  eq('§2.2 with the ruled error KEY', out.body.error, 'rate_register');
  eq('§2.3 and the founder-frozen V2 bytes in `detail`',
    out.body.detail,
    'Rate must be written in full — Rs 50,000. No symbols, no K or L shorthand.');
  eq('§2.4 and NOTHING is written', h.writes.length, 0);
}
{
  const { out, h } = await createWith({ about: 'Packages from \u20B950K onwards' });
  eq('§2.5 a glyph in `about` is REFUSED 400', out.status, 400);
  eq('§2.6 with the ruled error KEY', out.body.error, 'about_register');
  eq('§2.7 and the founder-frozen V3 bytes in `detail`',
    out.body.detail,
    'About must write money in full — Rs 50,000. No symbols, no K or L shorthand.');
  eq('§2.8 and NOTHING is written', h.writes.length, 0);
}
{
  const { out, h } = await createWith({ rate_display: 'Rs 50,000', about: 'We shoot in 4K' });
  eq('§2.9 lawful money and ordinary prose BUILD', out.status, 200);
  eq('§2.10 the row is written', h.writes.length, 1);
  eq('§2.11 the typed bytes are stored VERBATIM — this gate rejects, never rewrites',
    h.writes[0].row.rate_display, 'Rs 50,000');
}
{
  const { out, h } = await createWith({});
  eq('§2.12 a row carrying NEITHER column builds — absence at the door', out.status, 200);
  eq('§2.13 and is written', h.writes.length, 1);
}
// THE SITING. Row-intrinsic before cross-row, and before the photo work.
{
  const { out } = await createWith({ rate_display: 'Rs 50K', photos: SIX.slice(0, 2) });
  eq('§2.14 SITING: a row failing BOTH the register and the photo floor reports the REGISTER',
    out.body.error, 'rate_register');
}

// ════════════════════════════════════════════════════════════════════════════
H('§3 · THE BULK DOOR — AND IT IS THE WALKABLE ONE');

{
  const { out, h } = await bulkWith([brow({ rate_display: 'Rs 50K' })]);
  eq('§3.1 the bulk route fires the SAME gate', out.body.failedCount, 1);
  eq('§3.2 with the same key', out.body.failed[0].error, 'rate_register');
  eq('§3.3 and the same V2 bytes, which is how the founder SEES them',
    out.body.failed[0].detail,
    'Rate must be written in full — Rs 50,000. No symbols, no K or L shorthand.');
  eq('§3.4 nothing written', h.writes.length, 0);
}
{
  // THE WALK STEP. Four columns, a bad rate, ZERO photo URLs — `handleBulk`
  // performs no photo pre-check, so this reaches the gate at the founder's own
  // hand without a single upload. The photo floor would ALSO refuse this row;
  // the register speaks first BY RULING, and that is what makes the step free.
  const { out } = await bulkWith([brow({ rate_display: '\u20B950,000', photos: [] })]);
  eq('§3.5 WALK STEP: a photoless paste with a bad rate refuses on the REGISTER',
    out.body.failed[0].error, 'rate_register');
}
{
  const { out } = await bulkWith([brow({ about: 'Packages from Rs 2L' })]);
  eq('§3.6 `about` is gated on the bulk path too', out.body.failed[0].error, 'about_register');
}
{
  // THE CROSS-ROW ORDER, celled so the ruling is not a preference.
  const { out } = await bulkWith([
    brow({ ig_handle: 'a', whatsapp_phone: '+919888294440', rate_display: 'Rs 50K' }),
    brow({ ig_handle: 'b', whatsapp_phone: '919888294440' }),
  ]);
  const a = out.body.failed.find(f => f.ig_handle === 'a');
  const b = out.body.failed.find(f => f.ig_handle === 'b');
  eq('§3.7 SITING: the row with a bad rate reports its OWN defect, not the batch\'s',
    a.error, 'rate_register');
  eq('§3.8 SITING: its lawful neighbour still reports the collision',
    b.error, 'shared_handset_in_batch');
}
{
  const { out, h } = await bulkWith([brow({ rate_display: 'Rs 1,00,000', about: 'Established 2015' })]);
  eq('§3.9 a lawful bulk row builds', out.body.insertedCount, 1);
  eq('§3.10 with its bytes verbatim', h.writes[0].row.rate_display, 'Rs 1,00,000');
}

// ════════════════════════════════════════════════════════════════════════════
H('§4 · F-08.47 — THE ASYMMETRY\'S MECHANISM, ALL THREE LEGS');
// Per NOTE_19 §6(g) this section asserts NO negative. It does not claim
// `shapeVendor.js` has no filter — an absence-cell passes honestly while
// something one layer up breaks it. It asserts a POSITIVE ARTIFACT: the gate
// module exists, its wired caller list is exactly one, and its header carries
// the reason the second caller was withheld.

const CALLERS = (() => {
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(js|ts)$/.test(e.name)) continue;
      const src = fs.readFileSync(p, 'utf8');
      if (/require\([^)]*moneyRegisterGate[^)]*\)|from\s+['"][^'"]*moneyRegisterGate['"]/.test(src)) {
        hits.push(path.relative(ROOT, p));
      }
    }
  };
  walk(SRC('src'));
  return hits.sort();
})();

// LEG 1 — the caller count, and the bench NAMES which caller, so a swap is
// caught as loudly as an addition.
eq('§4.1 the gate has EXACTLY ONE wired caller in src/', CALLERS.length, 1);
eq('§4.2 and it is the demo plane\'s door, by name', CALLERS[0], ADMIN);

// LEG 2 — the reason. A cell guarding the caller count without guarding the
// REASON is satisfied by a sitting that adds the caller and deletes the
// comment. F-06.85's shape, extended to a declared gap.
const gsrc = read(GATE);
ok('§4.3 the header names the finding', /F-08\.47/.test(gsrc));
ok('§4.4 the header carries the founder\'s word verbatim',
  gsrc.includes('\u300C demo plane only \u300D'));
ok('§4.5 the header carries the ruling\'s date', /2026-08-03/.test(gsrc));
ok('§4.6 the header names the CONSENT reason, not merely the fact',
  /written by THE VENDOR ABOUT THEMSELVES/.test(gsrc) && /consent/i.test(gsrc));
// §4.7 is the cell that caught this file's own author citing two symbols from
// memory (`EDITABLE_FIELDS`, `WEIGHTS`). It asserts the CITED symbol exists in
// the CITED file — a pointer that resolves, not a pointer that reads well.
{
  const cited = [...gsrc.matchAll(/(src\/[A-Za-z0-9_/.]+\.(?:js|ts)), symbol ([A-Za-z0-9_]+)/g)];
  ok('§4.7a the header cites the real plane\'s door and its scorer, by PATH + SYMBOL',
    cited.length >= 2);
  let allResolve = cited.length > 0;
  for (const [, file, sym] of cited) {
    const abs = SRC(file);
    if (!fs.existsSync(abs)) { allResolve = false; continue; }
    if (!new RegExp(`\\b${sym}\\b`).test(fs.readFileSync(abs, 'utf8'))) allResolve = false;
  }
  ok('§4.7b EVERY cited symbol RESOLVES in its cited file — a path fails loudly, a range does not',
    allResolve);
}

// LEG 3 — PATH-OVER-RANGE. A cross-file pointer in a durable comment cites a
// FILE PATH and a SYMBOL, never a line range.
ok('§4.8 no cross-file line range survives in the gate\'s header',
  !/[a-zA-Z0-9_]\.(?:js|ts|tsx)[`'"]?\s*:\s*\d/.test(gsrc),
  'PATH-OVER-RANGE: a range drifts silently while still reading correctly');
ok('§4.9 the same law holds for the wiring block in the door',
  !/moneyRegisterGate[^\n]*:\s*\d/.test(read(ADMIN)));

// The absence-cell REFUSED, recorded as a cell so the refusal is durable.
// NOTE_19 §6(g), recorded as a durable cell rather than a habit: this bench
// never READS the real plane's shaper. It asserts a positive artifact instead.
{
  // Comment-stripped: this file NAMES the real plane in prose (it must, to
  // record the refusal) but must never OPEN it. The distinction is the cell.
  const self = strip(fs.readFileSync(__filename, 'utf8'));
  ok('§4.10 this bench opens no file on the real plane — no absence is asserted',
    // The needles are assembled rather than written, so this cell does not
    // trip over its own literal — the check's failure mode was itself.
    !self.includes('shape' + 'Vendor') && !self.includes('vendor/' + 'me.js'),
    'an absence-cell passes honestly while something one layer up breaks it');
}

// ════════════════════════════════════════════════════════════════════════════
H('§5 · FORK 3(c) — THE INVITE SUBSET RIDES THE WIRE');

const demoLifecycle = require(SRC(LIFE));
{
  const h = makeSupabase({ demo_vendors: [], prospects: [] });
  call._sb = h.supabase;
  const out = await call(freshRouter(), 'get', '/vendors', {});
  ok('§5.1 the list payload carries `invite_states`', Array.isArray(out.body.invite_states));
  eq('§5.2 and it IS demoLifecycle.INVITE_STATES, not a re-typed literal',
    out.body.invite_states, demoLifecycle.INVITE_STATES.slice());
  ok('§5.3 `states` still rides beside it, unmoved', Array.isArray(out.body.states));
}
ok('§5.4 the route reads the frozen constant rather than authoring the subset',
  /invite_states:\s*demoLifecycle\.INVITE_STATES/.test(code(ADMIN)));
ok('§5.5 no hand-written invite subset survives in this route\'s code',
  !/\[\s*'(?:built|legacy)'\s*,\s*'(?:built|legacy)'\s*\]/.test(
    code(ADMIN).replace(/INVITE_STATES/g, '')));

// ════════════════════════════════════════════════════════════════════════════
H('§M · THE MUTATIONS — RED AT THE UNCURED TREE, PRODUCTION SOURCE ONLY');

// §M.1 is the one that matters most: it proves §1.1 is not vacuous. If the gate
// ever starts REQUIRING money, this cell is what says so — and b08_p4_factory
// would redden in the same breath.
await okMutate('§M.1 §1.1 reds if the gate starts REFUSING absence',
  GATE, "  if (text === '') return { ok: true };", "  if (text === '') return { ok: false, reason: REASONS.UNGROUPED };",
  async () => {
    const g = freshGate();
    assert.strictEqual(g.checkRateDisplay('').ok, true);
    assert.strictEqual(g.checkAbout(null).ok, true);
  }, '§1.1');

await okMutate('§M.2 §1.10 reds if prose mode stops requiring a money marker',
  GATE, '  const marked = prose === false || MONEY_MARK.test(text);', '  const marked = true;',
  async () => {
    const g = freshGate();
    assert.strictEqual(g.checkAbout('We shoot in 4K').ok, true);
  }, '§1.10');

await okMutate('§M.3 §1.4 reds if the glyph rule is removed',
  GATE, '  if (GLYPH.test(text)) return { ok: false, reason: REASONS.GLYPH };', '',
  async () => {
    const g = freshGate();
    assert.strictEqual(g.checkRateDisplay('\u20B950,000').reason, g.REASONS.GLYPH);
  }, '§1.4');

await okMutate('§M.4 §2.1 reds if the single-create door stops calling the gate',
  ADMIN,
  '  const reg = _registerGate(rate_display, about);\n  if (reg) return res.status(400).json({ ok: false, error: reg.error, detail: reg.detail });',
  '  const reg = null;\n  if (reg) return res.status(400).json({ ok: false, error: reg.error, detail: reg.detail });',
  async () => {
    const { out } = await createWith({ rate_display: 'Rs 50K' });
    assert.strictEqual(out.body.error, 'rate_register');
  }, '§2.1');

await okMutate('§M.5 §3.1 reds if the bulk door stops calling the gate',
  ADMIN,
  '    const reg = _registerGate(r.rate_display, r.about);\n    if (reg) { failed.push({ ig_handle, error: reg.error, detail: reg.detail }); continue; }',
  '    const reg = null;\n    if (reg) { failed.push({ ig_handle, error: reg.error, detail: reg.detail }); continue; }',
  async () => {
    const { out } = await bulkWith([brow({ rate_display: 'Rs 50K' })]);
    assert.strictEqual(out.body.failed[0].error, 'rate_register');
  }, '§3.1');

await okMutate('§M.6 §2.3 reds if V2\'s bytes drift by one character',
  GATE,
  "  'Rate must be written in full — Rs 50,000. No symbols, no K or L shorthand.';",
  "  'Rate must be written in full - Rs 50,000. No symbols, no K or L shorthand.';",
  async () => {
    const { out } = await createWith({ rate_display: 'Rs 50K' });
    assert.strictEqual(out.body.detail,
      'Rate must be written in full — Rs 50,000. No symbols, no K or L shorthand.');
  }, '§2.3');

await okMutate('§M.7 §5.2 reds if the route re-types the invite subset',
  ADMIN, '      invite_states: demoLifecycle.INVITE_STATES,', "      invite_states: ['built'],",
  async () => {
    const h = makeSupabase({ demo_vendors: [], prospects: [] });
    call._sb = h.supabase;
    const out = await call(freshRouter(), 'get', '/vendors', {});
    assert.deepStrictEqual(out.body.invite_states, require(SRC(LIFE)).INVITE_STATES.slice());
  }, '§5.2');

await okMutate('§M.8 §4.6 reds if the consent reason is deleted from the header',
  GATE, 'written by THE VENDOR ABOUT THEMSELVES', 'written elsewhere',
  async () => {
    assert.ok(/written by THE VENDOR ABOUT THEMSELVES/.test(read(GATE)) && /consent/i.test(read(GATE)));
  }, '§4.6');

// §M.9 is the SITING's own mutation. Move the gate back below the cross-row
// scan and §3.7 must redden — otherwise the ruled order is decorative.
await okMutate('§M.9 §3.7 reds if the register gate falls below the cross-row scan',
  ADMIN,
  '    const reg = _registerGate(r.rate_display, r.about);\n    if (reg) { failed.push({ ig_handle, error: reg.error, detail: reg.detail }); continue; }\n\n    const norm = rawPhone ? normalizeTo(rawPhone) : \'\';',
  '    const norm = rawPhone ? normalizeTo(rawPhone) : \'\';',
  async () => {
    const { out } = await bulkWith([
      brow({ ig_handle: 'a', whatsapp_phone: '+919888294440', rate_display: 'Rs 50K' }),
      brow({ ig_handle: 'b', whatsapp_phone: '919888294440' }),
    ]);
    const a = out.body.failed.find(f => f.ig_handle === 'a');
    assert.strictEqual(a.error, 'rate_register');
  }, '§3.7');

// ════════════════════════════════════════════════════════════════════════════
console.log(`\n══ b08_console_bench: ${pass} passed, ${fail} failed, 0 skipped ══\n`);
process.exit(fail === 0 ? 0 : 1);
})();
