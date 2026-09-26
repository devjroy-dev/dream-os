#!/usr/bin/env node
// scripts/b65_g1_wa_advisor_off_bench.js — CE-41 · SEAT G · G1 (R-41.104/R-41.105).
//
// Advisor mode off the vendor WhatsApp lane: the ROUTE (§1), the ROOM (§2), the
// ONE HOME both read (§3), the registry and `0154` (§4), the PWA lane untouched
// (§5), the founder-vetoed refusal (§6), and F-41.95's guard specimen (§7).
//
// BOTH WAYS, MEASURED: at the uncured tree 17/29 — §1.2, §1.3, §2.1-2.4, §2.6,
// §3.1-3.3, §4.1, §4.2 RED. Cured, 29/29 (G1), then 42/42 at G2.
// CE-41 · SEAT I (R-41.136, chair fork F4) AMENDED §1.1, §2.2, §2.3, §8.1-8.4 IN
// PLACE. Their SUBJECTS are unchanged; what moved is the shape they pin, because
// the column left the resolution. Declared rather than superseded: a cell whose
// subject survives should not be retired for a cure it predicted. The room and
// the room line are proved in `b65_i1_advisor_room_only_bench.js`, a new member
// of this family, which drives the compiled engine and the composed prompt.
// `b65_mutations.js` edits PRODUCTION code in a scratch copy; each mutation must
// RED its named cell (F-40.216, non-vacuous by construction).
//
// ⚠ §7 IS GREEN AT BOTH TREES, BY CONSTRUCTION, AND IS NOT A PROOF OF THE CURE.
// DECLARED HERE RATHER THAN LEFT TO BE DISCOVERED. It drives `wireGuardClassify`
// — which this packet does not touch — against two hand ledgers, so it measures
// the MECHANISM of F-41.95 (a room with no Donna hand cannot corroborate a
// lookup, and the guard convicts what it cannot corroborate) and not the fix.
// The cure's own proof is §2: the door hands the engine `business` at both
// runTurn sites, so the advisory ledger of 7.1 can no longer be produced on this
// lane. §7 exists because §1 and §2 can both be green while the vendor is still
// hurt — routing business and answering from the advisory room is precisely the
// half-cure this seat reported as blocking — and because F-41.95's specimen had
// never been driven anywhere. §7.4 records what the driving found.
'use strict';
// ── CE-45 LCV-16 LSP_5 · LABELLED AMENDMENT (A-45.2): THE RETIRED CELLS OF THIS BENCH, AT SITE ─────────────────────
// LSP_5 (the chair's rulings L5-a to L5-e, §7, K6, 25 September 2026) retired the business room from runTurn and deleted Donna's
// turn and the engine modules only it reached. Each row names a cell and why it retires; the cell is replaced at its site by
// __RETIRED (never evaluated). A retired cell prints RETIRED and is NOT counted as a pass. CONTROL: at exit every row must have
// matched exactly ONE reached cell, or the bench exits 1.
const __RETIRE_LSP5 = new Map([["2.1 the engine accepts a modeOverride","L5-a/L5-b: modeOverride (the WhatsApp door's term) is deleted and runTurn serves advisor and consult only; b116 1.1 and 2.1 pin both"],["2.2 the room predicate prefers the override","L5-a/L5-b: modeOverride (the WhatsApp door's term) is deleted and runTurn serves advisor and consult only; b116 1.1 and 2.1 pin both"],["2.3 ABSENT the override the predicate","L5-a/L5-b: modeOverride (the WhatsApp door's term) is deleted and runTurn serves advisor and consult only; b116 1.1 and 2.1 pin both"],["2.6 R-41.105","L5-a/L5-b: modeOverride (the WhatsApp door's term) is deleted and runTurn serves advisor and consult only; b116 1.1 and 2.1 pin both"],["8.1 the route resolver and the engine term agree","L5-a: the engine's precedence is now roomAssert, else the named refusal; a business combination can no longer agree with the route resolver because the engine refuses it (b116 1.1)"],["8.4 the engine carries the ruled precedence","L5-a: the engine's precedence is now roomAssert, else the named refusal; a business combination can no longer agree with the route resolver because the engine refuses it (b116 1.1)"],["8.6 modeOverride is STILL","L5-a/L5-b: modeOverride (the WhatsApp door's term) is deleted and runTurn serves advisor and consult only; b116 1.1 and 2.1 pin both"]]);
const __seenLSP5 = new Map();
function __RETIRED(k) { if (!__RETIRE_LSP5.has(k)) { console.log('  FAIL  ' + k + '  (RETIRED at site but not in the table)'); process.exitCode = 1; return; }
  __seenLSP5.set(k, (__seenLSP5.get(k) || 0) + 1); console.log('  RETIRED  ' + k + '  (' + __RETIRE_LSP5.get(k) + ')'); }
