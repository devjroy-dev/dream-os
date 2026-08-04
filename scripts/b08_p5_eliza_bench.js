#!/usr/bin/env node
// scripts/b08_p5_eliza_bench.js — TDW_08 P5 Phase 4: ELIZA.
//
// Runnable from ANY working directory (Q-SP-5: a cure nobody can re-run quietly
// stops being a cure). `node scripts/b08_p5_eliza_bench.js` · `--mutations`
// lists the arms · `--mutate=NAME` drives one.
//
// ═══ F-08.65 BINDS THIS FILE ════════════════════════════════════════════════
// The harness drives `runCoupleAgenticTurn` — production's own function, through
// the production seam — and NEVER a second implementation of the turn. The
// Closer's arc paid for that law twice: a harness that called the model directly
// could not see the normalizer, the signature or the watcher, and two link
// mangles were read as production defects the production seam had already
// corrected. "A transcript that is not what the prospect receives is not
// evidence about what the prospect receives." The couple lane inherits it whole.
//
// So the model is INJECTED at `src/lib/llm.js`'s seam via the require cache, and
// every prompt these cells read is the prompt the model was actually handed.
//
// ═══ F-08.53's THREE LIMBS ══════════════════════════════════════════════════
// LIVE-FORM TELLS — the route cells assert against `modelRouter`'s own DEFAULTS
//   object and `SURFACE_ALLOW`, never a string pasted in here, so seed and
//   default cannot drift apart silently.
// BANG-FREE LINES — no cell asserts only a negation whose passing state is
//   indistinguishable from an absent one: every "the lie is gone" cell has a
//   positive twin asserting the honest byte arrived.
// EVERY LIMB PROVEN ABLE TO FIRE — the mutation arms below hit PRODUCTION
//   SOURCE, each named, each producing a clean red. A mutation whose anchor has
//   moved EXITS 2 with a stated reason rather than passing quietly.
'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const ENGINE_P  = 'src/agent/engine.js';
const SHELL_P   = 'src/agent/coupleSystemPrompt.js';
const SOUL_P    = 'src/agent/souls/elizaSoul.js';
const ROUTER_P  = 'src/lib/modelRouter.js';
const FLAGS_P   = 'src/lib/laneFlags.js';
const MIGRATION = 'db/migrations/0112_couple_route_and_flag.sql';

// ── MUTATION ARMS — production source, in memory, before require ────────────
const MUTATIONS = {
  gate_always_on: [SHELL_P,
    s => s.replace('const header = useEliza ? elizaHeader : legacyHeader;',
                   'const header = elizaHeader;')],
  gate_never_read: [ENGINE_P,
    s => s.replace("const useEliza = await readLaneFlag(supabase, 'couple.eliza_enabled');",
                   'const useEliza = false;')],
  // Re-aimed when the cure went unconditional: the arms now restore the DELETED
  // instruction at each site, which is the disease exactly as it stood at
  // bfcb88e — one arm per branch, because F-08.52 lived at two and a single arm
  // would prove only one.
  lie_restored: [SHELL_P,
    s => s.replace('  const honestyRuleFirst     = HONESTY_RULE;',
                   "  const honestyRuleFirst     = `Never mention you are an AI. You are ${vendorName}'s assistant.`;")],
  lie_restored_returning: [SHELL_P,
    s => s.replace('  const honestyRuleReturning = HONESTY_RULE;',
                   "  const honestyRuleReturning = `Never mention that you are an AI. You are ${vendorName}'s assistant.`;")],
  honesty_byte_drifts: [SOUL_P,
    s => s.replace('  `If she asks whether you are an AI, say yes plainly and continue with what she wanted.`;',
                   '  `Be helpful and warm.`;')],
  name_hardcoded: [SHELL_P,
    s => s.replace('? vendor.assistant_name.trim()\n    : ELIZA;',
                   "? vendor.assistant_name.trim()\n    : 'Eliza';")],
  rename_ignored: [SHELL_P,
    s => s.replace("const assistantName = (vendor?.assistant_name && vendor.assistant_name.trim())",
                   "const assistantName = (false && vendor.assistant_name.trim())")],
  allowset_bypassed: [ROUTER_P,
    s => s.replace('  const allow = SURFACE_ALLOW[surface];\n  if (!allow) return route;',
                   '  const allow = SURFACE_ALLOW[surface];\n  if (allow || !allow) return route;')],
  allowset_misses_split: [ROUTER_P,
    s => s.replace("for (const field of ['model', 'nudge_model', 'donna_model'])",
                   "for (const field of ['model'])")],
  flag_fails_open: [FLAGS_P,
    s => s.replace("  'couple.eliza_enabled': false,", "  'couple.eliza_enabled': true,")],
  flag_accepts_junk: [FLAGS_P,
    s => s.replace('val = parsed === true;', 'val = !!parsed;')],
};

