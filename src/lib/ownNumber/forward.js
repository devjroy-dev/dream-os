'use strict';
// src/lib/ownNumber/forward.js · CE-46 · G6-2 · 2b · THE RECEIVER HANDS HER COUPLES' MESSAGES TO THE VENDOR SERVICE (F6 (a)).
// Called by src/marketingIndex.js only AFTER events.js has recorded the change in vendor_wa_events (recorded first, as
// in 2a). Only a 'messages' change that carries messages is forwarded: echoes, history, contacts, account and quality
// events and delivery statuses stay in the receiver. The target is the vendor service's NEW route
// (/internal/own-number/inbound, src/lib/ownNumber/route.js), never /webhook/meta, with the same trust the receiver's
// forwardChange uses (VENDOR_SELF_URL + x-internal-replay: INTERNAL_REPLAY_SECRET). A failure is a dead letter.
const { ROUTE } = require('./route');

/** Pure: does this change go to the turn? */
function forwardable(change) {
  return !!change && change.field === 'messages' && !!change.value && Array.isArray(change.value.messages) && change.value.messages.length > 0;
}

async function forwardOwn({ own, change, env = process.env, fetchImpl = fetch, captureDeadLetter, supabase, tag = '[wa:marketing]' }) {
  if (!forwardable(change)) return { forwarded: false, why: 'not a message' };
  const base = env.VENDOR_SELF_URL; const secret = env.INTERNAL_REPLAY_SECRET;
  if (!base || !secret) {
    const missing = !base ? 'VENDOR_SELF_URL' : 'INTERNAL_REPLAY_SECRET';
    console.error(`${tag} cannot forward own-number change for ${own.vendor_id}: ${missing} unset`);
    await captureDeadLetter({ supabase, service: 'ingress-forward:own', phone: null, payload: { vendor_id: own.vendor_id, change }, error: new Error(`forward not configured: ${missing}`) });
    return { forwarded: false, why: 'not configured' };
  }
  try {
    const resp = await fetchImpl(`${base}${ROUTE}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-replay': secret },
      body: JSON.stringify({ vendor_id: own.vendor_id, change }),
    });
    if (!resp || !resp.ok) throw new Error(`vendor service responded ${resp && resp.status}`);
    console.log(`${tag} forwarded own-number change for ${own.vendor_id} -> ${resp.status}`);
    return { forwarded: true };
  } catch (e) {
    console.error(`${tag} own-number forward for ${own.vendor_id} failed:`, e && e.message);
    await captureDeadLetter({ supabase, service: 'ingress-forward:own', phone: null, payload: { vendor_id: own.vendor_id, change }, error: e });
    return { forwarded: false, why: 'failed' };
  }
}

module.exports = { forwardOwn, forwardable };
