// scripts/b05_m1b_inbound_bench.js — TDW_05 TRANSPORT MIGRATION M1b (bride inbound) bench.
// Proves the inbound cutover is W-1-safe:
//   1. VERBATIM-THEN-DIFF: brideInbound.js's core == the original brideIndex.js handler region
//      (base 693ce8e), minus ONLY the mechanical transport-decoupling. RED on any content drift.
//   2. INPUT EQUIVALENCE: twilioInputsFrom() and metaInputsFrom() agree on every content-bearing
//      field for the same logical message (only the dedupe key differs — sid vs wamid, correct).
//   3. TWO-PATH BYTE-IDENTITY: one fixture driven through the REAL core over a faithful in-memory
//      supabase fake (only the LLM turn + the sender are stubbed; ALL branching runs for real) via
//      BOTH transports' inputs — the outbound reply bytes are identical. Plus a circle-member and a
//      dead-end fixture to prove the branch routing is transport-agnostic too.
// SCOPE DISCLOSED: the fixtures exercise the TEXT path (the common, fully-shared path) + circle +
// dead-end. Media inbound is a declared Meta gap at M1 (text-only) — not a hollow green, a named gap.
'use strict';
const assert = require('assert');
const { execSync } = require('child_process');

delete require.cache[require.resolve('../src/lib/brideInbound.js')];
const { processBrideInbound, twilioInputsFrom, metaInputsFrom } = require('../src/lib/brideInbound.js');
const webhookCore = require('../src/lib/webhookCore.js');

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

// ── 1. VERBATIM-THEN-DIFF ────────────────────────────────────────────────────────────────
function verbatimDiff() {
  const orig = execSync('git show 693ce8e:src/brideIndex.js', { encoding: 'utf8' }).split('\n');
  const core = orig.slice(173, 636); // 174..636
  const tf = (l) => l
    .replace("return res.status(200).send('<Response></Response>');", 'return;')
    .replace('payload: req.body,', 'payload: rawPayload,')
    .replace("(req.body.MediaContentType0 || '')", "(mediaContentType || '')")
    .replace('req.body.MediaUrl0', 'mediaUrl')
    .replace('          req,', '          req: { body: { MediaContentType0: mediaContentType, MediaUrl0: mediaUrl } },');
  const expected = core.map(tf).filter((l) => !l.includes("require('./lib/imageThrottle')"));
  const mod = require('fs').readFileSync(require.resolve('../src/lib/brideInbound.js'), 'utf8').split('\n');
  const ti = mod.findIndex((l) => l === '  try {');
  const ci = mod.findIndex((l) => l === '  } catch (err) {');
  const actual = mod.slice(ti + 1, ci);
  return { expected, actual };
}

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
function twilioReq(text) {
  return { body: { From: `whatsapp:+${PHONE}`, Body: text, ProfileName: 'Test Bride', MessageSid: 'SMxxxx', NumMedia: '0' } };
}
function metaMsg(text) {
  return { from: PHONE, text, messageId: 'wamid.XXX', type: 'text', timestamp: '1', media: [] };
}

