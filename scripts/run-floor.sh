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
# ── LESSON 5 · [F-14.16] A CLEAN-TREE REFUSAL MAKES THE FLOOR UNRUNNABLE ON
#    THE ONE TREE IT EXISTS TO GATE. Found on this runner's FIRST contact with
#    a real delivery, 2026-08-14.
# LESSON 4 refused a dirty tree outright. But a DELIVERY TREE IS DIRTY BY
# DEFINITION, and R-33.7 forbids the executor the commit that would clean it.
# The two rules together meant the floor could only run AFTER apply-and-commit —
# at which point it audits rather than gates, which is not what a floor is for.
# The runner had over-tightened: it could not tell CONTAMINATION from A DELIVERY.
#
# THE DIFFERENCE IS THAT A DELIVERY'S DIRT IS DECLARED. `--delivery <manifest>`
# proceeds on a dirty tree IF AND ONLY IF every dirty path is named in the
# manifest — the delivery's own file table, which its handover carries anyway.
# One byte of dirt outside the manifest and it refuses exactly as before. The
# manifest is PRINTED INTO THE OUTPUT so the measurement records what it
# tolerated: a floor that quietly forgave something is not a floor.
#
# THE POST-RUN GUARD IS STRICTER IN THIS MODE, NOT LOOSER. LESSON 3's alarm was
# "any dirt after the run". Under `--delivery` that test would be blind to a
# bench corrupting a manifest file, since such a file is already expected dirty.
# So the manifest's files are SHA-256'd before the run and re-hashed after, and
# a moved byte is a hard stop. The set is tolerated; the contents are not.
#
# THE CLEAN-TREE REFUSAL REMAINS THE DEFAULT. `--delivery` is the declared
# exception, never the new normal.
#
# (`dreamos-pwa`'s runner never had this gap — it has ORDERING, not refusal —
# which is why every prior pwa floor ran lawfully on a working tree. The gap was
# this repo's alone, and it arrived with the refusal that was meant to cure
# F-14.14.)
#
# EXIT CODE IS THE VERDICT, never the printed text: benches here use several
# report formats and only the exit code is shared by all of them.
#
# Usage:  bash scripts/run-floor.sh                            # print the red set
#         bash scripts/run-floor.sh --check                    # diff against the named base
#         bash scripts/run-floor.sh --delivery FILE [--check]  # [F-14.16] declared-dirt tree

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

BENCH_TIMEOUT="${BENCH_TIMEOUT:-}"   # UNSET by default — see LESSON 3
BASE_FILE="scripts/floor-base.txt"

# ── ARGUMENTS ────────────────────────────────────────────────────────────────
# Order-independent, because a caller who types `--check --delivery FILE` means
# the same thing as the reverse and should not be punished for it.
CHECK=""
MANIFEST=""
while [ $# -gt 0 ]; do
  case "$1" in
    --check)    CHECK="yes"; shift ;;
    --delivery) MANIFEST="${2:-}"; shift 2 || { echo "STOP — --delivery needs a manifest path."; exit 1; } ;;
    *)          echo "STOP — unknown argument: $1"; exit 1 ;;
  esac
done

# `git status --porcelain` paths, one per line. Rename entries carry `old -> new`
# and BOTH sides are dirt a manifest must account for.
dirt_paths() {
  git status --porcelain 2>/dev/null | while IFS= read -r line; do
    p="${line:3}"
    case "$p" in
      *" -> "*) echo "${p%% -> *}"; echo "${p##* -> }" ;;
      *)        echo "$p" ;;
    esac
  done | sed 's/^"//; s/"$//' | sort -u
}

# ── THE CLEAN-TREE REFUSAL (LESSON 4), WITH ITS DECLARED EXCEPTION (LESSON 5) ─
DIRT=$(dirt_paths)

if [ -z "$MANIFEST" ]; then
  # DEFAULT. Refused, not warned. A floor measured on a dirty tree is a number
  # nobody can reproduce, and the benches that write-and-restore cannot vouch
  # for themselves.
  if [ -n "$DIRT" ]; then
    echo "STOP — the tree is dirty. A floor is measured on a clean tree or not at all."
    echo "Commit or stash first, or declare the dirt with --delivery <manifest> [F-14.16]."
    echo "$DIRT" | sed 's/^/  /'
    exit 1
  fi
