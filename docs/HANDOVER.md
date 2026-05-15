# dream-os -- Session Handover
**Last updated:** 2026-05-15
**Session:** 8.5
**Version:** 8.5

## What shipped this session

### Migration 0011 (db/migrations/0011_clients.sql)
- `clients` table: id, vendor_id, user_id (nullable), name, phone, email, source, referrer_name, notes, created_at, updated_at
- Partial unique index `clients_vendor_phone_unique` on `(vendor_id, phone) WHERE phone IS NOT NULL` — allows multiple phoneless clients
- `leads.client_id` uuid FK (SET NULL) — promotion link
- `invoices.client_id` uuid FK (SET NULL) — alongside existing lead_id
- Realtime enabled, set_updated_at trigger, 2 indexes

### Migration 0012 (db/migrations/0012_routing_disambiguation.sql)
- `users.pending_routing_context` jsonb (nullable)
- Stores either pending-question state `{ candidate_vendor_ids, original_message, asked_at }` or sticky-resolution state `{ sticky_vendor_id, sticky_until }`
- Single column repurposed for both — distinguished by which keys are present

### Clients model — resolveOrCreateClient helper (src/lib/clients.js)
- Single allowed door for client creation
- Phone-based dedup, names never matched
- Returns `{ client, created }` so callers know whether new row inserted
- Used by both add_client tool and promotion logic in record_payment

### add_client + list_clients tools (src/agent/tools.js + engine.js)
- add_client: name, phone (preferred), email, referrer_name, notes — calls helper
- list_clients: returns 10 most recent clients for the vendor
- add_client also back-links existing leads with matching phone (closes lead-orphan gap)
- System prompt updated with tool descriptions

### Lead → client promotion (src/agent/engine.js record_payment)
- Trigger: advance_paid or paid state transition
- Silent, best-effort (wrapped in try/catch, non-fatal)
- If invoice.lead_id present and lead has no client_id → calls helper with lead's name+phone
- If lead already has client_id → stamps it on invoice
- Phone-based dedup means same person paying twice doesn't create duplicate client

### create_lead dedup + auto-link (src/agent/engine.js)
- Phone-based dedup before insert — same vendor+phone returns existing lead
- Auto-links to existing client if phone matches (silent stamp on lead.client_id at creation)

### Admin Clients tab (src/admin/router.js + src/admin/views/detail.js)
- 5th tab on vendor detail page: Leads / Enquiries / Notes / Money / Clients
- Table: name, phone, email, source (Manual / Promoted from lead / Discover), referrer, added
- Same-name duplicate detection — yellow "possible duplicate" pill on matching names
- Source pills colour-coded (manual=grey, promoted=green, discover=purple)
- Collapsible rows (5 visible by default, "Show N more" expands inline)

### Admin messages panel — newest first (src/admin/router.js)
- Was `ascending: true + limit(100)` — hid newest messages once vendor had 100+ total
- Now `ascending: false + limit(100) + reverse()` — guarantees most recent 100 always present
- Display order in UI stays oldest-to-newest

### Multi-vendor couple routing fix (src/index.js + src/agent/disambiguation.js)
- New routing order: Step A (pending disambiguation reply) → Step A.5 (sticky vendor) → Step B (TDW code) → Step C (count threads)
- TDW code always wins over thread history (the original Mode 1 bug)
- Step A.5: sticky-fresh check — if recently resolved disambiguation, route directly to that vendor for 30 min
- Step C: 0 threads → Mode 3 fallback, 1 thread → route there, 2+ → ask disambiguation question
- buildDisambiguationQuestion: "Hi! Should I send this to <Vendor A> or <Vendor B>?"
- interpretDisambiguationReply: Haiku call returns matched_vendor_id + confidence
- High-confidence match clears pending, routes original message to matched vendor's thread
- TDW code in clarification reply short-circuits disambiguation and falls through to Step B
- Sticky window 30 min, extended by each subsequent sticky-routed message

### Returning-bride detection (src/agent/engine.js + coupleSystemPrompt.js)
- Detection: lead row exists for (vendor_id, couple_phone) → returning bride
- Two prompt paths in buildCoupleSystemPrompt — first-contact (existing) vs returning-bride (new)
- Returning-bride flow: brief acknowledgment, no onboarding questions, "Vendor will be in touch"
- Vendor notification suppressed for returning brides on TDW-code-routed turns
- Replaced with forwarded notification: `"<leadName> just messaged: '<verbatim body>'"`

### System prompt — tool-call discipline rule (src/agent/systemPrompt.js)
- New section: "TOOL CALLS — CRITICAL RULE"
- Tells agent to always call data-mutation tools when vendor uses action verbs (add/save/create/log)
- Never refuse based on contextual name matches — tool's own dedup handles duplicates
- Reduced (not eliminated) the agent-shortcut behavior

## Smoke tests passed
- Migration 0011 applied: 11 columns, partial unique index, FKs verified
- Migration 0012 applied: jsonb column live, used by both pending and sticky state
- add_client end-to-end: WhatsApp → tool → row in DB → dedup hit on retry → 1 row only
- Promotion path: code-level only (no live advance-paid test this session) — defer to Session 8.5a
- Multi-vendor routing live test: TDW-DEV550 + TDW-SWATI978 from real second phone → two threads, no merging
- Disambiguation question fired when threadCount=2
- pending_routing_context populated with candidate_vendor_ids + original_message
- Haiku interpretation of "Dev" → high-confidence match → routed to existing Dev thread
- Returning-bride detection fired correctly on Dev's side (existing lead)
- "Let me check with Dev and get back to you" contextual reply, no greeting
- Sticky disambiguation: "Asap" (sticky=Dev) routed directly, no re-disambiguation
- Vendor forwarded notification: "Meha just messaged: 'Asap'" delivered to Dev's phone
- Admin Clients tab renders with duplicate detection pill

