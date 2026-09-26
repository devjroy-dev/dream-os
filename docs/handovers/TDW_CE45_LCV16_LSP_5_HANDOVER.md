# TDW · CE-45 · LCV-16 · LSP_5 HANDOVER

The last server packet's last cut: the engine's business room retired, Donna's dead hands deleted, the advisor path's dead fetches deleted, fullStop.js's orphan deleted. Seat LCV-16 (executor). Built from LCV-15's ruled read-first (docs/specs/TDW_CE45_LCV15_LSP_5_READFIRST.md, carried in this delivery byte for byte with LCV-15's four other seat-close docs). Base at the cut: named in the card. Written 26 September 2026 IST.

## What the cut does, in one paragraph each

L5-a. `runTurn` (src/engine/src/core/loop.ts) refuses any turn that is neither the Advisor room nor consult, by name, right after the `[engine:mode]` line prints and before any read or write: `ENGINE_BUSINESS_ROOM_RETIRED: the business room is the door's; runTurn serves advisor and consult`. The WhatsApp door and the app's business room answer through the door and never reach `runTurn` (proven on code in turn 5's READ 1: `doorTurn` returns null only for `roomAssert === 'advisor'`, and every exit of `workingDoor.standIn`, its catch included, returns `door: true`). `engine/src/core/server.ts` (P8) is untouched and meets the named error (Q-c2).

