# dream-os — Schema Reference (Vendor + Bride)
**Last updated:** 2026-05-16
**Session:** B2 complete (+ hotfix 0018 applied post-B2)
**Supabase project:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Latest migration applied:** 0018_fix_muse_saves_fk.sql
**Next migration:** 0019_bride_planner.sql (B3 — tasks, bookings, receipts)

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
| 0011_clients.sql | 2026-05-15 | 8.5 | clients table, leads.client_id, invoices.client_id |
| 0012_routing_disambiguation.sql | 2026-05-15 | 8.5 | users.pending_routing_context |
| **0013_couples_onboarding.sql** | **2026-05-16** | **B1** | **couples.onboarding_state, couples.nudge_sent_at, couple_state table, events.kind widened to 12 values, events/notes nullable vendor_id with couple_id + XOR, invite_couple() function** |
| **0014_conversations_xor.sql** | **2026-05-16** | **B1** | **conversations.vendor_id nullable, conversations.couple_id added, conversations_owner_xor CHECK (bugfix discovered live)** |
| **0015_pronouns_and_dedup.sql** | **2026-05-16** | **B1** | **users.pronouns text column (CHECK 'she'/'he'), couples.user_id unique constraint, invite_couple() rewritten to 3-arg signature** |
| **0016_muse_and_circle.sql** | **2026-05-16** | **B2** | **muse_saves table, circle_members table, circle_activity table, conversations.kind widened to include circle_thread, invite_circle_member() function, claim_circle_invite() function** |
| **0017_circle_sessions.sql** | **2026-05-16** | **B2** | **circle_sessions table, circle_activity.session_id FK column + two indexes** |
| **0018_fix_muse_saves_fk.sql** | **2026-05-16** | **B2 hotfix** | **muse_saves.saved_by_user_id FK changed from ON DELETE RESTRICT to ON DELETE CASCADE (unblocked admin "Delete couple" cascade). File backfilled to repo after direct SQL Editor application.** |

## Tables

### users
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| phone | text UNIQUE NOT NULL | always E.164 e.g. +918757788550 |
| name | text | first name, set on invite or from WhatsApp profile |
| email | text | collected naturally in conversation |
| **pronouns** | **text** | **B1: 'she' or 'he' (CHECK constraint). Required at bride invite. NULL on legacy users + all vendors until Session 9 parity work. Read by bride system prompt for voice adaptation.** |
| pending_routing_context | jsonb | Session 8.5. Stores either pending-question state {candidate_vendor_ids, original_message, asked_at} or sticky-resolution state {sticky_vendor_id, sticky_until}. NULL when no routing context active. |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

### vendors
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| user_id | uuid FK -> users.id | CASCADE delete |
| business_name | text | studio/brand name (optional) |
| category | text | one of 16 locked taxonomy values (see src/agent/categories.js) |
| style_notes | text | qualifier from onboarding e.g. "luxury", "celebrity". Nullable. |
| vertical | text | default wedding |
| city | text | set during onboarding |
| routing_handle | text UNIQUE | TDW code suffix e.g. DEV550. Auto-assigned as FIRSTNAMEPHONE3. |
| instagram_handle | text | IG handle without @. NULL — collected naturally post-onboarding. |
| open_to_travel | boolean | default false |
| travel_notes | text | Raw travel preference as vendor stated it |
| upi_id | text | UPI ID e.g. swati@okhdfc |
| gstin | text | future — tax |
| status | text | active or paused or churned |
| tier | text | trial or essential or signature or prestige |
| founding_cohort | boolean | true for first 50 vendors |
| onboarding_state | text | NULL or complete = active. new / asked_category / asked_city / asked_travel / asked_rate = in progress |
| briefing_enabled | boolean NOT NULL | default true. Kill switch for morning briefing per vendor. |
| invoice_prefix | text | Editable invoice number prefix e.g. TDW/DEV550 |
| invoice_counter | integer NOT NULL | default 0. Per-vendor sequence. Never resets. |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

