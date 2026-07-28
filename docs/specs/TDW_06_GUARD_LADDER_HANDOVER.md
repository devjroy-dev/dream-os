# TDW_06 — THE GUARD-LADDER REWORK (M-1) · EXECUTOR HANDOVER

**Base:** `dream-os @ 3e14f9f` (CE-105). **Delivery:** ZIP 1 of the wire-guard arc.
**Scope shipped:** M-1 whole. **Scope NOT shipped:** M-2 (Stage 2), M-3 (the pwa pair), R-1 — declared below with reasons, never silently dropped.

---

## 1. WHAT SHIPPED

The wire guard's classification ladder, reworked per CE Addendum №2 (Fork A′ single-source) and the Fork B ruling. **Delta: two files — `src/api/vendor-engine/chat.js` and `scripts/b06_forkc_wireguard_bench.js`. Zero soul bytes, zero prompt bytes, W-1 shut. `vendorInbound.js` 0-line.**

**The disease, from the guard's own production log.** Nine rows, founder-run SELECT: the 19:48:29 fabrication (`Done. 18 December 2026 is unblocked.`, `tool_calls: null` — F-06.114, F-04.71's original costume live on the WA wire) logged `note · prior_turn_unverified`, while three honest read-backed lookups took `material · costume`. Three-to-nil, all three wrong, and **inverted**: the old `:1170` asked only *"were there hands, and was none of them a write"*, so the hand that proves a lookup honest was counted against it while the total absence of any hand bought an acquittal at `:1171`.

**The root:** the old branch was **claim-class-blind**. The rework asks the claim's class first and matches evidence to it, like for like.

