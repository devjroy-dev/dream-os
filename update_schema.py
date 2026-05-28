#!/usr/bin/env python3
"""
update_schema.py
Run in /workspaces/dream-os

Appends undocumented migrations 0049–0056 to docs/SCHEMA.md
and updates the Holy Grail with 0055 and 0056.
"""

from pathlib import Path

BASE = Path('.')

# ── Verify migration state ────────────────────────────────────────────────────
print('── Verifying migration state ───────────────────────────────────────────')
migrations = list((BASE / 'db/migrations').glob('*.sql'))
names = [m.name for m in sorted(migrations)]
print(f'  Last 5 migrations: {names[-5:]}')

has_56 = any('0056' in n for n in names)
has_57 = any('0057' in n for n in names)
print(f'  0056 present: {has_56} ✓' if has_56 else '  0056 MISSING ✗')
print(f'  0057 absent:  {not has_57} ✓' if not has_57 else '  0057 STILL PRESENT ✗')

# ── Schema additions ──────────────────────────────────────────────────────────
SCHEMA_ADDITIONS = """

---

## Migration 0049 — Lead Intent Cache
**Applied:** 2026-05-25

### leads table additions

| Column | Type | Notes |
|---|---|---|
| intent_summary | text | One-line Haiku-extracted summary of bride's current ask. Reused across follow-ups until topic shifts or 30 days pass. Nullable. |
| intent_summary_at | timestamptz | When intent_summary was last refreshed. Used to age out stale summaries. Nullable. |

---

## Migration 0050 — Pending Lead Pings
**Applied:** 2026-05-25

### pending_lead_pings

Vendor-side pronoun resolution. A ping represents a recently-active lead the vendor agent treats as the default referent for ambiguous pronouns ("tell her", "reply to her"). Active for 10 minutes from creation.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| lead_id | uuid FK leads | ON DELETE CASCADE |
| lead_name | text | Nullable |
| bride_message | text | The message that triggered the ping. Nullable. |
| intent_summary | text | One-line summary. Nullable. |
| source | text NOT NULL | CHECK: bride_message / vendor_create_lead |
| created_at | timestamptz NOT NULL | default now() |
| acknowledged_at | timestamptz | Set when agent acts on the referenced lead. Nullable. |

Indexes: `idx_pending_pings_vendor_open` on (vendor_id, created_at DESC) WHERE acknowledged_at IS NULL.

---

## Migration 0051 — Pending Event Proposals
**Applied:** 2026-05-25

### pending_event_proposals

Staging table for events extracted from vendor calendar screenshots via Haiku Vision OCR. Vendor confirms via next WhatsApp message; agent commits to events table. Proposals expire after 30 minutes.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| vendor_id | uuid FK vendors | ON DELETE CASCADE |
| proposals | jsonb NOT NULL | Array of {title, event_date, event_time?, kind, notes?} |
| source_image_url | text | Twilio media URL. Nullable. |
| caption | text | Vendor caption alongside the image. Nullable. |
| created_at | timestamptz NOT NULL | default now() |
| resolved_at | timestamptz | Set when commit_event_proposals fires. Nullable. |
| resolution | text | CHECK: save_all / save_selected / cancel. Nullable. |

Indexes: `idx_pending_event_proposals_vendor_open` on (vendor_id, created_at DESC) WHERE resolved_at IS NULL.

---

## Migration 0052 — Lead Wedding Date Precision
**Applied:** 2026-05-25

### leads table additions

| Column | Type | Notes |
|---|---|---|
| wedding_date_precision | text | CHECK: day / month / year. NULL when wedding_date is also NULL. day = exact date. month = sentinel 1st-of-month, display "Jul 2026". year = sentinel Jan 1, display "2027 (TBD)". |

---

## Migration 0053 — WhatsApp Image Throttle Log
**Applied:** 2026-05-25

### image_throttle_log

Rate-limits inbound WhatsApp images to 2 per 30 seconds per phone (both vendor and bride engines). Prevents Vision-call spam from burst image forwards.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| phone | text NOT NULL | E.164 phone number |
| engine | text NOT NULL | CHECK: vendor / bride |
| created_at | timestamptz NOT NULL | default now() |

Indexes: `idx_image_throttle_phone_recent` on (phone, created_at DESC).

---

## Migration 0054 — Image Throttle Rejection Sent Flag
**Applied:** 2026-05-25

### image_throttle_log additions

| Column | Type | Notes |
|---|---|---|
| rejection_sent | boolean NOT NULL | default false. When true, subsequent over-limit images in the same 30s window are silently dropped (no reply sent). Ensures only ONE rejection reply per burst. |

Indexes: `idx_image_throttle_rejection` on (phone, created_at DESC) WHERE rejection_sent = true.

---

## Migration 0055 — Bride Pages (Diary)
**Applied:** 2026-05-25

### bride_pages

The diary surface. Every Pages entry is a row in this table. The bride writes one or more entries per day. DreamAi reads this table via the read_pages tool to ground the AI in the bride's emotional weather across days.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| couple_id | uuid FK couples | ON DELETE CASCADE |
| user_id | uuid FK users | ON DELETE CASCADE |
| entry_date | date NOT NULL | default current_date. The "wedding-arc day" she wrote on. Used for grouping and daily teal idle line. |
| mood | text NOT NULL | One of 12 locked values from the bride's interior weather palette (matches FROST_COPY mood vocabulary) |
| mood_color | text NOT NULL | Hex color for the mood |
| body | text NOT NULL | Plain text diary entry |
| created_at | timestamptz NOT NULL | default now() |
| updated_at | timestamptz NOT NULL | default now() |

Indexes: `idx_bride_pages_couple_created` on (couple_id, created_at DESC). `idx_bride_pages_couple_entry_date` on (couple_id, entry_date DESC).

---

## Migration 0056 — Remove Demo Columns from vendors
**Applied:** 2026-05-28

Cleanup migration. Removed vendor demo system columns that were added during an earlier failed demo implementation which used real JWTs and phone numbers causing session contamination.

### vendors table columns removed
- `demo_handle`
- `demo_active`
- `demo_expires_at`
- `demo_created_at`
- `demo_session_token`
- `demo_session_expires_at`
- `demo_notes`
- `demo_instagram`

Also dropped: `demo_profile_views` table (if existed).

Note: Bride demo (tdw_bride_demo_session in localStorage) was unaffected.
"""

