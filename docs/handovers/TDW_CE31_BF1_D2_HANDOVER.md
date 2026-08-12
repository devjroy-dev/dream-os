# TDW · CE-31 · BF-1 · DELIVERY 2 — THE BRIDE-LANE PROVIDER FLIP, SHIPPED DARK.

**Base commit: `33732445350b6bb0c743c2f15078bcb7904bddb1` (`3373244`)** — re-derived at
this seat's own clone immediately before the first byte, and again before packaging.
`origin/main` identical. B-09H D-2 was the tip both times; no D-3 landed near me.

**Repo:** `dream-os` · **Role:** LE under CE-31, charter BF-1, relays №1 and №2.
The executor never pushes. This ZIP routes to the chair before the founder's terminal.
**The flip ships UNARMED.** `BRIDE_LLM_PROVIDER` unset ⇒ the lane is Haiku, and the OFF
state is pinned at the byte by meter bench cell 9.2, not by assertion.

---

## WHAT THIS IS

The founder ruled ARM A, 2026-08-12: the bride/circle lane moves Haiku → DeepSeek
(`deepseek-v4-flash`), **flip and revert by env var alone, no redeploy to reverse.**

Before this delivery, `brideIndex.js:81` built a raw `new Anthropic(...)` and the bride
lane never rode `src/lib/llm.js`. Pointing that client at a foreign endpoint would have
carried the lane's two ephemeral `cache_control` blocks (`brideEngine.js:235`,
`circleEngine.js:110`) straight onto it — an Anthropic-only field a strict endpoint
rejects. So the ruled shape routes the lane **through llm.js's provider table**, where
the strip and the thinking-suppression arrive by construction rather than by hand at two
sites that would drift apart.

---

## THE FIVE FILES

| file | what moved |
|---|---|
| **`src/lib/brideLlmClient.js`** | **NEW.** Provider-selected construction. OFF returns the exact byte it replaced. |
| `src/brideIndex.js` | `@@ -24,11 +24,14` (require block) · `@@ -78,7 +81,13` (the client). |
| `src/lib/coupleAiCap.js` | `@@ -157,9 +157,42` · `@@ -167,7 +200,8` · `@@ -276,7 +310,11` — the B-1 labelled amendment. |
| `tools/bench/tdw10c_couple_meter_bench.js` | §9, eight cells. **38/38**, was 30/30. |
| **`scripts/bf1_bride_tool_fidelity_bench.js`** | **NEW.** The gate. 25 cells, 15 of them write cells. Founder-run. |

**Collision check, mechanical.** `brideIndex.js` moved in exactly two places: **one line
added at 31–32** in the require block, and **line 81 replaced**. The now-dead
`@anthropic-ai/sdk` require was removed — its only consumer moved into
`brideLlmClient.js`, and an unused import on a lane whose provider is now a question is a
reader trap. B-09H D-2's hunks at `3373244` were `@@ -39`, `@@ -178`, `@@ -606`; **the
require-block hunk at 39 is adjacent to my insert.** Standing coordination rule: the
founder sequences which lands first, and the later diff re-derives at the landed tip.

---

## THE B-1 LABELLED AMENDMENT — THE LEDGER RECORDS THE WIRE

Ruled Shape 1, ratify-or-revert. Sealed 10.C hardcoded `provider: 'anthropic'` and took
`model` from `params.model` — the string the **call site** passed. True while every
metered call was Anthropic. The flip breaks that identity: `brideEngine.js:214` still
passes `MODEL_HAIKU` while the adapter sends `deepseek-v4-flash` to `api.deepseek.com`.
Left alone, the writer would have recorded `provider=anthropic, model=haiku` and **priced
it at the Haiku row while DeepSeek rupees left the account** — silent mis-pricing on the
one lane the meter exists to watch.

`recordAnthropicCall` **remains the sole writer** of the ledger's provider/model columns.
It stops transcribing a belief when a fact is on offer. `wireProviderOf`/`wireModelOf`
prefer the adapter's declaration; **absent or empty declaration takes 10.C's path byte for
byte** — which is what every raw client on the couple web lane (`api/couple/chat.js`,
`api/couple/muse.js`) and the bride lane's own OFF state do.

