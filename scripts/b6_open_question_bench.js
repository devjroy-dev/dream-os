#!/usr/bin/env node
// scripts/b6_open_question_bench.js — TDW_06 D-6: F-04.81's MECHANICAL HALF.
// Runnable from any working directory, clean clone, no npm install (Q-SP-5):
//   node scripts/b6_open_question_bench.js
//
// WHAT THIS BENCH DRIVES, disclosed:
//  §1 THE CE'S NAMED TEST, FIRST — the 17:08:36 specimen from the outage
//     evening's own rows: Donna searched four ways, found nothing, and ended her
//     segment speaking "Want me to log her as a fresh lead?" — pendingToolUseId
//     set, ZERO write hands in the nested donna_calls. The line MUST be present,
//     byte-exact in the builder (the CE's minted copy) and firewall-rendered in
//     storage (Donna -> Operator, CE-18/F-04.27 — asserted so the veto answer
//     has the rendered truth in front of it). Then: a healthy read turn with no
//     open question -> NO line; a filed turn -> witness line, NO open line (both
//     the empty-question shape and the write-hand-fired guard clause).
//     All through the REAL donnaOpenLine -> REAL composedTail -> REAL
//     persistComposedReply against a capturing double (b6_witness_bench's rig,
//     carried), the REAL scrubText behind them.
//  §2 the fences: her VOICE is not a hand (nested listen_harvey_talk never
//     convicts); the top level is never walked (dear_donna_talk is not a hand);
//     an errored READ is not a write hand (the guard counts hands, not errors);
//     a whitespace-only question never lines.
//  §3 additivity + order: composedTail without `open` returns pre-D-6 bytes
//     exactly; with it, the open line rides LAST (stored order == live order,
//     the twins clause); empty open == absent open.
//  §4 THE ENGINE LEG — the REAL COMPILED runTurn (src/engine/dist) with a scoped
//     Module._load shim over db.js ONLY (transport doubles ride runTurn's own
//     seams; the loop under test is the build's own bytes): listen-ALONE sets
//     pendingDonnaQuestion to her exact sentence; work+listen mixed leaves it
//     absent; a resumed exchange that RESOLVES her clears it; a turn with no
//     Donna at all carries nothing. When dist is absent (clean clone), §4 marks
//     itself SKIPPED with its count stated and falls to source assertions — the
//     engine gates carry behaviour there (the b6_door_rider precedent).
//
// Ruling trail: D-6 (trigger = donna.ts:519's pendingToolUseId, set exactly on
// listen-ALONE; siting = loop.ts + TurnResult.pendingDonnaQuestion; guard = turn
// ended AND question non-empty AND zero write hands in nested donna_calls, the
// only convicting reader per D-1; the line rides the witness machinery's home —
// composedTail for persistence, the wire for live; copy minted for founder veto)
// · the §0.2 report it executes · Q-R-3's mechanical-signal aesthetic.
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// ── the ratified doubles: the ledger shim + the module fence (b6_witness's own) ──
const snapPath = path.join(ROOT, 'src/lib/vendor/snapshot.js');
require.cache[snapPath] = { id: snapPath, filename: snapPath, loaded: true,
  exports: { logActivity: async () => {}, fetchRecentActivity: async () => [], formatActivityBlock: () => '' } };

const Module  = require('module');
const _load   = Module._load;
const BUILTIN = new Set(Module.builtinModules);
const noop    = () => new Proxy(function () {}, { get: () => noop() });

// §4's ONE interception: the engine's db.js throws at import without env; the
// bench answers it with a scripted per-table double. Everything else in dist
// loads REAL. Armed only while §4 requires the dist (chat.js's fence below
// keeps dist noop'd for §1–§3 exactly as the sibling benches do).
let engineDbShim = null;

