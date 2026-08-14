#!/usr/bin/env bash
# scripts/run-floor.sh
#
# THE COMPLETE FLOOR — one home, so the enumeration stops being retyped.
#
# ═══════════════════════════════════════════════════════════════════════════
# WHY THIS FILE EXISTS, AND WHY IT ARRIVED A YEAR AFTER THE PWA'S
# ═══════════════════════════════════════════════════════════════════════════
# `dreamos-pwa` has had a floor runner since Row 13. This repo did not, and for
# that whole time every floor claim here was a HAND-ROLLED LOOP typed fresh into
# a terminal by whoever needed it. On 2026-08-14 that cost a sitting, and the
# four lessons below are the receipts. Each is a rule in the code beneath, and
# each was learnt the expensive way rather than designed in.
#
# ── LESSON 1 · THE FIRST FLOOR AFTER A FRESH INSTALL IS NOT A FLOOR (R-33.8)
# On a pristine clone, immediately after `npm ci`:
#     run 1 → 35 RED · run 2 → 21 RED · run 3 → 21 RED
# Fourteen benches reddened once and were green on every run after, and all
# fourteen were GREEN STANDALONE the whole time. Cold module resolution, not
# defect. The 35 was read as a delivery delta and chased as one.
# THE CURE: a WARM-UP pass whose result is DISCARDED, then the measured pass.
# The pwa reproduces the same class (`tdw_auth_crossover` appearing and
# vanishing on an untouched clone), so this is not one repo's quirk.
#
# ── LESSON 2 · A COUNT MATCH IS NOT A SET MATCH
# "21 reds" is not a floor claim; twenty-one reds BY NAME is. Two different
# twenty-ones are a delivery that broke one bench and fixed another, and a
# counter reports that as no change at all. `--check` diffs the NAMES.
#
# ── LESSON 3 · A PER-BENCH TIMEOUT DOES NOT JUST MANUFACTURE A RED — IT CAN
#    CORRUPT PRODUCTION SOURCE. THIS ONE COST A CLONE.
# A 60-second cap was put on each bench to keep the loop bounded. `b06_m1_bench`
# takes 62 SECONDS and is green; it came back RED, and three standalone runs
# exonerated it. That much was only a wrong number.
#
# THE REAL DAMAGE WAS INVISIBLE. `b06_m1_bench` MUTATES production source and
# restores it in a `finally` (:378-390). `timeout` sends SIGTERM, node dies, THE
# `finally` NEVER RUNS — and `src/engine/src/core/today.ts` was left carrying the
# mutation, a hand-sliced UTC date replacing an `Intl` call. It was found by a
# `git status` before cutting the ZIP, not by any bench: every bench that reads
# that file was already in the red set, so the corruption hid inside reds that
# were expected. The floor still measured 21 by name — CORRECT BY LUCK, over
# corrupted source, which is the worst shape a green can take.
# Proven by contrast on a fresh clone: no cap, no corruption.
#
# SO THERE IS NO PER-BENCH CAP BY DEFAULT. `BENCH_TIMEOUT` is UNSET unless a
# caller sets it, and setting it prints a warning naming this. A hung bench is a
# visible problem; a bench killed mid-write is a silent one, and this estate
# trades the visible for the silent every time.
#
# AND THE POST-RUN CHECK IS NOW A GUARD, NOT A NOTE. With `scripts/out/` ignored,
# ANY dirt after a floor run means a bench left production source changed. That
# is an alarm with an exit code, not a footnote.
#
# ── LESSON 4 · A FLOOR RUNS ONLY ON A CLEAN TREE (R-33.8)
# Some benches write to production source and restore it; on a dirty tree they
# cannot prove the restore was clean. Worse, this repo's `scripts/out/` was
# TRACKED and bench-written, so running the floor DIRTIED THE REPO, and a
# `git add -A` over that state produced an unintended commit that staged ten
# tracked artifacts as deletions (F-14.14). `scripts/out/` is now ignored and
# untracked; this runner refuses a dirty tree up front rather than measuring one.
#
# ═══════════════════════════════════════════════════════════════════════════
# THE SIBLING-ABSENT REFUSALS ARE BENCHES WORKING, NOT DELTAS
# ═══════════════════════════════════════════════════════════════════════════
# Several benches in this estate assert across BOTH repos and REFUSE rather than
# skip when the sibling is missing — the pwa's `tdw09_p2b_vocab` and
# `tdw13_d6_parity_matrix` are the named specimens, and this repo's own
# cross-repo cells follow the same doctrine. A bench that quietly skipped its
# own axis would report green on a claim it never checked, which is the worse
# failure by far.
#
# SO: RUN THE FLOOR SIBLING-FULL. If a refusal appears in the red set and the
# sibling is not beside this repo, that is YOUR CLONE LAYOUT, not the tree — it
# was misread as a two-red delta once already. This runner warns when the
# sibling is absent so the misreading cannot repeat silently.
#
# EXIT CODE IS THE VERDICT, never the printed text: benches here use several
# report formats and only the exit code is shared by all of them.
#
# Usage:  bash scripts/run-floor.sh            # print the red set
#         bash scripts/run-floor.sh --check    # diff against the named base

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

