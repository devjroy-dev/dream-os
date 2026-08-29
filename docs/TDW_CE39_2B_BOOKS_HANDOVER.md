# TDW · ROAD STEP 2b — THE TYPED MONEY PLANE · dream-os HANDOVER

**Executor handover. Rides the ZIP. Not a CE-numbered entry; nothing here belongs in
`FINDINGS_LOG.md` or the masterplan — the chair bands it.**

---

## §1 · WHAT MOVED

| path | motion |
|---|---|
| `src/api/vendor/money.js` | **NEW.** One route: `GET /api/v2/vendor/money/books/:vendorId`, under `requireAuth + resolveVendor({paramName:'vendorId'})`. Reads `public.invoices` ⋈ `public.payment_schedules` and `public.expenses`. Zero non-GET. |
| `src/api/vendor/core.js` | **ONE MOUNT**, above the bare root mount. |
| `scripts/b46_money_books_bench.js` | **NEW.** 29 cells, 4 production-code mutations. |
| `tools/preflight.sh` | F-39.p2 — prints `engine/dist` presence; warns with the cost. |
| `scripts/run-floor.sh` | F-39.p2 — **REFUSES** without `src/engine/dist`. |
| `scripts/floor-manifest-ce39-2b.txt` | **NEW.** The declared-dirt manifest for this delivery. |
| `docs/TDW_CE39_2B_BOOKS_HANDOVER.md` | this file |

**NOTHING RETIRED THIS SITTING.** `src/api/vendor/invoices.js` and `expenses.js` keep their
GET arms; `src/api/vendor-engine/cabinet.js` keeps its `paid`/`owed` slices. That is
CE-39's re-wording of the kickoff's §3(e), not an omission — see §2.

## §2 · STEP 2c — THE MONEY WRITE-PLANE CROSSING · the chair's §2, verbatim

The 2b read-first found that crossing the Invoices and Expenses rooms is an **ID-SPACE
CHANGE, not a source change**. Today every row's `id` is an engine binder uuid; a typed
read makes it a `public.invoices` / `public.expenses` uuid, and every control keyed on that
id crosses with it. These do not follow:

| control | site | endpoint | breaks how |
|---|---|---|---|
| Cancel invoice | `app/vendor/list/[slice]/invoices.tsx` :: `deleteRequest` | `PATCH /vendor/invoices/:id/cancel` | reads `engine.records` by binder id → 404 "Invoice not found" on every row |
| Download PDF / Send on WhatsApp | `components/vendor/slices/SliceShell.tsx` :: the PDF control, the WhatsApp control | `GET /vendor/invoices/:id/pdf` | same engine read → 404 |
| Mark paid | `SliceShell.tsx` :: the mark-paid action | `recordPayment` → `/binders/:v/:id/money-edit` | binder id → write lands nowhere |
| Delete expense | `app/vendor/list/[slice]/expenses.tsx` :: `deleteRequest` | `POST /binders/:v/:id/hide` | binder id → 404 |
| Add (FAB) | `SliceShell.tsx` :: `onAdd` | `createInvoice` / `createExpense` → `/binders/...` | writes engine; the new row never appears in a typed-reading room |

**THE MIRROR IMAGE IS ALREADY LIVE, AND IT IS THE ARGUMENT FOR 2c.**
`src/api/vendor/schedules.js` is fully TYPED — `GET/POST /vendor/invoices/:invoiceId/schedule`
reads `public.payment_schedules` keyed on a `public.invoices` id — and `SliceShell.tsx`
hands it today's **binder** id. The payment-schedule panel has been querying a typed table
with a foreign id space and silently returning empty. Crossing the read alone would cure
that leg and break the five above: a swap of which half is broken, not a net cure.

**Also for 2c, derived at this read-first:** `binderToInvoice` / `binderToExpense` cannot
retire with the readers — they have five live WRITE-path consumers (`createInvoice`,
`updateInvoice`, `recordPayment`, `createExpense`, `updateExpense`), each mapping a binder
write response into the typed shape. And `cabinet.js` has **no separable money slice**: one
`engine.records` read is sliced in JS into `clients`/`leads`/`paid`/`owed`, so only
`paid`/`owed` and `pendingOf` retire; the reader stays for the client and lead slices.

## §3 · FLOOR — DERIVED AT THE CUT, NOT QUOTED (R-38.19)

**Derived at the re-cut, on `59b79ef`. `FLOOR = NAMED BASE, no delta.` 20 RED, SET compared by name:**

`b05_arc_m4_bench · b05_arc_m6_bench · b05_f0555_media_dedupe_bench · b05_p4_crons_bench ·
b06_gauntlet · b06_meter_bench · b07_f0772_circle_auth_bench · b07_f0791_guard_stack_bench ·
b07_p4b_body_bench · b07_p5_bench · b08_p1_lifecycle_bench · b08_p5_oow_relay_bench ·
b08_p5_unblock_bench · b10_p1_search_bench · b10_p2_bridge_bench · b10_p3_mint_deck_bench ·
b5_wa_door_smoke · b5b_movementb_bench · bf1_bride_tool_fidelity_bench · test-shape`

Run with the sibling present, `--delivery scripts/floor-manifest-ce39-2b.txt`.

## §4 · F-39.p2 · **DOCUMENTED BUT NOT INSTRUMENTED**

A fresh clone measured **47 RED against a named base of 20** — delta 27, every one an
addition and not one removal. That one-directional shape is the tell: a real regression at
an untouched tip does not add twenty-seven benches and remove none.

