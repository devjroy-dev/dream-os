// ─────────────────────────────────────────────────────────────────────────────
// src/lib/vendor/enquiryEnrichment.js
// Phase 2 — opportunistic enquiry enrichment.
//
// When a bride enquires (via the TDW couple-agent OR the Discover in-app tap),
// the vendor's notification can carry three intelligence lines:
//   📅 Calendar  — is the vendor already busy on the wedding date?
//   🔥 Hot date  — is the date a Vivah Muhurat (peak demand)?
//   💰 Budget    — how does her budget compare to the vendor's base fee?
//
// PRINCIPLE (locked with founder): enrich on DATA PRESENCE, not on path.
// Each line is emitted ONLY when the data to compute it exists. A line with
// no data is omitted entirely — never "unknown / unknown". So:
//   - A bride who had the full TDW conversation → all three lines.
//   - An anonymous Discover tap with no date/budget → zero lines (clean).
//   - A KNOWN bride tapping Discover → we hydrate date + budget from her
//     couples profile, so she gets enrichment too — sometimes richer than the
//     conversation captured, because her bride-side profile may hold a budget
//     she never typed to the vendor.
//
// CONTRACT:
//   buildEnquiryEnrichment(supabase, {
//     vendorId,            // required — to read base fee + events
//     vendor,              // optional — if passed, avoids a re-read for base fee
//     coupleId,            // optional — if passed, hydrates date/budget from couples
//     weddingDate,         // optional — 'YYYY-MM-DD'; takes precedence over coupleId hydration
//     budgetMin,           // optional — whole rupees
//     budgetMax,           // optional — whole rupees
//   })
//     -> string  (joined enrichment lines, may be '') . NEVER throws.
//
// The returned string is ready to append to a notification. Empty string when
// nothing could be enriched, so callers concatenate freely.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

function fmtRsShort(n) {
  if (!n && n !== 0) return null;
  if (n >= 10000000) return `Rs ${(n / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (n >= 100000)   return `Rs ${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (n >= 1000)     return `Rs ${Math.round(n / 1000)}k`;
  return `Rs ${n}`;
}

// Mid-point of a min/max range (or the single value if only one is present).
function midpoint(min, max) {
  if (min != null && max != null) return Math.round((min + max) / 2);
  return min != null ? min : (max != null ? max : null);
}

async function buildEnquiryEnrichment(supabase, opts = {}) {
  try {
    const { vendorId } = opts;
    if (!vendorId) return '';

    let { vendor, coupleId, weddingDate, budgetMin, budgetMax } = opts;

    // ── Hydrate from couple profile when bride is known and fields missing ──
    // Path B (Discover tap) usually has neither date nor budget — but if she's
    // a logged-in bride, her couples row may carry both from bride-side onboarding.
    if (coupleId && (!weddingDate || budgetMin == null)) {
      const { data: couple } = await supabase
        .from('couples')
        .select('wedding_date, budget_total')
        .eq('id', coupleId)
        .maybeSingle();
      if (couple) {
        if (!weddingDate && couple.wedding_date) weddingDate = couple.wedding_date;
        // couples.budget_total is a single integer; use it for both bounds if
        // the enquiry didn't carry an explicit range.
        if (budgetMin == null && couple.budget_total) {
          budgetMin = couple.budget_total;
          budgetMax = couple.budget_total;
        }
      }
    }

    const lines = [];

    // ── 📅 Calendar: is the vendor already busy on the wedding date? ──────
    // No availability_blocks table exists; the meaningful signal is whether an
    // event (shoot/booking/etc) is already on the calendar that day.
    if (weddingDate) {
      const { data: clash } = await supabase
        .from('events')
        .select('title, kind')
        .eq('vendor_id', vendorId)
        .eq('event_date', weddingDate)
        .eq('state', 'upcoming')
        .limit(3);
      if (clash && clash.length > 0) {
        const first = clash[0];
        const label = first.title || first.kind || 'something';
        const more  = clash.length > 1 ? ` (+${clash.length - 1} more)` : '';
        lines.push(`📅 Heads up: you already have ${label}${more} on ${weddingDate}. Check before you commit.`);
      } else {
        lines.push(`📅 Your ${weddingDate} is open.`);
      }
    }

    // ── 🔥 Hot date: Vivah Muhurat? ──────────────────────────────────────
    if (weddingDate) {
      const { data: hot } = await supabase
        .from('hot_dates')
        .select('note')
        .eq('date', weddingDate)
        .limit(1);
      if (hot && hot.length > 0) {
        const note = hot[0].note ? ` (${hot[0].note})` : '';
        lines.push(`🔥 ${weddingDate} is a Vivah Muhurat — peak demand${note}.`);
      }
    }

    // ── 💰 Budget vs base fee ────────────────────────────────────────────
    // Need the vendor's base fee. Use the passed vendor object if present,
    // else read it. Compare her budget midpoint to the vendor's fee midpoint.
    const brideBudget = midpoint(budgetMin, budgetMax);
    if (brideBudget != null) {
      let feeMin = vendor?.base_fee_min;
      let feeMax = vendor?.base_fee_max;
      if (feeMin == null && feeMax == null) {
        const { data: v } = await supabase
          .from('vendors')
          .select('base_fee_min, base_fee_max')
          .eq('id', vendorId)
          .maybeSingle();
        if (v) { feeMin = v.base_fee_min; feeMax = v.base_fee_max; }
      }
      const vendorFee = midpoint(feeMin, feeMax);
      if (vendorFee != null && vendorFee > 0) {
        const deltaPct = Math.round(((brideBudget - vendorFee) / vendorFee) * 100);
        const absPct   = Math.abs(deltaPct);
        let verdict;
        if (absPct <= 5)        verdict = `right around your base fee`;
        else if (deltaPct > 0)  verdict = `${absPct}% ABOVE your base fee`;
        else                    verdict = `${absPct}% below your base fee`;
        lines.push(`💰 Her budget (${fmtRsShort(brideBudget)}) is ${verdict} (${fmtRsShort(vendorFee)}).`);
      }
    }

    return lines.join('\n');
  } catch (err) {
    // Enrichment is additive — never let it break the notification.
    console.warn('[enquiry-enrichment] failed (non-fatal):', err.message);
    return '';
  }
}

module.exports = { buildEnquiryEnrichment };
