# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-21 (Block 3 session close)
**Session:** Block 3 — Lead detail: vendor summary card + couple conversation thread + WhatsApp/Call buttons
**Version:** 0.10.3-alpha
**HEAD (dream-os):** see git log
**HEAD (dreamai):** see git log
**HEAD (dreamos-pwa):** 31a3b11 (unchanged)
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Repo backend:** https://github.com/devjroy-dev/dream-os
**Repo vendor PWA alpha:** https://github.com/devjroy-dev/dreamai
**Repo PWA shell:** https://github.com/devjroy-dev/dreamos-pwa
**Vercel (dreamai):** https://thedreamai.in

Read this first. Then ROADMAP_FINAL.md. Then SCHEMA.md. Then API_CONTRACTS.md.

---

## Phase 1 — complete (0.10.0-alpha)
## P2-1 through P2-6a — complete

All history in previous HANDOVER_FINAL.md commits. See git log.

---

## Block 3 — 2026-05-21 (this session)

### What Block 3 is

Lead detail view — surfaces the WhatsApp conversation between the couple and DreamAi alongside the lead in dreamai. Vendor taps a lead, sees the full enquiry conversation, summary, and can WhatsApp or call the bride directly. No reply surface built — vendor continues on WhatsApp. Read-only, clean.

### What shipped

**dream-os:**
- `GET /api/v2/vendor/leads/:leadId/detail` — new endpoint returning lead, vendor_summary, conversation (last 20 non-system messages from couple_thread), linked invoices, linked events
- Route order fixed: `GET /:leadId/detail` moved before `GET /:vendorId` to prevent Express param shadowing
- `phone` added to leads list `dataSelect` and response mapping (was selected but dropped)
- `leads.vendor_summary` column added (migration 0036) — denormalised WhatsApp notification text written at lead creation
- `src/index.js` patched to write `vendor_summary` from `result.vendorNotification` after couple agent runs

**dreamai:**
- `ConversationThread.tsx` — new read-only component, alternating inbound/outbound bubbles, gold summary card at top
- `fetchLeadDetail()` function already existed from Block 1b; mock updated to return full shape
- `Lead` type updated with `phone` field (was missing)
- `ConversationMessage` + full `LeadDetailResponse` types added
- Slice list page: lead rows tap → fires `fetchLeadDetail` in background, renders summary + conversation in bottom sheet
- WhatsApp + Call buttons rendered in fixed action area (above Edit/Delete) when lead has phone
- Sheet `maxHeight` increased from `70dvh` to `88dvh`

**Migration 0034 (retrospective):**
- `0034_vendor_profile_fields.sql` created as historical record — columns were applied directly to prod during Block F. Now committed to source control.

### Open items from this session
- `leads.vendor_summary` is null for all existing leads (predates the column). Only new WhatsApp enquiries will populate it going forward.
- `PATCH /leads/:leadId` (full update) exists in dream-os (commit a003802) but no agent tool yet — leads edit in dreamai routes to chat.

### Key commits this session (dream-os)
- `165f430` fix(api): include phone in leads list response mapping
- `652ae3f` fix(api): add phone to leads list select
- `ae60b8a` fix(api): move GET /leads/:id/detail before /:vendorId to avoid route shadowing
- `650625f` feat(api): GET /leads/:id/detail — vendor_summary + conversation + linked records (Block 3)

---

## P2-6b-alpha — 2026-05-20 (this session)

### What P2-6b-alpha is

On founder's order, the session sequence was changed after P2-6a. dreamos-pwa (P2-6b proper) was deferred. dreamai — the existing vendor chat PWA at devjroy-dev/dreamai — was adopted as the vendor PWA alpha surface, wired directly to dream-os backend. This session re-skinned it with the dark glass design system and built all the AI chat wiring.

