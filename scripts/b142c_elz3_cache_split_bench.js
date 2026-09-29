'use strict';
// scripts/b142c_elz3_cache_split_bench.js · TDW CE-46 · ELZ-3 · F-44.230 · THE PROMPT CACHE SPLIT (rung b142c, the b142 package).
// The chair's ruling of 29 September 2026: ELZ-2's one cached system block carried per-thread facts and so was written every turn and never
// read (the founder's Instagram walk, 29 Sept: cache_creation ~5,100, cache_read 0 on every turn's first call). The first-contact /
// in-conversation system is now TWO texts: the per-vendor STABLE text, cached at its end, identical for every thread of one vendor on one
// channel and lane; then THIS CONVERSATION (the per-thread facts, this client's list, and FOR THIS CLIENT: the opening, the name and the
// greeting example chosen by the facts, so R-45.26(2) holds: she is handed only the branch that fits). The returning branch is one text.
//   §1 the stable text is ONE text across a thread's turns and facts, on every channel and both prompt lanes
//   §2 no per-thread fact lives in the stable text; every one of them lives in THIS CONVERSATION
//   §3 R-45.26(2): the in-conversation system holds no first-message greeting; the shape question asked is off her list; a known name is not asked
//   §4 the rules are today's: every line of the prompt at 91babd0 is present after the split but the numbered pointers that now point
//      at THIS CLIENT'S LIST and FOR THIS CLIENT (the list below, exactly)
//   §5 the turn (REAL runCoupleAgenticTurn, doubles for the model and the store) sends two blocks with the breakpoint on block 1 only; a
//      returning client's turn sends one
//   §6 the probe m230: bare exit 0 and its "one text" line; --dry reads SPLIT PROVEN (cache_read after the first call) over the stub
//   §7 mutations of production code (--mutate), each reddening its named cell; files restored by sha256
// Run: node scripts/b142c_elz3_cache_split_bench.js [--mutate]
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

const V = { id: 'v-dev440', business_name: 'Dev Roy Photography', category: 'Photographer', city: 'Delhi', open_to_travel: true };
const VU = { name: 'Dev Roy', phone: '+910000000000' };
const FIRST = { conversation: { inConversation: false, priorCount: 0 } };
const INCONV = { conversation: { inConversation: true, priorCount: 6, since: '29 Sep', lastAsked: 'Is it one day, or spread across functions like mehendi, sangeet and reception?', shapeAsked: true, shapeAskedOn: '29 Sep' }, knownBrideName: 'Riya', weddingShape: { functions: 'haldi and wedding', wedding_date: '2027-03-25' } };
const shellOf = () => { delete require.cache[require.resolve(P('src/agent/coupleSystemPrompt.js'))]; return require(P('src/agent/coupleSystemPrompt.js')); };
const blocks = (o) => { const S = shellOf(); return typeof S.buildCoupleSystemBlocks === 'function' ? S.buildCoupleSystemBlocks(o) : { stable: S.buildCoupleSystemPrompt(o), thread: '' }; };
const args = (channel, useEliza, extra) => ({ vendor: V, vendorUser: VU, isReturningBride: false, leadName: null, weddingShape: null, knownBrideName: null, useEliza, channel, enquireLink: 'https://wa.me/910000000000', chattedBefore: true, ...extra });

// the prompt at 91babd0, loaded beside the current one (its relative requires resolved to this tree)
function oldBuilder() {
  const old = cp.execSync('git show 91babd0:src/agent/coupleSystemPrompt.js', { cwd: ROOT }).toString();
  const fixed = old.replace(/require\('\.\/([^']+)'\)/g, (m, a) => `require(${JSON.stringify(path.resolve(ROOT, 'src/agent', a))})`).replace(/require\('\.\.\/lib\/([^']+)'\)/g, (m, a) => `require(${JSON.stringify(path.resolve(ROOT, 'src/lib', a))})`);
  const m = new Module('b142c-old'); m.paths = module.paths; m._compile(fixed, path.join(ROOT, 'scripts', '.b142c-old.js'));
  return m.exports.buildCoupleSystemPrompt;
}
const EXPECTED_CHANGED = {
  first: ['2. Then, one per turn:', '4. Then their NAME ("And who should I say enquired?").', '1. Their FIRST message. If they opened with a question or a specific need, ANSWER IT first, then add your first question in the same message. If they opened with a bare greeting, greet them once as the studio and ask the first question in ONE line: "Hi! You\'ve reached Dev Roy Photography. What\'s the occasion, and when is it?"', '3. Ask the budget plainly, then their name.'],
  inconv: ['2. Then, one per turn:', '1. They are already in conversation: no greeting, no introduction. Answer what they wrote, then ask the next thing on the list that they have not answered, if it fits.', '3. Ask the budget plainly (you already know their name; do NOT ask it).'],
};

