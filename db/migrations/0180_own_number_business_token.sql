-- db/migrations/0180_own_number_business_token.sql · CE-46 · G6-3 · CUT THREE (a) · F-44.224, ruled 28 September 2026. Number 0180
-- allocated by the chair. A-45.8.
--
-- WHAT. ALTERS one existing table; CREATES NO TABLE, so A-45.8's grant clause has nothing to grant and RLS is untouched (on since
--   0171; service_role's grants from 0172 cover a column added later, as 0176 proved for vendor_ig_connections):
--   public.vendor_wabas  business_token: HER business integration system user token, the one Meta returns at the Embedded Signup
--                        code exchange and the one that sends from her number (Meta, "Onboarding business customers as a Tech
--                        Provider", Step 1, read 28 September 2026). SEALED: the column holds tokenVault.seal()'s
--                        `v1.<iv>.<tag>.<ct>` string (AES-256-GCM under INTEGRATION_TOKEN_KEY, src/lib/vendor/tokenVault.js),
--                        never the token in clear. Read by exactly one function, src/lib/ownNumber/token.js businessTokenFor.
--                        NULL on the one existing row (DEV440, connected 28 September before this cure) until she connects again;
--                        connect.js admits that re-exchange in place (F-a3 (a)).
-- NO EXPIRY COLUMN (F-a2 (c)): the founder's configuration is created with token expiration "Never".
-- WITNESS: db/migrations/0171_own_number.sql (vendor_wabas, 14 columns; RLS on); 0172 (service_role grants).
-- ONE TRANSACTION. IF NOT EXISTS, so a re-run is a no-op.
-- REVERT (commented, never run by this file):
--   ALTER TABLE public.vendor_wabas DROP COLUMN IF EXISTS business_token;

BEGIN;
ALTER TABLE public.vendor_wabas ADD COLUMN IF NOT EXISTS business_token text;
COMMIT;

-- THE REPORT IS STATE (F-44.83): run this read-only SELECT after COMMIT; expect ONE row, business_token, text, YES.
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'vendor_wabas' AND column_name = 'business_token';
