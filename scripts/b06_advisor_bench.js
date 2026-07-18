#!/usr/bin/env node
// scripts/b06_advisor_bench.js — TDW_06 P6a (S-10): THE ADVISOR SITTING, engine ZIP.
// Runnable from any working directory, clean clone, no npm install:
//   node scripts/b06_advisor_bench.js
//
// WHAT IT PROVES (acceptance §4, mechanically — LD-5: behaviour, never wording):
//  §1 THE ADVISORY ROOM (engine.agents.victor_mode='advisor', 0080):
//     · victor_mode rides the TurnResult as 'advisor'
//     · the tools offered EXCLUDE dear_donna_talk (Donna dispatches DISABLED — filing
//       paused at the source, not by detection) and INCLUDE jot_advice
//     · the Codex PULL is retained: dear_donna_handbook still offered (A-3 — a codex
//       read is not an estate read)
//     · the advisor LENS is in the cached system prompt; the ESTATE is NOT (no
//       [Donna's snapshot] — no claim surface, no donor pool)
//     · jot_advice fires -> a real owner_notes row is written (D-1's witness), and the
//       turn's tool_calls carry jot_advice with ZERO dear_donna_talk / ZERO donna_calls
//  §2 THE BUSINESS ROOM (victor_mode='business') — the control, A-2 (business path
//     untouched): dear_donna_talk offered, the estate present, NO advisor lens,
//     victor_mode='business'. Proves the advisor branch is MODE-GATED, not global.
//
// BOTH-WAYS: every §1 assertion is FALSE at the uncured tree — before loop.ts learned
// `isAdvisor`, an 'advisory' room offered dear_donna_talk, had no jot_advice, and
// surfaced no victor_mode. The D-11 dist gate (sentinel = 'isAdvisor') guarantees the
// behavioural sections run ONLY against a dist that carries the cure; a stale/uncured
// dist falls to source assertions that themselves fail without the identifier.
//
// DISCLOSED RIG: the REAL compiled runTurn (dist) with @anthropic-ai/sdk fenced to a
// spy BEFORE dist loads (the system prompt + tools Victor is handed are the witnesses;
// no network, no key), and a stateful db double that also serves the vendorIdFromAgent
// reverse chain so jot_advice's public.owner_notes write is captured, not mocked away.
'use strict';

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('  PASS  ' + label); } else { fail++; console.log('  FAIL  ' + label); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

const ADVISOR_AGENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VENDOR_ID = 'vvvvvvvv-vvvv-4vvv-8vvv-vvvvvvvvvvvv';

sec("§0 — D-11: the dist gate (sentinel = 'isAdvisor', the advisor branch's own identifier).");
const { distGate } = require(path.join(__dirname, 'lib', 'dist_gate'));
const gate = distGate({
  sentinel: 'isAdvisor',
  srcPath: path.join(ROOT, 'src/engine/src/core/loop.ts'),
  distPath: path.join(ROOT, 'src/engine/dist/core/loop.js'),
  benchCmd: 'scripts/b06_advisor_bench.js',
});
if (!gate.runDist) {
  console.log('  … the behavioural sections SKIP per the gate; source assertions carry:');
  const loopSrc = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/loop.ts'), 'utf8');
  const lensSrc = fs.existsSync(path.join(ROOT, 'src/engine/src/core/advisorLens.ts'))
    ? fs.readFileSync(path.join(ROOT, 'src/engine/src/core/advisorLens.ts'), 'utf8') : '';
  const jotSrc = fs.existsSync(path.join(ROOT, 'src/engine/src/core/tools/jotAdvice.ts'))
    ? fs.readFileSync(path.join(ROOT, 'src/engine/src/core/tools/jotAdvice.ts'), 'utf8') : '';
  T('source: loop learns the advisor room, gated on !isConsult', /isAdvisor = !isConsult && \(agent\.victor_mode/.test(loopSrc));
  T('source: the advisor branch drops dear_donna_talk and adds jot_advice', /if \(isAdvisor\) \{[\s\S]*JOT_ADVICE_TOOL/.test(loopSrc) && !/if \(isAdvisor\)[\s\S]*DEAR_DONNA_TALK_TOOL/.test(loopSrc.slice(loopSrc.indexOf('if (isAdvisor)'), loopSrc.indexOf('} else if (!isConsult)'))));
  T('source: the estate is gated out (estateInRoom)', /const estateInRoom = !isConsult && !isAdvisor/.test(loopSrc));
  T('source: victor_mode rides the TurnResult', /victor_mode: isConsult \? undefined : \(isAdvisor \? 'advisor' : 'business'\)/.test(loopSrc));
  T('source: the lens exists and carries the redirect verbatim', /flip me to business mode and it's filed/.test(lensSrc));
  T('source: jot_advice writes owner_notes via the reverse bridge', /vendorIdFromAgent/.test(jotSrc) && /owner_notes/.test(jotSrc));
  console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}  ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

// ── the SDK spy, fenced BEFORE dist loads ────────────────────────────────────
const calls = []; // { tools:[names], system:'...', model }
function scriptFor(params) {
  const toolNames = (params.tools || []).map((t) => t.name);
  const system = (Array.isArray(params.system) ? params.system.map((b) => b.text || '').join('\n') : String(params.system || ''));
  calls.push({ tools: toolNames, system, model: params.model });
  const isAdvisorTurn = toolNames.includes('jot_advice');
  const alreadyActed = (params.messages || []).some((m) => Array.isArray(m.content) && m.content.some((b) => b.type === 'tool_result'));
  if (isAdvisorTurn && !alreadyActed) {
    return {
      content: [{ type: 'tool_use', id: 'ja-1', name: 'jot_advice', input: { note: 'Post your December-wedding portfolio in October — the mothers search then.' } }],
      usage: { input_tokens: 10, output_tokens: 5 },
    };
  }
  return { content: [{ type: 'text', text: "Here's your move this season." }], usage: { input_tokens: 10, output_tokens: 5 } };
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

// ── the db double: stateful, and it serves the vendorIdFromAgent reverse chain ──
const store = { conversations: [], messages: [], ownerNotes: [], ids: 0 };
const nid = (p) => `${p}-${++store.ids}`;
let cur = { victor_mode: 'advisor', mode: 'advisory' };

function eqcol(q, col) { return (q._eqcols || []).find((e) => e.col === col); }
function answer(q) {
  const t = q._t, op = q._op, mode = q._mode, body = q._body;
  const filt = (rows) => { let r = rows; for (const fn of q._f) r = r.filter(fn); return r; };
  const one = (row) => ({ data: row, error: null });
  if (op === 'select') {
    if (t === 'agents') return one({ id: ADVISOR_AGENT, user_id: 'eng-user', tier: 'entry', display_name: 'Advisor Bench Vendor', profession_preset: 'photographer', timezone: 'Asia/Kolkata', mode: cur.mode, victor_mode: cur.victor_mode });
    if (t === 'users') {
      // vendorIdFromAgent walks engine.users (by id) then public.users (by auth_user_id).
      if (eqcol(q, 'auth_user_id')) return one({ id: 'pub-user' });   // public.users
      return one({ auth_user_id: 'auth-1' });                          // engine.users
    }
    if (t === 'vendors') return { data: [{ id: VENDOR_ID }], error: null }; // exactly one -> resolves
    if (t === 'agent_owner') return one({ owner_name: 'Dev', owner_descriptor: 'a wedding photographer in Delhi', note: 'Building his studio brand.', consult_done: true });
    if (t === 'domain_handbooks') return one({ field: 'photographer', title: 'THE FRAME', index_md: '## INDEX\n- §1 Foundations', full_md: '# THE FRAME\n\n## §1 Foundations\n\nDo the work.' });
    if (t === 'conversations') return one(filt(store.conversations)[0] ?? null);
    if (t === 'messages') return { data: filt(store.messages), error: null };
    if (t === 'agent_snapshot') return one({ note: { items: [], rebuilt_at: '2026-07-18T00:00:00Z' } });
    return mode ? { data: null, error: null } : { data: [], error: null };
  }
  if (op === 'insert') {
    if (t === 'conversations') { const row = { id: nid('conv'), agent_id: ADVISOR_AGENT, state: 'active', last_active_at: new Date().toISOString(), ...body }; store.conversations.unshift(row); return one({ id: row.id }); }
    if (t === 'messages') { const row = { id: nid('msg'), created_at: new Date().toISOString(), ...body }; store.messages.push(row); return one({ id: row.id }); }
    if (t === 'owner_notes') { const row = { id: nid('note'), created_at: new Date().toISOString(), ...body }; store.ownerNotes.push(row); return one({ id: row.id }); }
    return mode ? one({ id: nid('row') }) : { data: null, error: null };
  }
  if (op === 'update') { filt(store.conversations).forEach((r) => Object.assign(r, body)); return { data: null, error: null }; }
  return { data: null, error: null };
}
function proxy(q) {
  return new Proxy(q, { get(target, prop) {
    if (prop === 'then') { const r = answer(target); return (res) => res(r); }
    if (prop === 'insert' || prop === 'update' || prop === 'upsert') return (b) => { target._op = prop === 'upsert' ? 'insert' : String(prop); target._body = b; return proxy(target); };
    if (prop === 'maybeSingle' || prop === 'single') return () => { target._mode = String(prop); return Promise.resolve(answer(target)); };
    if (prop === 'eq') return (c, v) => { target._f.push((r) => r[c] === v); (target._eqcols = target._eqcols || []).push({ col: c, val: v }); return proxy(target); };
    if (prop in target) return target[prop];
    return () => proxy(target);
  } });
}
const mkq = (t) => proxy({ _t: t, _op: 'select', _mode: null, _f: [], _eqcols: [] });
const db = { from: (t) => mkq(t), schema: () => db };
{
  const dbPath = path.join(ROOT, 'src/engine/dist/core/db.js');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: db } };
}

(async () => {
  const { runTurn } = require(path.join(ROOT, 'src/engine/dist/core/loop.js'));

  sec('§1 — THE ADVISORY ROOM: victor_mode=advisor. Filing paused, the estate gone, jot_advice the only hand.');
  {
    calls.length = 0; store.conversations.length = 0; store.messages.length = 0; store.ownerNotes.length = 0;
    cur = { victor_mode: 'advisor', mode: 'advisory' };
    const r = await runTurn({ agentId: ADVISOR_AGENT, message: 'What should I be posting this muhurat season?', tierOverride: 'entry' });
    const first = calls[0] || { tools: [], system: '' };

    T('§1.1 victor_mode rides the TurnResult as "advisor"', r && r.victor_mode === 'advisor');
    T('§1.2 dear_donna_talk is NOT offered (Donna dispatches disabled — filing paused at source)', !first.tools.includes('dear_donna_talk'));
    T('§1.3 jot_advice IS offered (the one hand in the room)', first.tools.includes('jot_advice'));
    T('§1.4 dear_donna_handbook IS retained (the codex pull — a read, not an estate read)', first.tools.includes('dear_donna_handbook'));
    T('§1.5 the advisor LENS is in the cached system prompt', /THE ADVISORY ROOM/.test(first.system));
    T('§1.6 the ESTATE is absent — no [Donna\'s snapshot] in the prompt (no claim surface)', !/\[Donna's snapshot/.test(first.system));
    T('§1.7 the owner is KEPT (A-3) — the owner block is present', /\[Your owner/.test(first.system));

    const jotCalls = (r.tool_calls || []).filter((c) => c.name === 'jot_advice');
    const donnaish = (r.tool_calls || []).filter((c) => c.name === 'dear_donna_talk' || c.name === 'listen_harvey_talk' || (c.donna_calls && c.donna_calls.length));
    T('§1.8 jot_advice fired and a real owner_notes row was written (D-1 witness)', store.ownerNotes.length === 1 && store.ownerNotes[0].vendor_id === VENDOR_ID && /December-wedding portfolio/.test(store.ownerNotes[0].body));
    T('§1.9 tool_calls carry jot_advice, and ZERO Donna dispatches (filing paused, mechanically)', jotCalls.length === 1 && donnaish.length === 0);
  }

  sec('§2 — THE BUSINESS ROOM (control): victor_mode=business. The path A-2 leaves untouched.');
  {
    calls.length = 0; store.conversations.length = 0; store.messages.length = 0; store.ownerNotes.length = 0;
    cur = { victor_mode: 'business', mode: 'advisory' };
    const r = await runTurn({ agentId: ADVISOR_AGENT, message: 'Book Meera\'s shoot for 14 February.', tierOverride: 'entry' });
    const first = calls[0] || { tools: [], system: '' };

    T('§2.1 victor_mode rides the TurnResult as "business"', r && r.victor_mode === 'business');
    T('§2.2 dear_donna_talk IS offered (Donna enabled — the business path is unchanged)', first.tools.includes('dear_donna_talk'));
    T('§2.3 jot_advice is NOT offered in the business room', !first.tools.includes('jot_advice'));
    T('§2.4 the advisor lens is NOT in the business prompt (mode-gated, not global)', !/THE ADVISORY ROOM/.test(first.system));
    T('§2.5 the ESTATE is present — [Donna\'s snapshot] rides the business prompt', /\[Donna's snapshot/.test(first.system));
    T('§2.6 no advisor note was written (jot_advice unreachable here)', store.ownerNotes.length === 0);
  }

  console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}  ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