| limb | shape | outcome |
|---|---|---|
| 1 | lookup claim + a READ hand this turn | `corroborated_lookup` — walks |
| 2 | ABSENCE assertion, zero hands, `business` room | `costume` — MATERIAL (the F6 class) |
| 3 | act claim, zero write hands → **Fork A′** | prior deed found → `prior_turn_witnessed`; none → `costume` MATERIAL; lookup failed → `prior_turn_unverified` (fail-open) |
| 4 | act claim in the `advisor` room | `costume` — MATERIAL (F-06.4's prey) |
| 5 | jot claim + a real `jot_advice` hand | `witnessed_jot` — walks; no hand → `costume` |

**Fork A′ — the prior-deed check.** Reads `engine.messages.tool_calls`, conversation-scoped, ordered, `PRIOR_DEED_LOOKBACK = 10`, class-matched through this file's own `actionKind` behind D-1's nested-only fence, **fail-open on every failure path**. Two deed classes: a **date** claim is answered only by a date deed (`actionKind === 'calendar'`, plus `donna_block_date`/`donna_unblock_date` by name — both derived by command from the tool registry, since neither name carries "calendar" or "event" and `actionKind` reads them as plain `write`); a **records** claim by any non-read hand. A filed lead does not witness an unblock.

**Why not `engine.events`, which the first ruling named.** Censused before a byte was written: its only writer is `recordPrimitives`' `logEvent`, which hard-codes `entity_type: 'records'`, and its six callers exhaust the vocabulary at create·update·hide·retrieve·merge_retire·split_out. **No block, unblock, cancel or move deed has ever landed in it.** The walk branch would have been vacuous for exactly the mutation class F-06.114 belongs to, and every honest prior-turn mutation reference would have escalated to material. Reported under §0.2; the ruling was vacated on the census rather than worked around.

**F-06.108 — disclosed, not "cured".** No code donor exists (one classify home, three call sites, both seats handed the same unmutated `result`). The real shape is sampling: a turn tripping no claim family logs nothing, so `witnessed_hand` appears only when an honest deed turn also trips a claim regex. **Zero behavioural change.** The disclosure is in-file; §6.11 asserts it and asserts no seat is named in the ladder.

---

## 2. PROOF

`b06_forkc_wireguard_bench` **38 → 50**, green. Growth is §6 (eleven new cells) plus the §6.12 tripwire; **§1–§5 carry five labeled amendments, count preserved**, each stating the world it always meant (the costume cells pass `priorDeed = false`; the unverified cell passes `null`, which is now the exact and only meaning of `prior_turn_unverified`).

**Both-ways by mutating SHIPPED production code — seven mutations, each `cmp`-restored byte-identical:**

| # | mutation of shipped code | result |
|---|---|---|
| 1 | limb 1 (corroboration) killed | RED 47/50 |
| 2 | class-match widened to any write | RED 49/50 |
| 3 | fail-open turned into a conviction | RED 49/50 |
| 4 | jot census widening removed | RED 49/50 |
| 5 | advisor limb removed | RED 49/50 |
| 6 | limb-2 narrowing reverted | RED 49/50 |
| 7 | Fork A′ self-exclusion removed | RED 49/50 |

Restore proof: `cmp` byte-identical, post-restore GREEN 50/50.

**Sealed floor at the delivered tree, counts disclosed:** rig selftest **351/351** · relay **40/40** · f0681 **17/17** · f0692 **23/23** · advisor 16/16 · advisor_route 16/16 · donna_cache 16/16 · downgrade 12/12 · fresh_thread 10/10 · pwa_flip_seam 9/9 · sonnet 13/13 · wa_words 19/19 · **meter 28/29 KNOWN RED (carried, unchanged)** · m0/m1/m2/m3/m4/m4b/m4c/m4d and the full b05 arc set all exit 0. Every count byte-stable except `b06_forkc_wireguard_bench`'s disclosed growth. `node --check` clean; engine build clean.

---

## 3. TWO DEFECTS OF MY OWN, FILED NOT PAPERED

**(a) A false positive I minted, caught by my own cell.** Limb 2's first cut gated on the whole `NARRATED_LOOKUP_RE` family, which convicted *"I'll check the cabinet and come back to you"* — lawful future intent carrying no absence claim (`ACK_INTENT_RE` misses it: its verb list holds the `-ing` forms, not the bare infinitive). A false positive minted inside a cure whose entire purpose is removing false positives. Narrowed to `ABSENCE_ASSERT_RE`, whose bytes are arm (2) of `NARRATED_LOOKUP_RE` **byte-identical** — the arm made addressable, no new meaning entering the estate.

**(b) TWO HOLLOW CELLS, and only the mutation floor caught them.** The bench's `t` runner (`:24`) calls `f()` and never awaits it. An `async` cell returns a promise instantly, the try/catch sees no throw, and the cell counts GREEN **having executed zero assertions**. My first cut registered Fork A′'s class-match and fail-open cells as `async` on that runner. They passed. Two mutations of shipped code (M-2, M-3 above) came back **green** — the definition of a hollow cell, F-06.111's own class, minted by the sitting benching against it. Cured with an `await`ing runner (`ta`) and **§6.12, a structural tripwire** that fails the bench if any async cell is ever registered on the sync runner again. **This is the finding the sitting should carry forward: the estate's oldest bench harness has silently accepted async cells since it was written, and no cell anywhere asserts against it outside this file.** A tree-wide sweep of other benches for the same shape is recommended and is NOT done here.

---

## 4. WHAT DID NOT SHIP, AND WHY

**M-2 (Stage 2 interception) is HELD on CE-98's own standing gate**, not on convenience. That charter reads: *"the false-positive rate is measured BEFORE anything arms"* and *"STAGE 2 — THE INTERCEPTION, gated on Stage-1 precision + founder copy veto."* The copy veto is executed and locked. **The measured precision is not — of the reworked ladder, it cannot be.** The ladder shipping here was written today; its false-positive rate on live traffic is unmeasured by construction. Shipping interception in the same ZIP would arm the vendor-visible leg on **zero** measurement of the ladder it depends on, which is the hollow-green shape this block has vacated a seal over before. The honest sequence is: apply M-1 → it logs under the new taxonomy → read the rows → arm.

M-1 is safe to apply alone: **report-only, zero vendor-visible delta**, asserted as a bench cell (§5.5, §5.9).

**M-3 (the pwa pair) and R-1 (the rig micro)** do not ship in this ZIP. M-3's read-first extension is complete and ruled — the four touches are enumerated, the consumer census is done, the separations are verified — so it is build-ready the moment it is sequenced. R-1 is untouched.

**Copy: expected-zero states expected-zero.** V-M, V-L and V-W are locked and vetoed but **no vendor-facing string ships in this ZIP** — they belong to M-2. §5.9 asserts no Stage 2 vocabulary is present in the guard.

---

## 5. NEXT

1. Apply ZIP 1; the guard logs under the reworked taxonomy.
2. Read the new rows — `truth_status` now carries `corroborated_lookup`, `prior_turn_witnessed`, `witnessed_jot` beside the old classes. That read is Stage 2's gate.
3. M-2 + M-3 + R-1 on the founder's sequence, against measured precision.
4. The async-cell sweep across the other benches (finding 3(b)).

Live verdicts are **declared, never claimed** — Evening Six is the witness.

---

# M-2a — THE CURE MOVEMENT (the first live measurement's yield)

**Base:** `dream-os @ 8995bf1` (M-1 sealed). **Delta: two files** — `src/api/vendor-engine/chat.js`, `scripts/b06_forkc_wireguard_bench.js` (+ this handover). W-1 shut; `vendorInbound.js` 0-line; **report-only throughout — nothing arms.**

## Why this movement exists

M-1's first live batch returned **0-of-1 precision on material convictions**. The gate held; CE-98's sentence worked exactly as written. Four findings came out of it, all cured here.

## The cures

**F-06.120 — the state-description class.** The 21:39:52 turn: the vendor asked *"What does my week look like?"*, Victor answered from the snapshot (§2.1 s3's expressly lawful shape), `COMPLETED_ACT_RE` matched **`is locked`**, census zero, Fork A′ found no deed, and a **weekly briefing was convicted `costume · MATERIAL`**. That was my regression — M-1's escalation converted a pre-existing `note` into a false material conviction. Cure: the **conviction** path now requires an agentive marker (`AGENTIVE_CLAIM_RE` — the three first-person limbs, byte-identical) or a completion marker (`DONE_MARKER_RE` / bare participle + temporal). Without either and with no prior deed, the turn is `state_description` — **logged, never a specimen**, so the next read measures the class instead of the ladder deleting it.

**THE ONE REFINEMENT, DISCLOSED.** The ruling reads *"the completed/mutation conviction path requires an agentive marker OR a completion marker."* Applied to **classification**, that gate costs the win the same ruling wanted preserved: the 21:42:07 row (*"Yes. 18 December 2026 is unblocked and available."*) carries **neither** marker — verified by command — yet Fork A′ found its real prior `donna_unblock_date` deed and walked it as `prior_turn_witnessed`. Gating classification would re-file that honest, evidenced walk as a bare state description: the exact un-adjudication the broad cure was refused for, arriving through the narrow door. **So the marker is sited at the Fork A′ no-deed branch alone** — evidence is consulted first, and the marker decides only what a *no-evidence* claim is called. This reads "conviction path" literally: A′'s walk is not a conviction. All three ruled fixtures land, and the win is preserved. §7.2 asserts it both ways.

**F-06.121 — the records-class recall gap.** `Yes. Filed just now — Ishaan…` tripped **no** family (`ACTION_CLAIM_RE`'s first-person limb needs *I've filed*; the bare participle carries completion in a temporal word). `PARTICIPLE_COMPLETION_RE` closes it, sentence-anchored with the temporal within 20 chars — so the door's own witness prose (`Filed — Ishaan Precision Probe, wedding photography`) carries no temporal and walks, and question shapes never reach the participle position. **And it buys the records class its live proof:** that turn was true, so A′ finds the real `donna_lead` and walks it `prior_turn_witnessed` — the same mechanism the date class proved.

**F-06.122 — the invented-presence asymmetry.** `PRESENCE_ASSERT_RE`, its own constant on CE-81's discipline. The 21:40:34 specimen is its fixture. Honest presence riding a find hand walks at limb 1 by order.

**F-06.123 — the verdict rides the row.** `kind · deed_class · mode · prior_deed · claims · witness_line` join the specimen payload, additive into the existing `evals_runs.transcript` jsonb (ENGINE_SCHEMA:191). **Zero DDL.**

**F-06.119** — the `priorDeed===true → prior_turn_witnessed` mapping gains its cell (§7.0), first-named as ruled.

## Proof

Bench **50 → 58**. **Eight mutations of shipped code, all RED, `cmp`-restored byte-identical**, post-restore green: F-06.120's gate removed (56/58) · gate inverted, freeing the founding lie (51/58) · participle limb killed (57/58) · presence arm removed (57/58) · payload field dropped (57/58) · presence excluded from limb 1 (57/58) · agentive marker dropped (57/58).

**A second hollow cell caught by that floor, filed not papered.** Excluding `presenceClaim` from `existenceOnly` first came back **green** — the 21:40:34 fixture opens with *"Let me check the cabinet"*, so `narrated` fires on it too and the presence arm rode free. Only a presence claim carrying **no look verb** isolates the arm, and that is the commoner live shape. Cell added; the mutation now reds. **Second time the mutation floor has caught a cell my own eye passed — it is doing the work benches cannot.**

**Floor:** selftest **351/351** · guard **58/58** · relay 40/40 · f0681 17/17 · f0692 23/23 · **meter 28/29 KNOWN RED** carried · every other bench exit 0. Masking law re-asserted (§7.6): the four shared families untouched, zero gauntlet readers of any Stage-1 constant.

## Next

Fresh measurement batch windowed `>= ` this movement's **deploy** timestamp (the ≥ 21:11 law, now standing), the SELECT, and the gate re-rules on clean rows. **M-2 builds only behind that gate.** M-3 and R-1 continue, unaffected.
