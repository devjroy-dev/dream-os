# dream-os — Master Handover (The Bridge Document)
**Written:** 2026-05-18 (P1-5 session)
**Session:** P1-5 complete. Phase 1 closed.
**Version:** 0.10.0-alpha
**HEAD:** 3b696dd
**Supabase:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Repo:** https://github.com/devjroy-dev/dream-os

This is the single active handover. Read it first. Then read ROADMAP_FINAL.md and SCHEMA.md.

---

## The problem that started everything

dream-os is a WhatsApp-first platform. One shared number (+91 7982159047) serves all vendors.
When a bride taps a vendor's wa.me link and messages them, the system creates a conversation thread
keyed by her phone number — a `couple_thread` with `counterparty_phone = +91XXXXXXXXXX`.

This works fine when a bride talks to one vendor. It breaks architecturally when she talks to two.

When bride Priya messages Vendor A (photographer) and Vendor B (MUA) both on the same +91 number,
the system sees two separate `couple_thread` conversations, both with `counterparty_phone = Priya's number`.
There is no row in the database that says "these two threads are the same human." Priya has no
persistent identity. She is just a phone number on two unconnected threads.

This created 17 documented disambiguation edge cases by Session 8.5:
- Sticky routing (30-minute window to remember which vendor she was last talking to)
- Levenshtein fuzzy match on TDW codes ("Did you mean TDW-SWATI978?")
- Per-message routing re-evaluation
- Returning-bride detection per-vendor via lead-exists check
- Vendor notification forwarding
- Multi-step Haiku disambiguation ("Which vendor are you trying to reach?")

Every single one of these was a workaround. Not a fix. A band-aid over the absence of
a `couples` row with a permanent `couple_id` tying her threads together.

The architectural ceiling was clear: continuing to build vendor features on top of ambiguous
bride identity meant every new feature had to re-handle the ambiguity. The edge case inventory
would grow, not shrink. And Discover — the marketplace — could never be built on a stateless bride.
A marketplace requires persistent identity on both sides.

The structurally correct move: pause vendor development, build bride identity as a first-class
concept, give every bride a permanent `couple_id`, and let the vendor side benefit from that
stability afterward. That is why the B-sessions exist.

---

## Vendor session history (Sessions 1 through 8.5a)

See previous HANDOVER_FINAL.md (commit 872d18d) for full vendor session history.
Sessions 1–8.5a are captured there. Not repeated here to keep this document focused
on current state.

---

## Bride session history (B1 through B3)

See previous HANDOVER_FINAL.md (commit 872d18d) for full bride session history.
B1–B3 are captured there.

---

## Replanning session — 2026-05-17

See previous HANDOVER_FINAL.md (commit 872d18d) for the 11 strategic decisions locked
at replanning. Not repeated here.

---

## Phase 1 sessions (complete)

**P1-1 — Migration 0023 + Circle fixes ✅ DONE**
Migration 0023 applied. M2, M5, I4 shipped. Circle invite phone-tested on two phones.

**P1-2 — Receipt classifier + Surprise Me ✅ CODE DONE, partial phone test**
Receipt classifier, list_receipts, image playback phone-tested ✅
Surprise Me built. Pending full phone test (Google billing block).

**P1-3 — factual_search + Morning nudge ✅ CODE DONE, pending verification**
factual_search tool built. Pending full phone test (Google billing block).
Morning nudge cron built. Pending first fire.
Twilio templates deferred — submit at start of next available session.

**P1-4 — coupleIdentity.js + disambiguation fix ✅ DONE (commit a98d6b0)**
Wrote src/lib/coupleIdentity.js: ensureCoupleRow(supabase, phone, name) +
captureField(supabase, couple_id, field, value). Wired into src/index.js at
single call site (line 181, top of if (!vendor) block — covers Steps A, A.5,
B, B.5, C). captureField called from inside capture_couple_lead handler in
engine.js — mirrors wedding_date, wedding_city, budget_total into couples.
Silent onboarding nudge block added then REMOVED in hotfix (commit 95fb303).
XOR preserved — no couple_id stamped on couple_thread conversations rows.

**P1-4 hotfix — restore couple-agent onboarding tone ✅ DONE (commit 95fb303)**
isReturningBride fix: `const isReturningBride = !!existingLeadForCouple?.name;`
Skeleton lead with name=null no longer flips returning. Full PA onboarding
tone restored for fresh-phone brides.

**P1-5 — Bug cleanup + Phase 1 close ✅ DONE (2026-05-18)**

Five fixes shipped across four commits:

- **07f8ce9** — Bug #1 + Bug #3
  - Bug #1: capture_couple_lead guard in engine.js:344.
    `if (isReturningBride && existingLeadForCouple?.id) continue` — no-op for
    returning brides. Prevents re-fire on subsequent messages.
  - Bug #3: counterparty_user_id: user.id added to Step A (~line 261) and
    Step B (~line 429) conversations.insert in src/index.js. Cascade deletes
    now fire correctly.

- **07bbdfa** — Bug #2: Circle summary delivery
  Root cause: fake-assistant injection ignored by Haiku on short messages
  (Hypothesis A confirmed — 582 tokens in, 13 out, generic reply with no
  mention of Meha). Fix: summary sent as separate WhatsApp message from
  brideIndex.js BEFORE the agent reply. brideEngine.js returns circleSummary
  field; brideIndex.js sends it via sendWhatsApp then continues to agent reply.
  Two bubbles confirmed on Swati's phone (+919888294440) ✅

- **b480b23** — Bug #4: Bare handle global fuzzy-match
  Inserted before sticky block in src/index.js. If message looks like a handle
  (3-12 chars alphanumeric, single word, no TDW- prefix) and matches exactly
  one vendor handle globally within Levenshtein distance 2 → "Did you mean
  TDW-XXX?" 0 or 2+ matches → fall through to sticky as before.

- **58df6fb** — TDW 'hi' fix
  When routing path is TDW-code, inboundMessage passed to runCoupleAgenticTurn
  is now 'hi' instead of body. Prevents agent receiving "TDW-DEV550" as a
  conversation opener and producing confused replies. Phone-tested: returning
  bride gets "Hi there! What's on your mind?" ✅

Additional verifications this session:
- Same-bride-two-vendors: Malaysian test bride (+60122687535) messaged DEV550
  and TEST999 (synthetic vendor 8d725050 created via SQL). Supabase query
  confirmed one couples row (285ccb5a). ✅
- No regression on P1-4 capabilities confirmed via Railway logs.

---

## Current state — vendor WhatsApp (src/index.js) at 0.10.0-alpha (HEAD: 3b696dd)

**Working:**
- Full onboarding (name, category, city, rate). 16 categories. Smart detection.
- TDW handle auto-assigned (FIRSTNAMEPHONE3). Unique. Updateable via tool.
- Three-mode couple routing. TDW code always wins over thread history.
- Fuzzy TDW match (Levenshtein ≤2).
- Sticky disambiguation: 30-min window. Extends on every message. Natural
  language vendor name works in disambiguation reply ("Dev" → routes to Dev).
- Returning-bride detection: per-vendor. Requires name on lead — skeleton
  leads with name=null do not flip isReturningBride. ✅
- capture_couple_lead: no-op for returning brides (guard at engine.js:344). ✅
- Bare handle global fuzzy-match before sticky claims message. ✅
- TDW code replaced with 'hi' as inbound to couple agent. ✅
- counterparty_user_id populated on Step A and Step B couple_thread inserts. ✅
- Couple-facing agent: Haiku + Sonnet routing active. ✅
- coupleIdentity.js: ensureCoupleRow + captureField. Silent, idempotent. ✅
- All tools working: note_to_self, create_lead, list_leads, update_lead_state,
  respond_to_vendor, create_event, list_events, update_event_state,
  update_routing_handle, get_my_tdw_link, create_invoice, list_invoices,
  record_payment (interim message + correct filename), log_expense,
  update_invoice_prefix, add_client (no UUID), list_clients (count suffix)
- Morning briefing: 8am IST. Overdue alerts.
- Smart model routing: Haiku/Sonnet. Both agents.
- Prompt caching: 91% reduction. Active.
- Admin: vendor list, invite, vendor detail, leads, clients, money, messages.
- Admin delete: password confirmation required. ✅

**Phone-tested (P1-4 + P1-5, 2026-05-17/18):**
- TDW first contact from Malaysian number +60122687535 → full PA greeting ✅
- Onboarding: occasion → date/city → budget → name → capture_couple_lead → close ✅
- Lead row: name="Testing best session", date=2026-10-13, city=Delhi, Rs 10L ✅
- couples row created silently via ensureCoupleRow ✅
- captureField mirrors wedding_date, wedding_city, budget_total ✅
- Returning bride guard: no re-fire of capture_couple_lead after lead captured ✅
- Bare handle "Swati978" → global fuzzy-match fires before sticky ✅
- TDW-DEV550 while sticky on TEST999 → agent gets 'hi', replies naturally ✅
- Same bride two vendors: one couples row confirmed ✅

