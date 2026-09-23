'use strict';
// src/lib/vendor/doorLines.js  THE DOOR'S FOUNDER BYTES. ONE HOME. CE-44 LC-Victor P5.
//
// EVERY STRING A VENDOR READS FROM THE WORKING DOOR LIVES HERE AND NOWHERE ELSE. The bytes are the
// founder's: B1 to B13 ruled verbatim at R-44.21 (f), 2026-09-20 ("ill go with your ruling on all
// except no. 3"); D1 his from the CE-43 veto record (TDW_CE43_LC2_P3_HANDOVER.md:173), homeless in
// code until now; B14 his at R-44.22 (a) (F-44.58); B1 and B2 end "Reply YES or NO." by his word at R-44.24; the leftover line and its twelve examples R-44.18's, the first reworded by his
// yes at R-44.21 (e) (F-44.54). D3 to D8 and F29 are NOT here: they keep their one home in
// lifecycleHands.js LINES and the door reads them from there. B16 to B21 (P6a-1, the lead half) his at
// R-44.34 ("yes to all", 21 September 2026), carried verbatim from TDW_CE44_LCV6_SEAT_CLOSE.md §4.
// B15's key is owed by the last packet and stays free. B22 to B28 (P6a-2, CE-44 LCV-8) his at R-44.34 and R-44.35,
// carried verbatim from the same §4; B29 and B30 are his bytes REUSED from the pwa, each named at its line below.
//
// HASH-CARRIED, AS victorLines.js IS (CE-207): each template is frozen as bytes; LINE_HASHES pins the
// sha256 of each as a literal; assertLineHashes() runs AT LOAD, so a process that requires this file
// with an edited byte dies at boot rather than speaking an unvetoed sentence; b90 pins the literals.
// An edit that is not also a veto is caught twice, by two mechanisms different in kind.
//
// A TEMPLATE IS RENDERED, NEVER RE-WORDED. {slots} are filled by render(); nothing else is added.
// Byte 13's no-client form is DERIVED here by dropping " for {client}", exactly as the WhatsApp
// lane's conditional has always rendered it (b80 V1_NOCLIENT), so both lanes speak one sentence.
//
// THE LEFTOVER LINE AND ITS EXAMPLES WENT LIVE AT LCV-9 PART ONE (R-44.37, the founder, 21 September 2026: the chain
// leaves the working rooms NOW; R-44.21 (a)'s "carried unused" is superseded). They are read through ONE builder,
// leftover() below, and the door calls it in ONE place. AN EXAMPLE IS SHOWN ONLY WHEN THE DOOR COVERS ITS ACT:
// EXAMPLE_ACTS carries example → act, so each later packet switches its example on by covering its act.
// B15 (R-44.27, his; owed by the packet in which the chain leaves, which is this one), B32 (R-44.36) and B34
// (R-44.38, his "yes" to the chair's proposal) entered with the same cut. B35 (R-44.39) entered with LCV-10 Part B-2's first cut; B31 and
// B33 (R-44.36, F-44.102) with its second.
//
// TOTAL: render() and every line builder below never throw; a slot that cannot be filled yields null
// and the caller speaks nothing from it (the door then stands aside to the chain).

const crypto = require('crypto');