const argv    = process.argv.slice(2);
const MUTATE  = (argv.find(a => a.startsWith('--mutate=')) || '').split('=')[1] || null;
if (argv.includes('--mutations')) {
  console.log(Object.keys(MUTATIONS).join('\n'));
  process.exit(0);
}

// ── the in-memory mutation, applied before anything is required ─────────────
const ORIGINALS = new Map();
function applyMutation(name) {
  const arm = MUTATIONS[name];
  if (!arm) { console.error(`UNKNOWN MUTATION: ${name}`); process.exit(2); }
  const [file, fn] = arm;
  const full = path.join(ROOT, file);
  const before = fs.readFileSync(full, 'utf8');
  const after  = fn(before);
  if (after === before) {
    // F-08.53 limb 3: a stale anchor EXITS 2 with a reason. It never passes
    // quietly, because a mutation that applies to nothing proves nothing and a
    // green over it is indistinguishable from no test at all.
    console.error(`MUTATION ANCHOR STALE: "${name}" changed no byte of ${file}. `
      + `Re-derive the anchor before trusting any result from this arm.`);
    process.exit(2);
  }
  ORIGINALS.set(full, before);
  fs.writeFileSync(full, after);
}
function restoreAll() { for (const [f, b] of ORIGINALS) fs.writeFileSync(f, b); }
process.on('exit', restoreAll);
if (MUTATE) applyMutation(MUTATE);

// ── THE INJECTED MODEL, at llm.js's own seam ────────────────────────────────
// Everything the turn hands the model is captured here. Nothing else about the
// turn is stubbed: the gate, the router, the allow-set, the shell assembly and
// the tool loop are all production code doing production work.
const CAPTURED = [];
const llmPath = require.resolve(path.join(ROOT, 'src/lib/llm.js'));
const realLlm = require(llmPath);
require.cache[llmPath].exports = {
  ...realLlm,
  llmCreate: async (provider, params) => {
    CAPTURED.push({ provider, params });
    return {
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 't1', name: 'respond_to_couple',
                  input: { message: 'Noted — passing that on.' } }],
      usage: { input_tokens: 10, output_tokens: 5 },
    };
  },
};

const { runCoupleAgenticTurn } = require(path.join(ROOT, ENGINE_P));
const router = require(path.join(ROOT, ROUTER_P));
const flags  = require(path.join(ROOT, FLAGS_P));
const soul   = require(path.join(ROOT, SOUL_P));
const shell  = require(path.join(ROOT, SHELL_P));

// ── a supabase stub that answers only what the turn actually asks ───────────
// ⚠ `returningLead` EXISTS BECAUSE THIS STUB SILENTLY FAKED A GREEN.
// `isReturningBride` is not a parameter — the turn DERIVES it from a `leads`
// lookup (engine.js:96-102, `.eq('vendor_id').eq('phone').maybeSingle()`, true
// when the row carries a name). The first version of this stub answered null to
// every table, so every "returning" cell ran the FIRST-CONTACT branch and passed.
// Caught by the `lie_restored_returning` mutation coming back 26/0 — the arm
// restored the returning branch's lie and not one cell could see it. Recorded
// rather than quietly repaired: a stub that answers the wrong question is the
// F-08.65 class one layer in.
function fakeSupabase({ elizaEnabled = false, route = null, returningLead = false } = {}) {
  const cfg = {
    'couple.eliza_enabled': JSON.stringify(!!elizaEnabled),
    ...(route ? { 'model.wa_couple.default': JSON.stringify(route) } : {}),
  };
  return {
    from(table) {
      const api = {
        select: () => api, eq: (col, val) => { api._eq = api._eq || {}; api._eq[col] = val; return api; },
        gte: () => api, order: () => api, limit: async () => ({ data: [] }),
        insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'x' } }) }) }),
        update: () => api,
        async maybeSingle() {
          if (table === 'admin_config') {
            const k = api._eq && api._eq.key;
            return { data: cfg[k] != null ? { value: cfg[k] } : null };
          }
          if (table === 'leads' && returningLead) {
            return { data: { id: 'l1', name: 'Priya', intent_summary: null, intent_summary_at: null } };
          }
          return { data: null };
        },
      };
      return api;
    },
  };
}

