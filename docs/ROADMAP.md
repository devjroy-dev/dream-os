# dream-os -- Roadmap
**Last updated:** 2026-05-15
**Current version:** 0.8.2-alpha

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
| 5 | TDW handles (migration 0005), travel preference (migration 0006), 4-step onboarding, FIRSTNAMEPHONE3 auto-handle, three-mode couple routing, admin TDW link display | 0.5.0 |
| 5.5 | Couple-facing agent (Haiku), capture_couple_lead, name last, past date fix, phone in list_leads, admin Enquiries tab, TDW handle deflection, draft reply blocked | 0.5.5 |
| 6 | events table (migration 0007), 5 new tools (create_event, list_events, update_event_state, update_routing_handle, get_my_tdw_link), morning briefing cron (8am IST), Twilio status callback, sendWhatsApp refactor, ? strip fix, invite page fix | 0.6.0 |
| 7 (partial) | invoices table (migration 0008), Supabase invoices bucket, pdfkit + qrcode installed, create_invoice tool (Stage 1 text only), format.js + invoiceMessage.js, Railway auto-deploy fix | 0.7.0-alpha |
| 8.1 | Smart model routing (Haiku→Sonnet classifier), cost tracking on messages (migration 0009), smart onboarding (16-category taxonomy, style_notes, city skip), admin AI cost display, version health check fix | 0.8.1-alpha |
| 8.2 | Prompt caching (91% input token reduction), engine.js hotfix, Gemini SDK wired (groundedSearch.js, retrieval-only), GOOGLE_API_KEY in Railway, UNIT_ECONOMICS updated | 0.8.2-alpha |

## Session sequence (confirmed by founder 2026-05-15)
6.5 (on +91 arrival, jumps queue) → 8.3 → 8.5 → 8 → 9 → 10 → 11-12

