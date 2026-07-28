// b06_forkc_wireguard_bench.js — TDW_06 THE DONNA CURE SITTING + WIRE GUARD STAGE 1.
//
// What this bench is for, in one line: FORK C HANDS VICTOR'S COMPOSER THE DOORS' OWN
// PLAIN SPEECH, AND NOTHING THAT IS NOT PLAIN SPEECH.
//
// The sitting's rulings it witnesses:
//   R-1/F-06.102 — the receipt is plain speech; the DISPLAY that carries it is not.
//   R-2 — payload scope (D): write-class plain clauses + read-class arrival evidence.
//   R-3 — the two founder-vetoed worked examples, sited beneath the laws they work.
//   R-8 — the carrier's `plain` field, FAIL-CLOSED: no fallback to `result`, ever.
//   Stage 1 — the costume detector productionized, REPORT-ONLY, zero vendor delta.
//
// Every cell here is a DESK cell: source-derived or fixture-driven, no network, no DB.
// The seam's LIVE verdict is Evening Three's and is declared, never claimed (F-06.81's
// own discipline). Where a cell evaluates a shipped expression it EXTRACTS IT FROM THE
// SOURCE rather than restating it — a bench that re-implemented the seam would prove
// its own copy and nothing else (b06_m2_bench §7.3's house pattern).
'use strict';
const assert = require('assert');
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0;
const t = (n, f) => { try { f(); console.log(`  ok   ${n}`); pass++; } catch (e) { console.log(`  FAIL ${n}\n       ${e.message}`); fail++; } };
const H = (s) => console.log(`\n${s}`);

const SOUL = 'src/engine/src/core/donnaSoul.ts';
const LOOP = 'src/engine/src/core/loop.ts';
const DONNA = 'src/engine/src/core/donna.ts';
const LEAD = 'src/engine/src/core/tools/donnaLead.ts';
const FIND = 'src/engine/src/core/tools/donnaFind.ts';
const TYPES = 'src/engine/src/core/snapshotTypes.ts';
const CHAT = 'src/api/vendor-engine/chat.js';
const RIG = 'scripts/b06_gauntlet.js';

const soulLiteral = (src) => {
  const open = src.indexOf('export const DONNA_SOUL = `');
  assert.ok(open > 0, 'the soul literal could not be located — re-derive');
  const start = open + 'export const DONNA_SOUL = `'.length;
  return src.slice(start, src.indexOf('`;', start));
};

// ─────────────────────────────────────────────────────────────────────────────
H('§1 — THE LOCKED BYTES (R-3): the founder\'s two worked examples, verbatim, beneath their laws');

const EX1_RECEIPT = "Matched the existing lead 'Kavya Menon'. Not written — the record already stands: the city stays Kochi (you said Goa), the wedding date stays 12 September 2027 (you said 9 October 2027). If either should change, say so and I'll change it.";
const EX1_VOICE = "Listen Harvey — Kavya's already on file, and the record disagrees with what you've just given. It holds Kochi, 12 September 2027; you said Goa, 9 October. Nothing was overwritten. Which is right — or are these two different weddings?";
const EX2_VOICE = "Listen Harvey — three live ones. Ritu Sharma, filed 2 August, touched 27 August — she's the one moving. Aman Khatri, nothing since 20 July. Divya Nair, filed 27 August, new. One follow-up due Friday, on Ritu. Nothing else has stirred.";

t('§1.1 EXAMPLE 1 is present in the soul literal BYTE-EXACT — receipt half and voiced half', () => {
  const lit = soulLiteral(read(SOUL));
  assert.ok(lit.includes(EX1_RECEIPT), "Example 1's receipt bytes are not verbatim in the literal");
  assert.ok(lit.includes(EX1_VOICE), "Example 1's voiced bytes are not verbatim in the literal");
});

t('§1.2 EXAMPLE 2 is present BYTE-EXACT', () => {
  assert.ok(soulLiteral(read(SOUL)).includes(EX2_VOICE), "Example 2's briefing bytes are not verbatim in the literal");
});

t('§1.3 EACH EXAMPLE SITS BENEATH THE LAW IT WORKS (CE-91: no law outranks a worked example)', () => {
  const lit = soulLiteral(read(SOUL));
  const relayLaw = lit.indexOf('WHAT YOU REPORT IS WHAT THE PAPER SAYS');
  const weekLaw = lit.indexOf('HOW YOU TAKE THE TEMPERATURE OF THE WEEK');
  assert.ok(relayLaw >= 0 && weekLaw > relayLaw, 'the two laws are missing or out of order — re-derive');
  assert.ok(lit.indexOf(EX1_VOICE) > relayLaw && lit.indexOf(EX1_VOICE) < weekLaw,
    'Example 1 is not sited inside the relay law\'s stretch');
  assert.ok(lit.indexOf(EX2_VOICE) > weekLaw, 'Example 2 is not sited beneath the week law');
});