const LINES = Object.freeze({
  // the payment confirmation question (staged; she said a payment arrived)
  B1: "Mark this payment? {client} · {which payment} · Rs {amount} · {date}. Reply YES or NO.",
  // the booking confirmation question (staged; she said a booking is confirmed or an advance came)
  B2: "Confirm this booking? {client} · {package} · Rs {total}. Reply YES or NO.",
  // her no to a staged money act
  B3: "Okay. Nothing was changed.",
  // a booking on a name with no lead (F-44.5)
  B4: "Could not confirm the booking. No lead called {name}. Add the lead first.",
  // a booking whose lead has no live package
  B5: "Could not confirm the booking. {client} has no package yet. Attach a package first.",
  // an advance or payment with no date said
  B6: "When did the payment come in?",
  // a date the door cannot read
  B7: "I could not read that date. Say it like 5 December.",
  // two clients share the name she used (F-44.9, F-44.16)
  B8: "Two clients are called {name}: {name} ({date}) · {name} ({date}). Say which one.",
  // an invoice SERVED (F-44.49)
  B9: "Invoice {number} for {client} is already made. Find it in the invoices list.",
  // more than one live invoice on her client
  B10: "{client} has {n} invoices: {numbers}. Which one?",
  // an invoice asked for a client with no fee
  B11: "Could not make the invoice. {client} has no fee yet.",
  // a second money act in one message
  B12: "One payment at a time. Tell me the next one after this.",
  // an invoice MINTED; V1, the ONE invoice sentence on BOTH lanes (F-44.48, F-43.34)
  B13: "Invoice {number} for {client} is ready. Find it in the invoices list.",
  // a bare yes or no answering the door's OWN question after it lapsed (F-44.58; R-44.22 (a), his, verbatim)
  B14: "That request timed out. Nothing was changed. Say it again.",
  // an invoice asked for a name no client carries (R-44.27, his, verbatim; F-44.57's ruling superseded). No-hits ONLY:
  // a read that failed is not a name that does not exist.
  B15: "Could not make the invoice. No client called {name}.",
  // P6a-1 · a lead filed by the door, no date (R-44.34)
  B16: "Lead added: {client}.",
  // a lead filed by the door with its wedding date
  B17: "Lead added: {client} · {date}.",
  // a lead act with no name
  B18: "Who is the lead? Say the name.",
  // createLead answered deduped: the number is on a lead already ({client} from the RETURNED row)
  B19: "That number is already on {client}. Nothing new was added.",
  // createLead refused, or the write failed
  B20: "Could not add the lead.",
  // a wedding date in the past, or outside this year through five years on (F-44.66)
  B21: "That wedding date cannot be right. Say it like 5 December 2027.",
  // P6a-2 · a package attached by the door; every slot from the lead_package ROW attachPackage returned (R-44.33, R-44.34)
  B22: "Package attached: {client} · {package} · Rs {total}.",
  // no package of hers by that name; {list} is HER OWN live names joined with " · "
  B23: "You have no package called {name}. Yours are: {list}.",
  // two of her packages share the name (rendered by position, as B8 is)
  B24: "Two packages are called {name}: {name} (Rs {total}) · {name} (Rs {total}). Say which one.",
  // the lead has no day-precision wedding date (computeSchedule's no_wedding_date)
  B25: "Could not attach the package. {client} has no wedding date yet. Add the date first.",
  // a handover package and no delivery date said, or one equal to the wedding date (R-44.34 (b), R-44.35, F-44.92)
  B26: "When is the delivery date for {client}?",
  // a handover package attached; the delivery date from the ROW
  B27: "Package attached: {client} · {package} · Rs {total} · Delivery {date}.",
  // a delivery date in the past or outside this year through five years on. Provenance, in the chair's terms (LCV-6 seat
  // close §4): proposed by the chair as B21's twin "in whichever word he picked"; he answered B and changed nothing;
  // recorded as his on that basis; he may still reword it.
  B28: "That delivery date cannot be right. Say it like 5 December 2027.",
  // R-44.12's sentence, HIS, REUSE and not a new veto: bytes IDENTICAL to dreamos-pwa lib/worklist/packages.ts:126
  // (refusals.already_booked). A dream-os bench cannot read the pwa on his machine, so the pin is the hash literal.
  B29: "This couple is booked. The package is fixed on their invoice.",
  // REUSE, not a new veto (the chair's ruling, 21 September): bytes IDENTICAL to dreamos-pwa lib/worklist/packages.ts:73
  // (attachFailed; that file's header records his veto of 2026-09-17 on every string in the LC-2 read-first). Spoken for
  // attachPackage's 500, bad_package, no_fee and invalid, and for any throw.
  // B31 (the which-package question, his at R-44.36) and B33 enter with LCV-9 Part Two; their keys stay free until then.
  B30: "Could not attach the package.",
  // an attach that names a client and NO package (R-44.36; LCV-10 Part B-2, second cut): the door never guesses, even with one package;
  // {list} is HER OWN live package names, sorted by name case-folded (F-44.108), joined with " · ". The door keeps its own note of it.
  B31: "Which package? Yours are: {list}.",
  // REUSE (F-44.102): his own byte from dreamos-pwa lib/worklist/packages.ts:116, `no_fee: 'Set the fee first.'`, in place of the general
  // B30 when the attach refuses because the package has no fee.
  B33: "Set the fee first.",
  // R-44.40 (the founder, 22 September: "Did you mean {name}? Reply YES or NO." is GREEN, HIS): when a client or package she named matches
  // no row of hers and EXACTLY ONE of her rows sits within the pinned distance, the door asks this and ACTS ON NOTHING until her YES.
  B36: "Did you mean {name}? Reply YES or NO.",
  // an attach whose client is no lead of hers (R-44.36, HIS, verbatim: "yes to your open earlirr questions")
  B32: "Could not attach the package. No lead called {name}. Add the lead first.",
  // an act HEARD that the door does not cover yet, a mixed message holding one, or a lead carrying a phone-shaped
  // number (R-44.38, HIS: the chair proposed the byte and his word was "yes"). Nothing is written on such a turn.
  B34: "I cannot do that by message yet. Use the app for it.",
  // a job the door knows (a booking, a payment, an invoice, an attach) that names NO client (R-44.39, HIS: "Yes to your recomendation";
  // LCV-10 Part B-2, first cut). `lead` keeps B18. The door keeps its own note of it (meta.listener.note), as it does for B18.
  B35: "Which client? Say the name.",
  // P6b (CE-45 LCV-11, the first cut): THE SHOW FRAME, HIS. The August frame (relaySeat.js showBlock, vetoed 2026-08-11) with its last
  // line ruled on 22 September 2026 (R-44.24 applied to the frame; his word "this"): a question to her ends "Reply YES or NO." {body} is
  // the STORED draft row's own bytes, read back; {phone} is the stored byte verbatim, never formatted (R-5). A row whose name IS the phone
  // (F-06.186) renders through showFrame() below, which drops " ({phone})" and places the phone, as recipientLabel has always rendered it.
  B37: "Here is the draft:\n\n\"{body}\"\n\nSend this to {client} ({phone})? Reply YES or NO.",
  // a message asked for a name no client of hers carries (his, 22 September 2026, "1 is fine"; B15's shape). No-hits only.
  B38: "Could not send the message. No client called {name}.",
  // a quote asked for a lead with no live package (his, 22 September 2026, "ok"). CARRIED in this cut, spoken when quote_send is covered.
  B39: "Could not send the quote. {client} has no package yet. Attach a package first.",
  // ── P7 (CE-45 LCV-12), THE CALENDAR'S BYTES, all his, ruled 23 September 2026 ("All proposed lines accepted", "yes to all", "ok"). B47 is NOT a byte here: it is
  // the checker's own clash sentence, conflict.message, spoken verbatim (his by B4's blessing). B48 to B53 are 2b's, B56 to B62 cut three's, B67 to B74 cut four's.
  // P7 cut 2a · a day blocked by the door (his, 23 September 2026, "All proposed lines accepted"); {date} full month, {reason} the RETURNED row's own; no reason drops " · {reason}" through blockedLine() below, as byte 13 drops " for {client}"
  B40: "Blocked: {date} · {reason}.",
  // REUSE: his chain-era line, blockHands.js :156 (CE-blessed 2026-07-15; the month in full since F-44.62). Spoken ONLY on blockDate's exact 'Already blocked.'
  B41: "{date} was already blocked. Nothing changed.",
  // REUSE: his blockHands.js :157, spoken when the writer refused with NO sentence of its own (a throw); a writer's own refusal sentence is spoken verbatim instead
  B42: "Couldn't block {date} — nothing was written. Try again or block it from the calendar.",
  // REUSE: his blockHands.js :165
  B43: "Unblocked: {date}. The day's back on your calendar.",
  // REUSE: his blockHands.js :166. Spoken ONLY on unblockDate's exact 'Block not found.' (F-44.65 and F-44.72 close on this row)
  B44: "{date} wasn't blocked. Nothing changed.",
  // REUSE: his blockHands.js :167
  B45: "Couldn't unblock {date} — nothing was written. Try again or unblock it from the calendar.",
  // a shoot booked by the door; every slot from the events ROW writeEvent returned (his, 23 September 2026)
  B46: "Booked: {client} · shoot · {date}.",
  // P7 cut 2b (CE-45 LCV-13) · MOVE AND CANCEL A SHOOT, all his (22 and 23 September 2026, "All proposed lines accepted", "yes to all"). B48 and B50 are ASKED:
  // nothing moves until her YES. {client} is the LEAD ROW's name; B48's {date} the new day as the door read it; B50's {date} the SHOOT ROW's own day.
  B48: "Move {client}'s shoot to {date}? Reply YES or NO.",
  // her YES to B48: every slot from the events ROW writeEvent returned
  B49: "Moved: {client} · shoot · {date}.",
  B50: "Cancel {client}'s shoot on {date}? Reply YES or NO.",
  // her YES to B50: every slot from the events ROW writeEvent returned
  B51: "Cancelled: {client} · shoot · {date}.",
  // a lead of hers with no upcoming shoot on the calendar (a said day on a cancel narrows the read first)
  B52: "No shoot for {client} on the calendar.",
  // two or more upcoming shoots for her lead: rendered BY POSITION through shootsLine() below (repeated slots, as B8 is); three or more extend the
  // list by the same " · " (the chair's K5 ruling, derived and disclosed as B40's no-reason form is). The door keeps its OWN note (SHOOT_ASKS).
  B53: "Two shoots for {client}: {date} · {date}. Say the date.",
  // a calendar act with no date (his, 23 September 2026; B7's register). A DATE note of the door's own kind: her whole next message is the day
  B54: "Which day? Say it like 5 December.",
  // P7 cut 3 (CE-45 LCV-14) · THE TEAM AND THE PAYMENT REMINDER, all his (22 and 23 September 2026, "All proposed lines accepted"; LCV-12's designs file
  // §3.3 and §3.4, sha256 05b449610210…). {member} is the TEAM_MEMBERS ROW's name; {client} and {date} the EVENTS ROW's title and day.
  // a team member added by the door (the row the insert returned)
  B56: "Added to the team: {member}.",
  // a team add for a name already on her active team (exact under key())
  B57: "{member} is already on your team.",
  // a member assigned to a shoot: every slot from the member row and the events ROW writeEvent returned
  B58: "Assigned: {member} · {client} · shoot · {date}.",
  // the member is already in the shoot's assigned_member_ids
  B59: "{member}'s already on the {client} shoot.",
  // CARRIED, UNSPOKEN (the chair's ruling of 23 September on ASK 2; the bytes from his veto sheet of 22 September, held by the chair): rendered nowhere
  // in P7, no exit reaches it, as B39 and B77 were carried before their cut
  B60: "No one called {name} on your team. Add them first.",
  // two active members share the name: rendered BY POSITION through membersLine() below, as B8 is; three or more take R-45.9's derived form
  B61: "Two on your team are called {name}: {name} ({role}) · {name} ({role}). Say which one.",
  // an assignment naming no member. The door keeps its OWN note (MEMBER_ASKS): her whole next message is the member
  B62: "Who? Say the name.",
  // a payment reminder SENT: {client} the LEAD ROW's name; {milestone}, {amount}, {date} the payment_schedules ROW's own
  B67: "Reminder sent to {client}: {milestone} · Rs {amount} · due {date}.",
  // a lead of hers with no pending payment on a live invoice
  B68: "Nothing is due from {client}.",
  // P7 cut 4 (CE-45 LCV-14) · THE LOOKUPS, all his (22 September 2026, "All proposed lines accepted"; LCV-12's designs file §4.2 to §4.4, sha256 05b449610210…,
  // extracted by script). ASK 7 (the chair, 23 September): each FORM is its own hash-carried key, so no byte holds two shapes: B72/B78 the day's two line
  // forms, B73/B79 the week's. Every figure, name and date is a ROW's.
  // the new leads, by position through newLeadsLine() below (his two-lead shape; one or three and more derived and disclosed; no date drops " ({date})")
  B69: "New leads: {name} ({date}) · {name} ({date}).",
  B70: "No new leads.",
  // a day with no live row
  B71: "{date} is free.",
  // a block on the day; the reason is the ROW's notes (no reason: "{date}: blocked." derived, as B40's no-reason form is)
  B72: "{date}: blocked — {reason}.",
  // a booking on the day: {client} the ROW's title (a non-shoot kind places its own kind word, derived as B46's is). NO full stop, exactly as he accepted it
  B78: "{date}: {client} · shoot",
  // a pending milestone due this week (today through today plus six, IST): every slot from the payment_schedules ROW and its invoice's client_name
  B73: "Due this week: {client} · {milestone} · Rs {amount} · {date}.",
  // an upcoming shoot this week: the ROW's title and day
  B79: "This week: {client} · shoot · {date}.",
  B74: "Nothing due this week.",
  // P7 cut 4 FIX (CE-45 LCV-14; F-44.136, R-45.12; his, 23 September 2026, "ill go with your recomendations" and "ok"):
  // what is owed across open invoices: {total} readOutstanding's summary.total_outstanding (the ONE derivation), {n} its rows in OUTSTANDING_STATES
  B80: "Owed to you: Rs {total} across {n} open invoices.",
  // new leads with no name (two or more); exactly one reads B83
  B81: "{n} new enquiries have no name yet. Add their names in the app.",
  // nothing owed (a zero total), in place of B80
  B82: "Nothing is owed to you right now.",
  // exactly one new lead with no name (B81's singular, its own key)
  B83: "1 new enquiry has no name yet. Add its name in the app.",
  // REUSE (his "ok", 23 September 2026): the chain's own refusal line, calendarSignals.js :134, byte for byte; spoken when writeEvent refused a booking with no conflict sentence and no error sentence
  B75: "Couldn't put that on the calendar — nothing was changed.",
  // a calendar or reminder job for a name that is no lead of hers (his "ok", 23 September 2026; B4's tail): one line for book, move, cancel and remind
  B76: "No lead called {name}. Add the lead first.",
  // an assignment by date alone with no shoot on that day (his "ok", 23 September 2026). CARRIED in 2a, spoken from cut three
  B77: "No shoot on {date}.",
  // a booking made (vetoed CE-43, TDW_CE43_LC2_P3_HANDOVER.md:173; homeless until P5)
  D1: "Booked: {client}. Client, event and invoice {number} are ready.",
  // R-44.18; LIVE since LCV-9 Part One (R-44.37): spoken when NO ACT was heard, followed by two covered examples
  LEFTOVER: "I didn't catch a task in that. You can say things like:",
});

