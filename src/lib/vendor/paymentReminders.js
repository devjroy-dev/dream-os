// src/lib/vendor/paymentReminders.js — BLOCK 19 · G3.4 · THE POLITE COLLECTOR, BUILT DARK.
//
// ═══════════════════════════════════════════════════════════════════════════
// THIS FILE SENDS NOTHING TODAY, AND THAT IS THE DESIGN
// ═══════════════════════════════════════════════════════════════════════════
// Master §2.2's build-dark law: built whole, benched, behind ONE NAMED FLAG with
// the go-live step in the code and the charter. The grant flips the flag and
// nothing else moves.
//
// TWO GATES, BOTH CLOSED, AND DELIBERATELY NOT ONE — creditInvite.js's shape,
// which is the estate's precedent for exactly this:
//   1. `PAYMENT_REMINDER_SEND_ENABLED` — the named flag. Unset everywhere. The
//      founder's switch.
//   2. `isApproved('payment_reminder_couple')` — the registry's status.
// They fail for DIFFERENT REASONS: the flag says "we have not decided to send
// yet", the status says "Meta has not passed these words". A careless edit to
// either alone still cannot start traffic, and the caller can tell which is shut.
//
// ⚠ AND THE SECOND GATE IS ALREADY OPEN, WHICH IS WHY THE FIRST MATTERS MORE
// THAN IT DID WHEN THIS FILE WAS DRAFTED. `tdw_payment_reminder` was filed
// 2026-09-06 and Meta returned **Active – Quality pending · Utility** the same
// day (ID 1781270206634381, founder-witnessed on the template DETAIL page per
// R-40.71). So `isApproved` returns TRUE and THE FLAG IS THE ONLY THING BETWEEN
// THIS CODE AND A REAL CLIENT'S HANDSET. Said plainly, in the shape
// `reviewAsk.js` established for exactly this state, so nobody sets
// PAYMENT_REMINDER_SEND_ENABLED to try something out.
//
// "Quality pending" is the QUALITY RATING, not the review state; Active is the
// approval (the same reading `enquiry_alert_vendor` was shipped on,
// templates.js:663). The Insights banner "this template was edited during the
// selected date range" is that panel explaining VERSION AGGREGATION over the
// date window — it is not a state change and does not touch approval.
//
// ── WHY THIS ROUTES THROUGH sendWa (F-40.90's lesson) ──────────────────────
// `creditInvite.js` requires `../metaCloud` directly, which bypasses the
// cross-line opt-out gate, the nudge-class gate and `phoneNumberIdFor(line)` —
// and `metaCloud.resolveConfig` DEFAULTS the phone number id to
// MARKETING_PHONE_NUMBER_ID, so a vendor-lane entry would leave from marketing's
// number. Every send here goes through `sendWa` and pays those gates.
//
// ── THE LANE IS 'bride', AND THAT IS A RULING, NOT AN OVERSIGHT (R-G34.2) ──
// The recipient is the vendor's CLIENT. `phoneNumberIdFor('bride')` is the
// couple-facing number (+91 70117 88380). The registry's older `payment_reminder`
// key is a VENDOR-lane template that speaks to the vendor ("I'll update your
// books", templates.js:530) and cannot carry this message — F-40.142.
//
// ── SOLE WRITER OF TWO TABLES, AND READER OF A THIRD IT NEVER TOUCHES ──────
// WRITES: public.payment_reminders · public.payment_reminder_settings (0139).
// READS ONLY: public.payment_schedules — `src/lib/vendor/schedules.js` is its
// sole writer and is byte-untouched by this arc.
'use strict';

const { isApproved } = require('../templates');
const { sendWa } = require('../sendWa');

/** The registry key and the lane, each named once. */
const TEMPLATE_KEY = 'payment_reminder_couple';
const LANE = 'bride';

/**
 * THE ONLY `kind` THAT EXISTS, AND THE WINDOW IT MEANS.
 * R-G34.4 ruled ONE window at three days. `payment_reminders_kind_check` admits
 * exactly this value and the DATABASE refuses any other — so this constant and
 * that CHECK move together or neither moves (F-40.45's class).
 */
