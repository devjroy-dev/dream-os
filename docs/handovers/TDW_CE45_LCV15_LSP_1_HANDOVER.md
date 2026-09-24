# repo: dream-os @ 89e3a6e (base) · dreamos-pwa @ 320ad7e (untouched) · code · TDW_CE45_LCV15_LSP_1.zip
# TDW · CE-45 · SEAT LCV-15 · LC-VICTOR, THE LAST SERVER PACKET · LSP_1 · THE CHAIN'S CALLS LEAVE THE WORKING ROOMS · 2026-09-24 IST

Line numbers are derived by command at 89e3a6e and at the cut; re-derive before citing. Trust evidence over narrative, including this file.

## 1 · WHAT THIS CUT DOES (the founder's principle, R-44.32 and R-44.37: what lived only to let Victor speak in the working rooms goes)
The WhatsApp vendor lane and the app's business room no longer hold any path to the chain (Victor and Donna). The door answers every
working-room turn, or its stand-in does, as it has since 21 September; what is deleted is the machinery below the door that nothing
reached, plus the switch that could have brought it back. The Advisor room's engine path is untouched (P8's). No vendor reads a new
byte or loses one: every deleted string was unreachable at 89e3a6e (the copy inventory, §5).

## 2 · THE CHANGES, BY FILE
src/lib/vendorInbound.js · the chain's tail after the door (runTurn, the wire guard and its retry, the relay and introduction seats, the
  calendar signals, the invoice-PDF sends, recordListening) DELETED; the seven pre-door reads that fed only it (calendarSnapshot,
  scratchpad, leadPings, vendorCategory, pendingRelay, moneyFacts, expenseFacts, bookedFacts) DELETED; the waLaneMode require and the
  chain's five deps gone from the destructure; the cap-gate comment that named the three deleted reads amended (comment only).
src/index.js · the engine-loop require, the calendarSignals and leadPings requires, and the five chain seams in vendorInboundDeps gone;
  the deps count (23) derived at site.
src/lib/vendor/workingDoor.js · the switch retired from standIn (the read, both `return null`s, CHAIN_FLAG and its export); the header
  amended at site. standIn never returns null. The money functions and the live-row block are byte-identical (b110 §5).
src/lib/laneFlags.js · the census entry `vendor.working_chain_enabled` removed (Q6, ruled retired). An admin_config row of that key, if
  one exists in production, is inert; no SQL.
src/api/vendor-engine/chat.js · listenAfterWire and its three calls, both req._lcvEar lines and the listenerDoor require DELETED (it
  returned at once in the Advisor room and ran only on a business turn that reached the chain); CONFIRM_SHAPE_RE, recordImperativeRetry
  and the owner-imperative family (OWNER_IMPERATIVE_RE, IMPERATIVE_STEMS, IMPERATIVE_POLITE, ownerImperative, matchingHands,
  imperativeMiss) DELETED with their exports, each having had no reader but the WhatsApp tail (R3, reported per helper). The Advisor
  room's two runTurn calls stay, behind doorTurn's advisor return (c-45.15).
DELETED FILES (A-45.1, named paths, block 1 `rm -f`, block 3 `git rm`): src/lib/vendor/calendarSignals.js, src/lib/vendor/leadPings.js,
  src/lib/vendor/introductionSeat.js (R1: no requirer after the tail went); scripts/b0498_wa_assign_punct_bench.js,
  scripts/b5_wa_door_bench.js, scripts/b5_wa_door_smoke.js, scripts/b05_f0550_ping_drain_bench.js (their whole subject is deleted code).
scripts/floor-base.txt · b05_f0550 (its subject deleted) and b05_f0555 (its base red died with the tail, §4) removed: 23 lines to 21.
The floor's refusals go 4 to 3 (b5_wa_door_smoke deleted).

