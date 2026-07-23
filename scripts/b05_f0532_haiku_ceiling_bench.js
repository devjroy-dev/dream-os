// scripts/b05_f0532_haiku_ceiling_bench.js — TDW_05, F-05.32: SONNET OFF THE AGENT LANE.
//
// THE DISEASE (filed CE-64, CONVICTED LIVE at CE-65 — three production Sonnet turns on the
// bride wire, `[classifier] complex → Sonnet` on the Railway log): three agent-lane sites
// escalated the classifier's COMPLEX verdict to MODEL_SONNET, outside E-3's Haiku ceiling.
// E-3's committed sentence was true of what its bench measured (the compiled engine dist,
// per its own header) and false where nobody looked — the sample-not-the-set class, again.
//
// THE CURE (CE-66): three one-line de-escalations —
//   src/agent/brideEngine.js:172  runBrideAgenticTurn   (the bride wire — the convicted lane)
//   src/agent/engine.js:159       runAgenticTurn        (the vendor wire)
//   src/agent/engine.js:488       runCoupleAgenticTurn  (the couple-to-vendor wire)
// each now `const modelToUse = MODEL_HAIKU;`. The classifier STAYS — its call, its cost, its
// simple/complex verdict all untouched. Only the verdict's Sonnet consequence died.
//
// WHY THIS BENCH IS BEHAVIOURAL, NOT A GREP: a grep for MODEL_SONNET would pass on a tree
// where the ternary was restored one indirection away (a helper, a config read, a ?? chain).
// This bench drives the THREE REAL PRODUCTION FUNCTIONS with the REAL classifier returning a
// REAL COMPLEX verdict, and asserts the model that actually reached the API call. The only
// stub is the network boundary itself.
//
// THE VACUITY RULE, adopted from this micro's read-first and ruled into the founder's smoke
// card at CE-66: a green here witnesses NOTHING unless the classifier actually said COMPLEX.
// A simple verdict selected Haiku before the cure too. So every cell asserts BOTH halves off
// the production log line the founder himself greps —
//   `model selected: claude-haiku-4-5-20251001 (complex)`
// — the verdict and the selection in one string. Cell §1.4 exists to prove that guard bites.
//
// NON-VACUOUS BY PRODUCTION MUTATION (§2): the bench rewrites the ternary back into the real
// source files on disk, re-requires, and re-runs — one site restored REDs exactly its own
// cell and leaves its siblings green; all three restored REDs all three. Original bytes are
// captured before any mutation and restored in a finally, with byte-identity asserted at the
// end (§2.5). No fixture is touched to manufacture a red: the production code is the mutant.
//
// SCOPE DISCLOSED: this bench asserts the AGENT LANE's ceiling only. The document clerk's
// deliberate Sonnet pass (src/engine/src/core/distill.ts:112, live via server.ts:157/:180) is
// OUT OF SCOPE BY RULING — filed F-06.16 at CE-66 and homed to Block 06's ledger, where E-3
// lives. This bench must never be read as asserting "zero Sonnet in the estate"; that exact
// over-reading is what F-05.32 was.
//
// Runnable from any working directory:  node scripts/b05_f0532_haiku_ceiling_bench.js
'use strict';
const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

process.env.SUPABASE_URL              = process.env.SUPABASE_URL              || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-service-role-key';
process.env.ANTHROPIC_API_KEY         = process.env.ANTHROPIC_API_KEY         || 'bench-key';

const ROOT          = path.resolve(__dirname, '..');
const BRIDE_ENGINE  = path.join(ROOT, 'src/agent/brideEngine.js');
const ENGINE        = path.join(ROOT, 'src/agent/engine.js');
const SUPABASE_MOD  = path.join(ROOT, 'src/lib/supabase.js');

const HAIKU  = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-4-6';

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}
function section(s) { console.log(`\n── ${s} ${'─'.repeat(Math.max(0, 66 - s.length))}`); }

// ── the network boundary, and nothing else ───────────────────────────────────────────────
function textResp(text) {
  return { content: [{ type: 'text', text }], stop_reason: 'end_turn',
           usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } };
}
// The classifier's two entry points are identified by their OWN max_tokens signatures
// (classifier.js:72 → 5 for classifyMessage · classifier.js:187 → 8 for classifyVendorMessage).
// Answering 'complex' drives the REAL classifier to a REAL COMPLEX verdict; 'clear' keeps the
// vendor lane out of its ambiguity gate (engine.js:181), which would return before the loop.
function makeAnthropic(agentCalls) {
  return { messages: { create: async (params) => {
    if (params.max_tokens === 5) return textResp('complex');
    if (params.max_tokens === 8) return textResp('complex clear');
    agentCalls.push(params.model);
    return textResp('Noted.');
  } } };
}

