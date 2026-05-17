# HANDOVER_BRIDE.md — dream-os bride product

**Session:** B3 — Planner: event tools + bookings + receipts + image classifier
**Status:** ✅ COMPLETE (2026-05-17)
**Bride product version:** 0.8.5a.3-b3
**Vendor product version (frozen):** 0.8.5a
**HEAD at B3 close:** 2e7009c

This is the first thing the next bride-session Claude reads. Read it top to bottom before touching any code. Then read ROADMAP_BRIDE.md and SCHEMA.md.

---

## What B3 shipped

Full planning substrate, running live in production:

- Bride can add/list/update/delete/cancel events (trials, calls, fittings, ceremonies, etc.)
- Tasks and events unified — everything is a calendar event (kind field distinguishes them)
- Task tools deprecated; all to-do/reminder/task/calendar queries route to list_events
- Bride can track bookings: add vendor commitment, record payments, update totals
- record_payment() SQL function handles all booking state transitions atomically
- Image classifier: Google Vision DOCUMENT_TEXT_DETECTION + LABEL_DETECTION routes Twilio image forwards to either Muse or receipt vault
- Receipt vault: bride forwards a receipt → "Got it, filed away" — no questions asked
- Bride can list receipts + get image playback in WhatsApp
- Date-awareness: today's IST date injected into every agent turn — agent no longer asks "what's today's date?"
- Circle Muse access: circle members can now see and show bride's Muse saves (was blocked before B3 phone test)
- Circle summary: session insert failure now logs loudly instead of silently creating orphaned rows

---

## B3 commit history

| Commit | Description |
|---|---|
| 9539c74 | Migration 0020 — drop priority column |
| a55031a | B3 step 2: task tools (5 tools) |
| ecc805a | B3 step 2 audit fixes: M1, M2, L1, L2, L3, I1, I2 |
| fd24efa | B3 step 3: event tools (list_events, update_event, delete_event) |
| fc04ab4 | B3 step 4: booking tools + record_payment |
| 46f9afa | B3 audit 2a fixes: M1, L1, L2, I1, I2 (event tools) |
| 53243cd | B3 audit 2b fixes: L1, I1, I2 (booking tools) |
| 6328a00 | Migration 0021 — couple_receipts.label column |
| 6b0c98f | B3 step 5: Google Vision image classifier + imagePipeline integration |
| 8a25e1c | B3 step 5b: wire classifier into bride image flow |
| ce234e7 | B3 step 6: receipt tools (save/list/delete) |
| 325a5b8 | B3 audit 3 fixes: M1, L1, L2, I1, I2 (classifier + receipt tools) |
| d5b4823 | B3 phone test fixes: Issues 1-5 (date, routing, circle muse, session) |
| 2e7009c | B3 migration 0022: task→event merge |

---

## What shipped in B3 — file inventory

### Schema migrations

| Migration | What it added |
|---|---|
| **0019_bride_planner.sql** | couple_tasks, couple_bookings, couple_receipts tables + record_payment() function |
| **0020_drop_priority.sql** | Drops priority column from couple_tasks |
| **0021_couple_receipts_label.sql** | Adds label (nullable text) to couple_receipts |
| **0022_task_event_merge.sql** | Copies couple_tasks → events (kind=reminder). Empties couple_tasks. |

### New code files

| File | Lines | What it does |
|---|---|---|
| `src/lib/imageOCRRouter.js` | 172 | Google Vision classifier. DOCUMENT_TEXT_DETECTION (word count ≥ 20) + LABEL_DETECTION (receipt labels at ≥ 0.70 confidence). Default: muse on any failure. |

### Modified code files

| File | Key changes |
|---|---|
| `src/lib/imagePipeline.js` | Added runClassifier flag + receipt early-exit branch. Circle path: runClassifier=false always. |
| `src/lib/museSave.js` | Passes runClassifier=true for bride saves. Branches on classified_as='receipt' to return early. |
| `src/agent/brideTools.js` | Added 3 event tools + 5 booking tools + 3 receipt tools. Task tools marked DEPRECATED. update_event description: call list_events after update. |
| `src/agent/brideEngine.js` | Added executors for all new tools. surfacePendingCircleSessions: entry + 0-sessions logging. Exports executeBrideTool (required by circleEngine). |
| `src/agent/brideSystemPrompt.js` | IST date injected into buildDynamicContext. WHAT YOU DO block: unified routing rule (NEVER create_task, everything → add_event, all to-do/reminder/task queries → list_events). |
| `src/agent/circleSystemPrompt.js` | Rule 6: circle members CAN see Muse saves via list_muse (was blocking). |
| `src/agent/circleEngine.js` | Full rewrite: CIRCLE_TOOLS (list_muse + delete_muse_save), mini tool loop (CIRCLE_MAX_ITERS=3), couple + circleUser params. |
| `src/brideIndex.js` | Passes couple={id,user_id} + circleUser={id} to runCircleAgenticTurn. Session insert failure: loud ERROR log instead of silent null. Receipt context note updated (no questions, just file it). |

---

## B3 phone test — what was tested and what passed

Test bride: +919888294440 (Swati Couple Test, couple_id: 7abccc1b-0698-43ba-9709-c6a1e52af789)

| Surface | Result |
|---|---|
| Tasks: create/complete/delete | ✅ All working |
| Events: add/list/update/cancel/delete | ✅ All working including "6 evening" → 6pm |
| Bookings: add/list/record_payment/update | ✅ All working, balance computed correctly |
| Circle: invite link generation | ✅ wa.me link returned correctly |
| Circle: partner joins + saves images | ✅ Images land on Muse board |
| Date awareness | ✅ Fixed in phone test fixes commit |
| Event/task routing ("call Chevron at 2pm") | ✅ Fixed — now routes to add_event, shows in list_events |
| Circle Muse visibility | ✅ Fixed — circle members can now see board |

