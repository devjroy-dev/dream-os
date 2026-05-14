# dream-os — Schema Reference
**Last updated:** 2026-05-14
**Supabase project:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Latest migration applied:** 0004_leads.sql

## Migration history
| File | Date | Session | What it added |
|---|---|---|---|
| 0001_initial_schema.sql | 2026-05-14 | 1 | users, vendors, couples, conversations, messages |
| 0002_agent_substrate.sql | 2026-05-14 | 2 | vendor_state, notes, pending_actions |
| 0003_vendor_onboarding.sql | 2026-05-14 | 3 | vendors.onboarding_state, invite_vendor() function |
| 0004_leads.sql | 2026-05-14 | 4 | leads table |

## Tables

### users
Universal identity. One row per human on the platform.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| phone | text UNIQUE NOT NULL | always E.164 e.g. +918757788550 |
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
| category | text | set during onboarding e.g. 'photography' |
| vertical | text | default 'wedding' |
| city | text | set during onboarding |
| upi_id | text | future — payment collection |
| gstin | text | future — tax |
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
| partner_name | text | |
| wedding_date | date | |
| wedding_city | text | |
| budget_total | integer | in Rs |
| events_planned | jsonb | e.g. ['mehndi','sangeet','wedding','reception'] |
| planning_state | text | 'browsing' \| 'shortlisting' \| 'booked' \| 'planning' \| 'wedding_done' |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

### conversations
One thread between a vendor and a counterparty.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK → vendors.id | CASCADE delete |
| counterparty_user_id | uuid FK → users.id | nullable |
| counterparty_phone | text | denormalized for WhatsApp routing |
| kind | text | 'vendor_self' \| 'couple_thread' \| 'network' |
| state | text | 'new' \| 'qualifying' \| 'negotiating' \| 'booked' \| 'planning' \| 'event_done' \| 'closed' |
| mode | text | 'auto' \| 'draft' \| 'manual' |
| last_message_at | timestamptz | updated on every message |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled

### messages
Every inbound/outbound message.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| conversation_id | uuid FK → conversations.id | CASCADE delete |
| direction | text | 'inbound' \| 'outbound' |
| channel | text | 'whatsapp' \| 'web' \| 'native' \| 'system' |
| body | text | message text |
| media_url | text | future |
| sent_by | text | 'vendor' \| 'couple' \| 'agent' \| 'system' |
| tool_calls | jsonb | full audit trail of agent tool calls |
| tool_results | jsonb | reserved |
| twilio_sid | text | Twilio message SID |
| created_at | timestamptz | auto |

Realtime: enabled

### vendor_state
Agent's per-vendor working memory. One row per vendor.
| Column | Type | Notes |
|---|---|---|
| vendor_id | uuid PK FK → vendors.id | CASCADE delete |
| summary | text | free-form summary the agent maintains |
| pricing_policy | jsonb | {stated_rate: string} — single rate for now |
| recent_notes | jsonb | cache of last 10 notes, refreshed after every turn |
| open_threads | integer | denormalized count |
| pending_actions | integer | denormalized count |
| updated_at | timestamptz | auto via trigger |

### notes
Append-only log of facts the agent has captured.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK → vendors.id | CASCADE delete |
| conversation_id | uuid FK → conversations.id | SET NULL on delete |
| content | text NOT NULL | short factual note |
| tags | text[] | e.g. ['lead','pricing','onboarding'] |
| created_at | timestamptz | auto |

Realtime: enabled

### pending_actions
Drafts awaiting vendor approval. Not yet used in agent tools.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK → vendors.id | CASCADE delete |
| conversation_id | uuid FK → conversations.id | CASCADE delete |
| action_type | text | 'reply_to_couple' \| 'create_invoice' etc |
| payload | jsonb NOT NULL | full action payload |
| state | text | 'pending' \| 'approved' \| 'rejected' \| 'expired' |
| summary | text | human-readable summary |
| expires_at | timestamptz | |
| resolved_at | timestamptz | |
| created_at | timestamptz | auto |

Realtime: enabled

### leads
Structured record of every couple enquiry. Created automatically by the agent.
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK → vendors.id | CASCADE delete |
| name | text | couple name e.g. "Preethi" or "Priya & Rohit" |
| phone | text | couple's phone if given |
| email | text | couple's email if given |
| wedding_date | date | extracted date |
| wedding_city | text | where the wedding is |
| event_types | text[] | e.g. ['wedding','reception','mehndi'] |
| budget_min | integer | in Rs e.g. 150000 |
| budget_max | integer | in Rs |
| source | text | default 'whatsapp'. 'instagram' \| 'referral' \| 'discover' \| 'other' |
| referrer_name | text | person who referred the couple e.g. "Anjali" — distinct from lead name |
| state | text | 'new' \| 'contacted' \| 'quoted' \| 'booked' \| 'lost' |
| raw_message | text | original forwarded text verbatim |
| notes | text | anything else extracted |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled

## Key relationships
- Every vendor has one user (identity)
- Every message belongs to one conversation → one vendor
- Every note belongs to one vendor, optionally one conversation
- Every lead belongs to one vendor
- vendor_id is always the scoping key — never query without it

## Postgres functions
| Function | Args | Returns | Purpose |
|---|---|---|---|
| invite_vendor | p_phone text, p_name text | uuid | Creates user + vendor rows, sets onboarding_state = 'new' |
| set_updated_at | — | trigger | Auto-stamps updated_at |

## RLS
Disabled on all tables. service_role key held by Railway only.
Will enable when bride-side public access is needed.

## Realtime enabled on
conversations, messages, notes, pending_actions, leads
