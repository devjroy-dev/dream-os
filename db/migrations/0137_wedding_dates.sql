-- db/migrations/0137_wedding_dates.sql
-- TDW · BLOCK 19 · G1.3 — THE WEDDING'S OWN DATE (R-G13.11 · F-40.99's remainder)
--
-- Append-only, founder-run, idempotent.
--
-- ⚠ THIS FILE FILLS A HOLE. IT DOES NOT SIT AT THE TIP, AND ITS FIRST HEADER
-- SAID IT DID. When this migration was authored the ladder ended at 0136 and the
-- header stated — correctly at the time — that it took no register record. While
-- this seat was building, the G3.2 seat pushed `0138_contract_fill_and_sign.sql`
-- and ran it on production. 0137 now lands BELOW the applied tip.
--
-- That is exactly F-SW.3's blind spot, and it is worth stating rather than
-- silently correcting: PUBLIC_SCHEMA.md's staleness test is ARITHMETIC — "is
-- there a migration newer than the ladder tip?" — and a migration filling a hole
-- lands AFTER the tip in time and BELOW it in number, so it does not trip the
-- check and the snapshot goes on answering confidently about a table it no
-- longer describes.
--
-- THE STANDING CURE IS A RECORD IN `db/migrations/OUT_OF_ORDER.json`, added in
-- THIS delivery (R-34.41/.42/.43). Not a line in the snapshot's header: that
-- header is GENERATED and a hand-edit to it deletes itself on the next regen,
-- which is F-SW.7 — a cure that was fiction from the day it was written. The
-- register is hand-authored, committed, and never regenerated.
--
-- The ladder tip was re-derived by `ls db/migrations/ | sort | tail` at the
-- moment of the cut, not recalled from when this file was first written. That
-- re-derivation is the only reason the error was caught.
--
-- ⚠ FOUNDER-RUN IN THE SUPABASE EDITOR, BEFORE THE dream-os ZIP IS APPLIED.
--
-- ═══ SQL-PROVENANCE · R-40.27 — CONSTRAINTS FOR EVERY TABLE WRITTEN ═════════
-- This file WRITES ONE TABLE. The snapshot `docs/db/PUBLIC_SCHEMA.md` was
-- regenerated at ladder 0132 (its own header says so), so it is STALE for
-- 0133–0136 and the migrations are the witnesses for anything they added.
--
-- public.weddings — columns :1224 (13 at snapshot), constraints :1998-2006, verbatim:
--     [CHECK]       weddings_visibility_check
--         CHECK ((visibility = ANY (ARRAY['draft','published'])))
--     [PRIMARY KEY] weddings_pkey            PRIMARY KEY (id)
--     [UNIQUE]      weddings_owner_slug_key  UNIQUE (owner_vendor_id, slug)
--   NONE of the three mentions either column added below. Both are new, nullable,
--   and carry no default, so no existing row can violate anything and the ALTER
--   cannot fail on data.
--   Three further columns exist live and are NOT in that snapshot —
--   `consent_token`, `consent_sent_at`, `consent_phone`, witnessed at
--   0133:112-116. None is touched here. `idx_weddings_consent_token` (0133:124)
--   and `idx_weddings_live` (0131:69-70) are NOT dropped and NOT redefined.
--
-- public.leads — columns :675 (27), constraints :1666-1672, verbatim:
--     [CHECK]       leads_wedding_date_precision_check
--         CHECK ((wedding_date_precision = ANY (ARRAY['day','month','year'])))
--     [PRIMARY KEY] leads_pkey  PRIMARY KEY (id)
--   READ ONLY, never written by this file. It is cited because the CHECK below
--   is COPIED FROM IT DELIBERATELY — see the note on the vocabulary.
--
-- public.events — columns :538, read only, not written. Named because
--   `events.event_date` remains the AUTHORITY for a wedding that has an event;
--   R-40.11 stands and nothing on that table moves.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── THE BACK CATALOGUE'S DATE  (R-G13.11) ───────────────────────────────────
-- `weddings.event_id` has been NULLABLE since 0131 by R-G11.21, because a
-- photographer's first pages are work she shot before she joined TDW. The DOOR
-- has been shut all the same, and for an honest reason rather than an oversight:
-- with no event there was nothing to date the page, so `season` — derived at
-- read from `events.event_date` (R-G11.16) — had no source, and the create
-- sheet's two vetoed strings had nowhere to put a value.
--
-- F-40.99 is that gap, written down: strings #26 「It isn't on my calendar」 and
-- #27 「Wedding date」 were founder-vetoed and then WITHHELD because
-- `public.weddings` had thirteen columns and none was a date. This file is what
-- lets them ship.
--
-- NULLABLE, and that is the schema telling the truth about the table's own
-- history. Every wedding created before this migration has an event behind it
-- and none of them has, or will ever need, a typed date.
ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS wedding_date           date NULL,
  ADD COLUMN IF NOT EXISTS wedding_date_precision text NULL;

