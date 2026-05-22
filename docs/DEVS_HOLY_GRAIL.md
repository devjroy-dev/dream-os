# DEVS_HOLY_GRAIL.md
# The Dream Wedding — Single Source of Truth
**Last updated:** 2026-05-22 (B-6 complete — Dream canvas SSE chat, Surprise Me (Gemini grounded search + Muse tag overlay), Expenses 3-slice canvas, CORS fix, schema 0043 consistency fix)
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
| `dream-os` | Node.js/Express | Railway | Single backend — vendor API, bride API, WhatsApp webhooks, agent engines |
| `dreamai` | Next.js 14 PWA | Vercel | Vendor PWA — thedreamai.in |
| `dreamos-pwa` | Next.js 16 PWA | Vercel | Bride Frost PWA + Admin — thedreamwedding.in |
| `dream-wedding` | Expo/React Native | FROZEN | Legacy. Reference only. Being retired. Never touch. |
| `tdw-2` | Next.js + Expo | FROZEN | Legacy. Reference only. Being retired. Never touch. |

**Supabase:** `nvzkbagqxbysoeszxent` (Mumbai, ap-south-1)
**Railway:** `https://dream-os-production.up.railway.app`
**Firebase:** `the-dream-wedding-aa214`
**Cloudinary:** `dccso5ljv`, preset `dream_wedding_uploads`

**WhatsApp numbers (permanent):**
- `+917982159047` = vendors + thedreamai.in
- `+14787788550` = brides + thedreamwedding.in

**Test credentials:**
- Test vendor phone: `+918757788550`
- Test vendor UUID: `2eb5d3fb-31eb-4b26-859a-cf10ae477d53`
- Test vendor handle: `DEV550`
- Test vendor PIN: `1234`
- Swati vendor UUID: `e036ea4d-3f9a-4ec5-ba89-a5defa3a042b`, handle: `SWATI978`
- Test couple phone: `+919625759924`
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

**Frost PWA (dreamos-pwa) has its own design system — also locked:**
- Sanctuary mode (light) + Dream mode (dark)
- E1/E3 look tokens
- `lib/frost/tokens.ts` — never touch
- Same font stack as above

---

## BLOCK 4 — CODE DELIVERY DISCIPLINE

**Backend (dream-os):**
- All changes via Python string-replacement scripts
- Never full file replacement for existing files
- `node --check` before every backend commit
- Pre-push hook in `.git/hooks/pre-push` — bans `?aiPrimer=` in router.push, runs `node --check` on all changed .js files. Install in every new Codespace.
- Run `SELECT column_name FROM information_schema.columns WHERE table_name = 'tablename'` before any INSERT/UPDATE

**Frontend (dreamai / dreamos-pwa):**
- Python string-replacement scripts for .tsx files — NEVER sed on TSX (nested backticks break)
- `npx tsc --noEmit` before every frontend commit
- Pre-push hook in `.git/hooks/pre-push` — runs tsc, bans `?aiPrimer=` in router.push

**Commit format:**
```
feat(scope): description
fix(scope): description
```

**Three Codespaces always open separately:**
- dream-os Codespace
- dreamai Codespace
- dreamos-pwa Codespace
Never combine terminal blocks across repos.

**CRITICAL — Supabase query pattern:**
- NEVER use `.catch()` on Supabase queries — crashes Railway.
- ALWAYS use `{ error }` destructuring or wrap in try/catch.

---

## BLOCK 5 — ARCHITECTURE: FOUR AGENT ENGINES

### WhatsApp Vendor Agent (NEVER TOUCH)
```
src/index.js → engine.js → runAgenticTurn()
src/agent/engine.js        — agentic loop
src/agent/tools.js         — tool definitions
src/agent/systemPrompt.js  — system prompt
```
- Model: Haiku (simple) or Sonnet (complex) via classifier
- MAX_ITERATIONS: 5 — Timeout: 12s

