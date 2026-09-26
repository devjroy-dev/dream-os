# TDW · CE-45 · ASK-1 · CUT 1b HANDOVER · the cached prefix, the truncation cure, the result cap (F-44.182, e-154)

Base 5fa06cb. Both lanes still OFF: nothing a vendor reads changes. Code: `src/lib/vendor/askAgent.js` only.

## What changed

- **The cache (F-44.182).** The system prompt goes as one content block marked `cache_control: ephemeral`, and the last tool
  definition is marked, as the estate's agents mark theirs. llm.js strips every marker for a non-Anthropic provider (DeepSeek
  caches a repeated prefix on its own). The prefix is built once and is byte-identical call to call (b130a 15.2).
- **The minimum.** Anthropic's prompt caching page (read 26 September 2026) sets Claude Haiku 4.5's minimum cacheable prefix at
  4,096 tokens; a shorter prefix is silently not cached. Cut 1's prefix (13 tool schemas and the rules) was about 2,000 to 2,300
  tokens: under the minimum, so marking alone would have cached nothing. Cut 1b adds 36 worked examples (the form of a good
  answer for each kind of question; every name, date and amount in them declared invented), which lifts the prefix to 18,230
  characters, about 4,560 to 5,200 tokens. The API's own count is b130m --probe's first line; b130a 15.3 is a character proxy.
- **Truncation.** A reply that stops at the 700-token ceiling (`stop_reason: max_tokens`) is a failure and reads the founder's
  glitch line, never a partial list (b130a 15.4, M9).
- **The result cap.** A tool result over 8,000 characters reaches the model as `too_long`, never cut mid-way (b130a 15.5). The
  largest in the batteries is about 5,200.

## b130m

- `--probe --model=haiku`: the API's token count of the prefix against 4,096, then two identical calls with the usage printed
  (cache_creation on the first, cache_read on the second) and each call's cost. PROBE GREEN or RED; RED means no --live.
- `--live` under A-45.15: the projected cost first; refuses without `--budget=<USD>`; records every run to
  `/tmp/b130m/<model>.jsonl`; stops at the first credit, quota or AUTH error and at the budget; `--resume` runs only what has no
  KEPT result (an errored run runs again; r2); one model a run (`--model=haiku` or `--model=deepseek`). The verdict counts runs that READ the cache. `--show-misses` names each miss by kind (r2): for m1 the question family and the
  tools wanted against the tools called; for m2 each date, amount, time or count the turn's tool results do not hold.
- The first Haiku and DeepSeek --live runs (20:56 and 22:42 IST, cut 1's b130m, before A-45.15) were NOT recorded: their misses
  cannot be read, and this cut does not claim to.
- `--dry` prints the warm-cache line beside the ceiling: Haiku about $0.0038 a question warm, 549 runs about $2.11.

## Proven

b130a 102 of 102 (94 carried, 6 new cells, M8 and M9), dirt check intact. b130m --readers 0 false positives, 0 misses.
