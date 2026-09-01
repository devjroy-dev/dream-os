# TDW · CE-39 · THE WRITER-HYGIENE SITTING — HANDOVER

**Base `238074f` (main), re-derived fetch-first at the cut. Sibling `dreamos-pwa`
`926c342` (worklist); the pwa twin cuts from that base and applies SECOND.**

**FLOOR = NAMED BASE, no delta, BOTH REPOS.** Run by SET against
`scripts/floor-base.txt` (R-38.19), `--delivery` mode, warm-up pass discarded
(LESSON 1), declared files verified unmoved by SHA before and after.
`b47` 22/0 · `b49` 13/0 (NEW) · `npm ci` + `npm run build` exit 0. pwa: FLOOR =
NAMED BASE, `b40` GREEN with C84, `tsc --noEmit` exit 0.

---

## 0 · THREE COLLISIONS THE RE-DERIVATION CAUGHT

This sitting was authored against `f188a69`/`bb4a9ad` and cut against
`238074f`/`926c342`. 2c walked in between. Every one of these would have shipped
broken had the cut trusted the read-first's tips.

1. **`b48` WAS TAKEN.** 2c's 2b-2 companion landed `b48_engine_mounts_bench.js`.
   This sitting's bench is **`b49`**.
2. **`b40` HAD GROWN TO C83.** The mirror cell was authored as C76; it is seated
   as **C84**, and the cross-reference in `expenses.js`'s header moved with it.
3. **2c REWROTE `expenses.js`'s HEADER.** It corrected the caller comment —
   c-2c.4 moved all three write routes into `money.js`, leaving
   `src/api/vendor/expenses.js` one engine-plane GET — and added a paragraph
   declaring F-2c.p1 OPEN with the array byte-untouched under arm (i). The cure
   REBASED onto it: **2c's caller correction is preserved verbatim**, its
   F-2c.p1-open paragraph **retires with the defect it described**, and the
   readers list is re-derived at the new tip, with a line stating explicitly
   that `api/vendor/expenses.js` is NOT a reader.

`run-floor.sh --delivery` also caught this seat's own contamination: a stale
`b48_writer_hygiene_bench.js` left in the tree from a prior cut, dirt outside
the manifest. Deleted before the floor was measured. The runner earned its keep
on the seat that added the mode's newest manifest.

---

## 1 · WHAT MOVED

| file | what |
|---|---|
| `src/lib/vendor/expenses.js` | `ALLOWED_CATEGORIES` reconciled to `expenses_category_check`, in the CHECK's order; `CATEGORY_REFUSAL` single-minted; the categories.js header shape (the CHECK it mirrors, the readers listed, the one mirror named) |
| `src/api/vendor/studio/payments.js` | the mark-paid expense leg routes through `createExpense`; failure is a declared partial, not a `console.warn` |
| `src/engine/src/core/tools/recordPrimitives.ts` | the `[money corrected …]` note append DELETED (F-39.23); the `new Set(['note'])` opt-in with it |
| `scripts/b47_money_crossing_bench.js` | §1.3 AMENDED — narrowed to c-2c.4's actual law; count preserved 22:22 (see §12) |
| `scripts/b49_writer_hygiene_bench.js` | NEW — 13 cells, 3 grounds |
| `scripts/floor-manifest-ce39-hygiene.txt` | NEW — the delivery's own file table |
| `docs/TDW_CE39_HYGIENE_HANDOVER.md` | NEW — this file |

**pwa twin (separate ZIP, applies SECOND):** `lib/vendor/types/common.ts` (the
declared mirror + `EXPENSE_CATEGORIES` as a value) ·
`components/vendor/AddSheet.tsx` (the picker derives from the mirror) ·
`scripts/b40_worklist_shell_bench.js` (§C84) ·
`scripts/floor-manifest-ce39-hygiene-pwa.txt`.

## 2 · THE VETOED SENTENCE, SHIPPED BYTE-FOR-BYTE

```
That is not a category we track. Pick one of: travel, equipment, assistant, studio, marketing, software, food, printing, commission, shoot, inventory, other.
```

