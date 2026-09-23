# repo: dream-os @ 69f4b99 (base) · dreamos-pwa @ 320ad7e (untouched) · delivery TDW_CE45_LCV14_P7_3_FIX1.zip · manifest scripts/floor-manifest-lcv14-p7-3-fix1.txt
# TDW · CE-45 · SEAT LCV-14 · LC-VICTOR P7 CUT 3 · FIX 1 · F-44.133, THE DOOR READS THE CLIENT OUT OF THE KIND · rung b107 · 2026-09-23 IST

Line numbers derived by command at the cured tree on the day of writing; re-derive before citing. The ruling is the chair's of 23 September on F-44.133, cure (i).

## 1 · WHAT CHANGES FOR A VENDOR
"Assign {member} to the {client} shoot" now assigns. On the cut 3 walk the ear returned the client inside kind_as_spoken ("Walk Seventeen Alpha shoot") and no
client_as_spoken on five turns (10:34:00, 10:34:12, 10:34:30, the 10:35:08 note, 10:35:21 UTC), so the door read a team add (B57, B56 alone).

## 2 · THE CURE AS BUILT (workingDoor.js)
kindClient(act, L) (:806): on an act with no client_as_spoken, a kind_as_spoken that is NOT one of eventWrite's CALENDAR_KINDS, minus ONE trailing calendar kind
word, is read as the client. "shoot" alone (any calendar kind alone) is the kind and never a client. planAssign reads it at :829, the one line that changed in the
plan: `spotless(act.client_as_spoken) || kindClient(act, L)`. The read client then goes where every client goes: the ONE home (lead exact; B36; B76), the
client-equal-member drop, shootsOf. A heard client_as_spoken wins. The record keeps what was HEARD. NO LISTENER BYTE; doorLines.js and listenerDoor.js unmoved.
DISCLOSED CONSEQUENCE: a kind of no calendar word with no client (for example "haldi shoot" read as "haldi") is now a client, so it reads B76 "No lead called
haldi. Add the lead first." where it read a team add before. A refusal that writes nothing, in his own line, in place of a wrong write.

## 3 · PROOF · rung b107 (scripts/b107_lcv14_kind_client_bench.js), b106's harness and definitions carried byte for byte
Cured 27/27, and 27/27 at 00:15 IST 24 Sep 2026, 29 Feb 2028 and 00:10 IST 1 Jan 2028. Base 69f4b99: 9 passed, 18 failed, no crash (green by nature: 2.4 and
5.8a, B62 stood before the fix; 2.6, the record untouched; 2.9 and 2.10, controls; 4.1 to 4.4, laws).
§1 kindClient units, the "shoot"-alone control over every CALENDAR_KIND, totality over fifty hostile pairs. §2 THE FIVE WALK TURNS REPLAYED VERBATIM (the
thread export, sha256 prefix b02566fba96b) through the REAL normaliseRequest on the estate they met: B58, B59, B56 then B58, B62 with the kind on its note,
B59; the ONE home for the read client (B76, B36); kind "shoot" alone still a team add; a heard client wins. §3 mutations, all reddening: M1 the read removed;
M2 the trailing kind word kept; M3 the calendar-kind guard removed. §4 laws: the money functions and the live-row block at their f24ffd9 text; doorLines.js
69f4b99's blob (LINES 67); listenerDoor.js f24ffd9's; the manifest. §5 the fix card in his words.
Sealed rungs at the cured tree, all green and NONE re-pinned: b90 211 · b92 173 · b93 132 · b94 62 · b95 74 · b96 96 · b97 59 · b98 47 · b99 56 · b100 16 ·
b101 78 · b102 24 · b103 42 · b104 70 · b105 67 · b106 80.

## 4 · THE CUT 3 WALK RECORD rides this delivery: TDW_CE45_LCV14_P7_3_HANDOVER.md §8, written by script from his exports; F-44.134 under its open.

