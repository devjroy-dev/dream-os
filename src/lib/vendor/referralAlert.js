// src/lib/vendor/referralAlert.js
// BLOCK 19 G5.1 SITTING 2 — R-G51.15. THE PEER IS TOLD.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS: THE ROOM WAS HONEST AND QUIET
// ═══════════════════════════════════════════════════════════════════════════
// Sitting 1 shipped the forward, the record, the stamps and the room, and told
// the peer NOTHING. She learned she had been handed work by opening the app, or
// never. The sitting-1 handover §11.5 named it as the sitting that makes the
// room worth opening, and this is it.
//
// ── ONE HOME, AND IT IS THE ONLY ONE ───────────────────────────────────────
// `.from('referral_alerts')` appears in THIS FILE and nowhere else in src/ —
// writes AND reads, which is why `toldByReferralIds` lives here rather than in
// `referrals.js` where its caller is. A bench cell asserts the count is one
// file. Splitting the read out would have been the shorter diff and the wrong
// shape: two files naming a table is how a second writer eventually appears in
// the one that was only ever supposed to read.
//
// ── THE SHAPE IS `weddingLeadAlert.js`'s, DELIBERATELY ─────────────────────
// Named template constant, never a literal at the call site · a row for EVERY
// outcome including the failures · `sendWa`'s opt-out gate not reimplemented
// here · the phone read from `public.users` via `vendors.user_id`, because
// `public.vendors` carries no phone column at all. Copying that file's shape is
// the point: two notification paths that disagree about what a vendor is told
// is how the estate learns one of them was wrong months later.
'use strict';

const { sendWa } = require('../sendWa');
const VENDOR_LEADS_URL = require('../pwaPaths').vendorUrl('leadsList');

/**
 * ── THE TEMPLATE ───────────────────────────────────────────────────────────
 * UTILITY, and that is a derivation rather than a preference. F-40.176 is the
 * specimen: on the R-40.72 walk Meta silently dropped Swati's MARKETING alert
 * with `131049`, the marketing throttle, because she had not messaged us
 * recently — while Dev Roy's arrived, because he had. A referral alert is
 * transactional (something just happened on the peer's own account), so Utility
 * is the honest classification and not a category dodge; and the vendors a
 * MARKETING alert would fail are precisely the quiet ones this feature exists
 * to reach.
 *
 * A named constant rather than a literal at the call site, so a re-point is one
 * line with one cell guarding it instead of a grep (R-40.72's own lesson, and
 * the reason 0142 stores `template_key` per row).
 */
const TEMPLATE_KEY = 'referral_alert';

/**
 * ── THE FLAG ───────────────────────────────────────────────────────────────
 * Two gates stand between this file and a real handset, and BOTH must open:
 *   1. `REFERRAL_ALERT_SEND_ENABLED` — unset in every environment today.
 *   2. `sendWa`'s own `isApproved(templateKey)`, which reads the registry —
 *      `referral_alert` ships `status: 'pending'` until Meta returns Active.
 * Named separately because they fail for different reasons and a walk must be
 * able to say which one refused. `reviewAsk.js:56` and `paymentReminders.js:81`
 * are the two precedents and this is their shape.
 */
function sendGate() {
  const flagOn = String(process.env.REFERRAL_ALERT_SEND_ENABLED || '') === '1';
  return {
    on: flagOn,
    reason: flagOn ? null : 'REFERRAL_ALERT_SEND_ENABLED is not set',
  };
}

/**
 * ── THE ROW IS WRITTEN FOR EVERY OUTCOME, NOT JUST THE GOOD ONE ────────────
 * F-40.177's law, taken here the first time rather than after a walk. A room
 * can never say 「told」 about a thing it did not write down, and an `opted_out`
 * row is the ONLY durable evidence that a peer was skipped lawfully rather than
 * missed.
 *
 * Never throws. A bookkeeping failure must not cost the peer her alert or the
 * sender her forward — both have already happened by the time this runs.
 */
async function recordAlert(supabase, row) {
  if (!supabase) return;
  try {
    await supabase.from('referral_alerts').insert(row);
  } catch (e) {
    // Named, not swallowed. F-06.143's lesson: an unrecorded failure to record
    // is how three days of dead notifications stayed invisible.
    console.warn('[referralAlert:record] insert failed:', e && e.message);
  }
}

