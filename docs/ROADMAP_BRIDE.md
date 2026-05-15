# dream-os — Bride & Couple Roadmap
**Created:** 2026-05-15
**Current session:** Pre-B1 (not yet started)
**Status:** Architecture locked. Build starts at B1.

---

## Vision

thedreamwedding.in is where brides live.

WhatsApp-first wedding planner for the bride. She texts a number. An AI agent remembers everything, captures her taste, builds her plan, connects her to the right vendors, and manages the most important day of her life.

The +14787788550 number (The Dream Wedding, Meta-verified) is her number. NRI brides trust it. International format signals premium.

Vendors don't live here. They appear here — curated, styled, earned. The bride is always protected. The vendor earns access through quality of work. Dev and Swati decide who features on Discover.

thedreamwedding.in (bride) and thedreamai.in (vendor) meet at Discover. That is the crossroads. Everything else is separate.

---

## Document discipline (mandatory, mirrors vendor side)

These rules are non-negotiable. Every B-session follows them without exception.

1. Four documents updated at end of every session, before closing:
   - HANDOVER.md — fully rewritten. Current state only, not history.
   - SCHEMA.md — fully rewritten. Exact current DB state.
   - ROADMAP.md — updated. Mark done, add new, update open questions.
   - ROADMAP_BRIDE.md — updated. Mark done, add new, update open questions.
   Session not complete until all four are committed and pushed.

2. Every schema change goes through a numbered migration file in db/migrations/. Bride migrations continue the vendor sequence. 0013 is the first bride migration. No separate numbering. One migration history.

3. HANDOVER_BRIDE.md is written at the end of every B-session in the same format as HANDOVER.md. It is the first thing read at the start of the next B-session.

4. Every B-session starts by cloning the repo fresh and reading:
   cat docs/HANDOVER.md
   cat docs/HANDOVER_BRIDE.md
   cat docs/SCHEMA.md
   cat docs/ROADMAP_BRIDE.md
   Then wait for founder confirmation before touching any code.

5. One thing at a time. Build one thing, test it, then move to the next. Never batch multiple changes into a single script.

6. No unsolicited changes. Never change anything not explicitly asked for.

7. Claude Code for targeted file edits. This chat for strategy, architecture, and documents.

8. After every commit, reclone the repo fresh before reading or editing any files.

---

## Architecture principles (non-negotiable)

1. WhatsApp-first. Every feature accessible via WhatsApp. PWA is the view layer, not the primary interface.

2. Same repo, separate entry point. src/brideIndex.js is the bride server. src/index.js is the vendor server. Both in devjroy-dev/dream-os. Two Railway services from one repo.

3. Same Supabase project. nvzkbagqxbysoeszxent (Mumbai, ap-south-1). One DB, one migration history, two product surfaces.

4. Same migration discipline. Bride migrations continue vendor sequence from 0013.

5. Same agentic loop pattern. src/agent/brideEngine.js mirrors src/agent/engine.js. Same MAX_ITERATIONS, same tool architecture, same post-processing discipline.

6. Same model lock. claude-haiku-4-5-20251001 for routine. claude-sonnet-4-6 for judgment. Never change without founder approval.

7. Same cost tracking. Every agent turn logs model, input_tokens, output_tokens, cost_usd, cost_inr on the messages row.

8. Shared lib layer. src/lib/ (sendWhatsApp, supabase, models, clients) is shared. Never duplicated. Bride-specific code never goes in shared lib.

9. Phone format: always E.164. Always.

10. Currency: Rs. Never the rupee symbol.

11. Prompt caching from day one. Bride agent gets 91% input token reduction free. Not rebuilt — inherited from src/lib/models.js.

12. Smart model routing from day one. Haiku for routine, Sonnet for judgment. Not rebuilt — inherited.

---

## Infrastructure