t('§1.4 THE COMPOSED CACHED PREFIX CARRIES BOTH EXAMPLES BYTE-EXACT — what the model reads, not what the file holds', () => {
  const dist = P('src/engine/dist/core/donnaSoul.js');
  assert.ok(fs.existsSync(dist), 'engine dist absent — run npm run build; this cell reads what the model reads');
  const { DONNA_SOUL } = require(dist);
  assert.ok(DONNA_SOUL.includes(EX1_RECEIPT) && DONNA_SOUL.includes(EX1_VOICE), 'Example 1 did not survive compilation into the prefix');
  assert.ok(DONNA_SOUL.includes(EX2_VOICE), 'Example 2 did not survive compilation into the prefix');
  const src = read(DONNA);
  assert.ok(/const DONNA_STATIC_PREFIX =\n    DONNA_SOUL \+/.test(src),
    'DONNA_STATIC_PREFIX no longer opens on DONNA_SOUL — the examples may not be in the cached prefix at all');
});

t('§1.5 THE FIXTURE-DISJOINTNESS LAW, DIRECTION ONE — no example name/city reaches the gauntlet\'s SCRIPTED FIXTURES', () => {
  // ── SCOPE, DERIVED AND LABELED (executor, disclosed at delivery). The law governs
  // FIXTURES: the scripted worlds the instrument drives a model through. It cannot
  // govern the rig's BANKED VERBATIM SPECIMENS — frozen captures of real production
  // replies, held as evidence — for amendment #3's exact reason: editing banked evidence
  // to satisfy a later law falsifies the record. The one such block is the 2026-07-23
  // 19:50:30 specimen (message cc4e1f32), excluded here BY NAME, never silently. Two of
  // the founder's example FIRST names occur inside it; filed at §1.5b, not papered.
  const rig = read(RIG);
  const specStart = rig.indexOf('THE SPECIMEN, VERBATIM (2026-07-23 19:50:30');
  assert.ok(specStart > 0, 'the banked specimen block moved — re-derive this cell\'s exclusion before trusting it');
  const specEnd = rig.indexOf('const SPEC_HANDS', specStart);
  const fixtures = rig.slice(0, specStart) + rig.slice(specEnd);
  for (const n of ['Kavya Menon', 'Ritu Sharma', 'Ritu', 'Aman Khatri', 'Aman', 'Divya Nair', 'Kochi', 'Menon', 'Khatri', 'Nair']) {
    assert.ok(!new RegExp(`\\b${n}\\b`).test(fixtures),
      `the example name/city "${n}" has entered the gauntlet's scripted fixtures — the example teaches the shape, the instrument tests transfer; they must not share a world`);
  }
});

t('§1.5b THE COLLISION INSIDE THE BANKED SPECIMEN, FILED NOT PAPERED — "Kavya" and "Divya" were in the rig BEFORE the veto', () => {
  // FILED, UNNUMBERED, UP TO THE CHAIR. The founder's Example 1 names a Kavya and his
  // Example 2 a Divya; the rig's frozen 2026-07-23 production capture already contained
  // both, as FIRST NAMES OF OTHER PEOPLE. The bytes are locked and the specimen is
  // evidence, so NEITHER side may be edited — the collision is recorded here so it is a
  // fact rather than a silence. Assessed and stated: the channel this law protects is a
  // model TAUGHT on the instrument's fixtures; a banked specimen is a string the ARM is
  // tested against, never a world a model is driven through. The SURNAMES are disjoint,
  // which is what any name-fidelity arm actually keys on.
  const rig = read(RIG);
  assert.ok(/Kavya/.test(rig) && /Keka and Divya/.test(rig),
    'the banked specimen changed — if it was edited that is a falsified record; if replaced, re-derive this filing');
  assert.ok(!/Kavya Menon|Divya Nair/.test(rig), 'a FULL example name reached the rig — that is the breach this law actually forbids');
});

t('§1.6 THE FIXTURE-DISJOINTNESS LAW, DIRECTION TWO — no gauntlet trap name reaches THE VETOED EXAMPLE BLOCKS', () => {
  // SCOPED TO THE EXAMPLE BLOCKS, which is what constraint (1) governs: this sitting's
  // authored pass. The soul's PRE-EXISTING prose is a separate, INHERITED matter, filed
  // at §1.6b rather than quietly folded in here.
  const lit = soulLiteral(read(SOUL));
  const blocks = [
    lit.slice(lit.indexOf('\nHarvey: "Log an update to Kavya Menon'), lit.indexOf('false certainty wearing your voice.')),
    lit.slice(lit.indexOf('\nHarvey: "Give me the week\'s shape'), lit.indexOf('it is noise.')),
  ].join('\n');
  assert.ok(blocks.length > 500, 'the example blocks could not be located — re-derive');
  for (const n of ['Meera', 'Meher', 'Vera', 'Priya', 'Tanya', 'Nisha', 'Riya', 'Zoya', 'Sana', 'Nena', 'Jaipur', 'Udaipur', 'Rahul', 'Keka', 'Rao', 'Ananya']) {
    assert.ok(!new RegExp(`\\b${n}\\b`).test(blocks),
      `the gauntlet trap name "${n}" has entered a vetoed example — a model taught on the instrument's own fixtures is a model the instrument can no longer test`);
  }
});

