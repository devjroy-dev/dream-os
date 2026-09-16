#!/usr/bin/env node
'use strict';
// scripts/b81_lc2_p1_seed_bench.js — TDW CE-43 · LC-2 · packet 1 · the seed, the read, the ladder.
// Runnable from any working directory (Q-SP-5). Exit 0 green, 1 red, 2 bench error.
//
// WHAT THIS BENCH DRIVES
//   §1  db/seeds/package_seeds.json equals a fresh parse of db/seeds/package_seeds.source.txt
//       (the founder-vetoed block, R-43.10) through the ONE parser, and carries the ruled shape:
//       eleven categories in the taxonomy's order, 33 options, the ruled default per category
//       (F-43.54), the delivery basis from each section's own line (F-43.51).
//   §2  ensureSeeded (src/lib/vendor/packageSeeds.js) over an in-memory double of the
//       supabase-js builder: seeds once, never again (live or deleted), nothing for a null or
//       unmapped category, no default when one is live, the 23505 race reads as seeded.
//   §3  GET /api/v2/vendor/packages (src/api/vendor/packages.js), the real router, driven
//       through its own handler stack with auth stubbed: seeds on first read, lists live rows
//       in vetoed order, stays up when seeding fails.
//   §4  the mount in src/api/vendor/core.js.
//   §5  the two migrations carry every ruled statement (text cells; the DDL was applied twice on
//       PGlite and every constraint proven both ways at the cut, recorded in the handover).
//   §6  column existence against docs/db/PUBLIC_SCHEMA.md (R-40.80). RED until the regen that
//       rides this packet lands; that red is the regen's own witness.
//   §7  mutations of PRODUCTION code, compiled in memory under their real paths.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-dummy-key';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);

let pass = 0, fail = 0;
const fails = [];
const sec = (s) => console.log(`\n── ${s} ──`);
function ok(cond, name) {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; fails.push(name); console.log(`  FAIL ${name}`); }
}
const tryRequire = (rel) => { try { return require(P(rel)); } catch (e) { console.log(`  (require ${rel} failed: ${e.message.split('\n')[0]})`); return null; } };
const readIf = (rel) => (fs.existsSync(P(rel)) ? fs.readFileSync(P(rel), 'utf8') : '');
const loadMutated = (rel, from, to) => {
  const file = P(rel);
  if (!fs.existsSync(file)) return { missing: true };
  const srcText = fs.readFileSync(file, 'utf8');
  if (!srcText.includes(from)) return { missing: true };
  try {
    const m = new Module(file, module);
    m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
    m._compile(srcText.replace(from, to), file);
    return { mod: m.exports };
  } catch (e) { console.log(`  (mutated ${rel} did not load: ${e.message.split('\n')[0]})`); return { failed: true }; }
};

// ── the vetoed bytes, pinned. A source edit is a founder veto act (R-43.10); re-pin with it. ──
const SOURCE_SHA256 = '91c21e187ccb5016898c0a8efa886060c3ee4c537f517aa498e4a49ee8d94be1';

const TAXONOMY = ['planning', 'designer', 'photography', 'makeup', 'hairstylist', 'jewellery', 'decor', 'venue_catering', 'performer', 'content_creator', 'other'];
const COUNTS = { planning: 3, designer: 3, photography: 3, makeup: 3, hairstylist: 3, jewellery: 3, decor: 3, venue_catering: 4, performer: 3, content_creator: 3, other: 2 };
const RULED_DEFAULT = {
  planning: 'PARTIAL PLANNING', designer: 'ONE OUTFIT MADE TO ORDER', photography: 'PHOTOGRAPHS AND FILM',
  makeup: 'BRIDE, EVERY FUNCTION WITH A TRIAL', hairstylist: 'BRIDE, EVERY FUNCTION WITH A TRIAL',
  jewellery: 'RENTAL SETS, EVERY FUNCTION', decor: 'MAIN FUNCTIONS', venue_catering: 'VENUE AND CATERING, ONE FUNCTION',
  performer: null, content_creator: 'WEDDING DAY WITH SAME-DAY REELS', other: 'ONE FUNCTION',
};
const RULED_DELIVERY = {
  planning: ['on_the_day', null], designer: ['handover', null], photography: ['days', 45], makeup: ['on_the_day', null],
  hairstylist: ['on_the_day', null], jewellery: ['handover', null], decor: ['on_the_day', null],
  venue_catering: ['on_the_day', null], performer: ['on_the_day', null], content_creator: ['days', 14], other: ['on_the_day', null],
};

