-- ═══════════════════════════════════════════════════════════════════════════════════
-- 0103_vendor_ig_connections.sql  —  TDW_07 · Block 07 P4a · the Instagram connection
-- Additive only. Creates ONE new table. Nothing existing is altered, moved or dropped.
-- Founder-run in the Supabase SQL editor, once.
--
-- ── THE LADDER TAIL, AND A DIVERGENCE FOUND WHILE DERIVING IT ─────────────────────
-- `ls db/migrations/` at 151d905 returns … 0099, 0100, 0101 — and NOTHING for 0102.
-- 0102 WAS APPLIED IN PRODUCTION (TDW_07_P3_HANDOVER.md §6/§7: founder-run, readbacks
-- A/B/C green, `vendor_portfolio.position` live and read by portfolio.js today). Its
-- .sql FILE was never committed, because P3 shipped it as a chat block rather than a
-- repo file.
--
-- CONSEQUENCE, NAMED RATHER THAN WORKED AROUND: the migrations directory is no longer
-- a trustworthy ladder source. A future hand deriving "the next number" from `ls`
-- would author 0102 and collide with an applied migration. THIS FILE takes 0103 from
-- the APPLIED ladder (…0101, 0102 → 0103), which is the charter's number and the
-- correct one. The missing-0102-file question is filed for the chair, NOT silently
-- fixed here: shipping a 0102 file that someone might RUN is a worse defect than the
-- gap it closes, and whether it lands as a recorded already-applied file is a ruling.
--
-- ── PROVENANCE (SQL-provenance law: a column with no witness is an assumption) ─────
-- This file CREATES a table, so no existing column is read or written by name except
-- ONE: the foreign key target public.vendors(id).
--   Witness: docs/db/PUBLIC_SCHEMA.md, "public.vendors · 38 columns", ordinal 1 —
--   `id uuid NOT NULL default uuid_generate_v4()`.
--
-- STALENESS DECLARED, per the P4a read-first's chair correction №3: PUBLIC_SCHEMA.md
-- is the 2026-07-23 snapshot at applied ladder tip 0099. It does NOT carry 0101's
-- rate_display/discover_paused nor 0102's vendor_portfolio.position. That staleness is
-- IRRELEVANT TO THIS FILE — vendors.id is ordinal 1 and predates every one of them —
-- and it is stated rather than assumed away. A schema-dump refresh rides the founder
-- asks; until then no P4b DDL may be authored against that doc.
--
-- ── WHY A TABLE AND NOT COLUMNS ON `vendors` (F2, CE-ruled (b)) ───────────────────
-- An access token on public.vendors is one careless `select('*')` from an
-- exfiltration. src/api/vendor/me.js:204 and :215 are the habit's own evidence — two
-- hand-written column lists that a future hand extends by reflex. A separate table
-- makes the secret STRUCTURALLY ABSENT from every profile read: keeping it out of /me
-- requires no discipline, because it was never within reach.
-- ═══════════════════════════════════════════════════════════════════════════════════


-- ── 1 · the table ─────────────────────────────────────────────────────────────────
-- ONE connection per vendor: `vendor_id` is UNIQUE, which is also what makes every
-- write in src/lib/vendor/igConnection.js an upsert on a known conflict target rather
-- than a read-then-write race.
--
-- ON DELETE CASCADE: a deleted vendor must not leave a live Instagram token behind.
-- This is the one place in the file where the cascade is about a SECRET outliving its
-- owner, not about tidiness.
create table if not exists public.vendor_ig_connections (
  id                  uuid primary key default gen_random_uuid(),
  vendor_id           uuid not null unique references public.vendors(id) on delete cascade,

  -- The Instagram-SCOPED user id. Stable for this app + this vendor, and NOT the
  -- public @handle — nothing renders it. vendors.instagram_handle remains the
  -- display handle and is untouched by this table.
  ig_user_id          text,

  -- THE SECRET. Long-lived (60-day) token. Read by exactly one function in the
  -- estate: igConnection.readToken(). Never selected by getConnection(), never in a
  -- response body, never in a log line.
  access_token        text,
  token_expires_at    timestamptz,

  -- connected_at is the BIRTH date and is never rewritten by a refresh. It carries
  -- Meta's "a long-lived token may only be refreshed once it is at least 24 hours
  -- old" constraint, which refreshDecision() asserts.
  connected_at        timestamptz,
  last_refreshed_at   timestamptz,

  -- The single-use half of F3's state. A signature proves a state is authentic; only
  -- a stored nonce proves it is UNSPENT. Written at /authorize, matched and NULLed at
  -- /callback — a replayed state finds null and is refused.
  pending_state_nonce text,
  pending_state_at    timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── 2 · the lookup index ──────────────────────────────────────────────────────────
-- Every read in igConnection.js is `.eq('vendor_id', …)`. The UNIQUE constraint above
-- already creates a supporting index in PostgreSQL, so this statement is DELIBERATELY
-- ABSENT rather than written-and-redundant. Recorded as a decision so the next reader
-- finds a reason instead of an omission.


-- ── 3 · READBACK — the settling witness. Run it; paste the output back. ───────────
-- Expect exactly ELEVEN rows from the first query (the eleven columns above), and
-- ONE row from the second (the unique constraint on vendor_id).
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'vendor_ig_connections'
 order by ordinal_position;

select con.conname, con.contype
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
 where nsp.nspname = 'public'
   and rel.relname = 'vendor_ig_connections'
   and con.contype = 'u';