t('§1.6b THE INHERITED BREACH, FILED NOT PAPERED — donnaSoul\'s PRE-EXISTING prose already names Meera and Vera', () => {
  // FILED, UNNUMBERED, UP TO THE CHAIR, AND NOT THIS SITTING'S TO CURE. The
  // temperature-of-the-week law has read "where Meera's stands, what Vera has paid"
  // since long before this sitting — and "Meera Gauntlet" and "Vera Gauntlet" are two of
  // the rig's own trap fixtures. Direction two was ALREADY violated at the tip this
  // sitting opened on. Found by RUNNING the disjointness cell against the whole literal,
  // which is R-7's standing law earning its keep on its first outing. Curing it means
  // opening W-1 on prose the founder's veto owns, on a sitting whose W-1 opening was
  // granted for two named example blocks and nothing else. So: asserted, named, handed
  // up. THIS CELL EXISTS TO GO RED THE DAY IT IS CURED.
  const lit = soulLiteral(read(SOUL));
  assert.ok(/where Meera's stands, what Vera has paid/.test(lit),
    'the inherited breach is gone — if cured, retire this cell with attribution; if the prose merely moved, re-derive');
});

t('§1.7 ZERO RELATIVE-TIME WORDS AND ZERO MONEY in the shipped example bytes (constraints 2 and 3)', () => {
  const both = `${EX1_RECEIPT}\n${EX1_VOICE}\n${EX2_VOICE}`;
  const REL = /\b(?:yesterday|today|tomorrow|last week|this week|next week|recently|an hour ago|minutes? ago|hours? ago|just now|earlier|lately)\b/i;
  assert.ok(!REL.test(both), 'a relative-time word reached the example bytes — every date in them must be absolute');
  const MONEY = /(?:₹|\bRs\.?\s*\d|\bINR\b|\b\d+\s*(?:k|L|lakh|lakhs|cr|crore)\b|\b\d{1,3},\d{3}\b)/i;
  assert.ok(!MONEY.test(both), 'a money figure reached the example bytes');
});

// ─────────────────────────────────────────────────────────────────────────────
H('§2 — THE CARRIER (R-8): `plain` rides beside `result`, additively, and FAIL-CLOSED');

t('§2.1 ToolOutcome carries the optional plain field, and it is OPTIONAL — a door that authors none is lawful', () => {
  const ty = read(TYPES);
  assert.ok(/plain\?: string \| null;/.test(ty), 'ToolOutcome has no plain field');
});

t('§2.2 THE CARRIER IS ADDITIVE AT ALL FOUR SITES — every existing consumer of `result` is untouched', () => {
  const d = read(DONNA), l = read(LOOP);
  assert.ok(/tool_calls: \{ name: string; input: unknown; result: string; plain\?: string \| null \}\[\];/.test(d), 'DonnaTurn.tool_calls did not widen');
  assert.ok(/onAction\?: \(a: \{ name: string; input: unknown; result: string; plain\?: string \| null \}\) => void,/.test(d), 'onAction did not widen');
  assert.ok(/const record = \(name: string, input: unknown, result: string, plain\?: string \| null\)/.test(d), 'record() did not widen');
  assert.ok(/donna_calls\?: \{ name: string; input: unknown; result: string; plain\?: string \| null \}\[\]/.test(l), 'donna_calls did not widen');
  assert.ok(/result: string;/.test(d) && /result: dc\.result/.test(l), '`result` stopped riding — the witness machinery reads it and must be undisturbed');
});

t('§2.3 :706 PERSISTS plain ADDITIVELY — the key appears only when a door authored one', () => {
  assert.ok(/donna_calls: donna\.tool_calls\.map\(\(dc\) => \(\{ name: dc\.name, input: dc\.input, result: dc\.result, \.\.\.\(dc\.plain \? \{ plain: dc\.plain \} : \{\}\) \}\)\)/.test(read(LOOP)),
    'the :706 persistence does not carry plain, or does not carry it additively');
});

t('§2.4 FAIL-CLOSED, THE GREP-SHAPED NEGATIVE: the Fork C seam NEVER reads `result` and has NO fallback to it', () => {
  const l = read(LOOP);
  const i = l.indexOf('const plainReceipts = donna.tool_calls');
  assert.ok(i > 0, 'the Fork C composition is absent — re-derive');
  const seam = l.slice(i, l.indexOf('continue;', i));
  assert.ok(/dc\.plain/.test(seam), 'the seam does not read plain');
  assert.ok(!/dc\.result/.test(seam), 'W-1/F-06.102 BREACH: the Fork C seam reads `result` — the machinery donor is back in Victor\'s composer');
  assert.ok(!/\|\|\s*dc\./.test(seam) && !/\?\?\s*dc\./.test(seam), 'the seam has a fallback — R-8 forbids one; a door with nothing plain to say contributes nothing');
});

