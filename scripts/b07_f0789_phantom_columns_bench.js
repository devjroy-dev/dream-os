#!/usr/bin/env node
// scripts/b07_f0789_phantom_columns_bench.js
// F-a — THE PHANTOM COLUMN, AND ITS CLASS.
//
// ── WHY THIS IS A SWEEP AND NOT A CELL ───────────────────────────────────────
// The founder's screen 500'd on `column conversations.channel does not exist`.
// Curing that one word cures one screen. It does not cure the CLASS: a select
// naming a column its table does not have is refused WHOLE by Postgres, and
// nothing in this estate would have caught the next one either. So this bench
// validates EVERY `.from(table).select(...)` in src/api/** against the committed
// column witness, and reddens on any phantom.
//
// ── THE WITNESS, AND ITS DECLARED STALENESS ──────────────────────────────────
// docs/db/PUBLIC_SCHEMA.md is the STARTING witness; §10's SQL-provenance law
// names its regeneration as deferred since migration 0085. So a column absent
// from the doc is not automatically a phantom — this sweep ALSO reads
// db/migrations/*.sql for a later `ALTER TABLE ... ADD COLUMN`, and clears any
// column a migration added after the doc was cut. A hit here means: absent from
// the doc AND never added by the ladder.
//
// ── WHAT IS DELIBERATELY OUT OF SCOPE ────────────────────────────────────────
// `.schema('engine')` queries. The engine schema is a SEPARATE plane with its
// own witness (docs/db/ENGINE_SCHEMA.md) and its own column lists — public's
// `messages` has 17 columns, engine's has 6, and confusing them is the exact
// two-plane error ENGINE_SCHEMA.md:23 was written to prevent. Validating engine
// selects against the public witness would manufacture false phantoms, which is
// worse than no cell. Named here rather than silently skipped.
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const R    = p => path.join(ROOT, p);

let pass = 0, fail = 0;
const ok  = (n, c) => { if (c) { pass++; console.log(`  PASS  ${n}`); } else { fail++; console.log(`  FAIL  ${n}`); } };
const sec = t => console.log(`\n${t}`);

// ── Build the column witness ────────────────────────────────────────────────
function publicSchema() {
  const txt = fs.readFileSync(R('docs/db/PUBLIC_SCHEMA.md'), 'utf8');
  const out = {};
  const re  = /^## public\.(\w+)\s*·\s*\d+ columns\s*\n\n```\n([\s\S]*?)```/gm;
  let m;
  while ((m = re.exec(txt))) {
    const cols = new Set();
    for (const line of m[2].split('\n')) {
      const c = line.match(/^\s*\d+\.\s+(\w+)\s/);
      if (c) cols.add(c[1]);
    }
    out[m[1]] = cols;
  }
  return out;
}

function migrationText() {
  const dir = R('db/migrations');
  return fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()
    .map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
}

function jsFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') jsFiles(p, out); }
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const SCHEMA = publicSchema();
const MIGS   = migrationText();

function addedByLadder(table, col) {
  return new RegExp(`ALTER TABLE\\s+(?:public\\.)?${table}\\s+ADD COLUMN[^;]*\\b${col}\\b`, 'i').test(MIGS);
}

