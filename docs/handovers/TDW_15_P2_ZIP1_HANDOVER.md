# TDW_15 · P2 · ZIP 1 (dream-os) — HANDOVER

Authored by the executor seat under CE-34, 2026-08-15.
Base tip: `856c8bf` (fetch-first, clean at seating).
Repo: `devjroy-dev/dream-os`.

---

## 1 · WHAT THIS ZIP IS

The app-plane half of P2 — Envelopes (R-4). Ten files: the migration that is
already on production, the row shape's new one home, the envelope doors, the
wall extension, two amended cells in P1's bench, and one known-ephemeral line in
the schema doc.

| file | state |
|---|---|
| `db/migrations/0088_envelopes.sql` | NEW — already EXECUTED on production |
| `src/api/couple/receiptColumns.js` | NEW — the row shape's one home |
| `src/api/couple/envelopes.js` | NEW — the envelope doors + `allowed[]` |
| `src/api/couple/receipts.js` | MODIFIED — reads the one home; gains the tag PATCH |
| `src/api/couple/expenses.js` | MODIFIED — **exactly two lines** |
| `src/api/couple/core.js` | MODIFIED — mounts `/envelopes` |
| `scripts/b14_d1_visibility_bench.js` | MODIFIED — the wall learns envelope bytes |
| `scripts/tdw15_p1_receipt_image.js` | MODIFIED — two ruled edits (R-34.38/.39/.40) |
| `scripts/floor-manifest-tdw15-p2.txt` | NEW — this delivery's declared dirt |
| `docs/db/PUBLIC_SCHEMA.md` | MODIFIED — one out-of-order row, **known-ephemeral** |

---

## 2 · THE MIGRATION IS ALREADY APPLIED

`0088` was executed by the founder in the Supabase SQL editor on PRODUCTION
(`nvzkbagqxbysoeszxent`, role `postgres`) BEFORE this ZIP was cut, and the
landing was WITNESSED off the catalogue rather than inferred from a green
`CREATE`:

- `amount_inr integer NOT NULL default 0` + `CHECK ((amount_inr >= 0))` — F-a's
  strike on the spec's `numeric` took.
- `couple_receipts.envelope_id -> budget_envelopes(id) ON DELETE SET NULL` and
  `budget_envelopes.couple_id -> couples(id) ON DELETE CASCADE` — F-b.
- `couple_receipts_unfiled_idx ... WHERE (envelope_id IS NULL)` — F-c, genuinely
  partial, so the index carries its own reason.

**Do not re-run it.** The file ships so the ladder holds the record; the plane
already holds the objects.

### 2a · 0088 IS AN OUT-OF-ORDER FILL, AND ITS WARNING LINE IS EPHEMERAL

The ladder tip is `0125`. `0088` was a reservation minted 2026-07-14 when `0087`
genuinely was the tip, redeemed now — the same shape as `0098_circle_visibility`
before it, which `PUBLIC_SCHEMA.md`'s own out-of-order table records as
precedent. LD-8 governs the ladder's GROWTH; a reservation IS the append.

Per F-SW.3's standing cure (R-34.18(i) / R-34.21) this delivery adds a row to
that table naming `0088`, `public.budget_envelopes` (a new table absent from the
body entirely) and `public.couple_receipts` (11 → 12 columns).

**THAT LINE DOES NOT SURVIVE A REGEN, AND THAT IS F-SW.7.**
`db/queries/format_public_schema.js` rebuilds everything above the sentinel
(`:108`) and preserves only the tail (`:451-459`). The out-of-order table is
hand-authored prose in the regenerated region and is not emitted by the script
(`grep -in "out.of.order" → empty`). So the founder's next regen deletes this
row **and `0098`'s with it**. The line is worth shipping — it buys days of
correctness for one line — but a reader must not mistake it for durable. The
structural cure (move below the sentinel · a preserved block · the script emits
it) is chartered as its own micro at the schema desk and **wants to land BEFORE
the regen, not after** — otherwise the regen is the thing that executes the
deletion.

**The holes list is NOT hand-edited.** It is derived at `:382-386` off
`ladder.gapsAbsent`. Once `0088_envelopes.sql` is on disk, regen drops the
number and recomputes 19 → 18 by itself. R-34.18(ii) was withdrawn for exactly
this reason. `F-SW.6`'s reader-facing defect (the derived list naming `0098`,
which landed eight minutes after that regen) self-heals the same way.

---

## 3 · F-15.11 CURED — THE ROW SHAPE HAS ONE HOME

The receipt column list lived as **three** byte-identical copies under a comment
asserting one:

```
receipts.js:17   const RECEIPT_COLUMNS = '...'    ← one reader (:192)
receipts.js:84   inline .select('...')
expenses.js:27   inline .select('...')
```

The comment — *"one literal, three readers"* — was false the day it was written.
P2 is the edit that would have broken the three copies apart, because
`envelope_id` must reach her list or the unfiled tray reads empty.

