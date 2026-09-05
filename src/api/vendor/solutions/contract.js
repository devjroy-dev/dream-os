// src/api/vendor/solutions/contract.js
// TDW_19 · THE WIRE CONTRACT, BACKEND MIRROR (R-19.3).
//
// ═══════════════════════════════════════════════════════════════════════════
// THE OTHER HALF LIVES IN ANOTHER REPO
// ═══════════════════════════════════════════════════════════════════════════
// `dreamos-pwa/lib/solutions/types.ts` is the authored home of these shapes.
// Two repos cannot import from one another, so this file MIRRORS them — and a
// mirror nobody checks is two homes wearing one name.
//
// THE CHECK IS `CONTRACT_DIGEST`. It is the sha256 of the canonical rendering
// of `SHAPES` below, and the identical 64 characters are carried as a literal
// in `types.ts`. Each repo recomputes ITS OWN half and compares to the literal
// it carries. Neither reads the other. A field added on one side alone makes
// THAT side's computed digest diverge from its literal and REDDENS THAT SIDE;
// making it green forces the literal to move, and two differing literals are a
// one-line diff a reader cannot miss in the ZIP.
//
// ⚠ WHAT THE DIGEST DOES NOT COVER (D-38.1: a cell that asserts PRESENCE has
// not asserted CORRECTNESS, and a gate must say where it stops looking). The
// digest is over FIELD NAMES ONLY. A rename is caught. A RETYPE is not —
// `number` to `string`, a union member added — because the TypeScript text over
// there and the JSDoc text here will never match byte for byte, and a
// comparison that fails on correct trees is a comparison that gets disabled.
// The one class that mattered enough to cover separately is the money unit, and
// it has its own cell on both sides: every money field name ends in `Paise`.
//
// ── SHAPE(), AND WHY IT REFUSES EXTRA FIELDS ───────────────────────────────
// Spec §5's bench note carries P3's lesson forward: *the fake refuses unknown
// fields*. A validator that only checks for MISSING keys passes a response that
// has quietly grown a field nobody agreed to, and the field then becomes real
// by being consumed. `shape()` reports `extra` as loudly as `missing` and the
// doors treat either as a failure to respond.
//
// ── NO TABLE IS READ FROM THIS FILE, AND NO DDL EXISTS ─────────────────────
// The candidate DDL in spec §4/§5 (`vendor_integrations`, `vendor_domains`) is
// NOT chartered and NOT applied. Nothing here names a column. The `status`
// vocabularies below are the CHIP vocabulary of spec §9 — the founder's
// approved words — and not the DDL's `pending|active|revoked|error`. When a
// table lands, the door maps column to chip; this contract does not move.

'use strict';

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// TYPEDEFS — mirroring dreamos-pwa/lib/solutions/types.ts
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} SolutionsRow
 * @property {'google'|'website'|'seo'|'marketing'|'proof'|'benchmarks'} slug
 * @property {'p1'|'p2'|'p3'|'p4'|'p5'|'p6'} phase
 * @property {boolean} live
 * @property {'not_connected'|'connected'|'needs_attention'|'searching'|'live'|'expired'|'coming'} state
 */

/**
 * @typedef {Object} SolutionsIndex
 * @property {SolutionsRow[]} rows
 */

/**
 * @typedef {Object} GoogleStatus
 * @property {'not_connected'|'connected'|'needs_attention'} status
 * @property {string|null} accountName
 * @property {string|null} locationName
 * @property {string|null} reviewUrl
 * @property {number} reviewRequestsSent
 * @property {string|null} lastSyncedAt
 * @property {string|null} lastError
 * @property {boolean} gbpQuotaApproved  Separate from `live` on purpose — spec §8
 *   gates OAuth on the credential keys and the SYNC CALLS on GBP_QUOTA_APPROVED.
 */

/**
 * @typedef {Object} DomainStatus
 * @property {'none'|'searching'|'registering'|'wiring'|'live'|'expired'|'error'} status
 * @property {string|null} subdomain  Built ONLY by subdomainFor() below.
 * @property {string|null} domain
 * @property {string|null} liveUrl
 * @property {string|null} registeredAt
 * @property {string|null} expiresAt
 * @property {number|null} renewalPricePaise
 * @property {boolean} autoRenew
 * @property {string|null} forwardEmail
 * @property {string|null} lastError
 */

/**
 * @typedef {Object} DomainSearchResult
 * @property {string} domain
 * @property {boolean} available
 * @property {number|null} pricePaise
 */

/**
 * @typedef {Object} SeoChecklist
 * @property {boolean} structuredData
 * @property {boolean} sitemap
 * @property {boolean} canonical
 * @property {boolean} ownDomain
 * @property {boolean} searchConsole
 */

/**
 * @typedef {Object} SeoTopQuery
 * @property {string} query
 * @property {number} impressions
 * @property {number} clicks
 */

/**
 * @typedef {Object} SeoReport
 * @property {number} impressionsThisMonth
 * @property {number} impressionsLastMonth
 * @property {number} clicksThisMonth
 * @property {number} clicksLastMonth
 * @property {SeoTopQuery[]} topQueries
 * @property {SeoChecklist} checklist
 *
 * NO SCORE FIELD. Spec §6 refuses "SEO score out of 100" by name, and the
 * refusal is enforced by there being nowhere to put one.
 */