// ── an in-memory double of the supabase-js query builder, just wide enough for these doors ──
function makeDb(seedRows = [], opts = {}) {
  const tables = { vendor_packages: seedRows.map((r) => ({ ...r })) };
  const calls = { inserts: 0 };
  let nextId = 1;
  function builder(table) {
    const st = { table, filters: [], op: 'select', rows: null, limit: null };
    const b = {
      select() { return b; },
      eq(col, v) { st.filters.push((r) => r[col] === v); return b; },
      is(col, v) { st.filters.push((r) => (v === null ? r[col] == null : r[col] === v)); return b; },
      not(col, opx, v) { if (opx === 'is' && v === null) st.filters.push((r) => r[col] != null); return b; },
      limit(n) { st.limit = n; return b; },
      insert(rows) { st.op = 'insert'; st.rows = Array.isArray(rows) ? rows : [rows]; return b; },
      then(resolve, reject) { return Promise.resolve(run()).then(resolve, reject); },
    };
    function run() {
      const t = tables[st.table] || (tables[st.table] = []);
      if (st.op === 'insert') {
        calls.inserts++;
        if (opts.insertError) return { data: null, error: opts.insertError };
        // uq_vendor_packages_seed, enforced the way the database does it: the whole batch or nothing.
        for (const r of st.rows) {
          if (r.seeded_from && t.some((x) => x.vendor_id === r.vendor_id && x.seeded_from === r.seeded_from)) {
            return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "uq_vendor_packages_seed"' } };
          }
        }
        const live = st.rows.filter((r) => r.is_default);
        if (live.length > 1 || (live.length && t.some((x) => x.vendor_id === live[0].vendor_id && x.is_default && x.deleted_at == null))) {
          return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "uq_vendor_packages_default"' } };
        }
        // One stamp per INSERT, as Postgres gives a multi-row insert one now().
        const stamp = `2026-09-17T00:00:${String(calls.inserts).padStart(2, '0')}Z`;
        for (const r of st.rows) t.push({ id: `p${nextId++}`, deleted_at: null, created_at: stamp, updated_at: stamp, ...r });
        return { data: null, error: null };
      }
      if (opts.readError && st.table === 'vendor_packages') return { data: null, error: opts.readError };
      let out = t.filter((r) => st.filters.every((f) => f(r)));
      // A read with no ORDER BY promises no order: the double hands rows back reversed, so only
      // the door's own ordering can put them in the vetoed order.
      out = out.reverse();
      if (st.limit != null) out = out.slice(0, st.limit);
      return { data: out.map((r) => ({ ...r })), error: null };
    }
    return b;
  }
  return { from: builder, tables, calls };
}

const VENDOR = { id: '23165e38-6510-4639-ab6a-9f35bab93742', category: 'photography' };

