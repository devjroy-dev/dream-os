-- 0160_date_checks.sql
-- TDW_19 · G4.4 · R8-1 (F-42.11) — THE DEMAND PULSE GETS A SOURCE.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHY THIS TABLE EXISTS AT ALL
-- ═══════════════════════════════════════════════════════════════════════════
-- The roadmap's row F (docs/specs/TDW_CE41_ROADMAP.md:45) reads "demand pulse
-- from `date_checks` (`0140`)". Both halves of that sentence were wrong and
-- F-42.11 named it: `0140_date_check_switch.sql` adds ONE COLUMN,
-- `vendors.date_check_enabled` (PUBLIC_SCHEMA.md:1434, attnum 58), and no
-- table; `grep -n "^## public.date_checks" docs/db/PUBLIC_SCHEMA.md` returns
-- nothing. `date_checks` existed in exactly two places in the estate, both
-- prose — master :118 and the roadmap line above.
--
-- The consequence was silent and total: `src/api/public/availability.js` has
-- answered strangers about named dates since G3.1 and RECORDED NOTHING. Every
-- check made on `/v/` is gone. G4.4's pulse ("3 brides checked Nov 22 on your
-- page this week") had no source, and would have had none however long anyone
-- waited, because nothing was accumulating.
--
-- Fork A was ruled (α): a pulse needs ROWS, not a counter column. A counter
-- cannot answer "this week" and cannot be grouped by date, which is the only
-- two questions R8-2 asks of it.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHAT IS RECORDED — THE CHECK, NEVER THE ASKER (Fork B, ruled)
-- ═══════════════════════════════════════════════════════════════════════════
-- No phone. No IP. No session. No cookie. No hash of any of them. A row here
-- says "somebody asked this vendor about this date at this time" and there is
-- no column that could ever say who.
--
-- ⚠ THE COST OF THAT IS NAMED RATHER THAN LEFT TO BE DISCOVERED (F-42.51). A
-- table with no asker key cannot tell three brides apart from one bride
-- refreshing three times. These rows are therefore CHECKS, NOT PEOPLE, and
-- master :117's sentence — "3 brides checked Nov 22" — cannot be spoken from
-- them. R8-2's copy reads *checks*; the founder holds that byte's veto when
-- its frame comes. The alternative (a coarse asker hash) is a reversal of
-- Fork B and was not taken.
--
-- ── R-40.118 · WHAT THIS PLANE SERVES, STATED AT THE WRITER ────────────────
-- PAST EVENTS: SERVED. A check on a date already gone is recorded like any
-- other. Derived, not assumed: `availability.js:78-84`'s `isRealDate` tests
-- only that the string is a calendar date that round-trips, never that it is
-- in the future, so past dates already reach the door and already get an
-- answer. Nothing in this migration or its writer changes that, and the pulse
-- counts them: a bride asking about a date behind us is still demand, and the
-- vendor is entitled to see it.
-- OFF-TDW EVENTS: NOT ASKED, AND UNKNOWABLE HERE. This door answers a stranger
-- one word about one date. It has no wedding, no event row and no counterpart
-- to attribute anything to, so there is no sense in which a check is on or off
-- TDW. The column that would carry it is deliberately absent rather than
-- carried null.
-- OUTSIDERS: SERVED, and they are the whole point — every asker at this door is
-- a stranger by construction.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- SQL PROVENANCE (§10) — EVERY COLUMN'S WITNESS, BY LINE
-- ═══════════════════════════════════════════════════════════════════════════
-- ⏳ STALENESS DERIVED, NOT ASSUMED. `docs/db/PUBLIC_SCHEMA.md` names its
-- applied ladder tip as `0154` and declares itself stale for any table a newer
-- migration touches. The tree holds five newer: `0155` writes
-- `public.capabilities` (insert/update only), `0156`/`0157` `public.prospects`,
-- `0158` `public.assistance_found_notices`, `0159` `engine.messages`. NEITHER
-- `public.vendors` NOR `public.hot_dates` IS AMONG THEM, so the snapshot is a
-- live witness for both tables this migration touches. `OUT_OF_ORDER.json`
-- carries no outstanding record.
--
--   id          — `gen_random_uuid()`, not `uuid_generate_v4()`. Witnessed at
--                 PUBLIC_SCHEMA.md:720 (`hot_dates.id`) and :733
--                 (`image_throttle_log.id`), which are this estate's recent
--                 spelling. `vendors.id` (:1385) carries the older
--                 `uuid_generate_v4()` and is deliberately NOT the model.
--   vendor_id   — references `public.vendors(id)`, witnessed at
--                 PUBLIC_SCHEMA.md:1385 (the column) and :2402 / :4160
--                 (`vendors_pkey`, both the constraint and its unique index).
--                 ON DELETE CASCADE is the estate's convention, DERIVED rather
--                 than remembered: the constraints addendum §2 carries 45
--                 `REFERENCES vendors(id) ON DELETE CASCADE` against 8
--                 `ON DELETE SET NULL`. NOT NULL forbids SET NULL here anyway —
--                 a check with no vendor is not a check.
--   date        — type `date`, and the column is NAMED `date`. Witnessed at
--                 PUBLIC_SCHEMA.md:721, `hot_dates.date date NOT NULL`, which
--                 is the estate's only precedent for this name and settles that
--                 Postgres accepts it unquoted.
--   checked_at  — `timestamp with time zone NOT NULL default now()`, witnessed
--                 at PUBLIC_SCHEMA.md:724 (`hot_dates.created_at`) and :736
--                 (`image_throttle_log.created_at`). Named `checked_at` rather
--                 than `created_at` because master :118 names it:
--                 `date_checks (vendor_id, date, checked_at)`.
--
-- ── CONSTRAINTS (R-40.27) ──────────────────────────────────────────────────
-- WRITES public.date_checks: NEW TABLE. It inherits no constraint because it
-- has no prior state. It CREATES `date_checks_pkey` and
-- `date_checks_vendor_id_fkey`, and it POINTS AT `vendors_pkey`
-- (PUBLIC_SCHEMA.md:2402) as its FK target — that constraint is read, never
-- altered: no key on `vendors` is created, dropped or re-pointed by this file,
-- and no existing `vendors` row is read or written.
-- WRITES public.hot_dates: its constraints section carries `hot_dates_pkey`
-- (§1 PUBLIC_SCHEMA.md:1960-1963) and its indexes carry `hot_dates_pkey`
-- (§3 :3658-3659) and `idx_hot_dates_date` (§3 :3660-3661). THIS FILE TOUCHES
-- NEITHER. Adding a NOT NULL column with a DEFAULT backfills every existing row
-- to 'admin' in one pass and creates, drops and re-points nothing.
--
-- ── ORDER (LD-8, R-40.44) ──────────────────────────────────────────────────
-- 0160, allocated by the chair in the R8-1 kickoff §4 ("Migration number 0160,
-- allocated here; do not claim another"). The applied ladder tip is 0159, so
-- this fills no reserved hole and `OUT_OF_ORDER.json` takes NO record —
-- F-SW.3's cure applies only BELOW the tip, and 0160 is above it.

create table if not exists public.date_checks (
  id         uuid not null default gen_random_uuid() primary key,
  vendor_id  uuid not null references public.vendors(id) on delete cascade,
  date       date not null,
  checked_at timestamp with time zone not null default now()
);

-- THE INDEX SERVES THE PULSE'S OWN SENTENCE, AND THAT IS WHY IT IS NOT
-- `(vendor_id, date)`. The kickoff's Fork A named "a partial index on
-- (vendor_id, date)"; c-42.7 owns both defects. It named no predicate, so it
-- was not partial — an index on (vendor_id, date) with no WHERE is composite.
-- And it served no query anyone has written: G4.4's pulse is TIME-WINDOWED
-- ("checked Nov 22 on your page THIS WEEK"), which groups on `checked_at`
-- inside a vendor. This index answers that. The `date`-keyed index that the
-- rate-nudge query wants ("three enquiries on Nov 22 — consider Rs 1,60,000")
-- ships in R8-2 WITH that query, not ahead of it: an index built for a caller
-- that does not exist is a write cost with no reader.
create index if not exists date_checks_vendor_checked_idx
  on public.date_checks (vendor_id, checked_at desc);

comment on table public.date_checks is
  'TDW_19 G4.4 / R8-1 (F-42.11). One row per ANSWERED public date check on /v/<code>. Sole writer: src/api/public/availability.js, after every gate (status, discover_paused, date_check_enabled, occupancy) has passed. THE CHECK, NEVER THE ASKER: no phone, no IP, no session, no hash of any of them — so these rows are CHECKS, NOT PEOPLE, and cannot be counted as brides (F-42.51). Past dates are recorded (R-40.118); off-TDW is unknowable at this door and no column carries it. A refused check writes nothing, and a check the door could not resolve to a vendor writes nothing because there is no vendor to attribute it to.';

-- hot_dates.source — master :118, "`hot_dates` (exists; gains `source`)". The
-- panchang feed, when it comes, writes rows HERE with source='panchang' rather
-- than into a second table that the admin list would then have to be merged
-- with. Every row alive today is the founder's hand (R-40.38, master :253 — the
-- muhurat list stays hand-entered), which is exactly what the default says.
--
-- ⚠ NO CHECK CONSTRAINT, AND THAT IS RULED (O-4). A CHECK here would have to
-- name the feed's value, and the feed does not exist. Naming it now is a guess,
-- and a guess in a CHECK is one the next packet must ALTER before it can write
-- its first row.
alter table public.hot_dates
  add column if not exists source text not null default 'admin';

comment on column public.hot_dates.source is
  'TDW_19 G4.4 / R8-1. Where this hot date came from. ''admin'' is the founder''s hand-entered muhurat list (R-40.38) and is the default, so every row that predates this column is correctly labelled by the backfill. The panchang auto-feed writes its own value here when it lands — one table, two sources, never a second table. No CHECK: the feed''s value does not exist yet and a guessed CHECK would have to be altered before the feed could write.';
