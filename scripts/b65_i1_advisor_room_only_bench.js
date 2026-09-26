#!/usr/bin/env node
// scripts/b65_i1_advisor_room_only_bench.js — CE-41 · SEAT I (R-41.136).
//
// Advisor is reachable ONLY through the Advisor room, and Victor never claims a
// mode he is not in. The room by construction (§1), the room line in the composed
// prompt (§2), the witness (§3), the route agreeing with the room (§4).
//
// WHY THIS IS A NEW MEMBER OF THE b65 FAMILY AND NOT CELLS INSIDE
// `b65_g1_wa_advisor_off_bench.js`. DECLARED, not slipped. The charter said "b65
// gains". §2 below needs the COMPOSED PROMPT, which needs the Anthropic SDK
// replaced and `engine/dist/core/db.js` pre-seeded in the require cache BEFORE the
// dist engine loads — `b65_g1` requires that dist at its own cell 2.3, so the hooks
// would have to be installed at that file's top and 42 green cells would be driven
// through a rig they were never written against. The floor is a SET; a second
// member costs the set nothing and puts nothing at risk. `b65_g1` still gains the
// shape amendments its own §2/§8 cells needed (F4, chair-ruled).
//
// BOTH WAYS, MEASURED BY COMMAND at `b72d855`, not estimated: 5/20 at the uncured
// tree, 20/20 cured. The fifteen reds are §1.1-1.4, §2.1-2.6, §3.1, §3.2, §4.1-4.3.
// THE FIVE GREEN AT BOTH TREES ARE DECLARED HERE RATHER THAN LEFT TO BE DISCOVERED,
// and not one of them is a proof of this cure: §1.5 and §1.6 hold because G2 already
// shipped the assertion and its precedence; §1.7 because G1 already shipped the
// WhatsApp override; §3.3 because G2 already shipped `source=assert`. They stand as
// CONTROLS — the cure must not cost the rooms that already worked — and §4.4 is the
// over-cure fence, green until someone retires a writer (M41 drives it red).
// `b65_mutations.js` gains M35-M41.
//
// THE FIXTURE IS THE ORPHAN ROW. Every §1 and §2 turn runs against an agent whose
// `victor_mode` column says `advisor` — DEV440's live shape. That is deliberate:
// a cure asserted against a `business` row would pass at the uncured tree too.
'use strict';
// ── CE-45 LCV-16 LSP_5 · LABELLED AMENDMENT (A-45.2): THE RETIRED CELLS OF THIS BENCH, AT SITE ─────────────────────
// LSP_5 (the chair's rulings L5-a to L5-e, §7, K6, 25 September 2026) retired the business room from runTurn and deleted Donna's
// turn and the engine modules only it reached. Each row names a cell and why it retires; the cell is replaced at its site by
// __RETIRED (never evaluated). A retired cell prints RETIRED and is NOT counted as a pass. CONTROL: at exit every row must have
// matched exactly ONE reached cell, or the bench exits 1.
const __RETIRE_LSP5 = new Map([["1.1 the engine","L5-a/L5-b: modeOverride (the WhatsApp door's term) is deleted and runTurn serves advisor and consult only; b116 1.1 and 2.1 pin both"],["1.3 DRIVEN: no assertion","L5-a: runTurn refuses a no-assertion (business) turn by name before any read; b116 1.1 to 1.4 pin it"],["1.4 DRIVEN: and it never asked","L5-a: runTurn refuses a no-assertion (business) turn by name before any read; b116 1.1 to 1.4 pin it"],["1.6 DRIVEN: the precedence holds","L5-a/L5-b: modeOverride (the WhatsApp door's term) is deleted and runTurn serves advisor and consult only; b116 1.1 and 2.1 pin both"],["1.7 DRIVEN: WhatsApp","L5-a: runTurn refuses a no-assertion (business) turn by name before any read; b116 1.1 to 1.4 pin it"],["2.1 the two lines exist","L5-b: ROOM_LINE.business is deleted; this reader required it. The live subject is DRIVEN by b116 (1.6 the advisor line in an advisor turn; 1.11 consult carries no room line)"],["2.2 ZERO BYTES","L5-b: ROOM_LINE.business is deleted; this reader required it. The live subject is DRIVEN by b116 (1.6 the advisor line in an advisor turn; 1.11 consult carries no room line)"],["2.3 DRIVEN: a BUSINESS turn","L5-a: runTurn refuses a no-assertion (business) turn by name before any read; b116 1.1 to 1.4 pin it"],["2.4 DRIVEN: an ADVISOR turn","L5-b: ROOM_LINE.business is deleted; this reader required it. The live subject is DRIVEN by b116 (1.6 the advisor line in an advisor turn; 1.11 consult carries no room line)"],["2.5 DRIVEN: CONSULT","L5-b: ROOM_LINE.business is deleted; this reader required it. The live subject is DRIVEN by b116 (1.6 the advisor line in an advisor turn; 1.11 consult carries no room line)"],["2.6 DRIVEN: in a BUSINESS room","L5-a: runTurn refuses a no-assertion (business) turn by name before any read; b116 1.1 to 1.4 pin it"],["3.1 the witness names","L5-a/L5-b: modeOverride (the WhatsApp door's term) is deleted and runTurn serves advisor and consult only; b116 1.1 and 2.1 pin both"],["3.2 DRIVEN: an unasserted turn","L5-a: runTurn refuses a no-assertion (business) turn by name before any read; b116 1.1 to 1.4 pin it"],["4.3 route and room agree","L5-a: the engine's precedence is now roomAssert, else the named refusal; a business combination can no longer agree with the route resolver because the engine refuses it (b116 1.1)"]]);
const __seenLSP5 = new Map();
function __RETIRED(k) { if (!__RETIRE_LSP5.has(k)) { console.log('  FAIL  ' + k + '  (RETIRED at site but not in the table)'); process.exitCode = 1; return; }
  __seenLSP5.set(k, (__seenLSP5.get(k) || 0) + 1); console.log('  RETIRED  ' + k + '  (' + __RETIRE_LSP5.get(k) + ')'); }
