# dream-os -- Roadmap
**Last updated:** 2026-05-15
**Current session:** 8.5
**Current version:** 8.5

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
| 3 | Admin layer, onboarding flow, conversation history, system prompt tightening, invite_vendor() | 0.3.0 |
| 4 | leads table, create_lead tool, list_leads, update_lead_state, lead/referrer distinction, post-processing commentary strip, admin leads tab | 0.4.0 |
| 5 | TDW handles (migration 0005), travel preference (0006), 4-step onboarding, FIRSTNAMEPHONE3 auto-handle, three-mode couple routing, admin TDW link display | 0.5.0 |
| 5.5 | Couple-facing agent (Haiku), capture_couple_lead, name last, past date fix, phone in list_leads, admin Enquiries tab | 0.5.5 |
| 6 | events table (0007), 5 new tools (create_event, list_events, update_event_state, update_routing_handle, get_my_tdw_link), morning briefing cron (8am IST), Twilio status callback, sendWhatsApp refactor | 0.6.0 |
| 7 (partial) | invoices table (0008), Supabase invoices bucket, create_invoice tool (Stage 1 text only) | 0.7.0 |
| 8.1 | Smart model routing (Haiku→Sonnet classifier), cost tracking on messages (0009), smart onboarding (16 categories), admin AI cost display | 0.8.1 |
| 8.2 | Prompt caching (91% input token reduction), Gemini SDK wired (groundedSearch.js, retrieval-only) | 0.8.2 |
| 8.3 | record_payment (Stage 2+3), invoicePdf.js, list_invoices, log_expense, update_invoice_prefix, expenses table (0010), Admin Money tab, morning briefing overdue alerts | 0.8.3 |
| 8.5 | clients table (0011), routing context (0012), resolveOrCreateClient helper, add_client + list_clients tools, lead-to-client promotion, create_lead dedup + auto-link, admin Clients tab with duplicate detection, admin messages newest-first, multi-vendor routing fix with Haiku disambiguation, sticky disambiguation (30 min), returning-bride detection, vendor notification forwarding, system prompt tool-call discipline rule | 8.5 |

## Session sequence (confirmed by founder 2026-05-15)
6.5 (on +91 arrival, jumps queue) → 8.5a → 8 → 9 → 10 → 11-12

Note on naming: bug-fix sessions are labeled after their parent session (e.g. 8.5a follows 8.5). This is founder's incompetency-traceability discipline — anyone reading the roadmap can see at a glance which sessions shipped enough bugs to need a dedicated cleanup session.

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
- Lead dedup in create_lead: phone-based, one lead per (vendor_id, phone), ever
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
- UPI QR: lives inside Stage 2 PDF only. No standalone QR generator.
- Invoices link to leads in v1. Clients table (Session 8.5 SHIPPED) adds client_id FK alongside lead_id.
- Clients model: vendor-scoped (UNIQUE vendor_id + phone). Phone is dedup key. Names never matched. Promotion trigger = advance paid OR vendor adds directly via add_client tool. SHIPPED Session 8.5.
- resolveOrCreateClient: single allowed door for client creation. Used by both add_client and promotion. SHIPPED Session 8.5.
- Lead dedup (upstream, create_lead blind insert): SHIPPED Session 8.5 — phone-based check before insert.
- Money tools (Sonnet routing): record_payment, expenses, PDF, QR shipped Session 8.3.
- Vendor category taxonomy: 16 categories locked (florist merged into decor). See src/agent/categories.js.
- style_notes: free-text qualifier field on vendors table. Haiku extracts during onboarding.
- USD_TO_INR = 100: hardcoded constant in src/agent/models.js. Macro view, 2026-05-15.
- Cost stored in both cost_usd (Anthropic reconciliation) and cost_inr (admin display).
- Version string: read from package.json dynamically via require('../package.json').
- Prompt caching: SHIPPED Session 8.2. 1-hour ephemeral cache on STATIC_SYSTEM_PROMPT. -91% input tokens.
- Gemini 3.1 Flash-Lite: SHIPPED Session 8.2. Retrieval-only. Never the main agent model.
- groundedSearch.js pattern: Gemini retrieves, Anthropic composes. Separation of concerns locked.
- GOOGLE_API_KEY: dev@thedreamwedding.in Google AI Studio account, free tier.
- Twilio is dominant cost driver post-caching (~Rs 300/vendor/month vs Rs 144 AI).
- Railway region (EU West) vs Supabase (Mumbai ap-south-1): ~150-200ms cross-region latency. Move before scaling beyond 50 vendors.
- Bride-side planner model stack: Gemini Flash-Lite (grounded retrieval) + Haiku (internal DB) + Sonnet (multi-constraint planning). Session 9 decision.
- Multi-vendor routing: SHIPPED Session 8.5. TDW code always wins over thread history. 2+ threads → Haiku disambiguation question. Sticky vendor for 30 min after resolution. State stored in users.pending_routing_context jsonb (single column, two schemas distinguished by keys).
- Returning-bride detection: SHIPPED Session 8.5. Detection via lead-exists check for (vendor_id, phone). Skips greeting + onboarding. Vendor notification replaced with "<leadName> just messaged: '<body>'".
- Conversational disambiguation primitive: half-built in Session 8.5 (routing only). Reuse pattern for client identity ambiguity in a future session.

