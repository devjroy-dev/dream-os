#!/usr/bin/env node
// scripts/b06_sonnet_bench.js — TDW_06 ECONOMICS SITTING, CE ruling E-3:
// F-04.85 CLOSED — ZERO SONNET REACHABLE FROM ANY TIER. Runnable from any
// working directory, clean clone, no npm install:
//   node scripts/b06_sonnet_bench.js
//
// THE TWO LIVE PATHS THIS CLOSES (F-04.85 as filed): (1) prestige STARTED on
// Sonnet (tier map top -> startModelForTier -> MODELS.sonnet); (2) signature's
// escalate ladder REACHED Sonnet (loop.ts's handler on the mid tier's tool).
// THE CURE (E-3, mechanism chosen with the code's evidence, recorded in
// models.ts's own comments): every rung of the ladder starts Haiku (cached —
// the native path keeps Victor's prompt cache) · the escalate tool NEVER
// BOARDS (removal over retargeting: escalation is a full clean re-run, so an
// escalate-to-Haiku would only double the turn's cost and wipe Donna's
// exchange for zero model change) · the handler survives as a DEFENSIVE
// TOMBSTONE retargeting Haiku against foreign injection.
//
// WHAT THIS BENCH DRIVES, disclosed:
//  §1 the ladder's one home (REAL dist models.js): startModelForTier is Haiku
//     for entry, mid, AND top; canEscalate false for all three.
//  §2 the REAL compiled runTurn at tier 'top' (the prestige shape), SDK fenced
//     to spies BEFORE dist loads: the FIRST native call carries HAIKU — the
//     start-path closed behaviourally, not just at the table.
//  §3 tier 'mid' (the signature shape): the tools Victor's call carries include
//     NO 'escalate' — the ladder's second path closed at the boarding gate.
//  §4 the defensive tombstone (source): the handler retargets Haiku, never
//     Sonnet — the injection defense stated in the bytes.
//
// Regression-proofed both ways: at the pre-E-3 tree, §1 fails on both functions,
// §2 witnesses SONNET on the first top-tier call, §3 finds the escalate tool
// aboard, §4 finds `MODELS.sonnet` at the handler — fails on exactly the cure.
// A stale dist SKIPS STATED per D-11 (sentinel = the E-3 comment's own marker).
'use strict';

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('  PASS  ' + label); } else { fail++; console.log('  FAIL  ' + label); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

const HAIKU = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-4-6';
const AGENT = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

sec('§0 — D-11: the dist gate (sentinel = the E-3 cure marker in models).');
const { distGate } = require(path.join(__dirname, 'lib', 'dist_gate'));
const gate = distGate({
  sentinel: 'zero Sonnet reachable from any tier',
  srcPath: path.join(ROOT, 'src/engine/src/core/models.ts'),
  distPath: path.join(ROOT, 'src/engine/dist/core/models.js'),
  benchCmd: 'scripts/b06_sonnet_bench.js',
});

sec('§4 — the defensive tombstone (source; runs in every world).');
{
  const loopSrc = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/loop.ts'), 'utf8');
  const escBlock = loopSrc.slice(loopSrc.indexOf("t.name === 'escalate'"), loopSrc.indexOf("t.name === 'escalate'") + 1400);
  T('§4.1 the escalate handler retargets HAIKU (the injection defense), never Sonnet', /model = MODELS\.haiku;/.test(escBlock) && !/model = MODELS\.sonnet/.test(escBlock));
}

if (!gate.runDist) {
  const modelsSrc = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/models.ts'), 'utf8');
  console.log('  … §1–§3 dist-driven assertions SKIP per the gate; source assertions carry:');
  T('source: startModelForTier returns Haiku unconditionally', /return MODELS\.haiku;\s*\n\}/.test(modelsSrc.slice(modelsSrc.indexOf('startModelForTier'))));
  T('source: canEscalate returns false (the tool never boards)', /return false; \/\/ E-3/.test(modelsSrc));
  console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}  ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

