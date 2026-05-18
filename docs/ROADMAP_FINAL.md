# dream-os — Master Roadmap
**Written:** 2026-05-17
**Replanning session:** Strategy and architecture only. No code.
**Supersedes:** ROADMAP.md (vendor, frozen at 8.5a) + ROADMAP_BRIDE.md (bride, frozen at B3)
**Current version:** 0.10.0-alpha
**Repo:** https://github.com/devjroy-dev/dream-os
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)

---

## Version map

| Version | Milestone | What it represents |
|---|---|---|
| 0.9.0-alpha | Replanning + CC fixes | Both tracks audited, minor fixes applied via Claude Code, roadmap rewritten. No new features. |
| 0.10.0-alpha | Phase 1 complete | Both WhatsApp surfaces standalone. All blocking items cleared. |
| 0.11.0-alpha | Phase 2 complete | Both PWA shells live. Profile completion. Threads view. DreamAi chat tab. |
| 1.0.0 | Phase 3 complete | Discover live. Public launch. Both products connected. |

---

## Why this roadmap was rewritten

The prior roadmap had two parallel tracks — a vendor track (Sessions 1–8.5a) and a bride track
(B1–B4) — that were always intended to converge at Session 9 (Discover). That structure made
sense when bride development was catching up to vendor. It no longer makes sense because:

1. The bride track (B3) is now functionally at parity with the vendor track in terms of schema
   and agentic capability. The B-session framing implied "bride catches up." That's done.

2. The original convergence point (Session 9 = Discover) was wrong sequencing. Discover is a
   marketplace. A marketplace before liquidity is a directory. A directory before liquidity is
   a graveyard. Both products need to be standalone and proven before Discover connects them.

3. The PWA shells were scheduled at Sessions 11–12 (post-Discover). That's also wrong. The PWA
   is a trust mechanism — the engine under the bonnet. Without it, users operate on faith. It
   belongs before Discover, not after.

4. Surprise Me was classified as a Discover feature. It is not. Surprise Me reads the bride's
   Muse saves, extracts aesthetic tags via Google Vision, and surfaces similar content from the
   internet via Gemini. It has no dependency on vendor data. It is a Muse feature. Phase 1 item,
   not Phase 3.

The correct sequence: standalone WhatsApp products → PWA shells (trust) → Discover (convergence).

---

## Architecture — locked decisions (do not change without founder approval)

### Infrastructure
- **One repo:** devjroy-dev/dream-os (public)
- **One Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1). One DB, one migration history.
- **Four Railway services from one repo:**
  - `dream-os` → src/index.js (vendor WhatsApp agent)
  - `dream-wedding` → src/brideIndex.js (bride WhatsApp agent)
  - `thedreamai.in` → src/vendorPwa/ (vendor dashboard — Phase 2)
  - `thedreamwedding.in` → src/bridePwa/ (bride planner + Discover — Phase 2+)
- **Two WhatsApp numbers (permanent):**
  - +917982159047 = vendors, thedreamai.in, Indian number, local trust
  - +14787788550 = brides, thedreamwedding.in, US number, NRI brides, premium positioning
- **Supabase storage buckets:**
  - `invoices` (private) — vendor invoice PDFs
  - `portfolios` (public) — vendor portfolio images (Phase 2, new)
- **Cloudinary:** dccso5ljv — bride Muse image CDN mirror

### Domain model
- thedreamai.in — vendors only. Vendors live here.
- thedreamwedding.in — brides only. Brides live here. Discover is hosted here.
- Vendors appear on thedreamwedding.in/discover — they do not log in there.
- Discover hosted at thedreamwedding.in. Vendor has no login on thedreamwedding.in.

### Models (never change without founder approval)
- `claude-haiku-4-5-20251001` — default for all routine turns, both products
- `claude-sonnet-4-6` — judgment calls, complex turns, both products
- `Gemini Flash-Lite` — retrieval only via src/lib/groundedSearch.js. Never composes replies.

### Naming convention (three layers, each internally consistent)
- **Data layer** (tables, IDs, DB URLs): `couples`, `couple_id`, `couple_state`, `vendors`, `vendor_id`
- **Product layer** (files, modules, user-facing strings): `bride*`, `brideIndex.js`, `brideEngine.js`, `src/index.js`, `engine.js`
- **External marketing** (domains, PWA, voice): "The Dream Wedding" (brides), "DreamAi" (vendors)

### Schema discipline
- Every schema change goes through a numbered migration file in db/migrations/
- Migration sequence is unified — bride and vendor share one sequence. Last applied: 0022.
- Never edit an applied migration file. Changes go in the next numbered file.
- RLS disabled on all tables. service_role key held by Railway only. Enable at Phase 3 before Discover.

### Agent architecture
- **Vendor agent:** src/index.js (entry) → src/agent/engine.js (loop, MAX_ITERATIONS=5) → src/agent/tools.js → src/agent/systemPrompt.js
- **Bride agent:** src/brideIndex.js (entry) → src/agent/brideEngine.js (loop) → src/agent/brideTools.js → src/agent/brideSystemPrompt.js
- **Vendor agent post-processing:** strips everything after first `?` in reply. Model-proof.
- **Bride agent:** no terminal reply tool, no post-processing strip. Final assistant text IS the reply.
- **Shared lib:** src/lib/ (sendWhatsApp, supabase, models, clients, groundedSearch, imagePipeline, museSave, imageOCRRouter). Never duplicated. Bride-specific code never goes in shared lib.
- **Prompt caching:** 1-hour ephemeral cache on static system prompt. 91% input token reduction. Both agents.
- **Cost tracking:** every agent turn logs model, input_tokens, output_tokens, cost_usd, cost_inr on messages row.
- **USD_TO_INR = 100:** hardcoded in src/lib/models.js

### Voice
- **Vendor agent:** brusque, transactional. "Got it — [details]. [Single question]?" Nothing after the ?.
- **Bride agent:** BFF with wit. Informal, dry, non-judgmental, leans toward what she wants on taste and vision. Validates her direction. Flags significant financial or interpersonal moves once, gently. Reference: Fleabag narration energy.

### Phone and currency rules (non-negotiable)
- Phone numbers: always E.164 format (+918757788550)
- Currency: Rs (never ₹, never "rupees")

---

## What is built and working today (0.9.0-alpha baseline)

### Vendor WhatsApp — src/index.js
- Full 4-step onboarding (name, category, city, rate). Smart category detection (16 categories).
- TDW handle auto-assigned (FIRSTNAMEPHONE3 e.g. DEV550). Instagram handle collected naturally.
- Three-mode couple routing: Mode 1 (returning couple by phone), Mode 2 (TDW code), Mode 3 (fallback)
- Fuzzy TDW match: Levenshtein distance ≤2 → "Did you mean TDW-SWATI978?"
- Sticky disambiguation: 30-minute window. Sticky vendor stamped on users.pending_routing_context.
- Returning-bride detection: per-vendor, via lead-exists check for (vendor_id, phone)
- Couple-facing agent on vendor threads (Mode 1 + Mode 2): Haiku replies to brides on vendor's behalf
- Tools: note_to_self, create_lead, list_leads, update_lead_state, respond_to_vendor, create_event,
  list_events, update_event_state, update_routing_handle, get_my_tdw_link, create_invoice,
  list_invoices, record_payment, log_expense, update_invoice_prefix, add_client, list_clients
