#!/usr/bin/env node
// scripts/b06_0081_bench.js — TDW_06 P6a (S-10): the 0081 rider's code half.
// Runnable from any working directory, clean clone, no npm install:
//   node scripts/b06_0081_bench.js
//
// WHAT IT PROVES (the 0081 GATE, mechanically, on the REAL compiled seams —
// runTurn drives saveMessage + loadThread + the wrapper; the DB is a double that
// captures the rows and can toggle the meta column present/absent):
//  §1 THE MODE STAMP + THE ASYMMETRY: an advisor assistant row is inserted with
//     meta {"mode":"advisor"}; a BUSINESS row is BARE (no meta key at all — a
//     stamp always MEANS advisor, its absence is never ambiguous). This is also
//     the S1-S4-untouched proof at the row level: business writes carry no mark.
//  §2 THE TOMBSTONE STAMP: an outage (the model call throws, native anthropic)
//     drives the wrapper's catch — the tombstone row lands with BOTH meta
//     {"tombstone":true} (the durable mark) AND the blessed content (the interim's
//     key).
//  §3 loadThread EXCLUSION (F-06.3's durable cure): a thread carrying two
//     tombstone rows — one meta-stamped (post-0081) and one content-only (pre-0081,
//     meta null) — replays NEITHER; the real user/assistant pair is kept. Read
//     off the SDK spy's params.messages (the actual replayed thread the model saw).
//  §4 PRE-DDL DEGRADE: with the meta column ABSENT, saveMessage still writes the
//     row (bare, no crash) and loadThread still degrades and EXCLUDES the tombstone
//     by content-match. An unapplied 0081 never loses a message or echoes a
//     tombstone.
//
// D-11 dist gate (sentinel = 'tombstone: true', the wrapper's own 0081 mark).
'use strict';

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('  PASS  ' + label); } else { fail++; console.log('  FAIL  ' + label); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

const AGENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CONV = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const TOMBSTONE = 'ERROR — no reply was generated (provider failure). Nothing was done.';

sec("§0 — D-11: the dist gate (sentinel = 'tombstone: true', the 0081 wrapper mark).");
const { distGate } = require(path.join(__dirname, 'lib', 'dist_gate'));
const gate = distGate({
  sentinel: 'tombstone: true',
  srcPath: path.join(ROOT, 'src/engine/src/core/loop.ts'),
  distPath: path.join(ROOT, 'src/engine/dist/core/loop.js'),
  benchCmd: 'scripts/b06_0081_bench.js',
});
if (!gate.runDist) {
  console.log('  … the behavioural sections SKIP per the gate; source assertions carry:');
  const loopSrc = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/loop.ts'), 'utf8');
  const memSrc = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/memory.ts'), 'utf8');
  T('source: the assistant save stamps mode on advisor rows only', /isAdvisor \? \{ mode: 'advisor' \} : undefined/.test(loopSrc));
  T('source: the wrapper stamps the tombstone row', /TOMBSTONE, undefined, \{ tombstone: true \}/.test(loopSrc));
  T('source: saveMessage carries meta + the pre-DDL guard', /if \(meta !== undefined && meta !== null\) row\.meta = meta/.test(memSrc) && /messages\.meta absent/.test(memSrc));
  T('source: loadThread excludes tombstones + degrades', /!isTombstone\(r\)/.test(memSrc) && /reading without it/.test(memSrc));
  console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}  ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

// ── the SDK spy, fenced BEFORE dist loads. Captures params.messages (the replayed
//    thread) and can be told to THROW (drives the wrapper's tombstone catch). ──
let sdkShouldThrow = false;
const seen = { messages: null };
function scriptFor(params) {
  seen.messages = params.messages || [];
  if (sdkShouldThrow) throw new Error('bench-scripted provider failure (outage)');
  return { content: [{ type: 'text', text: 'Noted.' }], usage: { input_tokens: 10, output_tokens: 5 } };
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

// ── the db double: captures message inserts (with meta) and serves loadThread.
//    metaColumnPresent=false simulates a pre-0081 database (errors on any meta
//    read/write, exactly as PostgREST would). ──
let metaColumnPresent = true;
let curVictorMode = 'business';
const store = { messages: [], ids: 0 };
const nid = (p) => `${p}-${++store.ids}`;
const metaErr = { data: null, error: { message: 'column messages.meta does not exist' } };

function answer(q) {
  const t = q._t, op = q._op, mode = q._mode, body = q._body, cols = q._cols || '';
  const filt = (rows) => { let r = rows; for (const fn of q._f) r = r.filter(fn); return r; };
  const one = (row) => ({ data: row, error: null });
  if (op === 'select') {
    if (t === 'agents') return one({ id: AGENT, user_id: 'u', tier: 'entry', display_name: 'Meta Bench', profession_preset: 'photographer', timezone: 'Asia/Kolkata', mode: 'advisory', victor_mode: curVictorMode });
    if (t === 'agent_owner') return one({ owner_name: 'Dev', owner_descriptor: 'a photographer', note: 'x', consult_done: true });
    if (t === 'domain_handbooks') return one(null); // no handbook -> no pull tool; irrelevant here
    if (t === 'conversations') return one({ id: CONV, agent_id: AGENT, state: 'active', last_active_at: new Date().toISOString() });
    if (t === 'messages') {
      if (/\bmeta\b/.test(cols) && !metaColumnPresent) return metaErr; // pre-0081: the meta read errors
      let rows = filt(store.messages);
      rows = [...rows].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))); // created_at desc
      if (q._limit) rows = rows.slice(0, q._limit);
      return { data: rows, error: null };
    }
    if (t === 'agent_snapshot') return one({ note: { items: [], rebuilt_at: '2026-07-18T00:00:00Z' } });
    return mode ? one(null) : { data: [], error: null };
  }
  if (op === 'insert') {
    if (t === 'messages') {
      if (body && body.meta !== undefined && !metaColumnPresent) return metaErr; // pre-0081: the meta write errors -> saveMessage retries bare
      const row = { id: nid('msg'), created_at: new Date(Date.now() + store.ids).toISOString(), ...body };
      store.messages.push(row);
      return one({ id: row.id });
    }
    if (t === 'conversations') return one({ id: CONV });
    return mode ? one({ id: nid('row') }) : { data: null, error: null };
  }
  if (op === 'update') return { data: null, error: null };
  return { data: null, error: null };
}
function proxy(q) {
  return new Proxy(q, { get(target, prop) {
    if (prop === 'then') { const r = answer(target); return (res) => res(r); }
    if (prop === 'select') return (c) => { target._cols = String(c || ''); return proxy(target); };
    if (prop === 'insert' || prop === 'update' || prop === 'upsert') return (b) => { target._op = prop === 'upsert' ? 'insert' : String(prop); target._body = b; return proxy(target); };
    if (prop === 'maybeSingle' || prop === 'single') return () => { target._mode = String(prop); return Promise.resolve(answer(target)); };
    if (prop === 'eq') return (c, v) => { target._f.push((r) => r[c] === v); return proxy(target); };
    if (prop === 'in') return (c, vs) => { target._f.push((r) => vs.includes(r[c])); return proxy(target); };
    if (prop === 'limit') return (n) => { target._limit = n; return proxy(target); };
    if (prop in target) return target[prop];
    return () => proxy(target);
  } });
}
const mkq = (t) => proxy({ _t: t, _op: 'select', _mode: null, _f: [], _cols: '', _limit: 0 });
const db = { from: (t) => mkq(t), schema: () => db };
{
  const dbPath = path.join(ROOT, 'src/engine/dist/core/db.js');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: db } };
}