// ── deterministic in-memory supabase fake (every real branch runs; nothing is short-circuited)
function makeSupabase() {
  function builder() {
    const b = {
      select: () => b, eq: () => b, neq: () => b, in: () => b, or: () => b, order: () => b,
      not: () => b, is: () => b, gte: () => b, lte: () => b, gt: () => b, lt: () => b,
      limit: () => b, range: () => b, insert: () => b, update: () => b, upsert: () => b,
      delete: () => b, contains: () => b, ilike: () => b, like: () => b, filter: () => b,
      schema: () => ({ from: () => builder() }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      single:      () => Promise.resolve({ data: null, error: null }),
      then: (res, rej) => Promise.resolve({ data: [], error: null }).then(res, rej),
    };
    return b;
  }
  return { from: () => builder(), schema: () => ({ from: () => builder() }),
           rpc: () => Promise.resolve({ data: null, error: null }),
           storage: { from: () => ({ upload: async () => ({ data: null, error: null }) }) } };
}

// brideSystemPrompt.js:29 binds the MODULE-LEVEL client, so it is seeded here rather than
// passed. Fixture setup — the production code under test is untouched by this.
function seedSupabaseModule() {
  require.resolve(SUPABASE_MOD);
  require.cache[SUPABASE_MOD] = { id: SUPABASE_MOD, filename: SUPABASE_MOD, loaded: true,
                                  exports: { supabase: makeSupabase() } };
}

// ── fixtures (Vera-era, onboarding COMPLETE so the agent loop actually runs) ──────────────
const COUPLE  = { id: 'cpl1', user_id: 'u1', onboarding_state: 'complete', bride_name: 'Vera',
                  wedding_date: '2026-12-11', wedding_city: 'Mumbai', budget_total: 2500000 };
const CUSER   = { id: 'u1', phone: '919625759924', name: 'Vera' };
const VENDOR  = { id: 'v1', user_id: 'vu1', business_name: 'Priya Films', category: 'photographer',
                  onboarding_state: 'complete', agent_id: 'ag1', tier: 'entry', timezone: 'Asia/Kolkata' };
const VUSER   = { id: 'vu1', phone: '918757788550', name: 'Vendor Owner' };
const CONVO   = { id: 'convo1', vendor_id: 'v1', couple_id: 'cpl1', kind: 'vendor_self' };

// THE MONEY SHAPE — the classifier's own COMPLEX limb (classifier.js:31/:35) and the shape of
// the turn F-05.32 was convicted on. This is the message the founder's card S1 sends.
const MONEY_MSG = 'Priya Decor quoted 2.5 lakhs for the reception backdrop — note it down.';

// ── the three drivers, each returning { model, log } ─────────────────────────────────────
function withCapturedLog(fn) {
  return async (...args) => {
    const lines = [];
    const real = console.log;
    console.log = (...a) => { lines.push(a.map(String).join(' ')); };
    try { const out = await fn(...args); return { ...out, log: lines.join('\n') }; }
    finally { console.log = real; }
  };
}

const driveBride = withCapturedLog(async () => {
  seedSupabaseModule();
  delete require.cache[BRIDE_ENGINE];
  const { runBrideAgenticTurn } = require(BRIDE_ENGINE);
  const calls = [];
  await runBrideAgenticTurn({ couple: { ...COUPLE }, user: { ...CUSER }, conversation: { ...CONVO },
    inboundMessage: MONEY_MSG, supabase: makeSupabase(), anthropic: makeAnthropic(calls) });
  return { model: calls[0], calls };
});

const driveVendor = withCapturedLog(async () => {
  seedSupabaseModule();
  delete require.cache[ENGINE];
  const { runAgenticTurn } = require(ENGINE);
  const calls = [];
  await runAgenticTurn({ vendor: { ...VENDOR }, user: { ...VUSER }, conversation: { ...CONVO },
    inboundMessage: MONEY_MSG, supabase: makeSupabase(), anthropic: makeAnthropic(calls) });
  return { model: calls[0], calls };
});

const driveCouple = withCapturedLog(async () => {
  seedSupabaseModule();
  delete require.cache[ENGINE];
  const { runCoupleAgenticTurn } = require(ENGINE);
  const calls = [];
  await runCoupleAgenticTurn({ vendor: { ...VENDOR }, vendorUser: { ...VUSER }, conversation: { ...CONVO },
    couplePhone: '919625759924', coupleId: 'cpl1',
    inboundMessage: MONEY_MSG, supabase: makeSupabase(), anthropic: makeAnthropic(calls) });
  return { model: calls[0], calls };
});

// Asserts BOTH halves: the classifier really said complex, and the wire really carried Haiku.
function assertHaikuOnComplex(r, prefix) {
  assert.ok(r.model, `no agent API call was made — the turn never reached the model (log:\n${r.log})`);
  assert.strictEqual(r.model, HAIKU, `the API call carried ${r.model}, not Haiku`);
  assert.notStrictEqual(r.model, SONNET, 'Sonnet reached the wire');
  assert.ok(new RegExp(`\\[${prefix}\\] model selected: ${HAIKU} \\(complex`).test(r.log),
    `the production log line did not read Haiku-on-complex — VACUOUS GREEN RISK. log:\n${r.log}`);
}

// ── §2's mutant: the exact pre-cure byte, restored into the real source ──────────────────
const TERNARY = 'complexity === COMPLEXITY.COMPLEX ? MODEL_SONNET : MODEL_HAIKU';
const SITES = [
  { name: 'brideEngine.js:172 (runBrideAgenticTurn)', file: BRIDE_ENGINE, prefix: 'bride-agent',
    cured: '  const modelToUse = MODEL_HAIKU;\n  console.log(`[bride-agent] model selected:',
    mutant: `  const modelToUse = ${TERNARY};\n  console.log(\`[bride-agent] model selected:` },
  { name: 'engine.js:159 (runAgenticTurn)', file: ENGINE, prefix: 'agent',
    cured: '  const modelToUse  = MODEL_HAIKU;\n  console.log(`[agent] model selected:',
    mutant: `  const modelToUse  = ${TERNARY};\n  console.log(\`[agent] model selected:` },
  { name: 'engine.js:488 (runCoupleAgenticTurn)', file: ENGINE, prefix: 'couple-agent',
    cured: '  const modelToUse  = MODEL_HAIKU;\n  console.log(`[couple-agent] model selected:',
    mutant: `  const modelToUse  = ${TERNARY};\n  console.log(\`[couple-agent] model selected:` },
];
const DRIVERS = { 'bride-agent': driveBride, 'agent': driveVendor, 'couple-agent': driveCouple };

const ORIGINAL = new Map([[BRIDE_ENGINE, fs.readFileSync(BRIDE_ENGINE, 'utf8')],
                          [ENGINE,       fs.readFileSync(ENGINE, 'utf8')]]);

function restoreAll() { for (const [f, bytes] of ORIGINAL) fs.writeFileSync(f, bytes); }
function mutate(sites) {
  restoreAll();
  for (const s of sites) {
    const src = fs.readFileSync(s.file, 'utf8');
    assert.ok(src.includes(s.cured), `MUTATION SETUP FAILED — cured anchor absent at ${s.name}`);
    fs.writeFileSync(s.file, src.replace(s.cured, s.mutant));
  }
}

(async () => {
  try {
    // ═══ §1 — THE CURE, BEHAVIOURALLY, ON A REAL COMPLEX VERDICT ═══
    section('§1 — the Haiku ceiling holds on a REAL complex verdict (real functions, real classifier)');

    await t('§1.1 bride wire (brideEngine:172) — the convicted lane: complex verdict, Haiku on the wire', async () => {
      assertHaikuOnComplex(await driveBride(), 'bride-agent');
    });
    await t('§1.2 vendor wire (engine:159): complex verdict, Haiku on the wire', async () => {
      assertHaikuOnComplex(await driveVendor(), 'agent');
    });
    await t('§1.3 couple wire (engine:488): complex verdict, Haiku on the wire', async () => {
      assertHaikuOnComplex(await driveCouple(), 'couple-agent');
    });
    await t('§1.4 THE VACUITY GUARD BITES: a simple verdict is NOT accepted as proof of the cure', async () => {
      // Same production code, classifier answering 'simple'. Haiku is still selected — and the
      // guard must still REFUSE it, because pre-cure code would have selected Haiku here too.
      const lines = []; const real = console.log;
      console.log = (...a) => lines.push(a.map(String).join(' '));
      let model;
      try {
        seedSupabaseModule(); delete require.cache[BRIDE_ENGINE];
        const { runBrideAgenticTurn } = require(BRIDE_ENGINE);
        const calls = [];
        const simpleAnthropic = { messages: { create: async (p) => {
          if (p.max_tokens === 5 || p.max_tokens === 8) return textResp('simple');
          calls.push(p.model); return textResp('Noted.');
        } } };
        await runBrideAgenticTurn({ couple: { ...COUPLE }, user: { ...CUSER }, conversation: { ...CONVO },
          inboundMessage: 'ok thanks', supabase: makeSupabase(), anthropic: simpleAnthropic });
        model = calls[0];
      } finally { console.log = real; }
      assert.strictEqual(model, HAIKU, 'sanity: a simple verdict still selects Haiku');
      assert.throws(() => assertHaikuOnComplex({ model, log: lines.join('\n') }, 'bride-agent'),
        'the vacuity guard MUST reject a green earned on a simple verdict');
    });

    // ═══ §2 — NON-VACUITY, BY MUTATING THE PRODUCTION SOURCE ═══
    section('§2 — non-vacuous: the ternary restored into the REAL source REDs exactly its own cell');

    for (const site of SITES) {
      await t(`§2.1 ${site.name} restored → its own cell REDs`, async () => {
        mutate([site]);
        const r = await DRIVERS[site.prefix]();
        assert.strictEqual(r.model, SONNET, `mutant did not route Sonnet — the cell is not load-bearing (got ${r.model})`);
        assert.throws(() => assertHaikuOnComplex(r, site.prefix), 'the cured assertion MUST fail on the mutant');
        restoreAll();
      });
    }

    await t('§2.2 a restored site leaves its SIBLINGS green — the three cells are independent', async () => {
      mutate([SITES[0]]);
      const bride = await driveBride();
      const vendor = await driveVendor();
      const couple = await driveCouple();
      assert.strictEqual(bride.model, SONNET, 'the mutated site must route Sonnet');
      assertHaikuOnComplex(vendor, 'agent');
      assertHaikuOnComplex(couple, 'couple-agent');
      restoreAll();
    });

    await t('§2.3 ALL THREE restored → all three cells RED', async () => {
      mutate(SITES);
      for (const site of SITES) {
        const r = await DRIVERS[site.prefix]();
        assert.strictEqual(r.model, SONNET, `${site.name} did not route Sonnet under full mutation (got ${r.model})`);
      }
      restoreAll();
    });

    await t('§2.4 the classifier is UNTOUCHED by the cure — the complex verdict still exists and still logs', async () => {
      delete require.cache[path.join(ROOT, 'src/agent/classifier.js')];
      const { classifyMessage, classifyVendorMessage } = require(path.join(ROOT, 'src/agent/classifier.js'));
      const lines = []; const real = console.log;
      console.log = (...a) => lines.push(a.map(String).join(' '));
      let v1, v2;
      try {
        v1 = await classifyMessage(MONEY_MSG, [], makeAnthropic([]));
        v2 = await classifyVendorMessage(MONEY_MSG, [], makeAnthropic([]));
      } finally { console.log = real; }
      assert.strictEqual(v1, 'complex', 'classifyMessage no longer returns complex — the fence was breached');
      assert.strictEqual(v2.complexity, 'complex', 'classifyVendorMessage no longer returns complex');
      assert.ok(/\[classifier\] complex/.test(lines.join('\n')), 'the classifier log line is gone');
      // FORK 2 (CE-66, amended fence): the arrow asserting a now-dead path is retired. A log
      // reading `complex → Sonnet` beside a Haiku selection is how F-05.32 was born.
      assert.ok(!/→ Sonnet/.test(lines.join('\n')), 'the log still advertises a Sonnet route that no longer exists');
    });

    await t('§2.5 the production tree is byte-identical to where the bench found it', async () => {
      for (const [f, bytes] of ORIGINAL) {
        assert.strictEqual(fs.readFileSync(f, 'utf8'), bytes, `${path.basename(f)} was left mutated`);
      }
    });

  } finally {
    restoreAll();   // a crash mid-mutation must never leave the founder's tree dirty
  }

  console.log(`\nb05_f0532_haiku_ceiling_bench: ${pass} passed, ${fail} failed`);
  if (fail === 0) {
    console.log('GREEN — the agent lane\'s ceiling is Haiku on a REAL complex verdict, all three wires;');
    console.log('        non-vacuous by production mutation; the classifier survives whole.');
    console.log('        SCOPE: the agent lane only. distill.ts:112 is F-06.16, homed to Block 06.');
  }
  process.exit(fail === 0 ? 0 : 1);
})();
