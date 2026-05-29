#!/usr/bin/env bash
# Phase 2.7 apply — PDF retrieval + Send on WhatsApp
# Run TWICE — once in dream-os root, once in dreamos-pwa root.
# Auto-detects which repo it's in.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TS="$(date +%Y%m%d_%H%M%S)"

echo "──────────────────────────────────────────────"
echo " DreamAi — Phase 2.7 apply (PDF + WhatsApp button)"
echo "──────────────────────────────────────────────"

IS_BACKEND=0; IS_PWA=0
[[ -d "src/agent" && -f "src/index.js" ]] && IS_BACKEND=1
[[ -f "next.config.js" || -f "next.config.ts" || -f "next.config.mjs" ]] && IS_PWA=1

if [[ "$IS_BACKEND" == "0" && "$IS_PWA" == "0" ]]; then
  echo "✗ Not in a recognised repo root. Run from dream-os or dreamos-pwa root."; exit 1
fi

# ── BACKEND ────────────────────────────────────────────────────────────────
if [[ "$IS_BACKEND" == "1" ]]; then
  echo "✓ Detected dream-os (backend)."
  FILES=("src/agent/tools.js" "src/agent/engine.js" "src/api/vendor/invoices.js" "src/lib/vendor/enquiryEnrichment.js")
  BACKUP_DIR=".phase2_7_backup/$TS"
  mkdir -p "$BACKUP_DIR/src/agent" "$BACKUP_DIR/src/api/vendor" "$BACKUP_DIR/src/lib/vendor"
  for f in "${FILES[@]}"; do [[ -f "$f" ]] && cp "$f" "$BACKUP_DIR/$f"; done
  echo "✓ Backed up to $BACKUP_DIR/"
  for f in "${FILES[@]}"; do
    mkdir -p "$(dirname "$f")"
    cp "$SCRIPT_DIR/files/$f" "$f"
    echo "  → $f"
  done
  echo "── Syntax checks ──"
  FAIL=0
  for f in "${FILES[@]}"; do
    node --check "$f" 2>/dev/null && echo "  ✓ $f" || { echo "  ✗ $f SYNTAX ERROR"; FAIL=1; }
  done
  if [[ "$FAIL" != "0" ]]; then
    echo "✗ Restoring."; for f in "${FILES[@]}"; do [[ -f "$BACKUP_DIR/$f" ]] && cp "$BACKUP_DIR/$f" "$f"; done; exit 1
  fi
  echo "✓ Backend applied."
  echo ""
  echo "  Now make it live:"
  echo "    git add src/ && git commit -m 'Phase 2.7: PDF retrieval tool + enquiry budget fix' && git push origin main"
fi

# ── FRONTEND ────────────────────────────────────────────────────────────────
if [[ "$IS_PWA" == "1" ]]; then
  echo "✓ Detected dreamos-pwa (frontend)."
  PWA_FILES=("app/vendor/list/[slice]/page.tsx" "lib/vendor/types/vendor.ts")
  BACKUP_DIR=".phase2_7_backup/$TS"
  mkdir -p "$BACKUP_DIR/app/vendor/list/[slice]" "$BACKUP_DIR/lib/vendor/types"
  for f in "${PWA_FILES[@]}"; do [[ -f "$f" ]] && cp "$f" "$BACKUP_DIR/$f"; done
  echo "✓ Backed up to $BACKUP_DIR/"
  for f in "${PWA_FILES[@]}"; do
    mkdir -p "$(dirname "$f")"
    cp "$SCRIPT_DIR/files-pwa/$f" "$f"
    echo "  → $f"
  done
  echo "✓ Frontend applied. (No JS syntax check — needs build toolchain.)"
  echo ""
  echo "  Now make it live:"
  echo "    git add app/ lib/ && git commit -m 'Phase 2.7: Send on WhatsApp button on invoice screen' && git push origin main"
fi

echo "──────────────────────────────────────────────"
echo "✓ Phase 2.7 apply complete for this repo."
