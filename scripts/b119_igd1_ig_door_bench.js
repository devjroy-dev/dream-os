'use strict';
// scripts/b119_igd1_ig_door_bench.js · TDW CE-45 · IGD-1 · CUT 2a-i (dream-os) · rung b119.
//
// WHAT IT HOLDS. The Instagram door's receiving half and F-44.162's cure:
//   §1 the source: 0173 alters only (no table, so A-45.8 has nothing to grant) with its CHECKs and partial UNIQUEs; the vendor
//      service mounts /webhook/instagram; the shared receiver drops a non-WhatsApp body BEFORE it walks any change, and its
//      destructure binds isWhatsAppBody (e-146); the door never calls the couple turn and never sends (2a-i records only).
//   §2 parseIgMessages: object "instagram", entry[].messaging[] (F-44.161's shape), echoes flipped, every hostile body empty, no throw.
//   §3 verifyIgSignature: IG_APP_SECRET or META_APP_SECRET, and WHICH matched (E3); neither, or no secret, refuses.
//   §4 laneOpen: the capability ON, or the vendor named in IG_DM_WALK_VENDOR_IDS (F7); otherwise closed.
//   §5 recordInbound on a fake store: unknown account; lane closed; one thread per sender (made, then reused, a race tolerated);
//      the row's channel, sent_by, direction and message_sid; Meta's retry is a duplicate, not an error.
//   §6 F-44.162: isWhatsAppBody's table.
//   §7 mutations, compiled IN MEMORY (no production file is written, so A-45.4 has nothing to restore).
// A-45.8's REHEARSAL of 0173 on a real Postgres is scripts/lib/b119r_0173_rehearse.sh (the seat's, recorded on the card).
// The one clock read in igInbound stamps last_message_at; the fake store ignores its value, so no cell depends on a clock.
// THE EXIT CODE IS THE VERDICT.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Module = require('module');
const ROOT = path.join(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0; let fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 240) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const stripSql = (s) => s.replace(/--[^\n]*/g, '');

// ── stubs for the two modules igInbound reads beside metaInbound and webhookCore ──
const CAP = { on: false };
const CONN = { map: {} };
const capPath = require.resolve(P('src/lib/capabilities.js'));
const connPath = require.resolve(P('src/lib/vendor/igConnection.js'));
require.cache[capPath] = { id: capPath, filename: capPath, loaded: true, exports: { on: (k) => k === 'perm.instagram_business_manage_messages' && CAP.on } };
require.cache[connPath] = { id: connPath, filename: connPath, loaded: true, exports: {
  findByIgUserId: async (_s, id) => (CONN.map[String(id)] ? { ok: true, vendorId: CONN.map[String(id)] } : { ok: false, error: 'not_found' }) } };
const IG_FILE = P('src/lib/instagram/igInbound.js');
function load(src) {
  const m = new Module(IG_FILE, module); m.filename = IG_FILE; m.paths = Module._nodeModulePaths(path.dirname(IG_FILE));
  m._compile(src, IG_FILE); return m.exports;
}
const IG_SRC = read('src/lib/instagram/igInbound.js');
const IG = load(IG_SRC);

// ── a fake Supabase: enough of the builder for igInbound's reads and writes ──
function fakeStore(opts = {}) {
  const db = { conversations: [], messages: [], updates: 0, raceOnce: !!opts.race };
  const from = (table) => {
    const q = { table, filters: {}, op: 'select', row: null };
    const api = {
      select() { return api; },
      eq(k, v) { q.filters[k] = v; return api; },
      insert(row) { q.op = 'insert'; q.row = row; return api; },
      update(row) { q.op = 'update'; q.row = row; return api; },
      maybeSingle() { return api.then ? run() : run(); },
      then(res, rej) { return run().then(res, rej); },
    };
    async function run() {
      if (q.op === 'update') { db.updates += 1; return { data: null, error: null }; }
      if (table === 'conversations' && q.op === 'select') {
        const hit = db.conversations.find((c) => Object.entries(q.filters).every(([k, v]) => c[k] === v));
        return { data: hit ? { id: hit.id } : null, error: null };
      }
      if (table === 'conversations' && q.op === 'insert') {
        if (db.raceOnce) { db.raceOnce = false; db.conversations.push({ id: 'T-race', ...q.row }); return { data: null, error: { message: 'duplicate key value violates unique constraint' } }; }
        const id = `T${db.conversations.length + 1}`; db.conversations.push({ id, ...q.row }); return { data: { id }, error: null };
      }
      if (table === 'messages' && q.op === 'insert') {
        if (q.row.message_sid && db.messages.some((m) => m.message_sid === q.row.message_sid)) return { data: null, error: { message: 'duplicate key value violates unique constraint "messages_message_sid_uidx"' } };
        db.messages.push(q.row); return { data: null, error: null };
      }
      return { data: null, error: { message: `unexpected ${table} ${q.op}` } };
    }
    return api;
  };
  return { from, db };
}

