# TDW_06 — F-06.97: THE TOUCH-ORDERED, ARRIVAL-WORDED ESTATE · EXECUTOR HANDOVER
## The estate ordered three surfaces by movement and worded all three in arrival

**Base:** `a512c37` (re-derived at origin, fetch-first, at the first motion; code-identical to `dc62692` — verified by command, `git diff --name-only dc62692 a512c37` returns docs only).
**Role:** LE / executor, code-capable. **Repo:** `devjroy-dev/dream-os` alone.
**Authority:** the thirteenth chair's F-06.13 kickoff (2026-07-28) + chair rulings **R-1..R-4** on the read-first.
**Delta:** `src/engine/src/core/tools/donnaFind.ts` · `src/engine/src/core/donna.ts` · `src/engine/src/core/snapshotTypes.ts` · `src/engine/src/core/tools/recordPrimitives.ts` · `scripts/b06_gauntlet.js` · this document. **Nothing else.**

**W-1 HELD SHUT — command-asserted, all 0-line:** `donnaSoul.ts` · `harveySoul.ts` · `advisorLens.ts` · `consultantHarveySoul.ts` · `loop.ts` · `leads.js` · `scrub.js`. **`DONNA_STATIC_PREFIX` and `DONNA_SOUL` byte-unchanged — the cache window is NOT invalidated by this delivery** (asserted as cell ⑦.2).
**No SQL, no migration, no env var, no dashboard act.** One existing column joins three existing SELECTs; `engine.records.updated_at` is witnessed at `docs/db/ENGINE_SCHEMA.md`, `## engine.records · 21 columns`, entry 14.

This document carries **no CE number**, touches **no FINDINGS_LOG entry** and **no masterplan row** — those are the chair's (clobber law). The chair cuts the log entry from this handover.

---

## 1 · WHAT SHIPPED

### The disease, derived by command before a line was written

Three breadth surfaces are `.order('updated_at', { ascending: false })`:

| Surface | Orders by | Selected `updated_at`? | Said it? |
|---|---|---|---|
| `donna.ts:114` — the snapshot rebuild Harvey pre-loads every business turn | `updated_at`, limit 12 | **NO** | **NO** — rendered `— filed <arrival>` |
| `donnaFind.ts:449` — the matched read | `updated_at` | **NO** | **NO** |
| `donnaFind.ts:473` — the zero-match recents | `updated_at` | **NO** | **NO** |

The full census of `updated_at` in `src/engine/src/core/`: **read as an ORDER key at four sites, RENDERED at exactly one** — `donnaBench.ts:207/:209`, `donna_history`, **one whole binder at a time**.

So *"who's active"* sat in the ordering of three surfaces and the words of none — and the only hand in the estate that could speak movement returned, per read, the full money row, the payment status, the phone, the diary and up to fifty event lines. **That is the structural hunger under F-06.13's eight-binder fan-out: eight financial dossiers hauled out to answer a question whose real subject was eight timestamps.**

This file's own comment already wrote the law for it, at `donnaFind.ts:23`, about the arrival clock: *"Donna was handed the answer in the ORDERING and denied it in the WORDS, because an ordering is not legible as information."* **M-1/P1 cured that for arrival. Touch stayed dark.** F-06.21's disease, one field over.

### The cure — R-2's 1(a), R-3's scope

`touched <dd-mm-yy HH:MM IST>` through the estate's one derivation (`arrivalStamp`), on:

1. **`recognitionRow`** (`donnaFind.ts`) — the hunger's true site: the recents dump IS the shape answer's whole material.
2. **`describeRow`** (`donnaFind.ts`) — **joined by R-3's derivation rule**, because the placement cost on every pin measured **zero** (below).
3. **the snapshot line** (`donna.ts`, `stampOf`) — the largest breadth surface in the estate, plumbed through `SnapshotItem.touched_at` (optional, on `arrived_at`'s own contract) and `recordItem`.

**§2.4-CLEAN BY CONSTRUCTION.** A timestamp is a **recognition** field, never an enrichment one — M-4 already ruled a stamp onto this exact line for exactly this reason (`donnaFind:188` — *"on a recents dump WHEN is load-bearing"*). **Zero money, zero phones.** No new donor pool; F-04.70's contagion axis is untouched, asserted twice: once as `b06_m4_bench:343`'s **own predicate** run against the shipped body, and once against the **live payload** of a real `executeFindTool` call.

### PLACEMENT WAS A DERIVATION, NOT A PREFERENCE (CE-94's precedent, applied)

`b06_m1_bench:254` and `:255` pin `recognitionRow` and `describeRow` with **windowed** regexes that **END on the `filed` push**. Appending the movement push *after* that push leaves both pins matching **byte-exact**, so **neither bench needs an amendment and neither count moves**. Any other placement amends them. Asserted as cells ④.1 and ④.2 **using the pins' own regexes**.

Same rule applied at the snapshot: the stamp renders **inside `stampOf`**, never as a second interpolation, so `b06_m1_bench:272`'s pin on `` lines.push(`- ${it.text}${stampOf(it)}`) `` is byte-untouched (cell ⑤.2).

### ALWAYS RENDERED, NEVER CONDITIONAL — the fork priced and declined in the open

A conditional stamp (print `touched` only where it differs from `filed`) was the first draft: terser, and it prints only where movement exists. **DECLINED, and the reason is in-file.** It manufactures precisely the defect **F-06.30** was filed for — a designed silence the payload never declares. A line with no `touched` would mean *"never moved"*, which is a real claim about the cabinet, and nothing on the page would say so. Symmetry costs ~26 characters a line and owes no explanatory sentence; the silence would have owed one.

### ONE STRING MOVED — DISCLOSED AS RATIFY-OR-REVERT

`RECOGNITION_WITHHOLDING_TELL` enumerates what the recognition line carries. The line now carries movement, so the enumeration was false the moment the stamp shipped — **F-06.60's family (a paper misstating its own payload) and F-06.85's law both**, inside the very tell that exists because an undeclared payload shape gets read as the record's own emptiness.

| | Bytes |
|---|---|
| **Before** | `WHAT THESE LINES DO NOT CARRY: they are recognition only — name, stage, arrival. ` |
| **After** | `WHAT THESE LINES DO NOT CARRY: they are recognition only — name, stage, arrival and movement. ` |

**Three words. Only the enumeration moved.** Every clause `b06_m4_bench` §5.3 pins — *"Money and phone numbers are deliberately NOT rendered"*, *"cannot tell you whether a budget is on file"*, *"none with a budget stated"* — is **byte-unchanged**, and m4 stayed 33/33 with zero amendments. **Ratify-or-revert; the founder's retroactive veto costs one payload string.** (R-4 ruled no separate veto owed for `touched` itself under the 「 ddmmyy locked 」 precedent; this edit is disclosed here because it is a *previously-shipped* string and R-4 did not name it.)

### R-2's OTHER FORKS, AS RULED

- **1(b) DECLINED-WATCHED** — `donnaBench.ts` is **0-line** this delivery. The description was not re-worded.
- **1(c) REFUSED** (the executor's refusal, chair-ratified) — **`donnaSoul.ts` is 0-line.** The temperature-of-the-week law at `:66–:67` is byte-present and byte-unchanged, asserted as cell ⑦.1. **This sitting fed that law a paper; it did not re-author it.** On the movement reading the law was *unsatisfiable* against the estate's payloads — CE-94's exact shape, and re-authoring an unsatisfiable law is CE-78's three burned diagnoses re-run.
- **1(d) DECLINED** — no mechanical cap. **The N-deep-reads floor CE-25 HELD stays held**, asserted as cell ⑥.3.

---

## 2 · PROOF

**`gauntlet --rig-selftest` 311 → 330** (+19, all in the new section **[29]**; every pre-existing cell green and **unamended**).

**Both-ways, SIX mutations of SHIPPED code — never test setup — each run out-of-process with `npm run build`, the tree `cmp`/`diff`-restored after each, reds enumerated:**

| Mutation | Result |
|---|---|
| **M-A** — `recognitionRow`'s movement push deleted (the uncured recognition line) | **327/330 — 3 RED**: ②.1, ②.2, ③.1 |
| **M-B** — `updated_at` removed from `FIND_SELECT` | **329/330 — 1 RED**: ①.1 |
| **M-C** — the snapshot's touched clause stripped from `stampOf` | **328/330 — 2 RED**: ④.3, ⑤.1 |
| **M-D** — `describeRow`'s movement push deleted (the matched path uncured) | **329/330 — 1 RED**: ②.3 |
| **M-E** — `recordItem`'s `touched_at` wiring removed | **329/330 — 1 RED**: ⑤.3 |
| **M-F** — the tell's enumeration reverted to its pre-cure words | **329/330 — 1 RED**: ③.3 |

**M-A + M-C + M-D together ARE the uncured tree**, and it fails on exactly the cures. Tree restored byte-clean after the set (`diff -r` against a pre-mutation copy: identical; selftest 330/330).

**⚑ ONE HONEST LIMIT ON M-B, DECLARED, NOT PAPERED OVER.** The rig's db double returns whole row objects and does **not** enforce a `.select()`. So M-B reds only the **source pin** (①.1), and cell ② stayed green under it. **The live payload's dependence on the widened select is therefore NOT desk-witnessable** — it is a source-pin claim, and it is stated as one rather than counted as behavioural coverage.

**THE SEALED FLOOR, every count run by command at the cured tree:**

```
b06 m0 50 · m1 45 · m2 39 · m3 37 · m4 33 · m4b 24 · m4c 20 · m4d 16
f0658 20 · f0667 16 · f0681 12 · f0692 23 · advisor 16 · advisor_route 16 · 0081 12
sonnet 13 · donna_cache 16 · b0461_p6 25 · b6_floors 47 · b6_s1 24 · b6_sitting2 22
b6_door_rider 15 · b05 f0550 31 · arc_m2 27 · arc_m4 18 · arc_m5 11
gauntlet --rig-selftest 330/330   (was 311; +19, section [29] — the disclosed growth)
KNOWN RED, not this sitting's: b06_meter_bench 28/29 (F-06.41), carried loudly
```

Beyond the list, run anyway because `donnaFind.ts` and `recordPrimitives.ts` are hot files: `b05_arc_m1` **53** · `arc_m3` **11** · `arc_m6` **20** — all green.

**LABELED FLOOR AMENDMENTS: ZERO.** Not one pre-existing cell was amended, re-pinned or re-aimed. The two windowed pins that were the named adjacency at read-first (`b06_m1_bench:254`/`:255`) survive **because the placement was derived against them**, not because they were softened.

**SKIPPED, NAMED (floor-method law):** live gauntlet lanes — founder's keys, live-lane. Block 04 bench families and `checker_bench` — not run; no shipped byte reaches their surfaces. A declared judgement, not a claim of coverage.

**Engine gates:** `tsc -p src/engine/tsconfig.json` clean, **zero errors**. `npm run build` green.

**The six deletions, enumerated not counted:** three SELECT widenings (`donna.ts`, `donnaFind.ts`, `recordPrimitives.ts`), the two-line `stampOf` arrow→block rewrite, and the one tell-enumeration line disclosed above. **Nothing unruled hides in the number.**

---

## 3 · THE LIVE VERDICT IS OUTSTANDING — stated plainly

**No bench in this ZIP witnesses the model taking the week's temperature more accurately.** No desk cell can: whether a legible movement stamp changes what Victor and Donna *choose* is a model behaviour.

**And SD-WEEK cannot supply that verdict either, for a reason derived at read-first and worth restating here:** every derivable live SD-WEEK record at this tip is **GREEN** — three lanes at CE-25's evening on `c2e21b1`, again on the founder's phone post-deploy, three lanes again at `5ea0153`, and **PASS on L3 at Evening One** (the gauntlet's own `:532`/`:3110`). SD-WEEK's next run can only **fail to contradict** this cure; it cannot confirm it. **The honest verdict surface is whether a shape answer becomes movement-accurate — DECLARED the next run's, never claimed.**

---

## 4 · WHAT THE FOUNDER MUST DO — and what he must not

**Dashboard/console acts: NONE.** No env var, no Railway change, no Meta change, no SQL. This sitting reads no new table and writes none.

The apply block, the verify line and the git line ride the chat message this ZIP came with. The verify line ends in the D-10 STOP; the git line is its own paste-block. **Do not run the git line over a red verify.** The verify's `npm run build` step rebuilds the engine — four engine TS files moved, and the gauntlet refuses to run distless by design.

**Live witness: none this sitting**, by the kickoff's own acceptance. Declared, not claimed.

---

## 5 · FINDINGS FILED THIS SITTING (unnumbered, per the law — the chair mints)

1. **F-06.85'S OBLIGATION IS OWED IN THE DIRECTION W-1 SHUT.** `donnaSoul`'s temperature-of-the-week law is now **conditioned on this mechanism** — it tells her she knows who is moving *"without opening a single thing"*, and until this commit no breadth payload could tell her who had moved. F-06.85's law requires that soul sentence to **name its mechanism in-comment** so the mechanism's next sitting is forced to re-read it. **W-1 was shut, so I could not write it.** The pointer is written on the mechanism's side instead (`donnaFind.ts`, the F-06.97 block) and the reverse pointer is filed here as owed. It is one comment in a protected file; it needs a ruled opening, not a build.
2. **THE DOUBLE DOES NOT ENFORCE A SELECT, AND THAT SHAPES WHAT M-B PROVES.** Disclosed in §2 rather than absorbed. Any future cure whose whole substance is a widened `.select()` should know that the desk cannot witness it — the source pin is the floor there, and calling it behavioural coverage would be a hollow green.
3. **THE ENQUIRY RECOGNITION LINE WAS DERIVED AND CORRECTLY LEFT ALONE.** `searchLeads` orders by `created_at` (`donnaFind:311`) — **arrival-ordered AND arrival-worded**. It does not carry F-06.97's disease, so it is out of scope by derivation rather than by omission. `public.leads.updated_at` exists (witnessed, column 17) if the chair ever wants movement there; nothing argues for it today, and adding it would have been a labeled amendment to `b06_m1_bench` §4.4 (*"gained the date AND NOTHING ELSE"*) bought for no information.
4. **`donnaBench.ts` STAYED SHUT WITH THE FINDING OPEN.** 1(b) was declined-watched; the file is 0-line. Named so the restraint is on the record as deliberate — the scope law outranks the convenience of an adjacent file, the F-06.95 precedent from the last sitting.

---

## 6 · WHAT THE NEXT SITTING PICKS UP

Nothing from this one. The board, founder-sequenced: **F-06.84** → the evenings. **F-06.13 stays open-WATCHED** with the corrected record per R-1 — cured soul-only at CE-25, the mechanical floor deliberately HELD, no post-cure firing derivable, current-era live status `[GAP]` under CE-90/§9.6; its closure rides the same evening greens as everything else. **F-06.83** and **F-06.95** stand on the board untouched.

The clock is at ZERO; nothing in this sitting moves it. Sequencing is the founder's.