/**
 * @typedef {Object} MarketingDraft
 * @property {string|null} id
 * @property {'post'|'referral'|'ad_brief'} kind
 * @property {'none'|'ready'|'sent'} status
 * @property {string|null} headline
 * @property {string|null} body
 * @property {string[]} imageUrls
 * @property {string|null} createdAt
 * @property {string|null} sentAt
 */

/**
 * @typedef {Object} ProofDoc
 * @property {'rate_card'|'one_pager'|'qa'} kind
 * @property {'none'|'ready'|'stale'} status
 * @property {string|null} url
 * @property {string|null} generatedAt
 */

/**
 * @typedef {Object} Benchmark
 * @property {'first_reply_minutes'|'reply_rate'|'enquiries_per_month'|'conversion_rate'} metric
 * @property {number|null} mine
 * @property {number|null} median
 * @property {'above'|'below'|'same'|'unknown'} direction
 */

/**
 * @typedef {Object} BenchmarksReport
 * @property {string|null} city
 * @property {string|null} category
 * @property {number} cohort  Lives here, not on Benchmark — the cohort is a
 *   property of the (city, category) pair, not of a metric. R-19.4's empty
 *   shape is `{cohort: 0}`.
 * @property {Benchmark[]} metrics
 */

// ═══════════════════════════════════════════════════════════════════════════
// SHAPES — the runtime half of the mirror. THIS is what the digest is over.
// ═══════════════════════════════════════════════════════════════════════════
// Field order here is irrelevant; the canonical rendering sorts. It is written
// in the typedefs' order anyway so a reader can diff the two by eye.

const SHAPES = Object.freeze({
  SolutionsRow:       ['slug', 'phase', 'live', 'state'],
  SolutionsIndex:     ['rows'],
  GoogleStatus:       ['status', 'accountName', 'locationName', 'reviewUrl', 'reviewRequestsSent', 'lastSyncedAt', 'lastError', 'gbpQuotaApproved'],
  DomainStatus:       ['status', 'subdomain', 'domain', 'liveUrl', 'registeredAt', 'expiresAt', 'renewalPricePaise', 'autoRenew', 'forwardEmail', 'lastError'],
  DomainSearchResult: ['domain', 'available', 'pricePaise'],
  SeoChecklist:       ['structuredData', 'sitemap', 'canonical', 'ownDomain', 'searchConsole'],
  SeoTopQuery:        ['query', 'impressions', 'clicks'],
  SeoReport:          ['impressionsThisMonth', 'impressionsLastMonth', 'clicksThisMonth', 'clicksLastMonth', 'topQueries', 'checklist'],
  MarketingDraft:     ['id', 'kind', 'status', 'headline', 'body', 'imageUrls', 'createdAt', 'sentAt'],
  ProofDoc:           ['kind', 'status', 'url', 'generatedAt'],
  Benchmark:          ['metric', 'mine', 'median', 'direction'],
  BenchmarksReport:   ['city', 'category', 'cohort', 'metrics'],

  // ── G2 · THE GOOGLE REVIEWS ROOM (R-G2 sitting 1, ZIP 1b) ────────────────
  // ⚠ ADDING A SHAPE MOVES THIS FILE'S DIGEST, AND THAT IS THE MIRROR WORKING.
  // `CONTRACT_DIGEST` below moves with it; `dreamos-pwa/lib/solutions/types.ts`
  // carries the twin literal and moves in the pwa ZIP that lands next. Between
  // the two applies the two literals DIFFER — which is exactly the one-line diff
  // this header says a reader cannot miss, not an error state. The two ZIPs are
  // applied back to back and the window closes with the second.
  //
  // WHY A NEW SHAPE RATHER THAN FIELDS ON `GoogleStatus`: that shape is P1's —
  // the OAuth connection, the sync, the quota gate — and it answers a question
  // this room does not ask. Widening it would have made one payload mean two
  // things and forced the room to read past six fields it never uses. Either
  // choice moves the digest, so the digest is not what decides this.
  //
  // `asked` is a LIST OF `ReviewAsk`, validated element-wise by `sendShaped`'s
  // list sibling. `seal` is an object OR NULL and the shape validator does not
  // walk into it — named here rather than implied, because a nested shape this
  // file does not check is a boundary D-38.1 says must be stated.
  ReviewAsk:          ['coupleName', 'weddingTitle', 'askedAt'],
  // ⚠ `ReviewSeal` IS A NAMED SHAPE BECAUSE THE OTHER HALF'S PARSER DEMANDS IT,
  // and that is a fact this side had to learn from over there. `bs_audit.mjs`
  // refuses an inline nested object literal in `types.ts` and reports
  // GATE-UNSOUND rather than digesting a shape it can only half see. ZIP 1b
  // shipped `seal` as an unnamed field here, which would have left the two
  // literals PERMANENTLY DIFFERENT — each side green against its own, the mirror
  // silently broken, which is the one failure this whole mechanism exists to
  // prevent. Named on both sides now, and the digest moves with it.
  ReviewSeal:         ['weddings', 'deliveryDays'],
  GoogleReviewsRoom:  ['asked', 'askedCount', 'landedCount', 'seal',
                       'gbpAvailableFrom', 'sendEnabled'],
});

