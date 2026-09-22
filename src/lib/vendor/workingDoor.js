'use strict';
// src/lib/vendor/workingDoor.js  THE WORKING-ROOM DOOR. CE-44 LC-Victor P5. ONE MODULE, BOTH LANES
// (C-43.1): src/api/vendor-engine/chat.js (both routes) and src/lib/vendorInbound.js call preTurn()
// and nothing else of it.
//
// R-44.21 (a), FORK (b): Victor steps out ONE JOB AT A TIME. At P5 the door covers four acts:
// booking_confirmed, advance_paid, milestone_paid and invoice. The door speaks ALONE only when EVERY
// act in her message is covered and names a client, and every one resolves to a line the founder
// owns. Anything else goes to today's chain UNCHANGED: an uncovered act beside a covered one, a
// covered act naming no client, no act at all, a listener error or timeout, a bare yes or no with no
// live staged row, an invoice whose client resolves to no binder (F-44.57), a same-name case the
// founder's byte 8 cannot say. The leftover line does NOT go live here (the chair's amendment).
//
// ORDER, AS RULED: the pending check runs BEFORE the listener. A live staged row answers her whole-
// message yes or no; anything else expires it and her message is handled fresh. Then the listener is
// heard BEFORE the reply, bounded at HEAR_BEFORE_REPLY_MS (4 s, the chair's number; the after-the-
// wire recording keeps listenerDoor's own 15 s). On a chain turn the request heard here is what
// meta.listener records: the chain's recordListening is handed it and makes NO second model call.
//
// MONEY IS CONFIRMED BEFORE IT MOVES (read-first item 6): a booking, an advance or a payment is
// STAGED (pendingMoneyActs.js, 0169) and asked (B1, B2); it runs only on her yes, through
// lifecycleHands' ONE helper, so the booking rules keep their one copy. One money act per message;
// a second is not staged and B12 says so. Every figure the door speaks comes from a ROW (the package
// total, the milestone's amount_due, the invoice); a figure the listener returned is never written
// and never spoken (B item 2).
//
// NO ACT HERE REACHES donna_client, donna_stage, donna_money OR donna_money_edit (item 1, option (i)):
// the only hands the door runs are promoteLead and markMilestonePaid (through runLifecycleSignals)
// and generateInvoiceForBinder. b90 pins the table's image.
//
// TOTAL: preTurn() never throws. Anything unexpected is { door: false }: the chain answers her,
// byte-identical to the estate before P5.
//
// P6a-1 (CE-44 LCV-7, the lead half; design accepted at the LCV-6 seat close §5, the chair's rulings of
// 21 September): the door learns `lead`. It calls createLead (leads.js) AS IT STANDS; no new writer, and
// the recorded tool call keeps the name donna_lead (the P6a read-first §1.2, ruled). Source by lane: 'self'
// on the pwa, 'whatsapp' on WhatsApp. wedding_date_precision 'day' is passed ONLY beside a resolved date
// (leads.js :335 to :339). A lead act with no name asks B18; what else she said rides the thread the
// listener already reads (listenerDoor.js threadText, meta.listener.request). ORDER: leads, then invoices,
// then the ONE money act; every act is resolved read-only before the first write.
// THE PHONE GUARD (F-44.96, the chair's ruling): the listener hears no phone, so a lead message carrying a
// phone-shaped number is NOT the door's; the WHOLE message goes to the chain, which files the number as
// today. Owed before the chain leaves: EAR_TOOL gains phone_as_spoken and this guard goes in that cut.
//
// P6a-2 (CE-44 LCV-8, the chair's rulings of 21 September): the door learns `attach_package`. It LANDS AT ONCE
// (R-44.33): no staging, no question, pending_money_acts untouched. It calls attachPackage (leadPackages.js) AS IT
// STANDS with EXACTLY { package_id } or, for a handover package, { package_id, delivery_on }. The package is
// resolved HERE by the door's own key() fold from the name the listener heard (package_as_spoken, c-44.44): one
// attaches, two is B24, none is B23 with HER OWN names; never fuzzy, never nearest. Every name, total and date she
// reads comes from the lead_package ROW attachPackage returned, and that row decides B22 against B27.
// ORDER: leads, then attaches, then invoices, then the ONE money act. Every act is PROBED read-only before the
// first write (an act the door cannot say sends the WHOLE message to the chain); the attach and money plans are
// then REBUILT after the writes before them, reading the rows as they then stand, and only the rebuilt plan is
// spoken or staged. An attach that did not land means NO money question and NO staged row.
// F-44.100 rides this cut: a lead "name" made only of event words is no name (B18), except as the answer to B18.
//
// LCV-9 PART ONE (R-44.37, the founder, 21 September 2026: "why dont we shift victor out and then allow the code to
// work"; R-44.38; the chair's ruling on the fourteen exits): THE CHAIN LEAVES THE WORKING ROOMS. preTurn() is
// UNCHANGED in what it decides: it still answers { door: false, why } where the door does not take the turn. What
// changed is what the lanes do with that verdict: they hand it to standIn(), which reads ONE switch
// (admin_config `vendor.working_chain_enabled` through laneFlags.readLaneFlag, 60 s cache; ONLY JSON true is chain
// in; absent, junk or a FAILED READ is CHAIN OUT) and, chain out, SPEAKS FOR THE DOOR so the chain is never called:
// no act heard is LEFTOVER with two covered examples; an act the door does not cover is B34; a glitch is the
// founder's vetoed glitch line; and the exits that know more say more (B32, B15, B30, F29 or D8). Chain in, standIn
// returns null and the four sites behave as at 10d5d99. NOTHING IS WRITTEN on a stand-in turn.
//
// LCV-10 PART A (F-44.110; the chair's ruling of 21 September on the cure's two halves): WITNESSED on Part One's walk,
// turn 8: "Add a new lead Walk P8 Fresh, wedding on 20 February 2027" was heard as `lead` AND `book_event`, both for
// Walk P8 Fresh on 20 February 2027; book_event is not covered, the message read MIXED, B34 was spoken and THE LEAD WAS
// NOT FILED. With the chain gone an act the listener over-hears refuses a job the door can do. withoutEchoedEvents()
// below is the mechanism (the listener's prompt sentence is the other half, and prose is not a mechanism): a
// `book_event` whose client AND date both repeat a `lead` act in the same request is not a second job and is dropped
// before the covered check. NOTHING ELSE IS DROPPED. meta.listener.request keeps what was HEARD, both acts.
//
// LCV-10 PART B-1 (F-44.104, F-44.112; the chair's rulings of 21 September): THE DOOR KEEPS ITS OWN NOTE OF A DATE IT ASKED FOR.
// WITNESSED twice on his own screen: "5 June 2027" answered to B26 was heard as NO ACT (P6a-2's walk, turns 10 and 21), and
// "5 march" answered to B7's "Say it like 5 December" was heard as NO ACT and met LEFTOVER (Part A's walk, turn 5). The carry
// those answers rested on was the MODEL's. FIVE lines ask her for a date: B6, B7, B21, B26 and B28. When a turn ends in exactly
// ONE of them, the door saves the act that is waiting for the date on ITS OWN assistant row, meta.listener.note, beside the
// marks that are already there (asked, asked_name: untouched). On the next turn, if that row is the last assistant row of the
// working thread, the door reads HER WHOLE MESSAGE ITSELF as the date and runs the saved act through the SAME plans as any
// turn. A closed NO word answers B3. A message the door cannot read as a date is handled FRESH when the listener heard that she
// has MOVED ON (F-44.115: another act, the noted act for another client, or the noted act with a date of its own, which is a
// restated job; the ONE place the listener's record decides such a turn); otherwise it is answered as any unreadable date is,
// ONCE, and the next such answer is B3. THE NOTE NEVER WRITES MONEY: a money act it carries is planned afresh from
// the rows as they stand and STAGED exactly as today; only her YES applies it. A live staged row wins over any note.

const DL = require('./doorLines');
const PMA = require('./pendingMoneyActs');
const { resolveSpokenDate, todayIstIso } = require('./spokenDate');
const { longDateYear, istDay, rupees } = require('../witnessLine');
const { isDateKey } = require('./packageSchedule');

const HEAR_BEFORE_REPLY_MS = 4000;
const MONEY_ACTS = Object.freeze(['booking_confirmed', 'advance_paid', 'milestone_paid']);
const COVERED = Object.freeze([...MONEY_ACTS, 'invoice', 'lead', 'attach_package']);
// THE ACT TABLE'S IMAGE: every hand the door can run, and nothing else. b90 pins that it never holds
// donna_client, donna_stage, donna_money or donna_money_edit (item 1, option (i)).
const HANDS = Object.freeze({
  booking_confirmed: 'donna_booking',
  advance_paid: 'donna_booking',
  milestone_paid: 'donna_milestone_paid',
  invoice: 'donna_invoice_pdf',
  lead: 'donna_lead',
  attach_package: 'attach_package',
});

// `say` is what an exit KNOWS beyond its reason (the name that is no lead, the name that is no client, the money act);
// the chain never reads it; standIn() does.
const CHAIN = (ear, why, say) => ({ door: false, ear: ear || null, why, ...(say ? { say } : {}) });
const CHAIN_FLAG = 'vendor.working_chain_enabled';
const key = (s) => String(s == null ? '' : s).trim().toLowerCase();
const digits = (n) => { const r = rupees(n); return r ? r.replace(/^Rs /, '') : null; };

function lazy(deps) {
  return {
    createLead: deps.createLead || ((...a) => require('./leads').createLead(...a)),
    attachPackage: deps.attachPackage || ((...a) => require('../../api/vendor/leadPackages').attachPackage(...a)),
    lifecycle: deps.lifecycle || require('./lifecycleHands'),
    listener: deps.listener || require('./listenerDoor'),
    generateInvoiceForBinder: deps.generateInvoiceForBinder || ((...a) => require('../../api/vendor/invoices').generateInvoiceForBinder(...a)),
    memory: deps.memory || null,
    meter: deps.meter || null,
  };
}