// Withdrawn, not to reappear (F-44.54, R-44.21 (e)): the first example's old wording,
// "The Sharma wedding is confirmed for 5 December, fee 60,000". It named a fee the door never writes.
const EXAMPLES = Object.freeze([
  "The Sharma booking is confirmed",
  "The advance came in today for the Kapoor booking",
  "Am I free on 14 February?",
  "Block 20 March, personal",
  "Move the Verma shoot to 22 November",
  "Raise the invoice for the Bose wedding",
  "Who are my new leads?",
  "What's due this week?",
  "Add a new lead, haldi shoot on 3 January",
  "Send a message to my client asking for the advance",
  "Add Priya to the team for the 5 December wedding",
  "Assign Harsh to the 14 February shoot",
]);

// EXAMPLE → ACT, BY POSITION (LCV-9 Part One, the chair's kickoff): the listener's act each example asks for. An example
// is shown only when the door COVERS its act today. attach_package has no example until he approves one.
const EXAMPLE_ACTS = Object.freeze([
  'booking_confirmed', 'advance_paid', 'date', 'block_date', 'edit_event', 'invoice',
  'find', 'whatsdue', 'lead', 'relay', 'assign_crew', 'assign_crew',
]);

const LINE_HASHES = Object.freeze({
  B1: '1fb5297d3c1193543d8385e514fe42b1856be16deb6cabf2e83cf036169ed4ba',
  B2: 'cd29bd0dfbde4e0dba9cf4df73e12bc7b69880aea0337562e77d96228e8259eb',
  B3: 'a6a5c9b1c22d6a82413e6bb856363e8a98e902a4b092368a16ef21bb6b30066d',
  B4: '2dff7d6656c93fa39dd45da087484bb39ef3751b00a0c2e1ca7d4b3503068684',
  B5: 'c628ff61df8eec8e034ec24ac22d2e6b54e060eeb460260d32a6f2d9fa84d190',
  B6: '728d219fdb8a4ce07778dcf346665975d7ab651f7501efa6ff3f8a7144eb3029',
  B7: '44b5c385d187f3cc29ce05c210a524a8be162ab127f2bf97cbe22bc90dd8e331',
  B8: 'ecf5d241deae90b77bc9d840928aacc2a1fc781f3fd2b6ea9cb2a25db7675166',
  B9: '3253966dab22fb365c4f8ed5e0676c1c6196f6df7e3f47a122d1e32d00a0faa2',
  B10: 'c82103b3177a6a44cafcf364be426df89901ab0407fd3776092a84b3afcad81d',
  B11: '90f1edf7055b45d6c898df911ba442b70b47119f2523a5c8b7bfdd8dd00cb8ed',
  B12: '7723dc04452784fe3c6e7b1e9d145fa1323048aaa39da70a9d52aeae2c22ee09',
  B13: '45f9284524fc2546d8ca5a34ae51d036efc1a887f2104a35a473e283dda9658c',
  B14: '68dbaf45c2129785ac3e0644f30973d1ee8a8d3838313a6069b3417b8a4b2249',
  B15: 'f5a96043bb86272066b085f699a88d0aa4adbeb04871d6b95ea59e7f56db5ab0',
  B16: 'a7fe91f49891ed319667b750d32ddcd55dabda117f328f7f0712f685c20b3830',
  B17: 'b332f4de8e4698181a5d67735814f183a25319abdfa568c3e56b4040f24e8927',
  B18: 'f6d70e738f124ab29e818590116913b8cb744e777f722c7157e70dbe0ca366a0',
  B19: 'ec10d50e073b11a83206a1c89c276be61f0e476bee762671d383820d74ecfaf8',
  B20: 'fcfa046d1cf3e8191d12637a6d707078d093df2c5d191b499a6491877d925653',
  B21: 'ceb7ebc7a3efd2b7d2ff2250c3fff652146624c6bdb7065f28cfe255c52ba9ed',
  B22: 'bbca851eb1d8df31d57d2ff778b67db8bea5e84e10975efe138b36e82db2823c',
  B23: '5c68d52e310188c9a5d678ba495885cae0ad96236fc7d101435c5fa0e0ce4c2c',
  B24: '85943481b6496e4cda801f3865c1bdbfa80b760e0f82dcec5a3a2e5d57b57c8a',
  B25: '54da33cf13d4a3bb0d19333f1f5fa540fbf196af9f1cdd2b2e1b454c8a3f475f',
  B26: 'ddf2ed942fc9b724116dfd16bf117789dfbbab07cea4a023fdee62120f702484',
  B27: 'fcbbbddfd50565bfac2269cae1570d550ec93055609e2b5d70c407949879473d',
  B28: 'a2d7f31aa0ba6c0f3238cebe4791d4d610b31d1eb37085b20a81ecf9bb85b986',
  B29: 'a3f8c714b924542bafba121ffdb08248f4c0cb34080d9c907088dcfb143ea14d',
  B30: '5b79740334d8529ab36a64d1dda786c35d403d794b27ed44fcf6a7faf7cff927',
  B32: '136ff0b0c57e5145267570a25752ed723c9f1fad59eca74ee37e884d1607a704',
  B34: '3dc0787ed3e775e75d9d838cf0a87f7ef66d43e499fa665c107a466dfa76b4eb',
  B35: '7b73fec4bc3c30e66b5e33232961ccb26549d42d440d466e6e8de54402c1c773',
  B31: 'b84530f75e2567ea8b74b1b4901fa9a2f67ba70c3707e8135d4b4a539e612a75',
  B33: '7f0c3cc354957b993bbf52493a43434f9c0795ef44491ed1605c3a060ec69f34',
  B36: '43b514de672ba94fbd24698a7fe9d18389958812a6d7344b0efab074bacd75d2',
  B37: 'ad97fcf023e467590037f5329db9feb9d578be116a1867c4e98bd17b278ded80',
  B38: '8fbfa96dca05fc83417a6cd5efe7d7a2f63a888bb4a8c18f4f5a9680ea97025e',
  B39: '1702a3c82a88f751752869986ba88c70a73b0fc6e93d14a8b13cff40442eac76',
  B40: '1bec09f1e5d35c0c197a9229bba817744e1f995133bce2fcae722c5093e5eee3',
  B41: '6d882045d5fca760cce1f3dd1393bc6b6f3b23cea11f59a810dc910a51ea0b03',
  B42: 'a41ef8b9fe7281b7cd06c2ad7e99cac57ac6c6a5f85e611915b543560247b651',
  B43: 'b78f22148ed8f80aa71e2ba0e5311fb8f7d1d8798fd5b8631befb263924db0ad',
  B44: '2e8457a7173407d2b6166c895ad03188a19a174e3307a008e084996354ede0e5',
  B45: 'b4363bbbfc3f29c23b913cc26c88f1586c5a8b2b040e15da9b42cd00c8abcf6e',
  B46: 'e06955310af567757977dc641dd8231d410bc582014e0ea62d4cb67ffbd820f1',
  B48: 'fb8734312f58ff98f2061be1e6559996f7ac7d7ae0c05910094d72257b39239e',
  B49: '420a5f16d6dd179e663e5f64e2cae71499cbd3114034b533ed4c033f24b935a1',
  B50: '11ff0598c04b4779886e7d4555eb3a7e8827643ec2191236da9b78b501e86dc4',
  B51: '6e87ed6e362b53c41a0feedceb97a5460e88ee8cc836026ba7ed67bf8ad02216',
  B52: '6b8b4700bc8bae40c3a656339c756092791c393d34fb927ec7c9618017e6b1eb',
  B53: 'fd391aa7f9c88cfb1a5bdc18a3544be87c514728adc6caacf883b1c2cf9651e3',
  B54: 'fc952e30b355667df5891a96d09a99894f5f1100c026af515a41a5dbf69cc6ab',
  B56: 'd434900fe046a14f2bc58dec7d35f367f4fac70d99b08a849b7cf2be1b064b5a',
  B57: '992956ec3f4de01d0a5de21e3703a4c3d0cf3e1f6e9b627aac4e14329639a9e4',
  B58: '73b92a93a9b8c1fb51dad5aff7d87309bbca7909b86fe9402f26b8d2c250fc20',
  B59: '306e713bae4ef8766639d333200a49e3149fe7c1c2a7e47a3b45336b01485a03',
  B60: '95a4dfa8101a8f0af4b9db1c173d41ce1fc72392746dd175c3dbfb5236276f4a',
  B61: '646620f66e3229cbd4d7bf322d8a6a0ec211531822c0a4af6b9d6e2c31b2627e',
  B62: '13adf3035c94c14c96159d2c831ee3d37d8d8996c391252c1b4a808c1ca90265',
  B67: '3a7aeb7f1301e6f4a80b6e3f0ec2b5e0405fe916ace395f6e3eb3b4fe0589cbc',
  B68: '60ad19c5dfdfc5e50b4a72bb470f722649049554cfb64ea2ab6866f82585e415',
  B69: '2529a488e7bc47337286f6737fae1b6fc061cc23c736495266546a307cbda459',
  B70: '1eb19e7ff80596105866e91a70f1c38ae50991c426035af5ad1d423395d64b31',
  B71: 'b2a93cd4ed88977434dc30f6dafe1fba387a867a6dccb5bef56b5add43022cdb',
  B72: 'caae4be489ef24c9743d11dba40370bd211ed83b8a1859a1a6f04b445273baae',
  B73: '56afe8b641accbc202b22462b85326cdd6c92255e50f00b49dc6bf5b9a00ff0a',
  B74: '047bd5c99a6e6c5a58fd6ea168a30fdf9d7fa34d0e184f55580937da31ecfdd5',
  B80: '08f216a15644ce1b9202096dac24349c2d8cc0e16f022891bb9d87110af61ea2',
  B81: 'f32090f8bc1ba08c6b14f85182ef9bc3a639c9b50cd790e65313181d0f85d5cd',
  B82: '70d5189141b9cbd8092834919995f3cb16edadff17d2023989d26cf6ef49435b',
  B83: 'ec1816251b9cfde6078edb4da2fa4b4499c9b7d68ec38ae17d6e09b17c7497e0',
  B78: '575f97d619bae91397ffdd31267bc10dfea25b5ae8c12bf83b5e6d498b6d1d4a',
  B79: '6f951e48eb5ff2bb7e3a2af443de08a1f2bc7aad7aa6ef82a0f372441e6d3e74',
  B75: '1d87cfb5ba7b1c70fd81fa3d0019f4acfe0bbdb7642a047802577ae9e182b209',
  B76: '24806f0f4b20434cfa74fab706e5d2c4be7f238202ecb483ae58c6daef31c0ab',
  B77: '756908b48584d5cfbedc716eb21307d3c7a50fd7d3ad3210677e6f3bfe8a3a6c',
  D1: '1a7d3901e2d0a7a72709b471bcd010931aff7ddd002ed34b9c001b463df3e8ee',
  LEFTOVER: '05f4c9a3b74e98344db56fe642a0774eae8bddb61ff5f672699eaa33fea087ae',
});
const EXAMPLE_HASHES = Object.freeze([
  'fe08c1ab037beded35919903f7a9aeefa944240cedde53e164513644003f57ff',
  'd525b7f89d5d1b4c76f02e4878652d7fe53284ae92b103ef14e5a070a2baa5eb',
  '8cefbe51632b13e644e41aacdd59b311f0909b0809007fc4ee62ff61c183fbde',
  '4789c77785b5fe48dc4b4efad0885ea33adf526922adb564a76c369c948d5e7d',
  '9769184556f8244197b9c491977173803690b85275669948364be0b3cf71826e',
  '95484ebfab2b87e567e91c51558dd0bc8cba9b473e04bc74e70fd90d29172674',
  'c746f06d03a6aaac00051e7fd6d11a658df7db5a3382d065a3a1f727719509c2',
  'd532658665d5d7be41f604be8da738b2359173c25470ba85d11de2487e7bd20b',
  'f692843a93232f8deb147fd5de077ead7783f2e527c864da3606fe99e8f1b6b2',
  '0e95fefd5f54766a5f0f4c410538f68c9621aa1f76194f40bb74cbef1bd08015',
  '0b76fda7b9ada4e47434912e18b6ae2fc483a228cf2e31affb7d73ee6b7898ac',
  'c059eed101aae8544acb5abffe88e2cfd1c3cb079227b1bf017bab49c8fbd1ae',
]);