BENCH_TIMEOUT="${BENCH_TIMEOUT:-}"   # UNSET by default — see LESSON 3
BASE_FILE="scripts/floor-base.txt"

# ── THE CLEAN-TREE REFUSAL (LESSON 4) ────────────────────────────────────────
# Refused, not warned. A floor measured on a dirty tree is a number nobody can
# reproduce, and the benches that write-and-restore cannot vouch for themselves.
DIRT=$(git status --porcelain 2>/dev/null)
if [ -n "$DIRT" ]; then
  echo "STOP — the tree is dirty. A floor is measured on a clean tree or not at all."
  echo "Commit or stash first. Nothing was run."
  echo "$DIRT" | sed 's/^/  /'
  exit 1
fi

# ── THE SIBLING WARNING ──────────────────────────────────────────────────────
if [ ! -d "../dreamos-pwa" ]; then
  echo "NOTE — dreamos-pwa is not a sibling of this repo. Cross-repo benches will"
  echo "REFUSE, and that is them working. Any refusal below is your clone layout,"
  echo "not the tree. Clone the sibling and re-run before reading this as a delta."
  echo ""
fi

ALL=$(ls scripts/*.js 2>/dev/null | sort -u)

run_pass() {
  local out="$1" quiet="$2"
  : > "$out"
  for b in $ALL; do
    [ -f "$b" ] || continue
    local n; n=$(basename "$b" .js)
    if [ -n "$BENCH_TIMEOUT" ]; then
      timeout "$BENCH_TIMEOUT" node "$b" >/dev/null 2>&1
    else
      node "$b" >/dev/null 2>&1
    fi
    local rc=$?
    if [ $rc -ne 0 ]; then
      # 124 is timeout(1)'s own exit code — a bench THIS FILE killed, which is a
      # finding about BENCH_TIMEOUT and must never pass as a bench's own verdict.
      # Captured into `rc` immediately: inside `if timeout ...; then`, `$?` in the
      # else-branch is the IF's status and not the command's — the same class as
      # `cmd | tail && echo ok`, which measured tail's exit and reported a build
      # failure that had not happened (D-4a error #1).
      if [ "$rc" -eq 124 ] && [ "$quiet" != "quiet" ]; then
        echo "TIMEOUT: ${n} killed after ${BENCH_TIMEOUT}s — NOT a red, and it may have" >&2
        echo "         left production source MUTATED (LESSON 3). Check git status." >&2
      fi
      echo "RED: ${n}" >> "$out"
    fi
  done
  sort -o "$out" "$out"
}

# ── THE WARM-UP, DISCARDED (LESSON 1) ────────────────────────────────────────
echo "warming (this pass is discarded — see LESSON 1 in this file's header)…" >&2
run_pass /tmp/floor_warm.txt quiet

# ── THE MEASURED PASS ────────────────────────────────────────────────────────
run_pass /tmp/floor.txt loud
cat /tmp/floor.txt

# ── THE POST-RUN GUARD (LESSON 3) ────────────────────────────────────────────
# With scripts/out/ ignored, dirt here means a bench left PRODUCTION SOURCE
# changed — a restore that did not run. It exits non-zero: a floor measured over
# corrupted source is worse than no floor, and the one time it happened the
# number came back correct anyway.
POST=$(git status --porcelain 2>/dev/null)
if [ -n "$POST" ]; then
  echo ""
  echo "STOP — the tree is dirty AFTER the run. A bench did not restore what it"
  echo "mutated, and this floor was measured over changed source. Do not trust it."
  echo "$POST" | sed 's/^/  /'
  exit 1
fi

if [ "${1:-}" = "--check" ]; then
  # ── THE NAMED BASE lives in its own committed file (LESSON 2) ──────────────
  # Not a printf inside this script: a base that is a literal in the runner is a
  # base that gets edited by the hand that needs it to change. A separate file
  # makes every movement a diff in a delivery, with a reason beside it.
  if [ ! -f "$BASE_FILE" ]; then
    echo "STOP — ${BASE_FILE} is missing. There is no base to check against."
    exit 1
  fi
  echo ""
  if diff "$BASE_FILE" /tmp/floor.txt; then
    echo "FLOOR = NAMED BASE, no delta"
  else
    echo "FLOOR DELTA — the diff above is this delivery's to explain"
    exit 1
  fi
fi
