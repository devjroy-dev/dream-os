-- ══════════════════════════════════════════════════════════════════════════════
-- APPLIED TO PRODUCTION 2026-08-02 — DO NOT RE-RUN.
--
-- This file is the byte-identical text the founder ran in the Supabase SQL
-- editor on nvzkbagqxbysoeszxent (PRODUCTION) on 2026-08-02, recorded here so
-- the ladder carries what production actually executed. It is committed AFTER
-- the fact: a migration in the ladder that is silently already-applied is a trap
-- for whoever next builds a fresh environment, so the trap is labelled instead.
--
-- Its readback is in docs/TDW_08_P1_HANDOVER.md, whole, as the evidence that
-- this text is what production ran: eleven columns landed, the state CHECK at
-- eight values, the purpose CHECK at five, demo_vendors_claim_token_key unique,
-- twelve rows legacy and zero built, twelve distinct claim tokens, and presence
-- unmoved at 8 active / 5 in the couple feed / 0 eligible-but-inactive.
--
-- ON A FRESH ENVIRONMENT it is safe to run once: every statement below carries
-- its own IF NOT EXISTS / IF EXISTS guard and the backfill is bounded by a date
-- that no future row can satisfy. On THIS production database it is a no-op, but
-- the header stands rather than relying on that.
-- ══════════════════════════════════════════════════════════════════════════════

-- 0106_demo_lifecycle.sql
-- TDW_08 · P1 — the demo lifecycle engine (G-1, G-2). Ladder: follows 0105_circle_message_author.sql.
-- Spec §2 reserved 0082; superseded by the true ladder tail at CE-131. This is 0106.
--
-- AUTHORED FROM THE FOUNDER'S PASTED ROWS, 2026-08-02, and from nothing else (SQL-PROVENANCE, CE-56).
-- All eleven identifiers below were probed ABSENT on production before a byte was written;
-- otp_sessions_purpose_check's five-value replacement is written from the four-value definition
-- string as production returned it, not from the schema snapshot.
--
-- WHAT THIS TOUCHES: public.demo_vendors, public.demo_leads, public.otp_sessions. Nothing else.
-- The two PARKED partial unique indexes are absent from this file in every form, by charter.
--
-- ONE NOTE SO A PAUSE IS NOT A FAULT: claim_token's default gen_random_uuid() is VOLATILE, so
-- Postgres REWRITES the table and evaluates the default once PER ROW. "ADD COLUMN is free" is only
-- true for non-volatile defaults. At twelve rows this is instant; on a large table it would not be.
--
-- ATOMIC: the whole file runs inside one transaction. Either every statement lands or none does.

begin;

-- 1 · The ten lifecycle columns on demo_vendors, added in ONE statement so the volatile-default
--     rewrite happens once rather than ten times.
--     state's CHECK carries EIGHT values: spec §2's seven plus 'legacy' (CE-133 §3, a disclosed
--     deviation from an engineering reservations table, ruled by the chair).
--     claimed_vendor_id carries NO foreign key — see its COMMENT ON below.
alter table public.demo_vendors
  add column if not exists state text not null default 'built'
    check (state in ('legacy','built','invited','opened','engaged','claimed','expired','removed')),
  add column if not exists invited_at        timestamptz,
  add column if not exists opened_at         timestamptz,
  add column if not exists engaged_at        timestamptz,
  add column if not exists claimed_at        timestamptz,
  add column if not exists removed_at        timestamptz,
  add column if not exists expires_at        timestamptz,
  add column if not exists extension_used    boolean not null default false,
  add column if not exists claim_token       uuid    not null default gen_random_uuid(),
  add column if not exists claimed_vendor_id uuid;

-- 2 · claim_token is unique. Shipped as a unique INDEX rather than a table constraint because
--     CREATE UNIQUE INDEX supports IF NOT EXISTS and ADD CONSTRAINT does not, so this file stays
--     re-runnable. Consequence, stated so the next reader does not misread a silence: it will
--     appear in the schema snapshot's INDEX section, never in its CONSTRAINT section.
create unique index if not exists demo_vendors_claim_token_key
  on public.demo_vendors (claim_token);

-- 3 · The demo_leads soft reference. P2 writes it; P1 reads it nowhere. Named here, not latent.
alter table public.demo_leads
  add column if not exists converted_lead_id uuid;

