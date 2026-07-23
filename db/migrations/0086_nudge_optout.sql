-- 0086_nudge_optout.sql — TDW_05 Block 05, P4 (crons + reminders).
-- FOUNDER-RUN in the Supabase SQL editor. NOT shipped in the deploy ZIP.
-- Project: nvzkbagqxbysoeszxent (public plane).
--
-- APPLIED 2026-07-23, founder-run, COMMITTED BYTE-AS-RUN. Verified by readback
-- from pg_constraint, not from this file: nudge_optout_phone_lane_key =
-- UNIQUE (phone, lane) · three CHECKs present with their exact enums · 7 columns.
--
-- Written ONLY against witnessed column lists (docs/db/PUBLIC_SCHEMA.md,
-- 2026-07-23, ladder tip 0096, 62 tables / 691 columns).
--
-- SLOT: 0086 is RESERVED, not a gap — held free since CE-36 and kept free when
-- TDW_13 was re-homed 0086->0097 at CE-59 (TDW_13_FROST_FOUNDATION_FINAL.md:36).
--
-- HEADER DISPOSITION — couples.nudge_sent_at (position 12, witnessed):
--   ADOPT AS WRITE TARGET. Evidence: grep for the name across *.js/*.ts/*.tsx
--   returned ZERO sites; it existed only in 0013's DDL + comment, never read,
--   never written. This migration does not alter it; src/brideCron.js now
--   stamps it as the bride lane's per-IST-day idempotency guard.
--
-- ONE SECTION. Revert carried in-file, commented.
-- AFTER APPLYING: regenerate the witness through BOTH committed pipes —
--   db/queries/public_schema_dump.sql  ->  db/queries/format_public_schema.js
-- IMMUTABILITY: never edit an applied migration. Corrections go in 0100+.

-- Shape F1(b), mirroring the witnessed prospects sibling (0085): natural key,
-- explicit enum CHECKs, never an open state column.
--
-- KEYED ON (phone, lane) — THE CHAIR'S AMENDMENT, CE-63. The sibling's
-- phone-unique key is the FULL stop's property (one human said stop, so stop
-- everywhere). It does not belong to a nudge pause. A makeup artist planning her
-- own wedding is ONE NUMBER ON BOTH LANES; silencing her bride nudge must not
-- silence the vendor briefings that are her livelihood.
--
-- PHONE FORMAT IS LOAD-BEARING: bare digits with country code, NO '+', NO
-- 'whatsapp:' prefix — exactly src/lib/metaCloud.js normalizeTo()'s output
-- (lines 57-62), exactly how prospects.phone is stored. Every gate normalizes
-- through that one function before reading this table.
--
-- SCOPE — THIS IS NOT A FULL STOP. A row here suppresses NUDGE-CLASS sends only.
-- A full STOP remains prospects.state='opted_out', untouched by this migration
-- and by every line of code that reads this table.
create table if not exists nudge_optout (
  id          uuid primary key default uuid_generate_v4(),
  phone       text not null,
  lane        text not null
                check (lane in ('bride', 'vendor')),
  state       text not null default 'opted_out'
                check (state in ('opted_out', 'resumed')),
  source      text not null default 'inbound_stop_mornings'
                check (source in ('inbound_stop_mornings', 'admin', 'other')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint nudge_optout_phone_lane_key unique (phone, lane)
);
create index if not exists nudge_optout_phone_idx on nudge_optout(phone);
create index if not exists nudge_optout_state_idx on nudge_optout(state);

-- ── REVERT (commented; run ONLY to undo this migration) ─────────────────────
-- drop index if exists nudge_optout_state_idx;
-- drop index if exists nudge_optout_phone_idx;
-- drop table if exists nudge_optout;