// ── the covered-act check (the pin, R-44.21 (a)) ──────────────────────────────────────────────────
function allCovered(request) {
  try {
    if (!request || typeof request !== 'object' || !Array.isArray(request.acts) || !request.acts.length) return false;
    // P6a-1, THE LEAD EXCEPTION, a branch ABOVE the untouched return: a `lead` act may name no one (the door
    // asks B18); every other act beside it still needs its client, exactly as the return below demands.
    if (request.acts.some((a) => a && a.act === 'lead')) {
      return request.acts.every((a) => a && COVERED.includes(a.act) && (a.act === 'lead' || (typeof a.client_as_spoken === 'string' && !!a.client_as_spoken.trim())));
    }
    return request.acts.every((a) => a && COVERED.includes(a.act) && typeof a.client_as_spoken === 'string' && a.client_as_spoken.trim());
  } catch (_e) { return false; }
}

// ── THE PHONE GUARD (F-44.96) ─────────────────────────────────────────────────────────────────────
// Phone-shaped: ten digits beginning 6 to 9, optionally after +91, 91 or 0, written whole or in the usual
// groups (5 5, 3 3 4, 4 3 3) with one space or hyphen between groups. Not preceded or followed by a letter,
// digit or '/', so an invoice number (TDW/DEV440/24), a date (2026-09-21, 21/09/2026), a year or an amount
// in Indian grouping (Rs 1,20,000) does not trip it. TOTAL: anything that is not a string is false.
const PHONE_RE = /(?<![A-Za-z0-9/+])(?:\+91[\s-]?|91[\s-]?|0)?(?:[6-9]\d{9}|[6-9]\d{4}[\s-]\d{5}|[6-9]\d{2}[\s-]\d{3}[\s-]\d{4}|[6-9]\d{3}[\s-]\d{3}[\s-]\d{3})(?![A-Za-z0-9/])/;
function phoneShaped(text) {
  try { return typeof text === 'string' && PHONE_RE.test(text); } catch (_e) { return false; }
}

// ── F-44.110 · THE ECHOED EVENT (LCV-10 Part A) ───────────────────────────────────────────────────
// A wedding date said with a new lead BELONGS TO THE LEAD. The live listener heard it a second time as `book_event`
// (TDW_CE44_LCV9_PART1_WALK_RECORD.md §3 turn 8). A book_event is dropped ONLY when ALL of these hold: a `lead` act
// sits in the same request; both acts name a client and the names are equal under key(); both carry a date, and the
// dates either BOTH resolve ('future') to the same day or, NEITHER resolving, are the same string once folded. A
// dateless book_event, another client, another date, one date readable and the other not, or no lead beside it is a
// genuine second job and stays: the message is then uncovered and speaks B34 as before.
// It returns the SAME object when nothing is dropped, and never mutates what was heard: the door records st.ear
// untouched. TOTAL: anything hostile or thrown returns the request as it came.
const foldSpoken = (s) => key(s).replace(/\s+/g, ' ');
const spokenText = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
function sameSpokenDay(a, b, nowMs) {
  try {
    const da = resolveSpokenDate(a, { direction: 'future', nowMs });
    const db = resolveSpokenDate(b, { direction: 'future', nowMs });
    if (da.ok && db.ok) return typeof da.iso === 'string' && da.iso === db.iso;
    if (!da.ok && !db.ok) return foldSpoken(a) === foldSpoken(b);
    return false;
  } catch (_e) { return false; }
}
function withoutEchoedEvents(request, nowMs) {
  try {
    if (!request || typeof request !== 'object' || !Array.isArray(request.acts)) return request;
    const leads = request.acts.filter((a) => a && typeof a === 'object' && a.act === 'lead' && spokenText(a.client_as_spoken) && spokenText(a.date_as_spoken));
    if (!leads.length) return request;
    const echoed = (a) => !!a && typeof a === 'object' && a.act === 'book_event' && !!spokenText(a.client_as_spoken) && !!spokenText(a.date_as_spoken)
      && leads.some((l) => key(l.client_as_spoken) === key(a.client_as_spoken) && sameSpokenDay(l.date_as_spoken, a.date_as_spoken, nowMs));
    const acts = request.acts.filter((a) => !echoed(a));
    return acts.length === request.acts.length ? request : { ...request, acts };
  } catch (_e) { return request; }
}

// ── F-44.112 · THE DOOR'S OWN NOTE OF A DATE IT ASKED FOR (LCV-10 Part B-1) ─────────────────────────
const DATE_ASKS = Object.freeze(['B6', 'B7', 'B21', 'B26', 'B28']);
// LCV-10 PART B-2 (first cut; R-44.39, the chair's rulings of 21 and 22 September): THE DOOR KEEPS ITS OWN NOTE OF A NAME IT ASKED FOR TOO.
// B18 (a lead with no name) and B35 (a booking, payment, invoice or attach with no client). Her WHOLE TRIMMED MESSAGE IS THE NAME,
// event words and all, whatever the listener made of it (F-44.105's live failures: "Walk P7 Haldi" heard as "Walk P7"). The note lapses
// ONLY when the listener heard an act of a kind the note does not hold, or a noted kind RESTATED with a new date (F-44.115 applied to
// names; a date equal to her whole message, or to the date the note already carries, is not new: F-44.116). A nameless note holds no
// client, so "a different client" cannot fire on it. A closed YES word is an answer the door cannot read: the question is asked ONCE more,
// then B3. Where a message holds a nameless lead AND a nameless money act, B18 is asked FIRST and B35 after it, the note carrying the
// rest, one question at a time. B35's answer fills EVERY nameless act but `lead`. THE NOTE NEVER WRITES MONEY here either.
const NAME_ASKS = Object.freeze(['B18', 'B35']);
// LCV-10 PART B-2 (second cut): THE DOOR KEEPS ITS OWN NOTE OF A PACKAGE IT ASKED FOR TOO, B24 and B31. Her answer is a package by the
// door's own key() fold FIRST, whatever the listener heard; a heard act whose package_as_spoken is her whole message is her answer heard
// twice (F-44.116's class); a different kind, or the attach RESTATED with another package, lapses; otherwise B31 once more, then B3.
const PKG_ASKS = Object.freeze(['B24', 'B31']);
const ASKS = Object.freeze([...DATE_ASKS, ...NAME_ASKS, ...PKG_ASKS]);
const namelessOf = (acts) => (Array.isArray(acts) ? acts : []).filter((a) => a && typeof a === 'object' && a.act !== 'lead' && !spokenText(a.client_as_spoken));
const namelessLead = (acts) => (Array.isArray(acts) ? acts : []).some((a) => a && typeof a === 'object' && a.act === 'lead' && !spokenText(a.client_as_spoken));
const allKindsCovered = (acts) => Array.isArray(acts) && acts.length > 0 && acts.length <= 4 && acts.every((a) => a && typeof a === 'object' && COVERED.includes(a.act));
const NOTE_SLOTS = Object.freeze(['act', 'client_as_spoken', 'package_as_spoken', 'date_as_spoken', 'milestone']);
const directionOf = (act) => (act === 'advance_paid' || act === 'milestone_paid' ? 'past' : 'future');
// One act as the note keeps it: the slots the door reads, strings only, nothing else. null when it is no covered act.
function noteAct(a) {
  try {
    if (!a || typeof a !== 'object' || typeof a.act !== 'string' || !COVERED.includes(a.act)) return null;
    const out = {};
    for (const k of NOTE_SLOTS) if (typeof a[k] === 'string' && a[k].trim()) out[k] = a[k].trim();
    return out;
  } catch (_e) { return null; }
}
// A note as read back from meta: well-formed or NOTHING. acts[0] is the act waiting for its date; the rest are acts of the
// same message that did not run because of it. Every act must pass the covered check as any heard request must.
function validNote(n) {
  try {
    if (!n || typeof n !== 'object' || !ASKS.includes(n.asked) || !Array.isArray(n.acts) || !n.acts.length || n.acts.length > 4) return null;
    const acts = n.acts.map(noteAct);
    if (acts.some((a) => !a)) return null;
    // a NAME note is a covered request with the one thing missing that was asked for; a DATE note passes the covered check as any request must
    if (NAME_ASKS.includes(n.asked)) { if (!allKindsCovered(acts) || !(n.asked === 'B18' ? namelessLead(acts) : namelessOf(acts).length)) return null; }
    else if (PKG_ASKS.includes(n.asked)) { if (!allKindsCovered(acts) || acts[0].act !== 'attach_package' || !spokenText(acts[0].client_as_spoken)) return null; }
    else if (!allCovered({ route: 'task', acts })) return null;
    const tries = Number.isInteger(n.tries) && n.tries >= 0 ? n.tries : 0;
    return { asked: n.asked, acts, tries, direction: directionOf(acts[0].act), lead_id: typeof n.lead_id === 'string' ? n.lead_id : null, package_id: typeof n.package_id === 'string' ? n.package_id : null };
  } catch (_e) { return null; }
}

// ── reads ─────────────────────────────────────────────────────────────────────────────────────────
async function leadsNamed(supabase, vendorId, name, bookedOnly) {
  const { data, error } = await supabase.from('leads').select('id, name, state, wedding_date, binder_id')
    .eq('vendor_id', vendorId).is('deleted_at', null);
  if (error || !Array.isArray(data)) return null;
  let hits = data.filter((l) => key(l.name) === key(name));
  if (bookedOnly) hits = hits.filter((l) => key(l.state) === 'booked');
  return hits;
}
function sameName(name, rows, dateOf) {
  if (!Array.isArray(rows) || rows.length !== 2) return null;
  const cands = rows.map((r) => ({ name: String(r.name || r.client || '').trim(), date: dateOf(r) ? longDateYear(dateOf(r)) : null }));
  return DL.twoClients(String(name).trim(), cands);
}

// ── resolution: each act to a PLAN, read-only. A plan is { speak } | { stage } | { invoice } | null
//    (null = the door cannot say this, so the WHOLE message goes to the chain). ──────────────────
async function planMoney(supabase, vendor, act, L) {
  const name = act.client_as_spoken.trim();
  if (act.act === 'milestone_paid') {
    const d = resolveSpokenDate(act.date_as_spoken || null, { direction: 'past' });
    if (!d.ok) return { speak: d.reason === 'none' ? DL.LINES.B6 : DL.LINES.B7, key: d.reason === 'none' ? 'B6' : 'B7' };
    const found = await L.lifecycle.resolveLead(supabase, vendor.id, name, true);
    if (!found.ok) {
      if (found.reason === 'not_found') return { speak: L.lifecycle.LINES.D5, key: 'D5' };
      if (found.reason === 'ambiguous') {
        const rows = await leadsNamed(supabase, vendor.id, name, true);
        const line = sameName(name, rows, (r) => r.wedding_date);
        return line ? { speak: line, key: 'B8', skipHarvest: true } : null;
      }
      return { speak: L.lifecycle.LINES.D8, key: 'D8' };
    }
    return planPayment(supabase, vendor, found.lead, act.milestone || '', d.iso, L);
  }
  return planBooking(supabase, vendor, act, L);
}

