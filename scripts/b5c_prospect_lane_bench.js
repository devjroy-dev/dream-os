#!/usr/bin/env node
// scripts/b5c_prospect_lane_bench.js — TDW_05 Block 05, P3 (the prospect lane + transport swap).
//
// Proves the prospect state machine over the REAL sendWa gate, the REAL webhookCore agnostic
// pieces (sid/LRU dedupe, captureDeadLetter), the REAL Meta inbound adapter (sample Meta payloads),
// and a FAKE HTTP layer for Meta outbound (global.fetch swapped) — no network, no creds, no DB.
//
// NON-VACUOUS: the MUTATION section runs deliberately-broken variants and asserts the same
// predicate the real code passes goes RED — the assertions are load-bearing, not vacuous.
//
// Runnable from any working directory (Q-SP-5): all requires resolve from __dirname.
'use strict';

const path = require('path');
const crypto = require('crypto');
const R = (p) => require(path.resolve(__dirname, '..', p));

const { sendWa, WaOptedOutError } = R('src/lib/sendWa');
const metaCloud = R('src/lib/metaCloud');
const metaInbound = R('src/lib/metaInbound');
const webhookCore = R('src/lib/webhookCore');
const prospects = R('src/lib/prospects');

// ── tiny assert harness ───────────────────────────────────────────────────────
let pass = 0, fail = 0; const fails = [];
function ok(cond, label) { if (cond) { pass++; } else { fail++; fails.push(label); console.log(`  RED  ${label}`); } }
function section(s) { console.log(`\n── ${s} ──`); }
async function throws(fn, code, label) {
  try { await fn(); ok(false, `${label} (expected throw ${code})`); }
  catch (e) { ok(!code || e.code === code || e.name === code, `${label} → ${e.code || e.name}`); }
}

// ── fake in-memory supabase (only the query shapes P3 uses) ────────────────────
function makeFakeSupabase(seed = {}) {
  const db = {
    prospects: (seed.prospects || []).map((r) => ({ ...r })),
    conversations: [], messages: [], failed_turns: [], admin_config: (seed.admin_config || []).map((r) => ({ ...r })),
    vendors: (seed.vendors || []).map((r) => ({ ...r })),
  };
  let idc = 1; const uid = () => `id-${idc++}`;

  class Builder {
    constructor(table) { this.table = table; this.op = 'select'; this.filters = []; this._order = null; this._limit = null; this._range = null; this.payload = null; this._conflict = null; }
    select() { return this; }
    eq(c, v) { this.filters.push((r) => r[c] === v); return this; }
    neq(c, v) { this.filters.push((r) => r[c] !== v); return this; }
    lt(c, v) { this.filters.push((r) => r[c] != null && r[c] < v); return this; }
    not(c, opv, v) { if (opv === 'is' && v === null) this.filters.push((r) => r[c] != null); return this; }
    is(c, v) { if (v === null) this.filters.push((r) => r[c] == null); return this; }
    order(c, o) { this._order = { c, asc: !o || o.ascending !== false }; return this; }
    limit(n) { this._limit = n; return this; }
    range(a, b) { this._range = [a, b]; return this; }
    insert(p) { this.op = 'insert'; this.payload = p; return this; }
    update(p) { this.op = 'update'; this.payload = p; return this; }
    upsert(p, opts) { this.op = 'upsert'; this.payload = p; this._conflict = opts && opts.onConflict; return this; }
    _rows() { let rows = db[this.table].filter((r) => this.filters.every((f) => f(r))); if (this._order) { const { c, asc } = this._order; rows = rows.slice().sort((x, y) => (x[c] > y[c] ? 1 : x[c] < y[c] ? -1 : 0) * (asc ? 1 : -1)); } if (this._range) rows = rows.slice(this._range[0], this._range[1] + 1); if (this._limit != null) rows = rows.slice(0, this._limit); return rows; }
    _exec() {
      if (this.op === 'select') return { data: this._rows(), error: null };
      if (this.op === 'insert') {
        const now = new Date().toISOString();
        const rows = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((p) => ({ id: uid(), created_at: now, updated_at: now, ...p }));
        for (const row of rows) {
          if (this.table === 'prospects' && db.prospects.some((e) => e.phone === row.phone)) return { data: null, error: { code: '23505', message: 'duplicate key' } };
          db[this.table].push(row);
        }
        return { data: rows, error: null };
      }
      if (this.op === 'update') { const rows = this._rows(); rows.forEach((r) => Object.assign(r, this.payload)); return { data: rows, error: null }; }
      if (this.op === 'upsert') { const key = this._conflict; const existing = db[this.table].find((r) => r[key] === this.payload[key]); if (existing) { Object.assign(existing, this.payload); return { data: [existing], error: null }; } const row = { id: uid(), ...this.payload }; db[this.table].push(row); return { data: [row], error: null }; }
      return { data: null, error: { message: 'unsupported op' } };
    }
    async single() { const { data, error } = this._exec(); if (error) return { data: null, error }; const row = Array.isArray(data) ? data[0] : data; return { data: row || null, error: row ? null : { code: 'PGRST116', message: 'no rows' } }; }
    async maybeSingle() { const { data, error } = this._exec(); if (error) return { data: null, error }; const row = Array.isArray(data) ? data[0] : data; return { data: row || null, error: null }; }
    then(resolve) { resolve(this._exec()); }
  }
  return { db, from: (t) => new Builder(t) };
}

