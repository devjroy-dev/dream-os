# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-17
**Session:** Replanning session + CC fixes
**Version:** 0.9.0-alpha
**HEAD:** a2314d6
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Repo:** https://github.com/devjroy-dev/dream-os

This is the first document where all three tracks — vendor, bride, and Discover — are captured
in one place. It is the bridge. Every session before this point had a separate handover for vendor
(HANDOVER.md, frozen at 8.5a) and bride (HANDOVER_BRIDE.md, frozen at B3). From this session
onwards, this is the single active handover. Read it first. Then read ROADMAP_FINAL.md and SCHEMA.md.

---

## The problem that started everything

dream-os is a WhatsApp-first platform. One shared number (+91 7982159047) serves all vendors.
When a bride taps a vendor's wa.me link and messages them, the system creates a conversation thread
keyed by her phone number — a `couple_thread` with `counterparty_phone = +91XXXXXXXXXX`.

This works fine when a bride talks to one vendor. It breaks architecturally when she talks to two.

When bride Priya messages Vendor A (photographer) and Vendor B (MUA) both on the same +91 number,
the system sees two separate `couple_thread` conversations, both with `counterparty_phone = Priya's number`.
There is no row in the database that says "these two threads are the same human." Priya has no
persistent identity. She is just a phone number on two unconnected threads.

This created 17 documented disambiguation edge cases by Session 8.5:
- Sticky routing (30-minute window to remember which vendor she was last talking to)
- Levenshtein fuzzy match on TDW codes ("Did you mean TDW-SWATI978?")
- Per-message routing re-evaluation
- Returning-bride detection per-vendor via lead-exists check
- Vendor notification forwarding
- Multi-step Haiku disambiguation ("Which vendor are you trying to reach?")

Every single one of these was a workaround. Not a fix. A band-aid over the absence of
a `couples` row with a permanent `couple_id` tying her threads together.

The architectural ceiling was clear: continuing to build vendor features on top of ambiguous
bride identity meant every new feature had to re-handle the ambiguity. The edge case inventory
would grow, not shrink. And Discover — the marketplace — could never be built on a stateless bride.
A marketplace requires persistent identity on both sides.

The structurally correct move: pause vendor development, build bride identity as a first-class
concept, give every bride a permanent `couple_id`, and let the vendor side benefit from that
stability afterward. That is why the B-sessions exist.

---

## Vendor session history (Sessions 1 through 8.5a)

### Session 1 — Echo bot + infrastructure (v0.1.0)
**Date:** 2026-05-14

What shipped:
- WhatsApp echo bot via Twilio sandbox (+14155238886)
- Express server on Railway
- Initial schema: 5 tables (users, vendors, couples, conversations, messages)
- Webhook at /webhook/whatsapp

Key decisions:
- Railway for hosting (not Vercel — needs persistent server for webhooks)
- Supabase for DB (Mumbai region for latency)
- Twilio for WhatsApp (Meta Business API via Twilio abstraction)
- Single repo from day one

Note: couples table exists since migration 0001 but was essentially unused until B1.
This is the table that would eventually hold bride identity. It sat empty for 9 sessions.

---

### Session 2 — Agentic loop (v0.2.0)
**Date:** 2026-05-14

What shipped:
- Claude Haiku as the agent (claude-haiku-4-5-20251001, locked from day one)
- Agentic loop in src/agent/engine.js (MAX_ITERATIONS=5)
- First tools: note_to_self, update_conversation_state, respond_to_vendor
- vendor_state table (agent working memory)
- notes table
- pending_actions table
- Post-processing: strips everything after first `?` in vendor replies. Model-proof discipline.

Key decisions:
- respond_to_vendor as terminal tool — routing logic needs an explicit "now reply" step
- MAX_ITERATIONS=5 — prevents runaway loops
- Post-processing strip — enforces reply format at code level, not just prompt level

---

### Session 3 — Admin + onboarding (v0.3.0)
**Date:** 2026-05-14

What shipped:
- Admin layer: vendor list, invite form, vendor detail
- Onboarding state machine: new → asked_category → asked_city → asked_rate → complete
- Conversation history sent to agent on every turn
- invite_vendor() Postgres function: creates users + vendors rows atomically
- System prompt tightened

Key decisions:
- Invitation-only. Vendors onboarded personally by Dev/Swati. No self-signup.
- Onboarding greeting locked: "Hi [Name] — Swati mentioned a little bit about you..."
- Unknown numbers get dead-end message. No escalation.

---

### Session 4 — Leads (v0.4.0)
**Date:** 2026-05-14

What shipped:
- leads table (migration 0004)
- create_lead tool: captures couple name, phone, wedding date, city, budget, source, referrer
- list_leads tool
- update_lead_state tool (UUID-based — name-based deferred, still pending)
- Lead vs referrer distinction locked: referrer_name ≠ lead name. Always separate.
- Admin leads tab
- Post-processing commentary strip: removes agent opinions and filler after the reply

Key decisions:
- Lead dedup: phone-based, one lead per (vendor_id, phone), ever
- referrer_name is who told the couple about the vendor. Lead name is the couple.
  These are never the same field. Locked permanently.

