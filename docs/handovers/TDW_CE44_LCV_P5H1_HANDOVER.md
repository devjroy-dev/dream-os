# repo: dream-os @ ecc564d9dc2ecacf0e0fde20ff7260396a941738 (base) · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307
# TDW · CE-44 · SEAT LCV-2 · LC-VICTOR P5-h1 · THE FOLLOW-UP CUT AFTER P5's WALK · HANDOVER

**Rung b90, extended (§15).** Code, so the founder's full floor
(`run-floor.sh --delivery scripts/floor-manifest-ce44-lcv2-p5h1.txt --check`). No migration. W-1 NONE. No pwa byte.
It carries, and nothing else, the four items the chair ruled after P5's walk went green.

## 1 · R-44.24 (founder), the ask ends "Reply YES or NO."

His words, verbatim: *"the yes or no dies at the end of a long statement. we should replace it with Yes or No/ YES or
NO."* and, asked which, *"YES or NO. It immedeately registers."* In `doorLines.js`, B1 and B2 only; every other byte
of both stands as ruled at R-44.21 (f); their hashes are re-pinned in the file and as literals in b90:

    B1  Mark this payment? {client} · {which payment} · Rs {amount} · {date}. Reply YES or NO.
    B2  Confirm this booking? {client} · {package} · Rs {total}. Reply YES or NO.

How her reply is read does not change: F-44.53's closed lists match in any capitals (b90 15.2). F-44.58's cure knows
the door's question from `meta.listener.asked`, never its text, so a question written under the old wording is still
the door's, and the new wording with no meta is not (b90 15.3).

## 2 · F-44.60, the listener heard no date in "came in today"

On P5's walk the listener returned `advance_paid` with no `date_as_spoken` for "The advance for Walk P5 Advance came
in today"; the door asked B6, safely, and it cost her a message. Cure, door-side only: `EAR_TOOL`'s description of
`date_as_spoken` now says plainly that a word placing the day relative to now IS a date ("today", "yesterday", "this
morning", "last Friday"), returned verbatim, and that when she says when money came in, those words go there. A prompt
byte of the listener's, not a founder byte; b86 §3 holds (no "advice" anywhere in the tool). `spokenDate.js` resolves
the relative words in IST in the ruled direction: today and its parts of day, yesterday, the day before yesterday,
last night, weekdays with last/this/next. A received date that can only be after today is still byte 7. The model's
recall is not provable on a bench: the walk card's step shows his sentence heard with its date in ONE message.

## 3 · F-44.61, an advance on a lead already booked was asked as a booking

On P5's walk "Walk p5 book paid the deposit today" came back as `advance_paid` and the door asked B2 for a lead
booked at 18:22. RULED: where the resolved lead is booked, `advance_paid` is resolved and asked as `milestone_paid`
of the DEPOSIT, B1, with the row's own label and amount and her received date; a deposit already paid is D7, no
question; where she is not booked, B2 as before. `planMoney` now shares one `planPayment` between the two acts. b90
15.7 to 15.9; M15 routes it back to the booking path and reddens.

## 4 · F-44.62, the block lines printed ISO dates on vendor glass

He read "Blocked: 2027-03-20 — Personal time." R-42.13 is his standing rule. RULED, F-43.29's class: the WORDS of all
six lines in `blockLines` and `unblockLines` (`blockHands.js`) stay byte for byte and the date renders in full through
`longDateYear`, "20 March 2027". The founder has been told and may take it back. **Survey, before building, of every
sealed bench anchored on those lines:** `b06_forkc` §14.4 feeds a TRANSCRIBED reply ("2026-12-18 wasn't blocked…")
into `imperativeMiss` and never calls the block lines; `b6_witness` names `blockLines` in a message string only;
`b80`'s `CAN_PIN` is the calendar's "Cancelled:" line, not these; the benches that drive the block hands
(`b06_gauntlet`, `b6_referent`, `b6_sitting2`, `checker`) read none of the six lines. No hit. b90 15.10 to 15.12; M16
restores the raw date and reddens.

## 5 · Files

`src/lib/vendor/doorLines.js` (B1, B2, two hashes) · `src/lib/vendor/listenerDoor.js` (one description string) ·
`src/lib/vendor/spokenDate.js` (relative words) · `src/lib/vendor/workingDoor.js` (F-44.61, `planPayment` and
`planBooking`) · `src/lib/vendor/blockHands.js` (F-44.62) · `scripts/b90_lcv_p5_bench.js` (literals, §15, M15, M16) ·
`scripts/floor-manifest-ce44-lcv2-p5h1.txt` · this file.

## 6 · Recorded with this cut

R-44.25 (founder): Basic has no messaging and no AI; the zero cap refuses before the listener, so R-44.20's Basic
listener seat is unreachable in production; P5 walk step 11 closed as not applicable; R-44.20 moot, not withdrawn.
F-44.63 (the 08:00 brief prints ISO dates) is filed to P7. On P5 walk step 10 Victor's prose quoted Walk45's schedule
unchecked against the rows; this card's SELECT reads them beside it. e-22 and e-23 (the walk card's SELECTs) are
cured in this card.

---

Trust evidence over narrative, including this file. Sequencing beyond this sitting is the founder's.