// A payment on a booked lead, resolved to its milestone row, asked in B1 or answered D6, D7 or D8. Shared by
// milestone_paid and, since F-44.61, by advance_paid on a lead that is ALREADY booked (the deposit).
async function planPayment(supabase, vendor, lead, words, receivedIso, L) {
  {
    const found = { lead };
    const d = { iso: receivedIso };
    const act = { milestone: words };
    const client = String(found.lead.name || '').trim();
    const inv = await L.lifecycle.invoiceOfLead(supabase, vendor.id, found.lead.id);
    if (!inv.ok) return { speak: L.lifecycle.LINES.D8, key: 'D8' };
    const { data: before, error } = await L.lifecycle.readSchedule(supabase, vendor.id, inv.invoice.id);
    if (error) return { speak: L.lifecycle.LINES.D8, key: 'D8' };
    const pick = L.lifecycle.pickMilestone(before, act.milestone || '');
    if (!pick.ok) {
      if (pick.reason === 'already_paid') {
        const day = istDay(pick.row.paid_at);
        return day ? { speak: L.lifecycle.LINES.D7(client, String(pick.row.milestone_label || '').trim(), day), key: 'D7' } : { speak: L.lifecycle.LINES.D8, key: 'D8' };
      }
      const labels = L.lifecycle.unpaidLabels(before);
      return (pick.reason === 'unmatched' && labels.length) ? { speak: L.lifecycle.LINES.D6(labels), key: 'D6' } : { speak: L.lifecycle.LINES.D8, key: 'D8' };
    }
    const label = String(pick.row.milestone_label || '').trim();
    const line = DL.render('B1', { client, 'which payment': label, amount: digits(pick.row.amount_due), date: longDateYear(d.iso) });
    if (!line) return null;
    return { stage: { act: 'milestone_paid', request: { lead_id: found.lead.id, lead_name: client, milestone: act.milestone || label, milestone_id: pick.row.id, received_on: d.iso } }, speak: line, key: 'B1' };
  }
}

async function planBooking(supabase, vendor, act, L) {
  const name = act.client_as_spoken.trim();
  // booking_confirmed · advance_paid
  let received;
  if (act.act === 'advance_paid') {
    const d = resolveSpokenDate(act.date_as_spoken || null, { direction: 'past' });
    if (!d.ok) return { speak: d.reason === 'none' ? DL.LINES.B6 : DL.LINES.B7, key: d.reason === 'none' ? 'B6' : 'B7' };
    received = d.iso;
  }
  const found = await L.lifecycle.resolveLead(supabase, vendor.id, name, false);
  if (!found.ok) {
    if (found.reason === 'not_found') { const line = DL.render('B4', { name }); return line ? { speak: line, key: 'B4' } : null; }
    if (found.reason === 'ambiguous') {
      const rows = await leadsNamed(supabase, vendor.id, name, false);
      const line = sameName(name, rows, (r) => r.wedding_date);
      return line ? { speak: line, key: 'B8', skipHarvest: true } : null;
    }
    return { speak: L.lifecycle.LINES.F29, key: 'F29' };
  }
  // F-44.61 (ruled): an advance on a lead that is ALREADY booked is not a booking. It is the DEPOSIT, resolved and
  // asked in B1 with the row's own label, amount and her received date; a deposit already paid is D7, no question.
  if (act.act === 'advance_paid' && key(found.lead.state) === 'booked') return planPayment(supabase, vendor, found.lead, 'deposit', received, L);
  const client = String(found.lead.name || '').trim();
  const { data: lp, error } = await supabase.from('lead_packages').select('id, total, schedule, snapshot')
    .eq('lead_id', found.lead.id).eq('vendor_id', vendor.id).is('deleted_at', null).maybeSingle();
  if (error) return { speak: L.lifecycle.LINES.F29, key: 'F29' };
  if (!lp) { const line = DL.render('B5', { client }); return line ? { speak: line, key: 'B5' } : null; }
  const total = Number(lp.total);
  if (!Number.isInteger(total) || total <= 0) return { speak: L.lifecycle.LINES.F29, key: 'F29' };
  const pkgName = lp.snapshot && typeof lp.snapshot.name === 'string' ? lp.snapshot.name : null;
  const line = DL.render('B2', { client, package: pkgName, total: digits(total) });
  if (!line) return null;
  return { stage: { act: act.act, request: { lead_id: found.lead.id, lead_name: client, kind: act.act, ...(received ? { advance_received_on: received } : {}) } }, speak: line, key: 'B2' };
}

async function planInvoice(supabase, vendor, agentId, act) {
  const name = act.client_as_spoken.trim();
  const { data, error } = await supabase.schema('engine').from('records')
    .select('id, client, phone, amount, amount_received, note, date, hidden')
    .eq('agent_id', agentId).eq('hidden', false);
  if (error || !Array.isArray(data)) return null;
  const hits = data.filter((b) => key(b.client) === key(name));
  if (!hits.length) return { noBinder: true, name }; // F-44.57, superseded by R-44.27: no binder is B15's, spoken by standIn(); chain in, the whole message still goes to the chain
  if (hits.length > 1) { const line = sameName(name, hits, (b) => b.date); return line ? { speak: line, key: 'B8', skipHarvest: true } : null; }
  const binder = hits[0];
  const client = String(binder.client || '').trim();
  if (!(Number(binder.amount) > 0)) { const line = DL.render('B11', { client }); return line ? { speak: line, key: 'B11' } : null; }
  const { data: invs, error: iErr } = await supabase.from('invoices').select('id, invoice_number, state, deleted_at')
    .eq('binder_id', binder.id).eq('vendor_id', vendor.id).is('deleted_at', null);
  if (iErr || !Array.isArray(invs)) return null;
  const live = invs.filter((i) => i.state !== 'cancelled' && i.invoice_number);
  if (live.length > 1) { const line = DL.invoiceNumbers(client, live.map((i) => i.invoice_number)); return line ? { speak: line, key: 'B10' } : null; }
  return { invoice: { binder, client } };
}

// ── F-44.100 · THE NET: an event is not a client ────────────────────────────────────────────────────
// WITNESSED on the founder's walk of 21 September: "Add a new lead, haldi shoot on 3 January" filed a lead NAMED
// "haldi shoot"; the listener had put the event in client_as_spoken. A name made ONLY of these words is NO NAME and
// B18 is asked. The list is CLOSED and folded to lower case; a name holding any other word ("Sangeet Sharma") is a
// name. ONE EXCEPTION SO IT CANNOT LOOP: when the last assistant row of the working thread is the door's OWN B18
// (known from meta.listener.asked_name, never by matching text), whatever she answers IS the name.
// The net is for `lead` ONLY: on every other act an event word resolves to no lead and the existing bytes refuse it.
const EVENT_WORDS = Object.freeze(['haldi', 'mehendi', 'mehndi', 'mehandi', 'sangeet', 'shoot', 'photoshoot', 'wedding', 'shaadi',
  'reception', 'engagement', 'roka', 'cocktail', 'pre', 'prewedding', 'ceremony', 'function', 'event', 'party', 'baraat', 'pheras', 'phera',
  'a', 'an', 'the', 'new', 'lead', 'and', 'for', 'of']);
function eventOnly(name) {
  try {
    if (typeof name !== 'string') return false;
    const words = name.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    return words.length > 0 && words.every((w) => EVENT_WORDS.includes(w));
  } catch (_e) { return false; }
}

// ── P6a-1 · a lead: resolved read-only to a PLAN; written only after every act has resolved ─────────
// { speak, key } for B18, B7 or B21, or { lead: { name, wedding_date|null } } to be filed.
// F-44.66: a wedding date strictly before today in IST, or in a year outside today's IST year through
// today's plus five, is B21. An unreadable one is B7. Direction 'future' (F-44.46).
// TOTAL (the chair's ruling on r2): a non-object act, or one whose reads throw, answers B20, which is truthful.
const LEAD_ISO = /^(\d{4})-\d{2}-\d{2}$/;
function planLead(act, nowMs, answeringB18) {
  try {
    if (!act || typeof act !== 'object') return { speak: DL.LINES.B20, key: 'B20' };
    const name = typeof act.client_as_spoken === 'string' ? act.client_as_spoken.trim() : '';
    // B18 skips harvest, as B8 does: the door asked WHO, so nothing she said may be patched onto another draft.
    if (!name) return { speak: DL.LINES.B18, key: 'B18', skipHarvest: true };
    if (answeringB18 !== true && eventOnly(name)) return { speak: DL.LINES.B18, key: 'B18', skipHarvest: true }; // F-44.100
    if (typeof act.date_as_spoken !== 'string' || !act.date_as_spoken.trim()) return { lead: { name, wedding_date: null } };
    const d = resolveSpokenDate(act.date_as_spoken, { direction: 'future', nowMs });
    // F-44.98: a date read with an absurd year ("15 March 0227", his own walk of 20 September) is B21, not B7.
    if (!d.ok) return d.reason === 'year' ? { speak: DL.LINES.B21, key: 'B21' } : { speak: DL.LINES.B7, key: 'B7' };
    // The year is parsed STRICTLY; a date that does not match is B21, never passable (a NaN compares false).
    const m = LEAD_ISO.exec(typeof d.iso === 'string' ? d.iso : '');
    const t = LEAD_ISO.exec(todayIstIso(nowMs));
    if (!m || !t) return { speak: DL.LINES.B21, key: 'B21' };
    const y = Number(m[1]); const y0 = Number(t[1]);
    if (d.iso < t[0] || y < y0 || y > y0 + 5) return { speak: DL.LINES.B21, key: 'B21' };
    return { lead: { name, wedding_date: d.iso } };
  } catch (_e) { return { speak: DL.LINES.B20, key: 'B20' }; }
}

