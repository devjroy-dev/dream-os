#!/usr/bin/env python3
"""Write session close docs: HANDOVER_FINAL, VENDOR_PORT_ROADMAP, SCHEMA additions."""
import os

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"WROTE {path}")

def append(path, content):
    with open(path, 'a') as f:
        f.write(content)
    print(f"APPENDED {path}")

# ─────────────────────────────────────────────────────────────────────────────
# 1. HANDOVER_FINAL.md — prepend new session block
# ─────────────────────────────────────────────────────────────────────────────
with open('docs/HANDOVER_FINAL.md', 'r') as f:
    existing = f.read()

new_block = """# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-21 (Block 6 + Block 7 session close)
**Session:** Block 6 — Studio Suite (Team Hub) + Block 7 — Payment Schedules, Contracts, TDS
**Version:** 0.10.8-alpha (dream-os) / dreamai up to date
**HEAD (dream-os):** 3f2a242 feat(block7): payment schedules, contracts, TDS — 16 endpoints + 6 agent tools
**HEAD (dreamai):** latest (see git log — multiple commits this session)
**HEAD (dreamos-pwa):** 31a3b11 (unchanged)
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Repo backend:** https://github.com/devjroy-dev/dream-os
**Repo vendor PWA alpha:** https://github.com/devjroy-dev/dreamai
**Vercel (dreamai):** https://thedreamai.in
**Railway (dream-os):** https://dream-os-production.up.railway.app

Read this first. Then ROADMAP_FINAL.md. Then SCHEMA.md. Then API_CONTRACTS.md.

---

## Block 6 — Studio Suite (Team Hub) — 2026-05-21

### What shipped

**Migration 0040 — applied to prod (via Supabase SQL editor — not yet committed to db/migrations/):**
- `team_members` — vendor crew roster
- `team_tasks` — task assignment with state machine (open/in_progress/done/cancelled)
- `team_messages` — broadcast messages with pinned flag
- `team_payments` — crew payment obligations with mark-paid + auto-expense creation

**dream-os:**
- `src/api/middleware/requirePrestige.js` — 403 TIER_PRESTIGE_REQUIRED gate
- `src/api/vendor/studio/index.js` — studio sub-router
- `src/api/vendor/studio/briefing.js` — GET /briefing (aggregated: today events, open tasks, pinned messages, week calendar, team owed)
- `src/api/vendor/studio/team.js` — CRUD team members (soft delete)
- `src/api/vendor/studio/tasks.js` — CRUD tasks + state transitions
- `src/api/vendor/studio/messages.js` — CRUD messages + pin toggle
- `src/api/vendor/studio/payments.js` — CRUD payments + mark-paid (auto-creates assistant expense) + cancel endpoint
- `src/api/vendor/core.js` — mounted /studio
- `src/agent/pwaTools.js` — 4 Prestige tools: assign_task, team_pay, pin_team_message, team_briefing
- `src/agent/pwaEngine.js` — 4 Prestige tool case handlers

**dreamai:**
- `app/wedding/studio/page.tsx` — Team Hub landing (Prestige-gated, locked badges for non-Prestige)
- `app/wedding/studio/team/page.tsx` — roster + role dropdown + add/edit/delete sheets
- `app/wedding/studio/tasks/page.tsx` — tab board (Open/In Progress/Done) + state advance + delete
- `app/wedding/studio/team-payments/page.tsx` — balance cards, owed rows with Mark Paid + Delete, settled rows with date+method
- `app/wedding/list/page.tsx` — restructured to Business / Finance / Team Hub / Discover sections
- `app/wedding/login/page.tsx` — fixed: now fetches /me after OTP verify to get real tier + name into session (was hardcoded 'essential')

### Key decisions
- Studio Suite renamed → **Team Hub** in all UI (route stays /wedding/studio)
- Mark-paid auto-creates `assistant` category expense — team payments appear in expense ledger
- Login tier fix: `tier: 'essential'` was hardcoded at OTP verify — now calls fetchMe() post-login
- Studio hub restructured: Business (Clients/Leads/Events/Contracts) / Finance (Invoices/Expenses/TDS) / Team Hub / Discover

### Smoke tests passed (20/20 curl + tier gate)
- Team CRUD, task state machine, pin toggle, payment obligations, balance, mark-paid, cancel
- 403 TIER_PRESTIGE_REQUIRED confirmed on non-Prestige vendor
- briefing endpoint aggregates correctly

---

## Block 7 — Payment Schedules, Contracts, TDS — 2026-05-21

### What shipped

**Migration 0041 — applied to prod (via Supabase SQL editor — not yet committed to db/migrations/):**
- `payment_schedules` — milestone-based payment plans on invoices (ordinal, pct, amount_due, state)
- `contracts` — PDF contract storage (two-phase upload via Supabase Storage signed URLs)
- `tds_ledger` — Tax Deducted at Source ledger (gross/rate/tds/net, FY, PAN, TAN, section)
- `invoices.has_schedule` column added

**Storage:**
- `contracts` bucket created in Supabase Storage (private, 10MB, application/pdf)
- RLS policies: authenticated upload (INSERT) + authenticated read (SELECT)

**dream-os:**
- `src/lib/vendor/schedules.js` — createSchedule, markMilestonePaid (syncs invoice amount_paid), deleteSchedule
- `src/lib/vendor/contracts.js` — getUploadUrl, finalizeContract, getDownloadUrl, attachFromUrl (WhatsApp), cleanupDraftContracts
- `src/lib/vendor/tds.js` — createEntry, getSummary, currentFinancialYear()
- `src/api/vendor/schedules.js` — 5 endpoints (POST/GET/DELETE schedule, PATCH milestone, POST milestone/paid)
- `src/api/vendor/contracts.js` — 7 endpoints (upload-url, finalize, list, download, patch, send, delete)
- `src/api/vendor/tds.js` — 6 endpoints (list, create, patch, delete, summary, export CSV)
- `src/api/vendor/core.js` — mounted schedules, contracts, tds
- `src/agent/pwaTools.js` — 6 new tools: create_schedule, mark_milestone_paid, attach_contract, list_contracts, log_tds, query_tds_summary
- `src/agent/pwaEngine.js` — 6 tool case handlers
- `src/cron.js` — draft contract cleanup cron (3am IST daily)

**dreamai:**
- `app/wedding/contracts/page.tsx` — list + two-phase PDF upload + detail sheet (Download/Mark Sent/Mark Signed/Cancel)
- `app/wedding/tds/page.tsx` — FY selector, summary card (gross/TDS/net + by-section), entries list, log sheet, CSV export
- `app/wedding/list/[slice]/page.tsx` — schedule section on invoice bottom sheet (milestones with Paid button + builder sheet)
- `lib/types/vendor.ts` — ScheduleMilestone, Contract, TdsEntry, TdsSummary
- `lib/api/vendor.ts` — all Block 7 API functions

### Key decisions
- Milestone → invoice sync done in JS (sequential awaits), not Postgres function — consistent with codebase pattern
- Contracts are PDF documents (booking agreements), NOT terms & conditions templates
- TDS is what corporate clients deduct from vendor invoices — vendor tracks it for year-end income tax credit
- Two-phase upload: backend returns signed URL → frontend uploads directly to Supabase Storage → finalize call
- WhatsApp contract attach uses separate code path (downloads from Twilio URL, uploads directly)
- Schedule builder sheet: zIndex 60 (above invoice bottom sheet at 50)

### Smoke tests passed (20/20 curl)
- Schedule: create, duplicate guard (409), bad pct sum (400), milestone paid × 3, invoice state machine, delete guard (409)
- TDS: create, list, summary (correct aggregation + by_section), CSV export, patch (recomputes tds_amount), delete
- Contracts: upload URL (signed URL returned), list, patch, soft delete

### Open items / known debt
- **0040 + 0041 migrations not committed to db/migrations/** — applied via SQL editor. Need to drop files and commit.
- **Admin CORS bug** — `dream-os-production.up.railway.app/admin` returns Internal Server Error because CORS middleware fires on admin routes. Fix: exempt `/admin/*` from CORS. One-line patch, deferred (scope creep).
- **Admin panel not updated for Block 6/7** — no visibility into team members, contracts, schedules, TDS per vendor in admin UI. Deferred.
- **Founding cohort tier** — all founding vendors manually set to `prestige` via SQL. Block 4 (Razorpay) will enforce this properly when KYC clears.

---

## Test credentials (unchanged)

| Item | Value |
|---|---|
| Test vendor phone | +918757788550 |
| Test vendor UUID | 2eb5d3fb-31eb-4b26-859a-cf10ae477d53 |
| Test vendor handle | DEV550 |
| Test vendor tier | prestige (manually set) |
| Supabase | nvzkbagqxbysoeszxent (Mumbai, ap-south-1) |
| Railway | https://dream-os-production.up.railway.app |
| Admin | https://dream-os-production.up.railway.app/admin |
| Vercel dreamai | https://thedreamai.in |
| Admin password | Mira@2551354 |

---

## Migration status

| # | File | Status | What it adds |
|---|---|---|---|
| 0001–0039 | applied + committed | ✅ | See SCHEMA.md |
| 0040 | applied to prod | ⚠️ not committed | team_members, team_tasks, team_messages, team_payments |
| 0041 | applied to prod | ⚠️ not committed | payment_schedules, contracts, tds_ledger, invoices.has_schedule |

**Action required:** Commit 0040 and 0041 as files to `db/migrations/` in next session.

---

## What is next (priority order)

1. **Commit 0040 + 0041 migration files** — drop into db/migrations/, commit, push
2. **Admin CORS fix** — exempt /admin/* from CORS middleware (one-line patch)
3. **Block 4 — Razorpay** — when KYC clears. Subscription enforcement, trial cron, token packs
4. **Phase 3 — Discover go-live** — public bride-facing feed, v1.0.0

---

"""