| | Bride | Vendor |
|---|---|---|
| Railway service | dream-wedding (new, B1) | dream-os (existing) |
| Entry point | src/brideIndex.js | src/index.js |
| WhatsApp number | +14787788550 | +91XXXXXXXXX (when live) |
| Supabase | nvzkbagqxbysoeszxent | nvzkbagqxbysoeszxent |
| Frontend | thedreamwedding.in (Vercel) | thedreamai.in (Sessions 11-12) |
| PWA source | tdw-2/web/ (copied to web/ in repo) | n/a |
| Admin | thedreamwedding.in/admin (B1) | dream-os-production.up.railway.app/admin |
| Repo | devjroy-dev/dream-os | devjroy-dev/dream-os |

---

## WhatsApp number

+14787788550 — The Dream Wedding. Meta-verified. No restrictions. Permanent bride number.

This number served vendor flows during vendor Sessions 1-8.5. After Session 6.5 (+91 arrives for vendors), +14787788550 is freed and becomes the exclusive bride number. The brand name "The Dream Wedding" on this number is correct and permanent — it is the bride product brand.

Twilio webhook for this number routes to src/brideIndex.js (B1). Never to vendor routing logic again.

---

## Feature parity map

Every bride feature mirrors a vendor feature. We adapt, not reinvent. This keeps architecture consistent and reduces bugs.

| Bride feature | Vendor equivalent | Notes |
|---|---|---|
| Onboarding (name, partner, date, city, budget) | Onboarding (name, category, city, rate) | Same state-machine. couples.onboarding_state. |
| couple_self conversation thread | vendor_self conversation thread | Same conversations table. New kind value. |
| couple_state table | vendor_state table | Summary, vendor shortlist, taste notes. Same pattern. |
| note_to_self tool | note_to_self tool | Identical tool, shared from brideTools.js. |
| save_wedding_detail tool | Onboarding field updates | Bride version of updating profile fields mid-conversation. |
| Budget tracker | Expenses + invoices | Simpler. One couple_budget table. Log spend or photo a receipt. |
| Calendar / tasks / reminders | events table | Reuse events table scoped by couple_id instead of vendor_id. |
| shortlist_vendor tool | create_lead tool | Bride saves a vendor. Generates a lead on vendor side simultaneously. |
| list_my_vendors tool | list_leads tool | Bride sees her shortlisted vendors. |
| ask_vendor tool | respond_to_vendor tool | Bride routes a message to a specific vendor in her list. |
| Morning nudge | Morning briefing | Same cron pattern. Bride gets days-to-wedding + priority task at 8am IST. |
| Smart model routing | Session 8.1 | Inherited from day one. Not rebuilt. |
| Prompt caching | Session 8.2 | Inherited from day one. Not rebuilt. |
| Muse | Notes | Richer. Images, links, Pinterest URLs. Google Vision tags aesthetics. UNIQUE to bride. |
| Circle | — | No vendor equivalent. Co-planners with roles, activity, reactions. UNIQUE to bride. |
| Surprise Me | — | No vendor equivalent. AI reads Muse saves, matches vendors by aesthetic. UNIQUE to bride. |
| Discover | — | No vendor equivalent. Curated marketplace. Hosted at thedreamwedding.in. UNIQUE to bride. |

---

## The three unique bride surfaces

### Muse — mood board
Bride saves links, Pinterest pins, images. Google Vision reads aesthetics and extracts tags (moody, editorial, pastel, OTT, minimal, candid, grand...). Tags build her taste profile. Input via WhatsApp. View via thedreamwedding.in/couple/muse (PWA, shell already built in tdw-2).

Muse is not just a save feature. It is the raw material for Surprise Me and the intelligence layer that powers Discover matching.

Free tier: Google Vision reads images, Haiku composes tags.
Paid tier: Haiku + Sonnet for richer aesthetic interpretation.

### Circle — co-planners
Bride grants access to specific people. Roles: partner / family / inner_circle. They can like or add to her Muse board. Every Circle activity generates a WhatsApp update to the bride.

When native app arrives, WhatsApp pings become push notifications. No rebuild needed — just a flag change. Design for it from B2, do not build native now.

Reactions: heart, thumbs-up, star-struck, thinking. These are locked at four. Do not add more without founder approval.

### Surprise Me — AI taste matching
Reads bride's Muse saves (actual images via Google Vision, not just tags). Matches her aesthetic profile against Discover vendor portfolios. Returns 3-5 vendors whose work matches her taste.