### couples
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| user_id | uuid FK -> users.id | CASCADE delete. **UNIQUE constraint added in 0015** to prevent duplicate invites. |
| partner_name | text | nullable, populated during onboarding |
| wedding_date | date | nullable, populated during onboarding via Haiku date extraction |
| wedding_city | text | nullable, populated during onboarding |
| budget_total | integer | in Rs (nullable, Haiku extracts e.g. "35L" → 3500000) |
| events_planned | jsonb | e.g. ['mehndi','sangeet','wedding','reception'] (nullable) |
| planning_state | text | browsing or shortlisting or booked or planning or wedding_done |
| **onboarding_state** | **text** | **B1: new, asked_date, asked_partner, asked_city, asked_budget, complete. Default 'new'.** |
| **nudge_sent_at** | **timestamptz** | **B1: for Session 9 vendor-side nudge logic. NULL until first nudge sent.** |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Constraints:
- `couples_user_id_unique` (added 0015) — prevents duplicate couples rows for same user

### conversations
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | **B1: now nullable (was NOT NULL)**. CASCADE delete. |
| **couple_id** | **uuid FK -> couples.id** | **B1: new column. CASCADE delete. NULL for vendor conversations.** |
| counterparty_user_id | uuid FK -> users.id | nullable |
| counterparty_phone | text | denormalized for WhatsApp routing |
| kind | text | vendor_self, couple_thread, couple_self (B1 new), network |
| state | text | new or qualifying or negotiating or booked or planning or event_done or closed |
| mode | text | auto or draft or manual |
| last_message_at | timestamptz | updated on every message |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Constraints:
- `conversations_owner_xor` (added 0014) — exactly one of vendor_id or couple_id is set

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
| model | text | which model handled this message. NULL for pre-8.1 and non-agent messages. |
| input_tokens | integer | CHECK >= 0. NULL for pre-8.1 / non-agent. |
| output_tokens | integer | CHECK >= 0. NULL for pre-8.1 / non-agent. |
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

### couple_state
| Column | Type | Notes |
|---|---|---|
| couple_id | uuid PK FK -> couples.id | CASCADE delete |
| summary | text | free-form summary the agent maintains, parallel to vendor_state.summary |
| vendor_shortlist | jsonb | default '[]'. List of vendors the bride is considering. Populated B4 + Session 9. |
| taste_notes | text | aesthetic preferences captured by the agent (e.g. "Bride prefers moody editorial style") |
| updated_at | timestamptz | auto via trigger |

Added in migration 0013. Mirrors vendor_state pattern: one row per couples row, auto-created on invite. Bride agent does NOT cache recent_notes here (the system prompt queries notes directly via buildDynamicContext — different pattern from vendor side).

### notes
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | **B1: now nullable**. CASCADE delete. |
| **couple_id** | **uuid FK -> couples.id** | **B1: new column. CASCADE delete. Exactly one of vendor_id or couple_id is set (XOR).** |
| conversation_id | uuid FK -> conversations.id | SET NULL on delete |
| content | text NOT NULL | short factual note |
| tags | text[] | e.g. ['lead','pricing','onboarding','tdw','travel','detail'] |
| created_at | timestamptz | auto |

Constraints:
- `notes_owner_xor` (added 0013) — exactly one of vendor_id or couple_id is set

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
| client_id | uuid FK -> clients.id | Session 8.5. SET NULL on delete. Populated when lead promotes to client or auto-linked at create_lead time. |
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
| vendor_id | uuid FK -> vendors.id | **B1: now nullable**. CASCADE delete. |
| **couple_id** | **uuid FK -> couples.id** | **B1: new column. CASCADE delete. Exactly one of vendor_id or couple_id is set (XOR).** |
| title | text NOT NULL | short event title e.g. "Shoot for Priya" or "Mehndi" |
| event_date | date NOT NULL | required |
| event_time | time | nullable |
| kind | text NOT NULL | **B1: enum widened to 12 values.** CHECK: shoot / call / meeting / task / reminder / recce / fitting / trial / family / ceremony / social / other |
| linked_lead_id | uuid FK -> leads.id | SET NULL on delete. Optional. Vendor side only. |
| state | text NOT NULL | CHECK: upcoming / done / cancelled. Default: upcoming. |
| notes | text | location, contact, prep notes |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Constraints:
- `events_owner_xor` (added 0013) — exactly one of vendor_id or couple_id is set