function sha256(s) { return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex'); }

function assertLineHashes() {
  const drift = [];
  for (const k of Object.keys(LINES)) if (LINE_HASHES[k] !== sha256(LINES[k])) drift.push(k);
  if (Object.keys(LINE_HASHES).length !== Object.keys(LINES).length) drift.push('key set');
  EXAMPLES.forEach((e, i) => { if (EXAMPLE_HASHES[i] !== sha256(e)) drift.push(`EXAMPLE ${i + 1}`); });
  if (EXAMPLE_HASHES.length !== EXAMPLES.length) drift.push('example count');
  if (EXAMPLE_ACTS.length !== EXAMPLES.length) drift.push('example acts');
  if (drift.length) throw new Error('doorLines.js: APPROVED COPY DRIFT (R-44.21, hash-carried). An edit to a founder byte is a FRESH VETO: ' + drift.join(', '));
  return true;
}
assertLineHashes();

// One slot value as text, or null when it is not a usable string or number.
function slot(v) {
  try {
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    if (typeof v === 'string' && v.trim()) return v.trim();
    return null;
  } catch (_e) { return null; }
}

// render(key, values): the template with every {slot} filled. TOTAL: an unknown key, a missing or
// unusable value, or anything thrown yields null. Values are never re-worded, only placed.
function render(key, values) {
  try {
    if (typeof key !== 'string' || !Object.prototype.hasOwnProperty.call(LINES, key)) return null;
    const vals = (values && typeof values === 'object') ? values : {};
    let missing = false;
    const out = LINES[key].replace(/\{([a-z ]+)\}/g, (_m, name) => {
      const s = slot(vals[name]);
      if (s === null) { missing = true; return ''; }
      return s;
    });
    return missing ? null : out;
  } catch (_e) { return null; }
}

// Byte 13, both lanes: the invoice sentence. No client: " for {client}" is dropped, as V1 always did.
function invoiceReady(number, client) {
  try {
    const n = slot(number);
    if (n === null) return null;
    const c = slot(client);
    if (c === null) return LINES.B13.replace(' for {client}', '').replace('{number}', n);
    return render('B13', { number: n, client: c });
  } catch (_e) { return null; }
}

// Byte 8 has repeated slots, so it is rendered by position: the name she used, then exactly TWO
// candidates, each a name and a full-month date. Anything else is null (the door stands aside).
function twoClients(name, candidates) {
  try {
    const n = slot(name);
    if (n === null || !Array.isArray(candidates) || candidates.length !== 2) return null;
    const parts = candidates.map((x) => [slot(x && x.name), slot(x && x.date)]);
    if (parts.some(([a, b]) => a === null || b === null)) return null;
    const fill = [n, parts[0][0], parts[0][1], parts[1][0], parts[1][1]];
    let i = 0;
    return LINES.B8.replace(/\{(name|date)\}/g, () => fill[i++]);
  } catch (_e) { return null; }
}

// Byte 24 has repeated slots, as byte 8 has: the name she used, then exactly TWO packages, each its own name and
// its total in Indian grouping WITHOUT the letters (the template carries "Rs"). Anything else is null.
function twoPackages(name, candidates) {
  try {
    const n = slot(name);
    if (n === null || !Array.isArray(candidates) || candidates.length !== 2) return null;
    const parts = candidates.map((x) => [slot(x && x.name), slot(x && x.total)]);
    if (parts.some(([a, b]) => a === null || b === null)) return null;
    const fill = [n, parts[0][0], parts[0][1], parts[1][0], parts[1][1]];
    let i = 0;
    return LINES.B24.replace(/\{(name|total)\}/g, () => fill[i++]);
  } catch (_e) { return null; }
}

// Byte 23's and byte 31's {list}: HER OWN package names, SORTED BY NAME CASE-FOLDED (F-44.108), joined with " · ". No usable name is null.
const sortedNames = (names) => {
  if (!Array.isArray(names)) return null;
  const list = names.map(slot).filter((x) => x !== null).sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0));
  return list.length ? list.join(' · ') : null;
};
function noSuchPackage(name, names) {
  try { const list = sortedNames(names); return list === null ? null : render('B23', { name, list }); } catch (_e) { return null; }
}
function whichPackage(names) {
  try { const list = sortedNames(names); return list === null ? null : render('B31', { list }); } catch (_e) { return null; }
}

