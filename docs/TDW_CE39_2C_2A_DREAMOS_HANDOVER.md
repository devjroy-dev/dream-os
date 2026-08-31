# TDW · CE-39 · ROAD STEP 2c · 2a-dreamos — HANDOVER

**Base `a03729e` (main), re-derived fetch-first at the cut — the branch MOVED
beneath this delivery (the founder pushed the first 2a cut mid-build, R-38.16).
F-38.25 check run before re-basing: three lines at `a03729e` are absent from
this ZIP and all three are lines it deliberately REPLACES — the two writer-home
import lines grow `updateInvoice`/`updateExpense`, and `b47` 1.3's old signature
survives as 1.3b. Nothing reverts.**

**Base `a03729e`. Sibling `dreamos-pwa`
`bb4a9ad` (worklist) present for the floor.**

**FLOOR = NAMED BASE. SET byte-equal to `scripts/floor-base.txt`, 20/20, no delta.**
`b47` 22 PASS · 0 FAIL.

---

## 1 · WHAT MOVED — AND WHY THIS ZIP EXISTS AT ALL

| file | what |
|---|---|
| `src/api/vendor/money.js` | two room reads · two edit doors · `vendorGate` hoisted |
| `src/api/vendor/expenses.js` | three typed write routes RETIRED; engine `GET` survives |
| `src/lib/vendor/expenses.js` | header names its real caller; F-2c.p1 warned at the const |
| `scripts/b47_money_crossing_bench.js` | §5 added; 1.3 widened; 3.4 amended |
| `scripts/floor-manifest-ce39-2c-2a.txt` | NEW |

**`money.js` now mounts eleven routes** — the ZIP 1 handover's control table said
six and is corrected here: `GET books` · `GET invoices` · `GET expenses` ·
`POST invoices` · `POST expenses` · `PATCH invoices/:id` · `PATCH expenses/:id`
· `PATCH invoices/:id/cancel` · `POST invoices/:id/payments` ·
`DELETE expenses/:id` · `GET invoices/:id/pdf`.

**c-2c.3 — the seat's own gap, and it was in a shipped ZIP.** ZIP 1's handover
said the crossing's dream-os half was complete. It was not. That ZIP built the
six write routes and the Books read; `money.js` at `f188a69` declared exactly two
GETs (`/books/:vendorId` and the PDF). So `fetchInvoices` and `fetchExpenses`
had **nothing typed to point at** — the existing `/vendor/invoices/:vendorId` and
`/vendor/expenses/:vendorId` both read `eng.from('records')`, and re-pointing the
rooms at those would have swapped one engine reader for another and crossed
nothing.

Found deriving the pwa's re-point target, before a pwa byte was written.
**Band 4 should correct ZIP 1's completeness claim.**

## 1b · c-2c.4 — THE SEAT MINTED A SECOND HOME, AND THE TREE ALREADY HAD THE DOOR

`src/api/vendor/expenses.js` carried `POST /`, `PATCH /:expenseId` and
`DELETE /:expenseId`, and **all three already called the typed writer home** —
`createExpense`, `updateExpense`, `deleteExpense` in `src/lib/vendor/expenses.js`.
They were correct and they were in the wrong file.

The seat read `expenses.tsx`'s `deleteRequest` pointing at `binders/:id/hide`,
concluded the expense verbs were on the engine plane, and built replacements in
ZIP 1 without checking whether the typed route the pwa *wasn't calling* already
existed. **The pwa was calling the wrong door, not a missing one.** Same failure
as c-39.32 — ruling a shape without reading what the tree had — committed by the
seat two ZIPs after catching the chair on it.

**Ruled (b): `money.js` is the one typed money door; a table's doors live in one
file.** So ZIP 1's two expense routes are the survivors and these three retire.

**They retire in THIS ZIP because the caller sweep found zero.** Quoted:

```
pwa (comments stripped): ZERO references to /vendor/expenses under app/, components/, lib/
dream-os:                no other router, script or tool — every hit is a comment
```

Nothing ever called them. The standing rule — a source retires once no reader
calls it — is satisfied at the strongest reading.

## 1c · c-2c.3, SECOND INSTANCE — THE EDIT DOORS

`AddSheet` calls `updateInvoice` at `:297`/`:366` and `updateExpense` at
`:317`/`:367`. Four of the ten money call sites, and the typed plane had a door
for neither: the invoice edit lived only at `PATCH /vendor/invoices/:invoiceId`
on the engine binder. `money.js` gains both, through the home's `updateInvoice`
and `updateExpense`. The home decides what is editable — a paid or cancelled
invoice is refused there, category and amount are validated there — so neither
door restates a rule.

## 1d · F-39.33 PRE-DERIVED — AND IT DOES NOT GO DEAD

2b's companion asked whether `invoices.js:381`'s binder-sync writer orphans once
the binder readers retire. **It does not.** `generateInvoiceForBinder` has four
live callers beyond the PDF route:

```
src/api/vendor-engine/chat.js:422     Victor's PWA chat door
src/lib/vendorInbound.js:1698         the WhatsApp path
src/index.js:149 · vendorInbound.js:179   injected as a dependency
```

plus five benches stubbing it. The WhatsApp invoice path keeps calling it, so
`:381`'s direct write to `public.invoices` survives this arc. **The filing should
say so rather than predicting an orphan.** It is named as `b47` 1.3's one
declared exception, by symbol.

## 2 · NO ENGINE-GET RETIREMENT — BY RULING, AND THE REASON MATTERS

`cabinet.js`'s paid/owed slices and the two engine money GET arms — including
`expenses.js`'s surviving `GET /:vendorId` — are **byte-untouched**. Retiring them here would break the LIVE rooms in the window
between this push and 2a-pwa's, because the pwa still reads the engine arms
until it re-points. **The readers' sources retire only once no reader calls
them** — that is 2b's dream-os companion.

