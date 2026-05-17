# dream-os — Master Roadmap
**Written:** 2026-05-17
**Replanning session:** Strategy and architecture only. No code.
**Supersedes:** ROADMAP.md (vendor, frozen at 8.5a) + ROADMAP_BRIDE.md (bride, frozen at B3)
**Current version:** 0.9.0-alpha
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
| Two-sided vendor funnel | Bride adds external vendor phone → Twilio template sent → relay back → vendor gets nudge. Architecture TBD. New conversation kind needed: vendor_relay. Twilio template approval needed. |

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

### Phase 1 — migration summary
| Migration | Session | What it adds |
|---|---|---|
| 0023_circle_cleanup.sql | P1-1 | expires_at on circle_members, summary_message_id FK, circle_sessions unique partial index |

### Phase 1 — done criteria
- [ ] All CC fixes applied and verified
- [ ] Migration 0023 applied
- [ ] Circle invite works end-to-end on a real phone
- [ ] Receipt classifier verified on a real receipt photo
- [ ] Surprise Me returns results for a bride with 3+ Muse saves
- [ ] factual_search returns Gemini-grounded results for a market question
- [ ] Morning nudge fires correctly for a test bride at 8am IST
- [ ] Vendor morning briefing template submitted to Twilio
- [ ] coupleIdentity.js exists and is called from src/index.js at all three step entry points
- [ ] Same bride messaging two vendors → single couples row confirmed via Supabase
- [ ] Silent onboarding nudge fires after 3+ exchanges, never twice
- [ ] Sonnet routing active on both vendor couple-agent and bride agent
- [ ] Version bumped to 0.10.0-alpha, docs updated, committed and pushed

---

## Phase 2 — PWA Shells (target: v0.11.0-alpha)

**Goal:** Both products are visible. The engine is under the bonnet. Trust is established.
Founding cohort vendors and brides open the PWA and see everything their AI assistant
has remembered for them. Profile completion populates Discover data passively.

### Why PWA shells are here and not at the end

The PWA is a trust mechanism, not a polish exercise. Without it, users operate on faith —
they text a WhatsApp number and trust something is being stored somewhere. The PWA makes
the invisible visible. A bride who sees her Muse board laid out beautifully believes the
product. A vendor who sees his leads pipeline and reads the AI's replies to brides in his
voice believes the product. This is the engine under the bonnet. It belongs before Discover,
not after.

Additionally: the vendor profile completion section of the vendor PWA is the data collection
surface for Discover. By the time Discover is ready to launch, every vendor's portfolio images,
aesthetic tags, and rate range are already populated — filled in by vendors themselves, not
chased by Swati. Discover launches with real data on day one.

### Bride PWA — thedreamwedding.in

New Railway service: thedreamwedding.in (or subdomain of existing dream-wedding service).
Entry point: src/bridePwa/ (new folder).
Auth: session-based. Phone number → users.id → couples.id. No password. Link-based access
or WhatsApp OTP pattern. TBD at build time.

**Five tabs:**

i) Muse
- Image grid of all muse_saves for this couple, newest first
- Each save shows image, aesthetic_tags, saved_by_role (bride / circle_member), save_number
- Tappable — opens full image with caption and tags
- No write paths in Phase 2. Read-only.

ii) Surprise Me
- Reuses Surprise Me output from WhatsApp surface
- Same Gemini-powered internet results, rendered as a browsable visual grid
- "Refresh" button triggers new /surprise call and re-renders
- Phase 3: vendor results appear here alongside internet results

iii) Circle Activity
- Timeline of circle member activity: who joined, what they saved, what they reacted to
- Session summaries displayed as cards (what Mom saved, what she hearted, her comment)
- No write paths. Read-only view of circle_activity and circle_sessions tables.

iv) Tasks / Calendar / Utility
- Calendar view of all events (couple_id scoped) — proper month/week calendar, not a list
- Bookings panel: vendor name, category, amount_total, amount_paid, balance, balance_due_date
- Dues view: what's coming up within 30 days, sorted by date
- Receipts: image thumbnails of all couple_receipts. Tappable to full image.
- No write paths. Read-only.

v) DreamAi Chat
- Full chat interface connected to bride agent via POST /chat/bride endpoint
- Same agentic loop as WhatsApp — same tools, same system prompt, same model routing
- No Twilio involved. Zero per-message Twilio cost for PWA chat turns.
- Streaming responses (Anthropic streaming API). Feels instant, not frozen.
- channel = 'web' on messages rows. Cost tracked identically to WhatsApp turns.
- Auth: session token maps to couple_id. Agent receives couple_id, not phone.

### Vendor PWA — thedreamai.in

New Railway service: thedreamai.in.
Entry point: src/vendorPwa/ (new folder).
Auth: same pattern as bride PWA. Phone → users.id → vendors.id.

**Five tabs:**

i) Calendar
- Month/week calendar view of all events (vendor_id scoped)
- Shoots, calls, meetings, recces, fittings, trials, ceremonies displayed with colour coding by kind
- Upcoming events highlighted. Past events dimmed.
- No write paths. Read-only.