## 5 · THE DIFFERENTIAL AND THE FLOOR
THE RUNS OF RECORD (reported to the chair 23 September; one detached setsid chain started 11:21 UTC, sentinel 11:46:37 UTC):
THE DIFFERENTIAL, IN SERIES (e-89 kept), BEFORE THE FLOOR: 143 benches (cut 3's path-shape set plus b107) at ONE base (a worktree at 69f4b99, a REAL
node_modules copy, engine built, sibling dreamos-pwa at 320ad7e), THEN at the cured tree; git status before base 0, cured 5; after base 0, cured 5. 142 of 143
byte-identical after scrubbing; b107 exists only at the cured tree (exit 0); no exit code differs; no sealed rung moved, none re-pinned. Red at BOTH trees
with identical outputs, every one in scripts/floor-base.txt or a refusal: b05_arc_m6, b05_f0550_ping_drain, b05_f0555_media_dedupe, b05_p4_crons, b06_meter,
b07_f0772_circle_auth, b07_p4b_body, b07_p5, b08_p5_oow_relay, b10_p3_mint_deck, b39_telemetry, b51_referrals, b59_g34_reminders, b59_mutations,
b61_mutations; refused b06_gauntlet, b5_wa_door_smoke.
THE FLOOR OF RECORD: scripts/run-floor.sh --delivery scripts/floor-manifest-lcv14-p7-3-fix1.txt --check, whole, after the differential in the same chain.
EXIT 0: "FLOOR = NAMED BASE, no delta (refusals, not in base: 4)"; 22 RED and 1 ERROR (b5b_movementb), exactly the 23 lines of scripts/floor-base.txt;
refusals b06_gauntlet, b5_wa_door_smoke, bf1_bride_tool_fidelity_bench, test-shape; "[F-14.16] --delivery mode: 5 dirty path(s), all declared" and
"declared files unmoved — set and contents both verified." Git status after the floor: base 0, cured 5.
AN EARLIER, UNREPORTED RUN, DISCLOSED: the container also holds a differential (/tmp/diff2, 10:50 to 11:01 UTC), a floor (EXIT 0 at 11:15:53 UTC, the same
line) and a first form of this section (written 11:19:59 UTC), all from a seat turn whose report never reached the chair. They are not the runs of record;
this section was rewritten at the attach from the logs of record. No delivered file other than this one changed after 10:48:31 UTC (the build).

