# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-22 (Admin Portal + Auth Flow session close)
**Session:** B-Admin — Complete admin portal rebuild + auth flow bug fixes
**Version:** dream-os → 0.11.2-alpha / dreamos-pwa → 0.11.2-alpha
**HEAD (dream-os):** d973361 fix(auth): couple verify-otp returns name, fix couple set-pin field names
**HEAD (dreamos-pwa):** latest (see git log — multiple auth + admin commits this session)
**HEAD (dreamai):** unchanged
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Railway:** https://dream-os-production.up.railway.app
**Vercel (dreamos-pwa):** https://thedreamwedding.in
**Vercel (dreamai):** https://thedreamai.in

---

## B-Admin — Complete Admin Portal Rebuild — 2026-05-22

### What shipped

**Migrations applied to Supabase prod (0044 + 0045 — applied via SQL editor):**
- `discover_heroes` table — editorial hero images for bride discover feed
- `muse_pool` table — pre-seeded muse images (20 max active)
- `taste_quiz_images` table — Surprise Me pool (100 max active)
- `spotlight` table — vendor spotlight cards (vendor_id FK, week_label, active)
- `admin_config` table — AI caps per tier per surface (28 rows seeded)
- `couples.tier` column — basic/gold/platinum
- `invite_codes.intended_phone` column — phone-bound invite codes

**dream-os — new admin endpoints:**
- `src/api/admin/conversations.js` — GET /vendors (vendor_self threads), GET /brides (couple_self threads), GET /:id/messages (last 50)
- `src/api/admin/vendorPortfolio.js` — GET/POST/upload-url/DELETE for vendor portfolio (admin uploads auto-approved)
- `src/api/admin/vendors.js` — added DELETE /:vendorId (cascades via users row)
- `src/api/admin/couples.js` — added DELETE /:coupleId (cascades via users row)
- `src/api/admin/photos.js` — removed `requireAuth` from approve/reject routes (was blocking all photo approvals)
- `src/api/admin/invites.js` — generate now accepts `name` + `intended_phone`; when both provided, calls `invite_vendor()` or `invite_couple()` RPC immediately to pre-create user row
- `src/api/vendor/auth.js` — verify-otp now returns `name`, `category`, `tier`, `routing_handle` in response
- `src/api/couple/auth.js` — verify-otp now returns `name` in response; fixed "Vendor record" error message to "Couple record"

