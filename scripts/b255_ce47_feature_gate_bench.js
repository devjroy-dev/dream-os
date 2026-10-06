'use strict';
// scripts/b255_ce47_feature_gate_bench.js · CE-47 · ADS-2 · EVERY META FEATURE PER-VENDOR, LIVE BY ITSELF ON APPROVAL.
// FLOOR-SUBJECTS: src/lib/featureGate.js
// Holds src/lib/featureGate.js on an in-memory store: openFor (row on AND her choice not off AND, for Instagram,
// connected; before approval the walk vendors), the choices (no row = on), the door's refusals, and the live probes.
// The sweep's trigger (Meta's listing "live" AND the probe) is held by b149 section 7. No network: fetch is faked.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const cp = require('child_process');
const ROOT = path.join(__dirname, '..'); const CHILD = !!process.env.B255_CHILD;
let pass = 0, fail = 0; const failed = [];
const ok = (c, name, info) => { if (c) { pass++; if (!CHILD) console.log(`  PASS  ${name}`); } else { fail++; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } };
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost'; process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'x';

function fakeStore(tables) {
  const T = tables;
  const q = (name) => { const st = { f: [], one: false };
    const b = {
      select() { return b; }, eq(k, v) { st.f.push([k, v]); return b; },
      maybeSingle() { st.one = true; return b; },
      upsert(row) { const arr = (T[name] = T[name] || []); const i = arr.findIndex((r) => r.vendor_id === row.vendor_id && r.feature_key === row.feature_key); if (i >= 0) arr[i] = { ...arr[i], ...row }; else arr.push({ ...row }); return Promise.resolve({ error: null }); },
      then(res, rej) { const rows = (T[name] || []).filter((r) => st.f.every(([k, v]) => r[k] === v)); return Promise.resolve(st.one ? { data: rows[0] || null, error: null } : { data: rows, error: null }).then(res, rej); },
    }; return b; };
  return { from: q };
}
const fg = require(path.join(ROOT, 'src/lib/featureGate.js'));
const IGM = 'perm.instagram_business_manage_messages'; const ADS = 'flag.ads';
const V = 'v-1', W = 'v-walk';
const ON = { status: 'on' }, PEND = { status: 'pending' }, ARMED = { status: 'armed' };

