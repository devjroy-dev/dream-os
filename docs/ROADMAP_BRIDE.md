# dream-os — Bride & Couple Roadmap
**Last updated:** 2026-05-16
**Current session:** B3 in progress (B3.1 follows B3 — order corrected from B2 close)
**Status:** B1 + B2 shipped. B3 (planner: tasks + bookings + receipts + event tools) in progress → B3.1 (cleanup + circle invite link bug fix) → B4 → Session 9.
**Latest bride product version:** 0.8.5a.2-b2

---

## Vision

thedreamwedding.in is where brides live.

WhatsApp-first wedding planner for the bride. She texts a number. An AI agent remembers everything, captures her taste, builds her plan, connects her to the right vendors, and manages the most important day of her life.

The +14787788550 number (The Dream Wedding, Meta-verified) is her number. NRI brides trust it. International format signals premium.

Vendors don't live here. They appear here — curated, styled, earned. The bride is always protected. The vendor earns access through quality of work. Dev and Swati decide who features on Discover.

thedreamwedding.in (bride) and thedreamai.in (vendor) meet at Discover. That is the crossroads. Everything else is separate.

---

## Why we built bride after vendor (the strategic reasoning)

Vendor side hit a real architectural ceiling at Session 8.5. The 17 disambiguation edge cases in HANDOVER.md exist because brides have no persistent identity. Continuing to build vendor features on top of ambiguous bride identity meant:
- Every new vendor feature re-handles the ambiguity
- Discover cannot be built — requires real bride identity
- Edge case count grows, not shrinks

Pause vendor at 8.5a, build bride to parity, establish `couple_id` as first-class identity, then converge at Session 9. The vendor product benefits from the stability afterward.

---

## Document discipline (mandatory, mirrors vendor side)

These rules are non-negotiable. Every B-session follows them without exception.

1. **Four documents updated at end of every B-session, before closing:**
   - `HANDOVER_BRIDE.md` — fully rewritten. Current state only, not history. **First thing read at start of next B-session.**
   - `SCHEMA.md` — fully rewritten. Unified — covers both vendor and bride tables. Exact current DB state.
   - `ROADMAP.md` — updated. Vendor track frozen at 8.5a, but log any vendor fires.
   - `ROADMAP_BRIDE.md` — this document. Mark done, add new, update open questions.
   - **Session not complete until all four are committed and pushed.**

2. **`HANDOVER.md` is frozen at 8.5a state during B-sessions.** Do NOT update it. It stays as the vendor-side reference until Session 9 convergence.

3. **Every schema change goes through a numbered migration file in `db/migrations/`.** Bride migrations continue the vendor sequence. 0013 is the first bride migration. **One migration history. No separate numbering.**

4. **Every B-session starts by cloning the repo fresh and reading:**
   ```
   git clone https://github.com/devjroy-dev/dream-os.git dream-os-fresh
   cat docs/HANDOVER_BRIDE.md
   cat docs/ROADMAP_BRIDE.md
   cat docs/B[N]_SPEC.md   (if exists)
   cat docs/SCHEMA.md
   ```
   Then wait for founder confirmation before touching any code.

5. **One thing at a time.** Build, test, then next. Never batch.

6. **No unsolicited changes.** Never change anything not explicitly asked for.

7. **Claude Code for targeted file edits. This chat for strategy, architecture, documents.**

8. **After every commit, reclone the repo fresh before reading or editing any files.**

---

## Architecture principles (non-negotiable)

1. **WhatsApp-first.** Every feature accessible via WhatsApp. PWA is the view layer, not the primary interface.

2. **Same repo, separate entry point.** `src/brideIndex.js` is the bride server. `src/index.js` is the vendor server. Both in `devjroy-dev/dream-os`. Two Railway services from one repo.

3. **Same Supabase project.** `nvzkbagqxbysoeszxent` (Mumbai, ap-south-1). One DB, one migration history, two product surfaces.

4. **Same migration discipline.** Bride migrations continue vendor sequence from 0013.

5. **Same agentic loop pattern** — with one important difference: bride agent has **no terminal reply tool, no first-question post-processing strip.** The final assistant text message IS the reply. Architecture is identical otherwise.

6. **Three-tier model routing** (Bride only):
   - **Haiku** (default) — everyday turns, warm conversation, tool use, Muse interactions, schedule updates
   - **Sonnet** — judgment calls (taste discussions, family conflict, vendor matching reasoning, emotional moments)
   - **Gemini Flash-Lite (grounded)** — retrieval only, for real-world factual lookups (dates, weather, current rules, public events)

   **Critical rule:** Gemini never composes the bride's reply. It retrieves the fact; Haiku weaves it into BFF voice. Three models, one personality.

7. **Same model lock.** `claude-haiku-4-5-20251001` for routine. `claude-sonnet-4-6` for judgment. **Never change without founder approval.**

8. **Same cost tracking.** Every agent turn logs model, input_tokens, output_tokens, cost_usd, cost_inr on the `messages` row.

9. **Shared lib layer.** `src/lib/` (`sendWhatsApp`, `supabase`, `models`, `clients`, `groundedSearch`) is shared. Never duplicated. Bride-specific code never goes in shared lib.

10. **Phone format: always E.164. Always.**

11. **Currency: Rs.** Never the rupee symbol.

12. **Prompt caching from day one.** Bride agent gets 91% input token reduction free. Not rebuilt — inherited from `src/lib/models.js`.

13. **No bride-facing PWA work during B-sessions.** The existing tdw-2 PWA stays live for the public landing. Full authenticated bride PWA ships at Sessions 11-12 alongside vendor PWA.

---

## Naming convention (locked)

- **Data layer** (tables, IDs, URLs): `couples`, `couple_id`, `couple_state`, `couple_invites`, `/admin/couples/*`
- **Product layer** (files, modules, user-facing strings): `bride*`, "Hi Priya — welcome", `brideIndex.js`, `brideSystemPrompt.js`
- **External marketing** (domain, PWA, voice): "The Dream Wedding," "for brides," `thedreamwedding.in`

Three vocabularies, each internally consistent.

---

## Infrastructure