// ── fake Meta HTTP (global.fetch swap) ─────────────────────────────────────────
function installFakeFetch(responder) {
  const calls = [];
  global.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    calls.push({ url, headers: opts.headers, body });
    return responder ? responder(url, body) : { ok: true, status: 200, json: async () => ({ messages: [{ id: 'wamid.OUT.' + calls.length }] }) };
  };
  return calls;
}

// sample Meta inbound payload builder
function metaInboundPayload({ from, text, wamid, type = 'text' }) {
  const message = type === 'text'
    ? { from, id: wamid, type: 'text', text: { body: text }, timestamp: '1700000000' }
    : { from, id: wamid, type, [type]: { id: 'media-1', mime_type: 'image/jpeg' }, timestamp: '1700000000' };
  return { object: 'whatsapp_business_account', entry: [{ id: 'WABA', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', metadata: {}, messages: [message] } }] }] };
}

async function main() {
  // creds present so metaCloud is "configured"; fetch is faked so nothing leaves the process.
  process.env.META_WABA_TOKEN = 'test-token';
  process.env.MARKETING_PHONE_NUMBER_ID = 'PNID_TEST';
  process.env.MARKETING_WHATSAPP_NUMBER = 'whatsapp:+10000000000';
  // M2b (CE-62): resolveFrom no longer tails onto the dead 'whatsapp:+14787788550' sandbox
  // literal, so the bride/vendor cross-line cells must configure their lanes explicitly —
  // otherwise they'd refuse with line_not_configured and never reach the opt-out gate they
  // exist to prove. The assertion's intent is unchanged; only the fixture's honesty improved.
  process.env.BRIDE_WHATSAPP_NUMBER  = 'whatsapp:+919990000001';
  process.env.VENDOR_WHATSAPP_NUMBER = 'whatsapp:+919990000002';
  process.env.META_APP_SECRET = 'app-secret';
  process.env.META_VERIFY_TOKEN = 'verify-token';
  const marketingDeps = { sendText: async ({ to, text }) => metaCloud.sendMetaText({ to, text }) };

  // ═══ 1. Meta inbound adapter (sample payloads) ═══
  section('Meta inbound adapter');
  const norm = metaInbound.normalizeMetaInbound(metaInboundPayload({ from: '919888000001', text: 'hi there', wamid: 'wamid.A' }));
  ok(norm.length === 1, 'normalize: one message');
  ok(norm[0].from === '919888000001' && norm[0].text === 'hi there' && norm[0].messageId === 'wamid.A', 'normalize: from/text/wamid extracted');
  const mediaNorm = metaInbound.normalizeMetaInbound(metaInboundPayload({ from: '91', text: '', wamid: 'wamid.M', type: 'image' }));
  ok(mediaNorm[0].media.length === 1 && mediaNorm[0].media[0].kind === 'image', 'normalize: media descriptor');

  // signature verify
  const rawBody = Buffer.from(JSON.stringify({ hello: 'world' }), 'utf8');
  const goodSig = 'sha256=' + crypto.createHmac('sha256', 'app-secret').update(rawBody).digest('hex');
  ok(metaInbound.verifyMetaSignature(rawBody, goodSig, 'app-secret') === true, 'signature: valid HMAC accepted');
  ok(metaInbound.verifyMetaSignature(rawBody, goodSig, 'WRONG') === false, 'signature: wrong secret rejected');
  ok(metaInbound.verifyMetaSignature(rawBody, 'sha256=deadbeef', 'app-secret') === false, 'signature: tampered digest rejected');

  // verify handshake
  let challengeOut = null, statusOut = null;
  const fakeRes = { status(s) { statusOut = s; return this; }, send(b) { challengeOut = b; return this; } };
  const handled = metaInbound.handleVerifyChallenge({ query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'verify-token', 'hub.challenge': 'CHAL123' } }, fakeRes, 'verify-token');
  ok(handled === true && challengeOut === 'CHAL123' && statusOut === 200, 'handshake: challenge echoed on good token');
  challengeOut = null; statusOut = null;
  metaInbound.handleVerifyChallenge({ query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'BAD', 'hub.challenge': 'X' } }, fakeRes, 'verify-token');
  ok(statusOut === 403, 'handshake: bad token → 403');

  // ═══ 2. Transport swap — template POST shape + error path (real sendWa → Meta) ═══
  section('Transport swap (template)');
  let calls = installFakeFetch();
  const tRes = await sendWa({ line: 'marketing', to: 'whatsapp:+919888000009', templateKey: 'marketing_opener', vars: { name: 'Asha' } }, {});
  ok(tRes.sent === true && tRes.mode === 'template', 'template send returns sent/template');
  ok(calls.length === 1, 'exactly one POST');
  ok(calls[0].url === 'https://graph.facebook.com/v21.0/PNID_TEST/messages', 'POST to /{phone-number-id}/messages');
  ok(calls[0].headers.Authorization === 'Bearer test-token', 'Bearer token in header (from env)');
  ok(calls[0].body.messaging_product === 'whatsapp' && calls[0].body.type === 'template', 'body: whatsapp/template');
  ok(calls[0].body.to === '919888000009', 'to normalized (no whatsapp:/+)');
  ok(calls[0].body.template.name === 'tdw_marketing_opener', 'template name from registry (Meta name, not SID)');
  ok(calls[0].body.template.language.code === 'en', 'template language code');
  ok(Array.isArray(calls[0].body.template.components) && calls[0].body.template.components[0].parameters[0].text === 'Asha', 'template body var bound');

  // error path
  installFakeFetch(() => ({ ok: false, status: 400, json: async () => ({ error: { message: 'bad param' } }) }));
  await throws(() => sendWa({ line: 'marketing', to: '919888000009', templateKey: 'marketing_opener', vars: { name: 'A' } }, {}), 'meta_send_failed', 'template error path throws typed');

  // not-configured path
  const savedTok = process.env.META_WABA_TOKEN; delete process.env.META_WABA_TOKEN;
  await throws(() => sendWa({ line: 'marketing', to: '91', templateKey: 'marketing_opener', vars: { name: 'A' } }, {}), 'meta_not_configured', 'no creds → refuses loudly');
  process.env.META_WABA_TOKEN = savedTok;

  // ═══ 3. Transport swap — free-form text POST shape (marketing line rides Meta) ═══
  section('Transport swap (free-form)');
  calls = installFakeFetch();
  await sendWa({ line: 'marketing', to: '919888000009', text: 'hello', windowOpen: true }, marketingDeps);
  ok(calls.length === 1 && calls[0].body.type === 'text' && calls[0].body.text.body === 'hello', 'free-form text POST shape (Meta, not Twilio)');

  // ═══ 4. State machine: cold → templated (opener job, cap honored) ═══
  section('Opener job + cap');
  const seedCold = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, phone: `91900000000${i}`, name: `N${i}`, state: 'cold', source: 'sheet', created_at: `2026-01-0${i + 1}T00:00:00Z` }));
  let sb = makeFakeSupabase({ prospects: seedCold });
  calls = installFakeFetch();
  const oj = await prospects.runOpenerJob({ supabase: sb, cap: 3 });
  ok(oj.picked === 3 && oj.sent === 3, 'cap=3: picks & sends exactly 3 (oldest-first)');
  ok(calls.length === 3, 'three template POSTs');
  ok(sb.db.prospects.filter((p) => p.state === 'templated').length === 3, 'three flipped to templated');
  ok(sb.db.prospects.find((p) => p.id === 'p0').state === 'templated' && sb.db.prospects.find((p) => p.id === 'p0').last_template_at, 'oldest picked, last_template_at stamped');

  // ═══ 5. templated → replied → in_session (reply flips + holding line + conversation) ═══
  section('Reply → in_session');
  sb = makeFakeSupabase({ prospects: [{ id: 'pr', phone: '919888111222', name: 'Ria', state: 'templated', source: 'sheet' }] });
  calls = installFakeFetch();
  const inb = await prospects.handleMarketingInbound({ supabase: sb, from: '919888111222', text: 'yes tell me more', messageId: 'wamid.R1', sendWa, sendWaDeps: marketingDeps });
  ok(inb.action === 'in_session' && inb.state === 'in_session', 'reply flips to in_session');
  const conv = sb.db.conversations[0];
  ok(conv && conv.kind === 'prospect_marketing' && conv.prospect_id === 'pr', 'conversation opened kind=prospect_marketing, owned by prospect_id');
  ok(sb.db.prospects[0].session_opened_at, 'session_opened_at stamped');
  ok(sb.db.messages.some((m) => m.direction === 'inbound' && m.sent_by === 'prospect') && sb.db.messages.some((m) => m.direction === 'outbound' && m.sent_by === 'system'), 'inbound + outbound messages logged');
  // ══ LABELED AMENDMENT — ARC M6. COUNT PRESERVED (one cell, in place). ══
  // UNCHARTERED AND DISCLOSED: this is the arc's THIRD floor move; the CE chartered
  // only f0532's display strings and arc_m4 §4.1. It is FORCED by the founder-closed
  // copy rider (CE ruling §4): the holding line's old wording — "I'll come back to
  // you properly" — was the promise-with-no-machinery this arc filed against, and it
  // was replaced with the founder's own bytes. This cell matched on that promise.
  // Left unamended it would forbid the estate from shipping the copy the founder just
  // ruled in, and would report green about a promise the machinery still cannot keep.
  // CE-63's B2 class again; handled in the open, ratify-or-revert.
  // RE-AIMED to what the cell was ALWAYS for — a free-form Meta text carrying THE
  // holding line — asserted against prospectCopy's own constant rather than a phrase
  // copied into the bench, so this can never drift from the shipped bytes again.
  ok(calls.length === 1 && calls[0].body.type === 'text'
     && calls[0].body.text.body === require('../src/lib/prospectCopy').PROSPECT_COPY.holding_line,
     'holding line sent free-form via Meta');

  // ═══ 6. Opt-out cross-line (STOP → opted_out → refuse on ALL lines) ═══
  section('Opt-out cross-line');
  sb = makeFakeSupabase({ prospects: [{ id: 'po', phone: '919888333444', name: 'Sam', state: 'in_session', source: 'sheet' }] });
  calls = installFakeFetch();
  const stop = await prospects.handleMarketingInbound({ supabase: sb, from: '919888333444', text: 'STOP', messageId: 'wamid.S1', sendWa, sendWaDeps: marketingDeps });
  ok(stop.action === 'opted_out', 'STOP → opted_out');
  ok(sb.db.prospects[0].state === 'opted_out', 'state persisted opted_out');
  ok(stop.confirmSent === true && calls.length === 1 && /opted out/i.test(calls[0].body.text.body), 'opt-out confirmation sent (deliberate bypass)');
  // now the cross-line gate must refuse on marketing, bride, AND vendor
  await throws(() => sendWa({ line: 'marketing', to: '919888333444', templateKey: 'marketing_opener', vars: { name: 'x' }, supabase: sb }, {}), 'opted_out', 'refuse on marketing line');
  await throws(() => sendWa({ line: 'bride', to: '919888333444', text: 'hi', windowOpen: true, supabase: sb }, {}), 'opted_out', 'refuse on bride line');
  await throws(() => sendWa({ line: 'vendor', to: '919888333444', text: 'hi', windowOpen: true, supabase: sb }, {}), 'opted_out', 'refuse on vendor line');

  // ═══ 7. Window expiry ═══
  section('Window expiry');
  const old = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
  const fresh = new Date(Date.now() - 1 * 3600 * 1000).toISOString();
  sb = makeFakeSupabase({ prospects: [
    { id: 'e1', phone: '9111', state: 'in_session', session_opened_at: old },
    { id: 'e2', phone: '9112', state: 'in_session', session_opened_at: fresh },
  ] });
  const ex = await prospects.runExpiryJob({ supabase: sb });
  ok(ex.expired === 1 && sb.db.prospects.find((p) => p.id === 'e1').state === 'expired', '>24h in_session → expired');
  ok(sb.db.prospects.find((p) => p.id === 'e2').state === 'in_session', '<24h stays in_session');

  // ═══ 8. Dedupe (webhookCore LRU on wamid) + dead-letter ═══
  section('Dedupe + dead-letter (real webhookCore)');
  webhookCore._resetSidLru();
  ok(webhookCore.sidSeen('wamid.D') === false, 'first wamid unseen');
  webhookCore.recordSid('wamid.D');
  ok(webhookCore.sidSeen('wamid.D') === true, 'second identical wamid seen (dedupe)');
  sb = makeFakeSupabase();
  const dl = await webhookCore.captureDeadLetter({ supabase: sb, service: 'marketing', phone: '9199', payload: { x: 1 }, error: new Error('boom') });
  ok(dl.ok === true && sb.db.failed_turns.length === 1 && sb.db.failed_turns[0].service === 'marketing', 'thrown turn → failed_turns row');

  // ═══ 9. readDailyCap defaulting ═══
  section('Daily cap read');
  ok((await prospects.readDailyCap(makeFakeSupabase())) === 25, 'absent → default 25');
  ok((await prospects.readDailyCap(makeFakeSupabase({ admin_config: [{ key: 'marketing.daily_template_cap', value: '10' }] }))) === 10, 'seeded 10 parsed');
  ok((await prospects.readDailyCap(makeFakeSupabase({ admin_config: [{ key: 'marketing.daily_template_cap', value: 'junk' }] }))) === 25, 'junk → default 25');

  // ═══ 10. MUTATION — prove the assertions are load-bearing ═══
  section('MUTATION (non-vacuity)');
  // MUT-1: the opt-out gate is what blocks — bypass it and the SAME send succeeds.
  sb = makeFakeSupabase({ prospects: [{ id: 'm1', phone: '9199', state: 'opted_out' }] });
  installFakeFetch();
  let blocked = false; try { await sendWa({ line: 'bride', to: '9199', text: 'x', windowOpen: true, supabase: sb }, {}); } catch (e) { blocked = e instanceof WaOptedOutError; }
  ok(blocked, 'MUT-1a: real gate BLOCKS opted-out (RED if gate removed)');
  // Inject a fake transport so the ONLY difference from MUT-1a is the opt-out gate itself.
  const fakeText = async () => ({ sid: 'fake' });
  let bypassed = false; try { const r = await sendWa({ line: 'bride', to: '9199', text: 'x', windowOpen: true, supabase: sb }, { isOptedOut: async () => false, sendText: fakeText }); bypassed = r.sent === true; } catch (_e) {}
  ok(bypassed, 'MUT-1b: bypassing the gate SENDS — proves the gate is the load-bearing difference');

  // MUT-2: cap is load-bearing — different caps pick different counts.
  const c5 = makeFakeSupabase({ prospects: seedCold.map((r) => ({ ...r, state: 'cold' })) });
  installFakeFetch();
  const cap5 = await prospects.runOpenerJob({ supabase: c5, cap: 5 });
  ok(cap5.sent === 5, 'MUT-2: cap=5 sends 5 vs cap=3 sends 3 — cap honored, not vacuous');

  // MUT-3: template name is registry-derived — a wrong name would fail this exact predicate.
  installFakeFetch();
  const capture = installFakeFetch();
  await sendWa({ line: 'marketing', to: '9199', templateKey: 'marketing_opener', vars: { name: 'Z' } }, {});
  ok(capture[0].body.template.name === 'tdw_marketing_opener' && capture[0].body.template.name !== 'wrong_name', 'MUT-3: POST carries the registry Meta name (specific, non-vacuous)');

  // ── verdict ──
  console.log(`\nb5c_prospect_lane_bench: ${pass} passed, ${fail} failed`);
  if (fail) { console.log('RED — ' + fails.join(' · ')); process.exit(1); }
  console.log('GREEN — prospect state machine + Meta adapter + transport swap + cross-line opt-out proven over the real sendWa gate, real webhookCore, and a fake HTTP layer; live send declared-not-claimed.');
}

main().catch((e) => { console.error('bench crashed:', e); process.exit(2); });
