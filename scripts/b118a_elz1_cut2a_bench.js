#!/usr/bin/env node
'use strict';
// scripts/b118a_elz1_cut2a_bench.js  RUNG b118a · CE-45 ELZ-1 cut 2a (no model; reads no real clock).
//   §1 F-44.165: the known-client read and capture's existing-lead read skip soft-deleted rows and read the newest, over DEV440's own
//      shape (seven rows for +919625759924, six deleted, his SELECT of 25 Sept); a capture from a known number updates, never inserts
//   §2 the vendor hears the house form: his line (F4, line 1) byte-pinned; a turn whose date read is not "free" notifies, a free one does not
//   §3 F-44.145's persistence half: the bride's STOP and our confirmation written to her couple_self thread; never throws
//   §4 R-45.23's V1 to V8: his bytes, the hashes consistent, B33 naming the package
//   §5 the money functions byte-identical to b115's pins
//   §6 mutations of production code
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
const sha = (t) => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

let pass = 0; let fail = 0; const failed = [];
function T(n, c) { if (c) { pass += 1; console.log(`  PASS  ${n}`); } else { fail += 1; failed.push(n); console.log(`  FAIL  ${n}`); } }
const sec = (t) => console.log(`\n${t}`);

// the model double
let SCRIPT = []; const CAPTURED = [];
const llmPath = require.resolve(P('src/lib/llm.js'));
const realLlm = require(llmPath);
require.cache[llmPath].exports = { ...realLlm, llmCreate: async (provider, params) => {
  CAPTURED.push(JSON.parse(JSON.stringify(params)));
  const step = SCRIPT.shift() || { name: 'respond_to_couple', input: { message: 'ok' } };
  return { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: `t${CAPTURED.length}`, ...step }], usage: { input_tokens: 1, output_tokens: 1 } };
} };
let DESCRIBE = null;
const occPath = require.resolve(P('src/lib/vendor/occupancy.js'));
const realOcc = require(occPath);
require.cache[occPath].exports = { ...realOcc, describeDate: async () => DESCRIBE };

// a double that FILTERS as Postgres would: eq, is null, order, limit; writes recorded
function store({ leads = [], rows = [], vendorRow = null } = {}) {
  const writes = [];
  return {
    writes,
    from(table) {
      const q = { eqs: {}, isNull: [], order: null, lim: null, gte: null };
      const pick = () => {
        let src = table === 'leads' ? leads : table === 'messages' ? rows : [];
        src = src.filter((r) => Object.entries(q.eqs).every(([k, v]) => r[k] === v));
        src = src.filter((r) => q.isNull.every((k) => r[k] === null || r[k] === undefined));
        if (q.gte) src = src.filter((r) => Date.parse(r.created_at) >= Date.parse(q.gte));
        if (q.order) src = [...src].sort((a, b) => (q.order.asc ? 1 : -1) * (Date.parse(a[q.order.col]) - Date.parse(b[q.order.col])));
        return q.lim ? src.slice(0, q.lim) : src;
      };
      const api = {
        select: () => api, in: () => api,
        eq: (c, v) => { q.eqs[c] = v; return api; },
        is: (c, v) => { if (v === null) q.isNull.push(c); return api; },
        gte: (c, v) => { q.gte = v; return api; },
        order: (c, o) => { q.order = { col: c, asc: !(o && o.ascending === false) }; return api; },
        limit(n) { q.lim = n; const p = Promise.resolve({ data: pick() }); p.maybeSingle = () => api.maybeSingle(); return p; },
        async maybeSingle() {
          if (table === 'vendors') return { data: vendorRow };
          if (table !== 'leads') return { data: null };
          const hit = pick();
          if (hit.length > 1) return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned' } }; // as PostgREST
          return { data: hit[0] || null };
        },
        insert: (row) => { writes.push({ table, op: 'insert', row }); return { select: () => ({ single: async () => ({ data: { id: `new-${table}` } }) }) }; },
        update: (row) => { writes.push({ table, op: 'update', row }); return api; },
      };
      return api;
    },
  };
}

