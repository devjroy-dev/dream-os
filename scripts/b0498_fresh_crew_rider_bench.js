#!/usr/bin/env node
'use strict';
// scripts/b0498_fresh_crew_rider_bench.js — TDW_04.5 F-04.98 cures C3 + C4 + the F-05.19 rider.
// Runnable from any working directory, clean clone, no network, no keys:
//   node scripts/b0498_fresh_crew_rider_bench.js
//
// WHAT IT PROVES (behaviour, LD-5 — never wording), driving the REAL exported functions:
//
//   §1 C3 THE FRESH WORD (matchFreshWord): exact WHOLE-MESSAGE "fresh", trimmed +
//      case-insensitive. The negatives are the both-ways guard — an over-eager contains()
//      convicts here, because "start fresh tomorrow" is a REAL TURN, not a button. And the
//      MODE WORDS ARE UNAFFECTED: "advisor mode" is not a fresh word, "fresh" is not a mode
//      word, and matchModeWord's ('advisor'|'business'|null) contract is untouched — the
//      byte-identity law of this sitting, asserted rather than asserted-about.
//
//   §2 C3 THE THREAD (the REAL abandonActiveThread, the seam the door calls): a live thread
//      is abandoned — state 'abandoned', NEVER deleted (D-4's no-clear law) — and an already-
//      fresh room is a safe no-op returning { ok:true, closed:null }. That idempotence is the
//      GROUND of the single-line ruling (F2a): the line states a truth in both worlds, so
//      there is no false-state-claim to guard against and no changed/noop split to mimic.
//
//   §3 C3 THE LINE: the minted confirmation is exact, and it is SCRUBBED-CLASS — it names the
//      reset and carries zero cabinet content (no rupee figure, no phone number, no client
//      name, no thread payload). Asserted structurally, not by eyeballing the string.
//
//   §4 C4 THE BLINDNESS LINE, BOTH HOMES: the rendered snapshot header of the WA door
//      (calendarSignals.js) and of the app door (chat.js) each disclose the snapshot's own
//      crew-blindness and point at the tool — as VERBATIM IDENTICAL BYTES. One mind, two
//      surfaces (F-04.65). Asserted on the BUILT STRING from the real function against a
//      seeded estate, not on source text: a comment saying it would not pass.
//      §4c holds the engine's 0-line diff: the tool description still carries its own line
//      (F-04.97, untouched) — the cure is ADDITIVE, the description was not moved or edited.
//
//   §5 RIDER (F-05.19): the marketing status log names each error as code:title, so a 131049
//      identifies itself instead of hiding inside "errors=1". Driven by invoking the REAL
//      print site's console.log through a captured console, against a real extractStatuses
//      payload — the extractor itself is proven 0-line (its output shape is asserted intact).
//
//   §6 F-04.101 THE JOINT (added this sitting, CE-ruled R1) — §1-§3 prove the PARTS; this
//      proves the WIRING. The REAL processVendorInbound is driven end-to-end with a "fresh"
//      fixture, over the b05_m2 bench's own deterministic-supabase-fake pattern, through BOTH
//      the Meta transport (metaInputsFrom) — the two-path doctrine RETIRED at M2b, applied to
//      the fence, so a transport that skipped the short-circuit could not hide behind the one
//      that took it. The short-circuit is asserted WHOLE: the outbound row's body IS
//      FRESH_THREAD_LINE, the conversation's last_message_at is bumped, the thread is
//      abandoned via the real seam, and runTurn is NEVER invoked (stubbed with a call counter,
//      asserted zero). Before this section the fence could be killed dead —
//      `matchFreshWord(body)` -> `false && matchFreshWord(body)` — and the ENTIRE floor stayed
//      green: no bench drove processVendorInbound through it (b05_m2 correctly cannot see
//      in-fence code; jurisdiction, R1). That named mutation is this section's uncured test.
//      vendorInbound.js is 0-LINE for this cure: the fence is DRIVEN, never edited.
//
//   §7 Q2(a) THE PLANE CLAUSE (added this sitting, CE-ruled R2/R3) — the C4 header gains a
//      referent-plane constraint naming which string is an event_id (the booking's name, never
//      a note or description). §4 witnesses the header by SUBSTRING (.includes(BLIND)), which
//      an appended clause slides straight past — so the clause would ship unguarded. This
//      section witnesses the FULL BRACKET BYTES-EXACT at both homes instead, which both guards
//      the clause and makes any future header edit a Ruling №1 labeled amendment against an
//      exact-byte witness rather than a silent pass.
//
// DISCLOSED RIG: a mock supabase modelling engine.conversations (for the thread seam) and
// public.events (for the two snapshots). Every write op is witnessed so a stray delete
// convicts. No live model call, no DB, no network.

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';
process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'bench-inert';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// UNCURED-TREE LEGIBILITY: on the pre-cure tree these exports do not exist, and a bare
// destructure would THROW at the first assert — hiding which cures are missing behind a
// stack trace. Shimmed to absent-but-callable so the uncured run enumerates a clean RED on
// EXACTLY the cures. The shims can never green a cure: () => null never equals true, and
// the sentinel line never equals the minted one.
const _mode = require(path.join(ROOT, 'src/api/vendor-engine/vendorMode.js'));
const matchModeWord = _mode.matchModeWord;
const matchFreshWord = typeof _mode.matchFreshWord === 'function'
  ? _mode.matchFreshWord : () => null; // absent on the uncured tree