L5-b. loop.ts went from 1194 to about 750 lines: the business-only reads (facts, snapshot, Donna's exchange, the shelf), the eleven estate prompt blocks and their `RunTurnArgs` fields, `modeOverride`, `ROOM_LINE.business`, the business tool branch, the `dear_donna_talk` dispatch with its session, fuse, snapshot refresh and deed tail, the escalate re-run and handler, `donnaTransport` and `donnaModelOverride`. Consult and the Advisor room are whole. The Advisor room's handbook tool is ALSO named `dear_donna_handbook`; that dispatch branch is the Advisor's and is kept, with a note at the site.

L5-c. donna.ts keeps `rebuildSnapshot` and `patchNote` (and the five functions they reach, byte-identical to base) for its four live requirers; everything else went by a reachability walk. K6 (the chair's ruling) deleted the twelve engine modules only Donna's turn reached: tools/dearDonna.ts, donnaSoul.ts, historyGate.ts, tools/donnaBench.ts, tools/donnaLead.ts, tools/donnaReview.ts, tools/donnaReviewRead.ts, tools/donnaShelf.ts, tools/donnaVerdict.ts, tools/introduce.ts, tools/listenHarvey.ts, tools/relayCouple.ts. Proof before any rm: no non-literal or string-built require in src reaches them. `DEAR_DONNA_HANDBOOK_TOOL` and `ESCALATE_TOOL` deleted; `ADVISOR_HANDBOOK_TOOL` kept. memory.ts `donnaMessages` deleted (the chair, 26 Sep) with its grep proof.

L5-d. chat.js's six advisor-path fact reads, their arguments at both `runTurn` sites, and the five fetch functions left without a caller (`fetchScratchpad`, `fetchRecentBlock`, `fetchMoneyFacts`, `fetchBookedFacts`, `fetchExpenseFacts`) are deleted. `fetchCalendarSnapshot` stays (live callers in crew, occupancy, index). `pendingDonnaQuestion` stays on the TurnResult type (chat.js :264 reads it).

L5-e. relaySeam.ts is KEPT WHOLE: snapshotTypes.ts reads it.

§7. fullStop.js's `matchFullStopWord` and its export are deleted; `matchOptOutExact` is the one matcher on both lanes.

## The rung

scripts/b116_lcv16_lsp5_bench.js, 45 cells. It drives the real compiled `runTurn` in a child process with store and model doubles: a no-assertion turn throws the named error, touching only `agents`, inserting nothing, making no model call; an Advisor turn answers whole with the lens and its own tools and no Donna; its handbook call is served; consult is untouched. Absence cells over comment-stripped code, each with a control. The money functions, `pendingMoneyActs.js`, the live-row block (the estate's standing anchors, hash `5289029740…`, identical to b106 to b109's) and server.ts are pinned by hash from the base. Two mutations compiled in temp copies of the engine (no tracked file written). It needs no git (it runs inside b65_mutations' scratch copies).

## The benches, by the chair's standing reading (e-139: a cell retires only when its SUBJECT is deleted)

Two mechanisms, both carried here as described. The retire tool: a labelled table at the harness, each named cell replaced AT SITE by `__RETIRED(label)` (never evaluated), printed RETIRED and never counted, and an exit control that fails the bench unless every row matched exactly one reached cell (proven: an `exit` listener overrides an explicit `process.exit(0)`). It refuses to write unless every row matches exactly one call, and it merges into a standing table instead of adding a second. The span tool: a whole dead span replaced by one note and one `__RETIRED` per cell, so the count stays visible. Where a bench already carried a table (b84, b111, b06_advisor, b65_mutations, b40), rows joined it.

Deleted whole (K7/K8, every file each touched listed in the turn reports): scripts/b06_f0681_bench.js (17 cells, donnaSoul's text), scripts/b06_gauntlet.js (the business-room live-model contest; its live subjects pinned by b06_f0667, b06_advisor §1.5, b116 1.6; its base refusal is why the floor's refusal count moves 3 to 2), scripts/b06_f0692_bench.js (23 cells) and scripts/b6_door_rider_bench.js (15 cells), each touching only donnaLead.ts.

Re-aimed where the subject lives (a selection; each labelled at its site): b06_downgrade and b06_sonnet (Victor's provider fallback and the no-Sonnet start path, driven in the Advisor room); b06_0081 (the tombstone, the thread replay, the pre-DDL degrade, driven in the Advisor room); b90 8.1 to 8.3 (end anchors re-derived, plus 8.0 guarding slice bounds; they had been hollow greens); b06_m1 §5.6 and §6.4, b06_m4d, b06_relay_hand §6.1 and §6.2, b06_forkc_wireguard §5.1, §5.6c, §7.6, §8.5, §10.6 (the rig's statements removed by AST, never faked); b07_p4a_ig §10.1; b51_referrals (the dead donnaLead read re-aimed, no referral cell retired); b06_advisor's clean-clone branch (two latent reds no differential could see); b65_mutations M8, M38, M39 (now aimed at b116, which owns their subjects).

Every bench that went red is back to its base exit, with its reached-cell count (passes plus retirements) reconciled to the base under A-45.12, or its extra cells disclosed: b06_donna_cache +2 and b6_open_question +3 (gate-skip branches the base never reached), b90 +1 (8.0), b116 (new).

## The floor, and one other seat's bench

The floor ran SLICED (the chair's ruling, turn 13) after two unsliced runs died in their warming pass at a turn's end, one of which stranded a plant in src/lib/invoicePdf.js (`isPaid = false`), found and restored under A-45.7. Ten slices, both passes, the A-45.4 gate before every slice (no undeclared dirt, no declared path moved from the package snapshot), all green, stable across both passes. Against floor-base its one delta was RED b121_g61_own_number_srv_bench, green at the base: cell 1.1 read the UNCOMMITTED tree (`git diff HEAD`) for src/engine and three other paths, so any uncommitted delivery touching src/engine reddens it (this cut does, by ruling). Its claim is G6-1's sitting's, so it is RE-AIMED to that sitting's commit, bd9d153 (the four paths untouched there), labelled; 41 cells at the tree and the base. G6-1 is told through the chair. Refusals: the same four on both sides (b4c1_shoot_board, b73_post_cards, bf1_bride_tool_fidelity, test-shape); with b06_gauntlet deleted the count moves 5 to 4 at 7505ff2 (not 3 to 2 as first predicted from floor-base's older note).

## Errors of this seat, self-caught before any delivery

e-139: turn 2 retired Victor's live provider-fallback cells beside Donna's; restored and driven in turn 3. The lesson became the chair's standing reading. e-144: the retire tool once wrote a second table header into b06_m4d; b116 2.10 used `git ls-files`, which throws in scratch copies. Both fixed, every bench scanned. Also self-caught: turn 4's note placed b06_f0613's refusal on the wrong side; b51's first re-aim was too broad (harveySoul's "forwarded messages"); two faults in b6_open_question's gate replacement, caught by the exit control.

## What A-45.12 found

Three benches lost cells behind an exit already red at the base: b51_referrals (193 of 232 cells never ran; a live feature), b05_arc_m4 (three cells newly red, hidden by a pre-existing red), b6_open_question (a staleness gate that skipped five driven cells on a fresh dist). All three cured in turn 10. A fourth of the same kind, b07_p4b_body §7.2, was found by reading in turn 3.

## OPEN FOR THE ROAD (named, not done here)

1. The open-binder default (ATTRIBUTE_ATOMS, currentBinderId) lived only in runDonnaTurn's write loop; whether the door's road carries it is UNPROVEN (K5). For the chair to route.
2. relaySeam.ts (kept whole) states `refused` is authored at "TWO sites" and `plain` at "THREE"; after K6 there are 0 and 1. Its four exports (echoedRefusals, appendDeedTail, stripDeedTail, RELAY_DEED_SEAM) now have no reader in src.
3. tools/donnaNote.ts was unreachable before this cut; not deleted here.
4. lib/vendor/snapshot.js `fetchRecentActivity` and `formatActivityBlock` have no caller in src (outside W-1's lift).
5. `TurnResult.pendingDonnaQuestion` is never set now; chat.js :264 still reads it. `victor_mode`'s business arm is kept (stored rows carry it).
6. runTurn's `escalated` stays a constant false for the usage column.
7. The live-row block is now pinned by b116 as well as b106 to b109.
8. ELZ-1: b117a was run, never edited; it needed nothing from this cut.

## THE WALK

Recorded below after the founder's walk: a no-change pair on WhatsApp (the door), and one advisory question in the app's Advisor room.
