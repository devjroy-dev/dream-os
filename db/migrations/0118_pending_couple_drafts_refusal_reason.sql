-- 0118_pending_couple_drafts_refusal_reason.sql
-- TDW_06 · THE HAND · SITTING TWO — THE REFUSAL'S REASON GETS A HOME
--
-- CHARTERED AT R-29.20 (Fork 4, arm (b)). ONE COLUMN. Nothing else moves.
--
-- WHY, IN ONE SENTENCE: `src/lib/vendor/coupleWaWindow.js` (symbol
-- `coupleWindowOpen`) speaks TYPED reasons — window_closed · no_inbound_ever ·
-- no_conversation · conversation_query_failed · message_query_failed ·
-- window_check_threw:* — and `src/lib/whatsapp.js` (symbol `sendWhatsApp`)
-- returns TYPED `blocked` sentinels — opted_out · meta_media_unsupported ·
-- no_meta_lane. Under a deed-line-only design every one of them dies at the
-- door, and 0117 would record THAT a bride-facing draft was refused with no WHY.
--
-- THAT IS F-06.143's SILENCE ONE TABLE OVER, and F-06.143 is a finding this
-- block filed. Shipping its class knowingly, into the store built to end the
-- class, is not a trade this estate makes twice.
--
-- ── WHY A COLUMN AND NOT A SECOND TABLE ─────────────────────────────────────
-- The reason is 1:1 with the draft and is written in the same act as the
-- terminal transition that carries it (`resolved_at` is stamped in the same
-- UPDATE — see `src/lib/vendor/coupleDrafts.js`, symbol `transition`). A second
-- table would introduce a two-phase write between a refusal and its reason,
-- which is the shape 0117's own `approved`-before-`sent` comment exists to keep
-- VISIBLE rather than to create somewhere new.
--
-- ── SQL-PROVENANCE (protocol §10): the column carries its witness ───────────
-- Type and nullability are modelled on `public.messages.delivery_status`
-- (WITNESS: docs/db/PUBLIC_SCHEMA.md:602 — `12. delivery_status text`), the
-- estate's existing nullable free-text outcome column on a transport row. It
-- carries NO CHECK deliberately: the reasons are produced by two code surfaces
-- that will gain new typed reasons (the doorbell rider adds its own), and a
-- CHECK here would make the database the place a new honest reason goes to die.
-- The register that MUST be constrained is `state`, and 0117 constrains it.
--
-- TARGET TABLE WITNESS: `public.pending_couple_drafts`, created at
-- db/migrations/0117_pending_couple_drafts.sql, ten columns, live in production
-- (founder-run and founder-paired against the DDL, 2026-08-11).
--
-- Run this in the Supabase SQL editor. Verify with the SELECT at the foot.

BEGIN;

-- IF NOT EXISTS: this migration is idempotent, matching 0117's own posture, so a
-- second paste is harmless rather than an error the founder has to read past.
ALTER TABLE public.pending_couple_drafts
  ADD COLUMN IF NOT EXISTS refusal_reason text;

COMMENT ON COLUMN public.pending_couple_drafts.refusal_reason IS
  'TDW_06 R-29.20. The TYPED reason a draft reached a non-sent terminal: the '
  'window predicate''s reason, the transport''s blocked sentinel, or '
  '''expired_at_read''. Written only by src/lib/vendor/coupleDrafts.js, in the '
  'same UPDATE that stamps resolved_at. Never a sentence — the sentence is the '
  'vendor''s and is composed at the door.';

COMMIT;

-- ── VERIFY (read-only; run after the block above) ────────────────────────────
-- Expect 11 rows, the last of them refusal_reason / text / YES / (null default).
--
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'pending_couple_drafts'
-- ORDER BY ordinal_position;

-- ── REVERT — FULLY COMMENTED, NEVER A SECOND RUNNABLE BLOCK ──────────────────
-- (the conditional-withheld rule, protocol §9: anything runnable left in a
-- transcript will be run. To use this, uncomment the three lines and paste them
-- alone.)
--
-- LOSSY BY CONSTRUCTION, and stated rather than discovered: dropping this column
-- destroys the recorded reason for every refusal taken while it existed. The
-- draft rows and their states survive; only the WHY is lost. Under the house
-- destructive-action law this needs founder sign-off recorded and the action
-- logged in the handover.
--
-- BEGIN;
--   ALTER TABLE public.pending_couple_drafts DROP COLUMN IF EXISTS refusal_reason;
-- COMMIT;