**dreamos-pwa — complete admin UI rebuild:**
- `lib/admin-api/_base.ts` — adminGet/Post/Patch/Delete/UploadFile with x-admin-password injection
- `lib/admin-api/index.ts` — all types + all API functions
- `app/admin/layout.tsx` — cockpit dark design (#0A0908 bg, #C9A84C gold), mobile sidebar, 9-section nav
- `app/admin/login/page.tsx` — dark login screen
- `app/admin/page.tsx` — dashboard with 5 stat cards + quick links
- `app/admin/_components/AdminUI.tsx` — shared: PageHeader, StatCard, GoldBtn, GhostBtn, Toast, FieldInput, FieldSelect, BottomSheet, UploadZone (device+URL tabs), ImageGrid, LoadingGrid, SectionDivider, Counter
- `app/admin/ContentPage.tsx` — generic content page factory
- `app/admin/makers/page.tsx` — vendor list, tier, discover toggle, revoke, delete, invite-by-phone form
- `app/admin/dreamers/page.tsx` — couple list, tier, delete
- `app/admin/invites/page.tsx` — WA links, generate codes (phone+name required), list/delete
- `app/admin/config/page.tsx` — AI caps editor (per tier per surface)
- `app/admin/couture/page.tsx` — couture vendor management
- `app/admin/hot-dates/page.tsx` — muhurat calendar management
- `app/admin/content/landing/page.tsx` — landing photos
- `app/admin/content/exploring/page.tsx` — exploring photos
- `app/admin/content/heroes/page.tsx` — discover heroes
- `app/admin/content/muse-pool/page.tsx` — muse pool (20-image cap)
- `app/admin/content/surprise-me/page.tsx` — surprise me pool (100-image cap)
- `app/admin/content/spotlight/page.tsx` — spotlight cards with vendor picker
- `app/admin/approvals/photos/page.tsx` — photo queue with approve/reject
- `app/admin/approvals/discover/page.tsx` — discover queue with grant/deny/revoke
- `app/admin/conversations/vendors/page.tsx` — vendor chat audit (read-only)
- `app/admin/conversations/brides/page.tsx` — bride chat audit (read-only)
- `app/admin/vendors/portfolio/page.tsx` — upload photos on behalf of any vendor (auto-approved)

**dreamos-pwa — auth flow fixes:**
- `app/(landing)/page.tsx` — verify-otp now sends `otp` (not `code`) and `purpose: 'login'`; invite validate sends `kind` (not `role`), `'maker'`/`'dreamer'` (not `'vendor'`/`'couple'`)
- `app/(auth)/vendor/pin/page.tsx` — set-pin sends `vendor_id` (not `userId`/`role`/`phone`)
- `app/(auth)/couple/pin/page.tsx` — set-pin sends `couple_id` (not `userId`/`role`/`phone`)

### Key decisions

**Admin design:** Deep cockpit dark — `#0A0908` bg, `#C9A84C` gold accent, `#F5F0E8` ink. Cormorant Garamond display, DM Sans body, Jost labels. Mobile-first, 48px tap targets, bottom sheets for all actions. Lives at `thedreamwedding.in/admin`. Password in Railway env `ADMIN_PASSWORD` + Vercel env `NEXT_PUBLIC_ADMIN_PASSWORD`.

**Gated onboarding:** Invite generation now requires `name` + `intended_phone`. Backend calls `invite_vendor()` / `invite_couple()` RPC at generation time — user+vendor/couple row created immediately. OTP sign-in works from that moment. Nobody gets in without an explicit admin invite. XOR constraint (users can only be vendor OR couple) enforced at DB level.

**Vendor WA-onboarding flow confirmed:** Admin creates vendor via Makers → + Invite OR Invites → Generate (both create user row) → share WA link → vendor texts → onboarding fires (onboarding_state machine) → vendor comes to thedreamwedding.in → Sign In → OTP → set PIN → redirected to thedreamai.in via SSO handoff.

**AI caps:** Values stored in `admin_config`, editable via Config page. Enforcement NOT yet wired into agent engines — deferred to a future session. Trial tier = tightest caps; when enforcement is built it applies immediately based on `vendor.tier`.

**Photo approve/reject was broken:** `requireAuth` middleware on POST routes expected a vendor JWT. Admin portal sends `x-admin-password` header only. Removed `requireAuth` — these routes now only need `requireAdmin`.

**Swati's duplicate vendor rows:** Cleaned via `DELETE FROM users WHERE phone = '+918595356978'` — cascades deleted both vendor rows. Re-invite via Makers page to restore.

### Auth flow field mismatches fixed (all bugs that blocked web sign-in)

| Endpoint | Frontend was sending | Backend expected | Fixed |
|---|---|---|---|
| vendor verify-otp | `code` | `otp` | ✅ |
| vendor verify-otp | no `purpose` | `purpose: 'login'` | ✅ |
| couple verify-otp | `code` | `otp` | ✅ |
| couple verify-otp | no `purpose` | `purpose: 'login'` | ✅ |
| invite validate | `role: 'vendor'` | `kind: 'maker'` | ✅ |
| vendor set-pin | `userId`, `role`, `phone` | `vendor_id`, `pin` | ✅ |
| couple set-pin | `userId`, `role`, `phone` | `couple_id`, `pin` | ✅ |
| vendor verify-otp response | no `name` returned | needed for onboarding check | ✅ |
| couple verify-otp response | no `name` returned | needed for onboarding check | ✅ |

### Known open items

- **AI caps not enforced** — `admin_config` values are set but agents don't read them. One session of work.
- **`/api/v2/vendor/onboarding` endpoint doesn't exist** — frontend routes to it when `!pin_set && !name`. Now bypassed because verify-otp returns `name`. But if a vendor somehow has no name in DB, they'll see "Could not save." Build this endpoint if it becomes an issue.
- **`/api/v2/couple/onboarding` endpoint doesn't exist** — same situation for couples.
- **Invite code web flow for new users (no WA)** — now works because generate pre-creates user row.
- **Admin password changed** — now `Liza@2551354` (was `Mira@2551354`). Update Railway env if needed.

### Migration status

| # | File | Status | What it adds |
|---|---|---|---|
| 0001–0039 | applied + committed | ✅ | See SCHEMA.md |
| 0040 | applied to prod | ⚠️ not committed | team_members, team_tasks, team_messages, team_payments |
| 0041 | applied to prod | ⚠️ not committed | payment_schedules, contracts, tds_ledger, invoices.has_schedule |
| 0044 | applied to prod | ⚠️ not committed | discover_heroes table |
| 0045 | applied to prod | ⚠️ not committed | muse_pool, taste_quiz_images, spotlight, admin_config, couples.tier, invite_codes.intended_phone |

**Action required:** Commit 0040, 0041, 0044, 0045 as files to `db/migrations/`.

### Test credentials

| Item | Value |
|---|---|
| Test vendor phone | +918757788550 |
| Test vendor UUID | 2eb5d3fb-31eb-4b26-859a-cf10ae477d53 |
| Test vendor handle | DEV550 |
| Test vendor PIN | 1234 |
| Test vendor tier | prestige |
| Admin password | Liza@2551354 |
| Admin URL | thedreamwedding.in/admin |
| Supabase | nvzkbagqxbysoeszxent (Mumbai, ap-south-1) |
| Railway | https://dream-os-production.up.railway.app |
| Vercel dreamos-pwa | https://thedreamwedding.in |
| Vercel dreamai | https://thedreamai.in |



---

## Previous sessions archived below

# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-21 (Bride Blocks B-F, B-1, B-2 + amendments session close)
**Session:** Bride Block F (couple REST foundation) + Block 1 (discover + muse API) + Block 2 (Frost PWA wiring + amendments)
**Version:** dream-os → 0.11.1-alpha / dreamos-pwa → 0.11.1-alpha
**HEAD (dream-os):** 0a596a9 feat(bride): muse list returns vendor fields for full-bleed overlay
**HEAD (dreamos-pwa):** d024119 feat(bride): muse full-bleed vendor overlay, enquire, share, remove
**HEAD (dreamai):** unchanged
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Railway:** https://dream-os-production.up.railway.app
**Vercel (dreamos-pwa):** https://thedreamwedding.in
**Vercel (dreamai):** https://thedreamai.in

---

## Bride Block F — Couple REST Foundation

**Migration 0040 committed:** couples columns (wedding_date, wedding_city, bride_name, groom_name, budget_total, notes), vendors.discover_eligible, muse_saves.circle_comment_count
**Migration 0041 committed:** vendors.about

- `src/api/middleware/requireCoupleAuth.js` — JWT middleware for couple routes. Returns 401 JSON (never HTML) on missing/invalid token.
- `src/api/couple/core.js` — couple router at `/api/v2/couple`. `requireCoupleAuth` applied at router level — all sub-routers inherit.
- `src/api/router.js` — couple core mounted.

---

## Bride Block 1 — Discover Public API + Muse Endpoints

- `src/api/couple/discover.js` — GET /feed, /featured, /heroes (public, no auth). Feed filters by discover_eligible=true, returns up to 5 approved portfolio photos per vendor, computes enquire_link server-side.
- `src/api/couple/muse.js` — POST /save, GET /:coupleId, DELETE /:saveId, GET /saves/:saveId/activity (couple auth). Save accepts image_url — each photo is a distinct save. Duplicate check on vendor_id + image_url. GET list JOINs vendors and returns vendor_name, vendor_city, vendor_category, vendor_starting_price, vendor_vibe_tags, vendor_routing_handle, enquire_link.
- `src/api/router.js` — /discover mounted public; /couple/muse mounted with requireCoupleAuth.

---

## Bride Block 2 — Frost PWA Wiring + Amendments

**dreamos-pwa:**
- `lib/types/discover.ts` — DiscoverVendor, FeaturedCollection, DiscoverHero, MuseSave (with vendor fields), MuseActivity
- `lib/frost-api/_base.ts` — getCoupleSession(), apiDelete()
- `lib/frost-api/discover.ts` — fetchDiscoverFeed, fetchFeatured, fetchHeroes, makeEnquireLink
- `lib/frost-api/muse.ts` — fetchMuseSaves, saveVendorToMuse(vendorId, imageUrl), deleteMuseSave, fetchSaveActivity
- `app/(frost)/frost/canvas/discover/page.tsx` — real API, infinite scroll, image preload. Normal mode: swipe up/down = vendors, left/right = photos, single tap = overlay, double-tap = save current photo. Blind mode: flat queue of all vendor photos, swipe up = next photo, double-tap = save, gold ✕ on dismiss, no carousel dots.
- `app/(frost)/frost/canvas/muse/page.tsx` — real API, source filter (All/Mine/Circle) + ceremony filter. Full-bleed overlay: tap image → vendor glass overlay with enquire, share, remove. Circle activity tile below.

**Domain:** thedreamwedding.in → dreamos-pwa (Frost bride PWA live).
**Env:** NEXT_PUBLIC_USE_MOCKS=false, NEXT_PUBLIC_API_BASE=https://dream-os-production.up.railway.app

---

## Test credentials (added this session)

| Test couple phone | +919888294440 |
| Test couple couple_id | 7abccc1b-0698-43ba-9709-c6a1e52af789 |
| Test couple PIN | 1234 |

---

## What is next

1. Bride B-3 — couple data endpoints: /me, /today, /events, /expenses, /circle, /bookings, /receipts (dream-os)
2. Bride B-4 — wire journey canvases to real backend (dreamos-pwa)
3. Domain cleanup — www.thedreamwedding.in and app.thedreamwedding.in off tdw-2
4. Vendor Block 4 (Razorpay) — when KYC clears

---

## Previous sessions archived below

# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-21 (Block 6 + Block 7 session close)
**Session:** Block 6 — Studio Suite (Team Hub) + Block 7 — Payment Schedules, Contracts, TDS
**Version:** 0.10.8-alpha (dream-os) / dreamai up to date
**HEAD (dream-os):** 3f2a242 feat(block7): payment schedules, contracts, TDS — 16 endpoints + 6 agent tools
**HEAD (dreamai):** latest (see git log — multiple commits this session)
**HEAD (dreamos-pwa):** 31a3b11 (unchanged)
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Repo backend:** https://github.com/devjroy-dev/dream-os
**Repo vendor PWA alpha:** https://github.com/devjroy-dev/dreamai
**Vercel (dreamai):** https://thedreamai.in
**Railway (dream-os):** https://dream-os-production.up.railway.app

Read this first. Then ROADMAP_FINAL.md. Then SCHEMA.md. Then API_CONTRACTS.md.

---

## Block 6 — Studio Suite (Team Hub) — 2026-05-21

### What shipped

**Migration 0040 — applied to prod (via Supabase SQL editor — not yet committed to db/migrations/):**
- `team_members` — vendor crew roster
- `team_tasks` — task assignment with state machine (open/in_progress/done/cancelled)
- `team_messages` — broadcast messages with pinned flag
- `team_payments` — crew payment obligations with mark-paid + auto-expense creation

**dream-os:**
- `src/api/middleware/requirePrestige.js` — 403 TIER_PRESTIGE_REQUIRED gate
- `src/api/vendor/studio/index.js` — studio sub-router
- `src/api/vendor/studio/briefing.js` — GET /briefing (aggregated: today events, open tasks, pinned messages, week calendar, team owed)
- `src/api/vendor/studio/team.js` — CRUD team members (soft delete)
- `src/api/vendor/studio/tasks.js` — CRUD tasks + state transitions
- `src/api/vendor/studio/messages.js` — CRUD messages + pin toggle
- `src/api/vendor/studio/payments.js` — CRUD payments + mark-paid (auto-creates assistant expense) + cancel endpoint
- `src/api/vendor/core.js` — mounted /studio
- `src/agent/pwaTools.js` — 4 Prestige tools: assign_task, team_pay, pin_team_message, team_briefing
- `src/agent/pwaEngine.js` — 4 Prestige tool case handlers

**dreamai:**
- `app/wedding/studio/page.tsx` — Team Hub landing (Prestige-gated, locked badges for non-Prestige)
- `app/wedding/studio/team/page.tsx` — roster + role dropdown + add/edit/delete sheets
- `app/wedding/studio/tasks/page.tsx` — tab board (Open/In Progress/Done) + state advance + delete
- `app/wedding/studio/team-payments/page.tsx` — balance cards, owed rows with Mark Paid + Delete, settled rows with date+method
- `app/wedding/list/page.tsx` — restructured to Business / Finance / Team Hub / Discover sections
- `app/wedding/login/page.tsx` — fixed: now fetches /me after OTP verify to get real tier + name into session (was hardcoded 'essential')

### Key decisions
- Studio Suite renamed → **Team Hub** in all UI (route stays /wedding/studio)
- Mark-paid auto-creates `assistant` category expense — team payments appear in expense ledger
- Login tier fix: `tier: 'essential'` was hardcoded at OTP verify — now calls fetchMe() post-login
- Studio hub restructured: Business (Clients/Leads/Events/Contracts) / Finance (Invoices/Expenses/TDS) / Team Hub / Discover

### Smoke tests passed (20/20 curl + tier gate)
- Team CRUD, task state machine, pin toggle, payment obligations, balance, mark-paid, cancel
- 403 TIER_PRESTIGE_REQUIRED confirmed on non-Prestige vendor
- briefing endpoint aggregates correctly

---

## Block 7 — Payment Schedules, Contracts, TDS — 2026-05-21

### What shipped

**Migration 0041 — applied to prod (via Supabase SQL editor — not yet committed to db/migrations/):**
- `payment_schedules` — milestone-based payment plans on invoices (ordinal, pct, amount_due, state)
- `contracts` — PDF contract storage (two-phase upload via Supabase Storage signed URLs)
- `tds_ledger` — Tax Deducted at Source ledger (gross/rate/tds/net, FY, PAN, TAN, section)
- `invoices.has_schedule` column added

**Storage:**
- `contracts` bucket created in Supabase Storage (private, 10MB, application/pdf)
- RLS policies: authenticated upload (INSERT) + authenticated read (SELECT)

**dream-os:**
- `src/lib/vendor/schedules.js` — createSchedule, markMilestonePaid (syncs invoice amount_paid), deleteSchedule
- `src/lib/vendor/contracts.js` — getUploadUrl, finalizeContract, getDownloadUrl, attachFromUrl (WhatsApp), cleanupDraftContracts
- `src/lib/vendor/tds.js` — createEntry, getSummary, currentFinancialYear()
- `src/api/vendor/schedules.js` — 5 endpoints (POST/GET/DELETE schedule, PATCH milestone, POST milestone/paid)
- `src/api/vendor/contracts.js` — 7 endpoints (upload-url, finalize, list, download, patch, send, delete)
- `src/api/vendor/tds.js` — 6 endpoints (list, create, patch, delete, summary, export CSV)
- `src/api/vendor/core.js` — mounted schedules, contracts, tds
- `src/agent/pwaTools.js` — 6 new tools: create_schedule, mark_milestone_paid, attach_contract, list_contracts, log_tds, query_tds_summary
- `src/agent/pwaEngine.js` — 6 tool case handlers
- `src/cron.js` — draft contract cleanup cron (3am IST daily)

**dreamai:**
- `app/wedding/contracts/page.tsx` — list + two-phase PDF upload + detail sheet (Download/Mark Sent/Mark Signed/Cancel)
- `app/wedding/tds/page.tsx` — FY selector, summary card (gross/TDS/net + by-section), entries list, log sheet, CSV export
- `app/wedding/list/[slice]/page.tsx` — schedule section on invoice bottom sheet (milestones with Paid button + builder sheet)
- `lib/types/vendor.ts` — ScheduleMilestone, Contract, TdsEntry, TdsSummary
- `lib/api/vendor.ts` — all Block 7 API functions

### Key decisions
- Milestone → invoice sync done in JS (sequential awaits), not Postgres function — consistent with codebase pattern
- Contracts are PDF documents (booking agreements), NOT terms & conditions templates
- TDS is what corporate clients deduct from vendor invoices — vendor tracks it for year-end income tax credit
- Two-phase upload: backend returns signed URL → frontend uploads directly to Supabase Storage → finalize call
- WhatsApp contract attach uses separate code path (downloads from Twilio URL, uploads directly)
- Schedule builder sheet: zIndex 60 (above invoice bottom sheet at 50)

### Smoke tests passed (20/20 curl)
- Schedule: create, duplicate guard (409), bad pct sum (400), milestone paid × 3, invoice state machine, delete guard (409)
- TDS: create, list, summary (correct aggregation + by_section), CSV export, patch (recomputes tds_amount), delete
- Contracts: upload URL (signed URL returned), list, patch, soft delete

### Open items / known debt
- **0040 + 0041 migrations not committed to db/migrations/** — applied via SQL editor. Need to drop files and commit.
- **Admin CORS bug** — `dream-os-production.up.railway.app/admin` returns Internal Server Error because CORS middleware fires on admin routes. Fix: exempt `/admin/*` from CORS. One-line patch, deferred (scope creep).
- **Admin panel not updated for Block 6/7** — no visibility into team members, contracts, schedules, TDS per vendor in admin UI. Deferred.
- **Founding cohort tier** — all founding vendors manually set to `prestige` via SQL. Block 4 (Razorpay) will enforce this properly when KYC clears.

---

## Test credentials (unchanged)

| Item | Value |
|---|---|
| Test vendor phone | +918757788550 |
| Test vendor UUID | 2eb5d3fb-31eb-4b26-859a-cf10ae477d53 |
| Test vendor handle | DEV550 |
| Test vendor tier | prestige (manually set) |
| Supabase | nvzkbagqxbysoeszxent (Mumbai, ap-south-1) |
| Railway | https://dream-os-production.up.railway.app |
| Admin | https://dream-os-production.up.railway.app/admin |
| Vercel dreamai | https://thedreamai.in |
| Admin password | Mira@2551354 |

---

## Migration status

| # | File | Status | What it adds |
|---|---|---|---|
| 0001–0039 | applied + committed | ✅ | See SCHEMA.md |
| 0040 | applied to prod | ⚠️ not committed | team_members, team_tasks, team_messages, team_payments |
| 0041 | applied to prod | ⚠️ not committed | payment_schedules, contracts, tds_ledger, invoices.has_schedule |

**Action required:** Commit 0040 and 0041 as files to `db/migrations/` in next session.

---

## What is next (priority order)

1. **Commit 0040 + 0041 migration files** — drop into db/migrations/, commit, push
2. **Admin CORS fix** — exempt /admin/* from CORS middleware (one-line patch)
3. **Block 4 — Razorpay** — when KYC clears. Subscription enforcement, trial cron, token packs
4. **Phase 3 — Discover go-live** — public bride-facing feed, v1.0.0

---

---

## Previous sessions (archived below)

# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-21 (Block 3 session close)
**Session:** Block 3 — Lead detail: vendor summary card + couple conversation thread + WhatsApp/Call buttons
**Version:** 0.10.3-alpha
**HEAD (dream-os):** see git log
**HEAD (dreamai):** see git log
**HEAD (dreamos-pwa):** 31a3b11 (unchanged)
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Repo backend:** https://github.com/devjroy-dev/dream-os
**Repo vendor PWA alpha:** https://github.com/devjroy-dev/dreamai
**Repo PWA shell:** https://github.com/devjroy-dev/dreamos-pwa
**Vercel (dreamai):** https://thedreamai.in

Read this first. Then ROADMAP_FINAL.md. Then SCHEMA.md. Then API_CONTRACTS.md.

---

## Phase 1 — complete (0.10.0-alpha)
## P2-1 through P2-6a — complete

All history in previous HANDOVER_FINAL.md commits. See git log.

---


---

## Block 5 — 2026-05-21 (this session)

### What Block 5 is

Vendor Discover submission pipeline + photo approval queue + Couture appointments + Featured promos. The vendor's path onto Discover. Three monetisation surfaces wired. Razorpay payments stubbed pending KYC (Block 4).

### What shipped

**Migration 0039 — applied to prod:**
- `vendor_portfolio` table — image library, per-image approval state, Cloudinary URLs
- `vendor_discover_requests` table — audit trail of Discover access requests
- `couture_appointments` + `couture_availability` tables — slot publishing + booking lifecycle
- `vendor_featured_submissions` table — featured promo applications
- `admin_activity_log` table — admin action audit
- `vendors` columns: `discover_eligible`, `discover_request_state`, `couture_eligible`, `featured_eligible`

**Schema fix (applied directly):**
- `vendor_portfolio.display_order` column dropped (ghost from first failed migration run)
- `vendor_portfolio.reviewed_by_admin`, `reviewed_at`, `rejection_reason` added (were missing from partial first run)
- `vendor_portfolio` now exactly matches migration 0039 definition

**dream-os (tag: dream-os-v0.10.5-alpha):**
- `src/lib/vendor/portfolio.js` — Cloudinary signing, registerImage, listImages, updateImage, setHeroImage, deleteImage, portfolioSummary
- `src/lib/vendor/discover.js` — requestDiscover, getDiscoverStatus, withdrawRequest
- `src/lib/vendor/couture.js` — listSlots, addSlot, removeSlot, listAppointments, updateAppointment
- `src/lib/vendor/featured.js` — submitFeatured, listSubmissions, FEATURED_FEES (Razorpay stub)
- `src/api/vendor/portfolio.js` — POST /upload-url, POST /, GET /:vendorId, PATCH /:imageId/hero, PATCH /:imageId, DELETE /:imageId
- `src/api/vendor/discover.js` — GET /status, POST /request, POST /withdraw
- `src/api/vendor/couture.js` — GET/POST /availability, DELETE /availability/:slotId, GET /appointments, PATCH /appointments/:id
- `src/api/vendor/featured.js` — GET /, POST /submit (gated on featured_eligible)
- `src/api/vendor/core.js` — wired: portfolio, discover, couture, featured
- `src/api/admin/requireAdmin.js` — validates dream_admin_session cookie for REST API
- `src/api/admin/discover.js` — GET /requests, POST /grant/:vendorId, POST /deny/:vendorId, POST /revoke/:vendorId
- `src/api/admin/photos.js` — GET /queue, POST /:imageId/approve, POST /:imageId/reject, POST /bulk-approve
- `src/api/admin/couture.js` — POST /eligible/:vendorId, GET /payouts/pending
- `src/api/admin/featured.js` — POST /eligible/:vendorId, GET /queue, POST /:submissionId/approve, POST /:submissionId/reject
- `src/api/router.js` — wired: /admin/discover, /admin/photos, /admin/couture, /admin/featured
- `src/api/vendor/me.js` — added couture_eligible, featured_eligible, discover_eligible, discover_request_state to GET /me response
- Railway env vars added: CLOUDINARY_CLOUD_NAME=dccso5ljv, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

**dreamai (tag: dreamai-v1.4):**
- `app/wedding/discover/page.tsx` — 3-state dashboard (not_requested / under_review / approved)
- `app/wedding/discover/submit/page.tsx` — 4-step form: rates → aesthetic tags → pitch → sample images
- `app/wedding/portfolio/page.tsx` — 2-col portrait grid, Cloudinary signed upload, hero/delete action sheet
- `app/wedding/couture/page.tsx` — gated, availability + appointments tabs, add slot sheet
- `app/wedding/featured/page.tsx` — gated, submission history + apply form
- `app/wedding/list/page.tsx` — Discover section added to Studio hub (Discover, Portfolio, Couture, Featured)
- `app/wedding/settings/page.tsx` — Discover summary card added
- `components/BottomNav.tsx` — Discover tab added (4th, rightmost), 4-pointed star icon, gold active state, scale press animation, chat circle hue removed
- `lib/types/vendor.ts` — PortfolioImage, PortfolioListResponse, UploadUrlResponse, DiscoverStatus, CoutureSlot, CoutureAppointment, FeaturedSubmission
- `lib/api/vendor.ts` — all Block 5 API functions

### Key commits this session (dream-os)
- `d5205c3` fix(api): add couture_eligible, featured_eligible, discover fields to /me response
- `c451b2c` feat(api): Block 5 — portfolio, discover, couture, featured + admin endpoints

### Key commits this session (dreamai)
- `3b60146` fix(nav): remove chat circle hue, 4-pointed star for Discover
- `b79208b` feat(nav): Discover tab, gold active state, scale press animation
- `d777427` fix(portfolio): 2-col portrait grid, Block 5 types + API functions
- `0511fe2` feat(ui): Block 5 — portfolio, discover, couture, featured pages

### Smoke tests passed
- ✅ GET /vendor/discover/status → `not_requested`, portfolio_summary correct
- ✅ POST /vendor/portfolio/upload-url → signed Cloudinary params returned
- ✅ POST /vendor/couture/availability → 403 COUTURE_GATED (before SQL flag)
- ✅ GET /vendor/portfolio/:vendorId → images returned after display_order drop
- ✅ Couture page — slots visible, add slot sheet working
- ✅ Featured page — submissions list, apply form working
- ✅ Discover dashboard — 3-state rendering correct

### Open items / known debt from this session
- Razorpay payments stubbed in featured.js — `RAZORPAY_LIVE=true` activates when Block 4 KYC clears
- Couture payment capture also stubbed — same flag
- `vendor_portfolio` had a schema mismatch from failed first migration run — fixed manually in Supabase
- Test vendor has `couture_eligible=true` and `featured_eligible=true` set directly via SQL for dev testing
- Portfolio grid uses `objectPosition: center top` — no crop tool built (deferred)

---

## Block 3 — 2026-05-21 (this session)

### What Block 3 is

Lead detail view — surfaces the WhatsApp conversation between the couple and DreamAi alongside the lead in dreamai. Vendor taps a lead, sees the full enquiry conversation, summary, and can WhatsApp or call the bride directly. No reply surface built — vendor continues on WhatsApp. Read-only, clean.

### What shipped

**dream-os:**
- `GET /api/v2/vendor/leads/:leadId/detail` — new endpoint returning lead, vendor_summary, conversation (last 20 non-system messages from couple_thread), linked invoices, linked events
- Route order fixed: `GET /:leadId/detail` moved before `GET /:vendorId` to prevent Express param shadowing
- `phone` added to leads list `dataSelect` and response mapping (was selected but dropped)
- `leads.vendor_summary` column added (migration 0036) — denormalised WhatsApp notification text written at lead creation
- `src/index.js` patched to write `vendor_summary` from `result.vendorNotification` after couple agent runs

**dreamai:**
- `ConversationThread.tsx` — new read-only component, alternating inbound/outbound bubbles, gold summary card at top
- `fetchLeadDetail()` function already existed from Block 1b; mock updated to return full shape
- `Lead` type updated with `phone` field (was missing)
- `ConversationMessage` + full `LeadDetailResponse` types added
- Slice list page: lead rows tap → fires `fetchLeadDetail` in background, renders summary + conversation in bottom sheet
- WhatsApp + Call buttons rendered in fixed action area (above Edit/Delete) when lead has phone
- Sheet `maxHeight` increased from `70dvh` to `88dvh`

**Migration 0034 (retrospective):**
- `0034_vendor_profile_fields.sql` created as historical record — columns were applied directly to prod during Block F. Now committed to source control.

### Open items from this session
- `leads.vendor_summary` is null for all existing leads (predates the column). Only new WhatsApp enquiries will populate it going forward.
- `PATCH /leads/:leadId` (full update) exists in dream-os (commit a003802) but no agent tool yet — leads edit in dreamai routes to chat.

### Key commits this session (dream-os)
- `165f430` fix(api): include phone in leads list response mapping
- `652ae3f` fix(api): add phone to leads list select
- `ae60b8a` fix(api): move GET /leads/:id/detail before /:vendorId to avoid route shadowing
- `650625f` feat(api): GET /leads/:id/detail — vendor_summary + conversation + linked records (Block 3)

---

## P2-6b-alpha — 2026-05-20 (this session)

### What P2-6b-alpha is

On founder's order, the session sequence was changed after P2-6a. dreamos-pwa (P2-6b proper) was deferred. dreamai — the existing vendor chat PWA at devjroy-dev/dreamai — was adopted as the vendor PWA alpha surface, wired directly to dream-os backend. This session re-skinned it with the dark glass design system and built all the AI chat wiring.

dreamai is a Next.js 14 / React 18 / Tailwind v4 / TypeScript app. It is NOT dreamos-pwa. Separate repo, separate Vercel deployment, separate domain (thedreamai.in). It was already live with the old dream-wedding backend. This session re-skinned it and wired it to dream-os.

dreamos-pwa remains the long-term vendor + bride PWA shell. dreamai is the vendor-only alpha.

---

### dream-os changes this session

**Current HEAD: 3b975df — "revert: restore d373c5c state"**

Net state of dream-os vs P2-6a (716f545):

**src/index.js** — CORS additions only:
- Added `https://thedreamai.in`, `https://www.thedreamai.in`
- Added GitHub Codespaces regex
- Added dreamai Vercel previews regex
- Nothing else touched in index.js

**src/api/vendor/chat.js** — AT d373c5c STATE:
- Accepts `body.ai_primer` — persists as outbound assistant message before vendor's reply so engine reads full edit context from DB history
- Passes `channel: 'web'` to runAgenticTurn (suppresses cross-surface WhatsApp sends)
- This is the only backend change that touches the agent path

**src/agent/engine.js** — REVERTED TO d373c5c:
- Original engine, unchanged from P2-6a
- No web fast path, no WEB_SURFACE_ADDENDUM, no finalContact
- Full classifier → Haiku/Sonnet routing on all channels including web
- Same agent behaviour on PWA as WhatsApp

**src/agent/systemPrompt.js** — REVERTED TO d373c5c:
- Original system prompt, unchanged from P2-6a
- No WEB_SURFACE_ADDENDUM exported or used

**src/agent/tools.js** — REVERTED TO d373c5c:
- Original tools, unchanged from P2-6a
- No contact field in respond_to_vendor

**dream-os commits this session:**
- c98b1ea fix(cors): add Codespaces + thedreamai.in to CORS allowlist
- d373c5c feat(chat): persist ai_primer as assistant context before vendor reply
- 5bbed6a feat: web surface voice [SUPERSEDED — reverted]
- b37585a feat: web fast path, CORS, ai_primer, voice [SUPERSEDED — reverted]
- a48e24d feat: WhatsApp+Call buttons via contact field [SUPERSEDED — reverted]
- 2abff3a feat: WhatsApp+Call buttons on drafted messages [writer file only]
- f6ac896 fix: one-turn draft [SUPERSEDED — reverted]
- 9c4f220 revert: restore original WhatsApp agent engine and system prompt [partial revert]
- 3b975df revert: restore d373c5c state [CURRENT HEAD — full clean revert]

**What this means:** dream-os at HEAD is exactly P2-6a plus CORS and ai_primer in chat.js. The original WhatsApp agent is intact and untouched.

---

### dreamai changes this session (devjroy-dev/dreamai)

**Current HEAD: 166a308**

Complete re-skin and re-wire of the existing dreamai Next.js app.

**Design system — dark glass:**
- Background: `linear-gradient(160deg, #0E0D0B 0%, #111111 45%, #0D0E0B 100%)`
- All panels: `backdrop-filter: blur()` + `rgba(255,255,255,0.03-0.08)` fills
- Typography: Cormorant Garamond 300 (display), DM Sans 300/400 (body), Jost 200/300 (labels)
- Gold: `#C9A84C`

**Screens:** Login (phone+OTP), Chat (/wedding), Calendar, Studio hub (/wedding/list), Studio drilldowns (/wedding/list/[slice])

**Key components:**
- `Header` — glass, profile circle (gold ring + initials), compact snapshot chevron dropdown (counts only — overdue, pending invoices, new enquiries, upcoming shoots). Gold dot when urgent. Closes on outside tap.
- `BottomNav` — Calendar / Chat (centred) / Studio
- `MessageBubble` — user: gold bubble. AI: `#1C1C1C` glass + Cormorant 17px.
- `SuggestionChips` — context-driven from real backend data
- `InputBar`, `ChatThread`, `ActionCard`

**Data layer:**
- `lib/api/_base.ts` — JWT attach, base URL defaults to `dream-os-production.up.railway.app`
- `lib/api/vendor.ts` — one function per endpoint. `sendChat` accepts optional `ai_primer`
- `lib/types/vendor.ts` — all response shapes

**hooks/useChat.ts:**
- Briefing fires as first AI message only when urgent (overdue invoices, new leads, today events). Empty thread if all clear.
- Briefing respects injected messages — `setMessages(prev => prev.length === 0 ? [briefing] : prev)`. If aiPrimer already injected before context loads, briefing stays silent.
- `pendingPrimerRef` — ai_primer sent with first backend call after inject, then cleared

**Auth:** Phone → WhatsApp OTP → JWT stored in localStorage. PIN flow deferred.

**Known issues / pending:**
1. **JWT expiry** — Supabase magic link JWTs expire in ~1 hour. `_base.ts` has no token refresh logic. Vendor must re-login when session expires. Fix needed: add `tryRefresh` to `_base.ts` using stored `refresh_token`. This is the top priority for next session.
2. **Vendor name** — `session.name` is null post-OTP-login. Header shows "Vendor". Need `GET /api/v2/vendor/me` call after login to enrich session.
3. **Delete tools** — `delete_event`, `delete_invoice`, `delete_lead`, `delete_client`, `delete_expense` not in tools.js. Studio delete button flow works (passes UUID directly). Chat delete flow fails — agent can't execute.
4. **list_events/list_leads/list_clients/list_invoices** — don't return IDs in their string output. Agent can't delete/update by name via chat — asks for phone number or UUID. Fix: add `(id: ${e.id})` to each list tool return string in engine.js.
5. **Anthropic 529 overload** — PWA chat has no retry on 529. WhatsApp webhook retries. When Anthropic is overloaded, PWA shows "Something went wrong" while WhatsApp recovers. Fix: add retry loop to chat.js for 529 errors.
6. **Session history pollution** — `vendor_self` conversation accumulates all messages forever. Agent reads last 10 from DB — could be from yesterday's session, polluting current context. WhatsApp unaffected (each WA conversation is scoped). Fix: on `channel === 'web'`, use frontend session history instead of DB history.

**dreamai commits this session:**
- 51d4607 feat: dark glass UI, phone+OTP auth, wired to dream-os
- be326a7 feat(chat): send ai_primer to backend for targeted edit responses
- edd7957 fix: useVendorData cast for Vercel build
- a129f83 feat: briefing-as-message, no snapshot panel, fast
- 5ec027e feat: WhatsApp+Call buttons, contact field [partially superseded]
- e3a17bd fix: briefing does not overwrite injected aiPrimer message
- 55da0ae fix: remove loading text below search bar on Studio slices
- 166a308 feat: compact snapshot dropdown in header

---

### Key decisions locked this session

- **dreamai is the vendor PWA alpha.** devjroy-dev/dreamai → thedreamai.in. Separate from dreamos-pwa.
- **Same agent as WhatsApp.** No web-specific engine changes. dream-os engine.js and systemPrompt.js are identical to P2-6a. The PWA gets the same intelligence, same voice, same Haiku/Sonnet routing as WhatsApp.
- **ai_primer pattern locked.** Edit flows pass context to backend as assistant message before vendor reply — agent has full edit context, gives targeted response.
- **Briefing-as-message pattern locked.** No snapshot panel. Context fires as first AI message when urgent. Empty thread if all clear.
- **Compact snapshot dropdown.** Counts only (overdue invoices, pending invoices, new enquiries, upcoming shoots). Gold dot when urgent. Lives in the header next to vendor name. Same glass pattern as profile dropdown.
- **Studio = List.** Renamed everywhere. Route stays `/wedding/list`.
- **Auth: phone + OTP only.** PIN login deferred. Returning user PIN flow in later session.
- **WhatsApp unchanged.** All backend changes either additive (CORS) or channel-gated (ai_primer, channel:'web'). Zero impact on WhatsApp agent behaviour, voice, or routing.

---

### What is next (priority order)

**Immediate — next session:**
1. JWT auto-refresh in `_base.ts` — add `tryRefresh` using stored refresh_token. Vendor should never need to re-login manually.
2. Vendor name enrichment — call `/api/v2/vendor/me` after login, store name in session. Header shows "Vendor" currently.
3. 529 retry in `chat.js` — retry up to 2x on overloaded_error before returning failure.
4. Session history fix — on `channel === 'web'`, pass frontend history array to engine instead of reading from DB.
5. List tools with IDs — add `(id: ${e.id})` to list_events, list_leads, list_clients, list_invoices return strings in engine.js.

**After fixes verified:**
- P2-6b proper (dreamos-pwa vendor screens)
- P2-7a bride/couple core endpoints
- P2-7b bride PWA screens

---

### Migration status (no changes this session)

Last applied: 0033. No new migrations in P2-6b-alpha.

| # | File | Status | What it adds |
|---|---|---|---|
| 0001–0033 | applied | ✅ | Full history in SCHEMA.md |
| 0034 | next when needed | ⏳ | TBD |

---

### Test credentials

| Item | Value |
|---|---|
| Vendor WhatsApp | +917982159047 |
| Bride WhatsApp | +14787788550 |
| Test vendor phone (Dev) | +918757788550 |
| Test vendor UUID | 2eb5d3fb-31eb-4b26-859a-cf10ae477d53 |
| Test vendor handle | DEV550 |
| Second test vendor (Swati) | SWATI978 / UUID e036ea4d-3f9a-4ec5-ba89-a5defa3a042b |
| Test bride phone (Swati) | +919888294440 |
| Test bride couple_id | 7abccc1b-0698-43ba-9709-c6a1e52af789 |
| Test bride phone (Meha) | +919625759924 |
| Malaysian test bride | +60122687535 / couple_id 285ccb5a-01f0-4873-829c-aac66377c890 |
| Supabase | nvzkbagqxbysoeszxent (Mumbai, ap-south-1) |
| Railway vendor | https://dream-os-production.up.railway.app |
| Railway bride | https://dream-wedding-production-6cef.up.railway.app |
| Admin | https://dream-os-production.up.railway.app/admin |
| Vercel dreamai | https://thedreamai.in |
| Vercel dreamos-pwa | https://dreamos-pwa.vercel.app |
| Cloudinary | dccso5ljv |
| Anthropic workspace | dream-os (Tier 2) |

---

### Env vars

Railway (dream-os):
```
TWILIO_WHATSAPP_NUMBER       whatsapp:+917982159047
TWILIO_ACCOUNT_SID           (in Railway)
TWILIO_AUTH_TOKEN            (in Railway)
TDW_WA_NUMBER                917982159047
BRIDE_WA_NUMBER              14787788550
ANTHROPIC_API_KEY            workspace: dream-os
GOOGLE_API_KEY               Google AI Studio
ADMIN_PASSWORD               (in Railway)
SUPABASE_URL                 nvzkbagqxbysoeszxent
SUPABASE_SERVICE_ROLE_KEY    service_role, never expose
```

Vercel (dreamai — thedreamai.in):
```
NEXT_PUBLIC_API_BASE = https://dream-os-production.up.railway.app
NEXT_PUBLIC_USE_MOCKS = false
```

---

### Document discipline

Active (updated every session):
  HANDOVER_FINAL.md — this file, fully rewritten each session
  ROADMAP_FINAL.md  — single active roadmap
  SCHEMA.md         — unified schema reference

Frozen (do not update):
  HANDOVER.md, HANDOVER_BRIDE.md — frozen at 8.5a and B3
  ROADMAP.md, ROADMAP_BRIDE.md   — frozen at 8.5a and B3
