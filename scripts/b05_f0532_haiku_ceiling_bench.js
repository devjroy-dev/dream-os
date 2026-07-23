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

// driveVendor RETIRED AT M5 with the runAgenticTurn site it drove.

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

// ══ LABELED RE-BASELINE — ARC M5 (C6 / F-05.44, CE ruling R-M5-3). ══
// COUNTS DISCLOSED IN THE HANDOVER. THE ARC'S ONLY FLOOR MOVE, F4-ledger.
//
// TWO THINGS CHANGED UNDER ME, BOTH BY CHARTER, NEITHER BY DRIFT:
// (1) The `(complex)` LOG TOKEN IS GONE from both surviving sites. It was the sole
//     consumer of a paid Haiku classifier round-trip per turn, and M5 deleted the
//     call. This assertion's second half therefore cannot be kept as written — it
//     demanded evidence the estate has deliberately stopped producing. It is NOT
//     dropped: it re-aims at what still proves the same property, that the log line
//     names Haiku on the wire it actually used.
// (2) The `agent` (runAgenticTurn) SITE IS GONE — the function was deleted whole,
//     zero callers, ask-gate included. Its cell is RETIRED BY NAME rather than
//     quietly dropped, per Ruling №1's bench-follows-the-law.
// STILL TRUE AND STILL ASSERTED: §3's classifier cells drive classifier.js directly.
// That file SURVIVES INTACT as a defused island — it EXISTS AND IS UNCALLED — so
// those cells now assert the behaviour of a live, reachable-by-require module that
// no production path invokes. That is deliberate (R-M5-3's revival pointer), and
// saying so here is the difference between a kept cell and a stale one.
function assertHaikuOnTheWire(r, prefix) {
  assert.ok(r.model, `no agent API call was made — the turn never reached the model (log:\n${r.log})`);
  assert.strictEqual(r.model, HAIKU, `the API call carried ${r.model}, not Haiku`);
  assert.notStrictEqual(r.model, SONNET, 'Sonnet reached the wire');
  assert.ok(new RegExp(`\\[${prefix}\\] model selected: ${HAIKU}`).test(r.log),
    `the production log line did not name Haiku on the wire — VACUOUS GREEN RISK. log:\n${r.log}`);
}

// ── §2's mutant: the exact pre-cure byte, restored into the real source ──────────────────
// RE-BASELINED AT M5: the pre-cure byte was a TERNARY on the classifier's verdict.
// M5 deleted the verdict, so that byte cannot be restored — `complexity` no longer
// exists to compare. The mutant becomes MODEL_SONNET DIRECT: the identical disease
// (Sonnet on the wire) expressed in the world that now exists. A mutant that cannot
// compile is not a weaker mutant, it is no mutant at all.
const TERNARY = 'MODEL_SONNET';
const SITES = [
  { name: 'brideEngine.js:172 (runBrideAgenticTurn)', file: BRIDE_ENGINE, prefix: 'bride-agent',
    cured: '  const modelToUse = MODEL_HAIKU;\n  console.log(`[bride-agent] model selected:',
    mutant: `  const modelToUse = ${TERNARY};\n  console.log(\`[bride-agent] model selected:` },
  // RETIRED BY NAME AT M5: the `agent` site was runAgenticTurn, deleted whole
  // (zero callers, ask-gate included). A cell guarding a function that no longer
  // exists is not a weaker cell — it is a green over nothing.
  { name: 'engine.js:488 (runCoupleAgenticTurn)', file: ENGINE, prefix: 'couple-agent',
    cured: '  const modelToUse  = MODEL_HAIKU;\n  console.log(`[couple-agent] model selected:',
    mutant: `  const modelToUse  = ${TERNARY};\n  console.log(\`[couple-agent] model selected:` },
];
const DRIVERS = { 'bride-agent': driveBride, 'couple-agent': driveCouple }; // 'agent' retired at M5

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
    section('§1 — the Haiku ceiling holds on the REAL functions on the wire (M5: the verdict is gone; the ceiling is structural)');

    await t('§1.1 bride wire — the convicted lane: Haiku on the wire', async () => {
      assertHaikuOnTheWire(await driveBride(), 'bride-agent');
    });
    // §1.2 RETIRED BY NAME AT M5 with runAgenticTurn, the wire it drove.
    await t('§1.3 couple wire: Haiku on the wire', async () => {
      assertHaikuOnTheWire(await driveCouple(), 'couple-agent');
    });
    await t('§1.4 THE CEILING IS STRUCTURAL NOW — no verdict, no branch (RE-BASELINED AT M5)', async () => {
      // RETIRED AND REPLACED, not dropped. As shipped, §1.4 drove a SIMPLE verdict and
      // required the assertion to REFUSE it — because pre-cure code would have picked
      // Haiku on a simple message anyway, so only a COMPLEX verdict proved the ceiling.
      // That guard depended on a classifier verdict being readable. M5 deleted the
      // classifier calls, so the evidence it demanded CANNOT EXIST — the same shape as
      // CE-66's S2 cell that "demanded evidence that cannot exist".
      // WHAT REPLACES IT IS STRONGER: the ceiling was a BRANCH that always chose Haiku;
      // it is now the ABSENCE of a branch. A conditional cannot pick Sonnet if no
      // conditional is left to pick anything. Asserted on the source, both survivors.
      const fs2 = require('fs');
      for (const [f, label] of [[BRIDE_ENGINE, 'brideEngine'], [ENGINE, 'engine']]) {
        const src = fs2.readFileSync(f, 'utf8').split('\n')
          .filter(l => !l.trim().startsWith('//')).join('\n');
        assert.ok(/const modelToUse\s*=\s*MODEL_HAIKU;/.test(src),
          `${label}: the ceiling must be an unconditional assignment`);
        assert.ok(!/\?\s*MODEL_SONNET/.test(src) && !/MODEL_SONNET\s*:/.test(src),
          `${label}: a conditional reaching MODEL_SONNET survived the deletion`);
        assert.ok(!/classifyMessage\(|classifyVendorMessage\(/.test(src),
          `${label}: a classifier call survived M5 — the verdict is supposed to be gone`);
      }
    });

    // ═══ §2 — NON-VACUITY, BY MUTATING THE PRODUCTION SOURCE ═══
    section('§2 — non-vacuous: the ternary restored into the REAL source REDs exactly its own cell');

    for (const site of SITES) {
      await t(`§2.1 ${site.name} restored → its own cell REDs`, async () => {
        mutate([site]);
        const r = await DRIVERS[site.prefix]();
        assert.strictEqual(r.model, SONNET, `mutant did not route Sonnet — the cell is not load-bearing (got ${r.model})`);
        assert.throws(() => assertHaikuOnTheWire(r, site.prefix), 'the cured assertion MUST fail on the mutant');
        restoreAll();
      });
    }

    await t('§2.2 a restored site leaves its SIBLINGS green — the three cells are independent', async () => {
      mutate([SITES[0]]);
      const bride = await driveBride();
      const couple = await driveCouple();   // 'agent' retired at M5 with its function
      assert.strictEqual(bride.model, SONNET, 'the mutated site must route Sonnet');
      assertHaikuOnTheWire(couple, 'couple-agent');
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
    console.log('GREEN — the agent lane\'s ceiling is Haiku on the real wires (two survive M5);');
    console.log('        non-vacuous by production mutation; the classifier survives whole.');
    console.log('        SCOPE: the agent lane only. distill.ts:112 is F-06.16, homed to Block 06.');
  }
  process.exit(fail === 0 ? 0 : 1);
})();