Verified at the cut by `node -e "require('./src/lib/vendor/expenses.js').CATEGORY_REFUSAL"`
and pinned in full by `b49` §1.5, which reds if one word changes. It is minted
**once** — the create door and the update door both read the constant. Before
this sitting the sentence was built twice from the wrong list.

**The twelve are the DB's CHECK, unchanged. ZERO migrations.**

## 3 · F-39.23 — CURED BY DELETION

`patch.note = '[money corrected <date>] …'` is gone from `donna_money_edit`, and
so is the `new Set(['note'])` that opted `note` into the append set.

**The deletion is lawful only because the trail already existed twice on the same
write**, and `b49` §3.2 is the cell that keeps it lawful: it reds if either
witness goes.
- `writeFields` → `logEvent(agentId, 'update', id, label)`, label
  `money corrected — received: (empty) → Rs 15,000` — the audit log proper.
- `ALWAYS_APPEND = ['reason_for_action']` — the diary, appended by the same call.

Nothing about a correction is lost. It stops being said a third time in the one
column a human reads for their own words.

**THE FINDING WAS MISFILED ON EVERY PARTICULAR** (band 4; c-39.35 ratifies):

| filed | derived |
|---|---|
| `public.invoices.description` | **`engine.records.note`** |
| ₹ glyphs | **`Rs ` — ASCII**; `moneyWords():134`. The only non-ASCII byte is the `→` |
| implied clobber | **append**, with consecutive-duplicate dedupe |

The table was wrong because the engine's client is schema-scoped —
`src/engine/src/core/db.ts` builds it with `db: { schema: 'engine' }`. Every
`from('records')` and `from('events')` under `src/engine/**` is on the engine
plane, not `public`. `b49` §3.4 stands as the forward guard on
`invoices.description`, which no live writer touches.

`engine.records.note` **is** vendor-readable: `ledger.js:17` and `cabinet.js:26`
both project `note`, and `ledger` is mounted live under `/vendor/binders`. The
disease was real; only its address was wrong.

## 4 · THE SECOND EXPENSE WRITER

`studio/payments.js` opened `public.expenses` inline with a hardcoded category.
`assistant` is DB-legal, so nothing was broken — what was broken is that nothing
there **could** break visibly: the catch was `console.warn`, so a `23514` on that
row reached the vendor as an unqualified success.

Now: `createExpense`, and the response carries `expense_logged` /
`expense_error`. **The mark-paid still stands when the expense leg fails** — the
`team_payments` row is committed above it, and reversing settled money because a
derived bookkeeping row failed would be the worse lie. `b49` §2.4 asserts the
expense leg never re-touches `team_payments`.

**The description template at `:437` crosses BYTE-IDENTICAL** — `${memberName} —
${data.description}` / `Payment to ${memberName}`, founder-vetoed as-is by the
CE-39 relay.

**NEW RESPONSE BYTES, DECLARED:** `PATCH /studio/team-payments/:id/mark-paid` now
returns `{ payment, expense_logged: boolean, expense_error: string|null }`. Two
added keys; `payment` is unchanged. No pwa reader depends on the response shape
being exactly one key — checked at `bb4a9ad`.

## 5 · THE MIRROR, AND WHY IT IS NOT A DOOR

The pwa cannot import from dream-os — separate deploys, no shared package. The
chair ruled **authored home + witnessed mirror**, and refused a runtime
`GET /categories` door: runtime coupling on a picker, for a list that only ever
changes by migration.

`b40` **§C76** is the witness. It **REFUSES rather than passes** when
`../dream-os` is absent — the `base_guard` equality cell's shape, and the whole
point of it: a cross-repo cell that silently skips when it cannot see the other
tree goes green in exactly the situation it exists to catch. Proven by moving the
sibling out from under it.

Three legs, three different failures: home == mirror · union == runtime array (a
TS union does not survive to runtime, so both exist and both can drift) · the
picker derives its options and title-cases its labels. The **home == CHECK** leg
is `b49` §1.2's and is deliberately NOT duplicated here.

## 6 · THE CENSUS — FOUR LISTS, NOT TWO

The 2c handover found two homes. It swept dream-os; the pwa carried two more.

