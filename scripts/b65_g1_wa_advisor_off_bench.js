#!/usr/bin/env node
// scripts/b65_g1_wa_advisor_off_bench.js — CE-41 · SEAT G · G1 (R-41.104/R-41.105).
//
// Advisor mode off the vendor WhatsApp lane: the ROUTE (§1), the ROOM (§2), the
// ONE HOME both read (§3), the registry and `0154` (§4), the PWA lane untouched
// (§5), the founder-vetoed refusal (§6), and F-41.95's guard specimen (§7).
//
// BOTH WAYS, MEASURED: at the uncured tree 17/29 — §1.2, §1.3, §2.1-2.4, §2.6,
// §3.1-3.3, §4.1, §4.2 RED. Cured, 29/29. `b65_mutations.js` edits PRODUCTION
// code in a scratch copy; each mutation must RED its named cell (F-40.216,
// non-vacuous by construction).
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
async function cell(name, fn) { try { const r = await fn(); r === true ? ok(name, true) : ok(name, false, typeof r === 'string' ? r : JSON.stringify(r)); } catch (e) { ok(name, false, (e && e.message) || String(e)); } }

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

  await cell('1.1 buildLlmForTurn on pwa_vendor STILL routes the advisor room to its own tier', async () => {
    const { buildLlmForTurn } = req('src/api/vendor-engine/chat.js');
    const db = makeDb({ 'model.pwa_vendor.advisor': { provider: 'deepseek', model: 'deepseek-v4-flash' } }, { 'agent-1': 'advisor' });
    const w = await buildLlmForTurn({ supabase: db, vendor: { tier: 'essential' }, agentId: 'agent-1' });
    // c-41.47 — ASSERTS THE KEY THAT WAS ASKED FOR, not the provider that came back. The
    // first cut checked `provider === 'deepseek'` and a mutation retiring the
    // advisor tier PASSED it: with the tier slot gone the lookup falls to
    // `model.pwa_vendor.essential`, which is deepseek in the DEFAULTS matrix
    // too. Same answer, different question — the census is what distinguishes
    // them, exactly as it does in §1.2.
    if (!db._reads.includes('engine.agents.victor_mode')) return 'the PWA route stopped asking the room';
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

  await cell('2.1 the engine accepts a modeOverride and it is `business`-only', () => {
    const t = read('src/engine/src/core/loop.ts');
    return /modeOverride\?:\s*'business';/.test(t) ? true : 'RunTurnArgs has no business-only modeOverride';
  });

  await cell('2.2 the room predicate prefers the override over the row', () => {
    const c = codeOf('src/engine/src/core/loop.ts');
    return /args\.modeOverride\s*\?\?\s*agent\.victor_mode/.test(c) ? true : 'loop.ts:299 still reads the row alone';
  });

  await cell('2.3 ABSENT the override the predicate is byte-identical (regression law)', () => {
    const { runTurn } = req('src/engine/dist/core/loop.js');
    // The compiled term, read as source: `??` with the row on the right is the
    // whole regression proof — a PWA turn passes nothing and lands on the row.
    const c = fs.readFileSync(path.join(ROOT, 'src/engine/dist/core/loop.js'), 'utf8');
    return typeof runTurn === 'function' && /modeOverride\s*\?\?\s*agent\.victor_mode/.test(c)
      ? true : 'the compiled engine does not carry the ?? term';
  });

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

  await cell('2.6 R-41.105\'s witness line is at the predicate and names the room', () => {
    const c = codeOf('src/engine/src/core/loop.ts');
    return /\[engine:mode\]/.test(c) && /room=\$\{/.test(c) && /override=\$\{/.test(c)
      ? true : 'no [engine:mode] line carrying room= and override=';
  });

  sec('§3 ONE HOME — route and room cannot disagree (R-41.104 §4(a))');

  await cell('3.1 waLaneMode() exists, takes no argument, and returns business', () => {
    const { waLaneMode } = req('src/lib/modelRouter.js');
    return typeof waLaneMode === 'function' && waLaneMode.length === 0 && waLaneMode() === 'business'
      ? true : `waLaneMode is ${typeof waLaneMode}/${waLaneMode && waLaneMode.length}`;
  });

  await cell('3.2 BOTH readers import it; neither spells the word itself', () => {
    const chat = codeOf('src/api/vendor-engine/chat.js');
    const door = codeOf('src/lib/vendorInbound.js');
    if (!/waLaneMode/.test(chat)) return 'the route does not read the home';
    if (!/waLaneMode/.test(door)) return 'the door does not read the home';
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

  console.log(`\n  b65_g1_wa_advisor_off  ${pass}/${pass + fail}`);
  if (fail) console.log('  FAILED: ' + fails.join(' · '));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('BENCH ERROR', e); process.exit(1); });
