'use strict';
// src/lib/vendor/bookedLeads.js
//
// TDW · CE-43 · LC-2 · packet 3 · F13(a) · "A CLIENT IS A BINDER WITH A BOOKED LEAD BEHIND IT."
//
// One read, three readers:
//   src/api/vendor-engine/cabinet.js   the Clients slice
//   src/api/vendor-engine/today.js     the Today feed's lead slice (a booked binder is not a lead)
//   src/lib/vendor/bookingEvent.js     LC-1's seam predicate
// Each keeps its own legacy test beside this set (the six-word cabinet set in the two
// slicers, /(book|confirm)/ in the seam), as ruled: "has a booked lead" PLUS the legacy test,
// so no binder that was a client yesterday stops being one today.
//
// THE SPELLING (the chair's arm (iii), ruled 2026-09-17 on the LC-2r first message). The read
// is `select binder_id from leads where vendor_id, state = 'booked', deleted_at is null`, with
// the null binder ids dropped HERE, in code, rather than by a `.not('binder_id', 'is', null)`
// filter. The production reason: the read returns a handful of rows, and this keeps it to the
// builder methods the slicers' other reads already use (eq, is). b83 proves the id set equals
// the `.not()` form on a fixture holding null and non-null binder ids.
//
// COLUMN WITNESS: public.leads vendor_id(2) state(13) deleted_at(20) binder_id(30),
// docs/db/PUBLIC_SCHEMA.md at ladder 0168 (`## public.leads · 29 columns`).
//
// CE-44 · LC-2 · packet 4a · THE ADDITIVE WIDENING (chair-ruled, arm A). `name` (column 3,
// `name text`, witnessed against PUBLIC_SCHEMA at ladder 0168 before this select was written)
// joins the projection so `bookedFacts.js` can name the vendor's booked clients in its prompt
// block WITHOUT a second query on the chat door — arm C was refused into F-43.115's latency.
// THE PREDICATE IS UNTOUCHED: the filters, the null-binder drop and `ids` are byte-for-byte
// what packet 3 landed. `names` rides BESIDE `ids`, additively, so the three readers named
// above — cabinet.js:64, today.js:90, bookingEvent.js:111, each of which reads `.ok`, `.error`
// and `.ids` and nothing else — are untouched in shape and in behaviour. b84 holds a cell that
// says so; b83 proves the predicate still equals the `.not()` form, unamended.
//
// Returns { ok: true, ids: Set<string>, names: string[] } or { ok: false, error }. It never
// throws; the callers decide what a failed read means for them (the slicers refuse, the seam
// writes nothing). `names` is ONE ENTRY PER BINDER-BACKED BOOKED LEAD, in the read's order,
// with blank and missing names dropped — so a shorter `names` than `ids` is the honest signal
// that the list cannot be complete, and bookedFacts falls to its count form on it.

async function readBookedBinderIds(supabase, vendorId) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('name, binder_id')
      .eq('vendor_id', vendorId)
      .eq('state', 'booked')
      .is('deleted_at', null);
    if (error) return { ok: false, error: error.message };
    const ids = new Set();
    const names = [];
    for (const r of (data || [])) {
      // THE PREDICATE LINE IS BYTE-IDENTICAL TO PACKET 3'S, deliberately: b83 §11 M1
      // mutates exactly this line to prove the null-binder drop has teeth, and a
      // widening that re-spelled it would have spent another bench's mutation anchor
      // to save a line break. The name is gathered beneath it, for rows that passed.
      if (r && typeof r.binder_id === 'string' && r.binder_id) ids.add(r.binder_id);
      else continue;
      const n = typeof r.name === 'string' ? r.name.trim() : '';
      if (n) names.push(n);
    }
    return { ok: true, ids, names };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = { readBookedBinderIds };
