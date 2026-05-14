# Session 5 final writes

## write_migration_0006.py

```python
content = """-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
-- Migration 0006 -- Travel preference
-- Date:    2026-05-14
-- Session: 5
-- Author:  Dev
-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
--
-- WHAT THIS ADDS
--   vendors.open_to_travel  -- boolean, set during onboarding asked_travel step
--   vendors.travel_notes    -- raw travel preference as vendor stated it
--
-- IMMUTABILITY: never edit this file. New changes go in 0007+.
-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

alter table vendors
  add column if not exists open_to_travel boolean default false,
  add column if not exists travel_notes   text;

comment on column vendors.open_to_travel is
  'Whether vendor is open to travelling for shoots. Set during onboarding asked_travel step.';

comment on column vendors.travel_notes is
  'Raw travel preference as vendor stated it e.g. Yes pan-India. Set during onboarding.';
"""
with open('db/migrations/0006_travel_preference.sql', 'w') as f:
    f.write(content)
print("done")
```

## write_handover.py

```python
content = """# dream-os -- Session Handover
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
"""
with open('docs/HANDOVER.md', 'w') as f:
    f.write(content)
print("done")
```

## write_schema.py

```python
content = """# dream-os -- Schema Reference
**Last updated:** 2026-05-14
**Supabase project:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Latest migration applied:** 0006_travel_preference.sql

## Migration history
| File | Date | Session | What it added |
|---|---|---|---|
| 0001_initial_schema.sql | 2026-05-14 | 1 | users, vendors, couples, conversations, messages |
| 0002_agent_substrate.sql | 2026-05-14 | 2 | vendor_state, notes, pending_actions |
| 0003_vendor_onboarding.sql | 2026-05-14 | 3 | vendors.onboarding_state, invite_vendor() function |
| 0004_leads.sql | 2026-05-14 | 4 | leads table |
| 0005_tdw_handles.sql | 2026-05-14 | 5 | vendors.routing_handle, vendors.instagram_handle, users.email |
| 0006_travel_preference.sql | 2026-05-14 | 5 | vendors.open_to_travel, vendors.travel_notes |

## Tables

### users
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| phone | text UNIQUE NOT NULL | always E.164 e.g. +918757788550 |
| name | text | first name, set on invite or from WhatsApp profile |
| email | text | collected naturally in conversation |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

### vendors
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| user_id | uuid FK -> users.id | CASCADE delete |
| business_name | text | studio/brand name (optional) |
| category | text | set during onboarding e.g. photography |
| vertical | text | default wedding |
| city | text | set during onboarding |
| routing_handle | text UNIQUE | TDW code suffix e.g. DEV-550. Uppercase, alphanumeric + hyphen. Auto-assigned as FIRSTNAME-PHONE3. |
| instagram_handle | text | IG handle without @. NULL -- collected naturally post-onboarding. |
| open_to_travel | boolean | default false. Set during asked_travel onboarding step. |
| travel_notes | text | Raw travel preference as vendor stated it. e.g. Yes pan-India |
| upi_id | text | future -- payment collection |
| gstin | text | future -- tax |
| status | text | active or paused or churned |
| tier | text | trial or essential or signature or prestige |
| founding_cohort | boolean | true for first 50 vendors |
| onboarding_state | text | NULL or complete = active. new / asked_category / asked_city / asked_travel / asked_rate = in progress |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

### couples
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| user_id | uuid FK -> users.id | CASCADE delete |
| partner_name | text | |
| wedding_date | date | |
| wedding_city | text | |
| budget_total | integer | in Rs |
| events_planned | jsonb | e.g. ['mehndi','sangeet','wedding','reception'] |
| planning_state | text | browsing or shortlisting or booked or planning or wedding_done |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

### conversations
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| counterparty_user_id | uuid FK -> users.id | nullable |
| counterparty_phone | text | denormalized for WhatsApp routing |
| kind | text | vendor_self or couple_thread or network |
| state | text | new or qualifying or negotiating or booked or planning or event_done or closed |
| mode | text | auto or draft or manual |
| last_message_at | timestamptz | updated on every message |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled

### messages
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| conversation_id | uuid FK -> conversations.id | CASCADE delete |
| direction | text | inbound or outbound |
| channel | text | whatsapp or web or native or system |
| body | text | message text |
| media_url | text | future |
| sent_by | text | vendor or couple or agent or system |
| tool_calls | jsonb | full audit trail of agent tool calls |
| tool_results | jsonb | reserved |
| twilio_sid | text | Twilio message SID |
| created_at | timestamptz | auto |

Realtime: enabled

### vendor_state
| Column | Type | Notes |
|---|---|---|
| vendor_id | uuid PK FK -> vendors.id | CASCADE delete |
| summary | text | free-form summary the agent maintains |
| pricing_policy | jsonb | {stated_rate: string} |
| recent_notes | jsonb | cache of last 10 notes |
| open_threads | integer | denormalized count |
| pending_actions | integer | denormalized count |
| updated_at | timestamptz | auto via trigger |

### notes
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| conversation_id | uuid FK -> conversations.id | SET NULL on delete |
| content | text NOT NULL | short factual note |
| tags | text[] | e.g. ['lead','pricing','onboarding','tdw','travel'] |
| created_at | timestamptz | auto |

Realtime: enabled

### pending_actions
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| conversation_id | uuid FK -> conversations.id | CASCADE delete |
| action_type | text | reply_to_couple or create_invoice etc |
| payload | jsonb NOT NULL | full action payload |
| state | text | pending or approved or rejected or expired |
| summary | text | human-readable summary |
| expires_at | timestamptz | |
| resolved_at | timestamptz | |
| created_at | timestamptz | auto |

Realtime: enabled

### leads
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| name | text | couple name e.g. Preethi or Priya & Rohit |
| phone | text | couple phone if given |
| email | text | couple email if given |
| wedding_date | date | extracted date |
| wedding_city | text | where the wedding is |
| event_types | text[] | e.g. ['wedding','reception','mehndi'] |
| budget_min | integer | in Rs e.g. 150000 |
| budget_max | integer | in Rs |
| source | text | default whatsapp. instagram or referral or discover or other |
| referrer_name | text | person who referred the couple |
| state | text | new or contacted or quoted or booked or lost |
| raw_message | text | original forwarded text verbatim |
| notes | text | anything else extracted |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled

## Key relationships
- Every vendor has one user (identity)
- Every message belongs to one conversation -> one vendor
- Every note belongs to one vendor, optionally one conversation
- Every lead belongs to one vendor
- vendor_id is always the scoping key -- never query without it
- couple_thread conversations scoped by counterparty_phone for Mode 1 routing

## Indexes
- vendors_routing_handle_idx on vendors(routing_handle) -- fast TDW lookup on every inbound message

## Postgres functions
| Function | Args | Returns | Purpose |
|---|---|---|---|
| invite_vendor | p_phone text, p_name text | uuid | Creates user + vendor rows, sets onboarding_state = new |
| set_updated_at | -- | trigger | Auto-stamps updated_at |

## RLS
Disabled on all tables. service_role key held by Railway only.
Will enable when bride-side public access is needed.

## Realtime enabled on
conversations, messages, notes, pending_actions, leads
"""
with open('docs/SCHEMA.md', 'w') as f:
    f.write(content)
print("done")
```

