-- db/migrations/0173_ig_dm.sql · CE-45 · IGD-1 · CUT 2a · the Instagram DM lane's columns (read-first F2, F3, F7 as ruled;
-- the quiet time's one home, ruled for IGD-1 on 25 September 2026). A-45.8.
--
-- WHAT. ALTERS three existing tables; CREATES NO TABLE, so A-45.8's grant clause has nothing to grant:
--   public.conversations  channel ('whatsapp' | 'instagram', default 'whatsapp', so every existing row reads as WhatsApp) and
--                         counterparty_ig_id (the Instagram-scoped id of the person who wrote, for an Instagram couple_thread),
--                         with ONE Instagram thread per vendor and sender.
--   public.leads          counterparty_ig_id, with ONE lead per vendor and Instagram sender (a lead from a DM has no phone).
--   public.vendors        reply_quiet_minutes (60 | 120 | 240 | 480, default 120): after a vendor replies to a couple herself,
--                         TDW does not reply to that couple for this long. ONE field for both channels; G6's own number reads it
--                         too (the chair, 25 September 2026). Its effect lands in cut 2b; this cut only stores it.
-- WHY NO GRANT. 0170 revokes from anon, authenticated and PUBLIC only; service_role's table-level privileges on all three
--   tables were witnessed as SELECT, INSERT, UPDATE and DELETE by G6-1's census (25 September 2026), and a table-level privilege
--   covers columns added later. b119's rehearsal PROVES it: it reads and writes every new column AS service_role and is refused
--   AS anon and authenticated (A-45.8's rehearsal clause).
-- ONE TRANSACTION. Every statement is IF NOT EXISTS, so a re-run is a no-op.
-- REVERT (commented, never run by this file):
--   DROP INDEX IF EXISTS public.conversations_vendor_ig_thread_uidx; DROP INDEX IF EXISTS public.leads_vendor_ig_uidx;
--   ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_channel_check;
--   ALTER TABLE public.conversations DROP COLUMN IF EXISTS counterparty_ig_id, DROP COLUMN IF EXISTS channel;
--   ALTER TABLE public.leads DROP COLUMN IF EXISTS counterparty_ig_id;
--   ALTER TABLE public.vendors DROP CONSTRAINT IF EXISTS vendors_reply_quiet_minutes_check;
--   ALTER TABLE public.vendors DROP COLUMN IF EXISTS reply_quiet_minutes;

BEGIN;

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'whatsapp';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS counterparty_ig_id text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_channel_check') THEN
    ALTER TABLE public.conversations ADD CONSTRAINT conversations_channel_check CHECK (channel IN ('whatsapp', 'instagram'));
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS conversations_vendor_ig_thread_uidx
  ON public.conversations (vendor_id, counterparty_ig_id)
  WHERE kind = 'couple_thread' AND counterparty_ig_id IS NOT NULL;

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS counterparty_ig_id text;
CREATE UNIQUE INDEX IF NOT EXISTS leads_vendor_ig_uidx
  ON public.leads (vendor_id, counterparty_ig_id)
  WHERE counterparty_ig_id IS NOT NULL;

ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS reply_quiet_minutes integer NOT NULL DEFAULT 120;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vendors_reply_quiet_minutes_check') THEN
    ALTER TABLE public.vendors ADD CONSTRAINT vendors_reply_quiet_minutes_check CHECK (reply_quiet_minutes IN (60, 120, 240, 480));
  END IF;
END $$;

COMMIT;
