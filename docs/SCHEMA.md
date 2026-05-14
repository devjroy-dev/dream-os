# dream-os — Schema Reference
**Last updated:** 2026-05-14
**Supabase project:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Latest migration applied:** 0003_vendor_onboarding.sql

## Migration history
| File | Date | Session | What it added |
|---|---|---|---|
| 0001_initial_schema.sql | 2026-05-14 | 1 | users, vendors, couples, conversations, messages |
| 0002_agent_substrate.sql | 2026-05-14 | 2 | vendor_state, notes, pending_actions |
| 0003_vendor_onboarding.sql | 2026-05-14 | 3 | vendors.onboarding_state, invite_vendor() function |

## Tables

### users
Universal identity. One row per human on the platform.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| phone | text UNIQUE NOT NULL | always with country code e.g. +918757788550 |
| name | text | first name, set on invite or from WhatsApp profile |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

### vendors
Vendor-specific profile. One row per vendor.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| user_id | uuid FK → users.id | CASCADE delete |
| business_name | text | studio/brand name (optional) |
| category | text | e.g. 'photography', 'makeup', 'decor' — set during onboarding |
| vertical | text | default 'wedding' — for future multi-vertical |
| city | text | set during onboarding |
| upi_id | text | for payment collection — future |
| gstin | text | for tax — future |
| status | text | 'active' \| 'paused' \| 'churned' |
| tier | text | 'trial' \| 'essential' \| 'signature' \| 'prestige' |
| founding_cohort | boolean | true for first 50 vendors |
| onboarding_state | text | NULL or 'complete' = active. 'new' \| 'asked_category' \| 'asked_city' \| 'asked_rate' = in progress |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

### couples
Couple-specific profile. Lazy-created when a couple contacts a vendor.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| user_id | uuid FK → users.id | CASCADE delete |
| partner_name | text | second person in the couple |
| wedding_date | date | |
| wedding_city | text | |
| budget_total | integer | in INR |
| events_planned | jsonb | ['mehndi','sangeet','wedding','reception'] |
| planning_state | text | 'browsing' \| 'shortlisting' \| 'booked' \| 'planning' \| 'wedding_done' |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

### conversations
One thread between a vendor and a counterparty. Channel-agnostic.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK → vendors.id | CASCADE delete |
| counterparty_user_id | uuid FK → users.id | nullable — null for vendor self-thread |
| counterparty_phone | text | denormalized for fast WhatsApp routing |
| kind | text | 'vendor_self' \| 'couple_thread' \| 'network' |
| state | text | 'new' \| 'qualifying' \| 'negotiating' \| 'booked' \| 'planning' \| 'event_done' \| 'closed' |
| mode | text | 'auto' \| 'draft' \| 'manual' |
| last_message_at | timestamptz | updated on every message |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled

### messages
Every inbound/outbound message regardless of channel.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| conversation_id | uuid FK → conversations.id | CASCADE delete |
| direction | text | 'inbound' \| 'outbound' |
| channel | text | 'whatsapp' \| 'web' \| 'native' \| 'system' |
| body | text | message text |
| media_url | text | for future image/voice messages |
| sent_by | text | 'vendor' \| 'couple' \| 'agent' \| 'system' |
| tool_calls | jsonb | full audit trail of agent tool calls for this turn |
| tool_results | jsonb | reserved |
| twilio_sid | text | Twilio message SID for outbound tracking |
| created_at | timestamptz | auto |

Realtime: enabled

### vendor_state
Agent's per-vendor working memory. One row per vendor.
| Column | Type | Notes |
|---|---|---|
| vendor_id | uuid PK FK → vendors.id | CASCADE delete |
| summary | text | free-form summary the agent maintains |
| pricing_policy | jsonb | stated rates, packages — currently {stated_rate: string} |
| recent_notes | jsonb | cache of last 10 notes — refreshed after every agent turn |
| open_threads | integer | denormalized count |
| pending_actions | integer | denormalized count |
| updated_at | timestamptz | auto via trigger |

### notes
Durable, append-only log of facts the agent has captured.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK → vendors.id | CASCADE delete |
| conversation_id | uuid FK → conversations.id | SET NULL on delete |
| content | text NOT NULL | short factual note e.g. "Priya - Dec 14 photography enquiry" |
| tags | text[] | e.g. ['lead','date','onboarding','pricing'] |
| created_at | timestamptz | auto |

Realtime: enabled

### pending_actions
Drafts awaiting vendor approval (draft mode). Not yet used in Session 3.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK → vendors.id | CASCADE delete |
| conversation_id | uuid FK → conversations.id | CASCADE delete |
| action_type | text | 'reply_to_couple' \| 'create_invoice' etc |
| payload | jsonb NOT NULL | full action payload |
| state | text | 'pending' \| 'approved' \| 'rejected' \| 'expired' |
| summary | text | human-readable summary for vendor |
| expires_at | timestamptz | |
| resolved_at | timestamptz | |
| created_at | timestamptz | auto |

Realtime: enabled

## Relationships (plain English)
- Every vendor has one user (identity)
- Every couple has one user (identity)
- Every conversation belongs to one vendor
- Every message belongs to one conversation (and therefore one vendor)
- Every note belongs to one vendor and optionally one conversation
- Every vendor_state row belongs to one vendor (1:1)
- vendor_id + user_id are always the correct scoping keys — never query without them

## Postgres functions
| Function | Args | Returns | Purpose |
|---|---|---|---|
| invite_vendor | p_phone text, p_name text | uuid | Creates user + vendor rows for a new invited vendor. Sets onboarding_state = 'new'. Safe to call multiple times. |
| set_updated_at | — | trigger | Auto-stamps updated_at on all tables that have it |

## RLS status
RLS is currently DISABLED on all tables.
The service_role key (held by Railway only) bypasses RLS anyway.
RLS will be enabled in a future session when bride-side public access is added.

## Realtime
Enabled on: conversations, messages, notes, pending_actions
Not enabled on: users, vendors, couples, vendor_state (these update less frequently)
