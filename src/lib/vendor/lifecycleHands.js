'use strict';
// src/lib/vendor/lifecycleHands.js — CE-44 · LC-2 · packet 4a · seam 5.
//
// ═══════════════════════════════════════════════════════════════════════════
// ONE HELPER, BOTH LANES (C-43.1)
// ═══════════════════════════════════════════════════════════════════════════
// `donna_booking` and `donna_milestone_paid` are SIGNAL hands: the engine flags
// intent and writes nothing, because the act lives on `public.leads`,
// `public.invoices` and `public.payment_schedules` and the engine client is bound
// to `db: { schema: 'engine' }`. The act runs HERE, at the door, through
// `promoteLead` and `markMilestonePaid` — the same two writers the booking sheet
// already uses, never a second copy of the booking rules.
//
// This module is the ONE home both doors call: the web thread at
// `src/api/vendor-engine/chat.js` and the vendor lane at `src/lib/vendorInbound.js`.
// A per-lane cure is exactly what C-43.1 forbids, and the reason is in the record:
// the two lanes drifted once already and the vendor read the drift on his handset.
// The shape is `buildInvoices`' and `bookEvents`' — collect the signals from the
// turn, act, and hand the door its lines.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE COUPLE IS NAMED, AND A NAME IS RESOLVED CONFIDENTLY OR NOT AT ALL
// ═══════════════════════════════════════════════════════════════════════════
// The signals name the couple, not a binder, because on most paths the booking is
// what MAKES the binder. So the name is resolved on `public.leads` — the plane the
// engine cannot read — under the discipline `bookEvents` already keeps for a
// booking's binder link: exact name, single live hit, never a guess. Two leads may
// share one name (chair, CE-44); that is an AMBIGUOUS resolve and it refuses.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE LINES ARE THE FOUNDER'S, VERBATIM
// ═══════════════════════════════════════════════════════════════════════════
// D3 and D4 from the veto record (founder's YES 2026-09-17), and F29 for a booking
// that could not be made. Not one byte is re-worded here, and nothing is minted:
// where the record holds no line for an outcome, this helper says NOTHING and logs
// (declared gap, named in the handover), because inventing vendor-facing copy is
// the one thing a packet may never do.

const { longDateYear, istDay, rupees } = require('../witnessLine');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── THE VETOED BYTES, ONE HOME ───────────────────────────────────────────────
// D3, D4 and F29 are the packet 3 veto record's. D5 to D8 were vetoed at CE-44
// (founder, 2026-09-18: "Yes to d5 and d8. I'll go with your lean") and are
// appended to that same record's appendix in the same cut, because a byte that
// lives only in chat is lost when a seat re-seats. EVERY vendor-facing string this
// module can produce is in LINES below and nowhere else: a cell reads them from
// here and never retypes them, so a frame that changes underneath a bench cannot
// leave the cell green. Nothing here is composed, softened or re-worded at a call
// site, and no branch invents a line of its own.
const LINES = {
  D3: (client, label, amount, on, nextDue) =>
    `Payment marked: ${client} · ${label} · ${rupees(amount)} · ${longDateYear(on)}. Next due ${longDateYear(nextDue)}.`,
  D4: (client) => `Payment marked: ${client} · paid in full.`,
  // D5 · no booked lead resolves from the name.
  D5: 'Could not mark the payment. No booked client by that name.',
  // D6 · which payment was not said, or was said ambiguously. `{labels}` are the
  // UNPAID milestones' own stored labels, in schedule order. THE JOINER IS " · "
  // (c-44.5, re-ruled): A5's labels carry commas of their own — "Deposit, 30% of the
  // fee, on booking" — so a comma joiner ran three of them into one sentence with no
  // seam a reader could find. The separator is D3's own, already in the founder's
  // vocabulary. His words are untouched; only what sits between them moved.
  D6: (labels) => `Could not mark the payment. Say which one: ${labels.join(' · ')}.`,
  // D7 · the named payment already stands marked. IT WRITES NOTHING, and `{date}`
  // is the STORED received date through longDateYear (R-42.13), never the date the
  // owner just said.
  D7: (client, label, on) => `Already marked: ${client} · ${label} · ${longDateYear(on)}.`,
  // D8 · the plain refusal. Everything the other three do not name lands here: an
  // invalid calendar date, more than one booked lead by that name (a candidate
  // reported to the chair, deliberately without a line of its own), an unreadable
  // schedule, no invoice, a refusal from the writer itself.
  D8: 'Could not mark the payment.',
  // F29 · the booking that could not be made.
  F29: 'Could not confirm the booking.',
};
const D3 = LINES.D3;
const D4 = LINES.D4;
const F29 = LINES.F29;

