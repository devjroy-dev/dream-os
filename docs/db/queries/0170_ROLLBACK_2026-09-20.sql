-- ROLLBACK OF db/migrations/0170_public_schema_lockdown.sql
-- GENERATED, not written by hand. Source of every line below:
--   snapshot  Supabase_Snippet_Untitled_query__14_.csv
--             sha256 68090da3404bb19b53ec4225afc7762cd937375cea4692224c15daa5f14a3edf
--   census    Supabase_Snippet_Untitled_query__15_.csv
--             sha256 50b2fe3a92ae0dfb9a266ca3394bb6c4441a7e50d2ef426e8897425560412c52
--   generator gen_rollback_0170.py, CE-44 SEC-1
--
-- The two exports agreed on all seven controls before a line of this was written:
--   public base tables                                           102
--   public: RLS off                                              101
--   public: RLS off AND anon or authenticated holds a privilege  101
--   engine base tables                                           25
--   engine: RLS off                                              18
--   engine: RLS off AND anon or authenticated holds a privilege  0
--   roles present (anon, authenticated; expect 2)                2
--   the editor that took the snapshot: postgres (rolsuper=false rolbypassrls=true)
--
-- THE OWNERSHIP GATE PASSED: every one of the 102 public base tables is owned by a role this
-- editor may act for, so 0170 cannot be cancelled by an ownership refusal.
-- Every routine in public is owned by a role this editor may act for, so 0170's routine
-- line will emit no "no privileges could be revoked" warning.
--
-- WHAT 0170 WILL REPORT WHEN IT RUNS, predicted from this snapshot, not from hope:
--   default privileges HANDLED for: postgres
--   default privileges SKIPPED for: supabase_admin
--   A SKIP IS NOT A FAILURE, and it is not nothing either: a table created IN FUTURE BY
--   a skipped role would still arrive granted to anon and authenticated. Proven on the
--   plant. What closes that: the dashboard switch going off, and section 6's law that
--   every future migration enables RLS on the table it creates, in the same
--   transaction. This estate's ladder is run by the editor's own role.
--
-- WHAT IT RESTORES: for the grantees 0170 touched and no others, each object's own
-- recorded privileges; each table's own recorded relrowsecurity and relforcerowsecurity;
-- each defining role's own recorded default privileges. Grantees the cure never named are
-- never named here. A routine whose ACL was NULL before the cure is restored by an
-- explicit GRANT EXECUTE TO PUBLIC: the same effective state as Postgres's built-in
-- default, not the same catalog bytes, and said plainly rather than passed off.
--
-- WHAT IT DOES NOT TOUCH: schema engine, schema auth, schema storage, schema
-- graphql_public, USAGE on schema public, publication supabase_realtime, and any row of
-- data. It is privileges and RLS flags only.
--
-- COUNTS THE FOUNDER CAN READ BEFORE HE RUNS IT:
--   tables whose RLS flag is restored        102
--     of those, back to RLS OFF              101
--     of those, left RLS ON                  1
--   relations whose grants are restored      102
--   grant rows restored on relations         1632
--   routines whose grants are restored       15
--   defining roles for default privileges    2 (postgres, supabase_admin)
--
-- AFTER RUNNING IT: re-run the F-44.55 census. Its seven controls must read
--   102 / 101 / 101 / 25 / 18 / 0 / 2
-- which is what they read before the cure. If they do not, stop and paste what you saw.

BEGIN;

--
-- ═══════════════════════════════════════════════════════════════════════════════════════
-- C-44.11 GUARD. THIS FILE DOES NOTHING UNTIL YOU DELETE ONE LINE.
-- The DO block immediately below raises inside this transaction, so every statement after
-- it fails too and the COMMIT at the end becomes a rollback. Nothing is applied. That is
-- deliberate: this file is staged in an editor ahead of need, beside a green Run button,
-- and a sentence of prose above a green button is not a guard (e-30, 20 September 2026).
-- TO RUN THE UNDO FOR REAL: delete the one line below that ends "DELETE THIS LINE TO RUN
-- IT.", then run the file again.
-- ═══════════════════════════════════════════════════════════════════════════════════════
DO $c4411$ BEGIN RAISE EXCEPTION 'C-44.11 GUARD: this file is the UNDO of db/migrations/0170_public_schema_lockdown.sql. It restores schema public to the state of the F-44.74 snapshot of 20 September 2026, and it is not to be run by accident. DELETE THIS LINE TO RUN IT.'; END $c4411$;
--