**Pending (post-Phase 1):**
- Twilio template dream_os_morning_briefing: NEVER SUBMITTED for +917982159047.
  ⚠️ MUST SUBMIT at start of next available session. Approval 1-7 days.
  Blocks morning briefing for vendors inactive >24h.
- Twilio template dream_wedding_morning_nudge: NEVER SUBMITTED for +14787788550.
  ⚠️ Same — submit together with dream_os_morning_briefing.

**Known pre-existing gaps (low priority, not blocking):**
- Twilio status callback race condition (pre-existing since Session 5.5)
- No Anthropic credit-low warning
- Classifier context gap: prior Sonnet turn outside 2-turn history may route to Haiku
- Railway running in EU West, Supabase in Mumbai (fix at Phase 3)
- update_lead_state requires UUID (name-based deferred post-launch)
- Natural language vendor switch ("talk to Dev") not supported mid-sticky —
  bride must use TDW code or wait for sticky to expire (30 min)

---

## Current state — bride WhatsApp (src/brideIndex.js) at 0.10.0-alpha (HEAD: 3b696dd)

**Working:**
- Phone-gated onboarding. BFF voice. IST date aware.
- Muse: image + link saves. Google Vision tagging. Cloudinary mirror.
- Image classifier: Vision routes to receipt or Muse. Phone-tested ✅
- Receipt list + image playback. Phone-tested ✅
- Circle: 3-member cap, CIRCLE-XXXXXX tokens (7-day expiry from migration 0023).
- Circle daily image cap: 5/day ✅ Circle daily text cap: 5/day ✅
- Circle session summary: FIXED (P1-5, commit 07bbdfa). Summary delivered as
  separate WhatsApp message before agent reply. Two bubbles confirmed ✅
- Planner: events as universal calendar entry.
- Bookings: commitment tracking. record_payment() SQL function.
- Receipts: vault-only. "Got it, filed away."
- Surprise Me: built. Trigger: "surprise me". ⚠️ PENDING PHONE TEST —
  Google billing verification pending. Graceful fallback active.
- factual_search tool: built. ⚠️ PENDING PHONE TEST — same Google billing
  block. Graceful fallback active.
- Morning nudge cron: built. src/brideCron.js + src/agent/brideNudge.js.
  ⚠️ PENDING — first fire verification. Cron registered in Railway logs.
- Smart model routing: Haiku/Sonnet active ✅
- Prompt caching: active.

**Pending (post-Phase 1):**
- Surprise Me + factual_search: blocked on Google billing verification.
  Retest once cleared.
- Morning nudge first fire: verify in Railway logs at 8am IST.
- Twilio template dream_wedding_morning_nudge: NEVER SUBMITTED. Submit
  together with dream_os_morning_briefing at start of next session. ⚠️

---

## PWA planning session (Session PWA-0) — next session

Before any Phase 2 code is written, a dedicated planning session must be held.
No code until this session is complete.

Agenda:
1. Frontend framework choice (React + Vite? Next.js? Keep it simple.)
2. Auth flow detail: OTP delivery format, PIN length (4 or 6 digits), session expiry
3. Circle member scoped access: exactly which tabs/data they see vs bride
4. Tab structure final confirmation for both PWAs
5. Monorepo folder structure: src/vendorPwa/ and src/bridePwa/ or separate?
6. Railway service setup for two new services
7. Design system: Tailwind? Component library? Brand tokens for each product.
8. thedreamai.in and thedreamwedding.in domain setup and DNS
9. API endpoint structure for /chat/bride and /chat/vendor
10. Streaming implementation plan (server-sent events or websockets)

Only after all 10 agenda items are decided does Phase 2 code begin.

---

## Migration sequence (current)

