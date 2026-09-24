'use strict';
// scripts/b111_lcv15_lsp1b_bench.js · CE-45 LCV-15 · LSP_1b · F-44.141's cure (the chair's rulings Q1b to Q3b, 24 September 2026)
//
//   §1  matchOptOutExact: the WHOLE message is one word of prospects.js's two lists, or it is nothing
//   §2  the marketing lane's isStopWord and the bride lane are untouched (pinned to 46af98d's bytes)
//   §3  the vendor lane calls the exact matcher and never the first-token one
//   §4  driven through the REAL processVendorInbound over an in-memory Postgres-shaped double (C-44.3):
//       "Cancel Walk Seventeen Alpha's shoot" reaches the lane's turn, no opt-out; STOP opts out and both rows land in
//       vendor_self with the sid; START resumes and both rows land; START from someone never out falls through and
//       the branch writes NOTHING (the sid trap); a couple's STOP opts her out and writes no vendor_self row
//   §5  persistOptOutTurn never throws
//   §6  mutations of production code, each reddening its cell
// It reads no clock (C-44.13: nothing to shift, stated).
//
// Run: node scripts/b111_lcv15_lsp1b_bench.js

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
function compileAt(rel, text) { const file = P(rel); const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file)); m._compile(text, file); return m.exports; }

// ── an in-memory double that answers the way Postgres does (C-44.3): filters narrow, maybeSingle is one row or null,
// single on none is an error, and messages.message_sid is UNIQUE (23505 on a repeat, RF-1's index). ───────────────
function makeDb(seed) {
  const t = JSON.parse(JSON.stringify(seed));
  let n = 0; const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
  const log = { inserts: [], updates: [] };
  function builder(table) {
    t[table] = t[table] || [];
    let filters = []; let op = 'select'; let payload = null; let wantSelect = false;
    const rows = () => t[table].filter((r) => filters.every((f) => f(r)));
    const b = {
      select() { wantSelect = true; return b; },
      eq(c, v) { filters.push((r) => r[c] === v); return b; },
      neq(c, v) { filters.push((r) => r[c] !== v); return b; },
      is(c, v) { filters.push((r) => (r[c] == null ? null : r[c]) === v); return b; },
      in(c, vs) { filters.push((r) => vs.includes(r[c])); return b; },
      gte() { return b; }, lte() { return b; }, lt() { return b; }, gt() { return b; }, order() { return b; }, limit() { return b; }, not() { return b; }, or() { return b; }, ilike() { return b; }, filter() { return b; }, contains() { return b; },
      insert(row) { op = 'insert'; payload = Array.isArray(row) ? row : [row]; return b; },
      update(patch) { op = 'update'; payload = patch; return b; },
      upsert(row) { op = 'insert'; payload = Array.isArray(row) ? row : [row]; return b; },
      delete() { op = 'delete'; return b; },
      async run() {
        if (op === 'insert') {
          for (const r of payload) {
            if (table === 'messages' && r.message_sid && t.messages.some((m) => m.message_sid === r.message_sid)) return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "messages_message_sid_uidx"' } };
          }
          const made = payload.map((r) => ({ id: uuid(), ...r }));
          t[table].push(...made); log.inserts.push(...made.map((r) => ({ table, row: r })));
          return { data: wantSelect ? made : null, error: null };
        }
        if (op === 'update') { const hit = rows(); hit.forEach((r) => Object.assign(r, payload)); log.updates.push({ table, patch: payload, n: hit.length }); return { data: wantSelect ? hit : null, error: null }; }
        if (op === 'delete') { return { data: null, error: null }; }
        return { data: rows(), error: null };
      },
      async maybeSingle() { const r = await b.run(); if (r.error) return r; const d = Array.isArray(r.data) ? r.data : []; return { data: d[0] || null, error: null }; },
      async single() { const r = await b.run(); if (r.error) return r; const d = Array.isArray(r.data) ? r.data : []; return d[0] ? { data: d[0], error: null } : { data: null, error: { code: 'PGRST116', message: 'no rows' } }; },
      then(res, rej) { return b.run().then(res, rej); },
    };
    return b;
  }
  return { db: { from: builder, schema: () => ({ from: builder }), rpc: async () => ({ data: null, error: null }) }, t, log };
}

