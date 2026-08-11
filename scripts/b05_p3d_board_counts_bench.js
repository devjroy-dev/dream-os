#!/usr/bin/env node
// scripts/b05_p3d_board_counts_bench.js — THE STATE BOARD'S ARITHMETIC.
//
// TDW_05 P3-D rider · CE-30, R-30.22 §2 + R-30.23. F-05.70, both limbs, at the
// layer that serves them. Runnable from ANY working directory.
//
// ── THE DISEASE, IN THE FOUNDER'S OWN NUMBERS ───────────────────────────────
// He read FIVE ZEROS on a lane holding six prospects and four sent openers, and
// proved it against his own SQL in the same minute:
//     expired  4 rows, 4 of which were templated
//     replied  2 rows, 0 of which were templated
// Two limbs produced that:
//   LIMB 1 — the tile read `counts.templated`, a WAYPOINT state. The sweep writes
//     `templated` and the first inbound writes it straight back out, so a lane
//     that had sent four openers reported zero.
//   LIMB 2 — this router's counts loop seeded from VALID_STATES alone and dropped
//     any state the vocabulary did not name. A screen cure over a server that
//     censors is a cure of the symptom's symptom.
// THE FIXTURE BELOW IS HIS ROW SET, not an invention. §2's expected 4 is the
// number he pasted.
//
// ── ENVIRONMENT (R-30.5) ────────────────────────────────────────────────────
// In-process, no network, no DB. Nothing gated, nothing skipped.
'use strict';

const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'src/api/admin/prospects.js');

let pass = 0, fail = 0;
const fails = [];
const ok = (c, l) => { if (c) { pass++; console.log(`  ok   ${l}`); } else { fail++; fails.push(l); console.log(`  FAIL ${l}`); } };
const section = (t) => console.log(`\n── ${t} ──`);

const MUTATIONS = {
  // LIMB 2 UNCURED: the seed goes back to vocabulary-only and censors the rest.
  seed_vocabulary_only: (s) => s.replace(
    `    const k = row && row.state;
    if (k == null) continue;
    counts[k] = (counts[k] || 0) + 1;`,
    `    if (counts[row.state] != null) counts[row.state]++;`),
  // LIMB 1 UNCURED: the cumulative figure goes back to reading the waypoint.
  cumulative_reads_waypoint: (s) => s.replace(
    "const openers_sent_total = (all || []).filter(r => r && r.last_template_at).length;",
    "const openers_sent_total = counts.templated;"),
  // The field never reaches the wire — the screen has nothing to render.
  field_unserved: (s) => s.replace(
    'return okRes(res, { prospects: stamped, counts, openers_sent_total, state, limit, offset });',
    'return okRes(res, { prospects: stamped, counts, state, limit, offset });'),
  // The select stops fetching the column the cumulative figure counts.
  column_unfetched: (s) => s.replace(
    "await supabase.from('prospects').select('state, last_template_at');",
    "await supabase.from('prospects').select('state');"),
};
const MUTATE = (process.argv.find(a => a.startsWith('--mutate=')) || '').split('=')[1] || null;
if (process.argv.includes('--mutations')) { console.log(Object.keys(MUTATIONS).join('\n')); process.exit(0); }
if (MUTATE && !MUTATIONS[MUTATE]) { console.log(`UNKNOWN MUTATION ${MUTATE}`); process.exit(2); }

function loadRouter() {
  let src = fs.readFileSync(TARGET, 'utf8');
  if (MUTATE) {
    const out = MUTATIONS[MUTATE](src);
    if (out === src) { console.log(`MUTATION ${MUTATE} DID NOT APPLY — its anchor moved. This is a RED, not a pass.`); process.exit(2); }
    src = out;
  }
  const Module = require('module');
  const m = new Module(TARGET, null);
  m.filename = TARGET;
  m.paths = Module._nodeModulePaths(path.dirname(TARGET));
  const real = Module._resolveFilename;
  Module._resolveFilename = function (req, ...rest) {
    if (req === './requireAdmin') return require.resolve(path.join(__dirname, '_noop_middleware.js'));
    return real.call(this, req, ...rest);
  };
  try { m._compile(src, TARGET); } finally { Module._resolveFilename = real; }
  return m.exports;
}

function collect(router) {
  const routes = {};
  for (const layer of router.stack) {
    const p = layer.route && layer.route.path;
    if (!p) continue;
    for (const meth of Object.keys(layer.route.methods)) {
      const st = layer.route.stack;
      routes[`${meth.toUpperCase()} ${p}`] = st[st.length - 1].handle;
    }
  }
  return routes;
}

