'use strict';
// scripts/b136c_igd2_walk_cures_bench.js · TDW CE-46 · IGD-2 · CUT 2c (dream-os) · the dark walk's three findings, cured.
//   E3        verifyIgSignature accepts IG_APP_SECRET only (the walk's first delivered webhook matched it); the other secret refuses.
//   F-44.194  the webhook's account is matched on ig_account_id (the professional-account id the connect now stores beside
//             ig_user_id); a scoped id no longer matches; the store is best-effort and never throws.
//   F-44.212  a connect that proves the grant while her switch is already on subscribes her account and stamps dm_subscribed_at;
//             the room reads 'on' only once subscribed (otherwise 'waiting', with the door's live false).
// The database is an in-memory double (PostgREST-shaped), the Meta call a double; no network, no key. `--mutate` compiles each
// production mutation IN MEMORY (A-45.4) and requires its named cell to redden. THE EXIT CODE IS THE VERDICT.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Module = require('module');
const ROOT = path.join(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
const MUTATE = process.argv.includes('--mutate');
function loadAt(rel, src) { const f = P(rel); const m = new Module(f, module); m.filename = f; m.paths = Module._nodeModulePaths(path.dirname(f)); m._compile(src, f); return m.exports; }

function makeDb(rows) {
  const T = { vendor_ig_connections: JSON.parse(JSON.stringify(rows)) };
  return {
    T,
    from(table) {
      const st = { f: [], op: 'select', p: null, cols: null };
      const hit = () => (T[table] || []).filter((r) => st.f.every((fn) => fn(r)));
      const run = async () => {
        if (st.cols && st.cols.some((c) => !(c in (T[table][0] || {})) && c !== 'ig_account_id')) return { data: null, error: { message: 'column does not exist' } };
        if (st.op === 'update') { const h = hit(); h.forEach((r) => Object.assign(r, st.p)); return { data: h, error: null }; }
        return { data: hit(), error: null };
      };
      const api = {
        select(c) { st.cols = String(c).split(',').map((x) => x.trim()); return api; },
        update(p) { st.op = 'update'; st.p = p; return api; },
        eq(c, v) { st.f.push((r) => r[c] === v); return api; },
        async maybeSingle() { const r = await run(); if (r.error) return r; if (r.data.length > 1) return { data: null, error: { message: 'multiple rows' } }; return { data: r.data[0] || null, error: null }; },
        then(a, b) { return run().then(a, b); },
      };
      return api;
    },
  };
}

const V = '23165e38-6510-4639-ab6a-9f35bab93742'; const SCOPED = '28467548409515620'; const PRO = '17841400000000000';

async function cells(m) {
  const R = []; const ok = (c, name) => R.push({ name, pass: !!c });

  // 1 · E3
  const raw = Buffer.from('{"object":"instagram"}');
  const hdr = (k) => 'sha256=' + crypto.createHmac('sha256', k).update(raw).digest('hex');
  const env = { IG_APP_SECRET: 'ig', META_APP_SECRET: 'meta' };
  const a = m.igInbound.verifyIgSignature(raw, hdr('ig'), env); const b = m.igInbound.verifyIgSignature(raw, hdr('meta'), env);
  ok(a.ok && a.which === 'IG_APP_SECRET' && !b.ok, '1.1 E3: IG_APP_SECRET accepted and named; a body signed with META_APP_SECRET refused');

  // 2 · F-44.194: the webhook's account
  let db = makeDb([{ vendor_id: V, ig_user_id: SCOPED, ig_account_id: PRO }]);
  const f1 = await m.igConn.findByIgAccountId(db, PRO); const f2 = await m.igConn.findByIgAccountId(db, SCOPED);
  const f3 = await m.igConn.findByIgUserId(db, SCOPED);
  ok(f1.ok && f1.vendorId === V && !f2.ok && f3.ok && f3.vendorId === V,
    '2.1 the webhook\u2019s professional-account id finds her; the scoped id does not; the signed-request bridge on ig_user_id still does');
  db = makeDb([{ vendor_id: V, ig_user_id: SCOPED, ig_account_id: null }]);
  const s1 = await m.igConn.setAccountId(db, V, PRO); const s0 = await m.igConn.setAccountId(db, V, null);
  ok(s1.ok && db.T.vendor_ig_connections[0].ig_account_id === PRO && db.T.vendor_ig_connections[0].ig_user_id === SCOPED && !s0.ok,
    '2.2 the connect stores the account id beside ig_user_id (untouched); no id, no write');
  const dbErr = { from: () => ({ update: () => ({ eq: async () => ({ error: { message: 'column "ig_account_id" does not exist' } }) }) }) };
  let threw = false; let e1; try { e1 = await m.igConn.setAccountId(dbErr, V, PRO); } catch (_e) { threw = true; }
  ok(!threw && e1 && e1.ok === false, '2.3 before 0176 the write returns its error and never throws (the connect stands)');
  const dbDup = { from: () => ({ update: () => ({ eq: async () => ({ error: { message: 'duplicate key value violates unique constraint "vendor_ig_connections_ig_account_id_uidx"' } }) }) }) };
  const e2 = await m.igConn.setAccountId(dbDup, V, PRO);
  ok(e2 && e2.ok === false && /unique/.test(e2.error), '2.3b a second vendor on the same account: the write is refused and returned, never thrown');

  const inb = m.igInboundSrc;
  ok(/igConnection\.findByIgAccountId\(supabase, msg\.accountId\)/.test(inb) && !/igConnection\.findByIgUserId\(/.test(inb), '2.4 the DM webhook looks her up by the professional-account id');

  // 3 · F-44.212: subscribe when already on
  let subs = 0; const dsub = (d, okay = true) => ({ supabase: d, now: () => 'NOW', subscribe: async () => { subs += 1; return { ok: okay }; } });
  db = makeDb([{ vendor_id: V, ig_user_id: SCOPED, dm_state: 'on', messages_granted_at: 't', dm_consented_at: 'c', dm_subscribed_at: null }]);
  let r = await m.igRoom.subscribeIfOn(V, dsub(db));
  ok(r.subscribed && subs === 1 && db.T.vendor_ig_connections[0].dm_subscribed_at === 'NOW', '3.1 switched on before the grant: the connect subscribes and stamps');
  subs = 0; db = makeDb([{ vendor_id: V, ig_user_id: SCOPED, dm_state: 'off', messages_granted_at: 't', dm_consented_at: 'c', dm_subscribed_at: null }]);
  r = await m.igRoom.subscribeIfOn(V, dsub(db));
  ok(!r.subscribed && r.why === 'not_on' && subs === 0 && db.T.vendor_ig_connections[0].dm_subscribed_at === null, '3.2 switched off: nothing subscribed');
  subs = 0; db = makeDb([{ vendor_id: V, ig_user_id: SCOPED, dm_state: 'on', messages_granted_at: 't', dm_consented_at: 'c', dm_subscribed_at: null }]);
  r = await m.igRoom.subscribeIfOn(V, dsub(db, false));
  ok(!r.subscribed && r.why === 'refused' && db.T.vendor_ig_connections[0].dm_subscribed_at === null, '3.3 Meta refuses: no stamp');

  // 4 · the room reads the truth
  const d = m.igRoom.deriveState;
  ok(d({ conn: { messages_granted_at: 't', dm_state: 'on', dm_subscribed_at: null }, tokenOk: true, laneOpen: true }) === 'waiting'
    && d({ conn: { messages_granted_at: 't', dm_state: 'on', dm_subscribed_at: 's' }, tokenOk: true, laneOpen: true }) === 'on', '4.1 \u2018on\u2019 only once subscribed');
  const envOpen = { IG_DM_WALK_VENDOR_IDS: V };
  const ans = async (sub) => m.igRoom.answer(V, { supabase: makeDb([{ vendor_id: V, ig_user_id: SCOPED, messages_granted_at: 't', dm_state: 'on', dm_consented_at: 'c', dm_subscribed_at: sub }]), env: envOpen, tokenOk: async () => true, mintAuthorize: async () => null });
  const w = await ans(null); const o = await ans('s');
  ok(w.body.state === 'waiting' && w.body.live === false && o.body.state === 'on' && o.body.live === true, '4.2 the door carries live: false while unsubscribed, true when on');

  // 5 · the callback's wiring (read as text; the route needs a live Meta)
  const cb = m.igJs;
  const iSave = cb.indexOf('const saved = await igConn.saveToken('); const iAcct = cb.indexOf('igConn.setAccountId(supabase, v.vendorId, profile.igUserId)');
  ok(iSave > 0 && iAcct > iSave, '5.1 the callback stores the profile\u2019s account id after the token');
  const iGrant = cb.indexOf('igConn.markMessagesGranted(supabase, v.vendorId)'); const iSub = cb.indexOf('igRoom.subscribeIfOn(v.vendorId');
  ok(iGrant > 0 && iSub > iGrant && /igMeta\.setSubscribed\(\{ fetchImpl: fetch, token: long\.accessToken, on: true \}\)/.test(cb), '5.2 after the messages grant is proved, it subscribes if she is already on');

  const idx = read('src/index.js');
  const iIg = idx.indexOf("app.post('/webhook/instagram'"); const iOwn = idx.indexOf("app.post(own.ROUTE, own.ownInboundRoute(");
  ok(iIg > 0 && iOwn > iIg, '5.3 the own-number door (G6-2) is mounted after /webhook/instagram (the carry onto de38b5c kept the order)');

  // 6 · 0176
  const mig = read('db/migrations/0176_ig_account_id.sql').split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
  ok(/ALTER TABLE public\.vendor_ig_connections ADD COLUMN IF NOT EXISTS ig_account_id text;/.test(mig)
    && /CREATE UNIQUE INDEX IF NOT EXISTS vendor_ig_connections_ig_account_id_uidx\s+ON public\.vendor_ig_connections \(ig_account_id\) WHERE ig_account_id IS NOT NULL;/.test(mig)
    && !/CREATE TABLE|DROP|GRANT|REVOKE|ROW LEVEL/i.test(mig) && /BEGIN;[\s\S]*COMMIT;/.test(mig),
    '6.1 0176 adds one nullable column and its partial UNIQUE (one vendor per Instagram account) in one transaction; no table, grant or RLS change');
  return R;
}

const FILES = { igInbound: 'src/lib/instagram/igInbound.js', igConn: 'src/lib/vendor/igConnection.js', igRoom: 'src/lib/instagram/igRoom.js', igJs: 'src/api/vendor/ig.js' };
const MUTATIONS = [
  { id: 'M1', key: 'igInbound', from: "for (const name of ['IG_APP_SECRET'])", to: "for (const name of ['IG_APP_SECRET', 'META_APP_SECRET'])", cell: '1.1' },
  { id: 'M2', key: 'igConn', from: ".eq('ig_account_id', String(igAccountId))", to: ".eq('ig_user_id', String(igAccountId))", cell: '2.1' },
  { id: 'M10', key: 'igInbound', from: 'igConnection.findByIgAccountId(supabase, msg.accountId)', to: 'igConnection.findByIgUserId(supabase, msg.accountId)', cell: '2.4' },
  { id: 'M3', key: 'igConn', from: "  if (!igAccountId) return { ok: false, error: 'no_account_id' };\n", to: '', cell: '2.2' },
  { id: 'M4', key: 'igRoom', from: "if (!r.ok || !r.conn || r.conn.dm_state !== 'on') return", to: "if (!r.ok || !r.conn) return", cell: '3.2' },
  { id: 'M5', key: 'igRoom', from: "  if (!s || !s.ok) return { subscribed: false, why: 'refused' };\n", to: '', cell: '3.3' },
  { id: 'M6', key: 'igRoom', from: "  return conn.dm_subscribed_at ? 'on' : 'waiting';", to: "  return 'on';", cell: '4.1' },
  { id: 'M7', key: 'igRoom', from: 'live: state === \'on\' }', to: 'live: true }', cell: '4.2' },
  { id: 'M8', key: 'igJs', from: 'igConn.setAccountId(supabase, v.vendorId, profile.igUserId)', to: 'Promise.resolve({ ok: true })', cell: '5.1' },
  { id: 'M9', key: 'igJs', from: 'igRoom.subscribeIfOn(v.vendorId', to: 'Promise.resolve(v.vendorId', cell: '5.2' },
];

function mods(mut) {
  const src = (k) => { let s = read(FILES[k]); if (mut && mut.key === k) { if (s.indexOf(mut.from) < 0) throw new Error(`${mut.id} anchor not found`); s = s.replace(mut.from, mut.to); } return s; };
  // capabilities stubbed OFF so the lane opens only by the allowlist (b119b's way); loaded before igRoom/igInbound compile
  const capPath = require.resolve(P('src/lib/capabilities.js'));
  require.cache[capPath] = { id: capPath, filename: capPath, loaded: true, exports: { on: () => false } };
  const igInbound = loadAt(FILES.igInbound, src('igInbound'));
  const igConn = loadAt(FILES.igConn, src('igConn'));
  const igRoomSrc = src('igRoom').replace("require('./igInbound')", "require('./igInbound')");
  const igRoom = loadAt(FILES.igRoom, igRoomSrc);
  return { igInbound, igConn, igRoom, igJs: src('igJs'), igInboundSrc: src('igInbound') };
}

(async () => {
  let fail = 0;
  const base = await cells(mods(null));
  console.log('b136c \u00b7 the dark walk\u2019s three findings, cured (CE-46 IGD-2 cut 2c)');
  for (const c of base) { console.log(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name}`); if (!c.pass) fail += 1; }
  console.log(`\nb136c: ${base.length - fail} passed, ${fail} failed`);
  if (MUTATE) {
    let mf = 0;
    console.log('\nmutations (each must redden its cell; nothing on disk is written)');
    for (const m of MUTATIONS) {
      let red = false; let why = '';
      try { const res = await cells(mods(m)); const c = res.find((x) => x.name.startsWith(`${m.cell} `)); red = !!c && !c.pass; } catch (e) { why = e.message; }
      console.log(`  ${red ? 'RED (good)' : 'GREEN (BAD)'}  ${m.id} -> cell ${m.cell}${why ? `  [${why}]` : ''}`);
      if (!red) mf += 1;
    }
    console.log(`\nb136c --mutate: ${MUTATIONS.length - mf} of ${MUTATIONS.length} reddened`);
    fail += mf;
  }
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('b136c threw:', e && e.stack); process.exit(1); });
