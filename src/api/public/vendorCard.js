// src/api/public/vendorCard.js
// TDW_19 P0-B step 4 · THE PUBLIC VENDOR CARD (R-19.7, CE-38 relay #3).
// TDW_19 P2-A §3-1 · THE DOOR GROWS, BY NAMED FIELDS ONLY (CE-38 third band §4).
//
//   GET /api/v2/public/vendor-card/:code   — the one read behind thedreamwedding.in/v/<code>
//
// ═══════════════════════════════════════════════════════════════════════════
// THIS IS THE FIRST UNAUTHENTICATED PER-VENDOR READ IN THE ESTATE
// ═══════════════════════════════════════════════════════════════════════════
// Every `/api/v2/vendor/*` route sits behind `requireAuth` + `resolveVendor`.
// This one has no session by design, and it is mounted BESIDE the public
// routers in `src/api/router.js` — NEVER under `src/api/vendor/core.js`, whose
// siblings all carry the guard. Mounting it there would put an unauthenticated
// door inside a router whose every neighbour is authenticated, and the next
// reader would assume the guard by association.
//
// ── THE CAPABILITY LAW, INHERITED FROM `src/api/crew.js` ───────────────────
// That file's header states the doctrine this one obeys: **THE RESPONSE SHAPE
// IS THE SECURITY BOUNDARY.** Not a filter applied late, not a `delete
// payload.x` — the shape is built field by named field and NOTHING IS EVER
// SPREAD IN FROM A ROW. The crew door's own comment records what that
// prevents: a `select('*')` there would have put a client's phone number and a
// wedding's money on a public URL.
//
// `public.vendors` has 45 columns. Among them: `upi_id`, `gstin`, `pin_hash`,
// `rate_max`, `razorpay_subscription_id`, `style_notes`. A `select('*')` on
// this route publishes a vendor's bank handle, tax number and password hash to
// anyone who guesses a six-character code.
// **THE SELECTS BELOW ARE ALLOWLISTS AND THE BENCH DIFFS THEM.**
//
// ── TWO LAWS, NOT ONE (P2-A correction 6, CE-38 relay #1) ──────────────────
// b44 carried a single `FORBIDDEN` list, which conflated two different rules:
// *never selected* and *never on the wire*. P2-A separates them, because this
// door now legitimately SELECTS three columns it must never SEND:
//   · `id`          — needed to join `vendor_portfolio`, never on the wire
//   · `rate_min`    — the input to `starting_price`, never sent raw
//   · `rate_display`— the switch that decides whether a rate exists at all
// A column can be fetched and withheld. A column that is neither fetched nor
// sent is a third state, and the bench now names all three.
//
// ── EVERY COLUMN NAMES ITS WITNESS (SQL-provenance law) ────────────────────
// ⚠ P2-A correction 1 — THE WITNESSES BELOW WERE STALE AND ARE RE-DERIVED.
// This header cited `docs/db/PUBLIC_SCHEMA.md` at snapshot tip `0125`. The doc
// was REGENERATED 2026-08-28 at ladder tip `0129`, and every line moved: the
// old `:1115` (business_name) today reads `7. source text NOT NULL`, a
// different table entirely. **A witness that points at the wrong line is worse
// than no witness, because it looks checked.** Re-derived at `1f8bab9`, and the
// staleness rule was run before citing: header ladder tip `0129`, newest file
// in `db/migrations/` is `0129`, so the arithmetic test passes; and the blind
// spot was read too — `OUT_OF_ORDER.json` holds ONE record, `0090_engagements`,
// stale-for `engagements`/`couple_bookings`/`couple_enquiries`, none of which
// this door touches.
//
//   public.vendors                        docs/db/PUBLIC_SCHEMA.md
//     id               uuid NOT NULL        :1134  (col 1)   — join key only, never sent
//     business_name    text                 :1136  (col 3)
//     category         text                 :1137  (col 4)
//     city             text                 :1139  (col 6)
//     status           text NOT NULL        :1142  (col 9,  default 'active')
//     routing_handle   text                 :1148  (col 15, NULLABLE, UNIQUE)
//     rate_min         integer              :1160  (col 27)  — RUPEES, see below
//     about            text                 :1167  (col 34)
//     rate_display     boolean NOT NULL     :1172  (col 47, default true)
//     discover_paused  boolean NOT NULL     :1173  (col 48, default false)
//
//   public.vendor_portfolio               docs/db/PUBLIC_SCHEMA.md
//     image_url        text NOT NULL        :1092  (col 3)
//     caption          text                 :1093  (col 4)
//     is_hero          boolean NOT NULL     :1094  (col 5,  default false)
//     position         integer NOT NULL     :1103  (col 15, default 0)
//     approval_state   text NOT NULL        :1097  (col 8,  CHECK pending|approved|rejected :1877)
//     vendor_id        uuid NOT NULL        :1091  (col 2)
//
//   public.demo_vendors                   docs/db/PUBLIC_SCHEMA.md
//     ig_handle        text NOT NULL        :470   (col 2)   — a demo vendor's address
//     display_name     text NOT NULL        :471   (col 3)
//     category         text NOT NULL        :472   (col 4)
//     city             text NOT NULL        :473   (col 5)
//     whatsapp_phone   text                 :474   (col 6)
//     about            text                 :475   (col 7)
//     photos           jsonb NOT NULL       :477   (col 9,  default '[]')
//     active           boolean NOT NULL     :478   (col 10)
//
// ── VISIBILITY (CE-38 relay #3, blocker 3) ─────────────────────────────────
// `status = 'active' AND NOT discover_paused`. **`discover_paused` is the
// vendor's own word**, and it binds a route she never asked for — a vendor who
// said "don't show me publicly" did not mean "except on this new URL".
//
// AND EVERY OTHER OUTCOME IS ONE INDISTINGUISHABLE RESPONSE. Absent handle,
// paused, inactive, ineligible — all return the same 404 body. If they differed,
// the route would answer "does this handle exist?" for anyone willing to walk
// the keyspace, and a UNIQUE six-character code is a small keyspace.
//
// **P2-A §2-3 · ONE SWITCH, STRUCTURALLY.** The portfolio read fires only AFTER
// that gate has returned. A paused vendor's photos are never QUERIED, not
// merely never rendered — so `discover_paused` killing the whole page is a
// property of the control flow rather than a filter someone could later move.
// b44 §7.4 asserts the zero queries, not the empty array.

