// scripts/b149_ads2_meta_gates_bench.js · CE-47 · ADS-2 · cut 2 item 3 · R-46.15, THE APPROVAL SWEEP.
// What it holds: src/lib/metaGates.js (the one home), capabilities.recordSweep's withdrawal branch (w),
// capabilitiesSweep.sweepMetaGates, and db/migrations/0192_meta_gate_rows.sql. In-process, a register double and a
// FAKE GRAPH (never a live Meta call); every branch both ways. Mutations of production files run each in a fresh child
// process (B149_CHILD) and are restored by sha on every exit path.
'use strict';
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const CHILD = !!process.env.B149_CHILD;
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; if (!CHILD) console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
function sec(t) { if (!CHILD) console.log(`\n── ${t} ──`); }

// THE REGISTER DOUBLE: exactly the queries capabilities.js makes (select·eq·maybeSingle, select·order·order, update·eq).
function register(rows) {
  const t = new Map(rows.map((r) => [r.key, { evidence: null, checked_at: null, flipped_at: null, flipped_by: null, auto_on: false, walk_ref: null, ...r }]));
  const q = () => { let upd = null, key = null; const api = {
    select() { return api; }, order() { return api; },
    update(p) { upd = p; return api; },
    eq(_k, v) { key = v; if (upd) { const r = t.get(v); if (r) Object.assign(r, upd); return Promise.resolve({ error: null }); } return api; },
    maybeSingle() { const r = t.get(key); return Promise.resolve({ data: r ? { ...r } : null, error: null }); },
    then(res, rej) { return Promise.resolve({ data: [...t.values()].map((r) => ({ ...r })), error: null }).then(res, rej); },
  }; return api; };
  return { rows: t, from: () => q() };
}
const ADS7 = ['ads_management', 'ads_read', 'pages_read_engagement', 'pages_show_list', 'pages_manage_ads', 'instagram_basic'];   // six now (CE-47, 4 Oct); the name kept
const ENV = { ADS_APP_ID: 'ADSAPP', ADS_APP_SECRET: 'SECRET-ADS', META_APP_ID: 'LIVEAPP', META_APP_SECRET: 'SECRET-LIVE', META_GRAPH_VERSION: 'v26.0' };
function graph(lists, seen) {   // lists: { ADSAPP: {perm: word}, LIVEAPP: {...} } ; an app mapped to 'ERR' answers an error
  return async (url, opts) => {
    seen && seen.push({ url, auth: opts && opts.headers && opts.headers.Authorization });
    const id = (url.match(/\/v[\d.]+\/([^/]+)\/permissions$/) || [])[1];
    const l = lists[id];
    if (l === 'ERR') return { ok: false, status: 400, json: async () => ({ error: { code: 100, message: 'This method must be called with an app access_token' } }) };
    return { ok: true, status: 200, json: async () => ({ data: Object.entries(l || {}).map(([permission, status]) => ({ permission, status })) }) };
  };
}
const live = (ps) => Object.fromEntries(ps.map((p) => [p, 'live']));
const PROBE = { ok: true, calls: [] };
async function sweep(rows, lists, env = ENV) {
  delete require.cache[require.resolve(path.join(ROOT, 'src/lib/capabilities.js'))];
  delete require.cache[require.resolve(path.join(ROOT, 'src/lib/metaGates.js'))];
  delete require.cache[require.resolve(path.join(ROOT, 'src/capabilitiesSweep.js'))];
  const sw = require(path.join(ROOT, 'src/capabilitiesSweep.js'));
  const reg = register(rows); const logs = []; const seen = [];
  const ol = console.log; console.log = (...a) => logs.push(a.map(String).join(' '));
  // LABELLED AMENDMENT (CE-47 ADS-2, 4 Oct 2026): the sweep now needs a live probe to pass before a feature goes on;
  // these cells inject it (PROBE.ok, passing unless a cell says otherwise) and count its calls.
  let out; try { out = await sw.sweepMetaGates({ supabase: reg, env, fetch: graph(lists, seen), probe: async (k) => { PROBE.calls.push(k); return { ok: PROBE.ok, evidence: PROBE.ok ? 'live probe passed: test' : 'live probe failed: GET me/conversations 400 (#10) not allowed' }; } }); } finally { console.log = ol; }
  return { reg, row: (k) => reg.rows.get(k), logs, out, seen };
}
const ARMED_AUTO = { key: 'flag.ads', kind: 'flag', status: 'armed', auto_on: true, walk_ref: 'seal:test' };