// File one planned lead through createLead AS IT STANDS. Every name and date she reads comes from the
// ROW createLead returned (B19's {client} above all: the lead that holds the number, not what she said).
// TOTAL (the chair's ruling on r2): anything thrown, createLead's own throw included, answers B20 and is recorded
// refused:exception (a code handResult.js already holds for donna_lead). The door has already marked the turn as
// written before calling this, so B20 is the door's to the end either way.
async function fileLead(supabase, vendor, lane, plan, L) {
  let input = null;
  try {
    const p = plan.lead;
    input = { name: p.name, source: lane === 'pwa' ? 'self' : 'whatsapp', ...(p.wedding_date ? { wedding_date: p.wedding_date, wedding_date_precision: 'day' } : {}) };
    const out = await L.createLead(supabase, vendor.id, input);
    const row = out && out.lead && typeof out.lead === 'object' ? out.lead : null;
    const client = row && typeof row.name === 'string' && row.name.trim() ? row.name.trim() : null;
    if (!out || out.ok !== true || !row || !client) return { line: DL.LINES.B20, key: 'B20', call: { name: HANDS.lead, input, result: 'refused:write_failed' }, landed: false };
    if (out.deduped === true) {
      const line = DL.render('B19', { client });
      return { line: line || DL.LINES.B20, key: line ? 'B19' : 'B20', call: { name: HANDS.lead, input, result: 'unchanged' }, landed: false };
    }
    // B17 only when the returned row carries a date the door can say; otherwise B16. Both render from the row.
    const dated = row.wedding_date ? DL.render('B17', { client, date: longDateYear(row.wedding_date) }) : null;
    return { line: dated || DL.render('B16', { client }), key: dated ? 'B17' : 'B16', call: { name: HANDS.lead, input, result: 'lead_created' }, landed: true };
  } catch (_e) { return { line: DL.LINES.B20, key: 'B20', call: { name: HANDS.lead, input, result: 'refused:exception' }, landed: false }; }
}

// ── P6a-2 · a package attach: resolved read-only to a PLAN ────────────────────────────────────────────
// { speak, key } for B23, B24, B8, B29, B25, B26, B28 or B7; { noLead, name } when no lead carries the name (the
// caller decides: a lead this same message files is resolved after that write; otherwise the WHOLE message goes to
// the chain, B32's place while his word is pending); { attach: { leadId, client, body } } to be written; or null,
// which the door cannot say (no package named, B31's place; a failed read; three of one name; anything thrown).
// FOR A HANDOVER PACKAGE the lead's own row is read FIRST, so she is never asked for a delivery date and then
// refused: booked is B29 and no day-precision wedding date is B25, MIRRORING leadPackages.js :127 and
// packageSchedule.js :78 to :79 (b92 pins the mirror against attachPackage's own answer on the same rows).
// THE DELIVERY DATE (R-44.34 (b), F-44.92): used ONLY for a handover package; resolved 'future'; reason 'year', a
// day before today in IST, or a year outside today's IST year through plus five is B28; unreadable is B7; none
// said, or a day EQUAL to the wedding date (misheard), asks B26. A date after the wedding is PASSED, as the app's
// sheet passes it (F-44.94 is LC-3's). On any other package a spoken date is IGNORED. B21 is never spoken here.
// TOTAL: never throws.
async function packagesOf(supabase, vendorId) {
  const { data, error } = await supabase.from('vendor_packages').select('id, name, total, delivery_basis')
    .eq('vendor_id', vendorId).is('deleted_at', null);
  return (error || !Array.isArray(data)) ? null : data;
}
async function planAttach(supabase, vendor, act, nowMs, L) {
  try {
    if (!act || typeof act !== 'object') return null;
    const name = typeof act.client_as_spoken === 'string' ? act.client_as_spoken.trim() : '';
    const said = typeof act.package_as_spoken === 'string' ? act.package_as_spoken.trim() : '';
    if (!name) return null; // a nameless attach is B35's, asked before any plan (askName)
    // F-44.107: THE LEAD IS RESOLVED BEFORE THE PACKAGE, so a misspelt client meets B32 first and B23 is never reached for a lead
    // that does not exist. Then the package: none named is B31 (R-44.36), the door never guesses even when she holds exactly one;
    // no such name is B23; two of one name is B24. Both lists are HER OWN names sorted case-folded (F-44.108).
    const found = await L.lifecycle.resolveLead(supabase, vendor.id, name, false);
    if (!found || !found.ok) {
      if (found && found.reason === 'not_found') return { noLead: true, name }; // B32's place (with the founder)
      if (found && found.reason === 'ambiguous') {
        const rows = await leadsNamed(supabase, vendor.id, name, false);
        const line = sameName(name, rows, (r) => r.wedding_date);
        return line ? { speak: line, key: 'B8', skipHarvest: true } : null;
      }
      return null;
    }
    const client = String(found.lead.name || '').trim();
    const pkgs = await packagesOf(supabase, vendor.id);
    if (!pkgs) return null;
    if (!said) { const line = DL.whichPackage(pkgs.map((p) => p && p.name)); return line ? { speak: line, key: 'B31', skipHarvest: true } : null; }
    const hits = pkgs.filter((p) => p && key(p.name) === key(said));
    if (!hits.length) { const line = DL.noSuchPackage(said, pkgs.map((p) => p && p.name)); return line ? { speak: line, key: 'B23' } : null; }
    if (hits.length > 1) {
      const line = hits.length === 2 ? DL.twoPackages(said, hits.map((p) => ({ name: p.name, total: digits(p.total) }))) : null;
      return line ? { speak: line, key: 'B24', skipHarvest: true } : null;
    }
    const pkg = hits[0];
    const body = { package_id: pkg.id };
    if (pkg.delivery_basis === 'handover') {
      const { data: lead, error } = await supabase.from('leads').select('id, name, state, binder_id, wedding_date, wedding_date_precision')
        .eq('id', found.lead.id).eq('vendor_id', vendor.id).maybeSingle();
      if (error || !lead) return null;
      if (key(lead.state) === 'booked' || lead.binder_id) return { speak: DL.LINES.B29, key: 'B29' };
      const precision = lead.wedding_date_precision == null ? 'day' : lead.wedding_date_precision;
      if (!isDateKey(lead.wedding_date) || precision !== 'day') { const line = DL.render('B25', { client }); return line ? { speak: line, key: 'B25' } : null; }
      const ask = () => { const line = DL.render('B26', { client }); return line ? { speak: line, key: 'B26', skipHarvest: true } : null; };
      if (typeof act.date_as_spoken !== 'string' || !act.date_as_spoken.trim()) return ask();
      const d = resolveSpokenDate(act.date_as_spoken, { direction: 'future', nowMs });
      if (!d.ok) return d.reason === 'none' ? ask() : (d.reason === 'year' ? { speak: DL.LINES.B28, key: 'B28' } : { speak: DL.LINES.B7, key: 'B7' });
      const m = LEAD_ISO.exec(typeof d.iso === 'string' ? d.iso : '');
      const t = LEAD_ISO.exec(todayIstIso(nowMs));
      if (!m || !t) return { speak: DL.LINES.B28, key: 'B28' };
      const y = Number(m[1]); const y0 = Number(t[1]);
      if (d.iso < t[0] || y < y0 || y > y0 + 5) return { speak: DL.LINES.B28, key: 'B28' };
      if (d.iso === lead.wedding_date) return ask(); // the wedding date heard as the delivery date: misheard, ask
      body.delivery_on = d.iso;
    }
    return { attach: { leadId: found.lead.id, client, body } };
  } catch (_e) { return null; }
}

// Attach one planned package through attachPackage AS IT STANDS. THE READ-BACK IS FROM THE ROW it returned: the
// package's name, its total and its delivery date, and the row's own basis decides B22 against B27. Its refusals
// speak his bytes: already_booked B29, no_wedding_date B25, no_handover_date B26; everything else, and anything
// thrown, B30 (recorded refused:exception for a throw). TOTAL. The door has already marked the turn as written.
async function fileAttach(supabase, vendor, plan, L) {
  let input = null;
  const B30 = (result) => ({ line: DL.LINES.B30, key: 'B30', call: { name: HANDS.attach_package, input, result }, landed: false });
  try {
    const a = plan.attach;
    input = { lead: a.client, ...a.body };
    const out = await L.attachPackage(supabase, vendor, a.leadId, a.body);
    const b = out && out.body && typeof out.body === 'object' ? out.body : null;
    if (out && out.status === 200 && b && b.ok === true && b.lead_package && typeof b.lead_package === 'object') {
      const row = b.lead_package;
      const snap = row.snapshot && typeof row.snapshot === 'object' ? row.snapshot : {};
      const vals = { client: a.client, package: snap.name, total: digits(row.total) };
      const dated = snap.delivery_basis === 'handover' && row.delivery_on ? DL.render('B27', { ...vals, date: longDateYear(row.delivery_on) }) : null;
      const line = dated || DL.render('B22', vals);
      return { line, key: line ? (dated ? 'B27' : 'B22') : null, call: { name: HANDS.attach_package, input, result: 'attached' }, landed: true };
    }
    const code = b && typeof b.code === 'string' ? b.code : null;
    if (code === 'already_booked') return { line: DL.LINES.B29, key: 'B29', call: { name: HANDS.attach_package, input, result: 'refused:already_booked' }, landed: false };
    if (code === 'no_fee') return { line: DL.LINES.B33, key: 'B33', call: { name: HANDS.attach_package, input, result: 'refused:no_fee' }, landed: false }; // F-44.102, his own byte
    if (code === 'no_wedding_date' || code === 'no_handover_date') {
      const k = code === 'no_wedding_date' ? 'B25' : 'B26';
      const line = DL.render(k, { client: a.client });
      return line ? { line, key: k, call: { name: HANDS.attach_package, input, result: `refused:${code}` }, landed: false, skipHarvest: k === 'B26' } : B30(`refused:${code}`);
    }
    return B30('refused:write_failed');
  } catch (_e) { return B30('refused:exception'); }
}

