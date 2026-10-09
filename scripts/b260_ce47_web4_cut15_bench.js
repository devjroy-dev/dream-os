// scripts/b260_ce47_web4_cut15_bench.js
// TDW · CE-47 · WEB-4 cut 15 · b260 — THE STARTER PACKAGES SAY NO "BRIDE" (the founder's rule, the chair's words).
// db/seeds/package_seeds.json, copied to a NEW vendor by src/lib/vendor/packageSeeds.js. §1 no seeded word a vendor
// receives says bride, bridal, couple or groom · §2 a new vendor's copied packages carry the new names · §3 an existing
// vendor's packages are untouched · §4 nothing else in the seeds moved · §5 mutations, run.
'use strict';
const fs = require('fs'); const path = require('path'); const Module = require('module'); const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
const WORD = /\b(bride|brides|bridal|couple|couples|groom|grooms)\b/i;
// THE SCAN: every word a vendor RECEIVES, the fields packageSeeds.js copies: name, description, line_items (label and
// detail). `source_name` is EXCLUDED: it is the option's name as written in the founder's source document, kept as that
// record (the chair's option 1). packageSeedParse.js reads it to pick each craft's default; it is never copied to a
// vendor and never shown.
const offenders = (j) => { const out = []; for (const c of j.categories) for (const o of c.options) {
  for (const f of [o.name, o.description || ''].concat((o.line_items || []).flatMap((li) => [li.label || '', li.detail || '']))) if (WORD.test(f)) out.push(`${c.category}: ${f}`); } return out; };
