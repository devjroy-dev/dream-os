// scripts/b05_f0550_ping_drain_bench.js — TDW_05 · F-05.50(b) THE ENQUIRY-PING DRAIN.
//   node scripts/b05_f0550_ping_drain_bench.js      (runnable from any cwd — Q-SP-5)
//
// The cure under test: pending_lead_pings gets the reader it never had, at the WA
// vendor door, into Victor's dynamic system tail, stamped at read.
//
// TWO CELLS ARE CE-NAMED TESTS (CE-68's acceptance addendum) and both drive REAL
// production expressions, not copies:
//   §2 — bride_message is ABSENT from `vendorWords` with the block LIVE. The cell
//        lifts the SHIPPED `dynamic` and `vendorWords` expressions out of the
//        compiled dist and EVALUATES them. If anyone ever routes the ping through
//        the message stream, this cell REDs and F-04.70's laundering path is caught
//        at the bench instead of in a money column.
//   §3 — two reads inside one window produce ONE update effect. Driven through the
//        REAL fetchLeadPings against a recording client whose rows behave like the
//        table's own predicate.
//
// NON-VACUITY (§7): five PRODUCTION mutations, each re-running this bench in a child
// and asserting it goes RED ON THE NAMED CELL. Test setup is never mutated.
'use strict';
const assert = require('assert');
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
const code = (r) => read(r).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
const { distGate } = require('./lib/dist_gate');
let pass = 0, fail = 0;
// t() AWAITS. It did not, in this bench's first draft, and every async cell below
// reported ok without running an assertion — a green over nothing. The §7 mutation
// harness convicted it before delivery; the defect and its finder are in the handover.
const t = async (n, f) => { try { await f(); console.log(`  ok   ${n}`); pass++; } catch (e) { console.log(`  FAIL ${n}\n       ${e.message}`); fail++; } };
const H = (s) => console.log(`\n${s}`);

const DRAIN = 'src/lib/vendor/leadPings.js';
const { fetchLeadPings, formatLeadPings, PING_WINDOW_MS } = require(P(DRAIN));

// ── A recording client with the PostgREST builder shape. THIS IS TEST SETUP, and it
// is the only thing here that is a fixture: the function under test is the real one.
// `rows` behave like the table — the stub applies the SAME predicate the reader asks
// for (vendor scope · acknowledged_at IS NULL · created_at >= cutoff), so a reader
// that drops a filter gets rows it should not have and the cells catch it.
function client(rows) {
  const log = { selects: 0, updates: 0, updatedIds: [], filters: [], updatePayloads: [] };
  const store = rows.map((r) => ({ ...r }));
  const from = () => {
    const f = {};
    let mode = null, sel = null, upd = null, preds = [];
    const b = {
      select(c) { mode = 'select'; sel = c; log.selects++; return b; },
      update(o) { mode = 'update'; upd = o; return b; },
      eq(k, v) { preds.push(['eq', k, v]); return b; },
      is(k, v) { preds.push(['is', k, v]); return b; },
      gte(k, v) { preds.push(['gte', k, v]); return b; },
      in(k, v) { preds.push(['in', k, v]); return b; },
      order() { return b; },
      then(res) {
        log.filters.push(preds.map((p) => p.map((x) => String(x)).join(':'))); // String(): a null joined is an empty string, and the is-null predicate would be unassertable
        if (mode === 'update') {
          const ids = (preds.find((p) => p[0] === 'in' && p[1] === 'id') || [null, null, []])[2];
          log.updates++; log.updatedIds.push([...ids]); log.updatePayloads.push(upd);
          for (const r of store) if (ids.includes(r.id)) Object.assign(r, upd);
          return res({ error: null });
        }
        let out = store;
        for (const [op, k, v] of preds) {
          if (op === 'eq') out = out.filter((r) => r[k] === v);
          if (op === 'is' && v === null) out = out.filter((r) => r[k] === null || r[k] === undefined);
          if (op === 'gte') out = out.filter((r) => new Date(r[k]).toISOString() >= v);
        }
        void sel; void f;
        return res({ data: out.map((r) => ({ ...r })), error: null });
      },
    };
    return b;
  };
  return { supabase: { from }, log, store };
}
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
const V = 'vendor-1';
const ping = (o) => ({ id: o.id, vendor_id: o.vendor_id || V, lead_name: o.lead_name ?? null, bride_message: o.bride_message ?? null, intent_summary: o.intent_summary ?? null, created_at: o.created_at || ago(4), acknowledged_at: o.acknowledged_at ?? null });

