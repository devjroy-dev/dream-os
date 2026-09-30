#!/usr/bin/env node
'use strict';
// scripts/b0185_layout_switch_bench.js · DESIGN-1 · THE LAYOUT SWITCH (the founder, 29 Sept 2026).
// Holds: the flag is seeded OFF by 0185 (the switchboard's own grammar, kind flag, on conflict do nothing, written not
// applied); the one predicate home answers 'classic' for every vendor by default, 'v2' for a vendor whose row carries
// layout_v2 = true (CE-46 F3, ONE HOME; 0185 §3), 'v2' for everyone once the flag is on, and 'classic' when the
// switchboard is unread; each vendor sees only HER row's answer; GET /me carries it as `layout` from that home; the admin
// doors read and write the list through the same home; LAYOUT_V2_VENDOR_IDS is read nowhere.
// RED MUTATIONS (--mutate): M1 default 'v2' (§2.1); M2 the row read truthy (§2.4); M3 the id guard dropped (§4.3);
// M4 the variable read again (§3.4).
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const code = (rel) => read(rel).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1 ');
let pass = 0, fail = 0;
const ok = (name, c, why) => { if (c) { pass++; console.log(`  GREEN  ${name}`); } else { fail++; console.log(`  RED    ${name}${why ? ' — ' + why : ''}`); } };

console.log('\n§1 the seed');
const mig = read('db/migrations/0185_vendor_layout_flag.sql');
ok('1.1 0185 seeds flag.vendor_layout_v2 as a flag, OFF, and never overwrites a flipped row',
  /\('flag\.vendor_layout_v2', 'flag', 'off',/.test(mig) && /on conflict \(key\) do nothing;/.test(mig));
const ladder = fs.readdirSync(path.join(ROOT, 'db/migrations')).filter((f) => /^\d{4}_/.test(f)).sort();
ok('1.2 0185 is the one migration this cut adds, and no other file takes its number', ladder.filter((f) => f.startsWith('0185_')).length === 1);

console.log('\n§1b the column');
ok('1.3 0185 adds vendors.layout_v2, boolean, not null, default false, additive (if not exists)',
  /alter table public\.vendors\s+add column if not exists layout_v2 boolean not null default false;/.test(mig));
ok('1.4 0185 carries a verify block and a commented revert for the column', /-- VERIFY/.test(mig) && /-- alter table public\.vendors drop column if exists layout_v2;/.test(mig));

console.log('\n§2 the one predicate home');
const cap = require(path.join(ROOT, 'src/lib/capabilities'));
const MUTS = process.argv.includes('--mutate');
const LSRC = read('src/lib/vendorLayout.js');
function loadL(src) {
  const Module = require('module'); const file = path.join(ROOT, 'src/lib/vendorLayout.js');
  const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file)); m._compile(src, file); return m.exports;
}
const A = { id: 'aaaaaaaa-0000-4000-8000-000000000001', layout_v2: true };
const B = { id: 'bbbbbbbb-0000-4000-8000-000000000002', layout_v2: false };
const C = { id: 'cccccccc-0000-4000-8000-000000000003' };                       // a row read before 0185: no column
function cells2(L) {
  const r = {};
  cap._prime([]);
  r['2.1'] = L.layoutFor(B) === 'classic' && L.layoutFor(C) === 'classic';
  cap._prime([{ key: 'flag.vendor_layout_v2', kind: 'flag', status: 'off' }]);
  r['2.2'] = L.layoutFor(B) === 'classic' && L.layoutFor(C) === 'classic';
  r['2.3'] = L.layoutFor(A) === 'v2' && L.layoutFor(B) === 'classic';
  r['2.4'] = ['true', 1, 'yes', {}].every((v) => L.layoutFor({ id: 'x', layout_v2: v }) === 'classic');
  cap._prime([{ key: 'flag.vendor_layout_v2', kind: 'flag', status: 'on' }]);
  r['2.5'] = L.layoutFor(A) === 'v2' && L.layoutFor(B) === 'v2' && L.layoutFor(C) === 'v2';
  cap._prime([{ key: 'flag.vendor_layout_v2', kind: 'flag', status: 'armed' }]);
  r['2.6'] = L.layoutFor(B) === 'classic';
  cap._prime([]);
  r['2.7'] = L.layoutFor(null) === 'classic' && L.layoutFor(undefined) === 'classic' && L.layoutFor('aaaaaaaa-0000-4000-8000-000000000001') === 'classic';
  return r;
}
const N2 = {
  '2.1': 'no row on the switchboard: a vendor off the list, and a row without the column, read classic',
  '2.2': 'flag off, nobody listed: classic',
  '2.3': 'flag off, A on the list (her row): A reads v2 and B still reads classic (each vendor sees only her own row)',
  '2.4': 'only a real true counts: \'true\', 1, \'yes\' and an object on the row read classic',
  '2.5': 'flag on (the global default): every vendor reads v2, listed or not, column or not',
  '2.6': 'any status but on is not on (the switchboard\u2019s rule)',
  '2.7': 'a null vendor reads classic, and so does a bare id (the home takes the row)',
};
const real2 = cells2(require(path.join(ROOT, 'src/lib/vendorLayout')));
for (const k of Object.keys(N2)) ok(`${k} ${N2[k]}`, real2[k]);

