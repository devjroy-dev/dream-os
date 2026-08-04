#!/usr/bin/env node
// scripts/b08_p5_unblock_bench.js — TDW_08 P5, THE UNBLOCK SITTING.
// F-08.87 (the precision drop) · F-08.86 (Rs 4.5L on the vendor wire).
//
// Runnable from ANY working directory (Q-SP-5). `node scripts/b08_p5_unblock_bench.js`
// · `--mutations` lists the arms · `--mutate=NAME` drives one.
//
// ═══ F-08.65 BINDS THIS FILE ════════════════════════════════════════════════
// The harness drives `runCoupleAgenticTurn` — production's own function, through
// production's own seam — and never a second implementation of the turn. The model
// is injected at `src/lib/llm.js`'s seam via the require cache; the resolver, the
// money home, the tool loop and both write paths are production code doing
// production work. Every payload these cells read is the payload Supabase was
// actually handed.
//
// ═══ ⚠ F-08.89 — F-08.86's "SECOND SITE" IS DEAD CODE. MINTED HERE. ══════
// The charter and CE ruling R-A3 name TWO display sites: engine.js:366 (the vendor
// alert) and engine.js:696 (`list_leads`). Both render `Rs X.XL` by the same
// `toFixed(1)` shape — that half re-derives exactly as the chair verified it.
//
// BUT :696 LIVES INSIDE `executeTool`, AND `executeTool` HAS ZERO CALLERS. It sits
// below the F-05.56 banner at engine.js:630 — "EVERYTHING BELOW THIS LINE HAS ZERO
// CALLERS SINCE ARC M5" — inside the DEFUSED ISLAND that `b05_f0550 §4.1` asserts is
// callerless and `b05_f0550 §4.3` byte-freezes against commit 5335bb2 pending its
// deletion ruling. So `list_leads` renders `Rs 4.5L` to nobody: it is not on the
// vendor wire, and no vendor has read that string since Arc M5.
//
// HOW IT WAS FOUND, and the method is the point: the cure was WRITTEN, and the floor
// caught it. `b05_f0550` went 31/0 -> 30/1 on §4.3, whose entire purpose is to stop a
// sitting moving an executable byte inside the island. The cure was REVERTED to
// byte-original rather than the bench amended — a bench that exists to freeze dead
// code, silenced so a sitting can cure that dead code, is the floor working correctly
// and being overruled for tidiness.
//
// SO SITE 2 SHIPS UNCURED, DELIBERATELY, and §4.4 below asserts that state rather
// than a cure. The LIVE second carrier of this disease is elsewhere and is NOT
// widened into here (unruled arm): `src/agent/briefing.js:169` renders
// `Rs ${(balance/100000).toFixed(1)}L` on the vendor briefing and IS live —
// `buildBriefing` is required at `src/cron.js:38` and `src/index.js:19`. It is
// reported to the chair, not touched.
//
// ═══ F-08.53's THREE LIMBS ══════════════════════════════════════════════════
// LIVE-FORM TELLS — the money cells assert against `witnessLine.rupees`'s own
//   output, never a string pasted in here, so the home and the expectation cannot
//   drift apart silently.
// BANG-FREE LINES — no cell asserts only a negation. Every "the L shorthand is
//   gone" cell has a positive twin asserting the grouped byte arrived; every
//   "precision is no longer dropped" cell asserts the value it now carries.
// EVERY LIMB PROVEN ABLE TO FIRE — the mutation arms hit PRODUCTION SOURCE, each
//   named, each producing a clean red. A mutation whose anchor has moved EXITS 2
//   with a stated reason rather than passing quietly.
'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const ENGINE_P  = 'src/agent/engine.js';
const DATE_P    = 'src/agent/datePrecision.js';
const WITNESS_P = 'src/lib/witnessLine.js';

