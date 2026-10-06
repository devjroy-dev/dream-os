// scripts/b282_clb2a_partner_seams_bench.js · CE-47 · CLB-2a · THE SEAMS PTN NEEDS (server only).
// What it holds: src/lib/collab/{roles,interest,joinLink,events,calls}.js, the house token's refresh in publish.js,
// collabItems' collab roles and "needed", the vendor collab door's event and its "source" on my-posts, and
// db/migrations/0197. THE CELL (§4): a row a partner put forward never gets the join link. In-process: a supabase
// double and a fake Meta. Mutations of production code run each in a fresh child (B282_CHILD), restored by sha.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const CHILD = !!process.env.B282_CHILD;
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; if (!CHILD) console.log(`  PASS  ${name}`); return true; } fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); return false; }
function sec(t) { if (!CHILD) console.log(`\n── ${t} ──`); }
// ── the supabase double (b4c1's, with update·select and the admin door's reads) ──
function makeDb(seed = {}) {
  const tables = { collab_interest: [], collab_house_tokens: [], vendor_feature_choices: [], vendors: [], collab_posts: [], collab_post_items: [], collab_responses: [], vendor_roster: [], admin_config: [], capabilities: [], collab_shares: [], collab_prospects: [], ...seed };
  let uid = 0;
  function from(table) {
    const rows = tables[table] || (tables[table] = []);
    const q = { _f: [], _order: null };
    const matched = () => { let out = rows.filter((r) => q._f.every((f) => f(r))); if (q._order) { const { col, asc } = q._order; out = out.slice().sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1)); } return out; };
    q.select = () => q; q.eq = (c, v) => { q._f.push((r) => r[c] === v); return q; }; q.neq = (c, v) => { q._f.push((r) => r[c] !== v); return q; };
    q.gt = (c, v) => { q._f.push((r) => r[c] > v); return q; }; q.lt = (c, v) => { q._f.push((r) => r[c] < v); return q; };
    q.in = (c, vs) => { q._f.push((r) => vs.includes(r[c])); return q; };
    q.not = (c, op, v) => { if (op === 'is' && v === null) q._f.push((r) => (r[c] ?? null) !== null); else q._f.push((r) => r[c] !== v); return q; };
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
      const u = { _f: [] }; u.eq = (c, v) => { u._f.push((r) => r[c] === v); return u; }; u.lt = (c, v) => { u._f.push((r) => r[c] < v); return u; }; u.select = () => u;
      const run = () => { const hits = rows.filter((r) => u._f.every((f) => f(r))); hits.forEach((r) => Object.assign(r, patch)); return { data: hits.map((h) => ({ ...h })), error: null }; };
      u.maybeSingle = async () => { const r = run(); return { data: r.data[0] || null, error: null }; }; u.single = u.maybeSingle;
      u.then = (r, j) => Promise.resolve(run()).then(r, j); return u;
    };
    q.upsert = (row, opt) => { const key = (opt && opt.onConflict) || 'id'; const hit = rows.find((r) => r[key] === row[key]); if (hit) Object.assign(hit, row); else rows.push({ ...row }); return Promise.resolve({ data: null, error: null }); };
    q.delete = () => { const d = { eq: () => d, then: (r) => Promise.resolve({ data: null, error: null }).then(r) }; return d; };
    return q;
  }
  return { from, _tables: tables };
}
function stubs(vendorId) {
  const put = (rel, exp) => { const p = path.join(ROOT, rel); require.cache[require.resolve(p)] = { id: p, filename: p, loaded: true, exports: exp }; };
  put('src/api/middleware/requireAuth.js', (req, res, next) => next());
  put('src/api/middleware/resolveVendor.js', () => (req, res, next) => { req.vendor = { id: vendorId }; next(); });
  put('src/api/admin/requireAdmin.js', (req, res, next) => next());
}

