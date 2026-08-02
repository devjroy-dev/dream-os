// ─────────────────────────────────────────────────────────────────────────────
// src/lib/discover/shapeDemoRow.js
// TDW_08 · P3 — THE DEMO SPECIES' SHAPE HAS ONE AUTHOR.
//
// ── WHY THIS FILE EXISTS, AND WHY IT IS NOT IN shapeVendor.js ────────────────
// Extracted BYTE-IDENTICAL from src/api/couple/discover.js:307-362 (the inline
// `shapeDemoRow` closure at the P3 charter tip, dedented by exactly two spaces
// and by nothing else — it lived inside a route handler). Every byte of the
// function below is that function's.
//
// It moved because P3 needs a THIRD caller. The demo landing must hand the
// mirror (`components/shared/VendorProfileView`) a `DiscoverVendor`, and
// `DemoVendor` is not one: four required fields absent (`starting_price`,
// `vibe_tags`, `enquire_link`, `instagram_handle`), `photos` a different type,
// two renames. A second shaper on the client would be P4b's parity law broken
// on the exact surface that law was written for.
//
// IT IS NOT IN shapeVendor.js BECAUSE THAT FILE ALREADY RULED IT OUT, BY NAME.
// shapeVendor.js:29-33 — "THE DEMO LEG DOES NOT CALL THIS … named here so a
// later reader finds a decision instead of an oversight." The chair ruled α
// (fold it in beside `shapeVendorForDiscover`) and then dissolved that ruling
// on the executor's §0.2 report, because α reverses committed, explained ink
// whose entire purpose is to stop exactly that. A sibling file is the answer
// that file already gave. `src/lib/discover/` stays one home at the directory
// level, which is the level at which "where does this species live" is asked.
//
// `_rank_score` STAYS IN THIS SHAPE and is NOT this file's to strip. It is
// ordering machinery the feed appends and then removes at
// couple/discover.js:448-450 before anything reaches the wire. A caller that
// does not interleave — the demo landing — strips it at ITS OWN seam, because
// removing it here would change the feed's cards and this extraction changes
// nothing. See src/api/demo/vendor.js's card seam.
//
// THREE CALLERS, ALL OF THEM NAMED:
//   src/api/couple/discover.js:*  the couple feed (primary leg + cold-start widening)
//   src/api/demo/vendor.js:*      the demo landing's mirror card (P3)
// A FOURTH MUST ADD ITSELF TO THIS LIST. That sentence is the point of the list.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { normalizeIgHandle } = require('./shapeVendor');