## 3 · THE BENCHES (A-45.2: retired cells are named in a table at the harness, printed RETIRED, never counted as a pass; every row must
match exactly one reached cell or the bench exits 1; every bench was read whole for hollow greens)
Sealed rungs relabelled: b06_forkc_wireguard 113 to 95 · b90 223 to 218 · b93 133 to 129 · b104 70 unchanged (10.2 re-pinned to the fixed
blob). Others: b0461_p6 28 to 25 · b0498_fresh_crew_rider 58 to 51 · b05_arc_m5 11 · b05_m2 2 (re-aimed) · b05_f0555 23 (base-red to
green) · b06_bride_arrival 103 to 93 · b06_m3 37 to 32 · b06_relay_hand 126 to 111 · b40 259 to 256 · b65_g1 42 to 40 · b65_mutations 40
to 36 (the tally prints passed over total minus retired) · b68 154 to 136 · b79 31 to 27 · b80 31 to 17 · b84 130 to 129 · b85 50 to 43 ·
b86 58 to 53 · b88 79 · tdw10 38.
Hollow greens retired as such: b06_bride_arrival A11.3; b06_m3 2.3; b85 5.5, 5.8, 5.9; b86 §6 M1; b90 12.10, 12.11. b90's six cells with
a vacuous `turns === 0` conjunct (12.9, 12.12, 13.1 to 13.4) are kept for their live conjunct, labelled (the chair's ruling). b93 §4's
"chain out" cells are re-aimed to prove the door answered whatever the key holds; 4.6 inverted.
The R-44.37 plant is retired from every bench that planted the switch ON: b0498_fresh_crew_rider, b05_m2, b05_f0555, b06_m3 (b06_relay_hand's
forced world sat inside a retired cell).
NEW RUNG b110 (scripts/b110_lcv15_lsp1_bench.js), 40 cells: the WhatsApp lane holds and reaches no runTurn (source and the REAL
processVendorInbound, runTurn spied); standIn fuzzed over 2,079 hostile calls, zero nulls and throws, every answer the door's; the key named
nowhere in src outside a comment (with a grep control); the seven deletions absent and unrequired; floor-base without f0550 and f0555; the
money functions pinned to 89e3a6e's hashes; the chain wiring gone and the Advisor's two calls kept; W-1 NONE from this manifest; three
production mutations each reddening its cell. RED at 89e3a6e (17 pass, 22 fail), GREEN at the cut. It reads no clock.

## 4 · THE PROOF
DIFFERENTIAL, in series on one base, the 128 benches reading an edited or deleted file plus b110, exit codes and outputs diffed: five
exit changes (four deletions, the new rung) and b05_f0555's cure; 28 output changes, each an amendment, a deletion, the rung, or
environmental (b05_arc_m1's tree root and b61's timestamps, proven identical once normalised).
THE SWAP (e-95): b05_f0555 was base-red on 6.2 ("W-1 BREACH: harveySoul", two comments in the deleted tail). At the cut 6.2 passed and 7.1
reddened (it asserted the chain ran, and still planted the switch), counts unchanged at 22 and 1, so a floor by red NAMES read no delta
over a swap. Found by the OUTPUT diff; cured (plant retired, 7.1 re-aimed at the door's completion, the floor-base line removed, b110 4.4).
LESSON, for every later deletion: a base-red bench that reads a deleted file is diffed by OUTPUT, not skipped as already red.
FLOOR (run-floor.sh --delivery scripts/floor-manifest-lcv15-lsp1.txt --check, one continuous setsid run): "FLOOR = NAMED BASE, no delta
(refusals, not in base: 3)", 20 RED and 1 ERROR exactly floor-base's 21, declared files unmoved.

## 5 · THE COPY INVENTORY
New bytes a vendor reads: ZERO. Removed bytes a vendor could read at 89e3a6e: ZERO. Deleted strings, all unreachable: vendorInbound's
stage-2 line "That didn't land — nothing was changed.\n\n" + STAGE2_WA_REPORT (the constant stays); calendarSignals.js's twin of the
Updated:/Cancelled:/crew lines and conflictLines (chat.js keeps its own); leadPings.js's ping block; introductionSeat.js's seat lines.

## 6 · RULINGS AND AMENDMENTS THIS CUT CARRIES
A-45.1 (the chair, 24 September): a delivery that deletes files carries them as named paths in block 1 after the unzip (`rm -f`, never a
glob or a directory), marked as deletions in the manifest and the card's diff, and as `git rm` beside `git add` in block 3; the rung pins
each path's absence.
A-45.2 (the chair, 24 September): the retired-cell mechanism, as §3's header states it.
c-45.14 to c-45.21 (the chair's owned kickoff corrections). F-44.139 (the ping drain stamped acknowledged_at on turns nothing surfaced)
CLOSED AS A RECORD by this cut. e-92 (the seat's red-scan undercount) and e-95 (the swap, §4).
Disclosed and left: listenerDoor.recordListening is callerless (the file is untouched by law); agent/onboarding.js is callerless (R2, kept
for the next cut that opens agent/); the Advisor route's six pre-turn reads in chat.js are dead in that room (named for P8).

## 7 · THE WALK (the card, his words)
NO-CHANGE, WhatsApp only (the chair's weight): rows 1 to 18 sent once on the deploy BEFORE this cut and once AFTER it is ACTIVE, each half
opened with "fresh" so no note carries across; the seat's script diffs the two exports turn by turn, masking only LEFTOVER's two random
examples and B37's model-written {body}. The walk record is written into this file's §8 by script at the confirm.

## 8 · THE WALK RECORD (written by the seat from his exports, 24 September 2026; docs-only under C-44.1)
THE BEFORE HALF (on 89e3a6e's deploy, 23 September 20:56:02 to 21:03:51 UTC): his 25 messages, verbatim, exported as
Supabase_Snippet_Untitled_query__28_.csv (sha256 30e8166d2b102049…); a second export after the walk (…__29_.csv, 80cde32e2610ec4a…). His messages
were not the card's words; R-b ruled that the AFTER half replay HIS twenty-five (c-45.34: "thirty" was a miscount).
THE WALKS' WRITES AND THEIR CLEANUPS: row 6 filed the lead "walk nc" (72f59b26…; the door's P7 phone_as_spoken, the card's B34 expectation the
card's error); the MEMBER answer "No one" filed 694200ba… and put it on the 22 November 2027 shoot (e-96). Cleanup A (confirmed 8f25a9f4dda8…) removed
"No one" and its crew slot (the crew read by name: Walk Seventeen Theta, Walk Seventeen Lambda); Cleanup B (299e6cc8920c…) soft-deleted "walk nc" after
the AFTER half; Cleanup C (0039676a9b39…) soft-deleted "nobody crew" (239f643e…, filed by an off-card message at 07:42:45 UTC on 24 September; never
on the crew). Each read before and after, as run.
THE AFTER HALF (on e813d3f's deploy, 24 September 07:26 to 07:43 UTC): not sent as the card listed it (reworded, added and skipped messages).
Export …__1_.csv (b9bfc2d1f14ea308…). The seat's reader first read BEFORE against BEFORE (e-103, closed: the AFTER run must begin after the BEFORE
run ends); the engine SELECT first returned nothing (e-104, the join corrected; export …__2_.csv, 8d9dbf8093569276…).
THE PAIR, CLOSED AS PARTIAL per R-d (ii): of the AFTER messages whose words equal a BEFORE message, 10 SAME; 2 EXPECTED ("Add a new lead walk nc
phone 9876543210": B16 before, B19 after with the lead live; "Who are my new leads": the list now led by walk nc, the BEFORE half's own write);
1 EAR VARIANCE ("Nobody walk booked with me": BEFORE heard {"acts":[{"act":"find","client_as_spoken":"Nobody walk"}],"route":"search"} → B34;
AFTER heard {"acts":[],"route":"none"} twice → LEFTOVER); NO RED. The rest not comparable (words changed). A no-change gate that two deletion
cuts otherwise prove by rung and differential.

## 9 · NEXT FREE
F-44.140 · migration 0171 · bench b111 · errors e-96 · corrections c-45.22.

---
A PROSE INSTRUCTION IS NOT A MECHANISM. LSP_2 (R-45.16, the screenshot save, B84 and B85) is next, on this cut's tip.
