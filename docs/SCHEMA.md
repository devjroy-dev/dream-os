# dream-os — Schema Reference (Vendor + Bride)
**Last updated:** 2026-05-30 (DreamAi phase build session — 3.0 block + Phase 3 reply path)
**Session:** Phases 1–3 vendor/bride build. New since 0062: 0063 (vendor_activity_log — cross-surface action log, Phase 1.5) and 0064 (vendors.base_fee_min/max — enquiry budget enrichment, Phase 2). Phase 3 (send_to_couple vendor reply path) added NO new tables — reuses conversations/messages/leads.
**Supabase project:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Latest migration applied:** 0064 (vendors base_fee columns, 2026-05-30)
**Migrations 0040–0048 applied to prod. All committed to db/migrations/.**
- 0040: team_members, team_tasks, team_messages, team_payments
- 0041: payment_schedules, contracts, tds_ledger, invoices.has_schedule
- 0044: discover_heroes
- 0045: muse_pool, taste_quiz_images, spotlight, admin_config, couples.tier, invite_codes.intended_phone
- 0046: demo_profiles
- 0047: vendors.demo_session_token, vendors.demo_session_expires_at
- 0048: collab_posts, collab_responses
- 0061: otp_sessions.purpose widened to include 'circle_join'
- 0062: couple_enquiries table (bride Discover enquiry ledger)
- 0063: vendor_activity_log table (cross-surface action log — Phase 1.5)
- 0064: vendors.base_fee_min / base_fee_max columns (enquiry budget enrichment — Phase 2)
**Next migration:** 0065 (when needed)
**Pending Phase 2:** 0024, 0026, 0029 (all deferred to P2-9)
**Pending Phase 3:** 0027
**Convention:** 0024=vendor_profile, 0025=hot_dates(applied), 0026=invoices_last_payment_at,
  0027=discover(P3), 0028=pin_auth(applied), 0029=discover_preview, 0030=landing_assets,
  0031=invite_codes(applied), 0032=waitlist_signups(applied), 0033=otp_sessions(applied)

**Note (2026-05-18, P2-3):** Four migrations applied this session: 0028 (pin_auth + XOR triggers),
0031 (invite_codes), 0032 (waitlist_signups), 0033 (otp_sessions). All phone-tested end-to-end.
0024 (vendor_profile) remains next pending migration — apply at Phase 2 Discover preview block.
0025 (hot_dates) was applied 2026-05-18 out of sequence — hot_dates needed for P2-1 tool.
0031 and 0032 are P2-3 additions not in the original Phase 2 plan — added for invite-gated landing page.

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
| **0019_bride_planner.sql** | **2026-05-16** | **B3** | **couple_tasks table, couple_bookings table, couple_receipts table (with booking_id FK), record_payment() Postgres function (transactional, single source of truth for booking state), 9 indexes, updated_at triggers on tasks/bookings, 3 realtime publications.** |
| **0020_drop_priority.sql** | **2026-05-17** | **B3** | **Drops priority column from couple_tasks. due_date is the urgency signal.** |
| **0021_couple_receipts_label.sql** | **2026-05-17** | **B3** | **Adds label (text, nullable) column to couple_receipts. Index on (couple_id, label).** |
| **0022_task_event_merge.sql** | **2026-05-17** | **B3** | **Copies all couple_tasks rows into events (kind=reminder, pending→upcoming, due_date null→today IST). Empties couple_tasks. Table stays in schema, retired in place.** |
| **0023_circle_cleanup.sql** | **2026-05-17** | **P1-1** | **circle_members.expires_at (7-day expiry on pending invite tokens). circle_sessions.summary_message_id FK to messages(id) ON DELETE SET NULL. circle_sessions unique partial index (circle_member_id) WHERE summarized_to_bride=false (M2 race fix). invite_circle_member() rewritten — sets expires_at, structured ERRCODE exceptions. claim_circle_invite() rewritten — rejects expired tokens, structured exceptions.** |
| **0028_pin_auth.sql** | **2026-05-18** | **P2-3** | **vendors.pin_hash, vendors.pin_failed_attempts, vendors.pin_locked_until. couples.pin_hash, couples.pin_failed_attempts, couples.pin_locked_until. enforce_role_xor() function. vendors_enforce_role_xor + couples_enforce_role_xor triggers (BEFORE INSERT, hard role XOR at DB level).** |
| **0031_invite_codes.sql** | **2026-05-18** | **P2-3** | **invite_codes table (code PK, kind, tier, notes, created_at, created_by, consumed_at, consumed_by_user_id). invite_codes_unconsumed_idx + invite_codes_created_at_idx. consume_invite_code(p_code, p_user_id) atomic function — race-safe, structured exceptions.** |
| **0032_waitlist_signups.sql** | **2026-05-18** | **P2-3** | **waitlist_signups table (id, kind, name, phone, instagram_handle, status, notes, created_at, updated_at). waitlist_signups_new_recent_idx (partial) + waitlist_signups_created_at_idx. waitlist_signups_updated_at trigger.** |
| **0033_otp_sessions.sql** | **2026-05-18** | **P2-3** | **otp_sessions table (phone PK, otp_hash, purpose, expires_at, created_at). otp_sessions_expires_at_idx. Transient OTP state for PWA login — upserted on send-otp, deleted on verify-otp. No FK to users (intentional).** |
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
| **pin_hash** | **text** | **0028: bcrypt hash of 4-digit PWA PIN. NULL = PIN not yet set.** |
| **pin_failed_attempts** | **integer NOT NULL** | **0028: default 0. Consecutive failed PIN attempts. Resets on success or OTP reset. 5 failures triggers lockout.** |
| **pin_locked_until** | **timestamptz** | **0028: NULL = not locked. Set to now()+15min after 5 failures. Cleared on OTP reset.** |

Constraints (new in 0028):
- `vendors_enforce_role_xor` trigger — BEFORE INSERT, rejects if user_id already exists in couples.

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
| **pin_hash** | **text** | **0028: bcrypt hash of 4-digit PWA PIN. NULL = PIN not yet set.** |
| **pin_failed_attempts** | **integer NOT NULL** | **0028: default 0. Consecutive failed PIN attempts. Resets on success or OTP reset. 5 failures triggers lockout.** |
| **pin_locked_until** | **timestamptz** | **0028: NULL = not locked. Set to now()+15min after 5 failures. Cleared on OTP reset.** |

Constraints:
- `couples_user_id_unique` (added 0015) — prevents duplicate couples rows for same user
- `couples_enforce_role_xor` trigger (added 0028) — BEFORE INSERT, rejects if user_id already exists in vendors.

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
| **record_payment** | **p_booking_id uuid, p_amount integer, p_receipt_id uuid default null, p_payment_date date default null** | **couple_bookings (row)** | **B3. Transactional. Locks booking row, adds p_amount to amount_paid (may be negative for receipt deletion reversal), recomputes state via CASE (paid / advance_paid / booked), optionally links receipt via p_receipt_id, returns updated row. SINGLE SOURCE OF TRUTH for couple_bookings.amount_paid and state — agent never updates these directly.** |

## Supabase storage buckets
| Bucket | Public | Size limit | MIME types | Purpose |
|---|---|---|---|---|
| invoices | No (private) | 5 MB | application/pdf | Booking confirmation PDFs |

## RLS
Disabled on all tables. service_role key held by Railway only.
Will enable when bride-side public access is needed (Session 9).

## Realtime enabled on
conversations, messages, notes, pending_actions, leads, events, invoices, expenses, clients, muse_saves, circle_members, circle_activity, circle_sessions, couple_tasks, couple_bookings, couple_receipts

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
| surface | text | NOT NULL DEFAULT 'muse'. CHECK IN ('muse','moments'). Added migration 0059. 'muse' = mood board inspo, 'moments' = personal candids/real-life photos. |
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
| invite_token | text | CIRCLE-XXXXXX format. UNIQUE. One-time use. **expires_at set to now()+7 days on all new invites (migration 0023). Legacy rows have expires_at=null and remain claimable.** |
| status | text | CHECK: pending / active / removed |
| invited_at | timestamptz | |
| joined_at | timestamptz | Populated on claim. |
| **expires_at** | **timestamptz** | **Nullable. 7-day expiry on pending tokens. Added in migration 0023. Null on legacy rows (pre-0023) — those remain claimable forever. claim_circle_invite() rejects non-null expired values.** |
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
| summary_message_id | uuid | Nullable. **FK to messages(id) ON DELETE SET NULL added in migration 0023.** Points to the outbound message row that contained the summary. |
| created_at | timestamptz | |
| updated_at | timestamptz | Auto-stamped by trigger. |

**Session end is derived, not stored.** A session is "ended and pending summary" when: `last_activity_at < now - 10min AND summarized_to_bride = false`.

**Unique partial index (migration 0023):** `circle_sessions_one_open_per_member_unique` on `(circle_member_id) WHERE summarized_to_bride = false`. Enforces at most one open session per member. Concurrent inserts resolve via unique violation — app re-fetches the existing session.

Indexes: (circle_member_id, last_activity_at DESC), (couple_id, last_activity_at) WHERE summarized_to_bride = false.

---

## Bride tables added in B3

These three tables form the bride's planner substrate: tasks (undated/due-dated to-dos), bookings (per-vendor commitment tracking), and receipts (the universal vault for any spend, optionally linked to a booking).

### couple_tasks
**RETIRED IN PLACE (migration 0022).** Table is empty. All tasks have been migrated to the `events` table (kind=reminder, pending→upcoming, done→done). The 5 task tools in brideTools.js are marked DEPRECATED — do not call. Everything is now a calendar event.

Undated or due-dated to-dos. Distinct from events (events are anchored to a calendar slot via `events.event_date NOT NULL`). Tasks have an optional `due_date` — "call venue Monday" gets a due_date, "research florists" doesn't.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default uuid_generate_v4() |
| couple_id | uuid | FK couples(id) ON DELETE CASCADE, NOT NULL |
| title | text | NOT NULL |
| status | text | CHECK: pending / done. Default 'pending'. |
| ~~priority~~ | ~~text~~ | **Dropped in migration 0020.** Column removed. |
| due_date | date | Nullable |
| event_name | text | Free-text label e.g. "engagement" or "wedding". Optional. Not migrated to events (no equivalent column). Context preserved in title/notes. |
| notes | text | |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto via trigger |

