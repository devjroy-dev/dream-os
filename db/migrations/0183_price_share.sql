-- db/migrations/0183_price_share.sql · CE-46 · ELZ-3 · THE PRICE SWITCH (the founder's ruling of 29 September 2026, through the chair; 0183
-- named by the chair). Her own switch in her settings, "Share approximate prices in chat", OFF until she turns it on. With it on, Eliza
-- answers a price question with the founder's sentences from her starting price (vendors.rate_min, the figure her public card shows) or a
-- matched package's own total at or above it; with it off, or with no starting price set, today's refusal stands unchanged.
--   price_share_enabled  boolean, NOT NULL, default false (beside date_check_enabled, 0140)
-- ALTERS one existing table; CREATES NO TABLE, so A-45.8 grants nothing (service_role's grants on vendors carry to new columns).
-- One transaction, idempotent. REVERT (commented, never run):
--   ALTER TABLE public.vendors DROP COLUMN IF EXISTS price_share_enabled;
BEGIN;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS price_share_enabled boolean NOT NULL DEFAULT false;
COMMIT;