Radius touched: the provenance preference and its fallback. Nothing else in the wrapper.

---

## THREE THINGS THIS SEAT GOT WRONG, ON THE RECORD

**1 · The design note's claim that no bride call site passes request options was FALSE.**
`brideEngine.js:2150` — the circle-summary composer — passes `{ timeout: 8000 }`. The
first adapter *refused* second arguments by design; under the flip that would have thrown
on a live path inside a bride's turn, and a foreign endpoint with no deadline is a hang
with no symptom to grep for. **Cell 9.4 reddened on it before a byte shipped.** The
adapter now re-authors `llmCreate`'s three steps and forwards the options, so **zero bytes
move in `llm.js`** — a facade the vendor engine, the closer, harvest and the gauntlet all
ride. Cell 9.6 pins that body **at the byte** (BF/№2 ③), so the duplication cannot go
stale silently.

**2 · The kickoff's `save_booking` does not exist.** It is `add_booking`
(`brideTools.js:285`). Chair-owned as CE-31.c4. The runner benches the real name.

**3 · Two self-caught bench defects**, both logged in-comment where they happened: a
raw-client grep that reddened on the comment quoting the byte it replaced, and an
`llmCreate` statement counter that counted the signature as a statement.

---

## THE BENCH SHEET

### Meter bench — `tools/bench/tdw10c_couple_meter_bench.js` — **38/38, EXIT 0**

Cells 1.1–8.10 unchanged and green; **cell 8.10 untouched**, as ruled.

| cell | asserts |
|---|---|
| 9.1 | a declaring client writes the WIRE provider and model, not the caller's |
| 9.2 | **OFF pinned at the byte** — a non-declaring client writes 10.C's row exactly; empty/non-string declarations are *absent*, not truth |
| 9.3 | the price follows the wire — 1M input at the DeepSeek row is ₹14, the Haiku ceiling ₹100; an unknown string still over-states at ₹100 by design |
| 9.4 | the adapter is built from the env; OFF declares nothing and carries no `__unwrap` |
| 9.4b | **the timeout survives the flip** — options reach the wire, none invented where the caller passed none; wire model exact; `thinking:disabled` by construction |
| 9.5 | the two ephemeral `cache_control` blocks still stand on the ANTHROPIC path |
| 9.5b | `cache_control` **absent on the wire** for a real bride-shaped system block |
| 9.6 | `llmCreate` pinned **at the byte** against the adapter's duplicate |

**Mutation sweep — ten production edits, tree restored green after each:**

