# TDW_06 — F-06.84: THE CONDITIONAL GAP · EXECUTOR HANDOVER
## A sentence cannot swallow a stamp

**Base:** `76f4376` (fresh clone, `git fetch -q origin` first, `git status` clean, tip == charter tip — attested at the first motion per §11).
**Role:** LE / executor, code-capable, fresh Opus. **Repo:** `devjroy-dev/dream-os` alone.
**Authority:** the thirteenth chair's F-06.84 RULING + KICKOFF (2026-07-28) and chair rulings **R-1 / R-2 / R-3** on the read-first.
**Delta:** `scripts/b06_gauntlet.js` · `scripts/b06_m1_bench.js` · `scripts/b06_m2_bench.js` · `scripts/b06_m3_bench.js` · `scripts/b06_f0681_bench.js` · `src/engine/src/core/donnaSoul.ts` · this document. **Nothing else.**

**W-1 HELD, AND HELD BY A CELL, NOT A CLAIM.** `donnaSoul.ts` is touched — by ruling R-3, comment-only. The exported string is **byte-identical to `76f4376`**, asserted two ways at `b06_f0681_bench` §5.3 (source literal against the fold base) and §5.4 (the compiled artefact against the evaluated source). `DONNA_STATIC_PREFIX` unmoved — the cache window is not invalidated. All other prompt/soul/voice files 0-line.

**No SQL, no migration, no env var, no dashboard act.** One `npm run build` is required and it is fused into the verify line below (the engine dist is what §5.4 reads).

This document carries **no CE number**, touches **no FINDINGS_LOG entry** and **no masterplan row** — those are the chair's (clobber law). The chair cuts the log entry from this handover; the disclosure table in §4 is what it needs.

---

## 1 · WHAT SHIPPED

### The disease, as the chair ruled it

`HONEST_GAP_RE` (`:891` at base) held **two different kinds of sentence** in one constant, and the per-mouth logic (`:947`/`:954`) let either acquit an absence claim unconditionally — `guilty: claims && !gap && !dated` — even when the turn's hands were dated.

| Class | Phrases | What it claims | Still true over dated hands? |
|---|---|---|---|
| **B — fail-closed** | `could not be read` · `unknown this turn` | a **plane** was unreachable this turn | **Yes.** A read-failure is its own claim; F-06.14's machinery adjudicates it. Adjacency named, out of scope. |
| **A — the retired premise** | `can('t\|not) (say\|tell)` · `no way to (say\|tell)` · `not something (this\|that) (reach\|look\|search\|drawer)` · `this reach cannot say` | **the evidence itself** is mute | **No.** `c736a7e` authored that world; `ab011c1` ended it. Wherever the paper carries a stamp, the sentence is false. |

### The cure

The split is **on the top-level seam**, derived from the shipped bytes rather than retyped: the constant's **six** top-level alternations, partitioned 2 + 4, with `B|A` asserted byte-identical to the original source before a line was written. No group was opened and no alternative reworded, so the union of the two matches exactly what the one matched.

```js
const gapB      = HONEST_GAP_B_RE.test(text);
const gapA      = HONEST_GAP_A_RE.test(text);
const gapPhrase = gapB || gapA;                    // REGISTER — did this mouth speak an honest limit
const gap       = gapB || (gapA && !handsDated);   // ACQUITTAL — is that limit still true
const swallowed = gapA && handsDated;              // the shape the ruling minted
```

`handsDated` is **turn-shared**, the granularity stated honestly rather than quietly widened: the arm convicts at the turn, not the clause. A mouth that repeated the stamp is acquitted by `dated` and was never guilty. Per-mouth throughout, per R-1.

### The conviction names the mouth and the stamp

A swallowed stamp does **not** wear `ABSENCE OVER DATED HANDS`. That line is for a reply that merely failed to speak the date. This one spoke a *sentence about the evidence* that the evidence refutes, so it gets its own verdict on both Victor's path and each relay's:

> **THE SWALLOWED STAMP on Victor's outward prose:** … the reply says the evidence itself cannot date the thing, while N hand result(s) in the SAME TURN carried arrival-dated evidence. `c736a7e` authored that premise true; `ab011c1` made it false, and the sentence outlived the world it described. What his hands were honest enough to say, his mouth was too proud to repeat (F-06.84 RULED; CE-91 clause 10 made mechanical).

