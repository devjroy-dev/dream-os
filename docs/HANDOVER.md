# dream-os — Session Handover
**Last updated:** 2026-05-14
**Session:** 4
**Version:** 0.4.0

## What shipped this session

### leads table (migration 0004)
- New table: leads (vendor_id, name, phone, email, wedding_date, wedding_city, event_types, budget_min, budget_max, source, referrer_name, state, raw_message, notes)
- States: new → contacted → quoted → booked → lost
- Realtime enabled
- Indexed on vendor_id, state, created_at, wedding_date

### New agent tools (src/agent/tools.js)
- create_lead — extracts structured data from natural language, creates leads row
- list_leads — returns pipeline summary when vendor asks
- update_lead_state — moves lead through lifecycle on vendor signal

### System prompt (src/agent/systemPrompt.js)
- Agent detects enquiries automatically, calls create_lead without being asked
- Lead vs referrer distinction — referrer_name and lead name always separate
- Hard zero-commentary rule — no opinions, observations, encouragement
- "Got it — [details]. [Single question]?" format enforced
- Rule 8: never say "[name]'s in" — sounds like a booking confirmation
- openLeadsCount injected into prompt for pipeline awareness

### Engine (src/agent/engine.js)
- Post-processing: strips everything after first ? — model-proof commentary removal
- openLeadsCount loaded from leads table and passed to system prompt

### Admin (src/admin/views/detail.js + router.js)
- Leads tab on vendor detail page — name, date, city, budget, state, received time
- Router fetches leads in parallel with messages and notes

### WhatsApp number change
- Switched from Twilio sandbox (+14155238886) to +14787788550
- +14787788550 is Meta-verified, no join code needed, production-ready
- Twilio webhook updated to: https://dream-os-production.up.railway.app/webhook/whatsapp
- Railway env var updated: TWILIO_WHATSAPP_NUMBER=whatsapp:+14787788550
- wa.me links updated in admin invite page
- Sandbox warning removed from invite page
- Plan: when +91 number arrives → point +91 to dream-os, point +14787788550 back to dream-wedding

### Twilio template notes
- +14787788550 has existing Meta-approved templates from dream-wedding product
- These are harmless — dream-os doesn't call them
- New templates needed in Session 6 for morning briefing (outbound messages)
- Template approval takes 1-7 days — submit at start of Session 6

### Fixes via Claude Code
- respond_to_vendor tool description constrains format in tool schema
- Post-processing in engine.js truncates after first ?
- Lead/referrer distinction in system prompt
- Zero-commentary rule hardened
- wa.me link updated from sandbox to +14787788550

## Verified working
- Forwarded enquiry → lead created automatically ✅
- Correct extraction: name, date, city, budget, source, referrer ✅
- Referrer correctly separated from lead name ✅
- Admin leads tab shows leads correctly ✅
- No commentary after lead confirmation ✅
- Reply format: "Got it — [details]. [Single question]?" ✅
- Test: Preethi, March 22 Hyderabad, 2.5L, Anjali referral → clean reply ✅
- Onboarding smoke test: all 4 steps pass ✅
- +14787788550 wired to dream-os ✅

## Known gaps (fix in Session 5)
1. Agent cannot send replies to couples — vendor copy-pastes manually
2. No lead deduplication — same couple can create multiple rows
3. update_lead_state requires lead UUID — vendor can't say "mark Preethi as booked" by name yet
4. No TDW routing handles yet — couple routing not built
5. No asked_instagram onboarding step yet — TDW link not sent to vendors on completion
6. Pricing model still single string — multiple packages not structured
7. No status callback URL wired on Twilio — needed for Session 6 delivery receipts

## WhatsApp numbers reference
| Number | Currently points to | Notes |
|---|---|---|
| +14155238886 | Twilio sandbox | Requires join acres-eventually — retired from dream-os |
| +14787788550 | dream-os Railway | Meta-verified, production-ready, active now |
| +91XXXXXXXXX | Pending Twilio approval | Will become primary dream-os number |

When +91 arrives:
1. Point +91 → dream-os (update TWILIO_WHATSAPP_NUMBER Railway env var)
2. Point +14787788550 → dream-wedding (update Twilio webhook back)
3. Update wa.me links in admin invite page
4. Update TDW link format in onboarding completion message

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
Should return: {"status":"alive","service":"dream-os","version":"0.4.0"}

Send a WhatsApp to +14787788550 — should get agent response with no join code.
Then read SCHEMA.md and ROADMAP.md before writing anything.

## Document update protocol
HANDOVER.md — fully rewritten every session
SCHEMA.md — fully rewritten every session
ROADMAP.md — updated every session
All three committed before session closes. No exceptions.
git add docs/ && git commit -m "docs: session N handover, schema, roadmap" && git push

## Repo access
git clone https://github.com/devjroy-dev/dream-os.git
Read docs/ before touching anything.
