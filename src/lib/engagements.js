// src/lib/engagements.js
// TDW_16 · P1 — THE ENGAGEMENT SPINE'S ONE HOME.
//
// ═════════════════════════════════════════════════════════════════════════════
// THE SOLE-WRITER / SOLE-READER LAW APPLIES TO THIS FILE BY NAME.
// ═════════════════════════════════════════════════════════════════════════════
// `public.engagements` is read here and NOWHERE ELSE. It is written here and
// NOWHERE ELSE. Acceptance criterion 1 of TDW_16_BRIDGE_FINAL.md is a GREP GATE:
// `getEngagement` is the only reader both surfaces use. A handler that reaches
// for `.from('engagements')` directly has broken the block's first promise, and
// scripts/b16_p1_engagements_bench.js §2 walks the source tree to catch exactly
// that — it does not read a list of consumers someone wrote down, because a list
// someone wrote down is the defect (R-31.1's habit, borrowed).
//
// ═════════════════════════════════════════════════════════════════════════════
// THE KEY IS THE PAIR (R-35.32, curing F-16.17) — AMENDED AFTER 0090 SHIPPED.
// ═════════════════════════════════════════════════════════════════════════════
// This file was born keying on (couple_id, vendor_id, category), because the
// spec said so. 0127 dropped the third column and this file moved with it.
// THE REASON, so nobody restores the triple from memory: `vendors.category` is
// a SINGLE free-text column, so a vendor holds exactly one category and the
// third key column discriminated NOTHING — it only let one relationship split
// into two rows when he edited his profile. The founder's own test vendor had
// already done it: enquired-as 'Event planner', live as 'photography'.
//
// `category` IS NOW A TRACKING SNAPSHOT. Every writer below refreshes it from
// the vendor's live category, so the column follows him. It is NOT history:
// history lives in the artifacts this row points at — couple_enquiries
// .vendor_category holds what he was when she enquired, couple_bookings
// .category holds what she booked him for. This column is not trying to be
// either, and a reader who wants either should follow the ref.
//
// ⚠ getEngagement TAKES TWO IDENTIFIERS, NOT THREE. The charter named a
// three-argument resolver; R-35.32 supersedes it. Filtering the READ on
// category would move the fragmentation bug from the writer to the reader —
// the row would simply go missing the day the vendor re-categorised, which is
// a worse failure than a duplicate because nothing looks wrong.
//
// ═════════════════════════════════════════════════════════════════════════════
// R-35.31 — normaliseCategory IS THE RULING AUTHORITY ON CATEGORY IDENTITY.
// ═════════════════════════════════════════════════════════════════════════════
// Every write below routes `category` through `normaliseCategory()`. Not a copy
// of it, not an inline membership test, not the caller's raw string. THE REASON
// THIS IS LAW AND NOT PREFERENCE: `category` is one third of this table's unique
// key, so a token written wrong is not a display bug that a later edit repairs —
// it is the relationship's IDENTITY, permanently, and TDW_16 P2's signal
// matching keys on it.
//
// The census that forced the ruling: the estate's only non-conforming enquiry
// carried the free text 'Event planner'. 0126's committed sweep would have sent
// it to 'other'; normaliseCategory sends it to 'planning' (pass-3 contains
// ladder). Two committed homes, opposite answers, on half the backfill. F-16.15.
// The chair ruled ONE function answers at mint-time and forever after —
// 0090 carries this function's transcribed verdict for the rows that already
// existed, and this file calls the function itself for every row born after.
//
// THE FORCING FUNCTION: normaliseCategory's own load-time invariant
// (src/lib/vendor/categoryFraming.js) refuses to boot a tree whose alias targets
// are not in VENDOR_CATEGORIES. So an alias edit that would put a stray token
// into this table's key column crashes at require time, before any row is
// written. That is stronger than a check here could ever be, and it is why this
// file does not restate the eleven.

'use strict';

const { normaliseCategory } = require('./vendor/categoryFraming');