process.on('exit', (code) => { let bad = 0; for (const [k] of __RETIRE_LSP5) if ((__seenLSP5.get(k) || 0) !== 1) { bad++; console.log('  FAIL  retire row ' + k + ' matched ' + (__seenLSP5.get(k) || 0) + ' reached cells (must be exactly 1)'); }
  if (bad) process.exitCode = 1; else if (code !== 0) process.exitCode = code; });
const fs = require('fs');
const path = require('path');

const ROOT = process.env.B65_ROOT ? path.resolve(process.env.B65_ROOT) : path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
// R-40.105 / the comment-blindness law — an absence cell reads comment-stripped
// code. This packet's comments name `victor_mode`, `advisor` and `loop.ts:299`
// dozens of times; a raw-text assertion that "the WA path does not read
// victor_mode" would be convicted by its own explanation of why it does not.
const codeOf = (rel) => read(rel).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1 ');
const req = (rel) => require(path.join(ROOT, rel));
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// `chat.js` and `modelRouter.js` build clients and read keys at require time.
// Never dialled — every driven cell below hands its own values.
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'bench-key';
process.env.DEEPSEEK_API_KEY  = process.env.DEEPSEEK_API_KEY  || 'bench-key';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://bench.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-key';

let pass = 0, fail = 0; const fails = [];
const sec = (t) => console.log(`\n${t}`);
function ok(name, cond, why) { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; fails.push(name); console.log(`  FAIL ${name}${why ? ' — ' + why : ''}`); } }
// ── CE-45 LCV-15 LSP_1 · LABELLED AMENDMENT: THE RETIRED CELLS OF THIS BENCH, AT SITE ─────────────────────────────
// Each row names a cell by its id and the reason it retires: the cell read code LSP_1 deleted (the WhatsApp chain's tail,
// the switch `vendor.working_chain_enabled`, listenAfterWire, the imperative family, calendarSignals.js, leadPings.js,
// introductionSeat.js). A retired cell is NOT counted as a pass; it prints RETIRED with its reason. CONTROL: at exit every
// row must have matched exactly ONE cell that this run reached, or the bench fails, so the table can never retire a cell
// by accident or outlive the cell it names.
const __RETIRE = new Map([
  [
    "2.4 ",
    "LSP_1: the WhatsApp door's runTurn calls, and its import of waLaneMode, are deleted with the chain"
  ],
  [
    "3.3 ",
    "LSP_1: the WhatsApp door's runTurn calls, and its import of waLaneMode, are deleted with the chain"
  ]
]);
const __seen = new Map();
function __retired(name) {
  const n = String(name);
  for (const [k, why] of __RETIRE) if (n.startsWith(k)) { __seen.set(k, (__seen.get(k) || 0) + 1); console.log(`  RETIRED  ${n}  (${why})`); return true; }
  return false;
}
process.on('exit', () => {
  const bad = [...__RETIRE.keys()].filter((k) => __seen.get(k) !== 1);
  if (bad.length) { console.log(`  FAIL  the retired-cell table does not match exactly one reached cell per row: ${bad.join(' | ')}`); process.exitCode = 1; }
});
async function cell(name, fn) { if (__retired(name)) return; try { const r = await fn(); r === true ? ok(name, true) : ok(name, false, typeof r === 'string' ? r : JSON.stringify(r)); } catch (e) { ok(name, false, (e && e.message) || String(e)); } }

// ── THE DOUBLE — admin_config + engine.agents, with a READ LOG ───────────────
// The read log is the instrument for §1.2's claim. "The WhatsApp lane does not
// ask what room the vendor is in" is only provable by watching whether anything
// SELECTed `victor_mode` during the turn's route build — an assertion on the
// returned tier alone would pass on a lane that asked and then discarded the
// answer, which is precisely the shape this seat refused in the cut.
function makeDb(rows = {}, agents = {}) {
  const t = {
    admin_config: Object.entries(rows).map(([key, value]) => ({ key, value: typeof value === 'string' ? value : JSON.stringify(value) })),
    agents: Object.entries(agents).map(([id, victor_mode]) => ({ id, victor_mode })),
  };
  const reads = [];
  function table(name, schema) {
    const st = { f: [], cols: '' };
    const rows2 = () => (t[name] || []).filter(r => st.f.every(([c, v]) => r[c] === v));
    const api = {
      select(cols) { st.cols = String(cols || ''); if (/victor_mode/.test(st.cols)) reads.push(`${schema}.${name}.victor_mode`); return api; },
      order() { return api; }, limit() { return api; },
      eq(c, v) { st.f.push([c, v]); if (c === 'key') reads.push(v); return api; },
      in(c, vs) { for (const v of vs) reads.push(v); st.f.push([c, vs[0]]); return api; },
      async maybeSingle() { return { data: rows2()[0] || null, error: null }; },
      then(res) { return Promise.resolve({ data: rows2(), error: null }).then(res); },
    };
    return api;
  }
  const client = { from: (n) => table(n, 'public'), schema: () => ({ from: (n) => table(n, 'engine') }), _reads: reads };
  return client;
}

