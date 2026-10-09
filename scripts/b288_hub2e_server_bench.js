// scripts/b288_hub2e_server_bench.js · CE-47 · HUB-2e SERVER · "YOUR PAGE": HER PAGE FOLLOWS HER TDW PROFILE (read through,
// the chair's ruling of 8 Oct 2026) AND HER PICTURES COME ONLY FROM HER TDW PORTFOLIO (R-47.2).
//   §1 read through: her name, city and Instagram are read from her vendors row wherever pages are loaded (her own page,
//      the public page, People and its city chip, Work's posters, Mine); the handle never follows; organisations' pages
//      untouched; the stored copy is the fallback; nothing is written by a read
//   §2 pictures: any picture of hers in vendor_portfolio in any approval state, in her order, at most 12; never another
//      vendor's, never a look's, never one outside her portfolio; a picture she deletes leaves her page with no write
//   §3 her page's own fields: roles, open to and website set by her; name, city and Instagram refused with a sentence
//   §4 words: every new line a whole sentence (R-47.1)
//   §5 mutations through scripts/lib/mutation_guard.js (free space first, restore in a finally, nothing pending after)
// In-process with a supabase double (b284's, copied whole); never a live call; no live model call.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const CHILD = !!process.env.B288_CHILD;
const guard = require(path.join(ROOT, 'scripts/lib/mutation_guard.js'));
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; if (!CHILD) console.log(`  PASS  ${name}`); return true; } fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); return false; }
function sec(t) { if (!CHILD) console.log(`\n── ${t} ──`); }
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
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


// Fixtures: invented names only (no real vendor; no "bride", "bridal", "couple" or "haldi").
const VME = 'v-me', VK = 'v-kabir', VA = 'v-aman';
const CL = (n) => `https://res.cloudinary.com/tdw/image/upload/v1/${n}.jpg`;
const seed = () => ({
  vendors: [{ id: VME, business_name: 'Test Studio One', city: 'Delhi', category: 'photography', instagram_handle: 'teststudio.one' },
    { id: VK, business_name: 'Kabir Lens', city: 'Gurugram', category: 'photography', instagram_handle: 'kabirlens' },
    { id: VA, business_name: 'Aman Frames', city: 'Delhi', category: 'makeup', instagram_handle: 'amanframes' }],
  hub_profiles: [{ id: 'p-star', owner_kind: 'org', org_id: 'org-star', handle: 'starlight.talent', display_name: 'Starlight Talent', roles: ['model'], city: 'Delhi', open_to: [], check_state: 'unchecked', created_at: '2026-10-03' }],
  vendor_portfolio: [
    { id: 'pic-1', vendor_id: VME, image_url: CL('me-1'), approval_state: 'approved', position: 2, created_at: '2026-09-01' },
    { id: 'pic-2', vendor_id: VME, image_url: CL('me-2'), approval_state: 'pending', position: 1, created_at: '2026-09-02' },
    { id: 'pic-3', vendor_id: VME, image_url: CL('me-3'), approval_state: 'rejected', position: 3, created_at: '2026-09-03' },
    { id: 'pic-x', vendor_id: VME, image_url: 'https://cdn.example.com/x.jpg', approval_state: 'approved', position: 4, created_at: '2026-09-04' },
    { id: 'pic-k', vendor_id: VK, image_url: CL('kabir-1'), approval_state: 'approved', position: 1, created_at: '2026-09-05' }],
  vendor_look_photos: [{ id: 'look-1', vendor_id: VME, url: CL('look-1') }],
  admin_config: [{ key: 'clb.testers', value: JSON.stringify([VME, VK, VA]) }],
});

const NEW_FILES = ['src/lib/hub/profiles.js', 'src/api/vendor/hub.js', 'src/lib/hub/people.js', 'src/api/public/hub.js'];
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