Indexes: `couple_tasks_couple_id_idx` on (couple_id). `couple_tasks_open_by_due_idx` on (couple_id, status, due_date) WHERE status = 'pending' — partial index for the common "what's open and due soon" query.

### couple_bookings
Per-vendor commitment tracking. The bride's mirror of the vendor's `invoices` table — same shape, reversed perspective. Vendor side records "client owes me 1.5L by Dec 1"; bride side records "I owe photographer 1.5L by Dec 1."

`amount_total` and `amount_advance` are both nullable. Real-world: brides often pay an advance before the final contract value is fixed (designers especially). State stays 'booked' until `amount_total` is set and `amount_paid >= amount_total`.

`vendor_id` is nullable and points to `vendors(id)` for B4+ linkage. At B3, the bride enters bookings as free text via `vendor_name`. At B4, when `couple_vendor_connections` lights up, a booking can link to a real dream-os vendor row.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default uuid_generate_v4() |
| couple_id | uuid | FK couples(id) ON DELETE CASCADE, NOT NULL |
| vendor_name | text | NOT NULL. Free text — what the bride calls this vendor. |
| vendor_id | uuid | FK vendors(id) ON DELETE SET NULL. Nullable. B4+ linkage. |
| category | text | NOT NULL. CHECK enum: photographer / videographer / mua / designer / venue / caterer / decor / florist / music / planner / other (11 values, locked at B3). |
| amount_total | integer | Nullable. CHECK >= 0 if not null. Full contract value in Rs. |
| amount_advance | integer | Nullable. CHECK >= 0 if not null. Booking advance amount in Rs. |
| amount_paid | integer | NOT NULL default 0. Running total of payments. NO CHECK constraint — may go negative (deliberate, see below). |
| balance_due_date | date | Nullable. When the balance is due. |
| state | text | NOT NULL. CHECK: booked / advance_paid / paid. Default 'booked'. No 'cancelled' state — cancellation = delete_booking at tool layer. |
| notes | text | Nullable. |
| contact_phone | text | Nullable. Vendor contact number. Added migration 0060. Powers WA+Call buttons in VendorsRoom. |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto via trigger |

**Deliberate omissions:**
- No CHECK (amount_paid >= 0) — `delete_receipt` reverses contributions via `record_payment(..., -amount, ...)`. If the bride deletes more than she paid, `amount_paid` goes negative. Agent surfaces this as a warning at tool layer ("something's off, want to fix?"), not blocked at DB layer.
- No CHECK (amount_paid <= amount_total) — overpayment is real (shagun tips, UPI typos). Mirrors vendor invoices (0008).
- No 'cancelled' state — cancellation handled by `delete_booking()` at tool layer. Locked architectural principle (ROADMAP_BRIDE.md, B3).

Indexes: `couple_bookings_couple_id_idx` on (couple_id). `couple_bookings_couple_state_idx` on (couple_id, state). `couple_bookings_couple_due_idx` on (couple_id, balance_due_date) WHERE balance_due_date IS NOT NULL (partial — for `list_dues`). `couple_bookings_couple_vendor_name_idx` on (couple_id, lower(vendor_name)) — lowercased for case-insensitive fuzzy match in the receipt 3-branch flow.

### couple_receipts
The receipt vault. Every spend the bride captures, whether linked to a booking or not. Most fields are nullable because Vision OCR may not extract every field cleanly and the agent does NOT gate on completeness (locked decision: no OCR confidence threshold — agent proposes save with whatever Vision returned, asks bride for missing fields).

`booking_id` is the optional meeting point with `couple_bookings`. When set, this receipt represents a payment that contributed to the booking's `amount_paid`. ON DELETE SET NULL: deleting a booking preserves its receipts as standalone records (the link is severed, the receipt survives).

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default uuid_generate_v4() |
| couple_id | uuid | FK couples(id) ON DELETE CASCADE, NOT NULL |
| booking_id | uuid | FK couple_bookings(id) ON DELETE SET NULL. Nullable. Optional meeting point. |
| amount | integer | Nullable. CHECK >= 0 if not null. Filled in later if OCR couldn't read it. |
| vendor_name | text | Nullable. |
| description | text | |
| receipt_date | date | Nullable. |
| image_url | text | Cloudinary URL for receipt photo. NOT NULL — receipts are image-only in B3 (vault design). Google Vision classifier routes Twilio image forwards here. |
| label | text | Nullable. Added in migration 0021. Reserved for future use — NOT written by the agent in B3. Bride labels receipts via PWA at Sessions 11-12. |
| tags | text[] | NOT NULL default ARRAY[]::text[]. Free-form tags. |
| created_at | timestamptz | Auto |

**No updated_at column or trigger.** Receipts are append-only (matches vendor `expenses` pattern, migration 0010). The only post-creation mutation is `booking_id` being set by `record_payment()`. Tracking updated_at for that single flip would be over-engineering.

Indexes: `couple_receipts_couple_id_idx` on (couple_id). `couple_receipts_couple_created_idx` on (couple_id, created_at DESC) for "show me my recent receipts." `couple_receipts_booking_id_idx` on (couple_id, booking_id) WHERE booking_id IS NOT NULL — partial index for "receipts against this booking" queries.

### record_payment() — the booking state machine in one function

Critical to B3 architecture. Documented in the Postgres functions table above; full behaviour:

1. Locks the booking row with `SELECT FOR UPDATE` (prevents concurrent payment races).
2. Adds `p_amount` to `amount_paid`. **`p_amount` may be negative** — this is how `delete_receipt` reverses a contribution. No CHECK enforces non-negative `amount_paid`.
3. Recomputes `state` via CASE expression:
   - `'paid'` if `amount_total IS NOT NULL AND amount_paid >= amount_total`
   - `'advance_paid'` if `amount_paid > 0 AND (amount_advance IS NULL OR amount_paid >= amount_advance)`
   - `'booked'` otherwise
4. If `p_receipt_id` is provided, sets that receipt's `booking_id` to `p_booking_id`. This is how Branch B/C of the receipt 3-branch flow links a newly-saved receipt to its booking, atomically with the payment.
5. Returns the updated booking row (full `couple_bookings` shape).

The agent reads the returned row and surfaces the numbers verbatim in its reply. **No arithmetic in the agent, ever.** This is the single source of truth for `couple_bookings.amount_paid` and `state` — no other code path may update these fields. The tool layer enforces this discipline.

---

## Migration sequence (applied + pending)

| File | Session | What it adds |
|---|---|---|
| ~~0013_couples_onboarding.sql~~ | B1 | ✅ Applied 2026-05-16 |
| ~~0014_conversations_xor.sql~~ | B1 | ✅ Applied 2026-05-16 (bugfix discovered live) |
| ~~0015_pronouns_and_dedup.sql~~ | B1 | ✅ Applied 2026-05-16 |
| ~~0016_muse_and_circle.sql~~ | B2 | ✅ Applied 2026-05-16 |
| ~~0017_circle_sessions.sql~~ | B2 | ✅ Applied 2026-05-16 |
| ~~0018_fix_muse_saves_fk.sql~~ | B2 hotfix | ✅ Applied 2026-05-16 (post-B2 SQL Editor; backfilled to repo) |
| ~~0019_bride_planner.sql~~ | B3 | ✅ Applied 2026-05-16 |
| ~~0020_drop_priority.sql~~ | B3 | ✅ Applied 2026-05-17 |
| ~~0021_couple_receipts_label.sql~~ | B3 | ✅ Applied 2026-05-17 |
| ~~0022_task_event_merge.sql~~ | B3 | ✅ Applied 2026-05-17 |
| ~~0023_circle_cleanup.sql~~ | P1-1 | ✅ Applied 2026-05-17 — expires_at on circle_members, summary_message_id FK, unique partial index (M2 fix), structured exceptions on invite/claim functions |
| 0024_vendor_profile.sql | Phase 2 | vendors.aesthetic_tags, vendors.rate_min/max, vendor_portfolio table, portfolios storage bucket |
| **0025_hot_dates.sql** | **P2-1** | **hot_dates table. Vivah Muhurat 2026/2027. Applied 2026-05-18.** |
| 0026_invoices_last_payment_at.sql | Phase 2 | invoices.last_payment_at timestamptz. Set by record_payment. |
| 0027_discover.sql | Phase 3 | couple_vendor_connections, discover_readiness, vendors.discover_eligible |
| **0028_pin_auth.sql** | **P2-3** | **✅ Applied 2026-05-18. vendors/couples PIN columns (pin_hash, pin_failed_attempts, pin_locked_until). enforce_role_xor() + triggers.** |
| **0031_invite_codes.sql** | **P2-3** | **✅ Applied 2026-05-18. invite_codes table + consume_invite_code() function.** |
| **0032_waitlist_signups.sql** | **P2-3** | **✅ Applied 2026-05-18. waitlist_signups table.** |
| **0033_otp_sessions.sql** | **P2-3** | **✅ Applied 2026-05-18. otp_sessions table. Transient OTP state for PWA login.** |
| **0030_landing_assets.sql** | **P2-5** | **✅ Applied 2026-05-19. landing_slides + exploring_photos tables. Seeded with 3 Cloudinary URLs.** |
| **0046_demo_profiles.sql** | **B-Collab** | **✅ Applied 2026-05-24. Demo vendor profiles for thedreamai.in demo subdomain.** |
| **0047_demo_session_token.sql** | **B-Collab** | **✅ Applied 2026-05-24. vendors.demo_session_token + vendors.demo_session_expires_at. Index on demo_session_token WHERE NOT NULL.** |
| **0048_collab.sql** | **B-Collab** | **✅ Applied 2026-05-24. collab_posts + collab_responses tables. Vendor-to-vendor requirement board. Full schema in Migration 0048 section below.** |

---


---

## B-3 — Couple data API (migration 0042, applied 2026-05-21)

### Migration 0042 — circle comment count triggers

Added to support `circle_comment_count` auto-increment on `muse_saves` when a circle member posts a comment anchored to a muse save.