async function seedCells(lib) {
  const r = {};
  try {
    const db = makeDb();
    const a = await lib.ensureSeeded(db, VENDOR);
    const rows = db.tables.vendor_packages;
    r.first = a.seeded === true && a.count === 3 && rows.length === 3;
    r.names = rows.map((x) => x.name).join('|') === 'Photographs|Photographs and film|Photographs, film and album';
    r.oneDefault = rows.filter((x) => x.is_default).map((x) => x.name).join('|') === 'Photographs and film';
    r.shape = rows.every((x) => x.total === null && x.deposit_pct === 30 && x.middle_pct === 30 && x.middle_enabled === true
      && x.delivery_basis === 'days' && x.delivery_days === 45 && /^photography:[123]$/.test(x.seeded_from));
    r.items = rows[0].line_items.length === 5 && rows[0].line_items[0].label === 'Functions covered' && rows[0].line_items[0].detail === '1 function';
    const b = await lib.ensureSeeded(db, VENDOR);
    r.second = b.seeded === false && b.reason === 'already_seeded' && db.tables.vendor_packages.length === 3 && db.calls.inserts === 1;
    for (const x of db.tables.vendor_packages) x.deleted_at = '2026-09-17T01:00:00Z';
    const c = await lib.ensureSeeded(db, VENDOR);
    r.deletedNotReseeded = c.seeded === false && c.reason === 'already_seeded' && db.calls.inserts === 1;

    const dn = makeDb();
    const n1 = await lib.ensureSeeded(dn, { id: 'v2', category: null });
    const n2 = await lib.ensureSeeded(dn, { id: 'v3', category: 'mehendi' });
    r.noCategory = n1.reason === 'no_category' && n2.reason === 'unmapped_category' && dn.calls.inserts === 0;
    const later = await lib.ensureSeeded(dn, { id: 'v2', category: 'other' });
    r.laterCategorySeeds = later.seeded === true && later.count === 2;

    const dp = makeDb([]);
    const perf = await lib.ensureSeeded(dp, { id: 'v4', category: 'performer' });
    r.performerNoDefault = perf.seeded === true && dp.tables.vendor_packages.every((x) => x.is_default === false);

    const dd = makeDb([{ id: 'own', vendor_id: 'v5', name: 'Mine', is_default: true, seeded_from: null, deleted_at: null }]);
    const d = await lib.ensureSeeded(dd, { id: 'v5', category: 'decor' });
    r.liveDefaultKept = d.seeded === true && dd.tables.vendor_packages.filter((x) => x.is_default).map((x) => x.id).join() === 'own';

    const race = makeDb([{ id: 'x', vendor_id: 'v6', name: 'One function', is_default: false, seeded_from: 'other:1', deleted_at: '2026-09-17T00:00:00Z' }]);
    // the fast-path read is bypassed to model a racing reader that saw nothing
    const raceDb = { from: (t) => { const bb = race.from(t); const origNot = bb.not; bb.not = (...a) => { origNot(...a); bb.eq('id', '__nobody__'); return bb; }; return bb; } };
    const rr = await lib.ensureSeeded(raceDb, { id: 'v6', category: 'other' });
    r.race = rr.seeded === false && rr.reason === 'already_seeded' && race.tables.vendor_packages.length === 1;

    const de = makeDb([], { readError: { message: 'boom' } });
    const e1 = await lib.ensureSeeded(de, VENDOR);
    r.readFailWritesNothing = e1.reason === 'read_failed' && de.calls.inserts === 0;
  } catch (e) { r.err = e.message; }
  return r;
}

// Drive the real router: find the GET '/' layer and run its stack with auth stubbed.
async function routeCall(router, db, vendor) {
  const layer = router.stack.find((l) => l.route && l.route.path === '/' && l.route.methods.get);
  if (!layer) throw new Error('no GET / route');
  const handlers = layer.route.stack.map((s) => s.handle);
  const final = handlers[handlers.length - 1];
  const req = { app: { locals: { supabase: db } }, vendor, params: {}, query: {} };
  let body = null, status = 200;
  const res = { status(s) { status = s; return res; }, json(b) { body = b; return res; } };
  await new Promise((resolve, reject) => {
    const r = final(req, res, (e) => (e ? reject(e) : resolve()));
    Promise.resolve(r).then(() => setImmediate(resolve), reject);
  });
  return { status, body };
}

