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

---

# M-2b — THE THREE NARROW CURES (the M-2a measurement's yield)

**Base:** `dream-os @ bc9f009`. **Delta: two files** + this handover. W-1 shut; `vendorInbound.js` 0-line; **report-only — nothing arms.**

M-2a measured **2 true of 3 material**. Every fixture below is **production bytes from that batch** — the first cure set in this arc whose fixtures are all live rows rather than desk constructions.

## F-06.124 — the completion marker, bound to the claim clause

The live false positive (22:11:03): a lawful weekly briefing convicted MATERIAL because **`sorted`** sat in a closing *offer-question* — "do you want the crew situation on tonight sorted?". Isolated by removing that one word; the verdict flipped `costume → state_description`. `already` in any filler clause did the same.

**The trap the binding must not walk into:** strict same-sentence binding would **free the founding lie** — `Done. 18 December 2026 is unblocked.` puts the marker in its own sentence and the claim in the next. So a marker counts when it sits in the **same sentence as a claim**, **or** when it is the reply's **"Done."-class opener** (the short leading sentence the CE named by that name, length-bounded so a long first sentence carrying a stray marker is not one). §8.1 asserts every direction including the trap.

## F-06.125 — the deed class, symmetric both directions

Derived: `isDeedOfClass('donna_unblock_date','records')` returned **true**. The first cut guarded one way only. Live consequence, conversation `a633b2c7`: the only prior non-read hand was a `donna_unblock_date`, and it acquitted *"the note is filed"*. The claim was true; the acquittal was reached for the wrong reason. **An unblock does not witness a filing any more than a filed lead witnesses an unblock.** Both arms still find their own deeds — the symmetry must not empty either, asserted at §8.2.

## F-06.121 — the participle limb, and a §0.2 report inside the cure

The ruling said *"re-anchored past the em-dash shape."* **Derived at the desk before building: the re-anchor alone cannot reach its own named fixture.** In `Yes — Ishaan Precision Probe landed as booked, …` the participle slot after the anchor holds a **subject**, and the bytes carry **no temporal word anywhere**. Reported, then cured to the **ruled outcome** with the minimal widening the fixture demands, in three parts: the anchor accepts the dash/colon shapes after "Yes"; a bounded **subject slot** (≤4 words) may sit between anchor and participle; and a separate **linking-verb limb** (`landed as booked`, `went in as filed`) whose completion is carried by the verb rather than a temporal.

**That third part is a widening beyond the ruled wording and is named as such.** Its precision guard is exactly what the door's own witness prose lacks: `Filed — Ishaan Precision Probe, wedding photography` has the participle in position but neither a temporal nor a linking verb, so it still walks — asserted at §8.3, along with question shapes and bare participles.

## Proof

Bench **58 → 63**, one **labeled amendment** (§5.6c, count preserved): F-06.124's clause-binding reads `MUTATION_CLAIM_RE` a second time, and the old cell counted readers (`=== 1`) rather than asserting what the masking law protects. It now asserts **every consumer lives inside the guard's own body** — a stronger guard, and the correct one: a second reader in `wireGuardClassify` moves no shared meaning; a reader anywhere else does.

**Six mutations of shipped code, all RED, `cmp`-restored byte-identical:** marker unbound (62/63) · "Done."-opener dropped, freeing the lie (59/63) · opener length bound removed (62/63) · deed asymmetry restored (62/63) · date arm inverted (61/63) · linking-verb limb killed (62/63). **One mutation first reported an anchor miss and was re-run correctly rather than counted** — a mutation that did not apply is not a proof.

**Floor:** selftest **351/351** · guard **63/63** · relay 40/40 · f0681 17/17 · f0692 23/23 · **meter 28/29 KNOWN RED** carried · every other bench exit 0. Masking law re-asserted; Stage-1 constants unread by the rig.

## Next

Fresh batch windowed `>=` this movement's deploy, the SELECT, the gate re-rules. **What M-2b must earn:** the briefing walking as `state_description`, the records-class `prior_turn_witnessed` re-earned **clean** (F-06.121's contaminated proof was vacated), and the "landed as booked" turn drawing its row. **M-2 builds only behind that gate.** M-3 and R-1 unaffected.

---

# M-2c — F-06.126, THE READ-BACKED REPORT

**Base:** `dream-os @ f4e3f20`. **Delta: two files** + this handover. W-1 shut; `vendorInbound.js` 0-line; **report-only — nothing arms.**