dreamai is a Next.js 14 / React 18 / Tailwind v4 / TypeScript app. It is NOT dreamos-pwa. Separate repo, separate Vercel deployment, separate domain (thedreamai.in). It was already live with the old dream-wedding backend. This session re-skinned it and wired it to dream-os.

dreamos-pwa remains the long-term vendor + bride PWA shell. dreamai is the vendor-only alpha.

---

### dream-os changes this session

**Current HEAD: 3b975df — "revert: restore d373c5c state"**

Net state of dream-os vs P2-6a (716f545):

**src/index.js** — CORS additions only:
- Added `https://thedreamai.in`, `https://www.thedreamai.in`
- Added GitHub Codespaces regex
- Added dreamai Vercel previews regex
- Nothing else touched in index.js

**src/api/vendor/chat.js** — AT d373c5c STATE:
- Accepts `body.ai_primer` — persists as outbound assistant message before vendor's reply so engine reads full edit context from DB history
- Passes `channel: 'web'` to runAgenticTurn (suppresses cross-surface WhatsApp sends)
- This is the only backend change that touches the agent path

**src/agent/engine.js** — REVERTED TO d373c5c:
- Original engine, unchanged from P2-6a
- No web fast path, no WEB_SURFACE_ADDENDUM, no finalContact
- Full classifier → Haiku/Sonnet routing on all channels including web
- Same agent behaviour on PWA as WhatsApp

**src/agent/systemPrompt.js** — REVERTED TO d373c5c:
- Original system prompt, unchanged from P2-6a
- No WEB_SURFACE_ADDENDUM exported or used

**src/agent/tools.js** — REVERTED TO d373c5c:
- Original tools, unchanged from P2-6a
- No contact field in respond_to_vendor

**dream-os commits this session:**
- c98b1ea fix(cors): add Codespaces + thedreamai.in to CORS allowlist
- d373c5c feat(chat): persist ai_primer as assistant context before vendor reply
- 5bbed6a feat: web surface voice [SUPERSEDED — reverted]
- b37585a feat: web fast path, CORS, ai_primer, voice [SUPERSEDED — reverted]
- a48e24d feat: WhatsApp+Call buttons via contact field [SUPERSEDED — reverted]
- 2abff3a feat: WhatsApp+Call buttons on drafted messages [writer file only]
- f6ac896 fix: one-turn draft [SUPERSEDED — reverted]
- 9c4f220 revert: restore original WhatsApp agent engine and system prompt [partial revert]
- 3b975df revert: restore d373c5c state [CURRENT HEAD — full clean revert]

**What this means:** dream-os at HEAD is exactly P2-6a plus CORS and ai_primer in chat.js. The original WhatsApp agent is intact and untouched.

---

### dreamai changes this session (devjroy-dev/dreamai)

**Current HEAD: 166a308**

Complete re-skin and re-wire of the existing dreamai Next.js app.

**Design system — dark glass:**
- Background: `linear-gradient(160deg, #0E0D0B 0%, #111111 45%, #0D0E0B 100%)`
- All panels: `backdrop-filter: blur()` + `rgba(255,255,255,0.03-0.08)` fills
- Typography: Cormorant Garamond 300 (display), DM Sans 300/400 (body), Jost 200/300 (labels)
- Gold: `#C9A84C`

**Screens:** Login (phone+OTP), Chat (/wedding), Calendar, Studio hub (/wedding/list), Studio drilldowns (/wedding/list/[slice])

**Key components:**
- `Header` — glass, profile circle (gold ring + initials), compact snapshot chevron dropdown (counts only — overdue, pending invoices, new enquiries, upcoming shoots). Gold dot when urgent. Closes on outside tap.
- `BottomNav` — Calendar / Chat (centred) / Studio
- `MessageBubble` — user: gold bubble. AI: `#1C1C1C` glass + Cormorant 17px.
- `SuggestionChips` — context-driven from real backend data
- `InputBar`, `ChatThread`, `ActionCard`

