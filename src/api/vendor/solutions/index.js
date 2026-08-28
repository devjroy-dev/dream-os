// src/api/vendor/solutions/index.js
// TDW_19 P0-B · THE DOORS EXIST AND ANSWER HONESTLY (R-19.4).
// Mounted at /api/v2/vendor/solutions — core.js.
//
//   GET  /                      the room index + gates            (SolutionsIndex)
//   GET  /google                                                  (GoogleStatus)
//   GET  /domain                                                  (DomainStatus)
//   GET  /domain/search?q=                                        (DomainSearchResult[])
//   GET  /seo                                                     (SeoReport)
//   GET  /marketing                                               (MarketingDraft[])
//   GET  /proof                                                   (ProofDoc[])
//   GET  /benchmarks                                              (BenchmarksReport)
//   POST *                      withheld — see §POSTS at the foot of this file
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT "ANSWERS HONESTLY" MEANS HERE, AND WHAT IT REFUSES TO MEAN
// ═══════════════════════════════════════════════════════════════════════════
// Every GET below returns the CONTRACT'S EMPTY SHAPE for the resolved vendor.
// That is not a mock and not a stub. R-19.2: **the empty state is the product's
// real first state.** A vendor who opens Google page today is not being shown a
// placeholder standing in for a real answer — she is being shown the true answer,
// which is that nothing is connected yet. When P1 lands, these doors gain a
// source; the SHAPE they answer in does not move.
//
// ── NO TABLE IS READ. NO COLUMN IS NAMED. NO DDL EXISTS. ───────────────────
// The candidate DDL in spec §4/§5 (`vendor_integrations`, `vendor_domains`) is
// NOT chartered and NOT applied. This file reads exactly ONE piece of vendor
// state — `req.vendor.routing_handle`, which `resolveVendor` has already put on
// the request — and it is witnessed:
//
//   docs/db/PUBLIC_SCHEMA.md:1130   public.vendors col 15, routing_handle text,
//                                   nullable, no default
//   docs/db/PUBLIC_SCHEMA.md:1883   UNIQUE vendors_routing_handle_key
//
// The witness was itself staleness-tested before being cited: snapshot tip
// `0125`, migrations `0126`–`0129` present, and none of the four touches
// `public.vendors` (targets are `couple_bookings` and `engagements`).
//
// A door that queried a table which does not exist would 500 on its first real
// request, and it would do so having passed every source-reading cell. So none
// of them does.
//
// ── EVERY RESPONSE IS SHAPE-CHECKED BEFORE IT LEAVES ───────────────────────
// `contract.shape()` runs on every payload, and it refuses EXTRA fields as
// loudly as missing ones (spec §5's note: *the fake refuses unknown fields*). A
// response that has quietly grown a field nobody agreed to would otherwise
// become real by being consumed. On a shape failure the door returns 500 and
// logs what drifted — **it does not send the malformed body with a warning**,
// because a contract that can be violated with a log line is not a contract.
//
// ── AUTHORISATION ──────────────────────────────────────────────────────────
// `requireAuth` then `resolveVendor()` — mode A, no URL param. The vendor is
// the JWT's and nothing else can name it. No route here takes a `:vendorId`,
// so there is no param for a caller to try to substitute.
//
// ── THE GATES ARE READ, NEVER THE KEYS ─────────────────────────────────────
// `env.gates()` returns booleans of presence. This file never touches
// `process.env` directly and never puts a key value in a response body.

'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler  = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');

const contract = require('./contract');
const env      = require('./env');

// ── THE SIX ROWS, IN SPEC §0's DELIVERY ORDER ─────────────────────────────
// One home for the slug↔phase mapping on this side. The pwa mirrors the slug
// order in `lib/solutions/copy.ts`; `bs_audit.mjs` C13 pins it there and
// `b43` pins it here, so a reorder reddens on both sides rather than silently
// producing a room index whose rows do not match its surfaces.
const ROWS = Object.freeze([
  { slug: 'google',     phase: 'p1' },
  { slug: 'website',    phase: 'p2' },
  { slug: 'seo',        phase: 'p3' },
  { slug: 'marketing',  phase: 'p4' },
  { slug: 'proof',      phase: 'p5' },
  { slug: 'benchmarks', phase: 'p6' },
]);

