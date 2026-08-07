// src/lib/billing/razorpaySubscriptions.js
// THE OUTBOUND ADAPTER — create / cancel / fetch a Razorpay Subscription.
//
// ═════════════════════════════════════════════════════════════════════════════
// PATTERN-OVER-SHAPE, AGAIN AND FOR THE SAME REASON (CE-202/203).
// `razorpay.js` is the INBOUND half of this rail and its header states the law:
// this estate does not invent a second idiom for a job it already does. That
// file borrowed metaInbound.js's verifier shape. This one borrows
// `src/lib/metaCloud.js:postMessage`'s OUTBOUND shape — injectable `fetchImpl`,
// a typed not-configured error thrown BEFORE the call, defensive JSON parse,
// a typed send error carrying provider status and body. Read metaCloud.js:66-95
// beside this and the correspondence is deliberate, line for line.
//
// NO SDK. `razorpay` is not in package.json and is not being added. v1 added
// zero dependencies to the money path and v2 adds zero. Razorpay's Node client
// wraps exactly the two HTTPS calls below; taking the dependency would buy a
// retry policy this estate has not ruled and a version surface it would have to
// watch, in exchange for syntax.
//
// ═════════════════════════════════════════════════════════════════════════════
// AUTH — HTTP BASIC, AND THE CREDENTIAL IS NOT THE WEBHOOK SECRET
// ═════════════════════════════════════════════════════════════════════════════
// Razorpay's REST API authenticates with `key_id:key_secret` over HTTP Basic.
// That pair is DIFFERENT from `RAZORPAY_WEBHOOK_SECRET`, which v1 seated and
// which signs INBOUND events only. They come from different dashboard pages and
// neither can stand in for the other. The read-first derived that the outbound
// pair was absent from the service at charter; the founder seats it by name.
//
// DOUBLE-DARK, AND THIS FILE IS THE FIRST OF THE TWO DOORS.
// Door one is here: absent creds throw RazorpayNotConfiguredError BEFORE any
// socket opens, so an unseated estate fails loudly at the door rather than
// POSTing to Razorpay with an empty Authorization header and reading a 401 as
// if it were a product state. Door two is `billing.selfserve_enabled` in
// laneFlags.js, checked by the route above this. Either one shut means no
// vendor can mint. (F-06.85: this sentence is conditioned on the flag's
// existence, so the flag's mechanism is named here at its own consequence.)
'use strict';

const API_ROOT = 'https://api.razorpay.com/v1';

class RazorpayNotConfiguredError extends Error {
  constructor(missing) {
    super('razorpay api credentials not configured');
    this.name = 'RazorpayNotConfiguredError';
    this.code = 'not_configured';
    this.missing = missing || [];
  }
}

class RazorpayApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'RazorpayApiError';
    this.code = 'provider_error';
    this.status = status;
    this.body = body;
  }
}

// ── THE BILLING-CYCLE COUNT — FOUNDER-RULED 2026-08-07 ──────────────────────
//
// RULED: 1200. The founder's word, given after the contradiction below was put
// to him plainly. This constant is no longer an executor recommendation and this
// comment no longer says it is — a comment that keeps calling a ruled value
// provisional is the next reader's trap, and correcting it is the same law that
// retires a sentence with its mechanism.
//
// THE CONTRADICTION IT RESOLVES, kept on the record because the next sitting
// should know this numeral was contested rather than defaulted. CE relay #2
// ruled 「 total_count goes to the founder. Do not default it. 」 Relay #3 then
// ruled 「 build everything now 」 without carrying the numeral, and `total_count`
// is mandatory on create — so the build seated 1200 as a DISCLOSED
// recommendation, named the contradiction in this comment, and carried it to the
// founder as resume-card item 0. He ruled it. The disclosure did its job and is
// now history rather than a caveat.
//
// WHY 1200. Razorpay's two surfaces disagree on the ceiling — the API reference
// says subscriptions are supported to a maximum of 100 years; the dashboard guide
// says 30 and then computes its monthly formula to 1200, a figure that only
// reconciles with 100. 1200 monthly cycles is the numeral both pages land on and
// it means, in practice, UNTIL SHE CANCELS — which is what the surface already
// promises her in the vetoed line 「 Cancel any time from the app. 」 A small count
// would make that sentence a lie on a timer. If Razorpay ever rejects it, the
// create fails loudly with a 400 on the first tap; the fallback is 360.
//
// AND IT IS WHY F-10.90 EXISTS. A finite count ends in `subscription.completed`,
// which `razorpay.js:entitlementFor` does not handle — it falls to the default,
// ledgers the row, and leaves her tier standing on a rail that has stopped
// charging. At 1200 that is a hundred-year problem and out of a rails sitting's
// scope; at 12 it would be a twelve-month one. The number and the finding are
// the same fact seen from two ends, which is why they are commented together.
const TOTAL_COUNT_MONTHLY = 1200;