// ── the turn's doubles (b142's shapes): the model and the store ──
const llmPath = require.resolve(P('src/lib/llm.js'));
const realLlm = require(llmPath);
const SENT = [];
require.cache[llmPath].exports = { ...realLlm, llmCreate: async (provider, params) => { SENT.push(JSON.parse(JSON.stringify(params))); return { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't1', name: 'respond_to_couple', input: { message: 'ok' } }], usage: { input_tokens: 1, output_tokens: 1 } }; } };
const occPath = require.resolve(P('src/lib/vendor/occupancy.js')); const realOcc = require(occPath);
require.cache[occPath].exports = { ...realOcc, describeDate: async () => ({ verdict: 'free' }) };
const intentPath = require.resolve(P('src/lib/intentExtractor.js')); const realIntent = require(intentPath);
require.cache[intentPath].exports = { ...realIntent, getReturningBrideIntent: async () => null };
function store({ lead = null, rows = [] } = {}) {
  return { from(table) { const q = { eqs: {} }; const api = {
    select: () => api, eq: (c, v) => { q.eqs[c] = v; return api; }, gte: () => api, order: () => api, in: () => api, is: () => api, update: () => api,
    insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'lead-new' } }) }), then: (r) => r({ error: null }) }),
    limit(n) { const p = api._limit(n); p.maybeSingle = () => api.maybeSingle(); return p; },
    async _limit() { return { data: table === 'messages' ? rows.map((r) => ({ ...r })) : [] }; },
    async maybeSingle() {
      if (table === 'leads') return { data: lead };
      if (table === 'vendors') return { data: { status: 'active', discover_paused: false, date_check_enabled: true } };
      if (table === 'admin_config') return { data: q.eqs.key === 'couple.eliza_enabled' ? { value: 'true' } : null };
      if (table === 'conversations') return { data: q.eqs.kind === 'vendor_self' ? { id: 'vs-1' } : null };
      return { data: null };
    } }; return api; } };
}
const MINE = ['src/agent/engine.js', 'src/agent/coupleSystemPrompt.js', 'src/agent/coupleThreadFacts.js', 'src/agent/studioName.js', 'src/lib/vendor/coupleDateState.js', 'src/lib/laneFlags.js'];
const engine = () => { for (const r of MINE) delete require.cache[require.resolve(P(r))]; return require(P('src/agent/engine.js')); };
async function turn({ lead = null, rows, inbound = 'Hi', counterparty = { channel: 'instagram', phone: null, igsid: 'igs-1' } }) {
  SENT.length = 0;
  await engine().runCoupleAgenticTurn({ vendor: V, vendorUser: VU, conversation: { id: 'c1' }, couplePhone: null, coupleId: null, inboundMessage: inbound, supabase: store({ lead, rows: rows || [{ direction: 'inbound', body: inbound, sent_by: 'couple', created_at: new Date().toISOString() }] }), anthropic: null, counterparty });
  return SENT[0] ? SENT[0].system : null;
}

