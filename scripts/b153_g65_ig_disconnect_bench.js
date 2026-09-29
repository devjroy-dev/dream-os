'use strict';
// scripts/b153_g65_ig_disconnect_bench.js · CE-46 · G6-5 · "DISCONNECT INSTAGRAM" · RUNG b153 (dream-os half).
// Ruled 29 September 2026: F-i1 (a) the standing law (Meta first, then the row DELETED; leads and threads untouched; no migration);
// F-i2 both doors through the ONE function; F-i3 F-a's policy (a refusal changes nothing; 190, 404, an expired or absent token count
// as already gone); the Meta callbacks unchanged. Cures F-44.243 (Portfolio's Disconnect left Meta's subscription live).
// Drives the SHIPPED modules: igDisconnect.disconnectFully (through the real igConnection and igMeta), igRoom.answer. Meta is a
// recording fetch; the database is scripts/lib/b137_pgdouble.js (C-44.3). No clock is read by a cell. Each mutation in §7 must turn
// its cell red and is restored byte for byte by sha. THE EXIT CODE IS THE VERDICT.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8'); const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const { makeDb } = require('./lib/b137_pgdouble');
let pass = 0, fail = 0;
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name}${info ? `\n        ${String(info).slice(0, 400)}` : ''}`); } };
const sec = (s) => console.log(`\n§${s}`);
const freshAll = () => { for (const k of Object.keys(require.cache)) if (k.startsWith(P('src'))) delete require.cache[k]; };
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const quiet = async (fn) => { const logs = []; const o = { log: console.log, warn: console.warn, error: console.error }; const cap = (...a) => logs.push(a.map(String).join(' ')); console.log = cap; console.warn = cap; console.error = cap; try { return { v: await fn(), logs }; } finally { Object.assign(console, o); } };

const VID = 'v-dev440'; const TOKEN = 'IGAA-her-instagram-token-b153';
const NOW = new Date('2026-09-29T12:00:00Z');
const conn = (over = {}) => ({ id: 'c1', vendor_id: VID, ig_user_id: 'scoped-1', ig_account_id: '17841400000000000', ig_username: 'devroyphotography', access_token: TOKEN,
  token_expires_at: '2026-11-20T00:00:00.000Z', connected_at: '2026-09-21T00:00:00.000Z', messages_granted_at: '2026-09-27T00:00:00.000Z',
  dm_state: 'on', dm_consented_at: '2026-09-27T00:00:00.000Z', dm_subscribed_at: '2026-09-27T00:00:00.000Z', ...over });
const seed = (rows = [conn()]) => ({
  vendor_ig_connections: rows,
  conversations: [{ id: 'th-ig', vendor_id: VID, channel: 'instagram', counterparty_phone: null }],
  messages: [{ id: 'm1', vendor_id: VID, conversation_id: 'th-ig', body: 'hi' }],
  leads: [{ id: 'l1', vendor_id: VID, source: 'instagram' }],
});
function meta(calls, answer = [200, { success: true }]) {
  return async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', auth: (init.headers || {}).Authorization || null });
    if (answer === 'throw') throw new Error('network down');
    return { ok: answer[0] < 400, status: answer[0], json: async () => answer[1] };
  };
}
async function run(db, answer, calls = []) {
  freshAll(); const D = require(P('src/lib/instagram/igDisconnect.js'));
  const { v, logs } = await quiet(() => D.disconnectFully({ supabase: db, vendorId: VID, fetchImpl: meta(calls, answer), now: () => NOW }));
  return { r: v, calls, logs };
}
const snap = (db) => JSON.stringify(db.tables);
const probes = {
  async on() { const db = makeDb(seed()); const keep = JSON.stringify({ c: db.tables.conversations, m: db.tables.messages, l: db.tables.leads }); const x = await run(db); return { ...x, db, keep }; },
  async refused() { const db = makeDb(seed()); const s0 = snap(db); const x = await run(db, [500, { error: { code: 2, message: 'An unexpected error has occurred' } }]); return { ...x, same: snap(db) === s0, db }; },
  async gone190() { const db = makeDb(seed()); const x = await run(db, [400, { error: { code: 190, message: 'Error validating access token' } }]); return { ...x, db }; },
  async expired() { const db = makeDb(seed([conn({ token_expires_at: '2026-09-01T00:00:00.000Z' })])); const x = await run(db); return { ...x, db }; },
};
async function roomAnswer(row) {
  freshAll();
  const capPath = require.resolve(P('src/lib/capabilities.js')); require.cache[capPath] = { id: capPath, filename: capPath, loaded: true, exports: { on: () => false } };
  const R = require(P('src/lib/instagram/igRoom.js')); const I = require(P('src/lib/instagram/igInbound.js'));
  const env = { IG_DM_WALK_VENDOR_IDS: VID, IG_DM_VENDOR_ALLOWLIST: VID, IG_DM_ALLOWLIST: VID };
  const laneOpen = I.laneOpen(VID, env);
  const r = await R.answer(VID, { supabase: makeDb(seed(row ? [row] : [])), env, tokenOk: async () => true, mintAuthorize: async () => 'https://www.instagram.com/oauth/authorize?x=1' });
  return { laneOpen, r };
}

(async () => {
  sec('1  the boundary: one function, both doors, the callbacks unchanged');
  const ig = strip(read('src/api/vendor/ig.js')); const dc = strip(read('src/lib/instagram/igDisconnect.js'));
  const door = ig.slice(ig.indexOf("router.delete('/disconnect'"), ig.indexOf('}));', ig.indexOf("router.delete('/disconnect'")));
  ok(/router\.delete\('\/disconnect', requireAuth, resolveVendor\(\), asyncHandler\(/.test(door) && /igDisconnect\.disconnectFully\(\{ supabase: req\.app\.locals\.supabase, vendorId: req\.vendor\.id \}\)/.test(door) && !/igConn\.disconnect/.test(door),
    '1.1 DELETE /ig/disconnect (Portfolio\u2019s door, and the room\u2019s) is hers alone and calls ONLY the one function');
  ok((ig.match(/igConn\.disconnect\(supabase, found\.vendorId\)/g) || []).length === 2, '1.2 Meta\u2019s deauthorize and data-deletion callbacks still delete the row directly (F-i3: Meta has already cut access there)');
  ok(/conn\.disconnect\(supabase, vendorId\)/.test(dc) && !/\.delete\(/.test(dc) && !/revoke|permissions/i.test(dc), '1.3 the function deletes only through igConnection.disconnect (the standing law) and calls no revoke (Meta\u2019s pages give none)');
  ok(dc.indexOf('meta.setSubscribed') > -1 && dc.indexOf('meta.setSubscribed') < dc.indexOf('conn.disconnect('), '1.4 Meta first, then the row (F-i3), by the order in the source');
  ok(!/migrations\/018[3-9]/.test(read('scripts/floor-manifest-ce46-g65.txt')), '1.5 no migration (F-i1 (a))');

  sec('2  replies on: unsubscribed with HER token, then the row deleted; her leads and threads kept');
  { const { r, calls, db, keep } = await probes.on();
    ok(r.ok && r.step === 'unsubscribed', '2.1 ok, step unsubscribed', JSON.stringify(r));
    ok(calls.length === 1 && calls[0].method === 'DELETE' && /^https:\/\/graph\.instagram\.com\/v\d+\.\d+\/me\/subscribed_apps$/.test(calls[0].url) && calls[0].auth === `Bearer ${TOKEN}`, '2.2 one Meta call: DELETE graph.instagram.com/<v>/me/subscribed_apps with her token', JSON.stringify(calls));
    ok(db.tables.vendor_ig_connections.length === 0, '2.3 the connection row is deleted (the standing law)');
    ok(JSON.stringify({ c: db.tables.conversations, m: db.tables.messages, l: db.tables.leads }) === keep, '2.4 her threads, messages and leads are untouched'); }

  sec('3  F-i3: a refusal changes nothing');
  { const { r, same } = await probes.refused(); ok(r.ok === false && r.reason === 'meta_unsubscribe' && same, '3.1 Meta refuses (500, code 2): refused, the row and her token byte-identical', JSON.stringify(r)); }
  { const db = makeDb(seed()); const s0 = snap(db); const { r } = await run(db, 'throw'); ok(r.ok === false && snap(db) === s0, '3.2 a network failure is a refusal, not already gone'); }
  { const db = makeDb(seed()); await run(db, [500, { error: { code: 2 } }]); const { r } = await run(db); ok(r.ok && db.tables.vendor_ig_connections.length === 0, '3.3 the retry after a refusal reaches Meta with the kept token and disconnects'); }

  sec('4  already gone counts as done');
  { const { r, db } = await probes.gone190(); ok(r.ok && r.step === 'already_gone' && db.tables.vendor_ig_connections.length === 0, '4.1 Meta\u2019s 190 (the token no longer valid): the row deleted', JSON.stringify(r)); }
  { const db = makeDb(seed()); const { r } = await run(db, [404, { error: { code: 803 } }]); ok(r.ok && db.tables.vendor_ig_connections.length === 0, '4.2 a 404: the row deleted'); }
  { const { r, calls, db } = await probes.expired(); ok(r.ok && r.step === 'token_expired' && calls.length === 0 && db.tables.vendor_ig_connections.length === 0, '4.3 a token past its expiry: no Meta call, the row deleted', JSON.stringify(r)); }
  { const db = makeDb(seed([])); const { r, calls } = await run(db); ok(r.ok && r.step === 'no_token' && calls.length === 0, '4.4 no connection at all: ok, nothing called (a second tap is harmless)'); }
  { const db = makeDb(seed([conn({ dm_state: 'off', dm_consented_at: null, dm_subscribed_at: null, messages_granted_at: null })])); const { r, calls } = await run(db);
    ok(r.ok && calls.length === 1 && db.tables.vendor_ig_connections.length === 0, '4.5 a Portfolio-only connection (replies never on): still unsubscribed first, then deleted (F-44.243\u2019s door, one path)'); }

  sec('5  the doors tell the sheet her handle and which line (the founder\u2019s rows 2 and 3)');
  { const { laneOpen, r } = await roomAnswer(conn());
    if (!laneOpen) ok(false, '5.0 the lane opens for the walk vendor in this cell (env shape)', 'laneOpen false');
    else ok(r.status === 200 && r.body.ig_username === 'devroyphotography' && r.body.replies_ever_on === true && r.body.state === 'on', '5.1 the room\u2019s door: ig_username and replies_ever_on true once she consented', JSON.stringify(r.body)); }
  { const { laneOpen, r } = await roomAnswer(null);
    if (laneOpen) ok(r.body.state === 'not_connected' && r.body.ig_username === null && r.body.replies_ever_on === false, '5.2 not connected: no handle, replies_ever_on false', JSON.stringify(r.body)); }
  { freshAll(); const D = require(P('src/lib/instagram/igDisconnect.js'));
    ok(D.repliesEverOn({ dm_state: 'off', dm_consented_at: '2026-09-27T00:00:00Z' }) === true && D.repliesEverOn({ dm_state: 'off', dm_consented_at: null }) === false, '5.3 "ever on" is her consent (dm_consented_at), so turning replies off later still reads row 2'); }
  ok(/select\('dm_consented_at'\)/.test(ig) && /replies_ever_on:\s+repliesEver/.test(ig) && !/SAFE_COLUMNS[^;]*dm_consented_at/.test(read('src/lib/vendor/igConnection.js')), '5.4 Portfolio\u2019s status door carries replies_ever_on by its own read; getConnection\u2019s safe list untouched');

  sec('7  mutations of production code (each must turn its cell red; restored byte for byte)');
  const mutate = async (rel, pairs, probe) => {
    const src = read(rel); const before = sha(src); let m = src;
    for (const [from, to] of pairs) { if (!m.includes(from)) return { applied: false }; m = m.replace(from, to); }
    fs.writeFileSync(P(rel), m);
    let red; try { freshAll(); red = !(await probe()); } catch (_e) { red = true; } finally { fs.writeFileSync(P(rel), src); freshAll(); }
    return { applied: true, red, restored: sha(read(rel)) === before };
  };
  const out = [];
  out.push(['M1 a refusal still deletes the row (row first)', await mutate('src/lib/instagram/igDisconnect.js', [["        return { ok: false, reason: 'meta_unsubscribe' };\n", '']],
    async () => { const x = await probes.refused(); return x.r.ok === false && x.same; })]);
  out.push(['M2 every Meta answer read as already gone', await mutate('src/lib/instagram/igDisconnect.js', [['  if (!r) return false;', '  if (r) return true;']],
    async () => { const x = await probes.refused(); return x.r.ok === false && x.same; })]);
  out.push(['M3 no Meta call (F-44.243 returns)', await mutate('src/lib/instagram/igDisconnect.js', [["      const r = await meta.setSubscribed({ fetchImpl, token: t.accessToken, on: false });", "      const r = { ok: true };"]],
    async () => { const x = await probes.on(); return x.calls.length === 1; })]);
  out.push(['M4 an expired token still sent to Meta', await mutate('src/lib/instagram/igDisconnect.js', [['    if (expired(t.expiresAt, now())) step', '    if (false) step']],
    async () => { const x = await probes.expired(); return x.calls.length === 0; })]);
  out.push(['M5 the door back on the bare delete', await mutate('src/api/vendor/ig.js', [['  const r = await igDisconnect.disconnectFully({ supabase: req.app.locals.supabase, vendorId: req.vendor.id });', '  const r = await igConn.disconnect(req.app.locals.supabase, req.vendor.id);']],
    async () => { const s = strip(read('src/api/vendor/ig.js')); const d = s.slice(s.indexOf("router.delete('/disconnect'"), s.indexOf('}));', s.indexOf("router.delete('/disconnect'"))); return /igDisconnect\.disconnectFully/.test(d) && !/igConn\.disconnect/.test(d); })]);
  out.push(['M6 "ever on" read from today\u2019s switch', await mutate('src/lib/instagram/igDisconnect.js', [['return !!(row && row.dm_consented_at);', "return !!(row && row.dm_state === 'on');"]],
    async () => { freshAll(); const D = require(P('src/lib/instagram/igDisconnect.js')); return D.repliesEverOn({ dm_state: 'off', dm_consented_at: 'x' }) === true; })]);
  out.push(['M7 the room\u2019s door drops her handle', await mutate('src/lib/instagram/igRoom.js', [["const ig_username = connected && r.conn ? r.conn.ig_username || null : null;", 'const ig_username = null;']],
    async () => { const { laneOpen, r } = await roomAnswer(conn()); return laneOpen && r.body.ig_username === 'devroyphotography'; })]);
  for (const [name, r] of out) ok(r.applied && r.red && r.restored, `7 ${name}: applies, turns its cell red, restored by sha`, JSON.stringify(r));

  console.log(`\nb153 · ${pass} pass · ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('b153 crashed:', e && e.stack); process.exit(2); });
