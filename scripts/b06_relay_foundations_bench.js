#!/usr/bin/env node
'use strict';
// scripts/b06_relay_foundations_bench.js
// ── TDW_06 · THE RELAY SEAM · SITTING ONE — THE FOUNDATIONS ──────────────────
//
// FORTY-ONE CELLS, chair-ratified before build:
//   §1 A1  W-A  merge-not-drop (F-06.151)                    8
//   §2 A2  W-B  sent_by survives (F-06.152)                  8
//   §3 A3  W-C  the couple-side window predicate (F-06.147)  14
//   §4 A4  W-D  the pending-draft store (0117)               10
//   §5     the phone-format contract cell                    1
//
// BOTH-WAYS DISCIPLINE. Every RED is produced by defacing PRODUCTION CODE, never
// test setup. Mutations copy the real file, apply a textual defacement, load the
// copy, and assert the cell fails. If the mutation ANCHOR is absent the cell
// prints a declared FAIL rather than a silent pass — a probe that never ran and
// a probe that found nothing are indistinguishable, and this bench refuses that.
//
// THE REAL CALLER. §1 and §2 do NOT test exported helpers — `src/agent/engine.js`
// exports `{ runCoupleAgenticTurn }` alone and this sitting does not change that
// (changing it would falsify that file's own F-05.56 island label, which is out
// of this sitting's write radius). The cells drive the REAL `runCoupleAgenticTurn`
// with an injected supabase and a fenced `llm` module, and read the assembled
// messages array off the model call. A green over an unreachable path is not
// evidence; this path is the production one.
//
// FENCE HYGIENE (F-RIG-1's tuition). The `llm` fence is seeded into require.cache
// BEFORE engine.js loads and the engine module is purged between loads, so no
// cell ever reads a module another cell poisoned.
//
// DECLARED WALL. This container holds no database. §4's cells prove the DDL says
// what it must and that a store OBEYING THE PARSED DDL has the required
// properties — the enforcer is derived FROM the migration text, never retyped, so
// defacing 0117 turns them red. The live truth (the table exists in production
// with these constraints) is the founder's `information_schema` verify and it is
// named as such on the smoke card. Provable-equivalent doctrine, stated.

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (p) => path.join(ROOT, p);

let pass = 0, fail = 0;
const fails = [];

async function t(name, fn) {
  try { await fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; fails.push(name); console.log(`  FAIL ${name} — ${e && e.message}`); }
}
function H(s) { console.log(`\n${s}`); }

// ── the fenced loader ────────────────────────────────────────────────────────
const LLM_PATH = require.resolve(SRC('src/lib/llm.js'));

