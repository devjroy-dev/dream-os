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
- create_lead — extracts structured data from natural language enquiries, creates leads row
- list_leads — returns pipeline summary when vendor asks
- update_lead_state — moves lead through lifecycle on vendor signal

### System prompt (src/agent/systemPrompt.js)
- Agent now detects enquiries automatically and calls create_lead without being asked
- Lead vs referrer distinction — referrer_name and lead name are separate fields
- Hard zero-commentary rule — no opinions, observations, or encouragement
- "Got it — [details]. [Single question]?" format enforced for lead confirmations
- Rule 8: never say "[name]'s in" — sounds like a booking confirmation
- openLeadsCount injected into prompt for pipeline awareness

### Engine (src/agent/engine.js)
- Post-processing: strips everything after first ? in every reply — model-proof commentary removal
- openLeadsCount loaded from leads table and passed to system prompt

### Admin (src/admin/views/detail.js + router.js)
- Leads tab on vendor detail page — shows all leads with name, date, city, budget, state, received time
- Router fetches leads in parallel with messages and notes

### Fixes via Claude Code
- respond_to_vendor tool description constrains format directly in tool schema
- Post-processing in engine.js truncates after first ?
- Lead/referrer distinction in system prompt
- Zero-commentary rule hardened across multiple iterations

## Verified working
- Forwarded enquiry → lead created in Supabase automatically ✅
- Correct extraction: name, date, city, budget, source, referrer ✅
- Referrer correctly separated from lead name (Anjali referral ≠ Anjali lead) ✅
- Admin leads tab shows leads with correct data ✅
- No commentary after lead confirmation ✅
- Reply format: "Got it — [details]. [Single question]?" ✅
- Test: Preethi, March 22 Hyderabad, 2.5L, Anjali referral → clean reply ✅

## Known gaps (fix in Session 5)
1. Agent cannot send replies to couples — vendor must copy-paste manually
2. No lead deduplication — same couple can create multiple lead rows
3. list_leads returns raw data — agent sometimes formats it awkwardly
4. update_lead_state requires lead UUID — vendor can't say "mark Preethi as booked" yet (needs name-based lookup)
5. wa.me link still hardcoded to sandbox — update when +91 arrives
6. Pricing model still single string — multiple packages not yet structured

## Test credentials
- Sandbox WhatsApp: +1 415 523 8886 (join code: acres-eventually)
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
