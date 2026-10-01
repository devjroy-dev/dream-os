# CE-47 · ELZ-4 · C2 · F-44.265 · A DRAFT REQUEST WITH A QUESTION PENDING · HANDOVER

Base: dream-os 8f2cd0d83716 (re-derived at the cut; layer C df5457a, then WEB-4 cuts 3 to 6). Built and proven on a0bfe02; carried onto
8f2cd0d (WEB-4 cuts 5 and 6: 22 files, none of C2's, no reader of workingDoor.js or b142b among them); C2's two code paths cmp-equal after the carry. The chair minted F-44.265 from the layer C walk
of 30 September and gave the go the same day; the seat's miss that let it through is e-262 (no fixture carried a package, so no question was
ever pending).

## 0 · The finding (engine.messages, DEV440's agent, 30 September)

16:54:29 "Just draft a message" and 16:55:24 "Just draft the message and give me" were answered by the question agent ("I can only read your
records ..."), not the door. Both followed a turn that asked the booking question (B2, "Confirm this booking? ... Reply YES or NO."), which
stages a LIVE MONEY ROW; the draft routes (F-44.248's follow-up, layer C's B35) were gated on no note and no live row, and any message that
was not yes or no expired the row.

## 1 · What ships (4 paths)

src/lib/vendor/workingDoor.js · a DRAFT REQUEST (the same test B and C use: DRAFT_FOLLOWUP, heard as nothing, no relay sentence) is taken EVEN
WITH a note or a live money row pending. (i) A relay decided on the previous door turn within 30 minutes: F-44.248's follow-up (the no-number
two messages, or B37 framed as layer C frames it). (ii) None: B35. THE PENDING ITEM STAYS: a live row is not expired by a draft request (it is
expired as before when the draft route does not take the turn); a note is held aside for the turn and written back on this turn's row
unchanged (for B35 the pending note is written back in place of B35's own). A later YES or NO answers it. ONE QUESTION AT A TIME: a turn that
asks its own YES/NO (B37, a draft for a client with a number) or leaves its own note lapses the held item, as any other message does today.
A pending B37 is itself the draft: a draft request then is answered by that note (re-shown), as b142b 6.4b holds.
scripts/b142b · §9 on the walk's exact rows: 9.0 Asha with the package and no number, B2 live; 9.1 "Just draft the message and give me":
the door's two messages; 9.2 the B2 row byte for byte unchanged; 9.3 a later YES confirms it; 9.4 Sarah with the package: the two-part
draft, YES sends and asks B2; 9.5 "Just draft a message": B35; 9.6 the row unchanged; 9.7 a later YES confirms it (an expired row fails
it); 9.8 NEITHER draft request reaches the question agent; 9.9 a NOTE pending is written back unchanged. M22 (C2 undone), M23 (the row
expired anyway), M24 (the note not written back). M13 re-anchored by label to draftAsk. 86 cells.

## 2 · Proof (ELZ-4's container, engine built, keys unset; no whole floor, per (b))

BOTH WAYS on a truly clean a0bfe02: b142b 74/86, red on exactly 9.1, 9.2, 9.3, 9.5, 9.6, 9.7, 9.8, 9.9 and M13, M22, M23, M24 (their
anchors are C2's code); green there on 9.0 and 9.4 (the setup) and on every earlier cell. Cured 86/86.
THE DIFFERENTIAL (radius derived by command before the base run: the 38 benches reading workingDoor.js or b142b; clean a0bfe02 vs C2; one at
a time; zero dirt both sides): exits identical; cells identical but b142b (73 to 86); output differs only in b142b.
SHIFTED CLOCKS: b142b 86/86 at 1 October 2026 IST, 31 December 2027 23:50 IST and 29 February 2028.

## 3 · THE CLASS (the chair asked; none cured here)

Every other door route gated on "no note on the thread", read from workingDoor.js at a0bfe02, and whether a fixture with a pending item runs it:
1. THE RELAY RULE (F-44.181, `relayRule = (!note && !live) ? ...`): a "Tell X ..." sentence with a note or live row pending is not caught by
   the rule and falls to the ear. NO fixture runs it with a note or live row pending (b142b §1 to §7 are clean threads). The nearest live risk.
2. THE COLD SECOND HEARING (R-45.3, `!note && heardNothing(...)`): deliberately never re-heard on a note turn. EXERCISED with a note pending:
   b103 3.7 (B35 pending, her "Sarah" decided by the note).
3. A BARE YES/NO WITH AN OPEN STAGED DRAFT AND NO NOTE (P6b fork (b), `!note && !live && said !== null`): b101 5.2 runs it with NO note;
   no fixture runs it with a note or live row pending.
4. THE LAPSED QUESTION (F-44.58, B14, same gate): run with no note; no fixture with a note or live row pending.

## 4 · The walk (DEV440 from 9888294440 on WhatsApp; the layer C walk's exact words)

"Tell Sarah her booking is confirmed" → the draft alone, then "Send this to Sarah (...)? Reply YES or NO."; "Yes" → "Sent to Sarah ..." and
"Confirm this booking? ..."; "Just draft a message" → "Which client? Say the name."; then "Yes" → the booking confirmed.
"Tell asha walk fifteen her booking is confirmed" → the no-number line and "Confirm this booking? ..."; "Just draft the message and give me" →
two messages, the line naming Asha Walk Fifteen, then the draft alone; then "No" → the booking declined (the question survived the draft).

## 5 · Carried

F-44.266 (the question agent's false "I can only read your records, not draft or send"; new words to the founder's veto) is next in this
seat's queue, then b117m, F-44.253, F-44.262. W-1: elizaSoul.js and listenerDoor.js unmoved. No paid run.
