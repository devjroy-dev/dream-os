# repo: dream-os @ 547c340 (base; LSP_3 landed) · dreamos-pwa untouched · code · TDW_CE45_LCV15_LSP_3b.zip
# TDW · CE-45 · SEAT LCV-15 · LSP_3b · "TELL SARAH HI" · F-44.152, F-44.153, F-44.149 · 2026-09-24 IST

Line numbers derived by command at 547c340; re-derive before citing. Trust evidence over narrative, including this file.

## 1 · THE DEFECTS, AS WITNESSED ON HIS HANDSET (24 September; his engine exports)
F-44.152 (SEVERE, a regression): "Tell Sarah hi" and "Say hi to Sarah" were heard {"act":"relay","member_as_spoken":"Sarah"} (14:38:51, 14:39:49,
14:58:58, 14:59:28, 14:59:58 UTC): P7's member slot (listenerDoor.js :85, for assign_crew) caught a relay's recipient, the client slot stayed empty,
and a NEEDS_CLIENT act asked B35. On 22 September, before that slot existed, the same words staged and sent.
F-44.153: his answer "Tell Sarah hi" (and later "Say hi to Sarah") to that B35 was taken VERBATIM as the name (the B35 path's name = message.trim()):
B38 "No client called Tell Sarah hi." (14:39:16, 14:59:20, 14:59:38).
F-44.149: "Walk seventeen alpha" answered to "Did you mean Walk Seventeen Alpha?" (11:41:42) drew the question again; only "Yes" moved it on.

## 2 · THE RULING AND THE CURE (workingDoor.js only; the listener untouched)
R-45.24, the founder: no outbound message to crew or team, now or planned; "if it's a send or tell or say, it has to be a client."
(A) relayRecipient(request): for a RELAY act with an empty client_as_spoken and a member_as_spoken, the member IS the client. Relay only; every other act's
member slot untouched (assign_crew's meaning kept). preTurn reads the ear through it first (`heard = withoutEchoedEvents(relayRecipient(st.ear.request),
nowMs)`), so F-44.118's floor tests the folded client against her words. It returns the SAME request when nothing folds (e-116: the first cut copied on
every turn, which made b94's sealed mutation M6 vacuous; cured in source).
(B) the B35 answer: the heard acts are read through relayRecipient; when the note holds a relay and a heard relay carries a client, THAT is her answer;
otherwise her whole trimmed message, as before.
(C) the offer: her answer equal under key() to the offered name (the note's slot, through slotField) is her yes, beside PMA's yes; anything else keeps
its old path.
planMoney to reread, planAssign and fileAssign byte-identical; listenerDoor.js untouched.

## 3 · THE BENCHES
NEW RUNG b114 (21): b101's harness carried byte for byte; 14:38:51's hearing verbatim → B37 at once, the draft stored, YES sends through
sendApprovedDraft; a relay with its client untouched; assign_crew's member slot kept (B56, B58); 14:39:16's hearing verbatim as B35's answer → B37 for
Sarah; a bare "Sarah" as before; the 11:41:07 note and 11:41:42 turn verbatim → B56, B58; another answer re-asked; three mutations (each fold removed);
the held functions and listenerDoor.js pinned. 13/21 on the LSP_3 tree without the cures.
RE-ANCHORED: b94 7.3 and its M1 (the drop's line now wraps relayRecipient; the drop unchanged). RE-PINNED: b106 1.7, slotField's readers 2 → 3
(F-44.149 reads the offered name through the same table). No bench retired.

## 4 · THE PROOF
DIFFERENTIAL in series on 547c340 (29 benches reading workingDoor.js, plus b114), the cut half re-run in full after the e-116 cure: exits changed for
b114 only; outputs for b106 (1.7's label) and b114. FLOOR: "FLOOR = NAMED BASE, no delta (refusals, not in base: 3)", 21 exact.

## 5 · THE WALK AND ITS RECORD
The card: "Tell Sarah hi" → B37 at once → YES → "Sent to Sarah (+919625759924)." and its vendor_relay row; the B35-answer path ("Tell someone hi" →
B35 → "Tell Sarah hi" → B37 → NO); the did-you-mean answered with the name ("Add Walk Crew Delta to talk seventeen alpha shoot" → B36 → "Walk Seventeen
Alpha" → B56 and B58, or B35's path if the ear corrects "talk", recorded as heard). Under R-45.22 any member the walk files stays as a test row unless
he asks for its cleanup. The record: owed at the walk.
---
A PROSE INSTRUCTION IS NOT A MECHANISM.