process.on('exit', (code) => { let bad = 0; for (const [k] of __RETIRE_LSP5) if ((__seenLSP5.get(k) || 0) !== 1) { bad++; console.log('  FAIL  retire row ' + k + ' matched ' + (__seenLSP5.get(k) || 0) + ' reached cells (must be exactly 1)'); }
  if (bad) process.exitCode = 1; else if (code !== 0) process.exitCode = code; });
const fs = require('fs');
const path = require('path');

const ROOT = process.env.B65_ROOT ? path.resolve(process.env.B65_ROOT) : path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
// The comment-blindness law (R-40.105): this packet's comments name `column`,
// `victor_mode` and both room lines many times over. Every absence cell below
// reads comment-stripped code.
const codeOf = (rel) => read(rel).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1 ');
const req = (rel) => require(path.join(ROOT, rel));

process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'bench-key';
process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'bench-key';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://bench.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-key';

let pass = 0, fail = 0; const fails = [];
const sec = (t) => console.log(`\n${t}`);
function ok(name, cond, why) { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; fails.push(name); console.log(`  FAIL ${name}${why ? ' — ' + why : ''}`); } }
async function cell(name, fn) { try { const r = await fn(); r === true ? ok(name, true) : ok(name, false, typeof r === 'string' ? r : JSON.stringify(r)); } catch (e) { ok(name, false, (e && e.message) || String(e)); } }

// ── D-11 THE DIST GATE. A dist that disagrees with its source on this packet's
// sentinel was compiled before the source moved and its testimony is about
// yesterday's file. `ROOM_LINE` is the sentinel because it is THIS packet's cure
// and nothing else in the estate carries the identifier.
const { distGate } = require(path.join(__dirname, 'lib', 'dist_gate'));
const gate = distGate({
  sentinel: 'ROOM_LINE',
  srcPath: path.join(ROOT, 'src/engine/src/core/loop.ts'),
  distPath: path.join(ROOT, 'src/engine/dist/core/loop.js'),
  benchCmd: 'scripts/b65_i1_advisor_room_only_bench.js',
});

