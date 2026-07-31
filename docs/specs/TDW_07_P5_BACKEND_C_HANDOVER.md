# TDW_07 P5 — BACKEND MOVEMENT C · EXECUTOR HANDOVER
**Base:** `dream-os @ f71d4a7` · **Executor:** Opus-LE · **Date:** 2026-07-31
**Rides:** the CE ruling widening the door's contract to the sheet's four fields.

---

## 1 · WHAT SHIPPED

| # | File | What |
|---|---|---|
| 1 | `src/api/couple/enquire.js` | Accepts `functions` · `wedding_date` · `city` · `budget_band`, all optional. POSTed overrides hydration on both species. |
| 2 | `src/lib/discover/enquiryFields.js` | **NEW.** One home for the two parses — see §3, it exists because the bench caught itself. |
| 3 | `scripts/b07_p5_bench.js` | §6 added (7 cells) + 2 mutations. |

**Zero DDL.** W-1 clean.

## 2 · PROOF

```
CURED    b07_p5_bench  52 passed, 0 failed  (52)
UNCURED  b07_p5_bench  44 passed, 8 failed  (52)
§6 gate  node --check  3/3 OK
```

## 3 · THE BENCH CAUGHT ITSELF TWICE — BOTH DISCLOSED

**(a) Two tautological cells.** §6.6 and §6.7 originally rebuilt the parsing logic
inside the test with `new Function` and asserted it against itself. They passed at
the UNCURED tree and would have passed against an empty repository. Eight cells
added, five went red — the gap is what exposed them. The cure is not a sharper
assertion but production code the bench can call, which is why
`src/lib/discover/enquiryFields.js` exists. Both cells now drive the real functions.

**(b) An invalid mutation.** The first §6.6 mutation broke `bandCeiling`'s `''`
early-return — and changed no behaviour, because `n > 0` independently rejects
`Number('') === 0`. A mutation that changes nothing is not a non-vacuity probe.
Re-aimed at a single point the other guard cannot cover. The double defence is
deliberate and stays: `Number('')` being `0` would turn the RICHEST band on the
sheet into a lead with `budget_max: 0`.

## 4 · DECLARED GAP

**`leads.wedding_date_precision` is not stamped.** A date she types is `'day'`
precision, but `createLead` does not accept the parameter — only `updateLead`
handles it (`leads.js:81-99`). Stamping at create means widening a shared writer
with another live caller (`api/vendor/leads.js:198`), which is outside this
movement. Declared, not silently widened (protocol §8).

## 5 · THE READ-ONLY ASYMMETRY, FOR THE SHEET

`functions` and `budget_band` land on `leads.event_types` / `leads.budget_max`
for a REAL vendor and have **no column** on `demo_leads`. Per the ruling they
render READ-ONLY on the sheet when the card is demo. `§6.5` asserts the demo leg
never threads them.

## 6 · NEXT

ZIP 3's sheet: prefill-and-edit for a real card, two rows display-only for a demo
one, the vetoed labels and expectation line, post then hand off (F1(a)).