## 6 · THE FIX CARD (re-walk of card 3's steps 5 to 8b with a FRESH member, Walk Seventeen Lambda; Theta stays on the team, Kappa stays assigned)
5 "Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot" → "Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027."
6 the same → "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot."
7 "Assign Walk Seventeen Lambda to the Walk Seventeen Alpha shoot" → "Added to the team: Walk Seventeen Lambda." then "Assigned: Walk Seventeen Lambda · Walk Seventeen Alpha · shoot · 22 November 2027."
8a "Assign to the Walk Seventeen Alpha shoot" → "Who? Say the name."
8b "Walk Seventeen Theta" → "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot."
The walk record: THE RE-WALK · 23 September 2026 · DEV440 · fafbaa9 (Railway ACTIVE about 18:18 IST) · WRITTEN BY SCRIPT FROM THE FOUNDER'S EXPORTS, NEVER RETYPED
  thread (engine.messages with meta.listener, from 18:25 IST) 16 rows, sha256 35d57be6e3906762521f085584ffeedf50ad2e3266ecedb55d78481a601e9675
  team_members (Walk Seventeen%) 3 rows, sha256 81863096207df521e9d46ac3430659fda29d204902de95803445c4379e0d9845
  events (Walk Seventeen Alpha shoots) 3 rows, sha256 f7a548f70705e55c9ba241b5399d639c71842252a05e0d10febc3c611c0531d8
  and his read of 22 Nov 2027's rows (18:3x IST): 627e6acc cancelled at 18:35:23 IST, crew [Kappa] kept, deleted_at null; 0498bdb7 (morning block) deleted_at 18:35:30 IST.
  Every export read-only, handed on his word (the chair: a read-only read on his word is not a C-44.10 breach). Times UTC (IST +5:30). Every turn lane pwa,
  answered by code. Nothing sent; money untouched.
  THE INTERRUPTION: the first re-walk turn met a live morning block on 2027-11-22 (created 16:47:57 IST, no door turn made it) and writeEvent refused the crew
  patch (occupancy on row ⊕ patch); the door spoke occupancy.js :993's sentence verbatim. Removing the block from the app, the founder also cancelled the shoot
  from the app ("that delete prabbly happened when i was trying to block unblock because the surface reads confusingly"). The card was adjusted (step 0, a fresh
  booking by message) and put to the chair; the founder walked it.
  WHAT THE LIVE EAR DID: on every assign_crew turn of this re-walk the ear put the client in client_as_spoken and "shoot" in kind_as_spoken, so kindClient
  (F-44.133's cure) was NOT exercised live; it stands on b107 §2 (the five recorded kind-shape turns replayed verbatim) and M1. The ear's shape varies by turn.
  AN OBSERVATION, NOT MINTED: the refused turn's recorded call reads result 'refused:write_failed' although the writer returned a conflict; fileBook records
  'refused:{conflict.kind}'. The reply was right; only the record's label is coarse. For the chair.

1. pre-walk · REFUSED BY THE WRITER (the morning block 0498bdb7, made 16:47:57 IST; nothing written)
   13:00:10 HE: Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot
   13:00:10 DOOR · lane pwa: You've blocked the morning of 22 November. That one's a no — unblock it first if you want it back.
   HEARD: {"acts":[{"act":"assign_crew","kind_as_spoken":"shoot","client_as_spoken":"Walk Seventeen Alpha","member_as_spoken":"Walk Seventeen Theta"}],"route":"task"}
   CALLS: [{"name":"assign_crew","input":{"member":"Walk Seventeen Theta","event_id":"627e6acc-267e-4f1a-932b-dc6a406fd511"},"result":"refused:write_failed"}]

2. pre-walk · B52, TRUTHFUL (the shoot 627e6acc had been cancelled from the app at 13:05:23 UTC; the block removed from the app at 13:05:30 UTC)
   13:07:00 HE: Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot
   13:07:01 DOOR · lane pwa: No shoot for Walk Seventeen Alpha on the calendar.
   HEARD: {"acts":[{"act":"assign_crew","kind_as_spoken":"shoot","client_as_spoken":"Walk Seventeen Alpha","member_as_spoken":"Walk Seventeen Theta"}],"route":"task"}

3. 0 GREEN (B46; a NEW row, 7f9a837b; findExistingEvent excludes cancelled rows)
   13:10:04 HE: Book the Walk Seventeen Alpha shoot on 22 November 2027
   13:10:04 DOOR · lane pwa: Booked: Walk Seventeen Alpha · shoot · 22 November 2027.
   HEARD: {"acts":[{"act":"book_event","date_as_spoken":"22 November 2027","kind_as_spoken":"shoot","client_as_spoken":"Walk Seventeen Alpha"}],"route":"task"}
   CALLS: [{"name":"donna_book_event","input":{"date":"2027-11-22","kind":"shoot","lead":"Walk Seventeen Alpha"},"result":"booked"}]

4. 5 GREEN (B58)
   13:10:12 HE: Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot
   13:10:12 DOOR · lane pwa: Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027.
   HEARD: {"acts":[{"act":"assign_crew","kind_as_spoken":"shoot","client_as_spoken":"Walk Seventeen Alpha","member_as_spoken":"Walk Seventeen Theta"}],"route":"task"}
   CALLS: [{"name":"assign_crew","input":{"member":"Walk Seventeen Theta","event_id":"7f9a837b-10b8-4c8b-a86c-05211a3e64e9"},"result":"assigned"}]

5. 6 GREEN (B59)
   13:10:20 HE: Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot
   13:10:20 DOOR · lane pwa: Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot.
   HEARD: {"acts":[{"act":"assign_crew","kind_as_spoken":"shoot","client_as_spoken":"Walk Seventeen Alpha","member_as_spoken":"Walk Seventeen Theta"}],"route":"task"}

6. 7 GREEN (B56 then B58)
   13:10:45 HE: Assign Walk Seventeen Lambda to the Walk Seventeen Alpha shoot
   13:10:45 DOOR · lane pwa: Added to the team: Walk Seventeen Lambda.

Assigned: Walk Seventeen Lambda · Walk Seventeen Alpha · shoot · 22 November 2027.
   HEARD: {"acts":[{"act":"assign_crew","kind_as_spoken":"shoot","client_as_spoken":"Walk Seventeen Alpha","member_as_spoken":"Walk Seventeen Lambda"}],"route":"task"}
   CALLS: [{"name":"assign_crew","input":{"member":"Walk Seventeen Lambda"},"result":"member_added"},{"name":"assign_crew","input":{"member":"Walk Seventeen Lambda","event_id":"7f9a837b-10b8-4c8b-a86c-05211a3e64e9"},"result":"assigned"}]

7. 8a GREEN (B62, MEMBER note)
   13:10:53 HE: Assign to the Walk Seventeen Alpha shoot
   13:10:53 DOOR · lane pwa: Who? Say the name.
   HEARD: {"acts":[{"act":"assign_crew","kind_as_spoken":"shoot","client_as_spoken":"Walk Seventeen Alpha"}],"route":"task"}
   NOTE: {"acts":[{"act":"assign_crew","kind_as_spoken":"shoot","client_as_spoken":"Walk Seventeen Alpha"}],"asked":"B62","tries":0}

8. 8b GREEN (B59, answered B62)
   13:11:05 HE: Walk Seventeen Theta
   13:11:05 DOOR · lane pwa: Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot.
   HEARD: {"acts":[{"act":"assign_crew","kind_as_spoken":"shoot","client_as_spoken":"Walk Seventeen Alpha","member_as_spoken":"Walk Seventeen Theta"}],"route":"task"}

The rows the re-walk left:
  team: Walk Seventeen Theta active true id ab47e7a0; Walk Seventeen Kappa active true id 223f3dc3; Walk Seventeen Lambda active true id ef86e1c0
  shoots: 937ce48a 2027-01-09 cancelled crew []; 627e6acc 2027-11-22 cancelled crew ["223f3dc3-84e6-4ec6-9a79-b6491f5c91c9"]; 7f9a837b 2027-11-22 upcoming crew ["ab47e7a0-6454-4a85-a398-5cec2d47001f","ef86e1c0-a1d2-4efa-87ee-b51774d0adff"]
  The new shoot 7f9a837b carries Theta (ab47e7a0) and Lambda (ef86e1c0); the cancelled 627e6acc keeps Kappa. Its notes: "Walk Seventeen Theta assigned — 23 Sep",
  "Walk Seventeen Lambda assigned — 23 Sep" (writeEvent's own trail).
VERDICT: steps 0, 5, 6, 7, 8a, 8b GREEN, every reply byte-exact to the card. The two pre-walk turns are the writer's refusal and a truthful B52. F-44.133's
walk closes on the card; its cure's live proof awaits an ear that repeats the kind shape (the rung holds it).


## 6b · OPEN, FOR THE CHAIR
The founder's surface points of 23 September, in his words: "previously could unblock from surface or add crew from surface! thats also gone"; "the surface
reads confusingly"; "ask CE to change the word. Hold the day sounds like victor prose again". With F-44.134, for the app-side cut (R-45.10) unless ruled
otherwise. writeEvent refusing a crew-only patch on a full-day shoot for a morning block that day: the writer's ruled behaviour, recorded.

## 7 · NEXT FREE
F-44.135 · migration 0171 · bench b108 (cut 4) · errors e-91 · corrections c-45.13.