// ── THE RATIFIED BYTES (founder's veto, 2026-07-24: 「 A, WA-only, go 」). Asserted
// here so a later edit to the module's copy cannot pass silently — the slot covered
// what it read, and this is what it read.
const H1 = 'RECENT ENQUIRY — a bride has messaged about this lead in the last few';
const H4_ONE = 'handset — do not re-announce it, just answer what he asks.';
const H4_MANY = 'handset — do not re-announce it. MORE THAN ONE is open below: do not';

(async () => {

H('§1 — THE DRAIN: THE READER pending_lead_pings NEVER HAD');

await t('§1.1 zero active pings -> empty block AND ZERO writes (the absence is the zero-state)', async () => {
  const { supabase, log } = client([]);
  const out = await fetchLeadPings(supabase, V);
  assert.strictEqual(out, '', 'a header standing over nothing teaches the model that recent enquiry can mean no enquiry');
  assert.strictEqual(log.updates, 0, 'nothing surfaced, so nothing may be stamped drained');
});

await t('§1.2 one active ping -> the ratified single form, her words inside it', async () => {
  const { supabase } = client([ping({ id: 'p1', lead_name: 'Priya Sharma', bride_message: 'hi! looking for a photographer for 12 Dec' })]);
  const out = await fetchLeadPings(supabase, V);
  assert.ok(out.startsWith(H1), 'the ratified header is the block\'s first line');
  assert.ok(out.includes(H4_ONE), 'single-ping form owed');
  assert.ok(!out.includes(H4_MANY), 'the more-than-one form must not fire on one');
  assert.ok(/- Priya Sharma \(enquired 4 min ago\) — her message: "hi! looking for a photographer for 12 Dec"/.test(out), out);
});

await t('§1.3 two active pings -> the MORE THAN ONE form (there is no UNIQUE on this table)', async () => {
  const { supabase } = client([
    ping({ id: 'p1', lead_name: 'Priya Sharma', bride_message: 'a', created_at: ago(4) }),
    ping({ id: 'p2', lead_name: 'Nikita Rao', bride_message: 'b', created_at: ago(9) }),
  ]);
  const out = await fetchLeadPings(supabase, V);
  assert.ok(out.includes(H4_MANY) && out.includes('guess which one he means — ask him.'), 'the ask-him form owed');
  assert.ok(!out.includes(H4_ONE), 'the single form must not survive beside it');
  assert.ok(out.includes('Priya Sharma') && out.includes('Nikita Rao'), 'both referents owed');
});

await t('§1.4 a nameless enquiry reads the honest null, never a phone', async () => {
  const { supabase } = client([ping({ id: 'p1', lead_name: null, bride_message: 'are you free in March?' })]);
  const out = await fetchLeadPings(supabase, V);
  assert.ok(out.includes('- (name not given yet) (enquired'), out);
  assert.ok(!/\+?\d{10}/.test(out), 'a ping carries no phone and the block must never invent one');
});

await t('§1.5 a returning-bride ping carries its cached summary on its own continuation', async () => {
  const { supabase } = client([ping({ id: 'p1', lead_name: 'Meera', bride_message: 'still thinking', intent_summary: 'asked about December availability twice' })]);
  const out = await fetchLeadPings(supabase, V);
  assert.ok(out.includes('  — earlier: "asked about December availability twice"'), out);
});

await t('§1.6 THE FOUNDER\'S RULING: bride_message travels VERBATIM — no clip, no re-format', async () => {
  // Her sentence carries a rupee figure IN HER OWN WORDS and a long tail. Both survive
  // exactly. A reformatted quote is not a quote, and shape (A) put no second authority
  // for that figure anywhere in the block.
  const her = 'hiii we r looking at 12 dec, budget is around 4 lakhs (maybe 4,50,000 if the album is included) — is that ok?? we saw ur work on insta';
  const { supabase } = client([ping({ id: 'p1', lead_name: 'Priya', bride_message: her })]);
  const out = await fetchLeadPings(supabase, V);
  assert.ok(out.includes(`"${her}"`), 'her sentence must appear byte-for-byte');
  assert.ok(!out.includes('…'), 'no clip — clip() is the witness line\'s tool, not this block\'s');
});

await t('§1.7 the query is scoped and windowed as 0050 defines active', async () => {
  const { supabase, log } = client([
    ping({ id: 'live',    created_at: ago(4) }),
    ping({ id: 'stale',   created_at: ago(45) }),                       // outside the window
    ping({ id: 'drained', created_at: ago(2), acknowledged_at: ago(1) }), // already spent
    ping({ id: 'other',   created_at: ago(2), vendor_id: 'vendor-2', lead_name: 'Someone Else' }),
  ]);
  const out = await fetchLeadPings(supabase, V);
  assert.strictEqual(log.updatedIds[0].length, 1, 'exactly the one active ping may be stamped');
  assert.strictEqual(log.updatedIds[0][0], 'live', `stamped the wrong rows: ${log.updatedIds[0]}`);
  assert.ok(!out.includes('Someone Else'), 'ANOTHER VENDOR\'S BRIDE MUST NEVER APPEAR — B-3\'s sovereignty on this block');
  const f = log.filters[0].join(' ');
  assert.ok(f.includes('is:acknowledged_at:null'), 'the un-drained predicate is not optional');
  assert.ok(f.includes('gte:created_at'), 'the window predicate is not optional');
  assert.ok(f.includes(`eq:vendor_id:${V}`), 'the vendor scope is not optional');
});

await t('§1.8 the window is 0050\'s own ten minutes, named not magic', () => {
  assert.strictEqual(PING_WINDOW_MS, 10 * 60 * 1000);
  const d = read(DRAIN);
  assert.ok(/rupees/.test(d) === false || /NOT IMPORTED|DELIBERATELY NOT IMPORTED/.test(d),
    'shape (A) ships no money formatter; if rupees ever appears it must be USED, never decorative (F-05.20)');
  assert.ok(!/require\(.*witnessLine/.test(d), 'a decorative import of a formatter with nothing to format is the disease');
});

H('§2 — CE-NAMED CELL: bride_message IS ABSENT FROM vendorWords, WITH THE BLOCK LIVE');

await t('§2.1 SOURCE: the ping block is composed into `dynamic`, and `dynamic` alone', () => {
  const l = code('src/engine/src/core/loop.ts');
  assert.ok(/const pingBlock = \(estateInRoom && args\.leadPings\)/.test(l), 'the block must be gated on estateInRoom — A-3 keeps the donor pool closed');
  assert.ok(/\+ actBlock \+ pingBlock;/.test(l), 'the block belongs in the dynamic tail, beside its sibling');
  const vw = l.slice(l.indexOf('const vendorWords'), l.indexOf('const vendorWords') + 260);
  assert.ok(!/leadPings|pingBlock/.test(vw), 'THE PROVENANCE PROPERTY: the corpus is the OWNER\'S words only (F-04.70)');
  assert.ok(!/leadPings/.test(l.slice(l.indexOf('let messages'), l.indexOf('let messages') + 200)), 'and it never enters the message stream');
});

const gate = distGate({
  sentinel: 'pingBlock',
  srcPath: P('src/engine/src/core/loop.ts'),
  distPath: P('src/engine/dist/core/loop.js'),
  benchCmd: 'scripts/b05_f0550_ping_drain_bench.js',
});

if (gate.runDist) {
  t('§2.2 SHIPPED EXPRESSIONS, EVALUATED: her sentence reaches `dynamic` and NOT `vendorWords`', () => {
    const d = read('src/engine/dist/core/loop.js');
    // Lift the two real expressions out of the compiled artefact. Not a copy of them —
    // the bytes Railway runs.
    const dynLine = d.split('\n').find((l) => l.trim().startsWith('const dynamic = ownerBlock'));
    const pingLine = d.split('\n').find((l) => l.trim().startsWith('const pingBlock ='));
    const vwStart = d.indexOf('    const vendorWords = [');
    const vwSrc = d.slice(vwStart, d.indexOf("].join('\\n');", vwStart) + "].join('\\n');".length);
    assert.ok(dynLine && pingLine && vwSrc, 'the shipped expressions must be findable to be testable');

    const HER = 'budget is around 4 lakhs';
    const leadPings = `RECENT ENQUIRY\n- Priya (enquired 2 min ago) — her message: "${HER}"`;
    const thread = [{ role: 'user', content: 'what is my thursday' }, { role: 'assistant', content: 'clear' }];

    const evalDynamic = new Function('args', 'estateInRoom', 'ownerBlock', 'today', 'factsBlock', 'snapshot', 'donnaMsgs', 'shelfBlock',
      `${pingLine}\n const calBlock=''; const actBlock='';\n ${dynLine}\n return dynamic;`);
    const evalWords = new Function('thread', 'message', `${vwSrc}\n return vendorWords;`);

    const dynamic = evalDynamic({ leadPings }, true, 'owner', 'Fri', '', '', '', '');
    const vendorWords = evalWords(thread, 'tell her we are free');

    assert.ok(dynamic.includes(HER), 'the referent must actually reach him — a drain nobody reads is the disease again');
    assert.ok(!vendorWords.includes(HER), 'F-04.70: a bride\'s rupee figure must never vouch for a write');
    assert.ok(!vendorWords.includes('RECENT ENQUIRY'), 'no part of the block may enter the provenance corpus');
    assert.ok(vendorWords.includes('tell her we are free'), 'and the corpus must still hold the owner\'s own words');
  });

  t('§2.3 SHIPPED EXPRESSION: an advisor room gets NO block (A-3, the donor pool stays closed)', () => {
    const d = read('src/engine/dist/core/loop.js');
    const pingLine = d.split('\n').find((l) => l.trim().startsWith('const pingBlock ='));
    const f = new Function('args', 'estateInRoom', `${pingLine}\n return pingBlock;`);
    assert.strictEqual(f({ leadPings: 'RECENT ENQUIRY\n- x' }, false), '', 'estateInRoom=false must suppress it whole');
    assert.ok(f({ leadPings: 'RECENT ENQUIRY\n- x' }, true).includes('RECENT ENQUIRY'), 'and a business room must receive it');
    assert.strictEqual(f({}, true), '', 'absent => byte-identical to the pre-cure tail (regression law)');
  });
} else {
  console.log('  … §2.2/§2.3 SKIPPED, stated (see the gate above). §2.1 carries the source truth.');
}

H('§3 — CE-NAMED CELL: STAMP AT READ (L1) — TWO READS, ONE WINDOW, ONE UPDATE EFFECT');

await t('§3.1 the first read surfaces AND stamps; the second inside the same window does neither', async () => {
  const { supabase, log, store } = client([ping({ id: 'p1', lead_name: 'Priya', bride_message: 'hello' })]);
  const first = await fetchLeadPings(supabase, V);
  assert.ok(first.includes('Priya'), 'first read must surface');
  assert.strictEqual(log.updates, 1, 'exactly one UPDATE for the turn that consumed it');
  assert.ok(store[0].acknowledged_at, 'and the row must actually carry the stamp');

  const second = await fetchLeadPings(supabase, V);
  assert.strictEqual(second, '', 'surfacing IS draining — a spent ping does not come back');
  assert.strictEqual(log.updates, 1, 'IDEMPOTENT BY CONSTRUCTION: the second read matched nothing, so it wrote nothing');
});

await t('§3.2 the stamp is one UPDATE over exactly the surfaced ids — never a blanket write', async () => {
  const { supabase, log } = client([
    ping({ id: 'p1', created_at: ago(3) }), ping({ id: 'p2', created_at: ago(6) }),
    ping({ id: 'p3', created_at: ago(40) }), // outside the window: surfaced by nobody, stamped by nobody
  ]);
  await fetchLeadPings(supabase, V);
  assert.strictEqual(log.updates, 1, 'one UPDATE per turn, R2');
  assert.deepStrictEqual([...log.updatedIds[0]].sort(), ['p1', 'p2'], 'a ping never surfaced must never be marked spent');
  assert.ok(Object.keys(log.updatePayloads[0]).length === 1 && log.updatePayloads[0].acknowledged_at, 'the stamp writes acknowledged_at and nothing else');
});

await t('§3.3 a failed stamp does NOT suppress the block — surfacing twice beats losing the referent', async () => {
  const { supabase } = client([ping({ id: 'p1', lead_name: 'Priya', bride_message: 'hi' })]);
  const raw = supabase.from;
  supabase.from = (tbl) => { const b = raw(tbl); const upd = b.update.bind(b); b.update = (o) => { const c = upd(o); c.then = (res) => res({ error: { message: 'boom' } }); return c; }; return b; };
  const out = await fetchLeadPings(supabase, V);
  assert.ok(out.includes('Priya'), 'the vendor still gets his referent when the stamp fails');
});

await t('§3.4 the drain NEVER costs the vendor his turn (fail-safe to empty, the categoryFraming precedent)', async () => {
  const boom = { from() { throw new Error('db down'); } };
  assert.strictEqual(await fetchLeadPings(boom, V), '');
  assert.strictEqual(await fetchLeadPings(boom, null), '');
});

H('§4 — F-05.56: THE ORPHAN SPAN, LABELED (CE-68 R4)');

await t('§4.1 handleOnboarding and executeTool have ZERO callers in src/** and scripts/**', () => {
  const hits = [];
  const walk = (dir) => { for (const e of fs.readdirSync(P(dir), { withFileTypes: true })) {
    const r = `${dir}/${e.name}`;
    if (e.isDirectory()) { if (!/node_modules|dist/.test(e.name)) walk(r); continue; }
    if (!/\.(js|ts)$/.test(e.name)) continue;
    for (const l of code(r).split('\n')) if (/\b(handleOnboarding|executeTool)\s*\(/.test(l) && !/^\s*async function|^\s*function/.test(l)) hits.push(`${r}: ${l.trim()}`);
  } };
  walk('src'); walk('scripts');
  assert.deepStrictEqual(hits, [], 'a caller appeared — F-05.56\'s label is now false and must be retired, not ignored');
  assert.ok(/module\.exports = \{ runCoupleAgenticTurn \};/.test(code('src/agent/engine.js')), 'neither is exported either');
});

await t('§4.2 the defused-island header is present, cites its ruling, and points somewhere', () => {
  const e = read('src/agent/engine.js');
  const i = e.indexOf('F-05.56 — EVERYTHING BELOW THIS LINE HAS ZERO CALLERS SINCE ARC M5');
  assert.ok(i > 0, 'a zero-caller span that does not say so is a trap (M5\'s own sentence)');
  const head = e.slice(i, i + 2600);
  assert.ok(/REVIVAL-OR-DELETION POINTER/.test(head), 'the next reader needs the pointer');
  assert.ok(/DELETION IS NOT THIS MICRO'S/.test(head), 'the ruling\'s own limit must ride the label');
  assert.ok(i < e.indexOf('async function handleOnboarding'), 'the header must stand ABOVE the span it labels');
});

await t('§4.3 the label is COMMENT-ONLY — the DEFUSED ISLAND\'s executable lines are untouched', () => {
  // ── LABELED AMENDMENT (BLOCK 06 M-0), COUNT PRESERVED · RATIFY-OR-REVERT ────
  // THIS CELL READ: strip(git show HEAD:src/agent/engine.js) === strip(working copy),
  // i.e. THE WHOLE FILE. That is an OPEN-ENDED GUARD — the arc_m4 §4.1 disease and
  // the one the f0555 handover predicted in writing: green on the day it shipped,
  // structurally RED the moment any chartered sitting lawfully touches ANY part of
  // engine.js, and green again the moment the founder commits that same delivery.
  // A guard that flips on push timing is not asserting a property, it is asserting
  // a schedule. M-0 is the predicted collision: α and D1-lite move executable bytes
  // in `runCoupleAgenticTurn`, ~400 lines ABOVE the island, and this cell reddened.
  //
  // RE-AIMED TO THE PROPERTY IT EXISTS FOR, by the arc_m4 cure's own shape:
  //   BASE PINNED to 5335bb2 — the commit that authored and proved the defusal —
  //   instead of a moving HEAD; and
  //   SCOPED to the ISLAND — from F-05.56's banner to module.exports — instead of
  //   the whole file, anchored on a string that occurs once and cannot drift onto
  //   a neighbour however many functions this file grows.
  // The assertion is now true FOREVER unless someone edits the defused code, which
  // is precisely what the deletion ruling exists to authorise.
  const { execFileSync } = require('child_process');
  const BASE = '5335bb2';
  const BANNER = 'F-05.56 — EVERYTHING BELOW THIS LINE HAS ZERO CALLERS';
  const END = 'module.exports = { runCoupleAgenticTurn };';
  const island = (s) => {
    const i = s.indexOf(BANNER), j = s.indexOf(END);
    assert.ok(i !== -1 && j !== -1 && j > i, 'the island anchors have drifted — re-derive before trusting this cell');
    return s.slice(i, j).split('\n').filter((l) => l.trim() && !l.trim().startsWith('//')).join('\n');
  };
  const before = execFileSync('git', ['show', `${BASE}:src/agent/engine.js`], { cwd: ROOT, encoding: 'utf8' });
  const a = island(before), b = island(read('src/agent/engine.js'));
  assert.ok(a.split('\n').length > 500, 'the island shrank to nothing — the scope anchor is wrong, not the code');
  assert.strictEqual(a, b, 'a defusal that moves an executable byte is not a defusal');
});

H('§5 — THE WIRE: DOOR-BUILT, WA-ONLY, AS RULED');

await t('§5.1 the WA vendor door builds the block and hands it to the live turn', () => {
  const v = code('src/lib/vendorInbound.js');
  assert.ok(/const leadPings = await fetchLeadPings\(supabase, vendor\.id\);/.test(v), 'the drain must run at the door — the engine client cannot see the public plane');
  assert.ok(/leadPings,/.test(v.slice(v.indexOf('const result = await runTurn({'))), 'and reach runTurn');
  const i = v.indexOf('const leadPings'), j = v.indexOf('const result = await runTurn({');
  assert.ok(i > 0 && i < j, 'built before the turn, not after it');
});

await t('§5.2 the dep is injected like its two siblings, from the one deps assembly', () => {
  const idx = code('src/index.js');
  assert.ok(/require\('\.\/lib\/vendor\/leadPings'\)/.test(idx), 'index.js binds the drain');
  const deps = idx.slice(idx.indexOf('const vendorInboundDeps = {'), idx.indexOf('};', idx.indexOf('const vendorInboundDeps = {')));
  assert.ok(/fetchLeadPings/.test(deps), 'and passes it into the shared vendor core');
  assert.ok(/fetchLeadPings/.test(code('src/lib/vendorInbound.js')), 'which destructures it');
});

await t('§5.3 WA-ONLY as ruled — the PWA door ships zero bytes this micro', () => {
  assert.ok(!/leadPings/.test(code('src/api/vendor-engine/chat.js')), 'the PWA seam is DEFERRED-NAMED, not half-built');
});

H('§6 — W-1 AND PURITY');

await t('§6.1 zero soul/prompt/voice bytes', () => {
  const { execSync } = require('child_process');
  const out = execSync('git diff --name-only 2028a0d -- src/agent/miraSoul.js src/agent/brideSystemPrompt.js src/agent/circleSystemPrompt.js src/agent/coupleSystemPrompt.js src/agent/brideTools.js src/agent/brideOnboarding.js src/engine/src/core/harveySoul.ts src/engine/src/core/donnaSoul.ts src/engine/src/core/advisorLens.ts', { cwd: ROOT }).toString().trim();
  assert.strictEqual(out, '', `W-1 BREACH: ${out}`);
});

await t('§6.2 engine.js:353 — Mira\'s closing line stands BYTE-UNTOUCHED (R7)', () => {
  const e = read('src/agent/engine.js');
  assert.ok(e.includes("Perfect — I\\'ve passed this to "), 'the promise the micro hardens is the one it must not rewrite');
  assert.ok(e.includes("they\\'ll be in touch soon!"), 'both halves of the ratified sentence');
});

await t('§6.3 the notice rows STAY (R3, shape K) — telemetry was never the mechanism', () => {
  const e = code('src/agent/engine.js');
  assert.strictEqual((e.match(/sent_by: 'system',/g) || []).length, 2, 'both audit rows stand; (M) was rejected as F-04.71\'s costume class');
});

await t('§6.4 zero migrations — the columns and the index already carry this cure', () => {
  const ladder = fs.readdirSync(P('db/migrations'));
  assert.ok(!ladder.some((f) => /^0101/.test(f)), '0101 stays unreserved; no DDL rides this micro');
});

H('§7 — NON-VACUOUS: RED AT THE UNCURED TREE, BY PRODUCTION MUTATION');
if (!process.env.F0550_BENCH_CHILD) {
  const { execFileSync } = require('child_process');
  const M = [
    { cell: '§2.1', why: 'the block leaves the dynamic tail for the message stream — F-04.70\'s laundering path, re-opened',
      file: 'src/engine/src/core/loop.ts', from: '+ actBlock + pingBlock;', to: '+ actBlock;' },
    { cell: '§2.1', why: 'the A-3 gate goes optional — an advisor room regains its donor pool',
      file: 'src/engine/src/core/loop.ts', from: 'const pingBlock = (estateInRoom && args.leadPings)', to: 'const pingBlock = (true && args.leadPings)' },
    { cell: '§3.1', why: 'the stamp disappears — the ping surfaces forever and L1 is a fiction',
      file: 'src/lib/vendor/leadPings.js', from: "      .update({ acknowledged_at: new Date().toISOString() })", to: "      .update({ })" },
    { cell: '§1.7', why: 'the vendor scope drops — one vendor sees another vendor\'s bride (B-3)',
      file: 'src/lib/vendor/leadPings.js', from: "      .eq('vendor_id', vendorId)\n", to: "" },
    { cell: '§5.1', why: 'the door stops handing it over — the reader exists and nobody reads it, the disease exactly',
      file: 'src/lib/vendorInbound.js', from: '      leadPings, // TDW_05 F-05.50(b)', to: '      // leadPings, // TDW_05 F-05.50(b)' },
  ];
  for (const m of M) {
    const abs = P(m.file), orig = fs.readFileSync(abs, 'utf8');
    try {
      if (!orig.includes(m.from)) { console.log(`  FAIL MUTATION anchor stale in ${m.file}`); fail++; continue; }
      fs.writeFileSync(abs, orig.replace(m.from, m.to));
      let red = false, out = '';
      try { execFileSync(process.execPath, [P('scripts/b05_f0550_ping_drain_bench.js')], { env: { ...process.env, F0550_BENCH_CHILD: '1' }, encoding: 'utf8', stdio: 'pipe' }); }
      catch (e) { red = true; out = String(e.stdout || ''); }
      if (!red) { console.log(`  FAIL ${m.cell} MUTATION stayed GREEN — ${m.why}`); fail++; }
      else if (!out.includes(`FAIL ${m.cell}`)) { console.log(`  FAIL ${m.cell} red on the wrong cell — ${m.why}`); fail++; }
      else { console.log(`  ok   ${m.cell} RED at the uncured tree — ${m.why}`); pass++; }
    } finally { fs.writeFileSync(abs, orig); }
  }
  await t('§7.0 every mutated file restored BYTE-IDENTICAL', () => { for (const m of M) assert.ok(fs.readFileSync(P(m.file), 'utf8').includes(m.from), m.file); });
}

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) console.log('GREEN — the table has a reader, her words reach him as context and never as testimony, and a surfaced ping is a spent one.');
process.exit(fail === 0 ? 0 : 1);
})();
