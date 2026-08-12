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
  readCoupleCap, refusalByteFor, coupleCapGate, surfaceForCouple, onboardingRefusesAt,
  dialValue, CAP_BYTES, ZERO_ONBOARDING_ARMED, CAP_BYTE_ONBOARDING_ZERO,
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
              'delete the .limit(FANOUT_MAX_SESSIONS) in surfacePendingCircleSessions',
    async () => {
      // ── LABELLED AMENDMENT (B-09H D-3b, NOT pre-authorised — surfaced for
      //    ratify-or-revert). This cell located its subject by the FIRST
      //    `from('circle_sessions')` in the file. D-3b's playback cure added a
      //    SECOND reader of that table — execListMuse's stamp resolution — and it
      //    sits EARLIER in the file than the fan-out. The cell then measured the
      //    resolver, found no FANOUT_MAX_SESSIONS on it, and reported the fan-out
      //    unbounded. THE CEILING NEVER MOVED; the anchor did.
      //    Cured by anchoring on the FUNCTION rather than on file order, so a
      //    third reader of this table cannot re-break it. Count unchanged: 38.
      //    Revert, if the chair refuses: restore `src.indexOf("from('circle_sessions')")`.
      const src = read('src/agent/brideEngine.js');
      const fn = src.indexOf('async function surfacePendingCircleSessions');
      if (fn < 0) return 'surfacePendingCircleSessions moved — re-derive this cell';
      const i = src.indexOf("from('circle_sessions')", fn);
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

  // ── LABELLED AMENDMENT, TDW_10.C DELIVERY 3 ─────────────────────────────
  // RE-AIMED, NOT DELETED. This cell asserted 「 delivery 1 refuses nothing 」 —
  // no cap read, no gate, no refusal byte in the meter module. That was true
  // when written and it is no longer the truth to assert: delivery 3 is the
  // third act of ⑨'s own sequence and the gate lives in this module by fork F3's
  // ruling. A cell left asserting the old invariant goes red the moment its
  // subject lawfully arrives, and gets "fixed" by deletion — the exact failure
  // the combined_cap §6.4 precedent exists to prevent.
  //
  // THE TEETH ARE KEPT, AIMED AT WHAT STILL MUST BE TRUE. The original worry was
  // that COUNTING must never depend on REFUSING. That worry outlives delivery 1
  // and is now asserted directly:
  //   (a) the gate is READ-ONLY on the dials — a gate that can move its own
  //       ceiling is not a gate;
  //   (b) the ledger writers carry NO cap decision — a broken gate must never
  //       be able to stop a row being counted, which is what makes fail-open
  //       survivable at all.
  // RATIFY-OR-REVERT.
  await acell('6.5 counting never depends on refusing — the gate reads dials, never writes them',
              "add an admin_config .update()/.insert() to coupleAiCap.js, or a cap read inside writeRow",
    async () => {
      const src = read('src/lib/coupleAiCap.js');
      const code = src.replace(/^\s*\/\/.*$/gm, '');
      // (a) READ-ONLY on the dials.
      const cfgWrites = code.match(/from\(['"]admin_config['"]\)[\s\S]{0,120}?\.(update|insert|upsert|delete)\(/g) || [];
      if (cfgWrites.length) return `the gate can move its own ceiling: ${cfgWrites.join(' | ')}`;
      // (b) the WRITER half holds no cap decision. Slice the module at the
      // delivery-3 banner and assert the meter half is free of gate state.
      // Cut on a CODE marker, never a comment banner: this cell strips comments
      // first, so slicing at the '// DELIVERY 3' header found nothing and the
      // "meter half" silently became the whole file including module.exports.
      // Self-caught — a boundary that can vanish is not a boundary.
      const cut = code.indexOf('const CAP_BYTES');
      if (cut < 0) return 'the delivery-3 boundary marker moved — re-derive this cell';
      const meterHalf = code.slice(0, cut);
      for (const w of ['readCoupleCap(', 'refusalByteFor(', 'coupleCapGate(', 'CAP_BYTES']) {
        if (meterHalf.includes(w)) return `refusing leaked into counting: ${w}`;
      }
      return true;
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

  // ── 8 · DELIVERY 3 — THE GATE ────────────────────────────────────────────
  // A supabase fake that answers the gate's two reads: the dial rows and the
  // turn rows. Stricter than needed on purpose — it returns exactly what the
  // real query shape returns, so a cell cannot pass on a shape production
  // never produces.
  function capSupabase({ dials = {}, turnRows = [], throwOn = null }) {
    return {
      from(t) {
        if (throwOn === t) throw new Error(`${t} is on fire`);
        if (t === 'admin_config') {
          return { select: () => ({ in: async (_c, keys) => ({
            data: keys.filter((k) => k in dials).map((k) => ({ key: k, value: dials[k] })),
            error: null }) }) };
        }
        if (t === 'couple_ai_usage') {
          const q = {
            select: () => q, eq: () => q, not: () => q,
            gte: async () => ({ data: turnRows, error: null }),
          };
          return q;
        }
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
      },
    };
  }
  const T = (id) => ({ turn_id: id });

  await acell('8.1 F-10.85 — A STORED ZERO IS A DENY, not an absent dial',
              "use `Number(v) || Infinity` in dialValue, or drop the zero branch in readCoupleCap",
    async () => {
      if (dialValue('0', Infinity) !== 0) return 'dialValue swallowed a zero';
      const sb = capSupabase({ dials: { couple_ai_daily_basic: '0', couple_ai_monthly_basic: '600' } });
      const cap = await readCoupleCap({ supabase: sb, couple: { id: 'c-1', tier: 'basic' } });
      if (cap.state !== 'zero') return `state=${cap.state} — the founder's brake did not engage`;
      return refusalByteFor('zero', 'bride') === CAP_BYTES.zero ? true : 'wrong byte at zero';
    });

  await acell('8.2 an ABSENT dial is UNCAPPED — absence is not zero',
              'default dayCap/monCap to 0 instead of Infinity in readCoupleCap',
    async () => {
      const sb = capSupabase({ dials: {}, turnRows: [T('a'), T('b'), T('c')] });
      const cap = await readCoupleCap({ supabase: sb, couple: { id: 'c-1' } });
      return cap.state === 'ok' ? true : `state=${cap.state} — a missing key must never refuse`;
    });

  await acell('8.3 the unit is the TURN — five rows, one turn_id, not five',
              'count rows instead of DISTINCT turn_id in countTurns',
    async () => {
      const rows = [T('t1'), T('t1'), T('t1'), T('t1'), T('t1')];
      const sb = capSupabase({ dials: { couple_ai_daily_basic: '3', couple_ai_monthly_basic: '600' }, turnRows: rows });
      const cap = await readCoupleCap({ supabase: sb, couple: { id: 'c-1' } });
      if (cap.dayUsed !== 1) return `dayUsed=${cap.dayUsed} — one message priced as ${cap.dayUsed}`;
      return cap.state === 'ok' ? true : 'a single message tripped a cap of 3';
    });

  await acell('8.4 the daily ceiling refuses at >=, with the vetoed byte',
              'change >= to > in readCoupleCap, or edit the frozen byte',
    async () => {
      const sb = capSupabase({ dials: { couple_ai_daily_basic: '2', couple_ai_monthly_basic: '600' },
                               turnRows: [T('t1'), T('t2')] });
      const g = await coupleCapGate({ supabase: sb, couple: { id: 'c-1' }, surface: 'bride' });
      if (!g.refuse) return 'the ceiling did not hold';
      return g.byte === "You've reached today's conversation limit. I'll be right here at midnight."
        ? true : `BYTE DRIFT: ${g.byte}`;
    });

  await acell('8.5 PRECEDENCE — zero > monthly > daily (fork E)',
              'reorder the state branches in readCoupleCap',
    async () => {
      // All three conditions true at once: the byte must not claim a
      // consumption that never happened.
      const sb = capSupabase({ dials: { couple_ai_daily_basic: '0', couple_ai_monthly_basic: '0' },
                               turnRows: [T('t1'), T('t2'), T('t3')] });
      const cap = await readCoupleCap({ supabase: sb, couple: { id: 'c-1' } });
      if (cap.state !== 'zero') return `state=${cap.state}`;
      const sb2 = capSupabase({ dials: { couple_ai_daily_basic: '1', couple_ai_monthly_basic: '2' },
                                turnRows: [T('t1'), T('t2')] });
      const cap2 = await readCoupleCap({ supabase: sb2, couple: { id: 'c-1' } });
      return cap2.state === 'monthly' ? true : `monthly must outrank daily, got ${cap2.state}`;
    });

  await acell('8.6 FAIL-OPEN — a meter that throws never silences the agent',
              'remove the try/catch in readCoupleCap',
    async () => {
      const sb = capSupabase({ dials: { couple_ai_daily_basic: '0' }, throwOn: 'admin_config' });
      const g = await coupleCapGate({ supabase: sb, couple: { id: 'c-1' }, surface: 'bride' });
      if (g.refuse) return 'a BROKEN meter refused a bride — the gate failed CLOSED';
      return g.degraded === true ? true : 'the degradation was not declared';
    });

  await acell('8.7 fork B — onboarding is EXEMPT from a reached cap, NOT from zero',
              "return the bride byte for surface 'onboarding' regardless of state",
    async () => {
      if (surfaceForCouple({ onboarding_state: 'asked_date' }) !== 'onboarding') return 'surface resolver missed';
      if (surfaceForCouple({ onboarding_state: 'complete' }) !== 'bride') return 'complete must read as bride';
      // ASSERTED ON THE PREDICATE, NOT THE BYTE. With the zero byte unarmed,
      // refusalByteFor returns null for every onboarding state — so deleting the
      // exemption entirely would have left this cell green. Self-caught in the
      // mutation sweep; the predicate is where the rule actually lives.
      if (onboardingRefusesAt('daily') !== false) return 'a bride mid-signup was refused for a cap she never spent';
      if (onboardingRefusesAt('monthly') !== false) return 'monthly leaked into onboarding';
      if (onboardingRefusesAt('zero') !== true) return 'the founder\'s brake left one engine running';
      if (refusalByteFor('daily', 'onboarding') !== null) return 'a byte reached an exempt surface';
      // ── LABELLED AMENDMENT, TDW_10.C ARMING MICRO (relay №5 §1) ─────────
      // RE-AIMED, NOT DELETED. This assertion required the byte to stay UNARMED
      // and `refusalByteFor('zero','onboarding')` to return null — correct while
      // the veto was outstanding, and no longer the truth to assert: the founder
      // approved it verbatim at 541b945.
      //
      // TEETH KEPT AND SHARPENED. The old form guarded 「 no unvetoed byte
      // reaches a bride 」; the new form guards 「 the VETOED byte reaches her,
      // byte-exact 」 — which is the same law (copy carries its decision) pointed
      // at the state that now exists. The exemption predicate above is untouched
      // and still asserts the zero dial is the ONLY state that refuses here.
      // RATIFY-OR-REVERT.
      if (ZERO_ONBOARDING_ARMED !== true) return 'the approved byte was left unarmed';
      const z = refusalByteFor('zero', 'onboarding');
      if (z !== 'Chat is paused right now.') return `BYTE DRIFT: ${z}`;
      if (z !== CAP_BYTE_ONBOARDING_ZERO) return 'the constant and the resolver disagree';
      // It must remain the TRIMMED byte. The full zero sentence promises a state
      // a bride mid-signup does not hold — that is the whole of §0.2-J.
      if (z === CAP_BYTES.zero) return 'the untrimmed zero byte reached the onboarding surface';
      return true;
    });

  await acell('8.8 the circle byte carries no upgrade language and no numbers',
              'edit the frozen circle byte',
    async () => {
      const b = refusalByteFor('daily', 'circle');
      if (b !== "The board's chat is quiet for today — you can still browse and add to it any time.") {
        return `BYTE DRIFT: ${b}`;
      }
      if (/upgrade|plan|limit|\d/i.test(b)) return 'the circle byte learned about her allowance';
      // Every state resolves to the SAME circle sentence — he is not the
      // customer and his experience does not vary with her window.
      return (refusalByteFor('zero', 'circle') === b && refusalByteFor('monthly', 'circle') === b)
        ? true : 'the circle byte varies by her window';
    });

  // ── D3a · §0.2-K — THE STRUCTURAL CELL THAT WOULD HAVE CAUGHT IT ─────────
  // Cell 8.9 below lists doors BY HAND, and a hand-list is exactly what missed
  // the in-app Muse door: D3 threaded fork A through museSave.js and this route
  // calls processImageForMuse directly. The founder's own upload at a 0 dial
  // spent behind a closed gate three minutes later.
  //
  // This cell asserts the PROPERTY instead of the list — every call site of the
  // paid image pipeline must carry the cap flag — so a call site added by a
  // future sitting cannot be silently ungated. Same principle as wrapping the
  // client rather than editing ten sites, applied to the bench itself.
  await acell('8.10 EVERY processImageForMuse call site passes capSkipTagging',
              'add a processImageForMuse( call anywhere in src/ without the flag',
    async () => {
      const { execSync } = require('child_process');
      const out = execSync(
        `grep -rn "processImageForMuse({" ${JSON.stringify(path.join(ROOT, 'src'))} || true`,
        { encoding: 'utf8' }).trim();
      // INVOCATIONS ONLY. The first draft of this cell flagged
      // imagePipeline.js:15 and :318 — both COMMENT lines documenting the
      // signature — and a cell that cries wolf on documentation gets muted by
      // the next reader. Match the call form (`await …` / `= …`), never a
      // mention. The definition (`async function processImageForMuse({`) is
      // excluded by the same rule rather than by naming its file.
      const sites = (out ? out.split('\n') : []).filter((l) => {
        const code = l.slice(l.indexOf(':', l.indexOf(':') + 1) + 1);
        if (/^\s*(\/\/|\*)/.test(code)) return false;
        return /(await|=)\s+processImageForMuse\(\{/.test(code);
      });
      if (sites.length === 0) return 'no call sites found — the pipeline moved, re-derive this cell';
      const fs2 = require('fs');
      const ungated = [];
      for (const line of sites) {
        const [file, lineNo] = [line.split(':')[0], Number(line.split(':')[1])];
        const body = fs2.readFileSync(file, 'utf8').split('\n').slice(lineNo - 1, lineNo + 25).join('\n');
        if (!/capSkipTagging/.test(body)) ungated.push(`${file}:${lineNo}`);
      }
      return ungated.length === 0 ? true
        : `UNGATED paid-image call site(s): ${ungated.join(', ')}`;
    });

  await acell('8.9 the doors are gated at source, and the skips log by name',
              'revert any door to running the engine without a gate read',
    async () => {
      const fs2 = require('fs');
      const rd = (f) => fs2.readFileSync(path.join(ROOT, f), 'utf8');
      const doors = [
        ['src/lib/brideInbound.js', 'capGate.refuse'],
        ['src/api/couple/chat.js',  'capGateSse.refuse'],
        ['src/api/couple/chat.js',  'capGateJson.refuse'],
        ['src/brideIndex.js',       'circleCapGate.refuse'],
      ];
      for (const [f, needle] of doors) if (!rd(f).includes(needle)) return `${f} lost ${needle}`;
      if (!rd('src/lib/imagePipeline.js').includes('logCapSkip(')) return 'fork A skip is silent — F-09.173 class';
      if (!rd('src/lib/museSave.js').includes('capSkipTagging')) return 'fork A does not reach the pipeline';
      return true;
    });

  // ── 9 · CE-31 BF-1 — THE LEDGER RECORDS THE WIRE ──────────────────────────
  // The labelled amendment to 10.C's sealed writer, benched both ways. §9 is
  // the reason the bride-lane provider flip can be trusted to price itself:
  // without it the ledger transcribes the caller's belief and the lane the
  // meter exists to watch is the one lane it silently mis-prices.
  const { buildBrideClient, resolveBrideProvider, wireModelFor } =
    require(path.join(ROOT, 'src/lib/brideLlmClient'));

  // A declaring client that never leaves the process — the adapter's SHAPE
  // (the two __wire fields) is what the writer reads, so the fake carries the
  // shape and nothing else. Asserting through the real adapter would demand a
  // live endpoint; asserting through the shape is the same contract.
  function declaringFake(provider, wireModel, usage = { input_tokens: 100, output_tokens: 40 }) {
    const calls = [];
    return {
      calls,
      __wireProvider: provider,
      __wireModel: wireModel,
      messages: {
        create: async (params, options) => {
          calls.push({ params, options });
          return { usage, content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn' };
        },
      },
    };
  }

  // The adapter destructures llm.js's exports AT REQUIRE TIME, so reassigning
  // `llm.clientFor` cannot reach it — the binding is already captured. (First
  // draft did exactly that and reddened on a missing API key: the stub was
  // never installed.) What IS shared is the memoised client object itself, so
  // the stub goes on THAT, and the key env is set only long enough to let the
  // SDK construct. The key is never read, never printed, and restored after.
  function stubWire(fn) {
    const llm = require(path.join(ROOT, 'src/lib/llm.js'));
    const hadKey = Object.prototype.hasOwnProperty.call(process.env, 'DEEPSEEK_API_KEY');
    const prevKey = process.env.DEEPSEEK_API_KEY;
    if (!hadKey) process.env.DEEPSEEK_API_KEY = 'bench-placeholder-never-sent';
    const client = llm.clientFor('deepseek');
    const realCreate = client.messages.create;
    client.messages.create = async (p, o) => fn(p, o);
    return () => {
      client.messages.create = realCreate;
      if (!hadKey) delete process.env.DEEPSEEK_API_KEY; else process.env.DEEPSEEK_API_KEY = prevKey;
    };
  }

  await acell('9.1 a DECLARING client writes the WIRE provider and model, not the caller\'s',
              "restore `provider: PROVIDER_ANTHROPIC` / `model: params.model` in recordAnthropicCall",
    async () => {
      const sb = fakeSupabase();
      const an = declaringFake('deepseek', 'deepseek-v4-flash');
      const m = meteredAnthropic(an, { supabase: sb, couple_id: 'c-9', turn_id: newTurnId(), kind: 'turn' });
      // The caller passes HAIKU — exactly as brideEngine.js:214 does today and
      // will keep doing after the flip. The row must disagree with it.
      await m.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [] });
      if (sb.rows.length !== 1) return `rows=${sb.rows.length}`;
      const r = sb.rows[0];
      if (r.provider !== 'deepseek') return `provider=${r.provider} — the row still believes the caller`;
      if (r.model !== 'deepseek-v4-flash') return `model=${r.model} — the row still believes the caller`;
      return true;
    });

  await acell('9.2 OFF STATE PINNED AT THE BYTE: a non-declaring client writes 10.C\'s row exactly',
              'make the wire preference unconditional (drop the `|| PROVIDER_ANTHROPIC` fallback)',
    async () => {
      const sb = fakeSupabase(), an = fakeAnthropic();   // the pre-amendment fake, untouched
      const m = meteredAnthropic(an, { supabase: sb, couple_id: 'c-9', turn_id: newTurnId(), kind: 'turn' });
      await m.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [] });
      const r = sb.rows[0];
      if (!r) return 'no row';
      if (r.provider !== 'anthropic') return `provider=${r.provider} — the couple web lane moved and nobody asked it to`;
      if (r.model !== 'claude-haiku-4-5-20251001') return `model=${r.model} — the caller's string was dropped`;
      // Empty-string and non-string declarations are ABSENT, not truth. A
      // half-built adapter must degrade to 10.C, never to a null provider on a
      // NOT NULL column.
      const sb2 = fakeSupabase(), an2 = declaringFake('', '');
      const m2 = meteredAnthropic(an2, { supabase: sb2, couple_id: 'c-9', turn_id: newTurnId(), kind: 'turn' });
      await m2.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [] });
      const r2 = sb2.rows[0];
      if (!r2) return 'empty declaration wrote no row at all';
      if (r2.provider !== 'anthropic' || r2.model !== 'claude-haiku-4-5-20251001') {
        return `empty declaration was treated as truth: provider=${r2.provider} model=${r2.model}`;
      }
      return true;
    });

  await acell('9.3 THE PRICE FOLLOWS THE WIRE: the declared string hits the DeepSeek row, not the Haiku ceiling',
              "declare a model models.ts has no PRICING row for (calcCostInr's `?? PRICING[haiku]` fallback)",
    async () => {
      if (!COST_HOME) return 'cost home unbuilt — this cell asserts real rupees and cannot run vacuously';
      const usage = { input_tokens: 1_000_000, output_tokens: 0 };
      const mk = async (provider, wireModel) => {
        const sb = fakeSupabase();
        const m = meteredAnthropic(declaringFake(provider, wireModel, usage),
          { supabase: sb, couple_id: 'c-9', turn_id: newTurnId(), kind: 'turn' });
        await m.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [] });
        return sb.rows[0];
      };
      // 1M input tokens: DeepSeek $0.14 → ₹14. Haiku $1.00 → ₹100. The two
      // prices are 7x apart, so a fallback cannot hide inside rounding.
      const ds = await mk('deepseek', 'deepseek-v4-flash');
      if (!(Math.abs(ds.cost_inr - 14) < 0.01)) {
        return `1M input at the deepseek row must be ₹14, got ₹${ds.cost_inr} — calcCostInr fell back to the Haiku ceiling`;
      }
      // And the fallback still WORKS where it should: an unpriced string is
      // over-stated at the Haiku ceiling, deliberately, per models.ts:76.
      const unknown = await mk('deepseek', 'deepseek-v9-imaginary');
      if (!(Math.abs(unknown.cost_inr - 100) < 0.01)) {
        return `an unknown string must over-state at the Haiku ceiling (₹100), got ₹${unknown.cost_inr}`;
      }
      // The string the adapter will actually declare is the one priced above —
      // derived from the table, not restated, so a CONF edit reddens this.
      if (wireModelFor('deepseek') !== 'deepseek-v4-flash') {
        return `the table now resolves ${wireModelFor('deepseek')} — models.ts has no price row for it`;
      }
      return true;
    });

  await acell('9.4 the adapter is built from the env; OFF declares nothing and carries no __unwrap',
              'point brideIndex.js:81 back at a raw `new Anthropic(...)`, or make the OFF branch declare a wire',
    async () => {
      const fs2 = require('fs');
      const rd = (f) => fs2.readFileSync(path.join(ROOT, f), 'utf8');
      // Comments stripped before the absence test, this bench's own §12 method:
      // brideIndex.js:83 QUOTES the byte it replaced so the next reader sees the
      // OFF state spelled out, and a grep that cannot tell code from commentary
      // reddens on documentation. Self-caught on this cell's first run.
      const idx = rd('src/brideIndex.js');
      const idxCode = idx.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
      if (!/const anthropic = buildBrideClient\(process\.env\)/.test(idxCode)) {
        return 'brideIndex.js no longer builds its client from the env — the flip is unreachable';
      }
      if (/new Anthropic\(/.test(idxCode)) return 'a raw client returned to brideIndex.js — it would bypass the table';
      // OFF is the byte it replaced, and an unrecognised value is OFF too.
      if (resolveBrideProvider({}) !== 'anthropic') return 'unset no longer means anthropic';
      if (resolveBrideProvider({ BRIDE_LLM_PROVIDER: 'deepsek' }) !== 'anthropic') {
        return 'a typo no longer falls back — a mistyped Railway variable would take the lane down';
      }
      if (resolveBrideProvider({ BRIDE_LLM_PROVIDER: ' DeepSeek ' }) !== 'deepseek') return 'the value is not normalised';
      const off = buildBrideClient({ ANTHROPIC_API_KEY: 'x' });
      if (off.__wireProvider !== undefined || off.__wireModel !== undefined) {
        return 'the OFF client declares a wire — it would stop taking 10.C\'s path';
      }
      if (off.__unwrap !== undefined) return 'the OFF client carries __unwrap — the meter\'s stacking guard would misfire';
      const on = buildBrideClient({ BRIDE_LLM_PROVIDER: 'deepseek', DEEPSEEK_API_KEY: 'x' });
      if (on.__unwrap !== undefined) return 'the adapter carries __unwrap — meteredAnthropic would unwrap to a non-client';
      if (on.__wireModel !== 'deepseek-v4-flash') return `the adapter declares ${on.__wireModel}`;
      return true;
    });

  await acell('9.4b THE TIMEOUT SURVIVES THE FLIP: request options reach the wire, not the floor',
              'drop the `options` forward in brideLlmClient.js (call llmCreate, which takes none)',
    async () => {
      // brideEngine.js:2150 passes `{ timeout: 8000 }`. On a foreign endpoint a
      // dropped deadline is a hang inside a bride's turn with no symptom to
      // grep for. The adapter is exercised against a STUBBED module client so
      // the assertion is about production forwarding, not about DeepSeek.
      const seen = [];
      const restore = stubWire((p, o) => { seen.push({ p, o }); return { usage: {}, content: [] }; });
      try {
        const on = buildBrideClient({ BRIDE_LLM_PROVIDER: 'deepseek', DEEPSEEK_API_KEY: 'x' });
        await on.messages.create({ model: 'claude-haiku-4-5-20251001', messages: [] }, { timeout: 8000 });
        await on.messages.create({ model: 'claude-haiku-4-5-20251001', messages: [] });
      } finally { restore(); }
      if (seen.length !== 2) return `expected 2 wire calls, saw ${seen.length}`;
      if (!seen[0].o || seen[0].o.timeout !== 8000) return 'the request options were dropped on the way to the wire';
      if (seen[1].o !== undefined) return 'an options argument was invented where the caller passed none';
      // …and the same call proves the flip's two ruled properties on the wire.
      if (seen[0].p.model !== 'deepseek-v4-flash') return `wire model = ${seen[0].p.model}, not the exact benched string`;
      if (!seen[0].p.thinking || seen[0].p.thinking.type !== 'disabled') return 'noThink did not arrive by construction';
      return true;
    });

  await acell('9.5b cache_control IS ABSENT ON THE WIRE for a real bride-shaped system block',
              "set `cache: true` on llm.js's deepseek entry, or bypass translateFor in the adapter",
    async () => {
      let sent = null;
      const restore = stubWire((p) => { sent = p; return { usage: {}, content: [] }; });
      try {
        const on = buildBrideClient({ BRIDE_LLM_PROVIDER: 'deepseek', DEEPSEEK_API_KEY: 'x' });
        // The shape brideEngine.js:231-236 actually sends, cache block included.
        await on.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: [{ type: 'text', text: 'STATIC', cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: 'hi' }],
        });
      } finally { restore(); }
      if (!sent) return 'nothing reached the wire';
      if (JSON.stringify(sent).includes('cache_control')) {
        return 'cache_control rode onto a foreign endpoint — the z law (llm.js:56-58) is broken and the call would be rejected';
      }
      if (sent.system[0].text !== 'STATIC') return 'the strip ate the prompt itself';
      return true;
    });

  await acell('9.6 llmCreate is pinned AT THE BYTE against the adapter\'s duplicate',
              'change any byte of llmCreate — a reorder, a swapped helper, a fourth step',
    async () => {
      // F-06.85: the adapter re-authors llmCreate's body to forward request
      // options. That duplication is only safe while the original stays what it
      // was. This cell is the tripwire that sends llmCreate's next author to
      // brideLlmClient.js.
      const src = require('fs').readFileSync(path.join(ROOT, 'src/lib/llm.js'), 'utf8');
      // CE-31 BF/№2 ③ — THE PIN IS ON THE BYTES, NOT ON A COUNT.
      // The first draft counted statements. A count is a proxy: a body can rot
      // at constant length — swap `translateFor` for a hand-rolled strip, or
      // reorder the fidelity assert past the return, and a counter shrugs. So
      // the whole function is pinned at the byte, and ANY divergence reddens.
      // If this cell fails because llmCreate legitimately changed, the fix is
      // NOT to update the string here — it is to go re-author the adapter's
      // duplicated body at src/lib/brideLlmClient.js first, then update this.
      const EXPECTED =
        'async function llmCreate(provider, params) {\n' +
        '  const resp = await clientFor(provider).messages.create(translateFor(provider, params));\n' +
        '  assertToolFidelity(provider, resp);\n' +
        '  return resp;\n' +
        '}';
      const i = src.indexOf('async function llmCreate(');
      if (i === -1) return 'llmCreate has moved or been renamed — re-derive the adapter';
      const end = src.indexOf('\n}\n', i);
      if (end === -1) return 'llmCreate has no closing brace at column zero — re-derive the adapter';
      const body = src.slice(i, end + 2);
      if (body !== EXPECTED) {
        const at = (() => {
          for (let k = 0; k < Math.max(body.length, EXPECTED.length); k++) {
            if (body[k] !== EXPECTED[k]) return k;
          }
          return -1;
        })();
        return `llmCreate diverged at byte ${at} (len ${body.length} vs ${EXPECTED.length}) — `
             + `brideLlmClient.js duplicates this body and is now stale: ...${JSON.stringify(body.slice(Math.max(0, at - 30), at + 40))}`;
      }
      // …and the duplicate is genuinely a duplicate: the adapter must still
      // perform all three, or the pin above is guarding nothing.
      const ad = require('fs').readFileSync(path.join(ROOT, 'src/lib/brideLlmClient.js'), 'utf8');
      for (const step of ['translateFor(provider,', 'clientFor(provider).messages.create(', 'assertToolFidelity(provider, resp)']) {
        if (!ad.includes(step)) return `the adapter dropped llmCreate's step: ${step}`;
      }
      return true;
    });

  await acell('9.5 the two ephemeral cache_control blocks still stand on the ANTHROPIC path',
              'delete the cache_control block at brideEngine.js:235 or circleEngine.js:110',
    async () => {
      // The flip strips cache_control by construction (llm.js:79). That must not
      // become a licence to delete it from the source: the OFF state is a CACHED
      // Haiku lane, and a lane that lost its 1-hour cache while nobody flipped
      // anything is a silent cost regression the ledger would price as normal.
      const fs2 = require('fs');
      const rd = (f) => fs2.readFileSync(path.join(ROOT, f), 'utf8');
      for (const f of ['src/agent/brideEngine.js', 'src/agent/circleEngine.js']) {
        if (!/cache_control:\s*\{\s*type:\s*'ephemeral'\s*\}/.test(rd(f))) return `${f} lost its ephemeral cache block`;
      }
      // …and the strip that makes the flip safe is still in the facade.
      const llm = rd('src/lib/llm.js');
      if (!/if \(!c\.cache\) out = stripCache\(out\)/.test(llm)) return 'llm.js no longer strips cache_control for non-anthropic providers';
      if (!/if \(c\.noThink && out\.thinking === undefined\) out\.thinking = \{ type: 'disabled' \}/.test(llm)) {
        return 'llm.js no longer suppresses silent reasoning — the lane would truncate at max_tokens';
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
