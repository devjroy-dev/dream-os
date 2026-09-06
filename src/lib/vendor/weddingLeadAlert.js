// src/lib/vendor/weddingLeadAlert.js
// BLOCK 19 · G1.3 rider 4 — R-40.72. THE ALERT FOR A LEAD BORN ON A WEDDING PAGE.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS: NINE LEADS AND NOT ONE VENDOR TOLD
// ═══════════════════════════════════════════════════════════════════════════
// G1.2 and G1.3 wrote leads and notified nobody. `createLead` has no notify
// path; neither wedding door imported anything from the messaging side. A
// vendor whose OWN PAGE produced a lead learned of it only by opening her Leads
// room, or never. That is not a defect in either build — notification was never
// chartered — but it was the largest live gap in the arc, and R-40.72 closes it.
//
// ── ONE HOME, TWO DOORS, TWO SHAPES ────────────────────────────────────────
// The download door alerts THE OWNER (one lead, one send). The team door alerts
// EACH TARGET (N sends). Two consents, two shapes, one mechanism — because a
// second copy of this logic at the second door is how the two start disagreeing
// about what a vendor is told.
//
// ── THE TEMPLATE IS `lead_alert_basic`, FOR EVERYONE (R-40.72 §1–2) ────────
// UNTIERED, and that is a ruling with a derivation behind it rather than a
// shrug. `enquiry_alert_vendor` is the paid-tier template and its variable {{2}}
// is THE BRIDE'S NAME. A wedding-page lead writes `name: null` — a guest gives a
// number and a tick and is never asked who she is — so a paid vendor would
// receive `'a couple'` and the two templates would carry identical information.
// Tiering here would be a distinction with nothing behind it.
//
// `lead_alert_basic` is MARKETING and identity-free by design: {{1}} the
// VENDOR'S OWN name, {{2}} the month phrase, {{3}} the leads link. Not one
// variable carries hers. That matters more here than on the couple door: the
// guest is a stranger to every vendor on the roll except the owner.
//
// ── THE OPT-OUT GATE IS `sendWa`'s, NOT REIMPLEMENTED HERE ─────────────────
// MARKETING category means a vendor who has opted out must not be reached.
// `sendWa` refuses an opted-out recipient with a typed `WaOptedOutError` BEFORE
// any dispatch, on every line — so this module must NOT pre-check and must not
// swallow. It catches, classifies, and reports; the refusal is a result, not an
// error to hide.
'use strict';

const { sendWa } = require('../sendWa');
const { monthPhrase } = require('../discover/demoLeadAlert');
const VENDOR_LEADS_URL = require('../pwaPaths').vendorUrl('leadsList');

/**
 * ── THE CAP (R-40.72 §3) ───────────────────────────────────────────────────
 * TEN. Hard, and asserted by a cell whose mutation removes it.
 *
 * ⚠ THIS IS THE FIRST PLACE IN THE ESTATE WHERE ONE GUEST ACTION MULTIPLIES
 * OUTBOUND MESSAGE COST. Every prior alert path was one enquiry, one vendor, one
 * send. A team booking is N sends from a single tap, and N is the size of a roll
 * that a vendor controls — so an unbounded fan-out is a bill a stranger can
 * write. Ten is far above any real roll (the ruled role list is itself ten) and
 * far below anything that could hurt.
 *
 * The LEADS are never capped. Every target gets its row; the cap governs
 * MESSAGES only, and the handover says so, because a vendor silently missing a
 * lead would be a worse failure than a vendor missing a notification.
 */
const MAX_ALERTS_PER_TAP = 10;

/**
 * ── THE TEMPLATE, IN ONE PLACE, BECAUSE IT IS ABOUT TO MOVE (F-40.176) ──────
 * The walk proved the cost of MARKETING: Meta dropped Swati's alert with
 * `131049` — the marketing throttle, which silently declines a MARKETING
 * template to a user who has not engaged recently. Dev Roy's arrived because he
 * had. That will hit real vendors, and it will hit the ones who most need the
 * alert: the quiet ones.
 *
 * R-40.72 is amended — a UTILITY body is authored and submitted, and this
 * pointer moves to it on approval. It is a named constant rather than a literal
 * at the call site precisely so that day is a one-line change with one cell
 * guarding it, instead of a grep.
 */
