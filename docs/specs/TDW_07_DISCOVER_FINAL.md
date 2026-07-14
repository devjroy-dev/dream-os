# TDW_07_DISCOVER_FINAL — The Shopping Floor: Real Supply, Profile Studio, and the Editorial Feed
**Block:** 07 · **Repos:** dream-os + dreamos-pwa · **Depends on:** TDW_04 (availability from events), TDW_05 (sendWa + template registry), TDW_06 (hot-lead brief, Manual honesty law)
**Hands to:** TDW_08 (claim-flow UX, demo administration — the relay's landing side)
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify before any edit)
| File | Verifying |
|---|---|
| `src/api/couple/discover.js` | `/feed` two-branch query (real `discover_eligible` + demo), filters, pagination — the re-point target |
| `app/(frost)/frost/canvas/discover/page.tsx` | Current `/api/v2/demo/discover` calls being re-pointed; the gesture mechanics that MUST survive untouched |
| `src/api/couple/enquire.js` + `enquiries.js` + migration 0062 | couple_enquiries shape; where the lead lands vendor-side; the demo-vendor branch (or its absence) |
| `src/api/vendor/discover.js`, `portfolio.js`, `heroes` | request/withdraw, portfolio write path, THE PHOTO CAP location (FE or BE — find the literal) |
| `src/api/admin/{discover,spotlight,featured,vendorPortfolio}.js` | Approval flow, spotlight score storage, featured slots |
| SCHEMA §vendors | `instagram_handle` (0005), `discover_eligible`, `rate_min`, `aesthetic_tags`, `routing_handle` |
| demo vendor tables (0056–0058 rebuild) | Demo card fields incl. IG-sourced photos; phone field for the relay |
| `src/lib/templates.js` + docs/TEMPLATES.md (05) | Registry the new template joins |
| `lib/frost-api/*` (dreamos-pwa) | Frost's typed clients for feed/enquire |
| Frost design tokens in the canvas pages | Card grammar to extend, not replace |

## 1. LOCKED FOUNDER DECISIONS (this block)
| # | Ruling |
|---|---|
| D-1 | Rate-display toggle (vendor chooses to show/hide starting price) + pause-profile (hidden from feed, approval retained) — both live |
| D-2 | Photos: max **20**, minimum **6 for discover approval**, optional per-photo captions |
| D-3 | IG handle chip on the **card** (and detail) — `instagram://user?username=` deep link, https fallback, new tab |
| D-4 | OpenWA adopted as **staging QA rig only** (test number, soul-bench wired, MCP-driven); production messaging stays Twilio forever |
| D-5 | Ranking = Spotlight + freshness + profile completeness; Featured interleaved and **visibly marked**; weights live in admin_config (hand-tunable) |
| D-6 | Frost shows real + demo vendors mixed, demo unmarked (cold-start by design); enquiry to a demo vendor fires the **demo-lead WhatsApp template** to the unregistered vendor — template authored + submitted sitting one; claim-flow UX belongs to 08 |

## 2. MIGRATION RESERVATIONS (ladder after 06 = next 0081; LD-8)
| # | File | Adds |
|---|---|---|
| 0081 | `0081_profile_controls.sql` | `vendors.rate_display boolean not null default true` · `vendors.discover_paused boolean not null default false` · portfolio photo `caption text` (exact table per verification) · partial index on the feed predicate (`discover_eligible and not discover_paused`) |

admin_config additive keys (no migration if KV): `discover.rank.w_spotlight`, `.w_freshness`, `.w_completeness` (seed 0.5/0.25/0.25) · registry gains template key `demo_lead_alert`.

---

## PHASE TABLE (one phase per sitting)