**Index:**
- `circle_activity_subject_idx` on `circle_activity(subject_id) WHERE subject_id IS NOT NULL`

**Functions:**
- `increment_circle_comment_count()` — trigger function, increments `muse_saves.circle_comment_count` on `circle_activity` INSERT where `subject_type = 'muse_save'` and `activity_type = 'comment'`
- `decrement_circle_comment_count()` — trigger function, decrements (floor 0) on DELETE

**Triggers:**
- `trg_circle_comment_inc` AFTER INSERT ON `circle_activity`
- `trg_circle_comment_dec` AFTER DELETE ON `circle_activity`

### B-3 API endpoints (no new tables — reads existing schema)

All mounted at `/api/v2/couple/*`, all require `requireCoupleAuth`.

| Endpoint | File | What it reads |
|---|---|---|
| `GET /couple/me/:coupleId` | `me.js` | `couples` joined `users(name)` — returns bride_name (from users.name), partner_name, wedding_date, wedding_city, budget_total, events_planned, planning_state, onboarding_state |
| `GET /couple/today/:coupleId` | `today.js` | `couples` (wedding_date, budget_total) + `events` (today + 30-day upcoming) + `couple_bookings` (total_spent, total_committed) |
| `GET /couple/events/:coupleId` | `events.js` | `events` filtered by couple_id + state query param |
| `GET /couple/expenses/:coupleId` | `expenses.js` | `couple_receipts` ordered by created_at desc |
| `GET /couple/circle/:coupleId` | `circle.js` | `circle_members` (active) + `circle_activity` (last 50) + `circle_members` (pending invites) |
| `POST /couple/circle/invite` | `circle.js` | Calls `invite_circle_member()` RPC — returns invite_token + wa_me_link |
| `GET /couple/bookings/:coupleId` | `bookings.js` | `couple_bookings` ordered by created_at desc |
| `GET /couple/receipts/:coupleId` | `receipts.js` | `couple_receipts` ordered by created_at desc, optional booking_id filter |

**Important:** `bride_name` in API responses comes from `users.name` (joined via `couples.user_id`). There is no `bride_name` column on the `couples` table. The `couples` table columns are exactly as defined in `0001_initial_schema.sql` plus additions from 0013, 0015, 0028 — see couples table definition above.


---

## B-3a — Coplanner API (circle member backend, no migration)

No new tables or migrations. Uses existing schema.

### New files

| File | Purpose |
|---|---|
| `src/api/circle/verifyPin.js` | `POST /api/v2/auth/verify-pin` — verifies circle member PIN against `couples.pin_hash`. Body: `{ phone, pin }`. Returns `{ success, userId }`. Phone normalised to E.164 (+91 prefix). |
| `src/api/circle/session.js` | `GET /api/v2/circle/session/:userId` — returns full CircleSession shape for coplanner. Looks up `users` by id → `circle_members` by `invitee_phone` → `couples` for bride context. |
| `src/api/couple/profile.js` | `GET /api/v2/couple/profile/:brideId` — public. Returns bride name (from `users.name`), `partner_name`, `wedding_date`, `days_until_wedding` for coplanner home. |
| `src/api/circle/feed.js` | `GET /api/v2/frost/circle/feed/:brideId` — circle activity feed. Reads `circle_activity` filtered by `couple_id`. |
| `src/api/circle/muse.js` | `GET /api/v2/circle/muse/:brideId` — bride's Muse board. `POST /circle/muse/save` — add image (validates `memberUserId` is active circle_member). `POST /circle/muse/:saveId/comment` — add comment (fires `trg_circle_comment_inc` trigger). |
| `src/api/circle/threads.js` | `GET /api/v2/frost/circle/threads/:brideId` — thread list. `GET /frost/circle/threads/:brideId/:threadId/messages` — messages in thread. |
| `src/api/circle/messages.js` | `POST /api/v2/frost/circle/messages` — send message to thread. Body: `{ userId, thread_id, body, sender_name }`. Note: `userId` = `couple_id` (bride) per frontend convention. |
| `src/api/circle/dreamai.js` | `GET /api/v2/dreamai/circle-member-history/:userId` — last 30 messages from circle_thread. `POST /dreamai/circle-member-chat` — calls `runCircleAgenticTurn`, returns `{ success, data: { reply } }`. Body: `{ user_id, primary_user_id, message }`. |
| `src/api/middleware/requireCircleMemberAuth.js` | JWT-based middleware (built but not used — coplanner sends no auth headers). Reserved for future hardening. |

### Auth pattern

Coplanner sends **no Authorization header**. Auth is by param:
- `memberUserId` (query/body) → looked up via `users.phone` → `circle_members.invitee_phone` (E.164 match)
- `brideId` (URL param) = `couple.id`

**Security debt:** `GET /frost/circle/feed` and `GET /frost/circle/threads` validate only that `brideId` is a valid couple — not that the caller is a circle member. Fix before public launch by requiring `userId` query param and validating against `circle_members`.

### Phone format

`users.phone` and `circle_members.invitee_phone` both stored as E.164 (`+919888294440`). Direct match. No stripping needed.

### Permissions

No `permissions` column on `circle_members`. All active members get hardcoded defaults:
```json
{
  "dreamai_access_granted": false,
  "can_see_budget": false,
  "can_see_guests": false,
  "can_see_vendors": false,
  "can_contribute_muse": true
}
```

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

### hot_dates
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| date | date NOT NULL | The Muhurat date |
| note | text | Description e.g. "Akshaya Tritiya", "Dev Uthani Ekadashi" |
| region | text | Default "All India". For region-specific muhurats. |
| created_at | timestamptz | auto |

Index: idx_hot_dates_date on (date).
No vendor_id — shared reference table, read-only from agent.
Populated annually each October by Swati or Dev via Supabase or admin panel (Phase 2).
Seeded with 60+ dates for 2026 and 2027.

### invite_codes (added 0031, P2-3)
| Column | Type | Notes |
|---|---|---|
| code | text PK | 8-char uppercase alphanumeric. Alphabet: ABCDEFGHJKMNPQRSTUVWXYZ23456789 (no 0/O/1/I/L). Stored uppercase, case-insensitive lookup in consume function. |
| kind | text NOT NULL | CHECK (dreamer, maker). Dreamer = bride. Maker = vendor. |
| tier | text | Nullable. Provisioning-ready for future pricing. No CHECK constraint yet. |
| notes | text | Admin-only internal note. Never user-visible. |
| created_at | timestamptz NOT NULL | default now() |
| created_by | text | Free-text label of who minted the code (admin, swati, dev). |
| consumed_at | timestamptz | NULL = unconsumed. Stamped atomically by consume_invite_code(). |
| consumed_by_user_id | uuid FK → users(id) ON DELETE SET NULL | Set when consumed. |

Indexes: `invite_codes_unconsumed_idx` on (code) WHERE consumed_at IS NULL. `invite_codes_created_at_idx` on (created_at DESC).
Function: `consume_invite_code(p_code, p_user_id)` — atomic, race-safe via WHERE consumed_at IS NULL guard. Returns (kind, tier). Raises P0001 with hint invite_code_invalid or invite_code_already_consumed.
Admin: GET/POST /admin/invite-codes — mint form + recent codes table. Password-gated.

### waitlist_signups (added 0032, P2-3)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| kind | text NOT NULL | CHECK (dreamer, maker). Which landing page form was submitted. |
| name | text NOT NULL | Raw, as entered. |
| phone | text NOT NULL | E.164 with leading +. Frontend country-code dropdown, default +91 India. API validates ^\+[0-9]{8,15}$. No UNIQUE constraint — duplicate submissions allowed, admin decides. |
| instagram_handle | text NOT NULL | Raw, no @. API strips leading @ before insert. Mirrors vendors.instagram_handle convention. |
| status | text NOT NULL | default 'new'. CHECK (new, contacted, invited, ignored). Admin triage state. |
| notes | text | Admin-only triage notes. |
| created_at | timestamptz NOT NULL | default now() |
| updated_at | timestamptz NOT NULL | default now(), auto via set_updated_at() trigger. |

Indexes: `waitlist_signups_new_recent_idx` on (created_at DESC) WHERE status = 'new'. `waitlist_signups_created_at_idx` on (created_at DESC).
Trigger: `waitlist_signups_updated_at` — reuses set_updated_at() from 0001.
Confirmation copy (locked): "We are onboarding in small batches and shall be getting in touch with you soon."

### otp_sessions (added 0033, P2-3)
| Column | Type | Notes |
|---|---|---|
| phone | text PK | E.164. One row per phone — upsert on send-otp overwrites any prior OTP. |
| otp_hash | text NOT NULL | bcrypt hash of 6-digit OTP. Never stored plaintext. |
| purpose | text NOT NULL | CHECK (login, reset). Matched at verify time to prevent cross-purpose reuse. |
| expires_at | timestamptz NOT NULL | now() + 5 minutes. verify-otp rejects expired rows. |
| created_at | timestamptz NOT NULL | default now() |

Index: `otp_sessions_expires_at_idx` on (expires_at).
No FK to users — intentional. Allows OTP rows before users row exists on some error paths.
Single-use: row deleted immediately on successful verify-otp.
No FK to users — intentional, see migration 0033 header.

### landing_slides (added 0030, P2-5)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | uuid_generate_v4() |
| image_url | text NOT NULL | Cloudinary delivery URL. Frontend renders this directly. |
| cloudinary_public_id | text | Nullable. Present when uploaded via admin panel. NULL when URL pasted from outside. |
| caption | text | Nullable. |
| display_order | integer NOT NULL | default 0. ASC order. |
| active | boolean NOT NULL | default true. false = skipped by public endpoint. |
| created_at | timestamptz NOT NULL | default now() |
| updated_at | timestamptz NOT NULL | default now(), auto via set_updated_at() trigger. |

Index: landing_slides_active_order_idx on (display_order) WHERE active = true.
Endpoint: GET /api/v2/landing-slides. Public. Returns { ok, slides: [...] }.
Seeded: 3 Cloudinary URLs from cloud dccso5ljv. Same URLs hardcoded as FALLBACK_SLIDES in frontend.
Admin UI: post-Phase 2 admin session. Until then: manage via Supabase SQL Editor.

