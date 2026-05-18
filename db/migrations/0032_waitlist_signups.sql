-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0032: waitlist_signups
--
-- CONTEXT
-- Phase 2, Session P2-3. Foundation for the landing page waitlist forms.
--
-- The landing page at thedreamwedding.in is the single front door for
-- everyone. It has two waitlist forms — Dreamers (brides) and Makers
-- (vendors) — that capture interest from people who don't yet have an
-- invite code. Each form captures three fields: name, phone, instagram
-- handle. After submit, the user sees:
--
--   "We are onboarding in small batches and shall be getting in touch
--    with you soon."
--
-- Submission does NOT grant entry. Admin triages signups manually and
-- mints invite codes for the ones they want to invite (via the admin
-- invite_codes flow built in P2-3). Bulk admin triage UI lands in the
-- post-Phase 2 admin session.
--
-- DATA CONTRACT
--   kind                 dreamer | maker  (which form was submitted)
--   name                 raw, as user typed
--   phone                E.164 with leading + (e.g. +918757788550)
--                        Frontend renders a country-code dropdown defaulting
--                        to +91 India; user picks country, types digits;
--                        frontend submits the joined E.164 string.
--                        API validates regex ^\+[0-9]{8,15}$ before insert.
--                        Same invariant as users.phone (0001).
--   instagram_handle     raw, no @, no normalisation
--                        Mirrors vendors.instagram_handle (0005). API strips
--                        leading @ and trims whitespace before insert.
--   status               new (default) | contacted | invited | ignored
--                        Admin-managed triage state. new = freshly submitted.
--   notes                Admin-only triage notes. Never user-visible.
--
-- NO UNIQUE CONSTRAINT ON PHONE
-- A person may legitimately submit twice (as Dreamer first, then later as
-- Maker; or re-submit months later after silence). UNIQUE would silently
-- reject the second submission. Better: capture every signup, let admin
-- see the duplicate row and decide. The created_at chronology + status
-- column are sufficient for admin triage.
--
-- NO ROW-LEVEL SECURITY
-- Consistent with the rest of dream-os: RLS stays disabled until Phase 3
-- before Discover. service_role key in Railway. The API endpoint
-- /api/v2/waitlist/signup is the only public-facing write path.
--
-- INDEX STRATEGY
-- The dominant admin query is "show me new signups, newest first."
-- Two indexes back this:
--   1. Partial index on (created_at desc) WHERE status = 'new'
--      — tiny, hot, the daily triage path
--   2. Plain index on (created_at desc)
--      — full chronology browse, all statuses
--
-- IMMUTABILITY: never edit this file. Changes go in 0033+.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. waitlist_signups table ───────────────────────────────────────────
create table if not exists waitlist_signups (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null check (kind in ('dreamer','maker')),
  name              text not null,
  phone             text not null,
  instagram_handle  text not null,
  status            text not null default 'new'
                       check (status in ('new','contacted','invited','ignored')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table waitlist_signups is
  'Landing-page waitlist submissions. One row per submission. Submission grants no access — admin triages and may mint an invite_code as a follow-up. Both Dreamer and Maker forms write here; kind distinguishes them.';

comment on column waitlist_signups.kind is
  'dreamer = bride waitlist form. maker = vendor waitlist form. Determines admin triage queue.';

comment on column waitlist_signups.name is
  'Raw name as entered. No case normalisation.';

comment on column waitlist_signups.phone is
  'E.164 with leading + (e.g. +918757788550). Frontend country-code dropdown defaults to +91 India. API validates ^\+[0-9]{8,15}$ before insert. No UNIQUE constraint — duplicate submissions are allowed and visible to admin.';

comment on column waitlist_signups.instagram_handle is
  'Raw IG handle without leading @. API strips @ and trims whitespace before insert. Mirrors vendors.instagram_handle convention from 0005.';

comment on column waitlist_signups.status is
  'Admin triage state. new (default) = freshly submitted. contacted = admin reached out. invited = invite_code minted for this person. ignored = admin chose not to pursue.';

comment on column waitlist_signups.notes is
  'Admin-only internal notes. E.g. "saw on Anjali''s story", "follow up in Q4". Never returned by any user-facing endpoint.';

-- ── 2. Indexes ──────────────────────────────────────────────────────────
-- Partial index for the daily admin "new signups" query — tiny and hot.
create index if not exists waitlist_signups_new_recent_idx
  on waitlist_signups(created_at desc)
  where status = 'new';

-- Full chronology index for admin browse across all statuses.
create index if not exists waitlist_signups_created_at_idx
  on waitlist_signups(created_at desc);

-- ── 3. updated_at trigger ───────────────────────────────────────────────
-- Reuses the set_updated_at() function defined in 0001. Same pattern as
-- every other table with updated_at (vendors, couples, clients, leads,
-- invoices, expenses, muse_saves, circle_members, etc).
create trigger waitlist_signups_updated_at
  before update on waitlist_signups
  for each row execute function set_updated_at();
