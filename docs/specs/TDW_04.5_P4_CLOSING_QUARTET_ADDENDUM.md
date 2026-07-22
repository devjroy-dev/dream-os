# TDW_04.5 · P4 — HANDOVER ADDENDUM: the closing quartet (D1–D4)

**Bases (re-derived fetch-first):** `fc41e4a` (dream-os) · `948f1ba` (dreamos-pwa)
**Role:** executor (CE-59)

## THE FOUR

| | Defect | Cure |
|---|---|---|
| **D1** | "Add to crew" kept offering itself after it had been done — the roster read had no idea whether a bridge row existed. | Roster GET carries `bridged`; the label FLIPS to **On crew**, dimmed and disabled. |
| **D2** | The gap pip prefilled `city=Delhi`; the composer showed "Select city". A `<select>` whose value matches no option renders BLANK — an invisible failure that could never have worked for any vendor. | A match ladder in ONE home: exact → alias → prefix → honest empty. |
| **D3** | "All filled. This post is closed." rendered on a manual Mark Filled, where nothing was filled. | Each line tells only its own truth; auto-close keeps its sentence. |
| **D4** | "You're confirmed." rendered above a live gold CONFIRM. | CONFIRM dims once confirmed. **CAN'T MAKE IT stays live.** |

## NOTES THAT MATTER

**D1 counts a DEACTIVATED bridge row as bridged.** `ensureBridgeMember` REVIVES
rather than re-mints (F8), so offering the action again would be a no-op dressed
as work. Benched.

**D2's fallback is empty, never `'Other'`.** A wrong city silently selected is
worse than an unfilled one: the poster never notices, and the feed's city leg
quietly excludes everybody who should have seen the post. An empty select asks a
question; a wrong one tells a lie.

**D3 needed no server change.** `my-posts` already ships each item's
`filled_by_response_id`, so auto-close and manual close are distinguishable
client-side with no new field and no second source of truth.

**D4 is a P3 RIDER, disclosed.** `app/crew/[token]/page.tsx` is P3's surface,
sealed at CE-58 — not P4's. Founder-chartered, two lines, recorded as a rider
rather than folded in silently. Zero new strings. CAN'T MAKE IT stays live
deliberately: someone who confirms and then cannot come must be able to say so.

## PROOF

`b0453` **71/71** (was 64; §6b adds seven for D1's server half, including the F8
revival case and the cross-vendor isolation case).

`cityMatch.proof` **17/17**, driving the REAL `lib/vendor/cityMatch`.

**Non-vacuous by PRODUCTION mutation, each reverted:**

| Mutation | Result |
|---|---|
| the alias rung removed | **13/4 RED** |
| the fallback guesses `'Other'` | **15/2 RED** |
| an alias points at a non-option | **15/2 RED** |
| the prefix rung removed | **15/2 RED** |
| the exact rung removed | **17/0 — GREEN, disclosed below** |
| revert | **17/17 restored** |

**DECLARED NON-VACUITY GAP:** removing the exact rung changes nothing, because no
option in CITIES is a prefix of another, so the prefix rung subsumes it. The rung
is retained as ordering insurance for a future list where one city IS a prefix of
another. Its redundancy is DECLARED, not proven necessary.

**A VACUOUS PROOF, CAUGHT AND CORRECTED IN-SITTING:** the first cut of
`cityMatch.proof` carried its own COPY of the ladder and went GREEN on three of
four mutations — a proof of the copy, not of the code. The mutation test caught
it. The ladder was hoisted from page-local to `lib/vendor/cityMatch.ts` and the
proof now imports the real function. Recorded because the near-miss is the
lesson: a declared copy is still a copy.

**D1's client half, D3 and D4 are JSX render conditions** — covered by `tsc` and
the founder's live witness, not by bench. Named per F-04.105's class: benches
prove payloads, the smoke card is the estate's reachability detector.

**THE FLOOR — my own run, byte-stable, b0498 mapping disclosed:**

```
b0452 52 · b0453 71 (was 64) · b0451 111 · b0450 46
b0498_fresh_crew_rider 66 + b0498_wa_assign_punct 17   <- the "66+17" pair
b05_m2 4 · assign 30 · crew 21 · gap 10 · crud_crew 19
b0496 11/11 ALL GREEN · b0497 ALL GREEN
b5_wa_door 32 · b6_referent 36 · checker 101
b6_sitting2 20/22 — EXACTLY, per F-04.91
pwa: tsc 0 · bands 11/11 · crewCommit 11/11 · rosterMint 22/22 · cityMatch 17/17
```

Engine build green · `node --check` clean.

## STRINGS
One new string, founder-vetoed: **On crew**. D2, D3 and D4 add none — D3 shortens
an existing line, D4 dims an existing control.

## NOT BUILT — AWAITING VETO
The owner-side ASSIGNMENTS section is NOT in this delivery. Its strings are at the
founder's veto and the charter says build on his recorded answer, never before.

**THE FORK IS SETTLED BY FACT, and better than the read-first proposed:**
`buildCrewPage` (`src/api/crew.js:241`, exported `:534`) is ALREADY extracted,
takes `{ supabase, member, vendor, today }`, and contains ZERO auth logic — token
resolution happens entirely in the route above it. An owner-side door imports it
and calls it after its own auth. **No refactor, and the capability core is
untouched**, so `b0451`'s capability asserts stay pointed at exactly what they
were pointed at. The sharing cannot loosen the token door because nothing about
the token door changes.

**Sequencing beyond this sitting is the founder's.**
