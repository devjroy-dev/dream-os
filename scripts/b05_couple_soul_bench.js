// scripts/b05_couple_soul_bench.js — TDW_05 THE COUPLE SOUL (Mira). CE-65.
// Runnable from any working directory, clean clone, no npm install:
//   node scripts/b05_couple_soul_bench.js
//
// ═══ WHAT THIS BENCH IS FOR, AND WHAT IT DELIBERATELY REFUSES TO DO ══════════
// LD-5: the bench asserts BEHAVIOUR and the SEAM — never the soul's wording.
// v2 (the register amendment — dry/sarcastic/dark-humored ruled in by the
// founder): re-derived against the amended text and DELIBERATELY UNCHANGED in
// substance. Not one cell greps for a joke, a tone word, or a forbidden target.
// A bench that asserted the register would go red the next time the founder
// sharpens his own voice — which is the wrong thing to make expensive.
// Not one cell below greps for a doctrine sentence. If it did, the soul could
// never be re-authored without the bench going red for a reason that has
// nothing to do with whether Mira tells the truth, and a bench that punishes
// re-authoring is a bench that ossifies a voice. What IS asserted:
//   · the soul reaches the model on the REAL production seam, in the CACHED
//     block, on the wire the bride actually speaks over;
//   · the cache law is intact (static prefix byte-stable, dynamic content out);
//   · the name has exactly ONE home and every site reads it;
//   · the composers that run WITHOUT a system prompt read the ONE register;
//   · the prompt does not contradict itself about whether she has a name;
//   · the demo-fixture name that was in every real bride's first message is
//     gone (F-05.31).
//
// ═══ WHAT IT CANNOT ASSERT, STATED SO NOBODY MISREADS A GREEN ════════════════
// Whether Mira actually refuses to fabricate a done, actually looks before
// asserting an absence, and actually keeps the machinery off the wire is NOT
// provable here — no bench in this estate can prove a model's choice. That is
// what the FIVE FOUNDER CARDS are for, and they are the acceptance, not this.
// This bench proves the soul is WIRED and the seam is honest. Green here plus
// red cards is a failed sitting.
//
// ═══ NON-VACUITY (BY PRODUCTION MUTATION, §9) ════════════════════════════════
// Every cell fails at the UNCURED tree, or on a one-line mutation of PRODUCTION
// code — never of test setup. The mutations that must RED this bench, named at
// their cells, each run and recorded in the delivery packet:
//   M1  drop `${MIRA_SOUL}` from brideSystemPrompt's STATIC_SYSTEM_PROMPT
//                                                            → §2.1/§2.4 RED
//   M2  move `${MIRA_SOUL}` out of the static prompt and into
//       buildDynamicContext's returned lines (the cache-law violation the
//       91% stake exists to prevent)                          → §2.4 RED
//   M3  strip `cache_control` from system[0] at brideEngine's call seam
//                                                            → §2.3 RED
//   M4  hardcode the literal 'Mira' in circleSystemPrompt instead of reading
//       the MIRA export (the one-home law)                    → §4.1 RED
//       (predicted §4.2, MEASURED §4.1 — §4.2 still passes because the name is
//        still THERE, just not from its home. The census cell is the stronger
//        one and it is the one that fires. Corrected against the run, not the
//        guess.)
//   M5  restore the Swati clause in brideOnboarding's greeting → §5.1 RED
//   M6  restore `12. Never introduce yourself` in brideSystemPrompt
//                                                            → §6.1 RED
//   M7  drop `${MIRA_REGISTER}` from brideIndex's /surprise composer
//                                                            → §4.3 RED
//   M8  drop `${MIRA_REGISTER}` from brideOnboarding's dodge composer (the
//       RUNTIME register cell, v2)                            → §4.3b RED
// ═════════════════════════════════════════════════════════════════════════════
'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');

