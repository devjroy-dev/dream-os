'use strict';
// scripts/b48_engine_mounts_bench.js
// CE-39 · ROAD STEP 2b · 2b-2 · THE ENGINE MOUNTS, ASSERTED AS STANDING.
//
// ── ⚠ THIS CELL IS INVERTED, AND THE INVERSION IS THE RULING ────────────────
// It was written to prove a RETIREMENT and it ships proving the opposite: that
// the four engine money addresses ALL STILL RESOLVE. Nothing is retired by 2b-2
// and this file is the guard against one happening by accident.
//
// THE RETIREMENT WAS RULED, BUILT, AND WITHDRAWN — F-2b2.3. The charter would
// have dropped `cabinet.js`'s `paid`/`owed` slices and the two `/vendor-e/` GET
// mounts, on a callers-down sweep that reported ZERO pwa readers. The sweep was
// a grep and the grep was wrong: dropping the two fields from `CabinetResponse`
// made `tsc` name THREE live readers in one run —
//   dreamos-pwa lib/vendor/derive.ts:100        `moneyBinders` composes its whole
//                                               result from cab.paid + cab.owed
//   dreamos-pwa app/vendor/list/[slice]/leads.tsx:96    all four slices
//   dreamos-pwa app/vendor/list/[slice]/events.tsx:36   all four slices
// — none of which the grep could see, because it alternated on variable names
// and could not read `cab.data?.paid` or a spread inside an array literal.
//
// THE LAW THAT CAME OUT OF IT (band 5): **a grep's failure mode is a silent
// zero; a type resolver's is an error. For consumers of a typed wire, `tsc` IS
// the sweep and grep is the hint.**
//
// The `/vendor-e/` mounts have zero callers and were proven safe to retire by
// request, both ways. They are HELD anyway, by ruling: the same sweep-shape
// produced this sitting's finding, they cost nothing standing, and Phase 7
// retires the whole vendor-engine twin — mounts, slices and the three
// /vendor-tree readers — in ONE motion, at a tip where `readers leave before
// their sources` can be proven by `tsc` on both sides at once.
//
// ── WHAT THE CELLS ASSERT NOW ──────────────────────────────────────────────
//   · `/api/v2/vendor-e/{cabinet,binders}` (GET) — STILL MOUNTED.
//   · `/api/v2/vendor-e/binders` POST doors — STILL MOUNTED, same prefix.
//   · `/api/v2/vendor/{cabinet,binders}` — STILL MOUNTED and LIVE; these are
//     what `fetchCabinet` and `fetchLedger` call.
// An accidental retirement of any of them reds here with the reader named.
//
// ⚠ §1 MOUNTS THE REAL ROUTERS AND ISSUES REAL REQUESTS. It does not read the
// mount table and reason about Express: a claim about behaviour is derived from
// behaviour (R-38.19's shape). A 404 and a 401 are different answers and these
// cells distinguish them, because a door that exists and refuses you is mounted
// and a door that does not exist is not.
//
// ── ⚠ THE INERT ENV, SET BEFORE ANY REQUIRE, AND WHY IT IS NOT A CREDENTIAL ──
// `src/engine/dist/core/db.js` throws at MODULE LOAD if SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are unset, and the vendor router's import graph
// reaches it. The values below are OBVIOUS PLACEHOLDERS and are never used: every
// door §1 hits authenticates first and answers 401 or 404 long before a query,
// and `app.locals.supabase` is left null so a handler that DID reach the database
// would throw loudly rather than talk to one.
//
// No live credential is echoed, read from the environment, or written to a
// transcript by this file — the secrets law, and the reason the constants are
// spelled to be unmistakable rather than realistic. They are set only if unset,
// so a real environment is never overwritten by a bench.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://b48.invalid.local';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'b48-inert-not-a-key';

const assert = require('assert');
const path   = require('path');
const fs     = require('fs');
const express = require('express');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
/** Comment-blind, the house `strip()`. A mount written inside a comment
    explaining mounts is how S1's census counted twenty-eight (F-38.24). */
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

let pass = 0, fail = 0;
const cell = (label, fn) => {
  try { fn(); console.log('  PASS  ' + label); pass++; }
  catch (e) { console.log('  FAIL  ' + label + '\n        ' + e.message); fail++; }
};

// A request against a mounted router, without a network listener. `inject` is
// not available here, so the app is driven through a real server on an ephemeral
// port — the least clever thing that actually exercises routing.
const http = require('http');
function hit(app, method, url) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app).listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const req = http.request({ host: '127.0.0.1', port, method, path: url }, (res) => {
        res.resume();
        res.on('end', () => { server.close(); resolve(res.statusCode); });
      });
      req.on('error', (e) => { server.close(); reject(e); });
      req.end();
    });
    server.on('error', reject);
  });
}

console.log('\n── §1 — THE FOUR MOUNTS, BY REQUEST ────────────────────────────────────────');

