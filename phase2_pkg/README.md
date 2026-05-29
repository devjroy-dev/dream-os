# DreamAi — Phase 2 package (Couple-Agent Enrichment)

When a bride enquires, the vendor's notification now carries intelligence:
📅 calendar clash on the date · 🔥 hot/muhurat date · 💰 her budget vs your fee.

Enrichment is **opportunistic** — each line appears only when the data to
compute it exists. A bride who had the full TDW conversation gets all three.
An anonymous Discover tap gets none (clean one-liner). A *known* bride tapping
Discover gets enrichment hydrated from her couple profile — sometimes richer
than the conversation, because her profile may hold a budget she never typed.

## This package spans TWO repos

Run the apply script in **each** repo root. It auto-detects which one it's in.

### 1. Backend — dream-os

First run the migration in Supabase (SQL editor, like 0063):
`migrations/0064_vendor_base_fee.sql` — adds `vendors.base_fee_min/max`.

Then:
```bash
cd ~/dream-os
unzip -o phase2_pkg.zip
bash phase2_pkg/apply.sh
cp phase2_pkg/migrations/0064_vendor_base_fee.sql db/migrations/
git add src/ db/migrations/0064_vendor_base_fee.sql
git commit -m "Phase 2: couple-agent enquiry enrichment (calendar/hot-date/budget)"
```

Backend files:
- `src/lib/vendor/enquiryEnrichment.js` — **NEW** shared opportunistic enrichment helper
- `src/agent/engine.js` — couple-agent notification now enriched (Path A: TDW conversation)
- `src/api/couple/enquire.js` — Discover fan-out ping now enriched (Path B: in-app tap)

### 2. Frontend — dreamos-pwa

```bash
cd ~/dreamos-pwa
unzip -o phase2_pkg.zip
bash phase2_pkg/apply.sh
git add "app/(frost)/frost/canvas/sanctuary/page.tsx"
git commit -m "Phase 2.6: enquire toast — vendor notified + link saved in Vendors"
```

Frontend file:
- `app/(frost)/frost/canvas/sanctuary/page.tsx` — toast copy:
  `"Enquiry sent ✦"` → `"Vendor notified ✦ link saved in Vendors"`

(No JS syntax check on the .tsx — run your normal lint/build.)

## Prerequisites
- Phase 1 + Phase 1.5 applied on the backend (the script checks for snapshot.js).
- Migration 0064 run in Supabase before backend apply (for the 💰 budget line;
  if not run, the budget line is simply omitted — graceful, not broken).

## Setting a vendor's base fee
The 💰 line only appears for vendors who have `base_fee_min`/`max` set. There's
no UI/tool to set it yet (that's a small follow-up — a settings field or a
`set_my_base_fee` tool). Until then you can set it directly in Supabase, or
we add the setter in a later phase. The notification degrades gracefully
without it.

## Rollback
```bash
cp -r .phase2_backup/<timestamp>/* ./
# backend only, if needed:
rm src/lib/vendor/enquiryEnrichment.js
```