Free tier: Haiku + Google Vision (lighter matching).
Paid tier: Haiku + Sonnet (sharper, more nuanced aesthetic reasoning).

This is the intelligence layer that closes the loop: her taste leads to matched vendors leads to curated leads for the right vendors. It is what makes Discover a marketplace and not a directory.

---

## Discover — where vendor and bride meet

Hosted at thedreamwedding.in/discover. Built in Session 9 (convergence).

Curation model: not every dream-os vendor appears on Discover. Dev and Swati decide who features. The gate is style, not just payment. Payment gets a vendor considered. Style gets them featured. This keeps Discover's quality high and gives the product editorial control. It is defensible — a vendor cannot buy their way onto Discover if the work is not there.

Two lead pipelines running in parallel:
- TDW wa.me pipeline: any vendor, any bride, organic. Lower intent, higher volume.
- Discover pipeline: curated vendors, bride with a taste profile, Surprise Me match. Higher intent because the bride is already showing what she wants.

The Discover pipeline carries couple_id + taste profile with every enquiry. Vendor notification includes context: "Priya (moody editorial, budget Rs 3L+) just enquired." That is a warm lead, not a cold one.

---

## Silent onboarding — brides arriving via TDW links

When a bride clicks a vendor's wa.me link and messages for the first time:

1. She is not intercepted with onboarding questions. She clicked because she wants to talk to a vendor. Let that happen first.
2. A shell couple row is created silently on first contact (phone → users row → couples row, onboarding_state = new).
3. Over subsequent messages, the agent collects her details naturally (name, partner, date, city, budget). Each detail captured → couple row updated.
4. Once onboarding_state = complete, she has a full couple_id.
5. A subtle nudge is sent once: "By the way, I also help brides plan their entire wedding — save this number." One time only. Never repeated.

This means a bride who arrives via a vendor TDW link and a bride who onboards directly through the planner end up in the same couples table with the same schema. Session 9 Discover works correctly for both.

---

## B-session plan

### B1 — Couple identity + WhatsApp onboarding
Goal: Bride gets a couple_id. Agent works. Webhook is live on bride number.

Migrations: 0013_couples_onboarding.sql
- couples.onboarding_state (new / asked_partner / asked_date / asked_city / asked_budget / complete)
- couples.whatsapp_linked boolean (true when onboarded via WhatsApp)
- couple_state table (couple_id PK, summary text, vendor_shortlist jsonb, taste_notes text, updated_at)

What ships:
- src/brideIndex.js — bride webhook server, Railway service "dream-wedding"
- src/agent/brideEngine.js — agentic loop, mirrors engine.js
- src/agent/brideSystemPrompt.js — bride-specific system prompt
- src/agent/brideTools.js — initial tools: note_to_self, save_wedding_detail, respond_to_bride
- src/agent/brideOnboarding.js — onboarding state machine
- Couple self conversation thread (conversations.kind = couple_self)
- Admin: basic couple list page at thedreamwedding.in/admin
- PWA: deploy tdw-2/web/ to Vercel at thedreamwedding.in. Switch API constant to dream-os Railway.

Onboarding flow (exact, locked):
- Greeting: "Hi [Name] — welcome to The Dream Wedding. I'm your planning assistant. When's the big day?"
- asked_partner: partner name
- asked_date: wedding date (approximate is fine, past date check same as vendor side)
- asked_city: wedding city
- asked_budget: "Roughly what's your budget? No pressure — even a ballpark helps me help you." (softest ask, last)
- Completion: "Perfect — you're all set. I'm here whenever you need me."
- Unknown numbers: "Hi! This number is for brides planning their wedding with The Dream Wedding. If a vendor sent you here, ask them for their TDW code."

Estimated time: 90 minutes

### B2 — Muse + Circle
Goal: Bride has a mood board. Her circle can contribute to it.

