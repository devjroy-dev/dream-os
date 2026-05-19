# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-19 (P2-6a session)
**Session:** P2-6a complete. 11 vendor core endpoints built + verified. 4 engine/infra bug fixes shipped. Railway upgraded to Pro with static outbound IPs on both services.
**Version:** 0.10.0-alpha (no bump — P2-6b frontend wiring needed before 0.11.0-alpha)
**HEAD (dream-os):** 2940a70 + 2 post-session commits (PDF amount_advance fixes)
**HEAD (dreamos-pwa):** 31a3b11 (unchanged this session)
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Repo backend:** https://github.com/devjroy-dev/dream-os
**Repo frontend:** https://github.com/devjroy-dev/dreamos-pwa
**Vercel:** https://dreamos-pwa.vercel.app (live)

Read this first. Then ROADMAP_FINAL.md. Then SCHEMA.md. Then API_CONTRACTS.md. Then FINDINGS_LOG.md.

---

## Phase 1 - complete (0.10.0-alpha)
## P2-1 through P2-5 - complete (2026-05-18/19)

All history in previous HANDOVER_FINAL.md commits. See git log.

---

## P2-6a - 2026-05-19 (this session)

Backend only. 11 vendor core endpoints per API_CONTRACTS.md + 4 authorized bug fixes + infrastructure hardening. dream-os repo only. dreamos-pwa not touched.

### New files

- src/api/middleware/resolveVendor.js — ownership middleware, 3 modes: JWT-only, param match, child-row via pattern
- src/api/vendor/core.js — vendor sub-router mounted at /api/v2/vendor in src/api/router.js
- src/api/vendor/me.js
- src/api/vendor/today.js
- src/api/vendor/leads.js
- src/api/vendor/clients.js
- src/api/vendor/invoices.js — includes both list endpoint AND new /pdfs sub-endpoint (Bug B)
- src/api/vendor/expenses.js
- src/api/vendor/events.js
- src/api/vendor/context.js
- src/api/vendor/chat.js

### Modified files

- src/api/router.js — mounts /vendor sub-router
- src/index.js — app.locals.anthropic; Anthropic client timeout:12000 + maxRetries:0; two-message WhatsApp delivery when attachments present
- src/agent/engine.js — channel param; attachments[] collector; record_payment reply text rewritten; sendWhatsApp channel guard; PDF amount_advance fix
- package.json — @anthropic-ai/sdk ^0.30.1 → ^0.97.0
- docs/API_CONTRACTS.md — new /vendor/invoices/:vendorId/pdfs endpoint added

### Endpoints built and verified (11 + 1 bonus)

| # | Endpoint | Notes |
|---|---|---|
| 1 | GET /api/v2/vendor/me | Profile. P2-9 stub fields null/false. |
| 2 | GET /api/v2/vendor/today/:vendorId | 7 parallel queries. Money snapshot, overdue, new leads, events. IST. |
| 3 | GET /api/v2/vendor/leads/:vendorId | State filter (default: active pipeline). Pagination. |
| 4 | PATCH /api/v2/vendor/leads/:leadId/state | State change with optional reason. Reason persists to notes table. |
| 5 | GET /api/v2/vendor/clients/:vendorId | Roster. |
| 6 | GET /api/v2/vendor/clients/:vendorId/:clientId | Detail with linked leads + invoices. Cross-tenant returns 404. |
| 7 | GET /api/v2/vendor/invoices/:vendorId | List + summary. amount_owed computed server-side. |
| 7b | GET /api/v2/vendor/invoices/:vendorId/pdfs | All invoices with generated PDFs. Sorted newest first. No pagination. |
| 8 | GET /api/v2/vendor/expenses/:vendorId | List + total_spent aggregate. |
| 9 | GET /api/v2/vendor/events/:vendorId | from/to/state/kind filters. Default today+60d. Hard cap 200. |
| 10 | GET /api/v2/vendor/context/:vendorId | Mirrors engine.js baked snapshot exactly. |
| 11 | POST /api/v2/vendor/chat | Runs same agent as WhatsApp. channel:'web' suppresses cross-surface notifications. |

### Bug fixes shipped (all founder-authorized)

**Fix A — Cross-surface WhatsApp notification leak:**
PWA-triggered tool actions were firing WhatsApp notifications (e.g. record_payment holding-pattern message). Fixed by adding `channel` parameter to `runAgenticTurn` and `executeTool`. Default `'whatsapp'` preserves existing behavior. Chat endpoint passes `channel:'web'`. The sendWhatsApp call inside record_payment is guarded by `channel === 'whatsapp'`.

**Fix B — PDF delivered as Twilio attachment not URL:**
record_payment was embedding the Supabase signed URL in the WhatsApp message body. Vendor had to tap, browser, download, re-attach, forward (~7 steps). Fixed by adding `attachments[]` collector to `runAgenticTurn`. record_payment pushes PDF URL into attachments instead of reply text. src/index.js passes attachments as Twilio mediaUrls.

