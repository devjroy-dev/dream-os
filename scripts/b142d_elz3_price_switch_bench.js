'use strict';
// scripts/b142d_elz3_price_switch_bench.js · TDW CE-46 · ELZ-3 · THE PRICE SWITCH (0183; rung b142d, the b142 package). The founder's ruling of
// 29 September 2026 through the chair: her switch "Share approximate prices in chat" (vendors.price_share_enabled, OFF by default); with it on
// and her starting price set (vendors.rate_min), WHENEVER the client asks about price, on every lane, never volunteered, Eliza sends the
// founder's S1 from rate_min, or S2 for a package her words name whose total is at or above rate_min; the code guard refuses any other figure
// and sends S1 instead (the chair: no new line). Off, or rate_min null or 0: today's refusal, the prompt and tools byte-unchanged.
//   §1 couplePriceState: the sentences, the match, the house rupee form, the figures read, the guard
//   §2 the prompt: OFF byte-identical to F-44.230's (a9f7935) on every lane and branch; ON, the price rule in the STABLE text only
//   RE-PINNED (CE-46 ELZ-4, labelled): the reference was 8f0da70, ELZ-3's local commit of F-44.230, never pushed; at origin F-44.230 landed as
//   a9f7935, so in every clone but ELZ-3's container `git show 8f0da70:` failed, THEN was null and 2.1 read 0/12 (a planted red in every floor).
//   §3 the turn (REAL runCoupleAgenticTurn, doubles for the model and the store): price_state only when on; the sentence sent; the guard
//   §4 me.js's four sites and the migration
//   §5 mutations (--mutate) of production code, each reddening its named cell; files restored by sha256
// Run: node scripts/b142d_elz3_price_switch_bench.js [--mutate]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const Module = require('module');
const ROOT = path.resolve(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
const sha = (t) => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

let pass = 0; let fail = 0; const failed = [];
function T(n, c) { if (c) { pass += 1; console.log(`  PASS  ${n}`); } else { fail += 1; failed.push(n); console.log(`  FAIL  ${n}`); } }
const sec = (t) => console.log(`\n${t}`);
const fresh = (r) => { delete require.cache[require.resolve(P(r))]; return require(P(r)); };

const STUDIO = 'Dev Roy Photography';
const PKGS = [{ name: 'Photographs', total: 80000 }, { name: 'Photographs and film', total: 150000 }, { name: 'Photographs, film and album', total: 220000 }, { name: 'Mini', total: 30000 }];
const FACTS = { enabled: true, rateMin: 50000, packages: PKGS };
const S1 = `Packages start from Rs 50,000. The final price depends on your date and what you need; ${STUDIO} will confirm.`;
const S2 = (n, t) => `The ${n} package is Rs ${t}. The final price depends on your date and what you need; ${STUDIO} will confirm.`;

// ── the turn's doubles ──
const llmPath = require.resolve(P('src/lib/llm.js')); const realLlm = require(llmPath);
let SCRIPT = []; const SENT = [];
require.cache[llmPath].exports = { ...realLlm, llmCreate: async (provider, params) => { SENT.push(JSON.parse(JSON.stringify(params))); const step = SCRIPT.shift() || { name: 'respond_to_couple', input: { message: 'ok' } }; return { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: `t${SENT.length}`, ...step }], usage: { input_tokens: 1, output_tokens: 1 } }; } };
const occPath = require.resolve(P('src/lib/vendor/occupancy.js')); const realOcc = require(occPath);
require.cache[occPath].exports = { ...realOcc, describeDate: async () => ({ verdict: 'free' }) };
const intentPath = require.resolve(P('src/lib/intentExtractor.js')); const realIntent = require(intentPath);
require.cache[intentPath].exports = { ...realIntent, getReturningBrideIntent: async () => null };
function store({ vendorRow, packages = PKGS, rows }) {
  return { from(table) { const q = { eqs: {}, sel: '' }; const api = {
    select: (c) => { q.sel = c || ''; return api; }, eq: (c, v) => { q.eqs[c] = v; return api; }, gte: () => api, order: () => api, in: () => api, update: () => api,
    is: () => (table === 'vendor_packages' ? Promise.resolve({ data: packages.map((p) => ({ ...p, deleted_at: null })), error: null }) : api),
    insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'lead-new' } }) }), then: (r) => r({ error: null }) }),
    limit(n) { const p = api._limit(n); p.maybeSingle = () => api.maybeSingle(); return p; },
    async _limit() { return { data: table === 'messages' ? rows.map((r) => ({ ...r })) : [] }; },
    async maybeSingle() {
      if (table === 'vendors') return { data: /price_share_enabled/.test(q.sel) ? vendorRow : { status: 'active', discover_paused: false, date_check_enabled: true } };
      if (table === 'admin_config') return { data: q.eqs.key === 'couple.eliza_enabled' ? { value: 'true' } : null };
      if (table === 'conversations') return { data: q.eqs.kind === 'vendor_self' ? { id: 'vs-1' } : null };
      return { data: null };
    } }; return api; } };
}
const MINE = ['src/agent/engine.js', 'src/agent/coupleSystemPrompt.js', 'src/agent/coupleThreadFacts.js', 'src/agent/studioName.js', 'src/lib/vendor/coupleDateState.js', 'src/lib/vendor/couplePriceState.js', 'src/lib/laneFlags.js'];
const engine = () => { for (const r of MINE) delete require.cache[require.resolve(P(r))]; return require(P('src/agent/engine.js')); };
const V = { id: 'v-dev440', business_name: STUDIO, category: 'Photographer', city: 'Delhi', open_to_travel: true };
const VU = { name: 'Dev Roy', phone: '+910000000000' };
const ON = { id: 'v-dev440', price_share_enabled: true, rate_min: 50000 };
const OFF = { id: 'v-dev440', price_share_enabled: false, rate_min: 50000 };
const NORATE = { id: 'v-dev440', price_share_enabled: true, rate_min: null };
async function turn({ vendorRow, inbound = 'How much do you charge?', script, history = [] }) {
  SCRIPT = script.slice(); SENT.length = 0;
  const rows = [{ direction: 'inbound', body: inbound, sent_by: 'couple', created_at: new Date().toISOString() }, ...history];
  const out = await engine().runCoupleAgenticTurn({ vendor: V, vendorUser: VU, conversation: { id: 'c1' }, couplePhone: '919999900001', coupleId: null, inboundMessage: inbound, supabase: store({ vendorRow, rows }), anthropic: null, counterparty: { channel: 'whatsapp_shared', phone: '919999900001' } });
  return { out, sent: SENT.slice() };
}
function builderAt(ref) {
  const old = cp.execSync(`git show ${ref}:src/agent/coupleSystemPrompt.js`, { cwd: ROOT }).toString();
  const fixed = old.replace(/require\('\.\/([^']+)'\)/g, (m, a) => `require(${JSON.stringify(path.resolve(ROOT, 'src/agent', a))})`).replace(/require\('\.\.\/lib\/([^']+)'\)/g, (m, a) => `require(${JSON.stringify(path.resolve(ROOT, 'src/lib', a))})`);
  const m = new Module(`b142d-${ref}`); m.paths = module.paths; m._compile(fixed, path.join(ROOT, 'scripts', `.b142d-${ref}.js`));
  return m.exports.buildCoupleSystemBlocks;
}

