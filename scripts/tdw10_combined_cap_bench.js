#!/usr/bin/env node
'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// tdw10_combined_cap — TDW_10 · F-10.100
//
// THE PROPERTY THIS BENCH DEFENDS, in one sentence: one allowance, two doors, and
// a refusal that tells the truth and costs nothing.
//
// 22 cells, ratified at CE R-26.7 §D. Every one of them RED at the uncured tree
// and GREEN at the cured one; every mutation is applied to PRODUCTION SOURCE, not
// to this file's setup. The six the chair mandated are §1.1 §1.2 §2.1 §3.1 §4.1
// §5.1; the sixteen others exist because the seat matters as much as the refusal.
//
// RUNNABLE FROM ANY WORKING DIRECTORY (Q-SP-5): every path resolves off __dirname.
// ═══════════════════════════════════════════════════════════════════════════════

// The engine's db module throws at require-time without these. Stubbed on the
// corpus's own established pattern (b0457_assign_bench:23 and six siblings) so
// this bench can require the REAL chat.js and execute the REAL buildMeta — the
// alternative is asserting a re-implementation, which proves the copy.
process.env.SUPABASE_URL              = process.env.SUPABASE_URL              || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-service-role-key';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);

const CHAT_SRC   = P('src/api/vendor-engine/chat.js');
const WA_SRC     = P('src/lib/vendorInbound.js');
const LOOP_SRC   = P('src/engine/src/core/loop.ts');
const MIG_SRC    = P('db/migrations/0116_combined_ai_cap.sql');

// CELLS RUN IN SEQUENCE. The first draft printed its own total before the async
// cells had resolved, so the count line was a reading of an unfinished run — the
// count-proofs-are-evidence-only-when-cold class, in miniature. Queued and awaited.
let pass = 0, fail = 0;
const QUEUE = [];
const t  = (name, fn) => QUEUE.push({ name, fn });
const ta = (name, fn) => QUEUE.push({ name, fn });
const say = (line) => QUEUE.push({ banner: line });
async function drain() {
  for (const c of QUEUE) {
    if (c.banner !== undefined) { console.log(c.banner); continue; }
    try { await c.fn(); console.log(`  ok   ${c.name}`); pass++; }
    catch (e) { console.log(`  FAIL ${c.name}\n       ${e.message}`); fail++; }
  }
}

// ── THE FAKE ESTATE ────────────────────────────────────────────────────────────
// Deterministic, capturing, and deliberately NOT a mock of the thing under test:
// it stands in for Supabase and records every write, so a cell can assert what was
// NOT written as confidently as what was. `usageInserts` is the one that matters —
// an assertion of absence is only worth anything if the recorder would have caught
// a presence, so §3.2 proves the recorder bites before §3.1 trusts its silence.
function makeSupabase({ caps = {}, usageCounts = { day: 0, month: 0 } } = {}) {
  const writes = { messages: [], conversations: [], usage: [] };
  const engine = {
    from(table) {
      const q = {
        _t: table, _isDay: false,
        select() { return q; },
        eq() { return q; },
        not() { return q; },
        gte(_col, iso) {
          // The day-window ISO is later than the month-window ISO; that is how the
          // two counters are told apart without reaching into the production clock.
          q._iso = iso; return q;
        },
        insert(row) { writes.usage.push(row); return Promise.resolve({ error: null }); },
        then(res) {
          const isMonthStart = String(q._iso || '').slice(8, 10) === '01' && q._monthy;
          return res({ count: q._which === 'month' ? usageCounts.month : usageCounts.day, error: null });
        },
      };
      return q;
    },
  };
  const pub = {
    schema(name) {
      if (name !== 'engine') throw new Error(`unexpected schema ${name}`);
      // Two sequential counter calls: day first, month second (the production order).
      let n = 0;
      return {
        from(table) {
          const inner = engine.from(table);
          inner._which = (n++ === 0) ? 'day' : 'month';
          return inner;
        },
      };
    },
    from(table) {
      const q = {
        _rows: [],
        select() { return q; },
        in(_col, keys) {
          q._rows = keys
            .filter((k) => Object.prototype.hasOwnProperty.call(caps, k))
            .map((k) => ({ key: k, value: String(caps[k]) }));
          return q;
        },
        eq(col, val) { q._eq = [col, val]; return q; },
        maybeSingle() { return Promise.resolve({ data: null, error: null }); },
        single() { return Promise.resolve({ data: null, error: null }); },
        insert(row) { writes[table] = writes[table] || []; writes[table].push(row); return Promise.resolve({ data: row, error: null }); },
        update(row) { writes.conversations.push(row); return { eq: () => Promise.resolve({ error: null }) }; },
        then(res) { return res({ data: q._rows, error: null }); },
      };
      return q;
    },
  };
  return { pub, writes };
}

