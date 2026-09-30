'use strict';
// scripts/b141_g63_business_token_bench.js · CE-46 · G6-3 · CUT THREE · RUNG b141.
// (a) F-44.224, the token cure (ruled 28 September 2026: F-a1 (a) tokenVault, F-a2 (c) no expiry column, F-a3 (a) re-exchange in
//     place, F-a4 null on GONE, F-a5 T-c removed and the token masked). (b) F-44.196's vendor limb (F-b1).
// Drives the SHIPPED modules (never copies): connect.connect, token.businessTokenFor, send.sendOnHerNumber (through the real
// metaCloud.sendMetaText), turn.handleOwnInbound, events.handle, route.ownInboundRoute. Meta is a recording fetch; the model is a
// recording turn; the database is scripts/lib/b137_pgdouble.js (C-44.3). No clock is read by a cell.
// THE BOTH-SIDES CLAUSE: every cell drives the NEW shape (the token kept at the connect); the T-c shape is retired in b137 §3.
// Each production mutation in §8 must turn its cell red and is restored byte for byte by sha. THE EXIT CODE IS THE VERDICT.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8'); const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
process.env.INTEGRATION_TOKEN_KEY = 'b141'.repeat(16); // a test key, never a real one; set before any module loads
const { makeDb } = require('./lib/b137_pgdouble');
let pass = 0, fail = 0;
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name}${info ? `\n        ${String(info).slice(0, 400)}` : ''}`); } };
const sec = (s) => console.log(`\n§${s}`);
const freshAll = () => { for (const k of Object.keys(require.cache)) if (k.startsWith(P('src'))) delete require.cache[k]; };
const fresh = (r) => { freshAll(); return require(P(r)); };
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const quiet = async (fn) => { const logs = []; const o = { log: console.log, warn: console.warn, error: console.error }; const cap = (...a) => logs.push(a.map(String).join(' ')); console.log = cap; console.warn = cap; console.error = cap; try { return { v: await fn(), logs }; } finally { Object.assign(console, o); } };

const VID = 'v-dev440'; const BIZ = 'EAAG-her-business-token-b141-0986'; const SYS = 'SYS-TOKEN-b141';
const ENV = { META_APP_ID: '1425513376067685', OWN_NUMBER_CONFIG_ID: '1141937505166584', META_APP_SECRET: 'app-secret-b141', OWN_NUMBER_WALK_VENDOR_ID: VID, META_GRAPH_VERSION: 'v25.0' };
const vault = require(P('src/lib/vendor/tokenVault.js'));
const ARMED = { get: async (k) => (k === 'flag.own_number' ? { key: k, status: 'armed' } : null) };
const BODY = { code: 'CODE', event: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING', waba_id: '2929843900974351', phone_number_id: null, business_id: '1634281561824806' };
function meta(calls, { sendOk = true } = {}) {
  return async (url, init = {}) => {
    const u = new URL(url); const step = u.pathname.split('/').slice(2).join('/');
    calls.push({ step, auth: (init.headers || {}).Authorization || null, body: init.body || null });
    const res = (status, body) => ({ ok: status < 400, status, json: async () => body });
    if (step === 'oauth/access_token') return res(200, { access_token: BIZ });
    if (step.endsWith('/phone_numbers')) return res(200, { data: [{ id: '106', display_phone_number: '+91 87577 88550' }] });
    if (step.endsWith('/messages')) return sendOk ? res(200, { messages: [{ id: 'wamid.OUT1' }] }) : res(400, { error: { message: '(#131047) Re-engagement message' } });
    return res(200, { success: true });
  };
}
const wabaRow = (over = {}) => ({ id: 'w1', vendor_id: VID, business_id: '1634281561824806', waba_id: '2929843900974351', phone_number_id: '106', display_number: '+91 87577 88550', connect_way: 'shared', status: 'active', ...over });
const seed = (over = {}) => ({
  vendors: [{ id: VID, user_id: 'u-dev440', business_name: 'Dev Roy Photography', tier: 'signature', status: 'active', reply_quiet_minutes: 120 },
    { id: 'v-swati', user_id: 'u-swati-alt', business_name: 'Swati', tier: 'signature', status: 'active' }],
  users: [{ id: 'u-dev440', phone: '+919888294440' }, { id: 'u-bride', phone: '+919625759924' }, { id: 'u-swati-alt', phone: '+918595356978' }],
  vendor_wabas: [wabaRow({ business_token: vault.seal(BIZ) })],
  conversations: [{ id: 'th-bride', vendor_id: VID, counterparty_phone: '+919625759924', kind: 'couple_thread', state: 'new' }],
  messages: [], team_members: [], prospects: [], vendor_wa_events: [], leads: [], failed_turns: [],
  ...over,
});
const change = (from) => ({ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { phone_number_id: '106' }, messages: [{ from, id: `wamid.${from}`, type: 'text', text: { body: 'hi' } }] } });
async function runCaller(db, from, fetchOpts = {}) {
  freshAll(); const T = require(P('src/lib/ownNumber/turn.js')); const S = require(P('src/lib/ownNumber/send.js'));
  const calls = []; const turns = []; const ensured = []; const dead = [];
  const { v, logs } = await quiet(() => T.handleOwnInbound({ supabase: db, anthropic: {}, vendorId: VID, change: change(from), env: ENV }, {
    capApi: ARMED, resolveFrom: () => null, now: () => new Date('2026-09-28T10:00:00Z'),
    // THE DOUBLE RAISES AS 0028's TRIGGER DOES (C-44.3): a vendor's user can never become a couple.
    ensureCoupleRow: async (_s, phone) => { ensured.push(phone); const u = db.tables.users.find((x) => x.phone === phone); if (u && db.tables.vendors.some((x) => x.user_id === u.id)) throw new Error(`[coupleIdentity] couples insert failed: user_id ${u.id} already registered as vendor`); return { user_id: u ? u.id : 'u-new', couple_id: 'c1' }; },
    runTurn: async (a) => { turns.push(a); return { reply: 'Yes, 14 February 2027 is free.', toolCalls: [] }; },
    sendOnHerNumber: (a) => S.sendOnHerNumber({ ...a, deps: { fetchImpl: meta(calls, fetchOpts) } }),
    sendVendorEnquiryAlert: async () => ({ sent: true }), scrubModelFrame: (t) => t,
    captureDeadLetter: async (a) => { dead.push(a); return { ok: true }; }, leadsLink: 'x',
  }));
  return { r: v, calls, turns, ensured, dead, logs };
}
async function runConnect(db, { vaultApi, fetchCalls = [] } = {}) {
  freshAll(); const C = require(P('src/lib/ownNumber/connect.js'));
  const args = { vendor: { id: VID, tier: 'signature' }, body: BODY, supabase: db, env: ENV, fetchImpl: meta(fetchCalls), capApi: ARMED, now: () => new Date('2026-09-28T10:32:00Z') };
  if (vaultApi) args.vault = vaultApi;
  const { v, logs } = await quiet(() => C.connect(args));
  return { r: v, calls: fetchCalls, logs };
}

(async () => {
  sec('1  the boundary and the one reader');
  const manifest = read('scripts/floor-manifest-ce46-g63-3.txt').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const FORBIDDEN = ['src/index.js', 'src/lib/vendorInbound.js', 'src/marketingIndex.js', 'src/agent/engine.js', 'src/lib/metaCloud.js', 'src/lib/sendWa.js', 'src/lib/ownNumber/meta.js', 'src/lib/ownNumber/wabaMap.js', 'src/lib/vendor/tokenVault.js'];
  ok(manifest.every((f) => fs.existsSync(P(f))) && FORBIDDEN.every((f) => !manifest.includes(f)),
    '1.1 the cut\u2019s manifest: every path present; no index, vendorInbound, receiver, engine, metaCloud, sendWa, meta, wabaMap or vault file', manifest.filter((f) => FORBIDDEN.includes(f)).join(','));
  // R-40.105: comment-stripped. The column is named only where it is written, nulled, read for presence, or opened.
  const own = fs.readdirSync(P('src/lib/ownNumber')).map((f) => `src/lib/ownNumber/${f}`);
  const namers = own.filter((f) => /business_token/.test(strip(read(f)))).sort();
  // RE-PINNED BY LABEL · CE-46 F-44.252 (b150 §10): removedSweep.js joins too; it opens only through token.js businessTokenFor.
  // RE-PINNED BY LABEL · CE-46 G6-4 (b150): remove.js joins the namers (hands her row to the opener, then nulls the column). It never
  // opens the seal itself: b150 §1 holds that it reaches the plaintext only through token.js businessTokenFor.
  ok(JSON.stringify(namers) === JSON.stringify(['src/lib/ownNumber/connect.js', 'src/lib/ownNumber/door.js', 'src/lib/ownNumber/events.js', 'src/lib/ownNumber/remove.js', 'src/lib/ownNumber/removedSweep.js', 'src/lib/ownNumber/token.js', 'src/lib/ownNumber/turn.js']),
    '1.2 business_token is named only by connect (writes, presence), door (presence, F-a3b), events (nulls), remove (hands her row to the opener, nulls), removedSweep (hands her row to the opener for the 7-day unsubscribe, nulls; F-44.252), turn (hands her row to send) and token (the ONE opener)', namers.join(','));
  const openers = own.filter((f) => /\.open\(/.test(strip(read(f))));
  ok(JSON.stringify(openers) === JSON.stringify(['src/lib/ownNumber/token.js']), '1.3 token.js is the only file that opens the seal', openers.join(','));
  { const dsrc = strip(read('src/lib/ownNumber/door.js')); const ret = (dsrc.match(/return \{\s*open,[\s\S]*?\};/) || [''])[0];
    ok(!/business_token/.test(strip(read('src/lib/ownNumber/wabaMap.js'))) && /!data\.business_token/.test(dsrc) && !/business_token/.test(ret) && !/business_token/.test((dsrc.match(/function numberView[\s\S]*?\n\}/) || [''])[0]),
      '1.4 the receiver\u2019s map never selects the secret; the door reads it for PRESENCE only: it is in neither the answer nor numberView'); }
  const tk = strip(read('src/lib/ownNumber/token.js')); const sd = strip(read('src/lib/ownNumber/send.js'));
  ok(!/system_user_access_tokens|META_WABA_TOKEN|fetch_only|fetch\(/.test(tk) && !/META_WABA_TOKEN/.test(sd), '1.5 T-c is gone: no system-user token fetch, and TDW\u2019s system token is off the send path');
  const mig = read('db/migrations/0180_own_number_business_token.sql'); const migS = strip(mig.replace(/^--.*$/gm, ''));
  ok(/BEGIN;\s*ALTER TABLE public\.vendor_wabas ADD COLUMN IF NOT EXISTS business_token text;\s*COMMIT;/.test(migS) && !/CREATE TABLE|DROP|GRANT|expires/i.test(migS),
    '1.6 0180 is one ALTER in one transaction: business_token text, no table, no drop, no grant, no expiry column (F-a2 (c))');

  sec('2  the connect keeps her token, sealed (F-a1 (a))');
  { const db = makeDb(seed({ vendor_wabas: [] })); const { r } = await runConnect(db);
    const row = db.tables.vendor_wabas[0]; const o = vault.open(row && row.business_token);
    ok(r.ok && row && o.ok && o.value === BIZ && !JSON.stringify(db.tables).includes(BIZ), '2.1 a first connect writes her row with the exchanged token SEALED: it opens to the exact bytes, and the clear token is in no table', JSON.stringify(r)); }
  { const db = makeDb(seed({ vendor_wabas: [] })); const calls = [];
    const { r } = await runConnect(db, { vaultApi: { isConfigured: () => false, seal: () => { throw new Error('no key'); } }, fetchCalls: calls });
    ok(!r.ok && r.reason === 'not_configured' && calls.length === 0 && db.tables.vendor_wabas.length === 0, '2.2 no valid vault key: refused not_configured BEFORE the 30-second code is exchanged; nothing written', JSON.stringify(r)); }
  { const { logs } = await quiet(async () => fresh('src/lib/ownNumber/route.js').ownInboundRoute({ supabase: {}, anthropic: {}, vault: { isConfigured: () => true } }));
    const { logs: l2 } = await quiet(async () => fresh('src/lib/ownNumber/route.js').ownInboundRoute({ supabase: {}, anthropic: {}, vault: { isConfigured: () => false } }));
    ok(logs.some((l) => /token vault configured/.test(l)) && l2.some((l) => /token vault NOT configured/.test(l)) && !logs.concat(l2).some((l) => /b141b141/.test(l)), '2.3 one boot line states the vault\u2019s state, never its key'); }

  sec('3  the re-exchange in place (F-a3 (a))');
  { const db = makeDb(seed({ vendor_wabas: [wabaRow({ business_token: null })] })); const calls = []; const { r, logs } = await runConnect(db, { fetchCalls: calls });
    const rows = db.tables.vendor_wabas; const o = vault.open(rows[0] && rows[0].business_token);
    ok(r.ok && rows.length === 1 && rows[0].id === 'w1' && o.ok && o.value === BIZ && calls[0].step === 'oauth/access_token' && !db.writes.some((w) => w.op === 'delete') && logs.some((l) => /re-exchanged in place/.test(l)),
      '3.1 her active row WITHOUT a token (connected before the cure) is re-exchanged: same row id, token kept, nothing deleted or stacked', JSON.stringify(r)); }
  { const db = makeDb(seed()); const calls = []; const { r } = await runConnect(db, { fetchCalls: calls });
    ok(!r.ok && r.reason === 'already_connected' && calls.length === 0, '3.2 her active row WITH a token is still refused before Meta (F6 holds)', JSON.stringify(r)); }
  { const db = makeDb(seed({ vendor_wabas: [wabaRow({ status: 'pending', business_token: null })] })); const calls = []; const { r } = await runConnect(db, { fetchCalls: calls });
    ok(!r.ok && r.reason === 'already_connected' && calls.length === 0, '3.3 a pending row is refused as before, token or not'); }

  sec('3b  the door offers the connect again for a tokenless number (F-a3b)');
  { const D = fresh('src/lib/ownNumber/door.js');
    const ans = async (rows) => (await quiet(() => D.answer({ vendor: { id: VID, tier: 'signature' }, supabase: makeDb(seed({ vendor_wabas: rows })), env: ENV, capApi: ARMED }))).v;
    const a = await ans([wabaRow({ business_token: null })]); const b = await ans([wabaRow({ status: 'suspended', business_token: null })]);
    const c = await ans([wabaRow({ business_token: vault.seal(BIZ) })]); const d = await ans([wabaRow({ status: 'pending', business_token: null })]);
    ok(a.number === null && a.open === true && b.number === null && c.number && c.number.status === 'active' && d.number && d.number.status === 'pending' && !JSON.stringify([a, b, c, d]).includes('v1.'),
      '3b.1 active or suspended WITHOUT a token: number null, so the room offers the connect (her re-exchange); WITH a token, or pending: shown as before; the sealed value never leaves', JSON.stringify([a.number, c.number])); }

  sec('4  the send uses her stored token, never TDW\u2019s (F-a5)');
  { const db = makeDb(seed()); const R = await runCaller(db, '919625759924');
    const post = R.calls.find((c) => c.step.endsWith('/messages'));
    ok(R.r.outcome === 'sent' && post && post.auth === `Bearer ${BIZ}` && post.step === '106/messages' && !R.calls.some((c) => /system_user_access_tokens/.test(c.step)),
      '4.1 W1\u2019s shape: the reply leaves from her PNID with HER business token; no token fetch is made', JSON.stringify(R.r)); }
  { const db = makeDb(seed()); const R = await runCaller(db, '919625759924', { sendOk: false });
    const line = R.logs.find((l) => /refused token=/.test(l)) || '';
    ok(R.r.outcome === 'send_failed' && /token=\*\*\*0986/.test(line) && /131047/.test(line) && !R.logs.some((l) => l.includes(BIZ)) && R.dead.length === 1,
      '4.2 Meta refuses the send: its message is logged beside the token as ***0986, never the token; a dead letter, no outbound row', line); }
  { const db = makeDb(seed({ vendor_wabas: [wabaRow({ business_token: null })] })); const R = await runCaller(db, '919625759924');
    ok(R.r.outcome === 'send_failed' && R.calls.length === 0 && /no business token/.test(String(R.dead[0] && R.dead[0].error && R.dead[0].error.message)),
      '4.3 no stored token (today\u2019s DEV440 row before the reconnect): refused before any Meta call, a dead letter naming it'); }

  sec('5  GONE nulls her token (F-a4)');
  { const E = fresh('src/lib/ownNumber/events.js'); const db = makeDb(seed());
    await quiet(() => E.handle(db, { vendor_id: VID, status: 'active' }, { field: 'account_update', value: { event: 'PARTNER_REMOVED' } }, () => new Date('2026-09-28T11:00:00Z')));
    const row = db.tables.vendor_wabas[0];
    ok(row.status === 'migrated_out' && row.business_token === null, '5.1 PARTNER_REMOVED: migrated_out, and her token is nulled in the same update'); }
  { const E = fresh('src/lib/ownNumber/events.js'); const db = makeDb(seed());
    await quiet(() => E.handle(db, { vendor_id: VID, status: 'active' }, { field: 'phone_number_quality_update', value: { event: 'FLAGGED' } }, () => new Date('2026-09-28T11:00:00Z')));
    ok(db.tables.vendor_wabas[0].status === 'suspended' && vault.open(db.tables.vendor_wabas[0].business_token).value === BIZ, '5.2 a quality pause keeps her token (she is paused, not gone)'); }

  sec('6  a registered vendor writing to her number is silent by source (F-b1)');
  { const db = makeDb(seed()); const R = await runCaller(db, '918595356978');
    ok(R.r.outcome === 'vendor' && R.ensured.length === 0 && R.turns.length === 0 && R.calls.length === 0 && (db.tables.messages || []).length === 0 && R.dead.length === 0 && db.tables.conversations.length === 1,
      '6.1 28 September 10:46\u2019s specimen (a co-founder\u2019s second number, a TDW vendor): silent before ensureCoupleRow; no thread, no row, no turn, no dead letter', JSON.stringify(R.r)); }
  { const db = makeDb(seed({ users: [...seed().users.filter((u) => u.id !== 'u-swati-alt'), { id: 'u-swati-alt', phone: '8595356978' }] })); const R = await runCaller(db, '918595356978');
    ok(R.r.outcome === 'vendor', '6.2 her users row stored as a bare 10-digit mobile is still found (the third phone form)'); }
  { const db = makeDb(seed()); const R = await runCaller(db, '919625759924');
    ok(R.r.outcome === 'sent' && R.ensured.length === 1 && R.turns.length === 1, '6.3 THE CONTROL: a returning bride (a users row, no vendors row) keeps her turn; couples remain couples'); }

  sec('7  the migration\u2019s witness and the schema note');
  ok(/0180/.test(read('docs/db/PUBLIC_SCHEMA.md')) && /business_token/.test(read('docs/db/PUBLIC_SCHEMA.md')), '7.1 PUBLIC_SCHEMA.md\u2019s staleness note names 0180 and its column (e-107\u2019s lesson)');

  sec('8  mutations of production code (each must turn its cell red; restored byte for byte)');
  const mutate = async (rel, pairs, probe) => {
    const src = read(rel); const before = sha(src); let m = src;
    for (const [from, to] of pairs) { if (!m.includes(from)) return { applied: false }; m = m.replace(from, to); }
    fs.writeFileSync(P(rel), m);
    let red; try { freshAll(); red = !(await probe()); } catch (_e) { red = true; } finally { fs.writeFileSync(P(rel), src); freshAll(); }
    return { applied: true, red, restored: sha(read(rel)) === before };
  };
  const out = [];
  out.push(['M1 the token stored in clear', await mutate('src/lib/ownNumber/connect.js', [['business_token: vault.seal(token),', 'business_token: token,']],
    async () => { const db = makeDb(seed({ vendor_wabas: [] })); await runConnect(db); return !JSON.stringify(db.tables).includes(BIZ); })]);
  out.push(['M2 the vault guard removed (a code spent, then nothing kept)', await mutate('src/lib/ownNumber/connect.js', [["if (!vault.isConfigured()) return refuse('not_configured', TEXT_FAILED);", '']],
    async () => { const db = makeDb(seed({ vendor_wabas: [] })); const calls = []; const { r } = await runConnect(db, { vaultApi: { isConfigured: () => false, seal: () => { throw new Error('no key'); } }, fetchCalls: calls }); return r.reason === 'not_configured' && calls.length === 0; })]);
  out.push(['M3 the F6 refusal restored for a tokenless row (no path back for DEV440)', await mutate('src/lib/ownNumber/connect.js', [["((cur.data.status === 'active' || cur.data.status === 'suspended') && hasToken)", "(cur.data.status === 'active' || cur.data.status === 'suspended')"]],
    async () => { const db = makeDb(seed({ vendor_wabas: [wabaRow({ business_token: null })] })); const { r } = await runConnect(db); return r.ok; })]);
  out.push(['M4 TDW\u2019s system token back on the send path', await mutate('src/lib/ownNumber/token.js', [['  const sealed = row && row.business_token;', '  if (process.env.B141_SYS) return process.env.B141_SYS;\n  const sealed = row && row.business_token;']],
    async () => { process.env.B141_SYS = SYS; try { const db = makeDb(seed()); const R = await runCaller(db, '919625759924'); const post = R.calls.find((c) => c.step.endsWith('/messages')); return post && post.auth === `Bearer ${BIZ}`; } finally { delete process.env.B141_SYS; } })]);
  out.push(['M5 the refusal logs the token unmasked', await mutate('src/lib/ownNumber/send.js', [['refused token=${mask(token)}', 'refused token=${token}']],
    async () => { const db = makeDb(seed()); const R = await runCaller(db, '919625759924', { sendOk: false }); return !R.logs.some((l) => l.includes(BIZ)); })]);
  out.push(['M6 GONE keeps her token', await mutate('src/lib/ownNumber/events.js', [["if (next.status === 'migrated_out') patch.business_token = null;", '']],
    async () => { const E = fresh('src/lib/ownNumber/events.js'); const db = makeDb(seed()); await quiet(() => E.handle(db, { vendor_id: VID, status: 'active' }, { field: 'account_update', value: { event: 'PARTNER_REMOVED' } }, () => new Date())); return db.tables.vendor_wabas[0].business_token === null; })]);
  out.push(['M7 the vendor limb removed (the failed insert returns)', await mutate('src/lib/ownNumber/turn.js', [["if (await isRegisteredVendor({ supabase, senderDigits })) return 'vendor';", '']],
    async () => { const db = makeDb(seed()); const R = await runCaller(db, '918595356978'); return R.r.outcome === 'vendor' && R.dead.length === 0; })]);
  out.push(['M8 any user silenced (returning brides lose their turn)', await mutate('src/lib/ownNumber/turn.js', [['  if (!ids.length) return false;\n', '  if (ids.length) return true;\n']],
    async () => { const db = makeDb(seed()); const R = await runCaller(db, '919625759924'); return R.r.outcome === 'sent'; })]);
  out.push(['M9 F-a3b removed (DEV440 stuck on CONNECTED with no way back)', await mutate('src/lib/ownNumber/door.js', [['    number: tokenless ? null : numberView(data),', '    number: numberView(data),']],
    async () => { const D = fresh('src/lib/ownNumber/door.js'); const r = (await quiet(() => D.answer({ vendor: { id: VID, tier: 'signature' }, supabase: makeDb(seed({ vendor_wabas: [wabaRow({ business_token: null })] })), env: ENV, capApi: ARMED }))).v; return r.number === null; })]);
  for (const [name, r] of out) ok(r.applied && r.red && r.restored, `8 ${name}: applies, turns its cell red, restored by sha`, JSON.stringify(r));

  console.log(`\nb141 · ${pass} pass · ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('b141 crashed:', e && e.stack); process.exit(2); });
