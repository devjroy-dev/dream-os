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
