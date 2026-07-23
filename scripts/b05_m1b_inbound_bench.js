// scripts/b05_m1b_inbound_bench.js — TDW_05 bride inbound, META-PATH WIRING bench.
//
// ═══ THE VERBATIM GUARD'S LIFE AND DEATH (CE-62, M2b) ═════════════════════════════════
// BORN at M1b. Its job: prove brideInbound.js's core was a byte-faithful extraction of
// src/brideIndex.js's Twilio handler region (base 693ce8e), so the bride cutover onto Meta
// could not smuggle a behavior change in under cover of a refactor. It did that job, and it
// caught two real bugs pre-deploy while doing it (a bare `req` reference and a `+E164`
// normalization divergence).
//
// DIED at M2b, same reason as its vendor twin in b05_m2: the guard proved EXTRACTION
// FIDELITY against a Twilio-era original. With the Twilio handler deleted there is no second
// implementation to drift from, and re-baselining would make it assert that today matches
// today — a green by construction, which reads like protection and is not.
//
// COUNT: 6 -> 4, disclosed (CE-62 F4's ledger).
// RETIRED: the verbatim guard · twilio-vs-meta input equivalence.
// STAYS, re-shaped Meta-only: the three routing paths this bench actually protects — the
// engine reply, circle-member routing, and the dead-end — plus the mutation guard that keeps
// them non-vacuous. They were written as two-path comparisons; they are wiring assertions now.
'use strict';
const assert = require('assert');

delete require.cache[require.resolve('../src/lib/brideInbound.js')];
const { processBrideInbound, metaInputsFrom } = require('../src/lib/brideInbound.js');
const webhookCore = require('../src/lib/webhookCore.js');

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

// ── 1. VERBATIM-THEN-DIFF ────────────────────────────────────────────────────────────────

// ── faithful in-memory supabase fake (reaches the real branches; not hollow) ──────────────
function makeSupabase(perTable) {
  function builder(table) {
    const b = {
      select: () => b, eq: () => b, in: () => b, order: () => b, not: () => b,
      gte: () => b, lte: () => b, limit: () => b, insert: () => b, update: () => b, delete: () => b,
      maybeSingle: () => Promise.resolve((perTable[table] && perTable[table]()) || { data: null, error: null }),
      single: () => Promise.resolve((perTable[table] && perTable[table]()) || { data: null, error: null }),
      then: (res, rej) => Promise.resolve({ data: null, error: null }).then(res, rej),
    };
    return b;
  }
  return { from: (t) => builder(t), rpc: () => Promise.resolve({ data: null, error: null }) };
}

// deps for the TEXT-happy-path (circle skip, claim skip, user+couple+convo found, engine turn, reply)
function makeDeps({ user, couple, conversation, sends, engineReply, circleMember = null }) {
  return {
    supabase: makeSupabase({
      circle_members: () => ({ data: circleMember, error: null }),
      users:          () => ({ data: user, error: null }),
      couples:        () => ({ data: couple, error: null }),
      conversations:  () => ({ data: conversation, error: null }),
      messages:       () => ({ data: null, error: null }),
    }),
    anthropic: {},
    sendWhatsApp: async (phone, text, media) => { sends.push({ phone, text, media: media || [] }); return { sid: 'X' }; },
    webhookCore,
    runBrideAgenticTurn: async () => ({ reply: engineReply, mediaUrls: [], toolCalls: null, model: 'haiku', inputTokens: 1, outputTokens: 2, costUsd: 0, costInr: 0, circleSummary: null }),
    surfacePendingCircleSessions: async () => '',
    saveToMuse: async () => ({ ok: false, error: 'n/a' }),
    checkImageThrottle: async () => ({ allowed: true }),
    markRejectionSent: async () => {},
    handleSurpriseMe: async () => 'surprise',
    handleCircleMemberMessage: async (args) => { sends.push({ circleHandled: true, phone: args.phone, body: args.body }); },
    buildCircleGreeting: () => 'greeting',
    extractMuseUrl: () => null,
    buildMediaContextNote: () => 'note',
    DEAD_END_REPLY: "Sorry — you're not on our invite list yet. Request access at thedreamwedding.in",
    CIRCLE_TOKEN_REGEX: /^CIRCLE-[A-Z0-9]{6}$/,
  };
}

