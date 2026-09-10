-- db/migrations/0165_instagram_briefs.sql — G4.1 · THE SUNDAY BRIEF'S STORE. CE-42 seat R6, packet 4b-3b.
-- 0165 ALLOCATED BY THE CHAIR at the 4b-3b read-first (store ruled (a)). Append-only (LD-8).
--
-- SQL PROVENANCE (protocol §10):
--   Statement 1 creates a NEW table — its witness is the statement. FK target public.vendors(id):
--   PUBLIC_SCHEMA.md @0154 :1385 (1. id uuid NOT NULL).
--   Statement 2 alters public.vendor_ig_connections: PUBLIC_SCHEMA.md @0154 :1312–:1326 (12 columns:
--   id · vendor_id · ig_user_id · access_token · token_expires_at · connected_at · last_refreshed_at ·
--   pending_state_nonce · pending_state_at · created_at · updated_at · ig_username). No `scope` column
--   exists. Touched by 0103 (create), 0104 (ig_username), 0147 only; 0155–0164 do not name the table
--   (derived by grep at the cut, tip c5de470).
--
-- RULINGS CARRIED (4b-3b read-first, 2026-09-10): store (a) — one row per vendor-week, UNIQUE (vendor_id,
-- week_start) PLAIN (c-42.46: "partial" was the chair's slip); an error row is REPLACED by the next live
-- one through the upsert · the grant is STORED so the door answers "connect" with no network (15b) ·
-- week window (b): Monday 00:00 → Saturday 23:59:59 IST, the label stays the calendar week.
-- Every statement is its own paste block in the Supabase editor (R-40.31).

-- ── 1 · THE BRIEF — one row per vendor per week ────────────────────────────────
-- status='error' rows carry `reason` (Meta's HTTP status and code — never a token byte, the secrets
-- law at igOAuth.js:90) and a null payload; the door reads them as S8. `generated_at` is what the
-- door compares against for S9 (stale) — never a job's write.
create table if not exists public.instagram_briefs (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references public.vendors(id) on delete cascade,
  week_start    date not null,                            -- the Monday, IST calendar
  week_end      date not null,                            -- the Sunday, IST calendar (the label's end)
  status        text not null check (status in ('live', 'error')),
  payload       jsonb,                                    -- the accepted shape (lib/worklist/sunday.ts Brief)
  reason        text,                                     -- error only
  generated_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  constraint uq_instagram_briefs_vendor_week unique (vendor_id, week_start)
);

-- ── 2 · THE GRANT — when her token was proven to carry the insights scope ──────
-- Written at the insights-flavour callback after one account read succeeds; cleared by disconnect.
-- Null with a live row = the door's `connect` (S2): she connected for photos, never for the brief.
alter table public.vendor_ig_connections
  add column if not exists insights_granted_at timestamptz;

-- ── VERIFY (paste as its own block; expect 2 rows) ─────────────────────────────
-- select 'table' as what, count(*)::text as n from information_schema.tables
--   where table_schema = 'public' and table_name = 'instagram_briefs'
-- union all
-- select 'column', count(*)::text from information_schema.columns
--   where table_schema = 'public' and table_name = 'vendor_ig_connections' and column_name = 'insights_granted_at';