// ── mutation arms (production source only) ──────────────────────────────────
const MUTATIONS = {
  precision_dropped_on_create: [ENGINE_P, (s) =>
    s.replace('            wedding_date_precision: event_date_precision,\n', '')],

  precision_dropped_on_update: [ENGINE_P, (s) =>
    s.replace('            leadPatch.wedding_date_precision  = event_date_precision;\n', '')],

  resolver_bypassed: [ENGINE_P, (s) =>
    s.replace('        const resolvedDate = resolveWeddingDate({',
              '        const resolvedDate = ((x) => ({ wedding_date: x.wedding_date, precision: null }))({')],

  haystack_takes_assistant_words: [ENGINE_P, (s) =>
    s.replace("          ...history.filter(m => m.role === 'user').map(m => m.content),",
              '          ...history.map(m => m.content),')],

  yearbump_deleted: [ENGINE_P, (s) =>
    s.replace('              parsed.setFullYear(parsed.getFullYear() + 1);\n              if (parsed < today) parsed.setFullYear(parsed.getFullYear() + 1);\n',
              '')],

  money_site1_reverted_to_L: [ENGINE_P, (s) =>
    s.replace('          const bud = budMax ? `${budMin}-${budMax}` : budMin;',
              '          const bud = `Rs ${(input.budget_min/100000).toFixed(1)}L`;')],

  // F-08.89: site 2 is uncured by ruling, so its arm inverts — it CURES the dead
  // site, which must red §4.4 (the freeze) rather than green anything.
  site2_cured_inside_the_frozen_island: [ENGINE_P, (s) =>
    s.replace('          ? `Rs ${(l.budget_min/100000).toFixed(1)}L${l.budget_max && l.budget_max !== l.budget_min ? `-${(l.budget_max/100000).toFixed(1)}L` : \'\'}`',
              '          ? (require(\'../lib/witnessLine\').rupees(l.budget_min) || `Rs ${l.budget_min}`)')],

  second_money_formatter_planted: [ENGINE_P, (s) =>
    s.replace("          const { rupees } = require('../lib/witnessLine');\n          const budMin",
              "          const rupees = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`;\n          const budMin")],
};

const argv   = process.argv.slice(2);
const MUTATE = (argv.find((a) => a.startsWith('--mutate=')) || '').split('=')[1] || null;
if (argv.includes('--mutations')) {
  console.log(Object.keys(MUTATIONS).join('\n'));
  process.exit(0);
}

const ORIGINALS = new Map();
function applyMutation(name) {
  const m = MUTATIONS[name];
  if (!m) { console.error(`unknown mutation: ${name}`); process.exit(2); }
  const [file, fn] = m;
  const full   = path.join(ROOT, file);
  const before = fs.readFileSync(full, 'utf8');
  const after  = fn(before);
  if (after === before) {
    // F-08.53 limb 3: a stale anchor EXITS 2 with a reason. A mutation that applies
    // to nothing proves nothing, and a green over it is indistinguishable from no
    // test at all.
    console.error(`MUTATION ANCHOR STALE: "${name}" changed no byte of ${file}. `
      + `Re-derive the anchor before trusting any result from this arm.`);
    process.exit(2);
  }
  ORIGINALS.set(full, before);
  fs.writeFileSync(full, after);
}
function restoreAll() { for (const [f, b] of ORIGINALS) fs.writeFileSync(f, b); }
process.on('exit', restoreAll);
process.on('SIGINT', () => { restoreAll(); process.exit(130); });
if (MUTATE) applyMutation(MUTATE);

// ── the injected model ──────────────────────────────────────────────────────
// Turn 1 calls `capture_couple_lead`; turn 2 closes. Nothing else is stubbed.
let CAPTURE_INPUT = null;
const llmPath = require.resolve(path.join(ROOT, 'src/lib/llm.js'));
const realLlm = require(llmPath);
let CALLS = 0;
require.cache[llmPath].exports = {
  ...realLlm,
  llmCreate: async () => {
    CALLS++;
    if (CALLS === 1) {
      return {
        stop_reason: 'tool_use',
        content: [{ type: 'tool_use', id: 't1', name: 'capture_couple_lead', input: CAPTURE_INPUT }],
        usage: { input_tokens: 10, output_tokens: 5 },
      };
    }
    return {
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 't2', name: 'respond_to_couple',
                  input: { message: 'Perfect — passing that on.' } }],
      usage: { input_tokens: 10, output_tokens: 5 },
    };
  },
};

const { runCoupleAgenticTurn } = require(path.join(ROOT, ENGINE_P));
const { rupees }               = require(path.join(ROOT, WITNESS_P));
const { resolveWeddingDate }   = require(path.join(ROOT, DATE_P));

// ── a supabase stub that answers only what the turn asks, and records writes ─
// `existingLeadRow` drives WHICH write path runs, and the branch is ASSERTED in
// `drive()` rather than assumed — the Phase 4 lesson (`lie_restored_returning`
// came back 26/0 because a stub answered null to every table and every
// "returning" cell silently ran the other branch).
function fakeSupabase({ existingLeadRow = null, history = [] } = {}) {
  const W = { inserts: [], updates: [] };
  const api = (table) => {
    const q = {
      _eq: {},
      select: () => q,
      eq: (c, v) => { q._eq[c] = v; return q; },
      gte: () => q,
      order: () => q,
      limit: async () => ({ data: table === 'messages' ? history : [] }),
      insert: (row) => { W.inserts.push({ table, row }); return {
        select: () => ({ single: async () => ({ data: { id: 'newlead1' } }) }),
        then: (r) => r({ error: null }),
      }; },
      update: (row) => { W.updates.push({ table, row }); return q; },
      async maybeSingle() {
        if (table === 'leads') return { data: existingLeadRow };
        return { data: null };
      },
    };
    return q;
  };
  return { _w: W, from: api };
}

