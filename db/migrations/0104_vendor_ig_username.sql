-- ═══════════════════════════════════════════════════════════════════════════════════
-- 0104_vendor_ig_username.sql  —  TDW_07 · Block 07 P4a · F-07.24
-- Additive only. ONE nullable column on ONE table created earlier this same sitting.
-- Nothing existing is altered, moved or dropped. Founder-run in the Supabase editor.
--
-- ── LADDER TAIL, DERIVED BY COMMAND ───────────────────────────────────────────────
-- `ls db/migrations/` at db4bb30 returns … 0100, 0101, 0103. 0102 IS APPLIED IN
-- PRODUCTION but its file was never committed (F-07.19, filed at 0103 and still
-- unruled). The applied ladder is therefore …0101, 0102, 0103 → 0104, which is this
-- file's number. Taken from the APPLIED ladder, never from `ls`.
--
-- ── WHY THIS COLUMN EXISTS — AND IT IS A CORRECTION, NOT A FEATURE ───────────────
-- The App Review submission filed 2026-07-30 states, in two places, that the
-- connected Instagram username is shown to the vendor in the "Import from Instagram"
-- section of their Portfolio page. IT WAS NOT. The executor wrote that paragraph
-- from Meta's screencast requirement without checking the surface against it, and
-- the founder submitted it in good faith.
--
-- A written claim the app does not match is a rejection with no argument available.
-- This column, and the surface that renders it, make the submission true.
--
-- ── PROVENANCE (SQL-provenance law) ──────────────────────────────────────────────
-- One identifier is read by name: public.vendor_ig_connections, created by 0103 in
-- this same sitting and witnessed by the founder's own readback — eleven columns,
-- and the unique constraint `vendor_ig_connections_vendor_id_key` returned by the
-- pg_constraint query. That readback is this file's witness; PUBLIC_SCHEMA.md is
-- NOT, and remains stale by three migrations.
--
-- ── WHY NULLABLE ─────────────────────────────────────────────────────────────────
-- Existing rows predate the profile read and have no handle to backfill. More
-- importantly the code treats a missing username as NON-FATAL: a profile read that
-- fails still leaves a valid token and a working import, and the surface simply
-- omits the line. NOT NULL would turn a cosmetic failure into a broken connect.
-- ═══════════════════════════════════════════════════════════════════════════════════


-- ── 1 · the column ────────────────────────────────────────────────────────────────
-- The vendor's own PUBLIC Instagram handle. Not a secret — it is printed on their
-- own profile page and the entire point is that they can read it. It therefore joins
-- igConnection.SAFE_COLUMNS, which access_token still does not.
alter table public.vendor_ig_connections
  add column if not exists ig_username text;


-- ── 2 · READBACK — run it; paste the output back. ────────────────────────────────
-- Expect TWELVE rows (0103's eleven, plus ig_username), with ig_username nullable.
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'vendor_ig_connections'
 order by ordinal_position;
