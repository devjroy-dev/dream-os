// scripts/b283_hub1_server_bench.js · CE-47 · HUB-1 · COLLAB HUB, THE SERVER: one page for everyone, "Worked with",
// Work, People (THE PEOPLE DOOR: GET /api/v2/vendor/hub/people), Mine, and the public page. In-process with a
// supabase double; never a live call. e-277: stops before the first cell if a mutation is already in a file.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const CHILD = !!process.env.B283_CHILD;
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; if (!CHILD) console.log(`  PASS  ${name}`); return true; } fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); return false; }
function sec(t) { if (!CHILD) console.log(`\n── ${t} ──`); }
// ── the supabase double (b4c1's, with update·select and the admin door's reads) ──
function makeDb(seed = {}) {
  const tables = { hub_profiles: [], hub_credits: [], partner_orgs: [], collab_interest: [], collab_house_tokens: [], vendor_feature_choices: [], vendors: [], collab_posts: [], collab_post_items: [], collab_responses: [], vendor_roster: [], admin_config: [], capabilities: [], collab_shares: [], collab_prospects: [], ...seed };
  let uid = 0;
  function from(table) {
    const rows = tables[table] || (tables[table] = []);
    const q = { _f: [], _order: null };
    const matched = () => { let out = rows.filter((r) => q._f.every((f) => f(r))); if (q._order) { const { col, asc } = q._order; out = out.slice().sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1)); } return out; };
    q.select = () => q; q.eq = (c, v) => { q._f.push((r) => r[c] === v); return q; }; q.neq = (c, v) => { q._f.push((r) => r[c] !== v); return q; };
    q.gt = (c, v) => { q._f.push((r) => r[c] > v); return q; }; q.gte = (c, v) => { q._f.push((r) => r[c] >= v); return q; }; q.lt = (c, v) => { q._f.push((r) => r[c] < v); return q; };
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
  for (const f of ['src/api/vendor/collab.js', 'src/api/admin/collab.js', 'src/api/vendor/hub.js', 'src/api/public/hub.js']) delete require.cache[require.resolve(path.join(ROOT, f))];
  const cap = require(path.join(ROOT, 'src/lib/capabilities.js')); cap.bind(db); cap._resetCapabilitiesCache();
  require(path.join(ROOT, 'src/lib/collab/testers.js'))._reset();
  const express = require('express'); const app = express(); app.use(express.json()); app.locals.supabase = db;
  app.use('/collab', require(path.join(ROOT, 'src/api/vendor/collab.js')));
  app.use('/admin/collab', require(path.join(ROOT, 'src/api/admin/collab.js')));
  app.use('/hub', require(path.join(ROOT, 'src/api/vendor/hub.js')));
  app.use('/public/hub', require(path.join(ROOT, 'src/api/public/hub.js')));
  const server = http.createServer(app); await new Promise((r) => server.listen(0, r)); const port = server.address().port;
  const call = async (method, url, body) => { const r = await fetch(`http://127.0.0.1:${port}${url}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => null) }; };
  return { call, close: () => new Promise((r) => server.close(r)) };
}
const V1 = 'v-me', V2 = 'v-two', V3 = 'v-three';
const PAST = (() => { const d = new Date(Date.now() - 10 * 86400000); return d.toISOString().slice(0, 10); })();
const FUTURE = (() => { const d = new Date(Date.now() + 30 * 86400000); return d.toISOString().slice(0, 10); })();
const YM = (offsetMonths) => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + offsetMonths); return d.toISOString().slice(0, 7); };
const seed = () => ({
  vendors: [
    { id: V1, business_name: 'Swati Roy Makeup', city: 'Delhi', category: 'makeup', instagram_handle: 'makeupbyswatiroy', phone: '9811000001' },
    { id: V2, business_name: 'Aman Frames', city: 'Delhi', category: 'photography', instagram_handle: '@amanframes', phone: '9811000002' },
    { id: V3, business_name: 'Kabir Lens', city: 'Mumbai', category: 'photography', instagram_handle: null, phone: '9811000003' }],
  collab_posts: [
    { id: 'call-past', vendor_id: V1, requirement_type: 'photography', event_date: PAST, city: 'Delhi', state: 'open', details: 'Rooftop editorial' },
    { id: 'call-future', vendor_id: V2, requirement_type: 'makeup', event_date: FUTURE, city: 'Delhi', state: 'open', details: 'Bridal look shoot', pay_kind: 'paid' },
    { id: 'call-mumbai', vendor_id: V3, requirement_type: 'makeup', event_date: FUTURE, city: 'Mumbai', state: 'open' },
    { id: 'call-photo', vendor_id: V2, requirement_type: 'photography', event_date: FUTURE, city: 'Delhi', state: 'open' }],
  collab_post_items: [{ post_id: 'call-future', requirement_type: 'makeup', needed: 1 }, { post_id: 'call-mumbai', requirement_type: 'makeup', needed: 1 }, { post_id: 'call-photo', requirement_type: 'photography', needed: 2 }],
  vendor_roster: [{ id: 'r1', owner_vendor_id: V1, member_vendor_id: V3, name: 'Kabir Lens', source: 'manual' }],
  partner_orgs: [{ id: 'org-blocked', check_state: 'blocked' }],
  // HUB-2 · Rule 1, amended by label (CE-47, 7 Oct 2026): the Hub's doors are gated, so the vendor these cells serve as is
  // on clb.testers. A fixture row only; no cell changes for it (b284 §8 holds the gate itself).
  admin_config: [{ key: 'clb.testers', value: JSON.stringify([V1]) }],
});

async function cells() {
  const prof = require(path.join(ROOT, 'src/lib/hub/profiles.js'));
  const cr = require(path.join(ROOT, 'src/lib/hub/credits.js'));
  const pp = require(path.join(ROOT, 'src/lib/hub/people.js'));
  sec('1  0198 as written');
  const mig = fs.readFileSync(path.join(ROOT, 'db/migrations/0198_hub_profiles_credits.sql'), 'utf8').replace(/--.*$/gm, '');
  const made = [...mig.matchAll(/CREATE TABLE IF NOT EXISTS public\.(\w+)/g)].map((m) => m[1]);
  ok(JSON.stringify(made) === '["hub_profiles","hub_credits"]' && made.every((t) => new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY;\\s*\\nGRANT SELECT, INSERT, UPDATE, DELETE ON public\\.${t} TO service_role;`).test(mig)) && /BEGIN;[\s\S]*COMMIT;/.test(mig), '1.1 two tables, each with RLS and its grant, one transaction (e-273)', made.join(','));
  ok(/hub_profiles_one_owner/.test(mig) && /hub_credits_kind/.test(mig) && /hub_credits_not_self/.test(mig) && /hub_credits_call_once/.test(mig) && /hub_credits_shoot_once/.test(mig) && /state IN \('offered', 'yes', 'no', 'taken_back'\)/.test(mig), '1.2 one owner per page; a credit from a call or a named shoot; never to oneself; once per person');
  ok(!/phone|email/i.test(mig), '1.3 no phone or email column on a page or a credit');

  sec('2  one page for everyone');
  let db = makeDb(seed());
  const p1 = await prof.ensureVendorProfile(db, V1);
  ok(p1.handle === 'makeupbyswatiroy' && p1.roles[0] === 'makeup' && p1.city === 'Delhi' && p1.display_name === 'Swati Roy Makeup', '2.1 her page is made from her own row: Instagram handle, craft, city, name', JSON.stringify(p1));
  ok((await prof.ensureVendorProfile(db, V1)).id === p1.id && db._tables.hub_profiles.length === 1, '2.2 made once: the second open returns the same page');
  db._tables.hub_profiles.push({ id: 'taken', owner_kind: 'person', user_id: 'u9', handle: 'aman.frames', display_name: 'x', roles: [], open_to: [], check_state: 'unchecked' });
  db._tables.vendors[1].instagram_handle = 'aman.frames';
  const p2 = await prof.ensureVendorProfile(db, V2);
  ok(p2.handle === 'aman.frames.2', '2.3 a handle already taken gets the next free one', p2.handle);
  const p3 = await prof.ensureVendorProfile(db, V3);
  ok(p3.handle === 'kabir.lens' && p3.instagram_handle === null, '2.4 no Instagram: the handle comes from the business name', p3.handle);
  const card = prof.publicCard({ ...p1, website: 'https://swati.in/', open_to: ['paid', 'credit_only'], work_urls: ['https://res.cloudinary.com/x/1.jpg', 'http://evil/x.jpg'] });
  ok(card.instagram.url === 'https://www.instagram.com/makeupbyswatiroy/' && card.website.url === 'https://swati.in/' && card.page_url === 'https://thedreamwedding.in/c/makeupbyswatiroy', '2.5 handle, website and page are links (the founder\u2019s rule)', JSON.stringify(card));
  // HUB-2, amended by label (CE-47, 7 Oct 2026): no check label until a written rule and a setter exist.
  ok(!('label' in card) && !('checked' in card) && JSON.stringify(card.open_to_words) === '["Paid","Credit only"]' && card.work.length === 1, '2.6 no check label; "Open to" in words; only Cloudinary pictures in the strip', JSON.stringify(card));

  sec('3  a credit from her TDW call');
  const th = async (fn) => { try { await fn(); return null; } catch (e) { return e.message; } };
  ok(/This call is not yours\./.test(await th(() => cr.offerForCall(db, p2, 'call-past', [p1.id]))), '3.1 only the call\u2019s poster gives credits for it (HUB-2d: words amended by label)');
  ok(/after the shoot date/.test(await th(() => cr.offerForCall(db, p2, 'call-future', [p1.id]))), '3.2 credits open after the shoot date');
  let made1 = await cr.offerForCall(db, p1, 'call-past', [p2.id, p3.id, p1.id]);
  ok(made1.length === 2 && made1.every((c) => c.state === 'offered' && c.giver_profile_id === p1.id), '3.3 offered to the two others (never to herself), state offered', made1.length);
  ok((await cr.offerForCall(db, p1, 'call-past', [p2.id])).length === 0, '3.4 offered once per person per call');

  sec('4  "a shoot we did together"');
  ok(/name/.test(await th(() => cr.offerForShoot(db, p1, { city: 'Delhi', month: YM(-1), people: [p2.id] }))) && /city/.test(await th(() => cr.offerForShoot(db, p1, { shoot_name: 'Haldi', month: YM(-1), people: [p2.id] }))), '4.1 a name and a city are needed');
  ok(/future/.test(await th(() => cr.offerForShoot(db, p1, { shoot_name: 'Haldi', city: 'Delhi', month: YM(2), people: [p2.id] }))), '4.2 a month in the future is refused');
  const s1 = await cr.offerForShoot(db, p1, { shoot_name: 'Haldi colour shoot', city: 'Gurugram', month: YM(-2), people: [p2.id] });
  ok(s1.length === 1 && s1[0].month === `${YM(-2)}-01` && s1[0].call_id == null, '4.3 a shoot credit is offered with its month', JSON.stringify(s1[0]));
  for (let i = 0; i < 19; i += 1) db._tables.hub_credits.push({ id: `fill${i}`, call_id: null, shoot_name: `s${i}`, city: 'Delhi', month: `${YM(-1)}-01`, giver_profile_id: p1.id, person_profile_id: p3.id, state: 'offered', offered_at: new Date().toISOString() });
  const m21 = await th(() => cr.offerForShoot(db, p1, { shoot_name: 'One too many', city: 'Delhi', month: YM(-1), people: [p2.id] }));
  ok(/up to 20 of these requests in any 30 days\. You have 0 left\./.test(m21 || ''), '4.4 the twenty-first shoot offer in a month is refused, with how many are left (HUB-2d: words amended by label)', m21);
  db._tables.hub_credits = db._tables.hub_credits.filter((c) => !String(c.id).startsWith('fill'));

  sec('5  yes, no, take back');
  const c2 = db._tables.hub_credits.find((c) => c.call_id === 'call-past' && c.person_profile_id === p2.id);
  const c3 = db._tables.hub_credits.find((c) => c.call_id === 'call-past' && c.person_profile_id === p3.id);
  ok((await cr.workedWith(db, p1.id)).length === 0, '5.1 an offered credit shows nowhere');
  ok(/This request is not for you/.test(await th(() => cr.answer(db, p1, c2.id, true))), '5.2 only the person named answers (HUB-2d: words amended by label)');
  await cr.answer(db, p2, c2.id, true); await cr.answer(db, p3, c3.id, false);
  let w1 = await cr.workedWith(db, p1.id); let w2 = await cr.workedWith(db, p2.id);
  ok(w1.length === 1 && w1[0].from_call && JSON.stringify(w1[0].with_ids) === JSON.stringify([p2.id]) && w2.length === 1 && w2[0].with_ids.includes(p1.id), '5.3 a yes shows on both pages; a no shows nowhere', JSON.stringify({ w1, w2 }));
  ok(/You already said yes to this request\./.test(await th(() => cr.answer(db, p2, c2.id, false))), '5.4 an answered credit cannot be answered again (HUB-2d: words amended by label)');
  await cr.takeBack(db, p1, c2.id);
  ok((await cr.workedWith(db, p1.id)).length === 0 && (await cr.workedWith(db, p2.id)).length === 0, '5.5 taken back by the giver: it leaves both pages');
  ok(/This request is not for you/.test(await th(() => cr.takeBack(db, p3, s1[0].id))), '5.6 only the two people on it may take it back (HUB-2d: words amended by label)');

  sec('6  THE PEOPLE DOOR (GET /api/v2/vendor/hub/people)');
  await cr.answer(db, p2, s1[0].id, true);
  let list = await pp.people(db, p1, {});
  ok(list.length === 3 && list.every((x) => x.id !== p1.id) && list.some((x) => x.handle === 'aman.frames'), '6.1 everyone with a page except herself', list.map((x) => x.handle).join(','));
  list = await pp.people(db, p1, { role: 'photography', city: 'Delhi' });
  ok(list.length === 1 && list[0].handle === 'aman.frames.2' && list[0].worked_with_words === 'Worked with 1 person' && list[0].instagram.url === 'https://www.instagram.com/aman.frames/', '6.2 role and city filter; "Worked with" counts yes credits; Instagram as a link', JSON.stringify(list));
  list = await pp.people(db, p1, { mine: true });
  ok(JSON.stringify(list.map((x) => x.handle).sort()) === JSON.stringify(['aman.frames.2', 'kabir.lens']), '6.3 My people: her roster (Kabir) plus a yes credit (Aman), each once', list.map((x) => x.handle).join(','));
  ok(/collab role/.test(await th(() => pp.people(db, p1, { role: 'astronaut' }))), '6.4 a role not on the list is refused');

  sec('7  the doors');
  const s = await serve(db, V1);
  let r = await s.call('GET', '/hub/people?role=photography&mine=1');
  ok(r.status === 200 && r.body.people.length === 2 && /TDW has no chat\./.test(r.body.line), '7.1 GET /hub/people answers with the list and the no-messages line (HUB-2d: words amended by label)', JSON.stringify(r.body).slice(0, 160));
  r = await s.call('GET', '/hub/work');
  ok(r.status === 200 && r.body.items.length === 1 && r.body.items[0].id === 'call-future' && !('label' in r.body.items[0]) && JSON.stringify(r.body.not_yet) === '["briefs from brands","paid jobs from planners","calls posted on Threads"]', '7.2 Work: calls for her craft and city only, no check label (HUB-2), and it names what is not in yet (HUB-2d: words amended by label)', JSON.stringify(r.body).slice(0, 200));
  r = await s.call('GET', '/hub/work?all_cities=1');
  ok(r.body.items.map((x) => x.id).sort().join(',') === 'call-future,call-mumbai', '7.3 "all cities" widens the city, not the craft');
  db._tables.collab_posts.push({ id: 'fwd', vendor_id: V1, event_date: FUTURE, city: 'Delhi', state: 'open', source: 'tdw_forward', created_at: new Date().toISOString() });
  r = await s.call('GET', '/hub/mine');
  ok(r.status === 200 && r.body.my_calls.some((c) => c.id === 'fwd' && c.line === 'Sent by TDW at your request'), '7.4 Mine: a forwarded call reads "Sent by TDW at your request"');
  r = await s.call('POST', '/hub/credits', { shoot_name: 'Studio day', city: 'Delhi', month: YM(-1), people: [p3.id] });
  ok(r.status === 200 && r.body.offered === 1 && /The shoot appears on your page and theirs only after they confirm it\./.test(r.body.line), '7.5 POST /hub/credits offers and says nothing shows until a yes (HUB-2d: words amended by label)');
  r = await s.call('GET', '/public/hub/makeupbyswatiroy');
  const flat = JSON.stringify(r.body || {});
  ok(r.status === 200 && r.body.page.name === 'Swati Roy Makeup' && r.body.worked_with.length === 1 && r.body.worked_with[0].with[0].page_url === 'https://thedreamwedding.in/c/aman.frames.2' && /confirmed the shoot they are listed with\./.test(r.body.line), '7.6 the public page: card, "Worked with" with linked names, the confirmed line (HUB-2d: words amended by label)', flat.slice(0, 220));
  ok(!/98110000|phone|email|"vendor_id"|"user_id"/.test(flat), '7.7 the public page holds no phone, email or owner ids');
  r = await s.call('GET', '/public/hub/nobody.here');
  db._tables.hub_profiles.push({ id: 'orgp', owner_kind: 'org', org_id: 'org-blocked', handle: 'blocked.agency', display_name: 'B', roles: [], open_to: [], check_state: 'unchecked' });
  const rb = await s.call('GET', '/public/hub/blocked.agency');
  ok(r.status === 404 && rb.status === 404 && JSON.stringify(r.body) === JSON.stringify(rb.body), '7.8 no page and a blocked partner\u2019s page are the same miss');
  await s.close();
  const vhub = fs.readFileSync(path.join(ROOT, 'src/api/vendor/hub.js'), 'utf8');
  ok(!/likes?|followers?|feed|chat/i.test(vhub.replace(/\/\/.*$/gm, '').replace(/TDW has no chat[^']*/g, '')), '7.9 the Hub doors hold no likes, followers, feed or chat (ruled) (HUB-2d: words amended by label)');
}

const MUTS = [
  ['src/lib/hub/credits.js', "  const b = await sb.from('hub_credits').select(CREDIT_COLS).eq('state', 'yes').eq('giver_profile_id', profileId);", "  const b = await sb.from('hub_credits').select(CREDIT_COLS).eq('giver_profile_id', profileId);", 'M1 an offered credit shows on a page', '5.1'],
  ['src/lib/hub/credits.js', "  if (used + people.length > MONTHLY_SHOOT_OFFERS)", '  if (false)', 'M2 the 20-a-month guard is gone', '4.4'],
  ['src/lib/hub/credits.js', "  if (new Date(`${call.event_date}T23:59:59+05:30`) > now) throw new Error('You can send these requests after the shoot date.');\n", '', 'M3 a credit before the shoot date (HUB-2d: anchor amended by label, the words now plain)', '3.2'],
  ['src/lib/hub/people.js', "  if (me.vendor_id) {\n    const { data: roster }", "  if (false) {\n    const { data: roster }", 'M4 My people loses her roster', '6.3'],
  ['src/api/public/hub.js', "    if (!o || o.check_state === 'blocked') return miss();", '    void o;', 'M5 a blocked partner\u2019s page shows', '7.8'],
  ['src/lib/hub/credits.js', "  if (!c || c.person_profile_id !== me.id) throw new Error('This request is not for you.');", '  if (!c) throw new Error(\'This request is not for you.\');', 'M6 anyone may answer a credit (HUB-2d: anchor amended by label)', '5.2'],
];
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function leftovers() {   // e-277: no mutation already present before the first cell
  const bad = [];
  for (const [file, from, to, name] of MUTS) { const s = fs.readFileSync(path.join(ROOT, file), 'utf8'); if (s.split(from).length !== 2 || (to && s.includes(to))) bad.push(`${file} (${name})`); }
  return bad;
}
(async () => {
  if (!CHILD) { const bad = leftovers(); if (bad.length) { console.log(`STOP — mutated file(s): ${bad.join('; ')}. Restore them, then run again.`); process.exit(2); } }
  try { await cells(); } catch (e) { ok(false, `b283 crashed: ${e && e.stack}`); }
  if (CHILD) process.exit(fail ? 1 : 0);
  sec('8  mutations of production code (each must red its cell in a child run; restored by sha)');
  const saved = new Map(); const restore = () => { for (const [p, b] of saved) fs.writeFileSync(p, b); };
  process.on('exit', restore); for (const sg of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sg, () => process.exit(130));
  for (const [file, from, to, name, cell] of MUTS) {
    const p = path.join(ROOT, file); const before = sha(p); const src = fs.readFileSync(p, 'utf8');
    if (src.split(from).length !== 2) { ok(false, `${name}: anchor found exactly once`, file); continue; }
    saved.set(p, src); fs.writeFileSync(p, src.replace(from, to));
    const r = cp.spawnSync(process.execPath, [__filename], { env: { ...process.env, B283_CHILD: '1' }, encoding: 'utf8', timeout: 120000, killSignal: 'SIGKILL' });
    fs.writeFileSync(p, src); saved.delete(p);
    const red = r.status === 1 && new RegExp(`FAIL  ${cell.replace('.', '\\.')} `).test(r.stdout || '');
    ok(red && sha(p) === before, `${name}: reddens ${cell}, restored by sha`, (r.stdout || '').split('\n').filter((l) => l.includes('FAIL')).join(' / '));
  }
  console.log(`\nb283 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})();
