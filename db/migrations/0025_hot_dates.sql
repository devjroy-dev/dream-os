-- Migration 0025 — hot_dates table
-- Phase 2, P2-1 lift 3 (hot_dates_context tool)
-- Applied: (pending)
--
-- Stores Vivah Muhurat and other auspicious Indian wedding dates.
-- No vendor_id — shared reference table, read-only from agent.
-- Swati or Dev populates annually via Supabase dashboard.
-- Update each October for the following year's dates.

create table if not exists hot_dates (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  note       text,
  region     text default 'All India',
  created_at timestamptz not null default now()
);

create index if not exists idx_hot_dates_date on hot_dates (date);

-- Seed 2026 Vivah Muhurat dates
-- Source: standard Hindu Panchang 2026. Update annually each October.
insert into hot_dates (date, note, region) values
  ('2026-01-17', 'Makar Sankranti window opens', 'All India'),
  ('2026-01-19', '', 'All India'),
  ('2026-01-23', '', 'All India'),
  ('2026-01-27', '', 'All India'),
  ('2026-01-29', '', 'All India'),
  ('2026-02-03', '', 'All India'),
  ('2026-02-06', '', 'All India'),
  ('2026-02-07', '', 'All India'),
  ('2026-02-12', '', 'All India'),
  ('2026-02-15', '', 'All India'),
  ('2026-02-18', '', 'All India'),
  ('2026-02-22', '', 'All India'),
  ('2026-02-26', '', 'All India'),
  ('2026-03-01', '', 'All India'),
  ('2026-03-05', '', 'All India'),
  ('2026-04-18', 'Post-Holi season opens', 'All India'),
  ('2026-04-22', '', 'All India'),
  ('2026-04-26', 'Akshaya Tritiya — highly auspicious, self-certified muhurat', 'All India'),
  ('2026-04-29', '', 'All India'),
  ('2026-05-03', '', 'All India'),
  ('2026-05-07', '', 'All India'),
  ('2026-05-10', '', 'All India'),
  ('2026-05-14', '', 'All India'),
  ('2026-05-17', '', 'All India'),
  ('2026-05-20', '', 'All India'),
  ('2026-11-15', 'Dev Uthani Ekadashi — peak season opens', 'All India'),
  ('2026-11-18', '', 'All India'),
  ('2026-11-22', '', 'All India'),
  ('2026-11-25', '', 'All India'),
  ('2026-11-29', '', 'All India'),
  ('2026-12-02', '', 'All India'),
  ('2026-12-06', '', 'All India'),
  ('2026-12-09', '', 'All India'),
  ('2026-12-13', '', 'All India'),
  ('2026-12-14', '', 'All India'),
  ('2026-12-17', '', 'All India'),
  ('2026-12-20', '', 'All India'),
  ('2026-12-23', '', 'All India'),
  ('2027-01-15', 'Makar Sankranti 2027 window opens', 'All India'),
  ('2027-01-18', '', 'All India'),
  ('2027-01-22', '', 'All India'),
  ('2027-01-26', '', 'All India'),
  ('2027-01-28', '', 'All India'),
  ('2027-02-01', '', 'All India'),
  ('2027-02-05', '', 'All India'),
  ('2027-02-09', '', 'All India'),
  ('2027-02-14', '', 'All India'),
  ('2027-02-17', '', 'All India'),
  ('2027-02-21', '', 'All India'),
  ('2027-02-25', '', 'All India'),
  ('2027-03-01', '', 'All India'),
  ('2027-04-17', 'Post-Holi season 2027 opens', 'All India'),
  ('2027-04-28', 'Akshaya Tritiya 2027', 'All India'),
  ('2027-11-04', 'Dev Uthani Ekadashi 2027 — peak season opens', 'All India'),
  ('2027-11-07', '', 'All India'),
  ('2027-11-11', '', 'All India'),
  ('2027-11-14', '', 'All India'),
  ('2027-11-18', '', 'All India'),
  ('2027-11-21', '', 'All India'),
  ('2027-11-25', '', 'All India'),
  ('2027-11-28', '', 'All India'),
  ('2027-12-02', '', 'All India'),
  ('2027-12-05', '', 'All India'),
  ('2027-12-09', '', 'All India'),
  ('2027-12-12', '', 'All India');

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
