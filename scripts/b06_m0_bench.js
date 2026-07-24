// scripts/b06_m0_bench.js — BLOCK 06 · M-0 · EVIDENCE-INTEGRITY PREP.
//   node scripts/b06_m0_bench.js        (runnable from any cwd — Q-SP-5)
//
// FOUR DISEASES, ONE PURPOSE: the data Victor and Mira are judged against must be
// TRUE before the judging begins.
//   F-05.60 — a TDW-prefixed bride message was REPLACED with the literal 'hi'
//   F-05.53/54 — one enquiry double-writes; the verdict is spoken to nobody
//   F-05.59 — a repeat enquiry stores a first-message claim that is not first
//   F-05.52 — a phantom column lands phone:NULL on every real vendor
//
// THE SIX CE-NAMED CELLS (R6): §1.2 A-case · §2.6 one-copy · §3.1+§3.2 primacy ·
// §4.2 never-clobber · §5.1 loud-verdict · §6.1 identity.
//
// WHAT IS REAL AND WHAT IS FIXTURE. The functions under test are the SHIPPED ones:
// `stripRoutingToken` and `enquiryToBinder` and `resolveAgentForVendor` are required
// from src/, and §2's cells LIFT THE SHIPPED EXPRESSIONS out of src/agent/engine.js
// and evaluate them — so a later edit to the filter cannot pass this bench by leaving
// a comment behind. The only fixtures are the BOUNDARIES: a PostgREST-shaped recording
// client, and a recording `executeRecordTool`. Test setup is never mutated (§8).
//
// NON-VACUITY (§8): seven PRODUCTION mutations, each re-running this bench in a child
// and asserting it goes RED ON THE NAMED CELL.
'use strict';
const assert = require('assert');
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
// `code()` strips comment lines: a property must live in the executable bytes, never
// in a sentence about them. (The estate has paid for that distinction twice.)
const code = (r) => read(r).split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
let pass = 0, fail = 0;
const t = async (n, f) => { try { await f(); console.log(`  ok   ${n}`); pass++; } catch (e) { console.log(`  FAIL ${n}\n       ${e.message}`); fail++; } };
const H = (s) => console.log(`\n${s}`);

const DOOR   = 'src/lib/vendorInbound.js';
const ENGINE = 'src/agent/engine.js';
const BINDER = 'src/lib/vendor/enquiryBinder.js';
const BRIDGE = 'src/api/middleware/agentBridge.js';

// ── THE REAL BRIDGE, captured BEFORE the injection below overwrites its cache entry.
const realBridge = require(P(BRIDGE));

// ── BOUNDARY FIXTURES. Injected into require.cache so `enquiryToBinder` — the real
// function — runs against recorders instead of a database. Its own logic is untouched.
const recCalls = [];
const DIST = P('src/engine/dist/core/tools/recordPrimitives.js');
const distReady = fs.existsSync(DIST);
if (distReady) {
  require.cache[DIST] = { id: DIST, filename: DIST, loaded: true, exports: {
    executeRecordTool: async (agentId, name, input) => {
      recCalls.push({ agentId, name, input });
      if (name === 'donna_client' && !input.binder_id) return { display: 'client set', item: { ref_id: 'binder-fresh' } };
      return { display: `${name} ok` };
    },
  } };
  const BR = P(BRIDGE);
  require.cache[BR] = { id: BR, filename: BR, loaded: true, exports: { resolveAgentForVendor: async () => ({ agentId: 'agent-1', agentPreset: 'p' }) } };
  const RU = P('src/lib/resolveUsersId.js');
  require.cache[RU] = { id: RU, filename: RU, loaded: true, exports: { resolveAuthUserId: async () => 'auth-1' } };
}
const { enquiryToBinder } = distReady ? require(P(BINDER)) : {};
const { stripRoutingToken } = require(P(DOOR));

// ── A PostgREST-shaped recorder. `respond(ctx)` decides each terminal's answer.
function recorder(respond) {
  const log = [];
  const mk = (schema) => ({
    from(table) {
      const ctx = { schema, table, op: null, payload: null, preds: [], cols: null };
      const settle = (kind) => { ctx.terminal = kind; log.push(ctx); return Promise.resolve(respond(ctx)); };
      const b = {
        select(c) { if (!ctx.op) ctx.op = 'select'; ctx.cols = c; return b; },
        insert(p) { ctx.op = 'insert'; ctx.payload = p; return b; },
        upsert(p, o) { ctx.op = 'upsert'; ctx.payload = p; ctx.opts = o; return b; },
        update(p) { ctx.op = 'update'; ctx.payload = p; return b; },
        eq(k, v) { ctx.preds.push(['eq', k, v]); return b; },
        is(k, v) { ctx.preds.push(['is', k, v]); return b; },
        limit(n) { ctx.limit = n; return b; },
        order() { return b; },
        maybeSingle() { return settle('maybeSingle'); },
        single() { return settle('single'); },
        then(res, rej) { return settle('then').then(res, rej); },
      };
      return b;
    },
  });
  const root = mk('public');
  root.schema = (s) => mk(s);
  return { supabase: root, log };
}
const pred = (ctx, k) => (ctx.preds.find((p) => p[1] === k) || [])[2];

