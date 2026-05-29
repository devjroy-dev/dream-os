#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Phase 2 apply script — Couple-Agent Enrichment (+ 2.6 toast)
#
# THIS PACKAGE SPANS TWO REPOS. Run the script TWICE — once in each repo root.
# It auto-detects which repo it's in and applies the matching files:
#
#   In dream-os (backend):   applies engine.js, enquire.js, enquiryEnrichment.js
#   In dreamos-pwa (frontend): applies the sanctuary page.tsx (toast copy)
#
# PREREQUISITE (backend only): migration 0064_vendor_base_fee.sql must be run
# in Supabase first. SQL is in migrations/ — run it in the Supabase SQL editor
# (like you did 0063), then run this script in the dream-os repo.
#
# USAGE:
#   cd ~/dream-os      && unzip -o phase2_pkg.zip && bash phase2_pkg/apply.sh
#   cd ~/dreamos-pwa   && unzip -o phase2_pkg.zip && bash phase2_pkg/apply.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TS="$(date +%Y%m%d_%H%M%S)"

echo "──────────────────────────────────────────────"
echo " DreamAi — Phase 2 apply (Couple-Agent Enrichment)"
echo "──────────────────────────────────────────────"

# ── Detect repo ───────────────────────────────────────────────────────────
IS_BACKEND=0
IS_PWA=0
if [[ -d "src/agent" && -f "package.json" ]]; then IS_BACKEND=1; fi
if [[ -d "app/(frost)" ]]; then IS_PWA=1; fi

if [[ "$IS_BACKEND" == "0" && "$IS_PWA" == "0" ]]; then
  echo "✗ Not in a recognized repo root."
  echo "  Run from dream-os root (has src/agent/) or dreamos-pwa root (has app/(frost)/)."
  exit 1
fi

# ── BACKEND (dream-os) ─────────────────────────────────────────────────────
if [[ "$IS_BACKEND" == "1" ]]; then
  echo "✓ Detected dream-os (backend)."

  # Phase 1.5 marker — enquiryEnrichment sits on top of the shared lib work.
  if [[ ! -f "src/lib/vendor/snapshot.js" ]]; then
    echo "✗ Phase 1.5 not applied (src/lib/vendor/snapshot.js missing). Apply Phase 1.5 first."
    exit 1
  fi

  # Migration reminder
  if ! grep -rq "base_fee_min" db/migrations/ 2>/dev/null; then
    echo "⚠  Migration 0064 not found in db/migrations/. Make sure you ran the SQL"
    echo "   (migrations/0064_vendor_base_fee.sql) in Supabase, then copy it in:"
    echo "     cp phase2_pkg/migrations/0064_vendor_base_fee.sql db/migrations/"
  fi

  FILES=( "src/agent/engine.js" "src/api/couple/enquire.js" "src/lib/vendor/enquiryEnrichment.js" )
  BACKUP_DIR=".phase2_backup/$TS"
  mkdir -p "$BACKUP_DIR/src/agent" "$BACKUP_DIR/src/api/couple" "$BACKUP_DIR/src/lib/vendor"
  for f in "${FILES[@]}"; do [[ -f "$f" ]] && cp "$f" "$BACKUP_DIR/$f"; done
  echo "✓ Backed up to $BACKUP_DIR/"

  for f in "${FILES[@]}"; do
    mkdir -p "$(dirname "$f")"
    cp "$SCRIPT_DIR/files/$f" "$f"
    echo "  → applied $f"
  done

  echo "── Syntax checks ──"
  FAIL=0
  for f in "${FILES[@]}"; do
    if node --check "$f" 2>/dev/null; then echo "  ✓ $f"; else echo "  ✗ $f SYNTAX ERROR"; FAIL=1; fi
  done
  if [[ "$FAIL" != "0" ]]; then
    echo "✗ Restoring backup."
    for f in "${FILES[@]}"; do [[ -f "$BACKUP_DIR/$f" ]] && cp "$BACKUP_DIR/$f" "$f"; done
    rm -f src/lib/vendor/enquiryEnrichment.js
    exit 1
  fi
  echo "✓ Backend applied. Don't forget: cp phase2_pkg/migrations/0064_vendor_base_fee.sql db/migrations/"
fi

# ── FRONTEND (dreamos-pwa) ─────────────────────────────────────────────────
if [[ "$IS_PWA" == "1" ]]; then
  echo "✓ Detected dreamos-pwa (frontend)."
  PWA_FILE="app/(frost)/frost/canvas/sanctuary/page.tsx"
  BACKUP_DIR=".phase2_backup/$TS"
  mkdir -p "$BACKUP_DIR/$(dirname "$PWA_FILE")"
  [[ -f "$PWA_FILE" ]] && cp "$PWA_FILE" "$BACKUP_DIR/$PWA_FILE"
  echo "✓ Backed up to $BACKUP_DIR/"
  cp "$SCRIPT_DIR/files-pwa/$PWA_FILE" "$PWA_FILE"
  echo "  → applied $PWA_FILE (toast copy: Phase 2.6)"
  echo "✓ Frontend applied. Review with: git diff \"$PWA_FILE\""
  echo "  (No syntax check — .tsx needs your build toolchain. Run your usual lint/build.)"
fi

echo "──────────────────────────────────────────────"
echo "✓ Phase 2 apply complete for this repo."
echo "  Rollback: cp -r .phase2_backup/$TS/* ./   (and rm enquiryEnrichment.js if backend)"