Cured under R-34.35 with the home at `src/api/couple/receiptColumns.js`
(R-34.37). The neutral module was ruled over an export from `receipts.js`
because `expenses.js → receipts.js` makes a route file a library for its
sibling, leaving the next hand editing `receipts.js` no signal that another
route's response shape rides on their constant. Estate precedent for the same
cure: `src/lib/vendor/categoryFraming.js` and the pwa's `lib/frost/budgetBands.ts`.

**`expenses.js`'s diff is exactly two lines** — the `require` and the `.select()`
— provable by `git diff --stat` and by the verify block below. Nothing else in
that file moved.

### 3a · THE READERS CENSUS, BOTH PATHS

- **Live path.** `journey.ts:406-411` — `fetchReceipts()` calls
  `GET /api/v2/couple/expenses/:id` and returns `r.expenses`. `expenses.js:27` is
  the tray's real source.
- **Dormant path.** `couple.ts:126` `fetchCoupleReceipts` has **zero callers**;
  its only occurrences are its own definition, its type import, and the type's
  declaration (`bride.ts:231`) and mock. It stays in the cure regardless — the
  door is live and reachable, and a dead client is exactly the reader that goes
  stale unnoticed. `deleteReceipt` / `uploadReceiptImage` on that same door ARE
  live from `journey.ts`.

Both types are structural interfaces over the row with no exhaustive-key work,
so the added field breaks neither. Derived per path, not asserted once (R-34.36).

**`journey.ts:161`'s comment is a column census listing the nine.** It goes stale
the moment `envelope_id` lands and is updated in ZIP 2 — the file's own census,
not bookkeeping.

---

## 4 · THE DOORS

```
GET    /api/v2/couple/envelopes/categories          the canonical eleven
GET    /api/v2/couple/envelopes/:coupleId           envelopes + spend floor
GET    /api/v2/couple/envelopes/:coupleId/unfiled   the tray
POST   /api/v2/couple/envelopes/:coupleId           create
PATCH  /api/v2/couple/envelopes/:envelopeId         rename / re-ceiling / sort
DELETE /api/v2/couple/envelopes/:envelopeId         delete — receipts UNFILE
PATCH  /api/v2/couple/receipts/:receiptId           the envelope tag (file it)
```

Every door scopes by the JWT's own `couple_id`, never by a body or query value.
The tag PATCH lives on the **receipts** router because it mutates a RECEIPT; a
receipt mutation on an envelope route would be a second home for this row's
write path. `envelope_id: null` is a legal body — that is unfiling by her hand.

### 4a · THE `allowed[]` DOOR IS A READ, AND IT IS NOT A CURE (R-34.34)

`VENDOR_CATEGORIES` is imported from `src/agent/categories.js` — the ONE home,
never re-declared. (`src/api/couple/bookings.js:87` re-declares a stale allowlist
inline; that is F-15.10's second limb and repeating the shape here would have
made a two-homes defect a three-homes one.)

**THIS DOOR DOES NOT CURE F-15.10.** Her bookings remain constrained by
`couple_bookings_category_check`, which carries the pre-0123 eleven —
`photographer · videographer · mua · designer · venue · caterer · decor ·
florist · music · planner · other` — of which only `designer`, `decor` and
`other` agree with the canonical set. An envelope named `jewellery` cannot match
a booking today because she cannot categorise a booking as `jewellery` at all.
Reconciliation lands when F-15.10's micro moves that CHECK and backfills live
rows. Until then her envelope names are hers alone. **No reader should mistake
this door for that cure.**

### 4b · THE SPEND FLOOR IS HONEST, NOT COMPLETE (R-34.22)

`couple_receipts.amount` is NULLABLE and its CHECK explicitly permits NULL. So a
receipt can be **FILED and contribute ZERO** — that is F-15.9 appearing in the
schema. `envelope_id IS NULL` (unfiled) and `amount IS NULL` (untyped) are two
different emptinesses and no reader may conflate them. `spent` is therefore a
floor, not a total, which is why the hairline that renders it carries no words.

---

## 5 · THE WALL EXTENSION (R-34.16 / R-34.20)

`b14_d1_visibility_bench.js` §6's MONEY alternation named four tables and five
field words, and `envelope` appeared nowhere in the file. `budget_envelopes` was
not watched, `envelope_id` was not watched, and `amount_inr` does not match
`\bamount\b` because `_` is a word character and the boundary never fires. The
family was blind to the exact bytes 0088 minted.

- `budget_envelopes` joins the table alternation; `envelope_id` and `amount_inr`
  join the field alternation.
- **§6.10 / §6.11 / §6.12** — three cells, one per token, because R-34.20
  requires each to red for its own. One cell over three tokens would go green on
  two while a third leaked.
- **§6.13** — the non-vacuity guard. `couple_receipts.amount` is live and
  `\bamount\b` already matches it, so a naive cell could go green on a word that
  predates 0088 by six blocks. This cell proves `ENVELOPE` is a stricter
  instrument than `MONEY` and does not fire on the pre-existing word.