Module._load = function (req, parent) {
  if (req === 'express') { const e = () => {}; e.Router = () => ({ get(){}, post(){}, patch(){}, put(){}, delete(){}, use(){} }); return e; }
  if (engineDbShim) {
    let resolved = req;
    try { resolved = Module._resolveFilename(req, parent); } catch (_e) { /* bare/unresolvable -> fall through */ }
    if (/engine[\\/]dist[\\/]core[\\/]db\.js$/.test(resolved)) return engineDbShim;
    if (/engine[\\/]dist[\\/]/.test(resolved)) return _load.apply(this, arguments);
    if (!req.startsWith('.') && !req.startsWith('/') && !req.startsWith('node:') && !BUILTIN.has(req)) {
      // §4 lets the REAL @anthropic-ai/sdk + @supabase/supabase-js load when
      // installed (never called — transports are doubles); absent, noop stands in.
      try { return _load.apply(this, arguments); } catch (_e) { return noop(); }
    }
    return _load.apply(this, arguments);
  }
  if (/engine[\\/]dist[\\/]/.test(req)) return noop();
  if (!req.startsWith('.') && !req.startsWith('/') && !req.startsWith('node:') && !BUILTIN.has(req)) return noop();
  return _load.apply(this, arguments);
};

const CHAT  = path.join(ROOT, 'src/api/vendor-engine/chat.js');
const seams = require(CHAT);
const { composedTail, persistComposedReply } = seams;
const { scrubText } = require(path.join(ROOT, 'src/lib/vendor/scrub'));

// GRACEFUL DEGRADE — the sibling benches' convention, applied at birth: at an
// UNCURED tree the seam does not exist and this bench reads as FAILS, never a
// crash. The shim's sentinel satisfies no assertion.
const donnaOpenLine = (...a) => { try { const v = seams.donnaOpenLine(...a); return typeof v === 'string' ? v : '<uncured>'; } catch (_e) { return '<no donnaOpenLine seam at this tree>'; } };

