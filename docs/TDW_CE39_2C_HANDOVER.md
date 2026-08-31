# TDW · CE-39 · ROAD STEP 2c · ZIP 1 (dream-os) — HANDOVER

**Base `051a413` (main), re-derived fetch-first at the cut. Sibling `dreamos-pwa`
`bb4a9ad` (worklist) present for the floor.**

**FLOOR = NAMED BASE. SET byte-equal to `scripts/floor-base.txt`, 20/20, no delta.**
Compared as a SET and not as a count (R-38.19). `b47` 13/0 · `b46` 29/0 ·
`b05_f0550` green.

---

## 1 · WHAT MOVED

| file | what |
|---|---|
| `src/lib/vendor/invoices.js` | the writer home grows `recordPayment`, `cancelInvoice`, `invoicePdfSource`, `updateInvoicePdfUrl`, `PAYABLE_STATES` |
| `src/api/vendor/money.js` | D-1's particular on the wire; `opening`/`closing`; six typed write routes |
| `scripts/b46_money_books_bench.js` | §1.1 amended, RETIRE-WITH-THE-READER, count preserved 1:1 |
| `scripts/b47_money_crossing_bench.js` | NEW — the crossing's cells |
| `scripts/floor-manifest-ce39-2c.txt` | NEW — the delivery's own file table |

**`src/lib/money/` was never created (c-39.32).** The kickoff ruled a new home;
the tree already had one at `src/lib/vendor/{invoices,expenses}.js`, already
typed, already the only importers' target. Founding a second home for functions
that have one is the defect `lib/vendor/events.js` was convicted of from the
other side. The chair adopted the seat's arm; `b47` 1.3 asserts the absence.

## 2 · THE EXTRACTION CLAUSE IS DISCHARGED-AS-VOID

`src/agent/engine.js` is **byte-identical to `051a413`**:

```
$ git diff 051a413 -- src/agent/engine.js
(empty — 0 bytes)
```

The charter ruled the Victor money tool cases extracted to the writer home. They
were, and the floor reddened `b05_f0550_ping_drain_bench` §4.3 —
「a defusal that moves an executable byte is not a defusal」.

**The reason: both cases sit inside a defused island.** `src/agent/engine.js:753`
reads 「F-05.56 — EVERYTHING BELOW THIS LINE HAS ZERO CALLERS SINCE ARC M5」,
frozen under CE-68 R4. Derived by line: island header 753 · `handleOnboarding`
787 · `executeTool` 795 · `case 'record_payment'` 1508 · `case 'log_expense'`
1769. `b05_f0550` §4.1 independently passes on the callers being zero.

The ruled target was dead code under a freeze. The extraction bought nothing and
broke the freeze to do it. Reverted whole; the clause is void, not deferred.
`b47` 1.4 now asserts the island fact instead, so the next seat cannot
re-charter the same work: it reds if either case rises above the island line or
if either entry point gains a caller.

**The veto byte came out with it.** `Could not record that payment — …` had no
live path to be spoken on. Recorded because it was proposed, not because it
ships.

## 3 · F-39.8 — CURED

`recordPayment` in the home stamps `last_payment_at` and transitions by
**arithmetic on a positive list**: `PAYABLE_STATES = ['unpaid','advance_paid']`,
then `>= amount_total → paid`, else `> 0 → advance_paid`. `cancelled` and `paid`
are excluded by absence, never by negation (R-39.12).

The prior table let `payment_type: 'balance'` close an invoice regardless of
amount — Rs 1 declared 'balance' marked a Rs 50,000 invoice paid. The money
decides now; `payment_type` is advisory and logged.

**DROY550's two rows are NOT touched.** They keep their stale state and missing
clock, and the register keeps saying `no date on file` about them, truthfully. A
backfill is the founder's to ask for.

## 4 · F-39.21 / D-1 B13 — THE PARTICULAR ON THE WIRE