const J = JSON.parse(fs.readFileSync(P('db/seeds/package_seeds.json'), 'utf8'));
// The seeds as they stood at this cut's base (eb6b51c), pinned so the comparison holds after this cut lands too.
let BASE = null; try { BASE = JSON.parse(execSync('git show eb6b51c:db/seeds/package_seeds.json', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString()); } catch { /* no git: §4 reads red */ }

(async () => {
  sec('1  no seeded word a vendor receives says bride, bridal, couple or groom');
  ok(() => J.categories.length === 11 && offenders(J).length === 0, '1.1 eleven crafts; name, description and every line item clear (source_name excluded: the source document\'s record, never copied, never shown)', offenders(J).join(' | '));
  ok(() => J.categories.some((c) => c.options.some((o) => /BRIDE/.test(o.source_name || ''))), '1.2 source_name still holds the source document\'s words (kept, as ruled), so the default each craft takes is unchanged');

  sec('2  a new vendor\'s copied packages carry the new names');
  const S = require(P('src/lib/vendor/packageSeeds.js'));
  const names = (cat) => S.seedRowsFor('v-new', cat).map((r) => r.name);
  ok(() => JSON.stringify(names('makeup')) === JSON.stringify(['One function', 'Every function, with a trial', 'Wedding party makeup']), '2.1 makeup', JSON.stringify(names('makeup')));
  ok(() => JSON.stringify(names('hairstylist')) === JSON.stringify(['One function', 'Every function, with a trial', 'Wedding party hair']), '2.2 hairstylist', JSON.stringify(names('hairstylist')));
  ok(() => names('jewellery').includes('Wedding set made to order') && names('designer').includes('Wedding outfits made to order, as one set'), '2.3 jewellery and designer');
  const mk = S.seedRowsFor('v-new', 'makeup');
  ok(() => mk[0].line_items.find((l) => l.label === 'People').detail === 'you' && mk[2].line_items.find((l) => l.label === 'People').detail === 'you and up to 4 family members' && mk[0].line_items.find((l) => l.label === 'Arrival').detail === '3 hours before you must be ready' && /^We do your wedding makeup/.test(mk[0].description), '2.4 the line items and descriptions speak to "you", as the descriptions already did');
  ok(() => S.seedRowsFor('v-new', 'venue_catering').every((r) => r.line_items.every((l) => !/bridal room/.test(l.detail || ''))) && S.seedRowsFor('v-new', 'venue_catering').some((r) => r.line_items.some((l) => /getting-ready room/.test(l.detail || ''))), '2.5 the venue\'s room is a getting-ready room');
  const ins = []; const sbNew = { from: () => { const q = { select: () => q, eq: () => q, not: () => q, is: () => q, limit: () => Promise.resolve({ data: [], error: null }), insert: (rows) => { ins.push(...rows); return Promise.resolve({ error: null }); } }; return q; } };
  const r = await S.ensureSeeded(sbNew, { id: 'v-new', category: 'makeup' });
  ok(() => r.seeded === true && ins.length === 3 && offenders({ categories: [{ category: 'makeup', options: ins }] }).length === 0 && ins[1].name === 'Every function, with a trial', '2.6 ensureSeeded, driven for a new makeup artist: three packages, none with the word', JSON.stringify(r));

  sec('3  an existing vendor\'s packages are hers: untouched');
  const ins2 = []; const sbOld = { from: () => { const q = { select: () => q, eq: () => q, not: () => q, is: () => q, limit: () => Promise.resolve({ data: [{ id: 'pk1' }], error: null }), insert: (rows) => { ins2.push(...rows); return Promise.resolve({ error: null }); }, update: () => { ins2.push('UPDATE'); return q; } }; return q; } };
  const r2 = await S.ensureSeeded(sbOld, { id: 'v-old', category: 'makeup' });
  ok(() => r2.seeded === false && r2.reason === 'already_seeded' && ins2.length === 0, '3.1 a vendor already seeded: nothing inserted, nothing updated (her "Bride, one function" stays hers)', JSON.stringify(r2));
  // AMENDED BY LABEL · CE-47 server train 16 (the chair): the cell read only file NAMES, so CLB's 0221_ig_package_cards_gate.sql
  // (one capabilities row; it touches no package) read as a package rewrite. It now reads what each migration from 0194 on
  // DOES: none may insert into, update or delete from vendor_packages.
  ok(() => !fs.readdirSync(P('db/migrations')).filter((f) => /^019[4-9]|^02/.test(f) && /\.sql$/.test(f)).some((f) => /(update|delete\s+from|insert\s+into)\s+(public\.)?vendor_packages\b/i.test(fs.readFileSync(P('db/migrations/' + f), 'utf8'))), '3.2 no migration rewrites anyone\'s packages');

  sec('4  nothing else in the seeds moved');
  const strip = (j) => JSON.stringify(j, (k, v) => (['name', 'description', 'detail'].includes(k) ? undefined : v));
  ok(() => BASE && strip(BASE) === strip(J), '4.1 every field but name, description and line-item detail is byte-equal to the base eb6b51c (prices, splits, keys, defaults, source_name, labels)');
  const changed = []; if (BASE) BASE.categories.forEach((c, i) => c.options.forEach((o, k) => { const n = J.categories[i].options[k];
    if (o.name !== n.name) changed.push(o.name); if ((o.description || '') !== (n.description || '')) changed.push(o.description);
    o.line_items.forEach((l, m) => { if (l.detail !== n.line_items[m].detail) changed.push(l.detail); }); }));
  ok(() => changed.length > 0 && changed.every((f) => WORD.test(f)), '4.2 every changed field was one that said the word: no other copy touched', `${changed.length} fields`);

  sec('5  mutations, run');
  const M = JSON.parse(JSON.stringify(J)); M.categories.find((c) => c.category === 'makeup').options[0].line_items[0].detail = 'the bride';
  ok(() => offenders(M).length === 1, '5.1 one "the bride" put back in a line item: 1.1 reddens');
  const M2 = JSON.parse(JSON.stringify(J)); M2.categories.find((c) => c.category === 'jewellery').options[0].description = J.categories.find((c) => c.category === 'jewellery').options[0].description.replace('wedding set', 'bridal set');
  ok(() => offenders(M2).length === 1, '5.2 "bridal" put back in a description: 1.1 reddens (the word in any form)');

  console.log(`\nb260 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('  FAIL  the rung could not run: ' + (e && e.stack || e)); console.log(`\nb260 ${pass} passed, ${fail + 1} failed`); process.exit(1); });
