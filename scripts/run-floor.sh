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
# ═══════════════════════════════════════════════════════════════════════════
# THE BASE HOLDS FAILURES ONLY  [c-39.57 · TRANSPORT SITTING T-1, 2026-09-03]
# ═══════════════════════════════════════════════════════════════════════════
# A REFUSAL IS A FACT ABOUT THIS ENVIRONMENT. A FAILURE IS A FACT ABOUT THIS
# TREE. ONE BASE CANNOT HOLD BOTH, AND FOR THREE WEEKS THIS ONE TRIED.
#
# F-39.47 gave this runner a third exit code to read and the refusals joined the
# printed SET — which was right — and then joined the BASE, which was not. The
# chair has named that second step as his own correction (c-39.57) rather than
# leave it as a property of the file.
#
# WHAT IT COST, AND IT WAS FOUND BY THE GATE THAT DOES NOT YET EXIST. At the T-1
# read-first the pwa's base was seen to carry `REFUSED: b50_fetch_loop_bench`
# with a comment stating, correctly and in advance, that the SAME BENCH IS GREEN
# ON A CI RUNNER because the refusal is an egress fact about the LE container.
# So the base was true in one environment and one line wrong in every other, and
# the first `--check` on a runner would have failed a docs-only pull request for
# a reason that had nothing to do with the pull request. The alternatives on the
# table were a per-environment base (a second home for the floor's truth) or a
# keyed tolerance (the same thing wearing an env var). Both were refused.
#
# SO: `--check` COMPARES THE RED SET AND NOTHING ELSE. Refusals are measured,
# named in their own list under the floor, and carried by no base. The three
# lines that left when this shipped — `b5_wa_door_smoke`, `bf1_bride_tool_
# fidelity_bench` (this repo) and `b50_fetch_loop_bench` (the pwa) — were every
# REFUSED line either base held.
#
# ⚠ THIS IS NOT AN ABSOLUTION, AND THE CHANNEL IS NOT WEAKER FOR IT. A refusal
# is still non-zero, still measured, still printed by name, and `--refusals-fatal`
# makes it an exit code wherever a refusal has no honest reason to exist. What
# left the base is the CLAIM that a particular refusal is permanent everywhere.
#
# ⚠ AND A REFUSAL THAT GOES SILENT IS STILL A LOSS. The base used to catch a
# refusal appearing or vanishing; it no longer does, and that is the price of the
# ruling, stated rather than hidden. The named list is what a reader diffs by eye,
# and `--refusals-fatal` is what a runner diffs by exit code.
#
# ── `--refusals-fatal` · WHERE A REFUSAL IS A CONFIG DEFECT ─────────────────
# Every refusal in this estate names a MISSING PRECONDITION: a service-role key,
# a provider key, egress, the sibling clone. A run that was provisioned with all
# of them and still refuses is a broken runner configuration, not a fact about
# the tree — and CI is exactly that run. So the gate passes this flag and a
# refusal there is red.
#
# IT IS A FLAG AND NOT THE DEFAULT because the founder's Codespace and every LE
# container legitimately lack one precondition or another, and a floor that
# refused to be measured without a live DeepSeek key would simply stop being run.
#
# CLASSIFIED BY THE EXIT CODE, NEVER BY GREPPING THE OUTPUT — the header's own
# rule, and the reason this lives in the runner instead of in the workflow. A
# grep's failure mode is a silent zero; an exit code's is an error.
#
# Usage:  bash scripts/run-floor.sh                            # print the red set
#         bash scripts/run-floor.sh --check                    # diff RED against the named base
#         bash scripts/run-floor.sh --check --refusals-fatal   # CI: a refusal is a red too
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
REFUSALS_FATAL=""
# The single accumulated verdict. Declared here rather than at first use because
# `set -u` is on above and an undefined expansion would abort the run at the one
# moment the run is trying to report.
VERDICT=0
while [ $# -gt 0 ]; do
  case "$1" in
    --check)           CHECK="yes"; shift ;;
    --refusals-fatal)  REFUSALS_FATAL="yes"; shift ;;
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
  local out="$1" ref="$2" quiet="$3"
  : > "$out"
  : > "$ref"
  for b in $ALL; do
    [ -f "$b" ] || continue
    local n; n=$(basename "$b" .js)
    if [ -n "$BENCH_TIMEOUT" ]; then
      timeout "$BENCH_TIMEOUT" node "$b" >/dev/null 2>&1
    else
      node "$b" >/dev/null 2>&1
    fi
    local rc=$?
    # ── F-39.47 · EXIT 3 IS A REFUSAL, AND IT GETS ITS OWN LINE ──────────────
    # A bench that could not READ its subject is not a bench that FAILED it.
    # `b49_writer_hygiene_bench` §3.1 returns `REFUSED — src/engine/dist/... is
    # absent` and, until the channel existed, exited 1 exactly as a defect does —
    # so a missing build artifact reached this floor as `RED: b49`, reading as
    # audit prose surviving in a vendor-facing column.
    #
    # CLASSIFIED BY THE CODE, NEVER A GREP, exactly as this file's header rules:
    # only the exit code is shared by this estate's report formats, and greping
    # output for the word REFUSED would classify a bench by a string any comment
    # could contain. 0 green · 1 red · 3 refused · 124 timeout.
    #
    # ⚠ THE LINE THAT USED TO STAND HERE SAID 「THE SET CARRIES IT so `--check`'s
    # diff can see a refusal appear or vanish」. That was the reasoning behind
    # c-39.57 and it is retired rather than deleted, because a removed line
    # teaches nothing. It bought one kind of visibility and paid for it with a
    # base that was only true in one environment; the header states the trade in
    # full. Refusals now go to their OWN list, which is printed, and to
    # `--refusals-fatal`, which is an exit code.
    if [ "$rc" -eq 3 ]; then
      echo "REFUSED: ${n}" >> "$ref"
    elif [ $rc -ne 0 ]; then
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
  sort -o "$ref" "$ref"
}

