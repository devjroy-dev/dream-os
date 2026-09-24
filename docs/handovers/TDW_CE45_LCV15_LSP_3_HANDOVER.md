# repo: dream-os @ a88c312 (base; rebased from 90f607d under R-45.14, FE2_SRV_1 disjoint) · dreamos-pwa untouched · code · TDW_CE45_LCV15_LSP_3.zip
# TDW · CE-45 · SEAT LCV-15 · LSP_3 · THE RELAY SEAT'S CHAIN ERA, DELETED (L3-a) · 2026-09-24 IST

Line numbers derived by command at a88c312; re-derive before citing. Trust evidence over narrative, including this file.

## 1 · WHAT GOES AND WHAT STAYS
relaySeat.js (1269 → 644 lines): the 27 definitions no live caller reached at 90f607d are deleted, each with its own comment header and its export:
runRelaySeat and its lanes (handleStage, handleSend, relayLaneLine, RELAY_CLAIM_RE_LOCAL); the stager (doorStage, extractRecipient, RECIPIENT_VERBS,
NOT_A_NAME_RE); the pending-relay block (buildPendingRelay, pendingRelayBlock, RELAY_STANDING_LAW); composeBody (runDonnaTurn's last caller outside the
engine); the confirm-row reader (doorAsked, RELAY_CONFIRM_SENT_BY, ASKING_KINDS, relayOutcomeAsks); AFFIRM_RE, affirmativeNames, AFFIRM_PLAIN_RE,
DECLINE_PLAIN_RE; askWhoLine; foldName; PWA_RELAY_UNAVAILABLE_LINE (its retirement ruled with P6b's first cut, carried out here); the introduction
signals collectSignals, STAGE_SIGNAL, SEND_SIGNAL (their one reader, introductionSeat.js, left in LSP_1). A provenance note at module.exports names them.
The now-unused import resolveRecipient is dropped; relayToCouple.js itself untouched.
STAYS (21 live exports): sendApprovedDraft (sendApproved :333, the door's one send leg, byte-identical), relayExpirySweep, relayReceipt, verbatimBody,
looksLikeThePhone, the deed lines, the doorbell lines, the drafts store. relayToCouple.js and coupleDrafts.js untouched; admin/router.js's
'relay_confirm' literal (the cost reader for historic rows) kept.
chat.js: R-29.32's RELAY_VERB_RE (its only reader was the deleted doorStage) deleted with its block and export, a note at :1303; RELAY_CLAIM_RE kept.

## 2 · THE BENCHES (A-45.2)
b0607_oow_completion 74, UNCHANGED: all fifteen reds RE-AIMED, none retired; the out-of-window fork is live, so its cells now reach it on the door's
own road (viaDoor: openStagedFor's staged draft, coupleDisplayName, relaySeat.sendApprovedDraft). Six log lines fewer (the deleted seat's entry log).
b06_relay_hand 111 → 75: the send leg re-aimed the same way (runSend and nine direct calls); 7.1's import guard names sendApprovedDraft; 7.7 pins ten
vetoed bytes (the PWA-unavailable byte retired); 36 retired with reasons (the stager, handleSend's name guard, expiry-at-approve now the door's own
check, the lanes, the signals, the pending-relay block, adjacency and decline, the claim copy, composeBody), 5.6 as a HOLLOW GREEN.
b06_bride_arrival 93 → 80: thirteen retired (A2.2, A6.1-6.5, A13.1-13.5, A13.7, A14.5); the live claim corpus and the cost readers kept.
b40 256 → 241: fifteen retired (six on the deleted stager's bytes, eight HOLLOW GREENS driving the bench's own copy of the deleted lifter, M9).
DISCLOSED: handleSend's name check ("the name she said matches the draft's") left with the seat; the door sends by the draft's id.

## 3 · RUNG b113 (22)
The dead set absent (not exported, not defined, named nowhere in src outside a comment; a grep control); the 21 STAYS callable; sendApproved pinned by
hash; relayToCouple.js and coupleDrafts.js untouched; 'relay_confirm' kept; RELAY_VERB_RE gone and RELAY_CLAIM_RE kept and convicting; runDonnaTurn with
no caller outside src/engine; the live relay YES proven by running b101 whole as a child (its card cell 4.4: her YES sends the stored bytes through the
real workingDoor and sendApprovedDraft); the money functions pinned; mutations (a dead export restored; the send leg unexported). 17/22 at 90f607d.

## 4 · THE PROOF
DIFFERENTIAL in series on one base, at 90f607d and again at a88c312 after the rebase (the same 55 benches): exits changed for b113 only; five output
changes, each attributed, byte-identical across the two tips. FLOOR at a88c312: "FLOOR = NAMED BASE, no delta (refusals, not in base: 3)", 21 exact.

## 5 · THE WALK AND ITS RECORD
The card: a no-change pair on WhatsApp, BEFORE on the deploy before this cut, AFTER on its own, the same seven messages ("Fresh"; row 13 "Tell walk
seventeen alpha venue is confirmed"; row 5 "Hello there"; row 6 as "Who are my new leads?" (L3-b: Cleanup B removed the lead the old row read);
row 11 "New test paid the delivery today"; "Tell Sarah hi"; "YES" to the test couple 9625759924 (L3-c)), read by the seat's three-way reader; F-44.143
settled from row 13's heard requests on both halves. The record: owed at the walk.
---
A PROSE INSTRUCTION IS NOT A MECHANISM.
