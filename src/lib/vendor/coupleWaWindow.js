// src/lib/vendor/coupleWaWindow.js
// ── TDW_06 · F-06.147 / F-06.153 — the COUPLE-side 24h window, on the VENDOR lane ──
//
// WHY THIS FILE EXISTS, AND WHY IT IS NOT `waWindow.js` WITH A PARAMETER.
// `src/lib/vendor/waWindow.js` (symbol `vendorWindowOpen`) is this file's mirror
// of POSTURE — typed reasons, never throws, fails closed, the reason carries the
// error. It is deliberately NOT a mirror of KEYING. It resolves a vendor's
// `vendor_self` conversations and asks the last inbound across THAT set, which
// is a conversation-row question. **F-06.147 rules the window a property of the
// (business PNID, user MSISDN) PAIR, never a conversation row**, and the
// departure below IS the cure, not a drift.
//
// The determination itself already existed twice, inline and couple-shaped:
// `src/agent/briefing.js` (symbol `buildBriefing`, vendor lane) and
// `src/agent/brideNudge.js` (symbol `buildNudge`, BRIDE lane). This file is the
// vendor lane's couple-side answer, extracted so a send path can ask the
// question without a fourth inline implementation of it.
//
// ── DECLARED, NOT SILENTLY WIDENED (protocol §8) ─────────────────────────────
// `brideNudge.js` is NOT re-pointed at this module in this sitting. It is a LIVE
// cron surface (`src/brideCron.js` branches on its `window_closed` reason) and
// its window block is fused to a builder that also returns nudge content.
// Folding it is a real cure with a real regression surface. So: a third
// implementation exists, it is named here and in `brideNudge.js`'s own header,
// and the fold is chartered as its own micro — never performed quietly.
//
// ── THE LANE MAP HAS NO HOME IN THE DATABASE (F-06.153) ──────────────────────
// `public.conversations` carries NO lane or PNID column (12 columns, witnessed at
// `docs/db/PUBLIC_SCHEMA.md:193-204`). Lane is therefore IMPLIED BY `kind`, and
// until this file that map was written down nowhere — three creation sites knew
// it implicitly. `VENDOR_LANE_KINDS` below is its FIRST WRITTEN HOME. Derived by
// walking every creation site at 16a4071:
//
//   kind                 created at                                     lane
//   ------------------   -------------------------------------------    ------
//   vendor_self          vendorInbound.js (symbol `handleVendorInbound`) VENDOR
//   couple_thread        vendorInbound.js, replyToCouple.js              VENDOR
//   couple_self          brideInbound.js, api/couple/chat.js             BRIDE
//   circle_thread        brideInbound.js, brideIndex.js, api/circle      BRIDE
//   prospect_marketing   the marketing lane                              MARKETING
//
// **`couple_self` IS ON THE BRIDE PNID AND MUST NOT BE UNIONED HERE.** A relay
// send rides the vendor lane (`whatsapp.js`, symbol `defaultFrom`, is
// service-scoped vendor-first). Counting her bride-lane inbounds would assert an
// open window on a number she has never messaged — a FALSE OPEN, which
// `waWindow.js`'s own header names as the expensive direction. `vendor_self`
// carries the VENDOR's inbounds, not hers, so it is out of class too.
//
// ── THE MATCHING CONTRACT, STATED SO IT CANNOT SURPRISE A READER ─────────────
// Matching is EXACT EQUALITY on `counterparty_phone`. It is deliberately not
// normalized, because the column is not normalized estate-wide: the founder's
// 2026-08-11 paste showed a `prospect_marketing` row storing `919625759924`
// bare while all three `couple_thread` rows for the same human store
// `+919625759924`. The allowlist excludes `prospect_marketing`, so the variance
// cannot produce a false verdict THROUGH this predicate — but a bare-format row
// of an ALLOWLISTED kind would be a MISS, and that miss is declared here and
// asserted by a cell rather than discovered in production. Callers hand this
// function the +E164 form the couple lane demonstrably stores.

'use strict';

