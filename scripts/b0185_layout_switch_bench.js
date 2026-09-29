#!/usr/bin/env node
'use strict';
// scripts/b0185_layout_switch_bench.js · DESIGN-1 · THE LAYOUT SWITCH (the founder, 29 Sept 2026).
// Holds: the flag is seeded OFF by 0185 (the switchboard's own grammar, kind flag, on conflict do nothing, written not
// applied); the one predicate home answers 'classic' for every vendor by default, 'v2' for a vendor the Railway list
// names, 'v2' for everyone once the flag is on, and 'classic' when the switchboard is unread; each vendor sees only HER
// setting's answer; GET /me carries it as `layout` from that home; the admin read door reports the default and the list
// from the same home. RED MUTATIONS: default 'v2' in layoutFor (§2.1 reds); read the list as a substring (§2.4 reds).
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

console.log('\n§2 the one predicate home');
const cap = require(path.join(ROOT, 'src/lib/capabilities'));
const L = require(path.join(ROOT, 'src/lib/vendorLayout'));
const A = 'vendor-a-111', B = 'vendor-b-222';
cap._prime([]);
ok('2.1 no row on the switchboard: every vendor reads classic', L.layoutFor(A, {}) === 'classic' && L.layoutFor(B, { LAYOUT_V2_VENDOR_IDS: '' }) === 'classic');
cap._prime([{ key: 'flag.vendor_layout_v2', kind: 'flag', status: 'off' }]);
ok('2.2 flag off, nobody listed: classic', L.layoutFor(A, { LAYOUT_V2_VENDOR_IDS: '' }) === 'classic');
const env = { LAYOUT_V2_VENDOR_IDS: ` ${A} , other-9 ` };
ok('2.3 flag off, A listed: A reads v2 and B still reads classic (each vendor sees only her own setting)', L.layoutFor(A, env) === 'v2' && L.layoutFor(B, env) === 'classic');
ok('2.4 the list is read by whole ids, never as a substring', L.layoutFor('vendor-a-11', env) === 'classic' && L.layoutFor('a', env) === 'classic');
cap._prime([{ key: 'flag.vendor_layout_v2', kind: 'flag', status: 'on' }]);
ok('2.5 flag on (the global default): every vendor reads v2, listed or not', L.layoutFor(A, {}) === 'v2' && L.layoutFor(B, {}) === 'v2');
cap._prime([{ key: 'flag.vendor_layout_v2', kind: 'flag', status: 'armed' }]);
ok('2.6 any status but on is not on (the switchboard’s rule)', L.layoutFor(B, {}) === 'classic');
cap._prime([]);
ok('2.7 a null vendor reads classic', L.layoutFor(null, env) === 'classic' && L.layoutFor(undefined, env) === 'classic');

console.log('\n§3 the wire');
const me = code('src/api/vendor/me.js');
ok('3.1 GET /me carries `layout` from the one home, and nowhere else decides it',
  /layout:\s+layoutFor\(vendor\.id\),/.test(me) && /require\('\.\.\/\.\.\/lib\/vendorLayout'\)/.test(me) && (me.match(/layoutFor\(/g) || []).length === 1);
const adm = code('src/api/admin/capabilities.js');
ok('3.2 the admin read door reports the default and the list from the same home, behind requireAdmin',
  /router\.get\('\/layout', requireAdmin,/.test(adm) && /cap\.on\(vendorLayout\.FLAG\)/.test(adm) && /process\.env\[vendorLayout\.ENV_LIST\]/.test(adm));
ok('3.3 the admin door is declared before the /:key routes, so /layout is never read as a key', adm.indexOf("router.get('/layout'") < adm.indexOf("router.post('/:key/flip'"));
const others = [];
(function walk(d) { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { const r = d + '/' + e.name; if (e.isDirectory()) walk(r); else if (/\.js$/.test(e.name) && r !== 'src/lib/vendorLayout.js' && /LAYOUT_V2_VENDOR_IDS|flag\.vendor_layout_v2/.test(code(r))) others.push(r); } })('src');
ok('3.4 no second home: the flag key and the variable are spelled only in src/lib/vendorLayout.js', others.length === 0, others.join(', '));

console.log(`\nb0185 layout switch: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