const FRESH_THREAD_LINE = typeof _mode.FRESH_THREAD_LINE === 'string'
  ? _mode.FRESH_THREAD_LINE : '<<ABSENT ON THIS TREE>>';
const {
  abandonActiveThread, fetchCalendarSnapshot: pwaSnapshot,
} = require(path.join(ROOT, 'src/api/vendor-engine/chat.js'));
const {
  fetchCalendarSnapshot: waSnapshot,
} = require(path.join(ROOT, 'src/lib/vendor/calendarSignals.js'));
const { extractStatuses } = require(path.join(ROOT, 'src/lib/metaInbound.js'));
// F-04.101 (this sitting): the JOINT. The real door and the real transport adapters — the
// fence lives inside processVendorInbound, so nothing short of driving it proves the wiring.
const {
  processVendorInbound, metaInputsFrom,
} = require(path.join(ROOT, 'src/lib/vendorInbound.js'));
const webhookCore = require(path.join(ROOT, 'src/lib/webhookCore.js'));
// Same uncured-tree legibility shim as the vendorMode exports: absent on the pre-cure tree,
// and the sentinel can never green a case (it carries no code, no title, no count).
const _mkt = require(path.join(ROOT, 'src/marketingIndex.js'));
const statusLogLine = typeof _mkt.statusLogLine === 'function'
  ? _mkt.statusLogLine : () => '<<ABSENT ON THIS TREE>>';

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('    PASS  ' + label); } else { fail++; console.log('    FAIL  ' + label); } };

// ── F-04.101 JOINT RIG (this sitting) ────────────────────────────────────────────────────
// The b05_m2 bench's deterministic-supabase-fake pattern, extended with WRITE CAPTURE: the
// short-circuit's whole evidence is what it WROTE (an outbound row) and what it DIDN'T (an
// engine turn). Only the LLM turn and the sender are stubbed — every branch from the door's
// entry down to the fence runs for real, and engine.conversations is served too so the REAL
// abandonActiveThread does its real read-then-update rather than a stub's say-so.
const J_VUSER  = { id: 'vu1', auth_user_id: 'au1', phone: '', name: 'Vendor Owner' };
const J_VENDOR = { id: 'v1', user_id: 'vu1', business_name: 'Priya Films', category: 'photographer', onboarding_state: 'complete', agent_id: 'ag1' };
const J_CONVO  = { id: 'convo1', vendor_id: 'v1', kind: 'vendor_self' };