// ── apply a live row on her yes, through lifecycleHands' one helper ────────────────────────────────
async function applyRow(supabase, vendor, agentId, row, L) {
  const r = row.request || {};
  const call = row.act === 'milestone_paid'
    ? { name: 'donna_milestone_paid', input: { lead: r.lead_name, milestone: r.milestone, received_on: r.received_on } }
    : { name: 'donna_booking', input: { kind: r.kind, lead: r.lead_name, ...(r.advance_received_on ? { advance_received_on: r.advance_received_on } : {}) } };
  const out = await L.lifecycle.runLifecycleSignals(supabase, { vendor, agentId, result: { tool_calls: [call] } });
  const res = (out.results || [])[0] || null;
  let lines = out.lines || [];
  if (row.act !== 'milestone_paid' && res && (res.code === 'booked' || res.code === 'advance_recorded')) {
    const d1 = DL.render('D1', { client: res.client || r.lead_name, number: res.invoice_number });
    if (d1) lines = [d1, ...lines]; // R-44.21: booking alone speaks D1; an advance speaks D1 then D3 or D4
  }
  return { lines, res, call };
}

// The agent's current thread, READ ONLY, for the listener's context (F-44.39). The door never creates
// a conversation before it knows it will speak; persistDoorTurn does that through memory.js.
async function activeConversation(supabase, agentId) {
  try {
    const { data } = await supabase.schema('engine').from('conversations').select('id, state')
      .eq('agent_id', agentId).order('last_active_at', { ascending: false }).limit(1).maybeSingle();
    return data && data.state === 'active' && typeof data.id === 'string' ? data.id : null;
  } catch (_e) { return null; }
}

// Was the LAST assistant row of the agent's working thread the door's own confirmation question? Read from the
// door's meta on that row (persistDoorTurn writes meta.listener.asked = 'B1' or 'B2' only when it staged and asked).
async function lastWasDoorQuestion(supabase, agentId) {
  try {
    const conv = await activeConversation(supabase, agentId);
    if (!conv) return false;
    const { data, error } = await supabase.schema('engine').from('messages').select('id, role, meta, created_at')
      .eq('conversation_id', conv).eq('role', 'assistant').order('created_at', { ascending: false }).limit(1);
    if (error || !Array.isArray(data) || !data[0]) return false;
    const l = data[0].meta && data[0].meta.listener;
    return !!l && l.door === true && (l.asked === 'B1' || l.asked === 'B2');
  } catch (_e) { return false; }
}
// F-44.100's exception: was the LAST assistant row of the working thread the door's own B18? Its OWN key on the
// door's meta (persistDoorTurn writes meta.listener.asked_name = 'B18'), never the text, and never `asked`, which
// stays B1 or B2 alone (b90 13.5).
async function lastWasDoorNameQuestion(supabase, agentId) {
  try {
    const conv = await activeConversation(supabase, agentId);
    if (!conv) return false;
    const { data, error } = await supabase.schema('engine').from('messages').select('id, role, meta, created_at')
      .eq('conversation_id', conv).eq('role', 'assistant').order('created_at', { ascending: false }).limit(1);
    if (error || !Array.isArray(data) || !data[0]) return false;
    const l = data[0].meta && data[0].meta.listener;
    return !!l && l.door === true && l.asked_name === 'B18';
  } catch (_e) { return false; }
}
// F-44.112: the door's own note, read from the LAST assistant row of the working thread and from nowhere else: its OWN key on
// the door's meta (meta.listener.note), never the text of the row. null when there is none, or it is not well-formed.
async function lastDoorNote(supabase, agentId) {
  try {
    const conv = await activeConversation(supabase, agentId);
    if (!conv) return null;
    const { data, error } = await supabase.schema('engine').from('messages').select('id, role, meta, created_at')
      .eq('conversation_id', conv).eq('role', 'assistant').order('created_at', { ascending: false }).limit(1);
    if (error || !Array.isArray(data) || !data[0]) return null;
    const l = data[0].meta && data[0].meta.listener;
    return l && l.door === true ? validNote(l.note) : null;
  } catch (_e) { return null; }
}
// The act a fresh note keeps, with the names FROM THE ROWS where the door can resolve them (so what she misspelt or the
// listener shortened cannot matter on the next turn, F-44.105) and the ids beside them for the record. Read-only. TOTAL.
async function noteFor(supabase, vendor, asked, act, rest, tries, L) {
  try {
    const first = noteAct(act);
    if (!first || !DATE_ASKS.includes(asked)) return null;
    delete first.date_as_spoken; // the date is what is being asked for
    const note = { asked, acts: [first, ...(Array.isArray(rest) ? rest : []).map(noteAct).filter(Boolean)], tries: Number.isInteger(tries) ? tries : 0, direction: directionOf(first.act) };
    if (first.act !== 'lead' && first.client_as_spoken) {
      const found = await L.lifecycle.resolveLead(supabase, vendor.id, first.client_as_spoken, false);
      if (found && found.ok && found.lead) { note.lead_id = found.lead.id; const n = String(found.lead.name || '').trim(); if (n) first.client_as_spoken = n; }
    }
    if (first.act === 'attach_package' && first.package_as_spoken) {
      const pkgs = await packagesOf(supabase, vendor.id);
      const hits = (pkgs || []).filter((p) => p && key(p.name) === key(first.package_as_spoken));
      if (hits.length === 1) { note.package_id = hits[0].id; const n = String(hits[0].name || '').trim(); if (n) first.package_as_spoken = n; }
    }
    return validNote(note) ? note : null;
  } catch (_e) { return null; }
}

// ── the one entry ─────────────────────────────────────────────────────────────────────────────────
// Returns { door: false, ear } for the chain, or { door: true, reply, toolCalls, toolNames, refresh,
// documents, keys, skipHarvest, ear }. The caller persists and sends (persistDoorTurn, speakOnWhatsApp).
//
// ONCE THE DOOR HAS WRITTEN ANYTHING, THE TURN IS THE DOOR'S TO THE END (the chair's rule on P5's cut).
// Before the first write any failure goes to the chain, as it always could. `st.wrote` is set BEFORE each
// write is attempted (a write that throws may still have landed), and from then on no path returns the
// chain: the catch answers with what is honestly known, the lines already earned, else the act's own
// refusal byte (D8 for a payment, F29 for a booking) or, for an invoice, the founder's vetoed glitch line.
// After-the-act stamps (markApplied) run in their own guard, so a failed stamp cannot mask a payment
// that landed. One message, one handler; confirm-before-money survives a hiccup.
function glitchLine() {
  try { return require('../../api/vendor-engine/chat').STAGE2_LINE_MUTATION || null; } catch (_e) { return null; }
}
// (the chair's cure on r2) BEFORE the door speaks D8 or F29 from the after-write catch it RE-READS the row it
// meant to write. Landed: the truthful existing byte (D7 for a payment already marked, D1 for a booking that
// stands, its number read from the row). Nothing landed, or the re-read fails: D8 or F29.
async function reread(supabase, vendorId, row, L) {
  try {
    const r = (row && row.request) || {};
    if (row.act === 'milestone_paid') {
      const { data, error } = await supabase.from('payment_schedules').select('id, milestone_label, state, paid_at')
        .eq('id', r.milestone_id).eq('vendor_id', vendorId).maybeSingle();
      if (error || !data) return null;
      if (data.state !== 'paid') return null;
      const day = istDay(data.paid_at);
      return day ? L.lifecycle.LINES.D7(String(r.lead_name || '').trim(), String(data.milestone_label || '').trim(), day) : null;
    }
    const { data: lead, error } = await supabase.from('leads').select('id, name, state, binder_id')
      .eq('id', r.lead_id).eq('vendor_id', vendorId).maybeSingle();
    if (error || !lead || String(lead.state || '').toLowerCase() !== 'booked' || !lead.binder_id) return null;
    const { data: invs, error: iErr } = await supabase.from('invoices').select('invoice_number, state, lead_package_id, deleted_at')
      .eq('lead_id', lead.id).eq('vendor_id', vendorId).is('deleted_at', null);
    if (iErr || !Array.isArray(invs)) return null;
    const pkg = invs.filter((i) => i.lead_package_id && i.state !== 'cancelled' && i.invoice_number);
    return pkg.length === 1 ? DL.render('D1', { client: String(lead.name || '').trim(), number: pkg[0].invoice_number }) : null;
  } catch (_e) { return null; }
}

function doorAnswer(st, why) {
  const lines = st.lines.filter(Boolean);
  let reply = lines.join('\n\n');
  // The glitch byte is read lazily from its one home (b90 14.1 proves it loads cold in both orders); B3 is the
  // last resort only if that home cannot load at all.
  if (!reply) reply = st.fallback || glitchLine() || DL.LINES.B3;
  return { door: true, reply, keys: st.keys, toolCalls: st.toolCalls, toolNames: st.toolCalls.map((t) => t.name), refresh: st.refresh, documents: st.documents, skipHarvest: st.skipHarvest, ear: st.ear, ...(st.note ? { note: st.note } : {}), ...(st.answered ? { answered: st.answered } : {}), ...(why ? { why } : {}) };
}

