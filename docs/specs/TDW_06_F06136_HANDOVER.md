# TDW_06 — THE LAST CHARTER · F-06.136's IMPERATIVE ARM + CHECK 6's SCOPE
### Executor handover. CE-110's closed list of three, at base `e8cc425` (tip at charter `8a75c63`, docs-only above the code base — derived, not trusted).

**Repo:** `devjroy-dev/dream-os` · **base:** `e8cc425` · **tip at charter:** `8a75c63` (`git diff --name-status e8cc425 8a75c63` = `docs/FINDINGS_LOG.md` + `docs/TDW_00_MASTERPLAN.md` only; the charter's "code base unchanged" verified by command at step zero).

**Delta, whole — five files:**

| file | what |
|---|---|
| `src/api/vendor-engine/chat.js` | the owner-imperative family + `imperativeMiss` (fork F1(a)) · `recordImperativeRetry` (fork F3(b)) · six exported seams |
| `src/lib/vendorInbound.js` | the arming predicate widened; the imperative arm's two outcomes |
| `scripts/b06_forkc_wireguard_bench.js` | §14 NEW (13 cells) · two labeled amendments, counts preserved |
| `scripts/b06_m3_bench.js` | one labeled amendment to the firewall inventory, count preserved |
| `docs/specs/TDW_06_CARD_THREE_BLOCK.md` | §1b NEW · the prose-only SELECT · CHECK 6 scoped · fixtures (iii)/(iv)/(iv-b) |

**W-1 SHUT, asserted by command:** zero bytes under `src/engine/src/`. `harveySoul.ts` is **quoted in-comment and never edited** — the quote's three load-bearing fragments are asserted present in BOTH the soul and the comment (§14.1), so a drift at either end reds.

**Copy inventory: ZERO.** Nothing reached a veto and nothing needed one — see §2 below for why that is structural rather than lucky.

---

## 1 · THE CHARTER'S THREE, ITEM BY ITEM

### ITEM 1 — THE IMPERATIVE MICRO (F-06.136), BUILT

The retry-the-actor's arming predicate widens from `verdict.specimen` to **`specimen OR imperative-miss`**.

**The predicate, one home** (`chat.js`, beside `actionKind` and the four claim families — fork F1(a)). Both legs mechanical:

- **the verb leg** — an owner-imperative from the soul's own family, at a **clause head**, in its **bare stem** form. The nine stems are `harveySoul.ts:98`'s own nine and no tenth (fork F4(a): "any plain cousin of those words" is an instruction to Victor, not a machine-derivable list). Polite lead-ins (`please`, `just`, `can you`…) are tolerated and do not change the mood.
- **the hand leg** — **ZERO matching hands** in the turn, where a matching hand is a write or calendar hand under `actionKind`, read through **D-1's fence** (nested `donna_calls` only; `listen_harvey_talk` fenced by name; the top level never walked). A **read hand is not a filing** and does not acquit.

**The false-arm risks are enumerated on the predicate's face**, F-04.27's precedent — the noun-at-clause-head (`Note on Kunal: …` reads as a label as easily as an imperative, and arms either way), the quoted owner, the rhetorical question. Every one costs at most **one duplicated actor run** and **cannot change a byte the vendor sees**.

**The arm's two outcomes** (`vendorInbound.js`, and it is a separate limb from Fork D's three, unreachable when the costume path armed):