'use strict';

const express = require('express');
const router  = express.Router();

// ── W-1's CURE, AND IT IS AN IMPORT RATHER THAN A TRANSCRIPTION ─────────────
// `ENQUIRE_BASE` is `https://wa.me/${waNumberFor('vendor')}?text=TDW-`, declared
// once at `src/lib/discover/shapeVendor.js:43` and used for every Enquire tap
// the Frost deck has served since TDW_07. Requiring it here costs one module —
// that file's only runtime dependency is `../waNumbers` — and buys the property
// the founder walk was owed: the public page and the deck send a couple to the
// SAME number with the SAME message, and neither can drift from the other.
//
// Transcribing the template would have been two homes for the house number, and
// `waNumbers.js`'s own header records what two homes cost last time: eleven
// independent `|| '14787788550'` tails, one of which fell back to the wrong
// lane entirely (F-05.23).
const { ENQUIRE_BASE, enquireLinkFor } = require('../../lib/discover/shapeVendor');
// G2 · R-G2.9. The visibility rule is IMPORTED, never restated: `three` lives
// once, beside the computation that produces the count it tests.
const { sealIsVisible } = require('../../lib/vendor/seal');
// G3.1. `publicWedding` is the ONE shaper of a wedding for a public wire
// (`weddings.js:788`) and `weddingPage.js` already reads it. This door imports
// it rather than restating five field names, so a sixth field added there
// reaches both leaves in one edit and neither can drift into a private column.
const { publicWedding } = require('../../lib/vendor/weddings');