// ── SDK spy fenced before dist loads (the b06_downgrade_bench convention) ────
const nativeCalls = [];
function scriptFor(params) {
  const names = (params.tools || []).map((t) => t.name);
  const isDonna = names.includes('listen_harvey_talk');
  nativeCalls.push({ hand: isDonna ? 'donna' : 'victor', model: params.model, toolNames: names });
  if (isDonna) return { content: [{ type: 'tool_use', id: 'lh-1', name: 'listen_harvey_talk', input: { message: 'Nothing pending.' } }], usage: { input_tokens: 10, output_tokens: 5 } };
  return { content: [{ type: 'text', text: 'All quiet.' }], usage: { input_tokens: 10, output_tokens: 5 } };
}
const Module = require('module');
const _load = Module._load;
Module._load = function (req) {
  if (req === '@anthropic-ai/sdk') {
    function Anthropic() { this.messages = { create: async (p) => scriptFor(p), stream: (p) => ({ on() {}, finalMessage: async () => scriptFor(p) }) }; }
    Anthropic.default = Anthropic;
    return Anthropic;
  }
  return _load.apply(this, arguments);
};

// db double (the downgrade bench's slim shape)
const store = { conversations: [], messages: [], ids: 0 };
const nid = (p) => `${p}-${++store.ids}`;
function answer(q) {
  const t = q._t, op = q._op, mode = q._mode, body = q._body;
  const filt = (rows) => { let r = rows; for (const fn of q._f) r = r.filter(fn); return r; };
  const one = (m, row) => ({ data: row, error: null });
  if (op === 'select') {
    if (t === 'agents') return one(mode, { id: AGENT, user_id: 'u', tier: 'entry', display_name: 'Sonnet Bench Vendor', profession_preset: null, timezone: 'Asia/Kolkata', mode: 'advisory' });
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
  const self = new Proxy(q, { get(target, prop) {
    if (prop === 'then') { const r = answer(target); return (res) => res(r); }
    if (prop === 'insert' || prop === 'update' || prop === 'upsert') return (b) => { target._op = prop === 'upsert' ? 'insert' : String(prop); target._body = b; return self; };
    if (prop === 'maybeSingle' || prop === 'single') return () => { target._mode = String(prop); return Promise.resolve(answer(target)); };
    if (prop === 'eq') return (c, v) => { target._f.push((r) => r[c] === v); return self; };
    if (prop in target) return target[prop];
    return () => self;
  } });
  return self;
}
const db = { from: (t) => mkq(t), schema: () => db };
{
  const dbPath = path.join(ROOT, 'src/engine/dist/core/db.js');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: db } };
}

(async () => {
  sec('§1 — the ladder\'s one home (REAL dist models.js).');
  {
    const m = require(path.join(ROOT, 'src/engine/dist/core/models.js'));
    T('§1.1 entry starts Haiku', m.startModelForTier('entry') === HAIKU);
    T('§1.2 mid starts Haiku', m.startModelForTier('mid') === HAIKU);
    T('§1.3 TOP STARTS HAIKU (F-04.85 path one closed)', m.startModelForTier('top') === HAIKU);
    T('§1.4 no rung starts Sonnet', ['entry', 'mid', 'top'].every((t2) => m.startModelForTier(t2) !== SONNET));
    T('§1.5 canEscalate false for EVERY tier (path two closed at the gate)', ['entry', 'mid', 'top'].every((t2) => m.canEscalate(t2) === false));
  }

  const { runTurn } = require(path.join(ROOT, 'src/engine/dist/core/loop.js'));

  sec('§2 — tier TOP (the prestige shape), the REAL compiled loop: the first call is HAIKU.');
  {
    nativeCalls.length = 0; store.conversations.length = 0; store.messages.length = 0;
    const r = await runTurn({ agentId: AGENT, message: 'All quiet this week?', tierOverride: 'top' });
    const first = nativeCalls[0];
    T('§2.1 the turn ran', !!r && typeof r.reply === 'string');
    T('§2.2 the FIRST native call carries HAIKU, never Sonnet (the start-path, behaviourally)', !!first && first.model === HAIKU);
    T('§2.3 NO call in the whole turn carried Sonnet', nativeCalls.every((c) => c.model !== SONNET));
  }

  sec('§3 — tier MID (the signature shape): the escalate tool never boards.');
  {
    nativeCalls.length = 0; store.conversations.length = 0; store.messages.length = 0;
    const r = await runTurn({ agentId: AGENT, message: 'All quiet this week?', tierOverride: 'mid' });
    const victor = nativeCalls.filter((c) => c.hand === 'victor');
    T('§3.1 the turn ran on mid', !!r);
    T('§3.2 Victor\'s tools carry NO escalate (the boarding gate closed)', victor.length > 0 && victor.every((c) => !c.toolNames.includes('escalate')));
    T('§3.3 mid runs Haiku whole', nativeCalls.every((c) => c.model === HAIKU));
    T('§3.4 escalated never fired', r.escalated === false);
  }

  console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}  ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH CRASH:', e && e.stack || e); process.exit(1); });
