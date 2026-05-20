# dream-os — Session Handover
**Last updated:** 2026-05-20
**Session:** DreamAi PWA Agent (complete)
**Version:** 0.10.0-alpha

---

## What shipped this session

### New: Separate PWA Vendor Agent Engine

Three new files created. Zero changes to WhatsApp engine.

```
src/agent/pwaEngine.js      — new agentic loop (completely separate from engine.js)
src/agent/pwaTools.js       — 22 tools for PWA
src/agent/pwaSystemPrompt.js — new system prompt for PWA
src/api/vendor/chat.js      — swapped to runPWAAgenticTurn, added SSE streaming
```

Key differences from WhatsApp engine:
- Always Sonnet, no classifier (saves ~400ms/turn)
- MAX_ITERATIONS = 8 (vs 5)
- MAX_COST_USD = $0.50 cost cap
- Anthropic timeout = 45s per call (overrides global 12s WhatsApp budget)
- No `respond_to_vendor` tool — model's final text IS the reply
- 15-minute session boundary on history
- Post-write full snapshot refetch on any mutation
- SSE streaming path with `text_delta` events

### New: 5 Backend API Endpoints

```
POST   /api/v2/vendor/auth/refresh        — silent JWT renewal
PATCH  /api/v2/vendor/invoices/:id/cancel — cancel = delete for vendor
PATCH  /api/v2/vendor/events/:id/cancel   — cancel event directly
DELETE /api/v2/vendor/clients/:id         — hard delete (SET NULL cascade safe)
DELETE /api/v2/vendor/expenses/:id        — hard delete
```

### New: cancel_invoice Tool (PWA)

`cancel`, `delete`, `remove` on any invoice → `cancel_invoice` tool → `state = 'cancelled'`. Model never says "can't delete." Paid invoices cannot be cancelled (guard in place).

### Critical Bug Fixes

**SSE crash — Railway restarting on every message (FIXED)**
Root cause 1: `supabase.from(...).insert(...).catch()` — Supabase JS v2 returns PromiseLike not Promise. `.catch()` throws "is not a function", caught by outer try/catch, which called `send()` on already-ended response.
Root cause 2: `ERR_STREAM_WRITE_AFTER_END` emitted as unhandled `error` event on `ServerResponse` — not a thrown exception, so try/catch didn't intercept it. Node crashed and Railway restarted.
Fix: `res.on('error')` handler + `res.writableEnded` guard in `send()` + replaced all `.catch()` with proper try/catch on Supabase persistence calls.
Impact: Was causing 15-20 second delays (Railway cold start) after every single message.

**PGRST116 zero-row update lying (FIXED)**
`update_event_state`, `update_lead_state`, `update_conversation_state` all used `.update().eq()` without `.select().single()`. Supabase returns `{error: null}` on zero-row match — agent confirmed success when nothing changed.
Fix: Added `.select('id').single()` + PGRST116 error code check to all three.

**JWT session expiry — "Something went wrong" after 5 minutes (FIXED)**
Frontend had no token refresh logic. On 401, every API call showed generic error.
Fix: `fetchWithAuth()` in `_base.ts` — on 401, calls `/auth/refresh`, updates localStorage, retries. `streamChat()` in `vendor.ts` has same logic for SSE path. Backend `/refresh` endpoint added.

**`record_payment` unguarded write (FIXED)**
Invoice UPDATE had no error check. Payment could appear confirmed when DB write failed.
Fix: Capture `{ error: updateErr }`, return `err()` on failure.

**`update_invoice_prefix` unguarded write (FIXED)**
Same pattern. Fixed same way.

### Prompt Fixes

- Cancel/delete/remove routing: now calls correct tools (no more "can't delete" response)
- List responses: max 3 items, prose format, never numbered, never thedreamai.in URL
- wa.me link: model never puts raw URL in reply text — frontend button handles it
- WhatsApp: "dreamai link" / "app link" → responds with `thedreamai.in/wedding`

### dreamai Frontend (separate repo)

```
hooks/useChat.ts                  — SSE streaming, refresh, clarify, contact card
lib/api/vendor.ts                 — streamChat() with 401 refresh + retry
lib/api/_base.ts                  — fetchWithAuth with JWT refresh
lib/types/vendor.ts               — all missing types added (VendorEvent, Client, etc.)
components/OnboardingOverlay.tsx  — first-session intro, tappable prompts, can't-do list
components/ChatThread.tsx         — inline clarify chips
app/wedding/list/[slice]/page.tsx — CRUD delete for all 5 slices, confirmation card
```

---

## Commit history (this session — dream-os)

```
5451d3a — feat(pwa): separate PWA agent engine
b723be5 — feat(auth): POST /refresh endpoint
b02e29d — fix(pwa): guard unchecked writes, 45s timeout, EPIPE guard
8129ebb — fix(sse): absorb res error event, replace .catch() with try/catch
3d5f743 — fix(prompts): delete routing, no thedreamai.in, dreamai app link
a2884f0 — feat(api): DELETE clients/:id and expenses/:id
32bbfb0 — feat(api): PATCH invoices/:id/cancel and events/:id/cancel
641304a — fix(pwa): hard 3-item list limit, no numbered lists
e0ae189 — feat(pwa): cancel_invoice tool, fix walink URL spill
```

---

## Current Railway env vars

- `TWILIO_WHATSAPP_NUMBER` = whatsapp:+917982159047 (vendor)
- `TDW_WA_NUMBER` = 917982159047
- `BRIDE_WA_NUMBER` = 14787788550
- `ANTHROPIC_API_KEY` — model lock: haiku-4-5-20251001 (WhatsApp) + sonnet-4-6 (PWA)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` — in Railway

---

## Known open debt (carry forward)

| Item | Priority |
|---|---|
| Razorpay KYC | High |
| Twilio upgrade to paid | High |
| Morning briefing template submission for +917982159047 | High |
| `send_to_couple` tool (Twilio send to TDW-thread couples) | Medium |
| `schedule_message` + migration 0034 | Medium |
| `hide_client` tool + migration 0034 | Medium |
| True first-token SSE streaming (async generator refactor) | Low |
| Deprecated task tools in brideTools.js | Medium |
| Android/iOS bundle ID `in.thedreamwedding.dreamer` | Low |
| Google Calendar OAuth live sync | Low |
| Instagram DM lead capture | Low |

---

## First thing next session

1. Confirm Railway is stable — no crashes in logs
2. Check Supabase JWT expiry setting (Authentication → Configuration → JWT expiry — raise to 3600 if short)
3. Run smoke tests (see list in session notes)
4. Submit morning briefing Twilio template for +917982159047 if not done

---

## Document update protocol

Five files updated every session, no exceptions:
- `DEVS_HOLY_GRAIL.md` — single source of truth, read before every session
- `HANDOVER.md` — fully rewritten (current state, not history)
- `SCHEMA.md` — updated when migrations run
- `ROADMAP.md` — mark done, add new
- `API_CONTRACTS.md` — updated when endpoints added/changed

