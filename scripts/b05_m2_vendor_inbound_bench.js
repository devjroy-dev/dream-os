// scripts/b05_m2_vendor_inbound_bench.js — TDW_05 vendor inbound, META-PATH WIRING bench.
//
// ═══ THE VERBATIM GUARD'S WHOLE LIFE, AND ITS DEATH (CE-62, M2b) ═══════════════════════
// BORN at M2 (TDW_05 transport migration). Its job: prove that vendorInbound.js's core was
// a byte-faithful extraction of src/index.js's Twilio handler region (base 3afc4ba, lines
// 181-970), so that moving the vendor turn onto Meta could not smuggle in a behavior change
// under cover of a refactor. It did that job for the whole migration era.
//
// IT CARRIED TWO FENCE AMENDMENTS, both CE-ruled, both Ruling №1's class:
//   · F-04.98 C3 (ninth chair) — the fresh-word door, post-extraction feature code with no
//     counterpart in the original region; its own guard is b0498_fresh_crew_rider_bench.js.
//   · P6 Fork B (CE-61, ninth chair) — the vendorCategory thread, in two places at two
//     indent depths; its own guard is b0461_p6_bench.js.
// A third change (Fork A's category thread into fetchCalendarSnapshot) was handled by
// TRANSFORM rather than fence, deliberately: it modified an original line rather than adding
// one, and splicing a modified original out of the comparison would have hidden all future
// drift on it.
//
// DIED at M2b, and the reason is the point. The guard proved EXTRACTION FIDELITY — "the
// extracted core still matches the Twilio-era original it came from." With the Twilio handler
// deleted, that question has no stakes left: there is no second implementation to drift from,
// and re-baselining the guard to the post-sunset tree would make it assert that today matches
// today. That is a green by construction — the hollow kind this estate kills on sight. A guard
// that cannot fail is worse than no guard, because it reads like protection.
//
// LAST WITNESS, run before retirement on the post-delete tree: 788 lines compared, ZERO drift.
// The M2b deletion (twilioInputsFrom, which lived OUTSIDE the guarded try/catch region) never
// touched a baseline byte. The guard retired green, not broken.
//
// THE FENCE MARKERS STAY in vendorInbound.js. They name real CE rulings and remain accurate
// attribution for why those lines exist; only the splice logic dies here, with the guard it served.
//
// ═══ WHAT THIS BENCH IS NOW ═══════════════════════════════════════════════════════════
// The Meta-path wiring bench: one fixture driven through the REAL core over a deterministic
// in-memory supabase fake (only the LLM turn and the sender are stubbed; ALL branching runs
// for real), asserting the vendor-self reply reaches the sender intact. Plus a mutation guard,
// so the green is not vacuous. COUNT: 4 -> 2, disclosed (CE-62 F4's ledger).
// RETIRED HERE: the verbatim guard (above) · twilio-vs-meta input equivalence · two-path
// byte-identity — all three asserted a transport that no longer exists.
// SCOPE DISCLOSED (unchanged): the fixture exercises the onboarded-vendor TEXT path. Media/
// calendar-OCR inbound rides b05_media_shim_bench.js.
'use strict';
const assert = require('assert');

delete require.cache[require.resolve('../src/lib/vendorInbound.js')];
const { processVendorInbound, metaInputsFrom } = require('../src/lib/vendorInbound.js');
const webhookCore = require('../src/lib/webhookCore.js');

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

// ── deterministic in-memory supabase fake (reaches the real branches; not hollow) ────────
function makeSupabase(perTable) {
  function builder(table) {
    const b = {
      select: () => b, eq: () => b, in: () => b, order: () => b, not: () => b, is: () => b,
      gte: () => b, lte: () => b, limit: () => b, insert: () => b, update: () => b, delete: () => b,
      schema: () => ({ from: (t) => builder(t) }),
      maybeSingle: () => Promise.resolve((perTable[table] && perTable[table]()) || { data: null, error: null }),
      single: () => Promise.resolve((perTable[table] && perTable[table]()) || { data: null, error: null }),
      then: (res, rej) => Promise.resolve({ data: null, error: null }).then(res, rej),
    };
    return b;
  }
  return { from: (tbl) => builder(tbl), schema: () => ({ from: (t) => builder(t) }), rpc: () => Promise.resolve({ data: null, error: null }) };
}

const VUSER   = { id: 'vu1', phone: '', name: 'Vendor Owner' };
const VENDOR  = { id: 'v1', user_id: 'vu1', business_name: 'Priya Films', category: 'photographer', onboarding_state: 'complete', agent_id: 'ag1' };