else
  # [F-14.16] DECLARED-DIRT MODE.
  if [ ! -f "$MANIFEST" ]; then
    echo "STOP — manifest not found: ${MANIFEST}. Nothing was run."
    exit 1
  fi
  # Blank lines and `#` comments allowed, so the manifest can carry its own
  # reasons and be the same artefact the handover prints.
  DECLARED=$(sed 's/#.*//' "$MANIFEST" | sed 's/[[:space:]]*$//' | grep -v '^[[:space:]]*$' | sort -u)
  UNDECLARED=$(comm -23 <(echo "$DIRT") <(echo "$DECLARED"))
  if [ -n "$UNDECLARED" ]; then
    echo "STOP — dirt OUTSIDE the declared manifest. This is contamination, not a"
    echo "delivery, and the difference is the whole point of this mode."
    echo "$UNDECLARED" | sed 's/^/  /'
    exit 1
  fi
  # PRINTED INTO THE OUTPUT: a floor that quietly forgave something is not a
  # floor. Whoever reads this measurement reads what it tolerated.
  echo "[F-14.16] --delivery mode: $(echo "$DIRT" | grep -c . ) dirty path(s), all declared in ${MANIFEST}:" >&2
  echo "$DIRT" | sed 's/^/  declared: /' >&2
  echo "" >&2

  # CONTENTS ARE NOT TOLERATED, ONLY THE SET. A bench that corrupts a manifest
  # file would hide inside expected dirt; these hashes are what catch it.
  MANIFEST_SHA_BEFORE=$(echo "$DIRT" | while IFS= read -r p; do
    [ -f "$p" ] && sha256sum "$p" || echo "ABSENT  $p"
  done)
fi

# ── THE BUILD-ARTIFACT REFUSAL (F-39.p2) ─────────────────────────────────────
# REFUSED, NOT WARNED, AND THE ASYMMETRY WITH THE SIBLING NOTE BELOW IS THE
# POINT. A missing sibling makes cross-repo benches SAY they refused — the
# output tells you. A missing `src/engine/dist` says nothing at all: the
# benches run, throw MODULE_NOT_FOUND inside `src/api/vendor/leads.js` (symbol:
# the `patchNote` import) as it is pulled in through `src/api/vendor/core.js`,
# and report as ordinary REDs indistinguishable from defects.
#
# WITNESSED, NOT SUPPOSED: at the 2b read-first, a fresh clone measured 47 RED
# against a named base of 20 — delta 27, every one of them an ADDITION and not
# one removal. That one-directional shape is the tell, and it is exactly the
# shape a seat writing the number down would not have questioned.
#
# `src/engine/dist` is `tsc` output (`npm run build:engine`) and is not
# committed, so EVERY fresh clone starts in this state. LESSON 1 above already
# says the first floor after a fresh install is not a floor; this is the same
# sentence with a second cause, and unlike cold module resolution it does not
# go away on the second run.
if [ -d "src/engine" ] && [ ! -d "src/engine/dist" ]; then
  echo "STOP — src/engine/dist is absent. The floor would read TWENTY-SEVEN too many"
  echo "REDs and every one of them would look like a defect [F-39.p2]."
  echo "Run: npm run build"
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
if [ -z "$MANIFEST" ]; then
  POST=$(git status --porcelain 2>/dev/null)
  if [ -n "$POST" ]; then
    echo ""
    echo "STOP — the tree is dirty AFTER the run. A bench did not restore what it"
    echo "mutated, and this floor was measured over changed source. Do not trust it."
    echo "$POST" | sed 's/^/  /'
    exit 1
  fi
else
  # [F-14.16] Two questions in this mode, and the second is the one the default
  # guard could not ask: did the DIRTY SET grow (a bench touched a file nobody
  # declared), and did any DECLARED FILE'S CONTENTS move (a bench corrupted the
  # delivery itself, hiding inside dirt that was already expected)?
  POST_DIRT=$(dirt_paths)
  POST_UNDECLARED=$(comm -23 <(echo "$POST_DIRT") <(echo "$DECLARED"))
  if [ -n "$POST_UNDECLARED" ]; then
    echo ""
    echo "STOP — a bench dirtied a file OUTSIDE the manifest. It did not restore"
    echo "what it mutated, and this floor was measured over changed source."
    echo "$POST_UNDECLARED" | sed 's/^/  /'
    exit 1
  fi
  MANIFEST_SHA_AFTER=$(echo "$DIRT" | while IFS= read -r p; do
    [ -f "$p" ] && sha256sum "$p" || echo "ABSENT  $p"
  done)
  if [ "$MANIFEST_SHA_BEFORE" != "$MANIFEST_SHA_AFTER" ]; then
    echo ""
    echo "STOP — a DECLARED file's contents moved during the run. The manifest"
    echo "tolerates a dirty SET, never dirty CONTENTS: a bench corrupted the"
    echo "delivery and would have hidden inside dirt that was already expected."
    diff <(echo "$MANIFEST_SHA_BEFORE") <(echo "$MANIFEST_SHA_AFTER") | sed 's/^/  /'
    exit 1
  fi
  echo "[F-14.16] declared files unmoved — set and contents both verified." >&2
fi

if [ "$CHECK" = "yes" ]; then
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