- Morning briefing cron: 8am IST daily. Overdue alerts included.
- Smart model routing: Haiku→Sonnet classifier. Cost tracking on every turn.
- Prompt caching: 91% input token reduction confirmed in production.
- Admin layer: vendor list, invite, vendor detail, leads tab, clients tab, money tab, messages newest-first

### Bride WhatsApp — src/brideIndex.js
- Phone-gated onboarding (Swati invites by phone + name + pronouns via admin)
- BFF voice locked in brideSystemPrompt.js. IST date injected into every turn.
- Muse: image + link saves, Google Vision tagging (12-value aesthetic taxonomy), Cloudinary mirror
- Image classifier: Google Vision DOCUMENT_TEXT_DETECTION + LABEL_DETECTION routes to receipt or Muse
- Circle: 3-member cap, CIRCLE-XXXXXX tokens, session-based BFF-voice summaries
- Circle members can see and add to Muse board. Permission model: can edit/delete own saves only.
- Planner: events as universal calendar entry (tasks retired into events at migration 0022)
- Bookings: commitment tracking. record_payment() SQL function as single source of truth.
- Receipts: vault-only. "Got it, filed away." No questions asked. Retrieval via PWA at Phase 2.
- Tools (active, 18): note_to_self, save_wedding_detail, add_event, list_events, update_event,
  delete_event, add_booking, list_bookings, update_booking, delete_booking, record_payment,
  save_receipt, list_receipts, delete_receipt, list_muse, delete_muse_save, invite_to_circle,
  list_circle
- Tools (deprecated, do not call): create_task, list_tasks, complete_task, update_task, delete_task
- Smart model routing: classifier wired, Sonnet NOT YET ACTIVATED on bride side (Phase 1 fix)
- Prompt caching: inherited from shared models.js. Active.

### Schema — migrations applied (0001–0022)
All 22 migrations applied and live. Last migration: 0022_task_event_merge.sql (2026-05-17).
Full schema documented in SCHEMA.md.

### Infrastructure
- dream-os Railway service: https://dream-os-production.up.railway.app (vendor)
- dream-wedding Railway service: https://dream-wedding-production-6cef.up.railway.app (bride)
- Admin: https://dream-os-production.up.railway.app/admin
- +917982159047 webhooks pointing at dream-os vendor service ✅
- +14787788550 webhooks pointing at dream-wedding bride service ✅
- Google Cloud project: dream-os (gen-lang-client-0017514064) on dev@thedreamwedding.in
- Anthropic workspace: dream-os

---

## What is frozen / pending at 0.9.0-alpha baseline

### Vendor side — frozen at 8.5a

**Bugs pending (never fixed):**
| Bug | Description |
|---|---|
| Bug #3 | Returning-bride notification null leadName. Fix: use bride's last 4 phone digits as fallback. |
| Bug #5 | UUID leaks into add_client reply. Fix: tool result shape change + system prompt nudge. |
| Bug #6 | list_clients silently caps at 10. Fix: add "showing 10 of N" suffix to tool result. |
| PDF silence | 3-5 second silence in record_payment while PDF generates. Fix: interim "generating..." message. |

**Never built:**
| Item | Description |
|---|---|
| Couple agent Sonnet routing | Couple-facing agent on vendor threads is Haiku-only. Classifier exists, Sonnet never activated. |
| Twilio template submission | dream_os_morning_briefing on +917982159047 never submitted. Without it morning briefing cannot fire to vendors inactive >24h. Submit immediately — approval takes 1-7 days. |

### Bride side — frozen at B3

**Production bugs (confirmed broken):**
| Bug | Description |
|---|---|
| Circle invite wa.me link | Broken end-to-end. Bride invites a member, the CIRCLE-XXXXXX wa.me link is generated but fails when invitee taps it. Specific failure point TBD on investigation. Circle is unusable for any real bride until fixed. |

**Never phone-tested (code exists, unverified in production):**
| Item | Description |
|---|---|
| Receipt image classifier | Forwarding a real receipt photo → "Got it, filed away." Never verified on real phone. |
| Receipt list + image playback | "Show me my receipts" + WhatsApp image playback. Never verified. |
| Google Vision DOCUMENT_TEXT_DETECTION | End-to-end on a real printed receipt. Never verified. |

**B2 audit findings deferred to B3.1 (never fixed):**
| Code | Description | Severity |
|---|---|---|
| M2 | Duplicate circle session creation race → unique partial index on circle_sessions(circle_member_id) WHERE summarized_to_bride = false | Medium |
| M5 | Brittle string-contains for circle_member_limit_reached → use SQLSTATE or structured exception payload | Medium |
| L2 | image_playback_queued cumulative across tool calls → capture count before loop | Low |
| L5 | circle_sessions_member_activity_idx missing WHERE summarized_to_bride = false | Low |
| L6 | summary_message_id has no FK → add REFERENCES messages(id) ON DELETE SET NULL | Low |
| L9 | Inbound message not logged early enough in handleCircleMemberMessage | Low |
| I4 | Hard cap on text-only circle messages currently unlimited → add daily text cap | Info |

**Never built (from B4 and deferred items):**
| Item | Description |
|---|---|
| Surprise Me | /surprise command → reads muse_saves.aesthetic_tags → Gemini grounded search → internet results in BFF voice. Redefined: Muse feature, not Discover feature. No vendor data needed. No density block. |
| Bride Sonnet routing | Classifier exists, Sonnet never activated on bride side. Bride-specific COMPLEX triggers under-promote. |
| factual_search tool | Bride asks factual market questions → Gemini retrieves → Haiku composes BFF reply. groundedSearch.js already wired, never connected to brideTools. |
| Morning nudge cron | 8am IST daily. Days-to-wedding + today's events + dues within 14 days. |
| list_dues tool | Feeds morning nudge. Query: bookings with balance_due_date within N days. |
| Twilio template dream_wedding_morning_nudge | Submission pending. Approval 1-7 days. |
| Circle invite token 7-day expiry | expires_at column on circle_members. Part of migration 0023. |

**Migration pending (not yet applied):**
| Migration | What it adds |
|---|---|
| 0023_circle_cleanup.sql | 7-day expiry on pending circle invite tokens (expires_at + check in claim_circle_invite). summary_message_id FK to messages(id) ON DELETE SET NULL. circle_sessions unique partial index (M2 fix). |

### Shared — never built
| Item | Description |
|---|---|
| coupleIdentity.js | The disambiguation fix. src/lib/coupleIdentity.js. ensureCoupleRow(phone) + captureField(couple_id, field, value). Called from src/index.js when a couple-side message arrives. Creates users + couples + couple_state rows silently. Gives every bride a permanent couple_id from first contact with any vendor on +91. The 17 disambiguation edge cases documented in the frozen HANDOVER.md collapse once this exists. |

### Admin — deferred (not blocking launch)
| Item | Description |
|---|---|
| Delete button password confirmation | Currently one-click delete in admin. Security gap. Second POST route validates ADMIN_PASSWORD. |
| Vendor list search + filter | Admin can search vendors by name, filter by status. |
| Bulk CSV invite | Admin uploads CSV of vendor phone + name, system invites in bulk. |
| Manual onboarding_state override | Admin can manually push a vendor past a stuck onboarding step. |
| Lead name-based state updates | Currently UUID-only. update_lead_state needs name-based lookup. |

