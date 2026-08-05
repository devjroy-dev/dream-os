# TDW_09 · SITTING 1 · PAPER 4 — THE SPOTLIGHT CONSOLIDATION PLAN

**Authority:** MASTERPLAN row 09 · CE-123 (founder-ruled 「 merge 」) · CE rulings R-U5 (F4 arm (b)) and R-U6 (scope = the whole derived footprint).
**Bases:** dream-os `b0d7822` · dreamos-pwa `e3210b5`.
**The table drop is founder SQL and never the executor's.** Nothing in this paper is runnable.

---

## 1 · THE FOOTPRINT, DERIVED WHOLE (R-U6)

The charter named three limbs. The tree carries **eleven sites across two repos**, and the charter's own word — *whole* — governs its under-enumeration.

### Backend — `devjroy-dev/dream-os`

| # | Site | What |
|---|---|---|
| 1 | `src/api/router.js:49` | mounts `/admin/discover-heroes` → `discoverHeroes.adminRouter` |
| 2 | `src/api/router.js:58` | mounts `/discover-heroes` → `discoverHeroes.publicRouter` |
| 3 | `src/api/admin/discoverHeroes.js` | the module. Table touched at `:14`, `:24`, `:31`, `:46`, `:53`, `:55`, `:63` |
| 4 | **`src/api/couple/discover.js`, symbol `router.get('/heroes')`** | **THE THIRD READER — the charter's "both endpoints" does not name it.** This is the consolidation's core site: it *is* the top-of-feed slot |
| 5 | `db/migrations/0044_discover_heroes.sql` | the only migration touching the table; **no ALTER anywhere in the ladder** |

### Frontend — `devjroy-dev/dreamos-pwa`

| # | Site | What |
|---|---|---|
| 6 | `app/admin/discover-heroes/page.tsx` | **screen 1** — six fetch sites: `:60`, `:106`, `:121`, `:134`, `:164`, `:196` |
| 7 | `app/admin/content/heroes/page.tsx` | **screen 2** — a 5-line `ContentPage` shim |
| 8 | `app/admin/layout.tsx:109` | the nav entry — points at **screen 2** |
| 9 | `lib/frost-api/discover.ts:58` | couple-lane client for `/api/v2/discover/heroes` |
| 10 | `lib/admin-api/index.ts:125` | `contentApi('/api/v2/admin/discover-heroes')` |
| 11 | `lib/admin-api/index.ts:126` | `list: () => adminGet<{ heroes: AdminImage[] }>(…)` |

---

## 2 · **F-09.8 — THE CE-123 SITE ARITHMETIC IS WRONG IN BOTH DIRECTIONS, AND THE ORPHAN IS THE ONE WITH THE SITES**

CE-123 removed *"the admin discover-heroes screen's three sites"* from F-07.95's Block-10 list on this sitting's promise to retire the screen. Derived at `e3210b5`:

- **Screen 1 (`/admin/discover-heroes`) carries SIX client sites, not three** — and **nothing links to it.** `grep -rn "admin/discover-heroes"` across `app`, `components`, `lib` returns only the two `lib/admin-api` strings and screen 2's unrelated `adminBase` config. It is not in `app/admin/layout.tsx`. **It is link-orphaned — F-07.93's class exactly.** Retiring it removes six sites, which *over*-delivers on the promise.
- **Screen 2 (`/admin/content/heroes`) is the one in the nav** (`layout.tsx:109`) and carries **zero sites of its own.** It is a 5-line shim passing a `cfg` to `app/admin/ContentPage.tsx`, whose six fetch sites (`:34`, `:52`, `:53`, `:63`, `:72`, `:80`) are **shared with four sibling screens** — `content/exploring`, `content/landing`, `content/muse-pool`, `content/surprise-me`. **Deleting screen 2 deletes a config object and no sites at all.** The sites survive for the four siblings and remain Block 10's.

**Consequence, per R-U6's "named appendix, never a silent inheritance":** the CE-123 promise is honoured by enumeration. Six sites leave Block 10's list with screen 1. **Zero leave with screen 2**, and `ContentPage`'s six shared sites stay Block 10's, now with one fewer consumer. This appendix is the record of that, and it is a *net improvement* on the promise, not a shortfall — stated in both directions so nobody has to reconstruct it.

