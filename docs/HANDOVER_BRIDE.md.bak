# HANDOVER_BRIDE.md — dream-os bride product

**Session:** B1 — Foundation
**Status:** ✅ COMPLETE
**Date closed:** 2026-05-16
**Author:** Dev
**Bride product version:** 0.8.5a.1-b1
**Vendor product version (frozen):** 0.8.5a

This is the first thing the next bride-session Claude reads at start of session. Read it top to bottom before touching any code.

---

## What B1 shipped

A complete, live, end-to-end bride product running on WhatsApp:

- Bride messages **+1 478 778 8550** ("The Dream Wedding")
- Phone-as-gate validates her against the database
- New brides go through a 4-question onboarding (date, partner, city, budget)
- Onboarding completes → agentic loop takes over for ongoing conversation
- Admin at `thedreamai.in/admin/couples` lets Swati invite brides and view their state

The product is live and verified. One test bride completed onboarding end-to-end including dodge handling and a Haiku-extracted budget field.

---

## Build pattern locked: writer .py protocol

**Every code change in B1 was applied via a self-contained Python writer script.** This pattern emerged during step 2 after two heredoc paste failures corrupted files (special characters in JavaScript template literals and SQL CHECK constraints didn't survive shell escaping). The writer .py pattern proved so reliable it is now the **default for all future sessions** including all future handovers.

### How it works

1. Claude builds the target file(s) in its sandbox, runs `node --check` on JavaScript or `python3 -c "import json"` on JSON, and smoke-tests the writer end-to-end before sending it.

2. The writer is a single Python script with:
   - Base64-encoded payload (the file content, line-wrapped at 76 chars)
   - Expected SHA-256 hash
   - Expected size in bytes
   - Path validation (refuses to run outside repo root)
   - Self-delete on success

3. Multi-file writes go in ONE writer script. Every payload's hash is validated **before** any file is written. If any check fails, nothing lands. Atomic semantics.

4. Dev's workflow per write:
   - Download `write_<descriptor>.py` from Claude's response
   - Drop into `/workspaces/dream-os` root
   - Run: `python3 write_<descriptor>.py`
   - Verify if needed: `git status`, `git diff`, `wc -l`
   - Commit + push
   - Paste commit output back to Claude

5. After every commit, Claude reclones the repo into its OWN sandbox at `/home/claude/dream-os-fresh` (different from Dev's `/workspaces/dream-os`) and confirms HEAD matches before proceeding. Dev does NOT reclone in Codespaces.

### Why this matters

The writer .py pattern eliminates the entire class of "Claude generated correct code but it didn't land correctly" bugs. Three forms of that bug seen during B1:

- Heredoc paste failures (special characters in template literals broke parsing)
- Copy-paste truncation (long files paste only the first N lines silently)
- Encoding mismatch (smart quotes, em-dashes corrupted via clipboard)

With SHA-256 verification, the file on disk EXACTLY matches what Claude generated, or the script aborts.

### When the writer pattern doesn't apply

- One-line config tweaks (env vars, single boolean flips) → Claude Code or direct str_replace
- SQL migrations to be pasted into Supabase SQL editor → plain code block in chat (the SQL still gets committed to the repo via writer .py, but the actual application to Supabase is a paste)
- Trivial markdown edits → still preferred but pasting is acceptable

### Naming convention

`write_<descriptor>.py` where descriptor explains what's being written. Examples from B1:

- `write_brideOnboarding.py` — single file, step 4
- `write_brideAdmin.py` — multi-file: 3 new views + 2 edits
- `write_b1_fix0014.py` — bugfix: migration + brideIndex.js patch
- `write_b1_patch0015.py` — feature: 5 files for pronouns + dedup + dodge variety
- `write_b1_package_json.py` — single file, version + scripts update

---

## What shipped in B1 — file inventory

### Schema migrations (all applied to Supabase)

| Migration | What it added |
|---|---|
| **0013_couples_onboarding.sql** | `couples.onboarding_state`, `couples.nudge_sent_at`, `couple_state` table, widened `events.kind` enum to 12 values, made `events.vendor_id` + `notes.vendor_id` nullable, added `couple_id` to events + notes with XOR constraints, `invite_couple()` function |
| **0014_conversations_xor.sql** | Made `conversations.vendor_id` nullable, added `conversations.couple_id` with FK and index, added `conversations_owner_xor` CHECK. Discovered as a bug during live testing on first real message. |
| **0015_pronouns_and_dedup.sql** | `users.pronouns` text column (CHECK 'she'/'he', nullable), `couples.user_id` unique constraint (prevents duplicate invites), dropped old 2-arg `invite_couple()`, created new 3-arg `invite_couple(p_phone, p_name, p_pronouns)` with validation |

### Code files

| File | Status | What it does |
|---|---|---|
| `src/lib/supabase.js` | NEW | Shared Supabase client for bride-side modules |
| `src/agent/brideSystemPrompt.js` | NEW | Pronoun-aware BFF voice. 220 lines. Static prompt + dynamic context query |
| `src/agent/brideOnboarding.js` | NEW | State machine: new → asked_date → asked_partner → asked_city → asked_budget → complete. Haiku extraction for dates and budgets. Haiku-based dodge classification with regex fallback. 509 lines |
| `src/agent/brideTools.js` | NEW | Three tool schemas: note_to_self, save_wedding_detail, add_event |
| `src/agent/brideEngine.js` | NEW | Agentic loop with executor switch-cases for 3 tools. 400 lines |
| `src/brideIndex.js` | NEW | Bride webhook server. Phone-as-gate, conversation creation, message logging, calls runBrideAgenticTurn, sendWhatsApp, status callback. 227 lines |
| `src/admin/views/coupleInvite.js` | NEW | Admin invite form with pronouns radio (She/Her, He/Him) |
| `src/admin/views/couples.js` | NEW | Admin couples list with stats + status badges |
| `src/admin/views/coupleDetail.js` | NEW | Bride detail page: profile + notes + events + conversation transcript |
| `src/admin/views/layout.js` | EDITED | Added "Couples" to nav, removed redundant top-level "Invite" link |
| `src/admin/router.js` | EDITED | Added 3 routes: GET /couples, GET/POST /couples/invite, GET /couples/:id |
| `package.json` | EDITED | Version bump to 0.8.5a.1-b1, bride-aware description, added start:bride + dev:bride scripts |

### Infrastructure

- **Railway service `dream-wedding`** created in the dream-os project. Custom start command: `node src/brideIndex.js`. URL: `https://dream-wedding-production-6cef.up.railway.app`. Env vars: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER=whatsapp:+14787788550, TDW_WA_NUMBER=14787788550
- **Vendor service `dream-os`** gained env var `TDW_WA_NUMBER_BRIDE=14787788550` so admin invite links point at bride number
- **Twilio +14787788550** flipped to point at dream-wedding service (was pointing at vendor service)
- **Twilio +91 7982159047** unchanged — still vendor

---

## Current state

| Item | Status |
|---|---|
| dream-wedding service | Live at https://dream-wedding-production-6cef.up.railway.app |
| dream-os service (vendor + admin) | Live at https://dream-os-production.up.railway.app |
| Twilio +14787788550 routing | → dream-wedding ✓ |
| Twilio +91 7982159047 routing | → dream-os (vendor) ✓ |
| Latest migration | 0015 |
| Test couple verified end-to-end | 1 (`7abccc1b-...`, Swati Couple Test, state=complete, partner=null dodged, date=null dodged, city=Goa, budget=3500000, pronouns=she) |
| Founding cohort brides invited | 0 (B1 was foundation; real cohort invites start B2+ or whenever Swati starts) |

---

## Three locked architectural differences from vendor

These are intentional. Future sessions must NOT "fix" them by aligning to vendor side.

1. **No terminal reply tool.** Vendor engine has `respond_to_vendor` as a forced last tool call. Bride engine does not. The model's final text message IS the reply. Loop exits when the model returns plain text without tool calls.

2. **No first-question post-processing strip.** Vendor engine strips everything after the first `?` to enforce single-question discipline. Bride engine keeps full text. Multi-sentence, multi-question replies are allowed because BFF voice rambles naturally.

3. **Phone-as-gate routing.** No TDW codes, no disambiguation, no sticky logic. Just: phone → users → couples row. Pass or dead-end. Vendor's three-mode routing (Mode 1 returning couple, Mode 2 TDW code, Mode 3 fallback) does not apply to bride product.

---

## Vendor parity issues discovered (carry-forward to Session 9)

**INSTRUCTIONS FOR B4 (the last B-session):** This section is the canonical list of vendor parity items. Every B-session adds to this section. At B4 close, B4's handover must include this complete cumulative list as a dedicated section labeled "Session 9 convergence checklist." Session 9's first task is reading this list and addressing every item before Discover work begins.

**Format:** each item is a discovery + the fix needed + estimated effort.

### Items discovered in B1

1. **Pronouns on vendors not implemented.** Migration 0015 added `users.pronouns` (CHECK 'she'/'he', nullable). Bride admin form captures it. Bride system prompt reads and uses it. Vendor admin form does NOT capture it. Vendor system prompt does NOT read it. To fix:
   - Update `src/admin/views/invite.js` to add pronouns radio (mirror coupleInvite.js)
   - Update `src/admin/router.js` POST `/invite` to read and validate pronouns
   - Update `invite_vendor()` Postgres function signature to accept p_pronouns
   - Update `src/agent/systemPrompt.js` to include pronouns in dynamic context and adapt voice
   - Backfill existing vendors via direct UPDATE in Supabase (founder will need to manually set each)
   - Effort: ~20 minutes of code + manual backfill

2. **Admin invite form lacks E.164 phone validation.** Both vendor and bride invite forms accept malformed phone numbers. Founder discovered this when typing `9888294440` (no +91) and the invite went through silently. The phone-gate then failed because lookups use the exact stored string. Manually patched once with UPDATE. To fix:
   - Add client-side validation: regex `^\+\d{10,15}$` with error message
   - Add server-side validation in `invite_couple()` and `invite_vendor()`: RAISE EXCEPTION on malformed phone
   - Effort: ~10 minutes

3. **Package.json versioning scheme assumes vendor frozen at 8.5a.** Current scheme: `0.8.5a.<bride_session_number>-b<n>`. At convergence, version becomes `0.9.0`. Vendor side has no version awareness — package.json describes both products. To formalize:
   - Decide whether to track unified version going forward
   - Or split package.json into per-service files (not recommended)
   - Effort: ~5 minutes (decision more than code)

---

## Open questions

### Identity evolution (locked, just recording)

B1 uses WhatsApp-number-as-identity. By definition the phone field at any entry point IS the WhatsApp number, so phone-as-gate is reliable for founding cohort. When scaling, the PWA (Sessions 11-12) adds Google sign-in / email verify / Instagram handle / WhatsApp OTP as additional authenticators on top of the WhatsApp-number identity.

The schema already keys on `users.id` (uuid), not phone. So adding authenticators later is purely additive — new columns or a `user_authenticators` table — never a schema rewrite. No code or schema work needed in B1, B2, B3, or B4.

### Invite tokens — future option

Currently bride product uses phone-as-gate only. If founding-cohort phone-as-gate ever runs into a wall (e.g. brides messaging from a phone Swati didn't register, or open invites Swati shares without knowing the phone yet), invite tokens can be added as a parallel path. Token would be a one-time-use string like `PRIYA-A8F2K9`. Tokens and phone-gate coexist; tokens are only checked when phone lookup fails. Defer until needed.

### Versioning scheme

Bride sessions live in a B-suffix namespace anchored to the vendor's frozen version:
- `0.8.5a.1-b1` — current (B1 complete, vendor frozen at 8.5a)
- `0.8.5a.2-b2` — after B2
- `0.8.5a.3-b3` — after B3
- `0.8.5a.4-b4` — after B4
- `0.9.0` — Session 9 convergence. Vendor unfreezes. Bride suffix retires. Single unified product version begins. Reserved exclusively for the convergence moment.
- `0.10.0`, `0.11.0`, etc. — post-convergence sessions

The version field is informational — nothing programmatic in the codebase parses it. The scheme is for humans (founder and Claude) to immediately see (a) which vendor version is frozen, (b) how many bride sessions have shipped, (c) whether convergence has happened.

---

## Bugs caught during B1 testing

Logged for historical context. All resolved before B1 close.

1. **Migration 0013 missed conversations table.** First real bride message failed with `null value in column "vendor_id" of relation "conversations" violates not-null constraint`. Fix: migration 0014, made vendor_id nullable and added couple_id with XOR.

2. **Admin invite link pointed at vendor number.** `coupleInvite.js` reads `TDW_WA_NUMBER_BRIDE || TDW_WA_NUMBER || '14787788550'`. On the vendor service (where admin runs), `TDW_WA_NUMBER` was the vendor's own number. Fix: added env var `TDW_WA_NUMBER_BRIDE=14787788550` to vendor service.

3. **Duplicate invite created when admin form was submitted twice.** `invite_couple()` was missing a unique constraint on `couples.user_id`. Two couples rows for the same user existed simultaneously. Fix: migration 0015 added the unique constraint and rewrote `invite_couple()` to be idempotent.

4. **Regex-based dodge detection missed "I'd rather not say".** Falling through saved the literal text as `partner_name`. Fix: converted `looksLikeDodge` from regex to Haiku-based intent classification with regex fallback if Haiku errors.

5. **Repeated "circle back" phrasing in dodge transitions felt boring.** Haiku was gravitating to "we'll circle back to that" across multiple calls. Fix: explicit ban on "circle back" in the composeDodgeTransition prompt + runtime check to reject if Haiku slips it in + updated examples.

6. **Greeting didn't include bride's name.** Founder requested addition during testing. Fix: `LOCKED.greeting` became a function taking the name parameter. Falls back to no-name version when name is missing.

7. **Phone format not validated at admin invite.** Founder typed `9888294440` without `+91`. The invite succeeded but the phone-gate later failed because lookups expected `+919888294440`. Fix: manual SQL patch once. Real validation logged as a vendor parity item above.

8. **Pronoun was not captured at invite time.** Founder asked for this during testing after walking through onboarding the first time. Fix: migration 0015 added `users.pronouns` + admin form pronouns radio + system prompt branching.

---

## Key URLs and IDs

| Item | Value |
|---|---|
| Repo | https://github.com/devjroy-dev/dream-os |
| dream-wedding service | https://dream-wedding-production-6cef.up.railway.app |
| dream-os (vendor) service | https://dream-os-production.up.railway.app |
| Admin (lives on vendor service) | https://dream-os-production.up.railway.app/admin |
| Supabase project | nvzkbagqxbysoeszxent (Mumbai, ap-south-1) |
| Bride WhatsApp number | +1 478 778 8550 (The Dream Wedding, Meta-verified) |
| Vendor WhatsApp number | +91 79821 59047 (dream-os, Meta-verified) |
| Anthropic workspace | dream-os |
| Model lock | claude-haiku-4-5-20251001 (never change without founder approval) |
| Latest commit at B1 close | c4cedcc |
| Test bride couple_id | 7abccc1b-0698-43ba-9709-c6a1e52af789 |
| Test bride phone | +919888294440 (also founder's WhatsApp) |

---

## B1 commit history

13 commits, in order:

| Commit | Description |
|---|---|
| 2b8e8f2 | B1: migration 0013 — couples onboarding, couple_state, events kind, invite_couple |
| f525431 | B1: src/lib/supabase.js — shared client |
| 0701cd9 | B1: brideSystemPrompt.js — ESM→CJS, lock post-onboarding handling |
| 9935ebf | B1: brideOnboarding.js — initial state machine (later replaced) |
| 52a614f | B1: brideOnboarding.js — agent-composed dodge transitions via Haiku |
| bc7234f | B1: brideTools.js — three tool schemas |
| b0fd836 | B1: brideTools.js — add shoot and call back to add_event.kind enum |
| a7669d6 | B1: brideEngine.js — agentic loop with executor switch-cases |
| 72b5268 | B1: brideIndex.js — bride webhook server |
| 8a10dd4 | B1: admin pages for couples — list, invite, detail + nav |
| 49a5dbe | B1 fix: migration 0014 + brideIndex.js sets couple_id |
| 40bf881 | B1 patch: pronouns + invite dedup + dodge-variety improvements |
| f115818 | B1: greeting includes name + Haiku-based dodge detection (was regex) |
| c4cedcc | B1 close: bump version to 0.8.5a.1-b1, bride-aware description |

---

## What's next: B2

See `docs/ROADMAP_BRIDE.md` for the full B2 spec. Short version:

- B1 = Foundation (THIS) ✅
- B2 = Muse + Circle (visual taste profile + bride's people)
- B3 = Planner + Nudges (events, tasks, morning briefing for bride)
- B4 = Surprise Me + final polish (curated suggestions)
- Session 9 = Convergence + Discover

B2 starts by reading: HANDOVER_BRIDE.md (this file), ROADMAP_BRIDE.md, SCHEMA.md, and `docs/B2_SPEC.md` if one exists.

---

## What B2 should NOT do

- Don't change anything in `src/index.js`, `src/agent/engine.js`, `src/agent/tools.js`, `src/agent/systemPrompt.js`, `src/agent/onboarding.js` — those are vendor side, frozen
- Don't touch admin vendor views or the `/admin/`, `/admin/invite`, `/admin/vendors/:id` routes
- Don't fix vendor parity issues directly. Log them in this file's "Vendor parity issues discovered" section
- Don't modify the three locked architectural differences (no terminal reply tool, no question strip, phone-as-gate routing)
- Don't change the writer .py protocol unless founder approves
