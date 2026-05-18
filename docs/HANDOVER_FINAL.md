# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-19 (P2-5 session)
**Session:** P2-5 complete. Landing page live. Auth wired end-to-end. Waitlist working. Country picker shipped.
**Version:** 0.10.0-alpha (no bump - Block 2 endpoints needed before 0.11.0-alpha)
**HEAD (dream-os):** f83fdce
**HEAD (dreamos-pwa):** 31a3b11
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Repo backend:** https://github.com/devjroy-dev/dream-os
**Repo frontend:** https://github.com/devjroy-dev/dreamos-pwa
**Vercel:** https://dreamos-pwa.vercel.app (live - landing page + full auth flow working)

Read this first. Then ROADMAP_FINAL.md. Then SCHEMA.md. Then FINDINGS_LOG.md.

---

## Phase 1 - complete (0.10.0-alpha)
## P2-1 - complete (2026-05-18)
## P2-2 - complete (2026-05-18)
## P2-3 - complete (2026-05-18)
## P2-4 - complete (2026-05-18)

All history in previous HANDOVER_FINAL.md commits. See git log.

---

## P2-5 - 2026-05-19 (this session)

Landing page + auth wiring + backend glue. Both repos touched. Migration 0030 applied.

### What was built - dream-os (backend)

New files:
- src/api/landing-slides.js - GET /api/v2/landing-slides. Public. Returns active rows from landing_slides ordered by display_order. Response: { ok, slides: [{ id, image_url, caption, display_order }] }
- src/api/exploring-photos.js - GET /api/v2/exploring-photos. Public. Returns active rows from exploring_photos. Response: { ok, photos: [...] }
- src/api/pin-status.js - POST /api/v2/auth/pin-status. Public. Takes { phone, role }. Returns { ok, exists, pin_set, user_id, role_id }. Required by locked login sequence. Not in original roadmap - discovered during P2-5 frontend inventory.

Modified:
- src/api/router.js - 3 new route mounts: /landing-slides, /exploring-photos, /auth/pin-status.
- src/index.js - Added CORS middleware (cors ^2.8.5). Allowed origins: thedreamwedding.in, www.thedreamwedding.in, dreamos-pwa.vercel.app, localhost:3000/3001, any dreamos-pwa Vercel preview URL. credentials: true.
- src/api/waitlist.js - instagram_handle made optional. Field stored when provided, null accepted when missing.
- package.json / package-lock.json - Added cors ^2.8.5.

Migration applied:
- db/migrations/0030_landing_assets.sql - Creates landing_slides + exploring_photos tables. Both: uuid PK, image_url NOT NULL, cloudinary_public_id nullable, caption nullable, display_order int NOT NULL default 0, active boolean NOT NULL default true, created_at/updated_at timestamptz. Idempotent seed: 3 Cloudinary URLs inserted into both tables.

Cloudinary seed URLs (also hardcoded as FALLBACK_SLIDES in all frontend auth screens):
  https://res.cloudinary.com/dccso5ljv/image/upload/IMG_2544.PNG_cyeqlj
  https://res.cloudinary.com/dccso5ljv/image/upload/Facetune_14-05-2026-11-06-49_qs4dg6
  https://res.cloudinary.com/dccso5ljv/image/upload/Facetune_24-03-2026-22-59-53_f2tfsy

### What was built - dreamos-pwa (frontend)

