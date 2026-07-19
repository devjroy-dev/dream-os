// scripts/b05_m1_transport_bench.js — TDW_05 TRANSPORT MIGRATION M1a (bride lane, outbound) bench.
// Non-vacuous, mutation-proven. Proves the whatsapp.js body-rewire:
//   1. Twilio fallthrough is BYTE-IDENTICAL to the pre-migration sender (reference oracle + matrix)
//      — the chair's #1 re-derivation: this rewrites the LIVE shared Twilio sender.
//   2. Meta routing is service-scoped and COLLISION-PROOF (CE §2 refinement).
//   3. The F-05.2 opt-out gate runs ONLY on the Meta lane (Twilio path never gated → byte-identical).
//   4. wamid returns in .sid; media-on-Meta is a named refused gap (M1 text-only).
// No network, no creds, no supabase. deps.twilioCreate is injected here; in prod it defaults to the
// REAL twilioClient.messages.create (see whatsapp.js) so production behavior is untouched.
'use strict';
const assert = require('assert');
delete require.cache[require.resolve('../src/lib/whatsapp.js')];
const { sendWhatsApp, metaLaneFor } = require('../src/lib/whatsapp.js');

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

const BRIDE_LIT = 'whatsapp:+14787788550';
const noSb = { supabase: false };                      // opt-out gate degrades to no-op

// ── REFERENCE ORACLE: the pre-migration Twilio param construction, verbatim from the
// original whatsapp.js (lines 33-48). The rewrite must produce IDENTICAL params. ──────────
function originalTwilioParams(toPhone, body, mediaUrls, from) {
  const to       = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  const fromAddr = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
  const params = { from: fromAddr, to, body };
  if (Array.isArray(mediaUrls) && mediaUrls.length > 0) params.mediaUrl = mediaUrls.slice(0, 10);
  return params;
}

