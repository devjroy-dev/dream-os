# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-18 (P2-2 session)
**Session:** P2-2 complete. dreamos-pwa URL swap done. Shell live on Vercel. Coming Soon applied.
**Version:** 0.10.0-alpha (no bump — P2-2 is mid-Phase 2, no auth or endpoints yet)
**HEAD (dream-os):** 25ab58e
**HEAD (dreamos-pwa):** 76ac9a4
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Repo backend:** https://github.com/devjroy-dev/dream-os
**Repo frontend:** https://github.com/devjroy-dev/dreamos-pwa
**Vercel:** https://dreamos-pwa.vercel.app (live, smoke-tested 2026-05-18)

Read this first. Then ROADMAP_FINAL.md. Then SCHEMA.md. Then FINDINGS_LOG.md.

---

## Phase 1 — complete (0.10.0-alpha)

All sessions P1-1 through P1-5 done. PWA-0 planning done. P2-1 done. P2-2 done.
See commit 25ab58e HANDOVER_FINAL.md for full Phase 1 and P2-1 session history.

---

## P2-2 — 2026-05-18 (this session)

dreamos-pwa URL swap complete. Shell live on Vercel. Coming Soon applied to post-launch screens.
No backend changes. No schema changes. No migrations. dream-os Railway untouched.

### What was built

dreamos-pwa repo — 12 commits (oldest to newest):
- f019311 feat(pwa): P2-2 step 1 — add lib/api.ts shared API_BASE export
- 8488223 feat(pwa): P2-2 step 2 — admin URL swap (23 files use API_BASE)
- 8e5296b feat(pwa): P2-2 step 3 — vendor PWA URL swap (22 files use API_BASE)
- fc61802 feat(pwa): P2-2 step 4 — couple/bride PWA URL swap (16 files use API_BASE)
- 97300bf feat(pwa): P2-2 step 5 — shared/root URL swap (8 files, URL swap phase complete)
- 59c936b chore(pwa): commit auto-generated tsconfig.json (required for Vercel build)
- d4c180d feat(pwa): P2-2 step 6 — Coming Soon on post-launch studio screens + TAX tab
- d55a7f9 fix(pwa): replace broken @/ alias with relative path in couple/discover/feed
- b032524 fix(pwa): replace API+ string concat with API_BASE+ (missed by Writer 3/4)
- 097c3d1 fix(pwa): remove orphaned DreamAiFAB.tsx (replaced by three-mode pill per roadmap)
- e1025f0 fix(pwa): delete Discovery.BACKUP.tsx — backup file causes build error
- 76ac9a4 fix(pwa): replace @/ alias with relative path in Discovery.tsx

### URL swap — complete

All 69+ files that previously hardcoded dream-wedding-production-89ae.up.railway.app
now import API_BASE from lib/api.ts. Zero hardcoded old URLs remain.

lib/api.ts — the single source of truth:
  export const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE
    || 'https://dream-os-production.up.railway.app';

Vercel env var: NEXT_PUBLIC_API_BASE = https://dream-os-production.up.railway.app
Set for Production and Preview environments.

Special cases handled:
- app/coplanner/CircleSessionContext.tsx: re-export shim — export { API_BASE as API }
  preserves backward compat with 7 importing coplanner files. Cleanup in Phase 3 hygiene.
  See FINDINGS_LOG.md finding #5.
- app/api/razorpay/route.ts: server-side file, env-var-with-fallback pattern kept.
  Only fallback URL swapped to dream-os-production.
- Inline literal URLs (string concat API + '/path' not template literals) — fixed in
  second pass by Claude Code after first Vercel deploy revealed the gap. See FINDINGS_LOG #9.

### Coming Soon screens — applied

Five vendor studio sub-pages replaced with Coming Soon (post-launch features):
- app/vendor/studio/analytics/page.tsx — Discovery analytics (Phase 3)
- app/vendor/studio/broadcast/page.tsx — Bulk messaging (post-launch)
- app/vendor/studio/contracts/page.tsx — Contracts (post-launch)
- app/vendor/studio/referrals/page.tsx — Referrals (post-launch)
- app/vendor/studio/team/page.tsx — Team management (post-launch)

Inline Coming Soon on TAX tab only in app/vendor/money/page.tsx.
INVOICES, EXPENSES, PAYMENTS tabs untouched and functional.

Coming Soon text (canonical, locked): "Coming soon — your data is safe with us."
Design: Cormorant Garamond italic, #888580, centered vertically on screen.

NOT touched: studio/page.tsx (nav), calendar, settings, discovery-preview.

### dreamos-pwa technical state

