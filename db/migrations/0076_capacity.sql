-- REPO: devjroy-dev/dream-os  ·  db/migrations/0076_capacity.sql
-- ════════════════════════════════════════════════════════════════════
-- Migration 0076 — per-SLOT working capacity (TDW_04 Part B, SPINE sitting)
-- Date:    2026-07-16
-- Author:  TDW_04 executor session (spine)
-- Ruling:  TDW_04_LEDGER_AND_CALENDAR_FINAL.md L-7 — "Part B's two reservations
--          shift to 0075 + 0076 with this dated note" (dated note, 2026-07-15,
--          founder ruling relayed at the §3.5 audit close). 0076 IS THAT
--          RESERVATION, claimed here.
--          + Q-B3-2, CE-ruled 2026-07-16: the capacity map is PER-SLOT, and its
--            key space is categoryProfiles' PROFILES — not VENDOR_CATEGORIES.
--          + TDW_04_CALENDAR_FINAL.md §2's reservation table (its 0074 row,
--            renumbered by L-7): "vendors.slot_capacity integer nullable
--            (NULL = category default)".
--
-- LD-8:    Reserved numbers are law. 0076 was reserved by L-7 and held vacant
--          through B1/B2/B3 (ladder at HEAD: 0075 ✓ · 0076 HOLE · 0077 ✓ —
--          verified by command at the spine sitting, 0b0f260). Holes are
--          harmless; renumbering is forbidden; APPLIED NUMBERS NEVER RENAME.
--          Once the founder runs this, 0076 is this column's address forever.
--
-- PLANE (F-04.30 / F-04.31, CE-ruled 2026-07-15):
--   Targets public.vendors — the typed vendor row (LD-1: typed tables own
--   money/legal + leads). There is no engine twin of this table and no plane
--   ambiguity here, but the schema is NAMED EXPLICITLY on every statement below
--   so the question cannot arise. Same discipline as 0075.
--
-- ── WHAT THIS COLUMN MEANS. READ THIS BEFORE YOU RESOLVE IT. ────────────
--
-- PER-SLOT, NOT PER-DAY. Q-B3-2 was ruled after Q-2's per-day map was found
-- unreachable in the taxonomy it named as truth. C2 splits a day into THREE
-- slots (morning < 12:00 · noon 12:00-15:59 · evening >= 16:00) plus full_day.
-- This integer is the vendor's capacity IN ONE SLOT. A makeup artist at 2 takes
-- two morning bookings and refuses the third — that is acceptance #3, and it is
-- reachable only because this column is per-slot. THE COLUMN NAME ENCODES THE
-- RULING and LD-8 forbids renaming it after application: if this is ever read as
-- per-day, the reader is wrong, not the name.
--
-- NULL = CATEGORY DEFAULT. NULL is not "no capacity" and not zero. It means
-- "this vendor has not overridden the default for their category", and the
-- resolver reads `vendor.slot_capacity ?? <category default>`. The defaults are
-- CODE, not data — they live in occupancy.js (the spine's next ZIP), keyed on
-- categoryProfiles' PROFILES space, per Q-B3-2 as corrected:
--     photography 1 · makeup 2 · decor 1 · venue 1     (timelineType 'event')
--     designer / jewellery -> occupancy OFF            (timelineType 'delivery';
--                                                       ready_by clustering, C9)
--     other -> occupancy OFF + occupancy_unmapped logged once per vendor
-- There is deliberately NO florist key: normaliseCategory('florist') resolves to
-- 'other', and categories.js merged florist into decor on 2026-05-15 (founder
-- confirmed). A floral-decor vendor running three sites sets this column to 3.
-- EVERY default is overridable by this column — that is the whole point of it.
--
-- NO CHECK CONSTRAINT, DELIBERATELY, AND IT IS A QUESTION NOT AN OVERSIGHT.
-- The spec reserves "integer nullable" and nothing more, so nothing more ships.
-- A `check (slot_capacity > 0)` was considered and NOT written: 0 may legitimately
-- mean "I take no bookings in a slot" — a real vendor statement, not a bad value —
-- and inventing that semantic is not the executor's call. Raised to the CE in the
-- spine handover; if a constraint is ruled in, it lands as its own numbered
-- migration, never as a silent edit to this applied one.
--
-- ── HOW THIS IS RUN ─────────────────────────────────────────────────────
-- FOUNDER-RUN, in the Supabase SQL editor, per protocol §6 ("migrations applied
-- to prod ONLY via the founder... then confirmed via information_schema query
-- written in your notes"). NOT destructive: this ADDS a nullable column and
-- touches no existing row, no existing column, and no data. No export is owed
-- under the standing destructive law because nothing is dropped, deleted or
-- truncated. Every statement is guarded and the whole file is idempotent —
-- running it twice is a no-op, by construction.
--
-- NO CREDENTIALS APPEAR IN THIS FILE and none are needed: it is run inside an
-- authenticated editor session. (Standing security rule, protocol candidate,
-- B3 §3: founder-run recipes never echo live credentials into transcripts.)
--
-- ⚠ DISCLOSED BLINDNESS — READ BEFORE RUNNING:
--   THERE IS NO WITNESSED COLUMN LIST FOR public.vendors ANYWHERE IN THE REPO.
--   ENGINE_SCHEMA.md is the `engine` schema ONLY (25 tables, 242 columns — it
--   does not contain this table). db/BASELINE.md carries a COUNT and no names
--   ("vendors | 36"). docs/SCHEMA.md's ladder header is stale at 0064. So this
--   migration was written WITHOUT the witnessed column list the founder-run SQL
--   law asks for — which is why it (a) names exactly ONE column, (b) creates
--   rather than reads it, (c) guards with `if not exists`, and (d) proves itself
--   by information_schema below rather than by assertion. If `slot_capacity`
--   somehow already exists, statement 1 is a silent no-op and statement 2 will
--   show you the truth. The permanent cure — a witnessed public-schema snapshot
--   to twin ENGINE_SCHEMA.md — is PROPOSED in the spine handover, not built here.
-- ════════════════════════════════════════════════════════════════════

-- ── STATEMENT 1 — the column. Guarded; idempotent; adds only. ───────────
-- integer, NULLABLE, no default. Absence of a DEFAULT is deliberate: a DB-level
-- default would make "unset" indistinguishable from "set to the default", and the
-- resolver's `?? category default` needs NULL to mean "unset" to work at all.
alter table public.vendors
  add column if not exists slot_capacity integer;

-- ── STATEMENT 2 — the column's own documentation, in the database. ──────
-- Idempotent (comment on ... is a replace). This is the one place a DBA reading
-- prod without the repo can learn what NULL means here.
comment on column public.vendors.slot_capacity is
  'TDW_04 B/0076. PER-SLOT booking capacity (C2 slots: morning/noon/evening/full_day) — NOT per-day. NULL = use the category default from occupancy.js (photography 1, makeup 2, decor 1, venue 1; designer/jewellery = occupancy off; other = occupancy off). Vendor-editable. Q-B3-2, CE-ruled 2026-07-16.';

-- ── STATEMENT 3 — THE PROOF. Run this in the same editor session and paste ──
-- ── the result into the sitting's notes. Protocol §6's information_schema  ──
-- ── confirmation. Expected exactly one row:                                ──
--       table_schema | table_name | column_name   | data_type | is_nullable | column_default
--       public       | vendors    | slot_capacity | integer   | YES         | NULL
-- Anything else — no row, is_nullable = NO, a non-null default, or a data_type
-- that is not integer — means the column is NOT what B3's checker will resolve
-- against. Do not proceed to the occupancy ZIP on a red proof.
select table_schema,
       table_name,
       column_name,
       data_type,
       is_nullable,
       column_default
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'vendors'
   and column_name  = 'slot_capacity';
