#!/usr/bin/env bash
# tools/base_guard.sh — R-38.20. THE CHECK THAT RUNS BEFORE A SINGLE FILE IS COPIED.
#
#   bash tools/base_guard.sh <repo-name> <base> <branch>
#   bash tools/base_guard.sh dreamos-pwa 9a868c8 worklist
#   bash tools/base_guard.sh dream-os    b52448f main
#
# ── IT IS THE SAME FILE IN BOTH REPOS, AND THAT IS DELIBERATE ───────────────
# The declared map below already knows both package names, so the two copies are
# byte-identical rather than forked. A guard that differs between the repos it guards is a
# guard with two behaviours and one name — and the founder works in both workspaces in the
# same hour, which is the condition this file exists for.
#
# ⚠ AND IT WAS NOT TRUE UNTIL CE-39 2b-2. THE PARAGRAPH ABOVE WAS THE DIVERGENCE.
# Derived by `cmp` at bd60ac2/4918275: the two copies differed, and they differed in
# EXACTLY THIS PARAGRAPH — the dream-os copy carried the claim of byte-identity and the
# dreamos-pwa copy did not, so the sentence asserting the equality was the only thing
# breaking it. Each copy also named only its OWN repo in the usage line, which is what a
# reader in the other workspace needs least.
#
# Both usage lines are here now, in one file, because a file that must be identical in two
# places cannot hold a line that is true in one of them. `b40` C81 asserts the equality by
# reading both trees, so the next divergence reddens a bench instead of being described by
# the file that has already drifted. F-39.26's class, in a shell script: present-tense ink
# that reads as a description and functions as a promise.
#
# ── WHY IT EXISTS, AND IT IS NOT A CONVENIENCE ──────────────────────────────
# R-38.15 says the verify block opens with the base check and STOPs on drift BEFORE
# `cp -r deploy/*` runs. Four deliveries this sitting put APPLY first and VERIFY second, so
# the guard fired after the files were already on disk — F-38.25 reproduced by the seat that
# had just written R-38.15 into its own handover. A rule retyped into every delivery is a
# second home for the rule, and it drifted the first time it was written down.
#
# THREE THINGS A BASE CHECK ALONE DOES NOT CATCH, all of them live in this estate today:
#   · WRONG REPO. Two repos are open in two codespaces and the founder works in both.
#     `cp -r deploy/*` in the wrong one scatters a frontend into a Node backend and nothing
#     objects until something fails much later, somewhere else.
#   · DIRTY TREE. The apply is a whole-file copy. Over uncommitted work it silently reverts
#     it — that is exactly how 85072e7 ate `drawerCancel`, C13's order array and two render
#     cells, and it was caught by `tsc` and by luck (F-38.25).
#   · THE WRONG REF. `git rev-parse origin/<branch>` reads the REMOTE. A stale local
#     checkout passes it happily, and the thing about to be overwritten is HEAD.
#
# ── NO STRICT MODE, DELIBERATELY  [R-38.21 (2), F-38.35] ────────────────────
# This file sets no shell options at all. `set -u` in `wl_mint_token.sh` leaked into the
# founder's interactive shell today and broke it: his RVM prompt hook reads an unset
# variable and died with `rvm_bash_nounset: unbound variable` on every subsequent command.
# This script is EXECUTED rather than sourced, so it could not leak — and it still declines
# to set anything, because "it cannot leak from here" is the reasoning that stops being true
# the day someone sources it out of convenience. Every variable below is defaulted at its
# use site instead, which is what strict mode was going to buy.
#
# ── THE PACKAGE NAME IS A DECLARED MAP, NOT AN ASSUMPTION ───────────────────
# Derived by command, 2026-08-28: dreamos-pwa's package.json says `web` and dream-os's says
# `dream-os-backend`. NEITHER MATCHES ITS REPO NAME. A guard that compared the two would
# have refused inside the correct repo, which is the worst kind of guard — one that teaches
# the founder to stop trusting it. The remote URL is the authority; the package name is a
# second, weaker witness read through the map below.

REPO="${1:-}"
BASE="${2:-}"
BRANCH="${3:-}"

refuse() { echo "REFUSED — $1"; echo "Do not apply. Nothing has been copied."; exit 1; }

if [ -z "$REPO" ] || [ -z "$BASE" ] || [ -z "$BRANCH" ]; then
  echo "usage: bash tools/base_guard.sh <repo-name> <base> <branch>"
  exit 2
fi

case "$REPO" in
  dreamos-pwa) WANT_PKG='"name": "web"' ;;
  dream-os)    WANT_PKG='"name": "dream-os-backend"' ;;
  *) refuse "unknown repo '$REPO' — this guard knows dreamos-pwa and dream-os only" ;;
esac

[ -f package.json ] || refuse "no package.json here — this is not a repo root"
grep -q "$WANT_PKG" package.json || refuse "package.json is not $REPO's (expected $WANT_PKG)"

ORIGIN=$(git remote get-url origin 2>/dev/null)
case "$ORIGIN" in
  *"devjroy-dev/$REPO"*) : ;;
  *) refuse "origin is '$ORIGIN', not devjroy-dev/$REPO — WRONG REPO" ;;
esac

git fetch -q origin || refuse "could not fetch origin"

HEAD_SHORT=$(git rev-parse --short HEAD 2>/dev/null)
[ "$HEAD_SHORT" = "$BASE" ] || refuse "HEAD is $HEAD_SHORT, base is $BASE — the local checkout is not on the base"

REMOTE_SHORT=$(git rev-parse --short "origin/$BRANCH" 2>/dev/null)
[ "$REMOTE_SHORT" = "$BASE" ] || refuse "origin/$BRANCH is $REMOTE_SHORT, base is $BASE — the branch moved beneath this delivery (R-38.16)"

DIRT=$(git status --porcelain)
if [ -n "$DIRT" ]; then
  echo "REFUSED — the tree is dirty. A whole-file copy over uncommitted work reverts it silently (F-38.25)."
  echo "$DIRT"
  echo "Do not apply. Nothing has been copied."
  exit 1
fi

echo "SAFE TO APPLY — $REPO · $BRANCH · $BASE · clean"
exit 0
