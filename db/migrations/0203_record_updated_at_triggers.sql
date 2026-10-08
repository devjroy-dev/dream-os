-- db/migrations/0203_record_updated_at_triggers.sql — TDW · CE-47 · INS · F-44.420: RECORD TWO LIVE TRIGGERS, NO CHANGE.
-- The founder's first live run of the PAY-A checks STOPPED on two triggers the repo did not know. The chair read both from
-- the live database: each is BEFORE UPDATE, FOR EACH ROW, EXECUTE FUNCTION set_updated_at(), and that function (0001
-- :83) only sets new.updated_at = now() and returns new. This migration writes them into the repo exactly as they stand.
-- On the live database it changes nothing (CREATE OR REPLACE with the same definition). The repo's own name for the
-- invoices trigger, invoices_set_updated_at (0008 :67), is NOT on the live database: the live invoices trigger is
-- invoices_updated_at. So on a database built from the repo the old name is dropped and the live one stands in its place,
-- with the same function: behaviour identical, one trigger per table, as live. set_updated_at() itself is not touched.
-- No table, column, grant or policy changes; no search_path set; every name public.<name>.
BEGIN;
CREATE OR REPLACE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER payment_schedules_set_updated_at
  BEFORE UPDATE ON public.payment_schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS invoices_set_updated_at ON public.invoices;
COMMIT;