**Standing riders CONFIRMED SHIPPED, not re-claimed:** F-06.119's cell landed in M-2a (§7.0, present at origin) and F-06.123's verdict persistence landed with it — proven live, since the M-2b rows carry populated `deed_class`, `mode` and `prior_deed`. Neither rides here.

## The cure

M-2b's single material conviction (22:34:44) was **true and read-backed**: *"Already there. The Rs 1,50,000 quoted figure … is filed and affirmed from you."* — two read hands, zero writes, the claim correct. Limb 1's rule that a read hand must not rescue an act claim is right for the **agentive** shape (*"I've filed it"* — a read proves nothing about a write) and wrong for the **stative** one (*"it is already filed"* — a report of pre-existing state, corroborated by exactly the reads §2.1 s3 demands).

**Provenance, recorded honestly:** F-06.125's cure *caused* that conviction, by correctly refusing an acquittal a calendar deed had no business granting. A cure exposing a missing mechanism is not a cure breaking.

**The agentive line, pinned as ruled.** `Done.` counts **agentive** — it is a compressed first-person act claim, F-04.51's own signature — so the F-06.114 bytes convict with or without incidental reads. The `already` family is **not** agentive on its own: it is the commonest honest marker of *"I did not do this now"*, and its fabrication half is discriminated by the **census** (zero hands), not by the word.

**The honest limit, in-file:** this walk is **presence-of-read, not content-corroboration**. The ladder does not read the hand's result and cannot know the report matches it. Truth adjudication stays CARD ONE's and the per-mouth arms' one home (F-04.36), deliberately not duplicated in the guard.

**The pinned exposure, its own labeled cell (§9.3):** a non-agentive state report riding an *unrelated* read walks. That is the class's boundary, shipped named so the next measurement measures it rather than a reader discovering it.

**STANDING LAW, in-file and benched (§9.4):** Stage 2, whenever it arms, intercepts **`costume` alone**. Every walk class the ladder learns earns interception-exemption **by measurement, never by construction**. All six walk classes asserted non-specimen.

## Proof

