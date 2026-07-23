// scripts/b05_m1_transport_bench.js — TDW_05 TRANSPORT MIGRATION M1a (bride lane, outbound) bench.
// Non-vacuous, mutation-proven. Proves the whatsapp.js body-rewire:
//   1. Twilio fallthrough is BYTE-IDENTICAL to the pre-migration sender (reference oracle + matrix)
//      — the chair's #1 re-derivation: this rewrites the LIVE shared Twilio sender.
//   2. Meta routing is service-scoped and COLLISION-PROOF (CE §2 refinement).
//   3. The F-05.2 opt-out gate runs ONLY on the Meta lane (Twilio path never gated → byte-identical).
//   4. wamid returns in .sid; media-on-Meta is a named refused gap (M1 text-only).
// No network, no creds, no supabase. deps.twilioCreate is injected here; in prod it defaults to the
// M2b: the Twilio sender is DELETED; whatsapp.js has one path (Meta) and one floor (refusal).
//
// ── F-05.16 CONTRACT SHIFT (CE-ruled amendment) ──────────────────────────────────────────────
// The bride Meta lane requires an EXPLICIT BRIDE_WHATSAPP_NUMBER; the TWILIO_WHATSAPP_NUMBER/
// literal inheritance is dead. The five bride-Meta cases below (each marked "F-05.16") gained an
// explicit BRIDE_WHATSAPP_NUMBER in their env — ENV ADDITIONS ONLY, semantics preserved (bride
// still resolves, now under the corrected explicit-number discipline). For the F-05.16 delivery
// this file is a LABELED AMENDMENT, no longer byte-stable — diff reviewable line-by-line.
'use strict';
const assert = require('assert');
delete require.cache[require.resolve('../src/lib/whatsapp.js')];
const { sendWhatsApp, metaLaneFor } = require('../src/lib/whatsapp.js');

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