Cause: `src/api/vendor/leads.js` (symbol: the `patchNote` import) requires
`../../engine/dist/core/donna`, a `tsc` artifact `.gitignore` excludes. `core.js` mounts
`leads.js`, so MODULE_NOT_FOUND cascades into every bench that mounts the vendor router.
After `npm run build`: 20 RED, SET identical. **Both ways confirmed.**

**The finding's text is the correction the seat owed on its own read-first.** The first
report said this had never been printed by anything. It had: `b43_solutions_doors_bench.js`'s
header states the prerequisite in full and ends on *"a bench whose failure mode on a clean
checkout looks like a broken door is a bench that will get the door blamed."* So the FACT
was documented and the INSTRUMENT was not, and only the instrument runs. A header b43's
reader sees is a header nobody measuring a floor ever opens.

Cure: `preflight.sh` prints `engine/dist` beside `node_modules`, keyed on `src/engine/`
existing rather than on the repo's name. `run-floor.sh` **refuses** rather than warns — a
missing sibling *says* it refused; a missing `dist` reports as ordinary REDs indistinguishable
from defects.

## §4b · THE RE-CUT, AND WHAT THE GUARD CAUGHT — s-3

This ZIP was first cut at base `852d385`. Step 2a landed as `59b79ef` before the founder
applied, and `tools/base_guard.sh` REFUSED: *"HEAD is 59b79ef, base is 852d385 — the local
checkout is not on the base. Do not apply. Nothing has been copied."* **That is the guard
working, and it is the reason the apply chain has one.**

The seat did NOT re-stamp the header. Both trees were reset to the new tips and every edit
re-applied, because 2a and 2b collide in four places and a re-stamped header would have
shipped all four as silent reverts:

| collision | what a re-stamp would have done |
|---|---|
| `scripts/b45_*` | **2a took b45** (`b45_precutover_seat_bench.js`). Two b45s in one directory; the `cp -r deploy/*` chain overwrites, taking 2a's nine cells and eight witnessed mutations with it. Renamed **b46**, re-derived at the re-cut. |
| `lib/worklist/copy.ts` | reverts R-39.6's three founder-vetoed Couture bytes |
| `lib/worklist/rooms.ts` | reverts R-39.7's `INTERIM_VENDOR_MOUNTS` amendment (25 → 22) |
| `scripts/b40_*` | reverts C58/C59, the two cells 2a added |
| `docs/COPY_REGISTER_M-FINISH.md` | reverts 2a's §10 — and the Books section renumbered §10 → **§11** behind it |

`src/api/vendor/core.js`, `tools/preflight.sh` and `scripts/run-floor.sh` were verified
untouched by 2a before re-applying. Both floors re-derived at the NEW tips, not carried.

**s-3 · A BENCH NUMBER IS A DERIVATION, NOT A NAME.** The first cut's header said b45 was
free and recorded the command that proved it — true at `852d385`, false at the cut. R-38.16
exists for exactly this and the bench header now records the collision rather than the
conclusion.

## §5 · SEAT CORRECTIONS, OWNED IN BAND

**s-1 · THE TIEBREAK WAS BUILT FROM A DATE COLUMN.** `b46` §2.4 went RED on the first run:
`[15000, 35000, 30000, 24999]`. `_tiebreak` for debits was set from `expense_date` — the
same value as `date` — so `created_at` was never consulted and the tie fell to `id`, putting
Rs 5,000 ahead of Rs 5,001. `expense_date` is a DATE column: two same-day expenses carry
identical values, so a tiebreak built from it is not a tiebreak. Cured; the reasoning is a
paragraph at the site, not a line in this file. **The founder's tie-break SELECT exists
precisely because `created_at` is the only column that separates those two rows** — the
seat asked for it and then failed to use it, which is the sharper half of the correction.

**s-2 · A MUTATION CELL ASSERTED PREDICTED ARITHMETIC.** §7.3 predicted the mutated chain
and was wrong: with the tiebreak gone the two CREDITS tie too (both slice to `2026-07-14`)
and fall to `id`, so the chain opens at 20,000. The cell was asserting the seat's arithmetic
about a mutated tree instead of the property under test. Rewritten to assert that the
register MOVES, with the observed chain printed. §9: assert the artifact, never a predicted
count.

## §6 · PLACEHOLDERS

**F-39.p1 · THE FIXTURE CANNOT PROVE THE RULING IT APPEARS TO WITNESS.** DROY550's two
invoices are both `unpaid`, so a positive-list outstanding and a `state <> 'paid'`
outstanding return the IDENTICAL head, and no cancelled row exists to exercise
cancelled-still-credits. Carried by synthetic rows in `b46` §4 and §5, each with its own
production mutation (§7.1, §7.2). **In scope by ruling and DONE.**

**F-39.p2** — above. **Cured in this ZIP.**

**F-39.p3** — the eleventh byte, `booksFailed`. Withheld at the build, vetoed after. Lands
in the pwa ZIP.

## §7 · WHAT THE FOUNDER RUNS

Nothing beyond the apply block. **Zero migrations, zero writes, zero SQL.** The four
fixture SELECTs and the tie-break SELECT have already been run and their rows are baked
into `b46` as the transcribed fixture.

## §8 · NEXT

Step 2c (above) — chartered, read-first may run in parallel under R-39.5. Then the Phase 3
walk, then Phase 4. **Phase 7 arm (a), founder-ruled 2026-08-29:** path swap, `/w/` retires
into `/vendor/` at cutover, `/v/` and `/r/` stay. Nothing in this sitting anticipates it;
Books lives at `/w/books` until then.
