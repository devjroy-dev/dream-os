// ─────────────────────────────────────────────────────────────────────────────
// src/lib/vendor/enquiryBinder.js
// THE WELD (engine edition, Phase 5-B): a bride enquiry becomes a binder on the
// vendor — now in the ENGINE cabinet (engine.records), through Donna's hands.
//
// Same contract as before (dedupe by phone; return { ok, binder:{id}, deduped })
// so couple/enquire.js swaps with no caller change, and couple_enquiries.vendor_lead_id
// keeps a valid pointer (now an engine.records binder id — never a hard FK).
//
// Mirrors the door-layer transformation: executeKriyaTool(supabase, vendorId, ...)
// -> executeRecordTool(agentId, ...). The vendor is resolved to their engine agent
// via the shared bridge (same resolver the web middleware + WhatsApp use), so an
// enquiry logged by a bride and a binder logged by the vendor land in the SAME
// cabinet, the SAME shape. The marketplace is just another caller.
'use strict';

const { executeRecordTool }      = require('../../engine/dist/core/tools/recordPrimitives');
const { resolveAgentForVendor }  = require('../../api/middleware/agentBridge');

const isErr = (r) => !!r && typeof r.display === 'string' && r.display.startsWith('ERROR');

// Create (or find) an engine binder for an inbound enquiry on this vendor.
//   supabase, vendorId, { name, phone, note, date }
// Returns { ok, binder: { id }, deduped }.
async function enquiryToBinder(supabase, vendorId, params) {
  const { name, phone, note, date } = params || {};

  // Bridge the vendor to their engine agent (one resolver, every surface).
  const { data: vendor } = await supabase
    .from('vendors').select('*').eq('id', vendorId).maybeSingle();
  if (!vendor) return { ok: false, error: 'vendor not found' };
  const { agentId } = await resolveAgentForVendor(supabase, vendor, vendor.user_id);
  const eng = supabase.schema('engine');

  // Dedupe by phone — the engine equivalent of the old binder phone check.
  if (phone) {
    const { data: existing } = await eng
      .from('records').select('id')
      .eq('agent_id', agentId).eq('phone', phone).eq('hidden', false)
      .limit(1).maybeSingle();
    if (existing) {
      // Repeat enquiry: append to the note, don't open a duplicate binder.
      if (note) await executeRecordTool(agentId, 'donna_note_append', { binder_id: existing.id, note });
      return { ok: true, binder: existing, deduped: true };
    }
  }

  // Open a fresh binder: client first (opens it), then attach the rest by id.
  // ref_id is the raw uuid (item.id is the prefixed snapshot key — the 3-C lesson).
  const opened = await executeRecordTool(agentId, 'donna_client', {
    client: name || 'Dream Wedding enquiry',
  });
  if (isErr(opened)) return { ok: false, error: opened.display };
  const binderId = opened.item && opened.item.ref_id;
  if (!binderId) return { ok: false, error: 'could not open binder' };

  if (phone) await executeRecordTool(agentId, 'donna_phone', { binder_id: binderId, phone });
  if (date)  await executeRecordTool(agentId, 'donna_date',  { binder_id: binderId, date });
  if (note)  await executeRecordTool(agentId, 'donna_note',  { binder_id: binderId, note });
  // Every inbound enquiry enters as a LEAD — never a client until the owner says so.
  await executeRecordTool(agentId, 'donna_stage', { binder_id: binderId, stage: 'lead' });

  return { ok: true, binder: { id: binderId }, deduped: false };
}

module.exports = { enquiryToBinder };
