# repo: dream-os @ 14bc61d60c46101941894212352a06e6fd86314f · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307 (untouched)
# TDW · CE-44 · SEAT LCV-10 · PART B-1's FIX FORWARD: F-44.114 AND F-44.115 (F-44.113 folded in) · HANDOVER · 2026-09-22 IST
# W-1 NONE. NO migration (0171 stays free). Bench b96 is taken; b97 is the next free. Five paths, every one in
# scripts/floor-manifest-ce44-lcv10-partb1fix.txt. NO BYTE A VENDOR READS WAS ADDED OR CHANGED (doorLines.js is not in the cut).
# Line numbers were derived by command from the delivered tree when this file was written.

## 1 · WHAT HAPPENED, AND WHAT THE CHAIR RULED

Part B-1 (r3) landed at 14bc61d60c46101941894212352a06e6fd86314f on 22 September 2026: six paths byte-identical to the ZIP the chair
confirmed (d8b7ac631e45…); his floor "FLOOR = NAMED BASE, no delta  (refusals, not in base: 4)"; Railway ACTIVE; the fixture SELECT as
the card expected. ITS WALK WENT RED AT STEP 1. On WhatsApp he sent, in his own words with his own full stops, "Add a new lead. Tara
walk ten. Wedding on 5th March 27." THREE TIMES, and the door answered (his Railway log, UTC): 20:03:19 "I could not read that date.
Say it like 5 December." (B7); 20:03:51 the same (B7); 20:04:22 "Okay. Nothing was changed." (B3). No lead was filed, no money
touched. Step 2's first message read B7 as the card expects; the seat stopped the walk there. THE CHAIR RULED: FIX FORWARD on 14bc61d,
no revert. HIS EXPORT OF THAT WALK HAD NOT ARRIVED WHEN THIS CUT WAS MADE: the hearing of his three messages is INFERRED, the one
hearing (date_as_spoken "5th March 27.", his full stop kept) that reproduces his log reply for reply through the real door, and it is
LABELLED INFERRED wherever it is used (b96 3.2, 3.3, 4.1). It is replaced verbatim when the export arrives.
TWO DEFECTS, ALLOCATED BY THE CHAIR:
  F-44.114 · A DATE WRAPPED IN STRAY PUNCTUATION WAS UNREADABLE. Older than this seat, but Part B-1 leans on it twice: it refused his
    step 1, and it would have refused "5 June 2027." typed as the ANSWER to B26. Widened by the chair's own runs and by THE FOUNDER'S
    QUESTION, verbatim: "what if its with a comma??" (commas already read in every position; ; : - brackets quotes "..." and " ." did not).
  F-44.115 · THE NOTE SWALLOWED A RESTATED JOB. A REGRESSION OF PART B-1. Refused a date, he retyped the whole sentence; the listener
    heard the NOTED act for the SAME client; by the rule as ruled on the 21st and as built, the note stood, and his sentence was read
    as a date: B7, then B3. At 6456690 the same retype FILED (Part A's walk, turn 6). CORRECTION OF THE B-1 HANDOVER, as the chair
    asked: it said a fresh job of the same kind "waits one turn". THAT WAS WRONG. It was REFUSED TWICE AND THEN DROPPED.

## 2 · WHAT WAS BUILT

F-44.114, src/lib/vendor/spokenDate.js. STRAY PUNCTUATION AROUND A DATE DOES NOT COUNT. unwrapSpoken (:111) strips, from BOTH ENDS and
from nowhere else, any run of the marks in ONE constant, STRAY_MARKS (:109), and the whitespace between them. THE CLOSED SET, named and
never a \W sweep: . ! ? ; : , · the dashes - – — · brackets ( ) [ ] { } < > · straight and curly quotes " ' “ ” ‘ ’. It is called
once, inside resolveRaw (:136), before the forms are tried. NOTHING IS STRIPPED FROM INSIDE: "5.3.27", "5-3-27", "5/3/27" read by
their own separators as before, and "5 March; 2027" is still refused. AN APOSTROPHE before a CLOSING two-digit year ("5 march'27",
"5th Mar '27", the curly one a phone types) reads as that year under F-44.111's rule, with or without a space. A WORD IS NOT
PUNCTUATION: "5th march 27, evening" STAYS REFUSED, on purpose; dropping it would be guessing, and the door never guesses.
TWO SMALL THINGS THE SEAT ADDED, FOR THE CHAIR TO RATIFY: (a) "'27" ALONE is refused before the unwrap (:131): unwrapped it
would be the bare "27", which has always read as the 27th of this month, and that would be a guess at what a year-mark means; a bare
or quoted "27" reads as it always did. (b) a spoken value longer than SPOKEN_MAX, 200 characters, is refused at once (:130), so
no pattern is ever run over a hostile string; nothing she can mean as a date is that long. Punctuation alone ("...") answers reason
'none', as an empty string always did, so the money path asks B6 for it and never B7.
F-44.115 (F-44.113 folded in, the two being one rule), src/lib/vendor/workingDoor.js :703. THE DOOR'S OWN READ STILL COMES FIRST, the
line that decides it byte-identical to 14bc61d (:706). When the door cannot read her message as the answer, SHE HAS MOVED ON, the
note LAPSES and her message is handled FRESH IN THE SAME TURN, if the heard request holds ANY of: an act other than the noted one;
the noted act naming a DIFFERENT client under key(); THE NOTED ACT CARRYING A date_as_spoken OF ITS OWN, since she has then restated
the job. The re-ask remains ONLY for no act heard, or the noted act heard with NO date. A job handled fresh that is refused again
writes a NEW note at tries 0: she may retype as often as she likes and is never told "Nothing was changed" for it (b96 2.2: four
refusals, four B7, tries 0 each). The chair's ruling of the 21st, "only an act OTHER than the noted one lapses the note", is
superseded. This is still the ONE place the listener's record decides such a turn. The lapse never writes money either: a restated
money job after B6 is planned afresh and STAGED (b96 2.10).

## 3 · THE BENCH

b96 (scripts/b96_lcv10_fix_bench.js, NEW, on b95's harness byte for byte): 96 cells. On 14bc61d's source it exits 1 with 54 named FAILs
and no crash. §1 THE TABLE, fifty rows (counted by command), HIS WORDS FIRST ("5th March 27."), then the chair's specimens of both rulings (the
commas pinned as already reading; what his question found, refused at 14bc61d and read now) and a few of the seat's own, each
labelled reads or refused and whose it is. EVERY ROW RUNS ON THE PROCESS CLOCK, no nowMs, so C-44.13's shifted clocks mean something:
a row with a year pins its day; a row without one must read EXACTLY as its bare form reads on the same clock. "today." and "today;"
on the MONEY path, direction 'past', against today in IST taken on both sides. 1.2 the "evening" cell that must stay refused. §2 the
lapse: the restated job FILES in the same turn; the different client (F-44.113); the same client with no date and no act heard do NOT
lapse it; THE DOOR'S OWN READ STILL FIRST (2.7: "5 June 2027." is the answer even beside an over-heard restated job for another
client, and it attaches to the NOTED lead with the TYPED date). §3 THE REGRESSION'S CELLS, FROM THE RECORDS (3.0 reads them): 3.1 Part
A's walk, TURN 4 THEN TURN 6 VERBATIM. Turn 4 reads today (F-44.111), so spokenDate's year form is put back to 6456690's bytes for
that one cell (b95 3.2's method) and turn 4 reads B7 as it did live; then his whole sentence retyped FILES. RED on 14bc61d, green
here. TURN 5 IS LEFT OUT ON PURPOSE and the cell says why: since Part B-1 the note reads "5 march" and files the lead (b95 3.2 holds
that); the regression is what happens to the RETYPE. 3.2 his three messages of 22 September in one thread, hearing INFERRED: the FIRST
files. 3.3 the same three with the strip held back, so F-44.115 is seen alone: his log read B7, B7, B3; it now reads B7, B7, B7, each
with a new note at tries 0. §4 the card's fifteen turns in one thread. §6 fuzz, 100,000-character strings among it. §7 nine mutations
each reddening (the strip removed reddens his sentence; the strip widened to eat a word reddens "evening"; the restated-job lapse
removed is 14bc61d exactly) and one labelled CONTROL.
C-44.13 AS RUN: b96, b95 and b94 on the real clock and on 2026-09-23, 2026-12-31T20:00Z (the year's end, already 1 January in IST),
2027-01-06, 2028-02-29T23:00Z (a leap day, already 1 March in IST), 2028-03-01 and 2029-12-31T18:31Z: every one green. b93, b92 and
b90 on the real clock: green. AND IT EARNED ITS KEEP BEFORE THE CUT: see e-69.
THE DIFFERENTIAL AND THE FLOOR are in the delivery messages, derived after this file was written; the floor runs in a turn of its own.

## 4 · THIS SEAT'S ERRORS SINCE THE B-1 HANDOVER, WITH THEIR CAUSES

  e-68 · every b95 cell for an answer after a date question drove a bare answer or a DIFFERENT job; not one replayed the most natural
    thing a vendor does after "I could not read that date", which is to say the whole sentence again, though Part A's walk held
    exactly that at turn 6. His walk found it. Cause: cells taken from the design's cases and not from what he did on the last
    walk. THE CHAIR'S SHARPENING OF C-44.12: CELLS COME FROM WHAT HE DID ON THE LAST WALK, NOT ONLY FROM THE DESIGN'S CASES.
    c-44.48 is the chair's own record: its plants on r3 were tidy strings; it never typed a full stop and never restated the job.
  e-69 · b96 cell 1.4 first named "18 September 27." as a future day. It is one only until 18 September 2027. The 2028 clocks of
    C-44.13 reddened it BEFORE it was ever cut. Cause: e-66's own class, a literal that ages, written one day after e-66. The
    future year is now derived from the clock. C-44.13 caught, on its first outing, the fault it was written for.

## 5 · OPEN, AND WHERE EACH SITS

  · HIS EXPORT of the 22 September walk: when it arrives, the hearing of his three messages replaces the INFERRED literals of b96 3.2,
    3.3 and 4.1 verbatim (C-44.12), in the next cut that touches b96 or in a bench-only cut if the chair wants it sooner.
  · OBSERVED, NOT FILED (the chair's ruling): b07_f0784_panel_bench reddened once in three of this seat's floors on the B-1 re-cut,
    green in that floor's own warm-up pass and three of three standalone, never red on his machine, reading nothing the cut touched.
    The chair's condition for F-numbering it, flaking on the clean base, was never tested. If it reddens on HIS floor it is that
    delivery's to explain.
  · (a) and (b) of §2, the seat's two small additions, for the chair to ratify.
  · PART B-2, as ruled, less F-44.113 which landed here: the note for B18, B24, B31 and B35; B31, B33 and B35 hash-carried;
    F-44.105's wording; F-44.107's order; F-44.108's sort; the listener's line that a job said without a name is still a job.
    ONE THING B-2 MUST CARRY FROM THIS CUT: the name questions need F-44.115's thought too (a restated job after B18 or B35).
  · Next free: finding F-44.116, migration 0171, bench b97. Errors continue from e-70.

---
A PROSE INSTRUCTION IS NOT A MECHANISM. Trust evidence over narrative, including this file.