(async () => {
  // ── 1. Twilio byte-identity: new branch == reference oracle across a matrix ──────────────
  const bigMedia = Array.from({ length: 13 }, (_, i) => `https://img/${i}.jpg`); // >10 → truncation
  const matrix = [
    ['+919800000002', 'hello there', [], BRIDE_LIT],
    ['whatsapp:+919800000002', 'prefixed to', [], BRIDE_LIT],
    ['+919800000002', '', ['https://img/a.jpg'], BRIDE_LIT],
    ['+919800000002', 'trunc', bigMedia, BRIDE_LIT],
    ['919800000002', 'no-plus from', [], '14155550000'],       // unprefixed from → 'whatsapp:' added
    ['+919800000002', 'empty-from-default', [], undefined],    // default from = TWILIO_WHATSAPP_NUMBER
  ];
  for (let i = 0; i < matrix.length; i++) {
    const [to, body, media, from] = matrix[i];
    await t(`Twilio byte-identity [${i}] params == pre-migration oracle`, async () => {
      let params = null;
      const fromArg = from === undefined ? undefined : from;
      const r = await sendWhatsApp(to, body, media, fromArg, {
        env: {}, twilioCreate: async (p) => { params = p; return { sid: 'SM_' + i }; }, ...noSb,
      });
      const effFrom = fromArg === undefined ? (process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14787788550') : fromArg;
      assert.deepStrictEqual(params, originalTwilioParams(to, body, media, effFrom));
      assert.strictEqual(r.sid, 'SM_' + i, 'raw Twilio msg.sid passthrough unchanged');
    });
  }
  await t('Twilio byte-identity MUTATION: a corrupted body WOULD fail (guards vacuity)', async () => {
    let params = null;
    await sendWhatsApp('+91980', 'real body', [], BRIDE_LIT, { env: {}, twilioCreate: async (p) => { params = p; return { sid: 's' }; }, ...noSb });
    assert.throws(() => assert.deepStrictEqual(params, originalTwilioParams('+91980', 'WRONG', [], BRIDE_LIT)));
  });

  // ── 2. metaLaneFor: collision-proof, service-scoped ──────────────────────────────────────
  await t('metaLaneFor: no id env -> null (dormant until provisioned)', () => {
    assert.strictEqual(metaLaneFor(BRIDE_LIT, {}), null);
  });
  await t('metaLaneFor: bride id + bride number -> bride lane', () => {
    assert.deepStrictEqual(metaLaneFor(BRIDE_LIT, { BRIDE_PHONE_NUMBER_ID: 'PBRIDE' }), { line: 'bride', phoneNumberId: 'PBRIDE' });
  });
  await t('metaLaneFor: COLLISION-PROOF — vendor process (no bride id) + bride literal -> null', () => {
    assert.strictEqual(metaLaneFor(BRIDE_LIT, { VENDOR_PHONE_NUMBER_ID: 'PVEND' }), null);
  });
  await t('metaLaneFor: vendor lane needs an EXPLICIT distinct vendor number', () => {
    assert.strictEqual(metaLaneFor(BRIDE_LIT, { VENDOR_PHONE_NUMBER_ID: 'PVEND' }), null);
    assert.deepStrictEqual(
      metaLaneFor('whatsapp:+919812345678', { VENDOR_PHONE_NUMBER_ID: 'PVEND', VENDOR_WHATSAPP_NUMBER: '+919812345678' }),
      { line: 'vendor', phoneNumberId: 'PVEND' });
  });

  // ── 3. Meta path outbound ────────────────────────────────────────────────────────────────
  await t('Meta path: bride lane -> sendMetaText(bride id); body byte-preserved; wamid in .sid', async () => {
    let seen = null;
    const r = await sendWhatsApp('+919800000001', 'Good morning', [], BRIDE_LIT, {
      env: { BRIDE_PHONE_NUMBER_ID: 'PBRIDE' }, sendMetaText: async (payload, opts) => { seen = { payload, opts }; return { ok: true, wamid: 'wamid.ABC' }; }, ...noSb,
    });
    assert.strictEqual(seen.opts.phoneNumberId, 'PBRIDE');
    assert.strictEqual(seen.payload.text, 'Good morning');
    assert.strictEqual(r.sid, 'wamid.ABC');
    assert.strictEqual(r.meta, true);
  });
  await t('Meta path: media on Meta lane -> named refused gap, NO send (M1 text-only)', async () => {
    let called = false;
    const r = await sendWhatsApp('+91980', '', ['https://img/x.jpg'], BRIDE_LIT, { env: { BRIDE_PHONE_NUMBER_ID: 'P' }, sendMetaText: async () => { called = true; return { wamid: 'w' }; }, ...noSb });
    assert.strictEqual(called, false);
    assert.strictEqual(r.blocked, 'meta_media_unsupported');
    assert.strictEqual(r.sid, null);
  });

  // ── 4. F-05.2 opt-out gate: Meta lane only; Twilio path NEVER gated ─────────────────────
  await t('opt-out: Meta lane + opted-out -> BLOCKED, Meta NOT called', async () => {
    let metaCalled = false;
    const r = await sendWhatsApp('+919800000003', 'hi', [], BRIDE_LIT, {
      env: { BRIDE_PHONE_NUMBER_ID: 'PBRIDE' }, sendMetaText: async () => { metaCalled = true; return { wamid: 'w' }; }, isOptedOut: async () => true,
    });
    assert.strictEqual(metaCalled, false);
    assert.strictEqual(r.blocked, 'opted_out');
    assert.strictEqual(r.sent, false);
  });
  await t('opt-out: Twilio path NEVER consults the gate (byte-identical) — gate fake would throw', async () => {
    let sent = false;
    // isOptedOut throws if called; the Twilio path must not call it at all.
    const r = await sendWhatsApp('+91980', 'hi', [], BRIDE_LIT, {
      env: {}, twilioCreate: async () => { sent = true; return { sid: 's' }; },
      isOptedOut: async () => { throw new Error('gate must NOT run on the Twilio path'); },
    });
    assert.strictEqual(sent, true);
    assert.strictEqual(r.sid, 's');
  });
  await t('opt-out: Meta lane + NO supabase -> no-op, send proceeds', async () => {
    let sent = false;
    await sendWhatsApp('+91980', 'hi', [], BRIDE_LIT, { env: { BRIDE_PHONE_NUMBER_ID: 'P' }, sendMetaText: async () => { sent = true; return { wamid: 'w' }; }, supabase: false });
    assert.strictEqual(sent, true, 'without supabase the gate must not block');
  });

  console.log(`\nb05_m1_transport_bench: ${pass} passed, ${fail} failed`);
  if (fail === 0) console.log('GREEN — Twilio byte-identical (oracle+matrix) · Meta routing collision-proof · F-05.2 gate Meta-only · wamid in .sid · media gap named. Live send declared-not-claimed.');
  process.exit(fail === 0 ? 0 : 1);
})();