**Data layer:**
- `lib/api/_base.ts` — JWT attach, base URL defaults to `dream-os-production.up.railway.app`
- `lib/api/vendor.ts` — one function per endpoint. `sendChat` accepts optional `ai_primer`
- `lib/types/vendor.ts` — all response shapes

**hooks/useChat.ts:**
- Briefing fires as first AI message only when urgent (overdue invoices, new leads, today events). Empty thread if all clear.
- Briefing respects injected messages — `setMessages(prev => prev.length === 0 ? [briefing] : prev)`. If aiPrimer already injected before context loads, briefing stays silent.
- `pendingPrimerRef` — ai_primer sent with first backend call after inject, then cleared

**Auth:** Phone → WhatsApp OTP → JWT stored in localStorage. PIN flow deferred.

**Known issues / pending:**
1. **JWT expiry** — Supabase magic link JWTs expire in ~1 hour. `_base.ts` has no token refresh logic. Vendor must re-login when session expires. Fix needed: add `tryRefresh` to `_base.ts` using stored `refresh_token`. This is the top priority for next session.
2. **Vendor name** — `session.name` is null post-OTP-login. Header shows "Vendor". Need `GET /api/v2/vendor/me` call after login to enrich session.
3. **Delete tools** — `delete_event`, `delete_invoice`, `delete_lead`, `delete_client`, `delete_expense` not in tools.js. Studio delete button flow works (passes UUID directly). Chat delete flow fails — agent can't execute.
4. **list_events/list_leads/list_clients/list_invoices** — don't return IDs in their string output. Agent can't delete/update by name via chat — asks for phone number or UUID. Fix: add `(id: ${e.id})` to each list tool return string in engine.js.
5. **Anthropic 529 overload** — PWA chat has no retry on 529. WhatsApp webhook retries. When Anthropic is overloaded, PWA shows "Something went wrong" while WhatsApp recovers. Fix: add retry loop to chat.js for 529 errors.
6. **Session history pollution** — `vendor_self` conversation accumulates all messages forever. Agent reads last 10 from DB — could be from yesterday's session, polluting current context. WhatsApp unaffected (each WA conversation is scoped). Fix: on `channel === 'web'`, use frontend session history instead of DB history.

**dreamai commits this session:**
- 51d4607 feat: dark glass UI, phone+OTP auth, wired to dream-os
- be326a7 feat(chat): send ai_primer to backend for targeted edit responses
- edd7957 fix: useVendorData cast for Vercel build
- a129f83 feat: briefing-as-message, no snapshot panel, fast
- 5ec027e feat: WhatsApp+Call buttons, contact field [partially superseded]
- e3a17bd fix: briefing does not overwrite injected aiPrimer message
- 55da0ae fix: remove loading text below search bar on Studio slices
- 166a308 feat: compact snapshot dropdown in header

---

### Key decisions locked this session

- **dreamai is the vendor PWA alpha.** devjroy-dev/dreamai → thedreamai.in. Separate from dreamos-pwa.
- **Same agent as WhatsApp.** No web-specific engine changes. dream-os engine.js and systemPrompt.js are identical to P2-6a. The PWA gets the same intelligence, same voice, same Haiku/Sonnet routing as WhatsApp.
- **ai_primer pattern locked.** Edit flows pass context to backend as assistant message before vendor reply — agent has full edit context, gives targeted response.
- **Briefing-as-message pattern locked.** No snapshot panel. Context fires as first AI message when urgent. Empty thread if all clear.
- **Compact snapshot dropdown.** Counts only (overdue invoices, pending invoices, new enquiries, upcoming shoots). Gold dot when urgent. Lives in the header next to vendor name. Same glass pattern as profile dropdown.
- **Studio = List.** Renamed everywhere. Route stays `/wedding/list`.
- **Auth: phone + OTP only.** PIN login deferred. Returning user PIN flow in later session.
- **WhatsApp unchanged.** All backend changes either additive (CORS) or channel-gated (ai_primer, channel:'web'). Zero impact on WhatsApp agent behaviour, voice, or routing.