// ── THE HAND LEDGERS, BUILT THE WAY `loop.ts` BUILDS THEM ───────────────────
// NOT hand-written shapes. `loop.ts:821-826` pushes ONE top-level
// `dear_donna_talk` whose `donna_calls` carry her hands nested, plus a
// `listen_harvey_talk`; `wireGuardClassify` (chat.js:1536-1544) censuses the
// NESTED array alone and excludes `listen_harvey_talk` by name. A ledger shaped
// any other way would test the bench's imagination rather than the estate.
const businessRoomResult = (reply) => ({
  reply,
  victor_mode: 'business',
  tool_calls: [
    { name: 'dear_donna_talk', input: { message: 'anything on file for 18 December?' }, result: '(handed to Donna)',
      donna_calls: [{ name: 'donna_find_date', input: { date: '2026-12-18' }, result: 'no booking on 18 December 2026' }] },
    { name: 'listen_harvey_talk', input: { message: 'nothing on file' }, result: 'Listen Harvey — nothing on file for that date.' },
  ],
});
// The advisory room holds NO `dear_donna_talk` (loop.ts:567-575), so the ledger
// is not "the same minus a hand" — the whole exchange is absent by construction.
const advisorRoomResult = (reply) => ({ reply, victor_mode: 'advisor', tool_calls: [] });

// The vendor's question and Victor's honest answer to it. A lookup claim: an
// existence assertion with no claim of having acted.
const LOOKUP_ASK   = 'anything booked for 18 December?';
const LOOKUP_REPLY = '18 December 2026 is unblocked and available.';