// ── F-08.32 · A DECLARED GAP, AND IT LIVES HERE BECAUSE IT CANNOT LIVE BELOW ──
// `about` IS PASSED THROUGH UNFILTERED. There is no money guard on it anywhere on
// this path: this shaper hands it to `components/shared/VendorProfileView`, which
// renders it raw (`:190-194`). The estate's own design intent says so out loud —
// discover.js's `starting_price` line reads "rate_display is a string; client shows
// it via about" — so a demo vendor's rate is EXPECTED to travel through free text.
//
// TODAY'S ROWS ARE CLEAN BY DATA, NOT BY MECHANISM. Eleven of twelve `about` values
// are null and the twelfth carries no money (founder-pasted rows, 2026-08-03). That
// is a census, not a guard, and the register law has nothing standing in the way.
// The gap is LIVE ON THE COUPLE LANE ALREADY (sanctuary reads this same shaper);
// P3 adopts it onto a vendor-facing surface under "This is how couples see you."
//
// CURE REFUSED INSIDE P3, BY RULING: a money filter on `about` changes what couples
// see on a live path, which is neither this sitting's scope nor its to grant. It
// ships DECLARED, in the ORPHAN-LIMB LAW's DECLARED-UNREACHED shape applied to a
// filter rather than a limb — `scripts/b08_p3_seeing_surface_bench.js` §6.1 asserts
// the pass-through, so the day someone closes this gap HALFWAY the cell reddens and
// the half-cure is caught at its own bench instead of shipping as a fix.
//
// AND NOTE WHERE THIS PARAGRAPH SITS. It is above the frozen banner because the body
// below cannot carry it: any byte added inside that function breaks the byte-identity
// proof, which is the move's only witness. Every P3-era note about this function
// therefore lives in this header. A future sitting that wants to annotate the body
// must first retire §1.2 deliberately, and should not do it by accident.
//
// ═════════════════════════════════════════════════════════════════════════════
// BELOW THIS LINE, EVERY BYTE IS discover.js:307-362's, DEDENTED BY TWO SPACES.
// `scripts/b08_p3_seeing_surface_bench.js` §1 holds the pre-extraction fixture
// and reddens on a one-character drift. Do not reformat, re-wrap, or "tidy"
// this function: the proof compares it to bytes that no longer exist anywhere
// else, and a lint pass would break the only witness the move has.
// ═════════════════════════════════════════════════════════════════════════════
const shapeDemoRow = (v) => {
  // photos is a JSONB array of {url, is_hero, cloudinary_id}
  // TDW_07 MICRO-2 — the demo leg follows the real card: no display cap. It does not call
  // the shaper (different table, different columns — the reasoning is in shapeVendor.js's
  // header), but the RULE is the same rule, and a demo card capped at five while the live
  // card carries twenty would misprice the product to exactly the audience the demo
  // exists to convince. demo_vendors.photos is authored content, so its length is its own
  // bound.
  const photoUrls = (Array.isArray(v.photos) ? v.photos : [])
    .map(p => (typeof p === 'string' ? p : p?.url))
    .filter(Boolean);

  return {
    id:             v.id,
    name:           v.display_name || null,
    category:       v.category     || null,
    city:           v.city         || null,
    // ── F-07.54 CURED (CE ruled, Option 3) · THE DEMO SPECIES CARRIES NO TOKEN ──
    // `ig_handle` is NOT a routing token. The inbound resolver matches
    // `vendors.routing_handle` (vendorInbound.js:723-725) and NEVER reads
    // demo_vendors — the reader census is agentBridge · demoAdmin · demo/vendor ·
    // enquire · discover · shapeVendor · demoLeadAlert, and vendorInbound is
    // absent from it. So a bride arriving on TDW's vendor line with
    // `TDW-<ig_handle>` misses Step B, skips Step B.5 (its guard requires
    // !startsWith('TDW-')) and lands in Step C: a dead-end reply at zero
    // threads, or her enquiry delivered into an UNRELATED vendor's thread at one.
    //
    // NULLED HERE, AT THE MINT, NOT AT THE MOUNTS. Four couple-facing mounts
    // rebuild the link from this field when `enquire_link` is null
    // (sanctuary:1793 · canvas:354 · canvas:929 · demodiscover:187), so nulling
    // `enquire_link` alone would have been a green cell over an unchanged bride.
    //
    // THE D-3 CHIP IS UNAFFECTED: it reads `instagram_handle` exclusively
    // (canvas:854 · VendorProfileView:216), emitted below as its own field.
    routing_handle: null,
    starting_price: null,           // rate_display is a string; client shows it via about
    photos:         photoUrls,
    vibe_tags:      [],
    about:          v.about        || null,
    // F-07.54's other half. ENQUIRE_BASE is TDW's OWN vendor line
    // (shapeVendor.js:42) and the demo species has no lawful address on it.
    // Both fields null together: one of them alone is not a cure.
    enquire_link:   null,
    is_demo:        true,
    // D-3: "Demo vendors: same chip from their IG-sourced handle (it's the truest
    // thing on the card)." demo_vendors.ig_handle is lowercased at insert
    // (admin/demoAdmin.js:50) and is the demo card's identity.
    instagram_handle: normalizeIgHandle(v.ig_handle),
    // Demo cards are never FEATURED: featured-ness is a vendor_featured_submissions
    // row and demo vendors have no row in that table by construction (its vendor_id
    // references the real vendors plane). Stated as a constant so the field's absence
    // is never mistaken for an unread signal.
    featured:       false,
    _rank_score:    0,
  };
};

module.exports = { shapeDemoRow };