ii) Utility / Tools
- Leads pipeline: cards with state (new/contacted/quoted/booked/lost), name, phone, wedding date, budget
- Clients: list with name, phone, source, referrer
- Invoices: list with state, amount, client, due date
- Expenses: list with category, amount, date
- No write paths. Read-only.

iii) Profile Completion
- This is the Discover data collection surface. Write-enabled.
- Portfolio images: upload 5-10 images. Stored in Supabase `portfolios` bucket (public).
  Cloudinary mirror for CDN delivery. Populates vendor_portfolio table (new — migration 0024a).
- Aesthetic style: vendor picks tags from the locked 12-value taxonomy
  (moody, editorial, pastel, OTT, minimal, candid, grand, rustic, modern).
  Populates vendors.aesthetic_tags (new column — migration 0024a).
  Swati can override via admin.
- Rate range: vendors.rate_min / vendors.rate_max (new columns — migration 0024a).
  Editable here. Swati can override via admin.
- City: pre-filled from onboarding. Editable.
- Category: pre-filled from onboarding. Display only (not editable — category changes require Swati).
- Profile completeness indicator: "Your profile is X% complete." Nudges without being aggressive.
  100% = portfolio images uploaded + aesthetic tags selected + rate range set.

iv) Threads (summary of WA chats)
- List of all couple_thread conversations for this vendor
- Each thread shows: bride name (via counterparty_user_id → users.name, populated once
  coupleIdentity.js exists), last_message_at, conversation state, unread indicator
- Tap into thread → full message timeline: what the bride said, what dream-os PA replied in
  vendor's voice. This is the most powerful trust surface in the vendor PWA.
- No write paths. Read-only.
- Note: bride names appear correctly only after Phase 1 coupleIdentity.js ships. Until then,
  threads show counterparty_phone. Phase 1 must ship before Phase 2 for this to be meaningful.

v) DreamAi
- Full chat interface connected to vendor agent via POST /chat/vendor endpoint
- Same agentic loop as WhatsApp — same tools, same system prompt, same model routing
- No Twilio involved. Zero per-message Twilio cost for PWA chat turns.
- Streaming responses.
- channel = 'web' on messages rows.

### Shared PWA infrastructure

Both PWAs share these build requirements:

**New API endpoints (src/index.js and src/brideIndex.js or new files):**
- POST /chat/bride — accepts { couple_id, message, conversation_id }. Calls brideEngine.
  Returns { reply }. Streams if streaming=true in request.
- POST /chat/vendor — accepts { vendor_id, message, conversation_id }. Calls engine.
  Returns { reply }. Streams if streaming=true in request.

**Auth / session mapping — LOCKED:**
- First login: phone number entry → OTP sent via WhatsApp (vendor gets OTP on +917982159047,
  bride gets OTP on +14787788550) → OTP verified → PIN setup (4 or 6 digits, decided at PWA-0)
- Subsequent logins: phone number entry → PIN → session created
- Applies to: vendors (thedreamai.in), brides (thedreamwedding.in), circle members (thedreamwedding.in)
- Circle members: phone already captured in circle_members.invitee_phone at token claim.
  First PWA login: phone → OTP → PIN → session maps to circle_members row → couple_id scoped.
  Circle member sees: Muse + Circle Activity ONLY. Not bookings, receipts, or calendar.
  Permission boundary enforced at API layer, not just UI.
- OTP delivery via WhatsApp is intentional: same channel users already trust. No SMS cost.
  No email dependency. Fits the WhatsApp-first architecture.

**PWA planning session (Session PWA-0) — REQUIRED before any Phase 2 code:**
A dedicated planning session must be held before any Phase 2 code is written.
Agenda:
1. Frontend framework choice (React + Vite? Next.js?)
2. Auth flow detail: OTP format, PIN length (4 or 6 digits), session expiry duration
3. Circle member scoped access: exactly which tabs and data they see
4. Tab structure final confirmation for both PWAs
5. Monorepo folder structure: src/vendorPwa/ and src/bridePwa/
6. Railway service setup for two new services
7. Design system: Tailwind? Component library? Brand tokens per product.
8. thedreamai.in and thedreamwedding.in domain setup and DNS
9. API endpoint structure for /chat/bride and /chat/vendor
10. Streaming: server-sent events or websockets
No code begins until all 10 items are decided and documented.

**Monorepo folder structure (Phase 2 addition):**
```
src/
  index.js              (vendor WhatsApp — existing)
  brideIndex.js         (bride WhatsApp — existing)
  agent/                (existing)
  lib/                  (existing)
  vendorPwa/            (new — vendor dashboard frontend)
  bridePwa/             (new — bride planner + Discover frontend)
```

### Phase 2 — migrations