// Byte 37, the show frame, rendered from the STORED row: body and phone are the row's bytes, the name is the lead's. A name that is
// the phone itself (relaySeat.looksLikeThePhone, F-06.186) or no name at all renders the phone alone: " ({phone})" is dropped and the
// phone placed, exactly as byte 13 drops " for {client}", so both shapes speak one sentence. TOTAL: null when the body or phone is unusable.
function showFrame(body, client, phone) {
  try {
    const b = typeof body === 'string' && body.trim() ? body : null; // the body is placed as stored, untrimmed, never re-worded
    const p = slot(phone);
    if (b === null || p === null) return null;
    const c = slot(client);
    let phoneOnly = c === null;
    if (!phoneOnly) { try { phoneOnly = require('./relaySeat').looksLikeThePhone(c, p); } catch (_e) { phoneOnly = false; } }
    if (phoneOnly) return LINES.B37.replace(' ({phone})', '').replace('{body}', b).replace('{client}', p);
    return LINES.B37.replace('{body}', b).replace('{client}', c).replace('{phone}', p);
  } catch (_e) { return null; }
}

// Byte 40, the block read-back: {date} and, when the ROW carries a reason, " · {reason}"; no reason drops that part, as byte 13 drops " for {client}".
function blockedLine(date, reason) {
  try {
    const d = slot(date);
    if (d === null) return null;
    const r = slot(reason);
    if (r === null) return LINES.B40.replace(' · {reason}', '').replace('{date}', d);
    return render('B40', { date: d, reason: r });
  } catch (_e) { return null; }
}