app/page.tsx (landing page + full auth flow):
- FALLBACK_SLIDES populated with 3 Cloudinary URLs.
- Slideshow endpoint: /api/v2/cover-photos -> /api/v2/landing-slides. d.photos -> d.slides.
- Exploring photos: d.success -> d.ok. Dead preview-vendors fallback block removed.
- Waitlist: /api/v2/waitlist -> /api/v2/waitlist/signup. role -> kind. instagram -> instagram_handle. Phone: country.dialCode + digits.
- sendOtp: bare digits -> country.dialCode + digits (e164).
- verifyOtp: reads Block 1 response shape (d.ok, d.user_id, d.vendor_id/couple_id, d.pin_set, d.access_token, d.refresh_token). Stores JWT. Session phone stored as e164.
- handleSignIn: pin-status POST body. Reads d.ok, d.exists, d.pin_set, d.user_id, d.role_id. Stores full session (id, userId, vendorId, phone, pin_set) so pin-login guards pass.
- COUNTRIES: 11 NRI-focused countries. India +91 (10), UAE +971 (9), USA +1 (10), UK +44 (10), Canada +1 (10), Australia +61 (9), Malaysia +60 (10), Germany +49 (10), France +33 (9), New Zealand +64 (9), South Africa +27 (9).
- CountrySheet: glassmorphic bottom sheet. Tapping flag/dialcode opens it. Selecting country updates prefix, clears phone input.
- All 4 phone inputs: static flag+91 replaced with tappable country picker. maxLength + disabled use country.maxDigits.

PIN screens (vendor/pin, vendor/pin-login, couple/pin, couple/pin-login):
- FALLBACK_SLIDES populated. cover-photos -> landing-slides. d.photos -> d.slides.
- Endpoints fixed: /api/v2/auth/set-pin -> /api/v2/vendor|couple/auth/set-pin. d.success -> d.ok. JWT stored.
- pin-login: /api/v2/auth/verify-pin -> /api/v2/vendor|couple/auth/pin-login. JWT stored. Reads d.vendor_id/d.couple_id, d.user_id.

Other screens (vendor/onboarding, couple/onboarding, circle/join/[token]):
- FALLBACK_SLIDES populated. cover-photos -> landing-slides. d.photos -> d.slides.
- couple/onboarding: Unsplash fallback URLs replaced with Cloudinary URLs.

Deleted:
- app/vendor/login/page.tsx - redirect stub. Unused.
- app/couple/login/page.tsx - redirect stub. Unused.

### P2-5 bugs found and fixed in-session

1. CORS not configured - browser blocked all Vercel->Railway requests. Added cors middleware.
2. Phone format - all auth calls sending bare 10 digits. Fixed to E.164 everywhere.
3. Waitlist payload field mismatches - role -> kind, instagram -> instagram_handle.
4. instagram_handle required in backend but form did not enforce it - made optional.
5. pin-status was GET with query params - changed to POST with JSON body.
6. pin-status response missing user_id + role_id - pin-login screens guard on session.id/userId. handleSignIn stored only phone + pin_set causing bounce back to /. Fixed by returning user_id + role_id from pin-status and storing in session.

### P2-5 commits - dream-os

- b0f02e5 feat(p2-5): block A - landing-slides + exploring-photos + pin-status endpoints, migration 0030
- dab31e3 fix(p2-5): add CORS middleware - allow thedreamwedding.in + Vercel origins
- e91930c fix(p2-5): make instagram_handle optional in waitlist
- f83fdce fix(p2-5): pin-status returns user_id + role_id for session hydration

### P2-5 commits - dreamos-pwa

- 103e91a fix(p2-5): block B - endpoint renames, response shape, JWT storage, fallback slides
- 61ddd68 fix(p2-5): E.164 phone format in all auth calls and session storage
- 1b9ec3d fix(p2-5): E.164 phone format in waitlist signup
- 0da8345 fix(p2-5): waitlist payload - E.164 phone, kind field, instagram_handle field
- ed9040f feat(p2-5): country code bottom sheet for all phone inputs
- 31a3b11 fix(p2-5): handleSignIn stores role_id + user_id in session before pin-login

### P2-5 phone test results (2026-05-19)

1. Landing page loads with slideshow (3 Cloudinary images) OK
2. Just Exploring - 3 photos swipeable OK
3. Waitlist - Dreamer -> row saved in waitlist_signups OK
4. Waitlist - Maker -> row saved in waitlist_signups OK
5. Sign in - returning vendor (+918757788550, PIN 1234) -> vendor home (/vendor/today) OK
6. Sign in - returning bride (+919888294440, PIN 1234) -> bride home (/couple/today) OK
7. Country picker - bottom sheet opens, 11 countries, selection updates prefix OK

Note: vendor home and bride home show 404s on all data endpoints - expected. Block 2 (P2-6) and Block 3 (P2-7) not built yet.

