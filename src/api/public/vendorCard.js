// src/api/public/vendorCard.js
// TDW_19 P0-B step 4 · THE PUBLIC VENDOR CARD (R-19.7, CE-38 relay #3).
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
// `rate_min`, `rate_max`, `razorpay_subscription_id`, `style_notes`. A
// `select('*')` on this route publishes a vendor's bank handle, tax number,
// password hash and pricing floor to anyone who guesses a six-character code.
// **THE SELECT BELOW IS AN ALLOWLIST AND THE BENCH DIFFS IT.**
//
// ── EVERY COLUMN NAMES ITS WITNESS (SQL-provenance law) ────────────────────
// Re-derived at `b52448f`, and the witness was staleness-tested first:
// `docs/db/PUBLIC_SCHEMA.md` snapshot tip `0125`, migrations `0126`–`0129`
// present, none touching `public.vendors` (targets: `couple_bookings`,
// `engagements`).
//
//   public.vendors                        docs/db/PUBLIC_SCHEMA.md
//     business_name    text                 :1115  (col 3)
//     category         text                 :1116  (col 4)
//     city             text                 :1118  (col 6)
//     status           text NOT NULL        :1121  (col 9,  default 'active')
//     routing_handle   text                 :1130  (col 15, NULLABLE, UNIQUE)
//     discover_paused  boolean NOT NULL     :1164  (col 48, default false)
//
//   public.demo_vendors                   docs/db/PUBLIC_SCHEMA.md
//     ig_handle        text NOT NULL        (col 2)   — a demo vendor's address
//     display_name     text NOT NULL        (col 3)
//     category         text NOT NULL        (col 4)
//     city             text NOT NULL        (col 5)
//     whatsapp_phone   text                 (col 6)
//     active           boolean NOT NULL     (col 10)
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

'use strict';

const express = require('express');
const router  = express.Router();

/**
 * THE WIRE SHAPE, DECLARED ONCE.
 *
 * ⚠ SIX KEYS, NOT THE FOUR CE-38 RELAY #3 NAMED — reported, not adapted (§0.2).
 * The relay's shape line (`business_name, category, city, handle`) was written
 * beside blocker 2's ruling, which ALSO ruled that demo vendors ship the
 * `Enquire on WhatsApp` button off `demo_vendors.whatsapp_phone`. Those two
 * cannot both hold at four keys: the button needs a number on the wire and the
 * page needs to know it is a demo.
 *
 * Rather than emit two shapes — which would give the security boundary two
 * definitions and the bench two things to chase — there is ONE shape of six
 * fixed keys. `is_demo` and `enquiry_phone` are ALWAYS PRESENT; for a real
 * vendor they are `false` and `null`. A real vendor's response therefore
 * carries no more information than the relay's four, and the allowlist stays a
 * single list the bench can diff.
 *
 * If the chair wants four keys and two shapes instead, that is one word and
 * this constant plus its bench cell move together.
 */
const CARD_KEYS = Object.freeze(['business_name', 'category', 'city', 'handle', 'is_demo', 'enquiry_phone']);

/**
 * THE ALLOWLIST, AND THE ONLY PLACE A COLUMN NAME APPEARS.
 * `select('*')` is not merely discouraged here; there is no code path that
 * could produce one, because these are the strings the query is built from.
 */
const VENDOR_SELECT = 'business_name, category, city, routing_handle, status, discover_paused';
const DEMO_SELECT   = 'display_name, category, city, ig_handle, whatsapp_phone, active';

/** One body for every miss. See the visibility note in the header. */
function notFound(res) {
  return res.status(404).json({ ok: false, error: 'Not found.' });
}

/**
 * Build the card field by named field. Nothing is spread.
 * @returns {{business_name: string|null, category: string|null, city: string|null,
 *            handle: string, is_demo: boolean, enquiry_phone: string|null}}
 */
function card({ business_name, category, city, handle, is_demo, enquiry_phone }) {
  return {
    business_name: business_name || null,
    category:      category      || null,
    city:          city          || null,
    handle,
    is_demo:       Boolean(is_demo),
    enquiry_phone: enquiry_phone || null,
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
      if (v.status !== 'active' || v.discover_paused === true) return notFound(res);
      return res.status(200).json({
        ok: true,
        card: card({
          business_name: v.business_name,
          category:      v.category,
          city:          v.city,
          handle:        String(v.routing_handle).toLowerCase(),
          is_demo:       false,
          // ⚠ NULL FOR EVERY REAL VENDOR, AND THAT IS THE RULING, NOT AN
          // OVERSIGHT. `public.vendors` has no phone column and no
          // "number is public" flag; a vendor's number lives on
          // `public.users.phone`, one join away. Publishing it because a
          // button needed a target would put a personal WhatsApp number on
          // an unauthenticated URL on the strength of an assumption she was
          // never asked to make. CE-38 relay #3 blocker 2: a
          // `public_contact_phone` with the vendor's explicit choice is
          // priced into P2's charter. Until then, no button.
          enquiry_phone: null,
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

    return res.status(200).json({
      ok: true,
      card: card({
        business_name: d.display_name,
        category:      d.category,
        city:          d.city,
        handle:        d.ig_handle,
        is_demo:       true,
        // Shipped, per the ruling. This is the business's own public Instagram
        // contact, gathered when the demo was built — not a private line — and
        // the page states it is a demo. The asymmetry is deliberate and is
        // named on the copy register: the demo page carries one affordance the
        // real page does not yet.
        enquiry_phone: d.whatsapp_phone,
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
module.exports.VENDOR_SELECT = VENDOR_SELECT;
module.exports.DEMO_SELECT = DEMO_SELECT;
