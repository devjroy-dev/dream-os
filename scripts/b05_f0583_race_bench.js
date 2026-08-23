'use strict';
// scripts/b05_f0583_race_bench.js
// ═══════════════════════════════════════════════════════════════════════════════
// R-36.5 · F-05.83 THE RACE FENCE — the concurrency proof, designed honestly.
// ═══════════════════════════════════════════════════════════════════════════════
//
// THE CHARTER'S OWN WARNING GOVERNS THIS FILE: "a fixture that cannot race is a
// vacuous cell." So the harness below is built to RACE ON PURPOSE — a barrier
// holds every engine.agents WRITE until BOTH concurrent callers have completed
// their step-2 READ and seen no row, which is the exact interleaving that minted
// eleven duplicate pairs in production (15–172ms apart, CE-224). The fixture DB
// models the POST-0129 world (UNIQUE on engine.agents(user_id) enforced), because
// the ruled apply order is 0129-before-code: the cure is judged against the
// database it will actually meet.
//
// NON-VACUITY, BOTH WAYS, IN THIS ONE FILE:
//   · §3 loads the UNCURED agentBridge from the pinned pre-cure tree
//     (`git show c7c1be1:...` — committed history, stable forever) and asserts
//     the SAME race cell FAILS on it. A bench whose red set cannot be produced
//     is not a bench.
//   · §4/§7 apply MUTATIONS TO THE CURED PRODUCTION SOURCE (comment-stripped
//     first, per F-06.192 — a mutation that can land in prose is absorbed by
//     prose) and assert each named cell reds. Mutants load as temp modules
//     BESIDE their originals so every relative require resolves identically;
//     temp files are deleted in finally.
//   · §5 drives the REAL COMPILED dist for createOwner (cache-poisoned db, the
//     compiled `db_js_1.supabase` property read makes that lawful) AND a
//     transpile of the real source — divergence between the two is a stale-dist
//     red by construction (F-04.83's class, caught without dist_gate's help).
//
// EXIT CODE IS THE VERDICT (floor law); the count line is for humans.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { stripComments } = require('./lib/stripComments'); // TDW_STRIPPER_CANARY — coverage-listed by b07_f0774_stripper_bench §4

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://bench.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-dummy';

const ROOT = path.resolve(__dirname, '..');
const UNCURED_TIP = 'c7c1be1'; // the delivery's base — pre-cure by definition, an ancestor forever.

let pass = 0, fail = 0;
const red = [];
function cell(name, ok, why) {
  if (ok) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; red.push(name); console.log(`  FAIL ${name}${why ? ' — ' + why : ''}`); }
}