Migration 0024a (new — split from original 0024_vendor_connections.sql):
- vendors.aesthetic_tags jsonb (Swati-managed + vendor self-selection in profile completion)
- vendors.rate_min integer (nullable, in Rs)
- vendors.rate_max integer (nullable, in Rs)
- vendor_portfolio table: id uuid PK, vendor_id FK vendors(id) ON DELETE CASCADE,
  image_url text NOT NULL, display_order integer default 0, created_at timestamptz auto.
  Index on vendor_id.
- Supabase storage bucket: portfolios (public, no size limit specified — set 10MB per image)

Note: couple_vendor_connections and discover_readiness tables are Phase 3, not Phase 2.
They were originally bundled in 0024_vendor_connections.sql. That migration is split:
- 0024a = Phase 2 (aesthetic_tags, rate_min/max, vendor_portfolio) — applies at Phase 2 start
- 0024b = Phase 3 (couple_vendor_connections, discover_readiness) — applies at Phase 3 start

### Phase 2 — done criteria
- [ ] Migration 0024a applied
- [ ] Bride PWA live at thedreamwedding.in with all five tabs working
- [ ] Vendor PWA live at thedreamai.in with all five tabs working
- [ ] Vendor can upload portfolio images via profile completion tab
- [ ] Vendor can select aesthetic tags via profile completion tab
- [ ] Vendor can set rate range via profile completion tab
- [ ] Threads tab shows bride names (not just phone numbers) via coupleIdentity.js
- [ ] DreamAi chat tab works on both PWAs — full agentic loop via /chat endpoint
- [ ] Streaming responses working in both chat tabs
- [ ] Auth / session mapping working — user can log in via WhatsApp OTP or magic link
- [ ] POST /chat/bride and POST /chat/vendor endpoints live
- [ ] channel = 'web' on messages rows for PWA chat turns
- [ ] Version bumped to 0.11.0-alpha, docs updated, committed and pushed

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
| 0023 | circle_cleanup.sql | P1-1 | ⏳ Pending | expires_at on circle_members, summary_message_id FK, circle_sessions unique partial index |
| 0024a | vendor_profile.sql | P2 | ⏳ Pending | vendors.aesthetic_tags, vendors.rate_min/max, vendor_portfolio table, portfolios bucket |
| 0024b | discover.sql | P3 | ⏳ Pending | couple_vendor_connections, discover_readiness, vendors.discover_eligible |

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
2. **HANDOVER.md** — single active handover. Fully rewritten at end of every session. Covers both products.
3. **SCHEMA.md** — fully rewritten at end of every session. Unified. Covers both products.
4. **ROADMAP.md** — frozen at vendor 8.5a. Historical record only. Do not update.
5. **ROADMAP_BRIDE.md** — frozen at B3. Historical record only. Do not update.
6. **HANDOVER_BRIDE.md** — frozen at B3. Historical record only. Do not update.
7. **UNIT_ECONOMICS.md** — Dev's reference only. No session amends it.
8. **B1_SPEC.md** — historical record. Do not update.

Session not complete until ROADMAP_FINAL.md, HANDOVER.md, and SCHEMA.md are committed and pushed.

---

## Post-launch backlog (no sequence dependency, build when relevant)

| Item | Description | Trigger |
|---|---|---|
| Admin bulk CSV invite | Upload CSV of phone + name, system invites in bulk | When Swati onboards >10 vendors at once |
| Admin vendor list search + filter | Search by name, filter by status | When vendor list exceeds 20 |
| Admin manual onboarding_state override | Push a stuck vendor past an onboarding step | When a vendor gets stuck in production |
| Admin lead name-based state updates | update_lead_state by name, not UUID | When vendors start complaining about UUID requirement |
| Google Calendar OAuth sync | Two-way vendor calendar sync | When vendors request it |
| Event conflict detection | Prompt vendor when new event clashes | Threshold TBD — founder decision required first |
| Tool-call shortcut guardrail | Prevent agent skipping confirmation steps | Verb list TBD — founder decision required first |
| Instagram DM integration | Vendor connects IG Business. DMs auto-route to WhatsApp thread. Meta App Review 2-4 weeks. | When vendor Instagram outreach becomes a priority |
| Bride classifier tuning | Bride-specific COMPLEX/SIMPLE examples. Separate brideClassifier.js. | After 4 weeks of real founding-cohort bride data |
| Lead → client promotion disambiguation | Conversational disambiguation for phone-only ambiguous cases | When clients table grows |
| Two-sided vendor funnel | Bride adds external vendor phone → Twilio template → relay → vendor nudge. Architecture TBD. | When external vendor acquisition becomes a priority |
| Twilio status callback race condition | Pre-existing since Session 5.5. Low impact. | When it causes a real user complaint |
| Anthropic credit-low warning | Agent fails silently if credits run out | Before scaling to 100+ users |
| Railway region move | EU West → Mumbai | Must happen at Phase 3 start before Discover traffic |
| Founding cohort pricing model | Free forever vs free for X months | Founder decision — when Razorpay integration is planned |
| Paid tier definition for Surprise Me | What triggers Sonnet routing? | Founder decision — when monetisation begins |
| Instagram App Review entity | Personal or business entity for Meta submission | Decide before Instagram DM integration begins |
