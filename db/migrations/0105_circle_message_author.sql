-- ═══════════════════════════════════════════════════════════════════════════
-- 0105_circle_message_author.sql  —  TDW_07 tail · F-07.107 + F-07.109
-- APPLIED IN PRODUCTION 2026-08-02, founder-run, readback witnessed (20 cols).
-- These bytes are the bytes that ran.
--
-- Additive only. TWO nullable columns on ONE existing table. Nothing is
-- altered, moved, dropped or backfilled.
--
-- ── LADDER TAIL, DERIVED BY COMMAND ───────────────────────────────────────
-- `ls db/migrations/` at c43bec0 ends 0104. 0102 IS APPLIED in production with
-- no committed file (F-07.19, still unruled), so the APPLIED ladder is
-- …0101, 0102, 0103, 0104 → 0105. 0105 confirmed unspent by four handovers
-- (TDW_07_P5_BACKEND :19 · _F0745_ :17 · _F0747_ :14 · _CLOSE_ :29) and by
-- NOTE_16 §4; its one prior claimant, the F-07.89 heroes micro, closed
-- ZERO-BYTES docs-only at CE-123, so no reservation survived.
--
-- ── PROVENANCE (SQL-provenance law) ───────────────────────────────────────
-- The witness is the founder's own information_schema paste, 2026-08-02:
-- public.messages, 18 columns, ordinal 1..18, and NEITHER column below
-- present. PUBLIC_SCHEMA.md is NOT the witness here — 0104's header declares
-- it stale by three migrations, and the paste is the settling authority.
-- The post-run readback returned 20 rows: sender_name text YES @19,
-- sender_user_id uuid YES @20, both defaultless, no other column moved.
--
-- ── WHY TWO COLUMNS AND NOT ONE ───────────────────────────────────────────
-- public.circle_activity — the same estate, one table over, rendering
-- correctly on the same surface — carries actor_user_id (col 3) AND
-- actor_name (col 4) as a PAIR. This table had neither: sent_by holds a ROLE,
-- so four server sites printed "COUPLE"/"BRIDE" where a name belongs
-- (F-07.107), and the co-planner compared a sender_user_id no response had
-- ever emitted (F-07.109). Shipping the name alone would have cured the label
-- and left the founder's own bubbles rendering as a stranger's.
--
-- ── WHY NULLABLE, AND WHY NOTHING IS BACKFILLED ───────────────────────────
-- Founder ruling: history stays NULL — no invented data. Every row written
-- before this migration has no recoverable author, and minting one would be
-- fabrication on a typed column. The read path treats NULL as its own case
-- and the client renders such a bubble with NO name line at all — it does not
-- fall back to the role, because on live data that role is `couple` over a
-- member's own words (F-07.112). NOT NULL would also require a default, and a
-- defaulted author is a lie.
--
-- ── ORDER, AND THE HAZARD IT AVOIDED ──────────────────────────────────────
-- THIS FILE RAN BEFORE THE CODE ZIPS. Derived both directions: code first
-- would name an unknown column, PostgREST answers PGRST204, msgErr is truthy
-- at messages.js:145 and every circle send returns 500 at :147; a read naming
-- it errors at :207 / threads.js:56 and the thread renders EMPTY. Migration
-- first is metadata-only (nullable, no default — no table rewrite in PG11+,
-- brief ACCESS EXCLUSIVE), and code that neither writes nor selects the
-- columns is byte-unaffected. Column first, then code.
--
-- No index. Nothing filters, joins or orders on either column at this tip;
-- an index with no query is cost without a reader.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1 · the author's name, as it will render ──────────────────────────────
-- Hydrated at insert from the OWNER ROW, never from the request body:
-- circle_members.invitee_name (NOT NULL) for a member, couples.user_id ->
-- users.name (nullable, handled) for the bride. The client's sender_name
-- parameter is deleted in the same arc — an accepted-but-ignored identity
-- string is both a lie in the contract and a forgeable address (F-07.56).
alter table public.messages
  add column if not exists sender_name text;

-- ── 2 · the author's identity ─────────────────────────────────────────────
-- Written from the RESOLVED CALLER (req.circleIdentity), never from the body.
-- This is the field coplanner/threads/[threadId]/page.tsx:139 has always
-- compared against and no response has ever carried; it becomes real rather
-- than the client bending around its absence. NULL where no credential was
-- presented — fail-soft to exactly today's behaviour, and that path closes
-- when the enforcement ZIP lands.
alter table public.messages
  add column if not exists sender_user_id uuid;

-- ── 3 · READBACK — run it; paste the output back. ─────────────────────────
-- EXPECT TWENTY rows: the witnessed eighteen, plus sender_name (text, YES)
-- at ordinal 19 and sender_user_id (uuid, YES) at ordinal 20, both with a
-- NULL default. Any other shape is a STOP.
select ordinal_position, column_name, data_type, is_nullable, column_default
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'messages'
 order by ordinal_position;
