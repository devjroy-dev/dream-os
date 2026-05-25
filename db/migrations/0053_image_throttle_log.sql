-- 0053_image_throttle_log.sql
-- Patch 9 — rate-limit inbound WhatsApp images to two per 30 seconds per phone.
--
-- Why: Twilio delivers a burst of forwarded images as N separate webhooks
-- within 1-2 seconds, each carrying MediaUrl0. Each one triggers an expensive
-- pipeline (vendor: Haiku Vision OCR; bride: Cloudinary + Vision + tagging).
-- A burst of 10 images costs ~10x Vision calls and produces 10 separate
-- replies, swamping the user.
--
-- Mechanism:
--   1. On every inbound image (vendor or bride engine), insert a row here.
--   2. Count rows for this phone in last 30s.
--   3. If count > 2, send polite refusal and short-circuit.
--   4. Else, proceed with pipeline.
--
-- Cleanup: rows expire by ignoring them after 30s — no TTL trigger needed.
-- Optional housekeeping cron can DELETE rows older than 1 day; not critical
-- for correctness, only for table bloat.

create table if not exists image_throttle_log (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  engine      text not null check (engine in ('vendor', 'bride')),
  created_at  timestamptz not null default now()
);

-- Hot path: count rows for a phone in last 30 seconds.
create index if not exists idx_image_throttle_phone_recent
  on image_throttle_log (phone, created_at desc);

comment on table image_throttle_log is
  'Patch 9 — rate-limit inbound WhatsApp images. Each row logs an inbound image attempt; engines count last-30s rows per phone to throttle.';
