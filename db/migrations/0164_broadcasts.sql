-- db/migrations/0164_broadcasts.sql — G4.3 · BROADCASTS TO HER PAST COUPLES. CE-42 seat R6, packet 4b-2.
-- 0164 ALLOCATED BY THE CHAIR on fork 9's shape (R-40.44). Append-only (LD-8).
--
-- SQL PROVENANCE (protocol §10): the two tables are NEW — their witness is these statements.
--   FK target public.vendors(id): PUBLIC_SCHEMA.md @0154 :1385 (1. id uuid NOT NULL).
--   Statement 6 WRITES public.capabilities — constraints cited from their home, db/migrations/0149_capabilities.sql:16–:20
--   and :32–:33 (capabilities_pkey (key) · kind CHECK · status CHECK · key grammar CHECK · auto_on needs walk_ref).
--   0155–0162 touch neither vendors' id nor capabilities' shape (0155 writes capabilities ROWS only).
--
-- RULINGS CARRIED: fork 6 (the list: clients ∪ wedding couple/consent phones ∪ booked leads, last-ten de-dup,
-- source carried) · fork 7 (marketing line) · fork 9 (these two tables, the receipt arm and the partial UNIQUE on
-- wamid in the SAME delivery — R-40.110; once-a-year on the referral kind by a partial UNIQUE) · F-42.171
-- (stopped_at: a STOP to HER broadcast stops HER broadcasts to that number, and never touches prospects) ·
-- 4b-2 ruling (b) (replied_at + reply_text: a matched reply is stored, never only logged).
-- Every statement is its own paste block in the Supabase editor (R-40.31).

-- ── 1 · THE BROADCAST — one row per send she confirmed ─────────────────────────
-- Written only when the send is ARMED (the door reads the template's row first), so a dark attempt
-- never spends the referral's year.
create table if not exists public.broadcasts (
  id               uuid primary key default gen_random_uuid(),
  vendor_id        uuid not null references public.vendors(id) on delete cascade,
  kind             text not null check (kind in ('couple', 'referral')),
  template_name    text not null,                         -- the Meta name sent, e.g. tdw_couple_broadcast
  recipient_count  integer not null check (recipient_count >= 0),
  created_at       timestamptz not null default now()
);

-- ── 2 · ITS RECIPIENTS — one row per number, the wamid's home ──────────────────
-- vendor_id is carried (not only reachable through broadcast_id) so the STOP refusal and the inbound
-- match read one table: "has she been told STOP by this number" is (vendor_id, phone, stopped_at).
create table if not exists public.broadcast_recipients (
  id            uuid primary key default gen_random_uuid(),
  broadcast_id  uuid not null references public.broadcasts(id) on delete cascade,
  vendor_id     uuid not null references public.vendors(id) on delete cascade,
  phone         text not null,                             -- E.164, through the estate's normaliser
  source        text not null check (source in ('client', 'wedding_couple', 'wedding_consent', 'booked_lead')),
  status        text not null default 'queued'
                check (status in ('queued', 'sent', 'sent_no_wamid', 'delivered', 'read', 'failed', 'refused_stopped')),
  wamid         text,
  error_code    text,
  error_title   text,
  stopped_at    timestamptz,                               -- F-42.171: her STOP; set by the marketing inbound arm
  -- RULED (b), 4b-2: a reply that is not STOP is HER fact and is stored here, not only logged. replied_at is the
  -- latest reply; reply_text keeps every reply in arrival order, newline-separated (never overwritten). Plain text:
  -- no figure is parsed out of it (wallet law). A later packet shows her the replies in the Broadcast section.
  replied_at    timestamptz,
  reply_text    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── 3 · ONCE A YEAR, ON THE REFERRAL KIND ONLY ─────────────────────────────────
-- The year is the IST calendar year of the send. `AT TIME ZONE` with a literal zone is immutable, so the
-- expression may key a unique index (proven on PostgreSQL 16 at the cut); a second referral row in the same
-- IST year is refused BY THE DATABASE, whatever the door does.
create unique index if not exists uq_broadcasts_referral_year
  on public.broadcasts (vendor_id, kind, (extract(year from (created_at at time zone 'Asia/Kolkata'))))
  where kind = 'referral';

-- ── 4 · THE WAMID IS UNIQUE WHERE IT EXISTS (R-40.110, 0161's shape) ────────────
create unique index if not exists uq_broadcast_recipients_wamid
  on public.broadcast_recipients (wamid) where wamid is not null;

-- ── 5 · THE STOP / INBOUND LOOKUP ──────────────────────────────────────────────
create index if not exists broadcast_recipients_vendor_phone_idx
  on public.broadcast_recipients (vendor_id, phone);

-- ── 6 · THE TWO TEMPLATE GATES ON THE SWITCHBOARD ───────────────────────────────
-- Read directly at the door (TDW_INTRODUCTION's precedent — no flag.*, no TEMPLATE_GUARDS entry). Seeded at
-- their Manager state of 2026-09-10 (docs/TEMPLATES.md rows 16/17); the sweep's first read replaces evidence.
-- `approved` means Meta yes, the founder not yet: his Switchboard tap moves couple → on.
insert into public.capabilities (key, kind, status, evidence) values
  ('template.tdw_couple_broadcast',   'template', 'approved', 'seed: Active – Quality pending · MARKETING · ID 1397634775892426 (TEMPLATES.md row 16, 2026-09-10)'),
  ('template.tdw_referral_broadcast', 'template', 'pending',  'seed: In review · MARKETING · ID 1057756639996847 (TEMPLATES.md row 17, 2026-09-10)')
on conflict (key) do nothing;
