# repo: dream-os @ 2d9b9f377d2068d7154ecdcd71879268add09386 (base) · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307
# TDW · CE-44 · SEAT LCV-2 · LC-VICTOR P5 · THE WORKING DOOR FOR MONEY AND INVOICES · HANDOVER

**Rung b90.** Code and one migration, so it verifies on the founder's own floor end to end
(`run-floor.sh --delivery scripts/floor-manifest-ce44-lcv2-p5.txt --check`), installing and building from the
applied tree first. 0169 is founder-run SQL with its own card steps. W-1 NONE. No pwa byte.

## 1 · What P5 is, as ruled (R-44.21, the founder, 2026-09-20)

His words, verbatim: *"ill go with your ruling on all except no. 3. in no. 3 we wait 15 mins. thts the time it
takes for the thread to refresh"*.

- **(a) Fork (b).** Victor steps out of the working rooms ONE JOB AT A TIME, bookings, payments and invoices
  first. The door speaks alone ONLY when every act in her message is one it covers. Any message with an
  uncovered act goes through today's chain UNCHANGED. The leftover line does NOT go live at P5 (the chair's
  amendment): until the last packet a message the listener makes no act of goes to the chain; `doorLines.js`
  carries the line and its twelve examples, hash-pinned and unused.
- **(b)** A door-answered turn counts as ONE message toward her limit (F-44.52).
- **(c)** The wait for her yes is 15 minutes, its own constant.
- **(d)** The Basic turn on the walk: DEV440 set to basic for one message and back.
- **(e)** F-44.54: the first example reads "The Sharma booking is confirmed". WITHDRAWN, not to reappear: "The
  Sharma wedding is confirmed for 5 December, fee 60,000".
- **(f)** The thirteen bytes, his, verbatim, in `src/lib/vendor/doorLines.js` (B14 joined at R-44.22 (a), §4c), with D1 (vetoed at CE-43,
  `TDW_CE43_LC2_P3_HANDOVER.md:173`), homeless in code until now.

**THE SENTENCE FOR THE CARD, as the chair ruled it:** a MIXED message carrying a money act goes through the chain
WITHOUT the door's confirmation, so confirm-before-money holds on door-only turns alone until the last packet.

## 2 · How a working-room turn runs now