// ── THE PLANE PROJECTS, AND THAT IS NOT DECORATION ──────────────────────────
// SELF-CAUGHT BY THE MUTATION MATRIX: `select()` first ignored its argument and
// handed back whole rows, so the `column_unfetched` mutation — which drops
// `last_template_at` from the router's SELECT — changed nothing the bench could
// see and the cell went green over a tree that fetches the wrong columns. A fake
// that is more generous than PostgREST cannot catch a query that asks for too
// little. It now honours the column list, exactly as the real plane does.
function fakePlane(prospects) {
  const D = { prospects: prospects.slice(), conversations: [] };
  function q(table) {
    let rows = D[table].slice();
    const api = {
      select(cols) {
        if (typeof cols === 'string' && cols.trim() && cols.trim() !== '*') {
          const keep = cols.split(',').map(c => c.trim());
          rows = rows.map(r => {
            const out = {};
            for (const k of keep) if (k in r) out[k] = r[k];
            return out;
          });
        }
        return api;
      },
      eq(c, v) { rows = rows.filter(r => r[c] === v); return api; },
      in(c, vs) { rows = rows.filter(r => vs.includes(r[c])); return api; },
      order() { return api; }, range() { return api; }, limit() { return api; },
      maybeSingle() { return Promise.resolve({ data: rows[0] || null, error: null }); },
      then(f) { return Promise.resolve({ data: rows, error: null }).then(f); },
    };
    return api;
  }
  return { from: q };
}
function fakeRes() {
  const r = { statusCode: 200, body: null };
  r.done = new Promise((res) => { r._resolve = res; });
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; r._resolve(r); return r; };
  return r;
}

// THE FOUNDER'S OWN LANE, 2026-08-12: 4 expired (all templated) + 2 replied
// (never templated — the inbound-first shape). Six rows, four sends.
const T = '2026-08-08T07:11:00Z';
const FOUNDERS_LANE = [
  { id: 'e1', state: 'expired', last_template_at: T }, { id: 'e2', state: 'expired', last_template_at: T },
  { id: 'e3', state: 'expired', last_template_at: T }, { id: 'e4', state: 'expired', last_template_at: T },
  { id: 'r1', state: 'replied', last_template_at: null }, { id: 'r2', state: 'replied', last_template_at: null },
];

(async function main() {
  const routes = collect(loadRouter());
  const get = async (plane, query = {}) => {
    const req = { body: {}, params: {}, query, app: { locals: { supabase: plane } } };
    const res = fakeRes();
    routes['GET /'](req, res, () => res._resolve(res));
    await res.done;
    return res;
  };

  // ═══ 1 · LIMB 1 — THE WAYPOINT IS NOT THE RECORD ═════════════════════════
  section('1 · the cumulative figure, against the founder\'s own row set');
  let res = await get(fakePlane(FOUNDERS_LANE));
  ok(res.body && res.body.openers_sent_total === 4,
     'FOUR openers sent — the figure the founder pasted, now a served fact');
  ok(res.body && res.body.counts.templated === 0,
     'while `templated` is ZERO in the same payload — the waypoint is empty and the record is not');
  ok(res.body.openers_sent_total !== res.body.counts.templated,
     'THE TWO ARE DIFFERENT NUMBERS, and reading the second as the first is what put five zeros on his screen');

  section('1.1 · the figure counts SENDS, not rows');
  ok(res.body.counts.replied === 2 && res.body.openers_sent_total === 4,
     'the two inbound-first rows are counted as prospects but NOT as openers — they messaged us first');

  // ═══ 2 · LIMB 2 — THE SEED DOES NOT CENSOR ═══════════════════════════════
  section('2 · R-30.23 — a state the vocabulary does not name still emerges');
  res = await get(fakePlane([{ id: 'q1', state: 'quarantined', last_template_at: null }, ...FOUNDERS_LANE]));
  ok(res.body && res.body.counts.quarantined === 1,
     'AN UNRECOGNISED NINTH STATE IS COUNTED AND SERVED — the screen\'s humanising fallback has something to render');
  ok(Object.values(res.body.counts).reduce((a, b) => a + b, 0) === 7,
     'and the board totals SEVEN over seven rows — a fixed-list filter would have reported six and looked complete');

  section('2.1 · the vocabulary still seeds, so a zero state is a fact not an absence');
  res = await get(fakePlane(FOUNDERS_LANE));
  ok(['cold', 'templated', 'replied', 'in_session', 'converted', 'opted_out', 'expired', 'discarded']
       .every(s => typeof res.body.counts[s] === 'number'),
     'all eight declared states are present, at 0 where empty — the tile row renders eight tiles from this');
  ok(res.body.counts.cold === 0 && res.body.counts.discarded === 0,
     'and the empty ones read 0 rather than vanishing');

  // ═══ 3 · THE FIELD REACHES THE WIRE ══════════════════════════════════════
  section('3 · the payload the console is built against');
  ok(Object.prototype.hasOwnProperty.call(res.body, 'openers_sent_total'),
     '`openers_sent_total` is served — the screen renders an em-dash, never 0, when it is absent');
  res = await get(fakePlane([]));
  ok(res.body && res.body.openers_sent_total === 0,
     'an empty lane reports 0 sends — a real zero, arrived at by counting');

  const total = pass + fail;
  console.log(`\n${'═'.repeat(62)}`);
  console.log(`b05_p3d_board_counts_bench: ${pass} passed, ${fail} failed`);
  console.log(`  total ${total} · run ${total} · skipped 0 · in-process, no network, no DB`);
  if (fail) { console.log('FAILED CELLS:'); fails.forEach(f => console.log(`  · ${f}`)); }
  console.log(`${'═'.repeat(62)}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('BENCH CRASHED:', e); process.exit(2); });