# ── Update SCHEMA.md ──────────────────────────────────────────────────────────
print('\n── Updating docs/SCHEMA.md ─────────────────────────────────────────────')
schema_path = BASE / 'docs/SCHEMA.md'
schema_content = schema_path.read_text()

# Check what's already there
if '## Migration 0049' in schema_content:
    print('  SKIP — 0049 already documented')
else:
    schema_content += SCHEMA_ADDITIONS
    schema_path.write_text(schema_content)
    print('  OK   — appended migrations 0049–0056')

# ── Update DEVS_HOLY_GRAIL.md ─────────────────────────────────────────────────
print('\n── Updating docs/DEVS_HOLY_GRAIL.md ───────────────────────────────────')
grail_path = BASE / 'docs/DEVS_HOLY_GRAIL.md'
grail_content = grail_path.read_text()

old_latest = '**Latest migrations applied:** 0054_image_throttle_rejection_sent.sql (applied 2026-05-25 via SQL editor)'
new_latest = '**Latest migrations applied:** 0056_remove_demo_columns.sql (applied 2026-05-28 via SQL editor)'

if old_latest in grail_content:
    grail_content = grail_content.replace(old_latest, new_latest, 1)
    print('  OK   — updated latest migration reference')
else:
    print('  SKIP — already updated or line not found')

# Add 0055 and 0056 to the schema table section
old_table_entry = '**Throttle silent-after-first (0054, applied 2026-05-25):** `image_throttle_log.rejection_sent` — boolean column ensures only ONE rejection reply per 30s window even when 5 over-limit images arrive'
new_table_entry = old_table_entry + """
**Bride diary (0055, applied 2026-05-25):** `bride_pages` — one row per diary entry; couple_id + entry_date + mood + mood_color + body; DreamAi reads via read_pages tool; Sanctuary V Pages preview reads most-recent body
**Demo column cleanup (0056, applied 2026-05-28):** Removed demo_handle / demo_active / demo_session_token etc. from vendors table — leftover from failed demo v1 that caused session contamination"""

if old_table_entry in grail_content and '0055' not in grail_content:
    grail_content = grail_content.replace(old_table_entry, new_table_entry, 1)
    print('  OK   — added 0055 + 0056 to schema table')
elif '0055' in grail_content:
    print('  SKIP — 0055 already documented')
else:
    print('  MISS — could not find insertion point for 0055/0056')

grail_path.write_text(grail_content)

print('\n✅  Done. Commit with:')
print('  git add docs/SCHEMA.md docs/DEVS_HOLY_GRAIL.md')
print('  git commit -m "docs: update SCHEMA.md and Holy Grail — migrations 0049–0056"')
print('  git push')
