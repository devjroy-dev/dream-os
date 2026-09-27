-- db/migrations/0176_ig_account_id.sql · CE-46 · IGD-2 · CUT 2c · F-44.194, ruled (a) (the dark walk, 27 September 2026: the first
-- delivered webhook logged "not recorded: unknown_account" because it addresses the professional account, 1784..., and the
-- connect had stored only the Instagram-scoped id, 2846...). A-45.8.
--
-- WHAT. ALTERS one existing table; CREATES NO TABLE, so A-45.8's grant clause has nothing to grant and RLS is untouched:
--   public.vendor_ig_connections  ig_account_id: the professional-account id from the connect's profile read (GET /me?fields=
--                                 user_id). The webhook's recipient is matched on it (igConnection.findByIgUserId). ig_user_id and
--                                 every insights read are unchanged. NULL on every existing row until that vendor connects again.
-- ONE VENDOR PER INSTAGRAM ACCOUNT (the chair's addition, 27 September 2026): a partial UNIQUE index on ig_account_id where it is
--   set. A second vendor connecting the same account is refused at igConnection.setAccountId (logged; that connect stands with
--   no account id, so the webhook never reaches it); the first connection stands. NULL rows never collide.
-- WHY NO GRANT. 0170 revokes from anon, authenticated and PUBLIC only; service_role's table-level privileges on
--   vendor_ig_connections cover a column added later. PROVED by scripts/lib/b136cr_0176_rehearse.sh.
-- ONE TRANSACTION. IF NOT EXISTS, so a re-run is a no-op.
-- REVERT (commented, never run by this file):
--   DROP INDEX IF EXISTS public.vendor_ig_connections_ig_account_id_uidx;
--   ALTER TABLE public.vendor_ig_connections DROP COLUMN IF EXISTS ig_account_id;

BEGIN;
ALTER TABLE public.vendor_ig_connections ADD COLUMN IF NOT EXISTS ig_account_id text;
CREATE UNIQUE INDEX IF NOT EXISTS vendor_ig_connections_ig_account_id_uidx
  ON public.vendor_ig_connections (ig_account_id) WHERE ig_account_id IS NOT NULL;
COMMIT;