let pass = 0, fail = 0;
const T   = (label, cond) => { if (cond) { pass++; console.log('  PASS  ' + label); } else { fail++; console.log('  FAIL  ' + label); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

const VENDOR = '11111111-1111-4111-8111-111111111111';
const MSG_ID = '22222222-2222-4222-8222-222222222222';

// The capturing double: one .update() lands, its payload kept whole (b6_witness rig).
function mkReq(sink) {
  return { vendor: { id: VENDOR }, app: { locals: { supabase: { schema: () => ({
    from: () => ({ update: (payload) => { sink.push(payload); return { eq: async () => ({ error: null }) }; } }),
  }) } } } };
}

// ── the 17:08:36 specimen, shaped from the outage evening's own rows ──────────
// Six donna_find reads + her voice across the turn's exchanges; the question
// ends the segment ALONE (loop surfaced pendingDonnaQuestion); zero write hands.
const QUESTION = 'Want me to log her as a fresh lead?';
const FIND = (q) => ({ name: 'donna_find', input: { query: q }, result: 'Nothing on file matching that.' });
const SPECIMEN_TOOLCALLS = [
  { name: 'dear_donna_talk', input: { message: 'Find Tara Seal Test — lead or binder.' }, result: '(handed to Donna)',
    donna_calls: [FIND('Tara Seal Test'), FIND('Tara'), FIND('Seal Test'), FIND('9811'),
      { name: 'listen_harvey_talk', input: { message: QUESTION }, result: '(spoken to Harvey)' }] },
  { name: 'listen_harvey_talk', input: { message: 'Find Tara Seal Test — lead or binder.' }, result: `Listen Harvey \u2014 ${QUESTION}` },
];
const MINTED   = `Still open — Donna asked: ${QUESTION} Answer it and she'll finish the filing.`;
const RENDERED = `Still open — Operator asked: ${QUESTION} Answer it and she'll finish the filing.`;
// D-9 LABELED AMENDMENT (R-B6-15 convention, the ruling named): the constants
// above follow D-9's trimmed rendering — no `?.` / `..`; the template's period
// appends only when her sentence carries no terminal mark. The two live
// specimens from the founder smoke (F-04.82's filing) ride below VERBATIM as
// the ruling's named tests.
const ANANYA_REPORT = 'One follow-up overdue from yesterday: call Ananya. Nothing else due through Sunday.';
const VERA_QUESTION = 'No binder or lead for Vera Anchor Test. Shall I open one?';
const VERA_LINE     = `Still open — Donna asked: ${VERA_QUESTION} Answer it and she'll finish the filing.`;

const FILED_CALL = { name: 'dear_donna_talk', input: { message: 'Log the lead.' }, result: '(handed to Donna)',
  donna_calls: [{ name: 'donna_lead', input: { name: 'Ira Fresh Test' }, result: 'Lead saved. id=33333333-3333-4333-8333-333333333333 — Ira Fresh Test filed.' },
    { name: 'listen_harvey_talk', input: { message: 'Filed.' }, result: '(spoken to Harvey)' }] };

(async () => {
  sec("§1 — D-9'S NAMED TESTS FIRST (the founder smoke's two specimens, VERBATIM), then the 17:08:36 original.");
  {
    // D-9 named test 1 — the ANANYA DECLARATIVE (01:59:47, F-04.82's specimen):
    // Donna answered WHOLE from her snapshot, listen-alone, no tools, no `?`.
    // The mechanical leg arms (pendingDonnaQuestion carries her report); the
    // conjunctive filter must silence the line — a report is not a question.
    const result = { reply: 'You have one commitment this week.', assistant_message_id: MSG_ID,
      pendingDonnaQuestion: ANANYA_REPORT,
      tool_calls: [{ name: 'dear_donna_talk', input: { message: "What's on the calendar this week?" }, result: '(handed to Donna)',
        donna_calls: [{ name: 'listen_harvey_talk', input: { message: ANANYA_REPORT }, result: '(spoken to Harvey)' }] }] };
    T("D-9 NAMED TEST: the Ananya declarative report carries NO line (the ? filter — F-04.82 reversed)", donnaOpenLine(result) === '');
    const sink = [];
    await persistComposedReply(mkReq(sink), result, composedTail({ open: donnaOpenLine(result) }));
    T('…and nothing persists — the false "still open" costume is dead in storage too', sink.length === 0);
  }
  {
    // D-9 named test 2 — the VERA QUESTION (02:00:31, the true positive): the
    // line fires, and the rendered form carries NO `?.` and NO `..` (D-9's
    // same-one-line trim; the surviving line ends on her own `?` + the tail).
    const result = { reply: 'Vera Anchor Test never came through the door.', assistant_message_id: MSG_ID,
      pendingDonnaQuestion: VERA_QUESTION,
      tool_calls: [{ name: 'dear_donna_talk', input: { message: 'Look up Vera Anchor Test.' }, result: '(handed to Donna)',
        donna_calls: [FIND('Vera Anchor Test'), { name: 'listen_harvey_talk', input: { message: VERA_QUESTION }, result: '(spoken to Harvey)' }] }] };
    const line = donnaOpenLine(result);
    T('D-9 NAMED TEST: the Vera question fires the line, byte-exact to the ruled rendering', line === VERA_LINE);
    T('…with NO "?." and NO ".." anywhere in it (the punctuation seam, trimmed by the same one line)', !line.includes('?.') && !line.includes('..'));
  }
  sec("§1b — THE 17:08:36 ORIGINAL, still firing (D-9's own condition).");
  {
    const result = { reply: "Clear — log her as a new lead: Tara Seal Test, and I'll take it from there.",
      tool_calls: SPECIMEN_TOOLCALLS, assistant_message_id: MSG_ID, pendingDonnaQuestion: QUESTION };
    const line = donnaOpenLine(result);
    T('the guard fires on its own named specimen (question open, zero write hands)', line !== '' && !line.startsWith('<'));
    T("the builder's bytes are the CE's minted copy, exact", line === MINTED);
    const sink = [];
    const tail = composedTail({ witnessed: [], open: line });
    await persistComposedReply(mkReq(sink), result, tail);
    T('the stored row carries the line (prose + tail, one content field)', sink.length === 1 && typeof sink[0].content === 'string' && sink[0].content.startsWith(result.reply));
    T('the firewall renders it Donna -> Operator in storage (CE-18/F-04.27 — the veto set names this)', sink.length === 1 && sink[0].content.endsWith('\n\n' + RENDERED));
    T('the rendered form quotes her question verbatim inside the line', sink.length === 1 && sink[0].content.includes(QUESTION));
  }
  {
    // A healthy read turn: reads ran, she reported, nothing stands open.
    const result = { reply: 'Nothing on file for that name.', assistant_message_id: MSG_ID,
      tool_calls: [{ name: 'dear_donna_talk', input: { message: 'Find Meera.' }, result: '(handed to Donna)',
        donna_calls: [FIND('Meera'), { name: 'listen_harvey_talk', input: { message: 'Nothing on file.' }, result: '(spoken to Harvey)' }] }] };
    T('a healthy read turn (no open question) carries NO line', donnaOpenLine(result) === '');
    const sink = [];
    await persistComposedReply(mkReq(sink), result, composedTail({ open: donnaOpenLine(result) }));
    T('…and the empty tail still writes NOTHING (the Q-B4-6(b) floor)', sink.length === 0);
  }
  {
    // A filed turn, shape 1: she filed and spoke — no pending question exists.
    const result = { reply: 'Done. Ira Fresh Test is in the book.', assistant_message_id: MSG_ID, tool_calls: [FILED_CALL] };
    T('a filed turn (question resolved by the exchange) carries NO open line', donnaOpenLine(result) === '');
    // A filed turn, shape 2: the guard's third clause — a question rode out, but a
    // WRITE HAND fired this turn; nothing stands open, the witness line speaks.
    const withQ = { ...result, pendingDonnaQuestion: 'Anything else on her?' };
    T("a write hand in nested donna_calls blocks the line (D-6's zero-write-hands clause)", donnaOpenLine(withQ) === '');
    const witnessed = seams.donnaWitnessLines(VENDOR, withQ);
    T('…while the witness line still rides the same turn (one home, two facts)', Array.isArray(witnessed) && witnessed.length === 1);
  }

  sec('§2 — the fences.');
  {
    const voiceOnly = { reply: 'r', assistant_message_id: MSG_ID, pendingDonnaQuestion: QUESTION,
      tool_calls: [{ name: 'dear_donna_talk', input: {}, result: '(handed to Donna)',
        donna_calls: [{ name: 'listen_harvey_talk', input: { message: QUESTION }, result: '(spoken to Harvey)' }] }] };
    T("her VOICE is not a hand: nested listen_harvey_talk alone never convicts (D-2's fence, reused)", donnaOpenLine(voiceOnly) === MINTED);
    const topLevelOnly = { reply: 'r', pendingDonnaQuestion: QUESTION,
      tool_calls: [{ name: 'dear_donna_talk', input: {}, result: '(handed to Donna)' }, { name: 'escalate', input: {}, result: 'Already escalated.' }] };
    T('the top level is NEVER walked (dear_donna_talk/escalate are not hands)', donnaOpenLine(topLevelOnly) === MINTED);
    const erroredRead = { reply: 'r', pendingDonnaQuestion: QUESTION,
      tool_calls: [{ name: 'dear_donna_talk', input: {}, result: '(handed to Donna)',
        donna_calls: [{ name: 'donna_find', input: {}, result: 'ERROR: search failed.' }] }] };
    T('an errored READ is not a write hand — the guard counts hands, not errors', donnaOpenLine(erroredRead) === MINTED);
    T('a whitespace-only question never lines', donnaOpenLine({ reply: 'r', pendingDonnaQuestion: '   ', tool_calls: [] }) === '');
    T('an absent field never lines (older results keep pre-D-6 bytes)', donnaOpenLine({ reply: 'r', tool_calls: [] }) === '');
  }

  sec('§3 — additivity + order (the twins clause).');
  {
    const base = { witnessed: ['Lead filed: Ira Fresh Test'], booked: [], refused: [] };
    const pre  = composedTail(base);
    const same = composedTail({ ...base, open: '' });
    T('empty `open` returns the pre-D-6 bytes exactly', pre === same);
    T('absent `open` returns the pre-D-6 bytes exactly', pre === composedTail({ ...base }));
    const withOpen = composedTail({ ...base, open: MINTED });
    T('the open line rides LAST in the tail (stored order == live order)', withOpen.endsWith('\n\n' + RENDERED) && withOpen.indexOf('Lead filed') < withOpen.indexOf('Still open'));
    T('the tail scrubs the line through the one firewall (scrubText, byte-equal to the wire path)', withOpen.includes(scrubText(MINTED)) && scrubText(MINTED) === RENDERED);
  }

  // ═══════════════════════════════════════════════════════════════════════
  sec('§4 — THE ENGINE LEG: the REAL COMPILED runTurn (dist), db.js the one shim.');
  const DIST = path.join(ROOT, 'src/engine/dist/core/loop.js');
  // ── F-04.83's CURE (the dist-staleness note, executed at its recorded trigger):
  // a dist that DISAGREES with its source on the cure sentinel is STALE — it was
  // compiled before the source moved (the founder's desk never runs the build;
  // Railway does, on deploy) and its testimony is about YESTERDAY'S source. A
  // stale dist must not testify: §4 SKIPS, STATED, with the one-line fix named,
  // and the source assertions carry. The gate is agree/disagree, NOT presence —
  // an UNCURED tree (source and dist both lack the sentinel) AGREES, so §4 still
  // runs there and still FAILS on exactly the cure: the both-ways floor stands.
  const SENTINEL = 'pendingDonnaQuestion';
  const srcHasSentinel  = new RegExp(SENTINEL).test(read('src/engine/src/core/loop.ts'));
  const distHasSentinel = fs.existsSync(DIST) && new RegExp(SENTINEL).test(read('src/engine/dist/core/loop.js'));
  const distStale = fs.existsSync(DIST) && (srcHasSentinel !== distHasSentinel);
  if (!fs.existsSync(DIST) || distStale) {
    if (distStale) {
      console.log('  … dist is STALE — src/engine/dist/core/loop.js disagrees with loop.ts on the');
      console.log('    cure sentinel (compiled before the source moved; F-04.83, the founder-terminal');
      console.log("    27/28). §4's 5 behavioural assertions SKIPPED, stated. THE FIX, one line:");
      console.log('      npm run build && node scripts/b6_open_question_bench.js');
      console.log('    (Railway rebuilds dist on every deploy — production is not this desk.)');
    } else {
      console.log("  … dist absent (clean clone) — §4's 5 behavioural assertions SKIPPED, stated;");
      console.log('    the engine gates (tsc + build + smoke) carry behaviour. Source assertions run:');
    }
    const loopSrc = read('src/engine/src/core/loop.ts');
    T('TurnResult carries pendingDonnaQuestion (D-6 siting, source)', /pendingDonnaQuestion\?: string;/.test(loopSrc));
    T('the assignment keys on donna.session.pendingToolUseId (source)', /pendingDonnaQuestion = donna\.session\.pendingToolUseId \? said : '';/.test(loopSrc));
    const donnaSrc = read('src/engine/src/core/donna.ts');
    T('donna.ts arms pendingToolUseId ONLY on listen-ALONE (work.length === 0) — unchanged', /if \(work\.length === 0\) \{[\s\S]{0,220}pendingToolUseId = listen\.id;/.test(donnaSrc));
  } else {
    // ── the per-table supabase double (thenable builder; scripted rows) ──
    function mkDb() {
      let msgN = 0;
      const answer = (q) => {
        const t = q._t, op = q._op, mode = q._mode;
        if (op === 'select') {
          if (t === 'agents')         return { data: { id: 'agent-oq', tier: 'trial', display_name: 'Bench', profession_preset: null, timezone: null, mode: 'advisory' }, error: null };
          if (t === 'conversations')  return { data: null, error: null }; // no prior thread -> fresh
          if (t === 'agent_owner')    return { data: null, error: null };
          if (t === 'agent_snapshot') return { data: { note: { items: [], rebuilt_at: '2026-07-18T00:00:00Z' } }, error: null };
          if (t === 'messages')       return { data: [], error: null };
          return { data: mode ? null : [], error: null };
        }
        if (op === 'insert') {
          if (t === 'conversations') return { data: { id: 'conv-oq-1' }, error: null };
          if (t === 'messages')      return { data: { id: `msg-oq-${++msgN}` }, error: null };
          return { data: mode ? { id: 'row-oq' } : null, error: null };
        }
        return { data: null, error: null }; // update / upsert
      };
      const mkq = (t) => {
        const q = { _t: t, _op: 'select', _mode: null };
        const self = new Proxy(q, { get(target, prop) {
          if (prop === 'then') { const r = answer(target); return (res) => res(r); }
          if (prop === 'insert' || prop === 'update' || prop === 'upsert') return (body) => { target._op = String(prop); target._body = body; return self; };
          if (prop === 'maybeSingle' || prop === 'single') return () => { target._mode = String(prop); return Promise.resolve(answer(target)); };
          if (prop in target) return target[prop];
          return () => self; // select/eq/is/not/in/order/limit/ilike/neq — chain on
        } });
        return self;
      };
      const db = { from: (t) => mkq(t), schema: () => db };
      return db;
    }
    engineDbShim = { supabase: mkDb() };
    // dist may be require-cached as noop from §1's fence — clear engine entries.
    for (const k of Object.keys(require.cache)) if (/engine[\\/]dist[\\/]/.test(k)) delete require.cache[k];
    const { runTurn } = require(path.join(ROOT, 'src/engine/dist/core/loop.js'));

    const msgOf = (blocks, usage) => ({ content: blocks, usage: usage || { input_tokens: 1, output_tokens: 1 } });
    const streamOf = (msg) => ({ on() {}, finalMessage: async () => msg });
    const scriptedTransports = (harveyScript, donnaScript) => {
      let h = 0, d = 0;
      return {
        transport:      { provider: 'anthropic', stream: () => streamOf(harveyScript[Math.min(h++, harveyScript.length - 1)]), create: async () => harveyScript[Math.min(h++, harveyScript.length - 1)] },
        donnaTransport: { provider: 'anthropic', stream: () => streamOf(donnaScript[Math.min(d++, donnaScript.length - 1)]),  create: async () => donnaScript[Math.min(d++, donnaScript.length - 1)] },
      };
    };
    const HV_DISPATCH = (m, id) => msgOf([{ type: 'tool_use', id, name: 'dear_donna_talk', input: { message: m } }]);
    const HV_PROSE    = (t)     => msgOf([{ type: 'text', text: t }]);
    const DN_LISTEN   = (m, id) => msgOf([{ type: 'tool_use', id, name: 'listen_harvey_talk', input: { message: m } }]);
    const DN_FINDLISTEN = (m)   => msgOf([
      { type: 'tool_use', id: 'dn-find-1', name: 'donna_find', input: { query: 'x' } },
      { type: 'tool_use', id: 'dn-listen-2', name: 'listen_harvey_talk', input: { message: m } },
    ]);

    // A — listen-ALONE: she asked and is waiting; the turn ends on prose.
    {
      const t = scriptedTransports([HV_DISPATCH('Find her.', 'h1'), HV_PROSE('You are clear to log fresh.')], [DN_LISTEN(QUESTION, 'd1')]);
      const r = await runTurn({ agentId: 'agent-oq', message: 'Log Tara Seal Test.', ...t });
      T('listen-ALONE: pendingDonnaQuestion carries her exact sentence', r.pendingDonnaQuestion === QUESTION);
    }
    // B — work + listen MIXED: donna.ts's else-branch, pendingToolUseId never arms.
    {
      const t = scriptedTransports([HV_DISPATCH('Find her.', 'h1'), HV_PROSE('Nothing on file.')], [DN_FINDLISTEN('Nothing on file for that name.')]);
      const r = await runTurn({ agentId: 'agent-oq', message: 'Find Meera.', ...t });
      T('work+listen mixed: the field stays ABSENT (she was not left waiting)', r.pendingDonnaQuestion === undefined);
    }
    // C — asked, then RESOLVED: two exchanges; the second clears the first's pending.
    {
      const t = scriptedTransports(
        [HV_DISPATCH('Find her.', 'h1'), HV_DISPATCH('Yes — a fresh lead.', 'h2'), HV_PROSE('Filed.')],
        [DN_LISTEN(QUESTION, 'd1'), DN_FINDLISTEN('Noted — nothing more open.')]);
      const r = await runTurn({ agentId: 'agent-oq', message: 'Log Tara Seal Test.', ...t });
      T('a resumed exchange that RESOLVES her clears the field (absent at return)', r.pendingDonnaQuestion === undefined);
    }
    // D — no Donna at all: a plain advisory answer.
    {
      const t = scriptedTransports([HV_PROSE('Here is my counsel.')], [HV_PROSE('unused')]);
      const r = await runTurn({ agentId: 'agent-oq', message: 'Advise me.', ...t });
      T('a turn with no Donna carries nothing', r.pendingDonnaQuestion === undefined);
      T('…and the turn itself is whole (reply + conversation witnessed by the double)', r.reply === 'Here is my counsel.' && r.conversation_id === 'conv-oq-1');
    }
    engineDbShim = null;
  }

  console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}  ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH CRASH:', e && e.stack || e); process.exit(1); });
