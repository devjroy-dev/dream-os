// src/lib/vendor/waWindow.js
// ── TDW_07 P5 · F-07.45 TRANSPORT ARM — the vendor's 24h window, at one home ──
//
// WHY THIS FILE EXISTS. `sendWa` refuses to guess the window (sendWa.js:159-174,
// `WaWindowUndeterminedError` — "refusing to assume open"). Its default checker
// takes ONE `conversationId`, but a vendor's inbound can land on ANY of his
// `vendor_self` conversations, so handing sendWa a single id would be a guess
// wearing a parameter's clothes. The estate's existing answer is the cron
// precedent: the CALLER determines the window and passes `windowOpen` as a
// boolean (cron.js:76, brideCron.js:109).
//
// The determination itself already existed — inline inside `buildBriefing`
// (src/agent/briefing.js:10-41). This file is that same predicate, extracted so
// the enquiry door can ask the question without a second implementation of the
// answer. The estate has paid for duplicated predicates twice in this block
// alone (F-07.30's three path authorities, F-07.34's five band lists).
//
// ── DECLARED, NOT SILENTLY WIDENED (protocol §8) ─────────────────────────────
// `briefing.js` is NOT re-pointed at this module in this sitting. It is a LIVE
// cron surface and its window block is fused to a function that also returns
// `no_inbound_ever` / `window_closed` REASONS its caller branches on
// (cron.js:86). Folding it is a real cure with a real regression surface, and it
// is outside the two arms the chair ruled. So: a second implementation exists,
// it is named here and in the handover, and the fold is offered as a fork —
// never performed quietly, never left undisclosed.
//
// [F-06.85: the paragraph above is conditioned on a MECHANICAL fact — that
//  briefing.js still carries its own inline window block. Mechanism:
//  src/agent/briefing.js:10-41. If that fold ever lands, re-read this header.]

'use strict';

const WINDOW_HOURS = 24;

/**
 * Is the vendor's WhatsApp 24h customer-service window open?
 *
 * Mirrors briefing.js:10-41 exactly: the vendor's `vendor_self` conversations,
 * then the most recent INBOUND message across them, then the age of that
 * message against a 24h ceiling.
 *
 * NEVER THROWS. A vendor with no conversation, no inbound ever, or a failed
 * query is CLOSED — not "unknown", not "assume open". A false closed costs a
 * refusal the caller can see and log; a false open costs a silent Meta rejection.
 * The estate's whole posture on this (sendWa.js:26) is that guessing open is the
 * expensive direction.
 *
 * @param {object} supabase
 * @param {string} vendorId  public.vendors.id
 * @returns {Promise<{open: boolean, reason: string, hours?: number}>}
 */
async function vendorWindowOpen(supabase, vendorId) {
  if (!supabase || !vendorId) return { open: false, reason: 'no_supabase_or_vendor' };

  try {
    // Witness for these columns: src/agent/briefing.js:13-17 reads exactly
    // `conversations.id` filtered on `vendor_id` + `kind='vendor_self'`, and
    // src/agent/briefing.js:25-32 reads `messages.created_at` filtered on
    // `direction='inbound'` + `conversation_id IN (...)`. This module makes no
    // column claim that file does not already make against the live database.
    const { data: selfConvos, error: convoErr } = await supabase
      .from('conversations')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('kind', 'vendor_self');

    if (convoErr) return { open: false, reason: 'conversation_query_failed' };

    const ids = (selfConvos || []).map((c) => c.id);
    if (ids.length === 0) return { open: false, reason: 'no_conversation' };

    const { data: lastInbound, error: msgErr } = await supabase
      .from('messages')
      .select('created_at')
      .eq('direction', 'inbound')
      .in('conversation_id', ids)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (msgErr) return { open: false, reason: 'message_query_failed' };
    if (!lastInbound || !lastInbound.created_at) {
      return { open: false, reason: 'no_inbound_ever' };
    }

    const hours = (Date.now() - new Date(lastInbound.created_at).getTime()) / (1000 * 60 * 60);
    if (hours > WINDOW_HOURS) {
      return { open: false, reason: 'window_closed', hours: Math.round(hours) };
    }
    return { open: true, reason: 'in_window', hours: Math.round(hours) };
  } catch (err) {
    // A thrown client is the same fact as a closed window for our purposes, and
    // the caller logs it. Swallowing SILENTLY is what F-07.38 was minted for, so
    // the reason travels back rather than dying here.
    return { open: false, reason: `window_check_threw:${err && err.message}` };
  }
}

module.exports = { vendorWindowOpen, WINDOW_HOURS };
