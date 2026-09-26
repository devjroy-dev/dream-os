#!/usr/bin/env node
// # repo: dream-os · CE-45 · LCV-16 · LSP_5 · RUNG b116 · base eb3fe0a
// THE LAST SERVER PACKET'S LAST CUT, PINNED. L5-a: a runTurn that is neither advisor nor consult throws
// ENGINE_BUSINESS_ROOM_RETIRED before any read or write. L5-b/L5-c/K6: the business room's reads, blocks, tools and
// Donna's whole turn are gone; donna.ts keeps rebuildSnapshot and patchNote for its four live requirers. L5-d: chat.js's
// advisor path reads no estate facts. §7: fullStop.js's first-token matcher is gone, matchOptOutExact kept. The advisor
// room and consult are DRIVEN through the real compiled runTurn (doubles for the store and the model). Absence cells read
// comment-stripped code and each carries a control that finds a present name the same way (C-44.4). The money functions
// and server.ts are pinned by hash from eb3fe0a (C-44.7). Two mutations of production code, compiled in a temp copy of
// the engine (no tracked file is ever written): the throw removed reddens 1.1; a business block restored reddens 2.1.
'use strict';
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const os = require('os');
const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r); const src = (r) => fs.readFileSync(P(r), 'utf8');
const sha = (t) => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
const PIN = {"planMoney":"2a7a1c76bf2efeabec03301805e5d5d2bdb38b310940284935496dad8b7f7efb","planPayment":"cddb6c299afe946ddfddf89cebb3a815c13db38cbd17c863a2b23a677244483e","planBooking":"086fbb9debf6a62fa52a8306037adef47cc1ece4e2ce2efd7e2c684a27e6a3fa","planAssign":"d91e81ae7e6ccf1dc133fd4955402708c883473699de5a1b692beebb02f5026f","fileAssign":"7fda6dca436372e8d5d2aac8fa9c6d8ce4f8eb7f71fecf6c553948fbb16d0582","applyRow":"01f76e676659e01c3f0dd92b560726fcde136a8be4bcf3a12adf120cc7fc1b4b","reread":"e200a0f720c62637ea617ccacb508c9b7a0b58f49e7848323c5eff5a7bcdc8fc","pendingMoneyActs.js":"f3d63806f6dc149f0ba32c7f83a33387823ae5d72501b1cf496c31395e9dd9ab","server.ts":"79670593fc0e6771c1baa34de3b7ebba1896cea300781a1c01ebd4484e8ff938"};
const THE_ERROR = "ENGINE_BUSINESS_ROOM_RETIRED: the business room is the door's; runTurn serves advisor and consult";

