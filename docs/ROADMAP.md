# dream-os — Roadmap
**Last updated:** 2026-05-14
**Current version:** 0.3.0

## Vision
WhatsApp-first chief of staff for wedding vendors.
The vendor runs their business by texting a number.
The agent remembers everything, handles the routine, escalates the judgment calls.
The admin layer lets Dev/Swati manage the founding cohort.
The marketplace (thedreamwedding.in) surfaces curated vendors to brides.

## What's shipped

| Session | What | Version |
|---|---|---|
| 1 | WhatsApp echo bot, Supabase schema (5 tables), Railway deploy, Twilio sandbox | 0.1.0 |
| 2 | Agentic loop (Claude Haiku), note_to_self, update_conversation_state, respond_to_vendor tools, vendor_state + notes + pending_actions tables | 0.2.0 |
| 3 | Admin layer (login/vendors/invite/detail), onboarding flow (Swati greeting), conversation history, system prompt tightening, invite_vendor() function | 0.3.0 |

## Decisions locked (never revisit without explicit founder approval)
- Model: claude-haiku-4-5-20251001 (never Sonnet/Opus without approval)
- Phone format: always E.164 with country code (+918757788550)
- Schema discipline: every change goes through a numbered migration file
- Three docs updated every session: HANDOVER.md, SCHEMA.md, ROADMAP.md
- Currency display: Rs (never ₹ glyph)
- Vendor identity: phone number is the key, not email
- Admin auth: single password via ADMIN_PASSWORD env var (simple, no OAuth for now)
- WhatsApp number: Twilio sandbox (+14155238886, join acres-eventually) until +91 arrives
- Unknown numbers: invitation-only dead end (not open self-serve)

## Session 4 — Lead capture + action tools
**Goal:** When a vendor forwards/pastes an enquiry, the agent creates a structured lead record.

What ships:
- Migration 0004: `leads` table (vendor_id, name, phone, wedding_date, category, source, state, budget)
- New tool: `create_lead` — agent identifies an enquiry, extracts structured data, creates a leads row
- New tool: `list_leads` — agent can tell vendor "you have 3 open leads" when asked
- Admin: Leads tab on vendor detail page showing all their leads
- System prompt update: teach agent to recognise forwarded enquiries and create leads automatically
- Pricing model: update `vendor_state.pricing_policy` to support multiple packages

Estimated time: 60-90 minutes

## Session 5 — Couple-vendor thread routing
**Goal:** When a couple messages a vendor's number (via our system), the message routes to the vendor as a lead thread.

What ships:
- Couple-side conversation routing: inbound from unknown number → create couple + conversation → notify vendor
- Vendor gets WhatsApp: "New enquiry from Priya (Dec 14, photography). Want me to draft a reply?"
- Draft mode: agent drafts the reply, vendor approves with Y/N
- `pending_actions` table comes into play
- wa.me link updated to +91 number (requires +91 number to be live)

Estimated time: 90 minutes

## Session 6 — Morning briefing + proactive triggers
**Goal:** Vendor gets a WhatsApp briefing every morning without having to ask.

What ships:
- Cron job: 8am IST daily briefing per active vendor
- Briefing format: "Morning [Name]. You have X open leads, Y pending replies, Z events this week."
- Overdue follow-up nudge: "You haven't replied to Priya's enquiry in 3 days."
- Payment reminder: "Rohit's advance of Rs 50,000 is due this week."
- Railway cron configuration

Estimated time: 60 minutes

## Session 7 — Money tools
**Goal:** Vendor can log expenses, create invoices, and track payments through WhatsApp.

What ships:
- Migration: `invoices` table, `expenses` table
- New tools: `create_invoice`, `log_expense`, `record_payment`
- Agent can answer: "Who owes me money?" "What did I spend this month?"
- Admin: Money tab on vendor detail

Estimated time: 90 minutes

## Session 8 — Admin polish + invite wa.me link live
**Goal:** Admin is production-ready for managing 50 founding vendors.

What ships:
- +91 number live — update TWILIO_WHATSAPP_NUMBER env var
- wa.me link updated from sandbox to +91
- Admin vendor list: search + filter by status
- Admin: bulk invite (CSV upload of name + phone)
- Admin: manually override onboarding_state
- Admin: view vendor's notes inline on detail page (already there, polish)

Estimated time: 60 minutes

## Session 9 — thedreamwedding.in Discover (Phase 2 start)
**Goal:** Begin bride-side surface. Curated vendor marketplace.

What ships:
- Migration: `discover_curation` table, `discover_editorial` table
- thedreamwedding.in Next.js site (new Vercel project)
- Vendor profile page (public, read-only, pulls from vendors + notes + portfolio)
- Editorial curation admin: approve/feature vendors in Discover
- Bride can browse, no auth required

Estimated time: 2-3 sessions

## Open questions (need founder decision before building)
1. +91 number — which number, when does it arrive? (Session 5 blocked until this)
2. Pricing for founding cohort — free forever, or free for X months? (affects vendor_state.tier logic)
3. Couple phone number — when a couple enquires via Discover, do we collect their phone? (Session 5 architecture)
4. thedreamwedding.in domain — currently pointing where? Need to check before Session 9.
5. Swati's role in Discover curation — is she the editor, or does Dev do it? (admin permissions design)

## What deliberately is NOT in scope yet
- iOS/Android native app (far future — WhatsApp is the app for now)
- Razorpay subscription billing (after 50 vendors are live and proven)
- RLS / Row Level Security (after bride-side public access is needed)
- Multi-vertical (jewellery, lawyer, yoga) — weddings first, fully
- Circle / co-planner features (tdw-2 concept — parked until core is proven)
- Email / SMS fallback (WhatsApp is the only channel for now)