---

## 3 · **F-09.12 — THE TOP-OF-FEED SLOT MAY HAVE BEEN DEAD SINCE IT SHIPPED** *(the fork the SELECT settles)*

`src/api/couple/discover.js`, symbol `router.get('/heroes')`, selects:

```
id, name, image_url, caption, routing_handle
```

Three witnesses, three different column lists, none agreeing:

| Witness | Columns |
|---|---|
| `db/migrations/0044_discover_heroes.sql` | `id, vendor_id, image_url, caption, display_order, active, created_at` — **7** |
| `docs/db/PUBLIC_SCHEMA.md:397` (starting witness, ladder tip `0099`) | `id, image_url, cloudinary_public_id, caption, display_order, active, created_at, updated_at` — **8**, **no `vendor_id`** |
| the live reader | `id, name, image_url, caption, routing_handle` — **`name` and `routing_handle` appear in neither** |

`db/BASELINE.md:82` records 8. No migration in the ladder ALTERs the table, so production has drifted from `0044` outside the ladder: `cloudinary_public_id` and `updated_at` gained, `vendor_id` apparently lost.

**The fork, both arms stated:**

- **Arm A — the doc is stale on this table too.** `name` and `routing_handle` exist in production, added out-of-ladder like the other two. The endpoint works; the consolidation proceeds as a straight remap.
- **Arm B — the reader is broken.** PostgREST returns an **error** on a select naming a column that does not exist; it does not return a partial row. If `name` and `routing_handle` are absent, `error` is truthy on every call, `heroes` is null, and control falls to the vendor fallback at `discover.js`'s `.from('vendors')` leg **every single time**. The eight `discover_heroes` rows would never have reached a bride through this door, and the "top-of-feed slot" the charter is consolidating would already be serving vendors, not heroes.

**Not asserted either way.** The SELECT in §5 settles it, and it must be run before a drop byte or a remap byte is authored. Arm B does not change the ruling — CE-123 says retire whole either way — but it changes what the founder is told about what he is losing, and it changes whether the spotlight slot is a *replacement* or a *first implementation*.

---

## 4 · THE PLAN

### Limb 1 — the top-of-feed sanctuary slot renders from SPOTLIGHT *(the core site)*

`src/api/couple/discover.js`'s `/heroes` handler is re-pointed at `public.spotlight`, witnessed at `docs/db/PUBLIC_SCHEMA.md:756` — 9 columns: `id, vendor_id, image_url, cloudinary_public_id, caption, week_label, active, sort_order, created_at`.

- Ordering: `active = true`, ordered by `sort_order` — the sibling of the retired `display_order`.
- **Vendor-linked cards** (`vendor_id NOT NULL`) tap through to the vendor profile.
- **Unlinked cards** (`vendor_id IS NULL`) are editorial — image and caption, no tap target.
- The existing vendor fallback leg is **kept**, unchanged: an empty spotlight still yields a feed.
- `lib/frost-api/discover.ts:58` keeps its path `/api/v2/discover/heroes` **in limb 1** so the wire does not move while the source does. The path rename is limb 4, separable and separately provable.

### Limb 2 — the admin surface

Screen 1 deleted whole (six sites). Screen 2's `cfg` deleted; `app/admin/layout.tsx:109`'s nav entry re-pointed to `/admin/content/spotlight`, which already exists (`app/admin/content/spotlight/page.tsx`, backed by `src/api/admin/spotlight.js`, mounted at `router.js:48`/`:57`). **The admin loses nothing it can do today** — spotlight's admin surface is already complete, including upload, PATCH, and DELETE.

### Limb 3 — the backend retirement

`src/api/admin/discoverHeroes.js` deleted; `router.js:49` and `:58` removed; `lib/admin-api/index.ts:125–126` removed. `tsc --noEmit` against a cleared `.next` per §6's deletion clause.

### Limb 4 — the path rename *(separable, founder-sequenced)*

`/discover/heroes` → `/discover/spotlight`, with `lib/frost-api/discover.ts:58` following. Held separate because it is the only limb that can break a deployed client mid-push.

### Limb 5 — the table drop *(founder SQL + migration `0113`, per R-U5 / F4 arm (b))*

