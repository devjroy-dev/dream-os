# dream-os — Vendor Roadmap
**Last updated:** 2026-05-20 (DreamAi PWA Agent session)
**Current session:** DreamAi PWA Agent (complete)
**Current version:** 0.10.0-alpha

---

## Vision

thedreamai.in is where vendors live.

WhatsApp-first chief of staff for wedding vendors in India. Vendor runs their business by texting a number or opening a PWA. Agent remembers everything, handles routine, escalates judgment calls. Admin layer lets Dev and Swati manage the founding cohort of 50 vendors.

Vendors don't live on thedreamwedding.in. They appear there — curated, styled, earned. The vendor earns access through quality of work. Dev and Swati decide who features on Discover.

thedreamai.in (vendor) and thedreamwedding.in (bride) meet at Discover. That is the crossroads. Everything else is separate.

---

## Why we went deeper into vendor instead of moving to bride

The original roadmap had vendor pausing after Session 8 and B-sessions (bride track) starting. That plan assumed the vendor product was stable and ready for a founding cohort.

It wasn't. Three problems:

**1. The PWA had no real agent.** The WhatsApp engine was being reused for the PWA. This meant 12-second Anthropic timeouts (set for Twilio's webhook budget), the classifier running on every turn (400ms overhead), and the `respond_to_vendor` tool as the reply mechanism — which created phantom confirmation bugs where the agent confirmed actions before the DB write had completed. The PWA felt slow and untrustworthy.

**2. The agent was lying.** Three update tools (`update_event_state`, `update_lead_state`, `update_conversation_state`) all returned success when zero rows matched. The vendor would say "mark that shoot as done" and the agent would confirm it — but nothing changed. This is a founding cohort trust-destroying bug.

**3. The PWA was crashing Railway on every message.** The SSE persistence path used `.catch()` on Supabase queries — which Supabase JS v2 doesn't support. This caused an unhandled error event on the response object, Node crashed, Railway restarted. Every single vendor message caused a 15-20 second delay from the cold start. Vendors thought the agent was slow. The agent was actually finishing in under 2 seconds — Railway was the problem.

**The decision:** Fix the vendor product properly before touching the bride side. A buggy vendor product onboarded to founding cohort vendors is worse than no product. The bride side is greenfield — it can wait weeks. The vendor product has real vendors waiting.

**What "vendor done" means:** A vendor can open thedreamai.in, log in, send a message, get a response in 2-4 seconds, have the agent correctly log their data, and never see a lie or a crash. That bar is now met.

---

## The plan from here: Vendor → Polish → Bride → Convergence

### Phase 1: Vendor stable (COMPLETE as of 2026-05-20)
- Separate PWA agent engine (pwaEngine.js) — isolated from WhatsApp
- Sonnet always, no classifier overhead
- SSE streaming — replies appear word by word
- JWT refresh — sessions never expire mid-conversation
- PGRST116 fixes — agent never lies about zero-row updates
- Railway crash fix — no more restarts after every message
- Direct CRUD from list pages — no chat routing for cancel/delete
- Onboarding overlay — vendors know what DreamAi can and can't do

### Phase 2: Vendor polish (next 1-2 sessions)
What's still needed before the vendor product is truly launch-ready:

- `send_to_couple` tool — vendor can send via Twilio to couples already on TDW thread (needs migration 0034)
- `schedule_message` tool — "text Priya tomorrow morning" (needs migration 0034)
- Morning briefing Twilio template submission for +917982159047
- Razorpay KYC completion
- Twilio upgrade to paid
- Smoke test full founding cohort flow with Swati
- Admin polish (bulk invite, manual onboarding state override)

### Phase 3: Bride track (B-sessions — starts after Phase 2)
The bride side builds from scratch using the same dream-os backend, same Supabase, same repo.

B-sessions build:
- B1: Bride persistent identity (couple_id), WhatsApp agent, onboarding
- B2: Muse (save inspiration), basic planner
- B3: Circle (co-planning with partner and squad)
- B4: Journey (full wedding planning hub), Discover integration

### Phase 4: Convergence (Session 9)
Vendor and bride tracks meet at Discover. Real vendor profiles surface to brides. Enquiries carry taste profile. The marketplace is live.

---

## What's shipped

| Session | What | Version |
|---|---|---|
| 1 | WhatsApp echo bot, schema (5 tables), Railway deploy, Twilio sandbox | 0.1.0 |
| 2 | Agentic loop (Claude Haiku), note_to_self, update_conversation_state, respond_to_vendor, vendor_state + notes | 0.2.0 |
| 3 | Admin layer, onboarding flow, conversation history, system prompt tightening, invite_vendor() | 0.3.0 |
| 4 | leads table, create_lead, list_leads, update_lead_state, lead/referrer distinction | 0.4.0 |
| 5 | TDW handles, travel preference, 4-step onboarding, FIRSTNAMEPHONE3 auto-handle, three-mode couple routing | 0.5.0 |
| 5.5 | Couple-facing agent (Haiku), capture_couple_lead, admin Enquiries tab | 0.5.5 |
| 6 | events table, 5 new tools, morning briefing cron (8am IST), Twilio status callback | 0.6.0 |
| 6.5 | +917982159047 live, +14787788550 → permanent bride number, env vars updated | 0.6.5 |
| 7 (partial) | invoices table, Supabase invoices bucket, create_invoice Stage 1 | 0.7.0 |
| 8.1 | Smart model routing (classifier), cost tracking (migration 0009), smart onboarding 16 categories | 0.8.1 |
| 8.2 | Prompt caching (91% input token reduction), Gemini SDK wired | 0.8.2 |
| 8.3 | record_payment (Stage 2+3), invoicePdf.js, list_invoices, log_expense, expenses table (0010), Admin Money tab | 0.8.3 |
| 8.5 | clients table (0011), routing context (0012), resolveOrCreateClient, add_client + list_clients, lead→client promotion, multi-vendor routing, sticky disambiguation, returning-bride detection | 8.5 |
| 8.5a | Empty inbound crash fix, single-thread routing fix, TDW typo fuzzy-match | 8.5a |
| DreamAi PWA | Separate PWA engine (pwaEngine.js), SSE streaming, JWT refresh, PGRST116 fixes, Railway crash fix, cancel_invoice tool, CRUD list pages, onboarding overlay, 5 new API endpoints, WhatsApp + Call buttons on clients | 0.10.0-alpha |

---

## Session sequence (revised)

```
COMPLETE: Sessions 1–8.5a, 6.5, DreamAi PWA Agent
NEXT:     Phase 2 polish (1-2 sessions) — migration 0034, Razorpay, Twilio, admin
THEN:     B1 → B2 → B3 → B4 (bride track)
THEN:     Session 9 (convergence + Discover)
THEN:     Session 10 (Instagram DM)
THEN:     Sessions 11-12 (thedreamai.in vendor dashboard)
```

---

## Phase 2 polish — next session scope

**Migration 0034 (one migration, three features):**
- `scheduled_actions` table — for `schedule_message` tool
- `clients.hidden_at` column — for `hide_client` tool (soft delete via chat)
- Any other deferred schema items

**New PWA tools (after migration 0034):**
- `send_to_couple` — Twilio send to existing TDW-thread couples (PATCH, channel-gated to PWA only)
- `schedule_message` — writes to scheduled_actions, cron picks up
- `hide_client` — sets hidden_at, filters from list_clients

**Infrastructure:**
- Razorpay KYC
- Twilio upgrade to paid
- Morning briefing template submission for +917982159047

**Admin:**
- Vendor list: search + filter by status
- Bulk invite: CSV upload
- Manual onboarding_state override

---

## Session 9 — Convergence + Discover

Prerequisites: B1-B4 complete. Bride has persistent couple_id, Muse, Circle, planner.

What ships:
- Discover at thedreamwedding.in/discover
- Real dream-os vendor profiles surfaced to brides
- Enquiry from Discover carries couple_id + taste profile
- Vendor notification includes Muse match context
- Swati editorial curation layer in admin (vendors.discover_eligible toggle)
- Silent onboarding for brides arriving via TDW wa.me link
- Sonnet routing for couple agent in multi-vendor scenarios

---

## Session 10 — Instagram DM integration

Vendor connects Instagram Business account. DMs auto-route to their WhatsApp thread.
Note: Meta App Review required (2-4 weeks). Submit early.

---

## Sessions 11-12 — thedreamai.in vendor dashboard

Web dashboard as read layer. tdw-2 vendor-side retires permanently.

---

## Decisions locked

**Architecture:**
- Two products: thedreamai.in (vendors) + thedreamwedding.in (brides). Meet at Discover.
- Same repo: devjroy-dev/dream-os. Two Railway services. One Supabase project.
- +917982159047 = vendors. +14787788550 = brides. Permanent.
- Discover at thedreamwedding.in. Vendors have no login there.
- tdw-2 vendor-side retires Sessions 11-12. Bride PWA shell reused from B1.

**Agent models (never change without founder approval):**
- WhatsApp vendor agent: claude-haiku-4-5-20251001 (or Sonnet via classifier)
- PWA vendor agent: claude-sonnet-4-6 always
- Bride agent: claude-haiku-4-5-20251001 always
- Gemini Flash-Lite: retrieval only, never main agent

**PWA agent isolation rule:**
- pwaEngine.js, pwaTools.js, pwaSystemPrompt.js are completely separate from engine.js
- Never modify WhatsApp files in PWA sessions. Never modify PWA files in WhatsApp sessions.

**Supabase query rule (permanent — caused Railway crash):**
- Never use `.catch()` on Supabase queries
- Always use `{ error }` destructuring or try/catch

**Schema:**
- Every schema change: numbered migration file in db/migrations/
- Bride migrations continue vendor sequence from 0031+
- One migration history. One DB.

**Vendor conventions:**
- Phone format: E.164
- Currency: Rs (never ₹)
- TDW handle: FIRSTNAMEPHONE3 e.g. DEV550
- Invoice number: prefix/counter-padded-to-2 e.g. TDW/DEV550/01
- Invoice states: unpaid / advance_paid / paid / cancelled
- Lead states: new / contacted / quoted / booked / lost
- Event states: upcoming / done / cancelled

---

## Open questions

1. Event conflict detection threshold — exact date? Within +/-2 hours? Same day? Decide before admin polish session.
2. Founding cohort pricing — free forever vs free for X months. Open.
3. Instagram App Review entity — personal or business entity? Decide before Session 10 prep.
4. Railway region (EU West) vs Supabase (Mumbai) — 150-200ms latency. Move before scaling beyond 50 vendors.
5. Past Client Discount Loop entry threshold — currently 10 clients for first 10% off. Consider lowering to 5 for early momentum. Raise in every business model discussion.

