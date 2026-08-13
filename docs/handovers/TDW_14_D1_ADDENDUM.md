# repo: dream-os @ 0678d81 · TDW_14 · D-1 · ADDENDUM — THE LOST MIGRATION

**A red verify was pushed. The mechanism that exists to prevent that is D-10, and D-10 did not fire because the verify chain I handed the founder could not print its own STOP. That is my defect, not a paste error.**

---

## 1 · WHAT IS AND IS NOT DAMAGED — derived at origin, not inferred

`git fetch` · tip `0678d81`.

| Path | State at `0678d81` |
|---|---|
| `db/migrations/0098_circle_visibility.sql` | **DESTROYED.** Zero newlines. Its entire contents are one line of shell — the verify command from STEP 4. |
| `src/lib/circlePermissions.js` | **byte-identical** to shipped (sha256) |
| `src/api/middleware/requireCircleMemberAuth.js` | **byte-identical** |
| `src/api/couple/circle.js` | **byte-identical** |
| `scripts/b14_d1_visibility_bench.js` | **byte-identical** |
| `docs/db/PUBLIC_SCHEMA.md` | **byte-identical** |
| `docs/handovers/TDW_14_D1_HANDOVER.md` | **byte-identical** |

The commit message landed **intact** — the terminal echo was garbled on screen, the heredoc was not. Verified by `git log -1 --format=%B origin/main`.

**PRODUCTION IS CORRECT AND WAS NEVER AT RISK.** The migration ran green before anything went wrong, and its three verify blocks are witnessed in the founder's own pasted results: `visibility` / `jsonb` / `NO` / `'{}'::jsonb` · `circle_members` = **14 columns** · `total_members` 1, `non_empty_visibility` **0**. The column exists, is correct, and no member's permissions moved. **What was lost is the repo's record of a migration that had already succeeded** — one file, one commit, no data.

---

## 2 · THE SEQUENCE, and where I broke it

1. SQL ran. Four blocks, all green, all pasted back. **Correct.**
2. ZIP applied. **Correct.**
3. Verify ran. Bench **61/61**, f0772 **158/159**. **Correct.**
4. **STEP 3 — my hand-edit step.** The founder opened `0098_circle_visibility.sql` to type the apply date. The session that had it open received the pasted verify command instead of the terminal, and the file was overwritten and saved.
5. Verify ran again. **The bench correctly reddened: §8.1, §8.2, §8.4 — all three read that file and all three said it was gone.** The bench did its job.
6. **The git line ran anyway**, and the push landed.

**Step 6 is mine.** The chain I handed over was:

```
… && node scripts/b07_f0772_circle_auth_bench.js; echo "— f0772 must read 158/159 —" || echo "STOP — do not run the git line"
```

The `;` ends the `&&` chain. The `||` therefore binds to the **`echo`**, which always exits 0. **The STOP was mechanically unreachable — it could not print on any input, red or green.** Proven:

```
$ bash -c 'false && echo chain; echo "note" || echo "STOP fires"'
note
```

The founder's terminal told him nothing was wrong, because I had written a verify that could not tell him. D-10 exists because of F-04.83's process half — a founder's paste running a git line over a red verify — and I reintroduced that exact failure one delivery after quoting the law back in my own attestation.

**The root cause is not the `;`. It is that I put a bench expected to exit NONZERO inside a chain whose exit code is the verdict.** `b07_f0772` is a pinned elder at 158/159; it exits 1 by design. Once it was in the chain, the chain could never be green, so I reached for a `;` to neutralise it — and neutralised the STOP with it. **An expected-red bench and a `&&` verdict chain are incompatible, and the `;` that reconciles them is always the wrong reconciliation.**

**THE CORRECTED SHAPE, proposed as standing:** the verdict chain contains only commands expected to exit 0, ends in `|| echo "STOP …"`, and any expected-red elder disclosure runs as **its own separate paste-block**, read by eye, never inside the verdict.

---

## 3 · THE HAND-EDIT STEP IS RETIRED

STEP 3 asked the founder to open a delivered file and type into it. **A delivery that asks the founder to open a file is a delivery that can lose the file**, and this is the specimen. The apply date was always derivable from the verify results he pastes back, so there was never a reason for his pen to be in that file.

The restored `0098` carries `Applied: 2026-08-13` **written by me from his witnessed block results**, with the three of them quoted in the header. The header explains why the executor now fills that line. **No file in any future delivery of mine asks for a hand edit.**

---

## 4 · WHAT THIS ZIP CONTAINS

| Path | Change |
|---|---|
| `db/migrations/0098_circle_visibility.sql` | **RESTORED**, byte-exact from the delivery tree, plus the apply date filled and the hand-edit rationale replaced |
| `scripts/b14_d1_visibility_bench.js` | **§8.5 added** — estate-wide ladder integrity |

**§8.5 — NO MIGRATION IN THE ESTATE HOLDS SHELL.** §8.1/§8.2/§8.4 caught this, but only because they happened to read the one file this delivery ships. §8.5 widens it: it walks `db/migrations/` (asserting the directory is the real one, >100 files, so it cannot pass vacuously against an empty read) and reds if **any** `.sql` file holds a line beginning with a shell command. **A ladder file holding shell is a rung that will be replayed as SQL by whoever trusts the directory.**

**Both-ways, against the real damage rather than a synthetic one:** at the cured tree **62/62**; with `git checkout origin/main -- db/migrations/0098_circle_visibility.sql` — the actual destroyed file — **§8.5 REDS**, alongside §8.1/§8.2/§8.4. The non-vacuity leg here is production reality, not a mutation I authored.

---

## 5 · FOR THE CHAIR

1. **The D-10 STOP defect is the finding of this sitting**, and it is mine. Class: an unreachable mechanical stop is worse than no stop, because it reads as one. Proposed standing shape in §2.
2. **The expected-red-elder-in-the-verdict-chain error** is its root and is worth naming separately — it is the reason the `;` looked necessary.
3. **`0678d81` is on origin with a destroyed ladder file.** This delivery repairs forward rather than reverting: the commit's other six files are correct, the migration is applied and correct in production, and a revert would unland a good cure to fix a text file.
4. **F-05.80 reproduced again** during this sitting's floor runs (`scripts/out/closer_scenarios_<ts>.txt`).

**Sequencing beyond this delivery is the founder's.**
