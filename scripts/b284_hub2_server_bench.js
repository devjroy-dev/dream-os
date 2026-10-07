// scripts/b284_hub2_server_bench.js · CE-47 · HUB-2 SERVER · MY PEOPLE: a vendor adds or takes off another VENDOR;
// a person or an organisation is refused (400) and joins only through a shoot credit they said yes to. People rows carry
// in_my_people and why; waiting credits are shown apart, never on the list; no check label anywhere.
// In-process with a supabase double; never a live call. e-277: stops before the first cell if a mutation is already in a file.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const CHILD = !!process.env.B284_CHILD;
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; if (!CHILD) console.log(`  PASS  ${name}`); return true; } fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); return false; }
function sec(t) { if (!CHILD) console.log(`\n── ${t} ──`); }
// ── the supabase double: b283's, with a delete that really deletes ──
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
function stubs(vendorId) {
  const put = (rel, exp) => { const p = path.join(ROOT, rel); require.cache[require.resolve(p)] = { id: p, filename: p, loaded: true, exports: exp }; };
  put('src/api/middleware/requireAuth.js', (req, res, next) => next());
  put('src/api/middleware/resolveVendor.js', () => (req, res, next) => { req.vendor = { id: vendorId }; next(); });
}
async function serve(db, vendorId) {
  stubs(vendorId);
  for (const f of ['src/api/vendor/hub.js', 'src/api/public/hub.js']) delete require.cache[require.resolve(path.join(ROOT, f))];
  require(path.join(ROOT, 'src/lib/collab/testers.js'))._reset();   // the 60 s list cache, cleared per serve
  const express = require('express'); const app = express(); app.use(express.json()); app.locals.supabase = db;
  app.use('/hub', require(path.join(ROOT, 'src/api/vendor/hub.js')));
  app.use('/public/hub', require(path.join(ROOT, 'src/api/public/hub.js')));
  const server = http.createServer(app); await new Promise((r) => server.listen(0, r)); const port = server.address().port;
  const call = async (method, url, body) => { const r = await fetch(`http://127.0.0.1:${port}${url}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => null) }; };
  return { call, close: () => new Promise((r) => server.close(r)) };
}
// Fixtures: invented names only (no real vendor, no "bride" or "couple" in samples).
const VME = 'v-me', VA = 'v-aman', VK = 'v-kabir', VE = 'v-ember';
const seed = () => ({
  vendors: [{ id: VME, business_name: 'Test Studio One', city: 'Delhi', category: 'photography', instagram_handle: 'teststudio.one' },
    { id: VA, business_name: 'Aman Frames', city: 'Delhi', category: 'photography', instagram_handle: 'amanframes' },
    { id: VK, business_name: 'Kabir Lens', city: 'Gurugram', category: 'photography', instagram_handle: 'kabirlens' },
    { id: VE, business_name: 'Studio Ember', city: 'Delhi', category: 'photography', instagram_handle: 'studioember' }],
  hub_profiles: [
    { id: 'p-riya', owner_kind: 'person', user_id: 'u-riya', handle: 'riya.kapoor', display_name: 'Riya Kapoor', roles: ['model'], city: 'Delhi', open_to: ['paid'], check_state: 'checked', created_at: '2026-10-01' },
    { id: 'p-tara', owner_kind: 'person', user_id: 'u-tara', handle: 'tarasen.clicks', display_name: 'Tara Sen', roles: ['photography'], city: 'Noida', open_to: [], check_state: 'unchecked', created_at: '2026-10-02' },
    { id: 'p-star', owner_kind: 'org', org_id: 'org-star', handle: 'starlight.talent', display_name: 'Starlight Talent', roles: ['model'], city: 'Delhi', open_to: [], check_state: 'unchecked', created_at: '2026-10-03' },
    { id: 'p-nova', owner_kind: 'org', org_id: 'org-nova', handle: 'nova.agency', display_name: 'Nova Agency', roles: ['model'], city: 'Delhi', open_to: [], check_state: 'unchecked', created_at: '2026-10-04' }],
  partner_orgs: [{ id: 'org-star', check_state: 'checked' }, { id: 'org-nova', check_state: 'unchecked' }],
  admin_config: [{ key: 'clb.testers', value: JSON.stringify(['v-me']) }],   // Rule 1: the vendor these cells serve as is a tester
  vendor_roster: [
    { id: 'edge-call', owner_vendor_id: VME, member_vendor_id: VE, name: 'Studio Ember', source: 'collab_accepted' },
    { id: 'edge-phone', owner_vendor_id: VME, member_vendor_id: null, name: 'Someone By Phone', phone: '+919811000099', source: 'manual' }],
});

async function cells() {
  const prof = require(path.join(ROOT, 'src/lib/hub/profiles.js'));
  const pp = require(path.join(ROOT, 'src/lib/hub/people.js'));
  sec('0  RULE 1: blind switch-on (the chair\u2019s ruling (a), 7 Oct 2026)');
  const CLOSED = 'Collab Hub is not open for your account yet.';
  const gateDb = (cfg, opts = {}) => {
    const d = makeDb({ ...seed(), vendors: [...seed().vendors, { id: 'v-closed', business_name: 'Closed Studio', city: 'Delhi', category: 'photography', instagram_handle: 'closed.studio' }], admin_config: cfg });
    if (opts.throwConfig) { const f = d.from; d.from = (t) => { if (t === 'admin_config') throw new Error('database unreachable'); return f(t); }; }
    return d;
  };
  const doors = [['GET', '/hub/work'], ['GET', '/hub/people'], ['GET', '/hub/mine'], ['PATCH', '/hub/me', { city: 'Delhi' }], ['POST', '/hub/credits', { shoot_name: 'x', city: 'Delhi', month: '2026-08', people: [] }],
    ['POST', '/hub/people/p-riya/my-people'], ['DELETE', '/hub/people/p-riya/my-people'], ['POST', '/hub/credits/c1/yes'], ['POST', '/hub/credits/c1/no'], ['POST', '/hub/credits/c1/take-back']];
  const allShut = async (sv) => { for (const [m, u, b] of doors) { const x = await sv.call(m, u, b); if (x.status !== 403 || !x.body || x.body.error !== CLOSED) return `${m} ${u} -> ${x.status} ${JSON.stringify(x.body).slice(0, 80)}`; } return null; };

  let gdb = gateDb([{ key: 'clb.testers', value: JSON.stringify(['v-closed']) }]); let gs = await serve(gdb, 'v-closed');
  let gm = await gs.call('GET', '/hub/me'); let gp = await gs.call('GET', '/hub/people');
  ok(gm.status === 200 && gm.body.hub_open === true && gm.body.page && gp.status === 200, '8.1 a vendor on clb.testers: the Hub is open, her page is made, the doors answer', JSON.stringify(gm.body).slice(0, 120));
  await gs.close();

  gdb = gateDb([{ key: 'clb.testers', value: JSON.stringify(['v-someone-else']) }]); gs = await serve(gdb, 'v-closed');
  const shut = await allShut(gs);
  ok(shut === null, '8.2 a vendor not on the list: every other Hub door refuses her with one plain sentence (403)', shut);
  gm = await gs.call('GET', '/hub/me');
  ok(gm.status === 200 && gm.body.hub_open === false && gm.body.line === CLOSED && !('page' in gm.body) && !gdb._tables.hub_profiles.some((x) => x.vendor_id === 'v-closed'), '8.2b GET /hub/me tells her it is not open, and makes no page for her', JSON.stringify(gm.body));
  const pub = await gs.call('GET', '/public/hub/closed.studio'); const nobody = await gs.call('GET', '/public/hub/nobody.here');
  ok(pub.status === 404 && JSON.stringify(pub.body) === JSON.stringify(nobody.body), '8.5 her public address is the one neutral miss: no page exists until she has opened the Hub', JSON.stringify(pub.body));
  await gs.close();

  let opened = true;
  for (const v of ['on', '"on"', ' ON ']) { gdb = gateDb([{ key: 'clb.testers', value: '[]' }, { key: 'clb.hub', value: v }]); gs = await serve(gdb, 'v-closed');
    gm = await gs.call('GET', '/hub/me'); gp = await gs.call('GET', '/hub/people'); if (!(gm.body.hub_open === true && gp.status === 200)) opened = false; await gs.close(); }
  ok(opened, '8.3 admin_config clb.hub = on (as text or JSON, any case) opens the Hub for every vendor');

  const junk = [[{ key: 'clb.hub', value: 'yes' }], [{ key: 'clb.hub', value: 'on please' }], [{ key: 'clb.hub', value: null }, { key: 'clb.testers', value: 'not json' }], [], null];
  let stayed = []; for (const cfg of junk) { gdb = cfg === null ? gateDb([], { throwConfig: true }) : gateDb(cfg); gs = await serve(gdb, 'v-closed');
    gm = await gs.call('GET', '/hub/me'); const w = await gs.call('GET', '/hub/work'); if (!(gm.status === 200 && gm.body.hub_open === false && w.status === 403)) stayed.push(JSON.stringify(cfg)); await gs.close(); }
  ok(stayed.length === 0, '8.4 fails closed: a junk switch, junk testers, missing rows, or no database all keep the Hub shut (never a 500)', stayed.join(' | '));

  const db = makeDb(seed());
  const me = await prof.ensureVendorProfile(db, VME);
  const pa = await prof.ensureVendorProfile(db, VA); const pk = await prof.ensureVendorProfile(db, VK); const pe = await prof.ensureVendorProfile(db, VE);
  db._tables.hub_credits.push(
    { id: 'c-riya', call_id: null, shoot_name: 'Rooftop editorial', city: 'Delhi', month: '2026-08-01', giver_profile_id: me.id, person_profile_id: 'p-riya', state: 'yes' },
    { id: 'c-star', call_id: null, shoot_name: 'Studio portrait shoot', city: 'Delhi', month: '2026-09-01', giver_profile_id: 'p-star', person_profile_id: me.id, state: 'yes' },
    { id: 'c-tara', call_id: null, shoot_name: 'Rooftop editorial', city: 'Delhi', month: '2026-08-01', giver_profile_id: me.id, person_profile_id: 'p-tara', state: 'offered' },
    { id: 'c-nova', call_id: null, shoot_name: 'Summer colour shoot', city: 'Delhi', month: '2026-07-01', giver_profile_id: me.id, person_profile_id: 'p-nova', state: 'no' });
  const s = await serve(db, VME);
  const edgesTo = (vid) => db._tables.vendor_roster.filter((r) => r.owner_vendor_id === VME && r.member_vendor_id === vid);

  sec('1  no check label anywhere (CE-47, 7 Oct)');
  const cardRiya = prof.publicCard(db._tables.hub_profiles.find((p) => p.id === 'p-riya'));
  ok(!('label' in cardRiya) && !('checked' in cardRiya), '1.1 a page whose check_state is "checked" still returns no label and no checked flag', JSON.stringify(cardRiya));
  let r = await s.call('GET', '/public/hub/riya.kapoor'); let all = await s.call('GET', '/hub/people');
  ok(r.status === 200 && !/checked by tdw|"checked"|"label"/i.test(JSON.stringify(r.body)) && !/checked by tdw|"checked"|"label"/i.test(JSON.stringify(all.body)), '1.2 neither the public page nor the People door carries a check label');

  sec('2  POST /hub/people/:id/my-people · vendors only');
  r = await s.call('POST', '/hub/people/p-riya/my-people');
  ok(r.status === 400 && r.body && /Only vendors can be added\. People and organisations join when they say yes to a shoot\./.test(JSON.stringify(r.body)) && db._tables.vendor_roster.length === 2, '2.1 a person is refused with the plain words, and nothing is written', JSON.stringify(r.body));
  r = await s.call('POST', '/hub/people/p-star/my-people');
  ok(r.status === 400 && db._tables.vendor_roster.length === 2, '2.2 an organisation is refused, and nothing is written');
  r = await s.call('POST', `/hub/people/${pa.id}/my-people`);
  const e1 = edgesTo(VA);
  ok(r.status === 200 && r.body.added === true && e1.length === 1 && e1[0].source === 'manual' && e1[0].phone == null && e1[0].name === 'Aman Frames', '2.3 a vendor is added: one edge, member-keyed, manual, no phone', JSON.stringify(e1));
  r = await s.call('POST', `/hub/people/${pa.id}/my-people`);
  ok(r.status === 200 && r.body.added === false && edgesTo(VA).length === 1, '2.4 adding again writes no second edge');
  r = await s.call('POST', `/hub/people/${me.id}/my-people`); const r2 = await s.call('POST', '/hub/people/no-such/my-people');
  ok(r.status === 400 && r2.status === 400 && db._tables.vendor_roster.length === 3, '2.5 her own page and an unknown page are refused');

  sec('3  people rows: in_my_people, why, can_add, can_take_off');
  all = (await s.call('GET', '/hub/people')).body.people; const row = (id) => all.find((x) => x.id === id);
  ok(row(pa.id).in_my_people && row(pa.id).why === 'added' && row(pa.id).why_words === 'you added them' && row(pa.id).can_take_off === true && row(pa.id).can_add === false, '3.1 an added vendor: in, "you added them", can be taken off', JSON.stringify(row(pa.id)));
  ok(row('p-tara').can_add === false && row('p-nova').can_add === false && row(pk.id).can_add === true && row(pk.id).in_my_people === false, '3.2 "Add" is offered on a vendor only, never on a person or an organisation');
  ok(row(pe.id).in_my_people && row(pe.id).why_words === 'you worked together on a TDW call' && row(pe.id).can_take_off === false, '3.3 an edge from a TDW call is in, and cannot be taken off', JSON.stringify(row(pe.id)));
  ok(row('p-riya').why === 'said_yes' && row('p-riya').why_words === 'said yes to Rooftop editorial, August 2026' && row('p-star').why_words === 'said yes to Studio portrait shoot, September 2026', '3.4 a yes credit, either way round, reads "said yes to <shoot>, <month>"', JSON.stringify([row('p-riya'), row('p-star')]));

  sec('4  GET /hub/people?mine=1 · nobody on the list without agreeing');
  r = await s.call('GET', '/hub/people?mine=1'); const ids = r.body.people.map((x) => x.id).sort();
  ok(JSON.stringify(ids) === JSON.stringify([pa.id, pe.id, 'p-riya', 'p-star'].sort()), '4.1 My people: vendors on her roster plus yes credits, each once', ids.join(','));
  ok(!ids.includes('p-tara') && !ids.includes('p-nova') && !r.body.people.some((x) => x.name === 'Someone By Phone'), '4.2 a waiting credit, a "no", and an old phone-only roster row are not on the list');
  ok(Array.isArray(r.body.waiting) && r.body.waiting.length === 1 && r.body.waiting[0].id === 'p-tara' && r.body.waiting[0].words === 'Waiting for their yes' && /Nobody else is on this list/.test(r.body.mine_line), '4.3 the waiting credit is shown apart, with its words', JSON.stringify(r.body.waiting));
  ok(!('waiting' in (await s.call('GET', '/hub/people')).body), '4.4 the full list carries no waiting block');

  sec('5  DELETE /hub/people/:id/my-people · only her own vendor edge');
  const creditsBefore = JSON.stringify(db._tables.hub_credits);
  db._tables.team_members.push({ id: 'tm1', vendor_id: VME, roster_vendor_id: 'edge-team' });
  db._tables.vendor_roster.push({ id: 'edge-team', owner_vendor_id: VME, member_vendor_id: VK, name: 'Kabir Lens', source: 'manual' });
  r = await s.call('DELETE', `/hub/people/${pk.id}/my-people`);
  ok(r.status === 400 && /wedding teams/.test(JSON.stringify(r.body)) && edgesTo(VK).length === 1, '5.1 an edge on one of her wedding teams is not taken off', JSON.stringify(r.body));
  r = await s.call('DELETE', `/hub/people/${pe.id}/my-people`);
  ok(r.status === 400 && edgesTo(VE).length === 1, '5.2 an edge from a TDW call is not taken off');
  r = await s.call('DELETE', `/hub/people/${pa.id}/my-people`);
  ok(r.status === 200 && r.body.removed === true && edgesTo(VA).length === 0 && JSON.stringify(db._tables.hub_credits) === creditsBefore, '5.3 her own added vendor is taken off; no credit is touched');
  r = await s.call('DELETE', '/hub/people/p-riya/my-people');
  ok(r.status === 400 && db._tables.hub_credits.find((c) => c.id === 'c-riya').state === 'yes', '5.4 a person cannot be "taken off": their yes stays, take-back is the only way');
  ok(db._tables.vendor_roster.some((x) => x.id === 'edge-phone'), '5.5 the old phone-only roster row is kept in the table, never deleted');

  sec('5b  how many shoot requests are left (GET /hub/mine)');
  const now = new Date().toISOString();
  for (let i = 0; i < 3; i += 1) db._tables.hub_credits.push({ id: `left${i}`, call_id: null, shoot_name: `s${i}`, city: 'Delhi', month: '2026-09-01', giver_profile_id: me.id, person_profile_id: pk.id, state: 'offered', offered_at: now });
  db._tables.hub_credits.push({ id: 'left-old', call_id: null, shoot_name: 'old', city: 'Delhi', month: '2026-01-01', giver_profile_id: me.id, person_profile_id: pk.id, state: 'offered', offered_at: '2026-01-05T00:00:00.000Z' });
  db._tables.hub_credits.push({ id: 'left-call', call_id: 'call-x', giver_profile_id: me.id, person_profile_id: pk.id, state: 'offered', offered_at: now });
  r = await s.call('GET', '/hub/mine');
  ok(r.status === 200 && r.body.shoot_requests_left === 17, '5b.1 Mine says how many are left: 20 less the shoot requests of the last 30 days (old ones and call credits not counted)', r.body && r.body.shoot_requests_left);
  db._tables.hub_credits = db._tables.hub_credits.filter((c) => !String(c.id).startsWith('left'));
  db._tables.hub_credits.push({ id: 'c-ask', call_id: null, shoot_name: 'Summer colour shoot', city: 'Noida', month: '2026-07-01', giver_profile_id: pk.id, person_profile_id: me.id, state: 'offered', offered_at: now });
  db._tables.collab_posts.push({ id: 'call-k', vendor_id: VK, details: 'Studio portrait shoot', event_date: '2026-11-08', city: 'Gurugram', state: 'open' });
  db._tables.collab_responses.push({ id: 'resp1', post_id: 'call-k', responder_vendor_id: VME, state: 'accepted', created_at: now });
  r = await s.call('GET', '/hub/mine');
  const ask = (r.body.waiting_for_your_yes || []).find((c) => c.id === 'c-ask'); const rw = (r.body.worked_with || []).find((l) => l.shoot_name === 'Rooftop editorial');
  const ap = (r.body.applied || []).find((a) => a.id === 'resp1');
  ok(ask && ask.from && ask.from.name === 'Kabir Lens' && ask.from.page_url === 'https://thedreamwedding.in/c/kabirlens' && ask.shoot_words === 'Summer colour shoot \u00b7 Noida \u00b7 July 2026'
    && rw && rw.month_words === 'August 2026' && rw.with.some((w) => w.name === 'Riya Kapoor' && w.page_url === 'https://thedreamwedding.in/c/riya.kapoor')
    && ap && ap.call === 'Studio portrait shoot' && ap.words === 'Picked' && ap.from.page_url === 'https://thedreamwedding.in/c/kabirlens'
    && !/9811|"phone"|"email"/.test(JSON.stringify(r.body)),
    '5b.2 Mine names everyone it mentions, each with a page link, in words; no phone or email', JSON.stringify({ ask, rw, ap }).slice(0, 300));
  // CE-47: read the RAW body for anything shaped like a phone number or an email address, not only the field names.
  const raw = JSON.stringify(r.body);
  const phoneLike = raw.match(/(?:\+?91[\s-]?)?(?<![\d.])[6-9]\d{9}(?![\d.])|(?<![\d.])[6-9]\d{4}[\s-]\d{5}(?![\d.])|\+\d{10,}/g);
  const emailLike = raw.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g);
  const PH = /(?:\+?91[\s-]?)?(?<![\d.])[6-9]\d{9}(?![\d.])|(?<![\d.])[6-9]\d{4}[\s-]\d{5}(?![\d.])|\+\d{10,}/g; const EM = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  const probe = '{"a":"9811000099","b":"+91 98110 00099","c":"x.y@mail.in","d":"2026-10-07T07:22:11.123Z"}';
  ok((probe.match(PH) || []).length === 2 && (probe.match(EM) || []).length === 1, '5b.4a the two patterns catch a planted phone (both forms) and email, and not a timestamp');
  ok(!phoneLike && !emailLike, '5b.4 the raw Mine body holds nothing shaped like a phone number or an email address', JSON.stringify({ phoneLike, emailLike }));
  db._tables.collab_posts.push({ id: 'call-mine', vendor_id: VME, details: 'Studio portrait shoot', event_date: '2099-02-01', city: 'Delhi', state: 'open', created_at: now });
  db._tables.collab_posts.push({ id: 'call-mine-shut', vendor_id: VME, details: 'Old shoot', event_date: '2099-02-02', city: 'Delhi', state: 'filled', created_at: now });
  db._tables.collab_responses.push({ id: 'rq1', post_id: 'call-mine', responder_vendor_id: VA, state: 'interested', created_at: now },
    { id: 'rq2', post_id: 'call-mine', responder_vendor_id: VK, state: 'accepted', created_at: now },
    { id: 'rq3', post_id: 'call-mine-shut', responder_vendor_id: VE, state: 'interested', created_at: now });
  const wc = (await s.call('GET', '/hub/mine')).body.waiting_count;
  ok(wc === 2, '5b.5 Mine counts what waits for her answer: the request to confirm, and one person interested in her open call (not the picked one, not a closed call)', wc);
  db._tables.hub_credits = db._tables.hub_credits.filter((c) => c.id !== 'c-ask');
  db._tables.collab_posts.push({ id: 'call-new', vendor_id: VA, requirement_type: 'photography', details: 'Rooftop editorial', event_date: '2099-01-01', city: 'Delhi', state: 'open', created_at: now });
  let wk = await s.call('GET', '/hub/work'); const before5 = wk.body.items.some((x) => x.id === 'call-new');
  db._tables.collab_responses.push({ id: 'resp2', post_id: 'call-new', responder_vendor_id: VME, state: 'interested', created_at: now });
  wk = await s.call('GET', '/hub/work');
  ok(before5 && !wk.body.items.some((x) => x.id === 'call-new') && !wk.body.items.some((x) => 'label' in x), '5b.3 a call she already answered leaves Work (it is in Mine, "I applied"); no label on any call', JSON.stringify(wk.body.items.map((x) => x.id)));

  sec('6  added AND said yes');
  await s.call('POST', `/hub/people/${pa.id}/my-people`);
  db._tables.hub_credits.push({ id: 'c-aman', call_id: null, shoot_name: 'Rooftop editorial', city: 'Delhi', month: '2026-08-01', giver_profile_id: me.id, person_profile_id: pa.id, state: 'yes' });
  all = (await s.call('GET', '/hub/people')).body.people;
  ok(all.find((x) => x.id === pa.id).why === 'said_yes' && all.find((x) => x.id === pa.id).can_take_off === false, '6.1 a yes credit wins: no "Take off", because taking off the edge would not remove them');
  await s.close();

}

const MUTS = [
  // HUB-2b, amended by label: G1, G4 and G5 aim at src/lib/hub/gate.js, Rule 1's one home now; cells 8.1 to 8.5 unmoved.
  ['src/lib/hub/gate.js', "  try { if (await switchOn(sb)) return true; return (await testers(sb)).includes(vendorId); } catch (_e) { return false; }", "  try { if (await switchOn(sb)) return true; return false; } catch (_e) { return false; }", 'G1 the testers list ignored', '8.1'],
  ['src/api/vendor/hub.js', "  if (await hubOpen(req.app.locals.supabase, req.vendor.id)) return next();\n  return errRes(res, 403, CLOSED);", "  return next();", 'G2 the doors left open to everyone', '8.2'],
  ['src/api/vendor/hub.js', "  if (!(await hubOpen(sb, req.vendor.id))) return okRes(res, { hub_open: false, line: CLOSED });\n", "", 'G3 a page made for a closed vendor', '8.2b'],
  ['src/lib/hub/gate.js', "  try { if (await switchOn(sb)) return true;", "  try { if (false) return true;", 'G4 the switch ignored', '8.3'],
  ['src/lib/hub/gate.js', "    _sw = v === 'on';", "    _sw = !!v;", 'G5 any switch value opens it', '8.4'],
  ['src/lib/hub/people.js', "  if (t.owner_kind !== 'vendor' || !t.vendor_id) throw new Error(NOT_A_VENDOR);\n  if (t.id === me.id)", "  if (!t.vendor_id && false) throw new Error(NOT_A_VENDOR);\n  if (t.id === me.id)", 'M1 a person can be added', '2.1'],
  ['src/lib/hub/people.js', "  if (team && team.length) throw new Error", "  if (false) throw new Error", 'M2 an edge on a wedding team can be taken off', '5.1'],
  ['src/lib/hub/people.js', "  if (e.source !== 'manual') throw new Error", "  if (false) throw new Error", 'M3 an edge from a TDW call can be taken off', '5.2'],
  ['src/lib/hub/people.js', "      can_add: !w && p.owner_kind === 'vendor' && !!me.vendor_id }; });", "      can_add: !w }; });", 'M4 "Add" offered on a person', '3.2'],
  ['src/lib/hub/profiles.js', "    // HUB-2 (CE-47, 7 Oct 2026): no check label.", "    label: 'Verified', // HUB-2 (CE-47, 7 Oct 2026): no check label.", 'M5 the check label comes back', '1.1'],
  ['src/lib/hub/people.js', "  const ids = [...new Set((data || []).map((c) => c.person_profile_id))];", "  const ids = [];", 'M6 waiting credits vanish instead of showing apart', '4.3'],
  ['src/api/vendor/hub.js', "  const cardOf = (id) => { const c = byId.get(id); return c ? { name: c.name, page_url: c.page_url } : null; };", "  const cardOf = (id) => ({ id });", 'M8 Mine shows ids instead of names and links', '5b.2'],
  ['src/api/vendor/hub.js', "  const calls = (open || []).filter((c) => !answered.has(c.id) && (all", "  const calls = (open || []).filter((c) => (all", 'M9 an answered call stays in Work', '5b.3'],
  ['src/api/vendor/hub.js', "r.state === 'interested' && (calls || []).some((c) => c.id === r.post_id && c.state === 'open')).length,", "r.state === 'interested').length,", 'M10 a closed call\u2019s responses counted as waiting', '5b.5'],
  ['src/api/vendor/hub.js', "  const used = (data || []).filter((r) => r.call_id == null && r.offered_at >= since).length;", "  const used = (data || []).length;", 'M7 call credits and old requests counted against the 20', '5b.1'],
];
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function leftovers() {   // e-277: no mutation already present before the first cell
  const bad = [];
  for (const [file, from, to, name] of MUTS) { const s = fs.readFileSync(path.join(ROOT, file), 'utf8'); if (s.split(from).length !== 2 || (to && s.includes(to))) bad.push(`${file} (${name})`); }
  return bad;
}
(async () => {
  if (!CHILD) { const bad = leftovers(); if (bad.length) { console.log(`STOP — mutated file(s): ${bad.join('; ')}. Restore them, then run again.`); process.exit(2); } }
  try { await cells(); } catch (e) { ok(false, `b284 crashed: ${e && e.stack}`); }
  if (CHILD) process.exit(fail ? 1 : 0);
  sec('9  mutations of production code (each must red its cell in a child run; restored by sha)');
  const saved = new Map(); const restore = () => { for (const [p, b] of saved) fs.writeFileSync(p, b); };
  process.on('exit', restore); for (const sg of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sg, () => process.exit(130));
  for (const [file, from, to, name, cell] of MUTS) {
    const p = path.join(ROOT, file); const before = sha(p); const src = fs.readFileSync(p, 'utf8');
    if (src.split(from).length !== 2) { ok(false, `${name}: anchor found exactly once`, file); continue; }
    saved.set(p, src); fs.writeFileSync(p, src.replace(from, to));
    const r = cp.spawnSync(process.execPath, [__filename], { env: { ...process.env, B284_CHILD: '1' }, encoding: 'utf8', timeout: 120000, killSignal: 'SIGKILL' });
    fs.writeFileSync(p, src); saved.delete(p);
    const red = r.status === 1 && new RegExp(`FAIL  ${cell.replace('.', '\\.')} `).test(r.stdout || '');
    ok(red && sha(p) === before, `${name}: reddens ${cell}, restored by sha`, (r.stdout || '').split('\n').filter((l) => l.includes('FAIL')).join(' / '));
  }
  console.log(`\nb284 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})();
