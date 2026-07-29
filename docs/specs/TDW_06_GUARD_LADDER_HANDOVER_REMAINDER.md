# TDW_06 — THE GUARD-LADDER REMAINDER (F-06.130's cure · M-3 · R-1) · EXECUTOR HANDOVER

**Base:** `dream-os @ 4877319` · `dreamos-pwa @ 811123c`, both re-derived at origin fetch-first.
**Delivery:** TWO ZIPs. **Apply order is binding: ENGINE FIRST, PWA SECOND** — the pwa client reads a `done.intercept` payload the engine must already be emitting, and the chip calls a route the engine must already be mounting.
**Scope shipped:** the enumerated remainder WHOLE — F-06.130's cure, M-3, R-1. Nothing declared out.

**Engine delta: FIVE files.** `src/api/vendor-engine/chat.js` · `src/lib/vendorInbound.js` · `src/lib/nudgeOptout.js` · `scripts/b06_gauntlet.js` · `scripts/b06_forkc_wireguard_bench.js` (+ this handover).
**W-1 SHUT, command-asserted:** `donnaSoul.ts` · `harveySoul.ts` · `consultantHarveySoul.ts` · `advisorLens.ts` · `loop.ts` · `donna.ts` **all 0-line.** `vendorMode.js` and `src/index.js` **0-line** (see §3(a)). **SQL NIL** — zero DDL, zero migration, zero founder-run SQL; every write lands in `engine.evals_runs` / `engine.evals_findings`, existing tables with existing writers.

**Pwa delta: FIVE files.** `lib/vendor/api/vendor.ts` · `hooks/vendor/useChat.ts` · `components/vendor/ChatThread.tsx` · `app/vendor/page.tsx` · `scripts/tdw06_m3_report_chip.proof.mjs` (new).

---

## 1. THE DISEASE, AND WHAT IT ACTUALLY WAS

`STAGE2_WA_REPORT = 'reply REPORT to flag this turn'` shipped with the M-2 engine half and `matchGlitchWord` had **zero instances in the tree**. A live vendor-facing promise with no mechanism behind it — F-04.27's own class, minted by the guard whose entire subject is claims that outrun their mechanism.

**Read-first found it was worse-shaped than the charter stated, and the chair ratified all four reports.** `_noRetry` is never true in production (`src/index.js:199` passes two arguments; the retry calls `runTurn` directly), so Fork D always runs, and the three outcomes resolve like this: outcome 1 nulls the line, outcome 2 shipped F3's bare sentence, outcome 3 (a retry that **threw**) was the *only* live path on which a vendor ever read the report word. **The affordance rode the rarest arm and the arm whose vendor most needed it had none** — F-04.27 inverted. That finding is what produced Slot Two.