const VENDOR = { id: 'v1', category: 'photography', city: 'Jaipur', open_to_travel: true };
const VUSER  = { name: 'Swati', phone: '+919888294440' };
const CONVO  = { id: 'c1' };

// The bride's own turns, as the `messages` table hands them back (newest first —
// the turn reverses). `direction` is the ONLY role source (engine.js:95-98).
const DEC_HISTORY = [
  { direction: 'outbound', body: 'Lovely — and what city?',          sent_by: 'ai', created_at: '2026-08-05T10:01:00Z' },
  { direction: 'inbound',  body: 'we are thinking December',         sent_by: null, created_at: '2026-08-05T10:00:00Z' },
];

async function drive({ existingLeadRow = null, history = DEC_HISTORY, capture, inbound = 'my name is Priya' } = {}) {
  CALLS = 0;
  CAPTURE_INPUT = capture;
  const sb = fakeSupabase({ existingLeadRow, history });
  const res = await runCoupleAgenticTurn({
    vendor: VENDOR, vendorUser: VUSER, conversation: CONVO,
    couplePhone: '+918595986978', coupleId: null,
    inboundMessage: inbound, rawInboundBody: inbound,
    supabase: sb, anthropic: null,
  });
  assert.ok(CALLS > 0, 'the turn never reached the model — the harness is not driving production');
  // THE BRANCH IS ASSERTED, NOT ASSUMED.
  const leadWrites = sb._w.inserts.filter((x) => x.table === 'leads');
  const leadPatches = sb._w.updates.filter((x) => x.table === 'leads');
  const ranCreate = leadWrites.length === 1;
  assert.strictEqual(ranCreate, !existingLeadRow,
    `the turn ran the ${ranCreate ? 'CREATE' : 'UPDATE'} path when ${existingLeadRow ? 'UPDATE' : 'CREATE'} was asked for`);
  return { sb, res, lead: leadWrites[0] && leadWrites[0].row, patch: leadPatches[0] && leadPatches[0].row };
}

// ── runner ──────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}
const H = (s) => console.log(`\n── ${s} ${'─'.repeat(Math.max(0, 66 - s.length))}`);

