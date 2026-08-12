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
// the byte. AT D-3 THEY ARE VETOED AND RESIDENT (founder relay, 2026-08-12) —
// see the constants below. The lock itself is unchanged and stays armed: it
// guards the NEXT sitting, the one that edits a byte to null or to whitespace.
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

// ── THE REDIRECT BYTES — VETOED 2026-08-12, FROZEN AT THE BYTE ─────────────
// CONDITIONAL-WITHHELD is DISCHARGED: the condition (the founder's veto)
// arrived by relay on 2026-08-12, and each null is replaced by its 「 」-frozen
// sentence. Nothing else in this file changed — the promise D-2 made about how
// these constants would land is the promise kept here.
//
// APPROVED-COPY-CARRIES-ITS-HASH. These two strings are FROZEN AT THE BYTE, not
// at the meaning. An edited comma is a FRESH VETO and may not ride a refactor;
// the bench pins both sentences character-for-character, so a well-meant tidy
// reddens rather than ships. The D-2 design note's §3 drafts (B1-B3, V1-V3) are
// HISTORICAL RECORD ONLY and were superseded whole by this veto — no draft is
// resident anywhere in this tree.
//
// ONE HOST, BOTH LANES: thedreamwedding.in, by founder ruling. The D-2 drafts
// pointed vendors at thedreamai.in on the estate's own live divergence
// (systemPrompt.js); the founder consolidated. THE STANDING RE-VETO CONDITION,
// recorded at the site it binds: IF OB-P MOUNTS THE FORM ON A SUBPATH, THESE
// BYTES RETURN TO THE FOUNDER WITH THE PATH IN THEM BEFORE ANY AMENDMENT. A
// byte carries a path only on a fresh veto — never on an executor's inference
// that the deeper link would be more helpful.
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
const BRIDE_REDIRECT_BYTE  = 'Hi! Before we start planning, head over to thedreamwedding.in, sign in and fill in the details about your wedding.';
const VENDOR_REDIRECT_BYTE = 'Hi! Before I can start working for you, I need your business details. Head over to thedreamwedding.in and set up your profile.';

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
  // Exported for the bench ONLY. At D-2 this let a cell assert the bytes were
  // still WITHHELD; at D-3 it lets a cell PIN them character-for-character. The
  // export's job did not change — it is the reason a copy ruling is mechanically
  // enforceable from outside this file.
  _REDIRECT_BYTES: { bride: BRIDE_REDIRECT_BYTE, vendor: VENDOR_REDIRECT_BYTE },
};
