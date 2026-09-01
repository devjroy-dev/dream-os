#!/usr/bin/env bash
# tools/preflight.sh — R-38.20b. THE §0 THAT CANNOT BE WRITTEN AS PROSE.
#
#   bash tools/preflight.sh
#
# ── WHY  ────────────────────────────────────────────────────────────────────
# Three sittings in a row opened with the words "sibling clone present" and none of them
# said WHICH TREE. Today the founder's pwa workspace was found holding a sibling 154 commits
# behind, which means every floor number this arc was derived against a dream-os from
# another month and nobody could tell, because "present" is a fact about a directory and the
# benches read a fact about a commit. F-38.34. `present` as prose is banned; this prints the
# tip.
#
# ── WHAT LIES, AND WHY IT LIES QUIETLY  ─────────────────────────────────────
# Two preconditions have each faked a finding in this arc, in opposite directions, and both
# wore the costume of a defect while being one command away from nothing:
#
#   · NO node_modules → the pwa floor reads EIGHT TOO MANY REDs. `scripts/run-bands-proof.sh`
#     shells straight to `node_modules/.bin/tsc`, so seven `run-*-proof` benches and `waDial`
#     refuse for want of a binary. Witnessed at S2 §0.
#   · A MISSING OR STALE SIBLING → three benches refuse or read the wrong tree:
#     `tdw09_p2b_vocab`, `tdw13_d6_parity_matrix`, `tdw15_p1_events`. Witnessed at S1 §7
#     (missing) and again in a worktree at S2/2 §1 (25 REDs where the named base was 22).
#   · NO src/engine/dist → THE DREAM-OS FLOOR READS TWENTY-SEVEN TOO MANY REDs.  [F-39.p2]
#     `src/api/vendor/leads.js` (symbol: the `patchNote` import) requires
#     `../../engine/dist/core/donna`, which is a BUILD ARTIFACT — `npm run build:engine`,
#     `tsc -p src/engine/tsconfig.json` — and is not committed. On a fresh clone the require
#     throws MODULE_NOT_FOUND, and because `src/api/vendor/core.js` mounts `leads.js`, the
#     throw cascades into every bench that loads the vendor router. Witnessed at the 2b
#     read-first: 47 RED against a named base of 20, delta 27, ALL ONE-DIRECTIONAL — which
#     is itself the tell, since a real regression at an untouched tip does not add
#     twenty-seven benches and remove none.
#
# The names above are RECORDED from those witnessings, not re-derived on every run — said
# plainly rather than implied, because a list a reader assumes was derived is worse than one
# that admits it was remembered.
#
# AND THE THIRD ONE WAS ALREADY KNOWN, WHICH IS THE PART WORTH RECORDING.
# `scripts/b43_solutions_doors_bench.js`'s header states the prerequisite in full, and says
# it was learnt the same way — green in a tree where `build:engine` had run, RED on a virgin
# one — ending on the sentence 「a bench whose failure mode on a clean checkout looks like a
# broken door is a bench that will get the door blamed」.
#
# So the FACT was documented and the INSTRUMENT was not, and only the instrument runs. A
# header b43's reader sees is a header nobody measuring a floor ever opens; the floor went
# on returning a stable, wrong, twenty-seven-bench answer to any seat that wrote the number
# down. The 2b seat re-found it from first principles because there was nothing to read it
# from at the moment it mattered. Knowing a precondition lies is not the same as having
# something that says so out loud, and this file is the difference.
#
# NO STRICT MODE (R-38.21 (2), F-38.35). This file sets no shell options. It is executed
# rather than sourced and it still declines to set any, for the reason base_guard.sh gives.

say() { echo "$1"; }
line() { echo "------------------------------------------------------------"; }

# The two repos are siblings on disk. Derived from this file's own location rather than from
# a hard-coded /workspaces path, so it works in a codespace, a clone, or a container.
HERE=$(cd "$(dirname "$0")/.." && pwd)
PARENT=$(dirname "$HERE")

