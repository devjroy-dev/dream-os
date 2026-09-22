# repo: dream-os @ 9be5ce2 (cut 2a landed; this docs-only cut writes §8) · base of the cut 70fdedac27d83a909db46f207e9e01bda0c3512a · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307 (untouched by this cut)
# TDW · CE-45 · SEAT LCV-12 · LC-VICTOR P7, CUT 2a · THE SLOTS, BLOCK, UNBLOCK, BOOK, NEEDS_CLIENT, F-44.128, F-44.63, F-44.109 · rung b104 · 2026-09-23 IST
# Delivery version: the walk record (§8) is written in by script from the founder's export after the walk, never retyped. Line numbers were
# derived by command at the moment of cutting; re-derive before citing. Every byte a vendor reads below is quoted from doorLines.js with its hash.

## 1 · WHAT THIS CUT DOES, IN ONE PARAGRAPH
The door learns the calendar's first three acts. "Block 20 March, personal", "Unblock 20 March" and "Book the Mehta shoot on 8 January 2027"
read B34 until now; the door now calls availability.blockDate and unblockDate and eventWrite.writeEvent AS THEY STAND, on the door plane with no
engine export, and reads back from the ROW each returned: B40 to B46, B54, B75 and B76, all his (23 September). Beneath them the listener gains the
three slots the P7 table measured (member_as_spoken, reason_as_spoken, kind_as_spoken) and the act name payment_reminder, byte for byte the rig's
(the bytes measured are the bytes that ship); NEEDS_CLIENT joins COVERED so a block or an unblock is never asked "Which client?"; a request on
route 'search' is never a job (F-44.128, live today on C1, cured here); the morning brief's dates render in full month (F-44.63); the calendar-photo
preview no longer asks her to reply "save all" (F-44.109, Q2). A block, an unblock and a booking LAND AT ONCE. Money is never touched.

## 2 · THE RULINGS THIS CUT RESTS ON
The chair's rulings of 23 September on the P7 table (1 to 8) and on the designs (0.1 to 1.9 accepted as written; HANDS names; the relay's place);
the founder's bytes of 22 and 23 September ("All proposed lines accepted", "yes to all", "ok"); ruling (b) the order, (c) land at once, (g)
NEEDS_CLIENT; R-42.13 (full month); R-43.16 (a refusal is a control: B76 ends "Add the lead first."); C-44.12 (every sentence cell replays a
recorded return verbatim through the real normaliseRequest).

