# dream-os -- Session Handover
**Last updated:** 2026-05-15
**Session:** 8.2
**Version:** 0.8.2-alpha

## What shipped this session

### Hotfix: engine.js smart routing restored
Session 8.1's onboarding commit (ae693d4) had accidentally overwritten engine.js with a stale
version, removing the classifier imports, modelToUse routing, token accumulation, and cost
calculation. Smart routing was silently broken from that commit until the start of 8.2.

Fixed in commit 718807c. All four things restored:
- classifyMessage + models imports
- modelToUse classifier routing
- token accumulation + calculateCost
- couple agent MODEL_HAIKU explicit pin
- anthropic pass-through to handleOnboarding preserved

### Prompt caching (src/agent/systemPrompt.js + src/agent/engine.js)
systemPrompt.js split into two parts:
- `STATIC_SYSTEM_PROMPT`: all rules, tool guidance, examples (~6,600 chars). Identical for
  every vendor on every call. Sent with `cache_control: { type: 'ephemeral' }` (1-hour cache).
  Anthropic caches after first call — subsequent calls pay 10% of normal input price.
- `buildDynamicContext()`: vendor name, city, summary, leads, events, notes. Fresh every call,
  never cached.
- `buildSystemPrompt()` preserved as legacy compatibility export (returns full plain string).

engine.js: system param now an array of two blocks `[{ STATIC, cache_control }, { dynamic }]`
instead of a plain string. Couple agent unchanged — uses plain string (no caching needed).

### Actual observed cost impact (live Railway logs, 2026-05-15)
| Metric | Before caching | After caching | Change |
|---|---|---|---|
| Input tokens per Haiku turn | ~11,500 | ~1,200 | -91% |
| Cost per Haiku turn | Rs 1.24 | Rs 0.20 | -85% |
| Monthly per vendor (20 msg/day) | Rs 900 | ~Rs 144 (AI only) | -84% |

Near-100% cache hit rate observed — static block is truly identical every call.
See docs/UNIT_ECONOMICS.md for full corrected analysis including Twilio costs.

### Gemini SDK wiring (src/lib/groundedSearch.js)
Package: `@google/genai ^2.2.0` installed.
New file: `src/lib/groundedSearch.js` — retrieval-only wrapper.

**Why wired now, not in Session 9:**
Session 9 (Discover marketplace) is already complex — Next.js on Vercel, vendor profile pages,
couple enquiry flow, rate_min/rate_max migration, multi-model planner. Adding "set up Gemini SDK
from scratch" to that session was unnecessary debt.

The wrapper is infrastructure groundwork: installed, configured, deployed, and verified working.
Session 9 starts with the retrieval layer already ready — one less thing to figure out.

**How groundedSearch.js works:**
- Takes a query string + optional context
- Calls Gemini 3.1 Flash-Lite with `tools: [{ googleSearch: {} }]` (Google Search grounding)
- Returns `{ answer, sources, raw }` — structured results with citation URLs
- Never throws — all errors returned as `{ answer: null, error }`, caller decides how to handle

**The agent does NOT call this today.** Zero impact on vendor agent, couple agent, onboarding,
or any existing functionality. It sits ready in src/lib/ for Session 9.

**Session 9 usage pattern (for reference):**
Bride query → groundedSearch() retrieves web context (Gemini) + DB query (Haiku) →
Sonnet composes bride-facing reply combining both sources.

### Railway env var added
- `GOOGLE_API_KEY` — Google AI Studio key (dev@thedreamwedding.in account, free tier)
  Required by groundedSearch.js. Missing key handled gracefully (logs warning, returns null).

### Repo housekeeping
- Stray HANDOVER.md, ROADMAP.md, SCHEMA.md files deleted from repo root (belonged only in docs/)
- UNIT_ECONOMICS.md updated with actual Session 8.2 smoke test results + corrected figures

## Smoke tests passed
- Agent health check post-deploy: "what's my TDW link" → correct reply ✅
- Smart routing re-verified after hotfix: Haiku for simple, Sonnet for complex ✅
- Prompt caching: input tokens 11,500 → 1,200 (-91%) ✅
- Gemini SDK loads on Railway startup without errors ✅
- Existing agent completely unaffected by Gemini addition ✅

## Known gaps carried forward
1. Twilio status callback: vendor notification message (sent_by: system) missing twilio_sid — pre-existing Session 5.5 bug
2. No Anthropic credit-low warning — agent fails silently if credits run out
3. update_lead_state requires UUID — name-based update deferred to Session 8
4. Lead dedup upstream (create_lead tool does blind insert) — deferred to Session 8.5
5. Classifier context gap: if prior Sonnet disambiguation turn is outside the 2-turn history window, follow-up message may route to Haiku with incomplete context. Low risk at current volumes.
6. Session 7.5 expenses migration is 0010 (not 0009 — taken by cost tracking in 8.1)
7. vendors.rate_min / rate_max columns not yet added — Session 9 migration
8. Sonnet post-caching cost not yet observed — estimated at ~Rs 0.40/turn. Verify in Session 7.5.
9. Railway running in EU West — Supabase is Mumbai (ap-south-1). ~150-200ms cross-region latency. Move Railway region before scaling beyond 50 vendors.

## Key product decisions locked this session
- Prompt caching: 1-hour ephemeral cache on STATIC_SYSTEM_PROMPT only
- buildSystemPrompt() preserved for compatibility — never remove
- Gemini model lock: `gemini-3.1-flash-lite` (retrieval-only, never main agent model)
- GOOGLE_API_KEY: dev@thedreamwedding.in Google AI Studio account, free tier
- groundedSearch.js: retrieval only — Gemini retrieves, Anthropic composes the reply
- Twilio is now the dominant cost driver post-caching, not AI (~Rs 300 vs Rs 144/vendor/month)
- Message caps protect Twilio spend more than AI spend

## Session 7.5 scope (next session)
Goal: Complete the invoice flow + expenses. Sonnet available, caching active.
Note: expenses migration is 0010 (not 0009).

What ships:
- record_payment tool (Stage 2: advance paid → PDF with embedded UPI QR → state=advance_paid)
- record_payment tool (Stage 3: balance paid → plain WhatsApp text → state=paid)
- PDF generation via pdfkit
- QR code generation via qrcode (UPI QR embedded in PDF)
- list_invoices tool
- update_invoice_prefix tool
- expenses table (migration 0010) + log_expense tool
- Admin Money tab on vendor detail page
- Morning briefing: overdue invoice alerts

## Railway env vars (current)
- TWILIO_WHATSAPP_NUMBER = whatsapp:+14787788550
- TDW_WA_NUMBER = 14787788550
- ANTHROPIC_API_KEY (workspace: dream-os, model lock: haiku-4-5-20251001 + sonnet-4-6)
- GOOGLE_API_KEY (Google AI Studio, dev@thedreamwedding.in, free tier)
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
Should return: {"status":"alive","service":"dream-os","version":"0.8.2-alpha"}

If +91 number has arrived: do Session 6.5 before anything else.
Otherwise: start Session 7.5 (money tools — record_payment, PDF, QR, expenses).
Note: expenses migration is 0010 (not 0009 — taken by cost tracking in 8.1).

## Document update protocol
Four files updated every session:
- HANDOVER.md — fully rewritten
- SCHEMA.md — fully rewritten
- ROADMAP.md — updated
- UNIT_ECONOMICS.md — Dev's reference only, no other session amends it
git add docs/ package.json package-lock.json && git commit -m "docs: session 8.2 handover, roadmap + version bump" && git push