const MINE = ['src/agent/engine.js', 'src/agent/coupleSystemPrompt.js', 'src/agent/coupleThreadFacts.js', 'src/lib/vendor/coupleDateState.js', 'src/lib/brideInbound.js', 'src/lib/vendor/doorLines.js'];
const purge = () => { for (const r of MINE) delete require.cache[require.resolve(P(r))]; };
const fresh = (r) => { purge(); return require(P(r)); };
async function mutated(rel, from, to, fn) {
  const f = P(rel); const before = fs.readFileSync(f, 'utf8');
  if (!before.includes(from)) { console.error(`MUTATION ANCHOR STALE in ${rel}: ${from.slice(0, 60)}`); process.exit(2); }
  fs.writeFileSync(f, before.replace(from, to)); purge();
  try { return await fn(); } finally { fs.writeFileSync(f, before); purge(); }
}

const V = 'v-dev440'; const PHONE = '+919625759924';
const lead = (id, name, state, created_at, deleted_at) => ({ id, vendor_id: V, phone: PHONE, name, state, created_at, deleted_at, intent_summary: null, intent_summary_at: null });
// his SELECT of 25 Sept: seven rows, six soft-deleted, one live (Sarah, booked)
const SEVEN = [
  lead('211606c7', 'Sarah', 'booked', '2026-08-25 10:00:00+00', '2026-08-25 21:50:13+00'),
  lead('b17ae785', 'Sarah', 'new', '2026-08-26 09:00:00+00', '2026-08-26 10:18:48+00'),
  lead('8df93b99', 'Priya', 'new', '2026-08-24 20:00:00+00', '2026-08-24 20:47:23+00'),
  lead('d8cf8ee0', 'Bandtest', 'new', '2026-08-26 12:00:00+00', '2026-08-26 12:38:18+00'),
  lead('7f218c37', 'Sarah', 'new', '2026-08-26 16:00:00+00', '2026-08-26 16:26:27+00'),
  lead('6a514c71', 'Bandtest2', 'new', '2026-08-26 16:50:00+00', '2026-08-26 17:05:00+00'),
  lead('88dbb52b', 'Sarah', 'booked', '2026-08-27 09:00:00+00', null),
];
const DEV440 = { id: V, business_name: 'Dev Roy Photography', category: 'Photographer', city: 'Delhi' };
const ON = { id: V, status: 'active', discover_paused: false, date_check_enabled: true };

async function turn({ leads, inbound = 'Hi', script = [], describe = null, at = '2026-09-25T12:49:12Z' }) {
  const realNow = Date.now; Date.now = () => Date.parse(at);
  CAPTURED.length = 0; SCRIPT = script.slice(); DESCRIBE = describe;
  const sb = store({ leads, rows: [{ conversation_id: 'c1', created_at: '2026-09-25 12:49:09+00', direction: 'inbound', sent_by: 'couple', body: inbound }], vendorRow: ON });
  try {
    const { runCoupleAgenticTurn } = fresh('src/agent/engine.js');
    const out = await runCoupleAgenticTurn({ vendor: DEV440, vendorUser: { name: 'Dev Roy', phone: '+910000000000' }, conversation: { id: 'c1' }, couplePhone: PHONE, coupleId: null, inboundMessage: inbound, supabase: sb, anthropic: null });
    return { out, sb, system: CAPTURED[0] && CAPTURED[0].system };
  } finally { Date.now = realNow; }
}