/**
 * THE WIRE SHAPE, DECLARED ONCE.
 *
 * ⚠ TEN KEYS AT P2-A S4. Six at P0-B; `about`, `starting_price` and `photos`
 * added by the third band §4's charter; `enquire_link` added by c-38.37 after
 * the founder walk (W-1).
 *
 * ── W-1 · A STOREFRONT A COUPLE CANNOT ACT ON IS A BROCHURE ────────────────
 * The third band §2-5 gave real vendors no contact affordance, and that ruling
 * was right about the question it answered — a vendor's PERSONAL number must
 * not be published without her consent. This seat read "no personal number" as
 * "no contact", which does not follow, and shipped a page a couple arriving at
 * her highest intent could do nothing with. The founder walked it and said so.
 *
 * c-38.37, the chair's: the ruling answered the disclosure question and never
 * asked what the page was FOR.
 *
 * The cure needed no column, no consent and no charter, because the estate had
 * already solved it: every Enquire in the couple plane routes through TDW's own
 * WhatsApp number with the vendor's handle in the message body, and Donna routes
 * from there. Nobody ever needed to publish her number.
 *
 * THE ASYMMETRY NARROWS TO ITS HONEST REMAINDER: real vendors route through the
 * house; demo vendors deep-link the business's own public Instagram contact,
 * which is what `demo_vendors.whatsapp_phone` has always been.
 *
 * ⚠ SIX KEYS, NOT THE FOUR CE-38 RELAY #3 NAMED — reported, not adapted (§0.2).
 * The relay's shape line (`business_name, category, city, handle`) was written
 * beside blocker 2's ruling, which ALSO ruled that demo vendors ship the
 * `Enquire on WhatsApp` button off `demo_vendors.whatsapp_phone`. Those two
 * cannot both hold at four keys: the button needs a number on the wire and the
 * page needs to know it is a demo.
 *
 * Rather than emit two shapes — which would give the security boundary two
 * definitions and the bench two things to chase — there is ONE shape of fixed
 * keys. `is_demo` and `enquiry_phone` are ALWAYS PRESENT; for a real vendor
 * they are `false` and `null`. A real vendor's response therefore carries no
 * more information than the relay's four, and the allowlist stays a single
 * list the bench can diff.
 *
 * ⚠ THIS CARD IS NOT ON THE SOLUTIONS RAIL — P2-A correction 7, and it is a
 * refusal rather than an omission. The P2-A kickoff §3-1 asked that `shape()`
 * in `src/api/vendor/solutions/contract.js` and `lib/solutions/types.ts` grow
 * in lockstep with this door. Re-derived: those twelve shapes are the
 * AUTHENTICATED vendor-solutions rail (`SolutionsRow` … `BenchmarksReport`),
 * there is no `VendorCard` among them, and this door has never called
 * `shape()`. Adding the public card there would enrol an unauthenticated read
 * in `CONTRACT_DIGEST`, so every future `/v/` field would redden a digest in a
 * repo with no stake in it — and a gate that reddens for unrelated reasons is a
 * gate somebody switches off. `CARD_KEYS` IS this card's contract; b44 §2.2 and
 * §3.5 diff it. If the chair wants it on the rail, that is one word and the
 * constant plus its two cells move together.
 */
const CARD_KEYS = Object.freeze([
  'business_name', 'category', 'city', 'handle',
  'is_demo', 'enquiry_phone',
  'about', 'starting_price', 'photos',
  'enquire_link',
  // ── G2 · R-G2.9 — THE SEAL JOINS THE WIRE, BY NAMED FIELD ────────────────
  // The door grows by named fields only (P2-A §3-1), and `b44` §2.2/§3.5 diff
  // this list, so the constant and its two cells move in one edit. `seal` is an
  // OBJECT OR NULL, never a partially-filled shape: under three weddings there
  // is no seal, and the wire says so by absence rather than by a flag the leaf
  // has to interpret. See `sealFor` below.
  'seal',
  // ── BLOCK 19 · G3.1 — TWO MORE NAMED FIELDS (P2-A §3-1) ──────────────────
  // `b44` §2.2/§3.5 diff this list, so the constant and its cells move in one
  // edit. Neither is a flag the leaf has to interpret into prose:
  //
  //   `date_check_enabled` — R-40.77. Whether the vendor has permitted the
  //   public date check. The leaf renders the control ONLY on true. It is
  //   chrome; `public/availability.js` re-answers the same question and is the
  //   actual enforcement, because a gate that lives in a renderer is a gate a
  //   curl walks past.
  //
  //   `weddings` — an ARRAY, possibly empty, never null. Her published and
  //   consented wedding pages, newest first. Empty renders no section at all
  //   (F-40.164): a heading over nothing is a page that looks broken.
  'date_check_enabled', 'weddings',
  // ── BLOCK 19 · G3.1 s2 — WHAT GOOGLE SHOWS, AS ONE OBJECT (P2-A §3-1) ────
  // `meta` is { title, description }, ALWAYS present, never null: NULL columns
  // mean "derive", and the derivation lives HERE (`metaFor`), so the pwa leaf's
  // generateMetadata and the JSON-LD read one object and never re-derive.
  // `b44` §2.2/§3.5 and `b55` diff this list; both move in this edit
  // (F-40.168's lesson — amended by label, in the same packet).
  'meta',
]);

/**
 * THE ALLOWLISTS, AND THE ONLY PLACE A COLUMN NAME APPEARS.
 * `select('*')` is not merely discouraged here; there is no code path that
 * could produce one, because these are the strings the queries are built from.
 */
const VENDOR_SELECT    = 'id, business_name, category, city, routing_handle, status, discover_paused, date_check_enabled, about, rate_min, rate_display, seo_title, seo_description, enquiry_routing, enquiry_phone';
// G2 · the seal's own allowlist. `vendor_id` is the join key and is never sent;
// `computed_at` is selected and WITHHELD — the page shows a fact, not an audit
// trail, and "counted every night" is the room's sentence to the vendor, not the
// couple's. Two of the three states this door's header names: fetched-and-sent,
// and fetched-and-withheld.
const SEAL_SELECT      = 'vendor_id, weddings, delivery_days, computed_at';
// G3.1. Exactly what `publicWedding` consumes plus the two keys the ORDER needs
// (`event_id` to join the calendar, `wedding_date` as its fallback). Neither
// ordering key reaches the wire — `publicWedding` emits slug, title, venue, city
// and a derived SEASON, and no exact date has ever crossed this lane.
const WEDDINGS_SELECT  = 'slug, title, venue, city, event_id, wedding_date';
const PORTFOLIO_SELECT = 'image_url, caption, is_hero, position';
const DEMO_SELECT      = 'display_name, category, city, ig_handle, whatsapp_phone, active, about, photos';