async function cells() {
  sec('§1 couplePriceState');
  const L = fresh('src/lib/vendor/couplePriceState.js');
  const ps = (q, f = FACTS) => L.priceState({ facts: f, askedText: q, studio: STUDIO });
  T('1.1 a price question naming no package: S1 from rate_min, the founder\'s words', ps('how much do you charge?').sentence === S1);
  T('1.2 her words name a package: S2 with its own total', ps('price for photographs and film?').sentence === S2('Photographs and film', '1,50,000'));
  T('1.3 the longest named package wins ("photographs, film and album")', ps('photographs film and album cost').sentence === S2('Photographs, film and album', '2,20,000'));
  T('1.4 a matched package BELOW rate_min falls to S1 (the founder: sentence 2 only at or above rate_min)', ps('the mini package price').sentence === S1);
  T('1.5 switch off: "off", no sentence', ps('how much?', { ...FACTS, enabled: false }).state === 'off' && ps('how much?', { ...FACTS, enabled: false }).sentence === null);
  T('1.6 rate_min null or 0: "unpriced", no sentence, even with priced packages', ps('how much?', { ...FACTS, rateMin: null }).state === 'unpriced' && ps('how much?', { ...FACTS, rateMin: 0 }).state === 'unpriced');
  T('1.7 the house rupee form (hard rule 11)', L.inr(50000) === '50,000' && L.inr(150000) === '1,50,000' && L.inr(1500000) === '15,00,000' && L.inr(999) === '999');
  T('1.8 figures read in any form (Rs, ₹, lakh, k, rupees)', JSON.stringify(L.figuresIn('Rs 1,50,000 or ₹50000 or 2 lakh or 80k or 3,00,000 rupees')) === JSON.stringify([150000, 50000, 200000, 80000, 300000]));
  T('1.9 the guard lets S1\'s figure go', L.priceGuard({ facts: FACTS, reply: S1, allowed: [50000] }) === null);
  T('1.10 the guard refuses an invented figure', JSON.stringify(L.priceGuard({ facts: FACTS, reply: 'It is around Rs 60,000.', allowed: [50000] })) === JSON.stringify({ refused: [60000] }));
  T('1.11 the guard lets her own budget read back ("3 lakh" -> Rs 3,00,000)', L.priceGuard({ facts: FACTS, reply: 'Noted, your budget of Rs 3,00,000.', allowed: [50000], clientText: 'around 3 lakh' }) === null);
  T('1.12 switch off: the guard does not run', L.priceGuard({ facts: { ...FACTS, enabled: false }, reply: 'Rs 60,000', allowed: [] }) === null);

  sec('§2 the prompt: OFF byte-identical to F-44.230; ON, the rule in the STABLE text');
  const NOW = fresh('src/agent/coupleSystemPrompt.js').buildCoupleSystemBlocks;
  let THEN = null; try { THEN = builderAt('a9f7935'); } catch (_e) { THEN = null; }
  const base = { vendor: V, vendorUser: VU, weddingShape: null, knownBrideName: null };
  let same = 0; let n = 0;
  for (const ret of [false, true]) for (const useEliza of [true, false]) for (const channel of ['instagram', 'whatsapp_shared', 'whatsapp_own']) {
    n += 1; const a = { ...base, isReturningBride: ret, leadName: ret ? 'Sarah' : null, useEliza, channel, conversation: { inConversation: true, priorCount: 3, lastAsked: 'x' } };
    if (THEN) { const o = THEN(a); const p = NOW({ ...a, priceOn: false }); if (o.stable === p.stable && o.thread === p.thread) same += 1; }
  }
  T(`2.1 switch OFF: every lane and branch byte-identical to F-44.230's prompt (${same}/${n})`, !!THEN && same === n);
  const on1 = NOW({ ...base, isReturningBride: false, useEliza: true, channel: 'instagram', conversation: { inConversation: false }, priceOn: true });
  const on2 = NOW({ ...base, isReturningBride: false, useEliza: true, channel: 'instagram', conversation: { inConversation: true, priorCount: 5, lastAsked: 'y' }, knownBrideName: 'Riya', priceOn: true });
  T('2.2 ON: WHEN THEY ASK ABOUT PRICE in the stable text, never in THIS CONVERSATION', /WHEN THEY ASK ABOUT PRICE/.test(on1.stable) && !/price_state/.test(on1.thread));
  T('2.3 ON: the stable text is still ONE text across the thread\'s turns (F-44.230 holds with the switch on)', on1.stable === on2.stable);
  T('2.4 ON: the old refusal rule is replaced ("NEVER state, guess, quote" gone; "never bring price up unasked" present)', !/NEVER state, guess, quote/.test(on1.stable) && /never bring price up unasked/.test(on1.stable));
  const onR = NOW({ ...base, isReturningBride: true, leadName: 'Sarah', useEliza: true, channel: 'whatsapp_shared', conversation: { inConversation: true, priorCount: 3, lastAsked: 'x' }, priceOn: true });
  T('2.5 ON, returning: rule 5 points at price, the price block present', /5\. For a price, follow WHEN THEY ASK ABOUT PRICE below\./.test(onR.stable) && /WHEN THEY ASK ABOUT PRICE\nWhenever they ask/.test(onR.stable));

  sec('§3 the turn');
  let r = await turn({ vendorRow: OFF, script: [{ name: 'respond_to_couple', input: { message: 'ok' } }] });
  const names = (x) => (x.sent[0] ? x.sent[0].tools.map((t) => t.name).join() : '');
  T('3.1 switch OFF: no price_state tool; the tools are today\'s three', names(r) === 'capture_couple_lead,date_state,respond_to_couple');
  r = await turn({ vendorRow: NORATE, script: [{ name: 'respond_to_couple', input: { message: 'ok' } }] });
  T('3.2 switch ON with no rate_min: no price_state tool (today\'s refusal stands)', names(r) === 'capture_couple_lead,date_state,respond_to_couple');
  r = await turn({ vendorRow: ON, script: [{ name: 'price_state', input: { asked_text: 'How much do you charge?' } }, { name: 'respond_to_couple', input: { message: S1 } }] });
  T('3.3 switch ON: price_state offered; its fact carries S1; the reply is S1', names(r) === 'capture_couple_lead,date_state,price_state,respond_to_couple' && r.out.reply === S1 && (r.sent[1] ? JSON.stringify(r.sent[1].messages).includes(S1) : false));
  r = await turn({ vendorRow: ON, inbound: 'price for photographs and film?', script: [{ name: 'price_state', input: { asked_text: 'price for photographs and film?' } }, { name: 'respond_to_couple', input: { message: S2('Photographs and film', '1,50,000') } }] });
  T('3.4 switch ON, a named package: S2 goes out, the guard lets its total through', r.out.reply === S2('Photographs and film', '1,50,000') && !r.out.toolCalls.some((t) => t.name === 'price_guard'));
  r = await turn({ vendorRow: ON, script: [{ name: 'respond_to_couple', input: { message: 'It is roughly Rs 60,000 for a wedding.' } }] });
  T('3.5 switch ON, an invented figure: the guard refuses it and S1 goes instead (the chair: no new line)', r.out.reply === S1 && r.out.toolCalls.some((t) => t.name === 'price_guard' && JSON.stringify(t.refused) === '[60000]'));
  r = await turn({ vendorRow: ON, inbound: 'Our budget is 3 lakh', script: [{ name: 'respond_to_couple', input: { message: 'Got it, a budget of Rs 3,00,000. Who should I say enquired?' } }] });
  T('3.6 switch ON: her own budget read back passes the guard', r.out.reply === 'Got it, a budget of Rs 3,00,000. Who should I say enquired?');
  r = await turn({ vendorRow: OFF, script: [{ name: 'respond_to_couple', input: { message: 'It is roughly Rs 60,000 for a wedding.' } }] });
  T('3.7 switch OFF: the guard does not run (today\'s behaviour, whatever the reply)', r.out.reply === 'It is roughly Rs 60,000 for a wedding.' && !r.out.toolCalls.some((t) => t.name === 'price_guard'));
  r = await turn({ vendorRow: ON, script: [{ name: 'respond_to_couple', input: { message: S1 } }] });
  T('3.8 switch ON: the system the turn sends carries the price rule in block 1 (the stable, cached one)', !!r.sent[0] && /WHEN THEY ASK ABOUT PRICE/.test(r.sent[0].system[0].text) && !!r.sent[0].system[0].cache_control);

  sec('§4 me.js and the migration');
  const me = read('src/api/vendor/me.js');
  T('4.1 GET: price_share_enabled as a consent flag (=== true)', /price_share_enabled:\s+vendor\.price_share_enabled\s+=== true,/.test(me));
  T('4.2 PATCH: in the allowed fields and the boolean fields', /'price_share_enabled', \/\/ CE-46 ELZ-3/.test(me) && /BOOLEAN_FIELDS = \[[^\]]*'price_share_enabled'/.test(me));
  T('4.3 the echo reads it back (=== true), and both selects name it', /price_share_enabled: updated\.price_share_enabled === true/.test(me) && (me.match(/date_check_enabled, price_share_enabled, peer_discoverable/g) || []).length === 2);
  const mig = fs.existsSync(P('db/migrations/0183_price_share.sql')) ? read('db/migrations/0183_price_share.sql') : '';
  T('4.4 0183: one idempotent column, boolean NOT NULL DEFAULT false, one transaction, no table', /ADD COLUMN IF NOT EXISTS price_share_enabled boolean NOT NULL DEFAULT false;/.test(mig) && /^BEGIN;$/m.test(mig) && /^COMMIT;$/m.test(mig) && !/CREATE TABLE/i.test(mig));
}

