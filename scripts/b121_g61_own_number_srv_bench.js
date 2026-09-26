'use strict';
// scripts/b121_g61_own_number_srv_bench.js · TDW CE-45 · G6-1 · CUT 2a (dream-os). Rung b121.
//
// WHAT IT HOLDS. The own-number server half, as ruled on 2026-09-24 (read-first G1, G2, F1 to F6):
// the doors FE_1 builds to; walk mode as the ONLY opening ('on' not honoured until 2b); the connect in
// Meta's order with the code exchanged first; the shared way never registering and syncing once; the
// moved way registering with a derived PIN; the receiver routing a vendor's own traffic in-house and
// TDW's PNID-less events to the vendor lane (F-44.138 widened); receipt only; auto-pause as state;
// §7c's resolver; and src/index.js untouched.
//
// DOUBLES AS POSTGRES RETURNS DATA (C-44.3): the fake client answers { data, error }, returns only the
// selected columns, enforces 0171's UNIQUE and CHECK sets with Postgres's own error codes, and counts
// reads so a cache cell can see a read that did not happen. Meta is a recording fetch that never
// leaves the process. Mutations of production code are restored byte for byte, their sha re-checked.
// C-44.13: the only clock read is the injected now() for stamps; §3.9 runs it at three shifted instants.
//
// THE EXIT CODE IS THE VERDICT.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
let pass = 0; let fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
const fresh = (rel) => { const k = require.resolve(P(rel)); delete require.cache[k]; return require(k); };
const freshAll = () => { for (const r of ['src/lib/ownNumber/meta.js', 'src/lib/ownNumber/door.js', 'src/lib/ownNumber/connect.js', 'src/lib/ownNumber/wabaMap.js', 'src/lib/ownNumber/events.js', 'src/lib/metaInbound.js', 'src/lib/discover/shapeVendor.js']) { const k = require.resolve(P(r)); delete require.cache[k]; } };

