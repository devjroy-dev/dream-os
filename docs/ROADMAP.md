# dream-os — Roadmap
**Last updated:** 2026-05-14
**Current version:** 0.4.0

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

## Decisions locked
- Model: claude-haiku-4-5-20251001 (never change without founder approval)
- Phone format: always E.164 (+918757788550)
- Schema discipline: every change through numbered migration file
- Three docs updated every session: HANDOVER.md, SCHEMA.md, ROADMAP.md
- Currency: Rs (never ₹)
- Unknown numbers: invitation-only dead end
- Admin auth: single ADMIN_PASSWORD env var
- Monorepo: backend now, web/ and discover/ added in Sessions 9+
- Session 8.1: smart model routing Haiku→Sonnet for complex tasks
- Routing: one shared +91 number + TDW codes (not one number per vendor)
- TDW code format: TDW-[HANDLE] e.g. TDW-RAHULCLICKS or TDW-DEV-DEL
- Handle source: vendor's Instagram handle if they have one, else auto-generated (FIRSTNAME-CITY → FIRSTNAME-CATEGORY → FIRSTNAME-PHONE4)
- Instagram question in onboarding: "Are you on Instagram? If yes, share your handle." — no/skip/later/nope/anything without @ treated as skip
- Email: collected naturally whenever vendor mentions it in conversation — no dedicated onboarding step
- Routing fallback: if couple's first message doesn't start with TDW-, system replies asking for their vendor's TDW code
- Onboarding completion message (exact, locked): "Perfect — you're all set. Here's your TDW link: wa.me/91XXXXXXXXX?text=TDW-[HANDLE] — put this in your Instagram bio so couples can reach you directly. Or you just send me the messages you receive. From here just talk to me like you'd talk to a trusted assistant."

## Session 5 — Couple routing + TDW handles
**Goal:** Couples can reach vendors through the dream-os number. Vendors get their TDW link on day one.

What ships:
- Migration 0005: vendors.routing_handle (UNIQUE), vendors.instagram_handle, users.email
- Onboarding updated: 5 steps — category, city, rate, instagram handle, completion with TDW link
- Onboarding states: new → asked_category → asked_city → asked_rate → asked_instagram → complete
- Auto-handle generation when vendor skips Instagram: FIRSTNAME-CITY → FIRSTNAME-CATEGORY → FIRSTNAME-PHONE4
- Completion message sends TDW link immediately (exact wording locked above)
- Couple routing: unknown number messages dream-os → first word checked against routing_handle → vendor identified → couple thread created → vendor notified on WhatsApp
- Routing fallback message: "Hi! To reach a TDW vendor, send their TDW code — you'll find it in their Instagram bio or the link they shared."
- Admin: vendor detail shows TDW handle + copyable wa.me link
- wa.me link updated to +91 number once it arrives (currently blocked on Twilio approval)

Estimated time: 90 minutes
Blocked on: +91 number from Twilio

## Session 6 — Morning briefing + proactive triggers
**Goal:** Vendor gets a WhatsApp briefing every morning without asking.

What ships:
- Cron job: 8am IST daily per active vendor
- Format: "Morning [Name]. X open leads, Y pending replies, Z events this week."
- Overdue nudge: "You haven't replied to Preethi's enquiry in 3 days."
- Railway cron configuration

Estimated time: 60 minutes

## Session 7 — Money tools
**Goal:** Vendor logs expenses, creates invoices, tracks payments through WhatsApp.

What ships:
- Migration: invoices table, expenses table
- New tools: create_invoice, log_expense, record_payment
- Agent answers: "Who owes me money?" "What did I spend this month?"
- Admin: Money tab on vendor detail

Estimated time: 90 minutes

## Session 8.1 — Smart model routing (Haiku → Sonnet)
**Goal:** Route complex tasks to Sonnet, keep simple tasks on Haiku. 80/20 split.

What ships:
- Task classifier: lightweight Haiku call determines complexity
- Router in engine.js: sets MODEL based on classifier output
- Sonnet for: complex extraction, nuanced drafting, financial reasoning
- Haiku for: simple notes, greetings, status questions
- Cost tracking: model_used, input_tokens, output_tokens, cost_usd on messages table
- Admin: AI cost this month on vendor detail page

Estimated time: 45-60 minutes

## Session 8 — Admin polish + +91 number live
**Goal:** Admin production-ready for 50 founding vendors.

What ships:
- +91 number live — update TWILIO_WHATSAPP_NUMBER env var
- wa.me links updated from sandbox to +91 number
- Vendor list: search + filter by status
- Bulk invite: CSV upload of name + phone
- Manual onboarding_state override in admin
- Lead name-based state updates (no UUID required from vendor)

Estimated time: 60 minutes

## Session 9 — thedreamwedding.in Discover
**Goal:** Bride-side curated marketplace. Couples browse vendors, send enquiries.

