#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Phase 1.5 apply script — PA ↔ Business Manager talk
#
# PREREQUISITE: Phase 1 must already be applied & committed. The engine.js and
# systemPrompt.js in this package contain Phase 1 + Phase 1.5 changes together
# (they were edited in the same working tree). The script checks for a Phase 1
# marker before proceeding so you don't accidentally regress Phase 1.
#
# PREREQUISITE: migration 0063_vendor_activity_log.sql must already be run in
# Supabase. (You ran it on 2026-05-29 — "Success. No rows returned.") The SQL
# is included under migrations/ for your repo's version control; it is NOT
# executed by this script.
#
# WHAT THIS DOES:
#   1. Confirms repo root + Phase 1 marker present.
#   2. Backs up the 5 target files (timestamped).
#   3. Copies the new versions into place (4 modified + 1 new lib file).
#   4. node --check each. Auto-restores on any failure.
#   5. Reminds you to commit the migration file into db/migrations/.
#
# USAGE (from dream-os repo root):
#   unzip phase1_5_pkg.zip
#   bash phase1_5_pkg/apply.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODIFIED=(
  "src/agent/engine.js"
  "src/agent/pwaEngine.js"
  "src/agent/systemPrompt.js"
  "src/agent/pwaSystemPrompt.js"
)
NEW=(
  "src/lib/vendor/snapshot.js"
)

echo "──────────────────────────────────────────────"
echo " DreamAi — Phase 1.5 apply (PA ↔ Business Manager)"
echo "──────────────────────────────────────────────"

# 1. Repo root
if [[ ! -d "src/agent" ]] || [[ ! -f "package.json" ]]; then
  echo "✗ Not in dream-os repo root (need package.json + src/agent/)."
  exit 1
fi
echo "✓ In dream-os repo root."

# 1b. Phase 1 marker — classifyVendorMessage only exists after Phase 1.
if ! grep -q "classifyVendorMessage" src/agent/classifier.js 2>/dev/null; then
  echo "✗ Phase 1 doesn't appear to be applied (classifyVendorMessage missing"
  echo "  from src/agent/classifier.js). Apply & commit Phase 1 first, then"
  echo "  run this. Aborting to avoid regressing Phase 1."
  exit 1
fi
echo "✓ Phase 1 marker present."

# 1c. Migration reminder
if ! grep -rq "vendor_activity_log" db/migrations/ 2>/dev/null; then
  echo "⚠  Migration 0063 not found in db/migrations/. You already ran the SQL"
  echo "   in Supabase, but consider committing migrations/0063_vendor_activity_log.sql"
  echo "   (included in this package) into db/migrations/ for version control."
fi

# 2. Backup
TS="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR=".phase1_5_backup/$TS"
mkdir -p "$BACKUP_DIR/src/agent" "$BACKUP_DIR/src/lib/vendor"
for f in "${MODIFIED[@]}"; do
  [[ -f "$f" ]] && cp "$f" "$BACKUP_DIR/$f"
done
echo "✓ Backed up originals to $BACKUP_DIR/"

# 3. Copy
for f in "${MODIFIED[@]}" "${NEW[@]}"; do
  mkdir -p "$(dirname "$f")"
  cp "$SCRIPT_DIR/files/$f" "$f"
  echo "  → applied $f"
done

# 4. Syntax check
echo "──────────────────────────────────────────────"
echo " Syntax checks"
FAIL=0
for f in "${MODIFIED[@]}" "${NEW[@]}"; do
  if node --check "$f" 2>/dev/null; then
    echo "  ✓ $f"
  else
    echo "  ✗ $f  — SYNTAX ERROR"; FAIL=1
  fi
done

echo "──────────────────────────────────────────────"
if [[ "$FAIL" == "0" ]]; then
  echo "✓ Phase 1.5 applied cleanly. All files pass node --check."
  echo ""
  echo "  Also copy the migration into your repo for the record:"
  echo "    cp phase1_5_pkg/migrations/0063_vendor_activity_log.sql db/migrations/"
  echo ""
  echo "  Review:   git diff"
  echo "  Rollback: cp -r $BACKUP_DIR/src/* src/"
  echo ""
  echo "  Phase 1.5 changes:"
  echo "   • src/lib/vendor/snapshot.js  — NEW shared snapshot + activity log"
  echo "   • engine.js / pwaEngine.js     — both use shared snapshot; log + read activity"
  echo "   • systemPrompt.js / pwaSystemPrompt.js — cross-surface awareness + handoff"
else
  echo "✗ Syntax check failed. Restoring backup."
  for f in "${MODIFIED[@]}"; do
    [[ -f "$BACKUP_DIR/$f" ]] && cp "$BACKUP_DIR/$f" "$f"
  done
  # New file: remove it on failure (no original to restore)
  for f in "${NEW[@]}"; do rm -f "$f"; done
  echo "  Restored. No changes applied. Please report this."
  exit 1
fi