// ── STATUS IS MONOTONIC (R-35.30, fork 5) ───────────────────────────────────
// The relationship never walks backward. She enquires, she books; a second
// enquiry months later does not un-book him.
//
// This ladder must stay byte-equal to `engagements_status_check` in
// 0090_engagements.sql. The bench derives the constraint's list OFF DISK and
// compares it to this object — so if a future migration widens the vocabulary
// and forgets this file, the cell reddens rather than a status silently
// refusing to advance.
//
// ⚠ P1 WRITES EXACTLY TWO OF THESE: 'enquiry' and 'booked'. 'proposal' and
// 'thread' are P2's (the signal's intro card and her opening contact);
// 'completed' and 'closed' have no writer chartered yet. They are ranked here
// rather than omitted because the LADDER is what makes the guard correct — a
// rank table that only knows the tokens it writes would let P2's 'thread'
// silently overwrite a 'booked' the day P2 lands.
const STATUS_RANK = Object.freeze({
  enquiry:   0,
  proposal:  1,
  thread:    2,
  booked:    3,
  completed: 4,
  // 'closed' outranks everything: she closed the door. Whether a later enquiry
  // may REOPEN a closed engagement is P2's ruling to make (it owns her consent
  // surface and the close verb), not this file's to assume. Until P2 rules,
  // nothing here can move a closed row, and that silence is deliberate.
  closed:    5,
});

function rankOf(status) {
  return Object.prototype.hasOwnProperty.call(STATUS_RANK, status)
    ? STATUS_RANK[status]
    : -1;
}

// The statuses a row must currently hold for `target` to be a genuine ADVANCE.
// Used as a PostgREST `.in()` filter, so the monotonicity is enforced BY THE
// DATABASE in the same statement that writes — not by a read-then-write that
// two concurrent taps could interleave through.
function statusesBelow(target) {
  const t = rankOf(target);
  return Object.keys(STATUS_RANK).filter(s => STATUS_RANK[s] < t);
}

// ── THE ONLY READER ─────────────────────────────────────────────────────────
// Returns the engagement row for one relationship, or null. Never throws:
// callers on both planes treat an absent engagement as "no relationship yet",
// which is a real answer and not an error.
async function getEngagement(supabase, coupleId, vendorId) {
  if (!supabase || !coupleId || !vendorId) return null;

  const { data, error } = await supabase
    .from('engagements')
    .select('id, couple_id, vendor_id, category, status, source, enquiry_id, couple_booking_id, lead_id, created_at, updated_at')
    .eq('couple_id', coupleId)
    .eq('vendor_id', vendorId)
    .maybeSingle();

  if (error) {
    console.error('[engagements] getEngagement error:', error.message);
    return null;
  }
  return data || null;
}

// Mint the row if it is not there. Never clobbers an existing relationship:
// `ignoreDuplicates` means a concurrent tap that lost the race leaves the
// winner's row exactly as it found it, and the caller's own stamp/advance step
// below does the rest.
async function mint({ supabase, coupleId, vendorId, category, status, source }) {
  const { error } = await supabase
    .from('engagements')
    .upsert({
      couple_id:  coupleId,
      vendor_id:  vendorId,
      category:   normaliseCategory(category),
      status,
      source,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'couple_id,vendor_id', ignoreDuplicates: true });

  if (error) console.error('[engagements] mint error:', error.message);
  return !error;
}

// ── WRITER 1 · THE ENQUIRY DOOR ─────────────────────────────────────────────
// Called from src/api/couple/enquire.js after her enquiry row lands.
//
// `enquiryId` is STAMPED UNCONDITIONALLY and that is safe, not sloppy:
// `couple_enquiries_couple_vendor_uidx` (PUBLIC_SCHEMA.md :2608) is UNIQUE on
// (couple_id, vendor_id), so a re-enquiry upserts the SAME row and hands back
// the SAME id. There is no second enquiry id that could overwrite the first.
//
// `leadId` is `public.leads.id` — the row the vendor's Leads tab reads. It is
// NOT `couple_enquiries.vendor_lead_id`, which holds an ENGINE BINDER id
// despite its name (F-16.7, queued for rename, not renamed here). Passing the
// wrong one would put binder uuids behind an FK pointing at public.leads.
async function recordEnquiry({ supabase, coupleId, vendorId, category, enquiryId, leadId }) {
  if (!supabase || !coupleId || !vendorId) return false;

  // F-16.10: `leads.source` goes on writing 'discover' and is not touched. The
  // vocabularies meet HERE, at the one door that owns both words.
  await mint({ supabase, coupleId, vendorId, category, status: 'enquiry', source: 'discover_enquiry' });

  // The category REFRESH rides the same statement that stamps the refs — one
  // write, so the column cannot drift from the vendor between two round trips.
  const patch = { updated_at: new Date().toISOString(), category: normaliseCategory(category) };
  if (enquiryId) patch.enquiry_id = enquiryId;
  if (leadId)    patch.lead_id    = leadId;

  const { error } = await supabase
    .from('engagements')
    .update(patch)
    .eq('couple_id', coupleId)
    .eq('vendor_id', vendorId);

  if (error) {
    console.error('[engagements] recordEnquiry stamp error:', error.message);
    return false;
  }
  return true;
}

