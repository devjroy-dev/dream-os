# TDW_05 — COUPLE-LANE MECHANICAL ARC · MOVEMENT M5 · HANDOVER
**Base `8560ca0`. §11 first motion clean. C6 / F-05.44. Deletions-pure, one disclosed exception.**

## 1. READ-FIRST ITEM (i) — R-M5-2 RE-VERIFIED AT MY OWN TIP
The chair's deeper derivation holds. Three call sites of either classifier export existed: `brideEngine.js:203` · `engine.js:158` (inside the orphan) · `engine.js:488`. **All three die in M5. Post-M5: zero callers of either export, estate-wide.**

## 2. THE DELETION TRIO
**Leg 1 — pre-delete grep-POSITIVE**, recorded in the §0.2 report and re-run here: `runAgenticTurn` (engine.js:43 def, :205 comment, four f0532 references) · `pending_lead_pings` (1 reader, 3 writers) · three classifier calls.

**Leg 2 — post-delete grep-ZERO**, asserted at `b05_arc_m5_bench` §1 over comment-stripped code: `runAgenticTurn` **0** · `classifyMessage(`/`classifyVendorMessage(` **0** · the two dead requires **gone** · the export shrunk to `{ runCoupleAgenticTurn }`. **ONE named residue, by design:** the tombstone comment at `engine.js:37` says the function *lived* there. Comment-only; the grep-zero claim is over executable lines, and §1.1 asserts it that way.

**Leg 3 — floor at the smaller world:** all 22 harnesses green (below).

**Deleted:** `runAgenticTurn` whole, `:43–:374`, **ask-gate included** · the couple classifier call + its log token (`engine.js:488`, the TURN survives) · the bride classifier call + its log token (`brideEngine.js:203`) · both dead requires. **347 lines removed, 32 added.**

## 3. THE DEFUSED ISLAND — R-M5-3, SHAPE (b) WIDENED
`classifier.js` **survives intact**: both exports, both bodies, the ambiguity limb whole — *the only home that logic has anywhere*. It gains **ONE labeled header**: zero-caller since M5, the ruling cited, and a **revival pointer** naming the ask-gate as the thing to rebuild with it. **That header is the movement's sole non-deletion delta** (§4.2 asserts it: `classifier.js` loses **zero** lines).

## 4. READER-ZERO — NAMED, NOT CURED (R-M5-4)
`pending_lead_pings`: **three live writers** (`engine.js:657`, `:749`, `:868`) and **ZERO readers** — the only reader lived inside the orphan. **No cure ships.** F-05.50's homing letter is an open founder letter; the cure belongs to whichever home he names. Asserted at §3.1 so the state is a fact on the record, not a sentence in a handover nobody re-reads.

## 5. THE FLOOR MOVE — `f0532`'s LABELED RE-BASELINE (the arc's ONLY, F4-ledger)
**COUNT: 11 → 9.** Two cells **retired by name**, one **re-baselined in place**, zero silently dropped.

**AND IT WAS BIGGER THAN THE RULING ANTICIPATED — disclosed, because R-M5-6 expected a labeling matter.** The bench's non-vacuity *rested on the classifier verdict being readable*:
- **`assertHaikuOnComplex` → `assertHaikuOnTheWire`.** Its second half demanded `(complex` in the log — evidence M5 deliberately stopped producing. Re-aimed, and **renamed**, because a function still claiming a verdict it can no longer read is the stale-comment class.
- **§1.2 (vendor wire) + its SITES entry + `driveVendor`: RETIRED BY NAME.** A cell guarding a function that no longer exists is a green over nothing.
- **§1.4's vacuity guard: RETIRED AND REPLACED, not dropped.** It drove a *simple* verdict and required the assertion to refuse it — because only a *complex* verdict proved the ceiling. **That evidence cannot exist post-M5** — CE-66's "demanded evidence that cannot exist", second instance. **What replaces it is stronger:** the ceiling was a branch that always chose Haiku; it is now the **absence of a branch**. §1.4 now asserts on the source that no conditional reaching `MODEL_SONNET` survives and no classifier call does either.
- **THE MUTANT RE-BASELINED.** The pre-cure byte was a ternary on `complexity` — a variable M5 deletes, so the old mutant **cannot compile**. It becomes `MODEL_SONNET` direct: the identical disease in the world that now exists. **A mutant that cannot compile is not a weaker mutant, it is no mutant at all.**

## 6. §4.1's LABELED AMENDMENT — R-M5-5, BOTH HALVES
Defect reproduced at a clean checkout first (`actual []`). Fixed as derived: **base pinned to `6acafd2` AND pathspec scoped** to the guarded soul/prompt set. Final pathspec: `miraSoul · brideSystemPrompt · circleSystemPrompt · coupleSystemPrompt · brideTools · brideOnboarding`. **Expected set: `src/agent/brideTools.js` + `src/agent/miraSoul.js`.** `loop.ts` leaves the assertion as the pathspec narrows; its comment death is asserted on its own at §5.1. **Count preserved.** The cell now says permanently: *since M4's base, the only soul bytes that changed are the two the founder approved.*

## 7. PROVEN
`b05_arc_m5_bench` **11/11**. **Floor at the smaller world — 22 harnesses, all rc=0:**
`m5 11 · m4 18 · m3 11 · m2 27 · m1 53 · crons 48 · sendwa 55 · webhookcore 11/11 · otp_meta 24 · b0498 58/58 · punct 17 · movementb 47/47 · transport 10 · m1b 4 · m2v 2 · prospect 47 · checker 101/101 · onboarding 27 · couple_soul 21 · f0532 9 (re-baselined) · b06_sonnet · b06_advisor`.
W-1: zero soul/prompt bytes (§4.1). `node --check` clean on all three touched sources.

## 8. NEXT
**M6 — the arc's last:** C9(a) one-writer consolidation · F-05.49 · F-05.51 · the ruled **reject-loudly** `resolveAgentForVendor` hardening.
