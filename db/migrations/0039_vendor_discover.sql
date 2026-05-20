-- 0039_vendor_discover.sql
-- Block 5: vendor_portfolio, vendor_discover_requests, couture tables,
-- vendor_featured_submissions, admin_activity_log.
-- Idempotent. All ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS.

-- ── vendor_portfolio ──────────────────────────────────────────────────────────
create table if not exists vendor_portfolio (
  id                uuid        primary key default gen_random_uuid(),
  vendor_id         uuid        not null references vendors(id) on delete cascade,
  image_url         text        not null,
  caption           text,
  aesthetic_tags    jsonb       not null default '[]'::jsonb,
  is_hero           boolean     not null default false,
  in_carousel       boolean     not null default true,
  approval_state    text        not null default 'pending'
                                check (approval_state in ('pending','approved','rejected')),
  reviewed_by_admin text,
  reviewed_at       timestamptz,
  rejection_reason  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists vendor_portfolio_vendor_idx
  on vendor_portfolio (vendor_id, approval_state);

create index if not exists vendor_portfolio_pending_idx
  on vendor_portfolio (approval_state, created_at)
  where approval_state = 'pending';

drop trigger if exists vendor_portfolio_set_updated_at on vendor_portfolio;
create trigger vendor_portfolio_set_updated_at
  before update on vendor_portfolio
  for each row execute function set_updated_at();

-- ── vendors additions ─────────────────────────────────────────────────────────
alter table vendors
  add column if not exists discover_eligible      boolean not null default false,
  add column if not exists discover_request_state text
    check (discover_request_state in
      ('not_requested','requested','under_review','approved','denied','revoked')),
  add column if not exists couture_eligible       boolean not null default false,
  add column if not exists featured_eligible      boolean not null default false;

-- ── vendor_discover_requests ──────────────────────────────────────────────────
create table if not exists vendor_discover_requests (
  id               uuid        primary key default gen_random_uuid(),
  vendor_id        uuid        not null references vendors(id) on delete cascade,
  state            text        not null check (state in
                                 ('requested','under_review','approved','denied','revoked')),
  reason           text,
  decided_by_admin text,
  decided_at       timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists vendor_discover_requests_vendor_idx
  on vendor_discover_requests (vendor_id, created_at desc);

create index if not exists vendor_discover_requests_pending_idx
  on vendor_discover_requests (state, created_at)
  where state in ('requested', 'under_review');

-- ── couture_appointments ──────────────────────────────────────────────────────
create table if not exists couture_appointments (
  id                   uuid        primary key default gen_random_uuid(),
  vendor_id            uuid        not null references vendors(id) on delete cascade,
  couple_id            uuid        references couples(id) on delete set null,
  appointment_at       timestamptz not null,
  duration_minutes     integer     not null default 60,
  fee_inr              integer     not null,
  state                text        not null default 'booked'
                                   check (state in ('booked','confirmed','completed','cancelled','no_show')),
  razorpay_order_id    text,
  paid_at              timestamptz,
  vendor_payout_inr    integer,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists couture_appointments_vendor_idx
  on couture_appointments (vendor_id, appointment_at);
create index if not exists couture_appointments_couple_idx
  on couture_appointments (couple_id, appointment_at);

drop trigger if exists couture_appointments_updated_at on couture_appointments;
create trigger couture_appointments_updated_at
  before update on couture_appointments
  for each row execute function set_updated_at();

-- ── couture_availability ──────────────────────────────────────────────────────
create table if not exists couture_availability (
  id                       uuid        primary key default gen_random_uuid(),
  vendor_id                uuid        not null references vendors(id) on delete cascade,
  slot_at                  timestamptz not null,
  duration_minutes         integer     not null default 60,
  fee_inr                  integer     not null,
  state                    text        not null default 'open'
                                       check (state in ('open','booked','blocked')),
  booked_by_appointment_id uuid        references couture_appointments(id) on delete set null,
  created_at               timestamptz not null default now(),
  unique (vendor_id, slot_at)
);

create index if not exists couture_availability_vendor_state_idx
  on couture_availability (vendor_id, state, slot_at);

-- ── vendor_featured_submissions ───────────────────────────────────────────────
create table if not exists vendor_featured_submissions (
  id                  uuid        primary key default gen_random_uuid(),
  vendor_id           uuid        not null references vendors(id) on delete cascade,
  slot_kind           text        not null check (slot_kind in
                                    ('discover_top','spotlight','blind_swipe_priority','newsletter')),
  hero_image_id       uuid        references vendor_portfolio(id) on delete set null,
  caption             text,
  proposed_start_date date,
  proposed_end_date   date,
  fee_inr             integer     not null,
  razorpay_order_id   text,
  paid_at             timestamptz,
  state               text        not null default 'submitted'
                                  check (state in
                                    ('submitted','under_review','approved','rejected','live','expired','refunded')),
  scheduled_start     timestamptz,
  scheduled_end       timestamptz,
  rejection_reason    text,
  decided_by_admin    text,
  decided_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists vendor_featured_submissions_vendor_idx
  on vendor_featured_submissions (vendor_id, created_at desc);
create index if not exists vendor_featured_submissions_admin_idx
  on vendor_featured_submissions (state, created_at)
  where state in ('submitted', 'under_review');

drop trigger if exists vendor_featured_submissions_updated_at on vendor_featured_submissions;
create trigger vendor_featured_submissions_updated_at
  before update on vendor_featured_submissions
  for each row execute function set_updated_at();

-- ── admin_activity_log ────────────────────────────────────────────────────────
create table if not exists admin_activity_log (
  id          uuid        primary key default gen_random_uuid(),
  admin_email text        not null,
  action      text        not null,
  target_type text,
  target_id   uuid,
  metadata    jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists admin_activity_log_target_idx
  on admin_activity_log (target_type, target_id, created_at desc);
create index if not exists admin_activity_log_admin_idx
  on admin_activity_log (admin_email, created_at desc);