with open('docs/HANDOVER_FINAL.md', 'w') as f:
    f.write(new_block + "---\n\n## Previous sessions (archived below)\n\n" + existing)
print("WROTE docs/HANDOVER_FINAL.md")

# ─────────────────────────────────────────────────────────────────────────────
# 2. VENDOR_PORT_ROADMAP.md — mark blocks 6 and 7 complete
# ─────────────────────────────────────────────────────────────────────────────
with open('docs/VENDOR_PORT_ROADMAP.md', 'r') as f:
    roadmap = f.read()

roadmap = roadmap.replace(
    '| **6**  | both     | `0040_studio_partial.sql`     | 0.10.6-α → 0.10.7-α | `BLOCK_6_SPEC.md` |',
    '| **6** ✅ | both   | `0040_studio_partial.sql`     | 0.10.6-α → 0.10.7-α | `BLOCK_6_SPEC.md` |'
)
roadmap = roadmap.replace(
    '| **7**  | both     | `0041_schedules_contracts_tds.sql` | 0.10.7-α → 0.10.8-α | `BLOCK_7_SPEC.md` |',
    '| **7** ✅ | both   | `0041_schedules_contracts_tds.sql` | 0.10.7-α → 0.10.8-α | `BLOCK_7_SPEC.md` |'
)

# Update written date
roadmap = roadmap.replace(
    '**Written:** 2026-05-20',
    '**Written:** 2026-05-20\n**Last updated:** 2026-05-21 (Blocks 6 + 7 complete)'
)

with open('docs/VENDOR_PORT_ROADMAP.md', 'w') as f:
    f.write(roadmap)
print("WROTE docs/VENDOR_PORT_ROADMAP.md")

# ─────────────────────────────────────────────────────────────────────────────
# 3. SCHEMA.md — append Block 6 + 7 tables
# ─────────────────────────────────────────────────────────────────────────────
SCHEMA_ADDITIONS = """
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
"""

append('docs/SCHEMA.md', SCHEMA_ADDITIONS)

print("\nAll three documents written.")
