# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-18 (P2-1 session)
**Session:** P2-1 complete. All AI lifts done and phone-tested. WhatsApp PA now matches DreamAI v3 quality.
**Version:** 0.10.0-alpha (no bump — P2-1 is mid-Phase 2, no PWA live yet)
**HEAD:** 7246696
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Repo backend:** https://github.com/devjroy-dev/dream-os
**Repo frontend:** https://github.com/devjroy-dev/dreamos-pwa (created this session)

Read this first. Then ROADMAP_FINAL.md. Then SCHEMA.md.

---

## Phase 1 — complete (0.10.0-alpha)

All sessions P1-1 through P1-5 done. PWA-0 planning session done. P2-1 done.
See previous handovers for history. Not repeated here.
See that commit's HANDOVER_FINAL.md for full Phase 1 session history. Not repeated here.

---

## PWA-0 — 2026-05-18 (planning only, previous session)

All Phase 2 architecture decisions locked. See PWA-0 handover (commit 27833d6) for full decisions.

---

## P2-1 — 2026-05-18 (this session)

All AI lifts completed and phone-tested. WhatsApp vendor PA and bride agent now match DreamAI v3 quality.
Migration 0025 (hot_dates) applied to Supabase.

### Commits this session (oldest to newest)
- 5751a8b feat(agent): P2-1 lift 1 — baked snapshot system prompt
- 5df85b3 feat(agent): P2-1 lift 2 — query_day tool
- 8ecf037 feat(agent): P2-1 lift 3 — hot_dates_context tool + migration 0025
- d39e526 feat(agent): P2-1 lifts 4-6 — draft-before-send, multi-option destructive, PWA link pattern
- 903670a fix(agent): disambiguate client name before draft-before-send
- 2650185 feat(bride): P2-1 bride lifts B1-B4
- ab03ad2 fix(bride): always offer day-before reminder after trial/fitting/ceremony
- 629a138 feat(agent): lift 3 remaining DreamAI v3 rules
- 7246696 fix(agent): extend snapshot event window from 14 to 30 days

---

## Product architecture — LOCKED

Four surfaces. One backend. Always.

```
WhatsApp vendor  (+917982159047)  ->  dream-os  src/index.js
WhatsApp bride   (+14787788550)   ->  dream-os  src/brideIndex.js
Vendor PWA       thedreamai.in    ->  dream-os  new API endpoints
Bride PWA        thedreamwedding  ->  dream-os  new API endpoints
Frost native     iOS/Android      ->  dream-os  new API endpoints (post-launch)
```

dream-os is the only backend. dream-wedding server.js is retired.
dreamos-pwa is the only active frontend repo. tdw-2 is frozen reference.
Two repos. Two deploy targets. dream-os = Railway (Node). dreamos-pwa = Vercel (Next.js).
No monorepo.

---

## Surface philosophy — LOCKED

### WhatsApp = PA surface

Proactive. Brief. Voice-first. Never more than 2-3 sentences. Never lists more than 3 items.
Drops PWA link for anything visual or data-heavy.

Vendor: speaks in their ear. Captures, alerts, drafts client messages, answers instantly.
Bride: BFF voice. Saves to Muse, plans through chat, emotionally intelligent.

### PWA = Planner surface

Visual. Rich. Data-forward.
Vendor: leads, calendar, money, threads. DreamAI chat with ActionCard + Just Do It toggle.
Bride: Muse board, Circle, Journey, Discover. DreamAI chat with confirm cards.
Streaming responses. Suggestion chips.

### Baked snapshot — LOCKED

Before every WhatsApp vendor agent turn, a parallel Supabase fetch populates system prompt:
- Outstanding invoices (name, amount owed, due date)
- Today's schedule (time, client, location)
- This week's upcoming events
- Pending enquiries (name, date, budget, one line each)
- Recent notes (last 3)

Agent answers read questions from snapshot. Zero tool calls for reads.
Writes still use tools. Makes the PA feel genuinely informed before vendor types.
Implementation: buildVendorSnapshot(supabase, vendorId) at turn start.

---

## dreamos-pwa — created this session

GitHub: https://github.com/devjroy-dev/dreamos-pwa
Stack: Next.js 16, React 19, Tailwind v4, TypeScript
Source: Copied from tdw-2/web/. tdw-2 frozen, dreamos-pwa is active.
Status: Created, cleaned, pushed to GitHub. Not yet pointed at dream-os. Not on Vercel.
Deploy target: Vercel (separate from dream-os Railway).