// ── the SDK spy, fenced BEFORE dist loads ────────────────────────────────────
// It captures the SYSTEM the engine composed. §2 asserts on that captured text
// and on nothing else: the walk law holds that the rendered surface outranks any
// instrument, and the prompt Anthropic would have received is the surface here.
const calls = [];
function scriptFor(params) {
  const system = Array.isArray(params.system) ? params.system.map((b) => b.text || '').join('\n') : String(params.system || '');
  calls.push({ system, tools: (params.tools || []).map((t) => t.name), model: params.model });
  return { content: [{ type: 'text', text: 'Understood.' }], usage: { input_tokens: 10, output_tokens: 5 } };
}
const Module = require('module');
const _load = Module._load;
Module._load = function (r) {
  if (r === '@anthropic-ai/sdk') {
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

// ── the db double, with a READ LOG ───────────────────────────────────────────
// The read log is the instrument for §1.4. "The turn does not ask what room the
// vendor is in" is only provable by watching whether anything SELECTed the
// column — an assertion on the RESOLVED room alone would pass on a turn that
// asked and then discarded the answer, which is the shape R-41.136 refused.
const AGENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VENDOR_ID = 'vvvvvvvv-vvvv-4vvv-8vvv-vvvvvvvvvvvv';
const store = { conversations: [], messages: [], ownerNotes: [], ids: 0, reads: [] };
const nid = (p) => `${p}-${++store.ids}`;
// THE ORPHAN ROW IS THE FIXTURE (see the header): the column says `advisor`
// throughout §1 and §2, exactly as DEV440's live row does.
let cur = { victor_mode: 'advisor', mode: 'advisory' };

function eqcol(q, col) { return (q._eqcols || []).find((e) => e.col === col); }
function answer(q) {
  const t = q._t, op = q._op, mode = q._mode, body = q._body;
  const filt = (rows) => { let r = rows; for (const fn of q._f) r = r.filter(fn); return r; };
  const one = (row) => ({ data: row, error: null });
  if (op === 'select') {
    if (t === 'agents') {
      if (/victor_mode/.test(String(q._cols || ''))) store.reads.push('engine.agents.victor_mode');
      return one({ id: AGENT, user_id: 'eng-user', tier: 'entry', display_name: 'Seat I Bench Vendor', profession_preset: 'photographer', timezone: 'Asia/Kolkata', mode: cur.mode, victor_mode: cur.victor_mode });
    }
    if (t === 'users') { if (eqcol(q, 'auth_user_id')) return one({ id: 'pub-user' }); return one({ auth_user_id: 'auth-1' }); }
    if (t === 'vendors') return { data: [{ id: VENDOR_ID }], error: null };
    if (t === 'agent_owner') return one({ owner_name: 'Dev', owner_descriptor: 'a wedding photographer in Delhi', note: 'Building his studio brand.', consult_done: true });
    if (t === 'domain_handbooks') return one({ field: 'photographer', title: 'THE FRAME', index_md: '## INDEX\n- §1 Foundations', full_md: '# THE FRAME\n\n## §1 Foundations\n\nDo the work.' });
    if (t === 'conversations') return one(filt(store.conversations)[0] ?? null);
    if (t === 'messages') return { data: filt(store.messages), error: null };
    if (t === 'agent_snapshot') return one({ note: { items: [], rebuilt_at: '2026-09-09T00:00:00Z' } });
    return mode ? { data: null, error: null } : { data: [], error: null };
  }
  if (op === 'insert') {
    if (t === 'conversations') { const row = { id: nid('conv'), agent_id: AGENT, state: 'active', last_active_at: new Date().toISOString(), ...body }; store.conversations.unshift(row); return one({ id: row.id }); }
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
    if (prop === 'select') return (c) => { target._cols = c; return proxy(target); };
    if (prop === 'insert' || prop === 'update' || prop === 'upsert') return (b) => { target._op = prop === 'upsert' ? 'insert' : String(prop); target._body = b; return proxy(target); };
    if (prop === 'maybeSingle' || prop === 'single') return () => { target._mode = String(prop); return Promise.resolve(answer(target)); };
    if (prop === 'eq') return (c, v) => { target._f.push((r) => r[c] === v); (target._eqcols = target._eqcols || []).push({ col: c, val: v }); return proxy(target); };
    if (prop in target) return target[prop];
    return () => proxy(target);
  } });
}
const mkq = (t) => proxy({ _t: t, _op: 'select', _mode: null, _cols: '', _f: [], _eqcols: [] });
const db = { from: (t) => mkq(t), schema: () => db };
{
  const dbPath = path.join(ROOT, 'src/engine/dist/core/db.js');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: db } };
}

// The witness line is a console.log. §3 reads what the founder's Railway tail
// would read, so it captures stdout rather than re-deriving the string.
const logs = [];
const _log = console.log;
function captureOn() { console.log = (...a) => { logs.push(a.join(' ')); }; }
function captureOff() { console.log = _log; }

// THE ROOM LINES ARE READ OFF THE SHIPPED CONSTANT, NEVER TRANSCRIBED. The
// founder holds the copy veto (R-41.98); a bench carrying its own copy of the
// sentences would RED on a veto and would be asserting wording, which no cell
// here does. This parses the constant out of `loop.ts` so a reworded line moves
// the fixture with it.
function roomLines() {
  const t = read('src/engine/src/core/loop.ts');
  const m = t.match(/const ROOM_LINE = \{([\s\S]*?)\n\} as const;/);
  if (!m) return null;
  const body = m[1];
  // No eval: the entry's single-quoted segments are lifted and joined in order,
  // then the two escapes the constant actually uses are resolved. A bench that
  // eval'd repo source would be executing the thing it is meant to be reading.
  const grab = (key) => {
    const re = new RegExp(`${key}:\\s*([\\s\\S]*?),(?=\\n|$)`, 'm');
    const g = body.match(re);
    if (!g) return null;
    const parts = g[1].match(/'((?:[^'\\]|\\.)*)'/g);
    if (!parts) return null;
    return parts.map((q) => q.slice(1, -1)).join('')
      .replace(/\\n/g, '\n').replace(/\\'/g, "'");
  };
  const business = grab('business');
  const advisor = grab('advisor');
  return business && advisor ? { business: business.trim(), advisor: advisor.trim() } : null;
}

