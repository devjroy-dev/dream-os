'use strict';
// scripts/b150_g64_remove_number_bench.js · CE-46 · G6-4 · THE ROOM FINISHED · RUNG b150 (dream-os half).
// "Remove this number" as ruled 28 September 2026: F-a (a) Meta first, then the row; a refusal changes nothing and keeps the token;
// 190, 404 or not-subscribed count as already gone. F-c the shared way's finish line until PARTNER_REMOVED. F-d reconnect in place.
// Drives the SHIPPED modules (never copies): remove.removeNumber, door.answer, connect.connect, events.handle / nextStatus,
// turn.handleOwnInbound, wabaMap.activeOwnDigits. Meta is a recording fetch; the database is scripts/lib/b137_pgdouble.js (C-44.3).
// No clock is read by a cell. Each production mutation in §9 must turn its cell red and is restored byte for byte by sha.
// THE EXIT CODE IS THE VERDICT.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8'); const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
process.env.INTEGRATION_TOKEN_KEY = 'b150'.repeat(16); // a test key, never a real one; set before any module loads
const { makeDb } = require('./lib/b137_pgdouble');
let pass = 0, fail = 0;
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name}${info ? `\n        ${String(info).slice(0, 400)}` : ''}`); } };
const sec = (s) => console.log(`\n§${s}`);
const freshAll = () => { for (const k of Object.keys(require.cache)) if (k.startsWith(P('src'))) delete require.cache[k]; };
const fresh = (r) => { freshAll(); return require(P(r)); };
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const quiet = async (fn) => { const logs = []; const o = { log: console.log, warn: console.warn, error: console.error }; const cap = (...a) => logs.push(a.map(String).join(' ')); console.log = cap; console.warn = cap; console.error = cap; try { return { v: await fn(), logs }; } finally { Object.assign(console, o); } };

const VID = 'v-dev440'; const BIZ = 'EAAG-her-business-token-b150-0986';
const WABA = '2929843900974351'; const PNID = '106'; const NUM = '+91 87577 88550';
const ENV = { META_APP_ID: '1425513376067685', OWN_NUMBER_CONFIG_ID: '1661411452073678', META_APP_SECRET: 'app-secret-b150', OWN_NUMBER_WALK_VENDOR_ID: VID, META_GRAPH_VERSION: 'v25.0' };
const NOW = () => new Date('2026-09-28T18:00:00Z');
const vault = require(P('src/lib/vendor/tokenVault.js'));
const ARMED = { get: async (k) => (k === 'flag.own_number' ? { key: k, status: 'armed' } : null) };
const OFF = { get: async (k) => (k === 'flag.own_number' ? { key: k, status: 'off' } : null) };

// Meta, recording. `refuse` maps a step ('unsubscribe' | 'deregister') to [status, error body].
function meta(calls, refuse = {}) {
  return async (url, init = {}) => {
    const u = new URL(url); const pth = u.pathname.split('/').slice(2).join('/');
    const step = pth === 'oauth/access_token' ? 'exchange' : pth.endsWith('/subscribed_apps') ? (init.method === 'DELETE' ? 'unsubscribe' : 'subscribe')
      : pth.endsWith('/deregister') ? 'deregister' : pth.endsWith('/register') ? 'register' : pth.endsWith('/phone_numbers') ? 'phone_numbers'
      : pth.endsWith('/smb_app_data') ? 'sync' : pth.endsWith('/messages') ? 'messages' : pth;
    calls.push({ step, method: init.method || 'GET', path: pth, version: u.pathname.split('/')[1], auth: (init.headers || {}).Authorization || null });
    const res = (status, body) => ({ ok: status < 400, status, json: async () => body });
    if (refuse[step]) return res(refuse[step][0], refuse[step][1]);
    if (step === 'exchange') return res(200, { access_token: BIZ });
    if (step === 'phone_numbers') return res(200, { data: [{ id: PNID, display_phone_number: NUM }] });
    if (step === 'messages') return res(200, { messages: [{ id: 'wamid.OUT1' }] });
    return res(200, { success: true });
  };
}
const wabaRow = (over = {}) => ({ id: 'w1', vendor_id: VID, business_id: '1634281561824806', waba_id: WABA, phone_number_id: PNID, display_number: NUM,
  connect_way: 'shared', status: 'active', quality_rating: 'GREEN', paused_reason: null, removed_at: null, business_token: vault.seal(BIZ), ...over });
const seed = (rows = [wabaRow()]) => ({
  vendors: [{ id: VID, user_id: 'u-dev440', business_name: 'Dev Roy Photography', tier: 'signature', status: 'active', reply_quiet_minutes: 120 }],
  users: [{ id: 'u-dev440', phone: '+919888294440' }, { id: 'u-bride', phone: '+919625759924' }],
  vendor_wabas: rows,
  conversations: [], messages: [], team_members: [], prospects: [], leads: [], failed_turns: [],
  vendor_wa_events: [{ id: 'e1', vendor_id: VID, kind: 'inbound', payload: { a: 1 } }, { id: 'e2', vendor_id: VID, kind: 'echo', payload: { b: 2 } }],
});
async function runRemove(db, refuse = {}, calls = []) {
  const R = fresh('src/lib/ownNumber/remove.js');
  const { v, logs } = await quiet(() => R.removeNumber({ vendor: { id: VID, tier: 'signature' }, supabase: db, env: ENV, fetchImpl: meta(calls, refuse), now: NOW }));
  return { r: v, calls, logs };
}
async function runDoor(db, capApi = ARMED) {
  const D = fresh('src/lib/ownNumber/door.js');
  return (await quiet(() => D.answer({ vendor: { id: VID, tier: 'signature' }, supabase: db, env: ENV, capApi }))).v;
}
const BODY = (event) => ({ code: 'CODE', event, waba_id: WABA, phone_number_id: event === 'FINISH' ? PNID : null, business_id: '1634281561824806' });
async function runConnect(db, event = 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING', calls = []) {
  const C = fresh('src/lib/ownNumber/connect.js');
  const { v, logs } = await quiet(() => C.connect({ vendor: { id: VID, tier: 'signature' }, body: BODY(event), supabase: db, env: ENV, fetchImpl: meta(calls), capApi: ARMED, now: NOW }));
  return { r: v, calls, logs };
}
async function runEvent(db, field, value) {
  const E = fresh('src/lib/ownNumber/events.js');
  const row = db.tables.vendor_wabas[0];
  return (await quiet(() => E.handle(db, { vendor_id: VID, status: row.status, paused_reason: row.paused_reason }, { field, value }, NOW))).v;
}
const snap = (db) => JSON.stringify(db.tables.vendor_wabas);

// ── the cells as probes, so §9's mutations can re-run them ─────────────────────────────────────────────────────────────────────
const probes = {
  async shared() {
    const db = makeDb(seed()); const before = JSON.stringify(db.tables.vendor_wa_events); const { r, calls } = await runRemove(db);
    const w = db.tables.vendor_wabas;
    return { r, calls, w, eventsKept: JSON.stringify(db.tables.vendor_wa_events) === before };
  },
  async moved() { const db = makeDb(seed([wabaRow({ connect_way: 'moved' })])); const { r, calls } = await runRemove(db); return { r, calls, w: db.tables.vendor_wabas }; },
  async refusedUnsub() { const db = makeDb(seed()); const s0 = snap(db); const { r, calls } = await runRemove(db, { unsubscribe: [400, { error: { code: 100, message: 'Invalid parameter' } }] }); return { r, calls, same: snap(db) === s0 }; },
  async refusedDereg() { const db = makeDb(seed([wabaRow({ connect_way: 'moved' })])); const s0 = snap(db); const { r } = await runRemove(db, { deregister: [400, { error: { code: 100, message: 'The phone number cannot be deregistered in its current state' } }] }); return { r, same: snap(db) === s0 }; },
};

(async () => {
  sec('1  the boundary, the one opener, the door, the migration');
  const manifest = read('scripts/floor-manifest-ce46-g64.txt').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const FORBIDDEN = ['src/index.js', 'src/lib/vendorInbound.js', 'src/marketingIndex.js', 'src/lib/metaCloud.js', 'src/lib/sendWa.js', 'src/lib/ownNumber/token.js', 'src/lib/ownNumber/turn.js', 'src/lib/ownNumber/send.js', 'src/lib/ownNumber/wabaMap.js', 'src/lib/vendor/tokenVault.js'];
  ok(manifest.every((f) => fs.existsSync(P(f))) && FORBIDDEN.every((f) => !manifest.includes(f)), '1.1 the cut\u2019s manifest: every path present; no index, receiver, vendorInbound, metaCloud, sendWa, token, turn, send, wabaMap or vault file', manifest.filter((f) => !fs.existsSync(P(f)) || FORBIDDEN.includes(f)).join(','));
  const rm = strip(read('src/lib/ownNumber/remove.js'));
  ok(!/tokenVault|vault\.open|\.open\(/.test(rm) && /businessTokenFor/.test(rm), '1.2 remove.js reaches her token only through token.js businessTokenFor; it never opens the seal itself');
  ok(!/\.delete\(/.test(rm), '1.3 remove.js has no delete: the row is kept (F-a (a))');
  const nr = strip(read('src/api/vendor/solutions/number.js'));
  ok(/router\.post\('\/remove', requireAuth, resolveVendor\(\), asyncHandler\(/.test(nr) && /removeNumber\(\{ vendor: req\.vendor, supabase: req\.app\.locals\.supabase \}\)/.test(nr), '1.4 POST /remove is hers alone (requireAuth, resolveVendor(), mode A) and hands removeNumber only her own vendor');
  const mt = strip(read('src/lib/ownNumber/meta.js'));
  ok(/'unsubscribe', `\$\{GRAPH\}\/\$\{graphVersion\(env\)\}\/\$\{encodeURIComponent\(wabaId\)\}\/subscribed_apps`,\s*\{ method: 'DELETE'/.test(mt), '1.5 meta.unsubscribe is DELETE /<v>/<WABA>/subscribed_apps');
  ok(/'deregister', `\$\{GRAPH\}\/\$\{graphVersion\(env\)\}\/\$\{encodeURIComponent\(phoneNumberId\)\}\/deregister`,\s*\{ method: 'POST'/.test(mt), '1.6 meta.deregister is POST /<v>/<PNID>/deregister');
  const sql = read('db/migrations/0182_own_number_removed.sql'); const body = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  ok(/BEGIN;[\s\S]*COMMIT;/.test(body) && (body.match(/BEGIN;/g) || []).length === 1, '1.7 0182 is one transaction');
  ok(/DROP CONSTRAINT IF EXISTS vendor_wabas_status_check/.test(body) && /CHECK \(status IN \('pending', 'active', 'suspended', 'migrated_out', 'removed'\)\)/.test(body), '1.8 0182 replaces the status CHECK with five values under its own name');
  ok(/ADD COLUMN IF NOT EXISTS removed_at timestamptz/.test(body) && /RAISE EXCEPTION/.test(body), '1.9 0182 adds removed_at and refuses the whole transaction unless exactly one status CHECK remains');
  ok(!/CREATE TABLE|DELETE FROM|DROP TABLE|DROP COLUMN/i.test(body), '1.10 0182 creates no table and drops or deletes nothing (the REVERT is commented)');
  const doc = read('docs/db/PUBLIC_SCHEMA.md');
  ok(/0182/.test(doc) && /removed_at/.test(doc), '1.11 PUBLIC_SCHEMA.md\u2019s staleness note names 0182 and its column (e-107\u2019s lesson)');

  sec('2  the shared way: TDW stops listening; her app is hers to disconnect');
  { const { r, calls, w, eventsKept } = await probes.shared();
    ok(r && r.ok === true, '2.1 the removal answers ok', JSON.stringify(r));
    ok(calls.length === 1 && calls[0].step === 'unsubscribe' && calls[0].method === 'DELETE' && calls[0].path === `${WABA}/subscribed_apps` && calls[0].version === 'v25.0', '2.2 one Meta call: DELETE her WABA\u2019s subscribed_apps', JSON.stringify(calls));
    ok(calls[0].auth === `Bearer ${BIZ}`, '2.3 with HER business token, opened from its seal');
    ok(!calls.some((c) => c.step === 'deregister'), '2.4 NO deregister on the shared way (Meta refuses it for a number on the app)');
    ok(w.length === 1 && w[0].id === 'w1' && w[0].status === 'removed' && w[0].business_token === null && w[0].removed_at === '2026-09-28T18:00:00.000Z' && w[0].paused_reason === 'removed:vendor', '2.5 her row kept (same id), marked removed, token nulled, removed_at stamped, paused_reason removed:vendor', JSON.stringify(w));
    ok(eventsKept, '2.6 her history (vendor_wa_events) untouched');
    ok(r.removed && r.removed.display_number === NUM && r.removed.way === 'shared' && r.removed.finish_in_app === true, '2.7 the room is told: this number, the shared way, finish in your app (F-c)', JSON.stringify(r && r.removed)); }

  sec('3  the moved way: unsubscribe, then deregister');
  { const { r, calls, w } = await probes.moved();
    ok(r.ok && calls.map((c) => c.step).join(',') === 'unsubscribe,deregister', '3.1 unsubscribe then deregister, in that order', calls.map((c) => c.step).join(','));
    ok(calls[1].method === 'POST' && calls[1].path === `${PNID}/deregister` && calls[1].version === 'v25.0' && calls[1].auth === `Bearer ${BIZ}`, '3.2 deregister is POST /<PNID>/deregister with her token');
    ok(w[0].status === 'removed' && w[0].business_token === null, '3.3 her row removed and her token nulled');
    ok(r.removed && r.removed.way === 'moved' && r.removed.finish_in_app === false, '3.4 no finish line on the moved way', JSON.stringify(r.removed)); }

  sec('4  F-a (a): Meta first; a refusal changes nothing; already-gone counts as done');
  { const { r, calls, same } = await probes.refusedUnsub();
    ok(r.ok === false && r.reason === 'meta_unsubscribe' && same && calls.length === 1, '4.1 Meta refuses the unsubscribe: refused, her row and sealed token byte-identical, nothing further called', JSON.stringify(r)); }
  { const { r, same } = await probes.refusedDereg();
    ok(r.ok === false && r.reason === 'meta_deregister' && same, '4.2 Meta refuses the deregister (moved): refused, her row byte-identical', JSON.stringify(r)); }
  { const db = makeDb(seed()); await runRemove(db, { unsubscribe: [400, { error: { code: 100, message: 'x' } }] }); const { r } = await runRemove(db);
    ok(r.ok && db.tables.vendor_wabas[0].status === 'removed', '4.3 the retry after a refusal reaches Meta with the kept token and removes'); }
  { const db = makeDb(seed()); const { r } = await runRemove(db, { unsubscribe: [400, { error: { code: 190, message: 'Error validating access token' } }] });
    ok(r.ok && db.tables.vendor_wabas[0].status === 'removed', '4.4 an invalid token (190) counts as already gone', JSON.stringify(r)); }
  { const db = makeDb(seed([wabaRow({ connect_way: 'moved' })])); const { r } = await runRemove(db, { unsubscribe: [404, { error: { code: 803, message: 'not found' } }], deregister: [400, { error: { code: 100, message: 'Phone number is not registered' } }] });
    ok(r.ok && db.tables.vendor_wabas[0].status === 'removed', '4.5 a 404 on unsubscribe and "not registered" on deregister count as already gone', JSON.stringify(r)); }
  { const R = fresh('src/lib/ownNumber/remove.js'); const M = require(P('src/lib/ownNumber/meta.js'));
    ok(!R.alreadyGone(new M.MetaError('unsubscribe', 500, { error: { code: 2, message: 'An unexpected error occurred' } })) && !R.alreadyGone(new Error('network')), '4.6 a transient Meta error or a network failure is NOT already gone'); }

  sec('5  what cannot be removed is refused before Meta');
  for (const [label, rows, reason] of [['no row', [], 'no_number'], ['pending', [wabaRow({ status: 'pending' })], 'no_number'], ['already removed', [wabaRow({ status: 'removed', business_token: null })], 'no_number'],
    ['migrated_out', [wabaRow({ status: 'migrated_out', business_token: null })], 'no_number'], ['tokenless active (F-a3b)', [wabaRow({ business_token: null })], 'token_no_token']]) {
    const db = makeDb(seed(rows)); const s0 = snap(db); const { r, calls } = await runRemove(db);
    ok(r.ok === false && r.reason === reason && calls.length === 0 && snap(db) === s0, `5 ${label}: refused '${reason}', no Meta call, nothing written`, JSON.stringify(r));
  }
  { const db = makeDb(seed([wabaRow({ status: 'suspended', paused_reason: 'quality:FLAGGED' })])); const { r } = await runRemove(db);
    ok(r.ok && db.tables.vendor_wabas[0].status === 'removed', '5.6 a paused (suspended) number can be removed'); }

  sec('6  the door, and Meta\u2019s events on a removed row');
  { const d = await runDoor(makeDb(seed([wabaRow({ status: 'removed', business_token: null, paused_reason: 'removed:vendor' })])));
    ok(d.number === null && d.removed && d.removed.display_number === NUM && d.removed.way === 'shared' && d.removed.finish_in_app === true, '6.1 a removed shared row: number null, removed with the finish line', JSON.stringify(d)); }
  { const d = await runDoor(makeDb(seed([wabaRow({ status: 'removed', business_token: null, paused_reason: 'removed:vendor' })])), OFF);
    ok(d.open === false && d.removed && d.removed.finish_in_app === true, '6.2 the finish line is told with the door shut too (the switchboard off)'); }
  { const d = await runDoor(makeDb(seed()));
    ok(d.number && d.number.status === 'active' && d.removed === null, '6.3 an active row: its number, removed null'); }
  { const db = makeDb(seed([wabaRow({ status: 'removed', business_token: null, paused_reason: 'removed:vendor' })]));
    await runEvent(db, 'account_update', { event: 'PARTNER_REMOVED', disconnection_info: { reason: 'ACCOUNT_DISCONNECTED', initiated_by: 'USER' } });
    const w = db.tables.vendor_wabas[0]; const d = await runDoor(db);
    ok(w.status === 'removed' && w.paused_reason === 'removed:partner_removed' && d.removed && d.removed.finish_in_app === false, '6.4 PARTNER_REMOVED on a removed row: still removed, the finish line retired (F-c)', JSON.stringify(w)); }
  { const db = makeDb(seed([wabaRow({ status: 'removed', business_token: null, paused_reason: 'removed:vendor' })])); const s0 = snap(db);
    await runEvent(db, 'account_update', { event: 'ACCOUNT_RECONNECTED' }); await runEvent(db, 'phone_number_quality_update', { event: 'FLAGGED' });
    await runEvent(db, 'account_update', { event: 'DISABLED_UPDATE', ban_info: { waba_ban_state: 'REINSTATE' } });
    ok(snap(db) === s0, '6.5 no account or quality event revives or pauses a removed row (only a connect does, F-d)'); }
  { const E = fresh('src/lib/ownNumber/events.js');
    ok(JSON.stringify(E.nextStatus({ status: 'active' }, 'account_update', { event: 'PARTNER_REMOVED' })) === JSON.stringify({ status: 'migrated_out', paused_reason: 'account:PARTNER_REMOVED' }), '6.6 THE CONTROL: PARTNER_REMOVED on an active row still reads migrated_out, as before'); }

  sec('7  F-d: reconnect in place');
  for (const [event, way] of [['FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING', 'shared'], ['FINISH', 'moved']]) {
    const db = makeDb(seed([wabaRow({ status: 'removed', business_token: null, paused_reason: 'removed:partner_removed', removed_at: '2026-09-28T18:00:00.000Z' })]));
    const { r, logs } = await runConnect(db, event); const w = db.tables.vendor_wabas;
    ok(r.ok && w.length === 1 && w[0].id === 'w1' && w[0].status === 'active' && w[0].connect_way === way && w[0].removed_at === null && w[0].paused_reason === null
      && typeof w[0].business_token === 'string' && w[0].business_token !== BIZ && vault.open(w[0].business_token).value === BIZ && logs.some((l) => /reconnected in place \(F-d\)/.test(l)),
    `7 ${way}: the removed row is updated in place (same id, active, removed_at and paused_reason cleared, a new sealed token)`, JSON.stringify({ r, w }));
  }
  { const db = makeDb(seed([wabaRow({ status: 'migrated_out', business_token: null })])); const { r } = await runConnect(db); const w = db.tables.vendor_wabas;
    ok(r.ok && w.length === 1 && w[0].id !== 'w1', '7.3 THE CONTROL: a migrated_out row is still replaced as before (F6), untouched by this cut'); }
  { const db = makeDb(seed()); const { r } = await runConnect(db);
    ok(r.ok === false && r.reason === 'already_connected', '7.4 THE CONTROL: an active row with a token is still refused'); }

  sec('8  a removed number never answers');
  { const T = fresh('src/lib/ownNumber/turn.js');
    const db = makeDb(seed([wabaRow({ status: 'removed', business_token: null, paused_reason: 'removed:vendor' })])); const sends = [];
    const change = { field: 'messages', value: { messaging_product: 'whatsapp', metadata: { phone_number_id: PNID }, messages: [{ from: '919625759924', id: 'wamid.X', type: 'text', text: { body: 'hi' } }] } };
    const { v } = await quiet(() => T.handleOwnInbound({ supabase: db, anthropic: {}, vendorId: VID, change, env: ENV }, { capApi: ARMED, now: NOW, sendOnHerNumber: async (a) => { sends.push(a); return { ok: true }; }, runTurn: async () => ({ reply: 'x', toolCalls: [] }) }));
    ok(v && v.outcome === 'closed' && sends.length === 0, '8.1 a couple writing to a removed number: closed, nothing sent', JSON.stringify(v)); }
  { const M = fresh('src/lib/ownNumber/wabaMap.js'); M._resetActive();
    const set = await M.activeOwnDigits(makeDb(seed([wabaRow({ status: 'removed', business_token: null })])), () => 1);
    ok(set.size === 0, '8.2 a removed number is not among the connected own numbers (the shared line\u2019s loop guard)'); }

  sec('9  mutations of production code (each must turn its cell red; restored byte for byte)');
  const mutate = async (rel, pairs, probe) => {
    const src = read(rel); const before = sha(src); let m = src;
    for (const [from, to] of pairs) { if (!m.includes(from)) return { applied: false }; m = m.replace(from, to); }
    fs.writeFileSync(P(rel), m);
    let red; try { freshAll(); red = !(await probe()); } catch (_e) { red = true; } finally { fs.writeFileSync(P(rel), src); freshAll(); }
    return { applied: true, red, restored: sha(read(rel)) === before };
  };
  const out = [];
  out.push(['M1 a refusal still marks the row (row first)', await mutate('src/lib/ownNumber/remove.js', [["return refuse('meta_unsubscribe');", '']],
    async () => { const x = await probes.refusedUnsub(); return x.r.ok === false && x.same; })]);
  out.push(['M2 every Meta refusal read as already gone', await mutate('src/lib/ownNumber/remove.js', [['  if (!(e instanceof meta.MetaError)) return false;', '  if (e) return true;']],
    async () => { const x = await probes.refusedUnsub(); return x.r.ok === false && x.same; })]);
  out.push(['M3 deregister on the shared way too', await mutate('src/lib/ownNumber/remove.js', [["if (row.connect_way === 'moved' && !(await step('deregister'", "if (!(await step('deregister'"]],
    async () => { const x = await probes.shared(); return !x.calls.some((c) => c.step === 'deregister'); })]);
  out.push(['M4 her token kept on removal', await mutate('src/lib/ownNumber/remove.js', [["status: 'removed', business_token: null, removed_at: at", "status: 'removed', removed_at: at"]],
    async () => { const x = await probes.shared(); return x.w[0].business_token === null; })]);
  out.push(['M5 the moved way skips deregister', await mutate('src/lib/ownNumber/remove.js', [["row.connect_way === 'moved' && !(await step('deregister'", "row.connect_way === 'never' && !(await step('deregister'"]],
    async () => { const x = await probes.moved(); return x.calls.map((c) => c.step).join(',') === 'unsubscribe,deregister'; })]);
  out.push(['M6 a removed row revived by ACCOUNT_RECONNECTED', await mutate('src/lib/ownNumber/events.js', [["  if (cur === 'removed') {", "  if (cur === 'removed' && ev !== 'ACCOUNT_RECONNECTED') {"]],
    async () => { const db = makeDb(seed([wabaRow({ status: 'removed', business_token: null, paused_reason: 'removed:vendor' })])); await runEvent(db, 'account_update', { event: 'ACCOUNT_RECONNECTED' }); return db.tables.vendor_wabas[0].status === 'removed'; })]);
  out.push(['M7 the reconnect deletes her removed row (F-d undone)', await mutate('src/lib/ownNumber/connect.js', [["const reconnect = !!(cur.data && cur.data.status === 'removed');", 'const reconnect = false;']],
    async () => { const db = makeDb(seed([wabaRow({ status: 'removed', business_token: null })])); await runConnect(db); return db.tables.vendor_wabas[0].id === 'w1'; })]);
  out.push(['M8 the door shows a removed number as on file', await mutate('src/lib/ownNumber/door.js', [["  if (!row || row.status === 'removed') return null;", '  if (!row) return null;']],
    async () => { const d = await runDoor(makeDb(seed([wabaRow({ status: 'removed', business_token: null, paused_reason: 'removed:vendor' })]))); return d.number === null; })]);
  out.push(['M9 the finish line outlives PARTNER_REMOVED', await mutate('src/lib/ownNumber/remove.js', [["row.connect_way === 'shared' && row.paused_reason === 'removed:vendor'", "row.connect_way === 'shared'"]],
    async () => { const d = await runDoor(makeDb(seed([wabaRow({ status: 'removed', business_token: null, paused_reason: 'removed:partner_removed' })]))); return d.removed && d.removed.finish_in_app === false; })]);
  out.push(['M10 the remove door behind requireAuth only (another vendor\u2019s id reachable)', await mutate('src/api/vendor/solutions/number.js', [["router.post('/remove', requireAuth, resolveVendor(), asyncHandler(", "router.post('/remove', requireAuth, asyncHandler("]],
    async () => { const s = strip(read('src/api/vendor/solutions/number.js')); return /router\.post\('\/remove', requireAuth, resolveVendor\(\), asyncHandler\(/.test(s); })]);
  for (const [name, r] of out) ok(r.applied && r.red && r.restored, `9 ${name}: applies, turns its cell red, restored by sha`, JSON.stringify(r));

  console.log(`\nb150 · ${pass} pass · ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('b150 crashed:', e && e.stack); process.exit(2); });
