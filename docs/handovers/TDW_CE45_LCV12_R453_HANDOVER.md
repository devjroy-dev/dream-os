# repo: dream-os @ 541f14552ffac295296fe40b16dab411ced484c0 · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307 (untouched by this cut)
# TDW · CE-45 · SEAT LCV-12 · LC-VICTOR P7, CUT ONE · R-45.3 THE COLD SECOND HEARING · rung b103 · 2026-09-22 IST
# Delivery version: the walk record (§7) is written in by script from the founder's export after the walk, never retyped. Line numbers were
# derived by command at the moment of cutting; re-derive before citing. No byte a vendor reads changes in this cut.

## 1 · WHAT THIS CUT DOES, IN ONE PARAGRAPH
On the first P6b walk of 22 September the ear heard three of seven "Tell Sarah ..." sentences as no task inside a long thread (16:01:48,
16:02:25, 16:12:58 UTC, each {"acts":[],"route":"none"}, each read LEFTOVER) while cold, with no thread, the same shape was heard nine times
in ten (F-44.122). The founder ruled R-45.3 ("yes to the code 2nd hearing. i feel that can cure a lot of issues."). This cut is the mechanism:
in preTurn, after the first hearing and before the note branches, on a turn answering no note and meeting no live money row, when the ear
returned route none with no acts and her message under key() contains the name of one of her LIVE leads (never a name under three characters),
the door hears the SAME message once more with the thread stripped (conversationId null) and decides on that second hearing through every
floor, note and question it already has. A second hearing returning nothing, or an error, leaves the request as it was and reads LEFTOVER;
never a third. Both hearings are recorded on the row and metered as one usage row. No word-list, no prompt byte, no engine touch, no founder
byte moved.

## 2 · THE RULINGS THIS CUT RESTS ON
R-45.3 (the founder, verbatim above). The chair's rulings of 22 September on the read-first's fork (a): the site (after the first hearing,
guarded by !note, before the note branches), st.ear carrying request (the second), heard (the first), reheard true, usage summed; the second
call gets ITS OWN 4 s bound (a squeezed hearing is a miss with no record). R-44.21 (b): one message stays one message. C-44.12: every
sentence cell replays a recorded hearing verbatim and names its row.

## 3 · THE DESIGN AS BUILT (src/lib/vendor/workingDoor.js; every "never" is a cell in b103 with a mutation)
THE SITE, preTurn :927 to :944: `if (!note && heardNothing(st.ear) && await namesLiveLead(supabase, vendor.id, message))` then one more
L.listener.hear with `conversationId: null, excludeId: null` and the same deps and bound (deps.hearMs or HEAR_BEFORE_REPLY_MS, its own), then
`st.ear = rehear(first, second)`. `note` is lastDoorNote's answer read at :825, so a note turn is never re-heard; a live money row's yes or
no returned at :805 to :820 before any hearing; a null answer expired it at :822.
THE THREE READS, :265 to :299: heardNothing(ear) is true only for a request { route:'none', acts:[] }; namesLiveLead reads leadsOf (the same
live-leads read the offer uses, :254: id and name, deleted_at null) and answers true when key(message) contains key(name) of a row whose
folded name is REHEAR_MIN_NAME (3) characters or more; a FAILED read is false (C-44.4: an empty answer and a broken answer differ); rehear(first,
second) returns the first with request = the second's when the second holds one and no error, heard = the first's request, reheard = true,
usage = sumUsage(both) (every finite field added, so the one meter row carries both calls' tokens), and rehear_error when the second errored.
All three are TOTAL: anything hostile is false, the first hearing, or null.
THE RECORD: persistDoorTurn :1378 writes meta.listener.heard and .reheard (and .rehear_error) beside .request when the turn was re-heard;
listenerDoor.recordListening :213 to :214 write the same when the chain is in, so both lanes and both switch states record alike.
WHAT DOES NOT CHANGE: the pending check, every note branch, withoutEchoedEvents, the F-44.118 floor, askName, allCovered, every plan, every
write, standIn (a re-heard none still reads LEFTOVER through :1007/:1020), doorLines.js (LINES 41), SYSTEM and EAR_TOOL (hash-pinned by b103
6.2), the money functions (hash-pinned by 6.3 against 541f145).
THE FOUNDER'S CONTROL: "tell me who owes me money" holds no lead name: one call, no rehear (b103 3.1, with 5.2 removing the gate).

## 4 · THE BYTES
NONE. No founder byte, no prompt byte, no example moved. B64, B65, B66 stay free.

## 5 · THE RUNG · b103, 42 cells (scripts/b103_lcv12_rehear_bench.js), on b102's harness verbatim (the PGRST116 double, C-44.3)
GREEN 42/42 at the cured tree; 42/42 on three shifted clocks (C-44.13: 23 September 2026 IST morning, 29 February 2028, 31 December 2027, by
the four-line Date preload); RED at the base worktree at 541f145: 13 pass / 29 fail with no crash (the thirteen say at site why they are green
there: 1.0 the record, 2.4 one hearing is today's, 3.1, 3.2, 3.2a, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9 the gate's absences, 6.2, 6.3 the laws).
§1 replays the three misses (16:01:48, 16:02:25, 16:12:58) and the card's step 4 as the FIRST hearing and the two heard shapes of the same sentences (16:04:19,
16:13:30) as the SECOND, inside a long thread, on both lanes; §2 never a third, a second that hears nothing or errors reads LEFTOVER with
its record; §3 the gate (the control, the card's step 6 on a name that is no lead of hers, a two-character name, a deleted lead, key() folding, an act heard, a note turn, a live money row, a
failed leads read); §4 totality; §5 eight mutations of PRODUCTION code (5.1 the hearing removed, 5.2 the name gate, 5.3 the note guard, 5.4
the thread not stripped, 5.5 the record, 5.6 the minimum name, 5.7 the usage, 5.8 a third hearing); §6 the laws (W-1 none, the manifest, no
byte moved, the money functions).
Every driver is the REAL preTurn, standIn and persistDoorTurn on the in-memory database; the ear is a SEQUENCE double that records each
call's messages, so the thread's presence on the first call and its absence on the second is witnessed (1.2), and the two calls' seat, tool,
choice, bound and system are compared (1.3).