(async () => {
  if (!CHILD) console.log('\n── 1  openFor ──');
  let S = fakeStore({ vendor_ig_connections: [{ vendor_id: V, ig_user_id: 'IG1' }] });
  ok((await fg.openFor({ supabase: S, vendorId: V, key: IGM, row: ON, env: {} })).open === true, '1.1 no stored choice means ON: the row on, she is open (live by itself)');
  ok((await fg.openFor({ supabase: S, vendorId: V, key: IGM, row: PEND, env: {} })).open === false, '1.2 the row not on: closed for an ordinary vendor');
  S = fakeStore({ vendor_ig_connections: [{ vendor_id: V, ig_user_id: 'IG1' }], vendor_feature_choices: [{ vendor_id: V, feature_key: IGM, choice: 'off' }] });
  const off = await fg.openFor({ supabase: S, vendorId: V, key: IGM, row: ON, env: {} });
  ok(off.open === false && off.reason === 'she chose off', '1.3 a vendor who chose off stays closed after approval', JSON.stringify(off));
  S = fakeStore({});
  const nc = await fg.openFor({ supabase: S, vendorId: V, key: IGM, row: ON, env: {} });
  ok(nc.open === false && /Instagram not connected/.test(nc.reason), '1.4 Instagram messages need her own Instagram connected through Meta\'s screen', JSON.stringify(nc));
  ok((await fg.openFor({ supabase: S, vendorId: V, key: ADS, row: ON, env: {} })).open === true, '1.5 ads on, no stored choice: a connected ads vendor stays on (nothing she uses closes)');
  ok((await fg.openFor({ supabase: S, vendorId: W, key: IGM, row: PEND, env: { IG_DM_WALK_VENDOR_IDS: W } })).open === true
    && (await fg.openFor({ supabase: S, vendorId: W, key: ADS, row: ARMED, env: { ADS_WALK_VENDOR_ID: W } })).open === true,
    '1.6 before approval the walk vendors open as each gate had them (IG list; ads armed)');
  S = fakeStore({ vendor_ig_connections: [{ vendor_id: W, ig_user_id: 'IGW' }], vendor_feature_choices: [{ vendor_id: W, feature_key: IGM, choice: 'off' }] });
  ok((await fg.openFor({ supabase: S, vendorId: W, key: IGM, row: ON, env: { IG_DM_WALK_VENDOR_IDS: W } })).open === false, '1.7 after approval the walk list limits no one: the walk vendor follows her own choice');
  ok(!fg.FEATURE_KEYS.includes('flag.own_number') && (await fg.openFor({ supabase: S, vendorId: V, key: 'flag.own_number', row: ON, env: {} })).open === false,
    '1.8 flag.own_number is not a featureGate feature (its own door, its own walk)');

  if (!CHILD) console.log('\n── 2  her choices and the door ──');
  S = fakeStore({});
  ok((await fg.setChoice({ supabase: S, vendorId: V, key: ADS, choice: 'off' })).ok === true
    && (await fg.openFor({ supabase: S, vendorId: V, key: ADS, row: ON, env: {} })).open === false, '2.1 she turns ads Off: stored, and honoured');
  ok((await fg.setChoice({ supabase: S, vendorId: V, key: ADS, choice: 'on' })).ok === true
    && (await fg.openFor({ supabase: S, vendorId: V, key: ADS, row: ON, env: {} })).open === true, '2.2 she turns it back On: open again');
  ok((await fg.setChoice({ supabase: S, vendorId: V, key: 'flag.own_number', choice: 'on' })).ok === false
    && (await fg.setChoice({ supabase: S, vendorId: V, key: ADS, choice: 'maybe' })).ok === false, '2.3 the door refuses own_number, any unknown key, and any choice but on or off');

  if (!CHILD) console.log('\n── 3  the live probes ──');
  ok(/FEATURE_PROBE_VENDOR_ID is not set/.test((await fg.probe(IGM, { supabase: S, env: {} })).evidence), '3.1 no probe vendor set: no probe can pass');
  const seen = []; const fetchOk = async (u) => { seen.push(u); return { ok: true, status: 200, json: async () => ({ data: [] }) }; };
  const fetch400 = async (u) => { seen.push(u); return { ok: false, status: 400, json: async () => ({ error: { code: 10, message: 'not allowed' } }) }; };
  S = fakeStore({ vendor_ad_connections: [{ vendor_id: 'probe', access_token: 'ADTOKEN' }] });
  const pa = await fg.probe(ADS, { supabase: S, env: { FEATURE_PROBE_VENDOR_ID: 'probe' }, fetch: fetchOk });
  ok(pa.ok === true && /me\/adaccounts/.test(seen[seen.length - 1]), '3.2 the ads probe reads me/adaccounts with the probe vendor\'s real ads token, and passes', JSON.stringify(pa));
  const pf = await fg.probe(ADS, { supabase: S, env: { FEATURE_PROBE_VENDOR_ID: 'probe' }, fetch: fetch400 });
  ok(pf.ok === false && /live probe failed: GET me\/adaccounts 400 \(#10\) not allowed/.test(pf.evidence), '3.3 a failing probe says what failed', JSON.stringify(pf));

  const MUTS = [
    ["data && data.choice === 'off' ? 'off' : 'on'", "data && data.choice === 'on' ? 'on' : 'off'", 'M1 no stored choice read as OFF', '1.1'],
    ["  if (c.choice === 'off') return { open: false, reason: 'she chose off' };\n", '', 'M2 her choice ignored', '1.3'],
    ["  if (NEEDS_INSTAGRAM.includes(key) && !(await instagramConnected(supabase, vendorId))) return { open: false, reason: 'Instagram not connected' };\n", '', 'M3 Instagram connection not required', '1.4'],
    ["  if (!FEATURE_KEYS.includes(key)) return { ok: false, error: 'not a Meta-gated feature' };\n  if (choice", "  if (choice", 'M4 the door takes any key', '2.3'],
    ["  if (r.status !== 'on') return walkOpen(key, r, vendorId, env)", "  if (r.status !== 'on' && r.status !== 'pending') return walkOpen(key, r, vendorId, env)", 'M5 pending read as live', '1.2'],
  ];
  if (CHILD) { console.log(`b255 child · ${pass} pass · ${fail} fail`); process.exit(fail ? 1 : 0); }
  console.log('\n── 9  mutations (each in a fresh child, restored by sha) ──');
  const P = path.join(ROOT, 'src/lib/featureGate.js'); const sha = () => crypto.createHash('sha256').update(fs.readFileSync(P)).digest('hex');
  for (const [from, to, name, cell] of MUTS) {
    const src = fs.readFileSync(P, 'utf8'); const before = sha();
    if (src.split(from).length !== 2) { ok(false, `${name}: anchor found exactly once`); continue; }
    fs.writeFileSync(P, src.replace(from, to));
    let r; try { r = cp.spawnSync(process.execPath, [__filename], { env: { ...process.env, B255_CHILD: '1' }, encoding: 'utf8' }); } finally { fs.writeFileSync(P, src); }
    ok(r.status === 1 && new RegExp(`FAIL  ${cell.replace('.', '\\.')} `).test(r.stdout || '') && sha() === before, `${name}: reddens ${cell}, restored by sha`, (r.stdout || '').split('\n').filter((l) => l.includes('FAIL')).join(' / '));
  }
  console.log(`\nb255 · ${pass} pass · ${fail} fail`);
  if (failed.length) console.log('FAILED: ' + failed.join(' | '));
  process.exit(fail ? 1 : 0);
})();