t('§2.5 FAIL-CLOSED, THE BEHAVIOURAL PROOF: the SHIPPED expression, extracted and run — a hand with no plain contributes NOTHING', () => {
  const l = read(LOOP);
  const i = l.indexOf('const plainReceipts = donna.tool_calls');
  const j = l.indexOf('results.push({ type: \'tool_result\'', i);
  const shipped = l.slice(i, j);
  const run = (calls, voiced) => new Function('donna', 'voiced', `${shipped}\nreturn composedForVictor;`)({ tool_calls: calls }, voiced);
  // a door with a plain clause: it reaches the composer
  assert.ok(run([{ name: 'donna_lead', result: 'MACHINERY (id=abc) — wedding_city', plain: 'the city stays Kochi (you said Goa)' }], 'Listen Harvey — done.')
    .includes('the city stays Kochi (you said Goa)'), 'the plain clause did not reach the composer');
  // the SAME hand's `result` never does — this is F-06.102's whole cure
  assert.ok(!run([{ name: 'donna_lead', result: 'MACHINERY (id=abc) — wedding_city', plain: 'the city stays Kochi (you said Goa)' }], 'Listen Harvey — done.')
    .includes('id=abc'), 'F-06.102 BREACH: `result` reached the composer beside the plain clause');
  // a door with NO plain: the composer receives her voiced sentence and nothing else
  assert.strictEqual(run([{ name: 'donna_lead', result: 'MACHINERY (id=abc)' }], 'Listen Harvey — done.'), 'Listen Harvey — done.',
    'a hand with no plain clause contributed something — the fail-closed law is broken');
  // zero hands: byte-identical to the pre-Fork-C behaviour
  assert.strictEqual(run([], 'Listen Harvey — nothing pending.'), 'Listen Harvey — nothing pending.',
    'a zero-hand turn is no longer byte-identical to the pre-Fork-C seam');
});

t('§2.6 UNLABELED (F-06.52): the composition carries NO framing header, NO banner, NO machinery vocabulary', () => {
  const l = read(LOOP);
  const i = l.indexOf('const plainReceipts = donna.tool_calls');
  const j = l.indexOf('results.push({ type: \'tool_result\'', i);
  const shipped = l.slice(i, j);
  const run = (calls, voiced) => new Function('donna', 'voiced', `${shipped}\nreturn composedForVictor;`)({ tool_calls: calls }, voiced);
  const out = run([{ name: 'donna_lead', result: 'x', plain: 'the city stays Kochi (you said Goa)' }], 'Listen Harvey — done.');
  assert.ok(!/\[[^\]]*\]/.test(out), 'a bracketed label reached the composition — F-06.52\'s exact donor shape');
  assert.ok(!/receipt|the door|tool result|hand result|snapshot|Operator/i.test(out), 'machinery vocabulary reached the composition');
  assert.ok(out.startsWith('Listen Harvey —'), 'her voiced sentence is no longer first — the receipt must arrive BESIDE her words, never instead of or ahead of them');
});

t('§2.7 THE PROVENANCE HOLD AUTHORS NO PLAIN — the first seam that tested fail-closed, and it held', () => {
  const d = read(DONNA);
  assert.ok(/record\(tu\.name, tu\.input, heldMoney\.display\);/.test(d),
    'the provenance hold passes a plain clause — a hold wrote nothing and its sentence is aimed at Donna, not Harvey');
});

// ─────────────────────────────────────────────────────────────────────────────
H('§3 — THE DOORS (R-2): what may go in `plain`, and what may never');

t('§3.1 donnaLead authors the F-06.92 clause family and NOTHING ELSE — the receipt, never the display', () => {
  const s = read(LEAD);
  assert.ok(/const plainClause = notWritten\.length \? notWrittenNote\.trim\(\) : undefined;/.test(s),
    'donnaLead\'s plain clause is not derived from notWrittenNote');
  assert.ok(!/plain: `/.test(s), 'donnaLead composes a plain clause from a template rather than from the receipt — re-derive');
  assert.strictEqual((s.match(/plain: plainClause/g) || []).length, 2, 'the plain clause is not on both return sites');
});

t('§3.2 AND ITS PLAIN CLAUSE IS MACHINERY-FREE, PROVEN ON THE SHIPPED RENDER (F-06.102, both directions)', () => {
  // The live shapes, rebuilt from the shipped template strings with the example's values.
  const notWritten = ['the city stays Kochi (you said Goa)', 'the wedding date stays 12 September 2027 (you said 9 October 2027)'];
  const tail = notWritten.length === 1 ? 'If that should change' : notWritten.length === 2 ? 'If either should change' : 'If any should change';
  const plain = ` Not written — the record already stands: ${notWritten.join(', ')}. ${tail}, say so and I'll change it.`.trim();
  const display = `Updated existing lead "Kavya Menon" (id=8f3c1d2e-4a5b-4c6d-9e0f-1a2b3c4d5e6f) — wedding_city, wedding_date. (Typed lead — this id is not a binder; binder hands like follow-ups, money or notes don't attach to it.)${plain}`;
  // THE PLAIN CLAUSE: clean.
  assert.ok(!/id=/.test(plain), 'an id= reached the plain clause');
  assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/.test(plain), 'a uuid reached the plain clause');
  assert.ok(!/wedding_city|wedding_date|binder_id|agent_id/.test(plain), 'a raw column key reached the plain clause');
  assert.ok(!/binder hands like follow-ups|Typed lead/.test(plain), 'the binder-machinery clause reached the plain clause');
  assert.ok(!/donna_\w+/.test(plain), 'a tool name reached the plain clause');
  // AND THE DISPLAY IS NOT CLEAN — which is exactly why the seam may never read it.
  assert.ok(/id=/.test(display) && /wedding_city/.test(display) && /Typed lead/.test(display),
    'the display no longer carries machinery — F-06.102\'s premise has changed; re-read the seam and this cell before shipping');
});

