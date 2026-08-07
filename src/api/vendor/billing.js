// src/api/vendor/billing.js
// THE SELF-SERVE DOOR — the vendor mints and cancels her own subscription.
//   POST /api/v2/vendor/billing/subscribe   { tier }
//   POST /api/v2/vendor/billing/cancel      {}
//   POST /api/v2/vendor/billing/upgrade     { tier }
// Auth: vendor JWT (requireAuth + resolveVendor), exactly as me.js.
//
// ═════════════════════════════════════════════════════════════════════════════
// THE DISEASE THIS CURES, stated plainly so the next reader knows what was here.
// v1 shipped a REAL rail — the first Rs 2 landed — but the Subscription Link was
// minted by the founder's own hand in the Razorpay dashboard, one vendor at a
// time, and pasted into her row. Correct for night one; a wall at vendor four.
// The settings surface said so in the founder's own vetoed words:
// 「 Dev will send you a payment link. 」 That sentence is RETIRED in the same
// delivery as these routes, because a sentence describing a mechanism must not
// outlive it (RETIRE-WITH-THE-READER, F-10.73).
//
// ═════════════════════════════════════════════════════════════════════════════
// DOUBLE-DARK. Two independent doors, and NEITHER is this router's own opinion:
//   1. `billing.selfserve_enabled` — laneFlags.js, default OFF, fails closed.
//      Push is not speak (F-08.56). The founder flips it after his walk.
//   2. RazorpayNotConfiguredError — razorpaySubscriptions.js throws before any
//      socket opens if the API credential pair is unseated.
// The flag is checked FIRST and answers 503 with a typed code, so a walk done
// before the flip reads as "door shut" rather than as a Razorpay failure.
//
// WHAT THIS FILE DOES NOT DO, AND MUST NOT.
// It does not write `vendors.tier` and it does not write `vendors.billing_status`.
// Those columns move on ONE path — the webhook, through
// `tierFlip.js:applyEntitlement`, gated by `billing.tier_flip_enabled`. A cancel
// endpoint that also demoted her would be a second writer racing the webhook for
// the same row, and the two would disagree the first time an event was retried.
// The endpoints below move the SUBSCRIPTION; the consequence arrives as an event.
// (Sole-writer rider. `linkSubscription` remains the only writer of
// `razorpay_subscription_id`, and it is called here rather than reimplemented.)
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { readLaneFlag } = require('../../lib/laneFlags');
const { linkSubscription } = require('../../lib/billing/tierFlip');
const { TIER_PAISE } = require('../../lib/billing/razorpay');
const {
  createSubscription,
  cancelSubscription,
  fetchSubscription,
  isLiveStatus,
  RazorpayNotConfiguredError,
  RazorpayApiError,
} = require('../../lib/billing/razorpaySubscriptions');

const FLAG = 'billing.selfserve_enabled';

// The three payable tiers, derived from the canon's own integer map rather than
// retyped. `basic` is absent deliberately: it is the floor you fall to, not a
// thing you buy, and a tier picker that offered it would be offering to sell
// her nothing (`razorpay.js:BASE_TIER`).
const PAYABLE_TIERS = Object.freeze(Object.keys(TIER_PAISE));

async function gate(req, res) {
  const supabase = req.app.locals.supabase;
  const enabled  = await readLaneFlag(supabase, FLAG);
  if (!enabled) {
    errRes(res, 503, 'Self-serve billing is not open yet.', 'lane_disabled');
    return null;
  }
  return supabase;
}

// Provider failures answer with a shape the surface can tell apart, because
// "couldn't reach Razorpay" and "your plan already stopped" need different
// sentences on her screen and a single generic 500 cannot produce either
// (never-a-false-done, and its mirror: never a false failure).
function providerFail(res, e, fallback) {
  if (e instanceof RazorpayNotConfiguredError) {
    console.error('[billing:selfserve] not configured:', (e.missing || []).join(', '));
    return errRes(res, 503, 'Payments are not set up yet.', 'not_configured');
  }
  if (e instanceof RazorpayApiError) {
    console.error('[billing:selfserve] provider error:', e.message);
    return errRes(res, 502, fallback, 'provider_error');
  }
  console.error('[billing:selfserve] unexpected:', e && e.message);
  return errRes(res, 500, fallback, 'unexpected');
}

