# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-18 (P2-4 session)
**Session:** P2-4 complete. Block 1 auth JWT issuance phone-tested end-to-end.
**Version:** 0.10.0-alpha (no bump — Block 2 endpoints needed before 0.11.0-alpha)
**HEAD (dream-os):** 20c801b
**HEAD (dreamos-pwa):** 76ac9a4 (unchanged since P2-2)
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Repo backend:** https://github.com/devjroy-dev/dream-os
**Repo frontend:** https://github.com/devjroy-dev/dreamos-pwa
**Vercel:** https://dreamos-pwa.vercel.app (live, shell only)

Read this first. Then ROADMAP_FINAL.md. Then SCHEMA.md. Then FINDINGS_LOG.md.

---

## Phase 1 — complete (0.10.0-alpha)
## P2-1 — complete (2026-05-18)
## P2-2 — complete (2026-05-18)
## P2-3 — complete (2026-05-18)

All history in previous HANDOVER_FINAL.md commits. See git log.

---

## P2-4 — 2026-05-18 (this session)

Block 1 auth JWT issuance. Backend only. No frontend changes. No dreamos-pwa changes. No migrations.

### What was built

**New files:**
- src/api/middleware/requireAuth.js — Express middleware. Verifies Supabase Auth JWT via supabase.auth.getUser(token). Attaches req.auth = { user_id, phone } on success. Returns 401 on failure.
- src/api/_test/whoami.js — Smoke-test endpoint GET /api/v2/_test/whoami. Behind requireAuth. Returns { ok, user_id, phone }. DELETE before Block 2 goes live.

**Rewritten clean (no patch history):**
- src/api/vendor/auth.js — Full clean rewrite. All 5 endpoints. mintSession with correct JWT pattern.
- src/api/couple/auth.js — Full clean rewrite. All 5 endpoints. mintSession with correct JWT pattern.
- src/api/router.js — Full clean rewrite. All routes mounted including /_test/whoami.

### mintSession pattern — LOCKED

supabase.auth.admin.createSession does not exist in ^2.45.0. GoTrue REST /admin/users/:id/sessions returns 404 on this project. The correct pattern:

1. supabase.auth.admin.createUser({ id: userId, email: internalEmail, email_confirm: true })
   Idempotent — 422 / "already registered" = row exists, continue.
2. supabase.auth.admin.updateUserById(authId, { email: internalEmail, email_confirm: true })
   Ensures email is pinned on returning users. Idempotent.
3. supabase.auth.admin.generateLink({ type: 'magiclink', email: internalEmail })
   Returns hashed_token in data.properties. No email dispatched (admin API only).
4. supabase.auth.verifyOtp({ token_hash: hashed_token, type: 'email' })
   Exchanges hashed_token for real { access_token, refresh_token } JWT session.

Internal email format:
- Vendor: vendor-{userId}@internal.dreamai.app
- Couple: couple-{userId}@internal.dreamai.app

Never shown to users. Never emailed. Never visible in product. Technical workaround only.

### Session contract — LOCKED

- verify-otp returns { ok, user_id, vendor_id/couple_id, pin_set, access_token, refresh_token }
- pin-login returns { ok, user_id, vendor_id/couple_id, access_token, refresh_token }
- PWA stores JWT in localStorage
- All Block 2+ protected endpoints require: Authorization: Bearer <access_token>
- requireAuth calls supabase.auth.getUser(token) — no new env var needed

### Lazy auth.users backfill — LOCKED

- Existing WhatsApp users get auth.users row created on first PWA login
- Malaysian test bride (+60122687535) is WhatsApp-only — no PWA access, no auth.users row needed
- createUser is idempotent — safe to call on every login

### P2-4 commits (oldest to newest)

- 75900ee fix(auth): replace createSession with GoTrue REST call — P2-4
- 3af954f fix(auth): mintSession — generateLink + verifyOtp pattern for JWT (P2-4)
- 6a6b362 fix(api): mount _test/whoami route — P2-4
- 1090132 feat(auth): P2-4 clean build — auth + middleware + whoami + router
- 8c2f375 fix(auth): remove placeholder phone from createUser — P2-4
- 20c801b fix(auth): pass internal email in createUser — P2-4

### Phone test results (2026-05-18) — all pass

1. POST /api/v2/vendor/auth/send-otp → ok + WhatsApp OTP delivered ✅
2. POST /api/v2/vendor/auth/verify-otp → ok + access_token + refresh_token ✅
3. GET  /api/v2/_test/whoami (valid token) → ok + user_id + phone ✅
4. GET  /api/v2/_test/whoami (no token) → 401 no_token ✅
5. GET  /api/v2/_test/whoami (garbage token) → 401 token_invalid ✅
6. POST /api/v2/vendor/auth/pin-login → ok + access_token + refresh_token ✅

Finding #11 RESOLVED. JWT issuance confirmed working end-to-end.

---

## What is next — P2-5

P2-5 is a frontend session in dreamos-pwa. Backend not touched.

