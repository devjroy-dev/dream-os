'use strict';
// scripts/b110_lcv15_lsp1_bench.js · CE-45 LCV-15 · LC-Victor, the last server packet · LSP_1
//
// WHAT THIS RUNG PINS (the chair's list for cut 1, 24 September 2026):
//   §1  the WhatsApp lane never reaches runTurn: none in its source, none when driven (the REAL processVendorInbound)
//   §2  standIn never returns null, on any input, fuzzed in every argument position; every answer is the door's
//   §3  no reader of `vendor.working_chain_enabled` anywhere in src (Q6: the switch is retired)
//   §4  the deleted paths are absent (A-45.1: the rung pins each deletion)
//   §5  the money functions are byte-identical to 89e3a6e (hashes pinned from that commit's blob, C-44.7)
//   §6  the wiring that fed only the chain is gone (index.js deps, vendorInbound's destructure, chat.js's three exports)
//   §7  W-1 NONE, from this packet's own manifest
//   §8  mutations of production code, each reddening its cell
// It reads no clock: no cell names a day, so C-44.13's shifted clocks have nothing to shift (stated, not skipped).
//
// Run: node scripts/b110_lcv15_lsp1_bench.js      (from any cwd)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const src = (rel) => fs.readFileSync(P(rel), 'utf8');
const code = (t) => String(t).split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
const sha = (t) => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