### Post-launch — never on the critical path
| Item | Description |
|---|---|
| Google Calendar OAuth sync | Two-way vendor calendar sync. Meta App Review equivalent for Google. Significant build. |
| Event conflict detection | When vendor creates a clashing event — prompt them. Threshold TBD (founder decision). |
| Tool-call shortcut guardrail | Prevent agent skipping confirmation steps. Verb list TBD (founder decision). |
| Instagram DM integration | Vendor connects Instagram Business account. DMs auto-route to WhatsApp thread. Meta App Review 2-4 weeks. |
| Bride classifier tuning | Waits on 4 weeks of real founding-cohort bride data. Separate brideClassifier.js. |
| Lead → client promotion disambiguation | Conversational disambiguation when phone-only dedup is ambiguous. |
| Twilio status callback race condition | Pre-existing since Session 5.5. Low impact. |
| Anthropic credit-low warning | Agent fails silently if credits run out. Alert needed. |
| Founding cohort pricing model | Free forever vs free for X months. Founder decision when relevant. |
| Paid tier definition for Surprise Me | What triggers Sonnet routing for Surprise Me? Razorpay integration? Founder decision. |
| Two-sided vendor funnel (targeted) | Relay infrastructure for bride-initiated outreach to external vendors. Premium-signal-gated invitations only — gated on bride budget + saved-vendor category mix. No mass nudging. Net-a-Porter brand discipline: scarcity is the product. Design pending real bride data post-launch. New conversation kind needed: vendor_relay. Twilio template approval needed. |

---

## Phase 1 — WhatsApp Standalone (target: v0.10.0-alpha)

**Goal:** Both WhatsApp surfaces work as complete standalone products. Every blocking item cleared.
Every founding-cohort user (vendor or bride) can use the product with full confidence.

### What "standalone" means
- Vendor can run his entire business through +917982159047. Leads, clients, invoices, expenses,
  events, morning briefing — all working. No silent failures. No UUID leaks. No data caps.
- Bride can plan her entire wedding through +14787788550. Muse, Circle, Surprise Me, planner,
  bookings, receipts, morning nudge — all working. Circle invite actually works end-to-end.
- Any bride who messages a vendor on +91 gets a permanent couple_id silently assigned. The 17
  disambiguation edge cases are resolved architecturally, not by workaround.

### CC fixes (Claude Code — surgical edits, no full session needed)

These are applied first, before any Phase 1 session work begins. I prompt CC, CC executes,
Dev verifies one at a time.

| Fix | File(s) | What CC does |
|---|---|---|
| Bug #3 — null leadName | src/index.js | Null check on leadName in returning-bride notification. Fallback to bride's last 4 phone digits. |
| Bug #5 — UUID leak | src/agent/tools.js + src/agent/systemPrompt.js | Change add_client tool result shape to exclude id field. Add system prompt line. |
| Bug #6 — list_clients cap | src/agent/tools.js | Add total count to list_clients query. Return "showing 10 of N" in tool result. |
| PDF interim acknowledgement | src/agent/tools.js | Insert sendWhatsApp() call with "Generating your invoice..." before the PDF generation await in record_payment tool. |
| Couple agent Sonnet routing | src/agent/engine.js | Activate classifier call for couple-facing agent turns. One-line change mirroring vendor agent Sonnet activation. |
| Bride Sonnet routing | src/agent/brideEngine.js | Activate classifier call. Identical pattern to vendor side. Already wired, never called. |
| B2 audit L2 | src/agent/brideEngine.js | Capture image_playback_queued count before loop, not inside it. |
| B2 audit L5 | db/migrations (note only — index already in 0023) | Confirm index definition includes WHERE summarized_to_bride = false. |
| B2 audit L6 | Deferred to migration 0023 | FK added in migration, not via CC. |
| B2 audit L9 | src/brideIndex.js | Move inbound message log to earlier in handleCircleMemberMessage. |
| Admin delete confirmation | src/admin/ | Add password confirmation step to delete route. Second POST validates ADMIN_PASSWORD env var. |

### Phase 1 sessions (full sessions, after CC fixes)

**Session P1-1 — Migration 0023 + Circle invite bug fix**

Priority: first. Circle is broken in production. No real bride can use Circle until this is fixed.

What ships:
- Investigate circle invite wa.me link failure end-to-end:
  invite_circle_member() Postgres function → admin/agent response → wa.me link composition →
  brideIndex.js claim regex → claim_circle_invite() function. Find the break.
- Fix the broken link.
- Apply migration 0023_circle_cleanup.sql:
  - expires_at column on circle_members (7-day expiry on pending tokens)
  - Updated claim_circle_invite() to reject expired tokens
  - summary_message_id FK to messages(id) ON DELETE SET NULL
  - circle_sessions unique partial index on (circle_member_id) WHERE summarized_to_bride = false (M2 fix)
- Fix B2 audit M5: replace brittle string-contains for circle_member_limit_reached with
  SQLSTATE or structured exception payload.
- Fix B2 audit I4: add daily text cap for circle members (separate from image cap).
- Phone-test end-to-end circle flow: bride invites → CIRCLE-XXXXXX link works → member joins →
  member saves image → session closes (10 min idle) → bride messages → summary preamble appears.

Migrations: 0023_circle_cleanup.sql

**Session P1-2 — Receipt classifier phone-test + Surprise Me**

Priority: second. Surprise Me is the first new feature. Receipt classifier verification is
a prerequisite — it must be confirmed working before Surprise Me builds on the same pipeline.

What ships:

Receipt verification (phone-test only, no new code unless bugs found):
- Forward real receipt photo to +14787788550 → confirm "Got it, filed away" response, no Muse save
- "Show me my receipts" → confirm list returned correctly
- Image playback → confirm Cloudinary URL sends as WhatsApp image
- Google Vision DOCUMENT_TEXT_DETECTION → confirm routing on a printed receipt

Surprise Me (new feature):
- /surprise command handler in brideIndex.js
- Reads muse_saves.aesthetic_tags for the couple (dominant tags by frequency)
- Passes top 3-5 tags to src/lib/groundedSearch.js (Gemini Flash-Lite, already wired)
- Gemini returns browsable internet results matching the aesthetic
- Haiku composes BFF-voice reply with results: "Based on your board — lots of moody editorial,
  some rustic — here's what I'd be looking at right now: [results]"
- Failure path: graceful fallback if Gemini errors → "Having a moment with the search — try again in a bit"
- Edge case: bride has fewer than 3 Muse saves → "Save a few more things to your board first and
  I'll have more to work with"
- Phase 2: Surprise Me gets a dedicated tab in bride PWA. Same data, visual grid layout.
- Phase 3: Surprise Me adds vendor results from vendors.aesthetic_tags alongside internet results.
  No code change needed at Phase 3 — just an additional query layer.

No migration needed for this session.

**Session P1-3 — factual_search tool (Gemini) + Morning nudge**

What ships:

factual_search tool:
- Add factual_search tool to src/agent/brideTools.js
- Executor in brideEngine.js calls src/lib/groundedSearch.js
- Tool description: use for factual market questions (venue pricing, designer costs, current rules,
  public event dates). Do NOT use for taste, opinion, or aesthetic questions — those are just chat.
- Gemini retrieves; Haiku composes BFF-voice reply. Gemini never composes the reply.
- Failure path: graceful fallback if Gemini errors.

