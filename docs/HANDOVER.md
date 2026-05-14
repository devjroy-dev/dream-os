# dream-os -- Session Handover
**Last updated:** 2026-05-14
**Session:** 6
**Version:** 0.6.0

## What shipped this session

### Repo hygiene (unplanned -- surfaced during session)
- Backfilled Session 5.5 docs that were never committed (HANDOVER.md, SCHEMA.md, package.json 0.5.0->0.5.5)
- Removed 6 Claude Code scratch files accidentally committed in Sessions 5 and 5.5
- Added .gitignore patterns to prevent future scratch file pollution at repo root

### Migration 0007 (db/migrations/0007_events_and_briefing.sql)
- events table: id, vendor_id, title, event_date, event_time, kind, linked_lead_id, state, notes, created_at, updated_at
- kind CHECK constraint: shoot / call / meeting / task / reminder / recce / other
- state CHECK constraint: upcoming / done / cancelled
- 4 indexes: vendor_id, event_date, state, compound (vendor_id + event_date + state)
- messages.delivery_status column (text, nullable) -- updated by Twilio status callbacks
- vendors.briefing_enabled boolean (not null, default true) -- per-vendor kill switch

### WhatsApp refactor (src/lib/whatsapp.js)
- Extracted sendWhatsApp() from src/index.js into shared module src/lib/whatsapp.js
- Both index.js and cron.js import from this shared module
- No behaviour change -- same function, same signature, same Twilio call

### Twilio status callback (src/index.js)
- New route: POST /webhook/twilio-status
- Matches inbound Twilio callback by MessageSid against messages.twilio_sid
- Updates messages.delivery_status with Twilio-reported state
- Always returns 200 (prevents Twilio retry storms)
- Status callback URL saved in Twilio Console: https://dream-os-production.up.railway.app/webhook/twilio-status

### Five new agent tools (src/agent/tools.js + src/agent/engine.js)
1. create_event -- vendor logs shoot/call/meeting/task/reminder/recce/other with date
2. list_events -- fetch upcoming events by window (today/this_week/next_7_days/upcoming_all) and kind
3. update_event_state -- mark event done or cancelled
4. update_routing_handle -- vendor changes TDW code; checks uniqueness, returns error if taken
5. get_my_tdw_link -- fetches real link from DB, never constructs URL itself

Implementation notes:
- create_event: UUID validation on linked_lead_id (self-healing if agent passes name instead)
- list_events: IST-aware date math (UTC+5:30)
- update_routing_handle: cleans input (uppercase, alphanumeric + hyphen), uniqueness check
- get_my_tdw_link: reads routing_handle from DB, reads TDW_WA_NUMBER from env

### System prompt update (src/agent/systemPrompt.js)
- Added upcomingEvents parameter to buildSystemPrompt()
- UPCOMING EVENTS (next 14 days) section added between PIPELINE and RECENT NOTES
- Rule 9 replaced: agent now calls get_my_tdw_link instead of canned deflection
- Tool guidance added for all 5 new tools in WHEN TO USE EACH TOOL section

### Post-processing fix (src/agent/engine.js)
- ? strip logic replaced: regex /\?(?=\s|$)/ instead of indexOf('?')
- Old logic cut wa.me TDW links at the query string ? character
- New logic only strips ? followed by whitespace or end-of-string

### Morning briefing (src/agent/briefing.js)
- Pure function buildBriefing({ vendor, user, supabase })
- Returns { send: true, message: string } or { send: false, reason: string }
- 24h window check: reads last inbound from vendor_self conversation
- Builds message from: shoots today, shoots this week, open leads, overdue threads (72h+), upcoming events
- Empty state: "Quiet day ahead. Pipeline is clear."

### Morning briefing cron (src/cron.js)
- node-cron v4.2.1
- Schedule: 30 2 * * * UTC = 8:00am IST daily
- Runs inside Express process (startCronJobs called inside app.listen callback)
- Loops vendors where onboarding_state=complete AND briefing_enabled=true AND status=active
- Per-vendor errors caught and logged -- never aborts full run
- TODO: add cron_locks table when scaling beyond 1 Railway instance