let pass = 0; let fail = 0; const failed = [];
function T(name, cond) { if (cond) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}`); } }
const sec = (t) => console.log(`\n${t}`);
const quiet = async (fn) => { const w = console.warn, e = console.error, l = console.log; console.warn = () => {}; console.error = () => {}; console.log = () => {}; try { return await fn(); } finally { console.warn = w; console.error = e; console.log = l; } };

const KEY = 'vendor.working_chain_enabled';
const VI = 'src/lib/vendorInbound.js';
const WD = 'src/lib/vendor/workingDoor.js';
const CJ = 'src/api/vendor-engine/chat.js';
const MAN = 'scripts/floor-manifest-lcv15-lsp1.txt';

// A module compiled from given source text at a real path, so its relative requires resolve as production's do.
function compileAt(rel, text) {
  const file = P(rel);
  const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
  m._compile(text, file); return m.exports;
}

// ── the WhatsApp lane, driven: a deterministic double, the REAL core, runTurn SPIED in the deps bag ─────────────
function makeSupabase() {
  const row = { users: { id: 'u1', phone: '919812300077', role: 'vendor', vendor_id: 'v1' },
    vendors: { id: 'v1', business_name: 'V', onboarding_state: 'complete', tier: 'signature', category: 'photography' },
    conversations: { id: 'c1', vendor_id: 'v1', kind: 'vendor_self' } };
  const builder = (table) => {
    const b = {};
    for (const m of ['select', 'eq', 'neq', 'is', 'in', 'order', 'limit', 'gte', 'lte', 'not', 'or', 'filter', 'match', 'ilike', 'contains']) b[m] = () => b;
    b.insert = () => b; b.update = () => b; b.upsert = () => b; b.delete = () => b;
    b.single = async () => ({ data: row[table] ? { ...row[table] } : null, error: null });
    b.maybeSingle = async () => ({ data: row[table] ? { ...row[table] } : null, error: null });
    b.then = (res) => res({ data: row[table] ? [{ ...row[table] }] : [], error: null });
    return b;
  };
  return { from: builder, schema: () => ({ from: builder }), rpc: async () => ({ data: null, error: null }) };
}
function makeDeps(sends, spy) {
  const noop = async () => ({});
  return {
    supabase: makeSupabase(), anthropic: {},
    sendWhatsApp: async (phone, text, media) => { sends.push({ phone, text, media: media || [] }); return { sid: 'X' }; },
    webhookCore: require(P('src/lib/webhookCore.js')),
    runTurn: async () => { spy.n += 1; return { reply: 'ENGINE REPLY', tool_calls: [] }; }, // SPIED: must never run
    runCoupleAgenticTurn: async () => ({ reply: '', tool_calls: [] }),
    resolveAgentForVendor: async () => 'ag1',
    buildLlmForTurn: async () => ({ tierOverride: null, modelOverride: null, transport: null, donnaTransport: null, donnaModelOverride: null, route: {} }),
    generateInvoiceForBinder: noop, enquiryToBinder: noop, ensureCoupleRow: async () => ({ id: 'cpl1' }), captureField: noop,
    buildDisambiguationQuestion: () => '', interpretDisambiguationReply: () => ({}), vendorDisplayName: () => 'V',
    matchModeWord: () => null, applyModeFlip: async () => ({}), MODE_FLIP_LINES: {},
    matchFreshWord: () => false, FRESH_THREAD_LINE: '', abandonActiveThread: async () => ({ ok: true }),
    checkImageThrottle: async () => ({ allowed: true }), markRejectionSent: async () => {}, extractCalendarFromImage: async () => ({}),
  };
}
let seq = 0;
async function driveWA(text, lane) {
  const sends = []; const spy = { n: 0 };
  const { processVendorInbound, metaInputsFrom } = lane;
  const inputs = metaInputsFrom({ from: '919812300077', text, messageId: `wamid.b110.${++seq}`, type: 'text', media: [] }, { entry: [] });
  await quiet(() => processVendorInbound(inputs, makeDeps(sends, spy)));
  return { sends, turns: spy.n };
}

(async () => {
  const DL = require(P('src/lib/vendor/doorLines.js'));
  const GLITCH = require(P(CJ)).STAGE2_LINE_MUTATION;
  const doorOwned = (t) => typeof t === 'string' && t.length > 0 && (Object.values(DL.LINES).includes(t) || t.split('\n')[0] === DL.LINES.LEFTOVER || t === GLITCH);

  // §1
  sec('1 the WhatsApp lane never reaches runTurn');
  const viCode = code(src(VI));
  T('1.1 vendorInbound.js holds no runTurn call and names no runTurn in its deps (comments aside)', !/\brunTurn\b/.test(viCode));
  const lane = require(P(VI));
  const texts = ['what did I book this week', 'hello', 'yes', 'Block 3 March 2028', 'Add a new lead Walk NC Phone 9876543210', 'x'];
  let allOk = true; const bad = [];
  for (const t of texts) {
    const w = await driveWA(t, lane);
    if (!(w.turns === 0 && w.sends.length === 1 && doorOwned(w.sends[0].text) && !/ENGINE REPLY/.test(w.sends[0].text))) { allOk = false; bad.push(`${t} → ${w.turns}/${w.sends.length}/${JSON.stringify(w.sends.map((s) => s.text))}`); }
  }
  T(`1.2 driven over ${texts.length} messages: runTurn is called ZERO times and ONE door-owned line is sent each time${bad.length ? `  RED ON ${bad.join(' | ')}` : ''}`, allOk);

  // §2
  sec('2 standIn never returns null, on any input');
  const W = require(P(WD));
  const HOST = [undefined, null, 0, -1, NaN, '', 'x', true, false, [], [null], {}, { door: false }, { door: 'true' }, { door: false, why: 'uncovered', ear: { request: { acts: [{ act: 'block_date' }] } } },
    { door: false, why: 'empty' }, { door: false, why: 'no_request', ear: { error: 'x' } }, { door: true, reply: 'r', keys: ['B3'] }, Symbol('s'), () => {}, new Proxy({}, { get() { throw new Error('hostile'); } })];
  const ARGS = [undefined, null, 0, 'x', [], {}, { supabase: null }, { supabase: makeSupabase() }, new Proxy({}, { get() { throw new Error('hostile'); } })];
  const DEPS = [undefined, null, 0, 'x', [], {}, { readLaneFlag: async () => true }, { readLaneFlag: async () => { throw new Error('x'); } }, { nowMs: NaN }, { rand: () => 0.5 },
    new Proxy({}, { get() { throw new Error('hostile'); } })];
  let calls = 0, nulls = 0, throws = 0, notDoor = 0;
  for (const out of HOST) for (const a of ARGS) for (const d of DEPS) {
    calls += 1;
    let r;
    try {
      const args = (a && typeof a === 'object' && !Array.isArray(a)) ? (() => { try { return { ...a, out }; } catch (_e) { return a; } })() : a;
      r = await quiet(() => W.standIn(args, d));
    } catch (_e) { throws += 1; continue; }
    if (r === null || r === undefined) { nulls += 1; continue; }
    if (!(r.door === true && typeof r.reply === 'string' && r.reply.length > 0)) notDoor += 1;
  }
  T(`2.1 ${calls} fuzzed calls of standIn (hostile values in the verdict, the args and the deps): ZERO nulls`, nulls === 0 && calls === HOST.length * ARGS.length * DEPS.length);
  T('2.2 ZERO throws', throws === 0);
  T('2.3 every answer is the door\'s: door true and a non-empty line', notDoor === 0);
  T('2.4 a deps bag holding readLaneFlag → true (the switch\'s old ON) still gets the door\'s answer', await (async () => { const r = await quiet(() => W.standIn({ supabase: makeSupabase(), out: { door: false, why: 'empty' } }, { readLaneFlag: async () => true })); return !!r && r.door === true; })());

  // §3
  sec('3 no reader of the retired switch');
  const { execSync } = require('child_process');
  const hits = execSync(`grep -rln --include=*.js --include=*.ts "${KEY}" src || true`, { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const live = hits.filter((f) => src(f).split('\n').some((l) => l.includes(KEY) && !/^\s*(\/\/|\*)/.test(l)));
  T('3.1 no file under src names the key outside a comment', live.length === 0);
  T('3.2 CONTROL: the grep itself finds the key where comments name it (an empty answer is not a broken grep, C-44.4)', hits.length > 0);
  const LF = require(P('src/lib/laneFlags.js'));
  T('3.3 the key is absent from the LANE_FLAGS census', !(KEY in LF.LANE_FLAGS));
  // RE-AIMED (CE-45 ASK-1 cut 1, labelled; F-E ruled): the door reads ONE lane flag family, the question agent's two keys (ASK_FLAGS), in ONE
  // place (askContext) and never the retired chain key; the cell keeps its claim (no CHAIN_FLAG, no chain key read) and pins the one new read.
  T('3.4 workingDoor.js exports no CHAIN_FLAG and reads no lane flag but ASK_FLAGS, once, in askContext', !('CHAIN_FLAG' in W) && (code(src(WD)).match(/readLaneFlag/g) || []).length === 1 && /async function askContext[\s\S]{0,400}readLaneFlag\(supabase, flag\)/.test(code(src(WD))) && JSON.stringify(W.ASK_FLAGS) === JSON.stringify({ pwa: 'vendor.ask_agent.pwa', whatsapp: 'vendor.ask_agent.whatsapp' }) && !code(src(WD)).includes(KEY));

  // §4
  sec('4 the deleted paths are absent (A-45.1)');
  const GONE = ['src/lib/vendor/calendarSignals.js', 'src/lib/vendor/leadPings.js', 'src/lib/vendor/introductionSeat.js',
    'scripts/b0498_wa_assign_punct_bench.js', 'scripts/b5_wa_door_bench.js', 'scripts/b5_wa_door_smoke.js', 'scripts/b05_f0550_ping_drain_bench.js'];
  for (const g of GONE) T(`4.1 absent: ${g}`, !fs.existsSync(P(g)));
  const requirers = execSync('grep -rlnE --include=*.js --include=*.ts "vendor/(calendarSignals|leadPings|introductionSeat)" src || true', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)
    .filter((f) => src(f).split('\n').some((l) => /require\(|from '/.test(l) && /calendarSignals|leadPings|introductionSeat/.test(l) && !/^\s*(\/\/|\*)/.test(l)));
  T('4.2 nothing under src requires any of the three deleted modules', requirers.length === 0);
  T('4.3 floor-base.txt no longer names the retired b05_f0550 bench', !/b05_f0550_ping_drain_bench/.test(src('scripts/floor-base.txt')));
  T('4.4 floor-base.txt no longer names b05_f0555: its base red (6.2, "W-1 BREACH: harveySoul", from comments in the deleted chain tail) died with LSP_1, and its 7.1 is re-aimed at the door', !/b05_f0555_media_dedupe_bench/.test(src('scripts/floor-base.txt')));

  // §5
  sec('5 the money functions, byte-identical to 89e3a6e (C-44.7: hashes pinned from that commit)');
  const PIN = { planMoney: '2a7a1c76bf2efeabec03301805e5d5d2bdb38b310940284935496dad8b7f7efb', planPayment: 'cddb6c299afe946ddfddf89cebb3a815c13db38cbd17c863a2b23a677244483e',
    planBooking: '086fbb9debf6a62fa52a8306037adef47cc1ece4e2ce2efd7e2c684a27e6a3fa', applyRow: '01f76e676659e01c3f0dd92b560726fcde136a8be4bcf3a12adf120cc7fc1b4b',
    reread: 'e200a0f720c62637ea617ccacb508c9b7a0b58f49e7848323c5eff5a7bcdc8fc' };
  const body = (t, name) => { const i = t.search(new RegExp(`^(async )?function ${name}\\b`, 'm')); if (i < 0) return ''; let d = 0, st = false; for (let j = t.indexOf('{', i); j < t.length; j += 1) { if (t[j] === '{') { d += 1; st = true; } else if (t[j] === '}') { d -= 1; if (st && d === 0) return t.slice(i, j + 1); } } return ''; };
  const wdText = src(WD);
  for (const [f, h] of Object.entries(PIN)) T(`5.1 ${f} is byte-identical to 89e3a6e`, sha(body(wdText, f)) === h);
  T('5.2 pendingMoneyActs.js is byte-identical to 89e3a6e', sha(src('src/lib/vendor/pendingMoneyActs.js')) === 'f3d63806f6dc149f0ba32c7f83a33387823ae5d72501b1cf496c31395e9dd9ab');

  // §6
  sec('6 the wiring that fed only the chain is gone');
  const idx = code(src('src/index.js'));
  const depsBlock = (idx.match(/const vendorInboundDeps = \{([\s\S]*?)\};/) || ['', ''])[1];
  T('6.1 index.js hands the lane none of the chain\'s five seams', !/\b(runTurn|fetchCalendarSnapshot|fetchScratchpad|fetchLeadPings|applyCalendarSignals)\b/.test(depsBlock) && depsBlock.length > 100);
  T('6.2 index.js requires neither the engine loop nor the two deleted modules', !/engine\/dist\/core\/loop|calendarSignals|leadPings/.test(idx));
  const CJX = require(P(CJ));
  T('6.3 chat.js exports none of CONFIRM_SHAPE_RE, imperativeMiss, recordImperativeRetry, ownerImperative, matchingHands, IMPERATIVE_STEMS', ['CONFIRM_SHAPE_RE', 'imperativeMiss', 'recordImperativeRetry', 'ownerImperative', 'matchingHands', 'IMPERATIVE_STEMS'].every((k) => !(k in CJX)));
  const cjCode = code(src(CJ));
  T('6.4 chat.js holds no listenAfterWire and no req._lcvEar', !/listenAfterWire|_lcvEar/.test(cjCode));
  T('6.5 the Advisor room keeps its engine path: chat.js still calls runTurn twice, behind doorTurn\'s advisor return', (cjCode.match(/await runTurn\(/g) || []).length === 2 && /async function doorTurn\(req, llmWiring, message, roomAssert\) \{\n\s*if \(roomAssert === 'advisor'\) return null;/.test(cjCode));

  // §7
  sec('7 W-1 NONE, from this packet\'s own manifest (C-44.7)');
  const man = src(MAN).split('\n').map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean);
  T('7.1 the manifest names no path under src/engine, no soul, lens or prompt file, no migration', man.length > 0 && man.every((p) => !/^src\/engine\/|soul|lens|systemPrompt|^db\/migrations\//.test(p)));
  T('7.2 the untouched list stays out of the manifest (couple lane, listenerDoor, draftSeat, lifecycle hands, eventWrite, availability, paymentReminders, invoices, pendingMoneyActs)',
    !man.some((p) => /src\/api\/couple\/|listenerDoor|draftSeat|lifecycleHands|eventWrite|availability|paymentReminders|invoices\.js|pendingMoneyActs/.test(p)));
  T('7.3 every deletion this rung pins is declared in the manifest', GONE.every((g) => man.includes(g)));

  // §8
  sec('8 mutations of production code, each reddening its cell');
  {
    const t = src(WD);
    const anchor = '    if (out && out.door === true) return out;';
    T('8.1 the standIn anchor is present', t.includes(anchor));
    const M = compileAt(WD, t.replace(anchor, `${anchor}\n    if (deps.readLaneFlag) return null;`));
    const r = await quiet(() => M.standIn({ supabase: makeSupabase(), out: { door: false, why: 'empty' } }, { readLaneFlag: async () => true }));
    T('8.2 M1 a standIn that returns null again for a flag reader reddens 2.4', r === null);
  }
  {
    const t = src(VI);
    const anchor = "      return;\n    }\n    // CE-45 LCV-15 LSP_1: the chain's tail";
    T('8.3 the WhatsApp door-return anchor is present', t.includes(anchor));
    const M = compileAt(VI, t.replace(anchor, "      await deps.runTurn({});\n      return;\n    }\n    // CE-45 LCV-15 LSP_1: the chain's tail"));
    const w = await driveWA('hello', M);
    T('8.4 M2 a WhatsApp lane that calls runTurn again reddens 1.2', w.turns === 1);
  }
  {
    const lfPath = P('src/lib/laneFlags.js');
    const t = fs.readFileSync(lfPath, 'utf8');
    const anchor = "  'onboarding.gate_enabled': false,\n";
    T('8.5 the census anchor is present', t.includes(anchor));
    const M = compileAt('src/lib/laneFlags.js', t.replace(anchor, `${anchor}  '${KEY}': false,\n`));
    T('8.6 M3 the key restored to the census reddens 3.3', KEY in M.LANE_FLAGS);
  }

  console.log(`\nb110_lcv15_lsp1_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`   ${f}`)); }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH THREW (unexpected):', e && e.stack || e); process.exit(2); });
