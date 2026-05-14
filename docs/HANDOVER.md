# dream-os -- Session Handover
**Last updated:** 2026-05-15
**Session:** 7 (partial -- chunks 1-2 only)
**Version:** 0.7.0-alpha

## What shipped this session

### Decision: session reorder (founder confirmed)
New sequence: 6.5 (on +91 arrival) → 7 chunks 1-2 → 8.1 → 7.5 (chunks 3-8) → 8.5 → 8 → 9 → 10 → 11-12
Reason: money tools (record_payment, expenses, PDF, QR) require Sonnet-level reasoning.
Haiku showed clear limits during invoice disambiguation testing -- looped 4 times on a simple "same Priya" confirmation.
Session 8.1 ships first, then Session 7.5 completes money tools with Sonnet available.

### Migration 0008 (db/migrations/0008_invoices.sql)
- invoices table: id, vendor_id, lead_id, invoice_number, client_name, client_phone, description, amount_total, amount_advance, amount_paid, due_date, state, pdf_url, notes, created_at, updated_at
- state CHECK: unpaid / advance_paid / paid / cancelled. Default: unpaid.
- amount CHECKs: amount_total >= 0, amount_paid >= 0, amount_advance nullable non-negative
- Deliberate omission: amount_paid <= amount_total NOT enforced -- overpayment (shagun, tips) is legitimate vendor reality, handled as soft prompt at tool layer
- unique constraint: (vendor_id, invoice_number)
- 5 indexes: vendor_id, state, due_date, lead_id, created_at desc
- vendors.invoice_prefix text (nullable) -- editable, auto-set to TDW/<routing_handle> on first invoice
- vendors.invoice_counter integer NOT NULL default 0 -- per-vendor sequence, never resets
- Realtime enabled on invoices
- set_updated_at trigger attached

### Supabase storage bucket: invoices
- Private bucket (not public)
- File size limit: 5 MB
- Allowed MIME types: application/pdf only
- Policy: service_role has INSERT, SELECT, UPDATE, DELETE
- Used in Session 7.5 when PDF generation ships

### npm dependencies added
- pdfkit ^0.18.0 -- PDF generation (Session 7.5)
- qrcode ^1.5.4 -- UPI QR code embedded in PDF (Session 7.5)

### create_invoice tool (Stage 1 only -- text, no PDF)
Files touched:
- src/agent/tools.js -- create_invoice tool definition added
- src/agent/engine.js -- case 'create_invoice' handler added
- src/lib/format.js -- NEW -- formatRs() Indian comma formatting, formatPercent()
- src/lib/invoiceMessage.js -- NEW -- buildInvoiceMessage() composes WhatsApp text

Tool logic (in order):
1. Validates: amount_total > 0, advance <= total if provided, advance >= 0 if provided
2. Fetches vendor row: routing_handle, business_name, upi_id, invoice_prefix, invoice_counter, user_id
3. Fetches user.name as fallback display name
4. Duplicate name check: queries leads AND invoices tables (ilike match on client_name). If match found and no lead_id supplied, returns disambiguation prompt -- does NOT create invoice.
5. Auto-sets invoice_prefix to TDW/<routing_handle> if null, saves to DB
6. Atomically increments invoice_counter, builds invoice_number e.g. TDW/DEV550/01 (zero-padded to 2 digits)
7. Inserts invoice row: state=unpaid, amount_paid=0
8. Composes WhatsApp message via buildInvoiceMessage()
9. Returns result with --- FORWARD THIS TO [NAME] --- delimiters so agent copies verbatim

Invoice message format (Stage 1):
- With advance: Hi [name] -- invoice number, For: [description], Total Rs X, Booking amount Rs Y (Z%), payment instruction, UPI, due date, Thanks.
- Without advance: Hi [name] -- invoice number, For: [description], Total Rs X, UPI, due date, Thanks.
- Description line skipped entirely if vendor did not provide one
- UPI line skipped if upi_id not set on vendor (agent warned to prompt vendor to set it)
- Description capitalised first letter: "bridal makeup" -> "For: Bridal makeup"
- Indian rupee formatting: 120000 -> Rs 1,20,000

System prompt updates:
- Rule 7: extended with delimiter-based verbatim copy instruction for create_invoice
- create_invoice entry in WHEN TO USE EACH TOOL: Stage 1 scope, no hallucination rules, no-modify instruction

### Railway auto-deploy fix
- "Wait for CI" toggle was ON in Railway settings -- was blocking all auto-deploys silently
- Toggled OFF during this session
- Auto-deploys now fire correctly on every git push to main

## Smoke tests passed
- create_invoice happy path: advance + description + due date -- message composed correctly
- create_invoice no advance, no description -- lines correctly omitted
- Duplicate name check fires when Priya exists in invoices table
- Indian comma formatting: 120000 -> Rs 1,20,000
- Percentage: 36000/120000 -> 30%
- Description capitalised: "bridal makeup" -> "For: Bridal makeup"
- invoice_prefix auto-set to TDW/DEV550 on first invoice
- invoice_counter increments atomically
- Delimiter guardrail: agent copies message verbatim, no hallucinated lines

