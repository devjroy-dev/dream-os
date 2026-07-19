-- 0085_prospect_lane.sql — TDW_05 Block 05, P3 (prospect lane).
-- FOUNDER-RUN in the Supabase SQL editor. **NOT shipped in the deploy ZIP.**
-- Project: nvzkbagqxbysoeszxent (public plane).
--
-- Written ONLY against witnessed column lists (PUBLIC_SCHEMA.md), per the standing rule.
-- TWO INDEPENDENTLY-SAFE SECTIONS — A (DDL: prospects + conversations owner model) and
-- B (the cap seed). Either runs without the other. Each carries its revert, commented, in-file.
--
-- AFTER APPLYING: regenerate docs/db/PUBLIC_SCHEMA.md by re-running
-- db/queries/public_schema_dump.sql (this is the moment prospects + conversations.prospect_id
-- become witnessed; this migration does not hand-edit that witnessed file).
--
-- IMMUTABILITY: never edit an applied migration. Corrections go in 0086+.

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION A — the prospect lane schema + the CE-ruled conversations owner model
-- ══════════════════════════════════════════════════════════════════════════════
-- ORDER IS LOAD-BEARING: prospects must exist before the conversations FK references it.
--   (1) prospects  →  (2) conversations.kind widen  →  (3) conversations owner statements.

-- ── (1) prospects ─────────────────────────────────────────────────────────────
-- Columns per TDW_05_WEBHOOK_FINAL.md §P3 (2). phone is unique (one prospect per number).
create table if not exists prospects (
  id                uuid primary key default uuid_generate_v4(),
  phone             text not null unique,
  name              text,
  ig_handle         text,
  category          text,
  city              text,
  source            text check (source in ('sheet', 'manual', 'other')),
  state             text not null default 'cold'
                      check (state in ('cold', 'templated', 'replied', 'in_session', 'converted', 'opted_out', 'expired')),
  demo_vendor_ref   uuid,                       -- soft ref to a demo vendor (Block-08 conversion seam); no FK by design
  notes             text,
  last_template_at  timestamptz,
  session_opened_at timestamptz,                -- rolling 24h window anchor (see P3 handoff §4.1)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists prospects_state_idx on prospects(state);
create index if not exists prospects_phone_idx on prospects(phone);

-- ── (2) widen conversations.kind to admit 'prospect_marketing' (mirror 0016's idiom) ──
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'conversations_kind_check'
      and conrelid = 'conversations'::regclass
  ) then
    alter table conversations drop constraint conversations_kind_check;
  end if;
end$$;

alter table conversations add constraint conversations_kind_check
  check (kind in ('vendor_self', 'couple_thread', 'couple_self', 'circle_thread', 'network', 'prospect_marketing'));

-- ── (3) conversations owner model — CE-ruled 1-of-3 (the blocker cure) ─────────
-- 0014's conversations_owner_xor is unconditional: check ((vendor_id is null) <> (couple_id is
-- null)). A prospect_marketing row is both-null → rejected. Give conversations a third owner and
-- make it "exactly one of three." Explicit boolean-sum (not num_nonnulls — that built-in is the
-- plural spelling and unused in-estate; the sum is self-evidently correct and matches the estate's
-- explicit-predicate style). Every existing row has exactly one of vendor/couple set with
-- prospect_id null → sum = 1 → still valid; the re-add validates with zero data touched.
-- on delete cascade is REQUIRED: under 1-of-3, set null would orphan an all-null row that
-- violates the constraint; restrict would block prospect purges. Cascade is the only consistent
-- choice — purge a prospect, its holding-line thread goes with it.
alter table conversations
  add column if not exists prospect_id uuid references prospects(id) on delete cascade;

alter table conversations drop constraint if exists conversations_owner_xor;
alter table conversations add constraint conversations_owner_xor
  check ( ((vendor_id   is not null)::int
         + (couple_id    is not null)::int
         + (prospect_id  is not null)::int) = 1 );

create index if not exists conversations_prospect_id_idx on conversations(prospect_id);

-- ── SECTION A revert (commented, in-file) ─────────────────────────────────────
-- Run top-to-bottom to fully reverse Section A:
-- drop index if exists conversations_prospect_id_idx;
-- alter table conversations drop constraint if exists conversations_owner_xor;
-- alter table conversations add constraint conversations_owner_xor
--   check ((vendor_id is null) <> (couple_id is null));
-- alter table conversations drop column if exists prospect_id;
-- do $$
-- begin
--   if exists (select 1 from pg_constraint where conname='conversations_kind_check'
--              and conrelid='conversations'::regclass) then
--     alter table conversations drop constraint conversations_kind_check;
--   end if;
-- end$$;
-- alter table conversations add constraint conversations_kind_check
--   check (kind in ('vendor_self','couple_thread','couple_self','circle_thread','network'));
-- drop index if exists prospects_phone_idx;
-- drop index if exists prospects_state_idx;
-- drop table if exists prospects;
-- (Note: reverting the owner XOR while any prospect_marketing conversation exists will fail the
--  2-way check — delete those rows first, or they are already gone via the cascade if you drop
--  prospects. Kind revert likewise requires no surviving 'prospect_marketing' rows.)

-- ══════════════════════════════════════════════════════════════════════════════
-- SECTION B — the W-9 daily template cap seed (admin-adjustable; default 25)
-- ══════════════════════════════════════════════════════════════════════════════
-- admin_config is (key, value text NOT NULL, description, updated_at). value is JSON-in-text —
-- the reader (prospects.readDailyCap) JSON.parse's it defensively ('25' → 25) and defaults to 25
-- when the key is absent, so this seed is a convenience, not a dependency. Idempotent.
insert into admin_config (key, value, description)
values ('marketing.daily_template_cap', '25',
        'Marketing new-prospect template cap per day (TDW_05 P3, W-9; admin-adjustable).')
on conflict (key) do nothing;

-- ── SECTION B revert (commented, in-file) ─────────────────────────────────────
-- delete from admin_config where key = 'marketing.daily_template_cap';
