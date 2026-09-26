'use strict';
// scripts/b119b_igd1_ig_room_bench.js · TDW CE-45 · IGD-1 · CUT 2a-ii (dream-os) · rung b119b.
// WHAT IT HOLDS: the room's doors (igRoom), the reply transport (igSend), the two Meta calls (igMeta), the connect's messages
// flavour (igOAuth), the callback's proof (ig.js), the room's path (pwaPaths), and a BOOT CELL that requires every module this cut
// touches, so a boot-time throw (the pwaPaths key, caught before any run) can never pass the floor. fetch is faked; no network; no
// production file is written (mutations compile in memory). THE EXIT CODE IS THE VERDICT.
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ROOT = path.join(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0; let fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
const B = (s) => Buffer.byteLength(s, 'utf8');
function loadAt(rel, src) { const f = P(rel); const m = new Module(f, module); m.filename = f; m.paths = Module._nodeModulePaths(path.dirname(f)); m._compile(src, f); return m.exports; }

// the lane gate is read through igInbound; its capability is stubbed OFF, so only the allowlist opens it here
const capPath = require.resolve(P('src/lib/capabilities.js'));
require.cache[capPath] = { id: capPath, filename: capPath, loaded: true, exports: { on: () => false } };

(async () => {
  sec('1  boot: every module this cut touches loads (a module-level throw is RED)');
  const mods = ['src/lib/pwaPaths.js', 'src/lib/vendor/igOAuth.js', 'src/lib/vendor/igConnection.js', 'src/api/vendor/ig.js',
    'src/lib/instagram/igSend.js', 'src/lib/instagram/igMeta.js', 'src/lib/instagram/igRoom.js', 'src/api/vendor/solutions/instagram.js',
    'src/api/vendor/solutions/quiet.js', 'src/api/vendor/solutions/index.js'];
  const bad = [];
  for (const m of mods) { try { require(P(m)); } catch (e) { bad.push(`${m}: ${String(e.message).split('\n')[0]}`); } }
  ok(bad.length === 0, `1.1 all ${mods.length} touched modules require without a throw`, bad.join(' | '));
  ok(require(P('src/lib/pwaPaths.js')).vendorPath('number') === '/vendor/number', '1.2 the room\u2019s path is known (ig.js looks it up at load)');
  const idx = read('src/api/vendor/solutions/index.js');
  ok(/router\.use\('\/instagram', require\('\.\/instagram'\)\);/.test(idx) && /router\.use\('\/quiet', require\('\.\/quiet'\)\);/.test(idx)
    && idx.indexOf("router.use('/instagram'") > idx.indexOf("router.use('/number'"), '1.3 the two doors are mounted beside /number');

  sec('2  igSend');
  const S = require(P('src/lib/instagram/igSend.js'));
  ok(S.GRAPH_VERSION === 'v26.0' && S.SEND_BASE === 'https://graph.instagram.com/v26.0' && S.MAX_BYTES === 1000, '2.1 one pinned version (v26.0, read 26 Sept 2026) and the 1000-byte limit');
  const en = 'Namaste! ' + 'We would love to shoot your wedding in Jaipur. '.repeat(40) + 'Thank you.';
  const pe = S.splitReply(en);
  ok(pe.length === 2 && pe.every((p) => B(p) <= 1000) && pe.join(' ') === en.trim().replace(/\s+/g, ' '), '2.2 a long reply splits at sentence ends into parts at or under 1000 bytes that rejoin to the original, never reworded');
  const hi = S.splitReply('\u0928\u092e\u0938\u094d\u0924\u0947 '.repeat(400));
  ok(hi.length > 1 && hi.every((p) => B(p) <= 1000), '2.3 a long Hindi reply with no sentence end splits within the byte limit');
  ok(S.splitReply('Short.').length === 1 && S.splitReply('   ').length === 0 && S.splitReply(null).length === 0, '2.4 a short reply is one part; blank and non-text give none');
  ok(S.withinWindow(0, 23 * 3600e3) && !S.withinWindow(0, 24 * 3600e3) && !S.withinWindow(10, 5) && !S.withinWindow(NaN, 1), '2.5 the window is under 24 hours only (no human-agent tag is ever sent)');
  const calls = []; const fakeOk = async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200, json: async () => ({ message_id: `m${calls.length}` }) }; };
  let r = await S.sendText({ fetchImpl: fakeOk, token: 'TOK', igId: 'ACC1', igsid: 'IGSID1', text: en });
  const b0 = calls[0] && JSON.parse(calls[0].init.body);
  ok(r.ok && r.parts === 2 && calls.length === 2 && calls[0].url === 'https://graph.instagram.com/v26.0/ACC1/messages' && calls[0].init.method === 'POST'
    && calls[0].init.headers.Authorization === 'Bearer TOK' && b0.recipient.id === 'IGSID1' && typeof b0.message.text === 'string' && !('tag' in b0) && !('messaging_type' in b0),
    '2.6 each part is one POST to /<IG_ID>/messages with the Bearer token, the IGSID and the text, and no tag');
  let n = 0; const fakeSecond = async () => { n += 1; return n === 2 ? { ok: false, status: 400, json: async () => ({ error: {} }) } : { ok: true, status: 200, json: async () => ({ message_id: 'm1' }) }; };
  r = await S.sendText({ fetchImpl: fakeSecond, token: 'T', igId: 'A', igsid: 'I', text: en });
  ok(!r.ok && r.why === 'refused' && r.part === 1 && r.sent.length === 1, '2.7 a refusal stops the sending and names the part');
  ok(!/console\.(log|warn|error)\([^)]*token/i.test(read('src/lib/instagram/igSend.js')) && !/console\./.test(read('src/lib/instagram/igMeta.js')), '2.8 neither transport file logs a token');

  sec('3  igMeta');
  const M = require(P('src/lib/instagram/igMeta.js'));
  const seen = []; const f200 = (body) => async (url, init) => { seen.push({ url, init }); return { ok: true, status: 200, json: async () => body }; };
  let p = await M.probeMessagesScope({ fetchImpl: f200({ data: [] }), token: 'T' });
  ok(p.granted && seen[0].url === 'https://graph.instagram.com/v26.0/me/conversations?platform=instagram&limit=1', '3.1 the grant is proved by one conversations read');
  p = await M.probeMessagesScope({ fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({ error: { code: 10 } }) }), token: 'T' });
  ok(!p.granted && (await M.probeMessagesScope({ fetchImpl: f200({}), token: 'T' })).granted === false && (await M.probeMessagesScope({ fetchImpl: f200({ data: [] }), token: '' })).granted === false,
    '3.2 a refusal, a body without data, or no token is NOT a grant');
  seen.length = 0;
  const s1 = await M.setSubscribed({ fetchImpl: f200({ success: true }), token: 'T', on: true });
  const s2 = await M.setSubscribed({ fetchImpl: f200({ success: true }), token: 'T', on: false });
  ok(s1.ok && s2.ok && seen[0].init.method === 'POST' && /subscribed_apps\?subscribed_fields=messages$/.test(seen[0].url) && seen[1].init.method === 'DELETE' && /\/me\/subscribed_apps$/.test(seen[1].url),
    '3.3 subscribe POSTs messages on her account; unsubscribe DELETEs');
  ok(!(await M.setSubscribed({ fetchImpl: f200({ success: false }), token: 'T', on: true })).ok, '3.4 success:false is not a subscription');

  sec('4  the connect\u2019s messages flavour');
  process.env.IG_STATE_SECRET = process.env.IG_STATE_SECRET || 'b119b-secret'; process.env.IG_APP_ID = process.env.IG_APP_ID || '123';
  const O = require(P('src/lib/vendor/igOAuth.js'));
  const st = O.mintState('V1', { flavour: O.FLAVOURS.messages });
  const v = O.verifyState(st.state);
  const u = new URL(O.authorizeUrl(st.state, { flavour: O.FLAVOURS.messages }));
  ok(O.FLAVOURS.messages === 'messages' && v.ok && v.flavour === 'messages' && u.searchParams.get('scope') === 'instagram_business_basic,instagram_business_manage_messages',
    '4.1 the messages flavour is signed into the state and asks for basic + messages');
  const vi = O.verifyState(O.mintState('V1', { flavour: O.FLAVOURS.insights }).state); const vb = O.verifyState(O.mintState('V1', {}).state);
  ok(vi.flavour === 'insights' && vb.flavour === 'basic' && new URL(O.authorizeUrl('s', {})).searchParams.get('scope') === 'instagram_business_basic'
    && new URL(O.authorizeUrl('s', { flavour: 'insights' })).searchParams.get('scope') === 'instagram_business_basic,instagram_business_manage_insights',
    '4.2 the basic and insights flavours are unchanged');
  const [pl, mac] = st.state.split('.'); const j = JSON.parse(Buffer.from(pl.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()); j.s = 'insights';
  const forged = `${Buffer.from(JSON.stringify(j)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.${mac}`;
  ok(!O.verifyState(forged).ok, '4.3 a flavour edited in flight fails the signature');
  const ig = read('src/api/vendor/ig.js');
  const blk = ig.slice(ig.indexOf('if (flavour === igOAuth.FLAVOURS.messages) {'), ig.indexOf('// Not one token byte in this line.'));
  ok(blk.indexOf('probeMessagesScope') > -1 && blk.indexOf('probeMessagesScope') < blk.indexOf('markMessagesGranted') && /ig = 'no_scope'/.test(blk)
    && /flavour === igOAuth\.FLAVOURS\.messages \? NUMBER_RETURN_PATH/.test(ig), '4.4 the callback proves the grant before storing it, answers no_scope on a refusal, and returns to the room');

  sec('5  igRoom on a fake store');
  const R = require(P('src/lib/instagram/igRoom.js'));
  const d = R.deriveState;
  ok(d({ conn: null }) === 'not_connected' && d({ conn: { messages_granted_at: null, dm_state: 'on' } }) === 'not_connected'
    && d({ conn: { messages_granted_at: 't', dm_state: 'off' } }) === 'off' && d({ conn: { messages_granted_at: 't', dm_state: 'on' }, tokenOk: false }) === 'paused'
    && d({ conn: { messages_granted_at: 't', dm_state: 'on' }, tokenOk: true, laneOpen: false }) === 'waiting'
    && d({ conn: { messages_granted_at: 't', dm_state: 'on' }, tokenOk: true, laneOpen: true }) === 'on', '5.1 the five states derive from the row, the token and the lane');
  function store(conn, quietMin = 120) {
    const st2 = { conn: conn ? { ...conn } : null, quiet: quietMin, updates: [] };
    const from = (t) => { const q = { t, op: 'select', row: null }; const api = {
      select() { return api; }, eq() { return api; }, update(row) { q.op = 'update'; q.row = row; return api; },
      maybeSingle() { return run(); }, then(a, b) { return run().then(a, b); } };
      async function run() {
        if (q.op === 'update') { st2.updates.push({ t, row: q.row }); if (t === 'vendor_ig_connections' && st2.conn) Object.assign(st2.conn, q.row); if (t === 'vendors' && 'reply_quiet_minutes' in q.row) st2.quiet = q.row.reply_quiet_minutes; return { error: null }; }
        if (t === 'vendor_ig_connections') return { data: st2.conn, error: null };
        if (t === 'vendors') return { data: { reply_quiet_minutes: st2.quiet }, error: null };
        return { data: null, error: { message: 'x' } }; }
      return api; };
    return { from, st: st2 };
  }
  const subs = [];
  const deps = (sb, over = {}) => Object.assign({ supabase: sb, env: { IG_DM_WALK_VENDOR_IDS: 'V1' }, now: () => 'NOW', tokenOk: async () => true,
    mintAuthorize: async () => 'https://www.instagram.com/oauth/authorize?x=1', subscribe: async (_v, on) => { subs.push(on); return { ok: true }; } }, over);
  let s = store(null);
  ok((await R.answer('V2', deps(s))).status === 404 && (await R.flip('V2', true, deps(s))).status === 404 && (await R.quiet('V2', deps(s))).status === 404,
    '5.2 every door is 404 for a vendor the lane is closed to (dark)');
  let a = await R.answer('V1', deps(s));
  ok(a.status === 200 && a.body.state === 'not_connected' && /^https:\/\/www\.instagram\.com\//.test(a.body.authorize_url), '5.3 not connected: the state and an authorize address');
  s = store({ vendor_id: 'V1', messages_granted_at: 't', dm_state: 'off' });
  a = await R.answer('V1', deps(s));
  ok(a.body.state === 'off' && a.body.authorize_url === null, '5.4 proved and off: no authorize address');
  subs.length = 0; a = await R.flip('V1', true, deps(s));
  ok(a.body.state === 'on' && s.st.conn.dm_state === 'on' && s.st.conn.dm_consented_at === 'NOW' && s.st.conn.dm_subscribed_at === 'NOW' && subs.join() === 'true',
    '5.5 Turn on records consent, subscribes on a proved grant with a usable token, and reads on');
  subs.length = 0; a = await R.flip('V1', false, deps(s));
  ok(a.body.state === 'off' && s.st.conn.dm_subscribed_at === null && subs.join() === 'false', '5.6 Turn off unsubscribes and reads off');
  s = store({ vendor_id: 'V1', messages_granted_at: null, dm_state: 'off' }); subs.length = 0;
  a = await R.flip('V1', true, deps(s));
  ok(a.body.state === 'not_connected' && s.st.conn.dm_consented_at === 'NOW' && subs.length === 0 && a.body.authorize_url, '5.7 Turn on before the grant records consent, never subscribes, and hands back the authorize address');
  s = store({ vendor_id: 'V1', messages_granted_at: 't', dm_state: 'on' });
  a = await R.answer('V1', deps(s, { tokenOk: async () => false }));
  ok(a.body.state === 'paused' && a.body.authorize_url, '5.8 a lapsed token reads paused with the address to connect again');
  ok((await R.flip('V1', 'yes', deps(s))).status === 400, '5.9 a switch that is not a boolean is refused');
  s = store(null, 120);
  let q = await R.quiet('V1', deps(s)); const q2 = await R.quiet('V1', deps(s), 240); const q3 = await R.quiet('V1', deps(s), 90);
  ok(q.body.minutes === 120 && q2.body.minutes === 240 && s.st.quiet === 240 && q3.status === 400 && (await R.quiet('V1', deps(s), null)).status === 400,
    '5.10 the quiet time reads 120, stores 240, and refuses 90 or nothing');

  sec('6  mutations (in memory)');
  const RS = read('src/lib/instagram/igRoom.js');
  const M1 = loadAt('src/lib/instagram/igRoom.js', RS.replace("  if (!laneOpen) return { status: 404 };\n", ''));
  ok((await M1.answer('V2', deps(store(null)))).status === 200, 'M1 the lane gate removed opens the door to everyone (5.2 would redden)');
  const M2 = loadAt('src/lib/instagram/igRoom.js', RS.replace("if (r.conn.messages_granted_at && (await deps.tokenOk(vendorId))) {", 'if (true) {'));
  subs.length = 0; await M2.flip('V1', true, deps(store({ vendor_id: 'V1', messages_granted_at: null, dm_state: 'off' })));
  ok(subs.length === 1, 'M2 subscribing without a proved grant is caught (5.7 would redden)');
  const SS = read('src/lib/instagram/igSend.js');
  const M3 = loadAt('src/lib/instagram/igSend.js', SS.replace('return age >= 0 && age < WINDOW_MS;', 'return age >= 0;'));
  ok(M3.withinWindow(0, 30 * 3600e3) === true, 'M3 a window without its 24 hours is caught (2.5 would redden)');
  const M4 = loadAt('src/lib/instagram/igSend.js', SS.replace('if (bytes(t) <= MAX_BYTES) return [t];', 'return [t];'));
  ok(M4.splitReply(en).length === 1, 'M4 a reply sent unsplit is caught (2.2 would redden)');
  const PS = read('src/lib/pwaPaths.js');
  let threw = false; try { loadAt('src/lib/pwaPaths.js', PS.replace("  number: '/vendor/number',\n", '')).vendorPath('number'); } catch (_e) { threw = true; }
  ok(threw, 'M5 the room\u2019s path removed throws at lookup (1.2 and 1.1 via ig.js would redden)');

  console.log(`\nb119b: ${pass} passed, ${fail} failed${fail ? '\n  ' + failed.join('\n  ') : ''}`);
  process.exit(fail ? 1 : 0);
})();