## Bugs discovered THIS session — all deferred to Session 8.5a

Naming convention: 8.5a labels the next session as a cleanup of bugs originating in 8.5. This is founder's incompetency-traceability discipline — bug-fix sessions named after the session that birthed them.

1. **Empty inbound messages crash webhook.** Media-only messages (images, voice notes) arrive with empty Body. Anthropic API rejects empty user messages → 500. Today's logs show this hit twice when images were sent from a phone.
2. **Agent occasionally shortcuts tool calls.** Despite system prompt fix, ~1 in 6 messages with action verbs still get a hallucinated dedup reply without the tool actually running. Needs engine-level guardrail.
3. **Returning-bride notification falls back to generic "Returning enquiry just messaged" when leadName is null.** Happens when bride is detected as returning but the lead row has no name yet (Swati-side observed today).
4. **Single-thread couple routing has wrong user_id lookup.** Line ~390 in src/index.js uses `existingThread.vendors.users?.id || existingThread.vendor_id` — second fallback is a vendor uuid being queried against users.id. Silent miss, doesn't crash, but vendor notification wouldn't fire for that path.
5. **UUIDs leak into vendor replies.** add_client returns "Client added. ID: 4e3a-..." — cosmetic, polish.
6. **list_clients caps at 10 silently.** No "showing 10 of N" suffix.
7. **Typo'd TDW codes silently route to sticky vendor.** Bride typing "swa978" (no TDW- prefix) → no Step B match → sticky=Dev catches it → message routed to Dev with no context. Not strictly a bug but bad UX.

## Pre-existing gaps (not new this session)
1. Twilio status callback: many `[twilio-status] no message row for sid=...` log lines today — pre-existing 5.5 race condition.
2. No Anthropic credit-low warning — agent fails silently if credits run out.
3. update_lead_state requires UUID — name-based update deferred to Session 8.
4. Classifier context gap: prior Sonnet turn outside 2-turn history may route to Haiku.
5. vendors.rate_min / rate_max not yet added — Session 9 migration.
6. Railway running in EU West, Supabase in Mumbai — move before scaling beyond 50 vendors.
7. PDF generation causes 3-5 second silence in record_payment — no interim acknowledgement. Session 8.5a.
8. Lead/invoice ↔ client connections not surfaced in admin Leads / Money tabs — Session 8.
9. Couple agent hardcoded to Haiku — no Sonnet routing for complex returning-bride questions. Session 9.
10. Phoneless client dedup blind spot — when manually-added client has no phone, lead-promotion for same person can create duplicate. Admin tab flags same-name pairs. Disambiguation pattern reuse — future.

## Session 8.5a scope (next session — focused cleanup)

Goal: Resolve all bugs discovered during Session 8.5 production testing.

Items:
- PDF interim acknowledgement in record_payment (was Step 11 of 8.5)
- Defensive check for empty inbound messages (media-only crash)
- Engine-level guardrail for agent tool-call shortcut behavior
- Better fallback for returning-bride vendor notification when leadName is null
- Fix single-thread couple routing user_id lookup
- Strip UUIDs from add_client reply (system prompt nudge)
- "Showing 10 of N" suffix in list_clients
- "Did you mean SWATI978?" UX for typo'd TDW codes (if time)

Estimated time: 60-90 minutes

## Railway env vars (current)
- TWILIO_WHATSAPP_NUMBER = whatsapp:+14787788550
- TDW_WA_NUMBER = 14787788550
- ANTHROPIC_API_KEY (workspace: dream-os, model lock: haiku-4-5-20251001 + sonnet-4-6)
- GOOGLE_API_KEY (Google AI Studio, dev@thedreamwedding.in, free tier)
- ADMIN_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (all in Railway)

## Test credentials
- WhatsApp: +14787788550
- Test vendor phone (Dev): +918757788550
- Test vendor UUID: 2eb5d3fb-31eb-4b26-859a-cf10ae477d53
- Test vendor routing_handle: DEV550
- Second test vendor (Swati): routing_handle SWATI978, UUID e036ea4d-3f9a-4ec5-ba89-a5defa3a042b
- Test couple phone (Meha, Dev's second number): +919625759924
- Supabase: nvzkbagqxbysoeszxent (Mumbai)
- Railway: https://dream-os-production.up.railway.app
- Admin: https://dream-os-production.up.railway.app/admin

## First thing next session (8.5a)
curl https://dream-os-production.up.railway.app
Should return: {"status":"alive","service":"dream-os","version":"0.8.5"}

If +91 number has arrived: do Session 6.5 before anything else.
Otherwise: start Session 8.5a (bug cleanup from Session 8.5).

## Document update protocol
Four files updated every session:
- HANDOVER.md — fully rewritten
- SCHEMA.md — fully rewritten
- ROADMAP.md — updated
- UNIT_ECONOMICS.md — Dev's reference only, no other session amends it