async function turn(args) {
  const { runTurn } = require(path.join(ROOT, 'src/engine/dist/core/loop.js'));
  calls.length = 0; store.reads.length = 0; logs.length = 0;
  store.conversations.length = 0; store.messages.length = 0;
  captureOn();
  try { return await runTurn({ agentId: AGENT, message: 'is this advisor or business', ...args }); }
  finally { captureOff(); }
}

(async () => {
  if (!gate.runDist) {
    console.log('  … the driven sections SKIP per the gate; the source cells below carry.');
  }

  sec('§1 BUSINESS BY CONSTRUCTION — the room is the DOOR\'S, and nothing else\'s (R-41.136 (a))');

  await __RETIRED("1.1 the engine");

  await cell('1.2 the turn does not SELECT the column at all', () => {
    const c = codeOf('src/engine/src/core/loop.ts');
    return /\.select\('id, tier, display_name, profession_preset, timezone, mode'\)/.test(c)
      ? true : 'the agent SELECT still carries victor_mode';
  });

  if (gate.runDist) {
    await __RETIRED("1.3 DRIVEN: no assertion");

    await __RETIRED("1.4 DRIVEN: and it never asked");

    await cell('1.5 DRIVEN: from the Advisor door the turn is ADVISOR, on the same row', async () => {
      cur = { victor_mode: 'advisor', mode: 'advisory' };
      const r = await turn({ roomAssert: 'advisor' });
      return r && r.victor_mode === 'advisor' ? true : `the assertion did not open the room: ${r && r.victor_mode}`;
    });

    await __RETIRED("1.6 DRIVEN: the precedence holds");

    await __RETIRED("1.7 DRIVEN: WhatsApp");
  }

  sec('§2 THE ROOM LINE — Victor stops narrating a mode he is not in (R-41.136 (b))');

  await __RETIRED("2.1 the two lines exist");

  await __RETIRED("2.2 ZERO BYTES");

  if (gate.runDist) {
    await __RETIRED("2.3 DRIVEN: a BUSINESS turn");

    await __RETIRED("2.4 DRIVEN: an ADVISOR turn");

    await __RETIRED("2.5 DRIVEN: CONSULT");

    await __RETIRED("2.6 DRIVEN: in a BUSINESS room");
  }

  sec('§3 THE WITNESS — `source=column` can no longer print (R-41.136 (a))');

  await __RETIRED("3.1 the witness names");

  if (gate.runDist) {
    await __RETIRED("3.2 DRIVEN: an unasserted turn");

    await cell('3.3 DRIVEN: an asserted turn logs `room=advisor … source=assert`', async () => {
      cur = { victor_mode: 'advisor', mode: 'advisory' };
      await turn({ roomAssert: 'advisor' });
      const line = logs.find((l) => l.includes('[engine:mode]')) || '';
      return /room=advisor /.test(line) && /source=assert/.test(line)
        ? true : `the witness said: ${line || '(nothing)'}`;
    });
  }

  sec('§4 THE ROUTE AGREES WITH THE ROOM — the two-package mirror, at two terms');

  await cell('4.1 `resolveVendorRoom` has no `columnMode` parameter left to read', () => {
    const c = codeOf('src/lib/modelRouter.js');
    if (/function resolveVendorRoom\(\{ surface, modeOverride, roomAssert \}\)/.test(c) === false) {
      return 'the resolver still declares a columnMode parameter';
    }
    return !/columnMode/.test(c) ? true : 'columnMode survives in modelRouter.js';
  });

  await cell('4.2 the door no longer reads the column on EITHER lane', () => {
    const c = codeOf('src/api/vendor-engine/chat.js');
    if (/readVictorMode/.test(c)) return 'the door still carries readVictorMode';
    return !/victor_mode/.test(c.replace(/result\s*&&\s*result\.victor_mode/g, ' ').replace(/result\.victor_mode/g, ' '))
      ? true : 'the door still names the column outside the TurnResult field';
  });

  await __RETIRED("4.3 route and room agree");

  await cell('4.4 the column is NOT retired — its writers and the chip\'s reader stand', () => {
    const mode = codeOf('src/api/vendor-engine/vendorMode.js');
    if (!/readAgentVictorMode/.test(mode)) return 'the GET door lost its read';
    if (!/update\(\{ victor_mode: target \}\)/.test(mode)) return 'the PATCH door lost its write';
    const wa = codeOf('src/lib/vendorInbound.js');
    return /applyModeFlip\(/.test(wa) ? true : 'the WhatsApp way-home lost its write';
  });

  console.log(`\n  b65_i1_advisor_room_only  ${pass}/${pass + fail}`);
  if (fail) console.log('  FAILED: ' + fails.join(' · '));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('BENCH ERROR', e); process.exit(1); });
