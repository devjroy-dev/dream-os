#!/usr/bin/env node
'use strict';
// scripts/b75_broadcasts_bench.js — G4.3 · BROADCASTS (CE-42 4b-2), seat R6.
//
// NUMBERED b75, DERIVED ACROSS BOTH REPOS (b69's rule): dream-os holds b73 (4b-1),
// dreamos-pwa b74 (4b-1/4b-2's room). First free rung: 75. The chair may re-allocate.
//
// Every cell drives PRODUCTION source (src/lib/vendor/broadcasts.js, the posts
// doors, prospects.js, relayStatus.js). The supabase double answers the PostgREST
// chains those files build, over real row shapes (PUBLIC_SCHEMA.md @0154 for the
// read tables; 0164 for the two new ones), and RECORDS EVERY WRITE by table — which
// is how "a dark attempt writes nothing" and "a broadcast STOP never writes
// prospects" are asserted rather than argued. No network: sendWa is injected.
// Both ways: each cell's red is proven by mutating production source (manifest in
// the handover).

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const ROOT = path.resolve(__dirname, '..');

let PASS = 0; const FAILS = [];
async function cell(name, fn) {
  try { await fn(); PASS++; console.log(`  GREEN  ${name}`); }
  catch (e) { FAILS.push(name); console.log(`  RED    ${name}\n         ${e && e.message}`); }
}
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

// ── the double ─────────────────────────────────────────────────────────────────
function makeDb(tables) {
  const db = JSON.parse(JSON.stringify(tables));
  db.__writes = [];
  db.__failInsert = null;
  let seq = 0;
  function q(name) {
    let rows = null; let op = 'select'; let payload = null; const filters = [];
    let orderBy = null; let lim = null; let single = false;
    const apply = () => {
      let r = (db[name] || []).slice();
      for (const f of filters) r = r.filter(f);
      if (orderBy) r.sort((a, b) => (a[orderBy.col] < b[orderBy.col] ? 1 : -1) * (orderBy.asc ? -1 : 1));
      if (lim != null) r = r.slice(0, lim);
      return r;
    };
    const api = {
      select() { return api; },
      eq(c, v) { filters.push((r) => r[c] === v); return api; },
      is(c, v) { filters.push((r) => (v === null ? r[c] == null : r[c] === v)); return api; },
      not(c, op2, v) { filters.push((r) => (v === null ? r[c] != null : r[c] !== v)); return api; },
      in(c, vs) { filters.push((r) => vs.includes(r[c])); return api; },
      gte(c, v) { filters.push((r) => String(r[c]) >= String(v)); return api; },
      like(c, pat) { const suf = String(pat).replace(/^%/, ''); filters.push((r) => typeof r[c] === 'string' && r[c].endsWith(suf)); return api; },
      order(c, o) { orderBy = { col: c, asc: !o || o.ascending !== false }; return api; },
      limit(n) { lim = n; return api; },
      insert(p) { op = 'insert'; payload = p; return api; },
      update(p) { op = 'update'; payload = p; return api; },
      single() { single = true; return api; },
      maybeSingle() { single = true; return api; },
      then(resolve) {
        if (op === 'insert') {
          if (db.__failInsert && db.__failInsert.table === name) { const e = db.__failInsert.error; db.__failInsert = null; return resolve({ data: null, error: e }); }
          const row = Object.assign({ id: `${name}-${++seq}`, created_at: new Date().toISOString() }, payload);
          (db[name] = db[name] || []).push(row);
          db.__writes.push({ table: name, op, row });
          return resolve({ data: single ? row : [row], error: null });
        }
        if (op === 'update') {
          const hit = apply();
          for (const r of hit) Object.assign(r, payload);
          db.__writes.push({ table: name, op, patch: payload, n: hit.length });
          return resolve({ data: hit, error: null });
        }
        const r = apply();
        return resolve({ data: single ? (r[0] || null) : r, error: null });
      },
    };
    return api;
  }
  return Object.assign(db, { from: q });
}

