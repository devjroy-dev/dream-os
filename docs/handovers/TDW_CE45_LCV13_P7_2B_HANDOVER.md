# repo: dream-os @ 3af9a01 (base) · dreamos-pwa @ 320ad7e (untouched) · delivery TDW_CE45_LCV13_P7_2B.zip · manifest scripts/floor-manifest-lcv13-p7-2b.txt (20 paths; "21" corrected, the seat's own error) · pushed e4a5c06 · walk record added by TDW_CE45_LCV13_P7_2B_WALK.zip on e4a5c06
# TDW · CE-45 · SEAT LCV-13 · LC-VICTOR P7 CUT 2b · MOVE AND CANCEL A SHOOT, ASKED YES OR NO; THE DAY-SHEET RELOCATION · 2026-09-23 IST

Every line number below was derived by command at the cured tree on the day of writing. The design is LCV-12's (its designs file, §2.1 to §2.6,
sha256 05b449610210…), as ruled by the chair on 23 September (the kickoff's §2; the read-first rulings K1 to K9; R-45.9). Nothing here is minted.

## 1 · WHAT A VENDOR CAN NOW DO BY MESSAGE, ON BOTH LANES
Move a shoot to a new day, and cancel a shoot. Neither is written on the turn she asks: the door ASKS (B48, B50) and writes only on her YES.
A move never touches the lead's wedding date or the binder (ruling 3): the events row's event_date is the only thing that changes.

## 2 · THE DESIGN AS BUILT (workingDoor.js unless named)
2.1 COVERED gains edit_event and cancel_event through CALENDAR_ACTS :117; CAL_QUESTION_ACTS :119 names the two ASKED acts.
    HANDS gains edit_event 'donna_edit_event' and cancel_event 'donna_cancel_event' (the signals' own names).
2.2 CAL_ASKS ['B48','B50'] :350 and SHOOT_ASKS ['B53'] :355 join ASKS. validNote admits a CAL note (one edit/cancel act naming its client, a move its
    new day, a string event_id) and a SHOOT note (the same act, 2 to 20 string event_ids); calNoteFields :405 carries event_id, event_ids and iso.
2.3 THE SHOOT RESOLVER shootsOf :674: events where vendor_id, deleted_at null, state 'upcoming', kind 'shoot', and linked_lead_id = the lead's id OR
    key(title) = key(the lead's name); oldest day first; a failed read is null. shootsById re-reads a SHOOT note's candidates live.
2.4 planCal :709, read-only. Order: the lead by the ONE home (lifecycleHands.resolveLead; ambiguous → B8; not found → B36's offer when near, else
    B76 through the existing exit 'book_no_lead'); then a move's NEW day from the ONE date slot (B54 with a DATE note when none; B7 when the door's own
    read cannot read it: row 7 C1's "20 November to 22 November" is B7, the old day is never read); then the shoot: none → B52; two or more → B53
    with its SHOOT note; one → B48 (the new day) or B50 (the ROW's day), each with its CAL note. A cancel's said day NARROWS the resolver.
2.5 The fresh-path hook (:1389): a move or cancel must be the ONLY act of her message; otherwise exit 'cal_mixed' → B34 (see §4.1).
2.6 THE CAL NOTE (:1271): her NO is B3 (the existing top-of-turn rule); her YES runs fileCal :739 → eventWrite.writeEvent AS IT STANDS with
    surface by lane and source 'victor' exactly as fileBook passes them (K8), so the writer's ledger reads "via chat":
      move   { vendorId, surface, source, event_id, event_date }   → B49 from the RETURNED row (title, event_date)
      cancel { vendorId, surface, source, event_id, state:'cancelled' } → B51 from the RETURNED row
      { conflict } → B47, conflict.message VERBATIM, nothing moved · { ok:false, error } → B75 · a throw → B75 (recorded refused:exception)
    Another act heard lapses the note (F-44.115) and is handled fresh; nothing heard re-asks the question once (tries 1), then B3.
2.7 THE SHOOT NOTE (:1291; K4): her answer to B53 is read by the door's own date read ONLY to pick a row among the live candidates. Exactly one on
    that day → B48 or B50 on it, the act's own new day UNTOUCHED. Unreadable → B7 once, then B3. A readable day naming no candidate → B53 once, then
    B3. A lookup heard (route search, or act 'date') is her answer, not a new job (F-44.117's class); any other act lapses the note.
2.8 standKeyOf :1655: 'cal_mixed' → B34.
2.9 THE RELOCATION (ruling (d)): src/lib/vendor/daySheet.js readDaySpine(supabase, vendorId, date) holds day.js :60 to :82 at 3af9a01; day.js
    :43 requires it and :63 calls it; its console.error and its 500 'Lookup failed.' stay in day.js. No door reader yet (cut four's availability).

## 3 · THE BYTES (all his, 22 and 23 September; doorLines.js :148 to :159, hashes :244 to :249; LINES 52 → 58)
B48 "Move {client}'s shoot to {date}? Reply YES or NO." · B49 "Moved: {client} · shoot · {date}." · B50 "Cancel {client}'s shoot on {date}? Reply
YES or NO." · B51 "Cancelled: {client} · shoot · {date}." · B52 "No shoot for {client} on the calendar." · B53 "Two shoots for {client}: {date} ·
{date}. Say the date." Spoken already carried: B3, B7, B8, B34, B35, B36, B47 (not a byte), B54, B75, B76.

## 4 · DEPARTURES, DISCLOSED
4.1 'cal_mixed' (not in the design): a move or cancel beside any other act reads B34 and writes NOTHING, not even the other act. Reason: one
    question per turn; a write beside an unanswered question would leave her unsure what landed. b93's exit table gains its row (19 reasons, 25 returns).
4.2 readDaySpine is "byte-preserved" but for two adaptations INSIDE the moved block, plus its return: (a) `vendor.id` became the parameter `vendorId`;
    (b) the failed read RETURNS { ok:false, error: dayErr.message } where the router answered 500 (the router keeps its console.error and 500 byte for
    byte, reading the error off the return); and the split RETURNS { ok:true, events, blocks }. b105 4.4 pins the moved block equal to 3af9a01's
    :60 to :82 with exactly (a) and (b) applied; 4.1 pins the router's payload byte-identical before and after on the same rows.
4.3 R-45.9 (the founder, "ill go with your recomendation"): B53 for THREE OR MORE shoots is DERIVED from his byte: the word "Two" becomes the count
    as a numeral and the list extends by " · " ("3 shoots for {client}: {date} · {date} · {date}. Say the date."). Exactly two is his byte verbatim;
    the hash-carried template is unchanged (doorLines.js shootsLine :394). Pinned by b105 1.7 and 2.23 (the three-row plant). B61 takes the same form in cut 3.
4.4 THE TWO RE-AIMED day.js READERS: b0457_crud_crew ("seam b: the day-fetch SELECT carries assigned_member_ids (source)") and b6_s2 ("the spine
    read carries BOTH covenants", "blocks and engagements split from ONE read") asserted day.js SOURCE lines that moved. They were RED on the cured tree
    in the differential; each now reads daySheet.js AND requires day.js to call readDaySpine(supabase, vendor.id, date). Bites proven: removing the
    cancelled filter, or assigned_member_ids, from daySheet.js reddens each. Labelled at site.
4.5 LEFTOVER example 5 ("Move the Verma shoot to 22 November") switches on by covering edit_event (EXAMPLE_ACTS unchanged; b93 2.2 and 2.4 re-pinned).

## 5 · PROOF · rung b105 (scripts/b105_lcv13_move_cancel_bench.js), on b104's harness verbatim (C-44.3's PGRST116 double)
Cured: 67/67, and 67/67 on three shifted clocks (00:15 IST 24 Sep 2026; 29 Feb 2028; 00:10 IST 1 Jan 2028).
Base 3af9a01: 10 passed, 57 failed, no crash. Green at the base by nature, labelled: 1.4 and 1.6 (refusals that hold when nothing is admitted),
2.20 and 2.21 (the base never writes a move), 4.1 and 4.2 (the base router against itself), 6.1, 6.3, 6.4 (laws), 7.13 (2a's B40).
Records replayed verbatim (C-44.12): the P7 listening table (sha256 f563b33daa37…, verified) rows 6 C1/C2, 7 C1/C2, 8 C1/C2, 9 C2.
Mutations of production code, all reddening: M1 B53 folded into DATE_ASKS (K4: her "8 January" becomes the destination) · M2 B50's day from the ear ·
M3 the resolver reads cancelled shoots · M4 anything but NO writes · M5 the checker's sentence replaced · M6 the one-question guard removed ·
M7 a lookup after B53 read as moving on · M8 K8 undone (the ledger says "via calendar") · M9 the spine loses its cancelled filter.
Laws: 6.2 LINES 58 with the six hashes literal; 6.3 planMoney, planPayment, planBooking, applyRow, reread and the live-row block hash-pinned;
6.4 eventWrite.js, availability.js, lifecycleHands.js, paymentReminders.js, pendingMoneyActs.js, listenerDoor.js byte for byte the 3af9a01 blobs.
§7 is the card in his words, step by step, on the estate 2a's walk left (K6).

## 6 · THE SEALED RUNGS AND THE DIFFERENTIAL
Re-pinned, each labelled at site: b90 196 → 202 (six 1.1 cells; 4.2; 5.1 re-aimed at assign_crew; M5's anchor) · b92 173 (14.1; N19's anchor) ·
b93 129 → 130 (2.2, 2.4, the cal_mixed row, 3.2) · b94 62 (7.4) · b95 74 (M12's anchor) · b97 59, b98 47, b99 56, b102 24, b103 42 (LINES 58) ·
b104 70 (2.1, 10.2). b96 96 and b101 78 and b100 16 unmoved. b0457 and b6_s2 re-aimed (§4.4).
The differential: 97 benches by path shape at ONE base (worktree at 3af9a01, real node_modules, engine built, sibling pwa) and at the cured tree:
92 byte-identical after scrubbing; b90, b92, b93 differ only by the re-pinned names and counts; b0457 and b6_s2 the two relocation reds, cured.

## 7 · THE FLOOR
run-floor.sh whole, --delivery scripts/floor-manifest-lcv13-p7-2b.txt --check, under setsid, git status read on both trees before and after.
Run 1 reached its sentinel: "FLOOR = NAMED BASE, no delta". A comment-only edit followed (the F-44.128 comment returned to its own line in
standKeyOf); run 2 died with the seat's turn and is not claimed; run 3 is the floor of record: see §7.1.
7.1 RUN 3, THE FLOOR OF RECORD: reached its sentinel, exit 0: "FLOOR = NAMED BASE, no delta (refusals, not in base: 4)"; 22 RED + 1 ERROR, exactly floor-base.txt; "[F-14.16] declared files unmoved — set and contents both verified." Git status 19 declared paths before and after; base 0 and 0. This handover was placed after run 3: a docs-only path, declared in the manifest, read by no bench.

## 8 · THE WALK RECORD · 23 September 2026 · DEV440 · e4a5c06 (Railway ACTIVE 12:26 IST, deploy e8e2d83f) · ALL THIRTEEN STEPS GREEN
Read by script from the founder's exports (sha256 prefixes): thread 7f2b27ccca2d (28 rows), events 37c32451af95 (3 rows), lead 47bfc2b42a9b (1 row), dream-os-marketing
"forwarded vendor" log b337faa5711d (220 rows). Times UTC; IST is +5:30. Each reply is compared byte for byte with the card.
Fixture read before step 1: DEV440 1; Walk Seventeen Alpha wedding 2027-01-08; shoots 8 and 9 January 2027 upcoming; Zeta 0; blocks on 2027-03-24 0.
8.1 Step 1 · 06:59:03 · app · "Move the Walk Seventeen Alpha shoot to 22 November 2027" → B53 "Two shoots for Walk Seventeen Alpha: 8 January 2027 · 9 January 2027. Say the date." · heard {edit_event, 22 November 2027}.
8.2 Step 2 · 06:59:16 · "8 January 2027" → B48 "Move Walk Seventeen Alpha's shoot to 22 November 2027? Reply YES or NO." · heard {edit_event, date "8 January 2027"}; the SHOOT note picked
    the 8 January row and the CAL note kept iso 2027-11-22: K4 held live (her answer picked the row, never became the destination).
8.3 Step 3 · 06:59:23 · "No" → B3 "Okay. Nothing was changed."
8.4 Steps 4 and 5 · 06:59:35, 06:59:46 · the same two questions again, verbatim.
8.5 Step 6 · 06:59:58 · "YES" → B49 "Moved: Walk Seventeen Alpha · shoot · 22 November 2027." · donna_edit_event {event_id 627e6acc…, date 2027-11-22} result moved.
8.6 Off-card · 07:00:11 and 07:00:20 · the step 7 cancel answered "NO" → B50 then B3; nothing cancelled (a second witness of the NO path).
8.7 Step 11 · 07:00:59 · "Move the Walk Seventeen Zeta shoot to 1 June 2027" → B76 "No lead called Walk Seventeen Zeta. Add the lead first."
8.8 Step 12 · app screens · the day sheet for 22 November 2027 shows the Walk Seventeen Alpha shoot (his screenshot); lead wedding_date 2027-01-08 (lead export): ruling 3 held.
8.9 Step 13 · WhatsApp · his words "Block 24 march 2027 personal" (the card wrote "Block 24 March 2027, personal"; the difference is his typing) → B40 "Blocked: 24 March 2027 · personal."
    at 08:01:46 · heard {block_date, 24 march 2027, reason_as_spoken personal} · donna_block_date result blocked · events row 2027-03-24 kind blocked, notes 'personal', created 08:01:45.97.
    2a's B40 on the WhatsApp lane, with its reason: the first live witness of the reason slot (2a's walk saw it dropped every time).
8.10 Steps 7 and 8 · 08:15:43, 08:15:50 · "Cancel the Walk Seventeen Alpha shoot on 9 January 2027" → B50 "Cancel Walk Seventeen Alpha's shoot on 9 January 2027? Reply YES or NO."; "YES" →
    B51 "Cancelled: Walk Seventeen Alpha · shoot · 9 January 2027." · donna_cancel_event {event_id 937ce48a…, state cancelled} · events row state cancelled, deleted_at empty (cancelled, never deleted).
8.11 Steps 9 and 10 · 08:16:03, 08:16:11 · "Cancel the Walk Seventeen Alpha shoot" (one left) → B50 "Cancel Walk Seventeen Alpha's shoot on 22 November 2027? Reply YES or NO."; "No" → B3; the 22 November row stands upcoming.
8.12 END STATE: Walk Seventeen Alpha shoot 2027-11-22 upcoming; the 9 January shoot cancelled; the 24 March 2027 block (personal) live; the lead's wedding date 2027-01-08.
8.13 F-44.131, THE WAIT ON STEP 13: a Meta-side delivery outage for the vendor PNID 1197664646766743. At dream-os-marketing, the last vendor-PNID event was 03:23:34.357 (08:53 IST);
    the next was 08:01:42.063 (13:31:42 IST, → 200), carrying the step 13 message; dream-os saved and answered it by 08:01:46. The bride PNID 1193630900506451 kept delivering
    through the gap (07:26:18 to 07:40:14, → 200). No callback, verify token, subscription, variable or code changed on either side. The control of 07:28:56 (one unsigned POST → 403
    and one "[webhook:meta] invalid X-Hub-Signature-256" line) proved dream-os live; public.failed_turns held 0 rows for the day. His earlier sends at about 12:35 and 12:40 IST produced no
    event at the ingress; only one step 13 message reached the thread. Withdrawn suspicions stay withdrawn: the WhatsApp terms that took effect 23 September (no source ties them to
    delivery) and business-scoped user IDs (no such message reached the receiver). Context only: service messages are billable from 1 October (the founder's to act on in Business Suite).
    A reading taken in error and corrected: "surface=whatsapp" is printed only on the app lane, so its empty result was no evidence.
8.14 No miss; no finding from the walk. F-44.131 is Meta's, closed by the chair.

## 9 · OPEN
Cut 2b is walked green (§8). F-44.131 closed by the chair as a Meta-side outage (§8.13).
Cut 3 (the team and the payment reminder) and cut 4 (the lookups) remain; cut 4 goes to LCV-14 from a written state (accepted in advance).
The 2a handover's blob is 5b21b423553d at 3af9a01, not the kickoff's (c-45.10).
