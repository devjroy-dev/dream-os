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
stays glm. Deepseek advisory bench: not yet run — same protocol when scheduled.

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