async function routeCells(router) {
  const r = {};
  try {
    const db = makeDb();
    const a = await routeCall(router, db, VENDOR);
    r.firstRead = a.status === 200 && a.body.ok === true && a.body.packages.length === 3 && a.body.seeding.seeded === true;
    r.order = a.body.packages.map((p) => p.seeded_from).join() === 'photography:1,photography:2,photography:3';
    r.defaultMarkedNotMoved = a.body.packages[1].is_default === true && a.body.packages[0].is_default === false;
    db.tables.vendor_packages[0].deleted_at = '2026-09-17T02:00:00Z';
    db.tables.vendor_packages.push({ id: 'mine', vendor_id: VENDOR.id, name: 'My own', seeded_from: null, is_default: false, deleted_at: null, created_at: '2026-09-17T03:00:00Z' });
    db.tables.vendor_packages.push({ id: 'other', vendor_id: 'someone-else', name: 'Not hers', seeded_from: null, is_default: false, deleted_at: null, created_at: '2026-09-17T03:00:00Z' });
    const b = await routeCall(router, db, VENDOR);
    r.liveOnlyHersOnly = b.body.packages.map((p) => p.id).join() === `${db.tables.vendor_packages[1].id},${db.tables.vendor_packages[2].id},mine`
      && b.body.seeding.seeded === false && b.body.seeding.reason === 'already_seeded';
    const f = makeDb([], { insertError: { code: 'XX000', message: 'insert broke' } });
    const c = await routeCall(router, f, VENDOR);
    r.failSoft = c.status === 200 && c.body.ok === true && Array.isArray(c.body.packages) && c.body.seeding.reason === 'insert_failed';
  } catch (e) { r.err = e.message; }
  return r;
}

