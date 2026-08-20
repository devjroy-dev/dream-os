// src/lib/laneFlags.js — LANE-ENABLE FLAGS. F-08.56's cure, made mechanical.
//
// ═══ THE LAW THIS FILE EXISTS FOR ════════════════════════════════════════════
// F-08.56 — THE DEPLOY-GATE INVERSION: on push-deploy infrastructure, a gate
// sequenced AFTER the git line is not a gate. The founder pushes and the code
// speaks in the same act, so "we'll flip it on after the walk" describes an
// order the machinery cannot honour. EVERY MODEL-FACING LANE SHIPS BEHIND A
// LANE-ENABLE FLAG, so that PUSH is not SPEAK and the last act belongs to the
// founder's hand rather than to Railway's build queue.
//
// (F-08.56 was minted in chat at the Phase 3 build seal and never filed; CE-188
// swept it and recorded the address as RESERVED AND EMPTY so no future sitting
// would reuse it. The omnibus ruling filed the content and authorised this
// citation. Named ONCE, here, at the mechanism's own site, per F-06.85's
// standing law: a sentence conditioned on a mechanical fact names the mechanism
// in-comment, so the mechanism's next sitting is forced to re-read the sentence.)
//
// ═══ THE SHAPE ══════════════════════════════════════════════════════════════
// `admin_config.value` is TEXT (D7), so the parse is defensive exactly as
// `modelRouter.js:119-124` and `prospects.js:66-79` do it — any junk falls to
// the default rather than throwing on a live turn.
//
// FAILS CLOSED, AND THAT IS DELIBERATE. An absent key, an unreachable database,
// a malformed value: all resolve to the flag's default, and every lane-enable
// flag's default is OFF. This is the opposite of the turn-side guards
// (`closerEngine`'s registered-user check fails OPEN because a human already
// spoke and silence is the ruder failure). Nothing is waiting on a lane-enable
// read: the lane simply keeps doing what it did yesterday. The cost of a
// false OFF is a delayed launch; the cost of a false ON is an unwitnessed
// persona reaching real couples. Those are not symmetric.
//
// 60-second in-process cache, mirroring modelRouter's window, so a flip lands
// within one cache window and no deploy — the same 60-second doctrine the
// marketing lane's model route already runs on.
'use strict';

const CACHE_MS = 60_000;
const cache = new Map(); // key -> { at, val }