### exploring_photos (added 0030, P2-5)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | uuid_generate_v4() |
| image_url | text NOT NULL | Cloudinary delivery URL. |
| cloudinary_public_id | text | Nullable. |
| caption | text | Nullable. |
| display_order | integer NOT NULL | default 0. |
| active | boolean NOT NULL | default true. |
| created_at | timestamptz NOT NULL | default now() |
| updated_at | timestamptz NOT NULL | default now(), auto via set_updated_at() trigger. |

Index: exploring_photos_active_order_idx on (display_order) WHERE active = true.
Endpoint: GET /api/v2/exploring-photos. Public. Returns { ok, photos: [...] }.
Purpose: editorial mood gallery for Just Exploring entry on landing page (anonymous visitors).
Distinct from Discover preview (vendor profiles inside PWA - Phase 2 Block 5, not built yet).
Seeded: same 3 Cloudinary URLs as landing_slides. Swati expands via admin panel post-Phase 2.


---

## Migrations 0034 + 0035 (applied 2026-05-20)

### 0034 — vendor_foundation
- vendors: added aesthetic_tags text[], rate_min int, rate_max int, discover_preview boolean
- invoices: added last_payment_at timestamptz
- New table: vendor_portfolio (id, vendor_id, url, caption, display_order, created_at)
- New storage bucket: portfolios (public, 5MB, jpeg/png/webp/heic)

### 0035 — vendor_writes
- Added deleted_at timestamptz null to: leads, clients, invoices, expenses, events
- leads: added source text default 'whatsapp'
- New table: vendor_availability (id, vendor_id, blocked_date date, reason, created_at, unique vendor_id+blocked_date)

**Latest migration:** 0064 (vendors base_fee columns)
**Next migration number:** 0065
*(Note: this marker is historical context from the 0034/0035 session; see the top of this file for the current migration state.)*

---

## Block 5 tables (migration 0039, applied 2026-05-21)

### vendor_portfolio
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| image_url | text | Cloudinary secure_url |
| caption | text | nullable |
| aesthetic_tags | jsonb | default [] |
| is_hero | boolean | default false — one hero per vendor (atomic unset) |
| in_carousel | boolean | default true |
| approval_state | text | pending / approved / rejected |
| reviewed_by_admin | text | nullable |
| reviewed_at | timestamptz | nullable |
| rejection_reason | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | trigger set_updated_at |

### vendor_discover_requests
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| state | text | requested / under_review / approved / denied / revoked |
| reason | text | vendor pitch or admin decision note |
| decided_by_admin | text | nullable |
| decided_at | timestamptz | nullable |
| created_at | timestamptz | |

### couture_appointments
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| couple_id | uuid FK couples | ON DELETE SET NULL |
| appointment_at | timestamptz | |
| duration_minutes | integer | default 60 |
| fee_inr | integer | Rs 2000–5000 |
| state | text | booked / confirmed / completed / cancelled / no_show |
| razorpay_order_id | text | nullable — stubbed pending KYC |
| paid_at | timestamptz | nullable |
| vendor_payout_inr | integer | 80% of fee, set on payment capture |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | trigger set_updated_at |

### couture_availability
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| slot_at | timestamptz | UNIQUE per vendor |
| duration_minutes | integer | default 60 |
| fee_inr | integer | |
| state | text | open / booked / blocked |
| booked_by_appointment_id | uuid FK couture_appointments | ON DELETE SET NULL |
| created_at | timestamptz | |

### vendor_featured_submissions
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| slot_kind | text | discover_top / spotlight / blind_swipe_priority / newsletter |
| hero_image_id | uuid FK vendor_portfolio | ON DELETE SET NULL |
| caption | text | nullable |
| proposed_start_date | date | nullable |
| proposed_end_date | date | nullable |
| fee_inr | integer | calculated from slot_kind × weeks |
| razorpay_order_id | text | nullable — stubbed pending KYC |
| paid_at | timestamptz | nullable |
| state | text | submitted / under_review / approved / rejected / live / expired / refunded |
| scheduled_start | timestamptz | set by admin on approval |
| scheduled_end | timestamptz | set by admin on approval |
| rejection_reason | text | nullable |
| decided_by_admin | text | nullable |
| decided_at | timestamptz | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | trigger set_updated_at |

### admin_activity_log
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| admin_email | text | |
| action | text | discover_grant / discover_deny / discover_revoke / etc |
| target_type | text | vendor / couple / photo / featured / couture |
| target_id | uuid | nullable |
| metadata | jsonb | default {} |
| created_at | timestamptz | |

### vendors additions (migration 0039)
| Column | Type | Notes |
|---|---|---|
| discover_eligible | boolean | default false — admin-managed editorial toggle |
| discover_request_state | text | not_requested / requested / under_review / approved / denied / revoked |
| couture_eligible | boolean | default false — admin invite-only toggle |
| featured_eligible | boolean | default false — admin toggle, requires discover_eligible |


---

## Block 6 — Team Hub (migration 0040)

### team_members
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| name | text | required |
| role | text | second_shooter / assistant / editor / runner / videographer / makeup_artist / coordinator / other |
| phone | text | E.164 format |
| daily_rate_inr | integer | nullable |
| notes | text | nullable |
| active | boolean | default true |
| deleted_at | timestamptz | soft delete |
| created_at | timestamptz | |
| updated_at | timestamptz | trigger set_updated_at |

### team_tasks
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| assigned_to_member_id | uuid FK team_members | ON DELETE SET NULL |
| linked_event_id | uuid FK events | ON DELETE SET NULL |
| title | text | required |
| description | text | nullable |
| due_date | date | nullable |
| priority | text | low / normal / high / urgent |
| state | text | open / in_progress / done / cancelled |
| completed_at | timestamptz | stamped when state → done |
| deleted_at | timestamptz | soft delete |
| created_at | timestamptz | |
| updated_at | timestamptz | trigger set_updated_at |

### team_messages
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| body | text | required |
| pinned | boolean | default false — pinned messages surface in briefing |
| sent_to_count | integer | nullable — optional record of recipients |
| linked_event_id | uuid FK events | ON DELETE SET NULL |
| created_at | timestamptz | |

### team_payments
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| team_member_id | uuid FK team_members | ON DELETE CASCADE |
| linked_event_id | uuid FK events | ON DELETE SET NULL |
| linked_task_id | uuid FK team_tasks | ON DELETE SET NULL |
| description | text | nullable |
| amount_inr | integer | CHECK > 0 |
| state | text | owed / paid / cancelled |
| paid_at | timestamptz | stamped on mark-paid |
| paid_via | text | cash / upi / bank / other |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | trigger set_updated_at |

**Side effect:** marking a team payment as paid auto-creates an `assistant` category expense in the `expenses` table.

---

## Block 7 — Payment Schedules, Contracts, TDS (migration 0041)

### payment_schedules
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| invoice_id | uuid FK invoices | ON DELETE CASCADE |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| milestone_label | text | e.g. "Booking", "Shoot day", "Delivery" |
| pct | numeric(5,2) | CHECK > 0 AND <= 100 — percentages must sum to 100 across invoice |
| amount_due | integer | denormalised: invoice.amount_total × pct/100 at create time |
| due_date | date | nullable — some milestones are event-driven |
| state | text | pending / paid / waived |
| paid_at | timestamptz | stamped on mark-paid |
| paid_amount | integer | captured at mark-paid — may differ from amount_due |
| ordinal | integer | display order; UNIQUE per invoice |
| created_at | timestamptz | |
| updated_at | timestamptz | trigger set_updated_at |

**Constraint:** Sum of pct must equal 100 — enforced in code, not DB CHECK.
**Sync rule:** marking a milestone paid also bumps `invoices.amount_paid` — done in JS (sequential awaits).

### invoices additions (migration 0041)
| Column | Type | Notes |
|---|---|---|
| has_schedule | boolean | default false — set true when schedule created, false when deleted |

### contracts
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| client_id | uuid FK clients | ON DELETE SET NULL |
| lead_id | uuid FK leads | ON DELETE SET NULL |
| invoice_id | uuid FK invoices | ON DELETE SET NULL |
| title | text | required |
| storage_path | text | contracts/{vendor_id}/{contract_id}.pdf — set after upload |
| file_size | integer | bytes — set on finalize |
| mime_type | text | default application/pdf |
| notes | text | nullable |
| state | text | draft / sent / signed / cancelled |
| sent_at | timestamptz | stamped when state → sent |
| signed_at | timestamptz | stamped when state → signed |
| created_at | timestamptz | |
| updated_at | timestamptz | trigger set_updated_at |

**Storage:** Supabase Storage bucket `contracts` (private). Signed URLs generated on demand (1hr expiry for download, 5min for upload).
**Upload pattern:** Two-phase — backend creates draft row + returns signed upload URL → frontend uploads directly to Storage → finalize call reads file metadata.
**Cleanup:** Draft contracts older than 24h with no file are deleted by cron (3am IST daily).

### tds_ledger
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| invoice_id | uuid FK invoices | ON DELETE SET NULL |
| client_id | uuid FK clients | ON DELETE SET NULL |
| client_name | text | snapshot — survives client delete |
| client_pan | text | deductor PAN — required for 26AS reconciliation |
| client_tan | text | deductor TAN |
| gross_amount | integer | CHECK > 0 |
| tds_rate | numeric(4,2) | CHECK 0–30% |
| tds_amount | integer | computed: gross × rate / 100 |
| net_received | integer | computed: gross − tds_amount |
| section | text | income tax section code e.g. 194J (professional), 194C (contractors) |
| deduction_date | date | required |
| financial_year | text | FY2026-27 format — Indian FY (Apr–Mar) |
| certificate_no | text | Form 16A certificate number — nullable |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | trigger set_updated_at |

**FY helper:** `currentFinancialYear()` in `src/lib/vendor/tds.js` — Apr–Mar Indian calendar.
**Hard delete:** TDS entries are hard-deleted (vendor-managed tax records — soft delete adds year-end confusion).
**CSV export:** `GET /api/v2/vendor/tds/:vendorId/export?financial_year=FY2026-27` returns text/csv.