- **A · the second run files it** → the retry's own reply ships, through the same persona firewall the first reply went through. Nothing is replaced; there was never a line to replace.
- **B · a second refusal** → **Victor's original reply ships UNTOUCHED.** `replyText` is not reassigned, `s2line` stays null, and **F3's sentence and both glitch lines are unreachable from this limb** (§14.9 asserts all three as negatives over the limb's own bytes).

**Why this arm can never ship a lie: it has no sentence of its own.** It does not read Victor's prose and does not judge his refusal — his refusal may be perfectly lawful under `harveySoul.ts:100`'s establish-it-first distinction, and the arm cannot tell the two apart. It re-runs the actor once and then lets his own words stand. That asymmetry is the whole design.

**INSIDE the tripwire (fork F2(a)).** `stage2Armed()` gates this arm too: `WIRE_GUARD_STAGE2=off` + a redeploy stops **everything Stage-2-shaped** in one act. The counter-argument — this arm intercepts nothing, so the tripwire's stated subject does not literally reach it — was heard at ruling and ruled the other way, deliberately.

**THE SPEND BOUND, the charter's measured cell (§14.10):** `await runTurn(` appears **exactly once** in the whole leg, for both arms. `_noRetry` threads through and the retried call never re-enters this body. **Worst case for any turn: exactly one duplicated actor run.** The bound is a shape, not a counter — asserted as a negative (`retryCount|retries|attempts|depth` absent).

**THE ROW (fork F3(b)).** `recordImperativeRetry` writes one `evals_runs` row per fired arm — `scenario: 'imperative_retry:<arm>'`, `run_type: 'production'` (already in the allowed set), the census of both turns' hands and both replies in the existing `transcript` jsonb. **Zero DDL, zero migration, no founder-run SQL.** Fail-open on every path. **Read the verdict word correctly:** `fail` means a hand the soul demanded never arrived and **his own sentence shipped** — it does *not* mean a lie was delivered.

### ITEM 2 — THE SD-REL PROBE: **OPEN, DECLARED, NOT GUESSED**

**The tee block never arrived at this seat.** `e7_gauntlet_20260729_120817.log` is founder-side; the ask was made at read-first and the reply carried the card-walk read instead. F-06.115's method needs the turn's exact bytes and this handover **will not** substitute the log entry's paraphrase for them — the Evening Six precedent (B-1 CLOSED-UNAVAILABLE, recorded plainly and never guessed) is the standing conduct here.

**Nothing is lost by applying first.** Item 2 is **classify-only** and builds nothing; the tee file is still on the founder's disk. The classification belongs to the CE's Evening-Eight ruling entry, not to this handover.

### ITEM 3 — CHECK 6's SCOPE (docs)

**§0.2 REPORT, and it is the reason this item is in the ZIP at all:** the charter says the CHECK-6 fix is "already riding CE-110's docs." **It is not.** `git log -3 -- docs/specs/TDW_06_CARD_THREE_BLOCK.md` returns `e8cc425` as its only commit, and the CE-110 push touched two other files. CE-110's own log sentence — *the docs correction rides THIS ZIP* — is the one that holds. Reported, then executed.

**The defect:** CHECK 6 hunts raw ids in Victor's outward prose (F-04.66's disease) but ran its grep over the **whole** pasted SELECT output, whose first two columns are `row_id` and `conversation_id` — UUIDs by definition. **The check convicted the block's own machinery, every evening, by construction.**

**The cure is a SCOPE (fork F6(a)), never a blunting.** The UUID limb **keeps its teeth byte-identical**; only its input narrowed, to a second read-only prose-column SELECT. **Cost stated:** Card Three now takes two pastes. Every other check is untouched.

**§3 gains fixtures (iii)/(iv)/(iv-b)** so the correction proves itself in both directions, per that section's own law: a UUID **in prose** must still convict; a prose-only line must not; and the old defect is preserved as a runnable exhibit so it is never re-invented. **All five fixtures in that file were run at this desk, in the exact form committed, and behave as the file claims** (iii→1 · iv→0 · iv-b→1 · i→0 · ii→1). The bash was made portable in the process — one `<<<` herestring replaced with `echo | grep`, because a line that cannot run in a plain `sh` is a line that was never tested.

---

## 2 · WHY THE COPY INVENTORY IS ZERO, STRUCTURALLY

