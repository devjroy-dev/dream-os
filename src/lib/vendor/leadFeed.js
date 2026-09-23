'use strict';
// src/lib/vendor/leadFeed.js · THE LEAD FEED, ONE HOME. P7 cut 4 (CE-45 LCV-14; the chair's K3 ruling of 23 September 2026).
//
// RELOCATED, NOT REWRITTEN: src/api/vendor/worklistToday.js at 23780ed held KIND_CAP (:173), LEAD_FEED_SELECT (:195) and the lead_unanswered query
// (:254 to :259) inside its Promise.all (:241). All three move here BYTE-PRESERVED with their names unchanged; the only adaptation is the wrapper:
// newLeads(supabase, vendorId) RETURNS THE UNAWAITED query builder, so the router's Promise.all element resolves exactly as the inline query did, and
// the working door's new-leads lookup awaits the same builder. worklistToday requires the three back and re-exports LEAD_FEED_SELECT unchanged (:512's
// census still reads it). A lib never imports from a router.

// ── THE CEILINGS ───────────────────────────────────────────────────────────
// One cap for every kind, deliberately. A per-kind cap would encode a judgement
// about which kind deserves more of the vendor's screen, and D-4 already ruled
// the ranking; a second, quieter ranking hidden in the limits is not something
// anyone would find later. 20 is chosen against the founder's own test account
// shape and is a CEILING, never a promise — see `truncated` below.
const KIND_CAP = 20;

// ── THE SELECT, AS A CONSTANT (moved from worklistToday.js's SELECTS block; that block's reason stands: the census reads the SELECT this door sends by an
// independent method, and LEAD_FEED_SELECT is the one FEED_SELECT_CENSUS is pinned to).
const LEAD_FEED_SELECT     = 'id, name, wedding_date, wedding_city, budget_min, budget_max, state, created_at';

    // ── lead_unanswered · Candidate A, §8.4 ─────────────────────────────
    // NO CONTACT COLUMN IS NAMED. See the connect-gate paragraph above (in src/api/vendor/worklistToday.js, where this query stood until P7 cut 4).
    //
    // `state = 'new'` IS A CODE CONVENTION, NOT A DATABASE GUARANTEE.
    // Derived at read-first: `public.leads` carries NO state CHECK
    // constraint — the {new, contacted, quoted, booked, lost} vocabulary is
    // declared only at src/api/vendor/leads.js (symbol: the PATCH state
    // validator). §8.4 ruled Candidate A knowing it is a proxy for
    // "unanswered" rather than the fact; Candidate B
    // (pending_lead_pings.acknowledged_at) is held as a Phase 3 enrichment
    // by the same ruling. Recorded so the next reader does not mistake the
    // proxy for a guarantee.
function newLeads(supabase, vendorId) {
  return supabase.from('leads')
          .select(LEAD_FEED_SELECT)
          .eq('vendor_id', vendorId).is('deleted_at', null)
          .eq('state', 'new')
          .order('created_at', { ascending: true })   // D-4's tie rule: oldest first
          .limit(KIND_CAP + 1);                       // +1 detects truncation
}

module.exports = { KIND_CAP, LEAD_FEED_SELECT, newLeads };
