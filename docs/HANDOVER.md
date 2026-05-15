# dream-os -- Session Handover
**Last updated:** 2026-05-15
**Session:** 8.3
**Version:** 0.8.3-alpha

## What shipped this session

### Migration 0010 (db/migrations/0010_expenses.sql)
- `expenses` table: id, vendor_id, amount, category, description, expense_date,
  client_name, linked_lead_id, notes, created_at, updated_at
- 12 categories: travel, equipment, assistant, studio, marketing, software,
  food, printing, commission, shoot, inventory, other
- expense_date nullable, defaults to current_date
- client_name text (free-text fallback for unlinked expenses)
- linked_lead_id FK to leads (SET NULL on delete) — primary client link
- Same lead_id + client_name dual pattern as invoices table
- Realtime enabled, set_updated_at trigger, 4 indexes

### record_payment tool (src/agent/engine.js + src/agent/tools.js)
Three payment stages:
- Stage 2 (advance paid): records amount_paid, state → advance_paid,
  generates booking confirmation PDF via invoicePdf.js, uploads to
  Supabase invoices bucket, returns signed URL (1-year validity)
- Stage 3 (balance paid): records amount_paid, state → paid, plain text confirmation
- Partial: records amount_paid, state unchanged, outstanding balance returned
- Overpayment soft warning (shagun, tips) — not blocked at DB level
- Comprehensive Indian vendor payment vocabulary in tool description:
  token received, booking done, advance transferred, settled, paid in full etc.

### invoicePdf.js (src/lib/invoicePdf.js)
- generateInvoicePdf() — pdfkit PDF, A4, clean layout
- Header: vendor business name (large, top left)
- Watermark: "TDW" small grey text (top right)
- BOOKING CONFIRMED badge in gold
- Invoice meta: number, client, description, due date
- Amount breakdown: total, booking amount received (%), balance due
- UPI QR code: dynamic, encodes upi://pay with balance amount pre-filled
- Footer: thank you line
- Returns Buffer — ready for Supabase storage upload

### list_invoices tool
- Filters by state (all / unpaid / advance_paid / paid / cancelled)
- Default: unpaid
- Returns invoice_id — needed for record_payment
- Shows balance, due date, state per invoice

### log_expense tool
- Saves to expenses table with all 12 categories
- Date defaults to today if not mentioned
- Extracts client_name and linked_lead_id if mentioned

### update_invoice_prefix tool
- Changes vendors.invoice_prefix
- Counter never resets — old invoices keep original numbers
- New prefix: uppercased, alphanumeric/hyphen/slash, 2-20 chars
- Agent warns vendor about continuity before confirming

### Admin Money tab (src/admin/router.js + src/admin/views/detail.js)
- Fourth tab on vendor detail page: Leads / Enquiries / Notes / Money
- 4 summary cards: Total Billed, Total Received, Outstanding, Total Expenses
- Invoices table: number, client, total, paid, balance, state badge, PDF View link
- Expenses table: date, category, description, client, amount
- State colours: unpaid=orange, advance_paid=blue, paid=green, cancelled=grey
- Collapsible rows: shows 5 by default, "Show N more" expands inline
- PDF view link opens Supabase signed URL directly in browser

### Morning briefing overdue alerts (src/agent/briefing.js)
- New section in daily 8am IST briefing
- Queries invoices where due_date < today AND state in (unpaid, advance_paid)
- Format: "2 overdue invoices: Priya (TDW/DEV550/01, Rs 1.2L due 2026-11-15)"
- Capped at 5 invoices to keep briefing readable

## Smoke tests passed
- list_invoices: 5 unpaid invoices listed correctly ✅
- record_payment Stage 2: advance recorded, PDF generated, signed URL returned ✅
- PDF: vendor name header, TDW watermark, BOOKING CONFIRMED, amounts, QR code ✅
- QR code: UPI deep link with balance Rs 48,000 pre-filled ✅
- log_expense: Rs 2,500 travel, date extracted, client linked ✅
- Routing: Sonnet for record_payment (Rs 1.45), Haiku for log_expense (Rs 0.26) ✅
- Admin Money tab: 4 cards + invoices + expenses rendering correctly ✅

## Key product decisions locked this session
- PDF generated at Stage 2 (advance paid) only — not Stage 1, not Stage 3
- Lead → client promotion deferred to Session 8.5 as planned
- invoice_prefix change: counter never resets, old invoices keep original numbers
- TDW default prefix preserves brand on every invoice sent to clients
- expense_date nullable, defaults to current_date
- client_name on expenses: free-text fallback when no lead is linked
- Collapsible rows: 5 visible by default, expand inline
- Sonnet routes all financial operations regardless of message simplicity

## Known gaps carried forward
1. Twilio status callback: vendor notification missing twilio_sid — pre-existing Session 5.5 bug
2. No Anthropic credit-low warning — agent fails silently if credits run out
3. update_lead_state requires UUID — name-based update deferred to Session 8
4. Lead dedup upstream (create_lead blind insert) — deferred to Session 8.5
5. Classifier context gap: prior Sonnet turn outside 2-turn history may route to Haiku
6. vendors.rate_min / rate_max not yet added — Session 9 migration
7. Railway running in EU West, Supabase in Mumbai — move before scaling beyond 50 vendors
8. PDF generation causes 3-5 second silence — no interim acknowledgement. Session 8.5.
9. Lead → client promotion on advance paid — Session 8.5.

## Session 8.5 scope (next session)
Goal: Clients model + lead deduplication.

What ships:
- clients table migration
- leads.client_id FK + invoices.client_id FK
- Promotion logic: advance paid → auto-create client, link lead, link invoice
- add_client tool + list_clients tool
- Dedup fix in create_lead: name + phone match check before blind insert
- Admin: clients tab on vendor detail
- Interim acknowledgement for record_payment PDF silence

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
- Test vendor routing_handle: DEV550
- Test vendor TDW link: wa.me/14787788550?text=TDW-DEV550
- Test vendor business_name: Dev Roy Photography
- Test vendor upi_id: dreamostest@okhdfc
- Supabase: nvzkbagqxbysoeszxent (Mumbai)
- Railway: https://dream-os-production.up.railway.app
- Admin: https://dream-os-production.up.railway.app/admin

## First thing next session (8.5)
curl https://dream-os-production.up.railway.app
Should return: {"status":"alive","service":"dream-os","version":"0.8.3-alpha"}

If +91 number has arrived: do Session 6.5 before anything else.
Otherwise: start Session 8.5 (clients model + lead deduplication).

## Document update protocol
Four files updated every session:
- HANDOVER.md — fully rewritten
- SCHEMA.md — fully rewritten
- ROADMAP.md — updated
- UNIT_ECONOMICS.md — Dev's reference only, no other session amends it
