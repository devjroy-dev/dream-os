#!/usr/bin/env python3
"""
append_schema_phase35.py

Appends a Phase 3.5 schema-change addendum to the END of the existing
docs/SCHEMA.md — non-destructively. Does NOT touch anything above; only adds.

Run from the repo root:
    python3 append_schema_phase35.py

Idempotent: if the addendum marker is already present, it does nothing
(so you can run it twice safely without double-appending).
"""

import os
import sys
from datetime import date

SCHEMA_PATH = os.path.join("docs", "SCHEMA.md")
MARKER = "<!-- PHASE_3_5_SCHEMA_ADDENDUM -->"

ADDENDUM = f"""

{MARKER}
---

# Phase 3.5 — Schema Change Addendum
**Appended:** {date.today().isoformat()}
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
"""


def main():
    if not os.path.isfile(SCHEMA_PATH):
        sys.exit(
            f"ERROR: {SCHEMA_PATH} not found. Run this from the repo root "
            f"(the folder that contains docs/SCHEMA.md)."
        )

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    if MARKER in content:
        print(
            f"Addendum already present in {SCHEMA_PATH} (marker found). "
            f"Nothing appended — safe to re-run."
        )
        return

    # Ensure exactly one trailing newline before we append.
    if not content.endswith("\n"):
        content += "\n"

    with open(SCHEMA_PATH, "a", encoding="utf-8") as f:
        f.write(ADDENDUM)

    print(f"✓ Appended Phase 3.5 addendum to {SCHEMA_PATH}.")
    print("  Review it, then:")
    print("    git add docs/SCHEMA.md")
    print('    git commit -m "docs(schema): append Phase 3.5 wedding-shape addendum (0065/0066)"')
    print("    git push origin main")


if __name__ == "__main__":
    main()
