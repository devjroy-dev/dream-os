#!/usr/bin/env node
// scripts/b20_a2_assistance_bench.js — BLOCK 20 · CONCIERGE s1 · packet A2 (CE-41 seat A)
//
// WHAT IT PROVES, and how it stays honest (R-40.94: a cell only sees what it looks
// at; strip comments before textual assertions; mutate PRODUCTION code, never setup):
//   §1  one home — `.from('assistance_` lives in the writer + relayStatus and nowhere else;
//       no third lead writer (the forward calls createLead, it does not INSERT into leads)
//   §2  migration 0148 — new tables only; R-41.15's four arm columns + partial INDEX +
//       partial UNIQUE on wamid; R-41.23 CHECK; R-41.29 couple_id NULL / phone NOT NULL
//   §3  the capabilities stub answers false, and says it is a stub
//   §4  normalizePhone — last ten, every shape a session or a human hands over
//   §5  createAssistanceRequest — refusals by code; the rows; the founder notify reads its result
//   §6  forward → vendor: createLead with source 'tdw_assist' + referrer + the request id in notes;
//       the forwards row; forwarded_count; status open→forwarded; refusals (unavailable, dedupe)
//   §7  forward → prospect: source 'manual' (R-41.14), last-ten find-before-insert,
//       status 'dark' while cap.on() is false, NO send call reachable in stripped code
//   §8  recordForwardOutcome — R-41.30's write path lands 131049 as failed/error_code
//   §9  the receipt router reaches assistance_forwards by wamid (behavioural, stub DB)
//   §10 the doors — concierge.js is a 308 with no GET; both mounts exist; the admin
//       door sits behind requireAdmin; the bride door reads her phone from users, never the body
//   §M  three mutations of production code, each expected to redden a named cell
//
// BOTH WAYS: at the uncured tree (57d12d4) the modules do not exist, so §1–§10 FAIL
// as cells (not a crash) and the bench exits 1. At the cured tree it exits 0.
// Exit codes: 0 green · 1 red (R-40.85).

'use strict';

const path   = require('path');
const fs     = require('fs');
const vm     = require('vm');
const Module = require('module');
const ROOT   = path.resolve(__dirname, '..');
const P      = (rel) => path.join(ROOT, rel);
// Absent file → '' so the uncured tree REDS on cells (rc 1), never ERRORs on a throw (rc 2).
const read   = (rel) => (fs.existsSync(P(rel)) ? fs.readFileSync(P(rel), 'utf8') : '');
const exists = (rel) => fs.existsSync(P(rel));

let pass = 0, fail = 0;
const ok = (label, cond) => { if (cond) { pass++; console.log(`  PASS  ${label}`); } else { fail++; console.log(`  FAIL  ${label}`); } };
const section = (t) => console.log(`\n── ${t} ──`);