const VPHONE = '919888294440'; const CPHONE = '919625759924';
function world(prospectState) {
  return {
    users: [{ id: 'u-v', phone: `+${VPHONE}`, name: 'Dev' }, { id: 'u-c', phone: `+${CPHONE}`, name: 'Sarah' }], // users.phone as the lane reads it (metaInputsFrom's +E164)
    vendors: [{ id: 'v1', user_id: 'u-v', business_name: 'DEV440', routing_handle: 'DEV440', onboarding_state: 'complete', tier: 'signature', category: 'photography' }],
    conversations: [{ id: 'c-self', vendor_id: 'v1', kind: 'vendor_self', state: 'active' }],
    prospects: prospectState ? [{ id: 'p1', phone: VPHONE, state: prospectState }] : [],
    messages: [], admin_config: [], leads: [], events: [], team_members: [], invoices: [], pending_money_acts: [],
  };
}
function makeDeps(dbh, sends) {
  const noop = async () => ({});
  return {
    supabase: dbh.db, anthropic: {},
    sendWhatsApp: async (phone, text) => { sends.push({ phone, text }); return { sid: `wamid.OUT.${sends.length}` }; },
    webhookCore: require(P('src/lib/webhookCore.js')),
    runCoupleAgenticTurn: async () => ({ reply: '', tool_calls: [] }),
    resolveAgentForVendor: async () => 'ag1',
    buildLlmForTurn: async () => ({ route: {} }),
    generateInvoiceForBinder: noop, enquiryToBinder: noop, ensureCoupleRow: async () => ({ id: 'cpl1' }), captureField: noop,
    buildDisambiguationQuestion: () => '', interpretDisambiguationReply: () => ({}), vendorDisplayName: () => 'V',
    matchModeWord: () => null, applyModeFlip: async () => ({}), MODE_FLIP_LINES: {},
    matchFreshWord: () => false, FRESH_THREAD_LINE: '', abandonActiveThread: async () => ({ ok: true }),
    checkImageThrottle: async () => ({ allowed: true }), markRejectionSent: async () => {}, extractCalendarFromImage: async () => ({}),
  };
}
let seq = 0;
async function drive(lane, text, from, prospectState) {
  const dbh = makeDb(world(prospectState)); const sends = [];
  const sid = `wamid.b111.${++seq}`;
  const inputs = lane.metaInputsFrom({ from, text, messageId: sid, type: 'text', media: [] }, { entry: [] });
  await quiet(() => lane.processVendorInbound(inputs, makeDeps(dbh, sends)));
  const self = dbh.t.messages.filter((m) => m.conversation_id === 'c-self');
  return { dbh, sends, sid, self, prospect: dbh.t.prospects.find((p) => p.phone === from) || null };
}