---

## What is next - P2-6

P2-6 is Block 2: vendor core endpoints. Backend + frontend wiring. Both repos touched.

Endpoints to build:
  GET  /api/v2/vendor/today/:vendorId
  GET  /api/v2/dreamai/vendor-context/:vendorId
  POST /api/v2/dreamai/chat
  GET  /api/invoices/:vendorId
  GET  /api/v2/vendor/clients/:vendorId
  GET  /api/v2/vendor/leads/:vendorId
  GET  /api/v2/vendor/events/:vendorId
  GET  /api/v2/vendor/expenses/:vendorId

After P2-6: P2-7 (Block 3 bride core), P2-8 (Block 4 journey), P2-9 (migrations + retire dream-wedding + v0.11.0-alpha).

---

## Access model - LOCKED

Two and only two ways into the PWA:
1. Invite code (admin-minted, single-use) -> "I have an invite code" landing page path
2. WhatsApp onboarding (wa.me link) -> "Sign in" landing page path

Single front door: thedreamwedding.in for vendors AND dreamers.
thedreamai.in parked. Reserved for top-tier vendor subscribers post-launch.

---

## Product architecture - LOCKED

Four surfaces. One backend. Always.

  WhatsApp vendor  (+917982159047)  ->  dream-os  src/index.js
  WhatsApp bride   (+14787788550)   ->  dream-os  src/brideIndex.js
  Vendor PWA       thedreamwedding  ->  dream-os  /api/v2/vendor/* (P2-6+)
  Bride PWA        thedreamwedding  ->  dream-os  /api/v2/couple/* (P2-7+)
  Frost native     iOS/Android      ->  dream-os  new API endpoints (post-launch)

dream-os is the only backend. dream-wedding server.js is retiring.
dreamos-pwa is the only active frontend repo. tdw-2 is frozen reference.
Two repos. Two deploy targets. dream-os = Railway (Node). dreamos-pwa = Vercel (Next.js).

---

## Surface philosophy - LOCKED

WhatsApp = PA surface. Proactive. Brief. Voice-first.
Never more than 2-3 sentences. Drops PWA link for visual/data.

PWA = Planner surface. Visual. Rich. Data-forward.
ActionCard + Just Do It toggle. Streaming. Suggestion chips.

Baked snapshot (LOCKED): Before every vendor agent turn, Supabase fetch populates system
prompt with invoices, schedule (30-day), enquiries, notes. Agent answers reads from snapshot.
Zero tool calls for reads. Writes still use tools.

---

## dreamos-pwa - current state (post P2-5)

GitHub: https://github.com/devjroy-dev/dreamos-pwa
Vercel: https://dreamos-pwa.vercel.app (live)
HEAD: 31a3b11
Stack: Next.js 16, React 19, Tailwind v4, TypeScript
Active Codespace: psychic-computing-machine

Landing page: fully functional. Waitlist, invite code, sign-in, country picker all working.
Auth flow: phone -> WhatsApp OTP -> PIN setup (new) or PIN login (returning). JWT issued and stored.
Vendor home: /vendor/today loads (shell). Data endpoints 404 - Block 2 not built.
Bride home: /couple/today loads (shell). Data endpoints 404 - Block 3 not built.

---

## Endpoint build order - Phase 2 (updated)

Block 1 Auth - COMPLETE (P2-3 + P2-4 + P2-5)
  POST /api/v2/waitlist/signup          OK
  POST /api/v2/invite/validate          OK
  POST /api/v2/invite/consume           OK
  POST /api/v2/vendor/auth/send-otp     OK
  POST /api/v2/vendor/auth/verify-otp   OK JWT issuing
  POST /api/v2/vendor/auth/set-pin      OK
  POST /api/v2/vendor/auth/pin-login    OK JWT issuing
  POST /api/v2/vendor/auth/forgot-pin   OK
  POST /api/v2/couple/auth/send-otp     OK
  POST /api/v2/couple/auth/verify-otp   OK JWT issuing
  POST /api/v2/couple/auth/set-pin      OK
  POST /api/v2/couple/auth/pin-login    OK JWT issuing
  POST /api/v2/couple/auth/forgot-pin   OK
  POST /admin/invite-codes (mint)       OK
  GET  /api/v2/landing-slides           OK P2-5
  GET  /api/v2/exploring-photos         OK P2-5
  POST /api/v2/auth/pin-status          OK P2-5
  GET  /api/v2/_test/whoami             OK (smoke test - delete after Block 2)

Block 2 Vendor core (P2-6):
  GET  /api/v2/vendor/today/:vendorId
  GET  /api/v2/dreamai/vendor-context/:vendorId
  POST /api/v2/dreamai/chat
  GET  /api/invoices/:vendorId
  GET  /api/v2/vendor/clients/:vendorId
  GET  /api/v2/vendor/leads/:vendorId
  GET  /api/v2/vendor/events/:vendorId
  GET  /api/v2/vendor/expenses/:vendorId

Block 3 Bride core (P2-7):
  POST /api/v2/dreamai/bride-chat
  GET  /api/v2/dreamai/bride-idle/:coupleId
  GET  /api/v2/frost/home-images/:coupleId
  GET  /api/couple/muse/:coupleId
  GET  /api/v2/frost/circle/feed/:coupleId
  POST /api/v2/frost/circle/messages
  POST /api/v2/frost/surprise-me
  POST /api/v2/dreamai/bride-confirm

Block 4 Journey tools (P2-8):
  GET /api/couple/expenses/:coupleId
  GET /api/v2/couple/events/:coupleId
  GET /api/couple/vendors/:coupleId
  GET /api/couple/bookings/:coupleId

Block 5 (P2-9): Migrations 0024 + 0026 applied. Discover preview endpoint. Retire dream-wedding. v0.11.0-alpha.

---

## Migration status (as of P2-5)

Last applied: 0030. Next migration when needed: 0034.

| # | File | Status | What it adds |
|---|---|---|---|
| 0001-0025 | (applied) | OK | Full history in SCHEMA.md |
| 0026 | invoices_last_payment_at.sql | P2-9 | invoices.last_payment_at |
| 0027 | discover.sql | Phase 3 | couple_vendor_connections, discover_readiness |
| 0028 | pin_auth.sql | OK Applied 2026-05-18 | PIN columns + lockout + XOR triggers |
| 0029 | discover_preview.sql | P2-9 | vendors.discover_preview boolean |
| 0030 | landing_assets.sql | OK Applied 2026-05-19 | landing_slides + exploring_photos + seed |
| 0031 | invite_codes.sql | OK Applied 2026-05-18 | invite_codes + consume function |
| 0032 | waitlist_signups.sql | OK Applied 2026-05-18 | waitlist_signups table |
| 0033 | otp_sessions.sql | OK Applied 2026-05-18 | otp_sessions table |

---

## PWA login sequence - LOCKED

New user (invite code): invite code -> phone -> WhatsApp OTP -> set 4-digit PIN -> enter app
New user (via WhatsApp): sign in -> phone -> WhatsApp OTP -> set 4-digit PIN -> enter app
Returning user: phone -> PIN -> enter app (no OTP)
PIN: 4 digits, numbers only. bcrypt hash in vendors.pin_hash / couples.pin_hash. NULL = not set.
Session: Supabase Auth JWT. Stored in localStorage. Working as of P2-4.
Country code: user selects from 11-country bottom sheet (India default). E.164 = dialCode + digits.
All 6 auth screens wired to live endpoints (P2-5).

---

## Discover preview - Phase 2

Bride FEED: 4-5 founding vendors. Pure view. No enquire button.
Vendor DISCOVERY: own profile preview. Pure view.
Endpoint: GET /api/v2/discover/preview (WHERE discover_preview=true). No auth.
Requires 0024 (vendor_portfolio) + 0029 (discover_preview column) applied first.
Swati seeds manually. Admin panel in post-Phase 2 admin session.
Scheduled for P2-9.

---

## Post-Phase 2 admin session - full scope

1. hot_dates panel
2. Just Explore management (exploring_photos)
3. Cover photo management (landing_slides)
4. Discover preview management
5. Admin password rotation + rebuild admin pages server-side (FINDINGS_LOG #1)
6. Waitlist management UI
7. Admin URL /mint cosmetic fix (FINDINGS_LOG #10)
8. Any accumulated admin needs

---

## Current WhatsApp agent state (0.10.0-alpha)

Vendor agent - all Phase 1 + P2-1 features working.
Bride agent - all Phase 1 + P2-1 features working.

Pending:
TWILIO TEMPLATES NEVER SUBMITTED. Submit before P2-6.
  dream_os_morning_briefing on +917982159047
  dream_wedding_morning_nudge on +14787788550
Surprise Me / factual_search: pending Google billing verification.
Morning nudge: cron registered, first fire pending.

---

## Test credentials

| Item | Value |
|---|---|
| Vendor WhatsApp | +917982159047 |
| Bride WhatsApp | +14787788550 |
| Test vendor phone (Dev) | +918757788550 |
| Test vendor UUID | 2eb5d3fb-31eb-4b26-859a-cf10ae477d53 |
| Test vendor handle | DEV550 |
| Test vendor PIN | 1234 |
| Second test vendor (Swati) | SWATI978 / UUID e036ea4d-3f9a-4ec5-ba89-a5defa3a042b |
| Test bride phone (Swati) | +919888294440 |
| Test bride couple_id | 7abccc1b-0698-43ba-9709-c6a1e52af789 |
| Test bride PIN (Swati) | 1234 |
| Test bride phone (Meha) | +919625759924 |
| Malaysian test bride | +60122687535 / couple_id 285ccb5a-01f0-4873-829c-aac66377c890 (WhatsApp-only, no PWA) |
| Supabase | nvzkbagqxbysoeszxent (Mumbai, ap-south-1) |
| Railway vendor | https://dream-os-production.up.railway.app |
| Railway bride | https://dream-wedding-production-6cef.up.railway.app |
| Admin | https://dream-os-production.up.railway.app/admin |
| Admin invite codes | https://dream-os-production.up.railway.app/admin/invite-codes |
| Vercel PWA | https://dreamos-pwa.vercel.app |
| Cloudinary | dccso5ljv |
| Anthropic workspace | dream-os |

---

## Codespace map

| Codespace | Repo | Use |
|---|---|---|
| supreme-space-palm-tree | dream-os | Backend. Active. |
| psychic-computing-machine | dreamos-pwa | Frontend Next.js. Active. |
| Others | tdw-2, dream-wedding, dreamai | Reference repos. Frozen. |

Always verify with git log -1 --oneline before running commands.

---

## Env vars

Railway (dream-os):
  TWILIO_WHATSAPP_NUMBER       whatsapp:+917982159047
  TWILIO_ACCOUNT_SID           (in Railway)
  TWILIO_AUTH_TOKEN            (in Railway)
  TDW_WA_NUMBER                917982159047
  BRIDE_WA_NUMBER              14787788550
  ANTHROPIC_API_KEY            workspace: dream-os
  GOOGLE_API_KEY               Google AI Studio, dev@thedreamwedding.in
  ADMIN_PASSWORD               (rotated P2-4 session - in password manager only)
  SUPABASE_URL                 nvzkbagqxbysoeszxent
  SUPABASE_SERVICE_ROLE_KEY    service_role, never expose

Vercel (dreamos-pwa):
  NEXT_PUBLIC_API_BASE         https://dream-os-production.up.railway.app

---

## Document discipline

Active (updated every session):
  HANDOVER_FINAL.md  - this file, fully rewritten each session
  ROADMAP_FINAL.md   - single active roadmap
  SCHEMA.md          - unified schema reference
  FINDINGS_LOG.md    - append-only out-of-scope findings

Frozen (do not update):
  HANDOVER.md, HANDOVER_BRIDE.md  frozen at 8.5a and B3
  ROADMAP.md, ROADMAP_BRIDE.md    frozen at 8.5a and B3

Session not complete until all four active docs committed and pushed.

Working rule 14: At session start, after reading docs, Claude briefs founder on what
the session will build - one thing at a time - and waits for explicit confirmation
before writing any code.