// Comment stripper (R-40.105): line comments, block comments, keeps strings.
function strip(src) {
  let out = '', i = 0, n = src.length, q = null;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (q) { out += c; if (c === '\\') { out += d; i += 2; continue; } if (c === q) q = null; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; out += c; i++; continue; }
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

// ── the stub DB ──────────────────────────────────────────────────────────────
function makeDb(seed = {}) {
  const tables = {
    assistance_requests: [], assistance_request_items: [], assistance_forwards: [],
    couples: [], users: [], vendors: [], prospects: [], leads: [], clients: [],
    messages: [], lead_alerts: [], referral_alerts: [], contract_sends: [], ...seed,
  };
  let uid = 0;
  const nextId = (p) => `${p}-${++uid}`;
  const calls = [];
  function from(table) {
    const rows = tables[table] || (tables[table] = []);
    const q = { _f: [], _limit: null };
    const chain = () => q;
    q.select = chain; q.order = chain;
    q.eq   = (c, v) => { q._f.push(r => r[c] === v); return q; };
    q.is   = (c, v) => { q._f.push(r => (r[c] ?? null) === v); return q; };
    q.in   = (c, vs) => { q._f.push(r => vs.includes(r[c])); return q; };
    q.neq  = (c, v) => { q._f.push(r => r[c] !== v); return q; };
    q.like = (c, pat) => { const suf = String(pat).replace(/^%/, ''); q._f.push(r => String(r[c] || '').endsWith(suf)); return q; };
    q.or   = (expr) => {
      const cl = String(expr).split(',').map(x => { const m = x.match(/^([a-z_]+)\.ilike\.\*(.*)\*$/i); return m ? { col: m[1], t: m[2].toLowerCase() } : null; }).filter(Boolean);
      q._f.push(r => cl.some(c => String(r[c.col] ?? '').toLowerCase().includes(c.t))); return q;
    };
    q.limit = (n) => { q._limit = n; return q; };
    const matched = () => { const h = rows.filter(r => q._f.every(f => f(r))); return q._limit ? h.slice(0, q._limit) : h; };
    q.maybeSingle = async () => ({ data: matched()[0] || null, error: null });
    q.single      = async () => ({ data: matched()[0] || null, error: null });
    q.then = (res) => res({ data: matched(), error: null });
    q.insert = (payload) => {
      calls.push({ table, op: 'insert', payload });
      const list = Array.isArray(payload) ? payload : [payload];
      const made = list.map(p => { const row = { id: nextId(table), created_at: new Date().toISOString(), ...p }; rows.push(row); return row; });
      const ins = { select: () => ins, single: async () => ({ data: made[0], error: null }), maybeSingle: async () => ({ data: made[0], error: null }), then: (res) => res({ data: made, error: null }) };
      return ins;
    };
    q.update = (patch) => {
      calls.push({ table, op: 'update', patch });
      const u = { _f: [] };
      u.eq = (c, v) => { u._f.push(r => r[c] === v); return u; };
      u.select = () => u;
      const apply = () => { const h = rows.filter(r => u._f.every(f => f(r))); h.forEach(r => Object.assign(r, patch)); return h; };
      u.single = async () => ({ data: apply()[0] || null, error: null });
      u.maybeSingle = u.single;
      u.then = (res) => res({ data: apply(), error: null });
      return u;
    };
    return q;
  }
  return { from, _t: tables, _calls: calls };
}

// Load a production module with a MUTATED source (R-40.94: the mutation lands on
// production code; the test setup is untouched). Returns the module's exports.
function loadMutated(rel, mutate) {
  const file = P(rel);
  const src = mutate(fs.readFileSync(file, 'utf8'));
  const m = new Module(file, module);
  m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
  m._compile(src, file);
  return m.exports;
}

const ASSIST = 'src/lib/couple/assistance.js';
const CAPS   = 'src/lib/capabilities.js';
const MIG    = 'db/migrations/0148_assistance_requests.sql';
const RELAY  = 'src/lib/vendor/relayStatus.js';
const CONC   = 'src/api/couple/concierge.js';
const BRIDE  = 'src/api/couple/assistance.js';
const ADMIN  = 'src/api/admin/assistance.js';

(async () => {
  // ═══ §1 ═══
  section('§1 · ONE HOME — the plane has one writer, leads keep theirs');
  const srcFiles = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (f.endsWith('.js')) srcFiles.push(f); } })(P('src'));
  const homes = srcFiles.filter(f => /\.from\('assistance_/.test(strip(fs.readFileSync(f, 'utf8')))).map(f => path.relative(ROOT, f)).sort();
  ok('`.from(\'assistance_` appears in exactly two files: the writer and relayStatus', JSON.stringify(homes) === JSON.stringify([ASSIST, RELAY].sort()));
  ok('the writer exists and exports createAssistanceRequest + forwardAssistanceItem once each', exists(ASSIST) && (strip(read(ASSIST)).match(/async function createAssistanceRequest\(/g) || []).length === 1 && (strip(read(ASSIST)).match(/async function forwardAssistanceItem\(/g) || []).length === 1);
  ok('no second createAssistanceRequest / forwardAssistanceItem definition anywhere in src/', srcFiles.filter(f => path.relative(ROOT, f) !== ASSIST && /function (createAssistanceRequest|forwardAssistanceItem)\(/.test(strip(fs.readFileSync(f, 'utf8')))).length === 0);
  ok('the writer never INSERTs into leads — createLead is the sole lead writer', exists(ASSIST) && !/\.from\('leads'\)/.test(strip(read(ASSIST))) && /require\('\.\.\/vendor\/leads'\)/.test(strip(read(ASSIST))));
  ok('the two doors name no assistance_* table', exists(BRIDE) && exists(ADMIN) && !/assistance_(requests|request_items|forwards)/.test(strip(read(BRIDE)) + strip(read(ADMIN))));

  // ═══ §2 ═══
  section('§2 · MIGRATION 0148 — the shape the rulings named');
  const mig = exists(MIG) ? read(MIG) : '';
  const migCode = mig.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
  // c-41.10 · replaces `0148 exists and is the ladder tail + 1` (a cell pinned to the tail
  // reds on the next seat's migration by construction — 0149 landed one packet later).
  // The tail-independent form of the same question: 0148 exists, and 0147 is the number
  // immediately below it on the ladder.
  ok('0148 exists and sits immediately above 0147 on the ladder', exists(MIG) && (() => {
    const nums = fs.readdirSync(P('db/migrations')).filter(f => /^\d{4}/.test(f)).map(f => f.slice(0, 4)).sort();
    return nums[nums.indexOf('0148') - 1] === '0147';
  })());
  ok('new tables only — no ALTER TABLE, no DROP, on any existing table', !/alter\s+table|drop\s+/i.test(migCode));
  const afBlock = (migCode.match(/create table if not exists public\.assistance_forwards\s*\(([\s\S]*?)\);/i) || [])[1] || '';
  ok('assistance_forwards carries wamid + status + updated_at + error_code + error_title (R-41.15)', ['wamid', 'status', 'updated_at', 'error_code', 'error_title'].every(c => new RegExp(`^\\s*${c}\\s`, 'm').test(afBlock)));
  ok('partial INDEX on wamid WHERE wamid IS NOT NULL', /create index if not exists idx_assistance_forwards_wamid[\s\S]*?\(wamid\)\s*where\s+wamid\s+is\s+not\s+null/i.test(migCode));
  ok('partial UNIQUE on wamid WHERE wamid IS NOT NULL (R-40.110)', /create unique index if not exists uq_assistance_forwards_wamid[\s\S]*?\(wamid\)\s*where\s+wamid\s+is\s+not\s+null/i.test(migCode));
  const arBlock = (migCode.match(/create table if not exists public\.assistance_requests\s*\(([\s\S]*?)\);/i) || [])[1] || '';
  ok('assistance_requests.status CHECK is exactly open|forwarded|closed (R-41.23)', /status\s+text[\s\S]*?check\s*\(\s*status\s+in\s*\(\s*'open'\s*,\s*'forwarded'\s*,\s*'closed'\s*\)\s*\)/i.test(arBlock));
  ok('couple_id is NULLable and FKs couples (R-41.29)', /couple_id\s+uuid\s+null\s+references\s+public\.couples\s*\(id\)/i.test(arBlock));
  ok('phone is NOT NULL and constrained to ten digits (R-41.29)', /phone\s+text\s+not null\s+check\s*\(\s*phone\s*~\s*'\^\[0-9\]\{10\}\$'\s*\)/i.test(arBlock));
  ok('every FK names a witnessed parent: couples, vendors, prospects, leads, and the two own tables', ['couples', 'vendors', 'prospects', 'leads', 'assistance_requests', 'assistance_request_items'].every(t => new RegExp(`references\\s+public\\.${t}\\s*\\(id\\)`, 'i').test(migCode)));
  ok('target_kind ↔ target column agreement is a CHECK, not a comment', /constraint assistance_forwards_target_matches check/i.test(migCode));
  ok('OUT_OF_ORDER register untouched (0148 is above the tip, not a filled hole)', JSON.parse(read('db/migrations/OUT_OF_ORDER.json')).register.length === 0);
  const MIG2 = 'db/migrations/0150_assistance_notify_wamid.sql';
  const mig2 = exists(MIG2) ? read(MIG2).split('\n').filter(l => !l.trim().startsWith('--')).join('\n') : '';
  ok('0150 exists: notify_wamid + notify_status + notify_error_code + notify_error_title + notify_sent_at on assistance_requests', ['notify_wamid', 'notify_status', 'notify_error_code', 'notify_error_title', 'notify_sent_at'].every(c => new RegExp(`add column if not exists ${c}\\s`, 'i').test(mig2)));
  ok('0150: partial INDEX + partial UNIQUE on notify_wamid WHERE NOT NULL (R-40.110)', /create index if not exists idx_assistance_requests_notify_wamid[\s\S]*?\(notify_wamid\)\s*where\s+notify_wamid\s+is\s+not\s+null/i.test(mig2) && /create unique index if not exists uq_assistance_requests_notify_wamid[\s\S]*?\(notify_wamid\)\s*where\s+notify_wamid\s+is\s+not\s+null/i.test(mig2));
  ok('0150 touches only assistance_requests (its own 0148 table)', !/alter table public\.(?!assistance_requests)/i.test(mig2) && (mig2.match(/alter table/gi) || []).length === 1);

  // ═══ §3 ═══
  section('§3 · THE CAPABILITIES STUB');
  let cap = null; try { cap = require(P(CAPS)); } catch (e) { cap = null; }
  ok('src/lib/capabilities.js exists and exports on()', !!cap && typeof cap.on === 'function');
  ok('on() answers false for the assist key and for nonsense', !!cap && cap.on('template.tdw_assist_lead_outside') === false && cap.on('anything.else') === false && cap.on() === false);
  // ── c-41.10 · CROSS-SEAT AMENDMENT BY SEAT C (labeled, ratify-or-revert at seat A's next cut) ──
  // Seat C replaced the stub file-for-file (C1, 0149). The two cells below assert the
  // register the stub anticipated; the contract cell above them is untouched.
  // Replaces: `it declares itself a stub (IS_STUB) — seat C replaces file-for-file` (IS_STUB === true).
  ok('it is the register, not the stub (IS_STUB false) — seat C replaced it file-for-file', !!cap && cap.IS_STUB === false);
  // Replaces: `it reads no env and no table` — the register reads ONE table, and still no env.
  ok('it reads no env, and the one table it reads is public.capabilities', !!cap && !/process\.env/.test(strip(read(CAPS))) && /from\(TABLE\)/.test(strip(read(CAPS))) && /const TABLE = 'capabilities'/.test(strip(read(CAPS))));

  // ═══ §4 ═══
  section('§4 · normalizePhone — the one home (R-41.29)');
  let A = null; try { A = require(P(ASSIST)); } catch (e) { A = null; }
  ok('the writer loads', !!A);
  const np = A && A.normalizePhone;
  ok('"+91 96257 59924" → 9625759924', !!np && np('+91 96257 59924') === '9625759924');
  ok('"919625759924" → 9625759924', !!np && np('919625759924') === '9625759924');
  ok('"whatsapp:+919625759924" → 9625759924', !!np && np('whatsapp:+919625759924') === '9625759924');
  ok('"9625759924" → 9625759924', !!np && np('9625759924') === '9625759924');
  ok('nine digits, null, undefined, "" → null', !!np && np('962575992') === null && np(null) === null && np(undefined) === null && np('') === null);

  // ═══ §5 ═══
  section('§5 · createAssistanceRequest — refusals by code, the rows, the founder notify');
  const noSend = { sendWhatsApp: async () => { throw new Error('bench: send must not be called'); }, env: {} };
  if (A) {
    let db = makeDb();
    let r = await A.createAssistanceRequest(db, { phone: 'nope', items: [{ category: 'makeup', budget_rs: 40000 }] }, noSend);
    ok('no ten-digit phone → refused no_phone', !r.ok && r.code === 'no_phone');
    r = await A.createAssistanceRequest(db, { phone: '9625759924', items: [] }, noSend);
    ok('no items → refused no_items', !r.ok && r.code === 'no_items');
    r = await A.createAssistanceRequest(db, { phone: '9625759924', items: [{ category: 'mehendi', budget_rs: 1 }] }, noSend);
    ok('a non-canonical category → refused bad_category (mehendi rides other in s1, R-41.27)', !r.ok && r.code === 'bad_category');
    r = await A.createAssistanceRequest(db, { phone: '9625759924', items: [{ category: 'makeup', budget_rs: 'lots' }] }, noSend);
    ok('a non-numeric budget → refused bad_budget', !r.ok && r.code === 'bad_budget');
    ok('nothing was written by any refusal', db._t.assistance_requests.length === 0 && db._t.assistance_request_items.length === 0);

    db = makeDb();
    let sends = [];
    const env = { ADMIN_PHONE: '+919888294440' };
    // F-41.26 / R-41.63: the notify is now a Utility TEMPLATE through sendWa (the one
    // template-send home). The stub records the call and answers sendWa's success shape.
    const okSend = async (o) => { sends.push(o); return { sent: true, mode: 'template', key: o.templateKey, result: { wamid: 'wamid.NOTIFY1' } }; };
    r = await A.createAssistanceRequest(db, {
      couple_id: 'couple-priya', phone: '+919625759924', name: 'Priya', city: 'Delhi', area: 'Hauz Khas',
      wedding_date: '2027-02-14', brief: 'Pastel florals, candlelight.', origin: 'bride',
      items: [{ category: 'photography', budget_rs: '2,50,000' }, { category: 'makeup', budget_rs: 40000 }, { category: 'makeup', budget_rs: 1 }],
    }, { env, sendWa: okSend });
    ok('a good sheet files ONE request, status open, origin bride, phone stored as the last ten', r.ok && db._t.assistance_requests.length === 1 && r.request.status === 'open' && r.request.origin === 'bride' && r.request.phone === '9625759924');
    ok('two items (the duplicate trade collapsed), budgets whole rupees, forwarded_count 0', r.ok && db._t.assistance_request_items.length === 2 && db._t.assistance_request_items.every(i => i.request_id === r.request.id) && db._t.assistance_request_items.find(i => i.category === 'photography').budget_rs === 250000);
    const call = sends[0];
    ok('the founder was notified ONCE, by TEMPLATE admin_assist_request on the vendor line to ADMIN_PHONE', sends.length === 1 && call.line === 'vendor' && call.to === '+919888294440' && call.templateKey === 'admin_assist_request' && r.notify.sent === true);
    ok('the five vars: name, date in words, city, categories in words, summed budget in Indian grouping with no glyph', call.vars.couple_name === 'Priya' && call.vars.date_words === '14 February 2027' && call.vars.city === 'Delhi' && call.vars.categories_words === 'photography and makeup' && call.vars.budget_rs === '2,90,000' && !/\u20b9/.test(JSON.stringify(call.vars)));
    ok('the wamid lands on the request row: notify_wamid + notify_status=sent + notify_sent_at (R-40.110 home, 0150)', db._t.assistance_requests[0].notify_wamid === 'wamid.NOTIFY1' && db._t.assistance_requests[0].notify_status === 'sent' && !!db._t.assistance_requests[0].notify_sent_at && r.notify.wamid === 'wamid.NOTIFY1');
    ok('the registry carries admin_assist_request as approved, Utility, vendor line, five variables', (() => { const t = require(P('src/lib/templates.js')); const e = t.getTemplate ? t.getTemplate('admin_assist_request') : null; return t.isApproved('admin_assist_request') && e && e.name === 'tdw_admin_assist_request' && e.category === 'UTILITY' && e.line === 'vendor' && e.variables.length === 5; })());
    db = makeDb();
    r = await A.createAssistanceRequest(db, { phone: '9625759924', items: [{ category: 'makeup', budget_rs: 40000 }] }, { env: {}, sendWa: async () => { throw new Error('must not send'); } });
    ok('ADMIN_PHONE unset → the request is on file, notify_status=skipped/admin_phone_unset, no send attempted (F-07.76)', r.ok && r.notify.sent === false && r.notify.refusal === 'admin_phone_unset' && db._t.assistance_requests[0].notify_status === 'skipped' && db._t.assistance_requests[0].notify_error_code === 'admin_phone_unset');
    db = makeDb();
    r = await A.createAssistanceRequest(db, { phone: '9625759924', items: [{ category: 'makeup' }] }, { env, sendWa: async () => { const e = new Error("template 'admin_assist_request' status is 'paused', not 'approved'"); e.name = 'WaTemplateNotApprovedError'; throw e; } });
    ok('a THROWN refusal is caught and NAMED on the row: notify_status=failed, notify_error_code=WaTemplateNotApprovedError; the request still on file', r.ok && r.notify.sent === false && r.notify.refusal === 'WaTemplateNotApprovedError' && db._t.assistance_requests.length === 1 && db._t.assistance_requests[0].notify_status === 'failed' && db._t.assistance_requests[0].notify_error_code === 'WaTemplateNotApprovedError');
    r = await A.createAssistanceRequest(db, { phone: '9625759924', items: [{ category: 'makeup' }] }, { env, sendWa: async () => ({ sent: false }) });
    ok('a `{sent:false}` return (no throw) is read as a refusal, never as sent', r.ok && r.notify.sent === false && r.notify.refusal === 'unknown');
    r = await A.createAssistanceRequest(db, { phone: '9625759924', items: [{ category: 'makeup' }] }, { env, sendWa: async () => ({ sent: true, result: { wamid: null } }) });
    ok('sent but Meta gave no wamid → sent_no_wamid, never a null in the UNIQUE column', r.notify.sent === true && r.notify.wamid === null && db._t.assistance_requests[db._t.assistance_requests.length - 1].notify_status === 'sent_no_wamid');
  } else { for (let i = 0; i < 15; i++) ok('§5 cell (writer absent)', false); }

  // ═══ §6 ═══
  section('§6 · FORWARD → VENDOR — through createLead, source tdw_assist');
  function seededDb() {
    return makeDb({
      couples: [{ id: 'couple-priya', user_id: 'user-priya', wedding_date: '2027-02-14', wedding_city: 'Delhi' }],
      users:   [{ id: 'user-priya', phone: '+919625759924', name: 'Priya Sharma' }, { id: 'user-swati', phone: '+918595356978', name: 'Swati' }],
      vendors: [
        { id: 'v-swati', user_id: 'user-swati', business_name: 'Makeup by Swati Roy', category: 'makeup', city: 'Delhi', status: 'active', discover_paused: false, peer_discoverable: true, routing_handle: 'MAKEUPBYSWATIROY' },
        { id: 'v-paused', business_name: 'Paused Studio', category: 'makeup', city: 'Delhi', status: 'active', discover_paused: true, peer_discoverable: true, routing_handle: 'PAUSED' },
        { id: 'v-hidden', business_name: 'Hidden Studio', category: 'makeup', city: 'Delhi', status: 'active', discover_paused: false, peer_discoverable: false, routing_handle: 'HIDDEN' },
        { id: 'v-gone',   business_name: 'Gone Studio', category: 'makeup', city: 'Delhi', status: 'retired', discover_paused: false, peer_discoverable: true, routing_handle: 'GONE' },
      ],
    });
  }
  async function seedRequest(db) {
    const r = await A.createAssistanceRequest(db, { couple_id: 'couple-priya', phone: '+919625759924', name: 'Priya Sharma', city: 'Delhi', wedding_date: '2027-02-14', brief: 'Pastel florals.', origin: 'bride', items: [{ category: 'makeup', budget_rs: 40000 }, { category: 'photography', budget_rs: 250000 }] }, noSend);
    return { request: r.request, makeup: r.items.find(i => i.category === 'makeup'), photo: r.items.find(i => i.category === 'photography') };
  }
  if (A) {
    let db = seededDb(); let s = await seedRequest(db);
    const leadCalls = [];
    const fakeCreateLead = async (supabase, vendorId, params) => { leadCalls.push({ vendorId, params }); const lead = { id: `lead-${leadCalls.length}`, ...params, vendor_id: vendorId }; db._t.leads.push(lead); return { ok: true, lead, deduped: false }; };
    let f = await A.forwardAssistanceItem(db, { itemId: s.makeup.id, target: { kind: 'vendor', vendor_id: 'v-swati' } }, { createLead: fakeCreateLead });
    ok('the forward succeeds and returns the lead + the vendor', f.ok && f.lead && f.vendor && f.vendor.routing_handle === 'MAKEUPBYSWATIROY');
    const lc = leadCalls[0];
    ok('createLead was called ONCE, for the target vendor', leadCalls.length === 1 && lc.vendorId === 'v-swati');
    ok('source = tdw_assist (one home: TDW_ASSIST_SOURCE)', lc.params.source === 'tdw_assist' && A.TDW_ASSIST_SOURCE === 'tdw_assist');
    ok('referrer_name = The Dream Wedding; raw_message = the brief; notes carries the request id', lc.params.referrer_name === 'The Dream Wedding' && lc.params.raw_message === 'Pastel florals.' && lc.params.notes.includes(s.request.id));
    ok('the lead phone is the couple\'s E.164 from users, not the last ten', lc.params.phone === '+919625759924');
    ok('budget_max = the item\'s budget; wedding_city/date from the request', lc.params.budget_max === 40000 && lc.params.wedding_city === 'Delhi' && lc.params.wedding_date === '2027-02-14');
    const fw = db._t.assistance_forwards;
    // F-41.37: with the flag OFF (0151 seed) the forward row reads `dark`, the vendor is not sent to.
    ok('one assistance_forwards row: kind vendor, vendor_id, lead_id, wamid null, status DARK while flag.assist_forward_alert is off (F-41.37)', fw.length === 1 && fw[0].target_kind === 'vendor' && fw[0].vendor_id === 'v-swati' && fw[0].lead_id === 'lead-1' && fw[0].wamid === null && fw[0].status === 'dark' && fw[0].prospect_id === null && !!f.alert && f.alert.status === 'dark' && /flag\.assist_forward_alert/.test(f.alert.refusal));
    ok('forwarded_count 0 → 1 on the item; the request open → forwarded', db._t.assistance_request_items.find(i => i.id === s.makeup.id).forwarded_count === 1 && db._t.assistance_requests[0].status === 'forwarded');
    for (const [vid, why] of [['v-paused', 'discover_paused'], ['v-hidden', 'peer_discoverable=false'], ['v-gone', 'not active'], ['v-nobody', 'unknown id']]) {
      const before = db._t.assistance_forwards.length;
      const rr = await A.forwardAssistanceItem(db, { itemId: s.makeup.id, target: { kind: 'vendor', vendor_id: vid } }, { createLead: fakeCreateLead });
      ok(`a vendor that is ${why} is refused vendor_unavailable and nothing is written`, !rr.ok && rr.code === 'vendor_unavailable' && db._t.assistance_forwards.length === before && leadCalls.length === 1);
    }
    const dedupeLead = async () => ({ ok: true, lead: { id: 'lead-old' }, deduped: true });
    const before = db._t.assistance_forwards.length;
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'vendor', vendor_id: 'v-swati' } }, { createLead: dedupeLead });
    ok('createLead dedupe → refused peer_already_has; no forwards row (referrals.js:256\'s law)', !f.ok && f.code === 'peer_already_has' && db._t.assistance_forwards.length === before);
    f = await A.forwardAssistanceItem(db, { itemId: 'item-nobody', target: { kind: 'vendor', vendor_id: 'v-swati' } }, { createLead: fakeCreateLead });
    ok('an unknown item → not_found', !f.ok && f.code === 'not_found');
    await A.closeAssistanceRequest(db, s.request.id);
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'vendor', vendor_id: 'v-swati' } }, { createLead: fakeCreateLead });
    ok('a closed request refuses every forward', !f.ok && f.code === 'closed');
    // admin-typed, no couple: the lead phone is +91 + last ten
    db = seededDb();
    const adm = await A.createAssistanceRequest(db, { phone: '98 7654 3210', name: 'Typed Couple', city: 'Jaipur', origin: 'admin', items: [{ category: 'makeup', budget_rs: 30000 }] }, noSend);
    leadCalls.length = 0;
    f = await A.forwardAssistanceItem(db, { itemId: adm.items[0].id, target: { kind: 'vendor', vendor_id: 'v-swati' } }, { createLead: fakeCreateLead });
    ok('admin-typed request (couple_id NULL) forwards with phone +91 + last ten and the typed name', f.ok && leadCalls[0].params.phone === '+919876543210' && leadCalls[0].params.name === 'Typed Couple' && adm.request.couple_id === null && adm.request.origin === 'admin');
  } else { for (let i = 0; i < 15; i++) ok('§6 cell (writer absent)', false); }

  // ═══ §6b · F-41.37 / R-41.68 — the vendor is told, behind the flag ═══
  section('§6b · F-41.37 — alertVendorOfForward: dark off, live on, refusals named');
  if (A) {
    ok('the flag key and template key are one home each and spelled by the register grammar', A.ASSIST_FORWARD_ALERT_FLAG === 'flag.assist_forward_alert' && A.FORWARD_ALERT_TEMPLATE_KEY === 'lead_alert_utility' && /^flag\.[a-z0-9_.]+$/.test(A.ASSIST_FORWARD_ALERT_FLAG));
    ok('0151 seeds flag.assist_forward_alert OFF (a live send to real vendors walks first)', /'flag\.assist_forward_alert',\s*'flag',\s*'off'/.test(read('db/migrations/0151_assist_forward_alert_flag.sql')));
    ok('the registry key it sends is Utility and approved', (() => { const t = require(P('src/lib/templates.js')); const e = t.getTemplate('lead_alert_utility'); return t.isApproved('lead_alert_utility') && e.category === 'UTILITY' && e.line === 'vendor'; })());
    const okLead = async () => ({ ok: true, lead: { id: 'lead-x' }, deduped: false });
    // flag ON → sendWa with the enquiry door's three vars, wamid on the forward row
    let db = seededDb(); let s = await seedRequest(db); let calls = [];
    let f = await A.forwardAssistanceItem(db, { itemId: s.makeup.id, target: { kind: 'vendor', vendor_id: 'v-swati' } },
      { createLead: okLead, cap: { on: (k) => k === 'flag.assist_forward_alert', reason: () => null }, sendWa: async (o) => { calls.push(o); return { sent: true, mode: 'template', result: { wamid: 'wamid.ALERT1' } }; } });
    const c = calls[0] || {};   // absent at the uncured tree → the cells FAIL, never throw
    ok('flag ON → ONE sendWa: vendor line, to the vendor\'s users.phone, template lead_alert_utility', f.ok && calls.length === 1 && c.line === 'vendor' && c.to === '+918595356978' && c.templateKey === 'lead_alert_utility');
    ok('vars = [business name, the wedding month phrase, the vendor Leads URL] — the enquiry door\'s exact shape', Array.isArray(c.vars) && c.vars[0] === 'Makeup by Swati Roy' && /February 2027|2027/.test(c.vars[1]) && c.vars[2] === 'https://thedreamwedding.in/vendor/leads');
    ok('the wamid lands on assistance_forwards.wamid with status sent + sent_at (R-40.110 home, fourth arm)', db._t.assistance_forwards[0].wamid === 'wamid.ALERT1' && db._t.assistance_forwards[0].status === 'sent' && !!db._t.assistance_forwards[0].sent_at && !!f.alert && f.alert.sent === true);
    // flag OFF → dark, reason quoted, no send
    db = seededDb(); s = await seedRequest(db); calls = [];
    f = await A.forwardAssistanceItem(db, { itemId: s.makeup.id, target: { kind: 'vendor', vendor_id: 'v-swati' } },
      { createLead: okLead, cap: { on: () => false, reason: (k) => `${k} is off on the switchboard` }, sendWa: async () => { throw new Error('must not send'); } });
    ok('flag OFF → no send, row dark, the switchboard\'s reason quoted; the lead still exists', f.ok && calls.length === 0 && db._t.assistance_forwards[0].status === 'dark' && !!f.alert && f.alert.refusal === 'flag.assist_forward_alert is off on the switchboard' && db._t.leads.length === 0 && f.lead.id === 'lead-x');
    // flag ON, sendWa throws a named error → failed + code on the row, the lead untouched
    db = seededDb(); s = await seedRequest(db);
    f = await A.forwardAssistanceItem(db, { itemId: s.makeup.id, target: { kind: 'vendor', vendor_id: 'v-swati' } },
      { createLead: okLead, cap: { on: () => true, reason: () => null }, sendWa: async () => { const e = new Error('paused'); e.name = 'WaTemplateNotApprovedError'; throw e; } });
    ok('flag ON, sendWa throws → row failed + error_code WaTemplateNotApprovedError; the forward and lead stand', f.ok && db._t.assistance_forwards[0].status === 'failed' && db._t.assistance_forwards[0].error_code === 'WaTemplateNotApprovedError' && !!f.alert && f.alert.sent === false);
    // vendor without a users.phone → failed/no_vendor_phone, no send
    db = seededDb(); s = await seedRequest(db); db._t.vendors.push({ id: 'v-nophone', user_id: 'user-ghost', business_name: 'Ghost', category: 'makeup', city: 'Delhi', status: 'active', discover_paused: false, peer_discoverable: true, routing_handle: 'GHOST' }); calls = [];
    f = await A.forwardAssistanceItem(db, { itemId: s.makeup.id, target: { kind: 'vendor', vendor_id: 'v-nophone' } },
      { createLead: okLead, cap: { on: () => true, reason: () => null }, sendWa: async (o) => { calls.push(o); return { sent: true, result: { wamid: 'x' } }; } });
    ok('a vendor with no users.phone → failed/no_vendor_phone, nothing sent', f.ok && calls.length === 0 && db._t.assistance_forwards[0].status === 'failed' && db._t.assistance_forwards[0].error_code === 'no_vendor_phone');
    ok('the alert is bound and strict: three `const out = await sendWaFn(`, three `out.sent === true`, no bare await', (() => { const code = strip(read(ASSIST)); return (code.match(/const out = await sendWaFn\(/g) || []).length === 3 && (code.match(/out\.sent === true/g) || []).length === 3 && !/^\s*await sendWaFn\(/m.test(code); })());
  } else { for (let i = 0; i < 9; i++) ok('§6b (writer absent)', false); }

  // ═══ §6c · F-41.43 / R-41.69 — couple_id attached at write by last-ten ═══
  section('§6c · F-41.43 — an admin-typed request for a known phone is hers at write');
  if (A) {
    let db = seededDb();
    let r = await A.createAssistanceRequest(db, { phone: '96257 59924', name: 'Sarah', origin: 'admin', items: [{ category: 'makeup', budget_rs: 1 }] }, noSend);
    ok('admin-typed, phone matches one users.phone by last ten → couple_id attached at write', r.ok && r.request.couple_id === 'couple-priya' && r.request.origin === 'admin');
    r = await A.createAssistanceRequest(db, { phone: '9000000000', origin: 'admin', items: [{ category: 'makeup' }] }, noSend);
    ok('admin-typed, unknown phone → couple_id null (seat D backfills on join)', r.ok && r.request.couple_id === null);
    db._t.users.push({ id: 'user-twin', phone: '+449625759924' });
    r = await A.createAssistanceRequest(db, { phone: '9625759924', origin: 'admin', items: [{ category: 'makeup' }] }, noSend);
    ok('two users share the last ten → attach nothing rather than guess', r.ok && r.request.couple_id === null);
    r = await A.createAssistanceRequest(db, { couple_id: 'couple-explicit', phone: '9625759924', origin: 'bride', items: [{ category: 'makeup' }] }, noSend);
    ok('an explicit couple_id (the bride door\'s session) always wins over the match', r.ok && r.request.couple_id === 'couple-explicit');
    const mine = await A.getLatestAssistanceForCouple(db, 'couple-priya');
    ok('F-41.29 + F-41.43 together: her read now sees the admin-typed request', mine.ok && mine.request && mine.request.id === (await (async () => db._t.assistance_requests.filter(x => x.couple_id === 'couple-priya').slice(-1)[0].id)()));
  } else { for (let i = 0; i < 5; i++) ok('§6c (writer absent)', false); }

  // ═══ §6d · F-41.42 — counts over every request ═══
  section('§6d · F-41.42 — counts are over the whole table, never the filtered page');
  if (A) {
    const db = seededDb();
    for (const st of ['open', 'open', 'forwarded', 'closed']) db._t.assistance_requests.push({ id: `r-${Math.random()}`, phone: '9', status: st, created_at: new Date().toISOString() });
    const only = await A.listAssistanceRequests(db, { status: 'forwarded' });
    ok('filtered to forwarded → the page has 1 row but counts read open 2 · forwarded 1 · closed 1', only.ok && only.requests.length === 1 && only.counts.open === 2 && only.counts.forwarded === 1 && only.counts.closed === 1);
  } else { ok('§6d (writer absent)', false); }

  // ═══ §7 ═══
  section('§7 · FORWARD → PROSPECT — source manual, last-ten join, DARK');
  if (A) {
    let db = seededDb(); let s = await seedRequest(db);
    const sendSpy = { called: 0 };
    // A10: the arm is LIVE in code; the register decides. Key OFF here.
    let f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '+91 98111 22333', ig_handle: '@rahulshoots', name: 'Rahul', consent_text: 'yes please, my number is 9811122333', consent_source: 'instagram_dm', consent_recorded_by: 'admin:test'} },
      { createLead: async () => { throw new Error('must not create a lead for an outsider'); }, cap: { on: () => false, reason: (k) => `${k} is off on the switchboard` }, sendWa: async () => { throw new Error('must not send while off'); } });
    // c-41.10 · replaces `... && /stub/.test(f.dark.reason)`: the register is real, the row seeds
    // `approved` ("Meta yes, the founder not yet") and the reason no longer says stub.
    ok('key OFF → the outsider forward succeeds, is DARK, and quotes the switchboard\'s reason', f.ok && f.dark && f.dark.reason === 'template.tdw_assist_lead_outside_v2 is off on the switchboard');
    const pr = db._t.prospects;
    ok('ONE prospects row: source manual, state cold (R-41.14), phone 91+last ten (prospects.js:94\'s format), handle without @', pr.length === 1 && pr[0].source === 'manual' && pr[0].state === 'cold' && pr[0].phone === '919811122333' && pr[0].ig_handle === 'rahulshoots' && pr[0].name === 'Rahul');
    ok('prospects.category = the item\'s trade, city = the request\'s, notes name the item as a courtesy', pr[0].category === 'photography' && pr[0].city === 'Delhi' && pr[0].notes.includes(s.photo.id));
    const fw = db._t.assistance_forwards;
    ok('one forwards row: kind prospect, prospect_id, lead_id null, wamid null, status dark', fw.length === 1 && fw[0].target_kind === 'prospect' && fw[0].prospect_id === pr[0].id && fw[0].lead_id === null && fw[0].wamid === null && fw[0].status === 'dark');
    ok('no leads row was written for an outsider (she is a lead only when she joins, roadmap §7)', db._t.leads.length === 0);
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333', consent_text: 'yes please, my number is 9811122333', consent_source: 'instagram_dm', consent_recorded_by: 'admin:test'} }, {});
    ok('the same last ten again → FOUND, not inserted (prospects.phone is UNIQUE)', f.ok && db._t.prospects.length === 1 && f.prospect.id === pr[0].id && db._t.assistance_forwards.length === 2);
    db._t.prospects.push({ id: 'p-twin', phone: '449811122333', source: 'manual', state: 'cold' });
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333', consent_text: 'yes please, my number is 9811122333', consent_source: 'instagram_dm', consent_recorded_by: 'admin:test'} }, {});
    ok('two prospects sharing a last ten → refused ambiguous_prospect, nothing written', !f.ok && f.code === 'ambiguous_prospect' && db._t.assistance_forwards.length === 2);
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '12345', consent_text: 'yes please, my number is 12345', consent_source: 'instagram_dm', consent_recorded_by: 'admin:test'} }, {});
    ok('a short number → refused no_phone', !f.ok && f.code === 'no_phone');
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'carrier_pigeon' } }, {});
    ok('an unknown target kind → refused bad_target', !f.ok && f.code === 'bad_target');
    const code = strip(read(ASSIST));
    ok('DARK BY STRUCTURE: comment-stripped writer contains NO sendMetaTemplate( and NO sendWhatsApp(; exactly THREE gated sendWa sites — founder notify (R-41.63), vendor alert (R-41.68), outsider join (R-41.83)', !/sendMetaTemplate\(/.test(code) && !/sendWhatsApp\(/.test(code) && (code.match(/await sendWaFn\(/g) || []).length === 3);
    // RETIRED-BY-RULING (A10/R-41.83): the block is the arm now, not a comment.
    ok('the send is reached only through the register key — no env var, no second path', /capFn\(cap\.CAPABILITY_KEYS\.TDW_ASSIST_LEAD_OUTSIDE\) === true/.test(code) && !/process\.env\.\w*SEND_ENABLED/.test(code) && !/uncomment/i.test(read(ASSIST)));
    ok('the read is cap.on() on the one key, never an env var', /cap\.CAPABILITY_KEYS\.TDW_ASSIST_LEAD_OUTSIDE/.test(code) && !/process\.env\.\w*SEND_ENABLED/.test(code));
    ok('the filed template names + Meta ids are recorded once (TEMPLATE_REFS)', A.TEMPLATE_REFS.lead_outside.meta_id === '2544506315978894' && A.TEMPLATE_REFS.found_vendor.meta_id === '3160852754105015' && A.TEMPLATE_REFS.found_outside.meta_id === '3115277355330375');
    // ═══ A10 · the live arm, key ON ═══
    db = seededDb(); s = await seedRequest(db); const sends = [];
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333', ig_handle: '@rahulshoots', name: 'Rahul', consent_text: 'yes please, my number is 9811122333', consent_source: 'instagram_dm', consent_recorded_by: 'admin:test'} },
      { cap: { on: () => true }, sendWa: async (o) => { sends.push(o); return { sent: true, mode: 'template', result: { wamid: 'wamid.OUT1' } }; } });
    const oc = sends[0] || {};
    ok('key ON → ONE send on the MARKETING line to the prospect number, template assist_lead_outside', f.ok && sends.length === 1 && oc.line === 'marketing' && oc.to === '919811122333' && oc.templateKey === 'assist_lead_outside');
    // c-41.39, THIRD CELL. This asserted the PRE-F-41.63 order — city at {{2}}, the
    // trade at {{3}}, the month at {{4}} — and so held the defect in place as a
    // REQUIREMENT. A sealed cell can encode a bug; this one did, and it is why the
    // garbled send survived a green bench. Meta's order (docs/TEMPLATES.md §2 row 10,
    // the founder's Manager screenshot) is name · month and year · city · trade · budget.
    // F-41.80: the trade is now a BARE NOUN — the body supplies the article
    // ("...to find them a {{4}}"), so 'a photographer' here rendered "a a photographer".
    ok('the PAYLOAD META RECEIVES is in Meta\'s order, the trade a bare noun: name · month and year · city · trade · budget in Indian grouping, no glyph', (() => { const t = require(P('src/lib/templates.js'));
      // c-41.63 / F-41.123: the send site passes an OBJECT now (the builder reads a url
      // button's suffix by name and cannot read it from a list). So this cell no longer
      // reads a positional array — it BUILDS THE PAYLOAD and asserts the order META
      // ACTUALLY RECEIVES, which is the guarantee the label always claimed and the array
      // form only stood in for. It is strictly stronger: a permuted `variables` array
      // now reds HERE, behaviourally, where b64's keyed binding cannot see it.
      const body = t.buildTemplatePayload('assist_lead_outside', oc.vars).components.find(c => c.type === 'body');
      const got = body.parameters.map(x => x.text);
      return JSON.stringify(got) === JSON.stringify(['Rahul', 'February 2027', 'Delhi', 'photographer', '2,50,000']); })() && !/\u20b9/.test(JSON.stringify(oc.vars)));
    ok('NO phone of the couple rides the body (roadmap §7, the standing refusal)', !JSON.stringify(oc.vars || []).includes('9625759924') && !JSON.stringify(oc.vars || []).includes('+91'));
    ok('the wamid lands on assistance_forwards.wamid with status sent + sent_at', db._t.assistance_forwards[0].wamid === 'wamid.OUT1' && db._t.assistance_forwards[0].status === 'sent' && !!db._t.assistance_forwards[0].sent_at && f.alert.sent === true);
    // c-41.61: R-41.118 moved the outsider alert to v2 (Utility, Meta 2544506315978894).
    // These cells named v1's key, category and id. Re-cut to the WITNESSED v2 facts
    // (docs/TEMPLATES.md §2 row 10a), not relaxed: UTILITY is asserted by name, so a
    // silent slide back to MARKETING reds.
    ok('the registry entry is Utility, approved, MARKETING line, five variables; the writer names Meta id', (() => { const t = require(P('src/lib/templates.js')); const e = t.getTemplate('assist_lead_outside'); return t.isApproved('assist_lead_outside') && e.category === 'UTILITY' && e.line === 'marketing' && e.variables.length === 5 && A.TEMPLATE_REFS.lead_outside.meta_id === '2544506315978894'; })());
    db = seededDb(); s = await seedRequest(db);
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333', consent_text: 'yes please, my number is 9811122333', consent_source: 'instagram_dm', consent_recorded_by: 'admin:test'} },
      { cap: { on: () => true }, sendWa: async () => { const e = new Error('This message was not delivered to maintain healthy ecosystem engagement.'); e.body = { error: { code: 131049 } }; throw e; } });
    ok('R-41.30: a synchronous 131049 lands as failed + error_code 131049; the forward still stands', f.ok && db._t.assistance_forwards[0].status === 'failed' && db._t.assistance_forwards[0].error_code === '131049' && /healthy ecosystem/.test(db._t.assistance_forwards[0].error_title || '') && f.alert.sent === false);
    db = seededDb(); s = await seedRequest(db);
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333', consent_text: 'yes please, my number is 9811122333', consent_source: 'instagram_dm', consent_recorded_by: 'admin:test'} },
      { cap: { on: () => true }, sendWa: async () => { const e = new Error('paused'); e.name = 'WaTemplateNotApprovedError'; throw e; } });
    ok('a named sendWa throw lands as failed + its name', db._t.assistance_forwards[0].status === 'failed' && db._t.assistance_forwards[0].error_code === 'WaTemplateNotApprovedError');
    // c-41.39: the `=== 2` call-site COUNT is struck. F-41.61 legitimately removed the
    // success-path call and the count convicted an honest change — F-41.65's class, the
    // second specimen this sprint. The cell now asserts the GRAMMAR its label claims.
    ok('the send is logged in the estate grammar (R-41.90 logWaSend, masked recipient), never a hand-rolled line', /logWaSend\('marketing', \{/.test(code) && !/\[sendWa:template\]/.test(code));
    // c-41.39: this cell asserted the SPELLING of a comment, and the comment went false
    // when F-41.60 landed (marketingIndex now calls applyStatusEvent). R-40.94's class.
    // It now asserts the cured claim, and that the struck sentence is gone.
    ok('the marketing lane receipts are named as ROUTING in-file (F-41.60 landed; the old "marketing does not" sentence is gone)', /RECEIPTS ROUTE[\s\S]{0,400}applyStatusEvent/.test(read(ASSIST)) && !/marketing does not/.test(read(ASSIST)));
  } else { for (let i = 0; i < 13; i++) ok('§7 cell (writer absent)', false); }

  // ═══ §8 ═══
  // ⚠ §7's OUTSIDER FIXTURES GAINED A CONSENT RECORD, AND THAT IS THE CURE
  // CONVICTING THEM. R-41.122 makes her words a PRECONDITION, so a `target` with no
  // `consent_text` is now refused before the switchboard is even read — which is
  // exactly what §7c asserts. The fixtures below supply what a real founder supplies
  // from the queue's paste box, and the number in the words matches the row's phone
  // because limb (a) requires it.

  // ══ §7d · F-41.102 · A REFUSAL IS NOT A SERVER FAULT ═══════════════════════
  // no_consent_record answered 500 because the forward door keeps a hand-written
  // allow-list of caller-at-fault codes and falls everything else to 500. D3a added
  // the code to the WRITER; nothing made this line notice.
  //
  // THE FIRST CUT OF THIS CELL OVER-REACHED and found something better. It asserted
  // every REFUSE code appears in the forward door, and named four that do not —
  // no_items, bad_category, bad_budget, too_many_items. Those are the CREATE door's,
  // and it handles them correctly WITHOUT naming them, because ITS default is 400:
  //     `out.code === 'insert_failed' || out.code === 'items_failed' ? 500 : 400`
  // So the two doors in one file default OPPOSITE WAYS. The create door assumes the
  // caller is at fault unless it knows better; the forward door assumes ITSELF at
  // fault unless it recognises the code. Only the second can turn a policy refusal
  // into a 500, and it did. That asymmetry is the finding, and it is what this cell
  // now asserts — not a list of names, which would rot the same way.
  section('§7d · F-41.102 — the forward door names its refusals, the create door defaults safe');
  {
    const door = strip(read('src/api/admin/assistance.js'));
    ok('§7d: the create door DEFAULTS to 400 — an unrecognised code blames the caller',
       /\? 500\s*:\s*400/.test(door));
    ok('§7d: the forward door still defaults to 500, so every refusal it can return must be NAMED',
       /:\s*500;/.test(door));
    ok('§7d: no_consent_record is named in the caller-at-fault branch, not left to the fallback',
       /REFUSE\.NO_CONSENT_RECORD/.test(door)
       && door.indexOf('REFUSE.NO_CONSENT_RECORD') < door.indexOf(': 500;'));
    // The forward path's own refusals, derived from what forwardAssistanceItem can
    // return rather than from the whole roster — the create-only codes are not its.
    const FORWARD_CODES = ['NOT_FOUND', 'CLOSED', 'VENDOR_UNAVAILABLE', 'ALREADY_HAS', 'BAD_TARGET', 'NO_PHONE', 'NO_CONSENT_RECORD'];
    const missing = FORWARD_CODES.filter((k) => !door.includes(`REFUSE.${k}`));
    ok('§7d: every refusal the forward path can return is named in its status map'
       + (missing.length ? ` — missing: ${missing.join(', ')}` : ''), missing.length === 0);
  }

  // ══ §7c · R-41.122 · THE CONSENT RECORD, ONE CELL PER LIMB ═════════════════
  // Meta Messaging Policy §1 has two limbs and the estate satisfied neither in code
  // until D3a. These are DRIVEN against the real writer's own helper, and for a
  // refusal the assertion is that it wrote NOTHING and named WHICH limb failed.
  section('§7c · R-41.122 — the consent record, one cell per limb');
  // A CELL THAT CANNOT SEE ITS SUBJECT MUST FAIL, NEVER THROW (seat A's close note
  // §6, and its own four specimens). The first cut of this section called
  // A.consentEvidences unguarded and CRASHED the whole bench at an uncured tree —
  // which reports zero failures and no verdict at all, the worst of both. The guard
  // below turns "the helper is absent" into ten named reds, so the both-ways proof
  // reads as a proof instead of a stack trace.
  const hasConsent = !!(A && typeof A.consentEvidences === 'function');
  if (!hasConsent) {
    for (let i = 0; i < 10; i++) {
      ok('§7c cell — src/lib/couple/assistance.js exports no consentEvidences (R-41.122 uncured)', false);
    }
  }
  if (A && hasConsent) {
    const mk = (consent_text) => ({
      id: 'prospects-9', phone: '919876543210', ig_handle: 'x', name: 'X',
      consent_text, consent_source: 'instagram_dm', consent_at: new Date().toISOString(),
      consent_recorded_by: 'admin:test',
    });

    // limb (b) — she consented, or there is no record that she did.
    ok('R-41.122 limb (b): no consent record → refused, and the limb is named',
       (() => { const r = A.consentEvidences(mk(null)); return r.ok === false && r.limb === 'b'; })());
    ok('R-41.122 limb (b): whitespace is not a record', A.consentEvidences(mk('   \n  ')).ok === false);

    // limb (a) — SHE gave the number, which is a different claim from consenting.
    ok('R-41.122 limb (a): a reply without the number is refused, distinctly from (b)',
       (() => { const r = A.consentEvidences(mk('yes please go ahead'));
                return r.ok === false && r.limb === 'a' && /given it herself/.test(r.error); })());
    ok("R-41.122 limb (a): someone else's number in her words does not evidence hers",
       A.consentEvidences(mk('sure, reach me on 9000000001')).ok === false);

    // Satisfied — the estate's join law (R-41.29) applied to prose, not a field.
    ok('R-41.122: her number written plainly evidences both limbs',
       A.consentEvidences(mk('yes, 9876543210')).ok === true);
    ok('R-41.122: +91 and spacing fold to the same ten',
       A.consentEvidences(mk('yes you can message me on +91 98765 43210')).ok === true);
    ok('R-41.122: dashes, brackets and a leading zero all fold',
       A.consentEvidences(mk('my number is (098765)-43210 go ahead')).ok === true);

    // THE PLACEMENT IS THE CLAIM: above the register gate, and writing nothing.
    const src = read(ASSIST);
    const fn  = src.slice(src.indexOf('async function forwardToProspect('));
    ok('R-41.122: the consent gate is read BEFORE the switchboard gate, never after',
       fn.indexOf('consentEvidences(prospect)') < fn.indexOf('const capFn ='));
    ok('R-41.122: a missing record refuses outright — it never writes a dark row',
       /code: REFUSE\.NO_CONSENT_RECORD/.test(fn)
       && fn.indexOf('REFUSE.NO_CONSENT_RECORD') < fn.indexOf('writeForward'));
    ok('R-41.122: NO boolean consent column anywhere — her words are the evidence',
       !/consent_given/.test(src));
  } else if (A) { /* guarded above — the ten reds are already recorded */ }

  section('§8 · recordForwardOutcome — R-41.30\'s write path');
  if (A) {
    const db = seededDb(); const s = await seedRequest(db);
    const f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333', consent_text: 'yes please, my number is 9811122333', consent_source: 'instagram_dm', consent_recorded_by: 'admin:test'} }, {});
    const o = await A.recordForwardOutcome(db, f.forward.id, { status: 'failed', error_code: 131049, error_title: 'This message was not delivered to maintain healthy ecosystem engagement.' });
    const row = db._t.assistance_forwards.find(x => x.id === f.forward.id);
    ok('a synchronous 131049 lands as status failed with error_code + error_title on the row', o.ok && row.status === 'failed' && row.error_code === '131049' && /healthy ecosystem/.test(row.error_title) && row.updated_at);
    ok('recordForwardOutcome has a live caller now — R-41.30 synchronous path', (strip(read(ASSIST)).match(/await recordForwardOutcome\(/g) || []).length === 2);
  } else { ok('§8 (writer absent)', false); ok('§8 (writer absent)', false); }

  // ═══ §9 ═══
  section('§9 · THE RECEIPT ROUTER reaches assistance_forwards by wamid (R-40.110)');
  let relay = null; try { relay = require(P(RELAY)); } catch (e) { relay = null; }
  const relayCode = strip(read(RELAY));
  ok('relayStatus updates assistance_forwards by wamid with status/updated_at/error_code/error_title', /\.from\('assistance_forwards'\)\s*\.update\(\{\s*status:\s*want,\s*updated_at:[\s\S]*?error_code:[\s\S]*?error_title:[\s\S]*?\}\)\s*\.eq\('wamid',\s*wamid\)/.test(relayCode));
  if (relay) {
    const db = makeDb({ assistance_forwards: [{ id: 'af-1', item_id: 'i-1', target_kind: 'prospect', prospect_id: 'p-1', wamid: 'wamid.ASSIST1', status: 'sent' }] });
    const w = await relay.witnessStatusMatch(db, { id: 'wamid.ASSIST1', status: 'delivered' });
    ok('a receipt whose wamid lives only on assistance_forwards is matched there (home=assistance_forward)', w.matched === 1 && w.reason === 'assistance_forward' && db._t.assistance_forwards[0].status === 'delivered');
    const db2 = makeDb({ assistance_forwards: [{ id: 'af-1', wamid: 'wamid.DUP', status: 'sent' }, { id: 'af-2', wamid: 'wamid.DUP', status: 'sent' }] });
    const w2 = await relay.witnessStatusMatch(db2, { id: 'wamid.DUP', status: 'read' });
    ok('two rows on one wamid → the router refuses to speak (sid_not_unique) — the partial UNIQUE makes this unreachable in prod', w2.matched === 2 && w2.reason === 'sid_not_unique');
    const db3 = makeDb();
    const w3 = await relay.witnessStatusMatch(db3, { id: 'wamid.NOBODY', status: 'read' });
    ok('a wamid nobody holds still falls to home=none', w3.matched === 0 && w3.reason === 'no_row_for_sid');
    const failed = await relay.witnessStatusMatch(makeDb({ assistance_forwards: [{ id: 'af-9', wamid: 'wamid.F', status: 'sent' }] }), { id: 'wamid.F', status: 'failed', errors: [{ code: 131049, title: 'healthy ecosystem' }] });
    ok('a failed receipt writes error_code/error_title through the arm', failed.matched === 1 && failed.row.status === 'failed');
    // F-41.26 · the fifth home: assistance_requests by notify_wamid (0150)
    const dbn = makeDb({ assistance_requests: [{ id: 'ar-1', phone: '9625759924', notify_wamid: 'wamid.NOTIFY1', notify_status: 'sent' }] });
    const wn = await relay.witnessStatusMatch(dbn, { id: 'wamid.NOTIFY1', status: 'delivered' });
    ok('a receipt whose wamid is a request\'s notify_wamid is matched there (home=assistance_request_notify)', wn.matched === 1 && wn.reason === 'assistance_request_notify' && dbn._t.assistance_requests[0].notify_status === 'delivered');
    const wf = await relay.witnessStatusMatch(makeDb({ assistance_requests: [{ id: 'ar-2', notify_wamid: 'wamid.N2', notify_status: 'sent' }] }), { id: 'wamid.N2', status: 'failed', errors: [{ code: 131047, title: 'Re-engagement message' }] });
    ok('a failed notify receipt lands notify_status=failed with notify_error_code 131047 — the very refusal the founder saw', wf.matched === 1 && wf.row.notify_status === 'failed');
  } else { for (let i = 0; i < 4; i++) ok('§9 (relayStatus absent)', false); }

  // ═══ §10 ═══
  section('§10 · THE DOORS');
  const conc = strip(read(CONC));
  ok('concierge.js: POST /request is a 308 whose Location is the new door', /router\.post\('\/request'/.test(conc) && /status\(308\)/.test(conc) && /'\/api\/v2\/couple\/assistance'/.test(conc));
  ok('concierge.js: GET /requests is gone; no admin_activity_log; no adminSession; no ADMIN_PHONE', !/router\.get\(/.test(conc) && !/admin_activity_log|adminSession|ADMIN_PHONE|sendWhatsApp/.test(conc));
  const core = strip(read('src/api/couple/core.js'));
  ok('core.js mounts /assistance under requireCoupleAuth (the couple mount is above it)', /router\.use\('\/assistance',\s*require\('\.\/assistance'\)\)/.test(core) && core.indexOf('router.use(requireCoupleAuth)') < core.indexOf("router.use('/assistance'"));
  const rt = strip(read('src/api/router.js'));
  ok('router.js mounts /admin/assistance', /router\.use\('\/admin\/assistance',\s*require\('\.\/admin\/assistance'\)\)/.test(rt));
  const adminDoor = strip(read(ADMIN));
  ok('the admin door sits behind requireAdmin for every route', /router\.use\(requireAdmin\)/.test(adminDoor) && /require\('\.\/requireAdmin'\)/.test(adminDoor));
  ok('the admin door declares /vendors before /:id so the literal wins', adminDoor.indexOf("router.get('/vendors'") < adminDoor.indexOf("router.get('/:id'"));
  const brideDoor = strip(read(BRIDE));
  ok('the bride door reads her phone from users by session user_id and hands the writer user.phone, never body.phone', /\.from\('users'\)/.test(brideDoor) && /phone:\s*user\.phone/.test(brideDoor) && !/body\.phone/.test(brideDoor));
  ok('the bride door writes nothing to couples (R-41.25)', !/\.from\('couples'\)[\s\S]{0,200}\.(update|insert|upsert)\(/.test(brideDoor));
  ok('F-41.29: the bride door has GET / reading the writer\'s getLatestAssistanceForCouple by the session couple_id', /router\.get\('\/'/.test(brideDoor) && /getLatestAssistanceForCouple\(req\.app\.locals\.supabase, req\.coupleUser\.couple_id\)/.test(brideDoor));
  if (A) {
    const dbr = seededDb(); const sr = await seedRequest(dbr);
    await A.forwardAssistanceItem(dbr, { itemId: sr.makeup.id, target: { kind: 'vendor', vendor_id: 'v-swati' } }, { createLead: async () => ({ ok: true, lead: { id: 'l1' }, deduped: false }) });
    await A.forwardAssistanceItem(dbr, { itemId: sr.photo.id, target: { kind: 'prospect', phone: '9811122333', consent_text: 'yes please, my number is 9811122333', consent_source: 'instagram_dm', consent_recorded_by: 'admin:test'} }, {});
    const mine = await A.getLatestAssistanceForCouple(dbr, 'couple-priya');
    const mk = mine.items.find(i => i.category === 'makeup'), ph = mine.items.find(i => i.category === 'photography');
    ok('F-41.29: her read names the TDW vendor found (name + /v/ code) and counts outsiders unnamed — no queue, no wamid, no lead id', mine.ok && mine.request.id === sr.request.id && mk.found.length === 1 && mk.found[0].routing_handle === 'MAKEUPBYSWATIROY' && ph.found.length === 0 && ph.outsiders_asked === 1 && !('forwards' in ph) && !JSON.stringify(mine).includes('wamid') && !JSON.stringify(mine).includes('lead_id'));
    const none = await A.getLatestAssistanceForCouple(dbr, 'couple-nobody');
    ok('F-41.29: a couple with no request reads request:null', none.ok && none.request === null && none.items.length === 0);
  }
  ok('the s2 public door is fully commented with its uncomment step stated (conditional-withheld)', !/publicRouter/.test(brideDoor) && /publicRouter/.test(read(BRIDE)) && /UNCOMMENT STEP/.test(read(BRIDE)));
  ok('no persona name in any string of the two doors or the writer', !/Victor|Donna|Harvey|Mira\b|Eliza|Meridian/.test(brideDoor + adminDoor + strip(read(ASSIST))));
  ok('the 0142 witness for peer_discoverable is named in the writer (R-41.9 regen owed)', /peer_discoverable[\s\S]{0,120}0142/.test(read(ASSIST)));

  // ═══ §M ═══
  section('§M · MUTATIONS — production code, each expected to REDDEN a named cell');
  if (A) {
    // M1: the lead source literal moves → §6's source cell must red
    const M1 = loadMutated(ASSIST, s => { const o = "const TDW_ASSIST_SOURCE = 'tdw_assist';"; if (!s.includes(o)) throw new Error('M1 anchor missing'); return s.replace(o, "const TDW_ASSIST_SOURCE = 'whatsapp';"); });
    { const db = seededDb(); const s = await seedRequest(db); const calls = []; await M1.forwardAssistanceItem(db, { itemId: s.makeup.id, target: { kind: 'vendor', vendor_id: 'v-swati' } }, { createLead: async (sb, v, p) => { calls.push(p); return { ok: true, lead: { id: 'l' }, deduped: false }; } });
      ok('M1 · source literal mutated → the tdw_assist cell reds (non-vacuous)', calls[0].source !== 'tdw_assist'); }
    // M2: the dark gate inverted → §7's dark cell must red
    // Absent anchor at the uncured tree → the cell FAILS, never throws.
    const M2 = (() => { try { return loadMutated(ASSIST, s => { const o = "status: armed ? 'queued' : 'dark',"; if (!s.includes(o)) throw new Error('M2 anchor missing'); return s.replace(o, "status: armed ? 'dark' : 'queued',"); }); } catch { return null; } })();
    if (M2) { const db = seededDb(); const s = await seedRequest(db); await M2.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333', consent_text: 'yes please, my number is 9811122333', consent_source: 'instagram_dm', consent_recorded_by: 'admin:test'} }, { cap: { on: () => false, reason: () => 'off' } });
      ok('M2 · dark gate inverted → the status-dark cell reds (non-vacuous)', db._t.assistance_forwards[0].status !== 'dark'); } else ok('M2 · anchor present to mutate', false);
    // M3: prospects source changed → §7's manual cell must red
    const M3 = loadMutated(ASSIST, s => { const o = "source:    'manual',"; if (!s.includes(o)) throw new Error('M3 anchor missing'); return s.replace(o, "source:    'tdw_assist',"); });
    { const db = seededDb(); const s = await seedRequest(db); await M3.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333', consent_text: 'yes please, my number is 9811122333', consent_source: 'instagram_dm', consent_recorded_by: 'admin:test'} }, {});
      ok('M3 · prospects.source mutated → the R-41.14 cell reds (non-vacuous; the CHECK would refuse it in prod)', db._t.prospects[0].source !== 'manual'); }
    // M4: the partial UNIQUE removed from the migration text → §2's cell reds
    const mig4 = read(MIG).replace(/CREATE UNIQUE INDEX IF NOT EXISTS uq_assistance_forwards_wamid[\s\S]*?;/, '');
    ok('M4 · UNIQUE struck from 0148 → the R-40.110 cell reds (non-vacuous)', !/create unique index if not exists uq_assistance_forwards_wamid/i.test(mig4));
    // M5: the flag gate inverted → a forward with the flag OFF would SEND (§6b's dark cell reds)
    // At the uncured tree the anchor is absent: the mutation cell FAILS (nothing to mutate), never throws.
    const M5 = (() => { try { return loadMutated(ASSIST, s => { const o = "if (capFn(ASSIST_FORWARD_ALERT_FLAG) !== true) {"; if (!s.includes(o)) throw new Error('M5 anchor missing'); return s.replace(o, "if (capFn(ASSIST_FORWARD_ALERT_FLAG) === true) {"); }); } catch { return null; } })();
    if (M5) { const db = seededDb(); const s = await seedRequest(db); const calls = [];
      await M5.forwardAssistanceItem(db, { itemId: s.makeup.id, target: { kind: 'vendor', vendor_id: 'v-swati' } }, { createLead: async () => ({ ok: true, lead: { id: 'l' }, deduped: false }), cap: { on: () => false, reason: () => 'off' }, sendWa: async (o) => { calls.push(o); return { sent: true, result: { wamid: 'w' } }; } });
      ok('M5 · flag gate inverted → the flag-OFF forward SENDS (the dark cell reds; non-vacuous)', calls.length === 1); } else ok('M5 · anchor present to mutate', false);
  } else { for (let i = 0; i < 4; i++) ok('§M (writer absent)', false); }

  console.log(`\n${fail ? 'RED' : 'GREEN'} — b20_a2_assistance_bench ${pass}/${pass + fail}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('bench threw:', e); process.exit(2); });