Per credit: `client_name` · `invoice_number` · `amount_paid` of `amount_total`,
plus `milestone_label` when the credit is a schedule row.
Per debit: `category` · `description`.

Head gains `opening` and `closing`, **READ, never summed** — opening is zero by
the register's construction, closing is the last row's own `balance` cell.
`b47` 3.4 caps this file at its two pre-existing `reduce()` calls, so a third
derivation of the chain reds.

**STRUCK with reason:** `invoices.description` (F-39.23 — Victor's money-edit
writes a rupee-glyph audit log into that vendor-facing column; unrenderable, not
merely unrendered) · `invoices.state` (SELECTed for OUTSTANDING, never on a row)
· `invoices.due_date` · `expenses.client_name`. The 2c kickoff's wider list was
authored before D-1's pick and is superseded (c-39.30).

**The door emits the row's word verbatim and never validates it** — stated once
in `money.js` at the debit particular. See F-2c.p1.

## 5 · CONTROL INVENTORY — old → new

| verb | was | now |
|---|---|---|
| Add invoice | `POST /binders/:v/:id/money-edit` (engine) | `POST /money/invoices/:vendorId` |
| Add expense | `POST /binders/:v/:id/money-edit` (engine) | `POST /money/expenses/:vendorId` |
| Mark paid | `POST /binders/:v/:id/money-edit` (engine) | `POST /money/invoices/:vendorId/:invoiceId/payments` |
| Delete expense | `POST /binders/:v/:id/hide` (engine) | `DELETE /money/expenses/:vendorId/:expenseId` |
| Cancel | `PATCH /vendor/invoices/:id/cancel` (binder id) | `PATCH /money/invoices/:vendorId/:invoiceId/cancel` |
| PDF | `GET /vendor/invoices/:id/pdf` (binder id) | `GET /money/invoices/:vendorId/:invoiceId/pdf` |

All six vendor-JWT gated through the same `requireAuth + resolveVendor` pair the
read door uses. **Books gains ZERO verbs.**

**The zero-non-GET clause moved rather than died.** `b46` §1.1 asserted it of the
ROUTER; the router now carries the five verbs by ruling, so it asserts it of the
BOOKS DOOR — the clause's real subject. Amended with reasoning labelled, count
preserved, proven both ways (`router.get('/books/…` → `router.post` → RED).

## 6 · STRUCK CELL, DECLARED

「every money write that emitted an event still does, through writeEvent」 is
**STRUCK**. Derived at `051a413`: `money.js`, `invoices.js`, `expenses.js`,
`schedules.js`, `binderWrite.js`, `ledger.js` hold zero references to
`public.events` or `writeEvent`; `cabinet.js`'s single reference is a SELECT.
**No money verb emits a calendar entry.** A cell asserting the preservation of an
empty coupling passes vacuously. Not written; the reason is in `b47`'s header.

## 7 · RETIRE-WITH-THE-READER — ACROSS THE PAIR, NOT IN THIS ZIP

`cabinet.js`'s paid/owed slices and the engine GET arms retire **with their
readers**, and the readers are in the pwa. dream-os pushes first, so retiring
them here breaks the live rooms between the two pushes. **They ride ZIP 2's
companion.** The charter's word is met across the pair; stated in both handovers.

## 8 · NON-VACUITY — DISCLOSED, NOT PADDED

`b47` 13 PASS · 0 FAIL. **Eight cells mutation-proven** against production code:
1.1 (inline a table insert → RED) · 2.1 (drop the payment clock → RED) · 2.3
(the Rs 1 'balance' stub) · 3.1 (drop `client_name` → RED) · 3.2 (drop the row
projection → RED) · 3.4 (sum the closing → RED) · 4.2 (ungate the payments route
→ RED) · and 1.4's predecessor before it was amended.
**Five labelled `PROVEN-ONE-WAY` at their sites:** 1.2, 1.3, 2.2, 3.3, 4.1.