### P1 — Real supply live + ranking + IG chips
1. **Re-point Frost:** discover canvas fetches `/api/v2/discover/feed` via a typed `lib/frost-api` client; the `/api/v2/demo/discover` endpoint remains ONLY for demo-subdomain surfaces (verify its consumers before touching; report). Gesture mechanics untouched — data source swap only, proven by a before/after interaction video.
2. **Ranking:** feed ORDER = `w_spotlight·spotlight_norm + w_freshness·decay(last_active) + w_completeness·completeness` (completeness per P2's score; all three normalized 0–1; weights from admin_config, 60s cached). Featured rows interleaved at fixed positions (every 6th card), carrying `featured:true` — the card renders a quiet `FEATURED` eyebrow, Jost 9 letterspaced (Manual honesty law: marked, always).
3. **IG chip (D-3):** card + detail render `@{instagram_handle}` when present — glyph + handle, ink-dim; tap → `instagram://user?username=X`, 300ms fallback to `https://instagram.com/X`, new context. Demo vendors: same chip from their IG-sourced handle (it's the truest thing on the card).
4. Feed excludes `discover_paused` (0081 predicate).

### P2 — The Profile Studio (vendor-side control room)
`app/vendor/profile/page.tsx` (new; portfolio page folds in or redirects — executor maps existing routes and preserves deep links):
- **Sections:** Hero image · About (editorial measure, char guidance not limits) · Portfolio (P3's manager) · Aesthetic tags (chip picker from the canonical tag set) · Services list · Travel policy · Starting rate + **show/hide toggle** (D-1) · IG handle (strips @, mirrors 0005 convention) · **Pause profile** switch with plain consequences copy ("Hidden from Discover. Your approval stays. Enquiries already in flight still reach you.")
- **Spotlight meter:** the score as a brass arc + up to three actionable hints, each computed from real gaps ("Add {6−n} more photos" · "Complete your travel policy" · "Your last enquiry sat {n}h — faster replies raise your score"). Hints map 1:1 to sections below — tap scrolls.
- **Completeness score** (single source `src/lib/vendor/profileScore.js`, used by ranking AND the meter): weighted fields (photos≥6 gate, about, tags≥3, rate set, travel, IG, hero). The **min-6 photo approval gate** surfaces here pre-submission ("6 photos required for Discover — you have 4"), and `vendor/discover.js` request route enforces it server-side.
- Every control PATCHes through existing vendor routes (allowlists extended where fields are new — read handlers first, per protocol §6).

### P3 — Twenty photos, silk performance (D-2)
1. Find and raise the cap to 20 wherever it lives (FE constant, BE validation, admin upload path — all three verified). Approval floor 6 enforced (P2).
2. **Cloudinary discipline:** upload preset unchanged; delivery via named transformations — `card` (wـ800, q_auto, f_auto), `thumb` (w_200), `full` (w_1600) — URLs built in one helper (`lib/frost-api/img.ts` + vendor twin). LQIP: 24px blurred placeholder inline (Cloudinary e_blur chain), fading to loaded.
3. Portfolio manager (in the Studio): grid, drag reorder (pointer-based, ports to RN), cover star (first position = card cover), per-photo optional caption (0081), delete with confirm. Upload progress hairlines; failures honest with retry.
4. Frost consumption: card gallery + detail lookbook page through variants lazily — measure: feed scroll jank-free at 20-photo vendors on a mid-range Android (founder smoke includes this).

### P4 — The shared profile + "See how couples see you"
1. Extract the couple-facing profile detail into `components/shared/VendorProfileView.tsx` — ONE component, props-driven (`vendor`, `mode:'live'|'preview'`), no data fetching inside (both mounts pass data). Frost detail renders it live; the vendor app renders it in preview.
2. **The button:** on the Profile Studio and portfolio surfaces — `See your profile as couples do` → full-screen preview mount (Frost's exact tokens; a thin `PREVIEW` ribbon top, ink on cream, dismissible). Preview shows the TRUE state: pause banner if paused, rate hidden if toggled, photos in current order. Parity by construction — any drift is a failed session.
3. Preview reachable pre-approval too ("this is what approval unlocks") — the strongest self-serve motivation to hit the 6-photo floor.

### P5 — The enquiry pipeline, both species (D-6)
1. **Real vendors:** trace enquire → couple_enquiries → `public.leads` (source `discover`) → the 06 hot-lead brief to the vendor. Wire whatever link in that chain is missing (read enquire.js first; the audit suggests the lead-landing step needs verification). The 04 availability hint joins the brief when the enquiry date collides ("she asked for Dec 4 — you're holding a ceremony").
2. **Demo vendors — the free-lead hook:** enquiry to a demo card → stored against the demo vendor → **`demo_lead_alert` template** to the demo vendor's phone via sendWa (marketing line — it's outreach): *"{Name}, a couple just asked about your work for their {month} wedding on The Dream Wedding. Their enquiry is waiting in your ready account: {claim_link}. — TDW"* (final copy authored sitting one with the founder, submitted to Twilio same day; TEMPLATES.md updated). One alert per enquiry; repeat enquiries within 48h batch into one. `prospects` row upserted (05's machine) so the Closer knows this prospect is WARM — state note `demo_lead`.
3. Enquiry sheet (Frost): prefilled from the bride's profile (functions, date, city, budget band) — one tap; expectation line "replies on WhatsApp, usually within a day."
4. Bride-side enquiry states surface in her Journey (sent · replied) — read from existing enquiries routes; deep work stays in the bride blocks.

### P6 — The editorial pass + QA rig + sweep
**Feed cards (Vogue grammar, gestures preserved):** full-bleed cover edge-to-edge · name Cormorant italic over a bottom scrim · category eyebrow Jost letterspaced · city + starting-rate whisper (respecting D-1) · IG chip · FEATURED eyebrow when applicable · in-card horizontal photo paging with hairline dots (couples peek without leaving the stack).
**Detail as lookbook:** full-bleed gallery, about in editorial measure, services, travel line, availability whisper (from events: "December weekends filling"), IG chip, fixed-bottom Enquire — the page's single gold.
**Curation bar:** City · Budget · Vibe as chips opening bottom sheets (vibe = visual tag chips); active filters render as a quiet breadcrumb line.
**Save to Muse:** the heart on cards/detail pins the vendor to her Muse board (muse routes exist — verify the pin shape; smallest wiring).
**Cold-start states:** thin categories render an editorial line ("The {city} list is being curated — meet these artists") over the nearest/demo mix — never an empty grid.
**Skeletons:** LQIP + shimmer; no spinners anywhere on the floor.
**OpenWA QA rig (D-4):** `docs/QA_RIG_OPENWA.md` — docker compose on a test SIM, session setup, webhook → staging, MCP config so a bench session can drive the test phone through golden scenarios; hard header: NEVER attach a production number. No production code touches OpenWA.
Full acceptance sweep.

---

## 3. GUARDRAILS
Frost gesture mechanics byte-identical through P1/P6 (data + skin changes only) · demo cards unmarked by design but their enquiry path NEVER pretends a reply happened — the couple sees "sent," and truthful reply states only · Featured always marked (Manual law) · min-6 gate server-side, not just UI · one gold per screen (Enquire owns detail; cards carry none) · shared VendorProfileView is the only profile renderer — a second implementation anywhere is a failed session · sendWa is the only outbound (05 law); demo alerts respect STOP + the 25/day marketing governance where applicable · no localStorage · IG links never in-app-browser-jacked — system handoff.

## 4. ACCEPTANCE CRITERIA
1. Frost feed serves real+demo mixed with ranking honoring admin weights (flip a weight, order changes next fetch); paused vendor vanishes; approval retained.
2. IG chip on card + detail deep-links to the IG app on a real phone, web fallback verified.
3. 20 photos upload, reorder, cover, caption; 6-photo floor blocks approval request server-side; feed scroll smooth on mid-range Android with 20-photo vendors.
4. Preview button renders pixel-identical output to Frost for the same vendor (screenshot diff), reflecting pause + rate-toggle truthfully.
5. Real enquiry lands as a lead with source discover + brief with availability hint on a date clash; demo enquiry fires exactly one template with a working claim link; 48h batching observed; prospect upserted warm.
6. Enquiry sheet prefills from bride profile; her Journey shows sent/replied truthfully.
7. Muse save round-trips; cold-start category renders the editorial fallback.
8. QA rig doc proven: one bench scenario driven through the test phone end-to-end.
9. `node --check` + tsc both repos clean; 0081 proven; TEMPLATES.md updated with `demo_lead_alert` submission.

## 5. FOUNDER SMOKE (phone)
Swipe the real feed → open a 20-photo lookbook, page the gallery, tap the IG chip → enquire with your test bride → watch the vendor brief arrive → enquire on a demo card from a second number → receive the demo-lead template on that phone → open Profile Studio as the test vendor: hide your rate, pause, hit Preview and see both truths → unpause → drag-reorder photos and watch the card cover change in Frost.

## 6. NATIVE-IMPLICATIONS CLAUSE
VendorProfileView, card grammar, curation bar are presentational over typed clients — RN 1:1. Drag-reorder uses pointer events portable to Gesture Handler. IG deep link identical on native. The rig is infrastructure, not product.

## 7. SESSION BOUNDARIES
Six sittings P1→P6; the `demo_lead_alert` template authoring + Twilio submission happens in sitting one regardless of phase progress (D-6). P4 requires P2's data shape. Handover per protocol; 08 receives: the claim-link contract, the warm-prospect note convention, and the batching rule.
