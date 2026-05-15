# dream-os -- Session Handover
**Last updated:** 2026-05-15
**Session:** 8.1
**Version:** 0.8.1-alpha

## What shipped this session

### Pre-session housekeeping (before 8.1 work began)
- Backfilled missing `0008_invoices.sql` migration file (schema was applied in Session 7 but file never committed)
- Synced `package-lock.json` to 0.7.0-alpha (version field was out of sync)
- Deleted 5 zero-byte junk files from repo root (`0,`, `30%`, `=`, `For: Bridal makeup`, `Rs`) — created by copy-paste accident in Session 7 invoice testing

### Migration 0009 (db/migrations/0009_message_cost_tracking.sql)
- `messages.model` text (nullable) — which model handled this message
- `messages.input_tokens` integer (nullable, CHECK >= 0) — input token count
- `messages.output_tokens` integer (nullable, CHECK >= 0) — output token count
- `messages.cost_usd` numeric(10,6) (nullable, CHECK >= 0) — Anthropic billing cost
- `messages.cost_inr` numeric(10,2) (nullable, CHECK >= 0) — Rs equivalent at USD_TO_INR=100
- `messages_model_idx` index on messages(model) for cost aggregation queries
- `vendors.style_notes` text (nullable) — qualifier captured during onboarding (e.g. "luxury", "celebrity", "budget")
- Note: Session 7.5's expenses table was previously planned as migration 0009 — now renumbered to 0010