async function serve(db, vendorId) {
  stubs(vendorId);
  for (const f of ['src/api/vendor/collab.js', 'src/api/admin/collab.js']) delete require.cache[require.resolve(path.join(ROOT, f))];
  const cap = require(path.join(ROOT, 'src/lib/capabilities.js')); cap.bind(db); cap._resetCapabilitiesCache();
  require(path.join(ROOT, 'src/lib/collab/testers.js'))._reset();
  const express = require('express'); const app = express(); app.use(express.json()); app.locals.supabase = db;
  app.use('/collab', require(path.join(ROOT, 'src/api/vendor/collab.js')));
  app.use('/admin/collab', require(path.join(ROOT, 'src/api/admin/collab.js')));
  const server = http.createServer(app); await new Promise((r) => server.listen(0, r)); const port = server.address().port;
  const call = async (method, url, body) => { const r = await fetch(`http://127.0.0.1:${port}${url}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => null) }; };
  return { call, close: () => new Promise((r) => server.close(r)) };
}
const ME = 'v-dev440';
const FUTURE = (() => { const d = new Date(Date.now() + 40 * 86400000); return d.toISOString().slice(0, 10); })();
const PAST = (() => { const d = new Date(Date.now() - 3 * 86400000); return d.toISOString().slice(0, 10); })();
const POST = { id: 'p1', vendor_id: ME, requirement_type: 'photography', event_date: FUTURE, city: 'Delhi', state: 'open' };
const seed = () => ({ vendors: [{ id: ME, business_name: 'DEV440 Studio', city: 'Delhi' }], collab_posts: [{ ...POST }],
  capabilities: [{ key: 'flag.collab_house_instagram', kind: 'flag', status: 'pending' }, { key: 'flag.collab_threads', kind: 'flag', status: 'pending' }] });

async function cells() {
  const roles = require(path.join(ROOT, 'src/lib/collab/roles.js'));
  const { VENDOR_CATEGORIES } = require(path.join(ROOT, 'src/agent/categories.js'));
  const items = require(path.join(ROOT, 'src/lib/vendor/collabItems.js'));
  sec('1  the collab role list (ruled 6 October 2026)');
  ok(JSON.stringify(roles.COLLAB_ROLES) === JSON.stringify([...VENDOR_CATEGORIES, 'model', 'stylist', 'studio']), '1.1 the eleven plus model, stylist, studio, in that order', roles.COLLAB_ROLES.join(','));
  ok(items.REQUIREMENT_TYPES.length === 11 && !items.REQUIREMENT_TYPES.includes('model'), '1.2 REQUIREMENT_TYPES stays the vendor eleven (what a vendor is)');
  const mig = fs.readFileSync(path.join(ROOT, 'db/migrations/0197_collab_roles_partner_interest.sql'), 'utf8').replace(/--.*$/gm, '');
  const lists = [...mig.matchAll(/CHECK \(requirement_type IN \(([^)]*)\)\)/g)].map((m) => [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]));
  ok(lists.length === 2 && lists.every((l) => JSON.stringify(l) === JSON.stringify(roles.COLLAB_ROLES)), '1.3 0197: both role CHECKs are the collab role list, word for word', JSON.stringify(lists));
  sec('2  a call\u2019s roles and how many');
  let r = items.normaliseItemsInput({ items: [{ requirement_type: 'model', needed: 2 }, { requirement_type: 'makeup' }] });
  ok(r.ok && r.items[0].requirement_type === 'model' && r.items[0].needed === 2 && r.items[1].needed === 1, '2.1 "2 models" and a makeup artist (needed defaults to 1)', JSON.stringify(r));
  ok(!items.normaliseItemsInput({ items: [{ requirement_type: 'model', needed: 0 }] }).ok && !items.normaliseItemsInput({ items: [{ requirement_type: 'model', needed: 21 }] }).ok && !items.normaliseItemsInput({ items: [{ requirement_type: 'model', needed: 1.5 }] }).ok, '2.2 needed is a whole number from 1 to 20');
  ok(!items.normaliseItemsInput({ items: [{ requirement_type: 'astronaut' }] }).ok, '2.3 a role not on the list is refused');

  sec('3  a partner puts someone forward (addPartnerInterest)');
  const { addPartnerInterest } = require(path.join(ROOT, 'src/lib/collab/interest.js'));
  const { joinLinkFor } = require(path.join(ROOT, 'src/lib/collab/joinLink.js'));
  let db = makeDb(seed());
  const A = { post_id: 'p1', partner_id: 'org-1', send_id: 'send-1', name: 'Riya Kapoor', role: 'model', link: 'https://www.instagram.com/riya/' };
  const a1 = await addPartnerInterest(db, A);
  const row = db._tables.collab_interest.find((x) => x.id === a1.id) || {};
  ok(a1.id && !a1.existed && row.source === 'partner' && row.join_link_sent === false && row.role === 'model' && row.partner_id === 'org-1', '3.1 the row lands on the call: source partner, never sent a join link', JSON.stringify(row));
  ok(!('phone' in row) && !('email' in row), '3.2 the row holds no phone and no email');
  const a2 = await addPartnerInterest(db, { ...A, name: '  riya   KAPOOR ' });
  ok(a2.id === a1.id && a2.existed === true && db._tables.collab_interest.length === 1, '3.3 idempotent on (send, name): the same person again returns the same id', JSON.stringify(a2));
  const a3 = await addPartnerInterest(db, { ...A, send_id: 'send-2' });
  ok(a3.id !== a1.id && db._tables.collab_interest.length === 2, '3.4 a different send makes a new row');
  const thrown = async (inp) => { try { await addPartnerInterest(db, inp); return null; } catch (e) { return e.message; } };
  ok(await thrown({ ...A, partner_id: null }) && await thrown({ ...A, name: 'call 9811012345' }) && await thrown({ ...A, name: 'x@y.com' }) && await thrown({ ...A, role: 'astronaut' }) && await thrown({ ...A, post_id: 'nope' }), '3.5 refused: no partner, a phone or email in the name, a role not on the list, no such call');
  const a4 = await addPartnerInterest(db, { ...A, send_id: 'send-3', link: 'javascript:alert(1)' });
  ok((db._tables.collab_interest.find((x) => x.id === a4.id) || {}).link === null, '3.6 a link that is not http or https is dropped');

  sec('4  THE CELL: a partner row never gets the join link (the real function chain)');
  ok(joinLinkFor(row) === null && db._tables.collab_interest.every((x) => joinLinkFor(x) === null), '4.1 every partner-sourced row asks joinLinkFor and gets null');
  const ig = { source: 'instagram', post_id: 'p1', role: 'model', join_link_sent: false };
  ok(joinLinkFor(ig) === 'https://thedreamwedding.in/collab/join?call=p1&role=model', '4.2 someone who wrote on Instagram gets /collab/join?call=&role=', joinLinkFor(ig));
  ok(joinLinkFor({ ...ig, join_link_sent: true }) === null && joinLinkFor({ ...ig, source: 'threads' }) !== null && joinLinkFor(null) === null, '4.3 once only; Threads too; nothing for nothing');

  sec('5  "a call was made" (onPostCreated)');
  const events = require(path.join(ROOT, 'src/lib/collab/events.js')); events._reset();
  const heard = []; events.onPostCreated((i) => { heard.push(i); }); events.onPostCreated(() => { throw new Error('a listener broke'); });
  db = makeDb(seed()); let s = await serve(db, ME);
  r = await s.call('POST', '/collab', { items: [{ requirement_type: 'model', needed: 2 }], event_date: FUTURE, city: 'Delhi', pay_kind: 'paid' });
  ok(r.status === 200 && heard.length === 1 && heard[0].source === 'vendor' && JSON.stringify(heard[0].roles) === '[{"role":"model","needed":2}]' && heard[0].pay_kind === 'paid', '5.1 her new call is heard once, with its roles and counts; a broken listener does not fail her post', JSON.stringify({ st: r.status, heard }));
  ok((db._tables.collab_post_items[0] || {}).needed === 2, '5.2 "needed" is written to the role row');
  const rt = await s.call('GET', '/collab/requirement-types');
  ok(rt.body && rt.body.requirement_types.length === 11 && rt.body.collab_roles.length === 14, '5.3 the door serves the eleven and, beside them, the 14 collab roles');
  await s.close();

  sec('6  a call TDW sends for her (createCallFor)');
  events._reset(); const heard2 = []; events.onPostCreated((i) => { heard2.push(i); });
  const { createCallFor } = require(path.join(ROOT, 'src/lib/collab/calls.js'));
  db = makeDb(seed());
  const c = await createCallFor(db, { vendor_id: ME, role: 'stylist', city: 'Delhi', event_date: FUTURE, budget_from: 3000, budget_to: 8000, pay_kind: 'paid', source: 'tdw_forward', asked_at: '2026-10-06T10:00:00Z' });
  const p = db._tables.collab_posts.find((x) => x.id === c.post_id) || {};
  ok(c.post_id && p.source === 'tdw_forward' && p.budget_from === 3000 && p.budget_to === 8000 && p.asked_at === '2026-10-06T10:00:00.000Z' && p.requirement_type === 'stylist', '6.1 the call is hers, marked tdw_forward, with the asked time and the budget range', JSON.stringify(p));
  ok(db._tables.collab_shares.length === 0, '6.2 no share is made: TDW\u2019s accounts only if she ticks it herself (ruled)');
  ok(heard2.length === 1 && heard2[0].source === 'tdw_forward', '6.3 it is heard like any call');
  const bad = async (o) => { try { await createCallFor(db, { vendor_id: ME, role: 'stylist', city: 'Delhi', event_date: FUTURE, source: 'tdw_forward', ...o }); return false; } catch (_e) { return true; } };
  ok(await bad({ source: 'vendor' }) && await bad({ role: 'astronaut' }) && await bad({ event_date: PAST }) && await bad({ budget_from: 9000, budget_to: 100 }) && await bad({ vendor_id: 'nobody' }) && await bad({ pay_kind: 'barter' }), '6.4 refused: wrong source, a role not on the list, a past date, from above to, no such vendor, an unknown pay');
  s = await serve(db, ME); r = await s.call('GET', '/collab/my-posts?kind=collab');
  const mine = ((r.body || {}).posts || []).find((x) => x.id === c.post_id);
  ok(mine && mine.source === 'tdw_forward' && mine.asked_at, '6.5 her list carries source tdw_forward (the "Sent by TDW at your request" line)', JSON.stringify(mine).slice(0, 200));
  await s.close();

  sec('7  the house token\u2019s refresh, beside houseOf');
  const pub = require(path.join(ROOT, 'src/lib/collab/publish.js'));
  const env = { TDW_HOUSE_IG_USER_ID: '1789', TDW_HOUSE_IG_TOKEN: 'OLD' };
  db = makeDb(seed()); const seen = [];
  const fakeOk = async (u) => { seen.push(u); return { ok: true, status: 200, json: async () => ({ access_token: 'NEW', expires_in: 5184000 }) }; };
  let h = await pub.houseFor('instagram', db, { env, fetch: fakeOk });
  ok(h && h.token === 'NEW' && seen.length === 1 && /refresh_access_token\?grant_type=ig_refresh_token/.test(seen[0]) && (db._tables.collab_house_tokens[0] || {}).token === 'NEW', '7.1 no stored token: Meta\u2019s refresh is asked once and the answer is kept', JSON.stringify(seen));
  seen.length = 0; h = await pub.houseFor('instagram', db, { env, fetch: fakeOk });
  ok(h.token === 'NEW' && seen.length === 0, '7.2 refreshed today: no call, the kept token is used');
  db._tables.collab_house_tokens[0].refreshed_at = new Date(Date.now() - 51 * 86400000).toISOString();
  h = await pub.houseFor('instagram', db, { env, fetch: async () => ({ ok: false, status: 400, json: async () => ({ error: { message: 'no' } }) }) });
  ok(h.token === 'NEW', '7.3 a refused refresh keeps the current token and does not throw');
  ok(await pub.houseFor('threads', db, { env, fetch: fakeOk }) === null, '7.4 no Threads house value on the service: no account, no call');

  sec('8  0197 as written');
  const raw = fs.readFileSync(path.join(ROOT, 'db/migrations/0197_collab_roles_partner_interest.sql'), 'utf8');
  ok(/BEGIN;[\s\S]*COMMIT;/.test(mig) && /ALTER TABLE public\.collab_house_tokens ENABLE ROW LEVEL SECURITY;\s*\nGRANT SELECT, INSERT, UPDATE, DELETE ON public\.collab_house_tokens TO service_role;/.test(mig), '8.1 one transaction; the one new table has RLS and its grant (e-273)');
  ok(/collab_interest_partner_shape/.test(mig) && /source = 'partner' AND partner_id IS NOT NULL AND send_id IS NOT NULL AND display_name IS NOT NULL AND join_link_sent = false/.test(mig) && /UNIQUE INDEX IF NOT EXISTS collab_interest_partner_once\s+ON public\.collab_interest \(send_id, lower\(display_name\)\) WHERE source = 'partner'/.test(mig), '8.2 the schema itself refuses a partner row with the join link sent, and keeps (send, name) once');
  ok(!/phone|email/i.test(mig.slice(mig.indexOf('collab_interest ADD COLUMN'))), '8.3 no phone or email column is added to collab_interest');
  // AMENDED (CLB2A_SRV_2, the chair's cure): WEB-4 is OUT_OF_ORDER.json's one writer and writes record 197 in the same
  // train, so the file moves. The cell pins what CLB-2a owns: its own manifest does not list that file.
  const manifest = fs.readFileSync(path.join(ROOT, 'scripts/floor-manifest-ce47-clb2a.txt'), 'utf8').split('\n').map((l) => l.trim());
  ok(manifest.length > 10 && !manifest.some((l) => /(^|[\s·])db\/migrations\/OUT_OF_ORDER\.json$/.test(l)), '8.4 CLB-2a does not carry OUT_OF_ORDER.json: its own manifest does not list it (WEB-4 is the one writer)');
  void raw;
}

const MUTS = [
  ['src/lib/collab/joinLink.js', "if (!row || row.source === 'partner') return null;\n  if (row.source !== 'instagram' && row.source !== 'threads') return null;", 'if (!row) return null;', 'M1 a partner row may get the join link (both guards gone)', '4.1'],
  ['src/lib/collab/interest.js', '  if (same) return { id: same.id, existed: true };\n', '', 'M2 not idempotent on (send, name)', '3.3'],
  ['src/lib/collab/roles.js', "const EXTRA_ROLES = Object.freeze(['model', 'stylist', 'studio']);", "const EXTRA_ROLES = Object.freeze(['model', 'stylist']);", 'M3 studio dropped from the list', '1.1'],
  ['src/lib/collab/events.js', "    try { await fn(info); } catch (e) { console.warn(`[collab:events] a post-created listener failed: ${e && e.message}`); }", '    await fn(info);', 'M4 a broken listener fails her post', '5.1'],
  ['src/lib/collab/publish.js', '  if (supabase && age > REFRESH_AFTER_DAYS) {', '  if (false) {', 'M5 the refresh never runs', '7.1'],
  ['src/lib/collab/calls.js', "  if (new Date(`${b.event_date}T23:59:59+05:30`) < now) throw new Error('the date has passed');\n", '', 'M6 a past date is accepted', '6.4'],
];
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async () => {
  try { await cells(); } catch (e) { ok(false, `b282 crashed: ${e && e.stack}`); }
  if (CHILD) process.exit(fail ? 1 : 0);
  sec('9  mutations of production code (each must red its cell in a child run; restored by sha)');
  const saved = new Map(); const restore = () => { for (const [p, b] of saved) fs.writeFileSync(p, b); };
  process.on('exit', restore); for (const sg of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sg, () => process.exit(130));
  for (const [file, from, to, name, cell] of MUTS) {
    const p = path.join(ROOT, file); const before = sha(p); const src = fs.readFileSync(p, 'utf8');
    if (src.split(from).length !== 2) { ok(false, `${name}: anchor found exactly once`, file); continue; }
    saved.set(p, src); fs.writeFileSync(p, src.replace(from, to));
    const r = cp.spawnSync(process.execPath, [__filename], { env: { ...process.env, B282_CHILD: '1' }, encoding: 'utf8' });
    fs.writeFileSync(p, src); saved.delete(p);
    const red = r.status === 1 && new RegExp(`FAIL  ${cell.replace('.', '\\.')} `).test(r.stdout || '');
    ok(red && sha(p) === before, `${name}: reddens ${cell}, restored by sha`, (r.stdout || '').split('\n').filter((l) => l.includes('FAIL')).join(' / '));
  }
  console.log(`\nb282 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})();
