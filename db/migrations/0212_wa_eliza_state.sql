-- 0212 · CE-47 · ELZ-4 · THE PER-VENDOR ELIZA SWITCH FOR WHATSAPP (the chair's design note r2 accepted, 4 October 2026; Q1 (b), Q2 the master
-- absolute; R1 and R2 ruled). Her own switch, beside Instagram messages (vendor_ig_connections.dm_state, 0174) in Business Solutions >
-- WhatsApp and Instagram. NULL = follow the master (admin_config couple.eliza_enabled), i.e. exactly today for every existing vendor; 'on' and
-- 'off' are hers. Off: nothing answers on her behalf on WhatsApp (TDW's shared line or her own number); the enquiry lands as a lead and her alert.
-- Alters one existing table; creates none (A-45.8 grants nothing). Idempotent; one transaction.
BEGIN;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS wa_eliza_state text NULL;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS wa_eliza_consented_at timestamptz NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vendors_wa_eliza_state_check') THEN
    ALTER TABLE public.vendors ADD CONSTRAINT vendors_wa_eliza_state_check CHECK (wa_eliza_state IS NULL OR wa_eliza_state IN ('on', 'off'));
  END IF;
END $$;
COMMIT;
-- Revert (by hand, never run by a seat):
-- BEGIN; ALTER TABLE public.vendors DROP CONSTRAINT IF EXISTS vendors_wa_eliza_state_check;
-- ALTER TABLE public.vendors DROP COLUMN IF EXISTS wa_eliza_consented_at; ALTER TABLE public.vendors DROP COLUMN IF EXISTS wa_eliza_state; COMMIT;