Morning nudge (bride):
- list_dues(within_days?) tool added to brideTools.js: returns bookings with balance_due_date
  within N days, sorted by date, computed in SQL. Feeds the nudge.
- Morning nudge cron: 8am IST daily. Content: days-to-wedding count + today's events +
  dues within 14 days. Same cron pattern as vendor morning briefing (Session 6).
- Twilio template dream_wedding_morning_nudge submitted at start of this session.
  Approval takes 1-7 days. Build the cron while waiting.
- Sent as free-form message if 24h WhatsApp session window open.
  Sent as utility template if window closed.

Vendor morning briefing template:
- dream_os_morning_briefing on +917982159047: submit at start of this session if not already done.
  This was supposed to be submitted at Session 6.5 (2026-05-15). It was not. Submit immediately.

No migration needed for this session.

**Session P1-4 — coupleIdentity.js + disambiguation fix**

This is the most architecturally significant item in Phase 1. It closes the problem that
froze vendor development at 8.5a.

The problem:
When a bride messages a vendor on +91 via a TDW wa.me link, src/index.js creates a users row
(for counterparty_user_id) and a conversations row (kind=couple_thread, vendor_id set,
couple_id=null). The XOR constraint passes because vendor_id is set. But no couples row is
created. The bride is just a phone number. If she messages two vendors, she's two unconnected
phone threads with no shared identity. The 17 disambiguation edge cases in HANDOVER.md (frozen)
are all workarounds for this absence.

The fix:
Create src/lib/coupleIdentity.js with two exported functions:

ensureCoupleRow(phone, name):
- Look up users row by phone. Create if absent.
- Look up couples row by user_id. Create if absent (onboarding_state='new').
- Create couple_state row if absent.
- Return { user_id, couple_id }.
- Idempotent — safe to call on every inbound couple-side message.

captureField(couple_id, field, value):
- Silently writes wedding details (date, city, budget) to couples row as they're mentioned
  naturally in vendor conversation.
- Vendor agent only writes via this helper. Never writes to couple_state.summary directly
  (that's the bride agent's working memory, kept pristine).

Call sites in src/index.js:
- Called at Step A (TDW code match), Step B (returning couple), Step C (new couple) entry points
- Called BEFORE the conversation row is created so couple_id is available
- The bride's persistent couple_id is now available from first contact with any vendor

XOR note: conversations.vendor_id is set for couple_thread rows (vendor owns the thread).
The bride's identity is reached via conversations.counterparty_user_id → users.id →
couples.user_id. No XOR change needed. The couple_id is reachable through the join, not
by stamping it on the conversation row.

Silent onboarding nudge:
- After 3+ meaningful exchanges on any vendor thread, vendor agent appends one line once:
  "We're opening The Dream Wedding's planning tool to a small group of brides. If you'd like
  a peek: thedreamwedding.in/explore"
- couples.nudge_sent_at stamped. Never appended again from any vendor, ever.
- One nudge per bride, lifetime. Not on first exchange. Threshold: 3+ meaningful exchanges.
- Check couples.nudge_sent_at before appending. If already stamped: skip silently.

Smoke tests:
- Bride messages vendor on +91 for first time → couples row created silently, onboarding_state='new'
- Same bride messages second vendor → SAME couples row found via phone lookup, not a new one
- After 3+ exchanges → nudge appended once, nudge_sent_at stamped
- Same bride messages third vendor → nudge NOT appended again
- Bride who is already a dream-os bride (has couple_id from +14787788550) → ensureCoupleRow
  finds existing couples row, does not create duplicate (couples.user_id UNIQUE constraint
  from migration 0015 protects this)

No migration needed. coupleIdentity.js uses existing schema.

**Session P1-5 — Bug cleanup before Phase 1 close ✅ DONE (2026-05-18)**

Five fixes shipped. Version bumped to 0.10.0-alpha. Phase 1 closed.

Commits:
- 07f8ce9 — Bug #1 (capture_couple_lead guard) + Bug #3 (counterparty_user_id)
- 07bbdfa — Bug #2 (circle summary delivery)
- b480b23 — Bug #4 (bare handle global fuzzy-match before sticky)
- 58df6fb — TDW code replaced with 'hi' as inbound to couple agent

1. **Bug #1 ✅** — capture_couple_lead guard added in engine.js:344.
   `if (isReturningBride && existingLeadForCouple?.id) continue` — no-op for
   returning brides. Phone-tested: no re-fire on subsequent messages.

2. **Bug #2 ✅** — Circle summary delivery fixed. Root cause: fake-assistant
   injection ignored by Haiku on short messages (Hypothesis A confirmed via
   Railway logs — 582 input tokens, 13 output, "You alright?" reply with no
   mention of Meha). Fix: summary now sent as a separate WhatsApp message
   from brideIndex.js BEFORE the agent reply. Two bubbles confirmed on
   Swati's phone (+919888294440). Architecture: brideEngine.js returns
   circleSummary field; brideIndex.js sends it via sendWhatsApp then
   continues to agent reply as before.

3. **Bug #3 ✅** — counterparty_user_id: user.id added to both Step A
   (~line 261) and Step B (~line 429) conversations.insert in src/index.js.
   Cascade deletes now fire correctly.

4. **Bug #4 ✅** — Bare handle global fuzzy-match inserted before sticky
   block in src/index.js. If message looks like a handle (3-12 chars
   alphanumeric, single word, no TDW- prefix) and matches exactly one vendor
   handle globally within Levenshtein distance 2 → "Did you mean TDW-XXX?"
   0 or 2+ matches → fall through to sticky as before.

5. **TDW 'hi' fix ✅** — When routing path is TDW-code, inboundMessage
   passed to runCoupleAgenticTurn is now 'hi' instead of body. Prevents
   agent receiving "TDW-DEV550" as a conversation opener and producing
   confused replies. Phone-tested: returning bride gets "Hi there! What's
   on your mind?" and new bride gets full PA onboarding greeting.

Additional verifications:
- Same-bride-two-vendors: Malaysian test bride (+60122687535) messaged
  DEV550 and TEST999 (synthetic vendor 8d725050, created via SQL for test).
  Supabase query confirmed one couples row (285ccb5a). ✅
- No regression on P1-4 capabilities confirmed via Railway logs.

No migrations. No schema changes. No new files (except TEST999 synthetic
vendor in DB — can be deleted anytime, harmless).

Done criteria for P1-5:
- [x] All four bugs fixed and phone-tested
- [x] Audit pass complete
- [x] No regression to P1-4 capabilities
- [x] TDW 'hi' fix shipped and verified
- [x] Same-bride-two-vendors smoke test passed
- [x] Version bumped to 0.10.0-alpha
- [x] Phase 1 closed. Phase 2 PWA-0 next.

### Phase 1 — migration summary
| Migration | Session | What it adds |
|---|---|---|
| 0023_circle_cleanup.sql | P1-1 | expires_at on circle_members, summary_message_id FK, circle_sessions unique partial index |