Bench **63 → 69**, one **labeled amendment** (§5.9, count preserved). That cell grepped the guard's whole body — comments included — for Stage 2 vocabulary, and the word *"intercepts"* inside the sentence stating the CE's standing law tripped a cell whose subject is **mechanism, not prose**. Writing the law down is the opposite of shipping it. Now executable lines only (§5.8c's precedent in this same file), **plus a new stricter arm**: the vetoed Stage 2 strings must be absent from the file entirely, comments included.

**Five mutations of shipped code, all RED, `cmp`-restored byte-identical:** read-backed class removed (65/69) · agentive line dropped, freeing the lie (65/69) · read requirement dropped (63/69) · `Done.`-opener no longer agentive (65/69) · a walk class marked specimen (67/69). **One mutation first reported an anchor miss and was re-run correctly rather than counted.**

**Floor:** selftest **351/351** · guard **69/69** · relay 40/40 · f0681 17/17 · f0692 23/23 · **meter 28/29 KNOWN RED** carried · every other bench exit 0.

## Next

Fresh batch windowed `>=` this seal, **terminal transcript beside the SELECT** per the new measurement-read law, Blocks 4 and 5 pinned to the classes they exercise. What M-2c must earn: 22:34:44's shape walking as `read_backed_report`, and the still-unproven `state_description` and linking-verb cells finally firing.

---

# M-2d — THE CAPTION RULE · THE BOOKING DEED CLASS · THE STATIVE COMPLETION

**Base:** `dream-os @ e4573bc`. **Delta: two files** + this handover. W-1 shut; `vendorInbound.js` 0-line; **report-only — nothing arms.**

## F-06.127 — the caption rule, drawn on structure

The third door of F-06.120's class: the 22:53:58 rundown convicted on **`**Already blocked:**`**, a markdown heading. F-06.124's binding was satisfied *correctly* — the marker and the participle sit inside one two-word fragment. The cure was not wrong; its **subject** was.

Boundary as ruled: a fragment leaves eligibility **only when it is a CAPTION** — a markup-labeled line that *introduces following content*, in which case the content beneath it is what the ladder reads. A standalone label-colon line **remains eligible**: that is F-04.71's costume #1. Terse sentences untouched.

**One disclosed refinement (§0.2).** The ruling names "list bullet" among the markup forms, but a bullet's content sits *on* the line, and exempting bullets would make the **last** bullet of a list arbitrarily eligible while its identical siblings were not — a hole of exactly the kind the deaf-cure test forbids. So bullets have their **marker stripped** and stay eligible.

## F-06.128 — the booking deed class

The 22:55:12 row class-matched a **booking** claim to `records`, so Fork A′ hunted a records deed while the real `donna_book_event` sat one class away. Third class added; class-match granularity now follows the **hand taxonomy**. F-06.125's symmetry extended, not patched.

## F-06.126's recall gap — and a §0.2 report on its siting

The ruling reads *"COMPLETED_ACT_RE gains the stative shapes."* **`COMPLETED_ACT_RE` is one of the SHARED FOUR** — `b06_gauntlet.js` requires it at `:190` and consumes it at `:1609` — so widening it moves what the **rig's arms** convict (the masking law, NOTE_12 §9). The estate ruled this exact shape once before and answered it the same way: **F-06.104 minted a separate Stage-1-scoped constant rather than widening the four.** So the ruled *outcome* ships as `STATIVE_COMPLETION_RE`, sited on that precedent. Reported, not adapted silently. §10.6 asserts the four are untouched.

## TWO DEFECTS OF MY OWN, both caught by the chair's fixtures

**(a) The deaf-cure fixture worked exactly as designed.** On this movement's first build, fixture (ii) — `Cancelled: 18 December`, standalone, zero hands, **F-04.71's founding costume** — **walked** as `state_description`. The caption rule was innocent; **F-06.120's marker gate** freed it, finding no agentive subject and no completion word in a line whose completion is carried by its **form**. A bare participle + colon *is* `mutationLines`' own door-line format — the shape the estate ships when a deed is real — so wearing it **is** the completion claim. Cured with `DOORLINE_CLAIM_RE` (MUTATION_CLAIM_RE's colon limb, byte-identical, made addressable).

**(b) A structural mismatch in my own build, caught by fixtures (ii) and the bullet cell.** The claim-family gate ran on the **raw** reply while caption-exclusion and bullet-stripping happened later, per-sentence. So a costume delivered inside a bullet, or wearing bold, **never reached the ladder at all** — `MUTATION_CLAIM_RE`'s colon limb anchors on whitespace, and markup is not whitespace. Cured by computing the **eligible text once** and reading every family, marker and class test from it: **17 family tests re-pointed.**

## Proof

Bench **69 → 75**, two labeled amendments (both count-preserved): §5.9 now asserts the **mechanism** (no assignment to `result.reply`, no replacement payload) rather than word-grepping, because `x.replace(BULLET_RE, '')` is bullet-stripping, not interception; and two §10 cells allow `null`, because the ladder correctly draws **no row** for a captioned rundown and for an honest headed reply — stronger than walking.

**Seven mutations of shipped code, all RED, `cmp`-restored byte-identical:** caption rule removed (74/75) · caption ignores "introduces content" (74/75) · bullets exempted instead of stripped (74/75) · **doorline neutered — deaf to F-04.71 (73/75)** · booking class coerced to records (74/75) · stative completion removed (74/75) · eligible text reverted to raw reply (74/75). **Three mutations reported anchor misses and were re-run correctly rather than counted.**

**Floor:** selftest **351/351** · guard **75/75** · relay 40/40 · f0681 17/17 · f0692 23/23 · **meter 28/29 KNOWN RED** · every other bench exit 0.

## Next — the convergence bar

The gate opens on a batch with **zero false positives AND every known class exercised at least once**: `state_description` live on its own shape · `read_backed_report` fired · the booking walk · the caption/doorline pair. Precision without coverage is the hollow number. Next batch seats on chair-minted virgin fixtures **Oorja Gate Probe** and **Sameer Marker Test**, SQL pre-flighted both planes; `Ishaan Precision Probe` is **burned**.

---

# M-2 — STAGE 2, THE INTERCEPTION (the gate opened)

**Base:** `dream-os @ 868cdb5`. **Delta: five files** — `chat.js` · `vendorInbound.js` · three benches. W-1 shut; zero soul bytes.

**SCOPE DECLARED: this ZIP is M-2's ENGINE HALF ALONE. M-3 (the pwa pair) and R-1 (the rig micro) DO NOT SHIP HERE** — see §Declared gap below. Nothing is silently dropped.

## The three arming conditions, encoded rather than remembered

1. **`costume` ALONE.** The predicate is `verdict.specimen`, which is `kind === 'costume'` at its one home — never a class list that could drift. All nine walk classes asserted exempt (§11.1).
2. **The first week IS measurement.** Every interception still logs its specimen, and `stage2_delivered` carries the line the vendor actually received, so the weekly read sees what he saw (§11.4).
3. **One false interception is a STOP.** `WIRE_GUARD_STAGE2=off` disarms at **call time** — one Railway variable and a redeploy, no code change, no ZIP (§11.3).

## The copy, byte-exact as vetoed 「 accept all 5 recomendations 」

V-M (mutation class) · V-L (lookup class, no "try again" — retrying a fabricated read buys nothing) · V-W (`reply REPORT to flag this turn`, WA leg only). A mixed costume takes V-M, the higher-harm instruction. One home each (§11.2, §5.9b).

## The seats

**WA** (`vendorInbound.js`) — full interception before `sendWhatsApp`. **PWA JSON** — interception before the reply is assembled. **PWA SSE** — replace-at-done, the additive `intercept` payload on the `done` event; the transient glimpse was put to the founder and accepted.

## Fork D — retry-the-actor, as ratified

Armed on the WA seat only, on `costume` (⇒ zero write hands ⇒ nothing to duplicate — the intercept's own predicate is the safety proof). **Structural bound**: `_noRetry` threaded through the wrapper into the body, no counter. Three outcomes: the retry lands the act → its reply ships through the same firewall, the first turn's specimen still logged · the retry is a costume again → **F3's verbatim bytes**, no second costume ever ships · the retry throws → fail-open to the glitch line, never worse than no retry.

## Two defects of my own, filed

**(a) A live `ReferenceError`.** `_noRetry` first landed on the wrapper while the body that reads it had no such parameter. Caught at the desk before packaging; threaded correctly and benched (§11.6 asserts the declaration).

**(b) MY NEW CODE MASKED TWO SEALED BENCHES, and only the floor found it.** `b06_m3_bench §4.4` counts firewall sites in `vendorInbound.js` and found **11 where its ledger held 10** — the retry leg's own `scrubText(retry.reply)`, which is *correct* (a retried reply must cross the persona firewall) and simply unaccounted. Worse, `b05_f0550 §5.1` mutates away the door's `leadPings` reader and expects RED — **it went GREEN**, because the retry call passes `leadPings` too and satisfied the assertion after the primary was removed. **A cell built to detect a disease was masked by my own addition.** Both amended by label, counts preserved: the m3 ledger accounts the 11th site; the f0550 mutation now removes the identifier at **both** readers, which is what "the door stops handing it over" always meant.

## Proof

Bench **75 → 83**, with labeled amendments to every cell superseded by the gate opening (§5.8c/d, §5.9/b, §7.7, §8.5, §9.6, §10.6) — each preserving its surviving subject: **the CLASSIFIER stays pure**, copy and interception live at the Stage 2 block and the seats, never in the ladder.

**Six mutations across both shipped files, all RED, `cmp`-restored byte-identical:** costume-alone gate removed · disarm tripwire removed · V-L collapsed into V-M · WA report affordance dropped · Fork D's bound removed · WA interception disabled. **The last one first came back GREEN** — an order-check matched `if (false) replyText = s2line;` — cell strengthened to assert the statement itself, then RED.

**Floor:** selftest **351/351** · guard **83/83** · relay 40/40 · m3 37 · f0550 31 · f0681 17 · f0692 23 · wa_words 19 · **meter 28/29 KNOWN RED** · every other bench exit 0.

## DECLARED GAP — M-3 and R-1 do not ship in this ZIP

The chair released M-2 + M-3 + R-1 as a paired landing. **This delivery carries M-2's engine half only.** The SSE backend payload is here; **the pwa client half (the `intercept` field on `StreamDonePayload`, the done-branch forward, the `useChat` replacement expression, the Report chip) and the `glitch-report` route + `matchGlitchWord` are NOT built**, and neither is R-1.

**Consequence, stated plainly so it is not discovered:** the WA seat and the PWA JSON route intercept fully and are safe to run. **The SSE route emits `done.intercept` that no client reads yet — the costume streams and is not replaced there.** That is a *smaller* coverage than the ruling describes, never a wrong behaviour, and it is why this is declared rather than absorbed. `WIRE_GUARD_STAGE2=off` disarms everything if the founder prefers to wait for the pair.