(async () => {
  // production probes messages.message_sid at startup and finds it (RF-1's column is live); the bench sets the same fact
  require(P('src/lib/webhookCore.js'))._setSidColumnPresent(true);
  const FS = require(P('src/lib/fullStop.js'));
  const PR = require(P('src/lib/prospects.js'));
  const NC = require(P('src/lib/nudgeCopy.js'));
  const STOP_ACK = NC.getNudgeCopy('full_stop_confirmation');
  const START_ACK = NC.getNudgeCopy('full_start_confirmation');

  // §1
  sec('1 matchOptOutExact: the whole message, or nothing');
  const stops = [...PR.STOP_WORDS]; const starts = [...PR.START_WORDS];
  T(`1.1 every one of prospects.js's ${stops.length} stop words, alone, is "stop" (one home for the words)`, stops.length === 6 && stops.every((w) => FS.matchOptOutExact(w) === 'stop'));
  T(`1.2 every one of its ${starts.length} start words, alone, is "start"`, starts.length === 3 && starts.every((w) => FS.matchOptOutExact(w) === 'start'));
  T('1.3 case and surrounding punctuation are tolerated: "stop", "Cancel.", "  start  ", "UNSTOP!", "¡Quit!"', ['stop', 'Cancel.', '  start  ', 'UNSTOP!', '¡Quit!'].every((w) => FS.matchOptOutExact(w) !== null));
  const phrases = ["Cancel Walk Seventeen Alpha's shoot", 'Cancel no one from wall seventeen alpha shoot crew', 'End it', 'Quit the job', 'Resume on Monday', 'STOP MORNINGS', 'unsubscribe me', 'Start the shoot at 9', 'stop.stop', 'can cel', 'cancelled', 'STOPPED'];
  T(`1.4 ${phrases.length} messages that only BEGIN with (or merely resemble) a word are NOT an opt-out`, phrases.every((p) => FS.matchOptOutExact(p) === null));
  T('1.5 CONTROL: the first-token matcher still says "stop" for the very sentence that was witnessed (the defect is real, and still there for its remaining callers)', FS.matchFullStopWord("Cancel Walk Seventeen Alpha's shoot") === 'stop');
  const HOSTILE = [undefined, null, 0, NaN, true, {}, [], () => {}, Symbol.iterator.toString(), '\u0000', ' '.repeat(10000), 'STOP'.repeat(5000)];
  let threw = 0; for (const h of HOSTILE) { try { const r = FS.matchOptOutExact(h); if (!(r === null || r === 'stop' || r === 'start')) threw += 1; } catch (_e) { threw += 1; } }
  T(`1.6 ${HOSTILE.length} hostile inputs: never a throw, never anything but null, "stop" or "start"`, threw === 0);

  // §2
  sec('2 the marketing lane and the bride lane are untouched (C-44.7: bytes pinned from 46af98d)');
  T('2.1 prospects.js is byte-identical to 46af98d (isStopWord, the two word lists, the marketing lane\'s own opt-out)', sha(src('src/lib/prospects.js')) === '59bd32b721a281b370ac80454281d1ac50a6ea3f20fc5bb7c5db60595d115ddd');
  // LABELED AMENDMENT · CE-45 ELZ-1 cut 1: F-44.145's own sitting came. This read "byte-identical to 46af98d (it still calls the
  // first-token matcher)"; the bride lane now calls the whole-message matcher, one call, and is pinned to cut 1's bytes.
  T('2.2 brideInbound.js is byte-identical to ELZ-1 cut 1 (it calls the whole-message matcher: F-44.145 landed)', sha(src('src/lib/brideInbound.js')) === '2e17fbcb8896bd1c49aaebe9598c381a94dcb8b2767c8fcb5df6b3d18d6a8f62' && /matchOptOutExact\(trimmedBody\)/.test(src('src/lib/brideInbound.js')) && !/matchFullStopWord\(/.test(src('src/lib/brideInbound.js')));
  T('2.3 the marketing lane still reads the first token: isStopWord("Cancel the shoot") is true, exactly as before', PR.isStopWord('Cancel the shoot') === true);

  // §3
  sec('3 the vendor lane calls the exact matcher');
  const vi = code(src('src/lib/vendorInbound.js'));
  T('3.1 vendorInbound.js calls matchOptOutExact on the trimmed body and never matchFullStopWord', /matchOptOutExact\(trimmedBody\)/.test(vi) && !/matchFullStopWord/.test(vi));
  T('3.2 the branch keeps its place: after the nudge branch, before the sender is read (pre-cap, pre-user)', vi.indexOf('matchNudgeWord(trimmedBody)') < vi.indexOf('matchOptOutExact(trimmedBody)') && vi.indexOf('matchOptOutExact(trimmedBody)') < vi.indexOf(".from('users').select('*').eq('phone', phone).maybeSingle()"));
  T('3.3 persistOptOutTurn is called exactly twice, once per RETURNING branch, and not on the fall-through', (vi.match(/await persistOptOutTurn\(/g) || []).length === 2);

  // §4
  sec('4 the REAL processVendorInbound, driven');
  const lane = require(P('src/lib/vendorInbound.js'));
  let r = await drive(lane, "Cancel Walk Seventeen Alpha's shoot", VPHONE, null);
  T('4.1 "Cancel Walk Seventeen Alpha\'s shoot" from the vendor: NOT an opt-out (no prospects row, no confirmation sent)', r.prospect === null && !r.sends.some((s) => s.text === STOP_ACK));
  T('4.2 …and her message reaches the lane\'s own turn: her inbound row lands in vendor_self exactly once, with its sid', r.self.filter((m) => m.direction === 'inbound' && m.body === "Cancel Walk Seventeen Alpha's shoot" && m.message_sid === r.sid).length === 1);
  r = await drive(lane, 'STOP', VPHONE, null);
  T('4.3 "STOP" alone from the vendor: opted out, and the confirmation is sent', r.prospect && r.prospect.state === 'opted_out' && r.sends.length === 1 && r.sends[0].text === STOP_ACK);
  T('4.4 …and BOTH turns are on the record in vendor_self: her STOP with its sid, and the confirmation as the outbound row (F-44.141, Q3b)',
    r.self.length === 2 && r.self[0].direction === 'inbound' && r.self[0].body === 'STOP' && r.self[0].message_sid === r.sid && r.self[1].direction === 'outbound' && r.self[1].body === STOP_ACK && r.self[1].twilio_sid === 'wamid.OUT.1');
  r = await drive(lane, 'Start', VPHONE, 'opted_out');
  T('4.5 "Start" from the vendor who is opted out: resumed (replied), the resume line sent, both turns on the record',
    r.prospect.state === 'replied' && r.sends.length === 1 && r.sends[0].text === START_ACK && r.self.length === 2 && r.self[0].body === 'Start' && r.self[0].message_sid === r.sid && r.self[1].body === START_ACK);
  r = await drive(lane, 'START', VPHONE, null);
  const startRows = r.self.filter((m) => m.direction === 'inbound' && m.message_sid === r.sid);
  // Q3b's reason, as the seat re-derived it here (a correction to its read-first): the lane's own inbound insert awaits bare and
  // discards its error, so a branch-written row would NOT drop her turn; it would put a second writer on her row and, worse,
  // record a reply that was never sent. So the fall-through writes nothing: one inbound row (the turn's) and exactly one
  // outbound row (the turn's own answer).
  T('4.6 "START" from a vendor never opted out FALLS THROUGH: the branch writes nothing; her turn\'s inbound row lands once and the only outbound row is the turn\'s own answer (Q3b)',
    startRows.length === 1 && r.self.filter((m) => m.direction === 'outbound').length === 1 && !r.sends.some((s) => s.text === START_ACK));
  r = await drive(lane, 'STOP', CPHONE, null);
  T('4.7 "STOP" from a couple writing to the vendor\'s number: she is opted out and told, and NOTHING is written to vendor_self (named, not built)', r.prospect && r.prospect.state === 'opted_out' && r.sends.some((s) => s.text === STOP_ACK) && r.self.length === 0);
  r = await drive(lane, 'Cancel the shoot', CPHONE, null);
  T('4.8 "Cancel the shoot" from a couple: NOT an opt-out; her message goes on to her own turn (Q2b)', r.prospect === null && !r.sends.some((s) => s.text === STOP_ACK));

  // §5
  sec('5 persistOptOutTurn never throws');
  const hostileDb = { from() { throw new Error('db down'); } };
  let out = null; let thrown = false;
  try { out = await quiet(() => lane.persistOptOutTurn({ supabase: hostileDb, webhookCore: require(P('src/lib/webhookCore.js')), phone: VPHONE, body: 'STOP', reply: 'x', sent: null, messageSid: 's' })); } catch (_e) { thrown = true; }
  T('5.1 a database that throws: no throw, and it reports not persisted', !thrown && out && out.persisted === false);
  const noUser = makeDb(world(null)); noUser.t.users = [];
  out = await quiet(() => lane.persistOptOutTurn({ supabase: noUser.db, webhookCore: require(P('src/lib/webhookCore.js')), phone: VPHONE, body: 'STOP', reply: 'x', sent: null, messageSid: 's' }));
  T('5.2 an unknown sender: nothing written, not persisted, no user created', out.persisted === false && noUser.t.messages.length === 0 && noUser.t.users.length === 0);

  // §6
  sec('6 mutations of production code, each reddening its cell');
  {
    const t = src('src/lib/vendorInbound.js');
    const a = 'const fullStopWord = matchOptOutExact(trimmedBody);';
    T('6.1 the matcher anchor is present', t.includes(a));
    const M = compileAt('src/lib/vendorInbound.js', t.replace(a, "const fullStopWord = require('./fullStop').matchFullStopWord(trimmedBody);"));
    const m = await drive(M, "Cancel Walk Seventeen Alpha's shoot", VPHONE, null);
    T('6.2 M1 the first-token matcher restored on the vendor lane reddens 4.1 (the vendor is opted out again)', m.prospect && m.prospect.state === 'opted_out');
  }
  {
    const t = src('src/lib/vendorInbound.js');
    const a = '          // Never opted out';
    T('6.3 the fall-through anchor is present', t.includes(a));
    const M = compileAt('src/lib/vendorInbound.js', t.replace(a, "          await persistOptOutTurn({ supabase, webhookCore, phone, body, reply: 'x', sent: null, messageSid: internalReplay ? null : messageSid });\n" + a));
    const m = await drive(M, 'START', VPHONE, null);
    const rows = m.self.filter((x) => x.direction === 'inbound' && x.message_sid === m.sid);
    T('6.4 M2 persisting on the fall-through reddens 4.6 (a second outbound row records a reply that was never sent)', rows.length === 1 && m.self.filter((x) => x.direction === 'outbound').length === 2);
  }
  {
    const t = src('src/lib/fullStop.js');
    const a = "  if (!t || /\\s/.test(t)) return null;";
    T('6.5 the whole-message anchor is present', t.includes(a));
    const M = compileAt('src/lib/fullStop.js', t.replace(a, "  if (!t) return null; const first = t.split(/\\s+/)[0]; if (STOP_WORDS.has(first)) return 'stop';"));
    T('6.6 M3 a matcher that reads the first token reddens 1.4', M.matchOptOutExact("Cancel Walk Seventeen Alpha's shoot") === 'stop');
  }

  console.log(`\nb111_lcv15_lsp1b_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`   ${f}`)); }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH THREW (unexpected):', e && e.stack || e); process.exit(2); });