-- 4 · THE BACKFILL, EXPLICIT AND READABLE — this is the statement the founder is meant to see.
--     Statement 1's default 'built' governs rows that DO NOT YET EXIST. That the same keyword also
--     stamps the twelve rows already on production is a side-effect of SQL, not a decision anyone
--     made — and 'built' asserts NEVER CONTACTED, which is false of legacy_jewellers (8 leads, a
--     templated prospect) and of the four inactive rows. So the twelve are moved to 'legacy'
--     UNIFORMLY, by a statement rather than by a default.
--     THE PREDICATE, derived not guessed: every row on production at this writing carries
--     created_at between 2026-05-28 and 2026-05-30 (founder-run witness, 2026-08-02, twelve rows).
--     The boundary below is the start of this migration's own day, IST — the estate's Asia/Kolkata
--     convention. No row created AFTER this file runs can match it, so the statement is re-runnable
--     and can never re-label a genuinely new 'built' row. It errs, if at all, toward leaving a row
--     'built' rather than reaching further than it was ruled to reach.
update public.demo_vendors
   set state = 'legacy'
 where state = 'built'
   and created_at < timestamptz '2026-08-02 00:00:00+05:30';

-- 5 · Widen otp_sessions.purpose to admit 'demo_claim' (P2's OTP; P1 writes no otp_sessions row).
--     Drop-then-add because a CHECK cannot be altered in place. Inside this transaction the table
--     is never unguarded from any other session's view.
--     The four incumbent values are transcribed from production's own pg_get_constraintdef output.
alter table public.otp_sessions
  drop constraint if exists otp_sessions_purpose_check;

alter table public.otp_sessions
  add constraint otp_sessions_purpose_check
  check ((purpose = any (array['login'::text, 'reset'::text, 'demo_enquiry'::text, 'circle_join'::text, 'demo_claim'::text])));

-- 6 · The F-06.85 headers. These live in the DATABASE, not only in this file, so the next schema
--     snapshot carries them and the next reader of discover_eligible_at is forced to re-read them.
comment on column public.demo_vendors.state is
  'Demo lifecycle state, TDW_08 P1. Legal values: legacy, built, invited, opened, engaged, claimed, expired, removed. Written ONLY by src/lib/demoLifecycle.js, which is also the sole writer of active, discover_eligible and discover_eligible_at, so the four presence fields cannot disagree by construction. legacy is NOT a lifecycle stage - it is a lifecycle-ABSENCE marker for the twelve rows that predate this machine and whose history was never recorded and cannot be reconstructed. No transition leads INTO legacy; its only legal exit is legacy -> invited. Feed presence is still carried by active AND discover_eligible (the additive model); state does not gate the feed and both feed indexes are untouched. THE COUSIN HAZARD, named so it is re-read: discover_eligible_at means LAST SET TO TRUE and is never cleared on revoke - the column says so itself at 0067_demo_vendor_discover.sql:24-25 - which left four production rows carrying a stamp with eligibility false. That asymmetry is why the writer was made single.';

comment on column public.demo_vendors.claim_token is
  'Opaque per-demo token for the claim and remove links, TDW_08 P1. Unique via demo_vendors_claim_token_key, which is a unique INDEX and not a table constraint: it appears in the schema snapshot index section, never in its constraint section. Every pre-existing row received a distinct token at migration time from the volatile default.';

comment on column public.demo_vendors.claimed_vendor_id is
  'SOFT reference to public.vendors(id), set on conversion by P2. Deliberately carries NO foreign key: the 0056 doctrine forbids demo -> real references, restated in the demo lane own migrations at 0057_demo_system.sql:10-11 and 0067_demo_vendor_discover.sql:9. This is INTENTIONALLY ASYMMETRIC with demo_leads.demo_vendor_id, which DOES carry a hard FK with ON DELETE CASCADE, because that reference is demo -> demo and the doctrine does not reach it. Do not harmonise them.';

comment on column public.demo_leads.converted_lead_id is
  'SOFT reference to the real lead minted when a demo converts. No foreign key, same 0056 doctrine as demo_vendors.claimed_vendor_id. Written by P2; read by nothing in P1. FILED FOR P6: demo_leads rows cascade away when their demo_vendors parent is deleted (demo_leads_demo_vendor_id_fkey, ON DELETE CASCADE), and this linkage goes with them - deletion under the resurrect window must account for it.';

commit;