// ── THE MINT ────────────────────────────────────────────────────────────────
// I(a) WITH THE TERMINAL-STATUS REFINEMENT. The refusal keys on what Razorpay
// says the stored subscription IS, not on whether one is stored: a LIVE mandate
// blocks and returns the link she already has (double-tap is idempotent), a
// TERMINAL one does not block at all. Without the refinement every vendor who
// ever cancelled would be locked out of paying again, permanently — and the
// estate's own walk account is exactly that vendor.
async function mint(req, res, { tier, supabase, vendor }) {
  if (!PAYABLE_TIERS.includes(tier)) {
    return errRes(res, 400, 'Unknown plan.', 'bad_tier');
  }

  if (vendor.razorpay_subscription_id) {
    let live = null;
    try {
      const existing = await fetchSubscription({ subscriptionId: vendor.razorpay_subscription_id });
      live = isLiveStatus(existing.status);
    } catch (e) {
      // A stored id Razorpay will not talk about is not a reason to refuse her a
      // plan — but it IS a reason not to claim it is dead. Logged, treated as
      // terminal, and the mint proceeds: the alternative is a vendor who can
      // never pay because of a row she cannot see.
      console.warn('[billing:selfserve] status probe failed, treating as terminal:', e && e.message);
      live = false;
    }
    if (live) {
      return okRes(res, {
        already: true,
        subscription_id:   vendor.razorpay_subscription_id,
        subscription_link: vendor.razorpay_subscription_link || null,
      });
    }
  }

  const sub = await createSubscription({ tier, vendorId: vendor.id });
  if (!sub.id || !sub.short_url) {
    console.error('[billing:selfserve] create returned no id/short_url');
    return errRes(res, 502, 'Could not start the plan.', 'provider_error');
  }

  // Sole-writer: the id goes through tierFlip's own function. The LINK column
  // has no such carrier yet, so this route is its writer and says so — one home
  // for one column, named where it is written.
  await linkSubscription(supabase, vendor.id, sub.id);
  const { error } = await supabase.from('vendors')
    .update({ razorpay_subscription_link: sub.short_url })
    .eq('id', vendor.id);
  if (error) {
    // The subscription EXISTS at Razorpay and this estate failed to store its
    // link. Never a false done: she is told, and the id is already stored so the
    // webhook can still map her when she pays.
    console.error('[billing:selfserve] link store failed:', error.message || error);
    return errRes(res, 500, 'Plan started but the link could not be saved.', 'link_store_failed');
  }

  return okRes(res, {
    already: false,
    tier,
    subscription_id:   sub.id,
    subscription_link: sub.short_url,
  });
}

router.post('/subscribe', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = await gate(req, res);
  if (!supabase) return;
  const tier = String((req.body && req.body.tier) || '').trim().toLowerCase();
  try {
    return await mint(req, res, { tier, supabase, vendor: req.vendor });
  } catch (e) {
    return providerFail(res, e, 'Could not reach the payment provider.');
  }
}));

