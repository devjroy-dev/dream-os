-- 0054_image_throttle_rejection_sent.sql
-- Patch 9b — suppress duplicate rejection replies within the same burst.
--
-- Before: if a vendor/bride forwards 5 images, the first 2 process, the
-- remaining 3 each independently trigger a rejection reply → user gets
-- 3 identical messages.
--
-- After: when we send the first rejection, we mark that row as
-- rejection_sent=true. Subsequent over-limit checks within the same 30s
-- window see a recent rejection already exists and stay silent. They
-- still drop the image (don't process it), just don't reply again.

alter table image_throttle_log
  add column if not exists rejection_sent boolean not null default false;

-- Hot path: check if any recent row for this phone has rejection_sent=true.
create index if not exists idx_image_throttle_rejection
  on image_throttle_log (phone, created_at desc)
  where rejection_sent = true;