/**
 * ⚠ `in_carousel` IS NOT HERE, AND ITS ABSENCE IS RULED — F-19.22.
 *
 * The P2-A kickoff §2-1 asked this door to honour `is_hero`/`in_carousel`/
 * `position`. Re-derived at origin: the couple feed — the surface whose consent
 * this route inherits (third band §4-1) — reads approved rows at
 * `src/api/couple/discover.js:109-125` with NO `in_carousel` predicate
 * anywhere; it filters on `approval_state` and orders by `position` then
 * `created_at`. Honouring the flag HERE would make the same vendor's photo set
 * differ between Discover and her own address, which is precisely the drift
 * §2-4's one-card law exists to prevent.
 *
 * CE-38 relay #1 amended §2-1: `is_hero` orders, `in_carousel` waits. The
 * column is a vendor-facing curation switch that NO reader consults — either
 * the feed is missing her switch or the column is dead. That derivation is
 * chartered to the next couple-side sitting as **F-19.22**, and `/v/` does not
 * invent an answer to it.
 *
 * AND SO IT IS NOT SELECTED EITHER. A column fetched and dropped is the census
 * lesson (b44 §3 exists because of it): selecting `in_carousel` would put it on
 * the diff as though somebody read it. It is neither fetched nor consulted, and
 * the bench asserts that at §3.7.
 */

/** One body for every miss. See the visibility note in the header. */
function notFound(res) {
  return res.status(404).json({ ok: false, error: 'Not found.' });
}

/**
 * ⚠ RUPEES, NOT PAISE — CE-38 relay #1, c-38.32 (P2-A correction 2).
 *
 * The kickoff asked for a paise integer, taking R-19.3's money law from the
 * SOLUTIONS rail. That law governs `DomainStatus.renewalPricePaise` and
 * `DomainSearchResult.pricePaise`; `public.vendors.rate_min` predates it and is
 * RUPEES — `formatRs` (`dreamos-pwa/lib/vendor/format.ts:21`) passes its
 * argument straight to `toLocaleString('en-IN')`, and `VendorProfileView:203`
 * feeds it `starting_price` raw. The couple plane reads `Rs 1,50,000` off this
 * column today. Sending paise here would give one column two units on two
 * couple-facing surfaces.
 *
 * THE FIELD IS NAMED `starting_price` for the same reason: it is the name the
 * couple shape already uses (`lib/types/discover.ts:10`), and §2-4's one-card
 * law outranks the rail's naming convention here. R-19.3 and `bs_audit` C3 each
 * take a labelled carve-out at their own site.
 *
 * ⚠ THIS TRANSFORM HAS A HOME AND THIS IS A TRANSCRIPTION OF IT.
 * `src/lib/discover/shapeVendor.js:143` is the declaration:
 *   `starting_price: v.rate_display === false ? null : (v.rate_min || null)`
 * It is not imported because that file pulls `waNumbers` and the whole discover
 * shaping graph onto an unauthenticated route. **If the two ever disagree,
 * `shapeVendor.js` wins.** One line, copied deliberately, named at both ends.
 */
function startingPrice(rate_display, rate_min) {
  return rate_display === false ? null : (rate_min || null);
}

/** F-40.277 · the trade as a word: profile label, sentence case; null for the catch-all. */
function tradeWord(category) {
  if (!category) return null;
  const { profileFor } = require('../../lib/vendor/categoryProfiles');
  const p = profileFor(category);
  if (!p || p.key === 'other' || !p.label) return null;
  const w = String(p.label).trim();
  return w.charAt(0).toUpperCase() + w.slice(1);
}

/**
 * G3.1 s2 · WHAT GOOGLE SHOWS — the one derivation (0147 §4 comments name it).
 * Her own bytes win when set; otherwise the title is `<name> · <category> · <city>`
 * (empties dropped, so a vendor with no city is not "Name · Photographer · ")
 * and the description is `about` cut at 200 — the same 200 the CHECK holds her
 * own byte to, so a derived byte is never longer than an authored one may be.
 * Exported for `b44`.
 */
