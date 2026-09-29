#!/usr/bin/env node
'use strict';
// scripts/d1_layout_master_bench.js · DESIGN-1 · THE SWITCHES (the founder and the chair).
// Holds, against an in-memory switchboard driven through the real src/lib/capabilities.js:
//   · MASTER OFF: only the vendors LAYOUT_V2_VENDOR_IDS names see the new layout; everyone else, today's;
//   · MASTER ON ("New layout for everyone"): every vendor sees it, listed or not; OFF again returns everyone but the list;
//   · the date the master was FIRST turned on is recorded once (flag.vendor_layout_v2.first_on's flipped_at) and shown
//     with the date the classic layout is kept until (+30 days); a later off and on keeps the first date;
//   · the admin doors: the master has its own (POST /layout/master), the generic flip of the master goes through the
//     same home, and the first-on row cannot be flipped by hand.
// RED MUTATIONS, one per claim: the list ignored; the flag ignored; the date never recorded; the date recorded again.
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let pass = 0, fail = 0;
const ok = (name, c, why) => { if (c) { pass++; console.log(`  GREEN  ${name}`); } else { fail++; console.log(`  RED    ${name}${why ? ' — ' + why : ''}`); } };

// the switchboard table, in memory: the rows 0185 seeds
function store() {
  const rows = new Map([
    ['flag.vendor_layout_v2', { key: 'flag.vendor_layout_v2', kind: 'flag', status: 'off', evidence: 'seed', checked_at: null, flipped_at: '2026-09-29T00:00:00.000Z', flipped_by: 'seed', auto_on: false, walk_ref: null, updated_at: null }],
    ['flag.vendor_layout_v2.first_on', { key: 'flag.vendor_layout_v2.first_on', kind: 'flag', status: 'off', evidence: 'seed', checked_at: null, flipped_at: null, flipped_by: 'seed', auto_on: false, walk_ref: null, updated_at: null }],
  ]);
  const from = () => {
    let where = null, patch = null;
    const q = {
      select: () => q, order: () => q,
      eq: (c, v) => { where = [c, v]; return q; },
      update: (p) => { patch = p; return q; },
      maybeSingle: () => Promise.resolve({ data: where ? (rows.get(where[1]) ? { ...rows.get(where[1]) } : null) : null, error: null }),
      then: (res, rej) => {
        if (patch) { const r = rows.get(where[1]); if (r) Object.assign(r, patch); return Promise.resolve({ data: null, error: null }).then(res, rej); }
        return Promise.resolve({ data: [...rows.values()].map((r) => ({ ...r })), error: null }).then(res, rej);
      },
    };
    return q;
  };
  return { rows, sb: { from } };
}