Vendor PWA three-mode architecture (LOCKED):
Pill: BUSINESS / AI / DISCOVERY

  BUSINESS mode  -> TODAY, CLIENTS, MONEY, STUDIO
  AI mode        -> full screen chat, no chrome
  DISCOVERY mode -> Coming soon placeholder (activates Phase 3)

TODAY is home screen. Curated dashboard (needs attention, schedule, money snapshot).
STUDIO has sub-pages: calendar, analytics, broadcast, settings, referrals, team.
Calendar lives in STUDIO, not at top level.

Bride PWA structure (LOCKED, from tdw-2/web/app/couple/):
Pill: PLAN / ✦ / DISCOVER (gold ✦ = DreamAi full screen chat mode)
  PLAN mode     -> TODAY, PLAN, CIRCLE
  ✦ mode        -> full screen DreamAi chat, no chrome
  DISCOVER mode -> MUSE, FEED, MESSAGES
  No FAB. Consistent with vendor three-mode pattern.

Coming soon pattern (LOCKED):
Any unbuilt screen shows: "Coming soon - your data is safe with us."
No apology. No error. A signal. Screens light up as endpoints are built.

---

## dreamos-pwa landing page — deferred session

Landing page (thedreamwedding.in / thedreamai.in) is a dedicated session, NOT part of endpoint wiring.
Before that session: discuss and decide waitlist flow (form vs WhatsApp redirect).
No open access. Waitlist-gated. Locked.

What to lift from tdw-2 landing page:
- Full-bleed background slideshow with crossfade
- Motto line and glass panel aesthetic
- Dot selector, gold button, ghost button components
- "Just Exploring" blind swipe experience
- Public Discover feed (unauthenticated vendor browsing)

What to build fresh:
- Login/invite sequence (phone -> WhatsApp OTP -> PIN, not invite code flow)
- Waitlist form design (TBD at landing page session)

---

## DreamAI v3 lifts — P2-1 (completed this session)

Six lifts from dream-wedding vendor agent into dream-os. Backend only.
Files: src/agent/systemPrompt.js, src/agent/tools.js, src/agent/engine.js.

1. Baked snapshot system prompt
2. query_day tool — single-date lookup: events, invoices, leads for that date
3. hot_dates_context tool — Vivah Muhurat dates 2026/2027
4. Draft-before-send instruction — client messages drafted first, vendor approves
5. Multi-option response for destructive actions — offer options before executing
6. pending_invoices_more PWA link pattern — top 3 inline, rest at thedreamai.in/money

After these six, WhatsApp PA achieves tdw-2 PWA chat quality on WhatsApp.

Bride agent lifts (same session alongside vendor). All phone-tested:
- B1: Confirm before mutations — "Just to confirm — recording Rs 50k against Sabya. Yes?"
- B2: Follow-up after completing — offer one natural next step. Trial/fitting/ceremony always gets day-before reminder offer.
- B3: Contact vendor drafting — drafts forwadable WhatsApp message, does not send itself.
- B4: Clarify before acting — one question when genuinely ambiguous (e.g. second trial detected).

---

## Endpoint build order — Phase 2

Block 1 Auth (must be first):
  POST /api/v2/vendor/auth/send-otp
  POST /api/v2/vendor/auth/verify-otp
  POST /api/v2/couple/auth/send-otp
  POST /api/v2/couple/auth/verify-otp

Auth LOCKED: phone -> WhatsApp OTP -> PIN 4 digits -> session.
Vendor OTP on +917982159047. Bride OTP on +14787788550.

Block 2 Vendor core:
  GET  /api/v2/vendor/today/:vendorId
  GET  /api/v2/dreamai/vendor-context/:vendorId
  POST /api/v2/dreamai/chat (vendor PWA AI, channel=web)
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

Block 5 Retire dream-wedding Railway:
  After all screens confirmed on dream-os endpoints.

---

## New vendor WhatsApp tools — Phase 2

list_expenses      Filterable date/category/client. Returns list + sum.
query_day          Events, invoices, leads for a specific date.
hot_dates_context  Vivah Muhurat dates 2026/2027.
update_event       Full edit: reschedule, rename, time change.
delete_event       Remove from calendar.
delete_lead        Remove spam/duplicate.
update_client      Fix name, phone, notes.
delete_client      Remove duplicate entry.
cancel_invoice     Mark cancelled if no payments recorded.
update_expense     Fix amount, category, client link.
delete_expense     Remove erroneous log.