# ── THE WARM-UP, DISCARDED (LESSON 1) ────────────────────────────────────────
echo "warming (this pass is discarded — see LESSON 1 in this file's header)…" >&2
run_pass /tmp/floor_warm.txt /tmp/floor_warm_refused.txt quiet

# ── THE MEASURED PASS ────────────────────────────────────────────────────────
run_pass /tmp/floor.txt /tmp/floor_refused.txt loud
cat /tmp/floor.txt

# ── THE REFUSALS, NAMED AND UNCOMPARED  [c-39.57] ────────────────────────────
# PRINTED EVEN WHEN EMPTY. Silence here would be ambiguous between "none refused"
# and "this runner no longer looks", and the whole reason refusals left the base
# is that an unexamined steady state is how a bench stops being read.
if [ -s /tmp/floor_refused.txt ]; then
  echo ""
  echo "REFUSED — measured, named, and NOT part of the base compare [c-39.57]:"
  sed 's/^/  /' /tmp/floor_refused.txt
  echo "Each names a missing precondition of THIS environment — a key, egress, the"
  echo "sibling clone. Provision it and the line goes; it is not a claim about the tree."
else
  echo ""
  echo "REFUSED — none."
fi

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
  #
  # ⚠ THE BASE FILE IS A PURE SET AND CARRIES NO COMMENTS. It is diffed RAW
  # against the measured floor below, so a `#` line in it is a permanent delta
  # that fails every run. Reasons for base movements are written HERE. Learned by
  # doing it wrong once this sitting: the reclassification note below was drafted
  # into the base file first and would have broken `--check` at every tip.
  #
  # ── BASE AMENDED, LABELLED — CE-39 PRE-BETA SMALLS · S4 RIDER  [F-39.55] ───
  # A SECOND LINE RECLASSIFIES: `bf1_bride_tool_fidelity_bench`, `RED:` ->
  # `REFUSED:`. Nothing joins, nothing leaves.
  #
  # THE GROUND, MEASURED AND NOT READ: run bare with no `DEEPSEEK_API_KEY` it
  # prints 「BF1_VERDICT: NOT_RUN reason=no_key」 and now exits 3. It exited 2
  # until this sitting, which is why it sat in the base as a red — a live-endpoint
  # bench declining to invent an offline mode, counted as a defect.
  #
  # ⚠ IT WAS TWO EDITS, NOT THE ONE THE GRANT ANTICIPATED, AND THE SECOND CURED A
  # REGRESSION OF MINE. `bf1`'s catch exited 3 for BOTH a transport failure and an
  # unexpected throw. While the runner read every non-zero code as RED that cost
  # nothing. F-39.47 taught it that 3 means REFUSED — and thereby downgraded an
  # unanticipated exception from a red sheet to a shrug, in the one bench whose
  # own header says a transport fault must never be reported as a red sheet. The
  # catch now splits: transport -> 3, unexpected -> 2. Proven both ways.
  #
  # ⚠ AND THE ORDERING BIT ONCE, RECORDED SO IT DOES NOT AGAIN. This file is
  # diffed RAW against a `sort`ed measurement, so it must itself be sorted.
  # `RED:` sorts before `REFUSED:` (D < F), so a reclassified line MOVES to the
  # end of the file — editing it in place leaves the set correct and the ORDER
  # wrong, and `--check` then prints the identical line on both sides of the
  # diff. That reads as a delta and is an artifact of the comparison.
  #
  # ── BASE AMENDED, LABELLED — CE-39 PRE-BETA SMALLS · S4  [F-39.47] ─────────
  # ONE LINE RECLASSIFIES; NOTHING JOINS, NOTHING LEAVES, AND NO BENCH CHANGED.
  # `b5_wa_door_smoke` moves from `RED:` to `REFUSED:`.
  #
  # THE GROUND, derived rather than asserted: that bench guards its own entry —
  # 「This smoke writes to a live database; it refuses to run without explicit
  # service-role keys」 — and exits 3. It has always exited 3. The runner
  # classified every non-zero code as RED, so a bench declining to touch
  # PRODUCTION without credentials has been counted as a defect in every dream-os
  # floor since it was written, and sat in the base as a line nobody could
  # account for. F-39.47 gave the runner a third code to read; this line is what
  # it found already spoken.
  #
  # ⚠ EXIT 3 WAS NOT INVENTED FOR THIS ARC. It was chosen for the channel before
  # this bench was read, and finding the convention already here means the estate
  # had it and only the reader was missing. Recorded because a coincidence that
  # goes unexamined is how a wrong convention gets entrenched.
  #
  # ⚠ IT IS STILL NOT GREEN. A refusal is non-zero and named in the set, so if
  # this bench ever starts PASSING — or starts REDDING for a real reason — the
  # diff below catches it. A reclassification is not an absolution.
  #
  # ── BASE AMENDED, LABELLED — TRANSPORT SITTING T-1  [c-39.57] ──────────────
  # TWO LINES LEAVE AND NOTHING JOINS: `REFUSED: b5_wa_door_smoke` and
  # `REFUSED: bf1_bride_tool_fidelity_bench`. NO BENCH CHANGED, and neither
  # bench's verdict moved — both still exit 3 and both are still printed, in the
  # named refusal list above rather than in this file.
  #
  # THE COUNT MOVEMENT, DISCLOSED: 20 lines → 18. Both amendments immediately
  # above (F-39.47, F-39.55) put those two lines here one sitting ago and this
  # one takes them out; that is not churn, it is the chair correcting his own
  # ruling in the open. The reasoning is in this file's header under c-39.57.
  # After this, EVERY line in the base file begins `RED:` — and that is now an
  # invariant, not an observation.
  if [ ! -f "$BASE_FILE" ]; then
    echo "STOP — ${BASE_FILE} is missing. There is no base to check against."
    exit 1
  fi
  echo ""
  if diff "$BASE_FILE" /tmp/floor.txt; then
    echo "FLOOR = NAMED BASE, no delta"
  else
    echo "FLOOR DELTA — the diff above is this delivery's to explain"
    VERDICT=1
  fi
fi

# ── `--refusals-fatal` · THE GATE'S OWN QUESTION  [c-39.57] ──────────────────
# Asked AFTER the base compare and reported ALONGSIDE it, never instead of it. A
# run that has both a delta and a refusal has two things wrong with it, and an
# early `exit` on the first would hide the second behind a green-looking silence
# — which is the shape this file spent three lessons learning to distrust.
if [ "$REFUSALS_FATAL" = "yes" ] && [ -s /tmp/floor_refused.txt ]; then
  echo ""
  echo "STOP — refusals in a run that declared itself fully provisioned:"
  sed 's/^/  /' /tmp/floor_refused.txt
  echo "--refusals-fatal says every precondition was supplied, so a refusal here is a"
  echo "CONFIG defect in the runner and not a fact about the tree. Fix the provisioning"
  echo "or take the flag off; do not put the line back in the base."
  VERDICT=1
fi

exit "$VERDICT"
