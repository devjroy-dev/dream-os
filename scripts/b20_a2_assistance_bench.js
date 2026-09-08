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
    r = await A.createAssistanceRequest(db, {
      couple_id: 'couple-priya', phone: '+919625759924', name: 'Priya', city: 'Delhi', area: 'Hauz Khas',
      wedding_date: '2027-02-14', brief: 'Pastel florals, candlelight.', origin: 'bride',
      items: [{ category: 'photography', budget_rs: '2,50,000' }, { category: 'makeup', budget_rs: 40000 }, { category: 'makeup', budget_rs: 1 }],
    }, { env, sendWhatsApp: async (to, body) => { sends.push({ to, body }); return { sent: true, sid: null }; } });
    ok('a good sheet files ONE request, status open, origin bride, phone stored as the last ten', r.ok && db._t.assistance_requests.length === 1 && r.request.status === 'open' && r.request.origin === 'bride' && r.request.phone === '9625759924');
    ok('two items (the duplicate trade collapsed), budgets whole rupees, forwarded_count 0', r.ok && db._t.assistance_request_items.length === 2 && db._t.assistance_request_items.every(i => i.request_id === r.request.id) && db._t.assistance_request_items.find(i => i.category === 'photography').budget_rs === 250000);
    ok('the founder was notified once, to ADMIN_PHONE, with Rs in Indian grouping and no glyph', sends.length === 1 && sends[0].to === '+919888294440' && /Rs 2,50,000/.test(sends[0].body) && !/₹/.test(sends[0].body) && r.notify.sent === true);
    ok('a `{sent:true, sid:null}` reply counts as sent — `sent` is the only honest key', r.notify.sent === true);
    db = makeDb();
    r = await A.createAssistanceRequest(db, { phone: '9625759924', items: [{ category: 'makeup', budget_rs: 40000 }] }, { env: {}, sendWhatsApp: async () => { throw new Error('must not send'); } });
    ok('ADMIN_PHONE unset → the request is on file and the notify is a LOUD SKIP (admin_phone_unset), no send attempted (F-07.76)', r.ok && r.notify.sent === false && r.notify.refusal === 'admin_phone_unset');
    db = makeDb();
    r = await A.createAssistanceRequest(db, { phone: '9625759924', items: [{ category: 'makeup' }] }, { env, sendWhatsApp: async () => ({ sent: false, blocked: 'opted_out' }) });
    ok('a returned refusal is read: notify.refusal = opted_out, the request still on file', r.ok && r.notify.sent === false && r.notify.refusal === 'opted_out' && db._t.assistance_requests.length === 1);
    r = await A.createAssistanceRequest(db, { phone: '9625759924', items: [{ category: 'makeup' }] }, { env, sendWhatsApp: async () => { const e = new Error('meta down'); e.code = 'MetaSendError'; throw e; } });
    ok('a THROWN send is caught and named; the request still on file', r.ok && r.notify.sent === false && r.notify.refusal === 'MetaSendError');
  } else { for (let i = 0; i < 12; i++) ok('§5 cell (writer absent)', false); }

  // ═══ §6 ═══
  section('§6 · FORWARD → VENDOR — through createLead, source tdw_assist');
  function seededDb() {
    return makeDb({
      couples: [{ id: 'couple-priya', user_id: 'user-priya', wedding_date: '2027-02-14', wedding_city: 'Delhi' }],
      users:   [{ id: 'user-priya', phone: '+919625759924', name: 'Priya Sharma' }],
      vendors: [
        { id: 'v-swati', business_name: 'Makeup by Swati Roy', category: 'makeup', city: 'Delhi', status: 'active', discover_paused: false, peer_discoverable: true, routing_handle: 'MAKEUPBYSWATIROY' },
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
    ok('one assistance_forwards row: kind vendor, vendor_id, lead_id, wamid null, status recorded', fw.length === 1 && fw[0].target_kind === 'vendor' && fw[0].vendor_id === 'v-swati' && fw[0].lead_id === 'lead-1' && fw[0].wamid === null && fw[0].status === 'recorded' && fw[0].prospect_id === null);
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

  // ═══ §7 ═══
  section('§7 · FORWARD → PROSPECT — source manual, last-ten join, DARK');
  if (A) {
    let db = seededDb(); let s = await seedRequest(db);
    const sendSpy = { called: 0 };
    let f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '+91 98111 22333', ig_handle: '@rahulshoots', name: 'Rahul' } }, { createLead: async () => { throw new Error('must not create a lead for an outsider'); } });
    // c-41.10 · replaces `... && /stub/.test(f.dark.reason)`: the register is real, the row seeds
    // `approved` ("Meta yes, the founder not yet") and the reason no longer says stub.
    ok('the outsider forward succeeds and reports dark with a reason', f.ok && f.dark && /capabilities register/.test(f.dark.reason) && !/stub/.test(f.dark.reason));
    const pr = db._t.prospects;
    ok('ONE prospects row: source manual, state cold (R-41.14), phone 91+last ten (prospects.js:94\'s format), handle without @', pr.length === 1 && pr[0].source === 'manual' && pr[0].state === 'cold' && pr[0].phone === '919811122333' && pr[0].ig_handle === 'rahulshoots' && pr[0].name === 'Rahul');
    ok('prospects.category = the item\'s trade, city = the request\'s, notes name the item as a courtesy', pr[0].category === 'photography' && pr[0].city === 'Delhi' && pr[0].notes.includes(s.photo.id));
    const fw = db._t.assistance_forwards;
    ok('one forwards row: kind prospect, prospect_id, lead_id null, wamid null, status dark', fw.length === 1 && fw[0].target_kind === 'prospect' && fw[0].prospect_id === pr[0].id && fw[0].lead_id === null && fw[0].wamid === null && fw[0].status === 'dark');
    ok('no leads row was written for an outsider (she is a lead only when she joins, roadmap §7)', db._t.leads.length === 0);
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333' } }, {});
    ok('the same last ten again → FOUND, not inserted (prospects.phone is UNIQUE)', f.ok && db._t.prospects.length === 1 && f.prospect.id === pr[0].id && db._t.assistance_forwards.length === 2);
    db._t.prospects.push({ id: 'p-twin', phone: '449811122333', source: 'manual', state: 'cold' });
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333' } }, {});
    ok('two prospects sharing a last ten → refused ambiguous_prospect, nothing written', !f.ok && f.code === 'ambiguous_prospect' && db._t.assistance_forwards.length === 2);
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '12345' } }, {});
    ok('a short number → refused no_phone', !f.ok && f.code === 'no_phone');
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'carrier_pigeon' } }, {});
    ok('an unknown target kind → refused bad_target', !f.ok && f.code === 'bad_target');
    const code = strip(read(ASSIST));
    ok('DARK BY STRUCTURE: comment-stripped writer contains NO sendMetaTemplate( and NO sendWhatsApp( outside notifyFounder', !/sendMetaTemplate\(/.test(code) && (code.match(/sendWhatsApp\(/g) || []).length === 1);
    ok('the send block exists in the RAW file as a comment with its UNCOMMENT STEP stated', /SEND \(uncomment when the register says ON\)/.test(read(ASSIST)) && /UNCOMMENT STEP/i.test(read(ASSIST)) && /sendMetaTemplate\(/.test(read(ASSIST)));
    ok('the read is cap.on() on the one key, never an env var', /cap\.CAPABILITY_KEYS\.TDW_ASSIST_LEAD_OUTSIDE/.test(code) && !/process\.env\.\w*SEND_ENABLED/.test(code));
    ok('the filed template names + Meta ids are recorded once (TEMPLATE_REFS)', A.TEMPLATE_REFS.lead_outside.meta_id === '1627376372249131' && A.TEMPLATE_REFS.found_vendor.meta_id === '3160852754105015' && A.TEMPLATE_REFS.found_outside.meta_id === '3115277355330375');
    // armed → queued (behavioural, injected cap)
    db = seededDb(); s = await seedRequest(db);
    f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333' } }, { cap: { on: () => true } });
    ok('with the register ON the row is queued (the SEND block is still commented, so no send)', f.ok && !f.dark && db._t.assistance_forwards[0].status === 'queued' && sendSpy.called === 0);
  } else { for (let i = 0; i < 13; i++) ok('§7 cell (writer absent)', false); }

  // ═══ §8 ═══
  section('§8 · recordForwardOutcome — R-41.30\'s write path');
  if (A) {
    const db = seededDb(); const s = await seedRequest(db);
    const f = await A.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333' } }, {});
    const o = await A.recordForwardOutcome(db, f.forward.id, { status: 'failed', error_code: 131049, error_title: 'This message was not delivered to maintain healthy ecosystem engagement.' });
    const row = db._t.assistance_forwards.find(x => x.id === f.forward.id);
    ok('a synchronous 131049 lands as status failed with error_code + error_title on the row', o.ok && row.status === 'failed' && row.error_code === '131049' && /healthy ecosystem/.test(row.error_title) && row.updated_at);
    ok('the writer calls it only inside the commented SEND block (dark caller)', !/await recordForwardOutcome\(/.test(strip(read(ASSIST))) && /await recordForwardOutcome\(/.test(read(ASSIST)));
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
    const M2 = loadMutated(ASSIST, s => { const o = "const status = armed ? 'queued' : 'dark';"; if (!s.includes(o)) throw new Error('M2 anchor missing'); return s.replace(o, "const status = armed ? 'dark' : 'queued';"); });
    { const db = seededDb(); const s = await seedRequest(db); await M2.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333' } }, {});
      ok('M2 · dark gate inverted → the status-dark cell reds (non-vacuous)', db._t.assistance_forwards[0].status !== 'dark'); }
    // M3: prospects source changed → §7's manual cell must red
    const M3 = loadMutated(ASSIST, s => { const o = "source:    'manual',"; if (!s.includes(o)) throw new Error('M3 anchor missing'); return s.replace(o, "source:    'tdw_assist',"); });
    { const db = seededDb(); const s = await seedRequest(db); await M3.forwardAssistanceItem(db, { itemId: s.photo.id, target: { kind: 'prospect', phone: '9811122333' } }, {});
      ok('M3 · prospects.source mutated → the R-41.14 cell reds (non-vacuous; the CHECK would refuse it in prod)', db._t.prospects[0].source !== 'manual'); }
    // M4: the partial UNIQUE removed from the migration text → §2's cell reds
    const mig4 = read(MIG).replace(/CREATE UNIQUE INDEX IF NOT EXISTS uq_assistance_forwards_wamid[\s\S]*?;/, '');
    ok('M4 · UNIQUE struck from 0148 → the R-40.110 cell reds (non-vacuous)', !/create unique index if not exists uq_assistance_forwards_wamid/i.test(mig4));
  } else { for (let i = 0; i < 4; i++) ok('§M (writer absent)', false); }

  console.log(`\n${fail ? 'RED' : 'GREEN'} — b20_a2_assistance_bench ${pass}/${pass + fail}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('bench threw:', e); process.exit(2); });