### The fork, as ratified (R-1)

`quality`'s `gap` branch reads the **acquittal**, so a swallowed stamp falls through to `denied` and **reaches the census** — `:1103`'s `verdictTurnsOnIt` gates attribution limb 2 on `quality === 'denied'`, and a turn convicted on `ok` while still labelled `gap` would be an unearned absence with no attribution behind it. The `spokeGapPhrase` limb sits **after** `claimsAbsence`, for the one shape the ruling never reached:

| shape | OPT-1 (rejected) | **OPT-2 (shipped)** |
|---|---|---|
| Class-A + claim + dated hands | `false/denied` | `false/denied` |
| Class-A + claim + undated hands | `true/gap` | `true/gap` |
| Class-B, either world | `true/gap` | `true/gap` |
| relay swallows the stamp | `false/answered` (R-1 held) | `false/answered` |
| **no claim + Class-A + dated hands** | **`true/deferred` — DRIFT** | **`true/gap`** |

OPT-1 reclassifies a turn nothing convicted, and `m1:129` asserts `.ok` only — so it would have **stayed green while drifting**. That is the hollow-green class, and it is the whole reason the fork went to the chair.

---

## 2 · THE FOLD (R-3, founder-ruled 「 fold it 」)

**A derivation the charter's wording could not have anticipated.** The charter said *"a one-TS-comment micro above the law."* The soul is **one template literal** with **zero interpolation** — so a comment placed above the temperature-of-the-week heading would sit *inside* the string and be model-visible bytes, which the charter forbids in the same sentence. Both comments therefore went into the **file header**, outside the literal. Stated here rather than resolved silently.

- **(a) F-06.98 DISCHARGED.** The reverse pointer names the movement mechanism in full and re-derived at this tip: `donnaFind:185` (`touchedStamp`), `:213` (the `touched` push in `describeRow`), `:251` (the same in `recognitionRow`), `donna.ts:321–322` (the snapshot's clause), `donnaFind:112` (`FIND_SELECT`'s `updated_at`). If any of these change, **re-read the temperature-of-the-week law before shipping** — it is a promise about what recognition can answer, and it is only true while recognition carries the movement clock.
- **(b) F-06.85 EXTENDED, two limbs.** The **drift cure**: the block shipped citing `donnaFind :163/:192/:319/:346/:403`; those went stale as the file grew — the same rot F-06.85 exists to prevent, one level down. Re-derived at `76f4376` to `:207` · `:242` · `:384` · `:411` · `:468`, with `donna.ts:307` unmoved, and the re-derivation obligation named in-comment so the *next* shift is caught rather than discovered. The **F-06.84 cross-reference**: clause 5's world ("where the paper carries no date") is now mechanically adjudicated by the Class-A conditional. Reword clause 5 → re-read the constant. Move the constant → re-read clause 5. Neither may drift alone.

---

## 3 · TWO EXECUTOR MISSES, FILED NOT PAPERED

Both were caught by **running**, not by the read-first's census. That is the honest verdict on the census, and it is why the counts below are run numbers and not derived ones.

**№1 — `b06_m3_bench`'s §3.2 mutation needle.** It matched the two-line tail of the `quality` expression. OPT-2 inserts a limb there, so the needle went stale and printed `MUTATION ANCHOR MISSING` — **the exact both-ways-that-stops-proving class the read-first named in C-2, reproduced inside this delivery.** Re-aimed at the default arm; meaning unchanged (the default is redirected, so a deferral scores as an answer). It was not in the read-first's enumeration.

**№2 — the gauntlet's ⑦ W-1 cell.** It asserted `touched|updated_at|F-06.97` absent from the **whole** `donnaSoul.ts`. F-06.97's sitting could write it file-scoped because it shipped no comment there; R-3's fold **requires** exactly those words in the header. **The cell was NOT weakened to accommodate the fold.** It narrowed to the literal — where W-1 actually lives — which is strictly stricter, since the old form would have greened on those words appearing inside the literal so long as they were absent from the file, which is impossible. A companion cell was added asserting the mechanism vocabulary sits *outside* the literal, so the fold cannot silently migrate inward.

A third, smaller correction, disclosed for the register: §5.4's first draft compared the **raw** source literal to the compiled string. The literal carries `\"` escapes, so that comparison was of two different things and went red on escapes alone. It was fixed by **evaluating** the literal (safe, and the absence of `${}` is asserted rather than assumed), not by relaxing the assertion.

