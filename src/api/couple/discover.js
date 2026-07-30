// src/api/couple/discover.js
// Public discover endpoints — no auth required.
//   GET /api/v2/discover/feed
//   GET /api/v2/discover/featured
//   GET /api/v2/discover/heroes

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// TDW_07 P4b · F1b — the couple-facing shape, the enquire base and the handle normalizer
// all moved to ONE home so the vendor's preview mount eats the identical function.
// See src/lib/discover/shapeVendor.js for the boundary and what deliberately stayed here.
const {
  shapeVendorForDiscover, normalizeIgHandle, DISPLAY_PHOTO_LIMIT, ENQUIRE_BASE,
} = require('../../lib/discover/shapeVendor');

// TDW_07 P1 — the ranking terms and their one homes.
const {
  spotlightNorm, freshnessNorm, rankScore, rankVendors, loadWeights, FRESHNESS_HORIZON_MS,
} = require('../../lib/discover/ranking');
const { computeCompleteness } = require('../../lib/vendor/profileScore');

// D-3's handle normalizer now lives at src/lib/discover/shapeVendor.js and is imported
// above. It was MOVED, not copied: the demo leg below and the preview mount both call the
// same one, so a card chip and a preview chip cannot disagree about a vendor's handle.

// ── GET /feed ─────────────────────────────────────────────────────────────────
// Returns real vendors (discover_eligible=true) UNION demo vendors
// (discover_eligible=true AND active=true). Fully filtered on both sides —
// no cross-leakage possible. Demo vendors are identified by is_demo:true in
// the response so the client can render them identically.
router.get('/feed', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const category = req.query.category || null;
  const city     = req.query.city     || null;
  const budget   = req.query.budget   || null;
  const vibes    = req.query.vibes    || null;
  const page     = Math.max(0, parseInt(req.query.page,  10) || 0);
  const limit    = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset   = page * limit;

  // ── 1. Real vendors ────────────────────────────────────────────────────────
  // TDW_07 P1: the select gains three columns, all landed by 0101 or witnessed at
  // fea5e4d in docs/db/PUBLIC_SCHEMA.md · public.vendors:
  //   instagram_handle (col 16, EXISTING)  → D-3's chip
  //   rate_display     (NEW, 0101)         → D-1's show/hide starting price
  //   discover_paused  (NEW, 0101)         → D-1's pause; the exclusion predicate below
  //
  // ⚠ DEPLOY ORDER IS LOAD-BEARING: this query names two columns that do not exist
  // until 0101 runs. Deployed ahead of the migration, PostgREST 400s and the feed goes
  // dark. The handover's smoke card runs 0101 BEFORE the git push for exactly this
  // reason, and says so in those words. This is stated, never worked around: a silent
  // retry-without-the-predicate would be a feed quietly serving paused vendors, which
  // is the failure this predicate exists to prevent.
  let realQuery = supabase
    .from('vendors')
    // TDW_07 P2: two more columns, both witnessed in docs/db/PUBLIC_SCHEMA.md ·
    // public.vendors — open_to_travel (17) and travel_notes (18). The travel TERM joins
    // profileScore this sitting; a term whose column never reaches the call scores zero
    // for everyone by OMISSION rather than by truth, which is the F-07.8 class one column
    // over. Read here so the score reads reality.
    .select('id, business_name, category, city, routing_handle, rate_min, rate_max, aesthetic_tags, about, instagram_handle, rate_display, discover_paused, open_to_travel, travel_notes', { count: 'exact' })
    .eq('discover_eligible', true)
    .eq('discover_paused', false);   // P1 item 4 — the 0101 predicate. Approval retained.

  if (category) realQuery = realQuery.eq('category', category);
  if (city)     realQuery = realQuery.ilike('city', `%${city}%`);
  if (budget)   realQuery = realQuery.lte('rate_min', parseInt(budget, 10));
  if (vibes)    realQuery = realQuery.overlaps('aesthetic_tags', vibes.split(','));

  realQuery = realQuery.order('created_at', { ascending: false });

  const { data: realVendors, error: realError, count: realCount } = await realQuery;
  if (realError) {
    console.error('[GET /discover/feed] real vendors error:', realError.message);
    return errRes(res, 500, 'Feed unavailable.');
  }

  // Fetch approved portfolio photos for real vendors.
  // TDW_07 P1: the same rows now also feed the completeness score — the FULL approved
  // count and whether a hero exists. The display list stays capped at 5 exactly as
  // before; the count is taken from every row, because a vendor's completeness is not
  // capped by what the card happens to show.
  const realIds = (realVendors || []).map(v => v.id);
  let photoMap = {};
  const approvedPhotoCount = {};
  const hasHero = {};
  if (realIds.length > 0) {
    const { data: photos } = await supabase
      .from('vendor_portfolio')
      .select('vendor_id, image_url, is_hero')
      .in('vendor_id', realIds)
      .eq('approval_state', 'approved')
      // ── TDW_07 P3 · Fork 1(a): `position` (0102) IS THE ORDER. ─────────────
      // This replaced `.order('is_hero', desc).order('created_at', desc)`, and it
      // is INVISIBLE at apply by construction: 0102 backfilled every vendor's
      // positions using exactly that old expression, so the first fetch after the
      // migration returns the identical sequence. That equality is the chair's
      // ruled acceptance property for the migration, and this is the query it is
      // a property of. is_hero is no longer an ordering key here because the row
      // at position 0 IS the cover (Fork 2(b) keeps them written by one hand);
      // it is still read below for the score's hero term, and its other three
      // consumers — :378's heroPhotoMap, src/api/vendor/collab.js:364, and the
      // pwa's meter — are untouched.
      .order('position',   { ascending: true })
      .order('created_at', { ascending: false });

    (photos || []).forEach(p => {
      if (!photoMap[p.vendor_id]) photoMap[p.vendor_id] = [];
      // ── TDW_07 P4b · F1b: THE FIVE-PHOTO RULE MOVED, IT DID NOT CHANGE. ──
      // Fork 7(b)'s "the feed stays at five" now lives at ONE home — shapeVendor.js's
      // DISPLAY_PHOTO_LIMIT — because the preview mount must obey the identical rule or
      // it teaches the vendor his card shows more than it does. This loop therefore
      // accumulates EVERY approved row and the shaper slices. Rendered output is
      // byte-identical: same first five, same `position` order. Disclosed rather than
      // silent, because the intermediate array did get longer.
      photoMap[p.vendor_id].push(p.image_url);
      approvedPhotoCount[p.vendor_id] = (approvedPhotoCount[p.vendor_id] || 0) + 1;
      if (p.is_hero) hasHero[p.vendor_id] = true;
    });
  }

  // ── 1b. The three ranking inputs (TDW_07 P1 · D-5) ─────────────────────────
  // Each read is best-effort and fails to the neutral value: a ranking input that
  // cannot be read contributes ZERO for everyone, which leaves the existing
  // created_at-desc order standing. A feed does not 500 because a signal is missing.
  const spotlightIds  = new Set();
  const featuredIds   = new Set();
  const lastActiveAt  = {};
  const nowIso        = new Date().toISOString();

  if (realIds.length > 0) {
    const freshnessCutoff = new Date(Date.now() - FRESHNESS_HORIZON_MS).toISOString();

    const [spotRes, featRes, actRes] = await Promise.all([
      // Spotlight: presence of an ACTIVE card. `active` IS the editorial decay
      // (admin/spotlight.js:57 is the retire flip) — see ranking.js's term-1 note.
      supabase.from('spotlight').select('vendor_id').eq('active', true).in('vendor_id', realIds),
      // FEATURED-now (CE ruling §C/F5): an APPROVED submission whose scheduled window
      // contains this instant. vendors.featured_eligible answers ELIGIBILITY, a
      // different question, and is deliberately not read here.
      supabase.from('vendor_featured_submissions')
        .select('vendor_id, scheduled_start, scheduled_end')
        .eq('state', 'approved')
        .in('vendor_id', realIds)
        .lte('scheduled_start', nowIso)
        .gte('scheduled_end', nowIso),
      // Freshness: MAX(created_at) per vendor from the live cross-surface activity log.
      // Ordered desc and taken first-wins, so one pass yields the max per vendor.
      supabase.from('vendor_activity_log')
        .select('vendor_id, created_at')
        .in('vendor_id', realIds)
        .gte('created_at', freshnessCutoff)
        .order('created_at', { ascending: false }),
    ]);

    if (spotRes.error) console.warn('[GET /discover/feed] spotlight read failed (non-fatal):', spotRes.error.message);
    else (spotRes.data || []).forEach(r => { if (r.vendor_id) spotlightIds.add(r.vendor_id); });

    if (featRes.error) console.warn('[GET /discover/feed] featured read failed (non-fatal):', featRes.error.message);
    else (featRes.data || []).forEach(r => { if (r.vendor_id) featuredIds.add(r.vendor_id); });

    if (actRes.error) console.warn('[GET /discover/feed] activity read failed (non-fatal):', actRes.error.message);
    else (actRes.data || []).forEach(r => { if (r.vendor_id && !lastActiveAt[r.vendor_id]) lastActiveAt[r.vendor_id] = r.created_at; });
  }

  const weights = await loadWeights(supabase);
  const rankNow = Date.now();

  const shapedReal = (realVendors || []).map(v => {
    const completeness = computeCompleteness({
      approvedPhotoCount: approvedPhotoCount[v.id] || 0,
      hasHero:            !!hasHero[v.id],
      about:              v.about,
      aestheticTags:      v.aesthetic_tags,
      rateMin:            v.rate_min,
      rateMax:            v.rate_max,
      instagramHandle:    v.instagram_handle,
      // The STATED policy, never the boolean — see profileScore.js's header for the ruling.
      travelNotes:        v.travel_notes,
    });
    const terms = {
      spotlight:    spotlightNorm(v.id, spotlightIds),
      freshness:    freshnessNorm(lastActiveAt[v.id] || null, rankNow),
      completeness: completeness,
    };
    // TDW_07 P4b · F1b — the shape is the shaper's word, not this file's. Everything the
    // couple sees is decided at src/lib/discover/shapeVendor.js and the preview mount
    // calls the identical function on the identical input shape. `_rank_score` is appended
    // HERE and only here: the preview has no rank, so rank cannot live in a function both
    // mounts call.
    return {
      ...shapeVendorForDiscover(v, {
        photos:   photoMap[v.id] || [],
        featured: featuredIds.has(v.id),
      }),
      _rank_score: rankScore(terms, weights),
    };
  });

  // ── 2. Demo vendors (discover_eligible=true AND active=true only) ──────────
  let demoQuery = supabase
    .from('demo_vendors')
    .select('id, display_name, category, city, ig_handle, rate_display, photos, about')
    .eq('discover_eligible', true)
    .eq('active', true);

  if (category) demoQuery = demoQuery.eq('category', category);
  if (city)     demoQuery = demoQuery.ilike('city', `%${city}%`);
  // budget filter not applied to demo vendors — rate_display is a string not int
  // vibes filter not applied — demo vendors don't have aesthetic_tags yet

  demoQuery = demoQuery.order('created_at', { ascending: false });

  const { data: demoVendors, error: demoError } = await demoQuery;
  if (demoError) {
    // Non-fatal — if demo table query fails, still return real vendors
    console.error('[GET /discover/feed] demo vendors error:', demoError.message);
  }

  const shapedDemo = (demoVendors || []).map(v => {
    // photos is a JSONB array of {url, is_hero, cloudinary_id}
    // TDW_07 P4b · F1b — the demo leg does not call the shaper (different table, different
    // columns; the reasoning is stated in shapeVendor.js's header), but the NUMBER is the
    // same number. It reads from the shaper's constant so a future change to the display
    // rule cannot move the real card and leave the demo card at a stale literal.
    const photoUrls = (Array.isArray(v.photos) ? v.photos : [])
      .slice(0, DISPLAY_PHOTO_LIMIT)
      .map(p => (typeof p === 'string' ? p : p?.url))
      .filter(Boolean);

    return {
      id:             v.id,
      name:           v.display_name || null,
      category:       v.category     || null,
      city:           v.city         || null,
      routing_handle: v.ig_handle    || null,
      starting_price: null,           // rate_display is a string; client shows it via about
      photos:         photoUrls,
      vibe_tags:      [],
      about:          v.about        || null,
      enquire_link:   v.ig_handle ? `${ENQUIRE_BASE}${v.ig_handle}` : null,
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
  });

  // ── 3. Merge, shuffle slightly so demos don't always cluster, paginate ─────
  const combined = [...shapedReal, ...shapedDemo];
  // Stable interleave: insert demo vendors at every ~5th position so they
  // feel natural in the feed rather than all appearing at the end.
  const interleaved = [];
  let di = 0;
  const demoOnly  = combined.filter(v => v.is_demo);
  // TDW_07 P1 · D-5, order of operations ruled at CE §C/F4: RANK FIRST, INTERLEAVE
  // AFTER. rankVendors orders the REAL leg only and is stable, so an all-zero-score
  // feed comes out in exactly today's created_at-desc order. The every-5th position
  // law below is byte-unchanged — ranking decides WHICH real vendor sits in a slot,
  // never where the demo slots fall.
  const realOnly  = rankVendors(combined.filter(v => !v.is_demo));
  realOnly.forEach((v, i) => {
    interleaved.push(v);
    if ((i + 1) % 5 === 0 && di < demoOnly.length) {
      interleaved.push(demoOnly[di++]);
    }
  });
  // Append any remaining demo vendors
  while (di < demoOnly.length) interleaved.push(demoOnly[di++]);

  const total    = interleaved.length;
  // `_rank_score` is ORDERING MACHINERY, not contract. It is stripped here so the
  // response carries no field lib/types/discover.ts does not declare — F-07.3's disease
  // (a type behind its own wire) is cured in this sitting and not re-minted in it.
  // The smoke card's step ④ evidence is the ORDER, which is what a weight flip moves.
  const paginated = interleaved
    .slice(offset, offset + limit)
    .map(({ _rank_score, ...card }) => card);   // eslint-disable-line no-unused-vars

  return okRes(res, {
    vendors:  paginated,
    page,
    has_more: total > offset + limit,
    total,
  });
}));