const msgRows = () => store.messages.filter((m) => m.role === 'assistant' || m.role === 'user');
const lastAssistant = () => [...store.messages].reverse().find((m) => m.role === 'assistant');

(async () => {
  const { runTurn } = require(path.join(ROOT, 'src/engine/dist/core/loop.js'));

  sec('§1 — THE MODE STAMP + THE ASYMMETRY (advisor stamped, business bare).');
  {
    metaColumnPresent = true; store.messages.length = 0;
    curVictorMode = 'advisor';
    await runTurn({ agentId: AGENT, message: 'What should I post?', conversationId: CONV, tierOverride: 'entry' });
    const adv = lastAssistant();
    T('§1.1 the advisor assistant row carries meta {"mode":"advisor"}', !!adv && adv.meta && adv.meta.mode === 'advisor');

    store.messages.length = 0;
    curVictorMode = 'business';
    await runTurn({ agentId: AGENT, message: 'Book Meera for the 14th.', conversationId: CONV, tierOverride: 'entry' });
    const biz = lastAssistant();
    T('§1.2 the business assistant row is BARE — no meta key at all (the asymmetry)', !!biz && !('meta' in biz));
  }

  sec('§2 — THE TOMBSTONE STAMP (an outage → the wrapper marks the row, durable + interim).');
  {
    metaColumnPresent = true; store.messages.length = 0; curVictorMode = 'business';
    sdkShouldThrow = true;
    let threw = false;
    try { await runTurn({ agentId: AGENT, message: 'anything?', conversationId: CONV, tierOverride: 'entry' }); }
    catch (e) { threw = true; }
    sdkShouldThrow = false;
    const tomb = lastAssistant();
    T('§2.1 the outage propagated (the door still sees the failure — the wrapper never masks it)', threw === true);
    T('§2.2 a tombstone row landed with the blessed content (the interim key)', !!tomb && tomb.content === TOMBSTONE);
    T('§2.3 …and with meta {"tombstone":true} (the durable mark)', !!tomb && tomb.meta && tomb.meta.tombstone === true);
    T('§2.4 the tombstone is an assistant row on the orphaned thread (no reply denied)', !!tomb && tomb.role === 'assistant');
  }

  sec('§3 — loadThread EXCLUSION (a tombstoned thread never replays the tombstone).');
  {
    metaColumnPresent = true; store.messages.length = 0; curVictorMode = 'business'; seen.messages = null;
    // Seed: a real pair, then TWO tombstones — one post-0081 (meta) and one pre-0081 (content only).
    const t0 = Date.now();
    store.messages.push({ id: 'm1', conversation_id: CONV, role: 'user', content: 'Real question one.', created_at: new Date(t0 + 1).toISOString() });
    store.messages.push({ id: 'm2', conversation_id: CONV, role: 'assistant', content: 'Real answer one.', created_at: new Date(t0 + 2).toISOString() });
    store.messages.push({ id: 'm3', conversation_id: CONV, role: 'assistant', content: TOMBSTONE, meta: { tombstone: true }, created_at: new Date(t0 + 3).toISOString() });
    store.messages.push({ id: 'm4', conversation_id: CONV, role: 'assistant', content: TOMBSTONE, created_at: new Date(t0 + 4).toISOString() }); // pre-0081: no meta
    await runTurn({ agentId: AGENT, message: 'Real question two.', conversationId: CONV, tierOverride: 'entry' });
    const replayed = (seen.messages || []).map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)));
    const replayedText = replayed.join('\n');
    T('§3.1 the real pair replayed (Victor still has his thread)', /Real question one/.test(replayedText) && /Real answer one/.test(replayedText));
    T('§3.2 NEITHER tombstone replayed (no next-turn echo — both marks excluded)', !replayedText.includes(TOMBSTONE));
    T('§3.3 the new turn ran on the cleaned thread', /Real question two/.test(replayedText));
  }

  sec('§4 — PRE-DDL DEGRADE (meta column ABSENT: no crash, no lost row, tombstone still excluded).');
  {
    metaColumnPresent = false; store.messages.length = 0; curVictorMode = 'advisor'; seen.messages = null;
    let r = null, err = null;
    try { r = await runTurn({ agentId: AGENT, message: 'What should I post?', conversationId: CONV, tierOverride: 'entry' }); }
    catch (e) { err = e; }
    const adv = lastAssistant();
    T('§4.1 the advisor turn SURVIVED with no meta column (saveMessage degraded, no crash)', err === null && !!r);
    T('§4.2 the row was written BARE (the mark dropped, never the message)', !!adv && adv.role === 'assistant' && !('meta' in adv));

    // Seed a pre-0081 tombstone (content only) and confirm loadThread still excludes it with no meta column.
    store.messages.length = 0; seen.messages = null;
    const t0 = Date.now();
    store.messages.push({ id: 'p1', conversation_id: CONV, role: 'user', content: 'Pre-DDL question.', created_at: new Date(t0 + 1).toISOString() });
    store.messages.push({ id: 'p2', conversation_id: CONV, role: 'assistant', content: TOMBSTONE, created_at: new Date(t0 + 2).toISOString() });
    await runTurn({ agentId: AGENT, message: 'Next.', conversationId: CONV, tierOverride: 'entry' });
    const replayedText = (seen.messages || []).map((m) => (typeof m.content === 'string' ? m.content : '')).join('\n');
    T('§4.3 loadThread degraded AND still excluded the tombstone by content-match', /Pre-DDL question/.test(replayedText) && !replayedText.includes(TOMBSTONE));
  }

  console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}  ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