// The binder's collaborators answer from here. `existing` = the dedupe hit, or null.
function binderClient({ existing }) {
  return recorder((ctx) => {
    if (ctx.schema === 'public' && ctx.table === 'vendors') return { data: { id: 'v1', user_id: 'u1' }, error: null };
    if (ctx.schema === 'engine' && ctx.table === 'records') return { data: existing, error: null };
    return { data: null, error: null };
  });
}
const noteOf = (name) => recCalls.filter((c) => c.name === name).map((c) => c.input.note);
const PRIMACY = 'Enquiry via your TDW link. First message:';

(async () => {

// ════════════════════════════════════════════════════════════════════════════
H('§1 — F-05.60 / A1: THE ROUTING TOKEN LEAVES, THE SENTENCE STAYS');

await t('§1.1 prefixed code + a real question -> the QUESTION survives whole', () => {
  assert.strictEqual(stripRoutingToken("TDW-DROY550 what's your rate for 300 guests?"), "what's your rate for 300 guests?");
});

await t('§1.2 ★A-CASE — a LOWERCASE tdw- send strips exactly (the trap the uppercase hides)', () => {
  // The call site uppercases before testing the prefix, so the disease fired on
  // lowercase too. A cure matching the UPPERCASED token against the raw body would
  // strip nothing here and quietly leave half the disease alive.
  assert.strictEqual(stripRoutingToken("tdw-droy550 what's your rate?"), "what's your rate?");
  assert.strictEqual(stripRoutingToken('tdw-droy550 Rs 50,000 budget — can you do it?'), 'Rs 50,000 budget — can you do it?');
});

await t('§1.3 mixed case strips exactly', () => {
  assert.strictEqual(stripRoutingToken('TDW-Droy550 are you free in December?'), 'are you free in December?');
});

await t('§1.4 a BARE handle carrying a sentence -> the sentence survives (the coupon-code misread)', () => {
  // "Victor called DROY550 a coupon code" — the bare handle rode her sentence
  // through the ping because nothing stripped it. Same shape, same cure.
  assert.strictEqual(stripRoutingToken('DROY550 do you shoot destination weddings?'), 'do you shoot destination weddings?');
});

await t('§1.5 a bare code ALONE -> nothing remains (the greeting\'s only lawful trigger)', () => {
  assert.strictEqual(stripRoutingToken('DROY550'), '');
  assert.strictEqual(stripRoutingToken('  DROY550  '), '');
});

await t('§1.6 a prefixed code ALONE -> nothing remains', () => {
  assert.strictEqual(stripRoutingToken('TDW-DROY550'), '');
  assert.strictEqual(stripRoutingToken('tdw-droy550'), '');
});

await t('§1.7 multi-space and newline separators do not corrupt the remainder', () => {
  assert.strictEqual(stripRoutingToken('TDW-DROY550    what about 12 Feb?'), 'what about 12 Feb?');
  assert.strictEqual(stripRoutingToken('TDW-DROY550\nwhat about 12 Feb?'), 'what about 12 Feb?');
});

await t('§1.8 the greeting fires ONLY on emptiness — the BRANCH swept, not the output', () => {
  // THIS CELL WAS WRONG IN DRAFT and the error is worth keeping in view: it asserted
  // that `strip(b) || 'hi'` never EQUALS 'hi' for a body carrying a sentence. But a
  // bride may perfectly well send "TDW-DROY550 hi" — the output is 'hi' and the
  // fallback never fired. Asserting the OUTPUT conflated two different worlds.
  // The property is about which BRANCH is taken, so that is what is asserted.
  const carrying = ['TDW-DROY550 hi', 'TDW-DROY550 ?', 'DROY550 a', 'tdw-droy550 Rs 5', "TDW-DROY550 what's your rate", 'DROY550 12 Feb'];
  for (const b of carrying) {
    assert.notStrictEqual(stripRoutingToken(b), '', `"${b}" carries a sentence — the fallback branch must not be reachable`);
  }
  for (const b of ['TDW-DROY550', 'DROY550', '   ', '']) {
    assert.strictEqual(stripRoutingToken(b), '', `"${b}" is token-only — the fallback is the honest answer`);
    assert.strictEqual(stripRoutingToken(b) || 'hi', 'hi', `"${b}" must land the greeting`);
  }
  // And the one that proves the distinction: same output, different branch.
  assert.strictEqual(stripRoutingToken('TDW-DROY550 hi'), 'hi', 'her own word, not the substitution');
});

await t('§1.9 THE DISEASE IS DEAD — no substitution expression survives in the door', () => {
  const c = code(DOOR);
  assert.ok(!/\?\s*'hi'\s*:\s*body/.test(c), "the ternary that replaced her message with 'hi' is still executable");
  assert.ok(!/startsWith\('TDW-'\)\s*\?\s*'hi'/.test(c), 'the substitution survives in another arrangement');
});

await t('§1.10 the door\'s shipped call is the strip, with the greeting as fallback', () => {
  assert.ok(code(DOOR).includes("inboundMessage: stripRoutingToken(body) || 'hi'"), 'the couple turn is not fed the stripped body');
});

// ════════════════════════════════════════════════════════════════════════════
H('§2 — A-dedupe(α): EXACTLY ONE COPY OF HER SENTENCE REACHES THE MODEL');

const engSrc = read(ENGINE);
const filterLine = (engSrc.match(/\.filter\(m => m\.body !== [^)]*\)/) || [])[0];
const defaultExpr = (engSrc.match(/const inboundBodyAsStored = \([\s\S]*?;\n/) || [])[0];

await t('§2.1 the shipped filter compares against the STORED body, not the derived message', () => {
  assert.ok(filterLine, 'the history de-dupe filter could not be located in engine.js');
  assert.ok(/inboundBodyAsStored/.test(filterLine), `the filter still reads a derived value: ${filterLine}`);
  assert.ok(!/m\.body !== inboundMessage/.test(filterLine), 'the filter compares against inboundMessage — F-05.60\'s second defect, alive');
});

await t('§2.2 the SHIPPED predicate, EVALUATED: the row the door just wrote is dropped', () => {
  const p = new Function('m', 'inboundBodyAsStored', `return (${filterLine.replace(/^\.filter\(m => /, '').replace(/\)$/, '')});`);
  const raw = "TDW-DROY550 what's your rate?";
  assert.strictEqual(p({ body: raw, direction: 'inbound' }, raw), false, 'the audit row survives and her sentence is duplicated');
});

await t('§2.3 the SHIPPED predicate keeps genuine history (an earlier inbound, an outbound)', () => {
  const p = new Function('m', 'inboundBodyAsStored', `return (${filterLine.replace(/^\.filter\(m => /, '').replace(/\)$/, '')});`);
  const raw = "TDW-DROY550 what's your rate?";
  assert.strictEqual(p({ body: 'earlier question', direction: 'inbound' }, raw), true, 'real history was dropped');
  assert.strictEqual(p({ body: raw, direction: 'outbound' }, raw), true, 'an outbound echo is not the message in hand');
});

await t('§2.4 rawInboundBody DEFAULTS — the three sibling callers stay byte-identical', () => {
  assert.ok(defaultExpr, 'the default expression could not be located');
  const f = new Function('inboundMessage', 'rawInboundBody', `${defaultExpr} return inboundBodyAsStored;`);
  assert.strictEqual(f('hello', undefined), 'hello', 'an omitted rawInboundBody must fall back to inboundMessage');
  assert.strictEqual(f('hello', null), 'hello', 'a null rawInboundBody must fall back to inboundMessage');
  assert.strictEqual(f('stripped', 'RAW BODY'), 'RAW BODY', 'a supplied raw body must win');
  assert.strictEqual(f('hello', ''), '', 'an empty string is a value, not an absence');
});

await t('§2.5 the door hands the raw body over at the TDW site', () => {
  assert.ok(code(DOOR).includes('rawInboundBody: body'), 'the engine is never told what was actually stored');
});

await t('§2.6 ★ONE-COPY — her sentence reaches the model exactly once, end to end', () => {
  // The door writes the audit row with the RAW body, then hands the engine the
  // stripped remainder. Compose the shipped filter with the shipped user turn and
  // count how many times her words appear in what the model receives.
  const raw = "TDW-DROY550 what's your rate for 300 guests?";
  const stripped = stripRoutingToken(raw) || 'hi';
  const p = new Function('m', 'inboundBodyAsStored', `return (${filterLine.replace(/^\.filter\(m => /, '').replace(/\)$/, '')});`);
  const stored = [{ body: 'hello there', direction: 'outbound' }, { body: raw, direction: 'inbound' }];
  const history = stored.filter((m) => p(m, raw));
  const model = [...history.map((m) => m.body), stripped];
  const carrying = model.filter((s) => s.includes("what's your rate for 300 guests?"));
  assert.strictEqual(carrying.length, 1, `her sentence reaches the model ${carrying.length}×, not once: ${JSON.stringify(model)}`);
  assert.ok(!model.some((s) => s.includes('TDW-DROY550')), 'the routing token leaked into the message plane');
});

await t('§2.7 the three sibling couple sites do NOT pass rawInboundBody (byte-identity by absence)', () => {
  const c = code(DOOR);
  assert.strictEqual((c.match(/rawInboundBody: body/g) || []).length, 1, 'rawInboundBody spread beyond the one branch that needed it');
});

await t('§2.8 γ REFUSED — the audit row still stores the RAW body', () => {
  // ANCHORED FORWARD FROM A UNIQUE STRING. The draft sliced BACKWARDS from a
  // comment and landed on a negative index — the referent lesson, and the third
  // defect this bench found in itself. `const preTurnBinder` occurs exactly once.
  const raw = read(DOOR);
  const at = raw.indexOf('const preTurnBinder');
  assert.notStrictEqual(at, -1, 'the anchor itself has drifted');
  const auditRow = raw.slice(raw.lastIndexOf('inboundRow({', at), at);
  assert.ok(/\n\s+body,\n/.test(auditRow), `the TDW audit row no longer stores the raw body: ${auditRow.slice(0, 200)}`);
  assert.ok(!/body:\s*stripRoutingToken/.test(auditRow), 'the audit row was rewritten to match a derived value (γ)');
  assert.ok(/sent_by: 'couple'/.test(auditRow), 'the anchor landed on the wrong insert');
});

// ════════════════════════════════════════════════════════════════════════════
H('§3 — F-05.59 / C1: PRIMACY IS CLAIMED ONLY WHERE IT IS TRUE');
if (!distReady) {
  console.log('  … engine dist absent (clean clone) — §3/§4/§5.4 SKIP, stated.');
  console.log('    THE FIX, one line:  npm run build && node scripts/b06_m0_bench.js');
} else {

await t('§3.1 ★PRIMACY-TRUE — a FRESH binder receives the first-message line', async () => {
  recCalls.length = 0;
  const { supabase } = binderClient({ existing: null });
  const res = await enquiryToBinder(supabase, 'v1', { phone: '+9198', noteIfNew: `${PRIMACY} what's your rate?` });
  assert.strictEqual(res.deduped, false, 'this binder is fresh');
  const notes = [...noteOf('donna_note'), ...noteOf('donna_note_append')].join('|');
  assert.ok(notes.includes(PRIMACY), 'a genuinely first message lost its first-message line');
});

await t('§3.2 ★PRIMACY-FALSE — a DEDUPE hit receives NO first-message line', async () => {
  recCalls.length = 0;
  const { supabase } = binderClient({ existing: { id: 'binder-old', client: 'Dream Wedding enquiry' } });
  const res = await enquiryToBinder(supabase, 'v1', { phone: '+9198', noteIfNew: `${PRIMACY} what's your rate?` });
  assert.strictEqual(res.deduped, true, 'the dedupe path was not taken');
  const notes = [...noteOf('donna_note'), ...noteOf('donna_note_append')].join('|');
  assert.ok(!notes.includes(PRIMACY), 'a repeat enquiry stored a first-message claim about a message that is not the first');
});

await t('§3.3 NO REGRESSION — an always-note is still appended on a dedupe hit', async () => {
  recCalls.length = 0;
  const { supabase } = binderClient({ existing: { id: 'binder-old', client: 'Dream Wedding enquiry' } });
  await enquiryToBinder(supabase, 'v1', { phone: '+9198', note: 'She asked about December.' });
  assert.ok(noteOf('donna_note_append').join('|').includes('She asked about December.'), 'the vendor summary stopped reaching the cabinet');
});

await t('§3.4 the door passes the claim as noteIfNew, never as note', () => {
  const c = code(DOOR);
  assert.ok(c.includes(`noteIfNew: \`${PRIMACY}`), 'the primacy sentence is not on the fresh-only key');
  assert.ok(!c.includes(`note: \`${PRIMACY}`), 'the primacy sentence is still an always-note');
});

await t('§3.5 COPY INVENTORY ZERO — the sentence bytes are unchanged', () => {
  assert.ok(read(DOOR).includes('`Enquiry via your TDW link. First message: ${body}`'), 'stored vendor-readable copy changed without a veto');
  assert.ok(read(BINDER).includes("const DEFAULT_CLIENT_NAME = 'Dream Wedding enquiry';"), 'the default client name bytes changed without a veto');
});

// ════════════════════════════════════════════════════════════════════════════
H('§4 — D1-lite: THE BINDER GAINS A NAME, AND NEVER LOSES A HUMAN\'S');

await t('§4.1 a dedupe hit still carrying the DEFAULT is renamed once a name exists', async () => {
  recCalls.length = 0;
  const { supabase } = binderClient({ existing: { id: 'binder-old', client: 'Dream Wedding enquiry' } });
  await enquiryToBinder(supabase, 'v1', { phone: '+9198', name: 'Priya Sharma', note: 'summary' });
  const renames = recCalls.filter((c) => c.name === 'donna_client' && c.input.binder_id === 'binder-old');
  assert.strictEqual(renames.length, 1, 'the nameless binder stayed nameless');
  assert.strictEqual(renames[0].input.client, 'Priya Sharma');
});

await t('§4.2 ★NEVER-CLOBBER — a HUMAN-set name is left untouched', async () => {
  recCalls.length = 0;
  const { supabase } = binderClient({ existing: { id: 'binder-old', client: 'Priya + Rohan (Dec wedding)' } });
  await enquiryToBinder(supabase, 'v1', { phone: '+9198', name: 'Priya Sharma', note: 'summary' });
  const renames = recCalls.filter((c) => c.name === 'donna_client' && c.input.binder_id === 'binder-old');
  assert.strictEqual(renames.length, 0, 'a marketplace hand overwrote a name the vendor set himself');
});

await t('§4.3 no name offered -> no rename attempted at all', async () => {
  recCalls.length = 0;
  const { supabase } = binderClient({ existing: { id: 'binder-old', client: 'Dream Wedding enquiry' } });
  await enquiryToBinder(supabase, 'v1', { phone: '+9198', note: 'summary' });
  assert.strictEqual(recCalls.filter((c) => c.name === 'donna_client').length, 0, 'a rename fired with nothing to rename to');
});

await t('§4.4 a FRESH binder opens under the offered name', async () => {
  recCalls.length = 0;
  const { supabase } = binderClient({ existing: null });
  await enquiryToBinder(supabase, 'v1', { phone: '+9198', name: 'Priya Sharma' });
  const open = recCalls.find((c) => c.name === 'donna_client' && !c.input.binder_id);
  assert.strictEqual(open.input.client, 'Priya Sharma');
});

await t('§4.5 a FRESH binder with no name opens under the ONE default referent', async () => {
  recCalls.length = 0;
  const { supabase } = binderClient({ existing: null });
  await enquiryToBinder(supabase, 'v1', { phone: '+9198' });
  const open = recCalls.find((c) => c.name === 'donna_client' && !c.input.binder_id);
  assert.strictEqual(open.input.client, 'Dream Wedding enquiry');
  // ONE referent: the guard at §4.2 compares against the same constant this writes.
  assert.strictEqual((code(BINDER).match(/'Dream Wedding enquiry'/g) || []).length, 1, 'two copies of the default — the guard can drift off the writer');
});

await t('§4.6 the door names the binder POST-turn only (pre-turn has no name to give)', () => {
  const c = code(DOOR);
  assert.ok(c.includes('name: result.leadName || null'), 'the post-turn call does not carry the resolved name');
  const pre = c.slice(c.indexOf('const preTurnBinder'), c.indexOf('const result = await runCoupleAgenticTurn'));
  assert.ok(!/name:/.test(pre), 'the pre-turn call claims a name it cannot have');
});

await t('§4.7 the engine returns leadName ADDITIVELY — every existing key intact', () => {
  const c = code(ENGINE);
  const ret = c.slice(c.indexOf('reply: finalReply'), c.indexOf('reply: finalReply') + 600);
  for (const k of ['reply:', 'toolCalls:', 'iterations:', 'vendorNotification:', 'leadName:']) {
    assert.ok(ret.includes(k), `the couple turn's contract lost ${k}`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
H('§5 — F-05.54: THE VERDICT IS READ, AND SAID OUT LOUD');

await t('§5.4 the dedupe path\'s returned binder shape stays { id } — enquire.js:88 unmoved', async () => {
  const { supabase } = binderClient({ existing: { id: 'binder-old', client: 'Dream Wedding enquiry' } });
  const res = await enquiryToBinder(supabase, 'v1', { phone: '+9198' });
  assert.deepStrictEqual(Object.keys(res.binder), ['id'], 'the binder object grew a key its readers never asked for');
  assert.strictEqual(res.binder.id, 'binder-old');
});

}

await t('§5.1 ★LOUD-VERDICT — the pre-turn call READS ok and speaks on failure', () => {
  const c = code(DOOR);
  assert.ok(c.includes('const preTurnBinder = await enquiryToBinder'), 'the pre-turn verdict is still discarded (bare await)');
  // `const result = await runCoupleAgenticTurn` occurs FOUR times in this file and
  // the draft sliced to the FIRST — which sits ~200 lines ABOVE this one, so the
  // window ran backwards and was empty. The cell was RED at the cured tree, and its
  // §8 mutation therefore proved nothing: it was red before and after. The
  // apparatus that proves the work must itself be proven.
  const at = c.indexOf('const preTurnBinder');
  const blk = c.slice(at, at + 900);
  assert.ok(/preTurnBinder\.ok !== true/.test(blk), 'ok is never tested');
  assert.ok(/console\.error/.test(blk), 'a failed cabinet write stays silent — F-05.61\'s family');
  assert.ok(/enquiry-binder:pre-turn/.test(blk), 'the log carries no findable tag');
});

await t('§5.2 the post-turn call READS ok and speaks on failure', () => {
  const c = code(DOOR);
  assert.ok(c.includes('const postTurnBinder = await enquiryToBinder'), 'the post-turn verdict is still discarded');
  const blk = c.slice(c.indexOf('const postTurnBinder'), c.indexOf('const postTurnBinder') + 700);
  assert.ok(/postTurnBinder\.ok !== true/.test(blk) && /console\.error/.test(blk), 'the post-turn failure is silent');
});

await t('§5.3 no bare-await enquiryToBinder call survives in the door', () => {
  const c = code(DOOR);
  assert.ok(!/^\s*await enquiryToBinder\(/m.test(c), 'a verdict is still being spoken to nobody');
});

// ════════════════════════════════════════════════════════════════════════════
H('§6 — F-05.52 / E1: A REAL VENDOR LANDS A REAL PHONE');

await t('§6.1 ★IDENTITY — a public.vendors vendor lands its owner\'s phone at create', async () => {
  const { supabase, log } = recorder((ctx) => {
    if (ctx.schema === 'public' && ctx.table === 'users') return { data: { auth_user_id: 'auth-1', phone: '+917982159047', name: 'Droy' }, error: null };
    if (ctx.schema === 'engine' && ctx.table === 'users') return ctx.op === 'select' ? { data: null, error: null } : { data: { id: 'eu1' }, error: null };
    if (ctx.schema === 'engine' && ctx.table === 'agents') return ctx.op === 'select' ? { data: null, error: null } : { data: { id: 'ag1', profession_preset: 'p' }, error: null };
    return { data: null, error: null };
  });
  // A REAL vendor row: public.vendors has no whatsapp_phone column, so the fixture
  // must not invent one. This row is shaped like the table (PUBLIC_SCHEMA.md).
  const vendor = { id: 'v1', user_id: 'u1', business_name: 'Droy Studio', category: 'photographer' };
  await realBridge.resolveAgentForVendor(supabase, vendor, 'auth-1');
  const born = log.find((c) => c.schema === 'engine' && c.table === 'users' && c.op === 'upsert');
  assert.ok(born, 'no engine.users row was created');
  assert.strictEqual(born.payload.phone, '+917982159047', `engine.users was born with phone=${JSON.stringify(born.payload.phone)} — the structural NULL is alive`);
});

await t('§6.2 the phantom column is gone from the bridge', () => {
  assert.ok(!/whatsapp_phone/.test(code(BRIDGE)), 'a demo_vendors column is still read on the real-vendor path');
});

await t('§6.3 ZERO NEW QUERIES — the phone rides the guard\'s own select', async () => {
  const { supabase, log } = recorder((ctx) => {
    if (ctx.schema === 'public' && ctx.table === 'users') return { data: { auth_user_id: 'auth-1', phone: '+9198', name: 'D' }, error: null };
    if (ctx.schema === 'engine' && ctx.table === 'users') return ctx.op === 'select' ? { data: { id: 'eu1' }, error: null } : { data: { id: 'eu1' }, error: null };
    if (ctx.schema === 'engine' && ctx.table === 'agents') return { data: { id: 'ag1', profession_preset: 'p' }, error: null };
    return { data: null, error: null };
  });
  await realBridge.resolveAgentForVendor(supabase, { id: 'v1', user_id: 'u1', business_name: 'B', category: 'c' }, 'auth-1');
  const pubUserReads = log.filter((c) => c.schema === 'public' && c.table === 'users' && c.op === 'select');
  assert.strictEqual(pubUserReads.length, 1, `the cure added a query (${pubUserReads.length} public.users reads on a warm path)`);
  assert.ok(/phone/.test(pubUserReads[0].cols), `the guard's select does not carry phone: ${pubUserReads[0].cols}`);
  assert.ok(/auth_user_id/.test(pubUserReads[0].cols), 'the guard lost its own column');
});

await t('§6.4 no phone on the owner row -> null, never undefined', async () => {
  const { supabase, log } = recorder((ctx) => {
    if (ctx.schema === 'public' && ctx.table === 'users') return { data: { auth_user_id: 'auth-1', phone: null }, error: null };
    if (ctx.schema === 'engine' && ctx.table === 'users') return ctx.op === 'select' ? { data: null, error: null } : { data: { id: 'eu1' }, error: null };
    if (ctx.schema === 'engine' && ctx.table === 'agents') return ctx.op === 'select' ? { data: null, error: null } : { data: { id: 'ag1', profession_preset: 'p' }, error: null };
    return { data: null, error: null };
  });
  await realBridge.resolveAgentForVendor(supabase, { id: 'v1', user_id: 'u1', business_name: 'B', category: 'c' }, 'auth-1');
  const born = log.find((c) => c.schema === 'engine' && c.table === 'users' && c.op === 'upsert');
  assert.strictEqual(born.payload.phone, null, 'an undefined would be dropped by PostgREST and read as "not sent"');
});

await t('§6.5 E3 REFUSED, STRUCTURALLY — the phone write stays inside the create branch', () => {
  const c = code(BRIDGE);
  const create = c.slice(c.indexOf('if (!u) {'), c.indexOf("if (up.error) throw up.error"));
  assert.ok(/phone: ownerPhone/.test(create), 'the phone write left the create branch — the bridge became a writer on every turn');
});

// ════════════════════════════════════════════════════════════════════════════
H('§7 — SCOPE: W-1, THE GUARDED FILES, AND THE SQL POSTURE');

// ── LABELED AMENDMENT (TDW_06 M-2, 2026-07-24 — PROPOSED, AWAITING CHAIR RATIFICATION).
// M-0 ran under an ABSOLUTE W-1 and this cell is its guard. M-2's CE ruling opened W-1
// for ONE enumerated rider — a donnaSoul paragraph (F-06.22's no-read law) — and this
// cell reads the WORKING TREE against HEAD, so it convicts that rider in the window
// between the founder's apply and his commit: exactly the window D-10's verify runs in.
// NARROWED, NOT WEAKENED, COUNT PRESERVED: every other soul/prompt/lens surface stays
// forbidden outright, and donnaSoul is admitted ONLY as a lossless addition. Post-commit
// this exception is inert — the diff against HEAD is empty and the cell reads as it
// always did.
await t('§7.1 W-1 ABSOLUTE — zero soul/prompt/lens bytes (AMENDED M-2: donnaSoul admitted LOSSLESS under the chartered rider)', () => {
  const { execFileSync } = require('child_process');
  const CHARTERED_RIDER = 'src/engine/src/core/donnaSoul.ts'; // CE-71 / M-2, the single enumerated exception
  const names = execFileSync('git', ['diff', '--name-only', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const forbidden = names.filter((f) => /donnaSoul|harveySoul|advisorLens|consultantHarveySoul|Prompt|soul/i.test(f) && f !== CHARTERED_RIDER);
  assert.deepStrictEqual(forbidden, [], `soul/prompt surfaces moved: ${forbidden.join(', ')}`);
  if (names.includes(CHARTERED_RIDER)) {
    const stat = execFileSync('git', ['diff', '--numstat', 'HEAD', '--', CHARTERED_RIDER], { cwd: ROOT, encoding: 'utf8' }).trim();
    const deletions = stat ? Number(stat.split(/\s+/)[1]) : 0;
    assert.strictEqual(deletions, 0, `the chartered rider REWROTE the soul instead of adding to it: ${stat}`);
  }
});

await t('§7.2 the guarded files are 0-line', () => {
  const { execFileSync } = require('child_process');
  const names = execFileSync('git', ['diff', '--name-only', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  for (const g of ['src/lib/vendor/scrub.js', 'src/lib/eventWrite.js', 'src/lib/coupleEventWrite.js', 'src/lib/calendarSignals.js', 'src/api/vendor/leads.js']) {
    assert.ok(!names.includes(g), `${g} was touched`);
  }
});

await t('§7.3 SQL POSTURE — 0101 stays unreserved; no DDL rides this sitting', () => {
  assert.ok(!fs.readdirSync(P('db/migrations')).some((f) => /^0101/.test(f)), '0101 was taken');
});

// ════════════════════════════════════════════════════════════════════════════
H('§8 — NON-VACUOUS: RED AT THE UNCURED TREE, BY PRODUCTION MUTATION');
if (!process.env.B06_M0_BENCH_CHILD) {
  const { execFileSync } = require('child_process');
  const M = [
    { cell: '§1.1', why: 'the substitution returns — her question becomes "hi" again',
      file: DOOR, from: "inboundMessage: stripRoutingToken(body) || 'hi'", to: "inboundMessage: firstWord.startsWith('TDW-') ? 'hi' : body" },
    { cell: '§1.2', why: 'the strip matches the UPPERCASED token — every lowercase send survives uncured',
      file: DOOR, from: '  const firstToken = trimmed.split(/\\s+/)[0];\n  return trimmed.slice(firstToken.length).trim();',
      to: '  const firstToken = trimmed.split(/\\s+/)[0].toUpperCase();\n  return trimmed.startsWith(firstToken) ? trimmed.slice(firstToken.length).trim() : trimmed;' },
    { cell: '§2.1', why: 'the filter compares against the derived message — her sentence reaches the model twice',
      file: ENGINE, from: 'm.body !== inboundBodyAsStored', to: 'm.body !== inboundMessage' },
    { cell: '§3.2', why: 'the primacy claim is written on the dedupe path — F-05.59 restored',
      file: BINDER, from: "      // F-05.59's cure, stated as an absence", to: "      if (noteIfNew) await executeRecordTool(agentId, 'donna_note_append', { binder_id: existing.id, note: noteIfNew });\n      // F-05.59's cure, stated as an absence" },
    { cell: '§4.2', why: 'the never-clobber guard goes — a vendor\'s own name is overwritten by a marketplace hand',
      file: BINDER, from: "if (name && existing.client === DEFAULT_CLIENT_NAME) {", to: "if (name) {" },
    { cell: '§5.1', why: 'the verdict goes back to being spoken to nobody — the ok test deleted',
      file: DOOR, from: 'if (!preTurnBinder || preTurnBinder.ok !== true) {', to: 'if (false) {' },
    { cell: '§6.1', why: 'the phantom column returns — every real vendor lands phone:NULL again',
      file: BRIDGE, from: 'phone: ownerPhone,', to: 'phone: vendor.whatsapp_phone || null,' },
  ];
  for (const m of M) {
    const abs = P(m.file), orig = fs.readFileSync(abs, 'utf8');
    try {
      if (!orig.includes(m.from)) { console.log(`  FAIL MUTATION anchor stale in ${m.file} — ${m.cell}`); fail++; continue; }
      fs.writeFileSync(abs, orig.replace(m.from, m.to));
      let red = false, out = '';
      try { execFileSync(process.execPath, [P('scripts/b06_m0_bench.js')], { env: { ...process.env, B06_M0_BENCH_CHILD: '1' }, encoding: 'utf8', stdio: 'pipe' }); }
      catch (e) { red = true; out = String(e.stdout || ''); }
      if (!red) { console.log(`  FAIL ${m.cell} MUTATION stayed GREEN — ${m.why}`); fail++; }
      else if (!out.includes(`FAIL ${m.cell}`)) { console.log(`  FAIL ${m.cell} red on the wrong cell — ${m.why}`); fail++; }
      else { console.log(`  ok   ${m.cell} RED at the uncured tree — ${m.why}`); pass++; }
    } finally { fs.writeFileSync(abs, orig); }
  }
  await t('§8.0 every mutated file restored BYTE-IDENTICAL', () => { for (const m of M) assert.ok(fs.readFileSync(P(m.file), 'utf8').includes(m.from), m.file); });
}

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) console.log('GREEN — her sentence survives the routing token, reaches the model once, is claimed first only when it is first, names the binder without erasing a human, and the vendor his assistant greets has a phone.');
process.exit(fail === 0 ? 0 : 1);
})();
