# DEVS_HOLY_GRAIL.md
# The Dream Wedding — Single Source of Truth
**Last updated:** 2026-05-20 (DreamAi PWA Agent session)
**Read this before every session. Every block. No skipping.**

---

## BLOCK 1 — WHO WE ARE

**The Dream Wedding (TDW)** — India's First Wedding OS. Two-sided marketplace + vendor SaaS platform.

**Dev** — CEO & co-founder. Built the entire platform. Background: legal/tax/commercial litigation. Planned his own wedding → founding insight.

**Swati Tomar** — Co-founder (@makeupbyswatiroy). Celebrity MUA. Brand, vendor relationships, supply-side distribution. 10+ years industry relationships.

**Naming locked:** Dreamers = couples. Makers = vendors. `vendor` in DB — never rename DB columns.

---

## BLOCK 2 — REPOS AND INFRASTRUCTURE

| Repo | Stack | Deploy | Purpose |
|---|---|---|---|
| `dream-os` | Node.js/Express | Railway | Backend — WhatsApp webhook, all vendor APIs, PWA agent engine |
| `dreamai` | Next.js PWA | Vercel | Vendor PWA frontend — thedreamai.in |
| `tdw-2` | Next.js + React Native/Expo | Vercel | Couple-facing frontend + native app (reference only in dreamai sessions) |

**Supabase:** `nvzkbagqxbysoeszxent` (Mumbai, ap-south-1)
**Railway:** `https://dream-os-production.up.railway.app`
**Firebase:** `the-dream-wedding-aa214`
**Cloudinary:** `dccso5ljv`, preset `dream_wedding_uploads`

**WhatsApp numbers (permanent):**
- `+917982159047` = vendors, thedreamai.in
- `+14787788550` = brides, thedreamwedding.in

**Test credentials:**
- Test vendor phone: `+918757788550`
- Test vendor UUID: `2eb5d3fb-31eb-4b26-859a-cf10ae477d53`
- Test vendor handle: `DEV550`
- Swati vendor UUID: `e036ea4d-3f9a-4ec5-ba89-a5defa3a042b`, handle: `SWATI978`
- Test couple phone (Meha): `+919625759924`
- Admin password: `Mira@2551354`

---

## BLOCK 3 — THEME AND DESIGN (NEVER TOUCH)

```
🚨 DO NOT TOUCH THE THEME. EVER.

Backgrounds:   #F8F7F5
Cards:         #FFFFFF with 0.5px solid #E2DED8
Gold:          #C9A84C (max 3× per screen)
Muted:         #888580
Ink:           #111111
DreamAi dark:  #0C0A09 (DreamAi tab only dark surface)

Fonts:
  Display:  Cormorant Garamond 300 (NOT Playfair Display)
  Body:     DM Sans 300/400
  UI:       Jost 200/300/400

No dark mode. Ever.
Currency: Rs (never ₹)
```

---

## BLOCK 4 — CODE DELIVERY DISCIPLINE

**Backend (dream-os):**
- All changes via Python string-replacement scripts (`python3 << 'EOF'`)
- Never full file replacement via ZIP for existing files
- `node --check` before every backend commit
- Never replace `server.js` or any existing file via ZIP — patch only
- Run `SELECT column_name FROM information_schema.columns WHERE table_name = 'tablename'` before any INSERT/UPDATE

**Frontend (dreamai / tdw-2):**
- Changes via ZIP with full folder structure
- Run: `unzip -o FILE.zip && cp -r deploy/* . && rm -rf deploy FILE.zip`
- Files dropped to repo root

**Commit format:**
```
feat(scope): description
fix(scope): description
```

**Two Codespaces always open separately:**
- dream-os Codespace
- dreamai Codespace
Never combine terminal blocks.

**CRITICAL — Supabase query pattern:**
- NEVER use `.catch()` on Supabase queries — Supabase JS v2 returns PromiseLike, not Promise. `.catch()` throws "is not a function" and crashes Railway.
- ALWAYS use `{ error }` destructuring or wrap in try/catch:
  ```js
  // CORRECT
  const { data, error } = await supabase.from('table').select('*');
  if (error) return err(error.message);

  // CORRECT
  try {
    const { error } = await supabase.from('table').insert({...});
    if (error) console.error(error.message);
  } catch (e) { console.error(e.message); }

  // WRONG — CRASHES RAILWAY
  await supabase.from('table').insert({...}).catch(e => console.error(e));
  ```