async function preTurn(args, depsIn) {
  const st = { wrote: false, rereadRow: null, ctx: null, ear: null, lines: [], keys: [], toolCalls: [], documents: [], refresh: false, skipHarvest: false, fallback: null, note: null, answered: null, dateAsks: [], pkgAsks: [] };
  try {
    // e-16's lesson: the arguments are taken INSIDE the guard, so a hostile argument cannot throw past it.
    const { supabase, vendor, agentId, route, message, lane, conversationId } = (args && typeof args === 'object') ? args : {};
    const deps = (depsIn && typeof depsIn === 'object') ? depsIn : {};
    if (!supabase || !vendor || typeof vendor.id !== 'string' || typeof agentId !== 'string' || typeof message !== 'string' || !message.trim()) return CHAIN(null, 'no_input');
    if (!['pwa', 'whatsapp'].includes(lane)) return CHAIN(null, 'no_lane');
    const L = lazy(deps);
    const pma = deps.pma || PMA; // a seam for b90's throw injection; production passes nothing
    const nowMs = Number.isFinite(deps.nowMs) ? deps.nowMs : Date.now();

    // 1 · the pending check, BEFORE the listener
    const said = PMA.decide(message);
    const live = await pma.liveRow(supabase, vendor.id, nowMs);
    if (live && said === 'no') {
      st.wrote = true; st.lines = [DL.LINES.B3]; st.keys = ['B3']; st.skipHarvest = true;
      await pma.markDeclined(supabase, live);
      return doorAnswer(st);
    }
    if (live && said === 'yes') {
      st.wrote = true; st.rereadRow = live; st.ctx = { supabase, vendorId: vendor.id, L };
      st.fallback = live.act === 'milestone_paid' ? L.lifecycle.LINES.D8 : L.lifecycle.LINES.F29;
      await pma.markConfirmed(supabase, live);
      const { lines, res, call } = await applyRow(supabase, vendor, agentId, live, L);
      st.lines = lines.filter(Boolean);
      st.toolCalls = [{ name: call.name, input: call.input, result: res ? res.code : null }];
      st.refresh = !!(res && res.ok);
      try { await pma.markApplied(supabase, live, res || null); } catch (e) { try { console.warn('[door:markApplied]', e && e.message); } catch (_e) { /* */ } }
      return doorAnswer(st);
    }
    if (live && said === null) await pma.markExpired(supabase, live); // a stamp, not an act: the row is not live either way
    // F-44.112: THE DOOR'S OWN NOTE, read AFTER the live-row handling (a yes or a no belongs to the money question first) and
    // ABOVE the bare yes-or-no exit, so her "No" to a date question meets the note and reads B3, never LEFTOVER.
    const note = await lastDoorNote(supabase, agentId);
    if (note && said === 'no') {
      return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: null, answered: note.asked, why: 'note_declined' };
    }
    if (!note && !live && said !== null) {
      // F-44.58 (the chair's rule, cured in P5): if the LAST assistant row of the working thread is the door's own
      // confirmation question (B1 or B2, known from the door's meta on that row, never by matching text), her bare
      // yes or no answers THAT question, which has lapsed: the door answers and the chain is not called, so Victor
      // never marks a payment outside the window. What she reads is B14, his (R-44.22 (a)).
      if (await lastWasDoorQuestion(supabase, agentId)) {
        try { for (const r of await PMA.openRows(supabase, vendor.id)) if (r.state === 'staged') await PMA.markExpired(supabase, r); } catch (_e) { /* a stamp */ }
        return { door: true, reply: DL.LINES.B14, keys: ['B14'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: null, why: 'lapsed_question' };
      }
      return CHAIN(null, 'yes_no_nothing_waiting');
    }

    // 2 · hear, before the reply, bounded
    const seat = L.listener.listenerSeat(route);
    if (typeof seat.provider !== 'string' || !seat.provider || typeof seat.model !== 'string' || !seat.model) return CHAIN(null, 'no_seat');
    const threadId = conversationId || await activeConversation(supabase, agentId);
    st.ear = await L.listener.hear({ supabase, route, message, conversationId: threadId, excludeId: null },
      { ...(deps.llmCreate ? { llmCreate: deps.llmCreate } : {}), timeoutMs: Number.isFinite(deps.hearMs) ? deps.hearMs : HEAR_BEFORE_REPLY_MS });
    // F-44.112: a turn that answers the door's own date question. THE DOOR'S OWN READ DECIDES FIRST: if her whole message
    // resolves as a date in the noted act's direction it IS the answer, whatever the listener heard (it was still heard, for
    // the record). If it does not, the listener's record decides ONE thing: an act OTHER than the noted one means she has
    // moved on, the note LAPSES and her message is handled fresh below. Otherwise the saved act runs with her words as its
    // date and the plans answer as they answer any unreadable date.
    let fromNote = null;
    // A NAME NOTE (B18 or B35): decided before the date-note branch below.
    const askAgain = (line, key, tries) => ({ door: true, reply: line, keys: [key], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, note: { asked: key, acts: note.acts, tries }, answered: key, why: 'note_reasked' });
    if (note && NAME_ASKS.includes(note.asked)) {
      const name = message.trim();
      const heardActs = st.ear && st.ear.request && Array.isArray(st.ear.request.acts) ? st.ear.request.acts : [];
      const kinds = note.acts.map((a) => a.act);
      const carried = note.acts.map((a) => key(a.date_as_spoken)).filter(Boolean);
      const newDate = (a) => !!spokenText(a.date_as_spoken) && key(a.date_as_spoken) !== key(name) && !carried.includes(key(a.date_as_spoken));
      // F-44.117 (the chair, 22 September): a heard act whose client_as_spoken IS her whole message under key(), or any act on route 'search',
      // is her answer heard as a lookup (twice it was heard as `find`), not a job of another kind: it does not lapse.
      const route = st.ear && st.ear.request ? st.ear.request.route : null;
      const isAnswer = (a) => route === 'search' || key(a.client_as_spoken) === key(name);
      const movedOn = heardActs.some((a) => a && typeof a === 'object' && typeof a.act === 'string' && !isAnswer(a) && (!kinds.includes(a.act) || newDate(a)));
      if (PMA.decide(name) === 'yes') {
        if (note.tries > 0) return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: note.asked, why: 'note_exhausted' };
        return askAgain(DL.LINES[note.asked], note.asked, note.tries + 1);
      }
      if (!movedOn) {
        fromNote = { route: 'task', acts: note.acts.map((a) => ((note.asked === 'B18' ? (a.act === 'lead' && !spokenText(a.client_as_spoken)) : (a.act !== 'lead' && !spokenText(a.client_as_spoken))) ? { ...a, client_as_spoken: name } : { ...a })) };
        st.answered = note.asked;
      }
    } else if (note && PKG_ASKS.includes(note.asked)) {
      const said = message.trim();
      const heardActs = st.ear && st.ear.request && Array.isArray(st.ear.request.acts) ? st.ear.request.acts : [];
      const pkgs = (await packagesOf(supabase, vendor.id)) || [];
      const own = pkgs.filter((p) => p && key(p.name) === key(said));
      if (own.length === 1) { fromNote = { route: 'task', acts: note.acts.map((a, i) => (i === 0 ? { ...a, package_as_spoken: String(own[0].name) } : { ...a })) }; st.answered = note.asked; }
      else {
        const echo = (a) => key(a.package_as_spoken) === key(said) || key(a.client_as_spoken) === key(said);
        const movedOn = heardActs.some((a) => a && typeof a === 'object' && typeof a.act === 'string' && !echo(a) && (a.act !== 'attach_package' || (!!spokenText(a.package_as_spoken) && key(a.package_as_spoken) !== key(note.acts[0].package_as_spoken || ''))));
        if (!movedOn) {
          if (note.tries > 0) return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: note.asked, why: 'note_exhausted' };
          const line = DL.whichPackage(pkgs.map((p) => p && p.name)) || DL.LINES.B3;
          return { ...askAgain(line, line === DL.LINES.B3 ? 'B3' : 'B31', note.tries + 1), note: { asked: 'B31', acts: note.acts, tries: note.tries + 1 } };
        }
      }
    } else if (note) {
      const own = resolveSpokenDate(message.trim(), { direction: note.direction, nowMs });
      const heardActs = st.ear && st.ear.request && Array.isArray(st.ear.request.acts) ? st.ear.request.acts : [];
      // F-44.115 (the chair's ruling of 22 September, superseding "only an act OTHER than the noted one lapses the note", which was too
      // narrow; F-44.113 is folded in, the two being one rule). WITNESSED on his walk of 22 September: refused a date, he RETYPED THE WHOLE
      // SENTENCE; the listener heard the NOTED act for the SAME client, the note stood, his sentence was read as a date: B7, then B3. At
      // 6456690 the same retype filed (Part A's walk, turn 6). SHE HAS MOVED ON when the heard request holds ANY of: an act other than the
      // noted one; the noted act naming a DIFFERENT client under key(); THE NOTED ACT CARRYING A date_as_spoken OF ITS OWN, since she has
      // then restated the job. The re-ask remains ONLY for no act heard, or the noted act heard with no date. A job handled fresh that is
      // refused again writes a NEW note at tries 0: she may retype as often as she likes and is never told "Nothing was changed" for it.
      const noted = note.acts[0];
      // F-44.116 (the chair's ruling of 22 September, on his "whenever" heard as the attach WITH date "whenever"): a heard date that is, under key(),
      // HER WHOLE TRIMMED MESSAGE is not a restatement but her answer heard twice; it stays a re-ask and the note keeps its tries.
      const restated = (a) => a.act === noted.act && ((!!spokenText(a.date_as_spoken) && key(a.date_as_spoken) !== key(message.trim()))
        || (!!spokenText(a.client_as_spoken) && !!spokenText(noted.client_as_spoken) && key(a.client_as_spoken) !== key(noted.client_as_spoken)));
      const movedOn = heardActs.some((a) => a && typeof a === 'object' && typeof a.act === 'string' && (a.act !== noted.act || restated(a)));
      if (own.ok || !movedOn) fromNote = { route: 'task', acts: note.acts.map((a, i) => (i === 0 ? { ...a, date_as_spoken: message.trim() } : { ...a })) };
    }
    let heard = fromNote;
    // THE NAME QUESTION (R-44.39): a request whose every act the door covers, one of them a booking, payment, invoice or attach with NO
    // client, is the door's. It asks B18 first if a lead is nameless too, else B35, and keeps a note carrying every act; nothing runs
    // until the name comes. Read on the request the door decides on, whichever way it came.
    const askName = (rq, tries) => {
      if (!rq || !allKindsCovered(rq.acts) || !(namelessOf(rq.acts).length || namelessLead(rq.acts))) return null;
      if (st.ear && st.ear.request && Array.isArray(st.ear.request.acts) && st.ear.request.acts.some((a) => a && a.act === 'lead') && phoneShaped(message)) return CHAIN(st.ear, 'lead_phone');
      const k = namelessLead(rq.acts) ? 'B18' : 'B35';
      return { door: true, reply: DL.LINES[k], keys: [k], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, note: { asked: k, acts: rq.acts.map((a) => ({ ...a })), tries }, ...(st.answered ? { answered: st.answered } : {}), why: 'name_asked' };
    };
    if (fromNote) { const ask = askName(fromNote, 0); if (ask) return ask; }
    if (!fromNote) {
    if (!st.ear || !st.ear.request) return CHAIN(st.ear, 'no_request');
    // F-44.110: the door DECIDES on the request with an echoed event dropped; st.ear, which is recorded, keeps what was HEARD.
    heard = withoutEchoedEvents(st.ear.request, nowMs);
    { const ask = askName(heard, 0); if (ask) return ask; }
    if (!allCovered(heard)) return CHAIN(st.ear, 'uncovered');
    // F-44.96's guard: a lead whose message carries a phone-shaped number goes WHOLE to the chain, which files it.
    if (st.ear.request.acts.some((a) => a && a.act === 'lead') && phoneShaped(message)) return CHAIN(st.ear, 'lead_phone');
    } else st.answered = note.asked;

    // 3 · resolve every act first, read-only; any act the door cannot say sends the WHOLE message to the chain
    const acts = heard.acts;
    const money = acts.filter((a) => MONEY_ACTS.includes(a.act));
    // F-44.100: the thread is read ONLY when a lead act's name is made of event words and nothing else.
    let answeringB18 = false;
    if (acts.some((a) => a && a.act === 'lead' && eventOnly(a.client_as_spoken))) answeringB18 = await lastWasDoorNameQuestion(supabase, agentId);
    const leadPlans = [];
    for (const a of acts) if (a.act === 'lead') leadPlans.push(planLead(a, nowMs, answeringB18));
    const leadActs = acts.filter((a) => a.act === 'lead'); // F-44.112: the act behind each plan, by position; the line above is another rung's anchor
    // P6a-2: every attach is PROBED read-only. One the door cannot say, or one naming no lead that this message
    // does not itself file, sends the WHOLE message to the chain before anything is written.
    const attaches = acts.filter((a) => a.act === 'attach_package');
    const willFile = leadPlans.filter((p) => p && p.lead).map((p) => key(p.lead.name));
    for (const a of attaches) {
      const probe = await planAttach(supabase, vendor, a, nowMs, L);
      if (!probe) return CHAIN(st.ear, 'attach_unsayable');
      if (probe.noLead && !willFile.includes(key(probe.name))) return CHAIN(st.ear, 'attach_no_lead', { name: probe.name });
    }
    const plans = [];
    for (const a of acts) {
      if (a.act === 'invoice') { const p = await planInvoice(supabase, vendor, agentId, a); if (!p || p.noBinder) return CHAIN(st.ear, 'invoice_unresolved', p && p.noBinder ? { name: p.name } : null); plans.push({ act: a, plan: p }); }
    }
    let moneyPlan = null;
    if (money.length) { moneyPlan = await planMoney(supabase, vendor, money[0], L); if (!moneyPlan) return CHAIN(st.ear, 'money_unsayable', { act: money[0].act }); }

    // 4 · act: leads first, then attaches, then invoices, then the one money act is staged and asked
    for (const lp of leadPlans) {
      if (lp.speak) { st.lines.push(lp.speak); st.keys.push(lp.key); if (lp.skipHarvest) st.skipHarvest = true; if (DATE_ASKS.includes(lp.key)) st.dateAsks.push({ key: lp.key, act: leadActs[leadPlans.indexOf(lp)] }); continue; }
      st.wrote = true; // a lead may land inside the call even if the call then throws
      if (!st.fallback) st.fallback = DL.LINES.B20;
      const f = await fileLead(supabase, vendor, lane, lp, L);
      st.lines.push(f.line); st.keys.push(f.key); st.toolCalls.push(f.call);
      if (f.landed) st.refresh = true;
    }
    // P6a-2: each attach plan is REBUILT here, reading the rows as they now stand (a lead this message filed exists
    // now). After a write nothing goes to the chain: what the door cannot say is B30, which is truthful.
    let attachMissed = false;
    for (const a of attaches) {
      const ap = await planAttach(supabase, vendor, a, nowMs, L);
      if (!ap || ap.noLead) {
        if (!st.wrote) return CHAIN(st.ear, 'attach_unsayable');
        st.lines.push(DL.LINES.B30); st.keys.push('B30'); attachMissed = true; continue;
      }
      if (ap.speak) { st.lines.push(ap.speak); st.keys.push(ap.key); if (ap.skipHarvest) st.skipHarvest = true; if (DATE_ASKS.includes(ap.key)) st.dateAsks.push({ key: ap.key, act: a }); if (PKG_ASKS.includes(ap.key)) st.pkgAsks.push({ key: ap.key, act: a }); attachMissed = true; continue; }
      st.wrote = true; // the re-attach retires the live row before it inserts; either may land inside a call that throws
      if (!st.fallback) st.fallback = DL.LINES.B30;
      const f = await fileAttach(supabase, vendor, ap, L);
      if (f.line) { st.lines.push(f.line); st.keys.push(f.key); if (DATE_ASKS.includes(f.key)) st.dateAsks.push({ key: f.key, act: a }); }
      st.toolCalls.push(f.call);
      if (f.skipHarvest) st.skipHarvest = true;
      if (f.landed) { st.refresh = true; if (!f.line) st.fallback = glitchLine(); } else attachMissed = true;
    }
    for (const { plan } of plans) {
      if (plan.speak) { st.lines.push(plan.speak); st.keys.push(plan.key); if (plan.skipHarvest) st.skipHarvest = true; continue; }
      st.wrote = true; // an invoice may be minted inside the call, even if the call then fails
      st.fallback = glitchLine();
      const gen = await L.generateInvoiceForBinder(supabase, vendor, plan.invoice.binder);
      if (!gen || !gen.ok) continue; // written or not, it is the door's now: the fallback speaks if nothing else does
      const served = gen.made === 'served';
      const line = served ? DL.render('B9', { number: gen.invoice_number, client: plan.invoice.client }) : DL.invoiceReady(gen.invoice_number, plan.invoice.client);
      if (line) { st.lines.push(line); st.keys.push(served ? 'B9' : 'B13'); }
      st.documents.push({ invoice_number: gen.invoice_number, pdf_url: gen.pdf_url, client: plan.invoice.client, binder_id: plan.invoice.binder.id });
      st.toolCalls.push({ name: HANDS.invoice, input: { binder_id: plan.invoice.binder.id }, result: served ? 'served' : 'minted' });
      st.refresh = true;
    }
    // THE MONEY PLAN IS REBUILT AFTER THE LEAD AND ATTACH PASSES (the plan above was only the probe): it reads the
    // rows as they now stand, so B2 speaks the package just attached. An attach that did NOT land asks NO B2 and
    // stages NO row: the door has said what landed and what did not.
    const silenced = (moneyPlan && attachMissed) ? [money[0]] : []; // F-44.112: the money act a missed attach silences rides that attach's note
    if (moneyPlan && (leadPlans.length || attaches.length)) {
      if (attachMissed) moneyPlan = null;
      else {
        moneyPlan = await planMoney(supabase, vendor, money[0], L);
        if (!moneyPlan) { const r = money[0].act === 'milestone_paid' ? 'D8' : 'F29'; moneyPlan = { speak: L.lifecycle.LINES[r], key: r }; }
      }
    }
    if (moneyPlan) {
      if (moneyPlan.stage) {
        const refusal = moneyPlan.stage.act === 'milestone_paid' ? 'D8' : 'F29';
        st.wrote = true; st.fallback = L.lifecycle.LINES[refusal];
        let row = null;
        try { row = await pma.stage(supabase, { vendorId: vendor.id, act: moneyPlan.stage.act, request: moneyPlan.stage.request, lane }); }
        catch (e) {
          // The stage may have landed before the throw. A staged row she was never asked about must not
          // stay live for a later yes, so every open staged row is closed, best-effort, and the refusal speaks.
          try { console.warn('[door:stage]', e && e.message); } catch (_e) { /* */ }
          try { for (const r of await PMA.openRows(supabase, vendor.id)) if (r.state === 'staged') await PMA.markExpired(supabase, r); } catch (_e) { /* */ }
          row = null;
        }
        if (!row) { st.lines.push(L.lifecycle.LINES[refusal]); st.keys.push(refusal); }
        else { st.lines.push(moneyPlan.speak); st.keys.push(moneyPlan.key); }
      } else { st.lines.push(moneyPlan.speak); st.keys.push(moneyPlan.key); if (moneyPlan.skipHarvest) st.skipHarvest = true; if (DATE_ASKS.includes(moneyPlan.key)) st.dateAsks.push({ key: moneyPlan.key, act: money[0] }); }
      if (money.length > 1) { st.lines.push(DL.LINES.B12); st.keys.push('B12'); }
    }
    if (!st.lines.filter(Boolean).length && !st.wrote) return CHAIN(st.ear, 'empty');
    // F-44.112: a turn that ends in exactly ONE date question keeps its note. ONE RE-ASK, THEN B3: a note turn that ends in a
    // date question AGAIN keeps a note once more (tries 1); the next, having written nothing, answers B3 and keeps none. A turn
    // that wrote something is never answered "Nothing was changed": it says what it did and simply keeps no further note.
    // F-44.100's net spoke B18 for a lead named only by event words: that B18 keeps a note too, the event-word name dropped from the lead so
    // that her answer is the name (as the exception always made it), carrying every other act of the message. Nothing was written on such a turn.
    if (!st.wrote && st.keys.length === 1 && st.keys[0] === 'B18') {
      st.note = { asked: 'B18', acts: acts.map((a) => (a.act === 'lead' && eventOnly(a.client_as_spoken) ? (({ client_as_spoken: _c, ...rest }) => rest)(a) : { ...a })), tries: fromNote ? note.tries + 1 : 0 };
    }
    if (st.pkgAsks.length === 1 && !st.dateAsks.length) {
      const w = st.pkgAsks[0]; const tries = fromNote && note && PKG_ASKS.includes(note.asked) ? note.tries + 1 : 0;
      if (tries > 1 && !st.wrote && !st.toolCalls.length) return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: note.asked, why: 'note_exhausted' };
      if (tries <= 1) st.note = { asked: w.key, acts: [(({ package_as_spoken: _p, ...rest }) => rest)(w.act), ...silenced.map((a) => ({ ...a }))], tries };
    }
    if (st.dateAsks.length === 1) {
      const tries = fromNote ? note.tries + 1 : 0;
      if (tries > 1) {
        if (!st.wrote && !st.toolCalls.length) return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: note.asked, why: 'note_exhausted' };
      } else {
        const waiting = st.dateAsks[0];
        const rest = waiting.act && waiting.act.act === 'attach_package' ? silenced : [];
        st.note = await noteFor(supabase, vendor, waiting.key, waiting.act, rest, tries, L);
      }
    }
    return doorAnswer(st);
  } catch (e) {
    try { console.warn('[door:preTurn]', e && e.message); } catch (_e) { /* */ }
    if (st.wrote) {
      if (!st.lines.filter(Boolean).length && st.rereadRow && st.ctx) {
        const truth = await reread(st.ctx.supabase, st.ctx.vendorId, st.rereadRow, st.ctx.L);
        if (truth) { st.lines = [truth]; st.keys = [st.rereadRow.act === 'milestone_paid' ? 'D7' : 'D1']; }
      }
      return doorAnswer(st, 'exception_after_write');
    }
    return CHAIN(st.ear, 'exception');
  }
}

