# SPEC-1.5 — LLM Facade + Tier-Based Model Routing (DeepSeek/GLM Flip)
**Product:** dream-os — all engines, PWA first
**Repos touched:** `devjroy-dev/dream-os`, `dreamos-pwa` (admin Config page)
**Pattern source:** `devroy-dev/z` → `src/llm.ts` + `src/models.ts` (ported, adapted per-tier)
**Feeds:** SPEC-1 (harvest extractor), AI-caps enforcement, unit economics
**Author:** Chief Engineer session, 2026-07-14

---

## 1. Doctrine

The model tier IS the product tier (z doctrine). One facade owns every LLM call in dream-os; nothing else ever constructs an Anthropic client or hardcodes a model string. Provider flip is a config change, never a deploy.

## 2. The z pattern, and the one structural change

z's trick: GLM (z.ai) and DeepSeek expose **Anthropic-Messages-compatible endpoints** — same SDK, swap `baseURL` + key. No schema translation.

| Provider | baseURL | Key env | Default model |
|---|---|---|---|
| anthropic | (SDK default) | `ANTHROPIC_API_KEY` | per-surface |
| glm | `https://api.z.ai/api/anthropic` | `ZAI_API_KEY` | `glm-4.7-flash` |
| deepseek | `https://api.deepseek.com/anthropic` | `DEEPSEEK_API_KEY` | `deepseek-v4-flash` |

z's switch is process-global (`LLM_PROVIDER` + runtime override). TDW needs **per-tier, per-surface** resolution. So: the facade takes `{provider, model}` per call; resolution happens in a router that reads `admin_config`. `LLM_PROVIDER` env survives as the global emergency override (outranks everything, exactly like z's force switch).

## 3. New files (dream-os)

### `src/lib/llm.js` — the facade (port of z `llm.ts`)
- `callLLM({ provider, model, system, messages, tools, max_tokens, stream })`
- Client cache per provider (baseURL + key from env).
- Translations on non-anthropic providers (verbatim from z):
  - strip `cache_control` blocks
  - strip `web_search` tools unless provider capability probe allows
  - suppress/ignore thinking blocks from providers that emit them
- Throws typed errors: `LLMAuthError`, `LLMToolFidelityError` (malformed tool_use), `LLMProviderDown`.

### `src/lib/models.js` — registry + cost meter (port of z `models.ts`)
- `MODELS` map with `usdInPerM/usdOutPerM` per model incl. glm/deepseek rates; `USD_TO_INR = 100` (Dream Engine convention).
- `calcCostInr(model, usage)` + `usageFromApi(u)`.
- Every engine turn logs `{model, provider, usage, inr}` to `vendor_activity_log` (vendor surfaces) — `kind='llm_cost'`. Bride-side cost logging deferred to the bride block.

### `src/lib/modelRouter.js` — the tier brain
```js
resolveModel(surface, tier) -> { provider, model, escalation?: { provider, model } }
```
- Reads `admin_config` (cached in-process 60s; admin edits land within a minute).
- `surface` ∈ `pwa_vendor | wa_vendor | wa_bride | circle | harvest`.
- Order of precedence: `LLM_PROVIDER` env force → admin_config row → hardcoded default map.

## 4. Config — extend `admin_config`

Existing table already keyed per tier per surface (28 rows, AI caps). Add rows (or a `model_config` key namespace within it — executor picks whichever matches the current row shape; do NOT create a new table):

| surface | tier | provider | model | escalation_model |
|---|---|---|---|---|
| pwa_vendor | trial | glm | glm-4.7-flash | — |
| pwa_vendor | essential | deepseek | deepseek-v4-flash | — |
| pwa_vendor | signature | anthropic | claude-haiku-4-5-20251001 | — |
| pwa_vendor | prestige | anthropic | claude-haiku-4-5-20251001 | claude-sonnet-4-6 |
| harvest | * | glm | glm-4.7-flash | — |
| wa_vendor / wa_bride / circle | * | anthropic | claude-haiku-4-5-20251001 | — |

