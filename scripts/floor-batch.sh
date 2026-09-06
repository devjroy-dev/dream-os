#!/usr/bin/env bash
# scripts/floor-batch.sh — A BATCHED PASS, NOT A SECOND FLOOR.
#
# ⚠ THIS IS NOT A REPLACEMENT FOR `run-floor.sh` AND MUST NEVER BECOME ONE.
# It exists because a seat's tool call cannot outlive ~8 minutes and the floor
# takes about an hour (F-40.128: backgrounding it reports neither its death nor
# its result, and `pgrep -f` self-matches the shell that asks). Under R-40.63 a
# seat runs a floor that FITS ITS CALL, or the founder runs the floor.
#
# THE CLASSIFICATION IS COPIED FROM `run-floor.sh`, NOT RE-INVENTED:
#   rc 0 green · 1 RED · 2 ERROR · 3 REFUSED · 124 TIMEOUT
# by EXIT CODE and never by grepping output, for that file's own stated reason —
# grepping for the word REFUSED classifies a bench by a string any comment could
# contain. The bench list is the same glob with the same one exclusion.
#
# THE FOUNDER'S SINGLE-INVOCATION RUN IS THE FLOOR OF RECORD. This produces a SET
# to compare at the cut; his `run-floor.sh --delivery <manifest> --check` is what
# the handover and the git line wait on.
#
# Usage:  bash scripts/floor-batch.sh <n-of-N> <total-N> <out-file>
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

IDX="${1:?batch index, 1-based}"
TOT="${2:?batch count}"
OUT="${3:?output file}"

ALL=$(ls scripts/*.js 2>/dev/null | grep -v '^scripts/_noop_middleware\.js$' | sort -u)

i=0
for b in $ALL; do
  i=$((i + 1))
  # Round-robin rather than contiguous slices: a contiguous slice would put all
  # the slow benches in one batch and that batch would be the one that times out.
  if [ $(( (i - 1) % TOT + 1 )) -ne "$IDX" ]; then continue; fi
  [ -f "$b" ] || continue
  n=$(basename "$b" .js)
  node "$b" >/dev/null 2>&1
  rc=$?
  case "$rc" in
    0)   ;;
    3)   echo "REFUSED: ${n}" >> "$OUT" ;;
    2)   echo "ERROR: ${n}"   >> "$OUT" ;;
    124) echo "TIMEOUT: ${n}" >> "$OUT" ;;
    *)   echo "RED: ${n}"     >> "$OUT" ;;
  esac
done
echo "batch ${IDX}/${TOT} complete" >&2