// ── the DRIVER (child process): one turn through the real runTurn of the dist it is handed ─────────────────────────
if (process.argv[2] === '--drive') {
  const [dist, room, agentMode, toolScript] = process.argv.slice(3);
  process.env.SUPABASE_URL = 'http://stub.invalid'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub'; process.env.ANTHROPIC_API_KEY = 'stub';
  const db = require(path.join(dist, 'core/db.js'));
  const touched = []; const inserts = [];
  const resolve = (t, mode) => {
    if (t === 'agents' && mode === 'maybeSingle') return { data: { id: 'agent-1', tier: 'signature', display_name: 'Victor', profession_preset: 'photography', timezone: 'Asia/Kolkata', mode: agentMode }, error: null };
    if (t === 'conversations') return mode === 'single' ? { data: { id: 'conv-1' }, error: null } : { data: null, error: null };
    if (mode === 'maybeSingle' || mode === 'single') return { data: null, error: null };
    return { data: [], error: null };
  };
  const stub = (t) => { touched.push(t); const c = new Proxy({}, { get: (_o, k) => {
    if (k === 'insert') return (row) => { inserts.push(t); return c; };
    if (k === 'maybeSingle' || k === 'single') return () => Promise.resolve(resolve(t, k));
    if (k === 'then') return (res, rej) => Promise.resolve(resolve(t, 'list')).then(res, rej);
    return () => c; } }); return c; };
  db.supabase.from = stub; db.supabase.schema = () => ({ from: stub });
  const calls = []; let n = 0;
  const transport = { provider: 'anthropic', create() { throw new Error('unused'); }, stream(params) {
    calls.push({ tools: (params.tools || []).map((t) => t.name), system: (params.system || []).map((b) => b.text).join('') });
    n += 1; const useTool = toolScript === 'handbook' && n === 1;
    return { on() {}, finalMessage: async () => ({ content: useTool
      ? [{ type: 'tool_use', id: 'tu1', name: 'dear_donna_handbook', input: { ref: '§1' } }]
      : [{ type: 'text', text: 'Here is my advice.' }], usage: { input_tokens: 1, output_tokens: 1 } }) }; } };
  const logs = []; const l = console.log; console.log = (...a) => logs.push(a.join(' '));
  const { runTurn } = require(path.join(dist, 'core/loop.js'));
  const args = { agentId: 'agent-1', message: 'How should I price a destination wedding?', transport };
  if (room === 'advisor') args.roomAssert = 'advisor';
  runTurn(args).then((r) => ({ ok: true, r }), (e) => ({ ok: false, err: String(e && e.message) })).then((out) => {
    console.log = l;
    process.stdout.write(JSON.stringify({ ...out, touched, inserts, calls, modeLine: logs.find((x) => x.startsWith('[engine:mode]')) || null }));
  });
  return;
}

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://stub.invalid'; process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert'; process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'bench-inert';
let pass = 0, fail = 0; const failed = [];
function T(name, cond) { if (cond) { pass += 1; console.log('  PASS  ' + name); } else { fail += 1; failed.push(name); console.log('  FAIL  ' + name); } }
const sec = (t) => console.log('\n' + t);
const drive = (dist, room, mode = 'chat', tool = '') => {
  const r = spawnSync(process.execPath, [__filename, '--drive', dist, room, mode, tool], { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
  try { return JSON.parse(r.stdout); } catch (_e) { return { ok: null, err: 'driver: ' + (r.stderr || r.stdout).slice(0, 300) }; } };
// Comment-stripped code (R-40.105): line and block comments out, strings kept.
const code = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const DIST = P('src/engine/dist');

sec('0 the dist this bench drives is built from this tree (block 2 builds it from empty)');
T('0.1 dist/core/loop.js exists', fs.existsSync(path.join(DIST, 'core/loop.js')));
T('0.2 dist/core/loop.js carries the named error (a stale dist would not)', fs.readFileSync(path.join(DIST, 'core/loop.js'), 'utf8').includes('ENGINE_BUSINESS_ROOM_RETIRED'));

sec('1 L5-a and the rooms, DRIVEN through the real runTurn');
const biz = drive(DIST, 'business');
T('1.1 a business turn (no assertion, as server.ts sends it) throws the named error, exactly', biz.ok === false && biz.err === THE_ERROR);
T('1.2 before any read or write: the only table touched is agents (the room\'s own lookup); nothing inserted', biz.touched && biz.touched.every((t) => t === 'agents') && biz.inserts.length === 0);
T('1.3 the [engine:mode] line printed the room before the throw', biz.modeLine === '[engine:mode] room=business override=no assert=no source=default');
T('1.4 no model call was made', biz.calls && biz.calls.length === 0);
const adv = drive(DIST, 'advisor');
T('1.5 an Advisor turn answers whole', adv.ok === true && adv.r.reply === 'Here is my advice.' && adv.r.victor_mode === 'advisor');
const lens = require(path.join(DIST, 'core/advisorLens.js')).ADVISOR_LENS;
T('1.6 its prompt carries the advisory lens and the Advisor room line', adv.calls && adv.calls[0].system.includes(lens) && adv.calls[0].system.includes('You are in the Advisor room.'));
T('1.7 its tools are the advisor room\'s only (jot_advice, and the handbook when indexed); no dear_donna_talk, no escalate', adv.calls && adv.calls[0].tools.includes('jot_advice') && adv.calls[0].tools.every((t) => t === 'jot_advice' || t === 'dear_donna_handbook'));
T('1.8 no Donna: no donna_calls on any tool call, no estate table read (agent_snapshot, briefs, facts)', adv.ok && adv.r.tool_calls.every((c) => !c.donna_calls) && !adv.touched.some((t) => ['agent_snapshot', 'briefs', 'facts'].includes(t)));
T('1.9 it saved the user row and the reply, and charged usage (the room ran whole)', adv.inserts.filter((t) => t === 'messages').length === 2 && adv.inserts.includes('usage'));
const hb = drive(DIST, 'advisor', 'chat', 'handbook');
T('1.10 the Advisor\'s dear_donna_handbook call is SERVED by the handbook branch (not "Unknown tool")', hb.ok === true && hb.r.tool_calls.some((c) => c.name === 'dear_donna_handbook' && !/^Unknown tool/.test(c.result)));
const con = drive(DIST, 'business', 'consult');
T('1.11 consult untouched: runs with no assertion, no tools, no room line, victor_mode absent', con.ok === true && con.calls[0].tools.length === 0 && !con.calls[0].system.includes('You are in the') && con.r.victor_mode === undefined);

sec('2 the deleted set is absent (comment-stripped), each with a control that finds a present name');
const loop = code(src('src/engine/src/core/loop.ts'));
const GONE_LOOP = ['runDonnaTurn', 'dear_donna_talk', 'DEAR_DONNA_TALK_TOOL', 'DEAR_DONNA_HANDBOOK_TOOL', 'ESCALATE_TOOL', 'modeOverride', 'snapshotText', 'TALK_FUSE', 'donnaTransport', 'donnaModelOverride', 'estateInRoom', 'loadFacts', 'donnaMessages', 'appendDeedTail', 'echoedRefusals', 'calendarSnapshot', 'moneyFacts', 'expenseFacts', 'bookedFacts', 'leadPings', 'pendingRelay', 'recentActivity', 'wasFirstMeeting', 'canEscalate', 'ROOM_LINE.business'];
const present = GONE_LOOP.filter((w) => loop.includes(w));
T('2.1 loop.ts names none of the ' + GONE_LOOP.length + ' deleted names in code', present.length === 0);
T('2.2 CONTROL: the same read finds ADVISOR_HANDBOOK_TOOL, JOT_ADVICE_TOOL, ADVISOR_LENS, the named error', ['ADVISOR_HANDBOOK_TOOL', 'JOT_ADVICE_TOOL', 'ADVISOR_LENS', 'ENGINE_BUSINESS_ROOM_RETIRED'].every((w) => loop.includes(w)));
const donna = code(src('src/engine/src/core/donna.ts'));
T('2.3 donna.ts defines none of runDonnaTurn, DonnaSession, DonnaTurn, snapshotText, DONNA_TOOLS', !/runDonnaTurn|DonnaSession|DonnaTurn|snapshotText|DONNA_TOOLS/.test(donna));
T('2.4 CONTROL: donna.ts exports rebuildSnapshot and patchNote', /export async function rebuildSnapshot\(/.test(donna) && /export async function patchNote\(/.test(donna));
const mem = code(src('src/engine/src/core/memory.ts'));
T('2.4b memory.ts no longer defines donnaMessages (L5-c, the chair 26 Sep); CONTROL: loadOwner and saveMessage still exported', !/donnaMessages/.test(mem) && /export async function loadOwner\(/.test(mem) && /export async function saveMessage\(/.test(mem));
const D = require(path.join(DIST, 'core/donna.js'));
T('2.5 the dist exports exactly rebuildSnapshot and patchNote, both functions', JSON.stringify(Object.keys(D).sort()) === '["patchNote","rebuildSnapshot"]' && typeof D.patchNote === 'function');
T('2.6 the four live requirers still take patchNote from it', ['src/agent/harvest.js', 'src/api/vendor/leads.js', 'src/lib/executeAndPatch.js', 'src/lib/vendor/promotion.js'].every((f) => /engine\/dist\/core\/donna'\)/.test(src(f)) && /patchNote/.test(src(f))));
const DELETED = ['tools/dearDonna', 'donnaSoul', 'historyGate', 'tools/donnaBench', 'tools/donnaLead', 'tools/donnaReview', 'tools/donnaReviewRead', 'tools/donnaShelf', 'tools/donnaVerdict', 'tools/introduce', 'tools/listenHarvey', 'tools/relayCouple'];
T('2.7 the twelve deleted engine modules are absent from src', DELETED.every((m) => !fs.existsSync(P('src/engine/src/core/' + m + '.ts'))));
T('2.8 and absent from the dist this bench drives', DELETED.every((m) => !fs.existsSync(path.join(DIST, 'core', m + '.js'))));
T('2.9 CONTROL: a kept neighbour is present in both (tools/jotAdvice, tools/recordPrimitives)', ['tools/jotAdvice', 'tools/recordPrimitives'].every((m) => fs.existsSync(P('src/engine/src/core/' + m + '.ts')) && fs.existsSync(path.join(DIST, 'core', m + '.js'))));
// A plain walk of src (no git): the bench also runs in b65_mutations' scratch copies, which are not repositories. dist and node_modules skipped.
const allSrc = []; (function walk(d) { for (const e of fs.readdirSync(P(d), { withFileTypes: true })) { const r = d + '/' + e.name;
  if (e.isDirectory()) { if (e.name !== 'dist' && e.name !== 'node_modules') walk(r); } else if (/\.(js|ts)$/.test(e.name)) allSrc.push(r); } })('src');
const naming = allSrc.filter((f) => { const t = code(src(f)); return DELETED.some((m) => new RegExp("['\"/]" + m.split('/').pop() + "(\\.js)?['\"]").test(t)); });
T('2.10 no src file imports or requires any of the twelve', naming.length === 0);
const hbk = code(src('src/engine/src/core/tools/dearDonnaHandbook.ts'));
T('2.11 dearDonnaHandbook.ts: DEAR_DONNA_HANDBOOK_TOOL gone, ADVISOR_HANDBOOK_TOOL kept', !hbk.includes('DEAR_DONNA_HANDBOOK_TOOL') && hbk.includes('export const ADVISOR_HANDBOOK_TOOL'));
T('2.12 relaySeam.ts kept whole (L5-e), read by snapshotTypes.ts', fs.existsSync(P('src/engine/src/core/relaySeam.ts')) && /from '\.\/relaySeam\.js'/.test(code(src('src/engine/src/core/snapshotTypes.ts'))));
T('2.13 server.ts byte-identical to eb3fe0a (Q-c2)', sha(src('src/engine/src/core/server.ts')) === PIN['server.ts']);

sec('3 L5-d · chat.js\'s advisor path');
const chat = code(src('src/api/vendor-engine/chat.js'));
const FIVE = ['fetchScratchpad', 'fetchRecentBlock', 'fetchMoneyFacts', 'fetchBookedFacts', 'fetchExpenseFacts'];
T('3.1 the five fetch functions are gone and nothing calls them', FIVE.every((f) => !chat.includes(f)));
const sites = chat.split('await runTurn(').slice(1).map((s) => s.slice(0, s.indexOf('});') + 3));
T('3.2 two runTurn sites, and neither passes any of the six facts or the Donna wiring', sites.length === 2 && sites.every((s) => !/calendarSnapshot|scratchpad|recentActivity|moneyFacts|expenseFacts|bookedFacts|donnaTransport|donnaModelOverride/.test(s)));
T('3.3 CONTROL: both sites still pass roomAssert and the transport; fetchCalendarSnapshot kept for its live callers', sites.every((s) => /roomAssert/.test(s) && /transport: llmWiring\.transport/.test(s)) && /async function fetchCalendarSnapshot\(req\)/.test(chat) && /module\.exports\.fetchCalendarSnapshot/.test(chat));

sec('4 §7 · fullStop.js');
const FS = require(P('src/lib/fullStop.js'));
T('4.1 matchFullStopWord is gone from the module and from every src file\'s code', FS.matchFullStopWord === undefined && allSrc.every((f) => !code(src(f)).includes('matchFullStopWord')));
T('4.2 CONTROL: matchOptOutExact kept and whole-message ("STOP" stop, "Cancel the shoot" null)', FS.matchOptOutExact('STOP') === 'stop' && FS.matchOptOutExact('Cancel the shoot') === null);

sec('5 the money functions, byte-identical to eb3fe0a (C-44.7)');
function body(t, name) { const i = t.search(new RegExp('^(async )?function ' + name + '\\b', 'm')); if (i < 0) return ''; let j = t.indexOf('(', i), d = 0;
  for (; j < t.length; j += 1) { if (t[j] === '(') d += 1; else if (t[j] === ')') { d -= 1; if (!d) break; } }
  const k = t.indexOf('{', j); d = 0; for (let m = k; m < t.length; m += 1) { if (t[m] === '{') d += 1; else if (t[m] === '}') { d -= 1; if (!d) return t.slice(i, m + 1); } } return ''; }
const wd = src('src/lib/vendor/workingDoor.js');
for (const f of ['planMoney', 'planPayment', 'planBooking', 'planAssign', 'fileAssign', 'applyRow', 'reread']) T('5.1 ' + f, sha(body(wd, f)) === PIN[f]);
{ const a = wd.indexOf('    // 1 · the pending check, BEFORE the listener'); const b = wd.indexOf('    const liveAtStart'); // the estate's standing live-row anchors (b106 6.2 to b109 6.2)
  T('5.3 the live-row block, its text hashed at eb3fe0a (anchors present and ordered)', a > 0 && b > a && sha(wd.slice(a, b)) === '5289029740782e70dcfb678590d0f8eebaa363a0c8e806c3496b97714edf2e18'); }
T('5.2 pendingMoneyActs.js whole', crypto.createHash('sha256').update(fs.readFileSync(P('src/lib/vendor/pendingMoneyActs.js'))).digest('hex') === PIN['pendingMoneyActs.js']);

sec('6 mutations of production code (compiled in a temp copy of the engine; no tracked file is written)');
function mutant(label, from, to) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b116-'));
  fs.cpSync(P('src/engine/src'), path.join(dir, 'src'), { recursive: true });
  fs.copyFileSync(P('src/engine/tsconfig.json'), path.join(dir, 'tsconfig.json'));
  fs.symlinkSync(P('node_modules'), path.join(dir, 'node_modules'));
  const f = path.join(dir, 'src/core/loop.ts'); const t = fs.readFileSync(f, 'utf8');
  const anchored = t.includes(from); fs.writeFileSync(f, t.replace(from, to));
  const r = spawnSync(process.execPath, [P('node_modules/typescript/bin/tsc'), '-p', path.join(dir, 'tsconfig.json'), '--outDir', path.join(dir, 'dist')], { encoding: 'utf8', timeout: 180000 });
  return { anchored, built: fs.existsSync(path.join(dir, 'dist/core/loop.js')), dir, dist: path.join(dir, 'dist'), tsc: r.status };
}
const THROW = "  if (!isConsult && !isAdvisor) {\n    throw new Error('ENGINE_BUSINESS_ROOM_RETIRED";
const m1 = mutant('M1', THROW, "  if (false) {\n    throw new Error('ENGINE_BUSINESS_ROOM_RETIRED");
const b1 = m1.built ? drive(m1.dist, 'business') : null;
T('6.1 M1 anchor present and the mutant builds', m1.anchored && m1.built);
T('6.2 M1 the throw removed reddens 1.1 (a business turn no longer meets the named error)', b1 && !(b1.ok === false && b1.err === THE_ERROR));
const REST = "import { ADVISOR_HANDBOOK_TOOL } from './tools/dearDonnaHandbook.js';";
const m2 = mutant('M2', REST, REST + "\nconst TALK_FUSE = 5; void TALK_FUSE;");
const m2loop = code(fs.readFileSync(path.join(m2.dir, 'src/core/loop.ts'), 'utf8'));
T('6.3 M2 anchor present', m2.anchored);
T('6.4 M2 a business block restored (TALK_FUSE) reddens 2.1', GONE_LOOP.some((w) => m2loop.includes(w)));
for (const m of [m1, m2]) fs.rmSync(m.dir, { recursive: true, force: true });

console.log('\nb116_lcv16_lsp5_bench: ' + pass + ' passed, ' + fail + ' failed  (total ' + (pass + fail) + ')');
if (fail) console.log('FAILED: ' + failed.join(' | '));
process.exit(fail === 0 ? 0 : 1);
