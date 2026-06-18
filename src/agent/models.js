// ─────────────────────────────────────────────────────────────────────────────
// src/agent/models.js
// Single source of truth for model IDs, pricing constants, and cost calculation.
//
// MODEL LOCK: Never change MODEL_HAIKU or MODEL_SONNET without explicit
// founder approval. These are pinned snapshots, not aliases.
// ─────────────────────────────────────────────────────────────────────────────

// ── Locked model IDs ─────────────────────────────────────────────────────────

const MODEL_HAIKU  = 'claude-haiku-4-5-20251001';
const MODEL_SONNET = 'claude-sonnet-4-6';

// Default model for all agent calls. Overridden by classifier for complex tasks.
const MODEL_DEFAULT = MODEL_HAIKU;

// ── Pricing constants (USD per million tokens) ───────────────────────────────
// Source: Anthropic pricing page, verified 2026-05-15.
// Update if Anthropic changes pricing. All values in USD.

const PRICING = {
  [MODEL_HAIKU]: {
    input_per_m:  1.00,   // $1.00 per million input tokens
    output_per_m: 5.00,   // $5.00 per million output tokens
  },
  [MODEL_SONNET]: {
    input_per_m:  3.00,   // $3.00 per million input tokens
    output_per_m: 15.00,  // $15.00 per million output tokens
  },
};

// ── FX conversion ─────────────────────────────────────────────────────────────
// USD to INR conversion rate. Hardcoded at 100 (Dev's call, 2026-05-15).
// Current live rate at time of writing: ~95.93.
// Set forward to 100 based on macro view (oil/Iran crisis, rupee weakening).
// Expected to be accurate by full launch + Razorpay billing.
// Revisit if reality diverges more than 5% from 100 for a sustained period.

const USD_TO_INR = 100;

// ── Cost calculator ──────────────────────────────────────────────────────────
// calculateCost(model, inputTokens, outputTokens)
// Returns { cost_usd, cost_inr } rounded to 6 and 2 decimal places.
// Returns null if model is unrecognised (logs a warning, does not throw).

// Prompt-cache multipliers (Anthropic standard, ported from dreamai models.ts):
// a cache READ bills at 0.1x the input rate; a cache WRITE (first time the prefix
// is cached) bills at 1.25x. With caching on, the API splits input into three
// buckets — fresh input_tokens, cache_read_input_tokens, cache_creation_input_tokens
// — so all three must be priced or cost UNDER-reports (or, billed flat, OVER-reports
// the cached reads). NOTE: Anthropic's Haiku prompt-cache MINIMUM is 2048 tokens —
// a cached block below that silently no-ops (no write, no read, no discount), so
// only blocks that clear 2048 actually cache.
const CACHE_READ_MULT  = 0.1;
const CACHE_WRITE_MULT  = 1.25;

function calculateCost(model, inputTokens, outputTokens, cacheReadTokens = 0, cacheWriteTokens = 0) {
  const pricing = PRICING[model];
  if (!pricing) {
    console.warn(`[models] Unknown model "${model}" — cost not calculated`);
    return null;
  }
  const cost_usd =
    (inputTokens      / 1_000_000) * pricing.input_per_m +
    (cacheReadTokens  / 1_000_000) * pricing.input_per_m * CACHE_READ_MULT +
    (cacheWriteTokens / 1_000_000) * pricing.input_per_m * CACHE_WRITE_MULT +
    (outputTokens     / 1_000_000) * pricing.output_per_m;
  const cost_inr = cost_usd * USD_TO_INR;
  return {
    cost_usd: parseFloat(cost_usd.toFixed(6)),
    cost_inr: parseFloat(cost_inr.toFixed(2)),
  };
}

// ── Complexity levels ─────────────────────────────────────────────────────────
// Classifier output values — only two valid outputs.

const COMPLEXITY = {
  SIMPLE:  'simple',
  COMPLEX: 'complex',
};

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  MODEL_HAIKU,
  MODEL_SONNET,
  MODEL_DEFAULT,
  USD_TO_INR,
  calculateCost,
  COMPLEXITY,
};