const V = { id: 'v-dev440', business_name: 'Dev Roy Photography', routing_handle: 'DEV440', category: 'photography' };
const OTHER = 'v-other';
function tables(over = {}) {
  return Object.assign({
    // S4/S5's shape (2026-09-10): three clients with a phone (the test couple among them),
    // wedding pages with couple/consent phones, a lead in state `new` (NOT booked).
    clients: [
      { vendor_id: V.id, name: 'Slide Test 1', phone: '+919625759924', deleted_at: null },
      { vendor_id: V.id, name: 'Anita', phone: '9811100001', deleted_at: null },
      { vendor_id: V.id, name: 'Deleted', phone: '9811100009', deleted_at: '2026-09-01T00:00:00Z' },
      { vendor_id: OTHER, name: 'Not hers', phone: '9811100077', deleted_at: null },
    ],
    weddings: [
      { owner_vendor_id: V.id, couple_id: 'c1', consent_phone: '+91 96257 59924' },  // same last ten as Slide Test 1
      { owner_vendor_id: V.id, couple_id: null, consent_phone: '9811100002' },
    ],
    couples: [{ id: 'c1', user_id: 'u1' }],
    users: [{ id: 'u1', phone: '9811100003', name: 'Riya' }],
    leads: [
      { vendor_id: V.id, name: 'Sarah', phone: '9625759924', state: 'new', deleted_at: null },
      { vendor_id: V.id, name: 'Booked B', phone: '9811100004', state: 'booked', deleted_at: null },
    ],
    admin_config: [
      { key: 'meta.marketing_paise_ex_gst', value: '86.31' },
      { key: 'meta.gst_percent', value: '18' },
    ],
    broadcasts: [],
    broadcast_recipients: [],
    prospects: [],
  }, over);
}
const capOn = (onKeys) => ({ on: (k) => onKeys.includes(k), reason: (k) => `${k} is approved on the switchboard` });