const MUTATIONS = [
  { n: 'M1 the guard never runs', f: 'src/lib/vendor/couplePriceState.js', from: '    if (!priceOn(facts)) return null;\n    const ok', to: '    return null;\n    const ok', reds: ['1.10', '3.5'] },
  { n: 'M2 S2 allowed below rate_min', f: 'src/lib/vendor/couplePriceState.js', from: 'if (m && m.total >= from) {', to: 'if (m) {', reds: ['1.4'] },
  { n: 'M3 the price tool offered with the switch off', f: 'src/agent/engine.js', from: '  if (priceOn) {\n    COUPLE_TOOLS.splice(', to: '  if (true) {\n    COUPLE_TOOLS.splice(', reds: ['3.1', '3.2'] },
  { n: 'M4 the price rule in the prompt with the switch off', f: 'src/agent/coupleSystemPrompt.js', from: "  const priceBlock = priceOn ? `", to: "  const priceBlock = true ? `", reds: ['2.1'] },
  { n: 'M5 the client\'s own figures not allowed', f: 'src/lib/vendor/couplePriceState.js', from: ', ...figuresIn(clientText)]', to: ']', reds: ['1.11', '3.6'] },
  { n: 'M6 the guard replaces with nothing (a new line) instead of S1', f: 'src/agent/engine.js', from: '      finalReply = s1.sentence;', to: "      finalReply = 'The studio will confirm the price.';", reds: ['3.5'] },
  { n: 'M7 the switch left out of BOOLEAN_FIELDS', f: 'src/api/vendor/me.js', from: "'date_check_enabled', 'price_share_enabled', 'peer_discoverable'", to: "'date_check_enabled', 'peer_discoverable'", reds: ['4.2'] },
];