### Smart model routing (src/agent/models.js + src/agent/classifier.js + src/agent/engine.js)
- `src/agent/models.js` — single source of truth for model IDs, pricing constants, cost calculator
  - MODEL_HAIKU = 'claude-haiku-4-5-20251001' (locked)
  - MODEL_SONNET = 'claude-sonnet-4-6' (locked)
  - USD_TO_INR = 100 (Dev's call 2026-05-15, forward-looking macro view)
  - calculateCost(model, inputTokens, outputTokens) → { cost_usd, cost_inr }
- `src/agent/classifier.js` — lightweight Haiku call before main vendor agent call
  - max_tokens: 5 — enforces single-word output at API level
  - Returns 'simple' or 'complex'
  - Passes last 2 history turns for disambiguation context
  - Defaults to 'simple' on any error — message always gets processed
- `src/agent/engine.js` — classifier wired into vendor agent path
  - Classifier runs → modelToUse set → main agent loop uses modelToUse
  - Token usage accumulated across all iterations
  - calculateCost() called after loop → cost returned in result object
  - Couple agent: MODEL_HAIKU always (no classifier — narrow scope)
  - Old hardcoded MODEL constant removed entirely

### Cost tracking (src/index.js)
- Outbound message insert now saves: model, input_tokens, output_tokens, cost_usd, cost_inr
- Pre-8.1 messages have null values in these columns — expected, not an error

### Smart onboarding (src/agent/categories.js + src/agent/onboarding.js)
- `src/agent/categories.js` — locked vendor category taxonomy
  - 16 categories (florist merged into decor — founder confirmed 2026-05-15)
  - VENDOR_CATEGORIES list + CATEGORY_ALIASES for Haiku prompt context
- `src/agent/onboarding.js` — asked_category state now uses Haiku extraction
  - extractCategoryDetails() calls Haiku with strict JSON-only prompt
  - Returns { category, style_notes, city }
  - If city extracted in same message → saves city, skips asked_city state
  - category normalised to taxonomy (e.g. "luxury decorator" → category=decor, style_notes=luxury)
  - Fallback to raw input strip if Haiku fails — onboarding never breaks
  - style_notes saved to vendors.style_notes column
  - anthropic client now passed through handleOnboarding → nextOnboardingMessage

### Admin cost display (src/admin/router.js + src/admin/views/detail.js)
- router.js queries messages table for this month's agent cost per vendor
- Aggregates by model (Haiku / Sonnet breakdown)
- detail.js: two new rows in vendor profile
  - Style: vendor.style_notes (e.g. "luxury")
  - AI Cost (month): Rs X.XX · Haiku: Rs X.XX, Sonnet: Rs X.XX

### Version health check fix (src/index.js)
- Health check endpoint now reads version from package.json dynamically
- `const { version } = require('../package.json')`
- Eliminates version drift between package.json and /health response

## Smoke tests passed
- "what's my TDW link" → classifier: simple → Haiku ✅
- "create an invoice for Priya, total 1,20,000 advance 36,000" → classifier: complex → Sonnet ✅
- Disambiguation "same Priya" resolved in 1 Sonnet turn (was 4+ Haiku loops in Session 7) ✅
- "Priya Roy" follow-up → classifier: simple → Haiku completed invoice correctly ✅
- Token counts + cost saved to messages table (verified in Supabase) ✅
- Onboarding: "I'm a luxury decorator based in Mumbai" → category=decor, style_notes=luxury, city=Mumbai, asked_city skipped ✅
- Admin: Style row + AI Cost (month) row showing on vendor detail ✅

## Routing rules (locked)
| Surface | Model | Notes |
|---|---|---|
| Vendor agent | Classifier → Haiku (simple) or Sonnet (complex) | Classifier runs on every vendor turn |
| Couple agent | Haiku always | Narrow scope — route + capture only |
| Onboarding | Haiku always | Smart extraction prompt, not free reasoning |
| Classifier itself | Haiku always | max_tokens=5, defaults simple on error |

## Complex signals (classifier routes to Sonnet)
- Invoice creation, editing, questions about a specific invoice
- Payment recording (advance, balance, partial)
- Disambiguation between clients with same/similar name
- Long forwarded enquiry message (lead extraction)
- Multi-step financial reasoning
- Nuanced reply drafting where tone is critical

## Known gaps carried forward
1. Twilio status callback: vendor notification message (sent_by: system) missing twilio_sid — pre-existing Session 5.5 bug
2. No Anthropic credit-low warning — agent fails silently if credits run out. More critical now Sonnet is in use.
3. update_lead_state requires UUID — name-based update deferred to Session 8
4. Lead dedup upstream (create_lead tool does blind insert) — deferred to Session 8.5
5. Classifier context gap: if prior Sonnet disambiguation turn is outside the 2-turn history window, follow-up message may route to Haiku with incomplete context. Low risk at current conversation volumes.
6. Session 7.5 expenses migration renumbered from 0009 to 0010 — update SCHEMA.md when 7.5 ships.
7. vendors.rate_min / rate_max columns not yet added — needed for Discover budget matching. Session 9 migration.
8. Prompt caching not yet implemented — deferred to Session 8.2. See UNIT_ECONOMICS.md.

## Session 8.2 scope (confirmed)
- Prompt caching: add cache_control to system prompt block in engine.js (1-hour cache)
- Gemini 3.1 Flash-Lite SDK wired as retrieval-only provider (not used in agent yet)
- Gemini grounded search wrapper ready for Session 9 Discover

## Key product decisions locked this session
- MODEL_HAIKU = 'claude-haiku-4-5-20251001' — never change without founder approval
- MODEL_SONNET = 'claude-sonnet-4-6' — never change without founder approval
- USD_TO_INR = 100 — hardcoded, forward-looking (Dev's call, macro view on rupee)
- Classifier defaults to simple on any failure — message never dropped
- Couple agent: Haiku always, no classifier
- Onboarding: Haiku always, extraction prompt only
- 16 vendor categories — florist merged into decor, invitations kept
- style_notes: qualifier field, free text, nullable. Populated by Haiku extractor.
- Cost stored in both cost_usd (audit/reconciliation) and cost_inr (admin display)
- Version string: read from package.json dynamically — never hardcoded again
- UNIT_ECONOMICS.md: Dev's reference document, stays in docs/, no other session amends it

## Document update protocol
Four files updated this session and every future session:
- HANDOVER.md — fully rewritten
- SCHEMA.md — fully rewritten
- ROADMAP.md — updated
- UNIT_ECONOMICS.md — Dev's reference only, no other session amends it
git add docs/ src/index.js package.json && git commit -m "docs: session 8.1 handover, schema, roadmap, unit economics + version bump" && git push

## Railway env vars (current)
- TWILIO_WHATSAPP_NUMBER = whatsapp:+14787788550
- TDW_WA_NUMBER = 14787788550
- ANTHROPIC_API_KEY (workspace: dream-os, model lock: haiku-4-5-20251001 + sonnet-4-6)
- ADMIN_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (all in Railway)

## Test credentials
- WhatsApp: +14787788550
- Test vendor phone: +918757788550
- Test vendor UUID: 2eb5d3fb-31eb-4b26-859a-cf10ae477d53
- Test vendor user UUID: f1d6d3af-a828-4e42-98ab-862b05dbc110
- Test conversation UUID: c2740497-6f40-4469-8bc1-8d66c9bda7bd
- Test vendor routing_handle: DEV550
- Test vendor TDW link: wa.me/14787788550?text=TDW-DEV550
- Test vendor business_name: Dev Roy Photography
- Test vendor upi_id: dreamostest@okhdfc
- Supabase: nvzkbagqxbysoeszxent (Mumbai)
- Railway: https://dream-os-production.up.railway.app
- Admin: https://dream-os-production.up.railway.app/admin

## First thing next session (7.5)
curl https://dream-os-production.up.railway.app
Should return: {"status":"alive","service":"dream-os","version":"0.8.1-alpha"}

Check Railway logs for:
[dream-os] listening on :3000
[cron] jobs registered: morning briefing at 08:00 IST (02:30 UTC)

If +91 number has arrived: do Session 6.5 before anything else.
Otherwise: start Session 7.5 (money tools — record_payment, PDF, QR, expenses).
Note: expenses migration is now 0010 (not 0009 — taken by cost tracking).