const VENDOR = { id: 'v1', category: 'photography', city: 'Delhi', open_to_travel: true };
const VUSER  = { name: 'Swati', phone: '+919888294440' };
const CONVO  = { id: 'c1' };

async function drive({ elizaEnabled = false, vendor = VENDOR, returning = false, route = null } = {}) {
  CAPTURED.length = 0;
  router._resetRouteCache();
  flags._resetLaneFlagCache();
  await runCoupleAgenticTurn({
    vendor, vendorUser: VUSER, conversation: CONVO,
    couplePhone: '+918595986978', coupleId: null,
    inboundMessage: returning ? 'any update?' : 'hi, do you shoot in Jaipur in December?',
    supabase: fakeSupabase({ elizaEnabled, route, returningLead: returning }), anthropic: null,
  });
  assert.ok(CAPTURED.length > 0, 'the turn never reached the model — the harness is not driving production');
  // THE BRANCH IS ASSERTED, NOT ASSUMED. `returning` is an input to a LOOKUP,
  // not to the composer, so a cell that merely passes the flag proves nothing
  // about which branch ran. The returning branch is the one that says so.
  const got = CAPTURED[0];
  const isReturning = /has reached out to Swati before/.test(got.params.system);
  assert.strictEqual(isReturning, !!returning,
    `the turn ran the ${isReturning ? 'RETURNING' : 'FIRST-CONTACT'} branch when ${returning ? 'RETURNING' : 'FIRST-CONTACT'} was asked for`);
  return got;
}

// ── runner ──────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}
const H = (s) => console.log(`\n── ${s} ${'─'.repeat(Math.max(0, 66 - s.length))}`);

(async () => {

H('§1 — THE GATE: PUSH IS NOT SPEAK (F-08.56)');

await t('§1.1 flag OFF -> the model is handed the LEGACY prompt, unnamed', async () => {
  const c = await drive({ elizaEnabled: false });
  const p = c.params.system;
  assert.ok(!/\bEliza\b/.test(p), 'Eliza reached the wire with the lane flag off');
  assert.ok(/You are a friendly assistant for Swati/.test(p), 'the legacy header is not what shipped');
});

await t('§1.2 flag ON -> the model is handed ELIZA, named and souled', async () => {
  const c = await drive({ elizaEnabled: true });
  const p = c.params.system;
  assert.ok(/You are Eliza, the assistant for Swati/.test(p), 'the Eliza header never reached the model');
  assert.ok(p.includes(soul.ELIZA_SOUL), 'the soul is not in the prompt the model received');
});

await t('§1.3 the flag FAILS CLOSED — no row, junk value, and a dead database all read OFF', async () => {
  assert.strictEqual(await flags.readLaneFlag(null, 'couple.eliza_enabled'), false, 'no supabase read true');
  flags._resetLaneFlagCache();
  const junk = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { value: '"yes"' } }) }) }) }) };
  assert.strictEqual(await flags.readLaneFlag(junk, 'couple.eliza_enabled'), false, '"yes" opened a lane');
  flags._resetLaneFlagCache();
  const dead = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => { throw new Error('down'); } }) }) }) };
  assert.strictEqual(await flags.readLaneFlag(dead, 'couple.eliza_enabled'), false, 'an unreachable DB opened a lane');
});

