'use strict';
// scripts/b05_f0583_race_bench.js
// ═══════════════════════════════════════════════════════════════════════════════
// R-36.5 F2(b) · THE RESOLVE-WRAP DEGRADE — the dial-scoped refusal's instrument.
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHAT THIS FILE IS NOW, AND WHY IT IS NOT WHAT ITS NAME SAYS.
// It was born at e97019d as a 35-cell proof of the WHOLE R-36.5 fence — the
// agentBridge/createOwner race cure (F1) AND the resolve-wrap degrade (F2b). A
// two-seat collision then landed a SECOND, independent F1 implementation at
// 5951efa, on top of this one. That implementation is the shipped one; this file's
// §2/§3/§4/§5 mutation anchors gripped source bytes that no longer exist, and
// three cells reddened for that reason alone.
//
// RULED (R-36.5 rider, chair): the F1 cells are DELETED, not re-anchored. F1's one
// instrument is `scripts/b05_r365_agent_race_bench.js`, shipped at 5951efa, 17
// cells, both-ways proven. Re-anchoring here would give a live law a SECOND mouth,
// and two instruments for one law is how they drift apart. What survives is the
// coverage nothing else has: §6 and §7, the F2(b) degrade.
//
// SO: ONE LAW, ONE INSTRUMENT. F1 → b05_r365_agent_race_bench. F2(b) → here.
//
// THE FILENAME STILL CARRIES F-05.83's NUMBER and the ruling kept the file rather
// than renaming it. Read the header, not the name: F-05.83 was the race, and the
// race is proven next door.
//
// WHAT F2(b) IS. When `resolveAgentForVendor` throws, the turn used to die at the
// function-level dead-letter and the vendor heard the hiccup line — including the
// basic-tier vendor who was owed the honest cap-zero refusal, because the cap gate
// sits BELOW the resolve and never ran. `resolveAgentOrDegrade` wraps it and, on a
// failure, degrades to that refusal — but ONLY when the vendor's own dial reads
// zero. It keys on `turns_cap === 0` and NEVER on the tier word (0115's lesson:
// a tier-word predicate is a rename's hostage), it rethrows for pre-onboarding
// vendors (F3 as ruled), and it logs `[agent:resolve] RESOLVE FAILED` loudly and
// first, so a degrade can never mask the fault that caused it.
//
// NON-VACUITY. §7 applies MUTATIONS TO THE SHIPPED PRODUCTION SOURCE
// (`src/lib/vendorInbound.js`, comment-stripped first per F-06.192 — a mutation
// that can land in prose is absorbed by prose) and asserts each named cell reds.
// Mutants load as temp modules BESIDE their originals so every relative require
// resolves identically; temp files are deleted in finally. §6 drives the REAL
// exported `resolveAgentOrDegrade`, never a re-implementation — e97019d exported
// it and `NO_AGENT_USAGE_PROBE` for exactly this reason (R-29.34's callable
// doctrine), and this file is their only reader.
//
// EXIT CODE IS THE VERDICT (floor law); the count line is for humans.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { stripComments } = require('./lib/stripComments'); // TDW_STRIPPER_CANARY — coverage-listed by b07_f0774_stripper_bench §4

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://bench.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-dummy';

const ROOT = path.resolve(__dirname, '..');

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
            const out = applyFilters(rows, q);
            if (q.count) return { data: null, error: null, count: out.length };
            return shape(out);
          }
          if (q.op === 'update') {
            applyFilters(rows, q).forEach((r) => Object.assign(r, q.payload));
            return { data: null, error: null };
          }
          // WRITES on engine.agents wait at the barrier — the choreography.
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

// Load a module from source TEXT, placed BESIDE a sibling so relative requires
// resolve identically; removed in finally by the caller.
function loadBeside(siblingAbs, text, tag) {
  const p = path.join(path.dirname(siblingAbs), `.__mut_${tag}_${process.pid}.js`);
  fs.writeFileSync(p, text);
  delete require.cache[p];
  return { mod: require(p), file: p };
}

(async () => {
  console.log('b05_f0583_race_bench — R-36.5 F2(b), the resolve-wrap degrade');
  const BRIDGE = path.join(ROOT, 'src/api/middleware/agentBridge.js');
  const tmpFiles = [];
  try {
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
      // ── §0.Z · THE STRIPPER'S CALL-SITE (F-07.99) — RE-SITED, NOT LOST ────────
      // THIS CELL USED TO BE 4.4, inside the agentBridge mutation block the prune
      // deleted. It is the estate's standing requirement on any bench holding a
      // stripper (b07_f0774_stripper_bench §4.4 enforces it BY NAME), so cutting §4
      // without moving this would have turned a clean prune into a floor delta one
      // bench over. It belongs here now because §7 is where this file still strips.
      cell('§0.Z INVOCATION (F-07.99) — this bench really CALLS its stripper, and it bites',
        stripped.length < fs.readFileSync(VI, 'utf8').length && !/R-36\.5 fork F2 arm \(b\)/.test(stripped),
        'the stripper returned the file unchanged, or left a known comment standing — every §7 anchor is then matching prose');
    }
  } finally {
    for (const f of tmpFiles) { try { fs.unlinkSync(f); } catch (e) {} }
  }

  console.log(`\nb05_f0583_race_bench: ${pass}/${pass + fail} GREEN${fail ? ' — RED: ' + red.join(', ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('BENCH CRASHED:', e && e.stack || e); process.exit(1); });
