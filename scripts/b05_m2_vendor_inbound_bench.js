// scripts/b05_m2_vendor_inbound_bench.js — TDW_05 TRANSPORT MIGRATION M2 (vendor inbound) bench.
// Proves the vendor inbound cutover is W-1-safe (same three proofs as M1b):
//   1. VERBATIM-THEN-DIFF: vendorInbound.js's core == the original index.js handler region
//      (base 3afc4ba, lines 181-970), minus ONLY the mechanical transport-decoupling — and,
//      per the TDW_04.5 F-04.98 CE ruling (ninth chair, Ruling №1's class), minus the single
//      FENCED post-extraction block marked `// F-04.98 C3 BEGIN` … `// F-04.98 C3 END`.
//      See the jurisdiction note inside verbatimDiff(): the guard is NOT weakened — drift
//      outside the fence still REDs, and the fenced block carries its own bench.
//   2. INPUT EQUIVALENCE: twilioInputsFrom() and metaInputsFrom() agree on every content-bearing
//      field; only the dedupe key differs (sid vs wamid).
//   3. TWO-PATH BYTE-IDENTITY: one fixture driven through the REAL core over a DETERMINISTIC
//      in-memory supabase fake (only LLM turn + sender stubbed; ALL branching runs for real) via
//      BOTH transports — the outbound reply bytes are identical. The fake is deterministic, so
//      both transports traverse the identical path; a mutation guard proves the assert isn't vacuous.
// SCOPE DISCLOSED: the fixture exercises the onboarded-vendor TEXT path (the common path). Media/
// calendar-OCR inbound is a declared Meta gap at M1 (text-only), symmetric with M1a/M1b.
'use strict';
const assert = require('assert');
const { execSync } = require('child_process');

delete require.cache[require.resolve('../src/lib/vendorInbound.js')];
const { processVendorInbound, twilioInputsFrom, metaInputsFrom } = require('../src/lib/vendorInbound.js');
const webhookCore = require('../src/lib/webhookCore.js');

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