The imperative arm ships **no string of its own**. Outcome A ships the model's own retry prose (firewalled); outcome B ships the model's own first prose (already firewalled upstream). The only new literals in the delta are a `scenario` key, two `console` lines, and comments. There is nothing here for a veto to own — and §14.9 exists to keep it that way: it asserts, over the limb's bytes, that `s2line` is never assigned, that F3's sentence is absent, that the report word is absent, and that `replyText` is written exactly once.

---

## 3 · PROOF

**Floor at the delivered tree, my own hand, after `npm run build`:**

```
selftest        386/386   BYTE-STABLE
guard           100 -> 113   (+13 DISCLOSED GROWTH: section §14 whole)
m3               37/37    COUNT PRESERVED, one labeled amendment (§4.4)
relay 40 · m0 50 · m1 45 · m2 43 · m4 33 · m4b 24 · m4c 20 · m4d 16
f0658 20 · f0667 16 · f0681 17 · f0692 23 · advisor 16 · advisor_route 16
0081 12 · sonnet 13 · donna_cache 16 · b0461_p6 25 · b6_floors 47 · b6_s1 24
b6_sitting2 22 · door_rider 15 · open_question 28 · witness 22 · f0550 31
arc_m1 53 · arc_m2 27 · arc_m3 11 · arc_m4 18 · arc_m5 11 · arc_m6 20
wa_words 19 · downgrade 12 · fresh_thread 10 · pwa_flip_seam 9
meter 28/29 KNOWN RED (F-06.41) carried, not this sitting's
engine: npm run build green · tsc --noEmit ZERO · node --check clean, four files
```

**Every count byte-stable except the two disclosed. Two labeled amendments, both count-preserved and both re-authored STRICTER:**

- **`b06_forkc_wireguard_bench` §11.6** — pinned the literal `if (s2line && !_noRetry)`. The charter widened that predicate. Re-authored to require the widened form **and** to assert the narrow form is gone, so a silent re-narrowing can no longer pass.
- **`b06_forkc_wireguard_bench` §5.8d** — a bare count of `replyText` writers (2). The imperative arm adds a lawful third. A bare number cannot tell a lawful writer from a smuggled one, so each of the three is now **named by its witness label** and an unnamed fourth reds.
- **`b06_m3_bench` §4.4** — the persona-firewall inventory. `scrubText(retry.reply)` moves 1→2, the second instance named. This cell caught the growth on its own and is the reason the new reply is firewalled at all.

**BOTH-WAYS — EIGHT MUTATIONS OF PRODUCTION CODE, each `cmp`-restored byte-identical:**

| # | mutation | result |
|---|---|---|
| 1 | the arming predicate re-narrowed to costume alone (**vendorInbound**) | RED 111/113 |
| 2 | the word boundary dropped from the stem alternation (**chat.js**) | RED 112/113 |
| 3 | the tripwire removed from the second arm (**vendorInbound**) | RED 112/113 |
| 4 | a tenth stem — a cousin — added to the family (**chat.js**) | RED 112/113 |
| 5 | the landing test swapped to the costume census `retryHands` (**vendorInbound**) | RED 112/113 |
| 6 | the imperative arm given a sentence of its own — F3 on a second refusal (**vendorInbound**) | RED 112/113 |
| 7 | the row writer's fail-open severed (**chat.js**) | RED 112/113 |
| 8 | the imperative landing's persona firewall removed (**vendorInbound**) | **m3 RED 36/37 AND guard RED 111/113** — two independent floors |

**The behavioural cells run on EVENING SEVEN'S OWN BYTES**, taken from the founder's `engine.messages` read of account `9888294440` (agent `d02c7a9a…`, 2026-07-29 12:23) — never from a log entry's paraphrase. Card Two's **line 2** (`Note on Kunal Dhillon: …`) and **line 5** (`Book a shoot for Kunal Dhillon …`) are the RED direction. The **same walk's lines 1 and 3** are the GREEN direction and are the strongest untaxed proof obtainable: in-family imperatives, on the same wire, the same minute, that **did** draw a hand.