(async () => {

H('§1 — F-08.87: "DECEMBER" NO LONGER BECOMES A HARD 1 DEC');

await t('§1.1 CREATE: a month-only capture lands precision=month, sentinel kept', async () => {
  const { lead } = await drive({ capture: { event_date: '2026-12-01', name: 'Priya', occasion: 'wedding' } });
  assert.strictEqual(lead.wedding_date_precision, 'month',
    'the create path wrote no month precision — "December" is a hard 1 Dec again');
  assert.strictEqual(lead.wedding_date, '2026-12-01',
    'the 1st-of-month SENTINEL must survive: the DB keeps a sortable date, the UI reads precision');
});

await t('§1.2 CREATE: an explicit day stays day — the cure does not blunt real dates', async () => {
  const { lead } = await drive({
    history: [{ direction: 'inbound', body: 'the wedding is 14 December', sent_by: null, created_at: '2026-08-05T10:00:00Z' }],
    capture: { event_date: '2026-12-14', name: 'Priya' },
  });
  assert.strictEqual(lead.wedding_date_precision, 'day', 'a stated day was demoted to month');
  assert.strictEqual(lead.wedding_date, '2026-12-14', 'a stated day was moved');
});

await t('§1.3 CREATE: no date at all -> both columns NULL, never an empty string', async () => {
  const { lead } = await drive({ capture: { name: 'Priya', occasion: 'wedding' } });
  assert.strictEqual(lead.wedding_date, null, 'a date appeared from nowhere');
  assert.strictEqual(lead.wedding_date_precision, null,
    "precision must be NULL, not '' — leads_wedding_date_precision_check admits day|month|year and NULL only");
});

await t('§1.4 UPDATE: a returning capture patches precision alongside the date', async () => {
  const { patch } = await drive({
    existingLeadRow: { id: 'l1', name: null, intent_summary: null, intent_summary_at: null },
    capture: { event_date: '2026-12-01', name: 'Priya' },
  });
  assert.strictEqual(patch.wedding_date_precision, 'month',
    'the update path wrote a date and left precision stale — the two columns can disagree');
  assert.strictEqual(patch.wedding_date, '2026-12-01', 'the update path lost the sentinel');
});

await t('§1.5 UPDATE: a capture with no date touches NEITHER column (F-06.48 holds)', async () => {
  const { patch } = await drive({
    existingLeadRow: { id: 'l1', name: null, intent_summary: null, intent_summary_at: null },
    capture: { name: 'Priya', event_city: 'Jaipur' },
  });
  assert.ok(!('wedding_date' in patch), 'a dateless turn nulled a stored date');
  assert.ok(!('wedding_date_precision' in patch),
    'a dateless turn re-labelled a stored date — precision must travel WITH the date, never alone');
});

H('§2 — THE HAYSTACK IS THE OWNER\'S OWN WORDS (CE R-A2)');

await t('§2.1 the month named TURNS EARLIER still lands month — the bride is not required to repeat herself', async () => {
  // The capture fires on "my name is Priya"; "December" was two turns back. A
  // haystack of this inbound alone reads no month name and falls through to 'day'.
  const { lead } = await drive({ capture: { event_date: '2026-12-01', name: 'Priya' } });
  assert.strictEqual(lead.wedding_date_precision, 'month',
    'the session history is not reaching the resolver — a month named earlier is being lost');
});

await t('§2.2 ⚑ THE ASSISTANT\'S OWN PROSE IS EXCLUDED — she cannot mint a precision', async () => {
  // Only the ASSISTANT says "December" here. If her wording entered the haystack the
  // resolver would read a month name the bride never spoke and demote a real day.
  const { lead } = await drive({
    history: [
      { direction: 'outbound', body: 'so, a December wedding then?', sent_by: 'ai', created_at: '2026-08-05T10:01:00Z' },
      { direction: 'inbound',  body: 'yes that works',              sent_by: null, created_at: '2026-08-05T10:00:00Z' },
    ],
    capture: { event_date: '2026-12-01', name: 'Priya' },
  });
  assert.strictEqual(lead.wedding_date_precision, 'day',
    "the assistant's paraphrase minted a precision the bride never spoke — the provenance-hold class");
});

await t('§2.3 the resolver has ONE home and this lane calls it, not a copy', () => {
  const e = read(ENGINE_P);
  // TWO lanes, TWO `resolveWeddingDate` imports, ONE home. (The file holds four
  // `datePrecision` requires in total — the other two pull `formatDateWithPrecision`
  // for display and are not this cell's subject.)
  assert.strictEqual((e.match(/const \{ resolveWeddingDate \} = require\('\.\/datePrecision'\)/g) || []).length, 2,
    'the two lanes no longer share one date home — re-derive before trusting any §1 cell');
  assert.ok(!/hasDayAdjacentToMonth|findMonthInText/.test(e),
    'a second precision implementation was reconstructed inside engine.js — one home, or none');
  assert.ok(!/setFullYear/.test(read(DATE_P)),
    'the year-bump migrated INTO the shared resolver: the vendor lane would inherit a rule it never had');
});

H('§3 — THE YEAR-BUMP SURVIVED THE JOIN (§8: regressions beat missing features)');

// ⚠ THE BUMP'S REACH IS TWO YEARS AND THAT IS PRE-EXISTING, NOT THIS SITTING'S.
// The inline parse this cure replaced bumped at most twice, so a date more than two
// years stale still files in the past. The behaviour is carried forward BYTE-FOR-BYTE
// (§8: existing behaviour is sacred) and the limit is named here rather than silently
// widened — widening it would be an unruled arm. `2025-12-01` is the realistic shape:
// the model resolves a bare "December" against a year at or near the current one.
await t('§3.1 a past month-only date rolls forward AND keeps its month precision', async () => {
  const { lead } = await drive({
    history: [{ direction: 'inbound', body: 'we are thinking December', sent_by: null, created_at: '2026-08-05T10:00:00Z' }],
    capture: { event_date: '2025-12-01', name: 'Priya' },
  });
  assert.ok(lead.wedding_date > '2026-01-01',
    'a past date was filed in the past — the year-bump was lost in the join');
  assert.ok(/-12-01$/.test(lead.wedding_date),
    'the bump moved the sentinel off the 1st of the month, so precision and date now disagree');
  assert.strictEqual(lead.wedding_date_precision, 'month',
    'the bump destroyed the precision the resolver derived');
});

H('§4 — F-08.86: THE VENDOR WIRE READS THE HOUSE REGISTER');

await t('§4.1 SITE 1, END-TO-END: the alert the vendor receives carries Rs 4,50,000', async () => {
  const { res } = await drive({ capture: { event_date: '2026-12-01', name: 'Priya', budget_min: 450000 } });
  const notif = res.vendorNotification;
  assert.ok(notif, 'the turn produced no vendor notification — the site is unreached');
  assert.ok(notif.includes(`Budget: ${rupees(450000)}`),
    `the grouped byte never reached the wire; got: ${notif}`);
  assert.ok(!/\d\.\dL\b/.test(notif), `the L shorthand survived on the vendor wire: ${notif}`);
  assert.ok(!/₹/.test(notif), 'the forbidden glyph reached the vendor wire');
});

await t('§4.2 SITE 1: a range renders both bounds grouped, separator byte preserved', async () => {
  const { res } = await drive({
    capture: { event_date: '2026-12-01', name: 'Priya', budget_min: 450000, budget_max: 600000 },
  });
  assert.ok(res.vendorNotification.includes(`Budget: ${rupees(450000)}-${rupees(600000)}`),
    `the founder-vetoed range form is not what shipped; got: ${res.vendorNotification}`);
});

await t('§4.3 SITE 1: toFixed(1) rounding is gone — 4,55,000 is no longer read back as 4.6L', async () => {
  const { res } = await drive({ capture: { event_date: '2026-12-01', name: 'Priya', budget_min: 455000 } });
  assert.ok(res.vendorNotification.includes('Rs 4,55,000'),
    `the vendor was handed a rounded figure the bride never said: ${res.vendorNotification}`);
});

await t('§4.4 ⚠ F-08.89: SITE 2 IS DEAD CODE AND IS LEFT BYTE-FROZEN, NOT CURED', () => {
  // This cell asserts the FINDING, not a cure. It reds the day someone either cures
  // site 2 in place (which breaks b05_f0550 §4.3's freeze) or deletes the island
  // (which is the ruling that would make curing it moot). Either way the next
  // sitting is forced to re-read this paragraph, which is the point.
  const e = read(ENGINE_P);
  const banner = e.indexOf('F-05.56 — EVERYTHING BELOW THIS LINE HAS ZERO CALLERS');
  const site2  = e.indexOf("case 'list_leads'");
  assert.ok(banner !== -1, 'the F-05.56 banner is gone — re-derive F-08.89 before trusting it');
  assert.ok(site2 > banner,
    'list_leads left the defused island — if it now has a caller, F-08.89 is live and site 2 must be cured');
  assert.ok(/toFixed\(1\)\}L/.test(e.slice(site2, site2 + 1400)),
    'site 2 was cured in place — that moves an executable byte inside the frozen island (b05_f0550 §4.3)');
});

await t('§4.5 ONE HOME, NOT A THIRD FORMATTER — both sites import witnessLine and nothing else', () => {
  const e = read(ENGINE_P);
  // ONE, not two: site 2 is dead code and deliberately untouched (§4.4 / F-08.89).
  assert.strictEqual((e.match(/require\('\.\.\/lib\/witnessLine'\)/g) || []).length, 1,
    'the live money site is not routed to the CJS grouping home, or a second import appeared');
  assert.ok(!/toLocaleString\('en-IN'\)/.test(e.slice(e.indexOf('Build vendor notification'), e.indexOf("case 'update_lead_state'"))),
    'a second grouping implementation was planted between the two sites — R2-B forbids a third formatter');
  // LIVE-FORM TELL: the expectation is the home's own output, never a pasted literal.
  assert.strictEqual(rupees(450000), 'Rs 4,50,000', 'the home itself no longer emits the house register');
});

await t('§4.6 the money register holds across the whole notification, not just the budget clause', async () => {
  const { res } = await drive({
    capture: { event_date: '2026-12-01', name: 'Priya', occasion: 'wedding', event_city: 'Jaipur', budget_min: 450000 },
  });
  assert.ok(!/\b\d+(\.\d+)?\s*(L|k|Cr)\b/.test(res.vendorNotification),
    `a k/L/Cr form survived somewhere in the alert: ${res.vendorNotification}`);
});

// ── summary ─────────────────────────────────────────────────────────────────
console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) {
  console.log('GREEN — "December" survives as December on both write paths, the bride\'s own\n'
    + '        words are the only authority for what she said, the year-bump survived the\n'
    + '        join, and the vendor wire reads the house register from the one home.');
}
process.exit(fail === 0 ? 0 : 1);

})();
