# R-37.31 · P0 HOTFIX — THE ENQUIRY DOOR'S UNBOUND FLOOR

**Seat:** LE · **Repo:** `dream-os` alone · **Base:** re-derived fetch-first at the moment of cutting · **Ruling:** R-37.31-A · **Findings cited:** F-16.28 · F-16.29 · **Chair's own:** c-37.4

---

## 1 · THE DEFECT

`src/api/couple/enquire.js` computed `postedBudgetMin` at **`:149`, inside the route handler's scope**, and used it at **`:639`, inside `handleRealVendor` — a separate top-level function** whose destructured parameter list did not carry it and whose call site did not pass it.

Derived, not inferred: a grep across the whole of `handleRealVendor`'s body returns **zero bindings** of that name. It was a free identifier at the point of use.

**Every Discover enquiry to a REAL vendor threw `ReferenceError: postedBudgetMin is not defined` → 500.** The pwa's enquiry sheet checks `res.ok` and throws, rendering `Could not send. Try again.` — which is what the founder saw and reported.

**Blast radius: the whole real-vendor Discover funnel, every tier.** `handleRealVendor` runs before any tier branch, so this was not a basic-tier defect — it was the top of the funnel, dead. The DEMO leg was unaffected: it threads its value correctly.

**The law was written down twenty lines away and not followed one function over.** The demo leg's own comment, shipped in the same delivery, reads: *a value that is not in a parameter list is not in scope. Passing it is the only honest way in.*

## 2 · THE CURE — TWO LINES, NOTHING ELSE

The whole diff is `2 insertions(+), 2 deletions(-)` in one file, verified by `git diff --stat` before cutting:

- the call site gains `postedBudgetMin` in the object it passes;
- `handleRealVendor`'s destructure gains `postedBudgetMin`.

No comment was added, no adjacent line touched, no second concern folded in. A P0 hotfix that carries a passenger is not a hotfix.

## 3 · [F-16.28] THE FOUR-INSTRUMENT MISS — THE MORE IMPORTANT HALF

**Four green instruments passed over a door that was throwing on every request.**

| Instrument | Result on the broken tree | Why it could not see |
|---|---|---|
| `node --check` | clean | parses only; an unbound identifier is not a syntax error |
| `npm run build:engine` | `rc=0` | the engine plane; this file is not in it |
| `b37_f1625_band_floor_bench` | **35/35** | its door cells read the **source** for `budget_min: postedBudgetMin`. The string was present. The string was always going to be present |
| `run-floor.sh --delivery --check` | NAMED BASE, no delta | the floor runs the benches; the benches could not see it |

**The root cause of the miss is a bench reproducing the method under test.** A cell that greps source for an assignment proves a author typed something, not that a request survives. This is the same vacuity class caught and cured in `b36`'s §7 during Seat A′ — where the alert-body cells string-substituted a value the bench itself computed, and the mutation harness exposed it — and it **survived into a different instrument in the next sitting.** A lesson cured in one file is not a lesson learned.

**[F-16.29] NO INSTRUMENT IN EITHER REPO EXECUTES THE ENQUIRY DOOR.** Until one boots the handler and drives a request through it, *"the door writes `budget_min`"* is a claim about a string. That gap is filed, not patched here — a door-executing harness is a charter, not a hotfix passenger.

## 4 · WHAT THIS DELIVERY'S VERIFY DOES AND DOES NOT PROVE

**The verify line is a REGRESSION GUARD, NOT A PROOF.** `node --check` plus both benches confirm the cure broke nothing that was previously green. **They cannot confirm the cure works** — they were all green while the door was throwing, which is the entire content of §3.

**The founder's handset is the only true witness.** The incident closes on a top-band enquiry that lands, not on a green terminal.

**Declared, not claimed:** the floor is NOT run in this delivery's verify. The chair bent the form for speed on a live P0 and the founder held it — recorded as **c-37.4** so the exception reads as a decision and never as a precedent. The floor returns at the next ordinary delivery.

## 5 · SEQUENCE

apply chain → verify → **GUARD-GREEN** → git block → Railway deploy green → **handset re-send of the top-band enquiry** → paste back → incident closes.

## 6 · CARRIED FORWARD

**F-16.28** (the four-instrument miss and its vacuity class) and **F-16.29** (no door-executing harness) return to the chair for numbering against the band. Also standing from this arc: the name-column contact finding (a phone in a granted column defeats a column-keyed withheld set; four `public.leads` INSERT sites, none validating `name`), the `TDW-DEV440` routing token rendering in the conversation block, and **Walk B — unfired, not held**: its condition was met at `0dc5a27` and it waits on the founder's word.

**One sequencing error owned by this seat:** the walk card put the enquiry send at step 4, after the UI steps. The write path is the risky half and belonged first. The founder found this defect despite the card's order, not because of it.