// ── LCV-9 PART ONE · THE STAND-IN: what the door says when it did NOT take the turn and the chain is OUT ─────────
// Called by both lanes with preTurn's verdict (or null when preTurn itself was unreachable). Returns null ONLY when
// the switch reads JSON true (chain in: the lane falls to the chain as at 10d5d99). Otherwise a door answer, decided
// from the verdict's reason and the listener's request, NEVER from her text:
//   yes_no_nothing_waiting, or a request holding no act ......................... LEFTOVER + two covered examples
//   a request holding ANY act outside COVERED (a mixed message included), lead_phone  B34
//   every act covered but one names no client ...... LEFTOVER (the chair's ruling; B35 is with the founder)
//   attach_no_lead B32 · invoice_unresolved with no binder B15 · attach_unsayable B30 · money_unsayable F29 or D8
//   everything else (no seat, no request, a failed read, empty, an exception, no input) ... the glitch line
// TOTAL: never throws; anything unexpected, chain out, is the glitch line. THE ONE READ of the switch and the ONE
// read of the leftover builder in the estate are here.
function standKey(out, L, nowMs) {
  try { return standKeyOf(out, L, nowMs); } catch (_e) { return { key: 'GLITCH' }; }
}
function standKeyOf(out, L, nowMs) {
  const why = out && typeof out.why === 'string' ? out.why : null;
  const say = out && out.say && typeof out.say === 'object' ? out.say : {};
  // F-44.110: the stand-in reads the request AS THE DOOR DECIDED ON IT, an echoed event dropped, so the two never disagree.
  const request = out && out.ear && out.ear.request && typeof out.ear.request === 'object' ? withoutEchoedEvents(out.ear.request, nowMs) : null;
  const acts = request && Array.isArray(request.acts) ? request.acts : null;
  if (why === 'yes_no_nothing_waiting') return { key: 'LEFTOVER' };
  if (why === 'lead_phone') return { key: 'B34' };
  if (why === 'uncovered' && acts) {
    if (!acts.length) return { key: 'LEFTOVER' };
    if (acts.some((a) => !a || !COVERED.includes(a.act))) return { key: 'B34' };
    return { key: 'LEFTOVER' };
  }
  if (why === 'attach_no_lead') { const line = DL.render('B32', { name: say.name }); return line ? { key: 'B32', line } : { key: 'B30' }; }
  if (why === 'attach_unsayable') return { key: 'B30' };
  if (why === 'invoice_unresolved' && typeof say.name === 'string') { const line = DL.render('B15', { name: say.name }); if (line) return { key: 'B15', line }; }
  if (why === 'money_unsayable') { const k = say.act === 'milestone_paid' ? 'D8' : 'F29'; const line = L.lifecycle.LINES[k]; if (typeof line === 'string' && line) return { key: k, line }; }
  return { key: 'GLITCH' };
}
async function standIn(args, depsIn) {
  let chainIn = false;
  const answer = (key, line, out) => ({ door: true, reply: line, keys: [key], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: (out && out.ear) || null, why: (out && out.why) || 'unreachable', stood: true });
  try {
    const { supabase, out } = (args && typeof args === 'object') ? args : {};
    const deps = (depsIn && typeof depsIn === 'object') ? depsIn : {};
    try { chainIn = (await (deps.readLaneFlag || require('../laneFlags').readLaneFlag)(supabase, CHAIN_FLAG)) === true; } catch (_e) { chainIn = false; }
    if (chainIn) return null;
    if (out && out.door === true) return out;
    const k = standKey(out, lazy(deps), Number.isFinite(deps.nowMs) ? deps.nowMs : undefined);
    if (k.key === 'LEFTOVER') return answer('LEFTOVER', DL.leftover(COVERED, deps.rand), out);
    if (k.key === 'GLITCH') return answer('GLITCH', glitchLine() || DL.LINES.B3, out);
    return answer(k.key, k.line || DL.LINES[k.key], out);
  } catch (e) {
    try { console.warn('[door:standIn]', e && e.message); } catch (_e) { /* */ }
    if (chainIn) return null;
    let line = null; try { line = glitchLine(); } catch (_e) { line = null; }
    return answer('GLITCH', line || DL.LINES.B3, null);
  }
}