(async () => {
  sec('1 F-44.165 · the known client, over his seven rows');
  const t1 = await turn({ leads: SEVEN });
  T('1.1 six deleted rows and one live: she is the RETURNING client Sarah (was a stranger: .maybeSingle() over seven returned null)', !!t1.system && t1.system.includes('Sarah has reached out to Dev Roy Photography before'));
  const two = [...SEVEN, lead('newer', 'Sarah K', 'new', '2026-09-01 09:00:00+00', null)];
  const t2 = await turn({ leads: two });
  T('1.2 two live rows for one number: the NEWEST is read, never null (a duplicate cannot blank the answer)', !!t2.system && t2.system.includes('Sarah K has reached out'));
  // the live row UNNAMED (the capture path runs only for a client not yet "returning"), beside the six deleted rows
  const UNNAMED = SEVEN.map((r) => (r.deleted_at ? r : { ...r, name: null }));
  const t3 = await turn({ leads: UNNAMED, script: [{ name: 'capture_couple_lead', input: { name: 'Sarah', occasion: 'wedding' } }, { name: 'respond_to_couple', input: { message: 'ok' } }] });
  const leadInserts = t3.sb.writes.filter((w) => w.table === 'leads' && w.op === 'insert');
  T('1.3 F-44.165\'s second face: a capture from the known number (live row unnamed, six deleted) UPDATES her lead and inserts none (it inserted another before this cut)', leadInserts.length === 0 && t3.sb.writes.some((w) => w.table === 'leads' && w.op === 'update'));
  const t4 = await turn({ leads: SEVEN.filter((r) => r.deleted_at) });
  T('1.4 only deleted rows: a stranger again (deleted is not the client)', !!t4.system && !t4.system.includes('has reached out to Dev Roy Photography before'));

  sec('2 the vendor hears the house form (his line, F4)');
  const ds = fresh('src/lib/vendor/coupleDateState.js');
  const HIS = '{client} asked if you\'re free on {date}. I told them you\'d check and get back to them. To answer, send "Tell {client}" and your message.';
  T('2.1 his bytes, pinned: sha256 ' + sha(HIS).slice(0, 12), ds.VENDOR_DATE_LINE === HIS);
  const dq = 'Are you free on 5 march 2028';
  const b = await turn({ leads: SEVEN, inbound: dq, describe: { date: '2028-03-05', blocked: true, blocked_slots: [], occupancy: 'on', slots: [] }, script: [{ name: 'date_state', input: { date_as_spoken: '5 march 2028' } }, { name: 'respond_to_couple', input: { message: 'x' } }] });
  T('2.2 a booked date: the vendor is told, by name and date, in his words', b.out.vendorNotification && b.out.vendorNotification.includes('Sarah asked if you\'re free on 5 March 2028. I told them you\'d check and get back to them. To answer, send "Tell Sarah" and your message.'));
  const f = await turn({ leads: SEVEN, inbound: dq, describe: { date: '2028-03-05', blocked: false, blocked_slots: [], occupancy: 'on', slots: [] }, script: [{ name: 'date_state', input: { date_as_spoken: '5 march 2028' } }, { name: 'respond_to_couple', input: { message: 'x' } }] });
  T('2.3 a free date: no date line (she answered it herself)', !f.out.vendorNotification || !f.out.vendorNotification.includes('asked if you\'re free'));
  const u = await turn({ leads: [], inbound: 'free sometime next spring?', script: [{ name: 'date_state', input: { date_as_spoken: 'sometime next spring' } }, { name: 'respond_to_couple', input: { message: 'x' } }] });
  T('2.4 no lead and an unreadable date: "...9924" and her own words', u.out.vendorNotification && u.out.vendorNotification.includes('...9924 asked if you\'re free on sometime next spring.'));

  sec('3 F-44.145\'s persistence half · the bride\'s STOP on her own thread');
  const bi = fresh('src/lib/brideInbound.js');
  const bw = []; const bsb = { from(t) { const q = {}; const api = { select: () => api, eq: (c, v) => { q[c] = v; return api; }, async maybeSingle() {
    if (t === 'users') return { data: { id: 'u1' } }; if (t === 'couples') return { data: { id: 'cp1' } }; if (t === 'conversations') return { data: { id: 'cs1' } }; return { data: null }; },
    insert: (row) => { bw.push({ t, row }); return Promise.resolve({}); }, update: () => api }; return api; } };
  const core = { inboundRow: (row, sid) => ({ ...row, twilio_sid: sid }) };
  const r = await bi.persistBrideOptOutTurn({ supabase: bsb, webhookCore: core, phone: PHONE, body: 'STOP', reply: 'You will not hear from us again.', sent: { sid: 'SM1' }, messageSid: 'SMin' });
  T('3.1 her inbound (with its sid) and our confirmation, both on couple_self', r.persisted === true && bw.length === 2 && bw[0].row.conversation_id === 'cs1' && bw[0].row.sent_by === 'couple' && bw[0].row.twilio_sid === 'SMin' && bw[1].row.sent_by === 'agent' && bw[1].row.twilio_sid === 'SM1');
  const none = await bi.persistBrideOptOutTurn({ supabase: { from: () => ({ select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: null }; } }) }, webhookCore: core, phone: PHONE, body: 'STOP', reply: 'x' });
  const boom = await bi.persistBrideOptOutTurn({ supabase: { from() { throw new Error('down'); } }, webhookCore: core, phone: PHONE, body: 'STOP', reply: 'x' });
  T('3.2 no user writes nothing; a dead store never throws (the opt-out stands)', none.persisted === false && none.why === 'no_user' && boom.persisted === false && boom.why === 'error');
  const src = read('src/lib/brideInbound.js');
  T('3.3 both acknowledgments (stop and start) persist the turn', (src.match(/await persistBrideOptOutTurn\(/g) || []).length === 2);

  sec('4 R-45.23 · V1 to V8, his bytes');
  const DL = fresh('src/lib/vendor/doorLines.js');
  const HISV = {
    B4: 'Could not confirm the booking. No lead called {name}. Add {name} as a lead first, here or in the app.',
    B5: 'Could not confirm the booking. {client} has no package yet. Attach a package to {client} first.',
    B25: "Could not attach the package. {client} has no wedding date yet. Add {client}'s wedding date first.",
    B32: 'Could not attach the package. No lead called {name}. Add {name} as a lead first, here or in the app.',
    B33: 'Could not attach the package. {package} has no fee yet. Set its fee in the app first.',
    B39: 'Could not send the quote. {client} has no package yet. Attach a package to {client} first.',
    B60: 'No one called {name} on your team. Add {name} to your team in the app first.',
    B76: 'No lead called {name}. Add {name} as a lead first, here or in the app.',
  };
  T('4.1 the eight lines are his bytes exactly', Object.entries(HISV).every(([k, v]) => DL.LINES[k] === v));
  T('4.2 LINE_HASHES agree with every line (the hash law holds)', DL.assertLineHashes() === true && Object.keys(HISV).every((k) => DL.LINE_HASHES[k] === sha(HISV[k])));
  T('4.3 B33 names the package, and the attach plan carries its name to the refusal', DL.render('B33', { package: 'Silver' }) === 'Could not attach the package. Silver has no fee yet. Set its fee in the app first.' && /packageName: pkg\.name/.test(read('src/lib/vendor/workingDoor.js')) && /DL\.render\('B33', \{ package: a\.packageName \}\)/.test(read('src/lib/vendor/workingDoor.js')));
  T('4.4 V11 and V13 landed at cut 2b (B23, B31 numbered, his); V9, V10, V12, V14, V15 ride cut 2c: B8 and B53 keep their bytes (LABELED AMENDMENT, ELZ-1 cut 2b)', DL.LINES.B31 === 'Which package for {client}? {list}. Reply with the number.' && DL.LINES.B8.startsWith('Two clients are called {name}') && DL.LINES.B53.endsWith('Say the date.'));

  sec('5 the money functions byte-identical to b115\'s pins');
  const PIN = JSON.parse(read('scripts/b115_lcv15_lsp4_bench.js').match(/const PIN = (\{[^\n]*\});/)[1]);
  function body(t, name) {
    const i = t.search(new RegExp(`^(async )?function ${name}\\b`, 'm')); if (i < 0) return '';
    let j = t.indexOf('(', i); let d = 0;
    for (; j < t.length; j += 1) { if (t[j] === '(') d += 1; else if (t[j] === ')') { d -= 1; if (d === 0) break; } }
    const k = t.indexOf('{', j); d = 0;
    for (let m = k; m < t.length; m += 1) { if (t[m] === '{') d += 1; else if (t[m] === '}') { d -= 1; if (d === 0) return t.slice(i, m + 1); } }
    return '';
  }
  const wd = read('src/lib/vendor/workingDoor.js');
  T('5.1 planMoney, planPayment, planBooking, applyRow and reread byte-identical', ['planMoney', 'planPayment', 'planBooking', 'applyRow', 'reread'].every((fn) => sha(body(wd, fn)) === PIN[fn]));

  sec('6 mutations of production code');
  const m1 = await mutated('src/agent/engine.js', "    .eq('phone', couplePhone)\n    .is('deleted_at', null)\n    .order('created_at', { ascending: false })\n    .limit(1)\n    .maybeSingle();", "    .eq('phone', couplePhone)\n    .maybeSingle();", async () => (await turn({ leads: SEVEN })).system.includes('Sarah has reached out'));
  T('6.1 M1 the known-client read without the filter reddens 1.1 (Sarah a stranger again)', m1 === false);
  const m2 = await mutated('src/agent/engine.js', "          .eq('phone', couplePhone)\n          .is('deleted_at', null)\n          .order('created_at', { ascending: false })\n          .limit(1)\n          .maybeSingle();", "          .eq('phone', couplePhone)\n          .maybeSingle();", async () => (await turn({ leads: SEVEN.map((r) => (r.deleted_at ? r : { ...r, name: null })), script: [{ name: 'capture_couple_lead', input: { name: 'Sarah', occasion: 'wedding' } }, { name: 'respond_to_couple', input: { message: 'ok' } }] })).sb.writes.filter((w) => w.table === 'leads' && w.op === 'insert').length);
  T('6.2 M2 capture\'s read without the filter reddens 1.3 (another lead inserted)', m2 > 0);
  const m3 = await mutated('src/agent/engine.js', "    if (!last || last.state === 'free') return null;", "    if (!last || last.state !== 'free') return null;", async () => { const x = await turn({ leads: SEVEN, inbound: dq, describe: { date: '2028-03-05', blocked: true, blocked_slots: [], occupancy: 'on', slots: [] }, script: [{ name: 'date_state', input: { date_as_spoken: '5 march 2028' } }, { name: 'respond_to_couple', input: { message: 'x' } }] }); return !!(x.out.vendorNotification && x.out.vendorNotification.includes('asked if you')); });
  T('6.3 M3 the date line on free instead of not-free reddens 2.2 (the vendor never hears "let me check")', m3 === false);
  const m4 = await mutated('src/lib/brideInbound.js', "          await persistBrideOptOutTurn({ supabase, webhookCore, phone, body, reply: getNudgeCopy('full_stop_confirmation')", "          void ({ supabase, webhookCore, phone, body, reply: getNudgeCopy('full_stop_confirmation')", async () => (read('src/lib/brideInbound.js').match(/await persistBrideOptOutTurn\(/g) || []).length);
  T('6.4 M4 the stop branch without the write reddens 3.3', m4 === 1);
  T('6.5 every mutated file is restored', read('src/agent/engine.js').includes(".is('deleted_at', null)") && (read('src/lib/brideInbound.js').match(/await persistBrideOptOutTurn\(/g) || []).length === 2);

  console.log(`\nb118a_elz1_cut2a_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log('FAILED:'); failed.forEach((x) => console.log(`  ${x}`)); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