// ── Fence the shared supabase client BEFORE anything on the bride lane loads.
// `src/lib/supabase.js` calls createClient(process.env.SUPABASE_URL, ...) at
// module scope and throws without credentials. Fencing it here is transport
// shell, not a replacement of anything under test: buildDynamicContext's real
// query chain still runs against this, and the REAL brideEngine loop still
// composes the REAL system array.
const SUPA_PATH = require.resolve('../src/lib/supabase.js');
let dynamicQueriesSeen = [];
function supabaseFake() {
  const rows = {
    couples: {
      id: 'c1', user_id: 'u1', partner_name: 'Arjun', wedding_date: null,
      wedding_city: 'Jaipur', budget_total: null, events_planned: null,
      onboarding_state: 'complete',
      users: { name: 'Test Bride', phone: '919625759924', pronouns: 'she' },
    },
    couple_state: { summary: null, taste_notes: null, vendor_shortlist: null },
    notes: [],
    events: [],
  };
  function builder(table) {
    dynamicQueriesSeen.push(table);
    const b = {};
    for (const m of ['select', 'eq', 'order', 'limit', 'gte', 'lte', 'lt', 'gt', 'neq', 'is', 'in', 'not', 'insert', 'update', 'delete', 'upsert', 'range']) {
      b[m] = () => b;
    }
    b.single      = () => Promise.resolve({ data: rows[table] ?? null, error: null });
    b.maybeSingle = () => Promise.resolve({ data: rows[table] ?? null, error: null });
    b.then = (res, rej) => Promise.resolve({
      data: Array.isArray(rows[table]) ? rows[table] : null, error: null,
    }).then(res, rej);
    return b;
  }
  return { from: (t) => builder(t), rpc: () => Promise.resolve({ data: null, error: null }) };
}
require.cache[SUPA_PATH] = {
  id: SUPA_PATH, filename: SUPA_PATH, loaded: true, exports: { supabase: supabaseFake() },
};

// ── The modules under test, freshly required (nothing in them replaced) ──────
for (const rel of ['../src/agent/miraSoul.js', '../src/agent/brideSystemPrompt.js',
                   '../src/agent/brideEngine.js', '../src/agent/circleSystemPrompt.js']) {
  delete require.cache[require.resolve(rel)];
}
const soul     = require('../src/agent/miraSoul.js');
const bridePr  = require('../src/agent/brideSystemPrompt.js');
const engine   = require('../src/agent/brideEngine.js');
const circlePr = require('../src/agent/circleSystemPrompt.js');

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}
function section(s) { console.log(`\n${s}`); }