- §6.8's family count stays honest at NINE. No envelope byte crosses to any of
  the nine.

### 5a · BOTH-WAYS LEDGER — mutations on PRODUCTION code, all restored byte-identical

| mutation | red | others |
|---|---|---|
| `budget_envelopes` injected into `src/api/circle/feed.js` | §6.10 | quiet |
| `envelope_id` injected into `src/api/circle/feed.js` | §6.11 | quiet |
| `amount_inr` injected into `src/api/circle/feed.js` | §6.12 | quiet |
| `ENVELOPE` loosened to match bare `amount` | §6.13 | quiet |

Each token reds ONLY its own cell.

### 5b · R-33.10 WAS MINTED OUT OF THIS DELIVERY'S OWN NEAR-MISS

The first §6.13 mutation run reported "no red" and it was **the verifier that was
vacuous, not the cell**: the check grepped for `FAIL §6.13`, and `§` is
multi-byte while `.` matched a single byte, so the pattern could never have hit a
failure if one existed. Reading the run's own output showed 35/1 with the
intended message. Standing law now: *a non-vacuity claim is made from the run's
own output, never from a grep over it; the instrument that checks a mutation is
itself subject to the both-ways standard.*

---

## 6 · P1'S BENCH AMENDED — F-15.12

The floor found what the census missed: two cells in
`scripts/tdw15_p1_receipt_image.js` pinned the PRE-cure shape.

- **2.4** asserted `/const RECEIPT_COLUMNS\s*=/` inside `receipts.js` with the
  message *"the shared column literal is gone"*. Right that the literal left,
  wrong about what that meant. Amended under R-34.38 to assert the INVARIANT —
  declared in `receiptColumns.js` · imported by `receipts.js` · selected by the
  image door · selected at `expenses.js`. **Strictly stronger**: it now proves
  the three-way sharing that P1's comment only claimed. Amended at BOTH sites
  (the cell and the mutation map) so they cannot drift.
- **M4**'s anchor `    .select(RECEIPT_COLUMNS)` became ambiguous — three hits in
  `receipts.js` after P2 — and R-33.4 fired correctly. Re-anchored under R-34.39
  onto the `.insert(row)` + `.select(RECEIPT_COLUMNS)` pair, unique to the image
  door. Mutation meaning and its red (2.4) unchanged.

**F-15.12, OPEN as doctrine:** a cell that pins WHERE a constant lives is a
tripwire against ever giving that constant a better home. 2.4 did not catch a
defect — it caught a cure. Cells assert the ruling (R-33.2), and "the literal is
in this file" was never the ruling; "one home, three readers" was. No sweep
chartered; it is a lens for the next author.

The widening into P1's bench was GRANTED and scoped (R-34.40) to exactly these
edits. Nothing else in that file moved.

---

## 7 · WHAT IS NOT IN THIS ZIP, AND WHY

- **The WhatsApp/tool parity arm.** `brideTools.js`, `brideEngine.js` and
  `miraSoul.js` take ZERO lines (R-34.15). R-31.2 fences the first two for Row
  9's pending seat and W-1 shuts the soul. The schema is left **additive-only**
  so that arm lands without a migration.
- **Drag-to-file.** Deferred and chartered separately (R-34.28). Press-to-file
  ships instead: HTML5 DnD does not fire on touch, the bride plane is a phone,
  and the estate's one drag surface (`AdminUI.tsx:450,469-471`, admin/desktop)
  already pairs its drop with an `onClick` fallback because its author knew the
  same thing.
- **F-15.10's cure.** Not P2's (R-34.32). Needs a migration, a live-row backfill
  and a plane-crossing readers census.
- **F-SW.7's cure.** Chartered at the schema desk.

---

## 8 · FLOOR

`bash scripts/run-floor.sh --delivery scripts/floor-manifest-tdw15-p2.txt --check`
→ **`FLOOR = NAMED BASE, no delta`**, with
`[F-14.16] declared files unmoved — set and contents both verified.`

Twenty pre-existing reds, matched **by name** and not by count (LESSON 2). They
are the standing floor and none is this delivery's to cure.

`node --check` clean on every touched file.
`b14_d1_visibility_bench` 36/36 · `tdw15_p1_receipt_image` 26/26.

---

## 9 · HANDS TO ZIP 2 (dreamos-pwa)

The verbatim `CAT_LABEL`/`labelFor` lift to `lib/frost/categoryLabels.ts`
(R-34.33 — a MOVE, not an edit; zero label strings authored), the picker built
from THIS repo's `/envelopes/categories` response (never `Object.keys`), the tag,
the tray, the hairline (`inkSoft` below / `accent` above / rail stays `line`,
R-34.29), press-to-file, `journey.ts:161`'s census update, the four ruled copy
strings and five chrome bytes, and the matrix ticks in the document.
