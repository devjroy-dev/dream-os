# TDW_10.C · DELIVERY 2 — F-10.117 CURED · THE RECORD CORRECTED · THE BYTES DRAFTED

**Repo:** `dream-os` · **base:** `850973e` (re-derived fetch-first; movement above `edaf696` proven docs-only — one commit, `docs/` only)
**Role:** LE. The executor never pushes.
**Still refuses nothing.** The gate is delivery 3.

---

## 1 · THE DELIVERY-1 RECORD CORRECTION — the four-file declaration

Delivery 1's handover declared **two** byte-untouched files. It should have declared **four**. Six of the ten metered sites lived behind an explanation given for four of them, and the chair found the gap from the diff-against-scope read alone. The design was right; the record was not.

**Byte-untouched at delivery 1, and metered anyway, by construction:**

| file | why it did not move |
|---|---|
| `src/agent/circleEngine.js` | receives the wrapped client from its door |
| `src/lib/museSave.js` | passes the wrapped client through to the pipeline |
| `src/agent/brideOnboarding.js` | receives a `withKind`-re-scoped client from `brideEngine.js:93` |
| `src/lib/groundedSearch.js` | shared machinery with **no couple context** — metering inside it would write couple rows for callers that are not the couple lane. The row is taken at the caller that *has* the context. |

**The chain, file:line at `edaf696`, verbatim as relayed:**

| ruled site | wrap point (in a file that DID move) | consuming site (unmoved) |
|---|---|---|
| circle turn | `src/brideIndex.js:712` mints + wraps → `:732` `anthropic: circleMeterAnthropic` | `circleEngine.js:102` |
| onboarding ×5 | `src/agent/brideEngine.js:93` `anthropic: withKind(anthropic, 'onboarding')` | `brideOnboarding.js:123 · :190 · :254 · :289 · :365` |
| Gemini search | — | the row is written at the caller: `src/agent/brideEngine.js:2308` `recordGeminiSearch({…})` |

The one writer is `src/lib/coupleAiCap.js:137`.

**The principle, and its honest bound.** Injection-at-the-door beats ten call-site edits: the walk's second onboarding row was a site *no census enumerated*, metered anyway, because the wrapper owns the client rather than a list. But it is census-proof **only for the subtree beneath a door**. Seven modules in the estate construct their own Anthropic client (`src/brideIndex.js:80` among them, benignly — it builds the client and hands it *into* the doors). A future couple-lane module that constructs one and calls it directly would spend and write nothing, and no cell would notice. Known edge, no guard, not in scope.

---

## 2 · F-10.117 — `0121`, and the finding's own origin

Two nullable integer columns (`cache_read_tokens`, `cache_write_tokens`) plus two lines in `recordAnthropicCall`. Names copied from `engine.usage` cols 11–12 deliberately, not re-coined.

**Found by pricing a live row, not by a bench.** The first row the meter ever wrote stored ₹1.66 against 707 in / 54 out — which price to ₹0.10. The stored number was **correct**; the ~₹1.56 was a cache write (~12.5k tokens) priming Mira's ephemeral prefix. `calcCostInr` received those tokens and priced them; the ledger discarded them. Spend was never wrong — **reproducibility** was, and cache-hit economics were invisible on a lane whose static prefix is cached.

**No backfill is possible and the gap is stated in-migration**, per `0116`'s own precedent. NULL therefore means two things on this column — *unknown* before `0121`, *genuine zero* after — and the discriminator is `created_at`. That sentence is carried into the database itself via `COMMENT ON COLUMN` so no future reader has to find the file.

**`0120`'s verify had a defect of its own, fixed here.** It shipped as five separate SELECTs; the Supabase editor renders only the last, so four of five assertions were invisible to the founder running them. Self-caught from his screenshot. Every verify from `0121` forward returns **one result set**.

---

## 3 · ⚠ §0.2 REPORT — THE §6.4 AMENDMENT COULD NOT EXECUTE AS WORDED

CE-31 relay №2 §2 chartered the `tdw10_combined_cap` amendment as **「 0119→0120 tip cell 」**. Aiming it at `0120` would have shipped a bench **red on arrival**: this same ZIP carries `0121`, so `0120` is not the tail the moment the delivery applies.

**The cell is aimed at `0121`, and the departure is declared in the artefact itself**, not absorbed silently — the comment block names the ruling, the reason it could not execute, and where to reverse it if the chair intended `0120` for a reason this seat cannot see.

**Count preserved at 37. Teeth kept whole:** `0116`, `0117`, `0118`, `0119` and now `0120` all still asserted present; `0113` still asserted an unwritten hole; the attributed `0063` duplicate fence untouched.

---

## 4 · PROOF

**`tdw10c_couple_meter_bench` → 20/20** on the applied tree (18 + the two new cells).

| mutation (production code) | effect |
|---|---|
| delete the two cache lines in `recordAnthropicCall` | 20 → **19** |
| copy the cache lines into `recordVisionCall` | 20 → **19** |
| *(delivery 1's five mutations re-run)* | all still bite |

**§6.4 proven both ways** by a standalone harness — the full `tdw10_combined_cap` requires `npm ci` (it loads `chat.js` → `express`) and **was not runnable in this container; declared, not claimed**:

```
UNCURED (0121 absent)      RED  → 0121 is not the tail: 0118, 0119, 0120
CURED   (0121 applied)     GREEN
MUTATION (0113 hole filled) RED  → LD-8 violation caught, teeth intact
```

`node --check` clean on all three touched `.js`.

---

## 5 · WHAT DELIVERY 3 INHERITS

- **The gate**, unbuilt: `COUNT(DISTINCT turn_id) WHERE kind='turn'`, IST day + month, both enforced, dial resolved off `couples.tier` (every row `basic`). Fail-**open**; `0` is a DENY (F-10.85).
- **Siting**: the shared module; the fan-out gated as a **batch** before `brideEngine.js:1935`, never per call.
- **The doors**: eight surfaces in the census — each needs a refusal path or a declared exemption, so a capped couple spends nothing behind any of them.
- **The image-door fork**, chair's lean recorded, ruled at D3: the **save survives** a capped couple; the cap refuses the spend, not her memory.
- **R-29.34 both members**: witnessed on a real capped turn — dial to `0`, walk, restore.
- **CE-209's bride integration walk** binds the final acceptance.
- **Walk leg 3** (the image pair) — ruled UNREACHABLE-FROM-LANE on Meta (F-09.173); one PWA upload through `couple/muse.js` closes it and it gates D3's acceptance, not this one.

**Not this sitting's:** F-09.171/.172/.173/.174 are homed to row 09's bride sitting as one cluster, with the two unnumbered derivation duties (the double-persisted summary at `:2005`/`:623`; the `:189` dedupe double-hand) named in its read-first. F-10.116 stays parked beside Platinum.
