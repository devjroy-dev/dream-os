'use strict';
// scripts/b136_igd2_ig_reply_bench.js · TDW CE-46 · IGD-2 · CUT 2b (dream-os) · rung b136.
// WHAT IT HOLDS: the Instagram lane's caller (igReply.js) and its hand-off (igInbound.receive), the route's wiring and dead-letter
// catch (index.js, read as text; requiring it would boot the server), failedTurns.js's refusal to replay an Instagram turn, and 0175.
// The database is an in-memory double that returns rows the way PostgREST does (C-44.3); fetch is faked; the turn is a double. No
// network, no key, no model call, no file written. `--mutate` compiles each named production mutation IN MEMORY and requires the
// named cell to redden (A-45.4: nothing on disk is ever mutated). THE EXIT CODE IS THE VERDICT.
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ROOT = path.join(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
const MUTATE = process.argv.includes('--mutate');

function loadAt(rel, src) { const f = P(rel); const m = new Module(f, module); m.filename = f; m.paths = Module._nodeModulePaths(path.dirname(f)); m._compile(src, f); return m.exports; }

// the lane gate is read through igInbound; its capability is stubbed OFF, so only the allowlist opens it (b119b's way)
const capPath = require.resolve(P('src/lib/capabilities.js'));
require.cache[capPath] = { id: capPath, filename: capPath, loaded: true, exports: { on: () => false } };
require(P('src/lib/webhookCore.js'))._setSidColumnPresent(true);

// ── the database double ─────────────────────────────────────────────────────────────────────────────────────────────────────
function makeDb(seed) {
  const T = JSON.parse(JSON.stringify(seed));
  const unique = { messages: ['message_sid'] };
  let n = 0;
  function q(table) {
    const st = { table, filters: [], op: 'select', payload: null, orderBy: null, lim: null };
    const rows = () => (T[table] || []).filter((r) => st.filters.every((f) => f(r)));
    const api = {
      select() { return api; },
      eq(c, v) { st.filters.push((r) => r[c] === v); return api; },
      is(c, v) { st.filters.push((r) => (r[c] === undefined ? null : r[c]) === v); return api; },
      order(c, o) { st.orderBy = { c, asc: !o || o.ascending !== false }; return api; },
      limit(k) { st.lim = k; return api; },
      insert(p) { st.op = 'insert'; st.payload = p; return api; },
      update(p) { st.op = 'update'; st.payload = p; return api; },
      async maybeSingle() { const r = await run(); if (r.error) return r; const d = Array.isArray(r.data) ? r.data : [r.data]; return { data: d[0] || null, error: null }; },
      then(res, rej) { return run().then(res, rej); },
    };
    async function run() {
      if (st.op === 'insert') {
        const row = { id: `row${(n += 1)}`, created_at: new Date(Date.UTC(2026, 8, 27, 6, 0, n)).toISOString(), ...st.payload };
        for (const c of (unique[table] || [])) {
          if (row[c] != null && (T[table] || []).some((r) => r[c] === row[c])) return { data: null, error: { message: `duplicate key value violates unique constraint "${table}_${c}_key"` } };
        }
        (T[table] = T[table] || []).push(row); return { data: [row], error: null };
      }
      if (st.op === 'update') { const hit = rows(); hit.forEach((r) => Object.assign(r, st.payload)); return { data: hit, error: null }; }
      let out = rows();
      if (st.orderBy) out = out.slice().sort((a, b) => (a[st.orderBy.c] < b[st.orderBy.c] ? -1 : 1) * (st.orderBy.asc ? 1 : -1));
      if (st.lim != null) out = out.slice(0, st.lim);
      return { data: out, error: null };
    }
    return api;
  }
  return { from: q, T };
}

const V = 'v-440'; const C = 'c-ig-1'; const IGSID = 'IGSID_COUPLE'; const ACC = 'ACC_DEV440';
const NOW = Date.UTC(2026, 8, 27, 12, 0, 0);
function seed(over = {}) {
  return {
    vendor_ig_connections: [{ vendor_id: V, ig_user_id: ACC, dm_state: 'on' }],
    conversations: [{ id: C, vendor_id: V, kind: 'couple_thread', channel: 'instagram', counterparty_ig_id: IGSID, ig_stopped_at: null }],
    vendors: [{ id: V, user_id: 'u-440', business_name: 'Dev Roy Photography', routing_handle: 'DEV440', enquiry_routing: 'tdw', enquiry_phone: null, reply_quiet_minutes: 120 }],
    users: [{ id: 'u-440', name: 'Dev', phone: '+919999900000' }],
    messages: [], leads: [], failed_turns: [],
    ...over,
  };
}
function harness(db, { reply = 'Hi! You have reached Dev Roy Photography. What is the occasion?', turnThrows = false, tokOk = true } = {}) {
  const log = { turns: [], posts: [], alerts: [], dead: [] };
  let mid = 0;
  const deps = {
    supabase: db, anthropic: {}, nowMs: () => NOW, leadsLink: 'https://x/vendor/leads',
    fetchImpl: async (url, init) => { log.posts.push({ url, body: JSON.parse(init.body) }); mid += 1; return { ok: true, status: 200, json: async () => ({ message_id: `mid${mid}` }) }; },
    runTurn: async (input) => { log.turns.push(input); if (turnThrows) throw new Error('turn threw'); return { reply, toolCalls: [{ name: 'respond_to_couple' }], vendorNotification: 'New enquiry on Instagram. Wedding in Jaipur. Lead saved.', leadName: null }; },
    tokenForCall: async () => (tokOk ? { ok: true, accessToken: 'TOK', igUserId: ACC } : { ok: false, error: 'expired' }),
    findByIgUserId: async () => ({ ok: true, vendorId: V }),
    sendAlert: async (a) => { log.alerts.push(a); return { sent: true }; },
    scrub: (t) => `[scrubbed] ${t}`,
    captureDeadLetter: async (a) => { log.dead.push(a); },
    gracefulLine: 'GRACEFUL',
  };
  return { deps, log };
}

// ── the cells ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
async function cells(mods) {
  const R = []; const ok = (c, name, info) => R.push({ name, pass: !!c, info });
  const IG = mods.igReply; const IN = mods.igInbound;
  const args = (text, over = {}) => ({ vendorId: V, conversationId: C, igsid: IGSID, text, receivedAtMs: NOW - 5000, ...over });

  // 1 · boot and wiring
  const idx = read('src/index.js');
  ok(typeof IG.reply === 'function' && typeof IG.deadLetter === 'function' && typeof IN.receive === 'function', '1.1 the caller and the hand-off load and export');
  ok(/igInbound\.receive\(supabase, msg, process\.env, igLaneDeps\)/.test(idx) && /igReply\.deadLetter\(igLaneDeps, \{ msg, payload: req\.body, error: e \}\)/.test(idx)
    && idx.indexOf("res.status(200).send('ok')", idx.indexOf("app.post('/webhook/instagram'")) < idx.indexOf('igInbound.receive('), '1.2 the route answers 200 first, then receives each DM, with a per-message dead-letter catch');
  ok(/gracefulLine: webhookCore\.GRACEFUL_TURN_LINE/.test(idx) && /runTurn: \(input\) => runCoupleAgenticTurn\(input\)/.test(idx), '1.3 the failed-turn line is read from its one home; the turn is the couple turn');

  // 2 · no text, gates
  let db = makeDb(seed()); let h = harness(db);
  let r = await IG.reply(h.deps, args('   '));
  ok(r.why === 'no_text' && h.log.turns.length === 0 && h.log.posts.length === 0, '2.1 a DM with no text runs no turn and sends nothing');
  db = makeDb(seed({ vendor_ig_connections: [{ vendor_id: V, ig_user_id: ACC, dm_state: 'off' }] })); h = harness(db);
  r = await IG.reply(h.deps, args('Hi'));
  ok(r.why === 'switch_off' && h.log.turns.length === 0, '2.2 her switch off: no turn (the room is the only gate on Instagram, Q2 = 1)');
  db = makeDb(seed()); h = harness(db, { tokOk: false });
  r = await IG.reply(h.deps, args('Hi'));
  ok(r.why === 'token' && h.log.turns.length === 0 && h.log.posts.length === 0, '2.3 an unusable token: no turn, nothing sent');

  // 3 · STOP and START (Q1 = 1)
  db = makeDb(seed()); h = harness(db);
  r = await IG.reply(h.deps, args('STOP'));
  const conv = () => db.T.conversations.find((c) => c.id === C);
  ok(r.why === 'stop' && conv().ig_stopped_at && h.log.turns.length === 0, '3.1 STOP sets ig_stopped_at and runs no turn');
  ok(h.log.posts.length === 1 && h.log.posts[0].body.message.text === "Okay, you won't get any more automatic replies here. Dev Roy Photography will reply to you themselves. Send START if you want them back."
    && h.log.posts[0].body.recipient.id === IGSID, '3.2 IG-S1 goes to the couple, the studio named, verbatim');
  r = await IG.reply(h.deps, args('Is 5 March free?'));
  ok(r.why === 'stopped' && h.log.turns.length === 0 && h.log.posts.length === 1, '3.3 while stopped, no turn and nothing sent');
  r = await IG.reply(h.deps, args('Start'));
  ok(r.why === 'start' && conv().ig_stopped_at === null && h.log.posts[1].body.message.text === 'Okay, replies are back on.', '3.4 START clears it and sends IG-S2');
  r = await IG.reply(h.deps, args('Cancel the mehendi please'));
  ok(r.why === 'sent' && h.log.turns.length === 1, '3.5 a sentence with a stop word in it is not a STOP (the whole-message matcher)');
  db = makeDb(seed()); h = harness(db);
  r = await IG.reply(h.deps, args('START'));
  ok(r.why === 'sent' && h.log.turns.length === 1, '3.6 START from a couple who never stopped runs the turn as usual');

  // 4 · the quiet time (Q4)
  db = makeDb(seed({ messages: [{ id: 'e1', conversation_id: C, sent_by: 'vendor', direction: 'outbound', created_at: new Date(NOW - 30 * 60e3).toISOString(), message_sid: 'her1' }] })); h = harness(db);
  r = await IG.reply(h.deps, args('Thanks!'));
  ok(r.why === 'quiet' && h.log.turns.length === 0, '4.1 she replied herself 30 minutes ago (quiet 120): no turn');
  db = makeDb(seed({ messages: [{ id: 'e1', conversation_id: C, sent_by: 'vendor', direction: 'outbound', created_at: new Date(NOW - 3 * 3600e3).toISOString(), message_sid: 'her1' }] })); h = harness(db);
  r = await IG.reply(h.deps, args('Thanks!'));
  ok(r.why === 'sent' && h.log.turns.length === 1, '4.2 three hours later: the turn runs');
  ok(IG.inQuiet(new Date(NOW - 59 * 60e3).toISOString(), 60, NOW) && !IG.inQuiet(new Date(NOW - 61 * 60e3).toISOString(), 60, NOW)
    && IG.inQuiet(new Date(NOW - 100 * 60e3).toISOString(), 999, NOW) && !IG.inQuiet('not a date', 120, NOW), '4.3 the quiet reads her minutes; an unknown value falls back to 120; a bad time is never quiet');

  // 5 · the turn's input (the joint ruling)
  db = makeDb(seed()); h = harness(db);
  await IG.reply(h.deps, args('Hi'));
  const inp = h.log.turns[0] || {};
  ok(inp.counterparty && inp.counterparty.channel === 'instagram' && inp.counterparty.phone === null && inp.counterparty.igsid === IGSID
    && !('useEliza' in inp) && !('couplePhone' in inp) && !('coupleId' in inp) && !('enquireLink' in inp) && inp.inboundMessage === 'Hi' && inp.conversation && inp.conversation.id === C,
    '5.1 the counterparty { instagram, phone null, igsid, enquireLink } and her text; nothing else new (D2 ruled; pinned to dc1dfd1)');
  const { ENQUIRE_BASE, enquireLinkFor } = require(P('src/lib/discover/shapeVendor.js'));
  ok(inp.counterparty && inp.counterparty.enquireLink === enquireLinkFor({ tdwLink: ENQUIRE_BASE + 'DEV440', enquiry_routing: 'tdw', enquiry_phone: null }) && /^https:\/\/wa\.me\/\d+\?text=TDW-DEV440$/.test(inp.counterparty.enquireLink), '5.2 the WhatsApp link is the fifth fact, vendorCard.js\u2019s call (TDW line with her handle)');
  ok(IG.studioLink({ routing_handle: 'X', enquiry_routing: 'own_number', enquiry_phone: '9876543210' }) === 'https://wa.me/919876543210', '5.3 with her own number live, the link is her own number (F6 (b))');

  // 6 · the send and the record (F-44.192)
  const long = 'Namaste! ' + 'We would love to shoot your wedding in Jaipur. '.repeat(40) + 'Thank you.';
  db = makeDb(seed()); h = harness(db, { reply: long });
  r = await IG.reply(h.deps, args('Tell me more'));
  const out = db.T.messages.filter((m) => m.direction === 'outbound');
  ok(r.why === 'sent' && h.log.posts.length === 2 && out.length === 2, '6.1 a long reply goes as two parts and two rows');
  ok(out.every((m, i) => m.message_sid === `mid${i + 1}` && m.sent_by === 'agent' && m.channel === 'instagram' && m.conversation_id === C), '6.2 each part\u2019s message_id is in message_sid, sent_by agent, channel instagram');
  ok(out[0].tool_calls && !out[1].tool_calls, '6.3 the tool calls ride the first part only');
  ok(h.log.posts.map((p) => p.body.message.text).join(' ') === long.trim().replace(/\s+/g, ' ') && !/^Dev Roy Photography:/.test(h.log.posts[0].body.message.text), '6.4 the words are the turn\u2019s, never reworded, with no studio prefix');
  db = makeDb(seed({ messages: [{ id: 'echo', conversation_id: C, sent_by: 'vendor', direction: 'outbound', body: 'x', message_sid: 'mid1', created_at: new Date(NOW - 1000).toISOString() }] }));
  h = harness(db);
  const how = await IG.claimOutbound(db, C, 'Hi there', 'mid1', null);
  const row = db.T.messages.find((m) => m.message_sid === 'mid1');
  ok(how === 'claimed' && row.sent_by === 'agent' && db.T.messages.length === 1, '6.5 our echo landed first: the row is claimed back as the agent\u2019s, never the vendor\u2019s');

  // 7 · the notice and the window (F2 (a)+(b))
  db = makeDb(seed()); h = harness(db);
  await IG.reply(h.deps, args('Hi'));
  ok(h.log.alerts.length === 1 && h.log.alerts[0].toPhone === '+919999900000' && h.log.alerts[0].text === '[scrubbed] New enquiry on Instagram. Wedding in Jaipur. Lead saved.'
    && h.log.alerts[0].ctx === 'igReply:notification', '7.1 the vendor\u2019s notice goes to her TDW WhatsApp through the one enquiry door, scrubbed');
  db = makeDb(seed({ leads: [{ vendor_id: V, counterparty_ig_id: IGSID, name: 'Sara', deleted_at: null, created_at: '2026-09-20T00:00:00Z' }] })); h = harness(db);
  r = await IG.reply(h.deps, args('Hi', { receivedAtMs: NOW - 25 * 3600e3 }));
  ok(r.why === 'window' && h.log.posts.length === 0 && db.T.messages.filter((m) => m.direction === 'outbound').length === 0, '7.2 outside 24 hours nothing is sent or recorded as sent');
  ok(h.log.alerts.length === 1 && h.log.alerts[0].text === 'An Instagram message from Sara is waiting for your reply. Instagram only allows a reply within 24 hours of their last message.', '7.3 and she is told, V2 verbatim, with the lead\u2019s name');

  // 8 · the hand-off (igInbound.receive, F1 (a))
  const env = { IG_DM_WALK_VENDOR_IDS: V };
  const inbound = (over = {}) => ({ accountId: ACC, igsid: IGSID, mid: `in${Math.random()}`, text: 'Hi', echo: false, ...over });
  db = makeDb(seed()); let calls = [];
  const rdeps = { nowMs: () => NOW, reply: async (a) => { calls.push(a); return { why: 'sent' }; } };
  let rr = await IN.receive(db, inbound({ echo: true }), env, rdeps);
  ok(rr.recorded.ok && rr.reply === null && calls.length === 0, '8.1 an echo (her own reply) is recorded and runs no turn');
  const m1 = inbound({ mid: 'same' });
  rr = await IN.receive(db, m1, env, rdeps);
  const firstCalls = calls.length;
  rr = await IN.receive(db, m1, env, rdeps);
  ok(firstCalls === 1 && rr.recorded.dup && rr.reply === null && calls.length === 1, '8.2 Meta\u2019s retry of the same mid runs no second turn');
  ok(calls[0] && calls[0].igsid === IGSID && calls[0].text === 'Hi' && calls[0].receivedAtMs === NOW && calls[0].vendorId === V, '8.3 the caller gets the thread, the sender, the text and the receipt time');
  rr = await IN.receive(db, inbound(), {}, rdeps);
  ok(!rr.recorded.ok && rr.recorded.why === 'lane_closed' && calls.length === 1, '8.4 the lane closed: not recorded, no turn');
  db = makeDb(seed()); const order = [];
  const slow = { nowMs: () => NOW, reply: async (a) => { order.push(`start:${a.text}`); await new Promise((z) => setTimeout(z, 20)); order.push(`end:${a.text}`); return {}; } };
  await Promise.all([IN.receive(db, inbound({ text: 'A' }), env, slow), IN.receive(db, inbound({ text: 'B' }), env, slow)]);
  ok(order.join(',') === 'start:A,end:A,start:B,end:B', '8.5 two DMs on one thread run one after the other (the thread\u2019s turn lock)', order.join(','));

  // 9 · the dead letter (F7 (a))
  db = makeDb(seed()); h = harness(db);
  await IG.deadLetter(h.deps, { msg: inbound(), payload: { object: 'instagram' }, error: new Error('x') });
  ok(h.log.dead.length === 1 && h.log.dead[0].service === 'instagram' && h.log.dead[0].phone === null, '9.1 a thrown turn is dead-lettered as service instagram');
  ok(h.log.posts.length === 1 && h.log.posts[0].body.message.text === 'GRACEFUL' && h.log.posts[0].body.recipient.id === IGSID, '9.2 the failed-turn line goes to the couple');
  h = harness(db); h.deps.captureDeadLetter = async () => { throw new Error('boom'); };
  let threw = false; try { await IG.deadLetter(h.deps, { msg: inbound({ echo: true }), payload: {}, error: new Error('x') }); } catch (_e) { threw = true; }
  ok(!threw && h.log.posts.length === 0, '9.3 it never throws, and an echo gets no line');

  // 10 · failedTurns.js refuses an Instagram replay
  const ftRes = await mods.replay('instagram');
  ok(ftRes.status === 409 && ftRes.body.code === 'replay_refused_instagram' && ftRes.fetched === 0, '10.1 an Instagram dead letter is refused, never re-driven');
  const ftVendor = await mods.replay('vendor');
  ok(ftVendor.fetched === 1, '10.2 control: a vendor dead letter is still replayed to its door');

  // 11 · 0175 and the copy
  const mig = read('db/migrations/0175_ig_dm_stop.sql').split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
  ok(/ALTER TABLE public\.conversations ADD COLUMN IF NOT EXISTS ig_stopped_at timestamptz;/.test(mig) && !/CREATE TABLE|DROP|ROW LEVEL|GRANT|REVOKE/i.test(mig) && /BEGIN;[\s\S]*COMMIT;/.test(mig), '11.1 0175 adds one nullable column in one transaction; no table, no RLS or grant change');
  ok(Object.values(IG.COPY).every((s) => !/[\u2013\u2014]/.test(s)), '11.2 the lane\u2019s lines carry no dash');
  return R;
}

// ── failedTurns.js driven through its router, with requireAdmin and fetch doubled ──────────────────────────────────────────
function replayWith(ftExports) {
  return async (service) => {
    const router = ftExports; const layer = router.stack.find((l) => l.route && l.route.path === '/:id/replay');
    const handler = layer.route.stack[layer.route.stack.length - 1].handle;
    let fetched = 0;
    process.env.INTERNAL_REPLAY_SECRET = 'S'; process.env.VENDOR_SELF_URL = 'http://self';
    const db = makeDb({ failed_turns: [{ id: 'f1', service, phone: null, payload: {}, state: 'dead' }] });
    db.from = ((orig) => (t) => { const q = orig(t); const s = q.maybeSingle; q.single = s; return q; })(db.from);
    const out = {};
    const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
    const req = { params: { id: 'f1' }, app: { locals: { supabase: db, replayFetch: async () => { fetched += 1; return { ok: true, status: 200, text: async () => 'ok' }; } } } };
    await new Promise((resolve) => { const r = handler(req, res, resolve); Promise.resolve(r).then(resolve, resolve); });
    return { ...out, fetched };
  };
}
const adminPath = require.resolve(P('src/api/admin/requireAdmin.js'));
require.cache[adminPath] = { id: adminPath, filename: adminPath, loaded: true, exports: (_q, _s, next) => next() };

// ── the mutations (production code, compiled in memory; each must redden its cell) ─────────────────────────────────────────
const MUTATIONS = [
  { id: 'M1', file: 'src/lib/instagram/igReply.js', from: "  if (!body.trim()) return { ran: false, why: 'no_text' };\n", to: '', cell: '2.1' },
  { id: 'M2', file: 'src/lib/instagram/igReply.js', from: "  if (conversation.ig_stopped_at) return { ran: false, why: 'stopped' };\n", to: '', cell: '3.3' },
  { id: 'M3', file: 'src/lib/instagram/igReply.js', from: "if (lastVendor && inQuiet(", to: "if (false && inQuiet(", cell: '4.1' },
  { id: 'M4', file: 'src/lib/instagram/igReply.js', from: 'sent_by: \'agent\', message_sid: mid };', to: "sent_by: 'agent' };", cell: '6.2' },
  { id: 'M5', file: 'src/lib/instagram/igReply.js', from: '  if (!igSend.withinWindow(receivedAtMs, deps.nowMs())) {', to: '  if (false) {', cell: '7.2' },
  { id: 'M6', file: 'src/lib/instagram/igInbound.js', from: ' || recorded.echo) return', to: ') return', cell: '8.1' },
  { id: 'M7', file: 'src/lib/instagram/igInbound.js', from: "withTurnLock(turnKey('instagram', recorded.conversationId), () => deps.reply(", to: "((_k, fn) => fn())(0, () => deps.reply(", cell: '8.5' },
  { id: 'M8', file: 'src/api/admin/failedTurns.js', from: "  if (row.service === 'instagram') return errRes(", to: "  if (false) return errRes(", cell: '10.1' },
  { id: 'M9', file: 'src/lib/instagram/igReply.js', from: "service: 'instagram', phone: null", to: "service: 'vendor', phone: null", cell: '9.1' },
  { id: 'M11', file: 'src/lib/instagram/igReply.js', from: "    counterparty: { channel: 'instagram', phone: null, igsid, enquireLink: link },", to: "    useEliza: true, counterparty: { channel: 'instagram', phone: null, igsid, enquireLink: link },", cell: '5.1' },
  { id: 'M12', file: 'src/lib/instagram/igReply.js', from: "igsid, enquireLink: link },", to: "igsid }, enquireLink: link,", cell: '5.2' },
  { id: 'M10', file: 'src/lib/instagram/igReply.js', from: "  const u = await supabase.from('messages').update({ sent_by: 'agent', direction: 'outbound', body: part })", to: "  const u = await supabase.from('messages').update({})", cell: '6.5' },
];

function freshMods(mut) {
  const src = (rel) => { let s = read(rel); if (mut && mut.file === rel) { if (s.indexOf(mut.from) < 0) throw new Error(`${mut.id} anchor not found`); s = s.replace(mut.from, mut.to); } return s; };
  // igReply requires igSend etc. from disk; igInbound and failedTurns are compiled fresh so a mutation reaches them
  const igReply = loadAt('src/lib/instagram/igReply.js', src('src/lib/instagram/igReply.js'));
  const igInbound = loadAt('src/lib/instagram/igInbound.js', src('src/lib/instagram/igInbound.js'));
  const ft = loadAt('src/api/admin/failedTurns.js', src('src/api/admin/failedTurns.js'));
  return { igReply, igInbound, replay: replayWith(ft) };
}

(async () => {
  let fail = 0;
  const base = await cells(freshMods(null));
  console.log('b136 · the Instagram lane\u2019s caller (CE-46 IGD-2 cut 2b)');
  for (const c of base) { console.log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass || c.info === undefined ? '' : `  [${c.info}]`}`); if (!c.pass) fail += 1; }
  console.log(`\nb136: ${base.length - fail} passed, ${fail} failed`);
  if (MUTATE) {
    console.log('\nmutations (each must redden its cell; nothing on disk is written)');
    let mfail = 0;
    for (const m of MUTATIONS) {
      let red = false; let why = '';
      try { const res = await cells(freshMods(m)); const c = res.find((x) => x.name.startsWith(`${m.cell} `)); red = !!c && !c.pass; why = c ? '' : 'cell missing'; } catch (e) { why = e.message; }
      console.log(`  ${red ? 'RED (good)' : 'GREEN (BAD)'}  ${m.id} -> cell ${m.cell}${why ? `  [${why}]` : ''}`);
      if (!red) mfail += 1;
    }
    console.log(`\nb136 --mutate: ${MUTATIONS.length - mfail} of ${MUTATIONS.length} reddened`);
    if (mfail) fail += mfail;
  }
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('b136 threw:', e && e.stack); process.exit(1); });