// Byte 53 has repeated slots, as byte 8 has: the client, then the shoots' days (full month), IN THE ORDER GIVEN. Exactly two fills his template verbatim.
// THREE OR MORE (R-45.9, the founder, 23 September 2026, "ill go with your recomendation"): the word "Two" becomes the count as a numeral and the list
// extends by the same " · " ("3 shoots for {client}: {date} · {date} · {date}. Say the date."); a derivation of his byte, disclosed as B40's no-reason form
// is; the hash-carried template is unchanged. Fewer than two, or any unusable value, is null.
function shootsLine(client, dates) {
  try {
    const c = slot(client);
    if (c === null || !Array.isArray(dates) || dates.length < 2) return null;
    const ds = dates.map(slot);
    if (ds.some((d) => d === null)) return null;
    const two = LINES.B53.replace('{client}', c).replace('{date}', ds[0]).replace('{date}', ds[1]);
    if (ds.length === 2) return two;
    return `${ds.length}${two.slice('Two'.length)}`.replace(`${ds[0]} · ${ds[1]}.`, `${ds.join(' · ')}.`);
  } catch (_e) { return null; }
}

// Byte 61 has repeated slots, as byte 8 has: the name she used, then the members IN THE ORDER GIVEN, each its own row name and a word that tells
// them apart ({role}: the row's role; with no role, the phone's last four; else the day the row was added, full month; that fallback is the
// designs file's §3.3). Exactly two fills his template verbatim. THREE OR MORE take R-45.9's derived form, as shootsLine() does: the word
// "Two" becomes the count as a numeral and the list extends by the same " · " ("3 on your team are called {name}: … Say which one."). Fewer than
// two, or any unusable value, is null.
function membersLine(name, members) {
  try {
    const n = slot(name);
    if (n === null || !Array.isArray(members) || members.length < 2) return null;
    const parts = members.map((x) => [slot(x && x.name), slot(x && x.role)]);
    if (parts.some(([a, b]) => a === null || b === null)) return null;
    const one = (p) => `${p[0]} (${p[1]})`;
    const two = LINES.B61.replace('{name}', n).replace('{name} ({role}) · {name} ({role})', `${one(parts[0])} · ${one(parts[1])}`);
    if (parts.length === 2) return two;
    return `${parts.length}${two.slice('Two'.length)}`.replace(`${one(parts[0])} · ${one(parts[1])}.`, `${parts.map(one).join(' · ')}.`);
  } catch (_e) { return null; }
}

