'use strict';
// scripts/b89_lcv_p4b_bench.js · TDW CE-44 · LCV-1 · LC-Victor P4b, THE ENGINE-BORN WRITE HANDS' RESULT. Rung b89.
//
// WHAT IT HOLDS (the chair's conditions on P4b, under its W-1 lift):
//  §1 handResult.js: the eighteen write-hand names each carry a CLOSED, frozen code set read line by line from
//     recordPrimitives.ts and donnaLead.ts at 85fda3d, and name no line; fromOutcome() is TOTAL; the fuzz table
//     runs over every hand.
//  §2 the lift's scope, read from P4b's OWN manifest (C-44.7 (b)): under src/engine/src/ exactly snapshotTypes.ts,
//     tools/recordPrimitives.ts and tools/donnaLead.ts; never loop.ts or donna.ts; no soul, lens or other engine
//     file; the door side exactly handResult.js, this bench, the manifest and the handover.
//  §3 DISPLAY BYTE-IDENTICAL: every removed line in the three engine files reappears as an added line identical
//     once the `result:` key is taken out. Measured on the FIXED range 85fda3d..<the commit that added this bench>
//     once that commit exists (C-44.7 (a)); before it exists, on the manifest's three engine paths (C-44.7 (b)).
//  §4 DRIVEN, PER HAND, ON THE COMPILED ENGINE: each hand called through executeRecordTool / executeDonnaLead with
//     the same fake database at BASE (85fda3d, built from git into a cache) and NEW (the commit that added this
//     bench once it exists, else this tree's built engine): the displays are IDENTICAL, and the new outcome carries
//     a result that handResult.fromOutcome() reads to a code in that hand's closed set.
//  §5 mutations, each reddening the cell that guards it.
// THE EXIT CODE IS THE VERDICT.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const BASE = '85fda3dc1af715a004f6acdf26ceb3d8b2beaddc';
const SELF = 'scripts/b89_lcv_p4b_bench.js';
const MAN = 'scripts/floor-manifest-ce44-lcv1-p4b.txt';
const ENGINE3 = ['src/engine/src/core/snapshotTypes.ts', 'src/engine/src/core/tools/recordPrimitives.ts', 'src/engine/src/core/tools/donnaLead.ts'];
let pass = 0; let fail = 0; const failed = [];
function T(name, cond) { if (cond) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}`); } }
const sec = (t) => console.log(`\n§${t}`);
const quiet = async (fn) => { const w = console.warn; const e = console.error; console.warn = () => {}; console.error = () => {}; try { return await fn(); } finally { console.warn = w; console.error = e; } };
const sh = (c) => execSync(c, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const hasCommit = (sha) => { try { sh(`git cat-file -e ${sha}^{commit}`); return true; } catch (_e) { return false; } };
function compile(rel, code) {
  const file = P(rel); const m = new Module(file, null);
  m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file)); m._compile(code, file); return m.exports;
}
const mutated = (rel, pairs) => { let c = fs.readFileSync(P(rel), 'utf8'); for (const [a, b] of pairs) { if (!c.includes(a)) throw new Error(`anchor missing: ${a.slice(0, 60)}`); c = c.replace(a, b); } return compile(rel, c); };

// The commit that added this bench is P4b's own commit once it exists: fixed history from then on.
let P4B = '';
try { P4B = sh(`git log --diff-filter=A --format=%H -- ${SELF}`).trim().split('\n').filter(Boolean).pop() || ''; } catch (_e) { P4B = ''; }

// Build the engine at a fixed commit into a cache directory (git archive, then tsc with this tree's modules).
function engineAt(sha) {
  const dir = path.join(os.tmpdir(), `b89-engine-${sha.slice(0, 12)}`);
  const probe = path.join(dir, 'src/engine/dist/core/tools/recordPrimitives.js');
  if (!fs.existsSync(probe)) {
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    execSync(`git archive ${sha} src/engine | tar -x -C ${JSON.stringify(dir)}`, { cwd: ROOT, stdio: 'ignore', shell: '/bin/bash' });
    fs.symlinkSync(P('node_modules'), path.join(dir, 'node_modules'), 'dir');
    execSync(`node ${JSON.stringify(P('node_modules/typescript/bin/tsc'))} -p ${JSON.stringify(path.join(dir, 'src/engine/tsconfig.json'))}`, { cwd: dir, stdio: 'ignore' });
  }
  return path.join(dir, 'src/engine/dist/core');
}
function load(distCore) {
  return { db: require(path.join(distCore, 'db.js')), rp: require(path.join(distCore, 'tools/recordPrimitives.js')), dl: require(path.join(distCore, 'tools/donnaLead.js')) };
}

// A small in-memory database: enough of the query builder for writeFields, the cases and the owner lookup.
const SEED = {
  records: [
    { id: 'b-1', agent_id: 'ag-1', client: 'Meera', amount: 80000, direction: 'in', date: '2026-12-20', stage: 'lead', phone: '9000000001', note: 'first line', doc_ref: null, hidden: false, amount_received: 0, amount_pending: 80000, payment_status: null, reason_for_action: null, followup_on: null, followup_note: null, repeat_every: null, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 'b-2', agent_id: 'ag-1', client: 'Meera', amount: null, direction: null, date: null, stage: 'lead', phone: '9000000001', note: null, doc_ref: null, hidden: false, amount_received: null, amount_pending: null, created_at: '2026-09-02T00:00:00Z', updated_at: '2026-09-02T00:00:00Z' },
    { id: 'b-3', agent_id: 'ag-1', client: 'Asha', amount: 50000, direction: 'in', date: '2027-01-10', stage: 'lead', phone: '9000000003', note: null, hidden: true, created_at: '2026-09-03T00:00:00Z', updated_at: '2026-09-03T00:00:00Z' },
  ],
  events: [], agents: [], users: [], leads: [],
};
function fakeDb() {
  const tables = JSON.parse(JSON.stringify(SEED)); let n = 0;
  const from = (table) => {
    const st = { op: 'select', patch: null, rows: null, f: [] };
    const match = (r) => st.f.every((fn) => fn(r));
    const run = () => {
      const all = tables[table] || (tables[table] = []);
      if (st.op === 'insert' || st.op === 'upsert') {
        const arr = (Array.isArray(st.rows) ? st.rows : [st.rows]).map((r) => ({ id: r.id || `new-${++n}`, created_at: '2026-09-20T00:00:00Z', updated_at: '2026-09-20T00:00:00Z', hidden: false, ...r }));
        all.push(...arr); return arr;
      }
      if (st.op === 'update') { const hit = all.filter(match); hit.forEach((r) => Object.assign(r, st.patch)); return hit; }
      if (st.op === 'delete') { const keep = all.filter((r) => !match(r)); const gone = all.filter(match); tables[table] = keep; return gone; }
      return all.filter(match);
    };
    const b = new Proxy({}, { get(_t, k) {
      if (k === 'then') return (res, rej) => Promise.resolve().then(() => { const d = run(); return { data: d, error: null, count: d.length }; }).then(res, rej);
      if (k === 'single') return () => Promise.resolve().then(() => { const d = run(); return { data: d[0] || null, error: d[0] ? null : { message: 'no rows' } }; });
      if (k === 'maybeSingle') return () => Promise.resolve().then(() => { const d = run(); return { data: d[0] || null, error: null }; });
      if (k === 'insert' || k === 'upsert') return (rows) => { st.op = k; st.rows = rows; return b; };
      if (k === 'update') return (p) => { st.op = 'update'; st.patch = p; return b; };
      if (k === 'delete') return () => { st.op = 'delete'; return b; };
      if (k === 'eq') return (c, v) => { st.f.push((r) => r[c] === v); return b; };
      if (k === 'neq') return (c, v) => { st.f.push((r) => r[c] !== v); return b; };
      if (k === 'is') return (c, v) => { st.f.push((r) => (r[c] === undefined ? null : r[c]) === v); return b; };
      if (k === 'in') return (c, vs) => { st.f.push((r) => (vs || []).includes(r[c])); return b; };
      return () => b; // select, order, limit, not, or, ilike, range, gte, lte: shape only
    } });
    return b;
  };
  return { from, schema: () => ({ from }), rpc: async () => ({ data: null, error: null }) };
}

// One call per hand; the input chosen to reach a path the hand really takes on this estate.
const CALLS = [
  ['donna_money', { binder_id: 'b-1', amount: '90000', direction: 'in' }],
  ['donna_money', { binder_id: 'b-1', amount: '90000' }],
  ['donna_money_edit', { binder_id: 'b-1', amount_received: '20000' }],
  ['donna_date', { binder_id: 'b-1', date: '2026-12-21' }],
  ['donna_client', { binder_id: 'b-1', client: 'Meera K' }],
  ['donna_stage', { binder_id: 'b-1', stage: 'contacted' }],
  ['donna_note', { binder_id: 'b-1', note: 'called her back' }],
  ['donna_note_append', { binder_id: 'b-1', note: 'one more line' }],
  ['donna_phone', { binder_id: 'b-1', phone: '9000000009' }],
  ['donna_doc', { binder_id: 'b-1', doc_ref: 'contract-1' }],
  ['donna_write_reasonforaction_append', { binder_id: 'b-1', reason_for_action: 'asked for a call' }],
  ['donna_edit', { binder_id: 'b-1', note: 'edited note' }],
  ['donna_repeatfollowup', { binder_id: 'b-1', follow_on: '2026-10-01' }],
  ['donna_hide', { binder_id: 'b-1' }],
  ['donna_retrieve', { binder_id: 'b-3' }],
  ['donna_unarchive', { binder_id: 'b-3' }],
  ['donna_merge', { survivor_id: 'b-1', retire_id: 'b-2' }],
  ['donna_split', { source_id: 'b-1', client: 'Meera (sister)' }],
  ['donna_lead', { name: 'Kavya', phone: '9000000077' }],
];

async function drive(eng, hand, input) {
  eng.db.supabase = fakeDb();
  return quiet(() => (hand === 'donna_lead' ? eng.dl.executeDonnaLead('ag-1', input) : eng.rp.executeRecordTool('ag-1', hand, input)));
}

(async () => {
  const HR = require(P('src/lib/vendor/handResult.js'));
  const WRITE = ['donna_money', 'donna_money_edit', 'donna_date', 'donna_client', 'donna_lead', 'donna_stage', 'donna_note', 'donna_note_append',
    'donna_phone', 'donna_doc', 'donna_write_reasonforaction_append', 'donna_edit', 'donna_repeatfollowup', 'donna_hide', 'donna_retrieve',
    'donna_unarchive', 'donna_merge', 'donna_split'];

  sec('1  the closed sets, and the reader TOTAL');
  T('1.1 the eighteen write-hand names each carry a closed, frozen set', WRITE.every((h) => Array.isArray(HR.CODES[h]) && Object.isFrozen(HR.CODES[h]) && HR.CODES[h].length > 0));
  T('1.2 every write hand names no line yet (P5 gives the bytes)', WRITE.every((h) => JSON.stringify(HR.LINE_KEYS[h]) === '[null]'));
  T("1.3 every set carries 'refused:exception' and 'refused:result_unbuildable'", WRITE.every((h) => HR.CODES[h].includes('refused:exception') && HR.CODES[h].includes('refused:result_unbuildable')));
  T("1.4 'unknown_tool' is the dispatcher's, in no hand's set", WRITE.every((h) => !HR.CODES[h].includes('refused:unknown_tool')));
  const BAD = { toString() { throw new Error('toString refused'); }, valueOf() { throw new Error('valueOf refused'); } };
  const OUT_IN = [undefined, null, '', 0, {}, [], BAD, { result: null }, { result: {} }, { result: BAD }, { result: { ok: true, code: BAD, ids: BAD } },
    { result: { ok: 'yes', code: 'updated', ids: {} } }, { result: { ok: true, code: 'x'.repeat(50), ids: {} } }, { result: { ok: true, code: 'updated', ids: { record_id: {} } } }];
  const HAND_IN = [BAD, null, undefined, 42, '', 'nosuch'];
  const fuzz = (hr) => {
    let throws = 0; let bad = 0; let calls = 0;
    const w = console.warn; console.warn = () => {};
    try {
      // e-16: the HAND position is hostile too, for fromOutcome and for make.
      for (const h of Object.keys(hr.CODES).concat(HAND_IN)) for (const o of OUT_IN) {
        calls += 1;
        try { const r = hr.fromOutcome(h, o); if (!Object.isFrozen(r) || (hr.validate(r).length && r.code !== 'refused:result_unbuildable')) bad += 1; } catch (_e) { throws += 1; }
      }
      for (const h of HAND_IN) for (const c of [BAD, 'updated', null, 'x'.repeat(50)]) for (const f of [BAD, null, { ids: BAD }]) {
        calls += 1;
        try { const r = hr.make(h, c, f); if (!Object.isFrozen(r) || (hr.validate(r).length && r.code !== 'refused:result_unbuildable')) bad += 1; } catch (_e) { throws += 1; }
      }
    } finally { console.warn = w; }
    return { throws, bad, calls };
  };
  const fz = fuzz(HR);
  T(`1.5 ${fz.calls} hostile calls, hostile in the outcome AND the hand position: zero throws, every result frozen and valid or minimal`, fz.throws === 0 && fz.bad === 0);
  T('1.6 a good engine result reads straight through; a missing or disagreeing one is minimal', (() => {
    const w = console.warn; console.warn = () => {};
    try {
      const g = HR.fromOutcome('donna_note', { display: 'x', result: { ok: true, code: 'updated', ids: { record_id: 'b-1' } } });
      const m1 = HR.fromOutcome('donna_note', { display: 'x' });
      const m2 = HR.fromOutcome('donna_note', { result: { ok: false, code: 'updated', ids: {} } });
      return g.code === 'updated' && g.ids.record_id === 'b-1' && g.ok === true && m1.code === 'refused:result_unbuildable' && m2.code === 'refused:result_unbuildable';
    } finally { console.warn = w; }
  })());

  sec("2  the lift's scope, from P4b's own manifest (C-44.7 (b))");
  const listed = fs.existsSync(P(MAN)) ? fs.readFileSync(P(MAN), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : null;
  const scopeOk = (list) => !!list
    && JSON.stringify(list.filter((p) => p.startsWith('src/engine/')).sort()) === JSON.stringify(ENGINE3.slice().sort())
    && !list.some((p) => /soul|lens/i.test(p))
    && JSON.stringify(list.filter((p) => !p.startsWith('src/engine/')).sort()) === JSON.stringify(['docs/handovers/TDW_CE44_LCV_P4B_HANDOVER.md', MAN, SELF, 'scripts/b88_lcv_p4a_bench.js', 'src/lib/vendor/handResult.js'].sort());
  T(`2.1 P4b's manifest is present (${MAN})`, !!listed);
  T('2.2 under src/engine/ exactly the three lifted files; no loop.ts, no donna.ts, no soul or lens; the door side exactly handResult.js, b88 (cell 1.1, by the chair\'s ruling), b89, the manifest, the handover', scopeOk(listed));

  sec('3  display byte-identical (the removed line returns once `result:` is taken out)');
  const STRIP = /result: \{ ok: (?:true|false), code: '[a-z_:0-9]+', ids: \{[^{}]*\} \}, ?/g;
  const predicate = (diffText) => {
    const rem = []; const add = [];
    for (const l of diffText.split('\n')) {
      if (l.startsWith('---') || l.startsWith('+++')) continue;
      if (l.startsWith('-')) rem.push(l.slice(1)); else if (l.startsWith('+')) add.push(l.slice(1));
    }
    const pool = add.map((a) => a.replace(STRIP, ''));
    for (const r of rem) { const i = pool.indexOf(r); if (i < 0) return false; pool.splice(i, 1); }
    // What is left is only additions: result lines, the new type, comments, blanks.
    return pool.every((s) => !s.trim() || /^\s*\/\//.test(s) || /^\s*(export type WriteResult = \{|ok: boolean;|code: string;|ids: \{ record_id\?: string;.*\};|\};|result\?: WriteResult \| null;)\s*$/.test(s));
  };
  let diff;
  const missing = [BASE].filter((c) => !hasCommit(c));
  T(`3.0 the base commit is present (${BASE.slice(0, 7)})${missing.length ? ': MISSING ' + missing.join(', ') : ''}`, missing.length === 0);
  if (P4B) diff = sh(`git diff -U0 ${BASE} ${P4B} -- ${ENGINE3.join(' ')}`);
  else diff = sh(`git diff -U0 ${BASE} -- ${ENGINE3.join(' ')}`);
  T(`3.1 every removed line in the three engine files returns byte for byte once \`result:\` is taken out (${P4B ? `fixed range ${BASE.slice(0, 7)}..${P4B.slice(0, 7)}` : 'the manifest\'s engine paths, at delivery'})`, missing.length === 0 && diff.length > 0 && predicate(diff));

  sec('4  driven per hand on the COMPILED engine: base and new, the same fake database');
  let baseEng; let newEng;
  // Class (a), fixed history: the base engine is built from 85fda3d. Absent from the clone, it FAILS naming it (C-44.4).
  if (!hasCommit(BASE)) { baseEng = null; T(`4.0 the base commit is present: MISSING ${BASE}`, false); }
  else try { baseEng = load(engineAt(BASE)); } catch (e) { baseEng = null; T(`4.0 the base engine builds from git at ${BASE.slice(0, 7)}: ${String(e && e.message).split('\n')[0]}`, false); }
  try { newEng = load(P4B ? engineAt(P4B) : P('src/engine/dist/core')); } catch (e) { newEng = null; T(`4.0 the new engine loads: ${String(e && e.message).split('\n')[0]}`, false); }
  const driven = async (hr) => {
    const rows = [];
    for (const [hand, input] of CALLS) {
      const b = await drive(baseEng, hand, input); const n = await drive(newEng, hand, input);
      const read = (() => { const w = console.warn; console.warn = () => {}; try { return hr.fromOutcome(hand, n); } finally { console.warn = w; } })();
      rows.push({ hand, same: !!b && !!n && b.display === n.display, code: n && n.result && n.result.code, inSet: (hr.CODES[hand] || []).includes(read.code) && read.code !== 'refused:result_unbuildable', read: read.code });
    }
    return rows;
  };
  if (baseEng && newEng) {
    const rows = await driven(HR);
    for (const r of rows) T(`4 ${r.hand}: display identical to base; result '${r.code}' is in its closed set`, r.same && r.inSet);
    T('4.x every write hand was driven at least once', WRITE.every((h) => rows.some((r) => r.hand === h)));

    sec('5  mutations');
    const m1 = mutated('src/lib/vendor/handResult.js', [["donna_note: Object.freeze(['created', 'updated', 'refused:write_failed', 'refused:missing_note',", "donna_note: Object.freeze(['created', 'refused:write_failed', 'refused:missing_note',"]]);
    T("5.1 M1 a set missing a code the engine returns ('updated' from donna_note) reddens its driven cell", (await driven(m1)).find((r) => r.hand === 'donna_note').inSet === false);
    T('5.2 M2 a removed line whose display changed reddens the display predicate', predicate("-    return { display: `A ${x}` };\n+    return { result: { ok: true, code: 'updated', ids: {} }, display: `B ${x}` };") === false);
    const m3 = mutated('src/lib/vendor/handResult.js', [["const r = outcome && typeof outcome === 'object' ? outcome.result : null;", 'const r = outcome.result;'], ["} catch (e) { return minimal(hand, e && e.message); }\n}\n\nmodule.exports", '} catch (e) { throw e; }\n}\n\nmodule.exports']]);
    T('5.3 M3 the reader without its guard reddens the fuzz cell', fuzz(m3).throws > 0);
    const m5 = mutated('src/lib/vendor/handResult.js', [["function minimal(hand, why) {\n  try {\n    const h = handName(hand);", "function minimal(hand, why) {\n  {\n    const h = Object.prototype.hasOwnProperty.call(CODES, hand) ? hand : safeStr(hand);"], ["  } catch (_e) {\n    return Object.freeze({ hand: 'unknown',", "  } if (false) {\n    return Object.freeze({ hand: 'unknown',"]]);
    T("5.5 M5 minimal() without its guard (e-16's line restored) reddens the fuzz cell", fuzz(m5).throws > 0);
    T('5.4 M4 a manifest reaching into loop.ts reddens the scope cell', scopeOk((listed || []).concat(['src/engine/src/core/loop.ts'])) === false);
  }

  console.log(`\nb89 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.log(`b89 CRASHED: ${(e && e.stack) || e}`); process.exit(1); });