## Migration 0043 — Taste Profile (B-6)
**Applied:** 2026-05-22

### couples table additions
| Column | Type | Default | Notes |
|---|---|---|---|
| `taste_quiz_done` | boolean | false | True after bride submits aesthetic tags. Muse overlay never shows again. |
| `aesthetic_tags` | jsonb | [] | Her selected taste tags e.g. ["moody","editorial"]. jsonb to match muse_saves/vendors/vendor_portfolio. |

**Type fix applied out of band:** Initially created as `text[]`, converted to `jsonb` via DROP DEFAULT → ALTER TYPE → SET DEFAULT.

### Endpoints added (B-6)
- `POST /api/v2/couple/taste` — saves aesthetic_tags + flips taste_quiz_done
- `GET /api/v2/couple/taste/profile` — returns tags + flag
- `GET /api/v2/couple/taste/surprise` — returns curated images matching her tags (vendor portfolio + Gemini grounded search + Unsplash fallback)
- `POST /api/v2/couple/expenses/:coupleId` — manual expense add to couple_receipts
- `POST /api/v2/couple/chat` — SSE bridge to brideEngine (B-5, documented here)

### Note on taste_quiz_images
Original 0043 draft created `taste_quiz_images` table — dropped. Not needed.
`DROP TABLE IF EXISTS taste_quiz_images;` — run in next session cleanup migration.


## Migration 0048 — Collab (B-Collab)
**Applied:** 2026-05-24

### collab_posts
Vendor-to-vendor requirement board. A vendor posts a collab requirement (e.g. second shooter, hair stylist) for a specific date. Poster identity anonymised until connection accepted.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| vendor_id | uuid FK vendors | ON DELETE CASCADE — the poster |
| requirement_type | text NOT NULL | CHECK: photography / videography / makeup / mehendi / decor / catering / venue / music_dj / music_live / choreography / planning / transport / invitations / jewellery / attire / other. Maps to VENDOR_CATEGORIES. |
| event_date | date NOT NULL | When the collab is needed |
| city | text NOT NULL | Where |
| open_to_other_cities | boolean NOT NULL | default false. If true, vendors from other cities who open_to_travel also see this post |
| budget_inr | integer | Nullable — some collabs are equity/credit |
| payment_period | text | CHECK: per_day / per_shoot / total / tbd. Nullable. |
| event_type | text | CHECK: wedding / pre_wedding / engagement / editorial / brand_shoot / portrait / other. Nullable. |
| details | text | Max 200 chars (CHECK constraint). Nullable. |
| state | text NOT NULL | CHECK: open / filled / expired / cancelled. Default 'open'. |
| expires_at | timestamptz NOT NULL | default now() + 30 days. Cron expires at 03:15 IST daily. |
| created_at | timestamptz NOT NULL | default now() |
| updated_at | timestamptz NOT NULL | default now(), auto via set_updated_at() trigger |

Indexes: `collab_posts_vendor_id_idx` on (vendor_id, created_at DESC). `collab_posts_feed_idx` on (requirement_type, city, state, event_date) WHERE state = 'open'. `collab_posts_expires_idx` on (expires_at) WHERE state = 'open'.

### collab_responses
A vendor's response to a collab post. 'passed' is invisible to the poster. Identity revealed only when poster accepts ('accepted').

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| post_id | uuid FK collab_posts | ON DELETE CASCADE |
| responder_vendor_id | uuid FK vendors | ON DELETE CASCADE |
| state | text NOT NULL | CHECK: interested / accepted / declined / withdrawn / passed. Default 'interested'. |
| poster_notified_at | timestamptz | Stamped when poster receives WhatsApp notification. Nullable. |
| contact_shared_at | timestamptz | Stamped when poster accepts — contact shared with both parties. Nullable. |
| created_at | timestamptz NOT NULL | default now() |
| updated_at | timestamptz NOT NULL | default now(), auto via set_updated_at() trigger |

Constraints: UNIQUE (post_id, responder_vendor_id) — one response per vendor per post, enforced at DB level.

Indexes: `collab_responses_post_id_idx` on (post_id, state, created_at DESC). `collab_responses_responder_idx` on (responder_vendor_id, created_at DESC).

### Tier gating
| Action | Essential | Signature | Prestige | Trial |
|---|---|---|---|---|
| View feed (OPPORTUNITIES tab) | ✓ | ✓ | ✓ | ✓ |
| Respond (Interested / Pass) | ✓ | ✓ | ✓ | ✓ |
| Post a requirement | ✗ | ✓ | ✓ | ✓ |
| Connect with responders | ✗ | ✓ | ✓ | ✓ |

### Backend
- `src/api/vendor/collab.js` — 7 endpoints mounted at `/api/v2/vendor/collab` via `core.js`
- Cron: `src/cron.js` — collab expiry at 03:15 IST (21:45 UTC) daily

### Frontend
- `dreamai/app/wedding/collab/page.tsx` — main Collab page (DISCOVER mode, 3rd tab)
- `dreamai/app/wedding/collab/[post_id]/responses/page.tsx` — responses sub-page (poster only)

---

## Migration table update — 0049 through 0060

| File | Session | Status |
|---|---|---|
| **0049_lead_intent_summary.sql** | **B-DreamAi** | **✅ Applied 2026-05-25. `lead_intent_summary` table — Haiku-cached one-line intent per lead for returning-bride notifications.** |
| **0050_pending_lead_pings.sql** | **B-DreamAi** | **✅ Applied 2026-05-25. `pending_lead_pings` table — 10-min window for un-acked vendor lead pings (she/her disambiguation).** |
| **0051_pending_event_proposals.sql** | **B-DreamAi** | **✅ Applied 2026-05-25. `pending_event_proposals` table — staged events extracted from WhatsApp calendar screenshot via Haiku Vision.** |
| **0052_lead_wedding_date_precision.sql** | **B-DreamAi** | **✅ Applied 2026-05-25. `leads.wedding_date_precision` column — keeps month/year sentinels readable without changing wedding_date storage.** |
| **0053_image_throttle_log.sql** | **B-DreamAi** | **✅ Applied 2026-05-25. `image_throttle_log` table — rate-limits inbound WhatsApp images to 2 per 30s per phone number.** |
| **0054_image_throttle_rejection_sent.sql** | **B-DreamAi** | **✅ Applied 2026-05-25. `image_throttle_log.rejection_sent` column — ensures only one rejection reply per 30s burst window.** |
| **0055_bride_pages.sql** | **B-Frost** | **✅ Applied 2026-05-27. `bride_pages` table — the diary surface. One row per journal entry; DreamAi reads via `read_pages` tool.** |
| **0056_remove_demo_columns.sql** | **B-Demo** | **✅ Applied 2026-05-27. Drops 8 demo_* columns from `vendors` table. Drops `demo_profile_views` table. Old demo system fully excised.** |
| **0057_demo_system.sql** | **B-Demo** | **✅ Applied 2026-05-27. `demo_vendors` + `demo_leads` + `demo_muse_pool` tables. Clean rebuild, zero FK to real vendors/users. Extends `otp_sessions.purpose` to allow `demo_enquiry`.** |
| **0058_demo_claim_requests.sql** | **B-Demo** | **✅ Applied 2026-05-28. `demo_claim_requests` table — tracks vendors who tap "Claim Your Studio" on the demo landing page.** |
| **0059_moments_surface.sql** | **B-Frost** | **✅ Applied 2026-05-29. `muse_saves.surface` column — TEXT NOT NULL DEFAULT 'muse' CHECK IN ('muse','moments'). Routes personal candids to Moments room, inspiration to Muse board. Vision classifier (imageOCRRouter) returns muse/receipt/moment based on 50+ labels.** |
| **0060_booking_contact.sql** | **B-Frost** | **✅ Applied 2026-05-29. `couple_bookings.contact_phone` column — TEXT nullable. Stores vendor contact number for in-app WA+Call buttons in VendorsRoom.** |
| **0061_otp_circle_join.sql** | **B-Frost** | **✅ Applied 2026-05-29. `otp_sessions.purpose` CHECK constraint widened — adds 'circle_join' (prior: login/reset/demo_enquiry). Allows the circle invite → co-planner join flow to send invite-scoped OTPs that can never be confused with login/reset codes.** |
| **0062_couple_enquiries.sql** | **B-Frost** | **✅ Applied 2026-05-29. `couple_enquiries` table — bride's Discover enquiry ledger. One row per (couple, vendor) pair. Powers the "Enquired" section in the Frost Vendors room with a pre-filled TDW wa.me link. Distinct from enquiry_taps (analytics), leads (vendor side), and couple_bookings (committed vendors). Unique index on (couple_id, vendor_id).** |

**Latest migration applied:** 0064 (vendors base_fee columns, 2026-05-30)
**Next migration number:** 0065

---

## Migration 0049 — Lead Intent Summary
**Applied:** 2026-05-25

### lead_intent_summary

Haiku-extracted one-line intent summary cached per lead. Used by the returning-bride notification system to personalise the "she's back" vendor ping without a second Haiku call. Cache expires after 30 days and is regenerated on next contact.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| lead_id | uuid FK leads | ON DELETE CASCADE. One row per lead. |
| vendor_id | uuid FK vendors | ON DELETE CASCADE. Denormalised for fast lookup by vendor. |
| summary | text NOT NULL | Haiku-generated one-liner e.g. "Bride planning a December Delhi wedding, budget ~₹3L, needs full-day coverage." Max ~200 chars in practice; no DB constraint. |
| generated_at | timestamptz NOT NULL | default now(). Stamped on insert or upsert. |
| expires_at | timestamptz NOT NULL | default now() + 30 days. Expired rows are regenerated on next returning-bride event; never served stale. |

Constraint: UNIQUE (lead_id) — upserted on every new summary generation. One summary per lead at any time.

Indexes: `lead_intent_summary_lead_idx` on (lead_id). `lead_intent_summary_expires_idx` on (expires_at).

**Usage pattern:** `brideEngine.js` → `buildDynamicContext()` — checks for non-expired row before calling Haiku. If absent or expired: generates, upserts, returns. Backend never serves an expired summary.

---

## Migration 0050 — Pending Lead Pings
**Applied:** 2026-05-25