function loadLayout(src) {
  const file = path.join(ROOT, 'src/lib/vendorLayout.js');
  const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
  m._compile(src, file);
  return m.exports;
}
const cap = require(path.join(ROOT, 'src/lib/capabilities'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const A = 'vendor-a-111', B = 'vendor-b-222';
const ENV = { LAYOUT_V2_VENDOR_IDS: A };

async function scenario(src) {
  const L = loadLayout(src);
  const st = store(); const o = { supabase: st.sb };
  cap._resetCapabilitiesCache(); await cap.refresh(o);
  const out = {};
  out.offA = L.layoutFor(A, ENV); out.offB = L.layoutFor(B, ENV);
  out.before = await L.masterState(o);
  await L.setMaster('on', 'admin:bench', o);
  out.onA = L.layoutFor(A, ENV); out.onB = L.layoutFor(B, ENV);
  out.first = await L.masterState(o);
  await sleep(15);
  await L.setMaster('off', 'admin:bench', o);
  out.off2A = L.layoutFor(A, ENV); out.off2B = L.layoutFor(B, ENV);
  out.off2 = await L.masterState(o);
  await sleep(15);
  await L.setMaster('on', 'admin:bench', o);
  out.second = await L.masterState(o);
  cap._resetCapabilitiesCache();
  return out;
}
const plus30 = (iso) => new Date(Date.parse(iso) + 30 * 86400000).toISOString().slice(0, 10);

const CELLS = {
  '1.1': ['1.1 master OFF: the per-vendor list sees the new layout, everyone else today’s', (o) => o.offA === 'v2' && o.offB === 'classic'],
  '1.2': ['1.2 master ON ("New layout for everyone"): every vendor, listed or not', (o) => o.onA === 'v2' && o.onB === 'v2'],
  '1.3': ['1.3 master OFF again: back to today’s layout for everyone except the per-vendor list', (o) => o.off2A === 'v2' && o.off2B === 'classic' && o.off2.on === false],
  '2.1': ['2.1 before the first ON there is no date', (o) => o.before.first_on_at === null && o.before.classic_kept_until === null && o.before.on === false],
  '2.2': ['2.2 the first ON records its date, and the classic layout is kept until 30 days after it', (o) => !!o.first.first_on_at && o.first.on === true && o.first.classic_kept_until === plus30(o.first.first_on_at)],
  '2.3': ['2.3 the date is recorded once: off and on again keeps the first date (and it stays shown while off)', (o) => !!o.first.first_on_at && o.second.first_on_at === o.first.first_on_at && o.off2.first_on_at === o.first.first_on_at],
};

(async () => {
  const SRC = read('src/lib/vendorLayout.js');
  console.log('\n§1 the master and the per-vendor list  ·  §2 the 30 days');
  const real = await scenario(SRC);
  for (const [, [name, f]] of Object.entries(CELLS)) ok(name, f(real), JSON.stringify(real).slice(0, 240));

  console.log('\n§3 the doors and the seed');
  const doors = read('src/api/admin/capabilities.js');
  ok('3.1 the master has its own door, and it answers with what the panel shows', /router\.post\('\/layout\/master', requireAdmin/.test(doors) && /vendorLayout\.setMaster\(to, whoFlipped\(req\), \{ supabase \}\)/.test(doors) && /master: await vendorLayout\.masterState/.test(doors));
  ok('3.2 the generic flip of the master goes through the same home (the date is kept either way)', /key === vendorLayout\.FLAG \? await vendorLayout\.setMaster\(/.test(doors));
  ok('3.3 the first-on row cannot be flipped by hand', /if \(key === vendorLayout\.FIRST_ON\) return errRes\(res, 409, 'recorded_once'\);/.test(doors));
  ok('3.4 GET /layout carries the master’s state beside the list', /vendor_ids: ids, master \}/.test(doors));
  const mig = read('db/migrations/0185_vendor_layout_flag.sql');
  ok('3.5 0185 seeds both rows off, never overwriting a flipped row (written, not applied)', /\('flag\.vendor_layout_v2', 'flag', 'off',/.test(mig) && /\('flag\.vendor_layout_v2\.first_on', 'flag', 'off',/.test(mig) && (mig.match(/on conflict \(key\) do nothing;/g) || []).length === 2);
  ok('3.6 the removal is never automatic: nothing in src reads the kept-until date to act', !fs.readdirSync(path.join(ROOT, 'src'), { recursive: true }).filter((f) => /\.js$/.test(f) && !/vendorLayout\.js$/.test(f) && !/admin[\\/]capabilities\.js$/.test(f)).some((f) => /classic_kept_until|FIRST_ON/.test(read('src/' + f))));

  console.log('\n§4 mutations (each must turn its cell red)');
  const MUT = [
    ['4.1 the per-vendor list ignored → 1.1 RED', SRC.replace("return listed(vendorId, env) ? 'v2' : 'classic';", "return 'classic';"), '1.1'],
    ['4.2 the master ignored → 1.2 RED', SRC.replace("if (cap.on(FLAG)) return 'v2';", ''), '1.2'],
    ['4.3 the first ON never recorded → 2.2 RED', SRC.replace("if (mark && mark.status !== 'on') await cap.flip(FIRST_ON, 'on', by, opts);", ''), '2.2'],
    ['4.4 the date recorded again on every ON → 2.3 RED', SRC.replace("if (mark && mark.status !== 'on') await cap.flip(FIRST_ON, 'on', by, opts);", "if (mark) await cap.flip(FIRST_ON, 'on', by, opts);"), '2.3'],
  ];
  for (const [name, src, target] of MUT) {
    if (src === SRC) { ok(name, false, 'the mutation did not apply'); continue; }
    const o = await scenario(src);
    ok(name, !CELLS[target][1](o));
  }
  console.log(`\n${fail ? 'RED' : 'GREEN'} — d1 layout master ${pass}/${pass + fail}`);
  process.exit(fail ? 1 : 0);
})();
