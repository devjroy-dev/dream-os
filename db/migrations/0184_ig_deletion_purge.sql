-- db/migrations/0184_ig_deletion_purge.sql · CE-46 · G6-4 · F-44.247 · MIGRATION 0184 (allocated by the chair; 0181 ADS-1, 0182 G6-4, 0183 ELZ-3). A-45.8.
--
-- WHAT. CREATES ONE FUNCTION, no table (A-45.8's grant clause: EXECUTE to service_role only; RLS untouched):
--   public.ig_deletion_purge(p_vendor_id uuid) RETURNS jsonb
-- Meta's Instagram data-deletion callback (src/api/vendor/ig.js, POST /data-deletion) calls it for the vendor whose Instagram
-- account asked. In ONE statement, so ONE transaction (a function call is atomic; any error rolls every part back):
--   1 · deletes the messages of that vendor's Instagram threads (and any message recorded with channel 'instagram' on her threads);
--   2 · deletes her Instagram threads: public.conversations with channel 'instagram' (0173). Rows pointing at them follow their own
--       foreign keys: pending_actions and pending_couple_drafts cascade; notes and circle polls keep their row with the link nulled;
--   3 · nulls leads.counterparty_ig_id on her leads (0173): the Instagram identifier goes, the lead she works stays (the chair's
--       choice to confirm; deleting Instagram-only leads instead is a one-line change here);
--   4 · deletes her Instagram connection row (vendor_ig_connections), as before.
-- Returns the four counts, for the log line. Photos she imported stay (F-07.20, the founder's ruling of 30 July 2026).
-- Every name is schema-qualified (public.), and no search_path is set: b91's law for files at or above its boundary.
-- ONE TRANSACTION. Re-runnable (CREATE OR REPLACE).
-- REVERT (commented, never run by this file): DROP FUNCTION IF EXISTS public.ig_deletion_purge(uuid);

BEGIN;
CREATE OR REPLACE FUNCTION public.ig_deletion_purge(p_vendor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $fn$
DECLARE
  n_messages integer;
  n_threads  integer;
  n_leads    integer;
  n_conn     integer;
BEGIN
  IF p_vendor_id IS NULL THEN
    RAISE EXCEPTION 'ig_deletion_purge: vendor id required';
  END IF;
  DELETE FROM public.messages m
    USING public.conversations c
    WHERE m.conversation_id = c.id AND c.vendor_id = p_vendor_id AND (c.channel = 'instagram' OR m.channel = 'instagram');
  GET DIAGNOSTICS n_messages = ROW_COUNT;
  DELETE FROM public.conversations WHERE vendor_id = p_vendor_id AND channel = 'instagram';
  GET DIAGNOSTICS n_threads = ROW_COUNT;
  UPDATE public.leads SET counterparty_ig_id = NULL WHERE vendor_id = p_vendor_id AND counterparty_ig_id IS NOT NULL;
  GET DIAGNOSTICS n_leads = ROW_COUNT;
  DELETE FROM public.vendor_ig_connections WHERE vendor_id = p_vendor_id;
  GET DIAGNOSTICS n_conn = ROW_COUNT;
  RETURN jsonb_build_object('messages', n_messages, 'threads', n_threads, 'leads_unlinked', n_leads, 'connection', n_conn);
END
$fn$;
REVOKE ALL ON FUNCTION public.ig_deletion_purge(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ig_deletion_purge(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ig_deletion_purge(uuid) TO service_role;
COMMIT;

-- THE REPORT IS STATE (F-44.83): run this read-only SELECT after COMMIT; expect ONE row:
--   ig_deletion_purge | f (not security definer) | service_role can execute: true | anon can execute: false
-- SELECT p.proname, p.prosecdef,
--        has_function_privilege('service_role', 'public.ig_deletion_purge(uuid)', 'EXECUTE') AS service_role_exec,
--        has_function_privilege('anon', 'public.ig_deletion_purge(uuid)', 'EXECUTE') AS anon_exec
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname = 'public' AND p.proname = 'ig_deletion_purge';