function metaFor({ business_name, category, city, about, seo_title, seo_description }) {
  // F-40.277: the stored category is a KEY (`photography`); the word a couple
  // reads is the profile's label (`photographer`, categoryProfiles.js), sentence-
  // cased here because a Google title is prose. `other` maps to `vendor` and is
  // dropped — "Name · Vendor · Delhi" says nothing.
  const trade = tradeWord(category);
  const title = (seo_title && String(seo_title).trim())
    || [business_name, trade, city].map((x) => x && String(x).trim()).filter(Boolean).join(' \u00b7 ')
    || null;
  const description = (seo_description && String(seo_description).trim())
    || (about ? String(about).trim().slice(0, 200) : null)
    || null;
  return { title, description };
}

/**
 * Build the card field by named field. Nothing is spread.
 * @returns {{business_name: string|null, category: string|null, city: string|null,
 *            handle: string, is_demo: boolean, enquiry_phone: string|null,
 *            about: string|null, starting_price: number|null,
 *            photos: Array<{url: string, caption: string|null, hero: boolean, position: number}>}}
 */
function card({ business_name, category, city, handle, is_demo, enquiry_phone, about, starting_price, photos, enquire_link, seal, date_check_enabled, weddings, meta }) {
  return {
    business_name: business_name || null,
    category:      category      || null,
    city:          city          || null,
    handle,
    is_demo:       Boolean(is_demo),
    enquiry_phone: enquiry_phone || null,
    about:         about         || null,
    starting_price: starting_price == null ? null : starting_price,
    photos:        Array.isArray(photos) ? photos : [],
    // THE ONE CONTACT FIELD THE SURFACE READS. `enquiry_phone` survives beside
    // it as the RAW datum the demo leg's link is built from — it is not a second
    // way to contact anyone, and no surface reads it. Named so the next reader
    // does not take two fields for two mechanisms.
    enquire_link:  enquire_link || null,
    // G2 · an OBJECT or NULL. `sealFor` has already decided; the card does not
    // second-guess it, exactly as it does not second-guess the portfolio's cap.
    seal:          seal || null,
    // ── G3.1 · F-40.169 — THE TWO NAMES THIS BUILDER NEVER LEARNED ─────────
    // The G3.1 delivery added both to `CARD_KEYS` and to the real leg's CALL
    // SITE and never here. This function's own header says NOTHING IS SPREAD,
    // so the two arguments arrived, were not destructured, and were dropped on
    // the floor — the door advertised thirteen keys and emitted eleven.
    //
    // ⚠ THE COST WAS A DEAD PUBLIC PAGE, NOT A COSMETIC GAP. The pwa leaf reads
    // `card.weddings.length`, which on `undefined` throws inside a Server
    // Component render, so EVERY storefront 500ed — not only the vendor whose
    // switch was on. `/v/dev440` was down from P1's deploy until this cure.
    //
    // ⚠ AND `b44` HAD THREE CELLS POINTED AT EXACTLY THIS. §2.1, §2b.2 and §5.4
    // were red the moment S1 landed and were misread by this seat as stale pins.
    // `b58` §3.1 went green beside them because it asked what `CARD_KEYS`
    // CONTAINS rather than what the door EMITS — a path question where a surface
    // question was owed, which is the hollow-green class this arc had already
    // met once and did not carry forward. `b58` gains the emitted-object cell in
    // this same delivery.
    //
    // Both are coerced to a SHAPE and never passed through: absence is a false
    // and an empty list, never a missing key (§2b.2's law).
    date_check_enabled: date_check_enabled === true,
    weddings:      Array.isArray(weddings) ? weddings : [],
    // G3.1 s2 — F-40.169's lesson applied at authoring: destructured AND
    // emitted in the same edit. Coerced to a shape: an absent `meta` becomes
    // the derived one, never `undefined` on the wire.
    meta:          meta && typeof meta === 'object' ? { title: meta.title || null, description: meta.description || null } : metaFor({ business_name, category, city, about }),
  };
}

/**
 * THE SEAL'S SHAPE, AND THE VISIBILITY RULE IS NOT DECIDED HERE.
 *
 * `sealIsVisible` lives in `src/lib/vendor/seal.js` with the computation, and it
 * is imported rather than restated, because "three" appearing in two files is
 * two homes for the rule and the second one is what ships a seal at two.
 *
 * ⚠ `computed_at` IS SELECTED AND WITHHELD. A couple reads a fact; the audit of
 * when it was counted is the vendor's room's line ("Counted every night from
 * your own weddings"), not hers. This is the fetched-and-withheld state the
 * header's two-laws note names, and the third file on this door to use it.
 *
 * `delivery_days` MAY BE NULL and travels as null. A studio whose delivered
 * pages are all back-catalogue has no measurable D, and the leaf renders the
 * weddings count alone rather than inventing a number for the gap.
 *
 * NO RATING FIELD, R-G2.2: there is no source for one, and a null `rating` on
 * the wire is an invitation to render an empty star row.
 */
