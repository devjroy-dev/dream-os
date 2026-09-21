# repo: dream-os @ 64566902eda7aac79d16315b269c24b081a22e60 · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307 (untouched)
# TDW · CE-44 · SEAT LCV-10 · PART B-1: THE DOOR KEEPS ITS OWN NOTE OF A DATE IT ASKED FOR (F-44.104, F-44.112); F-44.111; e-62 · HANDOVER · 2026-09-21 IST
# AND PART A's WALK RECORD (§3), written into this file BY SCRIPT from the founder's own export. W-1 NONE. NO migration (0171 stays
# free). Bench b95 is taken; b96 is the next free. Six paths, every one in scripts/floor-manifest-ce44-lcv10-partb1.txt. NO BYTE A
# VENDOR READS WAS ADDED OR CHANGED. Line numbers were derived by command from the delivered tree when this file was written.

## 1 · WHY PART B WAS SPLIT, AND WHAT THIS HALF IS

Part B as the kickoff had it is more than one sitting's room held after Part A. The chair asked for the half to be named before the
build and preferred this one first, "since that is what failed twice on his own screen". PART B-1, THIS CUT: the door's own note
for the FIVE lines that ask her for a date (B6, B7, B21, B26, B28), F-44.111, and e-62's guard. PART B-2, NOT IN THIS CUT: the note
for B18, B24, B31 and B35; the bytes B31, B33 and B35; F-44.105's wording; F-44.107's order; F-44.108's sort; the listener's line
that a job said without a name is still a job. Everything the chair ruled for B-2 on 21 September stands and is listed in §6.

## 2 · WHAT WAS BUILT