// ── §1 · THE FIXTURE DB — post-0129 semantics, with the barrier ───────────────
// Chainable thenable builder over in-memory tables. It implements ONLY the
// shapes the code under test issues (witnessed by reading that code, §0.2), and
// throws on anything else rather than guessing — a fixture that silently
// tolerates an unmodelled query is a fixture that lies.
function makeDb() {
  const state = {
    pub:    { users: [], admin_config: [], messages: [], conversations: [] },
    engine: { users: [], agents: [], agent_owner: [], usage: [] },
    seq: 0,
    agentsSelects: 0,
    beforeAgentsWrite: null,   // async gate — the race choreographer
    onAgentsSelect: null,
    failTables: new Set(),     // §6.6 — make a table's read throw
  };
  const uid = (p) => `${p}-${++state.seq}-${Math.random().toString(16).slice(2, 8)}`;

  function tableOf(schema, name) {
    const home = schema === 'engine' ? state.engine : state.pub;
    if (!home[name]) throw new Error(`fixture: unmodelled table ${schema}.${name}`);
    return home[name];
  }

  function applyFilters(rows, q) {
    let out = rows.filter((r) => q.filters.every((f) => {
      if (f.op === 'eq') return r[f.col] === f.val;
      if (f.op === 'in') return f.val.includes(r[f.col]);
      if (f.op === 'not-is-null') return r[f.col] !== null && r[f.col] !== undefined;
      if (f.op === 'gte') return true; // usage-count time floor — fixture rows are all "today"
      throw new Error(`fixture: unmodelled filter ${f.op}`);
    }));
    if (q.order) out = out.slice().sort((a, b) => (a[q.order.col] < b[q.order.col] ? -1 : 1) * (q.order.asc ? 1 : -1));
    if (q.limit != null) out = out.slice(0, q.limit);
    return out;
  }

  // The one place uniqueness lives — the post-0129 world. engine.agents(user_id)
  // is the arbiter this delivery ships; engine.users(auth_user_id) is the
  // arbiter proven to exist by the step-1 upsert working in production
  // (nulls-distinct, as the live demo/consult rows prove).
  function conflictRow(schema, table, row) {
    if (schema === 'engine' && table === 'agents') {
      return tableOf(schema, table).find((r) => r.user_id === row.user_id) || null;
    }
    if (schema === 'engine' && table === 'users' && row.auth_user_id != null) {
      return tableOf(schema, table).find((r) => r.auth_user_id === row.auth_user_id) || null;
    }
    return null;
  }

  function makeBuilder(schema) {
    return {
      from(table) {
        const q = { schema, table, op: 'select', cols: '*', filters: [], order: null, limit: null, shape: 'rows', payload: null, opts: null, head: false, count: false };
        const api = {
          select(cols, o) { if (q.op === 'select') { q.cols = cols; if (o && o.count) { q.count = true; q.head = !!o.head; } } return api; },
          eq(col, val) { q.filters.push({ op: 'eq', col, val }); return api; },
          in(col, val) { q.filters.push({ op: 'in', col, val }); return api; },
          not(col, oper, val) { if (oper === 'is' && val === null) q.filters.push({ op: 'not-is-null', col }); return api; },
          gte(col, val) { q.filters.push({ op: 'gte', col, val }); return api; },
          is(col, val) { q.filters.push({ op: 'eq', col, val }); return api; },
          order(col, o) { q.order = { col, asc: !o || o.ascending !== false }; return api; },
          limit(n) { q.limit = n; return api; },
          insert(payload) { q.op = 'insert'; q.payload = payload; return api; },
          upsert(payload, opts) { q.op = 'upsert'; q.payload = payload; q.opts = opts || {}; return api; },
          update(payload) { q.op = 'update'; q.payload = payload; return api; },
          single() { q.shape = 'single'; return exec(); },
          maybeSingle() { q.shape = 'maybe'; return exec(); },
          then(res, rej) { return exec().then(res, rej); },
        };
        async function exec() {
          if (state.failTables.has(`${schema}.${q.table}`)) throw new Error(`fixture: ${q.table} read forced to throw`);
          const rows = tableOf(schema, q.table);
          if (q.op === 'select') {
            if (schema === 'engine' && q.table === 'agents') { state.agentsSelects++; if (state.onAgentsSelect) state.onAgentsSelect(state.agentsSelects); }
            const out = applyFilters(rows, q);
            if (q.count) return { data: null, error: null, count: out.length };
            return shape(out);
          }
          if (q.op === 'update') {
            applyFilters(rows, q).forEach((r) => Object.assign(r, q.payload));
            return { data: null, error: null };
          }
          // WRITES on engine.agents wait at the barrier — the choreography.
          if (schema === 'engine' && q.table === 'agents' && state.beforeAgentsWrite) await state.beforeAgentsWrite();
          const row = Object.assign({ id: uid(q.table), created_at: new Date(Date.now() + state.seq).toISOString() }, q.payload);
          const conflict = conflictRow(schema, q.table, row);
          if (q.op === 'insert') {
            if (conflict) {
              const error = { code: '23505', message: `duplicate key value violates unique constraint "${q.table}_key"` };
              if (q.shape === 'rows') return { data: null, error };
              return { data: null, error };
            }
            rows.push(row);
            return shape([row]);
          }
          // upsert
          if (conflict) {
            if (q.opts && q.opts.ignoreDuplicates) return shape([]);          // ON CONFLICT DO NOTHING
            Object.assign(conflict, q.payload);                               // ON CONFLICT DO UPDATE
            return shape([conflict]);
          }
          rows.push(row);
          return shape([row]);
        }
        function shape(out) {
          if (q.shape === 'single') {
            if (out.length !== 1) return { data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } };
            return { data: out[0], error: null };
          }
          if (q.shape === 'maybe') {
            if (out.length > 1) return { data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } };
            return { data: out[0] || null, error: null };
          }
          return { data: out, error: null };
        }
        return api;
      },
      schema(name) { return makeBuilder(name); },
    };
  }
  const client = makeBuilder('public');
  client._state = state;
  return client;
}