Realtime: enabled

### invoices
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| lead_id | uuid FK -> leads.id | SET NULL on delete. Optional. |
| client_id | uuid FK -> clients.id | Session 8.5. SET NULL on delete. |
| invoice_number | text NOT NULL | e.g. TDW/DEV550/01. Unique per vendor. |
| client_name | text NOT NULL | vendor's client name, text snapshot |
| client_phone | text | optional, E.164 if provided |
| description | text | what the invoice is for |
| amount_total | integer NOT NULL | total in Rs. CHECK >= 0. |
| amount_advance | integer | booking amount in Rs. CHECK >= 0 if not null. Immutable after creation. |
| amount_paid | integer NOT NULL | default 0. CHECK >= 0. Updated by record_payment. |
| due_date | date | balance due date. Optional. |
| state | text NOT NULL | CHECK: unpaid / advance_paid / paid / cancelled. Default: unpaid. |
| pdf_url | text | signed Supabase storage URL. NULL until Stage 2 PDF generated. |
| notes | text | optional |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled
NOTE: amount_paid <= amount_total is deliberately NOT enforced at DB level.

### expenses
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| amount | integer NOT NULL | CHECK > 0. In whole rupees. |
| category | text NOT NULL | CHECK: travel / equipment / assistant / studio / marketing / software / food / printing / commission / shoot / inventory / other |
| description | text | vendor's own words, optional |
| expense_date | date | nullable, defaults to current_date |
| client_name | text | free-text client attribution. Nullable. |
| linked_lead_id | uuid FK -> leads.id | SET NULL on delete. Optional. |
| notes | text | optional |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled

### clients
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| user_id | uuid FK -> users.id | SET NULL on delete. Populated when phone matches an existing users row. |
| name | text NOT NULL | vendor's chosen client name |
| phone | text | E.164 when present. Phone is the dedup key. |
| email | text | optional |
| source | text NOT NULL | default 'lead_promotion'. Other values: 'manual_add', 'discover' (future). |
| referrer_name | text | nullable |
| notes | text | nullable |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled
Unique constraint: clients_vendor_phone_unique on (vendor_id, phone) WHERE phone IS NOT NULL — partial index, allows multiple phoneless clients.

## Vendor category taxonomy (code-only, not a DB constraint)
Defined in src/agent/categories.js. 16 categories locked 2026-05-15.

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

## Key relationships
- Every vendor has one user (identity)
- Every message belongs to one conversation -> one vendor
- Every note belongs to one vendor, optionally one conversation
- Every lead belongs to one vendor, optionally one client (via client_id)
- Every event belongs to one vendor, optionally linked to one lead
- Every invoice belongs to one vendor, optionally linked to one lead AND one client
- Every expense belongs to one vendor, optionally linked to one lead
- Every client belongs to one vendor (vendor-scoped, mirrors leads)
- vendor_id is always the scoping key — never query without it
- couple_thread conversations scoped by counterparty_phone for routing
- clients UNIQUE(vendor_id, phone WHERE phone NOT NULL) — phone is dedup key, names never matched

## Indexes
- vendors_routing_handle_idx on vendors(routing_handle)
- events_vendor_id_idx, events_event_date_idx, events_state_idx, events_vendor_date_state_idx
- invoices_vendor_id_idx, invoices_state_idx, invoices_due_date_idx, invoices_lead_id_idx, invoices_created_at_idx, invoices_client_id_idx
- messages_model_idx on messages(model)
- expenses_vendor_id_idx, expenses_expense_date_idx, expenses_category_idx, expenses_created_at_idx
- clients_vendor_id_idx, clients_created_at_idx
- leads_client_id_idx

