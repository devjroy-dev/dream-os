# dream-os — Vendor Roadmap
**Last updated:** 2026-05-15
**Current session:** 8.5a (in progress)
**Current version:** 8.5

---

## Vision

thedreamai.in is where vendors live.

WhatsApp-first chief of staff for wedding vendors in India. Vendor runs their business by texting a number. Agent remembers everything, handles routine, escalates judgment calls. Admin layer lets Dev and Swati manage the founding cohort of 50 vendors.

Vendors don't live on thedreamwedding.in. They appear there — curated, styled, earned. The vendor earns access through quality of work. Dev and Swati decide who features on Discover.

thedreamai.in (vendor) and thedreamwedding.in (bride) meet at Discover. That is the crossroads. Everything else is separate.

---

## Why vendor sessions pause after Session 8

After Session 8 (admin polish + Google Calendar), vendor-side development pauses while B-sessions build the bride product to parity.

This is a deliberate product decision, not a deprioritisation.

The reason: Discover — the crossroads where vendor and bride meet — cannot be built properly until both sides have persistent identity, a real schema, and a working agent. If we build Discover on a stateless bride, we get a directory, not a marketplace. The bride B-sessions (B1 through B4) build the foundation that makes Session 9 Discover worth building.

During the pause, vendor infrastructure continues to run. The founding cohort of 50 vendors continues to be served. No vendor-facing features regress. The pause is on new development only.

Session 9 is the convergence point. Both products meet. Discover goes live. From Session 9 onwards, vendor and bride roadmaps are developed in parallel, connected at the Discover layer.

See ROADMAP_BRIDE.md for the full bride roadmap and B-session plan.