## Session 6.5 -- Twilio template + +91 number migration
**Trigger:** +91 WhatsApp number arrives (Twilio approval pending)
**Founder directive:** No matter which session we are at, when +91 arrives, do Session 6.5 first.

What ships:
- Confirm WABA status (same WABA = templates transfer; new WABA = resubmit)
- Submit dream_os_morning_briefing UTILITY template
- Update TWILIO_WHATSAPP_NUMBER and TDW_WA_NUMBER env vars
- Update outbound send wrapper: template path when 24h window closed
- Update invite page wa.me link to +91
- Smoke test: briefing fires to vendor inactive >24h

Estimated time: 30 min build + Meta approval wait (1-7 days)
Blocked until: +91 number live

## Session 8.5 -- Clients model + multi-vendor routing ✅ DONE
Shipped 2026-05-15. See HANDOVER.md for full detail.

Key deliverables: clients table (migration 0011), pending_routing_context (migration 0012),
resolveOrCreateClient helper, add_client + list_clients tools, lead-to-client promotion on advance paid,
create_lead dedup + auto-link, admin Clients tab with same-name duplicate detection,
admin messages newest-first fix, multi-vendor couple routing with Haiku disambiguation,
sticky disambiguation (30 min window), returning-bride detection + vendor message forwarding,
system prompt tool-call discipline rule.

## Session 8.5a -- Cleanup of bugs discovered during 8.5 testing
**Goal:** Resolve all bugs surfaced by Session 8.5 production testing. Focused, narrow scope.
**Naming:** 8.5a labels this session as a cleanup of bugs originating in 8.5. Founder's incompetency-traceability discipline.

What ships:
- PDF interim acknowledgement in record_payment (3-5 second silence fix — was Step 11 of 8.5)
- Defensive check for empty inbound messages (media-only messages currently crash webhook)
- Engine-level guardrail for agent tool-call shortcut behavior (action verbs require tool call)
- Better fallback for returning-bride vendor notification when leadName is null
- Fix single-thread couple routing user_id lookup (silent miss in src/index.js line ~390)
- Strip UUIDs from add_client reply (system prompt nudge)
- "Showing 10 of N" suffix in list_clients
- "Did you mean SWATI978?" UX for typo'd TDW codes (stretch goal)

Estimated time: 60-90 minutes

## Session 8 -- Admin polish + Google Calendar
**Goal:** Admin production-ready for 50 founding vendors. Google Calendar OAuth sync.

What ships:
- Vendor list: search + filter by status
- Bulk invite: CSV upload
- Manual onboarding_state override in admin
- Lead name-based state updates (currently UUID-only)
- Google Calendar OAuth sync (two-way, conflict handling, recurring events)
- Event conflict detection in create_event: prompt vendor when new event clashes with existing event on the same day (threshold TBD — see open questions)
- Surface lead→client and invoice→client connections in admin Leads tab + Money tab (add client_id to selects + small "→ promoted" label)

Estimated time: 90-120 minutes

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
- Evaluate adding Sonnet routing for couple agent for complex/contextual returning-bride messages (currently Haiku-only)

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
- Full lead, invoice, event, client history

## Open questions
1. +91 number — applied, arriving soon (triggers Session 6.5)
2. Event conflict detection threshold: exact event_date match? Within ±2 hours? Same day regardless of time? — decide before Session 8.
3. Action verb list for tool-call guardrail (Session 8.5a): add / save / log / record / create — what else? Threshold may need product call.
4. Founding cohort pricing model: free forever vs free for X months. Open.
5. Couple phone collection on Discover enquiry: form field vs WhatsApp redirect. Session 9 decision.
6. thedreamwedding.in domain — currently pointing where? Need to confirm before Session 9 wiring.
7. Swati's role in Discover editorial curation — process? veto power? Session 9 decision.
8. Instagram App Review entity name — Anthropic dba dream-os? Personal entity? Session 10 prep.
9. Lead → client promotion: should we add conversational disambiguation when phone-only dedup is ambiguous? (Reuses Session 8.5 routing disambiguation pattern.) Future session.