const KIND = 'due_3d';
const WINDOW_DAYS = 3;

/**
 * WHY THE SEND IS DARK RIGHT NOW, in words a handover can quote.
 * Returned rather than logged so the caller reports the reason instead of
 * inventing one.
 */
function sendGate() {
  const flagOn   = String(process.env.PAYMENT_REMINDER_SEND_ENABLED || '') === '1';
  const approved = isApproved(TEMPLATE_KEY);
  return {
    open: flagOn && approved,
    flagOn,
    approved,
    reason: flagOn
      ? (approved ? null : `template ${TEMPLATE_KEY} is not approved on the sending WABA`)
      : 'PAYMENT_REMINDER_SEND_ENABLED is not set',
  };
}

/**
 * MONEY, IN THE ESTATE'S ONE SPELLING. `Rs 60,000`, never `₹`, and grouped the
 * Indian way — 2,00,000 not 200,000. `Intl` with 'en-IN' is the platform's own
 * grouping and is not hand-rolled here.
 *
 * `amount_due` is an INTEGER of rupees (0139; and `schedules.js:31` computes it
 * as `Math.round(amount_total * pct / 100)`), so there is no paise to drop.
 */
function formatRs(amount) {
  const n = Number(amount || 0);
  return `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)}`;
}

/**
 * THE COMPOSED PHRASE — `{{2}}`, AND IT BEGINS UPPERCASE (R-G34.11).
 *
 * The filed body is `Hi {{1}}, a payment reminder from {{3}}. {{2}} is due on
 * {{4}}. UPI or cash, whichever suits.` — so `{{2}}` OPENS A SENTENCE and must
 * be capitalised or the client reads "…Photography. the second instalment…".
 *
 * Meta's review sample was filed lowercase ("the second instalment of Rs
 * 60,000") and that is fine: samples are for the reviewer and are never
 * transmitted. This function is the reason the message and the sample can differ
 * without either being wrong, and it is the one place that decision lives.
 *
 * `milestone_label` is the vendor's own free text (`schedules.js:28` trims it and
 * nothing else), so it may arrive capitalised, lowercase or empty. Only the FIRST
 * character is touched — upper-casing the whole string would shout, and
 * lower-casing the rest would break a label like "GST instalment".
 */
function composeMilestonePhrase(label, amountDue) {
  const raw = String(label || '').trim();
  const safe = raw || 'The next instalment';
  const opened = safe.charAt(0).toUpperCase() + safe.slice(1);
  return `${opened} of ${formatRs(amountDue)}`;
}

/**
 * THE DUE DATE AS THE CLIENT READS IT — `12 September`. No year: a reminder
 * three days out is never about next year, and a year makes the sentence read
 * like a legal notice rather than a message from her photographer.
 *
 * `due_date` is a DATE column, so it arrives as `YYYY-MM-DD` with no timezone.
 * Parsed as UTC deliberately: `new Date('2026-09-12')` is midnight UTC, and
 * formatting it in IST would be 05:30 on the same day — the same date. Using the
 * local constructor instead would shift some dates backwards in a negative-offset
 * deploy region, which is a bug nobody would see from India.
 */