console.log('\n════════════════════════════════════════════════════════════════════');
console.log('  tdw10_combined_cap — F-10.100 · one allowance, two doors');
console.log('════════════════════════════════════════════════════════════════════\n');

const chat = require(CHAT_SRC);
const chatText = fs.readFileSync(CHAT_SRC, 'utf8');
const waText   = fs.readFileSync(WA_SRC, 'utf8');
const loopText = fs.readFileSync(LOOP_SRC, 'utf8');

// ═══ §1 — THE WHATSAPP LANE IS GATED, AND ONLY WHERE IT SHOULD BE ═══════════════
say('§1 — THE WHATSAPP GATE (the disease: the counter was combined, the refusal was not)');

t('§1.1 WhatsApp REFUSES at cap 0 — the gate exists, keys on turns_cap === 0, and returns', () => {
  // The window runs from the guarded require to the end of the refusal branch.
  const start = waText.indexOf('const capSeam = require(');
  assert.ok(start > 0, 'no cap gate found in vendorInbound.js');
  const end = waText.indexOf("console.log(`[agent:cap-gate] refused", start);
  assert.ok(end > start, 'the cap gate has no refusal branch');
  // Slice to the branch's closing brace, so the `return;` assertion below reads the
  // WHOLE branch. The first draft stopped AT the return and then asserted a trailing
  // newline that was outside its own window — a cell reddened by its own boundary,
  // which is clause 2 of the independent-method law biting its author.
  const g = waText.slice(start, waText.indexOf('\n    }\n', end) + 7);
  assert.ok(/capMeta\.state === 'capped' && capMeta\.turns_cap === 0/.test(g),
    'the refusal branch does not key on a capped state AND a zero cap');
  assert.ok(/sendWhatsApp\(phone, WA_CAP_ZERO_LINE/.test(g), 'the refusal sends no message');
  assert.ok(/\n      return;\n/.test(g), 'the refusal does not short-circuit the turn');
});

t('§1.2 WhatsApp STILL ANSWERS at a nonzero cap under the cap — no branch refuses on state alone', () => {
  // The failure this forbids is a gate written as `if (capMeta.state === 'capped')`,
  // which at cap>0 would refuse a paying vendor with the HELD sentence — or with none.
  const refusals = waText.match(/if \(capMeta[^\)]*\) \{\s*\n\s*const twilioMsg = await sendWhatsApp\(phone, WA_CAP_ZERO_LINE/g) || [];
  assert.strictEqual(refusals.length, 1, `expected exactly one WA refusal branch, found ${refusals.length}`);
  assert.ok(/turns_cap === 0/.test(refusals[0]),
    'the single refusal branch does not require a ZERO cap — a paying vendor would be refused with the wrong sentence');
});

t('§1.3 the gate sits AFTER all three escape words — mode', () => {
  const gateAt  = waText.indexOf('const capSeam = require(');
  const modeAt  = waText.indexOf('const modeTarget = matchModeWord(body);');
  assert.ok(modeAt > 0 && gateAt > modeAt, 'the cap gate precedes the mode word — a capped vendor could not change rooms');
});

t('§1.4 the gate sits AFTER all three escape words — fresh', () => {
  const gateAt  = waText.indexOf('const capSeam = require(');
  const freshAt = waText.indexOf('if (matchFreshWord(body)) {');
  assert.ok(freshAt > 0 && gateAt > freshAt, 'the cap gate precedes the fresh word — a capped vendor could not start a new thread');
});

t('§1.5 the gate sits AFTER all three escape words — glitch (the hatch cannot depend on the thing it escapes)', () => {
  const gateAt   = waText.indexOf('const capSeam = require(');
  const glitchAt = waText.indexOf('if (matchGlitchWord(body)) {');
  assert.ok(glitchAt > 0 && gateAt > glitchAt,
    'the cap gate precedes the glitch word — a capped vendor could not report a fabrication');
});

t('§1.6 the gate sits BEFORE every turn input — calendar, scratchpad, lead-ping drain, llm wiring', () => {
  const gateAt = waText.indexOf('const capSeam = require(');
  // THE SILENT ZERO, CLOSED. indexOf returns -1 for an ABSENT gate, and -1 is less
  // than every real offset — so the first draft of this cell was GREEN against a tree
  // with no gate in it at all. Caught by the pristine run, not by reasoning.
  assert.ok(gateAt > 0, 'the cap gate is absent — this ordering cell would otherwise pass vacuously');
  for (const marker of [
    'const calendarSnapshot = await fetchCalendarSnapshot(supabase, vendor.id, vendor.category);',
    'const scratchpad = await fetchScratchpad(supabase, vendor.id);',
    'const leadPings = await fetchLeadPings(supabase, vendor.id);',
    'const llmWiring = await buildLlmForTurn({ supabase, vendor, agentId });',
  ]) {
    const at = waText.indexOf(marker);
    assert.ok(at > 0, `marker vanished: ${marker.slice(0, 48)}`);
    assert.ok(gateAt < at, `a refused turn still pays for: ${marker.slice(0, 48)}`);
  }
});

t('§1.7 the gate sits BEFORE runTurn — the only thing on this path that writes a usage row', () => {
  const gateAt = waText.indexOf('const capSeam = require(');
  assert.ok(gateAt > 0, 'the cap gate is absent — the same silent-zero trap as §1.6');
  const runAt  = waText.indexOf('const result = await runTurn({');
  assert.ok(runAt > 0 && gateAt < runAt, 'the cap gate does not precede runTurn');
});

t('§1.8 the inbound message row is written BEFORE the gate — her message survives the refusal', () => {
  const inboundAt = waText.indexOf("await supabase.from('messages').insert(webhookCore.inboundRow({\n      conversation_id: convo.id,");
  const gateAt    = waText.indexOf('const capSeam = require(');
  assert.ok(inboundAt > 0, 'the vendor-path inbound row write moved or vanished');
  assert.ok(inboundAt < gateAt, 'the gate now precedes the inbound row — a refused message would leave no record');
});

t('§1.9 the refusal follows the trio\'s exact shape: send → outbound row → last_message_at → log → return', () => {
  const g = waText.match(/if \(capMeta && capMeta\.state === 'capped' && capMeta\.turns_cap === 0\) \{[\s\S]*?\n    \}/)[0];
  const order = ['sendWhatsApp(', "from('messages').insert", 'last_message_at', 'console.log', 'return;'];
  let cursor = -1;
  for (const step of order) {
    const at = g.indexOf(step, cursor + 1);
    assert.ok(at > cursor, `the refusal breaks the trio's shape at: ${step}`);
    cursor = at;
  }
});

// ── LABELLED AMENDMENT · R-26.15 ① — THE SEAT WAS HELD; IT IS NOW FILLED. ────
// FALSIFIED BY RULING, NOT BY DEFECT. This cell asserted that the seat sent NOTHING,
// because its sentence had not passed the founder's veto and shipping an unvetoed
// vendor-facing byte is the one thing the copy law forbids outright. The byte landed.
// The PROPERTY the cell defends is unchanged and is the same one it always defended:
// this lane must never go silent on a vendor who is inside her rights. It defended it
// by asserting a declared gap; it now defends it by asserting the cure.
t('§1.10 the SPENT-ALLOWANCE seat SPEAKS — a paying vendor over her allowance is never met with silence', () => {
  const seat = waText.match(/if \(capMeta && capMeta\.state === 'capped' && capMeta\.turns_cap > 0\) \{[\s\S]*?\n    \}/)[0];
  assert.ok(/sendWhatsApp\(phone, spentLine/.test(seat), 'the seat sends nothing — the silence F-3 was ruled to prevent');
  assert.ok(/capSpentLineFor\(capMeta\)/.test(seat), 'the seat does not take its sentence from the shared home');
  assert.ok(/\n      return;/.test(seat), 'the seat does not short-circuit — she would be refused AND answered');
  assert.ok(!/SEAT HELD/.test(waText), 'the held-seat warn survives a filled seat — the file describes itself falsely');
});

t('§1.11 the spent refusal carries NO ROUTE LINE — a wait is not a sale', () => {
  const seat = waText.match(/if \(capMeta && capMeta\.state === 'capped' && capMeta\.turns_cap > 0\) \{[\s\S]*?\n    \}/)[0];
  // The SEND is asserted FIRST. Without it this cell passes on an EMPTY seat — which
  // is what the pre-ruling tree had — and would be green over the very silence the
  // ruling exists to end. Caught on the both-ways run, not by reasoning.
  assert.ok(/sendWhatsApp\(phone, spentLine/.test(seat), 'the seat sends nothing, so "which sentence" is not yet a question');
  assert.ok(!/WA_CAP_ZERO_LINE/.test(seat),
    'the spent seat sends the ZERO-cap sentence — she would be told to buy a tier whose allowance simply resets at midnight');
  assert.ok(!/Billing/.test(seat), 'the spent refusal points her at a payment page for a wait');
});

t('§1.12 the spent line is IMPORTED, never transcribed — one home for a vetoed byte', () => {
  assert.ok(/capSpentLineFor = capSeam\.CAPPED_LINE;/.test(waText), 'the WA door does not take the shared sentence');
  assert.ok(!/reached today's conversation limit/.test(waText),
    'the WA door carries its OWN copy of a vetoed string — F-04.36, and it would drift on the first one-lane edit');
});

// ═══ §2 — THE COUNTER WAS ALWAYS COMBINED; NOW THE KEY SAYS SO ══════════════════
say('\n§2 — ONE ALLOWANCE (vendor_ai_* is read; vendor_pwa_* is not)');

t('§2.1 the meter interpolates vendor_ai_*, and vendor_pwa_* is read by NOTHING in src/', () => {
  assert.ok(/`vendor_ai_daily_\$\{productTier\}`/.test(chatText),  'the daily key is not vendor_ai_*');
  assert.ok(/`vendor_ai_monthly_\$\{productTier\}`/.test(chatText), 'the monthly key is not vendor_ai_*');
  // The negative, swept across the whole source tree rather than this one file —
  // a rename that leaves a second reader behind is F-04.36's family.
  const hits = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') walk(f); continue; }
      if (!/\.(js|ts)$/.test(e.name)) continue;
      const s = fs.readFileSync(f, 'utf8');
      // The comment prose in 0116/chat.js legitimately NAMES the retired family; only a
      // key CONSTRUCTION counts as a reader.
      if (/`vendor_pwa_(daily|monthly)_/.test(s) || /'vendor_pwa_(daily|monthly)_[a-z]+'/.test(s)) hits.push(path.relative(ROOT, f));
    }
  })(P('src'));
  assert.deepStrictEqual(hits, [], `vendor_pwa_* still has readers: ${hits.join(', ')}`);
});

t('§2.2 buildMeta is PLAIN-ARGS — the WhatsApp door has no Express req and must still call it', () => {
  assert.ok(/async function buildMeta\(\{ supabase, agentId, tier \}\)/.test(chatText),
    'buildMeta is not plain-args — the WA lane cannot reach the meter');
  const body = chatText.match(/async function buildMeta\(\{[\s\S]*?\n\}\n/)[0];
  assert.ok(!/\breq\./.test(body),
    'buildMeta still reads req.* — the co-dependent lesson recorded beside buildLlmForTurn was not learned');
});

t('§2.3 BOTH-SIDES: every PWA call site passes the new shape; no old-shape call survives', () => {
  const calls = (chatText.match(/await buildMeta\([^)]*\)/g) || []);
  assert.strictEqual(calls.length, 5, `expected exactly the five PWA call sites, found ${calls.length}`);
  for (const c of calls) {
    assert.ok(/\{ supabase: req\.app\.locals\.supabase, agentId: req\.agentId, tier: productTier \}/.test(c),
      `a call site still uses the retired positional shape: ${c}`);
  }
});

ta('§2.4 the meter returns the SAME reading after the refactor — the both-sides clause, by execution', async () => {
  // FIXTURE CORRECTED, DISCLOSED: the first draft used day 3/250 against month
  // 40/2500 and asserted the DAY window — but 0.016 > 0.012, so the month was
  // correctly the nearer one and the cell reddened against working code. The
  // production rule was right and my arithmetic was wrong; the fixture moved, the
  // assertion did not.
  const { pub } = makeSupabase({ caps: { vendor_ai_daily_signature: 250, vendor_ai_monthly_signature: 2500 }, usageCounts: { day: 3, month: 4 } });
  const meta = await chat.buildMeta({ supabase: pub, agentId: 'agent-1', tier: 'signature' });
  assert.strictEqual(meta.tier, 'signature');
  assert.strictEqual(meta.turns_cap, 250);
  assert.strictEqual(meta.turns_used, 3);
  assert.strictEqual(meta.state, 'ok');
  // AMENDED LABELLED · R-26.14 §B — the picker moved to its own door and the
  // fragment never scrolled (F-10.101, founder-witnessed). Same property: the
  // meter mints a path out. New address, because the old one landed her at the
  // top of a settings page to hunt.
  assert.strictEqual(meta.upgrade.href, '/vendor/billing');
  assert.ok(!/#/.test(meta.upgrade.href), 'a fragment returned — /vendor/billing IS the picker, there is nothing to scroll to');
});

ta('§2.5 the WhatsApp lane and the PWA lane read ONE counter — same agent, same numbers, no lane column', async () => {
  assert.ok(!/lane/.test(loopText.match(/const usageRow: Record<string, unknown> = \{[\s\S]*?\};/)[0]),
    'loop.ts usage row grew a lane column — the counter is no longer shared and this whole sitting is void');
  const { pub } = makeSupabase({ caps: { vendor_ai_daily_basic: 5, vendor_ai_monthly_basic: 50 }, usageCounts: { day: 5, month: 5 } });
  const a = await chat.buildMeta({ supabase: pub, agentId: 'agent-1', tier: 'basic' });
  const { pub: pub2 } = makeSupabase({ caps: { vendor_ai_daily_basic: 5, vendor_ai_monthly_basic: 50 }, usageCounts: { day: 5, month: 5 } });
  const b = await chat.buildMeta({ supabase: pub2, agentId: 'agent-1', tier: 'basic' });
  assert.deepStrictEqual(a, b, 'two doors reading the same agent disagree');
  assert.strictEqual(a.state, 'capped', 'five turns against a cap of five is not capped');
});

ta('§2.6 F-10.85 SURVIVES THE RENAME: 0 is a lawful cap, a NEGATIVE one still falls back', async () => {
  const { pub } = makeSupabase({ caps: { vendor_ai_daily_basic: 0, vendor_ai_monthly_basic: 250 }, usageCounts: { day: 0, month: 0 } });
  const zero = await chat.buildMeta({ supabase: pub, agentId: 'a', tier: 'basic' });
  assert.strictEqual(zero.turns_cap, 0, 'a stored 0 was discarded as absent — F-10.85 regressed under the rename');
  const { pub: pub2 } = makeSupabase({ caps: { vendor_ai_daily_basic: -1, vendor_ai_monthly_basic: 250 }, usageCounts: { day: 0, month: 0 } });
  const neg = await chat.buildMeta({ supabase: pub2, agentId: 'a', tier: 'basic' });
  assert.strictEqual(neg.turns_cap, 25, 'a negative cap was honoured — malformed input became an instruction');
});

// ═══ §3 — THE REFUSAL IS FREE ══════════════════════════════════════════════════
say('\n§3 — THE REFUSAL WRITES NO USAGE ROW (a meter must not eat its own tail)');

t('§3.1 the estate has exactly TWO usage-write homes, and the gate\'s path reaches neither', () => {
  const homes = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') walk(f); continue; }
      if (!/\.(js|ts)$/.test(e.name)) continue;
      if (/from\('usage'\)\s*\n?\s*\.?insert\(|from\('usage'\)\.insert\(/.test(fs.readFileSync(f, 'utf8'))) homes.push(path.relative(ROOT, f));
    }
  })(P('src'));
  homes.sort();
  assert.deepStrictEqual(homes, ['src/agent/harvest.js', 'src/engine/src/core/loop.ts'],
    `usage-write homes moved: ${homes.join(', ')}`);
  const g = waText.match(/if \(capMeta && capMeta\.state === 'capped' && capMeta\.turns_cap === 0\) \{[\s\S]*?\n    \}/)[0];
  assert.ok(!/runTurn|fireHarvest|harvest/.test(g), 'the refusal branch reaches a usage writer');
});

// DECLARED GREEN-BOTH-WAYS, and the declaration is the point. This cell tests the
// BENCH's own capturing fake, not production, so it cannot redden at a pristine tree —
// nothing in this file changes between them. It exists because §3.1 asserts an ABSENCE,
// and an absence assertion is worth exactly nothing unless something proves the recorder
// would have caught a presence. Named here rather than left to look like a vacuous green.
t('§3.2 THE RECORDER BITES — this bench would CATCH a usage write, so §3.1\'s silence means something', () => {
  const { pub, writes } = makeSupabase();
  pub.schema('engine').from('usage').insert({ agent_id: 'x', conversation_id: 'c' });
  assert.strictEqual(writes.usage.length, 1,
    'the capturing fake does not record usage inserts — every absence assertion in this bench would be vacuous');
});

t('§3.3 the meter COUNTS turns but never CREATES one — buildMeta issues no insert of any kind', () => {
  const body = chatText.match(/async function buildMeta\(\{[\s\S]*?\n\}\n/)[0];
  assert.ok(!/\.insert\(/.test(body), 'buildMeta writes — a meter that writes counts itself');
  assert.ok(/count: 'exact', head: true/.test(body), 'the counter stopped being a head-count');
});

// ═══ §4 — THE SENTENCES ════════════════════════════════════════════════════════
say('\n§4 — THE COPY (the ruled bytes, and the one that must not move)');

// ── LABELLED AMENDMENT · R-26.15 ① — THE BYTES MOVED BY RULING. ─────────────
// This cell pinned CAPPED_LINE byte-unchanged, and that was a RATIFIED ACCEPTANCE
// NUMBER of F-10.100 which the delivery met. The founder then ruled the sentence.
// A ruling outranks an acceptance number the same chair set, and the amendment is
// labelled rather than quiet so the record shows a decision and not a drift.
// THE PROPERTY IS UNCHANGED: a nonzero cap selects the SPENT sentence, never the
// no-AI one, and the window branch tells the truth about WHEN she comes back.
t('§4.1 a nonzero cap selects the RULED spent-allowance sentence, both windows', () => {
  const day = { tier: 'signature', window: 'day', turns_used: 250, turns_cap: 250 };
  assert.strictEqual(chat.CAPPED_LINE(day),
    "You've reached today's conversation limit on your tier. The desk reopens at midnight.");
  assert.strictEqual(chat.cappedReplyFor(day), chat.CAPPED_LINE(day), 'the selector does not choose the spent sentence at a nonzero cap');
  const mon = { tier: 'essential', window: 'month', turns_used: 450, turns_cap: 450 };
  assert.strictEqual(chat.CAPPED_LINE(mon),
    "You've reached this month's conversation limit on your tier. The desk reopens on the 1st.");
});

// DECLARED GREEN-BOTH-WAYS, and the declaration is the point: this property held
// before the ruling and must hold after it. It is a CONTINUITY cell, not a cure
// cell — the ruling rewrote both arms of this sentence, and the one thing that had
// to survive the rewrite is that a monthly cap never promises a midnight.
t('§4.1b THE MONTH BRANCH SURVIVES — it is the only thing between a monthly-capped vendor and a midnight that never comes', () => {
  const mon = chat.CAPPED_LINE({ window: 'month', tier: 'x', turns_used: 1, turns_cap: 1 });
  assert.ok(!/midnight/.test(mon), 'a monthly cap promises a midnight reopening — F-10.100(b) one window over');
  assert.ok(/reopens on the 1st/.test(mon), 'the month arm lost its true date');
});

t('§4.1c THE RETIRED CLASSES STAY RETIRED — no figures, no raw tier token, no sale', () => {
  for (const w of ['day', 'month']) {
    const line = chat.CAPPED_LINE({ window: w, tier: 'basic', turns_used: 15, turns_cap: 15 });
    assert.ok(!/\(\d+\/\d+\)/.test(line), 'the figures returned — the sentence litigates instead of stating');
    assert.ok(!/ basic /.test(line),          'the raw lowercase database token returned mid-sentence');
    assert.ok(!/step up a tier/.test(line),   'the upgrade prompt returned — RETIRED BY RULING (R-26.15 §2), tokens are coming');
  }
});

t('§4.2 at cap 0 the PWA speaks the RULED bytes, and not one character else', () => {
  const expected = "The AI desk isn't part of Basic. Please upgrade to Essential Tier and above to enjoy controlling your Business through AI chat and WhatsApp. Your first month is free — you only pay from the second month, for the plan you choose.";
  assert.strictEqual(chat.CAP_ZERO_LINE, expected, 'the founder-ruled zero-cap bytes were altered');
  assert.strictEqual(chat.cappedReplyFor({ tier: 'basic', window: 'day', turns_used: 0, turns_cap: 0 }), expected,
    'the selector does not choose the zero-cap sentence at a zero cap');
});

t('§4.3 THE LIE IS DEAD: at cap 0 nothing claims she used anything, and nothing promises a reopening', () => {
  const said = chat.cappedReplyFor({ tier: 'basic', window: 'day', turns_used: 0, turns_cap: 0 });
  assert.ok(!/\(0\/0\)/.test(said),            'the refusal still renders the 0/0 figure');
  assert.ok(!/You've used/.test(said),          'the refusal still claims she used something');
  assert.ok(!/reopens/.test(said),              'the refusal still promises a reopening that never comes');
  assert.ok(!/ basic /.test(said),              'the raw lowercase database token still renders in the refusal');
});

t('§4.4 the WhatsApp refusal is the same three sentences PLUS a route, because there is nothing to tap', () => {
  assert.ok(chat.WA_CAP_ZERO_LINE.startsWith(chat.CAP_ZERO_LINE),
    'the two lanes have drifted apart — the WA line is no longer the PWA line plus a route');
  assert.strictEqual(chat.WA_CAP_ZERO_LINE.slice(chat.CAP_ZERO_LINE.length),
    '\n\nTo upgrade: open your TDW dashboard, tap your initials at the top, and choose Billing.',
    'the ruled WhatsApp route line was altered');
});

t('§4.5 MONEY REGISTER holds on every shipped cap byte — no glyph, no k/L/Cr shorthand', () => {
  for (const [name, s] of [['CAP_ZERO_LINE', chat.CAP_ZERO_LINE], ['WA_CAP_ZERO_LINE', chat.WA_CAP_ZERO_LINE]]) {
    // THE SILENT UNDEFINED, CLOSED. `/₹/.test(undefined)` tests the string "undefined"
    // and passes, so the first draft of this cell was GREEN against a tree that shipped
    // neither constant. A register check over a byte that does not exist is not a check.
    assert.ok(typeof s === 'string' && s.length > 0, `${name} is not a shipped string`);
    assert.ok(!/₹/.test(s), `${name} carries a rupee glyph`);
    assert.ok(!/\b\d+(\.\d+)?\s?(k|L|Cr)\b/.test(s), `${name} carries shorthand`);
  }
});

t('§4.6 ONE HOME for the cap vocabulary — the WhatsApp door imports the byte, never re-types it', () => {
  assert.ok(/const capSeam = require\('\.\.\/api\/vendor-engine\/chat'\);/.test(waText),
    'the WA door does not import the shared cap seam');
  assert.ok(/WA_CAP_ZERO_LINE = capSeam\.WA_CAP_ZERO_LINE;/.test(waText),
    'the WA door does not take its sentence from the shared home');
  assert.ok(!/The AI desk isn't part of Basic/.test(waText),
    'the WA door carries its OWN copy of a vetoed string — two homes, one fact, F-04.36');
});

t('§4.7 the selector keys on the CAP, not the tier word — a zero-capped Prestige gets the true sentence', () => {
  // ADDED BECAUSE A MUTATION DID NOT BITE. Rewriting `turns_cap === 0` as
  // `tier === 'basic'` passed every other copy cell in this section, because the
  // zero-cap fixtures all happened to be Basic and the nonzero ones all happened not
  // to be. Two properties travelling together in every fixture is one property proven.
  // The dial is the founder's interim lever on ANY tier; a Prestige vendor whose cap he
  // sets to zero is in the same situation and must not be told she spent 0 of 0.
  assert.strictEqual(chat.cappedReplyFor({ tier: 'prestige', window: 'day', turns_used: 0, turns_cap: 0 }),
    chat.CAP_ZERO_LINE, 'a zero-capped non-Basic tier falls through to the spent-allowance lie');
  // and the mirror: a Basic vendor with a REAL allowance she has spent gets the spent
  // sentence, not the no-AI one — the tier word must not decide this either way.
  assert.strictEqual(chat.cappedReplyFor({ tier: 'basic', window: 'day', turns_used: 25, turns_cap: 25 }),
    chat.CAPPED_LINE({ tier: 'basic', window: 'day', turns_used: 25, turns_cap: 25 }),
    'a Basic vendor who spent a real allowance is told the AI desk is not part of her plan');
});

// ═══ §5 — THE PATH OUT ═════════════════════════════════════════════════════════
say('\n§5 — THE UPGRADE PATH SURVIVES A ZERO CAP');

t('§5.1 the meter still MINTS an upgrade path at cap 0 — the server half of the cure', () => {
  const body = chatText.match(/async function buildMeta\(\{[\s\S]*?\n\}\n/)[0];
  assert.ok(/upgrade: \{ label: 'Upgrade', href: '\/vendor\/billing' \}/.test(body),
    'the meta no longer carries an upgrade path to the live picker');
  assert.ok(/return \{ tier: productTier, \.\.\.nearer, state, upgrade:/.test(body),
    'the upgrade path is now conditional — at a zero cap it must still be minted');
});

ta('§5.2 END TO END: at cap 0 the meta is capped, reads 0/0, AND still carries the path out', async () => {
  const { pub } = makeSupabase({ caps: { vendor_ai_daily_basic: 0, vendor_ai_monthly_basic: 250 }, usageCounts: { day: 0, month: 0 } });
  const meta = await chat.buildMeta({ supabase: pub, agentId: 'a', tier: 'basic' });
  assert.strictEqual(meta.state, 'capped', 'a zero cap did not produce a capped state');
  assert.strictEqual(meta.turns_cap, 0);
  assert.strictEqual(meta.window, 'day', 'the zero window did not win the nearer-ratio contest (F-10.85 second half)');
  assert.ok(meta.upgrade && meta.upgrade.href, 'the refusal carries no path out');
  assert.strictEqual(chat.cappedReplyFor(meta), chat.CAP_ZERO_LINE);
});

t('§3.4 THE GATE FAILS OPEN — a broken meter costs an unmetered turn, never a silent Victor', () => {
  const g = waText.match(/let capMeta = null, WA_CAP_ZERO_LINE = null, capSpentLineFor = null;[\s\S]*?\n    \}\n/)[0];
  assert.ok(/RATIFIED BY RULING/.test(waText), 'the fail-open posture no longer names itself as ruled (R-26.14 §C)');
  assert.ok(/PAYING VENDOR SILENCED BY OUR OWN OUTAGE/.test(waText),
    'the F-06.85 reason is gone — a future sitting would "fix" this into fail-closed');
  assert.ok(/try \{/.test(g) && /\} catch \(e\) \{/.test(g), 'the cap seam is required unguarded on the main path of every vendor turn');
  assert.ok(/METER UNREACHABLE/.test(g), 'a fail-open path that says nothing is indistinguishable from a cap that never fired');
  // and fail-open must MEAN open: a null meta cannot reach either refusal branch
  assert.ok(/if \(capMeta && capMeta\.state === 'capped'/.test(waText),
    'a refusal branch does not null-guard capMeta — a failed meter would throw instead of falling open');
});

// ═══ §6 — THE MIGRATION ════════════════════════════════════════════════════════
say('\n§6 — 0116 (the keys the reader now reads)');

t('§6.1 0116 seeds all EIGHT vendor_ai_* keys the reader can interpolate, and no others', () => {
  const sql = fs.readFileSync(MIG_SRC, 'utf8');
  const seeded = [...sql.matchAll(/SELECT '(vendor_ai_[a-z_]+)'/g)].map((m) => m[1]).sort();
  const expected = [];
  for (const per of ['daily', 'monthly']) for (const tier of ['basic', 'essential', 'signature', 'prestige']) expected.push(`vendor_ai_${per}_${tier}`);
  assert.deepStrictEqual(seeded, expected.sort(), `0116 seeds the wrong key set: ${seeded.join(', ')}`);
});

t('§6.2 0116 is SEED-FROM-SOURCE-ROW and idempotent — never a literal, never a clobber', () => {
  const sql = fs.readFileSync(MIG_SRC, 'utf8');
  const inserts = sql.match(/INSERT INTO public\.admin_config[\s\S]*?ON CONFLICT \(key\) DO NOTHING;/g) || [];
  assert.strictEqual(inserts.length, 8, `expected eight guarded inserts, found ${inserts.length}`);
  for (const ins of inserts) {
    assert.ok(/FROM public\.admin_config WHERE key = 'vendor_pwa_/.test(ins),
      'a seed carries a literal value instead of reading its source row');
    assert.ok(!/VALUES/.test(ins), 'a seed uses VALUES — a number frozen at authoring time');
  }
});

t('§6.3 0116 is NON-DESTRUCTIVE and does not widen its ruling — no DELETE, no couple keys, no DDL', () => {
  const sql = fs.readFileSync(MIG_SRC, 'utf8');
  const live = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  assert.ok(!/\bDELETE\b|\bDROP\b|\bTRUNCATE\b/i.test(live), '0116 carries a destructive statement outside its comments');
  assert.ok(!/\bALTER TABLE\b|\bCREATE TABLE\b/i.test(live), '0116 carries DDL — this cure is config, not schema');
  assert.ok(!/couple_(wa|pwa)_/.test(live), '0116 touches the couple keys, which no ruling named');
});

// ── LABELLED AMENDMENT, TDW_06 relay-seam sitting one, 2026-08-11 ────────────
// RE-AIMED, NOT DELETED, and the count is PRESERVED at 37. This cell asserted
// `0116` as the ladder's tip. That was true when written and it is no longer the
// truth to assert: 0117 (`0117_pending_couple_drafts.sql`, the relay seam's
// pending-draft store) was RESERVED at that sitting's charter and lawfully
// written. A cell left asserting the old tip would have gone red at the next
// migration and been "fixed" by deleting it — the M-INVERTED §7.6 precedent in
// `b07_p5_bench` governs: re-aim, keep the teeth, label it.
// TEETH KEPT WHOLE: 0116 is still asserted present, 0113 is still asserted an
// unwritten hole, and the 0063 duplicate-set fence is untouched.
// RATIFY-OR-REVERT.
t('§6.4 LD-8: 0117 is the ladder\'s tip and 0113 stays an unwritten hole', () => {
  const files = fs.readdirSync(P('db/migrations')).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort();
  const nums = files.map((f) => f.slice(0, 4));
  assert.ok(nums.includes('0116'), '0116 is not on the ladder');
  assert.ok(nums.includes('0117'), '0117 is not on the ladder');
  assert.strictEqual(nums[nums.length - 1], '0117', `0117 is not the tail: ${nums.slice(-3).join(', ')}`);
  assert.ok(!nums.includes('0113'), '0113 was filled — LD-8 forbids it; it is reserved-unwritten');
  // ATTRIBUTED ELDER, not this delivery's: 0063 is used TWICE at origin
  // (0063_users_auth_user_id.sql + 0063_vendor_activity_log.sql), an LD-8 collision
  // that predates this sitting by ninety migrations. Found by this cell's first
  // draft, filed as F-10.103, and fenced BY NAME here rather than deleted — a cell
  // that stops looking because it found something is not a cell.
  const dupes = nums.filter((n, i) => nums.indexOf(n) !== i);
  assert.deepStrictEqual(dupes, ['0063'],
    `the ladder's duplicate set moved — expected only the attributed 0063 elder, found: ${dupes.join(', ')}`);
});

drain().then(() => {
  console.log('\n════════════════════════════════════════════════════════════════════');
  console.log(`  tdw10_combined_cap: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  console.log('════════════════════════════════════════════════════════════════════\n');
  process.exit(fail === 0 ? 0 : 1);
});
