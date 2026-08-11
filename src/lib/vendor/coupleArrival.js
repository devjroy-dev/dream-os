// src/lib/vendor/coupleArrival.js
// ── TDW_06 · THE BRIDE'S ARRIVAL — F-06.177 / F-06.178 / F-06.179 ────────────
//
// WHAT ARRIVES HERE. A woman the estate wrote to, replying. Everything in this
// file exists because the arc that built the vendor→bride hand never once
// designed her end of it: eight walks patched the send from six directions, and
// on walk eight the estate sent her a template NAMING her vendor, with a button,
// she pressed it, and the router asked her which of three vendors she meant.
// She is the only person in this arc who did not sign up for it.
//
// TWO QUESTIONS, DELIBERATELY SEPARATE, AND THE SEPARATION IS THE RULING:
//
//   ROUTING  — whose thread do her words belong to?
//   THE SEND — is there an approved draft that may now go to her?
//
// They get different answers on purpose. Routing follows HER: an explicit TDW
// code, then a sticky vendor from her own recent engagement, and only then the
// doorbell, because the doorbell is the ESTATE'S inference about why she is
// writing and misdelivering her live conversation with vendor X into vendor Y's
// thread is the worst failure this lane can produce. The SEND follows THE
// WINDOW, which is phone-level: Meta opens the 24-hour window on the (lane PNID,
// her MSISDN) pair and does not care which conversation row the estate filed her
// words under. So an arrival that routes to vendor X can lawfully release an
// approved draft from vendor Y — the doorbell's own promise to her was that
// replying here would reach the vendor who wrote, and that promise is kept
// regardless of where her sentence was filed.
//
// NEITHER FUNCTION EVER THROWS. This lib is called from inside the couple-lane
// routing region, whose every branch owes her a reply. A relay fault must not
// cost her the answer she came for — F-06.141's class, and not one to
// re-instance in the file that inherited it.

'use strict';

const drafts = require('./coupleDrafts');
// ONE HOME, NEVER A SECOND IMPLEMENTATION. The bride's display name is resolved
// by `coupleDisplayName` in `src/lib/vendor/relayToCouple.js`, which every other
// relay site already calls. Writing a second resolver here would be a fourth
// inline implementation of a question the estate answered once — the exact
// pattern `coupleWaWindow.js`'s own header names and refuses.
const { coupleDisplayName } = require('./relayToCouple');

/**
 * F-06.177 — IS A DOORBELL STANDING FOR THIS PHONE?
 *
 * Asks the store the question the router asked HER on walk eight. Returns the
 * vendor the estate itself named to her in the doorbell template, or null.
 *
 * WHY THIS IS NOT A GUESS. The draft row carries `vendor_id`; the doorbell
 * template carries that vendor's name in `{{2}}`; `markDoorbell`
 * (`src/lib/vendor/coupleDrafts.js`) wrote `refusal_reason = 'doorbell:<sid>'`
 * on the row at the moment the template went out. The estate is not inferring
 * who she means — it is REMEMBERING WHAT IT TOLD HER, one message earlier.
 *
 * @returns {Promise<{vendorId: string|null, draftId: string|null, reason: string}>}
 */
async function doorbellRouteFor(supabase, couplePhone) {
  try {
    const found = await drafts.standingDoorbellFor(supabase, couplePhone);
    if (!found.draft) return { vendorId: null, draftId: null, reason: found.reason };
    return { vendorId: found.draft.vendor_id, draftId: found.draft.id, reason: 'doorbell_standing' };
  } catch (e) {
    return { vendorId: null, draftId: null, reason: `doorbell_route_threw:${e && e.message}` };
  }
}

/**
 * F-06.178 — THE AUTO-SEND'S TRIGGER, AT LAST ATTACHED TO AN ACT THAT HAPPENS.
 *
 * R-29.35 removed the second affirmative: an APPROVED draft goes the moment her
 * reply opens the window, because there is nothing left to ask him. The consumer
 * for that ruling shipped in `relaySeat.js` and its producer was never built —
 * `windowJustOpened` had two setters estate-wide and both were bench cells. This
 * is the producer, and it is her arrival, because her arrival IS the window
 * opening.
 *
 * ORDER IS LOAD-BEARING AND IT IS F-06.179's WHOLE POINT. This runs AFTER her
 * inbound has been persisted by the calling terminal. `coupleWindowOpen` answers
 * by scanning `public.messages` for the newest inbound across her `couple_thread`
 * rows; if her arrival is not on file, the estate's own predicate reads CLOSED
 * on the exact turn Meta opened the window, `relayToCouple` refuses correctly,
 * and the auto-send never fires. Calling this before the insert would produce a
 * green function over a red wire — the precise shape R-29.34 was minted for.
 *
 * FAIL-CLOSED BY INHERITANCE. Nothing here decides whether the window is open;
 * `sendApprovedDraft` → `relayToCouple` asks `coupleWindowOpen` first, exactly
 * as the vendor's own turn does. Window-first has never failed in eight walks
 * and this path does not become its ninth exception.
 *
 * THE VENDOR IS TOLD ON HIS OWN PHONE. He is not in a turn — she is. So the
 * outcome byte is pushed to his handset the way `relayReceipt` pushes №14/№15,
 * from the vendor lane's own number. Every byte is founder-vetoed and already in
 * the registry; this function mints none.
 *
 * THE BRIDE IS TOLD NOTHING (chair-ruled). If the draft expired before she
 * replied, she hears silence, because a sentence to her about the expiry of a
 * draft she never knew existed is machinery-narration to a customer. Silence is
 * not a promise. The vendor hears ⑥ and can send again.
 *
 * @returns {Promise<{kind: string, draftId?: string, reason?: string}>}
 */
