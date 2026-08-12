#!/usr/bin/env node
// tools/bench/tdw10c_couple_meter_bench.js
//
// TDW_10.C · DELIVERY 1 — THE COUPLE METER'S BENCH.
//
// Runnable from ANY working directory (Q-SP-5: a cure nobody can re-run
// quietly stops being a cure):
//     node tools/bench/tdw10c_couple_meter_bench.js
//
// ═══════════════════════════════════════════════════════════════════════════
// BOTH-WAYS DISCIPLINE — HOW EACH CELL EARNS ITS GREEN
// ═══════════════════════════════════════════════════════════════════════════
// Every cell below names the MUTATION that reddens it — the production edit,
// not a test-setup tweak. A guard that survives the defacement of the thing it
// guards is not a guard. Where a cell asserts an absence, it asserts it by a
// method whose failure mode differs from the one that produced the claim.
//
// This bench does NOT touch the network or the database. The supabase and
// anthropic clients are fakes that RECORD what they were handed, because the
// question every cell asks is "what row would have been written", not "did
// Postgres accept it".
//
// THE FAKE IS DELIBERATELY STRICTER THAN POSTGRES on the columns it knows
// about — the self-caught vacuity on the P3-D rider was a fake MORE GENEROUS
// than the real plane, and a fake that accepts anything catches nothing.

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const {
  newTurnId, meteredAnthropic, withKind, meterCtxOf,
  recordGeminiSearch, recordVisionCall, KINDS,
} = require(path.join(ROOT, 'src/lib/coupleAiCap'));

let pass = 0, fail = 0;
const results = [];

// Is the ONE cost home reachable? `src/engine/dist/` is gitignored, so an
// unbuilt tree has no price table. DECLARED rather than assumed: the price
// cells assert real rupees when it is there and assert the HONEST DEGRADATION
// (cost_basis='unpriced') when it is not. Both are assertions about production
// behaviour; neither is a stub agreeing with itself.
let COST_HOME = true;
try { require(path.join(ROOT, 'src/engine/dist/core/models')); }
catch (_e) { COST_HOME = false; }

// ── Fakes ────────────────────────────────────────────────────────────────────
// The supabase fake is DELIBERATELY STRICTER than Postgres on the columns it
// knows about: the self-caught vacuity on the P3-D rider was a fake MORE
// GENEROUS than the real plane, and a fake that accepts anything catches
// nothing. It enforces 0120's own NOT NULLs and CHECKs.
const LEDGER = 'couple_ai_usage';
const KNOWN_COLS = new Set([
  'couple_id', 'circle_member_id', 'turn_id', 'kind', 'provider', 'model',
  'input_tokens', 'output_tokens', 'cost_inr', 'cost_basis',
  // F-10.117 (0121). The fake tracks the real table column-for-column; a fake
  // that silently accepted an unknown column would have hidden the very defect
  // this delivery cures.
  'cache_read_tokens', 'cache_write_tokens',
]);

function fakeSupabase() {
  const rows = [], tables = [];
  return {
    rows, tables,
    from(t) {
      tables.push(t);
      return {
        insert: async (row) => {
          if (t === LEDGER) {
            for (const k of Object.keys(row)) {
              if (!KNOWN_COLS.has(k)) return { error: { message: `column "${k}" does not exist` } };
            }
            if (row.couple_id == null) return { error: { message: 'null value in column "couple_id"' } };
            if (!KINDS.includes(row.kind)) return { error: { message: 'kind check violation' } };
            if (row.cost_inr == null) return { error: { message: 'null value in column "cost_inr"' } };
            if (!['metered', 'estimated', 'unpriced'].includes(row.cost_basis)) {
              return { error: { message: 'cost_basis check violation' } };
            }
            rows.push(row);
          }
          return { error: null };
        },
      };
    },
  };
}