/**
 * The seven R-19.3 names, held separately from SHAPES so that "all seven are
 * declared" is an assertion against the RULING rather than against whatever
 * happens to be in the object. A cell that reads its expectation out of the
 * thing it is testing has not tested anything (D-38.1).
 */
const RULED_PAYLOAD_TYPES = Object.freeze([
  'GoogleStatus',
  'DomainStatus',
  'DomainSearchResult',
  'SeoReport',
  'MarketingDraft',
  'ProofDoc',
  'Benchmark',
]);

// ═══════════════════════════════════════════════════════════════════════════
// THE CANONICAL RENDERING AND THE DIGEST
// ═══════════════════════════════════════════════════════════════════════════

/**
 * `TypeName{field,field,...}` per type, fields sorted, types sorted, joined by
 * newline. Both repos build this same string from their own declarations.
 * @param {Record<string, string[]>} shapes
 * @returns {string}
 */
function canonical(shapes) {
  return Object.keys(shapes)
    .sort()
    .map((name) => name + '{' + shapes[name].slice().sort().join(',') + '}')
    .join('\n');
}

/** sha256 hex of the canonical rendering of this file's SHAPES. */
function computeDigest() {
  return crypto.createHash('sha256').update(canonical(SHAPES), 'utf8').digest('hex');
}

/**
 * THE LITERAL. Must equal `CONTRACT_DIGEST` in
 * `dreamos-pwa/lib/solutions/types.ts`, character for character.
 *
 * Derived, never typed from memory:
 *   node -e "console.log(require('./src/api/vendor/solutions/contract.js').computeDigest())"
 */
const CONTRACT_DIGEST = 'a4ccb0a742fbbd87a4a9a63674922ac6d60f7576e7e9fd66696cf061267a607a';

// ═══════════════════════════════════════════════════════════════════════════
// SHAPE() — every door runs this before it responds
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @param {string} name  a key of SHAPES
 * @param {unknown} obj
 * @returns {{ok: boolean, missing: string[], extra: string[], reason: string|null}}
 */
function shape(name, obj) {
  const expected = SHAPES[name];
  if (!expected) {
    return { ok: false, missing: [], extra: [], reason: 'unknown shape: ' + name };
  }
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return { ok: false, missing: expected.slice(), extra: [], reason: 'not a plain object' };
  }
  const got = Object.keys(obj);
  const missing = expected.filter((k) => !Object.prototype.hasOwnProperty.call(obj, k));
  const extra   = got.filter((k) => expected.indexOf(k) === -1);
  return {
    ok: missing.length === 0 && extra.length === 0,
    missing,
    extra,
    reason: null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// THE SUBDOMAIN TRANSFORM — mirror of lib/solutions/types.ts
// ═══════════════════════════════════════════════════════════════════════════
//
// CE-38 relay #1 item 4. `routing_handle` is NULLABLE with no default
// (docs/db/PUBLIC_SCHEMA.md:1130, UNIQUE vendors_routing_handle_key :1883) and
// is minted UPPERCASE (src/agent/onboarding.js:174-192; the change tool at
// src/agent/engine.js:1270 uppercases too). So `DEV550` is the stored byte and
// `dev550.thedreamwedding.in` is the address, and a vendor mid-onboarding has
// neither.
//
// THE ROOT IS ENV-FIRST. Spec §8 sets STOREFRONT_ROOT_DOMAIN on Railway; the
// ruled literal is the fallback so a missing key cannot produce
// `dev550.undefined`.

const STOREFRONT_ROOT = process.env.STOREFRONT_ROOT_DOMAIN || 'thedreamwedding.in';

/**
 * @param {string|null|undefined} handle  a `vendors.routing_handle`
 * @param {string} [root]
 * @returns {string|null}
 */
function subdomainFor(handle, root) {
  if (typeof handle !== 'string') return null;
  const trimmed = handle.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase() + '.' + (root || STOREFRONT_ROOT);
}

/**
 * [input, expected] against the ruled default root — MIRRORED VERBATIM from
 * `SUBDOMAIN_FIXTURE` in types.ts. Each side asserts its own implementation
 * against these literals, so neither repo reads the other and a change to
 * either implementation reddens that side alone.
 */
const SUBDOMAIN_FIXTURE = Object.freeze([
  ['DEV550', 'dev550.thedreamwedding.in'],
  ['dev550', 'dev550.thedreamwedding.in'],
  ['AB-CD', 'ab-cd.thedreamwedding.in'],
  ['  PADDED  ', 'padded.thedreamwedding.in'],
  ['', null],
  [null, null],
]);

module.exports = {
  SHAPES,
  RULED_PAYLOAD_TYPES,
  CONTRACT_DIGEST,
  canonical,
  computeDigest,
  shape,
  STOREFRONT_ROOT,
  subdomainFor,
  SUBDOMAIN_FIXTURE,
};