**Fix C — PDF and status text as separate WhatsApp messages:**
With Fix B, the PDF and status text still traveled together — when vendor forwarded the PDF, the internal status text ("Rs X recorded against Y, balance Z") showed as caption to the client. Fixed by splitting into two consecutive WhatsApp messages: (1) PDF-only with empty body, (2) status text only. PDF is now cleanly forwardable. Status text stays in vendor's chat.

**Fix D — PDF booking amount received line missing or wrong:**
`invoicePdf.js` only renders the "Booking amount received" line when `invoice.amount_advance` is non-null. `record_payment` only updates `amount_paid`, never `amount_advance`. Result: (1) invoices created without explicit advance → line missing, (2) invoices with stale amount_advance set at creation → wrong amount shown. Fixed by always passing `newAmountPaid` as `amount_advance` to `generateInvoicePdf`. newAmountPaid is the cumulative total paid as of the current turn — always accurate.

### Infrastructure changes

- Railway upgraded from Hobby to Pro
- Static Outbound IP enabled on both dream-os and dream-wedding Railway services
- Root cause of P2-6a 529 errors: Railway's shared Amsterdam egress IPs were soft-throttled at Anthropic's API gateway (noisy-neighbor effect from other Railway tenants). Static IP gives each service a dedicated IP. Confirmed resolved — no 529s after static IP was enabled.
- Anthropic SDK upgraded: 0.30.1 → 0.97.0
- Anthropic client: timeout:12000 (prevents 10-min connection pool bomb under 529 load), maxRetries:0 (we own retry loop, not SDK)

### P2-6a commits (dream-os)

- 457c5b5 feat(p2-6a): GET /api/v2/vendor/me + resolveVendor middleware
- 67fa088 feat(p2-6a): GET /api/v2/vendor/today/:vendorId
- 2a6a27a feat(p2-6a): GET /vendor/leads + PATCH /vendor/leads/:leadId/state
- bd3cc8f feat(p2-6a): GET /vendor/clients + GET /vendor/clients/:clientId
- 3c2ae91 feat(p2-6a): GET /vendor/invoices/:vendorId
- 37a2d5d feat(p2-6a): GET /vendor/expenses/:vendorId
- 18ff044 feat(p2-6a): GET /vendor/events/:vendorId
- b1d32bc feat(p2-6a): GET /vendor/context/:vendorId
- c65c3e9 feat(p2-6a): POST /vendor/chat
- 56dda92 fix(p2-6a): suppress WhatsApp notifications when PWA initiates tool action
- 04b4b17 fix(p2-6a): deliver PDF as Twilio attachment instead of signed URL in message body
- fa5a8df fix(p2-6a): send PDF and status as separate WhatsApp messages
- 2940a70 fix(p2-6a): Anthropic client timeout+maxRetries, SDK upgrade 0.30.1→0.97.0
- (+ 2 PDF amount_advance fix commits post-session-close)

### Key design decisions locked this session

- **Typed client pattern locked:** P2-6b must build lib/api/_base.ts, lib/api/vendor.ts, lib/types/common.ts, lib/types/vendor.ts. No raw fetch() in screen components. Every contract endpoint = one exported function. Every response shape = one TypeScript interface.
- **Rip and rebuild locked:** P2-6b is not tactical editing. Legacy tdw-2 fetches are deleted, not renamed.
- **messages.media_url column now in active use:** PDF delivery stores the Supabase signed URL in messages.media_url on the PDF-only row. Previously documented as "future" in SCHEMA.md.
- **PDF booking amount:** always uses newAmountPaid at generation time, not inv.amount_advance. This is the correct source of truth.
- **channel parameter:** engine.js runAgenticTurn and executeTool both accept channel (default 'whatsapp'). All future WhatsApp-side-effect tools must be guarded by `channel === 'whatsapp'`.

---

## What is next — P2-6b

Frontend only. dreamos-pwa only. No backend changes.

Build:
1. lib/api/_base.ts — JWT attach, base URL, error handling
2. lib/api/vendor.ts — one function per vendor endpoint
3. lib/types/common.ts — shared types
4. lib/types/vendor.ts — all vendor response shapes

Then rip all legacy tdw-2 fetches from vendor screens and wire each to the typed client. Delete dropped endpoint calls per API_CONTRACTS.md dropped table.

Screens to wire:
- /vendor/today — today endpoint
- /vendor/money — invoices + expenses endpoints
- /vendor/leads — leads list + state PATCH
- /vendor/clients — clients list + detail
- /vendor/calendar — events endpoint
- /vendor/chat — chat endpoint (streaming)
- /vendor/profile — me endpoint
- "My Booking Confirmations" surface — new, consumes /invoices/:vendorId/pdfs (Bug B endpoint). P2-6b frontend should design this surface. Noted in handover per founder direction.