// ── THE CANCEL ──────────────────────────────────────────────────────────────
// F-10.89's CURE RIDES HERE AS WELL AS IN THE WEBHOOK. The stored `short_url`
// belongs to the subscription just killed, and Razorpay does not restart a
// cancelled one — so the moment cancel succeeds the link is a DEAD URL that the
// settings surface would happily render as a live button, because that surface
// shows the pay path whenever billing_status is not active, which is precisely
// the post-cancel state. Nulled here at the point of death and nulled again in
// `applyEntitlement` when the event lands, because whichever arrives first must
// leave the column safe (RETIRE-WITH-THE-READER cuts both ways: the reader
// already ships, so the data must stop being renderable).
router.post('/cancel', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = await gate(req, res);
  if (!supabase) return;
  const vendor = req.vendor;

  if (!vendor.razorpay_subscription_id) {
    return errRes(res, 400, 'There is no plan to cancel.', 'no_subscription');
  }

  try {
    await cancelSubscription({ subscriptionId: vendor.razorpay_subscription_id });
  } catch (e) {
    return providerFail(res, e, 'Could not cancel just now.');
  }

  const { error } = await supabase.from('vendors')
    .update({ razorpay_subscription_link: null })
    .eq('id', vendor.id);
  if (error) console.error('[billing:selfserve] link null failed:', error.message || error);

  // The tier does NOT move here. `subscription.cancelled` lands on the webhook
  // and `applyEntitlement` writes basic/cancelled — the machinery acceptance ②
  // requires to be left unmoved.
  return okRes(res, { cancelled: true });
}));

// ── THE UPGRADE ─────────────────────────────────────────────────────────────
// U(a), RULED: cancel-current then mint-new. One create path, the proven webhook
// flow, no new event shapes on the money rail's second night.
//
// THE SEAM IS PRICED, NOT HIDDEN. Razorpay's cancel is irreversible, so between
// the two calls there is a real window in which her old plan is dead and her new
// one does not exist. If the mint fails there, she holds no live mandate and
// falls to basic when the cancelled event lands. That state is REPORTED with its
// own code — `mint_failed_after_cancel` — so the surface can say the true
// sentence 「 Your old plan is already stopped and the new one didn't open 」
// instead of a generic failure that would invite her to assume nothing happened
// and tap again. Recovery is a re-tap, which I(a) makes safe: the cancelled
// subscription is TERMINAL and does not block a fresh mint.
//
// The native `PATCH /v1/subscriptions/:id` update surface is RECORDED as the
// available v3 arm, by name, so no future sitting rediscovers it as if it were
// new. It was invisible at the v1 ruling; re-examined at v2 the chair upheld
// cancel-then-mint on the grounds above.
router.post('/upgrade', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = await gate(req, res);
  if (!supabase) return;
  const vendor = req.vendor;
  const tier   = String((req.body && req.body.tier) || '').trim().toLowerCase();

  if (!PAYABLE_TIERS.includes(tier)) return errRes(res, 400, 'Unknown plan.', 'bad_tier');

  if (vendor.razorpay_subscription_id) {
    let live = false;
    try {
      const existing = await fetchSubscription({ subscriptionId: vendor.razorpay_subscription_id });
      live = isLiveStatus(existing.status);
    } catch (e) {
      console.warn('[billing:selfserve] upgrade probe failed:', e && e.message);
      live = false;
    }
    if (live) {
      try {
        await cancelSubscription({ subscriptionId: vendor.razorpay_subscription_id });
      } catch (e) {
        // Nothing has changed. She still holds her old plan; say so.
        return providerFail(res, e, 'Could not change the plan just now.');
      }
      const { error } = await supabase.from('vendors')
        .update({ razorpay_subscription_link: null })
        .eq('id', vendor.id);
      if (error) console.error('[billing:selfserve] link null failed:', error.message || error);
    }
  }

  try {
    return await mint(req, res, { tier, supabase, vendor: { ...vendor, razorpay_subscription_id: null } });
  } catch (e) {
    if (e instanceof RazorpayNotConfiguredError) {
      return errRes(res, 503, 'Payments are not set up yet.', 'not_configured');
    }
    console.error('[billing:selfserve] mint failed after cancel:', e && e.message);
    return errRes(
      res, 502,
      'Your old plan is already stopped and the new one did not open.',
      'mint_failed_after_cancel',
    );
  }
}));

module.exports = router;
module.exports.FLAG = FLAG;
module.exports.PAYABLE_TIERS = PAYABLE_TIERS;