What ships:
- discover/ folder added to monorepo
- Migration: discover_curation table, discover_editorial table
- Next.js site on Vercel
- Vendor profile pages (public, read-only)
- Bride can browse, no auth required
- Enquiry from Discover → vendor WhatsApp thread automatically (no TDW code needed — website handles routing)

Estimated time: 2-3 sessions

## Session 10 — Instagram DM integration
**Goal:** Vendor connects Instagram Business account. DMs auto-route to their WhatsApp thread.

What ships:
- Migration: vendor_integrations table (vendor_id, platform, access_token, instagram_user_id)
- OAuth flow: vendor connects Instagram Business account from admin panel
- Meta webhook: /webhook/instagram receives new DMs
- Auto lead creation from Instagram DMs — no manual forwarding
- Vendor WhatsApp notification: "New Instagram DM from @username: [message]. Lead created."
- Requires: Meta App with Instagram Messaging API approval (1-2 weeks)

Estimated time: 2 sessions

## Session 11-12 — thedreamai.in vendor dashboard
**Goal:** Web dashboard as read layer over WhatsApp-captured data.

What ships:
- web/ folder added to monorepo
- Leads, money, calendar as read-only views
- Built on existing dreamai design language (Frost palette, Cormorant + DM Sans)
- Re-pointed at dream-os Supabase schema
- Vendor can see everything the agent has captured — without needing to ask on WhatsApp

## Open questions
1. +91 number — applied, arriving soon. Session 5 blocked until live.
2. Founding cohort pricing — free forever or free for X months?
3. Couple phone collection on Discover enquiry
4. thedreamwedding.in domain — currently pointing where?
5. Swati's role in Discover editorial curation

## Deliberately out of scope
- iOS/Android native app (WhatsApp is the app for now)
- Razorpay subscription billing (after 50 vendors proven)
- RLS (after bride-side public access needed)
- Multi-vertical (weddings first)
- Email/SMS fallback (WhatsApp only)
- One number per vendor (TDW code system solves routing cleanly)

## TDW routing full spec (three modes — for Session 5 implementation)

When any unknown or known number messages the dream-os WhatsApp number,
the backend checks in this order:

MODE 1 — Returning couple (highest priority)
Check: does conversations table have a row with counterparty_phone = this number
and kind = 'couple_thread'?
If yes → route to that vendor's thread directly. No code needed.
This covers all repeat messages from a couple who has already connected.

MODE 2 — TDW code in first message
Check: does the first word of the message match any vendors.routing_handle?
(stored without TDW- prefix, so check first word stripped of TDW- prefix)
If yes → create couple row + conversation row with kind='couple_thread' →
notify vendor on their self-thread:
"New enquiry via TDW link. They said: [message]. Want me to draft a reply?"
Also create a lead record automatically.

MODE 3 — No code, no history (fallback)
Check: neither Mode 1 nor Mode 2 matched.
Reply to couple:
"Hi! To reach a TDW vendor, send their TDW code —
you'll find it in their Instagram bio or the link they shared."
Wait for their next message → recheck Mode 2.
If still no match after 2 attempts → dead end:
"We couldn't find that vendor. Ask them to share their TDW link directly."

## Instagram interception strategy (three surfaces)

Surface 1 — wa.me link in Instagram bio (primary)
Vendor posts: wa.me/91XXXXXXXXX?text=TDW-RAHULCLICKS
Couple taps → WhatsApp opens → TDW code pre-filled → couple hits Send.
System receives message → Mode 2 routing → vendor notified.
This is the primary couple acquisition channel for founding cohort.

Surface 2 — Instagram DM integration (Session 10)
Vendor connects their Instagram Business account via OAuth in admin panel.
Meta webhook fires on new DM → dream-os backend receives it →
identifies vendor by instagram_handle match in vendors table →
creates lead automatically → notifies vendor on WhatsApp:
"New Instagram DM from @username: [message]. Lead created."
No manual forwarding needed.
Requires: Meta App approval (1-2 weeks), vendor OAuth flow.

Surface 3 — Vendor forwards manually (always available fallback)
Vendor receives enquiry anywhere (personal WhatsApp, Instagram, email) →
forwards or pastes it to the dream-os number →
agent detects enquiry → calls create_lead → extracts structured data.
This is what's built in Session 4 and works right now.

## What cannot be intercepted (hard limits)
- Vendor's personal WhatsApp messages — end-to-end encrypted, no API exists
- WhatsApp Business App (the free app) — not the API, cannot be tapped
- Personal Instagram DMs on personal accounts — requires Business account + OAuth
- Any message not sent to the dream-os number or forwarded by the vendor

## The complete picture for a founding vendor
Day 1: vendor onboards → gets TDW link → puts it in Instagram bio
New couples: tap link → WhatsApp → TDW code → Mode 2 routing → vendor notified
Existing couples: message again → Mode 1 routing → straight to their thread
Other enquiries: vendor forwards to dream-os number → Surface 3 → lead created
Session 10: Instagram DMs automated → no forwarding needed for IG enquiries
