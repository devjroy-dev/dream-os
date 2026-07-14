# BRIDE_AUDIT — The Complete Bride-Side Ground Truth (pre-spec audit, 2026-07-14)
**Purpose:** the verified foundation for TDW_14/15/16 so no executor session audits, discovers, or improvises mid-build. Every claim below was read from live code this session. Where something could NOT be verified from a clone, it is marked ⚠ VERIFY-AT-BUILD with the exact check to run.

---

## 1. BACKEND — couple API inventory (`src/api/couple/`, all routes confirmed mounted under `/api/v2/couple` unless noted)
| File | ln | Routes | State |
|---|---|---|---|
| auth.js | 477 | send-otp, verify-otp, set-pin, pin-login, forgot-pin, provision | Full OTP+PIN auth, provision path (the mint/claim analog) |
| bookings.js | 228 | list/create, get, PATCH, /payment, DELETE | Couple's committed-vendor ledger incl. payments; `contact_phone` (0060) powers WA+Call buttons |
| chat.js | 275 | POST / | The PWA bride chat door → brideEngine |
| circle.js | 309 | POST /invite, PATCH+DELETE /member/:id, GET /:coupleId | Bride-side circle management; invite = RPC `invite_circle_member` (3-member cap, role enum) + best-effort phone save + recipient-addressed wa.me carrying the web join URL |
| concierge.js | 112 | POST /request, GET /requests | Couture concierge requests |
| discover.js | 249 | /feed (real+demo two-branch), /featured, /heroes | REAL feed exists (07 re-points the canvas; ONE `demo/discover` call remains in the canvas — confirmed single occurrence) |
| enquire.js | 129 | POST / | Discover enquiry write (couple_enquiries 0062) — ⚠ VERIFY-AT-BUILD: whether it also lands a vendor-side lead or only the couple ledger (07 P5's exact wiring gap) |
| enquiries.js | 43 | GET / | The bride's enquiry ledger reads |
| events.js | 198 | list/create, get, /state, DELETE | Bride events (shared `events` table, XOR vendor/couple) |
| expenses.js | 80 | list/create | Bride expenses — ⚠ VERIFY-AT-BUILD: which table (shared `expenses` XOR vs couple-specific) before 15 touches it |
| me.js | 114 | GET/PATCH /:coupleId, POST / | Profile incl. `functions` shape (wedding functions list) |
| meridian.js | 204 | POST /chat | A SECOND, separate chat door (the Meridian room's own conversational surface) — distinct engine path from chat.js; ⚠ map its prompt/engine at 15 |
| moments.js | 42 | GET /:coupleId | Moments reads (muse_saves where surface='moments', 0059) |
| muse.js | 452 | /save, /upload, /add-url, /caption, saves/:id/activity, GET, DELETE | The largest couple router: full muse board incl. Cloudinary upload + URL scrape + captions + per-save activity |
| onboarding.js | 53 | POST / | PWA onboarding submit |
| pages.js | 147 | GET/POST, /preview, /:entryId | `bride_pages` — the journal/diary surface |
| profile.js | 53 | GET /:brideId | Public-ish bride profile read (circle feed uses brideId) |
| quiz.js | 136 | /images, /done | Taste quiz (admin-fed images) |
| receipts.js | 93 | GET, POST, DELETE | Receipt ledger (couple_receipts) — the Vision OCR classify path feeds it (surface routing per 0059 classifier: muse/receipt/moment) |
| taste.js | 139 | GET /, /profile, /surprise | Aesthetic profile + Surprise Me backend |
| today.js | 105 | GET /:coupleId | The bride's today snapshot |

## 2. BACKEND — circle/coplanner API (SEPARATE router family — fully built, 8 files, mounts confirmed at router.js:64–74)
| Mount | File | Purpose |
|---|---|---|
| /auth/verify-pin (public) | circle/verifyPin.js | Member PIN check |
| /circle/join (public) | circle/join.js | validate → send-otp → set-pin → accept (token-scoped; OTP purpose `circle_join`, 0061) |
| /circle/session (public) | circle/session.js | Member session establishment |
| /frost/circle/feed | circle/feed.js | The member's home feed (brideId-scoped) |
| /frost/circle/threads + /messages | threads.js, messages.js | Thread list + messages — NOTE at mount: "no per-user auth" on messages ⚠ 14 must add member scoping (security gap, recorded) |
| /circle/muse | circle/muse.js | Member muse reads + `/save` exists — member PIN mechanic partially built |
| /dreamai | circle/dreamai.js | circle-member-chat + history (the member's own AI in coplanner) |

**FE↔BE wiring: CLEAN.** Every frost/coplanner call resolves to a mounted route (30 distinct paths cross-checked). The invite bug is therefore a NARROW defect in the working chain (candidates, in likelihood order: join-URL host/path construction in circle.js's link builder · token/RPC field mismatch between the pending row and join/validate · OTP purpose gate · session cookie scope on the coplanner host) — NOT missing infrastructure. TDW_14 P1 instruments all six links and fixes the one that lies.

## 3. ENGINES (src/agent/, bride family — 4,420 ln total)
| File | ln | Truth |
|---|---|---|
| brideEngine.js | 2,184 | The WA bride agent: session-bounded history, classifier (complexity), agentic loop, 25 tools. Model: haiku (facade migration = 05 P5 scope, prompts untouched) |
| brideSystemPrompt.js | 271 | Strong core ("best friend with perfect memory and a hint of wit") + forbidden-phrase armor → 06 P6 affirmative rewrite (already spec'd) |
| brideTools.js | 586 | 25 tools verified: add/update/delete_event, add/update/delete_booking + record_payment, create/update/complete/delete_task, save/delete_receipt + list, list/delete_muse_save, save_wedding_detail, note_to_self, read_pages, invite_to_circle, list_circle, list_events/bookings/tasks/receipts, factual_search (roadmap item DONE — recorded) |
| brideOnboarding.js | 618 | WA onboarding flow (state machine) |
| brideNudge.js | 131 | **EXISTS** — bride-side nudge machinery already built. ⚠ CORRECTION to TDW_05 P4: verify what it sends/when before building the "morning nudge bride" — 05's executor EXTENDS this, never duplicates. (Vendor-side `list_dues` gap stands as spec'd.) |
| briefing.js | 192 | A briefing generator (⚠ map its consumer at 05/15 — likely the nudge or today content) |
| brideAesthetics.js | 126 | Taste/aesthetic vocabulary for the quiz/surprise path |
| circleEngine.js | 199 | Member WA agentic turn (phone matched to active circle_member) |
| circleSystemPrompt.js | 113 | Member agent voice — 06-style doctrine pass PENDING (add to 14 or 15 scope) |

## 4. SCHEMA — couple/circle table map (from SCHEMA.md, applied ladder through 0071)
`couples` · `couple_state` · `couple_tasks` · `couple_bookings` (+contact_phone 0060) · `couple_receipts` · `couple_enquiries` (0062) · `muse_saves` (+surface muse/moments 0059) · `bride_pages` · `circle_members` (cap-3 RPC, roles, invitee_phone, token) · `circle_activity` · `circle_sessions` · quiz/taste tables (admin `taste_quiz_images` live) · shared `events` XOR · otp_sessions purposes: login/reset/demo_enquiry/circle_join/(demo_claim arrives 0082).

## 5. FRONTEND — frost + member surfaces
- Canvas (6,473 ln): sanctuary 4,136 (conductor+12 blooms — extraction = TDW_13) · discover 887 (07 owns; one demo-endpoint call to re-point) · muse 544 · dream 375 · onboarding 233 · surprise 181 · journey 117 (accordion shell).
- Blooms confirmed in sanctuary: vendors, circle, events, meridian, moments, people, settings (+expenses/reminders/notes family — exact twelve enumerated in TDW_13 P2/P3's FROST_BLOOMS.md deliverable).
- Sanctuary data access: CLEAN — all through lib/frost-api (couple.ts, discover.ts, muse.ts, vendor.ts, _base.ts); zero inline fetches found.
- Coplanner: layout + TabBar + CircleSessionContext + 4 tabs (threads, dreamai, muse, settings) — a real product, dark to the world only because the invite chain lies.
- Circle join: `app/circle/join/[token]` — full validate→OTP→set-pin→accept flow wired to the join router.
- Themes: blue-white + red live OUTSIDE sanctuary (globals/hook level) — 13 P1 maps and formalizes as `frost`/`dark`.

## 6. KNOWN DEFECTS + GAPS (the honest list feeding 14/15/16)
1. **Circle invite chain** — one narrow break in a fully-built chain (see §2 diagnosis). 14 P1.
2. **Messages route lacks per-member auth** (mount comment admits it). 14 hardening, non-negotiable.
3. **Discover canvas** still holds one `demo/discover` call — 07 P1 scope, confirmed single.
4. **Enquire → vendor lead** landing unverified — 07 P5's named verification.
5. **Surprise Me**: page (181 ln) + taste/surprise backend exist; the Gemini-path redefinition from the roadmap remains undone — 15 decision point (keep/redefine).
6. **Receipt/Vision** bride-side never phone-certified — rides 05 P6's certification.
7. **circleSystemPrompt** pre-doctrine (negative-style constraints) — soul pass unassigned: assign in 14.
8. **brideNudge/briefing** exist — 05 P4's bride-nudge line must be reconciled against them (extend, not duplicate).
9. **Meridian** = an independent chat surface with its own door — engine/prompt unmapped; 15 must map before touching.
10. Bride cost meter: no per-turn INR logging on bride surfaces (02 scoped vendor-only) — add at 15/16 for unit economics.

## 7. CORRECTIONS TO PRIOR SESSION ASSUMPTIONS (drift prevented)
- "Frost discover runs on demo data" → PARTIALLY STALE: the real feed exists and lib/frost-api/discover.ts targets it; exactly one canvas call remains on the demo endpoint.
- "Morning nudge never built" → vendor-side true (list_dues absent); bride-side FALSE — brideNudge.js + briefing.js exist.
- "Coplanner half-exists" → UNDERSTATED: an eight-router backend + four-tab member app exist end-to-end; only the invite chain and auth hardening stand between it and life.
- "factual_search wired but not connected" (old roadmap) → DONE, present in brideTools.

## 8. SPEC-READINESS VERDICT
14 (Circle+Coplanner), 15 (Rooms/parity), 16 (Marketplace bridge) can now be written to the callmeZ bar without build-time archaeology. The ⚠ VERIFY-AT-BUILD items above are each a named one-grep check, not an investigation. TDW_13's P6 parity matrix remains the one prerequisite document 15 consumes.