---

### Session 5 — TDW handles + couple routing (v0.5.0)
**Date:** 2026-05-14

What shipped:
- vendors.routing_handle column (migration 0005): unique TDW code per vendor
- Handle format: FIRSTNAMEPHONE3 (e.g. DEV550). Auto-assigned on invite.
- Instagram handle collection added (collected naturally, not during onboarding)
- Travel preference columns: vendors.open_to_travel, vendors.travel_notes (migration 0006)
- Three-mode couple routing:
  Mode 1 (returning couple): counterparty_phone already in conversations → route directly
  Mode 2 (TDW code): first word matches vendors.routing_handle → create thread → notify vendor
  Mode 3 (fallback): no match → "Hi! To reach a TDW vendor, send their TDW code"
- wa.me link format: wa.me/14787788550?text=TDW-DEV550 (later updated to +91)
- Admin TDW link display
- Instagram interception strategy documented (Surface 1: wa.me in bio, Surface 2: IG DM API
  Session 10, Surface 3: vendor forwards manually)

Key decisions:
- One shared number for all vendors. TDW code routes to correct vendor.
- Handle is permanent once set. Vendor can update via update_routing_handle tool.
- wa.me link in vendor's Instagram bio is the primary organic acquisition surface.

---

### Session 5.5 — Couple-facing agent (v0.5.5)
**Date:** 2026-05-14

What shipped:
- Couple-facing Haiku agent on Mode 1 + Mode 2 threads
- capture_couple_lead tool: agent captures lead details from couple conversation
- Name collected last (not first) in couple conversations — avoids premature commitment
- Past date fix: agent no longer suggests dates that have already passed
- Phone number included in list_leads output
- Admin Enquiries tab

Key decisions:
- Couple-facing agent replies in vendor's voice, on vendor's behalf
- Vendor gets notified when couple messages: "Priya just messaged: 'Looking for a photographer'"
- Agent handles routine couple enquiries. Vendor steps in for judgment calls.

---

### Session 6 — Events + Morning briefing (v0.6.0)
**Date:** 2026-05-14

What shipped:
- events table (migration 0007): shoots, calls, meetings, recces, fittings, trials, ceremonies
- 5 new tools: create_event, list_events, update_event_state, update_routing_handle, get_my_tdw_link
- Morning briefing cron: 8am IST daily. Vendor gets their day: upcoming events + open leads.
- Twilio status callback webhook: /webhook/twilio-status
- sendWhatsApp refactored into src/lib/whatsapp.js (shared lib)
- messages.delivery_status column: queued/sent/delivered/read/failed/undelivered/skipped_window_closed

Key decisions:
- Morning briefing is proactive. Chief of staff calls before you ask.
- Twilio 24h session window: free-form messages only within 24h of last inbound.
  After 24h: must use approved template. Template submission deferred (mistake — cost us later).
- Briefing per-vendor kill switch: vendors.briefing_enabled boolean.

---

### Session 7 — Invoices Stage 1 (v0.7.0)
**Date:** 2026-05-15

What shipped:
- invoices table (migration 0008)
- Supabase `invoices` storage bucket (private, PDF storage)
- create_invoice tool: Stage 1 text-only invoice creation
- vendors.invoice_prefix, vendors.invoice_counter columns
- Invoice number format: PREFIX/COUNTER-PADDED-TO-2 (e.g. TDW/DEV550/01)

Key decisions:
- Invoice counter never resets on prefix change. Gaps are accountant-safe.
- Invoice state machine: unpaid / advance_paid / paid / cancelled
- PDF generation deferred to Session 8.3 (Stage 2+3)

---

### Session 8.1 — Smart model routing (v0.8.1)
**Date:** 2026-05-15

What shipped:
- Classifier in src/agent/classifier.js: Haiku reads message + context → SIMPLE or COMPLEX
- SIMPLE → Haiku handles the turn (~Rs 0.20/turn post-caching)
- COMPLEX → Sonnet handles the turn (~Rs 0.40/turn post-caching)
- Cost tracking on messages rows: model, input_tokens, output_tokens, cost_usd, cost_inr
- messages cost columns (migration 0009)
- vendors.style_notes column: qualifier from onboarding e.g. "luxury", "celebrity"
- Smart onboarding: 16 categories with aliases and style detection
- Admin AI cost display

Key decisions:
- Classifier call itself costs ~Rs 0.15/call (Haiku, ~500 input tokens). Net positive vs
  routing everything to Sonnet.
- USD_TO_INR = 100 hardcoded in src/lib/models.js. Not fetched dynamically.
- Gemini Flash-Lite evaluated and rejected as classifier. Too much complexity for trivial saving.

Unit economics at this point:
- Pre-caching: Haiku Rs 1.25/turn, Sonnet Rs 2.50/turn
- 50 vendors × 20 msg/day = Rs 45,000/month without caching

---

### Session 8.2 — Prompt caching (v0.8.2)
**Date:** 2026-05-15

What shipped:
- Prompt caching: cache_control: { type: "ephemeral" } on static system prompt block
- 1-hour cache window. Near-100% cache hit rate (static block is identical hash every call)
- Gemini Flash-Lite SDK wired: src/lib/groundedSearch.js (retrieval-only, never main agent)
- GOOGLE_API_KEY added to Railway env