function makeDeps(sends, reply) {
  const noop = async () => ({});
  return {
    supabase: makeSupabase({
      users:   () => ({ data: { ...VUSER }, error: null }),
      vendors: () => ({ data: { ...VENDOR }, error: null }),
      conversations: () => ({ data: { id: 'convo1', vendor_id: 'v1', kind: 'vendor_self' }, error: null }),
    }),
    anthropic: {},
    sendWhatsApp: async (phone, text, media) => { sends.push({ phone, text, media: media || [] }); return { sid: 'X' }; },
    webhookCore,
    runTurn: async () => ({ reply, tool_calls: [] }),
    runCoupleAgenticTurn: async () => ({ reply, tool_calls: [] }),
    resolveAgentForVendor: async () => 'ag1',
    fetchCalendarSnapshot: async () => ({}),
    fetchScratchpad: async () => ({}),
    // LABELED AMENDMENT · F-05.50(b) / CE-68 · COUNT PRESERVED, zero assertion changes.
    // THE BOTH-SIDES CLAUSE (CE-59): the door's dep contract gained fetchLeadPings, so
    // this stub follows the NEW caller shape. It returns '' — no active pings — which is
    // byte-identically the world these cells already asserted. The alternative was to make
    // the dep optional in production so old stubs stayed green; that would let a wiring
    // regression land silently, which is the very disease F-05.50(b) cures. The door
    // fails LOUD on a missing dep and the stubs follow it.
    fetchLeadPings: async () => '',
    buildLlmForTurn: async () => ({ tierOverride: null, modelOverride: null, transport: null, donnaTransport: null, donnaModelOverride: null }),
    applyCalendarSignals: async () => ({ suffix: '' }),
    generateInvoiceForBinder: noop,
    enquiryToBinder: noop,
    ensureCoupleRow: async () => ({ id: 'cpl1' }),
    captureField: noop,
    buildDisambiguationQuestion: () => 'disambig?',
    interpretDisambiguationReply: () => ({}),
    vendorDisplayName: (v) => (v && v.business_name) || 'vendor',
    matchModeWord: () => null,
    applyModeFlip: async () => ({}),
    MODE_FLIP_LINES: {},
    // TDW_04.5 F-04.98 C3: the door destructures these three; a missing dep throws mid-turn
    // and dead-letters. matchFreshWord returns false here so the fixture's text ("send the
    // invoice to Ramesh" / "x") takes the ENGINE path exactly as before — the two-path
    // byte-identity proof is untouched, and "fresh" never rides this fixture (disjoint).
    matchFreshWord: () => false,
    FRESH_THREAD_LINE: '',
    abandonActiveThread: async () => ({ ok: true, closed: null }),
    checkImageThrottle: async () => ({ allowed: true }),
    markRejectionSent: async () => {},
    extractCalendarFromImage: async () => ({}),
  };
}

const PHONE = '919812300077';
function metaMsg(text)   { return { from: PHONE, text, messageId: 'wamid.V', type: 'text', media: [] }; }

(async () => {
  await t('META WIRING: the vendor-self reply reaches the sender intact', async () => {
    const text  = 'what did I book this week';
    const reply = 'You have 2 shoots booked ✦ Sat (Sharma sangeet) and Sun (Verma wedding).';
    const sends = [];
    await processVendorInbound(metaInputsFrom(metaMsg(text), { entry: [] }), makeDeps(sends, reply));
    assert.ok(sends.length >= 1, `meta path produced ${sends.length} sends, expected >=1`);
    assert.strictEqual(sends[0].text, reply, 'reached the vendor-self reply path');
  });

  await t('NON-VACUOUS: a diverged reply WOULD be caught', async () => {
    const a = [], b = [];
    await processVendorInbound(metaInputsFrom(metaMsg('x'), { entry: [] }), makeDeps(a, 'AAA'));
    await processVendorInbound(metaInputsFrom(metaMsg('x'), { entry: [] }), makeDeps(b, 'BBB'));
    assert.throws(() => assert.deepStrictEqual(a, b), 'divergent replies must fail the assertion');
  });

  console.log(`\nb05_m2_vendor_inbound_bench: ${pass} passed, ${fail} failed`);
  if (fail === 0) console.log('GREEN — Meta-path wiring over the REAL core + deterministic supabase fake, non-vacuous. Verbatim guard RETIRED at M2b (see header). Live send declared-not-claimed.');
  process.exit(fail === 0 ? 0 : 1);
})();
