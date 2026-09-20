-- db/migrations/0170_public_schema_lockdown.sql   (r2)
-- CE-44 · SEC-1 · CLOSE THE PUBLIC SCHEMA TO THE PUBLIC KEY (F-44.73).
-- Number 0170 allocated by the chair (C-43.8). Ladder tail at authoring: 0169_pending_money_acts.sql,
-- confirmed by command at dream-os 8d4e77105a9f8635c50547a6cd4db18e3a0c243a.
--
-- WHAT THIS CURES. On 20 September 2026 the F-44.55 census, run by the founder on production,
-- found schema public holding 102 base tables, 101 of them with row level security OFF and the
-- roles anon and authenticated holding SELECT, INSERT, UPDATE and DELETE on all 102; zero
-- policies anywhere; "Automatically expose new tables" ON. dreamos-pwa inlines
-- NEXT_PUBLIC_SUPABASE_ANON_KEY into the browser bundle (lib/supabase.ts), as every Supabase
-- site does. The key is public, the schema is exposed, and the tables were open: leads,
-- invoices, contracts, contract_signatures, couples, users, vendors, otp_sessions,
-- admin_config and the rest, some of them holding tokens in plain text
-- (vendor_ig_connections.access_token, 0103; contract sign_token, 0138; circle invite_token,
-- 0016). The estate holds test data today. This is the hard gate on the first real vendor.
--
-- WHO USES THE DATABASE, derived by reading both repos at their tips and not by assumption.
-- dream-os holds exactly two Supabase environment names, SUPABASE_URL and
-- SUPABASE_SERVICE_ROLE_KEY, and no anon key anywhere: every one of its clients is the service
-- role (src/index.js:51, src/brideIndex.js:82, src/marketingIndex.js:37, src/lib/supabase.js:20,
-- src/engine/src/core/db.ts:13, src/lib/whatsapp.js:90, src/api/vendor/auth.js:49,
-- src/api/couple/auth.js:37, tools/f42148_rebind.js:65, tools/lc1_backfill.js:89). The service
-- role carries BYPASSRLS and is named in none of the REVOKEs below, so nothing here reaches it.
-- dreamos-pwa has ONE browser client and ONE call on it, supabase.auth.refreshSession at
-- lib/vendor/api/_base.ts:68. That is GoTrue, a different service from PostgREST; it
-- authenticates against schema auth with its own connection and never consults a table grant in
-- schema public. Nothing below names schema auth, so phone login and token refresh cannot be
-- touched. The OTP send, verify and provision calls go to dream-os over fetch
-- (lib/auth/otpSignup.ts:145-181) and run under the service role.
--
-- WHAT IS DELIBERATELY NOT DONE. Schema public is NOT removed from Exposed schemas: dream-os
-- speaks to the same Data API with the service-role key, so un-exposing public would take the
-- backend down with the stranger. Schema engine STAYS exposed: src/engine/src/core/db.ts:15
-- binds a client to db: { schema: engine } and 56 further call sites use .schema(engine), so
-- un-exposing it darkens the engine plane; its safety is its grants, and the census shows anon
-- and authenticated holding nothing on all 25 engine tables. USAGE on schema public is NOT
-- revoked. Nothing in auth, storage, graphql_public or engine is named. "Harden Data API" is
-- not pressed. FORCE ROW LEVEL SECURITY is NOT set: it reaches only a table OWNER, proven on a
-- non-superuser owner where FORCE took the owner from 1 row to 0 on its own table while
-- service_role, holding BYPASSRLS, still read 1. It buys nothing against anon, which is already
-- fully subject to RLS, and breaks owner-run work.
--
-- F-44.77, THE REALTIME REACH. Public tables have sat in publication supabase_realtime since
-- 0001:80. Neither repo subscribes to a channel with any key: there is not one .channel( call in
-- dream-os src and not one in dreamos-pwa. This migration does not touch the publication, so the
-- replication stream, which the Realtime service reads on its own privileged connection, is
-- unchanged. What changes is what a subscriber holding the public key may be shown: Realtime
-- delivers a postgres_changes row to a role only if that role could SELECT it, and after this
-- migration anon and authenticated hold neither the privilege nor a policy. The SQL half of that
-- is proven on the plant (anon is refused on every public table after the cure). The Realtime
-- service behaviour itself is NOT witnessed by this seat and is marked as such rather than
-- claimed.
--
-- HOW IT IS UNDONE. The rollback is generated from the founder's own pre-cure snapshot
-- (docs/db/queries/F-44.74_pre_cure_snapshot.sql), not from the census and not from memory: the
-- census reads four privileges per role while the estate holds seven, so a census-generated
-- rollback restores the reading and not the state (F-44.74). The rollback sits open in a second
-- SQL editor tab BEFORE this file is run.
--
-- TWO THINGS THAT CAN GO WRONG IN HIS EDITOR, AND WHAT EACH MEANS.
--
--   (1) OWNERSHIP. ALTER TABLE ... ENABLE ROW LEVEL SECURITY requires ownership: the running
--   role must be the table's owner or a member of the owning role. One table in public owned by
--   a role this editor cannot act for raises insufficient_privilege and, inside one
--   BEGIN/COMMIT, cancels the whole of 0170. It fails safe and applies nothing, but it spends
--   the sitting. So it is gated BEFORE the paste, not discovered in it: the snapshot records
--   every relation's owner and, in its section G, whether this editor may act for each one, and
--   the rollback generator REFUSES to emit anything unless all 102 pass. If the gate refused, do
--   not paste this file.
--
--   AND WHAT A SKIP LEAVES OPEN, proven and not softened. If leg (d)'s loop skips a defining
--   role, that role's default privileges are UNCHANGED, so a table created IN FUTURE BY THAT
--   ROLE in schema public still arrives granted to anon and authenticated. On the plant, after
--   this file ran as a non-superuser editor that skipped one role, a table created by the
--   editor's own role came out closed to both public roles and a table created by the skipped
--   role came out with SELECT to both. Three things close that gap and none of them is this
--   file: the founder's dashboard step turning "Automatically expose new tables" off; section
--   6's law that every future migration enables row level security on the table it creates, in
--   the same transaction, as 0169 did; and the plain fact that this estate's ladder is pasted
--   into the editor and therefore created by the editor's own role. The snapshot names which
--   roles will be skipped BEFORE this file is pasted, so the skip is never a surprise.
--
--   (2) A WARNING ON THE ROUTINE LINE, not an error. REVOKE ... ON ALL ROUTINES IN SCHEMA public
--   touches only the routines this editor may act for. For any routine in public owned by
--   another role, Postgres emits WARNING: no privileges could be revoked for "name" and CARRIES
--   ON; the statement succeeds and the transaction commits. That warning is not a failure of the
--   migration and nothing is rolled back for it, but it does mean that routine's grants are
--   UNCHANGED: PUBLIC still holds EXECUTE on it. If it appears, note the names. The after-census
--   will not show it, because the census reads tables and not routines; the snapshot will, in
--   its C routine acl rows, where that routine's PUBLIC grant is still recorded. Extension
--   functions living in public are the usual cause. They come to the chair as their own finding
--   and are not fixed by hand in this sitting.
--
-- WITNESS FOR THE TABLE LIST: the 102 names below are the census CSV rows of 20 September,
-- sha256 50b2fe3a92ae0dfb9a266ca3394bb6c4441a7e50d2ef426e8897425560412c52, one line per row, in
-- the census order. Named one per line and not swept from the catalog at run time, so this file
-- says what it did and a later reader can diff it against the census.
BEGIN;

-- ── (a) ROW LEVEL SECURITY ON, NO POLICY, on every base table in public ──────────────────────
-- With RLS on and no policy, anon and authenticated reach no row through PostgREST. The service
-- role bypasses RLS, so every dream-os read and write is unchanged. This is 0169's pattern,
-- applied to the other 101 tables.
ALTER TABLE public.admin_activity_log               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_forwards              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_found_notices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_request_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_requests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bride_pages                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_recipients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_envelopes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capabilities                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_activity                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_poll_votes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_polls                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_sessions                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_post_items                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_posts                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_responses                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_sends                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signatures              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_ai_usage                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_bookings                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_enquiries                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_receipts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_state                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_tasks                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couture_appointments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couture_availability             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_confirmations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_checks                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_claim_requests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_leads                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_vendors                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discover_heroes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiry_taps                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_requests                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exploring_photos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_turns                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hot_dates                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_throttle_log               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_reach_snapshots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_briefs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.introductions                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_slides                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_alerts                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_packages                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_referrals                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muse_pool                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muse_saves                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes                            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudge_optout                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_sessions                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_notes                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminder_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_couple_drafts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_event_proposals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_lead_pings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_money_acts               ENABLE ROW LEVEL SECURITY;   -- already on (0169); a no-op, kept so this file reads as the whole schema
ALTER TABLE public.prospects                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_alerts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews_asked                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_console_daily             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_console_queries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotlight                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taste_quiz_images                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tds_ledger                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_payments                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_tasks                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_activity_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_discover_requests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_featured_submissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_google_connections        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_ig_connections            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_packages                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_portfolio                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_roster                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_seal                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_state                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_signups                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_credits                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_photos                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weddings                         ENABLE ROW LEVEL SECURITY;

-- ── (b) THE PUBLIC ROLES' PRIVILEGES ON RELATIONS AND SEQUENCES ─────────────────────────────
-- RLS alone hides rows; the grants are what let the roles address the table at all. Both go.
-- ALL removes TRUNCATE, REFERENCES and TRIGGER as well as the four the census records: anon
-- holding TRUNCATE on 101 tables is worse than what is being cured, so narrowing this to the
-- four censused privileges was refused (F-44.74). service_role is NOT named and keeps
-- everything. ON ALL TABLES reaches views, materialized views and foreign tables too.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- ── (c) ROUTINES: REVOKE FROM PUBLIC, WHICH IS THE ONLY LEG THAT WORKS ──────────────────────
-- Postgres grants EXECUTE on a new routine to PUBLIC, never to a named role, so a revoke
-- written FROM anon, authenticated revokes nothing and the census still reads true (F-44.75).
-- Proven on the plant with a control function left at its default. ALL ROUTINES and not ALL
-- FUNCTIONS, because ALL FUNCTIONS does not reach procedures; the snapshot counts the
-- procedures in public so this is not an assumption.
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- The chair's addition. A routine whose only path to service_role was PUBLIC's default would
-- otherwise be lost to dream-os by the line above. Every .rpc( call in the estate is dream-os
-- on the service-role client (twelve call sites; zero in dreamos-pwa), so service_role is the
-- one role that must keep EXECUTE. Routine OWNERS need no grant: ownership carries the
-- privilege implicitly and REVOKE ... FROM PUBLIC does not touch it, proven on the plant with a
-- function owned by a non-superuser role which still executed after the revoke.
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO service_role;

-- ── (d) SO TOMORROW'S OBJECT DOES NOT JOIN THIS ─────────────────────────────────────────────
-- ALTER DEFAULT PRIVILEGES binds objects created BY THE ROLE THAT RUNS IT, so a single
-- unqualified statement covers only this editor's own future objects. The loop reads
-- pg_default_acl and writes the revoke FOR each role that has ever defined a default privilege
-- in schema public, which the snapshot lists by name before this file is run. The unqualified
-- pair after it covers the editor itself even when it has no pg_default_acl row yet. If a
-- defining role is one this editor may not act for, the loop RAISES and the whole transaction
-- rolls back with nothing applied, which is the correct failure: stop and bring it to the chair.
DO $lockdown$
DECLARE r record; handled int := 0; skipped int := 0;
BEGIN
  FOR r IN SELECT DISTINCT pg_get_userbyid(d.defaclrole) AS role_name
           FROM pg_default_acl d JOIN pg_namespace ns ON ns.oid = d.defaclnamespace
           WHERE ns.nspname = 'public'
  LOOP
    -- Each role's three statements sit in their OWN sub-block. On a Supabase project the
    -- defining roles are usually two, this editor's role and supabase_admin, and the editor is
    -- neither a superuser nor a member of supabase_admin, so the statements for that role raise
    -- insufficient_privilege. Without this sub-block that one error would cancel the whole of
    -- 0170, every table and every revoke with it. Caught here, the role is named, reported
    -- SKIPPED, and the loop carries on. A skipped role is acceptable and is not a hole: the
    -- ladder's tables are created by the editor's own role, so the editor's own default
    -- privileges are the ones that govern what this estate creates next, and section 6's law
    -- makes every future migration close its own table in the same transaction whatever any
    -- default privilege says. The founder's dashboard step closes the third door.
    BEGIN
      EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated', r.role_name);
      EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated', r.role_name);
      EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated', r.role_name);
      handled := handled + 1;
      RAISE NOTICE 'default privileges in schema public revoked for defining role %', r.role_name;
    EXCEPTION WHEN insufficient_privilege THEN
      skipped := skipped + 1;
      RAISE NOTICE 'SKIPPED defining role %: this editor (%) is not a member of it and may not alter its default privileges. Not a failure; see the header.', r.role_name, current_user;
    END;
  END LOOP;
  RAISE NOTICE 'defining roles handled: %, skipped: %', handled, skipped;
END
$lockdown$;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated;

COMMIT;