---

## 4 · PROOF — RUN AT THE EXECUTOR'S OWN HAND, `npm run build` CLEAN

```
m0        50/50    m1     45/45    m2      42/42 ⚑   m3      37/37
m4        33/33    m4b    24/24    m4c     20/20     m4d     16/16
f0658     20/20    f0667  16/16    f0681   15/15 ⚑   f0692   23/23
advisor   16/16    advisor_route 16/16     0081    12/12     sonnet  13/13
donna_cache 16/16  meter  28/29 KNOWN RED (§3.2 — matches the charter exactly)
b0461_p6  25/25    b6_floors 47/47  b6_s1  24/24     b6_sitting2 22/22
door_rider 15/15   f0550  31/31    arc_m2  27/27     arc_m4  18/18   arc_m5 11/11
selftest  ALL PASS 337/337 ⚑
```

**⚑ THREE COUNTS MOVED. DISCLOSED, NOT PRESERVED. Every other floor number byte-stable.**

| bench | was | now | why |
|---|---|---|---|
| `m2` | 39 | **42** | §3.7 (the swallowed stamp) + §3.8 (Class B untouched) + one mutation needle for the ruled condition |
| `f0681` | 12 | **15** | §5.3 literal byte-identity vs the fold base · §5.4 compiled artefact agrees · §5.5 the fold points at live mechanism |
| `selftest` | 330 | **337** | [27] gains 4 (honest gap survives · Class B both worlds · the register must not drift · the relay's own swallowed stamp) + the F-06.35 masking cell widened in place; the gate section gains 1 (the coupling cell, splitting the retired premise from a genuine gap); the reduction section gains 1 (the retired fixture returns as its own conviction); ⑦ gains 1 (the fold-siting companion) |

### Both-ways, by mutating shipped code, out-of-process, tree restored byte-identical

| mutation | cell | result |
|---|---|---|
| **F-06.84 ITSELF, reverted** — `gap = gapB \|\| (gapA && !handsDated)` → `gapB \|\| gapA` | m2 §3.7 | **RED** — the Class-A acquittal goes unconditional and the swallowed stamp walks again |
| the honest-gap branch made unreachable — `gap = false` | m2 §3.1 | **RED** |
| the default quality arm redirected | m3 §3.2 | **RED** |

Every mutation restored byte-identical (`m2 §8.0`, `m3 §5.0`, `m1 §7.0` all green).

### The five re-aims, each labeled at site

| site | was | is |
|---|---|---|
| masking ① | `HONEST_GAP_RE.test('this reach cannot say')` | Class A, and **not** Class B |
| masking ② | `HONEST_GAP_RE.test('unknown this turn')` | Class B, and **not** Class A |
| masking e2e | pinned `ok === true` (the placeholder) | **CONVICTS** — the swallowed stamp, naming the mouth |
| ⚑ GATE | "an absence the reply EARNED draws no conclusion" | **the coupling cell** — its *premise* was retired, not just its value; the genuine-gap half preserved on UNDATED hands |
| single-mouth reduction | `gap` limb over `DATED27` | re-aimed to `UNDATED27` (a real gap); the retired fixture returns as its own conviction cell |

---

## 5 · WHAT THIS DELIVERY DOES NOT CLAIM

- **The clock does not move.** Nothing here is an acceptance evening. The two-green clock stands at **ZERO**.
- **No live witness.** This is a rig cure. Whether Donna's live sentences ever swallow a stamp is the next gauntlet run's census to answer, not this bench's. The instrument now *can* convict it; that it *does* is outstanding.
- **F-06.35 is not absorbed.** Case mode unchanged on all three constants, asserted as a cell.
- **F-06.14 is not touched.** Class B's unconditional acquittal is deliberate and named; a read-failure remains its own claim under its own finding.
- **Nothing is banked.** Per §11 the LE holds no write credentials. Until the founder applies and pushes, this tree is **exposed, not banked**.

## 6 · WHAT THE NEXT SITTING PICKS UP

The chair's seal (CE-96) from this handover: the FINDINGS_LOG entry, F-06.84 OPEN → CURED, F-06.98 CHARTERED → DISCHARGED, and the masterplan row. Then **F6** — the bare absence assertion with `tool_calls: null` — remains OPEN and unruled, and the evenings remain the board.