console.log('\n§3 the wire');
const me = code('src/api/vendor/me.js');
ok('3.1 GET /me carries `layout` from the one home on her whole row, and nowhere else decides it',
  /layout:\s+layoutFor\(vendor\),/.test(me) && /require\('\.\.\/\.\.\/lib\/vendorLayout'\)/.test(me) && (me.match(/layoutFor\(/g) || []).length === 1);
ok('3.1b her own PATCH can never set it: layout_v2 is not among /me\u2019s writable fields', !/layout_v2/.test(me));
const adm = code('src/api/admin/capabilities.js');
ok('3.2 the admin read door reports the default and the list from the same home, behind requireAdmin',
  /router\.get\('\/layout', requireAdmin,/.test(adm) && /cap\.on\(vendorLayout\.FLAG\)/.test(adm) && /vendorLayout\.listVendors\(\{ supabase \}\)/.test(adm));
ok('3.3 the admin doors are declared before the /:key routes, so /layout is never read as a key',
  adm.indexOf("router.get('/layout'") < adm.indexOf("router.post('/:key/flip'") && adm.indexOf("router.post('/layout/vendor'") < adm.indexOf("router.post('/:key/flip'"));
function others() {
  const out = [];
  (function walk(d) { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { const r = d + '/' + e.name; if (e.isDirectory()) walk(r); else if (/\.js$/.test(e.name) && r !== 'src/lib/vendorLayout.js' && /LAYOUT_V2_VENDOR_IDS|flag\.vendor_layout_v2|layout_v2/.test(code(r))) out.push(r); } })('src');
  return out;
}
const o3 = others();
ok('3.4 no second home: the flag key and the column are spelled only in src/lib/vendorLayout.js', o3.length === 0, o3.join(', '));
const retired = (src) => !/LAYOUT_V2_VENDOR_IDS|process\.env/.test(src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1 '));
ok('3.5 the Railway variable is retired: the home reads no environment at all', retired(LSRC));

console.log('\n§4 the list, written and read through the home');
function fakeVendors(rows) {
  const t = rows.map((r) => ({ ...r }));
  return { t, supabase: { from: (tbl) => {
    let filt = [], patch = null;
    const q = {
      select: () => q, order: () => q,
      eq: (c, v) => { filt.push([c, v]); return q; },
      update: (p) => { patch = p; return q; },
      then: (res, rej) => {
        const hit = t.filter((r) => filt.every(([c, v]) => r[c] === v));
        if (patch) { hit.forEach((r) => Object.assign(r, patch)); return Promise.resolve({ data: hit.map((r) => ({ id: r.id })), error: null }).then(res, rej); }
        return Promise.resolve({ data: hit.map((r) => ({ id: r.id, business_name: r.business_name, users: { name: null, phone: r.phone } })), error: null }).then(res, rej);
      },
    };
    if (tbl !== 'vendors') throw new Error('only vendors: ' + tbl);
    return q;
  } } };
}
async function cells4(L) {
  const r = {};
  const f = fakeVendors([{ id: A.id, business_name: 'Asha', phone: '9000000001', layout_v2: false }, { id: B.id, business_name: 'Bina', phone: '9000000002', layout_v2: false }]);
  const empty = await L.listVendors({ supabase: f.supabase });
  r['4.1'] = empty.ok && empty.vendors.length === 0;
  const add = await L.setVendor(A.id, true, { supabase: f.supabase });
  const one = await L.listVendors({ supabase: f.supabase });
  r['4.2'] = add.ok && one.vendors.length === 1 && one.vendors[0].id === A.id && one.vendors[0].name === 'Asha' && f.t[1].layout_v2 === false;
  const bad = await Promise.all([L.setVendor('not-a-uuid', true, f), L.setVendor(A.id + ' or 1=1', true, f), L.setVendor(B.id, 'true', f)]);
  r['4.3'] = bad.every((x) => !x.ok) && f.t[1].layout_v2 === false;
  const ghost = await L.setVendor('dddddddd-0000-4000-8000-000000000004', true, { supabase: f.supabase });
  r['4.4'] = !ghost.ok && ghost.reason === 'no_vendor';
  const rm = await L.setVendor(A.id, false, { supabase: f.supabase });
  const none = await L.listVendors({ supabase: f.supabase });
  r['4.5'] = rm.ok && none.vendors.length === 0 && f.t[0].layout_v2 === false;
  return r;
}
const N4 = {
  '4.1': 'the list starts empty',
  '4.2': 'Add writes her row alone and the list shows her by name',
  '4.3': 'a bad id or a non-boolean writes nothing',
  '4.4': 'an id with no vendor is refused as no_vendor',
  '4.5': 'Remove takes her off, and the list is empty again',
};
(async () => {
  const real4 = await cells4(require(path.join(ROOT, 'src/lib/vendorLayout')));
  for (const k of Object.keys(N4)) ok(`${k} ${N4[k]}`, real4[k]);
  ok('4.6 the vendor door: behind requireAdmin, through setVendor, answering with the list', /router\.post\('\/layout\/vendor', requireAdmin,/.test(adm) && /vendorLayout\.setVendor\(body\.vendor_id, body\.on, \{ supabase \}\)/.test(adm) && /okRes\(res, \{ vendors: list\.vendors \}\)/.test(adm));

  if (MUTS) {
    console.log('\n§M mutations (each must turn its cell red)');
    const M = [
      ['M1 default v2 in layoutFor → 2.1 RED', LSRC.replace("vendor[COLUMN] === true ? 'v2' : 'classic'", "vendor[COLUMN] === true ? 'v2' : 'v2'"), async (L) => !cells2(L)['2.1']],
      ['M2 the row read truthy → 2.4 RED', LSRC.replace('vendor[COLUMN] === true', 'vendor[COLUMN]'), async (L) => !cells2(L)['2.4']],
      ['M3 the id guard dropped → 4.3 RED', LSRC.replace("if (typeof vendorId !== 'string' || !UUID.test(vendorId)) return { ok: false, reason: 'bad_vendor_id' };\n  if (on !== true && on !== false) return { ok: false, reason: 'bad_on' };", ''), async (L) => !(await cells4(L))['4.3']],
      ['M4 the variable read again → 3.5 RED', LSRC.replace("return vendor && typeof vendor", "if (String(process.env.LAYOUT_V2_VENDOR_IDS || '').includes(String(vendor && vendor.id))) return 'v2';\n    return vendor && typeof vendor"), async (_L, src) => !retired(src)],
    ];
    for (const [name, src, red] of M) {
      if (src === LSRC) { ok(name, false, 'the mutation did not apply'); continue; }
      ok(name, await red(loadL(src), src));
    }
  }
  console.log(`\nb0185 layout switch: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
