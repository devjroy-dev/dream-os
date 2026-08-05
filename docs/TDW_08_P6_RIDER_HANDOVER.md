# TDW_08 · P6 RIDER — F-08.94 + F-08.99 CURED · EXECUTOR HANDOVER

**REPO:** `dream-os` · built at `68451f7` (derived fetch-first; = charter base).
**Sibling:** `dreamos-pwa` present for the paired floor. **ZERO PWA BYTES.**
Built under CE R-C1→R-C6, AD-C1→AD-C5. Mint range F-08.99–.101; **only `.99` used.**

---

## 1 · WHAT SHIPPED — TWO FILES

| File | Change |
|---|---|
| `src/agent/closerEngine.js` | the clock block: destruction line on the rotation limb, new already-sunset limb, extended mechanism comment |
| `scripts/b08_p5_closer_bench.js` | labeled amendment ⑪ + 13 new cells + 4 mutation arms |

**W-1 held to the opening exactly.** Zero `closerSoul.js` bytes. Zero bytes outside
the clock block in `closerEngine.js`. No select widened, no schema touched.

---

## 2 · THE THREE VETOED SENTENCES, AS SHIPPED

**Line 1** (rotation limb, nested inside the rotation line's own guard — *"After
that"* is anaphoric and would dangle without its antecedent):

> After that it is held `${purgeDays}` days and then permanently deleted — the page, the photographs, and the enquiries on it. That deletion cannot be undone.

**Form A** (already-sunset, `daysLeft >= 1`):

> It has already rotated out of the marketplace. In `${daysLeft}` days it is permanently deleted — the page, the photographs, and the enquiries on it — and that cannot be undone. This is a real clock and you may say so.

**Form B** (already-sunset, `daysLeft <= 0`):

> It has already rotated out of the marketplace and its holding period has run out. It is deleted within a day — the page, the photographs, and the enquiries on it — and that cannot be undone. This is a real clock and you may say so.

Founder veto: 「 yes 」 (AD-C1), 「 yes to both 」 (AD-C4).

---

## 3 · THE TRUTH-CONDITIONS TABLE, AS BENCHED

| dial | population | handed |
|---|---|---|
| `> 0` | rotating, `left > 0` | rotation line **+** line 1 |
| `0` | rotating | rotation line **only — byte-identical to pre-P6** |
| `> 0` | swept, `daysLeft >= 1` | Form A |
| `> 0` | swept, `daysLeft <= 0` | Form B |
| `0` | swept | **silent** |
| any | re-granted (`discover_eligible` true **with** a stamp) | **silent** |
| any | claimed | **silent** |
| any | `state = 'removed'` | **silent** |
| any | malformed `sunset_at` | **silent** |

---

## 4 · FINDINGS

**F-08.94 — CURED.** The Closer no longer sells on a rotation clock while silent
about the destruction behind it.

**F-08.99 — MINTED AND CURED IN ONE SITTING** (R-C2). The already-sunset row —
the population *inside* the open destruction window — had no sentence at all.
Its limb mirrors `runPurgeSweep`'s sunset leg conjunction for conjunction, so the
model speaks only about rows the purge will actually take. F-08.90's conjunction
law, applied to speech.

**`.100` and `.101` unused.** Nothing else was found worth minting.

---

## 5 · DISCLOSURES — THREE, ALL SELF-CAUGHT

**D-1 · THE AMENDED CELL PASSED FOR A REASON ITS LABEL NEVER STATED, AND THAT IS
HOW A DEFECT HID FOR A SITTING.** R-C2 chartered a labeled amendment to
`b08_p5_closer_bench`'s *"a row already swept has NO days left"* cell. On reading
it the fixture turned out to carry `discover_eligible: true` **with** `sunset_at`
set — a combination `runSunsetSweep` **cannot produce**, since it flips the flag
false in the same act that stamps. That fixture is a **re-granted** row, not a
swept one. Silence is correct for it and remains correct.

So the cell was never testing the genuinely-swept case its label claimed, and the
gap I filed as F-08.99 sat underneath a green cell. **The assertion is unchanged
and still passes**; only the label moved, to the case it actually holds. The real
swept row got its own cell — the counter-cell R-C2 required — asserting the
destruction line **is** present.

**D-2 · I MISREAD THE MUTATION HARNESS AND BRIEFLY BELIEVED IT BROKEN.** My first
mutation pass used `MUTATE=name node …`; the contract is `--mutate=name`. All six
arms reported green, *including two pre-existing ones*, and I read that as a
possible vacuous-harness defect before finding my own error at `:35`. The harness
is sound. Recorded because a wrong all-green that I nearly filed as a finding is
exactly the class the estate keeps paying for.

**D-3 · A BENCH FIXTURE MOVED, AND IT IS A FIXTURE FIX, NOT A CODE ONE.** Form
A's first fixture used `sweptDemo(2)` against a 7-day window — landing on exactly
`5.0` days remaining, which floors to `4` once milliseconds elapse between
fixture construction and assertion. Changed to `sweptDemo(1.5)` → `5.5` → floors
to `5` unambiguously. **The ruled floor in production code is untouched**; the
fixture was sitting on a boundary it had no reason to sit on.

---

## 6 · THE FOUNDER-ACCEPTED IMPRECISION (AD-C4) — RECORDED AS ACCEPTED, NOT AS OVERSIGHT

If a row's purge is **blocked** — an asset that will not confirm destroyed, the
path witnessed live on `swatitomar_p4b` — the row survives past its window and
**Form B repeats "within a day" nightly until the block clears**. It overstates
**urgency** in that case. It never overstates **time remaining**, which is the
direction R-C3 protects. Teaching the Closer to read the blocked ledger was
refused as speculative surface.

Presented to the founder in the read-first with exactly this reasoning; his
veto-part-two 「 yes to both 」 covers it knowingly.

---

## 7 · NAMED LIMIT, ZERO CODE (R-C5)

The purge's **takedown** leg (`state = 'removed'`, anchored on `removed_at`) has
no limb here, and `removed_at` stays out of the block's select. A STOPped vendor
is `opted_out` and outside the Closer's population. A live wire ever showing a
`removed` row inside a Closer conversation is its own finding on that day. The
clause lives in the mechanism comment.

---

## 8 · FLOOR — PAIRED, TRIPLE-RUN, PLUS COLD CLONE

Three consecutive runs, byte-identical counts, zero drift:

| Bench | Baseline `68451f7` | Cured |
|---|---|---|
| `b08_p5_closer_bench` | 249 / 0 | **262 / 0** (+13) |
| `b08_p6_purge_bench` | 54 / 0 / 0 | 54 / 0 / 0 |
| `b08_p1_lifecycle_bench` | 106 / 0 / 0 | 106 / 0 / 0 |
| `b08_p4_factory_bench` | 83 / 0 / 0 | 83 / 0 / 0 |
| `b08_console_bench` | 71 / 0 / 0 | 71 / 0 / 0 |
| `b08_p3_seeing_surface_bench` | 61 / 0 / 0 | 61 / 0 / 0 |
| `b08_p5_invite_bench` | 35 / 0 / 0 | 35 / 0 / 0 |
| `b08_p5_eliza_bench` | 29 / 0 | 29 / 0 |
| `b08_p5_prospect_intake_bench` | 13 / 0 | 13 / 0 |

**COLD-CLONE RUN:** virgin clone of `68451f7`, HEAD guard checked
(`"name": "dream-os-backend"`), ZIP applied, `npm ci`, floor run there —
**262 / 54 / 106 / 71, identical.**

**NOT RUN, NAMED:** `b08_p5_closer_scenarios` needs `DEEPSEEK_API_KEY` and live
model access. It is the **founder's** by the estate's own precedent, and it is
the walk.

---

## 9 · ACCEPTANCE — FOUR NEW MUTATION ARMS, EACH REDDENING ITS OWN CELL

| Arm | Reddens |
|---|---|
| `purge_dial_ignored` — speak the destruction line at dial 0 | the **byte-identity** cell |
| `purge_figure_drift` — `Math.ceil(…) + 1` instead of the floor | Form A **and** Form B |
| `purge_limb_gone` — the already-sunset branch removed | Form A **and** Form B |
| `purge_limb_unconj` — drop the limb's `discover_eligible = false` | the **re-granted** cell |

Pre-existing arms `clock_uncond` and `zero_shows` still redden — the rider did
not hollow them. Every arm verified with the correct `--mutate=` contract (D-2).

**The byte-identity cell is the strongest**, exactly as framed at read-first:

```
ctxRotDial7 === ctxRotDial0 + '\n' + <line 1>
```

Not "the line is absent" — an **exact equality** proving the vetoed sentence is
the *entire* delta between the kill switch on and off.