# ⚠ A DETACHED HEAD MUST NOT BE COMPARED AGAINST THE DEFAULT BRANCH, and the first cut of
# this file did exactly that. `git rev-parse --abbrev-ref HEAD` returns the literal string
# `HEAD` when the checkout is detached, so `origin/$BR` became `origin/HEAD` — origin's
# DEFAULT branch — and the report showed an upstream and a behind-count belonging to a
# branch the tree was not on. It then printed CLEAR over a sixteen-file dirty tree.
#
# THIS FILE EXISTS BECAUSE "sibling present" was a comfortable sentence that was not a fact,
# and its first cut produced a comfortable NUMBER that was not a fact. Same disease, new
# coat, one command away from being caught — which is why it was.
report() {
  NAME="$1"; DIR="$2"; WANT_BR="$3"
  if [ ! -d "$DIR/.git" ]; then
    say "$NAME"
    say "  path      $DIR"
    say "  NOT PRESENT — and this is a TOPOLOGY fact, not a fault by itself."
    say "  The two repos live in SEPARATE codespaces: the dreamos-pwa workspace carries"
    say "  a dream-os sibling; the dream-os workspace carries no pwa. What that costs the"
    say "  floor is stated in the verdict below, per repo, because it is not symmetric."
    eval "${NAME_VAR}_PRESENT=0"
    return
  fi
  eval "${NAME_VAR}_PRESENT=1"
  PKG=$(grep -m1 '"name"' "$DIR/package.json" 2>/dev/null | tr -d ' ",' | sed 's/name://')
  ORIGIN=$(git -C "$DIR" remote get-url origin 2>/dev/null)
  git -C "$DIR" fetch -q origin 2>/dev/null
  BR=$(git -C "$DIR" rev-parse --abbrev-ref HEAD 2>/dev/null)
  DETACHED="no"
  if [ "$BR" = "HEAD" ]; then DETACHED="YES"; BR="$WANT_BR"; fi
  HD=$(git -C "$DIR" rev-parse --short HEAD 2>/dev/null)
  UP=$(git -C "$DIR" rev-parse --short "origin/$BR" 2>/dev/null)
  BEHIND=$(git -C "$DIR" rev-list --count "HEAD..origin/$BR" 2>/dev/null)
  DIRT=$(git -C "$DIR" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  say "$NAME"
  say "  path      $DIR"
  say "  package   $PKG"
  say "  origin    $ORIGIN"
  say "  branch    $BR"
  if [ "$DETACHED" = "YES" ]; then
    say "  ⚠ DETACHED HEAD — the branch above is the EXPECTED one, not one this tree is on."
  fi
  say "  HEAD      $HD"
  say "  upstream  origin/$BR = $UP"
  say "  behind    ${BEHIND:-?}"
  say "  dirty     $DIRT file(s)"
  if [ -d "$DIR/node_modules" ]; then say "  node_modules  present"; else say "  node_modules  ABSENT"; fi
  # [F-39.p2] dream-os only, and the guard is on the SOURCE dir rather than on the repo's
  # name: a repo that has `src/engine/` is a repo whose floor needs `src/engine/dist/`, and
  # keying on the tree means this line cannot start lying if the layout moves. The pwa has
  # no `src/engine/`, so it prints nothing and no reader learns a fact about the wrong repo.
  if [ -d "$DIR/src/engine" ]; then
    if [ -d "$DIR/src/engine/dist" ]; then say "  engine/dist   present"
    else say "  engine/dist   ABSENT"; fi
  fi
  # Exported for the verdict below. A report that prints a number and a verdict that does
  # not read it is two homes for one fact.
  eval "${NAME_VAR}_BEHIND=\${BEHIND:-0}"
  eval "${NAME_VAR}_DIRT=\$DIRT"
}

line
say "PREFLIGHT · $(date -u '+%Y-%m-%d %H:%M UTC')"
line
# The expected branch per repo. Passed in rather than guessed, because a detached checkout
# cannot tell you which branch it was cut from and a guess there is how the first cut
# reported a behind-count against the wrong branch.
PWA_BRANCH="${1:-worklist}"
NAME_VAR=PWA; report "dreamos-pwa" "$PARENT/dreamos-pwa" "$PWA_BRANCH"
line
NAME_VAR=OS;  report "dream-os" "$PARENT/dream-os" "main"
line

# ── THE VERDICT, AND IT NAMES THE BENCHES RATHER THAN SAYING "some" ─────────
# ── PRECONDITIONS ARE CHECKED ONLY WHERE THEY APPLY ────────────────────────
# The first cut warned that the pwa's node_modules was absent while the pwa itself was
# absent — a precondition check run against a directory that does not exist, printed as
# though it were a finding. Same class as the two blind freshness checks at F-38.37: an
# instrument answering a question it cannot see.
WARN=0
if [ "${PWA_PRESENT:-0}" = "1" ] && [ ! -d "$PARENT/dreamos-pwa/node_modules" ]; then
  say "⚠ pwa node_modules ABSENT — the pwa floor will read EIGHT TOO MANY REDs"
  say "  (seven run-*-proof benches and waDial refuse without node_modules/.bin/tsc)."
  say "  Run: npm ci   in $PARENT/dreamos-pwa  BEFORE any floor number is written down."
  WARN=1
fi

# [F-39.p2] The same shape for the artifact the dream-os floor cannot see past. Keyed on
# `src/engine` existing, exactly as the per-repo line above is, so this never asks its
# question of a tree that has no such directory.
if [ -d "$PARENT/dream-os/src/engine" ] && [ ! -d "$PARENT/dream-os/src/engine/dist" ]; then
  say "⚠ dream-os src/engine/dist ABSENT — the dream-os floor will read TWENTY-SEVEN TOO MANY REDs"
  say "  (src/api/vendor/leads.js requires engine/dist/core/donna; the throw cascades through"
  say "   src/api/vendor/core.js into every bench that mounts the vendor router)."
  say "  Run: npm run build   in $PARENT/dream-os  BEFORE any floor number is written down."
  WARN=1
fi

# ── THE SIBLING MATTERS IN BOTH DIRECTIONS, AND NOT EQUALLY ────────────────
# From the pwa: three benches read the dream-os sibling and refuse or misread without it
# (F-38.34, handled below). From dream-os: `scripts/run-floor.sh` prints its own NOTE —
# 「dreamos-pwa is not a sibling of this repo. Cross-repo benches will REFUSE」 — so a
# dream-os floor COUNT taken without the pwa is not comparable to one taken with it.
#
# THAT IS WHY THIS WARNS RATHER THAN STAYING QUIET. A seat derived 20 REDs for dream-os in
# a container holding both repos and handed the founder that number for a workspace holding
# one. The number was true where it was measured and meaningless where it was quoted, which
# is F-38.34 pointed the other way. **Compare the SET at your own base, never a number from
# somebody else's layout** (R-38.19).
if [ "${OS_PRESENT:-0}" = "1" ] && [ "${PWA_PRESENT:-0}" = "0" ]; then
  say "⚠ dream-os is here and dreamos-pwa is NOT. dream-os's own floor will show extra REDs:"
  say "  its cross-repo benches refuse without the sibling, and that refusal IS them working."
  say "  A count taken here is NOT comparable to one taken in the pwa workspace. Derive the"
  say "  base's own count in THIS workspace before reading any delta (R-38.19)."
  WARN=1
fi
if [ "${PWA_PRESENT:-0}" = "1" ] && [ "${OS_PRESENT:-0}" = "0" ]; then
  say "⚠ sibling dream-os MISSING beside the pwa — three pwa benches will refuse:"
  say "  tdw09_p2b_vocab · tdw13_d6_parity_matrix · tdw15_p1_events"
  WARN=1
elif [ "${OS_PRESENT:-0}" = "1" ]; then
  SB=$(git -C "$PARENT/dream-os" rev-list --count HEAD..origin/main 2>/dev/null)
  if [ "${SB:-0}" != "0" ]; then
    say "⚠ sibling dream-os is $SB commit(s) BEHIND origin/main."
    say "  It is a FLOOR PRECONDITION, not scenery: tdw09_p2b_vocab,"
    say "  tdw13_d6_parity_matrix and tdw15_p1_events read it. A floor derived"
    say "  against a stale sibling is a number about a different tree (F-38.34)."
    say "  Run: git -C $PARENT/dream-os reset --hard origin/main"
    WARN=1
  fi
fi
# ── THE WORKING REPO'S OWN STATE IS PART OF THE VERDICT ─────────────────────
# The first cut warned only about node_modules and the sibling, so it printed CLEAR over a
# tree that was one commit behind and sixteen files dirty. A preflight that clears a tree
# nobody could safely apply to is worse than none: it is a signature on a check that was
# never made.
if [ "${PWA_PRESENT:-0}" = "1" ] && [ "${PWA_BEHIND:-0}" != "0" ]; then
  say "⚠ dreamos-pwa is ${PWA_BEHIND} commit(s) behind origin/${PWA_BRANCH} — re-derive the base (R-38.16)."
  WARN=1
fi
if [ "${PWA_PRESENT:-0}" = "1" ] && [ "${PWA_DIRT:-0}" != "0" ]; then
  say "⚠ dreamos-pwa has ${PWA_DIRT} uncommitted file(s). A whole-file apply over these reverts them (F-38.25)."
  WARN=1
fi
if [ "${OS_DIRT:-0}" != "0" ]; then
  say "⚠ dream-os has ${OS_DIRT} uncommitted file(s)."
  WARN=1
fi
# ── F-39.44 · THE VERDICT WAS PRINTED AND THE EXIT CODE SAID GO ──────────────
# This file ended `exit 0`, unconditionally, under both branches below. So it
# printed "PREFLIGHT NOT CLEAR — resolve the lines above" and then handed the
# caller a zero, and under this estate's own floor-method law — THE EXIT CODE IS
# THE VERDICT, never the printed text, because our benches use at least three
# report formats and only the code is shared by all of them — every wrapper that
# gated on this instrument saw CLEAR forever.
#
# It is the class this file's own sitting was chartered to audit, standing in the
# gate instrument itself: an instrument CORRECT ABOUT ITS OWN SUBJECT (the four
# warnings above are all true and all printed) and WRONG ABOUT WHAT IT IS READ TO
# MEAN, with nothing above it asking the second question. Found at the B-1
# read-first while deriving preflight for that sitting's own first motion; the
# instrument auditing the instruments could not clear itself.
#
# WHY `exit "$WARN"` AND NOT `exit 1`. `WARN` is already the verdict — every site
# above sets it to 1 beside the `say` that explains why. Deriving the exit from it
# means a warning added tomorrow gates by existing, which is the same law
# `run-floor.sh` learnt three times: an enumeration written by hand is believed to
# be complete and is not. There is no second place to keep in step.
#
# BEHAVIOUR ON A CLEAN TREE IS UNCHANGED: WARN=0, exit 0, same words.
# THE TWO COPIES ARE FORKED BY DESIGN AND BEHAVIOURALLY IDENTICAL — this block is
# byte-identical in both repos and both benches assert that.
if [ "$WARN" = "0" ]; then
  say "PREFLIGHT CLEAR — both tips named above. Quote THESE in §0, not the word 'present'."
else
  say "PREFLIGHT NOT CLEAR — resolve the lines above before any number goes in a handover."
fi
line
exit "$WARN"
