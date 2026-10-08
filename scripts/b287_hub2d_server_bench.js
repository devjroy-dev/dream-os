// scripts/b287_hub2d_server_bench.js · CE-47 · HUB-2d SERVER · THE FOUNDER'S WALK (8 Oct 2026) AND PLAIN WORDS.
//   §1 a call's title: "Decor needed", made once (src/lib/hub/title.js) and read wherever the Hub names a call: her calls,
//      the calls she applied to, the shoots she is asked to confirm, and "Worked with" (Mine and the public page)
//   §2 the words: "Not in this list yet" all lower case; the chair's two People lines word for word; the plain sentences
//      word for word; no em dash and no sample word ("bride", "bridal", "couple", "haldi") in any Hub server sentence
//   §3 mutations of production code through scripts/lib/mutation_guard.js (F-44.419: free space checked first, each
//      restore in a finally, a killed run's mutation put back by sha at the next start, nothing pending after)
// In-process with a supabase double (b284's, copied whole); never a live call; no live model call.
'use strict';
const fs = require('fs'); const path = require('path'); const http = require('http'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const CHILD = !!process.env.B287_CHILD;
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

const VME = 'v-me', VK = 'v-kabir';
const seed = () => ({
  vendors: [{ id: VME, business_name: 'Test Studio One', city: 'Delhi', category: 'photography', instagram_handle: 'teststudio.one' },
    { id: VK, business_name: 'Kabir Lens', city: 'Gurugram', category: 'photography', instagram_handle: 'kabirlens' }],
  hub_profiles: [{ id: 'p-riya', owner_kind: 'person', user_id: 'u-riya', handle: 'riya.kapoor', display_name: 'Riya Kapoor', roles: ['model'], city: 'Delhi', open_to: [], check_state: 'unchecked', created_at: '2026-10-01' }],
  admin_config: [{ key: 'clb.testers', value: JSON.stringify([VME]) }],
});

const SENTENCE_FILES = ['src/api/vendor/hub.js', 'src/lib/hub/people.js', 'src/lib/hub/credits.js', 'src/lib/hub/title.js', 'src/api/public/hub.js'];
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

async function cells() {
  sec('1  a call’s title, one home');
  const { callTitle } = require(path.join(ROOT, 'src/lib/hub/title.js'));
  ok(callTitle({ requirement_type: 'decor' }, []) === 'Decor needed' && callTitle({ requirement_type: 'decor' }, [{ requirement_type: 'photography' }]) === 'Photography needed'
    && callTitle({}, [{ requirement_type: 'decor' }, { requirement_type: 'photography' }, { requirement_type: 'decor' }, { requirement_type: 'venue_catering' }]) === 'Decor, photography and venue catering needed'
    && callTitle({}, [{ requirement_type: 'makeup' }, { requirement_type: 'model' }]) === 'Makeup and model needed' && callTitle({}, []) === 'A call' && callTitle(null, null) === 'A call',
  '1.1 the title as today’s room makes it: "Decor needed"; more roles joined with "and"; the post’s own role when it has no items', callTitle({}, [{ requirement_type: 'decor' }, { requirement_type: 'photography' }]));
  const vhub = strip(read('src/api/vendor/hub.js')); const vcred = strip(read('src/lib/hub/credits.js'));
  ok(!/function callTitle|typeWord/.test(vhub + vcred) && /require\('\.\.\/\.\.\/lib\/hub\/title'\)/.test(vhub) && /require\('\.\/title'\)/.test(vcred) && !/A TDW call/.test(vhub + vcred),
    '1.2 one home: hub.js and credits.js read title.js; neither makes a title of its own; "A TDW call" is gone');

  const db = makeDb(seed()); const now = new Date().toISOString();
  // the founder's case: his calls have a role and no details
  db._tables.collab_posts.push({ id: 'call-decor', vendor_id: VME, requirement_type: 'decor', details: null, event_date: '2099-01-10', city: 'Delhi', state: 'open', created_at: now });
  db._tables.collab_posts.push({ id: 'call-photo', vendor_id: VME, requirement_type: 'photography', details: '', event_date: '2099-01-11', city: 'Delhi', state: 'open', created_at: now });
  db._tables.collab_posts.push({ id: 'call-two', vendor_id: VME, requirement_type: 'decor', details: 'Terrace set', event_date: '2099-01-12', city: 'Delhi', state: 'filled', created_at: now });
  db._tables.collab_post_items.push({ post_id: 'call-two', requirement_type: 'decor', needed: 1 }, { post_id: 'call-two', requirement_type: 'photography', needed: 2 });
  // a call by another vendor she applied to, and a shoot credit from that call waiting for her
  db._tables.collab_posts.push({ id: 'call-k', vendor_id: VK, requirement_type: 'makeup', details: null, event_date: '2026-08-20', city: 'Gurugram', state: 'filled', created_at: now });
  db._tables.collab_responses.push({ id: 'resp-k', post_id: 'call-k', responder_vendor_id: VME, state: 'accepted', created_at: now });
  const s = await serve(db, VME);
  try {
    const me = (await s.call('GET', '/hub/me')).body;
    const meId = me && me.page && me.page.id;
    const pk = (await (async () => { const pr = require(path.join(ROOT, 'src/lib/hub/profiles.js')); return pr.ensureVendorProfile(db, VK); })());
    db._tables.hub_credits.push({ id: 'cr-ask', call_id: 'call-k', shoot_name: null, city: null, month: null, giver_profile_id: pk.id, person_profile_id: meId, state: 'offered', offered_at: now });
    db._tables.hub_credits.push({ id: 'cr-yes', call_id: 'call-k', shoot_name: null, city: null, month: null, giver_profile_id: pk.id, person_profile_id: 'p-riya', state: 'yes', offered_at: now });
    let r = await s.call('GET', '/hub/mine');
    const mc = (id) => (r.body.my_calls || []).find((c) => c.id === id);
    ok(r.status === 200 && mc('call-decor') && mc('call-decor').title === 'Decor needed' && mc('call-photo').title === 'Photography needed' && mc('call-two').title === 'Decor and photography needed' && mc('call-two').details === 'Terrace set',
      '1.3 the founder’s walk: under Mine his calls read "Decor needed" and "Photography needed", never "A call"; details kept beside the title', JSON.stringify((r.body.my_calls || []).map((c) => [c.id, c.title])));
    const ap = (r.body.applied || []).find((a) => a.id === 'resp-k');
    ok(ap && ap.call === 'Makeup needed' && ap.details === null && ap.from && ap.from.name === 'Kabir Lens', '1.4 a call she applied to is titled the same way', JSON.stringify(ap));
    const ask = (r.body.waiting_for_your_yes || []).find((c) => c.id === 'cr-ask');
    ok(ask && /^Makeup needed · Gurugram · August 2026$/.test(ask.shoot_words), '1.5 a shoot she is asked to confirm, from a call, is titled the same way', ask && ask.shoot_words);
    const pub = await s.call('GET', '/public/hub/riya.kapoor');
    const line = pub.body && pub.body.worked_with && pub.body.worked_with[0];
    ok(pub.status === 200 && line && line.shoot === 'Makeup needed' && line.from_call === true, '1.6 "Worked with" on the public page names a call by its title', JSON.stringify(pub.body && pub.body.worked_with));

    sec('2  the words');
    r = await s.call('GET', '/hub/work');
    ok(r.status === 200 && Array.isArray(r.body.not_yet) && r.body.not_yet.join('|') === 'briefs from brands|paid jobs from planners|calls posted on Threads' && r.body.not_yet.every((x) => /^[a-z]/.test(x)),
      '2.1 "Not in this list yet": every item starts lower case (the founder’s walk: "From Threads" was a slip)', JSON.stringify(r.body.not_yet));
    r = await s.call('GET', '/hub/people?mine=1');
    ok(r.body.line === 'TDW has no chat. When you choose someone for your call, each of you gets the other’s phone number.'
      && r.body.mine_line === 'This list has the vendors you added and the people who confirmed a shoot with you. Nobody else is on it.',
      '2.2 People: the chair’s line word for word (the founder to confirm), and the list’s own line in plain words', JSON.stringify([r.body.line, r.body.mine_line]));
    r = await s.call('POST', '/hub/credits', { shoot_name: '', city: 'Delhi', month: '2026-08', people: ['p-riya'] });
    const r2 = await s.call('POST', '/hub/credits', { shoot_name: 'Rooftop set', city: 'Delhi', month: '2026-08', people: [] });
    ok(r.status === 400 && /Add a name for the shoot\./.test(JSON.stringify(r.body)) && r2.status === 400 && /Add at least one person who has a Collab Hub page\./.test(JSON.stringify(r2.body)),
      '2.3 the shoot sheet’s refusals say what to do, in a sentence', JSON.stringify([r.body, r2.body]));
    r = await s.call('POST', '/hub/credits', { shoot_name: 'Rooftop set', city: 'Delhi', month: '2026-08', people: ['p-riya'] });
    ok(r.status === 200 && r.body.line === 'Each person gets a request to confirm. The shoot appears on your page and theirs only after they confirm it.', '2.4 the line after a request is sent', r.body.line);
    ok(pub.body.line === 'Every person named on this page confirmed the shoot they are listed with. TDW gives Riya Kapoor’s contact details only to a vendor who chooses them for a call.',
      '2.5 the public page’s closing line in plain words (and no "phone" on the page: b283 7.7)', pub.body.line);
    const all = SENTENCE_FILES.map((f) => strip(read(f))).join('\n');
    const strings = all.match(/'[^'\n]{8,}'|`[^`\n]{8,}`/g) || [];
    ok(!strings.some((x) => /—/.test(x)) && !strings.some((x) => /\b(bride|bridal|couple|haldi)\b/i.test(x)), '2.6 no em dash and no "bride", "bridal", "couple" or "haldi" in any Hub server sentence',
      strings.filter((x) => /—|\b(bride|bridal|couple|haldi)\b/i.test(x)).join(' | '));
    ok(!/said yes to \$\{|Waiting for their yes|No messages inside TDW|Contact happens|shoot credits a month|not your credit|From Threads|Added to your people|Already in your people|Taken off your people/.test(all), '2.7 the old words are gone from the server');
    // R-47.1: every line a vendor reads is a whole sentence: it starts with a capital and ends with a full stop
    const lines = [...all.matchAll(/\b(?:line|mine_line):\s*(?:r\.created \? )?'([^'\n]+)'(?: : '([^'\n]+)')?/g)].flatMap((m) => [m[1], m[2]]).filter(Boolean);
    // the chair's ruling (8 Oct): labels are names, held to simple and easy only; these two are fact tags in a row, not lines
    const LABELS = ['Not on your list until they say yes'];
    const said = lines.filter((x) => !LABELS.includes(x));
    ok(said.length >= 6 && said.every((x) => /^[A-Z]/.test(x) && /[.]$/.test(x)), '2.8 every line the Hub sends is a whole sentence (R-47.1); fact tags are labels (the chair, 8 Oct)', said.filter((x) => !(/^[A-Z]/.test(x) && /[.]$/.test(x))).join(' | ') || String(said.length));
  } finally { await s.close(); }
}

const MUTS = [
  ['src/api/vendor/hub.js', "my_calls: (calls || []).map((c) => ({ id: c.id, title: titleOf(c),", "my_calls: (calls || []).map((c) => ({ id: c.id, title: c.details || 'A call',", 'M1 her calls titled by details again', '1.3'],
  ['src/lib/hub/title.js', "  if (!keys.length) return 'A call';\n", "  if (keys.length) return 'A call';\n", 'M2 every call titled "A call"', '1.1'],
  ['src/api/vendor/hub.js', "'calls posted on Threads'", "'From Threads'", 'M3 the capital F back', '2.1'],
  ['src/lib/hub/credits.js', "name = call ? callTitle(call, its) : 'A call on TDW';", "name = 'A TDW call';", 'M4 "Worked with" names a call "A TDW call" again', '1.6'],
  ['src/lib/hub/title.js', "(i ? typeWord(k).toLowerCase() : typeWord(k))", "(i ? typeWord(k) : typeWord(k))", 'M5 the second role keeps its capital', '1.1'],
];
const MIN_FREE = 512 * 1024 * 1024;
(async () => {
  if (!CHILD) guard.recoverOrRefuse(ROOT, 'b287');
  if (!CHILD) { const bad = MUTS.filter(([f, from, to]) => read(f).split(from).length !== 2 || read(f).includes(to)).map(([f, , , n]) => `${f} (${n})`);
    if (bad.length) { console.log(`STOP: mutated or moved anchor(s): ${bad.join('; ')}. Restore them, then run again.`); process.exit(2); } }
  try { await cells(); } catch (e) { ok(false, `b287 crashed: ${e && e.stack}`); }
  if (CHILD) process.exit(fail ? 1 : 0);
  if (process.argv.includes('--no-mutate')) { console.log(`\nb287 · ${pass} pass · ${fail} fail`); process.exit(fail ? 1 : 0); }
  sec('3  mutations of production code (each must red its cell in a child run; through the guard)');
  const st = fs.statfsSync(ROOT); const free = st.bavail * st.bsize;
  if (!ok(free >= MIN_FREE, `3.0 free space before the series: ${Math.floor(free / 1048576)} MB (at least 512 MB)`)) { console.log(`\nb287 · ${pass} pass · ${fail} fail`); process.exit(1); }
  let live = null; process.on('exit', () => { if (live) live.restore(); });
  for (const sg of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sg, () => process.exit(130));
  for (const [file, from, to, name, cell] of MUTS) {
    const before = sha(file); const src = read(file); let r = null; let back = false;
    try { live = guard.apply(ROOT, file, from, to, 'b287'); }
    catch (e) { let put = sha(file) === before; if (!put) { try { fs.writeFileSync(path.join(ROOT, file), src); put = sha(file) === before; } catch (_e) { put = false; } }
      ok(false, `${name}: ${e.message}${put ? '' : ' · THE FILE IS NOT THE ORIGINAL: put it back from git'}`); continue; }
    try { r = cp.spawnSync(process.execPath, [__filename], { env: { ...process.env, B287_CHILD: '1' }, encoding: 'utf8', timeout: 120000, killSignal: 'SIGKILL' }); }
    finally { back = live.restore(); live = null; }
    const red = r.status === 1 && new RegExp(`FAIL  ${cell.replace('.', '\\.')} `).test(r.stdout || '');
    ok(red && back && sha(file) === before, `${name}: reddens ${cell}, restored by sha`, (r.stdout || '').split('\n').filter((l) => l.includes('FAIL')).join(' / '));
  }
  ok(!fs.existsSync(guard.pendingDir(ROOT)), '3.9 nothing pending after the mutations');
  console.log(`\nb287 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})();
