// scripts/b286_hub2b_server_bench.js · CE-47 · HUB-2b SERVER · rung b286.
//   §1 RULE 1's ONE HOME: src/lib/hub/gate.js answers "is the Hub open to this vendor" (testers or the clb.hub switch,
//      failing closed), moved word for word out of src/api/vendor/hub.js; hub.js asks it and holds no read of its own.
//   §2 ONE GUARD: addPartnerInterest refuses (writes nothing, says why) a call whose poster does not have the Hub open.
//   §3 the one line hub.js adds (it clears the gate's cache on load) leaves a running server's answers unchanged.
//   §4 the responses door's `outside`: partner rows only through PTN's partnerRowsFor, Instagram and Threads rows in
//      words, `responses` unchanged, never a phone or an email, the mark on one switch (partners.check_label), no 500.
//   §5 F-44.417: every one of the fourteen collab roles has a word.
// In-process with a supabase double; never a live call. e-277: stops before the first cell if a mutation is already in a file.
'use strict';
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const CHILD = !!process.env.B286_CHILD;
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; if (!CHILD) console.log(`  PASS  ${name}`); return true; } fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); return false; }
function sec(t) { if (!CHILD) console.log(`\n── ${t} ──`); }
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

// b284's supabase double (inserts, deletes, filters), for the guard and the doors
function makeDb(seed = {}) {
  const tables = { admin_config: [], hub_profiles: [], hub_credits: [], partner_orgs: [], vendors: [], collab_posts: [], collab_post_items: [], collab_responses: [], vendor_roster: [], team_members: [], ...seed };
  let uid = 0;
  function from(table) {
    const rows = tables[table] || (tables[table] = []);
    const q = { _f: [], _order: null };
    const matched = () => { let out = rows.filter((r) => q._f.every((f) => f(r))); if (q._order) { const { col, asc } = q._order; out = out.slice().sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1)); } return out; };
    q.select = () => q; q.eq = (c, v) => { q._f.push((r) => r[c] === v); return q; }; q.neq = (c, v) => { q._f.push((r) => r[c] !== v); return q; };
    q.gte = (c, v) => { q._f.push((r) => r[c] >= v); return q; }; q.in = (c, vs) => { q._f.push((r) => vs.includes(r[c])); return q; };
    q.is = (c, v) => { q._f.push((r) => (r[c] ?? null) === v); return q; };
    q.order = (col, o) => { q._order = { col, asc: !!(o && o.ascending) }; return q; }; q.limit = (n) => { q._limit = n; return q; };
    const settle = (many) => { const r = matched(); return { data: many ? (q._limit ? r.slice(0, q._limit) : r) : (r[0] || null), error: null }; };
    q.maybeSingle = async () => settle(false); q.single = async () => settle(false);
    q.then = (res, rej) => Promise.resolve(settle(true)).then(res, rej);
    q.insert = (payload) => {
      const list = Array.isArray(payload) ? payload : [payload];
      const made = list.map((p) => { const row = { id: `${table}-${++uid}`, created_at: new Date(Date.now() + uid).toISOString(), ...p }; rows.push(row); return row; });
      const res1 = { data: Array.isArray(payload) ? made : made[0], error: null };
      const done = { select: () => done, single: async () => res1, maybeSingle: async () => res1, then: (r, j) => Promise.resolve(res1).then(r, j) };
      return done;
    };
    q.update = (patch) => {
      const u = { _f: [] }; u.eq = (c, v) => { u._f.push((r) => r[c] === v); return u; }; u.select = () => u;
      const run = () => { const hits = rows.filter((r) => u._f.every((f) => f(r))); hits.forEach((r) => Object.assign(r, patch)); return { data: hits.map((h) => ({ ...h })), error: null }; };
      u.maybeSingle = async () => { const r = run(); return { data: r.data[0] || null, error: null }; }; u.single = u.maybeSingle;
      u.then = (r, j) => Promise.resolve(run()).then(r, j); return u;
    };
    q.delete = () => { const d = { _f: [] }; d.eq = (c, v) => { d._f.push((r) => r[c] === v); return d; };
      d.then = (r, j) => { for (let i = rows.length - 1; i >= 0; i -= 1) if (d._f.length && d._f.every((f) => f(rows[i]))) rows.splice(i, 1); return Promise.resolve({ data: null, error: null }).then(r, j); }; return d; };
    return q;
  }
  return { from, _tables: tables };
}
/** A config-only supabase double: admin_config rows, or a database that throws. */
function cfgDb(rows, opts = {}) {
  return { from(t) {
    if (opts.throws) throw new Error('database unreachable');
    const q = { _f: [] };
    q.select = () => q; q.eq = (c, v) => { q._f.push((r) => r[c] === v); return q; };
    q.maybeSingle = async () => ({ data: (t === 'admin_config' ? rows : []).find((r) => q._f.every((f) => f(r))) || null, error: null });
    return q;
  } };
}

