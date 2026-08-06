// src/lib/billing/tierFlip.js
// THE ONE FLIP PATH — the only code in this estate that moves a vendor's tier
// on the strength of money.
//
// ═════════════════════════════════════════════════════════════════════════════
// ONE FLIP PATH, TWO FEEDERS (TDW_11_NATIVE_VENDOR_FINAL:59-60)
// ═════════════════════════════════════════════════════════════════════════════
// The native block's design is explicit: RevenueCat's webhook will call the SAME
// flip function this Razorpay webhook calls. That is why `applyEntitlement`
// takes a provider-agnostic shape — a tier, a billing_status, and the event id
// that authorised the move — and knows nothing about Razorpay. When the second
// feeder lands it adds a caller, not a branch. This file is the first feeder's
// half of that dependency, built to be joined rather than rewritten.
//
// ═════════════════════════════════════════════════════════════════════════════
// PUSH IS NOT SPEAK — the lane-enable flag (F-08.56's law)
// ═════════════════════════════════════════════════════════════════════════════
// `billing.tier_flip_enabled` defaults OFF, in src/lib/laneFlags.js, fails
// closed on an unreachable database. From the moment this deploys, the webhook
// verifies and LEDGERS every event — the money truth-table starts telling the
// truth immediately, which is the point of the sitting. But no vendor's tier
// moves until the founder turns the admin_config key with his own hand.
//
// The asymmetry is deliberate and it runs the same direction as every other
// lane flag in the estate: the cost of a false OFF is a tier that lands one
// cache-window late and a founder who flips a key; the cost of a false ON is a
// live vendor's entitlement changing on an untested rail. Those are not
// symmetric, and the ledger — the part that must never miss an event — is
// deliberately NOT behind the flag.
//
// ═════════════════════════════════════════════════════════════════════════════
// WHAT THIS FILE DOES NOT DO — F-10.41 is adjacent, not ours
// ═════════════════════════════════════════════════════════════════════════════
// It writes a tier NAME. It does not enforce a capability. Tier-wise AI caps are
// F-10.41's own W-1-gated sitting; the flip must not foreclose it and does not
// touch it. And per R-BILL.3's precision: legacy `tier = 'trial'` rows are left
// BYTE-UNTOUCHED unless a payment event arrives for that vendor. Nothing shipped
// here cuts a live trial vendor's AI, because nothing here reads a tier at all.
// The trial-vs-Free semantic remains the rename sitting's founder question.
'use strict';

const { readLaneFlag } = require('../laneFlags');

const FLAG = 'billing.tier_flip_enabled';

// Canon vocabulary. The flip writes ONLY these words. Legacy values already in
// the column ('trial') are tolerated on read by everything else in the estate
// and are never written by this file — R-BILL.3.
const CANON_TIERS = Object.freeze(['free', 'essential', 'signature', 'prestige']);

/**
 * Link a provider subscription to a vendor. NOT an entitlement — a mapping.
 *
 * Deliberately OUTSIDE the lane flag. Recording that subscription sub_XYZ
 * belongs to vendor V grants that vendor nothing; it is bookkeeping, and the map
 * is not the territory. Keeping it outside means that when the founder flips the
 * flag on, the links are already in place and the next charge resolves on the
 * fast path instead of re-reading notes.
 */
async function linkSubscription(supabase, vendorId, subscriptionId) {
  if (!supabase || !vendorId || !subscriptionId) return { linked: false, reason: 'incomplete' };
  const { error } = await supabase.from('vendors')
    .update({ razorpay_subscription_id: subscriptionId })
    .eq('id', vendorId);
  if (error) return { linked: false, reason: error.message || String(error) };
  return { linked: true };
}

/**
 * Resolve a verified event to a vendor id.
 *
 * Fast path first: the subscription id, once linked. Then the Notes the founder
 * planted at link creation (R-BILL.7). If neither resolves, returns null and the
 * caller ledgers an orphan row rather than guessing — see billing_events'
 * nullable vendor_id and its comment.
 */
async function resolveVendor(supabase, { subscriptionId, notesVendorId }) {
  if (!supabase) return null;
  if (subscriptionId) {
    const { data } = await supabase.from('vendors')
      .select('id').eq('razorpay_subscription_id', subscriptionId).maybeSingle();
    if (data && data.id) return data.id;
  }
  if (notesVendorId) {
    const { data } = await supabase.from('vendors')
      .select('id').eq('id', notesVendorId).maybeSingle();
    if (data && data.id) return data.id;
  }
  return null;
}

/**
 * THE FLIP. Provider-agnostic by design (see the two-feeders note above).
 *
 * @param entitlement {{ tier: string|null, billing_status: string }}
 *        tier === null means "move the status, leave the tier alone" — the
 *        retry-window mercy's shape (subscription.pending), and also the shape
 *        of a charge whose plan this estate could not identify.
 *
 * Returns { flipped, reason?, wrote? } — never throws, because a flip failure
 * must not turn into a 500 on a webhook that has already been ledgered and
 * acknowledged.
 */
async function applyEntitlement(supabase, { vendorId, entitlement, provider, eventId }) {
  if (!supabase || !vendorId || !entitlement) {
    return { flipped: false, reason: 'incomplete' };
  }

  const enabled = await readLaneFlag(supabase, FLAG);
  if (!enabled) {
    // Not a failure. The event is already ledgered; the tier simply waits for
    // the founder's hand. Logged so the walk can see the gate holding.
    console.log(`[billing:flip] lane disabled — ledgered, not flipped (event ${eventId}, vendor ${vendorId})`);
    return { flipped: false, reason: 'lane_disabled' };
  }

  const patch = {};
  if (entitlement.tier) {
    if (!CANON_TIERS.includes(entitlement.tier)) {
      // A tier word outside canon is a bug in the caller, not an instruction.
      console.warn(`[billing:flip] refusing non-canon tier "${entitlement.tier}" (event ${eventId})`);
      return { flipped: false, reason: 'non_canon_tier' };
    }
    patch.tier = entitlement.tier;
  }
  if (entitlement.billing_status) patch.billing_status = entitlement.billing_status;

  if (!Object.keys(patch).length) return { flipped: false, reason: 'nothing_to_write' };

  const { error } = await supabase.from('vendors').update(patch).eq('id', vendorId);
  if (error) {
    console.error(`[billing:flip] write failed (event ${eventId}):`, error.message || error);
    return { flipped: false, reason: 'write_failed' };
  }

  console.log(`[billing:flip] ${provider} ${eventId} → vendor ${vendorId} ${JSON.stringify(patch)}`);
  return { flipped: true, wrote: patch };
}

module.exports = {
  applyEntitlement,
  linkSubscription,
  resolveVendor,
  CANON_TIERS,
  FLAG,
};