-- ── 1 · ROW LEVEL SECURITY, each table's own flag, from its own snapshot row ──
ALTER TABLE public."admin_activity_log" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."admin_activity_log" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."admin_config" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."admin_config" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."assistance_forwards" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."assistance_forwards" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."assistance_found_notices" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."assistance_found_notices" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."assistance_request_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."assistance_request_items" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."assistance_requests" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."assistance_requests" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."billing_events" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."billing_events" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."bride_pages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."bride_pages" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."broadcast_recipients" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."broadcast_recipients" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."broadcasts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."broadcasts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."budget_envelopes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."budget_envelopes" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."capabilities" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."capabilities" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."circle_activity" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."circle_activity" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."circle_members" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."circle_members" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."circle_poll_votes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."circle_poll_votes" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."circle_polls" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."circle_polls" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."circle_sessions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."circle_sessions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."clients" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."clients" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."collab_post_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."collab_post_items" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."collab_posts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."collab_posts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."collab_responses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."collab_responses" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."contract_profiles" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."contract_profiles" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."contract_sends" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."contract_sends" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."contract_signatures" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."contract_signatures" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."contracts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."contracts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."conversations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."conversations" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."couple_ai_usage" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."couple_ai_usage" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."couple_bookings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."couple_bookings" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."couple_enquiries" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."couple_enquiries" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."couple_receipts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."couple_receipts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."couple_state" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."couple_state" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."couple_tasks" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."couple_tasks" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."couples" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."couples" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."couture_appointments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."couture_appointments" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."couture_availability" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."couture_availability" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."crew_confirmations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."crew_confirmations" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."date_checks" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."date_checks" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."demo_claim_requests" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."demo_claim_requests" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."demo_leads" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."demo_leads" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."demo_vendors" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."demo_vendors" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."discover_heroes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."discover_heroes" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."engagements" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."engagements" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."enquiry_taps" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."enquiry_taps" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."events" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."events" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."exchange_requests" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."exchange_requests" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."expenses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."expenses" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."exploring_photos" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."exploring_photos" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."failed_turns" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."failed_turns" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."hot_dates" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."hot_dates" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."image_throttle_log" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."image_throttle_log" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."influencer_reach_snapshots" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."influencer_reach_snapshots" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."instagram_briefs" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."instagram_briefs" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."introductions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."introductions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."invite_codes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."invite_codes" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."invoices" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."invoices" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."landing_slides" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."landing_slides" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."lead_alerts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."lead_alerts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."lead_packages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."lead_packages" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."lead_referrals" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."lead_referrals" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."leads" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."leads" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."messages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."messages" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."muse_pool" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."muse_pool" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."muse_saves" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."muse_saves" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."notes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."notes" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."nudge_optout" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."nudge_optout" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."otp_sessions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."otp_sessions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."owner_notes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."owner_notes" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."payment_reminder_settings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."payment_reminder_settings" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."payment_reminders" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."payment_reminders" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."payment_schedules" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."payment_schedules" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pending_couple_drafts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."pending_couple_drafts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pending_event_proposals" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."pending_event_proposals" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pending_lead_pings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."pending_lead_pings" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pending_money_acts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pending_money_acts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."prospects" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."prospects" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."referral_alerts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."referral_alerts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."reviews_asked" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."reviews_asked" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."search_console_daily" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."search_console_daily" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."search_console_queries" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."search_console_queries" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."spotlight" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."spotlight" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."taste_quiz_images" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."taste_quiz_images" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."tds_ledger" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."tds_ledger" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."team_members" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."team_members" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."team_messages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."team_messages" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."team_payments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."team_payments" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."team_tasks" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."team_tasks" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."users" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_activity_log" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_activity_log" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_discover_requests" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_discover_requests" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_featured_submissions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_featured_submissions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_google_connections" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_google_connections" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_ig_connections" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_ig_connections" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_packages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_packages" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_portfolio" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_portfolio" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_roster" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_roster" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_seal" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_seal" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_state" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_state" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."vendors" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendors" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."waitlist_signups" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."waitlist_signups" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."wedding_credits" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."wedding_credits" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."wedding_photos" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."wedding_photos" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."weddings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."weddings" NO FORCE ROW LEVEL SECURITY;

