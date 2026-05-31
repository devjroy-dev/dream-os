-- 0067_demo_vendor_discover.sql
-- Add discover_eligible to demo_vendors so specific demo profiles can appear
-- in the Frost Discover feed alongside real vendors.
--
-- Design:
--   - Default false — nothing appears unless explicitly enabled by admin.
--   - discover_eligible = true AND active = true → appears in feed.
--   - Revoke anytime by flipping back to false.
--   - Zero FK to vendors table — demo_vendors stays fully independent.
--   - discover_eligible_at recorded for audit trail.

alter table demo_vendors
  add column if not exists discover_eligible    boolean     not null default false,
  add column if not exists discover_eligible_at timestamptz;

create index if not exists demo_vendors_discover_idx
  on demo_vendors (discover_eligible, active)
  where discover_eligible = true and active = true;

comment on column demo_vendors.discover_eligible is
  'When true (and active=true), this demo vendor appears in the Frost Discover feed.
   Controlled exclusively by admin. Default false — opt-in per vendor.';

comment on column demo_vendors.discover_eligible_at is
  'Timestamp when discover_eligible was last set to true. Audit trail.';
