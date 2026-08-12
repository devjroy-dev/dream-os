// src/api/vendor/me.js
// Vendor profile endpoints.
//   GET   /api/v2/vendor/me                   — profile read
//   PATCH /api/v2/vendor/me                   — profile update
//   PATCH /api/v2/vendor/me/routing-handle    — handle update (sensitive)
//   PATCH /api/v2/vendor/me/invoice-prefix    — invoice prefix update
// Auth: vendor JWT.

'use strict';

const express        = require('express');
const { waNumberFor } = require('../../lib/waNumbers');   // F5 rider
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');
const asyncHandler   = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
// TDW_04 B6-S1 (surfaces paper item 2, R-B6-16): the capacity row's ONE-HOME feeds.
// The settings surface renders the category default and its own applicability from
// THIS wire — the PWA never carries a copy of CATEGORY_CAPACITY or the profile map
// (F-04.36's family: a mirrored map is the drift). `??` not `||` everywhere below:
// 0 is a lawful posture (Q-SP-1), the exact lesson capacityCheck's header teaches.
const { CATEGORY_CAPACITY, RULED_OFF } = require('../../lib/vendor/occupancy');
const { profileFor }        = require('../../lib/vendor/categoryProfiles');
const { normaliseCategory } = require('../../lib/vendor/categoryFraming');
// F-10.92 — the lane flag has to reach the CLIENT, not just the route.
const { readLaneFlag } = require('../../lib/laneFlags');

// The stepper is for function artists only (spec P3; timelineType 'event' in the
// profile's own vocabulary) and never for RULED_OFF categories (planner: occupancy
// OFF by ruling until 04.5). Computed here, read by the PWA, one home.
function capacityFacts(category) {
  const profile = profileFor(category);
  const applicable = profile.timelineType === 'event'
    && !RULED_OFF.has(normaliseCategory(category));
  const def = CATEGORY_CAPACITY[profile.key];
  return {
    capacity_applicable: applicable,
    capacity_default:    def != null ? def : null,   // unmapped -> null (occupancy OFF until the vendor sets a number)
  };
}