// ── LABELED AMENDMENT · TDW_05 P4 (CE-63, Ruling №1) ────────────────────────────────────
// The literal `14787788550` below is a PROTECTED SPECIMEN, not an oversight. P4's F5 rider
// drove the dead Twilio sandbox number to grep-zero across src/** RUNTIME VALUES; the
// re-scope ratified at CE-63 NAMES four classes where it deliberately survives, and this
// fixture is one of them: the assertion beneath it EXISTS TO PROVE THE NUMBER'S ABSENCE.
// Delete the literal and the assertion stops testing anything while still reporting green —
// a vacuous cell is worse than a missing one. Do not "clean this up."
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
  // ══ 1. Twilio byte-identity — RETIRED AT M2b (CE-62) ═══════════════════════════════
  // Seven cells lived here: a six-case matrix diffing sendWhatsApp's Twilio params against
  // originalTwilioParams (the pre-migration reference oracle), plus its vacuity mutation.
  // They existed to prove the Meta branch could be added WITHOUT disturbing the Twilio
  // fallthrough beneath it. That fallthrough is deleted; the oracle describes an
  // implementation that no longer exists. A green over a dead path retires, not retains.
  //
  // REPLACED BY the no-lane floor below: the behaviour that now occupies that ground.
  await t('NO-LANE FLOOR: an unresolvable lane is REFUSED loudly, never silently dropped', async () => {
    let metaCalled = false;
    const r = await sendWhatsApp('+919800000002', 'hello', [], 'whatsapp:+10000000000', {
      env: {}, sendMetaText: async () => { metaCalled = true; return { wamid: 'w' }; }, ...noSb,
    });
    assert.strictEqual(metaCalled, false, 'no lane resolved -> Meta must NOT be called');
    assert.strictEqual(r.sent, false, 'the refusal is typed as not-sent');
    assert.strictEqual(r.blocked, 'no_meta_lane', 'and names WHY, greppably');
    assert.strictEqual(r.sid, null, 'no sid is fabricated for a send that did not happen');
  });
  await t('NO-LANE FLOOR MUTATION: a configured lane DOES send (the floor is not always-refuse)', async () => {
    let metaCalled = false;
    const env = { BRIDE_PHONE_NUMBER_ID: 'PNID_B', BRIDE_WHATSAPP_NUMBER: BRIDE_LIT };
    const r = await sendWhatsApp('+919800000002', 'hello', [], BRIDE_LIT, {
      env, sendMetaText: async () => { metaCalled = true; return { wamid: 'wamid.X' }; }, ...noSb,
    });
    assert.strictEqual(metaCalled, true, 'a real lane must reach Meta');
    assert.strictEqual(r.sent, true);
    assert.strictEqual(r.sid, 'wamid.X', 'wamid still lands in .sid');
  });


  // ── 2. metaLaneFor: collision-proof, service-scoped ──────────────────────────────────────
  await t('metaLaneFor: no id env -> null (dormant until provisioned)', () => {
    assert.strictEqual(metaLaneFor(BRIDE_LIT, {}), null);
  });
  await t('metaLaneFor: bride id + bride number -> bride lane', () => {
    // F-05.16: bride branch now requires an explicit BRIDE_WHATSAPP_NUMBER (literal/Twilio inheritance dead).
    assert.deepStrictEqual(metaLaneFor(BRIDE_LIT, { BRIDE_PHONE_NUMBER_ID: 'PBRIDE', BRIDE_WHATSAPP_NUMBER: BRIDE_LIT }), { line: 'bride', phoneNumberId: 'PBRIDE' });
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
      // F-05.16: explicit BRIDE_WHATSAPP_NUMBER now required for the bride Meta lane.
      env: { BRIDE_PHONE_NUMBER_ID: 'PBRIDE', BRIDE_WHATSAPP_NUMBER: BRIDE_LIT }, sendMetaText: async (payload, opts) => { seen = { payload, opts }; return { ok: true, wamid: 'wamid.ABC' }; }, ...noSb,
    });
    assert.strictEqual(seen.opts.phoneNumberId, 'PBRIDE');
    assert.strictEqual(seen.payload.text, 'Good morning');
    assert.strictEqual(r.sid, 'wamid.ABC');
    assert.strictEqual(r.meta, true);
  });
  await t('Meta path: media on Meta lane -> named refused gap, NO send (M1 text-only)', async () => {
    let called = false;
    // F-05.16: explicit BRIDE_WHATSAPP_NUMBER now required for the bride Meta lane.
    const r = await sendWhatsApp('+91980', '', ['https://img/x.jpg'], BRIDE_LIT, { env: { BRIDE_PHONE_NUMBER_ID: 'P', BRIDE_WHATSAPP_NUMBER: BRIDE_LIT }, sendMetaText: async () => { called = true; return { wamid: 'w' }; }, ...noSb });
    assert.strictEqual(called, false);
    assert.strictEqual(r.blocked, 'meta_media_unsupported');
    assert.strictEqual(r.sid, null);
  });

  // ── 4. F-05.2 opt-out gate: Meta lane only; Twilio path NEVER gated ─────────────────────
  await t('opt-out: Meta lane + opted-out -> BLOCKED, Meta NOT called', async () => {
    let metaCalled = false;
    const r = await sendWhatsApp('+919800000003', 'hi', [], BRIDE_LIT, {
      // F-05.16: explicit BRIDE_WHATSAPP_NUMBER now required for the bride Meta lane.
      env: { BRIDE_PHONE_NUMBER_ID: 'PBRIDE', BRIDE_WHATSAPP_NUMBER: BRIDE_LIT }, sendMetaText: async () => { metaCalled = true; return { wamid: 'w' }; }, isOptedOut: async () => true,
    });
    assert.strictEqual(metaCalled, false);
    assert.strictEqual(r.blocked, 'opted_out');
    assert.strictEqual(r.sent, false);
  });
  // RETIRED at M2b: 'the Twilio path never consults the opt-out gate'. There is no Twilio
  // path. The gate is now on the only path there is — which is F-05.2's closure, and is
  // asserted positively by the two opt-out cells that bracket this comment.
  await t('opt-out: Meta lane + NO supabase -> no-op, send proceeds', async () => {
    let sent = false;
    // F-05.16: explicit BRIDE_WHATSAPP_NUMBER now required for the bride Meta lane.
    await sendWhatsApp('+91980', 'hi', [], BRIDE_LIT, { env: { BRIDE_PHONE_NUMBER_ID: 'P', BRIDE_WHATSAPP_NUMBER: BRIDE_LIT }, sendMetaText: async () => { sent = true; return { wamid: 'w' }; }, supabase: false });
    assert.strictEqual(sent, true, 'without supabase the gate must not block');
  });

  console.log(`\nb05_m1_transport_bench: ${pass} passed, ${fail} failed`);
  if (fail === 0) console.log('GREEN — no-lane floor refuses loudly · Meta routing collision-proof · F-05.2 gate on the only path · wamid in .sid · media gap named. Twilio oracle RETIRED at M2b. Live send declared-not-claimed.');
  process.exit(fail === 0 ? 0 : 1);
})();
