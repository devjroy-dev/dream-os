# dream-os -- Roadmap
**Last updated:** 2026-05-14
**Current version:** 0.5.5

## Vision
WhatsApp-first chief of staff for wedding vendors.
Vendor runs their business by texting a number.
Agent remembers everything, handles routine, escalates judgment calls.
Admin layer lets Dev/Swati manage the founding cohort of 50 vendors.
Marketplace (thedreamwedding.in) surfaces curated vendors to brides.

## What's shipped

| Session | What | Version |
|---|---|---|
| 1 | WhatsApp echo bot, schema (5 tables), Railway deploy, Twilio sandbox | 0.1.0 |
| 2 | Agentic loop (Claude Haiku), note_to_self, update_conversation_state, respond_to_vendor, vendor_state + notes + pending_actions | 0.2.0 |
| 3 | Admin layer, onboarding flow (Swati greeting), conversation history, system prompt tightening, invite_vendor() | 0.3.0 |
| 4 | leads table, create_lead tool, list_leads, update_lead_state, lead/referrer distinction, post-processing commentary strip, admin leads tab | 0.4.0 |
| 5 | TDW handles (migration 0005), travel preference (migration 0006), 4-step onboarding, FIRSTNAME-PHONE3 auto-handle, three-mode couple routing, admin TDW link display | 0.5.0 |
| 5.5 | Couple-facing agent, coupleSystemPrompt, runCoupleAgenticTurn, capture_couple_lead tool, vendor summary notification | 0.5.5 |

## Decisions locked
- Model: claude-haiku-4-5-20251001 (never change without founder approval)
- Phone format: always E.164 (+918757788550)
- Schema discipline: every change through numbered migration file
- Three docs updated every session: HANDOVER.md, SCHEMA.md, ROADMAP.md
- Currency: Rs (never Rs with symbol)
- Unknown numbers: three-mode couple routing
- Admin auth: single ADMIN_PASSWORD env var
- Monorepo: backend now, web/ and discover/ added in Sessions 9+
- Routing: one shared number + TDW codes
- TDW handle format: FIRSTNAME-PHONE3 e.g. DEV-550. Auto-assigned, no vendor input needed.
- Lead dedup in Mode 2: one lead per (vendor_id, counterparty_phone), ever
- TDW_WA_NUMBER env var: parameterised, swap when +91 arrives, no code change needed
- Couple-facing agent: Haiku, collect occasion/date/city/budget, notify vendor with summary

## Session 6 -- Morning briefing + proactive triggers
**Goal:** Vendor gets a WhatsApp briefing every morning without asking.

What ships:
- Cron job: 8am IST daily per active vendor
- Format: "Morning [Name]. X open leads, Y pending replies, Z events this week."
- Overdue nudge: "You haven't replied to Preethi's enquiry in 3 days."
- Railway cron configuration
- update_routing_handle tool: vendor can change TDW handle via WhatsApp
- Twilio template submission for outbound initiated messages

Estimated time: 90 minutes

## Session 7 -- Money tools
**Goal:** Vendor logs expenses, creates invoices, tracks payments through WhatsApp.

What ships:
- Migration: invoices table, expenses table
- New tools: create_invoice, log_expense, record_payment
- Agent answers: "Who owes me money?" "What did I spend this month?"
- Admin: Money tab on vendor detail

Estimated time: 90 minutes

## Session 8.1 -- Smart model routing (Haiku -> Sonnet)
**Goal:** Route complex tasks to Sonnet, keep simple tasks on Haiku. 80/20 split.

What ships:
- Task classifier: lightweight Haiku call determines complexity
- Router in engine.js: sets MODEL based on classifier output
- Sonnet for: complex extraction, nuanced drafting, financial reasoning
- Haiku for: simple notes, greetings, status questions
- Cost tracking on messages table
- Admin: AI cost this month on vendor detail
- Onboarding gets Haiku: category normalisation (photo -> photography), graceful handling of unexpected inputs, vendor can answer multiple questions in one message
- Couple agent routing: Sonnet for long/complex enquiries, Haiku for simple ones
- Smart router applies to both vendor agent and couple agent

Estimated time: 60-90 minutes

## Session 8 -- Admin polish + +91 number live
**Goal:** Admin production-ready for 50 founding vendors.

What ships:
- +91 number live -- update TWILIO_WHATSAPP_NUMBER and TDW_WA_NUMBER env vars
- Vendor list: search + filter by status
- Bulk invite: CSV upload
- Manual onboarding_state override in admin
- Lead name-based state updates

Estimated time: 60 minutes

## Session 9 -- thedreamwedding.in Discover
**Goal:** Bride-side curated marketplace.

What ships:
- discover/ folder added to monorepo
- Next.js site on Vercel
- Vendor profile pages (public, read-only)
- Enquiry from Discover -> vendor WhatsApp thread automatically
- Reuses couple-facing agent from Session 5.5

Estimated time: 2-3 sessions

## Session 10 -- Instagram DM integration
**Goal:** Vendor connects Instagram Business account. DMs auto-route to their WhatsApp thread.

Estimated time: 2 sessions

## Session 11-12 -- thedreamai.in vendor dashboard
**Goal:** Web dashboard as read layer over WhatsApp-captured data.

## Open questions
1. +91 number -- applied, arriving soon
2. Founding cohort pricing -- free forever or free for X months?
3. Couple phone collection on Discover enquiry
4. thedreamwedding.in domain -- currently pointing where?
5. Swati's role in Discover editorial curation

## Deliberately out of scope
- iOS/Android native app
- Razorpay subscription billing (after 50 vendors proven)
- RLS (after bride-side public access needed)
- Multi-vertical (weddings first)
- Email/SMS fallback (WhatsApp only)
- One number per vendor (TDW code system solves routing)