Dropped: list_payments. Cash-heavy market, opt-in logging, list_invoices sufficient.

PWA-only AI features (not WhatsApp):
ActionCard pattern, Just Do It toggle, suggestion chips, streaming responses.

---

## Migration decisions this session

Convention change: letter suffixes dropped. Clean integers only.

0024  vendor_profile.sql             Phase 2 start (pending)
0025  hot_dates.sql                  Phase 2 — APPLIED 2026-05-18
0026  invoices_last_payment_at.sql   Phase 2 (pending)
0027  discover.sql                   Phase 3 (pending)

Admin panel for hot_dates management (add/edit/delete Muhurat dates) — Phase 2 addition.
Swati/Dev can update without touching Supabase directly.

---

## What is NOT being built

list_payments WhatsApp tool   Dropped. Cash-heavy. list_invoices sufficient.
Full payments table           Post-launch. 0025 adds last_payment_at as insurance only.
Tax / GST tools               Post-launch. Trigger: cohort confirmed Rs 20L+ turnover.
React Native new build        Post-launch. Frost native connects to dream-os endpoints.
Monorepo                      Two repos. Separate deploy targets.
dream-wedding backend         Retire. Never touch again.
Landing page login/invite      Build fresh. phone -> WhatsApp OTP -> PIN. Not lifted from tdw-2.
Landing page waitlist form     TBD at landing page session. No open access. Locked.

---

## Reference repos — frozen

tdw-2          Frozen. Native app reference. Design source of truth. Frost design system.
dream-wedding  Frozen, retiring. DreamAI v3 reference. Lift patterns only.
dreamai        Frozen. Vendor chat PWA UI reference.

---

## Current state — vendor WhatsApp (0.10.0-alpha)

All Phase 1 tools working. Morning briefing 8am IST. Prompt caching 91%.
Full list in previous handover (HEAD 2de8db9).

Pending (carried from Phase 1):
⚠ Twilio templates: NEVER SUBMITTED. Both numbers. Submit immediately.
  dream_os_morning_briefing on +917982159047
  dream_wedding_morning_nudge on +14787788550
⚠ Surprise Me: pending phone test (Google billing block).
⚠ factual_search: pending phone test (same block).
⚠ Morning nudge first fire: pending next 8am IST.
⚠ New vendor tools (update_event, delete_event, delete_lead etc): defined in roadmap, NOT YET BUILT in code.
  Phase 2 scope — build alongside PWA endpoint work.

---

## Test credentials

Vendor WhatsApp          +917982159047
Bride WhatsApp           +14787788550
Test vendor (Dev)        +918757788550, UUID 2eb5d3fb-31eb-4b26-859a-cf10ae477d53, DEV550
Test vendor (Swati)      SWATI978, UUID e036ea4d-3f9a-4ec5-ba89-a5defa3a042b
Test bride (Swati)       +919888294440, couple_id 7abccc1b-0698-43ba-9709-c6a1e52af789
Test bride (Meha)        +919625759924
Malaysian test bride     +60122687535, couple_id 285ccb5a-01f0-4873-829c-aac66377c890
Supabase                 nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
Railway vendor           https://dream-os-production.up.railway.app
Railway bride            https://dream-wedding-production-6cef.up.railway.app
Admin                    https://dream-os-production.up.railway.app/admin
Google Cloud             dream-os (gen-lang-client-0017514064) dev@thedreamwedding.in
Cloudinary               dccso5ljv
Anthropic workspace      dream-os

---

## Railway env vars

TWILIO_WHATSAPP_NUMBER   whatsapp:+917982159047
TDW_WA_NUMBER            917982159047
BRIDE_WA_NUMBER          14787788550
ANTHROPIC_API_KEY        workspace: dream-os
GOOGLE_API_KEY           Google AI Studio, dev@thedreamwedding.in
ADMIN_PASSWORD           admin login
SUPABASE_URL             nvzkbagqxbysoeszxent
SUPABASE_SERVICE_ROLE_KEY  service_role, never expose

---

## Document discipline

Active (updated every session):
HANDOVER_FINAL.md  this file. Fully rewritten each session.
ROADMAP_FINAL.md   single active roadmap.
SCHEMA.md          unified schema reference.

Frozen (do not update):
HANDOVER.md, HANDOVER_BRIDE.md  frozen at 8.5a and B3
ROADMAP.md, ROADMAP_BRIDE.md    frozen at 8.5a and B3
B1_SPEC.md                      historical spec

Session not complete until all three active docs committed and pushed.