Authored **only after** the SELECT in §5 returns. `0113` records the drop for ladder legibility; the founder's hand performs it. Destructive-DB law applies: founder sign-off, a CSV export of the eight rows taken first, the action logged in the handover.

---

## 5 · THE PROVENANCE SELECT — FOUNDER-RUN, ZERO PLACEHOLDERS

Run this in the Supabase SQL editor and paste the rows back. **Nothing else in this arc is authored until it returns.** It settles both tables' true columns, F-09.12's fork, and the row counts the export must match.

```sql
-- TDW_09 Sitting 1 · the settling witness for the spotlight consolidation.
-- Starting witnesses: docs/db/PUBLIC_SCHEMA.md:397 (discover_heroes, 8 cols)
--                     docs/db/PUBLIC_SCHEMA.md:756 (spotlight, 9 cols)
-- That doc's header records its snapshot at ladder tip 0099; the applied tip is
-- 0112, so it is a STARTING witness only (protocol §10, SQL-PROVENANCE LAW).
-- Read-only. No writes, no DDL.

-- (1) The true columns of both tables, in ordinal order.
SELECT table_name, ordinal_position, column_name, data_type, is_nullable, column_default
FROM   information_schema.columns
WHERE  table_schema = 'public'
  AND  table_name IN ('discover_heroes', 'spotlight')
ORDER  BY table_name, ordinal_position;

-- (2) F-09.12's fork, settled in one row: do the two columns the live reader
--     selects (src/api/couple/discover.js, symbol router.get('/heroes'))
--     actually exist on discover_heroes?
SELECT
  bool_or(column_name = 'name')           AS has_name,
  bool_or(column_name = 'routing_handle') AS has_routing_handle,
  bool_or(column_name = 'vendor_id')      AS has_vendor_id,
  count(*)                                AS total_columns
FROM   information_schema.columns
WHERE  table_schema = 'public' AND table_name = 'discover_heroes';

-- (3) What the drop would destroy, and what spotlight can carry in its place.
SELECT 'discover_heroes' AS tbl, count(*) AS rows, count(*) FILTER (WHERE active) AS active_rows
FROM   public.discover_heroes
UNION ALL
SELECT 'spotlight', count(*), count(*) FILTER (WHERE active)
FROM   public.spotlight;

-- (4) The spotlight split the slot's card logic branches on:
--     linked cards tap to a profile, unlinked cards are editorial.
SELECT count(*) FILTER (WHERE vendor_id IS NOT NULL) AS vendor_linked,
       count(*) FILTER (WHERE vendor_id IS NULL)     AS editorial
FROM   public.spotlight
WHERE  active;

-- (5) Anything else in the schema still referencing discover_heroes —
--     views, constraints, or functions the code census cannot see.
SELECT c.conname, c.contype, c.conrelid::regclass AS on_table
FROM   pg_constraint c
WHERE  c.confrelid = 'public.discover_heroes'::regclass
    OR c.conrelid  = 'public.discover_heroes'::regclass;
```

**Independent-method note:** query (5) exists because queries (1)–(4) all read `information_schema.columns` and share its failure mode. A dependent view or foreign key is invisible to a column census and would make the drop fail — or worse, cascade. Its failure mode is different, which is the only reason it is worth running.

---

## 6 · WHAT THIS PAPER DOES NOT DO

- **FEATURED is untouched.** It is the paid pipeline. `app/vendor/featured/page.tsx` and `app/demo/vendor/[handle]/featured/page.tsx` both carry `Rs 3,000 / week` in the compliant register and are not this paper's.
- **The spotlight ranking-boost coupling stands by default** per row 09, revisitable at this block's veto. `src/api/couple/discover.js` reads `spotlight` for `spotlightNorm` at its ranking leg today; limb 1 does not change that read.
- **No drop byte, no migration byte, and no remap byte is authored** until §5 returns.

---

## 7 · FINDINGS MINTED IN THIS PAPER

**F-09.8** — the retirement's site arithmetic corrected in both directions: screen 1 is link-orphaned with six sites; screen 2 is the linked one with zero sites of its own, its six shared with four siblings and staying Block 10's.
**F-09.12** — three witnesses disagree on `discover_heroes`' columns and the live reader names two that appear in none; the top-of-feed endpoint may have been serving its fallback since it shipped. Settled by §5's SELECT, not by this paper.