// ── RE-POINTED 2026-09-07 — F-40.176 CLOSED AT THE REGISTRY, NOT AT THE WALK.
// `tdw_lead_alert_utility` came back ACTIVE from Meta, category UTILITY, id
// 1753685715867036, founder-witnessed in WhatsApp Manager. The marketing
// throttle (`131049`) that dropped Swati's alert cannot apply to a Utility
// template, so the vendors this was failing — the quiet ones, who had not
// messaged us recently — are the ones it now reaches.
//
// ⚠ THE HOIST IS WHY THIS IS ONE LINE HERE, and it was still not a one-line
// DELIVERY: `sendWa`'s gate is `isApproved`, which reads the registry, so
// `templates.js` gained the entry in the same packet. Saying "one line" of the
// call site and meaning the delivery was this seat's own imprecision, corrected.
//
// ⚠ AND THE CLOSE IS NOT THE APPROVAL MAIL. Meta may re-classify a template it
// judges promotional at any later review. What closes F-40.176 is a real alert
// ARRIVING at a vendor who has not messaged us in a fortnight — Swati was the
// specimen and is the test. Until that walk, this is a cure believed, not seen.
const TEMPLATE_KEY = 'lead_alert_utility';

/**
 * Alert one vendor about one wedding-page lead.
 *
 * Returns a plain result — never throws. A notification that fails must not cost
 * the guest her enquiry or the vendor her lead: the row is already written and
 * durable by the time this runs, and that ordering is deliberate.
 *
 * @returns {{vendor_id: string, sent: boolean, reason: string|null, wamid: string|null}}
 */
/**
 * ── THE ROW IS WRITTEN FOR EVERY OUTCOME, NOT JUST THE GOOD ONE (F-40.177) ──
 * The walk sent two alerts and Railway said `home=none matched=0 — NO ROW
 * CARRIES THIS SID` on every receipt, because the send wrote nothing anywhere.
 * Meta then reported one `delivered` and one `failed` and the estate persisted
 * neither. A room can never say 「told」 about a thing it did not write down.
 *
 * ⚠ FAILURES GET ROWS TOO, and they are the ones most worth having: an
 * `opted_out` row is the only durable evidence that a vendor was skipped
 * lawfully rather than missed. `wamid` is null there, which is exactly why 0141
 * makes the unique index PARTIAL.
 *
 * Never throws. A bookkeeping failure must not cost a vendor her alert or a
 * guest her enquiry — the send has already happened by the time this runs.
 */
async function recordAlert(supabase, row) {
  if (!supabase) return;
  try {
    await supabase.from('lead_alerts').insert(row);
  } catch (e) {
    // Named, not swallowed. F-06.143's lesson: an unrecorded failure to record
    // is how three days of dead notifications stayed invisible.
    console.warn('[leadAlert:record] insert failed:', e && e.message);
  }
}

async function alertOne(supabase, { vendorId, vendorName, userPhone, weddingDate, leadId, source }) {
  if (!userPhone) {
    await recordAlert(supabase, {
      vendor_id: vendorId, lead_id: leadId || null, source: source || null,
      template_key: TEMPLATE_KEY, wamid: null, status: 'no_phone',
    });
    // A vendor with no phone on `public.users` cannot be reached and this is not
    // an error — it is a fact about that account. `enquire.js` refuses the whole
    // enquiry in this case; here the LEAD IS ALREADY WRITTEN, so refusing would
    // undo nothing and help nobody.
    return { vendor_id: vendorId, sent: false, reason: 'no_phone', wamid: null };
  }
  try {
    const out = await sendWa({
      line: 'vendor',
      to: userPhone,
      templateKey: TEMPLATE_KEY,
      // Positional, in the registry's declared order. `monthPhrase(null)`
      // returns 'upcoming' — ONE HOME, already correct, and the reason a blank
      // month field needs no special case here. The seat's first reading of this
      // was that a missing month would block the send; it does not, and saying
      // so here keeps the wrong version from being rediscovered.
      vars: [vendorName || 'there', monthPhrase(weddingDate), VENDOR_LEADS_URL],
      supabase,
    });
    const wamid = (out && (out.wamid || (out.messages && out.messages[0] && out.messages[0].id))) || null;
    await recordAlert(supabase, {
      vendor_id: vendorId, lead_id: leadId || null, source: source || null,
      template_key: TEMPLATE_KEY, wamid, status: 'sent',
    });
    return {
      vendor_id: vendorId,
      sent: true,
      reason: null,
      // The room's told state reads `wamid` ONLY (R-40.72 §4) — never the body,
      // never the recipient. It is the one field Meta's own status webhook can
      // be correlated against, and now the one 0141 indexes.
      wamid,
    };
  } catch (e) {
    // ⚠ CLASSIFIED, NOT SWALLOWED. An opted-out vendor is a LAWFUL outcome and
    // reads as `opted_out`, not as a failure — MARKETING category means opting
    // out is a right, and a log that calls it an error trains an operator to
    // ignore the line. Everything else keeps its own code so the walk can name
    // what happened rather than guess.
    const reason = (e && e.name === 'WaOptedOutError') ? 'opted_out'
                 : (e && (e.code || e.name)) || 'send_failed';
    await recordAlert(supabase, {
      vendor_id: vendorId, lead_id: leadId || null, source: source || null,
      template_key: TEMPLATE_KEY, wamid: null, status: reason,
      error_code: (e && e.code) ? String(e.code) : null,
      error_title: (e && e.message) ? String(e.message).slice(0, 200) : null,
    });
    return { vendor_id: vendorId, sent: false, reason, wamid: null };
  }
}