## Decisions locked
- Model: claude-haiku-4-5-20251001 (never change without founder approval)
- Model: claude-sonnet-4-6 (never change without founder approval — added Session 8.1)
- Phone format: always E.164 (+918757788550)
- Schema discipline: every change through numbered migration file
- Four docs updated every session: HANDOVER.md, SCHEMA.md, ROADMAP.md, UNIT_ECONOMICS.md (Dev's reference only — no other session amends it)
- Currency: Rs (never Rs with symbol)
- Unknown numbers: three-mode couple routing
- Admin auth: single ADMIN_PASSWORD env var
- Monorepo: backend now, web/ and discover/ added in Sessions 9+
- Routing: one shared number + TDW codes
- TDW handle format: FIRSTNAMEPHONE3 e.g. DEV550. Auto-assigned, no vendor input needed.
- wa.me link format: wa.me/14787788550?text=TDW-DEV550
- Lead dedup in Mode 2: one lead per (vendor_id, counterparty_phone), ever
- TDW_WA_NUMBER env var: parameterised, swap when +91 arrives, no code change needed
- Couple-facing agent: Haiku always, narrow scope (TDW routing + lead capture only)
- Morning briefing: node-cron inside Express, 8am IST, 24h window check, skip-if-closed
- Events kind values: shoot / call / meeting / task / reminder / recce / other (CHECK constraint)
- Morning briefing: template submission deferred to Session 6.5 pending +91 WABA confirmation
- Invoice number format: <invoice_prefix>/<counter padded to 2>. e.g. TDW/DEV550/01
- Invoice prefix: editable by vendor, defaults to TDW/<routing_handle> on first invoice
- Invoice counter: never resets on prefix change. Gaps are accountant-safe.
- Invoice state machine: unpaid / advance_paid / paid / cancelled
- Invoice duplicate check: soft prompt, surfaces existing leads + invoices, never hard blocks
- Invoice description: vendor's words verbatim, capitalised, prefixed "For:". Skipped if not given.
- UPI QR: lives inside Stage 2 PDF only. No standalone QR generator.
- Invoices link to leads in v1. Clients table (Session 8.5) adds client_id FK alongside lead_id.
- Clients model: promotion trigger = advance paid OR vendor directly adds client. Session 8.5.
- Lead dedup (upstream, create_lead blind insert): Session 8.5.
- Money tools need Sonnet: record_payment, expenses, PDF, QR in Session 8.3 (formerly 7.5, renumbered 2026-05-15 — only made sense after 8.1 Sonnet routing + 8.2 prompt caching were production-ready).
- Vendor category taxonomy: 16 categories locked (florist merged into decor). See src/agent/categories.js.
- style_notes: free-text qualifier field on vendors table. Haiku extracts during onboarding.
- USD_TO_INR = 100: hardcoded constant in src/agent/models.js. Dev's call (macro view, 2026-05-15).
- Cost stored in both cost_usd (Anthropic reconciliation) and cost_inr (admin display).
- Version string: read from package.json dynamically via require('../package.json').
- expenses table migration renumbered from 0009 to 0010 (0009 taken by cost tracking in 8.1).
- vendors.rate_min / rate_max: not yet added. Session 9 migration. Haiku extracts + Swati overrides.
- Prompt caching: SHIPPED Session 8.2. 1-hour ephemeral cache on STATIC_SYSTEM_PROMPT. -91% input tokens.
- Gemini 3.1 Flash-Lite: SHIPPED Session 8.2. Retrieval-only. Never the main agent model.
- groundedSearch.js pattern: Gemini retrieves, Anthropic composes. Separation of concerns locked.
- GOOGLE_API_KEY: dev@thedreamwedding.in Google AI Studio account, free tier.
- Twilio is dominant cost driver post-caching (~Rs 300/vendor/month vs Rs 144 AI). Message caps protect Twilio spend.
- Railway region (EU West) vs Supabase (Mumbai ap-south-1): ~150-200ms cross-region latency. Move before scaling beyond 50 vendors.
- Bride-side planner model stack: Gemini Flash-Lite (grounded retrieval) + Haiku (internal DB) + Sonnet (multi-constraint planning). Session 9 decision — re-evaluate model landscape at that time.

## Session 6.5 -- Twilio template + +91 number migration
**Trigger:** +91 WhatsApp number arrives (Twilio approval pending)
**Founder directive:** No matter which session we are at, when +91 arrives, do Session 6.5 first.

What ships:
- Confirm WABA status (same WABA = templates transfer; new WABA = resubmit)
- Submit dream_os_morning_briefing UTILITY template (body locked -- see HANDOVER.md)
- Update TWILIO_WHATSAPP_NUMBER and TDW_WA_NUMBER env vars
- Update outbound send wrapper: template path when 24h window closed
- Update invite page wa.me link to +91
- Smoke test: briefing fires to vendor inactive >24h

Estimated time: 30 min build + Meta approval wait (1-7 days)
Blocked until: +91 number live

## Session 8.1 -- Smart model routing (Haiku -> Sonnet) ✅ DONE
Shipped 2026-05-15. See HANDOVER.md for full detail.

## Session 8.2 -- Prompt caching + Gemini SDK wiring ✅ DONE
Shipped 2026-05-15. See HANDOVER.md for full detail.

Key results:
- Prompt caching: input tokens -91%, cost per Haiku turn Rs 1.24 → Rs 0.20
- Gemini 3.1 Flash-Lite SDK wired as retrieval-only provider (src/lib/groundedSearch.js)
- GOOGLE_API_KEY added to Railway (dev@thedreamwedding.in, free tier)
- Twilio now the dominant cost driver post-caching, not AI

Why Gemini wired now (not Session 9):
Session 9 is already complex (Next.js, Vercel, vendor profiles, rate migration, multi-model planner).
Wiring the SDK now means Session 9 starts with retrieval layer ready — no setup debt.
groundedSearch.js: Gemini retrieves web context, Anthropic (Haiku/Sonnet) composes the reply.
The vendor agent does NOT call this today.

## Session 8.3 -- Money tools (formerly Session 7.5, renumbered 2026-05-15)
**Goal:** Complete the invoice flow + expenses. Sonnet routing + prompt caching now active.

**Why renumbered from 7.5 to 8.3:** This session was originally called 7.5 and deferred until
after 8.1 and 8.2 because money tools (invoice disambiguation, record_payment, PDF generation)
require Sonnet-level reasoning. Session 7.5 only made sense after the AI layer was production-ready.
Renaming to 8.3 reflects the actual build order and makes the session sequence self-explanatory.

What ships:
- record_payment tool (Stage 2: advance paid -> PDF with embedded UPI QR -> state=advance_paid)
- record_payment tool (Stage 3: balance paid -> plain WhatsApp text reminder -> state=paid)
- PDF generation via pdfkit (booking confirmation, vendor name, invoice number, amounts, QR)
- QR code generation via qrcode (dynamic UPI QR with amount embedded in PDF)
- list_invoices tool ("who owes me money?" / "show unpaid invoices")
- update_invoice_prefix tool (with warning: old invoices keep their numbers)
- expenses table (migration 0010) + log_expense tool
- Admin Money tab on vendor detail page (invoices + expenses + totals, read-only)
- Morning briefing: overdue invoice alerts

Estimated time: 90 minutes
Note: expenses migration is 0010 (not 0009 — taken by cost tracking in 8.1)

## Session 8.5 -- Clients model + lead deduplication
**Goal:** Introduce proper clients table. Leads promote to clients. Dedup upstream lead creation.

What ships:
- clients table migration: id, vendor_id, user_id (nullable), name, phone, email, source, referrer_name, notes, created_at, updated_at
- leads.client_id FK (nullable, SET NULL) — promotion link
- invoices.client_id FK (nullable, SET NULL) — alongside existing lead_id
- Promotion logic: advance paid -> auto-create client, link lead, link invoice
- add_client tool: vendor directly adds a client ("add client Priya, +91XXXX")
- list_clients tool
- Dedup fix in create_lead: name + phone match check before blind insert
- Admin: clients tab on vendor detail

Estimated time: 90-120 minutes

## Session 8 -- Admin polish + Google Calendar
**Goal:** Admin production-ready for 50 founding vendors. Google Calendar OAuth sync.

What ships:
- Vendor list: search + filter by status
- Bulk invite: CSV upload
- Manual onboarding_state override in admin
- Lead name-based state updates
- Google Calendar OAuth sync (two-way, conflict handling, recurring events)

Estimated time: 90 minutes

## Session 9 -- thedreamwedding.in Discover
**Goal:** Bride-side curated marketplace.

What ships:
- discover/ folder added to monorepo
- Next.js site on Vercel
- Vendor profile pages (public, read-only)
- Enquiry from Discover -> vendor WhatsApp thread automatically
- Reuses couple-facing agent from Session 5.5
- vendors.rate_min / rate_max migration + Haiku extraction + Swati admin override
- Bride-side model stack: Gemini Flash-Lite (grounded retrieval) + Haiku (internal DB) + Sonnet (planning)

Estimated time: 2-3 sessions

## Session 10 -- Instagram DM integration
**Goal:** Vendor connects Instagram Business account. DMs auto-route to their WhatsApp thread.

Requirements:
- Instagram Business or Creator account (not personal)
- Meta Developer App with instagram_manage_messages permission
- App Review required (2-4 weeks, business verification, demo video)
- OAuth flow: vendor connects IG account via dream-os admin
- Webhook: /webhook/instagram on Railway, Meta signature verification
- 24h messaging window applies (same as WhatsApp)
- New DB columns: vendors.instagram_user_id, vendors.instagram_access_token, vendors.instagram_token_expires_at
- Start Meta App Review submission early — it gates the whole session

Estimated time: 2 sessions + Meta review wait (2-4 weeks calendar time)

## Session 11-12 -- thedreamai.in vendor dashboard
**Goal:** Web dashboard as read layer over WhatsApp-captured data.
- vendors.rate_min / rate_max displayed and editable
- AI cost this month (from messages table)
- Full lead, invoice, event history

## Open questions
1. +91 number -- applied, arriving soon (triggers Session 6.5)
2. Founding cohort pricing -- free forever or free for X months?
3. Couple phone collection on Discover enquiry
4. thedreamwedding.in domain -- currently pointing where?
5. Swati's role in Discover editorial curation
6. Instagram DM integration: start Meta App Review process early -- what entity name for business verification?
7. Vendor "what's my balance remaining" query -- billing layer needed. Session 9+ / post-Razorpay.

## Deliberately out of scope
- iOS/Android native app
- Razorpay subscription billing (after 50 vendors proven)
- RLS (after bride-side public access needed)
- Multi-vertical (weddings first)
- Email/SMS fallback (WhatsApp only)
- One number per vendor (TDW code system solves routing)
- Standalone UPI QR generator (QR lives inside Stage 2 PDF only)
- Gemini as main agent model (retrieval-only role, Session 9+)
