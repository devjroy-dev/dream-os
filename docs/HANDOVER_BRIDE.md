# HANDOVER_BRIDE.md — dream-os bride product

**Session:** B2 — Muse + Circle
**Status:** ✅ COMPLETE (pending smoke test of circle flow in B3.1)
**Date closed:** 2026-05-16
**Bride product version:** 0.8.5a.2-b2
**Vendor product version (frozen):** 0.8.5a
**HEAD at B2 close:** acb4828

This is the first thing the next bride-session Claude reads. Read it top to bottom before touching any code. Then read ROADMAP_BRIDE.md and SCHEMA.md.

---

## What B2 shipped

Full Muse vertical + Circle infrastructure, running live in production:

- Bride forwards any image, Pinterest pin, or Instagram URL to +14787788550
- Google Cloud Vision API tags the image with aesthetic labels
- Haiku picks from the locked 12-value taxonomy and stores tags in muse_saves
- Cloudinary mirrors the image (own CDN, not Twilio's media URL)
- Agent replies in BFF voice acknowledging the save
- Bride can list saves, filter by tag, and ask for image playback
- Bride can add people to her Circle via natural language ("add Mom")
- Circle member gets a wa.me invite link, claims it with a CIRCLE-XXXXXX token
- Circle member can forward images, links, and text notes to the bride's board
- Circle member messages are session-batched (10-min idle = session ends)
- When bride next messages, she gets a Haiku-composed BFF-voice summary of what her circle did
- Admin: Delete button on vendor list and couple list (irreversible, cascade deletes)

All verified in production. Muse pipeline end-to-end smoke-tested. Circle code shipped and audit-fixed; circle smoke test deferred to B3.1 (see below).

---

## B2 commit history

| Commit | Description |
|---|---|
| 8c1346b | B2: migration 0016 — muse_saves, circle_members, circle_activity |
| 20d3233 | B2 step 3: image pipeline (Cloudinary + Vision + Haiku tagging) |
| 9f2c831 | B2 step 4: Muse tools + media auto-save + image playback |
| b0d6f45 | B2 step 4.1: audit fixes (race retry, jsonb filter, regex, log clarity) |
| 52ea09b | B2 step 4.2: Twilio webhook signature verification (audit #1) |
| f62dea6 | B2 step 4.2: Cloudinary MIME format hint (audit #9) |
| 0c537b3 | B2 step 4.2: trust proxy for Railway TLS termination (audit #1 follow-up) |
| d5cec24 | B2 step 4.2: external API timeouts (audit #11) |
| b37607d | B2 step 4.2: tighten Pinterest TLD regex (audit #13) |
| 5920493 | B2 step 5+6: circle invites + member loop + session-based summaries (migration 0017) |
| 11955a2 | admin: delete button for vendors and couples |
| acb4828 | B2 audit fixes: H1 H2 M1 M3 M4 M6 L1 L3 L4 L7 I1 I3 |

---

## What shipped in B2 — file inventory

### Schema migrations

| Migration | What it added |
|---|---|
| **0016_muse_and_circle.sql** | `muse_saves` table, `circle_members` table, `circle_activity` table, `conversations.kind` widened to include `circle_thread`, `invite_circle_member()` Postgres function (token generation, 3-member cap), `claim_circle_invite()` Postgres function (token claim, status flip, joined activity row) |
| **0017_circle_sessions.sql** | `circle_sessions` table (session-batching of circle member activity, 10-min idle boundary), `circle_activity.session_id` FK column + index |

### New code files

| File | Lines | What it does |
|---|---|---|
| `src/lib/imagePipeline.js` | ~250 | Cloudinary upload (buffer + URL paths), Google Vision LABEL_DETECTION + IMAGE_PROPERTIES, Haiku aesthetic tagging against 12-value taxonomy, og:image scraping for Pinterest/IG links |
| `src/lib/museSave.js` | 240 | Atomic Muse save: pipeline → save_number → muse_saves insert (with 3-retry race protection) → circle_activity insert. Accepts `actor_name` from caller (no DB lookup). Accepts `session_id` for session linkage. |
| `src/agent/brideAesthetics.js` | ~40 | 12-value locked taxonomy: moody, editorial, pastel, OTT, minimal, candid, grand, rustic, modern, ethnic, elegant, old money |
| `src/agent/circleSystemPrompt.js` | 111 | Deferential-warm voice for circle members. `buildDynamicCircleContext({circleMember, brideName, imageSavesToday})`. `DAILY_CAP_IMAGES=5` (single source of truth — imported by brideIndex.js). |
| `src/agent/circleEngine.js` | 143 | `runCircleAgenticTurn` — Haiku-only, no tools, no loop, single LLM call, 200 max tokens. Mirrors brideEngine shape for parity. |

### Modified code files

| File | Key changes |
|---|---|
| `src/agent/brideTools.js` | Added: `list_muse` (with `session_id` optional param), `delete_muse_save`, `invite_to_circle`, `list_circle`. Updated: `note_to_self` description adds "call only ONCE per turn" |
| `src/agent/brideEngine.js` | Added: `execListMuse` (session_id branch, UUID validation), `execDeleteMuseSave`, `execInviteToCircle`, `execListCircle`, `surfacePendingCircleSessions`, `summarizeOneSession`. Added: `SESSION_IDLE_MS` constant. Modified: pre-turn session surfacing injected into dynamicContext when no mediaContext. |
| `src/brideIndex.js` | Added: circle member routing (BEFORE token regex — M1 fix), token claim path (CIRCLE_TOKEN_REGEX), `handleCircleMemberMessage` (daily cap, session open/bump, media save, text-note capture, circle agent call). Added: `DAILY_CIRCLE_IMAGE_CAP` (imported from circleSystemPrompt — single source). |
| `src/lib/museSave.js` | Added: `actor_name` optional param (eliminates 2-query DB lookup), `session_id` optional param (threaded onto circle_activity row). |
| `src/admin/router.js` | Added: `POST /vendors/:id/delete`, `POST /couples/:id/delete` (both cascade-delete via users row) |
| `src/admin/views/vendors.js` | Added: Delete button per vendor row (red, confirm dialog) |
| `src/admin/views/couples.js` | Added: Delete button per couple row (red, confirm dialog) |

---

## Infrastructure added in B2

- **Google Cloud Vision API** — enabled on project `dream-os` (`gen-lang-client-0017514064`) on `dev@thedreamwedding.in`. Billing upgraded from Free Trial to Paid account (16 May 2026). $300 credit still attached. Vision API key stored as `GOOGLE_VISION_API_KEY` in Railway dream-wedding env vars.
- **Cloudinary** — `dccso5ljv` cloud. Used for Muse image mirroring. Free tier: 25GB storage, 25GB bandwidth. Env var: `CLOUDINARY_URL` in Railway dream-wedding service.
- **Twilio webhook signature verification** — `twilio.validateRequest()` in both `src/index.js` and `src/brideIndex.js`. `app.set('trust proxy', true)` for Railway TLS termination. Escape hatch: `DISABLE_TWILIO_SIGNATURE_CHECK=true` env var (logs warning at startup if set).

---

## Production verification (Muse vertical — fully tested)

Test couple: `7abccc1b-0698-43ba-9709-c6a1e52af789` (Swati Couple Test)
Test phone: `+919888294440`

| Test | Result |
|---|---|
| Image save (lehenga JPEG from gallery) | ✓ save #1, tags: editorial, moody |
| list_muse + image playback | ✓ agent asked "want me to pull it up?", sent image on confirm |
| IG link save (own post, dog selfie) | ✓ save #2, og:image scrape worked, tags: candid, intimate |
| Pinterest link (pin.it short URL) | ✓ save #3, tags: old money, elegant, tightened TLD regex passed |
| Preference note capture | ✓ agent called note_to_self silently on "soft colors for morning wear" |
| Twilio signature verification | ✓ verified on real production traffic post-deployment |
| Cost tracking | ✓ Rs 0.1 per turn (Haiku), Rs 1.50 total per image save end-to-end |

---

## Circle smoke test — deferred to B3.1

Circle code shipped and CC-audited (12 findings fixed). **Full smoke test deferred to B3.1** — requires two phones and cannot be shortened. B3.1 is a dedicated bug-fix + smoke test session.

**B3.1 scope:**
- End-to-end circle smoke test (invite → claim → Mom sends image → session closes → bride gets summary → "yeah" → images back)
- All B3 tool smoke tests (tasks, receipts, events, morning nudge)
- CC audit findings deferred from B2: M2, M5, L2, L5, L6, L8, L9, I4 (hard cap on text notes)
- Admin delete button password confirmation (currently one-click — security gap)
- Pending token expiry (tokens currently never expire — add 7-day expiry as a small migration)

---

## Three-tier model routing — current actual state

The "three-tier" architecture (Haiku + Sonnet + Gemini) is the **intent**, not the current state:

- **Haiku** — active, doing all the work. Every bride turn in B2 ran on Haiku.
- **Sonnet** — wired, but the classifier (vendor-trained) never promoted a bride message to COMPLEX in any B2 test. Effectively inactive. Will activate when classifier is tuned in B4.1b.
- **Gemini Flash-Lite** — wired in `src/lib/groundedSearch.js` (vendor Session 8.2). No bride code path calls it yet. First bride-side use at B4.1a when `factual_search` tool is added.

---

## Audit findings status

B2 Step 5+6 was CC-audited. Full findings and disposition:

**Fixed in B2 (acb4828):** H1, H2, M1, M3, M4, M6, L1, L3, L4, L7, I1, I3

**Deferred to B3.1:**
- M2: Duplicate session creation race (unique partial index fix)
- M5: Brittle string-contains for cap-reached error (use SQLSTATE instead)
- L2: image_playback_queued cumulative across tool calls
- L4 (circleEngine): already fixed in acb4828
- L5: Index missing partial filter on summarized_to_bride
- L6: summary_message_id has no FK constraint
- L8: profileName not truncated — fixed in acb4828 (part of H1 fix)
- L9: Inbound message not logged early enough in handleCircleMemberMessage
- I4: No hard cap on text-only circle messages (deferred by design, now flagged as B3.1)

**Deferred from earlier audit (Step 4):**
- #2: Webhook sync timeout — vendor empirical evidence shows no incidents. Monitor.
- #12: History dedup content comparison — benign in practice.
- #14: Vision API key in URL — Google's documented pattern. Rotate every 90 days.

---

## Known behaviors and quirks

1. **Agent asks permission before playback** — when bride asks "show my last muse", agent frequently asks "want me to pull it up?" before sending. Emergent from tool description. Acceptable. To remove: tighten `list_muse` tool description with "set request_image_playback=true when bride asks to see an image without qualification".

2. **Agent double-calls note_to_self** — observed once (two identical note rows 16 seconds apart). Add "call only ONCE per turn" to note_to_self description if it recurs.

3. **Session_id extracted via LLM parsing** — the session_id UUID is embedded in the system note as `[session_id: uuid]` text. Haiku reads it and passes it back in list_muse. UUID validation added (I3 fix) so a malformed value returns a clear error. Still a soft dependency on Haiku reading the marker correctly.

4. **Gemini Flash-Lite not called** — groundedSearch.js exists but no bride tool calls it. B4.1a adds it.

5. **Bride classifier is vendor-trained** — classifier.js system prompt describes vendor COMPLEX patterns. Bride complex patterns (family conflict, taste arbitration, multi-vendor decisions) are under-promoted to Sonnet. B4.1b tuning after 4 weeks of founding-cohort data.

6. **Google Cloud billing** — account upgraded from Free Trial to Paid on 2026-05-16. $300 credit remains. Vision API costs ~Rs 0.25 per image. Rotate `GOOGLE_VISION_API_KEY` every 90 days.

7. **Vendor Vision API stranded** — `devjroy@gmail.com`'s `thedreamwedding-493105` project has Vision API enabled but unused. Disable at Session 9 cleanup.

8. **PWA link in circle summaries is dead** — `thedreamwedding.in/muse` appears in circle session summaries alongside "or should I just send them here?" — the link is intentionally planted (muscle memory for when PWA ships at Sessions 11-12). Not a bug.

---

## Cost reference

| Event | Cost |
|---|---|
| Image save end-to-end (Twilio in + Cloudinary + Vision + Haiku tag + agent reply + Twilio out) | ~Rs 1.50 |
| PWA bulk upload (Vision + Haiku only, no Twilio) | ~Rs 0.42 |
| Circle session summary composition (one Haiku call) | ~Rs 0.10-0.15 |
| Agent conversation turn (Haiku) | ~Rs 0.10 |
| Active bride per month (~30 saves + 50 turns) | ~Rs 60 |
| Founding cohort (50 brides) | ~Rs 3,000/month |

**Policy: no rate-limiting through soft launch. Calibrate caps after observing first 10 founding-cohort brides.**

**Post-Sessions 11-12 PWA:** add one-time nudge toward PWA bulk upload after 3 saves in 24 hours. Track via `couples.nudge_pwa_sent_at`. WhatsApp save path stays free and functional — nudge is a convenience suggestion, not a paywall.

---

## Vendor parity issues discovered (cumulative — carry forward to B4)

This section is cumulative. B1 items carried forward.

### From B1

1. **Pronouns on vendors not implemented.** Effort: ~20 min.
2. **Admin invite form lacks E.164 phone validation.** Effort: ~10 min.
3. **Package.json versioning scheme.** Effort: ~5 min decision.

### From B2

4. **Admin delete button has no password confirmation.** One-click delete currently. Security gap for a destructive irreversible action. Fix: second POST route validates ADMIN_PASSWORD env var before executing delete. Effort: ~15 min. Scheduled for B3.1.

5. **Pending circle invite tokens never expire.** No expiry on `circle_members` rows in `status=pending`. A generated-but-unsent invite token occupies one of the 3-member cap slots indefinitely. Fix: 7-day expiry via a small migration + derived check in `invite_circle_member()`. Scheduled for B3.1.

---

## B3.1 — Bug fix + smoke test session (before B3 ships)

**Prerequisite for B3:** B3.1 must close before B3 starts.

**Scope:**
- End-to-end circle smoke test (full 5-step flow with two phones)
- All B3 tools smoke test
- CC audit findings: M2, M5, L2, L5, L6, L9
- I4: Hard cap on text-only circle messages (currently unlimited — flagged by CC)
- Admin delete password confirmation
- Pending token 7-day expiry (small migration — 0018)

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
| HEAD at B2 close | acb4828 |
| Test bride couple_id | 7abccc1b-0698-43ba-9709-c6a1e52af789 |
| Test bride phone | +919888294440 |
| Test bride conversation_id | c2740497-6f40-4469-8bc1-8d66c9bda7bd |

---

## What B3 should NOT do

- Don't circle smoke test — that's B3.1's job
- Don't touch `src/index.js`, `src/agent/engine.js`, `src/agent/tools.js`, `src/agent/systemPrompt.js` — vendor side, frozen
- Don't modify the three locked architectural differences (no terminal reply tool, no question strip, phone-as-gate routing)
- Don't activate Gemini or tune the classifier — those are B4.1a and B4.1b respectively
- Don't add reactions or comments to Circle — B2 shipped forward-only. Reactions are locked for a later session.

---

## What's next

- **B3.1** — Bug fix + circle smoke test (see scope above)
- **B3** — Planner: tasks, receipts, events, morning nudge
- **B4.1a** — Gemini grounded search activation (~90 min, ships independently)
- **B4.1b** — Bride classifier tuning (~45-60 min, ships after 4 weeks of founding-cohort data)
- **B4** — Vendor connections + Surprise Me + silent onboarding
- **Session 9** — Convergence + Discover
