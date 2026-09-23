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
// changed is what the lanes do with that verdict: they hand it to standIn(), which SPEAKS FOR THE DOOR so the chain is
// never called. (It read ONE switch, admin_config `vendor.working_chain_enabled`, until CE-45 LCV-15 LSP_1 RETIRED it
// on the chair's ruling, Q6: the chain's calls are deleted, so the switch had no other position; standIn never
// returns null, and an admin_config row of that key, if one exists, is inert.)
// no act heard is LEFTOVER with two covered examples; an act the door does not cover is B34; a glitch is the
// founder's vetoed glitch line; and the exits that know more say more (B32, B15, B30, F29 or D8). NOTHING IS WRITTEN
// on a stand-in turn.
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

// P6b, THE FIRST CUT (CE-45 LCV-11, the chair's rulings of 22 September 2026 on the read-first's forks and the founder's R-45.1):
// THE DOOR LEARNS `relay`, a message to a client. The client is resolved by the door's OWN lookup (resolveLead exact, then the
// ONE home for names, B36, then B38 "Could not send the message. No client called {name}."); her WHOLE message is the instruction
// (EAR_TOOL has no slot for what she wants said); the body is composed by draftSeat.js on the LISTENER'S seat (R-45.1) with ONE
// tool and no hand, or is her own quoted words; it is STORED through coupleDrafts.stage and shown from the ROW in the founder's
// frame B37; THE FRAME IS A NOTE OF THE DOOR'S OWN KIND (RELAY_ASKS, carrying the draft's id); her bare YES on the next turn
// sends through relaySeat.sendApprovedDraft, her NO refuses the row and reads the seat's own declined byte; a live money row
// still wins first. runRelaySeat is never called; the seat's plain lanes and doorStage are not reached from here. A relay act's
// own date_as_spoken is IGNORED: the date is part of the message, never a job. The phone guard (F-44.96) LEAVES: EAR_TOOL now
// hears phone_as_spoken (measured 22 September, table sha256 311fda220b8f…), the door folds it (relayToCouple.asPhone) and hands
// it to createLead as `phone`. quote_send and the pwa lane's send are the SECOND cut's; B39 is carried, unspoken.
//
// R-45.3, THE COLD SECOND HEARING (CE-45 LCV-12, P7's first cut; the chair's ruling of 22 September on the read-first's fork (a)): when the
// ear hears no task inside a long thread but her message names one of her live leads, the door hears the same message once more with no
// thread and decides on that (heardNothing, namesLiveLead, rehear below; the call sits after the first hearing in preTurn). Both hearings
// are recorded on the row (meta.listener.request the second, .heard the first, .reheard true) and metered as one row. Never a third.
//
// P7 CUT 2a (CE-45 LCV-12; the chair's rulings of 23 September on the designs): THE DOOR LEARNS THE CALENDAR'S FIRST THREE ACTS, block_date,
// unblock_date and book_event, on availability.blockDate/unblockDate and eventWrite.writeEvent AS THEY STAND, every read-back from the row
// (B40 to B47, B54, B75, B76, his); NEEDS_CLIENT beside COVERED; the three measured slots (member, reason, kind) on the note; the route-search
// gate (F-44.128); the order leads, attaches, invoices, calendar, relay, money. A block, an unblock and a booking LAND AT ONCE.
const DL = require('./doorLines');
const PMA = require('./pendingMoneyActs');
const { resolveSpokenDate, todayIstIso } = require('./spokenDate');
const { longDateYear, istDay, rupees } = require('../witnessLine');
const { isDateKey } = require('./packageSchedule');

const HEAR_BEFORE_REPLY_MS = 4000;
const MONEY_ACTS = Object.freeze(['booking_confirmed', 'advance_paid', 'milestone_paid']);
const CALENDAR_ACTS = Object.freeze(['block_date', 'unblock_date', 'book_event', 'edit_event', 'cancel_event']); // P7 cut 2a; edit_event and cancel_event joined at 2b
// P7 cut 2b (CE-45 LCV-13): the two calendar acts that are ASKED before they write. Each must be the ONLY act of its message (one question at a time).
const CAL_QUESTION_ACTS = Object.freeze(['edit_event', 'cancel_event']);
// P7 cut 3 (CE-45 LCV-14): the team and the payment reminder. assign_crew names a member (and a shoot by its client or its day), never needs a client;
// payment_reminder names a client and is in NEEDS_CLIENT since 2a. Both LAND AT ONCE; neither ever touches money.
const TEAM_ACTS = Object.freeze(['assign_crew', 'payment_reminder']);
const COVERED = Object.freeze([...MONEY_ACTS, 'invoice', 'lead', 'attach_package', 'relay', ...CALENDAR_ACTS, ...TEAM_ACTS]);
// P7 cut 4 (CE-45 LCV-14): THE LOOKUPS the door answers on route 'search' (never jobs, so NOT in COVERED: a lookup writes nothing and asks nothing).
// They switch LEFTOVER examples 3, 7 and 8 on through the stand-in's pool. tally, history and find WITH a client stay B34 (exit 'lookup').
const LOOKUP_ACTS = Object.freeze(['find', 'whatsdue', 'date']);
// P7 (CE-45 LCV-12, cut 2a; the chair's ruling (g) of 22 September): THE ACTS THAT NAME A CLIENT. allCovered and namelessOf read this table and
// nothing else: a block, an unblock, an assignment and a lookup name no client, so askName never asks B35 for a day. b90 pins its members.
const NEEDS_CLIENT = Object.freeze(['lead', 'booking_confirmed', 'advance_paid', 'milestone_paid', 'invoice', 'attach_package', 'relay', 'book_event', 'edit_event', 'cancel_event', 'payment_reminder']); // `lead` names one too: B18 asks for it (the lead exception above the untouched return)
// THE ACT TABLE'S IMAGE: every hand the door can run, and nothing else. b90 pins that it never holds
// donna_client, donna_stage, donna_money or donna_money_edit (item 1, option (i)).
const HANDS = Object.freeze({
  booking_confirmed: 'donna_booking',
  advance_paid: 'donna_booking',
  milestone_paid: 'donna_milestone_paid',
  invoice: 'donna_invoice_pdf',
  lead: 'donna_lead',
  attach_package: 'attach_package',
  relay: 'donna_relay_stage', // P6b: the recorded call keeps the signal's own name, as `lead` keeps donna_lead
  block_date: 'donna_block_date', // P7 cut 2a: the §1.5 hands' own names (blockHands.js); the door calls blockDate/unblockDate beneath them
  unblock_date: 'donna_unblock_date',
  book_event: 'donna_book_event', // P7 cut 2a: the signal's own name; the door calls writeEvent as calendarSignals' bookEvents does
  edit_event: 'donna_edit_event', // P7 cut 2b: the signals' own names; the door calls writeEvent AS IT STANDS on her YES
  cancel_event: 'donna_cancel_event',
  assign_crew: 'assign_crew', // P7 cut 3: the door's own names (the kickoff's HANDS ruling), as attach_package is
  payment_reminder: 'payment_reminder_send',
});

// `say` is what an exit KNOWS beyond its reason (the name that is no lead, the name that is no client, the money act);
// the chain never reads it; standIn() does.
const CHAIN = (ear, why, say) => ({ door: false, ear: ear || null, why, ...(say ? { say } : {}) });
const key = (s) => String(s == null ? '' : s).trim().toLowerCase();
const digits = (n) => { const r = rupees(n); return r ? r.replace(/^Rs /, '') : null; };

function lazy(deps) {
  return {
    createLead: deps.createLead || ((...a) => require('./leads').createLead(...a)),
    attachPackage: deps.attachPackage || ((...a) => require('../../api/vendor/leadPackages').attachPackage(...a)),
    lifecycle: deps.lifecycle || require('./lifecycleHands'),
    listener: deps.listener || require('./listenerDoor'),
    generateInvoiceForBinder: deps.generateInvoiceForBinder || ((...a) => require('../../api/vendor/invoices').generateInvoiceForBinder(...a)),
    // P7 cut 2a: the calendar's hands AS THEY STAND, each a seam for the bench (production passes nothing)
    blockDate: deps.blockDate || ((...a) => require('./availability').blockDate(...a)),
    unblockDate: deps.unblockDate || ((...a) => require('./availability').unblockDate(...a)),
    writeEvent: deps.writeEvent || ((...a) => require('./eventWrite').writeEvent(...a)),
    calendarKinds: deps.calendarKinds || require('./eventWrite').CALENDAR_KINDS,
    // P7 cut 3: the reminder's hand AS IT STANDS (paymentReminders.js :315) and its window helpers, each a seam for the bench (production passes nothing)
    sendOneReminder: deps.sendOneReminder || ((...a) => require('./paymentReminders').sendOneReminder(...a)),
    reminders: deps.reminders || require('./paymentReminders'),
    // P7 cut 4: the lookups' three reads AS THEY STAND, each a seam for the bench (production passes nothing)
    readDaySpine: deps.readDaySpine || ((...a) => require('./daySheet').readDaySpine(...a)),
    dueThisWeek: deps.dueThisWeek || ((...a) => require('./dueWeek').dueThisWeek(...a)),
    // P7 cut 4 FIX: the door's own newest-first read and its head-count (leadFeed.js), and the ONE books reader AS IT STANDS (invoices.js readOutstanding)
    newestLeads: deps.newestLeads || ((...a) => require('./leadFeed').newestLeads(...a)),
    newLeadsCount: deps.newLeadsCount || ((...a) => require('./leadFeed').newLeadsCount(...a)),
    newestCap: deps.newestCap || require('./leadFeed').NEWEST_CAP,
    readOutstanding: deps.readOutstanding || ((...a) => require('./invoices').readOutstanding(...a)),
    outstandingStates: deps.outstandingStates || require('./invoices').OUTSTANDING_STATES,
    memory: deps.memory || null,
    meter: deps.meter || null,
    // P6b: the relay's organs, each a seam for the bench. The transport is the estate's ONE sender (src/lib/whatsapp.js sendWhatsApp),
    // resolved at call time (R-29.2: no transport required at import); the WhatsApp lane injects its own, which is the same symbol.
    sendWhatsApp: deps.sendWhatsApp || ((...a) => require('../whatsapp').sendWhatsApp(...a)),
    env: deps.env || process.env,
    draft: deps.draft || require('./draftSeat'),
    drafts: deps.drafts || require('./coupleDrafts'),
    relay: deps.relay || require('./relaySeat'),
    coupleDisplayName: deps.coupleDisplayName || ((...a) => require('./relayToCouple').coupleDisplayName(...a)),
  };
}

