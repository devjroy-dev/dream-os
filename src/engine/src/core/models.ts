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
// ── F-04.85 CLOSED (TDW_06 economics sitting, CE ruling E-3 on the founder's
// standing zero-Sonnet word): EVERY tier starts on Haiku (cached — the anthropic
// native path keeps Victor's prompt cache). The tier ladder's SHAPE survives
// (Tier stays three-valued; a future ruling can reopen the top rung here, at the
// one home) but no rung routes Sonnet today. Pre-cure: top started Sonnet — the
// first of F-04.85's two live paths.
export function startModelForTier(tier: Tier): string {
  void tier; // the ladder's one home keeps its signature; every rung is Haiku by E-3
  return MODELS.haiku;
}

// ── F-04.85 CLOSED, path two (same ruling): the escalate tool NEVER BOARDS.
// Mechanism chosen over retargeting, with the code's own evidence: escalation is
// not a model swap — loop.ts's handler does a FULL CLEAN RE-RUN of the turn
// (messages rebuilt, Donna's in-turn exchange wiped). With every tier starting
// Haiku, an escalate-to-Haiku would keep a tool whose only effect is doubling the
// turn's cost and erasing her exchange for ZERO model change — removal is the
// honest cure. The handler survives in loop.ts as a defensive tombstone
// (retargets Haiku if a foreign path ever injects the call). Pre-cure: mid
// escalated to Sonnet — the second live path.
export function canEscalate(tier: Tier): boolean {
  void tier;
  return false; // E-3: zero Sonnet reachable from any tier
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