async function runCells() { pass = 0; fail = 0; failed.length = 0; await cells(); return { pass, fail, failed: failed.slice() }; }
async function main() {
  const base = await runCells();
  console.log(`\nb142d: ${base.pass} pass, ${base.fail} fail${base.fail ? ` (${base.failed.join('; ')})` : ''}`);
  if (base.fail) process.exit(1);
  if (!process.argv.includes('--mutate')) { console.log('\n§5 mutations: run with --mutate (production files are edited and restored by sha256)'); return; }
  sec('§5 mutations (each must redden its named cells; files restored by sha256)');
  let mFail = 0;
  for (const m of MUTATIONS) {
    const src = read(m.f); const before = sha(src);
    if (!src.includes(m.from)) { console.log(`  FAIL  ${m.n}: anchor not found`); mFail += 1; continue; }
    fs.writeFileSync(P(m.f), src.replace(m.from, m.to));
    let r; try { const o = console.log; console.log = () => {}; try { r = await runCells(); } finally { console.log = o; } } catch (e) { r = { failed: [`threw: ${e && e.message}`] }; }
    fs.writeFileSync(P(m.f), src);
    const restored = sha(read(m.f)) === before;
    const hit = m.reds.every((c) => r.failed.some((x) => x.startsWith(`${c} `)));
    if (!(hit && restored)) mFail += 1;
    console.log(`  ${hit && restored ? 'PASS' : 'FAIL'}  ${m.n} → red ${JSON.stringify(m.reds)} ${hit ? 'hit' : `MISSED (red: ${r.failed.join('; ') || 'none'})`}; ${restored ? 'restored by sha' : 'NOT RESTORED'}`);
  }
  console.log(`\nb142d --mutate: ${MUTATIONS.length - mFail}/${MUTATIONS.length} mutations reddened their cells`);
  if (mFail) process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(2); });