| | Bride | Vendor |
|---|---|---|
| Railway service | dream-wedding (new at B1) | dream-os (existing) |
| Entry point | src/brideIndex.js | src/index.js |
| WhatsApp number | +14787788550 | +91 7982159047 |
| Supabase | nvzkbagqxbysoeszxent (same) | nvzkbagqxbysoeszxent (same) |
| Frontend | thedreamwedding.in (existing tdw-2 PWA until 11-12) | thedreamai.in (Sessions 11-12) |
| Admin | thedreamai.in/admin/couples/* | thedreamai.in/admin/vendors/* |
| Repo | devjroy-dev/dream-os | devjroy-dev/dream-os |

---

## WhatsApp number

+14787788550 — The Dream Wedding. Meta-verified. No restrictions. Permanent bride number.

This number served vendor flows during vendor Sessions 1-8.5. After Session 6.5 (+91 arrived for vendors, completed 2026-05-15), +14787788550 is freed and becomes the exclusive bride number. The brand name "The Dream Wedding" on this number is correct and permanent — it is the bride product brand.

Twilio webhook for this number routes to `src/brideIndex.js` from B1 onwards. Never to vendor routing logic again.

---

## The two-backend reality (B-session window only)

During B1-B4 (~8 weeks), two backends run in parallel:

| Backend | Role | Domain | Supabase |
|---|---|---|---|
| **tdw-2 backend** | Public funnel only — landing + Just Exploring + invite request form | thedreamwedding.in | nqcdfzbvlrcrjineoudp (old) |
| **dream-os backend** | The actual bride product — WhatsApp agent, conversations, all wedding data | dream-os Railway | nvzkbagqxbysoeszxent (new) |

**The handoff is manual.** Swati reviews invite requests in tdw-2 admin, then generates a unique token in dream-os admin (`/admin/couples/invites`), and sends the resulting wa.me link to the bride personally.

At Session 9 or later, tdw-2 retires. The dream-os repo takes over the public landing at thedreamwedding.in (Sessions 11-12). Until then, both run.

---

## The invite mechanic (locked at B1)

Swati controls who gets in. Token-based, one-time use, name-encoded.

**Flow:**
1. Swati visits `thedreamai.in/admin/couples/invites`
2. Form: bride's name (e.g. "Priya Mehta") + optional notes
3. Click Generate → system creates `couple_invites` row: token = `PRIYA-A8F2K9`, bride_name = "Priya Mehta", used = false
4. Returns the wa.me link: `wa.me/14787788550?text=PRIYA-A8F2K9`
5. Swati shares the link with Priya (DM, text, however)
6. Priya taps → WhatsApp opens with `PRIYA-A8F2K9` pre-filled → she sends
7. Bride agent's first-message handler: token regex match → looks up in `couple_invites` → if valid+unused → mark used → create users + couples + couple_state rows → greet by name and start onboarding

**Token format:** `<UPPERCASE_NAME>-<6_CHAR_RANDOM>` (e.g. `PRIYA-A8F2K9`). Bride sees her name in the link → small moment of charm. Regex: `^[A-Z]+-[A-Z0-9]{6}$`.

**Non-invited messages:** First message without a valid token → dead-end:
> "Sorry — you're not on our invite list yet. Request access at thedreamwedding.in"

Same message on every repeat attempt. No escalation. Swati monitors via Twilio logs if needed.

**Reused tokens** (already-used token tapped again) → same dead-end message.

---

## The bride agent's voice — BFF with wit

This voice is what makes the bride product feel distinctive. It must be enforced in `brideSystemPrompt.js` and in B-session reviews.

**What it is:**
- **Informal** — never corporate, never "I'd be happy to help you with that"
- **A hint of sarcasm and wit** — a little arch, observant, occasionally dry
- **Non-judgmental** — doesn't lecture, doesn't moralize
- **Leans toward what she wants** on taste, aesthetic, vision — validates her direction
- **Best friend energy** — knows her, remembers her stuff, treats her like an adult

**What it is NOT:**
- Not warm-blanket therapy AI ("I hear you, that sounds really hard")
- Not bubbly cheerleader ("OMG yes queen!!!")
- Not formal assistant ("Certainly, I can help you with that")
- Not over-affectionate ("babe", "love", "sweetie")

**Reference points:** Phoebe in Fleabag's narration energy. The bestie texts in Past Lives. A Vogue editorial voice in casual mode. Dry, smart, present, low-stakes, doesn't perform care.

**The discipline of validation (critical rule):**
The bride agent leans toward what the bride wants on aesthetic and vision. It does NOT validate harmful financial moves or interpersonal moves without flagging them once, gently. **Once. Not repeatedly.** Like a BFF would, on important things only.

Example. Bride: *"I think I want a destination wedding in Udaipur but Mom keeps pushing for Delhi"*:
- Wrong (cheesy warm): "I totally understand, this must be such a tough conversation with your mom."
- Wrong (bubbly): "Udaipur sounds AMAZING!!! Don't let her stop you 🙌"
- Right: "Udaipur is the better wedding. Delhi is the easier wedding. Your mom is voting for easier — fair, but not the same thing. Want me to keep both options open in your notes for now?"

---

## Feature parity map

Every bride feature mirrors a vendor pattern. We adapt, not reinvent.

| Bride feature | Vendor equivalent | Notes |
|---|---|---|
| Onboarding (name, partner, date, city, budget) | Onboarding (name, category, city, rate) | Same state-machine. couples.onboarding_state. |
| couple_self conversation thread | vendor_self conversation thread | Same conversations table. New kind value. |
| couple_state table | vendor_state table | Summary, vendor shortlist, taste notes. |
| note_to_self tool | note_to_self tool | Identical pattern. |
| save_wedding_detail tool | Onboarding field updates | Bride version of updating profile fields mid-conversation. |
| add_event / list_events | events table | Reuse events table scoped by couple_id (B3 migration adds couple_id column). |
| create_task / list_tasks / complete_task | (no vendor equivalent) | Personal organization, not business ops. |
| save_receipt / list_receipts | log_expense (similar shape, different intent) | Bride is record-keeping, not budget-tracking. |
| shortlist_vendor tool | create_lead tool | Bride saves a vendor. Generates a lead on vendor side simultaneously. |
| list_my_vendors tool | list_leads tool | Bride sees her shortlisted vendors. |
| ask_vendor tool | (no vendor equivalent) | Bride routes a message to a specific vendor in her list. |
| Surprise Me (/surprise) | (no vendor equivalent) | AI reads Muse saves, matches vendors by aesthetic. **UNIQUE to bride.** |
| Morning nudge | Morning briefing | Same cron pattern. Bride gets days-to-wedding + priority task at 8am IST. |
| Smart model routing | Session 8.1 | Inherited day one. Three-tier (Haiku/Sonnet/Gemini). |
| Prompt caching | Session 8.2 | Inherited day one. |
| Muse | Notes | Richer. Images, links, Pinterest URLs. Google Vision tags aesthetics. **UNIQUE to bride.** |
| Circle | — | No vendor equivalent. Co-planners with roles, activity, reactions. **UNIQUE to bride.** |
| Discover | — | No vendor equivalent. Curated marketplace. Built at Session 9 convergence. |

---

## The three unique bride surfaces

### Muse — mood board
Bride saves links, Pinterest pins, images. Google Vision reads aesthetics and extracts tags (moody, editorial, pastel, OTT, minimal, candid, grand, rustic, modern). Tags build her taste profile. Input via WhatsApp (she forwards anything). View via thedreamwedding.in/couple/muse — the PWA, ported from tdw-2 code, ships at Sessions 11-12.

Muse is not just a save feature. It is the raw material for Surprise Me and the intelligence layer that powers Discover matching.

Free tier: Google Vision reads images, Haiku composes tags.
Paid tier: Haiku + Sonnet for richer aesthetic interpretation.

### Circle — co-planners with bounded permissions
Bride grants access to specific people. Roles: partner / family / inner_circle. They can like or add to her Muse board. They can edit/delete their own contributions. **They cannot edit or delete what the bride or other circle members add.** Permission model enforced at API layer — never trust client. `saved_by_user_id` is the permission key.

When a circle member checks in to Muse via their PWA, they see: "New from [Bride] since you last visited." Bride's new saves appear one by one. Member can react (heart/thumbs-up/star-struck/thinking) and comment. When member finishes, the AI:
- Reads member's reactions + comments
- Composes a summary for the bride in BFF voice: *"Mom checked in. Out of your 6 new saves, she hearted the pastel lehengas and commented 'too much gold' on save #12."*

Bride can ask follow-ups any time: *"What did Mom say about save 17?"* → agent responds with member's exact comment.

**Reactions are locked at four:** heart, thumbs-up, star-struck, thinking. Do not add more without founder approval.

### Surprise Me — AI taste matching
Triggered by `/surprise` command in WhatsApp (also via PWA later). Reads bride's Muse saves (actual images via Google Vision, not just tags). Matches her aesthetic profile against Discover vendor portfolios. Returns 3-5 vendors whose work matches her taste.

**Hard density block:** Surprise Me does not surface vendors until density per (city, category) is met:
- Minimum 8 vendors per category per city before AI surfaces from that combination
- Minimum 3 cities live before /surprise is functional at all
- Until thresholds met, agent responds with honest deflection + Gemini-grounded web results:
  > "We're being picky about who we let on Discover — only 12 photographers in our edit right now, and they're all Mumbai-only. Until we're ready, here's what I'd start researching: [grounded results]. Send me any names you're considering and I'll keep track of them."

Density readiness controlled via `discover_readiness` table (city + category → boolean). Dev/Swati flip flags manually.

Free tier: Haiku + Google Vision (lighter matching).
Paid tier: Haiku + Sonnet (sharper, more nuanced aesthetic reasoning).

This is the intelligence layer that closes the loop: her taste leads to matched vendors leads to curated leads for the right vendors. It is what makes Discover a marketplace and not a directory.

---

## Discover — where vendor and bride meet (Session 9)

Hosted at thedreamwedding.in/discover. Built in Session 9 (convergence).

Curation model: not every dream-os vendor appears on Discover. Dev and Swati decide who features. The gate is style, not just payment. **Payment gets a vendor considered. Style gets them featured.** This keeps Discover's quality high and gives the product editorial control. It is defensible — a vendor cannot buy their way onto Discover if the work is not there.

Two lead pipelines running in parallel:
- **TDW wa.me pipeline:** any vendor, any bride, organic. Lower intent, higher volume.
- **Discover pipeline:** curated vendors, bride with a taste profile, Surprise Me match. Higher intent.

The Discover pipeline carries `couple_id` + taste profile with every enquiry. Vendor notification includes context: *"Priya (moody editorial, budget Rs 3L+) just enquired."* Warm lead, not cold.

---

## Silent onboarding — brides arriving via TDW links (Session 9+)

Once bride product is at parity and Discover is live, the +91 vendor number can silently onboard brides into the bride product.

**Flow:**
1. Bride taps a vendor's wa.me link, lands at +91 with `TDW-DEV550` pre-filled
2. Vendor agent (src/index.js) identifies this as a couple-side message
3. **Before routing to the vendor**, agent creates couples row silently:
   - users row (if phone doesn't exist)
   - couples row with `onboarding_state = new`, `whatsapp_linked = false`
   - couple_state row
4. Message routes to vendor as normal
5. Across next 5-10 messages with vendor, the agent silently captures wedding details (date when mentioned, city when mentioned, etc.) into couples row via shared helper `src/lib/coupleIdentity.js`
6. After 3+ meaningful exchanges, the agent appends one line to one of its replies (vendor's voice, not bride agent):
   > "We're opening The Dream Wedding's planning tool to a small group of brides. If you'd like a peek: thedreamwedding.in/explore"
7. couples.nudge_sent_at stamped. Never appended again from any vendor thread, ever.
8. If bride clicks through, lands on tdw-2 PWA (or post-11-12, the new dream-os PWA). If she requests an invite, Swati approves her and sends a couple_invites token via +14787788550.

**Permission boundary:** vendor agent only **reads** couples.* fields. It WRITES via the helper only for silent field capture. It does NOT write to couple_state.summary (that's the bride agent's working memory, kept pristine).

**One nudge per bride, lifetime.** Even if she enquires with 5 vendors.

**Never on first exchange.** Threshold is 3+ meaningful exchanges.

---

## B-session plan (detailed)

Each B-session ships a tight scope, tested live, with four documents updated at the end.

### B1 — Couple identity + WhatsApp onboarding ✅ COMPLETE
**Status:** ✅ Shipped 2026-05-16. Version 0.8.5a.1-b1.
**Final commit:** c4cedcc
**Time taken:** ~6 hours including live debugging and two patches

**What actually shipped (differs slightly from original B1 spec — see HANDOVER_BRIDE.md for full inventory):**

Architectural changes from original spec:
- **Phone-as-gate instead of token invites.** No `couple_invites` table. Swati invites by phone + name + pronouns via admin. Bride messages from that phone → phone-gate passes. Phone is by definition her WhatsApp number at every entry point.
- **No `whatsapp_linked` column.** Onboarding state alone is sufficient.
- **Added `users.pronouns` column** (not in original spec). Founder added this during testing to support both bride and groom.
- **Three migrations instead of one** because two bugs surfaced during live testing: 0014 (conversations XOR) and 0015 (pronouns + invite dedup + 3-arg invite_couple).

**Migrations shipped:**
- `0013_couples_onboarding.sql` — couples.onboarding_state, couple_state table, events.kind enum widened to 12, events/notes/conversations XOR for vendor_id/couple_id (conversations fixed in 0014), invite_couple() function
- `0014_conversations_xor.sql` — conversations.vendor_id nullable + couple_id added + XOR constraint (bugfix discovered live)
- `0015_pronouns_and_dedup.sql` — users.pronouns, couples.user_id unique, invite_couple() 3-arg signature

**Code shipped:** see HANDOVER_BRIDE.md "What shipped in B1 — file inventory" for the complete list.

**Live verification:**
- Test couple `7abccc1b-...` (Swati Couple Test) walked through full onboarding from her phone
- Dodged date question → captured nothing, moved on without "circle back" phrasing
- Dodged partner question with "I'd rather not say" → Haiku correctly classified as DODGE, did NOT save the literal text
- Captured city ("Goa") and budget ("35l" → 3500000) correctly
- Completion message fired with bride's name
- Defer response ("later") triggered locked "👍 You know where to find me" branch

**Locked decisions for future B-sessions:**
- Phone-as-gate is the default. Token invites added later only if needed (see HANDOVER_BRIDE.md "Open questions")
- Haiku-based intent classification preferred over regex for any natural-language judgement
- Writer .py protocol is mandatory for all file changes (see HANDOVER_BRIDE.md)
- Versioning scheme: bride sessions are `0.8.5a.<N>-b<N>`. Convergence is `0.9.0`

**See `docs/HANDOVER_BRIDE.md` for full B1 build log, bugs caught, vendor parity items, and operational state.**

### B2 — Muse + Circle ✅ COMPLETE (2026-05-16)

**Version:** 0.8.5a.2-b2 | **HEAD:** acb4828

**What shipped:** Full Muse vertical (image + Pinterest/IG link saves, Google Vision tagging, Haiku taxonomy classification, Cloudinary mirroring, agent BFF voice). Circle invites (CIRCLE-XXXXXX tokens, 3-member cap). Circle member routing (daily image cap 5, session-based summarization, text-note capture). Step 6 session surfacing (Haiku composes BFF summary, prepends to bride's next turn). Admin delete button. CC audit (12 findings fixed, 8 deferred to B3.1).

**Smoke test status:** Muse vertical fully verified in production. Circle smoke test deferred to B3.1 (requires two phones).

**Goal (original):** Bride has a mood board. Her circle can contribute (with bounded permissions). AI summarizes circle activity in BFF voice.

**Migrations:** `0016_muse_and_circle.sql`
- `muse_saves` table (id, couple_id, source_type [image/link/vendor], source_url, image_url, caption, aesthetic_tags jsonb, saved_by_user_id, created_at)
- `circle_members` table (id, couple_id, invitee_phone, invitee_name, role [partner/family/inner_circle], invite_token, status [pending/active/removed], joined_at, last_checked_in_at, created_at)
- `circle_activity` table (id, couple_id, actor_user_id, actor_name, activity_type [save/like/add/comment], subject_id, subject_type [muse_save], comment_text, created_at)

**Code additions to brideTools.js:**
- `save_to_muse` — bride forwards image/link → agent calls Google Vision → tags stored → row inserted
- `list_muse` — recent saves with tags
- `invite_to_circle` — bride names someone → invite_token generated → wa.me link sent
- `list_circle` — bride sees her circle members + their last check-in
- `surface_circle_summary` — internal function (not LLM-callable tool), runs after circle activity bursts to compose BFF-voice summary

**Aesthetic taxonomy locked in `src/agent/brideAesthetics.js` at B2:**
- Categories: moody, editorial, pastel, OTT, minimal, candid, grand, rustic, modern
- **Do not add categories without founder approval.**

**Smoke tests:**
- Bride forwards an image → Google Vision tags → muse_save row → list_muse shows it
- Bride invites mom → invite token generated → Mom taps → joins as `family` role
- Mom adds a save → bride gets BFF-voice summary
- Mom comments on bride's save → "Mom said 'too much gold' on save #X" surfaces correctly
- Bride asks "what did Mom say about save 17?" → exact comment returned
- Mom tries to delete bride's save via API → 403 (permission enforced)


### B3 — Planner: tasks + event tools + bookings + receipts (single session, ~3.5-4 hours including smoke tests)

**Goal:** Bride has complete planning substrate. Tasks, schedule (events fully tooled), receipts, and per-vendor commitment tracking (Bookings). Morning nudge live.

**Scope correction from B2 close:** B3 grew from "tasks + receipts" to "tasks + event tools + bookings + receipts" after the B3-planning discussion. Two corrections:

1. **The original "no money tools on bride side" framing was over-corrected.** The bride does not need a CFO function (parents handle venue/catering, no GST, no income reconciliation) — but she does need to remember what she owes whom and when. Bookings fill that gap. The locked decision "no budget tracking" stays; bookings are commitment-tracking, not budget-tracking. See "Architectural principles" below.

2. **Event tools are half-built and need completion.** `add_event` shipped at B1. `list_events`, `update_event`, `delete_event` were never added — the bride can create events but can't see, edit, or delete them. The morning nudge can't read events without `list_events`. B3 closes this gap.

**Migrations:** `0019_bride_planner.sql`
- `couple_tasks` table (id, couple_id, title, status [pending/done], priority [high/medium/low], due_date nullable, event_name, notes, timestamps)
- `couple_bookings` table (id, couple_id, vendor_name text, vendor_id uuid nullable FK vendors(id) ON DELETE SET NULL [for B4 linkage], category text CHECK enum, amount_total integer nullable, amount_advance integer nullable, amount_paid integer NOT NULL default 0, balance_due_date date, state text CHECK [booked/advance_paid/paid] default 'booked', notes, timestamps)
- `couple_receipts` table (id, couple_id, booking_id uuid nullable FK couple_bookings(id) ON DELETE SET NULL, amount integer nullable, vendor_name text nullable, description, receipt_date date nullable, image_url, tags text[], created_at)
- `record_payment()` Postgres function — transactional. Updates `couple_bookings.amount_paid`, recomputes `state` via CASE expression, returns the updated row. **All booking arithmetic happens in SQL, never in the agent.**
- `events.couple_id` column ALREADY exists from migration 0013 (B1). No event-table schema changes in 0019.

**Booking category enum (locked, 11 values):** photographer, videographer, mua, designer, venue, caterer, decor, florist, music, planner, other. Bride-product terminology, not vendor expense terminology — these enums never share.

**Architectural principles locked at B3 (non-negotiable, apply to all future bride work):**

1. **No agent arithmetic, ever.** Every number the agent says must come from a database query in the current turn. Sums, balances, percentages, totals — all computed by SQL (in tool functions or via columns like `balance_due = amount_total - amount_paid`). Haiku reads the returned numbers verbatim into the reply. This rule exists because Haiku gets simple math wrong often enough to destroy trust in a money tool. The model identifies intent; SQL computes values.

2. **Intent maps to tool, not to phrasing.** "Cancel Anvaya," "delete Anvaya booking," "remove Anvaya," "scratch the photographer" — all resolve to `delete_booking()`. "Remind me about the trial Saturday," "block Saturday for trial," "add a trial Saturday at 11am" — all resolve to `add_event(kind='trial', ...)`. The bride speaks naturally; the agent classifies intent and calls the right tool. Phrasing varies, intent → tool is the model's job to get right.

3. **Delete replaces cancellation. No state machine for refunds.** Booking cancelled → `delete_booking()`. Receipt was wrong → `delete_receipt()`. Event cancelled → `delete_event()`. No `cancelled` state on bookings or receipts. No refund logic, no reconciliation flow. If a booking is cancelled and the advance comes back, the bride deletes the booking and (optionally) adds a free-text note. The audit trail is the conversation history, not the table.

4. **No per-payer attribution. Ever.** Every receipt is implicitly the bride's. If Dad pays the venue, the bride captures that in free-text notes ("Dad paid this — Rs 5L advance to Sterling Banquet, 12 May"). No `paid_by` field, no payer table, no splits with parents, no shared budgets. This is **out of scope forever**, not deferred. The bride product is a BFF that remembers, not a ledger that reconciles.

5. **Bookings are flat. Single-row commitment tracking.** No multi-event splits ("Anvaya doing both wedding AND reception, Rs 1L each") — that's two bookings, or one booking with free-text notes. No category allocation against a total budget — the budget table does not exist. Bookings stand alone.

6. **Receipts link to bookings optionally, never silently.** When a receipt arrives (image or text), the agent uses a three-branch flow: Branch A (standalone), Branch B (looks like advance for new booking), Branch C (matches existing booking). The agent **asks** in every case — never auto-links. Confirmation precedes any write that updates `couple_bookings.amount_paid`.

7. **Destructive actions confirm. Ambiguous references disambiguate.** Before any `delete_*` call: present what will be deleted, get explicit yes. Before any tool call with an ID resolved from a name (e.g. "delete Anvaya" → which Anvaya?): list candidates, confirm the right row. Applies to bookings, receipts, events, tasks — every entity with a `delete_*` tool. Same pattern shipped on the vendor side at Session 8.5.

**Code additions to brideTools.js (17 new tools):**

*Task tools (5):*
- `create_task` / `list_tasks` / `complete_task` / `update_task` / `delete_task`

*Event tools (3 new — `add_event` already shipped at B1):*
- `list_events` (filterable: by date range, by kind, by state)
- `update_event` (change date, time, title, notes; disambiguation required when bride references by name)
- `delete_event` (irreversible; disambiguation required)

*Booking tools (5):*
- `add_booking(vendor_name, category, amount_total?, amount_advance?, balance_due_date?, notes?)` — `amount_total` and `amount_advance` both nullable to allow "advance paid, total TBD" common in real bookings (designers especially)
- `list_bookings(state?, category?)` — returns rows with `balance_due` and other derived fields computed by SQL
- `update_booking(booking_id, ...)`
- `delete_booking(booking_id)` — irreversible; linked receipts get `booking_id` set to null (receipts preserved as standalone records via ON DELETE SET NULL)
- `list_dues(within_days?)` — what's due, when, who to; sorted by date, computed in SQL

*Receipt tools (4):*
- `save_receipt(vendor_name, amount, receipt_date, description, tags, image_url, booking_id?)` — `booking_id` set only after explicit bride confirmation in the linkage flow
- `list_receipts(vendor_name?, tags?, booking_id?, date_range?)`
- `delete_receipt(receipt_id)` — irreversible; if linked to a booking, also reverses the payment contribution by calling `record_payment` with negative amount in the same transaction (atomic)
- `record_payment(booking_id, amount, receipt_id, payment_date)` — transactional. Calls the `record_payment()` SQL function. Single source of truth for booking state transitions. Agent never updates `amount_paid` or `state` directly — only through this tool.

**Image classifier (Haiku-as-classifier):** When the bride sends an image, the pipeline runs Vision first (we need it for both Muse tagging and receipt OCR anyway), then Haiku reads the Vision response + caption text and returns `muse` or `receipt`. One extra Haiku call per image (~Rs 0.10), chosen for flexibility over a hardcoded Vision text-density rule. Cost acceptable at founding-cohort scale; can revisit if cost matters at 500+ active brides.

**Receipt OCR flow (Haiku-as-classifier → Vision → three-branch flow):**
1. Bride sends photo → image classifier (Haiku) routes to receipt vs Muse
2. Receipt path → Vision OCR extracts amount, vendor, date (best-effort, any field may be null — no confidence gate)
3. Agent queries existing bookings for fuzzy vendor-name match (case-insensitive substring)
4. Agent picks branch based on match results + vendor shape + OCR signals:
   - **Branch A (standalone):** No vendor-shaped match, non-wedding-vendor purchase. "Got this — Rs 8K to Bombay Mithai on 14 May. Save it as a receipt?"
   - **Branch B (new booking likely):** Vendor-shaped name, no existing booking, substantial amount or "advance" detected. "Got this — Rs 50K to Studio Anvaya on 14 May. Looks like an advance for a new booking. Want me to set one up — what's the total contract value?"
   - **Branch C (existing booking match):** Vendor name matches a booking. "Got this — Rs 1L to Studio Anvaya on 14 May. Is this against your Studio Anvaya booking? (Total Rs 2L, Rs 50K paid so far.)"
5. Bride confirms → atomic tool call:
   - Branch A confirmed → `save_receipt()` alone
   - Branch B confirmed (+ total given) → `add_booking()` then `save_receipt()` (with booking_id) then `record_payment()`
   - Branch C confirmed → `save_receipt()` (with booking_id) then `record_payment()`

**Receipt OCR confidence threshold (locked at B3 — no gate):** Vision returns what it returns. Agent proposes the save with whatever fields are filled. Missing fields → agent asks for them in the same turn ("Got the receipt — looks like Priya Mehta Couture on 14 May. What was the amount?"). Hard confidence gates produce silent failures, which feel worse than a wrong guess that the bride can correct.

**Text-only payment events:** Bride says "Just paid Anvaya Rs 50K advance" with no image. Agent treats this identically to a receipt with no `image_url`. Same three-branch flow. Creates a `couple_receipts` row with `image_url = null`. Real-world critical — brides often log payments verbally without a photo handy.

**Morning nudge (cron):**
- 8am IST daily, same cron pattern as vendor morning briefing (inherited from Session 6)
- Content: days-to-wedding count + top priority task + any events today + dues within next 14 days
- Sent as service message if 24h window open; utility template if closed

**Twilio template submission:** Moved from start of B3 to **end of B3, after smoke testing the morning nudge content** (decision in B3 planning). Submit `dream_wedding_morning_nudge` once nudge content is finalized — approval takes 1-7 days, but a re-submission cycle costs more than a 1-7 day wait at the end.

**B3 build order (one thing at a time, smoke-test after each):**
1. Migration 0019 (tasks + bookings + receipts + record_payment function)
2. Task tools (5) — smoke-test
3. Event tools (3 new) — smoke-test (using existing test bride's `add_event` flow as the validation harness)
4. Booking tools (5) — smoke-test
5. Image router refactor — Haiku-as-classifier. Smoke-test that existing Muse images still route correctly
6. Receipt tools + 3-branch linkage flow (4 tools) — smoke-test all three branches with the test bride
7. Morning nudge cron (8am IST) — smoke-test (manual trigger first, then verify cron schedule)
8. Twilio template submission (now that nudge content is known)
9. Docs + close (HANDOVER_BRIDE.md rewrite, SCHEMA.md update, this roadmap update, ROADMAP.md vendor-fires log)

**Smoke test surfaces:**
- create_task("call venue Monday", due_date "monday") → list_tasks shows it correctly → complete_task → status updated → delete_task → gone
- list_events on test bride → returns events created in B1+ shows correctly with couple_id filter
- update_event ("move trial to Sunday") → with disambiguation if multiple trials
- delete_event with confirmation flow
- add_booking ("Booked Studio Anvaya, photographer, Rs 2L total, paid 50K advance, balance due Dec 1") → row created with state='advance_paid'
- list_bookings → shows Anvaya with balance_due computed by SQL = 150000
- list_dues(within_days=30) → shows Anvaya balance due in N days
- Image classifier: send Pinterest aesthetic image → routes to Muse → existing flow works
- Image classifier: send receipt photo → routes to receipt OCR → three-branch flow
- Receipt Branch A: photo of sweets bill → "Save it?" → standalone receipt
- Receipt Branch B: photo of new vendor advance receipt → "Set up a booking?" → asks total → creates booking + receipt + payment atomically
- Receipt Branch C: photo of second payment to known vendor → "Against existing booking?" → links receipt + updates amount_paid via record_payment
- Text-only payment: "paid 30K to florist" → no image → still goes through three-branch flow
- Morning nudge: manual trigger for test bride → composes correct content with days-to-wedding + top task + today's events + 14-day dues
- delete_booking → confirms before deleting → linked receipts preserved as standalone

### B3.1 — Cleanup + circle invite link bug fix (post-B3, ~90 min)

**B3.1 was incorrectly documented at B2 close as a prerequisite to B3. Corrected at B3 start: B3.1 follows B3.** B3.1 is the dedicated cleanup session for B2 deferred items + a known production bug + admin polish + a small migration.

**Goal:** Close out B2 deferred audit items, fix the broken circle invite link, close known admin/schema gaps. Not a feature session — entirely cleanup.

**Smoke tests:**
- End-to-end circle flow: bride invites Mom → Mom claims CIRCLE-XXXXXX token → Mom forwards image → session closes (10 min idle) → bride messages → summary preamble appears → bride says "yeah" → images sent back

**Known production bug (added to B3.1 scope):**
- **Circle invite wa.me link broken end-to-end.** Bride invites a circle member (e.g. Mom), the wa.me/CIRCLE-XXXXXX link is generated and returned, but does not work end-to-end when the invitee taps it. Specific symptom TBD on investigation. Affected flow: `invite_circle_member()` Postgres function → admin/agent response containing wa.me link → invitee taps → claim flow. One of the steps in this chain is broken. Investigate the admin invite generation path and the bride agent's invite response composition, plus the claim regex in `brideIndex.js`. Fix in B3.1.

**Bug fixes (CC audit findings deferred from B2):**
- M2: Duplicate session creation race → unique partial index on circle_sessions(circle_member_id) WHERE summarized_to_bride = false
- M5: Brittle string-contains for circle_member_limit_reached → use SQLSTATE or structured exception payload
- L2: image_playback_queued cumulative across tool calls → capture count before loop
- L5: circle_sessions_member_activity_idx missing WHERE summarized_to_bride = false
- L6: summary_message_id has no FK → add REFERENCES messages(id) ON DELETE SET NULL
- L9: Inbound message not logged early enough in handleCircleMemberMessage
- I4: Hard cap on text-only circle messages (currently unlimited) — add daily text cap, separate from image cap

**Admin fixes:**
- Delete button password confirmation (currently one-click — security gap). Second POST route validates ADMIN_PASSWORD env var before executing delete.

**Migration 0020 (small — note: 0019 = B3 planner, 0020 = B3.1 cleanup, 0021 = B4 vendor connections; migrations numbered in apply order):**
- 7-day expiry on pending circle invite tokens (add expires_at column + check in claim_circle_invite function)
- summary_message_id FK to messages(id) ON DELETE SET NULL
- circle_sessions unique partial index (M2 fix)


### B4 — Vendor connections + Surprise Me + silent onboarding (2 sessions, ~180 min total)

**Goal:** Bride has all her vendors in one place. Surprise Me works. Silent vendor-side onboarding live. Two-sided vendor funnel live.

**Pre-B4 sessions:**

#### B4.1a — Gemini grounded search activation (~90 min)
Ships independently, not blocked by bride data. Adds `factual_search` tool to brideTools.js. Executor calls `src/lib/groundedSearch.js` (wired at vendor Session 8.2, currently unused). Brides ask factual market questions ("venue pricing in Mumbai", "Sabyasachi lehenga cost") → Gemini Flash-Lite retrieves → Haiku composes BFF-voice reply. Tool description must distinguish factual queries (use tool) from taste/opinion (just chat). Failure path: graceful fallback if Gemini errors.

#### B4.1b — Bride classifier tuning (~45-60 min)
Ships after 4 weeks of real founding-cohort bride conversation data accumulates. Current classifier (classifier.js) was written for vendor COMPLEX patterns. Bride-specific COMPLEX triggers (family conflict, taste arbitration, multi-vendor decisions, emotional moments) under-promote to Sonnet. Tuning: add bride-specific COMPLEX and SIMPLE examples. Option: separate brideClassifier.js instead of modifying the shared one.

**Migrations:** `0021_vendor_connections_and_discover.sql`
- `couple_vendor_connections` table (id, couple_id, vendor_id, state [shortlisted/enquired/booked/passed], source [muse/discover/whatsapp/manual], shortlisted_at, enquired_at, notes, created_at, updated_at)
- `vendors.aesthetic_tags` jsonb (Swati-managed portfolio tags for Surprise Me matching)
- `discover_readiness` table (city, category, ready boolean, ready_at timestamptz, primary key (city, category))

**Code additions:**
- `shortlist_vendor` tool — bride saves a vendor → couple_vendor_connections + leads row on vendor side
- `list_my_vendors` tool — all her vendor connections with state (shortlisted/enquired/booked/passed)
- `ask_vendor` tool — bride routes a message to a specific vendor in her list. Works only for dream-os vendors. For external vendors, bride manages via WhatsApp directly and records notes via agent.
- `/surprise` command handler — runs Surprise Me matching, with hard density block
- **Silent wa.me onboarding** in vendor agent (src/index.js):
  - Vendor agent calls `coupleIdentity.ensureCoupleRow(phone)` on first couple_thread message
  - Vendor agent calls `coupleIdentity.captureField(couple_id, field, value)` when wedding details mentioned
  - Vendor system prompt rule: after 3+ exchanges, append the bride-product nudge once. Check couples.nudge_sent_at first.

**The locked nudge line (bride-side):**
> "We're opening The Dream Wedding's planning tool to a small group of brides. If you'd like a peek: thedreamwedding.in/explore"

**B4 discussion items (architecture TBD — discuss at B4 planning):**

**1. Bride-initiated vendor outreach + silent vendor onboarding (two-sided funnel)**
Bride adds an external vendor via WhatsApp (name + phone). dream-os sends a Twilio template to that vendor:
> "Hi, I'm [Bride]'s assistant. She wanted to know when to come for trials."
Vendor replies → reply routes back to bride via dream-os relay. After 2-3 exchanges, vendor gets one-time nudge:
> "Our team also manages professionals like yourself. You should try our services — manage your entire business from WhatsApp itself."
Mirror image of bride silent onboarding via +91 link — same pattern, opposite direction, opposite number (+14787788550 sends template, vendor replies to +14787788550, brideIndex.js routes). New conversation kind needed: `vendor_relay`. New schema element: links bride, external vendor phone, exchange count. Template needs Twilio/Meta approval — submit at B4 start (1-7 day approval). If vendor already on dream-os → skip nudge, just connect thread. Every founding-cohort bride becomes a vendor acquisition channel.

**Architectural question for B4 planning:** does vendor reply route to +14787788550 (bride number, brideIndex.js handles) or +91 (vendor number, index.js handles)? Instinct: +14787788550 — bride initiated, bride side owns the relay.

**2. shortlist_vendor / list_my_vendors / ask_vendor scope**
B4 launch: these tools work only for dream-os vendors (vendors table). External vendors managed via WhatsApp directly + notes in agent. Scales naturally as vendor base grows via Discover and the two-sided funnel.

**Smoke tests:**
- shortlist_vendor → couple_vendor_connections + lead created, both with couple_id
- list_my_vendors shows her shortlist with state
- ask_vendor routes message to correct vendor's thread, vendor sees bride context
- /surprise with density unmet → honest deflection + Gemini-grounded suggestions
- /surprise with density met → 3-5 vendor matches returned
- TDW link first-message from new phone → couples row created silently
- After 3+ exchanges, vendor agent appends nudge once, nudge_sent_at stamped
- Same bride enquires with 2nd vendor → nudge NOT appended again
- Bride adds external vendor phone → Twilio template sent → vendor reply routed back → after 2 more exchanges → vendor nudge sent

At end of B4, the couples table is fully populated for active brides. **Bride track is at parity with vendor track.**

**Migrations:** `0021_vendor_connections_and_discover.sql`
- `couple_vendor_connections` table (id, couple_id, vendor_id, state [shortlisted/enquired/booked/passed], source [muse/discover/whatsapp/manual], shortlisted_at, enquired_at, notes, created_at, updated_at)
- `vendors.aesthetic_tags` jsonb (Swati-managed portfolio tags for Surprise Me matching)
- `discover_readiness` table (city, category, ready boolean, ready_at timestamptz, primary key (city, category))

**Code additions:**
- `shortlist_vendor` tool — bride saves a vendor → couple_vendor_connections + leads row on vendor side
- `list_my_vendors` tool — all her vendor connections with state
- `ask_vendor` tool — bride routes a message to a specific vendor in her list (replaces need for TDW codes for returning brides)
- `/surprise` command handler — runs Surprise Me matching, with hard density block
- Onboarding completion menu card (text version in B1, image version added here once product is full-featured)
- **Silent wa.me onboarding** in vendor agent (src/index.js):
  - Vendor agent calls `coupleIdentity.ensureCoupleRow(phone)` on first couple_thread message
  - Vendor agent calls `coupleIdentity.captureField(couple_id, field, value)` when wedding details mentioned
  - Vendor system prompt rule: after 3+ exchanges, append the bride-product nudge once. Check couples.nudge_sent_at first.

**The locked nudge line:**
> "We're opening The Dream Wedding's planning tool to a small group of brides. If you'd like a peek: thedreamwedding.in/explore"

**Smoke tests:**
- shortlist_vendor → couple_vendor_connections + lead created, both with couple_id
- list_my_vendors shows her shortlist with state
- ask_vendor routes message to correct vendor's thread, vendor sees bride context
- /surprise with density unmet → honest deflection + Gemini-grounded suggestions
- /surprise with density met (manually flip flag in discover_readiness) → 3-5 vendor matches returned
- TDW link first-message from new phone → couples row created silently, no bride-agent intrusion
- After 3+ exchanges, vendor agent appends nudge once, nudge_sent_at stamped
- Same bride enquires with 2nd vendor → nudge NOT appended again

At end of B4, the couples table is fully populated for active brides. The note in SCHEMA.md "essentially unused" is deleted. **Bride track is at parity with vendor track.**

---

## Session 9 — Convergence (see ROADMAP.md for full scope)

B4 completion is the prerequisite for Session 9. At that point:
- Every bride has a couple_id
- Muse, Circle, planner, vendor connections all working
- Surprise Me matching live (density-gated)
- Silent onboarding live on +91 vendor number

**Session 9 specifically:**
- Launches Discover at thedreamwedding.in/discover with real vendor data and bride taste profiles
- **Consolidates docs:** `HANDOVER_BRIDE.md` folds into `HANDOVER.md`. `ROADMAP_BRIDE.md` folds into `ROADMAP.md`. Single docs from Session 9 onwards.
- Sonnet routing for couple agent in multi-vendor scenarios
- Resolve user_id / couple_id naming inconsistency inherited from tdw-2
- Vendor admit list curated for Discover launch (Dev + Swati editorial pass)

After Session 9: single vendor-and-bride codebase, single doc set, parallel-track development.

---

## Decisions locked

**Product:**
- thedreamwedding.in = brides and couples only. Permanent.
- Discover hosted at thedreamwedding.in. Vendors have no login here.
- +14787788550 = bride number. Permanent. NRI brides, English-first, premium positioning.
- Bride onboarding is invite-token gated. Manual curation by Swati. Token = `<NAME>-<6_CHAR_RANDOM>`. One-time use.
- First message without valid token → dead-end. Same message on repeat.
- Muse is the raw material for everything. Taste profile drives Surprise Me drives Discover matching.
- Circle permissions: members can add, can edit/delete their own; cannot edit/delete bride's or others'.
- Four reactions locked: heart, thumbs-up, star-struck, thinking.
- Surprise Me has hard density block: 8 vendors/category/city + 3 cities live minimum.
- Surprise Me tiers: free = Haiku + Google Vision, paid = Haiku + Sonnet.
- Discover curation: style gates, not just payment. Swati has editorial control.
- Bride is record-keeping, not budget-tracking. No budget table in B3.
- One silent-onboarding nudge per bride, lifetime. Never on first exchange. Threshold 3+.

**Architecture:**
- Same repo: devjroy-dev/dream-os. Separate Railway service "dream-wedding."
- Bride entry point: src/brideIndex.js
- Same Supabase: nvzkbagqxbysoeszxent
- Bride migrations continue vendor sequence from 0013. One migration history.
- Shared lib: src/lib/ (sendWhatsApp, supabase, models, clients, groundedSearch, coupleIdentity).
- Bride PWA work: NONE in B-sessions. Authenticated PWA at Sessions 11-12 with vendor PWA.
- tdw-2 PWA serves public landing until Sessions 11-12.
- No terminal reply tool, no first-question strip in bride agent.
- Three-tier model routing: Haiku/Sonnet/Gemini. Gemini retrieval only, never composes.
- Bride agent voice locked in brideSystemPrompt.js. BFF with wit.

**Models:**
- claude-haiku-4-5-20251001: routine. Never change without founder approval.
- claude-sonnet-4-6: judgment + paid-tier Surprise Me. Never change without founder approval.
- Gemini Flash-Lite: retrieval only via groundedSearch.js. Same GOOGLE_API_KEY as vendor side.

**Documents:**
- HANDOVER_BRIDE.md: written at end of every B-session. First thing read at start of next.
- HANDOVER.md: frozen at 8.5a. NOT updated during B-sessions.
- SCHEMA.md: unified. Updated with every bride migration.
- ROADMAP_BRIDE.md: this document. Updated every B-session.
- ROADMAP.md: vendor roadmap, frozen except for any fires.
- All four committed and pushed before session closes.
- Session 9: HANDOVER_BRIDE folds into HANDOVER. ROADMAP_BRIDE folds into ROADMAP.

---

## Open questions

1. **Bride agent voice** — locked in brideSystemPrompt.js at B1. Open: does Swati want any tone adjustments after first 5-10 real brides go through it?

2. **Onboarding flow exact wording** — current planned greeting: "Hi [Name] — welcome. When's the big day?" Open: founder review of full onboarding script before B1 build.

3. **Twilio template content for morning nudge** — submission moved from start of B3 to **end of B3, after smoke testing** the nudge content. Content drafted during build, submitted once finalized. Approval takes 1-7 days but a re-submission cycle costs more.

4. ~~**Receipt OCR confidence threshold**~~ — ✅ Resolved at B3 planning. **No gate.** Vision returns what it returns; agent proposes save with whatever fields are filled. Missing fields → agent asks for them in the same turn. Hard confidence gates produce silent failures, which feel worse than a wrong guess the bride can correct.

5. ~~**Image classifier (Muse vs receipt vs other)**~~ — ✅ Resolved at B3 planning. **Haiku-as-classifier.** Pipeline runs Vision first (needed for both Muse tagging and receipt OCR anyway), then Haiku reads the Vision response + caption text and returns `muse` or `receipt`. One extra Haiku call per image (~Rs 0.10). Chosen for flexibility over a hardcoded Vision text-density rule.

6. **Paid tier definition** — what triggers "paid" for Surprise Me Sonnet routing? Couple tier field? Explicit upgrade? Razorpay? Open. Founder to decide before B4.

7. ~~**Circle member invite flow**~~ — ✅ Resolved at B2. Token-gated. claim_circle_invite() creates users row on first message. 3-member cap. CIRCLE-XXXXXX token format. Pending tokens currently never expire (B3.1 adds 7-day expiry).

8. **Existing tdw-2 bride data** — discarded as test data. No migration from old Supabase to new. Confirmed: hard cutover at B1.

9. **Onboarding completion menu** — text version in B1, image version added at B4. Visual design of image menu TBD (likely at PWA build, Sessions 11-12).

10. **Vendor admit list for Discover** — Swati does editorial pass before Session 9. Open question: how many vendors at launch? 30-50 seems right but founder to confirm.
