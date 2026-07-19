-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Migration 0083 — failed_turns (the dead-letter table)                     ║
-- ║  TDW_05 Block 05, P1b (Movement B) · the Pipes sitting                     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- RULING (P1 kickoff §3 + CE Movement-B clearance): a thrown inbound turn lands
-- here with its full Twilio payload for admin replay/discard. Split out of the
-- spec's 0078 bundle (0078 was taken by slot_blocks) onto its own number, as the
-- charter reserved `0083_failed_turns.sql`. Additive, founder-run, no backfill.
--
-- The code half (this ZIP) writes ONLY: service, phone, payload, error, state='dead'
-- (webhookCore.captureDeadLetter); the admin endpoints read all columns and move
-- state dead → replayed | discarded. Graceful-degrades if this table is absent
-- (42P01 → logged, turn still answers) — so code may deploy before or after this runs.

create table if not exists failed_turns (
  id          uuid primary key default gen_random_uuid(),
  service     text,
  phone       text,
  payload     jsonb not null,
  error       text,
  state       text not null default 'dead' check (state in ('dead','replayed','discarded')),
  created_at  timestamptz not null default now()
);

create index if not exists failed_turns_state_idx      on failed_turns(state);
create index if not exists failed_turns_created_at_idx  on failed_turns(created_at);

-- ── verify (run after; both should return rows) ──────────────────────────────
-- select column_name, data_type, is_nullable from information_schema.columns
--   where table_name = 'failed_turns' order by ordinal_position;
-- select conname from pg_constraint
--   where conrelid = 'failed_turns'::regclass and contype = 'c';  -- the state CHECK

-- ── revert (commented; run only to undo) ─────────────────────────────────────
-- drop index if exists failed_turns_created_at_idx;
-- drop index if exists failed_turns_state_idx;
-- drop table if exists failed_turns;
