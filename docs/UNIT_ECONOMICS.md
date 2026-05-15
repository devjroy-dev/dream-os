# dream-os -- Unit Economics: Smart Agent Routing + Prompt Caching
**Created:** 2026-05-15
**Session:** 8.1
**Author note:** This document was created at Dev's explicit request for his personal reference.
It stays in docs/ alongside HANDOVER.md, SCHEMA.md, and ROADMAP.md.
No other session needs to read, update, or amend this document.
It is a snapshot of the cost analysis done at the time of Session 8.1, updated with actual
observed results from Session 8.2 smoke testing.

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

## Per-turn cost benchmarks (Session 8.1, pre-caching)

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

### Realistic cache hit rate for dream-os (estimated at time of Session 8.1)
Vendors don't message in rapid bursts. Messages are spread across the day with
gaps of minutes to hours between turns. With a 1-hour cache window:
- Estimated cache hit rate: ~30% of calls (messages clustered within same hour)
- This was a conservative estimate — see actual results in Session 8.2 section below

### Revised cost with caching (30% hit rate — original estimate)

Per Haiku turn with 30% cache hits:
- 70% of calls: normal cost = Rs 1.25
- 30% of calls: cache write (2x) first call in window, then 0.10x hits
- Blended Haiku cost ≈ Rs 0.70/turn (estimated ~45% reduction)

Per Sonnet turn with 30% cache hits:
- Blended Sonnet cost ≈ Rs 1.40/turn (estimated ~45% reduction)

### Revised monthly cost (50 vendors, with caching — original estimate)
- Daily per vendor: (16 × Rs 0.70) + (4 × Rs 1.40) = Rs 11.20 + Rs 5.60 = Rs 16.80
- Monthly per vendor: Rs 16.80 × 30 = **~Rs 500/month**
- Total 50 vendors: **~Rs 25,000/month**

### Summary: uncached vs cached (original estimate)
| Scenario | Monthly per vendor | Total 50 vendors |
|---|---|---|
| No caching (8.1, pre-caching) | Rs 900 | Rs 45,000 |
| With caching (8.1 estimate) | Rs 500 | Rs 25,000 |
| Saving (estimated) | Rs 400 | Rs 20,000/month |

---

## Pricing implications (for when Razorpay billing goes live)

### Suggested tier structure
| Tier | Price/month | Break-even msg/day (no caching) | Break-even msg/day (cached, estimated) |
|---|---|---|---|
| Essential | Rs 999 | ~33 | ~60 |
| Signature | Rs 1,999 | ~66 | ~120 |
| Prestige | Rs 2,999 | ~100 | ~180 |

Note: these figures cover AI cost only. See corrected figures in Session 8.2 section below
which include Twilio and infrastructure costs for a more honest picture.

At 20 messages/day cap (founding cohort), all tiers are highly profitable once Razorpay launches.
The founding cohort is free — this burn is the customer acquisition cost for the first 50 vendors.

### Gross margin estimate at scale (500 vendors, cached, Essential tier — original estimate)
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

---

## Session 8.2 smoke test results — actual observed performance
**Date:** 2026-05-15
**Status:** Prompt caching shipped and verified live on Railway.

### Observed token counts and costs (live Railway logs, post-caching)

| Message | Model | Tokens in | Tokens out | Cost USD | Cost Rs |
|---|---|---|---|---|---|
| "what's my TDW link" | Haiku | 1,042 | 142 | $0.001752 | Rs 0.18 |
| "how many open leads do I have" | Haiku | 1,431 | 157 | $0.002216 | Rs 0.22 |

### Before vs after caching — actual

| Metric | Before caching (8.1) | After caching (8.2) | Actual change |
|---|---|---|---|
| Input tokens per Haiku turn | ~11,500 | ~1,200 | **-91%** |
| Cost per Haiku turn | Rs 1.24 | Rs 0.18-0.22 | **-85%** |

### Why actual result beat the estimate

The Session 8.1 estimate assumed ~30% cache hit rate. Actual performance shows near-100%.

Reason: the static block is truly static — identical hash on every call, for every vendor.
Anthropic serves it from cache every time. Input tokens dropped from ~11,500 to ~1,200 because
the ~8,000-10,000 token static block is not counted in input_tokens for cache hits at all —
only the dynamic context, conversation history, and inbound message are charged at full price.

---

## Corrected unit economics (actual, post-caching, full cost)

