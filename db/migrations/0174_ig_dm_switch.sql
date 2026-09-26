-- db/migrations/0174_ig_dm_switch.sql · CE-45 · IGD-1 · CUT 2a-ii · her Instagram messages switch (read-first F7, ruled), on the
-- Instagram connection's own row, beside insights_granted_at (0165's precedent). A-45.8.
--   messages_granted_at  when one read on her token proved it carries instagram_business_manage_messages (set by the connect's
--                        "messages" flavour; null means the permission is not on her token)
--   dm_state             'off' | 'on' (her switch; default 'off'). "paused" and "waiting" are not stored: the door derives them from
--                        the token and the lane gate, so they can never go stale.
--   dm_consented_at      when she tapped Turn on after the consent statement (C5)
--   dm_subscribed_at     when /me/subscribed_apps last accepted her account for messages (null when unsubscribed)
-- ALTERS one existing table; CREATES NO TABLE, so A-45.8 grants nothing (service_role's grants on vendor_ig_connections carry to new
-- columns; the rehearsal proves it). One transaction, idempotent. REVERT (commented, never run):
--   ALTER TABLE public.vendor_ig_connections DROP CONSTRAINT IF EXISTS vendor_ig_connections_dm_state_check;
--   ALTER TABLE public.vendor_ig_connections DROP COLUMN IF EXISTS dm_subscribed_at, DROP COLUMN IF EXISTS dm_consented_at,
--     DROP COLUMN IF EXISTS dm_state, DROP COLUMN IF EXISTS messages_granted_at;
BEGIN;
ALTER TABLE public.vendor_ig_connections ADD COLUMN IF NOT EXISTS messages_granted_at timestamptz;
ALTER TABLE public.vendor_ig_connections ADD COLUMN IF NOT EXISTS dm_state text NOT NULL DEFAULT 'off';
ALTER TABLE public.vendor_ig_connections ADD COLUMN IF NOT EXISTS dm_consented_at timestamptz;
ALTER TABLE public.vendor_ig_connections ADD COLUMN IF NOT EXISTS dm_subscribed_at timestamptz;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vendor_ig_connections_dm_state_check') THEN
    ALTER TABLE public.vendor_ig_connections ADD CONSTRAINT vendor_ig_connections_dm_state_check CHECK (dm_state IN ('off', 'on'));
  END IF;
END $$;
COMMIT;