-- ── 2 · RELATION PRIVILEGES: clear what the cure left, restore what was recorded ──
REVOKE ALL ON TABLE public."admin_activity_log" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."admin_activity_log" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."admin_activity_log" TO "authenticated";
REVOKE ALL ON TABLE public."admin_config" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."admin_config" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."admin_config" TO "authenticated";
REVOKE ALL ON TABLE public."assistance_forwards" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."assistance_forwards" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."assistance_forwards" TO "authenticated";
REVOKE ALL ON TABLE public."assistance_found_notices" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."assistance_found_notices" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."assistance_found_notices" TO "authenticated";
REVOKE ALL ON TABLE public."assistance_request_items" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."assistance_request_items" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."assistance_request_items" TO "authenticated";
REVOKE ALL ON TABLE public."assistance_requests" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."assistance_requests" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."assistance_requests" TO "authenticated";
REVOKE ALL ON TABLE public."billing_events" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."billing_events" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."billing_events" TO "authenticated";
REVOKE ALL ON TABLE public."bride_pages" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."bride_pages" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."bride_pages" TO "authenticated";
REVOKE ALL ON TABLE public."broadcast_recipients" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."broadcast_recipients" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."broadcast_recipients" TO "authenticated";
REVOKE ALL ON TABLE public."broadcasts" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."broadcasts" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."broadcasts" TO "authenticated";
REVOKE ALL ON TABLE public."budget_envelopes" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."budget_envelopes" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."budget_envelopes" TO "authenticated";
REVOKE ALL ON TABLE public."capabilities" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."capabilities" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."capabilities" TO "authenticated";
REVOKE ALL ON TABLE public."circle_activity" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."circle_activity" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."circle_activity" TO "authenticated";
REVOKE ALL ON TABLE public."circle_members" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."circle_members" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."circle_members" TO "authenticated";
REVOKE ALL ON TABLE public."circle_poll_votes" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."circle_poll_votes" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."circle_poll_votes" TO "authenticated";
REVOKE ALL ON TABLE public."circle_polls" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."circle_polls" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."circle_polls" TO "authenticated";
REVOKE ALL ON TABLE public."circle_sessions" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."circle_sessions" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."circle_sessions" TO "authenticated";
REVOKE ALL ON TABLE public."clients" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."clients" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."clients" TO "authenticated";
REVOKE ALL ON TABLE public."collab_post_items" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."collab_post_items" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."collab_post_items" TO "authenticated";
REVOKE ALL ON TABLE public."collab_posts" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."collab_posts" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."collab_posts" TO "authenticated";
REVOKE ALL ON TABLE public."collab_responses" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."collab_responses" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."collab_responses" TO "authenticated";
REVOKE ALL ON TABLE public."contract_profiles" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."contract_profiles" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."contract_profiles" TO "authenticated";
REVOKE ALL ON TABLE public."contract_sends" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."contract_sends" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."contract_sends" TO "authenticated";
REVOKE ALL ON TABLE public."contract_signatures" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."contract_signatures" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."contract_signatures" TO "authenticated";
REVOKE ALL ON TABLE public."contracts" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."contracts" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."contracts" TO "authenticated";
REVOKE ALL ON TABLE public."conversations" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."conversations" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."conversations" TO "authenticated";
REVOKE ALL ON TABLE public."couple_ai_usage" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couple_ai_usage" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couple_ai_usage" TO "authenticated";
REVOKE ALL ON TABLE public."couple_bookings" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couple_bookings" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couple_bookings" TO "authenticated";
REVOKE ALL ON TABLE public."couple_enquiries" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couple_enquiries" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couple_enquiries" TO "authenticated";
REVOKE ALL ON TABLE public."couple_receipts" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couple_receipts" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couple_receipts" TO "authenticated";
REVOKE ALL ON TABLE public."couple_state" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couple_state" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couple_state" TO "authenticated";
REVOKE ALL ON TABLE public."couple_tasks" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couple_tasks" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couple_tasks" TO "authenticated";
REVOKE ALL ON TABLE public."couples" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couples" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couples" TO "authenticated";
REVOKE ALL ON TABLE public."couture_appointments" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couture_appointments" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couture_appointments" TO "authenticated";
REVOKE ALL ON TABLE public."couture_availability" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couture_availability" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."couture_availability" TO "authenticated";
REVOKE ALL ON TABLE public."crew_confirmations" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."crew_confirmations" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."crew_confirmations" TO "authenticated";
REVOKE ALL ON TABLE public."date_checks" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."date_checks" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."date_checks" TO "authenticated";
REVOKE ALL ON TABLE public."demo_claim_requests" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."demo_claim_requests" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."demo_claim_requests" TO "authenticated";
REVOKE ALL ON TABLE public."demo_leads" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."demo_leads" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."demo_leads" TO "authenticated";
REVOKE ALL ON TABLE public."demo_vendors" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."demo_vendors" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."demo_vendors" TO "authenticated";
REVOKE ALL ON TABLE public."discover_heroes" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."discover_heroes" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."discover_heroes" TO "authenticated";
REVOKE ALL ON TABLE public."engagements" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."engagements" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."engagements" TO "authenticated";
REVOKE ALL ON TABLE public."enquiry_taps" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."enquiry_taps" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."enquiry_taps" TO "authenticated";
REVOKE ALL ON TABLE public."events" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."events" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."events" TO "authenticated";
REVOKE ALL ON TABLE public."exchange_requests" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."exchange_requests" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."exchange_requests" TO "authenticated";
REVOKE ALL ON TABLE public."expenses" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."expenses" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."expenses" TO "authenticated";
REVOKE ALL ON TABLE public."exploring_photos" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."exploring_photos" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."exploring_photos" TO "authenticated";
REVOKE ALL ON TABLE public."failed_turns" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."failed_turns" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."failed_turns" TO "authenticated";
REVOKE ALL ON TABLE public."hot_dates" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."hot_dates" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."hot_dates" TO "authenticated";
REVOKE ALL ON TABLE public."image_throttle_log" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."image_throttle_log" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."image_throttle_log" TO "authenticated";
REVOKE ALL ON TABLE public."influencer_reach_snapshots" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."influencer_reach_snapshots" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."influencer_reach_snapshots" TO "authenticated";
REVOKE ALL ON TABLE public."instagram_briefs" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."instagram_briefs" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."instagram_briefs" TO "authenticated";
REVOKE ALL ON TABLE public."introductions" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."introductions" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."introductions" TO "authenticated";
REVOKE ALL ON TABLE public."invite_codes" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."invite_codes" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."invite_codes" TO "authenticated";
REVOKE ALL ON TABLE public."invoices" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."invoices" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."invoices" TO "authenticated";
REVOKE ALL ON TABLE public."landing_slides" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."landing_slides" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."landing_slides" TO "authenticated";
REVOKE ALL ON TABLE public."lead_alerts" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."lead_alerts" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."lead_alerts" TO "authenticated";
REVOKE ALL ON TABLE public."lead_packages" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."lead_packages" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."lead_packages" TO "authenticated";
REVOKE ALL ON TABLE public."lead_referrals" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."lead_referrals" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."lead_referrals" TO "authenticated";
REVOKE ALL ON TABLE public."leads" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."leads" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."leads" TO "authenticated";
REVOKE ALL ON TABLE public."messages" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."messages" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."messages" TO "authenticated";
REVOKE ALL ON TABLE public."muse_pool" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."muse_pool" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."muse_pool" TO "authenticated";
REVOKE ALL ON TABLE public."muse_saves" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."muse_saves" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."muse_saves" TO "authenticated";
REVOKE ALL ON TABLE public."notes" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."notes" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."notes" TO "authenticated";
REVOKE ALL ON TABLE public."nudge_optout" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."nudge_optout" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."nudge_optout" TO "authenticated";
REVOKE ALL ON TABLE public."otp_sessions" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."otp_sessions" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."otp_sessions" TO "authenticated";
REVOKE ALL ON TABLE public."owner_notes" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."owner_notes" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."owner_notes" TO "authenticated";
REVOKE ALL ON TABLE public."payment_reminder_settings" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."payment_reminder_settings" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."payment_reminder_settings" TO "authenticated";
REVOKE ALL ON TABLE public."payment_reminders" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."payment_reminders" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."payment_reminders" TO "authenticated";
REVOKE ALL ON TABLE public."payment_schedules" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."payment_schedules" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."payment_schedules" TO "authenticated";
REVOKE ALL ON TABLE public."pending_couple_drafts" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."pending_couple_drafts" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."pending_couple_drafts" TO "authenticated";
REVOKE ALL ON TABLE public."pending_event_proposals" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."pending_event_proposals" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."pending_event_proposals" TO "authenticated";
REVOKE ALL ON TABLE public."pending_lead_pings" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."pending_lead_pings" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."pending_lead_pings" TO "authenticated";
REVOKE ALL ON TABLE public."pending_money_acts" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."pending_money_acts" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."pending_money_acts" TO "authenticated";
REVOKE ALL ON TABLE public."prospects" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."prospects" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."prospects" TO "authenticated";
REVOKE ALL ON TABLE public."referral_alerts" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."referral_alerts" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."referral_alerts" TO "authenticated";
REVOKE ALL ON TABLE public."reviews_asked" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."reviews_asked" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."reviews_asked" TO "authenticated";
REVOKE ALL ON TABLE public."search_console_daily" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."search_console_daily" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."search_console_daily" TO "authenticated";
REVOKE ALL ON TABLE public."search_console_queries" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."search_console_queries" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."search_console_queries" TO "authenticated";
REVOKE ALL ON TABLE public."spotlight" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."spotlight" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."spotlight" TO "authenticated";
REVOKE ALL ON TABLE public."taste_quiz_images" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."taste_quiz_images" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."taste_quiz_images" TO "authenticated";
REVOKE ALL ON TABLE public."tds_ledger" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."tds_ledger" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."tds_ledger" TO "authenticated";
REVOKE ALL ON TABLE public."team_members" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."team_members" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."team_members" TO "authenticated";
REVOKE ALL ON TABLE public."team_messages" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."team_messages" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."team_messages" TO "authenticated";
REVOKE ALL ON TABLE public."team_payments" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."team_payments" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."team_payments" TO "authenticated";
REVOKE ALL ON TABLE public."team_tasks" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."team_tasks" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."team_tasks" TO "authenticated";
REVOKE ALL ON TABLE public."users" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."users" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."users" TO "authenticated";
REVOKE ALL ON TABLE public."vendor_activity_log" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_activity_log" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_activity_log" TO "authenticated";
REVOKE ALL ON TABLE public."vendor_discover_requests" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_discover_requests" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_discover_requests" TO "authenticated";
REVOKE ALL ON TABLE public."vendor_featured_submissions" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_featured_submissions" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_featured_submissions" TO "authenticated";
REVOKE ALL ON TABLE public."vendor_google_connections" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_google_connections" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_google_connections" TO "authenticated";
REVOKE ALL ON TABLE public."vendor_ig_connections" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_ig_connections" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_ig_connections" TO "authenticated";
REVOKE ALL ON TABLE public."vendor_packages" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_packages" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_packages" TO "authenticated";
REVOKE ALL ON TABLE public."vendor_portfolio" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_portfolio" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_portfolio" TO "authenticated";
REVOKE ALL ON TABLE public."vendor_roster" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_roster" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_roster" TO "authenticated";
REVOKE ALL ON TABLE public."vendor_seal" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_seal" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_seal" TO "authenticated";
REVOKE ALL ON TABLE public."vendor_state" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_state" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendor_state" TO "authenticated";
REVOKE ALL ON TABLE public."vendors" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendors" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."vendors" TO "authenticated";
REVOKE ALL ON TABLE public."waitlist_signups" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."waitlist_signups" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."waitlist_signups" TO "authenticated";
REVOKE ALL ON TABLE public."wedding_credits" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."wedding_credits" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."wedding_credits" TO "authenticated";
REVOKE ALL ON TABLE public."wedding_photos" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."wedding_photos" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."wedding_photos" TO "authenticated";
REVOKE ALL ON TABLE public."weddings" FROM PUBLIC, "anon", "authenticated";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."weddings" TO "anon";
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public."weddings" TO "authenticated";