// Returns every phantom (table, column) across the API surface.
function sweep() {
  const hits = [];
  for (const f of jsFiles(R('src/api'))) {
    const src = fs.readFileSync(f, 'utf8');
    // Any identifier assigned from `.schema('engine')` is an engine-plane
    // receiver. A fixed byte-window lookback MISSED this (the assignment sits
    // ~10 lines above the query) and manufactured two false phantoms against
    // engine.messages — caught by running the sweep, not by re-reading it.
    const engineVars = new Set([...src.matchAll(/(?:const|let|var)\s+(\w+)\s*=[^;]*\.schema\(\s*'engine'\s*\)/g)].map(x => x[1]));
    // The receiver may sit on its own line (`supabase\n  .from('x')`), so the gap
    // is matched explicitly. The first draft required them adjacent and silently
    // found ZERO — a sweep that matches nothing is a green that proves nothing,
    // caught by §3.3 refusing to acquit on an empty result set.
    // ── THE INTERMEDIATE-CALL GAP, found by mutation N-3 and closed ──────────
    // The first two drafts required `.select(` to sit IMMEDIATELY after
    // `.from('x')`. But this estate routinely writes `.from('x').update(...)
    // .select(...)` and `.from('x').insert({...}).select(...)` — and every one
    // of those selects was INVISIBLE to the sweep. A mutation planting a phantom
    // at api/vendor/me.js:229 (an `.update().select()` chain) left the bench at
    // 19/19 GREEN. That is the hollow-green class inside the very bench built to
    // prevent it, caught only by running the mutation and not by re-reading.
    // The receiver-to-select span now tolerates intervening chained calls, and
    // stops at the next `.from(` so two queries can never bleed together.
    const re  = /(\w+)\s*\n?\s*\.from\('(\w+)'\)((?:(?!\.from\()[\s\S]){0,400}?)\.select\(\s*([`'"])([\s\S]*?)\4/g;
    let m;
    while ((m = re.exec(src))) {
      const [, recv, table, , , body] = m;
      if (!SCHEMA[table]) continue;                               // table not in the public witness
      if (engineVars.has(recv)) continue;                         // the two-plane exclusion, stated above
      if (/\.schema\(\s*'engine'\s*\)/.test(src.slice(Math.max(0, m.index - 220), m.index))) continue;
      const embeds  = new Set([...body.matchAll(/(\w+)\s*\(/g)].map(x => x[1]));
      const aliases = new Set([...body.matchAll(/(\w+)\s*:\s*\w+\s*\(/g)].map(x => x[1]));
      const flat    = body.replace(/\w+\s*\([^()]*(?:\([^()]*\)[^()]*)*\)/g, '');
      for (let col of flat.split(',')) {
        col = col.trim().split(':')[0].trim();
        if (!col || col === '*' || !/^\w+$/.test(col)) continue;
        if (embeds.has(col) || aliases.has(col)) continue;
        if (SCHEMA[table].has(col)) continue;
        if (addedByLadder(table, col)) continue;
        hits.push({ file: path.relative(ROOT, f), line: src.slice(0, m.index).split('\n').length, table, col });
      }
    }
  }
  return hits;
}

sec('§1 · THE WITNESS LOADS, AND IS NOT EMPTY (vacuity guard)');
{
  ok(`§1.1 the public witness parses (${Object.keys(SCHEMA).length} tables)`, Object.keys(SCHEMA).length > 50);
  ok('§1.2 conversations is in the witness', !!SCHEMA['conversations']);
  ok(`§1.3 conversations has exactly TWELVE columns (the number the cure rests on)`,
     SCHEMA['conversations'].size === 12);
  ok('§1.4 CANARY: a column that DOES exist is recognised', SCHEMA['conversations'].has('kind'));
  ok('§1.5 CANARY: `channel` is genuinely absent from conversations', !SCHEMA['conversations'].has('channel'));
  ok('§1.6 CANARY: `channel` DOES exist on messages — the field list was copied across',
     !!SCHEMA['messages'] && SCHEMA['messages'].has('channel'));
  ok('§1.7 the migration ladder loads (the staleness escape hatch is real)', MIGS.length > 10000);
}

sec('§2 · F-a — THE SITE');
{
  const src = fs.readFileSync(R('src/api/admin/conversations.js'), 'utf8');
  const vendorsSelect = src.slice(src.indexOf("router.get('/vendors'"), src.indexOf("router.get('/brides'"));
  ok('§2.1 the vendors select no longer names `channel`', !/\bchannel\b/.test(vendorsSelect.split('.select(')[1].split('`')[1] || ''));
  ok('§2.2 the vendors select still names the columns the screen renders',
     ['id', 'kind', 'state', 'last_message_at', 'created_at'].every(c => vendorsSelect.includes(c)));
  // RE-AIMED (labeled): the first draft scanned from the brides route to EOF and
  // convicted the `/:id/messages` route below it, which selects `channel` off
  // `messages` — where the column legitimately lives. Scoped to the brides
  // select body. Subject unchanged.
  const bridesSelect = src.slice(src.indexOf("router.get('/brides'"), src.indexOf("router.get('/:id/messages'"));
  ok('§2.3 the brides sibling is untouched and still green by construction',
     !/\bchannel\b/.test(bridesSelect.split('.select(')[1].split('`')[1] || ''));
  ok('§2.4b the messages route KEEPS `channel` — it is a real column there (non-vacuity of §2.3)',
     /channel/.test(src.slice(src.indexOf("router.get('/:id/messages'"))));
  ok('§2.4 F-06.85: the cure names the mechanism it rests on, with its witness',
     /PUBLIC_SCHEMA\.md:190-205/.test(src) && /does\n\/\/ not exist/.test(src));
}

sec('§3 · THE CLASS — no phantom column anywhere on the API surface');
{
  // ── THE DECLARED-OPEN LIST (floor-method law: skipped items NAMED, never
  // silently green). The sweep found a SECOND live phantom of this exact class
  // on a COUPLE-FACING surface, outside this micro's charter. It is reported,
  // not cured, and not papered: it sits here by name so it cannot be forgotten,
  // and §3.2 asserts the list does not grow.
  //
  // src/api/couple/discover.js:515 selects `name` and `routing_handle` off
  // `discover_heroes`. Migration 0044 creates that table with SEVEN columns and
  // neither is among them; no later ALTER adds them; and the admin router that
  // WRITES heroes (api/admin/discoverHeroes.js:15,32) never touches either.
  // The select therefore errors, and the handler's `if (!error && heroes...)`
  // falls silently through to its fallback — so every hero the founder uploads
  // has been invisible to couples, with no error anywhere. CHARTER IT.
  const DECLARED_OPEN = new Set([
    'discover_heroes.name',
    'discover_heroes.routing_handle',
  ]);

  const hits = sweep();
  for (const h of hits) {
    const key = `${h.table}.${h.col}`;
    console.log(`         ${DECLARED_OPEN.has(key) ? 'DECLARED-OPEN' : 'PHANTOM'}: ${h.file}:${h.line}  ${key}`);
  }
  const undeclared = hits.filter(h => !DECLARED_OPEN.has(`${h.table}.${h.col}`));
  ok(`§3.1 zero UNDECLARED phantom columns in src/api/** (found ${undeclared.length})`, undeclared.length === 0);
  ok(`§3.2 the declared-open list has not grown (${hits.length} total, ${DECLARED_OPEN.size} declared)`,
     hits.length === DECLARED_OPEN.size);
  ok('§3.3 NON-VACUITY: the sweep still SEES the declared-open pair — it is excluded by name, never by blindness',
     hits.some(h => h.col === 'routing_handle'));
}

sec('§4 · NON-VACUITY — the sweep can actually see a phantom');
{
  // A synthetic select is fed through the same matcher the sweep uses. If this
  // finds nothing, §3.1's green means the sweep is blind, not that the tree is
  // clean — the hollow-green class, guarded at its own door.
  const probe = `.from('conversations')\n    .select(\`id, kind, definitely_not_a_column\`)`;
  const embeds = new Set();
  const body   = probe.match(/\.select\(\s*`([\s\S]*?)`/)[1];
  const seen   = body.split(',').map(c => c.trim()).filter(c => !SCHEMA['conversations'].has(c) && !embeds.has(c));
  ok('§4.1 the matcher extracts a select body', body.includes('definitely_not_a_column'));
  ok('§4.2 the comparison convicts a column absent from the witness',
     seen.includes('definitely_not_a_column'));
  ok('§4.3 …and acquits the two that are present', !seen.includes('id') && !seen.includes('kind'));
  ok('§4.4 the ladder escape hatch does NOT acquit a fabricated column',
     !addedByLadder('conversations', 'definitely_not_a_column'));
}

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
process.exit(fail === 0 ? 0 : 1);
