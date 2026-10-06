'use strict';
// scripts/b290_ptn_a1_server_bench.js · CE-47 · PTN-A1 · rung b290 · the partner lane's server half.
// Holds: the two migrations (RLS, grants, no partner price column, "she asked" required); the link rule (handles through
// the ONE normaliser, websites http(s) only, ready addresses); the partner session (its own secret; a circle credential
// cannot pass); provisionRole 'partner' (name required when new; no vendors or couples row, ever); orgs (refusals in plain
// words; a blocked partner's public page is null; no phone or email on any public shape); forward (by hand; "She asked
// for this" required; the message words; the request page carries no phone or email; derived, secret-bound links);
// contacts (Stopped read live from prospects; the app hides WhatsApp and Call on it); reports (three DIFFERENT vendors);
// connections (counted, never charged); the seams (declared, never called); the doors (mounted; the partner door refuses
// no token, a blocked partner and a missing organisation; the request door answers no phone or email).
// --mutate: a production mutation of links.js (both scheme refusals dropped, https:// added only to a bare site) must redden §2; the file is restored and
// its sha checked. No clock-sensitive cell: dates are fixed strings. THE EXIT CODE IS THE VERDICT.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const R = (p) => path.join(ROOT, p);
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
let pass = 0; let fail = 0; const failed = [];
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } };
const sec = (t) => console.log(`\n§${t}`);
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:9';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench';

// ── a small in-memory stand-in for the Supabase client (only the calls these files make) ──────────────────────
function fakeDb(tables = {}) {
  const T = (n) => (tables[n] ||= []);
  const writes = [];
  function q(name) {
    let rows = null; let filters = []; let mode = 'select'; let payload = null; let opts = {}; let headCount = false; let lim = null;
    const apply = () => T(name).filter((r) => filters.every((f) => f(r)));
    const api = {
      select(_c, o) { if (o && o.head) headCount = true; return api; },
      eq(c, v) { filters.push((r) => r[c] === v); return api; },
      in(c, vs) { filters.push((r) => vs.includes(r[c])); return api; },
      ilike(c, v) { filters.push((r) => String(r[c]).toLowerCase() === String(v).toLowerCase()); return api; },
      order() { return api; }, limit(n) { lim = n; return api; },
      insert(p) { mode = 'insert'; payload = p; return api; },
      update(p) { mode = 'update'; payload = p; return api; },
      upsert(p, o) { mode = 'upsert'; payload = p; opts = o || {}; return api; },
      delete() { mode = 'delete'; return api; },
      async maybeSingle() { const r = await run(); return { data: Array.isArray(r.data) ? (r.data[0] || null) : r.data, error: r.error }; },
      async single() { const r = await run(); const d = Array.isArray(r.data) ? r.data[0] : r.data; return { data: d || null, error: r.error || (d ? null : { message: 'no row' }) }; },
      then(res, rej) { return run().then(res, rej); },
    };
    async function run() {
      if (mode === 'insert') { const list = (Array.isArray(payload) ? payload : [payload]).map((p) => ({ id: p.id || crypto.randomUUID(), created_at: '2026-10-06T00:00:00Z', ...p })); T(name).push(...list); writes.push({ name, mode, list }); return { data: list, error: null }; }
      if (mode === 'update') { const hit = apply(); hit.forEach((r) => Object.assign(r, payload)); writes.push({ name, mode, payload }); return { data: hit, error: null }; }
      if (mode === 'upsert') { T(name).push({ ...payload }); writes.push({ name, mode, payload }); return { data: [payload], error: null }; }
      if (mode === 'delete') { const keep = T(name).filter((r) => !filters.every((f) => f(r))); tables[name] = keep; return { data: null, error: null }; }
      const hit = apply();
      if (headCount) return { data: null, count: hit.length, error: null };
      return { data: lim ? hit.slice(0, lim) : hit, error: null };
    }
    return api;
  }
  return { from: q, tables, writes };
}