// Every lane-enable flag in the estate, with its default. A flag not listed
// here is not a lane-enable flag: the map is the census, so a future reader can
// see every gated lane in one place instead of grepping for string literals.
const LANE_FLAGS = {
  // TDW_08 P5 Phase 4 — ELIZA, the couple concierge on a vendor's line.
  // OFF at 0112. The flip is the founder's hand and the arc's last act.
  'couple.eliza_enabled': false,

  // TDW_08 P5 RIDER — the out-of-window enquiry-alert fallback (F-08.85, CE R-R6).
  // OFF at birth. Push is not speak: the door catches 131047 and ledgers the miss
  // from the moment it ships, but it sends NO template until the founder flips this
  // after his walk. The dial that picks WHICH template is
  // `vendor.enquiry_alert_oow_template` (enquiryAlert.js) — a dial is not a gate,
  // and the gate is here.
  'vendor.enquiry_alert_oow_enabled': false,

  // TDW_10 THE BILLING SITTING — the Razorpay tier flip (R-BILL.9, F-10.22).
  // OFF at 0114. The asymmetry inside the money path is deliberate and is
  // documented at its mechanism in src/lib/billing/tierFlip.js: the LEDGER is
  // NOT gated (every verified event is written from the moment the route
  // deploys, because a missed money row is unrecoverable), but the ENTITLEMENT
  // is (a tier moving on an unwalked rail is not). Push is not speak, and here
  // the two halves of the same webhook sit on opposite sides of that line.
  'billing.tier_flip_enabled': false,

  // TDW_10 BILLING v2 — THE SELF-SERVE DOOR (vendor mints/cancels her own
  // subscription; src/api/vendor/billing.js). OFF at birth.
  //
  // THIS IS THE SECOND OF TWO INDEPENDENT DOORS, and the split is deliberate.
  // The other is `RazorpayNotConfiguredError`, thrown in
  // src/lib/billing/razorpaySubscriptions.js before any socket opens when the
  // API credential pair is unseated. Credentials are an ACCIDENT of deployment
  // — they arrive when the founder saves them — and an accident is not a
  // ruling. This flag is the ruling: even fully credentialed, no vendor can
  // mint until the founder's hand flips it after his walk. Push is not speak.
  //
  // NOTE THE ASYMMETRY WITH ITS SIBLING ABOVE, which gates only the ENTITLEMENT
  // half of the webhook while the ledger writes regardless. There is no such
  // split here, because there is no half of "create a real subscription at a
  // payment provider" that is safe to do early. The two flags are independent:
  // this one open with tier_flip shut means she can pay and her tier waits.
  'billing.selfserve_enabled': false,

  // ARC OB (THE ONBOARDING OS, CE-31) — THE ONBOARDING GATE at both WhatsApp
  // doors. OFF at 0122, and R-OB.9 is why it had to be: R-OB.2 forbids a model
  // turn behind the gate, so arming it before OB-P's form was live would not
  // have made the door strict, it would have made it a LOCKOUT — every
  // incomplete bride and vendor redirected to a form that could not yet take
  // her answer, with no path at all. The order was absolute: gate dark here ->
  // form live -> founder arms -> the conversational onboarding retirements land.
  //
  // ── F-OB.17 · THIS PARAGRAPH USED TO SAY "TWO LOCKS". IT WAS ONE. ──────────
  // The superseded text claimed a second lock — the redirect copy, "null until
  // vetoed". THAT CONDITION DISCHARGED ON 2026-08-12. Both bytes are vetoed and
  // FROZEN AT THE BYTE in src/lib/onboardingGate.js:48-52,:78-79, and
  // bOB_d2_onboarding_gate_bench.js pins them character-for-character. The
  // sentence outlived the state it described.
  //
  // IT DID REAL DAMAGE, WHICH IS WHY THE CORRECTION IS RECORDED AND NOT JUST
  // MADE. An executor seat read THIS comment instead of onboardingGate.js at
  // its own site, and reported a two-lock gate to the chair FOUR TIMES across
  // an audit and two handovers — mispricing fork (b) as twice as far away as it
  // was. A comment in one file describing the contents of another is a claim,
  // not a witness. If the reader needs the copy's state, the copy's file is two
  // seconds away.
  //
  // ── WHERE THIS FLAG IS ARMED, AND WHY NOT HERE [R-35.17] ──────────────────
  // THE DEFAULT ON THIS LINE STAYS `false`, AND CHANGING IT IS NOT HOW THIS
  // GATE IS TURNED ON. `readLaneFlag` below consults `admin_config` FIRST and
  // falls back to this literal only when the key is absent or unreadable, so
  // editing it would arm BOTH DOORS the moment Railway finished a build —
  // making the build queue the arming hand. That is F-08.56 exactly, the
  // inversion this file's opening law exists to prevent, and a charter that
  // named this line as the edit site was halted at that law rather than obeyed
  // (CE-222; the chair owned it as c-35.9).
  //
  // ARM IT WITH ONE `admin_config` ROW, BY HAND, AFTER THE PUSH — it lands
  // within the 60-second cache window above and needs no deploy, which is the
  // estate's own doctrine at three committed sites (src/agent/engine.js:280,
  // src/lib/billing/tierFlip.js:22, src/api/vendor-engine/chat.js:2757). The
  // founder holds the disarm row in the same hand.
  //
  // ONE FLAG, TWO DOORS — derived, not assumed: `onboardingGate` has exactly
  // two callers, src/lib/brideInbound.js:418 and src/lib/vendorInbound.js:292.
  // The lanes are NOT symmetric in cost: brideComplete gates on two fields,
  // vendorComplete on six. Arming redirects incomplete vendors on any one of
  // them. The founder ruled BOTH DOORS on 2026-08-20 with both population
  // counts on his glass.
  'onboarding.gate_enabled': false,
};

function _resetLaneFlagCache() { cache.clear(); }

/**
 * Read a lane-enable flag. Returns a boolean, always — never throws, never
 * returns undefined, and never returns true by accident.
 */
async function readLaneFlag(supabase, key) {
  const fallback = Object.prototype.hasOwnProperty.call(LANE_FLAGS, key)
    ? LANE_FLAGS[key]
    : false;

  if (!supabase) return fallback;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.val;

  let val = fallback;
  try {
    const { data } = await supabase
      .from('admin_config').select('value').eq('key', key).maybeSingle();
    if (data && data.value != null) {
      // JSON-in-text: 'true' -> true. Anything that is not exactly boolean true
      // after parsing leaves the flag at its default — a value of "yes", "1" or
      // "on" is a typo in a safety switch, not an instruction to open a lane.
      const parsed = JSON.parse(String(data.value));
      val = parsed === true;
    }
  } catch (_e) {
    // Unreachable DB or malformed value. The lane keeps yesterday's behaviour.
    val = fallback;
  }

  cache.set(key, { at: Date.now(), val });
  return val;
}

module.exports = { readLaneFlag, LANE_FLAGS, _resetLaneFlagCache };