## What is NOT done (deferred to Session 7.5, after 8.1)
- record_payment tool (Stage 2: advance paid -> PDF + QR generated + state=advance_paid)
- record_payment tool (Stage 3: balance paid -> state=paid + balance reminder text)
- PDF generation via pdfkit
- QR code generation via qrcode embedded in PDF
- list_invoices tool
- update_invoice_prefix tool (with warning: old invoices keep their numbers)
- expenses table (migration 0009) + log_expense tool
- Admin Money tab on vendor detail page
- Morning briefing: overdue invoice alerts

## Three-stage invoice flow (designed, partially built)
Stage 1 (unpaid) -- BUILT: vendor raises invoice, dream-os composes WhatsApp text with UPI ID. No PDF.
Stage 2 (advance_paid) -- DEFERRED to 7.5: advance received, PDF with embedded UPI QR. Booking confirmed.
Stage 3 (paid) -- DEFERRED to 7.5: balance received, plain WhatsApp text, invoice closed.

## Key product decisions locked this session
- Invoices link to leads (lead_id FK, nullable, SET NULL) -- clients table arrives in Session 8.5
- Invoice number format: <vendor.invoice_prefix>/<counter padded to 2>. e.g. TDW/DEV550/01
- Invoice prefix: editable by vendor, defaults to TDW/<routing_handle> on first invoice
- Invoice counter: never resets, gaps are normal and expected (accountant-safe)
- Duplicate name: soft prompt at creation -- surfaces existing leads + invoices, asks vendor to confirm
- State machine: unpaid / advance_paid / paid / cancelled
- amount_paid <= amount_total: NOT enforced at DB. Soft prompt at tool layer (Session 7.5).
- Description: vendor's words verbatim, first letter capitalised, prefixed "For:". Skipped if not given.
- UPI QR: lives inside Stage 2 PDF only. No standalone QR generator.
- Clients table: Session 8.5. Promotion trigger: advance paid OR vendor directly adds client.
- Lead dedup (upstream, create_lead blind insert): Session 8.5.

## Known gaps carried forward
1. Twilio status callback: vendor notification message (sent_by: system) missing twilio_sid -- pre-existing Session 5.5 bug
2. No Anthropic credit-low warning -- agent fails silently if credits run out
3. update_lead_state requires UUID -- name-based update deferred to Session 8
4. Onboarding is dumb state machine -- no Haiku intelligence until Session 8.1
5. Vendor cannot draft/send replies to couples yet
6. Lead dedup upstream (create_lead tool does blind insert) -- deferred to Session 8.5
7. Invoice disambiguation loop verbose with Haiku -- resolves in 8.1 with Sonnet routing

## Session 6.5 -- Twilio template + +91 migration
**Founder directive (explicit, confirmed):** No matter which session we are at, when the WhatsApp +91 number arrives, pause everything and do Session 6.5 first.

Steps when +91 arrives:
1. Confirm WABA: same as +14787788550? (determines if templates transfer)
2. If same WABA: update TWILIO_WHATSAPP_NUMBER and TDW_WA_NUMBER env vars only
3. If new WABA: submit dream_os_morning_briefing UTILITY template first, wait approval
4. Template body: "Morning {{1}}. You have {{2}} open leads and {{3}} pending replies. {{4}} Reply to update."
5. Update outbound send wrapper: if 24h window closed AND template approved -> send via template
6. Update invite page wa.me link to +91 number
7. Smoke test: briefing fires to vendor inactive >24h

## Railway env vars (current)
- TWILIO_WHATSAPP_NUMBER = whatsapp:+14787788550
- TDW_WA_NUMBER = 14787788550
- ANTHROPIC_API_KEY (workspace: dream-os, model: claude-haiku-4-5-20251001)
- ADMIN_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (all in Railway)

## WhatsApp numbers reference
| Number | Currently points to | Notes |
|---|---|---|
| +14155238886 | Twilio sandbox | Retired |
| +14787788550 | dream-os Railway | Active, Meta-verified |
| +91XXXXXXXXX | Pending Twilio approval | Will become primary -- triggers Session 6.5 |

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
- Briefing test: GET https://dream-os-production.up.railway.app/admin/test-briefing/2eb5d3fb-31eb-4b26-859a-cf10ae477d53

## First thing next session (8.1)
curl https://dream-os-production.up.railway.app
Should return: {"status":"alive","service":"dream-os","version":"0.7.0-alpha"}

Check Railway logs for:
[cron] jobs registered: morning briefing at 08:00 IST (02:30 UTC)

If +91 number has arrived: do Session 6.5 before anything else.
Otherwise: start Session 8.1 (smart model routing Haiku -> Sonnet).

Session 8.1 goal: task classifier routes complex tasks to Sonnet, simple tasks stay on Haiku.
Once 8.1 ships, return to Session 7.5 to complete money tools with Sonnet available.

## Document update protocol
HANDOVER.md -- fully rewritten every session
SCHEMA.md -- fully rewritten every session
ROADMAP.md -- updated every session
git add docs/ package.json && git commit -m "docs: session 7 handover, schema, roadmap" && git push