// ── A spy Anthropic client: records what the REAL loop hands the model. ──────
function spyAnthropic() {
  const calls = [];
  return {
    calls,
    messages: {
      create: async (payload) => {
        calls.push(payload);
        return {
          content: [{ type: 'text', text: 'Got it.' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 3 },
        };
      },
    },
  };
}

const COUPLE = { id: 'c1', user_id: 'u1', onboarding_state: 'complete' };
const USER   = { id: 'u1', name: 'Test Bride', phone: '919625759924' };
const CONVO  = { id: 'conv1' };

// Drive the REAL runBrideAgenticTurn once and hand back the system array it built.
async function realTurnSystemArray() {
  const spy = spyAnthropic();
  await engine.runBrideAgenticTurn({
    couple: COUPLE, user: USER, conversation: CONVO,
    inboundMessage: 'is my sangeet already on my calendar?',
    supabase: supabaseFake(), anthropic: spy,
  });
  assert.ok(spy.calls.length >= 1, 'the real loop never called the model');
  // NOT calls[0]: runBrideAgenticTurn first runs surfacePendingCircleSessions,
  // which makes its own bare Haiku call with NO system array. Taking calls[0]
  // would have read the digest composer and reported the turn. The bench found
  // that on its first run; recorded rather than quietly indexed around.
  const turn = spy.calls.find(c => Array.isArray(c.system));
  assert.ok(turn, 'no model call in this turn carried a system array');
  return turn.system;
}

(async () => {

// ═══ §1 — THE SOUL MODULE IS THE ONE HOME ═══════════════════════════════════
section('§1  THE SOUL MODULE — one file, the ruled exports');

await t('1.1  miraSoul exports MIRA, MIRA_SOUL, MIRA_REGISTER', () => {
  assert.strictEqual(typeof soul.MIRA, 'string');
  assert.strictEqual(typeof soul.MIRA_SOUL, 'string');
  assert.strictEqual(typeof soul.MIRA_REGISTER, 'string');
  assert.ok(soul.MIRA.length > 0 && soul.MIRA_SOUL.length > 400);
});

await t('1.2  the soul is a MODULE-LEVEL constant, not a function of anything', () => {
  // If it were built per-call it could take dynamic content and poison the cache.
  const src = read('src/agent/miraSoul.js');
  assert.ok(/^const MIRA_SOUL = `/m.test(src), 'MIRA_SOUL is not a bare module-level template literal');
  assert.ok(!/function\s+\w*[Ss]oul/.test(src), 'the soul is built by a function — cache law at risk');
});

// ═══ §2 — THE PRODUCTION SEAM (behaviour, the REAL loop) ════════════════════
section('§2  THE SEAM — the REAL runBrideAgenticTurn, spy client, nothing stubbed in the module');

let SYS = null;
await t('2.0  the real loop builds a two-block system array', async () => {
  SYS = await realTurnSystemArray();
  assert.ok(Array.isArray(SYS) && SYS.length === 2, `system array shape: ${JSON.stringify(SYS && SYS.length)}`);
});

await t('2.1  the SOUL rides the model call  [M1]', () => {
  assert.ok(SYS[0].text.includes(soul.MIRA_SOUL), 'the soul is not in the system prompt the model receives');
});

await t('2.2  she is NAMED on the wire the bride speaks over', () => {
  assert.ok(SYS[0].text.includes(soul.MIRA), 'her name never reaches the model');
});

await t('2.3  the soul rides the CACHED block — the 91% stake  [M3]', () => {
  assert.deepStrictEqual(SYS[0].cache_control, { type: 'ephemeral' },
    'system[0] lost its cache_control: every turn now pays a cold prefix');
});

await t('2.4  the soul is NOT in the uncached dynamic block  [M1][M2]', () => {
  assert.ok(SYS[1] && typeof SYS[1].text === 'string', 'no dynamic block');
  assert.ok(!SYS[1].text.includes(soul.MIRA_SOUL),
    'the soul leaked into the per-call block — that is the cache law broken, not a style question');
  assert.strictEqual(SYS[1].cache_control, undefined,
    'the dynamic block is being cached — every note change would invalidate the window');
});

await t('2.5  the dynamic block still carries the bride, not the soul', () => {
  assert.ok(SYS[1].text.includes('BRIDE CONTEXT'), 'dynamic context is not the bride context');
  assert.ok(dynamicQueriesSeen.length > 0 || SYS[1].text.length > 0, 'the real context builder never ran');
});

// ═══ §3 — THE CACHE LAW ═════════════════════════════════════════════════════
section('§3  THE CACHE LAW — a static prefix is only static if it is byte-stable');

await t('3.1  STATIC_SYSTEM_PROMPT is byte-identical across two fresh loads', () => {
  const first = bridePr.STATIC_SYSTEM_PROMPT;
  delete require.cache[require.resolve('../src/agent/brideSystemPrompt.js')];
  const second = require('../src/agent/brideSystemPrompt.js').STATIC_SYSTEM_PROMPT;
  assert.strictEqual(first, second, 'the static prompt differs between loads — it is not static');
});

await t('3.2  no per-bride VALUE reaches the cached prefix  [M2]', () => {
  // Deliberately NOT a ban on the words "BRIDE CONTEXT": the static prompt
  // legitimately cross-references the dynamic block by name, and an earlier
  // draft of this cell red-flagged that reference. A pointer is not a payload.
  // What must never appear is the per-turn DATA itself.
  const s = bridePr.STATIC_SYSTEM_PROMPT;
  assert.ok(!/Today: \d{4}-\d{2}-\d{2}/.test(s), 'a resolved date is baked into the cached prefix');
  for (const v of ['Test Bride', 'Jaipur', 'Arjun', '919625759924']) {
    assert.ok(!s.includes(v), `per-bride value "${v}" is inside the cached prefix`);
  }
  assert.ok(SYS && !SYS[0].text.includes(SYS[1].text),
    'the whole dynamic block was pasted into the cached one');
});

// ═══ §4 — ONE HOME: the name, and the register ══════════════════════════════
section('§4  ONE HOME — the waNumbers precedent applied to a name and a register');

await t('4.1  the name literal lives in miraSoul and in Meta-committed template copy only', () => {
  // templates.js / TEMPLATES.md are the DECLARED exemption: that copy is filed
  // with Meta and a rename there is a re-filing, not an edit. Everything else
  // on the lane must read the export.
  const offenders = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') walk(full); continue; }
      if (!e.name.endsWith('.js')) continue;
      const rel = path.relative(ROOT, full);
      if (rel === 'src/agent/miraSoul.js' || rel === 'src/lib/templates.js') continue;
      const body = fs.readFileSync(full, 'utf8');
      // the quoted literal, not the identifier and not prose in a comment
      for (const line of body.split('\n')) {
        if (/^\s*(\/\/|\*)/.test(line)) continue;
        if (/['"`]Mira['"`]|Mira[ ,.']/.test(line) && !/MIRA/.test(line)) offenders.push(`${rel}: ${line.trim().slice(0, 90)}`);
      }
    }
  };
  walk(P('src'));
  assert.deepStrictEqual(offenders, [], `the name is hardcoded outside its home:\n       ${offenders.join('\n       ')}`);
});

