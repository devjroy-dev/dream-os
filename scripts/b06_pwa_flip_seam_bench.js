#!/usr/bin/env node
'use strict';
// scripts/b06_pwa_flip_seam_bench.js — TDW_06 P7c (F-06.8 PWA seam): THE CHIP-PATCH SEAM BENCH.
// Runnable from any working directory, clean clone, no external network, no keys:
//   node scripts/b06_pwa_flip_seam_bench.js
//
// WHAT IT PROVES (the ARTIFACT — the real PATCH /api/v2/vendor-e/mode response, §9), by
// mounting the REAL vendorMode router (auth/vendor/agent middleware stubbed so a mock agent
// resolves) and driving real HTTP against an ephemeral localhost port:
//   §1 A REAL FLIP: PATCH {victor_mode:'advisor'} on a business agent -> 200
//      { victor_mode:'advisor', thread_reset:true }; the active conversation is abandoned
//      (F-06.8's fresh thread rides the SAME shared applyModeFlip the WA words call).
//   §2 A NO-OP FLIP: PATCH {victor_mode:'advisor'} on an already-advisor agent -> 200
//      { victor_mode:'advisor', thread_reset:false }; NO victor_mode write, the conversation
//      row UNTOUCHED (still active). thread_reset:false is the PWA's signal to render no seam.
//   §3 VALIDATION UNTOUCHED (the charter's "keep the handler's validation exactly"): an
//      unknown field -> 400 FIELD_NOT_ALLOWED; a missing victor_mode -> 400; a bad value ->
//      400 INVALID_VICTOR_MODE. Routing through applyModeFlip did not soften the gate.
//
// FAIL-AT-UNCURED-TREE: before P7c the PATCH did a bare update({victor_mode}) with NO
// change-detection and NO abandon, and returned { victor_mode } with NO thread_reset. Revert
// vendorMode.js's PATCH body to 3075544 and re-run: §1 loses thread_reset (undefined, not
// true) AND the conversation is never abandoned; §2 loses thread_reset and still writes on a
// no-op. §3 stays green (validation was already there) — so §1/§2 are the both-ways tell.
//
// DISCLOSED RIG: require.cache is pre-seeded with pass-through stubs for requireAuth (direct
// middleware) and resolveVendor/resolveAgent (factories) BEFORE vendorMode is required, so the
// route resolves req.vendor/req.agentId without a JWT or DB. app.locals.supabase is a mock
// modelling engine.agents + engine.conversations; every write is witnessed. asyncHandler,
// the response helper, and applyModeFlip/abandonActiveThread are the REAL modules.

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const path = require('path');
const http = require('http');
const express = require('express');
const ROOT = path.resolve(__dirname, '..');

// ── seed middleware stubs BEFORE requiring the router (it captures them at load) ────────────
function seed(rel, exportsVal) {
  const p = require.resolve(path.join(ROOT, rel));
  require.cache[p] = { id: p, filename: p, loaded: true, exports: exportsVal };
}
seed('src/api/middleware/requireAuth',  (req, res, next) => next());                       // direct mw
seed('src/api/middleware/resolveVendor', () => (req, res, next) => { req.vendor = { id: 'v-vera' }; next(); }); // factory
seed('src/api/middleware/resolveAgent',  () => (req, res, next) => { req.agentId = 'agent-vera'; next(); });    // factory

const modeRouter = require(path.join(ROOT, 'src/api/vendor-engine/vendorMode.js'));

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('    PASS  ' + label); } else { fail++; console.log('    FAIL  ' + label); } };