/**
 * Tell one peer about one forward.
 *
 * ⚠ CALLED AFTER THE REFERRAL ROW IS WRITTEN, NEVER BEFORE, AND NEVER INSIDE
 * ITS SUCCESS PATH'S RETURN. The lead and the record are the durable half; the
 * message is the courtesy. If everything below throws, the peer still HAS the
 * enquiry and the sender's room still says she sent it.
 *
 * ⚠ AND IT NEVER THROWS OUTWARD. `forwardLead` returns `ok: true` the moment
 * the record lands; an alert that failed must not turn a successful forward
 * into a refusal on the sender's glass. That would be a false-NOT-done, which
 * is the same family of lie as F-40.84's false-done and just as forbidden.
 *
 * @returns {{sent: boolean, reason: string|null, wamid: string|null}}
 */
async function alertPeerOfReferral(supabase, { referralId, toVendorId, referrerName }) {
  const gate = sendGate();
  if (!gate.on) {
    // ⚠ NO ROW WHEN THE FLAG IS DOWN, and this is the one deliberate asymmetry
    // with `weddingLeadAlert`. A dark flag is not an outcome of a send — it is
    // the absence of one. Writing `status: 'flag_off'` rows would fill the
    // table with evidence of a decision the ESTATE made about the whole
    // feature, not about this peer, and would make the first day of real
    // sending look like a spike of failures. The refusal is logged instead.
    console.log(`[referralAlert] held: ${gate.reason} (referral ${referralId})`);
    return { sent: false, reason: 'flag_off', wamid: null };
  }

  // WHO SHE IS AND WHERE SHE IS REACHABLE. Two reads, never one per row —
  // `public.vendors` carries NO phone column (PUBLIC_SCHEMA.md:1198+, 49
  // columns), so a vendor is reachable through `public.users.phone` via
  // `user_id`. `weddingLeadAlert.js:231-237` and `enquire.js` both rely on the
  // same fact.
  const { data: vendor } = await supabase
    .from('vendors').select('id, user_id, business_name').eq('id', toVendorId).maybeSingle();
  const { data: user } = vendor && vendor.user_id
    ? await supabase.from('users').select('id, phone').eq('id', vendor.user_id).maybeSingle()
    : { data: null };
  const userPhone = user && user.phone;

  if (!userPhone) {
    await recordAlert(supabase, {
      referral_id: referralId, to_vendor_id: toVendorId,
      template_key: TEMPLATE_KEY, wamid: null, status: 'no_phone',
    });
    // Not an error — a fact about that account. The forward has already landed
    // and refusing here would undo nothing and help nobody.
    return { sent: false, reason: 'no_phone', wamid: null };
  }

  try {
    const out = await sendWa({
      line: 'vendor',
      to: userPhone,
      templateKey: TEMPLATE_KEY,
      // Positional, in the registry's declared order:
      //   {{1}} the PEER'S OWN business name — never the couple's, never the
      //         referrer's; it is her greeting.
      //   {{2}} the REFERRER'S business name, read off the sender's vendor row
      //         by the caller and never off a request body (`forwardLead` takes
      //         the same posture for `referrer_name` — a name the client could
      //         set would be a forgery surface).
      //   {{3}} her LEADS link, because the work is on her Leads and not in the
      //         Referrals room — `lead_alert_utility`'s own precedent.
      // THE COUPLE APPEARS IN NONE OF THEM, by ruling.
      vars: [vendor.business_name || 'there', referrerName || 'A peer', VENDOR_LEADS_URL],
      // Declared explicitly though `sendWa.js:193` treats an absent value the
      // same way ("absent ⇒ pre-cure behaviour"). It is a no-op TODAY and it is
      // written because a reader must not have to derive that: this is a
      // Utility notice about work that arrived, not a nudge, and it must never
      // be silenced by a vendor who paused MORNING messages.
      nudgeClass: false,
      supabase,
    });

    // ── THE WAMID LIVES AT `out.result.wamid` — F-40.210 ───────────────────
    // Traced by command, Meta outward: metaCloud.js -> { ok, wamid, raw };
    // sendWa.js:252 -> { sent, mode, key, from, to, payload, RESULT: res }. So
    // the id is one level down. Every `lead_alerts` row on the 2026-09-07 walk
    // held `wamid: null` because a sibling read `out.wamid`, which does not
    // exist — the messages arrived and the bookkeeping did not, and the whole
    // point of that table never worked. Fallbacks kept, real-first, so a shape
    // change upstream degrades to a null rather than to a silent wrong.
    const wamid = (out && (
      (out.result && out.result.wamid)
      || out.wamid
      || (out.messages && out.messages[0] && out.messages[0].id)
    )) || null;

    await recordAlert(supabase, {
      referral_id: referralId, to_vendor_id: toVendorId,
      template_key: TEMPLATE_KEY, wamid, status: 'sent',
    });

    // R-40.92 · the send names its recipient and its wamid. `sendWa.js:251`
    // already logs the bare number, the key and the wamid at the dispatch seam;
    // this line adds the two facts that file cannot know — WHICH FORWARD and
    // WHICH VENDOR — so a walk can join a handset to a row without a query.
    // The couple is not in it, and neither is the body.
    console.log(`[referralAlert] referral ${referralId} -> vendor ${toVendorId} (${wamid})`);

    return { sent: true, reason: null, wamid };
  } catch (e) {
    // ⚠ CLASSIFIED, NOT SWALLOWED. An opted-out peer is a LAWFUL outcome and
    // reads as `opted_out`, not as a failure; a log that calls it an error
    // trains an operator to ignore the line. Everything else keeps its own code
    // so a walk can name what happened rather than guess.
    const reason = (e && e.name === 'WaOptedOutError') ? 'opted_out'
                 : (e && (e.code || e.name)) || 'send_failed';
    await recordAlert(supabase, {
      referral_id: referralId, to_vendor_id: toVendorId,
      template_key: TEMPLATE_KEY, wamid: null, status: reason,
      error_code:  (e && e.code)    ? String(e.code) : null,
      error_title: (e && e.message) ? String(e.message).slice(0, 200) : null,
    });
    return { sent: false, reason, wamid: null };
  }
}

