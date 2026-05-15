# dream-os — Bride Session Handover
**Last updated:** 2026-05-15
**Session:** Pre-B1 (not yet started)
**Status:** Awaiting B1 kickoff. Architecture locked, no code shipped.

---

## What's shipped on the bride side

Nothing yet. The bride track has not started. This document will be fully rewritten at the end of B1.

---

## Architecture locked (read these instead)

- `docs/ROADMAP_BRIDE.md` — full bride architecture and B1-B4 specs
- `docs/B1_SPEC.md` — detailed spec for the next session (B1)
- `docs/SCHEMA.md` — current DB state (vendor side only at present; bride tables arrive at B1)
- `docs/HANDOVER.md` — vendor-side state, frozen at 8.5a (do not update during B-sessions)
- `docs/PROJECT_PROMPT_ADDITION.md` — pasted into claude.ai project instructions; explains the vendor pause / bride priority

---

## First thing next session (B1)

1. Clone repo fresh: `git clone https://github.com/devjroy-dev/dream-os.git dream-os-fresh`
2. Read this file (you're here)
3. Read `docs/ROADMAP_BRIDE.md` — architecture
4. Read `docs/B1_SPEC.md` — what to build
5. Read `docs/SCHEMA.md` — current DB state
6. Optionally: skim `docs/HANDOVER.md` for vendor-side context (frozen)
7. Report to founder:
   - "B1 not yet started. Reading B1_SPEC.md."
   - Goal of B1: bride agent + couple_invites + admin couples pages
   - First action: migration 0013
   - Risks: webhook flip for +14787788550 (currently routes to dream-wedding tdw-2 backend; must be repointed to dream-os Railway service "dream-wedding")
8. **Wait for founder confirmation before touching code.**

---

## Document discipline reminder

At end of B1, this file gets fully rewritten with what shipped, what's broken, what's deferred.

SCHEMA.md gets the new tables added (couple_invites, couple_state, updates to couples).

ROADMAP_BRIDE.md gets B1 marked done. ROADMAP.md may get a note about Session 6.5 completion + any vendor fires that surfaced.

`HANDOVER.md` is NOT touched during B-sessions. It is frozen at 8.5a state.

Session not complete until all four updated docs are committed and pushed.

---

## Number routing reference

- +14787788550 → bride agent (this product). Webhook target: dream-os Railway service "dream-wedding" → `src/brideIndex.js` (at B1)
- +91 7982159047 → vendor agent. Webhook target: dream-os Railway service "dream-os" → `src/index.js` (current)

Both numbers share WABA 1299109268220358 (The Dream Wedding). All Meta approvals transfer.

---

## Test bride creation (for B1 smoke testing)

Once B1 ships:
1. In `/admin/couples/invites`, generate a token: bride_name = "Test Bride"
2. Copy the returned wa.me link
3. Tap from a phone that hasn't messaged +14787788550 before
4. Confirm: token validated, couples row created, BFF-voice greeting received

Test phones to use for B1 smoke testing:
- Dev's phone: +918757788550
- Swati's phone: (to be added when testing begins)
