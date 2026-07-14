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

## The routing thesis, restated with numbers
Anthropic path today: ₹0.49–9.59/turn (Donna-uncached being the spread). Block 06's
Donna cache should collapse the top end toward ~₹1–2. Cheap-provider routing remains
live for harvest now and for chat IF a future bench passes a candidate model.