-- ── THE VOCABULARY IS BORROWED, NOT INVENTED ────────────────────────────────
-- The three words are `leads_wedding_date_precision_check`'s, character for
-- character (PUBLIC_SCHEMA.md:1666-1672). Two planes now carry a date and a
-- precision beside it; if they used different vocabularies, `'month'` would mean
-- one thing on a lead and another on a page, and the first person to write a
-- query joining them would find out the hard way.
--
-- ⚠ THE DOOR ONLY EVER WRITES 'month' TODAY. The CHECK is wider than the door
-- deliberately: it is a shared vocabulary, not a description of one caller, and
-- narrowing it to a single value would make the two planes disagree in order to
-- describe today's UI.
ALTER TABLE public.weddings
  DROP CONSTRAINT IF EXISTS weddings_wedding_date_precision_check;
ALTER TABLE public.weddings
  ADD CONSTRAINT weddings_wedding_date_precision_check
  CHECK (wedding_date_precision = ANY (ARRAY['day'::text, 'month'::text, 'year'::text]));

-- ── THE PAIR MOVES TOGETHER OR NOT AT ALL ───────────────────────────────────
-- A precision beside a NULL date is a claim about a date that does not exist; a
-- date with no precision cannot be rendered honestly, because a first-of-month
-- stored as a day is exactly how `2027-03-01` starts being read as the first of
-- March. `createLead` reasons this way in JS about the same pair on `leads`
-- (R-G12.11) and the comment there says the door "writes the two together or
-- neither" — a sentence a later caller can simply not read.
--
-- ⚠ SO IT IS ENFORCED HERE INSTEAD OF PROMISED THERE. The database refuses the
-- half-filled pair, in both directions, for every writer that will ever exist.
ALTER TABLE public.weddings
  DROP CONSTRAINT IF EXISTS weddings_wedding_date_pair_check;
ALTER TABLE public.weddings
  ADD CONSTRAINT weddings_wedding_date_pair_check
  CHECK ((wedding_date IS NULL) = (wedding_date_precision IS NULL));

COMMENT ON COLUMN public.weddings.wedding_date IS
  'The typed date of a wedding with NO calendar row behind it (R-G13.11). NULL whenever event_id is present — events.event_date is the authority there (R-40.11), and a second stored date would be the drift R-G11.16 refused when it killed a stored season. Season is still DERIVED at read.';
COMMENT ON COLUMN public.weddings.wedding_date_precision IS
  'How coarse wedding_date is. Vocabulary copied from leads_wedding_date_precision_check so the two planes cannot mean different things by ''month''. Moves with wedding_date or not at all, enforced by weddings_wedding_date_pair_check.';

COMMIT;

-- ── VERIFY (run separately; this file is one statement per paste block by
-- R-40.31, and the founder's editor shows only the last result) ──────────────
-- The two columns and the two CHECKs, read back from information_schema rather
-- than assumed from a successful COMMIT:
--
--   select column_name, data_type, is_nullable
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'weddings'
--      and column_name in ('wedding_date', 'wedding_date_precision');
--
-- OWED AFTER THIS RUNS: nothing beyond the standing PAIR regen debt. The
-- 2026-09-05 snapshot describes `weddings` at ladder 0132; this file and 0133
-- are its witnesses until the next regen, and anything about these two columns
-- or either CHECK is cited from HERE by line, never from the snapshot.