/**
 * Alert every vendor on a wedding-page lead write.
 *
 * `targets` is `[{ vendor_id, name }]` — the SAME shape `teamSet` returns, so
 * the set that received leads and the set that receives alerts are one list.
 * The download door passes an array of one: the owner.
 *
 * ⚠ SEQUENTIAL, NOT `Promise.all`. Ten template sends fired at once is a burst
 * against a rate-limited API, and the loop's cost is irrelevant beside a guest
 * who has already been redirected.
 *
 * ⚠ AND IT IS CALLED AFTER THE LEADS ARE WRITTEN, NEVER BEFORE. The row is the
 * durable half; the message is the courtesy. If this whole module throws, the
 * caller must still have written its leads and answered its guest.
 */
async function alertWeddingLead(supabase, { targets, weddingDate, logger, leadIdByVendor, source }) {
  const list = Array.isArray(targets) ? targets : [];
  const capped = list.slice(0, MAX_ALERTS_PER_TAP);
  const skipped = list.length - capped.length;

  const ids = capped.map((t) => t.vendor_id).filter(Boolean);
  if (!ids.length) return { attempted: 0, sent: 0, skipped, results: [] };

  // One read for all of them. `users.phone` is where a vendor is reachable —
  // `vendors` carries no phone of its own, which `enquire.js` also relies on.
  const { data: vendorRows } = await supabase
    .from('vendors').select('id, user_id, business_name').in('id', ids);
  const userIds = (vendorRows || []).map((v) => v.user_id).filter(Boolean);
  const { data: userRows } = userIds.length
    ? await supabase.from('users').select('id, phone').in('id', userIds)
    : { data: [] };
  const phoneByUser = (userRows || []).reduce((a, u) => { a[u.id] = u.phone; return a; }, {});
  const vById = (vendorRows || []).reduce((a, v) => { a[v.id] = v; return a; }, {});

  const results = [];
  for (const t of capped) {
    const v = vById[t.vendor_id];
    const r = await alertOne(supabase, {
      vendorId: t.vendor_id,
      // The REGISTERED name, from the row just read — never the name a credit
      // was typed with (F-40.54).
      vendorName: (v && v.business_name) || t.name,
      userPhone: v ? phoneByUser[v.user_id] : null,
      weddingDate,
      leadId: leadIdByVendor ? leadIdByVendor[t.vendor_id] : null,
      source,
    });
    results.push(r);
    if (!r.sent && logger && logger.error) {
      logger.error('weddingLeadAlert', { vendor_id: r.vendor_id, reason: r.reason });
    }
  }

  if (skipped > 0 && logger && logger.error) {
    // NEVER SILENT. A cap that trims without saying so is a cap nobody can audit.
    logger.error('weddingLeadAlert:capped', { requested: list.length, cap: MAX_ALERTS_PER_TAP, skipped });
  }

  return {
    attempted: capped.length,
    sent: results.filter((r) => r.sent).length,
    skipped,
    results,
  };
}

module.exports = { alertWeddingLead, alertOne, recordAlert, MAX_ALERTS_PER_TAP, TEMPLATE_KEY };