// ── GET /featured ─────────────────────────────────────────────────────────────
router.get('/featured', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  // Try featured_boards table — may not exist yet; fall back to editorial seed.
  const { data: boards, error } = await supabase
    .from('featured_boards')
    .select('id, title, subtitle, cover_image, vendor_ids')
    .eq('active', true)
    .order('display_order', { ascending: true })
    .limit(10);

  if (!error && boards && boards.length > 0) {
    return okRes(res, { collections: boards });
  }

  // Editorial seed fallback — group discover-eligible vendors by category
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, category')
    .eq('discover_eligible', true)
    .limit(50);

  const grouped = {};
  (vendors || []).forEach(v => {
    const cat = v.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(v.id);
  });

  const collections = Object.entries(grouped).map(([cat, ids]) => ({
    id:          `editorial-${cat}`,
    title:       cat.charAt(0).toUpperCase() + cat.slice(1) + 's',
    subtitle:    'Curated by TDW',
    cover_image: null,
    vendor_ids:  ids,
  }));

  return okRes(res, { collections });
}));

// ── GET /heroes ───────────────────────────────────────────────────────────────
router.get('/heroes', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  // Try discover_heroes table — may not exist yet; fall back to top 3 by created_at.
  const { data: heroes, error } = await supabase
    .from('discover_heroes')
    .select('id, name, image_url, caption, routing_handle')
    .eq('active', true)
    .order('display_order', { ascending: true })
    .limit(3);

  if (!error && heroes && heroes.length > 0) {
    const shaped = heroes.map(h => ({
      ...h,
      enquire_link: h.routing_handle ? `${ENQUIRE_BASE}${h.routing_handle}` : null,
    }));
    return okRes(res, { heroes: shaped });
  }

  // Fallback — top 3 discover-eligible vendors
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, business_name, routing_handle')
    .eq('discover_eligible', true)
    .order('created_at', { ascending: false })
    .limit(3);

  // Grab first hero portfolio image for each
  const vendorIds = (vendors || []).map(v => v.id);
  let heroPhotoMap = {};
  if (vendorIds.length > 0) {
    const { data: photos } = await supabase
      .from('vendor_portfolio')
      .select('vendor_id, image_url')
      .in('vendor_id', vendorIds)
      .eq('approval_state', 'approved')
      .eq('is_hero', true)
      .limit(vendorIds.length);

    (photos || []).forEach(p => { heroPhotoMap[p.vendor_id] = p.image_url; });
  }

  const shaped = (vendors || []).map(v => ({
    id:             v.id,
    name:           v.business_name    || null,
    image_url:      heroPhotoMap[v.id] || null,
    caption:        null,
    routing_handle: v.routing_handle   || null,
    enquire_link:   v.routing_handle   ? `${ENQUIRE_BASE}${v.routing_handle}` : null,
  }));

  return okRes(res, { heroes: shaped });
}));

module.exports = router;