## 3 · THE DESIGN AS BUILT (src/lib/vendor unless said; every "never" is a cell in b104 with a mutation)
THE SLOTS (listenerDoor.js :68, :85 to :87): the act description gains ", payment_reminder" after quote_send; member_as_spoken, reason_as_spoken and
kind_as_spoken are added LAST, after `missing`, exactly where the rig's slotsTool() placed them, so sha256(JSON.stringify(EAR_TOOL)) equals the
rig's tool rebuilt from 70fdeda: 4a8cfbeb20de523240ec68012c4f383bec56282e515fed50f0df78ae85aecd6d (b104 1.1 pins the literal). normaliseRequest
keeps the three as trimmed strings and drops empties (C1 leaked "" under the slots variant, row 3). SYSTEM unmoved. NOTE_SLOTS carries the three.
COVERED (workingDoor.js :117 to :121) is ten: the seven plus CALENDAR_ACTS [block_date, unblock_date, book_event]. NEEDS_CLIENT [lead,
booking_confirmed, advance_paid, milestone_paid, invoice, attach_package, relay, book_event, edit_event, cancel_event, payment_reminder]: allCovered
demands client_as_spoken only for these; namelessOf filters to them; `lead` is among them so the lead exception's mutation (b92 10.4) still bites.
HANDS gains donna_block_date, donna_unblock_date, donna_book_event (the signals' own names).
THE ROUTE-SEARCH GATE (F-44.128, :1198): after withoutEchoedEvents and before the F-44.118 floor, `heard.route === 'search'` exits CHAIN 'lookup'
and standKey speaks B34; never reached on a note turn (fromNote decides above). Row 13 C1 asis replayed verbatim reads B34 and asks no B18 (b104
3.1; 9.4 removes the gate and B18 returns).
THE DATE (calendarDate :536): resolveSpokenDate direction 'future' with nowMs; none said → B54 "Which day? Say it like 5 December." as a DATE note
(DATE_ASKS gains B54; her whole next message is the day, F-44.112's own path); unreadable or an absurd year → B7. THE KIND (calendarKind :540):
kind_as_spoken folded by key() when it is one of eventWrite's CALENDAR_KINDS, else 'shoot'.
BLOCK (planBlock :547, fileBlock :586): blockDate(supabase, vendor.id, iso, reason || null); ok → B40 from the returned block row (blockedLine:
no reason drops " · {reason}", as byte 13 drops " for {client}"); the writer's exact 'Already blocked.' with code ALREADY_BLOCKED → B41; any other
refusal with a sentence → B42 speaks the WRITER'S sentence verbatim (findExistingBlock's full-day-over-slot line, b104 4.5); a throw → B42's :157
line, recorded refused:exception. client_as_spoken on a block is IGNORED (LCV9 walk turn 3's record, "personal" in client_as_spoken, replayed: B40,
b104 4.4). LANDS AT ONCE.
UNBLOCK (planUnblock :555, fileUnblock :601): unblockDate(supabase, vendor.id, { date }); ok → B43; the writer's exact 'Block not found.' → B44,
recorded not_blocked (F-44.65 and F-44.72 CLOSE on this row: "wasn't blocked" is spoken on that exact error and on nothing else, 5.2 and 5.4);
anything else → B45. LANDS AT ONCE; the row is soft-deleted by the writer, never dropped (5.1).
BOOK (planBook :564, fileBook :621): the client by resolveLead exact → the one home (nearestName over her live leads, B36 with an OFFER note;
6.9, 6.10) → a name that is no lead and not filed this message exits 'book_no_lead' BEFORE any write and standKey speaks B76 (6.8); two of a name
→ B8; then the day; then the kind. writeEvent(supabase, { vendorId, agentId, surface (the lane's), source: 'victor', title: client, event_date,
kind, linked_lead_id, state: 'upcoming' }), the same call shape calendarSignals' bookEvents makes. ok → B46 from the returned events row (bookedLine:
title, event_date; a kind other than shoot is DERIVED by placing the row's own kind word where the template says "shoot", 6.4; disclosed as B40's
no-reason form is); the writer dedupes a second identical booking onto the same row (findExistingEvent :214) and B46 speaks that row (6.2);
{ ok:false, conflict } → B47 = conflict.message VERBATIM (6.6); a refusal with an error sentence → that sentence under key B75; a throw → B75.
LANDS AT ONCE; a conflict is refused by the writer's own gate.
THE ORDER (ruling (b); :1266 the probes, :1322 the writes): leads, attaches, invoices, CALENDAR (in message order), the relay, the ONE money act.
Every calendar act is probed read-only before the first write (a plan the door cannot say → 'calendar_unsayable' → GLITCH) and REBUILT after the
writes before it, so a shoot for a lead this message files is booked (6.13; 9.8 breaks the order and B76 returns). After a write nothing goes to
the chain: what the door cannot say is B75.
F-44.63 (src/agent/briefing.js :155, :174, :182): longDateYear from ../lib/witnessLine on the three dates; words unchanged; b104 7.1 reads the lines.
F-44.109 (src/lib/vendorInbound.js :456 to :459): the preview's last line dropped; it ends after its list; b104 8.1.
LEFTOVER: example 4 "Block 20 March, personal" switches on by covering block_date (6.15); EXAMPLE_ACTS unchanged.
WHAT DOES NOT CHANGE: the money functions (hash-pinned 10.3), pendingMoneyActs, availability.js and eventWrite.js (not in the manifest, 10.4), every
note branch, the relay, R-45.3's second hearing.

## 4 · THE BYTES, all his, hash-carried in doorLines.js (LINES 41 → 52)
B40 "Blocked: {date} · {reason}." 1bec09f1e5d3 · B41 "{date} was already blocked. Nothing changed." 6d882045d5fc (REUSE blockHands.js :156) ·
B42 "Couldn't block {date} — nothing was written. Try again or block it from the calendar." a41ef8b9fe72 (REUSE :157; spoken only for a throw or a
refusal with no sentence) · B43 "Unblocked: {date}. The day's back on your calendar." b78f22148ed8 (REUSE :165) · B44 "{date} wasn't blocked.
Nothing changed." 2e8457a71734 (REUSE :166) · B45 "Couldn't unblock {date} — nothing was written. Try again or unblock it from the calendar."
b4363bbbfc3f (REUSE :167) · B46 "Booked: {client} · shoot · {date}." e06955310af5 · B47 is NOT a byte here: conflict.message verbatim · B54 "Which
day? Say it like 5 December." fc952e30b355 · B75 "Couldn't put that on the calendar — nothing was changed." 1d87cfb5ba7b (REUSE calendarSignals.js
:134) · B76 "No lead called {name}. Add the lead first." 24806f0f4b20 · B77 "No shoot on {date}." 756908b48584 (CARRIED, spoken from cut three).
B48 to B53 are 2b's; B56 to B62 cut three's; B67 to B74 cut four's; B64 to B66 free. NEW BYTES MINTED BY THIS SEAT: ZERO. The three slot
descriptions are the rig's measured prose, not founder bytes.