async function arrivalAutoSend(supabase, couplePhone, deps = {}) {
  const { sendWhatsApp, env } = deps;
  try {
    if (!supabase || !couplePhone) return { kind: 'skipped', reason: 'no_supabase_or_phone' };

    // THE STORE FIRST. Cheap, indexed, and it exits on the overwhelmingly common
    // case — a bride arriving with no draft waiting costs one indexed lookup.
    const found = await drafts.approvedForPhone(supabase, couplePhone);

    if (!found.draft) {
      // ⑥ SPEAKS ONLY ON A GENUINE EXPIRY. `approvedForPhone` self-heals a
      // past-`expires_at` row to `expired` and reports it by name, so this arm
      // fires on a state transition that just happened, never on a guess. Every
      // other absence is silent by construction: there was nothing to send.
      if (found.reason === 'expired') {
        console.log(`[relay:wa] arrival_expired phone=${couplePhone}`);
        await tellVendorOfExpiry(supabase, couplePhone, deps);
        return { kind: 'expired', reason: found.reason };
      }
      console.log(`[relay:wa] arrival_no_draft phone=${couplePhone} reason=${found.reason}`);
      return { kind: 'no_draft', reason: found.reason };
    }

    const draft = found.draft;
    const { data: vendor } = await supabase
      .from('vendors').select('*').eq('id', draft.vendor_id).maybeSingle();
    if (!vendor) {
      console.warn(`[relay:wa] arrival_auto_send vendor_missing draft=${draft.id}`);
      return { kind: 'vendor_missing', draftId: draft.id };
    }

    const relaySeat = require('./relaySeat');
    const name = await coupleDisplayName(supabase, draft.vendor_id, draft.couple_phone);

    // THE WITNESS LINE, BEFORE THE ATTEMPT (F-06.171's law: a door that declines
    // without saying why is not observable — and a door that SUCCEEDS without
    // saying it attempted is the same silence wearing a better outcome).
    console.log(`[relay:wa] auto_sent attempt draft=${draft.id} vendor=${vendor.id} phone=${couplePhone}`);

    const out = await relaySeat.sendApprovedDraft(supabase, vendor, draft, name, {
      sendWhatsApp,
      env,
      // R-29.35: the row is ALREADY `approved` — his E3 yes, held across a shut
      // window. Re-approving it would fail the state guard correctly and strand
      // a draft he has already authorised.
      preApproved: true,
    });

    if (!out || !out.line) {
      console.warn(`[relay:wa] auto_send produced no outcome draft=${draft.id}`);
      return { kind: 'no_outcome', draftId: draft.id };
    }

    // THE FOUNDER-READABLE WITNESS (R-29.34 member (b)). One line, the outcome
    // named, the draft named — this is the line the founder reads on walk nine.
    console.log(`[relay:wa] auto_sent ${out.kind} draft=${draft.id} vendor=${vendor.id}`);
    await tellVendor(supabase, vendor, out.line, deps);
    return { kind: out.kind, draftId: draft.id };
  } catch (e) {
    console.warn('[relay:wa arrival-auto-send]', e && e.message);
    return { kind: 'threw', reason: e && e.message };
  }
}

// ── THE VENDOR'S OWN HANDSET ────────────────────────────────────────────────
// He is not in a turn, so there is no reply to append to. This is the same shape
// `relayReceipt` uses for №14/№15, pinned to the vendor lane's number: the
// relay's bytes ride the vendor PNID or they do not ride at all (F-06.147).
async function tellVendor(supabase, vendor, line, deps = {}) {
  try {
    const { sendWhatsApp, env } = deps;
    const from = (env || process.env).VENDOR_WHATSAPP_NUMBER;
    if (typeof sendWhatsApp !== 'function' || !from || !vendor || !vendor.phone) {
      console.warn('[relay:wa] arrival outcome undeliverable to vendor — no transport, lane or phone');
      return false;
    }
    await sendWhatsApp(vendor.phone, line, [], from);
    return true;
  } catch (e) {
    console.warn('[relay:wa arrival-tell-vendor]', e && e.message);
    return false;
  }
}

// ⑥ `expiredLine` — the registry's own byte for a draft whose 24 hours ran out.
async function tellVendorOfExpiry(supabase, couplePhone, deps = {}) {
  try {
    // THE STORE IS ASKED THROUGH ITS OWN FILE. This lookup used to name
    // `pending_couple_drafts` here, which broke the one-home law the sealed
    // bench sweeps for (§7.3) — caught by the floor, not by me, and the floor
    // was right: a reader outside the store is a second place the column list
    // can drift from the migrations that witness it.
    const { vendorId } = await drafts.lastExpiredVendorFor(supabase, couplePhone);
    if (!vendorId) return false;
    const { data: vendor } = await supabase
      .from('vendors').select('*').eq('id', vendorId).maybeSingle();
    if (!vendor) return false;
    const { expiredLine } = require('./relaySeat');
    return await tellVendor(supabase, vendor, expiredLine(), deps);
  } catch (e) {
    console.warn('[relay:wa arrival-expiry]', e && e.message);
    return false;
  }
}

module.exports = { doorbellRouteFor, arrivalAutoSend };