// ── WRITER 2 · THE BOOKING DOORS ────────────────────────────────────────────
// Called from src/api/couple/bookings.js when a booking carries a vendor_id.
//
// `couple_booking_id` is stamped ONLY WHERE IT IS STILL NULL — FIRST BOOKING
// WINS. Unlike the enquiry side there is no unique key making the booking id
// stable: `couple_bookings` permits many rows for one (couple, vendor,
// category), so an unguarded stamp would let her second booking silently
// re-point the relationship at a different artifact. The guard is the ruling
// that the FIRST commitment is the one the spine remembers; a later booking
// keeps its own row and its own money, untouched.
//
// The status advance is a SEPARATE statement with a `.in()` guard, so it is
// monotonic at the database. If she was already 'completed', 'booked' is not an
// advance and this write correctly moves nothing.
//
// ── THIS WRITER RESOLVES THE CATEGORY ITSELF, AND TAKES NONE (R-35.32) ──────
// It deliberately does NOT accept a `category` argument. The booking door has
// one to hand — `couple_bookings.category`, the category SHE chose when she
// filed the booking — and passing it would put a second meaning into a column
// the enquiry door fills from the VENDOR. Two meanings in one column is the
// disease this file exists to prevent, so the resolution lives here, once.
// (The enquiry door is asymmetric on purpose: it already holds the live vendor
// row it just read, so it passes that category rather than paying for a second
// round trip to learn what it already knows.)
async function recordBooking({ supabase, coupleId, vendorId, bookingId, source }) {
  if (!supabase || !coupleId || !vendorId) return false;

  const { data: v, error: vErr } = await supabase
    .from('vendors').select('category').eq('id', vendorId).maybeSingle();
  if (vErr) console.error('[engagements] recordBooking vendor read error:', vErr.message);
  // No vendor row, or a vendor with no category set: normaliseCategory's own
  // default answers 'other'. The relationship is still real and still recorded.
  const category = v && v.category;

  await mint({
    supabase, coupleId, vendorId, category,
    status: 'booked',
    source: source || 'direct',
  });

  const now = new Date().toISOString();

  if (bookingId) {
    const { error: refErr } = await supabase
      .from('engagements')
      .update({ couple_booking_id: bookingId, updated_at: now, category: normaliseCategory(category) })
      .eq('couple_id', coupleId)
      .eq('vendor_id', vendorId)
      .is('couple_booking_id', null);
    if (refErr) console.error('[engagements] recordBooking ref error:', refErr.message);
  }

  const { error: stErr } = await supabase
    .from('engagements')
    .update({ status: 'booked', updated_at: now, category: normaliseCategory(category) })
    .eq('couple_id', coupleId)
    .eq('vendor_id', vendorId)
    .in('status', statusesBelow('booked'));

  if (stErr) {
    console.error('[engagements] recordBooking status error:', stErr.message);
    return false;
  }
  return true;
}