// P7 cut 4 · the new leads, B69 by position: "New leads: " then each lead as "{name} ({date})" (no date: "{name}" alone, derived) joined by " · ", then ".".
// Exactly two dated leads fill his template verbatim; one, or three and more, extend it by the same " · " (derived, disclosed). The caller passes at most
// the cap (twenty) and speaks B70 for none. Any unusable value is null.
// THE FIX (F-44.136; Q4, R-45.12): the caller passes the named leads it will speak (five, newest first) and how many MORE named leads remain; more > 0 ends
// the line with the derived tail " and {n} more." in place of the closing "." (disclosed). A nameless lead never reaches this builder (B81/B83 count them).
function newLeadsLine(leads, more) {
  try {
    if (!Array.isArray(leads) || !leads.length) return null;
    const parts = leads.map((l) => { const n = slot(l && l.name); if (n === null) return null; const d = slot(l && l.date); return d === null ? n : `${n} (${d})`; });
    if (parts.some((x) => x === null)) return null;
    const head = LINES.B69.slice(0, LINES.B69.indexOf('{name}'));
    const m = Number.isInteger(more) && more > 0 ? more : 0;
    return `${head}${parts.join(' · ')}${m ? ` and ${m} more.` : '.'}`;
  } catch (_e) { return null; }
}
// the nameless count: exactly one reads B83, two or more B81; none is null
function namelessLine(n) {
  try { if (!Number.isInteger(n) || n < 1) return null; return n === 1 ? LINES.B83 : render('B81', { n }); } catch (_e) { return null; }
}
// P7 cut 4 · the day's lines: every block first (B72; no reason drops " — {reason}"), then every booking (B78; a non-shoot kind places its own word),
// each on its own line. None at all is null (the caller speaks B71). Any unusable value is null.
function dayLines(date, blocks, events) {
  try {
    const d = slot(date);
    if (d === null) return null;
    const out = [];
    for (const b of (Array.isArray(blocks) ? blocks : [])) {
      const r = slot(b && b.reason);
      out.push(r === null ? LINES.B72.replace(' — {reason}', '').replace('{date}', d) : render('B72', { date: d, reason: r }));
    }
    for (const e of (Array.isArray(events) ? events : [])) {
      const line = render('B78', { date: d, client: e && e.title });
      const k = slot(e && e.kind);
      out.push(line && k && k !== 'shoot' ? line.replace(/ · shoot$/, ` · ${k}`) : line);
    }
    if (!out.length || out.some((x) => !x)) return null;
    return out.join('\n');
  } catch (_e) { return null; }
}
// P7 cut 4 · the week's lines: every pending milestone (B73), then every upcoming shoot (B79), each on its own line. None is null (the caller speaks B74).
function weekLines(payments, shoots) {
  try {
    const out = [];
    for (const p of (Array.isArray(payments) ? payments : [])) out.push(render('B73', { client: p && p.client, milestone: p && p.milestone, amount: p && p.amount, date: p && p.date }));
    for (const s of (Array.isArray(shoots) ? shoots : [])) out.push(render('B79', { client: s && s.client, date: s && s.date }));
    if (!out.length || out.some((x) => !x)) return null;
    return out.join('\n');
  } catch (_e) { return null; }
}