| # | File | Status | What it added |
|---|---|---|---|
| 0001 | initial_schema.sql | ✅ Applied | users, vendors, couples, conversations, messages |
| 0002 | agent_substrate.sql | ✅ Applied | vendor_state, notes, pending_actions |
| 0003 | vendor_onboarding.sql | ✅ Applied | vendors.onboarding_state, invite_vendor() |
| 0004 | leads.sql | ✅ Applied | leads table |
| 0005 | tdw_handles.sql | ✅ Applied | vendors.routing_handle, instagram_handle, users.email |
| 0006 | travel_preference.sql | ✅ Applied | vendors.open_to_travel, vendors.travel_notes |
| 0007 | events_and_briefing.sql | ✅ Applied | events table, delivery_status, briefing_enabled |
| 0008 | invoices.sql | ✅ Applied | invoices table, invoice_prefix, invoice_counter |
| 0009 | message_cost_tracking.sql | ✅ Applied | messages cost columns, vendors.style_notes |
| 0010 | expenses.sql | ✅ Applied | expenses table |
| 0011 | clients.sql | ✅ Applied | clients table, leads.client_id, invoices.client_id |
| 0012 | routing_disambiguation.sql | ✅ Applied | users.pending_routing_context |
| 0013 | couples_onboarding.sql | ✅ Applied | couples.onboarding_state, couple_state, XOR |
| 0014 | conversations_xor.sql | ✅ Applied | conversations.couple_id, XOR constraint |
| 0015 | pronouns_and_dedup.sql | ✅ Applied | users.pronouns, couples.user_id UNIQUE |
| 0016 | muse_and_circle.sql | ✅ Applied | muse_saves, circle_members, circle_activity |
| 0017 | circle_sessions.sql | ✅ Applied | circle_sessions table |
| 0018 | fix_muse_saves_fk.sql | ✅ Applied | muse_saves FK ON DELETE CASCADE |
| 0019 | bride_planner.sql | ✅ Applied | couple_tasks, couple_bookings, couple_receipts, record_payment() |
| 0020 | drop_task_priority.sql | ✅ Applied | Drops priority from couple_tasks |
| 0021 | couple_receipts_label.sql | ✅ Applied | couple_receipts.label column |
| 0022 | task_event_merge.sql | ✅ Applied | Tasks → events migration. couple_tasks retired. |
| 0023 | circle_cleanup.sql | ✅ Applied 2026-05-17 | expires_at on circle_members, summary_message_id FK, unique partial index (M2), structured exceptions |
| 0024a | vendor_profile.sql | ⏳ Phase 2 | aesthetic_tags, rate_min/max, vendor_portfolio table |
| 0024b | discover.sql | ⏳ Phase 3 | couple_vendor_connections, discover_readiness, discover_eligible |

---

## Test credentials

| Item | Value |
|---|---|
| Vendor WhatsApp | +917982159047 |
| Bride WhatsApp | +14787788550 |
| Test vendor phone (Dev) | +918757788550 |
| Test vendor UUID | 2eb5d3fb-31eb-4b26-859a-cf10ae477d53 |
| Test vendor routing_handle | DEV550 |
| Test bride phone (Swati) | +919888294440 |
| Test bride couple_id | 7abccc1b-0698-43ba-9709-c6a1e52af789 |
| Test bride phone (Meha) | +919625759924 |
| Test synthetic vendor (P1-5 test only) | TEST999, UUID 8d725050-b7c2-48da-9e3a-641b1145ac96, phone +919999999999 |
| Malaysian test bride | +60122687535, couple_id 285ccb5a-01f0-4873-829c-aac66377c890 |
| Supabase | nvzkbagqxbysoeszxent (Mumbai, ap-south-1) |
| Railway vendor | https://dream-os-production.up.railway.app |
| Railway bride | https://dream-wedding-production-6cef.up.railway.app |
| Admin | https://dream-os-production.up.railway.app/admin |
| Google Cloud | dream-os (gen-lang-client-0017514064) dev@thedreamwedding.in |
| Cloudinary | dccso5ljv |
| Anthropic workspace | dream-os |

---

## Railway env vars

| Var | Value |
|---|---|
| TWILIO_WHATSAPP_NUMBER | whatsapp:+917982159047 |
| TDW_WA_NUMBER | 917982159047 |
| BRIDE_WA_NUMBER | 14787788550 |
| ANTHROPIC_API_KEY | (in Railway) — workspace: dream-os |
| GOOGLE_API_KEY | (in Railway) — Google AI Studio, dev@thedreamwedding.in |
| ADMIN_PASSWORD | (in Railway) |
| SUPABASE_URL | (in Railway) |
| SUPABASE_SERVICE_ROLE_KEY | (in Railway) |

---

## Document discipline

Active documents (updated every session):
- HANDOVER_FINAL.md — this document. Single active handover. Fully rewritten each session.
- ROADMAP_FINAL.md — single active roadmap.
- SCHEMA.md — unified schema reference. Updated with every migration.

Frozen documents (historical record, do not update):
- HANDOVER.md — frozen at vendor 8.5a
- HANDOVER_BRIDE.md — frozen at bride B3
- ROADMAP.md — frozen at vendor 8.5a
- ROADMAP_BRIDE.md — frozen at bride B3
- B1_SPEC.md — historical spec

Session not complete until HANDOVER_FINAL.md, ROADMAP_FINAL.md, and SCHEMA.md
are committed and pushed. No exceptions.
