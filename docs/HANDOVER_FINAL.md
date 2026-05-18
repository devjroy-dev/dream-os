# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-18 (P2-3 session)
**Session:** P2-3 complete. Landing page infrastructure + full auth block built and phone-tested.
**Version:** 0.10.0-alpha (no bump — P2-4 endpoints needed before 0.11.0-alpha)
**HEAD (dream-os):** 7423439
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

All history in previous HANDOVER_FINAL.md commits. See git log.

---

## P2-3 — 2026-05-18 (this session)

Landing page infrastructure and full auth block. Backend only.
No frontend changes. No dreamos-pwa changes. dream-os Railway only.

### What was built

**Migrations applied (4):**
- 0028_pin_auth.sql — vendors/couples PIN columns + lockout + hard role XOR triggers
- 0031_invite_codes.sql — invite_codes table + consume_invite_code() atomic function
- 0032_waitlist_signups.sql — waitlist_signups table
- 0033_otp_sessions.sql — otp_sessions table (transient OTP state)

**New API endpoints (13):**
- POST /api/v2/waitlist/signup — public, no auth, inserts waitlist_signups
- POST /api/v2/invite/validate — check code valid + unconsumed, kind match
- POST /api/v2/invite/consume — atomic consume + users row creation
- POST /api/v2/vendor/auth/send-otp — OTP via +917982159047
- POST /api/v2/vendor/auth/verify-otp — bcrypt verify, returns vendor_id + pin_set
- POST /api/v2/vendor/auth/set-pin — bcrypt PIN → vendors.pin_hash
- POST /api/v2/vendor/auth/pin-login — verify PIN, lockout enforcement
- POST /api/v2/vendor/auth/forgot-pin — reset OTP via +917982159047
- POST /api/v2/couple/auth/send-otp — OTP via +14787788550
- POST /api/v2/couple/auth/verify-otp — bcrypt verify, returns couple_id + pin_set
- POST /api/v2/couple/auth/set-pin — bcrypt PIN → couples.pin_hash
- POST /api/v2/couple/auth/pin-login — verify PIN, lockout enforcement
- POST /api/v2/couple/auth/forgot-pin — reset OTP via +14787788550

**New admin routes:**
- GET  /admin/invite-codes — list recent 20 codes + mint form
- POST /admin/invite-codes/mint — generate 8-char unique code, collision-checked

**Admin nav:** Invite Codes link added to layout.js nav.

**New dependency:** bcryptjs ^2.4.3 (pure JS bcrypt, no native build required).

**New files:**
- src/api/router.js — top-level /api/v2 router
- src/api/waitlist.js — waitlist endpoint
- src/api/invite.js — invite validate + consume
- src/api/vendor/auth.js — all 5 vendor auth endpoints
- src/api/couple/auth.js — all 5 couple auth endpoints
- src/admin/views/inviteMint.js — admin mint page view

**Patched files:**
- src/index.js — mounts /api/v2 router
- src/admin/router.js — mounts invite-codes routes
- src/admin/views/layout.js — adds Invite Codes nav link
- package.json — adds bcryptjs

### Architecture decisions locked in P2-3

**Access model:** Fully gated. Two and only two ways in:
1. Invite code (admin-minted, single-use, forever until consumed)
2. WhatsApp invite (Swati → admin → existing flow creates vendors/couples row)

**Single front door:** thedreamwedding.in for everyone (vendors + brides).
thedreamai.in parked until post-launch. Top-tier vendor access via thedreamai.in TBD.

**Landing page sections (to be built in dreamos-pwa):**
- Hero
- "I have an invite code" → Dreamers tab / Makers tab → code input → validate → onboarding
- "Sign in" → phone → OTP → PIN setup (first time) or PIN login (returning)
- "Join the waitlist" → two forms: Dreamers / Makers → three fields: name, phone, ig handle
- Waitlist confirmation: "We are onboarding in small batches and shall be getting in touch with you soon."

**Invite codes:**
- 8 chars, alphabet ABCDEFGHJKMNPQRSTUVWXYZ23456789 (no 0/O/1/I/L)
- Uppercase. Case-insensitive lookup.
- Single-use. Never expire until consumed.
- kind: dreamer | maker (enforced at validate + consume)
- tier: nullable (provisioning-ready, no CHECK constraint yet)
- Minted via admin at /admin/invite-codes

**Waitlist:**
- Fields: name, phone (E.164, country-code dropdown default +91 India), instagram_handle
- Split: Dreamers form + Makers form (kind captured at submission)
- No UNIQUE on phone — duplicate submissions captured, admin decides
- Admin views waitlist in Supabase (post-Phase 2 admin session adds UI)

**Phone normalisation:**
- All phones stored E.164 with leading + (matches users.phone from 0001)
- Frontend country-code dropdown: default +91 India, NRI corridors at top (+1 US, +44 UK, +971 UAE, +65 SG, +966 SA, +974 QA), Other → full list
- API validates ^\+[0-9]{8,15}$ before insert

**IG handle:** Raw without @. API strips leading @ and trims. Mirrors vendors.instagram_handle (0005).