// Byte 10's {numbers}: joined with " · ", the founder's own separator (D3, D6 after c-44.5).
function invoiceNumbers(client, numbers) {
  try {
    if (!Array.isArray(numbers) || numbers.length < 2) return null;
    const list = numbers.map(slot);
    if (list.some((x) => x === null)) return null;
    return render('B10', { client, n: list.length, numbers: list.join(' · ') });
  } catch (_e) { return null; }
}

// THE LEFTOVER REPLY, ONE BUILDER (R-44.37): the founder's line, then TWO of his examples chosen at random, each on
// its own line, ONLY from examples whose act is in `covered`. One covered example shows one; none shows the line
// alone. `rand` is a seam for the bench (a function returning [0, 1)). TOTAL: anything hostile yields the line alone.
function leftover(covered, rand) {
  try {
    const cov = Array.isArray(covered) ? covered : [];
    const pool = EXAMPLES.filter((_e, i) => cov.includes(EXAMPLE_ACTS[i]));
    const r = () => { try { const x = typeof rand === 'function' ? rand() : Math.random(); return (typeof x === 'number' && x >= 0 && x < 1) ? x : 0; } catch (_e) { return 0; } };
    const picked = [];
    while (picked.length < 2 && pool.length) picked.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return [LINES.LEFTOVER, ...picked].join('\n');
  } catch (_e) { return LINES.LEFTOVER; }
}

// The keys the door may name for a line it spoke, beside the lifecycle bytes it reads from LINES.
const DOOR_KEYS = Object.freeze(Object.keys(LINES).filter((k) => k !== 'LEFTOVER'));

module.exports = { namelessLine, newLeadsLine, dayLines, weekLines, membersLine, shootsLine, blockedLine, showFrame, whichPackage, leftover, EXAMPLE_ACTS, LINES, EXAMPLES, LINE_HASHES, EXAMPLE_HASHES, DOOR_KEYS, sha256, assertLineHashes, render, invoiceReady, twoClients, twoPackages, noSuchPackage, invoiceNumbers };
