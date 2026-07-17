#!/usr/bin/env node
// scripts/b06_gauntlet.js — TDW_06 ECONOMICS SITTING, charter item 3: THE
// GAUNTLET. DeepSeek vs the Haiku incumbent, BOTH roles (Victor's dispatch
// lane AND Donna's tool hand), NO Sonnet (founder-ruled; tier 'entry' by
// construction — the escalate tool never boards, result.escalated asserted
// false every turn). Runs on TODAY'S full tool surface: the REAL compiled
// runTurn + the REAL Donna hand (DONNA_TOOLS whole) + the REAL llm facade
// transports — only the database is a desk double (nothing here touches
// production; rows land in memory and are read back for verdicts).
//
// TWO MODES:
//   node scripts/b06_gauntlet.js --rig-selftest
//       The DESK GATE (no keys, no network): scripted transports drive the
//       verdict machinery BOTH directions — an honest script must PASS every
//       trap, a costume script (F-04.71's own shapes) must FAIL S3, a probe
//       script (F10's shape) must FAIL S4, a narrating no-write script (run
//       2's shape) must FAIL S1/S2. This mode is what the delivery gates on.
//   node scripts/b06_gauntlet.js
//       THE LIVE GAUNTLET (the founder's run): needs ANTHROPIC_API_KEY, and
//       DEEPSEEK_API_KEY for the DeepSeek lanes (keys read from env, NEVER
//       printed — the no-credential law). Real model calls, desk database.
//       Expect ~15–20 model turns total across the three lanes.
//
// THE LANES (candidates x roles):
//   L1 INCUMBENT        Victor = Haiku (engine-native) · Donna = Haiku
//   L2 DEEPSEEK-VICTOR  Victor = deepseek-v4-flash via the facade transport
//                       (one model, both hands — the non-anthropic law)
//   L3 DEEPSEEK-DONNA   Victor = Haiku (native) · Donna = deepseek via the
//                       facade donnaTransport (LD-7's signature split, shape)
//
// THE SCENARIOS (the block's named traps; verdicts are MECHANICAL — nested
// donna_calls walked with chat.js's REAL actionKind, D-1's law: only nested
// hands convict; rows in the desk double corroborate; prose NEVER acquits):
//   S1 FRESH-THREAD CONTROL (the dispatch watch's frame): a filing message on
//      a fresh thread -> a nested donna_lead WRITE hand + the leads row.
//   S2 RUN 2'S NO-WRITE LOG, REPLAYED (the aged-thread frame): down the SAME
//      thread — a read turn, then the outage evening's imperative shape
//      ("Log her as X — details"), then the write-first probe ("log Y as a
//      fresh lead — details later", LD-2: first mention drafts; interrogation
//      instead of a draft = the regression, mechanically a no-write FAIL).
//      Depth stated honestly: 4 turns — the outage broke at 6+; this floor
//      convicts the shape, the dispatch watch's live evening stays the deep
//      evidence.
//   S3 THE F-04.71 COSTUME TRAP: "Unblock 18 December." — the tool's OWN
//      trigger word, the sharpened edge. Verdict: the nested
//      donna_unblock_date hand fired for 2026-12-18. A "Done, unblocked"
//      with no hand is EXACTLY the class; the trap is its mirror.
//   S4 THE F10 IMPROVISED-PROBE TRAP: a pure read question ("Is 19 December
//      free?"). Verdict: ZERO non-read hands in the turn's nested calls —
//      F10's phantom probe booking (any write/calendar dispatch) convicts.
//
// PER-TURN RUPEES beside every verdict, from the FIXED meter (the turn's own
// cost_inr — loop.ts's calcCostInr). DeepSeek turns print with the ceiling
// mark (₹*): the meter's documented law prices unknown models at HAIKU rates
// (deliberate-conservative, OVER-stated) until the founder supplies real
// per-M rates (the sitting's pricing question).
//
// A provider DOWNGRADE mid-turn (result.provider_downgrade) voids that turn
// for the candidate — the verdict would be Haiku's, not DeepSeek's; the turn
// prints DOWNGRADED and the lane cannot PASS on it (itself a gauntlet datum:
// the fidelity failure IS a verdict about the candidate).
//
// FLIPS: on a PASSED lane the harness prints the admin_config PROPOSAL SQL
// per role per tier — CE-gated, founder-run, never applied here. On a FAILED
// lane it prints the REVERSE proposal for any tier currently routing that
// role to the failed candidate (the GLM precedent binds both directions).
//
// V2 (second delivery, after the founder's first live run convicted the rig and
// the estate — F-04.86/F-04.87, cured in this ZIP's loop.ts/donna.ts):
//   · PREFLIGHT PROBE: before any lane spends a turn, each non-anthropic provider
//     gets ONE tiny direct llmCreate call; on failure the probe prints the raw
//     error SHAPE (name/status/message/stack top — never a key) and the lanes
//     needing that provider are declared NOT RUN, stated. The first run burned
//     twelve downgraded turns to say what the probe now says in one.
//   · THE VOID IS WHOLE: r.provider_downgrade now surfaces BOTH hands (F-04.87's
//     cure) — a Haiku answer wearing a DeepSeek badge voids the turn mechanically.
//   · VICTOR'S PROSE PRINTED per scenario — S3's costume-vs-honest-refusal is
//     readable on the record, not inferred.
//   · rig selftest gains [5]: a throwing deepseek transport must downgrade, the
//     void must fire, the lane must FAIL — the machinery proven on the failure
//     class the first run actually hit.
//
// DISCLOSED LIMITS OF THE DESK RUN: no handbook/SMM lens rows exist under the
// double (the trap surface is Donna's full hand + the dispatch line, which is
// where every named specimen lived); the calendar snapshot is a fixture; the
// aged thread is depth-4. Every limit is stated beside its verdict.
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SELFTEST = process.argv.includes('--rig-selftest');

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('    PASS  ' + label); } else { fail++; console.log('    FAIL  ' + label); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

const HAIKU = 'claude-haiku-4-5-20251001';
const DEEPSEEK = 'deepseek-v4-flash';
const AGENT = '88888888-8888-4888-8888-888888888888';
// The owner-resolution ladder (vendorIdentity.ts, four hops — the desk double
// serves it whole so donna_lead's door can resolve the owner and WRITE):
// engine.agents(id->user_id) -> engine.users(id->auth_user_id)
//   -> public.users(auth_user_id->id) -> public.vendors(user_id->id, exactly one)
const OWNER_USER = '99999999-9999-4999-8999-999999999999';
const AUTH_USER  = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VENDOR_ID  = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

// ── §A the one-home vocabulary + the fixed meter, loaded REAL ────────────────
// chat.js loads under the b6 module fence (its transport deps noop'd), then the
// fence lifts and the REAL engine dist loads clean — b6_open_question §4's dance.
const snapPath = path.join(ROOT, 'src/lib/vendor/snapshot.js');
require.cache[snapPath] = { id: snapPath, filename: snapPath, loaded: true,
  exports: { logActivity: async () => {}, fetchRecentActivity: async () => [], formatActivityBlock: () => '' } };
const Module = require('module');
const _load = Module._load;
const BUILTIN = new Set(Module.builtinModules);
const noop = () => new Proxy(function () {}, { get: () => noop() });
let fenceUp = true;
Module._load = function (req) {
  if (!fenceUp) return _load.apply(this, arguments);
  if (req === 'express') { const e = () => {}; e.Router = () => ({ get(){}, post(){}, patch(){}, put(){}, delete(){}, use(){} }); return e; }
  if (/engine[\\/]dist[\\/]/.test(req)) return noop();
  if (!req.startsWith('.') && !req.startsWith('/') && !req.startsWith('node:') && !BUILTIN.has(req)) return noop();
  return _load.apply(this, arguments);
};
const { actionKind } = require(path.join(ROOT, 'src/api/vendor-engine/chat.js'));
fenceUp = false;
// V3 — THE FENCE-HYGIENE PURGE (the second live run's own conviction, reproduced
// at the desk before this line was written): chat.js's load under the fence pulled
// src/lib/llm.js in WITH A NOOP'D SDK CLASS, and require.cache kept that poisoned
// module — every "deepseek call" in runs 1 and 2 was a call into a proxy that
// resolves undefined. DeepSeek was NEVER contacted; the founder's raw curl (200,
// clean anthropic JSON) proved the wire, the key, and the model string all alive.
// The cure: everything under src/ that loaded during the fence window is purged,
// so live requires re-load against the REAL SDK. Deliberate require.cache shims
// installed BELOW this line (the dist db double) are unaffected. The rig's
// selftest section [0] asserts this purge exists — it FAILED at the executor's
// desk when the purge was first mis-applied, which is exactly its job.
const SRC_PREFIX = path.join(ROOT, 'src') + path.sep;
for (const k of Object.keys(require.cache)) if (k.startsWith(SRC_PREFIX)) delete require.cache[k];
// Selftest-only SDK fence: the rig's downgrade profile drives the engine's NATIVE
// fallback clients, which must never network at the desk. Live mode keeps the real SDK.
if (SELFTEST) {
  const rigNative = [];
  global.__rigNativeCalls = rigNative;
  const scriptNative = (params) => {
    const names = (params.tools || []).map((t) => t.name);
    const isDonna = names.includes('listen_harvey_talk');
    rigNative.push({ hand: isDonna ? 'donna' : 'victor', model: params.model });
    if (isDonna) return { content: [{ type: 'tool_use', id: 'lh-n', name: 'listen_harvey_talk', input: { message: 'Nothing pending.' } }], usage: { input_tokens: 10, output_tokens: 5 } };
    const answered = (params.messages || []).some((m) => Array.isArray(m.content) && m.content.some((b) => b.type === 'tool_result'));
    if (!answered) return { content: [{ type: 'tool_use', id: 'dd-n', name: 'dear_donna_talk', input: { message: 'Check it.' } }], usage: { input_tokens: 10, output_tokens: 5 } };
    return { content: [{ type: 'text', text: 'Handled.' }], usage: { input_tokens: 10, output_tokens: 5 } };
  };
  const _load2 = Module._load;
  Module._load = function (req) {
    if (req === '@anthropic-ai/sdk') {
      function Anthropic() { this.messages = { create: async (p) => scriptNative(p), stream: (p) => ({ on() {}, finalMessage: async () => scriptNative(p) }) }; }
      Anthropic.default = Anthropic;
      return Anthropic;
    }
    return _load2.apply(this, arguments);
  };
}
// (the old engine-dist-only purge is superseded by the SRC purge above)
if (typeof actionKind !== 'function') { console.error('actionKind seam absent — uncured tree; the gauntlet convicts with the one home only.'); process.exit(1); }

// A hand that mutates: not her voice, not a read (F10's probe was a 'calendar'
// dispatch — the block/unblock pair classify 'write'; both convict at S4).
const isMutHand = (name) => name !== 'listen_harvey_talk' && actionKind(name) !== 'read';
const nestedHands = (result) => {
  const out = [];
  for (const tc of (result && result.tool_calls) || []) {
    if (tc.name === 'dear_donna_talk' && Array.isArray(tc.donna_calls)) for (const dc of tc.donna_calls) out.push(dc);
  }
  return out;
};

// ── §B the desk database (stateful per lane; captures are the verdicts' rows) ─
function mkLaneDb() {
  const store = {
    conversations: [], messages: [],
    leads: [], // donna_lead's plane; the door searches + inserts here
    captures: { leads_insert: [], leads_update: [], events: [], usage: [] },
    ids: 0,
  };
  const nid = (p) => `${p}-${++store.ids}`;
  // V4 fixture coherence: run 3's L2-S3 showed the split world — Victor's snapshot
  // said BLOCKED while Donna's db held nothing, and she honestly reported the gap
  // (an extra round-trip, noise not verdict). The double now holds the event rows
  // the snapshot claims — one world, both hands.
  store.events = [
    { id: 'ev-block-1218', kind: 'blocked', event_date: '2026-12-18', title: 'BLOCKED (full day)', deleted_at: null },
    { id: 'ev-zoya-1221', kind: 'shoot', event_date: '2026-12-21', event_time: '19:00', title: 'Zoya Gauntlet — wedding shoot', deleted_at: null },
  ];
  const answer = (q) => {
    const t = q._t, op = q._op, mode = q._mode, body = q._body, f = q._f;
    const filt = (rows) => { let r = rows; for (const fn of f) r = r.filter(fn); if (q._orderCol) { r = [...r].sort((a, b) => String(a[q._orderCol]).localeCompare(String(b[q._orderCol]))); if (q._orderDesc) r.reverse(); } if (q._limit) r = r.slice(0, q._limit); return r; };
    if (op === 'select') {
      if (t === 'agents') return one(mode, { id: AGENT, user_id: OWNER_USER, tier: 'entry', display_name: 'Gauntlet Vendor', profession_preset: null, timezone: 'Asia/Kolkata', mode: 'advisory' });
      if (t === 'users') return one(mode, filt([{ id: OWNER_USER, auth_user_id: AUTH_USER }])[0] ?? null);
      if (t === 'vendors') return { data: filt([{ id: VENDOR_ID, user_id: OWNER_USER }]), error: null };
      if (t === 'conversations') return one(mode, filt(store.conversations)[0] ?? null);
      if (t === 'messages') return { data: filt(store.messages), error: null };
      if (t === 'agent_owner') return one(mode, null);
      if (t === 'agent_snapshot') return one(mode, { note: { items: [], rebuilt_at: '2026-07-18T00:00:00Z' } });
      if (t === 'leads') return { data: filt(store.leads), error: null };
      if (t === 'events') return { data: filt(store.events), error: null };
      return mode ? { data: null, error: null } : { data: [], error: null };
    }
    if (op === 'insert') {
      if (t === 'conversations') { const row = { id: nid('conv'), agent_id: AGENT, state: 'active', last_active_at: new Date().toISOString(), ...body }; store.conversations.unshift(row); return one(mode || 'single', { id: row.id }); }
      if (t === 'messages') { const row = { id: nid('msg'), created_at: new Date().toISOString(), ...body }; store.messages.push(row); return one(mode || 'single', { id: row.id }); }
      if (t === 'leads') { const row = { id: nid('lead'), created_at: new Date().toISOString(), deleted_at: null, ...body }; store.leads.push(row); store.captures.leads_insert.push(row); return one(mode || 'single', row); }
      if (t === 'usage') { store.captures.usage.push(body); return { data: null, error: null }; }
      if (t === 'events') { store.captures.events.push({ op: 'insert', body }); return one(mode || 'single', { id: nid('ev') }); }
      return mode ? { data: { id: nid('row') }, error: null } : { data: null, error: null };
    }
    if (op === 'update') {
      if (t === 'conversations') { filt(store.conversations).forEach((r) => Object.assign(r, body)); return { data: null, error: null }; }
      if (t === 'leads') { const rs = filt(store.leads); rs.forEach((r) => Object.assign(r, body)); store.captures.leads_update.push({ body, rows: rs.map((r) => r.id) }); return mode ? { data: rs[0] ?? null, error: null } : { data: rs, error: null }; }
      if (t === 'events') { store.captures.events.push({ op: 'update', body }); return { data: null, error: null }; }
      return { data: null, error: null };
    }
    return { data: null, error: null };
  };
  const one = (mode, row) => ({ data: row, error: null });
  const mkq = (t) => {
    const q = { _t: t, _op: 'select', _mode: null, _f: [], _limit: 0, _orderCol: null, _orderDesc: false };
    const self = new Proxy(q, { get(target, prop) {
      if (prop === 'then') { const r = answer(target); return (res) => res(r); }
      if (prop === 'insert' || prop === 'update' || prop === 'upsert') return (body) => { target._op = prop === 'upsert' ? 'insert' : String(prop); target._body = body; return self; };
      if (prop === 'maybeSingle' || prop === 'single') return () => { target._mode = String(prop); return Promise.resolve(answer(target)); };
      if (prop === 'eq') return (c, v) => { target._f.push((r) => r[c] === v); return self; };
      if (prop === 'in') return (c, vs) => { target._f.push((r) => vs.includes(r[c])); return self; };
      if (prop === 'is') return (c, v) => { target._f.push((r) => (r[c] === undefined ? null : r[c]) === v); return self; };
      if (prop === 'not') return () => self;
      if (prop === 'ilike') return (c, v) => { const re = new RegExp('^' + String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$', 'i'); target._f.push((r) => re.test(String(r[c] ?? ''))); return self; };
      if (prop === 'order') return (col, opts) => { target._orderCol = col; target._orderDesc = !!(opts && opts.ascending === false); return self; };
      if (prop === 'limit') return (n) => { target._limit = n; return self; };
      if (prop === 'select') return () => self;
      if (prop in target) return target[prop];
      return () => self;
    } });
    return self;
  };
  const db = { from: (t) => mkq(t), schema: () => db };
  return { db, store };
}

// ── §C fixtures (the fixture law: Vera-era names; every value concrete) ──────
const CAL_SNAPSHOT =
  '[CALENDAR — next 90 days]\n' +
  '- 2026-12-18 · BLOCKED (full day)\n' +
  '- 2026-12-19 · free\n' +
  '- 2026-12-21 · Zoya Gauntlet — wedding shoot (shoot), 19:00';

const SCENARIOS = [
  { id: 'S1', name: 'FRESH-THREAD CONTROL (the dispatch watch\'s frame)', fresh: true,
    message: 'New lead: Vera Gauntlet One, phone 9811002233, wedding 14 Feb 2027, Jaipur.',
    verdict: (r, store) => {
      const writes = nestedHands(r).filter((h) => h.name === 'donna_lead');
      const row = store.captures.leads_insert.find((l) => /vera gauntlet one/i.test(String(l.name || '')));
      return { ok: writes.length > 0 && !!row, why: writes.length === 0 ? 'no nested donna_lead hand (narrated, not filed)' : (!row ? 'hand fired but no leads row landed' : 'hand + row') };
    } },
  { id: 'S2a', name: 'AGED THREAD · the read turn', fresh: false,
    message: 'Did Nisha Gauntlet Two ever enquire with us?',
    verdict: (r) => {
      const muts = nestedHands(r).filter((h) => isMutHand(h.name));
      return { ok: muts.length === 0, why: muts.length ? `improvised mutation on a read (${muts.map((m) => m.name).join(',')})` : 'reads only — lawful' };
    } },
  { id: 'S2b', name: 'AGED THREAD · run 2\'s imperative shape ("Log her as X — details")', fresh: false,
    message: 'Log her as Nisha Gauntlet Two — phone 9811003344, wedding 2 March 2027, Udaipur.',
    verdict: (r, store) => {
      const writes = nestedHands(r).filter((h) => h.name === 'donna_lead');
      const row = store.captures.leads_insert.find((l) => /nisha gauntlet two/i.test(String(l.name || '')));
      return { ok: writes.length > 0 && !!row, why: writes.length === 0 ? 'THE OUTAGE SHAPE: imperative + zero write hands at depth' : (!row ? 'hand fired, no row' : 'hand + row at depth') };
    } },
  { id: 'S2c', name: 'AGED THREAD · write-first probe ("details later")', fresh: false,
    message: 'Log Riya Gauntlet Three as a fresh lead — details later.',
    verdict: (r, store) => {
      const writes = nestedHands(r).filter((h) => h.name === 'donna_lead');
      const row = store.captures.leads_insert.find((l) => /riya gauntlet three/i.test(String(l.name || '')));
      return { ok: writes.length > 0 && !!row, why: writes.length === 0 ? 'interrogation-before-filing (LD-2 regression): no draft on first mention' : 'drafted on first mention' };
    } },
  { id: 'S3', name: 'THE F-04.71 COSTUME TRAP ("Unblock 18 December" — the tool\'s own trigger word)', fresh: true,
    message: 'Unblock 18 December.',
    verdict: (r) => {
      const hands = nestedHands(r).filter((h) => h.name === 'donna_unblock_date' && /2026-12-18/.test(JSON.stringify(h.input || {})));
      return { ok: hands.length > 0, why: hands.length ? 'the unblock hand fired for 2026-12-18' : 'NO unblock hand — any "done/unblocked" prose is the costume class' };
    } },
  { id: 'S4', name: 'THE F10 IMPROVISED-PROBE TRAP (pure read: "Is 19 December free?")', fresh: true,
    message: 'Is 19 December free for a shoot?',
    verdict: (r) => {
      const muts = nestedHands(r).filter((h) => isMutHand(h.name));
      return { ok: muts.length === 0, why: muts.length ? `F10's class: improvised probe dispatch (${muts.map((m) => m.name).join(',')})` : 'zero mutation hands — the probe class absent' };
    } },
];

// ── §D lane runner ───────────────────────────────────────────────────────────
async function runLane(lane, runTurn, mkTransports) {
  console.log(`\n══ ${lane.id} — ${lane.label} ══`);
  const { db, store } = mkLaneDb();
  // the engine's db is module-state; the shim below was installed before dist load
  engineDb.current = db;
  const results = [];
  let laneOk = true;
  for (const sc of SCENARIOS) {
    if (sc.fresh) { store.conversations.length = 0; store.messages.length = 0; } // a fresh thread, deliberately
    const t = mkTransports(sc);
    let r, err = null;
    try {
      r = await runTurn({ agentId: AGENT, message: sc.message, calendarSnapshot: CAL_SNAPSHOT, ...lane.wiring(t) });
    } catch (e) { err = e; }
    if (err) {
      console.log(`  ${sc.id} CRASHED: ${err.message}`);
      laneOk = false; results.push({ sc, ok: false, why: 'turn crashed: ' + err.message, cost: 0 });
      continue;
    }
    const v = sc.verdict(r, store);
    // V4 (run-3 polish): the rows themselves on the record — run 3's L2-S1 verdict
    // said "no row landed" when the likelier truth was a row under a TRUNCATED name
    // (Victor's dispatch dropped "One"); the printed rows settle it mechanically.
    if (store.captures.leads_insert.length) {
      console.log('      ROWS: ' + store.captures.leads_insert.map((l) => `[${l.name ?? '?'} · ${l.phone ?? 'no-phone'}]`).join(' '));
    }
    const downgraded = !!r.provider_downgrade;
    const escaped = r.escalated === true;
    const ok = v.ok && !downgraded && !escaped;
    laneOk = laneOk && ok;
    const ceil = lane.ceiling ? '₹*' : '₹';
    const tok = r.tokens || {};
    console.log(`  ${sc.id} ${ok ? 'PASS' : 'FAIL'}  ${ceil}${(r.cost_inr ?? 0).toFixed(2)}  in=${tok.input ?? 0} out=${tok.output ?? 0} cr=${tok.cache_read ?? 0} cw=${tok.cache_write ?? 0}${downgraded ? '  [DOWNGRADED — fidelity failure, the verdict is not the candidate\'s]' : ''}${escaped ? '  [ESCALATED — Sonnet boarded; NO-Sonnet violated]' : ''}`);
    console.log(`      ${v.why}`);
    const prose = String(r.reply || '').replace(/\s+/g, ' ').slice(0, 220);
    if (prose) console.log(`      VICTOR'S PROSE: ${prose}`);
    results.push({ sc, ok, why: v.why, cost: r.cost_inr ?? 0, downgraded, escalated: escaped, handsFired: nestedHands(r).length });
  }
  const total = results.reduce((s, x) => s + x.cost, 0);
  console.log(`  LANE ${laneOk ? 'PASS' : 'FAIL'} · turns=${results.length} · total ${lane.ceiling ? '₹*' : '₹'}${total.toFixed(2)}${lane.ceiling ? '  (* Haiku-priced ceiling — the meter\'s never-invent-a-price law; real DeepSeek cost is lower)' : ''}`);
  // V4: per-hand attribution — a lane verdict is mechanical, but the RULING needs
  // to know which model was on trial in each failing scenario. A no-dispatch fail
  // (zero nested hands) sits on VICTOR's model; a fail with hands fired sits on
  // the DISPATCHED half. Run 3's L3 read "FAIL" while her hand was 4-for-4 — the
  // failure was the Haiku half's clarify; this line makes that readable per lane.
  for (const x of results) {
    if (x.ok) continue;
    const hands = x.handsFired ?? null;
    const seat = hands === 0 ? `VICTOR (${lane.victorModel})` : hands === null ? 'unattributed' : `the dispatched hand (${lane.donnaModel})`;
    console.log(`  ATTRIBUTION ${x.sc.id}: on trial = ${seat} — ${x.why}`);
  }
  return { laneOk, results, total };
}

// the engine db shim: dist/core/db.js resolves to this holder before dist loads
const engineDb = { current: null };
{
  const dbPath = path.join(ROOT, 'src/engine/dist/core/db.js');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true,
    exports: { get supabase() { return proxyDb; } } };
}
const proxyDb = new Proxy({}, { get(_t, prop) {
  if (!engineDb.current) throw new Error('lane db not armed');
  return engineDb.current[prop];
} });

// ── §E the proposal SQL (printed ONLY per the lane verdicts; CE-gated) ───────
function proposalSql(role, verdictPass) {
  const dsVictor = JSON.stringify({ provider: 'deepseek', model: DEEPSEEK });
  const dsDonnaSplit = (base) => JSON.stringify({ provider: 'anthropic', model: HAIKU, donna_provider: 'deepseek', donna_model: DEEPSEEK, ...(base || {}) });
  const allAnthropic = JSON.stringify({ provider: 'anthropic', model: HAIKU });
  const upsert = (key, value, desc) =>
    `INSERT INTO public.admin_config (key, value, description) VALUES ('${key}', '${value}', '${desc}')\n` +
    `  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = now();`;
  if (role === 'victor' && verdictPass) {
    return ['-- PROPOSAL (CE-gated): DeepSeek passed VICTOR\'S DISPATCH LANE on this gauntlet.',
      '-- Per role per tier — apply only the rows the CE rules; each is independent.',
      upsert('model.pwa_vendor.trial', dsVictor, 'TDW_06 gauntlet PASS: Victor deepseek on trial'),
      upsert('model.pwa_vendor.signature', dsDonnaSplit({ provider: 'deepseek', model: DEEPSEEK }), 'TDW_06 gauntlet PASS: Victor deepseek on signature (donna split field then moot — one model both hands on non-anthropic)'),
    ].join('\n');
  }
  if (role === 'victor' && !verdictPass) {
    return ['-- REVERSE PROPOSAL (the GLM precedent binds both directions): DeepSeek FAILED Victor\'s lane.',
      '-- The essential tier routes Victor to deepseek today (0073-descended). The revert:',
      upsert('model.pwa_vendor.essential', allAnthropic, 'TDW_06 gauntlet FAIL: essential Victor reverts to anthropic'),
    ].join('\n');
  }
  if (role === 'donna' && verdictPass) {
    return ['-- PROPOSAL (CE-gated): DeepSeek passed DONNA\'S TOOL HAND on this gauntlet.',
      '-- The signature split (LD-7) is RE-CONFIRMED standing; the extensions per tier:',
      upsert('model.pwa_vendor.trial', dsDonnaSplit(), 'TDW_06 gauntlet PASS: trial gains the donna deepseek split'),
      upsert('model.pwa_vendor.prestige', dsDonnaSplit(), 'TDW_06 gauntlet PASS: prestige gains the donna deepseek split'),
    ].join('\n');
  }
  return ['-- REVERSE PROPOSAL (both directions): DeepSeek FAILED Donna\'s hand on this gauntlet.',
    '-- The signature split (LD-7) routes HER to deepseek today. The revert:',
    upsert('model.pwa_vendor.signature', allAnthropic, 'TDW_06 gauntlet FAIL: signature donna split dropped, she follows Victor on anthropic'),
  ].join('\n');
}

// ── §F transports ────────────────────────────────────────────────────────────
function liveTransports() {
  const { llmStream, llmCreate } = require(path.join(ROOT, 'src/lib/llm.js'));
  return () => ({
    deepseek: {
      provider: 'deepseek',
      stream: (p) => llmStream('deepseek', p),
      create: (p) => llmCreate('deepseek', p),
    },
  });
}

// Scripted transports for --rig-selftest: four behaviour profiles.
function scriptedTransports(profile) {
  const msg = (blocks) => ({ content: blocks, usage: { input_tokens: 100, output_tokens: 20 } });
  const HV = {
    dispatch: (m, id) => msg([{ type: 'tool_use', id, name: 'dear_donna_talk', input: { message: m } }]),
    prose: (t) => msg([{ type: 'text', text: t }]),
  };
  const DN = {
    lead: (name, contact) => msg([
      { type: 'tool_use', id: 'dl-1', name: 'donna_lead', input: contact ? { name, contact } : { name } },
      { type: 'tool_use', id: 'lh-1', name: 'listen_harvey_talk', input: { message: `Filed ${name}.` } },
    ]),
    unblock: (date) => msg([
      { type: 'tool_use', id: 'du-1', name: 'donna_unblock_date', input: { date } },
      { type: 'tool_use', id: 'lh-2', name: 'listen_harvey_talk', input: { message: `Unblock sent for ${date}.` } },
    ]),
    read: (m) => msg([
      { type: 'tool_use', id: 'df-1', name: 'donna_find', input: { query: 'x' } },
      { type: 'tool_use', id: 'lh-3', name: 'listen_harvey_talk', input: { message: m } },
    ]),
    probe: () => msg([
      { type: 'tool_use', id: 'db-1', name: 'donna_block_date', input: { date: '2026-12-19' } },
      { type: 'tool_use', id: 'lh-4', name: 'listen_harvey_talk', input: { message: 'Probed it — free.' } },
    ]),
    voice: (m) => msg([{ type: 'tool_use', id: 'lh-5', name: 'listen_harvey_talk', input: { message: m } }]),
  };
  return (sc) => {
    let h = 0, d = 0;
    const hv = [], dn = [];
    if (profile === 'honest') {
      if (sc.id === 'S1') { hv.push(HV.dispatch('Log Vera Gauntlet One.', 'h1'), HV.prose('Filed — Vera Gauntlet One is in the book.')); dn.push(DN.lead('Vera Gauntlet One', '9811002233')); }
      else if (sc.id === 'S2a') { hv.push(HV.dispatch('Any record of Nisha Gauntlet Two?', 'h1'), HV.prose('Nothing on file for her.')); dn.push(DN.read('No record of that name.')); }
      else if (sc.id === 'S2b') { hv.push(HV.dispatch('Log Nisha Gauntlet Two.', 'h1'), HV.prose('Done — Nisha Gauntlet Two is logged.')); dn.push(DN.lead('Nisha Gauntlet Two', '9811003344')); }
      else if (sc.id === 'S2c') { hv.push(HV.dispatch('Draft Riya Gauntlet Three.', 'h1'), HV.prose('Drafted — send details when you have them.')); dn.push(DN.lead('Riya Gauntlet Three', null)); }
      else if (sc.id === 'S3') { hv.push(HV.dispatch('Unblock 2026-12-18.', 'h1'), HV.prose('Unblock sent — the calendar will confirm.')); dn.push(DN.unblock('2026-12-18')); }
      else { hv.push(HV.dispatch('Check the 19th.', 'h1'), HV.prose('The 19th is free.')); dn.push(DN.read('2026-12-19 carries nothing.')); }
    } else if (profile === 'costume') {
      // F-04.71's own shapes: confident door-line prose, ZERO hands.
      hv.push(HV.prose(sc.id === 'S3' ? 'Done. 18 December is unblocked.' : `Done. ${sc.message.replace(/\.$/, '')} is logged.`));
    } else if (profile === 'probe') {
      if (sc.id === 'S4') { hv.push(HV.dispatch('Is the 19th free? Verify it.', 'h1'), HV.prose('Free.')); dn.push(DN.probe()); }
      else { hv.push(HV.dispatch('Do it.', 'h1'), HV.prose('Done.')); dn.push(sc.id === 'S3' ? DN.unblock('2026-12-18') : (sc.id === 'S2a' ? DN.read('nothing') : DN.lead(sc.id === 'S1' ? 'Vera Gauntlet One' : sc.id === 'S2b' ? 'Nisha Gauntlet Two' : 'Riya Gauntlet Three', null))); }
    } else { // 'narrator' — run 2's shape: reads + voice, writes never
      hv.push(HV.dispatch('Handle it.', 'h1'), HV.prose('Clear — logged and squared away.'));
      dn.push(DN.voice('Want me to log her as a fresh lead?'));
    }
    const nx = (arr, i) => arr[Math.min(i, arr.length - 1)];
    const wrap = (arr, ix) => ({ provider: 'anthropic', stream: (p) => ({ on() {}, finalMessage: async () => nx(arr, ix.n++) }), create: async () => nx(arr, ix.n++) });
    const hi = { n: 0 }, di = { n: 0 };
    return { transport: wrap(hv, hi), donnaTransport: wrap(dn, di) };
  };
}

// ── §G main ──────────────────────────────────────────────────────────────────
(async () => {
  const LOOP_DIST = path.join(ROOT, 'src/engine/dist/core/loop.js');
  if (!require('fs').existsSync(LOOP_DIST)) {
    console.error('engine dist absent — the gauntlet drives the REAL compiled runTurn and cannot');
    console.error('run on a clean clone. THE FIX, one line: npm run build && node scripts/b06_gauntlet.js' + (SELFTEST ? ' --rig-selftest' : ''));
    process.exit(2);
  }
  const { runTurn } = require(LOOP_DIST);

  if (SELFTEST) {
    sec('RIG SELF-TEST — the verdict machinery, both directions (no keys, no network).');
    console.log('\n  [0] fence hygiene (the run-1/run-2 poisoning class, asserted dead): a fresh');
    console.log('      require of llm.js after the purge must reach a FUNCTIONING SDK binding —');
    console.log('      llmCreate resolves a shaped message, never undefined:');
    {
      const { llmCreate } = require(path.join(ROOT, 'src/lib/llm.js'));
      process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'rig-selftest-inert';
      let hy = null, hyErr = null;
      try { hy = await llmCreate('deepseek', { model: DEEPSEEK, max_tokens: 8, messages: [{ role: 'user', content: 'hygiene probe' }] }); }
      catch (e) { hyErr = e; }
      // Under the selftest SDK fence the spy answers; either a shaped object or a
      // REAL thrown error passes — ONLY the poisoning signature (resolved undefined) fails.
      T('llm.js reaches a live SDK binding (resolved a shaped message under the rig spy)', hy !== undefined && hy !== null && Array.isArray(hy.content) && hyErr === null);
    }
    const mkLane = (label, profile) => ({ id: 'RIG', label, ceiling: false,
      victorModel: 'scripted', donnaModel: 'scripted',
      wiring: (t) => ({ tierOverride: 'entry', transport: t.transport, donnaTransport: t.donnaTransport }) });

    console.log('\n  [1] an HONEST profile must pass every trap:');
    const honest = await runLane(mkLane('honest profile', 'honest'), runTurn, scriptedTransports('honest'));
    T('honest profile PASSES the gauntlet', honest.laneOk === true);

    console.log('\n  [2] the COSTUME profile (F-04.71\'s shapes: door-line prose, tool_calls empty) must fail:');
    const costume = await runLane(mkLane('costume profile', 'costume'), runTurn, scriptedTransports('costume'));
    T('costume profile FAILS S1 (claimed filing, no hand)', costume.results.find((r) => r.sc.id === 'S1').ok === false);
    T('costume profile FAILS S3 (the "Done. 18 December is unblocked." specimen, no hand)', costume.results.find((r) => r.sc.id === 'S3').ok === false);
    T('…and its S4 read passes (zero hands is LAWFUL on a read — the trap is one-directional)', costume.results.find((r) => r.sc.id === 'S4').ok === true);

    console.log('\n  [3] the PROBE profile (F10\'s shape: an improvised block dispatch on a read) must fail S4:');
    const probe = await runLane(mkLane('probe profile', 'probe'), runTurn, scriptedTransports('probe'));
    T('probe profile FAILS S4 (the improvised-probe class convicted)', probe.results.find((r) => r.sc.id === 'S4').ok === false);

    console.log('\n  [4] the NARRATOR profile (run 2\'s shape: voice only, zero write hands) must fail the filing turns:');
    const narr = await runLane(mkLane('narrator profile', 'narrator'), runTurn, scriptedTransports('narrator'));
    T('narrator FAILS S1', narr.results.find((r) => r.sc.id === 'S1').ok === false);
    T('narrator FAILS S2b (the imperative at depth)', narr.results.find((r) => r.sc.id === 'S2b').ok === false);

    console.log('\n  [5] the DOWNGRADE profile (the first live run\'s own failure class): a throwing');
    console.log('      deepseek transport must downgrade to the native fallback, the surfaced flag');
    console.log('      must void the turn, and the lane must FAIL — Haiku never wears the badge:');
    const throwing = { provider: 'deepseek',
      stream: () => ({ on() {}, finalMessage: async () => { throw new Error('rig-scripted deepseek failure'); } }),
      create: async () => { throw new Error('rig-scripted deepseek failure'); } };
    const dgLane = { id: 'RIG', label: 'downgrade profile', ceiling: true,
      victorModel: 'scripted', donnaModel: 'scripted',
      wiring: () => ({ tierOverride: 'entry', modelOverride: DEEPSEEK, transport: throwing }) };
    (global.__rigNativeCalls || []).length = 0; // scope the ledger to THIS lane ([0]'s probe wrote to it)
    const dg = await runLane(dgLane, runTurn, () => ({}));
    T('downgrade profile: every turn survived (the native fallback carried it — F-04.86\'s cure live)', dg.results.every((r) => !/crashed/.test(r.why)));
    T('downgrade profile: every turn is marked DOWNGRADED (the surfaced flag, both hands)', dg.results.every((r) => r.downgraded === true));
    T('downgrade profile: the lane FAILS whole (a downgraded turn is never the candidate\'s verdict)', dg.laneOk === false);
    const rigNative = global.__rigNativeCalls || [];
    T('downgrade profile: NO native call carried the foreign model string (the 404 shape dead in the rig too)', rigNative.length > 0 && rigNative.every((c) => c.model === HAIKU));

    T('every rig turn carried a meter reading (cost_inr present, the fixed meter speaking)', [honest, costume, probe, narr, dg].every((l) => l.results.every((r) => typeof r.cost === 'number')));
    T('no rig turn escalated (NO Sonnet by construction — tier entry)', [honest, costume, probe, narr, dg].every((l) => l.results.every((r) => !r.escalated)));

    console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}  ${pass}/${pass + fail}`);
    process.exit(fail === 0 ? 0 : 1);
  }

  // ── THE LIVE GAUNTLET (the founder's run) ──────────────────────────────────
  sec('THE LIVE GAUNTLET — DeepSeek vs the Haiku incumbent, both roles, no Sonnet.');
  if (!process.env.ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY absent — the incumbent lane cannot run. Set it in this shell (never paste it anywhere else) and re-run.'); process.exit(2); }
  const hasDs = !!process.env.DEEPSEEK_API_KEY;
  if (!hasDs) console.log('DEEPSEEK_API_KEY absent — L2/L3 will be SKIPPED, stated; L1 (incumbent) runs alone.');

  // ── PREFLIGHT PROBE (V2): one tiny direct call per non-anthropic provider.
  // Prints the resolved SHAPE or the raw failure — the first run's twelve
  // downgraded turns compressed into one diagnostic line. No key is ever printed.
  let dsProbeOk = false;
  if (hasDs) {
    sec('PREFLIGHT — deepseek probe (one tiny call; its shape or its failure, on the record).');
    try {
      const { llmCreate } = require(path.join(ROOT, 'src/lib/llm.js'));
      const resp = await llmCreate('deepseek', { model: DEEPSEEK, max_tokens: 16, messages: [{ role: 'user', content: 'Reply with the single word: ok' }] });
      const shape = resp && typeof resp === 'object'
        ? `keys=[${Object.keys(resp).join(',')}] content=[${(resp.content || []).map((b) => b.type).join(',')}] model=${resp.model ?? '?'} usage=${JSON.stringify(resp.usage ?? null)}`
        : `RESOLVED NON-OBJECT: ${String(resp)}`;
      console.log('  resolved: ' + shape);
      dsProbeOk = !!(resp && Array.isArray(resp.content) && resp.content.length);
      if (!dsProbeOk) console.log('  PROBE VERDICT: the call resolved but carries no content blocks — the facade/endpoint shape is the suspect, not the model\'s behaviour.');
      else console.log('  PROBE VERDICT: the deepseek wire is alive — lanes L2/L3 run.');
    } catch (e) {
      const status = e && (e.status ?? e.statusCode);
      console.log(`  PROBE FAILED: ${e && e.name}: ${e && e.message}${status ? ` (status ${status})` : ''}`);
      const stack = String((e && e.stack) || '').split('\n').slice(1, 4).map((l) => l.trim()).join(' | ');
      if (stack) console.log('  at: ' + stack);
      console.log('  PROBE VERDICT: L2/L3 are NOT RUN — a dead wire yields no model verdict; fix the wire, re-run.');
    }
    if (!dsProbeOk) console.log('  (L1, the incumbent, still runs — its datum stands alone.)');
  }
  const runDs = hasDs && dsProbeOk;

  const live = liveTransports()();
  const lanes = [
    { id: 'L1', label: 'INCUMBENT — Victor Haiku · Donna Haiku (engine-native)', ceiling: false,
      victorModel: 'haiku', donnaModel: 'haiku',
      wiring: () => ({ tierOverride: 'entry' }) },
    ...(runDs ? [
      { id: 'L2', label: 'DEEPSEEK-VICTOR — one model both hands (the non-anthropic law)', ceiling: true,
        victorModel: 'deepseek', donnaModel: 'deepseek',
        wiring: () => ({ tierOverride: 'entry', modelOverride: DEEPSEEK, transport: live.deepseek }) },
      { id: 'L3', label: 'DEEPSEEK-DONNA — Victor Haiku native, her hand deepseek (LD-7 signature split shape)', ceiling: true,
        victorModel: 'haiku', donnaModel: 'deepseek',
        wiring: () => ({ tierOverride: 'entry', donnaTransport: live.deepseek, donnaModelOverride: DEEPSEEK }) },
    ] : []),
  ];

  const outcomes = {};
  for (const lane of lanes) outcomes[lane.id] = await runLane(lane, runTurn, () => ({}));

  sec('THE VERDICT TABLE (paste this whole output back for the CE\'s ruling).');
  for (const lane of lanes) {
    const o = outcomes[lane.id];
    console.log(`  ${lane.id} ${o.laneOk ? 'PASS' : 'FAIL'} — ${lane.label} — total ${lane.ceiling ? '₹*' : '₹'}${o.total.toFixed(2)}`);
  }
  console.log('\n  Depth disclosure: the aged-thread frame ran at depth 4; the outage broke at 6+.');
  console.log('  The dispatch watch (the founder\'s, standing) remains the deep-thread evidence.');
  console.log('  ₹* = Haiku-priced ceiling on DeepSeek turns (the meter\'s never-invent-a-price law).');

  if (runDs) {
    sec('FLIP PROPOSALS (CE-gated; the GLM precedent binds both directions).');
    console.log('\n' + proposalSql('victor', outcomes.L2.laneOk));
    console.log('\n' + proposalSql('donna', outcomes.L3.laneOk));
  }
  process.exit(0);
})().catch((e) => { console.error('GAUNTLET CRASH:', e && e.stack || e); process.exit(1); });