function sealFor(row) {
  if (!sealIsVisible(row)) return null;
  return {
    weddings:      Number(row.weddings),
    delivery_days: row.delivery_days == null ? null : Number(row.delivery_days),
  };
}

/**
 * THE PHOTO SHAPE, BUILT FIELD BY NAMED FIELD LIKE THE CARD ITSELF.
 * A row is never spread: `vendor_portfolio` carries `rejection_reason` and
 * `reviewed_by_admin` (:1102, :1100), and an admin's note about why a vendor's
 * photo was rejected has no business on a public URL.
 *
 * ⚠ NO CAP — CE-38 relay #1, c-38.33 (P2-A correction 3). The kickoff capped
 * the set at 12. The founder retired photo caps on this exact exposure class on
 * 2026-07-31 (MICRO-2, quoted at `src/lib/discover/shapeVendor.js:44`): P3's
 * five-cap and P4b's `DISPLAY_PHOTO_LIMIT` were both struck, the constant
 * DELETED rather than zeroed so a retired rule could not be re-consumed. The
 * ceiling is 20 by construction — `MAX_PORTFOLIO_IMAGES`,
 * `src/lib/vendor/portfolio.js:24` — and it belongs to the portfolio, which is
 * the right owner: the card does not get a second opinion about how many of a
 * vendor's approved photos count.
 */
function photo({ image_url, caption, is_hero, position }) {
  return {
    url:      image_url,
    caption:  caption || null,
    hero:     Boolean(is_hero),
    position: Number.isFinite(position) ? position : 0,
  };
}