// THE WHATSAPP DOOR'S DELIVERY, ONE HOME. Called only once preTurn answered door: true. Every step runs in
// its OWN guard and the function never throws, so the lane can RETURN after it and never reach the chain:
// a failed send is a failed send, as it is on the chain today, never a second handler.
async function speakOnWhatsApp(args, depsIn) {
  const done = { persisted: false, sent: false, logged: false, documents: 0 };
  try {
    const { supabase, agentId, phone, convoId, message, out, sendWhatsApp } = (args && typeof args === 'object') ? args : {};
    const deps = (depsIn && typeof depsIn === 'object') ? depsIn : {};
    const persist = deps.persistDoorTurn || persistDoorTurn;
    if (!out || !out.door) return done;
    try { await persist({ supabase, agentId, message, out, lane: 'whatsapp' }); done.persisted = true; } catch (e) { console.error('[door:wa persist]', e && e.message); }
    let sent = null;
    try { sent = await sendWhatsApp(phone, out.reply, []); done.sent = true; } catch (e) { console.error('[door:wa send]', e && e.message); }
    try {
      await supabase.from('messages').insert({
        conversation_id: convoId, direction: 'outbound', channel: 'whatsapp', body: out.reply, sent_by: 'agent',
        twilio_sid: sent && sent.sid ? sent.sid : null, tool_calls: out.toolNames || [],
      });
      done.logged = true;
    } catch (e) { console.error('[door:wa outbound row]', e && e.message); }
    try { await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', convoId); } catch (e) { console.error('[door:wa last_message_at]', e && e.message); }
    for (const d of (Array.isArray(out.documents) ? out.documents : [])) {
      try {
        const docMsg = await sendWhatsApp(phone, '', [d.pdf_url]);
        await supabase.from('messages').insert({
          conversation_id: convoId, direction: 'outbound', channel: 'whatsapp', body: `[invoice PDF ${d.invoice_number}]`, sent_by: 'agent',
          twilio_sid: docMsg && docMsg.sid ? docMsg.sid : null, media_url: d.pdf_url,
        });
        done.documents += 1;
      } catch (e) { console.error('[door:wa invoice-pdf-send]', e && e.message); }
    }
  } catch (e) { try { console.error('[door:wa]', e && e.message); } catch (_e) { /* */ } }
  return done;
}

// ── the thread and the meter for a door-only turn. Never throws. ──────────────────────────────────
// The user row and the door's row join the SAME engine thread the chain uses (memory.js, the dist
// exports; no engine source is edited), the row is stamped room 'business' as recordMessageRoom
// stamps it, meta.listener carries the request, and ONE counted usage row is written through
// harvest's writer with this conversation's id (F-44.52): the listener's own call when there was
// one, a zero-cost row when the turn was a yes or a no (it is still one message, R-44.21 (b)).
async function persistDoorTurn(args, depsIn) {
  const res = { conversationId: null, assistantId: null };
  try {
    const { supabase, agentId, message, out, lane } = (args && typeof args === 'object') ? args : {};
    const deps = (depsIn && typeof depsIn === 'object') ? depsIn : {};
    const memory = deps.memory || require('../../engine/dist/core/memory');
    const meter = deps.meter || require('../../agent/harvest')._meter;
    const { conversationId } = await memory.getOrCreateConversation(agentId);
    res.conversationId = conversationId;
    await memory.saveMessage(conversationId, 'user', message);
    const ear = out && out.ear;
    const asked = (Array.isArray(out.keys) ? out.keys : []).find((k) => k === 'B1' || k === 'B2') || null; // F-44.58's mark
    const askedName = (Array.isArray(out.keys) ? out.keys : []).includes('B18') ? 'B18' : null; // F-44.100's mark, its OWN key
    const listener = { lane, provider: ear && ear.seat ? ear.seat.provider : null, model: ear && ear.seat ? ear.seat.model : null, request: ear ? ear.request : null, door: true, ...(asked ? { asked } : {}), ...(askedName ? { asked_name: askedName } : {}), ...(validNote(out.note) ? { note: out.note } : {}), ...(typeof out.answered === 'string' ? { answered: out.answered } : {}), ...(ear && ear.error ? { error: ear.error } : {}) };
    res.assistantId = await memory.saveMessage(conversationId, 'assistant', out.reply, (out.toolCalls && out.toolCalls.length) ? out.toolCalls : undefined, { listener });
    if (res.assistantId) {
      try { await supabase.schema('engine').from('messages').update({ room: 'business' }).eq('id', res.assistantId); } catch (e) { console.warn('[door:room]', e && e.message); }
    }
    const row = ear && ear.usage ? meter.harvestMeterRow({ usage: ear.usage }, ear.seat && ear.seat.model) : meter.harvestMeterRow({ usage: {} }, 'door');
    await meter.writeHarvestUsage(supabase, agentId, { ...row, conversation_id: conversationId });
  } catch (e) { try { console.warn('[door:persist]', e && e.message); } catch (_e) { /* */ } }
  return res;
}

module.exports = { PKG_ASKS, NAME_ASKS, DATE_ASKS, validNote, noteFor, lastDoorNote, withoutEchoedEvents, sameSpokenDay, standIn, standKey, CHAIN_FLAG, planAttach, fileAttach, eventOnly, EVENT_WORDS, lastWasDoorNameQuestion, planLead, fileLead, phoneShaped, planPayment, planBooking, preTurn, persistDoorTurn, speakOnWhatsApp, doorAnswer, glitchLine, reread, lastWasDoorQuestion, allCovered, planMoney, planInvoice, applyRow, HEAR_BEFORE_REPLY_MS, COVERED, MONEY_ACTS, HANDS };