Actual observed results:
- Input tokens per Haiku turn: 11,500 → 1,200 (-91%)
- Cost per Haiku turn: Rs 1.24 → Rs 0.18-0.22 (-85%)
- Monthly burn 50 vendors: Rs 45,000 → Rs 28,750 (Twilio now dominant cost, not AI)

Key decisions:
- Gemini wired but not used. Retrieval-only, never composes. Ready for bride side.
- Prompt caching inherited by bride agent from day one (shared models.js).

---

### Session 8.3 — Money tools (v0.8.3)
**Date:** 2026-05-15

What shipped:
- record_payment tool: Stage 2+3 invoice payment recording
- invoicePdf.js: PDF generation via Supabase storage
- list_invoices tool
- log_expense tool
- update_invoice_prefix tool
- expenses table (migration 0010)
- Admin Money tab: invoices + expenses view
- Morning briefing overdue alerts: vendors see overdue invoices in daily briefing

Key decisions:
- PDF generation causes 3-5 second silence (fixed in CC session 2026-05-17 — interim message added)
- PDF filename was a long UUID string (fixed in CC session 2026-05-17 — now INVOICE-DEV550-01.pdf)
- No GST handling. Out of scope for founding cohort.

---

### Session 8.5 — Clients + disambiguation (v8.5)
**Date:** 2026-05-15

What shipped:
- clients table (migration 0011): vendor's client records, separate from leads
- users.pending_routing_context column (migration 0012): stores sticky routing state
- resolveOrCreateClient helper: finds or creates client row, deduped by phone
- add_client tool, list_clients tool
- Lead-to-client promotion: when lead books, auto-promote to client
- create_lead dedup + auto-link to client if phone matches
- Admin Clients tab with duplicate detection (yellow "possible duplicate" pill)
- Admin messages newest-first
- Multi-vendor couple routing with Haiku disambiguation
- Sticky disambiguation: 30-minute window. Sticky vendor stamped on pending_routing_context.
- Returning-bride detection: per-vendor, lead-exists check for (vendor_id, phone)
- Vendor notification forwarding when couple messages
- System prompt tool-call discipline rule: agent must not skip confirmation steps

Key decisions:
- Client dedup is phone-only. Names never used for dedup (Indian naming conventions too varied).
- Dedup is a partial unique index WHERE phone IS NOT NULL — allows multiple phoneless clients.
- Sticky window extends on every sticky-routed message (active conversations stay routed).
- TDW code always overrides sticky.
- 17 disambiguation edge cases documented and acknowledged as architectural workarounds,
  not permanent fixes. The real fix requires bride persistent identity (couple_id).
  This is the session where the architectural ceiling became undeniable.

---

### Session 6.5 — +91 number migration (completed alongside 8.5a)
**Date:** 2026-05-15

What shipped:
- +917982159047 registered as WhatsApp sender under existing WABA 1299109268220358
- Business display name: The Dream Wedding. Status: Online.
- Same WABA = all existing Meta approvals transfer automatically.
- Railway env vars updated:
  TWILIO_WHATSAPP_NUMBER = whatsapp:+917982159047 (vendor, permanent)
  TDW_WA_NUMBER = 917982159047 (vendor, permanent)
  BRIDE_WA_NUMBER = 14787788550 (bride, permanent)
- Twilio webhooks set on +917982159047 → dream-os vendor service
- +14787788550 freed permanently → bride product number
- invite.js wa.me link parameterised (was hardcoded to 14787788550)
- Empty conversation history crash fix: filter empty-body messages before Anthropic API call

Number routing locked permanently:
- +917982159047 = vendors, thedreamai.in, Indian number, local trust
- +14787788550 = brides, thedreamwedding.in, US number, NRI brides, premium positioning

STILL PENDING from 6.5:
- dream_os_morning_briefing Twilio template for +917982159047 NEVER SUBMITTED.
  Without it, morning briefing cannot fire to vendors inactive >24h.
  Must submit immediately. Approval takes 1-7 days.

---

### Session 8.5a — Bug fixes (partial, v0.8.5a)
**Date:** 2026-05-15

What shipped (3 of 6 bugs):
- Bug #1: Empty inbound messages crash webhook (commit b3ece5c). Media-only WhatsApp messages
  (images, voice notes, stickers) had empty Body. Fix: defensive guard before agent invocation.
- Bug #4: Single-thread couple routing user_id lookup (commit 1c23609). Join selected users(name)
  not users(id) — vendor notification never fired. Fix: fetch fullVendor first via user_id.
- Bug #7: Typo'd TDW codes route silently (commit 853b5f0). Step B.5 inserted: Levenshtein
  distance ≤2 fuzzy match → "Did you mean TDW-SWATI978?" 0 or 2+ matches fall through.

Bugs #3, #5, #6 pending at 8.5a close — fixed in CC session 2026-05-17.