Two further reports re-shaped the cure: `wireGuardSpecimen` does not call `recordEval` (it writes directly at `:1722`/`:1760`, so the guard's one writer is this file — correction №8), and `stage2_delivered` is a **classification echo**, written pre-Fork-D with `forWhatsApp=false`, non-null even when the retry landed the act, and shadowed by the retry's own second row (correction №9). A catcher keyed on it would file against turns no vendor ever saw a glitch line for.

---

## 2. WHAT SHIPPED, BY RULING

| ruling | what landed |
|---|---|
| **FORK 1 → 1b** | `matchGlitchWord` — the **real** nudge tokeniser at length one, punctuation-stripped, case-insensitive. `REPORT` · `report` · `Report.` · `Report!` land; `send me the report for last week` · `REPORT NOW` · `reporting` fall through to a real turn. |
| **FORK 2 → 2a** | the branch is **pre-engine**, sited third in the word trio at `vendorInbound.js`. No model call, no cost. The escape hatch does not depend on the thing it exists to escape. |
| **FORK 3 → 3a** | `wireGuardSpecimen` returns `run_id` on the persisted path only; `stage2RecordDelivery` **patches** the specimen row at Fork D's resolution with `{arm, delivered, seat, at}`. One row per event. The classification echo survives beside it, untouched, and is documented in-file as never-a-witness. |
| **FORK 3-K1 / 3-B** | `agent_id` additive into `transcript`; `REPORT_WINDOW_MS = 24h` as a named constant at one home. Newest **delivered** witness for this agent inside the window, else Slot One. |
| **FORK 4 → 4a** | V-W travels to outcome 2, read from its constant, never retyped. `undoContract.js` **0-line** — 4c stays convicted (its bytes feed `translateBeat` live to a screen with no reply wire). |
| **FORK 5 → 5c** | the smoke card's route step is deterministic; the chip tap is marked CONDITIONAL in the founder's own language. |
| **FORK 6 → 6b** | `fileGlitchReport` is the ONE home. Both legs call it; neither posts an id. |
| **FORK 7 → 7b** | `excludeFromLaneVerdict: true` declared at S5, read at the one load-bearing site; the census line still prints; the dead `:2083` accumulation named in-file. |
| **M-3** | the four touches + the chip on **its own prop** (never `onChipTap`, which is `send`). |

**Copy, founder-vetoed 「 accept all 」, byte-exact:** Slot One `Nothing recent to flag here — tell me what looked off and we'll go from there` · Slot Two the V-W travel · Slot Three `Flagged — that turn's on file now.` · Slot Four `REPORT THIS GLITCH` · Slot Five **no bytes** (dim + disable). **F-06.85 binding executed as acceptance:** Slot One's in-comment names `findDeliveredWitness` and `REPORT_WINDOW_MS` — the sentence is an absence assertion and may only ship on a real read, and the comment forces the mechanism's next sitting to re-read the line. Asserted as a cell.

**FAIL-HONEST, added on the mutation floor's evidence:** if the finding write does not land, the vendor is **not** told it was filed. A false "Flagged" would be this sitting's own disease shipped by its cure.

---

## 3. FOUR DEFECTS OF MY OWN, FILED NOT PAPERED

**(a) A SITING I CHOSE ON SYMMETRY AND THE EVIDENCE OVERTURNED.** `matchGlitchWord` first went into `vendorMode.js` beside `matchFreshWord` and reached the door through the `deps` object its two siblings use. That reddened **five sealed benches at once** with `matchGlitchWord is not a function` — every bench that drives the real `processVendorInbound` builds its own deps object and none carries a key that did not exist when it was written. CE-59's both-sides clause arriving as a red. Re-sited to `nudgeOptout.js`, where `_tokens` already lives and where `matchNudgeWord` — the precedent this cure cites — is **required directly at `vendorInbound.js:32` and has never been a dep**. The deps contract is byte-identical to origin, `vendorMode.js` and `index.js` are 0-line, and no sealed bench sees this movement. **Asserted as a cell (§12.3) so it cannot regress.**

**(b) F-06.132 — A SEALED CELL HAS BEEN VACUOUS SINCE IT WAS WRITTEN, AND IT IS NOT MINE.** `§11.6`'s `forkD` slice ran from `'FORK D — THE RETRY-THE-ACTOR LEG'` to the **first** `const twilioMsg` — which lives in the mode-word branch **thirty thousand characters above it**. `end < start`, so `forkD` is the empty string and the "the bound became a counter" assertion has been asserting a negative over nothing. **Derived at ORIGIN `4877319` before I touched the file**, so it is a pre-existing defect this movement found, not one it caused. F-06.111's own class, inside the bench that ships Fork D's structural bound. Cured by re-anchoring on the send that actually follows Fork D, **and the slice's non-emptiness is now asserted first** — a slice that silently empties can never again pass as a proof.

**(c) A HOLLOW CELL OF MINE, CAUGHT ONLY BY THE MUTATION FLOOR.** Mutation M6 killed the fail-honest clause — a refused finding-write still telling the vendor "Flagged" — and the bench came back **GREEN 100/100**. §12.6 tested the happy path and the no-witness path and left the failed-write path uncovered. §12.6b added; M6 now reds 99/100. **Third time this arc the mutation floor has caught what an eye passed.**

**(d) TWO ANCHOR MISSES IN MY OWN NEW CELLS, re-run correctly rather than counted.** §12.10's first cut counted `run_id: data.id`, which also appears as the findings rows' foreign key — an anchor that did not ask its own question; re-derived against the five actual early-return shapes. §12.9 inherited (b)'s empty slice. A mutation or anchor that did not apply is not a proof.

---

## 4. PROOF

**`b06_forkc_wireguard_bench` 83 → 100**, with **four labeled amendments, every count preserved**: §5.3, §5.8b (the signature gains `agentId` additively; R-10's subject — one function, both doors — untouched), §7.5 (re-sliced onto the specimen writer's **own** body, because the new machinery landed inside the old region's slice and a raw insert-count there stopped asking about the writer; ZERO DDL re-asserted over the whole new region), and §11.6 (F-06.132).

**Eleven mutations of PRODUCTION code, each `cmp`-restored byte-identical, post-restore GREEN 100/100:**

| # | mutation | result |
|---|---|---|
| 1 | the matcher's length bound removed | RED 99/100 |
| 2 | the matcher goes case-sensitive (1c, refused) | RED 99/100 |
| 3 | the lookup drops the AGENT filter | RED 99/100 |
| 4 | the lookup drops the 24h window | RED 99/100 |
| 5 | the lookup gates on the classification echo | **RED 97/100** |
| 6 | fail-honest killed — a refused write reports "Flagged" | **first GREEN → §12.6b added → RED 99/100** |
| 7 | Slot Two reverted, outcome 2 loses the affordance | RED 99/100 |
| 8 | the delivery witness inserts a second row (3b, refused) | RED 99/100 |
| 9 | R-1 removed, the foreign seat decides the lane | RED 99/100 |
| 10 | R-1 keyed on the id string (7a, refused) | RED 99/100 |
| 11 | an id rides a return that never wrote a row | RED 99/100 |

**Pwa: `tdw06_m3_report_chip.proof.mjs` ALL GREEN**, six mutations all RED, each restored byte-identical. §3 **extracts the shipped `text` ternary from source and runs it** against five states, with the **pre-cure expression reproduced beside it and asserted to keep the costume on screen** — that return is the disease, and the proof fails if it returns.

**Sealed floor at my own hand, both repos, counts disclosed:**
guard **83→100 (disclosed growth)** · selftest **351/351** · relay 40 · m0 50 · m1 45 · m2 43 · m3 37 · m4 33 · m4b 24 · m4c 20 · m4d 16 · f0658 20 · f0667 16 · f0681 17 · f0692 23 · advisor 16 · advisor_route 16 · 0081 12 · sonnet 13 · donna_cache 16 · b0461_p6 25 · b6_floors 47 · b6_s1 24 · b6_sitting2 22 · door_rider 15 · f0550 31 · arc_m2 27 · arc_m4 18 · arc_m5 11 · wa_words 19 · **meter 28/29 KNOWN RED (F-06.41), carried, not this sitting's.** Every other count byte-stable. `node --check` clean on all five touched `.js`. **dreamos-pwa: `rm -rf .next` then whole-tree `tsc --noEmit` ZERO errors.**

**Disclosed method:** the guard bench's §1.4 reads the COMPOSED cached prefix and fails honestly on an unbuilt tree ("engine dist absent — run npm run build"). Run `npm run build` before the floor; a count taken on an unbuilt tree is how a wrong number becomes a handover sentence.

---

## 5. THE FOUNDER SMOKE CARD

You only perform and paste. I read the evidence. **Steps 4–6 are marked honestly: step 4 depends on the model actually fabricating, which is 2-for-4 on this estate's record.**

1. Open the app at `/vendor`. Look at the meter under the chat box and **paste what it says.** *(If it reads capped, stop — the guard cannot run and nothing below fires.)*
2. On WhatsApp from your vendor number, send exactly: `REPORT` — **paste his reply.** *(deterministic)*
3. On WhatsApp, send exactly: `Report.` — **paste his reply.** *(deterministic; proves the punctuation breadth)*
4. On WhatsApp, send exactly: `send me the report for last week` — **paste his reply.** *(deterministic; this must be a normal Victor turn, NOT the flag line)*
5. In your Codespace terminal, run the block below and **paste the output.** *(deterministic — this proves the app's Report button end to end without needing Victor to misbehave)*
6. On WhatsApp, send exactly: `Unblock 18 December.` — **paste his whole reply.** Send the same message up to **four times**, pasting each. **This one may simply not fire** — it depends on the model fabricating, and it does that about half the time. Four tries is the plan, not a failure if nothing appears.
7. **ONLY IF** one of step 6's replies is a glitch line: reply `REPORT` to it and **paste what comes back.**
8. **CONDITIONAL, and it may wait for another day:** if a **REPORT THIS GLITCH** button ever appears under a reply in the app, tap it once and **paste what the screen does.** The button's wiring is proven at the bench; this is the live witness, and it walks on the first real interception rather than on a night spent hunting one.

**Step 5's block** — set your token first, then run. The token is referenced, never printed:

```
export TDW_TOKEN='paste-your-vendor-session-token-here'
curl -s -X POST https://api.thedreamwedding.in/api/v2/vendor/chat/glitch-report \
  -H "Authorization: Bearer $TDW_TOKEN" -H 'Content-Type: application/json' -d '{}'
```

Expected on a quiet account: `{"ok":true,"filed":false,"message":"Nothing recent to flag here — tell me what looked off and we'll go from there"}`.

**Card reconciliation, per CE-59:** steps 1–5 deterministic, each with a derived thumb-path · step 6 **probabilistic at 2-for-4, named in advance** · step 7 conditional on 6 · step 8 conditional and explicitly allowed to wait. **No step is written as if it had a path it does not have.**

---

## 6. STANDING AT THIS DELIVERY

`WIRE_GUARD_STAGE2=off` still disarms everything at call time — one Railway variable, no code change, no ZIP. The tripwire law rides the seal: **one false interception is a STOP.** The first live week remains continuing measurement, and every interception now records **what the vendor actually received** rather than what was classified, so the weekly read finally sees what he saw.

**Minted this sitting:** F-06.131 (the copy inventory short by the cure's own success paths) · **F-06.132** (§11.6's empty slice — and the async-cell sweep chartered at M-1 is still open; this is a second harness defect found by hand, which argues the sweep is overdue).

**Live verdicts are the FOUNDER's and Evening Six's — declared here, never claimed.**