async function cells() {
  sec('§1 the stable text is ONE text across a thread\'s turns and facts');
  for (const channel of ['instagram', 'whatsapp_shared', 'whatsapp_own']) for (const useEliza of [true, false]) {
    const a = blocks(args(channel, useEliza, FIRST)); const b = blocks(args(channel, useEliza, INCONV));
    T(`1.${channel}.${useEliza ? 'eliza' : 'legacy'} first message and in conversation share one stable text`, typeof a.stable === 'string' && a.stable.length > 1000 && a.stable === b.stable && !!a.thread && !!b.thread);
  }
  const x = blocks(args('instagram', true, { conversation: { inConversation: true, priorCount: 40, since: '1 Sep', lastAsked: 'x' }, knownBrideName: 'Someone Else' }));
  T('1.b a different client of the same vendor (40 messages, another name) shares it too (the per-vendor cache)', x.stable === blocks(args('instagram', true, FIRST)).stable);

  sec('§2 no per-thread fact in the stable text; every one in THIS CONVERSATION');
  const b = blocks(args('whatsapp_own', true, INCONV)); const a = blocks(args('whatsapp_own', true, { ...FIRST }));
  const facts = ['6 earlier messages', 'since 29 Sep', 'Is it one day, or spread across functions like mehendi, sangeet and reception?', 'ALREADY ASKED on 29 Sep', 'YOU ALREADY KNOW THEIR NAME: Riya', 'haldi and wedding', 'They are already in conversation, so the date answer stands on its own'];
  T('2.1 none of the in-conversation facts is in the stable text', facts.every((f) => !b.stable.includes(f)));
  T('2.2 every one of them is in THIS CONVERSATION', facts.every((f) => b.thread.includes(f)));
  T('2.3 the chatted-before line (own number, first message) rides THIS CONVERSATION, not the stable text', a.thread.includes('HAS WRITTEN TO DEV ROY PHOTOGRAPHY ON THIS NUMBER BEFORE') && !a.stable.includes('ON THIS NUMBER BEFORE'));
  T('2.4 the stable text names none of Riya, the priors or the date clause on ANY lane', ['instagram', 'whatsapp_shared', 'whatsapp_own'].every((c) => !/Riya|6 earlier messages|stands on its own/.test(blocks(args(c, true, INCONV)).stable)));

  sec('§3 R-45.26(2): she is handed only the branch that fits');
  const joined = (o) => { const t = blocks(o); return `${t.stable}\n\n${t.thread}`; };
  const ic = joined(args('instagram', true, INCONV)); const fc = joined(args('instagram', true, FIRST));
  T('3.1 in conversation: no first-message greeting, no FIRST MESSAGE header, no first-message opening', !ic.includes('Good (first message)') && !/THIS IS THE CLIENT'S FIRST MESSAGE/.test(ic) && !/Their FIRST message/.test(ic));
  T('3.2 first message: the first-message opening and greeting, no in-conversation opening', fc.includes('Good (first message): "Hi! You\'ve reached Dev Roy Photography.') && /Their FIRST message/.test(fc) && !fc.includes('Good (a bare hi, in conversation)'));
  T('3.3 the shape question asked is OFF her list (ALREADY ASKED), as before the split', !/1\. is it one day, or spread across functions/.test(blocks(args('instagram', true, INCONV)).thread) && /ALREADY ASKED/.test(ic));
  T('3.4 a known name is not asked; an unknown one is asked last', /Their name: you already know it \(Riya\); do NOT ask it\./.test(ic) && /Their name: ask it last: "And who should I say enquired\?"/.test(fc));

  sec('§4 the rules are today\'s (every line of the prompt at 91babd0 is present but the pointers listed)');
  let OLD = null; try { OLD = oldBuilder(); } catch (e) { OLD = null; }
  for (const [label, o] of [['first', FIRST], ['inconv', INCONV]]) {
    const A = OLD ? OLD(args('instagram', true, o)) : ''; const Bset = new Set(joined(args('instagram', true, o)).split('\n').map((l) => l.trim()));
    const missing = A.split('\n').map((l) => l.trim()).filter((l) => l && !Bset.has(l));
    T(`4.${label} only the numbered pointers changed (${missing.length} lines, the listed ones exactly)`, !!OLD && JSON.stringify(missing) === JSON.stringify(EXPECTED_CHANGED[label]));
  }

  sec('§5 the turn sends two blocks, the breakpoint on block 1 only; a returning client one block');
  let sys = await turn({ inbound: 'Hi, are you free on 25 March 2027?' });
  T('5.1 first message: two text blocks, cache_control on block 1 only', Array.isArray(sys) && sys.length === 2 && !!sys[0].cache_control && !sys[1].cache_control && /^THIS CONVERSATION\n/.test(sys[1].text));
  const now = Date.now();
  const rows = [{ direction: 'inbound', body: 'Single day', sent_by: 'couple', created_at: new Date(now).toISOString() }, { direction: 'outbound', body: 'Is it one day, or spread across functions like mehendi, sangeet and reception?', sent_by: 'agent', created_at: new Date(now - 60000).toISOString() }, { direction: 'inbound', body: 'Hi', sent_by: 'couple', created_at: new Date(now - 120000).toISOString() }];
  const sys2 = await turn({ inbound: 'Single day', rows });
  T('5.2 the thread\'s second turn sends the SAME block 1, byte for byte (the read)', Array.isArray(sys2) && sys2.length === 2 && sys2[0].text === sys[0].text && sys2[1].text !== sys[1].text);
  const sys3 = await turn({ inbound: 'hi', lead: { id: 'l1', name: 'Sarah', counterparty_ig_id: 'igs-1' } });
  T('5.3 a returning client: one block, cached', Array.isArray(sys3) && sys3.length === 1 && !!sys3[0].cache_control);

  sec('§6 the probe m230');
  const bare = cp.spawnSync(process.execPath, [P('scripts/m230_cache_split_probe.js')], { encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: '' } });
  T('6.1 bare: exit 0, no model, and "the stable text is ONE text ... yes"', bare.status === 0 && /ONE text across a thread's turns and facts \(Instagram\): yes/.test(bare.stdout));
  const dry = cp.spawnSync(process.execPath, [P('scripts/m230_cache_split_probe.js'), '--dry'], { encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: '' } });
  const rec = (dry.stdout.match(/record: (\S+\.jsonl)/) || [])[1];
  T('6.2 --dry over the stub: SPLIT PROVEN, its record fresh under scripts/out/ (removed after)', dry.status === 0 && /SPLIT PROVEN/.test(dry.stdout) && !!rec && fs.existsSync(rec));
  if (rec && fs.existsSync(rec)) fs.unlinkSync(rec);
  const nokey = cp.spawnSync(process.execPath, [P('scripts/m230_cache_split_probe.js'), '--live'], { encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: '' } });
  T('6.3 --live with no --budget is REFUSED before any call (A-45.15)', nokey.status === 2 && /REFUSED: --live needs --budget/.test(nokey.stdout));
}

