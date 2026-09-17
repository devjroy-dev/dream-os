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
// Returns { ok: true, ids: Set<string> } or { ok: false, error }. It never throws; the callers
// decide what a failed read means for them (the slicers refuse, the seam writes nothing).

async function readBookedBinderIds(supabase, vendorId) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('binder_id')
      .eq('vendor_id', vendorId)
      .eq('state', 'booked')
      .is('deleted_at', null);
    if (error) return { ok: false, error: error.message };
    const ids = new Set();
    for (const r of (data || [])) {
      if (r && typeof r.binder_id === 'string' && r.binder_id) ids.add(r.binder_id);
    }
    return { ok: true, ids };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = { readBookedBinderIds };
