// src/lib/vendor/discover.js
// Discover request business logic.
'use strict';

const { portfolioSummary, MAX_PORTFOLIO_IMAGES } = require('./portfolio');
const igImport = require('./igImport');
// TDW_07 P4b · F1b — the ONE shaper. The preview mount below calls the identical function
// the public feed calls; see src/lib/discover/shapeVendor.js for why parity had to become
// a property of a shared call rather than of two payload builders agreeing.
const { shapeVendorForDiscover } = require('../discover/shapeVendor');
// TDW_07 P4b · F4 — the ONE rate predicate, shared with the completeness score so the gate
// and the meter cannot drift on "is this vendor's rate set?". It lives in a LEAF module
// (src/lib/vendor/rateMet.js) precisely so this import cannot close a cycle: profileScore.js
// already requires THIS file for MIN_PORTFOLIO_IMAGES, and importing profileScore back left
// one direction holding a stale empty exports object — the gate threw
// `profileScore.rateMet is not a function` under the reversed load order. Caught by running
// both orders. The leaf has no edges out, so no cycle can form through it.
const { rateMet } = require('./rateMet');
// TDW_07 P2 · D-2's floor RAISED 5 -> 6 at the ONE constant, CE-ruled at the P2 charter.
// This single byte moves BOTH consumers by construction: the server-side approval gate at
// :17 below, and src/lib/vendor/profileScore.js's photo term, which imports this name
// rather than minting a second copy. The pwa's own display of the number reads it from
// getDiscoverStatus's `min_portfolio_images` (added this sitting) — so no third copy of
// the number exists anywhere, in digits or in words.
const MIN_PORTFOLIO_IMAGES = 6;

async function requestDiscover(supabase, vendorId, body) {
  // TDW_07 P4b · F4 (WIDENED) — `rate_max` is no longer destructured. The submit form no
  // longer sends it, the gate no longer asks for it, and :47's write no longer stores it.
  // A body that still carries the key is accepted and ignored rather than rejected, so an
  // old client cached in someone's browser does not start failing on a field we retired.
  const { rate_min, aesthetic_tags, pitch, instagram_handle, sample_image_ids } = body;

  // THE GATE IS MIN-ONLY. Couples read a STARTING price; `rate_max` never reached a couple
  // surface for a real vendor. Requiring an upper bound to request Discover was asking the
  // vendor to invent a number nobody would read, and then blocking him on it.
  //
  // The min>max check retires WITH the bound it compared against — a comparison against a
  // field the estate no longer collects is not a weaker guard, it is an unreachable one.
  // `rateMet` is the same predicate the completeness score uses (profileScore.js), so the
  // gate and the meter cannot disagree about whether this vendor's rate is set.
  // TDW_07 MICRO-2 — FOUNDER-CHOSEN STRING, byte-exact. The P4b seat shipped the technical
  // register ("rate_min is required.") as a §0.2 surface awaiting veto; this is the veto.
  // It names the ACTION and the CONSEQUENCE — a vendor reads what to do and why — where a
  // column name told him only which field the server disliked.
  if (!rateMet({ rateMin: rate_min })) {
    return { ok: false, error: 'Add your starting rate to request Discover.' };
  }
  if (!aesthetic_tags?.length)              return { ok: false, error: 'At least one aesthetic tag required.' };
  if (aesthetic_tags.length > 10)           return { ok: false, error: 'Maximum 10 aesthetic tags.' };

  // F-07.4 RECONCILED (CE ruling, Fork 2(b)): the GATE counts every row (summary.total),
  // the SCORE and the FEED count approved rows only. Both readings are kept, deliberately:
  //   · total at the gate keeps requesting Discover SELF-SERVE. Photo approval is a
  //     standalone admin queue (src/api/admin/photos.js:37/48/60) with zero coupling to the
  //     discover request (src/api/admin/discover.js names no portfolio), so gating on
  //     `approved` would turn "upload six and ask" into "upload six and wait for an admin".
  //   · approved in the score/feed because a couple sees approved rows only, and a score
  //     crediting invisible photos would rank a card above what it renders.
  // The two numbers never contradict on screen because the Studio's gate line SHOWS BOTH.
  const summary = await portfolioSummary(supabase, vendorId);
  if (summary.total < MIN_PORTFOLIO_IMAGES) {
    return { ok: false, error: `Need at least ${MIN_PORTFOLIO_IMAGES} portfolio images. You have ${summary.total}.` };
  }

  // ── F-10.53 · THE SAMPLES VALIDATOR DIES WITH THE STEP IT GUARDED ─────────
  // THIS READ:
  //     if (sample_image_ids?.length) {
  //       const { data: imgs } = await supabase.from('vendor_portfolio')
  //         .select('id').eq('vendor_id', vendorId).in('id', sample_image_ids);
  //       if ((imgs || []).length !== sample_image_ids.length) {
  //         return { ok: false, error: 'One or more sample_image_ids do not belong to your portfolio.' };
  //       }
  //     }
  //
  // It validated ownership of three-to-five images and then WROTE THEM NOWHERE:
  // the vendor update below carries rate, tags and state; the request insert
  // carries the pitch. `grep -rn sample_image_ids src/ db/ docs/db/` returned
  // only these lines, and `sample` appears ZERO times in PUBLIC_SCHEMA.md — no
  // column existed that could have held them. A required gate on a field with no
  // reader, found by the founder walking his own submit flow.
  //
  // FOUNDER-RULED: 「 3 to 5 photo is from the legacy era. it has no bearing
  // whatso ever now 」 — so the step is deleted rather than wired to a home.
  // The pwa's step 4 goes in the paired ZIP and no caller sends the field any
  // more. WIRE-OR-DELETE-AT-BIRTH (Block 09): a validator for a field nobody
  // sends is dead code that reads like a live contract, and the next hand would
  // have believed samples were still part of the request.
  //
  // The destructure above keeps `sample_image_ids` deliberately UNUSED-BY-NAME:
  // an old client cached in a browser may still send it, and the shape stays
  // accepted-and-ignored exactly as `rate_max` is one comment up — a request that
  // suddenly 400s on a retired field is a vendor blocked by our housekeeping.

  // Update vendor profile fields
  // TDW_07 P4b · F4 — `rate_max` DROPPED from the write. The column is not dropped (ZERO
  // DDL this sitting, and its CHECK is null-tolerant); it simply stops being written. Rows
  // that already carry a max keep it untouched — this is a retirement, not a migration, and
  // nothing here reaches back over existing data.
  const vendorUpdate = { rate_min: Number(rate_min), aesthetic_tags, discover_request_state: 'requested' };
  if (instagram_handle) vendorUpdate.instagram_handle = instagram_handle;
  await supabase.from('vendors').update(vendorUpdate).eq('id', vendorId);

  // Insert request row
  const { data: req, error } = await supabase.from('vendor_discover_requests')
    .insert({ vendor_id: vendorId, state: 'requested', reason: pitch || null })
    .select().single();
  if (error) return { ok: false, error: error.message };

  return { ok: true, request_id: req.id };
}

