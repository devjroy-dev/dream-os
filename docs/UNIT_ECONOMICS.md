# dream-os -- Unit Economics: Smart Agent Routing + Prompt Caching
**Created:** 2026-05-15
**Session:** 8.1
**Author note:** This document was created at Dev's explicit request for his personal reference.
It stays in docs/ alongside HANDOVER.md, SCHEMA.md, and ROADMAP.md.
No other session needs to read, update, or amend this document.
It is a snapshot of the cost analysis done at the time of Session 8.1.

---

## Context

Session 8.1 introduced smart model routing — Haiku for simple tasks, Sonnet for complex ones.
This document captures the real cost data observed during smoke testing, the unit economics
for the founding cohort of 50 vendors, and the projected impact of prompt caching (Session 8.2).

---

## Real costs observed during Session 8.1 smoke testing

All figures from live Railway logs, 2026-05-15. USD_TO_INR = 100.

| Message | Model | Tokens in | Tokens out | Cost USD | Cost Rs |
|---|---|---|---|---|---|
| "what's my TDW link" | Haiku | 11,477 | 178 | $0.0124 | Rs 1.24 |
| Invoice creation (first turn) | Sonnet | 5,675 | 17 | $0.0173 | Rs 1.73 |
| Disambiguation (same Priya?) | Sonnet | 11,572 | 159 | $0.0371 | Rs 3.71 |
| "Priya Roy" (name answer) | Haiku | 11,634 | 226 | $0.0128 | Rs 1.28 |

**Key observation:** Input tokens dominate cost (~95% of total). The system prompt alone is
~8,000-10,000 tokens — sent on every single API call, for every vendor, for every message.
This is the dominant cost driver, not the actual reply content.

---

## Per-turn cost benchmarks

| Model | Avg cost per turn (observed) |
|---|---|
| Haiku | ~Rs 1.25 |
| Sonnet | ~Rs 2.50 (avg of invoice turns) |

---

## Founding cohort unit economics (50 vendors, 20 messages/day cap)

### Assumptions
- 50 vendors, all active (worst case — reality will be lower)
- 20 messages/day per vendor
- 80% simple (Haiku) / 20% complex (Sonnet) routing split
- No prompt caching

### Daily cost per vendor
- 16 Haiku turns × Rs 1.25 = Rs 20.00
- 4 Sonnet turns × Rs 2.50 = Rs 10.00
- **Total: Rs 30/day per vendor**

### Monthly cost per vendor
Rs 30 × 30 days = **Rs 900/month per vendor**

### Total monthly burn (50 vendors, no caching)
50 × Rs 900 = **Rs 45,000/month**

---

## Impact of prompt caching (Session 8.2)

### How prompt caching works
Anthropic caches the static system prompt (the identical ~8,000-10,000 token block sent on every call).
- Cache write (1-hour): 2x base input price (one-time cost per hour window)
- Cache hit: 0.10x base input price (90% discount vs normal)
- Cache key = exact content hash — no cross-vendor contamination possible (see below)

### Why cross-vendor contamination is impossible
The cache key is the content itself. Only the static system prompt (identical for every vendor)
gets cached. The vendor-specific context (name, leads, events, conversation history) is always
sent fresh, never cached. The model always receives:
- [CACHED: generic system prompt — same for everyone, ~8,000 tokens]
- [FRESH: vendor-specific context — unique per call]
- [FRESH: conversation history — unique per call]
- [FRESH: vendor's inbound message — unique per call]

### Realistic cache hit rate for dream-os
Vendors don't message in rapid bursts. Messages are spread across the day with
gaps of minutes to hours between turns. With a 1-hour cache window:
- Estimated cache hit rate: ~30% of calls (messages clustered within same hour)
- This is conservative — reality may be higher or lower depending on vendor behaviour

### Revised cost with caching (30% hit rate)

Per Haiku turn with 30% cache hits:
- 70% of calls: normal cost = Rs 1.25
- 30% of calls: cache write (2x) first call in window, then 0.10x hits
- Blended Haiku cost ≈ Rs 0.70/turn (estimated ~45% reduction)

Per Sonnet turn with 30% cache hits:
- Blended Sonnet cost ≈ Rs 1.40/turn (estimated ~45% reduction)

### Revised monthly cost (50 vendors, with caching)
- Daily per vendor: (16 × Rs 0.70) + (4 × Rs 1.40) = Rs 11.20 + Rs 5.60 = Rs 16.80
- Monthly per vendor: Rs 16.80 × 30 = **~Rs 500/month**
- Total 50 vendors: **~Rs 25,000/month**

### Summary: uncached vs cached
| Scenario | Monthly per vendor | Total 50 vendors |
|---|---|---|
| No caching (current) | Rs 900 | Rs 45,000 |
| With caching (estimated) | Rs 500 | Rs 25,000 |
| Saving | Rs 400 | Rs 20,000/month |

---

## Pricing implications (for when Razorpay billing goes live)

### Suggested tier structure
| Tier | Price/month | Break-even msg/day (no caching) | Break-even msg/day (cached) |
|---|---|---|---|
| Essential | Rs 999 | ~33 | ~60 |
| Signature | Rs 1,999 | ~66 | ~120 |
| Prestige | Rs 2,999 | ~100 | ~180 |

At 20 messages/day cap (founding cohort), all tiers are highly profitable once Razorpay launches.
The founding cohort is free — this burn is the customer acquisition cost for the first 50 vendors.

### Gross margin estimate at scale (500 vendors, cached, Essential tier)
- Revenue: 500 × Rs 999 = Rs 4,99,500/month
- AI cost: 500 × Rs 500 = Rs 2,50,000/month
- **Gross margin: ~50%** before infrastructure (Railway, Supabase, Twilio)
- Infrastructure at 500 vendors: ~Rs 15,000-20,000/month (estimated)
- **Contribution margin: ~45%**

---

## Additional cost levers (not yet implemented)

### 1. Classifier efficiency (already implemented in 8.1)
The classifier call itself costs ~Rs 0.15/call (Haiku, ~500 input tokens, 5 output tokens).
This is the overhead for routing. At 20 messages/day per vendor, classifier adds Rs 3/day = Rs 90/month.
Offset by Sonnet savings on simple tasks — net positive.

### 2. Conversation history truncation (easy win, not yet done)
Currently: last 10 messages sent on every call (~2,000 tokens avg).
Reducing to 6 messages saves ~800 tokens per call.
Haiku saving: ~Rs 0.08/call. At 20 msg/day: Rs 1.60/day = Rs 48/month per vendor.
Across 50 vendors: Rs 2,400/month. Worth doing in a future session.

### 3. Gemini Flash-Lite as classifier (rejected)
Evaluated and rejected in Session 8.1 discussion.
Saving: ~Rs 0.04/call (trivial at our scale).
Cost: second provider dependency, latency tax, reliability risk.
Decision: Haiku classifier only. Revisit if volume reaches 10,000+ messages/day.

---

## Session 8.2 implementation note
Prompt caching requires one code change in src/agent/engine.js:
Add `cache_control: { type: "ephemeral" }` to the system prompt block in the API call.
Use 1-hour cache (2x write cost, better hit rate than 5-minute cache for our usage pattern).
Estimated implementation time: 15 minutes.
Estimated monthly saving: Rs 20,000 across the founding cohort.