function fakeAnthropic(usage = { input_tokens: 100, output_tokens: 40 }) {
  const calls = [];
  return {
    calls,
    messages: {
      create: async (params, options) => {
        calls.push({ params, options });
        return { usage, content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn' };
      },
    },
  };
}

// One async driver, so the report is deterministic rather than interleaved.
(async () => {

  async function acell(name, mutation, fn) {
    let ok = false, detail = '';
    try { const r = await fn(); ok = r === true; if (r !== true) detail = String(r); }
    catch (e) { detail = e.message; }
    ok ? pass++ : fail++;
    results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n        → ${detail}`}\n        ↺ reddens on: ${mutation}`);
  }

  // ── 1 · THE ROW ───────────────────────────────────────────────────────────
  await acell('1.1 one metered call → exactly one ledger row, shape intact',
              'remove the recordAnthropicCall await inside meteredAnthropic',
    async () => {
      const sb = fakeSupabase(), an = fakeAnthropic();
      const tid = newTurnId();
      const m = meteredAnthropic(an, { supabase: sb, couple_id: 'c-1', turn_id: tid, kind: 'turn' });
      await m.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [] });
      if (sb.rows.length !== 1) return `rows=${sb.rows.length}`;
      const r = sb.rows[0];
      if (r.couple_id !== 'c-1') return 'couple_id lost';
      if (r.turn_id !== tid) return 'turn_id lost';
      if (r.kind !== 'turn') return `kind=${r.kind}`;
      if (r.provider !== 'anthropic') return `provider=${r.provider}`;
      if (COST_HOME) {
        if (r.cost_basis !== 'metered') return `basis=${r.cost_basis}`;
        if (!(r.cost_inr > 0)) return `cost_inr=${r.cost_inr} (100 in / 40 out must price above zero)`;
      } else {
        if (r.cost_basis !== 'unpriced') return `unbuilt tree must label the row unpriced, got ${r.cost_basis}`;
        if (r.cost_inr !== 0) return 'a price with no price table is an invention';
      }
      return true;
    });

  await acell('1.2 the response passes through UNMODIFIED',
              'return a rebuilt object from the wrapper instead of `response`',
    async () => {
      const sb = fakeSupabase(), an = fakeAnthropic();
      const m = meteredAnthropic(an, { supabase: sb, couple_id: 'c-1', kind: 'turn' });
      const res = await m.messages.create({ model: 'claude-haiku-4-5-20251001', messages: [] });
      return (res.stop_reason === 'end_turn' && res.content[0].text === 'ok' && res.usage.input_tokens === 100)
        ? true : 'response mutated';
    });

  await acell('1.3 the request OPTIONS argument is forwarded (the timeouts)',
              'drop the `options` branch in meteredAnthropic.messages.create',
    async () => {
      const sb = fakeSupabase(), an = fakeAnthropic();
      const m = meteredAnthropic(an, { supabase: sb, couple_id: 'c-1', kind: 'turn' });
      await m.messages.create({ model: 'x', messages: [] }, { timeout: 8000 });
      const seen = an.calls[0].options;
      return (seen && seen.timeout === 8000) ? true : `options=${JSON.stringify(seen)}`;
    });

  // ── 2 · THE UNIT. G1's whole reason. ──────────────────────────────────────
  await acell('2.1 five loop iterations = five ROWS but ONE turn_id',
              'mint the turn id inside the wrapper instead of at the door',
    async () => {
      const sb = fakeSupabase(), an = fakeAnthropic();
      const tid = newTurnId();
      const m = meteredAnthropic(an, { supabase: sb, couple_id: 'c-1', turn_id: tid, kind: 'turn' });
      for (let i = 0; i < 5; i++) await m.messages.create({ model: 'claude-haiku-4-5-20251001', messages: [] });
      const distinct = new Set(sb.rows.map(r => r.turn_id));
      if (sb.rows.length !== 5) return `rows=${sb.rows.length}`;
      if (distinct.size !== 1) return `distinct turn_ids=${distinct.size} — the dial would price 20 messages as 4`;
      return true;
    });

  await acell('2.2 two doors = two turn ids (the mint is per inbound, not per process)',
              'hoist newTurnId() to module scope in coupleAiCap.js',
    async () => (newTurnId() !== newTurnId()) ? true : 'turn ids collide');

  // ── 3 · THE KINDS. R-30.37's chosen consequences. ─────────────────────────
  await acell('3.1 withKind re-scopes without STACKING (one call ≠ two rows)',
              'delete the __unwrap branch in meteredAnthropic',
    async () => {
      const sb = fakeSupabase(), an = fakeAnthropic();
      const m = meteredAnthropic(an, { supabase: sb, couple_id: 'c-1', turn_id: 't', kind: 'turn' });
      const onb = withKind(m, 'onboarding');
      const fan = withKind(onb, 'fanout');           // re-scoped twice
      await fan.messages.create({ model: 'claude-haiku-4-5-20251001', messages: [] });
      if (sb.rows.length !== 1) return `DOUBLE COUNT: rows=${sb.rows.length}`;
      if (sb.rows[0].kind !== 'fanout') return `kind=${sb.rows[0].kind}`;
      if (sb.rows[0].couple_id !== 'c-1') return 'ctx lost across re-scope';
      if (sb.rows[0].turn_id !== 't') return 'turn_id lost across re-scope';
      return true;
    });

  await acell('3.2 onboarding rows are NOT turns (consequence 1)',
              "change 'onboarding' to 'turn' at the brideEngine hand-off",
    async () => {
      const sb = fakeSupabase(), an = fakeAnthropic();
      const m = withKind(meteredAnthropic(an, { supabase: sb, couple_id: 'c-1', turn_id: 't', kind: 'turn' }), 'onboarding');
      await m.messages.create({ model: 'claude-haiku-4-5-20251001', messages: [] });
      const turnRows = sb.rows.filter(r => r.kind === 'turn');
      if (turnRows.length !== 0) return 'onboarding consumed the cap';
      if (COST_HOME && !(sb.rows[0].cost_inr > 0)) return 'onboarding spend was not priced';
      return true;
    });

  await acell('3.3 an unknown kind is REFUSED, not silently written',
              "widen the KINDS guard in writeRow to accept anything",
    async () => {
      const sb = fakeSupabase(), an = fakeAnthropic();
      const m = meteredAnthropic(an, { supabase: sb, couple_id: 'c-1', kind: 'wedding' });
      await m.messages.create({ model: 'claude-haiku-4-5-20251001', messages: [] });
      return sb.rows.length === 0 ? true : `wrote kind=${sb.rows[0].kind}`;
    });

  // ── 4 · THE TWO NON-ANTHROPIC SITES. The census's blind spot. ─────────────
  await acell('4.1 the Gemini row prices REAL tokens and is labelled estimated',
              "drop `raw` from execFactualSearch's destructure",
    async () => {
      const sb = fakeSupabase();
      await recordGeminiSearch({
        supabase: sb, ctx: { couple_id: 'c-1', turn_id: 't' },
        model: 'gemini-2.0-flash-lite',
        raw: { usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 120 } },
      });
      const r = sb.rows[0];
      if (!r) return 'no row';
      if (r.input_tokens !== 900 || r.output_tokens !== 120) return 'usageMetadata not read';
      if (r.kind !== 'search') return `kind=${r.kind}`;
      const wantBasis = COST_HOME ? 'estimated' : 'unpriced';
      if (r.cost_basis !== wantBasis) return `basis=${r.cost_basis} — a borrowed price must not read as measured`;
      if (COST_HOME && !(r.cost_inr > 0)) return 'borrowed price produced no cost';
      return true;
    });

  await acell('4.2 the Vision row is unpriced-and-says-so (F-10.85, one level up)',
              "set cost_basis 'metered' on recordVisionCall, or drop the row entirely",
    async () => {
      const sb = fakeSupabase();
      await recordVisionCall({ supabase: sb, ctx: { couple_id: 'c-1', turn_id: 't' } });
      const r = sb.rows[0];
      if (!r) return 'the call happened and left no evidence';
      if (r.cost_inr !== 0) return `cost_inr=${r.cost_inr} — no Vision rate exists; a number here is invented`;
      if (r.cost_basis !== 'unpriced') return `basis=${r.cost_basis} — a 0 that reads as free is the disease`;
      if (r.input_tokens !== null || r.output_tokens !== null) return 'a per-image call has no tokens';
      if (r.kind !== 'tagging') return `kind=${r.kind}`;
      return true;
    });

  // ── 5 · FAIL-OPEN. combined_cap §3.4, inherited. ──────────────────────────
  await acell('5.1 a THROWING ledger never costs the bride her reply',
              'remove the try/catch around the insert in writeRow',
    async () => {
      const exploding = { from() { throw new Error('db is on fire'); } };
      const an = fakeAnthropic();
      const m = meteredAnthropic(an, { supabase: exploding, couple_id: 'c-1', kind: 'turn' });
      const res = await m.messages.create({ model: 'claude-haiku-4-5-20251001', messages: [] });
      return res && res.content[0].text === 'ok' ? true : 'the turn died with the meter';
    });

  await acell('5.2 a row with no couple_id is DROPPED, never faked',
              'delete the couple_id guard in writeRow',
    async () => {
      const sb = fakeSupabase(), an = fakeAnthropic();
      const m = meteredAnthropic(an, { supabase: sb, couple_id: null, kind: 'turn' });
      const res = await m.messages.create({ model: 'claude-haiku-4-5-20251001', messages: [] });
      // ASSERTS THE ATTEMPT, NOT THE OUTCOME. The fake rejects a null couple_id
      // as Postgres would, so `rows.length === 0` was green with the module's
      // guard DELETED — the cell was witnessing the fake, not the cure.
      // Self-caught at the mutation sweep; the fix is to check that the ledger
      // was never reached at all.
      if (sb.tables.includes(LEDGER)) return 'attempted a write with no allowance to charge';
      if (sb.rows.length !== 0) return 'wrote a row with no allowance to charge';
      return res.content[0].text === 'ok' ? true : 'the guard cost a reply';
    });

  await acell('5.3 a model call that THROWS still reaches the caller\'s catch',
              'swallow the error inside the wrapper',
    async () => {
      const sb = fakeSupabase();
      const boom = { messages: { create: async () => { throw new Error('overloaded'); } } };
      const m = meteredAnthropic(boom, { supabase: sb, couple_id: 'c-1', kind: 'turn' });
      try { await m.messages.create({ model: 'x', messages: [] }); return 'error was swallowed'; }
      catch (e) {
        if (e.message !== 'overloaded') return `wrong error: ${e.message}`;
        return sb.rows.length === 0 ? true : 'billed a call that never happened';
      }
    });

  // ── 6 · THE SITES ARE ACTUALLY WIRED. Source-level, not behavioural. ──────
  const fs = require('fs');
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

  await acell('6.1 F-10.114 — the fan-out SELECT is bounded',
              'delete the .limit(FANOUT_MAX_SESSIONS) at brideEngine.js:~1918',
    async () => {
      const src = read('src/agent/brideEngine.js');
      const i = src.indexOf("from('circle_sessions')");
      if (i < 0) return 'the fan-out SELECT moved — re-derive this cell';
      const window = src.slice(i, i + 600);
      if (!/\.limit\(\s*FANOUT_MAX_SESSIONS\s*\)/.test(window)) return 'the fan-out is unbounded again';
      return /const FANOUT_MAX_SESSIONS\s*=\s*\d+/.test(src) ? true : 'the limit has no named ceiling';
    });

  await acell('6.2 every door threads a METERED client (no raw `anthropic,` left)',
              'revert any one door to passing the bare client',
    async () => {
      const doors = [
        ['src/lib/brideInbound.js',   'meterAnthropic'],
        ['src/api/couple/chat.js',    'meteredAnthropic(anthropic'],
        ['src/brideIndex.js',         'circleMeterAnthropic'],
        ['src/api/couple/muse.js',    'meteredAnthropic(anthropic'],
      ];
      for (const [f, needle] of doors) {
        if (!read(f).includes(needle)) return `${f} lost its meter`;
      }
      return true;
    });

  await acell('6.3 the two non-Anthropic sites are recorded at their own call',
              'delete the recordVisionCall / recordGeminiSearch call sites',
    async () => {
      if (!read('src/lib/imagePipeline.js').includes('recordVisionCall(')) return 'Vision unmetered';
      if (!read('src/agent/brideEngine.js').includes('recordGeminiSearch(')) return 'Gemini unmetered';
      return true;
    });

  await acell('6.4 THE SOLE-WRITER RIDER — exactly one insert home for the ledger',
              "add a second `from('couple_ai_usage').insert` anywhere in src/",
    async () => {
      const { execSync } = require('child_process');
      const out = execSync(
        `grep -rn "couple_ai_usage" ${JSON.stringify(path.join(ROOT, 'src'))} || true`,
        { encoding: 'utf8' });
      const inserts = out.split('\n').filter(l => /insert/.test(l));
      if (inserts.length !== 1) return `insert homes=${inserts.length}:\n${inserts.join('\n')}`;
      return /coupleAiCap\.js/.test(inserts[0]) ? true : `writer is not the module: ${inserts[0]}`;
    });

  await acell('6.5 DELIVERY 1 REFUSES NOTHING — no cap read, no gate, no refusal byte',
              'add a cap read or a refusal string to coupleAiCap.js',
    async () => {
      const src = read('src/lib/coupleAiCap.js');
      // Comments are stripped first: this file DISCUSSES delivery 3 at length
      // and must be allowed to. What it may not do is READ a dial or DECIDE.
      const code = src.replace(/^\s*\/\/.*$/gm, '');
      const forbidden = ['admin_config', 'couple_ai_daily', 'couple_ai_monthly', 'turns_cap', 'CAPPED_LINE'];
      const hits = forbidden.filter(w => code.includes(w));
      return hits.length === 0 ? true : `delivery 3 leaked into delivery 1: ${hits.join(', ')}`;
    });

  // ── 7 · F-10.117 — THE ROW CAN NOW PROVE ITS OWN NUMBER (0121) ────────────
  await acell('7.1 an anthropic row carries the cache tokens that priced it',
              'delete the cache_read_tokens / cache_write_tokens lines in recordAnthropicCall',
    async () => {
      const sb = fakeSupabase();
      // The exact shape of the first production row's successor: a cached prefix.
      const an = fakeAnthropic({
        input_tokens: 707, output_tokens: 54,
        cache_read_input_tokens: 0, cache_creation_input_tokens: 12498,
      });
      const m = meteredAnthropic(an, { supabase: sb, couple_id: 'c-1', turn_id: 't', kind: 'turn' });
      await m.messages.create({ model: 'claude-haiku-4-5-20251001', messages: [] });
      const r = sb.rows[0];
      if (!r) return 'no row';
      if (r.cache_read_tokens !== 0) return `cache_read=${r.cache_read_tokens}`;
      if (r.cache_write_tokens !== 12498) return `cache_write=${r.cache_write_tokens} — the column that explains the rupees`;
      // THE POINT OF THE FINDING: the four token columns must now reproduce the
      // cost. Without cache_write, 707/54 alone price at a fraction of it.
      if (COST_HOME) {
        const bare = require(path.join(ROOT, 'src/engine/dist/core/models'))
          .calcCostInr('claude-haiku-4-5-20251001', 707, 54, 0, 0);
        if (!(r.cost_inr > bare)) return `cost ${r.cost_inr} does not exceed the no-cache price ${bare} — the cache is not reaching the price`;
      }
      return true;
    });

  await acell('7.2 the non-token providers do NOT invent cache columns',
              'copy the cache lines into recordVisionCall or recordGeminiSearch',
    async () => {
      const sb = fakeSupabase();
      await recordVisionCall({ supabase: sb, ctx: { couple_id: 'c-1' } });
      await recordGeminiSearch({
        supabase: sb, ctx: { couple_id: 'c-1' }, model: 'gemini-2.0-flash-lite',
        raw: { usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 120 } },
      });
      for (const r of sb.rows) {
        if ('cache_read_tokens' in r || 'cache_write_tokens' in r) {
          return `${r.provider} claimed Anthropic cache columns it has no concept of`;
        }
      }
      return true;
    });

  // ── REPORT ────────────────────────────────────────────────────────────────
  console.log('\nTDW_10.C · DELIVERY 1 — COUPLE METER BENCH\n' + '─'.repeat(72));
  console.log(`  cost home (src/engine/dist): ${COST_HOME ? 'BUILT — real rupees asserted' : 'UNBUILT — honest-degradation asserted instead'}`);
  console.log('─'.repeat(72));
  for (const r of results) console.log('  ' + r);
  console.log('─'.repeat(72));
  console.log(`  ${pass}/${pass + fail} cells green\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