### ⚠️ NOT YET PHONE-TESTED (unit/integration tests pass, phone verification pending)

- **Receipt image classifier** — forwarding a real receipt photo to +14787788550, verifying agent says "Got it, filed away" and NOT "saved to your board"
- **Receipt list + playback** — "show me my receipts" + image playback in WhatsApp
- **Google Vision DOCUMENT_TEXT_DETECTION** — end-to-end on a real receipt with printed text

These MUST be phone-tested at the START of B3.1, before any B3.1 code work begins.

---

## Known issues from phone test (resolved in d5b4823)

1. ~~Agent didn't know today's date~~ — fixed: IST date injected
2. ~~"Call Chevron at 2pm" showed in calendar but not to-do list~~ — fixed: unified routing
3. ~~Stale event date shown after update~~ — fixed: update_event description tells agent to call list_events after update
4. ~~Circle member couldn't see Muse board~~ — fixed: circleEngine rewrite, circleSystemPrompt corrected
5. ~~Circle summary not delivered to bride~~ — fixed: session insert logs loudly, surfacePendingCircleSessions has entry log

---

## Scope changes locked at B3 close

- **Morning nudge cron** — deferred to B4.1c
- **Twilio template submission** — deferred to B4.1c
- **list_dues tool** — deferred to B4.1c (feeds morning nudge)
- **Receipt 3-branch OCR linkage** — dropped permanently. Receipt design: vault-only, no label/amount/OCR asked of bride. Retrieval via PWA at Sessions 11-12.
- **B3.1 primary deliverable** — changed to thedreamwedding.in/muse (unique public URL per bride). Bug fixes are secondary.

---

## Architecture decisions locked in B3

1. **Everything is a calendar event.** No separate task concept. couple_tasks retired. The words to-do, reminder, task, and calendar are interchangeable — all route to list_events.

2. **Image classifier is Google Vision, not Haiku.** DOCUMENT_TEXT_DETECTION (word count ≥ 20) + LABEL_DETECTION (receipt-adjacent labels at ≥ 0.70). Defaults to muse on any failure. 'document' and 'paper' excluded from label set (too generic — wedding invitations score high).

3. **Receipt vault is zero-friction.** Agent saves immediately with just image_url. No label, no amount, no vendor_name asked. Bride retrieves and labels via PWA at Sessions 11-12.

4. **Circle members can see Muse saves.** ROADMAP_BRIDE.md line 244 was always the design. Was incorrectly blocked in circleSystemPrompt.js. Fixed in B3.

5. **No agent arithmetic, ever.** All booking math in SQL. Haiku reads numbers verbatim from DB results.

---

## Current tool surface (23 tools, 5 deprecated)

Active: note_to_self, save_wedding_detail, add_event, list_events, update_event, delete_event, add_booking, list_bookings, update_booking, delete_booking, record_payment, save_receipt, list_receipts, delete_receipt, list_muse, delete_muse_save, invite_to_circle, list_circle

Deprecated (DEPRECATED — do not call): create_task, list_tasks, complete_task, update_task, delete_task

Circle-only (via circleEngine tool loop): list_muse, delete_muse_save

---

## Key URLs and IDs

| Item | Value |
|---|---|
| Repo | https://github.com/devjroy-dev/dream-os |
| dream-wedding service | https://dream-wedding-production-6cef.up.railway.app |
| dream-os (vendor) service | https://dream-os-production.up.railway.app |
| Admin | https://dream-os-production.up.railway.app/admin |
| Supabase project | nvzkbagqxbysoeszxent (Mumbai, ap-south-1) |
| Bride WhatsApp | +14787788550 (The Dream Wedding, Meta-verified) |
| Vendor WhatsApp | +91 7982159047 (dream-os, Meta-verified) |
| Google Cloud project | dream-os (gen-lang-client-0017514064) on dev@thedreamwedding.in |
| Cloudinary cloud | dccso5ljv |
| Anthropic workspace | dream-os |
| Model lock | claude-haiku-4-5-20251001 (Haiku), claude-sonnet-4-6 (Sonnet) |
| HEAD at B3 close | 2e7009c |
| Test bride couple_id | 7abccc1b-0698-43ba-9709-c6a1e52af789 |
| Test bride phone | +919888294440 |

---

## Three-tier model routing — current actual state

- **Haiku** — active, doing all the work.
- **Sonnet** — wired, never promoted to in any B3 test. Activates at B4.1b.
- **Gemini Flash-Lite** — wired in src/lib/groundedSearch.js. No bride code path calls it. First bride use at B4.1a.

---

## What B3.1 must do first (before any code)

1. Phone-test the receipt classifier with a real receipt image
2. Phone-test list_receipts + image playback
3. Confirm circle summary fires on bride's next message after Dev's 10-min inactivity
4. Only then start the Muse landing page build

---

## What's next

- **B3.1** — thedreamwedding.in/muse (unique public Muse board URL per bride) + bug fixes + circle smoke test
- **B4.1c** — Morning nudge cron + list_dues tool + Twilio template submission
- **B4.1a** — Gemini grounded search (~90 min, ships independently)
- **B4.1b** — Bride classifier tuning (after 4 weeks of founding-cohort data)
- **B4** — Vendor connections + Surprise Me + silent onboarding
- **Session 9** — Convergence + Discover
