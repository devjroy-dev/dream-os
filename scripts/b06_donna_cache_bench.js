#!/usr/bin/env node
// scripts/b06_donna_cache_bench.js — TDW_06 ECONOMICS SITTING, charter item 2:
// THE DONNA CACHE. Runnable from any working directory, clean clone, no npm
// install (Q-SP-5's law):   node scripts/b06_donna_cache_bench.js
//
// THE FIRE ALARM THIS CURES (UNIT_ECONOMICS' own row): the ₹9.59-class
// dispatch turn — Donna entirely UNCACHED, her system + ~20 tool schemas +
// segments billed full-rate 2–6×/turn. The cure marks her STATIC prefix
// (soul + cabinet shape + working shape) cache_control:ephemeral — tools ride
// the cached prefix automatically — and moves the today line + scratchpad to
// an uncached DYNAMIC tail (the house cost law: cache-stable static prefixes
// are never touched by dynamic content).
//
// WHAT THIS BENCH DRIVES, disclosed:
//  §1 the REAL COMPILED runDonnaTurn (dist; db.js the one shim, D-11's
//     staleness gate at birth) with a transport spy capturing the EXACT params
//     her hand sends: system is BLOCKS; block[0] carries cache_control
//     ephemeral; the dynamic tail carries today + scratchpad and NO cache
//     marker.
//  §2 BYTE CONSERVATION + STABILITY: block[0] is byte-identical across two
//     calls with different today/scratchpad (a moving prefix caches nothing);
//     every pre-cure sentence survives (soul first, cabinet shape, working
//     shape); the today line and scratchpad live ONLY in the dynamic tail —
//     the ONE disclosed prompt reorder, asserted deliberately.
//  §3 THE Z LAW HELD: the captured params through the REAL translateFor
//     ('deepseek') carry ZERO cache_control keys at any depth — her DeepSeek
//     hand is byte-lawful with the marker in place; the facade strips, donna.ts
//     never branches per provider.
//  §4 the anthropic-shaped transport receives the marker INTACT (the cure is
//     real on the paid path, not stripped everywhere).
//
// Regression-proofed both ways: at pre-cure dist+src (system a plain string)
// §1/§2/§4 FAIL on exactly the cure while §3 stays green (a string system has
// no cache_control to strip); an uncured tree reads as FAILS, never a crash.
// A STALE dist (cured src, pre-cure dist) SKIPS the dist-driven sections
// STATED with the one-line fix, per D-11's generalized gate.
//
// Ruling trail: the sitting charter item 2 (the cache work as the economics
// doc records it; measured before/after founder-run in rupees, in the doc) ·
// the house cost-discipline law (§4 protocol) · D-11 (the gate) · the z law
// (llm.js deep strip, TDW_02 P5).
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('  PASS  ' + label); } else { fail++; console.log('  FAIL  ' + label); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

const AGENT = '77777777-7777-4777-8777-777777777777';
const TODAY_A = 'Today is Saturday, 18 July 2026 (Asia/Kolkata)';
const TODAY_B = 'Today is Sunday, 19 July 2026 (Asia/Kolkata)';
const PAD_A = "[THE OWNER'S SCRATCHPAD]\nRemind me about the Udaipur recce.";

const deepHasCacheControl = (v) => {
  if (Array.isArray(v)) return v.some(deepHasCacheControl);
  if (v && typeof v === 'object') return Object.keys(v).some((k) => k === 'cache_control' || deepHasCacheControl(v[k]));
  return false;
};

(async () => {
  sec('§0 — D-11: the dist gate (sentinel = DONNA_STATIC_PREFIX, the cure\'s own const).');
  const { distGate } = require(path.join(__dirname, 'lib', 'dist_gate'));
  const DIST = path.join(ROOT, 'src/engine/dist/core/donna.js');
  const gate = distGate({
    sentinel: 'DONNA_STATIC_PREFIX',
    srcPath: path.join(ROOT, 'src/engine/src/core/donna.ts'),
    distPath: DIST,
    benchCmd: 'scripts/b06_donna_cache_bench.js',
  });

  let capturedA = null, capturedB = null;
  if (!gate.runDist) {
    console.log('  … §1/§2/§4\'s dist-driven assertions SKIP per the gate; source assertions carry:');
    const fs = require('fs');
    const src = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/donna.ts'), 'utf8');
    T('source: the static prefix is marked cache_control ephemeral', /DONNA_STATIC_PREFIX, cache_control: \{ type: 'ephemeral' \}/.test(src));
    T('source: the today line rides the DYNAMIC tail, never the static run', /donnaDynamic =\s*\n?\s*\(today \?/.test(src.replace(/\r/g, '')));
  } else {
    // db.js — the ONE shim (b6_open_question §4's convention): an inert proxy;
    // the listen-alone path under test issues no query.
    const dbPath = path.join(ROOT, 'src/engine/dist/core/db.js');
    const inert = () => new Proxy(function () {}, { get: (_t, p) => (p === 'then' ? undefined : inert()), apply: () => inert() });
    require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: { schema: () => ({ from: () => inert() }), from: () => inert() } } };

    const { runDonnaTurn } = require(DIST);

    const spyTransport = (sink) => ({
      provider: 'anthropic',
      stream: () => { throw new Error('donna never streams'); },
      create: async (params) => {
        sink.push(params);
        return { content: [{ type: 'tool_use', id: 'lh-1', name: 'listen_harvey_talk', input: { message: 'Nothing due this week.' } }], usage: { input_tokens: 10, output_tokens: 5 } };
      },
    });

    sec('§1 — the captured params: blocks, the marker, the tail.');
    {
      const sink = [];
      await runDonnaTurn(AGENT, 'What is due?', null, TODAY_A, '2026-07-18', undefined, PAD_A, 'what is due?', spyTransport(sink), undefined);
      capturedA = sink[0];
      const sys = capturedA && capturedA.system;
      T('system is BLOCKS (an array), no longer a bare string', Array.isArray(sys));
      const b0 = Array.isArray(sys) ? sys[0] : null;
      T('block[0] carries cache_control: ephemeral (the static prefix pays once per window)', !!b0 && b0.cache_control && b0.cache_control.type === 'ephemeral');
      const dyn = Array.isArray(sys) ? sys[sys.length - 1] : null;
      T('the DYNAMIC tail exists and carries NO cache marker', Array.isArray(sys) && sys.length === 2 && dyn && dyn.cache_control === undefined);
      T('tools still ride the call whole (they cache off the same prefix)', Array.isArray(capturedA.tools) && capturedA.tools.some((t) => t.name === 'listen_harvey_talk'));
    }

    sec('§2 — byte conservation + stability (a moving prefix caches nothing).');
    {
      const sink = [];
      await runDonnaTurn(AGENT, 'What is due?', null, TODAY_B, '2026-07-19', undefined, undefined, 'what is due?', spyTransport(sink), undefined);
      capturedB = sink[0];
      const a0 = capturedA.system[0] || {}, b0 = capturedB.system[0] || {};
      T('block[0] BYTE-IDENTICAL across different today + scratchpad', typeof a0.text === 'string' && a0.text === b0.text);
      T('the soul opens the static prefix (order preserved)', typeof a0.text === 'string' && a0.text.startsWith('You are Donna'));
      T('the cabinet shape survives verbatim', typeof a0.text === 'string' && a0.text.includes('THE SHAPE OF YOUR CABINET'));
      T('the working shape survives verbatim', typeof a0.text === 'string' && a0.text.includes('You are working with Harvey, turn by turn'));
      T('the today line is ABSENT from the static prefix (the one disclosed reorder)', typeof a0.text === 'string' && !a0.text.includes(TODAY_A) && !b0.text.includes(TODAY_B));
      const dynA = (capturedA.system[1] || {}).text || '';
      T('…and PRESENT in the dynamic tail, its sentence intact', dynA.includes(`[${TODAY_A}] Use this when something is dated relative to now`));
      T('the scratchpad rides the dynamic tail (never Harvey\'s, never cached)', dynA.includes(PAD_A));
      T('a call with no scratchpad still carries its today tail', !!(capturedB.system[1] && typeof capturedB.system[1].text === 'string' && capturedB.system[1].text.includes(TODAY_B) && !capturedB.system[1].text.includes('SCRATCHPAD')));
    }

    sec('§4 — the anthropic-shaped transport receives the marker INTACT.');
    T('cache_control reached the (anthropic) transport unstripped', deepHasCacheControl(capturedA));
  }

  sec('§3 — THE Z LAW: the REAL translateFor strips every marker for deepseek.');
  {
    // Clean-clone fence (Q-SP-5): llm.js imports the SDK at module top; translateFor
    // never touches it. If node_modules is absent the SDK resolves to a class double
    // here — the FUNCTION under test is the real one either way, disclosed.
    const Module = require('module');
    const _load = Module._load;
    Module._load = function (req) {
      if (req === '@anthropic-ai/sdk') {
        try { return _load.apply(this, arguments); }
        catch (_e) { function A() { this.messages = {}; } A.default = A; return A; }
      }
      return _load.apply(this, arguments);
    };
    const { translateFor } = require(path.join(ROOT, 'src/lib/llm.js'));
    Module._load = _load;
    const params = capturedA || {
      // pre-cure/skipped-dist fallback fixture: a marked block, so the strip is
      // still exercised even where §1 could not run (floor, not cure).
      model: 'x', system: [{ type: 'text', text: 'static', cache_control: { type: 'ephemeral' } }, { type: 'text', text: 'dyn' }],
      tools: [{ name: 'listen_harvey_talk', input_schema: { type: 'object' } }], messages: [{ role: 'user', content: 'hi' }],
    };
    const out = translateFor('deepseek', params);
    T('§3.1 ZERO cache_control keys at ANY depth after the deepseek translate', !deepHasCacheControl(out));
    T('§3.2 the system TEXT survives the strip whole (bytes lawful, content intact)', JSON.stringify(out.system).includes('You are Donna') || JSON.stringify(out.system).includes('static'));
    T('§3.3 thinking suppressed on deepseek (the z probe law, unchanged)', out.thinking && out.thinking.type === 'disabled');
  }

  console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'}  ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH CRASH:', e && e.stack || e); process.exit(1); });