(async () => {
  sec('§1 THE ROUTE — `wa_vendor` never reads `victor_mode` (R-41.104 §4(a), limb 1)');

  // AMENDED AT CE-41 SEAT I (R-41.136, chair fork F4). THE SUBJECT IS UNCHANGED —
  // the PWA lane still routes the advisor ROOM to its own tier — but the room no
  // longer comes from the ROW, so the fixture now asserts it the only way it is
  // now reachable: from the Advisor door. The census limb that made this cell
  // non-vacuous is kept and INVERTED: the route must NOT ask the column any more.
  await cell('1.1 buildLlmForTurn on pwa_vendor STILL routes the advisor room to its own tier', async () => {
    const { buildLlmForTurn } = req('src/api/vendor-engine/chat.js');
    const db = makeDb({ 'model.pwa_vendor.advisor': { provider: 'deepseek', model: 'deepseek-v4-flash' } }, { 'agent-1': 'advisor' });
    const w = await buildLlmForTurn({ supabase: db, vendor: { tier: 'essential' }, agentId: 'agent-1', roomAssert: 'advisor' });
    // c-41.47 — ASSERTS THE KEY THAT WAS ASKED FOR, not the provider that came back. The
    // first cut checked `provider === 'deepseek'` and a mutation retiring the
    // advisor tier PASSED it: with the tier slot gone the lookup falls to
    // `model.pwa_vendor.essential`, which is deepseek in the DEFAULTS matrix
    // too. Same answer, different question — the census is what distinguishes
    // them, exactly as it does in §1.2.
    if (db._reads.includes('engine.agents.victor_mode')) return 'the PWA route still SELECTs the column (R-41.136)';
    if (!db._reads.includes('model.pwa_vendor.advisor')) return `the PWA route asked for ${db._reads.filter(k => /^model\./.test(k)).join(',') || 'no model key'}`;
    return w.route && w.route.provider === 'deepseek' ? true : `pwa advisor route is ${JSON.stringify(w.route)}`;
  });

  await cell('1.2 the same flipped agent on wa_vendor routes the PRODUCT tier, and the column is never SELECTed', async () => {
    const { buildLlmForTurn } = req('src/api/vendor-engine/chat.js');
    const db = makeDb({
      'model.wa_vendor.essential': { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', donna_provider: 'deepseek', donna_model: 'deepseek-v4-flash' },
      'model.wa_vendor.advisor':   { provider: 'deepseek', model: 'deepseek-v4-flash' },
    }, { 'agent-1': 'advisor' });
    const w = await buildLlmForTurn({ supabase: db, vendor: { tier: 'essential' }, agentId: 'agent-1', surface: 'wa_vendor' });
    if (db._reads.includes('engine.agents.victor_mode')) return 'the WA route build SELECTed victor_mode';
    if (db._reads.includes('model.wa_vendor.advisor')) return 'the WA route build asked for the advisor key';
    return w.route && w.route.provider === 'anthropic' ? true : `wa route is ${JSON.stringify(w.route)}`;
  });

  await cell('1.3 a flipped agent on the BASIC tier routes basic on WhatsApp, not advisor', async () => {
    const { buildLlmForTurn } = req('src/api/vendor-engine/chat.js');
    const db = makeDb({}, { 'agent-1': 'advisor' });
    const w = await buildLlmForTurn({ supabase: db, vendor: { tier: 'basic' }, agentId: 'agent-1', surface: 'wa_vendor' });
    return !db._reads.includes('engine.agents.victor_mode') && w.tierOverride ? true : 'basic tier consulted the room';
  });

  sec('§2 THE ROOM — the door hands the engine `business` (R-41.104 §4(a), limb 2)');

  await __RETIRED("2.1 the engine accepts a modeOverride");

  await __RETIRED("2.2 the room predicate prefers the override");

  await __RETIRED("2.3 ABSENT the override the predicate");

  await cell('2.4 the WhatsApp door passes it at BOTH runTurn sites', () => {
    const c = codeOf('src/lib/vendorInbound.js');
    const n = (c.match(/modeOverride:\s*waLaneMode\(\)/g) || []).length;
    const turns = (c.match(/runTurn\(\{/g) || []).length;
    return n === turns && n === 2 ? true : `${n} modeOverride against ${turns} runTurn sites`;
  });

  await cell('2.5 the PWA door passes NOTHING — the app keeps the room', () => {
    const c = codeOf('src/api/vendor-engine/chat.js');
    return !/modeOverride/.test(c) ? true : 'the PWA door names modeOverride';
  });

  await __RETIRED("2.6 R-41.105");

  sec('§3 ONE HOME — route and room cannot disagree (R-41.104 §4(a))');

  await cell('3.1 waLaneMode() exists, takes no argument, and returns business', () => {
    const { waLaneMode } = req('src/lib/modelRouter.js');
    return typeof waLaneMode === 'function' && waLaneMode.length === 0 && waLaneMode() === 'business'
      ? true : `waLaneMode is ${typeof waLaneMode}/${waLaneMode && waLaneMode.length}`;
  });

  await cell('3.2 BOTH readers import it; neither spells the word itself (SPLIT, LSP_1: the route half; the WhatsApp door no longer calls runTurn, so it no longer reads the home)', () => {
    const chat = codeOf('src/api/vendor-engine/chat.js');
    // LSP_1 SPLIT (CE-45 LCV-15, labelled): the door's half is RETIRED; the WhatsApp lane's runTurn calls are deleted,
    // and with them its only reason to read waLaneMode(). The route's half stands whole.
    if (!/waLaneMode/.test(chat)) return 'the route does not read the home';
    // The route's own comparison is against 'advisor' (0080's word), never a
    // literal 'business' standing in for the rule.
    const at = chat.indexOf('async function buildLlmForTurn');
    const routeBand = chat.slice(at, at + 900);
    // c-41.48 — ANY `'business'` literal in the route band, not just an assignment. The
    // first cut pinned `= 'business'` and a mutation writing `? 'business'` — a
    // ternary arm, the obvious way to spell it wrong — walked straight past.
    return !/'business'/.test(routeBand) ? true : 'the route spells business itself';
  });

  await cell('3.3 it is imported, not injected through `deps` (a double cannot invert the ruling)', () => {
    const c = codeOf('src/lib/vendorInbound.js');
    return /require\('\.\/modelRouter'\)/.test(c) && !/waLaneMode,?\s*\n?\s*\}\s*=\s*deps/.test(c)
      ? true : 'waLaneMode rides the deps bag';
  });

  sec('§4 THE REGISTRY AND `0154` — a cure no tap undoes (Fork C)');

  await cell('4.1 wa_vendor holds the four product tiers and NO advisor lane', () => {
    const { LANES } = req('src/lib/modelRouter.js');
    const tiers = LANES.filter(l => l.surface === 'wa_vendor').map(l => l.tier).sort();
    return JSON.stringify(tiers) === JSON.stringify(['basic', 'essential', 'prestige', 'signature'])
      ? true : tiers.join(',');
  });

  await cell('4.2 the admin POST door refuses `model.wa_vendor.advisor` — the tap has nothing to hit', () => {
    const { LANE_BY_KEY } = req('src/lib/modelRouter.js');
    return !LANE_BY_KEY.has('model.wa_vendor.advisor') ? true : 'the key is still switchable';
  });

  await cell('4.3 the tier words are still DERIVED from CANON_TIERS, not transcribed', () => {
    const c = codeOf('src/lib/modelRouter.js');
    return /CANON_TIERS/.test(c) && /vendorLanes\(/.test(c)
      && !/\['basic',\s*'essential'/.test(c) ? true : 'the registry transcribes tiers';
  });

  await cell('4.4 0154 deletes ONE named key — no LIKE, no pattern', () => {
    const f = exists('db/migrations/0154_wa_vendor_advisor_drop.sql')
      ? 'db/migrations/0154_wa_vendor_advisor_drop.sql' : null;
    if (!f) return 'no 0154';
    const m = read(f);
    // BETWEEN the transaction markers, not "after BEGIN": the AFTER block below
    // COMMIT carries the founder's own verification SELECTs, and those legitimately
    // use `like`. The first cut of this cell read them as the DELETE and reddened —
    // an instrument fault, fixed at the instrument (R-39.15).
    const body = m.slice(m.indexOf('BEGIN;'), m.indexOf('COMMIT;'));
    return /key = 'model\.wa_vendor\.advisor'/.test(body)
      && !/LIKE/i.test(body) && !/wa_vendor\.%/.test(body) ? true : 'the DELETE is not a single named key';
  });

  await cell('4.5 0154 leaves `model.pwa_vendor.advisor` alone', () => {
    const m = read('db/migrations/0154_wa_vendor_advisor_drop.sql');
    const body = m.split('BEGIN;')[1].split('COMMIT;')[0];
    return !/pwa_vendor/.test(body) ? true : 'the DELETE reaches the app lane';
  });

  sec('§5 THE PWA LANE IS UNTOUCHED (R-41.104 §4(d))');

  await cell('5.1 pwa_vendor still carries its advisor lane', () => {
    const { LANE_BY_KEY } = req('src/lib/modelRouter.js');
    return LANE_BY_KEY.has('model.pwa_vendor.advisor') ? true : 'the app lost its advisor route';
  });

  await cell('5.2 0080\'s CHECK still admits `advisor` — the column keeps its two words', () => {
    const m = read('db/migrations/0080_souls.sql');
    return /check \(victor_mode in \('business', 'advisor'\)\)/.test(m) ? true : '0080 was edited';
  });

  await cell('5.3 the flip door (`vendorMode.js`) is byte-untouched by this packet', () => {
    const c = codeOf('src/api/vendor-engine/vendorMode.js');
    return /VICTOR_MODES\s*=\s*\['business', 'advisor'\]/.test(c) && !/waLaneMode|modeOverride/.test(c)
      ? true : 'the flip door moved';
  });

  sec('§6 THE MODE-WORD REFUSAL — byte-unchanged, asserted at its GUARD (Fork E)');

  await cell('6.1 victorLines\' load-time sha256 guard is present and passes', () => {
    // ASSERTS THE GUARD, NEVER TRANSCRIBES THE SENTENCE. A cell carrying the
    // founder-vetoed bytes would be a second home for them (copy law); and the
    // guard is stronger than a cell — it kills the PROCESS at boot on drift,
    // where a cell only reddens a run someone has to look at. Requiring the
    // module IS the assertion: the throw is at module load.
    const vl = req('src/lib/victorLines.js');
    const V = vl.VICTOR_LINES || vl;
    const c = codeOf('src/lib/victorLines.js');
    return typeof (V.ADVISOR_ON_WHATSAPP) === 'string'
      && /sha256/.test(c) && /ADVISOR_ON_WHATSAPP/.test(c)
      ? true : 'the guard or its subject is gone';
  });

  await cell('6.2 the refusal path still refuses the advisor WORD on this lane (R-39.22/D1)', () => {
    const c = codeOf('src/lib/vendorInbound.js');
    return /modeTarget === 'advisor'/.test(c) && /ADVISOR_ON_WHATSAPP/.test(c)
      && /mode-word\] advisor REFUSED/.test(c) ? true : 'F-40.3\'s cure moved';
  });

  await cell('6.3 `business` as a word stays legal — the way home is not closed', () => {
    const { matchModeWord } = req('src/api/vendor-engine/vendorMode.js');
    return matchModeWord('business mode') === 'business' && matchModeWord('advisor mode') === 'advisor'
      ? true : 'the matcher changed';
  });

  sec('§7 F-41.95 — THE GUARD SPECIMEN, driven (ruling 3)');

  // ── HOW THESE CELLS CALL THE CLASSIFIER, AND WHY IT IS NOT AN ARBITRARY
  // ARGUMENT. `wireGuardSpecimen` (chat.js:2137-2146) calls `wireGuardClassify`
  // TWICE: once with `priorDeed` undefined, and — when that first pass returns
  // `prior_deed_pending` — again with the deed it then went and looked for.
  // A cell calling it ONCE with undefined stops at the first pass and never sees
  // a verdict at all: the bench's first cut did exactly that, read
  // `prior_deed_pending` as the answer, and would have reported a cure it had
  // not tested. `null` is the honest second-pass value here — no prior deed
  // exists, because these fixtures are a single turn.
  const classify = (result) => req('src/api/vendor-engine/chat.js')
    .wireGuardClassify('vendor-1', result, null, { message: LOOKUP_ASK });
  const intercept = (v) => req('src/api/vendor-engine/chat.js').stage2Intercept(v, true);

  await cell('7.1 UNCURED ROOM: no Donna hand, the answer convicts as a costume and is intercepted', () => {
    const v = classify(advisorRoomResult(LOOKUP_REPLY));
    if (!v) return 'the advisor-room lookup did not reach the ladder at all';
    if (v.kind !== 'costume') return `verdict is ${v.kind}, expected costume`;
    if (!(v.hand_census && v.hand_census.read === 0)) return `read hands = ${v.hand_census && v.hand_census.read}, expected 0`;
    const line = intercept(v);
    return (typeof line === 'string' && line.length > 0) ? true : 'a costume was not intercepted';
  });

  await cell('7.2 CURED ROOM: the same bytes, Donna\'s read hand present — no costume, no interception', () => {
    const v = classify(businessRoomResult(LOOKUP_REPLY));
    if (v && v.kind === 'costume') return 'the business room convicts too';
    if (!(v && v.hand_census && v.hand_census.read >= 1)) return `read hands = ${v && v.hand_census && v.hand_census.read}, expected >= 1`;
    return intercept(v) === null ? true : 'the cured turn is still intercepted';
  });

  await cell('7.3 the hand census is the ONLY thing that moved between 7.1 and 7.2', () => {
    // Same reply, same question, same classifier. If this cell ever fails, 7.1/7.2
    // are measuring two different specimens and neither proves anything.
    const a = classify(advisorRoomResult(LOOKUP_REPLY));
    const b = classify(businessRoomResult(LOOKUP_REPLY));
    return JSON.stringify(a.claims) === JSON.stringify(b.claims)
      && a.hand_census.read === 0 && b.hand_census.read === 1
      ? true : `claims ${JSON.stringify(a.claims)} vs ${JSON.stringify(b.claims)}`;
  });

  await cell('7.4 THE BOUNDARY, DERIVED AND RECORDED: a bare narrated lookup is NOT convicted in either room', () => {
    // ⚠ F-41.95's re-description says the guard convicts EVERY lookup reply for a
    // flipped vendor. DERIVED FALSE at this tree, and recorded here rather than
    // left for the next seat: a lookup answer carrying no mutation or state word
    // ("Nothing is on file for 18 December.") reaches the ladder as
    // `narrated_lookup` and walks in BOTH rooms — `prior_turn_unverified` with no
    // hands, `corroborated_lookup` (LIMB 1) with one. What the advisory room
    // convicts is the lookup answer that also carries a state claim, which is the
    // estate's own founding production row ("18 December 2026 is unblocked and
    // available", 21:42:07). The class is narrower than the sentence; the CURE is
    // not, because the room is gone either way. Chair rules the wording.
    const BARE = 'Nothing is on file for 18 December.';
    const a = req('src/api/vendor-engine/chat.js').wireGuardClassify('vendor-1', { ...advisorRoomResult(BARE) }, null, { message: LOOKUP_ASK });
    const b = req('src/api/vendor-engine/chat.js').wireGuardClassify('vendor-1', { ...businessRoomResult(BARE) }, null, { message: LOOKUP_ASK });
    return a && b && a.kind !== 'costume' && b.kind === 'corroborated_lookup'
      && intercept(a) === null && intercept(b) === null
      ? true : `bare lookup: advisor=${a && a.kind} business=${b && b.kind}`;
  });

  await cell('7.5 `victor_mode` on the row is UNTOUCHED — the cure is a read, not a write', () => {
    const c = codeOf('src/lib/vendorInbound.js');
    // The ONLY `applyModeFlip` on this lane is the `business` arm of the mode-word
    // block (F-40.3's cure). This packet adds no writer, and a packet that cured
    // the room by moving the column would be F-40.3 again under a new number.
    const writes = (c.match(/applyModeFlip\(/g) || []).length;
    return writes === 1 ? true : `${writes} applyModeFlip call sites on the WA lane, expected 1`;
  });

  await cell('7.6 the advisor room STILL convicts on the PWA lane — LIMB 4 keeps its subject', () => {
    const v = req('src/api/vendor-engine/chat.js')
      .wireGuardClassify('vendor-1', advisorRoomResult('Done — I have logged that expense for you.'), null, { message: 'log Rs 5,000 travel' });
    return v && v.kind === 'costume' ? true : `advisor act-claim verdict is ${v && v.kind}`;
  });

  sec('§8 G2 · R-41.107 — THE ROOM IS THE ROOM\'S, NOT THE VENDOR\'S');

  // The full input matrix, driven against BOTH readers. This is the section that
  // makes the two-package mirror honest: `resolveVendorRoom` (the route, in
  // `modelRouter.js`) and `loop.ts:299`'s expression (the room, in the engine)
  // cannot share a home across a package boundary, so instead they are driven
  // side by side over every combination and asserted equal.
  // AMENDED AT CE-41 SEAT I (R-41.136, fork F4): `columnMode` left the resolver,
  // so the matrix loses that axis — 16 combinations become 8. It is not a
  // narrowing of the proof; the axis it dropped no longer exists to vary.
  const MATRIX = [];
  for (const surface of ['pwa_vendor', 'wa_vendor']) {
    for (const modeOverride of [undefined, 'business']) {
      for (const roomAssert of [undefined, 'advisor']) {
        MATRIX.push({ surface, modeOverride, roomAssert });
      }
    }
  }
  // THE ENGINE'S ORDER IS READ OUT OF `loop.ts`, NOT TRANSCRIBED. The first cut
  // hard-coded `modeOverride ?? roomAssert ?? columnMode` here and called it the
  // engine's term — so a mutation INVERTING the engine's own order left this cell
  // green and only §8.4's regex caught it. A mirror that carries its own copy of
  // the thing it is mirroring proves nothing. This parses the `??` chain from the
  // source and applies the terms in the order the file actually holds them.
  const engineOrder = (() => {
    const c = codeOf('src/engine/src/core/loop.ts');
    const m = c.match(/const assertedRoom = \(([^)]*)\)/);
    if (!m) return null;
    return m[1].split('??').map((x) => x.trim().replace(/^args\./, '')).filter(Boolean);
  })();
  // A LITERAL TERM ENDS THE CHAIN. Seat I's third term is `'business'`, not a
  // field, so the walker returns it rather than looking it up on the arguments —
  // and it is still READ OUT of the file, never transcribed, so an inversion of
  // the shipped order still moves this instrument.
  const engineTerm = (a) => {
    if (!engineOrder) return undefined;
    for (const term of engineOrder) {
      if (/^'.*'$/.test(term)) return term.slice(1, -1);
      if (a[term] != null) return a[term];
    }
    return undefined;
  };

  await __RETIRED("8.1 the route resolver and the engine term agree");

  await cell('8.2 the PRECEDENCE is modeOverride, then roomAssert, then BUSINESS', () => {
    const { resolveVendorRoom } = req('src/lib/modelRouter.js');
    const r = (o) => resolveVendorRoom({ surface: 'pwa_vendor', ...o });
    if (r({ modeOverride: 'business', roomAssert: 'advisor' }) !== 'business') return 'roomAssert beat modeOverride';
    if (r({ roomAssert: 'advisor' }) !== 'advisor') return 'the assertion stopped opening the room';
    if (r({}) !== 'business') return 'a bare call did not resolve business';
    // R-41.136's own limb: a column value handed in ANYWAY must change nothing.
    // The parameter is gone, so this is the shape a caller left behind would take.
    if (r({ columnMode: 'advisor' }) !== 'business') return 'a stray columnMode still reached the advisory room';
    return true;
  });

  await cell('8.3 the SURFACE wins over everything — an assertion cannot reach the WhatsApp lane', () => {
    const { resolveVendorRoom } = req('src/lib/modelRouter.js');
    return resolveVendorRoom({ surface: 'wa_vendor', roomAssert: 'advisor' }) === 'business'
      ? true : 'R-41.104 was overridden by an assertion';
  });

  await __RETIRED("8.4 the engine carries the ruled precedence");

  await cell('8.5 roomAssert is `advisor`-ONLY on the type — no door can force a vendor OUT either', () => {
    const t = read('src/engine/src/core/loop.ts');
    return /roomAssert\?:\s*'advisor';/.test(t) ? true : 'roomAssert is not advisor-only';
  });

  await __RETIRED("8.6 modeOverride is STILL");

  await cell('8.7 the door reads `room`, accepts only `advisor`, and never 400s on a bad one', () => {
    const c = codeOf('src/api/vendor-engine/chat.js');
    if (!/body\.room === 'advisor' \? 'advisor' : undefined/.test(c)) return 'the door does not fail-closed on body.room';
    // `mode` is documented on this door as accepted-and-ignored; giving it a
    // behaviour would change meaning under existing callers.
    return !/body\.mode/.test(c) ? true : 'the door reads body.mode';
  });

  await cell('8.8 BOTH PWA paths thread it — SSE and JSON, route and room', () => {
    const c = codeOf('src/api/vendor-engine/chat.js');
    // COUNTS CALL SITES, NOT THE DEFINITION. The first cut matched
    // `buildLlmForTurn({ ... roomAssert` and caught `async function
    // buildLlmForTurn({ ..., roomAssert })` as a third site — an instrument
    // fault that reported 3/2 on a correct tree.
    const wiring = (c.match(/await buildLlmForTurn\(\{[^}]*roomAssert/g) || []).length;
    const turns  = (c.match(/runTurn\(\{\s*roomAssert|roomAssert, agentId/g) || []).length;
    return wiring === 2 && turns === 2 ? true : `${wiring} route sites, ${turns} turn sites — expected 2 and 2`;
  });

  await cell('8.9 DRIVEN: the Advisor page\u2019s assertion routes the advisor tier on a business column', async () => {
    const { buildLlmForTurn } = req('src/api/vendor-engine/chat.js');
    // THE CACHE MUST BE BUST OR THE CELL MEASURES AN EARLIER CELL. `resolveModel`
    // memoises per key for CACHE_MS; §1's cells populated it, so the first cut of
    // this cell saw ZERO model reads and reported the route had asked for nothing.
    // b63's own driven cells do this for the same reason.
    req('src/lib/modelRouter.js')._resetRouteCache();
    const db = makeDb({ 'model.pwa_vendor.advisor': { provider: 'deepseek', model: 'deepseek-v4-flash' } }, { 'agent-1': 'business' });
    const w = await buildLlmForTurn({ supabase: db, vendor: { tier: 'essential' }, agentId: 'agent-1', roomAssert: 'advisor' });
    if (!db._reads.includes('model.pwa_vendor.advisor')) return `asked for ${db._reads.filter(k => /^model\./.test(k)).join(',') || 'no model key'}`;
    return w.route && w.route.provider === 'deepseek' ? true : `route is ${JSON.stringify(w.route)}`;
  });

  await cell('8.10 DRIVEN: the shared sheet sends nothing and stays business on a business column', async () => {
    const { buildLlmForTurn } = req('src/api/vendor-engine/chat.js');
    req('src/lib/modelRouter.js')._resetRouteCache();
    const db = makeDb({}, { 'agent-1': 'business' });
    const w = await buildLlmForTurn({ supabase: db, vendor: { tier: 'essential' }, agentId: 'agent-1' });
    return !db._reads.includes('model.pwa_vendor.advisor') && w.tierOverride
      ? true : 'a sheet turn with no assertion reached the advisor tier';
  });

  await cell('8.11 DRIVEN: an assertion NEVER reaches the WhatsApp lane\u2019s route', async () => {
    const { buildLlmForTurn } = req('src/api/vendor-engine/chat.js');
    req('src/lib/modelRouter.js')._resetRouteCache();
    const db = makeDb({}, { 'agent-1': 'advisor' });
    const w = await buildLlmForTurn({ supabase: db, vendor: { tier: 'essential' }, agentId: 'agent-1', surface: 'wa_vendor', roomAssert: 'advisor' });
    if (db._reads.includes('engine.agents.victor_mode')) return 'the WA route read the column';
    return !db._reads.includes('model.wa_vendor.advisor') && w.tierOverride ? true : 'the WA route reached an advisor tier';
  });

  await cell('8.12 R-41.107 WRITES NOTHING — no new applyModeFlip site anywhere', () => {
    const door = codeOf('src/api/vendor-engine/chat.js');
    const wa   = codeOf('src/lib/vendorInbound.js');
    const mode = codeOf('src/api/vendor-engine/vendorMode.js');
    // vendorMode.js keeps its ONE writer and its ONE PATCH caller; nothing else
    // in the estate may write the column, and G2 adds no writer at all.
    const total = (door.match(/applyModeFlip\(/g) || []).length
      + (wa.match(/applyModeFlip\(/g) || []).length
      + (mode.match(/applyModeFlip\(/g) || []).length;
    return total === 3 ? true : `${total} applyModeFlip occurrences, expected 3 (definition + PATCH caller + the WA business arm)`;
  });

  await cell('8.13 the witness line names which term decided', () => {
    const c = codeOf('src/engine/src/core/loop.ts');
    return /assert=\$\{/.test(c) && /source=\$\{roomSource\}/.test(c)
      ? true : 'the [engine:mode] line does not name assert= and source=';
  });

  console.log(`\n  b65_g1_wa_advisor_off  ${pass}/${pass + fail}`);
  if (fail) console.log('  FAILED: ' + fails.join(' · '));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('BENCH ERROR', e); process.exit(1); });
