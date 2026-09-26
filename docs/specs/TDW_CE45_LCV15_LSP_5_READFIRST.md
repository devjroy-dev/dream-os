# repo: dream-os · docs · the seat-close delivery of CE-45 LCV-15 · carried to docs/specs by the chair's ruling of 25 September 2026
# TDW · CE-45 · LCV-15 · LSP_5'S READ-FIRST, AS RULED · for the seat that builds LSP_5

THE RULINGS (CE-45, 25 September 2026, on sha256 82665fa23083616258658b80771d422c0c020e3851f08650fbde45c53186fe7a):
L5-a RULED: after the room resolves (loop.ts :424 to :454), a turn that is neither consult nor advisor throws
Error('ENGINE_BUSINESS_ROOM_RETIRED: the business room is the door\'s; runTurn serves advisor and consult') before any read or write; the
[engine:mode] log line kept; server.ts untouched (Q-c2), meeting the named error; tombstone_bench re-aimed at the advisor room (Q-c3).
L5-b RULED as listed, consult and the advisor room whole; every name a deletion leaves unused found by the no-undef and no-unused pass on the built
TypeScript; dist rebuilt by npm run build.
L5-c RULED: donna.ts stays for its four live requirers (rebuildSnapshot, patchNote); runDonnaTurn, DonnaSession, DonnaTurn, snapshotText and
whatever ONLY they reach deleted by a reachability walk from the live exports, LSP_3's method; tools/dearDonna.ts goes; DEAR_DONNA_HANDBOOK_TOOL goes
and ADVISOR_HANDBOOK_TOOL stays; ESCALATE_TOOL decided by the walk; engine/smoke.js :23 re-aimed at a live export.
L5-d RULED: the six advisor-path fetches, their args at both runTurn sites and each fetch function left without a caller, deleted; W-1 lifted for
chat.js's named lines only; b84 8.1 to 8.3 retired under A-45.2 with the reason.
L5-e RULED: relaySeam.ts decided at build by the walk, reported to the chair before the attach, deleted only if every reader lies inside the deleted set.
§7 as ruled: matchFullStopWord and its export deleted; b111 1.5 re-aimed or retired under A-45.2; b05_p4_crons read; b117a is ELZ-1's rung: a cell
there that names the deleted function is retired or re-aimed with its reason and nothing else in it touched, and ELZ-1 is told in the handover.
b116 and the walk as §8; every deletion as named paths in block 1 and git rm in block 3 (A-45.1).
THE BASE: disjoint from the queue (0172; ELZ-1's 1c; IGD-1's 2a); build on the tip standing at the build, re-derive, ask for the base at the cut (R-45.14).
THE ROOM: LCV-15 declared its room would not hold the build (25 September); LSP_5 goes to a fresh seat with this file as its first read.

