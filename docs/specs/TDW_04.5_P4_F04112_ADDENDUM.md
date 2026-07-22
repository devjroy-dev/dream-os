# TDW_04.5 · P4 — HANDOVER ADDENDUM: F-04.112 (the reach-nobody window)

**Base:** `9c3a939` (dream-os) · **Role:** executor (CE-59)

## THE DEFECT — FOUNDER-WITNESSED LIVE
A post from a vendor with an empty roster is not "roster-first". It is
**INVISIBLE TO EVERYONE** for the full window. Witnessed at the P4 smoke: the
9:34 PM Chennai post reached nobody, and the walk only continued because
`collab.first_look_hours` was set to `0`.

The penalty falls hardest on **NEW vendors** — no roster yet, most dependent on
the open board, and their first-ever post silently reaching no one. They would
reasonably conclude the feature is broken. They would be right.

## THE CURE (CE-59 ruled)
At the create path, the window is set only when the poster's roster holds **≥1
LINKED member** (`member_vendor_id IS NOT NULL`). Zero linked members → no
window → the post reaches the board immediately.

**Why the predicate is `member_vendor_id IS NOT NULL` and not "roster is
empty":** derived from the shipped gate, not guessed. `firstLookFilter` matches
roster edges on `member_vendor_id` (`collab.js:112`), so a MANUAL phone-only
entry cannot see an in-window post no matter what. A roster of nothing but
manual rows is an empty audience wearing a full list, and it would have
reproduced the identical silent-invisibility bug.

## NAMED, NOT CURED
Linked members who exist but whose categories match no item on **this** post are
still an audience of zero for this post specifically. Narrow, honest, and a
one-predicate upgrade if the founder ever wants it. Recorded rather than quietly
built.

## PROOF
`b0453` **64/64** (was 57; §1c adds seven).

Non-vacuous by PRODUCTION mutation of `src/api/vendor/collab.js`, each reverted:

| Mutation | Result |
|---|---|
| F-04.112 reverted — the window is always set | **61/3 RED** |
| the audience predicate inverted | **59/5 RED** |
| manual rows counted as audience (`.not` dropped) | **63/1 RED** |
| the audience read not scoped to this poster | **63/1 RED** |
| revert | **64/64 restored** |

The third mutation is the sharp one: it proves the predicate is
`member_vendor_id IS NOT NULL` and not merely "a roster row exists".

**THE FLOOR — my own run, byte-stable, b0498 mapping disclosed:**

```
b0452 52 · b0453 64 (was 57) · b0451 111 · b0450 46
b0498_fresh_crew_rider 66 + b0498_wa_assign_punct 17   <- the "66+17" pair
b05_m2 4 · assign 30 · crew 21 · gap 10 · crud_crew 19
b0496 11/11 ALL GREEN · b0497 ALL GREEN
b5_wa_door 32 · b6_referent 36 · checker 101
b6_sitting2 20/22 — EXACTLY, per F-04.91
```

Engine build green · `node --check` clean · pwa `tsc --noEmit` 0.

## ZERO NEW STRINGS
Chair-derived expectation met. The cure changes only whether a timestamp column
is written; no user-facing text is added or altered.

## SCOPE NOTE — THE PWA HALF WAS ALREADY BANKED
CE-59's closing charter listed two micro-ZIPs. The Add-to-crew row action
(mint-only, three vetoed strings, idempotent re-tap proof) shipped earlier this
sitting and is at pwa `origin/main` `948f1ba` — `lib/vendor/rosterMint.ts`,
`scripts/rosterMint.proof.ts`, `scripts/run-roster-mint-proof.sh`, verified at
origin by command, and visible live in the founder's roster screenshot. This
delivery is therefore ONE ZIP, not two. Nothing was withheld.

**Sequencing beyond this sitting is the founder's.**