async function getDiscoverStatus(supabase, vendorId) {
  const [vendorRes, requestRes] = await Promise.all([
    supabase.from('vendors').select('discover_request_state, discover_eligible').eq('id', vendorId).maybeSingle(),
    supabase.from('vendor_discover_requests')
      .select('id, state, decided_at, reason')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const vendor  = vendorRes.data;
  const request = requestRes.data;
  const summary = await portfolioSummary(supabase, vendorId);

  // Saves: how many times brides have saved this vendor to their Muse board.
  const { count: savesCount } = await supabase
    .from('muse_saves')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId);

  return {
    ok: true,
    // TDW_07 P2 · CE ruling §F: the SERVER carries the floor, so the pwa's rendering of it
    // is display-only truth rather than a second authority. Before this, the pwa held the
    // number twice on its own (a branch gate `< 5` and the WORD "five" in vendor copy) and
    // the raise would have left both lying while the server rejected. Comment-binding ships
    // as the fallback layer; THIS field is the mechanism.
    min_portfolio_images:   MIN_PORTFOLIO_IMAGES,
    // TDW_07 P3 · CAP SITE 4 (Fork 6, the SURFACE half). Same law as the floor
    // above, one sitting later: the pwa renders the server's number so "20" never
    // exists twice. The constant's home is src/lib/vendor/portfolio.js.
    max_portfolio_images:   MAX_PORTFOLIO_IMAGES,
    // CE §B — the IG entry is CONFIG-GATED. The surface asks the server whether
    // the seam is wired rather than holding its own opinion, so the button
    // appears when the founder sets the variables and never before. GATED-DARK
    // is the walk's word for the state this field reports as false.
    ig_import_enabled:      igImport.isConfigured(),
    discover_request_state: vendor?.discover_request_state || 'not_requested',
    discover_eligible:      vendor?.discover_eligible || false,
    portfolio_summary:      summary,
    saves_count:            savesCount || 0,
    current_request:        request || null,
    // ── F-10.44 · THE SPLIT IS MADE ON STATE, NOT LEFT TO THE SCREEN ───────────
    // `vendor_discover_requests.reason` is DOUBLE-DUTY: it holds this vendor's own
    // PITCH from the moment he requests (see requestDiscover's insert), and the
    // ADMIN'S DECISION once one lands. This field is named
    // `last_decision_reason`, and before this delivery it returned the raw column
    // — so a vendor with an OPEN request was being handed his own sentence under
    // the name of a decision. The pwa's denied branch happened to hide it
    // (app/vendor/discover/page.tsx renders it only under state==='denied'), but a
    // field that is only true because its one consumer filters it is a field
    // waiting for its second consumer.
    // Now: a decision reason exists only after a decision. The pitch is returned
    // under its own name so nothing is lost from the surface.
    // The full cure — one column per author — is DDL and belongs to 0113's
    // sitting; this is the honest bounded half.
    last_decision_reason:   (request && (request.state === 'denied' || request.state === 'revoked'))
                              ? (request.reason || null) : null,
    pitch:                  (request && (request.state === 'requested' || request.state === 'under_review'))
                              ? (request.reason || null) : null,
  };
}

// ── TDW_07 P4b · F1b/F5 — THE PREVIEW'S DATA, THROUGH THE FEED'S OWN FUNCTION ──────────
//
// "See your profile as couples do" is only true if the sentence is mechanically true. This
// function therefore does NOT build a vendor-shaped payload that resembles a card; it
// assembles the same INPUT the public feed assembles and hands it to the same shaper
// (src/lib/discover/shapeVendor.js). Parity is a property of the call, not of two
// implementations being kept in step by attention.
//
// WHY THIS IS SERVER-SIDE AT ALL. The obvious cheap build is to let the pwa read /me plus
// the portfolio and assemble the card itself. That is a second implementation of the
// shape, in another language, in another repo, where nothing can prove it agrees — the
// exact failure the spec's §3 guardrail names. One HTTP call that runs the real function
// in the real process is the only version of this feature that cannot silently drift.
//
// WHAT THE PREVIEW SHOWS THAT THE FEED CANNOT. The feed's query filters
// `discover_paused = false` and `discover_eligible = true`, so a paused or unapproved
// vendor has no row to shape. His preview must still render — that is the whole of F5's
// "reachable pre-approval". So this function reads the vendor's row directly and reports
// the two truths the surface renders around the card:
//   · `discover_paused`  → the pause banner (copy ⑤)
//   · `is_live`          → whether couples can actually reach this card right now
// Both are FACTS about production state, not preview-only decoration. A preview that
// rendered a paused vendor as live would be the costume class one surface over.
async function getDiscoverPreview(supabase, vendor) {
  const vendorId = vendor.id;

  // The approved rows, in `position` order — the identical query the feed runs at
  // src/api/couple/discover.js, including the 0102 ordering authority. The shaper applies
  // DISPLAY_PHOTO_LIMIT, so this is deliberately uncapped: capping here would be a second
  // home for the five-photo rule, which is the thing F1b exists to prevent.
  const { data: photos, error: photoErr } = await supabase
    .from('vendor_portfolio')
    .select('image_url, is_hero, position')
    .eq('vendor_id', vendorId)
    .eq('approval_state', 'approved')
    .order('position',   { ascending: true })
    .order('created_at', { ascending: false });

  if (photoErr) {
    // A preview with no photos is a HONEST preview of a profile whose photos could not be
    // read — but it must not be mistaken for "this vendor has no photos". Reported, never
    // swallowed into an empty array that looks like truth.
    return { ok: false, error: 'Could not read your portfolio.' };
  }

  // FEATURED is read the same way the feed reads it — a live vendor_featured_submissions
  // row — because the Manual honesty law is about the flag being TRUE, not about which
  // mount asked. A vendor who is featured sees the eyebrow in his preview.
  const { data: featRow } = await supabase
    .from('vendor_featured_submissions')
    .select('vendor_id')
    .eq('vendor_id', vendorId)
    .eq('state', 'approved')
    .limit(1)
    .maybeSingle();

  const card = shapeVendorForDiscover(vendor, {
    photos:   (photos || []).map(p => p.image_url).filter(Boolean),
    featured: !!featRow,
  });

  return {
    ok: true,
    vendor: card,
    // The two production truths the preview chrome renders. Named, not inferred from the
    // card — the card is what couples see, these are the conditions under which they see it.
    discover_paused:   vendor.discover_paused === true,
    discover_eligible: vendor.discover_eligible === true,
    is_live:           vendor.discover_eligible === true && vendor.discover_paused !== true,
    // The approved count is the FULL count, not the displayed five. The preview's own
    // footer tells the vendor how many of his photos reached the card, and that sentence
    // needs both numbers to be honest.
    approved_photo_count: (photos || []).length,
    displayed_photo_count: card.photos.length,
  };
}

async function withdrawRequest(supabase, vendorId) {
  const { data: req } = await supabase.from('vendor_discover_requests')
    .select('id, state').eq('vendor_id', vendorId)
    .in('state', ['requested', 'under_review'])
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (!req) return { ok: false, error: 'No pending request to withdraw.' };

  await supabase.from('vendor_discover_requests').update({ state: 'revoked' }).eq('id', req.id);
  await supabase.from('vendors').update({ discover_request_state: 'not_requested' }).eq('id', vendorId);
  return { ok: true };
}

// MIN_PORTFOLIO_IMAGES is EXPORTED (TDW_07 P1) so src/lib/vendor/profileScore.js reads
// the enforced floor rather than minting a second copy of the number. Behaviour here is
// unchanged — this line adds a name to the export object and nothing else. P2 raises the
// constant at :6 from 5 to 6 and BOTH the gate and the completeness score move together.
module.exports = { requestDiscover, getDiscoverStatus, getDiscoverPreview, withdrawRequest, MIN_PORTFOLIO_IMAGES };