### PWA Vendor Agent (dreamai → chat.js → pwaEngine.js)
```
src/api/vendor/chat.js       — HTTP endpoint, SSE streaming
src/agent/pwaEngine.js       — agentic loop (SEPARATE from engine.js)
src/agent/pwaTools.js        — tool definitions (28 tools as of Block 7)
src/agent/pwaSystemPrompt.js — system prompt
```
- Model: Always `claude-sonnet-4-6` (never Haiku)
- MAX_ITERATIONS: 8 — MAX_COST_USD: $0.50/turn — Timeout: 45s
- SSE streaming: `Accept: text/event-stream` header

### Bride Agent (NEVER TOUCH)
```
src/agent/brideEngine.js
src/agent/brideTools.js
src/agent/brideSystemPrompt.js
```
- Model: `claude-haiku-4-5-20251001` always. NEVER Sonnet.
- Entry: `src/brideIndex.js` (separate from vendor index.js)

### Circle Member Agent (NEVER TOUCH)
```
src/agent/circleEngine.js
src/agent/circleSystemPrompt.js
```
- Model: Haiku always. Max 3 iterations. Max 400 tokens.
- Only tools: `list_muse`, `delete_muse_save`
- Entry: `src/brideIndex.js` (routed by phone match on circle_members table)

**RULE: Never modify WhatsApp engine files when working on PWA. Never modify PWA engine files when working on WhatsApp. All four engines are completely isolated.**

---

## BLOCK 6 — PWA AGENT: 28 TOOLS (as of Block 7)

### Original 22 tools (Block 1a)
`note_to_self`, `create_lead`, `list_leads`, `update_lead_state`, `update_conversation_state`,
`create_event`, `list_events`, `update_event_state`, `query_day`, `hot_dates_context`,
`create_invoice`, `list_invoices`, `record_payment`, `log_expense`, `add_client`,
`list_clients`, `update_routing_handle`, `update_invoice_prefix`, `get_my_tdw_link`,
`generate_client_walink`, `cancel_invoice`, `clarify`

### Added in later blocks
`update_lead`, `lose_lead`, `update_client`, `delete_client`, `update_invoice`,
`update_expense`, `delete_event`, `block_date`, `unblock_date`, `list_availability`,
`create_schedule`, `mark_milestone_paid`, `attach_contract`, `list_contracts`,
`log_tds`, `query_tds_summary`, `assign_task`, `team_pay`, `pin_team_message`,
`team_briefing`, `list_expenses`, `list_team`

---

## BLOCK 7 — SSE STREAMING PROTOCOL (vendor chat)

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

- `res.on('error')` handler MUST exist
- `streamDead` flag + `res.writableEnded` check before every `res.write`
- Persistence done AFTER `res.end()` via try/catch — NEVER `.catch()`

---

## BLOCK 8 — VENDOR API ENDPOINTS (complete as of Block 7)

### Auth
`POST /api/v2/vendor/auth/send-otp`
`POST /api/v2/vendor/auth/verify-otp`
`POST /api/v2/vendor/auth/pin-login`
`POST /api/v2/vendor/auth/set-pin`
`POST /api/v2/vendor/auth/forgot-pin`
`POST /api/v2/vendor/auth/refresh`

### Vendor data (all require auth)
Leads, clients, invoices, expenses, events, me/profile, availability, schedules,
contracts, tds, portfolio, discover, couture, featured, studio (team/tasks/payments/messages/briefing),
today, context, hot-dates (public), chat (SSE).

### Couple auth (built, data endpoints pending)
`POST /api/v2/couple/auth/send-otp`
`POST /api/v2/couple/auth/verify-otp`
`POST /api/v2/couple/auth/pin-login`
`POST /api/v2/couple/auth/set-pin`
`POST /api/v2/couple/auth/forgot-pin`

### Admin
`/api/v2/admin/discover/*` — discover queue, grant, deny, revoke, photo approve
`/api/v2/admin/featured/*` — featured queue
`/api/v2/admin/couture/*` — couture admin
`/api/v2/admin/photos/*`  — portfolio photos

---

## BLOCK 9 — JWT / AUTH FLOW

