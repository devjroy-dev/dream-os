# TDW_PR_FLOW — the pull request as the delivery of record

**Transport sitting T-1 · CE-39 · 2026-09-03.**
**This file is byte-identical in `dream-os` and `dreamos-pwa`.** A document that
governs both repos and differs between them has two behaviours and one name —
the same reason `tools/base_guard.sh` is byte-identical and the same reason
`tools/preflight.sh`'s verdict block is.

---

## 1. THE FLOW, IN ONE LINE

A seat opens a pull request. GitHub runs the estate's own gates on it. The
founder reads the diff and the handover in one browser tab and merges with one
click. **The merge IS the push.**

What did not change: the handover's sections, the chair's rulings, the floor's
method, the walk. What changed is where the handover lives and who does the
pushing.

## 2. WHAT REPLACES WHAT

| before | now |
|---|---|
| ZIP, `deploy/`-prefixed | a branch and a pull request |
| the fixed apply chain, pasted | `Merge pull request` |
| `tools/base_guard.sh` before every apply | **"require branches to be up to date"** — GitHub says *rebase*, and a wrong base cannot be applied to |
| the handover, pasted into chat | `.github/pull_request_template.md`, in the PR body |
| `run-floor.sh --delivery <manifest>` | nothing — a PR's tree is committed, so there is no declared dirt to tolerate. The WHAT MOVED table is the manifest's successor [F-T1.8] |
| "the founder runs the verify block" | `.github/workflows/gate.yml`, on every push to the PR |

**The ZIP chain SURVIVES, unchanged, as the fallback.** `TDW_BUILD_PROTOCOL.md`
§7 keeps its exact text and `base_guard.sh` keeps its job, because a seat with no
credential still has to be able to deliver, and a fallback that was quietly
allowed to rot is not a fallback. See §7 below.

## 3. WHAT THE FOUNDER APPLIES BY HAND

**A seat cannot do this.** Branch protection is a repository setting; no
credential this estate will ever issue to a seat can reach it. Apply in
`Settings → Branches → Add branch ruleset` (or *Branch protection rules*) in
**both** repos:

| repo | protected branch |
|---|---|
| `dream-os` | `main` |
| `dreamos-pwa` | `worklist` |

Settings, each with the reason it exists:

1. **Require a pull request before merging.** The whole flow. No approvals
   required — the founder is the sole reviewer and requiring his approval of his
   own merge is ceremony.
2. **Require status checks to pass**, and select **`gate`**. The check name comes
   from the `jobs.gate` key in `.github/workflows/gate.yml`. ⚠ It cannot be
   selected until it has run at least once; select it after the first PR's gate
   reports.
3. **Require branches to be up to date before merging.** This is the one that
   replaces `base_guard.sh` for PRs. A moved tip means *rebase*, never *apply to
   the wrong base* — F-38.25's mechanism becomes unreachable rather than guarded
   against.
4. **Restrict who can push** to the protected branch: **the founder only.**
5. **Block force pushes.** **Block deletions.**
6. **Dismiss stale approvals on new commits** — belt and braces given (1).

**Do not** enable "require linear history" yet; it forecloses a merge strategy
before anyone has needed one.

## 4. THE SEAT CREDENTIAL

A **fine-grained personal access token**, minted by the founder:

- **Repository access:** only `devjroy-dev/dream-os` and
  `devjroy-dev/dreamos-pwa`
- **Repository permissions:** `Contents: Read and write`,
  `Pull requests: Read and write`
- **Nothing else.** No workflow scope, no administration, no secrets.

That token can push a **branch** and open a **pull request**. It **cannot** push
to a protected branch, because §3(4) restricts pushes to the founder — GitHub
refuses it at the server, with a message, every time.

**IT LIVES IN THE LE WORKSPACE ENVIRONMENT. NEVER IN A FILE, NEVER IN A PULL
REQUEST, NEVER IN A COMMIT.** A token in a diff is a token that has been
published, and rotating it afterwards is a repair, not a prevention.

## 5. WHAT A SEAT DOES, AND WHAT IT NEVER DOES

**A seat pushes branches and opens pull requests. A seat never merges.**

Until §3 is applied that is a law a seat obeys. After §3 it is a fact the
repository enforces, which is the entire point of doing §3 before the second
pull request rather than after it.

Everything else stands unchanged: one sitting, one fresh workspace; read-first
before any byte; no migrations, no SQL, no smokes from a seat; the founder holds
copy veto on every vendor-facing and model-voiced string, and silence is not a
yes.

## 6. WHAT THIS FLOW DOES NOT YET KNOW — DECLARED, NOT PAPERED OVER

Three things, stated here because a gate whose residual risks live only in a
chat log is a gate that will be trusted further than it has earned.

**6.1 · The first real CI run is the witness for egress.** Both floors were
derived green at the T-1 read-first inside an LE container whose egress proxy
blocks most hosts. GitHub's runners have open egress. This estate contains at
least one bench whose verdict is a fact about the network — `b50_fetch_loop_bench`
refuses in the container and is expected to run green on a runner — and 48
dream-os benches reference provider or transport keys that were not all read.
**No prediction is offered about the first CI run.** If it comes back red, the
diff names what moved, and that is a finding about provisioning to be cured in
`gate.yml`, never a line put back into a base.

**6.2 · The preflight residual.** `tools/preflight.sh` is the gate's own
instrument and it cleared itself only after F-39.44 taught it to return its
verdict as an exit code. Its remaining blind spot is that it reports on the
sibling's BRANCH POSITION but not on the sibling's IDENTITY beyond the remote
URL. It is pinned by `ref:` in `gate.yml` and by nothing else.

**6.3 · Both-ways is not one proof but two, and only one of them is cheap.**
The deliberate-red pull request proves **the gate can fail**. Only the docs-only
pull request proves **it can pass** — and until c-39.57 shipped, that second
proof was the one that could not be obtained: the pwa's base carried a `REFUSED:`
line that was true only in the LE container, so the first `--check` on a runner
would have failed a docs-only PR for a reason having nothing to do with the docs.
**A gate that has only ever been shown failing is not a gate that has been
proven.** Both runs are on the founder's card and both are required.

## 7. WHEN THE ZIP CHAIN IS STILL THE ANSWER

Use the ZIP fallback when — and only when — the seat has no credential. It is
byte-identical to what it always was: `TDW_BUILD_PROTOCOL.md` §7's apply chain,
`tools/base_guard.sh` ahead of it, the git line in its own paste block.

**This delivery is itself the case.** T-1 was built in a workspace holding no
token — the PAT in §4 does not exist until the founder mints it — so the file
that defines the pull request flow arrives, once, as a ZIP. The chicken-and-egg
is resolved in exactly one direction and never again.

## 8. THE ORDER, ONCE

1. Founder applies §3 to both repos.
2. Founder mints §4's token, places it in the LE environment.
3. This delivery's branches are pushed and its two pull requests opened.
4. `gate` runs on both; the founder reads the diffs.
5. The throwaway red PR is opened, fails its check, and shows a blocked merge
   button; then it is closed.
6. A seat attempts one direct push to a protected branch, on purpose, once, and
   pastes GitHub's refusal.
7. The two real PRs are merged, one click each.

After step 7 the next delivery from any seat arrives as a pull request.