Landing page build:
- Hero
- "I have an invite code" → Dreamers/Makers tab → code input → validate → onboarding
- "Sign in" → phone → OTP → PIN setup (first time) or PIN login (returning)
- "Join the waitlist" → Dreamers/Makers split → name, phone, ig handle
- Waitlist confirmation: "We are onboarding in small batches and shall be getting in touch with you soon."

Wire 6 existing login screens to live endpoints:
- /vendor/login    → POST /api/v2/vendor/auth/send-otp
- /vendor/pin      → POST /api/v2/vendor/auth/verify-otp + set-pin
- /vendor/pin-login → POST /api/v2/vendor/auth/pin-login
- /couple/login    → POST /api/v2/couple/auth/send-otp
- /couple/pin      → POST /api/v2/couple/auth/verify-otp + set-pin
- /couple/pin-login → POST /api/v2/couple/auth/pin-login

JWT stored in localStorage after verify-otp or pin-login.

After P2-5: Block 2 vendor core endpoints.

---

## Access model — LOCKED

Two and only two ways into the PWA:
1. Invite code (admin-minted, single-use) → "I have an invite code" landing page path
2. WhatsApp onboarding (wa.me link) → "Sign in" landing page path

WhatsApp conversations do NOT grant PWA access. A bride who messaged a TDW link has a
couples row but cannot log into the PWA without an invite or WhatsApp onboarding.

Single front door: thedreamwedding.in for vendors AND dreamers.
thedreamai.in parked. Reserved for top-tier vendor subscribers post-launch.

---

## Product architecture — LOCKED