function mkJointSupabase(ops, engineConvos) {
  const publicBuilder = (table) => {
    const b = {
      select: () => b, eq: () => b, in: () => b, order: () => b, not: () => b, is: () => b,
      gte: () => b, lte: () => b, limit: () => b,
      insert: (row) => { ops.inserts.push({ table, row }); return b; },
      update: (patch) => { ops.updates.push({ table, patch }); return b; },
      delete: () => { ops.deletes.push({ table }); return b; },
      maybeSingle: () => Promise.resolve({
        data: table === 'users' ? { ...J_VUSER }
            : table === 'vendors' ? { ...J_VENDOR }
            : table === 'conversations' ? { ...J_CONVO } : null,
        error: null,
      }),
      single: () => Promise.resolve({ data: null, error: null }),
      then: (res, rej) => Promise.resolve({ data: null, error: null }).then(res, rej),
    };
    return b;
  };
  // engine.conversations — the real abandonActiveThread's own territory.
  const engineBuilder = (table) => {
    const q = { _eq: {} };
    const chain = {
      select: () => chain, order: () => chain, limit: () => chain,
      eq(col, val) { q._eq[col] = val; return chain; },
      maybeSingle: () => Promise.resolve({
        data: table === 'conversations'
          ? (engineConvos.filter((c) => c.agent_id === q._eq.agent_id)[0] || null) : null,
        error: null,
      }),
      update(patch) {
        return { eq: (col, val) => {
          ops.engineUpdates.push({ id: val, patch });
          const c = engineConvos.find((x) => x.id === val); if (c) Object.assign(c, patch);
          return Promise.resolve({ error: null });
        } };
      },
      delete() { return { eq: (col, val) => { ops.engineDeletes.push({ id: val }); return Promise.resolve({ error: null }); } }; },
    };
    return chain;
  };
  return { from: publicBuilder, schema: () => ({ from: engineBuilder }), rpc: () => Promise.resolve({ data: null, error: null }) };
}

function mkJointDeps() {
  const noop = async () => ({});
  const ops = { inserts: [], updates: [], deletes: [], engineUpdates: [], engineDeletes: [], sends: [], turns: 0 };
  const engineConvos = [{ id: 'ec1', agent_id: 'ag1', state: 'active' }];
  const deps = {
    supabase: mkJointSupabase(ops, engineConvos),
    anthropic: {},
    sendWhatsApp: async (phone, text, media) => { ops.sends.push({ phone, text, media: media || [] }); return { sid: 'SMout' }; },
    webhookCore,
    // THE COUNTER. The fence's whole promise is that the engine does not run this turn.
    runTurn: async () => { ops.turns++; return { reply: '<<ENGINE RAN — THE FENCE LEAKED>>', tool_calls: [] }; },
    runCoupleAgenticTurn: async () => { ops.turns++; return { reply: '<<ENGINE RAN>>', tool_calls: [] }; },
    resolveAgentForVendor: async () => ({ agentId: 'ag1' }),
    fetchCalendarSnapshot: async () => ({}),
    fetchScratchpad: async () => ({}),
    buildLlmForTurn: async () => ({ tierOverride: null, modelOverride: null, transport: null, donnaTransport: null, donnaModelOverride: null }),
    applyCalendarSignals: async () => ({ suffix: '' }),
    generateInvoiceForBinder: noop,
    enquiryToBinder: noop,
    ensureCoupleRow: async () => ({ id: 'cpl1' }),
    captureField: noop,
    buildDisambiguationQuestion: () => 'disambig?',
    interpretDisambiguationReply: () => ({}),
    vendorDisplayName: (v) => (v && v.business_name) || 'vendor',
    matchModeWord, // the REAL one — the disjointness of the two word-sets is load-bearing here
    applyModeFlip: async () => ({}),
    MODE_FLIP_LINES: {},
    // The three the fence destructures: all REAL. A stubbed predicate would prove nothing.
    matchFreshWord, FRESH_THREAD_LINE, abandonActiveThread,
    checkImageThrottle: async () => ({ allowed: true }),
    markRejectionSent: async () => {},
    extractCalendarFromImage: async () => ({}),
  };
  return { deps, ops, engineConvos };
}

const J_PHONE = '919812300077';
const jMetaMsg   = (text) => ({ from: J_PHONE, text, messageId: 'wamid.FRESH', type: 'text', media: [] });
// M2b: Meta is the only transport. The twilio leg and the cross-transport identity case
// RETIRED with it (CE-62 F4's ledger) — a green over a dead path retires, not retains.
const jInputs = {
  meta:   (text) => metaInputsFrom(jMetaMsg(text), { entry: [] }),
};