**Vendor auth (dreamai):**
- `_base.ts` `fetchWithAuth()` — on 401, calls `/api/v2/vendor/auth/refresh`, retries once
- `streamChat()` in `vendor.ts` — separate SSE path with 401 detection + refresh + retry
- On refresh failure → clear localStorage + redirect to `/wedding/login`
- Session key: `vendor_session` in localStorage

**Vendor SSO (thedreamwedding.in → thedreamai.in):**
- Vendor logs in at thedreamwedding.in (dreamos-pwa auth flow)
- After PIN → redirects to `thedreamai.in/wedding/auth/handoff?token=...&refresh=...`
- Handoff page (`app/wedding/auth/handoff/page.tsx` in dreamai) reads JWT, calls `/me`, writes `vendor_session` to localStorage, redirects to `/wedding`
- Single sign-in. No second login required.

**🚨 AUTH FLOW IN DREAMOS-PWA — NEVER TOUCH:**
```
app/(auth)/couple/...   — couple OTP + PIN login
app/(auth)/vendor/...   — vendor OTP + PIN login (redirects to dreamai via SSO)
app/(landing)/page.tsx  — Dreamer/Maker choice + OTP entry
```
These files must not be deleted or modified when removing legacy route groups.
The `(auth)` route group is independent of `(vendor)` and `(bride)` — it stays forever.

**Legacy vendor routes in dreamos-pwa (BEING RETIRED):**
```
app/(vendor)/vendor/*   — legacy vendor screens. DEAD ROUTES after SSO wired.
                          DO NOT DELETE YET — wait until thedreamai.in confirmed stable.
                          When deleting: only delete (vendor) group, never (auth).
app/(bride)/*           — legacy couple screens. Being replaced by (frost).
                          DO NOT DELETE until Frost bride blocks complete.
```

---

## BLOCK 10 — DREAMAI FRONTEND (vendor PWA)

**Key files:**
```
app/wedding/page.tsx                    — main chat page
app/wedding/login/page.tsx              — OTP + PIN login (direct vendor login)
app/wedding/auth/handoff/page.tsx       — SSO handoff from thedreamwedding.in ← NEW
app/wedding/list/[slice]/page.tsx       — list pages (leads/clients/invoices/expenses/events)
app/wedding/settings/page.tsx           — vendor settings
app/wedding/calendar/page.tsx           — calendar + availability + cancel events
app/wedding/studio/page.tsx             — Studio hub (Prestige only)
app/wedding/studio/team/page.tsx        — Team management
app/wedding/studio/tasks/page.tsx       — Team tasks
app/wedding/studio/team-payments/page.tsx — Team payments
app/wedding/contracts/page.tsx          — Contracts
app/wedding/tds/page.tsx                — TDS ledger
app/wedding/portfolio/page.tsx          — Portfolio
app/wedding/discover/page.tsx           — Discover status
app/wedding/couture/page.tsx            — Couture programme
app/wedding/featured/page.tsx           — Featured promos
```

**Edit flow law (CRITICAL — read EDIT_FLOW_LAW.md before touching):**
- "Edit here" → form → Save → direct REST PATCH. Never opens chat.
- "Via chat" → opens chat with `?aiPrimer=` so agent gets context silently.
- `?aiPrimer=` injects context silently. `?primer=&autoSend=1` sends visible vendor message.
- Never use sed on .tsx files. Use Python string replacement only.
- Never put `router.push` inside AddSheet `submit()` function.

---

## BLOCK 11 — DREAMOS-PWA FRONTEND (bride Frost PWA)

**Route groups:**
```
app/(frost)/frost/          — Frost bride PWA (active, being wired to backend)
app/(auth)/                 — Auth flow (PERMANENT — never delete)
app/(landing)/              — Landing page with Dreamer/Maker choice (PERMANENT)
app/(vendor)/vendor/*       — Legacy vendor screens (RETIRING — do not modify)
app/(bride)/*               — Legacy couple screens (RETIRING — being replaced by frost)
app/admin/*                 — Admin panel (25 pages — partially wired)
app/coplanner/*             — Circle member surface
app/circle/join/[token]/    — Circle invite claim page (LIVE — wired to dream-os)
```