// ── the Postgres-shaped double ─────────────────────────────────────────────────────────────
const UNIQUE = { vendor_wabas: ['vendor_id', 'waba_id', 'phone_number_id'] };
const CHECKS = {
  vendor_wabas: { connect_way: ['shared', 'moved'], status: ['pending', 'active', 'suspended', 'migrated_out'] },
  vendor_wa_events: { kind: ['inbound', 'history', 'contacts', 'echo', 'account_update', 'quality_update'] },
};
function fakeDb(seed = {}) {
  const t = { vendor_wabas: [], vendor_wa_events: [], ...JSON.parse(JSON.stringify(seed)) };
  const reads = [];
  const pick = (row, cols) => { if (!cols || cols === '*') return { ...row }; const o = {}; for (const c of cols.split(',').map((x) => x.trim())) o[c] = row[c] === undefined ? null : row[c]; return o; };
  const from = (table) => {
    let op = 'select'; let cols = '*'; let filt = []; let payload = null; let single = false;
    const q = {
      select(c) { if (op === 'select') op = 'select'; cols = c || '*'; return q; },
      eq(c, v) { filt.push([c, v]); return q; },
      insert(p) { op = 'insert'; payload = p; return q; },
      update(p) { op = 'update'; payload = p; return q; },
      delete() { op = 'delete'; return q; },
      maybeSingle() { single = true; return q.then ? q : q; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    const match = (r) => filt.every(([c, v]) => String(r[c]) === String(v));
    const err = (code, message) => ({ data: null, error: { code, message } });
    function run() {
      const rows = t[table] || (t[table] = []);
      if (op === 'select') {
        reads.push({ table, filt: JSON.stringify(filt) });
        const got = rows.filter(match).map((r) => pick(r, cols));
        if (single) { if (got.length > 1) return err('PGRST116', 'multiple rows'); return { data: got[0] || null, error: null }; }
        return { data: got, error: null };
      }
      if (op === 'insert') {
        const r = { id: crypto.randomUUID(), status: table === 'vendor_wabas' ? 'pending' : undefined, received_at: new Date(0).toISOString(), ...payload };
        for (const [c, allowed] of Object.entries(CHECKS[table] || {})) if (r[c] !== undefined && !allowed.includes(r[c])) return err('23514', `violates check constraint "${table}_${c}_check"`);
        for (const c of UNIQUE[table] || []) if (rows.some((x) => String(x[c]) === String(r[c]))) return err('23505', `duplicate key value violates unique constraint "${table}_${c}_key"`);
        rows.push(r); return { data: [pick(r, cols)], error: null };
      }
      if (op === 'update') {
        const hit = rows.filter(match);
        for (const r of hit) { const n = { ...r, ...payload }; for (const [c, allowed] of Object.entries(CHECKS[table] || {})) if (!allowed.includes(n[c])) return err('23514', `violates check constraint "${table}_${c}_check"`); Object.assign(r, payload); }
        return { data: hit.map((r) => pick(r, cols)), error: null };
      }
      if (op === 'delete') { const hit = rows.filter(match); t[table] = rows.filter((r) => !match(r)); return { data: hit.map((r) => pick(r, cols)), error: null }; }
      return err('XX000', 'unknown op');
    }
    return q;
  };
  return { from, t, reads };
}
// ── the recording Meta ──────────────────────────────────────────────────────────────────────
function fakeMeta({ expired = false, numbers = [{ id: '106540352242922', display_phone_number: '+91 87577 88550', quality_rating: 'GREEN' }] } = {}) {
  const calls = [];
  const res = (status, body) => ({ ok: status < 400, status, json: async () => body });
  const f = async (url, init = {}) => {
    const u = new URL(url); const step = u.pathname.split('/').slice(2).join('/');
    calls.push({ method: init.method || 'GET', step, body: init.body ? JSON.parse(init.body) : null, auth: (init.headers || {}).Authorization || null });
    if (step === 'oauth/access_token') return expired ? res(400, { error: { message: 'This authorization code has expired.' } }) : res(200, { access_token: 'BT-her-token' });
    if (step.endsWith('/phone_numbers')) return res(200, { data: numbers });
    return res(200, { success: true });
  };
  return { f, calls };
}
const WALK = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const ENV = { OWN_NUMBER_WALK_VENDOR_ID: WALK, META_APP_ID: '1425513376067685', OWN_NUMBER_CONFIG_ID: '3333333333333333', META_APP_SECRET: 'app-secret', META_GRAPH_VERSION: 'v25.0' };
const capWith = (rows) => ({ get: async (k) => (k in rows ? rows[k] : null) });
const ARMED = capWith({ 'flag.own_number': { key: 'flag.own_number', status: 'armed' }, 'flag.own_number.signature': { status: 'off' } });
const ON = capWith({ 'flag.own_number': { key: 'flag.own_number', status: 'on' } });
const vend = (id = WALK, tier = 'signature') => ({ id, tier });
const BODY_SHARED = { code: 'CODE', event: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING', waba_id: '524126980791429', phone_number_id: null, business_id: '2729063490586005' };
const BODY_MOVED = { ...BODY_SHARED, event: 'FINISH', phone_number_id: '106540352242922' };

(async () => {
  sec('1  the source and the boundary');
  // RE-AIMED (CE-45 LCV-16 LSP_5, labelled; G6-1 told through the chair): this cell read the UNCOMMITTED tree (`git diff HEAD`), so any
  // later delivery touching src/engine reddened it before its own commit (LSP_5 does, by ruling). The claim is G6-1's sitting's, so it is
  // pinned to that sitting's commit, bd9d153: the four paths are untouched THERE, true at every tip and in every working tree.
  const diffIdx = execSync('git diff --name-only bd9d153^ bd9d153 -- src/index.js src/engine src/lib/sendWa.js src/lib/whatsapp.js', { cwd: ROOT }).toString().trim();
  ok(diffIdx === '', '1.1 src/index.js, src/engine, sendWa.js and whatsapp.js are untouched (G1, W-1, 2b)', diffIdx);
  const idx = read('src/api/vendor/solutions/index.js');
  ok(/router\.use\('\/number', require\('\.\/number'\)\);/.test(idx), '1.2 the doors mount at /api/v2/vendor/solutions/number beside their siblings (FK1)');
  const nr = read('src/api/vendor/solutions/number.js');
  ok((nr.match(/requireAuth, resolveVendor\(\)/g) || []).length === 2, '1.3 both doors are hers alone: requireAuth then resolveVendor(), mode A');
  const mk = read('src/marketingIndex.js');
  ok(/const own = lane \? null : await ownNumberMap\.lookup\(supabase, \{ phoneNumberId, wabaId: entryId \}\);/.test(mk) && /const route = routeChange\(lane, phoneNumberId, own\);/.test(mk)
    && /else if \(route === 'own'\) \{\s+try \{ await ownNumberEvents\.handle\(supabase, own, change\); \}/.test(mk) && !/forwardChange\('own'/.test(mk),
    '1.4 the receiver asks the map only when no env lane owns the change, and handles own-number traffic in place, never forwarded');
  const mig = read('db/migrations/0171_own_number.sql');
  ok((mig.match(/ENABLE ROW LEVEL SECURITY/g) || []).length === 2 && /^BEGIN;$/m.test(mig) && /^COMMIT;$/m.test(mig) && mig.indexOf('ENABLE ROW LEVEL SECURITY') < mig.indexOf('COMMIT;'),
    '1.5 0171 enables RLS on both new tables inside its one transaction (SEC-1)');
  ok(!/\btoken\b|\bpin\b/i.test(mig.replace(/--.*$/gm, '')), '1.6 0171 has no column for her token or her PIN (FK5, F3: never stored)');
  const lib = ['meta', 'door', 'connect', 'wabaMap', 'events'].map((f) => read(`src/lib/ownNumber/${f}.js`)).join('\n');
  ok(!/\b(Victor|Donna|Harvey|Mira)\b/.test(lib + nr) && !/\u2014/.test(lib.replace(/\/\/.*$/gm, '')), '1.7 no persona name anywhere; no em dash in any code line');

  sec('2  the pure decisions');
  freshAll();
  const MI = fresh('src/lib/metaInbound.js');
  const own = { vendor_id: WALK };
  const table = [[['marketing', 'p', own], 'marketing'], [['bride', 'p', null], 'bride'], [['vendor', null, null], 'vendor'],
    [[null, '106', own], 'own'], [[null, null, own], 'own'], [[null, null, null], 'vendor'], [[null, '999', null], 'drop']];
  const bad = table.filter(([a, want]) => MI.routeChange(...a) !== want);
  ok(bad.length === 0, '2.1 routeChange: env lanes win; her PNID or WABA -> own; a PNID-less change on any other WABA -> vendor (F-44.138); an unknown PNID -> drop', JSON.stringify(bad));
  const D = fresh('src/lib/ownNumber/door.js');
  const g = (status, id, env = ENV) => D.openFor({ masterRow: status ? { status } : null, vendorId: id, env }).open;
  ok(g('armed', WALK) && !g('armed', OTHER) && !g('on', WALK) && !g('on', OTHER) && !g('off', WALK) && !g(null, WALK) && !g('armed', WALK, { ...ENV, OWN_NUMBER_WALK_VENDOR_ID: '' }),
    '2.2 walk mode is the only opening: armed AND the walk vendor; on, off, absent, or no walk vendor set -> shut (F2)');
  ok(D.launchFrom(ENV).app_id === '1425513376067685' && D.launchFrom({ ...ENV, OWN_NUMBER_CONFIG_ID: '' }) === null && D.launchFrom(ENV).extras.shared === null
    && JSON.stringify(D.launchFrom({ ...ENV, OWN_NUMBER_EXTRAS_SHARED: '{"setup":{},"x":1}' }).extras.shared) === '{"setup":{},"x":1}' && D.launchFrom({ ...ENV, OWN_NUMBER_EXTRAS_SHARED: '{bad' }).extras.shared === null,
    '2.3 the launch comes from Railway only; a missing id means nothing to launch; per-way extras are passed through, junk ignored');
  const C = fresh('src/lib/ownNumber/connect.js');
  let threw = null;
  for (const h of [undefined, null, 1, 'x', [], {}, { code: '' }, { code: 5 }, { code: 'x'.repeat(5000) }]) { try { if (C.readBody(h) !== null) threw = 'admitted ' + JSON.stringify(h).slice(0, 40); } catch (e) { threw = e.message; } }
  ok(threw === null && C.readBody(BODY_SHARED).code === 'CODE', '2.4 a body without a usable code is refused before any read, and nothing hostile throws', threw);
  ok(C.wayOf('FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') === 'shared' && C.wayOf('FINISH') === 'moved' && C.wayOf('FINISH_ONLY_WABA') === null && C.wayOf(undefined) === null,
    '2.5 the way is Meta\u2019s own finish event: Coexistence -> shared, FINISH -> moved, anything else -> refused');
  const M = fresh('src/lib/ownNumber/meta.js');
  const p1 = M.pinFor('106540352242922', 'app-secret');
  ok(/^\d{6}$/.test(p1) && p1 === M.pinFor('106540352242922', 'app-secret') && p1 !== M.pinFor('106540352242923', 'app-secret') && M.pinFor('106540352242922', '') === null,
    '2.6 the PIN is six digits, the same every time for the same number, different for another, and refused without the secret (F3)');
  const E = fresh('src/lib/ownNumber/events.js');
  const ns = (row, field, value) => JSON.stringify(E.nextStatus(row, field, value));
  ok(ns({ status: 'active' }, 'phone_number_quality_update', { event: 'FLAGGED' }) === '{"status":"suspended","paused_reason":"quality:FLAGGED"}'
    && ns({ status: 'suspended', paused_reason: 'quality:FLAGGED' }, 'phone_number_quality_update', { event: 'UPGRADE' }) === '{"status":"active","paused_reason":null}'
    && ns({ status: 'suspended', paused_reason: 'account:ACCOUNT_RESTRICTION' }, 'phone_number_quality_update', { event: 'UPGRADE' }) === 'null'
    && ns({ status: 'active' }, 'account_update', { event: 'ACCOUNT_RESTRICTION' }) === '{"status":"suspended","paused_reason":"account:ACCOUNT_RESTRICTION"}'
    && ns({ status: 'active' }, 'account_update', { event: 'PARTNER_REMOVED' }) === '{"status":"migrated_out","paused_reason":"account:PARTNER_REMOVED"}'
    && ns({ status: 'suspended', paused_reason: 'account:DISABLED_UPDATE' }, 'account_update', { event: 'DISABLED_UPDATE', ban_info: { waba_ban_state: 'REINSTATE' } }) === '{"status":"active","paused_reason":null}'
    && ns({ status: 'active' }, 'messages', { event: 'FLAGGED' }) === 'null' && ns(null, 'account_update', { event: 'PARTNER_REMOVED' }) === 'null',
    '2.7 auto-pause as state (F5): quality down pauses and a quality recovery lifts ONLY a quality pause; account restrictions pause; partner removal moves her out; reinstatement restores');
  ok(E.historyDeclined({ history: [{ errors: [{ code: 2593109 }] }] }) && !E.historyDeclined({ history: [{ threads: [] }] }) && !E.historyDeclined(null),
    '2.8 Meta\u2019s 2593109 (history not shared) is recognised as her choice, not a failure (walk plan (c))');
  const SV = fresh('src/lib/discover/shapeVendor.js');
  ok(SV.enquireLinkFor({ handle: 'DEV440' }) === `${SV.ENQUIRE_BASE}DEV440` && SV.enquireLinkFor({ handle: 'DEV440', enquiry_routing: 'tdw' }) === `${SV.ENQUIRE_BASE}DEV440`
    && SV.enquireLinkFor({ handle: 'X', enquiry_routing: 'own_number', enquiry_phone: '+91 87577 88550' }) === 'https://wa.me/918757788550'
    && SV.enquireLinkFor({ handle: 'X', enquiry_routing: 'own_number', enquiry_phone: '123' }) === `${SV.ENQUIRE_BASE}X`
    && SV.enquireLinkFor({ handle: 'X', enquiry_routing: 'own_waba' }) === `${SV.ENQUIRE_BASE}X` && SV.enquireLinkFor({ handle: 'X', enquiry_routing: 'bogus' }) === `${SV.ENQUIRE_BASE}X`
    && SV.enquireLinkFor({}) === null,
    '2.9 §7c\u2019s resolver: tdw is today\u2019s link byte for byte; own_number her typed phone or tdw if it is not a phone; own_waba tdw until 2b; unknown tdw');

  sec('3  the connect, against the double and the recording Meta');
  const run = async ({ vendor = vend(), body, seed, cap = ARMED, env = ENV, meta = fakeMeta(), now } = {}) => {
    freshAll(); const Cx = fresh('src/lib/ownNumber/connect.js'); const db = fakeDb(seed);
    const r = await Cx.connect({ vendor, body, supabase: db, env, fetchImpl: meta.f, capApi: cap, now: now || (() => new Date('2026-09-24T10:00:00Z')) });
    return { r, db, calls: meta.calls };
  };
  { const { r, db, calls } = await run({ body: BODY_MOVED });
    const steps = calls.map((c) => `${c.method} ${c.step}`);
    ok(r.ok && r.number.status === 'active' && r.number.way === 'moved' && r.number.display_number === '+91 87577 88550',
      '3.1 moved way: her row is active, moved, with Meta\u2019s display number', JSON.stringify(r));
    ok(JSON.stringify(steps) === JSON.stringify(['GET oauth/access_token', 'GET 524126980791429/phone_numbers', 'POST 524126980791429/subscribed_apps', 'POST 106540352242922/register']),
      '3.2 moved way: the code is exchanged FIRST, then her number, subscribe, register, in Meta\u2019s order', JSON.stringify(steps));
    const reg = calls.find((c) => c.step.endsWith('/register'));
    ok(reg && reg.body.messaging_product === 'whatsapp' && reg.body.pin === M.pinFor('106540352242922', 'app-secret') && reg.auth === 'Bearer BT-her-token',
      '3.3 register carries the derived PIN and HER token');
    ok(db.t.vendor_wabas.length === 1 && !JSON.stringify(db.t).includes('BT-her-token') && !JSON.stringify(db.t).includes(reg.body.pin),
      '3.4 her token and her PIN are written nowhere (FK5, F3)'); }
  { const { r, db, calls } = await run({ body: BODY_SHARED });
    const steps = calls.map((c) => `${c.method} ${c.step}`);
    ok(r.ok && r.number.status === 'active' && r.number.way === 'shared' && db.t.vendor_wabas[0].sync_started_at === '2026-09-24T10:00:00.000Z',
      '3.5 shared way: her row is active with the sync\u2019s start stamped', JSON.stringify(r));
    ok(!steps.some((s) => s.endsWith('/register')) && JSON.stringify(calls.filter((c) => c.step.endsWith('smb_app_data')).map((c) => c.body.sync_type)) === '["smb_app_state_sync","history"]',
      '3.6 shared way: NO register (c-45.28); contacts then history requested, once each (c-45.32)', JSON.stringify(steps)); }
  { const { r, db, calls } = await run({ body: BODY_SHARED, meta: fakeMeta({ expired: true }) });
    ok(!r.ok && r.reason === 'code_expired' && db.t.vendor_wabas.length === 0 && calls.length === 1, '3.7 an expired code answers code_expired, the room\u2019s own line, and writes nothing', JSON.stringify(r)); }
  { const { r, calls } = await run({ body: BODY_SHARED, cap: ON });
    ok(!r.ok && r.reason === 'closed' && calls.length === 0, '3.8 with the switch ON (not armed) the connect is closed and Meta is never called (F2)', JSON.stringify(r)); }
  { const stamps = [];
    for (const iso of ['2026-09-25T00:30:00+05:30', '2027-03-15T12:00:00Z', '2028-02-29T23:59:59+05:30']) { const { db } = await run({ body: BODY_SHARED, now: () => new Date(iso) }); stamps.push(db.t.vendor_wabas[0].sync_started_at === new Date(iso).toISOString()); }
    ok(stamps.every(Boolean), '3.9 the stamp is the injected clock\u2019s, on three shifted instants (next day IST, months ahead, a leap day) (C-44.13)'); }
  { const seed = { vendor_wabas: [{ id: 'x', vendor_id: WALK, business_id: 'b', waba_id: 'w0', phone_number_id: 'p0', display_number: '+91 1', connect_way: 'shared', status: 'active' }] };
    const a = await run({ body: BODY_SHARED, seed });
    const seedOut = { vendor_wabas: [{ ...seed.vendor_wabas[0], status: 'migrated_out' }] };
    const b = await run({ body: BODY_MOVED, seed: seedOut });
    ok(!a.r.ok && a.r.reason === 'already_connected' && a.calls.length === 0 && b.r.ok && b.db.t.vendor_wabas.length === 1 && b.db.t.vendor_wabas[0].waba_id === '524126980791429',
      '3.10 re-connect is refused while connected, before Meta; a moved-out row is replaced, never stacked (F6)'); }
  { const { r, db } = await run({ body: { ...BODY_SHARED, business_id: null } });
    ok(!r.ok && r.reason === 'session_incomplete' && db.t.vendor_wabas.length === 0, '3.11 without her WABA and business from the session nothing is written (declared limit)'); }

  sec('4  the door\u2019s answer');
  { freshAll(); const Dx = fresh('src/lib/ownNumber/door.js');
    const db = fakeDb({ vendor_wabas: [{ vendor_id: OTHER, business_id: 'b', waba_id: 'w', phone_number_id: 'p', display_number: '+91 98882 94440', connect_way: 'shared', status: 'suspended', quality_rating: 'RED' }] });
    const a = await Dx.answer({ vendor: vend(), supabase: db, env: ENV, capApi: ARMED });
    const b = await Dx.answer({ vendor: vend(OTHER), supabase: db, env: ENV, capApi: ARMED });
    const c = await Dx.answer({ vendor: vend(), supabase: fakeDb(), env: ENV, capApi: ON });
    ok(a.open === true && a.launch && a.launch.config_id === '3333333333333333' && a.number === null && a.reason === null,
      '4.1 the walk vendor on an armed switch: open, with the launch', JSON.stringify(a));
    ok(b.open === false && b.launch === null && b.number && b.number.status === 'suspended' && b.number.way === 'shared',
      '4.2 anyone else: shut, and a number on file is still shown with its state (§7b constraint 3)', JSON.stringify(b));
    ok(c.open === false && /2a honours walk mode only/.test(c.reason) && /flag\.own_number\.signature is absent/.test(c.reason),
      '4.3 ON reads shut, and the reason names the master and her tier\u2019s row (FQ3)', c.reason); }

  sec('5  the receiver\u2019s own-number events');
  const pnidMsg = { field: 'messages', value: { metadata: { phone_number_id: '106' }, messages: [{ from: '919888294440', id: 'wamid.1', type: 'text', text: { body: 'hi' } }] } };
  { freshAll(); const Ex = fresh('src/lib/ownNumber/events.js');
    const db = fakeDb({ vendor_wabas: [{ vendor_id: WALK, business_id: 'b', waba_id: 'w', phone_number_id: '106', display_number: '+91 1', connect_way: 'shared', status: 'active' }] });
    const o = { vendor_id: WALK, status: 'active' };
    const r1 = await Ex.handle(db, o, pnidMsg);
    const r2 = await Ex.handle(db, o, { field: 'messages', value: { statuses: [{ id: 'wamid.x', status: 'delivered' }] } });
    const r3 = await Ex.handle(db, o, { field: 'history', value: { history: [{ errors: [{ code: 2593109 }] }] } });
    const r4 = await Ex.handle(db, { ...o, status: 'active' }, { field: 'phone_number_quality_update', value: { event: 'FLAGGED', display_phone_number: '1' } });
    ok(r1.kept && r1.kind === 'inbound' && db.t.vendor_wa_events.filter((e) => e.kind === 'inbound').length === 1 && !r2.kept,
      '5.1 a couple\u2019s message is recorded, not answered; a status with no message is not kept (F4)');
    ok(r3.kept && r3.kind === 'history', '5.2 a declined history is recorded as hers, not raised as a failure');
    ok(r4.kept && db.t.vendor_wabas[0].status === 'suspended' && db.t.vendor_wabas[0].paused_reason === 'quality:FLAGGED',
      '5.3 a quality flag pauses her number, as state (F5, §7b constraint 3)');
    const stale = { vendor_id: WALK, status: 'active', paused_reason: null };
    const r5 = await Ex.handle(db, stale, { field: 'phone_number_quality_update', value: { event: 'UPGRADE' } });
    ok(db.t.vendor_wabas[0].status === 'active' && r5.next && r5.next.status === 'active',
      '5.4 the status is decided on her row as it is NOW, not the map\u2019s stale copy (a stale active would have ignored the recovery)'); }
  { freshAll(); const W = fresh('src/lib/ownNumber/wabaMap.js');
    const db = fakeDb({ vendor_wabas: [{ vendor_id: WALK, business_id: 'b', waba_id: 'w9', phone_number_id: '106', display_number: '+91 1', connect_way: 'shared', status: 'active' }] });
    let t = 1000; const now = () => t;
    const a = await W.lookup(db, { phoneNumberId: '106' }, now); const n1 = db.reads.length;
    const b = await W.lookup(db, { phoneNumberId: '106' }, now); const n2 = db.reads.length;
    const m1 = await W.lookup(db, { phoneNumberId: '555' }, now); const m2 = await W.lookup(db, { phoneNumberId: '555' }, now); const n3 = db.reads.length;
    t += W.CACHE_MS + 1; await W.lookup(db, { phoneNumberId: '106' }, now); const n4 = db.reads.length;
    const byW = await W.lookup(db, { wabaId: 'w9' }, now);
    const broken = await W.lookup({ from() { throw new Error('down'); } }, { phoneNumberId: '777' }, now);
    ok(a && a.vendor_id === WALK && b === a && n2 === n1 && m1 === null && m2 === null && n3 === n2 + 2 && n4 === n3 + 1 && byW && byW.vendor_id === WALK && broken === null,
      '5.5 the map: a found row is served from cache for 60s; a miss is never cached (read-through every time); by PNID or by WABA; a failed read is null', JSON.stringify({ n1, n2, n3, n4 })); }

  sec('6  mutations of production code (each must turn its cell red; restored byte for byte)');
  const mutate = async (rel, from, to, probe) => {
    const src = read(rel); const before = sha(src); const m = src.replace(from, to);
    if (m === src) return { applied: false };
    fs.writeFileSync(P(rel), m);
    let red; try { freshAll(); red = !(await probe()); } catch (_e) { red = true; } finally { fs.writeFileSync(P(rel), src); freshAll(); }
    return { applied: true, red, restored: sha(read(rel)) === before };
  };
  const res = [];
  res.push(['M1 openFor honours ON', await mutate('src/lib/ownNumber/door.js', "if (status === 'armed' && walkVendor && vendorId === walkVendor) return { open: true, reason: null };",
    "if ((status === 'armed' && walkVendor && vendorId === walkVendor) || status === 'on') return { open: true, reason: null };",
    async () => !fresh('src/lib/ownNumber/door.js').openFor({ masterRow: { status: 'on' }, vendorId: OTHER, env: ENV }).open)]);
  res.push(['M2 own traffic forwarded to the vendor lane', await mutate('src/lib/metaInbound.js', "  if (own && own.vendor_id) return 'own';\n", '',
    async () => fresh('src/lib/metaInbound.js').routeChange(null, '106', { vendor_id: WALK }) === 'own')]);
  res.push(['M3 the shared way registers', await mutate('src/lib/ownNumber/connect.js', "if (way === 'moved') {\n      const pin", "if (way === 'moved' || way === 'shared') {\n      const pin",
    async () => { const { calls } = await run({ body: BODY_SHARED }); return !calls.some((c) => c.step.endsWith('/register')); })]);
  res.push(['M4 a quality recovery lifts an account pause', await mutate('src/lib/ownNumber/events.js', " && String(row.paused_reason || '').startsWith('quality:')", '',
    async () => fresh('src/lib/ownNumber/events.js').nextStatus({ status: 'suspended', paused_reason: 'account:ACCOUNT_RESTRICTION' }, 'phone_number_quality_update', { event: 'UPGRADE' }) === null)]);
  res.push(['M5 misses cached', await mutate('src/lib/ownNumber/wabaMap.js', '    if (data) cache.set(key, { at: now(), row: data });', '    cache.set(key, { at: now(), row: data || null });',
    async () => { const W = fresh('src/lib/ownNumber/wabaMap.js'); const db = fakeDb(); await W.lookup(db, { phoneNumberId: '1' }, () => 5); await W.lookup(db, { phoneNumberId: '1' }, () => 5); return db.reads.length === 2; })]);
  res.push(['M6 the way check removed (an unsupported finish would write)', await mutate('src/lib/ownNumber/connect.js', "  const way = wayOf(b.event);\n  if (!way) return refuse('unsupported_finish', TEXT_FAILED);\n  if (!b.waba_id || !b.business_id) return refuse('session_incomplete', TEXT_FAILED);\n", '',
    async () => { const { r } = await run({ body: { ...BODY_SHARED, event: 'FINISH_ONLY_WABA' } }); return !r.ok && r.reason === 'unsupported_finish'; })]);
  for (const [name, r] of res) ok(r.applied && r.red && r.restored, `6 ${name}: applies, turns its cell red, restored by sha`, JSON.stringify(r));

  console.log(`\nb121 · ${pass} pass · ${fail} fail`);
  if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.log(`b121 CRASHED: ${(e && e.stack) || e}`); process.exit(1); });
