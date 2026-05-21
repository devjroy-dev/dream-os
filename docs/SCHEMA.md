# dream-os — Schema Reference (Vendor + Bride)
**Last updated:** 2026-05-19 (P2-6a session)
**Session:** P2-6a complete. No new migrations. messages.media_url column now in active use for PDF delivery (was 'future' in prior schema docs).
**Supabase project:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Latest migration applied:** 0030_landing_assets.sql (2026-05-19)
**Next migration:** 0034 (when needed)
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
| notes | text | |
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

**Latest migration:** 0035_vendor_writes.sql
**Next migration number:** 0036

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