| token | DB CHECK | home (was) | pwa picker (was) | pwa type (was) |
|---|---|---|---|---|
| travel · equipment · assistant · studio · marketing · software · printing · food · other | ✓ | ✓ | ✓ | ✓ |
| **commission** | ✓ | ✗ | ✓ | ✓ |
| **shoot** · **inventory** | ✓ | ✗ | ✗ | ✗ |
| **editing** · **packaging** · **accommodation** | ✗ | ✓ | ✗ | ✗ |
| **supplies** | ✗ | ✗ | ✓ | ✓ |

`supplies` was accepted by **nobody** and offered in the vendor's picker.
`common.ts:2` called itself "single source of truth" and had drifted furthest.

**The rest of the census is CLEAN, reported as such rather than omitted:**
`invoices.state`, `events.state`, `team_payments.state`,
`payment_schedules.state` all match their mirrors exactly. `events.kind`'s picker
omits `blocked` **correctly** — `events_blocked_slot_check` requires a slot, so
`blocked` is the availability plane's to mint. `events.slot` has no code-side
copy. **One column in six was broken: the one that had never been censused.**

## 7 · NON-VACUITY — DISCLOSED, NOT PADDED

`b49` **13 PASS · 0 FAIL. Eleven cells mutation-proven** against production code:
1.2 (both directions — add `editing` → RED, remove `commission` → RED), 1.3
(re-order → RED), 1.4 (double-mint the sentence → RED), 1.5 (change one word →
RED), 2.1 (restore the inline insert → RED), 2.2 (drop the require → RED), 2.3
(swallow the failure → RED), 3.1 (restore the append + rebuild → RED at both
legs), 3.2 (drop `logEvent` → RED), 3.3 (restore the `Set(['note'])` → RED).
**Two labelled `PROVEN-ONE-WAY` at their sites:** 1.1 (its subject is the schema
doc, which is the witness, not the tree under test) and 3.4.

`b40` §C84 mutation-proven four ways: token added → RED · re-ordered → RED ·
picker stops deriving → RED · sibling absent → **REFUSED**.

Every mutated file restored **byte-identical**, verified by `cmp`.

**§1.2 reads the expected list out of `PUBLIC_SCHEMA.md` rather than carrying
it.** A bench that hand-writes the twelve words it expects is the same defect it
is testing for, one layer up — F-15.6's law applied to the instrument.

## 8 · THREE OF MY OWN CORRECTIONS, IN BAND

1. **`money.js:364` read as an insert.** It is the paragraph *forbidding* one.
   Caught before it reached the WRITERS table.
2. **`recordPrimitives.ts:73` and `distill.ts` read as `public.events`
   violations.** They are `engine.events` — the client is schema-scoped. What
   stopped it was the census, not the grep: `events_owner_xor` requires exactly
   one of `vendor_id`/`couple_id`, and `logEvent` sets neither, so on
   `public.events` every one of those calls would `23514` on contact. A rule that
   would make the code impossible is evidence about my reading.
3. **`b49` §2.1's first cut reddened on the island**, and **`b40` §C84 shipped two
   false legs** — one satisfied by a surviving `import` line while the picker no
   longer used it, one matching `label: 'Category'` on the clean tree. All three
   caught by mutation, not by reading. Both false legs are recorded at their
   sites rather than quietly replaced. F-39.25, three times over.

## 9 · THE ISLAND — NOTHING FROZEN MOVED

`src/agent/engine.js` is **byte-identical to `f188a69`**:

```
$ git diff f188a69 -- src/agent/engine.js
(empty)
```

`b49` §2.1 excludes the island's `log_expense` at `:1761` **by line position, not
by filename**, and REFUSES if the `F-05.56` header is ever deleted or moved — so
the exclusion cannot outlive the freeze that justifies it. A write ABOVE `:753`
is live and reds. That is the retire-with-the-reader seam the island's own
sitting inherits.

Second island recorded in passing: **`src/agent/tools.js` has zero importers.**
`update_invoice_prefix` is declared to nobody; its case body is inside the
island. Both ends dead. It rides the island's retirement.

## 10 · FINDINGS

- **F-2c.p1 — CURED.** Four homes → one authored home + one witnessed mirror.
- **F-39.23 — CURED, and re-filed for band 4** (`engine.records.note`, not
  `invoices.description`). c-39.35 ratifies the misfile.