const PHONE = '919800000009';
const USER   = { id: 'u1', phone: PHONE, name: 'Test Bride' };  // name set → profile-backfill skipped both paths
const COUPLE = { id: 'c1', user_id: 'u1', wedding_date: null };
const CONVO  = { id: 'conv1', couple_id: 'c1' };

// Twilio raw payload and the EQUIVALENT Meta payload for the SAME logical text message.
function metaMsg(text) {
  return { from: PHONE, text, messageId: 'wamid.XXX', type: 'text', timestamp: '1', media: [] };
}

(async () => {
  // 1. verbatim
  // 3a. META WIRING — the engine reply reaches the sender
  await t('META WIRING (text): the engine reply reaches the sender intact', async () => {
    const text = 'what is due this week';
    const reply = 'Here is what is due this week — (80k to Priya on Thursday)';
    const sM = [];
    webhookCore._resetSidLru && webhookCore._resetSidLru();
    await processBrideInbound(metaInputsFrom(metaMsg(text), { entry: [] }),
      makeDeps({ user: USER, couple: COUPLE, conversation: CONVO, sends: sM, engineReply: reply }));
    assert.strictEqual(sM.length, 1, `meta path sent ${sM.length}, expected 1 reply`);
    assert.strictEqual(sM[0].text, reply);
  });

  // 3a-MUTATION: guard against a hollow assertion
  await t('NON-VACUOUS: a diverged reply WOULD be caught', async () => {
    const sT = [], sM = [];
    await processBrideInbound(metaInputsFrom(metaMsg('x'), { entry: [] }),
      makeDeps({ user: USER, couple: COUPLE, conversation: CONVO, sends: sT, engineReply: 'AAA' }));
    await processBrideInbound(metaInputsFrom(metaMsg('x'), { entry: [] }),
      makeDeps({ user: USER, couple: COUPLE, conversation: CONVO, sends: sM, engineReply: 'BBB' }));
    assert.throws(() => assert.deepStrictEqual(sT[0], sM[0]), 'divergent replies must fail the assertion');
  });

  // 3b. circle-member routing is transport-agnostic
  await t('META WIRING (circle): active member routes to handleCircleMemberMessage', async () => {
    const member = { id: 'm1', couple_id: 'c1', invitee_name: 'Aunt', role: 'family', status: 'active', invitee_phone: PHONE };
    const sT = [], sM = [];
    await processBrideInbound(metaInputsFrom(metaMsg('hi'), { entry: [] }),
      makeDeps({ user: USER, couple: COUPLE, conversation: CONVO, sends: sM, engineReply: 'r', circleMember: member }));
    assert.deepStrictEqual(sM[0], { circleHandled: true, phone: '+' + PHONE, body: 'hi' });
    void sT;
  });

  // 3c. dead-end (no user) is transport-agnostic
  await t('META WIRING (dead-end): unknown phone gets the DEAD_END_REPLY', async () => {
    const sT = [], sM = [];
    const deadDeps = (sends) => makeDeps({ user: null, couple: null, conversation: CONVO, sends, engineReply: 'r' });
    await processBrideInbound(metaInputsFrom(metaMsg('hello'), { entry: [] }), deadDeps(sM));
    assert.strictEqual(sM.length, 1);
    assert.ok(sM[0].text.includes('invite list'), 'is the dead-end reply');
    void sT;
  });

  console.log(`\nb05_m1b_inbound_bench: ${pass} passed, ${fail} failed`);
  if (fail === 0) console.log('GREEN — Meta-path wiring (text/circle/dead-end) over the REAL core + faithful supabase fake, non-vacuous. Verbatim guard RETIRED at M2b (see header). Live send declared-not-claimed.');
  process.exit(fail === 0 ? 0 : 1);
})();
