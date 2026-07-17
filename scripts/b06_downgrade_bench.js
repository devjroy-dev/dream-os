#!/usr/bin/env node
// scripts/b06_downgrade_bench.js — TDW_06 ECONOMICS SITTING (second delivery):
// F-04.86 + F-04.87. Runnable from any working directory, clean clone, no npm
// install:   node scripts/b06_downgrade_bench.js
//
// THE CONVICTIONS (both caught LIVE by the founder's first gauntlet run):
//  F-04.86 — after a Victor-side provider downgrade (transport -> null, model ->
//    Haiku), loop.ts's Donna invocation handed her the NATIVE anthropic client
//    while STILL passing args.modelOverride — the foreign model string against
//    Anthropic's API, a hard 404, the turn dead. LIVE on the essential tier
//    (one-model-both-hands deepseek): any transient provider failure on
//    Victor's leg crashed the vendor's turn at the first dispatch.
//  F-04.87 — Donna's own provider downgrade was CONSOLE-ONLY: her return carried
//    no flag, so TurnResult, the door's activity write, and every bench were
//    blind to it — the gauntlet's L3 lane printed a PASS that was Haiku
//    wearing DeepSeek's badge.
//
// WHAT THIS BENCH DRIVES, disclosed: the REAL compiled runTurn (dist; D-11's
// staleness gate, sentinel = the cure's own identifier) with the SDK class
// fenced to a spy BEFORE dist loads — so the NATIVE clients loop.ts/donna.ts
// construct are the bench's witnesses, and the 404 shape is convicted by the
// MODEL STRING the native client receives (no network, no key):
//  §1 one-model-both-hands + a Victor transport that always fails:
//     CURED — the turn survives; Donna's native call carries HAIKU (spec P5's
//     "Haiku for the rest of this turn" finally true for BOTH hands);
//     provider_downgrade rides the TurnResult.
//     UNCURED — Donna's native call carries the FOREIGN model string (the 404
//     shape, witnessed mechanically at the exact seam).
//  §2 a donna-split transport that always fails (Victor native):
//     CURED — DonnaTurn's flag folds up: TurnResult.provider_downgrade true.
//     UNCURED — the flag is absent (the L3 blindness, convicted).
//  §3 the no-downgrade floor: native both hands, no transports — the flag stays
//     unset and the turn is byte-normal (the cure adds nothing to clean turns).
//
// Ruling trail: spec P5 (one silent same-turn downgrade — the contract this
// makes true) · D-1 (mechanical verdicts) · F-04.84's precedent (filed + cured
// same sitting, convicted by the estate's own run) · D-11 (the gate).
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('  PASS  ' + label); } else { fail++; console.log('  FAIL  ' + label); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

const HAIKU = 'claude-haiku-4-5-20251001';
const DEEPSEEK = 'deepseek-v4-flash';
const AGENT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

sec('§0 — D-11: the dist gate (sentinel = donnaTransportForSeg, the F-04.86 cure\'s own identifier).');
const { distGate } = require(path.join(__dirname, 'lib', 'dist_gate'));
const gate = distGate({
  sentinel: 'donnaTransportForSeg',
  srcPath: path.join(ROOT, 'src/engine/src/core/loop.ts'),
  distPath: path.join(ROOT, 'src/engine/dist/core/loop.js'),
  benchCmd: 'scripts/b06_downgrade_bench.js',
});
if (!gate.runDist) {
  const fs = require('fs');
  console.log('  … the behavioural sections SKIP per the gate; source assertions carry:');
  const loopSrc = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/loop.ts'), 'utf8');
  const donnaSrc = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/donna.ts'), 'utf8');
  T('source: the downgrade-coherent donna wiring exists (F-04.86)', /donnaTransportForSeg/.test(loopSrc) && /providerDowngrade \? undefined/.test(loopSrc));
  T('source: her downgrade flag rides the return (F-04.87)', /provider_downgrade\?: boolean/.test(donnaSrc) && /provider_downgrade: providerDowngrade \|\| undefined/.test(donnaSrc));
  console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}  ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

// ── the SDK spy, fenced BEFORE dist loads: the native clients are witnesses ──
const nativeCalls = []; // { hand: inferred, model, params }
function scriptFor(params) {
  // Victor's native calls carry his tools (dear_donna_talk present); Donna's
  // carry hers (listen_harvey_talk). Inferred from the params themselves.
  const names = (params.tools || []).map((t) => t.name);
  const isDonna = names.includes('listen_harvey_talk');
  nativeCalls.push({ hand: isDonna ? 'donna' : 'victor', model: params.model, params });
  if (isDonna) {
    return { content: [{ type: 'tool_use', id: 'lh-1', name: 'listen_harvey_talk', input: { message: 'Noted, nothing pending.' } }], usage: { input_tokens: 10, output_tokens: 5 } };
  }
  // Victor: dispatch once, then close in prose.
  const dispatched = (params.messages || []).some((m) => Array.isArray(m.content) && m.content.some((b) => b.type === 'tool_result'));
  if (!dispatched) {
    return { content: [{ type: 'tool_use', id: 'dd-1', name: 'dear_donna_talk', input: { message: 'Anything pending?' } }], usage: { input_tokens: 10, output_tokens: 5 } };
  }
  return { content: [{ type: 'text', text: 'All squared away.' }], usage: { input_tokens: 10, output_tokens: 5 } };
}
const Module = require('module');
const _load = Module._load;
Module._load = function (req) {
  if (req === '@anthropic-ai/sdk') {
    function Anthropic() {
      this.messages = {
        create: async (p) => scriptFor(p),
        stream: (p) => ({ on() {}, finalMessage: async () => scriptFor(p) }),
      };
    }
    Anthropic.default = Anthropic;
    return Anthropic;
  }
  return _load.apply(this, arguments);
};

// ── the db double (the gauntlet's stateful shape, slimmed) ───────────────────
const store = { conversations: [], messages: [], ids: 0 };
const nid = (p) => `${p}-${++store.ids}`;
function answer(q) {
  const t = q._t, op = q._op, mode = q._mode, body = q._body;
  const filt = (rows) => { let r = rows; for (const fn of q._f) r = r.filter(fn); return r; };
  const one = (m, row) => ({ data: row, error: null });
  if (op === 'select') {
    if (t === 'agents') return one(mode, { id: AGENT, user_id: 'u', tier: 'entry', display_name: 'Downgrade Bench Vendor', profession_preset: null, timezone: 'Asia/Kolkata', mode: 'advisory' });
    if (t === 'conversations') return one(mode, filt(store.conversations)[0] ?? null);
    if (t === 'messages') return { data: filt(store.messages), error: null };
    if (t === 'agent_snapshot') return one(mode, { note: { items: [], rebuilt_at: '2026-07-18T00:00:00Z' } });
    return mode ? { data: null, error: null } : { data: [], error: null };
  }
  if (op === 'insert') {
    if (t === 'conversations') { const row = { id: nid('conv'), agent_id: AGENT, state: 'active', last_active_at: new Date().toISOString(), ...body }; store.conversations.unshift(row); return one(mode || 'single', { id: row.id }); }
    if (t === 'messages') { const row = { id: nid('msg'), created_at: new Date().toISOString(), ...body }; store.messages.push(row); return one(mode || 'single', { id: row.id }); }
    return mode ? { data: { id: nid('row') }, error: null } : { data: null, error: null };
  }
  if (op === 'update') { filt(store.conversations).forEach((r) => Object.assign(r, body)); return { data: null, error: null }; }
  return { data: null, error: null };
}
function mkq(t) {
  const q = { _t: t, _op: 'select', _mode: null, _f: [] };
  return new Proxy(q, { get(target, prop) {
    if (prop === 'then') { const r = answer(target); return (res) => res(r); }
    if (prop === 'insert' || prop === 'update' || prop === 'upsert') return (b) => { target._op = prop === 'upsert' ? 'insert' : String(prop); target._body = b; return mkqSelf(target); };
    if (prop === 'maybeSingle' || prop === 'single') return () => { target._mode = String(prop); return Promise.resolve(answer(target)); };
    if (prop === 'eq') return (c, v) => { target._f.push((r) => r[c] === v); return mkqSelf(target); };
    if (prop in target) return target[prop];
    return () => mkqSelf(target);
  } });
}
const proxies = new WeakMap();
function mkqSelf(q) {
  if (!proxies.has(q)) proxies.set(q, new Proxy(q, { get(target, prop) {
    if (prop === 'then') { const r = answer(target); return (res) => res(r); }
    if (prop === 'insert' || prop === 'update' || prop === 'upsert') return (b) => { target._op = prop === 'upsert' ? 'insert' : String(prop); target._body = b; return mkqSelf(target); };
    if (prop === 'maybeSingle' || prop === 'single') return () => { target._mode = String(prop); return Promise.resolve(answer(target)); };
    if (prop === 'eq') return (c, v) => { target._f.push((r) => r[c] === v); return mkqSelf(target); };
    if (prop in target) return target[prop];
    return () => mkqSelf(target);
  } }));
  return proxies.get(q);
}
const db = { from: (t) => mkq(t), schema: () => db };
{
  const dbPath = path.join(ROOT, 'src/engine/dist/core/db.js');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: db } };
}