**Hard role XOR:**
- One phone = one role. Dreamer OR Maker. Never both. Lifetime.
- Enforced at: (1) DB level — enforce_role_xor() triggers on vendors + couples INSERT, (2) API level — /invite/consume + send-otp check for opposite role
- Pre-condition verified 2026-05-18: zero cross-table user_id violations in production

**PIN:**
- 4 digits, numbers only (0-9). regex ^\d{4}$
- bcrypt hash, BCRYPT_ROUNDS=10. Stored in vendors.pin_hash / couples.pin_hash
- NULL = PIN not yet set (go through OTP → set-pin)
- Input UI: numeric keypad (inputMode=numeric, pattern=[0-9]*, maxLength=4)

**Lockout:**
- 5 failed PIN attempts → pin_locked_until = now() + 15 min
- pin_failed_attempts resets to 0 on: successful PIN, successful OTP reset
- pin_locked_until cleared on: successful OTP reset
- Escape: forgot-pin flow (OTP → set new PIN)

**OTP delivery:**
- Vendor OTPs from +917982159047 (thedreamai.in number)
- Bride OTPs from +14787788550 (thedreamwedding.in number)
- 6-digit numeric, zero-padded, bcrypt-hashed in otp_sessions
- TTL: 5 minutes. Single-use (row deleted on successful verify).
- Vendor message: "Your DreamAI login code is: XXXXXX. Valid for 5 minutes."
- Bride message: "Your Dream Wedding login code is: XXXXXX. Valid for 5 minutes."
- Reset variant: "Your DreamAI/Dream Wedding PIN reset code is: XXXXXX."

**Forgot PIN:**
- "Forgot PIN" → send-otp (purpose=reset) → verify-otp (purpose=reset) → set-pin screen
- Set-pin screen copy: "Enter a new 4-digit PIN."
- verify-otp (purpose=reset) clears lockout columns on success

### P2-3.a — deferred (do before P2-4)

1. Supabase Auth JWT not yet issued by verify-otp endpoints. See FINDINGS_LOG Finding #11.
   Must be added in P2-4 Block 1 before any protected endpoints can work.
   Requires Supabase Auth phone provider setup (Twilio config in Supabase dashboard).

2. Twilio templates still not submitted:
   - dream_os_morning_briefing on +917982159047
   - dream_wedding_morning_nudge on +14787788550
   Submit at start of P2-4. Approval 1-7 days.

3. Admin URL shows /mint after form submit (cosmetic). FINDINGS_LOG #10.
   Fix: add res.redirect after successful mint. Post-Phase 2 admin polish.

### Test credentials (updated)

| Account | Phone | PIN | ID |
|---|---|---|---|
| Dev vendor (DEV550) | +918757788550 | 1234 | 2eb5d3fb-31eb-4b26-859a-cf10ae477d53 |
| Swati bride | +919888294440 | 1234 | couple_id 7abccc1b-0698-43ba-9709-c6a1e52af789 |
| Swati vendor (SWATI978) | +91XXXXXXXXXX | not set | e036ea4d-3f9a-4ec5-ba89-a5defa3a042b |
| Meha bride | +919625759924 | not set | — |
| Malaysian test bride | +60122687535 | not set | couple_id 285ccb5a-01f0-4873-829c-aac66377c890 |

### P2-3 commits (oldest to newest)

- fd0ccee feat(db): migration 0028 — pin_auth columns + role XOR triggers (P2-3)
- d5b88ad feat(db): migration 0031 — invite_codes table + consume function (P2-3)
- 9cfd955 feat(db): migration 0032 — waitlist_signups table (P2-3)
- 646e1e4 feat(api): POST /api/v2/waitlist/signup + api/v2 router (P2-3)
- 4a76507 feat(api): POST /api/v2/invite/validate + consume (P2-3)
- fe20925 feat(admin): invite code minting — GET/POST /admin/invite-codes (P2-3)
- 5c77a0b feat(db): migration 0033 — otp_sessions table (P2-3)
- 405c6da feat(api): vendor auth endpoints — OTP + PIN (P2-3)
- 3674a0f feat(admin): add Invite Codes nav link (P2-3)
- 7423439 feat(api): couple auth endpoints — OTP + PIN (P2-3)

---

## Product architecture — LOCKED

