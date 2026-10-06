-- db/migrations/0214_vendor_feature_choices.sql · CE-47 · ADS-2 · EVERY META FEATURE PER-VENDOR, LIVE BY ITSELF ON APPROVAL.
-- 0214 is ADS-2's (the chair's ranges, 4 Oct 2026: ADS-2 0214-0215).
-- (1) Each vendor's own choice per Meta-gated feature. Only an explicit choice is stored: NO ROW MEANS ON (the founder:
--     live by itself the moment Meta allows; she may turn it off). Service role only.
-- (2) Every Meta-gated feature turns on by itself: auto_on with the ruling as its walk_ref. The sweep still turns a row
--     on only when Meta lists the permission "live" for the app AND the live probe passes (src/capabilitiesSweep.js).
--     flag.own_number is NOT touched (it waits for its own end-to-end walk).
BEGIN;
CREATE TABLE IF NOT EXISTS public.vendor_feature_choices (
  vendor_id   uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  feature_key text        NOT NULL REFERENCES public.capabilities(key),
  choice      text        NOT NULL CHECK (choice IN ('on', 'off')),
  chosen_at   timestamptz NOT NULL DEFAULT now(),
  chosen_by   text,
  PRIMARY KEY (vendor_id, feature_key)
);
ALTER TABLE public.vendor_feature_choices ENABLE ROW LEVEL SECURITY;
-- After 0170's lock-down a table is reachable only by what is granted (b128 2.1): the server's role, in this file.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_feature_choices TO service_role;
UPDATE public.capabilities
   SET auto_on = true, walk_ref = COALESCE(walk_ref, 'ruled:CE-47 4 Oct 2026, live by itself on approval'), updated_at = now()
 WHERE key IN ('flag.ads', 'perm.instagram_business_manage_messages', 'flag.ig_photo_import');
COMMIT;