Migrations: 0014_muse_circle.sql
- muse_saves table: id, couple_id, source_type (image/link/vendor), source_url, image_url, aesthetic_tags jsonb, saved_by_user_id, created_at
- circle_members table: id, couple_id, invitee_phone, invitee_name, role (partner/family/inner_circle), invite_code, status (pending/active/removed), created_at
- circle_activity table: id, couple_id, actor_user_id, actor_name, activity_type (save/like/add), subject_id, subject_type, created_at

What ships:
- save_to_muse tool: bride sends image or link → agent saves to muse_saves → Google Vision reads aesthetics → tags stored
- list_muse tool: returns her recent saves
- invite_to_circle tool: bride names someone → invite code generated → link sent to them
- Circle activity: when circle member likes or adds → bride gets WhatsApp notification
- PWA: thedreamwedding.in/couple/muse and /couple/circle pages already built in tdw-2. Point at new endpoints.
- Muse PWA is the view layer. WhatsApp is the input layer.

Google Vision integration:
- Free tier: Google Vision API (same GOOGLE_API_KEY already in Railway)
- Returns labels → mapped to aesthetic taxonomy (moody/editorial/pastel/OTT/minimal/candid/grand/rustic/modern)
- Taxonomy locked in src/agent/brideAesthetics.js. Do not add categories without founder approval.

Estimated time: 90-120 minutes

### B3 — Full planner
Goal: Bride has budget, calendar, tasks, expenses. Complete planning substrate before vendor connections.

Migrations: 0015_bride_planner.sql
- couple_tasks table: id, couple_id, title, status (pending/done), priority (high/medium/low), due_date, event_name, notes, created_at
- couple_expenses table: id, couple_id, amount, category, vendor_name, description, expense_date, receipt_url, created_at
- couple_budget table: id (PK = couple_id), total_budget, committed, paid, updated_at

Note: events table already exists (vendor-side). Add couple_id column via migration. Same table, scoped by couple_id.

What ships:
- create_task tool, list_tasks tool, complete_task tool
- log_expense tool (text) + receipt OCR path (bride sends photo → Google Vision reads amount/vendor → confirm → log)
- set_budget tool, get_budget_summary tool
- add_event tool (reuses events table, couple_id scoped)
- list_events tool (couple scoped)
- Morning nudge: 8am IST cron, sends days-to-wedding + top priority task
- PWA: thedreamwedding.in/couple/today, /couple/plan pages already built in tdw-2. Point at new endpoints.

Receipt OCR flow:
- Bride sends photo → media guard detects image → instead of "I cannot process images" → route to OCR path
- Google Vision reads: amount, vendor name, date
- Agent: "Got it — Rs 45,000 to Priya Mehta Couture on 14 May. Log this expense?" → Yes/No
- Confirm → log_expense called → couple_expenses row created

Note: This is the one place where image handling is different from vendor side. Vendor side: "I'll be able to process images soon." Bride side (B3+): images routed to OCR. The media guard in brideIndex.js must handle this differently from src/index.js.

Estimated time: 2 sessions

### B4 — Vendor connections + Surprise Me + silent wa.me onboarding
Goal: Bride has all her vendors in one place. Surprise Me works. Silent onboarding is live.

Migrations: 0016_vendor_connections.sql
- couple_vendor_connections table: id, couple_id, vendor_id, state (shortlisted/enquired/booked/passed), source (muse/discover/whatsapp/manual), shortlisted_at, enquired_at, created_at
- vendors.aesthetic_tags jsonb (Swati-managed portfolio tags that Surprise Me matches against)

What ships:
- shortlist_vendor tool: bride saves a vendor → couple_vendor_connections row + lead row on vendor side
- list_my_vendors tool: all her vendor connections with state
- ask_vendor tool: bride routes a message to a specific vendor in her list (replaces need for TDW codes for returning brides)
- Surprise Me: reads muse_saves.aesthetic_tags, matches against vendors.aesthetic_tags → returns 3-5 vendors
  Free tier: Haiku + Google Vision
  Paid tier: Haiku + Sonnet
- Silent wa.me onboarding: couple_id shell created on first TDW contact, populated over conversation
- Nudge snippet: "By the way, I also help brides plan their entire wedding — save this number." One time, after first vendor interaction completes.
- PWA: thedreamwedding.in/couple/discover/hub already built. Wire to real vendor data.