Two of `b47`'s own cells reddened on their first cut and both were the
instrument, not the tree — `router.delete(` read as a table mutation, and a sync
harness printing `[object Promise]`. F-39.25's pattern; caught by running it.

## 9 · FINDINGS THIS SITTING

**F-2c.p1 — OPEN. The vendor expense category vocabulary has two homes and they
disagree.** `src/lib/vendor/expenses.js:7-11` against `expenses_category_check`
(`docs/db/PUBLIC_SCHEMA.md:1549`):

| in the HOME, rejected by the DB | in the DB, refused by the HOME |
|---|---|
| `editing` · `packaging` · `accommodation` | `commission` · `shoot` · `inventory` |

Nine of twelve agree. Both failure directions are live: a vendor logging an
editing cost passes the validator and takes a `23514`; a vendor logging a
commission is refused by a sentence that names the wrong twelve.

**Lineage: this is the third instance of a filed class.** `F-15.10` is the same
defect on the couple plane — `couple_bookings_category_check` against an inline
`ALLOWED_CATEGORIES` — sealed at `86f15d6`/`8ebbe9e`, six homes collapsed into
`src/agent/categories.js`. `F-15.6` banked the doctrine in the same arc: *a cell
can be green, non-vacuous and mutation-proven while pinning a value the database
has never accepted — column-constraint census joins R-33.1's read-first duty.*
**The vendor expense plane was never censused.**

Arm (i) ruled: `ALLOWED_CATEGORIES` is **byte-untouched** this sitting. The cure
and the corrected error string go to the writer-hygiene sitting with a veto slot.

**F-2c.p2 — DEMOTED TO AN ISLAND-FACT.** `case 'record_payment'` holds three
further writes to `public.invoices` (`client_id` ×2 in the promotion arm,
`pdf_url` ×1 in the advance-paid stage). Filed, then demoted with F-39.29's
prefix-guard delta: both were derived **inside the defused island** and mean
nothing about live behaviour until re-derived from the callers down.

**F-39.29 — the delta, recorded and NOT cured.** Home `if (!v.invoice_prefix)`
vs island `if (v.invoice_prefix === null)`; an empty-string prefix is re-derived
by one and left by the other. Both uncapped; the 20-char cap lives only on
`update_invoice_prefix`. Island-fact, pending re-derivation.

**c-2c.2 — MINE, and it cost the chair a ratified finding.** I reported
`create_event`, `commit_event_proposals` and `update_event_state` as live vendor
writers past `writeEvent`, and wrote that Victor can double-book by tool. All
three sit inside the island (953, 980, 1256) with no callers. I swept the TABLE
and not the CALLER — one file after proving `lib/vendor/events.js` dead by
sweeping its importers, and after recording that 2a's `s7` made the same error in
the opposite direction. **F-39.20 is re-opened as underived at the chair's hand
(c-39.33); the road's pre-beta line is struck until swept from the callers down.**

The writer-hygiene sitting opens on: **「the tool switch is defused — every
finding filed against it needs re-deriving against its callers.」**

## 10 · WHAT ZIP 2 INHERITS

The rooms' reads and the five verbs re-point to the endpoints in §5 · Books B2
with `Total received` / `Outstanding` heads and `Received | Paid out | Balance`
columns · `cabinet.js`'s money-slice readers retire, then §7's dream-os
companion · Studio C2 tabs (arm i, `?state=all`, `/by-wedding`, `owed`→`Unpaid`)
· E-1 both writers · `/vendor/billing` stub · `/vendor/onboarding` into
`INTERIM_VENDOR_LINKS` · F-39.26 · the fate list · `base_guard.sh` made
byte-identical with the b40 cell (REFUSED-not-FAIL on an absent sibling).

## 11 · SQL

**ZERO.** No migration authored, no ladder number claimed, no founder SQL owed
by this ZIP.
