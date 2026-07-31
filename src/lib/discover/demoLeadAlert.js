// ─────────────────────────────────────────────────────────────────────────────
// src/lib/discover/demoLeadAlert.js
// TDW_07 P5 — THE FREE-LEAD HOOK. One home for the demo species' outbound.
//
// A couple enquires on a demo card. The demo vendor is not registered, has no
// account, and has never heard of us. This module is the entire moment: one
// template on the marketing lane, one prospect row, and a link that resolves to
// a page that already exists.
//
// ── WHY THIS IS ITS OWN FILE ─────────────────────────────────────────────────
// The real species writes a lead, a binder, an enquiry row and a tap. The demo
// species writes none of those — it has no vendor row to hang them on. Folding
// the two paths into one function would mean a function whose every second line
// is an `if (isDemo)`, and the door (couple/enquire.js) is already the estate's
// busiest fan-out. One species, one home.
//
// ── THE 25/DAY CAP DOES NOT BIND THIS SEND (CE-ruled 2026-07-31, P5 fork F4) ─
// The spec's guardrail reads "demo alerts respect STOP + the 25/day marketing
// governance WHERE APPLICABLE" (TDW_07_DISCOVER_FINAL.md §3). The chair resolved
// "where applicable" explicitly: the cap governs COLD OUTREACH — `runOpenerJob`
// picking `cold` prospects oldest-first up to `readDailyCap` (prospects.js:191).
// A demo lead alert is EVENT-DRIVEN: a couple acted, and a hook delayed past the
// moment it describes is a hook that has stopped working. Its governance is the
// three below, not the meter:
//   1. EXACTLY ONE PER ENQUIRY  — the caller calls once per enquiry; this
//      function sends at most once per call and reports which it did.
//   2. THE 48h BATCH            — anchored on `prospects.last_template_at`.
//   3. STOP                     — enforced by `sendWa` on every line, for free
//                                 (sendWa.js:199-206, typed WaOptedOutError).
// A SCALE REVISIT rides the finding ledger so this exemption cannot silently
// become policy at ten thousand vendors. If that revisit ever lands, the cap
// call belongs HERE, at the one send site, and nowhere else.
//
// [F-06.85: this paragraph is conditioned on a MECHANICAL fact — that the cap is
//  enforced only inside runOpenerJob and NOT inside sendWa. Mechanism:
//  `readDailyCap` at src/lib/prospects.js:44, whose only callers are
//  runOpenerJob:194 and api/admin/prospects.js:109. If a cap call ever appears
//  in sendWa, this paragraph is false and must be re-read.]
'use strict';

const { sendWa }        = require('../sendWa');
const { updateProspect } = require('../prospects');

// The batch window. The spec's own number: "repeat enquiries within 48h batch
// into one" (TDW_07_DISCOVER_FINAL.md §P5.2).
const BATCH_WINDOW_MS = 48 * 60 * 60 * 1000;

// FOUNDER-GIVEN 2026-07-31, verbatim: `https://thedreamwedding.in/demo/vendor/{handle}`.
// The landing exists TODAY — app/demo/vendor/[handle]/page.tsx, which posts to
// POST /api/v2/demo/vendor/:handle/claim (src/api/demo/vendor.js:231). Block 08
// P2 replaces that landing with the self-serve claim flow; when it does, this
// constant does not move and the APPROVED template body does not change a byte,
// because {{3}} was always a URL and is still the same URL.
const CLAIM_BASE = 'https://thedreamwedding.in/demo/vendor/';

// The prospect's note. The spec says the row is upserted "so the Closer knows
// this prospect is WARM — state note `demo_lead`" (§P5.2). RULED (P5 fork F2,
// 2026-07-31): `demo_lead` is NOT a legal `prospects.state` — the CHECK admits
// only cold|templated|replied|in_session|converted|opted_out|expired
// (PUBLIC_SCHEMA.md:1516). The spec's own word is "note", and `prospects.notes`
// satisfies it literally, at zero DDL. See STATE_AFTER_SEND below for the other
// half of that ruling.
const DEMO_LEAD_NOTE = 'demo_lead';

// RULED (F2, same sitting): the state is `templated`, and the word is simply
// true — a template WAS sent. It also keeps the row out of runOpenerJob's harvest
// BY CONSTRUCTION, because that job selects `state = 'cold'` (prospects.js:196).
// Writing `cold` here would enrol a vendor who just received an alert into the
// 10:00 IST marketing opener — a second, unrelated template the same day. The
// hazard dies at this constant.
const STATE_AFTER_SEND = 'templated';

