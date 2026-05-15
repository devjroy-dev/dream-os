# Project Prompt Addition — Why Vendor Paused, Bride Now
**Created:** 2026-05-15
**Audience:** This document is meant to be pasted into the dream-os project instructions in claude.ai. It explains to any future Claude session why we paused vendor development and why we are now building the bride side.

---

## Context: Where dream-os is right now

As of 2026-05-15, Session 8.5a is complete. Vendor side is at version 0.8.5a. The vendor product is functional and serving the founding cohort. **Vendor development is now intentionally paused.** All B-sessions (B1 through B4) are bride-side. After B4 ships, Session 9 is the convergence point — vendor and bride tracks meet, Discover launches.

## Why vendor paused after Session 8.5a

The vendor product hit a real architectural ceiling. The 17 disambiguation edge cases documented in HANDOVER.md exist because brides have no persistent identity in the system today. When a bride enquires with two vendors, she's just a phone number with two threads — no `couple_id` connecting them. The disambiguation logic shipped in Session 8.5 (sticky, fuzzy match, multi-vendor routing) is the workaround for the absence of bride identity.

Continuing to build vendor features on top of an ambiguous bride identity layer means:
- Every new vendor feature has to re-handle the ambiguity
- Discover (the marketplace) cannot be built — it requires real bride identity to function
- The edge case inventory grows, not shrinks

The structurally correct move: build the bride product to parity, **establish `couple_id` as a first-class identity**, and let the vendor side benefit from that stability afterward.

## Why bride now

Three reasons it's the right next move:

1. **Identity unification.** Once a bride has a `couple_id` from her first contact (regardless of whether she comes through a vendor's wa.me link or the bride product directly), the vendor disambiguation problem largely dissolves. The 17 edge cases collapse to 2-3.

2. **Discover prerequisite.** Discover, the curated marketplace where vendors and brides meet, cannot ship without persistent bride identity. Building Discover without it produces a directory, not a marketplace.

3. **Schema parity.** Both products live in one Supabase. Building the bride schema while vendor is stable means we can design the convergence cleanly, not retrofit it.

## The WhatsApp-first principle (unchanged)

Same architectural principle as vendor side. WhatsApp is the substrate. The bride messages a number. The agent does the work. The PWA (when it exists, post-Sessions 11-12) is the view layer over what WhatsApp captured.

- Bride number: +14787788550 (US number, "The Dream Wedding," Meta-verified, premium positioning for NRI brides)
- Vendor number: +91 7982159047 (Indian number, local trust)
- Both products: one repo (dream-os), one Supabase (nvzkbagqxbysoeszxent), one migration history continuing from 0013

## The two-backend reality during B-sessions

While B1-B4 are building, the existing tdw-2 system stays alive serving a specific role:

- **tdw-2 backend** = public funnel only. Serves thedreamwedding.in (landing + Just Exploring + invite request form). Captures invite requests in its own (old) Supabase. Swati reviews these in tdw-2 admin.
- **dream-os backend** = the actual bride product. Receives WhatsApp messages on +14787788550. Onboards approved brides via unique tokens. Runs the entire bride product.

The handoff is manual: Swati generates a token in dream-os admin (`thedreamai.in/admin/couples/invites`), shares the wa.me link with the bride, the bride taps and lands in dream-os. At Session 9 or later, tdw-2 retires — dream-os takes over the public landing too.

## The invite mechanic (B1)

- Swati generates a unique token per bride (e.g. `PRIYA-A8F2K9`) via `thedreamai.in/admin/couples/invites`
- Token is one-time use, tied to bride's name (not phone — phone gets captured when she messages)
- Token format: `<NAME>-<6_CHAR_RANDOM>` — bride sees her own name in the pre-filled link, distinctive prefix, easy regex match
- wa.me link returned: `wa.me/14787788550?text=PRIYA-A8F2K9`
- Bride taps, WhatsApp opens, message pre-filled, she sends
- Bride agent receives, validates token, marks used, greets her by name
- First message without valid token → dead-end with: *"Sorry — you're not on our invite list yet. Request access at thedreamwedding.in"*

## Document discipline during B-sessions

The four documents updated at end of every B-session:
- `docs/HANDOVER_BRIDE.md` — fully rewritten (current state, not history). First thing read at start of next B-session.
- `docs/SCHEMA.md` — fully rewritten (unified — covers both vendor and bride tables, one DB)
- `docs/ROADMAP.md` — updated (vendor track is frozen at 8.5a, but record any vendor fires that came up)
- `docs/ROADMAP_BRIDE.md` — updated (mark B-session done, refine remaining B-sessions, update open questions)

`docs/HANDOVER.md` is frozen at Session 8.5a state. B-sessions do NOT update it. It stays as the vendor-side reference until Session 9 convergence.

## What a B-session looks like

Every B-session starts with:
1. Clone repo fresh: `git clone https://github.com/devjroy-dev/dream-os.git`
2. Read these four files in order:
   - `docs/HANDOVER_BRIDE.md` — what shipped last B-session
   - `docs/ROADMAP_BRIDE.md` — full bride architecture and B-session specs
   - `docs/B[N]_SPEC.md` — detailed spec for this specific session (if exists)
   - `docs/SCHEMA.md` — current DB state
3. Optionally read for context: `docs/HANDOVER.md` (vendor-side state, frozen) and `docs/ROADMAP.md` (vendor roadmap)
4. Report to founder:
   - Which B-session we're on
   - Current version
   - First priority based on spec + roadmap
   - Any risks or gaps from previous handover
5. **Wait for founder confirmation before touching any code.**

Build discipline (same as vendor side, non-negotiable):
- One thing at a time. Build, test, then next.
- No unsolicited changes. Never touch what wasn't asked.
- Claude Code for targeted file edits. This chat for strategy/architecture/docs.
- After every commit, reclone repo fresh before next edit.
- Phone numbers always E.164.
- Currency: Rs (never the rupee symbol).
- Never paste secrets in chat — use Railway env vars.

## The bride product is different from vendor in three ways

Same architecture, same repo, same DB, same agentic loop. But:

1. **No terminal reply tool.** Vendor side uses `respond_to_vendor` as a terminal tool because routing logic needs an explicit "now reply to the human" step. Bride agent doesn't have routing complexity — the final assistant text message IS the reply. No respond_to_bride tool. No first-question-post-processing strip.

2. **Voice is different.** Vendor agent is brusque, transactional, "Got it — [details]. [Single question]?" Bride agent is informal, BFF-with-wit, allows breath, validates her direction on taste/aesthetic/vision while gently flagging significant financial or interpersonal moves once. See `src/agent/brideSystemPrompt.js`.

3. **Three-tier model routing.** Vendor side uses Haiku + Sonnet. Bride side adds Gemini Flash-Lite (already wired in `src/lib/groundedSearch.js` from Session 8.2) for grounded factual retrieval. Gemini retrieves; Haiku composes the reply in BFF voice. Three models, one voice.

## Naming convention — important

- **Data layer** (tables, IDs, URLs that expose data): `couples`, `couple_id`, `couple_state`, `couple_invites`, `/admin/couples/*`
- **Product layer** (entry points, agent modules, user-facing strings): `bride*`, "Hi Priya — welcome", `brideIndex.js`, `brideSystemPrompt.js`
- **External marketing** (domain, PWA): "The Dream Wedding," "for brides," `thedreamwedding.in`

Three layers, three vocabularies, each internally consistent.

## Frontend in B-sessions: NONE

B1-B4 ship backend + admin only. No bride-facing PWA work during B-sessions beyond the existing tdw-2 public landing (which is already live). The full authenticated bride PWA ships at Sessions 11-12, alongside the vendor PWA at thedreamai.in. One coordinated frontend session, not piecemeal.

## Session 9 — convergence

At end of B4, the bride track is at parity with vendor track. Session 9 is convergence:
- Consolidate docs: `HANDOVER_BRIDE.md` folds into `HANDOVER.md`. `ROADMAP_BRIDE.md` folds into `ROADMAP.md`. Single docs from then on.
- Discover backend goes live (vendor profiles surfaced to brides with couple_id + Muse context)
- Silent wa.me onboarding lights up (bride lands on +91 with TDW code → couples row created → bride product nudge appears in conversation after 3+ exchanges)
- Sonnet routing for couple agent in multi-vendor scenarios
- Resolve user_id / couple_id naming inconsistency inherited from tdw-2

From Session 9 onwards: single vendor-and-bride codebase, single doc set, parallel-track development.
