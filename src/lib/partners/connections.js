'use strict';
// src/lib/partners/connections.js · CE-47 · PTN-A1 · connections are COUNTED here and never charged in A1 (the chair).
// A connection: contact details exchanged (a Pick, or a vendor's first Contact on a call the partner answered).
// The plan (Rs 2,999 a month from the 4th, GST included) is A2's; FREE_CONNECTIONS is the one home of the number.
const FREE_CONNECTIONS = 3;

async function countFor(supabase, partnerId) {
  const { count, error } = await supabase.from('partner_connections').select('id', { count: 'exact', head: true }).eq('partner_id', partnerId);
  if (error) throw new Error(`connection count failed: ${error.message}`);
  return count || 0;
}
/** Record one (idempotent on partner and ref). Returns { n, free_left }. Never charges, never blocks the vendor. */
async function record(supabase, { partnerId, kind, refId, vendorId }) {
  const { data: had } = await supabase.from('partner_connections').select('n').eq('partner_id', partnerId).eq('ref_id', refId).maybeSingle();
  if (had) return { n: had.n, free_left: Math.max(0, FREE_CONNECTIONS - had.n), repeat: true };
  const n = (await countFor(supabase, partnerId)) + 1;
  const { error } = await supabase.from('partner_connections').insert({ partner_id: partnerId, kind, ref_id: refId, vendor_id: vendorId, n });
  if (error) throw new Error(`connection record failed: ${error.message}`);
  return { n, free_left: Math.max(0, FREE_CONNECTIONS - n), repeat: false };
}
/** The admin's line, in plain words. */
function adminLine(used, planState) {
  if (planState === 'exempt') return `This partner has made ${used} connections. TDW does not charge this partner for connections.`;
  const free = Math.min(used, FREE_CONNECTIONS);
  const plan = planState === 'active' ? 'This partner pays for the plan, Rs 2,999 a month.' : 'This partner has no plan yet. After its 3rd connection, the plan costs Rs 2,999 a month.';
  return `This partner has used ${free} of its ${FREE_CONNECTIONS} free connections${used > FREE_CONNECTIONS ? `, and ${used} connections in all` : ''}. ${plan}`;
}
module.exports = { FREE_CONNECTIONS, countFor, record, adminLine };