t('§3.3 donnaFind\'s read-class plain is ARRIVAL EVIDENCE ONLY — no money, no phone, no id, no rows (R-2, F-06.13\'s door stays shut)', () => {
  const s = read(FIND);
  const i = s.indexOf('function plainArrival(');
  assert.ok(i > 0, 'plainArrival is absent');
  const body = s.slice(i, s.indexOf('\n}', i));
  assert.ok(!/amount|budget|phone|payment|doc_ref|note|stage|r\.id/.test(body),
    'the read-class plain clause reaches for enrichment — money/phones/ids/rows are F-04.70\'s donor pool and F-06.13\'s open disease');
  assert.ok(/arrivalStamp\(r\.created_at, IST\)/.test(body) && /touchedStamp\(r\)/.test(body),
    'the arrival evidence is not derived from the estate\'s own stamps');
  assert.ok(/if \(!filed && !touched\) continue;/.test(body),
    'a row with no derivable stamp contributes something — it must contribute nothing rather than a guess');
});

t('§3.4 F-06.85 BOTH DIRECTIONS: donnaLead names the example, donnaSoul names the mechanism', () => {
  assert.ok(/donnaSoul|WORKED EXAMPLE 1/.test(read(LEAD)), 'donnaLead does not point at the worked example it is now bound to');
  const head = read(SOUL).slice(0, read(SOUL).indexOf('export const DONNA_SOUL'));
  assert.ok(/notWrittenNote/.test(head) && /notWrittenTail/.test(head), 'the soul header does not name the mechanism Example 1 is conditioned on');
});

t('§3.5 F-06.85, THE SEAM DIRECTION: loop.ts:710 names the attribution branches it just falsified', () => {
  const l = read(LOOP);
  const i = l.indexOf('FORK C (TDW_06 Donna cure sitting');
  assert.ok(i > 0, 'the Fork C header is absent');
  const head = l.slice(i, l.indexOf('const plainReceipts', i));
  assert.ok(/handAttribution/.test(head) && /NEVER RECEIVED THE DATES/.test(head),
    'the seam does not name the arm sentence it killed — F-06.85\'s whole point is that the next sitting is FORCED to re-read it');
});

// ─────────────────────────────────────────────────────────────────────────────
H('§4 — THE ATTRIBUTION AMENDMENT (R-4): #1, #2, #4 follow the seam; #3 stays banked history');

t('§4.1 THE FALSIFIED SENTENCE IS GONE FROM THE RIG — no branch still claims the composer receives the voiced text alone', () => {
  assert.ok(!/NEVER RECEIVED THE DATES \(loop\.ts:710 hands him the voiced text alone\)/.test(read(RIG)),
    'the rig still asserts a mechanism that Fork C made false');
});

t('§4.2 BOTH BRANCHES RE-AIMED — DROPPED and STRANDED each name Fork C and convict BOTH mouths', () => {
  const rig = read(RIG);
  const dropped = rig.slice(rig.indexOf('DATES DROPPED IN THE RELAY'), rig.indexOf('DATES SURVIVED THE RELAY'));
  const stranded = rig.slice(rig.indexOf('DATES STRANDED'), rig.indexOf('DATES DROPPED IN THE RELAY'));
  for (const [n, s] of [['DROPPED', dropped], ['STRANDED', stranded]]) {
    assert.ok(/Fork C \(loop\.ts:710\)/.test(s), `the ${n} branch does not name the seam it now depends on`);
    assert.ok(/HER relay's loss/.test(s) && /VICTOR'S composition/.test(s), `the ${n} branch does not convict both mouths`);
    assert.ok(/Both mouths/.test(s), `the ${n} branch has not lost its exclusivity`);
  }
});

t('§4.3 AMENDMENT #3 DID NOT FOLLOW — the FINDINGS_LOG keeps the sentence as banked evidence', () => {
  assert.ok(/NEVER RECEIVED THE DATES/.test(read('docs/FINDINGS_LOG.md')),
    'the banked evidence line was edited — that is a record of what the instrument said on an evening, and amending it would falsify the record');
});

