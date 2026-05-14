# dream-os — Session Handover
**Last updated:** 2026-05-14
**Session:** 3
**Version:** 0.3.0

## What shipped this session

### Admin layer (`src/admin/`)
- Login page with cookie-based session auth (7-day session)
- Vendor list — shows all vendors with status (Active/Onboarding/Invited) and stats
- Invite form — name + phone → calls `invite_vendor()` Postgres function → shows wa.me link on success
- Vendor detail — profile, conversation thread, agent notes
- Mounted at `/admin` on the existing Railway service
- Protected by `ADMIN_PASSWORD` env var

### Onboarding flow (`src/agent/onboarding.js`)
- New vendor messages → Swati greeting fires: "Hi [Name] — Swati mentioned a little bit about you..."
- Four-step flow: greeting → category → city → rate → complete
- Each step persists to `vendors` table and creates a note
- On completion, seeds `vendor_state.summary` and `pricing_policy`
- Unknown numbers (not pre-seeded) get: "This number is for invited vendors only..."

### Conversation history (`src/agent/engine.js`)
- Agent now loads last 10 turns from `messages` table per conversation
- Sent as clean user/assistant alternating history to Claude
- Agent maintains conversational context across a full session, not just the current message

### System prompt (`src/agent/systemPrompt.js`)
- Hard 2-3 sentence cap
- No markdown, no filler phrases
- Better examples covering common scenarios
- Now receives `user` param for vendor name

### Migration 0003
- Added `vendors.onboarding_state` column
- Added `invite_vendor(p_phone, p_name)` Postgres function
- Existing test vendor marked `onboarding_state = complete`

## Verified working
- Admin login at `/admin/login` ✅
- Vendor list shows Dev as Active ✅
- Invite form creates vendor row + shows wa.me link ✅
- Onboarding flow: full 4-step conversation completes correctly ✅
- Agent remembers context across messages in a session ✅
- System prompt responses are shorter and more natural ✅

## Known gaps (fix in Session 4)
1. No `create_lead` tool — agent notes enquiries but doesn't create structured lead records
2. Pricing model is a single string — no support for multiple packages
3. Agent can't distinguish forwarded enquiries from vendor's own messages
4. Conversation history deduplication is basic — may skip turns in edge cases
5. Admin has no search or filter on vendor list
6. wa.me link hardcoded to sandbox number — update when +91 number arrives

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
Run this to verify the system is healthy before touching code:
curl https://dream-os-production.up.railway.app
Should return: {"status":"alive","service":"dream-os","version":"0.3.0"}

Then read SCHEMA.md and ROADMAP.md before writing anything.

## Document update protocol (read this every session)

These three documents — HANDOVER.md, SCHEMA.md, ROADMAP.md — are the institutional memory of dream-os. They must be updated at the end of every session, before the session closes. No exceptions.

### HANDOVER.md (this file)
Fully rewritten every session. Not appended — rewritten.
Always reflects the current state, not the history. Git preserves the history.
Contains: what shipped, what was verified, known gaps, test credentials, first thing next session.

### SCHEMA.md
Fully rewritten every session.
Always reflects the exact current state of the Supabase database.
Every new migration adds new tables/columns here. Never describes what we planned — only what is actually in the database.

### ROADMAP.md
Updated (not fully rewritten) every session.
Mark completed sessions as done. Add new sessions as they become clear.
Update open questions when decisions are made.

### How to update at end of every session
1. I (Claude) write all three files as terminal paste blocks
2. Dev pastes them into the Codespace terminal
3. git add docs/ && git commit -m "docs: session N handover, schema, roadmap" && git push
4. Session is not considered complete until this push succeeds

### If a session ends abruptly
The FIRST thing the next session does is write the docs for the previous session before touching any code.

## Repo access (for future Claude sessions)
Repo is PUBLIC. Clone with:
git clone https://github.com/devjroy-dev/dream-os.git

After cloning, read these three files before touching anything:
cat docs/HANDOVER.md
cat docs/SCHEMA.md  
cat docs/ROADMAP.md