router.get('/', requireAuth, resolveVendor(), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;

  // F-10.92. Fails closed to `false` on any error, exactly as readLaneFlag
  // does everywhere else — a /me that could not read the flag renders a shut
  // door, never an open one.
  const selfServeEnabled = await readLaneFlag(supabase, 'billing.selfserve_enabled');

  // Fetch users.name for the vendor.
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('name')
    .eq('id', vendor.user_id)
    .maybeSingle();

  if (userErr) {
    console.error('[GET /vendor/me] user lookup error:', userErr.message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  return res.json({
    ok: true,
    vendor: {
      id:                vendor.id,
      name:              user?.name || null,
      business_name:     vendor.business_name || null,
      category:          vendor.category || null,
      city:              vendor.city || null,
      handle:            vendor.routing_handle || null,
      upi_id:            vendor.upi_id || null,
      gstin:             vendor.gstin || null,
      open_to_travel:    vendor.open_to_travel === true,
      // ── ARC OB · 0122's superseding pair, ADDITIVE (CE-31 ruling ①) ──────
      // Nulls travel deliberately: absent is a real state here (the vendor has
      // never answered) and is exactly what the arc's predicate reads as
      // incomplete. Coercing to a default would hide the incompleteness the
      // form exists to collect. `open_to_travel` above stays until D-3 — see
      // the allowlist note; a live editor is not degraded on a guess.
      service_area:      vendor.service_area || null,
      service_cities:    vendor.service_cities || null,
      tier:              vendor.tier || null,
      founding_cohort:   vendor.founding_cohort === true,
      // ── 0115 · THE VENDOR'S OWN MONEY STATE (Fork H, arm (a)) ─────────────
      // RETIRE-WITH-THE-READER's SAFE direction: this ADDS fields to a response
      // and removes none, so no existing surface can go dark on it. A second
      // endpoint was the alternative and was declined — three scalars do not
      // earn their own route and their own client.
      //
      // No extra query: resolveVendor() selects '*' (src/api/middleware/
      // resolveVendor.js), so `vendor` already carries the 0114/0115 columns.
      //
      // NULL IS A REAL ANSWER on the link, and the surface is required to say so
      // plainly: a vendor with no link issued yet reads "not set up yet", never a
      // button that goes nowhere. `billing_status` falls back to 'none' — 0114
      // made the column NOT NULL DEFAULT 'none', so the fallback is belt-and-
      // braces for a row read before that migration, not an invented state.
      billing_status:              vendor.billing_status || 'none',
      razorpay_subscription_link:  vendor.razorpay_subscription_link || null,
      // TDW_10 BILLING v2. Carried so the surface can distinguish a vendor who
      // NEVER subscribed from one whose plan is dead — two states that were
      // indistinguishable under v1 because both showed a null link. The id is
      // NOT a secret and not actionable from the client: it is a Razorpay
      // handle, every self-serve door re-derives the vendor from her own JWT,
      // and no endpoint accepts a subscription id from the caller. It stays in
      // LOCKED_FIELDS below — readable, never PATCHable.
      razorpay_subscription_id:    vendor.razorpay_subscription_id || null,
      // ── F-10.92 ─────────────────────────────────────────────────────────
      // Acceptance ④ ratified 「 OFF = today's surface 」 and the v2 build did
      // not deliver it: `billing.selfserve_enabled` gated the ROUTE only, so a
      // flag flipped OFF produced a picker that 503s rather than a closed door.
      // A kill switch the user can still see and press is not a kill switch.
      //
      // Carried on the wire so the CLIENT can shut too. The read is laneFlags'
      // own — same 60-second cache, same fail-closed default — so the surface
      // and the route can never disagree about whether the door is open, which
      // a second client-side constant would eventually guarantee (F-04.36).
      selfserve_enabled:           selfServeEnabled,
      // Block F (migration 0034) applied these columns — real values now.
      aesthetic_tags:    vendor.aesthetic_tags    || [],
      rate_min:          vendor.rate_min          || null,
      rate_max:          vendor.rate_max          || null,
      // ── TDW_07 P4b · F-07.17 — `discover_preview` IS RETIRED BY COMMENT, ZERO DDL. ──
      // 0034 minted it as an ADMIN toggle meaning "show this vendor in the bride Discover
      // FEED preview". P4b gives the vendor his OWN preview at /vendor/discover/preview,
      // built from his own row through the feed's own shaper — a different thing entirely,
      // owned by the vendor rather than by an admin, and reachable pre-approval by design.
      // Two fields whose names both say "preview" and whose meanings do not overlap is how
      // a later reader wires the wrong one. The column is NOT dropped (zero DDL this
      // sitting) and the value is still reported here truthfully, because rows carry it and
      // hiding live data is its own dishonesty. What is retired is its FUTURE: nothing new
      // reads it, nothing new writes it, and no P4b surface consumes it.
      // Retire-or-drop is founder-sequenced; a DDL drop would be its own micro.
      discover_preview:        vendor.discover_preview        === true,
      discover_eligible:       vendor.discover_eligible       === true,
      discover_request_state:  vendor.discover_request_state  || 'not_requested',
      // TDW_04 B6-S1 (item 2): the capacity row's read half. `??` — 0 is a posture.
      slot_capacity:           vendor.slot_capacity ?? null,
      ...capacityFacts(vendor.category),
      couture_eligible:        vendor.couture_eligible        === true,
      featured_eligible:       vendor.featured_eligible       === true,
      onboarding_state:        vendor.onboarding_state        || null,
      instagram_handle:        vendor.instagram_handle        || null,
      // ── TDW_07 P2 ────────────────────────────────────────────────────────────
      // (1) F-07.9's CURE, server half. hooks/vendor/useSettings.ts:63-75 hardcoded
      //     five fields blank on load because THIS response never carried them —
      //     style_notes, travel_notes, briefing_enabled, invoice_prefix, and (worst)
      //     instagram_handle, which the response DID carry and the hook dropped
      //     anyway. Witnessed live on the test account: the routing HANDLE rendered
      //     populated two cards below an Instagram field showing its placeholder,
      //     while the column held 'Makeupbyswatiroy'. A screen cannot round-trip a
      //     value it is never told. Every field the vendor can edit now travels.
      // (2) Discover Profile reads its whole state from this one call — an editor
      //     that cannot render current state is an editor that clobbers.
      style_notes:             vendor.style_notes             || null,
      travel_notes:            vendor.travel_notes            || null,
      about:                   vendor.about                   || null,
      invoice_prefix:          vendor.invoice_prefix          || null,
      // `!== false` not `=== true`: briefing_enabled is NOT NULL DEFAULT true in the
      // schema, so a missing value means ON, and the hook's old hardcoded `true` was
      // right by accident and wrong on every opted-out vendor.
      briefing_enabled:        vendor.briefing_enabled        !== false,
      // 0101's two columns. Both NOT NULL with defaults, so `=== true`/`!== false`
      // are exact, never a guess about "not yet decided".
      rate_display:            vendor.rate_display            !== false,
      discover_paused:         vendor.discover_paused         === true,
    },
  });
});


// ─── PATCH /api/v2/vendor/me ───────────────────────────────────────────
//
// Update vendor profile fields. Locked fields rejected with 400.
// Auth: requireAuth. resolveVendor mode A.

// 0115: the money fields join the LOCKED list. ALLOWED_FIELDS below is a
// whitelist, so they were never writable — but an un-listed field is dropped
// SILENTLY behind a 200, and a vendor who PATCHes her own billing_status
// deserves a refusal she can see rather than a success she cannot verify
// (never-a-false-done). Locked here = an explicit 400, same as tier.
const LOCKED_FIELDS  = ['phone', 'routing_handle', 'tier', 'founding_cohort', 'onboarding_state', 'category',
                        'billing_status', 'razorpay_subscription_link', 'razorpay_subscription_id'];
const ALLOWED_FIELDS = ['business_name', 'style_notes', 'city', 'open_to_travel', 'travel_notes',
                        'instagram_handle', 'upi_id', 'gstin', 'briefing_enabled',
                        'aesthetic_tags', 'rate_min',
                        // TDW_07 P4b · F4 — 'rate_max' RETIRED FROM THE ALLOWLIST, dormant
                        // by comment rather than deleted, and ZERO DDL: the column stays,
                        // its CHECK is null-tolerant, and rows that already carry a value
                        // keep it untouched. Removing the name from this array is what
                        // stops NEW writes: PATCH bodies carrying rate_max are now ignored
                        // by the :173 allowlist loop rather than rejected, so an old client
                        // cached in a browser degrades quietly instead of erroring.
                        // Re-arming is this one string — deliberately one byte, so a future
                        // sitting that needs an upper bound restores it knowingly.
                        // 'rate_max',
                        // TDW_04 B6-S1 (surfaces paper item 2, F-04.64's first half, R-B6-16):
                        // the thirteenth entry — P3's "add it to the existing PATCH allowlist,
                        // smallest change", B-7's confirmed-viable path. NULL = category
                        // default; 0 is a lawful posture (Q-SP-1) — validated below, no CHECK.
                        'slot_capacity',
                        // ── TDW_07 P2 · THREE ADDITIVE ENTRIES, the same R-B6-16 path ────
                        // A dedicated route was proposed and REFUSED at the CE ruling: this
                        // handler already scopes every write with .eq('id', vendor.id), so
                        // there is no cross-vendor reach to expose, and all three are the
                        // vendor's OWN posture — pausing themselves, hiding their own rate,
                        // writing their own copy. A second route would owe a second copy of
                        // the locked-field checks and the rate guard for nothing.
                        //
                        // `about` is F-07.8's cure: vendors.about is SCORED at 0.135 by
                        // profileScore and RENDERED on the Discover card, and until this line
                        // it had ZERO writers anywhere in the estate — the exact "term nobody
                        // can raise" that profileScore's own header warns against, live since
                        // P1. Discover Profile's About section is its first writer.
                        'about', 'rate_display', 'discover_paused',
                        // ── ARC OB (CE-31 ruling ①) · SERVICE AREA, the same additive path ──
                        // 0122's two columns. THE SUPERSEDING PAIR: they replace what
                        // `open_to_travel` was trying to say, because a boolean cannot
                        // express worldwide (F-06.85 form — the mechanism is arithmetic,
                        // and it is named at 0122 §5 and at the column comment).
                        //
                        // `open_to_travel` and `travel_notes` STAY IN THIS ARRAY AT D-2, and
                        // that is a deliberate, declared choice rather than an omission:
                        // removing a name from the allowlist stops NEW WRITES (the F4
                        // precedent fourteen lines above), and this repo cannot see whether
                        // dreamos-pwa's Discover Profile still sends them. Pulling them here
                        // would degrade a live editor quietly, on a guess. Their removal —
                        // and the removal of open_to_travel from both shapes below — is D-3,
                        // coordinated with OB-P through the chair, and the arc's completion
                        // cell (zero live readers at arc close) is what enforces it.
                        'service_area', 'service_cities'];

// The three booleans the vendor may now set. Guarded on the slot_capacity pattern
// (:147 below): a 400 here, never a silent coercion. Without this, {"discover_paused":
// "maybe"} reaches Postgres raw and the answer to "am I hidden?" becomes whatever the
// driver decided that day.
const BOOLEAN_FIELDS = ['open_to_travel', 'briefing_enabled', 'rate_display', 'discover_paused'];

// ── ARC OB · SERVICE-AREA VALIDATION (CE-31 ruling ①) ──────────────────────
// A 400, never a silent coercion — the BOOLEAN_FIELDS doctrine directly above,
// applied to a three-token field. Without this, {"service_area": "maybe"} would
// reach Postgres and be refused there by constraint vendors_service_area_token
// (0122 §3) as an opaque 500. The constraint is the floor; this is the sentence
// the vendor can actually read.
//
// THE PAIRING IS ASSERTED IN THREE PLACES ON PURPOSE, and they are not
// redundant: 0122 §4 holds it in DDL (so no writer of any kind can break it),
// onboardingPredicate.serviceAreaPresent holds it in pure code (so the FORM can
// ask before a row exists to constrain), and this holds it at the API edge (so
// the vendor gets a legible refusal). One rule, three altitudes.
function validateServiceArea(body) {
  const { SERVICE_AREA_TOKENS } = require('../../lib/onboardingPredicate');
  const hasArea   = body.service_area   !== undefined;
  const hasCities = body.service_cities !== undefined;
  if (!hasArea && !hasCities) return null;

  // Refused as a PAIR. Sending one without the other would let a PATCH land a
  // row the pairing rule forbids, and the DDL would answer with a 500 the
  // vendor cannot act on.
  if (hasArea !== hasCities) {
    return 'service_area and service_cities must be sent together.';
  }
  if (!SERVICE_AREA_TOKENS.includes(body.service_area)) {
    return "service_area must be one of: " + SERVICE_AREA_TOKENS.join(', ') + '.';
  }
  const cities = body.service_cities;
  if (body.service_area === 'select_cities') {
    if (!Array.isArray(cities) || cities.filter(c => typeof c === 'string' && c.trim()).length === 0) {
      return 'service_cities must name at least one city when service_area is select_cities.';
    }
  } else if (cities !== null) {
    // Not an empty array: NULL. The pairing CHECK reads `is null`, and [] would
    // be a value that satisfies neither arm.
    return 'service_cities must be null unless service_area is select_cities.';
  }
  return null;
}

router.patch('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const body     = req.body || {};

  // Reject locked fields
  for (const field of LOCKED_FIELDS) {
    if (body[field] !== undefined) {
      return errRes(res, 400, 'Field \'' + field + '\' is locked.', 'FIELD_LOCKED');
    }
  }

  // name lives in users table — handle separately
  let updatedName = null;
  if (body.name !== undefined) {
    const trimmed = String(body.name).trim();
    if (trimmed.length > 0) {
      const { error: nameErr } = await supabase
        .from('users').update({ name: trimmed }).eq('id', vendor.user_id);
      if (nameErr) return errRes(res, 500, nameErr.message);
      updatedName = trimmed;
    }
  }

  // TDW_09 PHASE B — aesthetic_tags NORMALISES AT THIS WRITE DOOR (the one
  // writer): trim + case-fold + dedupe via src/lib/shared/tagVocabulary.js —
  // the bound mirror of the pwa vocabulary home (its header names the parity
  // arbiter). Write-side is half the F-10.52 cure; the filter door in
  // src/api/couple/discover.js is the other half. Tolerate-on-read law: legacy
  // rows are NEVER bulk-rewritten; each corrects on its vendor's next save.
  const { normalizeTags } = require('../../lib/shared/tagVocabulary');
  if (Array.isArray(body.aesthetic_tags)) body.aesthetic_tags = normalizeTags(body.aesthetic_tags);

  const update = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  // If only name was provided, skip vendors update but still return success
  let updated = null;
  if (Object.keys(update).length > 0) {
    // TDW_07 P4b · F4 (WIDENED) — THE rate_min <= rate_max GUARD IS RETIRED.
    // It compared against a bound the estate no longer collects: the submit form no longer
    // sends `rate_max`, the request gate no longer asks for it, and requestDiscover no
    // longer writes it. A guard whose right-hand side is a field nothing populates is not a
    // weaker guard — it is an unreachable one, and leaving it standing would tell the next
    // reader that an upper bound is still part of the estate's rate model.
    //
    // The `rMin`/`rMax` derivations that fed it retire WITH it, per the CE ruling on the
    // executor's §0.2 report: dead bindings are not dormancy. Nothing else read them —
    // derived by grep across this file before removal, not assumed.

    // slot_capacity guard (B6-S1): null resets to the category default; otherwise a
    // whole number, 0 included (0 = "hold nothing", a posture — Q-SP-1). Anything
    // else is a 400 here, never a silent coercion. No upper CHECK, per the ruling.
    if (update.slot_capacity !== undefined && update.slot_capacity !== null) {
      if (!Number.isInteger(update.slot_capacity) || update.slot_capacity < 0) {
        return errRes(res, 400, 'slot_capacity must be a whole number of 0 or more, or null for the category default.');
      }
    }

    for (const b of BOOLEAN_FIELDS) {
      if (update[b] !== undefined && typeof update[b] !== 'boolean') {
        return errRes(res, 400, `'${b}' must be true or false.`);
      }
    }

    // ARC OB · service area, validated on the allowlisted UPDATE rather than the
    // raw body: a field the allowlist dropped is not a field this handler is
    // writing, and refusing it would be a 400 about a value with no effect.
    const saErr = validateServiceArea(update);
    if (saErr) return errRes(res, 400, saErr);

    const { data, error } = await supabase
      .from('vendors').update(update).eq('id', vendor.id)
      .select('id, business_name, city, style_notes, open_to_travel, travel_notes, instagram_handle, about, upi_id, gstin, briefing_enabled, invoice_prefix, aesthetic_tags, rate_min, rate_max, rate_display, discover_paused, slot_capacity, discover_preview, service_area, service_cities, discover_eligible, discover_request_state, couture_eligible, featured_eligible')
      .maybeSingle();
    if (error) return errRes(res, 500, error.message);
    updated = data;
  } else if (!updatedName) {
    return errRes(res, 400, 'No editable fields provided.');
  }

  // If we only updated name, re-fetch vendor row for the response
  if (!updated) {
    const { data } = await supabase
      .from('vendors').select('id, business_name, city, style_notes, open_to_travel, travel_notes, instagram_handle, about, upi_id, gstin, briefing_enabled, invoice_prefix, aesthetic_tags, rate_min, rate_max, rate_display, discover_paused, slot_capacity, discover_preview, service_area, service_cities')
      .eq('id', vendor.id).maybeSingle();
    updated = data;
  }

  const { data: user } = await supabase.from('users').select('name').eq('id', vendor.user_id).maybeSingle();

  return okRes(res, {
    vendor: {
      id:               updated.id,
      name:             user?.name || null,
      business_name:    updated.business_name    || null,
      city:             updated.city             || null,
      open_to_travel:   updated.open_to_travel   === true,
      // ARC OB · the write's own echo, same additive rule as the GET shape.
      service_area:     updated.service_area     || null,
      service_cities:   updated.service_cities   || null,
      upi_id:           updated.upi_id           || null,
      gstin:            updated.gstin            || null,
      aesthetic_tags:   updated.aesthetic_tags   || [],
      rate_min:         updated.rate_min         || null,
      rate_max:         updated.rate_max         || null,
      // B6-S1: `??` not `||` — 0 is a posture (Q-SP-1), the capacityCheck lesson.
      slot_capacity:    updated.slot_capacity    ?? null,
      // F-07.17 — reported, not consumed. See the retirement note at the GET shape above.
      discover_preview: updated.discover_preview === true,
      // TDW_07 P2: the write's own echo. Discover Profile confirms from THIS shape, so
      // every field it can send comes back — a save that cannot be read back is a save
      // the screen has to take on faith.
      style_notes:      updated.style_notes      || null,
      travel_notes:     updated.travel_notes     || null,
      instagram_handle: updated.instagram_handle || null,
      about:            updated.about            || null,
      invoice_prefix:   updated.invoice_prefix   || null,
      briefing_enabled: updated.briefing_enabled !== false,
      rate_display:     updated.rate_display     !== false,
      discover_paused:  updated.discover_paused  === true,
    },
  });
}));