/**
 * THE 「Told」 READ. Given the forwards on a page of leads, which of them landed.
 *
 * ⚠ IT READS A `wamid`, AND SINCE F-40.226 IT ALSO READS THE RECEIPT. The wamid
 * is the field Meta's own status webhook correlates against, which is why 0142
 * indexes it and makes it unique where present. A row with `status: 'sent'` and
 * a null wamid is NOT told: that is the F-40.210 state where the message may
 * well have arrived and the estate cannot prove it, and a surface claiming proof
 * it does not have is worse than one that stays quiet.
 *
 * AND A ROW WHOSE RECEIPT SAYS `failed` IS NO LONGER TOLD EITHER. That is a
 * NEW capability rather than a tightening: before the router had an arm for this
 * table, `status` could never move off `sent`, so a wamid was the most the
 * estate could know. Now Meta can retract, and 「Told」 retracts with it.
 *
 * Returns a Set of referral ids. A Set and not a Map because the surface asks
 * one question — did this land — and a richer return would invite a second
 * surface to render the status vocabulary, which is operator language and not
 * the vendor's.
 *
 * ⚠ A FAILED READ COSTS THE STATE, NEVER THE ROW. The stamp is decoration on a
 * lead record; `referralStampsForLeads` takes the same posture one level up and
 * `roster.js`'s `tolerate` is where both learned it.
 */
async function toldByReferralIds(supabase, referralIds) {
  const ids = [...new Set((referralIds || []).filter(Boolean))];
  if (ids.length === 0) return new Set();

  // ⚠ A WAMID IS NO LONGER SUFFICIENT — F-40.226's ruling.
  // Until the receipt router had an arm for this table, `status` was frozen at
  // `sent` forever and a wamid was the best proof obtainable. It is not any
  // more: `relayStatus.js` now advances this column, so Meta can come back and
  // say `failed` about a message it once accepted.
  //
  // A wamid whose receipt says FAILED IS NOT PROOF. Leaving 「Told」 lit on such a
  // row would be the estate claiming a delivery Meta has retracted — the exact
  // false-done that 「Told」 was built to refuse, arriving through the back door
  // three days after the send. So the state RETREATS: a lead that read 「Told」
  // stops reading it the moment a failure receipt lands.
  //
  // ⚠ AND THE LIST IS `failed` ALONE, NOT AN ALLOW-LIST OF GOOD STATUSES.
  // Meta's vocabulary grows, and a `.in('status', ['sent','delivered','read'])`
  // would silently un-tell every forward the day a new terminal status appears —
  // reading an UNKNOWN status as a failure. Only a status the estate positively
  // knows to mean failure removes the word; anything unrecognised leaves it,
  // because the wamid is still real and the send still happened.
  const { data, error } = await supabase
    .from('referral_alerts')
    .select('referral_id')
    .in('referral_id', ids)
    .not('wamid', 'is', null)
    .neq('status', 'failed');

  if (error) {
    console.warn(`[referralAlert:told] unavailable: ${error.message}`);
    return new Set();
  }
  return new Set((data || []).map(r => r.referral_id));
}

module.exports = {
  alertPeerOfReferral,
  toldByReferralIds,
  // Exported for the bench: the gate and the key are facts cells assert
  // against, and a cell that re-declares them has stopped testing this file.
  recordAlert,
  sendGate,
  TEMPLATE_KEY,
};