Strategic decisions locked at 8.5a:
- Vendor sessions pause here. B-sessions begin.
- +91 routing locked permanently.
- Session 9 redefined as convergence (not just Discover).
- Bride architecture locked: same repo, separate Railway service, same Supabase.
- Discover hosted at thedreamwedding.in. Vendors have no login there.

Why vendor paused here (the real reason):
The 17 disambiguation edge cases are architectural workarounds for missing bride identity.
Every new vendor feature added more disambiguation surface area. The ceiling was hit.
The structurally correct move: build bride identity (couple_id as first-class concept) and
return to vendor once the foundation is solid. This is not a deprioritisation of vendor.
It is the prerequisite for vendor to scale correctly.

---

## Bride session history (B1 through B3)

### B1 — Couple identity + WhatsApp onboarding (v0.8.5a.1-b1)
**Date:** 2026-05-16
**HEAD at close:** c4cedcc
**Time taken:** ~6 hours including live debugging and two patches

Original spec vs what actually shipped:

SPEC had: token-based invite (couple_invites table, PRIYA-A8F2K9 tokens, one-time use)
SHIPPED: phone-as-gate instead. Swati invites by phone + name + pronouns via admin.
Bride messages from that phone → phone-gate passes. Simpler, equally secure.
Rationale: phone is by definition her WhatsApp number. Token adds no security over phone.

SPEC had: whatsapp_linked column
SHIPPED: dropped. Onboarding_state alone is sufficient.

ADDED (not in spec): users.pronouns column. Supports both bride and groom.

Three migrations instead of one (two bugs surfaced during live testing):
- 0013_couples_onboarding.sql: couples.onboarding_state, couple_state table, events.kind
  widened to 12 values, events/notes XOR for vendor_id/couple_id, invite_couple() function
- 0014_conversations_xor.sql: conversations.vendor_id nullable + couple_id added + XOR
  constraint. Discovered live: first bride message failed with "null value in vendor_id".
- 0015_pronouns_and_dedup.sql: users.pronouns, couples.user_id UNIQUE, invite_couple() 3-arg

New Railway service created: dream-wedding → src/brideIndex.js
+14787788550 webhook repointed to dream-wedding service.

Onboarding state machine: new → asked_date → asked_partner → asked_city → asked_budget → complete
Haiku-based intent classification for dodge detection (not regex).

Live verification on test couple 7abccc1b (Swati Couple Test, +919888294440):
- Dodged date → agent moved on without "circle back"
- "I'd rather not say" for partner → classified as DODGE, literal text not saved
- "Goa" captured as city ✅
- "35l" → 3500000 extracted correctly ✅
- Completion message fired with bride's name ✅
- "later" defer → "👍 You know where to find me" ✅

Key decisions locked at B1:
- Phone-as-gate is the default. Token invites only if needed later.
- Haiku-based intent classification preferred over regex for natural-language judgement.
- Writer .py protocol mandatory for all file changes (SHA-256 verified payloads).
- Versioning: bride sessions as 0.8.5a.<N>-b<N>. Convergence is 0.9.0 (now revised to 1.0.0).

---

### B2 — Muse + Circle (v0.8.5a.2-b2)
**Date:** 2026-05-16
**HEAD at close:** acb4828

What shipped:
- Muse: image + link saves, Google Vision tagging (12-value aesthetic taxonomy locked in
  src/agent/brideAesthetics.js), Haiku taxonomy classification, Cloudinary mirroring
- save_to_muse tool, list_muse tool, delete_muse_save tool
- Circle invites: CIRCLE-XXXXXX tokens, 3-member cap enforced in invite_circle_member()
- Circle member routing: daily image cap 5, session-based summarization (10-min idle = session end)
- Session surfacing: Haiku composes BFF summary, prepends to bride's next turn
- invite_to_circle tool, list_circle tool
- Admin delete button (security gap — password confirmation added in CC session 2026-05-17)
- CC Audit: 12 findings, 8 deferred to B3.1

Migrations:
- 0016_muse_and_circle.sql: muse_saves, circle_members, circle_activity tables,
  invite_circle_member() and claim_circle_invite() functions
- 0017_circle_sessions.sql: circle_sessions table for session-based summarization
- 0018_fix_muse_saves_fk.sql: muse_saves.saved_by_user_id FK changed from ON DELETE RESTRICT
  to ON DELETE CASCADE (unblocked admin "Delete couple" cascade). Applied directly via
  Supabase SQL Editor during B2, backfilled to repo afterward.

Aesthetic taxonomy locked (12 values, do not add without founder approval):
moody, editorial, pastel, OTT, minimal, candid, grand, rustic, modern
(Note: document says 12-value but 9 aesthetic categories — rest are in kind/source taxonomy)

Circle smoke test deferred to B3.1 (required two phones).
Production bug discovered at B3 close: circle invite wa.me link broken end-to-end.
Specific failure point TBD on investigation. Fix scheduled for Phase 1 Session P1-1.

Key decisions locked at B2:
- Circle members can see Muse saves (was incorrectly blocked — fixed in B3).
- Permission model: members can edit/delete their own saves only. Enforced at API layer.
- Four reactions locked: heart, thumbs-up, star-struck, thinking. No additions without approval.
- 3-member cap per couple. Enforced in Postgres function.
- Session end is derived (last_activity_at < now - 10min AND summarized_to_bride = false).
  Not stored explicitly.

