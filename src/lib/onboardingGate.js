// src/lib/onboardingGate.js — THE ONBOARDING GATE. Arc OB · CE-31 · OB-D · D-2.
//
// ═══ WHAT THIS IS ═══════════════════════════════════════════════════════════
// R-OB.1 · ONE ONBOARDING DOOR, and it is the PWA form. WhatsApp does not
// capture onboarding data. R-OB.2 · NO GRACE TURNS: every message from an
// un-onboarded bride or vendor gets the redirect, and no model turn runs
// behind the gate. R-OB.3 · the redirect is MACHINERY-SPOKEN and SPENDS
// NOTHING — a fixed vetoed byte sent by code, never a model reply. An
// un-onboarded user costs zero AI rupees BY CONSTRUCTION, which is the same
// doctrine TDW_10.C sited its cap refusal on: no door, no spend.
//
// ═══ R-OB.9 · THIS SHIPS DARK ═══════════════════════════════════════════════
// The gate lands FLAG-OFF and arms only after OB-P's form is live and the
// founder flips it. The reason is not caution, it is arithmetic: R-OB.2
// forbids a model turn behind the gate, and the form is where the fields get
// filled. A gate armed before its form exists is not a strict door, it is a
// LOCKOUT — every incomplete bride and vendor pointed at a link that does not
// yet accept her answer, with no path at all. R-OB.9 exists so that window
// cannot open.
//
// The flag lives in laneFlags.js under key `onboarding.gate_enabled`, and it
// inherits that file's whole doctrine including F-08.56 (THE DEPLOY-GATE
// INVERSION: on push-deploy infrastructure a gate sequenced after the git line
// is not a gate). Push is not speak. The last act is the founder's hand.
//
// ═══ THE SECOND LOCK: COPY ══════════════════════════════════════════════════
// The redirect bytes are the FIRST SENTENCE a new person ever receives from
// the estate. They are copy, and copy ships only founder-vetoed and frozen at
// the byte. At this delivery they are UNVETOED, so THEY ARE NOT RESIDENT HERE:
// the constants below are null, and their drafts sit in the D-2 design note
// awaiting the founder's veto.
//
// The gate therefore FAILS CLOSED ON MISSING COPY — flag on plus byte null
// resolves to "do not gate", not to "gate with silence" and not to some
// placeholder. Two independent locks, and the copy lock cannot be flipped from
// admin_config: an armed flag with no vetoed sentence produces the behaviour
// of yesterday, loudly logged, rather than a stranger's first impression of
// this estate being an empty message. A byte never promises a state the
// machine does not hold; here the machine refuses to speak a byte it does not
// have.
'use strict';

const { readLaneFlag }                  = require('./laneFlags');
const { brideComplete, vendorComplete } = require('./onboardingPredicate');

const GATE_FLAG = 'onboarding.gate_enabled';

// ── THE REDIRECT BYTES — WITHHELD PENDING VETO ─────────────────────────────
// CONDITIONAL-WITHHELD, in its standing form: a block whose condition has not
// arrived ships fully commented or withheld; a runnable block never ships on
// an unresolved conditional. The condition here is the founder's veto. When it
// arrives, each null is replaced by the 「 」-frozen sentence and nothing else
// in this file changes.
//
// TWO BYTES, ONE PER LANE (CE-31 ruling ②). They are NOT the same sentence:
// the bride lane's is spoken to someone who has an account with a wedding
// behind it; the vendor lane's to someone whose account the door itself just
// provisioned.
//
// THEY DO NOT REPLACE DEAD_END_REPLY (ruling ②, SIT BESIDE). That byte names a
// DIFFERENT STATE — no account at all ("not on our invite list") — keeps every
// one of its sites including the R-OB.5-exempt circle dead-ends, and is
// untouched by this arc. Blast radius zero. Two states, two bytes.
const BRIDE_REDIRECT_BYTE  = null; // ⟵ founder veto pending · draft in D-2 design note
const VENDOR_REDIRECT_BYTE = null; // ⟵ founder veto pending · draft in D-2 design note

/**
 * Should this turn be redirected instead of served?
 *
 * Returns { gate: false } for every reason a turn may proceed — flag off, copy
 * unvetoed, account complete — and the CALLER CANNOT TELL THEM APART on
 * purpose: there is exactly one code path for "carry on", so a future reader
 * cannot accidentally branch on which not-gating reason applied.
 *
 * Returns { gate: true, byte, missing } when the turn must be redirected. The
 * byte is guaranteed non-empty; `missing` rides along for the log so the
 * founder's walk can see WHICH field held the door.
 *
 * NEVER THROWS. A gate that throws on a live turn is a door that falls off its
 * hinges: readLaneFlag already fails closed to the default (off), and the
 * predicate is pure, but the try/catch is here so that a future edit inside
 * either cannot take a bride's turn down with it.
 *
 * @param {'bride'|'vendor'} lane
 * @param {object} supabase
 * @param {{name?: string}} user
 * @param {object} row      couples row (bride lane) or vendors row (vendor lane)
 */
async function onboardingGate({ lane, supabase, user, row }) {
  try {
    const armed = await readLaneFlag(supabase, GATE_FLAG);
    if (!armed) return { gate: false };

    const byte = lane === 'bride' ? BRIDE_REDIRECT_BYTE : VENDOR_REDIRECT_BYTE;
    if (typeof byte !== 'string' || byte.trim().length === 0) {
      // ARMED WITH NO VETOED BYTE. Loud, because this is a misconfiguration a
      // human must fix, and silent-correct is how a lockout hides.
      console.warn(`[onboarding-gate] ${GATE_FLAG} is ON but the ${lane} redirect byte is unvetoed — NOT gating.`);
      return { gate: false };
    }

    const verdict = lane === 'bride'
      ? brideComplete(user, row)
      : vendorComplete(user, row);

    if (verdict.complete) return { gate: false };
    return { gate: true, byte, missing: verdict.missing };
  } catch (err) {
    console.error('[onboarding-gate] failed open:', err && err.message);
    return { gate: false };
  }
}

module.exports = {
  onboardingGate,
  GATE_FLAG,
  // Exported for the bench ONLY, so a cell can assert the bytes are still
  // withheld and redden the day one ships unvetoed.
  _REDIRECT_BYTES: { bride: BRIDE_REDIRECT_BYTE, vendor: VENDOR_REDIRECT_BYTE },
};