| # | edit | reddens |
|---|---|---|
| M1 | restore the hardcoded provider + caller's model | 9.1, 9.3 |
| M2 | drop the `\|\| PROVIDER_ANTHROPIC` fallback | 9.2 |
| M3 | declare a model `models.ts` has no price row for | 9.3, 9.4 |
| M4 | point `brideIndex.js` back at a raw client | 9.4 |
| M5 | drop the options forward | 9.4b |
| M6 | `cache: true` on llm.js's deepseek entry | 9.5b |
| M7 | drop llm.js's `noThink` line | 9.4b, 9.5 |
| M8 | add a fourth step to `llmCreate` | 9.6 |
| M9 | delete the ephemeral block at `brideEngine.js:235` | 9.5 |
| M10 | stop blanking the model (caller's Haiku string wins on the wire) | 9.4b |

**BF/№2 ③ verified specifically.** `M8a` reorders `llmCreate`'s last two lines —
**length 189 vs 189, statement count unchanged.** A counter shrugs; the byte pin reports
`diverged at byte 137`. `M8b` swaps `translateFor` for a hand-rolled spread → `byte 102`.
`M8c` drops a step from the adapter → caught by name. The strengthening earns itself.

### Floor — derived by grep, run bare, exit codes as second method

`tdw10c_couple_meter` **38/38** · `b09_f09173` · `b5_webhookcore` · `b05_arc_m1` · `m2` ·
`m4` · `m5` · `m6` · `b05_couple_soul` · `b05_m1b_inbound` · `b05_f0532_haiku_ceiling` ·
`tdw10_tier` 81/81 · `b08_p5_eliza` — **all EXIT 0, both trees.**

**ONE PRE-EXISTING RED, PINNED IDENTICAL BOTH TREES:** `b07_f0772_circle_auth_bench`
**158 passed / 1 failed, EXIT 1**. `§12.14` asserts `db/migrations` holds zero `0106_*`
files; `0106_demo_lifecycle.sql` exists, so the append-only ladder reddened a frozen
sitting-guard lawfully. **F-05.77**, another seat's hygiene micro. Recorded so no green of
mine is read as its cure and no red of mine is confused with it.

`npm ci` EXIT 0 · `npm run build` EXIT 0 · `node --check` clean on all five files.

---

## THE GATE — `scripts/bf1_bride_tool_fidelity_bench.js`

**FOUNDER-RUN.** This seat's egress refuses `api.deepseek.com`
(`x-deny-reason: host_not_allowed`, derived). Ruled: SQL precedent extended.

Reads **one** variable, `DEEPSEEK_API_KEY`. Never prints it. The tools are
`brideTools.js`'s own schemas, the prompt is `brideSystemPrompt.js`'s own bytes, the client
is the production adapter built exactly as Railway will build it. **The database handle is
forced to `https://bf1-bench.invalid`** — RFC 2606, contractually unresolvable — so a
provider being benched on a *write* surface cannot move a bride's row even by accident.

**25 cells:** A1–A8 the four write tools · B1–B3 `list_muse` session discrimination ·
C1–C4 the GLM failure classes under pressure (false done · fabricated entity · wrong figure
· unrequested delete) · D1–D3 the money register, including `coerceBudget`'s
`needs_confirmation` handed back as the real fixture — **the floor's question asked, never
silently accepted** · E1–E4 the wire (exact model, cache stripped, no truncation, tool
inputs are objects) · F1–F3 the ledger on a real response.

**15 write cells. Any one red = THE FLIP DOES NOT ARM.** The counter increments at failure
time, not at reporting time; this file has no softening branch to take.

**Transport is not a verdict.** The first dry run with a dead key reported
`write_red=15 · DOES NOT ARM` — a lie the founder could have acted on. It now preflights
with one cheap call and aborts as `NOT_RUN reason=transport`, spending almost nothing.

**Exit codes:** `0` whole sheet green · `1` red · `2` no key · `3` aborted.
**Machine line:** `BF1_VERDICT: GREEN|AMBER|NO_ARM|NOT_RUN write_red=N cells=P/T threw=E spend_inr=R`

**Estimated spend ≈ ₹10, ceiling ₹25 with reruns**, derived: ~12k input/call
(`brideSystemPrompt.js` 18KB + `brideTools.js` 32KB) × ~30 calls at $0.14/M in, $0.28/M
out, ₹100/USD. The runner reports its own actual spend on the last line. **Running it is
the founder's consent to it.**

---

## WHAT THIS DELIVERY DOES **NOT** DO

- **No arming.** `BRIDE_LLM_PROVIDER` unset. The lane is Haiku on apply.
- **No copy.** No vendor-facing or model-voiced byte moved. Nothing needed a veto.
- **No W-1.** Zero lines in any soul, lens, engine or prompt file.
- **No `llm.js`.** Zero bytes in the shared facade.
- **No DDL.** No migration. 0120's provider/model columns already carry this.
- **No call site.** `brideEngine.js`, `circleEngine.js` untouched.

## WHAT GATES ACCEPTANCE — D-3, the founder's acts

1. **The `.173` walk closes first.** One variable at a time through a live cure.
2. **The runner, green.** Sheet pasted whole. A red write cell ends it here and arm B is
   his call with the chair.
3. **Arm:** set `BRIDE_LLM_PROVIDER=deepseek` on `dream-os-bride`, restart. One real bride
   turn. Paste the ledger row (`provider=deepseek`, `model=deepseek-v4-flash`, price at
   DeepSeek rates) and her reply.
4. **R-29.34 BOTH DIRECTIONS:** unset the variable, restart, one Haiku turn, byte-normal
   row — walked *before* the seal, not after.