---

### B3 — Planner: events + bookings + receipts + image classifier (v0.8.5a.3-b3)
**Date:** 2026-05-17
**HEAD at close:** 2e7009c (docs close: 8abb143)

Scope change from B2 close:
- Original B3 scope: tasks + receipts only
- Actual B3 scope: tasks + event tools (list/update/delete were missing) + bookings + receipts
  + image classifier. Grew because event tools were half-built (add_event existed, rest didn't).
- "No money tools on bride side" framing was over-corrected. Bride needs commitment tracking
  (what she owes whom and when) even if she doesn't need CFO-level reconciliation.

What shipped:

Tasks (5 tools built, then immediately deprecated):
- create_task, list_tasks, complete_task, update_task, delete_task built first
- Then deprecated at B3 close: everything merged into events (kind=reminder)
- couple_tasks table retired in place (migration 0022 copies tasks → events, empties table)
- Reason: "everything is a calendar event" is cleaner. No separate task concept needed.

Event tools (3 new — add_event already existed from B1):
- list_events (filterable by date range, kind, state)
- update_event (disambiguation required when bride references by name)
- delete_event (irreversible, confirmation required)

Booking tools (5):
- add_booking, list_bookings, update_booking, delete_booking, record_payment
- record_payment() Postgres function: transactional, locks row, recomputes state via CASE,
  returns updated row. SINGLE SOURCE OF TRUTH for amount_paid and state. No agent arithmetic.

Receipt tools (3 — vault-only design):
- save_receipt, list_receipts, delete_receipt
- Vault design: agent saves immediately with image_url. No label, no amount, no vendor_name asked.
  "Got it, filed away." Bride retrieves and labels via PWA at Phase 2.
- Receipt OCR linkage flow (3-branch) dropped permanently. Replaced with vault-only.

Image classifier:
- Google Vision DOCUMENT_TEXT_DETECTION (word count ≥20) + LABEL_DETECTION (receipt labels ≥0.70)
- Routes to receipt vault or Muse on classification result
- Default: Muse on any Vision failure
- 'document' and 'paper' excluded from label set (too generic — wedding invitations score high)
- NOT Haiku-as-classifier (spec changed mid-B3 after discussion)

Migrations:
- 0019_bride_planner.sql: couple_tasks, couple_bookings, couple_receipts tables,
  record_payment() function, 9 indexes, updated_at triggers, 3 realtime publications
- 0020_drop_task_priority.sql: drops priority column from couple_tasks
- 0021_couple_receipts_label.sql: adds label column to couple_receipts (reserved, not agent-written)
- 0022_task_event_merge.sql: copies couple_tasks → events (kind=reminder), empties couple_tasks

Phone test (test bride: +919888294440, couple_id: 7abccc1b):
✅ Tasks: create/complete/delete working
✅ Events: add/list/update/cancel/delete including "6 evening" → 6pm
✅ Bookings: add/list/record_payment/update, balance computed correctly
✅ Circle: invite link generation (wa.me link text correct but end-to-end tap broken — production bug)
✅ Circle: partner joins + saves images
✅ Date awareness: fixed (IST injected)
✅ Event/task routing: fixed (routes to add_event)
✅ Circle Muse visibility: fixed (circle members can now see board)

NOT YET PHONE-TESTED (code exists, unverified):
- Receipt image classifier (forwarding real receipt → "Got it, filed away")
- Receipt list + image playback in WhatsApp
- Google Vision DOCUMENT_TEXT_DETECTION end-to-end on printed receipt

These MUST be verified at Phase 1 Session P1-2 before Surprise Me build begins.

Scope changes locked at B3 close:
- Morning nudge deferred to Phase 1 (P1-3)
- list_dues tool deferred to Phase 1 (P1-3)
- Twilio template deferred to Phase 1 (P1-3)
- B3.1 primary deliverable changed to thedreamwedding.in/muse public landing — now superseded
  by replanning. Muse public URL is part of Phase 2 bride PWA shell.
- Circle invite wa.me link production bug discovered. Fix is Phase 1 P1-1.

Architectural principles locked at B3 (non-negotiable):
1. No agent arithmetic, ever. All booking math in SQL.
2. Intent maps to tool, not to phrasing. "Cancel Anvaya" / "remove Anvaya" / "scratch photographer"
   all resolve to delete_booking().
3. Delete replaces cancellation. No cancelled state on bookings or receipts.
4. No per-payer attribution. Ever. Out of scope permanently, not deferred.
5. Bookings are flat. Single-row commitment tracking.
6. Receipts link to bookings optionally, never silently. Agent asks before linking.
7. Destructive actions confirm. Ambiguous references disambiguate.

---

## Replanning session — 2026-05-17

This session reviewed every document, every frozen item, every deferred decision, and every
architectural gap across both tracks. No code was written in the planning portion.

### The 11 strategic decisions locked

1. **B-session naming convention retired.** B1–B4 framing served its purpose. Done. One roadmap.

2. **Session numbering retired.** Sessions 8, 9, 10 replaced by Phase 1, 2, 3. Cleaner, doesn't
   carry archaeological weight of version jumps.

3. **Versioning reset and restructured:**
   - 0.9.0-alpha: this session (replanning + CC fixes)
   - 0.10.0-alpha: Phase 1 complete (WhatsApp standalone)
   - 0.11.0-alpha: Phase 2 complete (PWA shells)
   - 1.0.0: Phase 3 complete (Discover, public launch)

4. **Sequencing corrected.** Prior roadmap: WhatsApp → Discover → PWA. This was wrong.
   Correct sequence: WhatsApp standalone → PWA shells → Discover.
   Rationale: Discover before liquidity is a directory. PWA before Discover is a trust mechanism.

5. **Surprise Me redefined.** Was classified as Discover feature. Is a Muse feature.
   Reads bride's muse_saves.aesthetic_tags → Gemini Flash-Lite → internet results in BFF voice.
   No vendor data needed. No density block. No couple_vendor_connections table needed.
   Phase 1 item. Phase 2: visual grid in bride PWA. Phase 3: vendor results added alongside.

6. **PWA shells moved to Phase 2 (pre-Discover).** Were at Sessions 11-12 (post-Discover).
   Rationale: trust mechanism. The engine under the bonnet. Users need to SEE their data to
   believe the product works. WhatsApp is where you create. PWA is where you see and trust.

7. **Vendor profile completion added to vendor PWA shell.**
   Portfolio images, aesthetic tags, rate range collected via vendor PWA profile completion tab.
   This is the Discover data collection surface. By the time Discover launches, vendor data
   is already populated by vendors themselves. Swati just flips discover_eligible.

8. **PWA auth architecture locked.** First login: phone → OTP via WhatsApp → PIN setup.
   Subsequent logins: phone + PIN. Applies to vendors, brides, circle members.
   Circle members get scoped access: Muse + Circle Activity only.

9. **PWA planning session (Session PWA-0) required before Phase 2 build.**
   Agenda: framework choice, auth flow detail, tab structure confirmation, folder structure
   in monorepo, Railway service setup, design system decisions. No code until this is done.

10. **Discover deferred to Phase 3 / v1.0.0.** Not on a calendar schedule. Gated on:
    - Real vendor count with completed profiles
    - Real bride count with Muse boards
    - Swati editorial pass complete
    - discover_readiness table seeded for density thresholds

11. **Admin tools are post-launch.** Not on critical path. Swati manages 50 vendors with
    current admin. Polish when operational pain demands it.

### CC fixes applied (commits 58c5814 + a2314d6)

**Commit 58c5814:**
| Fix | File | Detail |
|---|---|---|
| Bug #3 — null leadName | engine.js:458 | Fallback: ...${couplePhone.slice(-4)} e.g. ...9924 |
| Bug #5 — UUID leak in add_client | engine.js + systemPrompt.js | Return {name,phone,source,created_at} only. No id field. System prompt rule added. |
| Bug #6 — list_clients silent cap | engine.js | Count query added. "Showing 10 of N" suffix when total >10. |
| PDF interim message | engine.js:1062 | sendWhatsApp fires before generateInvoicePdf. "Got it — recording your payment. Generating the invoice PDF, just a moment..." |
| PDF filename | engine.js:1070 | TDW/DEV550/01 → INVOICE-DEV550-01.pdf. Strips TDW/ prefix, replaces / with -, prefixes INVOICE-, uppercases. |

**Commit a2314d6:**
| Fix | File | Detail |
|---|---|---|
| Couple agent Sonnet routing | engine.js:310–314 | Classifier wired into couple-facing agent turn. SIMPLE→Haiku, COMPLEX→Sonnet. |
| Bride agent Sonnet routing | brideEngine.js | Was already wired correctly (lines 152–154). CC confirmed. No change needed. |
| B2 audit L2 | brideEngine.js:1575,1599 | prevPlaybackCount captured before push loop. image_playback_queued now non-cumulative. |
| B2 audit L9 | brideIndex.js:692–700 | Inbound log moved to immediately after cap-check, before session management and agent run. |
| Admin delete confirmation | src/admin/ | Both delete routes now require ADMIN_PASSWORD in POST body. Missing env var blocks delete. |

---

## Current state — vendor WhatsApp (src/index.js) at 0.9.0-alpha

**Working:**
- Full onboarding (name, category, city, rate). 16 categories. Smart detection.
- TDW handle auto-assigned (FIRSTNAMEPHONE3). Unique. Updateable via tool.
- Three-mode couple routing. TDW code always wins over thread history.
- Fuzzy TDW match (Levenshtein ≤2).
- Sticky disambiguation: 30-min window.
- Returning-bride detection: per-vendor.
- Returning-bride notification: ...XXXX fallback when name null ✅
- Couple-facing agent: Haiku + Sonnet routing now active ✅
- All tools working: note_to_self, create_lead, list_leads, update_lead_state,
  respond_to_vendor, create_event, list_events, update_event_state,
  update_routing_handle, get_my_tdw_link, create_invoice, list_invoices,
  record_payment (interim message + correct filename), log_expense,
  update_invoice_prefix, add_client (no UUID), list_clients (count suffix)
- Morning briefing: 8am IST. Overdue alerts.
- Smart model routing: Haiku/Sonnet. Both agents.
- Prompt caching: 91% reduction. Active.
- Admin: vendor list, invite, vendor detail, leads, clients, money, messages.
- Admin delete: password confirmation required ✅

**Pending (Phase 1):**
- coupleIdentity.js: not written. The disambiguation fix. Phase 1 Session P1-4.
- Twilio template dream_os_morning_briefing: NEVER SUBMITTED for +917982159047.
  Submit immediately — approval 1-7 days. Blocks morning briefing for inactive vendors.

**Known pre-existing gaps (low priority, not blocking):**
- Twilio status callback race condition (pre-existing since Session 5.5)
- No Anthropic credit-low warning
- Classifier context gap: prior Sonnet turn outside 2-turn history may route to Haiku
- Railway running in EU West, Supabase in Mumbai (fix at Phase 3)
- update_lead_state requires UUID (name-based deferred post-launch)

---

## Current state — bride WhatsApp (src/brideIndex.js) — P1-3 complete (HEAD: 35e7cdc)

**Working:**
- Phone-gated onboarding. BFF voice. IST date aware.
- Muse: image + link saves. Google Vision tagging. Cloudinary mirror.
- Image classifier: Vision routes to receipt or Muse. Phone-tested ✅
- Receipt list + image playback. Phone-tested ✅
- Circle: 3-member cap, CIRCLE-XXXXXX tokens (7-day expiry from migration 0023).
- Circle daily image cap: 5/day ✅ Circle daily text cap: 5/day ✅
- Circle session summary: fires after 10-min idle. Injected as fake assistant message (35e7cdc) — guaranteed delivery. Pipeline phone-tested ✅
- Planner: events as universal calendar entry.
- Bookings: commitment tracking. record_payment() SQL function.
- Receipts: vault-only. "Got it, filed away."
- Surprise Me: built. Trigger: "surprise me". ⚠️ PENDING PHONE TEST — Google billing verification pending.
- factual_search tool: built. ⚠️ PENDING PHONE TEST — same Google billing block. Graceful fallback active.
- Morning nudge cron: built. src/brideCron.js + src/agent/brideNudge.js. ⚠️ PENDING — first fire tomorrow 8am IST.
- Smart model routing: Haiku/Sonnet active ✅
- Prompt caching: active.

**Pending (Phase 1):**
- Surprise Me + factual_search: blocked on Google billing verification. Retest once cleared.
- Morning nudge: first fire tomorrow 8am IST.
- Twilio templates: DEFERRED. Both submitted together in P1-4 session.
- coupleIdentity.js: not written. P1-4.
- Silent onboarding nudge: not built. P1-4.
- Circle summary full smoke test: DEFERRED to after P1-4 vendor disambiguation.

---

## Phase 1 sessions (status)

**P1-1 — Migration 0023 + Circle fixes ✅ DONE**
Migration 0023 applied. M2, M5, I4 shipped. Circle invite phone-tested on two phones.

**P1-2 — Receipt classifier + Surprise Me ✅ CODE DONE, partial phone test**
Receipt classifier, list_receipts, image playback phone-tested ✅
Surprise Me built. Pending full phone test (Google billing block).

**P1-3 — factual_search + Morning nudge ✅ CODE DONE, pending verification**
factual_search tool built. Pending full phone test (Google billing block).
Morning nudge cron built. Pending first fire (tomorrow 8am IST).
Twilio templates deferred — submit both together in P1-4 session.

**P1-4 — coupleIdentity.js + disambiguation fix (NEXT SESSION)**
Write src/lib/coupleIdentity.js: ensureCoupleRow(phone) + captureField(couple_id, field, value).
Wire into src/index.js at Step A, B, C entry points.
Silent onboarding nudge after 3+ exchanges.
Submit both Twilio templates at start of session.
Smoke test: same bride messages two vendors → single couples row confirmed.
After P1-4: circle summary full smoke test.

---

## PWA planning session (Session PWA-0) — required before Phase 2

Before any Phase 2 code is written, a dedicated planning session must be held.
No code until this session is complete.

Agenda:
1. Frontend framework choice (React + Vite? Next.js? Keep it simple.)
2. Auth flow detail: OTP delivery format, PIN length (4 or 6 digits), session expiry
3. Circle member scoped access: exactly which tabs/data they see vs bride
4. Tab structure final confirmation for both PWAs
5. Monorepo folder structure: src/vendorPwa/ and src/bridePwa/ or separate?
6. Railway service setup for two new services
7. Design system: Tailwind? Component library? Brand tokens for each product.
8. thedreamai.in and thedreamwedding.in domain setup and DNS
9. API endpoint structure for /chat/bride and /chat/vendor
10. Streaming implementation plan (server-sent events or websockets)

Only after all 10 agenda items are decided does Phase 2 code begin.

---

## Migration sequence (current)

| # | File | Status | What it added |
|---|---|---|---|
| 0001 | initial_schema.sql | ✅ Applied | users, vendors, couples, conversations, messages |
| 0002 | agent_substrate.sql | ✅ Applied | vendor_state, notes, pending_actions |
| 0003 | vendor_onboarding.sql | ✅ Applied | vendors.onboarding_state, invite_vendor() |
| 0004 | leads.sql | ✅ Applied | leads table |
| 0005 | tdw_handles.sql | ✅ Applied | vendors.routing_handle, instagram_handle, users.email |
| 0006 | travel_preference.sql | ✅ Applied | vendors.open_to_travel, vendors.travel_notes |
| 0007 | events_and_briefing.sql | ✅ Applied | events table, delivery_status, briefing_enabled |
| 0008 | invoices.sql | ✅ Applied | invoices table, invoice_prefix, invoice_counter |
| 0009 | message_cost_tracking.sql | ✅ Applied | messages cost columns, vendors.style_notes |
| 0010 | expenses.sql | ✅ Applied | expenses table |
| 0011 | clients.sql | ✅ Applied | clients table, leads.client_id, invoices.client_id |
| 0012 | routing_disambiguation.sql | ✅ Applied | users.pending_routing_context |
| 0013 | couples_onboarding.sql | ✅ Applied | couples.onboarding_state, couple_state, XOR |
| 0014 | conversations_xor.sql | ✅ Applied | conversations.couple_id, XOR constraint |
| 0015 | pronouns_and_dedup.sql | ✅ Applied | users.pronouns, couples.user_id UNIQUE |
| 0016 | muse_and_circle.sql | ✅ Applied | muse_saves, circle_members, circle_activity |
| 0017 | circle_sessions.sql | ✅ Applied | circle_sessions table |
| 0018 | fix_muse_saves_fk.sql | ✅ Applied | muse_saves FK ON DELETE CASCADE |
| 0019 | bride_planner.sql | ✅ Applied | couple_tasks, couple_bookings, couple_receipts, record_payment() |
| 0020 | drop_task_priority.sql | ✅ Applied | Drops priority from couple_tasks |
| 0021 | couple_receipts_label.sql | ✅ Applied | couple_receipts.label column |
| 0022 | task_event_merge.sql | ✅ Applied | Tasks → events migration. couple_tasks retired. |
| 0023 | circle_cleanup.sql | ✅ Applied 2026-05-17 | expires_at on circle_members, summary_message_id FK, unique partial index (M2), structured exceptions |
| 0024a | vendor_profile.sql | ⏳ Phase 2 | aesthetic_tags, rate_min/max, vendor_portfolio table |
| 0024b | discover.sql | ⏳ Phase 3 | couple_vendor_connections, discover_readiness, discover_eligible |

---

## Test credentials

| Item | Value |
|---|---|
| Vendor WhatsApp | +917982159047 |
| Bride WhatsApp | +14787788550 |
| Test vendor phone (Dev) | +918757788550 |
| Test vendor UUID | 2eb5d3fb-31eb-4b26-859a-cf10ae477d53 |
| Test vendor routing_handle | DEV550 |
| Test vendor 2 (Swati) | SWATI978, UUID e036ea4d-3f9a-4ec5-ba89-a5defa3a042b |
| Test bride phone (Swati) | +919888294440 |
| Test bride couple_id | 7abccc1b-0698-43ba-9709-c6a1e52af789 |
| Test bride phone (Meha) | +919625759924 |
| Supabase | nvzkbagqxbysoeszxent (Mumbai, ap-south-1) |
| Railway vendor | https://dream-os-production.up.railway.app |
| Railway bride | https://dream-wedding-production-6cef.up.railway.app |
| Admin | https://dream-os-production.up.railway.app/admin |
| Google Cloud | dream-os (gen-lang-client-0017514064) dev@thedreamwedding.in |
| Cloudinary | dccso5ljv |
| Anthropic workspace | dream-os |

---

## Railway env vars

| Var | Value |
|---|---|
| TWILIO_WHATSAPP_NUMBER | whatsapp:+917982159047 |
| TDW_WA_NUMBER | 917982159047 |
| BRIDE_WA_NUMBER | 14787788550 |
| ANTHROPIC_API_KEY | (in Railway) — workspace: dream-os |
| GOOGLE_API_KEY | (in Railway) — Google AI Studio, dev@thedreamwedding.in |
| ADMIN_PASSWORD | (in Railway) |
| SUPABASE_URL | (in Railway) |
| SUPABASE_SERVICE_ROLE_KEY | (in Railway) |

---

## Document discipline

Active documents (updated every session):
- HANDOVER_FINAL.md — this document. Single active handover. Fully rewritten each session.
- ROADMAP_FINAL.md — single active roadmap.
- SCHEMA.md — unified schema reference. Updated with every migration.

Frozen documents (historical record, do not update):
- HANDOVER.md — frozen at vendor 8.5a
- HANDOVER_BRIDE.md — frozen at bride B3
- ROADMAP.md — frozen at vendor 8.5a
- ROADMAP_BRIDE.md — frozen at bride B3
- B1_SPEC.md — historical spec

Session not complete until HANDOVER_FINAL.md, ROADMAP_FINAL.md, and SCHEMA.md
are committed and pushed. No exceptions.
