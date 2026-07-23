// scripts/b05_f0516_metalane_symmetry_bench.js
// TDW_05 — F-05.16 (CE-43) metaLaneFor SYMMETRY CURE bench.
//
// THE CURE: the bride branch requires an EXPLICIT BRIDE_WHATSAPP_NUMBER, mirroring the
// vendor branch exactly. The old `brideNum = BRIDE_WHATSAPP_NUMBER || TWILIO_WHATSAPP_NUMBER
// || 'whatsapp:+14787788550'` inheritance is dead. That inheritance was the landmine: a
// stale BRIDE_PHONE_NUMBER_ID on the VENDOR service collapsed brideNum onto the vendor
// number, fired the bride branch first, and rode every from-inferred vendor send onto the
// dead bride PNID 1131327136726341 → (#200).
//
// NON-VACUOUS / BOTH-WAYS: case (a) asserts the CURED outcome (lane=vendor) for tonight's
// exact convicted constellation. At the UNCURED origin this same constellation resolves
// lane=BRIDE (the bug) — so this file is GREEN on the cured tree and RED on the uncured
// tree, and the RED lands on exactly case (a). (Disclosed mutation transcript rides the
// handover: revert the two cured lines in src → this bench exits 1 on case (a) → restore.)
//
// No network, no creds, no supabase. Exercises the REAL metaLaneFor from whatsapp.js.
'use strict';
const assert = require('assert');
delete require.cache[require.resolve('../src/lib/whatsapp.js')];
const { metaLaneFor } = require('../src/lib/whatsapp.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

// Tonight's real values (CE-43): the vendor number was BOTH VENDOR_WHATSAPP_NUMBER and the
// process TWILIO_WHATSAPP_NUMBER; the bride literal is the number the old fallback inherited.
const VENDOR_NUM = '+917982159047';
// ── LABELED AMENDMENT · TDW_05 P4 (CE-63, Ruling №1) ────────────────────────────────────
// The literal `14787788550` below is a PROTECTED SPECIMEN, not an oversight. P4's F5 rider
// drove the dead Twilio sandbox number to grep-zero across src/** RUNTIME VALUES; the
// re-scope ratified at CE-63 NAMES four classes where it deliberately survives, and this
// fixture is one of them: the assertion beneath it EXISTS TO PROVE THE NUMBER'S ABSENCE.
// Delete the literal and the assertion stops testing anything while still reporting green —
// a vacuous cell is worse than a missing one. Do not "clean this up."
const BRIDE_NUM  = 'whatsapp:+14787788550';
const STALE_BRIDE_PNID = '1131327136726341'; // the convicted stale residue

// (a) THE CONVICTED CONSTELLATION — from-inferred send defaults to TWILIO_WHATSAPP_NUMBER
//     (= the vendor number). BRIDE_WHATSAPP_NUMBER unset, stale bride PNID present, vendor
//     fully set. CURED → vendor lane on the vendor PNID. (Origin → bride on the dead PNID.)
t('(a) tonight constellation: from-inferred vendor send -> lane=vendor (origin bug: -> bride)', () => {
  const env = {
    TWILIO_WHATSAPP_NUMBER: VENDOR_NUM,        // process default; the from is inferred from this
    BRIDE_PHONE_NUMBER_ID: STALE_BRIDE_PNID,   // stale residue on the vendor service
    // BRIDE_WHATSAPP_NUMBER intentionally UNSET — the cure makes the bride branch unreachable
    VENDOR_PHONE_NUMBER_ID: 'PVEND',
    VENDOR_WHATSAPP_NUMBER: VENDOR_NUM,
  };
  assert.deepStrictEqual(metaLaneFor(VENDOR_NUM, env), { line: 'vendor', phoneNumberId: 'PVEND' });
});

// (b) LEGITIMATE BRIDE — the real cutover constellation: explicit bride number + bride PNID,
//     from = bride number. The cure must NOT kill the real cutover.
t('(b) legit bride constellation: explicit BRIDE_WHATSAPP_NUMBER + from=bride -> lane=bride', () => {
  const env = { BRIDE_WHATSAPP_NUMBER: BRIDE_NUM, BRIDE_PHONE_NUMBER_ID: 'PBRIDE' };
  assert.deepStrictEqual(metaLaneFor(BRIDE_NUM, env), { line: 'bride', phoneNumberId: 'PBRIDE' });
});

// (c) DORMANCY — bride PNID unset: bride branch unreachable regardless of the number.
t('(c) dormancy: BRIDE_PHONE_NUMBER_ID unset -> null (bride branch unreachable)', () => {
  const env = { BRIDE_WHATSAPP_NUMBER: BRIDE_NUM }; // number set, no PNID
  assert.strictEqual(metaLaneFor(BRIDE_NUM, env), null);
});

// (d) VENDOR DISCIPLINE UNCHANGED — VENDOR_WHATSAPP_NUMBER unset: vendor branch unreachable
//     regardless of VENDOR_PHONE_NUMBER_ID. (The cure does not touch the vendor branch; this
//     pins that its pre-existing discipline is intact — and is the shape the bride now mirrors.)
t('(d) vendor discipline unchanged: VENDOR_WHATSAPP_NUMBER unset -> null (vendor branch unreachable)', () => {
  const env = { VENDOR_PHONE_NUMBER_ID: 'PVEND' }; // PNID set, no explicit number
  assert.strictEqual(metaLaneFor(VENDOR_NUM, env), null);
});

console.log(`\nb05_f0516_metalane_symmetry_bench: ${pass} passed, ${fail} failed`);
if (fail === 0) console.log('GREEN — bride branch mirrors vendor (explicit number required) · tonight\'s constellation routes vendor · legit bride cutover survives · dormancy + vendor discipline intact. RED-at-uncured-origin on (a) disclosed by mutation.');
process.exit(fail === 0 ? 0 : 1);