---

## BLOCK 5 — ARCHITECTURE: TWO COMPLETELY SEPARATE AGENT ENGINES

### WhatsApp Vendor Agent (NEVER TOUCH)
```
src/index.js → engine.js → runAgenticTurn()
src/agent/engine.js       — agentic loop
src/agent/tools.js        — tool definitions
src/agent/systemPrompt.js — system prompt
```
- Model: Haiku (simple) or Sonnet (complex) via classifier
- MAX_ITERATIONS: 5
- Timeout: 12s (Twilio webhook budget)
- Has `respond_to_vendor` as terminal tool

### PWA Vendor Agent (dreamai → chat.js → pwaEngine.js)
```
src/api/vendor/chat.js      — HTTP endpoint, SSE streaming
src/agent/pwaEngine.js      — agentic loop (SEPARATE from engine.js)
src/agent/pwaTools.js       — tool definitions (22 tools)
src/agent/pwaSystemPrompt.js — system prompt
```
- Model: Always Sonnet (no classifier — saves 400ms/turn)
- MAX_ITERATIONS: 8
- MAX_COST_USD: $0.50 per turn
- Timeout: 45s per Anthropic call (overrides global 12s)
- NO `respond_to_vendor` tool — model's final text IS the reply
- 15-minute session boundary on history
- Post-write snapshot refetch after any mutation
- SSE streaming: `Accept: text/event-stream` header → streams reply word-by-word
- Response includes: `reply`, `tool_calls`, `contact?`, `clarify?`, `refresh?`

**RULE: Never modify WhatsApp engine files when working on PWA. Never modify PWA engine files when working on WhatsApp. They are completely isolated.**

### Bride Agent (NEVER TOUCH)
```
src/agent/brideEngine.js
src/agent/brideTools.js
src/agent/brideSystemPrompt.js
```
Model: claude-haiku-4-5-20251001 always. Never Sonnet for bride DreamAi.

---

## BLOCK 6 — PWA AGENT: 22 TOOLS

| Tool | Mutates | Notes |
|---|---|---|
| `note_to_self` | ✓ | |
| `create_lead` | ✓ | |
| `list_leads` | ✗ | |
| `update_lead_state` | ✓ | PGRST116 checked |
| `update_conversation_state` | ✓ | PGRST116 checked |
| `create_event` | ✓ | |
| `list_events` | ✗ | |
| `update_event_state` | ✓ | PGRST116 checked |
| `query_day` | ✗ | |
| `hot_dates_context` | ✗ | |
| `create_invoice` | ✓ | |
| `list_invoices` | ✗ | |
| `record_payment` | ✓ | PDF generation, updateErr checked |
| `log_expense` | ✓ | |
| `add_client` | ✓ | |
| `list_clients` | ✗ | |
| `update_routing_handle` | ✓ | |
| `update_invoice_prefix` | ✓ | prefixErr checked |
| `get_my_tdw_link` | ✗ | |
| `generate_client_walink` | ✗ | wa.me link, never sends directly |
| `cancel_invoice` | ✓ | cancel/delete/remove → cancelled state |
| `clarify` | ✗ | disambiguation chips |

**PGRST116 rule:** `update_lead_state`, `update_conversation_state`, `update_event_state` all use `.select().single()` + PGRST116 check. Zero-row updates return honest error, never fake success.

---

## BLOCK 7 — SSE STREAMING PROTOCOL

```
POST /api/v2/vendor/chat
Accept: text/event-stream

← data: {"type":"thinking"}
← data: {"type":"tool_done","tool":"create_lead"}
← data: {"type":"text_delta","text":"Got"}
← data: {"type":"text_delta","text":" it."}
← data: {"type":"done","tool_calls":["create_lead"],"refresh":true}
← data: [DONE]
```

**SSE rules:**
- `res.on('error')` handler MUST exist to absorb `ERR_STREAM_WRITE_AFTER_END`
- `streamDead` flag + `res.writableEnded` check before every `res.write`
- Persistence (messages insert, conversations update) done AFTER `res.end()` via try/catch — NEVER `.catch()`
- Frontend sends `Accept: text/event-stream` to opt in; plain JSON path preserved

---

## BLOCK 8 — API ENDPOINTS (FULL CURRENT LIST)

### Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/api/v2/vendor/auth/send-otp` | |
| POST | `/api/v2/vendor/auth/verify-otp` | Returns access_token, refresh_token, vendor_id, user_id |
| POST | `/api/v2/vendor/auth/pin-login` | |
| POST | `/api/v2/vendor/auth/set-pin` | |
| POST | `/api/v2/vendor/auth/forgot-pin` | |
| POST | `/api/v2/vendor/auth/refresh` | Silent JWT refresh — no auth required |

### Vendor Data (all require auth)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v2/vendor/me` | |
| GET | `/api/v2/vendor/context/:vendorId` | Snapshot for PWA header |
| GET | `/api/v2/vendor/today/:vendorId` | |
| GET | `/api/v2/vendor/leads/:vendorId` | |
| PATCH | `/api/v2/vendor/leads/:leadId/state` | |
| GET | `/api/v2/vendor/clients/:vendorId` | |
| GET | `/api/v2/vendor/clients/:vendorId/:clientId` | |
| DELETE | `/api/v2/vendor/clients/:clientId` | Hard delete, SET NULL cascade safe |
| GET | `/api/v2/vendor/invoices/:vendorId` | |
| PATCH | `/api/v2/vendor/invoices/:invoiceId/cancel` | Cancel = delete for vendor |
| GET | `/api/v2/vendor/expenses/:vendorId` | |
| DELETE | `/api/v2/vendor/expenses/:expenseId` | Hard delete |
| GET | `/api/v2/vendor/events/:vendorId` | |
| PATCH | `/api/v2/vendor/events/:eventId/cancel` | |
| POST | `/api/v2/vendor/chat` | SSE or JSON — PWA agent |

---

## BLOCK 9 — JWT / AUTH FLOW

**Problem solved:** Supabase magic-link sessions expire (can be as short as 5 minutes). Previously caused "Something went wrong" on every message after expiry.

**Fix:**
1. `_base.ts` `fetchWithAuth()` — on 401, calls `/api/v2/vendor/auth/refresh` with stored `refresh_token`, updates localStorage, retries original request once
2. `streamChat()` in `vendor.ts` — separate SSE path also has 401 detection + refresh + retry
3. `/api/v2/vendor/auth/refresh` backend — calls `supabase.auth.refreshSession({ refresh_token })`, returns new `access_token` + `refresh_token`
4. On refresh failure → clear localStorage + redirect to `/wedding/login`

**Supabase JWT expiry setting:** Check Authentication → Configuration → JWT expiry. Raise to 3600 if short.

---

## BLOCK 10 — DREAMAI FRONTEND (dreamai repo)

**Key files:**
```
app/wedding/page.tsx              — main chat page, OnboardingOverlay wired
app/wedding/login/page.tsx        — OTP + PIN login
app/wedding/list/[slice]/page.tsx — list pages with CRUD delete
components/OnboardingOverlay.tsx  — first-session intro overlay
components/ChatThread.tsx         — message list + clarify chips
components/MessageBubble.tsx      — individual message rendering
components/InputBar.tsx           — chat input
components/SuggestionChips.tsx    — context-aware quick action chips
hooks/useChat.ts                  — SSE streaming, refresh, clarify, contact
lib/api/vendor.ts                 — all API calls incl. streamChat()
lib/api/_base.ts                  — fetchWithAuth with JWT refresh
lib/types/vendor.ts               — all TypeScript interfaces
```

**Onboarding overlay:**
- `localStorage` key: `dreamai_onboarding_dismissed`
- "Don't show again" = permanent dismiss
- "Got it" = session dismiss only
- Tapping a prompt chip fires the message AND dismisses

**List page CRUD:**
| Slice | Delete action | Backend |
|---|---|---|
| invoices | PATCH cancel | `invoices.state = 'cancelled'` |
| events | PATCH cancel | `events.state = 'cancelled'` |
| leads | PATCH state | `leads.state = 'lost'` |
| clients | DELETE | Hard delete, cascade SET NULL |
| expenses | DELETE | Hard delete |

**Client rows:** WhatsApp + Call buttons inline (phone required). Don't trigger bottom sheet.

---

## BLOCK 11 — SUBSCRIPTION TIERS

**Vendor tiers:**
- Essential: Rs 499/mo (Recommended for Solo Vendors)
- Signature: Rs 1,999/mo (Recommended for Established Businesses)
- Prestige: Rs 3,999/mo (Invite Only)
- Trial: Before Aug 1 2026 → all new signups get Signature free until Aug 1. After Aug 1 → 30-day Signature trial then auto-downgrade to Essential.