function loadEngine(enginePath, capture) {
  require.cache[LLM_PATH] = {
    id: LLM_PATH, filename: LLM_PATH, loaded: true,
    exports: {
      llmCreate: async (_provider, payload) => {
        capture.payload = payload;
        return { content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn' };
      },
    },
  };
  delete require.cache[require.resolve(enginePath)];
  return require(enginePath);
}

// ── a chainable supabase double ──────────────────────────────────────────────
// `rows` is keyed by table. `throwOn` makes a named table's builder throw.
// `errorOn` makes it return a postgrest-shaped error.
function fakeSupabase(rows = {}, opts = {}) {
  return {
    from(table) {
      if (opts.throwOn === table) throw new Error(opts.throwMessage || 'plane down');
      const data = rows[table] || [];
      const q = {
        select() { return q; }, eq() { return q; }, gte() { return q; },
        in() { return q; }, order() { return q; }, limit() { return q; },
        insert() { return q; }, update() { return q; },
        maybeSingle() {
          if (opts.errorOn === table) return Promise.resolve({ data: null, error: { message: 'boom' } });
          return Promise.resolve({ data: data[0] ?? null, error: null });
        },
        single() { return Promise.resolve({ data: data[0] ?? null, error: null }); },
        then(res, rej) {
          const out = opts.errorOn === table
            ? { data: null, error: { message: 'boom' } }
            : { data, error: null };
          return Promise.resolve(out).then(res, rej);
        },
      };
      return q;
    },
  };
}

// Rows come back from production DESC (newest first) and the builder `.reverse()`s
// them. Fixtures are therefore authored NEWEST FIRST, exactly as the wire delivers.
const msg = (direction, body, sent_by, created_at) => ({ direction, body, sent_by, created_at });

async function assembled(messages, enginePath = SRC('src/agent/engine.js'), inbound = 'Any news from dev?') {
  const capture = {};
  const { runCoupleAgenticTurn } = loadEngine(enginePath, capture);
  await runCoupleAgenticTurn({
    vendor: { id: 'v1' }, vendorUser: { name: 'Dev' },
    conversation: { id: 'c1' }, couplePhone: '+919625759924', coupleId: null,
    inboundMessage: inbound,
    supabase: fakeSupabase({ messages, leads: [], users: [], couples: [], admin_config: [] }),
    anthropic: {},
  });
  return capture.payload.messages;
}

// ── the mutation harness ─────────────────────────────────────────────────────
// Copies a PRODUCTION file, applies a defacement, loads the copy, runs the probe,
// asserts it goes red. An absent anchor is a DECLARED FAIL.
const tmps = [];
function mutate(relPath, anchor, replacement, suffix) {
  const abs = SRC(relPath);
  const src = fs.readFileSync(abs, 'utf8');
  if (!src.includes(anchor)) return null;               // caller declares the FAIL
  const out = path.join(path.dirname(abs), `_mut_${suffix}_bench_tmp.js`);
  fs.writeFileSync(out, src.split(anchor).join(replacement));
  tmps.push(out);
  return out;
}
function cleanup() { for (const f of tmps) { try { fs.unlinkSync(f); } catch (_e) {} } }

async function wentRed(probe) {
  try { await probe(); return false; } catch (_e) { return true; }
}

// ── the migration, parsed once ───────────────────────────────────────────────
const MIG_PATH = SRC('db/migrations/0117_pending_couple_drafts.sql');
const MIG = fs.existsSync(MIG_PATH) ? fs.readFileSync(MIG_PATH, 'utf8') : null;

// Strip comments so a CHECK quoted inside a comment can never satisfy a cell.
function executable(sql) {
  return sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
}
// The register is DERIVED from the migration text, never retyped here. Deface the
// CHECK in 0117 and every cell below that reads this array moves with it.
function parsedStates(sql) {
  const m = executable(sql).match(/state\s*=\s*ANY\s*\(\s*ARRAY\[([^\]]+)\]/i);
  if (!m) return null;
  return m[1].split(',').map((s) => (s.match(/'([^']+)'/) || [])[1]).filter(Boolean);
}
// A store that obeys the parsed DDL. Nothing is asserted about a real database.
function makeStore(states) {
  const rows = [];
  return {
    stage(row) {
      if (!states.includes('staged')) throw new Error('register has no staged state');
      const r = { id: `d${rows.length + 1}`, state: 'staged', resolved_at: null,
                  expires_at: new Date(Date.now() + 24 * 3600e3).toISOString(), ...row };
      rows.push(r); return r.id;
    },
    get(id) { return rows.find((r) => r.id === id) || null; },
    setState(id, s) {
      if (!states.includes(s)) throw new Error(`off-register state refused: ${s}`);
      const r = rows.find((x) => x.id === id);
      r.state = s;
      if (s !== 'staged' && s !== 'approved') r.resolved_at = new Date().toISOString();
      return r;
    },
    open() { return rows.filter((r) => r.resolved_at === null); },
    sendable() { return rows.filter((r) => r.resolved_at === null && r.state !== 'expired'); },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
(async () => {
console.log('b06_relay_foundations_bench — TDW_06 relay seam, sitting one');

// ── §1 · A1 — W-A · MERGE, NEVER DROP (F-06.151) ────────────────────────────
H('§1 A1 — W-A · merge-not-drop');

await t('§1.1 a relayed row following an assistant row REACHES the model', async () => {
  const m = await assembled([
    msg('outbound', 'The amount is Rs 60,000.', 'vendor_relay', '2026-08-08T16:49:53Z'),
    msg('outbound', 'Let me check with dev.',   'agent',        '2026-08-08T16:49:52Z'),
  ]);
  const joined = m.map((x) => x.content).join(' ');
  assert.ok(/Rs 60,000/.test(joined), 'the relayed body is absent from the model context');
  assert.ok(/Let me check with dev/.test(joined), 'the earlier assistant turn was lost');
});

await t('§1.2 alternation is preserved — no two adjacent same-role turns survive', async () => {
  const m = await assembled([
    msg('outbound', 'C', 'agent', '2026-08-08T16:03:00Z'),
    msg('outbound', 'B', 'agent', '2026-08-08T16:02:00Z'),
    msg('inbound',  'A', 'couple', '2026-08-08T16:01:00Z'),
  ]);
  for (let i = 1; i < m.length; i++) {
    assert.notStrictEqual(m[i].role, m[i - 1].role, `adjacent same-role at ${i}`);
  }
});

await t('§1.3 a three-run merges into ONE turn carrying all three bodies', async () => {
  const m = await assembled([
    msg('outbound', 'THIRD',  'agent', '2026-08-08T16:03:00Z'),
    msg('outbound', 'SECOND', 'agent', '2026-08-08T16:02:00Z'),
    msg('outbound', 'FIRST',  'agent', '2026-08-08T16:01:00Z'),
  ]);
  const asst = m.filter((x) => x.role === 'assistant');
  assert.strictEqual(asst.length, 1, `expected one merged assistant turn, got ${asst.length}`);
  for (const w of ['FIRST', 'SECOND', 'THIRD']) {
    assert.ok(asst[0].content.includes(w), `${w} was dropped`);
  }
});

await t('§1.4 a role boundary still SPLITS', async () => {
  const m = await assembled([
    msg('outbound', 'reply', 'agent',  '2026-08-08T16:02:00Z'),
    msg('inbound',  'ask',   'couple', '2026-08-08T16:01:00Z'),
  ]);
  assert.strictEqual(m[0].role, 'user');
  assert.strictEqual(m[0].content, 'ask');
  assert.strictEqual(m[1].role, 'assistant');
  assert.strictEqual(m[1].content, 'reply');
});

await t('§1.5 an already-alternating history is byte-identical to the pre-cure shape', async () => {
  const m = await assembled([
    msg('outbound', 'reply two', 'agent',  '2026-08-08T16:04:00Z'),
    msg('inbound',  'ask two',   'couple', '2026-08-08T16:03:00Z'),
    msg('outbound', 'reply one', 'agent',  '2026-08-08T16:02:00Z'),
    msg('inbound',  'ask one',   'couple', '2026-08-08T16:01:00Z'),
  ]);
  assert.deepStrictEqual(m.slice(0, 4), [
    { role: 'user',      content: 'ask one'   },
    { role: 'assistant', content: 'reply one' },
    { role: 'user',      content: 'ask two'   },
    { role: 'assistant', content: 'reply two' },
  ]);
});

await t('§1.6 order within a merged run is preserved, oldest first', async () => {
  const m = await assembled([
    msg('outbound', 'LATER',   'agent', '2026-08-08T16:02:00Z'),
    msg('outbound', 'EARLIER', 'agent', '2026-08-08T16:01:00Z'),
  ]);
  const c = m.find((x) => x.role === 'assistant').content;
  assert.ok(c.indexOf('EARLIER') < c.indexOf('LATER'), 'merged run is out of order');
});

await t('§1.7 INERTNESS — merged bride turns mint no DAY precision at the real resolver', async () => {
  // The delimiter is EXTRACTED from production output, never retyped here: if it
  // changes to a member of hasDayAdjacentToMonth's `[\s,\-/]` class this cell moves.
  const m = await assembled([
    msg('inbound', '12 guests confirmed',    'couple', '2026-08-08T16:02:00Z'),
    msg('inbound', "we're thinking December", 'couple', '2026-08-08T16:01:00Z'),
  ], SRC('src/agent/engine.js'), 'thanks');
  const merged = m.find((x) => x.role === 'user' && /December/.test(x.content)).content;
  assert.ok(/12 guests/.test(merged), 'the second bride turn did not merge — fixture void');
  const { resolveWeddingDate } = require(SRC('src/agent/datePrecision.js'));
  const r = resolveWeddingDate({ wedding_date: '2026-12-01', raw_message: merged });
  assert.strictEqual(r.precision, 'month',
    `the merge delimiter minted a precision she never spoke (got ${r.precision})`);
});

await t('§1.8 MUTATION — restoring the drop-reduce in PRODUCTION turns §1.1 red', async () => {
  const anchor = '.reduce(mergeSameRole, []);';
  const mut = mutate('src/agent/engine.js', anchor,
    `.reduce((acc, msg) => {\n      if (acc.length === 0) return [msg];\n      if (acc[acc.length - 1].role === msg.role) return acc;\n      return [...acc, msg];\n    }, []);`,
    'engine_drop');
  assert.ok(mut, 'MUTATION ANCHOR ABSENT — this cell proves nothing (uncured tree?)');
  const red = await wentRed(async () => {
    const m = await assembled([
      msg('outbound', 'The amount is Rs 60,000.', 'vendor_relay', '2026-08-08T16:49:53Z'),
      msg('outbound', 'Let me check with dev.',   'agent',        '2026-08-08T16:49:52Z'),
    ], mut);
    assert.ok(/Rs 60,000/.test(m.map((x) => x.content).join(' ')));
  });
  assert.ok(red, '§1.1 passed over the restored drop-reduce — VACUOUS');
});

// ── §2 · A2 — W-B · sent_by SURVIVES (F-06.152) ─────────────────────────────
H('§2 A2 — W-B · provenance survives the role map');

const RELAY = (body, ts) => msg('outbound', body, 'vendor_relay', ts);
const ELIZA = (body, ts) => msg('outbound', body, 'agent',        ts);

await t('§2.1 a relay row is DISTINGUISHABLE from Eliza\'s own prose', async () => {
  const relayed = await assembled([RELAY('The amount is Rs 60,000.', '2026-08-08T16:01:00Z')]);
  const own     = await assembled([ELIZA('The amount is Rs 60,000.', '2026-08-08T16:01:00Z')]);
  assert.notStrictEqual(relayed[0].content, own[0].content,
    'identical bodies produced identical context — sent_by did not survive');
});

await t('§2.2 the distinction SURVIVES the A1 merge', async () => {
  const m = await assembled([
    RELAY('The amount is Rs 60,000.', '2026-08-08T16:02:00Z'),
    ELIZA('Let me check with dev.',   '2026-08-08T16:01:00Z'),
  ]);
  const c = m.find((x) => x.role === 'assistant').content;
  assert.ok(/Rs 60,000/.test(c) && /Let me check/.test(c), 'merge lost a body');
  const marked = c.split('Rs 60,000')[0];
  assert.ok(marked.length > 'Let me check with dev.'.length + 4,
    'the relay body entered the merge unmarked');
});

await t('§2.3 the distinction survives a THREE-row merge', async () => {
  const m = await assembled([
    ELIZA('after',                    '2026-08-08T16:03:00Z'),
    RELAY('The amount is Rs 60,000.', '2026-08-08T16:02:00Z'),
    ELIZA('before',                   '2026-08-08T16:01:00Z'),
  ]);
  const c = m.find((x) => x.role === 'assistant').content;
  for (const w of ['before', 'Rs 60,000', 'after']) assert.ok(c.includes(w), `${w} lost`);
  const seg = c.split(/\n\|\n|\s{2,}/).find((s) => /Rs 60,000/.test(s)) || c;
  assert.ok(!/^The amount/.test(seg.trim()), 'the middle relay body is unmarked inside the merge');
});

await t('§2.4 Eliza\'s own prose carries NO marker', async () => {
  const m = await assembled([ELIZA('Let me check with dev.', '2026-08-08T16:01:00Z')]);
  assert.strictEqual(m[0].content, 'Let me check with dev.',
    'a non-relay row was annotated — every pre-existing shape must be byte-identical');
});

await t('§2.5 the :297-301 premise holds — the USER side carries zero assistant bytes', async () => {
  const m = await assembled([
    RELAY('The amount is Rs 60,000.', '2026-08-08T16:02:00Z'),
    msg('inbound', 'a December wedding', 'couple', '2026-08-08T16:01:00Z'),
  ], SRC('src/agent/engine.js'), 'and the venue?');
  const userSide = m.filter((x) => x.role === 'user').map((x) => x.content).join(' ');
  assert.ok(!/Rs 60,000/.test(userSide), 'assistant bytes reached the user side');
  assert.ok(!/Passed on from the vendor/.test(userSide), 'the marker reached the user side');
});

await t('§2.6 the :96 ternary is still the sole role source — a relay row is `assistant`', async () => {
  const m = await assembled([RELAY('x', '2026-08-08T16:01:00Z')]);
  assert.strictEqual(m[0].role, 'assistant',
    'provenance leaked into `role` — the F-06.85 premise is falsified');
  const roles = new Set(m.map((x) => x.role));
  for (const r of roles) assert.ok(r === 'user' || r === 'assistant', `third role minted: ${r}`);
});

await t('§2.7 MUTATION — stripping the marker in PRODUCTION turns §2.1 red', async () => {
  const anchor = 'content: markRelayProvenance(m),';
  const mut = mutate('src/agent/engine.js', anchor, "content: m.body || '',", 'engine_nomark');
  assert.ok(mut, 'MUTATION ANCHOR ABSENT — this cell proves nothing (uncured tree?)');
  const red = await wentRed(async () => {
    const relayed = await assembled([RELAY('same bytes', '2026-08-08T16:01:00Z')], mut);
    const own     = await assembled([ELIZA('same bytes', '2026-08-08T16:01:00Z')], mut);
    assert.notStrictEqual(relayed[0].content, own[0].content);
  });
  assert.ok(red, '§2.1 passed with the marker stripped — VACUOUS');
});

await t('§2.8 the DURABLE row is byte-untouched — the marker is assembly-time only', async () => {
  const row = RELAY('The amount is Rs 60,000.', '2026-08-08T16:01:00Z');
  const before = row.body;
  const m = await assembled([row]);
  assert.ok(/Passed on from the vendor/.test(m[0].content), 'the marker did not apply — fixture void');
  assert.strictEqual(row.body, before,
    'the source row was mutated — the marker must never reach public.messages.body');
  assert.ok(!/Passed on from the vendor/.test(row.body), 'marker bytes persisted onto the row');
});

// ── §3 · A3 — W-C · THE COUPLE-SIDE WINDOW PREDICATE ────────────────────────
H('§3 A3 — W-C · the couple-side window predicate');

const WIN = SRC('src/lib/vendor/coupleWaWindow.js');
const W = (p = WIN) => { delete require.cache[require.resolve(p)]; return require(p); };

// A supabase double for the predicate. IT HONOURS EVERY FILTER GENERICALLY —
// `eq(col,val)` and `in(col,vals)` are applied as real predicates over real rows,
// on whatever column the production code names. That fidelity is what makes the
// mutations bite: if the code under test starts filtering on a different column,
// the double stops returning the rows and the cell goes red on its own.
//
// `inbounds` maps conversation_id -> hours-ago of that row's freshest inbound.
// The 47-second geometry the founder's paste showed is expressible here.
function winSupabase({ convos = [], inbounds = {}, convoErr = false, msgErr = false, thrower = false }) {
  if (thrower) return { from() { throw new Error('plane down'); } };
  const msgRows = [];
  for (const [cid, agoH] of Object.entries(inbounds)) {
    if (agoH === null || agoH === undefined) continue;
    msgRows.push({
      conversation_id: cid, direction: 'inbound',
      created_at: new Date(Date.now() - agoH * 3600e3).toISOString(),
    });
  }
  const apply = (rows, filters) => rows.filter((r) => filters.every((f) =>
    f.kind === 'eq' ? r[f.col] === f.val : Array.isArray(f.val) && f.val.includes(r[f.col])));

  return {
    from(table) {
      const filters = [];
      const rows = table === 'conversations' ? convos : msgRows;
      const err  = table === 'conversations' ? convoErr : msgErr;
      let desc = false;
      const q = {
        select() { return q; },
        eq(col, val) { filters.push({ kind: 'eq', col, val }); return q; },
        in(col, val) { filters.push({ kind: 'in', col, val }); return q; },
        order(_col, o) { desc = !!(o && o.ascending === false); return q; },
        limit() { return q; },
        maybeSingle() {
          if (err) return Promise.resolve({ data: null, error: { message: 'boom' } });
          const hits = apply(rows, filters).slice()
            .sort((a, b) => (desc ? 1 : -1) * (Date.parse(b.created_at) - Date.parse(a.created_at)));
          return Promise.resolve({ data: hits[0] ?? null, error: null });
        },
        then(res) {
          if (err) return Promise.resolve({ data: null, error: { message: 'boom' } }).then(res);
          return Promise.resolve({ data: apply(rows, filters), error: null }).then(res);
        },
      };
      return q;
    },
  };
}
const CT = (id, phone = '+919625759924') => ({ id, kind: 'couple_thread', counterparty_phone: phone });

await t('§3.1 reason no_supabase_or_phone', async () => {
  assert.deepStrictEqual(await W().coupleWindowOpen(null, '+919625759924'),
    { open: false, reason: 'no_supabase_or_phone' });
  assert.deepStrictEqual(await W().coupleWindowOpen(winSupabase({}), ''),
    { open: false, reason: 'no_supabase_or_phone' });
});

await t('§3.2 reason conversation_query_failed', async () => {
  const r = await W().coupleWindowOpen(winSupabase({ convoErr: true }), '+919625759924');
  assert.strictEqual(r.open, false); assert.strictEqual(r.reason, 'conversation_query_failed');
});

await t('§3.3 reason no_conversation', async () => {
  const r = await W().coupleWindowOpen(winSupabase({ convos: [] }), '+919625759924');
  assert.strictEqual(r.open, false); assert.strictEqual(r.reason, 'no_conversation');
});

await t('§3.4 reason message_query_failed', async () => {
  const r = await W().coupleWindowOpen(winSupabase({ convos: [CT('a')], inbounds: { a: 1 }, msgErr: true }), '+919625759924');
  assert.strictEqual(r.open, false); assert.strictEqual(r.reason, 'message_query_failed');
});

await t('§3.5 reason no_inbound_ever', async () => {
  const r = await W().coupleWindowOpen(winSupabase({ convos: [CT('a')] }), '+919625759924');
  assert.strictEqual(r.open, false); assert.strictEqual(r.reason, 'no_inbound_ever');
});

await t('§3.6 reason window_closed', async () => {
  const r = await W().coupleWindowOpen(winSupabase({ convos: [CT('a')], inbounds: { a: 30 } }), '+919625759924');
  assert.strictEqual(r.open, false); assert.strictEqual(r.reason, 'window_closed');
  assert.strictEqual(r.hours, 30);
});

await t('§3.7 reason window_check_threw — the reason travels, it does not die', async () => {
  const r = await W().coupleWindowOpen(winSupabase({ thrower: true }), '+919625759924');
  assert.strictEqual(r.open, false);
  assert.ok(/^window_check_threw:/.test(r.reason), `got ${r.reason}`);
  assert.ok(/plane down/.test(r.reason), 'the underlying message was swallowed');
});

await t('§3.8 in_window true', async () => {
  const r = await W().coupleWindowOpen(winSupabase({ convos: [CT('a')], inbounds: { a: 1 } }), '+919625759924');
  assert.strictEqual(r.open, true); assert.strictEqual(r.reason, 'in_window');
});

await t('§3.9 NEVER THROWS — a throwing client rejects nothing', async () => {
  let threw = false;
  try { await W().coupleWindowOpen(winSupabase({ thrower: true }), '+919625759924'); }
  catch (_e) { threw = true; }
  assert.strictEqual(threw, false, 'the predicate threw — callers cannot rely on it');
});

await t('§3.10 FAILS CLOSED — every non-in_window return carries open===false', async () => {
  const cases = [
    await W().coupleWindowOpen(null, '+919625759924'),
    await W().coupleWindowOpen(winSupabase({ convoErr: true }), '+919625759924'),
    await W().coupleWindowOpen(winSupabase({ convos: [] }), '+919625759924'),
    await W().coupleWindowOpen(winSupabase({ convos: [CT('a')], inbounds: { a: 1 }, msgErr: true }), '+919625759924'),
    await W().coupleWindowOpen(winSupabase({ convos: [CT('a')] }), '+919625759924'),
    await W().coupleWindowOpen(winSupabase({ convos: [CT('a')], inbounds: { a: 30 } }), '+919625759924'),
    await W().coupleWindowOpen(winSupabase({ thrower: true }), '+919625759924'),
  ];
  for (const c of cases) {
    assert.notStrictEqual(c.reason, 'in_window');
    assert.strictEqual(c.open, false, `open=true on reason ${c.reason}`);
  }
});

await t('§3.11 m1 MUTATION — a single-row scan cannot see the fresher inbound', async () => {
  // The founder's 2026-08-11 paste holds this geometry in production: one bride
  // phone, three couple_thread rows, three DIFFERENT vendors, last inbounds 47
  // seconds apart. Production data is nobody's bench; this is the in-container proof.
  // older: last inbound 30h ago (window shut). fresher: 1h ago (window open).
  // The union must read the FRESHER one. A single-row scan reads the last id.
  const twoRows = winSupabase({
    convos:   [CT('fresher'), CT('older')],
    inbounds: { fresher: 1, older: 30 },
  });
  const green = await W().coupleWindowOpen(twoRows, '+919625759924');
  assert.strictEqual(green.open, true, 'fixture void — the union should be in-window');
  assert.strictEqual(green.rows, 2, 'the union did not scan both rows');

  const mut = mutate('src/lib/vendor/coupleWaWindow.js',
    ".in('conversation_id', ids)", ".eq('conversation_id', ids[ids.length - 1])", 'winsingle');
  assert.ok(mut, 'MUTATION ANCHOR ABSENT — this cell proves nothing (uncured tree?)');
  const red = await wentRed(async () => {
    const r = await W(mut).coupleWindowOpen(twoRows, '+919625759924');
    assert.strictEqual(r.open, true, 'single-row scan missed the fresher inbound');
    assert.strictEqual(r.reason, 'in_window');
  });
  assert.ok(red, 'a single-row scan satisfied the pair contract — VACUOUS');
});

await t('§3.12 m2 MUTATION — keying on a caller-supplied conversation_id goes red', async () => {
  const mut = mutate('src/lib/vendor/coupleWaWindow.js',
    ".eq('counterparty_phone', couplePhone)", ".eq('id', couplePhone)", 'winconvid');
  assert.ok(mut, 'MUTATION ANCHOR ABSENT — this cell proves nothing (uncured tree?)');
  const sb = winSupabase({ convos: [CT('a')], inbounds: { a: 1 } });
  const green = await W().coupleWindowOpen(sb, '+919625759924');
  assert.strictEqual(green.open, true, 'fixture void');
  const red = await wentRed(async () => {
    const r = await W(mut).coupleWindowOpen(sb, '+919625759924');
    assert.strictEqual(r.open, true, 'conversation-id keying found the window');
  });
  assert.ok(red, 'conversation_id keying still answered the pair question — VACUOUS');
});

await t('§3.13 THE LANE CELL — a couple_self row does NOT open the vendor window', async () => {
  const { VENDOR_LANE_KINDS } = W();
  assert.deepStrictEqual(VENDOR_LANE_KINDS, ['couple_thread'],
    'the allowlist moved — couple_self is BRIDE-PNID and unioning it is a false open');
  const brideLaneOnly = winSupabase({
    convos: [{ id: 'cs', kind: 'couple_self', counterparty_phone: '+919625759924' }],
    inbounds: { cs: 1 },
  });
  const r = await W().coupleWindowOpen(brideLaneOnly, '+919625759924');
  assert.strictEqual(r.open, false, 'a bride-lane inbound opened the vendor lane window');
  assert.strictEqual(r.reason, 'no_conversation');
});

await t('§3.14 IMPORT GUARD (R-26.19 §A) — an absent subject is a DECLARED red', async () => {
  const subject = 'src/lib/vendor/coupleWaWindow.js';
  let loaded = null, err = null;
  try { loaded = require(SRC(subject)); } catch (e) { err = e; }
  assert.ok(!err, `SUBJECT ABSENT — ${subject} failed to load: ${err && err.message}`);
  assert.ok(loaded && typeof loaded.coupleWindowOpen === 'function',
    `SUBJECT PRESENT BUT HOLLOW — ${subject} exports no coupleWindowOpen`);
  // and the guard's own failure mode is proven: a genuinely absent module names itself
  let namedIt = false;
  try { require(SRC('src/lib/vendor/coupleWaWindow_DOES_NOT_EXIST.js')); }
  catch (e) { namedIt = /coupleWaWindow_DOES_NOT_EXIST/.test(e.message); }
  assert.ok(namedIt, 'an absent module did not name its subject — the guard is a sentinel that could pass');
});

// ── §4 · A4 — W-D · THE PENDING-DRAFT STORE (0117) ──────────────────────────
H('§4 A4 — W-D · the pending-draft store');

await t('§4.1 0117 exists, is transactional, and ships NO second runnable block', async () => {
  assert.ok(MIG, 'db/migrations/0117_pending_couple_drafts.sql is ABSENT');
  const ex = executable(MIG);
  assert.strictEqual((ex.match(/\bBEGIN;/g) || []).length, 1, 'expected exactly one BEGIN;');
  assert.strictEqual((ex.match(/\bCOMMIT;/g) || []).length, 1, 'expected exactly one COMMIT;');
  assert.ok(!/DROP\s+TABLE/i.test(ex),
    'the revert is RUNNABLE — the conditional-withheld rule requires it fully commented');
  assert.ok(/--.*DROP TABLE IF EXISTS public\.pending_couple_drafts/.test(MIG),
    'the revert direction is missing entirely — it must exist, commented');
});

await t('§4.2 the state CHECK enumerates exactly the five ruled states', async () => {
  const states = parsedStates(MIG);
  assert.ok(states, 'no state CHECK found in executable SQL');
  assert.deepStrictEqual(states.slice().sort(),
    ['approved', 'expired', 'refused', 'sent', 'staged'],
    `register drifted: ${JSON.stringify(states)}`);
});

await t('§4.3 an off-register state is REFUSED', async () => {
  const store = makeStore(parsedStates(MIG));
  const id = store.stage({ vendor_id: 'v1', couple_phone: '+919625759924', body: 'x' });
  assert.throws(() => store.setState(id, 'delivered'), /off-register/);
  assert.throws(() => store.setState(id, 'SENT'), /off-register/);
});

await t('§4.4 the unresolved partial index exists, idx_-prefixed, mirror-verbatim', async () => {
  const ex = executable(MIG);
  assert.ok(/CREATE INDEX IF NOT EXISTS idx_pending_couple_drafts_vendor_open/.test(ex),
    'the open index is missing or not idx_-prefixed');
  assert.ok(/WHERE \(resolved_at IS NULL\)/.test(ex), 'the partial predicate is missing');
});

await t('§4.5 vendor_id is NOT NULL and cascades', async () => {
  const ex = executable(MIG);
  assert.ok(/vendor_id\s+uuid NOT NULL REFERENCES public\.vendors\(id\) ON DELETE CASCADE/.test(ex),
    'the vendor FK is missing, nullable, or does not cascade');
});

await t('§4.6 EQUALITY — retrieved bytes equal staged bytes exactly', async () => {
  const store = makeStore(parsedStates(MIG));
  const BYTES = 'Hi Priya — the amount for the December shoot is Rs 60,000.\nLet me know?';
  const id = store.stage({ vendor_id: 'v1', couple_phone: '+919625759924', body: BYTES });
  assert.strictEqual(store.get(id).body, BYTES, 'shown bytes and stored bytes diverged');
  assert.strictEqual(store.get(id).body.length, BYTES.length, 'length diverged — not equality');
});

await t('§4.7 resolved_at is stamped at the TERMINAL, not at approval', async () => {
  const store = makeStore(parsedStates(MIG));
  const id = store.stage({ vendor_id: 'v1', couple_phone: '+91', body: 'x' });
  assert.strictEqual(store.get(id).resolved_at, null, 'a staged draft is already resolved');
  store.setState(id, 'approved');
  assert.strictEqual(store.get(id).resolved_at, null,
    'approval stamped resolved_at — a crash before send would then be invisible');
  store.setState(id, 'sent');
  assert.ok(store.get(id).resolved_at, 'the terminal transition left resolved_at null');
});

await t('§4.8 resolved rows leave the open predicate', async () => {
  const store = makeStore(parsedStates(MIG));
  const a = store.stage({ vendor_id: 'v1', couple_phone: '+91', body: 'a' });
  store.stage({ vendor_id: 'v1', couple_phone: '+91', body: 'b' });
  assert.strictEqual(store.open().length, 2);
  store.setState(a, 'refused');
  assert.strictEqual(store.open().length, 1, 'a refused draft is still open');
});

await t('§4.9 expires_at is NOT NULL and defaults to the founder-ruled 24 hours', async () => {
  const ex = executable(MIG);
  assert.ok(/expires_at\s+timestamptz NOT NULL DEFAULT \(now\(\) \+ interval '24 hours'\)/.test(ex),
    'expires_at is missing, nullable, or carries an interval the founder did not rule');
});

await t('§4.10 an EXPIRED draft is excluded from the sendable predicate', async () => {
  const store = makeStore(parsedStates(MIG));
  const a = store.stage({ vendor_id: 'v1', couple_phone: '+91', body: 'a' });
  const b = store.stage({ vendor_id: 'v1', couple_phone: '+91', body: 'b' });
  store.setState(a, 'expired');
  const ids = store.sendable().map((r) => r.id);
  assert.deepStrictEqual(ids, [b], 'an expired draft is still sendable');
});

// ── §5 · THE PHONE-FORMAT CONTRACT ──────────────────────────────────────────
H('§5 · the phone-format contract (chair-added on the founder\'s paste)');

await t('§5.1 a BARE-format phone row of an allowlisted kind is a DECLARED MISS', async () => {
  // The founder's 2026-08-11 paste: the prospect_marketing row stores
  // `919625759924` bare while all three couple_thread rows store `+919625759924`.
  // `counterparty_phone` is NOT normalized estate-wide. The predicate matches by
  // exact equality on the +E164 form the couple lane demonstrably stores, and a
  // bare-format row of an ALLOWLISTED kind therefore MISSES. That is the declared
  // contract, asserted here rather than discovered in production.
  const bareRow = winSupabase({
    convos: [{ id: 'bare', kind: 'couple_thread', counterparty_phone: '919625759924' }],
    inbounds: { bare: 1 },
  });
  const r = await W().coupleWindowOpen(bareRow, '+919625759924');
  assert.strictEqual(r.open, false, 'a bare-format row matched — the contract is not what the header says');
  assert.strictEqual(r.reason, 'no_conversation');
  // and the same row DOES match when the caller hands the same format
  const r2 = await W().coupleWindowOpen(bareRow, '919625759924');
  assert.strictEqual(r2.open, true, 'exact-equality matching is broken in both directions');
});

// ── close ───────────────────────────────────────────────────────────────────
cleanup();
console.log(`\n${pass}/${pass + fail} cells green`);
if (fail) { console.log('FAILED:', fails.join(' · ')); process.exit(1); }
})().catch((e) => { cleanup(); console.error('BENCH CRASHED:', e); process.exit(1); });
