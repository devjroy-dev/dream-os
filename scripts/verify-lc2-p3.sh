#!/usr/bin/env bash
# scripts/verify-lc2-p3.sh — TDW CE-43 · LC-2 packet 3 (dream-os) · the founder's ONE verify command.
#
#   bash scripts/verify-lc2-p3.sh
#
# WHY A FILE. This packet changes the engine's TypeScript (recordPrimitives.ts, openRecordWithId),
# and scripts/run-floor.sh reads src/engine/dist without rebuilding it, so the build must run
# before any bench. R-38.21 allows one command per founder paste block and no && chains, so the
# order lives here instead of in the paste.
#
# WHAT IT RUNS, IN ORDER, EACH JUDGED BY EXIT CODE (R-40.85):
#   1  npm run build                       the engine, from the applied source
#   2  node --check on every touched .js
#   3  b83 (this packet), b82, b79, tdw09_micro (the packet's nearest readers)
#   4  bash scripts/run-floor.sh --delivery scripts/floor-manifest-lc2-p3.txt --check
# It stops at the first failure and exits 1; it exits 0 only when all four are green.
#
# NO SHELL OPTIONS ARE SET (R-38.21 (2)); it is executed, never sourced.
cd "$(dirname "$0")/.." || exit 1

say() { echo "── $1"; }

say "1/4 npm run build"
npm run build
rc=$?
if [ "$rc" -ne 0 ]; then echo "VERIFY RED at step 1 (build, exit $rc)"; exit 1; fi

say "2/4 node --check"
for f in \
  src/lib/vendor/promotion.js src/lib/vendor/bookedLeads.js src/lib/vendor/schedules.js \
  src/lib/vendor/invoices.js src/lib/vendor/bookingEvent.js src/api/vendor/leadPackages.js \
  src/api/vendor/clients.js src/api/vendor/schedules.js src/api/vendor/money.js \
  src/api/vendor/invoices.js src/api/vendor-engine/cabinet.js src/api/vendor-engine/today.js \
  scripts/b83_lc2_p3_promotion_bench.js scripts/b82_lc2_p2_packages_bench.js; do
  node --check "$f"
  rc=$?
  if [ "$rc" -ne 0 ]; then echo "VERIFY RED at step 2 ($f)"; exit 1; fi
done
echo "node --check clean"

say "3/4 benches"
for b in b83_lc2_p3_promotion_bench b82_lc2_p2_packages_bench b79_lc1_seam_bench tdw09_micro_bench; do
  node "scripts/$b.js" > "/tmp/verify_$b.txt" 2>&1
  rc=$?
  tail -n 3 "/tmp/verify_$b.txt"
  if [ "$rc" -ne 0 ]; then
    echo "VERIFY RED at step 3 ($b, exit $rc). Its failing lines:"
    grep -E "FAIL|RED" "/tmp/verify_$b.txt"
    exit 1
  fi
done

say "4/4 the floor, declared dirt"
bash scripts/run-floor.sh --delivery scripts/floor-manifest-lc2-p3.txt --check
rc=$?
if [ "$rc" -ne 0 ]; then echo "VERIFY RED at step 4 (floor, exit $rc)"; exit 1; fi

echo "VERIFY GREEN"
exit 0