---

## Access model — LOCKED

Two and only two ways into the PWA:
1. Invite code (admin-minted, single-use)
2. WhatsApp onboarding (wa.me link) → Sign in path

Single front door: thedreamwedding.in for vendors AND dreamers.

---

## Product architecture — LOCKED

Four surfaces. One backend. Always.

  WhatsApp vendor  (+917982159047)  →  dream-os  src/index.js
  WhatsApp bride   (+14787788550)   →  dream-os  src/brideIndex.js
  Vendor PWA       thedreamwedding  →  dream-os  /api/v2/vendor/* (P2-6b wiring next)
  Bride PWA        thedreamwedding  →  dream-os  /api/v2/couple/* (P2-7+)
  Frost native     iOS/Android      →  dream-os  new API endpoints (post-launch)

---

## Surface philosophy — LOCKED

WhatsApp = PA surface. Proactive. Brief. Voice-first. Max 2-3 sentences.
PWA = Planner surface. Visual. Rich. Data-forward.

The vendor PWA chat tab runs the SAME agent as WhatsApp (same engine.js, same 21 tools).
Vendor can create leads, invoices, events, expenses, log payments — everything — via PWA chat.
List/card views in the PWA are for reviewing what the agent created.
The only things exclusive to WhatsApp: morning briefing (proactive push), couple routing (bride messages vendor's number), day-before reminders (cron push).

---

## dreamos-pwa — current state (post P2-5, unchanged in P2-6a)

GitHub: https://github.com/devjroy-dev/dreamos-pwa
Vercel: https://dreamos-pwa.vercel.app (live)
HEAD: 31a3b11
Stack: Next.js 16, React 19, Tailwind v4, TypeScript

Landing page: fully functional. Auth flow: working end-to-end.
Vendor home: /vendor/today shell loads. All data endpoints 404 — P2-6b not built yet.
Bride home: /couple/today shell loads. All data endpoints 404 — P2-7b not built yet.

---

## Migration status (as of P2-6a)

No new migrations this session. Last applied: 0033. Next migration when needed: 0034.
messages.media_url column is in active use as of P2-6a (PDF delivery). Was "future" in schema — now live.

| # | File | Status | What it adds |
|---|---|---|---|
| 0001–0025 | applied | ✅ | Full history in SCHEMA.md |
| 0026 | invoices_last_payment_at.sql | ⏳ P2-9 | invoices.last_payment_at |
| 0027 | discover.sql | ⏳ Phase 3 | couple_vendor_connections, discover_readiness |
| 0028 | pin_auth.sql | ✅ Applied 2026-05-18 | PIN columns + lockout + XOR triggers |
| 0029 | discover_preview.sql | ⏳ P2-9 | vendors.discover_preview boolean |
| 0030 | landing_assets.sql | ✅ Applied 2026-05-19 | landing_slides + exploring_photos + seed |
| 0031 | invite_codes.sql | ✅ Applied 2026-05-18 | invite_codes + consume function |
| 0032 | waitlist_signups.sql | ✅ Applied 2026-05-18 | waitlist_signups table |
| 0033 | otp_sessions.sql | ✅ Applied 2026-05-18 | otp_sessions table |

---

## PWA login sequence — LOCKED

New user (invite code): invite code → phone → WhatsApp OTP → set 4-digit PIN → enter app
New user (via WhatsApp): sign in → phone → WhatsApp OTP → set 4-digit PIN → enter app
Returning user: phone → PIN → enter app (no OTP)
PIN: bcrypt hash in vendors.pin_hash / couples.pin_hash. NULL = not set.
Session: Supabase Auth JWT.

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
| Vercel PWA | https://dreamos-pwa.vercel.app |
| Cloudinary | dccso5ljv |
| Anthropic workspace | dream-os (Tier 2) |

Note: Several test invoices (TDW/DEV550/02, 03, 06) have inflated amount_paid values from repeated test payments during the P2-6a 529 storm. These are testing artifacts — safe to ignore or reset via Supabase SQL Editor if clean test data is needed.

---

## Env vars

Railway (dream-os):
  TWILIO_WHATSAPP_NUMBER       whatsapp:+917982159047
  TWILIO_ACCOUNT_SID           (in Railway)
  TWILIO_AUTH_TOKEN            (in Railway)
  TDW_WA_NUMBER                917982159047
  BRIDE_WA_NUMBER              14787788550
  ANTHROPIC_API_KEY            workspace: dream-os
  GOOGLE_API_KEY               Google AI Studio
  ADMIN_PASSWORD               (in password manager only)
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
  FINDINGS_LOG.md    — append-only findings

Frozen (do not update):
  HANDOVER.md, HANDOVER_BRIDE.md — frozen at 8.5a and B3
  ROADMAP.md, ROADMAP_BRIDE.md   — frozen at 8.5a and B3