---

### What is next (priority order)

**Immediate — next session:**
1. JWT auto-refresh in `_base.ts` — add `tryRefresh` using stored refresh_token. Vendor should never need to re-login manually.
2. Vendor name enrichment — call `/api/v2/vendor/me` after login, store name in session. Header shows "Vendor" currently.
3. 529 retry in `chat.js` — retry up to 2x on overloaded_error before returning failure.
4. Session history fix — on `channel === 'web'`, pass frontend history array to engine instead of reading from DB.
5. List tools with IDs — add `(id: ${e.id})` to list_events, list_leads, list_clients, list_invoices return strings in engine.js.

**After fixes verified:**
- P2-6b proper (dreamos-pwa vendor screens)
- P2-7a bride/couple core endpoints
- P2-7b bride PWA screens

---

### Migration status (no changes this session)

Last applied: 0033. No new migrations in P2-6b-alpha.

| # | File | Status | What it adds |
|---|---|---|---|
| 0001–0033 | applied | ✅ | Full history in SCHEMA.md |
| 0034 | next when needed | ⏳ | TBD |

---

### Test credentials

| Item | Value |
|---|---|
| Vendor WhatsApp | +917982159047 |
| Bride WhatsApp | +14787788550 |
| Test vendor phone (Dev) | +918757788550 |
| Test vendor UUID | 2eb5d3fb-31eb-4b26-859a-cf10ae477d53 |
| Test vendor handle | DEV550 |
| Second test vendor (Swati) | SWATI978 / UUID e036ea4d-3f9a-4ec5-ba89-a5defa3a042b |
| Test bride phone (Swati) | +919888294440 |
| Test bride couple_id | 7abccc1b-0698-43ba-9709-c6a1e52af789 |
| Test bride phone (Meha) | +919625759924 |
| Malaysian test bride | +60122687535 / couple_id 285ccb5a-01f0-4873-829c-aac66377c890 |
| Supabase | nvzkbagqxbysoeszxent (Mumbai, ap-south-1) |
| Railway vendor | https://dream-os-production.up.railway.app |
| Railway bride | https://dream-wedding-production-6cef.up.railway.app |
| Admin | https://dream-os-production.up.railway.app/admin |
| Vercel dreamai | https://thedreamai.in |
| Vercel dreamos-pwa | https://dreamos-pwa.vercel.app |
| Cloudinary | dccso5ljv |
| Anthropic workspace | dream-os (Tier 2) |

---

### Env vars

Railway (dream-os):
```
TWILIO_WHATSAPP_NUMBER       whatsapp:+917982159047
TWILIO_ACCOUNT_SID           (in Railway)
TWILIO_AUTH_TOKEN            (in Railway)
TDW_WA_NUMBER                917982159047
BRIDE_WA_NUMBER              14787788550
ANTHROPIC_API_KEY            workspace: dream-os
GOOGLE_API_KEY               Google AI Studio
ADMIN_PASSWORD               (in Railway)
SUPABASE_URL                 nvzkbagqxbysoeszxent
SUPABASE_SERVICE_ROLE_KEY    service_role, never expose
```

Vercel (dreamai — thedreamai.in):
```
NEXT_PUBLIC_API_BASE = https://dream-os-production.up.railway.app
NEXT_PUBLIC_USE_MOCKS = false
```

---

### Document discipline

Active (updated every session):
  HANDOVER_FINAL.md — this file, fully rewritten each session
  ROADMAP_FINAL.md  — single active roadmap
  SCHEMA.md         — unified schema reference

Frozen (do not update):
  HANDOVER.md, HANDOVER_BRIDE.md — frozen at 8.5a and B3
  ROADMAP.md, ROADMAP_BRIDE.md   — frozen at 8.5a and B3