// ── the covered-act check (the pin, R-44.21 (a)) ──────────────────────────────────────────────────
function allCovered(request) {
  try {
    if (!request || typeof request !== 'object' || !Array.isArray(request.acts) || !request.acts.length) return false;
    // P6a-1, THE LEAD EXCEPTION, a branch ABOVE the untouched return: a `lead` act may name no one (the door
    // asks B18); every other act beside it still needs its client, exactly as the return below demands.
    if (request.acts.some((a) => a && a.act === 'lead')) {
      return request.acts.every((a) => a && COVERED.includes(a.act) && (a.act === 'lead' || !NEEDS_CLIENT.includes(a.act) || (typeof a.client_as_spoken === 'string' && !!a.client_as_spoken.trim())));
    }
    // P7 cut 2a: only an act in NEEDS_CLIENT must name one (a block, an unblock name a day, never a client)
    return request.acts.every((a) => a && COVERED.includes(a.act) && (!NEEDS_CLIENT.includes(a.act) || (typeof a.client_as_spoken === 'string' && !!a.client_as_spoken.trim())));
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
// F-44.96, THE SECOND HALF (CE-45 LCV-11, P6b first cut; the chair's ruling of 22 September): THE DOOR READS HER MESSAGE ITSELF for the
// phone, as it reads it for dates and names. Every phone-shaped run in her message, in order (PHONE_RE, the same shape the guard read).
// One run and no phone_as_spoken heard: that run IS the phone (b93 turn 5's record: "Phone" dropped and the number misfiled into
// amount_rupees, which a lead act never reads). Two runs and no slot: the door does not guess; the message reads B34 as it did.
const PHONE_RE_G = new RegExp(PHONE_RE.source, 'g');
function phoneRuns(text) {
  try { return typeof text === 'string' ? (text.match(PHONE_RE_G) || []).map((r) => r.trim()) : []; } catch (_e) { return []; }
}
// a spoken or read run folded to the stored shape: relayToCouple.asPhone (+91 on a bare ten); a national leading 0 is dropped first.
function foldPhone(run) {
  try {
    let d = String(run || '').replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
    return require('./relayToCouple').asPhone(d) || null;
  } catch (_e) { return null; }
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

// ── R-44.40 · "DID YOU MEAN": THE ONE HOME FOR THE NEAREST NAME (LCV-10, the third B-2 cut) ────────────────────────
// For every name lookup the door does, leads (the money acts and the attach) and packages; NEVER dates, never amounts. When the name
// she said matches no row of hers, ONE candidate is offered as a QUESTION, B36, and nothing is acted on until her YES. THE PINNED
// DISTANCE, over key()-folded strings: a Damerau distance of exactly 1 (one character inserted, deleted or replaced, or two adjacent
// characters swapped), or the SAME WORDS in another order; never across a whole different name (distance 2 and beyond is nothing).
// Two rows equally close is NONE; no row close is NONE; then today's line speaks unchanged (B4, B32, B23). The candidate comes from
// HER rows only. TOTAL: anything hostile is null.
function damerau1(a, b) {
  if (a === b) return false;
  const la = a.length; const lb = b.length;
  if (Math.abs(la - lb) > 1 || Math.max(la, lb) < 3) return false;
  if (la === lb) {
    const diff = []; for (let i = 0; i < la; i += 1) if (a[i] !== b[i]) diff.push(i);
    if (diff.length === 1) return true;
    return diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]];
  }
  const [s, l] = la < lb ? [a, b] : [b, a];
  let i = 0; while (i < s.length && s[i] === l[i]) i += 1;
  return s.slice(i) === l.slice(i + 1);
}
const wordsOf = (s) => key(s).split(/\s+/).filter(Boolean).sort().join(' ');
function nearestName(said, rows) {
  try {
    const k = key(said);
    if (!k || !Array.isArray(rows)) return null;
    const close = rows.filter((r) => r && typeof r === 'object' && typeof r.name === 'string' && key(r.name) !== k && (damerau1(k, key(r.name)) || (wordsOf(said) === wordsOf(r.name) && wordsOf(said).includes(' '))));
    return close.length === 1 ? close[0] : null;
  } catch (_e) { return null; }
}
// P7 cut 3: THE OFFER'S SLOT, THREE-WAY (the only in-place edit the offer needs): a package, a member, else the client. ONE table, read by offerFor
// and by the B36 re-ask alike. A slot that is not one of the three is 'client', as the two-way switch always read it.
const OFFER_SLOTS = Object.freeze({ package: 'package_as_spoken', member: 'member_as_spoken', client: 'client_as_spoken' });
const slotField = (slot) => OFFER_SLOTS[slot === 'package' || slot === 'member' ? slot : 'client'];
// the binder names of engine.records for the "Did you mean" home (the invoices cut): id and client, live rows only
async function bindersOf(supabase, agentId) {
  try {
    const { data, error } = await supabase.schema('engine').from('records').select('id, client').eq('agent_id', agentId).eq('hidden', false);
    return (error || !Array.isArray(data)) ? null : data.filter((b) => b && typeof b.client === 'string').map((b) => ({ id: b.id, name: b.client }));
  } catch (_e) { return null; }
}
async function leadsOf(supabase, vendorId) {
  try {
    const { data, error } = await supabase.from('leads').select('id, name').eq('vendor_id', vendorId).is('deleted_at', null);
    return (error || !Array.isArray(data)) ? null : data;
  } catch (_e) { return null; }
}
// ── R-45.3 · THE COLD SECOND HEARING'S THREE READS (CE-45 LCV-12, cut one). TOTAL: anything hostile is false / the first hearing. ──
// the ear returned a request holding no task and no lookup (route none, acts empty): the only shape that is re-heard
function heardNothing(ear) {
  try { return !!ear && !!ear.request && ear.request.route === 'none' && Array.isArray(ear.request.acts) && ear.request.acts.length === 0; } catch (_e) { return false; }
}
// her message under key() contains the name of one of her LIVE leads, never a name under three characters (a two-letter name is in
// too many sentences to mean anything). A failed read of her leads is NOT a name found: no second hearing then.
const REHEAR_MIN_NAME = 3;
async function namesLiveLead(supabase, vendorId, message) {
  try {
    const said = key(message);
    if (!said) return false;
    const rows = await leadsOf(supabase, vendorId);
    if (!Array.isArray(rows)) return false;
    return rows.some((r) => { const k = key(r && r.name); return k.length >= REHEAR_MIN_NAME && said.includes(k); });
  } catch (_e) { return false; }
}
// both hearings on one record: request is the SECOND (a second returning nothing keeps the first's, which was none), heard is the FIRST,
// reheard is true, usage is the sum of both calls' counted fields so the one usage row carries both; a second hearing's error is kept
// under rehear_error and the first's own error stays where it was.
function sumUsage(a, b) {
  try {
    const out = {};
    for (const u of [a, b]) if (u && typeof u === 'object') for (const k of Object.keys(u)) if (Number.isFinite(u[k])) out[k] = (out[k] || 0) + u[k];
    return Object.keys(out).length ? out : (a || b || null);
  } catch (_e) { return a || null; }
}
function rehear(first, second) {
  try {
    if (!first || typeof first !== 'object') return first;
    const s = second && typeof second === 'object' ? second : {};
    const took = !!s.request && !s.error;
    return { ...first, request: took ? s.request : first.request, usage: sumUsage(first.usage, s.usage), heard: first.request, reheard: true, ...(s.error ? { rehear_error: s.error } : {}) };
  } catch (_e) { return first; }
}

// ── F-44.112 · THE DOOR'S OWN NOTE OF A DATE IT ASKED FOR (LCV-10 Part B-1) ─────────────────────────
const DATE_ASKS = Object.freeze(['B6', 'B7', 'B21', 'B26', 'B28', 'B54']); // P7 cut 2a: B54 "Which day?" is a DATE note of the same kind (the design's 0.4)
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
// R-44.40: the "Did you mean" note. acts[0] carries the act with the CANDIDATE's own row name in the slot she misspelt; her YES runs it
// through the same plans (money still ends in B1 or B2 and is only STAGED); NO is B3; anything else lapses on another kind or re-asks once.
const OFFER_ASKS = Object.freeze(['B36']);
// P6b: THE FRAME'S NOTE. asked B37; acts[0] is the relay act; draft_id is the stored row the frame showed; the rest are acts of the
// same message that wait behind the question (a money act rides here and is planned afresh and STAGED after her answer; the note
// never writes money). YES sends the row by its id; NO refuses it; another act heard lapses the note (a new relay supersedes the
// row at stage time); nothing heard re-shows the frame ONCE, then B3 (the row itself lives its 24 hours).
const RELAY_ASKS = Object.freeze(['B37']);
// P7 cut 2b (CE-45 LCV-13; the kickoff's §2 and the chair's K4 ruling of 23 September): TWO NOTES OF THE CALENDAR'S OWN.
// CAL_ASKS: the move and cancel QUESTIONS. acts[0] is the edit_event or cancel_event with the LEAD ROW's name (and, for a move, the new day as she said it);
// event_id is the shoot's row; iso is the new day as the door read it. Her YES writes through writeEvent AS IT STANDS; NO is B3 (above); another act
// heard lapses the note (F-44.115); anything else re-asks ONCE, then B3.
const CAL_ASKS = Object.freeze(['B48', 'B50']);
// SHOOT_ASKS (K4, a catch): B53 is NOT a date note. On a move the act's date_as_spoken is the NEW day (ruling 3), and the date-note branch writes her
// answer INTO that slot; noteFor deletes it. So B53 keeps a note of its OWN kind: the candidate event_ids and the act UNTOUCHED; her answer is read by
// the door's own date read ONLY to pick the row among the candidates. Unreadable is B7 once, then B3; a readable day that picks no one row re-asks
// B53 once, then B3; another act heard lapses the note.
const SHOOT_ASKS = Object.freeze(['B53']);
// P7 cut 3 (CE-45 LCV-14; the chair's ruling of 23 September on ASK 1): THE MEMBER NOTE, its OWN list beside NAME_ASKS. acts[0] is the assign_crew act that
// named no member; her WHOLE TRIMMED MESSAGE is the member (as B35's answer is the client), and it fills member_as_spoken and NEVER client_as_spoken.
// Another kind of act heard lapses the note (F-44.115); a closed YES re-asks once, then B3. The rest of the message's acts ride behind it.
const MEMBER_ASKS = Object.freeze(['B62']);
const ASKS = Object.freeze([...DATE_ASKS, ...NAME_ASKS, ...PKG_ASKS, ...OFFER_ASKS, ...RELAY_ASKS, ...CAL_ASKS, ...SHOOT_ASKS, ...MEMBER_ASKS]);
const namelessOf = (acts) => (Array.isArray(acts) ? acts : []).filter((a) => a && typeof a === 'object' && a.act !== 'lead' && NEEDS_CLIENT.includes(a.act) && !spokenText(a.client_as_spoken)); // P7 cut 2a: NEEDS_CLIENT decides
const namelessLead = (acts) => (Array.isArray(acts) ? acts : []).some((a) => a && typeof a === 'object' && a.act === 'lead' && !spokenText(a.client_as_spoken));
const allKindsCovered = (acts) => Array.isArray(acts) && acts.length > 0 && acts.length <= 4 && acts.every((a) => a && typeof a === 'object' && COVERED.includes(a.act));
const NOTE_SLOTS = Object.freeze(['act', 'client_as_spoken', 'package_as_spoken', 'date_as_spoken', 'milestone', 'phone_as_spoken', 'member_as_spoken', 'reason_as_spoken', 'kind_as_spoken']); // P7 cut 2a: the three measured slots ride a note
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
// F-44.123 (CE-45 LCV-11, the fix cut): HER ORIGINAL MESSAGE rides a name or offer note that holds a relay, so that when her answer ("Sarah",
// "Yes") runs the job the composer is handed the message that ASKED for the relay, never the answer. A string, trimmed, at most 2000
// characters; anything else is absent. The note stays valid without it (an older note), and the composer then falls back as before.
const SAID_MAX = 2000;
function saidOf(v) { return typeof v === 'string' && v.trim() && v.length <= SAID_MAX ? v.trim() : null; }
const holdsRelay = (acts) => Array.isArray(acts) && acts.some((a) => a && a.act === 'relay');
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
    else if (OFFER_ASKS.includes(n.asked)) { if (!allKindsCovered(acts) || typeof n.candidate_id !== 'string' || !n.candidate_id || namelessOf(acts).length || namelessLead(acts)) return null; }
    else if (MEMBER_ASKS.includes(n.asked)) { if (!allKindsCovered(acts) || acts[0].act !== 'assign_crew' || spokenText(acts[0].member_as_spoken)) return null; }
    else if (RELAY_ASKS.includes(n.asked)) { if (!allKindsCovered(acts) || acts[0].act !== 'relay' || typeof n.draft_id !== 'string' || !n.draft_id) return null; }
    // P7 cut 2b: a CAL note is ONE move or cancel naming its client (a move its new day too) on ONE shoot row; a SHOOT note is the same act on two or more rows
    else if (CAL_ASKS.includes(n.asked) || SHOOT_ASKS.includes(n.asked)) {
      if (acts.length !== 1 || !CAL_QUESTION_ACTS.includes(acts[0].act) || !spokenText(acts[0].client_as_spoken)) return null;
      if (n.asked === 'B48' && acts[0].act !== 'edit_event') return null;
      if (n.asked === 'B50' && acts[0].act !== 'cancel_event') return null;
      if (acts[0].act === 'edit_event' && !spokenText(acts[0].date_as_spoken)) return null;
      if (CAL_ASKS.includes(n.asked) && (typeof n.event_id !== 'string' || !n.event_id)) return null;
      if (SHOOT_ASKS.includes(n.asked) && (!Array.isArray(n.event_ids) || n.event_ids.length < 2 || n.event_ids.length > 20 || !n.event_ids.every((x) => typeof x === 'string' && x))) return null;
    }
    else if (!allCovered({ route: 'task', acts })) return null;
    const tries = Number.isInteger(n.tries) && n.tries >= 0 ? n.tries : 0;
    return { asked: n.asked, acts, tries, direction: directionOf(acts[0].act), lead_id: typeof n.lead_id === 'string' ? n.lead_id : null, package_id: typeof n.package_id === 'string' ? n.package_id : null, ...(typeof n.candidate_id === 'string' ? { candidate_id: n.candidate_id } : {}), ...(OFFER_ASKS.includes(n.asked) && Object.prototype.hasOwnProperty.call(OFFER_SLOTS, n.slot) ? { slot: n.slot } : {}), ...(typeof n.draft_id === 'string' ? { draft_id: n.draft_id } : {}), ...(saidOf(n.said) ? { said: saidOf(n.said) } : {}), ...((CAL_ASKS.includes(n.asked) || SHOOT_ASKS.includes(n.asked)) ? calNoteFields(n) : {}) };
  } catch (_e) { return null; }
}