// ─────────────────────────────────────────────────────────────────────────────
H('§5 — WIRE GUARD STAGE 1: report only, one home, both sites, zero vendor delta');

// chat.js pulls the engine dist (and through it a live supabase client) on load.
// The gauntlet's OWN fence is the ratified way to read this file at a desk
// (b06_gauntlet.js:146-158) — noop the foreign requires, take the real seams, drop the
// fence, then PURGE everything under src/ that loaded inside the window so nothing
// poisoned survives in require.cache (the V3 fence-hygiene lesson, honoured here).
const cl0 = (x) => chat.wireGuardClassify(null, x);
const chat = (() => {
  const Module = require('module');
  const _load = Module._load;
  const BUILTIN = new Set(Module.builtinModules);
  const noop = () => new Proxy(function () {}, { get: () => noop() });
  Module._load = function (req) {
    if (req === 'express') { const e = () => {}; e.Router = () => ({ get() {}, post() {}, patch() {}, put() {}, delete() {}, use() {} }); return e; }
    if (/engine[\\/]dist[\\/]/.test(req)) return noop();
    if (!req.startsWith('.') && !req.startsWith('/') && !req.startsWith('node:') && !BUILTIN.has(req)) return noop();
    return _load.apply(this, arguments);
  };
  let mod;
  try { mod = require(P(CHAT)); } finally { Module._load = _load; }
  const SRC_PREFIX = path.join(ROOT, 'src') + path.sep;
  for (const k of Object.keys(require.cache)) if (k.startsWith(SRC_PREFIX)) delete require.cache[k];
  return mod;
})();