### pending_lead_pings

10-minute acknowledgement window for un-acked vendor lead pings. Created when a new lead arrives (create_lead tool) or when a returning bride makes first contact after a gap. Consumed when vendor replies or 10 minutes elapses. Drives the "she/her" disambiguation pattern — vendor agent reads pending pings before composing any outbound WhatsApp message to ensure pronouns are set correctly.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| lead_id | uuid FK leads | ON DELETE CASCADE |
| ping_type | text NOT NULL | CHECK: new_lead / returning_bride / first_contact. Determines notification copy and urgency. |
| bride_name | text | Snapshot of lead.name at ping time. Survives lead.name updates. |
| created_at | timestamptz NOT NULL | default now() |
| expires_at | timestamptz NOT NULL | default now() + 10 minutes |
| acknowledged_at | timestamptz | NULL = unacknowledged. Stamped on first vendor reply or explicit dismiss. |

Constraint: UNIQUE (vendor_id, lead_id) — one pending ping per vendor per lead at a time. Re-triggered by upserting with new expires_at.

Indexes: `pending_lead_pings_vendor_idx` on (vendor_id, expires_at) WHERE acknowledged_at IS NULL. `pending_lead_pings_expires_idx` on (expires_at).

**Cleanup:** Expired un-acked pings are purged by cron at 03:30 IST daily. No user-visible effect — they simply expire silently.

---

## Migration 0051 — Pending Event Proposals
**Applied:** 2026-05-25

### pending_event_proposals

Staged events extracted from a WhatsApp calendar screenshot via Haiku Vision. When a vendor sends an image of their booking calendar/diary, the agent extracts each entry as a pending_event_proposals row. Vendor confirms or discards via `commit_event_proposals` tool — confirmed rows are promoted to the `events` table; discarded rows are deleted.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| title | text NOT NULL | Haiku-extracted event title e.g. "Sharma Wedding", "Pre-wedding shoot". |
| event_date | date NOT NULL | Extracted date. Where year is ambiguous, nearest future year assumed. |
| event_time | text | Nullable. Raw time string as extracted e.g. "10am", "2:30 PM". Not parsed to timestamptz to preserve ambiguity. |
| city | text | Nullable. Extracted city or venue hint. |
| notes | text | Nullable. Any additional context Haiku extracted e.g. "beach location", "₹45K advance paid". |
| confidence | text NOT NULL | CHECK: high / medium / low. Haiku self-reports. Low-confidence rows shown with caution flag in UI. |
| source_image_url | text | Cloudinary URL of the source image that triggered this extraction. Nullable — set when image persisted to Cloudinary. |
| created_at | timestamptz NOT NULL | default now() |
| expires_at | timestamptz NOT NULL | default now() + 2 hours. Proposals not committed within 2h are auto-purged. |

Indexes: `pending_event_proposals_vendor_idx` on (vendor_id, created_at DESC). `pending_event_proposals_expires_idx` on (expires_at).

**Commit flow:** `POST /api/v2/vendor/events/commit-proposals` — body: `{ vendor_id, proposal_ids: [...] }`. For each id: inserts into `events` (kind=wedding, state=upcoming), then deletes the proposal row. Returns `{ committed: n, skipped: m }`.

**Cron:** Proposals purged at expires_at by the same 03:30 IST sweep that handles pending_lead_pings.

---

## Migration 0052 — Lead Wedding Date Precision
**Applied:** 2026-05-25

### leads table addition

| Column | Type | Notes |
|---|---|---|
| wedding_date_precision | text | Nullable. CHECK: 'day' \| 'month' \| 'year'. Default NULL (treated as 'day'). |

**Problem solved:** When a bride says "sometime in July 2026", the agent sets `wedding_date = 2026-07-01` (1st-of-month sentinel). Without precision tracking, the UI renders "1 Jul 2026" — which is wrong and confusing. With `wedding_date_precision = 'month'`, the frontend renders "Jul 2026" instead.

**Sentinel convention:**
- `precision = 'day'` (or NULL) → render full date: "15 Nov 2026"
- `precision = 'month'` → `wedding_date` set to 1st of month → render "Nov 2026"
- `precision = 'year'` → `wedding_date` set to Jan 1 of year → render "2026"

**Agent behaviour:** `create_lead` and `update_lead` tools accept optional `wedding_date_precision` param. When bride gives only a month ("December wedding"), agent sets precision='month' and wedding_date to Dec 1 of inferred year.

Index: no new index — existing `leads_vendor_id_idx` and `leads_wedding_date_idx` cover the access patterns.

---

## Migration 0053 — Image Throttle Log
**Applied:** 2026-05-25

### image_throttle_log

Rate-limits inbound WhatsApp images to 2 per 30-second window per phone number, across both the vendor DreamAi engine and the couple DreamAi engine. Prevents Vision API cost explosions when a vendor or bride forwards a burst of photos (common with Indian WhatsApp users forwarding wedding inspo).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| phone | text NOT NULL | E.164 sender phone number. No FK to users — throttle applies before authentication. |
| engine | text NOT NULL | CHECK: vendor / couple. Which DreamAi pipeline received the image. |
| received_at | timestamptz NOT NULL | default now(). Stamped on image receipt, before Vision call. |
| rejection_sent | boolean NOT NULL | default false. See migration 0054. |

**Window logic:** Before each Vision call, backend queries COUNT of rows WHERE phone = $1 AND engine = $2 AND received_at > now() - 30s. If count >= 2: reject without Vision call. Insert throttle row for tracking. If count < 2: insert row, proceed with Vision.

**No UNIQUE constraint** — multiple rows per phone per window are expected and correct. The COUNT is what governs.

Indexes: `image_throttle_log_phone_engine_idx` on (phone, engine, received_at DESC). `image_throttle_log_cleanup_idx` on (received_at) — used by cron purge.

**Cron:** Rows older than 1 hour purged at 03:45 IST daily. Window is 30s so anything older is guaranteed irrelevant.

---

## Migration 0054 — Image Throttle Rejection Sent
**Applied:** 2026-05-25

### image_throttle_log addition

| Column | Type | Notes |
|---|---|---|
| rejection_sent | boolean NOT NULL | default false. Added to `image_throttle_log` via ALTER TABLE. |

**Problem solved:** When 5 images arrive in a burst, the throttle fires on images 3, 4, 5. Without tracking, the engine sends "please slow down" to the vendor/bride 3 times — annoying. With `rejection_sent`, the engine only sends one rejection reply per 30s window: on the first throttled image it sends the message AND sets rejection_sent = true. Images 4 and 5 are silently dropped.

**Update pattern:** On throttle trigger: query for any row in the window WHERE rejection_sent = true. If none found: send WhatsApp rejection message + UPDATE the current throttle row SET rejection_sent = true. If one already found: drop silently.

This column is added via ALTER TABLE to `image_throttle_log` in a standalone migration to isolate the behavioural change from the table creation.

---

## Migration 0055 — Bride Pages (The Diary)
**Applied:** 2026-05-27

### bride_pages

The Frost diary surface. One row per journal entry. Brides write one or more entries per day; each entry carries a mood (one of 12 locked values from the Frost mood vocabulary) and a body of plain text. DreamAi reads from this table via the `read_pages` tool to ground the AI in the bride's emotional weather across multiple days. The Sanctuary V Pages row renders the most-recent entry body as a preview.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| couple_id | uuid FK couples | ON DELETE CASCADE. All entries owned by the couple. |
| user_id | uuid FK users | ON DELETE CASCADE. The specific user who wrote the entry (bride or circle member in future). |
| entry_date | date NOT NULL | default current_date. The "wedding-arc day" she wrote on. Used for grouping (all entries for a day rendered together) and for the daily teal idle line in the Sanctuary timeline. |
| mood | text NOT NULL | One of 12 locked Frost vocabulary values: 'excited' / 'nervous' / 'grateful' / 'overwhelmed' / 'hopeful' / 'joyful' / 'anxious' / 'content' / 'frustrated' / 'reflective' / 'tired' / 'in_love'. No DB CHECK — locked in frontend validation and agent prompt. |
| mood_color | text NOT NULL | Hex or rgba string matching the mood. Stored denormalised for fast render without client-side lookup. Set by frontend at write time per FROST_COPY mood palette. |
| body | text NOT NULL | Plain text. No length constraint at DB level; frontend recommends 100–500 chars but does not enforce. |
| created_at | timestamptz NOT NULL | default now(). Canonical timestamp. Multiple entries on same entry_date are ordered by created_at DESC. |
| updated_at | timestamptz NOT NULL | default now(). Auto via set_updated_at() trigger. |

Indexes:
- `idx_bride_pages_couple_created` on (couple_id, created_at DESC) — Sanctuary preview (most recent entry) and history list.
- `idx_bride_pages_couple_entry_date` on (couple_id, entry_date DESC) — DreamAi "what did she write on day X" queries via `read_pages` tool.

**DreamAi access pattern:** `read_pages` tool → `GET /api/v2/couple/pages/:coupleId?limit=7&before=<ISO>` — returns last N entries ordered by created_at DESC. Agent includes the last 3–5 entries in system prompt when diary context is relevant.

**No edit/delete:** Entries are append-only at the agent level. The PWA may allow soft corrections but the table supports it — updated_at trigger is present.

**Multiple entries per day:** Fully supported. entry_date groups them visually; individual rows are ordered by created_at within a day.

---

## Migration 0056 — Remove Demo Columns from vendors
**Applied:** 2026-05-27

### vendors table columns dropped

The original demo system stored demo state directly on the `vendors` table, causing session contamination — demo JWTs were indistinguishable from real vendor sessions. Migration 0056 completely excises this.

**Columns dropped via ALTER TABLE vendors DROP COLUMN IF EXISTS:**
| Column | Previous type | Reason for removal |
|---|---|---|
| demo_handle | text | Demo URL key — moved to demo_vendors.ig_handle |
| demo_active | boolean | Demo on/off flag — moved to demo_vendors.active |
| demo_expires_at | timestamptz | Demo TTL — not needed in new system |
| demo_created_at | timestamptz | Redundant with demo_vendors.created_at |
| demo_session_token | text | Caused session contamination — completely removed |
| demo_session_expires_at | timestamptz | Token TTL — removed with token |
| demo_notes | text | Admin notes — moved to demo_vendors (implicit in display_name + about) |
| demo_instagram | text | Redundant with demo_vendors.ig_handle |