// ─── PATCH /api/v2/vendor/me/routing-handle ────────────────────────────
//
// Handle changes are sensitive — separate endpoint.
// Alphanumeric, 3-12 chars, uppercased. Globally unique.
// Auth: requireAuth. resolveVendor mode A.

router.patch('/routing-handle', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const raw      = (req.body || {}).routing_handle || '';
  const cleaned  = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (cleaned.length < 3)  return errRes(res, 400, 'Handle must be at least 3 characters.');
  if (cleaned.length > 12) return errRes(res, 400, 'Handle must be 12 characters or fewer.');

  const { data: collision } = await supabase
    .from('vendors').select('id').eq('routing_handle', cleaned).neq('id', vendor.id).maybeSingle();
  if (collision) return errRes(res, 409, 'Handle already taken.', 'HANDLE_TAKEN');

  const { error } = await supabase
    .from('vendors').update({ routing_handle: cleaned }).eq('id', vendor.id);
  if (error) return errRes(res, 500, error.message);

  const tdwNumber = waNumberFor('vendor');   // F5 rider: was the DEAD sandbox literal
  const wa_link   = 'https://wa.me/' + tdwNumber + '?text=TDW-' + cleaned;
  console.log('[me:routing-handle] ' + vendor.id + ' -> ' + cleaned);
  return okRes(res, { routing_handle: cleaned, wa_link });
}));

// ─── PATCH /api/v2/vendor/me/invoice-prefix ────────────────────────────
//
// Update invoice prefix. Counter never resets on prefix change.
// Auth: requireAuth. resolveVendor mode A.

router.patch('/invoice-prefix', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const raw      = (req.body || {}).prefix || '';
  const cleaned  = raw.toUpperCase().trim().replace(/[^A-Z0-9\-\/]/g, '');

  if (!cleaned || cleaned.length < 2)  return errRes(res, 400, 'Prefix must be at least 2 characters.');
  if (cleaned.length > 20) return errRes(res, 400, 'Prefix must be 20 characters or fewer.');

  const { data: v } = await supabase
    .from('vendors').select('invoice_counter').eq('id', vendor.id).single();

  const { error } = await supabase
    .from('vendors').update({ invoice_prefix: cleaned }).eq('id', vendor.id);
  if (error) return errRes(res, 500, error.message);

  console.log('[me:invoice-prefix] ' + vendor.id + ' -> ' + cleaned);
  return okRes(res, { prefix: cleaned, current_counter: v?.invoice_counter || 0 });
}));
module.exports = router;
