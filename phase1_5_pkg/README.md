# DreamAi — Phase 1.5 package

PA ↔ Business Manager talk. The WhatsApp PA and the PWA Business Manager now
read the **same** vendor snapshot, and each knows what the other just did.

## Prerequisites

1. **Phase 1 applied & committed.** This package's engine.js / systemPrompt.js
   contain Phase 1 + 1.5 together. The apply script checks for a Phase 1 marker.
2. **Migration 0063 already run in Supabase** (done 2026-05-29). The SQL is in
   `migrations/0063_vendor_activity_log.sql` for your repo's version control.

## Apply

From the **dream-os repo root**:

```bash
unzip phase1_5_pkg.zip
bash phase1_5_pkg/apply.sh
cp phase1_5_pkg/migrations/0063_vendor_activity_log.sql db/migrations/   # for version control
```

Then review and commit:

```bash
git diff
git add src/ db/migrations/0063_vendor_activity_log.sql
git commit -m "Phase 1.5: shared vendor snapshot + cross-surface activity log"
```

## Rollback

```bash
cp -r .phase1_5_backup/<timestamp>/src/* src/
rm src/lib/vendor/snapshot.js
```

## What changed

| File | Change |
|---|---|
| `src/lib/vendor/snapshot.js` | **NEW.** Shared `buildVendorSnapshot()` (the 6-query context fetch both engines used to duplicate) + the cross-surface activity log: `logActivity()` (fail-safe writer), `fetchRecentActivity()` (15-min / 5-row read), `formatActivityBlock()` (renders the context block). |
| `src/agent/engine.js` | WhatsApp PA: uses shared snapshot; reads recent activity into context; logs its own mutations (name-based allowlist of write-tools). |
| `src/agent/pwaEngine.js` | PWA Business Manager: `fetchSnapshot` now delegates to the shared builder; reads recent activity into context; logs mutations (uses its existing `mutated` flag). |
| `src/agent/systemPrompt.js` | Cross-surface awareness + handoff note (PA points to app for heavy work). |
| `src/agent/pwaSystemPrompt.js` | Cross-surface awareness note (Business Manager owns heavy work, doesn't bounce vendor back to WhatsApp). |

## How it behaves

- Vendor raises an invoice on the app → a row lands in `vendor_activity_log`
  (surface=`pwa`). Within 15 minutes, if they ask the WhatsApp PA "did that go
  out?", the PA sees it in its RECENT ACTIVITY block and confirms — it knows.
- Same in reverse: a payment recorded over WhatsApp shows up in the app's
  context as "on WhatsApp, N min ago".
- The activity log is **append-only and fail-safe** — a logging failure can
  never block the actual invoice/payment/lead action.

## Tuning

Read window is 15 min / 5 rows, set at the top of `src/lib/vendor/snapshot.js`
(`ACTIVITY_WINDOW_MS`, `ACTIVITY_MAX_ROWS`). One-line change if you want more/less.