const failingTransport = (label) => ({
  provider: 'deepseek',
  stream: () => ({ on() {}, finalMessage: async () => { throw new Error(`bench-scripted ${label} failure`); } }),
  create: async () => { throw new Error(`bench-scripted ${label} failure`); },
});

(async () => {
  const { runTurn } = require(path.join(ROOT, 'src/engine/dist/core/loop.js'));

  sec('§1 — F-04.86: one model both hands, Victor\'s provider fails — the turn must SURVIVE on Haiku, both hands.');
  {
    nativeCalls.length = 0; store.conversations.length = 0; store.messages.length = 0;
    let r = null, err = null;
    try {
      r = await runTurn({ agentId: AGENT, message: 'Anything pending this week?', tierOverride: 'entry', modelOverride: DEEPSEEK, transport: failingTransport('victor-deepseek') });
    } catch (e) { err = e; }
    T('§1.1 the turn SURVIVES the provider failure (no crash out of runTurn)', err === null && !!r);
    T('§1.2 provider_downgrade rides the TurnResult (spec P5\'s flag)', !!r && r.provider_downgrade === true);
    const victorNative = nativeCalls.filter((c) => c.hand === 'victor');
    T('§1.3 Victor\'s fallback ran NATIVE on Haiku', victorNative.length > 0 && victorNative.every((c) => c.model === HAIKU));
    const donnaNative = nativeCalls.filter((c) => c.hand === 'donna');
    T('§1.4 Donna\'s segment ran (the dispatch was not eaten by the downgrade)', donnaNative.length > 0);
    T('§1.5 THE 404 SHAPE DEAD: her native call carries HAIKU, never the foreign model string', donnaNative.length > 0 && donnaNative.every((c) => c.model === HAIKU));
    T('§1.6 …and no native call anywhere carried the foreign string (the whole turn is coherent)', nativeCalls.every((c) => c.model === HAIKU));
  }

  sec('§2 — F-04.87: her split transport fails — the flag folds up to the TurnResult.');
  {
    nativeCalls.length = 0; store.conversations.length = 0; store.messages.length = 0;
    let r = null, err = null;
    try {
      r = await runTurn({ agentId: AGENT, message: 'Anything pending this week?', tierOverride: 'entry', donnaTransport: failingTransport('donna-deepseek'), donnaModelOverride: DEEPSEEK });
    } catch (e) { err = e; }
    T('§2.1 the turn SURVIVES her provider failure', err === null && !!r);
    T('§2.2 HER downgrade reaches the TurnResult (the L3 blindness cured)', !!r && r.provider_downgrade === true);
    const donnaNative = nativeCalls.filter((c) => c.hand === 'donna');
    T('§2.3 her fallback ran NATIVE on Haiku', donnaNative.length > 0 && donnaNative.every((c) => c.model === HAIKU));
    T('§2.4 Victor was never downgraded (his leg was native all along — the flag is honest, not sticky-wrong)', nativeCalls.filter((c) => c.hand === 'victor').every((c) => c.model === HAIKU));
  }

  sec('§3 — the floor: a clean native turn carries NO flag (the cure adds nothing to clean turns).');
  {
    nativeCalls.length = 0; store.conversations.length = 0; store.messages.length = 0;
    const r = await runTurn({ agentId: AGENT, message: 'Anything pending this week?', tierOverride: 'entry' });
    T('§3.1 clean turn, no flag', !!r && r.provider_downgrade === undefined);
    T('§3.2 both hands native Haiku, as ever', nativeCalls.length > 0 && nativeCalls.every((c) => c.model === HAIKU));
  }

  console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}  ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH CRASH:', e && e.stack || e); process.exit(1); });
