// models.ts — the tier-based model policy. The model tier IS the product tier.
//   entry → always Haiku
//   mid   → start Haiku, self-escalate to Sonnet via the `escalate` tool
//   top   → always Sonnet
// Read per agent, every turn.

export type Tier = 'entry' | 'mid' | 'top';

export const MODELS = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
} as const;

// The model a turn STARTS on for a given tier.
export function startModelForTier(tier: Tier): string {
  return tier === 'top' ? MODELS.sonnet : MODELS.haiku;
}

// Only the mid tier may self-escalate. Entry stays on Haiku; Top is already Sonnet.
export function canEscalate(tier: Tier): boolean {
  return tier === 'mid';
}

// Pricing (USD per million tokens). USD→INR pinned at 100 (conservative).
const PRICING: Record<string, { input: number; output: number }> = {
  [MODELS.haiku]: { input: 1.0, output: 5.0 },
  [MODELS.sonnet]: { input: 3.0, output: 15.0 },
};
const USD_TO_INR = 100;

// Prompt-cache multipliers (Anthropic standard): a cache READ bills at 0.1x the input
// rate; a cache WRITE (first time the prefix is cached) bills at 1.25x. With caching
// on, the API splits input into three buckets — fresh `input_tokens`, `cache_read`,
// and `cache_write` (cache_creation) — so all three must be priced or cost under-reports.
const CACHE_READ_MULT = 0.1;
const CACHE_WRITE_MULT = 1.25;

export function calcCostInr(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens = 0,
  cacheWriteTokens = 0,
): number {
  const p = PRICING[model] ?? PRICING[MODELS.haiku];
  const usd =
    (inputTokens / 1_000_000) * p.input +
    (cacheReadTokens / 1_000_000) * p.input * CACHE_READ_MULT +
    (cacheWriteTokens / 1_000_000) * p.input * CACHE_WRITE_MULT +
    (outputTokens / 1_000_000) * p.output;
  return Math.round(usd * USD_TO_INR * 100) / 100;
}

export function modelLabel(model: string): 'haiku' | 'sonnet' {
  return model.includes('haiku') ? 'haiku' : 'sonnet';
}