THE READ-FIRST AS FILED (derived at e07f7fa; re-derive every anchor at the build's base):

## 0 · THE TIP, AND WHY THIS READ STILL HOLDS
085741a..e07f7fa (G6-1's own-number fix and FE2b; ELZ-1 cuts 1 and 1b r2; IGD-1's docs) is EMPTY for every LSP_5 subject: src/engine,
src/api/vendor-engine/chat.js, src/lib/executeAndPatch.js, src/agent/harvest.js, src/api/vendor/leads.js, src/lib/vendor/promotion.js,
src/lib/vendor/workingDoor.js, scripts/floor-base.txt (20 lines). Every anchor below is identical at both tips. Rung b116 (ELZ-1 took b117).
The scope is survey part 2's re-scoped (c): the engine's business-room branches inside runTurn; Donna hands with no caller left; relaySeam if only the
business room crosses it. wireGuardVictor, executeAndPatch and runTurn itself are KEPT (c-45.15 to c-45.17). Plus, RULED 25 September: fullStop.js's
matchFullStopWord.

## 1 · WHO REACHES runTurn (by grep)
chat.js :3458 and :3607 are the ADVISOR room only in practice: in the business room the door always answers (doorTurn :3347 returns the door's reply
or standIn's; standIn never returns null since LSP_1), so runTurn is reached only when roomAssert is 'advisor' (:3406 body.room). engine/src/core/server.ts
:127 passes no assertion (a business turn by default); Q-c2 keeps it untouched for P8, and after the cut it meets L5-a's named error.
engine/tombstone_bench.js is re-aimed at roomAssert 'advisor' (Q-c3). engine/smoke.js :23 asserts `donna.runDonnaTurn is a function`: amended with L5-c.

## 2 · L5-a · THE BUSINESS ROOM THROWS A NAMED ERROR (Q-c1)
Sited after the room resolves (loop.ts :424 assertedRoom, :425 isAdvisor, :454 estateInRoom): a turn that is neither consult nor advisor throws
Error('ENGINE_BUSINESS_ROOM_RETIRED: the business room is the door\'s; runTurn serves advisor and consult') before any read or write. Consult
(agent.mode 'consult', :389) stays whole. The [engine:mode] log line stays (it prints the room before the throw).

## 3 · L5-b · THE loop.ts DELETE LIST (1194 lines)
- the business-only reads: :462 wasFirstMeeting, :463 loadFacts, :464 snapshotText, :465 donnaMessages; the Document Shelf :476 to ~:500; the
  first-meeting write at :1142;
- the business prompt blocks :672 to :731 (calendar, activity, pings, relay, money, expense, booked) with their RunTurnArgs fields
  (calendarSnapshot, scratchpad's business use, recentActivity, leadPings, pendingRelay, moneyFacts, expenseFacts, bookedFacts) and ROOM_LINE.business;
- the business tool branch :775 to :778 (DEAR_DONNA_TALK_TOOL, DEAR_DONNA_HANDBOOK_TOOL, ESCALATE_TOOL) and their imports (:21 to :23 in part);
- the dear_donna_talk dispatch: runDonnaTurn at :931, the Harvey↔Donna exchange with its fuse and session (:809 donnaSession), :1113's snapshot
  refresh, and the deed tail through relaySeam's echoedRefusals and appendDeedTail at :1009 and :1014;
- modeOverride (only the deleted WhatsApp door passed it).
KEPT: consult; the advisor room whole (HARVEY_SOUL, ADVISOR_LENS, ADVISOR_HANDBOOK_TOOL, JOT_ADVICE_TOOL, the handbook index); the conversation, save,
provenance and the victor_mode meta. Each deletion is read at build for every name it leaves unused (an eslint no-undef and no-unused pass on the
built TypeScript), and the dist is rebuilt by `npm run build`.

## 4 · L5-c · donna.ts
donna.ts STAYS: four live lib requirers read its dist (agent/harvest.js, api/vendor/leads.js, lib/executeAndPatch.js, lib/vendor/promotion.js) for
rebuildSnapshot and patchNote (:77, :227). After the cut runDonnaTurn (:434), DonnaSession and DonnaTurn (:407, :412) and snapshotText (:263) have NO
reader in src (their last callers were loop.ts's business branches and relaySeat's composeBody, deleted in LSP_3). The lean: delete runDonnaTurn and
whatever ONLY it reaches, by a reachability walk from the live exports (rebuildSnapshot, patchNote and whatever executeAndPatch requires), as LSP_3
did; the Donna tool modules executeAndPatch still reaches stay. tools/dearDonna.ts (only loop.ts imports it) goes with the dispatch;
dearDonnaHandbook.ts loses DEAR_DONNA_HANDBOOK_TOOL (ADVISOR_HANDBOOK_TOOL stays); donnaLead.ts's ESCALATE_TOOL is imported by donna.ts too, so
it is decided by the walk. smoke.js :23 re-aimed at a live export.

## 5 · L5-d · chat.js's SIX DEAD FACT FETCHES ON THE ADVISOR PATH
fetchCalendarSnapshot, fetchScratchpad, fetchRecentBlock, fetchMoneyFacts, fetchExpenseFacts, fetchBookedFacts are called at :3452 to :3457 and
:3601 to :3606 on every ADVISOR turn and passed to runTurn, which ignores them there (estateInRoom false): dead reads, as LSP_1's K8. The lean:
delete the calls, their args at both runTurn sites, and each fetch function left with no caller (:2729 fetchCalendarSnapshot, :3266 fetchBookedFacts
and the others, by grep at build); W-1 is lifted for chat.js's named lines. b84 8.1 to 8.3 pin fetchBookedFacts in chat.js and are retired under
A-45.2 with the reason.

## 6 · L5-e · relaySeam.ts
Imported by donna.ts and snapshotTypes.ts as well as loop.ts, so NOT business-only on its face. Kept, unless the reachability walk in L5-c shows its
donna.ts readers lie only inside runDonnaTurn; then decided at build and reported before the attach.

## 7 · RULED 25 SEPTEMBER · matchFullStopWord
fullStop.js :58 matchFullStopWord and its export (:116) are deleted: ELZ-1's cut 1 moved the bride lane (brideInbound.js :46) to matchOptOutExact, and
no src file calls it. Scripts naming it: b111 (1.5, its control cell), b05_p4_crons (its twin-lane anchors accept either matcher since LSP_1b) and
b117a (ELZ-1's rung): each read at build; b111 1.5 re-aimed or retired under A-45.2 with the reason; b117a's read settled by the red-scan (it is
ELZ-1's; a cell that names the deleted function is retired or re-aimed with its own reason, never edited beyond that cell).

## 8 · RUNG b116
A business turn throws the named error (driven, the real runTurn, doubles for Anthropic and the store); an advisor turn runs whole with its lens, its
tools (ADVISOR_HANDBOOK_TOOL, JOT_ADVICE_TOOL) and no Donna; consult untouched; the deleted blocks, args and tools absent; runDonnaTurn gone with a grep
control and donna.ts's live exports present for their four requirers; chat.js's six fetches absent from the advisor path; matchFullStopWord absent
with matchOptOutExact kept; the money functions pinned; mutations (a business block restored reddens; the throw removed reddens).
THE WALK: a no-change pair on WhatsApp (the door, rows as ruled) plus the Advisor room on the app (one advisory question answered with the lens).

## 9 · RULINGS ASKED
L5-a the named error, its site and its text. L5-b the loop.ts list, consult kept whole. L5-c runDonnaTurn and its only-reached set by walk, donna.ts kept
for its four requirers, smoke.js re-aimed. L5-d chat.js's six fetches deleted, b84 8.1 to 8.3 retired. L5-e relaySeam decided at build by the walk.
THE BASE: named by you when this is ruled; 0172 and IGD-1's 0173 are ahead on dream-os, and the seat re-derives at whatever tip you name.
