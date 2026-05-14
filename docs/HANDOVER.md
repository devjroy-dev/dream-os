# dream-os -- Session Handover
**Last updated:** 2026-05-14
**Session:** 5
**Version:** 0.5.0

## What shipped this session

### Migration 0005 (db/migrations/0005_tdw_handles.sql)
- vendors.routing_handle -- UNIQUE, uppercase, alphanumeric + hyphen. TDW code suffix e.g. DEV-550
- vendors.instagram_handle -- raw IG handle without @. NULL for now, collected naturally post-onboarding
- users.email -- collected naturally in conversation, no dedicated onboarding step
- Index: vendors_routing_handle_idx for fast routing lookups on every inbound message

### Migration 0006 (db/migrations/0006_travel_preference.sql)
- vendors.open_to_travel -- boolean, default false. Set during onboarding
- vendors.travel_notes -- raw travel preference as vendor stated it

### Onboarding (src/agent/onboarding.js)
Final state chain: new -> asked_category -> asked_city -> asked_travel -> asked_rate -> complete

Step by step:
- new: "Hi [Name] -- Swati mentioned a little bit about you..." asks what they do
- asked_category: saves category lowercase, asks city
- asked_city: saves city, asks about travel
- asked_travel: regex detects open/yes/travel/anywhere/pan-india -> open_to_travel = true, else false. Saves travel_notes. Asks rate.
- asked_rate: saves rate to vendor_state + note. Auto-assigns TDW handle (FIRSTNAME-PHONE3 cascade). Sets onboarding_state = complete. Sends completion message with TDW link.

TDW handle auto-generation (no vendor input needed):
- Cascade: FIRSTNAME-PHONE3 -> FIRSTNAME-PHONE4 -> FIRSTNAME-PHONE3PHONE4 -> FIRSTNAME-TIMESTAMP6
- Each candidate checked for uniqueness in DB before use
- Phone number is unique per vendor so collision is near impossible for 50-vendor cohort

Completion message (exact, locked):
"Perfect -- you're all set. Here's your TDW link: wa.me/[TDW_WA_NUMBER]?text=TDW-[HANDLE] -- put this in your Instagram bio so couples can reach you directly. Or you just send me the messages you receive. From here just talk to me like you'd talk to a trusted assistant."

TDW_WA_NUMBER env var: set to 14787788550 in Railway. Swap to 91XXXXXXXXX when +91 arrives. No code change needed.

### Couple routing (src/index.js)
Three-mode routing for any non-vendor number:

Mode 1 -- Returning couple
- Check: conversations table has counterparty_phone = this number and kind = couple_thread
- Action: log message to thread, notify vendor: "Message from your enquiry: [body]"

Mode 2 -- TDW code
- Check: first word stripped of TDW- prefix matches vendors.routing_handle (case insensitive via UPPER)
- Works with or without TDW- prefix: DEV-550 and TDW-DEV-550 both route correctly
- Action: create couple_thread, log message, create lead (deduped on vendor_id + phone), notify vendor: "New enquiry via your TDW link. They said: [body]"
- Lead dedup: one lead per (vendor_id, counterparty_phone), ever

Mode 3 -- Fallback
- No match: "Hi! To reach a TDW vendor, send their TDW code -- you'll find it in their Instagram bio or the link they shared."

### Admin (src/admin/views/detail.js)
- Vendor detail shows TDW Link (clickable wa.me link) and Instagram handle
- TDW_WA_NUMBER from env var

### System prompt (src/agent/systemPrompt.js)
- Travel availability added to vendor profile context
- Rule added: never mention or construct TDW links -- handled by onboarding only

## Railway env vars (current)
- TWILIO_WHATSAPP_NUMBER = whatsapp:+14787788550
- TDW_WA_NUMBER = 14787788550

## Smoke tests passed
- Full onboarding 4 steps: category, city, travel, rate -> TDW link sent automatically
- TDW handle auto-generated as FIRSTNAME-PHONE3 (DEV-550)
- Mode 3 fallback: unknown number gets TDW code prompt
- Mode 2: TDW-DEV-550 routed correctly, vendor notified instantly
- Mode 1: returning couple routed without TDW code

## Known gaps (fix in Session 5.5 and beyond)
1. Couple gets no response after sending TDW code -- silent after Mode 2 (Session 5.5)
2. No couple-facing agent -- couples not asked for wedding details (Session 5.5)
3. Agent improvises TDW-related replies post-onboarding -- system prompt rule added but needs testing
4. update_routing_handle tool not built -- vendor cannot change handle via WhatsApp (Session 6)
5. No lead deduplication on vendor-forwarded messages -- only Mode 2 deduped
6. update_lead_state still requires UUID -- name-based update deferred to Session 8
7. No status callback URL on Twilio -- needed for Session 6 delivery receipts

## WhatsApp numbers reference
| Number | Currently points to | Notes |
|---|---|---|
| +14155238886 | Twilio sandbox | Retired from dream-os |
| +14787788550 | dream-os Railway | Active now |
| +91XXXXXXXXX | Pending Twilio approval | Will become primary |

When +91 arrives:
1. Update TWILIO_WHATSAPP_NUMBER -> whatsapp:+91XXXXXXXXX
2. Update TDW_WA_NUMBER -> 91XXXXXXXXX
3. Point +14787788550 back to dream-wedding
4. No code changes needed

## Test credentials
- WhatsApp: +14787788550
- Test vendor phone: +918757788550
- Test vendor UUID: 2eb5d3fb-31eb-4b26-859a-cf10ae477d53
- Test vendor user UUID: f1d6d3af-a828-4e42-98ab-862b05dbc110
- Supabase project: nvzkbagqxbysoeszxent (Mumbai)
- Railway: https://dream-os-production.up.railway.app
- Admin: https://dream-os-production.up.railway.app/admin

## First thing next session (5.5)
curl https://dream-os-production.up.railway.app
Should return: {"status":"alive","service":"dream-os","version":"0.5.0"}

Session 5.5 goal: couple-facing agent. When Mode 2 fires, couple gets a response from the agent
asking for wedding details. Agent collects info, creates structured lead, notifies vendor with summary.

## Document update protocol
HANDOVER.md -- fully rewritten every session
SCHEMA.md -- fully rewritten every session
ROADMAP.md -- updated every session
git add docs/ && git commit -m "docs: session N handover, schema, roadmap" && git push