### Manual test endpoint (src/index.js)
- GET /admin/test-briefing/:vendorId -- returns briefing JSON without sending WhatsApp
- Permanent diagnostic tool

### Invite page fix (src/admin/views/invite.js)
- wa.me link updated from +14155238886 (sandbox) to +14787788550 (active)
- Sandbox join-code warning removed

## Smoke tests passed
- create_event, list_events, update_event_state, get_my_tdw_link -- all verified via WhatsApp
- Ambiguous kind (tasting) -> kind: other, date resolved correctly
- Agent deduped event from upcomingEvents context -- didn't create duplicate
- Briefing end-to-end: manual trigger -> WhatsApp delivered
- Twilio status callback: delivery_status = "sent" populated correctly
- TDW link returned intact (not truncated at ?)

## Known gaps (Session 7+)
1. Twilio status callback: vendor notification message (sent_by: system) missing twilio_sid -- pre-existing Session 5.5 bug
2. No Anthropic credit-low warning -- agent fails silently if credits run out
3. update_lead_state requires UUID -- name-based update deferred to Session 8
4. Onboarding is dumb state machine -- no Haiku until Session 8.1
5. Vendor cannot draft/send replies to couples yet

## Session 6.5 -- Twilio template + +91 migration
**Founder directive (explicit, confirmed):** No matter which session we are at, when the WhatsApp +91 number arrives, pause everything and do Session 6.5 first.

Steps when +91 arrives:
1. Confirm WABA: same as +14787788550? (determines if templates transfer)
2. If same WABA: update TWILIO_WHATSAPP_NUMBER and TDW_WA_NUMBER env vars only
3. If new WABA: submit dream_os_morning_briefing UTILITY template first, wait approval
4. Template body: "Morning {{1}}. You have {{2}} open leads and {{3}} pending replies. {{4}} Reply to update."
5. Update outbound send wrapper: if 24h window closed AND template approved -> send via template
6. Update invite page wa.me link to +91 number
7. Smoke test: briefing fires to vendor inactive >24h

## Railway env vars (current)
- TWILIO_WHATSAPP_NUMBER = whatsapp:+14787788550
- TDW_WA_NUMBER = 14787788550
- ANTHROPIC_API_KEY (workspace: dream-os, model: claude-haiku-4-5-20251001)
- ADMIN_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (all in Railway)

## WhatsApp numbers reference
| Number | Currently points to | Notes |
|---|---|---|
| +14155238886 | Twilio sandbox | Retired |
| +14787788550 | dream-os Railway | Active, Meta-verified |
| +91XXXXXXXXX | Pending Twilio approval | Will become primary -- triggers Session 6.5 |

## Test credentials
- WhatsApp: +14787788550
- Test vendor phone: +918757788550
- Test vendor UUID: 2eb5d3fb-31eb-4b26-859a-cf10ae477d53
- Test vendor user UUID: f1d6d3af-a828-4e42-98ab-862b05dbc110
- Test conversation UUID: c2740497-6f40-4469-8bc1-8d66c9bda7bd
- Test vendor routing_handle: DEV550
- Test vendor TDW link: wa.me/14787788550?text=TDW-DEV550
- Supabase: nvzkbagqxbysoeszxent (Mumbai)
- Railway: https://dream-os-production.up.railway.app
- Admin: https://dream-os-production.up.railway.app/admin
- Briefing test: GET https://dream-os-production.up.railway.app/admin/test-briefing/2eb5d3fb-31eb-4b26-859a-cf10ae477d53

## First thing next session
curl https://dream-os-production.up.railway.app
Should return: {"status":"alive","service":"dream-os","version":"0.6.0"}

Check Railway logs for:
[cron] jobs registered: morning briefing at 08:00 IST (02:30 UTC)

If +91 number has arrived: do Session 6.5 before anything else.
Otherwise: start Session 7 (money tools).

## Document update protocol
HANDOVER.md -- fully rewritten every session
SCHEMA.md -- fully rewritten every session
ROADMAP.md -- updated every session
git add docs/ && git commit -m "docs: session N handover, schema, roadmap" && git push