## Unique constraints
- invoices_vendor_number_unique on invoices(vendor_id, invoice_number)
- clients_vendor_phone_unique on clients(vendor_id, phone) WHERE phone IS NOT NULL (partial)

## Postgres functions
| Function | Args | Returns | Purpose |
|---|---|---|---|
| invite_vendor | p_phone text, p_name text | uuid | Creates user + vendor rows, sets onboarding_state = new |
| set_updated_at | -- | trigger | Auto-stamps updated_at |
| invite_circle_member | p_couple_id uuid, p_invitee_name text, p_role text | table(id, invite_token, wa_me_link) | Generates CIRCLE-XXXXXX token, enforces 3-member cap, inserts pending circle_members row |
| claim_circle_invite | p_token text, p_invitee_phone text | table(member_id, couple_id, invitee_name, bride_name, member_role) | Flips circle_members status to active, sets phone + joined_at, writes joined circle_activity row |

## Supabase storage buckets
| Bucket | Public | Size limit | MIME types | Purpose |
|---|---|---|---|---|
| invoices | No (private) | 5 MB | application/pdf | Booking confirmation PDFs |

## RLS
Disabled on all tables. service_role key held by Railway only.
Will enable when bride-side public access is needed (Session 9).

## Realtime enabled on
conversations, messages, notes, pending_actions, leads, events, invoices, expenses, clients, muse_saves, circle_members, circle_activity, circle_sessions

---


---

## Bride tables added in B2

### muse_saves
Bride's mood board. One row per saved image, link, or vendor pin.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| couple_id | uuid | FK couples(id) ON DELETE CASCADE |
| save_number | int | Monotonic per couple_id. UNIQUE(couple_id, save_number). |
| source_type | text | CHECK: image / link / vendor |
| source_url | text | Original Pinterest/IG URL for link saves. Null for image saves. |
| image_url | text | Cloudinary URL (mirrored image). |
| vendor_id | uuid | FK vendors(id), nullable. Populated at Session 9 for Discover saves. |
| caption | text | Optional. Text that arrived with the image/link. Max 500 chars. |
| aesthetic_tags | jsonb | Array of strings from 12-value taxonomy (brideAesthetics.js). |
| vision_raw | jsonb | Full Google Vision API response. Used by B4 Surprise Me for dominant color aggregation. |
| saved_by_user_id | uuid | FK users(id) ON DELETE CASCADE (changed from RESTRICT in 0018 hotfix). Who triggered the save. |
| saved_by_role | text | CHECK: bride / circle_member |
| created_at | timestamptz | |
| updated_at | timestamptz | Auto-stamped by trigger. |

Indexes: couple_id, (couple_id, created_at DESC), (couple_id, saved_by_user_id), (couple_id, vendor_id WHERE vendor_id NOT NULL).

### circle_members
Bride's circle — people she's invited to contribute to her Muse board.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| couple_id | uuid | FK couples(id) ON DELETE CASCADE |
| invitee_name | text | How the bride refers to this person ("Mom", "Priya"). |
| invitee_phone | text | Populated when they claim the invite. |
| role | text | CHECK: partner / family / inner_circle |
| invite_token | text | CIRCLE-XXXXXX format. UNIQUE. One-time use. Currently no expiry (B3.1 adds 7-day expiry). |
| status | text | CHECK: pending / active / removed |
| invited_at | timestamptz | |
| joined_at | timestamptz | Populated on claim. |
| created_at | timestamptz | |
| updated_at | timestamptz | Auto-stamped by trigger. |

Cap: 3 active+pending members per couple (enforced in invite_circle_member() function).

