# UNIT_ECONOMICS.md — TDW_02 P5 measured baselines (2026-07-14, HEAD 24ab3a4)

All figures from engine.usage on production, CE-22 headers on every source run.
calcCostInr NOTE: unknown models are priced at HAIKU rates (deliberate-conservative;
never invent a price) — every glm cost_inr below is OVER-stated.

| datapoint | model | input_tokens | cost_inr | reading |
|---|---|---|---|---|
| Full dispatch turn, Donna working | haiku | 48,617 | 9.59 | THE fire alarm: Victor's prefix is cached (his calls bill small); Donna is entirely UNCACHED — her system + ~20 tool schemas + segments bill full-rate 2–6×/turn. Block 06 ("Donna lens + cache + tier×role") owns the fix; this is its price tag. |
| Snapshot-answered turn, no dispatch | haiku | 582 | 0.49 | The cheap path exists and works — Victor's cache signature (582 billed vs ~40k prefix). |
| GLM chat turn (advisory) | glm-4.7-flash | 30,272 | 3.05* | cache_control stripped on non-anthropic (z law): the FULL prompt bills every turn. *Haiku-priced; real glm cost is far lower. |
| GLM harvest runs | glm-4.7-flash | ~2–3k/run | — | Harvest's lane: small prompts, strict JSON, proven in prod (harvest_patch rows 15:06/15:10 on the GLM route). |

## Bench verdict (acceptance 6, live, 2026-07-14)
glm-4.7-flash: **FAILED advisory tool-turns** — false dones (C2 jot / C3 event: confident
"done" with tool_calls:[]), fabricated-entity write (C4: "Nena Bansal" lead created from
the model's own hallucination). **PROVEN for harvest** (extraction lane). Ruling applied:
trial routes anthropic (admin_config flipped + DEFAULTS in modelRouter.js); model.harvest.default
stays glm.
> **CORRECTED at TDW_06 economics sitting (2026-07-18):** two lines above went stale
> and are cured in place per the corrections convention. (1) "Deepseek advisory bench:
> not yet run" — DeepSeek has since PASSED the P7 dispatch-fidelity probe 7/7 (LD-7,
> TDW_05) and now faces the full trap gauntlet, `scripts/b06_gauntlet.js` (founder-run;
> verdicts below when his output lands). (2) "model.harvest.default stays glm" — GLM
> was RETIRED by F11 (TDW_05, the z-key incident); harvest routes
> **deepseek/deepseek-v4-flash** via admin_config today (LD-7's config truth; the
> DEFAULTS seed row in modelRouter.js still reads glm — DEFAULTS are 0073's seeds by
> invariant, config governs, stated not changed).

## Proof E (GLM implicit-cache probe): NOT RUN — descoped as moot
Its purpose was GLM *chat-route* economics; the bench removed GLM from chat. Harvest
prompts are too small for prefix caching to matter. Executor judgment, submitted for
CE ratification in the P5 handover.