// Race choreography: hold every agents WRITE until `n` agents SELECTs have run.
function armRace(db, readsNeeded) {
  const st = db._state;
  let release;
  const gate = new Promise((r) => { release = r; });
  st.onAgentsSelect = (n) => { if (n >= readsNeeded) release(); };
  st.beforeAgentsWrite = () => gate;
}
function disarmRace(db) { db._state.onAgentsSelect = null; db._state.beforeAgentsWrite = null; }

// Vendor fixture — self-contained, zero placeholders (standing-test-block law).
function seedVendor(db) {
  const st = db._state;
  st.pub.users.push({ id: 'pu-1', auth_user_id: 'auth-1', phone: '9888294440', name: 'Bench Vendor' });
  return { id: 'v-1', user_id: 'pu-1', category: 'photographer', business_name: 'Bench Studio', tier: 'basic' };
}

// Load a module from source TEXT, placed BESIDE a sibling so relative requires
// resolve identically; removed in finally by the caller.
function loadBeside(siblingAbs, text, tag) {
  const p = path.join(path.dirname(siblingAbs), `.__mut_${tag}_${process.pid}.js`);
  fs.writeFileSync(p, text);
  delete require.cache[p];
  return { mod: require(p), file: p };
}

(async () => {
  console.log('b05_f0583_race_bench — R-36.5, the race fence');
  const BRIDGE = path.join(ROOT, 'src/api/middleware/agentBridge.js');
  const tmpFiles = [];
  try {
    // ── §2 · THE RACE CELL — cured agentBridge, the shipped file ──────────────
    {
      const { resolveAgentForVendor } = require(BRIDGE);
      const db = makeDb();
      const vendor = seedVendor(db);
      armRace(db, 2); // both step-2 reads must land before either write.
      const [r1, r2] = await Promise.all([
        resolveAgentForVendor(db, vendor, 'auth-1'),
        resolveAgentForVendor(db, vendor, 'auth-1'),
      ]);
      disarmRace(db);
      const st = db._state;
      cell('2.1 race: ONE agents row', st.engine.agents.length === 1, `rows=${st.engine.agents.length}`);
      cell('2.2 race: BOTH callers hold the same agentId', !!r1.agentId && r1.agentId === r2.agentId, `${r1.agentId} vs ${r2.agentId}`);
      cell('2.3 race: ONE agent_owner row (loser-safe clause)', st.engine.agent_owner.length === 1, `owners=${st.engine.agent_owner.length}`);
      cell('2.4 race: ONE engine.users row (step-1 arbiter modelled)', st.engine.users.length === 1, `users=${st.engine.users.length}`);
      // The ordinary path, unraced — regressions are worse than missing features (§8).
      const db2 = makeDb(); const v2 = seedVendor(db2);
      const a1 = await resolveAgentForVendor(db2, v2, 'auth-1');
      const a2 = await resolveAgentForVendor(db2, v2, 'auth-1');
      cell('2.5 serial: idempotent, one row, same id', db2._state.engine.agents.length === 1 && a1.agentId === a2.agentId);
      // The standing fences must survive the cure byte-for-byte in behaviour.
      let threw = null; try { await resolveAgentForVendor(makeDb(), v2, null); } catch (e) { threw = e; }
      cell('2.6 missing-authUserId still throws (F-05.84 rides the ruled dead-letter)', !!threw && /missing authUserId/.test(threw.message));
      const db3 = makeDb(); const v3 = seedVendor(db3);
      let planeErr = null; try { await resolveAgentForVendor(db3, v3, 'pu-1'); } catch (e) { planeErr = e; }
      cell('2.7 F-05.47 wrong-plane fence intact', !!planeErr && /WRONG IDENTITY PLANE/.test(planeErr.message));
    }

    // ── §3 · THE UNCURED CROSS-CHECK — the same cell MUST RED at c7c1be1 ──────
    {
      let uncuredSrc = '';
      try { uncuredSrc = execSync(`git show ${UNCURED_TIP}:src/api/middleware/agentBridge.js`, { cwd: ROOT }).toString(); }
      catch (e) { /* refused below */ }
      if (!uncuredSrc) {
        cell('3.1 uncured tree reachable', false, 'git show failed — REFUSING, not skipping (a red set that cannot be produced is not a bench)');
      } else {
        const loaded = loadBeside(BRIDGE, uncuredSrc, 'bridge_uncured'); tmpFiles.push(loaded.file);
        const db = makeDb(); const vendor = seedVendor(db);
        armRace(db, 2);
        let failed = false, rows = 0;
        try {
          await Promise.all([
            loaded.mod.resolveAgentForVendor(db, vendor, 'auth-1'),
            loaded.mod.resolveAgentForVendor(db, vendor, 'auth-1'),
          ]);
        } catch (e) { failed = true; }
        disarmRace(db);
        rows = db._state.engine.agents.length;
        // At the uncured tree, against the post-0129 DB, the racing loser's bare
        // INSERT takes 23505 and THROWS — the disease traded for the louder one
        // the apply-order law exists to prevent. Either a throw or a duplicate
        // convicts; a clean pass here would mean the race cell is vacuous.
        cell('3.2 UNCURED REDS on the identical race', failed || rows !== 1, `failed=${failed} rows=${rows}`);
      }
    }

    // ── §4 · MUTATIONS ON THE CURED PRODUCTION SOURCE (stripped first) ────────
    {
      const cured = stripComments(fs.readFileSync(BRIDGE, 'utf8'));
      const mutations = [
        ['4.1 ignoreDuplicates flip → double owner', `onConflict: 'user_id', ignoreDuplicates: true`, `onConflict: 'user_id', ignoreDuplicates: false`,
          (st, r1, r2, err) => st.engine.agent_owner.length !== 1],
        ['4.2 loser re-read severed → loser resolves nothing', `a = rr.data;`, `a = null;`,
          (st, r1, r2, err) => !!err || !(r1 && r2 && r1.agentId && r1.agentId === r2.agentId)],
        ['4.3 winner-only guard dropped → double owner', `if (wonTheInsert) {`, `if (true) {`,
          (st, r1, r2, err) => st.engine.agent_owner.length !== 1],
      ];
      for (const [name, from, to, convicts] of mutations) {
        if (!cured.includes(from)) { cell(name, false, `mutation anchor not found in stripped source: ${from}`); continue; }
        const loaded = loadBeside(BRIDGE, cured.replace(from, to), name.slice(0, 3).replace('.', '_')); tmpFiles.push(loaded.file);
        const db = makeDb(); const vendor = seedVendor(db);
        armRace(db, 2);
        let r1 = null, r2 = null, err = null;
        try { [r1, r2] = await Promise.all([
          loaded.mod.resolveAgentForVendor(db, vendor, 'auth-1'),
          loaded.mod.resolveAgentForVendor(db, vendor, 'auth-1'),
        ]); } catch (e) { err = e; }
        disarmRace(db);
        cell(name, convicts(db._state, r1, r2, err), 'mutant survived — the cell has no teeth');
      }
      // The stripper is CALLED, not just imported (F-07.99's invocation cell).
      cell('4.4 §0.Z INVOCATION (F-07.99) — this bench really CALLS its stripper, and it bites', cured.length < fs.readFileSync(BRIDGE, 'utf8').length && !/RACE FENCE/.test(cured));
    }

    // ── §5 · createOwner (RULED IN) — real dist + transpiled source, both legs ─
    {
      const ts = require('typescript');
      const SIGNUP_TS = path.join(ROOT, 'src/engine/src/core/signup.ts');
      const DIST_DIR = path.join(ROOT, 'src/engine/dist/core');
      const transpile = (src) => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;

      // A stub home so the transpiled file's relative requires resolve: db.js
      // hands over OUR fixture; professions.js re-exports the REAL compiled one.
      function signupHome(db, signupJsText, tag) {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), `f0583_${tag}_`));
        fs.writeFileSync(path.join(dir, 'db.js'), 'Object.defineProperty(module.exports, "supabase", { get: () => global.__f0583_db });'); // lazy — runSignupRace swaps the fixture per run
        fs.writeFileSync(path.join(dir, 'professions.js'), `module.exports = require(${JSON.stringify(path.join(DIST_DIR, 'professions.js'))});`);
        // bcryptjs resolves from the repo's node_modules via a paths shim:
        fs.writeFileSync(path.join(dir, 'package.json'), '{}');
        fs.mkdirSync(path.join(dir, 'node_modules'), { recursive: true });
        fs.symlinkSync(path.join(ROOT, 'node_modules', 'bcryptjs'), path.join(dir, 'node_modules', 'bcryptjs'), 'junction');
        const p = path.join(dir, 'signup.js');
        fs.writeFileSync(p, signupJsText);
        global.__f0583_db = db;
        delete require.cache[p];
        return require(p);
      }
      // engine-schema client only (db.ts pins schema:'engine'):
      const engineClient = (db) => db.schema('engine');

      // The producible race: engine.users already exists (born through the WA
      // bridge), NO agent — then the human double-submits web signup. Both find
      // existingUser, neither finds an agent, both hit the agents write.
      async function runSignupRace(mod) {
        const db = makeDb();
        db._state.engine.users.push({ id: 'eu-1', auth_user_id: 'auth-9', phone: '9888294440', name: 'Bench Vendor', pin_hash: null });
        global.__f0583_db = engineClient(db);
        armRace(db, 2);
        let r1 = null, r2 = null, err = null;
        try { [r1, r2] = await Promise.all([
          mod.createOwner({ authUserId: 'auth-9', phone: '9888294440', name: 'Bench Vendor', professionKey: 'designers', pin: '1234' }),
          mod.createOwner({ authUserId: 'auth-9', phone: '9888294440', name: 'Bench Vendor', professionKey: 'designers', pin: '1234' }),
        ]); } catch (e) { err = e; }
        disarmRace(db);
        return { st: db._state, r1, r2, err };
      }

      // Leg A — THE REAL COMPILED DIST, cache-poisoned db (db_js_1.supabase is a
      // property read at call time; the poison is lawful and the loop untouched).
      const distDb = require(path.join(DIST_DIR, 'db.js'));
      const realSupabase = distDb.supabase;
      const distSignup = require(path.join(DIST_DIR, 'signup.js'));
      let distRes;
      try {
        const db = makeDb();
        db._state.engine.users.push({ id: 'eu-1', auth_user_id: 'auth-9', phone: '9888294440', name: 'Bench Vendor', pin_hash: null });
        distDb.supabase = engineClient(db);
        armRace(db, 2);
        let r1 = null, r2 = null, err = null;
        try { [r1, r2] = await Promise.all([
          distSignup.createOwner({ authUserId: 'auth-9', phone: '9888294440', name: 'Bench Vendor', professionKey: 'designers', pin: '1234' }),
          distSignup.createOwner({ authUserId: 'auth-9', phone: '9888294440', name: 'Bench Vendor', professionKey: 'designers', pin: '1234' }),
        ]); } catch (e) { err = e; }
        disarmRace(db);
        distRes = { st: db._state, r1, r2, err };
      } finally { distDb.supabase = realSupabase; }
      cell('5.1 dist race: ONE agents row, no throw', !distRes.err && distRes.st.engine.agents.length === 1, distRes.err ? distRes.err.message : `rows=${distRes.st.engine.agents.length}`);
      cell('5.2 dist race: both callers hold the same agent_id', !!distRes.r1 && !!distRes.r2 && distRes.r1.agent_id === distRes.r2.agent_id);
      cell('5.3 dist race: ONE agent_owner (winner-only)', distRes.st.engine.agent_owner.length === 1, `owners=${distRes.st.engine.agent_owner.length}`);
      cell('5.4 dist race: exactly one existed:false', distRes.r1 && distRes.r2 && [distRes.r1.existed, distRes.r2.existed].filter((x) => x === false).length === 1);

      // Leg B — the transpiled CURED source: divergence from Leg A = stale dist.
      const curedTs = fs.readFileSync(SIGNUP_TS, 'utf8');
      const modB = signupHome(null, transpile(curedTs), 'cured');
      const srcRes = await runSignupRace(modB);
      cell('5.5 source leg agrees with dist leg (stale-dist tripwire)', !srcRes.err && srcRes.st.engine.agents.length === 1 && srcRes.st.engine.agent_owner.length === 1, srcRes.err ? srcRes.err.message : 'counts diverged');

      // Uncured cross-check — the pinned tree's signup.ts REDS on the same race.
      let unc = '';
      try { unc = execSync(`git show ${UNCURED_TIP}:src/engine/src/core/signup.ts`, { cwd: ROOT }).toString(); } catch (e) {}
      if (!unc) cell('5.6 uncured signup reachable', false, 'git show failed — refusing');
      else {
        const modU = signupHome(null, transpile(unc), 'uncured');
        const u = await runSignupRace(modU);
        cell('5.6 UNCURED signup REDS (loser throws 23505 or duplicates)', !!u.err || u.st.engine.agents.length !== 1, `err=${!!u.err} rows=${u.st.engine.agents.length}`);
      }

      // Mutations on the cured SOURCE (stripped), transpiled and raced.
      const stripped = stripComments(curedTs);
      const sigMuts = [
        ['5.7 ignoreDuplicates flip → double owner', `onConflict: 'user_id', ignoreDuplicates: true`, `onConflict: 'user_id', ignoreDuplicates: false`,
          (o) => o.st.engine.agent_owner.length !== 1],
        ['5.8 winner-only guard dropped → double owner', `if (wonTheInsert) {`, `if (true) {`,
          (o) => o.st.engine.agent_owner.length !== 1],
      ];
      for (const [name, from, to, convicts] of sigMuts) {
        if (!stripped.includes(from)) { cell(name, false, `anchor not in stripped source: ${from}`); continue; }
        const modM = signupHome(null, transpile(stripped.replace(from, to)), name.slice(0, 3).replace('.', '_'));
        const o = await runSignupRace(modM);
        cell(name, convicts(o), 'mutant survived');
      }
      // Returning-user path untouched.
      {
        const db = makeDb();
        db._state.engine.users.push({ id: 'eu-2', auth_user_id: 'auth-8', phone: '9888294440', name: 'Bench Vendor', pin_hash: null });
        db._state.engine.agents.push({ id: 'ag-old', user_id: 'eu-2', created_at: '2026-01-01T00:00:00Z' });
        distDb.supabase = engineClient(db);
        let r; try { r = await distSignup.createOwner({ authUserId: 'auth-8', phone: '9888294440', name: 'Bench Vendor', professionKey: 'designers', pin: '1234' }); }
        finally { distDb.supabase = realSupabase; }
        cell('5.9 returning user: adopts the eldest, existed:true, zero writes', r && r.agent_id === 'ag-old' && r.existed === true && db._state.engine.agents.length === 1);
      }
    }

    // ── §6 · F2(b) — THE RESOLVE WRAP'S DEGRADE, driven at the shipped seam ───
    {
      const vi = require(path.join(ROOT, 'src/lib/vendorInbound.js'));
      const chat = require(path.join(ROOT, 'src/api/vendor-engine/chat.js'));
      const errLog = [];
      const origErr = console.error;
      const capture = () => { errLog.length = 0; console.error = (...a) => errLog.push(a.map(String).join(' ')); };
      const release = () => { console.error = origErr; };
      const mkArgs = (db, { tier = 'basic', auth = 'auth-1', hasVendor = true, resolver } = {}) => {
        const sends = [];
        return {
          sends,
          args: {
            resolveAgentForVendor: resolver,
            supabase: db,
            sendWhatsApp: async (phone, line) => { sends.push(line); return { sid: 'SM-bench' }; },
            vendor: hasVendor ? { id: 'v-1', user_id: 'pu-1', tier } : null,
            user: { id: 'pu-1', auth_user_id: auth },
            convo: { id: 'c-1' },
            phone: '9888294440',
          },
        };
      };
      const dialDb = (pairs) => { const db = makeDb(); for (const [k, v] of pairs) db._state.pub.admin_config.push({ key: k, value: String(v) }); return db; };

      // 6.1 success pass-through — the wrap is invisible on a healthy resolve.
      {
        const { args, sends } = mkArgs(makeDb(), { resolver: async () => ({ agentId: 'ag-1' }) });
        const r = await vi.resolveAgentOrDegrade(args);
        cell('6.1 healthy resolve passes through untouched', r.agentId === 'ag-1' && sends.length === 0);
      }
      // 6.2 dial-zero degrade — the refusal in the shipped bytes, loud twice.
      {
        capture();
        const db = dialDb([['vendor_ai_daily_basic', 0], ['vendor_ai_monthly_basic', 250]]);
        const { args, sends } = mkArgs(db, { resolver: async () => { throw new Error('PGRST116 boom'); } });
        const r = await vi.resolveAgentOrDegrade(args);
        release();
        cell('6.2a dial-zero: degraded, one send, the SHIPPED WA_CAP_ZERO_LINE byte-equal', r.degraded === true && sends.length === 1 && sends[0] === chat.WA_CAP_ZERO_LINE);
        cell('6.2b dial-zero: refusal audited on public.messages', db._state.pub.messages.length === 1 && db._state.pub.messages[0].body === chat.WA_CAP_ZERO_LINE);
        cell('6.2c dial-zero: LOUD — "[agent:resolve] RESOLVE FAILED" logged', errLog.some((l) => l.includes('[agent:resolve] RESOLVE FAILED')));
        cell('6.2d dial-zero: the NOT-a-cap-event line logged (the masking clause)', errLog.some((l) => l.includes('NOT a cap event')));
      }
      // 6.3 dial above zero → rethrow (a false refusal to a paying vendor is a false statement).
      {
        capture();
        const db = dialDb([['vendor_ai_daily_basic', 5], ['vendor_ai_monthly_basic', 250]]);
        const { args, sends } = mkArgs(db, { resolver: async () => { throw new Error('boom'); } });
        let err = null; try { await vi.resolveAgentOrDegrade(args); } catch (e) { err = e; }
        release();
        cell('6.3 dial>0: rethrows to the dead-letter, zero sends, still loud', !!err && sends.length === 0 && errLog.some((l) => l.includes('RESOLVE FAILED')));
      }
      // 6.4 pre-onboarding (F-05.84's class) → the RULED dead-letter path, no probe.
      {
        capture();
        const db = dialDb([['vendor_ai_daily_basic', 0]]);
        const { args, sends } = mkArgs(db, { auth: null, resolver: async () => { throw new Error('missing authUserId or vendor'); } });
        let err = null; try { await vi.resolveAgentOrDegrade(args); } catch (e) { err = e; }
        release();
        cell('6.4 pre-onboarding rethrows even over a zero dial (F3 as ruled)', !!err && sends.length === 0);
      }
      // 6.5 the doctrine cell — the DIAL decides, never the tier WORD.
      {
        const db = dialDb([['vendor_ai_daily_essential', 0], ['vendor_ai_monthly_essential', 250]]);
        const { args, sends } = mkArgs(db, { tier: 'essential', resolver: async () => { throw new Error('boom'); } });
        capture(); const r = await vi.resolveAgentOrDegrade(args); release();
        cell('6.5a a zero-dialled NON-basic tier degrades too (0115\'s lesson honoured)', r.degraded === true && sends.length === 1);
        const db2 = dialDb([['vendor_ai_daily_essential', 15]]);
        const o2 = mkArgs(db2, { tier: 'essential', resolver: async () => { throw new Error('boom'); } });
        capture(); let err = null; try { await vi.resolveAgentOrDegrade(o2.args); } catch (e) { err = e; } release();
        cell('6.5b an open-dialled tier rethrows', !!err && o2.sends.length === 0);
      }
      // 6.6 probe unreachable → NEVER a silent guess; rethrow the ORIGINAL.
      {
        const db = dialDb([['vendor_ai_daily_basic', 0]]);
        db._state.failTables.add('public.admin_config');
        const { args, sends } = mkArgs(db, { resolver: async () => { throw new Error('the-original'); } });
        capture(); let err = null; try { await vi.resolveAgentOrDegrade(args); } catch (e) { err = e; } release();
        cell('6.6 probe failure rethrows the ORIGINAL error, zero sends', !!err && /the-original/.test(err.message) && sends.length === 0);
      }
      // 6.7 the REDUCTION cell — the probe makes buildMeta answer exactly
      // "does a dial read zero?", one home for the F-10.85 semantics.
      {
        const matrix = [
          [[['vendor_ai_daily_basic', 0]], true],
          [[['vendor_ai_daily_basic', 3], ['vendor_ai_monthly_basic', 0]], true],
          [[], false],                                    // absent → defaults 25/250
          [[['vendor_ai_daily_basic', -4]], false],       // negative → default (junk falls back)
          [[['vendor_ai_daily_basic', 3]], false],
        ];
        let ok = true, why = '';
        for (const [pairs, expectZero] of matrix) {
          const db = dialDb(pairs);
          const meta = await chat.buildMeta({ supabase: db, agentId: vi.NO_AGENT_USAGE_PROBE, tier: 'basic' });
          const zero = !!(meta && meta.state === 'capped' && meta.turns_cap === 0);
          if (zero !== expectZero) { ok = false; why = `${JSON.stringify(pairs)} → ${zero}, wanted ${expectZero}`; break; }
        }
        cell('6.7 probe reduction: capped ⇔ a dial reads zero (F-10.85 semantics, one home)', ok, why);
      }
    }

    // ── §7 · MUTATIONS ON THE SHIPPED WRAP (vendorInbound source, stripped) ───
    {
      const VI = path.join(ROOT, 'src/lib/vendorInbound.js');
      const stripped = stripComments(fs.readFileSync(VI, 'utf8'));
      const muts = [
        ['7.1 pre-onboarding rethrow severed → F-05.84 turns get a false refusal', `if (preOnboarding) throw resolveErr;`, `;`,
          async (mod, chat) => { // the 6.4 cell must red
            const db = makeDb(); db._state.pub.admin_config.push({ key: 'vendor_ai_daily_basic', value: '0' });
            let err = null, sends = [];
            try { await mod.resolveAgentOrDegrade({ resolveAgentForVendor: async () => { throw new Error('missing authUserId or vendor'); }, supabase: db, sendWhatsApp: async (p, l) => { sends.push(l); return {}; }, vendor: { id: 'v-1', user_id: 'pu-1', tier: 'basic' }, user: { id: 'pu-1', auth_user_id: null }, convo: { id: 'c-1' }, phone: '9888294440' }); } catch (e) { err = e; }
            return !(!!err && sends.length === 0); // convicts when the ruled rethrow is gone
          }],
        ['7.2 the loud-first log severed → the fault can hide (the binding clause)', `console.error('[agent:resolve] RESOLVE FAILED —', (resolveErr && resolveErr.message) || resolveErr);`, `;`,
          async (mod) => {
            const logs = []; const orig = console.error; console.error = (...a) => logs.push(a.join(' '));
            const db = makeDb(); db._state.pub.admin_config.push({ key: 'vendor_ai_daily_basic', value: '0' });
            try { await mod.resolveAgentOrDegrade({ resolveAgentForVendor: async () => { throw new Error('boom'); }, supabase: db, sendWhatsApp: async () => ({}), vendor: { id: 'v-1', user_id: 'pu-1', tier: 'basic' }, user: { id: 'pu-1', auth_user_id: 'auth-1' }, convo: { id: 'c-1' }, phone: '9888294440' }); } catch (e) {}
            console.error = orig;
            return !logs.some((l) => l.includes('RESOLVE FAILED \u2014')); // the loud line's own em-dash form — the degrade line quotes the token but never this shape
          }],
        ['7.3 dial predicate loosened → a paying vendor hears a false refusal', `if (meta && meta.state === 'capped' && meta.turns_cap === 0) {`, `if (true) {`,
          async (mod) => {
            const db = makeDb(); db._state.pub.admin_config.push({ key: 'vendor_ai_daily_basic', value: '5' });
            let sends = [], err = null;
            try { await mod.resolveAgentOrDegrade({ resolveAgentForVendor: async () => { throw new Error('boom'); }, supabase: db, sendWhatsApp: async (p, l) => { sends.push(l); return {}; }, vendor: { id: 'v-1', user_id: 'pu-1', tier: 'basic' }, user: { id: 'pu-1', auth_user_id: 'auth-1' }, convo: { id: 'c-1' }, phone: '9888294440' }); } catch (e) { err = e; }
            return !(err && sends.length === 0); // convicts when the open dial degrades anyway
          }],
      ];
      for (const [name, from, to, convicts] of muts) {
        if (!stripped.includes(from)) { cell(name, false, `anchor not in stripped source: ${from}`); continue; }
        const loaded = loadBeside(VI, stripped.replace(from, to), name.slice(0, 3).replace('.', '_')); tmpFiles.push(loaded.file);
        cell(name, await convicts(loaded.mod), 'mutant survived — the cell has no teeth');
      }
    }
  } finally {
    for (const f of tmpFiles) { try { fs.unlinkSync(f); } catch (e) {} }
  }

  console.log(`\nb05_f0583_race_bench: ${pass}/${pass + fail} GREEN${fail ? ' — RED: ' + red.join(', ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('BENCH CRASHED:', e && e.stack || e); process.exit(1); });
