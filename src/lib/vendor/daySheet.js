// src/lib/vendor/daySheet.js
// THE DAY SHEET'S SPINE, ONE HOME. P7 cut 2b (CE-45 LCV-13; the chair's ruling (d) of 23 September 2026, the kickoff's §2).
//
// RELOCATED, NOT REWRITTEN (Q-B2-7's law, as eventWrite.js states it: "the diff must show RELOCATION, NOT REWRITE"). The body below is
// src/api/vendor/day.js :60 to :82 at 3af9a01, moved BYTE-PRESERVED except for three disclosed adaptations:
//   1. `vendor.id` became the parameter `vendorId` (the lib has no req);
//   2. the failed read RETURNS { ok:false, error: dayErr.message } where the router answered 500; the router keeps its console.error and its
//      500 'Lookup failed.' byte for byte, reading the error off this return;
//   3. the split's result RETURNS { ok:true, events, blocks } where the router went on to use the two names.
// A throw from the client propagates exactly as it did (the router's asyncHandler answers it; the working door's own guard catches it).
//
// PLANE: an injected client with no db option is PUBLIC-default, so `events` below is public.events, THE CALENDAR (eventWrite.js's header,
// B1's plane law). Read only. The working door's availability lookup (cut four) reads the SAME rows the sheet renders, one read in one home.
'use strict';

async function readDaySpine(supabase, vendorId, date) {
  const { data: dayRows, error: dayErr } = await supabase
    .from('events')
    .select('id, title, kind, slot, event_date, event_time, state, notes, linked_binder_id, linked_lead_id, assigned_member_ids')
    .eq('vendor_id', vendorId)
    .eq('event_date', date)
    .is('deleted_at', null)
    .neq('state', 'cancelled')
    .order('event_time', { ascending: true, nullsFirst: true });
  if (dayErr) {
    return { ok: false, error: dayErr.message };
  }

  const rows   = dayRows || [];
  const events = rows.filter((r) => r.kind !== 'blocked');
  const blocks = rows
    .filter((r) => r.kind === 'blocked')
    .map((r) => ({
      id:     r.id,
      slot:   r.slot || 'full_day',       // pre-0078 rows are full_day (0075's witnessed backfill)
      reason: r.notes == null ? null : r.notes,  // the reason round-trip: notes is the SOURCE (B1's ruled shape)
      title:  r.title,
    }));

  return { ok: true, events, blocks };
}

module.exports = { readDaySpine };
