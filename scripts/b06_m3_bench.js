#!/usr/bin/env node
'use strict';
// scripts/b06_m3_bench.js — TDW_06 · M-3 · MODEL & PERSONA GOVERNANCE
// Every model choice is RULED, not inherited, and no persona name crosses to a vendor on
// any wire. Runnable from any working directory (Q-SP-5).
//
// WHAT THIS BENCH DRIVES, AND WHY IT IS NOT A SOURCE-GREP SUITE:
//   §2 builds a stub estate and runs the SHIPPED `processVendorInbound` to completion,
//   capturing the exact bytes handed to `sendWhatsApp`. THE WIRE IS THE WITNESS — that is
//   where F-06.29's three name bleeds actually happened, and a cell that read the source
//   instead would green on a require nobody calls. The door's 24 deps are injected by its
//   own design, so this is the shipped function, not a paraphrase of it.
//   §1 and §4 are census/allowlist questions, which ARE source questions by nature: "is
//   there a fourth Sonnet site anywhere" cannot be asked of a running process.
//   §3 lifts recencyFidelity's BYTES out of the gauntlet (b06_m1 §1's own technique) —
//   requiring that file would execute a live gauntlet.
//
// NON-VACUITY (§5): every mutation edits SHIPPED PRODUCTION CODE — distill.ts, loop.ts,
// the vendor door, the gauntlet the acceptance evenings are graded by — never this
// bench's setup, and every mutated file is restored and asserted byte-identical.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');

const DISTILL = 'src/engine/src/core/distill.ts';
const MODELS = 'src/engine/src/core/models.ts';
const LOOP = 'src/engine/src/core/loop.ts';
const DOOR = 'src/lib/vendorInbound.js';
const GAUNTLET = 'scripts/b06_gauntlet.js';
const SCRUB = 'src/lib/vendor/scrub.js';

let pass = 0, fail = 0;
const H = (s) => console.log(`\n── ${s} ──`);
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e && e.message}`); fail++; }
}

async function main() {

// ════════════════════════════════════════════════════════════════════════════
H('§1 — F-06.16: THE CLERK\'S SONNET CARVE-OUT, RULED AT ITS DOOR');

// The census is a REPO fact, so it is taken from the repo — every .ts under the engine's
// source tree, the constant grepped BY NAME. `modelLabel()` is deliberately NOT consulted:
// models.ts:87-88 returns 'sonnet' for any model string lacking 'haiku', which would count
// deepseek-v4-flash as a Sonnet site and make this cell lie in the reassuring direction.
function sonnetSites() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (!/\.ts$/.test(e.name)) continue;
      const rel = path.relative(ROOT, full).split(path.sep).join('/');
      // COMMENTS ARE STRIPPED BEFORE THE COUNT, and the reason is not convenience: a
      // comment cannot route a model. Counting them would mean the carve-out's own
      // DECLARATION — which must name the constant to be legible — inflates the census it
      // exists to bound, and every future word written about Sonnet becomes a Sonnet site.
      // ORDER IS LOAD-BEARING, and this bench's own author was caught by it: the LINE
      // comment is stripped FIRST, then the block comment. Reversed, the `/*` inside a
      // path like `src/engine/src/**` — written in the carve-out's own declaration —
      // opens a phantom block comment that swallows the rest of the file, and the census
      // silently returns FEWER sites than exist. A census that under-counts in the
      // reassuring direction is the worst shape this cell could take.
      let inBlock = false;
      fs.readFileSync(full, 'utf8').split('\n').forEach((raw, i) => {
        let line = raw;
        if (inBlock) { const end = line.indexOf('*/'); if (end === -1) return; line = line.slice(end + 2); inBlock = false; }
        line = line.replace(/\/\/.*$/, '');
        const bstart = line.indexOf('/*');
        if (bstart !== -1) { inBlock = line.indexOf('*/', bstart) === -1; line = line.slice(0, bstart); }
        if (line.includes('MODELS.sonnet')) out.push({ site: `${rel}:${i + 1}`, code: line.trim() });
      });
    }
  };
  walk(P('src/engine/src'));
  return out;
}

