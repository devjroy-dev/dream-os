'use strict';
// src/lib/ownNumber/removedSweep.js · CE-46 · F-44.252 (ruled 30 September 2026) · the 7-day unsubscribe for a SHARED number she
// removed but never disconnected in her WhatsApp Business app.
// A shared-way Remove keeps TDW subscribed so Meta's PARTNER_REMOVED can reach it (remove.js); her clients' messages are discarded
// meanwhile (events.js). If PARTNER_REMOVED has not arrived 7 days after removed_at, TDW unsubscribes itself with her sealed token
// (kept for this call only), nulls the token, and marks paused_reason 'removed:swept', which retires the S6 line (remove.js
// removedView reads only 'removed:vendor' as waiting). A Meta refusal leaves the row for the next night; "already gone" (190, 404,
// not subscribed) counts as done, as at Remove.
const meta = require('./meta');
const { businessTokenFor } = require('./token');
const { alreadyGone } = require('./remove');

const WAIT_MS = 7 * 24 * 60 * 60 * 1000;

async function sweepRemoved({ supabase, env = process.env, fetchImpl = fetch, now = () => new Date(), tokenFor = businessTokenFor }) {
  const cutoff = new Date(now().getTime() - WAIT_MS).toISOString();
  const r = await supabase.from('vendor_wabas').select('id, vendor_id, waba_id, connect_way, paused_reason, removed_at, business_token')
    .eq('status', 'removed').eq('paused_reason', 'removed:vendor').lt('removed_at', cutoff);
  if (r.error) throw new Error(`vendor_wabas read: ${r.error.message}`);
  const out = { swept: 0, refused: 0 };
  for (const row of r.data || []) {
    if (row.connect_way === 'moved') continue;
    let ok = false;
    try {
      const token = tokenFor(row);
      try { await meta.unsubscribe({ wabaId: row.waba_id, token, env, fetchImpl }); ok = true; } catch (e) { ok = alreadyGone(e); if (!ok) console.warn(`[own-number:sweep] ${row.vendor_id} unsubscribe refused: ${e.message}`); }
    } catch (_e) { ok = true; } // no usable token: nothing left to unsubscribe with; the row is closed as swept
    if (!ok) { out.refused += 1; continue; }
    const up = await supabase.from('vendor_wabas').update({ business_token: null, paused_reason: 'removed:swept', updated_at: now().toISOString() }).eq('id', row.id).select('id');
    if (up.error) { console.warn(`[own-number:sweep] ${row.vendor_id} update failed: ${up.error.message}`); out.refused += 1; continue; }
    out.swept += 1;
    console.log(`[own-number:sweep] ${row.vendor_id} unsubscribed after 7 days without her disconnect; token nulled, line retired`);
  }
  return out;
}

module.exports = { sweepRemoved, WAIT_MS };