At end of B4, the couples table note "essentially unused" is deleted from SCHEMA.md. It is now real.

Estimated time: 2 sessions

---

## Session 9 — Convergence (see ROADMAP.md)

B4 completion is the prerequisite for Session 9. At that point:
- Every bride has a couple_id
- Muse, Circle, planner, vendor connections all working
- Surprise Me matching live
- Silent onboarding live

Session 9 launches Discover at thedreamwedding.in/discover with real vendor data, real bride identity, and a connected lead pipeline. See ROADMAP.md for full Session 9 scope.

---

## Decisions locked

Product:
- thedreamwedding.in = brides and couples only. Permanent.
- Discover hosted at thedreamwedding.in. Vendors have no login here.
- +14787788550 = bride number. Permanent. NRI brides, English-first, premium positioning.
- Bride onboarding is silent and progressive. Never intercepted on first contact.
- Muse is the raw material for everything. Taste profile drives Surprise Me drives Discover matching.
- Circle makes Muse sticky. Four reactions locked (heart, thumbs-up, star-struck, thinking).
- Surprise Me tiers: free = Haiku + Google Vision, paid = Haiku + Sonnet.
- Discover curation: style gates, not just payment. Swati has editorial control.
- Two lead pipelines: TDW wa.me (organic, lower intent) + Discover (curated, higher intent).

Architecture:
- Same repo: devjroy-dev/dream-os. Separate Railway service dream-wedding.
- Bride entry point: src/brideIndex.js
- Same Supabase: nvzkbagqxbysoeszxent
- Bride migrations: continue vendor sequence from 0013
- Shared lib: src/lib/ (sendWhatsApp, supabase, models, clients). Never duplicated.
- PWA source: tdw-2/web/ copied to web/ in repo at B1. Not rebuilt — inherited.
- Media guard in brideIndex.js handles images differently: B3+ routes to OCR, not rejection.
- Aesthetic taxonomy: locked in src/agent/brideAesthetics.js at B2. No additions without founder approval.

Models:
- claude-haiku-4-5-20251001: routine agent turns. Never change without founder approval.
- claude-sonnet-4-6: judgment calls + paid-tier Surprise Me. Never change without founder approval.
- Google Vision: image aesthetics, receipt OCR. Same GOOGLE_API_KEY as vendor side.

Documents:
- HANDOVER_BRIDE.md: written at end of every B-session. First thing read at start of next B-session.
- SCHEMA.md: updated with every bride migration. Covers both vendor and bride tables.
- ROADMAP_BRIDE.md: this document. Updated every B-session.
- ROADMAP.md: vendor roadmap. Updated when vendor-side decisions change.
- All four committed and pushed before session closes.

---

## Open questions

1. Bride WhatsApp number availability: +14787788550 is currently serving vendor flows. B1 cannot start on this number until Session 6.5 (+91 arrival) frees it. Can B1 start on a temp number for development, switching to +14787788550 after 6.5? Founder to decide.
2. thedreamwedding.in domain: currently pointing where? Need DNS access confirmed before Vercel deploy at B1.
3. Existing tdw-2 bride data in nqcdfzbvlrcrjineoudp (old Supabase): migrate to nvzkbagqxbysoeszxent at Session 9, or earlier? Founder to decide.
4. user_id vs couple_id naming inconsistency in tdw-2 API: carry as-is through B-sessions, resolve at Session 9 consolidation. Do not fix mid-flight.
5. Paid tier definition: what triggers "paid" for Surprise Me Sonnet routing? Couple tier field? Explicit upgrade? Founder to decide before B4.
6. Receipt OCR confidence threshold: what confidence level from Google Vision is needed before the agent proposes logging an expense? Too low = false positives. Founder to decide at B3.
7. Morning nudge timing: 8am IST same as vendor briefing, or different time for brides? Open.
8. Circle member invite flow: does circle member need to be a dream-os user, or can anyone join via link? If anyone: what DB row represents them before they onboard? Founder to decide at B2.
