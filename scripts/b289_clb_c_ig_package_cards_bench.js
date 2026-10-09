// scripts/b289_clb_c_ig_package_cards_bench.js · CE-47 · CLB PART C · HER PACKAGES AS CARDS IN HER INSTAGRAM MESSAGES (rulings of 8 Oct 2026).
//   §1 the gate: flag.ig_package_cards (0221, metaGates) goes live by itself; before approval only clb.testers on the lane's
//      walk list; after, every vendor whose choice is on (default on) and whose Instagram is connected
//   §2 the cards: her order, at most 10; "From Rs <amount>" only when her website shows prices; the cover of a published look
//      tied to the package, else her hero, else none, every picture through pictureOnPage; "See details" to her website
//   §3 the starter "See packages": added beside hers, never over them; four of hers means none of ours; removed alone
//   §4 the tap: a postback is read; the cards go only inside the 24-hour window; closed means the ordinary reply
//   §5 her room: the doors' answers and lines
//   §6 words (R-47.1)   §7 mutations through scripts/lib/mutation_guard.js
// In-process with a supabase double (b284's) and a fake Meta that records every call; never a live call; no live model call.
'use strict';
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const CHILD = !!process.env.B289_CHILD;
const guard = require(path.join(ROOT, 'scripts/lib/mutation_guard.js'));
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; if (!CHILD) console.log(`  PASS  ${name}`); return true; } fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); return false; }
function sec(t) { if (!CHILD) console.log(`\n── ${t} ──`); }
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const R = (rel) => path.join(ROOT, rel);
// ── the supabase double: b283's, with a delete that really deletes ──
function makeDb(seed = {}) {
  const tables = { admin_config: [], hub_profiles: [], hub_credits: [], partner_orgs: [], vendors: [], collab_posts: [], collab_post_items: [], collab_responses: [], vendor_roster: [], team_members: [], ...seed };
  let uid = 0;
  function from(table) {
    const rows = tables[table] || (tables[table] = []);
    const q = { _f: [], _order: null, _orders: [] };   // b289: several order() calls are applied in turn (her package order)
    const matched = () => { let out = rows.filter((r) => q._f.every((f) => f(r))); if (q._orders.length) { const os = q._orders.slice(); out = out.slice().sort((a, b) => { for (const { col, asc } of os) { const x = a[col] ?? null; const y = b[col] ?? null; if (x === y) continue; if (x === null) return 1; if (y === null) return -1; return (x > y ? 1 : -1) * (asc ? 1 : -1); } return 0; }); } return out; };
    q.select = () => q; q.eq = (c, v) => { q._f.push((r) => r[c] === v); return q; }; q.neq = (c, v) => { q._f.push((r) => r[c] !== v); return q; };
    q.gte = (c, v) => { q._f.push((r) => r[c] >= v); return q; }; q.in = (c, vs) => { q._f.push((r) => vs.includes(r[c])); return q; };
    q.is = (c, v) => { q._f.push((r) => (r[c] ?? null) === v); return q; };
    q.order = (col, o) => { q._orders.push({ col, asc: !!(o && o.ascending) }); return q; }; q.limit = (n) => { q._limit = n; return q; };
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
    q.upsert = (payload, opt = {}) => {   // b289: vendor_feature_choices' upsert on (vendor_id, feature_key)
      const keys = String(opt.onConflict || 'id').split(',').map((k) => k.trim());
      for (const p of (Array.isArray(payload) ? payload : [payload])) { const hit = rows.find((r) => keys.every((k) => r[k] === p[k])); if (hit) Object.assign(hit, p); else rows.push({ ...p }); }
      return Promise.resolve({ data: null, error: null });
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

// Fixtures: invented names only (no real vendor; no "bride", "bridal", "couple" or "haldi"). DEV440 stands for the walk vendor.
const VME = 'v-me', VB = 'v-other';
const CL = (n) => `https://res.cloudinary.com/tdw/image/upload/v1/${n}.jpg`;
const KEY = 'flag.ig_package_cards';
function seed(over = {}) {
  return {
    capabilities: [{ key: KEY, kind: 'flag', status: 'pending', auto_on: true, walk_ref: 'ruled' }],
    admin_config: [{ key: 'clb.testers', value: JSON.stringify([VME]) }],
    vendors: [{ id: VME, routing_handle: 'DEV440', rate_display: true }, { id: VB, routing_handle: 'OTHER1', rate_display: true }],
    vendor_ig_connections: [{ vendor_id: VME, ig_user_id: 'IGU1' }, { vendor_id: VB, ig_user_id: 'IGU2' }],
    vendor_packages: [
      { id: 'pk-a', vendor_id: VME, name: 'Half day', total: 45000, is_default: false, created_at: '2026-09-01', deleted_at: null },
      { id: 'pk-b', vendor_id: VME, name: 'Full day coverage', total: 150000, is_default: true, created_at: '2026-09-03', deleted_at: null },
      { id: 'pk-c', vendor_id: VME, name: 'Album only', total: null, is_default: false, created_at: '2026-09-02', deleted_at: null },
      { id: 'pk-x', vendor_id: VME, name: 'Old one', total: 9000, is_default: false, created_at: '2026-08-01', deleted_at: '2026-09-09' }],
    vendor_looks: [
      { id: 'lk-1', vendor_id: VME, package_id: 'pk-b', status: 'published', position: 1, deleted_at: null },
      { id: 'lk-2', vendor_id: VME, package_id: 'pk-a', status: 'draft', position: 2, deleted_at: null }],
    vendor_look_photos: [
      { id: 'ph-1', look_id: 'lk-1', image_url: CL('look-cover'), position: 1, approval_state: 'pending', deleted_at: null },
      { id: 'ph-2', look_id: 'lk-1', image_url: CL('look-second'), position: 2, approval_state: 'approved', deleted_at: null },
      { id: 'ph-3', look_id: 'lk-2', image_url: CL('draft-look'), position: 1, approval_state: 'approved', deleted_at: null }],
    vendor_portfolio: [{ id: 'pf-h', vendor_id: VME, image_url: CL('hero'), is_hero: true, approval_state: 'rejected', position: 1 },
      { id: 'pf-2', vendor_id: VME, image_url: CL('other'), is_hero: false, approval_state: 'approved', position: 2 }],
    vendor_feature_choices: [],
    ...over,
  };
}
// A fake Meta: records calls; answers GET messenger_profile with `starters` (Meta's shape), POST/DELETE with success.
function fakeMeta(starters = null, { failGet = false, failPost = false } = {}) {
  const calls = [];
  const f = async (url, init = {}) => { const method = init.method || 'GET'; const body = init.body ? JSON.parse(init.body) : undefined; calls.push({ url, method, body });
    const json = (o, st = 200) => ({ ok: st < 400, status: st, json: async () => o });
    if (/messenger_profile\?fields=ice_breakers/.test(url)) return failGet ? json({ error: { message: 'no' } }, 400) : json({ data: starters ? [{ ice_breakers: starters }] : [] });
    if (failPost) return json({ error: { message: 'no' } }, 400);
    return json(/messages$/.test(url) ? { recipient_id: 'X', message_id: 'm1' } : { success: true }); };
  return { f, calls };
}
function fresh() { require(R('src/lib/capabilities.js'))._resetCapabilitiesCache(); require(R('src/lib/collab/testers.js'))._reset(); require(R('src/lib/instagram/igCards.js'))._resetEnsured(); }
const ENV_WALK = { IG_DM_WALK_VENDOR_IDS: VME };

async function cells() {
  process.env.PWA_BASE_URL = 'https://thedreamwedding.in';
  const C = require(R('src/lib/instagram/igCards.js'));
  const gates = require(R('src/lib/metaGates.js'));

  sec('1  the gate');
  const f0 = gates.FEATURES.find((x) => x.gate === KEY);
  const mig = read('db/migrations/0221_ig_package_cards_gate.sql').replace(/--.*$/gm, '');
  ok(f0 && f0.app === 'app_live' && JSON.stringify(f0.permissions) === '["instagram_business_basic","instagram_business_manage_messages"]'
    && /\('flag\.ig_package_cards', 'flag', 'pending', true, 'ruled:[^']+'\)/.test(mig) && /ON CONFLICT \(key\) DO NOTHING/.test(mig) && !/CHECK|UPDATE|DELETE|CREATE|ALTER/i.test(mig),
    '1.1 one Meta-gated feature with the messages pair (metaGates), and 0221 adds its row only: pending, live by itself on approval (auto_on, walk_ref), idempotent');
  let db = makeDb(seed()); fresh();
  const tester = await C.gateFor(db, VME, ENV_WALK); const notWalk = await C.gateFor(db, VME, {});
  db._tables.admin_config[0].value = '[]'; fresh();
  const notTester = await C.gateFor(db, VME, ENV_WALK);
  ok(tester.open && !notWalk.open && !notTester.open, '1.2 before Meta’s grant it opens only for a vendor on clb.testers who is also on the Instagram lane’s walk list', JSON.stringify([tester, notWalk, notTester]));
  db = makeDb(seed({ capabilities: [{ key: KEY, kind: 'flag', status: 'on', auto_on: true, walk_ref: 'ruled' }], admin_config: [] })); fresh();
  const any = await C.gateFor(db, VB, {});
  db._tables.vendor_feature_choices.push({ vendor_id: VB, feature_key: KEY, choice: 'off' }); fresh();
  const off = await C.gateFor(db, VB, {});
  db._tables.vendor_ig_connections = db._tables.vendor_ig_connections.filter((x) => x.vendor_id !== VME); fresh();
  const noIg = await C.gateFor(db, VME, {});
  ok(any.open && any.choice === 'on' && !off.open && off.choice === 'off' && !noIg.open && noIg.reason === 'Instagram not connected',
    '1.3 after the grant it is open for every vendor whose choice is on (no row means on) and whose Instagram is connected; her off closes it', JSON.stringify([any, off, noIg]));

  sec('2  the cards');
  db = makeDb(seed()); fresh();
  let cards = await C.cardsFor(db, VME);
  ok(cards.map((c) => c.package_id).join(',') === 'pk-b,pk-a,pk-c', '2.1 her order: the default first, then oldest first; a deleted package never shows', cards.map((c) => c.package_id).join(','));
  ok(cards[0].subtitle === 'From Rs 1,50,000' && cards[1].subtitle === 'From Rs 45,000' && cards[2].subtitle === null, '2.2 "From Rs <amount>" in Indian commas when her website shows prices; no price line for a package with no total', JSON.stringify(cards.map((c) => c.subtitle)));
  db._tables.vendors[0].rate_display = false;
  const hidden = await C.cardsFor(db, VME);
  ok(hidden.every((c) => c.subtitle === null), '2.3 when her website hides prices, no card shows a price', JSON.stringify(hidden.map((c) => c.subtitle)));
  db._tables.vendors[0].rate_display = true;
  ok(cards[0].image_url === CL('look-cover') && cards[1].image_url === CL('hero') && cards[2].image_url === CL('hero'),
    '2.4 the picture: the cover of a published look tied to the package, else her hero (a draft look is not used; any approval state)', JSON.stringify(cards.map((c) => c.image_url)));
  db._tables.vendor_look_photos[0].image_url = 'https://cdn.example.com/not-ours.jpg';
  db._tables.vendor_portfolio[0].image_url = 'https://cdn.example.com/also-not.jpg';
  const unsafe = await C.cardsFor(db, VME);
  ok(unsafe[0].image_url === null && unsafe[1].image_url === null, '2.5 a picture pictureOnPage refuses is never sent: the next candidate is tried (never another picture of the look), else no picture', JSON.stringify(unsafe.map((c) => c.image_url)));
  db = makeDb(seed());
  for (let i = 0; i < 12; i += 1) db._tables.vendor_packages.push({ id: `pk-${i}`, vendor_id: VME, name: `Package number ${i} ${'x'.repeat(90)}`, total: 1000, is_default: false, created_at: `2026-10-${10 + i}`, deleted_at: null });
  cards = await C.cardsFor(db, VME);
  const t = C.templateOf(cards); const els = t.attachment.payload.elements;
  ok(cards.length === 10 && els.length === 10 && t.attachment.payload.template_type === 'generic' && els.every((e) => e.title.length <= 80 && (!e.subtitle || e.subtitle.length <= 80))
    && els.every((e) => e.buttons.length === 1 && e.buttons[0].type === 'web_url' && e.buttons[0].title === 'See details' && e.buttons[0].url === 'https://dev440.thedreamwedding.in'),
    '2.6 at most 10 cards, titles cut to 80, one "See details" button to her TDW website, as Meta’s generic template', JSON.stringify(els[0]).slice(0, 200));

  sec('3  the starter');
  let m = fakeMeta([{ call_to_actions: [{ question: 'Your prices?', payload: 'HERS_1' }] }]);
  let r = await C.setStarter(m.f, 'TOKEN');
  const post = m.calls.find((c) => c.method === 'POST');
  ok(r.state === 'set' && post && JSON.stringify(post.body.ice_breakers[0].call_to_actions) === JSON.stringify([{ question: 'Your prices?', payload: 'HERS_1' }, { question: 'See packages', payload: C.PAYLOAD }]) && post.body.platform === 'instagram',
    '3.1 "See packages" is added beside her own starter, which is kept as it was', JSON.stringify(post && post.body));
  m = fakeMeta([{ call_to_actions: [{ question: 'See packages', payload: C.PAYLOAD }] }]); r = await C.setStarter(m.f, 'TOKEN');
  const m4 = fakeMeta([{ call_to_actions: [1, 2, 3, 4].map((i) => ({ question: `Hers ${i}`, payload: `H${i}` })) }]); const r4 = await C.setStarter(m4.f, 'TOKEN');
  ok(r.state === 'set' && !m.calls.some((c) => c.method !== 'GET') && r4.state === 'full' && !m4.calls.some((c) => c.method !== 'GET'),
    '3.2 already set means no write; when she has four of her own, ours is not added and nothing is written');
  m = fakeMeta([{ call_to_actions: [{ question: 'Your prices?', payload: 'HERS_1' }, { question: 'See packages', payload: C.PAYLOAD }] }]); r = await C.removeStarter(m.f, 'TOKEN');
  const p2 = m.calls.find((c) => c.method === 'POST');
  const mOnly = fakeMeta([{ call_to_actions: [{ question: 'See packages', payload: C.PAYLOAD }] }]); const rOnly = await C.removeStarter(mOnly.f, 'TOKEN');
  const del = mOnly.calls.find((c) => c.method === 'DELETE');
  ok(r.state === 'removed' && p2 && JSON.stringify(p2.body.ice_breakers[0].call_to_actions) === JSON.stringify([{ question: 'Your prices?', payload: 'HERS_1' }]) && rOnly.state === 'removed' && del && JSON.stringify(del.body) === '{"fields":["ice_breakers"]}',
    '3.3 turning it off takes only ours away; hers stay (and when ours was the only one, the starters are cleared)');
  m = fakeMeta(null, { failGet: true }); r = await C.setStarter(m.f, 'TOKEN');
  ok(r.state === 'failed' && !m.calls.some((c) => c.method !== 'GET'), '3.4 when her starters cannot be read, nothing is written');

  sec('4  the tap');
  const IG = require(R('src/lib/instagram/igInbound.js'));
  const pb = (over = {}) => ({ object: 'instagram', entry: [{ messaging: [{ sender: { id: 'IGSID1' }, recipient: { id: 'ACC1' }, postback: { mid: 'MIDP', title: 'See packages', payload: C.PAYLOAD }, ...over }] }] });
  const parsed = IG.parseIgMessages(pb());
  const bad = [pb({ postback: { title: 'x', payload: C.PAYLOAD } }), pb({ postback: { mid: 'M', title: 'x' } }), pb({ postback: null })].map((b) => IG.parseIgMessages(b).length);
  ok(parsed.length === 1 && parsed[0].payload === C.PAYLOAD && parsed[0].text === 'See packages' && parsed[0].igsid === 'IGSID1' && parsed[0].accountId === 'ACC1' && parsed[0].echo === false && bad.every((n) => n === 0),
    '4.1 a tap on the starter is read as her client’s message with its payload; a postback without its id or payload is dropped', JSON.stringify(parsed));
  db = makeDb(seed()); fresh();
  const tok = async () => ({ ok: true, accessToken: 'TOKEN' });
  const NOW = Date.parse('2026-10-08T12:00:00Z');
  m = fakeMeta();
  r = await C.answer({ supabase: db, fetchImpl: m.f, tokenForCall: tok, nowMs: () => NOW, env: ENV_WALK }, { vendorId: VME, igsid: 'IGSID1', receivedAtMs: NOW });
  const sent = m.calls.find((c) => /messages$/.test(c.url));
  const m2 = fakeMeta(); const late = await C.answer({ supabase: db, fetchImpl: m2.f, tokenForCall: tok, nowMs: () => NOW, env: ENV_WALK }, { vendorId: VME, igsid: 'IGSID1', receivedAtMs: NOW - 25 * 3600 * 1000 });
  ok(r.sent && sent && sent.body.recipient.id === 'IGSID1' && sent.body.message.attachment.payload.elements.length === 3 && !late.sent && !m2.calls.some((c) => /messages$/.test(c.url)),
    '4.2 the cards go to the person who tapped, inside the 24-hour window, and never outside it', JSON.stringify([r, late]));
  db._tables.vendor_packages = []; m = fakeMeta();
  r = await C.answer({ supabase: db, fetchImpl: m.f, tokenForCall: tok, nowMs: () => NOW, env: ENV_WALK }, { vendorId: VME, igsid: 'IGSID1', receivedAtMs: NOW });
  const line = m.calls.find((c) => /messages$/.test(c.url));
  ok(r.sent && line && line.body.message.text === C.NOTHING_LINE, '4.3 with no package to show, the person gets one sentence instead', JSON.stringify(line && line.body));
  db = makeDb(seed()); fresh(); m = fakeMeta();
  r = await C.answer({ supabase: db, fetchImpl: m.f, tokenForCall: tok, nowMs: () => NOW, env: {} }, { vendorId: VME, igsid: 'IGSID1', receivedAtMs: NOW });
  ok(!r.sent && /^closed/.test(r.why) && m.calls.length === 0 && /if \(!\/\^closed\/\.test\(cards\.why\)\) return \{ recorded, reply: cards \};/.test(read('src/lib/instagram/igInbound.js')),
    '4.4 when the feature is closed for her, nothing is sent and the tap goes to the ordinary reply', JSON.stringify(r));

  sec('5  her room');
  db = makeDb(seed()); fresh();
  const dd = (meta) => ({ supabase: db, env: ENV_WALK, fetchImpl: meta.f, token: async () => 'TOKEN' });
  m = fakeMeta([]);
  let a = await C.room(VME, dd(m));
  ok(a.status === 200 && a.body.state === 'on' && a.body.cards.length === 3 && a.body.cards[0].title === 'Full day coverage' && a.body.cards[0].button === 'See details' && a.body.line === C.LINES.on && m.calls.some((c) => c.method === 'POST'),
    '5.1 her room shows the cards as they will be sent and puts "See packages" in place (on by default)', JSON.stringify(a.body).slice(0, 220));
  m = fakeMeta([{ call_to_actions: [{ question: 'See packages', payload: C.PAYLOAD }] }]);
  a = await C.room(VME, dd(m), false);
  ok(a.status === 200 && a.body.state === 'off' && a.body.line === C.LINES.off && db._tables.vendor_feature_choices.some((x) => x.vendor_id === VME && x.choice === 'off') && m.calls.some((c) => c.method === 'DELETE'),
    '5.2 turning it off records her choice and takes "See packages" away');
  a = await C.room(VME, dd(fakeMeta([])), 'yes');
  const closed = await C.room(VME, { ...dd(fakeMeta([])), env: {} });
  ok(a.status === 400 && closed.status === 404, '5.3 a wrong body is refused; a closed gate is dark (404, the app draws nothing)');
  db._tables.vendor_feature_choices = []; db._tables.vendor_packages = []; fresh();
  a = await C.room(VME, dd(fakeMeta([])));
  const full = makeDb(seed()); db = full; fresh();
  const af = await C.room(VME, dd(fakeMeta([{ call_to_actions: [1, 2, 3, 4].map((i) => ({ question: `Hers ${i}`, payload: `H${i}` })) }])));
  ok(a.body.state === 'no_packages' && a.body.line === C.LINES.none && af.body.state === 'full' && af.body.line === C.LINES.full, '5.4 no packages, and four starters of hers, each say so in a sentence');

  sec('6  words');
  const lines = [...Object.values(C.LINES), C.NOTHING_LINE];
  ok(lines.every((l) => /^[A-Z]/.test(l) && /\.$/.test(l) && !/—/.test(l)) && C.STARTER === 'See packages' && C.BUTTON === 'See details'
    && !/\b(bride|bridal|couple|haldi)\b/i.test(lines.join(' ')),
    '6.1 every line is a whole sentence with no em dash and no sample word (R-47.1); the starter and the button are labels');
}

const MUTS = [
  ['src/lib/instagram/igCards.js', "  const showPrice = v.rate_display !== false;\n", "  const showPrice = true;\n", 'M1 prices shown when her website hides them', '2.3'],
  ['src/lib/instagram/igCards.js', "const maySend = (row, url) => !!row && pictureOnPage({ ...row, image_url: url || row.image_url });", "const maySend = (row) => !!row;", 'M2 a picture sent without the one check', '2.5'],
  ['src/lib/instagram/igCards.js', "  def.call_to_actions.push({ question: STARTER, payload: PAYLOAD });\n", "  def.call_to_actions = [{ question: STARTER, payload: PAYLOAD }];\n", 'M3 her starters overwritten', '3.1'],
  ['src/lib/instagram/igCards.js', "  if (!igSend.withinWindow(receivedAtMs, deps.nowMs())) return { sent: false, why: 'outside the 24-hour window' };\n", "", 'M4 cards sent outside the window', '4.2'],
  ['src/lib/instagram/igCards.js', "  return list.includes(vendorId) ? { open: true, live, choice: 'on', reason: null } : { open: false, live, choice: 'on', reason: 'not on clb.testers before approval' };", "  return { open: true, live, choice: 'on', reason: null };", 'M5 open before approval without clb.testers', '1.2'],
  ['src/lib/instagram/igCards.js', "call_to_actions: (s.call_to_actions || []).filter((a) => !ours(a)) }))", "call_to_actions: [] }))", 'M6 turning off takes hers away too', '3.3'],
];
const MIN_FREE = 512 * 1024 * 1024;
(async () => {
  if (!CHILD) guard.recoverOrRefuse(ROOT, 'b289');
  if (!CHILD) { const bad = MUTS.filter(([f, from, to]) => read(f).split(from).length !== 2 || (to && read(f).includes(to))).map(([f, , , n]) => `${f} (${n})`);
    if (bad.length) { console.log(`STOP: mutated or moved anchor(s): ${bad.join('; ')}. Restore them, then run again.`); process.exit(2); } }
  try { await cells(); } catch (e) { ok(false, `b289 crashed: ${e && e.stack}`); }
  if (CHILD) process.exit(fail ? 1 : 0);
  if (process.argv.includes('--no-mutate')) { console.log(`\nb289 · ${pass} pass · ${fail} fail`); process.exit(fail ? 1 : 0); }
  sec('7  mutations of production code (each must red its cell in a child run; through the guard)');
  const st = fs.statfsSync(ROOT); const free = st.bavail * st.bsize;
  if (!ok(free >= MIN_FREE, `7.0 free space before the series: ${Math.floor(free / 1048576)} MB (at least 512 MB)`)) { console.log(`\nb289 · ${pass} pass · ${fail} fail`); process.exit(1); }
  let live = null; process.on('exit', () => { if (live) live.restore(); });
  for (const sg of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sg, () => process.exit(130));
  for (const [file, from, to, name, cell] of MUTS) {
    const before = sha(file); const src = read(file); let r = null; let back = false;
    try { live = guard.apply(ROOT, file, from, to, 'b289'); }
    catch (e) { let put = sha(file) === before; if (!put) { try { fs.writeFileSync(path.join(ROOT, file), src); put = sha(file) === before; } catch (_e) { put = false; } }
      ok(false, `${name}: ${e.message}${put ? '' : ' · THE FILE IS NOT THE ORIGINAL: put it back from git'}`); continue; }
    try { r = cp.spawnSync(process.execPath, [__filename], { env: { ...process.env, B289_CHILD: '1' }, encoding: 'utf8', timeout: 120000, killSignal: 'SIGKILL' }); }
    finally { back = live.restore(); live = null; }
    const red = r.status === 1 && new RegExp(`FAIL  ${cell.replace('.', '\\.')} `).test(r.stdout || '');
    ok(red && back && sha(file) === before, `${name}: reddens ${cell}, restored by sha`, (r.stdout || '').split('\n').filter((l) => l.includes('FAIL')).join(' / '));
  }
  ok(!fs.existsSync(guard.pendingDir(ROOT)), '7.9 nothing pending after the mutations');
  console.log(`\nb289 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})();
