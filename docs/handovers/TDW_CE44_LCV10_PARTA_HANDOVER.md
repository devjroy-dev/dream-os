# repo: dream-os @ 627323b9aa4f4168043df2bfe15f95da42519f06 · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307 (untouched)
# TDW · CE-44 · SEAT LCV-10 · PART A: AN OVER-HEARD ACT NO LONGER REFUSES A COVERED JOB (F-44.110) · HANDOVER · 2026-09-21 IST
# W-1 NONE. NO migration (0171 stays free). Bench b94 is taken; b95 is the next free. Six paths, every one in
# scripts/floor-manifest-ce44-lcv10-parta.txt. NO BYTE A VENDOR READS WAS ADDED OR CHANGED. Line numbers below were derived by
# command from the delivered tree at the moment this file was written; re-derive before citing.

## 1 · WHAT THIS CUT IS, AND WHAT IT STANDS ON

WITNESSED, TDW_CE44_LCV9_PART1_WALK_RECORD.md §3 turn 8, the founder's own message on 21 September 2026: "Add a new lead Walk P8
Fresh, wedding on 20 February 2027". HEARD by the live listener, verbatim from his export:
    {"acts":[{"act":"lead","date_as_spoken":"20 February 2027","client_as_spoken":"Walk P8 Fresh"},{"act":"book_event","date_as_spoken":"20 February 2027","client_as_spoken":"Walk P8 Fresh"}],"route":"task"}
book_event is not covered, so the whole-message rule read the message as MIXED; the door spoke B34 and THE LEAD WAS NOT FILED. The
same sentence shape had been heard as `lead` alone that morning and filed. Code did what was ruled with what it heard. The defect is
that since R-44.37 took the chain out, an act the listener OVER-HEARS refuses a job the door can do. Turn 10's attach then had no
lead to land on, so no covered job was witnessed end to end on Part One's walk.
THE CURE, BOTH HALVES, as the chair ruled and accepted them before the build:
  (1) THE LISTENER'S PROMPT BYTE, src/lib/vendor/listenerDoor.js :44, appended to SYSTEM, accepted by the chair as worded:
      "A wedding date said with a new lead belongs to that lead: put it in the lead's date and record no book_event for it."
      It is the listener's byte, not a founder byte. It is prose, and prose is not a mechanism.
  (2) THE MECHANISM, src/lib/vendor/workingDoor.js withoutEchoedEvents (:157), with sameSpokenDay (:148).

## 2 · THE MECHANISM AS BUILT

withoutEchoedEvents(request, nowMs) drops a `book_event` act ONLY when ALL of these hold: a `lead` act sits in the same request;
both acts name a client and the names are equal under the door's key() fold (case and outer spaces, never fuzzy); both carry a
date, and the two dates either BOTH resolve (resolveSpokenDate, direction 'future') to the same day or, NEITHER resolving, are the
same string once folded. NOTHING ELSE IS DROPPED: another client, another date, a dateless book_event, a dateless or nameless
lead beside it, one date readable and the other not, a book_event with no lead beside it, and every act that is not book_event
(block_date, note, edit_event and the rest) all stay, the message is then uncovered, and the stand-in speaks B34 as before.
It returns THE SAME OBJECT when nothing is dropped and a new object otherwise; IT NEVER MUTATES WHAT WAS HEARD. It is total:
anything hostile or thrown returns the request as it came.
WHERE IT IS READ, two places and no third (b94 7.3):
  · preTurn, :611, between the hear and the covered check (:612). The door decides on `heard`; `const acts = heard.acts` (:617).
    st.ear is untouched, so the verdict's ear, and meta.listener.request on the door's own row, keep BOTH acts as the listener
    returned them (b94 2.2, 5.2). REPORT WHAT YOU SAW AS YOU SAW IT holds for the record.
  · standKeyOf, :741, so the stand-in reads the request as the door decided on it and the two can never disagree (b94 3.1, 3.2).
    standKey and standKeyOf gained an optional third argument, nowMs; standIn passes deps.nowMs when it is finite. Absent, the
    clock is now, as everywhere else in this file.
THE PHONE GUARD'S LINE (:614) IS BYTE-IDENTICAL TO 627323b. It still reads st.ear.request, which is right (a `lead` act is never
dropped, so the test reads the same on either request) and it is the anchor of b92's phone-guard mutation (b92 :370). An echoed
event opens no way round F-44.96: b94 3.3.
A date the door refuses, echoed: the echo is dropped (neither resolves, the words are the same) and the lead answers its OWN byte,
B21, where before it read B34 (b94 2.7).

## 3 · C-44.12, THE LESSON OF THIS CUT (the chair's, standing)

