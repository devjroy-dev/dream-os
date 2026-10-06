// src/lib/papers/verifiedWeddings.js · CE-47 · PRO · P1 · "TDW-VERIFIED WEDDINGS COMPLETED" (F2, ruled 6 Oct 2026).
// A wedding counts when ALL of these hold, and each wedding counts ONCE:
//   1. an invoice raised in TDW (not deleted) has at least one payment recorded on it (amount_paid > 0);
//   2. its date has passed: the latest event date on the invoice's binder, else the lead's wedding date, is BEFORE
//      today in India;
//   3. it is counted per binder; an invoice with no binder counts by its lead (and a lead that belongs to a binder
//      counts as that binder, so one wedding is never counted twice).
// An invoice with neither a binder nor a lead, or with no date anywhere, is not counted: TDW cannot see its date.
// Columns read are the live ones the founder read on 6 Oct 2026: invoices(binder_id, lead_id, amount_paid,
// deleted_at), events(linked_binder_id, event_date, deleted_at), leads(id, binder_id, wedding_date, deleted_at).

const IST_MS = 5.5 * 3600 * 1000;
/** Today's date in India as YYYY-MM-DD. */
function todayIST(now = Date.now()) { return new Date(now + IST_MS).toISOString().slice(0, 10); }

/** The pure rule, given the rows. Returns { count, keys } so a bench and a paper can show what was counted. */
function countVerified({ invoices = [], events = [], leads = [], today }) {
  const leadById = new Map(leads.filter((l) => !l.deleted_at).map((l) => [l.id, l]));
  const lastEvent = new Map();
  for (const e of events) {
    if (e.deleted_at || !e.linked_binder_id || !e.event_date) continue;
    const prev = lastEvent.get(e.linked_binder_id);
    if (!prev || e.event_date > prev) lastEvent.set(e.linked_binder_id, e.event_date);
  }
  const keys = new Set();
  for (const inv of invoices) {
    if (inv.deleted_at || !(Number(inv.amount_paid) > 0)) continue;
    const lead = inv.lead_id ? leadById.get(inv.lead_id) : null;
    const binder = inv.binder_id || (lead && lead.binder_id) || null;
    const date = (binder && lastEvent.get(binder)) || (lead && lead.wedding_date) || null;
    if (!date || !(String(date).slice(0, 10) < today)) continue;
    keys.add(binder ? `b:${binder}` : lead ? `l:${lead.id}` : null);
  }
  keys.delete(null);
  return { count: keys.size, keys: [...keys] };
}

/** Reads her rows and applies the rule. Never throws: a read that fails reports error and a count of null. */
async function verifiedWeddings({ supabase, vendorId, now = Date.now() }) {
  try {
    const inv = await supabase.from('invoices').select('id, binder_id, lead_id, amount_paid, deleted_at').eq('vendor_id', vendorId).is('deleted_at', null).gt('amount_paid', 0);
    if (inv.error) return { count: null, error: 'invoices' };
    const invoices = inv.data || [];
    if (!invoices.length) return { count: 0, keys: [] };
    const leadIds = [...new Set(invoices.map((i) => i.lead_id).filter(Boolean))];
    const leads = leadIds.length ? await supabase.from('leads').select('id, binder_id, wedding_date, deleted_at').eq('vendor_id', vendorId).in('id', leadIds) : { data: [] };
    if (leads.error) return { count: null, error: 'leads' };
    const binderIds = [...new Set([...invoices.map((i) => i.binder_id), ...(leads.data || []).map((l) => l.binder_id)].filter(Boolean))];
    const events = binderIds.length ? await supabase.from('events').select('linked_binder_id, event_date, deleted_at').eq('vendor_id', vendorId).in('linked_binder_id', binderIds) : { data: [] };
    if (events.error) return { count: null, error: 'events' };
    return countVerified({ invoices, events: events.data || [], leads: leads.data || [], today: todayIST(now) });
  } catch (_e) { return { count: null, error: 'read' }; }
}

module.exports = { verifiedWeddings, countVerified, todayIST };