// P7 cut 2b: the calendar notes' own fields, strings only: the one shoot (CAL), the candidates (SHOOT), the new day as the door read it (a move).
function calNoteFields(n) {
  try {
    const out = {};
    if (typeof n.event_id === 'string' && n.event_id) out.event_id = n.event_id;
    if (Array.isArray(n.event_ids)) out.event_ids = n.event_ids.filter((x) => typeof x === 'string' && x);
    if (typeof n.iso === 'string' && LEAD_ISO.test(n.iso)) out.iso = n.iso;
    return out;
  } catch (_e) { return {}; }
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

// ── P6b · a message to a client: resolved read-only to a PLAN ────────────────────────────────────────
// { speak, key } for B8 or the seat's own no-number byte; { noLead, name } when no lead of hers carries the name (the caller
// offers B36 or speaks B38); { relay: { leadId, client, phone } } to be composed and staged; or null (a failed read, anything
// thrown). The phone is the LEAD ROW's own byte (public.leads.phone), never lifted from her words. TOTAL: never throws.
async function planRelay(supabase, vendor, act, L) {
  try {
    const name = spokenText(act && act.client_as_spoken);
    if (!name) return null; // a nameless relay is B35's, asked before any plan (askName)
    const found = await L.lifecycle.resolveLead(supabase, vendor.id, name, false);
    if (!found || !found.ok) {
      if (found && found.reason === 'not_found') return { noLead: true, name };
      if (found && found.reason === 'ambiguous') {
        const rows = await leadsNamed(supabase, vendor.id, name, false);
        const line = sameName(name, rows, (r) => r.wedding_date);
        return line ? { speak: line, key: 'B8', skipHarvest: true } : null;
      }
      return null;
    }
    const { data: lead, error } = await supabase.from('leads').select('id, name, phone').eq('id', found.lead.id).eq('vendor_id', vendor.id).maybeSingle();
    if (error || !lead) return null;
    const client = String(lead.name || '').trim();
    const phone = typeof lead.phone === 'string' && lead.phone.trim() ? lead.phone.trim() : null;
    // a lead with no number: the seat's own ⑧a (relaySeat.js noNumberLine, vetoed 2026-08-11), nothing staged
    if (!phone) { const line = L.relay.noNumberLine(client); return typeof line === 'string' && line ? { speak: line, key: 'RELAY_NO_NUMBER', skipHarvest: true } : null; }
    return { relay: { leadId: lead.id, client, phone } };
  } catch (_e) { return null; }
}

// ── P7 CUT 2a · THE CALENDAR: block, unblock, book (CE-45 LCV-12; the chair's rulings on the designs of 23 September) ───────────────────────
// Every plan is resolved READ-ONLY to { speak, key } | { block | unblock | book } | { noLead, name } | null, and written only after every act has
// resolved; every read-back comes from the ROW the writer returned; the hands are availability.blockDate/unblockDate and eventWrite.writeEvent AS
// THEY STAND. A block, an unblock and a booking LAND AT ONCE (ruling (c)). client_as_spoken on a block is IGNORED, as a relay ignores its date.
// THE DATE (the design's 0.4): resolveSpokenDate direction 'future'; none said → B54 "Which day? Say it like 5 December." (a DATE note; her next
// message is the day); unreadable, or an absurd year → B7 (his byte; no calendar twin of B21 is minted). THE KIND (ruling 2): kind_as_spoken folded
// by key() when it is one of eventWrite's CALENDAR_KINDS, else 'shoot'. TOTAL: never throws.
function calendarDate(act, nowMs) {
  const said = spokenText(act && act.date_as_spoken);
  if (!said) return { speak: DL.LINES.B54, key: 'B54', skipHarvest: true };
  const d = resolveSpokenDate(said, { direction: 'future', nowMs });
  if (!d.ok || !LEAD_ISO.test(typeof d.iso === 'string' ? d.iso : '')) return { speak: DL.LINES.B7, key: 'B7' };
  return { iso: d.iso };
}
function calendarKind(act, L) {
  const k = key(act && act.kind_as_spoken);
  return k && Array.isArray(L.calendarKinds) && L.calendarKinds.includes(k) ? k : 'shoot';
}
function planBlock(act, nowMs) {
  try {
    if (!act || typeof act !== 'object') return null;
    const d = calendarDate(act, nowMs);
    if (d.speak) return d;
    return { block: { iso: d.iso, reason: spokenText(act.reason_as_spoken) } };
  } catch (_e) { return null; }
}
function planUnblock(act, nowMs) {
  try {
    if (!act || typeof act !== 'object') return null;
    const d = calendarDate(act, nowMs);
    if (d.speak) return d;
    return { unblock: { iso: d.iso } };
  } catch (_e) { return null; }
}
// a booking: the client by the ONE home (resolveLead exact; the caller offers B36 or speaks B76 on noLead); then the day; then the kind
async function planBook(supabase, vendor, act, nowMs, L) {
  try {
    if (!act || typeof act !== 'object') return null;
    const name = spokenText(act.client_as_spoken);
    if (!name) return null; // a nameless booking is B35's, asked before any plan (askName)
    const found = await L.lifecycle.resolveLead(supabase, vendor.id, name, false);
    if (!found || !found.ok) {
      if (found && found.reason === 'not_found') return { noLead: true, name };
      if (found && found.reason === 'ambiguous') {
        const rows = await leadsNamed(supabase, vendor.id, name, false);
        const line = sameName(name, rows, (r) => r.wedding_date);
        return line ? { speak: line, key: 'B8', skipHarvest: true } : null;
      }
      return null;
    }
    const d = calendarDate(act, nowMs);
    if (d.speak) return d;
    return { book: { leadId: found.lead.id, client: String(found.lead.name || '').trim(), iso: d.iso, kind: calendarKind(act, L) } };
  } catch (_e) { return null; }
}
// THE WRITES. Each returns { line, key, call, landed }. The read-back is the ROW's; a refusal speaks the writer's own sentence where it has one
// (B42's rule: the writer's sentence verbatim, else his :157 line); a throw speaks his line and is recorded refused:exception.
async function fileBlock(supabase, vendor, plan, L) {
  const b = plan.block; const input = { date: b.iso, ...(b.reason ? { reason: b.reason } : {}) };
  const day = longDateYear(b.iso);
  const his = (result) => ({ line: DL.render('B42', { date: day }), key: 'B42', call: { name: HANDS.block_date, input, result }, landed: false });
  try {
    const r = await L.blockDate(supabase, vendor.id, b.iso, b.reason || null);
    if (r && r.ok === true && r.block && typeof r.block === 'object') {
      const line = DL.blockedLine(longDateYear(r.block.blocked_date), r.block.reason);
      return { line, key: line ? 'B40' : null, call: { name: HANDS.block_date, input, result: 'blocked' }, landed: true };
    }
    if (r && r.code === 'ALREADY_BLOCKED' && r.error === 'Already blocked.') return { line: DL.render('B41', { date: day }), key: 'B41', call: { name: HANDS.block_date, input, result: 'refused:already_blocked' }, landed: false };
    if (r && typeof r.error === 'string' && r.error.trim()) return { line: r.error.trim(), key: 'B42', call: { name: HANDS.block_date, input, result: `refused:${r.code || 'write_failed'}` }, landed: false };
    return his('refused:write_failed');
  } catch (_e) { return his('refused:exception'); }
}
async function fileUnblock(supabase, vendor, plan, L) {
  const u = plan.unblock; const input = { date: u.iso }; const day = longDateYear(u.iso);
  const his = (result) => ({ line: DL.render('B45', { date: day }), key: 'B45', call: { name: HANDS.unblock_date, input, result }, landed: false });
  try {
    const r = await L.unblockDate(supabase, vendor.id, { date: u.iso });
    if (r && r.ok === true) return { line: DL.render('B43', { date: day }), key: 'B43', call: { name: HANDS.unblock_date, input, result: 'unblocked' }, landed: true };
    // F-44.65, F-44.72 close here: "wasn't blocked" is spoken ONLY on the writer's exact 'Block not found.'
    if (r && r.error === 'Block not found.') return { line: DL.render('B44', { date: day }), key: 'B44', call: { name: HANDS.unblock_date, input, result: 'not_blocked' }, landed: false };
    return his('refused:write_failed');
  } catch (_e) { return his('refused:exception'); }
}
// B46 from the returned events row; a kind other than shoot is DERIVED by placing the row's own kind word where the template says "shoot"
// (disclosed in the handover as B40's no-reason form is; a re-word of nothing she reads, the row's word placed). B47 = conflict.message verbatim.
function bookedLine(row) {
  const client = spotless(row && row.title); const date = longDateYear(row && row.event_date); const kind = spotless(row && row.kind);
  const line = DL.render('B46', { client, date });
  if (!line) return null;
  return kind && kind !== 'shoot' ? line.replace(' · shoot · ', ` · ${kind} · `) : line;
}
const spotless = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
async function fileBook(supabase, vendor, agentId, lane, plan, L) {
  const b = plan.book; const input = { lead: b.client, date: b.iso, kind: b.kind };
  const his = (result) => ({ line: DL.LINES.B75, key: 'B75', call: { name: HANDS.book_event, input, result }, landed: false });
  try {
    const r = await L.writeEvent(supabase, { vendorId: vendor.id, agentId, surface: lane === 'pwa' ? 'pwa' : 'whatsapp', source: 'victor', title: b.client, event_date: b.iso, kind: b.kind, linked_lead_id: b.leadId, state: 'upcoming' });
    if (r && r.ok === true && r.event && typeof r.event === 'object') {
      const line = bookedLine(r.event);
      return { line, key: line ? 'B46' : null, call: { name: HANDS.book_event, input, result: r.deduped === true ? 'unchanged' : 'booked' }, landed: r.deduped !== true };
    }
    if (r && r.conflict && typeof r.conflict.message === 'string' && r.conflict.message.trim()) return { line: r.conflict.message.trim(), key: 'B47', call: { name: HANDS.book_event, input, result: `refused:${r.conflict.kind || 'conflict'}` }, landed: false };
    if (r && typeof r.error === 'string' && r.error.trim()) return { line: r.error.trim(), key: 'B75', call: { name: HANDS.book_event, input, result: 'refused:write_failed' }, landed: false };
    return his('refused:write_failed');
  } catch (_e) { return his('refused:exception'); }
}

// ── P7 CUT 2b · MOVE AND CANCEL A SHOOT (CE-45 LCV-13; the kickoff's §2 as ruled, K4, K5, K8) ─────────────────────────────────────────────
// THE SHOOT RESOLVER, ONE READ: events where vendor_id, deleted_at null, state 'upcoming', kind 'shoot', and either linked_lead_id = the lead's id or
// key(title) === key(the lead's name); oldest day first. A failed read is null (C-44.4: an empty answer and a broken answer differ).
const SHOOT_SELECT = 'id, title, event_date, kind, state, linked_lead_id, assigned_member_ids';
async function shootsOf(supabase, vendorId, lead) {
  try {
    const { data, error } = await supabase.from('events').select(SHOOT_SELECT).eq('vendor_id', vendorId).is('deleted_at', null).eq('state', 'upcoming').eq('kind', 'shoot');
    if (error || !Array.isArray(data)) return null;
    const name = key(lead && lead.name);
    return data.filter((e) => e && typeof e.id === 'string' && (e.linked_lead_id === lead.id || (!!name && key(e.title) === name)) && isDateKey(e.event_date))
      .sort((a, b) => (a.event_date < b.event_date ? -1 : a.event_date > b.event_date ? 1 : 0));
  } catch (_e) { return null; }
}
// the shoot rows by id, live only (a SHOOT note's candidates re-read on her answer; a row cancelled or deleted since drops out)
async function shootsById(supabase, vendorId, ids) {
  try {
    if (!Array.isArray(ids) || !ids.length) return [];
    const { data, error } = await supabase.from('events').select(SHOOT_SELECT).eq('vendor_id', vendorId).in('id', ids).is('deleted_at', null).eq('state', 'upcoming').eq('kind', 'shoot');
    if (error || !Array.isArray(data)) return null;
    return data.filter((e) => e && isDateKey(e.event_date)).sort((a, b) => (a.event_date < b.event_date ? -1 : a.event_date > b.event_date ? 1 : 0));
  } catch (_e) { return null; }
}
// the question for ONE shoot: B48 (a move, the new day) or B50 (a cancel, the ROW's day), with its CAL note. The act keeps the LEAD ROW's name.
function calQuestion(act, client, row, iso) {
  if (act.act === 'edit_event') {
    const line = DL.render('B48', { client, date: longDateYear(iso) });
    return line ? { ask: { line, key: 'B48', note: { asked: 'B48', acts: [{ ...noteAct(act), client_as_spoken: client }], tries: 0, event_id: String(row.id), iso } } } : null;
  }
  const line = DL.render('B50', { client, date: longDateYear(row.event_date) });
  return line ? { ask: { line, key: 'B50', note: { asked: 'B50', acts: [{ ...noteAct(act), client_as_spoken: client }], tries: 0, event_id: String(row.id), iso: row.event_date } } } : null;
}
// B53 for two or more rows, with its SHOOT note: the candidates' ids, the act untouched (a move's NEW day stays in date_as_spoken, never overwritten)
function shootsQuestion(act, client, rows, tries) {
  const line = DL.shootsLine(client, rows.map((r) => longDateYear(r.event_date)));
  return line ? { ask: { line, key: 'B53', note: { asked: 'B53', acts: [{ ...noteAct(act), client_as_spoken: client }], tries: tries || 0, event_ids: rows.map((r) => String(r.id)) } } } : null;
}
// A move or a cancel, resolved READ-ONLY to { speak, key } (B8, B52, B54, B7) | { noLead, name } | { ask } (B48, B50, B53) | null. ORDER: the lead by the
// ONE home, then (a move) the NEW day from the ONE date slot (ruling 3: the old day is never read from the ear; a two-dates return is unreadable to the
// door's own read and is B7), then the shoot. A cancel's said day NARROWS the resolver (unreadable is B7). TOTAL: never throws.
async function planCal(supabase, vendor, act, nowMs, L) {
  try {
    if (!act || typeof act !== 'object' || !CAL_QUESTION_ACTS.includes(act.act)) return null;
    const name = spokenText(act.client_as_spoken);
    if (!name) return null; // a nameless move or cancel is B35's, asked before any plan (askName)
    const found = await L.lifecycle.resolveLead(supabase, vendor.id, name, false);
    if (!found || !found.ok) {
      if (found && found.reason === 'not_found') return { noLead: true, name };
      if (found && found.reason === 'ambiguous') {
        const rows = await leadsNamed(supabase, vendor.id, name, false);
        const line = sameName(name, rows, (r) => r.wedding_date);
        return line ? { speak: line, key: 'B8', skipHarvest: true } : null;
      }
      return null;
    }
    const lead = found.lead; const client = String(lead.name || '').trim();
    if (!client) return null;
    let iso = null; let narrow = null;
    if (act.act === 'edit_event') { const d = calendarDate(act, nowMs); if (d.speak) return d; iso = d.iso; }
    else if (spokenText(act.date_as_spoken)) { const d = calendarDate(act, nowMs); if (d.speak) return d; narrow = d.iso; }
    let rows = await shootsOf(supabase, vendor.id, lead);
    if (!rows) return null;
    if (narrow) rows = rows.filter((r) => r.event_date === narrow);
    if (!rows.length) { const line = DL.render('B52', { client }); return line ? { speak: line, key: 'B52' } : null; }
    if (rows.length > 1) return shootsQuestion({ ...act, client_as_spoken: client }, client, rows, 0);
    return calQuestion({ ...act, client_as_spoken: client }, client, rows[0], iso);
  } catch (_e) { return null; }
}
// HER YES to B48 or B50: writeEvent AS IT STANDS, surface by lane and source 'victor' exactly as fileBook passes them (K8). The read-back is the ROW's.
// { conflict } → B47, the checker's own sentence VERBATIM, nothing moved; an error sentence or a throw → B75. Returns { line, key, call, landed }.
async function fileCal(supabase, vendor, lane, note, nowMs, L) {
  const act = note.acts[0]; const move = act.act === 'edit_event';
  const hand = move ? HANDS.edit_event : HANDS.cancel_event;
  let input = { event_id: note.event_id };
  const his = (result) => ({ line: DL.LINES.B75, key: 'B75', call: { name: hand, input, result }, landed: false });
  try {
    let iso = typeof note.iso === 'string' && LEAD_ISO.test(note.iso) ? note.iso : null;
    if (move && !iso) { const d = calendarDate(act, nowMs); if (d.speak) return his('refused:unreadable'); iso = d.iso; }
    input = move ? { event_id: note.event_id, date: iso } : { event_id: note.event_id, state: 'cancelled' };
    const params = { vendorId: vendor.id, surface: lane === 'pwa' ? 'pwa' : 'whatsapp', source: 'victor', event_id: note.event_id, ...(move ? { event_date: iso } : { state: 'cancelled' }) };
    const r = await L.writeEvent(supabase, params);
    if (r && r.ok === true && r.event && typeof r.event === 'object') {
      const line = DL.render(move ? 'B49' : 'B51', { client: spotless(r.event.title), date: longDateYear(r.event.event_date) });
      return { line, key: line ? (move ? 'B49' : 'B51') : null, call: { name: hand, input, result: move ? 'moved' : 'cancelled' }, landed: true };
    }
    if (r && r.conflict && typeof r.conflict.message === 'string' && r.conflict.message.trim()) return { line: r.conflict.message.trim(), key: 'B47', call: { name: hand, input, result: `refused:${r.conflict.kind || 'conflict'}` }, landed: false };
    return his('refused:write_failed');
  } catch (_e) { return his('refused:exception'); }
}

// ── P7 CUT 3 · THE TEAM AND THE PAYMENT REMINDER (CE-45 LCV-14; LCV-12's designs §3.1 to §3.4 as ruled by the chair; ASKS 1 to 5) ───────────────
// THE TEAM, ONE READ: team_members where vendor_id, active true, deleted_at null (studio/team.js GET :42 to :50, the same predicate). A failed read is
// null (C-44.4). The door's own insert (no lib function exists) takes studio/team.js POST's row shape (:124 to :131) with the name she said.
const TEAM_SELECT = 'id, name, role, phone, created_at';
async function membersOf(supabase, vendorId) {
  try {
    const { data, error } = await supabase.from('team_members').select(TEAM_SELECT).eq('vendor_id', vendorId).eq('active', true).is('deleted_at', null);
    return (error || !Array.isArray(data)) ? null : data.filter((m) => m && typeof m.id === 'string' && typeof m.name === 'string' && m.name.trim());
  } catch (_e) { return null; }
}
// B61's {role}: the row's role; with none, the phone's last four; else the day the row was added, full month (the designs file §3.3)
function memberWord(m) {
  const role = spotless(m && m.role);
  if (role) return role;
  const d = String((m && m.phone) || '').replace(/\D/g, '');
  if (d.length >= 4) return d.slice(-4);
  return longDateYear(istDay(m && m.created_at));
}
// the shoots on ONE day, by the day alone (an assignment naming no client): events kind shoot, upcoming, live
async function shootsOnDay(supabase, vendorId, iso) {
  try {
    const { data, error } = await supabase.from('events').select(SHOOT_SELECT).eq('vendor_id', vendorId).is('deleted_at', null).eq('state', 'upcoming').eq('kind', 'shoot').eq('event_date', iso);
    return (error || !Array.isArray(data)) ? null : data.filter((e) => e && typeof e.id === 'string' && e.event_date === iso);
  } catch (_e) { return null; }
}
// F-44.133 (CE-45 LCV-14, the cut 3 fix; the chair's ruling (i) of 23 September): THE DOOR READS THE CLIENT OUT OF THE KIND. WITNESSED on the cut 3 walk
// (10:34:00, 10:34:12, 10:34:30, the 10:35:08 note, 10:35:21 UTC): "Assign {member} to the {client} shoot" came back with kind_as_spoken "Walk Seventeen Alpha
// shoot" and NO client_as_spoken, so the door read a team add. On an assign_crew with no client_as_spoken, a kind_as_spoken that is NOT one of eventWrite's
// CALENDAR_KINDS, minus ONE trailing calendar kind word, is read as the client and resolved through the ONE home like any client (lead exact, B36, B76).
// "shoot" alone is the kind and is never a client. The heard request is recorded untouched. No listener byte. TOTAL: anything else is null.
function kindClient(act, L) {
  try {
    const k = spotless(act && act.kind_as_spoken);
    const kinds = Array.isArray(L && L.calendarKinds) ? L.calendarKinds : [];
    if (!k || kinds.includes(key(k))) return null;
    const words = k.split(/\s+/).filter(Boolean);
    if (words.length > 1 && kinds.includes(key(words[words.length - 1]))) words.pop();
    return spotless(words.join(' '));
  } catch (_e) { return null; }
}
// An assignment, resolved READ-ONLY. THREE SHAPES (the kickoff's cut-3 paragraph): no member → B62, ASKED with a MEMBER note; a member with no date and no
// client → a TEAM ADD (exact B57 · near B36 slot 'member' · else { add }); a member with a date and/or a client → an ASSIGNMENT: the shoot first (by the client's
// lead through the ONE home and shootsOf, a said day narrowing it; by the day alone when no client: none B77, two or more 'assign_many'), then the member
// (exact one; two or more B61; near B36; absent → ADD THEN ASSIGN on two lines, the founder's own example); already on the shoot B59. A client_as_spoken
// equal under key() to the member is DROPPED (ruling 4: the ear put one name in both slots, row 11 C1). Returns { speak, key } | { ask } | { noLead, name } |
// { offer: { slot, said, rows } } | { add } | { assign } | { many: true } | null. An absent member with `offers` true returns { offer }: the caller asks offerFor, the
// ONE home (nearestName is called from there and nowhere else, b99 5.3), and with no candidate the plan REBUILT with offers false ADDS the name. `offers`
// false (a turn that began with a live money row, or answers a note other than B62, as every offer is gated): absent is ADDED. TOTAL: never throws.
async function planAssign(supabase, vendor, act, nowMs, L, offers) {
  try {
    if (!act || typeof act !== 'object' || act.act !== 'assign_crew') return null;
    const member = spotless(act.member_as_spoken);
    if (!member) return { ask: { line: DL.LINES.B62, key: 'B62' } };
    const said = spotless(act.client_as_spoken) || kindClient(act, L); // F-44.133: the ear's client inside the kind, read by the door
    const client = said && key(said) !== key(member) ? said : null;
    const dated = spotless(act.date_as_spoken);
    const rows = await membersOf(supabase, vendor.id);
    if (!rows) return null;
    const exact = rows.filter((m) => key(m.name) === key(member));
    if (!client && !dated) {
      if (exact.length) { const line = DL.render('B57', { member: String(exact[0].name).trim() }); return line ? { speak: line, key: 'B57' } : null; }
      if (offers === true) return { offer: { slot: 'member', said: member, rows } };
      return { add: { name: member } };
    }
    let iso = null;
    if (dated) { const d = calendarDate(act, nowMs); if (d.speak) return d; iso = d.iso; }
    let shoots; let lead = null;
    if (client) {
      const found = await L.lifecycle.resolveLead(supabase, vendor.id, client, false);
      if (!found || !found.ok) {
        if (found && found.reason === 'not_found') return { noLead: true, name: client };
        if (found && found.reason === 'ambiguous') {
          const same = await leadsNamed(supabase, vendor.id, client, false);
          const line = sameName(client, same, (r) => r.wedding_date);
          return line ? { speak: line, key: 'B8', skipHarvest: true } : null;
        }
        return null;
      }
      lead = found.lead;
      shoots = await shootsOf(supabase, vendor.id, lead);
      if (!shoots) return null;
      if (iso) shoots = shoots.filter((r) => r.event_date === iso);
      const name = String(lead.name || '').trim();
      if (!shoots.length) { const line = DL.render('B52', { client: name }); return line ? { speak: line, key: 'B52' } : null; }
      if (shoots.length > 1) { const line = DL.shootsLine(name, shoots.map((r) => longDateYear(r.event_date))); return line ? { speak: line, key: 'B53' } : null; }
    } else {
      shoots = await shootsOnDay(supabase, vendor.id, iso);
      if (!shoots) return null;
      if (!shoots.length) { const line = DL.render('B77', { date: longDateYear(iso) }); return line ? { speak: line, key: 'B77' } : null; }
      if (shoots.length > 1) return { many: true };
    }
    const shoot = shoots[0];
    if (exact.length > 1) { const line = DL.membersLine(member, exact.map((m) => ({ name: m.name, role: memberWord(m) }))); return line ? { speak: line, key: 'B61', skipHarvest: true } : null; }
    if (!exact.length) {
      if (offers === true) return { offer: { slot: 'member', said: member, rows } };
      return { assign: { event: shoot, member: null, addName: member } };
    }
    const m = exact[0];
    const crew = Array.isArray(shoot.assigned_member_ids) ? shoot.assigned_member_ids.map(String) : [];
    if (crew.includes(String(m.id))) { const line = DL.render('B59', { member: String(m.name).trim(), client: spotless(shoot.title) }); return line ? { speak: line, key: 'B59' } : null; }
    return { assign: { event: shoot, member: { id: String(m.id), name: String(m.name).trim() }, addName: null } };
  } catch (_e) { return null; }
}
// the door's own team insert (studio/team.js POST's row shape); the ROW's name is what she reads. { row } | { error }. TOTAL.
async function insertMember(supabase, vendorId, name) {
  try {
    const { data, error } = await supabase.from('team_members')
      .insert({ vendor_id: vendorId, name: String(name).trim(), role: null, phone: null, daily_rate_inr: null, notes: null })
      .select('id, name').single();
    if (error || !data || typeof data.id !== 'string' || !spotless(data.name)) return { error: (error && error.message) || 'no row' };
    return { row: data };
  } catch (e) { return { error: (e && e.message) || 'exception' }; }
}
// THE WRITES for a team act. Each returns { lines: [{ line, key }], calls, landed }. A team add reads B56 from the ROW; an assignment writes the crew through
// writeEvent AS IT STANDS (its own validation, the crew_confirmations upsert, the notes trail), surface by lane and source 'victor', and reads B58 from the
// RETURNED events row and the member row; add-then-assign is B56 then B58, two lines. A refusal speaks the writer's own sentence verbatim; anything
// else, or a throw, is the glitch line (GLITCH), recorded refused:exception or refused:write_failed.
async function fileAssign(supabase, vendor, lane, plan, L) {
  const out = { lines: [], calls: [], landed: false };
  const glitch = () => ({ line: glitchLine() || DL.LINES.B3, key: 'GLITCH' });
  try {
    let member = plan.assign ? plan.assign.member : null;
    const addName = plan.add ? plan.add.name : plan.assign ? plan.assign.addName : null;
    if (addName) {
      const got = await insertMember(supabase, vendor.id, addName);
      if (!got.row) { out.lines.push(glitch()); out.calls.push({ name: HANDS.assign_crew, input: { member: addName }, result: 'refused:write_failed' }); return out; }
      const name = String(got.row.name).trim();
      out.lines.push({ line: DL.render('B56', { member: name }), key: 'B56' });
      out.calls.push({ name: HANDS.assign_crew, input: { member: name }, result: 'member_added' });
      out.landed = true;
      member = { id: String(got.row.id), name };
    }
    if (!plan.assign) return out;
    const ev = plan.assign.event;
    const crew = Array.isArray(ev.assigned_member_ids) ? ev.assigned_member_ids.map(String) : [];
    const input = { member: member.name, event_id: String(ev.id) };
    const r = await L.writeEvent(supabase, { vendorId: vendor.id, surface: lane === 'pwa' ? 'pwa' : 'whatsapp', source: 'victor', event_id: String(ev.id), assigned_member_ids: [...crew, member.id] });
    if (r && r.ok === true && r.event && typeof r.event === 'object') {
      const line = DL.render('B58', { member: member.name, client: spotless(r.event.title), date: longDateYear(r.event.event_date) });
      out.lines.push(line ? { line, key: 'B58' } : glitch());
      out.calls.push({ name: HANDS.assign_crew, input, result: 'assigned' }); out.landed = true;
      return out;
    }
    const sentence = r && r.conflict && typeof r.conflict.message === 'string' && r.conflict.message.trim() ? r.conflict.message.trim() : (r && typeof r.error === 'string' && r.error.trim() ? r.error.trim() : null);
    out.lines.push(sentence ? { line: sentence, key: 'ASSIGN_REFUSED' } : glitch());
    out.calls.push({ name: HANDS.assign_crew, input, result: 'refused:write_failed' });
    return out;
  } catch (_e) {
    out.lines.push(glitch()); out.calls.push({ name: HANDS.assign_crew, input: { member: (plan && plan.add && plan.add.name) || null }, result: 'refused:exception' });
    return out;
  }
}
// A payment reminder, resolved READ-ONLY (the designs file §3.4; the kickoff: planReminder's OWN invoice read). The client by the ONE home (not found →
// B36's offer or B76 through 'book_no_lead', his one line for book, move, cancel and remind; two of a name → B8); her lead's LIVE invoices (vendor_id,
// lead_id, deleted_at null, state not cancelled: id, client_name, client_phone, client_id, what sendOneReminder reads); their PENDING payment_schedules
// with a due date, in the room's own select (reminders.js :168); THE PICK: the first due inside the room's window (istDayISO(0) through
// istDayISO(WINDOW_DAYS), reminders.js :112 to :113), else the earliest pending; none → B68. → { remind: { milestone, invoice, client } } | { speak, key } |
// { noLead, name } | null. TOTAL: never throws.
const MILESTONE_SELECT = 'id, invoice_id, vendor_id, milestone_label, amount_due, due_date, state';
async function planReminder(supabase, vendor, act, L) {
  try {
    if (!act || typeof act !== 'object' || act.act !== 'payment_reminder') return null;
    const name = spokenText(act.client_as_spoken);
    if (!name) return null; // a nameless reminder is B35's, asked before any plan (askName)
    const found = await L.lifecycle.resolveLead(supabase, vendor.id, name, false);
    if (!found || !found.ok) {
      if (found && found.reason === 'not_found') return { noLead: true, name };
      if (found && found.reason === 'ambiguous') {
        const rows = await leadsNamed(supabase, vendor.id, name, false);
        const line = sameName(name, rows, (r) => r.wedding_date);
        return line ? { speak: line, key: 'B8', skipHarvest: true } : null;
      }
      return null;
    }
    const client = String(found.lead.name || '').trim();
    if (!client) return null;
    const { data: invs, error } = await supabase.from('invoices').select('id, client_name, client_phone, client_id, state')
      .eq('vendor_id', vendor.id).eq('lead_id', found.lead.id).is('deleted_at', null);
    if (error || !Array.isArray(invs)) return null;
    const live = invs.filter((i) => i && typeof i.id === 'string' && i.state !== 'cancelled');
    const none = () => { const line = DL.render('B68', { client }); return line ? { speak: line, key: 'B68' } : null; };
    if (!live.length) return none();
    const { data: ms, error: mErr } = await supabase.from('payment_schedules').select(MILESTONE_SELECT)
      .eq('vendor_id', vendor.id).in('invoice_id', live.map((i) => i.id)).eq('state', 'pending');
    if (mErr || !Array.isArray(ms)) return null;
    const pending = ms.filter((m) => m && typeof m.id === 'string' && isDateKey(m.due_date)).sort((a, b) => (a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0));
    if (!pending.length) return none();
    const PR = L.reminders;
    const from = PR.istDayISO(0); const to = PR.istDayISO(PR.WINDOW_DAYS);
    const milestone = pending.find((m) => m.due_date >= from && m.due_date <= to) || pending[0];
    const invoice = live.find((i) => i.id === milestone.invoice_id);
    if (!invoice) return null;
    return { remind: { milestone, invoice, client } };
  } catch (_e) { return null; }
}
// HER ASK IS HER TAP (the chair's ruling on ASK 5): sendOneReminder AS IT STANDS with source 'vendor_tap', so a CLAIMED reminder also stands as her consent for
// the nightly sweep on that invoice (R-41.60, invoiceHasVendorTap), exactly as the app's button. sent → B67 from the milestone ROW; already → the room's own
// byte REUSED (reminders.js :202); refused by the gate or a refusal of the feature's own → out.reason_text VERBATIM (plainWords :94, :114, the four lowercase
// refusals); a transport failure → its reason_text (:425); anything else, or a throw → the glitch line. A dark gate writes NO row (:360 before :367).
const ALREADY_LINE = 'A reminder has already been sent for this milestone.'; // REUSE: reminders.js :202, byte for byte (b106 pins the pair)
async function fileReminder(supabase, vendor, plan, L) {
  const p = plan.remind; const input = { lead: p.client, milestone_id: String(p.milestone.id) };
  const glitch = (result) => ({ line: glitchLine() || DL.LINES.B3, key: 'GLITCH', call: { name: HANDS.payment_reminder, input, result }, landed: false });
  try {
    let vendorName = null;
    try { const { data } = await supabase.from('vendors').select('business_name').eq('id', vendor.id).maybeSingle(); vendorName = (data && data.business_name) || null; } catch (_e) { vendorName = null; }
    const out = await L.sendOneReminder(supabase, { vendorId: vendor.id, milestone: p.milestone, invoice: p.invoice, vendorName, source: 'vendor_tap' });
    if (out && out.ok === true && out.sent === true) {
      const line = DL.render('B67', { client: p.client, milestone: spotless(p.milestone.milestone_label), amount: digits(p.milestone.amount_due), date: longDateYear(p.milestone.due_date) });
      return { line: line || glitchLine() || DL.LINES.B3, key: line ? 'B67' : 'GLITCH', call: { name: HANDS.payment_reminder, input, result: 'sent' }, landed: true };
    }
    if (out && out.ok === true && out.already === true) return { line: ALREADY_LINE, key: 'REMINDER_ALREADY', call: { name: HANDS.payment_reminder, input, result: 'already' }, landed: false };
    if (out && (out.skipped === true || out.failed === true) && typeof out.reason_text === 'string' && out.reason_text.trim()) {
      return { line: out.reason_text.trim(), key: out.failed ? 'REMINDER_FAILED' : 'REMINDER_REFUSED', call: { name: HANDS.payment_reminder, input, result: out.failed ? 'failed' : 'refused:gate' }, landed: false };
    }
    return glitch('refused:write_failed');
  } catch (_e) { return glitch('refused:exception'); }
}

// ── P7 CUT 4 · THE LOOKUPS (CE-45 LCV-14; LCV-12's designs §4.2 to §4.4 as ruled; K3; Q1; F-44.129; R-45.11; ASK 7) ────────────────────────────
// A request on route 'search' is a LOOKUP: READ ONLY, one answer, NO note, NO question (a lookup keeps no question). ONE act only; a lookup naming a
// CLIENT, tally (R-45.11's table: the ear never hears it), history (P8's), or anything else returns null and the gate speaks B34 through 'lookup'.
//   · whatsdue with no day, or "this week" / "week" → WHAT'S DUE THIS WEEK (dueWeek.js): B73 per milestone, then B79 per shoot; none → B74
//     ("How much is owed to me?" arrives here: 8 of 8 whatsdue on R-45.11's table, sha256 19167fb8789d…; F-44.129)
//   · find, whatsdue or date WITH a day → AVAILABILITY of that day (readDaySpine, 2b's relocation): B72 per block, then B78 per booking; none → B71;
//     an unreadable day → B7 (his byte; no note)
//   · find with no day, or lead with no client (P7 row 13 C1, F-44.128) → THE NEW LEADS. THE FIX (F-44.136; Q4; R-45.12): the door's OWN read, newest
//     first (leadFeed.js newestLeads; the app's feed keeps its order). B69 names the FIVE newest NAMED leads, newest first, ending "and {n} more." when more
//     named remain (derived); the nameless are counted on their own line, B83 for one, B81 for two or more; none at all → B70. A lead with no name never
//     breaks the answer again.
//   · tally with no client → WHAT IS OWED (invoices.js readOutstanding, the ONE derivation, AS IT STANDS): B80 "Owed to you: Rs {total} across {n} open
//     invoices."; a zero total → B82; a failed read → his LEDGER_UNREADABLE REUSED from its home (victorLines.js), the invoice plane's fail-closed sentence
// Every name, figure and date is a ROW's. A failed read is 'lookup_unsayable' (the glitch line), never an empty answer (C-44.4). TOTAL: never throws.
const WEEK_WORDS = /^(this )?week$/;
async function lookupDoor(supabase, vendor, heard, nowMs, L, st) {
  try {
    const acts = heard && Array.isArray(heard.acts) ? heard.acts : [];
    if (acts.length !== 1 || !acts[0] || typeof acts[0] !== 'object') return null;
    const a = acts[0];
    if (spokenText(a.client_as_spoken)) return null; // a lookup WITH a client stays B34
    const said = spotless(a.date_as_spoken);
    const answer = (line, key, why) => ({ door: true, reply: line, keys: [key], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, ...(st.answered ? { answered: st.answered } : {}), why });
    if (a.act === 'whatsdue' && (!said || WEEK_WORDS.test(key(said)))) {
      const w = await L.dueThisWeek(supabase, vendor.id, nowMs);
      if (!w || w.ok !== true) return CHAIN(st.ear, 'lookup_unsayable');
      if (!w.payments.length && !w.shoots.length) return answer(DL.LINES.B74, 'B74', 'lookup_week');
      const line = DL.weekLines(w.payments.map((p) => ({ client: p.client, milestone: p.milestone, amount: digits(p.amount), date: longDateYear(p.date) })), w.shoots.map((x) => ({ client: x.client, date: longDateYear(x.date) })));
      return line ? answer(line, w.payments.length ? 'B73' : 'B79', 'lookup_week') : CHAIN(st.ear, 'lookup_unsayable');
    }
    if (LOOKUP_ACTS.includes(a.act) && said) {
      const d = resolveSpokenDate(said, { direction: 'future', nowMs });
      if (!d.ok || !LEAD_ISO.test(typeof d.iso === 'string' ? d.iso : '')) return answer(DL.LINES.B7, 'B7', 'lookup_day');
      const day = await L.readDaySpine(supabase, vendor.id, d.iso);
      if (!day || day.ok !== true) return CHAIN(st.ear, 'lookup_unsayable');
      const when = longDateYear(d.iso);
      if (!day.blocks.length && !day.events.length) { const line = DL.render('B71', { date: when }); return line ? answer(line, 'B71', 'lookup_day') : CHAIN(st.ear, 'lookup_unsayable'); }
      const line = DL.dayLines(when, day.blocks, day.events);
      return line ? answer(line, day.blocks.length ? 'B72' : 'B78', 'lookup_day') : CHAIN(st.ear, 'lookup_unsayable');
    }
    if ((a.act === 'find' || a.act === 'lead') && !said) {
      const { data, error } = await L.newestLeads(supabase, vendor.id);
      if (error || !Array.isArray(data)) return CHAIN(st.ear, 'lookup_unsayable');
      const named = data.filter((l) => l && typeof l.name === 'string' && l.name.trim());
      let nameless = data.length - named.length;
      let namedTotal = named.length;
      const cap = Number.isInteger(L.newestCap) && L.newestCap > 0 ? L.newestCap : 500;
      if (data.length >= cap) { // the ceiling met: the separate head-count; the rows beyond the ceiling are counted as named (disclosed)
        const c = await L.newLeadsCount(supabase, vendor.id);
        if (!c || c.error || !Number.isInteger(c.count)) return CHAIN(st.ear, 'lookup_unsayable');
        namedTotal = named.length + Math.max(0, c.count - data.length);
      }
      if (!namedTotal && !nameless) return answer(DL.LINES.B70, 'B70', 'lookup_leads');
      const shown = named.slice(0, 5);
      const lines = [];
      if (shown.length) lines.push(DL.newLeadsLine(shown.map((l) => ({ name: l.name.trim(), date: l.wedding_date ? longDateYear(l.wedding_date) : null })), namedTotal - shown.length));
      if (nameless) lines.push(DL.namelessLine(nameless));
      if (!lines.length || lines.some((x) => !x)) return CHAIN(st.ear, 'lookup_unsayable');
      return answer(lines.join('\n'), shown.length ? 'B69' : (nameless === 1 ? 'B83' : 'B81'), 'lookup_leads');
    }
    if (a.act === 'tally' && !said) {
      const r = await L.readOutstanding(supabase, vendor.id);
      if (!r || r.ok !== true || !r.summary) { const ledger = require('../victorLines').VICTOR_LINES.LEDGER_UNREADABLE; return answer(ledger, 'LEDGER_UNREADABLE', 'lookup_owed'); }
      const total = Number(r.summary.total_outstanding) || 0;
      if (total <= 0) return answer(DL.LINES.B82, 'B82', 'lookup_owed');
      const n = (Array.isArray(r.rows) ? r.rows : []).filter((x) => x && (L.outstandingStates || []).includes(x.state)).length;
      const line = DL.render('B80', { total: digits(total), n });
      return line ? answer(line, 'B80', 'lookup_owed') : CHAIN(st.ear, 'lookup_unsayable');
    }
    return null;
  } catch (_e) { return CHAIN(st && st.ear, 'lookup_unsayable'); }
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
function planLead(act, nowMs, answeringB18, message) {
  try {
    if (!act || typeof act !== 'object') return { speak: DL.LINES.B20, key: 'B20' };
    const name = typeof act.client_as_spoken === 'string' ? act.client_as_spoken.trim() : '';
    // B18 skips harvest, as B8 does: the door asked WHO, so nothing she said may be patched onto another draft.
    if (!name) return { speak: DL.LINES.B18, key: 'B18', skipHarvest: true };
    if (answeringB18 !== true && eventOnly(name)) return { speak: DL.LINES.B18, key: 'B18', skipHarvest: true }; // F-44.100
    // F-44.96 (P6b): the phone she said, folded to the stored shape by relayToCouple.asPhone (+91 on a bare ten); anything that is not
    // phone-shaped is no phone. It rides the plan and reaches createLead as `phone`, whose own dedupe then answers B19 or files it.
    let phone = null;
    const heardPhone = typeof act.phone_as_spoken === 'string' && !!act.phone_as_spoken.trim();
    if (heardPhone) phone = foldPhone(act.phone_as_spoken);
    // F-44.96's second half: no slot heard, so the door reads her message itself; one run is the phone, two is no guess (twoPhones → B34)
    if (!heardPhone) {
      const runs = phoneRuns(message);
      if (runs.length > 1) return { twoPhones: true };
      if (runs.length === 1) phone = foldPhone(runs[0]);
    }
    if (typeof act.date_as_spoken !== 'string' || !act.date_as_spoken.trim()) return { lead: { name, wedding_date: null, phone } };
    const d = resolveSpokenDate(act.date_as_spoken, { direction: 'future', nowMs });
    // F-44.98: a date read with an absurd year ("15 March 0227", his own walk of 20 September) is B21, not B7.
    if (!d.ok) return d.reason === 'year' ? { speak: DL.LINES.B21, key: 'B21' } : { speak: DL.LINES.B7, key: 'B7' };
    // The year is parsed STRICTLY; a date that does not match is B21, never passable (a NaN compares false).
    const m = LEAD_ISO.exec(typeof d.iso === 'string' ? d.iso : '');
    const t = LEAD_ISO.exec(todayIstIso(nowMs));
    if (!m || !t) return { speak: DL.LINES.B21, key: 'B21' };
    const y = Number(m[1]); const y0 = Number(t[1]);
    if (d.iso < t[0] || y < y0 || y > y0 + 5) return { speak: DL.LINES.B21, key: 'B21' };
    return { lead: { name, wedding_date: d.iso, phone } };
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
    input = { name: p.name, source: lane === 'pwa' ? 'self' : 'whatsapp', ...(p.phone ? { phone: p.phone } : {}), ...(p.wedding_date ? { wedding_date: p.wedding_date, wedding_date_precision: 'day' } : {}) };
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
  const st = { wrote: false, rereadRow: null, ctx: null, ear: null, lines: [], keys: [], toolCalls: [], documents: [], refresh: false, skipHarvest: false, fallback: null, note: null, answered: null, dateAsks: [], pkgAsks: [], relayNote: null, said: null };
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
    const liveAtStart = !!live; // R-44.40: an offer is never spoken on a turn that began with a money row live, expired by this message or not
    if (live && said === null) await pma.markExpired(supabase, live); // a stamp, not an act: the row is not live either way
    // F-44.112: THE DOOR'S OWN NOTE, read AFTER the live-row handling (a yes or a no belongs to the money question first) and
    // ABOVE the bare yes-or-no exit, so her "No" to a date question meets the note and reads B3, never LEFTOVER.
    const note = await lastDoorNote(supabase, agentId);
    // P6b: the frame's own answers. A NO refuses the stored row and reads the seat's declined byte (fork (i), the seat's own
    // receipt names her); a YES sends the row by its id through the seat's one approved leg. Both are the door's writes.
    const draftName = async (phone) => { try { return await L.coupleDisplayName(supabase, vendor.id, phone); } catch (_e) { return null; } };
    const declineDraft = async (draftId, why) => {
      st.wrote = true; st.skipHarvest = true;
      let name = null;
      try { const got = await L.drafts.getById(supabase, draftId); if (got && got.draft) { name = await draftName(got.draft.couple_phone); await L.drafts.refuse(supabase, draftId, 'vendor_declined'); } } catch (_e) { /* the line below is still true: nothing went to her */ }
      const line = L.relay.declinedLine(name);
      return { door: true, reply: typeof line === 'string' && line ? line : DL.LINES.B3, keys: [typeof line === 'string' && line ? 'RELAY_DECLINED' : 'B3'], toolCalls: [{ name: 'donna_relay_send', input: { draft_id: draftId }, result: 'declined' }], toolNames: ['donna_relay_send'], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: 'B37', why };
    };
    const sendDraft = async (draftId) => {
      const got = await L.drafts.getById(supabase, draftId);
      const draft = got && got.draft;
      if (!draft || draft.state !== 'staged' || draft.resolved_at) return { line: DL.LINES.B14, key: 'B14', result: 'not_open' };
      const exp = draft.expires_at ? new Date(draft.expires_at).getTime() : null;
      // the store's own clock (openStagedFor reads Date.now()): one clock for the row
      if (exp != null && Number.isFinite(exp) && Date.now() > exp) { try { await L.drafts.expire(supabase, draftId); } catch (_e) { /* a stamp */ } return { line: L.relay.expiredLine(), key: 'RELAY_EXPIRED', result: 'expired' }; }
      const name = await draftName(draft.couple_phone);
      const out = await L.relay.sendApprovedDraft(supabase, vendor, draft, name, { sendWhatsApp: L.sendWhatsApp, env: L.env });
      if (!out || typeof out.line !== 'string' || !out.line) return { line: DL.LINES.B14, key: 'B14', result: 'refused' };
      return { line: out.line, key: `RELAY_${String(out.kind || 'sent').toUpperCase()}`, result: out.kind || 'sent' };
    };
    if (note && said === 'no') {
      if (RELAY_ASKS.includes(note.asked)) return declineDraft(note.draft_id, 'draft_declined');
      return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: null, answered: note.asked, why: 'note_declined' };
    }
    // P6b, THE FIRST CUT IS THE WHATSAPP LANE (the chair's scope): the pwa lane's send is the second cut's, so on 'pwa' no draft is staged,
    // re-shown or sent from the door; a relay there reads B34 as before (exit relay_pwa) and the seat's ⑩ stays in place.
    const relayLane = lane === 'whatsapp';
    if (!note && !live && said !== null && relayLane) {
      // P6b (the chair's ruling on fork (b)): a bare yes or no with an OPEN staged draft and no note of it (the frame was displaced
      // as the last assistant row, or lapsed): a NO refuses the row; a YES re-shows the frame ONCE with a note, so her next yes sends.
      try {
        const open = await L.drafts.openStagedFor(supabase, vendor.id);
        if (open && open.expired) return { door: true, reply: L.relay.expiredLine(), keys: ['RELAY_EXPIRED'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: null, why: 'draft_expired' };
        if (open && open.draft) {
          if (said === 'no') return declineDraft(open.draft.id, 'draft_declined');
          const name = await draftName(open.draft.couple_phone);
          const line = DL.showFrame(open.draft.body, name, open.draft.couple_phone);
          if (line) return { door: true, reply: line, keys: ['B37'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: null, note: { asked: 'B37', acts: [{ act: 'relay', ...(name ? { client_as_spoken: name } : {}) }], tries: 1, draft_id: open.draft.id }, why: 'draft_reshown' };
        }
      } catch (e) { try { console.warn('[door:open draft]', e && e.message); } catch (_e) { /* */ } }
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
    // R-45.3 (CE-45 LCV-12, cut one; the founder, 22 September 2026: "yes to the code 2nd hearing. i feel that can cure a lot of issues."):
    // THE COLD SECOND HEARING. WITNESSED on the P6b walk of 22 September: three of seven "Tell Sarah ..." sentences were heard as NO TASK
    // inside a long thread (16:01:48, 16:02:25, 16:12:58, each {"acts":[],"route":"none"}, each read LEFTOVER), while cold, with no thread,
    // the same shape was heard nine times in ten (F-44.122). THE MECHANISM, as the chair ruled it: on a turn answering NO note (a note turn
    // is decided by the note branches below on what was heard), meeting no live money row (a live row's yes or no returned above; anything
    // else expired it), when the ear returned route none with no acts, and her message under key() contains the name of one of her LIVE
    // leads (leadsOf; never a name under three characters), the door hears the SAME message ONCE MORE with the thread stripped
    // (conversationId null: readThread returns [] and threadText is empty; the same seat, tool and bound, the second call getting ITS OWN
    // bound since a squeezed hearing is a miss with no record), and the second hearing is what the door decides on through every floor,
    // note and question below. A second hearing returning nothing, or an error, leaves the request as it was and reads LEFTOVER as before;
    // NEVER a third. st.ear carries both for the record (request = the second, heard = the first, reheard = true) and its usage is the SUM
    // of both calls, so one message stays one message (R-44.21 (b)) with one usage row. No word-list (the names are her own live rows),
    // no prompt byte, no engine touch. His control, "tell me who owes me money", holds no lead name and never triggers it.
    if (!note && heardNothing(st.ear) && await namesLiveLead(supabase, vendor.id, message)) {
      const first = st.ear;
      const second = await L.listener.hear({ supabase, route, message, conversationId: null, excludeId: null },
        { ...(deps.llmCreate ? { llmCreate: deps.llmCreate } : {}), timeoutMs: Number.isFinite(deps.hearMs) ? deps.hearMs : HEAR_BEFORE_REPLY_MS });
      st.ear = rehear(first, second);
    }
    // F-44.112: a turn that answers the door's own date question. THE DOOR'S OWN READ DECIDES FIRST: if her whole message
    // resolves as a date in the noted act's direction it IS the answer, whatever the listener heard (it was still heard, for
    // the record). If it does not, the listener's record decides ONE thing: an act OTHER than the noted one means she has
    // moved on, the note LAPSES and her message is handled fresh below. Otherwise the saved act runs with her words as its
    // date and the plans answer as they answer any unreadable date.
    let fromNote = null;
    // A NAME NOTE (B18 or B35): decided before the date-note branch below.
    const askAgain = (line, key, tries) => ({ door: true, reply: line, keys: [key], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, note: { asked: key, acts: note.acts, tries, ...(note.said ? { said: note.said } : {}) }, answered: key, why: 'note_reasked' });
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
        st.answered = note.asked; st.said = note.said || null; // F-44.123
      }
    } else if (note && MEMBER_ASKS.includes(note.asked)) {
      // P7 cut 3: HER ANSWER TO B62 IS THE MEMBER. Her whole trimmed message fills acts[0].member_as_spoken, never client_as_spoken (the chair's ruling on ASK 1).
      // She has MOVED ON when the ear heard an act of a kind the note does not hold, or the assignment RESTATED with a member that is not her whole message;
      // an act on route 'search', or one whose client or member IS her whole message, is her answer heard as something else (F-44.117's class). A closed YES
      // is no name: re-asked once, then B3.
      const name = message.trim();
      const heardActs = st.ear && st.ear.request && Array.isArray(st.ear.request.acts) ? st.ear.request.acts : [];
      const route = st.ear && st.ear.request ? st.ear.request.route : null;
      const kinds = note.acts.map((a) => a.act);
      const isAnswer = (a) => route === 'search' || key(a.client_as_spoken) === key(name) || key(a.member_as_spoken) === key(name);
      const restated = (a) => a.act === 'assign_crew' && !!spokenText(a.member_as_spoken) && key(a.member_as_spoken) !== key(name);
      const movedOn = heardActs.some((a) => a && typeof a === 'object' && typeof a.act === 'string' && !isAnswer(a) && (!kinds.includes(a.act) || restated(a)));
      if (PMA.decide(name) === 'yes') {
        if (note.tries > 0) return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: note.asked, why: 'note_exhausted' };
        return askAgain(DL.LINES.B62, 'B62', note.tries + 1);
      }
      if (!movedOn) { fromNote = { route: 'task', acts: note.acts.map((a, i) => (i === 0 ? { ...a, member_as_spoken: name } : { ...a })) }; st.answered = 'B62'; }
    } else if (note && OFFER_ASKS.includes(note.asked)) {
      // R-44.40: her YES runs the act with the candidate's own name, through the same plans; NO was answered B3 above; anything else lapses
      // on a heard act of another kind, or re-asks once, then B3. The candidate is never spoken outside the question.
      const heardActs = st.ear && st.ear.request && Array.isArray(st.ear.request.acts) ? st.ear.request.acts : [];
      if (PMA.decide(message) === 'yes') { fromNote = { route: 'task', acts: note.acts.map((a) => ({ ...a })) }; st.answered = 'B36'; st.said = note.said || null; } // F-44.123
      else {
        const movedOn = heardActs.some((a) => a && typeof a === 'object' && typeof a.act === 'string' && a.act !== note.acts[0].act);
        if (!movedOn) {
          if (note.tries > 0) return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: 'B36', why: 'note_exhausted' };
          const line = DL.render('B36', { name: note.acts[0][slotField(note.slot)] || '' }) || DL.LINES.B3;
          return { ...askAgain(line, line === DL.LINES.B3 ? 'B3' : 'B36', note.tries + 1), note: { asked: 'B36', acts: note.acts, tries: note.tries + 1, candidate_id: note.candidate_id, slot: note.slot, ...(note.said ? { said: note.said } : {}) } };
        }
      }
    } else if (note && RELAY_ASKS.includes(note.asked) && relayLane) {
      // P6b: YES sends the row the frame showed; anything else lapses on ANY act heard (handled fresh; a new relay supersedes the
      // row at stage time) or re-shows the frame once, then B3. The acts behind the question ride on after a send.
      const heardActs = st.ear && st.ear.request && Array.isArray(st.ear.request.acts) ? st.ear.request.acts : [];
      if (PMA.decide(message) === 'yes') {
        st.wrote = true; st.skipHarvest = true; st.answered = 'B37';
        const sent = await sendDraft(note.draft_id);
        st.lines.push(sent.line); st.keys.push(sent.key);
        st.toolCalls.push({ name: 'donna_relay_send', input: { draft_id: note.draft_id }, result: sent.result });
        const rest = note.acts.slice(1);
        if (!rest.length) return doorAnswer(st, 'draft_answered');
        fromNote = { route: 'task', acts: rest.map((a) => ({ ...a })) };
      } else {
        const movedOn = heardActs.some((a) => a && typeof a === 'object' && typeof a.act === 'string');
        if (!movedOn) {
          if (note.tries > 0) return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: 'B37', why: 'note_exhausted' };
          let line = null;
          try { const got = await L.drafts.getById(supabase, note.draft_id); if (got && got.draft && got.draft.state === 'staged' && !got.draft.resolved_at) line = DL.showFrame(got.draft.body, await draftName(got.draft.couple_phone), got.draft.couple_phone); } catch (_e) { line = null; }
          if (!line) return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: 'B37', why: 'note_exhausted' };
          return { ...askAgain(line, 'B37', note.tries + 1), note: { asked: 'B37', acts: note.acts, tries: note.tries + 1, draft_id: note.draft_id } };
        }
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
    } else if (note && CAL_ASKS.includes(note.asked)) {
      // P7 cut 2b: THE MOVE OR CANCEL QUESTION. NO was answered B3 above. YES writes the ONE shoot the note names through writeEvent AS IT STANDS and reads
      // back from the row (B49, B51), or speaks the checker's own sentence (B47) or B75. Another act heard lapses the note (F-44.115: handled fresh below);
      // anything else re-asks the question ONCE, then B3.
      const heardActs = st.ear && st.ear.request && Array.isArray(st.ear.request.acts) ? st.ear.request.acts : [];
      if (PMA.decide(message) === 'yes') {
        st.wrote = true; st.skipHarvest = true; st.answered = note.asked; st.fallback = DL.LINES.B75;
        const f = await fileCal(supabase, vendor, lane, note, nowMs, L);
        if (f.line) { st.lines.push(f.line); st.keys.push(f.key); }
        st.toolCalls.push(f.call); if (f.landed) st.refresh = true;
        return doorAnswer(st, 'cal_answered');
      }
      const movedOn = heardActs.some((a) => a && typeof a === 'object' && typeof a.act === 'string');
      if (!movedOn) {
        if (note.tries > 0) return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: note.asked, why: 'note_exhausted' };
        const client = note.acts[0].client_as_spoken;
        const line = note.iso ? DL.render(note.asked, { client, date: longDateYear(note.iso) }) : null;
        if (!line) return { door: true, reply: DL.LINES.B3, keys: ['B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: note.asked, why: 'note_exhausted' };
        return { door: true, reply: line, keys: [note.asked], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, note: { asked: note.asked, acts: note.acts, tries: note.tries + 1, event_id: note.event_id, iso: note.iso }, answered: note.asked, why: 'note_reasked' };
      }
    } else if (note && SHOOT_ASKS.includes(note.asked)) {
      // P7 cut 2b (K4): HER ANSWER TO B53 PICKS THE SHOOT, and nothing else. The door's own date read of her WHOLE message against the candidates' live
      // rows: exactly one on that day → the move or cancel is ASKED on it (B48, B50), the act's own new day UNTOUCHED. Otherwise: another act heard lapses
      // the note (a lookup heard is her answer, F-44.117's class); unreadable → B7 once; a day naming no one candidate → B53 once; then B3.
      const heardActs = st.ear && st.ear.request && Array.isArray(st.ear.request.acts) ? st.ear.request.acts : [];
      const noted = note.acts[0];
      const own = resolveSpokenDate(message.trim(), { direction: 'future', nowMs });
      const rows = await shootsById(supabase, vendor.id, note.event_ids);
      if (!rows) return CHAIN(st.ear, 'calendar_unsayable');
      const hit = own.ok ? rows.filter((r) => r.event_date === own.iso) : [];
      const quiet = { toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, answered: 'B53' };
      if (hit.length === 1) {
        let iso = null;
        if (noted.act === 'edit_event') { const d = calendarDate(noted, nowMs); if (d.speak) return { door: true, reply: d.speak, keys: [d.key], ...quiet, why: 'cal_refused' }; iso = d.iso; }
        const q = calQuestion(noted, noted.client_as_spoken, hit[0], iso);
        if (!q) return CHAIN(st.ear, 'calendar_unsayable');
        return { door: true, reply: q.ask.line, keys: [q.ask.key], ...quiet, note: q.ask.note, why: 'cal_asked' };
      }
      const route = st.ear && st.ear.request ? st.ear.request.route : null;
      const restated = (a) => a.act === noted.act && ((!!spokenText(a.date_as_spoken) && key(a.date_as_spoken) !== key(message.trim()) && key(a.date_as_spoken) !== key(noted.date_as_spoken || ''))
        || (!!spokenText(a.client_as_spoken) && key(noted.client_as_spoken) !== key(a.client_as_spoken)));
      const movedOn = route !== 'search' && heardActs.some((a) => a && typeof a === 'object' && typeof a.act === 'string' && a.act !== 'date' && (a.act !== noted.act || restated(a)));
      if (!movedOn) {
        if (note.tries > 0) return { door: true, reply: DL.LINES.B3, keys: ['B3'], ...quiet, why: 'note_exhausted' };
        if (!own.ok) return { door: true, reply: DL.LINES.B7, keys: ['B7'], ...quiet, note: { asked: 'B53', acts: note.acts, tries: note.tries + 1, event_ids: note.event_ids }, why: 'note_reasked' };
        const again = rows.length > 1 ? shootsQuestion(noted, noted.client_as_spoken, rows, note.tries + 1) : null;
        if (!again) return { door: true, reply: DL.LINES.B3, keys: ['B3'], ...quiet, why: 'note_exhausted' };
        return { door: true, reply: again.ask.line, keys: ['B53'], ...quiet, note: again.ask.note, why: 'note_reasked' };
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
      // F-44.96: the phone guard that stood here LEFT with P6b's first cut; the ear hears the phone and the door files it.
      const k = namelessLead(rq.acts) ? 'B18' : 'B35';
      const original = holdsRelay(rq.acts) ? saidOf(st.said || message) : null; // F-44.123: her ORIGINAL message rides the name note
      return { door: true, reply: DL.LINES[k], keys: [k], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, note: { asked: k, acts: rq.acts.map((a) => ({ ...a })), tries, ...(original ? { said: original } : {}) }, ...(st.answered ? { answered: st.answered } : {}), why: 'name_asked' };
    };
    // R-44.40: the offer. ONE candidate from her rows within the pinned distance, or nothing. A QUESTION with a note; nothing runs.
    const offerFor = async (act, slot, said, rows) => {
      try {
        const c = nearestName(said, rows);
        if (!c) return null;
        const line = DL.render('B36', { name: String(c.name).trim() });
        if (!line) return null;
        const filled = { ...act, [slotField(slot)]: String(c.name).trim() };
        const original = act && act.act === 'relay' ? saidOf(st.said || message) : null; // F-44.123: her ORIGINAL message rides the offer note
        return { door: true, reply: line, keys: ['B36'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, note: { asked: 'B36', acts: [filled], tries: 0, candidate_id: String(c.id), slot, ...(original ? { said: original } : {}) }, why: 'offer_asked' };
      } catch (_e) { return null; }
    };
    if (fromNote) { const ask = askName(fromNote, 0); if (ask) return ask; }
    if (!fromNote) {
    if (!st.ear || !st.ear.request) return CHAIN(st.ear, 'no_request');
    // F-44.110: the door DECIDES on the request with an echoed event dropped; st.ear, which is recorded, keeps what was HEARD.
    heard = withoutEchoedEvents(st.ear.request, nowMs);
    // F-44.128 (CE-45 LCV-12, cut 2a; the chair's ruling 5 of 23 September): A REQUEST ON ROUTE 'search' IS NEVER A JOB. MEASURED on the P7
    // table (row 13, C1 both variants): "Who are my new leads?" returned act `lead` with no client on route search, which met askName below and
    // would have asked B18 (the lead's name question) for a LOOKUP. Its acts are lookups only; until cut four covers them the turn reads
    // B34 (exit 'lookup', standKey); cut four makes this exit the lookups' door. Never reached on a note turn (fromNote decides above).
    if (heard && heard.route === 'search') return (await lookupDoor(supabase, vendor, heard, nowMs, L, st)) || CHAIN(st.ear, 'lookup'); // P7 cut 4: the lookups' door
    // F-44.118 (the chair; kept by the founder's R-44.41 as a SAFETY FLOOR UNDER MONEY and not as a cure for context): on a turn not answering
    // a note, a heard client_as_spoken NOT PRESENT in her message under key() is a name she did not say (the ear carried the thread's last
    // lead onto "The booking is confirmed", 06:32:24 and 08:01:09 on 22 September) and is treated as UNSAID, so B18 or B35 is asked.
    // SCOPED BY THE FOUNDER'S RULING (R-44.41, the reduced standard): it fires only when her message holds TWO OR MORE WORDS, so the
    // rungs' placeholder drivers (a one-word 'x' with any heard client) are untouched; a one-word message cannot carry a job and a name.
    const saidKey = key(message);
    if (saidKey.split(/\s+/).filter(Boolean).length >= 2) {
      heard = { ...heard, acts: heard.acts.map((a) => (a && typeof a === 'object' && spokenText(a.client_as_spoken) && !saidKey.includes(key(a.client_as_spoken)) ? (({ client_as_spoken: _c, ...rest }) => rest)(a) : a)) };
    }
    { const ask = askName(heard, 0); if (ask) return ask; }
    if (!allCovered(heard)) return CHAIN(st.ear, 'uncovered');
    // F-44.96's guard stood here until P6b's first cut: the ear now hears phone_as_spoken and the door files the number itself.
    } else st.answered = note.asked;

    // P7 cut 2b: A MOVE OR A CANCEL IS ASKED, NEVER WRITTEN ON THIS TURN. It must be the ONLY act of her message (one question at a time; a mixed message
    // reads B34, exit 'cal_mixed'). Resolved read-only by planCal: the ONE home offers B36 for a near name, a name that is no lead reads B76 ('book_no_lead',
    // his one line for book, move, cancel and remind); B8, B52 and the date lines are spoken; B54 and B7 keep a DATE note as every calendar act's do; B48,
    // B50 and B53 keep their own notes. Nothing is written until her YES to B48 or B50.
    const calActs = heard.acts.filter((a) => a && CAL_QUESTION_ACTS.includes(a.act));
    if (calActs.length) {
      if (heard.acts.length !== 1) return CHAIN(st.ear, 'cal_mixed');
      const a = calActs[0];
      const plan = await planCal(supabase, vendor, a, nowMs, L);
      if (!plan) return CHAIN(st.ear, 'calendar_unsayable');
      if (plan.noLead) {
        const offer = !liveAtStart && !fromNote ? await offerFor(a, 'client', plan.name, await leadsOf(supabase, vendor.id)) : null;
        if (offer) return offer;
        return CHAIN(st.ear, 'book_no_lead', { name: plan.name });
      }
      const base = { door: true, toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, ...(st.answered ? { answered: st.answered } : {}) };
      if (plan.ask) return { ...base, reply: plan.ask.line, keys: [plan.ask.key], note: plan.ask.note, why: 'cal_asked' };
      if (DATE_ASKS.includes(plan.key)) {
        const tries = fromNote && note && DATE_ASKS.includes(note.asked) ? note.tries + 1 : 0;
        if (tries > 1) return { ...base, reply: DL.LINES.B3, keys: ['B3'], why: 'note_exhausted' };
        const n = await noteFor(supabase, vendor, plan.key, a, [], tries, L);
        return { ...base, reply: plan.speak, keys: [plan.key], ...(n ? { note: n } : {}), why: 'cal_date_asked' };
      }
      return { ...base, reply: plan.speak, keys: [plan.key], why: 'cal_refused' };
    }

    // 3 · resolve every act first, read-only; any act the door cannot say sends the WHOLE message to the chain
    const acts = heard.acts;
    const money = acts.filter((a) => MONEY_ACTS.includes(a.act));
    // F-44.100: the thread is read ONLY when a lead act's name is made of event words and nothing else.
    let answeringB18 = false;
    if (acts.some((a) => a && a.act === 'lead' && eventOnly(a.client_as_spoken))) answeringB18 = await lastWasDoorNameQuestion(supabase, agentId);
    const leadPlans = [];
    for (const a of acts) if (a.act === 'lead') leadPlans.push(planLead(a, nowMs, answeringB18, message));
    // F-44.96's second half: two phone-shaped runs and no slot is the one place the guard's reply survives; nothing is written.
    if (leadPlans.some((p) => p && p.twoPhones)) return CHAIN(st.ear, 'lead_phone');
    const leadActs = acts.filter((a) => a.act === 'lead'); // F-44.112: the act behind each plan, by position; the line above is another rung's anchor
    // P6a-2: every attach is PROBED read-only. One the door cannot say, or one naming no lead that this message
    // does not itself file, sends the WHOLE message to the chain before anything is written.
    const attaches = acts.filter((a) => a.act === 'attach_package');
    const willFile = leadPlans.filter((p) => p && p.lead).map((p) => key(p.lead.name));
    for (const a of attaches) {
      const probe = await planAttach(supabase, vendor, a, nowMs, L);
      if (!probe) return CHAIN(st.ear, 'attach_unsayable');
      if (probe.noLead && !willFile.includes(key(probe.name))) {
        const offer = !liveAtStart && !fromNote ? await offerFor(a, 'client', probe.name, await leadsOf(supabase, vendor.id)) : null;
        if (offer) return offer;
        return CHAIN(st.ear, 'attach_no_lead', { name: probe.name });
      }
      if (probe.speak && probe.key === 'B23' && !liveAtStart && !fromNote) { const offer = await offerFor(a, 'package', a.package_as_spoken, await packagesOf(supabase, vendor.id)); if (offer) return offer; }
    }
    const plans = [];
    for (const a of acts) {
      if (a.act === 'invoice') {
        const p = await planInvoice(supabase, vendor, agentId, a);
        // R-44.40, the invoices cut: the binder names of engine.records join the ONE home; a misspelt client on an invoice is OFFERED, never B15'd, under
        // the same distance and the same refusals; YES runs planInvoice with the candidate's own binder name through the same plan.
        if (p && p.noBinder && !liveAtStart && !fromNote) { const offer = await offerFor(a, 'client', p.name, await bindersOf(supabase, agentId)); if (offer) return offer; }
        if (!p || p.noBinder) return CHAIN(st.ear, 'invoice_unresolved', p && p.noBinder ? { name: p.name } : null);
        plans.push({ act: a, plan: p });
      }
    }
    // P6b: the ONE relay of the message (a second is not staged; one draft at a time is the store's own law, supersede-on-stage).
    const relays = acts.filter((a) => a.act === 'relay');
    let relayPlan = null;
    if (relays.length && !relayLane) return CHAIN(st.ear, 'relay_pwa'); // the second cut's lane: B34 as before
    if (relays.length) {
      relayPlan = await planRelay(supabase, vendor, relays[0], L);
      if (!relayPlan) return CHAIN(st.ear, 'relay_unsayable');
      if (relayPlan.noLead) {
        const offer = !liveAtStart && !fromNote ? await offerFor(relays[0], 'client', relayPlan.name, await leadsOf(supabase, vendor.id)) : null;
        if (offer) return offer;
        const line = DL.render('B38', { name: relayPlan.name });
        return { door: true, reply: line || DL.LINES.B3, keys: [line ? 'B38' : 'B3'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, ...(st.answered ? { answered: st.answered } : {}), why: 'relay_no_lead' };
      }
    }
    // P7 cut 2a: every CALENDAR act is PROBED read-only here (a plan the door cannot say → 'calendar_unsayable'; a booking for a name that is no
    // lead this message does not itself file → B36's offer or B76); the plans are REBUILT after the writes before them (a lead filed this message
    // exists then) and only the rebuilt plan is written.
    const calendar = acts.filter((a) => CALENDAR_ACTS.includes(a.act));
    for (const a of calendar) {
      const probe = a.act === 'book_event' ? await planBook(supabase, vendor, a, nowMs, L) : a.act === 'block_date' ? planBlock(a, nowMs) : planUnblock(a, nowMs);
      if (!probe) return CHAIN(st.ear, 'calendar_unsayable');
      if (probe.noLead && !willFile.includes(key(probe.name))) {
        const offer = !liveAtStart && !fromNote ? await offerFor(a, 'client', probe.name, await leadsOf(supabase, vendor.id)) : null;
        if (offer) return offer;
        return CHAIN(st.ear, 'book_no_lead', { name: probe.name });
      }
    }
    // P7 cut 3: every TEAM act (an assignment, a reminder) is PROBED read-only here, in message order, and REBUILT after the writes before it. B62 is ASKED
    // with its MEMBER note carrying every act of the message (one question at a time; nothing is written on that turn); a near member or client is OFFERED
    // (B36, its slot); a client that is no lead reads B76 ('book_no_lead'); a day holding two or more shoots with no client names none ('assign_many', B34).
    const team = acts.filter((a) => TEAM_ACTS.includes(a.act));
    const offers = !liveAtStart && (!fromNote || st.answered === 'B62');
    for (const a of team) {
      const probe = a.act === 'assign_crew' ? await planAssign(supabase, vendor, a, nowMs, L, offers) : await planReminder(supabase, vendor, a, L);
      if (!probe) return CHAIN(st.ear, 'team_unsayable');
      if (probe.ask) {
        const n = { asked: 'B62', acts: [noteAct(a), ...acts.filter((x) => x !== a).map(noteAct).filter(Boolean)], tries: 0 };
        return { door: true, reply: probe.ask.line, keys: ['B62'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: st.ear, ...(validNote(n) ? { note: n } : {}), ...(st.answered ? { answered: st.answered } : {}), why: 'member_asked' };
      }
      if (probe.many) return CHAIN(st.ear, 'assign_many');
      if (probe.noLead && !willFile.includes(key(probe.name))) {
        const offer = !liveAtStart && !fromNote ? await offerFor(a, 'client', probe.name, await leadsOf(supabase, vendor.id)) : null;
        if (offer) return offer;
        return CHAIN(st.ear, 'book_no_lead', { name: probe.name });
      }
      if (probe.offer) { const offer = await offerFor(a, probe.offer.slot, probe.offer.said, probe.offer.rows); if (offer) return offer; } // no one near: the rebuild (offers false) adds her name
    }
    let moneyPlan = null;
    if (money.length) {
      moneyPlan = await planMoney(supabase, vendor, money[0], L); if (!moneyPlan) return CHAIN(st.ear, 'money_unsayable', { act: money[0].act });
      if (moneyPlan.key === 'B4' && !liveAtStart && !fromNote) { const offer = await offerFor(money[0], 'client', money[0].client_as_spoken, await leadsOf(supabase, vendor.id)); if (offer) return offer; }
    }

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
    // P7 cut 2a: THE CALENDAR, after leads, attaches and invoices and before the relay and the money act (ruling (b)), in message order. Each
    // plan is rebuilt here from the rows as they now stand. After a write nothing goes to the chain: what the door cannot say is B75.
    for (const a of calendar) {
      const cp = a.act === 'book_event' ? await planBook(supabase, vendor, a, nowMs, L) : a.act === 'block_date' ? planBlock(a, nowMs) : planUnblock(a, nowMs);
      if (!cp || cp.noLead) {
        if (!st.wrote) return CHAIN(st.ear, cp && cp.noLead ? 'book_no_lead' : 'calendar_unsayable', cp && cp.noLead ? { name: cp.name } : null);
        st.lines.push(DL.LINES.B75); st.keys.push('B75'); continue;
      }
      if (cp.speak) { st.lines.push(cp.speak); st.keys.push(cp.key); if (cp.skipHarvest) st.skipHarvest = true; if (DATE_ASKS.includes(cp.key)) st.dateAsks.push({ key: cp.key, act: a }); continue; }
      st.wrote = true; // a row may land inside a call that then throws
      if (!st.fallback) st.fallback = a.act === 'book_event' ? DL.LINES.B75 : DL.render(a.act === 'block_date' ? 'B42' : 'B45', { date: longDateYear((cp.block || cp.unblock).iso) });
      const f = cp.block ? await fileBlock(supabase, vendor, cp, L) : cp.unblock ? await fileUnblock(supabase, vendor, cp, L) : await fileBook(supabase, vendor, agentId, lane, cp, L);
      if (f.line) { st.lines.push(f.line); st.keys.push(f.key); }
      st.toolCalls.push(f.call);
      if (f.landed) st.refresh = true;
    }
    // P7 cut 3: THE TEAM, after the calendar and before the relay and the money act, in message order; each plan REBUILT from the rows as they now stand.
    // After a write nothing goes to the chain: what the door cannot say is the glitch line. A team add, an assignment and a reminder LAND AT ONCE.
    for (const a of team) {
      const tp = a.act === 'assign_crew' ? await planAssign(supabase, vendor, a, nowMs, L, false) : await planReminder(supabase, vendor, a, L);
      if (!tp || tp.noLead || tp.ask || tp.many || tp.offer) {
        if (!st.wrote) return CHAIN(st.ear, tp && tp.noLead ? 'book_no_lead' : 'team_unsayable', tp && tp.noLead ? { name: tp.name } : null);
        st.lines.push(glitchLine() || DL.LINES.B3); st.keys.push('GLITCH'); continue;
      }
      if (tp.speak) { st.lines.push(tp.speak); st.keys.push(tp.key); if (tp.skipHarvest) st.skipHarvest = true; if (DATE_ASKS.includes(tp.key)) st.dateAsks.push({ key: tp.key, act: a }); continue; }
      st.wrote = true; // a row may land inside a call that then throws
      if (!st.fallback) st.fallback = glitchLine();
      if (tp.remind) {
        const f = await fileReminder(supabase, vendor, tp, L);
        st.lines.push(f.line); st.keys.push(f.key); st.toolCalls.push(f.call); if (f.landed) st.refresh = true;
      } else {
        const f = await fileAssign(supabase, vendor, lane, tp, L);
        for (const l of f.lines) { st.lines.push(l.line); st.keys.push(l.key); }
        st.toolCalls.push(...f.calls); if (f.landed) st.refresh = true;
      }
    }
    // P6b: the relay is composed and STAGED after the writes before it, and the frame is asked. A money act in the same message
    // is NOT staged this turn (one question at a time): it rides the frame's note and is planned afresh after her answer.
    let relayAsked = false;
    if (relayPlan && relayPlan.speak) { st.lines.push(relayPlan.speak); st.keys.push(relayPlan.key); if (relayPlan.skipHarvest) st.skipHarvest = true; }
    else if (relayPlan && relayPlan.relay) {
      // F-44.123: the instruction is the message that ASKED for the relay: carried on the note when her answer ran the job, else this turn's.
      const composed = await L.draft.composeDraft({ route, message: st.said || message, client: relayPlan.relay.client, vendorName: (typeof vendor.business_name === 'string' && vendor.business_name) || (typeof vendor.name === 'string' && vendor.name) || null }, { ...(deps.composerCreate ? { llmCreate: deps.composerCreate } : {}), ...(deps.listener ? { listener: deps.listener } : {}) });
      if (!composed || !composed.body) { st.lines.push(glitchLine() || DL.LINES.B3); st.keys.push('GLITCH'); st.skipHarvest = true; }
      else {
        st.wrote = true; if (!st.fallback) st.fallback = glitchLine();
        const row = await L.draft.stageDraft(supabase, { vendorId: vendor.id, phone: relayPlan.relay.phone, body: composed.body });
        if (!row) { st.lines.push(glitchLine() || DL.LINES.B3); st.keys.push('GLITCH'); }
        else {
          // THE FRAME RENDERS THE ROW: body and phone read back off the row the store returned, never the composed variable.
          const line = DL.showFrame(row.body, relayPlan.relay.client, row.couple_phone);
          st.lines.push(line || glitchLine() || DL.LINES.B3); st.keys.push(line ? 'B37' : 'GLITCH'); st.skipHarvest = true;
          st.toolCalls.push({ name: HANDS.relay, input: { recipient: relayPlan.relay.client, message: row.body, seat: `${composed.seat.provider}/${composed.seat.model}`, verbatim: composed.verbatim === true }, result: 'staged' });
          if (line) { st.relayNote = { asked: 'B37', acts: [noteAct(relays[0]), ...money.map(noteAct).filter(Boolean)].filter(Boolean), tries: 0, draft_id: String(row.id) }; relayAsked = true; }
        }
      }
    }
    if (relayAsked) moneyPlan = null; // the money act waits behind the frame's question, on its note
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
    if (st.relayNote && !st.dateAsks.length && !st.pkgAsks.length && !st.note) st.note = st.relayNote;
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
  if (why === 'relay_pwa') return { key: 'B34' }; // P6b first cut: the pwa lane's send waits for the second cut
  if (why === 'uncovered' && acts) {
    if (!acts.length) return { key: 'LEFTOVER' };
    if (acts.some((a) => !a || !COVERED.includes(a.act))) return { key: 'B34' };
    return { key: 'LEFTOVER' };
  }
  if (why === 'lookup') return { key: 'B34' }; // F-44.128 (P7 cut 2a); since cut 4, a lookup the door does not answer (tally, history, a client named)
  if (why === 'cal_mixed') return { key: 'B34' }; // P7 cut 2b: a move or cancel beside another act; one question at a time
  if (why === 'assign_many') return { key: 'B34' }; // P7 cut 3: an assignment by a day holding two or more shoots and no client names no one shoot
  if (why === 'book_no_lead') { const line = DL.render('B76', { name: say.name }); if (line) return { key: 'B76', line }; } // P7 cut 2a, his B76
  if (why === 'attach_no_lead') { const line = DL.render('B32', { name: say.name }); return line ? { key: 'B32', line } : { key: 'B30' }; }
  if (why === 'attach_unsayable') return { key: 'B30' };
  if (why === 'invoice_unresolved' && typeof say.name === 'string') { const line = DL.render('B15', { name: say.name }); if (line) return { key: 'B15', line }; }
  if (why === 'money_unsayable') { const k = say.act === 'milestone_paid' ? 'D8' : 'F29'; const line = L.lifecycle.LINES[k]; if (typeof line === 'string' && line) return { key: k, line }; }
  return { key: 'GLITCH' };
}
async function standIn(args, depsIn) {
  const answer = (key, line, out) => ({ door: true, reply: line, keys: [key], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: (out && out.ear) || null, why: (out && out.why) || 'unreachable', stood: true });
  try {
    const { supabase, out } = (args && typeof args === 'object') ? args : {};
    const deps = (depsIn && typeof depsIn === 'object') ? depsIn : {};
    if (out && out.door === true) return out;
    const k = standKey(out, lazy(deps), Number.isFinite(deps.nowMs) ? deps.nowMs : undefined);
    if (k.key === 'LEFTOVER') return answer('LEFTOVER', DL.leftover([...COVERED, ...LOOKUP_ACTS], deps.rand), out); // P7 cut 4: examples 3, 7, 8 on
    if (k.key === 'GLITCH') return answer('GLITCH', glitchLine() || DL.LINES.B3, out);
    return answer(k.key, k.line || DL.LINES[k.key], out);
  } catch (e) {
    try { console.warn('[door:standIn]', e && e.message); } catch (_e) { /* */ }
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
    const listener = { lane, provider: ear && ear.seat ? ear.seat.provider : null, model: ear && ear.seat ? ear.seat.model : null, request: ear ? ear.request : null, door: true, ...(ear && ear.reheard === true ? { heard: ear.heard === undefined ? null : ear.heard, reheard: true, ...(ear.rehear_error ? { rehear_error: ear.rehear_error } : {}) } : {}), ...(asked ? { asked } : {}), ...(askedName ? { asked_name: askedName } : {}), ...(validNote(out.note) ? { note: out.note } : {}), ...(typeof out.answered === 'string' ? { answered: out.answered } : {}), ...(ear && ear.error ? { error: ear.error } : {}) };
    res.assistantId = await memory.saveMessage(conversationId, 'assistant', out.reply, (out.toolCalls && out.toolCalls.length) ? out.toolCalls : undefined, { listener });
    if (res.assistantId) {
      try { await supabase.schema('engine').from('messages').update({ room: 'business' }).eq('id', res.assistantId); } catch (e) { console.warn('[door:room]', e && e.message); }
    }
    const row = ear && ear.usage ? meter.harvestMeterRow({ usage: ear.usage }, ear.seat && ear.seat.model) : meter.harvestMeterRow({ usage: {} }, 'door');
    await meter.writeHarvestUsage(supabase, agentId, { ...row, conversation_id: conversationId });
  } catch (e) { try { console.warn('[door:persist]', e && e.message); } catch (_e) { /* */ } }
  return res;
}

module.exports = { LOOKUP_ACTS, lookupDoor, WEEK_WORDS, kindClient, TEAM_ACTS, MEMBER_ASKS, OFFER_SLOTS, slotField, membersOf, memberWord, shootsOnDay, planAssign, insertMember, fileAssign, planReminder, fileReminder, ALREADY_LINE, MILESTONE_SELECT, CAL_QUESTION_ACTS, CAL_ASKS, SHOOT_ASKS, shootsOf, shootsById, planCal, fileCal, calQuestion, shootsQuestion, calNoteFields, CALENDAR_ACTS, NEEDS_CLIENT, planBlock, planUnblock, planBook, fileBlock, fileUnblock, fileBook, bookedLine, calendarDate, calendarKind, heardNothing, namesLiveLead, rehear, sumUsage, REHEAR_MIN_NAME, saidOf, SAID_MAX, RELAY_ASKS, planRelay, phoneRuns, foldPhone, OFFER_ASKS, nearestName, damerau1, PKG_ASKS, NAME_ASKS, DATE_ASKS, validNote, noteFor, lastDoorNote, withoutEchoedEvents, sameSpokenDay, standIn, standKey, planAttach, fileAttach, eventOnly, EVENT_WORDS, lastWasDoorNameQuestion, planLead, fileLead, phoneShaped, planPayment, planBooking, preTurn, persistDoorTurn, speakOnWhatsApp, doorAnswer, glitchLine, reread, lastWasDoorQuestion, allCovered, planMoney, planInvoice, applyRow, HEAR_BEFORE_REPLY_MS, COVERED, MONEY_ACTS, HANDS };