// ── 1. VERBATIM-THEN-DIFF ──────────────────────────────────────────────────────────────
function verbatimDiff() {
  const orig = execSync('git show 3afc4ba:src/index.js', { encoding: 'utf8' }).split('\n');
  const core = orig.slice(180, 970); // 181..970
  const tf = (l) => l
    .replace("return res.status(200).send('<Response></Response>');", 'return;')
    .replace("return res.status(200).send('<Response/>');", 'return;')
    .replace("res.status(200).send('<Response/>');", 'return;')
    .replace('req.body.MediaUrl0', 'mediaUrl')
    // TDW_05 F-05.14 (CE-ruled, eighth chair): the media-only fallback log used req.body.From,
    // which is undefined in the extracted core (req is no param of processVendorInbound) and
    // crashed the live Meta media-only turn into GRACEFUL_TURN_LINE. Cured to `phone`. This is a
    // documented mechanical transform, same class as the decoupling swaps above.
    .replace('media-only fallback from ${req.body.From}', 'media-only fallback from ${phone}');
  const expected = core.map(tf).filter((l) =>
    !l.includes("require('./lib/imageThrottle')") && !l.includes("require('./lib/vendorCalendarImage')"));
  const mod = require('fs').readFileSync(require.resolve('../src/lib/vendorInbound.js'), 'utf8').split('\n');
  const ti = mod.findIndex((l) => l === '  try {');
  const ci = mod.findIndex((l) => l === '  } catch (err) {');

  // ── TDW_04.5 F-04.98 C3 AMENDMENT (CE-ruled, ninth chair — Ruling №1's class, 4th instance) ──
  // JURISDICTION, stated so no later reader mistakes this for a weakening: this bench guards
  // the EXTRACTION FIDELITY OF THE ORIGINAL BYTES (base 3afc4ba, 181-970) and continues to.
  // Drift anywhere OUTSIDE the fence still REDs, including drift on the lines adjacent to it.
  // The fenced block is POST-EXTRACTION FEATURE CODE — it has no counterpart in the original
  // region and never could, so asking this bench to see it would be asking it to prove
  // something it was not built to prove. ITS guard is the sitting's own bench:
  //   node scripts/b0498_fresh_crew_rider_bench.js
  // No bench is asked to see what another proves. Symmetric to the `expected`-side filter
  // below, which drops the two extraction-removed requires: each side drops exactly what the
  // other side cannot legitimately carry, and nothing more.
  const C3_BEGIN = '    // F-04.98 C3 BEGIN (CE-ruled, ninth chair — fresh word)';
  const C3_END   = '    // F-04.98 C3 END';
  const core2 = mod.slice(ti + 1, ci);
  const b = core2.indexOf(C3_BEGIN);
  const e = core2.indexOf(C3_END);
  if (b !== -1 && e !== -1 && e > b) core2.splice(b, e - b + 1); // inclusive of both markers
  return { expected, actual: core2 };
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
function twilioReq(text) { return { body: { From: `whatsapp:+${PHONE}`, Body: text, ProfileName: 'Vendor Owner', MessageSid: 'SMv', NumMedia: '0' } }; }
function metaMsg(text)   { return { from: PHONE, text, messageId: 'wamid.V', type: 'text', media: [] }; }

(async () => {
  await t('VERBATIM: vendorInbound core == original index.js region (minus decoupling)', () => {
    const { expected, actual } = verbatimDiff();
    assert.strictEqual(actual.length, expected.length, `line count ${actual.length} vs ${expected.length}`);
    for (let i = 0; i < expected.length; i++)
      assert.strictEqual(actual[i], expected[i], `drift at core line ${i + 1}:\n exp:${expected[i]}\n act:${actual[i]}`);
  });

  await t('INPUT EQUIVALENCE: twilio vs meta agree on content-bearing fields', () => {
    const text = 'send the invoice to Ramesh';
    const ti = twilioInputsFrom(twilioReq(text), { internalReplay: false, trimmedBody: text, numMedia: 0, hasMedia: false });
    const mi = metaInputsFrom(metaMsg(text), { entry: [] });
    for (const k of ['phone', 'body', 'trimmedBody', 'hasMedia', 'numMedia', 'mediaUrl', 'internalReplay']) {
      assert.deepStrictEqual(ti[k], mi[k], `field '${k}' differs: ${JSON.stringify(ti[k])} vs ${JSON.stringify(mi[k])}`);
    }
    assert.notStrictEqual(ti.messageSid, mi.messageSid, 'dedupe key SHOULD differ (sid vs wamid)');
  });

  await t('BYTE-IDENTITY (vendor text): identical reply bytes via Twilio-inputs and Meta-inputs', async () => {
    const text = 'what did I book this week';
    const reply = 'You have 2 shoots booked ✦ Sat (Sharma sangeet) and Sun (Verma wedding).';
    const sT = [], sM = [];
    await processVendorInbound(twilioInputsFrom(twilioReq(text), { internalReplay: false, trimmedBody: text, numMedia: 0, hasMedia: false }), makeDeps(sT, reply));
    await processVendorInbound(metaInputsFrom(metaMsg(text), { entry: [] }), makeDeps(sM, reply));
    assert.ok(sT.length >= 1, `twilio path produced ${sT.length} sends, expected >=1`);
    assert.deepStrictEqual(sT, sM, 'the FULL outbound send sequence must be byte-identical across transports');
    assert.strictEqual(sT[0].text, reply, 'reached the vendor-self reply path');
  });

  await t('BYTE-IDENTITY MUTATION: a diverged reply WOULD be caught', async () => {
    const sT = [], sM = [];
    await processVendorInbound(twilioInputsFrom(twilioReq('x'), { internalReplay: false, trimmedBody: 'x', numMedia: 0, hasMedia: false }), makeDeps(sT, 'AAA'));
    await processVendorInbound(metaInputsFrom(metaMsg('x'), { entry: [] }), makeDeps(sM, 'BBB'));
    assert.throws(() => assert.deepStrictEqual(sT, sM), 'divergent replies must fail the assertion');
  });

  console.log(`\nb05_m2_vendor_inbound_bench: ${pass} passed, ${fail} failed`);
  if (fail === 0) console.log('GREEN — verbatim core · input equivalence · two-path byte-identity (vendor text) over the REAL core + deterministic supabase fake. Meta media = declared M1 gap. Live send declared-not-claimed.');
  process.exit(fail === 0 ? 0 : 1);
})();
