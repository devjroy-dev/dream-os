# dream-os — Session Handover
**Last updated:** 2026-05-15
**Session:** 8.5a (in progress — 3 of 6 bugs fixed)
**Version:** 8.5 (bumps to 8.5a on session close)

---

## What shipped this session

### Bug fixes shipped (3 of 6)

**Bug #1 — Empty inbound messages crash webhook (FIXED — commit b3ece5c)**
Media-only WhatsApp messages (images, voice notes, stickers) arrived with empty Body. Anthropic API rejected empty user messages → 500. Fix: defensive guard in src/index.js before any routing or agent invocation. If Body is empty and media is present → reply "I'll be able to process images and voice notes really soon — but for now, please type your message and I'll help." If Body is empty and no media → log and drop silently. Smoke tested: image sent to +14787788550 → correct reply, no 500.

**Bug #4 — Single-thread couple routing user_id lookup (FIXED — commit 1c23609)**
Step C threadCount=1 branch used existingThread.vendors.users?.id || existingThread.vendor_id to look up the vendor's user record. The join on line 468 selected users(name) not users(id), so existingThread.vendors.users?.id was always undefined. Fallback used vendor_id (wrong table) → silent null → vendor notification never fired. Fix: fetch fullVendor first (which has user_id), then look up user via fullVendor.user_id. Smoke test deferred (requires bride with exactly one thread).

**Bug #7 — Typo'd TDW codes route silently to wrong vendor (FIXED — commit 853b5f0)**
Bride sending SWATI978 (no TDW- prefix) fell through Step B (no match) → sticky caught it → routed to wrong vendor silently. Fix: Step B.5 inserted between Step B and Step C. If first word looks like a handle attempt (alphanumeric, 3-12 chars, single word only), fuzzy-match via Levenshtein against handles of vendors this bride already has threads with. If exactly one match within distance 2 → "Did you mean TDW-SWATI978? Send that and I'll connect you right away." 0 or 2+ matches → fall through. Also fixed: trimmedBody scoping bug (needed .toUpperCase() for case-insensitive single-word check). Smoke tested in production.

### Bug fixes pending (3 of 6)

**Bug #3 — Returning-bride notification falls back to generic string when leadName is null**
When isReturningBride=true but lead.name is null → vendor gets "Returning enquiry just messaged: 'X'" instead of a named notification. Fix: use bride's phone last 4 digits as fallback. Pending.

**Bug #5 — UUIDs leak into add_client reply**
add_client returns "Client added. ID: 4e3a-..." to the vendor. Cosmetic. Fix: system prompt nudge + tool result shape change. Pending.

**Bug #6 — list_clients caps at 10 silently**
No "showing 10 of N" suffix. Fix: add count to tool result. Pending.

### Deferred to 8.5b

- PDF interim acknowledgement in record_payment (3-5 second silence fix)
- Tool-call shortcut guardrail (needs founder to lock verb list first)

### Strategic decisions locked this session (architectural, not code)

1. Bride product architecture. thedreamwedding.in = brides. thedreamai.in = vendors. Same repo, two Railway services, one Supabase. See ROADMAP_BRIDE.md.
2. Number routing locked permanently. +91 = vendors, thedreamai.in. +14787788550 = brides, thedreamwedding.in.
3. Vendor sessions pause after Session 8. B1 → B2 → B3 → B4 build bride to parity. Session 9 is convergence.
4. Session 9 redefined. Convergence of vendor + bride tracks. Discover goes live only after bride has persistent couple_id, Muse, Circle, planner, Surprise Me.
5. tdw-2 vendor-side retires at Sessions 11-12. tdw-2 bride-side PWA shell reused from B1.
6. Sonnet for couple agent in multi-vendor scenarios deferred to Session 9.
7. Discover curation model. Price gets vendor considered. Style gets them featured. Swati has editorial control via vendors.discover_eligible toggle.
8. Edge case inventory. 17-case disambiguation + dedup edge case document written. Added below.

---

## Smoke tests passed this session

- Bug #1: image-only WhatsApp → correct polite reply, no 500 in Railway logs ✅
- Bug #7: SWATI978 (no TDW- prefix) → "Did you mean TDW-SWATI978?" ✅
- Bug #7: TDW-SWATI978 (correct) → normal routing, no regression ✅
- Bug #7: "hi is anyone there" → falls through to Step C, no fuzzy match triggered ✅
- Bug #4: code-verified via diff audit. Live smoke test deferred.

---

## Known disambiguation + dedup edge cases (Session 8.5 inventory)

These are architectural truths, not bugs to fix. Documented for traceability.

### Disambiguation edge cases

Case 1: TDW code typos route silently to wrong vendor. FIXED by Bug #7 (Step B.5 fuzzy match). Residual: typos with Levenshtein distance >2 or 0/2+ matches still fall through to Step C as designed.