// ── THE SECOND READER (R-35.35) — BATCHED, NEVER PER-ROW ────────────────────
// The Business Leads surface asks a question `getEngagement` structurally
// cannot answer. That resolver is PAIR-KEYED — (couple_id, vendor_id) — and
// Business Leads holds `leads` rows, which carry no couple_id. The linkage runs
// the other way: engagements.lead_id → leads.id. So "is this lead
// linkage-backed?" needed its own shape, and this is it.
//
// IT LIVES HERE BECAUSE THE GREP GATE WALKS FILES, NOT FUNCTION NAMES
// (scripts/b16_p1_engagements_bench.js §2.2). One home still owns every read of
// public.engagements; a handler reaching for `.from('engagements')` still reddens.
//
// ── WIDENED AT R2 (Set → Map): IT NOW CARRIES THE CLOCK, NOT JUST THE FACT ──
// The badge answered "is this lead linkage-backed?". The sheet needs a second
// answer on the same row — WHEN the enquiry came — because F-16.22 proved
// `leads.created_at` is the lead's BIRTHDAY, not the enquiry's arrival. On the
// founder's own row those are 5 Aug and 21 Aug: the lead was born from a
// WhatsApp arrival and createLead's phone-dedupe returned it untouched when
// Sarah enquired sixteen days later. The lead row cannot know that. The SPINE
// can, because recordEnquiry moves `engagements.updated_at` on every enquiry —
// witnessed three times on one row during the P1 walk (16:41:57 backfill,
// 18:03:02 her re-enquiry, 18:12:47 the booking).
//
// SAME QUERY. One more column on a read that was already running, so the page
// still costs exactly one extra round trip. It does cost the Index Only Scan:
// engagements_lead_idx covers (vendor_id, lead_id), so `updated_at` forces a
// heap fetch. Stated rather than discovered later — the shape stays O(1)
// queries, which is what R-35.35 ruled; only the per-row cost moves.
//
// ── AND IT IS RENAMED, DELIBERATELY (F-16.7's lesson, applied to my own byte) ─
// `engagedLeadIds` returning a Map of ids-to-timestamps would be a name that
// lies about its contents. This block already paid for one of those:
// `couple_enquiries.vendor_lead_id` holds an ENGINE BINDER id, and the cost of
// that name was a whole finding and a near-miss backfill that would have put
// binder uuids behind a foreign key pointing at public.leads. One home, one
// caller, both in this delivery — the rename is free here and expensive later.
//
// ONE QUERY PER PAGE. Not one per row. The per-row shape would be N round trips
// for a page of N leads and would grow with the vendor's inbox; this is a single
// `.in()` over the ids the handler already has, scoped to the one vendor.
// 0128 gives it (vendor_id, lead_id) WHERE lead_id IS NOT NULL.
//
// FAIL-SOFT BY DESIGN: on any error it returns an EMPTY set, so the badge
// simply does not render. A lead row that loses its badge is a smaller harm
// than a Leads tab that 500s — and F-16.21's whole wound was a vendor being
// told nothing was there.
async function engagedLeadStamps(supabase, vendorId, leadIds) {
  const out = new Map();
  if (!supabase || !vendorId || !Array.isArray(leadIds) || leadIds.length === 0) return out;

  const ids = leadIds.filter(Boolean);
  if (ids.length === 0) return out;

  const { data, error } = await supabase
    .from('engagements')
    .select('lead_id, updated_at')
    .eq('vendor_id', vendorId)
    .in('lead_id', ids);

  if (error) {
    console.error('[engagements] engagedLeadStamps error:', error.message);
    return out;
  }
  // Presence in this Map IS the badge; the value is the clock. A row whose
  // updated_at is somehow null still belongs in the Map — the relationship is
  // real even if its timestamp is not, and dropping it would silently unbadge a
  // linkage-backed lead.
  for (const r of data || []) if (r && r.lead_id) out.set(r.lead_id, r.updated_at || null);
  return out;
}

/**
 * THE SPINE, READ BY LEAD — F-40.64's cure, and this file is the one home.
 *
 * `src/lib/vendor/weddings.js` reached `public.engagements` directly to resolve a
 * wedding's couple, and `b16` §2.2/§2.3 convicted it: those cells WALK THE SOURCE
 * TREE rather than read a list of consumers someone wrote down, because a list
 * someone wrote down is the defect. The bench was right for the whole G1.1c arc
 * and the read belongs here.
 *
 * ⚠ THE `vendorId` SCOPE IS LOAD-BEARING, NOT DEFENSIVE, and it moves across
 * with the query rather than being re-derived by whoever calls next. The fixture
 * couple holds THREE engagements, two of them `photography` (DEV440 and
 * DROY550): a match on lead alone, or on couple-and-category, is ambiguous on
 * real data today.
 *
 * ⚠ DECLARED MISS, CARRIED WITH THE CODE — F-40.60, ruled DORMANT (R-G12.14).
 * This is LEAD-MEDIATED, so an engagement with a NULL `lead_id` is invisible to
 * it. The census the chair ordered found `neither` = 1 and `booking_only` = 0 on
 * production, so the booking-mediated fallback (F-40.61) is filed dormant rather
 * than built. The `neither` row is F-40.81 and its cure is at this file's own
 * mint, not here.
 *
 * Returns null on every absence: a back-catalogue page has no event at all
 * (R-G11.21), and a page with no couple is a legal, ordinary page — it waits for
 * the off-platform consent path instead (F-40.49).
 */
async function coupleIdForLead(supabase, { leadId, vendorId }) {
  if (!leadId || !vendorId) return null;
  const { data, error } = await supabase
    .from('engagements')
    .select('couple_id')
    .eq('lead_id', leadId)
    .eq('vendor_id', vendorId)
    .maybeSingle();
  if (error) throw error;
  return (data && data.couple_id) || null;
}

module.exports = {
  getEngagement,
  coupleIdForLead,
  engagedLeadStamps,
  recordEnquiry,
  recordBooking,
  STATUS_RANK,
  statusesBelow,
};