Four surfaces. One backend. Always.

  WhatsApp vendor  (+917982159047)  ->  dream-os  src/index.js
  WhatsApp bride   (+14787788550)   ->  dream-os  src/brideIndex.js
  Vendor PWA       thedreamai.in    ->  dream-os  /api/v2/vendor/* (P2-4+)
  Bride PWA        thedreamwedding  ->  dream-os  /api/v2/couple/* (P2-4+)
  Frost native     iOS/Android      ->  dream-os  new API endpoints (post-launch)

dream-os is the only backend. dream-wedding server.js is retiring.
dreamos-pwa is the only active frontend repo. tdw-2 is frozen reference.
Two repos. Two deploy targets. dream-os = Railway (Node). dreamos-pwa = Vercel (Next.js).
No monorepo.

---

## Surface philosophy — LOCKED

WhatsApp = PA surface. Proactive. Brief. Voice-first.
Never more than 2-3 sentences. Never lists more than 3 items.
Drops PWA link for anything visual or data-heavy.

PWA = Planner surface. Visual. Rich. Data-forward.
ActionCard + Just Do It toggle. Streaming. Suggestion chips.

Baked snapshot (LOCKED): Before every vendor agent turn, Supabase fetch populates system
prompt with invoices, schedule (30-day), enquiries, notes. Agent reads from snapshot.
Zero tool calls for reads. Writes still use tools.

---

## dreamos-pwa — current state (post P2-2, unchanged in P2-3)

GitHub: https://github.com/devjroy-dev/dreamos-pwa
Vercel: https://dreamos-pwa.vercel.app (live, shell only)
HEAD: 76ac9a4
Stack: Next.js 16, React 19, Tailwind v4, TypeScript

URL swap complete. All 69+ files point at dream-os-production via API_BASE.
Coming Soon on post-launch screens.
Six login/auth screens exist but not yet wired to dream-os auth endpoints.
Wiring happens in P2-4 alongside Block 2 endpoints.

---

## Landing page — P2-4

Landing page build is P2-4 (was P2-3 in original plan, deferred).
P2-3 built the backend infrastructure (endpoints + migrations) first.
dreamos-pwa landing page + screen wiring is the next frontend session.

Before landing page session:
- Supabase Auth JWT must be wired (Finding #11 / P2-3.a)
- Custom domains (thedreamai.in, thedreamwedding.in) still pointed at old Railway services
- Decision needed: when do we cut DNS to Vercel?

---

## Endpoint build order — Phase 2 (updated)

Block 1 Auth — COMPLETE ✅ (P2-3)
  POST /api/v2/waitlist/signup          ✅
  POST /api/v2/invite/validate          ✅
  POST /api/v2/invite/consume           ✅
  POST /api/v2/vendor/auth/send-otp     ✅
  POST /api/v2/vendor/auth/verify-otp   ✅
  POST /api/v2/vendor/auth/set-pin      ✅
  POST /api/v2/vendor/auth/pin-login    ✅
  POST /api/v2/vendor/auth/forgot-pin   ✅
  POST /api/v2/couple/auth/send-otp     ✅
  POST /api/v2/couple/auth/verify-otp   ✅
  POST /api/v2/couple/auth/set-pin      ✅
  POST /api/v2/couple/auth/pin-login    ✅
  POST /api/v2/couple/auth/forgot-pin   ✅
  POST /admin/invite-codes (mint)       ✅

Block 1 remaining:
  Supabase Auth JWT issuance in verify-otp (Finding #11)

Block 2 Vendor core:
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

## Migration status (as of P2-3)

Last applied: 0033
| # | File | Status | What it adds |
|---|---|---|---|
| 0001–0025 | (applied) | ✅ | Full history in SCHEMA.md |
| 0026 | invoices_last_payment_at.sql | ⏳ Phase 2 | invoices.last_payment_at |
| 0027 | discover.sql | ⏳ Phase 3 | couple_vendor_connections, discover_readiness |
| 0028 | pin_auth.sql | ✅ Applied 2026-05-18 | PIN columns + lockout + XOR triggers |
| 0029 | discover_preview.sql | ⏳ Phase 2 Block 2 | vendors.discover_preview boolean |
| 0030 | landing_assets.sql | ⏳ Landing page session | landing_slides, exploring_photos |
| 0031 | invite_codes.sql | ✅ Applied 2026-05-18 | invite_codes table + consume function |
| 0032 | waitlist_signups.sql | ✅ Applied 2026-05-18 | waitlist_signups table |
| 0033 | otp_sessions.sql | ✅ Applied 2026-05-18 | otp_sessions table |

Next migration when needed: 0034

---

## PWA login sequence — LOCKED

New user (invite code): invite code → phone → WhatsApp OTP → set 4-digit PIN → enter app
New user (via WhatsApp): sign in → phone → WhatsApp OTP → set 4-digit PIN → enter app
Returning user: phone → PIN → enter app (no OTP)
PIN: 4 digits, numbers only. bcrypt hash in vendors.pin_hash / couples.pin_hash. NULL = not set.
Session: Supabase Auth JWT (pending — see Finding #11).

Six screens in dreamos-pwa (exist, not yet wired):
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
6. Waitlist management UI (view/triage waitlist_signups)
7. Admin URL /mint cosmetic fix (FINDINGS_LOG #10)
8. Any accumulated admin needs

---

## Current WhatsApp agent state (0.10.0-alpha)

Vendor agent — all Phase 1 + P2-1 features working. Full tool list in ROADMAP_FINAL.
Bride agent — all Phase 1 + P2-1 features working.

Pending:
TWILIO TEMPLATES NEVER SUBMITTED. Submit at start of P2-4.
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
| Malaysian test bride | +60122687535 / couple_id 285ccb5a-01f0-4873-829c-aac66377c890 |
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
  ADMIN_PASSWORD               (rotated P2-2.a — in password manager only)
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