### Phase 1 — done criteria
- [x] All CC fixes applied and verified
- [x] Migration 0023 applied
- [x] Circle invite works end-to-end on a real phone
- [x] Receipt classifier verified on a real receipt photo
- [x] Sonnet routing active on both vendor couple-agent and bride agent
- [x] coupleIdentity.js exists and is called from src/index.js (P1-4, commit a98d6b0)
- [x] First-contact bride receives full PA onboarding tone (P1-5 hotfix, commit 95fb303)
- [x] Lead captured with full data on completion of onboarding flow (smoke tested 2026-05-17)
- [x] couples row created silently on first bride contact (smoke tested 2026-05-17)
- [x] captureField mirrors wedding_date, wedding_city, budget_total into couples (smoke tested 2026-05-17)
- [ ] Surprise Me returns results for a bride with 3+ Muse saves ⚠️ BLOCKED — Google billing verification pending (submitted 2026-05-17). Retest once cleared.
- [ ] factual_search returns Gemini-grounded results for a market question ⚠️ BLOCKED — same Google billing block. Graceful fallback active.
- [ ] Morning nudge fires correctly for a test bride at 8am IST ⚠️ PENDING — first fire next morning. Cron registered in Railway logs.
- [ ] Twilio templates submitted (dream_os_morning_briefing + dream_wedding_morning_nudge) ⚠️ PENDING — never submitted. Approval takes 1-7 days. Submit at start of next available session. Blocks morning briefing for inactive vendors/brides.
- [x] Circle session summary smoke test ✅ — two bubbles confirmed on Swati's phone (2026-05-18)
- [x] Bug #1 P1-5 fixed — returning-bride agent no longer re-calls capture_couple_lead (commit 07f8ce9)
- [x] Bug #3 P1-5 fixed — conversations.counterparty_user_id populated on Step A and Step B inserts (commit 07f8ce9)
- [x] Bug #4 P1-5 fixed — bare-handle messages globally fuzzy-matched before sticky catches them (commit b480b23)
- [x] Same bride messaging two vendors → single couples row confirmed via Supabase (2026-05-18, one couples row for +60122687535)
- [x] Version bumped to 0.10.0-alpha, docs updated, committed and pushed (2026-05-18)

---

## Phase 2 — PWA + WhatsApp Intelligence (target: v0.11.0-alpha)

**Goal:** Both products visible and intelligent. WhatsApp PA achieves DreamAI v3 quality.
dreamos-pwa live on Vercel. Founding cohort can be onboarded. dream-wedding Railway retired.

### Phase 2 — session sequence

P2-1: WhatsApp agent lifts (vendor + bride). Backend only. Phone-tested. [DONE 2026-05-18]
P2-2: dreamos-pwa URL swap + Vercel deploy. Shell live. Coming Soon on post-launch screens. [DONE 2026-05-18]
P2-3: Landing page infrastructure + full auth block. DB foundations, invite/waitlist/auth endpoints, admin mint. [DONE 2026-05-18]
P2-4: JWT issuance. Block 1 auth complete. Phone-tested. [DONE 2026-05-18]
P2-5: Landing page build + wire 6 login screens to live endpoints. dreamos-pwa frontend session.
P2-6+: Block 2 vendor core -> Block 3 bride core -> Block 4 journey.
P2-final: Migrations 0024 + 0026 applied. dream-wedding retired. Version 0.11.0-alpha.

### WhatsApp surface — LOCKED

WhatsApp = PA surface. Proactive, brief, voice-first.
Max 2-3 sentences. Never lists more than 3 items. Drops PWA link for visual/data.
Answers reads from baked snapshot. Zero tool round-trip for reads.
Drafts before sending anything client-facing. Vendor approves first.
Offers options before destructive actions.

PWA = Planner surface. ActionCard + Just Do It toggle. Streaming. Suggestion chips.

### DreamAI v3 lifts — P2-1 (vendor WhatsApp, backend only)

1. Baked snapshot — buildVendorSnapshot() fetches invoices, schedule, enquiries, notes
   in parallel. Rendered as text in system prompt. Agent answers reads from it.
2. query_day tool — one tool call for all data on a specific date.
3. hot_dates_context tool — Vivah Muhurat dates 2026/2027.
4. Draft-before-send — client messages drafted first, vendor approves before sending.
5. Multi-option response — offer options before destructive or client-facing actions.
6. pending_invoices_more — top 3 inline, rest: "Full list: thedreamai.in/money"

### Bride agent lifts — P2-1 (alongside vendor)

Confirm cards before mutations. Follow-up prompts after AI replies.
Contact vendor drafting. Clarify pattern for disambiguation.

### New vendor WhatsApp tools — P2-1

list_expenses, query_day, hot_dates_context,
update_event, delete_event, delete_lead,
update_client, delete_client, cancel_invoice,
update_expense, delete_expense.

Dropped: list_payments. Cash-heavy market, opt-in logging, list_invoices sufficient.

PWA-only: ActionCard, Just Do It toggle, suggestion chips, streaming.

### dreamos-pwa — frontend repo

GitHub: https://github.com/devjroy-dev/dreamos-pwa
Stack: Next.js 16, React 19, Tailwind v4, TypeScript. Deploy: Vercel.
Source: tdw-2/web/. tdw-2 frozen reference.

Vendor PWA — three-mode (LOCKED):
  Pill: BUSINESS / AI / DISCOVERY
  BUSINESS: TODAY, CLIENTS, MONEY, STUDIO
  AI: full screen chat no chrome
  DISCOVERY: Coming soon placeholder (Phase 3)

Bride PWA — three-mode (LOCKED):
  Pill: PLAN / ✦ / DISCOVER (gold ✦ = DreamAi full screen chat)
  PLAN: TODAY, PLAN, CIRCLE
  ✦ mode: full screen DreamAi chat, no chrome
  DISCOVER: MUSE, FEED, MESSAGES
  No FAB. Consistent with vendor three-mode pattern.

Coming soon pattern: "Coming soon - your data is safe with us." on any unbuilt screen.

### PWA login sequence — LOCKED

New user (invite code): invite code -> phone -> WhatsApp OTP -> set PIN -> enter app
New user (via WhatsApp): sign in -> phone -> WhatsApp OTP -> set PIN -> enter app
Returning user: phone -> PIN -> enter app (no OTP)
PIN: bcrypt hash stored in vendors.pin_hash / couples.pin_hash. NULL = not set yet.
Session: Supabase Auth JWT. No custom sessions table.
6 screens built fresh: /vendor/login, /vendor/pin, /vendor/pin-login + couple equivalents.

### Discover preview — Phase 2

Bride FEED tab: 4-5 founding vendors. Pure view. No enquire button.
Vendor DISCOVERY mode: own profile preview. Pure view.
Endpoint: GET /api/v2/discover/preview (WHERE discover_preview=true). No auth required.
Swati seeds manually. Admin panel in post-Phase 2 admin session.
Requires 0024 (vendor_portfolio) + 0029 (discover_preview column) applied first.

### Post-Phase 2 admin session

1. hot_dates panel
2. Just Explore management (exploring_photos)
3. Cover photo management (landing_slides)
4. Discover preview management
5. Any accumulated admin needs

### Endpoint build order

Block 1 Auth:
  POST /api/v2/vendor/auth/send-otp
  POST /api/v2/vendor/auth/verify-otp
  POST /api/v2/couple/auth/send-otp
  POST /api/v2/couple/auth/verify-otp
  Auth: phone -> WhatsApp OTP -> PIN 4 digits -> session.