-- ── 3 · ROUTINE PRIVILEGES, including the GRANT EXECUTE TO service_role the cure added ──
REVOKE ALL ON ROUTINE public."claim_circle_invite"(p_token text, p_invitee_phone text) FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."claim_circle_invite"(p_token text, p_invitee_phone text) TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."claim_circle_invite"(p_token text, p_invitee_phone text) TO "anon";
GRANT EXECUTE ON ROUTINE public."claim_circle_invite"(p_token text, p_invitee_phone text) TO "authenticated";
GRANT EXECUTE ON ROUTINE public."claim_circle_invite"(p_token text, p_invitee_phone text) TO "service_role";
REVOKE ALL ON ROUTINE public."consume_invite_code"(p_code text, p_user_id uuid, p_phone text) FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."consume_invite_code"(p_code text, p_user_id uuid, p_phone text) TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."consume_invite_code"(p_code text, p_user_id uuid, p_phone text) TO "anon";
GRANT EXECUTE ON ROUTINE public."consume_invite_code"(p_code text, p_user_id uuid, p_phone text) TO "authenticated";
GRANT EXECUTE ON ROUTINE public."consume_invite_code"(p_code text, p_user_id uuid, p_phone text) TO "service_role";
REVOKE ALL ON ROUTINE public."couple_set_publish"(p_couple_id uuid, p_publish boolean) FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."couple_set_publish"(p_couple_id uuid, p_publish boolean) TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."couple_set_publish"(p_couple_id uuid, p_publish boolean) TO "anon";
GRANT EXECUTE ON ROUTINE public."couple_set_publish"(p_couple_id uuid, p_publish boolean) TO "authenticated";
GRANT EXECUTE ON ROUTINE public."couple_set_publish"(p_couple_id uuid, p_publish boolean) TO "service_role";
REVOKE ALL ON ROUTINE public."decrement_circle_comment_count"() FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."decrement_circle_comment_count"() TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."decrement_circle_comment_count"() TO "anon";
GRANT EXECUTE ON ROUTINE public."decrement_circle_comment_count"() TO "authenticated";
GRANT EXECUTE ON ROUTINE public."decrement_circle_comment_count"() TO "service_role";
REVOKE ALL ON ROUTINE public."enforce_role_xor"() FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."enforce_role_xor"() TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."enforce_role_xor"() TO "anon";
GRANT EXECUTE ON ROUTINE public."enforce_role_xor"() TO "authenticated";
GRANT EXECUTE ON ROUTINE public."enforce_role_xor"() TO "service_role";
REVOKE ALL ON ROUTINE public."increment_circle_comment_count"() FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."increment_circle_comment_count"() TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."increment_circle_comment_count"() TO "anon";
GRANT EXECUTE ON ROUTINE public."increment_circle_comment_count"() TO "authenticated";
GRANT EXECUTE ON ROUTINE public."increment_circle_comment_count"() TO "service_role";
REVOKE ALL ON ROUTINE public."invite_circle_member"(p_couple_id uuid, p_invitee_name text, p_role text) FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."invite_circle_member"(p_couple_id uuid, p_invitee_name text, p_role text) TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."invite_circle_member"(p_couple_id uuid, p_invitee_name text, p_role text) TO "anon";
GRANT EXECUTE ON ROUTINE public."invite_circle_member"(p_couple_id uuid, p_invitee_name text, p_role text) TO "authenticated";
GRANT EXECUTE ON ROUTINE public."invite_circle_member"(p_couple_id uuid, p_invitee_name text, p_role text) TO "service_role";
REVOKE ALL ON ROUTINE public."invite_couple"(p_phone text, p_name text, p_pronouns text) FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."invite_couple"(p_phone text, p_name text, p_pronouns text) TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."invite_couple"(p_phone text, p_name text, p_pronouns text) TO "anon";
GRANT EXECUTE ON ROUTINE public."invite_couple"(p_phone text, p_name text, p_pronouns text) TO "authenticated";
GRANT EXECUTE ON ROUTINE public."invite_couple"(p_phone text, p_name text, p_pronouns text) TO "service_role";
REVOKE ALL ON ROUTINE public."invite_vendor"(p_phone text, p_name text) FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."invite_vendor"(p_phone text, p_name text) TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."invite_vendor"(p_phone text, p_name text) TO "anon";
GRANT EXECUTE ON ROUTINE public."invite_vendor"(p_phone text, p_name text) TO "authenticated";
GRANT EXECUTE ON ROUTINE public."invite_vendor"(p_phone text, p_name text) TO "service_role";
REVOKE ALL ON ROUTINE public."nuke_test_couple"(p_phone text) FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."nuke_test_couple"(p_phone text) TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."nuke_test_couple"(p_phone text) TO "anon";
GRANT EXECUTE ON ROUTINE public."nuke_test_couple"(p_phone text) TO "authenticated";
GRANT EXECUTE ON ROUTINE public."nuke_test_couple"(p_phone text) TO "service_role";
REVOKE ALL ON ROUTINE public."record_payment"(p_booking_id uuid, p_amount integer, p_receipt_id uuid, p_payment_date date) FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."record_payment"(p_booking_id uuid, p_amount integer, p_receipt_id uuid, p_payment_date date) TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."record_payment"(p_booking_id uuid, p_amount integer, p_receipt_id uuid, p_payment_date date) TO "anon";
GRANT EXECUTE ON ROUTINE public."record_payment"(p_booking_id uuid, p_amount integer, p_receipt_id uuid, p_payment_date date) TO "authenticated";
GRANT EXECUTE ON ROUTINE public."record_payment"(p_booking_id uuid, p_amount integer, p_receipt_id uuid, p_payment_date date) TO "service_role";
REVOKE ALL ON ROUTINE public."record_payment"(p_invoice_id uuid, p_amount integer) FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."record_payment"(p_invoice_id uuid, p_amount integer) TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."record_payment"(p_invoice_id uuid, p_amount integer) TO "anon";
GRANT EXECUTE ON ROUTINE public."record_payment"(p_invoice_id uuid, p_amount integer) TO "authenticated";
GRANT EXECUTE ON ROUTINE public."record_payment"(p_invoice_id uuid, p_amount integer) TO "service_role";
REVOKE ALL ON ROUTINE public."set_updated_at"() FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."set_updated_at"() TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."set_updated_at"() TO "anon";
GRANT EXECUTE ON ROUTINE public."set_updated_at"() TO "authenticated";
GRANT EXECUTE ON ROUTINE public."set_updated_at"() TO "service_role";
REVOKE ALL ON ROUTINE public."update_vendor_portfolio_updated_at"() FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."update_vendor_portfolio_updated_at"() TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."update_vendor_portfolio_updated_at"() TO "anon";
GRANT EXECUTE ON ROUTINE public."update_vendor_portfolio_updated_at"() TO "authenticated";
GRANT EXECUTE ON ROUTINE public."update_vendor_portfolio_updated_at"() TO "service_role";
REVOKE ALL ON ROUTINE public."wedding_set_consent"(p_wedding_id uuid, p_token uuid, p_consent boolean) FROM PUBLIC, "anon", "authenticated", "service_role";
GRANT EXECUTE ON ROUTINE public."wedding_set_consent"(p_wedding_id uuid, p_token uuid, p_consent boolean) TO PUBLIC;
GRANT EXECUTE ON ROUTINE public."wedding_set_consent"(p_wedding_id uuid, p_token uuid, p_consent boolean) TO "anon";
GRANT EXECUTE ON ROUTINE public."wedding_set_consent"(p_wedding_id uuid, p_token uuid, p_consent boolean) TO "authenticated";
GRANT EXECUTE ON ROUTINE public."wedding_set_consent"(p_wedding_id uuid, p_token uuid, p_consent boolean) TO "service_role";

-- ── 4 · DEFAULT PRIVILEGES, written FOR each defining role the snapshot names ──
-- supabase_admin is NOT restored here, and must not be: 0170 skipped it, so its default
-- privileges were never changed and there is nothing to put back. Writing ALTER DEFAULT
-- PRIVILEGES FOR ROLE supabase_admin here would raise insufficient_privilege and cancel the whole
-- rollback in the one minute it is needed.
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC, "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA public GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA public GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC, "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA public GRANT SELECT, UPDATE, USAGE ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA public GRANT SELECT, UPDATE, USAGE ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC, "anon", "authenticated", "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO "service_role";

COMMIT;