/**
 * The month phrase for the template's {{2}}.
 *
 * The approved body reads "...asked about your work for their {{2}} wedding..."
 * so {{2}} must be a phrase that completes that sentence honestly. A known date
 * gives "December 2026"; an unknown one gives "upcoming", which is true of every
 * wedding and claims nothing about a date we were never told.
 *
 * Meta rejects empty template variables outright, so a fallback is not a nicety.
 */
function monthPhrase(weddingDate) {
  if (!weddingDate) return 'upcoming';
  const d = new Date(weddingDate);
  if (isNaN(d.getTime())) return 'upcoming';
  return `${d.toLocaleString('en-IN', { month: 'long', timeZone: 'UTC' })} ${d.getUTCFullYear()}`;
}

/** The claim link for a demo vendor, or null when the handle cannot form one. */
function claimLinkFor(igHandle) {
  const h = String(igHandle == null ? '' : igHandle).trim();
  if (!h) return null;
  return CLAIM_BASE + encodeURIComponent(h);
}

/**
 * Is this demo vendor inside the 48h batch window?
 *
 * IDEMPOTENCY IS THE ANCHOR'S, NOT A FLAG'S. `prospects.last_template_at` is
 * stamped only after a send this module actually made, so "have we alerted this
 * phone recently" is answered by the same column that answers "when". A boolean
 * would be a second source of truth for one fact, and the estate has paid for
 * that shape before (the DEFAULT_CLIENT_NAME referent lesson, enquiryBinder.js:26).
 *
 * NOTE ON FIRST EXERCISE: `last_template_at` is NULL on every live prospect row
 * (founder SELECT, 2026-07-31) — this predicate has never run against a stamped
 * row in production. The bench drives both sides deliberately, per the chair's
 * adoption of that caveat as the cell's requirement.
 */
function withinBatchWindow(prospect, now) {
  if (!prospect || !prospect.last_template_at) return false;
  const last = new Date(prospect.last_template_at).getTime();
  if (isNaN(last)) return false;
  return (now - last) < BATCH_WINDOW_MS;
}

/**
 * Fire the free-lead hook for one enquiry on one demo vendor.
 *
 * @param supabase
 * @param {object}  opts
 * @param {object}  opts.demoVendor   a public.demo_vendors row (id, display_name,
 *                                    ig_handle, whatsapp_phone)
 * @param {string?} opts.weddingDate  the couple's date, when known
 * @param {number?} opts.now          epoch ms, injectable for the bench
 * @param {object?} opts.deps         sendWa dependency injection, bench only
 *
 * @returns {Promise<{ok:boolean, sent:boolean, reason:string, prospectId?:string}>}
 *   NEVER THROWS. The enquiry itself must survive every failure here — a couple
 *   who tapped Enquire has done her part, and the vendor's unreachability is not
 *   her error to receive. Every outcome is reported, none is silent: `reason` is
 *   always populated and every non-send path logs.
 */