F-44.111 (allocated; verified by the chair). src/lib/vendor/spokenDate.js :154: a TWO-DIGIT year after a month name reads as the
slash form reads it, 2000 plus the two digits, NO new century rule, in both month-name forms (:156 day first, :164 month
first). The 1900 to 2100 floor, reason 'year', and every direction guard apply after it exactly as before: "18 September 27" said
of money received is after today and is still refused. One digit or three is still unreadable. A two-digit year in the past is now
READ, so a lead dated "5 December 25" answers B21 about the date and no longer B7.
F-44.112 and F-44.104, THE NOTE. src/lib/vendor/workingDoor.js:
  · WRITTEN when a turn ends in exactly ONE of the five date lines (:805), by noteFor (:562), and carried on the verdict to
    persistDoorTurn, which writes it as meta.listener.note BESIDE asked and asked_name, whose two lines are byte-identical to
    6456690 (b90 13.5, b92 12.4, N2 and N3 stand untouched). Two date lines in one turn keep NO note: an answer could not say which.
  · WHAT IT HOLDS: asked (the byte spoken), acts, tries, direction, and lead_id and package_id where the door could resolve them.
    acts[0] is the act waiting for its date, WITHOUT its date, with the client's and the package's names TAKEN FROM THE ROWS, so
    what she misspelt or the listener shortened cannot matter on the next turn (F-44.105's class). When an attach asks B26 the
    money act beside it is silenced, as P6a-2 built; THE NOTE CARRIES THAT ACT TOO (acts[1], its own date kept), so it is not lost.
  · READ by lastDoorNote (:549) from the LAST assistant row of the working thread and nowhere else, its own key and never
    the row's text, at :663: AFTER the live-row handling, so a live staged money row still wins, and ABOVE the bare
    yes-or-no exit, so a closed NO word reads B3 (:664) and never LEFTOVER. validNote (:196) takes a well-formed note or
    NOTHING: a date question over covered acts that pass allCovered, at most four.
  · THE TURN THAT ANSWERS IT (:690). The listener is still heard, for the record. THE DOOR'S OWN READ DECIDES FIRST: if her whole
    trimmed message resolves as a date in the noted act's direction it IS the answer, whatever the listener heard, the listener
    down included. If it does not, the listener's record decides ONE thing, and THIS IS THE ONE PLACE IT DECIDES SUCH A TURN: an
    act OTHER than the noted one means she has moved on; the note LAPSES, writes nothing, and her message is handled fresh.
    Otherwise the saved acts run THROUGH THE SAME PLANS AS ANY TURN with her words as acts[0]'s date. Nothing new plans or writes.
  · ONE RE-ASK, THEN B3. HOW "RE-ASK" WAS BUILT, SAID PLAINLY FOR THE CHAIR TO RATIFY: an answer the door cannot read is answered
    as the plans answer any unreadable date, with B7 ("I could not read that date. Say it like 5 December."), not with the first
    question again; a readable date the plans refuse is answered B21 or B28. Either way the note is kept ONCE more with tries 1,
    and the next such answer, having written nothing, is B3 and keeps no note. A turn that WROTE something is never answered
    "Nothing was changed": it says what it did and keeps no further note.
  · THE NOTE NEVER WRITES MONEY. A money act it carries is planned afresh by planMoney from the rows as they stand and STAGED by
    the same lines as any turn: B1 or B2 is asked, pending_money_acts holds the row, F-44.58's mark is written, and only her YES
    applies it. A future date answered to B6 is refused as it is today (B7, c-44.28).
  · THE RECORD: a turn the note answered carries meta.listener.answered (the byte it answered) and meta.listener.request as HEARD.
THE RULING'S COST, SAID PLAINLY (b95 3.13b): a message that is no date and in which NO act was heard, typed after a date question,
is answered as an unreadable date once. "Hello" after B26 reads B7. It is what "otherwise re-ask once" means, and it is bounded.
A CANDIDATE, NOT BUILT: a FRESH JOB OF THE SAME KIND typed after a date question ("Add a new lead X, wedding on 5 March" after
B7 for another lead) is heard as the NOTED act, so the note does not lapse; her sentence is read as a date, B7, and her job
waits one turn. A lapse when the heard act NAMES A DIFFERENT CLIENT than the note's would cure it. It bends the ruling, so it
is the chair's to rule. Next free finding F-44.113.
e-62 (accepted): scripts/b94_lcv10_bench.js joins through J(), so a refused turn or a missing helper reads as a named FAIL and the
later cells still list. PROVEN: with the drop removed b94 now ends "48 pass · 14 fail", exit 1, every cell listed. b94's M1 anchor
and cell 7.3 are re-aimed on the same line's new bytes (`heard` lost its `const`), each labelled at its site.

## 3 · PART A's WALK RECORD (21 September 2026, 6 turns; written BY SCRIPT from his export, never retyped)

Part A landed at 64566902eda7aac79d16315b269c24b081a22e60; the chair derived it, six paths byte-identical to the ZIP it confirmed
(TDW_CE44_LCV10_PARTA_r2.zip, sha256 23adba3a4b43…). His floor ended "FLOOR = NAMED BASE, no delta  (refusals, not in base: 4)";
Railway read ACTIVE before he walked. The fixture SELECT read: control 1 · the switch row 0 · Walk Nine leads 0 · Pre wedding shoot
50000 · on_the_day · Walk P7 Album 25000 · handover · Photographs and film 80000 · days. The export: Supabase CSV, 12 rows, sha256
ec2466543399f4df84c5a9d1ae9ee9f0564ac9887c36f7e61a75f007b09b9ed6. The script asserted rows pair as user then assistant and every
assistant row carries answered_by_code true. Times are UTC. "⏎" marks a line break inside one message.

 1. 17:03:52 HE: Add a new lead Meera Walk Nine, wedding on 20 February 2027
    17:03:52 door · lane pwa: Lead added: Meera Walk Nine · 20 February 2027.
    HEARD: {"acts":[{"act":"lead","date_as_spoken":"20 February 2027","client_as_spoken":"Meera Walk Nine"}],"route":"task"}
    TOOL CALLS: [{"name":"donna_lead","input":{"name":"Meera Walk Nine","source":"self","wedding_date":"2027-02-20","wedding_date_precision":"day"},"result":"lead_created"}]

 2. 17:04:19 HE: Attach Photographs and film to Meera Walk Nine
    17:04:19 door · lane pwa: Package attached: Meera Walk Nine · Photographs and film · Rs 80,000.
    HEARD: {"acts":[{"act":"attach_package","client_as_spoken":"Meera Walk Nine","package_as_spoken":"Photographs and film"}],"route":"task"}
    TOOL CALLS: [{"name":"attach_package","input":{"lead":"Meera Walk Nine","package_id":"7aa99fe3-6e64-4dbe-8919-947325dc4c7e"},"result":"attached"}]

 3. 17:04:27 HE: Add a new lead Kabir Walk Nine and block 20 March
    17:04:27 door · lane pwa: I cannot do that by message yet. Use the app for it.
    HEARD: {"acts":[{"act":"lead","date_as_spoken":"20 March","client_as_spoken":"Kabir Walk Nine"},{"act":"block_date","date_as_spoken":"20 March"}],"route":"task"}
    TOOL CALLS: NONE (tool_calls is null)

 4. 17:06:12 HE: Add a new lead kabir walk 9, wedding on 5th March 27
    17:06:12 door · lane whatsapp: I could not read that date. Say it like 5 December.
    HEARD: {"acts":[{"act":"lead","date_as_spoken":"5th March 27","client_as_spoken":"kabir walk 9"}],"route":"task"}
    TOOL CALLS: NONE (tool_calls is null)

 5. 17:06:30 HE: 5 march
    17:06:30 door · lane whatsapp: I didn't catch a task in that. You can say things like: ⏎ The Sharma booking is confirmed ⏎ Raise the invoice for the Bose wedding
    HEARD: {"acts":[],"route":"none"}
    TOOL CALLS: NONE (tool_calls is null)

 6. 17:07:02 HE: Add a new lead kabir walk 9, wedding on 5 March 2027
    17:07:02 door · lane whatsapp: Lead added: kabir walk 9 · 5 March 2027.
    HEARD: {"acts":[{"act":"lead","date_as_spoken":"5 March 2027","client_as_spoken":"kabir walk 9"}],"route":"task"}
    TOOL CALLS: [{"name":"donna_lead","input":{"name":"kabir walk 9","source":"whatsapp","wedding_date":"2027-03-05","wedding_date_precision":"day"},"result":"lead_created"}]
WHAT HOLDS: all six turns answered by code. Turn 2 is THE COVERED JOB WITNESSED END TO END, a lead with a wedding date filed by
message and a package attached to it; the closing state SELECT, new, ran clean: lead: Meera Walk Nine | new · 2027-02-20 · day ·
source self · package Photographs and film 80000. AT TURN 1 THE LISTENER HEARD `lead` ALONE, SO THE DROP WAS NOT EXERCISED LIVE; the
mechanism stands on b94 and on the chair's own plants, not on this walk (the chair recorded it in those words). Turn 3's hearing
put the block's date on the lead as well: a fresh specimen under C-44.12. HIS DEVIATIONS, recorded as his: on WhatsApp he typed
"kabir walk 9" and "5th March 27"; they found F-44.111 (turn 4) and F-44.112 (turn 5). The closing statement showed Meera alone
because "kabir walk 9" does not match '%Walk Nine%': the statement working as written. NOT REPORTED: Meera Walk Nine's own page.

## 4 · THE BENCHES

b95 (scripts/b95_lcv10_note_bench.js, NEW, on b94's harness byte for byte). 1.0 reads §3 above and LCV-8's record and asserts the
literals it replays are those records' HEARD lines. THE RECORDED SPECIMENS LEAD: 3.1 his turn 4 verbatim now FILES the lead; 3.2
"were it still refused" (the chair's words): spokenDate.js is put back to 6456690's bytes for that one cell, turn 4 reads B7 as it
did live, and turn 5's "5 march", heard as NO ACT exactly as it was, is read by the note and files it; 3.4 P6a-2's "5 June 2027",
heard as no act, attaches through the REAL attachPackage with EXACTLY { package_id, delivery_on }. 3.5 the door's own read decides
whatever was heard (a `date` lookup over-heard, the thread's attach, the listener down). 3.6 the lapse, INVENTED and labelled.
§4 money: staged, nothing applied, a future date refused, the silenced advance not lost. §5 the real WhatsApp lane. §6 every SAY
line of the card in one thread, thirteen turns. §8 fuzz, the note itself hostile on the last row. §9 twelve mutations each
reddening, the chair's own among them (9.9, a money act applied without staging), and ONE HONEST CONTROL (9.13).
THE DIFFERENTIAL AND THE FLOOR are in the delivery message, derived after this file was written.

## 5 · THIS SEAT'S ERRORS SINCE PART A's HANDOVER, WITH THEIR CAUSES

  e-62 · b94 2.3 dereferenced a field a refused turn does not carry, so with the drop removed the bench crashed and listed no later
    cell. Cause: a cell that assumed the green shape of the turn before it. Cured in this cut (§2).
  e-63 · the first b95 mutation anchor's REPLACEMENT held the two characters dollar and backtick, which String.replace reads as
    "the text before the match"; the mutated file would not compile and the bench crashed. Caught on the first run, before any
    cut. Cause: a replacement string treated as plain text. The anchor was moved off those characters.
  e-64 · cell 3.13 first asserted that "Hello" between the question and the date clears the note. It does not, by the ruling:
    no act heard means the note stands and "Hello" reads B7. The CELL was wrong, not the code. Cause: a cell written from what I
    expected and not from the ruling. It now drives a real lapse, and 3.13b states the ruling's cost as its own cell.
  e-65 · the chair asked for one line on this seat's room BEFORE the Part B build; the seat built first and said it after. No harm.
    Cause: a request in the ruling read as background and not as a step.
  e-66 · b95 cell 4.1 pinned the literal '2026-09-21' for "today". The money plans read the REAL clock for a received date, so the cell
    was green in the seat's container and in the founder's block 2, both before midnight IST, and RED in HIS FLOOR at 12:08 AM on 22
    September, "FLOOR DELTA", block 4 not run, nothing pushed. Reproduced by command with the process clock pinned either side of 18:30
    UTC: 74 pass before, 73 pass and 4.1 red after, and red on any later day. Cause: a cell that pinned a day, which moves (C-44.7),
    on the belief that nowMs reaches the money plans; it does not. Cured in the r2 cut: b95 4.1 compares with today in IST as production
    reads it, taken on both sides of the turn. ONLY b95 and this file differ between the first cut and the re-cut. HIS FLOOR FOUND IT; mine, run
    on the 21st, could not have.
  e-67 · three times a floor outlived this seat's tool budget in the same turn as a build, and its verdict was lost. Cause: a floor
    started at the end of a long turn. THE CHAIR'S RULE NOW, for every seat: THE FLOOR GETS A TURN OF ITS OWN, STARTED FIRST, and
    nothing but polls until the sentinel exists. Build in one turn; floor in the next; attach in the one after if need be.

CRAFT, FROM e-66 · C-44.13 (the chair's, standing): A NEW OR EDITED BENCH IS RUN ON SHIFTED CLOCKS BEFORE IT IS DELIVERED, at the least
the next day in IST and a day months ahead, across a year's end and a leap day where a date is in play; the chair runs the same on
every ZIP before it confirms. A cell that names "today" derives it as production derives it, on BOTH sides of the turn. THE METHOD, as
this seat ran it: a four-line preload, `node -r clock.js scripts/<bench>.js` with FAKE_NOW set, that replaces the global Date with a
subclass whose no-argument constructor and whose now() answer the pinned instant (every Date built FROM a value is untouched, so
fixtures keep their own dates). Run here at 2026-09-21T18:00:00Z and 18:29:59Z (before midnight IST), 18:31:00Z (after it),
2027-01-05T10:00:00Z (across the year's end) and 2028-02-29T23:00:00Z (a leap day, and the 1st of March in IST): b95 74 pass and b94 62
pass on every one. c-44.47 is the chair's own record of having confirmed the first cut on one clock.

## 6 · OPEN, AND WHERE EACH SITS

  · PART B-2, whole, as ruled: the note for B18 (her whole trimmed message IS the name unless the listener hears an act OTHER than
    `lead`), B35 (the same, filling EVERY nameless act but `lead`; B18 first where both are owed), B24 and B31 (a package by the
    door's key() fold, the door's own read first); B31 "Which package? Yours are: {list}.", B33 "Set the fee first." (REUSE,
    dreamos-pwa lib/worklist/packages.ts:116, witnessed at 320ad7e), B35 "Which client? Say the name.", hash-carried, b90 1.2
    and b93 1.2 re-pinned; F-44.105's description; F-44.107, the lead resolved before the package; F-44.108, the sorted list;
    the listener's line that a job said without a name is still a job, "The booking is confirmed" its specimen. The riding
    items of the kickoff (P6a-2's addendum; F-44.101 to F-44.112 with where each sits) ride B-2's handover.
  · RULED BY THE CHAIR after this file was first cut: the "re-ask" as built is ACCEPTED, and its rule is law for every note (a turn that wrote
    something is never answered "Nothing was changed"); the cost in 3.13b is ACCEPTED; the candidate in §2 is F-44.113, ALLOCATED, its cure accepted
    (the note lapses on an act OTHER than the noted one, OR the noted act naming a DIFFERENT client under key(); the door's own read still first)
    and IT RIDES PART B-2.
  · Next free: finding F-44.114, migration 0171, bench b96. Errors continue from e-68.

---
A PROSE INSTRUCTION IS NOT A MECHANISM. Trust evidence over narrative, including this file.