---

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
| 8.5 | clients table (0011), routing context (0012), resolveOrCreateClient helper, add_client + list_clients tools, lead-to-client promotion, create_lead dedup + auto-link, admin Clients tab with duplicate detection, admin messages newest-first, multi-vendor couple routing with Haiku disambiguation, sticky disambiguation (30 min), returning-bride detection, vendor notification forwarding, system prompt tool-call discipline rule | 8.5 |
| 8.5a | Empty inbound crash fix (Bug #1), single-thread user_id lookup fix (Bug #4), TDW typo fuzzy-match "Did you mean?" (Bug #7), four docs written (HANDOVER, SCHEMA, ROADMAP, ROADMAP_BRIDE) — in progress | 8.5a |

---

## Session sequence

Vendor track: 6.5 (on +91 arrival, jumps queue) → 8.5a → 8 → PAUSE → 9 (convergence)
Bride track: B1 → B2 → B3 → B4 → 9 (convergence)
Post-convergence: 9 → 10 → 11-12 (both tracks, parallel)

Note on naming: bug-fix sessions are labelled after their parent session (e.g. 8.5a follows 8.5). This is founder's incompetency-traceability discipline — anyone reading the roadmap can see at a glance which sessions shipped enough bugs to need a dedicated cleanup session.

---

## Session 6.5 — Twilio template + +91 number migration
Trigger: +91 WhatsApp number arrives (Twilio approval pending).
Founder directive: No matter which session we are at when +91 arrives, do Session 6.5 first.

What ships:
- Confirm WABA status (same WABA = templates transfer; new WABA = resubmit)
- Submit dream_os_morning_briefing UTILITY template
- Update TWILIO_WHATSAPP_NUMBER and TDW_WA_NUMBER env vars to +91
- +14787788550 freed up: becomes the bride WhatsApp number permanently
- Update outbound send wrapper: template path when 24h window closed
- Update invite page wa.me link to +91
- Smoke test: briefing fires to vendor inactive >24h

Estimated time: 30 min build + Meta approval wait (1-7 days)
Blocked until: +91 number live

---

## Session 8.5a — Cleanup of bugs from Session 8.5 (IN PROGRESS)
Goal: Resolve production bugs surfaced by Session 8.5 testing.
Naming: 8.5a = cleanup session for bugs born in 8.5. Founder's incompetency-traceability discipline.

What ships:
- DONE: Bug #1 — Empty inbound messages (media-only) crash webhook (commit b3ece5c)
- DONE: Bug #4 — Single-thread couple routing user_id lookup (commit 1c23609)
- DONE: Bug #7 — Typo'd TDW codes route silently to wrong vendor (commit 853b5f0)
- DONE: Four docs written — HANDOVER, SCHEMA, ROADMAP, ROADMAP_BRIDE
- PENDING: Bug #3 — Returning-bride notification null leadName fallback
- PENDING: Bug #5 — UUIDs leak into add_client reply
- PENDING: Bug #6 — list_clients caps at 10 silently with no message
- Deferred to 8.5b: PDF interim acknowledgement in record_payment
- Deferred to 8.5b: Tool-call shortcut guardrail (needs founder to lock verb list)

Strategic decisions locked this session (architectural, not code):
- Sonnet routing for couple agent in multi-vendor scenarios deferred to Session 9
- Bride product architecture locked. See ROADMAP_BRIDE.md.
- Number routing locked: +91 = vendors, +14787788550 = brides. Permanent.
- Two Railway services from one repo. One Supabase project.
- Session 9 redefined as convergence of vendor + bride tracks, not just Discover build.
- tdw-2 vendor-side pages retire at Sessions 11-12. Bride PWA shell reused from B1.
- Discover hosted at thedreamwedding.in. Vendors have no login on thedreamwedding.in.

---

## Session 8 — Admin polish + Google Calendar
Goal: Admin production-ready for 50 founding vendors. Google Calendar OAuth sync.

What ships:
- Vendor list: search + filter by status
- Bulk invite: CSV upload
- Manual onboarding_state override in admin
- Lead name-based state updates (currently UUID-only)
- Google Calendar OAuth sync (two-way, conflict handling, recurring events)
- Event conflict detection in create_event: prompt vendor when new event clashes
- Surface lead→client and invoice→client connections in admin Leads + Money tabs

Open question to resolve before Session 8 starts:
- Event conflict detection threshold: exact date match? Within +/-2 hours? Same day? Founder must decide.

Estimated time: 90-120 minutes

---

## Session 9 — Convergence + Discover (REDEFINED 2026-05-15)
Goal: Vendor track and bride track converge. Discover goes live at thedreamwedding.in.
Prerequisite: B1 through B4 complete. Bride has persistent couple_id, Muse, Circle, planner, Surprise Me.

What ships:
- Discover at thedreamwedding.in/discover
- Real dream-os vendor profiles surfaced to brides (replaces seed data in tdw-2)
- Enquiry from Discover carries couple_id + taste profile. Vendor gets a qualified lead.
- Vendor notification includes Muse match context: "Priya (moody editorial, budget 3L+) enquired"
- Swati editorial curation layer in admin: vendors.discover_eligible toggle
- vendors.rate_min / rate_max migration + admin override
- Silent onboarding for brides arriving via TDW wa.me link. couple_id stamped.
- Snippet to enquiring brides: "I also help brides plan their entire wedding — save this number"
- Sonnet routing for couple agent in multi-vendor scenarios (deferred here from 8.5a)
- couples table note "essentially unused" deleted — couples table is now real and populated
- Resolve user_id / couple_id naming inconsistency inherited from tdw-2

Estimated time: 2-3 sessions

---

## Session 10 — Instagram DM integration
Goal: Vendor connects Instagram Business account. DMs auto-route to their WhatsApp thread.

Requirements:
- Instagram Business or Creator account (not personal)
- Meta Developer App with instagram_manage_messages permission
- App Review required (2-4 weeks, business verification, demo video)
- OAuth flow: vendor connects IG account via dream-os admin
- Webhook: /webhook/instagram on Railway
- New DB columns: vendors.instagram_user_id, vendors.instagram_access_token, vendors.instagram_token_expires_at
- Start Meta App Review submission early — it gates the whole session

Estimated time: 2 sessions + Meta review wait (2-4 weeks calendar time)

---

## Sessions 11-12 — thedreamai.in vendor dashboard
Goal: Web dashboard as read layer over WhatsApp-captured data. tdw-2 vendor-side retires.

What ships:
- thedreamai.in — vendor-facing web dashboard on Vercel
- Full lead, invoice, event, client, expense history
- AI cost this month display
- vendors.rate_min / rate_max editable
- Portfolio image management (feeds into Discover)

Note: All tdw-2 vendor-side pages (web and native) retire at this point. Not deprecated — retired. thedreamai.in is the permanent vendor web surface.

---

## Decisions locked

Architecture:
- Two products: thedreamai.in (vendors) + thedreamwedding.in (brides). Meet at Discover.
- Same repo: devjroy-dev/dream-os. Two Railway services. One Supabase project.
- Vendor entry point: src/index.js. Bride entry point: src/brideIndex.js (B1).
- +91 number = vendors (thedreamai.in). +14787788550 = brides (thedreamwedding.in). Permanent.
- Discover hosted at thedreamwedding.in. Vendors have no login there.
- tdw-2 vendor-side (web + native) retires at Sessions 11-12.
- tdw-2 bride-side PWA shell reused as-is. Backend switches to dream-os Railway at B1.
- Shared lib layer: src/lib/ (sendWhatsApp, supabase, models, clients). Never duplicated.

Models:
- claude-haiku-4-5-20251001: never change without founder approval
- claude-sonnet-4-6: never change without founder approval
- Gemini Flash-Lite: retrieval only, never main agent

Schema:
- Every schema change: numbered migration file in db/migrations/
- Bride migrations continue vendor sequence from 0013. No separate numbering.
- One migration history. One DB.
- Four docs updated every session: HANDOVER.md, SCHEMA.md, ROADMAP.md, ROADMAP_BRIDE.md
- UNIT_ECONOMICS.md: Dev's reference only. No session amends it.
- Session not complete until all four docs committed and pushed.

Vendor-specific:
- Phone format: always E.164
- Currency: Rs (never Rs symbol)
- TDW handle format: FIRSTNAMEPHONE3 e.g. DEV550
- wa.me link: wa.me/14787788550?text=TDW-DEV550 (updates to +91 after Session 6.5)
- Lead dedup: phone-based, one lead per (vendor_id, phone), ever
- Client dedup: phone-based, partial unique index WHERE phone IS NOT NULL
- Invoice number format: prefix/counter-padded-to-2 e.g. TDW/DEV550/01
- Invoice counter: never resets on prefix change. Gaps are accountant-safe.
- Invoice state machine: unpaid / advance_paid / paid / cancelled
- Prompt caching: 1-hour ephemeral cache on STATIC_SYSTEM_PROMPT. -91% input tokens.
- USD_TO_INR = 100: hardcoded in src/agent/models.js
- Multi-vendor routing: TDW code always wins over thread history
- Sticky disambiguation: 30 min window
- Returning-bride detection: per-vendor, via lead-exists check for (vendor_id, phone)

---

## Open questions

1. +91 number — applied, arriving soon. Triggers Session 6.5 the moment it lands.
2. Event conflict detection threshold — exact date? Within +/-2 hours? Same day? Decide before Session 8.
3. Tool-call shortcut guardrail verb list — add / save / log / record / create / new — what else? Needed before 8.5b.
4. Founding cohort pricing model — free forever vs free for X months. Open.
5. Instagram App Review entity name — personal entity or business? Decide before Session 10 prep.
6. Lead → client promotion disambiguation — conversational disambiguation when phone-only dedup ambiguous? Future session.
7. Railway region (EU West) vs Supabase (Mumbai) — 150-200ms latency. Move before scaling beyond 50 vendors.