function formatDueDate(dueDate) {
  if (!dueDate) return null;
  const d = new Date(`${String(dueDate).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', timeZone: 'UTC',
  }).format(d);
}

/**
 * IS HER STANDING SWITCH ARMED?
 *
 * AN ABSENT ROW MEANS OFF, and that is the ruling (R-G34.5), not a fallback. A
 * vendor who has never opened the room has no row here, and silence is never
 * read as consent — the sentence this whole feature is shaped around.
 *
 * A FAILED READ ALSO MEANS OFF. If the database cannot answer, the safe answer
 * is the one that sends nothing. Reported, never swallowed.
 */
async function autoSendOn(supabase, vendorId) {
  const { data, error } = await supabase
    .from('payment_reminder_settings')
    .select('auto_send')
    .eq('vendor_id', vendorId)
    .maybeSingle();
  if (error) {
    console.error(`[reminders:settings] read failed for vendor ${vendorId}: ${error.message}`);
    return false;
  }
  return !!(data && data.auto_send);
}

/**
 * ARM OR DISARM THE SWITCH. The sole writer of `payment_reminder_settings`.
 * Upsert on the primary key, because the row may not exist and a missing row is
 * a legitimate state rather than an error to repair first.
 */
async function setAutoSend(supabase, vendorId, on) {
  const { error } = await supabase
    .from('payment_reminder_settings')
    .upsert(
      { vendor_id: vendorId, auto_send: !!on, updated_at: new Date().toISOString() },
      { onConflict: 'vendor_id' },
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true, auto_send: !!on };
}

/**
 * HAS THIS VENDOR EVER SENT A REMINDER ON THIS INVOICE?
 *
 * THE FIRST ONE IS ALWAYS HER OWN TAP (R-G34's "silence never means yes"). The
 * standing switch releases the REST of an invoice's milestones; it never opens
 * the first. So the nightly sweep asks this question per invoice and skips any
 * invoice the vendor has not opened herself.
 *
 * ⚠ THIS READS `invoice_id`, NOT `milestone_id`, AND THAT IS THE POINT. The
 * invoice is the unit of her consent — she agreed to chase THIS client for THIS
 * job. Keying it to the milestone would mean every milestone needed its own tap
 * and the switch would release nothing.
 */
async function invoiceHasVendorTap(supabase, vendorId, invoiceId) {
  const { data, error } = await supabase
    .from('payment_reminders')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('invoice_id', invoiceId)
    .eq('source', 'vendor_tap')
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error(`[reminders:tap] read failed for invoice ${invoiceId}: ${error.message}`);
    return false; // cannot confirm consent ⇒ do not send
  }
  return !!data;
}

/**
 * SEND ONE REMINDER, AND THE INSERT IS THE DECISION.
 *
 * ── THE ONCE-PER-MILESTONE GUARANTEE IS THE UNIQUE KEY, NOT THIS CODE ──────
 * `payment_reminders_milestone_kind_key UNIQUE (milestone_id, kind)` is the
 * guarantee. This function INSERTS FIRST and sends only if the insert won the
 * row. A `SELECT ... then INSERT` would be two statements with a gap, and the gap
 * is where the second message to the same client comes from — on a retry, on two
 * instances, on a cron that overlaps itself. Postgres decides; we read its answer.
 *
 * ⚠ THE ROW IS WRITTEN BEFORE THE SEND, AND THAT ORDER IS DELIBERATE. A send
 * that fails still leaves a row, so that milestone is never chased twice.
 * `wamid` stays NULL and IS the record of which reminders actually reached Meta —
 * the room's `Sent` band reads exactly that column, and says **Sent**, never
 * Landed, because a wamid means WhatsApp ACCEPTED the message and never that it
 * reached her phone (the founder's amendment, G34_VETO_SHEET §A).
 *
 * ── WHAT IS COPIED ONTO THE ROW, AND WHY IT IS NOT A NORMALISATION SLIP ────
 * `milestone_label`, `amount_due` and `invoice_id` record what was TRUE AT THE
 * MOMENT OF THE ASK. `schedules.js:88` hard-deletes milestones and the FK is
 * ON DELETE SET NULL, so the row outlives its parent; and if the vendor later
 * rewrites a milestone from Rs 60,000 to Rs 40,000, the message that went out
 * still said 60,000. A ledger that re-derived the figure by join would rewrite
 * history to something the client never received.
 *
 * ── nudgeClass IS FALSE, AND IT IS CONDITIONAL (R-G34.7) ───────────────────
 * The reminder is a UTILITY template about a transaction the client is already
 * party to, so the couple-lane MARKETING pause does not gate it. IF THE MANAGER
 * EVER READS THIS TEMPLATE AS MARKETING, this single argument becomes `true` and
 * the opt-out CONDITION applies. That is the whole change, it is named here so it
 * is one line, and R-40.58 governs which way it goes — no seat reasons a
 * template's category from the badge it was filed under.
 *
 * The cross-line full stop (`isOptedOut`) runs on EVERY send regardless, inside
 * `sendWa`, and is not optional here or anywhere.
 */
async function sendOneReminder(supabase, { vendorId, milestone, invoice, vendorName, source }, deps = {}) {
  const gate = sendGate();
  const _sendWa = deps.sendWa || sendWa;

  const toPhone   = (invoice && invoice.client_phone) || null;
  const clientNm  = (invoice && invoice.client_name) || null;
  const phrase    = composeMilestonePhrase(milestone.milestone_label, milestone.amount_due);
  const dueWords  = formatDueDate(milestone.due_date);

  // ── CLAIM THE MILESTONE. The insert IS the decision. ────────────────────
  const claim = await supabase
    .from('payment_reminders')
    .insert({
      vendor_id:       vendorId,
      milestone_id:    milestone.id,
      invoice_id:      milestone.invoice_id,
      kind:            KIND,
      milestone_label: String(milestone.milestone_label || '').trim() || 'Instalment',
      amount_due:      milestone.amount_due,
      due_date:        milestone.due_date || null,
      to_phone:        toPhone,
      template:        'tdw_payment_reminder',
      source,
    })
    .select('id')
    .maybeSingle();

  if (claim.error) {
    // 23505 is the unique violation — this milestone has been reminded, ever.
    // It is the SUCCESS of the guarantee, not a failure, and it is distinguished
    // from a real error rather than swallowed with it.
    if (String(claim.error.code) === '23505') {
      return { ok: true, sent: false, already: true, reason: 'this milestone has already been reminded' };
    }
    return { ok: false, sent: false, reason: claim.error.message };
  }

  // ── THE REFUSALS, EACH NAMED, EACH LEAVING THE ROW STANDING ────────────
  // A row with a NULL wamid is the honest record of a reminder that was decided
  // and did not go. None of these pretends to be a send.
  if (!gate.open)  return { ok: false, sent: false, skipped: true, id: claim.data.id, reason: gate.reason };
  if (!toPhone)    return { ok: false, sent: false, skipped: true, id: claim.data.id, reason: 'this client has no phone number on the invoice' };
  if (!clientNm)   return { ok: false, sent: false, skipped: true, id: claim.data.id, reason: 'this invoice has no client name' };
  if (!dueWords)   return { ok: false, sent: false, skipped: true, id: claim.data.id, reason: 'this milestone has no due date' };
  if (!vendorName) return { ok: false, sent: false, skipped: true, id: claim.data.id, reason: 'your business name is not set' };

  let res;
  try {
    res = await _sendWa({
      line: LANE,
      to: toPhone,
      templateKey: TEMPLATE_KEY,
      // The four variables by their semantic names. `buildTemplatePayload` maps
      // them to {{1}}..{{4}} from the registry's own `variables` order; nothing
      // here relies on positional guessing.
      vars: { client: clientNm, milestone: phrase, vendor: vendorName, due: dueWords },
      // R-G34.7 — Utility. Flip to true if and only if the Manager says MARKETING.
      nudgeClass: false,
      supabase: deps.supabase || supabase,
    });
  } catch (err) {
    // Typed refusals from sendWa (opted out, line not configured, template not
    // approved) land here. The row stays; the reason is reported, never a false done.
    return { ok: false, sent: false, id: claim.data.id, reason: (err && err.message) || 'send failed' };
  }

  const wamid = res && res.result && res.result.wamid;
  if (wamid) {
    await supabase.from('payment_reminders').update({ wamid }).eq('id', claim.data.id);
  }
  return { ok: true, sent: true, id: claim.data.id, wamid: wamid || null };
}

/**
 * THE NIGHTLY SWEEP. Milestones falling due inside the window, for vendors whose
 * switch is armed, on invoices they have already opened themselves.
 *
 * ── THE PREDICATE IS state = 'pending', AND THE KICKOFF SAID 'unpaid' ──────
 * `payment_schedules_state_check` admits ('pending','paid','waived') ONLY.
 * `'unpaid'` is `invoices.state`'s default and does not exist on this table —
 * written that way this sweep would select zero rows forever, silently, and look
 * like a feature nobody used. The partial index it rides,
 * `payment_schedules_vendor_pending_idx ON (vendor_id, due_date) WHERE
 * state = 'pending'`, already existed before this arc.
 *
 * ── THE WINDOW IS today .. today+3, INCLUSIVE, IN IST ──────────────────────
 * The job runs at 03:25 Asia/Kolkata, so "today" is computed in IST rather than
 * the container's zone. A UTC "today" at 03:25 IST is still the previous date,
 * which would shift every reminder a day early — a bug that only appears in
 * production and only for a few hours each night.
 */
function istDayISO(offsetDays = 0) {
  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  now.setUTCDate(now.getUTCDate() + offsetDays);
  return now.toISOString().slice(0, 10);
}

async function runReminderSweep(supabase, deps = {}) {
  const _send = deps.sendOneReminder || sendOneReminder;
  const from = istDayISO(0);
  const to   = istDayISO(WINDOW_DAYS);

  const { data, error } = await supabase
    .from('payment_schedules')
    .select('id, invoice_id, vendor_id, milestone_label, amount_due, due_date, state')
    .eq('state', 'pending')
    .not('due_date', 'is', null)
    .gte('due_date', from)
    .lte('due_date', to);

  if (error) return { ok: false, scanned: 0, sent: 0, already: 0, skipped: 0, reason: error.message };

  const rows = data || [];
  let sent = 0, already = 0, skipped = 0;

  // Per-vendor answers are cached for the night: a studio with nine milestones
  // due asks the settings table once, not nine times.
  const armed = new Map();
  const vendorNames = new Map();
  const tapped = new Map();

  for (const ms of rows) {
    try {
      if (!armed.has(ms.vendor_id)) armed.set(ms.vendor_id, await autoSendOn(supabase, ms.vendor_id));
      if (!armed.get(ms.vendor_id)) { skipped++; continue; }

      const tapKey = `${ms.vendor_id}:${ms.invoice_id}`;
      if (!tapped.has(tapKey)) tapped.set(tapKey, await invoiceHasVendorTap(supabase, ms.vendor_id, ms.invoice_id));
      if (!tapped.get(tapKey)) { skipped++; continue; }

      const { data: inv } = await supabase
        .from('invoices')
        .select('id, client_name, client_phone')
        .eq('id', ms.invoice_id)
        .eq('vendor_id', ms.vendor_id)
        .is('deleted_at', null)
        .maybeSingle();
      if (!inv) { skipped++; continue; }

      if (!vendorNames.has(ms.vendor_id)) {
        const { data: v } = await supabase
          .from('vendors').select('business_name').eq('id', ms.vendor_id).maybeSingle();
        vendorNames.set(ms.vendor_id, (v && v.business_name) || null);
      }

      const out = await _send(supabase, {
        vendorId:   ms.vendor_id,
        milestone:  ms,
        invoice:    inv,
        vendorName: vendorNames.get(ms.vendor_id),
        source:     'nightly',
      }, deps);

      if (out.sent) sent++;
      else if (out.already) already++;
      else skipped++;
    } catch (err) {
      skipped++;
      console.error(`[reminders:sweep] milestone ${ms.id}: ${err && err.message}`);
    }
  }

  // R-29.34 member (b) — the line prints on a night when nothing happened, which
  // is the difference between a quiet cron and an absent one.
  console.log(`[reminders:sweep] scanned=${rows.length} sent=${sent} already=${already} skipped=${skipped}`);
  return { ok: true, scanned: rows.length, sent, already, skipped, reason: null };
}

module.exports = {
  sendGate,
  sendOneReminder,
  runReminderSweep,
  autoSendOn,
  setAutoSend,
  invoiceHasVendorTap,
  composeMilestonePhrase,
  formatRs,
  formatDueDate,
  istDayISO,
  TEMPLATE_KEY,
  LANE,
  KIND,
  WINDOW_DAYS,
};
