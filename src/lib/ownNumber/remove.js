'use strict';
// src/lib/ownNumber/remove.js · CE-46 · G6-4 · THE ROOM FINISHED · "Remove this number" (ruled 28 September 2026).
//
// THE READ (28 September 2026), Meta's own pages:
//   · "Onboard WhatsApp Business app users", Offboarding: the Deregister API cannot be used on a number in use with both Cloud API
//     and the WhatsApp Business app. Only she can disconnect it, in the app: Settings > Account > Business Platform > Disconnect
//     Account, which sends account_update PARTNER_REMOVED (events.js). So on the SHARED way TDW stops listening and answering, and
//     the room tells her the last step (F-b, F-c).
//   · The Deregister reference and "Register a business phone number": POST /<PNID>/deregister makes the number unusable with Cloud
//     API; the number and its history are not deleted; it is registered again to be used again. The MOVED way only.
//   · The Graph reference for /<WABA_ID>/subscribed_apps lists DELETE, returning { success }.
//
// F-a (a), RULED: META FIRST, THEN THE ROW. Unsubscribe (both ways), then deregister (moved). A Meta refusal changes NOTHING: the row
// and her sealed token stay, so she can try again and the retry can still reach Meta. An answer that says the thing is already
// gone (an invalid token, code 190; a 404; "not subscribed") counts as done and the removal goes on. Only after Meta: one update,
// status 'removed', business_token null, removed_at, paused_reason 'removed:vendor'. NEVER a delete; vendor_wa_events untouched.
// A tokenless row is not removable here (the room shows it as unconnected, F-a3b; its connect is the in-place re-exchange).
const meta = require('./meta');
const { businessTokenFor, TokenError } = require('./token');

const REMOVABLE = ['active', 'suspended'];
const refuse = (reason) => ({ ok: false, reason });

/** Pure: does Meta's refusal say the thing is already gone (so the removal may go on)? */
function alreadyGone(e) {
  if (!(e instanceof meta.MetaError)) return false;
  const err = (e.body && e.body.error) || {};
  if (Number(err.code) === 190) return true;          // her token is no longer valid: TDW's reach is already gone
  if (e.status === 404) return true;                  // no such subscription or number
  return /not subscribed|subscription not found|not registered/i.test(String(err.message || ''));
}

/** Pure: what the room is told once the row reads 'removed'. finish_in_app only on the shared way, until PARTNER_REMOVED. */
function removedView(row) {
  if (!row || row.status !== 'removed') return null;
  return { display_number: row.display_number, way: row.connect_way, finish_in_app: row.connect_way === 'shared' && row.paused_reason === 'removed:vendor' };
}

async function removeNumber({ vendor, supabase, env = process.env, fetchImpl = fetch, now = () => new Date(), tokenFor = businessTokenFor }) {
  const cur = await supabase.from('vendor_wabas')
    .select('id, status, connect_way, waba_id, phone_number_id, display_number, paused_reason, business_token')
    .eq('vendor_id', vendor.id).maybeSingle();
  if (cur.error) throw new Error(`vendor_wabas read: ${cur.error.message}`);
  const row = cur.data;
  if (!row || !REMOVABLE.includes(row.status)) return refuse('no_number');

  let token;
  try { token = tokenFor(row); } catch (e) { return refuse(e instanceof TokenError ? `token_${e.reason}` : 'token_failed'); }

  const steps = [];
  const step = async (name, fn) => {
    try { await fn(); steps.push(`${name}:done`); return true; } catch (e) {
      if (alreadyGone(e)) { steps.push(`${name}:already_gone`); return true; }
      console.warn(`[own-number] ${vendor.id} remove refused at ${name}: ${e.message}`);
      return false;
    }
  };
  if (!(await step('unsubscribe', () => meta.unsubscribe({ wabaId: row.waba_id, token, env, fetchImpl })))) return refuse('meta_unsubscribe');
  if (row.connect_way === 'moved' && !(await step('deregister', () => meta.deregister({ phoneNumberId: row.phone_number_id, token, env, fetchImpl })))) {
    return refuse('meta_deregister');
  }

  const at = now().toISOString();
  const up = await supabase.from('vendor_wabas')
    .update({ status: 'removed', business_token: null, removed_at: at, paused_reason: 'removed:vendor', updated_at: at })
    .eq('id', row.id).select('status, display_number, connect_way, paused_reason');
  if (up.error || !up.data || up.data.length !== 1) throw new Error(`vendor_wabas remove: ${up.error ? up.error.message : 'no row'}`);
  console.log(`[own-number] ${vendor.id} removed (${row.connect_way}): ${steps.join(' · ')}; her token nulled, the row kept`);
  return { ok: true, removed: removedView(up.data[0]) };
}

module.exports = { removeNumber, alreadyGone, removedView, REMOVABLE };
