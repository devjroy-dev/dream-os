'use strict';
// scripts/b137_g62_own_number_turn_bench.js · CE-46 · G6-2 · 2b · RUNG b137 · A COUPLE WRITES TO HER OWN NUMBER.
// Drives the SHIPPED modules (never copies): door.openFor, token.js, send.js (through the real metaCloud.sendMetaText and
// sendWa.defaultIsOptedOut), turn.handleOwnInbound, route.js, forward.js, wabaMap.isConnectedOwnNumber, and the REAL
// vendorInbound.processVendorInbound for F-44.207 (b). Meta and the model are stood in for at their edges only: a recording
// fetch and a recording turn. The database is scripts/lib/b137_pgdouble.js (C-44.3). No clock is read by a cell: every
// time is passed in. Each production mutation in §9 must turn its cell red and is restored byte for byte by sha.
// THE BOTH-SIDES CLAUSE: the turn is driven with the NEW caller's payload (counterparty + chatted_before), the shape
// ELZ-2's cut 1 receives; b137 pins that the turn gets exactly one extra bit from her private store and no text.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8'); const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const { makeDb } = require('./lib/b137_pgdouble');
// CE-46 G6-3 cut three (a), F-44.224: her token is now the one kept at the connect, sealed by tokenVault under INTEGRATION_TOKEN_KEY.
// The bench sets a test key (never a real one) before any module loads; §3 is re-pinned by label from T-c to the stored token.
process.env.INTEGRATION_TOKEN_KEY = 'b137'.repeat(16);
const vault = require(P('src/lib/vendor/tokenVault.js'));
let pass = 0, fail = 0;
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name}${info ? `\n        ${String(info).slice(0, 400)}` : ''}`); } };
const sec = (s) => console.log(`\n§${s}`);
const freshAll = () => { for (const k of Object.keys(require.cache)) if (k.startsWith(P('src'))) delete require.cache[k]; };
const fresh = (r) => { freshAll(); return require(P(r)); };

// ── the fixture: the founder's map (CE-46, 27 September), DEV440 on 8757788550, the bride 9625759924 ─────────────────
const VID = 'v-dev440'; const TOKEN_SYS = 'SYS-TOKEN-b137'; const TOKEN_BIZ = 'BIZ-TOKEN-b137'; const SECRET = 'app-secret-b137';
const ENV = { META_WABA_TOKEN: TOKEN_SYS, META_APP_SECRET: SECRET, OWN_NUMBER_WALK_VENDOR_ID: VID, VENDOR_SELF_URL: 'https://vendor.test', INTERNAL_REPLAY_SECRET: 'replay-b137' };
const LINES = { vendor: '+919000000001', bride: '+919000000002', marketing: '+919000000003' };
const resolveFrom = (l) => LINES[l] || null;
const HISTORY_TEXT = 'SENTINEL-HISTORY-TEXT-b137';
function seed(over = {}) {
  return {
    vendors: [{ id: VID, user_id: 'u-dev440', business_name: 'Dev Roy Photography', tier: 'signature', status: 'active', reply_quiet_minutes: 120, category: 'photography' }],
    users: [{ id: 'u-dev440', phone: '+919888294440', name: 'Dev Roy' }, { id: 'u-bride', phone: '+919625759924', name: 'Sarah' }, { id: 'u-anj', phone: '+918757788550', name: 'Anjali' }],
    vendor_wabas: [{ id: 'w1', vendor_id: VID, business_id: 'biz-dev440', waba_id: 'waba-1', phone_number_id: '106', display_number: '+91 87577 88550', connect_way: 'shared', status: 'active', business_token: vault.seal(TOKEN_BIZ) }],
    conversations: [{ id: 'th-bride', vendor_id: VID, counterparty_phone: '+919625759924', kind: 'couple_thread', channel: 'whatsapp', state: 'new', last_message_at: '2026-09-26T20:53:19Z' },
      { id: '9552a49c', vendor_id: VID, counterparty_phone: '+918757788550', kind: 'couple_thread', channel: 'whatsapp', state: 'new', last_message_at: '2026-09-15T20:35:05Z' }],
    leads: [{ id: 'ce4ca3ac', vendor_id: VID, name: 'Anjali', phone: '+918757788550', state: 'booked', deleted_at: null }],
    messages: [], team_members: [{ vendor_id: VID, phone: '98111 22233', deleted_at: null }], prospects: [],
    vendor_wa_events: [], failed_turns: [],
    ...over,
  };
}
const caps = (master = 'armed', tier = 'off') => ({ get: async (k) => (k === 'flag.own_number' ? (master ? { key: k, status: master } : null) : k === 'flag.own_number.signature' ? (tier ? { key: k, status: tier } : null) : null) });
const change = (from = '919625759924', id = 'wamid.A', body = 'Hi, are you free on 14 February 2027?') => ({ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { phone_number_id: '106' }, contacts: [{ profile: { name: 'Sarah' }, wa_id: from }], messages: [{ from, id, timestamp: '1790000000', type: 'text', text: { body } }] } });
const NOW = new Date('2026-09-28T10:00:00Z');
function metaFetch(calls, { tokenOk = true, sendOk = true } = {}) {
  let k = 0;
  return async (url, init) => {
    calls.push({ url, init });
    if (/system_user_access_tokens$/.test(url)) return { ok: tokenOk, status: tokenOk ? 200 : 403, json: async () => (tokenOk ? { access_token: TOKEN_BIZ } : { error: { message: '(#200) needs business_management' } }) };
    if (/\/messages$/.test(url)) return { ok: sendOk, status: sendOk ? 200 : 400, json: async () => (sendOk ? { messages: [{ id: `wamid.OUT${++k}` }] } : { error: { message: 'bad recipient' } }) };
    return { ok: false, status: 404, json: async () => ({}) };
  };
}
async function runCaller({ db, capApi = caps(), ch = change(), env = ENV, reply = 'Yes, Dev Roy Photography is free on 14 February 2027.', fetchOpts = {}, now = NOW } = {}) {
  freshAll();
  const T = require(P('src/lib/ownNumber/turn.js')); const S = require(P('src/lib/ownNumber/send.js'));
  const calls = []; const turns = []; const alerts = []; const dead = []; const logs = [];
  const fetchImpl = metaFetch(calls, fetchOpts);
  const orig = { log: console.log, warn: console.warn, error: console.error };
  const cap = (...a) => logs.push(a.map(String).join(' '));
  console.log = cap; console.warn = cap; console.error = cap;
  let r;
  try {
    r = await T.handleOwnInbound({ supabase: db, anthropic: {}, vendorId: VID, change: ch, env }, {
      capApi, resolveFrom, now: () => now,
      ensureCoupleRow: async (_s, phone) => ({ user_id: phone === '+919625759924' ? 'u-bride' : 'u-new', couple_id: 'cpl-1' }),
      runTurn: async (args) => { turns.push(args); return { reply, toolCalls: [{ name: 'date_state' }], vendorNotification: 'Sarah asked about 14 February 2027.', leadName: 'Sarah' }; },
      sendOnHerNumber: (a) => S.sendOnHerNumber({ ...a, deps: { fetchImpl } }),
      sendVendorEnquiryAlert: async (a) => { alerts.push(a); return { sent: true }; },
      scrubModelFrame: (t) => `[scrubbed] ${t}`,
      captureDeadLetter: async (a) => { dead.push(a); return { ok: true }; },
      leadsLink: 'https://thedreamwedding.in/vendor/leads',
    });
  } finally { Object.assign(console, orig); }
  return { r, calls, turns, alerts, dead, logs };
}
const msgs = (db) => db.tables.messages || [];
const wroteTo = (db, t) => db.writes.filter((w) => w.table === t);

(async () => {
  // ── §1 boundary ─────────────────────────────────────────────────────────────────────────────────────────────────
  sec('1  boundary: what this cut touches, what it must not');
  // C-44.7: the cell pins what cannot move, the packet's own committed manifest, never a base against the working tree
  // (which would redden the day another seat's landed cut touches one of these files).
  const manifest = read('scripts/floor-manifest-ce46-g62-2b.txt').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const FORBIDDEN = ['src/lib/sendWa.js', 'src/lib/metaCloud.js', 'src/agent/engine.js', 'src/lib/vendor/relayToCouple.js', 'src/lib/ownNumber/events.js', 'src/lib/ownNumber/meta.js', 'src/lib/metaInbound.js', 'src/lib/vendor/workingDoor.js'];
  ok(manifest.length === 17 && manifest.every((f) => fs.existsSync(P(f))) && FORBIDDEN.every((f) => !manifest.includes(f)),
    '1.1 the packet\u2019s manifest names its 17 paths, all present, and no money, engine, relay, sendWa, metaCloud, events, meta, metaInbound or workingDoor file', manifest.filter((f) => FORBIDDEN.includes(f)).join(','));
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  const vi = strip(read('src/lib/vendorInbound.js'));
  ok((vi.match(/isConnectedOwnNumber/g) || []).length === 1 && /if \(!vendor\) \{\s*if \(await require\('\.\/ownNumber\/wabaMap'\)\.isConnectedOwnNumber\(supabase, phone\)\)/.test(vi),
    '1.2 vendorInbound.js holds exactly ONE own-number guard, the first statement of its couple branch (F-44.207 (b), one bounded hunk)');
  const ix = strip(read('src/index.js'));
  ok(/app\.post\(own\.ROUTE, own\.ownInboundRoute\(\{ supabase, anthropic \}\)\)/.test(ix) && !/ownNumber\/turn/.test(ix), '1.3 index.js only MOUNTS the route; the handler lives in src/lib/ownNumber/route.js');
  const route = fresh('src/lib/ownNumber/route.js');
  ok(route.ROUTE === '/internal/own-number/inbound' && route.ROUTE !== '/webhook/meta', '1.4 the route is new and is never /webhook/meta (F6 (a))');

  // ── §2 the one gate ─────────────────────────────────────────────────────────────────────────────────────────────
  sec('2  door.js openFor, the one gate (F7 (a))');
  const D = fresh('src/lib/ownNumber/door.js');
  const G = (m, t, id, status, env = ENV) => D.openFor({ masterRow: m ? { status: m } : null, tierRow: t ? { status: t } : null, vendorId: id, env, status }).open;
  ok(G('on', 'on', 'other') && !G('on', 'off', 'other') && !G('on', null, 'other') && !G('off', 'on', 'other') && !G(null, 'on', 'other'),
    '2.1 on AND her tier on opens for any vendor; on with her tier off or absent, off, or no row: shut');
  ok(G('armed', 'off', VID) && !G('armed', 'on', 'other') && !G('armed', 'off', VID, undefined, { ...ENV, OWN_NUMBER_WALK_VENDOR_ID: '' }),
    '2.2 walk mode still answers for the walk vendor only');
  ok(G('on', 'on', 'x', 'active') && !G('on', 'on', 'x', 'pending') && !G('on', 'on', 'x', 'suspended') && !G('on', 'on', 'x', 'migrated_out') && !G('armed', null, VID, 'suspended') && G('on', 'on', 'x', undefined),
    '2.3 at the answering seam only an active number answers; the door and connect (no status) are unchanged by it');

  // ── §3 T-c: her business token ──────────────────────────────────────────────────────────────────────────────────
  sec('3  token.js: her business token, stored at the connect and sealed (re-pinned by label, CE-46 G6-3 cut three (a); T-c retired)');
  // THE BOTH-SIDES CLAUSE: the old T-c cells (3.1 to 3.4: POST system_user_access_tokens, 60 s memory, scope refusal, app secret)
  // drove a shape production refused ((#33), 28 September W1) and that no caller now sends; they are RETIRED, not kept.
  const TK = fresh('src/lib/ownNumber/token.js');
  ok(TK.businessTokenFor({ vendor_id: VID, business_token: vault.seal(TOKEN_BIZ) }) === TOKEN_BIZ && TK._reset === undefined,
    '3.1 (re-pinned) her token opens from the sealed column; no memory cache, no fetch');
  let nt = null; try { TK.businessTokenFor({ vendor_id: VID, business_token: null }); } catch (e) { nt = e; }
  ok(nt && nt.name === 'TokenError' && nt.reason === 'no_token', '3.2 (re-pinned) a row with no stored token refuses as no_token');
  let unop = null; try { TK.businessTokenFor({ vendor_id: VID, business_token: 'v1.x.y.z' }); } catch (e) { unop = e; }
  ok(unop && unop.reason === 'unopenable' && !String(unop.message).includes(TOKEN_BIZ), '3.3 (re-pinned) a seal that will not open refuses as unopenable, carrying no token');
  ok(!/system_user_access_tokens|META_WABA_TOKEN|fetch_only/.test(read('src/lib/ownNumber/token.js').replace(/\/\/.*$/gm, '')), '3.4 (re-pinned) token.js calls no Meta endpoint and reads no system token (comment-stripped)');

  // ── §4 the send from her number ─────────────────────────────────────────────────────────────────────────────────
  sec('4  send.js: from her PNID, her token, no prefix, opt-out first');
  const S = fresh('src/lib/ownNumber/send.js'); const S2 = S;
  const scalls = []; const sdb = makeDb(seed());
  const TEXT = 'Yes, Dev Roy Photography is free on 14 February 2027.';
  const sent = await S2.sendOnHerNumber({ row: seed().vendor_wabas[0], to: '+919625759924', text: TEXT, supabase: sdb, env: ENV, deps: { fetchImpl: metaFetch(scalls) } });
  const post = scalls.find((c) => /\/messages$/.test(c.url)); const pb = post && JSON.parse(post.init.body);
  ok(post && post.url === 'https://graph.facebook.com/v25.0/106/messages' && post.init.headers.Authorization === `Bearer ${TOKEN_BIZ}` && pb.to === '919625759924' && pb.text.body === TEXT && sent[0].wamid === 'wamid.OUT1',
    '4.1 POST /v25.0/<her PNID>/messages with HER business token; the body is the reply byte for byte, no "{studio}: " prefix; to in E.164 digits through the one POST');
  const odb = makeDb(seed({ prospects: [{ phone: '919625759924', state: 'opted_out' }] })); const ocalls = []; let oref = null;
  try { await S2.sendOnHerNumber({ row: seed().vendor_wabas[0], to: '+919625759924', text: 'x', supabase: odb, env: ENV, deps: { fetchImpl: metaFetch(ocalls) } }); } catch (e) { oref = e; }
  ok(oref && oref.reason === 'opted_out' && ocalls.length === 0, '4.2 an opted-out couple is refused before any Meta call (sendWa.defaultIsOptedOut, the one read)');
  let sref = null; const pcalls = [];
  try { await S2.sendOnHerNumber({ row: { ...seed().vendor_wabas[0], status: 'suspended' }, to: '+919625759924', text: 'x', supabase: sdb, env: ENV, deps: { fetchImpl: metaFetch(pcalls) } }); } catch (e) { sref = e; }
  ok(sref && pcalls.length === 0, '4.3 a suspended number sends nothing (§7b constraint 3)');
  const parts = S.splitText(`${'a'.repeat(4000)} ${'b'.repeat(200)}`);
  ok(parts.length === 2 && parts.every((p) => p.length <= 4096) && S.splitText('   ').length === 0, '4.4 a reply over Meta\u2019s 4096 characters splits at a space; an empty reply is no part');
  let bad = null; const bcalls = [];
  try { await S2.sendOnHerNumber({ row: seed().vendor_wabas[0], to: '+91962575', text: 'x', supabase: sdb, env: ENV, deps: { fetchImpl: metaFetch(bcalls) } }); } catch (e) { bad = e; }
  ok(bad && !bcalls.some((c) => /\/messages$/.test(c.url)), '4.5 a short number is refused by R-40.91\u2019s guard at the one POST, never sent');

  // ── §5 the caller ───────────────────────────────────────────────────────────────────────────────────────────────
  sec('5  turn.js: the caller, driven end to end on the founder\u2019s fixture');
  let db = makeDb(seed());
  let R = await runCaller({ db });
  const inb = msgs(db).filter((m) => m.direction === 'inbound'); const outb = msgs(db).filter((m) => m.direction === 'outbound');
  ok(R.r.outcome === 'sent' && db.tables.conversations.length === 2 && !wroteTo(db, 'conversations').some((w) => w.op === 'insert'),
    '5.1 the bride already has TDW\u2019s-line thread th-bride: it is REUSED, no second thread (F1 (a); F-44.195 avoided)', JSON.stringify(R.r));
  ok(db.tables.conversations.find((c) => c.id === 'th-bride').channel === 'whatsapp' && inb.length === 1 && inb[0].conversation_id === 'th-bride'
    && inb[0].channel === 'whatsapp_own' && inb[0].message_sid === 'wamid.A' && inb[0].sent_by === 'couple',
    '5.2 the thread stays channel whatsapp; her words are one inbound row stamped whatsapp_own with the wamid as message_sid');
  const a = R.turns[0] || {};
  // RE-PINNED BY LABEL at the carry onto da9c7ef: ELZ-2 cut 1 r2 (dc1dfd1) landed the signature, and chatted_before lives INSIDE
  // counterparty (TDW_CE46_ELZ2_CUT1_HANDOVER.md §1), not beside it.
  const KEYS = ['anthropic', 'conversation', 'counterparty', 'coupleId', 'couplePhone', 'inboundMessage', 'supabase', 'vendor', 'vendorUser'];
  ok(R.turns.length === 1 && JSON.stringify(Object.keys(a).sort()) === JSON.stringify(KEYS)
    && JSON.stringify(a.counterparty) === JSON.stringify({ channel: 'whatsapp_own', phone: '+919625759924', igsid: null, chatted_before: false }) && a.conversation.id === 'th-bride',
    '5.3 the turn gets the shared line\u2019s arguments plus EXACTLY counterparty { whatsapp_own, phone, igsid: null, chatted_before }, ELZ-2\u2019s landed signature', JSON.stringify(Object.keys(a)));
  // THE BOTH-SIDES CLAUSE: the SHIPPED resolveCounterparty (engine.js, not exported; its own bytes read out by name and run)
  // handed the payload this caller recorded. It must read the channel and the one bit exactly as sent.
  const rcSrc = (read('src/agent/engine.js').match(/function resolveCounterparty\(counterparty, couplePhone\) \{[\s\S]*?\n\}/) || [])[0];
  const rc = rcSrc ? new Function(`${rcSrc}; return resolveCounterparty;`)() : null;
  const seenTrue = rc && rc({ ...a.counterparty, chatted_before: true }, a.couplePhone);
  const seenFalse = rc && rc(a.counterparty, a.couplePhone);
  ok(!!rc && seenTrue.channel === 'whatsapp_own' && seenTrue.chattedBefore === true && seenTrue.phone === '+919625759924' && seenTrue.igsid === null
    && seenFalse.chattedBefore === false && rc({ channel: 'whatsapp_own', phone: '+919625759924', igsid: null }, '+919625759924').chattedBefore === false,
    '5.3b ELZ-2\u2019s shipped resolveCounterparty reads this caller\u2019s payload as whatsapp_own, her phone, and the one bit as sent', rcSrc ? '' : 'resolveCounterparty not found in engine.js');
  ok(outb.length === 1 && outb[0].channel === 'whatsapp_own' && outb[0].message_sid === 'wamid.OUT1' && outb[0].body === 'Yes, Dev Roy Photography is free on 14 February 2027.' && outb[0].sent_by === 'agent',
    '5.4 the reply is recorded as sent: one outbound row, whatsapp_own, its wamid, the exact bytes sent');
  ok(R.alerts.length === 1 && R.alerts[0].toPhone === '+919888294440' && R.alerts[0].text === '[scrubbed] Sarah asked about 14 February 2027.' && R.alerts[0].vendorId === VID,
    '5.5 the vendor\u2019s notice goes to HER TDW WhatsApp (her login phone), scrubbed by the shared line\u2019s own scrubModelFrame');
  ok(!R.logs.some((l) => l.includes(TOKEN_BIZ) || l.includes(TOKEN_SYS)) && !JSON.stringify(db.tables).includes(TOKEN_BIZ),
    '5.6 (re-labelled, cut three) her token IN CLEAR is in no log line and no table: stored sealed, never plain');
  const anj = db.tables.conversations.find((c) => c.id === '9552a49c'); const lead = db.tables.leads[0];
  ok(anj.last_message_at === '2026-09-15T20:35:05Z' && lead.state === 'booked' && lead.deleted_at === null && !db.writes.some((w) => w.table === 'leads'),
    '5.7 Anjali\u2019s thread 9552a49c and lead ce4ca3ac (8757788550 as a client) are untouched by the lane');

  sec('5b the one bit from her private store (F3 (b), his Q4)');
  const hist = (id) => ({ vendor_id: VID, kind: 'history', received_at: '2026-09-27T09:00:00Z', payload: { history: [{ metadata: { phase: 1 }, threads: [{ id, messages: [{ from: id, type: 'text', text: { body: HISTORY_TEXT } }] }] }] } });
  for (const [label, id] of [['digits', '919625759924'], ['+ form', '+919625759924']]) {
    db = makeDb(seed({ vendor_wa_events: [hist('919999999999'), hist(id)] })); R = await runCaller({ db });
    ok(R.turns[0] && R.turns[0].counterparty.chatted_before === true && !JSON.stringify(R.turns[0], (k, v) => (k === 'supabase' || k === 'anthropic' ? undefined : v)).includes(HISTORY_TEXT),
      `5b.1 (${label}) a history thread with her number: chatted_before is true, and none of the history\u2019s text reaches the turn`);
  }
  db = makeDb(seed({ vendor_wa_events: [hist('919999999999')] })); R = await runCaller({ db });
  ok(R.turns[0] && R.turns[0].counterparty.chatted_before === false, '5b.2 history with other numbers only: false');
  db = makeDb(seed(), { failReads: {} }); db.from = ((orig) => (t) => (t === 'vendor_wa_events' ? { select: () => { const b = { eq: () => b, gte: () => b, contains: () => b, limit: () => Promise.resolve({ data: null, error: { message: 'down' } }) }; return b; } } : orig(t)))(db.from);
  R = await runCaller({ db });
  ok(R.r.outcome === 'quiet' && R.turns.length === 0, '5b.3 a failed read of her store stays quiet rather than talk over her (the quiet read fails first)');

  sec('5c silence: the gate and the senders that are not couples');
  for (const [label, capApi] of [['flag off', caps('off', 'on')], ['on, tier off', caps('on', 'off')], ['armed, not the walk vendor', caps('armed', 'on')]]) {
    db = makeDb(seed()); R = await runCaller({ db, capApi, env: label.startsWith('armed') ? { ...ENV, OWN_NUMBER_WALK_VENDOR_ID: 'someone-else' } : ENV });
    ok(R.r.outcome === 'closed' && R.turns.length === 0 && db.writes.length === 0 && R.calls.length === 0, `5c.1 ${label}: recorded and silent (F8 (a)): no row, no turn, no Meta call`);
  }
  db = makeDb(seed({ vendor_wabas: [{ ...seed().vendor_wabas[0], status: 'suspended' }] })); R = await runCaller({ db, capApi: caps('on', 'on') });
  ok(R.r.outcome === 'closed' && R.turns.length === 0 && db.writes.length === 0, '5c.2 a suspended number is silent');
  db = makeDb(seed()); R = await runCaller({ db, ch: change('919888294440', 'wamid.S') });
  ok(R.r.outcome === 'self' && R.turns.length === 0 && db.writes.length === 0, '5c.3 her own login phone (9888294440) writing to her own number: silent, no thread (F5 (a))');
  db = makeDb(seed()); R = await runCaller({ db, ch: change('919000000001', 'wamid.T') });
  ok(R.r.outcome === 'tdw_line' && R.turns.length === 0 && db.writes.length === 0, '5c.4 TDW\u2019s own vendor line writing to her number: silent (F-44.207 (a))');
  db = makeDb(seed()); R = await runCaller({ db, ch: change('919811122233', 'wamid.C') });
  ok(R.r.outcome === 'crew' && R.turns.length === 0 && db.writes.length === 0, '5c.5 a member of her team, stored as "98111 22233": silent (F4, crew by phone)');
  db = makeDb(seed({ team_members: [{ vendor_id: VID, phone: '98111 22233', deleted_at: '2026-09-01T00:00:00Z' }] })); R = await runCaller({ db, ch: change('919811122233', 'wamid.C2') });
  ok(R.r.outcome === 'sent', '5c.6 a deleted team member is a couple again (control for 5c.5)');

  sec('5d once, and quiet time');
  db = makeDb(seed()); await runCaller({ db }); R = await runCaller({ db });
  ok(R.r.outcome === 'duplicate' && R.turns.length === 0 && msgs(db).filter((m) => m.direction === 'inbound').length === 1, '5d.1 Meta redelivers wamid.A: the UNIQUE message_sid stops it at 23505; one turn, one row');
  const echo = (to, at) => ({ vendor_id: VID, kind: 'echo', received_at: at, payload: { message_echoes: [{ from: '918757788550', to, id: 'wamid.E', type: 'text', text: { body: 'Thanks, I will check.' } }] } });
  for (const [label, to] of [['digits', '919625759924'], ['+ form', '+919625759924']]) {
    db = makeDb(seed({ vendor_wa_events: [echo(to, '2026-09-28T09:00:01Z')] })); R = await runCaller({ db });
    ok(R.r.outcome === 'quiet' && R.turns.length === 0 && msgs(db).filter((m) => m.direction === 'inbound').length === 1,
      `5d.2 (${label}) she replied from WhatsApp Business 1h59m ago (quiet 2 hours): recorded, no turn`);
  }
  db = makeDb(seed({ vendor_wa_events: [echo('919625759924', '2026-09-28T07:59:59Z')] })); R = await runCaller({ db });
  ok(R.r.outcome === 'sent', '5d.3 her echo 2h00m01s ago: the turn answers (control for 5d.2)');
  db = makeDb(seed({ vendor_wa_events: [echo('919111111111', '2026-09-28T09:30:00Z')] })); R = await runCaller({ db });
  ok(R.r.outcome === 'sent', '5d.4 an echo to a DIFFERENT couple does not quiet this one');
  db = makeDb(seed({ messages: [{ id: 'm0', conversation_id: 'th-bride', direction: 'outbound', sent_by: 'vendor_relay', created_at: '2026-09-28T09:30:00Z', body: 'x' }] })); R = await runCaller({ db });
  ok(R.r.outcome === 'quiet' && R.turns.length === 0, '5d.5 a relay she sent through TDW on this thread 30 minutes ago also quiets it');
  db = makeDb(seed({ vendors: [{ ...seed().vendors[0], reply_quiet_minutes: 60 }], vendor_wa_events: [echo('919625759924', '2026-09-28T08:30:00Z')] })); R = await runCaller({ db });
  ok(R.r.outcome === 'sent', '5d.6 her setting of 1 hour is read from its one home (an echo 90 minutes ago no longer quiets)');

  sec('5e new couple, failure, and nothing false');
  db = makeDb(seed()); R = await runCaller({ db, ch: change('919876543210', 'wamid.N') });
  const made = wroteTo(db, 'conversations').filter((w) => w.op === 'insert');
  ok(R.r.outcome === 'sent' && made.length === 1 && made[0].rows[0].counterparty_phone === '+919876543210' && made[0].rows[0].kind === 'couple_thread' && made[0].rows[0].channel === undefined,
    '5e.1 a couple TDW has never seen: one couple_thread, the shared line\u2019s key and form, channel left to its default');
  db = makeDb(seed()); R = await runCaller({ db, fetchOpts: { sendOk: false } });
  ok(R.r.outcome === 'send_failed' && msgs(db).filter((m) => m.direction === 'outbound').length === 0 && R.dead.length === 1 && R.dead[0].service === 'own-number-turn',
    '5e.2 Meta refuses the send: a dead letter, NO outbound row (never a false "sent")');
  db = makeDb(seed({ vendor_wabas: [{ ...seed().vendor_wabas[0], business_token: null }] })); R = await runCaller({ db });
  ok(R.r.outcome === 'send_failed' && R.dead.length === 1 && /no business token/.test(String(R.dead[0].error && R.dead[0].error.message)) && msgs(db).filter((m) => m.direction === 'outbound').length === 0,
    '5e.3 (re-pinned, cut three) her row holds no token (connected before the cure): a dead letter naming it, nothing sent');
  const Tm = fresh('src/lib/ownNumber/turn.js');
  const img = { field: 'messages', value: { messages: [{ from: '919625759924', id: 'w', type: 'image', image: {} }] } };
  ok(Tm.textMessageOf(img) === null && (await Tm.handleOwnInbound({ supabase: makeDb(seed()), vendorId: VID, change: img })).outcome === 'not_text', '5e.4 a non-text message gets no turn (recorded by the receiver only)');

  // ── §6 the route, §7 the receiver's forward ────────────────────────────────────────────────────────────────────
  sec('6  route.js: only the ingress may call it');
  const RT = fresh('src/lib/ownNumber/route.js');
  const res = () => { const o = { code: null, body: null, status(c) { o.code = c; return o; }, send(b) { o.body = b; return o; } }; return o; };
  const handled = []; const h = RT.ownInboundRoute({ supabase: {}, anthropic: {}, env: ENV, handle: async (a) => { handled.push(a); return { outcome: 'sent' }; },
    isInternal: (req) => req.headers['x-internal-replay'] === ENV.INTERNAL_REPLAY_SECRET });
  const r1 = res(); await h({ headers: {}, body: { vendor_id: VID, change: change() } }, r1);
  const r2 = res(); await h({ headers: { 'x-internal-replay': ENV.INTERNAL_REPLAY_SECRET }, body: { change: change() } }, r2);
  const r3 = res(); await h({ headers: { 'x-internal-replay': ENV.INTERNAL_REPLAY_SECRET }, body: { vendor_id: VID, change: change() } }, r3);
  ok(r1.code === 403 && r2.code === 400 && r3.code === 200 && handled.length === 1 && handled[0].vendorId === VID, '6.1 without the ingress header 403; no vendor_id 400; the ingress 200 and the caller runs once');
  const realGate = fresh('src/lib/webhookCore.js').isInternalReplay;
  const saved = process.env.INTERNAL_REPLAY_SECRET; delete process.env.INTERNAL_REPLAY_SECRET;
  const forged = realGate({ headers: { 'x-internal-replay': '' } }) || realGate({ headers: { 'x-internal-replay': 'anything' } });
  if (saved !== undefined) process.env.INTERNAL_REPLAY_SECRET = saved;
  ok(forged === false, '6.2 the real trust rule: with INTERNAL_REPLAY_SECRET unset no header opens the route');

  sec('7  forward.js: recorded first, then only couples\u2019 messages, to the new route');
  const F = fresh('src/lib/ownNumber/forward.js');
  const fcalls = []; const fdead = []; const cdl = async (x) => { fdead.push(x); };
  const own = { vendor_id: VID };
  await F.forwardOwn({ own, change: change(), env: ENV, fetchImpl: async (u, i) => { fcalls.push({ u, i }); return { ok: true, status: 200 }; }, captureDeadLetter: cdl, supabase: {} });
  const fb = fcalls[0] && JSON.parse(fcalls[0].i.body);
  ok(fcalls.length === 1 && fcalls[0].u === 'https://vendor.test/internal/own-number/inbound' && fcalls[0].i.headers['x-internal-replay'] === 'replay-b137' && fb.vendor_id === VID && fb.change.value.messages[0].id === 'wamid.A',
    '7.1 a couple\u2019s message goes to VENDOR_SELF_URL + /internal/own-number/inbound with the ingress header, carrying vendor_id from the map');
  for (const fld of ['smb_message_echoes', 'history', 'smb_app_state_sync', 'account_update']) await F.forwardOwn({ own, change: { field: fld, value: { messages: [{}] } }, env: ENV, fetchImpl: async () => { fcalls.push(1); return { ok: true }; }, captureDeadLetter: cdl, supabase: {} });
  await F.forwardOwn({ own, change: { field: 'messages', value: { statuses: [{}] } }, env: ENV, fetchImpl: async () => { fcalls.push(1); return { ok: true }; }, captureDeadLetter: cdl, supabase: {} });
  ok(fcalls.length === 1, '7.2 echoes, history, contacts, account events and delivery statuses are never forwarded');
  await F.forwardOwn({ own, change: change(), env: ENV, fetchImpl: async () => ({ ok: false, status: 502 }), captureDeadLetter: cdl, supabase: {} });
  await F.forwardOwn({ own, change: change(), env: { ...ENV, VENDOR_SELF_URL: '' }, fetchImpl: async () => ({ ok: true }), captureDeadLetter: cdl, supabase: {} });
  ok(fdead.length === 2 && fdead.every((x) => x.service === 'ingress-forward:own'), '7.3 a failed or unconfigured forward is a dead letter');
  const mi = strip(read('src/marketingIndex.js'));
  const i1 = mi.indexOf('ownNumberEvents.handle(supabase, own, change); kept = true;'); const i2 = mi.indexOf('if (kept) await ownNumberForward.forwardOwn(');
  ok(i1 > 0 && i2 > i1 && (mi.match(/ownNumberForward\.forwardOwn\(/g) || []).length === 1, '7.4 the receiver forwards only after events.js recorded the change, at one site');

  // ── §8 F-44.207 (b), the REAL shared-line handler ──────────────────────────────────────────────────────────────
  sec('8  vendorInbound.js: a connected own number writing to TDW\u2019s line gets no couple turn (F-44.207 (b))');
  async function driveShared(from) {
    freshAll();
    const { processVendorInbound, metaInputsFrom } = require(P('src/lib/vendorInbound.js'));
    const webhookCore = require(P('src/lib/webhookCore.js')); require(P('src/lib/ownNumber/wabaMap.js'))._resetActive();
    const sdb2 = makeDb(seed({ vendors: [] }));
    const seen = { ensure: 0, turn: 0, sends: [] };
    const noop = async () => ({});
    const deps = {
      supabase: sdb2, anthropic: {}, webhookCore,
      sendWhatsApp: async (p, t) => { seen.sends.push({ p, t }); return { sid: 'X' }; },
      runTurn: async () => ({ reply: 'x' }), runCoupleAgenticTurn: async () => { seen.turn++; return { reply: 'x' }; },
      resolveAgentForVendor: async () => 'ag1', fetchCalendarSnapshot: noop, fetchScratchpad: noop, fetchLeadPings: async () => '',
      buildLlmForTurn: async () => ({}), applyCalendarSignals: async () => ({ suffix: '' }), generateInvoiceForBinder: noop, enquiryToBinder: noop,
      ensureCoupleRow: async () => { seen.ensure++; throw new Error('b137 stop after the routing decision'); }, captureField: noop,
      buildDisambiguationQuestion: () => 'q', interpretDisambiguationReply: () => ({}), vendorDisplayName: () => 'v', matchModeWord: () => null,
      applyModeFlip: noop, MODE_FLIP_LINES: {}, matchFreshWord: () => false, FRESH_THREAD_LINE: '', abandonActiveThread: async () => ({ ok: true }),
      checkImageThrottle: async () => ({ allowed: true }), markRejectionSent: noop, extractCalendarFromImage: noop,
    };
    const orig = { log: console.log, warn: console.warn, error: console.error }; console.log = () => {}; console.warn = () => {}; console.error = () => {};
    try { await processVendorInbound(metaInputsFrom({ from, text: 'Hi', messageId: `wamid.${from}`, type: 'text', media: [] }, { entry: [] }), deps); } catch (_e) { /* the plant stops after the decision */ }
    finally { Object.assign(console, orig); }
    return { seen, db: sdb2 };
  }
  const own8 = await driveShared('918757788550'); const ctl8 = await driveShared('919111111111');
  ok(own8.seen.ensure === 0 && own8.seen.turn === 0 && own8.seen.sends.length === 0 && own8.db.writes.length === 0 && ctl8.seen.ensure === 1,
    '8.1 8757788550 (connected, active) on TDW\u2019s line: no couple identity, no turn, no send, no write; an unconnected sender reaches the couple branch (control)', JSON.stringify({ own: own8.seen, ctl: ctl8.seen }));
  const W = fresh('src/lib/ownNumber/wabaMap.js'); W._resetActive();
  const wdb = makeDb(seed({ vendor_wabas: [{ ...seed().vendor_wabas[0], status: 'suspended' }] }));
  ok(!(await W.isConnectedOwnNumber(wdb, '+918757788550', () => 1)), '8.2 a suspended own number is not guarded: only ACTIVE rows count');
  W._resetActive(); const cdb = makeDb(seed());
  await W.isConnectedOwnNumber(cdb, '+918757788550', () => 1); await W.isConnectedOwnNumber(cdb, '+919111111111', () => 60_000);
  const reads1 = cdb.reads.length; await W.isConnectedOwnNumber(cdb, '+919111111111', () => 60_001);
  ok(reads1 === 1 && cdb.reads.length === 2, '8.3 the active-number set is read at most once per 60 s');
  W._resetActive(); const fdb = makeDb(seed(), { failReads: { vendor_wabas: true } });
  ok((await W.isConnectedOwnNumber(fdb, '+918757788550', () => 1)) === false, '8.4 a failed read answers false: the shared lane behaves as before this cut');

  // ── §9 mutations of production code ────────────────────────────────────────────────────────────────────────────
  sec('9  mutations of production code (each must turn its cell red; restored byte for byte)');
  const mutate = async (rel, pairs, probe) => {
    const src = read(rel); const before = sha(src); let m = src;
    for (const [from, to] of pairs) { if (!m.includes(from)) return { applied: false }; m = m.replace(from, to); }
    fs.writeFileSync(P(rel), m);
    let red; try { freshAll(); red = !(await probe()); } catch (_e) { red = true; } finally { fs.writeFileSync(P(rel), src); freshAll(); }
    return { applied: true, red, restored: sha(read(rel)) === before };
  };
  const out = [];
  out.push(['M1 the gate ignores her tier', await mutate('src/lib/ownNumber/door.js', [["if (master === 'on' && tier === 'on')", "if (master === 'on')"]],
    async () => !fresh('src/lib/ownNumber/door.js').openFor({ masterRow: { status: 'on' }, tierRow: { status: 'off' }, vendorId: 'x', env: ENV }).open)]);
  out.push(['M2 quiet time skipped', await mutate('src/lib/ownNumber/turn.js', [["if (await isQuiet({ supabase, vendor, thread, senderDigits, now: d.now })) { await touch(); return { outcome: 'quiet' }; }", '']],
    async () => { const x = makeDb(seed({ vendor_wa_events: [echo('919625759924', '2026-09-28T09:00:01Z')] })); const q = await runCaller({ db: x }); return q.r.outcome === 'quiet'; })]);
  out.push(['M3 the history row itself handed to the turn', await mutate('src/lib/ownNumber/turn.js',
    [["const h = await supabase.from('vendor_wa_events').select('id')", "const h = await supabase.from('vendor_wa_events').select('payload')"], ['if ((h.data || []).length) return true;', 'if ((h.data || []).length) return h.data;'], ['const chatted_before = (await chattedBefore({ supabase, vendorId, senderDigits })) === true;', 'const chatted_before = await chattedBefore({ supabase, vendorId, senderDigits });']],
    async () => { const x = makeDb(seed({ vendor_wa_events: [hist('919625759924')] })); const q = await runCaller({ db: x }); return q.turns[0].counterparty.chatted_before === true; })]);
  out.push(['M4 the receiver forwards echoes', await mutate('src/lib/ownNumber/forward.js', [["return !!change && change.field === 'messages' &&", "return !!change && (change.field === 'messages' || true) &&"]],
    async () => !fresh('src/lib/ownNumber/forward.js').forwardable({ field: 'smb_message_echoes', value: { messages: [{}] } }))]);
  out.push(['M5 a studio prefix on her number', await mutate('src/lib/ownNumber/send.js', [['r = await send({ to, text: part },', "r = await send({ to, text: 'Dev Roy Photography: ' + part },"]],
    async () => { const c = []; const s = fresh('src/lib/ownNumber/send.js'); await s.sendOnHerNumber({ row: seed().vendor_wabas[0], to: '+919625759924', text: 'Hello', supabase: makeDb(seed()), env: ENV, deps: { fetchImpl: metaFetch(c) } }); return JSON.parse(c.find((z) => /\/messages$/.test(z.url)).init.body).text.body === 'Hello'; })]);
  out.push(['M6 the vendorInbound guard removed', await mutate('src/lib/vendorInbound.js', [["      if (await require('./ownNumber/wabaMap').isConnectedOwnNumber(supabase, phone)) {", '      if (false) {']],
    async () => (await driveShared('918757788550')).seen.ensure === 0)]);
  out.push(['M7 her own login phone answered', await mutate('src/lib/ownNumber/turn.js', [["return 'self';", "return 'couple';"]],
    async () => (await runCaller({ db: makeDb(seed()), ch: change('919888294440', 'wamid.S') })).r.outcome === 'self')]);
  out.push(['M8 a second thread for the same couple', await mutate('src/lib/ownNumber/turn.js', [[".eq('vendor_id', vendorId).eq('counterparty_phone', phone).eq('kind', 'couple_thread').maybeSingle();", ".eq('vendor_id', vendorId).eq('counterparty_phone', 'none').eq('kind', 'couple_thread').maybeSingle();"]],
    async () => { const x = makeDb(seed()); await runCaller({ db: x }); return x.tables.conversations.length === 2; })]);
  out.push(['M9 a failed send recorded as sent', await mutate('src/lib/ownNumber/turn.js', [["    return { outcome: 'send_failed' };", "    sent = [{ text: reply, wamid: null }];"]],
    async () => { const x = makeDb(seed()); await runCaller({ db: x, fetchOpts: { sendOk: false } }); return msgs(x).filter((m) => m.direction === 'outbound').length === 0; })]);
  out.push(['M10 the one bit sent beside counterparty (the pre-landing shape)', await mutate('src/lib/ownNumber/turn.js', [["counterparty: { channel: 'whatsapp_own', phone, igsid: null, chatted_before },", "counterparty: { channel: 'whatsapp_own', phone, igsid: null }, chatted_before,"]],
    async () => { const x = makeDb(seed({ vendor_wa_events: [hist('919625759924')] })); const q = await runCaller({ db: x }); const t = q.turns[0];
      const src2 = (read('src/agent/engine.js').match(/function resolveCounterparty\(counterparty, couplePhone\) \{[\s\S]*?\n\}/) || [])[0];
      return new Function(`${src2}; return resolveCounterparty;`)()(t.counterparty, t.couplePhone).chattedBefore === true; })]);
  for (const [name, r] of out) ok(r.applied && r.red && r.restored, `9 ${name}: applies, turns its cell red, restored by sha`, JSON.stringify(r));

  console.log(`\nb137 · ${pass} pass · ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('b137 crashed:', e && e.stack); process.exit(2); });