// ── mock supabase: engine.conversations (thread seam) + public.events (snapshots) ──────────
function mkSupabase(convos, events) {
  const ops = { convoUpdates: [], deletes: [] };
  const engineTable = (table) => {
    const q = { _t: table, _eq: {} };
    const chain = {
      select() { return chain; },
      eq(col, val) { q._eq[col] = val; return chain; },
      order() { return chain; },
      limit() { return chain; },
      maybeSingle() {
        if (q._t === 'conversations') {
          const latest = convos.filter((c) => c.agent_id === q._eq.agent_id)[0] || null;
          return Promise.resolve({ data: latest ? { id: latest.id, state: latest.state } : null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      update(patch) {
        return { eq: (col, val) => {
          ops.convoUpdates.push({ id: val, patch });
          const c = convos.find((x) => x.id === val); if (c) Object.assign(c, patch);
          return Promise.resolve({ error: null });
        } };
      },
      delete() { return { eq: (col, val) => { ops.deletes.push({ id: val }); return Promise.resolve({ error: null }); } }; },
    };
    return chain;
  };
  // public.events — the snapshots' only read. Thenable at the end of the filter chain.
  const publicTable = (table) => {
    const rows = table === 'events' ? events : [];
    const chain = {
      select() { return chain; },
      eq() { return chain; },
      gte() { return chain; },
      lte() { return chain; },
      order() { return chain; },
      limit() { return Promise.resolve({ data: rows, error: null }); },
      then(res) { return Promise.resolve({ data: rows, error: null }).then(res); },
      maybeSingle() { return Promise.resolve({ data: null, error: null }); },
    };
    return chain;
  };
  return { from: publicTable, schema: () => ({ from: engineTable }), __ops: ops, __convos: convos };
}

const V = 'vvvvvvvv-0000-0000-0000-00000000dead';
function plus(n) { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const SEED = [
  { id: 'e1', vendor_id: V, title: 'Ananya - recce', event_date: plus(8), event_time: '09:00:00', kind: 'recce', state: 'upcoming' },
  { id: 'e2', vendor_id: V, title: 'Meera Kapoor - wedding shoot', event_date: plus(5), event_time: null, kind: 'shoot', state: 'upcoming' },
];

(async () => {
  console.log('\n  [1] C3 THE FRESH WORD (whole-message, trimmed, case-insensitive):');
  T('"fresh" -> true',                                  matchFreshWord('fresh') === true);
  T('"  Fresh  " -> true (trim + case)',                matchFreshWord('  Fresh  ') === true);
  T('"FRESH" -> true (case)',                           matchFreshWord('FRESH') === true);
  T('"start fresh tomorrow" -> false (contains, not equals — a REAL TURN falls through)',
    matchFreshWord('start fresh tomorrow') === false);
  T('"freshen up the quote" -> false (substring is not the button)',
    matchFreshWord('freshen up the quote') === false);
  T('"" -> false',                                      matchFreshWord('') === false);
  T('null -> false (no throw)',                         matchFreshWord(null) === false);
  T('undefined -> false (no throw)',                    matchFreshWord(undefined) === false);

  console.log('\n  [1b] THE MODE WORDS ARE UNAFFECTED (this sitting\'s byte-identity law, asserted):');
  T('"advisor mode" is NOT a fresh word',                matchFreshWord('advisor mode') === false);
  T('"business mode" is NOT a fresh word',               matchFreshWord('business mode') === false);
  T('"fresh" is NOT a mode word (matchModeWord contract uncorrupted)', matchModeWord('fresh') === null);
  T('matchModeWord still yields advisor/business exactly as before',
    matchModeWord('advisor mode') === 'advisor' && matchModeWord('business mode') === 'business');
  T('the two word-sets are DISJOINT (no message is both a flip and a reset)',
    !['fresh', 'advisor mode', 'business mode'].some((w) => matchFreshWord(w) && matchModeWord(w) !== null));

  console.log('\n  [2] C3 THE THREAD (the real seam the door calls):');
  {
    const sb = mkSupabase([{ id: 'c1', agent_id: 'a1', state: 'active' }], []);
    const r = await abandonActiveThread(sb, 'a1');
    T('a live thread is abandoned (the vendor gets his empty room)', r.ok === true && r.closed === 'c1');
    T('state is \'abandoned\', the rows persist — NEVER a delete (D-4 no-clear)',
      sb.__convos[0].state === 'abandoned' && sb.__ops.deletes.length === 0);
  }
  {
    const sb = mkSupabase([{ id: 'c1', agent_id: 'a1', state: 'abandoned' }], []);
    const r = await abandonActiveThread(sb, 'a1');
    T('an ALREADY-FRESH room is a safe no-op ({ok:true, closed:null}) — the ground of the single-line ruling',
      r.ok === true && r.closed === null && sb.__ops.convoUpdates.length === 0);
  }
  {
    const sb = mkSupabase([], []);
    T('no conversation at all: still ok, still nothing written (idempotent by construction)',
      (await abandonActiveThread(sb, 'a1')).ok === true && sb.__ops.convoUpdates.length === 0);
  }

  console.log('\n  [3] C3 THE LINE (exact + scrubbed class):');
  T('the confirmation line is exact', FRESH_THREAD_LINE === 'Fresh thread. What\u2019s on your mind?');
  T('it NAMES the reset (the vendor learns the room emptied)', /fresh thread/i.test(FRESH_THREAD_LINE));
  T('scrubbed class: zero cabinet content (no rupee figure, no phone, no digits at all)',
    !/[0-9]/.test(FRESH_THREAD_LINE) && !/\u20b9|Rs\.?\s/i.test(FRESH_THREAD_LINE));
  T('scrubbed class: no proxy persona name reaches the wire (Victor/Donna/Harvey)',
    !/victor|donna|harvey/i.test(FRESH_THREAD_LINE));

  console.log('\n  [4] C4 THE BLINDNESS LINE — BOTH HOMES, built strings, verbatim identical:');
  const BLIND = 'Crew assignments are not shown here \u2014 signal donna_assign_crew; the calendar adjudicates.';
  let waSnap = '', pwaSnap = '';
  {
    const sb = mkSupabase([], SEED);
    waSnap = await waSnapshot(sb, V);
    T('WA door: the snapshot builds against the seeded estate', waSnap.length > 0);
    T('WA door: the snapshot DISCLOSES ITS OWN CREW-BLINDNESS and points at the tool', waSnap.includes(BLIND));
    T('WA door: the F-04.66 referent header survives beside it (no regression)',
      /Refer to a booking by its name/.test(waSnap));
    T('WA door: the bookings still render as sayable referents',
      waSnap.includes('\u00b7 Ananya - recce'));
  }
  {
    const sb = mkSupabase([], SEED);
    const req = { app: { locals: { supabase: sb } }, vendor: { id: V, tier: 'signature' } };
    pwaSnap = await pwaSnapshot(req);
    T('app door: the snapshot builds against the seeded estate', pwaSnap.length > 0);
    T('app door: the SAME disclosure rides the SAME header', pwaSnap.includes(BLIND));
    T('app door: the F-04.66 referent header survives beside it (no regression)',
      /Refer to a booking by its name/.test(pwaSnap));
  }
  {
    // F-04.65 doctrine, asserted: one mind, two surfaces — the disclosure cannot drift by
    // surface. Compare the HEADER LINE of each built snapshot byte-for-byte.
    const headOf = (s) => s.split('\n')[0];
    T('*** BOTH HOMES CARRY THE HEADER AS VERBATIM IDENTICAL BYTES (F-04.65) ***',
      headOf(waSnap) === headOf(pwaSnap) && headOf(waSnap).includes(BLIND));
    T('the disclosure appears exactly ONCE per snapshot (not duplicated into the lines)',
      (waSnap.match(/Crew assignments are not shown here/g) || []).length === 1 &&
      (pwaSnap.match(/Crew assignments are not shown here/g) || []).length === 1);
  }
  {
    // §4c — the engine's 0-line diff, held by assertion. The description-layer cure (F-04.97)
    // is UNTOUCHED: the new snapshot line is ADDITIVE, never a move of the old one.
    const fs = require('fs');
    const ts = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/tools/recordPrimitives.ts'), 'utf8');
    T('§4c engine untouched: F-04.97\'s description line still stands where it was',
      ts.includes('The calendar snapshot never shows crew assignments.'));
    T('§4c engine untouched: the door-adjudicates clause still stands',
      ts.includes('signal the request; the door adjudicates and answers deterministically'));
  }

  console.log('\n  [5] RIDER F-05.19 — the marketing status log names its errors:');
  {
    // A REAL Meta delivery-failure payload, through the REAL extractor.
    const body = { entry: [{ changes: [{ value: { statuses: [
      { id: 'wamid.FAILED1', status: 'failed', recipient_id: '918757788550',
        errors: [{ code: 131049, title: 'Re-engagement message' }] },
      { id: 'wamid.OK1', status: 'delivered', recipient_id: '918757788550' },
    ] } }] }] };
    const statuses = extractStatuses(body);
    T('extractor 0-line: it still returns raw errors[] with code + title intact',
      statuses.length === 2 && statuses[0].errors.length === 1 &&
      statuses[0].errors[0].code === 131049 && statuses[1].errors.length === 0);

    // THE REAL PRINT SITE, not a re-typed copy. An earlier cut of this bench re-implemented
    // the formatter locally and PASSED on the uncured tree — vacuous, and caught by running
    // the uncured column rather than trusting the cured one. statusLogLine is the production
    // function the console.log at the print site now calls; nothing here re-types its format.
    const emit = (s) => statusLogLine(s);
    const failedLine = emit(statuses[0]);
    const okLine     = emit(statuses[1]);
    T('*** A 131049 NAMES ITSELF (the code is IN the line, not hidden behind a count) ***',
      failedLine.includes('131049'));
    T('…and so does its title (a window problem reads differently from a template problem)',
      failedLine.includes('Re-engagement message'));
    T('the count survives beside the detail (nothing lost from the old line)',
      failedLine.includes('errors=1'));
    // The happy path must be byte-unchanged from the pre-rider line. The tag is DERIVED from
    // production, never re-typed: an earlier cut hardcoded '[marketing]' and convicted itself
    // against the real '[wa:marketing]' — the bench reading production, as intended.
    const TAG = okLine.slice(0, okLine.indexOf(' status wamid='));
    T('a clean delivery is byte-unchanged — no empty bracket on the happy path',
      okLine === `${TAG} status wamid=wamid.OK1 status=delivered` && !/\[\]/.test(okLine));
    T('…and the failure line differs from the clean line ONLY by the error detail',
      failedLine.startsWith(`${TAG} status wamid=wamid.FAILED1 status=failed errors=`));
    T('a malformed error degrades to \'?\' — never prints "undefined"',
      emit({ id: 'w', status: 'failed', errors: [{}] }).includes('?:?') &&
      !emit({ id: 'w', status: 'failed', errors: [{}] }).includes('undefined'));

    // The production source must actually carry this shape — the bench's local emit() is a
    // reader, not a substitute. Assert the real file agrees.
    const fs = require('fs');
    const mi = fs.readFileSync(path.join(ROOT, 'src/marketingIndex.js'), 'utf8');
    T('the PRODUCTION print site calls the lifted formatter (the log line is not inline-retyped)',
      mi.includes('console.log(statusLogLine(s));'));
    T('the extractor is 0-line: metaInbound is untouched by this rider',
      require('fs').readFileSync(path.join(ROOT, 'src/lib/metaInbound.js'), 'utf8')
        .includes('errors: Array.isArray(s.errors) ? s.errors : []'));
  }

  // ── [6] F-04.101 THE JOINT — the fence DRIVEN, both transports ─────────────────────────
  // LABELED, F-04.101-attributed (CE ruling R1, this sitting). Sections [1]-[3] prove the
  // parts; nothing proved they were wired together. The chair's mutation
  //   `if (matchFreshWord(body))` -> `if (false && matchFreshWord(body))`
  // is the NAMED uncured test for this section and must RED here — and, before this section
  // existed, RED nowhere at all.
  console.log('\n  [6] F-04.101 THE JOINT — the real processVendorInbound, driven through the fence:');
  {
    for (const transport of ['meta']) {
      const { deps, ops, engineConvos } = mkJointDeps();
      await processVendorInbound(jInputs[transport]('fresh'), deps);

      const outbound = ops.inserts.filter((i) => i.table === 'messages' && i.row.direction === 'outbound');
      T(`${transport}: the door replies exactly ONCE (the short-circuit, not a turn)`,
        ops.sends.length === 1 && outbound.length === 1);
      T(`${transport}: the outbound ROW's body IS the minted line (what the vendor keeps)`,
        outbound.length === 1 && outbound[0].row.body === FRESH_THREAD_LINE);
      T(`${transport}: …and the SENT bytes are that same line (row and wire agree)`,
        ops.sends.length === 1 && ops.sends[0].text === FRESH_THREAD_LINE);
      T(`${transport}: the conversation's last_message_at is bumped (the room stays current)`,
        ops.updates.some((u) => u.table === 'conversations' && typeof u.patch.last_message_at === 'string'));
      T(`*** ${transport}: runTurn is NEVER invoked — the engine cannot re-populate the room it just emptied ***`,
        ops.turns === 0);
      T(`${transport}: the thread is ABANDONED through the real seam (state, never a delete)`,
        engineConvos[0].state === 'abandoned' && ops.engineDeletes.length === 0);
      T(`${transport}: the inbound row is still written (the audit log is not skipped)`,
        ops.inserts.some((i) => i.table === 'messages' && i.row.direction === 'inbound' && i.row.body === 'fresh'));
    }
    // The both-ways limb, driven the same way: a message that merely CONTAINS the word is a
    // REAL TURN. If the fence ever widened to contains(), the engine would stop running for
    // ordinary sentences — this case convicts that, at the JOINT rather than at the predicate.
    {
      const { deps, ops, engineConvos } = mkJointDeps();
      await processVendorInbound(jInputs.meta('start fresh tomorrow'), deps);
      T('a sentence merely CONTAINING the word falls THROUGH to the engine (runTurn ran)',
        ops.turns === 1);
      T('…and that turn abandoned nothing — the room is untouched',
        engineConvos[0].state === 'active');
      T('…and no fresh-line row was written on that turn',
        !ops.inserts.some((i) => i.table === 'messages' && i.row.body === FRESH_THREAD_LINE));
    }
    // RETIRED at M2b: cross-transport identity (one fence, two doors). There is one door now.
    // §6c — the fence's file is 0-LINE for this cure. The bench DRIVES it; it does not edit it.
    const fs6 = require('fs');
    const vi = fs6.readFileSync(path.join(ROOT, 'src/lib/vendorInbound.js'), 'utf8');
    T('§6c the fence stands unedited in production (guarded predicate, both markers present)',
      vi.includes('if (matchFreshWord(body)) {') &&
      vi.includes('// F-04.98 C3 BEGIN') && vi.includes('// F-04.98 C3 END'));
  }

  // ── [7] Q2(a) THE PLANE CLAUSE — the header witnessed BYTES-EXACT at both homes ─────────
  // LABELED, Q2(a)/F-04.101-attributed (CE ruling R2, this sitting). Section [4] witnesses the
  // header by substring, which an appended clause slides past unguarded — so this section
  // takes the FULL BRACKET as an exact-byte witness. A one-byte drift at either home REDs
  // here; a future header edit is therefore a Ruling №1 labeled amendment, by construction.
  console.log('\n  [7] Q2(a) THE PLANE CLAUSE — full bracket, bytes-exact, both homes:');
  {
    const HEADER = '[Calendar \u2014 upcoming, kept for you. Refer to a booking by its name as it '
      + 'appears below (with its date, if two share a name) to change or cancel it. Crew '
      + 'assignments are not shown here \u2014 signal donna_assign_crew; the calendar adjudicates. '
      + 'For event_id use the booking\'s name from the lines below, never a note or description.]';
    const bracketOf = (s) => { const m = s.match(/\[Calendar[^\]]*\]/); return m ? m[0] : ''; };
    const waSb = mkSupabase([], SEED);
    const wa = bracketOf(await waSnapshot(waSb, V));
    const pwaSb = mkSupabase([], SEED);
    const pwa = bracketOf(await pwaSnapshot({ app: { locals: { supabase: pwaSb } }, vendor: { id: V, tier: 'signature' } }));
    T('WA door: the built header is the expected bytes, EXACTLY (no drift, no near-miss)', wa === HEADER);
    T('app door: the built header is the expected bytes, EXACTLY', pwa === HEADER);
    T('*** THE TWO HOMES ARE BYTE-IDENTICAL ON THE FULL BRACKET (F-04.65, exact witness) ***',
      wa === pwa && wa.length > 0);
    T('the clause names the PLANE: an event_id is the booking\'s name, never a note or description',
      wa.includes("For event_id use the booking's name from the lines below, never a note or description."));
    T('…and it rides INSIDE the bracket (context the model reads, not a stray trailing line)',
      wa.endsWith('description.]') && (wa.match(/\]/g) || []).length === 1);
    T('the C4 blindness disclosure survives beside it (no regression on the older cure)',
      wa.includes('Crew assignments are not shown here') && pwa.includes('Crew assignments are not shown here'));
  }

  console.log(`\n  \u2500\u2500 ${pass}/${pass + fail} PASS \u2500\u2500\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
