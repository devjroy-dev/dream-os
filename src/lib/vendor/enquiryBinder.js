// ─────────────────────────────────────────────────────────────────────────────
// src/lib/vendor/enquiryBinder.js
// The WELD: a bride enquiry becomes a binder on the vendor — the vendor↔bride
// pipe now flows through the new ledger, not the old typed `leads` table.
//
// Mirrors createLead's contract (dedupe by phone; return { binder, deduped })
// so couple/enquire.js swaps cleanly and couple_enquiries.vendor_lead_id keeps
// a valid pointer (now a binder id; the column was never a hard FK to leads).
//
// Uses Kriya's binder hands directly — same primitives Myra drives — so an
// enquiry logged by a bride and an enquiry logged by the vendor land in the
// SAME shape, in the SAME cabinet. One ledger, two doors in.
'use strict';

const { executeKriyaTool } = require('../../agent/kriyaPrimitives');

// Create (or find) a binder for an inbound enquiry on this vendor.
//   supabase, vendorId, { name, phone, note, date }
// Returns { ok, binder: { id }, deduped }.
async function enquiryToBinder(supabase, vendorId, params) {
  const { name, phone, note, date } = params || {};

  // Dedupe by phone — the binder equivalent of createLead's phone check.
  if (phone) {
    const { data: existing } = await supabase
      .from('binders')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('phone', phone)
      .eq('hidden', false)
      .limit(1)
      .maybeSingle();
    if (existing) {
      // Append a line to the note so the repeat enquiry is on record, but don't
      // open a duplicate binder.
      if (note) {
        await executeKriyaTool(supabase, vendorId, 'kriya_note_append', { binder_id: existing.id, note });
      }
      return { ok: true, binder: existing, deduped: true };
    }
  }

  // Open a fresh binder: client first (opens it), then attach the rest by id.
  const opened = await executeKriyaTool(supabase, vendorId, 'kriya_client', {
    client: name || 'Dream Wedding enquiry',
  });
  const binderId = opened.binder_id;
  if (!binderId) return { ok: false, error: opened.display || 'could not open binder' };

  if (phone) await executeKriyaTool(supabase, vendorId, 'kriya_phone', { binder_id: binderId, phone });
  if (date)  await executeKriyaTool(supabase, vendorId, 'kriya_date',  { binder_id: binderId, date });
  if (note)  await executeKriyaTool(supabase, vendorId, 'kriya_note',  { binder_id: binderId, note });
  // Every inbound enquiry enters as a LEAD — never a client until the owner says so.
  await executeKriyaTool(supabase, vendorId, 'kriya_stage', { binder_id: binderId, stage: 'lead' });

  return { ok: true, binder: { id: binderId }, deduped: false };
}

module.exports = { enquiryToBinder };