**Frost canvases:**
```
app/(frost)/frost/page.tsx                    — landing (Sanctuary/Dream modes)
app/(frost)/frost/canvas/discover/page.tsx    — swipe feed (seed data → wiring in B-2)
app/(frost)/frost/canvas/dream/page.tsx       — DreamAi chat (mock → wiring in B-6)
app/(frost)/frost/canvas/muse/page.tsx        — mood board (mock → wiring in B-2)
app/(frost)/frost/canvas/journey/page.tsx     — journey hub
app/(frost)/frost/canvas/journey/circle/      — circle (mock → wiring in B-4)
app/(frost)/frost/canvas/journey/events/      — events (mock → wiring in B-4)
app/(frost)/frost/canvas/journey/expenses/    — expenses (mock → wiring in B-4)
app/(frost)/frost/canvas/journey/vendors/     — bookings (mock → wiring in B-4)
```

**Frost design — LOCKED:**
- Sanctuary mode (light) + Dream mode (dark). E1/E3 look tokens.
- `lib/frost/tokens.ts` — never touch.
- No new canvases. No layout changes. Wire existing canvases to real backend only.

---

## BLOCK 12 — SUBSCRIPTION TIERS

**Vendor tiers:**
- Essential: Rs 499/mo
- Signature: Rs 1,999/mo
- Prestige: Rs 3,999/mo (Invite Only)
- Trial: Before Aug 1 2026 → all new signups get Signature free. After Aug 1 → 30-day Signature then Essential.

**Couple tiers:**
- Basic (free)
- Gold (Rs 999 one-time)
- Platinum (Rs 2,999 one-time)

**DreamAi quotas:** Essential 20/mo, Signature 75/mo, Prestige 500/mo, 10 free trial.

---

## BLOCK 13 — MONETISATION (6 STREAMS)

1. Vendor subscriptions
2. Couple subscriptions
3. DreamAi WhatsApp tokens (50/Rs 100, 200/Rs 350, 500/Rs 800)
4. Couture appointment fees (Rs 2-5K, 80/20 split)
5. Featured promos
6. Honeymoon commission 10-15%

---

## BLOCK 14 — SCHEMA SUMMARY

**Latest migrations applied:** 0042_couple_data.sql (no new migration in B-3a)
**Block 7 tables (applied out of band):** `payment_schedules`, `contracts`, `tds_ledger`
**Block 6 tables (applied out of band):** `team_members`, `team_tasks`, `team_payments`, `team_messages`

Key tables: conversations, messages, notes, leads, events, invoices, expenses, clients,
muse_saves, circle_members, circle_activity, circle_sessions, couple_tasks, couple_bookings,
couple_receipts, vendors, users, couples, hot_dates, vendor_state,
payment_schedules, contracts, tds_ledger, team_members, team_tasks, team_payments, team_messages,
vendor_discover_requests, vendor_portfolio, vendor_featured_submissions

**Key column:** `vendors.discover_eligible` — gates vendor appearing in bride's Frost discover feed.
Set to `true` via admin grant. Test vendor already set: `UPDATE vendors SET discover_eligible=true WHERE id='2eb5d3fb-...'`

**B-F/B-1 columns added (0040 + 0041):**
- `couples`: no new columns added (wedding_date, wedding_city, budget_total, partner_name, events_planned, planning_state existed since 0001_initial_schema.sql)
- `vendors`: about (text) — vendor bio for discover feed
- `muse_saves`: circle_comment_count (integer, default 0)
- `muse_saves`: image_url populated on save — each photo is a distinct save (vendor_id + image_url duplicate check)

**Invoices state values:** `unpaid`, `advance_paid`, `paid`, `cancelled`
**Events state values:** `upcoming`, `done`, `cancelled`
**Leads state values:** `new`, `contacted`, `quoted`, `booked`, `lost`
**circle_members status:** `pending`, `active`, `removed`

---

## BLOCK 15 — WHAT COMES NEXT

### Current block status