**Couple tiers:**
- Basic (free)
- Gold (Rs 999 one-time)
- Platinum (Rs 2,999 one-time — Couture + DreamAi + Memory Box)

**DreamAi quotas:** Essential 20/mo, Signature 75/mo, Prestige 500/mo, 10 free trial commands.

---

## BLOCK 12 — MONETISATION (6 STREAMS)

1. Vendor subscriptions
2. Couple subscriptions
3. DreamAi WhatsApp tokens (50/Rs 100, 200/Rs 350, 500/Rs 800)
4. Couture appointment fees (Rs 2-5K, 80/20 split)
5. Featured promos
6. Honeymoon commission 10-15%

**Past Client Discount Loop:** Vendors get 10% off subscription per 10 past clients who join AND send at least one enquiry, up to 50% off. Only counts clients imported via client import tool. Consider softening entry to 5 clients = 5% off to trigger early momentum.

---

## BLOCK 13 — SCHEMA SUMMARY

**Latest migration applied:** 0030_landing_assets.sql (2026-05-19)
**No new migrations in the DreamAi PWA session (2026-05-20)**

Key tables: conversations, messages, notes, pending_actions, leads, events, invoices, expenses, clients, muse_saves, circle_members, circle_activity, circle_sessions, couple_tasks, couple_bookings, couple_receipts, vendors, users, couples, hot_dates, vendor_state, couple_state

**Storage buckets:** `cover-photos` (working), `invoices` (working). `vendor-images` does NOT exist.

**Clients table:** No `hidden_at` or `status` column. Hard delete is safe — `leads.client_id` and `invoices.client_id` are SET NULL on delete.

**Invoices state values:** `unpaid`, `advance_paid`, `paid`, `cancelled`
**Events state values:** `upcoming`, `done`, `cancelled`
**Leads state values:** `new`, `contacted`, `quoted`, `booked`, `lost`

---

## BLOCK 14 — OPEN DEBT / DEFERRED

| Item | Blocked by | Priority |
|---|---|---|
| `send_to_couple` tool (Twilio send to TDW-thread couples) | Architecture decision | Medium |
| `schedule_message` tool | `scheduled_actions` table (migration 0034) | Medium |
| True first-token SSE streaming | pwaEngine async generator refactor | Low |
| Android/iOS bundle ID `in.thedreamwedding.dreamer` | `google-services.json` Firebase | Low |
| Co-planner hosting on Vercel | Not configured | Low |
| Razorpay KYC | Pending | High |
| Twilio upgrade to paid | Pending | High |
| Google Calendar OAuth live sync | Deferred post-launch | Low |
| Instagram DM lead capture | Deferred post-launch | Low |
| Deprecated task tools in brideTools.js | Cleanup session | Medium |
| Morning briefing Twilio template submission for +917982159047 | Pending approval | High |

---

## BLOCK 15 — STANDING RULES (CARRY EVERY SESSION)

1. **Model lock:** WhatsApp DreamAi → `claude-haiku-4-5-20251001`. PWA DreamAi → `claude-sonnet-4-6` always. Bride DreamAi → Haiku always. NEVER Sonnet for WhatsApp or bride agents.

2. **Theme:** Permanently locked. See Block 3. No exceptions.

3. **Never `.catch()` on Supabase.** See Block 4. This crashes Railway.

4. **WhatsApp engine isolation:** `engine.js`, `tools.js`, `systemPrompt.js`, `index.js` — never touched in PWA sessions. Zero changes.

5. **Login crash rule (React Native):** Never add `SplashScreen.preventAutoHideAsync()` at module level, font-blocking render, `GoogleSignin.configure()` at module level, or `(tabs)` route conflict. Last working mobile commit: `c72c863`.

6. **Delivery discipline:** Read ALL governance/handover docs before touching code. Verify patches against cloned code. Run `node --check` before every backend commit.

7. **PWA list responses:** Max 3 items inline, prose format (never numbered lists). If more exist: "Check the app for the full list." Never mention thedreamai.in URL in chat replies — vendor is already there.

8. **Invoice cancel = delete:** `cancel`, `delete`, `remove` on an invoice → call `cancel_invoice` tool → `state = 'cancelled'`. Never say "can't delete."

9. **wa.me links:** `generate_client_walink` returns a contact card. The model NEVER puts the raw wa.me URL in the reply text — the frontend renders the button.

10. **Currency:** Rs, never ₹.

