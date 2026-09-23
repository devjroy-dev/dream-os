# repo: dream-os @ f24ffd9 (base) · dreamos-pwa @ 320ad7e (untouched) · delivery TDW_CE45_LCV14_P7_3.zip · manifest scripts/floor-manifest-lcv14-p7-3.txt
# TDW · CE-45 · SEAT LCV-14 · LC-VICTOR P7 CUT 3 · THE TEAM AND THE PAYMENT REMINDER · rung b106 · 2026-09-23 IST

Every line number below was derived by command at the cured tree on the day of writing; re-derive before citing. The design is the ruled read-first
carried whole in TDW_CE45_LCV13_SEAT_CLOSE_HANDOVER.md §2 (sha256 of the original b968ee9c814b…), LCV-12's designs file §3.1 to §3.6 (sha256
05b449610210…), and the chair's rulings of 23 September on ASKS 1 to 6. Nothing here is minted but F-44.132 (accepted by the chair).

## 1 · WHAT A VENDOR CAN NOW DO BY MESSAGE, ON BOTH LANES
Add someone to her team; assign a team member to a shoot (by the client's name, by the day, or both), adding them to the team first when they
are not on it; and send a client a payment reminder. All three LAND AT ONCE. Money is never touched. A reminder asked by message switches the
invoice's nightly reminders on once the gate is open, exactly as the app's Remind button does (ASK 5).

## 2 · THE DESIGN AS BUILT (workingDoor.js unless named)
2.1 TEAM_ACTS ['assign_crew', 'payment_reminder'] joins COVERED (14). NEEDS_CLIENT unchanged: payment_reminder in it since 2a, assign_crew not.
    HANDS: assign_crew 'assign_crew', payment_reminder 'payment_reminder_send' (the kickoff's names).
2.2 MEMBER_ASKS ['B62'] (ASK 1), its own list beside NAME_ASKS, joins ASKS. validNote admits a MEMBER note only on an assign_crew act with NO member.
    Her answer: her whole trimmed message fills acts[0].member_as_spoken, NEVER client_as_spoken; she has moved on when the ear hears an act of a kind the
    note does not hold, or the assignment restated with another member; an act on route search, or one whose client or member IS her whole message,
    is her answer (F-44.117's class); a closed YES re-asks once, then B3.
2.3 THE OFFER'S SLOT, THREE-WAY: OFFER_SLOTS / slotField, one table read by offerFor and by the B36 re-ask (the only in-place edit the offer needs).
    nearestName is still called from offerFor alone (b99 5.3 unmoved).
2.4 F-44.132 (accepted): validNote dropped an OFFER note's slot at f24ffd9, so the B36 re-ask always read client_as_spoken. The walk that would have
    shown it: a package offer answered with neither YES nor NO (its re-ask named the client). Cured by carrying a known slot; b106 1.8, 2.4, M9.
2.5 THE TEAM READ membersOf: team_members where vendor_id, active true, deleted_at null (studio/team.js GET :42 to :50's predicate). The door's own
    insert insertMember takes studio/team.js POST's row shape (:124 to :131) with role, phone, daily_rate_inr and notes null.
2.6 planAssign, read-only, THREE SHAPES: no member → B62 ASKED with a MEMBER note carrying every act of the message; member alone → TEAM ADD (exact B57;
    else an offer through offerFor, slot member; else ADD, B56 from the row); member with a day and/or a client → ASSIGNMENT: the shoot first (by the
    client's lead through the ONE home and shootsOf, a said day narrowing it: none B52, two or more B53; by the day alone: none B77, two or more
    'assign_many'), then the member (two or more of one name B61; absent → offer, else ADD THEN ASSIGN on two lines); already on the crew B59.
    A client_as_spoken equal under key() to the member is DROPPED (ruling 4; P7 row 11 C1 slots).
2.7 fileAssign: writeEvent AS IT STANDS with { vendorId, surface by lane, source 'victor', event_id, assigned_member_ids: the crew plus her }; B58 from the
    RETURNED events row and the member row; a writer's sentence verbatim; else the glitch line.
2.8 planReminder, read-only: the client by the ONE home (no lead → B36 offer or B76 through 'book_no_lead'; two of a name B8); ITS OWN invoice read
    (vendor_id, lead_id, deleted_at null, state not cancelled: id, client_name, client_phone, client_id); the pending payment_schedules on them in the
    room's own select (reminders.js :168); THE PICK: the first due inside istDayISO(0) to istDayISO(WINDOW_DAYS) (reminders.js :112 to :113), else the
    earliest pending; none → B68.
2.9 fileReminder: sendOneReminder AS IT STANDS (paymentReminders.js :315) with vendorName read as the room reads it and source 'vendor_tap' (ASK 5).
    sent → B67 from the milestone row; already → reminders.js :202's byte REUSED; skipped or failed → out.reason_text VERBATIM (plainWords :94, :114,
    the four lowercase refusals, :425); else the glitch line. A dark gate writes NO row (:360 before the claim at :367).
2.10 ORDER: team acts are PROBED read-only after the calendar's probes (B62 asked, offers made, B76, assign_many exit) and FILED after the calendar's
    writes, before the relay and the money act, in message order, each rebuilt from the rows as they stand.
2.11 standKeyOf: 'assign_many' → B34. 'team_unsayable' falls to the glitch line.

## 3 · THE BYTES (all his; doorLines.js; LINES 58 → 67)
B56 "Added to the team: {member}." · B57 "{member} is already on your team." · B58 "Assigned: {member} · {client} · shoot · {date}." · B59 "{member}'s
already on the {client} shoot." · B60 "No one called {name} on your team. Add them first." (CARRIED, UNSPOKEN, no exit reaches it; from the chair's
copy of his veto sheet of 22 September) · B61 "Two on your team are called {name}: {name} ({role}) · {name} ({role}). Say which one." (membersLine;
three or more R-45.9's derived form; {role} the row's role, else the phone's last four, else the day added) · B62 "Who? Say the name." · B67
"Reminder sent to {client}: {milestone} · Rs {amount} · due {date}." · B68 "Nothing is due from {client}." The eight of the designs file were
extracted by script from it, never retyped. REUSED: reminders.js :202, paymentReminders.js :94, :114, :425.

## 4 · DEPARTURES, DISCLOSED (accepted by the chair, word for word)
(a) B61 and B53-on-an-assignment keep NO note (MEMBER_ASKS is ['B62'] as ruled); she restates.
(b) A day holding two or more shoots with no client reads B34 ('assign_many'); no byte of his fits and the door never guesses.
(c) An offer is withheld on a note turn except B62's answer; a near name then is ADDED.
(d) B67's {client} is the LEAD ROW's name.
(e) Covering assign_crew switches on LEFTOVER examples 11 and 12 through EXAMPLE_ACTS.
(f) The existing B35 answer path can fill client_as_spoken on an assign_crew beside a nameless reminder; left as it stands.

## 5 · PROOF · rung b106 (scripts/b106_lcv14_team_reminder_bench.js), on b105's harness verbatim (C-44.3's PGRST116 double)
Cured 80/80, and 80/80 on three shifted clocks (00:15 IST 24 Sep 2026; 29 Feb 2028; 00:10 IST 1 Jan 2028). Base f24ffd9: 4 passed, 76 failed, no crash
(green by nature: 4.11 a labelled control; 6.1 to 6.3 laws). Records replayed verbatim through the REAL normaliseRequest: the P7 table
(sha256 f563b33daa37…, verified) rows 10, 11, 12, 17, 18 (slots) and 17 C1 asis (control). The double gives a team insert Postgres's defaults
(PUBLIC_SCHEMA.md :1324; C-44.3). The REAL writeEvent; the REAL sendOneReminder over a FAKE transport with the switchboard primed.
Mutations of workingDoor.js, all reddening: M1 COVERED loses the team acts · M2 the client double kept · M3 the slot two-way · M4 the window pick removed ·
M5 source nightly · M6 the member note fills client · M7 B58 with no write · M8 the exact-member check removed · M9 F-44.132 undone.
Laws: LINES 67 with the nine hashes literal; B60 named nowhere in the door; planMoney, planPayment, planBooking, applyRow, reread and the live-row
block hash to their f24ffd9 text; eventWrite, availability, lifecycleHands, paymentReminders, pendingMoneyActs, listenerDoor, daySheet,
worklistToday, reminders.js and studio/team.js byte for byte their f24ffd9 blobs. §7 is the card in his words, steps 1 to 12 and 10b, on the estate his fixture
read of 23 September returned plus step 10b's invoice TDW/DEV440/25 (79 → 80 at the chair's read: 10b planted as 7.10b, c-44.48; 7.11 in the card's
words, the switch's sentence).

## 6 · THE SEALED RUNGS RE-PINNED, each labelled at site
b90 202 → 211 (RULED gains nine, one cell each; the HANDS image admits the two names; 4.2 COVERED at fourteen; 5.1's uncovered specimen `note`; M5 at
HANDS' new last entry) · b92 173 held (4.4 specimen `note`; 14.1 COVERED at fourteen; N19's anchor) · b93 130 → 132 (the uncovered specimen `note`;
two exit rows added: team_unsayable, assign_many; 2.2 nine examples; 2.4 thirty-six pairs; 2.5 re-aimed to whatsdue; 3.2 21 reasons, 29 returns;
7.1) · b94 62 held (3.2 specimen; 7.4 COVERED) · b95 74 held (the hostile note and 9.13's control over `note`; M12's anchor gained the slot) ·
b97 59, b98 47, b102 24, b103 42, b105 67 held (LINES 67) · b99 56 held (LINES 67; M8's anchor through slotField) · b101 78 held (1.8 holds
assign_crew out of both sides; 6.6's anchor) · b104 70 held (2.1 COVERED at fourteen; 10.2 LINES 67). b96 96 and b100 16 unmoved.

## 7 · THE DIFFERENTIAL AND THE FLOOR
THE DIFFERENTIAL, BEFORE THE FLOOR: 142 benches (every script reading src/lib/vendor/, vendor-engine/chat or vendorInbound, plus the kickoff's
symbol readers of studio/team.js, paymentReminders.js, worklistToday.js and daySheet.js; wider than 2b's 97 by path shape, taken by the chair), run at
ONE base (a worktree at f24ffd9, a REAL node_modules copy, engine built, sibling dreamos-pwa at 320ad7e) and at the cured tree, git status read first
(base 0, cured 18), exit codes AND outputs diffed after scrubbing timestamps, durations, wamids, UUIDs and temp paths: 137 of 142 byte-identical;
b106 exists only at the cured tree (79 cells when the differential and the floor ran; 80 after the 10b plant, a rung-only change for which
neither was re-run); b90, b92, b93 and b95 differ ONLY by the re-pinned cell names and count lines (zero FAIL lines in any cured
output); no exit code differs. Red at BOTH trees with identical outputs, every one in scripts/floor-base.txt or a refusal: b05_arc_m6,
b05_f0550_ping_drain, b05_f0555_media_dedupe, b05_p4_crons, b06_meter, b07_f0772_circle_auth, b07_p4b_body, b07_p5, b08_p5_oow_relay,
b10_p3_mint_deck, b39_telemetry, b51_referrals, b59_g34_reminders, b59_mutations, b61_mutations; refused b06_gauntlet, b5_wa_door_smoke.
e-89 (the chair's): the two loops ran in parallel and b89 at the base collided on its shared /tmp engine build; re-run alone at the base, 35/35,
identical. Differential loops run in SERIES.
THE FLOOR OF RECORD: scripts/run-floor.sh --delivery scripts/floor-manifest-lcv14-p7-3.txt --check, whole, under setsid, run after the differential,
git status read on both trees before (base 0, cured 18) and after (base 0, cured 18). Sentinel, exit 0: "FLOOR = NAMED BASE, no delta (refusals, not in
base: 4)"; 22 RED and 1 ERROR (b5b_movementb), exactly the 23 lines of scripts/floor-base.txt; refusals b06_gauntlet, b5_wa_door_smoke,
bf1_bride_tool_fidelity_bench, test-shape; "[F-14.16] declared files unmoved — set and contents both verified."

## 8 · THE WALK RECORD
Card 3 as confirmed: steps 1 to 12 in his words; step 10 (Sarah) reads B68 on the estate his fixture read (her only invoice paid, nothing pending),
the dark gate standing on b106 4.4; step 10b (ASK 6, his choice, taken): invoice TDW/DEV440/25 for Walk Seventeen Alpha, created in the app, and
the lead's phone 8757788550 (his own line). sendOneReminder refuses the gate at :360 BEFORE the phone at :361, so 10b and 11 read :94 whatever the
phone, provided the fixture shows the invoice linked to the lead (lead_id); unlinked, both read B68. Nothing is sent on this walk: the flag is off.
R-43.17's list is unchanged (only 9888294440 and 8595356978 receive a walk's outbound).
(written in by script from the founder's export after the walk, never retyped)

## 9 · LCV-13's SEAT CLOSE §6, AMENDED WITH THE CHAIR'S NUMBERS
e-83 the "21 paths" count (it was 20) · e-84 the comment misplaced after floor run 1 · e-85 the void "surface=whatsapp" search · e-86 two withdrawn
suspicions on F-44.131 · e-87 K5's first form keeping "Two" · e-88 the seat close's own §1 lines for CAP_KEY (:57, truly :60) and sendGate (:101, truly
:103); the kickoff's carrying of them is the chair's c-45.11.

## 10 · NEXT FREE
F-44.133 · migration 0171 · bench b107 · errors e-90 · corrections c-45.12.
