-- db/migrations/0182_own_number_removed.sql · CE-46 · G6-4 · THE ROOM FINISHED · "Remove this number". Number 0182 allocated by
-- the chair (0181 is ADS-1's). A-45.8.
--
-- WHAT. ALTERS one existing table; CREATES NO TABLE, so A-45.8's grant clause has nothing to grant and RLS is untouched (on since
--   0171; 0172's service_role grants cover a column added later, as 0176 and 0180 proved):
--   public.vendor_wabas  status: admits 'removed' beside 0171's four. A row she removed from the room (src/lib/ownNumber/remove.js):
--                        TDW's app unsubscribed from her WhatsApp account, the moved way deregistered, her sealed token nulled.
--                        The row is KEPT (never deleted, F-a (a)); a reconnect updates it in place (F-d).
--                        removed_at: when she removed it. NULL on every other row.
--   paused_reason carries 'removed:vendor' until Meta's PARTNER_REMOVED arrives on the shared way, then 'removed:partner_removed'
--   (F-c): no new column for it.
-- THE CHECK. 0171 declared the status CHECK inline and unnamed, so Postgres named it vendor_wabas_status_check. It is dropped by
--   that name IF EXISTS and re-added under the same name with five values.
-- WITNESS: db/migrations/0171_own_number.sql (the four-value CHECK); 0180 (business_token).
-- ONE TRANSACTION. Re-runnable: the DROP and the ADD COLUMN are IF [NOT] EXISTS.
-- REVERT (commented, never run by this file; only while no row reads 'removed'):
--   ALTER TABLE public.vendor_wabas DROP CONSTRAINT IF EXISTS vendor_wabas_status_check;
--   ALTER TABLE public.vendor_wabas ADD CONSTRAINT vendor_wabas_status_check CHECK (status IN ('pending', 'active', 'suspended', 'migrated_out'));
--   ALTER TABLE public.vendor_wabas DROP COLUMN IF EXISTS removed_at;

BEGIN;
ALTER TABLE public.vendor_wabas DROP CONSTRAINT IF EXISTS vendor_wabas_status_check;
ALTER TABLE public.vendor_wabas ADD CONSTRAINT vendor_wabas_status_check
  CHECK (status IN ('pending', 'active', 'suspended', 'migrated_out', 'removed'));
ALTER TABLE public.vendor_wabas ADD COLUMN IF NOT EXISTS removed_at timestamptz;
-- THE GUARD: had 0171's CHECK carried another name, the DROP above would be a silent no-op and the old four-value CHECK would still
-- refuse 'removed'. Exactly one CHECK on the table may name the statuses; otherwise the whole transaction is refused.
DO $$ BEGIN
  IF (SELECT count(*) FROM pg_constraint WHERE conrelid = 'public.vendor_wabas'::regclass AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%migrated_out%') <> 1 THEN
    RAISE EXCEPTION '0182: expected exactly one status CHECK on vendor_wabas; nothing applied';
  END IF;
END $$;
COMMIT;

-- THE REPORT IS STATE (F-44.83): run this read-only SELECT after COMMIT; expect TWO rows:
--   check   | CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text, 'migrated_out'::text, 'removed'::text])))
--   column  | removed_at timestamp with time zone YES
-- SELECT 'check' AS what, pg_get_constraintdef(oid) AS state FROM pg_constraint
--  WHERE conrelid = 'public.vendor_wabas'::regclass AND conname = 'vendor_wabas_status_check'
-- UNION ALL
-- SELECT 'column', column_name || ' ' || data_type || ' ' || is_nullable FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'vendor_wabas' AND column_name = 'removed_at';