/**
 * Send a payload only if it matches its declared shape.
 *
 * THE FAILURE IS A 500, NOT A WARNING. A door that logs a contract violation
 * and sends the body anyway has taught the caller that the contract is
 * advisory. P1–P6 build against these shapes; the moment one of them can be
 * wrong in production is the moment they stop being able to.
 */
function sendShaped(res, shapeName, payload, key) {
  const v = contract.shape(shapeName, payload);
  if (!v.ok) {
    console.error(
      `[solutions] contract violation on ${shapeName}:`,
      JSON.stringify({ missing: v.missing, extra: v.extra, reason: v.reason })
    );
    return errRes(res, 500, 'Response failed its contract.', 'CONTRACT_VIOLATION');
  }
  return okRes(res, { [key]: payload });
}

/** Same, for an array of one shape. An empty array is valid and common here. */
function sendShapedList(res, shapeName, list, key) {
  for (let i = 0; i < list.length; i++) {
    const v = contract.shape(shapeName, list[i]);
    if (!v.ok) {
      console.error(
        `[solutions] contract violation on ${shapeName}[${i}]:`,
        JSON.stringify({ missing: v.missing, extra: v.extra, reason: v.reason })
      );
      return errRes(res, 500, 'Response failed its contract.', 'CONTRACT_VIOLATION');
    }
  }
  return okRes(res, { [key]: list });
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /  — the room index
// ═══════════════════════════════════════════════════════════════════════════
// R-19.5: the surface renders a chip per row off this. A row whose gate is
// closed reports `state: 'coming'` and `live: false`, and turning it on later is
// SETTING A KEY, not shipping a build.
//
// Every row is `not_connected` today because no row has a source yet. When P1
// lands, `google` reports its real state and the other five do not move.
router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const gates = env.gates();
  const rows  = ROWS.map((r) => ({
    slug:  r.slug,
    phase: r.phase,
    live:  Boolean(gates[r.phase]),
    state: gates[r.phase] ? 'not_connected' : 'coming',
  }));

  for (let i = 0; i < rows.length; i++) {
    const v = contract.shape('SolutionsRow', rows[i]);
    if (!v.ok) {
      console.error(`[solutions] contract violation on SolutionsRow[${i}]:`, JSON.stringify(v));
      return errRes(res, 500, 'Response failed its contract.', 'CONTRACT_VIOLATION');
    }
  }
  return sendShaped(res, 'SolutionsIndex', { rows }, 'index');
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /google  (spec §4)
// ═══════════════════════════════════════════════════════════════════════════
// R-19.4's ruled empty shape: `{status:'not_connected', …}`.
//
// `gbpQuotaApproved` is the ONE field here that is not a null placeholder — it
// is a real fact about the world today, read from the gate. Spec §8 withholds
// the SYNC CALLS on that key, not the OAuth flow, so collapsing it into
// `status` would tell a vendor the row is dead when she can in fact connect.
router.get('/google', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const payload = {
    status:             'not_connected',
    accountName:        null,
    locationName:       null,
    reviewUrl:          null,
    reviewRequestsSent: 0,
    lastSyncedAt:       null,
    lastError:          null,
    gbpQuotaApproved:   env.gbpQuotaApproved(),
  };
  return sendShaped(res, 'GoogleStatus', payload, 'google');
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /domain  (spec §5)
// ═══════════════════════════════════════════════════════════════════════════
// R-19.4 as amended by CE-38 relay #1 item 4:
//   `{status:'none', subdomain: handle ? lower(handle) + '.' + root : null}`
//
// This is the only door that reads vendor state, and it reads the one column
// witnessed in the header. `subdomainFor` is the sole builder of that string on
// this side — a handler that concatenated it inline would be a second home for
// a transform whose whole point is that it has one.
router.get('/domain', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const payload = {
    status:            'none',
    subdomain:         contract.subdomainFor(req.vendor.routing_handle),
    domain:            null,
    liveUrl:           null,
    registeredAt:      null,
    expiresAt:         null,
    renewalPricePaise: null,
    autoRenew:         false,
    forwardEmail:      null,
    lastError:         null,
  };
  return sendShaped(res, 'DomainStatus', payload, 'domain');
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /domain/search?q=  (spec §5)
// ═══════════════════════════════════════════════════════════════════════════
// ⚠ AN EMPTY LIST IS THE HONEST ANSWER, AND A FABRICATED ONE WOULD BE THE
// DANGEROUS ALTERNATIVE. The registrar is not wired (P2 gate closed), so there
// is no availability to report and no price to quote. This door could have
// returned plausible-looking suggestions at a plausible-looking price — and
// every one would be a made-up fact about a domain the vendor might try to buy,
// at a number that is not the registrar's. It returns nothing and the surface
// says the row is not live yet.
//
// The `q` guard is here rather than in P2 because a 400 on a missing query is a
// property of the ROUTE, not of the registrar behind it, and P2 should inherit
// it rather than rediscover it.
router.get('/domain/search', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return errRes(res, 400, 'A search term is required.');
  if (!env.gates().p2) return okRes(res, { results: [], live: false });
  return sendShapedList(res, 'DomainSearchResult', [], 'results');
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /seo  (spec §6)
// ═══════════════════════════════════════════════════════════════════════════
// R-19.4: the checklist with every item false. The four counters are 0 rather
// than null because they are COUNTS OF A THING THAT HAS NOT HAPPENED, and zero
// impressions is the true answer for a page that is not live — not an absence of
// data. `topQueries` is empty for the same reason.
//
// No score field exists on the shape. Spec §6 refuses "SEO score out of 100" by
// name, and the refusal is structural: there is nowhere to put one.
router.get('/seo', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const payload = {
    impressionsThisMonth: 0,
    impressionsLastMonth: 0,
    clicksThisMonth:      0,
    clicksLastMonth:      0,
    topQueries:           [],
    checklist: {
      structuredData: false,
      sitemap:        false,
      canonical:      false,
      ownDomain:      false,
      searchConsole:  false,
    },
  };
  const cv = contract.shape('SeoChecklist', payload.checklist);
  if (!cv.ok) {
    console.error('[solutions] contract violation on SeoChecklist:', JSON.stringify(cv));
    return errRes(res, 500, 'Response failed its contract.', 'CONTRACT_VIOLATION');
  }
  return sendShaped(res, 'SeoReport', payload, 'seo');
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /marketing  (spec §7, P4)
// ═══════════════════════════════════════════════════════════════════════════
// The three tools each produce a draft; none exists yet. TDW never publishes —
// the vendor sends. That is a P4 behaviour, but the empty list is already
// consistent with it: there is nothing here that was sent on her behalf.
router.get('/marketing', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  return sendShapedList(res, 'MarketingDraft', [], 'drafts');
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /proof  (spec §7, P5)
// ═══════════════════════════════════════════════════════════════════════════
// The three documents are ENUMERATED with `status:'none'` rather than returned
// as an empty list, because the vendor should see WHICH three she will get. An
// empty list would render an empty room and tell her nothing about what the row
// is for.
router.get('/proof', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const docs = ['rate_card', 'one_pager', 'qa'].map((kind) => ({
    kind,
    status:      'none',
    url:         null,
    generatedAt: null,
  }));
  return sendShapedList(res, 'ProofDoc', docs, 'docs');
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /benchmarks  (spec §7, P6)
// ═══════════════════════════════════════════════════════════════════════════
// R-19.4's ruled empty shape carries `cohort: 0`, and the surface renders the
// below-cohort sentence off it.
//
// ⚠ `mine` AND `median` ARE BOTH NULL, AND THAT IS THE PRIVACY PROPERTY, NOT A
// PLACEHOLDER. Spec §7 sets a cohort floor of five; below it no median is
// computed. Sending `mine` alone would be safe here but would establish the
// habit of putting a number on this wire before the cohort has been checked,
// and P6 would inherit that habit. Nothing numeric ships until the cohort does.
//
// `city` and `category` are null rather than read from `req.vendor`: the cohort
// they describe does not exist, and naming a city beside `cohort: 0` invites the
// surface to render "Not enough vendors in Mumbai yet" as though we had counted
// Mumbai. We have not. P6 fills all three together or none.
router.get('/benchmarks', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const metrics = ['first_reply_minutes', 'reply_rate', 'enquiries_per_month', 'conversion_rate']
    .map((metric) => ({ metric, mine: null, median: null, direction: 'unknown' }));

  for (let i = 0; i < metrics.length; i++) {
    const v = contract.shape('Benchmark', metrics[i]);
    if (!v.ok) {
      console.error(`[solutions] contract violation on Benchmark[${i}]:`, JSON.stringify(v));
      return errRes(res, 500, 'Response failed its contract.', 'CONTRACT_VIOLATION');
    }
  }
  return sendShaped(res, 'BenchmarksReport', { city: null, category: null, cohort: 0, metrics }, 'benchmarks');
}));

// ═══════════════════════════════════════════════════════════════════════════
// §POSTS — CONDITIONAL-WITHHELD, WITH THE UNCOMMENT STEP STATED
// ═══════════════════════════════════════════════════════════════════════════
//
// THE CONDITIONAL-WITHHELD RULE, applied literally: a conditional block is
// withheld until its condition arrives, OR ships fully commented with the
// uncomment step stated explicitly. These ship commented. Each one's condition
// is a key in spec §8, and `env.gates()` is how a door will know.
//
// THEY ARE NOT DRAFTS OF THE HANDLERS. Writing a body now would be writing
// against a table that does not exist and a registrar that is not wired — the
// bodies belong to P1 and P2, who will have both. What is fixed here is the
// ADDRESS, the METHOD, the SHAPE each will answer in, and the GATE each waits
// on, so that P1 and P2 inherit a decision instead of making it again.
//
// ── P1 · GOOGLE (uncomment when: GOOGLE_OAUTH_CLIENT_ID + _SECRET +
//    INTEGRATION_TOKEN_KEY are set on Railway, i.e. `env.gates().p1 === true`)
//
//    POST /google/connect     -> { authUrl }        begins the OAuth grant
//    POST /google/callback    -> GoogleStatus       completes it; stores the
//                                                   refresh token ENCRYPTED
//                                                   under INTEGRATION_TOKEN_KEY
//    POST /google/disconnect  -> GoogleStatus       revokes and clears
//    POST /google/sync        -> GoogleStatus       ⚠ ADDITIONALLY GATED on
//                                                   env.gbpQuotaApproved() —
//                                                   spec §8 withholds SYNC
//                                                   CALLS, not the grant. Two
//                                                   gates, not one.
//
//    UNCOMMENT STEP: delete the comment markers on the P1 block, add
//    `if (!env.gates().p1) return errRes(res, 503, ...)` as each handler's first
//    line, and extend b43 with the both-ways cells (gate closed -> 503; gate
//    open -> handler runs).
//
// ── P2 · WEBSITE (uncomment when: RESELLERCLUB_USER_ID + _API_KEY +
//    VERCEL_TOKEN + VERCEL_PROJECT_ID + STOREFRONT_ROOT_DOMAIN are set, i.e.
//    `env.gates().p2 === true`)
//
//    POST /domain/register    -> DomainStatus       buys it. SPENDS REAL MONEY.
//    POST /domain/wire        -> DomainStatus       points DNS at Vercel
//    POST /domain/renew       -> DomainStatus       manual renew
//    POST /domain/autorenew   -> DomainStatus       toggle
//
//    ⚠ F-19.15 LANDS ON `/domain/register`. The pass-through invoice line
//    converts paise -> rupees at the INVOICES room's own write door, because
//    `public.invoices.amount_total` is a rupees integer
//    (docs/db/PUBLIC_SCHEMA.md:626) and this rail is paise. It does NOT convert
//    here and it does NOT write invoices from this file — `eventWrite.js` and
//    the invoices door are the sole writers on their own tables, and a money
//    door that grew a second writer is the disease the sole-writer law exists
//    to prevent.
//
//    ⚠ AND THIS ONE SPENDS THE FOUNDER'S MONEY. Whoever uncomments it owes an
//    idempotency key on the registrar call before the first real request, or a
//    retried POST buys the domain twice.
//
//    UNCOMMENT STEP: as P1, gated on `env.gates().p2`.
//
// ── P3–P6 · NO POSTS ARE DECLARED, AND THAT IS NOT AN OVERSIGHT ────────────
//    Spec §8 names no key for P3, P4, P5 or P6 (see the head of `env.js`).
//    Declaring their POST addresses here would pin an interface for phases whose
//    gates do not exist, and the next seat would inherit it as though it had
//    been ruled. `UNKEYED_PHASES` is the honest state; spec §8 is the amendment
//    site. When those phases are chartered with keys, their POSTs are declared
//    in this section in the same form as P1 and P2 above.

module.exports = router;