- **F-39.29 — CLOSES.** One live minting site, `src/lib/vendor/invoices.js:72`
  (`if (!v.invoice_prefix)`). The island's `=== null` is void; `tools.js` is
  importer-dead. The 20-char cap is on the live REST setter,
  `src/api/vendor/me.js:486`; the mint derives from `business_name` and no
  vendor-supplied byte reaches it. **No second live minting site exists.**
- **F-2c.p2 — VOID.** No live multi-writer case for `client_id` or `pdf_url`.
- **F-39.20 — RE-FILED, NARROWED.** The events limb **closes**: `writeEvent` is
  the sole live writer of `public.events` on vendor paths, with zero live
  exceptions (every apparent one is island, importer-dead, engine-plane, or
  couple-owned). The money limb re-files as **F-39.33**.
- **F-39.33 — OPEN, cure DEFERRED past beta** (R-39.16 governs the class).
  Two live off-home `public.invoices` writers:
  `src/lib/vendor/schedules.js:42` (`.update({has_schedule:true})`, reached via
  `vendor/core.js:87`) and `src/api/vendor/invoices.js:380`
  (`.update({binder_id, amount_paid})`, reached via `vendor/core.js:39` and
  `index.js:23`). Both narrow and behaviourally correct today; the risk is drift,
  not breakage. **2c ZIP 2a's retirement of the binder-sync readers may make
  `invoices.js:380` dead on its own — the post-beta sitting re-derives before
  curing.**

## 12 · `b47` §1.3 — AMENDED, AND WHY THE NARROWING IS NOT A WEAKENING

The cure reddened a cell 2c had sealed three commits earlier. It was reported and
the cut was HELD; the chair ruled arm (a).

**What §1.3 asserted:** no ROUTED FILE outside `money.js` may call a typed writer
symbol. **Why that was the wrong subject:** it is a proxy for c-2c.4's law, and it
catches a case that is not a defect. `studio/payments.js`'s mark-paid is a STUDIO
route writing its own side-effect through the writer home — it mounts no money
endpoint and adds no second money address. Under the old wording the cell reddened
the very cure the sitting was chartered to build.

**What it asserts now:** ONE ADDRESS SPACE FOR THE MONEY VERBS — `/money` is
mounted exactly once, from `money.js`, and that door reaches the typed writers.

**The narrowing is a strengthening.** The strong property — nothing outside the
writer home opens `public.expenses` with a mutation verb — is what c-2c.4 was
reaching for, and it now lives at **`b49` §2.1**, mutation-proven both ways. It is
STRICTER than the line removed: the old cell permitted any non-routed file to open
the table inline so long as it never named a writer symbol, **which is exactly how
`studio/payments.js` opened `public.expenses` undetected for the whole of 2c.**
The guard did not shrink; it moved to the file that can state it properly and got
stronger on the way. Retire-with-the-reader, across two benches.

**COUNT PRESERVED: 22 PASS in, 22 PASS out**, verified by running the amended
bench against the clean base and the cured tree.

**A fourth F-39.25 on this arc, mine.** The amendment's first cut matched route
literals (`router.post('/invoices…`) and reddened `src/api/vendor/schedules.js`,
which mounts at `/` — its `/invoices/:id/schedule` is not under `/money` at all.
**A route string is not an address; `core.js`'s `router.use` is.** The cell now
derives the mount table and compares against it. Caught by running it.

Proven four ways: a second `/money` mount → RED · `/money` re-pointed at another
file → RED · `money.js`'s routes stripped (vacuity) → RED · `money.js` stops
reaching the home (vacuity) → RED. And the ruled cure direction — `payments.js`
keeps calling `createExpense` → **GREEN**. `core.js` and `money.js` restored
byte-identical after each.

The `generateInvoiceForBinder` exception retires with the wording that needed it;
F-39.33 still carries that finding, OPEN, cure deferred past beta.

## 11 · SQL

**ZERO migrations. No ladder number claimed.** Two founder-run SELECTs are
authored and handed up with this ZIP — both READ-ONLY, both with every column
witnessed against the schema docs by ordinal. Code never rewrites history; the
backfill decision is the founder's after he reads the rows.