(async () => {

  const mount = () => {
    const app = express();
    app.locals.supabase = null;   // never reached: every door below authenticates first
    app.use('/api/v2/vendor-e', require('../src/api/vendor-engine'));
    app.use('/api/v2/vendor',   require('../src/api/vendor/core'));
    return app;
  };

  // §1.1 — THE TWO /vendor-e READ MOUNTS STAND. Zero callers is not zero value:
  // they are the Phase 3 parallel doors and they retire WITH their tree, not
  // ahead of it. Non-404 means the route resolved and auth answered.
  await (async () => {
    const cab = await hit(mount(), 'GET', '/api/v2/vendor-e/cabinet/x');
    const led = await hit(mount(), 'GET', '/api/v2/vendor-e/binders/x');
    cell('§1.1 the two /vendor-e read mounts still resolve (HELD to Phase 7, F-2b2.3)', () => {
      assert.notStrictEqual(cab, 404, '/vendor-e/cabinet/:v answered 404 — a retirement happened that no ruling ordered');
      assert.notStrictEqual(led, 404, '/vendor-e/binders/:v answered 404 — a retirement happened that no ruling ordered');
    });
  })();

  // §1.2 — THE WRITE DOORS ON THE SAME PREFIX. `binderWrite` mounts eight POSTs
  // under the same `/binders` prefix the GET mount uses. Asserted separately so
  // that if the GET mount is ever removed, this cell says whether the write
  // doors survived it — which is the question, and it is not answerable by
  // reading the mount table.
  await (async () => {
    const code = await hit(mount(), 'POST', '/api/v2/vendor-e/binders/x/y/stage');
    cell('§1.2 the /vendor-e/binders WRITE doors resolve on the shared prefix', () => {
      assert.notStrictEqual(code, 404, 'POST /vendor-e/binders/:v/:id/stage answered 404');
    });
  })();

  // §1.3 — THE LIVE TWINS, AND THIS IS THE CELL F-2b2.2 AND F-2b2.3 ARE ABOUT.
  // The SAME handler modules, at the addresses the pwa actually calls:
  // `fetchCabinet` (lib/vendor/api/vendor.ts:97) feeds the Clients room and
  // `moneyBinders`; `fetchLedger` (:109) feeds `fetchClientDetail`. A sweep
  // matching only the `vendor-e/` spelling finds zero readers for these modules
  // and concludes they are dead. They are not, and this is where that is written
  // down in a form that fails loudly.
  await (async () => {
    const cab = await hit(mount(), 'GET', '/api/v2/vendor/cabinet/x');
    const led = await hit(mount(), 'GET', '/api/v2/vendor/binders/x');
    cell('§1.3 the LIVE /api/v2/vendor twins resolve — three pwa readers depend on them (F-2b2.3)', () => {
      assert.notStrictEqual(cab, 404,
        '/api/v2/vendor/cabinet/:v answered 404 — derive.ts::moneyBinders, leads.tsx and events.tsx read this payload');
      assert.notStrictEqual(led, 404,
        '/api/v2/vendor/binders/:v answered 404 — fetchClientDetail reads this address');
    });
  })();

  // §1.4 — THE CABINET PAYLOAD STILL CARRIES ITS FOUR MONEY-BEARING SLICES.
  // NOT a retirement cell: the inverse. `paid` and `owed` have three live
  // readers on the /vendor tree (F-2b2.3), so the payload keeps them until that
  // tree retires. Comment-blind, because this file's own header names both words
  // many times.
  cell('§1.4 the cabinet payload still ships paid and owed — their readers are live (F-2b2.3)', () => {
    const src = strip(read('src/api/vendor-engine/cabinet.js'));
    assert.ok(/\bconst\s+paid\s*=/.test(src), 'cabinet.js no longer computes the `paid` slice');
    assert.ok(/\bconst\s+owed\s*=/.test(src), 'cabinet.js no longer computes the `owed` slice');
    assert.ok(/clients,\s*leads,\s*paid,\s*owed,\s*booked,\s*reminders/.test(src),
      'the six slices are no longer shipped together — the payload moved and three pwa readers ride it');
  });

  // §1.5 — THE HANDLERS ARE MOUNTED WHERE THE LIVE ADDRESSES ARE. §1.3 proves
  // the addresses answer; this proves WHY, so a seat deleting core.js's two
  // lines reds with the reason rather than only with a 404.
  cell('§1.5 core.js mounts both engine handlers at the live /api/v2/vendor addresses', () => {
    const core = strip(read('src/api/vendor/core.js'));
    assert.ok(/router\.use\('\/cabinet',\s*require\('\.\.\/vendor-engine\/cabinet'\)\)/.test(core),
      'core.js no longer mounts vendor-engine/cabinet');
    assert.ok(/router\.use\('\/binders',\s*require\('\.\.\/vendor-engine\/ledger'\)\)/.test(core),
      'core.js no longer mounts vendor-engine/ledger');
  });

  console.log('\n── §3 — base_guard.sh, ACROSS THE PAIR ─────────────────────────────────────');

  // §3.1 — The twin of dreamos-pwa's C81, and it REFUSES rather than FAILS when
  // the sibling is absent. R-38.20b: a missing sibling has faked findings in both
  // directions in this estate, and a red on an absent tree teaches a reader that
  // reds are negotiable.
  cell('§3.1 tools/base_guard.sh is byte-identical in both repos (R-38.20)', () => {
    const there = path.join(ROOT, '../dreamos-pwa/tools/base_guard.sh');
    if (!fs.existsSync(there)) {
      console.log('        REFUSED — the dreamos-pwa sibling is absent; equality cannot be read.');
      console.log('        Clone it beside this repo and re-run (R-38.20b). This is NOT a FAIL.');
      return;
    }
    const a = fs.readFileSync(path.join(ROOT, 'tools/base_guard.sh'));
    const b = fs.readFileSync(there);
    assert.ok(a.equals(b),
      'base_guard.sh differs across the pair — ' + a.length + ' bytes here, ' + b.length +
      ' there. A guard with two behaviours and one name is what its own header forbids.');
  });

  console.log('\n════════  ' + pass + ' passed, ' + fail + ' failed  ════════\n');
  process.exit(fail === 0 ? 0 : 1);

})().catch((e) => { console.error('b48 threw: ' + e.stack); process.exit(2) /* F-39.67: an unexpected throw is an ERROR, never a FAIL */; });