## 02-HOTFIX correction (2026-07-15) — read the ledger with cache eyes
The 2026-07-14 field report's "stripped ~900-token calls / broken cost math / 582
signature gone" were all one artifact: engine.usage had no cache columns, so a
cold-cache turn's ~32.5k prefix WRITE (billed 1.25× ≈ ₹4.06) hid behind a tiny
fresh-input figure, and warm READS (0.1×) hid behind the ₹0.48–0.49 rows. The 582
signature is alive (15:10 = 582/₹0.49; 16:15 = 1,444/₹0.49 — fresh tail grown by
P4's activity block). The 24–35k rows are the documented Donna-uncached dispatch
spread, not a regression. Post-DDL, engine.usage carries cache_read_tokens /
cache_write_tokens and cost decomposes exactly; until the DDL runs, the residual
formula stands: unexplained ₹ ≈ cost − (in×₹0.0001) − (out×₹0.0005); ≈4.06 = one
cold prefix write, ≈0.32 = one warm read. The 24h trial-flip glance reads these
columns, not fresh-input alone.

## The routing thesis, restated with numbers
Anthropic path today: ₹0.49–9.59/turn (Donna-uncached being the spread). Block 06's
Donna cache should collapse the top end toward ~₹1–2. Cheap-provider routing remains
live for harvest now and for chat IF a future bench passes a candidate model.

---

# TDW_06 ECONOMICS SITTING (2026-07-18) — the meter fixed, Donna cached, the gauntlet built

## 1 · THE METER FIX (F-04.84, twice-convicted, cured)
Where usage rows were written, diagnosed at the code: `loop.ts:582` writes one
engine.usage row per TURN (provider-agnostic — the transport seam bills whatever
model ran; Donna's buckets fold in via the 02-HOTFIX seam). The BLIND LANE was
**harvest**: `callHarvestModel` routed config-live through the facade (GLM then,
DeepSeek now) and **discarded resp.usage — zero rows**, exactly where the cheap
providers live. Cured: both legs (the routed call AND the rule-6 forceHaiku retry)
now write per-CALL engine.usage rows — model = the RAW routed string,
`conversation_id` **NULL** (harvest is spend, never a turn), cost via calcCostInr
(Haiku-ceiling on unknown models, unchanged law), best-effort (a failed ledger
write never costs the vendor his patches). The turn-count caps gained
`conversation_id IS NOT NULL` so harvest rows never eat chat turns; the SPEND caps
deliberately count them — harvest cost is real money. **Backfilled: NOTHING. The
pre-fix gap is the gap; rows exist only from this deploy forward, and every
DeepSeek-harvest figure before it is unmetered and stated so.**
Bench: `scripts/b06_meter_bench.js` (27/27; fails 16/27 at the uncured tree on
exactly the cure).

## 2 · THE DONNA CACHE (the ₹9.59 fire alarm's cure)
The measured BEFORE stands in the table above: **48,617 in / ₹9.59** on a full
dispatch turn — Donna entirely uncached, her system + ~20 tool schemas + segments
billed full-rate 2–6×/turn. The loop.ts comment claiming her prompt was "~1.1k
tokens, below the 2048 cache floor" was **stale by an order of magnitude**:
measured at this desk, her static prefix (soul 7,843 chars + cabinet/working prose
~2.4k + DONNA_TOOLS JSON ~30,471 chars) ≈ **~10k tokens estimated** (chars/4 —
an estimate, stated as one). Cured in `donna.ts`: the static prefix carries
`cache_control: ephemeral`; the today line + owner scratchpad moved to an uncached
dynamic tail (the ONE disclosed prompt reorder — cache-stable prefixes are never
touched by dynamic content; every pre-cure sentence survives byte-for-byte,
benched). Tools ride the cached prefix automatically. On DeepSeek her hand is
untouched — the facade's z-law strip removes the marker (benched through the REAL
translateFor).

**PROJECTION (chars/4 estimate — the measured AFTER is the founder's run, below):**
a 4-call Donna turn billed the prefix at 4×P uncached; cached it bills
1.25P + 3×0.1P = **1.55P** (cold window) or **0.4P** (warm) — a 61–90% cut on the
prefix component, which is the ₹9.59 turn's whole top end. Expected: the dispatch
spread collapses toward the ~₹1–2 the thesis named.

**AFTER — founder-run measurement (slot open until his paste):** read-only, run a
few dispatch-heavy turns post-deploy, then:
```sql
-- BEFORE/AFTER comparison — engine.usage, witnessed columns only (read-only)
SELECT created_at, model, input_tokens, output_tokens,
       cache_read_tokens, cache_write_tokens, cost_inr
FROM engine.usage
WHERE conversation_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;
```
```sql
-- The harvest lane's first metered rows ever (expect model = the routed string,
-- conversation_id NULL; before this deploy this count is 0 — the documented gap)
SELECT count(*) AS harvest_rows, coalesce(sum(cost_inr), 0) AS harvest_inr
FROM engine.usage
WHERE conversation_id IS NULL;
```

## 3 · THE TIER × ROLE MATRIX (config truth today + the gauntlet's flip candidates)
| tier | Victor (dispatch lane) | Donna (tool hand) | source |
|---|---|---|---|
| trial | anthropic/haiku | follows Victor | DEFAULTS + bench ruling 07-14 |
| essential | deepseek/deepseek-v4-flash | follows Victor (deepseek) | 0073 seed |
| signature | anthropic/haiku | **deepseek** (the LD-7 split) | admin_config, TDW_05 |
| prestige | anthropic/haiku | follows Victor | DEFAULTS (escalation_model entry REMOVED this sitting — dormant, founder-ruled NO Sonnet) |
| harvest | — | deepseek/deepseek-v4-flash | admin_config (F11 retired glm) |

Flips ship ONLY as CE-gated admin_config proposals printed by the gauntlet itself,
per role per tier, conditioned on lane verdicts, both directions (the GLM precedent:
a failed candidate reverts its standing routes). NO Sonnet anywhere by the founder's
ruling; the live Sonnet paths found this sitting (prestige starts mid→top;
signature's escalate ladder) are FILED as **F-04.85** with cure shapes — a
founder/CE ruling question, deliberately not cured unilaterally.

## 4 · THE PRICING QUESTION (open; blocks nothing)
calcCostInr prices unknown models at HAIKU rates — every ₹ figure on
deepseek/glm rows is a deliberate OVER-statement (marked ₹* in the gauntlet).
Wanted from the founder: the real per-million rates he pays for
**deepseek-v4-flash** (and glm-4.7-flash if it ever returns), and the models.ts
PRICING table gains one honest line each on his numbers. Until then the ceiling
law stands and every comparison in this doc reads conservative-against-DeepSeek.


## 5 · THE FIRST LIVE GAUNTLET RUN (2026-07-18, founder-run) — the cache MEASURED, the lanes read
**THE DONNA CACHE, WITNESSED:** L1 S1 (cold window) `in=2065 cw=17998 cr=17998` → **₹2.78**;
warm turns `cr=35996 cw=0` → **₹0.74–0.80** — against the ₹9.59-class BEFORE row above.
The thesis line ("collapse toward ~₹1–2") is now a measured shape. (Gauntlet turns are
leaner than production dispatch turns — no handbook/activity blocks under the desk double
— so production's AFTER SQL remains the final figure; slot still open.)
**LANE VERDICTS:** L1 = the real datum (S1–S2c, S4 pass; **S3 FAIL — the incumbent never
dispatched on "Unblock 18 December.", the F-04.71 class on Haiku itself**). L2/L3 = **VOID**
— L2 died on F-04.86 (a live production bug: post-downgrade the foreign model string hit
the native Anthropic client, 404), L3's PASS was Haiku answering behind console-only
downgrades (F-04.87). Both cured in ZIP E3; both flip proposals VOID; **no DeepSeek verdict
exists yet, either role** — the v2 gauntlet's preflight probe diagnoses the dead wire
before any lane spends a turn. The re-run is the founder's, at leisure.
**Run 2 (v2 gauntlet, founder-run):** preflight caught the rig's own poisoned facade in one
line (F-RIG-1, cured v3 — DeepSeek was never contacted in either run; the founder's raw curl
proved the wire/key/model alive: HTTP 200, valid anthropic JSON). L1 ran 6/6 — **S3 PASSED
this run on the identical fixed message that FAILED run 1: the incumbent is INTERMITTENT on
the sharpened unblock trigger, 1-for-2** — F-04.71's own texture, now measured. Cache again:
cold ₹2.79, warm ₹0.61–0.85. The first TRUE DeepSeek turns are run 3's.

## 6 · RUN 3 — THE FIRST TRUE DEEPSEEK VERDICTS (2026-07-18, founder-run; the ruling's evidence)
| lane | verdict | total | the reading |
|---|---|---|---|
| L1 incumbent (Haiku/Haiku) | PASS 6/6 | ₹5.92 | Control clean; cold ₹2.80 → warm ₹0.62–0.79 (the cache standing). |
| L2 DeepSeek-VICTOR | **TRUE FAIL** | ₹*6.39 | **S2c = the LD-2 interrogation regression, verbatim, on DeepSeek's dispatch judgment.** S1 = a name-fidelity drop (dispatch truncated "One"; row likely under the wrong name). His prose runs long; in=17.6k on S1 = the no-cache non-anthropic reality. |
| L3 DeepSeek-DONNA split | FAIL — **not hers** | ₹*3.46 | **Her hand 4-for-4** incl. draft-on-first-mention (the thing L2's Victor failed). The lane's one fail (S3) was HAIKU-Victor's clarify — zero dispatch, the trap's one-directional design. |

Haiku-Victor on the sharpened unblock imperative across all runs: **2-for-4, intermittent** —
F-04.71's texture quantified (Manual/doctrine material, not a flip matter). Ruling frame filed
in the log: essential's reverse is evidence-backed (plain revert, or the L3 split shape which
this run favours); **the signature split STANDS — the printed drop SQL must not run**;
trial/prestige split extensions presentable on the attribution reading. The split lane at the
Haiku CEILING already undercuts the incumbent's real ₹5.92 — the founder's real per-M DeepSeek
price turns ₹* into truth.

## 7 · CE RULINGS E-1..E-3 (2026-07-18, relayed via the founder; executed ZIP E6)
**E-1:** essential → **the L3 split** (Victor anthropic-haiku cached + Donna deepseek), conditional
on the recorded DeepSeek-Donna verdict reading PASS — the record holds lane-FAIL beside per-hand
4-for-4 PASS; the executor read the condition against the per-hand verdict and FLAGGED the
resolution (log entry); both SQL directions handed. **E-2:** signature split STANDS, nothing run.
**E-3:** **F-04.85 CLOSED** — every tier starts Haiku (cached) at the ladder's one home; the
escalate tool never boards (removal over retargeting: escalation is a full clean re-run, so
retarget = double cost for zero model change); the handler survives as a Haiku-retargeting
tombstone. **Zero Sonnet reachable from any tier — b06_sonnet_bench 13/13, fails 7/13 pre-cure.**
Tier matrix post-E6 (pending the founder's E-1 SQL run): trial anthropic/haiku · essential
**anthropic-haiku + donna-deepseek split** · signature anthropic-haiku + donna-deepseek (LD-7) ·
prestige anthropic-haiku (starts haiku, no escalate) · harvest deepseek. Sonnet: unreachable.
