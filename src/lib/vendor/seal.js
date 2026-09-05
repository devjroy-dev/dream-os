// src/lib/vendor/seal.js — BLOCK 19 · G2 · THE VERIFIED SEAL.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE SOLE WRITER OF public.vendor_seal, AND NOTHING ELSE WRITES IT
// ═══════════════════════════════════════════════════════════════════════════
// The seal is the one fact on a vendor's storefront she cannot edit, and that is
// the entire trust position — string 8 on the veto sheet says so to her face:
// "Counted every night from your own weddings. It is not editable." A second
// writer anywhere would make that sentence false, so there is one, here, called
// by one cron.
//
// ── WHAT IT COUNTS, AND WHAT IT REFUSES TO COUNT ───────────────────────────
// N = published, consented wedding pages with a delivered_at. Three conditions,
// and each earns its place:
//   · delivered_at NOT NULL — `publishWedding` is its sole writer (R-G11.20), so
//     a delivered_at IS the studio's own declaration that the work is finished.
//   · visibility = 'published' — a draft is not work anybody can see.
//   · couple_consent = true — THE COUPLE'S SWITCH GOVERNS THE COUNT, not just the
//     page. A wedding she has not consented to publish must not raise his number
//     on a public storefront; counting it would route around `couple_set_publish`
//     (0132) with arithmetic. This is the same predicate `idx_weddings_live`
//     carries, deliberately, so the seal counts exactly the pages that serve.
//
// ── D, AND WHY IT IS event_date → delivered_at (R-G2.3) ────────────────────
// FORK 3's arm (b). The read-first found that arm (a) — contract signed to
// delivery — HAS NO JOIN: `public.contracts` carries neither `event_id` nor
// `wedding_id` (F-40.89), so there is no key path from a signed contract to a
// delivered wedding at this ladder. Arm (c), created_at → delivered_at, measures
// how long the vendor took to type the page in. What a couple reads "delivers in
// D days" as is *the wedding, then the photographs*, and that is this arm.
//
// PAGES WITH NO EVENT ARE EXCLUDED FROM D AND STILL COUNTED IN N. A back-
// catalogue page (event_id NULL by R-G11.21) has no wedding day on file, so it
// has no D to contribute — but it is unambiguously a delivered wedding. Folding
// it into the mean as a zero would drag every honest number down; dropping it
// from N as well would undercount her work. Two different questions, two
// different populations, said out loud because a single `WHERE` would have
// quietly answered both the same way.
//
// D IS NULL WHEN NOTHING IS MEASURABLE, NEVER 0. Zero reads as same-day delivery
// and would be the most flattering possible lie.
'use strict';

/** R-G2.2 · the floor. Under three, the seal does not exist — not a dimmed one. */
const SEAL_MIN_WEDDINGS = 3;

/**
 * The one read the count and the mean are both derived from.
 *
 * ⚠ THE JOIN IS `events(event_date)` AND IT IS NULLABLE BY CONSTRUCTION. PostgREST
 * renders a to-one embed as `null` when the FK is null, which is exactly the
 * back-catalogue case; the caller must treat that as "no D", never as an error.
 *
 * Column witnesses (SQL-provenance law), docs/db/PUBLIC_SCHEMA.md snapshot
 * 2026-09-05 @ ladder tip 0132, plus db/migrations/0131 for the table itself:
 *   public.weddings  owner_vendor_id (2) · delivered_at (8) · couple_consent (9)
 *                    · visibility (10) · event_id (3)
 *   public.events    event_date — witnessed in the events block; read only.
 */
async function deliveredPages(supabase, vendorId) {
  const { data, error } = await supabase
    .from('weddings')
    .select('id, delivered_at, event_id, events(event_date)')
    .eq('owner_vendor_id', vendorId)
    .eq('visibility', 'published')
    .eq('couple_consent', true)
    .not('delivered_at', 'is', null);
  if (error) return { ok: false, error: error.message };
  return { ok: true, rows: data || [] };
}

/**
 * PURE. Rows in, seal out — no clock, no database, no environment. The whole
 * arithmetic is testable without a fixture, which is why the cron's cell can
 * assert the numbers rather than assert that a query ran.
 */
