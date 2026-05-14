# dream-os — Session Handover
**Last updated:** 2026-05-14
**Session:** 5
**Version:** 0.5.0

## What shipped this session

### Migration 0005 (db/migrations/0005_tdw_handles.sql)
- vendors.routing_handle — UNIQUE, uppercase, alphanumeric + hyphen. TDW code suffix e.g. RAHULCLICKS
- vendors.instagram_handle — raw IG handle as vendor provided (without @). NULL if skipped
- users.email — collected naturally in conversation, no dedicated onboarding step
- Index: vendors_routing_handle_idx for fast routing lookups on every inbound message

### Onboarding (src/agent/onboarding.js)
- New step: asked_instagram inserted between asked_rate and complete
- Full state chain: new -> asked_category -> asked_city -> asked_travel -> asked_rate -> asked_handle -> complete
- asked_travel: detects open/yes/travel/anywhere as true, else false. Saves travel_notes. Advances to asked_rate.
- asked_handle: vendor picks their own TDW handle. If taken, agent replies with suggestion and loops. If vendor says suggest/you pick/anything, auto-generates from FIRSTNAME-CITY cascade. Instagram handle extracted if @ present.
- Handle normalisation: strip @, uppercase, strip all non-alphanumeric except hyphen
- Handle generation cascade: FIRSTNAME-CITY -> FIRSTNAME-CATEGORY -> FIRSTNAME-PHONE4 -> FIRSTNAME-TIMESTAMP
- Uniqueness: each candidate checked against DB before use
- Completion message (exact, locked):
  "Perfect — you're all set. Here's your TDW link: wa.me/[TDW_WA_NUMBER]?text=TDW-[HANDLE] — put this in your Instagram bio so couples can reach you directly. Or you just send me the messages you receive. From here just talk to me like you'd talk to a trusted assistant."
- TDW_WA_NUMBER env var: defaults to 14787788550, swap to 91XXXXXXXXX when +91 arrives

### Couple routing (src/index.js)
Three-mode routing replaces the old dead-end for non-vendor numbers:

Mode 1 — Returning couple
- Check: conversations table has row with counterparty_phone = this number and kind = couple_thread
- Action: log message to thread, notify vendor on their self-thread: "Message from your enquiry: [body]"
- No TDW code needed — covers all repeat messages

Mode 2 — TDW code
- Check: first word of message (stripped of TDW- prefix) matches vendors.routing_handle
- Action: create couple_thread conversation -> log message -> create lead (deduped on vendor_id + phone) -> notify vendor: "New enquiry via your TDW link. They said: [body]"
- Lead dedup: one lead per (vendor_id, counterparty_phone), ever

Mode 3 — Fallback
- No Mode 1 or Mode 2 match
- Reply: "Hi! To reach a TDW vendor, send their TDW code — you'll find it in their Instagram bio or the link they shared."

### Admin (src/admin/views/detail.js)
- Vendor detail now shows TDW Link (clickable wa.me link) and Instagram (linked @handle)
- TDW_WA_NUMBER read from env var — survives number swap without code change

## Railway env var to add
TDW_WA_NUMBER = 14787788550
(No whatsapp: prefix, no +, just the digits. Swap to 91XXXXXXXXX when +91 arrives.)

## Verified working
- [ ] curl https://dream-os-production.up.railway.app -> version 0.5.0
- [ ] New vendor onboarding: all 5 steps fire in order
- [ ] Vendor with Instagram handle -> handle set to normalised IG handle
- [ ] Vendor who skips Instagram -> handle auto-generated FIRSTNAME-CITY
- [ ] Completion message contains correct TDW link
- [ ] Unknown number sends TDW-[HANDLE] -> vendor notified, lead created
- [ ] Same couple messages again -> Mode 1 routing, vendor notified
- [ ] Random message with no TDW code -> Mode 3 fallback reply
- [ ] Admin vendor detail shows TDW link and Instagram

## Known gaps (fix in Session 6+)
1. Agent cannot send replies to couples — vendor copy-pastes manually
2. No lead deduplication on vendor-forwarded messages — only Mode 2 deduped
3. update_lead_state still requires UUID — name-based update deferred to Session 8
4. No status callback URL on Twilio — needed for Session 6 delivery receipts
5. Draft-reply-to-couple capability not yet assigned to a session — owned by this assistant, ship in Session 6

## WhatsApp numbers reference
| Number | Currently points to | Notes |
|---|---|---|
| +14155238886 | Twilio sandbox | Retired from dream-os |
| +14787788550 | dream-os Railway | Active now, TDW_WA_NUMBER set to this |
| +91XXXXXXXXX | Pending Twilio approval | Will become primary dream-os number |

When +91 arrives:
1. Point +91 -> dream-os (update TWILIO_WHATSAPP_NUMBER Railway env var)
2. Point +14787788550 -> dream-wedding
3. Update TDW_WA_NUMBER Railway env var to 91XXXXXXXXX (no + prefix)
4. No code changes needed — fully parameterised

## Test credentials
- WhatsApp: +14787788550 (no join code needed)
- Test vendor phone: +918757788550
- Test vendor UUID: 2eb5d3fb-31eb-4b26-859a-cf10ae477d53
- Test vendor user UUID: f1d6d3af-a828-4e42-98ab-862b05dbc110
- Test conversation UUID: c2740497-6f40-4469-8bc1-8d66c9bda7bd
- Supabase project: nvzkbagqxbysoeszxent (Mumbai)
- Railway URL: https://dream-os-production.up.railway.app
- Admin URL: https://dream-os-production.up.railway.app/admin

## First thing next session
curl https://dream-os-production.up.railway.app
Should return: {"status":"alive","service":"dream-os","version":"0.5.0"}

Reset test vendor onboarding_state to 'asked_rate' in Supabase to test the new asked_instagram step:
update vendors set onboarding_state = 'asked_rate' where id = '2eb5d3fb-31eb-4b26-859a-cf10ae477d53';

## Document update protocol
HANDOVER.md — fully rewritten every session
SCHEMA.md — fully rewritten every session
ROADMAP.md — updated every session
All three committed before session closes. No exceptions.
git add docs/ && git commit -m "docs: session N handover, schema, roadmap" && git push
