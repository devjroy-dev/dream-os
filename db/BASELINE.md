# db/BASELINE.md — Production Schema Baseline
**Generated:** 2026-07-14 (TDW_01 Phase C/D) from the founder's `information_schema` inventory paste, Supabase prod.
**Purpose:** the current-truth snapshot so no session reads 71 migration files to learn the schema. Column-level detail lives in `docs/SCHEMA.md`; this file is the table-level map.

## Ladder notes (LD-8)
- Ladder tail at baseline: `0071_owner_notes.sql`. Next reservation: `0072` (assigned to TDW_02). Reserved through `0095`.
- **`0063` was double-reserved**: `0063_users_auth_user_id.sql` AND `0063_vendor_activity_log.sql` both exist and both applied. Neither renamed (CE ruling 2026-07-14: renaming falsifies applied history). Headers in both files cross-reference the collision.
- `0068_binders.sql` moved to `db/migrations/archive/`: every object it created is absent from prod (`binders` never present in inventory — never applied or dropped in a past era; the binder concept lives on the engine plane per LD-1 — and `binder_events` dropped 2026-07, see below).
- **`public.binders` does not exist in prod** despite `0068` defining it. Self-describing fact, recorded so nobody hunts for it.

## Dropped 2026-07-14 (TDW_01 Phase C — founder-approved by name: 'approved: 1-11')
All eleven verified zero live-code references (two-pass grep, both repos, HEAD dream-os `4a91eb8` / dreamos-pwa `02d190d`) and **zero rows** (founder's count paste in session chat = the backup record; CSV exports waived as compliance theatre on empty tables — spec deviation, CE-ratified, logged in handover).
- engine.agent_modules, engine.briefing_schedule, engine.briefing_sessions, engine.compliance_deadlines, engine.orgs, engine.org_members, engine.reconciliations
- public.binder_events, public.demo_muse_pool, public.pending_actions, public.cover_photos
- `public.cover_photos` context: an admin coming-soon list claimed backend wiring that never existed; the orphaned frontend (`app/admin/cover/page.tsx`, five never-implemented endpoints) deleted same day — superseded by `landing_slides`.

## engine schema — 25 tables
| Table | Columns |
|---|---|
| agent_owner | 7 |
| agent_snapshot | 4 |
| agents | 10 |
| briefs | 10 |
| consult_access | 9 |
| consult_sessions | 9 |
| contact_messages | 7 |
| conversations | 7 |
| documents | 11 |
| domain_handbooks | 8 |
| domain_manifests | 6 |
| donna_audit_verdict | 10 |
| donna_review_binder | 10 |
| engine_settings | 4 |
| evals_findings | 7 |
| evals_runs | 16 |
| events | 8 |
| facts | 14 |
| leads | 12 |
| messages | 6 |
| money_entries | 16 |
| open_loops | 15 |
| records | 21 |
| usage | 10 |
| users | 8 |

## public schema — 58 tables
| Table | Columns |
|---|---|
| admin_activity_log | 7 |
| admin_config | 4 |
| bride_pages | 9 |
| circle_activity | 13 |
| circle_members | 13 |
| circle_sessions | 10 |
| clients | 12 |
| collab_posts | 14 |
| collab_responses | 8 |
| contracts | 15 |
| conversations | 11 |
| couple_bookings | 14 |
| couple_enquiries | 9 |
| couple_receipts | 11 |
| couple_state | 5 |
| couple_tasks | 9 |
| couples | 21 |
| couture_appointments | 13 |
| couture_availability | 8 |
| demo_claim_requests | 7 |
| demo_leads | 13 |
| demo_vendors | 14 |
| discover_heroes | 8 |
| enquiry_taps | 4 |
| events | 14 |
| expenses | 12 |
| exploring_photos | 8 |
| hot_dates | 8 |
| image_throttle_log | 5 |
| invite_codes | 9 |
| invoices | 21 |
| landing_slides | 8 |
| leads | 26 |
| messages | 17 |
| muse_pool | 8 |
| muse_saves | 16 |
| notes | 7 |
| otp_sessions | 5 |
| owner_notes | 5 |
| payment_schedules | 13 |
| pending_event_proposals | 8 |
| pending_lead_pings | 9 |
| spotlight | 9 |
| taste_quiz_images | 8 |
| tds_ledger | 18 |
| team_members | 11 |
| team_messages | 7 |
| team_payments | 13 |
| team_tasks | 13 |
| users | 9 |
| vendor_activity_log | 8 |
| vendor_availability | 5 |
| vendor_discover_requests | 7 |
| vendor_featured_submissions | 18 |
| vendor_portfolio | 13 |
| vendor_state | 7 |
| vendors | 36 |
| waitlist_signups | 9 |