// ── the mock supabase (engine.agents + engine.conversations) ────────────────────────────────
function mkSupabase(agents, convos) {
  const ops = { agentUpdates: [], convoUpdates: [], deletes: [] };
  const engineTable = (table) => {
    const q = { _t: table, _eq: {} };
    const chain = {
      select() { return chain; },
      eq(col, val) { q._eq[col] = val; return chain; },
      order() { return chain; },
      limit() { return chain; },
      maybeSingle() {
        if (q._t === 'agents') {
          const vm = agents[q._eq.id];
          return Promise.resolve({ data: vm === undefined ? null : { victor_mode: vm }, error: null });
        }
        if (q._t === 'conversations') {
          const latest = convos.filter(c => c.agent_id === q._eq.agent_id)[0] || null;
          return Promise.resolve({ data: latest ? { id: latest.id, state: latest.state } : null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      update(patch) {
        return { eq: (col, val) => {
          if (q._t === 'agents') { ops.agentUpdates.push({ id: val, patch }); agents[val] = patch.victor_mode; }
          if (q._t === 'conversations') { ops.convoUpdates.push({ id: val, patch }); const c = convos.find(x => x.id === val); if (c) Object.assign(c, patch); }
          return Promise.resolve({ error: null });
        } };
      },
      delete() { return { eq: (col, val) => { ops.deletes.push({ id: val }); return Promise.resolve({ error: null }); } }; },
    };
    return chain;
  };
  return { schema: () => ({ from: engineTable }), from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }), __ops: ops, __agents: agents, __convos: convos };
}

// ── the app: one instance, app.locals.supabase swapped per test ─────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/v2/vendor-e/mode', modeRouter);

function patch(bodyObj) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(bodyObj);
    const req = http.request({
      host: '127.0.0.1', port: app.__port, path: '/api/v2/vendor-e/mode', method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let raw = '';
      res.on('data', (d) => { raw += d; });
      res.on('end', () => { let json = null; try { json = JSON.parse(raw); } catch (_e) {} resolve({ status: res.statusCode, json }); });
    });
    req.on('error', reject);
    req.write(payload); req.end();
  });
}

(async () => {
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  app.__port = server.address().port;

  try {
    console.log('\n  [1] A REAL FLIP (business -> advisor): thread_reset:true + the thread abandoned:');
    {
      const sb = mkSupabase({ 'agent-vera': 'business' }, [{ id: 'conv-vera-1', agent_id: 'agent-vera', state: 'active' }]);
      app.locals.supabase = sb;
      const r = await patch({ victor_mode: 'advisor' });
      T('200 { ok, victor_mode:advisor, thread_reset:true }', r.status === 200 && r.json && r.json.victor_mode === 'advisor' && r.json.thread_reset === true);
      T('victor_mode was written (the real flip)', sb.__agents['agent-vera'] === 'advisor' && sb.__ops.agentUpdates.length === 1);
      T('the active conversation was abandoned (F-06.8 fresh thread on the PWA seam)', sb.__convos[0].state === 'abandoned' && sb.__ops.deletes.length === 0);
    }

    console.log('\n  [2] A NO-OP FLIP (advisor -> advisor): thread_reset:false + nothing written/abandoned:');
    {
      const sb = mkSupabase({ 'agent-vera': 'advisor' }, [{ id: 'conv-vera-1', agent_id: 'agent-vera', state: 'active' }]);
      app.locals.supabase = sb;
      const r = await patch({ victor_mode: 'advisor' });
      T('200 { victor_mode:advisor, thread_reset:false }', r.status === 200 && r.json && r.json.victor_mode === 'advisor' && r.json.thread_reset === false);
      T('§2 NO victor_mode write on a no-op', sb.__ops.agentUpdates.length === 0);
      T('§2 the conversation row is UNTOUCHED (still active) — the PWA renders no seam', sb.__convos[0].state === 'active' && sb.__ops.convoUpdates.length === 0);
    }

    console.log('\n  [3] VALIDATION UNTOUCHED (the gate the charter says to keep exactly):');
    {
      app.locals.supabase = mkSupabase({ 'agent-vera': 'business' }, []);
      const bad = await patch({ not_a_field: 'x' });
      T('unknown field -> 400 FIELD_NOT_ALLOWED', bad.status === 400 && bad.json && bad.json.code === 'FIELD_NOT_ALLOWED');
      const missing = await patch({});
      T('missing victor_mode -> 400', missing.status === 400);
      const invalid = await patch({ victor_mode: 'sideways' });
      T('bad value -> 400 INVALID_VICTOR_MODE', invalid.status === 400 && invalid.json && invalid.json.code === 'INVALID_VICTOR_MODE');
    }
  } finally {
    server.close();
  }

  console.log(`\n  ── ${pass}/${pass + fail} PASS ──\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