const MUTATIONS = [
  { n: 'M1 the breakpoint back on the whole system (one block)', f: 'src/agent/engine.js', from: "? [{ type: 'text', text: systemParts.stable, cache_control: { type: 'ephemeral' } }, { type: 'text', text: systemParts.thread }]", to: "? [{ type: 'text', text: `${systemParts.stable}\\n\\n${systemParts.thread}`, cache_control: { type: 'ephemeral' } }]", reds: ['5.1', '5.2'] },
  { n: 'M2 the breakpoint on THIS CONVERSATION', f: 'src/agent/engine.js', from: "? [{ type: 'text', text: systemParts.stable, cache_control: { type: 'ephemeral' } }, { type: 'text', text: systemParts.thread }]", to: "? [{ type: 'text', text: systemParts.stable }, { type: 'text', text: systemParts.thread, cache_control: { type: 'ephemeral' } }]", reds: ['5.1'] },
  { n: 'M3 FACT 1 back in the stable text', f: 'src/agent/coupleSystemPrompt.js', from: "  const stable = `${header}\n\n${voiceBlock}\n${linkBlock}\n\nWHO YOU ARE WHEN THEY ARRIVE", to: "  const stable = `${header}\n\n${voiceBlock}\n${linkBlock}\n${conversationBlock}\n\nWHO YOU ARE WHEN THEY ARRIVE", reds: ['1.instagram.eliza', '2.1', '2.4'] },
  { n: 'M4 both openings in the stable text (R-45.26(2) broken)', f: 'src/agent/coupleSystemPrompt.js', from: '1. Open as FOR THIS CLIENT at the end says.\n', to: '1. Open as FOR THIS CLIENT at the end says. Good (first message): greet them once.\n', reds: ['3.1'] },
  { n: 'M5 the date clause left in the stable text', f: 'src/agent/coupleSystemPrompt.js', from: "The date is the studio's; you are getting it to them.`;\n", to: "The date is the studio's; you are getting it to them.${inConversation ? ' They are already in conversation, so the date answer stands on its own.' : ''}`;\n", reds: ['1.instagram.eliza', '2.1'] },
  { n: 'M6 the shape question left on her list', f: 'src/agent/coupleSystemPrompt.js', from: "  const weddingList = shapeAsked ? (Array.isArray(a.wedding) ? a.wedding : []).filter((item) => !SHAPE_ITEM.test(item)) : a.wedding;", to: '  const weddingList = a.wedding;', reds: ['3.3'] },
];

async function runCells() { pass = 0; fail = 0; failed.length = 0; await cells(); return { pass, fail, failed: failed.slice() }; }
async function main() {
  const base = await runCells();
  console.log(`\nb142c: ${base.pass} pass, ${base.fail} fail${base.fail ? ` (${base.failed.join('; ')})` : ''}`);
  if (base.fail) process.exit(1);
  if (!process.argv.includes('--mutate')) { console.log('\n§7 mutations: run with --mutate (production files are edited and restored by sha256)'); return; }
  sec('§7 mutations (each must redden its named cells; files restored by sha256)');
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
  console.log(`\nb142c --mutate: ${MUTATIONS.length - mFail}/${MUTATIONS.length} mutations reddened their cells`);
  if (mFail) process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(2); });