**Table dropped:**
- `demo_profile_views` — view tracking table from old system. DROP TABLE IF EXISTS.

**Effect:** Real vendor records are now clean. No demo-related columns remain on the vendors table. All demo data lives in the isolated demo_vendors / demo_leads / demo_muse_pool tables (migration 0057).

---

## Migration 0057 — Demo System (Clean Rebuild)
**Applied:** 2026-05-27

Complete rebuild of the demo infrastructure. Three new tables, zero FK to real vendors/users tables. Completely isolated from production data. Also extends the `otp_sessions` purpose constraint to support demo bride OTP verification.

### demo_vendors

Demo vendor profiles for `demo.thedreamwedding.in/vendor/[handle]`. Completely separate from the real `vendors` table. No FK to users or vendors. The ig_handle is the URL key.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| ig_handle | text NOT NULL UNIQUE | URL key: /demo/[handle]. e.g. makeupbyswatiroy. Lowercase. |
| display_name | text NOT NULL | Shown on demo landing page and studio header. |
| category | text NOT NULL | Matches vendor category vocabulary: makeup / photography / videography / decor / venue / planning / catering / mehendi / music_dj / jewellery / attire / honeymoon / invitation / other. |
| city | text NOT NULL | e.g. "Delhi", "Mumbai". |
| whatsapp_phone | text | Nullable. E.164. Where to send lead notifications on live system. Not used in current demo — leads go to admin. |
| about | text | Nullable. Short bio shown in demo discover overlay. |
| rate_display | text | Nullable. Human-readable rate range e.g. "₹50K – ₹2L". |
| photos | jsonb NOT NULL | default '[]'. Array of `{ url: string, is_hero: boolean, cloudinary_id: string }`. Rendered in landing carousel and demo discover feed. |
| active | boolean NOT NULL | default true. false = hidden from all surfaces. Admin toggle via /admin/demo. |
| created_at | timestamptz NOT NULL | default now() |
| created_by | text NOT NULL | default 'admin'. Free-text label. |

Indexes: `demo_vendors_ig_handle_idx` on (ig_handle). `demo_vendors_active_idx` on (active).

**Admin management:** `POST /api/v2/admin/demo/vendors` — create. `DELETE /api/v2/admin/demo/vendors/:id` — deactivate (sets active=false, never hard deletes). `GET /api/v2/admin/demo/vendors` — list all.

**Public endpoint:** `GET /api/v2/demo/vendor/:handle` — returns single demo vendor by handle for landing page. `GET /api/v2/demo/discover` — returns all active demo vendors shaped as DiscoverVendor for the swipe feed at demodiscover.thedreamwedding.in.

---

### demo_leads

Enquiries from demo brides to demo vendors. Completely separate from the real `leads` table. OTP-verified before a row is persisted. No FK to real leads/vendors/users.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| demo_vendor_id | uuid FK demo_vendors | ON DELETE CASCADE |
| demo_vendor_handle | text NOT NULL | Denormalised ig_handle. Survives demo_vendor record changes. |
| bride_name | text NOT NULL | As entered by the bride at OTP step. |
| bride_phone | text NOT NULL | E.164. The OTP-verified phone. |
| bride_ig_handle | text | Nullable. Optional Instagram handle entered by bride. |
| bride_email | text | Nullable. |
| bride_wedding_date | date | Nullable. |
| bride_wedding_city | text | Nullable. |
| otp_verified | boolean NOT NULL | default false. Set true after OTP verification via otp_sessions (purpose='demo_enquiry'). Only otp_verified=true rows are surfaced in admin panel and vendor demo AI. |
| notified_vendor | boolean NOT NULL | default false. Set true once WhatsApp notification sent to real vendor (manual relay by admin for now). |
| admin_notified | boolean NOT NULL | default false. Set true once admin WhatsApp notification sent. |
| created_at | timestamptz NOT NULL | default now() |

Indexes: `demo_leads_vendor_id_idx` on (demo_vendor_id). `demo_leads_created_at_idx` on (created_at DESC). `demo_leads_notified_idx` on (notified_vendor, admin_notified) — used by notification cron sweep.

**Admin panel:** `GET /api/v2/admin/demo/leads` — list all leads. `POST /api/v2/admin/demo/leads` — seed mock leads for demo. Displayed under Leads tab in /admin/demo.

---

### demo_muse_pool

Admin-curated images for the bride demo Muse board. Shown to all bride demo users at `demodreamer.thedreamwedding.in`. Purely content — no user data.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| image_url | text NOT NULL | Cloudinary delivery URL. |
| cloudinary_id | text | Nullable. Cloudinary public_id for deletion. |
| tags | text[] NOT NULL | default '{}'. Curated aesthetic tags e.g. {lehenga, decor, jewellery, mehendi, candid}. Used for filtering in bride demo Muse. |
| caption | text | Nullable. Editorial caption. |
| display_order | integer NOT NULL | default 0. ASC sort. |
| active | boolean NOT NULL | default true. |
| created_at | timestamptz NOT NULL | default now() |

Index: `demo_muse_pool_active_idx` on (active, display_order).

---

### otp_sessions.purpose constraint extension

Migration 0057 also modifies the `otp_sessions` table:

```sql
ALTER TABLE otp_sessions DROP CONSTRAINT IF EXISTS otp_sessions_purpose_check;
ALTER TABLE otp_sessions ADD CONSTRAINT otp_sessions_purpose_check
  CHECK (purpose IN ('login', 'reset', 'demo_enquiry'));
```

**Before 0057:** purpose CHECK only allowed 'login' | 'reset'.
**After 0057:** 'demo_enquiry' is a valid third purpose. Used when a bride submits an enquiry from a demo vendor landing page — OTP verifies her phone before the demo_lead row is created.

**Flow:** POST /api/v2/demo/otp/send → inserts otp_sessions row with purpose='demo_enquiry' → POST /api/v2/demo/otp/verify → validates + deletes row → POST /api/v2/demo/leads → creates demo_lead with otp_verified=true.

---

## Migration 0058 — Demo Claim Requests
**Applied:** 2026-05-28

### demo_claim_requests

Tracks vendors who tap "Claim Your Studio" on the demo landing page (`demo.thedreamwedding.in/vendor/[handle]`) and enter their phone number. Notifies admin immediately. Admin follows up manually via WhatsApp to convert the vendor to a real TDW Maker account.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| ig_handle | text NOT NULL | The demo vendor handle from the URL — e.g. makeupbyswatiroy. Not FK to demo_vendors — survives demo vendor deletion. |
| vendor_name | text | Nullable. Display name of the demo vendor at time of claim. Snapshot. |
| phone | text NOT NULL | Phone number as entered by the vendor. Raw — not E.164-enforced at DB level (frontend collects 10-digit Indian number with implied +91). |
| claimed_at | timestamptz NOT NULL | default now(). When the vendor submitted the claim. |
| contacted | boolean NOT NULL | default false. Admin toggle — set true when admin has reached out to the vendor. |
| notes | text | Nullable. Admin field for call notes, follow-up reminders etc. |

Indexes: `demo_claim_requests_handle_idx` on (ig_handle). `demo_claim_requests_claimed_at_idx` on (claimed_at DESC).

