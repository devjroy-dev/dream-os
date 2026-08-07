// src/lib/billing/razorpay.js
// THE PROVIDER ADAPTER — signature verification + event normalisation.
//
// ═════════════════════════════════════════════════════════════════════════════
// PATTERN-OVER-SHAPE (CE-202/203). This file deliberately does NOT invent a
// second signature idiom. `src/lib/metaInbound.js:verifyMetaSignature` has been
// verifying HMAC-SHA256 over `req.rawBody` on this service since TDW_05 M2, with
// a length pre-check and `crypto.timingSafeEqual`. The verifier below is that
// function's shape with Razorpay's header conventions substituted. Two idioms
// for one job is how one of them quietly rots.
//
// NO SDK. `razorpay` is not in package.json and is not being added: the money
// path inherits zero new dependencies. Razorpay's own SDK helper does exactly
// what node:crypto does here.
//
// ═════════════════════════════════════════════════════════════════════════════
// THE RAW-BODY LAW — READ BEFORE TOUCHING THE ROUTE
// ═════════════════════════════════════════════════════════════════════════════
// The signature is computed over the EXACT BYTES Razorpay sent. `src/index.js:103`
// already captures them estate-wide via express.json({ verify }) → req.rawBody,
// for Meta's sig. A re-serialised `JSON.stringify(req.body)` will differ by key
// order, unicode escaping or whitespace and every signature will fail — silently,
// with a handler that still runs and a 403 that looks like an attack. This is
// the single most common Razorpay integration failure and it is designed out
// here rather than commented around: verify() takes a Buffer or nothing.
'use strict';

const crypto = require('crypto');

// ── CANON, founder-verbatim (this sitting) ──────────────────────────────────
// Basic (no AI/chat) · Essential Rs 999 · Signature Rs 1,999 · Prestige Rs 2,999.
// (The canon's Free row is RENAMED basic at 0115, not duplicated — see BASE_TIER.)
//
// F-10.63: TDW_09_UIUX_FINAL:15 carried "Essential 499 / Signature 1,999 /
// Prestige 3,999" and no Free tier at all — two of three prices wrong, in
// opposite directions. Building plan definitions from the spec row would have
// put three wrong prices in the founder's dashboard. The canon wins; the spec
// line is cured in the same delivery as this file.
const TIER_PAISE = Object.freeze({
  essential:  99900,
  signature: 199900,
  prestige:  299900,
});

// Canon tier names, and the one this estate falls back to when a rail lapses.
//
// ═══ 0115 — THE CONSTANT FOLLOWS THE VOCABULARY ════════════════════════════
// This was `FREE_TIER = 'free'` until the tier sitting. The founder's ruling —
// 「 basic is free without ai and without any time bound problem 」 — made
// `basic` the canon's no-AI floor ITSELF rather than a rung above it, so the
// word `free` RETIRED instead of surviving beside `basic`. R-BILL.3's
// 「 drops to free 」 henceforth reads drops-to-basic: the destination did not
// move, its name did.
//
// THE NAME AND THE VALUE MOVE TOGETHER, DELIBERATELY. 0115 puts a CHECK of four
// words on `vendors.tier`, and `free` is not one of them. Had this constant
// kept its old value, the very next `subscription.halted` or
// `subscription.cancelled` would have driven tierFlip.js into writing a word the
// database now refuses — the money path breaking on a rename it never heard
// about. RETIRE-WITH-THE-READER (F-10.73's law) applied to a VOCABULARY: the
// constant ships in the same delivery as the constraint, or neither ships.
// Renaming the identifier too is the point — a constant called FREE_TIER holding
// 'basic' is the next reader's trap.
const BASE_TIER = 'basic';

// ── X-Razorpay-Signature verification ───────────────────────────────────────
// rawBody MUST be the exact bytes (req.rawBody). Returns false on any shape
// mismatch rather than throwing — a malformed header is a rejection, not a 500.
function verifyRazorpaySignature(rawBody, signatureHeader, secret) {
  if (!secret || !signatureHeader || rawBody == null) return false;
  const theirs = String(signatureHeader);
  // Razorpay sends a bare hex digest — no 'sha256=' prefix, unlike Meta.
  if (!/^[0-9a-f]+$/i.test(theirs)) return false;
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), 'utf8');
  const ours = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const a = Buffer.from(ours, 'utf8');
  const b = Buffer.from(theirs, 'utf8');
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch (_e) {
    return false;
  }
}

// ── tier resolution ─────────────────────────────────────────────────────────
// Plan id FIRST (env-configured from the founder's dashboard), amount as the
// fallback. Plan ids are exact and survive a price change; the amount fallback
// means a plan created before the env var is set still resolves rather than
// stranding a real payment. If NEITHER resolves, the answer is null and the
// caller writes its row and flips nothing — an unrecognised plan is not an
// excuse to guess a vendor into a tier.
function tierFromPlan(planId, amountPaise) {
  const env = {
    essential: process.env.RAZORPAY_PLAN_ESSENTIAL,
    signature: process.env.RAZORPAY_PLAN_SIGNATURE,
    prestige:  process.env.RAZORPAY_PLAN_PRESTIGE,
  };
  if (planId) {
    for (const tier of Object.keys(env)) {
      if (env[tier] && env[tier] === planId) return tier;
    }
  }
  if (typeof amountPaise === 'number') {
    for (const tier of Object.keys(TIER_PAISE)) {
      if (TIER_PAISE[tier] === amountPaise) return tier;
    }
  }
  return null;
}