function resolveCreds(overrides = {}) {
  const keyId     = overrides.keyId     || process.env.RAZORPAY_KEY_ID     || '';
  const keySecret = overrides.keySecret || process.env.RAZORPAY_KEY_SECRET || '';
  return { keyId, keySecret };
}

// ── THE PLAN MAP ────────────────────────────────────────────────────────────
// ONE HOME, and it is the one that already exists. `razorpay.js:tierFromPlan`
// has read RAZORPAY_PLAN_ESSENTIAL / _SIGNATURE / _PRESTIGE since v1 to resolve
// an INBOUND event's plan back to a tier. The mint reads the SAME three vars to
// go the other way. A second home — an admin_config row, a JSON blob, a
// constant — would be F-04.36's family exactly: one fact, two homes, and the
// webhook and the mint drifting apart without either one erroring.
function planIdFor(tier, env = process.env) {
  const map = {
    essential: env.RAZORPAY_PLAN_ESSENTIAL,
    signature: env.RAZORPAY_PLAN_SIGNATURE,
    prestige:  env.RAZORPAY_PLAN_PRESTIGE,
  };
  const id = map[tier];
  return (typeof id === 'string' && id.trim()) ? id.trim() : null;
}

// ── the one request ─────────────────────────────────────────────────────────
// deps.fetchImpl is injectable; production falls back to global.fetch (Node 18+/22).
// This is metaCloud's `postMessage` with Razorpay's auth substituted, and the
// defensive parse is kept for the same reason it is kept there: Razorpay returns
// JSON on success AND on error, and a body that fails to parse must become a
// typed error rather than a throw from inside `res.json()`.
async function razorpayRequest(path, { method = 'POST', body, fetchImpl, ...creds } = {}) {
  const { keyId, keySecret } = resolveCreds(creds);
  if (!keyId || !keySecret) {
    const missing = [];
    if (!keyId)     missing.push('RAZORPAY_KEY_ID');
    if (!keySecret) missing.push('RAZORPAY_KEY_SECRET');
    throw new RazorpayNotConfiguredError(missing);
  }

  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!doFetch) throw new RazorpayApiError('no fetch implementation available', null, null);

  const auth = Buffer.from(`${keyId}:${keySecret}`, 'utf8').toString('base64');
  const res = await doFetch(`${API_ROOT}${path}`, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let parsed = null;
  try { parsed = await res.json(); } catch (_e) { parsed = null; }

  if (!res || !res.ok) {
    const status = res && res.status;
    const msg    = parsed && parsed.error && parsed.error.description;
    throw new RazorpayApiError(
      `razorpay ${method} ${path} failed (status ${status})${msg ? `: ${msg}` : ''}`,
      status,
      parsed,
    );
  }
  return parsed;
}

// ── CREATE ──────────────────────────────────────────────────────────────────
//
// R-BILL.7, THE ORPHAN-MAPPING LAW, AND WHY IT IS NOT OPTIONAL HERE.
// `razorpay.js:normalizeRazorpayEvent` reads `notes.vendor_id` off the
// subscription entity, and `tierFlip.js:resolveVendor` tries the subscription
// id FIRST and those notes SECOND. Under v1 the founder planted vendor_id by
// hand in the dashboard. Under v2 nobody plants it but this function, and a
// subscription minted without it produces events that can only be mapped if the
// id write also succeeded — one thread instead of two, on the money path. So
// `notes.vendor_id` rides EVERY mint, and the bench asserts its presence rather
// than trusting this comment.
//
// `short_url` RETURNS ON CREATE — derived from Razorpay's own create-subscription
// response schema and from their published client documents, not assumed. That
// is the whole reason no second GET is needed to obtain the vendor's link.
async function createSubscription({ tier, vendorId, totalCount, env, ...deps } = {}) {
  const planId = planIdFor(tier, env || process.env);
  if (!planId) {
    throw new RazorpayNotConfiguredError([`RAZORPAY_PLAN_${String(tier || '').toUpperCase()}`]);
  }
  if (!vendorId) throw new RazorpayApiError('vendor_id required for notes mapping', null, null);

  const sub = await razorpayRequest('/subscriptions', {
    method: 'POST',
    body: {
      plan_id:         planId,
      total_count:     Number.isFinite(totalCount) ? totalCount : TOTAL_COUNT_MONTHLY,
      quantity:        1,
      customer_notify: 1,
      notes:           { vendor_id: String(vendorId) },   // R-BILL.7 — never omitted
    },
    ...deps,
  });

  return {
    id:        (sub && sub.id) || null,
    short_url: (sub && sub.short_url) || null,
    status:    (sub && sub.status) || null,
    plan_id:   (sub && sub.plan_id) || null,
  };
}