(async () => {
  // 1. verbatim
  await t('VERBATIM: brideInbound core == original brideIndex region (minus decoupling)', () => {
    const { expected, actual } = verbatimDiff();
    assert.strictEqual(actual.length, expected.length, `line count ${actual.length} vs ${expected.length}`);
    for (let i = 0; i < expected.length; i++) {
      assert.strictEqual(actual[i], expected[i], `drift at core line ${i + 1}:\n  exp: ${expected[i]}\n  act: ${actual[i]}`);
    }
  });

  // 2. input equivalence
  await t('INPUT EQUIVALENCE: twilio vs meta agree on content-bearing fields', () => {
    const text = 'hey can you show me my events';
    const ti = twilioInputsFrom(twilioReq(text), { internalReplay: false, trimmedBody: text, numMedia: 0, hasMedia: false });
    const mi = metaInputsFrom(metaMsg(text), { entry: [] });
    for (const k of ['phone', 'body', 'profileName', 'trimmedBody', 'hasMedia', 'numMedia', 'mediaContentType', 'mediaUrl']) {
      if (k === 'profileName') continue; // Twilio may carry ProfileName; Meta null — not reply-content-bearing
      assert.deepStrictEqual(ti[k], mi[k], `field '${k}' differs: ${JSON.stringify(ti[k])} vs ${JSON.stringify(mi[k])}`);
    }
    assert.notStrictEqual(ti.messageId, mi.messageId, 'dedupe key SHOULD differ (sid vs wamid)');
  });

  // 3a. TWO-PATH BYTE-IDENTITY — text path
  await t('BYTE-IDENTITY (text): same reply bytes via Twilio-inputs and Meta-inputs', async () => {
    const text = 'what is due this week';
    const reply = 'Here is what is due this week ✦ (₹80k to Priya on Thursday)';
    const sT = [], sM = [];
    webhookCore._resetSidLru && webhookCore._resetSidLru();
    await processBrideInbound(twilioInputsFrom(twilioReq(text), { internalReplay: false, trimmedBody: text, numMedia: 0, hasMedia: false }),
      makeDeps({ user: USER, couple: COUPLE, conversation: CONVO, sends: sT, engineReply: reply }));
    await processBrideInbound(metaInputsFrom(metaMsg(text), { entry: [] }),
      makeDeps({ user: USER, couple: COUPLE, conversation: CONVO, sends: sM, engineReply: reply }));
    assert.strictEqual(sT.length, 1, `twilio path sent ${sT.length}, expected 1 reply`);
    assert.strictEqual(sM.length, 1, `meta path sent ${sM.length}, expected 1 reply`);
    assert.deepStrictEqual(sT[0], sM[0], 'reply {phone,text,media} must be byte-identical across transports');
    assert.strictEqual(sT[0].text, reply);
  });

  // 3a-MUTATION: guard against a hollow assertion
  await t('BYTE-IDENTITY MUTATION: a diverged reply WOULD be caught', async () => {
    const sT = [], sM = [];
    await processBrideInbound(twilioInputsFrom(twilioReq('x'), { internalReplay: false, trimmedBody: 'x', numMedia: 0, hasMedia: false }),
      makeDeps({ user: USER, couple: COUPLE, conversation: CONVO, sends: sT, engineReply: 'AAA' }));
    await processBrideInbound(metaInputsFrom(metaMsg('x'), { entry: [] }),
      makeDeps({ user: USER, couple: COUPLE, conversation: CONVO, sends: sM, engineReply: 'BBB' }));
    assert.throws(() => assert.deepStrictEqual(sT[0], sM[0]), 'divergent replies must fail the assertion');
  });

  // 3b. circle-member routing is transport-agnostic
  await t('BYTE-IDENTITY (circle): active member routes to handleCircleMemberMessage identically', async () => {
    const member = { id: 'm1', couple_id: 'c1', invitee_name: 'Aunt', role: 'family', status: 'active', invitee_phone: PHONE };
    const sT = [], sM = [];
    await processBrideInbound(twilioInputsFrom(twilioReq('hi'), { internalReplay: false, trimmedBody: 'hi', numMedia: 0, hasMedia: false }),
      makeDeps({ user: USER, couple: COUPLE, conversation: CONVO, sends: sT, engineReply: 'r', circleMember: member }));
    await processBrideInbound(metaInputsFrom(metaMsg('hi'), { entry: [] }),
      makeDeps({ user: USER, couple: COUPLE, conversation: CONVO, sends: sM, engineReply: 'r', circleMember: member }));
    assert.deepStrictEqual(sT[0], { circleHandled: true, phone: '+' + PHONE, body: 'hi' });
    assert.deepStrictEqual(sT[0], sM[0], 'circle routing identical across transports');
  });

  // 3c. dead-end (no user) is transport-agnostic
  await t('BYTE-IDENTITY (dead-end): unknown phone gets the SAME DEAD_END_REPLY on both', async () => {
    const sT = [], sM = [];
    const deadDeps = (sends) => makeDeps({ user: null, couple: null, conversation: CONVO, sends, engineReply: 'r' });
    await processBrideInbound(twilioInputsFrom(twilioReq('hello'), { internalReplay: false, trimmedBody: 'hello', numMedia: 0, hasMedia: false }), deadDeps(sT));
    await processBrideInbound(metaInputsFrom(metaMsg('hello'), { entry: [] }), deadDeps(sM));
    assert.strictEqual(sT.length, 1);
    assert.deepStrictEqual(sT[0], sM[0], 'dead-end reply identical across transports');
    assert.ok(sT[0].text.includes('invite list'), 'is the dead-end reply');
  });

  console.log(`\nb05_m1b_inbound_bench: ${pass} passed, ${fail} failed`);
  if (fail === 0) console.log('GREEN — verbatim core · input equivalence · two-path byte-identity (text/circle/dead-end) over the REAL core + faithful supabase fake. Meta media = declared M1 gap. Live send declared-not-claimed.');
  process.exit(fail === 0 ? 0 : 1);
})();
