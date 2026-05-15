# dream-os -- Schema Reference
**Last updated:** 2026-05-15
**Supabase project:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Latest migration applied:** 0010_expenses.sql

## Migration history
| File | Date | Session | What it added |
|---|---|---|---|
| 0001_initial_schema.sql | 2026-05-14 | 1 | users, vendors, couples, conversations, messages |
| 0002_agent_substrate.sql | 2026-05-14 | 2 | vendor_state, notes, pending_actions |
| 0003_vendor_onboarding.sql | 2026-05-14 | 3 | vendors.onboarding_state, invite_vendor() function |
| 0004_leads.sql | 2026-05-14 | 4 | leads table |
| 0005_tdw_handles.sql | 2026-05-14 | 5 | vendors.routing_handle, vendors.instagram_handle, users.email |
| 0006_travel_preference.sql | 2026-05-14 | 5 | vendors.open_to_travel, vendors.travel_notes |
| 0007_events_and_briefing.sql | 2026-05-14 | 6 | events table, messages.delivery_status, vendors.briefing_enabled |
| 0008_invoices.sql | 2026-05-15 | 7 | invoices table, vendors.invoice_prefix, vendors.invoice_counter |
| 0009_message_cost_tracking.sql | 2026-05-15 | 8.1 | messages cost columns, vendors.style_notes |
| 0010_expenses.sql | 2026-05-15 | 8.3 | expenses table |

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
| category | text | normalised during onboarding e.g. photography, makeup, decor. Always one of 16 locked taxonomy values (see src/agent/categories.js). |
| style_notes | text | qualifier captured during onboarding e.g. "luxury", "celebrity", "budget". Nullable. Populated by Haiku extractor. |
| vertical | text | default wedding |
| city | text | set during onboarding |
| routing_handle | text UNIQUE | TDW code suffix e.g. DEV550. Uppercase, alphanumeric only. Auto-assigned as FIRSTNAMEPHONE3. |
| instagram_handle | text | IG handle without @. NULL — collected naturally post-onboarding. |
| open_to_travel | boolean | default false. Set during asked_travel onboarding step. |
| travel_notes | text | Raw travel preference as vendor stated it. |
| upi_id | text | UPI ID e.g. swati@okhdfc. Used in invoice messages and PDFs. |
| gstin | text | future — tax |
| status | text | active or paused or churned |
| tier | text | trial or essential or signature or prestige |
| founding_cohort | boolean | true for first 50 vendors |
| onboarding_state | text | NULL or complete = active. new / asked_category / asked_city / asked_travel / asked_rate = in progress |
| briefing_enabled | boolean NOT NULL | default true. Kill switch for morning briefing per vendor. |
| invoice_prefix | text | Editable invoice number prefix e.g. TDW/DEV550. Auto-set to TDW/<routing_handle> on first invoice if NULL. |
| invoice_counter | integer NOT NULL | default 0. Per-vendor sequence. Never resets. Next invoice = counter + 1. |
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
| delivery_status | text | queued / sent / delivered / read / failed / undelivered / skipped_window_closed |
| model | text | which model handled this message (claude-haiku-4-5-20251001 or claude-sonnet-4-6). NULL for pre-8.1 messages and non-agent messages. |
| input_tokens | integer | CHECK >= 0. NULL for pre-8.1 and non-agent messages. |
| output_tokens | integer | CHECK >= 0. NULL for pre-8.1 and non-agent messages. |
| cost_usd | numeric(10,6) | CHECK >= 0. Anthropic billing cost. NULL for pre-8.1. |
| cost_inr | numeric(10,2) | CHECK >= 0. Rs equivalent at USD_TO_INR=100. NULL for pre-8.1. |
| created_at | timestamptz | auto |

Realtime: enabled

### vendor_state
| Column | Type | Notes |
|---|---|---|
| vendor_id | uuid PK FK -> vendors.id | CASCADE delete |
| summary | text | free-form summary the agent maintains |
| pricing_policy | jsonb | {stated_rate: string} |
| recent_notes | jsonb | cache of last 10 notes — refreshed after every vendor turn |
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

### events
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| title | text NOT NULL | short event title e.g. "Shoot for Priya" |
| event_date | date NOT NULL | required -- no date = use notes table instead |
| event_time | time | nullable -- only if vendor mentioned a time |
| kind | text NOT NULL | CHECK: shoot / call / meeting / task / reminder / recce / other |
| linked_lead_id | uuid FK -> leads.id | SET NULL on delete. Optional link to a lead. |
| state | text NOT NULL | CHECK: upcoming / done / cancelled. Default: upcoming. |
| notes | text | location, contact, prep notes, or specific type if kind=other |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled

### invoices
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| lead_id | uuid FK -> leads.id | SET NULL on delete. Optional link to a lead. |
| invoice_number | text NOT NULL | e.g. TDW/DEV550/01. Unique per vendor via constraint. |
| client_name | text NOT NULL | vendor's client name, kept as text snapshot even if lead linked |
| client_phone | text | optional, E.164 if provided |
| description | text | what the invoice is for, vendor's exact words |
| amount_total | integer NOT NULL | total in Rs. CHECK >= 0. |
| amount_advance | integer | booking amount in Rs as quoted. CHECK >= 0 if not null. Immutable after creation. |
| amount_paid | integer NOT NULL | default 0. Running total received. CHECK >= 0. Updated by record_payment. |
| due_date | date | balance due date. Optional. |
| state | text NOT NULL | CHECK: unpaid / advance_paid / paid / cancelled. Default: unpaid. |
| pdf_url | text | signed Supabase storage URL. NULL until Stage 2 PDF generated (Session 8.3). |
| notes | text | optional |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled

NOTE: amount_paid <= amount_total is deliberately NOT enforced at DB level.
Overpayment (shagun tips, UPI typos) is a legitimate vendor reality.
Handled as soft prompt at tool layer in record_payment (Session 8.3).

## Vendor category taxonomy (code-only, not a DB constraint)
Defined in src/agent/categories.js. 16 categories locked 2026-05-15 (founder confirmed).
vendors.category should always be one of these values.
vendors.style_notes captures qualifiers (e.g. "luxury", "celebrity") separately.

| Category | Covers |
|---|---|
| photography | photographers, candid shooters |
| videography | videographers, cinematographers, film makers |
| makeup | MUAs, bridal makeup, hair and makeup |
| mehendi | mehendi artists, henna artists |
| decor | decorators, florists, floral decor, mandap decor |
| catering | caterers, food and beverage, chefs |
| venue | banquet halls, farmhouses, resorts |
| music_dj | DJs, sound systems, emcees |
| music_live | live bands, singers, musicians |
| choreography | choreographers, dance trainers |
| planning | wedding planners, event managers |
| transport | car rentals, vintage cars, baraat |
| invitations | card printing, stationery, digital invites, wedding cards |
| jewellery | jewellery designers, rental jewellery |
| attire | bridal wear, lehenga, sherwani |
| other | anything that doesn't fit above |

### expenses
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| amount | integer NOT NULL | CHECK > 0. In whole rupees. |
| category | text NOT NULL | CHECK: travel / equipment / assistant / studio / marketing / software / food / printing / commission / shoot / inventory / other |
| description | text | vendor's own words, optional |
| expense_date | date | nullable, defaults to current_date |
| client_name | text | free-text client attribution. Nullable. Use linked_lead_id when lead exists. |
| linked_lead_id | uuid FK -> leads.id | SET NULL on delete. Optional link to a lead. |
| notes | text | optional |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled

## Key relationships
- Every vendor has one user (identity)
- Every message belongs to one conversation -> one vendor
- Every note belongs to one vendor, optionally one conversation
- Every lead belongs to one vendor
- Every event belongs to one vendor, optionally linked to one lead
- Every invoice belongs to one vendor, optionally linked to one lead
- vendor_id is always the scoping key — never query without it
- couple_thread conversations scoped by counterparty_phone for Mode 1 routing
- Every expense belongs to one vendor, optionally linked to one lead
- clients table arrives in Session 8.5 — invoices.lead_id becomes invoices.lead_id + invoices.client_id

## Indexes
- vendors_routing_handle_idx on vendors(routing_handle) — fast TDW lookup on every inbound message
- events_vendor_id_idx on events(vendor_id)
- events_event_date_idx on events(event_date)
- events_state_idx on events(state)
- events_vendor_date_state_idx on events(vendor_id, event_date, state) — briefing query
- invoices_vendor_id_idx on invoices(vendor_id)
- invoices_state_idx on invoices(state)
- invoices_due_date_idx on invoices(due_date)
- invoices_lead_id_idx on invoices(lead_id)
- invoices_created_at_idx on invoices(created_at desc)
- messages_model_idx on messages(model) — AI cost aggregation queries
- expenses_vendor_id_idx on expenses(vendor_id)
- expenses_expense_date_idx on expenses(expense_date)
- expenses_category_idx on expenses(category)
- expenses_created_at_idx on expenses(created_at desc)

## Unique constraints
- invoices_vendor_number_unique on invoices(vendor_id, invoice_number)

## Postgres functions
| Function | Args | Returns | Purpose |
|---|---|---|---|
| invite_vendor | p_phone text, p_name text | uuid | Creates user + vendor rows, sets onboarding_state = new |
| set_updated_at | -- | trigger | Auto-stamps updated_at |

## Supabase storage buckets
| Bucket | Public | Size limit | MIME types | Purpose |
|---|---|---|---|---|
| invoices | No (private) | 5 MB | application/pdf | Booking confirmation PDFs (Stage 2, Session 8.3) |

## RLS
Disabled on all tables. service_role key held by Railway only.
Will enable when bride-side public access is needed (Session 9).

## Realtime enabled on
conversations, messages, notes, pending_actions, leads, events, invoices, expenses