router.get('/:code', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const raw = String(req.params.code || '').trim();
  if (!raw) return notFound(res);

  try {
    // ── REAL VENDORS FIRST ────────────────────────────────────────────────
    // `routing_handle` is minted UPPERCASE (`src/agent/onboarding.js:174-192`)
    // and the public URL is lowercase (`subdomainFor`, R-19.4). The code
    // arriving here may be either, so it is upper-cased for the lookup — the
    // column is UNIQUE, so one canonical form is the whole story.
    const { data: v, error: vErr } = await supabase
      .from('vendors')
      .select(VENDOR_SELECT)
      .eq('routing_handle', raw.toUpperCase())
      .maybeSingle();
    if (vErr) throw vErr;

    if (v) {
      // The vendor's own word. Both conditions checked HERE and not in the
      // query, so the reason for a miss never differs by code path either.
      //
      // ⚠ THE RETURN IS BEFORE THE PORTFOLIO READ, AND THAT ORDER IS §2-3.
      // "One switch kills the entire page, photos included." Written as a
      // filter on the photo query, that ruling would survive only as long as
      // nobody moved the filter. Written as an early return, a paused vendor's
      // portfolio is not merely withheld — it is never asked for.
      if (v.status !== 'active' || v.discover_paused === true) return notFound(res);

      // ── THE APPROVED SET, IN THE FEED'S OWN ORDER ─────────────────────────
      // `approval_state='approved'` is the consent (third band §4-1): the
      // couple feed already renders these same rows to signed-out couples on
      // the public landing, so `/v/` is that exposure class with an address.
      // NOTHING UNAPPROVED IS EVEN FETCHED.
      //
      // The order is `src/api/couple/discover.js:123-125`'s, not a new one:
      // `position` ascending, `created_at` descending as the tiebreak. `0102`
      // backfilled `position` from the old `is_hero desc, created_at desc`
      // expression, so hero-first is what position ordering PRODUCES rather
      // than a second sort this door applies. `created_at` is ordered on but
      // not selected — the same as the feed, and PostgREST allows it.
      const { data: rows, error: pErr } = await supabase
        .from('vendor_portfolio')
        .select(PORTFOLIO_SELECT)
        .eq('vendor_id', v.id)
        .eq('approval_state', 'approved')
        .order('position',   { ascending: true })
        .order('created_at', { ascending: false });
      if (pErr) throw pErr;

      // ── G2 · THE SEAL (R-G2.9) ────────────────────────────────────────────
      // ONE READ, AND A FAILURE HERE NEVER COSTS HER THE PAGE. The seal is an
      // ornament on a storefront whose job is to take an enquiry; a 500 because
      // a nightly job has not run yet would trade the whole page for a badge.
      // `maybeSingle` returns null for a vendor the sweep has never reached,
      // which is the same outcome as under three weddings, which is the same
      // outcome as an error — and all three mean the couple sees no seal.
      let sealRow = null;
      try {
        const { data: sr } = await supabase
          .from('vendor_seal')
          .select(SEAL_SELECT)
          .eq('vendor_id', v.id)
          .maybeSingle();
        sealRow = sr || null;
      } catch (_sealErr) {
        sealRow = null;
      }

      // ── G3.1 · HER REAL WEDDINGS, READ-ONLY ON THE WEDDINGS PLANE ─────────
      // The predicate is `idx_weddings_live`'s own — `visibility='published'
      // AND couple_consent = true` — the same pair `weddingPage.js` gates a
      // page on and `sealFor` counts. Three readers, ONE predicate; this door
      // re-derives none of it.
      //
      // ⚠ THE FAILURE POSTURE IS THE SEAL'S, DELIBERATELY: a throw here yields
      // an EMPTY LIST and the page still serves. Losing a storefront because a
      // secondary read hiccuped would trade the whole page for a section.
      //
      // ⚠ NEWEST FIRST BY THE CALENDAR'S DATE, THEN THE TYPED ONE. That is
      // `publicWedding`'s own order of authority (weddings.js:776) — the event
      // wins because it is the row the vendor maintains — so the ORDER and the
      // SEASON cannot disagree about which date they mean.
      let weddingRows = [];
      try {
        const { data: wr } = await supabase
          .from('weddings')
          .select(WEDDINGS_SELECT)
          .eq('owner_vendor_id', v.id)
          .eq('visibility', 'published')
          .eq('couple_consent', true);
        const rows = Array.isArray(wr) ? wr : [];
        const eventIds = rows.map((r) => r.event_id).filter(Boolean);
        const dateById = new Map();
        if (eventIds.length) {
          const { data: ev } = await supabase
            .from('events')
            .select('id, event_date')
            .in('id', eventIds);
          for (const e of (ev || [])) dateById.set(e.id, e.event_date);
        }
        weddingRows = rows
          .map((r) => ({ row: r, when: dateById.get(r.event_id) || r.wedding_date || null }))
          // Undated pages sort LAST rather than first: `null` in a descending
          // sort is not "the newest", it is "we do not know", and a page whose
          // event was deleted must not head her portfolio.
          .sort((a, b) => (b.when || '').localeCompare(a.when || ''))
          .map(({ row, when }) => publicWedding(row, when));
      } catch (_wedErr) {
        weddingRows = [];
      }

      return res.status(200).json({
        ok: true,
        card: card({
          business_name: v.business_name,
          category:      v.category,
          city:          v.city,
          handle:        String(v.routing_handle).toLowerCase(),
          is_demo:       false,
          // R-40.77. `=== true` and never `!== false`: for a consent flag the
          // two coercions disagree exactly where it matters, on a null.
          date_check_enabled: v.date_check_enabled === true,
          weddings:      weddingRows,
          meta:          metaFor(v),   // G3.1 s2 · 0147 §4: her bytes or the derivation
          // ⚠ NULL FOR EVERY REAL VENDOR, AND THAT IS THE RULING, NOT AN
          // OVERSIGHT. `public.vendors` has no phone column and no
          // "number is public" flag; a vendor's number lives on
          // `public.users.phone` (:1012), one join away. Publishing it because
          // a button needed a target would put a personal WhatsApp number on
          // an unauthenticated URL on the strength of an assumption she was
          // never asked to make. CE-38 relay #3 blocker 2, restated at the
          // third band §2-5: a `public_contact_phone` with the vendor's
          // explicit choice is priced into P2 proper. Until then, no button.
          enquiry_phone: null,
          // Built from `routing_handle` UPPERCASE — the stored byte and the one
          // Donna parses out of `TDW-<handle>`. NOT from the wire's `handle`,
          // which this door lowercases for the URL. Two cases of one value, and
          // only one of them is the message body.
          enquire_link:   enquireLinkFor({ tdwLink: ENQUIRE_BASE + String(v.routing_handle), enquiry_routing: v.enquiry_routing, enquiry_phone: v.enquiry_phone }),   // §7c, FE_2
          about:          v.about,
          starting_price: startingPrice(v.rate_display, v.rate_min),
          photos:         (rows || []).map(photo),
          seal:           sealFor(sealRow),
        }),
      });
    }

    // ── THEN DEMO VENDORS (founder ruling, 2026-08-28) ────────────────────
    // A demo vendor's address is `ig_handle` — `demo_vendors` has no
    // `routing_handle` (26 columns; witnessed in the header). This is the same
    // key `src/api/demo/vendor.js:49` reads on.
    const { data: d, error: dErr } = await supabase
      .from('demo_vendors')
      .select(DEMO_SELECT)
      .eq('ig_handle', raw)
      .eq('active', true)
      .maybeSingle();
    if (dErr) throw dErr;
    if (!d) return notFound(res);

    // ⚠ `demo_vendors.photos` IS JSONB, NOT A SECOND TABLE (:477). Its elements
    // carry `{url, is_hero?, cloudinary_id?}` — witnessed at
    // `dreamos-pwa/lib/demo/api.ts:11` and served untouched by
    // `src/api/demo/vendor.js:91`. There is NO `caption` and NO `position`:
    // the array's own order IS the order, so `position` is the index rather
    // than a column, and `caption` is null rather than invented. There is also
    // no `approval_state` — a demo set was built by an admin from work the
    // business published itself, which is why the approval gate has nothing to
    // bind here and this leg does not pretend to apply one.
    const demoPhotos = (Array.isArray(d.photos) ? d.photos : [])
      .filter((p) => p && typeof p.url === 'string' && p.url)
      .map((p, i) => photo({ image_url: p.url, caption: null, is_hero: p.is_hero, position: i }));

    return res.status(200).json({
      ok: true,
      card: card({
        business_name: d.display_name,
        category:      d.category,
        city:          d.city,
        handle:        d.ig_handle,
        is_demo:       true,
        meta:          metaFor({ business_name: d.display_name, category: d.category, city: d.city, about: d.about || null }),   // G3.1 s2
        // Shipped, per the ruling. This is the business's own public Instagram
        // contact, gathered when the demo was built — not a private line — and
        // the page states it is a demo. The asymmetry is deliberate and is
        // named on the copy register: the demo page carries one affordance the
        // real page does not yet.
        enquiry_phone: d.whatsapp_phone,
        // The demo leg keeps its own deep link — a business's own published
        // contact, on a page that states it is a demo. This is the asymmetry's
        // honest remainder after c-38.37, not the whole of it as before.
        enquire_link:  d.whatsapp_phone
          ? `https://wa.me/${String(d.whatsapp_phone).replace(/[^0-9]/g, '')}`
          : null,
        about:         d.about,
        // ── G3.1 · F-40.169 · THE ONE-CARD LAW, HELD BY `card()` AND NOT HERE
        // The first cut of this cure passed `date_check_enabled: false` and
        // `weddings: []` explicitly on this leg. DELETING THOSE TWO LINES
        // CHANGED NOTHING — `b44` stayed 59 GREEN — because `card()` already
        // coerces both: `undefined === true` is false, and a non-array becomes
        // `[]`. They were a SECOND STATEMENT of a decision that already has one
        // home, and no instrument in the estate could have held them.
        //
        // Removing them also makes `card()`'s guards LOAD-BEARING rather than
        // decorative: with nothing passed here, `weddings: weddings` raw would
        // emit a missing key on this leg and §2b.2 reddens. The demo leg's
        // silence is what gives the coercion something to do.
        //
        // A demo vendor has no calendar to permit and no wedding pages to
        // publish, so `false` and `[]` are the honest values — and they are
        // produced, once, where every other absence on this door is produced.
        // ⚠ NULL, AND NOT BECAUSE THE DEMO HAS NO PRICE — P2-A correction 5.
        // `demo_vendors.rate_display` is `text` (:476), a DISPLAY STRING like
        // "From Rs 80,000", while `vendors.rate_display` is `boolean NOT NULL`
        // (:1172), a SWITCH. Two columns, one name, two types — named at
        // `src/lib/discover/shapeVendor.js:30`. Reading the string as a switch
        // would make every non-empty demo rate truthy and every empty one
        // false, which is an answer produced by a type coercion rather than by
        // a ruling. §2-2 rules the boolean. The demo string is display material
        // for a surface that chooses to render it; it is not a rupee integer
        // and it does not belong in a field the money register formats.
        starting_price: null,
        photos:         demoPhotos,
      }),
    });
  } catch (err) {
    console.error('[public/vendorCard]', err && err.message ? err.message : err);
    // A 500 body says nothing about whether the handle exists.
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }
});

module.exports = router;
module.exports.CARD_KEYS = CARD_KEYS;
// ── F-40.169 · THE BUILDER IS EXPORTED SO A BENCH CAN ASK WHAT IT EMITS ────
// `CARD_KEYS` was already exported and `b44`/`b55`/`b58` all diffed it — and a
// field can sit in that frozen list while `card()` silently fails to produce it,
// because this function destructures by name and spreads nothing. That gap took
// every public storefront down. The declared list and the emitted object are two
// different facts; both are now reachable, and `b58` §3.1b compares them.
module.exports.card = card;
module.exports.metaFor = metaFor;   // G3.1 s2 · so b44 can prove the derivation both ways
module.exports.tradeWord = tradeWord;   // F-40.277
module.exports.VENDOR_SELECT = VENDOR_SELECT;
module.exports.SEAL_SELECT = SEAL_SELECT;   // G2 · R-G2.9, so b44 can diff it
module.exports.PORTFOLIO_SELECT = PORTFOLIO_SELECT;
module.exports.DEMO_SELECT = DEMO_SELECT;