| Block | Repo | Status |
|---|---|---|
| Vendor F | dream-os | ✅ Done |
| Vendor 1a | dream-os | ✅ Done |
| Vendor 1b | dreamai | ✅ Done |
| Vendor 1c | dreamai | ✅ Done |
| Vendor 2 (Push) | — | ⏭ Dropped |
| Vendor 3 (Lead detail) | both | ✅ Done |
| Vendor 4 (Razorpay) | both | ⬜ Pending KYC |
| Vendor 5 (Discover) | both | ✅ Done |
| Vendor 6 (Studio) | both | ✅ Done |
| Vendor 7 (Schedules/Contracts/TDS) | both | ✅ Done |
| **Bride B-F** | dream-os | ✅ Done |
| **Bride B-1** | dream-os | ✅ Done |
| Bride B-2a (Discover landing) | dreamos-pwa | ⏭ Merged into B-2 |
| **Bride B-2** (Wire discover + muse) | dreamos-pwa | ✅ Done |
| Bride B-3 (Couple data API) | dream-os | ✅ Done |
| Bride B-3a (Coplanner API) | dream-os | ✅ Done |
| Bride B-4 | dreamos-pwa | ✅ Done |
| Bride B-5 | dream-os | ✅ Done |
| Bride B-6 | dreamos-pwa | ✅ Done |
| Bride B-Admin | both | ⬜ Next — start here |

### Bride block sequence

```
B-F ✅ → B-1 → B-2a → B-2 → B-3 → B-3a → B-4 → B-5 → B-6 → B-Admin
```

Each depends on the previous:
- B-2a (discover landing) before B-2 (wire swipe feed)
- B-3a (coplanner API) after B-3 — needs circle_comment_count trigger from B-3 migration
- B-2, B-4, B-6 cannot start until preceding backend block is smoke-tested from curl

**Spec files (all in dream-os/docs/):**
BRIDE_ROADMAP.md, BRIDE_BLOCK_F_SPEC.md, BRIDE_BLOCK_1_SPEC.md,
BRIDE_BLOCK_2a_SPEC.md, BRIDE_BLOCK_2_SPEC.md, BRIDE_BLOCK_2_MUSE_AMENDMENT.md,
BRIDE_BLOCK_3_SPEC.md, BRIDE_BLOCK_3a_SPEC.md, BRIDE_BLOCK_4_SPEC.md,
BRIDE_BLOCK_5_SPEC.md, BRIDE_BLOCK_6_SPEC.md, BRIDE_BLOCK_ADMIN_SPEC.md





### Session close rule — every session, no exceptions

At the end of every session:
1. Tick completed blocks in the status table (⬜ → ✅)
2. Move "Next — start here" to the next block
3. Add new bugs to coding debt table
4. Run `python3 update_holy_grail.py` and commit:
   `git add docs/DEVS_HOLY_GRAIL.md && git commit -m "docs: Holy Grail — Block X complete"`

### How to run bride sessions

Every bride session starts with three files:
1. This Holy Grail
2. `SESSION_HACK_SHEET.md`
3. The spec file for the current block (e.g. `BRIDE_BLOCK_1_SPEC.md`)

Say "build this" and the session starts.

All bride spec files live in `dream-os/docs/`:
- `BRIDE_ROADMAP.md`
- `BRIDE_BLOCK_F_SPEC.md` through `BRIDE_BLOCK_ADMIN_SPEC.md`

### Bride block sequence

```
B-F → B-1 → B-2 → B-3 → B-4 → B-5 → B-6 → B-Admin
```

Each depends on the previous. B-2 cannot start until B-1 endpoints are smoke-tested from curl.
B-4 cannot start until B-3 endpoints are smoke-tested from curl.
B-6 cannot start until B-5 smoke-tested.

### Infrastructure open debt

| Item | Priority |
|---|---|
| Razorpay KYC | High — needed before Vendor Block 4 |
| Twilio upgrade to paid | High — needed before scaling |
| Morning briefing template approval (+917982159047) | High — pending |
| `thedreamwedding.in` pointed at dreamos-pwa on Vercel | ✅ Done |