(async () => {
  const bc = require(path.join(ROOT, 'src/lib/vendor/broadcasts.js'));
  const cap = require(path.join(ROOT, 'src/lib/capabilities.js'));
  const COUPLE = cap.CAPABILITY_KEYS.COUPLE_BROADCAST, REFERRAL = cap.CAPABILITY_KEYS.REFERRAL_BROADCAST;

  console.log('§1 · THE LIST (ruled: four sources, last-ten de-dup, source carried, first source wins)');
  await cell('1.1 five distinct couples from four sources; the test couple ONCE; the deleted client, the other vendor and the `new` lead out', async () => {
    const list = await bc.pastCouples(makeDb(tables()), V.id);
    const tens = list.map((c) => c.lastTen).sort();
    assert.deepStrictEqual(tens, ['9625759924', '9811100001', '9811100002', '9811100003', '9811100004']);
    const tc = list.find((c) => c.lastTen === '9625759924');
    assert.deepStrictEqual([tc.source, tc.name], ['client', 'Slide Test 1']);
    assert.strictEqual(list.find((c) => c.lastTen === '9811100003').source, 'wedding_couple');
    assert.strictEqual(list.find((c) => c.lastTen === '9811100002').source, 'wedding_consent');
    assert.strictEqual(list.find((c) => c.lastTen === '9811100004').source, 'booked_lead');
  });
  await cell('1.2 the preview: count, a name or the last four, fee 5 × 86.31 × 1.18 → 510 paise, registry bodies, button, page url', async () => {
    const pv = await bc.preview(makeDb(tables()), V, { cap: capOn([COUPLE]) });
    assert.strictEqual(pv.count, 5);
    assert.strictEqual(pv.fee_paise, 510);
    assert.ok(pv.couples.every((c) => /^\d{4}$/.test(c.last4) && !('phone' in c) && !('lastTen' in c)), 'a full number reached the wire');
    assert.ok(pv.bodies.couple.startsWith('Hi, this is Dev Roy Photography. It was lovely'));
    assert.strictEqual(pv.button_label, 'See my work');
    assert.ok(/\/v\/DEV440$/.test(pv.page_url));
    assert.deepStrictEqual(pv.on, { couple: true, referral: false });
  });

  console.log('§2 · THE FEE (ruling 10: upper bound, GST in, whole paise, never a float)');
  await cell('2.1 1 → 102 (the chair\'s Rs 1.02) · 6 → 612 · 0 → 0 · an unreadable config → null', async () => {
    assert.deepStrictEqual([1, 6, 0].map((n) => bc.feePaise(n, '86.31', '18')), [102, 612, 0]);
    assert.strictEqual(bc.feePaise(1, 'eighty', '18'), null);
    assert.strictEqual(bc.feePaise(1, '86.31', ''), null);
  });

  console.log('§3 · DARK WRITES NOTHING (4b-2: the gate is read before any write)');
  await cell('3.1 couple template off → code dark, ZERO writes, no send attempted', async () => {
    const db = makeDb(tables()); let calls = 0;
    const out = await bc.sendBroadcast(db, { vendor: V, kind: 'couple' }, { cap: capOn([]), sendWa: async () => { calls++; } });
    assert.deepStrictEqual([out.ok, out.code, db.__writes.length, calls], [false, 'dark', 0, 0]);
  });

  console.log('§4 · THE SEND (marketing line · vars as an OBJECT · stopped numbers FILED, never dropped)');
  await cell('4.1 one broadcasts row + a recipient per number; wamid recorded; a failure recorded; the stopped number filed refused_stopped and NOT sent', async () => {
    const t = tables();
    t.broadcast_recipients.push({ id: 'old-1', vendor_id: V.id, phone: '+919811100001', status: 'delivered', stopped_at: '2026-09-09T00:00:00Z' });
    const db = makeDb(t); const seen = [];
    const sendWa = async (o) => { seen.push(o); if (o.to.endsWith('9811100004')) return { sent: false, error_code: '131049', error_title: 'healthy ecosystem' }; return { sent: true, result: { wamid: `wamid.${o.to.slice(-4)}` } }; };
    const out = await bc.sendBroadcast(db, { vendor: V, kind: 'couple' }, { cap: capOn([COUPLE]), sendWa });
    assert.strictEqual(out.ok, true);
    assert.deepStrictEqual([out.sent, out.not_delivered, out.refused_stopped], [3, 1, 1]);
    const b = db.broadcasts; assert.strictEqual(b.length, 1); assert.deepStrictEqual([b[0].kind, b[0].template_name, b[0].recipient_count], ['couple', 'tdw_couple_broadcast', 4]);
    const rs = db.broadcast_recipients.filter((r) => r.broadcast_id === b[0].id);
    assert.strictEqual(rs.length, 5);
    assert.strictEqual(rs.find((r) => r.phone.endsWith('9811100001')).status, 'refused_stopped');
    assert.ok(!seen.some((o) => o.to.endsWith('9811100001')), 'a stopped number was SENT');
    const f = rs.find((r) => r.phone.endsWith('9811100004')); assert.deepStrictEqual([f.status, f.error_code], ['failed', '131049']);
    assert.strictEqual(rs.find((r) => r.phone.endsWith('9625759924')).wamid, 'wamid.9924');
    for (const o of seen) {
      assert.strictEqual(o.line, 'marketing'); assert.strictEqual(o.templateKey, 'couple_broadcast');
      assert.ok(!Array.isArray(o.vars) && o.vars.vendor_name === 'Dev Roy Photography' && o.vars.page_code === 'DEV440', 'vars not the named object');
      assert.ok(/^\+91\d{10}$/.test(o.to), `not E.164: ${o.to}`);
    }
  });
  await cell('4.2 referral already sent this IST year → already_this_year, and nothing written', async () => {
    const t = tables(); t.broadcasts.push({ id: 'b0', vendor_id: V.id, kind: 'referral', created_at: new Date().toISOString() });
    const db = makeDb(t);
    const out = await bc.sendBroadcast(db, { vendor: V, kind: 'referral' }, { cap: capOn([REFERRAL]), sendWa: async () => ({ sent: true, result: {} }) });
    assert.deepStrictEqual([out.code, db.__writes.length], ['already_this_year', 0]);
    assert.strictEqual(await bc.referralNext(db, V.id), `${bc.istYear() + 1}-01-01`);
  });
  await cell('4.3 the database\'s once-a-year (23505 on the IST-year index) reads as already_this_year', async () => {
    const db = makeDb(tables()); db.__failInsert = { table: 'broadcasts', error: { code: '23505', message: 'duplicate key value violates unique constraint "uq_broadcasts_referral_year"' } };
    const out = await bc.sendBroadcast(db, { vendor: V, kind: 'referral' }, { cap: capOn([REFERRAL]), sendWa: async () => ({ sent: true, result: {} }) });
    assert.strictEqual(out.code, 'already_this_year');
  });

  console.log('§5 · THE INBOUND ARM (F-42.171 + ruling (b); J1-IN r2\'s shape)');
  const inTables = () => tables({ broadcast_recipients: [
    { id: 'r-old', vendor_id: V.id, phone: '+919625759924', status: 'delivered', stopped_at: null, reply_text: null, created_at: '2026-09-01T00:00:00Z' },
    { id: 'r-new', vendor_id: V.id, phone: '+919625759924', status: 'read', stopped_at: null, reply_text: null, created_at: '2026-09-10T00:00:00Z' },
    { id: 'r-q',   vendor_id: V.id, phone: '+919625759924', status: 'queued', stopped_at: null, reply_text: null, created_at: '2026-09-11T00:00:00Z' },
  ] });
  await cell('5.1 the match is the most recent row that REACHED her (a queued row never matches)', async () => {
    const row = await bc.matchInboundBroadcast(makeDb(inTables()), '919625759924');
    assert.strictEqual(row && row.id, 'r-new');
  });
  await cell('5.2 STOP → stopped_at on her rows for THIS vendor; never falls through; NOT ONE write to prospects', async () => {
    const db = makeDb(inTables());
    const row = await bc.matchInboundBroadcast(db, '919625759924');
    const v = await bc.applyBroadcastInbound(db, { row, text: 'STOP', isStop: true, prospect: { state: 'in_session' } });
    assert.deepStrictEqual([v.action, v.fallThrough], ['broadcast_stopped', false]);
    assert.ok(db.broadcast_recipients.filter((r) => r.vendor_id === V.id).every((r) => r.stopped_at), 'a row of hers kept stopped_at null');
    assert.ok(!db.__writes.some((w) => w.table === 'prospects'), 'a broadcast STOP wrote prospects');
  });
  await cell('5.3 any other text → recorded ON THE ROW (replied_at, reply_text APPENDED); falls through only for a live Closer conversation', async () => {
    const db = makeDb(inTables());
    let row = await bc.matchInboundBroadcast(db, '919625759924');
    const a = await bc.applyBroadcastInbound(db, { row, text: 'Thank you! Please call me', isStop: false, prospect: null });
    row = await bc.matchInboundBroadcast(db, '919625759924');
    const b = await bc.applyBroadcastInbound(db, { row, text: 'second note', isStop: false, prospect: { state: 'replied' } });
    const r = db.broadcast_recipients.find((x) => x.id === 'r-new');
    assert.strictEqual(r.reply_text, 'Thank you! Please call me\nsecond note');
    assert.ok(r.replied_at);
    assert.deepStrictEqual([a.fallThrough, b.fallThrough], [false, true]);
    assert.ok(!db.__writes.some((w) => w.table === 'prospects' || w.table === 'leads'), 'a reply minted a prospect or a lead');
  });

  console.log('§6 · THE HOOKS (read against the SHIPPED source, comments stripped)');
  const pros = strip(fs.readFileSync(path.join(ROOT, 'src/lib/prospects.js'), 'utf8'));
  await cell('6.1 prospects.js: the broadcast branch sits AFTER the introduction branch and ABOVE the STOP arm, gated on !introMatched', async () => {
    const iIntro = pros.indexOf('matchInboundIntroduction('), iBc = pros.indexOf('matchInboundBroadcast('), iStop = pros.indexOf('if (isStopWord(text)) {');
    assert.ok(iIntro > -1 && iBc > iIntro && iStop > iBc, `order intro=${iIntro} broadcast=${iBc} stop=${iStop}`);
    assert.ok(/if \(!introMatched\) \{\s*const bcMod = require\('\.\/vendor\/broadcasts'\)/.test(pros), 'not gated on !introMatched');
  });
  await cell('6.2 prospects.js: the consent guard refuses a broadcast-matched reply (F-42.127\'s class)', async () => {
    assert.ok(/!introMatched && !broadcastMatched && !prospect\.consent_text/.test(pros));
  });
  await cell('6.3 sendWa\'s global refusal reads PROSPECTS only — so a broadcast STOP can never reach it', async () => {
    const sw = strip(fs.readFileSync(path.join(ROOT, 'src/lib/sendWa.js'), 'utf8'));
    assert.ok(/\.from\('prospects'\)[\s\S]{0,200}\.eq\('state', 'opted_out'\)/.test(sw), 'the refusal no longer reads prospects');
    assert.ok(!/broadcast_recipients/.test(sw), 'sendWa reads broadcast_recipients');
  });
  await cell('6.4 relayStatus.js: the ninth home updates broadcast_recipients BY WAMID, after introductions, before home=none', async () => {
    const rs = strip(fs.readFileSync(path.join(ROOT, 'src/lib/vendor/relayStatus.js'), 'utf8'));
    const iIntro = rs.indexOf(".from('introductions')"), iBc = rs.indexOf(".from('broadcast_recipients')"), iNone = rs.indexOf("'home=none'");
    assert.ok(iIntro > -1 && iBc > iIntro && iNone > iBc, `order ${iIntro}/${iBc}/${iNone}`);
    assert.ok(/\.from\('broadcast_recipients'\)[\s\S]{0,300}\.eq\('wamid', wamid\)/.test(rs));
  });

  console.log('§7 · THE DOORS (express, auth asserted on the SHIPPED source)');
  const express = require('express');
  const appFor = (db, capDouble) => {
    const app = express(); app.use(express.json());
    app.use((req, _res, next) => { req.app.locals.supabase = db; req.vendor = V; next(); });
    for (const m of ['src/api/vendor/posts.js', 'src/api/middleware/requireAuth.js', 'src/api/middleware/resolveVendor.js', 'src/lib/vendor/broadcasts.js']) delete require.cache[require.resolve(path.join(ROOT, m))];
    require.cache[require.resolve(path.join(ROOT, 'src/api/middleware/requireAuth.js'))] = { exports: (_q, _s, n) => n() };
    require.cache[require.resolve(path.join(ROOT, 'src/api/middleware/resolveVendor.js'))] = { exports: () => (_q, _s, n) => n() };
    const capMod = require(path.join(ROOT, 'src/lib/capabilities.js'));
    const saved = { on: capMod.on, reason: capMod.reason };
    capMod.on = capDouble.on; capMod.reason = capDouble.reason;
    app.use('/posts', require(path.join(ROOT, 'src/api/vendor/posts.js')));
    app.__restore = () => { capMod.on = saved.on; capMod.reason = saved.reason; };
    return app;
  };
  const call = (app, method, url, body) => new Promise((resolve) => {
    const srv = http.createServer(app).listen(0, () => {
      const req = http.request({ port: srv.address().port, path: url, method, headers: { 'content-type': 'application/json' } }, (r) => {
        let b = ''; r.on('data', (c) => { b += c; });
        r.on('end', () => { srv.close(); let j; try { j = JSON.parse(b || '{}'); } catch { j = { _nonjson: b.slice(0, 200) }; } resolve({ status: r.statusCode, body: j }); });
      });
      req.end(body ? JSON.stringify(body) : undefined);
    });
  });
  await cell('7.1 POST dark → 503 code `dark`, and the body carries NO switchboard key (F-42.193)', async () => {
    const app = appFor(makeDb(tables()), capOn([]));
    const r = await call(app, 'POST', '/posts/broadcast', { kind: 'couple' }); app.__restore();
    assert.deepStrictEqual([r.status, r.body.code], [503, 'dark']);
    assert.ok(!/template\.|switchboard/.test(JSON.stringify(r.body)), `a key reached the wire: ${JSON.stringify(r.body)}`);
  });
  await cell('7.2 GET /broadcast answers the preview in the estate envelope', async () => {
    const app = appFor(makeDb(tables()), capOn([COUPLE]));
    const r = await call(app, 'GET', '/posts/broadcast'); app.__restore();
    assert.deepStrictEqual([r.status, r.body.ok, r.body.count, r.body.fee_paise], [200, true, 5, 510]);
  });
  await cell('7.3 every door guarded — asserted on the shipped file (the harness stubs auth); AMENDED BY LABEL at 4b-3b (R-41.121): the count pair must match and never shrink below 4b-2\'s three', async () => {
    const code = strip(fs.readFileSync(path.join(ROOT, 'src/api/vendor/posts.js'), 'utf8'));
    const routes = (code.match(/router\.(get|post)\(/g) || []).length;
    const guards = (code.match(/requireAuth, resolveVendor\(\)/g) || []).length;
    assert.ok(routes >= 3, `${routes} doors`);
    assert.strictEqual(routes, guards, `${routes} doors, ${guards} guards`);
  });

  console.log('§8 · THE PLANE AND THE REGISTRY');
  await cell('8.1 0164 carries stopped_at, replied_at, reply_text, the partial UNIQUE on wamid and the IST-year referral index; 0163 the three config rows', async () => {
    const m = fs.readFileSync(path.join(ROOT, 'db/migrations/0164_broadcasts.sql'), 'utf8');
    for (const re of [/stopped_at\s+timestamptz/, /replied_at\s+timestamptz/, /reply_text\s+text/, /uq_broadcast_recipients_wamid[\s\S]*where wamid is not null/, /at time zone 'Asia\/Kolkata'[\s\S]*where kind = 'referral'/, /'refused_stopped'/]) assert.ok(re.test(m), `0164 lacks ${re}`);
    const c = fs.readFileSync(path.join(ROOT, 'db/migrations/0163_broadcast_fee_and_probe_config.sql'), 'utf8');
    for (const k of ["'meta.marketing_paise_ex_gst', '86.31'", "'meta.gst_percent',            '18'", "'ig_probe_vendor',             'DEV440'"]) assert.ok(c.includes(k), `0163 lacks ${k}`);
  });
  await cell('8.2 the registry: both broadcasts on the marketing line, one variable, the page_code button; the gates are CAPABILITY_KEYS', async () => {
    const { TEMPLATES } = require(path.join(ROOT, 'src/lib/templates.js'));
    for (const k of ['couple_broadcast', 'referral_broadcast']) {
      const t = TEMPLATES[k];
      assert.deepStrictEqual([t.line, t.category, t.variables.join(','), t.button.variable], ['marketing', 'MARKETING', 'vendor_name', 'page_code'], k);
    }
    assert.deepStrictEqual([COUPLE, REFERRAL], ['template.tdw_couple_broadcast', 'template.tdw_referral_broadcast']);
  });

  console.log(`\nb75 · ${PASS} GREEN · ${FAILS.length} RED${FAILS.length ? ' — ' + FAILS.join(' | ') : ''}`);
  process.exit(FAILS.length === 0 ? 0 : 1);
})().catch((e) => { console.log('ERROR ' + (e && e.stack)); process.exit(1); });