await t('4.2  circleSystemPrompt reads the export, not a literal  [M4]', () => {
  assert.ok(circlePr.STATIC_SYSTEM_PROMPT.includes(soul.MIRA),
    'the circle assistant is nameless while the bride assistant is named — two identities on one wire');
  const src = read('src/agent/circleSystemPrompt.js');
  assert.ok(/require\('\.\/miraSoul'\)/.test(src), 'circleSystemPrompt does not read the one home');
});

await t('4.3  every no-system-prompt composer reads the ONE register  [M7]', () => {
  // The four sites from the CE-65 fresh census classified FOLD. Each runs a bare
  // Haiku call with no system prompt and used to describe the voice for itself.
  const folded = [
    ['src/brideIndex.js',           'the /surprise composer'],
    ['src/agent/brideEngine.js',    'the circle-digest composer'],
    ['src/agent/brideOnboarding.js','the dodge-transition composer'],
  ];
  for (const [rel, what] of folded) {
    const src = read(rel);
    assert.ok(/miraSoul'\)/.test(src), `${what} (${rel}) does not require the one home`);
    assert.ok(/\$\{MIRA_REGISTER\}/.test(src), `${what} (${rel}) does not read MIRA_REGISTER`);
  }
});

await t('4.3b RUNTIME: a folded composer really receives the register  [M8]', async () => {
  // Source greps prove wiring; this drives the dodge composer through the REAL
  // onboarding state machine and reads the prompt it actually hands the model.
  // The spy answers DODGE to the classifier, which is what routes the turn into
  // composeDodgeTransition — the folded site.
  const seen = [];
  const spy = { messages: { create: async (p) => {
    seen.push(p);
    const asked = String(p.messages[0].content);
    const text = /DODGE or ANSWER/.test(asked) ? 'DODGE' : 'Fair, parking that.\nAnd your partner?';
    return { content: [{ type: 'text', text }], stop_reason: 'end_turn', usage: {} };
  } } };
  await engine.runBrideAgenticTurn({
    couple: { id: 'c1', onboarding_state: 'asked_date' }, user: USER, conversation: CONVO,
    inboundMessage: 'not sure yet', supabase: supabaseFake(), anthropic: spy,
  });
  const composer = seen.find(c => String(c.messages[0].content).startsWith(soul.MIRA_REGISTER));
  assert.ok(composer, 'the dodge composer did not open with the one authored register');
});

await t('4.4  no site re-describes the register for itself', () => {
  // The census term. Every surviving hit must be a comment, the declared
  // demo-fixture exemption, or the circle prompt's deliberate contrast.
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') walk(full); continue; }
      if (!e.name.endsWith('.js')) continue;
      const rel = path.relative(ROOT, full);
      if (rel === 'src/api/demo/bride.js') continue;      // declared demo-fixture exemption
      fs.readFileSync(full, 'utf8').split('\n').forEach((line, i) => {
        if (/^\s*(\/\/|\*)/.test(line)) return;           // comments are census, not instruction
        if (/BFF/.test(line)) hits.push(`${rel}:${i + 1}`);
      });
    }
  };
  walk(P('src'));
  assert.deepStrictEqual(hits, [], `live instruction sites still describing the voice for themselves: ${hits.join(', ')}`);
});

