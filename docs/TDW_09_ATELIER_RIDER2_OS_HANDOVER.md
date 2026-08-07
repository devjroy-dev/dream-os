# TDW_09 · ATELIER RIDER 2 (dream-os half) — THE SECOND BUDGET WRITER
**Repo:** `dream-os` @ `01640bd` · 1 file changed, 1 bench added
**Founder rulings, verbatim:** 「 1-ok 」 (dream-os read-only LIFTED for this line) · 「 2-both can write if theres no clash and if the write is successful 」

## Gates
`node --check` clean · `tdw09_rider2_budget` **30 / 30** · five mutations, all biting.

## What shipped
`src/api/couple/me.js` — `PATCH /:coupleId` now accepts `budget_total`.
Column witnessed: `docs/db/PUBLIC_SCHEMA.md:288`, `budget_total integer`.

**Both of the founder's conditions are mechanised, not assumed:**

- **NO CLASH.** The guard is byte-for-byte `brideEngine.js`'s budget arm — `parseInt` coercion, then a positive-integer requirement. A value one writer refuses cannot be written by the other. The bench does not read the guard's text: it **lifts the coercion and the refusal condition from BOTH writers' source and executes them** against a twelve-row input table, asserting identical verdicts. Loosen either writer and the table disagrees.
- **THE WRITE IS SUCCESSFUL.** Invalid input returns **400 with a named reason** — never coerced to null, never silently dropped, which is what the existing `|| null` pattern would have done to a `0`. The persisted value is echoed so the caller can compare rather than trust a boolean; the client re-reads independently.

## F-09.165 — A LIVE DEFECT THIS RIDER INHERITED AND MAY NOT CURE
`parseInt` truncates at the first non-digit. Shipped behaviour of the **existing** writer, live today on WhatsApp **and** the in-app Dream room:

```
"12,50,000"  -> ACCEPTED as Rs 12
"4.5L"       -> ACCEPTED as Rs 4
"4.5 lakhs"  -> ACCEPTED as Rs 4
"1e6"        -> ACCEPTED as Rs 1
"45.5"       -> ACCEPTED as Rs 45
```

A bride who tells Dream Ai her budget is twelve lakh fifty gets **Rs 12** in the column.

**Not cured here, for two reasons that both bind:** `brideEngine.js` is an engine file and **W-1** forbids touching it without an explicit chair ruling; and curing only the route would create exactly the clash the founder's ruling forbids. So the class is **held open by cell** — §5 of the bench asserts the truncation still happens, and goes RED the day someone fixes it, pointing them at this finding. A bench that blessed the defect silently would be worse than no bench.

**Needs a chair ruling to cure**, and the cure must land in both writers in one act.

## Declared gaps
1. **Notes-audit asymmetry.** `brideEngine` inserts a `notes` row on every change; this route does not. A budget changed in Settings leaves no history while the same change through Dream Ai does. Not a clash — the column agrees — but a history gap, and unruled. Named in-file.
2. **No clearing to null.** The first writer has no clear path, so offering one here would be a one-surface capability. Raise or lower only. Named in-file.
3. **Deps absent in the build container**, so the route was proven by `node --check` plus the bench's execution of its lifted logic — not by mounting express. The founder's live walk is the settling witness.

## Sequencing
**THIS ZIP PUSHES FIRST.** The pwa half sends `budget_total`; against an unpatched route it would be silently discarded — a lying control.