## 5 · THE RUNG · b104, 70 cells (scripts/b104_lcv12_calendar_bench.js), on b103's harness verbatim (the PGRST116 double, C-44.3), the REAL
blockDate, unblockDate and writeEvent over the in-memory events table (18 columns as PUBLIC_SCHEMA.md :716 lists them), the REAL checkOccupancy
GREEN 70/70 at the cured tree; 70/70 on three shifted clocks (C-44.13: 24 September 2026 IST, 29 February 2028, 31 December 2027); RED at the base
worktree at 70fdeda: 6 pass / 64 fail, no crash (1.4, 1.5 record and law cells; 11.4 an absence the base already has; 9.8 green there since the base holds no calendar to order; 10.3,
10.4 laws). §1 the slots (rows 3 C1 slots, 10 C1 slots, 3 C1 asis replayed verbatim through normaliseRequest; the EAR_TOOL hash; SYSTEM; the
note); §2 NEEDS_CLIENT; §3 F-44.128 (rows 13 C1 and C2); §4 block (rows 3 C2 slots, 4 C2 asis, LCV9 turn 3 replayed; B41, B42 the writer's own
sentence, B42 his line on a throw, B54 and her answer, B7); §5 unblock (row 5 C1 asis; B43, B44 only on the exact error, B45 on a throw and on
any other refusal); §6 book (rows 2 C2 asis and 2 C1 slots; the dedupe; kinds; B47 verbatim; B75; B76; B36 and her YES; B54 and her day; the
order with a lead; the calendar before money; the LEFTOVER switch); §7 F-44.63; §8 F-44.109; §9 eight mutations of PRODUCTION code (the reason
slot dropped, ALREADY_BLOCKED misread, 'Block not found.' misread, the route gate removed, B46 from the plan, NEEDS_CLIENT ignored, the brief's
helper removed, the order broken); §10 the laws; §11 THE CARD in its exact words, steps 1 to 4, 7 to 14, 16 and 17 each a cell named to its step, driven in order on one estate (C-44.12, c-44.48) (the manifest, the eleven hashes, the money functions' hashes, the writers not in the manifest).
THE SEALED RUNGS RE-PINNED, each amendment labelled at site, counts moved and their reasons: b90 184 → 196 (the RULED loop gains the eleven bytes,
one cell each; the HANDS image admits the three names; 4.2 COVERED at ten; 4.2a NEEDS_CLIENT's members; 11.2's anchor re-aimed at the NEEDS_CLIENT
return; M5 at HANDS' new last entry) · b92 172 → 173 (4.4 re-aimed to assign_crew and 4.4a added: a block beside a lead IS covered; 4.6 the new
return; 14.1 COVERED at ten; N19 at HANDS' last entry) · b93 127 → 129 (three exit rows re-aimed and two added: lookup, book_no_lead,
calendar_unsayable; 2.2/2.4/2.5 six examples and fifteen pairs; 3.2 18 reasons / 20 returns; 3.5 21 acts; 7.1's specimen assign_crew; 11.2 the
turn 3 record now BLOCKS through the real writer and reads "Blocked: 20 March 2027.") · b94 62 held (2.4's six genuine-second-job specimens now
RUN beside the lead or read B76, keyed one by one; 2.5 B76; 3.2's uncovered specimen assign_crew; 5.3 and 6.3 the card's step files the lead and
blocks the day; 6.4 and 6.6 the estate counts follow; 7.4 COVERED at ten; M1 re-pinned: the undropped echo is now BOOKED beside the lead, a double
write 2.1 forbids; M7 relabelled a CONTROL that does not redden, since an undropped turn 8 request is all covered either way) · b95 74 held (the
hostile block_date note re-aimed to assign_crew; 7.4 DATE_ASKS gains B54; 9.13's control re-aimed) · b97 59 held (LINES 52; M7 re-aimed to
edit_event, the uncovered act that needs a client) · b98 47 held (LINES 52) · b99 56 held (LINES 52; the hostile offer note re-aimed to
edit_event) · b101 78 held (M6's COVERED literal grew a tail) · b102 24 held (LINES 52) · b103 42 held (6.2 re-pinned: LINES 52 and EAR_TOOL's new
hash; cut one's own manifest still holds no byte). The rungs reading briefing.js (b05_arc_m1, b07_f0784_panel, b08_p5_unblock, b39_telemetry,
b66_inbound_consent, b05_p4_crons) and vendorInbound.js's preview (b05_f0515_calendar_parse, b05_m2_vendor_inbound, b05_media_shim) each hold
their base verdict at the cured tree; the differential (§6) diffs their outputs.

## 6 · THE DIFFERENTIAL AND THE FLOOR
THE DIFFERENTIAL: 93 benches (the 89 by path shape of c-45.5's narrowed grep, plus the readers of briefing.js and of the calendar-photo preview
by symbol: buildBriefing, previewMsg, calendar_proposals), run in place at ONE base (a worktree at 70fdeda with a REAL node_modules copy) and at
the cured tree, the sibling dreamos-pwa at 320ad7e beside both, exit codes AND outputs diffed (timestamps, durations, wamids and temp paths
scrubbed): 86 of 92 byte-identical (b104 exists only at the cured tree); SIX differ, every one by the re-pinned CELL NAMES or the count line and
by nothing else (zero FAIL lines in any diff): b103 (6.2's name), b95 (9.13's name), b92 (4.4/4.4a and 14.1's names; 172 → 173), b90 (16 lines:
the eleven RULED cells, 4.1, 4.2, 4.2a and the count 184 → 196), b93 (23 lines: the exit rows, 2.2 to 2.5, 3.2, 3.5, 7.1, 11.2 and 127 → 129),
b94 (26 lines: 2.4's six, 2.5, 3.2, 5.3, 6.3 to 6.6, 7.4, 9.1, 9.7). Exit codes differ for none. The ten pre-existing reds inside the set are red at
BOTH trees with byte-identical outputs and not introduced (b05_arc_m6, b05_f0550_ping_drain, b05_f0555_media_dedupe, b05_p4_crons, b06_meter,
b07_p5, b08_p5_oow_relay, b08_p5_unblock, b59_g34_reminders, b59_mutations; all in scripts/floor-base.txt); b05_p4_crons reads briefing.js and
its output is byte-identical across the trees. The rungs reading vendorInbound.js's preview (b05_f0515_calendar_parse, b05_m2_vendor_inbound,
b05_media_shim) are byte-identical.
THE FLOOR: FLOOR = NAMED BASE, no delta (refusals, not in base: 4: b06_gauntlet, b5_wa_door_smoke, bf1_bride_tool_fidelity_bench, test-shape).
THE SET: all 224 files of scripts/ but _noop_middleware (b104 joined); 197 green; the failures exactly the 23 lines of scripts/floor-base.txt by
name (22 RED, 1 ERROR b5b_movementb) and those four refusals, nothing else. HOW IT WAS RUN, in these words: by run-floor.sh's OWN CLASSIFICATION
(exit 0 green, 3 REFUSED, 2 ERROR, else RED; refusals dropped; the names diffed against scripts/floor-base.txt), as one detached loop under setsid
in the seat's container (e-80's lesson), every bench's output kept, no per-bench cap; run-floor.sh itself was NOT invoked whole there and its
warming pass was not repeated as a pass of its own, since no bench reddened outside the base set. git status was read on BOTH trees before the
loops started (base 0, cured the manifest's 19) and after the sentinels (base 0, cured 19: no bench left production source changed). Two whole
runs stand behind it: the chair's on the ZIP before confirm, and the founder's block 2 on his machine.


## 7 · THE RECORD THIS CUT REPLAYS
scripts/out/p7_ear_check.csv (his one run of scripts/lib/p7_ear_check.js, 23 September 2026, 72 rows, sha256
f563b33daa3705403153a8769c0baafafd29d2d380f6730483c2dfc1f82b168e), rows 2, 3, 4, 5, 10, 13 on both seats; TDW_CE44_LCV9_PART1_WALK_RECORD.md turn 3.
The table's own findings, recorded: no seat ever returned the act `date` (row 1: find + date on all four); "How much is owed to me?" is whatsdue on all
four (F-44.129, closed as a record); "Am I free on 14 February?" was heard live as whatsdue + date twice on his cut-one walk; row 7 C1 asis put two
dates in one slot ("20 November to 22 November"), 2b's concern.

## 8 · THE WALK RECORD · WRITTEN BY SCRIPT FROM THE FOUNDER'S EXPORTS OF 23 SEPTEMBER 2026 (02:40 TO 02:45 IST), NEVER RETYPED
  thread 48 rows, engine.messages with meta.listener, sha256 05661df5564546ce54ece16a952c1cb07c56999157768e9a9929d3b1876d0378
  events 6 rows, public.events for DEV440 in the window, sha256 72e568d968465afae45c50d4e24ba83a58bd81bb1e44e76e0b07eddbe49cd6eb
  Times are UTC. HE is his message; DOOR is the reply and its lane; HEARD is meta.listener.request; NOTE is the question the door kept. Fixture as his SELECT
  returned it: DEV440 1 · the switch row 0 · live blocks in March 2027: 2 (PRE-EXISTING, on 20 and 22 March, from earlier sittings; his word) · live events on 8 and
  9 January 2027: 0 · leads named Walk Seventeen%: 0. Deployed 9be5ce2 (Railway ACTIVE 02:39 IST). He walked in the APP's ask bar throughout (every row lane pwa).

### 8.1 the thread
1. 21:10:21 HE: Block 20 March 2027, personal
   21:10:21 DOOR · lane pwa: 20 March 2027 was already blocked. Nothing changed.
   HEARD: {"acts":[{"act":"block_date","date_as_spoken":"20 March 2027","reason_as_spoken":"personal"}],"route":"task"}

2. 21:10:40 HE: Block 20 March 2027
   21:10:40 DOOR · lane pwa: 20 March 2027 was already blocked. Nothing changed.
   HEARD: {"acts":[{"act":"block_date","date_as_spoken":"20 March 2027"}],"route":"task"}

3. 21:11:29 HE: block 21 march 2027
   21:11:29 DOOR · lane pwa: Blocked: 21 March 2027.
   HEARD: {"acts":[{"act":"block_date","date_as_spoken":"21 march 2027"}],"route":"task"}

4. 21:11:43 HE: Unblock 20 March 2027
   21:11:44 DOOR · lane pwa: Unblocked: 20 March 2027. The day's back on your calendar.
   HEARD: {"acts":[{"act":"unblock_date","date_as_spoken":"20 March 2027"}],"route":"task"}

5. 21:11:55 HE: Unblock 20 March 2027
   21:11:55 DOOR · lane pwa: 20 March 2027 wasn't blocked. Nothing changed.
   HEARD: {"acts":[{"act":"unblock_date","date_as_spoken":"20 March 2027"}],"route":"task"}

6. 21:12:07 HE: Block 20 March
   21:12:07 DOOR · lane pwa: Blocked: 20 March 2027.
   HEARD: {"acts":[{"act":"block_date","date_as_spoken":"20 March"}],"route":"task"}

7. 21:12:12 HE: Unblock 20 March
   21:12:12 DOOR · lane pwa: Unblocked: 20 March 2027. The day's back on your calendar.
   HEARD: {"acts":[{"act":"unblock_date","date_as_spoken":"20 March"}],"route":"task"}

8. 21:12:18 HE: Add a new lead Walk Seventeen Alpha, wedding on 8 January 2027
   21:12:18 DOOR · lane pwa: Lead added: Walk Seventeen Alpha · 8 January 2027.
   HEARD: {"acts":[{"act":"lead","date_as_spoken":"8 January 2027","client_as_spoken":"Walk Seventeen Alpha"}],"route":"task"}

9. 21:12:28 HE: Book the Walk Seventeen Alpha shoot on 8 January 2027
   21:12:28 DOOR · lane pwa: Booked: Walk Seventeen Alpha · shoot · 8 January 2027.
   HEARD: {"acts":[{"act":"book_event","date_as_spoken":"8 January 2027","kind_as_spoken":"shoot","client_as_spoken":"Walk Seventeen Alpha"}],"route":"task"}

10. 21:12:38 HE: Block 8 January 2027
   21:12:38 DOOR · lane pwa: Blocked: 8 January 2027.
   HEARD: {"acts":[{"act":"block_date","date_as_spoken":"8 January 2027"}],"route":"task"}

11. 21:12:44 HE: Unblock 8 January 2027
   21:12:44 DOOR · lane pwa: Unblocked: 8 January 2027. The day's back on your calendar.
   HEARD: {"acts":[{"act":"unblock_date","date_as_spoken":"8 January 2027"}],"route":"task"}

12. 21:12:51 HE: Book the Walk Seventeen Alpha shoot on 8 January 2027
   21:12:51 DOOR · lane pwa: Booked: Walk Seventeen Alpha · shoot · 8 January 2027.
   HEARD: {"acts":[{"act":"book_event","date_as_spoken":"8 January 2027","kind_as_spoken":"shoot","client_as_spoken":"Walk Seventeen Alpha"}],"route":"task"}

13. 21:12:57 HE: Block
   21:12:57 DOOR · lane pwa: I didn't catch a task in that. You can say things like: ⏎ Block 20 March, personal ⏎ The Sharma booking is confirmed
   HEARD: {"acts":[],"route":"none"}

14. 21:13:23 HE: Block
   21:13:23 DOOR · lane pwa: I didn't catch a task in that. You can say things like: ⏎ Add a new lead, haldi shoot on 3 January ⏎ The advance came in today for the Kapoor booking
   HEARD: {"acts":[],"route":"none"}

15. 21:13:36 HE: fresh
   21:13:37 DOOR · lane pwa: I didn't catch a task in that. You can say things like: ⏎ The advance came in today for the Kapoor booking ⏎ Block 20 March, personal
   HEARD: {"acts":[],"route":"none"}

16. 21:13:44 HE: block
   21:13:44 DOOR · lane pwa: I didn't catch a task in that. You can say things like: ⏎ Send a message to my client asking for the advance ⏎ Block 20 March, personal
   HEARD: {"acts":[],"route":"none"}

17. 21:14:00 HE: Book the Walk Seventeen Zeta shoot on 9 January 2027
   21:14:00 DOOR · lane pwa: No lead called Walk Seventeen Zeta. Add the lead first.
   HEARD: {"acts":[{"act":"book_event","date_as_spoken":"9 January 2027","kind_as_spoken":"shoot","client_as_spoken":"Walk Seventeen Zeta"}],"route":"task"}

18. 21:14:07 HE: Book the Walk Seventeen Alpa shoot on 9 January 2027
   21:14:07 DOOR · lane pwa: Did you mean Walk Seventeen Alpha? Reply YES or NO.
   HEARD: {"acts":[{"act":"book_event","date_as_spoken":"9 January 2027","kind_as_spoken":"shoot","client_as_spoken":"Walk Seventeen Alpa"}],"route":"task"}
   NOTE: B36

19. 21:14:20 HE: Yes
   21:14:20 DOOR · lane pwa: Booked: Walk Seventeen Alpha · shoot · 9 January 2027.
   HEARD: {"acts":[],"route":"none"}

20. 21:14:24 HE: Who are my new leads?
   21:14:24 DOOR · lane pwa: I cannot do that by message yet. Use the app for it.
   HEARD: {"acts":[{"act":"find"}],"route":"search"}

21. 21:14:31 HE: Block 5 match
   21:14:31 DOOR · lane pwa: I could not read that date. Say it like 5 December.
   HEARD: {"acts":[{"act":"block_date","date_as_spoken":"5 match"}],"route":"task"}
   NOTE: B7

22. 21:14:41 HE: Block 22 March 2027
   21:14:41 DOOR · lane pwa: 22 March 2027 was already blocked. Nothing changed.
   HEARD: {"acts":[{"act":"block_date","date_as_spoken":"22 March 2027"}],"route":"task"}

23. 21:14:59 HE: block 23ed march
   21:14:59 DOOR · lane pwa: I could not read that date. Say it like 5 December.
   HEARD: {"acts":[{"act":"block_date","date_as_spoken":"23ed march"}],"route":"task"}
   NOTE: B7

24. 21:15:14 HE: block 23rd march
   21:15:14 DOOR · lane pwa: Blocked: 23 March 2027.
   HEARD: {"acts":[{"act":"block_date","date_as_spoken":"23rd march"}],"route":"task"}

### 8.2 the calendar rows the door wrote (public.events)
  21:11:29 Blocked · blocked · 2027-03-21 · full_day · upcoming · notes null · linked_lead_id null · deleted_at 
  21:12:06 Blocked · blocked · 2027-03-20 · full_day · upcoming · notes null · linked_lead_id null · deleted_at 21:12:12
  21:12:27 Walk Seventeen Alpha · shoot · 2027-01-08 · full_day · upcoming · notes null · linked_lead_id 27978acb · deleted_at 
  21:12:38 Blocked · blocked · 2027-01-08 · full_day · upcoming · notes null · linked_lead_id null · deleted_at 21:12:44
  21:14:19 Walk Seventeen Alpha · shoot · 2027-01-09 · full_day · upcoming · notes null · linked_lead_id 27978acb · deleted_at 
  21:15:13 Blocked · blocked · 2027-03-23 · full_day · upcoming · notes null · linked_lead_id null · deleted_at 

### 8.3 what the record shows, read by the seat and ruled by the chair
GREEN AGAINST THE CARD on every step the estate allowed, as the founder read it ("except a bare block, all green"): steps 1 and 2 read B41 "20 March 2027 was
already blocked. Nothing changed." because a block from an earlier sitting already sat on that day (the fixture's 2), the truthful line, then step 3 B43 unblocked it
and step 4 B44; step 5 "Block 20 March" (no year) resolved to 20 March 2027 and read B40 with no reason (the ear returned none); step 6 B43; step 7 B17; step 8 B46
from the row, linked_lead_id set, kind shoot; step 9 B40 beside the shoot (the estate's ruled shape); step 10 B43; step 11 B46 again with ONE row on 8 January 2027
(the writer deduped); step 13 B76; step 14 B36 then B46 on his Yes (9 January 2027, one row); step 15 "Who are my new leads?" heard find on route search read B34
and NEVER B18 (the gate held; C2's return, not C1's, so F-44.128's C1 shape was not met live); step 16 B7; step 17 "block 21 march 2027" B40 (walked early,
21:11:29, in the app; the WhatsApp lane was not walked, so "one door, both lanes" is by cell only, 11.17); his own extras: "Block 22 March 2027" B41 (the second
pre-existing block), "block 23ed march" B7, "block 23rd march" B40 "Blocked: 23 March 2027." (an ordinal day read by the door's own date read). Step 18 (the
calendar screenshot) does not appear in the thread export and is proven by cell (8.1) only. Every reason on the walk was absent from the ear's returns: no
" · {reason}" form was seen live; 4.1 holds it.
THE ONE MISS, step 12: a bare "Block" (four times: "Block", "Block", "fresh", "block") was heard by the listener as NO ACT ({"acts":[],"route":"none"}) every time,
so the door's B54 "Which day? Say it like 5 December." was never reached: it is written for a block_date act carrying no date, and the ear returned no act at all.
NOT a defect of the door (4.7 proves B54 on the act); a LISTENER miss of c-44.44's class, allocated by the chair. The cold second hearing (R-45.3) did not fire,
rightly: the message holds no lead name. Nothing was written on those four turns.
Leads, attaches, money rows and drafts in the window: one lead (Walk Seventeen Alpha), nothing else, as the card expects.

## 9 · OPEN, CARRIED
B77 carried, spoken from cut three. The kind word in B46 for a non-shoot kind is DERIVED (6.4); a {kind} form of B46 is his to word if he prefers.
The fake events table's ilike is pass-through, so b104's dedupe cell (6.2) proves one row and B46 from it, not the title match itself (eventWrite's
own benches hold that). R-45.8 and F-44.126 (the vendor-image proposals unresolved since 21 September; the packet after P7 teaches "save all" and
"skip N"). The eleven rungs sharing the old lookup double, not repaired. Next free: F-44.130, migration 0171, bench b105, errors e-83, corrections c-45.10.

---
A PROSE INSTRUCTION IS NOT A MECHANISM. Trust evidence over narrative, including this file. LCV-12 holds at 70fdedac27d83a909db46f207e9e01bda0c3512a.