function computeSeal(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const weddings = list.length;

  const spans = [];
  for (const w of list) {
    const ev = w && w.events;
    const eventDate = ev && ev.event_date;
    if (!eventDate || !w.delivered_at) continue;          // back-catalogue: no D
    const d0 = Date.parse(`${String(eventDate).slice(0, 10)}T00:00:00Z`);
    const d1 = Date.parse(w.delivered_at);
    if (!Number.isFinite(d0) || !Number.isFinite(d1)) continue;
    const days = Math.round((d1 - d0) / 86400000);
    // A page delivered BEFORE its own event date is not a fast studio, it is a
    // date somebody typed wrong. Dropped from the mean rather than clamped to 0,
    // because a clamp would silently improve her number using bad data.
    if (days < 0) continue;
    spans.push(days);
  }

  const deliveryDays = spans.length
    ? Math.round(spans.reduce((a, b) => a + b, 0) / spans.length)
    : null;

  return { weddings, delivery_days: deliveryDays, measured_from: spans.length };
}

/** R-G2.2 · the seal's own visibility rule, in ONE place, read by every surface. */
function sealIsVisible(seal) {
  return !!seal && Number(seal.weddings) >= SEAL_MIN_WEDDINGS;
}

/**
 * WRITE ONE VENDOR'S SEAL. Upserts on the primary key, so a studio has exactly
 * one row for its whole life and the nightly job is idempotent by construction.
 *
 * IT WRITES EVEN WHEN THE COUNT IS UNDER THREE. The row is the computation's
 * record; `sealIsVisible` is what decides whether anybody sees it. Skipping the
 * write under three would mean the night a studio crosses the line there is no
 * previous row to compare and no `computed_at` to prove the job ran on the
 * nights before it.
 */
async function recomputeVendorSeal(supabase, vendorId) {
  const read = await deliveredPages(supabase, vendorId);
  if (!read.ok) return { ok: false, vendorId, error: read.error };

  const seal = computeSeal(read.rows);
  const { error } = await supabase
    .from('vendor_seal')
    .upsert({
      vendor_id:     vendorId,
      weddings:      seal.weddings,
      delivery_days: seal.delivery_days,
      computed_at:   new Date().toISOString(),
    }, { onConflict: 'vendor_id' });

  if (error) return { ok: false, vendorId, error: error.message };
  return { ok: true, vendorId, ...seal };
}

/**
 * THE NIGHTLY SWEEP. Every active vendor, one at a time.
 *
 * ⚠ IT DOES NOT SELECT ONLY VENDORS WITH PAGES, and that is deliberate: a studio
 * whose last consented page was withdrawn must have its seal fall back to the
 * truth, and a sweep keyed on "has pages" would leave the old number standing on
 * her storefront forever. The seal is recomputed for everyone or it is not a
 * seal, it is a high-water mark.
 *
 * ONE VENDOR'S FAILURE NEVER STOPS THE NIGHT. Each is caught and counted; the
 * summary line reports scanned/written/failed so the founder can read on a quiet
 * morning that the sweep RAN — the same named-production-witness shape the relay
 * expiry sweep carries in src/cron.js.
 */
async function runSealSweep(supabase) {
  const { data, error } = await supabase
    .from('vendors')
    .select('id')
    .eq('status', 'active');
  if (error) return { ok: false, scanned: 0, written: 0, failed: 0, reason: error.message };

  const rows = data || [];
  let written = 0;
  let failed  = 0;
  for (const v of rows) {
    try {
      const r = await recomputeVendorSeal(supabase, v.id);
      if (r.ok) written++; else { failed++; console.error(`[seal] ${v.id}: ${r.error}`); }
    } catch (err) {
      failed++;
      console.error(`[seal] ${v.id}: ${err && err.message}`);
    }
  }
  return { ok: true, scanned: rows.length, written, failed, reason: null };
}

module.exports = {
  SEAL_MIN_WEDDINGS,
  computeSeal,
  sealIsVisible,
  deliveredPages,
  recomputeVendorSeal,
  runSealSweep,
};
