-- db/migrations/0175_ig_dm_stop.sql · CE-46 · IGD-2 · CUT 2b · STOP on the Instagram lane (the founder's Q1 = 1, F4 (a) ruled;
-- F-44.193: prospects cannot hold it, prospects.phone is NOT NULL and an Instagram sender has no phone). A-45.8.
--
-- WHAT. ALTERS one existing table; CREATES NO TABLE, so A-45.8's grant clause has nothing to grant and RLS is untouched:
--   public.conversations  ig_stopped_at: when the couple on this Instagram thread sent STOP (the whole-message matcher,
--                         fullStop.matchOptOutExact). While it is set, Eliza runs no turn on the thread and the vendor answers
--                         herself; START clears it. NULL (every existing row, every WhatsApp thread) means answered as usual.
-- WHY NO GRANT. 0170 revokes from anon, authenticated and PUBLIC only; service_role's table-level SELECT, INSERT, UPDATE and DELETE
--   on conversations (G6-1's census, 25 September 2026; 0173's header) covers a column added later. The rehearsal PROVES it:
--   scripts/lib/b136r_0175_rehearse.sh reads and writes the column AS service_role and is refused AS anon and authenticated.
-- ONE TRANSACTION. IF NOT EXISTS, so a re-run is a no-op.
-- REVERT (commented, never run by this file):
--   ALTER TABLE public.conversations DROP COLUMN IF EXISTS ig_stopped_at;

BEGIN;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ig_stopped_at timestamptz;
COMMIT;