Block 2 Vendor core:
  GET  /api/v2/vendor/today/:vendorId
  GET  /api/v2/dreamai/vendor-context/:vendorId
  POST /api/v2/dreamai/chat
  GET  /api/invoices/:vendorId
  GET  /api/v2/vendor/clients/:vendorId
  GET  /api/v2/vendor/leads/:vendorId
  GET  /api/v2/vendor/events/:vendorId
  GET  /api/v2/vendor/expenses/:vendorId

Block 3 Bride core:
  POST /api/v2/dreamai/bride-chat
  GET  /api/v2/dreamai/bride-idle/:coupleId
  GET  /api/v2/frost/home-images/:coupleId
  GET  /api/couple/muse/:coupleId
  GET  /api/v2/frost/circle/feed/:coupleId
  POST /api/v2/frost/circle/messages
  POST /api/v2/frost/surprise-me
  POST /api/v2/dreamai/bride-confirm

Block 4 Journey tools:
  GET /api/couple/expenses/:coupleId
  GET /api/v2/couple/events/:coupleId
  GET /api/couple/vendors/:coupleId
  GET /api/couple/bookings/:coupleId

Block 5: Retire dream-wedding Railway after all screens confirmed on dream-os.

### Phase 2 — migrations

Migration naming convention changed: letter suffixes retired. Clean integers only.
Convention: 0024a->0024, 0024b->0027, 0025=hot_dates(applied), 0026=invoices_last_payment_at.

0024  vendor_profile.sql             Phase 2 start. aesthetic_tags, rate_min/max, vendor_portfolio, portfolios bucket.
0025  hot_dates.sql                  Phase 2. hot_dates table. APPLIED 2026-05-18.
0026  invoices_last_payment_at.sql   Phase 2. invoices.last_payment_at timestamptz.
0027  discover.sql                   Phase 3. couple_vendor_connections, discover_readiness, vendors.discover_eligible.
0028  pin_auth.sql                   Phase 2 Block 1. vendors/couples PIN columns (pin_hash, pin_failed_attempts, pin_locked_until). enforce_role_xor() + triggers. APPLIED 2026-05-18.
0029  discover_preview.sql           Phase 2 Block 2. vendors.discover_preview boolean default false.
0030  landing_assets.sql             Landing page session. landing_slides + exploring_photos tables.
0031  invite_codes.sql               P2-3. invite_codes table + consume_invite_code(). APPLIED 2026-05-18.
0032  waitlist_signups.sql           P2-3. waitlist_signups table. APPLIED 2026-05-18.
0033  otp_sessions.sql               P2-3. otp_sessions table. Transient OTP state. APPLIED 2026-05-18.

### Profile completion tab (vendor PWA)

Unchanged from previous spec. Write-enabled. Portfolio images, aesthetic tags, rate range.
This is the Discover data collection surface. Populates vendor data passively before Phase 3.

