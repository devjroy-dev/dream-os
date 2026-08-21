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
async function getEngagement(supabase, coupleId, vendorId, category) {
  if (!supabase || !coupleId || !vendorId) return null;

  const { data, error } = await supabase
    .from('engagements')
    .select('id, couple_id, vendor_id, category, status, source, enquiry_id, couple_booking_id, lead_id, created_at, updated_at')
    .eq('couple_id', coupleId)
    .eq('vendor_id', vendorId)
    .eq('category', normaliseCategory(category))
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
    }, { onConflict: 'couple_id,vendor_id,category', ignoreDuplicates: true });

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

  const patch = { updated_at: new Date().toISOString() };
  if (enquiryId) patch.enquiry_id = enquiryId;
  if (leadId)    patch.lead_id    = leadId;

  const { error } = await supabase
    .from('engagements')
    .update(patch)
    .eq('couple_id', coupleId)
    .eq('vendor_id', vendorId)
    .eq('category', normaliseCategory(category));

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
async function recordBooking({ supabase, coupleId, vendorId, category, bookingId, source }) {
  if (!supabase || !coupleId || !vendorId) return false;

  await mint({
    supabase, coupleId, vendorId, category,
    status: 'booked',
    source: source || 'direct',
  });

  const now = new Date().toISOString();

  if (bookingId) {
    const { error: refErr } = await supabase
      .from('engagements')
      .update({ couple_booking_id: bookingId, updated_at: now })
      .eq('couple_id', coupleId)
      .eq('vendor_id', vendorId)
      .eq('category', normaliseCategory(category))
      .is('couple_booking_id', null);
    if (refErr) console.error('[engagements] recordBooking ref error:', refErr.message);
  }

  const { error: stErr } = await supabase
    .from('engagements')
    .update({ status: 'booked', updated_at: now })
    .eq('couple_id', coupleId)
    .eq('vendor_id', vendorId)
    .eq('category', normaliseCategory(category))
    .in('status', statusesBelow('booked'));

  if (stErr) {
    console.error('[engagements] recordBooking status error:', stErr.message);
    return false;
  }
  return true;
}

module.exports = {
  getEngagement,
  recordEnquiry,
  recordBooking,
  STATUS_RANK,
  statusesBelow,
};