const MUT = process.argv.includes('--mutate');
if (MUT) {
  const file = R('src/lib/partners/links.js');
  const orig = fs.readFileSync(file, 'utf8');
  const target = "  if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^https?:\\/\\//i.test(s)) return null;   // a scheme that is not http(s)\n";
  if (!orig.includes(target)) { console.log('MUTATION TARGET NOT FOUND'); process.exit(1); }
  // A plausible regression: the two scheme refusals dropped and https:// added only when no scheme was typed. Then
  // ftp://x.com passes as a website, and §2.4 must redden on it.
  fs.writeFileSync(file, orig.replace(target, '').replace("if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;", '')
    .replace("if (!/^https?:\\/\\//i.test(s)) s = 'https://' + s;", "if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = 'https://' + s;"));
  let red = false;
  try { const r = require('child_process').spawnSync(process.execPath, [__filename], { encoding: 'utf8' }); red = r.status !== 0 && /FAIL  2\./.test(r.stdout); }
  finally { fs.writeFileSync(file, orig); }
  ok(red, 'M1 links.js mutated (scheme refusals dropped) reddens §2');
  ok(sha(fs.readFileSync(file, 'utf8')) === sha(orig), 'M1 links.js restored byte for byte');
  console.log(`\nb290 --mutate: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
}

(async () => {
  sec('1  the migrations');
  const m16 = fs.readFileSync(R('db/migrations/0216_partners.sql'), 'utf8');
  const m17 = fs.readFileSync(R('db/migrations/0217_forward_requests.sql'), 'utf8');
  const strip = (s) => s.replace(/--[^\n]*/g, '');
  for (const [file, txt, tabs] of [['0216', m16, ['partner_orgs', 'partner_members', 'partner_reports', 'partner_contacts', 'partner_connections']], ['0217', m17, ['forward_requests', 'forward_recipients']]]) {
    const body = strip(txt);
    ok(/^\s*BEGIN;/m.test(body) && /COMMIT;\s*$/.test(body.trim()), `1.${file} one transaction`);
    for (const t of tabs) {
      ok(new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${t} \\(`).test(body), `1.${file} creates ${t}`);
      ok(new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY;`).test(body), `1.${file} RLS on ${t}`);
      ok(new RegExp(`GRANT SELECT, INSERT, UPDATE, DELETE ON public\\.${t} TO service_role;`).test(body), `1.${file} grants on ${t}`);
    }
  }
  const orgCols = (strip(m16).match(/CREATE TABLE IF NOT EXISTS public\.partner_orgs \(([\s\S]*?)\n\);/) || [])[1] || '';
  ok(orgCols.length > 500 && !/^\s*(\w*(price|fee|rate|charge|amount)\w*)\s/im.test(orgCols), '1.10 no partner price, fee, rate or amount column (rule L)', orgCols.match(/^\s*(\w*(price|fee|rate|charge|amount)\w*)/im));
  ok(/asked\s+boolean\s+NOT NULL CHECK \(asked = true\)/.test(m17), '1.11 a request without "She asked for this" cannot be stored');
  ok(!/\bvendors\b[^;]*INSERT|couples/i.test(strip(m16)), '1.12 0216 writes no vendors or couples row');

  sec('2  the link rule');
  const links = require(R('src/lib/partners/links'));
  const shape = require(R('src/lib/discover/shapeVendor'));
  ok(links.normalizeIgHandle === shape.normalizeIgHandle, '2.1 the handle normaliser is the estate\'s one home, imported (same function)');
  const W = links.normalizeWebsite;
  ok(W('modelconnect.in') === 'https://modelconnect.in/', '2.2 a bare site gets https://', W('modelconnect.in'));
  ok(W('http://studio.example.com/a') === 'http://studio.example.com/a', '2.3 http kept');
  for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'ftp://x.com', 'mailto:a@b.com', 'https://', 'not a site', 'localhost', 'https://u:p@x.com']) ok(W(bad) === null, `2.4 refused: ${bad}`, W(bad));
  ok(links.instagramUrl('@Model.Connect') === 'https://www.instagram.com/Model.Connect/', '2.5 handle link built from the normalised handle');
  ok(links.instagramUrl('https://instagram.com/modelconnect.in/?hl=en') === 'https://www.instagram.com/modelconnect.in/', '2.6 a pasted profile URL becomes the handle link');
  ok(links.instagramUrl('bad handle!') === null, '2.7 a bad handle gives no link (never a dead one)');

  sec('3  the partner session');
  const ps = require(R('src/lib/partners/partnerSession'));
  const env = { PARTNER_SESSION_SECRET: 'p'.repeat(40) };
  const uid = '11111111-2222-4333-8444-555555555555';
  const tok = ps.mintPartnerSession({ userId: uid }, env);
  ok(!!tok && ps.verifyPartnerSession(tok, env).user_id === uid, '3.1 mint then verify gives the user');
  ok(ps.mintPartnerSession({ userId: uid }, {}) === null, '3.2 no secret, no token (fail-closed)');
  ok(ps.verifyPartnerSession(tok, { PARTNER_SESSION_SECRET: 'q'.repeat(40) }) === null, '3.3 another secret refuses it');
  const circle = require(R('src/lib/circleSession'));
  const prev = process.env.CIRCLE_SESSION_SECRET; process.env.CIRCLE_SESSION_SECRET = 'c'.repeat(40);
  const ctok = circle.mintCircleSession({ userId: uid, coupleId: uid });
  process.env.CIRCLE_SESSION_SECRET = prev;
  ok(!!ctok && ps.verifyPartnerSession(ctok, env) === null, '3.4 a circle credential cannot pass as a partner\'s');

  sec('4  provisionRole, role "partner"');
  const { provisionRole, NameRequiredError } = require(R('src/lib/provisionRole'));
  let db = fakeDb({ users: [], vendors: [], couples: [] });
  let threw = null; try { await provisionRole(db, { authUserId: 'a1', phone: '+919811100021', name: null, role: 'partner' }); } catch (e) { threw = e; }
  ok(threw instanceof NameRequiredError, '4.1 a new phone with no name is refused (F-44.271)');
  const p1 = await provisionRole(db, { authUserId: 'a1', phone: '+919811100021', name: 'Priya Mehta', role: 'partner' });
  ok(p1.user_id && db.tables.users.length === 1 && db.tables.users[0].name === 'Priya Mehta', '4.2 with a name, one users row is made');
  ok(db.tables.vendors.length === 0 && db.tables.couples.length === 0 && p1.role_id === null, '4.3 no vendors or couples row, ever');
  db = fakeDb({ users: [{ id: 'u-v', phone: '+919811100007', name: 'Aanya', auth_user_id: 'a2' }], vendors: [{ id: 'v1', user_id: 'u-v' }], couples: [] });
  const p2 = await provisionRole(db, { authUserId: 'a2', phone: '+919811100007', name: null, role: 'partner' });
  ok(p2.user_id === 'u-v' && db.tables.vendors.length === 1 && !db.writes.some((w) => w.name === 'vendors' || w.name === 'couples'), '4.4 a vendor\'s phone signs in as a partner without touching her vendor row');
  db = fakeDb({ users: [], vendors: [], couples: [] });
  await provisionRole(db, { authUserId: 'a3', phone: '+919811100099', name: 'V', role: 'vendor' });
  ok(db.tables.vendors.length === 1, '4.5 control: role "vendor" still makes its vendors row');

  sec('5  partner organisations');
  const orgs = require(R('src/lib/partners/orgs'));
  const good = { name: 'Model Connect', kind: 'model_agency', instagram_handle: '@ModelConnect.in', website: 'modelconnect.in' };
  const v = orgs.validateOrgInput(good);
  ok(v.ok && v.row.instagram_handle === 'modelconnect.in' && v.row.website === 'https://modelconnect.in/' && v.row.wants.join() === 'calls', '5.1 a good organisation is normalised (handle lower, site https, wants by kind)', JSON.stringify(v));
  ok(orgs.validateOrgInput({ ...good, instagram_handle: 'model connect' }).error === links.WORDS.badHandle, '5.2 a bad handle is refused in plain words');
  ok(orgs.validateOrgInput({ ...good, website: 'javascript:alert(1)' }).error === links.WORDS.badWebsite, '5.3 a javascript: website is refused');
  ok(orgs.validateOrgInput({ ...good, kind: 'person' }).ok === false, '5.4 an unknown kind is refused');
  const org = { id: 'o1', ...v.row, cities: ['Delhi NCR'], check_state: 'unchecked', calls_email: 'b@mc.in', whatsapp_phone: '+919811100021', plan_state: 'free' };
  const pub = orgs.publicShape(org);
  ok(pub && pub.instagram_url === 'https://www.instagram.com/modelconnect.in/' && pub.website_url === 'https://modelconnect.in/', '5.5 the public page carries ready links');
  ok(pub.check_words === 'Not yet checked by TDW' && pub.fee_line === 'This partner may charge its own fees. TDW takes no fee and has no part in it.', '5.6 the checked label and the ruled fee line');
  ok(!/phone|email|\+91|@mc\.in/.test(JSON.stringify(pub)), '5.7 no phone or email on the public page');
  ok(orgs.publicShape({ ...org, check_state: 'blocked' }) === null, '5.8 a blocked partner\'s page is null (it vanishes at once)');

  sec('6  forward a request (by hand)');
  const fwd = require(R('src/lib/partners/forward'));
  const base = { vendor_id: 'v1', role: 'model', city: 'Delhi NCR', event_date: '2026-10-18', budget_from: 3000, budget_to: 5000, pay_kind: 'paid' };
  ok(fwd.validateRequest(base).error === 'Tick "She asked for this" first.', '6.1 refused without "She asked for this"');
  ok(fwd.validateRequest({ ...base, asked: true }).ok, '6.2 accepted with it');
  ok(fwd.validateRequest({ ...base, asked: true, budget_to: 100 }).ok === false, '6.3 budget to below from is refused');
  ok(fwd.validateRequest({ asked: true, outside_handle: 'aanya.mua', outside_phone: '98111', role: 'model', city: 'x', event_date: '2026-10-18', budget_from: 1, budget_to: 2, pay_kind: 'paid' }).ok === false, '6.4 an outside vendor needs a full phone');
  const face = fwd.vendorFace({ business_name: 'Aanya Makeup Studio', category: 'makeup', instagram_handle: 'aanya.mua' }, base);
  const msg = fwd.messageFor({ contactName: 'Model Connect', face, request: base, token: 'TOKEN' });
  ok(msg === 'Hello Model Connect. Aanya Makeup Studio, a makeup artist on The Dream Wedding, needs a model in Delhi NCR on 18 October 2026. Budget Rs 3,000 to Rs 5,000. Paid. See the request and answer here: https://thedreamwedding.in/request/TOKEN', '6.5 the message, word for word', msg);
  ok(/Credit only\./.test(fwd.messageFor({ contactName: 'X', face, request: { ...base, pay_kind: 'credit_only' }, token: 't' })), '6.6 "Credit only" (CLB\'s word)');
  const page = fwd.requestPage({ face: fwd.vendorFace(null, { outside_handle: 'aanya.mua', outside_phone: '+919811100007' }), request: { ...base, outside_phone: '+919811100007', note: 'Half a day.' } });
  ok(!/9811100007|\+91|phone":|email/.test(JSON.stringify(page).replace(page.phone_line, '')), '6.7 the request page carries no phone or email', JSON.stringify(page));
  ok(page.vendor.instagram_url === 'https://www.instagram.com/aanya.mua/' && page.date_words === '18 October 2026', '6.8 the page links her Instagram and writes the full month');
  const e1 = { PARTNER_SESSION_SECRET: 's'.repeat(40) };
  ok(fwd.tokenFor('r1', e1) === fwd.tokenFor('r1', e1) && fwd.tokenFor('r1', e1) !== fwd.tokenFor('r2', e1), '6.9 a link is derived per recipient (the admin can copy it again)');
  ok(fwd.tokenFor('r1', e1) !== fwd.tokenFor('r1', { PARTNER_SESSION_SECRET: 't'.repeat(40) }) && fwd.tokenFor('r1', {}) === null, '6.10 the link is bound to the secret; no secret, no link');
  ok(/^[0-9a-f]{64}$/.test(fwd.tokenHash('x')), '6.11 only a sha256 is stored');
  ok(fwd.threadsUrl('@ModelConnect.in') === 'https://www.threads.com/@ModelConnect.in', '6.12 "Open on Threads" opens their profile');

  sec('7  contacts and Stopped');
  const contacts = require(R('src/lib/partners/contacts'));
  ok(contacts.validateContact({ name: 'House of Vyas', kind: 'fashion_house' }).error === 'Write how we know them.', '7.1 "How we know them" is required');
  ok(contacts.validateContact({ name: 'N', kind: 'stylist', how_we_know: 'x', website: 'data:x' }).ok === false, '7.2 a non-http website is refused');
  db = fakeDb({ prospects: [{ phone: '+919811100032', state: 'opted_out' }, { phone: '+919811100031', state: 'cold' }] });
  const st = await contacts.stoppedPhones(db, ['+919811100032', '+919811100031', null]);
  ok(st.has('+919811100032') && !st.has('+919811100031'), '7.3 Stopped is read live from the prospects lane (opted_out only)');
  const cs = contacts.contactShape({ id: 'c', name: 'Neha', kind: 'stylist', instagram_handle: 'neha.styles', phone: '+919811100032', how_we_know: 'x' }, true);
  ok(cs.stopped === true && cs.instagram_url === 'https://www.instagram.com/neha.styles/', '7.4 a Stopped row keeps its Instagram link and says stopped (the app hides WhatsApp and Call)');

  sec('8  reports');
  const { hiddenByReports } = require(R('src/lib/partners/reports'));
  const o = { id: 'o1', check_state: 'unchecked' };
  const rep = (vendor, handled = null) => ({ partner_id: 'o1', vendor_id: vendor, handled_at: handled });
  ok(hiddenByReports(o, [rep('a'), rep('b'), rep('c')]) === true, '8.1 three different vendors hide an unchecked partner');
  ok(hiddenByReports(o, [rep('a'), rep('a'), rep('a')]) === false, '8.2 three from one vendor do not');
  ok(hiddenByReports(o, [rep('a'), rep('b'), rep('c', 'x')]) === false, '8.3 a handled report does not count');
  ok(hiddenByReports({ ...o, check_state: 'checked' }, [rep('a'), rep('b'), rep('c')]) === false, '8.4 a checked partner is not hidden by reports');

  sec('9  connections (counted, never charged)');
  const conns = require(R('src/lib/partners/connections'));
  db = fakeDb({ partner_connections: [] });
  const c1 = await conns.record(db, { partnerId: 'o1', kind: 'pick', refId: 'x1', vendorId: 'v1' });
  const c1b = await conns.record(db, { partnerId: 'o1', kind: 'pick', refId: 'x1', vendorId: 'v1' });
  ok(c1.n === 1 && c1b.repeat === true && db.tables.partner_connections.length === 1, '9.1 one exchange is one connection, however often it is touched');
  ok(conns.adminLine(2, 'free') === 'Connections: 2 of 3 free used. Plan: none yet. After the 3rd, Rs 2,999 a month.', '9.2 the admin line, word for word');
  const srcAll = fs.readdirSync(R('src/lib/partners')).map((f) => fs.readFileSync(R('src/lib/partners/' + f), 'utf8')).join('\n') + fs.readFileSync(R('src/api/admin/partners.js'), 'utf8');
  ok(!/razorpay|createSubscription|charge\(/i.test(srcAll.replace(/razorpay_subscription_id/g, '')), '9.3 nothing in A1 charges or reaches Razorpay');

  sec('10  the seams are declared and never called');
  const seams = require(R('src/lib/partners/seams'));
  ok(['createCallFor', 'addPartnerInterest', 'onPostCreated', 'kitFor', 'verifiedWeddingsFor'].every((k) => typeof seams[k] === 'function'), '10.1 the five seams exist');
  let sThrew = false; try { await seams.createCallFor({}); } catch (e) { sThrew = /CLB-2a/.test(e.message); }
  ok(sThrew, '10.2 a seam says plainly it is not wired');
  const callers = require('child_process').spawnSync('grep', ['-rln', "partners/seams", R('src')], { encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean).filter((f) => !f.endsWith('src/lib/partners/seams.js'));
  ok(callers.length === 0, '10.3 no file in src requires the seams yet', callers.join());

  sec('11  the doors');
  const router = fs.readFileSync(R('src/api/router.js'), 'utf8');
  ok(/router\.use\('\/partner',\s+require\('\.\/partner'\)\)/.test(router), '11.1 /partner mounted');
  ok(/router\.use\('\/public\/partner',\s+require\('\.\/public\/partnerPublic'\)\)/.test(router), '11.2 /public/partner mounted');
  const iP = router.indexOf("router.use('/admin/partners'"); const iA = router.indexOf("router.use('/admin',");
  ok(iP > 0 && iP < iA, '11.3 /admin/partners mounted above the broad /admin mount');
  const requirePartner = require(R('src/api/middleware/requirePartner'));
  const call = async (mw, req) => { let out = null; const res = { status(c) { out = { c }; return res; }, json(b) { out.b = b; return res; } }; let nexted = false; await mw(req, res, () => { nexted = true; }); return nexted ? 'next' : out; };
  process.env.PARTNER_SESSION_SECRET = env.PARTNER_SESSION_SECRET;
  const mk = (orgState, member = true) => fakeDb({ partner_members: member ? [{ partner_id: 'o1', user_id: uid, role: 'owner' }] : [], partner_orgs: [{ id: 'o1', check_state: orgState }] });
  ok((await call(requirePartner(), { headers: {}, app: { locals: { supabase: mk('unchecked') } } })).c === 401, '11.4 no token: 401');
  const auth = { authorization: `Bearer ${tok}` };
  ok((await call(requirePartner(), { headers: auth, app: { locals: { supabase: mk('blocked') } } })).c === 403, '11.5 a blocked partner: 403, at once');
  ok((await call(requirePartner(), { headers: auth, app: { locals: { supabase: mk('unchecked', false) } } })).c === 409, '11.6 no organisation yet: 409');
  ok((await call(requirePartner({ orgRequired: false }), { headers: auth, app: { locals: { supabase: mk('unchecked', false) } } })) === 'next', '11.7 no organisation yet may reach /me and /org');
  ok((await call(requirePartner(), { headers: auth, app: { locals: { supabase: mk('unchecked') } } })) === 'next', '11.8 a member passes');
  // the request door, through its real handler
  const pubRouter = require(R('src/api/public/partnerPublic'));
  const layer = pubRouter.stack.find((l) => l.route && l.route.path === '/request/:token');
  const T = fwd.tokenFor('r1');
  const pdb = fakeDb({ forward_recipients: [{ id: 'r1', request_id: 'q1', token_hash: fwd.tokenHash(T) }],
    forward_requests: [{ id: 'q1', vendor_id: 'v1', role: 'model', city: 'Delhi NCR', event_date: '2099-10-18', budget_from: 3000, budget_to: 5000, pay_kind: 'paid', note: null }],
    vendors: [{ id: 'v1', business_name: 'Aanya Makeup Studio', category: 'makeup', instagram_handle: 'aanya.mua', phone: '+919811100007' }] });
  let body = null; let code = 200;
  await new Promise((done) => { const res = { status(c) { code = c; return res; }, json(b) { body = b; done(); return res; } }; layer.route.stack[0].handle({ params: { token: T }, app: { locals: { supabase: pdb } } }, res, done); });
  ok(code === 200 && body && body.request && body.request.vendor.name === 'Aanya Makeup Studio', '11.9 the request link opens its request', JSON.stringify(body));
  ok(!/9811100007|"phone"|email/.test(JSON.stringify(body).replace(body.request.phone_line, '')), '11.10 the request door answers no phone or email (rule K)');

  console.log(`\nb290: ${pass} passed, ${fail} failed${fail ? '\nFAILED: ' + failed.join(' | ') : ''}`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('ERROR', e && e.stack); process.exit(1); });