await t('§1.4 the gate is read at ONE site, and the turn is the site', () => {
  const e = read(ENGINE_P);
  assert.strictEqual((e.match(/readLaneFlag\(/g) || []).length, 1, 'the gate is read more than once');
  const door = read('src/lib/vendorInbound.js');
  assert.ok(!/readLaneFlag|eliza_enabled/.test(door),
    'a gate leaked into the door — four call sites is four drifts (fork 5(b), refused)');
  assert.strictEqual((door.match(/await runCoupleAgenticTurn\(/g) || []).length, 4,
    'the seam is no longer four callers — re-derive the gate siting before trusting §1.4');
});

H('§2 — F-08.52 IS DEAD ON THE ELIZA PATH, BOTH BRANCHES (fork 7)');

for (const [label, returning] of [['first-contact', false], ['returning', true]]) {
  await t(`§2.${returning ? 2 : 1} ${label}: the instruction to lie is gone, and the honest one arrived`, async () => {
    const c = await drive({ elizaEnabled: true, returning });
    const p = c.params.system;
    assert.ok(!/[Nn]ever mention (that )?you are an AI/.test(p), `the F-08.52 byte survived on the ${label} branch`);
    assert.ok(p.includes(soul.HONESTY_RULE), `the sealed honesty byte is absent on the ${label} branch`);
    assert.ok(p.includes('A confession needs a pause; a fact does not.'),
      `the soul's honesty passage is absent on the ${label} branch`);
  });
}

await t('§2.3 the sealed admission byte reaches the model with its one token substituted', async () => {
  const c = await drive({ elizaEnabled: true });
  assert.ok(c.params.system.includes(soul.ELIZA_ADMISSION.replace('{studio}', 'Swati')),
    'the founder-sealed admission line is not in the prompt');
  assert.ok(!c.params.system.includes('{studio}'),
    'the token shipped unsubstituted');
});

await t('§2.4 she does not VOLUNTEER it — S-2 is both halves, not one', async () => {
  // RE-AIMED when the cure went unconditional. The never-volunteer half is
  // ELIZA'S ruling (S-2) and lives in her soul with its reason attached; the
  // sealed rule byte is the minimum that stops the estate lying and carries only
  // the answering half. So the half is asserted where it actually lives, on the
  // path it actually governs — not read off a prompt that has no persona.
  const c = await drive({ elizaEnabled: true });
  assert.ok(soul.ELIZA_SOUL.includes('You never volunteer it — nobody opens a conversation by announcing'),
    'the soul lost the never-volunteer half, or its reason');
  assert.ok(c.params.system.includes('You never volunteer it — nobody opens a conversation by announcing'),
    'the never-volunteer half never reached the model on the Eliza path');
});

await t('§2.5 ⚑ THE LIE IS DEAD ON THE OFF PATH TOO — the flag carries the persona, never the defect', async () => {
  // THE CELL THIS REPLACES asserted the OPPOSITE: that the OFF path still
  // carried the pre-cure bytes, on the reasoning that the gate's two sides must
  // be two whole worlds. The CE ruled that reasoning wrong on the build report
  // and the correction is the packet's most important sentence: a flag that
  // holds Eliza shut MUST NOT ALSO HOLD F-08.52 ALIVE. The persona waits for a
  // witness; a live instruction to lie waits for nothing.
  //
  // Recorded rather than silently rewritten, because a cell that reverses its
  // own assertion is exactly the thing a future reader is entitled to see the
  // reason for.
  for (const returning of [false, true]) {
    const c = await drive({ elizaEnabled: false, returning });
    assert.ok(!/[Nn]ever mention (that )?you are an AI/.test(c.params.system),
      `the F-08.52 byte survived on the OFF path (${returning ? 'returning' : 'first-contact'})`);
    assert.ok(c.params.system.includes(soul.HONESTY_RULE),
      `the sealed honesty byte is absent on the OFF path (${returning ? 'returning' : 'first-contact'})`);
  }
});

await t('§2.6 the sealed byte has ONE HOME and reaches all four states', async () => {
  // Two branches x two flag states. A second literal anywhere would let the OFF
  // path and the ON path drift into two different honesties.
  for (const on of [false, true]) for (const returning of [false, true]) {
    const c = await drive({ elizaEnabled: on, returning });
    assert.ok(c.params.system.includes(soul.HONESTY_RULE),
      `the sealed byte is absent at eliza=${on} returning=${returning}`);
  }
  const shellSrc = read(SHELL_P);
  assert.ok(!/say yes plainly/.test(shellSrc),
    'the shell re-declares the sealed honesty byte — one home, or the two paths drift');
});

await t('§2.7 ⚑ THE SEALED BYTES ARE PINNED — a vetoed byte may not drift without a new veto', () => {
  // ⚠ ADDED AFTER `honesty_byte_drifts` RETURNED 28/0. Every cell above reads
  // `soul.HONESTY_RULE` dynamically, so replacing the const with "Be helpful and
  // warm." changed BOTH SIDES of every assertion and the whole bench stayed
  // green. That is the const-independence disease in a second costume: a check
  // that moves with the thing it checks is a label riding its own cargo.
  //
  // These two strings are FOUNDER-SEALED COPY. Pinning them literally is the
  // point: a future sitting that edits either reddens here and is forced back
  // through the veto, which is the only gate model-voiced bytes have.
  assert.strictEqual(soul.HONESTY_RULE,
    'If she asks whether you are an AI, say yes plainly and continue with what she wanted.',
    'the sealed honesty rule drifted — it is the founder\'s byte, not the executor\'s');
  assert.strictEqual(soul.ELIZA_ADMISSION,
    "I'm an AI, yes — {studio}'s assistant. They read every enquiry themselves; I just make sure one reaches them.",
    'the sealed admission line drifted — candidate (C) was vetoed at the byte');
});

H('§3 — THE NAME: ONE HOME, PER-VENDOR, ELIZA BY DEFAULT (LOG:2821)');

await t('§3.1 null assistant_name -> Eliza, and the literal has ONE home', async () => {
  const c = await drive({ elizaEnabled: true });
  assert.ok(new RegExp(`You are ${soul.ELIZA},`).test(c.params.system), 'the default name is not the soul module\'s');
  const shellSrc = read(SHELL_P);
  assert.ok(!/['"`]Eliza['"`]/.test(shellSrc),
    'the shell re-declares the literal — one home, sixteen-importer discipline (waNumbers/miraSoul precedent)');
});

await t('§3.2 a renamed vendor gets HER name, and Eliza vanishes entirely', async () => {
  const c = await drive({ elizaEnabled: true, vendor: { ...VENDOR, assistant_name: '  Roshni  ' } });
  assert.ok(/You are Roshni, the assistant for Swati/.test(c.params.system), 'the per-vendor rename was ignored');
  assert.ok(!/\bEliza\b/.test(c.params.system), 'the default leaked past a live rename');
});

await t('§3.3 an emptied field is not a rename to nothing', async () => {
  for (const v of ['', '   ', null]) {
    const c = await drive({ elizaEnabled: true, vendor: { ...VENDOR, assistant_name: v } });
    assert.ok(new RegExp(`You are ${soul.ELIZA},`).test(c.params.system),
      `assistant_name=${JSON.stringify(v)} did not fall back to the default`);
  }
});

H('§4 — THE SOUL: SHARED, NAME-FREE, AND UNDER ITS RATIFIED CEILING');

await t('§4.1 the soul is within the ceiling the chair ratified', () => {
  assert.ok(soul.ELIZA_SOUL.length <= soul.ELIZA_SOUL_CHAR_CEILING,
    `soul over ceiling (${soul.ELIZA_SOUL.length}/${soul.ELIZA_SOUL_CHAR_CEILING})`);
});

await t('§4.2 ⚑ the ceiling is PINNED — it may not move in the prose\'s own commit (CE-190)', () => {
  // The const-independence law, asserted rather than trusted. The cell pins the
  // RATIFIED NUMBER, so a future sitting that raises the const to fit new prose
  // reddens here and is forced back through the ratify path.
  assert.strictEqual(soul.ELIZA_SOUL_CHAR_CEILING, 7500,
    'the ceiling moved without this cell moving — that is the label riding its own cargo');
});

await t('§4.3 the soul is NAME-FREE and interpolation-free — fork 2(d)\'s whole point', () => {
  assert.ok(!/\$\{/.test(soul.ELIZA_SOUL), 'the soul carries an interpolation — it is no longer a shared const');
  for (const w of ['Eliza', 'Swati', 'photography', 'Delhi']) {
    assert.ok(!soul.ELIZA_SOUL.includes(w), `the soul carries a per-vendor byte: "${w}"`);
  }
});

await t('§4.4 LD-5 — the soul carries no numbered rule list and no forbidden-phrase fence', () => {
  const numbered = soul.ELIZA_SOUL.split('\n').filter(l => /^\s*\d+\.\s/.test(l));
  assert.strictEqual(numbered.length, 0, `the soul grew a rules list: ${numbered[0]}`);
  assert.ok(!/forbidden|never say|do not say/i.test(soul.ELIZA_SOUL), 'the soul grew a phrase fence');
});

H('§5 — F-08.84: THE ALLOW-SET CLOSES THE DOOR THE FACADE OPENED');

await t('§5.1 the couple lane resolves to the seeded route, and the seed mirrors DEFAULTS', () => {
  const d = router.DEFAULTS['model.wa_couple.default'];
  assert.ok(d, 'the couple surface has no default — a pre-seed deploy would not route identically');
  const sql = read(MIGRATION);
  assert.ok(sql.includes(`"provider":"${d.provider}","model":"${d.model}"`),
    'the 0112 seed and the DEFAULTS entry disagree — one of them is silently wrong');
});

await t('§5.2 ⚑ Sonnet is REFUSED on a customer wire and falls to the surface default', async () => {
  router._resetRouteCache();
  const r = await router.resolveModel(
    fakeSupabase({ route: { provider: 'anthropic', model: 'claude-sonnet-4-6' } }), 'wa_couple', 'default');
  assert.notStrictEqual(r.model, 'claude-sonnet-4-6', 'F-05.32 re-enabled: an admin row put Sonnet on the couple wire');
  assert.strictEqual(r.model, router.DEFAULTS['model.wa_couple.default'].model, 'the refusal did not fall to the default');
  assert.ok(r.refused, 'the refusal was silent — a guard nobody can read in a log is not a guard');
});

await t('§5.3 the sibling wire is covered in the same commit — wa_marketing was the OLDER hole', () => {
  assert.ok(router.SURFACE_ALLOW.wa_marketing, 'the marketing lane is ungoverned — F-04.38\'s class, one field away');
  assert.ok(!router.SURFACE_ALLOW.wa_marketing.has('claude-sonnet-4-6'), 'Sonnet is in the marketing allow-set');
  assert.ok(!router.SURFACE_ALLOW.wa_couple.has('claude-sonnet-4-6'), 'Sonnet is in the couple allow-set');
});

await t('§5.4 the 60-second DeepSeek flip SURVIVES — the guard did not cost the thing it protects', async () => {
  // A KEY IS SET FOR THIS CELL, AND HERE IS WHY. `guardKeys` runs BEFORE the
  // allow-set and correctly collapses a keyless provider to the anthropic
  // fallback. In a build container with no DEEPSEEK_API_KEY that collapse is
  // indistinguishable from an allow-set refusal, so the cell would have gone
  // green-or-red on the wrong mechanism. The env is set to isolate the mechanism
  // under test and restored immediately; it is never a live credential (secrets
  // law), only a presence.
  const keyEnv = require(path.join(ROOT, 'src/lib/llm.js')).CONF.deepseek.keyEnv;
  const had = process.env[keyEnv];
  process.env[keyEnv] = 'bench-presence-only';
  try {
    router._resetRouteCache();
    const r = await router.resolveModel(
      fakeSupabase({ route: { provider: 'deepseek', model: 'deepseek-v4-flash' } }), 'wa_couple', 'default');
    assert.strictEqual(r.model, 'deepseek-v4-flash', 'the allow-set refused the flip it was built to permit');
    assert.ok(!r.refused, 'an in-set model was marked refused');
  } finally {
    if (had === undefined) delete process.env[keyEnv]; else process.env[keyEnv] = had;
  }
});

await t('§5.5 ⚑ the ROLE-SPLIT model is guarded too — one door is F-04.38\'s class', async () => {
  // `model.wa_marketing.default` carries a nudge split (F-08.69). A guard that
  // covers the primary model and not the split leaves Sonnet one FIELD away,
  // which is a cure landing on one door while its twin sits beside it. Added
  // after `allowset_misses_split` returned 26/0 — the arm narrowed the loop to
  // `['model']` and no cell noticed.
  // Same isolation as §5.4 and for the same reason: guardKeys DROPS a keyless
  // split before the allow-set ever sees it, so without a key present this cell
  // would measure the wrong mechanism.
  const keyEnv = require(path.join(ROOT, 'src/lib/llm.js')).CONF.deepseek.keyEnv;
  const had = process.env[keyEnv];
  process.env[keyEnv] = 'bench-presence-only';
  try {
  router._resetRouteCache();
  const r = await router.resolveModel(fakeSupabase({}), 'wa_marketing', 'default');
  assert.strictEqual(r.nudge_model, 'deepseek-v4-flash', 'the seeded split is not what resolved — re-derive before trusting');
  router._resetRouteCache();
  const sb = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { value: JSON.stringify(
    { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', nudge_provider: 'anthropic', nudge_model: 'claude-sonnet-4-6' }) } }) }) }) }) };
  const bad = await router.resolveModel(sb, 'wa_marketing', 'default');
  assert.notStrictEqual(bad.nudge_model, 'claude-sonnet-4-6', 'Sonnet reached the wake role through the split field');
  assert.ok(bad.refused, 'the split refusal was silent');
  } finally {
    if (had === undefined) delete process.env[keyEnv]; else process.env[keyEnv] = had;
  }
});

await t('§5.6 an UNGOVERNED surface is unconstrained, not empty-set-refused', async () => {
  router._resetRouteCache();
  assert.ok(!router.SURFACE_ALLOW.pwa_vendor,
    'pwa_vendor gained an allow-set — S-8\'s ruled haiku<->sonnet escalation is not this finding\'s business');
});

H('§6 — THE REGISTER REACHES HER (bar item 4)');

await t('§6.1 the house money form is in the prompt on both sides of the gate', async () => {
  for (const on of [true, false]) {
    const c = await drive({ elizaEnabled: on });
    assert.ok(/Rs 5,00,000/.test(c.params.system), `the register example is absent (eliza=${on})`);
    assert.ok(/never the ₹ symbol/i.test(c.params.system), `the glyph refusal is absent (eliza=${on})`);
  }
});

await t('§6.2 and the soul teaches it with its reason, not as a lone rule', () => {
  assert.ok(soul.ELIZA_SOUL.includes('She will read that number back to the studio'),
    'the register lost the WHY — a rule with no reason is the shape LD-5 exists to refuse');
});

H('§7 — THE SEAM AND THE FACADE');

await t('§7.1 the turn goes through the facade, never the raw SDK', () => {
  const e = read(ENGINE_P);
  assert.ok(/llmCreate\(route\.provider/.test(e), 'the couple turn does not call the facade');
  assert.ok(!/anthropic\.messages\.create/.test(e), 'a raw SDK call survived in the couple engine');
});

await t('§7.2 the model is RESOLVED, never typed', () => {
  const e = read(ENGINE_P);
  assert.ok(/resolveModel\(supabase, 'wa_couple', 'default'\)/.test(e), 'the route is not resolved at the turn');
  assert.ok(!/const modelToUse\s*=\s*MODEL_HAIKU/.test(e), 'the hardcoded literal survived');
});

await t('§7.3 the dead import is gone and models.js keeps its real reader', () => {
  const e = read(ENGINE_P);
  assert.ok(!/require\('\.\/models'\)/.test(e), 'engine.js still selects from models.js and reads nothing');
  assert.ok(/MODEL_SONNET/.test(read('src/agent/brideEngine.js')),
    'brideEngine lost its MODEL_SONNET reader — models.js exports would now be orphaned');
});

// ── verdict ─────────────────────────────────────────────────────────────────
console.log(`\nb08_p5_eliza_bench: ${pass} passed, ${fail} failed`);
if (fail === 0) {
  console.log('GREEN — the lane is gated, the lie is dead on both branches, the name has one home,');
  console.log('        the soul is shared and capped, and the facade did not cost the Haiku ceiling.');
}
process.exit(fail === 0 ? 0 : 1);

})();