async function cells() {
  sec('1  Rule 1’s one home: src/lib/hub/gate.js');
  const gatePath = path.join(ROOT, 'src/lib/hub/gate.js');
  delete require.cache[require.resolve(gatePath)];
  const gate = require(gatePath);
  const testers = require(path.join(ROOT, 'src/lib/collab/testers.js'));
  const hubSrc = code(read('src/api/vendor/hub.js'));
  ok(/require\('\.\.\/\.\.\/lib\/hub\/gate'\)/.test(hubSrc) && !/admin_config|clb\.hub|switchOn|testers\(|require\('\.\.\/\.\.\/lib\/collab\/testers'\)/.test(hubSrc),
    '1.1 hub.js asks gate.js and holds no switch or testers read of its own');
  ok(JSON.stringify(Object.keys(gate).sort()) === JSON.stringify(['CLOSED', '_reset', 'hubOpen']) && gate.CLOSED === 'Collab Hub is not open for your account yet.',
    '1.2 gate.js exports hubOpen, CLOSED and _reset, and CLOSED is the one plain sentence', JSON.stringify(Object.keys(gate)));

  // 1.3 moved word for word: the gate's lines in gate.js hash to what HUB2_SRV_2 shipped inside hub.js (sha256 of that
  // block, taken from HUB2_SRV_2's hub.js, 444e7cd5…). Pinned, so the cell holds after this package lands, not only before.
  const SRV2_BLOCK_SHA = '13d4937cd8011cfd8b9b76c4235285d98c60592b0d2b12b13e1d6ed4eac0984d';
  const block = (s) => { const a = s.indexOf("const { testers } = require('../../lib/collab/testers');"); const b = s.indexOf('async function hubOpen'); const e = s.indexOf('\n}\n', b); return a < 0 || b < 0 || e < 0 ? null : s.slice(a, e + 3); };
  const now = block(read('src/lib/hub/gate.js'));
  const nowSha = now === null ? null : crypto.createHash('sha256').update(now).digest('hex');
  ok(nowSha === SRV2_BLOCK_SHA, '1.3 the gate\u2019s lines are moved word for word (their sha256 is the block HUB2_SRV_2 shipped in hub.js)', nowSha);

  // 1.4 the same answers, run for real
  const ask = async (rows, id, opts) => { gate._reset(); testers._reset(); return gate.hubOpen(cfgDb(rows, opts), id); };
  const T = [{ key: 'clb.testers', value: JSON.stringify(['v-dev440']) }];
  const answers = {
    tester: await ask(T, 'v-dev440'),
    notTester: await ask(T, 'v-other'),
    switchText: await ask([...T, { key: 'clb.hub', value: 'on' }], 'v-other'),
    switchJson: await ask([...T, { key: 'clb.hub', value: '"ON"' }], 'v-other'),
    switchJunk: await ask([...T, { key: 'clb.hub', value: 'on please' }], 'v-other'),
    switchOff: await ask([...T, { key: 'clb.hub', value: 'off' }], 'v-other'),
    testersJunk: await ask([{ key: 'clb.testers', value: 'not json' }], 'v-dev440'),
    nothing: await ask([], 'v-dev440'),
    noDatabase: await ask(T, 'v-dev440', { throws: true }),
  };
  ok(answers.tester === true && answers.switchText === true && answers.switchJson === true
    && [answers.notTester, answers.switchJunk, answers.switchOff, answers.testersJunk, answers.nothing, answers.noDatabase].every((x) => x === false),
    '1.4 open for a tester or when clb.hub is on (text or JSON, any case); closed for everyone else, for junk, missing rows or no database', JSON.stringify(answers));
  gate._reset(); testers._reset();
  const db = cfgDb([{ key: 'clb.hub', value: 'off' }]); const first = await gate.hubOpen(db, 'v-x');
  const db2 = cfgDb([{ key: 'clb.hub', value: 'on' }]); const cached = await gate.hubOpen(db2, 'v-x');
  gate._reset(); const fresh = await gate.hubOpen(db2, 'v-x');
  ok(first === false && cached === false && fresh === true, '1.5 the switch is read at most once a minute (cached), and _reset clears it', JSON.stringify({ first, cached, fresh }));

  sec('2  ONE GUARD: addPartnerInterest refuses a call whose poster does not have the Hub open');
  const interest = require(path.join(ROOT, 'src/lib/collab/interest.js'));
  const th = async (fn) => { try { await fn(); return null; } catch (e) { return e.message; } };
  const post = (vid) => ({ id: `p-${vid}`, vendor_id: vid, requirement_type: 'photography', state: 'open' });
  const input = (vid, n = 'Riya Kapoor') => ({ post_id: `p-${vid}`, partner_id: 'org-1', send_id: `send-${vid}`, name: n, role: 'model' });
  const clearAll = () => { gate._reset(); testers._reset(); };
  clearAll(); let idb = makeDb({ collab_interest: [], collab_posts: [post('v-closed'), post('v-dev440')], admin_config: [{ key: 'clb.testers', value: JSON.stringify(['v-dev440']) }] });
  const refusal = await th(() => interest.addPartnerInterest(idb, input('v-closed')));
  ok(refusal === interest.NOT_OPEN && idb._tables.collab_interest.length === 0 && /does not have Collab Hub open yet/.test(interest.NOT_OPEN), '2.1 a non-tester\u2019s call gets no partner row: refused, nothing written, and it says why', refusal);
  const made = await interest.addPartnerInterest(idb, input('v-dev440'));
  ok(made && made.existed === false && idb._tables.collab_interest.length === 1 && idb._tables.collab_interest[0].post_id === 'p-v-dev440', '2.2 a tester\u2019s call takes the partner row', JSON.stringify(made));
  clearAll(); idb = makeDb({ collab_interest: [], collab_posts: [post('v-closed')], admin_config: [{ key: 'clb.hub', value: 'on' }] });
  const anyone = await interest.addPartnerInterest(idb, input('v-closed'));
  ok(anyone && idb._tables.collab_interest.length === 1, '2.3 once clb.hub is on, any vendor\u2019s call takes partner rows');
  clearAll(); idb = makeDb({ collab_interest: [], collab_posts: [post('v-dev440')], admin_config: [{ key: 'clb.testers', value: JSON.stringify(['v-dev440']) }] });
  const f0 = idb.from; idb.from = (t) => { if (t === 'admin_config') throw new Error('database unreachable'); return f0(t); };
  const unread = await th(() => interest.addPartnerInterest(idb, input('v-dev440')));
  ok(unread === interest.NOT_OPEN && idb._tables.collab_interest.length === 0, '2.4 the gate unreadable means refused, and nothing written', unread);

  sec('3  the one added line: a running server\u2019s answers are unchanged by it');
  // hub.js clears the gate's cache once, when it loads. In a running server that is once, at start; after that the cache
  // behaves exactly as it did when it lived inside the router: a switch flipped mid-minute is seen when the minute is up.
  const stubPut = (rel, exp) => { const p = path.join(ROOT, rel); require.cache[require.resolve(p)] = { id: p, filename: p, loaded: true, exports: exp }; };
  stubPut('src/api/middleware/requireAuth.js', (req, res, next) => next());
  stubPut('src/api/middleware/resolveVendor.js', () => (req, res, next) => { req.vendor = { id: 'v-other' }; next(); });
  delete require.cache[require.resolve(path.join(ROOT, 'src/api/vendor/hub.js'))];
  clearAll();
  const sdb = makeDb({ vendors: [{ id: 'v-other', business_name: 'Other Studio', city: 'Delhi', category: 'photography' }], admin_config: [{ key: 'clb.hub', value: 'off' }] });
  const express = require('express'); const http = require('http'); const app = express(); app.use(express.json()); app.locals.supabase = sdb;
  app.use('/hub', require(path.join(ROOT, 'src/api/vendor/hub.js')));
  const server = http.createServer(app); await new Promise((r) => server.listen(0, r)); const port = server.address().port;
  const me = async () => (await (await fetch(`http://127.0.0.1:${port}/hub/me`)).json()).hub_open;
  const a1 = await me();
  sdb._tables.admin_config[0].value = 'on';
  const a2 = await me(); const a3 = await me();
  gate._reset(); const a4 = await me();
  await new Promise((r) => server.close(r));
  ok(a1 === false && a2 === false && a3 === false && a4 === true, '3.1 one running server: the switch flipped mid-minute is not seen until the minute is up (no reset per request), then it is', JSON.stringify({ a1, a2, a3, a4 }));

  sec('4  the responses door’s `outside` (partner rows only through PTN’s partnerRowsFor)');
  const ME4 = 'v-dev440', OTHER4 = 'v-other';
  const put4 = (rel, exp) => { const p = path.join(ROOT, rel); require.cache[require.resolve(p)] = { id: p, filename: p, loaded: true, exports: exp }; };
  async function serveCollab(db, vendorId) {
    put4('src/api/middleware/requireAuth.js', (req, res, next) => next());
    put4('src/api/middleware/resolveVendor.js', () => (req, res, next) => { req.vendor = { id: vendorId }; next(); });
    delete require.cache[require.resolve(path.join(ROOT, 'src/api/vendor/collab.js'))];
    const express = require('express'); const http = require('http'); const app = express(); app.use(express.json()); app.locals.supabase = db;
    app.use('/collab', require(path.join(ROOT, 'src/api/vendor/collab.js')));
    const server = http.createServer(app); await new Promise((r) => server.listen(0, r)); const port = server.address().port;
    const get = async (u) => { const r = await fetch(`http://127.0.0.1:${port}${u}`); return { status: r.status, body: await r.json().catch(() => null) }; };
    return { get, close: () => new Promise((r) => server.close(r)) };
  }
  const T0 = Date.now(); const at = (m) => new Date(T0 - m * 60000).toISOString();
  const seed4 = (cfg = []) => ({
    collab_posts: [{ id: 'call1', vendor_id: ME4, requirement_type: 'model', state: 'open' }],
    collab_responses: [{ id: 'resp-a', post_id: 'call1', state: 'interested', created_at: at(1), contact_shared_at: null }],
    partner_orgs: [{ id: 'org-ok', name: 'Starlight Talent', kind: 'agency', cities: ['Delhi'], instagram_handle: 'starlight.talent', website: 'https://starlighttalent.in', check_state: 'checked' },
      { id: 'org-blocked', name: 'Blocked Agency', kind: 'agency', cities: [], instagram_handle: null, website: null, check_state: 'blocked' }],
    collab_interest: [
      { id: 'i-part', post_id: 'call1', source: 'partner', partner_id: 'org-ok', send_id: 's1', display_name: 'Riya Kapoor', role: 'model', link: 'https://www.instagram.com/riya.kapoor/', created_at: at(2), body: 'call me 9811000099' },
      { id: 'i-blk', post_id: 'call1', source: 'partner', partner_id: 'org-blocked', send_id: 's2', display_name: 'Someone', role: 'model', link: null, created_at: at(3) },
      { id: 'i-ig', post_id: 'call1', source: 'instagram', platform: 'instagram', how: 'comment', display_name: 'tara.sen 9811000098 tara@mail.in', external_user_id: '17841400000000', body: 'my number 9811000097', vendor_id: 'v-secret', created_at: at(4) },
      { id: 'i-th', post_id: 'call1', source: 'threads', platform: 'threads', how: 'reply', display_name: 'kabir.lens', created_at: at(5) },
      { id: 'i-else', post_id: 'call-other', source: 'threads', platform: 'threads', how: 'reply', display_name: 'not hers', created_at: at(6) }],
    admin_config: [{ key: 'clb.testers', value: JSON.stringify([ME4]) }, ...cfg],
  });
  let s4 = await serveCollab(makeDb(seed4()), ME4); let r4 = await s4.get('/collab/call1/responses');
  const o4 = (r4.body && r4.body.outside) || [];
  ok(r4.status === 200 && JSON.stringify(o4.map((x) => x.id)) === JSON.stringify(['i-part', 'i-ig', 'i-th'])
    && o4[0].source === 'partner' && JSON.stringify(Object.keys(o4[0])) === JSON.stringify(['id', 'source', 'name', 'role', 'role_word', 'link', 'partner', 'fee_line'])
    && o4[1].platform_word === 'Instagram' && o4[1].how === 'comment' && o4[2].platform_word === 'Threads',
    '4.1 `outside`: her call’s rows, newest first; the partner row in PTN’s shape (a blocked partner dropped); Instagram and Threads rows with name, where and when', JSON.stringify(o4).slice(0, 220));
  ok(Array.isArray(r4.body.responses) && r4.body.responses.length === 1 && JSON.stringify(Object.keys(r4.body.responses[0])) === JSON.stringify(['response_id', 'state', 'responded_at', 'contact_shared_at', 'vendor']),
    '4.2 `responses` is unchanged: the TDW vendor rows, in their old shape');
  const raw4 = JSON.stringify(r4.body);
  ok(!/9811\d{6}|\+91|@[a-z]+\.[a-z]|"body"|external_user_id|17841400000000|v-secret|"vendor_id"/.test(raw4) && o4[1].name === 'tara.sen',
    '4.3 nothing in the raw body is a phone, an email, a reply’s body, an external id or a vendor id; a name carrying them is cut to its words', raw4.slice(0, 200));
  await s4.close();
  s4 = await serveCollab(makeDb(seed4()), OTHER4); r4 = await s4.get('/collab/call1/responses');
  ok(r4.status === 403 && !('outside' in (r4.body || {})), '4.4 only the call’s poster sees it (403, no `outside`)');
  await s4.close();

  const labelCase = async (cfg, throwCfg) => { const d = makeDb(seed4(cfg)); if (throwCfg) { const f = d.from; d.from = (t) => { if (t === 'admin_config') { const q = f(t); q.maybeSingle = async () => { throw new Error('unreachable'); }; return q; } return f(t); }; }
    gate._reset(); testers._reset(); const sv = await serveCollab(d, ME4); const x = await sv.get('/collab/call1/responses'); await sv.close(); return ((x.body && x.body.outside) || []).find((y) => y.id === 'i-part') || {}; };
  const off = await labelCase([]); const junk = await labelCase([{ key: 'partners.check_label', value: 'yes' }]); const oldKey = await labelCase([{ key: 'clb.partner_check_label', value: 'on' }]);
  const on = await labelCase([{ key: 'partners.check_label', value: 'on' }]); const onJson = await labelCase([{ key: 'partners.check_label', value: '"ON"' }]);
  ok(!('check_words' in off) && !('check_words' in junk) && !('check_words' in oldKey) && typeof on.check_words === 'string' && on.check_words.length > 0 && typeof onJson.check_words === 'string',
    '4.5 the mark rides ONE switch, partners.check_label: no check_words field until it is on (text or JSON, any case); off, junk, or the retired clb.partner_check_label key show none', JSON.stringify({ off: 'check_words' in off, junk: 'check_words' in junk, oldKey: 'check_words' in oldKey, on: on.check_words }));

  const failDb = (what) => { const d = makeDb(seed4()); const f = d.from; d.from = (t) => { if (t === what) { const q = f(t); const bad = { data: null, error: { message: 'down' } }; q.in = () => ({ then: (r, j) => Promise.resolve(bad).then(r, j) }); q.order = () => ({ then: (r, j) => Promise.resolve(bad).then(r, j) }); return q; } return f(t); }; return d; };
  gate._reset(); s4 = await serveCollab(failDb('partner_orgs'), ME4); r4 = await s4.get('/collab/call1/responses'); await s4.close();
  ok(r4.status === 200 && r4.body.responses.length === 1 && JSON.stringify((r4.body.outside || []).map((x) => x.id)) === JSON.stringify(['i-ig', 'i-th']) && /Partner suggestions could not be shown just now\./.test(r4.body.outside_note || ''),
    '4.6 partner_orgs unreadable (partnerRowsFor throws): no 500; the TDW vendor rows and the other outside rows still show, and one plain sentence says partners could not be shown', JSON.stringify(r4.body).slice(0, 200));
  gate._reset(); s4 = await serveCollab(failDb('collab_interest'), ME4); r4 = await s4.get('/collab/call1/responses'); await s4.close();
  ok(r4.status === 200 && r4.body.responses.length === 1 && Array.isArray(r4.body.outside) && r4.body.outside.length === 0 && /could not be shown just now/.test(r4.body.outside_note || ''),
    '4.7 her outside rows unreadable: no 500; the TDW vendor rows still show, with one plain sentence', JSON.stringify(r4.body).slice(0, 160));

  // 4.8 the chair's cell: a non-tester's call never has partner rows to show (the guard writes none; the door has none to map)
  gate._reset(); testers._reset();
  const d8 = makeDb({ collab_posts: [{ id: 'callX', vendor_id: OTHER4, requirement_type: 'model', state: 'open' }], collab_responses: [], collab_interest: [], partner_orgs: seed4().partner_orgs, admin_config: [{ key: 'clb.testers', value: JSON.stringify([ME4]) }] });
  const refused8 = await th(() => interest.addPartnerInterest(d8, { post_id: 'callX', partner_id: 'org-ok', send_id: 's9', name: 'Riya Kapoor', role: 'model' }));
  s4 = await serveCollab(d8, OTHER4); r4 = await s4.get('/collab/callX/responses'); await s4.close();
  ok(refused8 === interest.NOT_OPEN && r4.status === 200 && !(r4.body.outside || []).some((x) => x.source === 'partner'), '4.8 a non-tester’s call never has partner rows to show: the guard refused the suggestion, and her responses page has none', JSON.stringify(r4.body.outside));
  ok(!/from\('partner_orgs'\)/.test(code(read('src/api/vendor/collab.js'))) && /require\('\.\.\/\.\.\/lib\/partners\/interestRows'\)/.test(read('src/api/vendor/collab.js')),
    '4.9 collab.js reads no partner_orgs of its own: partner rows come only through partnerRowsFor');

  sec('5  F-44.417: every collab role has a word');
  delete require.cache[require.resolve(path.join(ROOT, 'src/lib/collab/social.js'))];
  const social = require(path.join(ROOT, 'src/lib/collab/social.js'));
  const { COLLAB_ROLES } = require(path.join(ROOT, 'src/lib/collab/roles.js'));
  const words = COLLAB_ROLES.map((r) => social.rolesLine([{ requirement_type: r }]));
  ok(COLLAB_ROLES.length === 14 && words.every((w) => typeof w === 'string' && w.length > 0) && new Set(words).size === 14
    && social.rolesLine([{ requirement_type: 'model' }]) === 'model' && social.rolesLine([{ requirement_type: 'stylist' }]) === 'stylist' && social.rolesLine([{ requirement_type: 'studio' }]) === 'studio',
    '5.1 all fourteen collab roles have their own word (model, stylist, studio included); none is empty', JSON.stringify(words));
  const cap = social.captionFor({ event_date: '2026-11-08', city: 'Delhi' }, [{ requirement_type: 'model' }, { requirement_type: 'studio' }], 'instagram', null).caption;
  ok(/^Looking for: model, studio$/m.test(cap), '5.2 a call for a model and a studio says so on the house post ("Looking for: model, studio"), never "Looking for: " alone', cap.split('\n')[0]);
}

const MUTS = [
  ['src/lib/hub/gate.js', "    _sw = v === 'on';", "    _sw = v.length > 0;", 'M1 any switch value opens it', '1.4'],
  ['src/lib/hub/gate.js', "return (await testers(sb)).includes(vendorId); } catch (_e) { return false; }", "return true; } catch (_e) { return false; }", 'M2 everyone treated as a tester', '1.4'],
  ['src/lib/hub/gate.js', "const CLOSED = 'Collab Hub is not open for your account yet.';", "const CLOSED = 'Not open.';", 'M3 the sentence changed', '1.2'],
  ['src/lib/hub/gate.js', "function _reset() { _swAt = 0; _sw = false; }", "function _reset() { }", 'M4 _reset clears nothing', '1.5'],
  ['src/lib/collab/interest.js', "  if (!(await hubOpen(supabase, post.vendor_id))) throw new Error(NOT_OPEN);\n", "", 'M6 the guard removed', '2.1'],
  ['src/lib/collab/interest.js', "  if (!(await hubOpen(supabase, post.vendor_id))) throw new Error(NOT_OPEN);", "  if (false) throw new Error(NOT_OPEN);", 'M7 the guard never refuses', '2.4'],
  ['src/api/vendor/hub.js', "  if (!(await hubOpen(sb, req.vendor.id))) return okRes(res, { hub_open: false, line: CLOSED });", "  resetGate(); if (!(await hubOpen(sb, req.vendor.id))) return okRes(res, { hub_open: false, line: CLOSED });", 'M8 the cache cleared on every request', '3.1'],
  ['src/api/vendor/collab.js', "    if (r.source === 'partner') { const m = partnerById.get(r.id); if (m) out.push(m); continue; }", "    if (r.source === 'partner') { out.push(r); continue; }", 'M9 raw partner rows echoed', '4.1'],
  ['src/api/vendor/collab.js', "  if (!(await partnerCheckLabelOn(sb))) mapped =", "  if (false) mapped =", 'M10 the mark shown with the switch off', '4.5'],
  ['src/api/vendor/collab.js', "    return v === 'on';\n  } catch (_e) { return false; }\n}\nasync function outsideFor", "    return !!v;\n  } catch (_e) { return false; }\n}\nasync function outsideFor", 'M11 any switch value shows the mark', '4.5'],
  ['src/api/vendor/collab.js', "  try { mapped = await partnerRowsFor(sb, rows); } catch (_e) { note = PARTNERS_READ_FAILED; mapped = []; }", "  mapped = await partnerRowsFor(sb, rows);", 'M12 a partner read failure becomes a 500', '4.6'],
  ['src/api/vendor/collab.js', "    const name = outsideName(r.display_name);", "    const name = r.display_name;", 'M13 a name carrying a phone or an email shown as it is', '4.3'],
  ['src/lib/collab/social.js', "(CRAFT_WORD[k] || ROLE_WORD[k]);", "CRAFT_WORD[k];", 'M14 model, stylist and studio lose their words', '5.1'],
  ['src/lib/hub/gate.js', "  if (Date.now() - _swAt < 60 * 1000) return _sw;", "  if (Date.now() - _swAt < 61 * 1000) return _sw;", 'M5 one word of the moved lines changed', '1.3'],
];
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function leftovers() {   // e-277: no mutation already present before the first cell
  const bad = [];
  for (const [file, from, to, name] of MUTS) { const s = read(file); if (s.split(from).length !== 2 || (to && s.includes(to))) bad.push(`${file} (${name})`); }
  return bad;
}
(async () => {
  if (!CHILD) { const bad = leftovers(); if (bad.length) { console.log(`STOP — mutated file(s): ${bad.join('; ')}. Restore them, then run again.`); process.exit(2); } }
  try { await cells(); } catch (e) { ok(false, `b286 crashed: ${e && e.stack}`); }
  if (CHILD) process.exit(fail ? 1 : 0);
  sec('9  mutations of production code (each must red its cell in a child run; restored by sha)');
  const saved = new Map(); const restore = () => { for (const [p, b] of saved) fs.writeFileSync(p, b); };
  process.on('exit', restore); for (const sg of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sg, () => process.exit(130));
  for (const [file, from, to, name, cell] of MUTS) {
    const p = path.join(ROOT, file); const before = sha(p); const src = fs.readFileSync(p, 'utf8');
    if (src.split(from).length !== 2) { ok(false, `${name}: anchor found exactly once`, file); continue; }
    saved.set(p, src); fs.writeFileSync(p, src.replace(from, to));
    const r = cp.spawnSync(process.execPath, [__filename], { env: { ...process.env, B286_CHILD: '1' }, encoding: 'utf8', timeout: 120000, killSignal: 'SIGKILL' });
    fs.writeFileSync(p, src); saved.delete(p);
    const red = r.status === 1 && new RegExp(`FAIL  ${cell.replace('.', '\\.')} `).test(r.stdout || '');
    ok(red && sha(p) === before, `${name}: reddens ${cell}, restored by sha`, (r.stdout || '').split('\n').filter((l) => l.includes('FAIL')).join(' / '));
  }
  console.log(`\nb286 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})();