(WhatsApp surfaces stay on Haiku until their own sittings — SPEC-1 D3 discipline. Founder can flip any row live from admin Config.)

Escalation: Prestige only, fired when the existing COMPLEX classifier promotes a turn.

## 5. The fallback rule (non-negotiable)

Harvey's PWA loop runs 45 tools; cheap-provider tool fidelity is unproven at this width.

- Any `LLMToolFidelityError` or unparseable tool_use from a non-anthropic provider → **one silent retry of the same turn on Haiku**.
- Log `kind='provider_downgrade'` with provider, model, error class to `vendor_activity_log`.
- Downgrade rate per provider is visible in admin (SPEC-11 dashboard); >5% sustained = flip that tier back to Haiku in config, investigate offline.
- Harvest surface exception: retry once on Haiku, then give up silently (harvest is best-effort — SPEC-1 §8.7).

## 6. Caching economics

- Anthropic: `cache_control` unchanged (existing ~7K static prompt, 0.1× reads).
- DeepSeek: automatic server-side prefix caching — no annotations needed. Requirement: static prefix stays byte-identical at the head of every call. Current prompt architecture (STATIC + dynamic appended) already satisfies this. Facade strips annotations only.
- GLM: implicit caching behavior **unverified** → build includes a live probe (two identical-prefix calls, compare reported usage) and the result recorded in the spec's findings section before flip to prod tiers.

## 7. Engine integration

Each engine replaces its direct Anthropic client + hardcoded `claude-haiku-4-5-20251001` with:
```js
const { provider, model } = resolveModel('pwa_vendor', vendor.tier);
const res = await callLLM({ provider, model, ... });
```
This spec wires **pwaEngine.js + harvest.js only**. `engine.js`, `brideEngine.js`, `circleEngine.js` migrate mechanically in their own sittings (items 5–6) — the facade is ready for them.

## 8. Admin Config page (dreamos-pwa)

`app/admin/config/page.tsx` gains a "Model routing" section: per surface × tier, provider dropdown + model input + escalation input, plus a red "GLOBAL FORCE" banner when `LLM_PROVIDER` env is set (read via a small status endpoint) so the founder is never confused about why config edits aren't taking effect.

## 9. Env additions (Railway)

`ZAI_API_KEY`, `DEEPSEEK_API_KEY`, optional `LLM_PROVIDER`, `LLM_GLM_MODEL`, `LLM_DEEPSEEK_MODEL`. Missing key for a configured provider → router falls back to anthropic + logs `provider_misconfigured` (never a dead engine).

## 10. Acceptance criteria

1. Flip a test vendor's tier row glm↔deepseek↔anthropic in admin → next turn uses the new provider (verify via activity log) with zero deploy.
2. Full 45-tool suite exercised on glm-4.7-flash against test vendor (Swati Roy): every tool either executes correctly or triggers exactly one Haiku fallback — zero false "done" replies.
3. `LLM_PROVIDER=deepseek` env force overrides all config rows.
4. Cost meter: one turn's `llm_cost` log reconciles by hand against provider pricing to the paisa.
5. Missing `ZAI_API_KEY` with glm configured → anthropic fallback + `provider_misconfigured` log, engine alive.
6. Anthropic-path behavior byte-identical pre/post facade (regression: same prompt, same tools, cache hits still registering).
7. GLM caching probe executed and findings recorded.

## 11. Verification protocol

- `node --check` on every changed backend file after patch-to-copy.
- No frontend TS beyond admin Config page → `tsc --noEmit` filtered to it.
- Facade unit tests: translation stripping, fallback trigger, router precedence.
- Prod flip sequence: harvest surface first (lowest blast radius) → trial tier → essential. Signature/Prestige stay anthropic per config.

## 12. Executor session boundaries

One session: `llm.js` + `models.js` + `modelRouter.js` + pwaEngine wiring + admin rows + Config UI + probe. Do not touch other engines. If SPEC-1 lands first, replace its `// FACADE-SWAP` marker in `harvest.js`.