const WINDOW_HOURS = 24;

// The FIRST WRITTEN HOME of the kind→lane map (F-06.153). Exported so future
// readers IMPORT it rather than re-derive it. The promotion to a shared
// estate-wide map is chartered to the brideNudge-fold micro, not this sitting.
const VENDOR_LANE_KINDS = ['couple_thread'];

/**
 * Is the WhatsApp 24h customer-service window open between the VENDOR LANE's
 * business number and this couple's phone?
 *
 * THE UNIT IS THE PAIR, NOT THE CONVERSATION AND NOT THE VENDOR. There is
 * deliberately NO vendor argument (founder-ruled 2026-08-11, fork 1-ter arm
 * (a)). One bride phone commonly holds `couple_thread` rows with SEVERAL
 * vendors — the founder's paste showed three — and every one of them sits on the
 * same vendor PNID. Meta opens the window on ANY inbound from that phone to that
 * number, whichever row the estate filed it under, so the scan is the UNION
 * across the lane. A `vendor_id` parameter here would reproduce, one level up,
 * exactly the too-narrow keying F-06.147 indicts.
 *
 * NEVER THROWS. No conversation, no inbound ever, or a failed query is CLOSED —
 * not "unknown", not "assume open". A false closed costs a refusal the caller
 * can see and log; a false open costs a silent Meta rejection and, on this
 * lane, a message the vendor was told had been delivered.
 *
 * @param {object} supabase
 * @param {string} couplePhone  `public.conversations.counterparty_phone`, +E164
 * @returns {Promise<{open: boolean, reason: string, hours?: number, rows?: number}>}
 */
async function coupleWindowOpen(supabase, couplePhone) {
  if (!supabase || !couplePhone) return { open: false, reason: 'no_supabase_or_phone' };

  try {
    // Witness for these columns: `docs/db/PUBLIC_SCHEMA.md:190-204` lists
    // `public.conversations` at 12 columns — id(1), counterparty_phone(4),
    // kind(5). The `conversations_kind_check` CHECK at :1165-1166 enumerates the
    // six legal kinds, of which `couple_thread` is one. The phone lookup is
    // indexed: `conversations_counterparty_phone_idx` at :2230.
    const { data: convos, error: convoErr } = await supabase
      .from('conversations')
      .select('id')
      .eq('counterparty_phone', couplePhone)
      .in('kind', VENDOR_LANE_KINDS);

    if (convoErr) return { open: false, reason: 'conversation_query_failed' };

    const ids = (convos || []).map((c) => c.id);
    if (ids.length === 0) return { open: false, reason: 'no_conversation' };

    // Witness: `docs/db/PUBLIC_SCHEMA.md:591-609` lists `public.messages` at 18
    // columns — conversation_id(2), direction(3), created_at(11). There is NO
    // phone column on `public.messages`, which is why `conversations` is the
    // necessary join rather than a convenience.
    //
    // THE UNION IS THE POINT. `.in(...)` over EVERY matching row is what makes
    // this a pair question. Restricting it to one row is the m1 mutation and it
    // must go red: the founder's paste holds two threads whose last inbounds are
    // 47 seconds apart, and a single-row scan reads the older one.
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
      return { open: false, reason: 'no_inbound_ever', rows: ids.length };
    }

    const hours = (Date.now() - new Date(lastInbound.created_at).getTime()) / (1000 * 60 * 60);
    if (hours > WINDOW_HOURS) {
      return { open: false, reason: 'window_closed', hours: Math.round(hours), rows: ids.length };
    }
    return { open: true, reason: 'in_window', hours: Math.round(hours), rows: ids.length };
  } catch (err) {
    // A thrown client is the same fact as a closed window for our purposes, and
    // the caller logs it. Swallowing SILENTLY is what F-07.38 was minted for, so
    // the reason travels back rather than dying here.
    return { open: false, reason: `window_check_threw:${err && err.message}` };
  }
}

module.exports = { coupleWindowOpen, VENDOR_LANE_KINDS, WINDOW_HOURS };