async function cells() {
  sec('1  flag.ads (TDW ADS, seven permissions)');
  let s = await sweep([ARMED_AUTO], { ADSAPP: live(ADS7), LIVEAPP: {} });
  ok(s.row('flag.ads').status === 'on' && s.row('flag.ads').flipped_by === 'sweep:auto_on', '1.1 all six live, armed with auto_on and walk_ref: it turns on, by sweep:auto_on', JSON.stringify(s.row('flag.ads')));
  ok(s.logs.some((l) => l.endsWith('founder line (rides tdw_capability_armed until tdw_capability_line is approved): Instagram ads are now live for every vendor.')), '1.2 the founder line, verbatim, logged beside today\'s notice', s.logs.join(' | '));
  s = await sweep([ARMED_AUTO], { ADSAPP: live(ADS7.slice(0, 5)), LIVEAPP: {} });
  ok(s.row('flag.ads').status === 'armed' && /not live: instagram_basic/.test(s.row('flag.ads').evidence || ''), '1.3 five of six: it stays armed, the evidence names the one not live', JSON.stringify(s.row('flag.ads')));
  s = await sweep([{ key: 'flag.ads', kind: 'flag', status: 'armed' }], { ADSAPP: live(ADS7), LIVEAPP: {} });
  ok(s.row('flag.ads').status === 'armed', '1.4 all live but no auto_on: it stays armed (the walk vendor keeps the room)', s.row('flag.ads').status);
  s = await sweep([{ key: 'flag.ads', kind: 'flag', status: 'on', flipped_by: 'admin:5ab0c1d2' }], { ADSAPP: {}, LIVEAPP: {} });
  ok(s.row('flag.ads').status === 'on' && s.row('flag.ads').flipped_by === 'admin:5ab0c1d2', '1.5 on by the founder\'s hand, nothing listed: untouched', JSON.stringify(s.row('flag.ads')));

  sec('2  the withdrawal (recordSweep (w))');
  s = await sweep([{ key: 'flag.ads', kind: 'flag', status: 'on', flipped_by: 'sweep:auto_on', auto_on: true, walk_ref: 'seal:test' }], { ADSAPP: live(ADS7.filter((p) => p !== 'ads_read')), LIVEAPP: {} });
  ok(s.row('flag.ads').status === 'armed' && s.row('flag.ads').flipped_by === 'sweep:withdrawn', '2.1 on by the sweep, ads_read no longer live: back to armed, flipped_by sweep:withdrawn', JSON.stringify(s.row('flag.ads')));
  ok(s.logs.some((l) => l.endsWith(': Meta has withdrawn ads_read. Instagram ads are back to Coming soon for vendors.')), '2.2 the withdrawn line, plural for ads (CE-47 ruling 3)', s.logs.join(' | '));
  s = await sweep([{ key: 'flag.ig_photo_import', kind: 'flag', status: 'on', flipped_by: 'sweep:auto_on', auto_on: true, walk_ref: 'w' }], { ADSAPP: {}, LIVEAPP: {} });
  ok(s.logs.some((l) => l.endsWith(': Meta has withdrawn instagram_business_basic. The Instagram photo import is back to Coming soon for vendors.')), '2.3 the photo import\'s withdrawn line stays singular', s.logs.join(' | '));

  sec('3  the Instagram messages gate (App-LIVE)');
  const IGM = 'perm.instagram_business_manage_messages';
  s = await sweep([{ key: IGM, kind: 'permission', status: 'pending' }], { ADSAPP: {}, LIVEAPP: live(['instagram_business_basic', 'instagram_business_manage_messages']) });
  ok(s.row(IGM).status === 'approved', '3.1 both live, no auto_on: approved, not on (the founder flips)', s.row(IGM).status);
  s = await sweep([{ key: IGM, kind: 'permission', status: 'pending', auto_on: true, walk_ref: 'w' }], { ADSAPP: {}, LIVEAPP: live(['instagram_business_basic', 'instagram_business_manage_messages']) });
  ok(s.row(IGM).status === 'on' && s.logs.some((l) => l.endsWith(': Instagram messages are now live for every vendor.')), '3.2 both live with auto_on: on, and its line', JSON.stringify(s.row(IGM)));
  s = await sweep([{ key: IGM, kind: 'permission', status: 'pending' }], { ADSAPP: {}, LIVEAPP: live(['whatsapp_business_management', 'whatsapp_business_messaging', 'public_profile']) });
  ok(s.row(IGM).status === 'pending', '3.3 the founder\'s real App-LIVE read (30 Sept): messages stay pending', s.row(IGM).status);

  s = await sweep([{ key: 'flag.ig_photo_import', kind: 'flag', status: 'pending', auto_on: true, walk_ref: 'w' }], { ADSAPP: {}, LIVEAPP: live(['instagram_business_basic']) });
  ok(s.row('flag.ig_photo_import').status === 'on' && s.logs.some((l) => l.endsWith(': The Instagram photo import is now live for every vendor.')),
    '3.4 the photo import turns on with instagram_business_basic alone (CE-47, 4 Oct)', JSON.stringify(s.row('flag.ig_photo_import')));
  sec('7  THE TRIGGER: Meta\'s approval AND the live probe (CE-47, 4 Oct 2026)');
  const PEND = { key: 'perm.instagram_business_manage_messages', kind: 'permission', status: 'pending', auto_on: true, walk_ref: 'ruled' };
  PROBE.ok = true; PROBE.calls = [];
  s = await sweep([{ ...PEND }], { ADSAPP: {}, LIVEAPP: live(['instagram_business_basic', 'instagram_business_manage_messages']) });
  ok(s.row('perm.instagram_business_manage_messages').status === 'on' && PROBE.calls.includes('perm.instagram_business_manage_messages'), '7.1 approved (listed live) and the probe passes: on', JSON.stringify(s.row('perm.instagram_business_manage_messages')));
  PROBE.ok = true; PROBE.calls = [];
  s = await sweep([{ ...PEND }], { ADSAPP: {}, LIVEAPP: live(['instagram_business_basic']) });
  ok(s.row('perm.instagram_business_manage_messages').status === 'pending', '7.2 the probe would pass (a tester\'s token) but the permission is ABSENT from the listing: stays pending', JSON.stringify(s.row('perm.instagram_business_manage_messages')));
  PROBE.ok = true; PROBE.calls = [];
  s = await sweep([{ ...PEND }], { ADSAPP: {}, LIVEAPP: { ...live(['instagram_business_basic']), instagram_business_manage_messages: 'in_review' } });
  ok(s.row('perm.instagram_business_manage_messages').status === 'pending', '7.3 present but not "live" (in_review): stays pending', JSON.stringify(s.row('perm.instagram_business_manage_messages')));
  PROBE.ok = false; PROBE.calls = [];
  s = await sweep([{ ...PEND }], { ADSAPP: {}, LIVEAPP: live(['instagram_business_basic', 'instagram_business_manage_messages']) });
  ok(s.row('perm.instagram_business_manage_messages').status !== 'on' && /the live probe failed|live probe failed/.test(s.row('perm.instagram_business_manage_messages').evidence || ''), '7.4 approved but the probe fails: stays off, its evidence naming the failure', JSON.stringify(s.row('perm.instagram_business_manage_messages')));
  PROBE.ok = true; PROBE.calls = [];
  sec('4  the mapping (ruled on the founder\'s reads)');
  s = await sweep([ARMED_AUTO], { ADSAPP: { ...live(ADS7), ads_read: 'in_review' }, LIVEAPP: {} });
  ok(s.row('flag.ads').status === 'armed', '4.1 any word but "live" is not approved', s.row('flag.ads').status);
  ok(s.logs.some((l) => l.includes('Meta word "in_review" on ads_read')) && /word "in_review" on ads_read/.test(s.row('flag.ads').evidence || ''), '4.2 the new word is recorded verbatim and named', s.logs.join(' | '));
  s = await sweep([{ key: 'perm.whatsapp_business_pair', kind: 'permission', status: 'pending' }, { key: 'perm.ads_read', kind: 'permission', status: 'pending' }],
    { ADSAPP: {}, LIVEAPP: live(['whatsapp_business_management', 'whatsapp_business_messaging']) });
  ok(s.row('perm.whatsapp_business_pair').status === 'approved' && s.row('perm.ads_read').status === 'pending', '4.3 perm rows: both WhatsApp live is approved; ads_read absent stays pending',
    `${s.row('perm.whatsapp_business_pair').status}/${s.row('perm.ads_read').status}`);

  sec('5  failures move evidence, never status; no secret is ever logged');
  const noLive = { ...ENV }; delete noLive.META_APP_ID;
  s = await sweep([{ key: IGM, kind: 'permission', status: 'pending' }], { ADSAPP: {}, LIVEAPP: live(['instagram_business_basic', 'instagram_business_manage_messages']) }, noLive);
  ok(s.row(IGM).status === 'pending' && s.logs.some((l) => l.includes('META_APP_ID or META_APP_SECRET is not set in this environment')), '5.1 META_APP_ID unset: said plainly in the log, status unmoved (CE-47 ruling 2)', s.logs.join(' | '));
  s = await sweep([ARMED_AUTO], { ADSAPP: 'ERR', LIVEAPP: {} });
  ok(s.row('flag.ads').status === 'armed' && /Graph 400 for TDW ADS/.test(s.row('flag.ads').evidence || ''), '5.2 Meta refuses: evidence moves, the status does not', JSON.stringify(s.row('flag.ads')));
  s = await sweep([ARMED_AUTO, { key: IGM, kind: 'permission', status: 'pending', auto_on: true, walk_ref: 'w' }], { ADSAPP: live(ADS7), LIVEAPP: live(['instagram_business_basic', 'instagram_business_manage_messages']) });
  ok(s.seen.length === 2 && s.seen.every((x) => /^Bearer (ADSAPP\|SECRET-ADS|LIVEAPP\|SECRET-LIVE)$/.test(x.auth)), '5.3 one read per app, with that app\'s own app token', JSON.stringify(s.seen.map((x) => x.url)));
  ok(!s.logs.some((l) => /SECRET-ADS|SECRET-LIVE/.test(l)) && ![...s.reg.rows.values()].some((r) => /SECRET/.test(r.evidence || '')), '5.4 no app secret in any log line or evidence', s.logs.join(' | '));

  sec('6  0192 as written, and one home');
  const mig = fs.readFileSync(path.join(ROOT, 'db/migrations/0192_meta_gate_rows.sql'), 'utf8').replace(/--.*$/gm, '');
  const keys = [...mig.matchAll(/\('((?:perm|flag)\.[a-z0-9_.]+)'/g)].map((m) => m[1]);
  ok(keys.length === 7 && /ON CONFLICT \(key\) DO NOTHING/.test(mig) && !/CHECK/i.test(mig) && !/UPDATE|DELETE/i.test(mig), '6.1 0192 inserts seven rows, idempotent, no CHECK, no update or delete', keys.join(','));
  const seeded = new Set(fs.readdirSync(path.join(ROOT, 'db/migrations')).filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .flatMap((f) => [...fs.readFileSync(path.join(ROOT, 'db/migrations', f), 'utf8').matchAll(/\('((?:perm|flag)\.[a-z0-9_.]+)'/g)].map((m) => m[1])));
  const g = require(path.join(ROOT, 'src/lib/metaGates.js'));
  const need = [...Object.keys(g.PERM_ROWS), ...g.FEATURES.map((f) => f.gate)];
  ok(need.every((k) => seeded.has(k)), '6.2 every key the sweep reads has a row in the ladder', need.filter((k) => !seeded.has(k)).join(','));
  ok(JSON.stringify(g.FEATURES.find((f) => f.gate === 'flag.ads').permissions) === JSON.stringify(ADS7), '6.3 flag.ads needs exactly the six ruled permissions (instagram_manage_insights not filed)', '');
}

const MUTS = [
  ['src/lib/capabilities.js', "row.status === 'on' && row.flipped_by === 'sweep:auto_on' && status !== 'approved'", "false", 'M1 the withdrawal branch removed', '2.1'],
  ['src/lib/metaGates.js', "if (w !== LIVE) missing.push(p);", "if (w === undefined) missing.push(p);", 'M2 any listed word counts as approved', '4.1'],
  ['src/capabilitiesSweep.js', "(row.status === 'armed' && auto)", "row.status === 'armed'", 'M3 an armed gate without auto_on is written', '1.4'],
  ['src/lib/metaGates.js', "${f.plural ? 'are' : 'is'}", "is", 'M4 the plural lost', '2.2'],
  ['src/capabilitiesSweep.js', "console.log(`[capabilities] ${ev}`);", "void ev;", 'M5 an unset app id not said in the log', '5.1'],
  ['src/capabilitiesSweep.js', "console.log(`[capabilities] founder line (rides tdw_capability_armed until ${gates.LINE_TEMPLATE} is approved): ${line}`);", "void line;", 'M6 the founder line not logged', '1.2'],
  ['src/lib/metaGates.js', "permissions: Object.freeze(['instagram_business_basic']),", "permissions: Object.freeze(['instagram_business_basic', 'instagram_business_manage_messages']),", 'M7 the photo import waits on messages again', '3.4'],
  ['src/lib/metaGates.js', "'pages_manage_ads', 'instagram_basic']),", "'pages_manage_ads', 'instagram_basic', 'instagram_manage_insights']),", 'M8 flag.ads asks for insights again', '1.1'],
  ['src/capabilitiesSweep.js', "    if (r.status === 'approved' && row.status !== 'on') {\n      const pr = await runProbe(f0.gate);", "    if (false) {\n      const pr = await runProbe(f0.gate);", 'M9 approval alone turns a feature on (no probe)', '7.4'],
];
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async () => {
  try { await cells(); } catch (e) { ok(false, `b149 crashed: ${e && e.message}`); }
  if (CHILD) process.exit(fail ? 1 : 0);
  sec('7  mutations of production code (each must red its cell in a child run; restored by sha)');
  const saved = new Map();
  const restore = () => { for (const [p, b] of saved) fs.writeFileSync(p, b); };
  process.on('exit', restore); for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(s, () => process.exit(130));
  for (const [file, from, to, name, cell] of MUTS) {
    const p = path.join(ROOT, file); const before = sha(p); const src = fs.readFileSync(p, 'utf8');
    if (src.split(from).length !== 2) { ok(false, `${name}: anchor found exactly once`, file); continue; }
    saved.set(p, src); fs.writeFileSync(p, src.replace(from, to));
    const r = cp.spawnSync(process.execPath, [__filename], { env: { ...process.env, B149_CHILD: '1' }, encoding: 'utf8' });
    fs.writeFileSync(p, src); saved.delete(p);
    const red = r.status === 1 && new RegExp(`FAIL  ${cell.replace('.', '\\.')} `).test(r.stdout || '');
    ok(red && sha(p) === before, `${name}: reddens ${cell}, restored by sha`, (r.stdout || '').split('\n').filter((l) => l.includes('FAIL')).join(' / '));
  }
  console.log(`\nb149 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})();