### Coding open debt

| Item | Priority |
|---|---|
| `PATCH /leads/:leadId` full update agent tool (updateLead in pwaTools) | Medium |
| B-3a coplanner auth — `GET /frost/circle/feed` and `GET /frost/circle/threads` validate brideId only, not caller identity. Add userId query param validation before public launch. | High — pre-launch |
| `GET /leads/:leadId/detail` endpoint | Medium |
| Vendor Block 4 (Razorpay) — build in test mode | After KYC |
| Via chat primer — agent gets context but vendor sees own bubble | Parked |
| True first-token SSE streaming (pwaEngine async generator) | Low |
| Google Calendar OAuth live sync | Low |
| Instagram DM lead capture | Low |
| Expenses canvas — My Expenses / Receipt Tracker filter by image_url needs clean patch next session | High — B-Admin |
| Surprise Me — Gemini grounded search returns page URLs not direct image URLs — may need image extraction layer | Medium — B-Surprise |
| Surprise Me — Admin image pool UI (replace Unsplash placeholders with real editorial images) | Medium — B-Admin |
| taste_quiz_images table still exists in Supabase — DROP TABLE taste_quiz_images in next migration | Low |
| Circle member delete REST endpoint — no `DELETE /couple/circle/:memberId` exists. Cleanup via Supabase SQL only. | Medium — pre-launch |
| Moments — photograph classification branch not yet in imagePipeline. personal photos vs product saves need separation. | Medium — B-Moments block |

---

## BLOCK 16 — STANDING RULES (CARRY EVERY SESSION)

1. **Model lock:**
   - WhatsApp vendor agent → Haiku or Sonnet via classifier
   - PWA vendor agent → `claude-sonnet-4-6` always
   - Bride agent → `claude-haiku-4-5-20251001` always. NEVER Sonnet.
   - Circle agent → Haiku always.

2. **Theme + Frost design:** Permanently locked. No exceptions.

3. **Never `.catch()` on Supabase.** Crashes Railway.

4. **Agent isolation:** Four engines. Never cross-modify. WhatsApp, PWA vendor, bride, circle — completely isolated.

5. **Auth flow in dreamos-pwa is permanent.** `app/(auth)/*` and `app/(landing)/page.tsx` are never deleted or modified when retiring legacy route groups. The `(vendor)` and `(bride)` groups are retiring — `(auth)` stays forever.

6. **Vendor route groups in dreamos-pwa are retiring.** `app/(vendor)/vendor/*` — do not modify. Do not delete until `thedreamai.in` is confirmed stable for all vendors. When deleting: delete only `(vendor)`, never `(auth)`.

7. **Frost canvases — wire only, never redesign.** No new canvases. No layout changes. Swap mocks for real API calls only.

8. **Edit flow law (see EDIT_FLOW_LAW.md):**
   - "Edit here" → form → REST PATCH. Never routes to chat.
   - "Via chat" → `?aiPrimer=` (context injected silently).
   - Never sed on .tsx. Python string replacement only.
   - Never put router.push inside AddSheet submit().

9. **Enquire link format:** `https://wa.me/917982159047?text=TDW-{routing_handle}`
   Always use the vendor WhatsApp number. Always TDW- prefix. Never expose raw phone numbers.

10. **discover_eligible = true** gates vendor appearing in bride's Frost discover feed.
    Set via admin grant (`POST /api/v2/admin/discover/grant/:vendorId`).

11. **Currency:** Rs, never ₹.

12. **Invoice cancel = delete:** `cancel`, `delete`, `remove` → `cancel_invoice` tool → `state = 'cancelled'`.

13. **wa.me links:** `generate_client_walink` returns contact card. Model never puts raw wa.me URL in reply text.

14. **PWA list responses:** Max 3 items inline, prose format. Never numbered lists.

15. **Node check + tsc before every push.** Pre-push hooks enforce this. If bypassed, prod breaks.

16. **Circle 3-member cap.** Enforced in Postgres via `invite_circle_member()` RPC. Never bypass in API.
