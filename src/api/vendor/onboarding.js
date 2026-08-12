// src/api/vendor/onboarding.js
// POST /api/v2/vendor/onboarding
//
// Web onboarding for vendors who joined via invite code (not WhatsApp).
//
// ═══ F-OB.2's CURE — ARC OB · CE-32 · charter OB-D · D-3 ════════════════════
// WHAT THIS ENDPOINT USED TO DO: it validated `city` and nothing else, then
// wrote onboarding_state='complete'. business_name was optional, category was
// never collected at all, and starting price arrived only as PROSE (a
// `stated_rate` sentence pasted into vendor_state's summary) — so a vendor
// could finish this form, be stamped complete, and hold none of the facts the
// estate actually needs to place her in front of a bride. That is F-OB.2, and
// it is the structural twin of F-05.18 on the couple side: A MARKER SAYING
// 'complete' OVER A ROW THAT IS NOT.
//
// WHAT IT DOES NOW: it validates through THE ONE PREDICATE HOME
// (src/lib/onboardingPredicate.js · vendorComplete), collects every mandatory
// field, and writes 'complete' ONLY when the predicate says complete. It is
// now the predicate's THIRD READER, which is exactly the shape COMMON named —
// the gate, the form's API, and the backfill all reading one definition, with
// a bench that reddens if any of them re-derives it locally.
//
// R-OB.8 HOLDS AT THIS SITE ESPECIALLY: onboarding_state is a FLOW-POSITION
// MARKER, never the predicate. Nothing here reads it to decide anything; it is
// written as a consequence of the predicate's verdict and never as a substitute
// for asking.
//
// ═══ THE REFUSAL IS ATOMIC (declared shape, CE-32 ruling fork b) ════════════
// An incomplete submission writes NOTHING — not the fields that were valid, not
// a partial row, not a half-marker. The alternative (save what came, refuse the
// stamp) was declined: it produces a row whose state depends on how many times
// a form was half-filled, and it makes "what did the vendor actually tell us?"
// unanswerable from the row alone. One submission, one verdict, one write.
// A FORM THAT WANTS TO SAVE DRAFTS IS ASKING FOR A DIFFERENT DOOR, and OB-P
// inherits that question rather than discovering this answer by accident.
//
// Handle priority: IG handle -> firstName+phone3 -> fallbacks (mirrors WA flow).
// Returns { routing_handle, tdw_link, onboarding_state } on 200.
// Idempotent — safe to call again to update a profile that is already complete.

'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

const { waNumberFor } = require('../../lib/waNumbers');
const VENDOR_WA = waNumberFor('vendor');   // F5 rider: one home for the pair

// THE ONE PREDICATE HOME. Not re-derived here, not mirrored here, not
// "simplified" here — required. R-31.1's posture applied to a predicate rather
// than a call-site list: a second copy of the completeness rule would be a
// second thing to keep true, and the arc's whole design is that there is one.
const { vendorComplete, validateServiceAreaPair } = require('../../lib/onboardingPredicate');

// THE LOCKED CATEGORY TAXONOMY, required in place (CE-32 ruling fork d).
// src/agent/categories.js holds 16 canonical tokens and is LOAD-BEARING far
// beyond the flow that happens to house it: normaliseCategory() keys
// categoryProfiles, categoryFraming and the occupancy machinery off these
// exact strings, so a free-text category is not a looser answer — it is a
// vendor whose capacity defaults, whose framing defaults, and whose profile
// score is computed against a category nothing recognises.
//
// THE REQUIRE CROSSES INTO src/agent/, AND THAT IS DECLARED, NOT ACCIDENTAL:
// the conversational onboarding flow retires under ruling ③, but its TAXONOMY
// does not retire with it. A taxonomy outliving its flow's folder is a
// move-with-readers act with its own radius; CE-32 filed it to the convenience
// shelf and refused it here. This require is the minimal arm and is expected to
// be re-pointed, not deleted, when that micro lands.
const { VENDOR_CATEGORIES } = require('../../agent/categories');

// ── API-INTERFACE STRINGS ──────────────────────────────────────────────────
// These are responses OB-P renders. The service-area sentences are NOT minted
// here: they come from the predicate's own validator, byte-identical to the
// four already shipped in src/api/vendor/me.js (one rule, three altitudes —
// 0122's DDL floor, the predicate's sentence, this edge). The bench's parity
// cell reddens if the two copies ever diverge by a character.
//
// The two below are FOUNDER-VETOED UTILITY COPY (CE-32's copy boundary: a
// vendor reads these through OB-P's form, so they take a veto like any other
// vendor-facing byte). Frozen at the byte; an edit is a fresh veto.
const INCOMPLETE_REFUSAL = 'A few details are still needed before your profile is live.';
// FOUNDER-VETOED 2026-08-12, and DELIBERATELY TAXONOMY-AGNOSTIC. An earlier
// draft enumerated the categories inside the sentence; it was refused because
// the estate's taxonomy is under active revision, and copy that names a list
// must be re-vetoed every time the list moves. This sentence outlives the
// taxonomy. THE LIST STILL REACHES THE CLIENT — as `allowed[]`, a machine field
// beside the sentence, derived at runtime and needing no veto ever again. Same
// shape as `missing[]`: the human words are frozen, the data is live.
const CATEGORY_REFUSAL   = "That isn't one of our categories. Please pick one from the list.";