### Phase 2 — done criteria
- [ ] Twilio templates submitted (both numbers) ⚠ still pending
- [x] Six vendor agent lifts phone-tested ✅ 2026-05-18
- [x] Bride agent lifts B1-B4 phone-tested ✅ 2026-05-18
- [x] Migration 0025 hot_dates applied ✅ 2026-05-18
- [x] dreamos-pwa deployed to Vercel ✅ 2026-05-18
- [x] Landing page session complete (waitlist flow decided + built) ✅ 2026-05-18
- [x] Login/invite sequence built fresh (phone -> WhatsApp OTP -> PIN) ✅ 2026-05-18
- [x] Block 1 auth endpoints live ✅ 2026-05-18
- [x] Block 1 JWT issuance live ✅ 2026-05-18 (Finding #11 resolved)
- [ ] Block 2 vendor core live — TODAY shows real data
- [ ] Block 3 bride core live — bride PWA functional
- [ ] Block 4 journey tools live
- [ ] New vendor tools built (update_event, delete_event, delete_lead, update_client, delete_client, cancel_invoice, update_expense, delete_expense, list_expenses)
- [ ] Admin panel for hot_dates management live
- [ ] Migrations 0024, 0026, 0028, 0029 applied
- [ ] dream-wedding Railway retired
- [ ] Version 0.11.0-alpha, docs updated, committed and pushed

---

## Phase 3 — Discover (target: v1.0.0)

**Goal:** The two standalone products connect. Discover goes live at thedreamwedding.in/discover.
This is the public launch. v1.0.0.

**Prerequisite for Phase 3:**
- Phase 1 and Phase 2 complete
- Founding cohort vendors have completed their profiles (portfolio images + aesthetic tags + rate range)
  This happens passively via vendor PWA profile completion during Phase 2.
- Swati has done an editorial pass on vendors.discover_eligible
- density per (city, category) assessed and discover_readiness table seeded by Dev/Swati

### What Discover is

Discover is a curated vendor marketplace hosted at thedreamwedding.in/discover. It is not
open to all dream-os vendors — curation is by editorial decision. Payment gets a vendor
considered. Style gets them featured. Swati has editorial control via vendors.discover_eligible.

Discover is the crossroads where brides and vendors meet with context. A bride who enquires
from Discover carries her couple_id and taste profile. The vendor gets a qualified lead, not
a cold one. Notification: "Priya (moody editorial, budget Rs 3L+) just enquired."

### Surprise Me Phase 2

Surprise Me gets vendor results added alongside internet results. No new AI work. Just an
additional query layer: read vendors WHERE discover_eligible=true AND city matches AND
aesthetic_tags overlap with bride's dominant tags. Return alongside Gemini internet results.
Rendered in the same bride PWA Surprise Me tab.

### What ships in Phase 3

**Schema (migration 0024b):**
- couple_vendor_connections table: id uuid PK, couple_id FK couples(id) ON DELETE CASCADE,
  vendor_id FK vendors(id) ON DELETE CASCADE, state text CHECK (shortlisted/enquired/booked/passed),
  source text CHECK (muse/discover/whatsapp/manual), shortlisted_at timestamptz, enquired_at timestamptz,
  notes text, created_at timestamptz, updated_at timestamptz.
  Index on (couple_id), (vendor_id), (couple_id, state).
- discover_readiness table: city text, category text, ready boolean default false,
  ready_at timestamptz, PRIMARY KEY (city, category).
  Dev/Swati flip ready=true manually when density threshold met (8 vendors/category/city minimum).
- vendors.discover_eligible boolean NOT NULL default false. Swati-managed editorial toggle.

**Bride WhatsApp tools:**
- shortlist_vendor(vendor_id, notes?) — bride saves a vendor she likes →
  couple_vendor_connections row inserted (state=shortlisted, source=discover or muse) +
  leads row created on vendor side simultaneously with couple_id stamped.
- list_my_vendors(state?) — bride sees all her vendor connections with state.
  Her pipeline: "Studio Anvaya (photographer, shortlisted), Chevron (MUA, enquired)."
- ask_vendor(vendor_id, message) — bride routes a message to a specific dream-os vendor in
  her list. Routes via existing couple_thread mechanism. Works only for dream-os vendors.

**Discover UI (thedreamwedding.in/discover):**
- Browsable vendor profiles: portfolio images (from vendor_portfolio), aesthetic tags,
  category, city, rate_min/rate_max, discover_eligible=true only.
- Filter by category, city, budget range.
- Bride's taste profile (from muse_saves.aesthetic_tags) pre-filters results.
- Shortlist button → shortlist_vendor tool call → couple_vendor_connections row.
- Enquire button → ask_vendor tool call → message routed to vendor's couple_thread.

**Vendor profile page on Discover:**
- Public URL: thedreamwedding.in/discover/vendor/[routing_handle]
- Shows portfolio images, aesthetic style, category, city, rate range.
- Swati-managed. Vendor cannot edit directly from this page — edits go through vendor PWA
  profile completion tab.

**Vendor notification with bride context:**
- When bride shortlists or enquiries via Discover, vendor gets WhatsApp notification:
  "Priya (moody editorial, budget Rs 3L+) just enquired. Reply here to connect."
- Context sourced from couple_state.taste_notes and couples.budget_total.
- This is a qualified lead. Not cold.

**Infrastructure:**
- RLS enabled on Supabase. Before Discover surfaces vendor data to unauthenticated brides,
  row-level security must be live. Policy: vendors table public reads limited to
  discover_eligible=true rows and safe columns only (no leads, clients, invoices, expenses).
- Railway region move: EU West → Mumbai. 150-200ms latency acceptable at 50 vendors.
  Must happen before scaling beyond founding cohort. Do at Phase 3 start, before traffic grows.

**Schema debt resolution:**
- user_id / couple_id naming inconsistency inherited from tdw-2. The tdw-2 web app uses
  user_id in GET endpoints and couple_id in POST/PATCH/DELETE. Both are the same value
  (session.id from localStorage couple_session). Safe to carry through Phase 1 and Phase 2.
  Resolve at Phase 3 with a coordinated migration. Do NOT rename columns mid-flight without this.

**dreamos-pwa tdw-2 hygiene cleanup (bundle into one coordinated Phase 3 PR):**
All items are cosmetic/consistency — no functional change, no user-visible difference.
Bundle because they touch overlapping files and one PR is safer than five.

1. user_id / couple_id resolution (see above).

2. Path-alias migration — replace relative imports (../../../../lib/api) with @/lib/api.
   Requires adding paths + baseUrl to tsconfig.json compilerOptions. ~60+ files.

3. CircleSessionContext re-export shim removal.
   In P2-2, app/coplanner/CircleSessionContext.tsx was changed from:
     export const API = 'https://dream-wedding-production-89ae.up.railway.app';
   to:
     export { API_BASE as API } from '../../lib/api';
   This shim was needed because P2-2 scope was strictly URL swap — the 7 coplanner files
   that import API from this file were outside the URL-swap target list.
   When Phase 3 hygiene runs:
   (a) Update these 7 files to import API_BASE directly from lib/api:
       app/coplanner/dreamai/page.tsx, muse/AddMuseSheet.tsx, muse/page.tsx,
       threads/[threadId]/page.tsx, threads/page.tsx, layout.tsx, page.tsx
   (b) Replace ${API} with ${API_BASE} in those 7 files
   (c) Remove the re-export shim from CircleSessionContext.tsx

4. Admin page cleanup — remove hardcoded admin password from 25 files.
   Done as part of admin page rebuild (server-side auth). See FINDINGS_LOG #1.

See FINDINGS_LOG.md for full details on each item.

**Doc consolidation at Phase 3:**
- HANDOVER_BRIDE.md archived (frozen at B3). HANDOVER.md becomes single active handover.
- ROADMAP_BRIDE.md archived. ROADMAP_FINAL.md remains the single active roadmap.
- B-session naming convention (B1, B2, B3) kept as historical record in archived docs only.

### Phase 3 — migrations
| Migration | What it adds |
|---|---|
| 0024b_discover.sql | couple_vendor_connections, discover_readiness, vendors.discover_eligible |

### Phase 3 — done criteria
- [ ] Migration 0024b applied
- [ ] vendors.discover_eligible column populated by Swati editorial pass
- [ ] discover_readiness seeded for at least 3 cities, at least 1 category each
- [ ] RLS enabled on Supabase — vendors table read policy live
- [ ] Railway region moved to Mumbai
- [ ] shortlist_vendor, list_my_vendors, ask_vendor tools working in WhatsApp
- [ ] Discover UI live at thedreamwedding.in/discover
- [ ] Vendor profile pages live at thedreamwedding.in/discover/vendor/[handle]
- [ ] Surprise Me Phase 2: vendor results appear alongside internet results
- [ ] Vendor notifications include bride taste context on Discover enquiries
- [ ] user_id / couple_id naming inconsistency resolved
- [ ] Doc consolidation complete
- [ ] Version bumped to 1.0.0, all docs updated, committed and pushed

---

## Complete migration sequence (all phases)

| # | File | Phase | Status | What it adds |
|---|---|---|---|---|
| 0001 | initial_schema.sql | V1 | ✅ Applied | users, vendors, couples, conversations, messages |
| 0002 | agent_substrate.sql | V2 | ✅ Applied | vendor_state, notes, pending_actions |
| 0003 | vendor_onboarding.sql | V3 | ✅ Applied | vendors.onboarding_state, invite_vendor() |
| 0004 | leads.sql | V4 | ✅ Applied | leads table |
| 0005 | tdw_handles.sql | V5 | ✅ Applied | vendors.routing_handle, vendors.instagram_handle, users.email |
| 0006 | travel_preference.sql | V5 | ✅ Applied | vendors.open_to_travel, vendors.travel_notes |
| 0007 | events_and_briefing.sql | V6 | ✅ Applied | events table, messages.delivery_status, vendors.briefing_enabled |
| 0008 | invoices.sql | V7 | ✅ Applied | invoices table, vendors.invoice_prefix, vendors.invoice_counter |
| 0009 | message_cost_tracking.sql | V8.1 | ✅ Applied | messages cost columns, vendors.style_notes |
| 0010 | expenses.sql | V8.3 | ✅ Applied | expenses table |
| 0011 | clients.sql | V8.5 | ✅ Applied | clients table, leads.client_id, invoices.client_id |
| 0012 | routing_disambiguation.sql | V8.5 | ✅ Applied | users.pending_routing_context |
| 0013 | couples_onboarding.sql | B1 | ✅ Applied | couples.onboarding_state, couple_state, events/notes XOR, invite_couple() |
| 0014 | conversations_xor.sql | B1 | ✅ Applied | conversations.couple_id, XOR constraint |
| 0015 | pronouns_and_dedup.sql | B1 | ✅ Applied | users.pronouns, couples.user_id UNIQUE |
| 0016 | muse_and_circle.sql | B2 | ✅ Applied | muse_saves, circle_members, circle_activity |
| 0017 | circle_sessions.sql | B2 | ✅ Applied | circle_sessions table |
| 0018 | fix_muse_saves_fk.sql | B2 hotfix | ✅ Applied | muse_saves.saved_by_user_id FK ON DELETE CASCADE |
| 0019 | bride_planner.sql | B3 | ✅ Applied | couple_tasks, couple_bookings, couple_receipts, record_payment() |
| 0020 | drop_task_priority.sql | B3 | ✅ Applied | Drops priority column from couple_tasks |
| 0021 | couple_receipts_label.sql | B3 | ✅ Applied | couple_receipts.label column |
| 0022 | task_event_merge.sql | B3 | ✅ Applied | Copies couple_tasks → events (kind=reminder). couple_tasks retired. |
| 0023 | circle_cleanup.sql | P1-1 | ✅ Applied 2026-05-17 | expires_at on circle_members, summary_message_id FK, circle_sessions unique partial index, structured exceptions on invite/claim functions |
| 0024 | vendor_profile.sql | P2 | ⏳ Pending | vendors.aesthetic_tags, vendors.rate_min/max, vendor_portfolio table, portfolios bucket |
| 0025 | hot_dates.sql | P2 | ✅ Applied 2026-05-18 | hot_dates table. Vivah Muhurat 2026/2027. 60+ dates seeded. |
| 0026 | invoices_last_payment_at.sql | P2 | ⏳ Pending | invoices.last_payment_at timestamptz. Set by record_payment. |
| 0027 | discover.sql | P3 | ⏳ Pending | couple_vendor_connections, discover_readiness, vendors.discover_eligible |
| 0028 | pin_auth.sql | P2 Block 1 | ✅ Applied 2026-05-18 | vendors/couples PIN columns + lockout columns. enforce_role_xor() + triggers. Hard role XOR at DB level. |
| 0029 | discover_preview.sql | P2 Block 2 | ⏳ Pending | vendors.discover_preview boolean. Bride FEED preview. |
| 0030 | landing_assets.sql | Landing page session | ⏳ Pending | landing_slides + exploring_photos tables + storage buckets. |
| 0031 | invite_codes.sql | P2-3 | ✅ Applied 2026-05-18 | invite_codes table + consume_invite_code() atomic function. |
| 0032 | waitlist_signups.sql | P2-3 | ✅ Applied 2026-05-18 | waitlist_signups table. Landing page waitlist capture. |
| 0033 | otp_sessions.sql | P2-3 | ✅ Applied 2026-05-18 | otp_sessions table. Transient OTP state for PWA login. |

---

## Test credentials (current)

| Item | Value |
|---|---|
| Vendor WhatsApp | +917982159047 |
| Bride WhatsApp | +14787788550 |
| Test vendor phone (Dev) | +918757788550 |
| Test vendor UUID | 2eb5d3fb-31eb-4b26-859a-cf10ae477d53 |
| Test vendor routing_handle | DEV550 |
| Second test vendor (Swati) | SWATI978, UUID e036ea4d-3f9a-4ec5-ba89-a5defa3a042b |
| Test couple phone (Swati) | +919888294440 |
| Test couple couple_id | 7abccc1b-0698-43ba-9709-c6a1e52af789 |
| Test couple phone (Meha) | +919625759924 |
| Supabase project | nvzkbagqxbysoeszxent (Mumbai, ap-south-1) |
| Railway vendor service | https://dream-os-production.up.railway.app |
| Railway bride service | https://dream-wedding-production-6cef.up.railway.app |
| Admin | https://dream-os-production.up.railway.app/admin |
| Google Cloud project | dream-os (gen-lang-client-0017514064) on dev@thedreamwedding.in |
| Cloudinary cloud | dccso5ljv |
| Anthropic workspace | dream-os |

---

## Railway env vars (current)

| Var | Value | Notes |
|---|---|---|
| TWILIO_WHATSAPP_NUMBER | whatsapp:+917982159047 | Vendor number. Permanent. |
| TDW_WA_NUMBER | 917982159047 | Vendor number. Permanent. |
| BRIDE_WA_NUMBER | 14787788550 | Bride number. Permanent. |
| ANTHROPIC_API_KEY | (in Railway) | workspace: dream-os |
| GOOGLE_API_KEY | (in Railway) | Google AI Studio, dev@thedreamwedding.in, free tier |
| ADMIN_PASSWORD | (in Railway) | Admin login |
| SUPABASE_URL | (in Railway) | nvzkbagqxbysoeszxent |
| SUPABASE_SERVICE_ROLE_KEY | (in Railway) | service_role, never expose publicly |

---

## Document discipline (active rules from this session onwards)

1. **ROADMAP_FINAL.md** — this document. Single active roadmap. Updated at end of every session.
2. **HANDOVER_FINAL.md** — single active handover. Fully rewritten at end of every session. Covers both products.
3. **SCHEMA.md** — fully rewritten at end of every session. Unified. Covers both products.
4. **FINDINGS_LOG.md** — append-only. Out-of-scope findings across all sessions. Added P2-2. Read after SCHEMA.md.
5. **ROADMAP.md** — frozen at vendor 8.5a. Historical record only. Do not update.
6. **ROADMAP_BRIDE.md** — frozen at B3. Historical record only. Do not update.
7. **HANDOVER_BRIDE.md** — frozen at B3. Historical record only. Do not update.
8. **UNIT_ECONOMICS.md** — Dev's reference only. No session amends it.
9. **B1_SPEC.md** — historical record. Do not update.

Session not complete until ROADMAP_FINAL.md, HANDOVER_FINAL.md, SCHEMA.md, and FINDINGS_LOG.md are committed and pushed.

Rule 14 (added P2-1): At session start, after reading docs, Claude briefs founder on what
the session will build — one thing at a time — and waits for explicit confirmation before
writing any code.

---

## Post-launch backlog (no sequence dependency, build when relevant)

| Item | Description | Trigger |
|---|---|---|
| Admin bulk CSV invite | Upload CSV of phone + name, system invites in bulk | When Swati onboards >10 vendors at once |
| Tax / GST compliance | Invoice GST fields, TDS at payment, GST reporting. Scope TBD. | Founding cohort confirmed Rs 20L+ turnover |
| Admin hot_dates panel | Add/edit/delete Vivah Muhurat dates without Supabase access. Phase 2 addition. | Build during P2 admin work |
| Admin vendor list search + filter | Search by name, filter by status | When vendor list exceeds 20 |
| Admin manual onboarding_state override | Push a stuck vendor past an onboarding step | When a vendor gets stuck in production |
| Admin lead name-based state updates | update_lead_state by name, not UUID | When vendors start complaining about UUID requirement |
| Google Calendar OAuth sync | Two-way vendor calendar sync | When vendors request it |
| Event conflict detection | Prompt vendor when new event clashes | Threshold TBD — founder decision required first |
| Tool-call shortcut guardrail | Prevent agent skipping confirmation steps | Verb list TBD — founder decision required first |
| Instagram DM integration | Vendor connects IG Business. DMs auto-route to WhatsApp thread. Meta App Review 2-4 weeks. | When vendor Instagram outreach becomes a priority |
| Bride classifier tuning | Bride-specific COMPLEX/SIMPLE examples. Separate brideClassifier.js. | After 4 weeks of real founding-cohort bride data |
| Lead → client promotion disambiguation | Conversational disambiguation for phone-only ambiguous cases | When clients table grows |
| Two-sided vendor funnel (targeted) | Relay infrastructure for bride-initiated outreach to external vendors. Premium-signal-gated invitations only — gated on bride budget + saved-vendor category mix. No mass nudging. Net-a-Porter brand discipline: scarcity is the product. Design pending real bride data post-launch. | After 1.0.0 + post-launch cohort data |
| Twilio status callback race condition | Pre-existing since Session 5.5. Low impact. | When it causes a real user complaint |
| Anthropic credit-low warning | Agent fails silently if credits run out | Before scaling to 100+ users |
| Railway region move | EU West → Mumbai | Must happen at Phase 3 start before Discover traffic |
| Founding cohort pricing model | Free forever vs free for X months | Founder decision — when Razorpay integration is planned |
| Paid tier definition for Surprise Me | What triggers Sonnet routing? | Founder decision — when monetisation begins |
| Instagram App Review entity | Personal or business entity for Meta submission | Decide before Instagram DM integration begins |