async function main() {
  const parse = tryRequire('src/lib/vendor/packageSeedParse.js');
  const seeds = tryRequire('src/lib/vendor/packageSeeds.js');
  const router = tryRequire('src/api/vendor/packages.js');
  const srcPath = P('db/seeds/package_seeds.source.txt');
  const jsonPath = P('db/seeds/package_seeds.json');
  const src = fs.existsSync(srcPath) ? fs.readFileSync(srcPath, 'utf8') : '';
  const json = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf8')) : null;

  sec('§1 — the seed file is the vetoed block, parsed one way');
  ok(crypto.createHash('sha256').update(src).digest('hex') === SOURCE_SHA256, '§1.0 the source bytes equal the pinned vetoed block');
  let parsed = null;
  try { parsed = parse ? parse.parseSeedSource(src) : null; } catch (e) { console.log(`  (parse threw: ${e.message})`); }
  ok(!!parsed && !!json && JSON.stringify(parsed) === JSON.stringify(json.categories), '§1.1 package_seeds.json equals a fresh parse of the source');
  const cats = json ? json.categories : [];
  const full = cats.length === 11; // guards every per-category cell against a vacuous green on an empty set
  ok(JSON.stringify(cats.map((c) => c.category)) === JSON.stringify(TAXONOMY), '§1.2 eleven categories in the taxonomy order');
  const { VENDOR_CATEGORIES } = require(P('src/agent/categories'));
  ok(JSON.stringify(VENDOR_CATEGORIES) === JSON.stringify(TAXONOMY), '§1.3 the taxonomy this bench pins is the estate\'s (categories.js)');
  ok(full && cats.every((c) => c.options.length === COUNTS[c.category]) && cats.reduce((s, c) => s + c.options.length, 0) === 33, '§1.4 33 options, per-category counts as vetoed');
  ok(full && cats.every((c) => {
    const d = c.options.filter((o) => o.is_default).map((o) => o.source_name);
    return RULED_DEFAULT[c.category] === null ? d.length === 0 : (d.length === 1 && d[0] === RULED_DEFAULT[c.category]);
  }), '§1.5 the ruled default per category (F-43.54), none for performer');
  ok(full && cats.every((c) => c.delivery_basis === RULED_DELIVERY[c.category][0] && c.delivery_days === RULED_DELIVERY[c.category][1]),
    '§1.6 delivery basis from each section\'s own line (F-43.51)');
  ok(full && cats.every((c) => c.schedule_line.startsWith('Deposit, 30% of the fee, on booking · 30% one month before the first function (optional) · The remainder, on delivery, before the work is handed over'))
    && cats.filter((c) => c.schedule_line.endsWith('For this work, delivery is the handover date, which falls before the wedding.')).map((c) => c.category).join() === 'designer,jewellery',
    '§1.7 the ruled schedule wording on all eleven; the handover sentence on designer and jewellery only');
  ok(full && cats.every((c) => c.options.every((o) => o.line_items.length > 0 && o.line_items.every((li) => li.label && li.detail && src.includes(`  ${li.label}: ${li.detail}\n`)))),
    '§1.8 every line item is a verbatim "label: detail" line of the source');
  ok(full && cats.every((c) => c.options.every((o) => src.includes(`\n${o.source_name}\n${o.description}\n`))), '§1.9 every source name and description is verbatim, capitals kept in source_name');
  ok(full && cats.every((c) => c.options.every((o) => o.name.toLowerCase() === o.source_name.toLowerCase()
      && o.name.charAt(0) === o.source_name.charAt(0) && (o.name === o.source_name || o.name.slice(1) !== o.source_name.slice(1)))),
    '§1.11 C-43.15: every name is its source name in sentence case (case only, no other byte)');
  {
    const perf = cats.find((c) => c.category === 'performer');
    const photo = cats.find((c) => c.category === 'photography');
    ok(!!perf && perf.options.map((o) => o.name).join('|') === 'Anchor, one function|DJ, one function|Choreography for the sangeet'
      && !!photo && photo.options.map((o) => o.name).join('|') === 'Photographs|Photographs and film|Photographs, film and album',
      '§1.12 C-43.15: DJ stays an acronym; the photography names read as ruled');
  }
  ok(src.includes('\nANCHOR, ONE FUNCTION\nI host your function from start to finish.'), '§1.10 the Anchor option keeps its "I" voice');

  sec('§2 — ensureSeeded: once per vendor, ever');
  const s = seeds ? await seedCells(seeds) : { err: 'no packageSeeds' };
  if (s.err) console.log(`  (${s.err})`);
  ok(s.first === true, '§2.1 first read seeds the vendor\'s three photography options');
  ok(s.names === true, '§2.2 names in sentence case (C-43.15), vetoed order');
  ok(s.oneDefault === true, '§2.3 exactly one default, the middle one');
  ok(s.shape === true, '§2.4 no fee, 30/30 on, 45 days, seed keys photography:1..3');
  ok(s.items === true, '§2.5 line items carried as {label, detail}');
  ok(s.second === true, '§2.6 a second read seeds nothing');
  ok(s.deletedNotReseeded === true, '§2.7 every seed deleted → still never re-seeded');
  ok(s.noCategory === true, '§2.8 a null or unmapped category seeds nothing');
  ok(s.laterCategorySeeds === true, '§2.9 a vendor first seen without a category seeds once it is set');
  ok(s.performerNoDefault === true, '§2.10 performer seeds with no default (the partial index permits zero)');
  ok(s.liveDefaultKept === true, '§2.11 a live default already held stays the only default');
  ok(s.race === true, '§2.12 a racing reader that loses the unique index reports already_seeded and writes nothing');
  ok(s.readFailWritesNothing === true, '§2.13 a failed read writes nothing');

  sec('§3 — GET /api/v2/vendor/packages');
  const rc = router ? await routeCells(router) : { err: 'no router' };
  if (rc.err) console.log(`  (${rc.err})`);
  ok(rc.firstRead === true, '§3.1 the first read seeds and returns three packages');
  ok(rc.order === true, '§3.2 vetoed order');
  ok(rc.defaultMarkedNotMoved === true, '§3.3 the default is marked, not moved');
  ok(rc.liveOnlyHersOnly === true, '§3.4 only her live rows; her own rows after the seeds');
  ok(rc.failSoft === true, '§3.5 a seeding failure still returns the list (fail-soft)');

  sec('§4 — the mount');
  {
    const core = readIf('src/api/vendor/core.js').replace(/\/\/.*$/gm, '');
    ok(/router\.use\('\/packages',\s*require\('\.\/packages'\)\)/.test(core), "§4.1 core.js mounts './packages' at '/packages'");
  }

  sec('§5 — the two migrations carry the ruled statements');
  {
    const m7 = readIf('db/migrations/0167_leads_binder_link.sql').replace(/--.*$/gm, '');
    const m8 = readIf('db/migrations/0168_vendor_packages.sql').replace(/--.*$/gm, '');
    ok(/ALTER TABLE public\.leads\s+ADD COLUMN IF NOT EXISTS binder_id uuid;/.test(m7) && !/REFERENCES/i.test(m7), '§5.1 0167 adds leads.binder_id with no foreign key');
    ok(/CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_binder_id\s+ON public\.leads \(binder_id\)\s+WHERE binder_id IS NOT NULL;/.test(m7), '§5.2 0167 unique index includes deleted rows (F1)');
    ok(/CREATE TABLE IF NOT EXISTS public\.vendor_packages/.test(m8) && /delivery_basis IN \('on_the_day', 'days', 'handover'\)/.test(m8)
      && /vendor_packages_remainder_positive/.test(m8) && /vendor_packages_days_pairing/.test(m8), '§5.3 0168 vendor_packages with the three bases, the remainder and pairing CHECKs');
    ok(/uq_vendor_packages_default\s+ON public\.vendor_packages \(vendor_id\)\s+WHERE is_default AND deleted_at IS NULL/.test(m8), '§5.4 one live default per vendor');
    ok(/uq_vendor_packages_seed\s+ON public\.vendor_packages \(vendor_id, seeded_from\)\s+WHERE seeded_from IS NOT NULL/.test(m8), '§5.5 seeded once per vendor, ever (F-43.70)');
    ok(/CREATE TABLE IF NOT EXISTS public\.lead_packages[\s\S]*vendor_id\s+uuid\s+NOT NULL[\s\S]*quote_draft_id\s+uuid\s+REFERENCES public\.pending_couple_drafts\(id\)/.test(m8)
      && !/quote_wamid/.test(m8), '§5.6 lead_packages carries vendor_id and quote_draft_id, no wamid column');
    ok(/uq_lead_packages_live\s+ON public\.lead_packages \(lead_id\)\s+WHERE deleted_at IS NULL/.test(m8), '§5.7 one live package per lead');
    ok(/ALTER TABLE public\.invoices\s+ADD COLUMN IF NOT EXISTS lead_package_id uuid REFERENCES public\.lead_packages\(id\) ON DELETE SET NULL/.test(m8)
      && /uq_invoices_lead_package\s+ON public\.invoices \(lead_package_id\)\s+WHERE lead_package_id IS NOT NULL AND deleted_at IS NULL/.test(m8), '§5.8 the one-invoice guard');
    ok(/ALTER TABLE public\.contracts\s+ADD COLUMN IF NOT EXISTS lead_package_id uuid/.test(m8), '§5.9 contracts.lead_package_id added (LC-3 reads it)');
    ok(m8 && m7 && (m8.match(/;\s*$/gm) || []).length === 9 && (m7.match(/;\s*$/gm) || []).length === 2, '§5.10 statement counts: 0167 two, 0168 nine');
  }

  sec('§6 — columns this packet names exist in the witnessed doc (R-40.80; red until the regen lands)');
  {
    const pub = fs.readFileSync(P('docs/db/PUBLIC_SCHEMA.md'), 'utf8');
    const section = (doc, head) => { const i = doc.indexOf(head); if (i < 0) return ''; const j = doc.indexOf('\n## ', i + head.length); return doc.slice(i, j < 0 ? undefined : j); };
    const has = (sc, col) => new RegExp(`^\\d+\\. ${col} `, 'm').test(sc);
    ok(has(section(pub, '## public.leads '), 'binder_id'), '§6.1 public.leads.binder_id witnessed');
    ok(['id', 'vendor_id', 'name', 'description', 'line_items', 'total', 'deposit_pct', 'middle_pct', 'middle_enabled', 'delivery_basis', 'delivery_days', 'is_default', 'seeded_from', 'created_at', 'updated_at', 'deleted_at']
      .every((c) => has(section(pub, '## public.vendor_packages '), c)), '§6.2 public.vendor_packages witnessed whole');
    ok(['id', 'vendor_id', 'lead_id', 'package_id', 'snapshot', 'total', 'schedule', 'delivery_on', 'quoted_at', 'quote_draft_id', 'deleted_at']
      .every((c) => has(section(pub, '## public.lead_packages '), c)), '§6.3 public.lead_packages witnessed whole');
    ok(has(section(pub, '## public.invoices '), 'lead_package_id') && has(section(pub, '## public.contracts '), 'lead_package_id'), '§6.4 invoices and contracts carry lead_package_id');
    ok(/uq_vendor_packages_seed/.test(pub) && /uq_invoices_lead_package/.test(pub) && /uq_leads_binder_id/.test(pub), '§6.5 the three guard indexes witnessed');
  }

  sec('§7 — mutations of production code turn their cells red');
  {
    const m1 = loadMutated('src/lib/vendor/packageSeedParse.js', "'PHOTOGRAPHY & VIDEOGRAPHY': 'PHOTOGRAPHS AND FILM'", "'PHOTOGRAPHY & VIDEOGRAPHY': 'PHOTOGRAPHS'");
    let red = false;
    if (m1.mod && json) { const p2 = m1.mod.parseSeedSource(src); red = JSON.stringify(p2) !== JSON.stringify(json.categories); }
    ok(red, '§7 M1 the photography default moved → §1.1 RED');

    const m2 = loadMutated('src/lib/vendor/packageSeedParse.js', "{ delivery_basis: 'days', delivery_days: Number(m[1]) }", "{ delivery_basis: 'on_the_day', delivery_days: null }");
    red = false;
    if (m2.mod && json) { const p2 = m2.mod.parseSeedSource(src); red = JSON.stringify(p2) !== JSON.stringify(json.categories); }
    ok(red, '§7 M2 "days after" read as the event date → §1.1 RED');

    const m8 = loadMutated('src/lib/vendor/packageSeedParse.js', "const KEEP_UPPER = Object.freeze(['DJ']);", 'const KEEP_UPPER = Object.freeze([]);');
    red = false;
    if (m8.mod && json) { const p2 = m8.mod.parseSeedSource(src); red = p2.find((c) => c.category === 'performer').options[1].name !== 'DJ, one function'; }
    ok(red, '§7 M8 the acronym keep-list emptied → §1.12 RED (Dj, one function)');

    const m9 = loadMutated('src/lib/vendor/packageSeedParse.js', 'name: sentenceCase(o.name),', 'name: o.name,');
    red = false;
    if (m9.mod && json) { const p2 = m9.mod.parseSeedSource(src); red = JSON.stringify(p2) !== JSON.stringify(json.categories); }
    ok(red, '§7 M9 the case normalisation removed → §1.1 RED');

    const m3 = loadMutated('src/lib/vendor/packageSeeds.js', "if (prior && prior.length) return { seeded: false, reason: 'already_seeded' };", '');
    red = false;
    if (m3.mod) { const c = await seedCells(m3.mod); red = c.deletedNotReseeded !== true || c.second !== true; }
    ok(red, '§7 M3 the once-ever read removed → §2.6/§2.7 RED (the index alone still refuses; the reason is the tell)');

    const m4 = loadMutated('src/lib/vendor/packageSeeds.js', "if (insErr.code === '23505') return { seeded: false, reason: 'already_seeded' };", '');
    red = false;
    if (m4.mod) { const c = await seedCells(m4.mod); red = c.race !== true; }
    ok(red, '§7 M4 the 23505 branch removed → §2.12 RED');

    const m5 = loadMutated('src/lib/vendor/packageSeeds.js', '? rows.map((r) => ({ ...r, is_default: false }))', '? rows');
    red = false;
    if (m5.mod) { const c = await seedCells(m5.mod); red = c.liveDefaultKept !== true; }
    ok(red, '§7 M5 the live-default guard removed → §2.11 RED');

    const m6 = loadMutated('src/api/vendor/packages.js', ".eq('vendor_id', vendor.id)\n    .is('deleted_at', null);", ".eq('vendor_id', vendor.id);");
    red = false;
    if (m6.mod) { const c = await routeCells(m6.mod); red = c.liveOnlyHersOnly !== true; }
    ok(red, '§7 M6 the deleted_at filter dropped from the read → §3.4 RED');

    const m7 = loadMutated('src/api/vendor/packages.js', '    if (ia !== ib) return ia - ib;\n', '');
    red = false;
    if (m7.mod) { const c = await routeCells(m7.mod); red = c.liveOnlyHersOnly !== true || c.order !== true; }
    ok(red, '§7 M7 the vetoed order dropped → §3.2/§3.4 RED');
  }

  console.log(`\n════════  ${pass} passed, ${fail} failed  ════════\n`);
  if (fail) { console.log('RED. Failing checks:'); fails.forEach((f) => console.log('   ·', f)); process.exit(1); }
}

main().catch((e) => { console.error('BENCH ERROR', e); process.exit(2); });