## 6 · THE DIFFERENTIAL AND THE FLOOR
THE DIFFERENTIAL: the 89 benches that read the ladder's files by path shape (c-45.5's narrowed grep at 541f145; the 21 that read the two
EDITED files among them: b0498_fresh_crew_rider, b05_f0555_media_dedupe, b05_m2_vendor_inbound, b06_bride_arrival, b06_m3, b06_relay_hand,
b100, b101, b102, b80, b86, b88, b90, b92, b93, b94, b95, b96, b97, b98, b99), run in place at ONE base (a worktree at 541f145 with a REAL
node_modules copy, e-75's lesson) and at the cured tree, the sibling dreamos-pwa at 320ad7e beside both, exit codes AND outputs diffed
(timestamps, durations, wamids and temp paths scrubbed): 89 of 89 byte-identical, exit codes identical on every one; b103 alone exists only
at the cured tree. The ten pre-existing reds inside the set, red at BOTH trees with byte-identical outputs and not introduced: b05_arc_m6,
b05_f0550_ping_drain, b05_f0555_media_dedupe, b05_p4_crons, b06_meter, b07_p5, b08_p5_oow_relay, b08_p5_unblock, b59_g34_reminders,
b59_mutations (all in scripts/floor-base.txt; b61_mutations, also in that file, is outside the 89 and red at the cured tree as at the base). No other rung anchors a mutation on an edited line.
THE FLOOR: FLOOR = NAMED BASE, no delta (refusals, not in base: 4: b06_gauntlet, b5_wa_door_smoke, bf1_bride_tool_fidelity_bench,
test-shape). THE SET: all 223 files of scripts/ but _noop_middleware, with the 23 lines of scripts/floor-base.txt as the failures (22 RED,
1 ERROR b5b_movementb) and those four refusals, nothing else; 196 green. HOW IT WAS RUN, in these words: by run-floor.sh's OWN
CLASSIFICATION (exit 0 green, 3 REFUSED, 2 ERROR, else RED; refusals dropped; the names diffed against scripts/floor-base.txt), executed as
one detached loop in the seat's container (setsid, since a tool call ends at 300 seconds and a loop started with nohup alone died with the
call: e-80 below), every bench's output kept, no per-bench cap (LESSON 3); run-floor.sh itself was NOT invoked whole there, and its warming
pass was not repeated as a pass of its own since no bench reddened outside the base set. The tree after the run carried exactly the
manifest's five paths as dirt; the base worktree carried none. Two whole runs stand behind it: the chair's on the ZIP before confirm, and the
founder's block 2 on his machine.
e-80 (this seat, disclosed): the first launch of the two loops with `nohup … &` died when the tool call that started it ended, the base
loop inside b05_arc_m1_bench, which mutates src/agent/brideEngine.js on disk and restores it in a finally that never ran; the base worktree
was found DIRTY (one line, a select missing tool_calls) by git status before any result was read, exactly LESSON 3's shape. Both loops were
stopped, the base file restored by git checkout, both output folders deleted, and both passes re-run from nothing under setsid; the
figures above are from the clean re-run only. The lesson is in the seat close: a detached runner is started with setsid, and git status is
read on BOTH trees before any floor figure is written.

## 7 · THE WALK RECORD
Written in by script from the founder's export after the walk (the card's closing export carries m.meta->'listener'->'heard' and
m.meta->'listener'->>'reheard').

## 8 · OPEN, CARRIED
R-45.8 (the founder, 22 September): saving calendar events from a screenshot is its own packet AFTER P7 lands, within LC-Victor. F-44.126
(the chair): the vendor-image path (vendorInbound.js :430 to :460) stages pending_event_proposals and the only committer,
commit_event_proposals in src/agent/engine.js :978, is unreachable since the door took every turn, so every proposal row since 21
September sits unresolved; Q2 stands (cut 2a drops the preview's "save all" line); the packet after P7 teaches the door "save all" and
"skip N" as a note of its own kind holding the proposal id, writing through the calendar writer cut 2a uses, with B46 and B47 as its bytes.
The eleven rungs sharing the old lookup double (LCV-11 seat close §3), not repaired. The rig scripts/p7_ear_check.js (the read-first's (ii),
confirmed in shape by the chair) comes to the chair after this cut's attach.
Next free: finding F-44.127, migration 0171, bench b104, errors e-81, corrections c-45.10.

---
A PROSE INSTRUCTION IS NOT A MECHANISM. Trust evidence over narrative, including this file. LCV-12 holds at 541f14552ffac295296fe40b16dab411ced484c0.