- Framework: Next.js 16.2.3, React 19, Tailwind v4, TypeScript
- Build: passes cleanly (next build zero errors as of HEAD 76ac9a4)
- Deploy: Vercel, auto-deploy on push to main
- tsconfig.json: committed (required for Vercel)
- DreamAiFAB.tsx: deleted (orphaned, not imported anywhere, replaced by three-mode pill)
- Discovery.BACKUP.tsx: deleted (backup file was causing build error)
- Relative imports: all lib/api imports use relative paths (e.g. ../../../lib/api)
  NOT @/lib/api — tsconfig has no paths config. See FINDINGS_LOG #3 and #5.

### P2-2.a — deferred (do before P2-3)

Railway outage during this session (May 18 06:37-06:52 UTC) prevented live password rotation.
Two actions needed before P2-3 begins:
1. Rotate ADMIN_PASSWORD in Railway dream-os service Variables tab.
   Old value is in public git history on dreamos-pwa repo.
   New value: generate 24-char random, store in password manager only.
2. Confirm deployment 25ab58e (docs-only, failed during outage) is redeployed or
   superseded by a new code commit so Railway is running current code.

### Security findings from P2-2 — full list in FINDINGS_LOG.md

Admin password hardcoded in 25 files in dreamos-pwa (public repo). Option A taken:
acknowledge, rotate Railway secret, defer code cleanup to admin session.
See FINDINGS_LOG.md for complete inventory of all 9 findings.

---

## Product architecture — LOCKED

Four surfaces. One backend. Always.

  WhatsApp vendor  (+917982159047)  ->  dream-os  src/index.js
  WhatsApp bride   (+14787788550)   ->  dream-os  src/brideIndex.js
  Vendor PWA       thedreamai.in    ->  dream-os  new API endpoints (P2-4+)
  Bride PWA        thedreamwedding  ->  dream-os  new API endpoints (P2-4+)
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
Vendor: speaks in their ear. Captures, alerts, drafts, answers instantly.
Bride: BFF voice. Saves to Muse, plans through chat, emotionally intelligent.

PWA = Planner surface. Visual. Rich. Data-forward.
Vendor: leads, calendar, money, threads. DreamAI chat with ActionCard + Just Do It toggle.
Bride: Muse board, Circle, Journey, Discover. DreamAI chat with confirm cards.
Streaming responses. Suggestion chips.

Baked snapshot (LOCKED): Before every vendor agent turn, Supabase fetch populates system
prompt with invoices, schedule (30-day), enquiries, notes. Agent reads from snapshot.
Zero tool calls for reads. Writes still use tools.

---

## dreamos-pwa — current state (post P2-2)

GitHub: https://github.com/devjroy-dev/dreamos-pwa
Vercel: https://dreamos-pwa.vercel.app (live)
Stack: Next.js 16, React 19, Tailwind v4, TypeScript

Vendor PWA three-mode architecture (LOCKED):
  Pill: BUSINESS / AI / DISCOVERY
  BUSINESS: TODAY, CLIENTS, MONEY, STUDIO
  AI: full screen chat, no chrome
  DISCOVERY: Phase 3 — Discover preview endpoint (needs 0024+0029 first)

STUDIO sub-pages:
  calendar          built (dream-os has event tools)
  settings          built
  discovery-preview built (Phase 2 endpoint pending)
  analytics         COMING SOON (Phase 3)
  broadcast         COMING SOON (post-launch)
  contracts         COMING SOON (post-launch)
  referrals         COMING SOON (post-launch)
  team              COMING SOON (post-launch)

MONEY tabs:
  INVOICES          built
  EXPENSES          built
  PAYMENTS          built
  TAX               COMING SOON (post-launch — GST/TDS)

Bride PWA three-mode architecture (LOCKED):
  Pill: PLAN / gold-star / DISCOVER
  PLAN: TODAY, PLAN, CIRCLE
  gold-star: full screen DreamAi chat, no chrome
  DISCOVER: MUSE, FEED, MESSAGES
  No FAB.

Coming soon pattern (LOCKED): "Coming soon — your data is safe with us."

All screens handle empty/error states gracefully (silent catch, skeleton shimmer).
Login/PIN screens exist but not yet wired to dream-os auth. Rebuilt in P2-3.

---

## dreamos-pwa landing page — P2-3

Landing page session is P2-3. Decide waitlist flow first.
Custom domains (thedreamai.in, thedreamwedding.in) not yet pointed at Vercel.
Currently pointed at old Railway services until P2-3 landing page is live.

---

## Endpoint build order — Phase 2

