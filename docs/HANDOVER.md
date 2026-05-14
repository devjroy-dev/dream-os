# dream-os -- Session Handover
**Last updated:** 2026-05-14
**Session:** 5.5
**Version:** 0.5.5

## What shipped this session

### Couple-facing agent (src/agent/coupleSystemPrompt.js + src/agent/engine.js)
- New file: coupleSystemPrompt.js -- Haiku prompt for talking to couples on vendor's behalf
- New function: runCoupleAgenticTurn in engine.js -- separate agentic loop for couple_thread conversations
- New tool: capture_couple_lead -- upserts lead with structured data collected from couple
- Couple flow: TDW code -> greeting -> occasion -> date/city -> budget -> name -> warm close
- Exact locked first message: "Hey! Thanks for reaching out. I'm [vendorName]'s assistant. What's the occasion you're planning -- wedding, birthday, corporate event, or something else?"
- Name collected last (commitment psychology)
- Past date fix: if parsed date is in past, bumped forward 1-2 years
- Vendor notified with structured summary: "New enquiry from [phone]. Name: X, Occasion: Y, Date: Z, City: W, Budget: Rs N. Lead saved."

### Mode 1 and Mode 2 routing updated (src/index.js)
- Both modes now run runCoupleAgenticTurn instead of silent/notify-only
- Couple gets agent response immediately after Mode 2 TDW match
- Mode 1 returning couple also gets agent response
- Vendor gets immediate basic notification, then structured summary after lead captured

### Admin (src/admin/views/detail.js + src/admin/router.js)
- Two-column white layout restored (left: profile, right: messages, tabs below)
- Fixed 520px height message panel, latest message at top
- Phone column added to leads table
- Enquiries tab added -- shows all couple_thread conversations with full message history
- TDW link and Instagram rows in profile
- renderDetail export fixed (was detailPage in router.js)

### System prompt fixes (src/agent/systemPrompt.js)
- TDW handle questions deflected: "Your TDW link was sent when you completed onboarding -- check that message."
- list_leads always called fresh when vendor asks for specific lead details -- no hallucination
- Draft reply to couple blocked: "Reply to them directly on WhatsApp -- I'll track it when you update me."

### list_leads tool fix (src/agent/engine.js)
- Phone added to select query and summary line
- Vendor can now ask "any leads with phone number?" and get real numbers back

### TDW handle format change
- Old format: FIRSTNAME-PHONE3 e.g. DEV-550
- New format: FIRSTNAMEPHONE3 e.g. DEV550
- wa.me link: wa.me/14787788550?text=TDW-DEV550
- Couples send: TDW-DEV550 or DEV550 (both work)
- DB updated for test vendor: routing_handle = DEV550

## Verified working
- TDW-DEV550 -> couple gets exact locked greeting ✅
- Couple flow: occasion -> date/city -> budget -> name -> close ✅
- Vendor notified with full structured summary ✅
- Lead created with name, phone, date, city, budget, occasion ✅
- Mode 1 returning couple gets agent response ✅
- Admin Enquiries tab shows couple threads ✅
- Admin leads table shows phone number ✅
- Vendor asks for lead phone -> Haiku fetches fresh, returns correct number ✅
- Vendor asks to draft reply -> agent deflects cleanly ✅
- Vendor asks about TDW handle -> agent deflects to onboarding message ✅

## Test reset SQL (run in Supabase to clean test data)
-- Delete couple thread
delete from messages where conversation_id in (
  select id from conversations where counterparty_phone = '+919625759924'
);
delete from leads where phone = '+919625759924';
delete from conversations where counterparty_phone = '+919625759924';
delete from users where phone = '+919625759924';

-- Clean vendor messages
delete from messages where conversation_id = 'c2740497-6f40-4469-8bc1-8d66c9bda7bd';

-- Clean duplicate onboarding notes (keep latest 5 only)
delete from notes
where vendor_id = '2eb5d3fb-31eb-4b26-859a-cf10ae477d53'
and tags && array['onboarding']
and id not in (
  select id from notes
  where vendor_id = '2eb5d3fb-31eb-4b26-859a-cf10ae477d53'
  and tags && array['onboarding']
  order by created_at desc
  limit 5
);

-- Clear vendor_state cache
update vendor_state
set recent_notes = '[]'
where vendor_id = '2eb5d3fb-31eb-4b26-859a-cf10ae477d53';

## Known gaps (Session 6+)
1. update_routing_handle tool not built -- vendor cannot change TDW handle via WhatsApp (Session 6)
2. No lead dedup on vendor-forwarded messages -- only Mode 2 deduped
3. update_lead_state requires UUID -- name-based update deferred to Session 8
4. No status callback URL on Twilio -- needed for Session 6 delivery receipts
5. Onboarding is a dumb state machine -- no Haiku, no normalisation (Session 8.1)
6. Agent context gets confused with many test resets -- duplicate notes in vendor context. Production use will be clean.
7. Smart routing Haiku/Sonnet not yet live -- Session 8.1
8. Vendor cannot reply to couple through dream-os yet -- Session 6

## Railway env vars (current)
- TWILIO_WHATSAPP_NUMBER = whatsapp:+14787788550
- TDW_WA_NUMBER = 14787788550

## WhatsApp numbers reference
| Number | Currently points to | Notes |
|---|---|---|
| +14155238886 | Twilio sandbox | Retired |
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
- Test conversation UUID: c2740497-6f40-4469-8bc1-8d66c9bda7bd
- Supabase: nvzkbagqxbysoeszxent (Mumbai)
- Railway: https://dream-os-production.up.railway.app
- Admin: https://dream-os-production.up.railway.app/admin

## First thing next session
curl https://dream-os-production.up.railway.app
Should return: {"status":"alive","service":"dream-os","version":"0.5.5"}

Session 6 goal: morning briefing cron + update_routing_handle tool + Twilio template submission.

## Document update protocol
HANDOVER.md -- fully rewritten every session
SCHEMA.md -- fully rewritten every session
ROADMAP.md -- updated every session
git add docs/ && git commit -m "docs: session N handover, schema, roadmap" && git push
