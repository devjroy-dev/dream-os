-- 0018_fix_muse_saves_fk.sql
-- Hotfix applied 2026-05-16 after B2 close.
--
-- muse_saves.saved_by_user_id was created with ON DELETE RESTRICT in
-- migration 0016. This blocked admin panel "Delete couple" from working
-- because the cascade delete on users(id) hit this RESTRICT constraint
-- and was rejected by Postgres.
--
-- Fix: change to ON DELETE CASCADE so deleting a user deletes their
-- muse saves too. This is the correct semantics — saves belong to the
-- user, and if the user is gone, their saves go with them.
--
-- Already applied to Supabase directly via SQL Editor on 2026-05-16.
-- This file is the repo record of that change.
--
-- IMMUTABILITY: never edit this file. Changes go in 0019+.

alter table muse_saves
  drop constraint if exists muse_saves_saved_by_user_id_fkey;

alter table muse_saves
  add constraint muse_saves_saved_by_user_id_fkey
  foreign key (saved_by_user_id)
  references users(id)
  on delete cascade;
