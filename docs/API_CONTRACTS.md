## Frontend implementation pattern — MANDATORY for all frontend sessions

dreamos-pwa must use a typed API client. No raw fetch() calls in screen components.
This is the required file structure before wiring any screen:

```
lib/
  api/
    _base.ts      <- shared: getAuthHeader(), handleResponse(), API_BASE constant
    vendor.ts     <- one exported async function per vendor contract endpoint
    couple.ts     <- one exported async function per couple contract endpoint
    coplanner.ts  <- one exported async function per coplanner contract endpoint
  types/
    common.ts     <- shared: ApiResponse<T>, PaginatedResponse<T>
    vendor.ts     <- TypeScript interfaces mirroring vendor contract response shapes
    couple.ts     <- TypeScript interfaces mirroring couple contract response shapes
```

### Rules
1. Every contract endpoint = one exported function in lib/api/*.ts.
2. Every response shape = one exported interface in lib/types/*.ts.
3. Screen components import from lib/api/* and lib/types/* only. No inline fetch().
4. JWT attached once in _base.ts getAuthHeader(). Never duplicated in screens.
5. All responses typed. Contract drift = TypeScript compile error, not runtime bug.
6. Dropped endpoints (see table at bottom) = removed entirely from screens. No stubs.
7. Legacy fetches from tdw-2 = deleted, not renamed. Rip and rebuild, not patch.

### Session build order for frontend sessions
P2-6b (vendor):
  1. Create lib/api/_base.ts and lib/types/common.ts first
  2. Create lib/api/vendor.ts with all vendor contract functions
  3. Create lib/types/vendor.ts with all vendor response interfaces
  4. Rewrite each vendor screen one at a time to use typed client
  5. Delete all legacy fetch calls and dropped endpoint calls

P2-7b (bride + coplanner):
  1. lib/api/_base.ts and lib/types/common.ts already exist from P2-6b
  2. Create lib/api/couple.ts + lib/api/coplanner.ts
  3. Create lib/types/couple.ts
  4. Rewrite each couple/coplanner screen one at a time
  5. Delete all legacy fetch calls and dropped endpoint calls

P2-8b (journey):
  1. lib/api/couple.ts already exists — add journey functions to it
  2. Rewrite couple/plan screen using typed client

---

# dream-os — API Contracts
**Written:** 2026-05-19
**Status:** Authoritative. Backend builds to this. Frontend wires to this. No drift.
**Read order:** After SCHEMA.md, before writing any endpoint or frontend fetch call.

This document defines every Bucket A endpoint — the complete useful product.
Bucket B (Discover) = Phase 3. Bucket C (tax, contracts, GST, team) = post-launch.
Bucket D (todos, payment-shield, Gmail, Razorpay, guests) = dropped / out of scope.

---

## Conventions

- All endpoints prefixed `/api/v2/` unless noted
- Auth: `Authorization: Bearer <JWT>` header. JWT issued by Supabase Auth via dream-os.
- All responses: `{ ok: true, ...data }` on success, `{ ok: false, error: "message" }` on failure
- All IDs: UUID strings
- All amounts: integers in paise? No — **rupees as integers** (e.g. 80000 = Rs 80,000). Per working rule: Rs not ₹.
- All dates: ISO strings `YYYY-MM-DD`
- All timestamps: ISO strings with timezone
- Pagination: `?limit=20&offset=0` where needed. Default limit 20.

---

## Vendor endpoints

### GET /api/v2/vendor/me
Auth: vendor JWT
Purpose: Vendor profile — used by settings screen and session hydration.

Response:
```json
{
  "ok": true,
  "vendor": {
    "id": "uuid",
    "name": "string",
    "business_name": "string",
    "category": "string",
    "city": "string",
    "handle": "string",
    "upi_id": "string | null",
    "gstin": "string | null",
    "open_to_travel": "boolean",
    "tier": "trial | essential | signature | prestige",
    "founding_cohort": "boolean",
    "aesthetic_tags": "string[] | null",
    "rate_min": "number | null",
    "rate_max": "number | null",
    "discover_preview": "boolean"
  }
}
```
Schema: `vendors` table.

---

### GET /api/v2/vendor/today/:vendorId
Auth: vendor JWT (must own vendorId)
Purpose: TODAY dashboard — needs attention, today's schedule, money snapshot, pending enquiries.

Response:
```json
{
  "ok": true,
  "vendor": { "name": "string", "category": "string", "city": "string" },
  "needs_attention": {
    "overdue_invoices": [{ "id": "uuid", "client_name": "string", "amount_owed": "number", "due_date": "string" }],
    "new_leads": [{ "id": "uuid", "name": "string", "wedding_date": "string | null", "budget_total": "number | null", "created_at": "string" }],
    "events_today": [{ "id": "uuid", "title": "string", "kind": "string", "event_time": "string | null" }]
  },
  "this_week": [{ "id": "uuid", "title": "string", "kind": "string", "event_date": "string", "event_time": "string | null" }],
  "money_snapshot": {
    "total_outstanding": "number",
    "unpaid_count": "number",
    "advance_paid_count": "number"
  },
  "open_leads_count": "number"
}
```
Schema: `vendors`, `leads`, `events`, `invoices`.

---

### GET /api/v2/vendor/leads/:vendorId
Auth: vendor JWT
Purpose: Leads pipeline list.
Query: `?state=new|contacted|quoted|booked|lost|all` (default: all active = new+contacted+quoted)
       `?limit=20&offset=0`

Response:
```json
{
  "ok": true,
  "leads": [{
    "id": "uuid",
    "name": "string | null",
    "wedding_date": "string | null",
    "wedding_city": "string | null",
    "budget_total": "number | null",
    "state": "string",
    "source": "string | null",
    "referrer": "string | null",
    "raw_message": "string | null",
    "created_at": "string"
  }],
  "total": "number"
}
```
Schema: `leads` table.

---

### PATCH /api/v2/vendor/leads/:leadId/state
Auth: vendor JWT
Purpose: Move lead through pipeline.

Request:
```json
{ "state": "new|contacted|quoted|booked|lost", "reason": "string | null" }
```

Response:
```json
{ "ok": true, "lead": { "id": "uuid", "state": "string" } }
```
Schema: `leads` table.

---

### GET /api/v2/vendor/clients/:vendorId
Auth: vendor JWT
Purpose: Client roster.
Query: `?limit=20&offset=0`

Response:
```json
{
  "ok": true,
  "clients": [{
    "id": "uuid",
    "name": "string",
    "phone": "string | null",
    "email": "string | null",
    "notes": "string | null",
    "created_at": "string"
  }],
  "total": "number"
}
```
Schema: `clients` table.

---

### GET /api/v2/vendor/clients/:vendorId/:clientId
Auth: vendor JWT
Purpose: Single client detail with linked leads and invoices.

Response:
```json
{
  "ok": true,
  "client": {
    "id": "uuid",
    "name": "string",
    "phone": "string | null",
    "email": "string | null",
    "notes": "string | null"
  },
  "leads": [{ "id": "uuid", "wedding_date": "string | null", "state": "string", "budget_total": "number | null" }],
  "invoices": [{ "id": "uuid", "amount_total": "number", "amount_paid": "number", "state": "string", "due_date": "string | null" }]
}
```
Schema: `clients`, `leads`, `invoices`.

---

### GET /api/v2/vendor/invoices/:vendorId
Auth: vendor JWT
Purpose: Invoice list — money screen.
Query: `?state=unpaid|advance_paid|paid|all` (default: unpaid+advance_paid)
       `?limit=20&offset=0`

Response:
```json
{
  "ok": true,
  "invoices": [{
    "id": "uuid",
    "invoice_number": "string",
    "client_name": "string",
    "amount_total": "number",
    "amount_paid": "number",
    "amount_owed": "number",
    "state": "string",
    "due_date": "string | null",
    "created_at": "string"
  }],
  "summary": {
    "total_outstanding": "number",
    "total_collected": "number"
  },
  "total": "number"
}
```
Schema: `invoices` table.
Note: `amount_owed = amount_total - amount_paid` computed server-side.
Note: replaces legacy `/api/invoices/:vendorId` from tdw-2.

---

### GET /api/v2/vendor/expenses/:vendorId
Auth: vendor JWT
Purpose: Expenses list — money screen.
Query: `?limit=20&offset=0`

Response:
```json
{
  "ok": true,
  "expenses": [{
    "id": "uuid",
    "description": "string | null",
    "amount": "number",
    "category": "string | null",
    "expense_date": "string | null",
    "client_name": "string | null",
    "created_at": "string"
  }],
  "total_spent": "number",
  "total": "number"
}
```
Schema: `expenses` table.
Note: replaces legacy `/api/expenses/:vendorId` from tdw-2.

---

### GET /api/v2/vendor/events/:vendorId
Auth: vendor JWT
Purpose: Calendar — all events.
Query: `?from=YYYY-MM-DD&to=YYYY-MM-DD` (default: today to +60 days)
       `?state=upcoming|done|cancelled|all` (default: upcoming)
       `?kind=shoot|call|meeting|recce|fitting|trial|ceremony|reminder|other`

Response:
```json
{
  "ok": true,
  "events": [{
    "id": "uuid",
    "title": "string",
    "kind": "string",
    "event_date": "string",
    "event_time": "string | null",
    "state": "string",
    "lead_id": "uuid | null",
    "notes": "string | null"
  }],
  "total": "number"
}
```
Schema: `events` table (vendor_id scoped).
Note: replaces legacy `/api/todos/:vendorId` from tdw-2.

---

### GET /api/v2/vendor/context/:vendorId
Auth: vendor JWT
Purpose: Full context for DreamAI PWA chat — same snapshot as WhatsApp agent.

Response:
```json
{
  "ok": true,
  "vendor": { "name": "string", "category": "string", "city": "string", "handle": "string" },
  "pending_invoices": [{ "client_name": "string", "amount_owed": "number", "due_date": "string | null", "overdue": "boolean" }],
  "upcoming_events": [{ "title": "string", "kind": "string", "event_date": "string", "event_time": "string | null" }],
  "new_leads": [{ "name": "string | null", "wedding_date": "string | null", "budget_total": "number | null" }],
  "recent_notes": [{ "content": "string" }]
}
```
Schema: `vendors`, `invoices`, `events`, `leads`, `notes`.
Note: replaces legacy `/api/v2/dreamai/vendor-context/:vendorId` — path renamed.

---

### POST /api/v2/vendor/chat
Auth: vendor JWT
Purpose: DreamAI PWA chat — runs vendor agent turn.

Request:
```json
{
  "vendor_id": "uuid",
  "message": "string",
  "history": [{ "role": "user|assistant", "content": "string" }]
}
```

Response (streaming SSE or JSON):
```json
{
  "ok": true,
  "reply": "string",
  "tool_calls": ["string"]
}
```
Note: replaces legacy `/api/v2/dreamai/chat` — path renamed.
Note: channel=web. Same engine as WhatsApp. justDoIt default false on PWA.

---

## Couple (bride) endpoints

### GET /api/v2/couple/me/:coupleId
Auth: couple JWT
Purpose: Bride profile — settings screen.

Response:
```json
{
  "ok": true,
  "couple": {
    "id": "uuid",
    "name": "string | null",
    "partner_name": "string | null",
    "wedding_date": "string | null",
    "wedding_city": "string | null",
    "budget_total": "number | null",
    "phone": "string"
  }
}
```
Schema: `couples` table.
Note: replaces legacy `/api/users/:id` and `/api/v2/couple/profile/:id`.

---

### GET /api/v2/couple/today/:coupleId
Auth: couple JWT
Purpose: Bride TODAY dashboard.

Response:
```json
{
  "ok": true,
  "couple": { "name": "string | null", "wedding_date": "string | null", "days_to_wedding": "number | null" },
  "upcoming_events": [{ "id": "uuid", "title": "string", "kind": "string", "event_date": "string", "event_time": "string | null" }],
  "recent_muse": [{ "id": "uuid", "image_url": "string", "tags": "string[]" }],
  "circle_activity": [{ "member_name": "string", "action": "string", "created_at": "string" }],
  "bookings_count": "number",
  "muse_count": "number"
}
```
Schema: `couples`, `events`, `muse_saves`, `circle_activity`.
Note: replaces legacy `/api/v2/couple/today/:id`.

---

### GET /api/v2/couple/muse/:coupleId
Auth: couple JWT
Purpose: Muse board — full grid.
Query: `?ceremony=all|haldi|mehendi|sangeet|reception|wedding` (default: all)
       `?limit=40&offset=0`

Response:
```json
{
  "ok": true,
  "saves": [{
    "id": "uuid",
    "image_url": "string",
    "cloudinary_public_id": "string | null",
    "tags": "string[]",
    "source_url": "string | null",
    "ceremony": "string | null",
    "created_at": "string"
  }],
  "total": "number"
}
```
Schema: `muse_saves` table.
Note: replaces legacy `/api/couple/muse/:coupleId` and `/api/v2/couple/muse`.

---

### DELETE /api/v2/couple/muse/:saveId
Auth: couple JWT
Purpose: Delete a muse save.

Response: `{ "ok": true }`
Schema: `muse_saves` table.

---

### POST /api/v2/couple/chat
Auth: couple JWT
Purpose: Bride DreamAI PWA chat.

Request:
```json
{
  "couple_id": "uuid",
  "message": "string",
  "history": [{ "role": "user|assistant", "content": "string" }]
}
```

Response:
```json
{ "ok": true, "reply": "string" }
```
Note: replaces legacy `/api/v2/dreamai/chat` (couple variant).
Note: Same brideEngine as WhatsApp. No terminal reply tool. Streaming in Phase 3.

---

### GET /api/v2/couple/circle/:coupleId
Auth: couple JWT
Purpose: Circle members + recent activity.

Response:
```json
{
  "ok": true,
  "members": [{
    "id": "uuid",
    "name": "string",
    "phone": "string",
    "role": "string | null",
    "joined_at": "string"
  }],
  "activity": [{
    "id": "uuid",
    "member_name": "string",
    "action": "string",
    "content": "string | null",
    "created_at": "string"
  }]
}
```
Schema: `circle_members`, `circle_activity`.
Note: replaces legacy `/api/co-planner/list/:coupleId`.

---

### POST /api/v2/couple/circle/invite
Auth: couple JWT
Purpose: Invite a circle member — generates CIRCLE-XXXXXX token, sends WhatsApp.

Request:
```json
{ "couple_id": "uuid", "phone": "string", "name": "string", "role": "string | null" }
```

Response:
```json
{ "ok": true, "token": "string" }
```
Schema: `circle_members`.
Note: replaces legacy `/api/co-planner/invite`.

---

### GET /api/v2/couple/circle/messages/:coupleId
Auth: couple JWT
Purpose: Circle message thread.
Query: `?limit=30&offset=0`

Response:
```json
{
  "ok": true,
  "messages": [{
    "id": "uuid",
    "sender_name": "string",
    "content": "string",
    "kind": "text|muse_share|ai_summary",
    "created_at": "string"
  }]
}
```
Schema: `circle_sessions`.
Note: replaces legacy `/api/circle/messages/:coupleId`.

---

### POST /api/v2/couple/circle/messages
Auth: couple JWT
Purpose: Circle member sends a message.

Request:
```json
{ "couple_id": "uuid", "content": "string", "sender_name": "string" }
```

Response: `{ "ok": true, "message": { "id": "uuid", "created_at": "string" } }`
Schema: `circle_sessions`.

---

### GET /api/v2/couple/events/:coupleId
Auth: couple JWT
Purpose: Bride's events/reminders/fittings/ceremonies.
Query: `?from=YYYY-MM-DD&to=YYYY-MM-DD`
       `?kind=fitting|trial|ceremony|reminder|other`

Response:
```json
{
  "ok": true,
  "events": [{
    "id": "uuid",
    "title": "string",
    "kind": "string",
    "event_date": "string",
    "event_time": "string | null",
    "state": "string",
    "notes": "string | null"
  }]
}
```
Schema: `events` table (couple_id scoped).
Note: replaces legacy `/api/couple/events/:coupleId` and `/api/v2/couple/events/:id`.

---

### GET /api/v2/couple/bookings/:coupleId
Auth: couple JWT
Purpose: Vendor bookings — who's booked, amounts, states.

Response:
```json
{
  "ok": true,
  "bookings": [{
    "id": "uuid",
    "vendor_name": "string",
    "category": "string | null",
    "amount_total": "number | null",
    "amount_paid": "number | null",
    "state": "string",
    "notes": "string | null",
    "booked_at": "string | null"
  }],
  "total_committed": "number",
  "total_paid": "number"
}
```
Schema: `couple_bookings` table.
Note: replaces legacy `/api/couple/vendors/:coupleId` and `/api/v2/couple/money/:coupleId` (partial).

---

### GET /api/v2/couple/receipts/:coupleId
Auth: couple JWT
Purpose: Expense receipts vault.
Query: `?limit=20&offset=0`

Response:
```json
{
  "ok": true,
  "receipts": [{
    "id": "uuid",
    "label": "string | null",
    "amount": "number | null",
    "image_url": "string | null",
    "vendor_name": "string | null",
    "receipt_date": "string | null",
    "created_at": "string"
  }],
  "total": "number"
}
```
Schema: `couple_receipts` table.
Note: replaces legacy `/api/couple/expenses/:coupleId`.

---

## Coplanner (circle member) endpoints

### GET /api/v2/coplanner/profile/:token
Auth: none (token-gated)
Purpose: Circle member landing — validate token, get couple info.

Response:
```json
{
  "ok": true,
  "member": { "name": "string", "role": "string | null" },
  "couple": { "name": "string | null", "wedding_date": "string | null" }
}
```
Schema: `circle_members`, `couples`.

---

### GET /api/v2/coplanner/muse/:coupleId
Auth: circle member session
Purpose: Read-only view of bride's muse board for circle member.

Response: Same shape as `/api/v2/couple/muse/:coupleId`. Read-only.

---

### GET /api/v2/coplanner/feed/:coupleId
Auth: circle member session
Purpose: Circle activity feed for circle member.

Response: Same shape as circle activity in `/api/v2/couple/circle/:coupleId`.
Note: replaces legacy `/api/v2/frost/circle/feed/:coupleId`.

---

### POST /api/v2/coplanner/chat
Auth: circle member session
Purpose: Circle member DreamAI chat (scoped — can see muse, cannot modify bookings).

Request:
```json
{ "couple_id": "uuid", "member_name": "string", "message": "string", "history": [] }
```

Response: `{ "ok": true, "reply": "string" }`
Note: replaces legacy `/api/v2/dreamai/circle-member-chat`.

---

## Public endpoints (no auth)

### GET /api/v2/landing-slides
Auth: none
Purpose: Landing page background slideshow images.
Status: ✅ Built (P2-5)

Response: `{ "ok": true, "slides": [{ "id", "image_url", "caption", "display_order" }] }`

---

### GET /api/v2/exploring-photos
Auth: none
Purpose: Just Exploring blind swipe photos on landing page.
Status: ✅ Built (P2-5)

Response: `{ "ok": true, "photos": [{ "id", "image_url", "caption", "display_order" }] }`

---

### GET /api/v2/discover/preview
Auth: none
Purpose: 4-5 founding vendor preview cards for bride FEED tab. Pure view.
Status: ⏳ P2-9

Response:
```json
{
  "ok": true,
  "vendors": [{
    "id": "uuid",
    "name": "string",
    "business_name": "string",
    "category": "string",
    "city": "string",
    "aesthetic_tags": "string[] | null",
    "rate_min": "number | null",
    "rate_max": "number | null",
    "portfolio_images": [{ "image_url": "string", "display_order": "number" }]
  }]
}
```
Schema: `vendors` WHERE discover_preview=true, `vendor_portfolio`.
Requires: migrations 0024 + 0029 applied.

---

## Dropped endpoints (from tdw-2 — not building)

These paths exist in dreamos-pwa source. They call features out of scope.
Frontend calls to these must be **removed or replaced with "coming soon" stubs**.

| Legacy path | Reason dropped |
|---|---|
| `/api/v2/vendor/gst-summary/` | Tax track — post-launch |
| `/api/tds/:vendorId/summary` | Tax track — post-launch |
| `/api/payment-schedules/:vendorId` | Replaced by invoices.amount_paid |
| `/api/v2/vendor/payment-shield` | Out of scope |
| `/api/v2/vendor/gmail/*` | Post-launch |
| `/api/v2/vendor/calendar/import/` | Post-launch |
| `/api/v2/vendor/push-subscribe` | Post-launch (web push) |
| `/api/v2/vendor/leads/:id/convert` | Handled by WhatsApp agent |
| `/api/vendor-discover/availability/` | Phase 3 |
| `/api/couple/budget/` | Out of scope (no budget table) |
| `/api/couple/budget-categories/` | Out of scope |
| `/api/couple/checklist/` | Out of scope (no checklist table) |
| `/api/couple/guests` | Out of scope (no guests table) |
| `/api/v2/couple/guests/*` | Out of scope |
| `/api/v2/couple/tasks/` | Merged into events in 0022 |
| `/api/enquiries/*` | Phase 3 (Discover enquiry thread) |
| `/api/v2/razorpay/*` | Out of scope |
| `/api/v2/dreamai/couple-context/` | Replaced by /api/v2/couple/chat internals |
| `/api/circle/reactions/` | Out of scope |
| `/api/v2/couple/receipt-scan` | Handled by WhatsApp Muse classifier |
| `/api/v2/couple/muse-image` | Handled by WhatsApp agent |
| `/api/v2/couple/tokens/` | Circle tokens via WhatsApp only |
| `/api/v2/dreamai/whatsapp-extract` | WhatsApp surface only |
| `/api/v2/dreamai/vendor-action/block-date` | WhatsApp surface only |

---

## Build status summary

| Block | Endpoints | Status |
|---|---|---|
| Auth | 14 endpoints | ✅ Complete (P2-3/4/5) |
| Public | landing-slides, exploring-photos | ✅ Complete (P2-5) |
| Vendor core | today, leads, clients, invoices, expenses, events, context, chat | ⏳ P2-6a |
| Couple core | today, muse, chat, circle, messages | ⏳ P2-7a |
| Couple journey | events, bookings, receipts | ⏳ P2-8a |
| Coplanner | profile, muse, feed, chat | ⏳ P2-7a |
| Discover preview | preview | ⏳ P2-9 |


---

## Block 1a endpoints (added 2026-05-20)

### POST /api/v2/vendor/leads
Auth: vendor JWT
Body: `{ bride_name|name, phone?, wedding_date?, wedding_city?, source?, referrer_name?, raw_message?, notes? }`
Response: `{ ok, data: Lead, deduped: boolean }`

### PATCH /api/v2/vendor/leads/:leadId
Auth: vendor JWT | Body: editable lead fields | Response: `{ ok, data: Lead }`

### GET /api/v2/vendor/leads/:leadId/detail
Auth: vendor JWT | Response: `{ ok, lead, invoices[], events[], client? }`

### POST /api/v2/vendor/clients
Auth: vendor JWT | Body: `{ vendor_id, name, phone?, email?, notes? }`
Response: `{ ok, client, deduped, restored }` — phone dedup restores soft-deleted records

### PATCH /api/v2/vendor/clients/:clientId
Auth: vendor JWT | Body: `{ name?, phone?, email?, notes? }` | Response: `{ ok, client }`

### DELETE /api/v2/vendor/clients/:clientId
Auth: vendor JWT | Action: Soft delete. leads.client_id + invoices.client_id SET NULL. | Response: `{ ok }`

### POST /api/v2/vendor/events
Auth: vendor JWT | Body: `{ vendor_id, title, kind (required), event_date?, notes?, linked_lead_id? }` | Response: `{ ok, event }`

### PATCH /api/v2/vendor/events/:eventId
Auth: vendor JWT | Body: editable event fields | Response: `{ ok, event }`

### DELETE /api/v2/vendor/events/:eventId
Auth: vendor JWT | Action: Soft delete | Response: `{ ok }`

### POST /api/v2/vendor/expenses
Auth: vendor JWT
Body: `{ vendor_id, amount, category, description?, expense_date?, client_name? }`
Valid categories: travel, equipment, editing, assistant, studio, printing, packaging, food, accommodation, marketing, software, other
Response: `{ ok, expense }`

### PATCH /api/v2/vendor/expenses/:expenseId
Auth: vendor JWT | Body: editable expense fields | Response: `{ ok, expense }`

### DELETE /api/v2/vendor/expenses/:expenseId
Auth: vendor JWT | Action: Soft delete | Response: `{ ok }`

### POST /api/v2/vendor/invoices
Auth: vendor JWT | Body: `{ vendor_id, client_name, amount_total, services?, event_date?, due_date? }` | Response: `{ ok, invoice, pdf_pending: true }`

### PATCH /api/v2/vendor/invoices/:invoiceId
Auth: vendor JWT | Note: LOCKED after any payment (INVOICE_LOCKED error) | Response: `{ ok, invoice }`

### POST /api/v2/vendor/invoices/:invoiceId/payments
Auth: vendor JWT | Body: `{ amount, payment_date?, method?, notes? }` | Response: `{ ok, invoice }`

### GET /api/v2/vendor/availability/:vendorId
Auth: vendor JWT | Response: `{ ok, blocks: [{id, blocked_date, reason, created_at}], total }`

### POST /api/v2/vendor/availability
Auth: vendor JWT | Body: `{ vendor_id, blocked_date (YYYY-MM-DD), reason? }` | Response: `{ ok, block }`

### DELETE /api/v2/vendor/availability/:blockId
Auth: vendor JWT | Response: `{ ok }`

### GET /api/v2/hot-dates
Auth: none (public) | Query: `?year=2026&region=north_india` | Response: `{ ok, dates[], total }`

### PATCH /api/v2/vendor/me
Auth: vendor JWT | Body: any of: `{ business_name, city, open_to_travel, upi_id, gstin, aesthetic_tags, rate_min, rate_max, discover_preview, ... }` | Response: `{ ok, vendor }`

### PATCH /api/v2/vendor/me/routing-handle
Auth: vendor JWT | Body: `{ handle }` min 3 chars | Response: `{ ok, handle }`

### PATCH /api/v2/vendor/me/invoice-prefix
Auth: vendor JWT | Body: `{ prefix }` max 10 chars | Response: `{ ok, prefix }`