Case 2: Disambiguation fires per message, not per conversation. Each inbound from a multi-vendor bride re-runs routing from scratch. Sticky mitigates within 30 min. By design — prevents wrong-vendor lock-in.

Case 3: Sticky window extends on every sticky-routed message. Each sticky route pushes sticky_until 30 min forward. Intentional — active conversations stay routed.

Case 4: TDW code overrides sticky but does NOT clear sticky. Bride sticky=Dev sends TDW-SWATI978 → routes to Swati → new sticky=Swati. Correct and intentional.

Case 5: Single-thread user_id lookup was broken. FIXED by Bug #4 (commit 1c23609).

Case 6: Step C count is global per bride-phone, not per vendor. Correct for current product.

Case 7: Disambiguation reply uses Haiku interpretation, not exact string match. Confidence below "high" falls through. No instrumentation today for low-confidence falls-through. Logging deferred.

### Dedup edge cases

Case 8: Client dedup is phone-only. Phoneless duplicates invisible to helper. Admin Clients tab shows yellow "possible duplicate" pill. By design.

Case 9: Names never used for dedup. Deliberate. Indian naming conventions make normalisation error-prone.

Case 10: Lead dedup in create_lead, not in resolveOrCreateClient. Two independent dedup layers, both keyed on phone.

Case 11: add_client back-link is one-way only at creation. create_lead stamps existing client_id at insert time. Both directions covered via different code paths.

Case 12: Promotion is silent and best-effort. Wrapped in try/catch. Reconciliation job deferred.

Case 13: clients.user_id populated when phone matches existing users row. Not used today. Bridge to bride-side identity in Session 9.

Case 14: Lead/invoice ↔ client connections stamped but not surfaced in admin UI. Session 8 item.

### Returning-bride edge cases

Case 15: isReturningBride=true can fire with leadName=null. Produces "Returning enquiry just messaged." Bug #3 — pending fix this session.

Case 16: Returning-bride detection is per-vendor, not global. Correct and intentional.

Case 17: Couple agent is Haiku-only, not Sonnet-routed. Deferred to Session 9.

---

## Pre-existing gaps (not new this session)

1. Twilio status callback: many [twilio-status] no message row for sid=... log lines — pre-existing 5.5 race condition.
2. No Anthropic credit-low warning — agent fails silently if credits run out.
3. update_lead_state requires UUID — name-based update deferred to Session 8.
4. Classifier context gap: prior Sonnet turn outside 2-turn history may route to Haiku.
5. vendors.rate_min / rate_max not yet added — Session 9 migration.
6. Railway running in EU West, Supabase in Mumbai — move before scaling beyond 50 vendors.
7. PDF generation causes 3-5 second silence in record_payment — deferred to 8.5b.

---

## First thing next session (completing 8.5a)

curl https://dream-os-production.up.railway.app
Should return: {"status":"alive","service":"dream-os","version":"0.8.5"}

Then fix Bug #3, Bug #5, Bug #6 in that order. One at a time.
Then write final handover, update all four docs, commit, push. Session 8.5a is complete.
Then check: has +91 arrived? If yes → Session 6.5 before anything else.
If no → Session 8 (admin polish).

---

## Railway env vars (current)

- TWILIO_WHATSAPP_NUMBER = whatsapp:+14787788550 (moves to +91 after Session 6.5)
- TDW_WA_NUMBER = 14787788550 (moves to +91 after Session 6.5)
- ANTHROPIC_API_KEY (workspace: dream-os, model lock: haiku-4-5-20251001 + sonnet-4-6)
- GOOGLE_API_KEY (Google AI Studio, dev@thedreamwedding.in, free tier)
- ADMIN_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (all in Railway)

---

## Test credentials

- WhatsApp: +14787788550
- Test vendor phone (Dev): +918757788550
- Test vendor UUID: 2eb5d3fb-31eb-4b26-859a-cf10ae477d53
- Test vendor routing_handle: DEV550
- Second test vendor (Swati): routing_handle SWATI978, UUID e036ea4d-3f9a-4ec5-ba89-a5defa3a042b
- Test couple phone (Meha): +919625759924
- Supabase: nvzkbagqxbysoeszxent (Mumbai)
- Railway: https://dream-os-production.up.railway.app
- Admin: https://dream-os-production.up.railway.app/admin

---

## Document update protocol

Four files updated every session, no exceptions:
- HANDOVER.md — fully rewritten (current state, not history)
- SCHEMA.md — fully rewritten (exact current DB state)
- ROADMAP.md — updated (mark done, add new, update open questions)
- ROADMAP_BRIDE.md — updated (mark done, add new, update open questions)
- UNIT_ECONOMICS.md — Dev's reference only, no other session amends it

B-sessions additionally maintain:
- HANDOVER_BRIDE.md — written at end of every B-session, read at start of next B-session