### Per-turn cost benchmarks (actual observed)

| Model | Pre-caching | Post-caching (actual) | Reduction |
|---|---|---|---|
| Haiku | Rs 1.25 | Rs 0.20 (avg observed) | 84% |
| Sonnet | Rs 2.50 | Rs ~0.40 (estimated) | ~84% |

Note: Sonnet post-caching cost is estimated, not yet observed. To be verified in Session 8.3
when invoice smoke tests are re-run with caching active.

### Full cost per vendor per month (actual, 20 messages/day)

Prompt caching only covers AI token costs. Twilio and infrastructure costs are unchanged
and in fact now dominate the cost structure — not AI.

| Cost component | Per message | Daily (20 msg) | Monthly |
|---|---|---|---|
| AI — Haiku (80% of turns) | Rs 0.20 | Rs 2.56 | Rs 76.80 |
| AI — Sonnet (20% of turns, est.) | Rs 0.40 | Rs 1.60 | Rs 48.00 |
| Twilio WhatsApp outbound | ~Rs 0.50 | Rs 10.00 | Rs 300.00 |
| Infrastructure share (est.) | — | Rs 5.00 | Rs 150.00 |
| **Total per vendor** | | **Rs 19.16/day** | **~Rs 575/month** |

AI cost alone: Rs 144/month per vendor.
Full cost including Twilio + infrastructure: ~Rs 575/month per vendor.

### Corrected monthly burn (50 vendors, post-caching, full cost)
50 × Rs 575 = **~Rs 28,750/month**

This is the realistic all-in monthly cost for the founding cohort at 20 messages/day.
Dominated by Twilio (~Rs 15,000/month across 50 vendors), not AI costs.

### Corrected break-even table

The earlier break-even figures only covered AI cost. Honest break-even includes
Twilio + infrastructure. Both are shown below.

| Tier | Price/month | AI-only break-even | Full cost break-even |
|---|---|---|---|
| Essential | Rs 999 | ~166 msg/day | **~35 msg/day** |
| Signature | Rs 1,999 | ~333 msg/day | **~70 msg/day** |
| Prestige | Rs 2,999 | ~499 msg/day | **~104 msg/day** |

**The full cost break-even is the honest number to plan against.**

At 20 messages/day (founding cohort cap), a vendor on Essential (~35 msg/day break-even)
is slightly above break-even on full cost. At real-world usage of 10-15 messages/day,
the vendor is comfortably below break-even — but this is the founding cohort (free tier),
so the loss per vendor is the customer acquisition cost, not a structural problem.

At Razorpay launch, a vendor paying Rs 999/month using 10-15 messages/day generates a
healthy margin. The cap protects against outlier heavy users eroding that margin.

### Corrected gross margin at scale (500 vendors, Essential tier, post-caching)

| Line | Amount |
|---|---|
| Revenue: 500 × Rs 999 | Rs 4,99,500/month |
| AI cost: 500 × Rs 144 | Rs 72,000/month |
| Twilio: 500 × Rs 300 (est. 20 msg/day avg) | Rs 1,50,000/month |
| Infrastructure: Railway + Supabase | Rs 20,000/month |
| **Total cost** | **Rs 2,42,000/month** |
| **Gross profit** | **Rs 2,57,500/month** |
| **Gross margin** | **~52%** |

Previously the Session 8.1 estimate showed 45% contribution margin. The corrected figure
is ~52% — higher because actual AI costs post-caching are dramatically lower than estimated,
partially offset by Twilio costs which were not in the original model.

### Key structural insight post-8.2

Post-caching, AI costs are negligible at founding cohort scale (Rs 144/vendor/month).
The dominant cost driver is now **Twilio WhatsApp messaging** (~Rs 300/vendor/month at
20 messages/day), not AI. This has implications for product and pricing decisions:

1. **Message caps matter more for Twilio than AI.** The 20 msg/day cap protects Twilio
   spend, not AI spend. If a vendor sends 40 messages/day, Twilio doubles, AI barely moves.

2. **The next cost lever is Twilio, not AI.** At 500+ vendors, negotiating Twilio volume
   discounts or switching to a cheaper WhatsApp Business API provider is the highest-impact
   cost optimisation available — not further AI tuning.

3. **Sonnet is now very affordable.** At Rs 0.40/turn (estimated post-caching), routing
   complex tasks to Sonnet is essentially free relative to Twilio. No need to be conservative
   about what gets routed to Sonnet.