// ── CANCEL ──────────────────────────────────────────────────────────────────
//
// `cancel_at_cycle_end: 0` — IMMEDIATE, and it is ruled (Fork U(a)).
// The alternative, cancelling at cycle end, would leave the old subscription
// live while the upgrade's new one is minted, and she would carry two live
// mandates through the overlap window. One of them charging her is a real
// rupee, not a diagram.
//
// THIS ENDPOINT FLIPS NOTHING, DELIBERATELY. Razorpay emits
// `subscription.cancelled`, the v1 webhook lands it, `entitlementFor` maps it to
// basic/cancelled and `applyEntitlement` writes it — machinery that is already
// proven and whose numbers this sitting must leave unmoved (acceptance ②). A
// cancel endpoint that ALSO wrote the tier would be a second writer racing the
// webhook for the same three columns.
//
// AND IT IS IRREVERSIBLE. Razorpay does not restart a cancelled subscription;
// re-subscribing means minting a new one. That fact is the reason the cancel
// COPY warns her, and the reason `I(a)`'s refusal keys on live statuses only.
async function cancelSubscription({ subscriptionId, ...deps } = {}) {
  if (!subscriptionId) throw new RazorpayApiError('subscription id required', null, null);
  const sub = await razorpayRequest(
    `/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    { method: 'POST', body: { cancel_at_cycle_end: 0 }, ...deps },
  );
  return { id: (sub && sub.id) || subscriptionId, status: (sub && sub.status) || null };
}

// ── FETCH ───────────────────────────────────────────────────────────────────
// I(a)'s instrument. The refusal must key on what Razorpay says the stored
// subscription IS, not on what this database last heard about it — a status
// column that lags a webhook would let a double-tap mint a second live mandate.
async function fetchSubscription({ subscriptionId, ...deps } = {}) {
  if (!subscriptionId) throw new RazorpayApiError('subscription id required', null, null);
  const sub = await razorpayRequest(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: 'GET', ...deps },
  );
  return { id: (sub && sub.id) || subscriptionId, status: (sub && sub.status) || null };
}

// ── THE STATUS PARTITION — I(a) WITH THE CHAIR'S REFINEMENT ─────────────────
//
// LIVE means a mandate exists that could still charge her; TERMINAL means it
// cannot. The refusal blocks on LIVE only, and the refinement is what makes the
// estate's own test account legal: 9888294440 carries `sub_TMeuDLooXudasB` in
// status cancelled. Keying the refusal on "has an id" instead would have locked
// every vendor who ever cancelled out of ever paying again — a churned vendor
// permanently unable to return, which is the opposite of what a self-serve door
// is for. That is not a hypothetical; it is the fixture the walk runs on.
const LIVE_STATUSES     = Object.freeze(['created', 'authenticated', 'active']);
const TERMINAL_STATUSES = Object.freeze(['cancelled', 'completed', 'expired', 'halted', 'paused']);

function isLiveStatus(status) {
  return LIVE_STATUSES.includes(String(status || '').toLowerCase());
}

module.exports = {
  createSubscription,
  cancelSubscription,
  fetchSubscription,
  planIdFor,
  isLiveStatus,
  razorpayRequest,
  RazorpayNotConfiguredError,
  RazorpayApiError,
  LIVE_STATUSES,
  TERMINAL_STATUSES,
  TOTAL_COUNT_MONTHLY,
  API_ROOT,
};