// ── THE ENTITLEMENT TABLE ───────────────────────────────────────────────────
// Ratified as acceptance number 3. Every branch is here, in one readable block,
// because a flip table scattered across if-statements is a table nobody can audit.
//
//   subscription.charged        → tier from plan, billing_status 'active'
//   subscription.halted         → basic, 'halted'     (Razorpay halts only after
//                                                      its 3 retries are spent)
//   subscription.cancelled      → basic, 'cancelled'
//   subscription.completed      → basic, 'cancelled'
//                                 F-10.90's CURE. A subscription that runs out
//                                 its billing cycles has STOPPED CHARGING HER,
//                                 exactly as a cancellation has, and the estate
//                                 must treat the two the same. It did not: this
//                                 event fell to the default below — row ledgered,
//                                 tier untouched — leaving a vendor entitled to a
//                                 paid tier on a rail that would never take her
//                                 money again. Silent, permanent, and invisible
//                                 to her AND to the admin surfaces.
//
//                                 THE STATUS WORD IS A COMPROMISE AND IS NAMED AS
//                                 ONE. 0114's CHECK admits five words — none,
//                                 active, pending, halted, cancelled — and
//                                 'completed' is not among them, so writing the
//                                 semantically exact word would need a migration,
//                                 a new vendor-facing string and a founder veto.
//                                 'cancelled' is the closest TRUE word available:
//                                 her plan has ended and she is on Basic, which is
//                                 precisely what the surface then tells her. At
//                                 total_count 1200 (founder-ruled) this branch is
//                                 a hundred-year event; buying an exact vocabulary
//                                 for it with a migration would be machinery
//                                 serving a word rather than a vendor.
//
//                                 It also inherits F-10.89 for free: the
//                                 'cancelled' status is one of the two the
//                                 dead-link cure keys on, so a completed
//                                 subscription's short_url is nulled in the same
//                                 write. That is not a coincidence to rely on
//                                 silently — it is named here so a future sitting
//                                 that changes this word re-reads tierFlip.js.
//   subscription.pending        → NO TIER CHANGE, status 'pending'
//                                 THE RETRY-WINDOW MERCY (R-BILL.3): a card that
//                                 bounced once, while Razorpay is still trying,
//                                 is not a vendor to demote. Downgrading here
//                                 would be the estate punishing a vendor for a
//                                 retry window that has not closed.
//   subscription.authenticated  → NOTHING. The mandate exists; no money has
//   subscription.activated      → NOTHING. landed. Canon-basic is no-AI until
//                                 paid, so entitlement follows the CHARGE, never
//                                 the authorisation. This is also why the
//                                 auto-refunded auth payment cannot buy a tier.
//   anything else               → NOTHING. Row written, tier untouched.
function entitlementFor(event, tier) {
  switch (event) {
    case 'subscription.charged':
      return tier ? { tier, billing_status: 'active' } : { tier: null, billing_status: 'active' };
    case 'subscription.halted':
      return { tier: BASE_TIER, billing_status: 'halted' };
    case 'subscription.cancelled':
      return { tier: BASE_TIER, billing_status: 'cancelled' };
    // F-10.90. Grouped with cancelled rather than given its own arm, because
    // the estate's answer to both is identical and a second arm returning the
    // same object is a place for the two to drift apart later.
    case 'subscription.completed':
      return { tier: BASE_TIER, billing_status: 'cancelled' };
    case 'subscription.pending':
      return { tier: null, billing_status: 'pending' };
    default:
      return null;
  }
}

// ── normalisation ───────────────────────────────────────────────────────────
// Takes the verified body and the event-id header; returns the ledger row's
// fields plus the entitlement to apply. Pure: no I/O, no clock, no env beyond
// the plan-id map — which is what makes the bench able to prove every cell.
function normalizeRazorpayEvent(eventId, body) {
  const b   = (body && typeof body === 'object') ? body : {};
  const p   = (b.payload && typeof b.payload === 'object') ? b.payload : {};
  const sub = (p.subscription && p.subscription.entity) || null;
  const pay = (p.payment && p.payment.entity) || null;
  const event = typeof b.event === 'string' ? b.event : 'unknown';

  const amountPaise = pay && Number.isFinite(Number(pay.amount)) ? Number(pay.amount) : null;

  // R-BILL.4, the one rule. A captured payment on a charge event, amount > 0.
  // subscription.authenticated carries a payment entity too — the auth token
  // Razorpay refunds — and it is excluded here by event name, deliberately and
  // permanently. Everything the estate is unsure about counts as false.
  const countsAsRevenue = (
    event === 'subscription.charged' &&
    !!pay && pay.status === 'captured' &&
    typeof amountPaise === 'number' && amountPaise > 0
  );

  // R-BILL.7: the founder plants vendor_id in the Subscription Link's Notes at
  // creation. Razorpay echoes `notes` on the subscription entity in every event.
  const notes = (sub && sub.notes && typeof sub.notes === 'object') ? sub.notes : {};
  const notesVendorId = typeof notes.vendor_id === 'string' ? notes.vendor_id.trim() : null;

  const tier = tierFromPlan(sub && sub.plan_id, amountPaise);

  return {
    event_id: String(eventId),
    provider: 'razorpay',
    event,
    provider_subscription_id: (sub && sub.id) || null,
    provider_payment_id:      (pay && pay.id) || null,
    amount_paise:             amountPaise,
    currency:                 (pay && pay.currency) || null,
    counts_as_revenue:        countsAsRevenue,
    payload:                  b,
    // resolution inputs, not ledger columns
    notes_vendor_id:          notesVendorId,
    tier,
    entitlement:              entitlementFor(event, tier),
  };
}

module.exports = {
  verifyRazorpaySignature,
  normalizeRazorpayEvent,
  entitlementFor,
  tierFromPlan,
  TIER_PAISE,
  BASE_TIER,
};