Four surfaces. One backend. Always.

  WhatsApp vendor  (+917982159047)  ->  dream-os  src/index.js
  WhatsApp bride   (+14787788550)   ->  dream-os  src/brideIndex.js
  Vendor PWA       thedreamwedding  ->  dream-os  /api/v2/vendor/* (P2-5+)
  Bride PWA        thedreamwedding  ->  dream-os  /api/v2/couple/* (P2-5+)
  Frost native     iOS/Android      ->  dream-os  new API endpoints (post-launch)

dream-os is the only backend. dream-wedding server.js is retiring.
dreamos-pwa is the only active frontend repo. tdw-2 is frozen reference.
Two repos. Two deploy targets. dream-os = Railway (Node). dreamos-pwa = Vercel (Next.js).

---

## Surface philosophy — LOCKED

WhatsApp = PA surface. Proactive. Brief. Voice-first.
Never more than 2-3 sentences. Drops PWA link for visual/data.

PWA = Planner surface. Visual. Rich. Data-forward.
ActionCard + Just Do It toggle. Streaming. Suggestion chips.

Baked snapshot (LOCKED): Before every vendor agent turn, Supabase fetch populates system
prompt with invoices, schedule (30-day), enquiries, notes. Agent reads from snapshot.
Zero tool calls for reads. Writes still use tools.

---

## dreamos-pwa — current state (post P2-2, unchanged in P2-3 and P2-4)

GitHub: https://github.com/devjroy-dev/dreamos-pwa
Vercel: https://dreamos-pwa.vercel.app (live, shell only)
HEAD: 76ac9a4
Stack: Next.js 16, React 19, Tailwind v4, TypeScript

URL swap complete. All files point at dream-os-production via API_BASE.
Coming Soon on post-launch screens.
Six login/auth screens exist but not yet wired to dream-os auth endpoints.
Wiring happens in P2-5.

---

## Endpoint build order — Phase 2 (updated)

Block 1 Auth — COMPLETE (P2-3 + P2-4)
  POST /api/v2/waitlist/signup          ✅
  POST /api/v2/invite/validate          ✅
  POST /api/v2/invite/consume           ✅
  POST /api/v2/vendor/auth/send-otp     ✅
  POST /api/v2/vendor/auth/verify-otp   ✅ JWT issuing
  POST /api/v2/vendor/auth/set-pin      ✅
  POST /api/v2/vendor/auth/pin-login    ✅ JWT issuing
  POST /api/v2/vendor/auth/forgot-pin   ✅
  POST /api/v2/couple/auth/send-otp     ✅
  POST /api/v2/couple/auth/verify-otp   ✅ JWT issuing
  POST /api/v2/couple/auth/set-pin      ✅
  POST /api/v2/couple/auth/pin-login    ✅ JWT issuing
  POST /api/v2/couple/auth/forgot-pin   ✅
  POST /admin/invite-codes (mint)       ✅
  GET  /api/v2/_test/whoami             ✅ (smoke test — delete after Block 2)

Block 2 Vendor core (P2-5+):
  GET  /api/v2/vendor/today/:vendorId
  GET  /api/v2/dreamai/vendor-context/:vendorId
  POST /api/v2/dreamai/chat
  GET  /api/invoices/:vendorId
  GET  /api/v2/vendor/clients/:vendorId
  GET  /api/v2/vendor/leads/:vendorId
  GET  /api/v2/vendor/events/:vendorId
  GET  /api/v2/vendor/expenses/:vendorId

Block 3 Bride core:
  POST /api/v2/dreamai/bride-chat
  GET  /api/v2/dreamai/bride-idle/:coupleId
  GET  /api/v2/frost/home-images/:coupleId
  GET  /api/couple/muse/:coupleId
  GET  /api/v2/frost/circle/feed/:coupleId
  POST /api/v2/frost/circle/messages
  POST /api/v2/frost/surprise-me
  POST /api/v2/dreamai/bride-confirm

Block 4 Journey tools:
  GET /api/couple/expenses/:coupleId
  GET /api/v2/couple/events/:coupleId
  GET /api/couple/vendors/:coupleId
  GET /api/couple/bookings/:coupleId

Block 5: Discover preview endpoint + retire dream-wedding Railway.

---

## Migration status (as of P2-4)

No migrations in P2-4. Last applied: 0033. Schema unchanged from P2-3.

| # | File | Status | What it adds |
|---|---|---|---|
| 0001-0025 | (applied) | ✅ | Full history in SCHEMA.md |
| 0026 | invoices_last_payment_at.sql | ⏳ Phase 2 | invoices.last_payment_at |
| 0027 | discover.sql | ⏳ Phase 3 | couple_vendor_connections, discover_readiness |
| 0028 | pin_auth.sql | ✅ Applied 2026-05-18 | PIN columns + lockout + XOR triggers |
| 0029 | discover_preview.sql | ⏳ Phase 2 Block 2 | vendors.discover_preview boolean |
| 0030 | landing_assets.sql | ⏳ Landing page session | landing_slides, exploring_photos |
| 0031 | invite_codes.sql | ✅ Applied 2026-05-18 | invite_codes + consume function |
| 0032 | waitlist_signups.sql | ✅ Applied 2026-05-18 | waitlist_signups table |
| 0033 | otp_sessions.sql | ✅ Applied 2026-05-18 | otp_sessions table |

Next migration when needed: 0034

---

## PWA login sequence — LOCKED

New user (invite code): invite code → phone → WhatsApp OTP → set 4-digit PIN → enter app
New user (via WhatsApp): sign in → phone → WhatsApp OTP → set 4-digit PIN → enter app
Returning user: phone → PIN → enter app (no OTP)
PIN: 4 digits, numbers only. bcrypt hash in vendors.pin_hash / couples.pin_hash. NULL = not set.
Session: Supabase Auth JWT. Stored in localStorage. ✅ Working as of P2-4.

Six screens in dreamos-pwa (exist, not yet wired — P2-5):
  /vendor/login, /vendor/pin, /vendor/pin-login
  /couple/login, /couple/pin, /couple/pin-login

---

## Discover preview — Phase 2

Bride FEED: 4-5 founding vendors. Pure view. No enquire button.
Vendor DISCOVERY: own profile preview. Pure view.
Endpoint: GET /api/v2/discover/preview (WHERE discover_preview=true). No auth.
Requires 0024 (vendor_portfolio) + 0029 (discover_preview column) applied first.
Swati seeds manually. Admin panel in post-Phase 2 admin session.

---

## Post-Phase 2 admin session — full scope

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

Vendor agent — all Phase 1 + P2-1 features working.
Bride agent — all Phase 1 + P2-1 features working.

Pending:
TWILIO TEMPLATES NEVER SUBMITTED. Submit at start of P2-5.
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

## Env vars

Railway (dream-os):
  TWILIO_WHATSAPP_NUMBER       whatsapp:+917982159047
  TWILIO_ACCOUNT_SID           (in Railway)
  TWILIO_AUTH_TOKEN            (in Railway)
  TDW_WA_NUMBER                917982159047
  BRIDE_WA_NUMBER              14787788550
  ANTHROPIC_API_KEY            workspace: dream-os
  GOOGLE_API_KEY               Google AI Studio, dev@thedreamwedding.in
  ADMIN_PASSWORD               (rotated P2-4 session — in password manager only)
  SUPABASE_URL                 nvzkbagqxbysoeszxent
  SUPABASE_SERVICE_ROLE_KEY    service_role, never expose

Vercel (dreamos-pwa):
  NEXT_PUBLIC_API_BASE         https://dream-os-production.up.railway.app

---

## Document discipline

Active (updated every session):
  HANDOVER_FINAL.md  — this file, fully rewritten each session
  ROADMAP_FINAL.md   — single active roadmap
  SCHEMA.md          — unified schema reference
  FINDINGS_LOG.md    — append-only out-of-scope findings

Frozen (do not update):
  HANDOVER.md, HANDOVER_BRIDE.md  frozen at 8.5a and B3
  ROADMAP.md, ROADMAP_BRIDE.md    frozen at 8.5a and B3

Session not complete until all four active docs committed and pushed.

Working rule 14: At session start, after reading docs, Claude briefs founder on what
the session will build — one thing at a time — and waits for explicit confirmation
before writing any code.