// ── Starting price: one coercion, one home ─────────────────────────────────
// The column is `vendors.rate_min` (0034:8) and the predicate demands a number
// STRICTLY GREATER THAN ZERO — 0 is what an empty numeric input coerces to, and
// treating it as an answer would let a blank box satisfy a mandatory field,
// which is the precise class F-OB.2 is.
//
// A form may send 80000, "80000", or "80,000". Anything that does not resolve
// to a positive number resolves to UNDEFINED — deliberately NOT to a refusal of
// its own. An unparseable price is a price the estate does not have, so it
// falls through to the predicate and comes back as `missing: ['starting_price']`
// rather than as a third error sentence saying the same thing in other words.
function coerceRateMin(raw) {
  if (raw === undefined || raw === null) return undefined;
  const digits = String(raw).replace(/[^0-9.]/g, '');
  if (!digits) return undefined;
  const n = Math.round(Number(digits));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

// A trimmed string, or undefined. Never an empty string: an empty string in a
// write candidate is a value, and "" is not an answer to any of the six.
function trimmedOr(raw, fallback) {
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  return fallback;
}

async function generateHandle(supabase, vendorId, user, igFromBody) {
  const { data: v } = await supabase
    .from('vendors').select('instagram_handle, routing_handle').eq('id', vendorId).maybeSingle();
  if (v?.routing_handle) return v.routing_handle; // already set — keep it
  // igFromBody is read from THIS submission rather than from a pre-write of the
  // handle column. D-2's shape wrote instagram_handle to the row first so this
  // function could read it back; under the atomic-refusal rule that pre-write is
  // exactly the partial write the refusal forbids, so the value is passed in.
  const igSource  = igFromBody || v?.instagram_handle || '';
  const igHandle  = igSource.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
  const firstName = (user?.name || 'VENDOR').split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
  const phone3    = (user?.phone || '').replace(/\D/g, '').slice(-3);
  const phone4    = (user?.phone || '').replace(/\D/g, '').slice(-4);
  const candidates = [
    igHandle,
    `${firstName}${phone3}`,
    `${firstName}${phone4}`,
    `${firstName}${phone3}${phone4}`,
    `${firstName}${Date.now().toString().slice(-6)}`,
  ].filter(Boolean);
  for (const c of candidates) {
    if (!c || c.length < 2) continue;
    const { data: existing } = await supabase
      .from('vendors').select('id').eq('routing_handle', c).maybeSingle();
    if (!existing) return c;
  }
  return `VENDOR${Date.now().toString().slice(-6)}`;
}

router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const body     = req.body || {};
  const { instagram_handle, business_name, category, city, name, stated_rate } = body;

  // ── 1 · SHAPE REFUSALS — "that isn't a real answer" ──────────────────────
  // These run BEFORE completeness and are a different question from it. A field
  // can be legally ABSENT (the predicate reports it missing) or illegally
  // SHAPED (refused here). Collapsing the two would make "you haven't told us
  // yet" and "that isn't one of the options" the same reply.
  const cleanCategory = trimmedOr(category, undefined);
  if (cleanCategory !== undefined && !VENDOR_CATEGORIES.includes(cleanCategory)) {
    // Raw json() rather than errRes for the same reason the incomplete refusal
    // is: the contract carries a machine field the shared helper does not model.
    // `allowed` is READ FROM THE TAXONOMY, never restated here — a second copy
    // of the list in this file would be the mirrored-map drift (F-04.36) that
    // OB-P's picker is meant to avoid by consuming this field.
    return res.status(400).json({
      ok:      false,
      error:   CATEGORY_REFUSAL,
      code:    'CATEGORY_UNKNOWN',
      allowed: VENDOR_CATEGORIES,
    });
  }

  const saErr = validateServiceAreaPair(body);
  if (saErr) return errRes(res, 400, saErr, 'SERVICE_AREA_INVALID');

  // ── 2 · THE WRITE CANDIDATE — body over row, never body alone ────────────
  // A vendor who filled half this form last week and returns to finish it must
  // not be told she is missing what she already told us. resolveVendor() selects
  // '*', so `vendor` is the live row; the body is layered over it and the
  // PREDICATE READS THE MERGED SHAPE. Validating the body alone would refuse a
  // returning vendor for facts already on file — the exact failure mode the
  // predicate's `missing[]` exists to prevent.
  const { data: user } = await supabase
    .from('users').select('name, phone').eq('id', vendor.user_id).maybeSingle();

  const cleanIg = (instagram_handle || '').trim().replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30) || null;

  const candidateName = trimmedOr(name, user?.name);
  const candidate = {
    business_name:  trimmedOr(business_name, vendor.business_name),
    category:       cleanCategory !== undefined ? cleanCategory : vendor.category,
    city:           trimmedOr(city, vendor.city),
    rate_min:       coerceRateMin(body.rate_min) !== undefined ? coerceRateMin(body.rate_min) : vendor.rate_min,
    service_area:   body.service_area   !== undefined ? body.service_area   : vendor.service_area,
    service_cities: body.service_cities !== undefined ? body.service_cities : vendor.service_cities,
  };

  // ── 3 · THE PREDICATE IS THE ONLY JUDGE OF 'complete' ────────────────────
  const verdict = vendorComplete({ name: candidateName }, candidate);
  if (!verdict.complete) {
    // Written as a raw json() rather than through errRes because the contract
    // carries a THIRD field: `missing[]`, the machine-readable field keys OB-P
    // renders its form from. errRes's shape is { ok, error, code } and is not
    // widened for one caller. The keys are onboardingPredicate's VENDOR_FIELDS
    // vocabulary — an interface, not labels; the founder-vetoed display words
    // live in the PWA and map to these.
    return res.status(400).json({
      ok:      false,
      error:   INCOMPLETE_REFUSAL,
      code:    'INCOMPLETE',
      missing: verdict.missing,
    });
  }

  // ── 4 · COMPLETE: the writes, and only now ───────────────────────────────
  if (candidateName && candidateName !== user?.name) {
    const { error: nameErr } = await supabase
      .from('users').update({ name: candidateName }).eq('id', vendor.user_id);
    if (nameErr) return errRes(res, 500, 'Could not save profile. Please try again.');
  }

  const handle = await generateHandle(supabase, vendor.id, { name: candidateName, phone: user?.phone }, cleanIg);

  // open_to_travel IS NOT WRITTEN HERE — CE-32 ruling fork c, STOP-WRITING.
  // Migration 0122's own stamp on that column reads: 「 Do not add readers. Do
  // not write from new code. 」 This body is new code on that path, and it now
  // collects service_area/service_cities — the pair that SUPERSEDES the boolean
  // because a boolean cannot express worldwide (0122 §5: two values cannot carry
  // three states). Shipping a fresh writer of the stale field beside its own
  // replacement would be the stamp dying in the month it was written. The column
  // stays readable everywhere and is untouched on this path; its retirement from
  // 0122's reader census is recorded in the D-3 handover, and 0122 itself is
  // never edited (LD-8, append-only).
  const vendorUpdate = {
    business_name:    candidate.business_name,
    category:         candidate.category,
    city:             candidate.city,
    rate_min:         candidate.rate_min,
    service_area:     candidate.service_area,
    service_cities:   candidate.service_cities,
    routing_handle:   handle,
    onboarding_state: 'complete',
  };
  if (cleanIg) vendorUpdate.instagram_handle = cleanIg;

  const { error: vendorErr } = await supabase.from('vendors').update(vendorUpdate).eq('id', vendor.id);
  if (vendorErr) return errRes(res, 500, 'Could not save profile. Please try again.');

  // stated_rate's PROSE path, additive and untouched (CE-32: it stays). It is a
  // sentence for the model's summary, never the estate's number — `rate_min`
  // above is the number, and the predicate reads that one.
  if (stated_rate && stated_rate.trim()) {
    const displayName = candidate.business_name || candidateName || 'Vendor';
    await supabase.from('vendor_state').upsert({
      vendor_id:      vendor.id,
      summary:        `${displayName} — ${candidate.category || 'vendor'} based in ${candidate.city}. Typical rate: ${stated_rate.trim()}.`,
      pricing_policy: { stated_rate: stated_rate.trim() },
      recent_notes:   [],
      updated_at:     new Date().toISOString(),
    });
  }

  const tdwLink = `https://wa.me/${VENDOR_WA}?text=TDW-${handle}`;
  console.log(`[vendor:onboarding] complete vendor=${vendor.id} handle=${handle}`);
  return okRes(res, {
    routing_handle:   handle,
    tdw_link:         tdwLink,
    onboarding_state: 'complete',
    message:          'Profile complete.',
  });
}));

module.exports = router;