## write_roadmap.py

```python
content = """# dream-os -- Roadmap
**Last updated:** 2026-05-14
**Current version:** 0.5.0

## Vision
WhatsApp-first chief of staff for wedding vendors.
Vendor runs their business by texting a number.
Agent remembers everything, handles routine, escalates judgment calls.
Admin layer lets Dev/Swati manage the founding cohort of 50 vendors.
Marketplace (thedreamwedding.in) surfaces curated vendors to brides.

## What's shipped

| Session | What | Version |
|---|---|---|
| 1 | WhatsApp echo bot, schema (5 tables), Railway deploy, Twilio sandbox | 0.1.0 |
| 2 | Agentic loop (Claude Haiku), note_to_self, update_conversation_state, respond_to_vendor, vendor_state + notes + pending_actions | 0.2.0 |
| 3 | Admin layer, onboarding flow (Swati greeting), conversation history, system prompt tightening, invite_vendor() | 0.3.0 |
| 4 | leads table, create_lead tool, list_leads, update_lead_state, lead/referrer distinction, post-processing commentary strip, admin leads tab | 0.4.0 |
| 5 | TDW handles (migration 0005), travel preference (migration 0006), 4-step onboarding, FIRSTNAME-PHONE3 auto-handle, three-mode couple routing, admin TDW link display | 0.5.0 |

## Decisions locked
- Model: claude-haiku-4-5-20251001 (never change without founder approval)
- Phone format: always E.164 (+918757788550)
- Schema discipline: every change through numbered migration file
- Three docs updated every session: HANDOVER.md, SCHEMA.md, ROADMAP.md
- Currency: Rs (never Rs with symbol)
- Unknown numbers: three-mode couple routing
- Admin auth: single ADMIN_PASSWORD env var
- Monorepo: backend now, web/ and discover/ added in Sessions 9+
- Routing: one shared number + TDW codes
- TDW handle format: FIRSTNAME-PHONE3 e.g. DEV-550. Auto-assigned, no vendor input needed.
- Lead dedup in Mode 2: one lead per (vendor_id, counterparty_phone), ever
- TDW_WA_NUMBER env var: parameterised, swap when +91 arrives, no code change needed
- Couple-facing agent: Haiku, session 5.5

## Session 5.5 -- Couple-facing agent
**Goal:** Couples get a response after sending TDW code. Agent collects wedding details, creates structured lead, notifies vendor with summary.

What ships:
- Mode 2 now sends couple an immediate acknowledgement: "Hi! You've reached [VendorName]. I'm their assistant -- what can I help you with? Tell me a bit about your wedding and I'll get them to follow up."
- Couple replies with details -- agent running on couple_thread conversation collects: wedding date, city, events, budget
- Agent creates structured lead with all extracted info
- Vendor notified with summary: "New lead from [name/phone]. Wedding: [date], [city], [budget]. Full details captured."
- Mode 1 (returning couple) also gets agent response -- not just vendor notification
- Engine updated to handle couple_thread conversations (currently only handles vendor_self)

Estimated time: 90 minutes

## Session 6 -- Morning briefing + proactive triggers
**Goal:** Vendor gets a WhatsApp briefing every morning without asking.

What ships:
- Cron job: 8am IST daily per active vendor
- Format: "Morning [Name]. X open leads, Y pending replies, Z events this week."
- Overdue nudge: "You haven't replied to Preethi's enquiry in 3 days."
- Railway cron configuration
- update_routing_handle tool: vendor can change TDW handle via WhatsApp
- Twilio template submission for outbound initiated messages

Estimated time: 90 minutes

## Session 7 -- Money tools
**Goal:** Vendor logs expenses, creates invoices, tracks payments through WhatsApp.

What ships:
- Migration: invoices table, expenses table
- New tools: create_invoice, log_expense, record_payment
- Agent answers: "Who owes me money?" "What did I spend this month?"
- Admin: Money tab on vendor detail

Estimated time: 90 minutes

## Session 8.1 -- Smart model routing (Haiku -> Sonnet)
**Goal:** Route complex tasks to Sonnet, keep simple tasks on Haiku.

What ships:
- Task classifier: lightweight Haiku call determines complexity
- Router in engine.js: sets MODEL based on classifier output
- Cost tracking on messages table
- Admin: AI cost this month on vendor detail

Estimated time: 45-60 minutes

## Session 8 -- Admin polish + +91 number live
**Goal:** Admin production-ready for 50 founding vendors.

What ships:
- +91 number live -- update TWILIO_WHATSAPP_NUMBER and TDW_WA_NUMBER env vars
- Vendor list: search + filter by status
- Bulk invite: CSV upload
- Manual onboarding_state override in admin
- Lead name-based state updates

Estimated time: 60 minutes

## Session 9 -- thedreamwedding.in Discover
**Goal:** Bride-side curated marketplace.

What ships:
- discover/ folder added to monorepo
- Next.js site on Vercel
- Vendor profile pages (public, read-only)
- Enquiry from Discover -> vendor WhatsApp thread automatically

Estimated time: 2-3 sessions

## Session 10 -- Instagram DM integration
**Goal:** Vendor connects Instagram Business account. DMs auto-route to their WhatsApp thread.

Estimated time: 2 sessions

## Session 11-12 -- thedreamai.in vendor dashboard
**Goal:** Web dashboard as read layer over WhatsApp-captured data.

## Open questions
1. +91 number -- applied, arriving soon
2. Founding cohort pricing -- free forever or free for X months?
3. Couple phone collection on Discover enquiry
4. thedreamwedding.in domain -- currently pointing where?
5. Swati's role in Discover editorial curation

## Deliberately out of scope
- iOS/Android native app
- Razorpay subscription billing (after 50 vendors proven)
- RLS (after bride-side public access needed)
- Multi-vertical (weddings first)
- Email/SMS fallback (WhatsApp only)
- One number per vendor (TDW code system solves routing)
"""
with open('docs/ROADMAP.md', 'w') as f:
    f.write(content)
print("done")
```

## write_package_json.py

```python
import json
with open('package.json', 'r') as f:
    pkg = json.load(f)
pkg['version'] = '0.5.0'
with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
    f.write('\n')
print("done")
```