// THE ALLOWLIST, THREE SITES — the CE's ruling (M-3 R1) rendered as an assertion.
//
// FINGERPRINTED BY CODE, NOT PINNED TO LINE NUMBERS, and deliberately: F-06.34 was filed
// in this same sitting for exactly that mistake — an assertion pinned to a coordinate the
// next edit moves. The ruling names these sites at :112/:124/:57, which were their
// addresses when the census was taken; the carve-out's own declaration then pushed the
// first two down the file, as any future comment will again. The IDENTITY of a site is the
// statement, not its address. §1.1b records the current addresses so the log still carries
// them — as a REPORT, never as the assertion.
const ALLOWLIST = [
  { file: 'src/engine/src/core/distill.ts', code: 'model: MODELS.sonnet,' },                 // the clerk's model — the carve-out itself
  { file: 'src/engine/src/core/distill.ts', code: 'const costInr = calcCostInr(MODELS.sonnet, resp.usage.input_tokens, resp.usage.output_tokens);' }, // its own cost math
  { file: 'src/engine/src/core/models.ts',  code: '[MODELS.sonnet]: { input: 3.0, output: 15.0 },' },  // the PRICE ROW — the carve-out's honesty
];

await t('§1.1 the Sonnet census under src/engine/src/** is EXACTLY the three ruled sites — no fourth', () => {
  const found = sonnetSites();
  const want = ALLOWLIST.map((a) => `${a.file}\t${a.code}`).sort();
  const got = found.map((f) => `${f.site.replace(/:\d+$/, '')}\t${f.code}`).sort();
  assert.deepStrictEqual(got, want,
    `the Sonnet census moved. Sites found:\n  ${found.map((f) => `${f.site}  ${f.code}`).join('\n  ')}`);
});

await t('§1.1b the three sites\' CURRENT addresses, recorded (a report, not an assertion — see F-06.34)', () => {
  const found = sonnetSites();
  console.log(`       ${found.map((f) => f.site).join(' · ')}`);
  assert.strictEqual(found.length, 3);
});

await t('§1.2 the carve-out is DECLARED AT ITS SITE — the comment cites E-1 and states the batch-job reason', () => {
  const src = read(DISTILL);
  const head = src.slice(0, src.indexOf('    model: MODELS.sonnet,'));
  assert.ok(/F-06\.16/.test(head), 'the finding is not named at the site');
  assert.ok(/E-1/.test(head), 'E-1 is not cited at the site');
  assert.ok(/DOCUMENT-PREPARATION BATCH JOB/i.test(head), 'the reason is not stated at the site');
  assert.ok(/CLARIFICATION OF E-1, NOT AN EXCEPTION BY STEALTH/i.test(head),
    'the ruling\'s framing is missing — a survivor with no stated status is the thing this cell exists to prevent');
});

await t('§1.3 the price row is LOAD-BEARING — delete it and the clerk\'s cost silently under-reports at the Haiku rate', () => {
  // Derived from models.ts, never asserted from memory: calcCostInr falls back to the
  // Haiku row for any unpriced model, so the Sonnet row's absence would not remove the
  // spend — it would HIDE it. That is why models.ts:57 is allowlisted, not swept.
  const src = read(MODELS);
  assert.ok(/PRICING\[model\]\s*\?\?\s*PRICING\[MODELS\.haiku\]/.test(src),
    'the fallback this cell reasons about is gone from calcCostInr — re-derive before trusting the allowlist');
  assert.ok(/\[MODELS\.sonnet\]:\s*\{\s*input:\s*3\.0,\s*output:\s*15\.0\s*\}/.test(src));
});