t('§5.1 THE VOCABULARY HAS ONE HOME, AND IT IS PRODUCTION\'S', () => {
  for (const k of ['ACTION_CLAIM_RE', 'JOT_CLAIM_RE', 'COMPLETED_ACT_RE', 'NARRATED_LOOKUP_RE']) {
    assert.ok(chat[k] instanceof RegExp, `${k} is not exported from chat.js`);
  }
  const rig = read(RIG);
  assert.ok(/const \{ actionKind, ACTION_CLAIM_RE, JOT_CLAIM_RE, COMPLETED_ACT_RE, NARRATED_LOOKUP_RE \} = require\(/.test(rig),
    'the rig does not require the vocabulary from production');
  assert.ok(!/const ACTION_CLAIM_RE = new RegExp/.test(rig), 'the rig still DEFINES the vocabulary — there are two homes, which is one too many');
});

t('§5.2 THE MOVE WAS BYTE-IDENTICAL — the four families are unchanged from their pre-move source', () => {
  const { execSync } = require('child_process');
  const before = execSync('git show 7058ea0:scripts/b06_gauntlet.js', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString();
  const grab = (src, name) => {
    const i = src.indexOf(`const ${name} = new RegExp([`);
    assert.ok(i > 0, `${name} not found`);
    return src.slice(i, src.indexOf('].join("|"), "i");', i));
  };
  const now = read(CHAT);
  for (const n of ['ACTION_CLAIM_RE', 'JOT_CLAIM_RE', 'COMPLETED_ACT_RE', 'NARRATED_LOOKUP_RE']) {
    assert.strictEqual(grab(now, n), grab(before, n), `${n} changed in the move — the move was supposed to be byte-identical`);
  }
});

t('§5.3 BOTH persistComposedReply CALL SITES CARRY THE GUARD — one site covered is a turn class escaping silently', () => {
  const c = read(CHAT);
  assert.strictEqual((c.match(/await persistComposedReply\(req, result,/g) || []).length, 2, 'the call-site count moved — re-derive');
  assert.strictEqual((c.match(/await wireGuardSpecimen\(req\.app\.locals\.supabase, req\.vendor\.id, result\);/g) || []).length, 2, 'the guard is not on both PWA sites');
});

t('§5.4 THE GUARD DOES NOT RIDE INSIDE persistComposedReply — that function returns early on an empty tail, which is exactly the costume turn', () => {
  const c = read(CHAT);
  const body = c.slice(c.indexOf('async function persistComposedReply'), c.indexOf('// Lockstep the other way'));
  assert.ok(/if \(!tail\) return;/.test(body), 'the early return is gone — re-derive this cell\'s premise');
  assert.ok(!/wireGuard/.test(body), 'the guard was moved inside the early-returning function — it will go silent on the turns it exists to catch');
});

t('§5.5 ZERO VENDOR-VISIBLE DELTA: the guard writes no reply bytes, sends nothing outbound, and touches engine.messages never', () => {
  const c = read(CHAT);
  const i = c.indexOf('async function wireGuardSpecimen');
  const body = c.slice(i, c.indexOf('async function persistComposedReply'));
  assert.ok(!/send\(/.test(body), 'the guard sends to the wire');
  assert.ok(!/from\('messages'\)/.test(body), 'the guard writes engine.messages');
  assert.ok(!/result\.reply\s*=/.test(body), 'the guard mutates the reply');
  assert.ok(/evals_runs/.test(body) && /evals_findings/.test(body), 'the guard does not land its specimen where it was ruled to');
});

t('§5.6 THE HONEST CLASSES ARE LOGGED DISTINCTLY AND NEVER SUPPRESSED — precision is measured, not presumed', () => {
  const cl = (x) => chat.wireGuardClassify(null, x);
  const REL = (name, result) => ({ name, result });
  const turn = (reply, donna_calls) => ({ reply, tool_calls: [{ name: 'dear_donna_talk', donna_calls }] });
  // the costume: a completed act, hands present, NONE of them a write, no witness
  const costume = cl(turn("Done — that's filed.", [REL('donna_find', 'no rows')]));
  assert.strictEqual(costume.kind, 'costume', 'the costume specimen was not convicted');
  assert.strictEqual(costume.specimen, true, 'the costume was not marked a specimen');
  // the acknowledgement: present-tense intent, no completed act — §2.2 sentence 3's LAWFUL shape
  const ack = cl(turn("I'm logging her now.", []));
  assert.ok(ack, 'the acknowledgement class drew nothing at all — it must be logged distinctly, never suppressed');
  assert.strictEqual(ack.kind, 'acknowledgement', 'a lawful present-tense acknowledgement was not named as its own class');
  assert.strictEqual(ack.specimen, false, 'a lawful present-tense acknowledgement was convicted as a specimen');
  // a real write hand acquits
  const honest = cl(turn("Done — that's filed.", [REL('donna_unblock', 'ok')]));
  assert.strictEqual(honest.specimen, false, 'a claim backed by a write hand was convicted');
  assert.strictEqual(honest.kind, 'witnessed_hand', 'the honest hand-backed class is not named distinctly');
  // the class the instrument CANNOT settle from one turn is logged UNVERIFIED, never as a specimen
  const prior = cl(turn('Already done — that was filed.', []));
  assert.strictEqual(prior.kind, 'prior_turn_unverified', 'the zero-hand completed claim was not filed as unverified');
  assert.strictEqual(prior.specimen, false, 'a claim the instrument cannot disprove was counted as a specimen — CE-82 gate #3 forbids it');
});

t('§5.6b F-06.104 CLOSED — the block\'s FOUNDING lie is heard: "Done. 18 December is unblocked." now convicts', () => {
  // LABELED RE-AIM (CE R-9). This cell shipped as an ASSERT-THE-GAP cell — the executor's
  // §5.6b, which made a silence into a fact. The chair minted F-06.104 and ruled the cure
  // does NOT wait for Evening Three: this is the single most-documented lie class in the
  // estate (F-04.71's thesis specimen, convicted across four evenings and two
  // architectures), and shipping the vendor-protection guard deaf to it would be a
  // coverage report wearing a cure's uniform. The cell now asserts the CLOSURE.
  const turn = (reply, dc) => ({ reply, tool_calls: [{ name: 'dear_donna_talk', donna_calls: dc }] });
  const v = cl0(turn('Done — 18 December is unblocked.', [{ name: 'donna_find', result: 'x' }]));
  assert.ok(v, 'F-06.104 REGRESSED: the founding specimen draws nothing again');
  assert.strictEqual(v.kind, 'costume', 'the founding specimen is no longer convicted as the costume');
  assert.ok(v.claims.includes('mutation_claim'), 'the mutation claim is not named distinctly in the finding');
  // and its siblings, each a cited texture
  for (const line of ['Cancelled: the 5th is off.', "I've moved it to the 12th.", "That's open again."]) {
    assert.ok(chat.MUTATION_CLAIM_RE.test(line), `the cited specimen texture "${line}" is not heard`);
  }
});

t('§5.6c THE MASKING LAW HONORED BY CONSTRUCTION — the shared four are byte-identical and no gauntlet arm reads the new constant', () => {
  const rig = read(RIG);
  assert.ok(!/MUTATION_CLAIM_RE/.test(rig),
    'a gauntlet arm now reads F-06.104\'s constant — it is Stage-1-scoped BY RULING, and a shared reader is exactly how an adjacent gap gets masked (CE-81/NOTE_12 §9)');
  const code = read(CHAT).split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  assert.strictEqual((code.match(/const MUTATION_CLAIM_RE = new RegExp/g) || []).length, 1, 'the constant is defined more than once');
  assert.strictEqual((code.match(/MUTATION_CLAIM_RE\.test\(/g) || []).length, 1,
    'F-06.104\'s constant has more than ONE consumer — it is Stage-1-scoped by ruling, and a second reader is how a shared meaning starts to move');
  assert.ok(/module\.exports\.MUTATION_CLAIM_RE/.test(code), 'the constant is not exported for bench read');
});

t('§5.6d AND IT DOES NOT ABSORB THE ACQUITTING PHRASES — F-06.84\'s family and the honest refusals still walk (both directions)', () => {
  for (const honest of [
    'Nothing to unblock on 18 December.',
    "I can't unblock that from here.",
    'Shall I unblock the 18th?',
    'Do you want me to cancel it?',
    'That date was never blocked.',
  ]) {
    assert.ok(!chat.MUTATION_CLAIM_RE.test(honest), `an HONEST sentence was absorbed by F-06.104's family: "${honest}" — the masking hazard fired`);
  }
  // NON-VACUOUS the other way: the family really does convict when the claim is made
  assert.ok(chat.MUTATION_CLAIM_RE.test('The 18th is unblocked.'), 'the family convicts nothing — a negative that cannot match is not a floor');
});

t('§5.7 BOTH-WAYS ON THE DETECTOR: a reply with no claim at all draws NOTHING — the guard is not a positive that always matches (F-06.55)', () => {
  const cl = (x) => chat.wireGuardClassify(null, x);
  assert.strictEqual(cl({ reply: 'The 19th is free.', tool_calls: [] }), null, 'a plain read answer drew a specimen');
  assert.strictEqual(cl({ reply: '', tool_calls: [] }), null, 'an empty reply drew a specimen');
  assert.strictEqual(cl({ reply: 'Which of the two Rheas did you mean?', tool_calls: [] }), null, 'an honest clarify drew a specimen');
});

t('§5.8 D-1 HELD: only NESTED hands census, and her voice is never counted as one', () => {
  const cl = (x) => chat.wireGuardClassify(null, x);
  const v = cl({ reply: 'Done — it is recorded.', tool_calls: [{ name: 'dear_donna_talk', donna_calls: [{ name: 'listen_harvey_talk', result: 'said it' }] }] });
  assert.strictEqual(v.hand_census.write, 0, 'listen_harvey_talk was counted as a write hand — the fence chipFiling keeps by name is not kept here');
  const top = cl({ reply: 'Done — it is recorded.', tool_calls: [{ name: 'dear_donna_talk', result: '(handed to Donna)' }] });
  assert.strictEqual(top.hand_census.total, 0, 'the top-level dear_donna_talk was counted as a hand — actionKind would call it a write and it is not one');
});

t('§5.8b R-10 — THE WHATSAPP SEAT SHIPS, AND IT IS THE SAME FUNCTION (no new machinery, no new readers)', () => {
  const wa = read('src/lib/vendorInbound.js');
  assert.ok(/require\('\.\.\/api\/vendor-engine\/chat'\)/.test(wa), 'the WA lane does not reach the guard\'s one home — a re-implementation would prove its own copy');
  assert.ok(/await wireGuardSpecimen\(supabase, vendor\.id, result\)/.test(wa), 'the WA lane does not call the guard');
  assert.ok(/const result = await runTurn\(\{/.test(wa), 'the WA lane no longer calls runTurn — R-10\'s derivation premise has changed; re-derive before trusting this seat');
  // the guard's signature is the ONE adaptation, and both doors pass the same two values
  const c = read(CHAT);
  assert.ok(/async function wireGuardSpecimen\(supabase, vendorId, result\)/.test(c), 'the guard signature is not the relocated (supabase, vendorId, result) shape');
  assert.strictEqual((c.match(/await wireGuardSpecimen\(req\.app\.locals\.supabase, req\.vendor\.id, result\)/g) || []).length, 2,
    'the PWA door does not pass the relocated signature at both of its sites');
});

t('§5.8c THE WA SEAT IS REPORT-ONLY TOO — it reads `result`, never `replyText`, and cannot touch what the vendor receives', () => {
  const wa = read('src/lib/vendorInbound.js');
  const i = wa.indexOf('THE WHATSAPP SEAT');
  const seat = wa.slice(i, wa.indexOf('const twilioMsg = await sendWhatsApp', i))
    .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');  // executable lines only — the comment names replyText to explain why it is untouched
  assert.ok(!/replyText/.test(seat), 'the WA seat touches replyText — Stage 1 delivers nothing and alters nothing');
  assert.ok(!/sendWhatsApp/.test(seat), 'the WA seat sends outbound');
  assert.ok(/catch \(e\)/.test(seat), 'the WA seat can throw into the reply path — a report-only guard must never hurt the vendor to watch the model');
});

t('§5.9 STAGE 2 IS NOT HERE — no interception, no rewrite, no substitute reply anywhere in the guard', () => {
  const c = read(CHAT);
  const body = c.slice(c.indexOf('function wireGuardClassify'), c.indexOf('async function persistComposedReply'));
  assert.ok(!/there was a small glitch|please try again|replace|intercept/i.test(body),
    'Stage 2 vocabulary is present in a Stage 1 guard — interception was explicitly out of scope');
});

console.log(`\n${fail === 0 ? 'GREEN' : 'RED'} — b06_forkc_wireguard_bench ${pass}/${pass + fail}`);
if (fail === 0) {
  console.log(`       The door's own plain speech reaches his composer, and the machinery that`);
  console.log(`       rode beside it does not. The receipt is clean; the display never travels.`);
  console.log(`       THE LIVE VERDICT IS EVENING THREE'S — declared here, never claimed.`);
}
process.exit(fail === 0 ? 0 : 1);