**S3's four honest dispatches are untaxed BY CONSTRUCTION, not by exemption** — the fixture message is extracted from `b06_gauntlet.js` rather than retyped, and the unblock hand makes the predicate false on all four runs.

**F-06.111's grep runs over this movement's own four slices** (§14.13), scoped deliberately: the tree-wide sweep is on the instrument shelf and is not this sitting's, but the cure may not re-introduce the class it was benched against. The predicate itself uses a **count**, never an `every`.

---

## 4 · FINDINGS FILED THIS SITTING (unnumbered, per the law — the chair mints)

1. **THE CHARTER'S ITEM 3 PREMISE WAS FALSE AT THE TIP.** "Already riding CE-110's docs" — derived false in one command. Reported before building, executed after. The guardrail sentence working as written: *trust evidence over narrative, including this kickoff.*

2. **THE CURE LANDS ON A SEAT EVENING EIGHT DOES NOT MEASURE.** The rig's through-door seam calls `stage2Intercept(verdict, false)` at `b06_gauntlet.js:306` — the PWA-JSON seat's call. The WA retry leg is not in the measured path; CE-109 shipped that as its own STATED LIMIT. F-06.136 was born on a live card line and the cards have retired from the bar. **Evening Eight can return green or red without ever exercising this arm.** Its proof here is desk-only; its live witness is the founder's wire after production opens, read through the row F3(b) now writes. Named so no future reader mistakes a green Evening Eight for evidence about this micro.

3. **F-06.134's THIRD/FOURTH SIGHTING SITS IN THE SAME PASTE, AND THE ARM CORRECTLY IGNORES IT.** Evening Seven 12:23:39, the L3 turn: `"Done.\n\nFiled\n\n2026-12-18 wasn't blocked. Nothing changed."` — the false prefix above the true line, with a real `donna_unblock_date` hand behind it. A hand fired, so the imperative arm stays silent, correctly: that is a different disease, backlog-grade by the founder's leave. Benched as an explicit negative (§14.4) so a later widening cannot quietly annex it.

4. **A BENCH THAT ESCAPES ITS OWN UNICODE CANNOT ANCHOR ON RENDERED CHARACTERS.** `b06_forkc_wireguard_bench.js` writes `\u00a7` and `\u2014` as escapes, so a self-slice anchored on the rendered `§`/`—` returns the empty string. Caught by the cell's own non-emptiness guard rather than by an eye — F-06.132's exact class, one file along, and the reason that guard is now written first in every slicing cell this movement added.

5. **THE CHECK-6 FIXTURE'S FIRST DRAFT USED A BASH HERESTRING** (`<<<`) and could not run in a plain `sh` at this desk. Replaced with `echo | grep`. A founder-facing line that has not run in the form handed over has not been tested — §9's founder-shell discipline, applied to a docs block rather than an apply block.

---

## 5 · WHAT THE FOUNDER MUST DO — and what he must not

**Dashboard/console acts: NONE.** No env var, no Railway change, no Meta change, **no SQL in this delivery**. `WIRE_GUARD_STAGE2` in production is untouched by this ZIP.

**The tripwire law stays live and now covers one more arm: ONE FALSE INTERCEPTION IS A STOP**, and `WIRE_GUARD_STAGE2=off` + redeploy now disarms the imperative retry in the same act.

**Apply, then verify, then — only on a green verify — the git line, which ships as its own paste-block.**

**Item 2 remains open and costs nothing to leave open.** Paste the L3 SD-REL turn from `e7_gauntlet_20260729_120817.log` whenever it suits; the classification is chat-delivered and belongs to the CE's Evening-Eight entry.

**Live verdicts are DECLARED, never claimed. EVENING EIGHT is the witness for the block — and, per finding 2 above, is NOT the witness for this micro.**

**Sequencing beyond this sitting is the founder's.**