await t('§1.4 the carve-out has ZERO conversational reach — its only caller is the document-door file', () => {
  const hits = execFileSync('git', ['grep', '-n', '-E', 'uploadAndDistill|redistill', '--', 'src/'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean)
    .filter((l) => !l.startsWith(`${DISTILL}:`))
    .filter((l) => /\b(uploadAndDistill|redistill)\s*\(/.test(l) || /import\s*\{[^}]*(uploadAndDistill|redistill)/.test(l));
  const files = [...new Set(hits.map((l) => l.split(':')[0]))].sort();
  assert.deepStrictEqual(files, ['src/engine/src/core/server.ts'],
    `the clerk grew a caller outside the document doors: ${files.join(', ')} — the carve-out's premise is that it holds no thread`);
});

// ════════════════════════════════════════════════════════════════════════════
H('§2 — F-06.17 + F-06.29: THE FIREWALL ON THE REAL WIRE');

// A stub estate: chainable, table-keyed, deliberately dumb. It answers the door's queries
// and nothing more.
function stubEstate() {
  const sent = [];
  const rows = {
    users: { id: 'u1', phone: '+918757788550', name: 'Dev' },
    vendors: { id: 'v1', user_id: 'u1', onboarding_state: 'complete', category: 'photographer' },
    conversations: { id: 'c1', vendor_id: 'v1', kind: 'vendor_self' },
  };
  const chain = (table) => {
    const api = {};
    for (const m of ['select', 'eq', 'is', 'order', 'limit', 'update', 'neq', 'in', 'gte', 'lte', 'not']) api[m] = () => api;
    api.insert = () => api;
    api.single = async () => ({ data: rows[table] || {}, error: null });
    api.maybeSingle = async () => ({ data: rows[table] || null, error: null });
    api.then = (res) => res({ data: rows[table] ? [rows[table]] : [], error: null });
    return api;
  };
  return { sent, supabase: { from: chain, schema: () => ({ from: chain }) } };
}

function doorDeps({ reply, sent, supabase }) {
  return {
    sendWhatsApp: async (to, text) => { sent.push({ to, text }); return { sid: 'SM1' }; },
    runTurn: async () => ({ reply, tool_calls: [] }),
    resolveAgentForVendor: async () => ({ agentId: 'a1' }),
    fetchCalendarSnapshot: async () => '', fetchScratchpad: async () => '', fetchLeadPings: async () => '',
    applyCalendarSignals: async () => ({ suffix: '' }),
    buildLlmForTurn: async () => ({}),
    matchModeWord: () => null, applyModeFlip: async () => ({ changed: false }), MODE_FLIP_LINES: {},
    matchFreshWord: () => false, FRESH_THREAD_LINE: 'Fresh thread.', abandonActiveThread: async () => ({}),
    generateInvoiceForBinder: async () => null, enquiryToBinder: async () => ({ ok: true }),
    runCoupleAgenticTurn: async () => ({ reply: '', toolCalls: [] }),
    ensureCoupleRow: async () => ({}), captureField: async () => ({}),
    buildDisambiguationQuestion: () => '', interpretDisambiguationReply: async () => ({}),
    vendorDisplayName: () => 'V', checkImageThrottle: async () => ({ allowed: true }),
    markRejectionSent: async () => ({}), extractCalendarFromImage: async () => [],
    webhookCore: require(P('src/lib/webhookCore.js')), supabase, anthropic: {},
  };
}

// One process, many turns: each run gets a fresh wamid so the turn-lock and the dedupe
// LRU never mistake one cell for a replay of another.
let sidSeq = 0;
const { processVendorInbound, scrubModelFrame } = require(P(DOOR));
async function wireFor(reply) {
  const { sent, supabase } = stubEstate();
  await processVendorInbound({
    phone: '+918757788550', body: 'what is on for today', profileName: 'Dev',
    messageSid: `wamid.m3.${++sidSeq}`, internalReplay: false, trimmedBody: 'what is on for today',
    numMedia: 0, hasMedia: false, mediaUrl: null, rawPayload: {},
  }, doorDeps({ reply, sent, supabase }));
  return sent.map((s) => s.text).join('\n');
}

// THE SPECIMEN CLASS, from F-06.29's own evening: an internal persona name in the model's
// vendor-facing prose (the July-22 business-mode shape, "Donna's snapshot shows").
await t('§2.1 THE WIRE IS CLEAN — a persona name in the model\'s reply never reaches the vendor', async () => {
  const wire = await wireFor('Donna pulled the file — Harvey says the Kapoor shoot is confirmed.');
  assert.ok(wire.length > 0, 'nothing was sent — the door never reached its outbound');
  assert.ok(!/\bDonna\b/.test(wire), `Donna crossed the wire: ${wire}`);
  assert.ok(!/\bHarvey\b/.test(wire), `Harvey crossed the wire: ${wire}`);
  assert.ok(/\bOperator\b/.test(wire) && /\bVictor\b/.test(wire),
    'the firewall dropped the names instead of mapping them to their vendor-facing forms');
});

await t('§2.2 THE VOCATIVE DEFECT DOES NOT RECUR — the wiring inherits scrub.js\'s cure, it does not re-open it', async () => {
  // F-04.27 layer (ii), scrub.js:136-161: a blind replacement RE-AIMED the sentence at the
  // vendor and read fine, which is why nobody noticed. The comma-clause must COLLAPSE.
  const wire = await wireFor("You've got a filing mess here, Donna. Pull the phone numbers.");
  assert.ok(!/,\s*Operator\b/.test(wire), `the vocative was REWRITTEN, not collapsed: ${wire}`);
  assert.ok(!/\bDonna\b/.test(wire));
  assert.ok(wire.includes("You've got a filing mess here. Pull the phone numbers."),
    `the collapse did not land cleanly: ${wire}`);
});

await t('§2.3 THE ID FLOOR RIDES THE SAME WIRE — a raw record id in the model\'s prose is stripped', async () => {
  const wire = await wireFor('Filed it under rec-34 for you.');
  assert.ok(!/rec-34/.test(wire), `a raw id crossed the wire: ${wire}`);
});

await t('§2.4 AN INNOCENT REPLY IS BYTE-UNCHANGED — the firewall is not a rewriter of ordinary prose', async () => {
  const clean = "Two things today: the Kapoor recce at 11 and Meera's balance is still open.";
  const wire = await wireFor(clean);
  assert.strictEqual(wire, clean, `an innocent reply was altered: ${wire}`);
});

// ── R3: THE SPLIT SCRUB, BENCHED BOTH WAYS ON THE SHIPPED, EXPORTED FUNCTION ──
await t('§2.5 THE FRAME SCRUBS — a persona name in the MODEL\'s half of a notification never reaches the vendor', () => {
  const out = scrubModelFrame('Donna summarised: she wants the sangeet covered.\n\nHer message: "can you do the sangeet?"', 'can you do the sangeet?');
  assert.ok(!/\bDonna\b/.test(out), out);
  assert.ok(/Operator summarised/.test(out), out);
});

await t('§2.6 THE QUOTE PASSES BYTE-EXACT — her sentence is never rewritten, even when SHE writes a persona name', () => {
  const hers = 'is Donna the one who called me?';
  const out = scrubModelFrame(`Donna note.\n\nHer message: "${hers}"`, hers);
  assert.ok(out.includes(`"${hers}"`), `HER WORDS WERE REWRITTEN: ${out}`);
  assert.ok(out.startsWith('Operator note.'), `the frame around her quote went unjudged: ${out}`);
});

await t('§2.7 THE SHORT-QUOTE TRAP IS CLOSED — a terse bride does not open the firewall', () => {
  // Splitting on the BARE verbatim shatters `Donna` into `D`+`na` for a quote of "on",
  // and neither fragment matches \bDonna\b. The quoted-token anchor is why this holds.
  // The fixture puts the quote BEFORE the name on purpose: with a bare-token split,
  // lastIndexOf('on') lands inside `Donna` itself, handing scrubText the fragments
  // `…"on" — D` and `na logged it.` — neither matching \bDonna\b. The name walks out.
  const out = scrubModelFrame('Her message: "on" — Donna logged it.', 'on');
  assert.ok(!/\bDonna\b/.test(out), `THE FIREWALL OPENED ON A TWO-LETTER MESSAGE: ${out}`);
  assert.ok(out.includes('"on"'), out);
});

await t('§2.8 FAIL-SAFE IS CLOSED — no quote found, or none supplied, and the WHOLE string scrubs', () => {
  assert.ok(!/\bDonna\b/.test(scrubModelFrame('Donna says hello', null)));
  assert.ok(!/\bDonna\b/.test(scrubModelFrame('Donna says hello', 'a sentence that is not in there')));
  assert.ok(!/\bDonna\b/.test(scrubModelFrame('Donna says hello', '')));
  assert.strictEqual(scrubModelFrame(null, 'x'), null);
});

await t('§2.9 ALL FOUR NOTIFICATION SITES ARE WIRED, each with the verbatim ITS OWN turn was handed', () => {
  const src = read(DOOR);
  // The pairing is the whole cure: a site passing the WRONG verbatim finds no quoted token
  // and scrubs her sentence whole — the exact defect R3 refused.
  // ── LABELED AMENDMENT · M-4 (BOTH-SIDES CLAUSE, §9) ──────────────────────────
  // M-4 / F-06.36 gave scrubModelFrame an OPTIONAL third argument (the wire witness),
  // so every call site's bytes changed. The old exact-string green is RETIRED, not
  // retained — a green over a shape nobody sends is indistinguishable from no test.
  // The pairing property is unchanged and is now asserted on the NEW shape, and the
  // cell is STRENGTHENED: each site must also carry its witness context, because an
  // unwitnessed wire scrub is exactly the defect F-06.36 filed.
  const pairs = [
    ['inboundMessage: originalMessage', /scrubModelFrame\(result\.vendorNotification,\s*originalMessage\s*,\s*\{[^}]*ctx:/],
    ['inboundMessage: body', /scrubModelFrame\(result\.vendorNotification,\s*body\s*,\s*\{[^}]*ctx:/],
    ["inboundMessage: stripRoutingToken(body) || 'hi'", /scrubModelFrame\(result\.vendorNotification,\s*stripRoutingToken\(body\) \|\| 'hi'\s*,\s*\{[^}]*ctx:/],
  ];
  for (const [turnArg, wire] of pairs) {
    assert.ok(src.includes(turnArg), `the turn shape moved: ${turnArg}`);
    assert.ok(wire.test(src), `site not wired with its own verbatim + witness: ${wire}`);
  }
  const wired = (src.match(/scrubModelFrame\(result\.vendorNotification/g) || []).length;
  assert.strictEqual(wired, 4, `expected FOUR wired notification sites, found ${wired}`);
  const bare = (src.match(/sendWhatsApp\([^,]+,\s*result\.vendorNotification\s*\)/g) || []).length;
  assert.strictEqual(bare, 0, 'a notification site still sends the model\'s words unscrubbed');
});

// ════════════════════════════════════════════════════════════════════════════
H('§3 — F-06.32: THE POSITIVE-QUALITY ARM (it observes and scores; it convicts nothing)');

// THE LIFT — b06_m1 §1's technique, same reason: requiring the gauntlet would run one.
const gsrc = read(GAUNTLET);
function liftConst(name) {
  const m = gsrc.match(new RegExp(`^const ${name} = .+$`, 'm'));
  if (!m) throw new Error(`shipped const ${name} is GONE from ${GAUNTLET} — the lift is stale, not the code`);
  return m[0];
}
function liftBlock(needle) {
  const start = gsrc.indexOf(needle);
  if (start < 0) throw new Error(`shipped block "${needle}" is GONE from ${GAUNTLET} — the lift is stale`);
  const open = gsrc.indexOf('{', start);
  let depth = 0;
  for (let j = open; j < gsrc.length; j++) {
    if (gsrc[j] === '{') depth++;
    else if (gsrc[j] === '}') { depth--; if (depth === 0) return gsrc.slice(start, j + 1); }
  }
  throw new Error(`unbalanced braces lifting "${needle}"`);
}
// ── LABELED FLOOR AMENDMENT · F-06.84 RULED (CE R-2, 2026-07-28): the lifted set follows
// the shipped split of HONEST_GAP_RE into its two phrase classes. Mandatory, not cosmetic:
// an unamended list throws at liftConst and takes all 37 cells with it. Count preserved: 37.
const CONSTS = ['RECENCY_ASK_RE', 'RECENCY_ABSENCE_RE', 'HONEST_TOOL_VOCAB_RE', 'ARRIVAL_DATED_RE',
                'REPLY_ARRIVAL_RE', 'HONEST_GAP_B_RE', 'HONEST_GAP_A_RE', 'FRESH_ITEM_RE'];
let LIFTED = null, liftErr = null;
try {
  const body = [liftBlock('const nestedHands ='), ...CONSTS.map(liftConst), liftBlock('function recencyFidelity(')].join('\n');
  LIFTED = new Function(`${body}\nreturn { recencyFidelity };`)();
} catch (e) { liftErr = e; }

await t('§3.0 the arm under test is the SHIPPED one — lifted as bytes, not paraphrased', () => {
  assert.ok(!liftErr, liftErr && liftErr.message);
  assert.strictEqual(typeof LIFTED.recencyFidelity, 'function');
  assert.ok(gsrc.includes(liftBlock('function recencyFidelity(')));
});

const recencyFidelity = (LIFTED || {}).recencyFidelity;
const ASK = 'anything new come in since we spoke?';
const HR = (name, result) => ({ name, input: {}, result });
const mkTurn = (reply, hands) => ({ reply, tool_calls: [{ name: 'dear_donna_talk', donna_calls: hands || [] }] });
const DATED = [HR('donna_find', 'On the enquiries plane:\n  [ENQUIRY] 7e3bd732 — "Dev Test 23" | state new | filed 25-07-26 14:20 IST')];

await t('§3.1 THE ANSWER IS SCORED — arrival named in the MOUTH reads `answered`', () => {
  const v = recencyFidelity(mkTurn('Two landed — Dev Test 23 came in this morning, Ritika about an hour ago.', DATED), ASK);
  assert.strictEqual(v.ok, true);
  assert.strictEqual(v.quality, 'answered');
});

await t('§3.2 THE 2:27 SHAPE IS SCORED DISTINCT — no false claim, no conviction, and NO REWARD either', () => {
  // The named target (F-06.18's third coat, CE-73): looked, received, and DEFERRED — the
  // composer routed the question back at the owner instead of answering it.
  const deferred = recencyFidelity(mkTurn("Do you want me to pull the day's log and check?", DATED), ASK);
  assert.strictEqual(deferred.ok, true, 'the arm must not convict an honest deferral');
  assert.strictEqual(deferred.quality, 'deferred');
  const answered = recencyFidelity(mkTurn('Dev Test 23 came in this morning.', DATED), ASK);
  assert.notStrictEqual(deferred.quality, answered.quality,
    'THE DISEASE F-06.32 FILED: an evasion and an answer scoring identically');
});

await t('§3.3 FOUR STATES, NEVER TWO — the honest gap and the denial are each their own score', () => {
  const gap = recencyFidelity(mkTurn("Nothing new that I can see — but straight with you: when anything arrived is not something this reach can say.", []), ASK);
  const denied = recencyFidelity(mkTurn('Nothing new has landed.', []), ASK);
  assert.strictEqual(gap.quality, 'gap');
  assert.strictEqual(gap.ok, true);
  assert.strictEqual(denied.quality, 'denied');
  assert.strictEqual(denied.ok, false, 'the ruled conviction path must be untouched by the scoring arm');
});

await t('§3.4 `ok` IS UNTOUCHED ON EVERY PATH — the arm observes, it does not convict', () => {
  const cases = [
    [mkTurn('Nothing new has landed.', []), false],
    [mkTurn('Nothing new has landed.', DATED), false],
    [mkTurn('Pipeline is where you left it — Keka and Divya moving.', DATED), true],
    [mkTurn('Dev Test 23 came in this morning.', DATED), true],
    [mkTurn('She is already on file — nothing new to add.', []), true],
  ];
  for (const [turn, expected] of cases) assert.strictEqual(recencyFidelity(turn, ASK).ok, expected);
});

await t('§3.5 NEVER PROSE ALONE — the score is gated on the ASK, read off the scenario and never off the reply', () => {
  const v = recencyFidelity(mkTurn('Dev Test 23 came in this morning.', DATED), 'Is the Priya Loop Probe on file with us?');
  assert.strictEqual(v.quality, 'n/a', 'a non-recency ask was scored as an answer to a question nobody put');
  assert.strictEqual(v.ok, true);
});

await t('§3.6 A DENIAL CANNOT SCORE ITSELF `answered` WITH ITS OWN LEFTOVERS — the absence-strip governs the score too', () => {
  // "no new enquiries landed today" carries an arrival verb and a day word. Unstripped it
  // would read as arrival evidence and reward the exact sentence it is the disease of.
  const v = recencyFidelity(mkTurn('No new enquiries landed today.', []), ASK);
  assert.notStrictEqual(v.quality, 'answered', `a denial scored itself as an answer: ${v.why}`);
});

await t('§3.7 EVERY RETURN CARRIES A QUALITY — a consumer never has to test for the field', () => {
  const all = [
    recencyFidelity(mkTurn('x', []), 'unrelated ask'),
    recencyFidelity(mkTurn('Nothing new has landed.', []), ASK),
    recencyFidelity(mkTurn('Nothing new has landed.', DATED), ASK),
    recencyFidelity(mkTurn('Dev Test 23 came in this morning.', DATED), ASK),
    recencyFidelity(mkTurn('Want me to check?', []), ASK),
  ];
  for (const v of all) assert.ok(typeof v.quality === 'string' && v.quality.length, JSON.stringify(v));
});

// ════════════════════════════════════════════════════════════════════════════
H('§4 — THE FENCES');


// ── LABELED AMENDMENT · BLOCK 06 M-4 (CE ruling R6-adjacent; F-06.34's CLASS, one
// ring wider) ────────────────────────────────────────────────────────────────────
// F-06.34 was cured at M-3 for §6.8 alone: a cell that diffs the WORKING TREE reads
// one answer before the founder's commit and another after, and reds on every LATER
// sitting that lawfully touches the same file. The cure (range-pin to this sitting's
// own seal) was applied to ONE cell; the class had SEVEN. M-4 is the sitting that
// found out — it opens W-1 by ruling and these cells convicted it of a breach that
// the CE had authorised. Range-pinned now, so each permanently asserts what ITS OWN
// sitting did and can never again be moved by a future tree. Count preserved.
const M3_RANGE = '981e9ba..875621f'; // M-3's own seal range — fixed for good (M-4 re-pin)
await t('§4.1 W-1 ABSOLUTE — zero soul/lens bytes moved in this sitting', () => {
  const names = execFileSync('git', ['diff', '--name-only', M3_RANGE], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const forbidden = names.filter((f) => /donnaSoul|harveySoul|advisorLens|consultantHarveySoul|Prompt|soul/i.test(f));
  assert.deepStrictEqual(forbidden, [], `soul surfaces moved: ${forbidden.join(', ')}`);
});

await t('§4.2 THE FIREWALL\'S HOME IS UNTOUCHED — this sitting wired a CALLER, it did not fork scrub.js', () => {
  // scrub.js's own header: "THERE IS NO OTHER FILE." The cure is a caller, composed the
  // way chat.js and calendarSignals.js compose it — and b06_m0 §7.2 guards this file, so
  // touching it would red the founder's own verify.
  const names = execFileSync('git', ['diff', '--name-only', M3_RANGE], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  assert.ok(!names.includes(SCRUB), 'scrub.js was touched — the guarded firewall home');
});

await t('§4.3 THE FIXED-COPY SITES ARE BYTE-UNCHANGED — the founder\'s veto owns those words, not this cure', () => {
  const src = read(DOOR);
  // Named individually (R7): scrubbing founder-vetoed fixed copy is a behaviour change and
  // was never chartered. Each must still reach the wire unmediated.
  const fixed = [
    "sendWhatsApp(phone, getNudgeCopy('opt_out_confirmation'), [], undefined, ACK_BYPASS)",
    "sendWhatsApp(phone, getNudgeCopy('resume_confirmation'), [], undefined, ACK_BYPASS)",
    "sendWhatsApp(phone, getNudgeCopy('full_stop_confirmation'), [], undefined, ACK_BYPASS)",
    "sendWhatsApp(phone, getNudgeCopy('full_start_confirmation'), [], undefined, ACK_BYPASS)",
    '"I couldn\'t make out any events from this image. Try cropping closer or sending a clearer screenshot of the calendar view."',
    '"I read the calendar but had trouble saving the draft. Please try sending the image again."',
    '"I\'ll be able to process images and voice notes really soon — but for now, please type your message and I\'ll help."',
    'sendWhatsApp(phone, confirmation, [])',
    'sendWhatsApp(phone, FRESH_THREAD_LINE, [])',
    'sendWhatsApp(phone, webhookCore.GRACEFUL_TURN_LINE)',
    "`New enquiry via your TDW link from ${phone}. I'm collecting their details now.`",
  ];
  for (const f of fixed) assert.ok(src.includes(f), `a founder-vetoed fixed string moved or was wrapped: ${f}`);
});

await t('§4.4 THE FIREWALL\'S REACH IN THIS FILE IS FULLY ACCOUNTED — no scrub sits on vetoed copy', () => {
  const src = read(DOOR);
  const inventory = {
    'scrubText(s)': 2,                                    // scrubModelFrame's two fail-safe returns
    'scrubText(s.slice(': 2,                              // the frame either side of the quote
    'scrubText(result.reply)': 1,                         // R2 — the vendor-self reply
    // LABELED AMENDMENT (TDW_06 M-2, 2026-07-29 — the bench follows the law, CE-80).
    // COUNT PRESERVED; the ledger's MEANING is unchanged and its reach is now complete.
    // Fork D's retry-the-actor leg composes a SECOND reply when a costume's retry lands
    // the act, and that reply must cross the persona firewall exactly as the first does.
    // An unaccounted scrub is the thing this cell exists to catch, so it is accounted:
    // this is a scrub on MODEL PROSE, never on founder-vetoed copy (the Stage 2 lines are
    // constants and are shipped unscrubbed by construction).
    // LABELED AMENDMENT (TDW_06 F-06.136, CE-110's last charter; COUNT PRESERVED — this
    // is the same ledger entry, its number moved from 1 to 2 and the second instance is
    // named). The imperative arm adds a SECOND landed-retry reply: when an owner-imperative
    // drew no hand and the re-run of the actor files it, that reply ships instead of the
    // first and must cross the persona firewall exactly as both siblings do. Same class,
    // same argument, MODEL PROSE — never founder-vetoed copy. The arm's OTHER outcome
    // writes nothing at all, which is why this number is 2 and not 3.
    'scrubText(retry.reply)': 2,                          // M-2 Fork D's landed retry + F-06.136's
    'scrubModelFrame(result.vendorNotification': 4,       // R3 — the four notification sites
    'function scrubModelFrame(': 1,                       // the declaration itself
  };
  let counted = 0;
  for (const [needle, n] of Object.entries(inventory)) {
    const got = src.split(needle).length - 1;
    assert.strictEqual(got, n, `inventory drift: ${needle} appears ${got}×, expected ${n}`);
    counted += n;
  }
  const total = (src.match(/scrubText\(|scrubModelFrame\(/g) || []).length;
  assert.strictEqual(total, counted,
    `${total} firewall call sites in this file, ${counted} accounted for — an unaccounted scrub may be sitting on founder-vetoed copy`);
});

await t('§4.5 THE PREVIEW IS NAMED-LEFT, AS RULED — OCR calendar content is not persona prose', () => {
  assert.ok(/const sent = await sendWhatsApp\(phone, previewMsg\);/.test(read(DOOR)),
    'the :337 preview moved — R2 ruled it named-left; a change here is a scope breach, not a fix');
});

// ════════════════════════════════════════════════════════════════════════════
H('§5 — NON-VACUOUS: RED AT THE UNCURED TREE, BY PRODUCTION MUTATION');

const MUTATIONS = [
  { cell: '§1.1', why: 'a FOURTH Sonnet site is planted in production code — the allowlist must catch it',
    file: LOOP,
    from: 'export async function runTurn(',
    to: 'const _planted = MODELS.sonnet;\nexport async function runTurn(' },
  { cell: '§1.2', why: 'the carve-out loses its declaration — a survivor with no stated status',
    file: DISTILL, from: '    // THIS CARVE-OUT IS THE CLARIFICATION OF E-1, NOT AN EXCEPTION BY STEALTH. It was',
    to: '    // (the declaration, struck by the mutation)' },
  { cell: '§2.1', why: 'the reply reaches the wire unscrubbed again — F-06.29 restored',
    file: DOOR, from: "let replyText = witnessWireScrub(supabase, vendor.id, 'whatsapp', String(result.reply ?? ''), scrubText(result.reply), 'vendorInbound:reply');", to: 'let replyText = result.reply;' },
  { cell: '§2.5', why: 'the notification frame stops scrubbing — the model\'s persona name reaches the vendor',
    file: DOOR, from: '  return scrubText(s.slice(0, at)) + token + scrubText(s.slice(at + token.length));',
    to: '  return s.slice(0, at) + token + s.slice(at + token.length);' },
  { cell: '§2.8', why: 'the fail-safe opens instead of closing — no quote supplied and the string passes unjudged',
    file: DOOR, from: '  if (!q) return scrubText(s);\n    const token', to: '  if (!q) return s;\n  const token' },
  { cell: '§2.6', why: 'the quote stops being preserved — HER words get rewritten, the vocative family\'s disease',
    file: DOOR, from: '  return scrubText(s.slice(0, at)) + token + scrubText(s.slice(at + token.length));',
    to: '  return scrubText(s);' },
  { cell: '§2.7', why: 'the anchor drops its quotes — a two-letter message shatters the frame and opens the firewall',
    file: DOOR, from: "  const token = '\"' + q + '\"';", to: '  const token = q;' },
  // ── LABELED FLOOR AMENDMENT · F-06.84 RULED (CE R-1, 2026-07-28): the needle follows the
  // shipped bytes. The ruled ordering inserts the `spokeGapPhrase` limb between
  // `claimsAbsence` and the default, so the two-line tail this needle matched no longer
  // exists. MEANING UNCHANGED — the DEFAULT arm is redirected, so a deferral scores as an
  // answer and the arm stops distinguishing evasion from the cure's own product. Re-aimed
  // at the referent, not re-aimed to stay green. CAUGHT BY RUNNING, not by census: this
  // needle was NOT in the read-first's enumeration, and unamended it printed
  // `MUTATION ANCHOR MISSING` — the executor's own miss, filed rather than papered.
  { cell: '§3.2', why: 'the deferral scores as an answer — the arm stops distinguishing evasion from the cure\'s own product',
    file: GAUNTLET, from: "    : spokeGapPhrase ? 'gap'\n    : 'deferred';", to: "    : spokeGapPhrase ? 'gap'\n    : 'answered';" },
  { cell: '§3.6', why: 'the score reads the RAW reply — a denial acquits itself with its own leftovers',
    file: GAUNTLET, from: "  const quality = replyDated ? 'answered'",
    to: "  const quality = (replyDated || REPLY_ARRIVAL_RE.test(reply)) ? 'answered'" },
];

if (!process.env.B06_M3_BENCH_CHILD) {
  const originals = new Map();
  for (const m of MUTATIONS) {
    const abs = P(m.file);
    const before = fs.readFileSync(abs, 'utf8');
    if (!originals.has(m.file)) originals.set(m.file, before);
    let red = false, note = '';
    if (!before.includes(m.from)) {
      note = `MUTATION ANCHOR MISSING in ${m.file}: ${m.from.slice(0, 70)}`;
    } else {
      fs.writeFileSync(abs, before.replace(m.from, m.to));
      let out = '';
      try {
        out = execFileSync(process.execPath, [__filename], {
          cwd: ROOT, encoding: 'utf8', env: { ...process.env, B06_M3_BENCH_CHILD: '1' },
        });
      } catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
      fs.writeFileSync(abs, before);
      red = out.includes(`FAIL ${m.cell}`);
    }
    await t(`§5 ${m.cell} REDS at the uncured tree — ${m.why}`, () => {
      assert.ok(!note, note);
      assert.ok(red, `${m.cell} stayed GREEN with the cure removed — the cell proves nothing`);
    });
  }
  await t('§5.0 every mutated file is restored BYTE-IDENTICAL', () => {
    for (const [rel, before] of originals) {
      assert.strictEqual(read(rel), before, `${rel} was not restored`);
    }
  });
}

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) {
  console.log('GREEN — every model choice is ruled, not inherited; the firewall reaches the wire that actually bleeds; her words stay hers; and an evasion no longer scores like an answer.');
}
process.exit(fail === 0 ? 0 : 1);
}

main();
