-- NOTE (TDW_01): 0063 was double-reserved; both files applied to prod. Twin: 0063_vendor_activity_log.sql. See SCHEMA ladder note + db/BASELINE.md.
-- 0063_users_auth_user_id.sql
-- Auth migration Step 1a (see AUTH_SUPABASE_PHONE_MIGRATION.md).
--
-- The link column for Supabase Phone-OTP login. Until now dream-os pinned the
-- Supabase auth user id EQUAL to public.users.id (mintSession's createUser({id})),
-- so resolveVendor/requireCoupleAuth could match vendors.user_id = JWT sub directly.
-- Supabase signInWithOtp generates its OWN auth id (cannot be pinned), so identity
-- must resolve through a link column instead: users.auth_user_id = <supabase auth id>.
-- Mirrors engine.users.auth_user_id (the engine already resolves this way).
--
-- BACKFILL: every existing user had auth.users.id === users.id (the old pinning),
-- so seed auth_user_id = id. This keeps OLD-flow logins (JWT sub = users.id) resolving
-- through the SAME auth_user_id path as new phone-OTP logins — no parallel break.
-- (A returning user who later signs in via phone-OTP gets a NEW supabase id; the
--  provision endpoint's phone-fallback re-binds auth_user_id to it then — Step 1c.)
--
-- Idempotent: safe to re-run.

alter table users add column if not exists auth_user_id uuid;

-- backfill existing rows: auth_user_id = id (old pinned identity)
update users set auth_user_id = id where auth_user_id is null;

-- unique, but allow NULL (a brand-new row is created before its auth id is known in
-- some paths); a partial unique index enforces one user per supabase auth identity.
create unique index if not exists users_auth_user_id_key
  on users (auth_user_id) where auth_user_id is not null;