// A REAL CALENDAR DATE, not merely a date-SHAPED string (chair, CE-44). The engine
// arm checks the shape before it stages the signal; this checks that the day exists
// before `markMilestonePaid` runs, because 2026-02-30 is well-formed and is not a
// day. Parsed by parts and compared back, never through Date() alone, for the same
// reason `longDate` is parsed by string: a server's timezone must not move a
// vendor's date.
function isRealDate(iso) {
  const m = DATE_RE.exec(String(iso || '').trim());
  if (!m) return false;
  const [y, mo, d] = String(iso).trim().split('-').map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const probe = new Date(Date.UTC(y, mo - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d;
}

// The labels D6 offers: the UNPAID milestones only, in the order the schedule
// writer stamped them. A paid one in that list would be an invitation to refile it.
function unpaidLabels(rows) {
  return (rows || []).filter((m) => m.state === 'pending')
    .slice().sort((a, b) => a.ordinal - b.ordinal)
    .map((m) => String(m.milestone_label || '').trim())
    .filter(Boolean);
}

// ── collecting the signals ───────────────────────────────────────────────────
// Nested `donna_calls` are scanned beside the top-level calls, exactly as
// `buildInvoices` does: Victor's hand may arrive either way and a signal read on
// only one of the two paths is a signal that works on one lane's transcript shape.
function collect(result, name) {
  const out = [];
  for (const tc of (result && result.tool_calls) || []) {
    if (tc.name === name && tc.input) out.push(tc.input);
    for (const dc of (tc.donna_calls || [])) {
      if (dc.name === name && dc.input) out.push(dc.input);
    }
  }
  return out;
}

// `bookedOnly` is the payment lane's: a payment is marked on a BOOKED couple's
// invoice, so a lead that has not been booked is "no booked client by that name"
// (D5) and not an ordinary miss. The booking lane resolves any live lead, since
// booking is the act that makes one booked.
async function resolveLead(supabase, vendorId, name, bookedOnly = false) {
  const wanted = String(name || '').trim().toLowerCase();
  if (wanted.length < 2) return { ok: false, reason: 'no_name' };
  const { data, error } = await supabase.from('leads')
    .select('id, name, state, binder_id')
    .eq('vendor_id', vendorId).is('deleted_at', null);
  if (error) return { ok: false, reason: 'read_failed', error: error.message };
  let hits = (data || []).filter((l) => String(l.name || '').trim().toLowerCase() === wanted);
  if (bookedOnly) hits = hits.filter((l) => String(l.state || '').trim().toLowerCase() === 'booked');
  if (!hits.length) return { ok: false, reason: 'not_found' };
  // F-44.x candidate, chair-reported: more than one booked lead sharing one name has
  // no line of its own and takes the plain refusal. It is NOT collapsed into 'not_found',
  // so the branch that fires is visible in the log and in the bench.
  if (hits.length > 1) return { ok: false, reason: 'ambiguous' };
  return { ok: true, lead: hits[0] };
}

// ── which payment the owner meant ────────────────────────────────────────────
// The owner says "the middle payment"; the stored `milestone_label` says "30% one
// month before the first function (optional)". Neither contains the other, so the
// owner's words are read for the three KINDS `packageScheduleLabel` builds from
// (deposit / middle / remainder) and only then fall back to matching the stored
// label itself. 0 or more than 1 candidate refuses — it never marks "probably that
// one", because the wrong milestone marked is money filed against the wrong date.
function pickMilestone(rows, words) {
  const all = (rows || []).slice().sort((a, b) => a.ordinal - b.ordinal);
  const pending = all.filter((m) => m.state === 'pending');
  const w = String(words || '').toLowerCase();
  const has = (...t) => t.some((x) => w.includes(x));

  // Which row the owner's words point at, PAID OR NOT — resolving against every row
  // rather than only the pending ones is what lets an already-marked payment reach
  // D7 instead of being reported as an unmatched one.
  let row = null;
  if (has('next')) row = pending[0] || null;
  else if (has('deposit', 'advance', 'booking amount')) row = all.find((m) => m.ordinal === 1) || null;
  else if (has('remainder', 'final', 'balance', 'last')) row = all[all.length - 1] || null;
  else if (has('middle', 'second')) row = all.find((m) => m.ordinal === 2) || null;
  else {
    const byLabel = all.filter((m) => w && String(m.milestone_label || '').toLowerCase().includes(w));
    if (byLabel.length === 1) row = byLabel[0];
  }

  if (row && row.state === 'paid') return { ok: false, reason: 'already_paid', row };
  if (row && row.state === 'pending') return { ok: true, row };
  if (row) return { ok: false, reason: 'unavailable', row };   // waived, and there is no byte for it
  if (!pending.length) return { ok: false, reason: 'nothing_pending' };
  return { ok: false, reason: 'unmatched' };
}

async function readSchedule(supabase, vendorId, invoiceId) {
  return supabase.from('payment_schedules')
    .select('id, ordinal, milestone_label, amount_due, due_date, state, paid_at')
    .eq('invoice_id', invoiceId).eq('vendor_id', vendorId);
}

async function invoiceOfLead(supabase, vendorId, leadId) {
  const { data, error } = await supabase.from('invoices')
    .select('id, invoice_number, amount_total, amount_paid, state, lead_package_id')
    .eq('lead_id', leadId).eq('vendor_id', vendorId).is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) return { ok: false, error: error.message };
  const live = (data || []).filter((i) => i.state !== 'cancelled');
  if (live.length !== 1) return { ok: false, reason: live.length ? 'ambiguous' : 'no_invoice' };
  return { ok: true, invoice: live[0] };
}

// The D3/D4 line for a milestone that has just been marked. `after` is the schedule
// AS IT NOW STANDS, re-read from the table rather than computed from the before-state,
// so "Next due" is the row's own truth and not this helper's arithmetic.
function paidLine(client, row, receivedOn, after) {
  const next = (after || []).filter((m) => m.state === 'pending' && m.id !== row.id)
    .slice().sort((a, b) => a.ordinal - b.ordinal)[0];
  if (!next || !next.due_date) return D4(client);
  return D3(client, row.milestone_label, row.amount_due, receivedOn, next.due_date);
}

/**
 * runLifecycleSignals(supabase, { vendor, agentId, result, deps })
 *   -> { lines: string[] }
 *
 * `lines` are the door's, in the order the signals arrived, ready to be appended to
 * the reply on either lane. An empty array means the turn carried no lifecycle
 * signal, or carried one that could not be acted on and has no vetoed line to say so.
 * NEVER THROWS: a lifecycle failure must not take the vendor's reply down with it.
 */
async function runLifecycleSignals(supabase, { vendor, agentId, result, deps = {} }) {
  const lines = [];
  // ── F-44.8 (chair, CE-44) · ONE TURN, ONE MILESTONE, ONE LINE ──────────────
  // Victor called donna_booking and donna_milestone_paid in the same turn on
  // 18 September. The booking marked the deposit and spoke D3; the payment signal
  // then arrived for that same deposit, found it paid, and spoke D7. The vendor was
  // told a payment was marked and, one line later, that it was already marked,
  // about one rupee figure. Both branches were correct and the pair was not.
  // So: booking signals run FIRST whatever order they arrived in, every milestone
  // they mark is remembered here, and a payment signal naming one of them is
  // ABSORBED — logged, no line, no write. D7 is kept for what the vendor did not
  // already know. A payment for a DIFFERENT milestone in that turn runs as normal.
  const markedThisTurn = new Set();
  const promote = deps.promoteLead || ((...a) => require('./promotion').promoteLead(...a));
  const markPaid = deps.markMilestonePaid || ((...a) => require('./schedules').markMilestonePaid(...a));
  if (!vendor || !vendor.id || !agentId) return { lines };

  // ── donna_booking ──────────────────────────────────────────────────────────
  for (const input of collect(result, 'donna_booking')) {
    try {
      const kind = String(input.kind || '').trim();
      const on = String(input.advance_received_on || '').trim();
      if (kind !== 'booking_confirmed' && kind !== 'advance_paid') { lines.push(LINES.F29); continue; }
      // The same real-calendar-date test the payment lane runs, reaching this lane's
      // own vetoed byte: an advance dated 2026-02-30 is F29, not a booking.
      if (kind === 'advance_paid' && !isRealDate(on)) { lines.push(LINES.F29); continue; }
      const found = await resolveLead(supabase, vendor.id, input.lead);
      if (!found.ok) {
        console.warn(`[lifecycle:booking] vendor=${vendor.id} lead="${input.lead}" ${found.reason}`);
        lines.push(LINES.F29); continue;
      }
      const res = await promote(supabase, {
        vendor, agentId, leadId: found.lead.id, kind,
        advanceReceivedOn: kind === 'advance_paid' ? on : undefined,
      });
      if (!res || res.status !== 200 || !res.body || !res.body.ok) {
        console.warn(`[lifecycle:booking] vendor=${vendor.id} lead=${found.lead.id} refused: ${JSON.stringify(res && res.body)}`);
        lines.push(LINES.F29); continue;
      }
      // D1 ("Booked: {client}. Client, event and invoice {number} are ready.") is
      // 4b's byte by the chair's split, so 4a says nothing for the booking itself.
      // The DEPOSIT, when it arrived with the booking, is a payment and gets D3.
      if (kind === 'advance_paid') {
        const invoiceId = res.body.promoted && res.body.promoted.invoice_id;
        const { data: after } = await readSchedule(supabase, vendor.id, invoiceId);
        const deposit = (after || []).slice().sort((a, b) => a.ordinal - b.ordinal)
          .find((m) => m.state === 'paid');
        if (deposit) {
          markedThisTurn.add(deposit.id); // F-44.8
          lines.push(paidLine(String(found.lead.name || '').trim(), deposit, on, after));
        }
      }
    } catch (e) {
      console.error('[lifecycle:booking]', e && e.message);
      lines.push(LINES.F29);
    }
  }

  // ── donna_milestone_paid ───────────────────────────────────────────────────
  // FOUR REFUSAL BRANCHES, EACH REACHING ITS OWN VETOED BYTE (chair, CE-44). No
  // branch is silent any more and none composes a line: every string below is read
  // from LINES above. D7 is the one refusal that is not a failure — it says the
  // payment already stands, and it writes nothing.
  for (const input of collect(result, 'donna_milestone_paid')) {
    try {
      const on = String(input.received_on || '').trim();
      // An invalid calendar date takes the plain refusal (chair, CE-44). The engine
      // arm checked the shape; this checks the day exists, before the writer runs.
      if (!isRealDate(on)) {
        console.warn(`[lifecycle:paid] vendor=${vendor.id} received_on="${on}" not a real date`);
        lines.push(LINES.D8); continue;
      }
      const found = await resolveLead(supabase, vendor.id, input.lead, true);
      if (!found.ok) {
        console.warn(`[lifecycle:paid] vendor=${vendor.id} lead="${input.lead}" ${found.reason}`);
        // D5 is "no booked client by that name". More than one by that name is not
        // that sentence — it is a name that resolves too well — so it takes D8 and is
        // reported to the chair as a candidate rather than given a byte of its own.
        lines.push(found.reason === 'not_found' ? LINES.D5 : LINES.D8); continue;
      }
      const client = String(found.lead.name || '').trim();
      const inv = await invoiceOfLead(supabase, vendor.id, found.lead.id);
      if (!inv.ok) {
        console.warn(`[lifecycle:paid] lead=${found.lead.id} ${inv.reason || inv.error}`);
        lines.push(LINES.D8); continue;
      }
      const { data: before, error: sErr } = await readSchedule(supabase, vendor.id, inv.invoice.id);
      if (sErr) {
        console.warn(`[lifecycle:paid] schedule ${sErr.message}`);
        lines.push(LINES.D8); continue;
      }
      const pick = pickMilestone(before, input.milestone);
      if (!pick.ok) {
        console.warn(`[lifecycle:paid] invoice=${inv.invoice.id} milestone="${input.milestone}" ${pick.reason}`);
        // F-44.8: this turn's own booking marked it moments ago and already said so.
        if (pick.reason === 'already_paid' && markedThisTurn.has(pick.row.id)) {
          console.warn(`[lifecycle:paid] milestone=${pick.row.id} was marked by this turn's booking; D7 absorbed`);
          continue;
        }
        if (pick.reason === 'already_paid') {
          // D7's date is the STORED one, read back off the row, never the date the
          // owner has just said — that is the whole point of telling him it already
          // stands. e-44.5: `paid_at` is midnight IST, which Postgres stores and
          // returns in UTC, so slicing its first ten characters printed the day
          // BEFORE on every payment. `istDay` is the one home for that conversion
          // and it fails loudly: no readable day, no D7. A refusal that names the
          // wrong day is worse than the plain one (chair, CE-44).
          const day = istDay(pick.row.paid_at);
          if (!day) {
            console.warn(`[lifecycle:paid] milestone=${pick.row.id} unreadable paid_at; D7 withheld`);
            lines.push(LINES.D8);
            continue;
          }
          lines.push(LINES.D7(client, String(pick.row.milestone_label || '').trim(), day));
          continue;
        }
        const labels = unpaidLabels(before);
        // D6 asks WHICH ONE, so it is only sayable when there is more than nothing to
        // choose between. With no unpaid milestone left and none named, D8 (chair).
        lines.push(labels.length ? LINES.D6(labels) : LINES.D8);
        continue;
      }
      const marked = await markPaid(supabase, vendor.id, pick.row.id, pick.row.amount_due, on, { agentId });
      if (!marked || !marked.ok) {
        console.warn(`[lifecycle:paid] refused: ${marked && marked.error}`);
        // The writer's own ALREADY_PAID, if it lands between the read and the write.
        if (marked && marked.code === 'ALREADY_PAID') {
          lines.push(LINES.D7(client, String(pick.row.milestone_label || '').trim(), on));
        } else {
          lines.push(LINES.D8);
        }
        continue;
      }
      const { data: after } = await readSchedule(supabase, vendor.id, inv.invoice.id);
      lines.push(paidLine(client, pick.row, on, after));
    } catch (e) {
      console.error('[lifecycle:paid]', e && e.message);
      lines.push(LINES.D8);
    }
  }

  return { lines };
}

module.exports = {
  runLifecycleSignals,
  // exported for b84: the bytes are read from here and never retyped in a cell
  LINES, D3, D4, F29, isRealDate, unpaidLabels,
  collect, resolveLead, pickMilestone, paidLine,
};