After the cap check and the route, before anything else is fetched: (1) the pending check, BEFORE the listener:
a live staged row (state `staged`, unexpired) answers her whole-message yes or no (F-44.53's closed lists:
yes, yeah, yep, ok, okay, haan, ha; no, nahi, cancel); anything else expires it and the message is handled fresh;
a bare yes or no with nothing live goes to the chain. (2) The listener is heard BEFORE the reply, bounded at 4 s
(`HEAR_BEFORE_REPLY_MS`, the chair's number; the after-the-wire recording keeps 15 s for b86 §4). (3) If every
act is covered and names a client, each is resolved read-only; any act the door cannot say sends the WHOLE
message to the chain. (4) Invoices run and speak first; the one money act is STAGED (0169) and asked (B1, B2);
a second money act is not staged and B12 says so. (5) On her yes the act runs through lifecycleHands' ONE helper.

**On a chain turn the request heard before the reply is what `meta.listener` records: `recordListening` is handed
it and makes NO second model call** (b90 5.39, M3). A timed-out pre-reply call's tokens are not metered: the
call is abandoned at the bound and its usage never returns. Named, not cured.

**Figures:** every figure spoken comes from a ROW (package total, milestone `amount_due`, invoice). A figure the
listener returned is never written and never spoken (b90 5.9, 5.24).

**Item 1, option (i):** the act table's image is `donna_booking`, `donna_milestone_paid`, `donna_invoice_pdf`,
never `donna_client`, `donna_stage`, `donna_money` or `donna_money_edit` (b90 4.1, M5). Option (ii), failing
CLOSED for money, is the design of record for P7.

## 3 · Lines per act

| Act | Before staging | Asked | On yes |
|---|---|---|---|
| booking_confirmed | B4 no lead · B5 no package · B8 two same-named leads · F29 otherwise | B2 | D1 |
| advance_paid | as above, and B6 no date · B7 unreadable | B2, no advance shown | D1 then D3 or D4 |
| milestone_paid | B6 · B7 · D5 · B8 · D6 · D7 (already marked, stored IST day) · D8 | B1 | D3 or D4, or D5 to D8 |
| invoice | B8 two binders · B10 several invoices · B11 no fee · chain if no binder (F-44.57) | none | B9 served · B13 minted |

Her no: B3. Chips, ruled (a): NO chip on a door turn. The door's SSE turn emits one non-empty `text_delta`, then
`done` with `tool_calls`, `refresh`, `room: 'business'` and `meta`, then `[DONE]` (F-44.56: never the pwa's
empty-reply `'Got it.'`). Harvest on a door turn gets her message, the door's lines and the hands run; skipped
where byte 8 was spoken (no "?", so F-04.72's hold would not fire).

## 4 · The stuck row

Only a `staged`, unexpired row is live for a yes or a no. A row left at `confirmed` with `resolved_at` empty is
closed on her next money act: `resolved_at` stamped, state left, outcome `{ code: 'refused:apply_unstamped' }`;
then the new act stages (b90 5.17, 5.18, M6). The already-marked line is D7 (c-44.26).

## 4b · Once the door has written, the turn is the door's to the end (the chair's rule on the first cut)

The first cut's `preTurn` caught every throw as a chain turn, and the WhatsApp branch's delivery sat inside the try
that fell to the chain: a hiccup after a write could hand her SAME message to Victor (a yes applied and then answered
in prose; a staged payment then marked by the chain without the confirmation). Now: `st.wrote` is set BEFORE each write
is attempted (decline, confirm, stage, a mint); after it no path returns the chain. The catch answers with the lines
already earned, else the act's refusal (D8 for a payment, F29 for a booking) or, for an invoice, the founder's vetoed
glitch line (`STAGE2_LINE_MUTATION`, read from its home in chat.js). `markApplied` runs in its own guard, so a failed
stamp cannot mask a payment that landed (D3 stands). A stage that throws closes every open staged row, best-effort, so
no row she was never asked about stays live for a later yes. `markExpired` on a live row her message did not answer is
a stamp, not an act on her message, and stays before the first write. The WhatsApp delivery lives in ONE home,
`workingDoor.speakOnWhatsApp`, every step (persist, send, the outbound row, `last_message_at`, each document) in its own
guard; the lane RETURNS after it. The app lane's persist runs in its own guard after the door answered. b90 §12 drives
a throw at each post-write point and 11.12 to 11.14 (M11, M12) restore the fall-through and redden.

**The re-read (the chair's cure; the limit first named here was NOT accepted as a limit):** before the after-write
catch speaks D8 or F29 it RE-READS the row it meant to write: the milestone's state for a payment, the lead's state,
binder and package invoice for a booking. Landed: the truthful existing byte, D7 for a payment already marked, D1 for a
booking that stands with its number read from the row. Nothing landed, or the re-read fails: D8 or F29, and the
stuck-row rule records the rest. b90 12.3 to 12.3e pin both outcomes for both acts; M14 skips the re-read and reddens.

**F-44.58 (allocated, cured in P5):** a bare yes or no after the door's question lapsed went to the chain, where Victor
could read the door's B1 or B2 above it and mark the payment himself, outside the window. Now: when her whole message
is in the closed yes or no list, no row is live, and the LAST assistant row of the working thread is the door's own
confirmation (known from `meta.listener.asked`, which `persistDoorTurn` writes only when it staged and asked B1 or B2,
never by matching text), THE DOOR ANSWERS with B14 and the chain is not called; the stale row is closed. A bare yes or
no whose last row is not a door question still goes to the chain. b90 §13 drives it through the real
`processVendorInbound` with `runTurn` spied: a lapsed yes, a lapsed no, a yes after a decline, a yes after a chain
turn; M13 reddens.

**No circular load:** the door reads the glitch byte LAZILY, inside `glitchLine()`, from its one home in chat.js, and
holds no copy. b90 §14 proves the full string on a COLD require of workingDoor alone and in both load orders (child
processes). The chair's first choice among three; it keeps one home and needs no equality cell.

## 4c · R-44.22, the founder's (2026-09-20)

His question of F-44.58, verbatim: *"arent we planning to take away write powers fro Victor"*. The chair answered that
under R-44.21 (a) Victor keeps his hands until the last packet and that Donna's tools come as one set, and put two
things to him: the door-side cure for a late yes with its new byte, and a packet straight after P5 in which the chain
LOSES every hand the door owns. His word, verbatim: *"yes"*, read by the chair as yes to both.
- **(a) B14, his, verbatim, hash-carried in `doorLines.js`:** "That request timed out. Nothing was changed. Say it
  again." Spoken for F-44.58's case. B3 stays her no to a live row.
- **(b) P5b, the packet after P5, NOT built here:** the chain loses `donna_booking`, `donna_milestone_paid` and
  `donna_invoice_pdf`, so neither a late yes nor a MIXED message can move money without the door's confirmation. From
  then on every packet takes the hand from the chain in the same cut that teaches the door the act. P5b needs W-1 (the
  tool list offered to Donna's seat is engine ground); its read-first, after P5 walks, names the exact lines, says
  whether a hand is withheld per surface so the relay seat and door-internal callers keep what they use, and DERIVES,
  on live turns with the founder's keys as P1 was, what Victor says when Donna answers she has no such hand
  (F-44.13's class).

## 5 · F-44.46 AMENDED (c-44.28), ratifying the executor's direction

`spokenDate.js` takes a direction. PAST for a date money was received (milestone_paid, advance_paid): the most
recent such date on or before today in IST; a received date that can only be read as after today is byte 7.
FUTURE for everything else (F-44.46 as ruled for lookups). Fixtures: "18 September" said on 20 September 2026 is
18 September 2026 for a payment (b90 2.3) and "19th" asked on 20 September is 19 October for a lookup (2.1);
"tomorrow" and "18 September 2027" as a received date are B7 (2.6, 5.22b). M8 holds it.

## 6 · Files

New: `src/lib/vendor/workingDoor.js`, `doorLines.js`, `pendingMoneyActs.js`, `spokenDate.js`;
`db/migrations/0169_pending_money_acts.sql` (r2, chair-confirmed, RLS on with no policy); `scripts/b90_lcv_p5_bench.js`;
the manifest; this file. Edited: `src/lib/vendor/listenerDoor.js` (a heard request is recorded, no second call);
`src/agent/harvest.js` (F-44.52's counted id on its own line; `conversation_id: null, // NOT a turn` byte for byte,
b86 M2); `src/api/vendor/invoices.js` (`made`, F-44.49); `src/lib/vendor/handResult.js` (`served`; the door's own
key map above `fromOutcome`, b89 M3); `src/lib/vendor/lifecycleHands.js` (two exports); `chat.js` and
`vendorInbound.js` (the door on both lanes; the invoice sentence through its one home, F-44.48, F-43.34).

## 7 · Sealed-bench amendments, each in one cell, each on the chair's ruling

- **b88 cell 4.6** (option (i), F-44.48): asserts byte 13 in `doorLines.js` with its hash, and that
  `vendorInbound.js` speaks it only through that home and holds no literal. Ground: C-44.7.
- **b80 M4** (option (i)): re-aimed at the byte's home. The PDF promise is restored IN `doorLines.js` with its
  hash re-stamped, the mutated home is placed in the require cache, a fresh `vendorInbound` is driven through the
  real `processVendorInbound`, and C1a and C1b go RED. §4.1 and §4.2 unamended and green.
- **tdw10 §2.3** (the chair's ruling, NOT a count of seven): at least one `await buildMeta(` call site exists and
  every one uses the plain-arguments shape; the number is not asserted. §2.3m proves it still reddens on a retired
  positional call. Ground: C-44.7, a live module's count.

## 8 · Findings, errors and corrections

F-44.52 (counted door turn), F-44.53 (the closed yes list), F-44.54 (the example), F-44.56 (the pwa's own
`'Got it.'` at `hooks/vendor/useChat.ts:171`; its cure rides the last packet's pwa cut), F-44.57 (invoice with no
binder goes to the chain), F-44.55 (RLS census, not P5's). e-17 (A built before the ladder was read), e-18 (A sent
as a pasteable block through the courier), e-19 (tdw10 called clear after reading some of its cells; from here a
bench is clear only when every cell reading an edited file has been read), e-20 (the first cut's door fell to the
chain after a write, the chair's catch; cause: `preTurn`'s one catch knew only "before or after" the listener, not
"before or after a write"), e-21 (b90's M10 wrapped a promise left pending on purpose in `quiet()`, which restores the
console only when its promise settles, so every later line of the bench's output was swallowed; the exit code, the
verdict, stayed true, but the first cut's reported count was of the visible lines only). The chair's: c-44.25 (line cites from
before a cut), c-44.26 (D4 for D7), c-44.27 (a pwa path from memory), c-44.28 (F-44.46 too wide). C-44.10:
text awaiting the chair's read travels as a `.FOR-THE-CHAIR.txt` file, never a pasteable block. c-44.18 is not
in the tree and not held by this seat.

**The floor's first run on the applied tree** read FLOOR DELTA with two new reds, each run standalone to its
cause: `tdw10_combined_cap_bench` §2.3 (the count, amended as ruled) and `b65_i1_advisor_room_only_bench` 4.2 (the
door's synthetic harvest result carried a `victor_mode` key, and 4.2 forbids the door naming the column outside
the TurnResult field; the key was mine and is removed, the bench untouched).

---

Trust evidence over narrative, including this file. Sequencing beyond this sitting is the founder's.