Block 1 Auth:
  POST /api/v2/vendor/auth/send-otp
  POST /api/v2/vendor/auth/verify-otp
  POST /api/v2/couple/auth/send-otp
  POST /api/v2/couple/auth/verify-otp

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

Block 5: Retire dream-wedding Railway after all screens confirmed on dream-os.

---

## Migration status

Last applied: 0025
0024  vendor_profile.sql             Phase 2 start (pending)
0025  hot_dates.sql                  APPLIED 2026-05-18
0026  invoices_last_payment_at.sql   Phase 2 (pending)
0027  discover.sql                   Phase 3 (pending)
0028  pin_auth.sql                   Phase 2 Block 1 (pending)
0029  discover_preview.sql           Phase 2 Block 2 (pending)
0030  landing_assets.sql             Landing page session (pending)

---

## PWA login sequence — LOCKED

New user (invite code): invite code -> phone -> WhatsApp OTP -> set PIN -> enter app
New user (via WhatsApp): sign in -> phone -> WhatsApp OTP -> set PIN -> enter app
Returning user: phone -> PIN -> enter app (no OTP)
PIN: bcrypt hash in vendors.pin_hash / couples.pin_hash. NULL = not set yet.
Session: Supabase Auth JWT.
Six screens built fresh (not yet wired to dream-os auth — rewired in P2-3):
  /vendor/login, /vendor/pin, /vendor/pin-login
  /couple/login, /couple/pin, /couple/pin-login

---

## Discover preview — Phase 2

Bride FEED: 4-5 founding vendors. Pure view. No enquire button.
Vendor DISCOVERY: own profile preview. Pure view.
Endpoint: GET /api/v2/discover/preview (WHERE discover_preview=true). No auth.
Requires 0024 + 0029 applied first. Swati seeds manually.

---

## Post-Phase 2 admin session — full scope

1. hot_dates panel
2. Just Explore management (exploring_photos)
3. Cover photo management (landing_slides)
4. Discover preview management
5. Admin password rotation + rebuild admin pages server-side (see FINDINGS_LOG #1)
6. Any accumulated admin needs

---

## Current WhatsApp agent state (0.10.0-alpha)

Vendor agent — all Phase 1 + P2-1 features working. Full tool list in P2-1 handover.
Bride agent — all Phase 1 + P2-1 features working.

Pending:
TWILIO TEMPLATES NEVER SUBMITTED. Submit at start of P2-3.
  dream_os_morning_briefing on +917982159047
  dream_wedding_morning_nudge on +14787788550
Surprise Me / factual_search: pending phone test (Google billing block).
New vendor tools from P2-1 roadmap: NOT YET IN CODE. Build in P2-4+.

---

## Test credentials

Vendor WhatsApp          +917982159047
Bride WhatsApp           +14787788550
Test vendor (Dev)        +918757788550 / UUID 2eb5d3fb-31eb-4b26-859a-cf10ae477d53 / DEV550
Test vendor (Swati)      SWATI978 / UUID e036ea4d-3f9a-4ec5-ba89-a5defa3a042b
Test bride (Swati)       +919888294440 / couple_id 7abccc1b-0698-43ba-9709-c6a1e52af789
Test bride (Meha)        +919625759924
Malaysian test bride     +60122687535 / couple_id 285ccb5a-01f0-4873-829c-aac66377c890
Supabase                 nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
Railway vendor           https://dream-os-production.up.railway.app
Railway bride            https://dream-wedding-production-6cef.up.railway.app
Admin                    https://dream-os-production.up.railway.app/admin
Vercel PWA               https://dreamos-pwa.vercel.app
Cloudinary               dccso5ljv
Anthropic workspace      dream-os

---

## Env vars

Railway (dream-os):
  TWILIO_WHATSAPP_NUMBER       whatsapp:+917982159047
  TDW_WA_NUMBER                917982159047
  BRIDE_WA_NUMBER              14787788550
  ANTHROPIC_API_KEY            workspace: dream-os
  GOOGLE_API_KEY               Google AI Studio, dev@thedreamwedding.in
  ADMIN_PASSWORD               ROTATE before P2-3 (see P2-2.a above)
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
  FINDINGS_LOG.md    — append-only out-of-scope findings (NEW in P2-2)

Frozen (do not update):
  HANDOVER.md, HANDOVER_BRIDE.md  frozen at 8.5a and B3
  ROADMAP.md, ROADMAP_BRIDE.md    frozen at 8.5a and B3

Session not complete until all four active docs committed and pushed.

Working rule 14: At session start, after reading docs, Claude briefs founder on what
the session will build — one thing at a time — and waits for explicit confirmation
before writing any code.
