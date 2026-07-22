# TDW_04.5 · P4 — HANDOVER ADDENDUM: owner-side assignments (the final addition)

**Bases (re-derived fetch-first):** `998cadc` (dream-os) · `693314e` (dreamos-pwa)
**Role:** executor (CE-59)

## THE TASK
Clicking a team member told the owner nothing about their assignments — he had
to walk the calendar and read the marks. The crew page already renders the exact
set for the MEMBER; the owner now sees the same view of his own crew.

## THE FORK — SETTLED BY FACT, NOT BY ARGUMENT
The read-first proposed extracting the crew endpoint's assembly. **It was already
extracted.** `buildCrewPage` (`src/api/crew.js:241`, exported `:534`) takes
`{ supabase, member, vendor, today }` and contains ZERO auth logic — token
resolution lives entirely in the route above it.

So the owner door **imports and calls it**. No refactor. `crew.js` is
**BYTE-UNTOUCHED** by this delivery, which is the strongest possible answer to
the chair's constraint that the sharing must not loosen the token door: nothing
about the token door changed. `b0451` re-run: **111/111**, byte-stable.

The assembly is not merely a query — it encodes the read gate (DB `contains`
re-asserted in JS, belt AND braces) and **F7** (`note` is
`crew_confirmations.note` ONLY; `events.notes` never leaves the vendor plane). A
fresh owner-side query would have re-derived both and drifted at the first edit —
F-04.104's class.

## THE DOOR
`GET /api/v2/vendor/studio/team/:memberId/assignments`
Auth: `requireAuth` + `resolveVendor` + **the member must belong to this vendor**.
The belongs-to check IS the authorization: scoped by `vendor_id`, so another
vendor's member id resolves to nothing and answers **404, not 403** — the door
does not confirm a member exists to someone with no claim on them.

**Assignments only.** The assembly also builds `tasks`; the owner has his own
Tasks screen, and echoing them here would put a second source of that truth on a
surface that did not ask for it.

## STRINGS — FOUNDER VETO, CLOSED
`Assignments` · `No assignments yet.` · `Awaiting confirmation` · `Confirmed` ·
`Can't make it`. The decline note SHOWS, founder-ruled; F7 permits it.

**ONE BYTE FLAGGED, NOT SILENTLY CORRECTED:** the founder's relay read
"AWAITING CONFIRMION". Built as **"Awaiting confirmation"** — an evident typo,
but it is a vetoed string, so the reading is declared rather than assumed. One
word to change if misread.

`"Can't make it"` over `"Declined"` is founder-ruled and deliberate: it is the
exact phrase the crew member tapped. Echoing their words back is more honest than
converting them into a verdict, and it keeps one vocabulary across both surfaces.

The vocabulary has ONE HOME (`lib/vendor/assignmentWords.ts`) — F8(d)'s argument
applied to confirmation states. Two screens, one spelling.

## READ-ONLY, DELIBERATELY
The section renders; it does not assign. Assignment happens in the booking
pickers through the events PATCH that routes to eventWrite. A second write path
to the calendar from this sheet is exactly what the one-writer law forbids.

## PROOF
**`b0454_owner_assignments_bench` — 19/19.** Drives the REAL team router AND the
REAL `crew.js`, both mounted over a real listener.

**§3 is the ruling under test:** the owner door's payload is asserted
**field-for-field identical** to the token door's, from the same fixture. If the
two ever diverge, that assertion notices. A bench that re-implemented the
assembly would have proven the re-implementation.

**Non-vacuous by PRODUCTION mutation of `team.js`, each reverted:**

| Mutation | Result |
|---|---|
| the belongs-to check dropped (any vendor reads any member) | **16/3 RED** |
| `tasks` echoed into the response | **18/1 RED** |
| the F7 note stripped from the owner's view | **17/2 RED** |
| the assembly re-implemented instead of reused | **11/8 RED** |
| revert | **19/19 restored** |

*The fourth mutation first CRASHED rather than reddening — the bench dereferenced
`a[0]` on an empty list. Hardened with optional chaining so it REDs properly. A
crash is weaker evidence than a RED, and the fix is the bench's, not the code's.*

**`assignmentWords.proof` — 16/16**, driving the REAL module. Mutations: declined
reverting to "Declined" **14/2 RED** · pending shortened to "Awaiting" **11/5
RED** · the fallback leaking the raw enum **15/1 RED** · a tone becoming the
muhurat gold **15/1 RED** · revert green.

**THE FLOOR — my own run, byte-stable, b0498 mapping disclosed:**

```
b0452 52 · b0453 71 · b0454 19 (new) · b0451 111 · b0450 46
b0498_fresh_crew_rider 66 + b0498_wa_assign_punct 17   <- the "66+17" pair
b05_m2 4 · assign 30 · crew 21 · gap 10 · crud_crew 19
b0496 11/11 ALL GREEN · b0497 ALL GREEN
b5_wa_door 32 · b6_referent 36 · checker 101
b6_sitting2 20/22 — EXACTLY, per F-04.91
pwa: tsc 0 · bands 11/11 · crewCommit 11/11 · rosterMint 22/22
     cityMatch 17/17 · assignmentWords 16/16
```

Engine build green · `node --check` clean.

**Sequencing beyond this sitting is the founder's.**