**Backend endpoint:** `POST /api/v2/demo/vendor/:handle/claim` — body: `{ phone, vendor_name }`. Inserts row. Returns `{ ok: true }` even on insert failure (vendor sees success screen regardless — critical UX, don't break the moment).

**Admin endpoints:** `GET /api/v2/admin/demo/claims` — list all claims newest first. `PATCH /api/v2/admin/demo/claims/:id/contacted` — body: `{ contacted: true|false }`. Toggle the contacted flag.

**Admin UI:** `/admin/demo` → Claims tab. Shows vendor name, handle, phone (tappable tel: link), WhatsApp button, contacted toggle, timestamp. New/uncontacted claims have gold border highlight. No contacted claims fade to default border.

**No deduplication constraint:** A vendor can claim multiple times (e.g. if they didn't hear back). Multiple rows per handle are valid and visible in the admin panel. Admin sees all attempts.

---

## Migration 0061 — OTP Sessions: circle_join Purpose
**Applied:** 2026-05-29

### otp_sessions.purpose constraint extension

The `circle_join` purpose is added to `otp_sessions` so the circle invite → co-planner join flow can send an invite-scoped OTP without that code ever being confused with a login or reset code at verify time.

```sql
alter table otp_sessions drop constraint if exists otp_sessions_purpose_check;
alter table otp_sessions add constraint otp_sessions_purpose_check
  check (purpose in ('login', 'reset', 'demo_enquiry', 'circle_join'));
```

**Before 0061:** purpose CHECK allowed `'login' | 'reset' | 'demo_enquiry'` (0057 added demo_enquiry).
**After 0061:** `'circle_join'` is a valid fourth purpose.

**Flow:** The circle invite join route (`src/api/circle/join.js`) — `/circle/join/send-otp` — creates an `otp_sessions` row with `purpose='circle_join'`. The verify endpoint rejects any row where the purpose doesn't match, so a circle-join code can never be replayed as a login.

---

## Migration 0062 — Couple Enquiries (Bride Discover Ledger)
**Applied:** 2026-05-29

### couple_enquiries

The bride's Discover enquiry ledger. One row per (couple, vendor) pair, written when the bride taps "Enquire" on a vendor in the Discover feed. Powers the **"Enquired"** section in the Frost Vendors room, where each row shows a pre-filled `wa.me/917982159047?text=TDW-<handle>` link to the TDW couple-facing agent — so the bride can follow up without leaving the immersive feed.

Distinct from:
- `enquiry_taps` — anonymous analytics counter (handle + timestamp, no couple_id)
- `leads` — the **vendor-side** record (vendor sees it in their Leads tab)
- `couple_bookings` — vendors the couple has actually committed to ("My team")

A single Discover "Enquire" tap now fans out to four places: (1) WhatsApp ping to vendor via Twilio, (2) this `couple_enquiries` row, (3) a `leads` row on the vendor side (`source='discover'`, deduped by phone via `createLead`), (4) `enquiry_taps` analytics.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| couple_id | uuid FK couples | ON DELETE CASCADE. NOT NULL. |
| vendor_id | uuid FK vendors | ON DELETE CASCADE. NOT NULL. |
| vendor_name | text | Snapshot of vendor display name at enquiry time. Nullable. |
| vendor_category | text | Snapshot of vendor category. Nullable. |
| vendor_city | text | Snapshot of vendor city. Nullable. |
| routing_handle | text | Snapshot of vendor routing handle. Used to build the wa.me link client-side without a join. Nullable. |
| vendor_lead_id | uuid | The `leads.id` created on the vendor side. Nullable (set on successful createLead). |
| created_at | timestamptz NOT NULL | default now() |

Indexes:
- `couple_enquiries_couple_vendor_uidx` — UNIQUE on (couple_id, vendor_id). Re-enquiring the same vendor upserts (bumps created_at) rather than creating a duplicate row.
- `couple_enquiries_couple_idx` — on (couple_id, created_at DESC). Powers the Vendors room "Enquired" list sorted newest-first.

**Backend:**
- `POST /api/v2/discover/enquire` — public (no JWT). Body: `{ vendor_id, couple_id?, bride_name?, bride_phone? }`. Fan-out: Twilio WA ping → createLead (vendor side, deduped) → couple_enquiries upsert (if couple_id provided) → enquiry_taps insert. Each step try/catch so a partial failure never 500s the enquiry.
- `GET /api/v2/couple/enquiries` — requireCoupleAuth. Returns `{ enquiries: [...] }`. Mounted in `src/api/couple/core.js` as B-11.

**Frontend:**
- Vendors room "Enquired" section (above "My team"): fetches on mount, renders vendor name/category + a green WhatsApp button per row.
- `fetchEnquiries()` in `lib/frost/journey.ts` — `CoupleEnquiry` interface.
- `DiscoverStatus.saves_count` — also added this session: `getDiscoverStatus` now returns `saves_count` (a COUNT of `muse_saves WHERE vendor_id = <this vendor>`), wired to the vendor's TDW Returns dashboard.

---

## Migration 0063 — Vendor Activity Log (Phase 1.5, cross-surface)

### vendor_activity_log

Append-only, fail-safe record of every mutating action taken on either vendor
surface (WhatsApp PA or PWA Business Manager). The purpose is cross-surface
awareness: an action taken on the app is visible to the WhatsApp agent on the
next turn, and vice versa, so the vendor experiences "one mind, two surfaces."

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | default gen_random_uuid() |
| vendor_id | uuid FK → vendors.id | indexed |
| surface | text | `'whatsapp'` or `'pwa'` |
| action | text | the tool name that mutated (e.g. `create_invoice`) |
| summary | text | one-line human snapshot of what happened |
| entity_type | text nullable | `'invoice'` / `'lead'` / `'event'` / … / null |
| entity_id | uuid nullable | the affected row, when applicable (UUID-validated before insert) |
| created_at | timestamptz | default now() |

**Written by:** `logActivity()` in `src/lib/vendor/snapshot.js` — called after every
successful mutation in BOTH engines (`engine.js` WhatsApp + `pwaEngine.js`).
FAIL-SAFE: any insert error is logged and swallowed; logging never blocks the
real action.

**Read by:** `fetchRecentActivity()` in the same file — newest-first, default
15-minute window (matches the WhatsApp session boundary), surfaced into the
agent's dynamic context via `formatActivityBlock()`.

**Index:** (vendor_id, created_at desc) for the windowed read.

---

## Migration 0064 — Vendor Base Fee (Phase 2, enquiry enrichment)

### vendors table additions

Two columns added to the existing `vendors` table (NOT a new table). They hold
the vendor's starting/typical fee band, used to enrich couple enquiries with a
budget signal ("Her budget is 43% below your base fee").

| Column | Type | Notes |
|---|---|---|
| base_fee_min | numeric nullable | lower bound of the vendor's typical fee |
| base_fee_max | numeric nullable | upper bound of the vendor's typical fee |

**Read by:** `src/lib/vendor/enquiryEnrichment.js` (`buildEnquiryEnrichment()`)
and `src/api/couple/enquire.js` (selected alongside the vendor row on the
Discover fan-out). Used ONLY for the per-vendor budget framing — distinct from
`couples.budget_total` (the whole-wedding figure), per the Phase 2.5
budget-semantics rule.

---

## Phase 3 — Vendor Reply Path (send_to_couple) — NO new tables

Phase 3 lets a vendor instruct the agent to message a couple ("quote Ananya
4L") and have the assistant deliver a warm, category-framed message to the
couple's WhatsApp. It reuses existing schema — no migration required:

- **conversations** — the `kind = 'couple_thread'` row for (vendor_id,
  counterparty_phone) is the delivery target. Found-or-created by
  `replyToCouple()`.
- **messages** — the sent message is logged as a `direction='outbound',
  channel='whatsapp', sent_by='agent'` row on that thread.
- **leads** — `leads.phone` is the primary phone source; `send_to_couple`
  resolves the couple's number from the lead referenced by the PENDING ALERT.
- **pending_lead_pings** — `lead_id` is surfaced into the agent's PENDING
  ALERTS context block so the agent can pass the exact id to `send_to_couple`.
  (Phone recovery fallbacks: same-name sibling lead, then single couple_thread.)

**New code files (no schema):** `src/lib/vendor/replyToCouple.js` (delivery),
`src/lib/vendor/categoryFraming.js` (the category-awareness seam — quote caveat
per category; foundation for the Phase 3.5 profile system), plus the
`send_to_couple` tool in `tools.js` + handler in `engine.js`.

**Future schema note (Phase 3.5 / cleanup):** consider adding `couple_phone`
(or a thread reference) to `pending_lead_pings` so the vendor-agent never has
to re-derive the couple's phone from the lead. Tonight's fix (lead_id in
context + recovery fallbacks) works; this would make the whole phone-resolution
class of bug impossible.


<!-- PHASE_3_5_SCHEMA_ADDENDUM -->
---

# Phase 3.5 — Schema Change Addendum
**Appended:** 2026-05-30
**Session:** Phase 3 WhatsApp 24h window gate + Phase 3.5 category-profile system (Layer 0 onboarding wedding-shape, Layer 1 category-driven couple enquiry intake).
**Migrations this session:** 0065 (couples wedding-shape), 0066 (leads wedding-shape).

> This addendum documents the schema changes made in the Phase 3.5 session. It is
> additive — the table definitions above remain authoritative; the columns below
> were added to those tables and are restated here for governance/traceability.

## New migrations

| File | Status | Adds |
|---|---|---|
| `0065_couple_wedding_shape.sql` | ✅ Applied 2026-05-30 (confirmed via WhatsApp onboarding + SQL) | `couples.function_count`, `couples.wedding_days`, `couples.functions` |
| `0066_lead_wedding_shape.sql` | ⚠️ Committed — VERIFY it was run in Supabase | `leads.function_count`, `leads.wedding_days`, `leads.functions` |

**Verify 0066 was applied:**
```sql
select column_name
from information_schema.columns
where table_name = 'leads'
  and column_name in ('function_count', 'wedding_days', 'functions');
-- 3 rows = applied. 0 rows = run db/migrations/0066_lead_wedding_shape.sql
```

**Migration-file gap (carried, not introduced this session):** 0063 and 0064 were
applied as raw SQL in a prior session and the `.sql` files do NOT exist in
`db/migrations/`. Backfill flagged.

## Changes to EXISTING tables

### couples (existing table — columns ADDED by 0065)
| Column | Type | Notes |
|---|---|---|
| function_count | integer | 0065 (Phase 3.5 Layer 0): number of wedding functions (e.g. 3). Captured ONCE at onboarding. NULL until captured. |
| wedding_days | integer | 0065: number of days the wedding spans (e.g. 3). NULL until captured. |
| functions | text | 0065: free-text list of functions as the bride described them, e.g. "mehendi, sangeet, wedding, reception". Read by event-category enquiry agents; delivery categories (jeweller/designer) ignore it. |

**Also changed on couples (no migration — state-machine value, not a column):**
`onboarding_state` enum gained a new value **`asked_functions`**, inserted AFTER
`asked_date`. Full flow is now:
`new → asked_date → asked_functions → asked_partner → asked_city → asked_budget → complete`.

### leads (existing table — columns ADDED by 0066)
| Column | Type | Notes |
|---|---|---|
| function_count | integer | 0066 (Phase 3.5): number of wedding functions, captured at enquiry for UNREGISTERED (wa.me) brides with no couples record. A registered bride has this on couples (0065); this mirrors scope onto the lead. NULL until captured. |
| wedding_days | integer | 0066: number of days the wedding spans. NULL until captured. |
| functions | text | 0066: free-text function list captured at enquiry. Option A storage — stored on the LEAD, NOT auto-creating a ghost couples record for unregistered brides. |

## New tables
**None.** Phase 3.5 added NO new tables — only columns to `couples` (0065) and
`leads` (0066), plus a new `onboarding_state` enum value. The category-profile
system lives entirely in code (`src/lib/vendor/categoryProfiles.js`,
`src/agent/coupleSystemPrompt.js`), not in the schema.

## Why these columns exist
- An Indian wedding is a SPAN of functions, not one date. Capturing the shape
  (functions + days) lets every category enquiry reference the bride's real
  functions instead of re-asking "which functions" each time.
- Registered brides store shape on `couples` (0065, captured at onboarding).
- Unregistered wa.me brides have no couples record, so their shape is stored on
  the `leads` row (0066) — Option A: no ghost couples record is created.

## Related flagged item (delivery categories)
For jeweller/designer (delivery categories), a "need it ready by November"
answer currently lands in `wedding_date` and is treated as the wedding date by
vendor summaries + calendar enrichment. It is really a DELIVERY deadline. Proper
fix = a separate `ready_by` column for delivery categories (future migration).
PARKED — noted here so the schema reader is aware `wedding_date` is overloaded
for delivery-category leads.