### circle_activity
Append-only feed of what circle members have done on the bride's board.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| couple_id | uuid | FK couples(id) ON DELETE CASCADE |
| actor_user_id | uuid | FK users(id), nullable. |
| actor_name | text | Display name (invitee_name from circle_members, or "You" for bride). |
| actor_role | text | CHECK: bride / circle_member / agent |
| activity_type | text | CHECK: joined / save_added / comment / reaction / removed |
| subject_type | text | CHECK: muse_save / circle_member / null |
| subject_id | uuid | Polymorphic — references the subject row. No FK constraint (polymorphic). |
| payload | jsonb | Activity-specific data (save_number, content, etc.) |
| session_id | uuid | FK circle_sessions(id) ON DELETE SET NULL. Null for bride-side activity. |
| surfaced_to_bride | boolean | Legacy column (pre-session-model). Kept for backwards compat. |
| created_at | timestamptz | |

### circle_sessions
Tracks bursts of circle member activity for session-based summarization.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| couple_id | uuid | FK couples(id) ON DELETE CASCADE |
| circle_member_id | uuid | FK circle_members(id) ON DELETE CASCADE |
| started_at | timestamptz | When first message in this session arrived. |
| last_activity_at | timestamptz | Bumped on each subsequent message. Session "ends" when this is >10 min ago. |
| summarized_to_bride | boolean | Default false. Flipped true when bride-side summary is composed and surfaced. |
| summarized_at | timestamptz | |
| summary_message_id | uuid | Nullable. No FK constraint (B3.1 adds it). |
| created_at | timestamptz | |
| updated_at | timestamptz | Auto-stamped by trigger. |

**Session end is derived, not stored.** A session is "ended and pending summary" when: `last_activity_at < now - 10min AND summarized_to_bride = false`.

Indexes: (circle_member_id, last_activity_at DESC), (couple_id, last_activity_at) WHERE summarized_to_bride = false.

## Upcoming bride migrations (B-sessions — not yet applied)

Bride migrations continue the vendor sequence. No separate numbering. One migration history.

| File | Session | What it adds |
|---|---|---|
| ~~0013_couples_onboarding.sql~~ | B1 | ✅ Applied 2026-05-16 |
| ~~0014_conversations_xor.sql~~ | B1 | ✅ Applied 2026-05-16 (bugfix discovered live) |
| ~~0015_pronouns_and_dedup.sql~~ | B1 | ✅ Applied 2026-05-16 |
| ~~0016_muse_and_circle.sql~~ | B2 | ✅ Applied 2026-05-16 |
| ~~0017_circle_sessions.sql~~ | B2 | ✅ Applied 2026-05-16 |
| ~~0018_fix_muse_saves_fk.sql~~ | B2 hotfix | ✅ Applied 2026-05-16 (post-B2 SQL Editor; backfilled to repo) |
| 0019_bride_planner.sql | B3 | couple_tasks, couple_bookings, couple_receipts (with booking_id FK), record_payment() function |
| 0020_vendor_connections.sql | B4 | couple_vendor_connections table, vendors.aesthetic_tags, discover_readiness |

Full schema for each table documented here when the migration is applied. See ROADMAP_BRIDE.md for field-level detail on B2+ migrations.

---

## Known schema debt

### user_id vs couple_id naming inconsistency (inherited from tdw-2)
The existing tdw-2 web app has a naming inconsistency baked into its API:
- v2 GET endpoints filter Supabase with user_id
- POST/PATCH/DELETE endpoints send couple_id in the request body
- Both values are the same: session.id from localStorage couple_session
This inconsistency is carried as-is through all B-sessions. Do NOT fix mid-flight. Resolved at Session 9 consolidation. Anyone reading this: do not rename columns or parameters without a full coordinated migration.

### couples table — populated as of B1
Exists since migration 0001. Was sparse until B1 (2026-05-16) when bride product went live. Now real and populated. The "essentially unused" caveat is resolved.

### events table — now serves both vendors and brides
Migration 0007 added events with vendor_id only. Migration 0013 (B1) made vendor_id nullable, added couple_id with XOR constraint, and widened the kind enum to 12 values. Both vendors and brides now use this table.