async function cells() {
  const db = makeDb(seed());
  const s = await serve(db, VME);
  try {
    sec('1  her page follows her TDW profile (read through)');
    let r = await s.call('GET', '/hub/me');
    const handle0 = r.body.page && r.body.page.handle;
    const stored0 = JSON.stringify(db._tables.hub_profiles.find((x) => x.vendor_id === VME));
    const v = db._tables.vendors.find((x) => x.id === VME);
    v.business_name = 'Test Studio Two'; v.city = 'Mumbai'; v.instagram_handle = '@studio.two';
    r = await s.call('GET', '/hub/me');
    ok(r.status === 200 && r.body.page.name === 'Test Studio Two' && r.body.page.city === 'Mumbai' && r.body.page.instagram && r.body.page.instagram.handle === 'studio.two'
      && r.body.page.handle === handle0 && r.body.page.page_url === `https://thedreamwedding.in/c/${handle0}`,
      '1.1 her page shows her TDW profile’s name, city and Instagram as they are now; her address stays the same', JSON.stringify(r.body.page).slice(0, 220));
    ok(JSON.stringify(db._tables.hub_profiles.find((x) => x.vendor_id === VME)) === stored0, '1.2 a read writes nothing: the stored copy is untouched (no migration, no backfill)');
    const pub = await s.call('GET', `/public/hub/${handle0}`);
    ok(pub.status === 200 && pub.body.page.name === 'Test Studio Two' && pub.body.page.city === 'Mumbai' && /Test Studio Two/.test(pub.body.line),
      '1.3 the public page says what her TDW profile says', JSON.stringify(pub.body.page).slice(0, 200));
    // Kabir's page is made, then he moves city: People's city chip sees where he is now
    const sk = await serve(db, VK); await sk.call('GET', '/hub/me'); await sk.close();
    const s2 = await serve(db, VME);
    db._tables.vendors.find((x) => x.id === VK).city = 'Mumbai';
    let pp = await s2.call('GET', '/hub/people?city=Mumbai');
    const pg = await s2.call('GET', '/hub/people?city=Gurugram');
    ok(pp.status === 200 && pp.body.people.some((x) => x.name === 'Kabir Lens' && x.city === 'Mumbai') && !pg.body.people.some((x) => x.name === 'Kabir Lens'),
      '1.4 People: a vendor who moved city is found under the city her TDW profile says now, not the one her page was made with', JSON.stringify(pp.body.people.map((x) => [x.name, x.city])));
    pp = await s2.call('GET', '/hub/people');
    const star = pp.body.people.find((x) => x.handle === 'starlight.talent');
    ok(star && star.name === 'Starlight Talent' && star.city === 'Delhi', '1.5 an organisation’s page is shown as it is (PTN keeps it in step)');
    db._tables.vendors = db._tables.vendors.filter((x) => x.id !== VK);
    pp = await s2.call('GET', '/hub/people');
    const kb = pp.body.people.find((x) => x.handle === 'kabirlens');
    ok(kb && kb.name === 'Kabir Lens' && kb.city === 'Gurugram', '1.6 when a vendor’s row cannot be read, the stored copy is shown', JSON.stringify(kb));
    db._tables.vendors.push({ id: VK, business_name: 'Kabir Lens Studio', city: 'Pune', category: 'photography', instagram_handle: 'kabir.lens' });
    db._tables.collab_posts.push({ id: 'call-k', vendor_id: VK, requirement_type: 'photography', details: null, event_date: '2099-03-01', city: 'Pune', state: 'open', created_at: new Date().toISOString() });
    db._tables.collab_post_items.push({ post_id: 'call-k', requirement_type: 'photography', needed: 1 });
    db._tables.hub_profiles.find((x) => x.vendor_id === VME).roles = ['photography'];
    const w = await s2.call('GET', '/hub/work?all_cities=1');
    const it = (w.body.items || []).find((x) => x.id === 'call-k');
    ok(it && it.instagram && it.instagram.handle === 'kabir.lens', '1.7 Work: a call’s poster shows the Instagram her TDW profile has now', JSON.stringify(it).slice(0, 200));
    await s2.close();

    sec('2  pictures come only from her TDW portfolio (R-47.2)');
    r = await s.call('GET', '/hub/me/pictures');
    ok(r.status === 200 && (r.body.pictures || []).map((x) => x.id).join(',') === 'pic-2,pic-1,pic-3' && r.body.most === 12 && r.body.pictures.every((x) => x.on_page === false),
      '2.1 her pictures to choose from: every picture in her portfolio in any approval state (pending, approved, rejected), in her order; never a look’s, never another vendor’s', JSON.stringify(r.body).slice(0, 220));
    r = await s.call('PATCH', '/hub/me', { work_urls: [CL('me-3'), CL('me-2'), CL('me-3')] });
    const me1 = await s.call('GET', '/hub/me');
    ok(r.status === 200 && r.body.line === 'Your page is saved.' && JSON.stringify(me1.body.page.work) === JSON.stringify([CL('me-3'), CL('me-2')]),
      '2.2 she picks pictures of hers and they are on her page in the order she chose (a repeat is kept once)', JSON.stringify(me1.body.page.work));
    const bad = [];
    for (const u of [CL('kabir-1'), CL('look-1'), CL('not-hers'), 'https://cdn.example.com/x.jpg']) {
      const x = await s.call('PATCH', '/hub/me', { work_urls: [CL('me-1'), u] });
      if (!(x.status === 400 && /You can choose only pictures from your TDW portfolio\./.test(JSON.stringify(x.body)))) bad.push(u);
    }
    ok(bad.length === 0 && JSON.stringify((await s.call('GET', '/hub/me')).body.page.work) === JSON.stringify([CL('me-3'), CL('me-2')]),
      '2.3 another vendor’s picture, a look’s picture, a picture outside her portfolio and a non-TDW address are refused with the sentence, and nothing changes', bad.join(' | '));
    db._tables.vendor_portfolio.push(...Array.from({ length: 12 }, (_, i) => ({ id: `pic-m${i}`, vendor_id: VME, image_url: CL(`many-${i}`), approval_state: 'approved', position: 10 + i })));
    r = await s.call('PATCH', '/hub/me', { work_urls: Array.from({ length: 13 }, (_, i) => CL(`many-${i % 12}`)).concat([CL('me-1')]) });
    ok(r.status === 400 && /You can choose up to 12 pictures\./.test(JSON.stringify(r.body)), '2.4 more than 12 pictures are refused with the sentence', JSON.stringify(r.body));
    db._tables.vendor_portfolio = db._tables.vendor_portfolio.filter((x) => x.id !== 'pic-3');
    const stored1 = JSON.stringify(db._tables.hub_profiles.find((x) => x.vendor_id === VME).work_urls);
    const me2 = await s.call('GET', '/hub/me'); const pub2 = await s.call('GET', `/public/hub/${handle0}`);
    ok(JSON.stringify(me2.body.page.work) === JSON.stringify([CL('me-2')]) && JSON.stringify(pub2.body.page.work) === JSON.stringify([CL('me-2')])
      && JSON.stringify(db._tables.hub_profiles.find((x) => x.vendor_id === VME).work_urls) === stored1,
      '2.5 a picture she deletes from her portfolio leaves her page and the public page at once, with no write', JSON.stringify(pub2.body.page.work));
    const prof = require(path.join(ROOT, 'src/lib/hub/profiles.js'));
    const held = strip(read('src/lib/hub/profiles.js'));
    const elsewhere = ['src/api/vendor/hub.js', 'src/lib/hub/people.js', 'src/api/public/hub.js', 'src/lib/hub/credits.js'].filter((f) => /approval_state|HELD_STATES|vendor_look_photos/.test(strip(read(f))));
    ok(Array.isArray(prof.HELD_STATES) && typeof prof.pictureOnPage === 'function' && (held.match(/HELD_STATES\.includes\(/g) || []).length === 1 && elsewhere.length === 0 && !/vendor_look_photos/.test(held),
      '2.6 one home: the rule for which pictures may go on her page is pictureOnPage alone, with the held state(s) in HELD_STATES (empty until WEB-4’s contract names it)', elsewhere.join(', '));

    sec('3  her page’s own fields');
    r = await s.call('PATCH', '/hub/me', { roles: ['photography', 'model'], open_to: ['paid', 'barter'], website: 'teststudio.example' });
    ok(r.status === 200 && JSON.stringify(r.body.page.roles) === '["photography","model"]' && JSON.stringify(r.body.page.open_to) === '["paid","barter"]' && r.body.page.website && /^https:\/\/teststudio\.example/.test(r.body.page.website.url),
      '3.1 she sets her roles, what she is open to and her website', JSON.stringify(r.body.page).slice(0, 200));
    const sa = await serve(db, VA);
    const paid = await sa.call('GET', '/hub/people?open_to=paid');
    await sa.close();
    ok(paid.status === 200 && paid.body.people.some((x) => x.name === 'Test Studio Two'), '3.2 once she says she is open to paid work, People’s Paid chip finds her');
    const refused = [];
    for (const body of [{ city: 'Pune' }, { display_name: 'Other name' }, { instagram_handle: 'other' }]) {
      const x = await s.call('PATCH', '/hub/me', body);
      if (!(x.status === 400 && /Your name, city and Instagram come from your TDW profile\. Change them there\./.test(JSON.stringify(x.body)))) refused.push(Object.keys(body)[0]);
    }
    ok(refused.length === 0, '3.3 her name, city and Instagram are not set here: the door says where to change them', refused.join(', '));

    sec('4  words');
    const all = NEW_FILES.map((f) => strip(read(f))).join('\n');
    const lines = ['Your page is saved.', 'You can choose only pictures from your TDW portfolio.', 'You can choose up to ${MAX_PICTURES} pictures.', 'Your name, city and Instagram come from your TDW profile. Change them there.', 'Your portfolio could not be read. Please try again.'];
    ok(lines.every((l) => all.includes(l)) && lines.every((l) => /^[A-Z]/.test(l) && /\.$/.test(l)) && !/—/.test(lines.join('')),
      '4.1 every new line is a whole sentence with no em dash (R-47.1)');
  } finally { await s.close(); }
}

const MUTS = [
  ['src/lib/hub/profiles.js', "  if (!vids.length) return list;\n", "  return list;\n", 'M1 pages no longer follow her profile', '1.1'],
  ['src/api/vendor/hub.js', "    if (!picked.every((u) => mine.has(u))) throw new Error('You can choose only pictures from your TDW portfolio.');\n", "", 'M2 any picture address accepted', '2.3'],
  ['src/lib/hub/people.js', "  if (q.city) rows = rows.filter((p) => sameCity(p.city, q.city));\n", "  if (q.city) rows = rows.filter((p) => sameCity(p.city, q.city) || p.vendor_id === 'v-kabir');\n", 'M3 the city chip reads the old city', '1.4'],
  ['src/lib/hub/profiles.js', "const HELD_STATES = Object.freeze([]);", "const HELD_STATES = Object.freeze(['rejected']);", 'M4 a held state hides a picture', '2.1'],
  ['src/lib/hub/profiles.js', "    if (picsRead) { const ok = pics.get(p.vendor_id) || new Set(); out.work_urls = (p.work_urls || []).filter((u) => ok.has(u)); }\n", "", 'M5 a deleted picture stays on her page', '2.5'],
  ['src/api/vendor/hub.js', "  if (b.city !== undefined || b.display_name !== undefined || b.instagram_handle !== undefined) throw new Error('Your name, city and Instagram come from your TDW profile. Change them there.');\n", "", 'M6 her city set on the page again', '3.3'],
];
const MIN_FREE = 512 * 1024 * 1024;
(async () => {
  if (!CHILD) guard.recoverOrRefuse(ROOT, 'b288');
  if (!CHILD) { const bad = MUTS.filter(([f, from, to]) => read(f).split(from).length !== 2 || (to && read(f).includes(to))).map(([f, , , n]) => `${f} (${n})`);
    if (bad.length) { console.log(`STOP: mutated or moved anchor(s): ${bad.join('; ')}. Restore them, then run again.`); process.exit(2); } }
  try { await cells(); } catch (e) { ok(false, `b288 crashed: ${e && e.stack}`); }
  if (CHILD) process.exit(fail ? 1 : 0);
  if (process.argv.includes('--no-mutate')) { console.log(`\nb288 · ${pass} pass · ${fail} fail`); process.exit(fail ? 1 : 0); }
  sec('5  mutations of production code (each must red its cell in a child run; through the guard)');
  const st = fs.statfsSync(ROOT); const free = st.bavail * st.bsize;
  if (!ok(free >= MIN_FREE, `5.0 free space before the series: ${Math.floor(free / 1048576)} MB (at least 512 MB)`)) { console.log(`\nb288 · ${pass} pass · ${fail} fail`); process.exit(1); }
  let live = null; process.on('exit', () => { if (live) live.restore(); });
  for (const sg of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sg, () => process.exit(130));
  for (const [file, from, to, name, cell] of MUTS) {
    const before = sha(file); const src = read(file); let r = null; let back = false;
    try { live = guard.apply(ROOT, file, from, to, 'b288'); }
    catch (e) { let put = sha(file) === before; if (!put) { try { fs.writeFileSync(path.join(ROOT, file), src); put = sha(file) === before; } catch (_e) { put = false; } }
      ok(false, `${name}: ${e.message}${put ? '' : ' · THE FILE IS NOT THE ORIGINAL: put it back from git'}`); continue; }
    try { r = cp.spawnSync(process.execPath, [__filename], { env: { ...process.env, B288_CHILD: '1' }, encoding: 'utf8', timeout: 120000, killSignal: 'SIGKILL' }); }
    finally { back = live.restore(); live = null; }
    const red = r.status === 1 && new RegExp(`FAIL  ${cell.replace('.', '\\.')} `).test(r.stdout || '');
    ok(red && back && sha(file) === before, `${name}: reddens ${cell}, restored by sha`, (r.stdout || '').split('\n').filter((l) => l.includes('FAIL')).join(' / '));
  }
  ok(!fs.existsSync(guard.pendingDir(ROOT)), '5.9 nothing pending after the mutations');
  console.log(`\nb288 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})();