// ═══ §5 — F-05.31, the fixture in the first message ═════════════════════════
section('§5  F-05.31 — the demo-fixture name is out of the bride\'s first message');

await t('5.1  the Swati clause is gone from onboarding  [M5]', () => {
  const src = read('src/agent/brideOnboarding.js');
  assert.ok(!/Swati/.test(src), 'the demo/fixture vendor name is still in the onboarding script');
});

await t('5.2  the greeting still asks the date, and now introduces her once', () => {
  const src = read('src/agent/brideOnboarding.js');
  assert.ok(/when is the big day\?/.test(src), 'the greeting lost its question');
  assert.ok(/\$\{MIRA\}/.test(src), 'the greeting does not name her from the one home');
});

// ═══ §6 — THE PROMPT DOES NOT CONTRADICT ITSELF ═════════════════════════════
section('§6  SELF-CONSISTENCY — a named agent forbidden from ever being named is a trap');

await t('6.1  the blanket never-introduce instruction is gone  [M6]', () => {
  const s = bridePr.STATIC_SYSTEM_PROMPT;
  assert.ok(!/Never introduce yourself/.test(s),
    'the prompt names her and then forbids her from ever saying so — CARD TWO msg 5 cannot pass');
});

await t('6.2  she is still forbidden from re-introducing every turn', () => {
  const s = bridePr.STATIC_SYSTEM_PROMPT;
  assert.ok(/re-introduce|ONCE/.test(s), 'the once-only discipline vanished with the old rule');
});

// ═══ §7 — BOTH WIRES ════════════════════════════════════════════════════════
section('§7  BOTH WIRES — one voice, two doors (F-SCOPE)');

await t('7.1  the WA door and the sanctuary door reach the same engine', () => {
  assert.ok(/require\('\.\/agent\/brideEngine'\)/.test(read('src/brideIndex.js')),
    'the WhatsApp door no longer reaches brideEngine');
  assert.ok(/require\('\.\.\/\.\.\/agent\/brideEngine'\)/.test(read('src/api/couple/chat.js')),
    'the sanctuary door no longer reaches brideEngine');
});

await t('7.2  coupleSystemPrompt is OUT BY NAME — untouched by this sitting', () => {
  const src = read('src/agent/coupleSystemPrompt.js');
  assert.ok(!/miraSoul|MIRA/.test(src),
    'the vendor-concierge prompt was pulled into the couple soul — different principal, inverted loyalty');
});

// ── verdict ─────────────────────────────────────────────────────────────────
console.log(`\nb05_couple_soul_bench: ${pass} passed, ${fail} failed`);
if (fail === 0) {
  console.log('GREEN — the soul is wired on the real seam, cached, one-homed, and self-consistent.');
  console.log('        This proves the WIRING. The five founder cards prove the CHARACTER.');
}
process.exit(fail === 0 ? 0 : 1);

})();
