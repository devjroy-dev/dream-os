-- 0087_crew_assignment.sql — TDW_04.5 Block 04.5, P1 (the crew assignment engine).
-- FOUNDER-RUN in the Supabase SQL editor. **NOT shipped in the deploy ZIP.**
-- Project: nvzkbagqxbysoeszxent (public plane).
--
-- NUMBER: CE-ruled 0087 (FORK 1, Option B — eighth chair, 2026-07-21). The spec's
--   reserved 0076/0077 are both long taken (0076_capacity, 0077_availability_convergence);
--   0086 stays reserved for 05·P4's nudge_optout (committed, owner-tracked). 0079 is a
--   permanent hole (append-only law). This is the next free number honoring that reservation.
--
-- Written ONLY against witnessed column lists (docs/SCHEMA.md §team_members/§events, and
--   the founder's ABSENT×4 information_schema witness banked at read-first), per standing rule.
--
-- FOUR OBJECTS, each independently safe and idempotent; each carries its revert in-file:
--   A. events.assigned_member_ids uuid[]        — P1 (the crew on a function) + GIN index
--   B. team_members.page_token uuid             — P3 (the crew page capability token) + unique index
--   C. team_members.roster_vendor_id uuid       — P4 (assign-external bridge). SOFT REF, NO FK
--                                                 this sitting (CE-ruled: FK lands in 04.5·P4's
--                                                 collab_planner migration, provisionally 0088).
--   D. crew_confirmations                       — P1 (per-member confirm/decline state)
--
-- AFTER APPLYING: regenerate docs/db/PUBLIC_SCHEMA.md by re-running
--   db/queries/public_schema_dump.sql (the moment these become witnessed).
--
-- IMMUTABILITY: never edit an applied migration. Corrections go in 0088+.

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION A — events.assigned_member_ids (P1)
-- ══════════════════════════════════════════════════════════════════════════════
-- The crew on a function. Default '{}' (empty), NOT null — an unstaffed occupying
-- booking is the staffing-gap signal (P1.3), not a null. GIN index serves member-clash
-- scans and the band-view crew reads (P2).
--   REVERT: drop index if exists events_assigned_member_ids_gin;
--           alter table public.events drop column if exists assigned_member_ids;
alter table public.events
  add column if not exists assigned_member_ids uuid[] not null default '{}'::uuid[];

create index if not exists events_assigned_member_ids_gin
  on public.events using gin (assigned_member_ids);

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION B — team_members.page_token (P3, applied now per spec §2/P1.1)
-- ══════════════════════════════════════════════════════════════════════════════
-- The crew page's capability token. NOT null with a volatile default: adding it
-- backfills every existing member with a distinct uuid (uuid_generate_v4 is volatile,
-- so the rewrite evaluates per-row). Unique index enforces one-token-per-member and
-- makes /crew/:token lookups a single-row hit. P3 wires the route; P1 only lands the column.
--   REVERT: drop index if exists team_members_page_token_unique_idx;
--           alter table public.team_members drop column if exists page_token;
alter table public.team_members
  add column if not exists page_token uuid not null default uuid_generate_v4();

create unique index if not exists team_members_page_token_unique_idx
  on public.team_members (page_token);

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION C — team_members.roster_vendor_id (P4 bridge, SOFT REF this sitting)
-- ══════════════════════════════════════════════════════════════════════════════
-- Soft reference → vendor_roster(id). NO foreign key this sitting: vendor_roster does
-- not exist until 04.5·P4's collab_planner migration (spec §2 fallback: "FK only if
-- 0077 applied same sitting, else soft + comment"; CE-confirmed at read-first). 04.5·P4
-- adds the FK. Nullable — only externals carry it; native crew leave it null.
--   REVERT: alter table public.team_members drop column if exists roster_vendor_id;
alter table public.team_members
  add column if not exists roster_vendor_id uuid;  -- soft ref -> vendor_roster(id); FK in 04.5·P4

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION D — crew_confirmations (P1)
-- ══════════════════════════════════════════════════════════════════════════════
-- Per-member confirm/decline state for an assignment. The SOURCE OF TRUTH for a member
-- being on a function is events.assigned_member_ids; this table carries only the member's
-- RESPONSE. unique(event_id, member_id) makes the P1.5 upsert idempotent — re-assigning a
-- member who already confirmed does not reset them to pending (on-conflict-do-nothing).
-- Both FKs cascade on delete: drop the event or the member and their confirmations vanish.
--   REVERT: drop table if exists public.crew_confirmations;
create table if not exists public.crew_confirmations (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references public.events(id)        on delete cascade,
  member_id   uuid not null references public.team_members(id)  on delete cascade,
  status      text not null default 'pending'
              check (status in ('pending', 'confirmed', 'declined')),
  note        text,
  updated_at  timestamptz not null default now(),
  unique (event_id, member_id)
);

create index if not exists crew_confirmations_event_idx  on public.crew_confirmations (event_id);
create index if not exists crew_confirmations_member_idx on public.crew_confirmations (member_id);