const dm = (over = {}) => ({ object: 'instagram', entry: [{ id: 'ACC1', time: 1, messaging: [Object.assign({
  sender: { id: 'IGSID1' }, recipient: { id: 'ACC1' }, timestamp: 1, message: { mid: 'MID1', text: 'Hi, are you free on 14 February 2027?' } }, over)] }] });

(async () => {
  sec('1  the source');
  const mig = stripSql(read('db/migrations/0173_ig_dm.sql'));
  ok(!/CREATE\s+TABLE/i.test(mig) && /ALTER TABLE public\.conversations ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'whatsapp'/.test(mig)
    && /CHECK \(channel IN \('whatsapp', 'instagram'\)\)/.test(mig) && /ALTER TABLE public\.leads ADD COLUMN IF NOT EXISTS counterparty_ig_id text/.test(mig)
    && /reply_quiet_minutes integer NOT NULL DEFAULT 120/.test(mig) && /CHECK \(reply_quiet_minutes IN \(60, 120, 240, 480\)\)/.test(mig),
    '1.1 0173 alters only (no CREATE TABLE, so A-45.8 grants nothing): channel with its CHECK, the ig ids, the quiet time with its CHECK');
  ok(/conversations_vendor_ig_thread_uidx\s+ON public\.conversations \(vendor_id, counterparty_ig_id\)\s+WHERE kind = 'couple_thread' AND counterparty_ig_id IS NOT NULL/.test(mig)
    && /leads_vendor_ig_uidx\s+ON public\.leads \(vendor_id, counterparty_ig_id\)\s+WHERE counterparty_ig_id IS NOT NULL/.test(mig)
    && /^BEGIN;/m.test(mig) && /^COMMIT;/m.test(mig),
    '1.2 0173\u2019s two partial UNIQUEs (one Instagram thread and one lead per vendor and sender), in one transaction');
  const idx = strip(read('src/index.js'));
  ok(/app\.get\('\/webhook\/instagram'/.test(idx) && /handleVerifyChallenge\(req, res, process\.env\.IG_VERIFY_TOKEN\)/.test(idx)
    && /app\.post\('\/webhook\/instagram'/.test(idx) && /igInbound\.verifyIgSignature\(req\.rawBody/.test(idx) && /igInbound\.recordInbound\(supabase, msg, process\.env\)/.test(idx),
    '1.3 the vendor service mounts GET and POST /webhook/instagram: the challenge on IG_VERIFY_TOKEN, the signature, then record');
  const post = idx.slice(idx.indexOf("app.post('/webhook/instagram'"), idx.indexOf("app.post('/webhook/instagram'") + 900);
  ok(post.indexOf('return res.status(403)') > -1 && post.indexOf('return res.status(403)') < post.indexOf("res.status(200).send('ok')"),
    '1.4 an unsigned POST is refused (403) before the 200, and nothing is parsed');
  const mk = strip(read('src/marketingIndex.js'));
  const h = mk.slice(mk.indexOf("app.post('/webhook/meta'"));
  ok(/\bisWhatsAppBody,\s*\n?\s*\}\s*=\s*require\('\.\/lib\/metaInbound'\)/.test(mk) && h.indexOf('if (!isWhatsAppBody(req.body))') > -1
    && h.indexOf('if (!isWhatsAppBody(req.body))') < h.indexOf('changesWithPnid(req.body)') && !/metaInbound\.isWhatsAppBody/.test(mk),
    '1.5 F-44.162: the receiver binds isWhatsAppBody in its destructure (e-146) and drops a non-WhatsApp body BEFORE it walks any change');
  ok(!/runCoupleAgenticTurn|require\('\.\.\/\.\.\/agent|graph\.instagram\.com|\/messages['"`]\s*,\s*\{\s*method/.test(strip(IG_SRC)),
    '1.6 2a-i records only: the door neither calls the couple turn nor sends (2b wires the turn; 2a-ii the Send API)');

  sec('2  parseIgMessages');
  const one = IG.parseIgMessages(dm());
  ok(one.length === 1 && one[0].accountId === 'ACC1' && one[0].igsid === 'IGSID1' && one[0].mid === 'MID1' && one[0].echo === false && /14 February/.test(one[0].text),
    '2.1 a DM reads: the account it reached, the sender, the mid, the text, not an echo');
  const ec = IG.parseIgMessages(dm({ sender: { id: 'ACC1' }, recipient: { id: 'IGSID1' }, message: { mid: 'MID2', text: 'We are free', is_echo: true } }));
  ok(ec.length === 1 && ec[0].echo === true && ec[0].accountId === 'ACC1' && ec[0].igsid === 'IGSID1', '2.2 an echo (the vendor writing from her own app) flips sender and recipient');
  const hostile = [undefined, null, 0, 'x', [], {}, { object: 'whatsapp_business_account', entry: dm().entry }, { object: 'instagram' },
    { object: 'instagram', entry: 'x' }, { object: 'instagram', entry: [null, 5, {}] }, { object: 'instagram', entry: [{ messaging: [null, 1, 'x', {}] }] },
    { object: 'instagram', entry: [{ changes: [{ field: 'comments', value: {} }] }] }, dm({ message: null }), dm({ message: { text: 'no mid' } }),
    dm({ sender: null }), dm({ recipient: { id: '' } }), dm({ message: { mid: 'x'.repeat(600) } }), dm({ sender: { id: { a: 1 } } })];
  let threw = null; const admitted = [];
  for (const b of hostile) { try { if (IG.parseIgMessages(b).length) admitted.push(JSON.stringify(b).slice(0, 60)); } catch (e) { threw = e.message; } }
  ok(threw === null && admitted.length === 0, `2.3 ${hostile.length} hostile bodies (a WhatsApp body and Instagram comments among them) yield nothing and never throw`, threw || admitted.join(' | '));
  const long = IG.parseIgMessages(dm({ message: { mid: 'MIDL', text: 'y'.repeat(9000) } }));
  ok(long.length === 1 && long[0].text.length === 4000, '2.4 an over-long text is kept to 4000 characters, not dropped');

  sec('3  verifyIgSignature');
  const raw = Buffer.from(JSON.stringify(dm()));
  const hdr = (secret) => 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const env = { IG_APP_SECRET: 'ig-secret', META_APP_SECRET: 'meta-secret' };
  const a = IG.verifyIgSignature(raw, hdr('ig-secret'), env); const b = IG.verifyIgSignature(raw, hdr('meta-secret'), env);
  ok(a.ok && a.which === 'IG_APP_SECRET' && b.ok && b.which === 'META_APP_SECRET', '3.1 either secret is accepted and the match is NAMED (E3)');
  ok(!IG.verifyIgSignature(raw, hdr('other'), env).ok && !IG.verifyIgSignature(raw, hdr('ig-secret'), {}).ok
    && !IG.verifyIgSignature(raw, undefined, env).ok && !IG.verifyIgSignature(raw, 'sha1=' + 'a'.repeat(40), env).ok
    && !IG.verifyIgSignature(Buffer.from(raw.toString() + ' '), hdr('ig-secret'), env).ok,
    '3.2 a wrong secret, no secret set, no header, a sha1 header and a changed body are all refused');

  sec('4  laneOpen');
  CAP.on = false;
  ok(!IG.laneOpen('V1', {}) && !IG.laneOpen('V1', { IG_DM_WALK_VENDOR_IDS: 'V2' }) && IG.laneOpen('V1', { IG_DM_WALK_VENDOR_IDS: ' V2 , V1 ' }),
    '4.1 before the grant the lane opens only for a vendor named in IG_DM_WALK_VENDOR_IDS (F7)');
  CAP.on = true; ok(IG.laneOpen('V9', {}), '4.2 once the permission is ON the lane is open for every vendor'); CAP.on = false;

  sec('5  recordInbound');
  CONN.map = { ACC1: 'V1' };
  // The estate carries message_sid in production (the column exists; messages_message_sid_uidx is UNIQUE). webhookCore learns it at
  // boot; here its test hook sets it, so 5.4 and 5.6 exercise the dedupe path and never pass vacuously.
  require(P('src/lib/webhookCore.js'))._setSidColumnPresent(true);
  let S = fakeStore();
  let r = await IG.recordInbound(S, { accountId: 'ACC9', igsid: 'X', mid: 'M', text: 't', echo: false }, { IG_DM_WALK_VENDOR_IDS: 'V1' });
  ok(!r.ok && r.why === 'unknown_account' && S.db.messages.length === 0, '5.1 a DM to an account no vendor connected is not recorded');
  r = await IG.recordInbound(S, one[0], {});
  ok(!r.ok && r.why === 'lane_closed' && S.db.conversations.length === 0, '5.2 a closed lane records nothing (dark)');
  const E = { IG_DM_WALK_VENDOR_IDS: 'V1' };
  r = await IG.recordInbound(S, one[0], E);
  const c0 = S.db.conversations[0]; const m0 = S.db.messages[0];
  ok(r.ok && r.made && c0 && c0.vendor_id === 'V1' && c0.kind === 'couple_thread' && c0.channel === 'instagram' && c0.counterparty_ig_id === 'IGSID1'
    && m0 && m0.channel === 'instagram' && m0.sent_by === 'couple' && m0.direction === 'inbound' && m0.conversation_id === c0.id,
    '5.3 the first DM makes ONE Instagram couple_thread and writes an inbound row, sent_by couple', JSON.stringify({ c0, m0 }));
  ok(m0.message_sid === 'MID1', '5.4 the mid rides message_sid (webhookCore.inboundRow)');
  r = await IG.recordInbound(S, { ...one[0], mid: 'MID3', text: 'second' }, E);
  ok(r.ok && !r.made && S.db.conversations.length === 1 && S.db.messages.length === 2, '5.5 a second DM from the same sender reuses the thread');
  r = await IG.recordInbound(S, one[0], E);
  ok(r.ok && r.dup === true && S.db.messages.length === 2, "5.6 Meta's retry of the same mid is a duplicate, not an error, and writes nothing");
  r = await IG.recordInbound(S, ec[0], E);
  const last = S.db.messages[S.db.messages.length - 1];
  ok(r.ok && r.echo && last.sent_by === 'vendor' && last.direction === 'outbound' && S.db.conversations.length === 1,
    '5.7 an echo is recorded on the same thread as the vendor\u2019s own outbound row');
  S = fakeStore({ race: true });
  r = await IG.recordInbound(S, one[0], E);
  ok(r.ok && r.conversationId === 'T-race' && S.db.messages.length === 1, '5.8 a concurrent retry that made the thread first is found, not failed');

  sec('6  F-44.162');
  const MI = require(P('src/lib/metaInbound.js'));
  ok(MI.isWhatsAppBody({ object: 'whatsapp_business_account', entry: [] }) && !MI.isWhatsAppBody({ object: 'instagram', entry: [{ changes: [{ field: 'comments' }] }] })
    && !MI.isWhatsAppBody({ object: 'page' }) && !MI.isWhatsAppBody(null) && !MI.isWhatsAppBody('x') && !MI.isWhatsAppBody({}),
    '6.1 only a WhatsApp body passes; an Instagram comments body, a page body, and non-objects are dropped');

  sec('7  mutations (in memory)');
  const mut = (from, to) => { const t = IG_SRC.replace(from, to); return t === IG_SRC ? null : load(t); };
  let M = mut('accountId: echo ? sender : recipient', 'accountId: recipient');
  ok(M && M.parseIgMessages(dm({ sender: { id: 'ACC1' }, recipient: { id: 'IGSID1' }, message: { mid: 'Z', is_echo: true } }))[0].accountId !== 'ACC1',
    'M1 the echo flip removed puts the couple in the account slot (2.2 would redden)');
  M = mut("return allow.includes(String(vendorId));", 'return allow.length > 0;');
  ok(M && M.laneOpen('V1', { IG_DM_WALK_VENDOR_IDS: 'V2' }) === true, 'M2 an allowlist that opens for anyone once set is caught (4.1 would redden)');
  M = mut("if (!laneOpen(who.vendorId, env)) return { ok: false, why: 'lane_closed' };", '');
  if (M) { const S2 = fakeStore(); const rr = await M.recordInbound(S2, one[0], {}); ok(rr.ok === true, 'M3 the lane gate removed records on a closed lane (5.2 would redden)'); } else ok(false, 'M3 anchor');
  M = mut("for (const name of ['IG_APP_SECRET', 'META_APP_SECRET'])", "for (const name of ['META_APP_SECRET'])");
  ok(M && !M.verifyIgSignature(raw, hdr('ig-secret'), env).ok, 'M4 dropping IG_APP_SECRET refuses an Instagram-signed DM (3.1 would redden)');
  const mkMut = mk.replace('if (!isWhatsAppBody(req.body))', 'if (false)');
  const hM = mkMut.slice(mkMut.indexOf("app.post('/webhook/meta'"));
  ok(!(hM.indexOf('if (!isWhatsAppBody(req.body))') > -1), 'M5 the receiver\u2019s guard removed is caught by 1.5\u2019s reading');

  console.log(`\nb119: ${pass} passed, ${fail} failed${fail ? '\n  ' + failed.join('\n  ') : ''}`);
  process.exit(fail ? 1 : 0);
})();
