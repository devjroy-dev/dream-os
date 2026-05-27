-- 0057_demo_system.sql
-- TDW Demo System — clean rebuild after vendor demo deletion.
--
-- Three new tables completely isolated from real data:
--   demo_vendors   — demo vendor profiles (photos + metadata)
--   demo_leads     — enquiries from verified demo brides
--   demo_muse_pool — curated images for bride demo Muse board
--
-- ISOLATION:
--   - demo_vendors has NO FK to real vendors/users tables
--   - demo_leads has NO FK to real leads/vendors/users tables
--   - demo_muse_pool is admin-curated, no user data
--
-- otp_sessions table already exists (0033) and is reused for demo bride OTP
-- with purpose='demo_enquiry' — a new allowed value added below.

-- ── 1. demo_vendors ──────────────────────────────────────────────────────────
create table if not exists demo_vendors (
  id                uuid primary key default gen_random_uuid(),
  ig_handle         text not null unique,           -- URL key: /demo/makeupbyswatiroy
  display_name      text not null,                  -- Shown on demo landing
  category          text not null,
  city              text not null,
  whatsapp_phone    text,                           -- Optional: where to send lead notifications
  about             text,
  rate_display      text,                           -- e.g. "₹50K – ₹2L"
  photos            jsonb not null default '[]',    -- [{url, is_hero, cloudinary_id}]
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  created_by        text not null default 'admin'
);

create index if not exists demo_vendors_ig_handle_idx on demo_vendors(ig_handle);
create index if not exists demo_vendors_active_idx    on demo_vendors(active);

comment on table demo_vendors is
  'Demo vendor profiles. Completely separate from real vendors table.
   Photos stored as JSONB array. No FK to users or vendors.
   ig_handle is the URL key for /demo/:handle routes.';

-- ── 2. demo_leads ─────────────────────────────────────────────────────────────
create table if not exists demo_leads (
  id                  uuid primary key default gen_random_uuid(),
  demo_vendor_id      uuid not null references demo_vendors(id) on delete cascade,
  demo_vendor_handle  text not null,
  bride_name          text not null,
  bride_phone         text not null,
  bride_ig_handle     text,
  bride_email         text,
  bride_wedding_date  date,
  bride_wedding_city  text,
  otp_verified        boolean not null default false,
  notified_vendor     boolean not null default false,  -- true once WA notification sent
  admin_notified      boolean not null default false,  -- true once admin WA notification sent
  created_at          timestamptz not null default now()
);

create index if not exists demo_leads_vendor_id_idx  on demo_leads(demo_vendor_id);
create index if not exists demo_leads_created_at_idx on demo_leads(created_at desc);
create index if not exists demo_leads_notified_idx   on demo_leads(notified_vendor, admin_notified);

comment on table demo_leads is
  'Enquiries from demo brides to demo vendors. Completely separate from real leads table.
   OTP verified before lead is saved. notified_vendor = false means admin needs to relay manually.';

-- ── 3. demo_muse_pool ────────────────────────────────────────────────────────
create table if not exists demo_muse_pool (
  id                uuid primary key default gen_random_uuid(),
  image_url         text not null,
  cloudinary_id     text,
  tags              text[] not null default '{}',    -- lehenga, decor, jewellery, mehendi, etc.
  caption           text,
  display_order     integer not null default 0,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

create index if not exists demo_muse_pool_active_idx on demo_muse_pool(active, display_order);

comment on table demo_muse_pool is
  'Admin-curated images for bride demo Muse board.
   Shown to all bride demo users. No user data — purely content.';

-- ── 4. Extend otp_sessions purpose to allow demo_enquiry ─────────────────────
-- The existing purpose check only allows login | reset.
-- We add demo_enquiry for bride demo OTP verification.
alter table otp_sessions
  drop constraint if exists otp_sessions_purpose_check;

alter table otp_sessions
  add constraint otp_sessions_purpose_check
  check (purpose in ('login', 'reset', 'demo_enquiry'));

comment on column otp_sessions.purpose is
  'login = vendor/couple login. reset = forgot-pin. demo_enquiry = bride demo enquiry OTP.';
