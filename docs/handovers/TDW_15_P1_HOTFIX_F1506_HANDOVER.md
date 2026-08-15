# repo: dream-os · TDW_15 · P1 · HOTFIX — F-15.6, THE NULL THE COLUMN CANNOT TAKE

**Seat:** LE (executor) · **Found by:** the founder's walk, step 8, on production
**Base:** `dream-os 0a89a6b` · **Sibling:** `dreamos-pwa c6e631d`, untouched
**Files:** 3 — one production line, its bench, this note. No migration.

---

## 1 · THE DEFECT

`POST /couple/receipts/:coupleId/image` returned **500** twice on the walk. Zero receipts written.

```
couple_receipts.tags   text[] NOT NULL default ARRAY[]::text[]
                       (docs/db/PUBLIC_SCHEMA.md:287, column 9)
```

`buildReceiptRow` emitted **`tags: null`** for a row with no tags and no notes — which every bare photo upload is. **An explicit null does not fall back to a column default.** It violates `NOT NULL` and the insert throws. The handler caught it, logged it, and returned the honest 500 it was written to return.

## 2 · THE PART THAT MATTERS MORE THAN THE FIX

**This file's typed POST has carried that null since birth and could never have written a row.** Not "was subtly wrong" — could not insert, ever, on the same path.

Nobody noticed because **nobody had ever used it**. Fixture 2, run before the walk, returned `receipts 0`. The door's entire history is consistent with it having been broken from the day it shipped.

**Three writers reach this table and only this one was wrong:**

| writer | tags | outcome |
|---|---|---|
| `couple/expenses.js:63` | `: []` | correct, always |
| `brideEngine.js` `save_receipt` | **omits the column** — the default fires | why WhatsApp has always worked |
| `couple/receipts.js` | `: null` | could not write |

The correct expression was eighteen inches away in a sibling file the whole time.

## 3 · MY ERROR, NAMED

ZIP 1 extracted this expression **byte-faithfully and pinned the null with a bench cell**, on the stated reasoning that a UI sitting must not move a live persistence rule. The handover called it *"live shipped behaviour"* and *"not this delivery's to cure."*

**The reasoning was right and the fact was wrong.** The rule was never live. A behaviour with zero successful executions is not shipped behaviour — it is a defect with a long tenure, and preserving it preserved nothing.

Worse: the cell I wrote to guard it was **pinning a value the database has never once accepted**, and it was green. A cell can be green, non-vacuous, mutation-proven, and still asserting a fiction — because it never asked whether the value could be written. **The founder's thumb settled in one tap what the derivation could not**, which is the maxim's specimen again.

## 4 · THE CURE

```js
tags: Array.isArray(tags) ? tags : (notes ? [notes] : []),
```

One line. Both doors go through the shared builder, so the typed POST is cured in the same stroke — its first working day since it shipped.

## 5 · THE BENCH MOVED WITH THE FACT

- **6.4** now pins `[]` instead of `null`, with its own amendment recording that it had been pinning a defect.
- **6.5 NEW** — the builder can never emit null for `tags` under five caller shapes, so a future "tidy" toward the sibling doors cannot reintroduce it through a path the old cell missed.
- **6.6 NEW** — reads `NOT NULL` **out of the schema witness** rather than remembering it. If a regen ever shows the column nullable, this reds and §4's comments become history rather than law.
- **M5 amended with its cell** — it used to break 6.4 by removing the notes fallback; it now breaks it by **reintroducing the null**, which is the failure that actually reached a user.

```
CURED  (0a89a6b + this)   26 passed, 0 failed · 6 mutations, all biting
BASE   (0a89a6b)          24 passed, 3 failed — 6.4, 6.5 RED by name; M5's anchor absent
```

6.6 is green both ways **by design**: it asserts the constraint, which the defect never changed.

## 6 · WHAT THE WALK PROVED BESIDES THE BUG

Steps 2–7 and 9 all green on production: create, edit, the unlabelled ring settling a day into `Done` and back with the head appearing and vanishing, the picker showing exactly the three active seats out of five rows, the confirm sheet, the hard delete, `+ ASK MIRA`. Fixture 1 came back `3 / 3 / 0 / 0` — the room restored to where it started, which is what a clean walk looks like.

## 7 · CARRIED FORWARD

- **F-15.7 (chair to mint): the payment date is collected and discarded.** `record_payment`'s own signature comment says `p_payment_date` is *"accepted but not stored on booking; receipts hold the date"* (`0019_bride_planner.sql:191`), and `bookings.js` hardcodes `p_receipt_id: null`. The sheet asks for a date that has nowhere to go. Three shapes proposed at the walk; P2's, not this hotfix's.
- The receipt vault's own copy still reads *"Forward receipt images to Dream Ai on WhatsApp"* — unruled, therefore unbuilt, and now half-false twice over.

**Sequencing beyond this delivery is the founder's.**
