-- db/clean_piece0.sql
-- Piece 0 data clean. RUN THIS YOURSELF in the Supabase SQL editor.
-- It does NOT run automatically and the writer never executes it.
--
-- WHAT IT DOES:
--   A. DRY RUN (default): SELECTs the rows it WOULD delete. Deletes nothing.
--   B. APPLY: uncomment the COMMIT block at the bottom to actually delete.
--
-- WHAT IT TOUCHES:
--   * invite_codes        -> wiped (invite system retired)
--   * YOUR OWN phone rows  -> users + vendors/couples + otp_sessions for the
--                             test numbers, so you re-register fresh.
-- WHAT IT NEVER TOUCHES:
--   * demo_* tables, hot_dates, landing_slides, bride/couple data of real users,
--     schema (no DROP/ALTER). Data only.
--
-- >>> EDIT THIS LIST: put your own test phone numbers here (E.164, with +). <<<
--     (Leave it as-is to dry-run nothing on the phone side.)

-- ============================ A. DRY RUN ============================
-- Shows what would go. Safe to run anytime.

with my_phones as (
  select unnest(array[
    -- '+919888294440',   -- <-- uncomment / add your test numbers
    '+0'  -- placeholder so the array is never empty; matches nothing real
  ]) as phone
),
my_users as (
  select u.id, u.phone from users u join my_phones m on u.phone = m.phone
)
select 'invite_codes (all)' as what, count(*) as rows_affected from invite_codes
union all
select 'users (mine)',       count(*) from my_users
union all
select 'vendors (mine)',     count(*) from vendors  where user_id in (select id from my_users)
union all
select 'couples (mine)',     count(*) from couples  where user_id in (select id from my_users)
union all
select 'otp_sessions (mine)',count(*) from otp_sessions where phone in (select phone from my_phones);

-- ============================ B. APPLY ==============================
-- Re-read the dry-run output above. When the counts look right, uncomment
-- the block below and run again to actually delete.
--
-- begin;
--   with my_phones as (
--     select unnest(array[
--       '+919888294440'   -- <-- your test numbers
--     ]) as phone
--   ),
--   my_users as ( select u.id from users u join my_phones m on u.phone = m.phone )
--   -- order matters: child rows first (FKs cascade from users, but be explicit)
--   , del_otp  as ( delete from otp_sessions where phone in (select phone from my_phones) returning 1 )
--   , del_vend as ( delete from vendors where user_id in (select id from my_users) returning 1 )
--   , del_coup as ( delete from couples where user_id in (select id from my_users) returning 1 )
--   , del_user as ( delete from users where id in (select id from my_users) returning 1 )
--   delete from invite_codes returning 1;
-- commit;
