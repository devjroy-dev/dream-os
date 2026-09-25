-- db/migrations/0172_own_number_grants.sql · CE-45 · G6-1 · F-44.168 (the seat's e-133) · A-45.8.
--
-- WHY: GET /api/v2/vendor/solutions/number answered 500 on every visit on production. Railway's log (25 September,
-- 14:49 to 15:25 IST): "vendor_wabas read: permission denied for table vendor_wabas". dream-os reads with the SERVICE
-- ROLE (BYPASSRLS, so RLS is not the gate), but a TABLE GRANT is. The founder's witness of 25 September:
--   information_schema.role_table_grants: service_role holds only REFERENCES, TRIGGER, TRUNCATE on vendor_wabas and on
--     vendor_wa_events (on vendors it holds all seven);
--   pg_default_acl for schema public: tables created BY postgres give service_role only "Dxtm" (TRUNCATE, REFERENCES,
--     TRIGGER, MAINTAIN), never SELECT, INSERT, UPDATE or DELETE.
-- 0171 created both tables as postgres and granted nothing, so the one role this estate reads with could not read them.
-- 0170 did not cause this (it revokes from anon, authenticated and PUBLIC only); what narrowed postgres's default for
-- service_role is not witnessed in this repo, and nothing here changes that default: a table this estate creates now
-- carries its own grant in its own file (A-45.8, pinned by b128).
--
-- WHAT: the four privileges the door, the receiver and the connect need, to service_role only. anon and authenticated
-- are NOT granted (0170's line holds). No sequence: both tables key on gen_random_uuid(). One transaction.
-- REVERT (commented, never run by this file):
--   REVOKE SELECT, INSERT, UPDATE, DELETE ON public.vendor_wabas, public.vendor_wa_events FROM service_role;

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_wabas     TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_wa_events TO service_role;

COMMIT;

-- REPORT (run after, in its own tab; read-only). Expected: both tables show service_role with
-- DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE; no row for anon or authenticated.
-- SELECT table_name, grantee, string_agg(privilege_type, ',' ORDER BY privilege_type) AS privs
--   FROM information_schema.role_table_grants
--  WHERE table_schema = 'public' AND table_name IN ('vendor_wabas', 'vendor_wa_events')
--  GROUP BY 1, 2 ORDER BY 1, 2;