async function sendDemoLeadAlert(supabase, opts) {
  const { demoVendor, weddingDate, deps } = opts || {};
  const now = (opts && typeof opts.now === 'number') ? opts.now : Date.now();

  if (!demoVendor || !demoVendor.id) {
    console.error('[demo-lead-alert] called without a demo vendor row — no send');
    return { ok: false, sent: false, reason: 'no_demo_vendor' };
  }

  // ── THE TARGET ────────────────────────────────────────────────────────────
  // `demo_vendors.whatsapp_phone` is NULLABLE (PUBLIC_SCHEMA.md:383) and is NULL
  // on all six discover-eligible rows in production today (founder SELECT,
  // 2026-07-31). This is therefore the LIVE default path, not an edge case, and
  // it is why it logs at error rather than warn: a demo card that can be
  // enquired on but never alerts its vendor is the product failing silently,
  // which is the exact class this sitting exists to end.
  const phone = demoVendor.whatsapp_phone;
  if (!phone) {
    console.error(
      `[demo-lead-alert] demo vendor ${demoVendor.id} (${demoVendor.ig_handle || 'no-handle'}) ` +
      'has no whatsapp_phone — enquiry stored, NO ALERT SENT'
    );
    return { ok: false, sent: false, reason: 'no_whatsapp_phone' };
  }

  const claimLink = claimLinkFor(demoVendor.ig_handle);
  if (!claimLink) {
    console.error(`[demo-lead-alert] demo vendor ${demoVendor.id} has no ig_handle — cannot form claim link, NO ALERT SENT`);
    return { ok: false, sent: false, reason: 'no_claim_link' };
  }

  // ── THE PROSPECT (read before send; the batch anchor lives here) ──────────
  let prospect = null;
  try {
    const { data } = await supabase
      .from('prospects')
      .select('id, phone, state, notes, demo_vendor_ref, last_template_at')
      .eq('phone', phone)
      .maybeSingle();
    prospect = data || null;
  } catch (err) {
    console.warn('[demo-lead-alert] prospect read failed (treating as first contact):', err.message);
  }

  // ── THE 48h BATCH ────────────────────────────────────────────────────────
  // The enquiry is already stored by the caller. What batches is the ALERT, not
  // the lead: the vendor hears once, and finds both enquiries when he claims.
  if (withinBatchWindow(prospect, now)) {
    console.log(
      `[demo-lead-alert] BATCHED — demo vendor ${demoVendor.id} alerted within ${BATCH_WINDOW_MS / 3600000}h ` +
      `(last ${prospect.last_template_at}); enquiry stored, no second template`
    );
    return { ok: true, sent: false, reason: 'batched_48h', prospectId: prospect.id };
  }

  // ── THE SEND ─────────────────────────────────────────────────────────────
  // Marketing lane: this is outreach to someone who never registered. STOP is
  // enforced inside sendWa on every line and needs nothing from us; the typed
  // WaOptedOutError is caught below and REPORTED, never swallowed.
  try {
    await sendWa({
      line:        'marketing',
      to:          phone,
      templateKey: 'demo_lead_alert',
      vars: {
        name:       demoVendor.display_name || demoVendor.ig_handle,
        month:      monthPhrase(weddingDate),
        claim_link: claimLink,
      },
      supabase,
    }, deps || {});
  } catch (err) {
    // Every refusal shape lands here: opted out, line unconfigured, template not
    // approved, transport failure. All of them are the vendor not hearing, and
    // all of them say so out loud.
    console.error(
      `[demo-lead-alert] send REFUSED for demo vendor ${demoVendor.id} ` +
      `(${err.name || 'Error'}: ${err.message}) — enquiry stored, NO ALERT SENT`
    );
    return { ok: false, sent: false, reason: err.code || err.name || 'send_failed' };
  }

  // ── THE STAMP (only after a send that actually happened) ─────────────────
  // ORDER IS DELIBERATE: send first, stamp second. A stamp written before a
  // refusal would open a 48h hole in which the vendor is never told anything —
  // the batch window suppressing alerts for a template that never left. If the
  // stamp fails, the send still happened and the next enquiry may alert twice;
  // one duplicate is a smaller harm than two days of silence, and the warn says
  // so out loud. (The leadPings drain's own order-and-reason, leadPings.js:130.)
  const stamp = new Date(now).toISOString();
  try {
    if (prospect) {
      await updateProspect(supabase, prospect.id, {
        state:            STATE_AFTER_SEND,
        notes:            DEMO_LEAD_NOTE,
        demo_vendor_ref:  demoVendor.id,
        last_template_at: stamp,
      });
      return { ok: true, sent: true, reason: 'sent', prospectId: prospect.id };
    }

    const { data: created, error } = await supabase
      .from('prospects')
      .insert({
        phone,
        name:             demoVendor.display_name || null,
        ig_handle:        demoVendor.ig_handle || null,
        category:         demoVendor.category || null,
        city:             demoVendor.city || null,
        // `source` CHECK admits only sheet|manual|other (PUBLIC_SCHEMA.md:1514).
        // 'discover' is NOT legal and this row will not invent it: 'other' is the
        // enum's own honest catch-all, and `notes` carries the provenance.
        source:           'other',
        state:            STATE_AFTER_SEND,
        notes:            DEMO_LEAD_NOTE,
        demo_vendor_ref:  demoVendor.id,
        last_template_at: stamp,
      })
      .select('id')
      .single();
    if (error) throw error;
    return { ok: true, sent: true, reason: 'sent', prospectId: created.id };
  } catch (err) {
    console.warn(
      `[demo-lead-alert] alert SENT to demo vendor ${demoVendor.id} but the prospect stamp failed ` +
      `(${err.message}) — the next enquiry inside ${BATCH_WINDOW_MS / 3600000}h may alert a second time`
    );
    return { ok: true, sent: true, reason: 'sent_unstamped' };
  }
}

module.exports = {
  sendDemoLeadAlert,
  // exported for the bench and for any future scale-revisit that needs the numbers
  monthPhrase,
  claimLinkFor,
  withinBatchWindow,
  BATCH_WINDOW_MS,
  CLAIM_BASE,
  DEMO_LEAD_NOTE,
  STATE_AFTER_SEND,
};
