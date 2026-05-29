#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Phase 1 apply script — DreamAi engine trust & disambiguation
#
# WHAT THIS DOES:
#   1. Confirms you're in the dream-os repo root.
#   2. Warns if your HEAD differs from the commit Phase 1 was built against
#      (c4d7ff4). You can still proceed — the 6 files are dropped in whole,
#      not patched, so drift in OTHER files is fine. Drift in THESE 6 files
#      since c4d7ff4 would be overwritten — check the backup if unsure.
#   3. Backs up the 6 target files to .phase1_backup/ (timestamped).
#   4. Copies the new versions into place.
#   5. node --check syntax-validates each one.
#   6. Prints a summary. Nothing is committed — you review, then commit.
#
# USAGE:
#   unzip phase1_pkg.zip           # from repo root
#   bash phase1_pkg/apply.sh
#
# ROLLBACK:
#   cp .phase1_backup/<timestamp>/* src/agent/   (paths shown at the end)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_COMMIT="c4d7ff46162aec439956ed1f351f29646a17f983"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILES=(
  "src/agent/circleEngine.js"
  "src/agent/classifier.js"
  "src/agent/datePrecision.js"
  "src/agent/engine.js"
  "src/agent/systemPrompt.js"
  "src/agent/tools.js"
)

echo "──────────────────────────────────────────────"
echo " DreamAi — Phase 1 apply"
echo "──────────────────────────────────────────────"

# 1. Repo root sanity check
if [[ ! -d "src/agent" ]] || [[ ! -f "package.json" ]]; then
  echo "✗ This doesn't look like the dream-os repo root."
  echo "  Run from the directory that contains package.json and src/agent/."
  exit 1
fi
echo "✓ In dream-os repo root."

# 2. Base commit check (warn-only)
if command -v git >/dev/null 2>&1 && git rev-parse HEAD >/dev/null 2>&1; then
  HEAD_COMMIT="$(git rev-parse HEAD)"
  if [[ "$HEAD_COMMIT" != "$BASE_COMMIT" ]]; then
    echo "⚠  Your HEAD ($HEAD_COMMIT)"
    echo "   differs from the Phase 1 base ($BASE_COMMIT)."
    echo "   The 6 files are dropped in whole. If you changed any of THESE 6"
    echo "   files since the base, they'll be overwritten (backup is made)."
    read -r -p "   Proceed? [y/N] " ans
    [[ "$ans" == "y" || "$ans" == "Y" ]] || { echo "Aborted."; exit 1; }
  else
    echo "✓ HEAD matches Phase 1 base commit."
  fi
else
  echo "⚠  Not a git checkout (or git unavailable) — skipping commit check."
fi

# 3. Backup
TS="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR=".phase1_backup/$TS"
mkdir -p "$BACKUP_DIR/src/agent"
for f in "${FILES[@]}"; do
  if [[ -f "$f" ]]; then
    cp "$f" "$BACKUP_DIR/$f"
  fi
done
echo "✓ Backed up originals to $BACKUP_DIR/"

# 4. Copy new files
for f in "${FILES[@]}"; do
  cp "$SCRIPT_DIR/files/$f" "$f"
  echo "  → applied $f"
done

# 5. Syntax check
echo "──────────────────────────────────────────────"
echo " Syntax checks"
FAIL=0
for f in "${FILES[@]}"; do
  if node --check "$f" 2>/dev/null; then
    echo "  ✓ $f"
  else
    echo "  ✗ $f  — SYNTAX ERROR"
    FAIL=1
  fi
done

echo "──────────────────────────────────────────────"
if [[ "$FAIL" == "0" ]]; then
  echo "✓ Phase 1 applied cleanly. All 6 files pass node --check."
  echo ""
  echo "  Review with:   git diff"
  echo "  Rollback with: cp $BACKUP_DIR/src/agent/* src/agent/"
  echo ""
  echo "  Phase 1 changes:"
  echo "   1.1 honest fallback (engine.js, circleEngine.js)"
  echo "   1.2 clarify tool on WhatsApp (tools.js, engine.js, systemPrompt.js)"
  echo "   1.3 date-precision revalidation (datePrecision.js)"
  echo "   1.4 merged complexity+ambiguity classifier + gate (classifier.js, engine.js)"
else
  echo "✗ One or more files failed syntax check. Restoring from backup."
  for f in "${FILES[@]}"; do
    [[ -f "$BACKUP_DIR/$f" ]] && cp "$BACKUP_DIR/$f" "$f"
  done
  echo "  Restored. No changes applied. Please report this."
  exit 1
fi