b93 cell 11.6 drove turn 8's exact sentence through a double that returned `lead` ALONE, and was green; the live ear returned
`lead` AND `book_event`. A double not shaped as the live ear is how F-44.110 passed a card cell. C-44.12: WHERE A WALK RECORD
HOLDS WHAT THE LIVE LISTENER HEARD FOR A SENTENCE, THE CELL FOR THAT SENTENCE REPLAYS THAT HEARD REQUEST VERBATIM, and says
which record and turn it came from; a tidier request may be tested BESIDE it, never instead of it.
APPLIED IN THIS CUT TO b93 §11 (the comment at b93 :499 names them), each corrected to TDW_CE44_LCV9_PART1_WALK_RECORD.md §3:
  · 11.6 (:511), turn 8: RE-PINNED, accepted by the chair before the build. Replayed verbatim it is RED on 627323b's source (and
    11.14 with it, the attach finding no lead, exactly as turn 10 went) and green with the drop: the lead FILED, B17.
  · 11.2, turn 3 ("personal" in the client slot, missing ["year"]); 11.3, turn 4 (date_as_spoken "this week"); 11.4, turn 5
    ("Phone" dropped from the name, 9876543210 in amount_rupees): doubles corrected; what each asserts is unchanged and each passes.
  · 11.9, turn 6 ("The booking is confirmed" heard as NO ACT): the heard request now drives the cell, and the tidier request it
    used to drive (booking_confirmed with no client) is kept BESIDE it, inside the same cell. b93's count stays 126.
  NOT CORRECTED, and why: 11.1, 11.7, 11.8, 11.11 and 11.14 already matched their recorded hearings; 11.5's card sentence has no
  recorded hearing (he used his own words on the walk); 11.10 and 11.13 are decided by the closed yes/no list before the
  listener; 11.12 is the listener down.
  b93 §3 IS LEFT AS IT IS, AND THE NEXT SEAT DOES NOT "CORRECT" IT (the chair's ruling on this cut, 21 September). §3's exits table
  drives tidier doubles for the sentences of turns 3, 4 and 5. Its cells are named by EXIT reason ("3.1 ${x.why} ...") and 3.5
  sweeps all twenty acts: they claim to test an exit, not a sentence anyone said. C-44.12 BINDS A CELL THAT CLAIMS A SENTENCE FOR
  WHICH A WALK RECORD HOLDS THE HEARING; it does not bind a cell that claims an exit.
b94 1.0 reads the walk record itself and asserts that b94's TURN8 literal is that record's HEARD line under his exact sentence.

## 4 · THE BENCHES

b94 (scripts/b94_lcv10_bench.js, NEW): 62 cells, exit 0. On 627323b's source it exits 2 (the helper does not exist); the
behavioural both-ways is 9.1 and b93 11.6. §1 the helper alone, sixteen cells: the record's own bytes, turn 8 first, then the shapes that are
NOT an echo or are one said another way. §2 the REAL preTurn and the REAL createLead: turn 8 as heard FILES THE LEAD, B17, day precision, source self;
the record keeps both acts; six INVENTED genuine second jobs beside a lead are each still uncovered, B34, nothing filed; the tidier
hearing beside the specimen. §3 the stand-in and the phone guard. §4 the prompt sentence: present once, its own hash a literal,
and SENT in the one call hear() makes. §5 THE REAL processVendorInbound with runTurn spied and the real persistDoorTurn: zero chain
turns, one line, B17, source whatsapp, the note whole. §6 EVERY SAY LINE ON PART A's CARD in one thread and one database through the
REAL createLead, resolveLead and attachPackage: the lead filed, the package attached to THAT lead from the row, a genuine second
job refused, the WhatsApp step; then the thread and the estate after it. §7 W-1 and the six paths from this packet's own
manifest. §8 fuzz: 2523 hostile calls on the helper and sameSpokenDay in every position, 1682 on standKey with its third
argument, 29 hostile ear returns through preTurn; zero throws. §9 NINE mutations of production code, each reddening its cells,
and ONE HONEST CONTROL (9.10): echoed()'s own date test alone removed does NOT redden, because sameSpokenDay refuses one date
against none; 9.4 holds that second guard.
PINS UNDER C-44.7: the sentence's own sha256 and the walk record's bytes. NOT pinned, on purpose: SYSTEM's other bytes and
EAR_TOOL, which Part B edits.
THE DIFFERENTIAL: the 67 benches that name a door file, chat.js or vendorInbound.js, run on the clean tree at 627323b and again on
the delivery tree, after one `npm ci` and `npm run build`. EXIT CODES: identical on all 67 (59 exit 0; seven of the eight non-zero
are named in scripts/floor-base.txt; b06_gauntlet refuses for an absent key). OUTPUT: byte-identical on 66; b93 differs in exactly
ten lines, the five renamed cells of §3 above, every one PASS on both sides. No other bench moved. No mutation anchor of another
rung sits on a line this cut edits (grep of scripts/ for each edited line's bytes: one hit, b92 :370, the phone guard, untouched).

## 5 · OPEN, AND WHERE EACH SITS

  · PART B, whole, as the kickoff has it and as the chair ruled on 21 September: the door's own note (meta.listener.note, beside
    asked_name) for B18, B24, B26, B31 and B35, read after the live-row handling and above the bare yes/no branch; typed answers
    decided by the door's own read first; name answers lapsing only when the listener hears an act OTHER than the noted one;
    B31, B33 (reuse of dreamos-pwa lib/worklist/packages.ts:116, witnessed at 320ad7e: `no_fee: 'Set the fee first.'`), B35;
    the lead resolved before the package (F-44.107); F-44.105's description; F-44.108's sorted list; the listener's line that a
    job said without a name is still a job. The riding items (P6a-2's addendum, F-44.101 to F-44.110, e-59 and e-60) ride Part B's
    handover as the kickoff placed them.
  · Next free: finding F-44.111, migration 0171, bench b95. Errors continue from e-62.

## 6 · THIS SEAT'S ERRORS, WITH THEIR CAUSES

  e-61 · the first install runner was started with a bare `&` inside one tool call and died when the call returned; four minutes
    were spent polling an empty log. Nothing was claimed from it. Cause: a background job tied to the call that started it. Every
    long run since is detached with its own sentinel, and every call after a floor starts is a poll.

---
A PROSE INSTRUCTION IS NOT A MECHANISM. Trust evidence over narrative, including this file.
