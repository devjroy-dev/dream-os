# dream-os — Schema Reference
**Last updated:** 2026-05-14
**Supabase project:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Latest migration applied:** 0005_tdw_handles.sql

## Migration history
| File | Date | Session | What it added |
|---|---|---|---|
| 0001_initial_schema.sql | 2026-05-14 | 1 | users, vendors, couples, conversations, messages |
| 0002_agent_substrate.sql | 2026-05-14 | 2 | vendor_state, notes, pending_actions |
| 0003_vendor_onboarding.sql | 2026-05-14 | 3 | vendors.onboarding_state, invite_vendor() function |
| 0004_leads.sql | 2026-05-14 | 4 | leads table |
| 0005_tdw_handles.sql | 2026-05-14 | 5 | vendors.routing_handle, vendors.instagram_handle, users.email |

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
| category | text | set during onboarding e.g. 'photography' |
| vertical | text | default 'wedding' |
| city | text | set during onboarding |
| routing_handle | text UNIQUE | TDW code suffix e.g. RAHULCLICKS. Uppercase, alphanumeric + hyphen only. |
| instagram_handle | text | raw IG handle without @ e.g. rahulclicks. NULL if skipped. |
| upi_id | text | future — payment collection |
| gstin | text | future — tax |
| status | text | 'active' or 'paused' or 'churned' |
| tier | text | 'trial' or 'essential' or 'signature' or 'prestige' |
| founding_cohort | boolean | true for first 50 vendors |
| onboarding_state | text | NULL or 'complete' = active. 'new' or 'asked_category' or 'asked_city' or 'asked_rate' or 'asked_instagram' = in progress |
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
| planning_state | text | 'browsing' or 'shortlisting' or 'booked' or 'planning' or 'wedding_done' |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

### conversations
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| counterparty_user_id | uuid FK -> users.id | nullable |
| counterparty_phone | text | denormalized for WhatsApp routing |
| kind | text | 'vendor_self' or 'couple_thread' or 'network' |
| state | text | 'new' or 'qualifying' or 'negotiating' or 'booked' or 'planning' or 'event_done' or 'closed' |
| mode | text | 'auto' or 'draft' or 'manual' |
| last_message_at | timestamptz | updated on every message |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled

### messages
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| conversation_id | uuid FK -> conversations.id | CASCADE delete |
| direction | text | 'inbound' or 'outbound' |
| channel | text | 'whatsapp' or 'web' or 'native' or 'system' |
| body | text | message text |
| media_url | text | future |
| sent_by | text | 'vendor' or 'couple' or 'agent' or 'system' |
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
| tags | text[] | e.g. ['lead','pricing','onboarding'] |
| created_at | timestamptz | auto |

Realtime: enabled

### pending_actions
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| conversation_id | uuid FK -> conversations.id | CASCADE delete |
| action_type | text | 'reply_to_couple' or 'create_invoice' etc |
| payload | jsonb NOT NULL | full action payload |
| state | text | 'pending' or 'approved' or 'rejected' or 'expired' |
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
| name | text | couple name e.g. "Preethi" or "Priya & Rohit" |
| phone | text | couple's phone if given |
| email | text | couple's email if given |
| wedding_date | date | extracted date |
| wedding_city | text | where the wedding is |
| event_types | text[] | e.g. ['wedding','reception','mehndi'] |
| budget_min | integer | in Rs e.g. 150000 |
| budget_max | integer | in Rs |
| source | text | default 'whatsapp'. 'instagram' or 'referral' or 'discover' or 'other' |
| referrer_name | text | person who referred the couple |
| state | text | 'new' or 'contacted' or 'quoted' or 'booked' or 'lost' |
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
- vendor_id is always the scoping key — never query without it
- couple_thread conversations scoped by counterparty_phone for routing

## Indexes added in Session 5
- vendors_routing_handle_idx on vendors(routing_handle) — fast TDW code lookup on every inbound message

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