`fetchCabinet`, `fetchLedger`, `binderBase` and every Clients reader are
untouched here and stay untouched at the retirement too: the binder plane is
shared. Derived at `bb4a9ad`:

| reader | plane | fate |
|---|---|---|
| `fetchInvoices` :269 · `fetchExpenses` :285 | cabinet/ledger | retire |
| `binderToInvoice` :131 · `binderToExpense` :146 | cabinet/ledger | retire |
| the ten money writes | `binderBase` + `money-edit` | re-point |
| `fetchClients` :253 · `fetchClientDetail` :259 | **`fetchCabinet`** | **STAYS** |
| `createClient` :654 · `updateClient` :665 · `deleteClient` :677 | **`binderBase`** | **STAYS** |
| `components/vendor/Cabinet.tsx:297` | `fetchCabinet` | **STAYS** — old-tree room |

A wholesale retirement takes the Clients room down with it.

## 3 · THE TWO DOORS

Both answer in the shape `lib/vendor/types/vendor.ts` already declares
(`InvoicesResponse`, `ExpensesResponse`), field for field. A typed door that
invented a better shape would make the crossing a rewrite of both rooms instead
of a change of address.

**Server-computed, one home:** `amount_owed` per row, and `total_outstanding` /
`total_collected` / `total_spent` on the summaries. Today `fetchInvoices` does
this in the client with a `reduce` — a second home for arithmetic the server can
state once, which is F-04.13's lesson and the rule the running balance already
obeys. **The pwa must not re-derive them; that cell is 2a-pwa's, by ruling.**

**`OUTSTANDING_STATES` is shared with the register.** The room read and the Books
door read the same positive list from the same const. Two doors on one plane
disagreeing about what is owed is the two-derivations disease wearing two doors
instead of two files. F-P3.1 earned the rule on this exact column: `state <>
'paid'` returns cancelled invoices as money owed.

**`state` filtering stays a client concern**, exactly as `fetchInvoices(vendorId,
state)` does it today. No filter vocabulary is minted here — a second vocabulary
for one column is how `invoices_state_check` grows a rival.

**Column witness** (`docs/db/PUBLIC_SCHEMA.md`, ordinals): invoices
`id`(1) `invoice_number`(4) `client_name`(5) `client_phone`(6) `amount_total`(8)
`amount_paid`(10) `due_date`(11) `state`(12) `created_at`(15) · expenses `id`(1)
`amount`(3) `category`(4) `description`(5) `expense_date`(6) `client_name`(7)
`created_at`(10). Both filter `deleted_at IS NULL`.

**The expense category rides verbatim, never validated** — the same rule the
debit particular states, for the same reason (F-2c.p1: the writer's list and the
database's CHECK are not the same twelve, and a door filtering through the
writer's list would hide money the vendor logged).

## 4 · A DEFECT `node --check` COULD NOT SEE

`const vendorGate` sat below the write doors, which were its only readers. The
two room reads register **earlier** in the file, so the first cut put the const in
its own temporal dead zone and the router **threw at module load**. `node --check`
passed it — a TDZ is a runtime binding fact, not a syntax one.

Caught by requiring the module, not by reading it. `b47` 5.1 is now that
instrument, and its mutation is moving the const back down.

## 5 · NON-VACUITY — DISCLOSED, NOT PADDED

`b47` 22 PASS · 0 FAIL. **Eight of the ten cells this ZIP adds or amends are
mutation-proven**: 1.3 (restore a write route in `expenses.js` → RED, which also
reds 5.8) · 5.7 (ungate an edit door → RED) · and the six below against production code: 5.1 (un-hoist the gate → RED) · 5.3
(drop `deleted_at` → RED) · 5.4 (drop `client_phone` → RED) · 5.5 (restore the
negation → RED) · 5.6 (drop `amount_owed` → RED) · 3.4 (a third reduce inside
the books route → RED). **5.2 is PROVEN-ONE-WAY** (mount, gate and method
presence).

**§3.4 amended, RETIRE-WITH-THE-READER, count preserved 1:1.** It read:

```js
const reduces = (s.match(/\.reduce\(/g) || []).length;
return reduces === 2 || `${reduces} reduce() calls — the register must sum nothing new`;
```

A file-scoped count for a route-scoped rule. It was the whole truth when the file
was only the register; the room reads' three ruled server-side reduces took the
count to five and it reddened on work it was written to permit — the same shape
as `b46` §1.1 one ZIP earlier. The rule is unchanged and is now asserted of the
register's own route. Nothing is left unguarded: 5.6 covers the room reads'
figures.

## 6 · SQL

**ZERO.** No migration, no ladder number, no founder SQL owed.

## 7 · WHAT COMES NEXT

**2a-pwa** — all ten money call sites re-point (the charter said five; the tree
says ten: PDF has two sites, `SliceShell.tsx:429` and `:921`, and `AddSheet`
carries the edit pair at `:297`/`:317`/`:366`/`:367`). `invoices.tsx`'s
`deleteRequest` gains the `vendorId` closure `expenses.tsx` already has — the
one shape change in the crossing. `BooksBody` to the re-shot `B2-months`; types
grow `particular` / `opening` / `closing`; `C-money` asserts no engine money
reader or writer remains reachable from the rooms.

**2b + its dream-os companion** — the surgical retirement above. F-39.33's
pre-derivation is discharged in §1d: the writer does **not** orphan, so that ZIP
retires the engine GET arms and `cabinet.js`'s slices only, and F-39.33 travels
to the writer-hygiene sitting still live.
