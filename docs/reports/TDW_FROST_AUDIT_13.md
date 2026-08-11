# repo: dream-os @ b2e1601
# TDW_FROST_AUDIT_13 — Block 13 (FROST FOUNDATION) Ground-Truth Inventory
**Authored by:** FC-1, the First Frost Chair (parallel audit line, R-30.17) · **Date:** 2026-08-12
**Derivation tips (both re-derived at origin by FC-1's own hand, sibling-full workspace):**
dream-os `b2e1601` · dreamos-pwa `7bb6429`
**Method:** every claim below was derived by a command run at these tips, or is marked UNDERIVED. All pwa file:line cites are at `7bb6429`; all dream-os cites at `b2e1601`. Schema claims carry their witness grade: [PUBLIC-0099] = `docs/db/PUBLIC_SCHEMA.md` (snapshot applied-tip 0099, ~19 rungs behind the committed ladder whose highest file is `0118_pending_couple_drafts_refusal_reason.sql`; 0119 next-free) · [LADDER] = derived from `db/migrations/` file contents at tip · [ENGINE-0081+] = `docs/db/ENGINE_SCHEMA.md` (2026-07-24 regen).
**Protocol basis:** §3.5 — no production-touching spec is executable until its ground-truth inventory exists as a prerequisite document. This document is that inventory for `docs/specs/TDW_13_FROST_FOUNDATION_FINAL.md` (97 lines, authored 2026-07-14 — thirty days and roughly ninety chair-tenure entries before this audit).
**Standing caution, per the seat's own charter:** trust evidence over narrative — including this report. Defects herein are PROPOSED, carry no F-numbers, and bank only at CE-30's reconciliation. Nothing herein is a ruling.

---

## §0 — EXECUTIVE SHAPE (one screen)

The spec was written against a tree that no longer exists in four load-bearing ways:

1. **The theme world the spec names (`frost` blue-white default + `dark` red curated, switcher, server persistence) was designed, built differently, and then SINGLE-THEMED by founder ruling (2026-08-07).** The live system is V2 WINE NIGHT (dark, wine-red) + SKY & IVORY (light, slate-blue), pinned Wine-only at five named seats. The light theme is RETIRED-NOT-DELETED. No `couples.theme` column exists on any witness. §3 below.
2. **The Discover room now lives INSIDE the extraction subject.** F-07.43 「 F-D 」 folded the couple Discover surface into sanctuary as a bloom; `/frost/canvas/discover` is a 3-line redirect stub. The spec's guardrail "discover is 07's — untouched here" cannot be executed as written: any P2/P3 surgery on sanctuary necessarily handles Discover's bloom. §2.4, Q-1.
3. **Sanctuary has grown to 4,912 lines (spec: 4,136) and now carries twelve inline blooms, zero extracted.** `components/frost/blooms/` does not exist. The choreography is byte-located below (§2) and is NOT yet under any FROZEN header — that header is P2's own deliverable and its subject bytes are enumerated here so P2 can freeze exactly them. §2.
4. **The splash system's named foundation (`components/AppSplash.tsx`, "03 P6") does not exist under that name and never carried the portfolio carousel.** The real component is `components/vendor/Splash.tsx` — a wordmark hero with an in-file executor note stating the carousel was never built and "the component is the mount point." No bride mount exists anywhere in `app/(frost)`. `landing_slides` has no `audience` column on any witness and `src/api/landing-slides.js` (47 lines) handles none. Migration reservations 0097/0098 are unspent holes on the ladder. §4.

Additionally, a **dead legacy subtree** (`app/(frost)/frost/canvas/journey/` — a hub page + eight room pages ported from tdw-2) has ZERO inbound navigation and sits directly on P2/P3's extraction path as a hazard: an extractor grepping for room code will find two implementations of several rooms, one live inside sanctuary and one dead in this subtree. §5, PROPOSED-13.D.

The spec's brideTools axis is the one row that verified clean: **exactly 25 tools** in `BRIDE_TOOLS`, matching the spec's count. §6.

---

## §1 — SPEC §0 "READ FIRST" TABLE, ROW BY ROW, GRADED

| Spec row (as written 2026-07-14) | Grade at `7bb6429`/`b2e1601` | Evidence |
|---|---|---|
| `app/(frost)/frost/canvas/sanctuary/page.tsx` (4,136 ln) | **DRIFTED (grown)** | `wc -l` = **4,912**. Same path. +776 lines since spec snapshot; the growth is real product (the F-D Discover fold, the F-07.70 token door, the atelier arc's rail retype at :4703–:4708, the F-09.166 Priya cure at :58–:65) |
| Adjacent canvas pages `{muse,dream,journey,surprise,onboarding}/page.tsx` | **SPLIT** | muse 547 ln (live — inbound from surprise:97) · dream 375 ln (**DEAD — zero inbound**, grep across app/lib/components/middleware) · journey 117 ln hub + EIGHT sub-pages (**DEAD — zero inbound**; see §5) · surprise 181 ln (live — sanctuary:2466 `<a href="/frost/canvas/surprise"`) · onboarding 258 ln (live — sanctuary:4244 `window.location.replace('/frost/canvas/onboarding')`) |
| "discover is 07's — untouched here" | **SUPERSEDED** | discover/page.tsx is 39 lines: a documented redirect to sanctuary (F-07.43 「 F-D 」, in-file header :3–:33). The Discover deck lives inside sanctuary as the `discover` bloom |
| The bride theme mechanism ("globals.css frost sections + whatever hook/context") | **LOCATED, and it is not where the spec guessed** | `app/globals.css` frost content = TWO scrollbar-hiding rules only (:224–:225). The mechanism is `lib/frost/tokens.ts` (500 ln) + `app/(frost)/layout.tsx` (82 ln) FrostCtx. Full map §3 |
| `lib/frost-api/*` typed clients | **DRIFTED (split)** | `lib/frost-api/` = `_base.ts`, `couple.ts`, `discover.ts`, `img.ts`, `index.ts`, `muse.ts`. But the bulk of bloom write doors live in **`lib/frost/journey.ts` (638 ln)** — sanctuary:19 imports fetchCircle, inviteCircleMember, removeCircleMember, fetchEvents, fetchReceipts, deleteReceipt, fetchBookings, createBooking, updateBooking, deleteBooking, recordPayment, fetchProfile, saveProfile, fetchEnquiries from it. Any P6 matrix built only from `lib/frost-api/*` under-counts the write doors |
| `src/agent/brideTools.js` (25 tools) | **VERIFIED** | `BRIDE_TOOLS` array :18–:586, exactly 25 `name:` tool declarations (derivation: grep of top-level tool names; the raw `name:` grep returns 32 because seven are parameter-schema fields — the count method matters and is declared) |
| `src/api/landing-slides.js` + admin slides | **EXISTS, audience-less** | 47 lines; `grep -n audience` returns zero matches. `landing_slides` = 8 columns [PUBLIC-0099]: id, image_url, cloudinary_public_id, caption, display_order, active, created_at, updated_at — no audience. [LADDER] corroborates: no migration on the committed ladder touches landing_slides after the snapshot |
| `components/AppSplash.tsx` (03 P6) | **ABSENT under that name** | filesystem find: the only splash component in the repo is `components/vendor/Splash.tsx` (§4) |
| `lib/design/tokens.ts` (09 + Addendum A) | **ABSENT** | path does not exist. Token homes at tip: `lib/frost/tokens.ts` (bride) · `lib/vendor/tokens.ts` + `lib/vendor/theme.ts` (vendor). CE-203's canon ruling ("the tree is the canon; the spec survives as intent") already governs the vendor side of exactly this class of drift |
| `src/api/vendor/portfolio.js` reads | **EXISTS** | 89 lines at the named path |
| `couples` table — theme persistence today | **NO PERSISTENCE** | `public.couples` = 21 columns [PUBLIC-0099], no theme column (full list read; cols 1–21 enumerated at PUBLIC_SCHEMA.md:280–:302). [LADDER] closes the staleness gap for this claim: `grep -rn theme db/migrations/*.sql` returns zero column-adding hits, so no post-0099 migration added one. **Witness grade: [PUBLIC-0099]+[LADDER] combined — the strongest claim available without a founder-run `information_schema` SELECT, which remains the settling witness** |
| `docs/BRIDE_AUDIT.md` (block-14's ground truth, cited by adjacent specs) | **EXISTS, moved** | actual home: `dream-os docs/specs/BRIDE_AUDIT.md` — not `docs/` root. Recorded here because 13's executor will chase the same pointer |
| `docs/FROST_BLOOMS.md` · `docs/BRIDE_PARITY_MATRIX.md` | **ABSENT — correctly** | both are THIS block's deliverables (P3 closeout, P6); their absence is expected state, not a defect |

---

## §2 — THE CHOREOGRAPHY, BYTE-LOCATED (F-1's subject: what P2 must move ONCE, verbatim, and then freeze)

All cites: `app/(frost)/frost/canvas/sanctuary/page.tsx` @ `7bb6429`.

### 2.1 The architecture declaration
`:7–:11` — the in-file constitution: *"V5 BLOOM ARCHITECTURE — Every slice opens IN THIS PAGE. No router.push. No history stack. She taps a slice → it blooms up from position → fills screen. She swipes down or taps ← → contracts back to Sanctuary. Same URL. Same component. Sanctuary is always underneath."*

**One precision the extractor must carry:** the comment's phrase "blooms up from position" is aspirational prose, not the mechanism. The actual open is a **full-screen layer sliding up from the bottom** (`translateY(100%) → 0`), identical regardless of which slice was tapped — no FLIP, no origin-anchored scale. The pre/post recordings P2's acceptance demands will match only if the extractor reproduces what IS, not what the comment says. Grade on the spec's own prose ("blooms up from position"): **DRIFTED-AS-DESCRIPTION, correct-as-behavior-to-preserve.**

### 2.2 The state machine
- `:47` — `RoomKey` type: the twelve-room value space (`'dream'|'circle'|'muse'|'discover'|'people'|'pages'|'moments'|'events'|'meridian'|'expenses'|'vendors'|'settings'|null`).
- `:4120–:4124` — `activeRoom` / `blooming` / `closing` state + `touchStartY` + `bloomRef`.
- `:4434–:4438` — `openRoom(key)`: set room, blooming true, closing false. Synchronous; no measurement of tap origin (corroborates 2.1).
- `:4440–:4447` — `closeRoom()`: `setClosing(true)` then a **300ms** `setTimeout` clears all three — the timeout is hand-synchronized to the `bloomOut` animation duration (2.3). **This 300ms pairing appears at TWO sites** (here and the back-trap :4485–:4489); an extraction that moves one and not the other, or that changes the keyframe duration without both timeouts, breaks the close silently.

### 2.3 The animation bytes (the sacred timings and easings)
- `:179` — `@keyframes bloomIn { from{opacity:0; transform:translateY(100%)} to{opacity:1; transform:translateY(0)} }`
- `:180` — `@keyframes bloomOut` (the inverse).
- `:190` — `.bloom-enter { animation: bloomIn 380ms cubic-bezier(0.22,1,0.36,1) forwards; }`
- `:191` — `.bloom-exit { animation: bloomOut 300ms cubic-bezier(0.4,0,1,1) forwards; }`
- `:189` — `.si-a { animation: sIn 220ms cubic-bezier(0.22,1,0.36,1) forwards; }` — the slice-row entrance, staggered by `animationDelay: idx*16ms` at :4706.
- The two curves are exported constants: `lib/frost/tokens.ts:213` `EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'` · `:214` `EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)'` — but the sanctuary keyframe classes carry the curves as **literals**, not via the constants. An extractor converting literals to the constants during commit (a) would violate the verbatim law; during commit (b) it is a token conversion the spec permits — the fork belongs to the sitting's charter, named here so it is chosen, not stumbled into.
- Ambient sanctuary keyframes that ride the same style block and must travel with the conductor, not with any bloom: `:172–:178, :181–:182` (gnB, numB, dC/dH/dO the candle trio, cF the candle flicker consumed at :4712, dpulse, dcursor).
- Bloom-local keyframes that belong to their rooms: `:1946–:1947` (discHeartPop, discDissolve — Discover's double-tap heart) · `:3793` (concPulse) · `:4801` (an inline re-declaration of dpulse inside the Dream room's JSX — a duplicate the extractor should carry as-is under F-1 and flag, not fix).

### 2.4 The gesture and interruption machinery
- `:4130–:4162` — the pull-to-refresh blocker: touchstart/touchmove listeners on `bloomRef`, walking the target's ancestor chain for scrollable children, `preventDefault` only when pulling down at scroll-top. Passive/non-passive flags at :4156–:4157 are load-bearing.
- `:4471–:4493` — the back-button trap: two sentinel `pushState` entries on mount; `popstate` re-pushes a sentinel AND closes any open room via the same 300ms sequence. The bloom close and the history model are one mechanism here.
- `:4495–:4523` — swipe-down-to-close: thresholds `dy > 120 && dx < 60`, scrollable-ancestor guard (`scrollTop > 4` blocks), and **`:4504` — the Discover exemption**: `if(activeRoom === 'discover') return;` — Discover owns its own swipe gestures (photoPager) and is dismissible only via the top-bar ← or OS back. This single line is where the F-D fold and the choreography interlock; it is the sharpest reason the spec's "discover untouched" guardrail is unexecutable as written (Q-1).
- `:4449–:4464` — the `frost:open-dream` CustomEvent listener: the Events room's "Ask DreamAi" button opens the Dream bloom cross-room with a prefilled prompt. A cross-bloom coupling the per-bloom extraction must route through the conductor.
- `:4568` — `isPhotoRoom = discover||muse||moments`: three rooms share photo-room chrome; a per-room extraction that duplicates this predicate forks it.

### 2.5 The bloom census (P2/P3's twelve, as they exist)
`BASE_SLICES` `:199–:211` — eleven tappable slices in fixed order: **discover, circle (candle:true), muse, people, pages, moments, events (label "The Journey"), expenses, vendors, meridian (premium:true), settings**. The twelfth room, **dream**, mounts from its own bottom-anchor door at `:4722` and via the `frost:open-dream` event. Room bodies render as conditional JSX inside the single bloom layer `:4738+` (`activeRoom==='dream'` :4775 · events :4828 · discover :4836 · muse :4841 · circle :4846 · pages :4854 · people :4862 · moments :4867 · meridian :4872 · …). **Zero blooms are extracted; `components/frost/blooms/` does not exist** (filesystem find). The spec's "suggested first six" (settings, people, reminders/meridian, moments, events, expenses) remains a lawful ordering; tangle-depth note from this read: discover, dream, and circle are the three deepest-coupled rooms (photoPager + shared VendorProfileView; the chat state cluster :4165–:4171; the invite chain), and events carries the cross-bloom event emitter.

### 2.6 Choreography-adjacent state the conductor owns
The atelier arc's rail retype comment at `:4703–:4708` records a REFUSED arm (content-driven heights) with its reason (eleven rows would scroll = behaviour change L4) — a standing constraint on any conductor rewrite. The Fraunces/JetBrains Mono slice typography at :4709–:4711 is the atelier's sealed register, not this block's to move.

---

## §3 — THE THEME/TOKEN GROUND TRUTH vs SPEC F-4 (and the 09 canon)

### 3.1 What the spec assumes
F-4: two bride sets named **`frost`** (blue-and-white) and **`dark`** (red-based curated dark); P1 transcribes both into `lib/design/tokens.ts` beside the vendor sets; P5 lands a settings switcher with `couples.theme` server-persisted; acceptance 3 requires live swap + persistence across re-login and second device.

### 3.2 What exists (all cites `lib/frost/tokens.ts` @ `7bb6429` unless noted)
- The file header `:1–:15` declares the V2 system: **WINE NIGHT** ("dark, intimate, candlelit, #1E0A0E lifted wine-black") and **SKY & IVORY** ("light, airy, #F0EEE8 cool bone") — mode keys `'E1A'` / `'E3'` (`:17`). Full token sets `V2_WINE_NIGHT` :89–:117 and `V2_SKY_IVORY` :119+ over the `V2Tokens` interface :47–:87 (which includes `discoverBg` — "discover always dark, always cinematic, regardless of mode" :83–:84). Legacy `MODES` and `MUSE_LOOKS` families are retained for old surfaces (:11–:14, :220+).
- **THE SINGLE-THEME FOUNDER RULING (2026-08-07, "the chair's own hand"), five pinned seats:**
  1. `getFrostMode()` `:399–:407` — returns `'E1A'` unconditionally; the ruling's text lives here in-comment: *"The bride app carries ONE theme for now: Wine Night. Sky & Ivory is RETIRED-NOT-DELETED… The stored key is deliberately ignored, not migrated."*
  2. `setFrostMode()` `:417–:421` — **a no-op writer**, with its mechanism reason in-comment.
  3. `getV2Tokens()` `:193–:197` — returns `V2_WINE_NIGHT` regardless of argument ("the belt beneath the braces").
  4. `museLookFromHomeMode()` `:346`.
  5. `app/(frost)/layout.tsx:31–:38` — the context default pinned `'E1A'`, carrying **F-09.160**'s finding text (the fifth seat had been left reading `'E3'`, the light theme — "a trap with a fuse in it," pinned not deleted).
- The layout seeds state from the pinned reader SSR-safely (`layout.tsx:56–:57`, curing the one-light-frame flash the founder saw, per its own comment).

### 3.3 The grades
- **Spec F-4's names (`frost`/`dark`): ABSENT.** No token set, type, or key carries those names; the live names are Wine Night/Sky & Ivory over `'E1A'`/`'E3'`. The palette POLARITY is also inverted relative to F-4: F-4's default was the blue-white light world with red-dark as the alternate; the tree's sole live theme is the red-family dark world, with the blue light world retired.
- **Spec P1 ("transcribe both palettes into `lib/design/tokens.ts`"): SUPERSEDED-BY-TREE.** The transcription happened, into a different, richer home. Under CE-203's canon precedent (the tree is the canon; the spec survives as intent), P1 as written would build a duplicate token home — the exact disease the 09 arc spent F-09.77's comparator killing.
- **Spec P5 theme switcher + `couples.theme`: ABSENT and RULING-BLOCKED.** No server column (§1, witnessed), no switcher, and the writer is a deliberate no-op under a founder ruling that post-dates the spec by three weeks. Building P5's switcher as written would UN-PIN a founder ruling from an executor's chair.
- **Acceptance criteria 3 and 6-of-§6 (the two-theme walks): UNEXECUTABLE as written** while the single-theme ruling stands.

### 3.4 The frost hex census against the 09 canon
Instrument declared: `grep -rEo '#[0-9A-Fa-f]{6}\b'` across `app/(frost)` + `components/frost` + `lib/frost`, at `7bb6429`. This is a raw 6-digit-hex floor, the same species as the 09 census's raw-grep floor before its instrument settled (CE-203 recorded ~290 raw vs 269 settled for BRASS); 3/4/8-digit hex, rgba() literals, and named colors are NOT counted. Blind spot named: an instrument-grade census (the 09 comparator's method) is a build deliverable, not this audit's.

- **358 six-digit hex occurrences across 13 files.** Concentration: `sanctuary/page.tsx` **120** · `lib/frost/tokens.ts` **84** (the token home itself — lawful residence) · `muse/page.tsx` 10 · `dream/page.tsx` 7 (dead file) · `onboarding` 5 · the dead journey subtree 11 across five files · `EnquirySheet.tsx` 3 · `surprise` 2 · `frost/page.tsx` 1.
- Top literals map cleanly onto the V2 sets (`#C4856A` ×18, `#F5E5DC` ×16, `#1E0A0E` ×9, `#F0EEE8` ×10, `#6B9E8F` ×9…) plus a cool-light family (`#EEF0F6`, `#E4E8F2`, `#D8DEEC`, `#2A5F82`) concentrated in muse/onboarding — the legacy MUSE_LOOKS world.
- **Reading:** outside the token home, ~274 hex literals sit on frost surfaces, ~120 of them inside the file P2/P3 is about to carve. The spec's own two-commit law (relocate verbatim, THEN convert to tokens) is exactly right for this tree; the census gives commit (b) its worklist and the eventual grep-gate its baseline.
- **The 09-canon seam, named (not ruled):** the vendor lane's canon is `lib/vendor/theme.ts` + `globals.css` + ThemeContext (CE-203 fork (b)); the frost lane runs a disjoint token home. They already share three cross-lane single-homes that sanctuary imports: `pressedStyle` from `lib/vendor/controls` (:25), `formatRs` from `lib/vendor/format` (:38, the estate's one money donor, locked register Rs 1,50,000), and `waNumberFor` from `lib/waNumbers` (:24). Whether block 13 formalizes frost tokens INTO a shared semantic architecture or canonizes the two-home split is a fork for the charter — Q-2 below.

---

## §4 — THE SPLASH SYSTEM GROUND TRUTH vs SPEC F-2/F-3 (P4's subject)

- **`components/AppSplash.tsx`: ABSENT.** The real artifact is `components/vendor/Splash.tsx`, whose own header (:1–:13) states: TDW_04 A4 cold-open hero, sessionStorage latch (`tdw_splash_seen`), 2.2s minimum, tap-skip after minimum, offline-silent — and an **EXECUTOR SIMPLIFICATION logged in-file**: *"the spec's portfolio CAROUSEL needs an asset source… no vendor-shell API guarantees offline. Shipped: the wordmark hero… The carousel slots in the moment a portfolio source is named — the component is the mount point."* So F-3's "vendor sees their own portfolio" has **never been true**; the mount point exists and waits. Mounted at `app/vendor/layout.tsx` only (grep for the import: globals.css, vendor/layout.tsx, the component itself).
- **Bride mount: ABSENT.** `grep -rn Splash 'app/(frost)'` returns zero. No cold-open splash exists on any bride surface.
- **The slides system: single-audience.** `landing_slides` 8 columns, no `audience` [PUBLIC-0099, corroborated by LADDER — no post-snapshot migration touches it]; `src/api/landing-slides.js` 47 lines, zero audience handling. The admin slides surface has no collection tabs to verify against (P4 item 1 is wholly unbuilt).
- **Migration 0097 (`0097_splash_and_bride_theme.sql`): UNSPENT.** [LADDER] `ls db/migrations/` shows 0096 then 0099 — 0097 and 0098 are holes; under LD-8 the reservations stand (0097 this block's, 0098 block-14's). **However:** 0097's reserved contents bundle the `audience` column WITH `couples.theme` — and the theme half is now ruling-blocked (§3.3). The migration as reserved cannot be authored whole without either re-opening the single-theme ruling or splitting the file's contents. Q-3.
- `src/api/vendor/portfolio.js` (89 ln) exists as F-3's read source, unconsumed by any splash.

**Grades:** F-2 **ABSENT (unbuilt, path clear except the migration bundling)**. F-3 **ABSENT-WITH-MOUNT-POINT** (and the TDW_03/TDW_11 dated addenda the spec says "land this sitting" are not in either spec file — grep for "portfolio-first" in TDW_03/TDW_11 rows was not run against those spec files by this audit and is marked UNDERIVED; the masterplan row 03 does carry "+Addendum: portfolio-first vendor splash").

---

## §5 — PROPOSED DEFECTS (no numbers; full evidence; CE-30 banks and numbers)

**PROPOSED-13.A — The dead journey subtree sits on the extraction path.** `app/(frost)/frost/canvas/journey/` = a hub (`page.tsx`, 117 ln, header: "Ported from tdw-2") + eight room pages (circle, events, expenses, moments, people, reminders, settings, vendors). Inbound census at `7bb6429`: **zero** — no router.push, no `<Link>`, no middleware rewrite reaches `/frost/canvas/journey` (grep across app/, lib/, components/, middleware.ts; middleware's frost handling at middleware.ts:18–:19 rewrites host roots to `/frost`, which replaces to sanctuary at `frost/page.tsx:11`). The subtree consumes legacy `MUSE_LOOKS`/`MODES` tokens and carries 11 hex literals. Hazard is concrete for THIS block: P2/P3's extractor searching for room implementations will find, e.g., a dead `journey/circle/page.tsx` (which even links to `/frost/canvas/muse` at :29) beside the live circle bloom inside sanctuary. Cure shape (proposed, not taken): wire-or-delete-at-birth's standing law suggests deletion under its own ruled sitting BEFORE P2 opens, with the `rm -rf .next` tsc gate (protocol §6) applied. Disposition is CE-30's/the founder's.

**PROPOSED-13.B — `canvas/dream/page.tsx` is a second dead sibling of a live bloom.** 375 lines, zero inbound (same census method). Same hazard class as 13.A, single file. The live Dream room is sanctuary's `:4775+` bloom.

**PROPOSED-13.C — The spec document itself is stale in ways that would misdirect a build sitting** (the four §0 headline items plus: the read-first table's `lib/design/tokens.ts` and `AppSplash.tsx` paths resolve to nothing; the P6 matrix's client axis omits `lib/frost/journey.ts`, the majority write-door home). Under §3.5's own procedure the cure is: findings return to the Chief Engineer; **the spec is amended ONCE; then build.** This document is the findings-return leg.

**PROPOSED-13.D — The duplicate `dpulse` keyframe.** `@keyframes dpulse` is declared at sanctuary `:181` and re-declared inline inside the Dream bloom's JSX at `:4801`. Harmless today (identical bytes), but a per-bloom extraction that carries the inline copy into a bloom file while the conductor keeps `:181` mints a silent fork; and one that deletes either during the verbatim commit violates F-1. Named so the extraction charter disposes of it deliberately.

**PROPOSED-13.E — The choreography's 300ms appears as a hand-synchronized magic pair at two timeout sites** (`:4443–:4446`, `:4485–:4489`) against the `:191` keyframe duration, with no shared constant. Not a defect at rest; a break-on-extraction trap. The FROZEN header P2 authors should fence all three sites or the freeze doesn't cover the mechanism.

*(Deliberately NOT proposed as defects: the single-theme pin — a founder ruling working as designed; the F-D fold — ruled at 07; FROST_BLOOMS/PARITY_MATRIX absence — this block's own deliverables; the unspent 0097/0098 holes — lawful under LD-8.)*

---

## §6 — THE PARITY MATRIX'S CURRENT TRUTH (P6's raw material, both axes located)

- **Matrix document: ABSENT (expected — it is P6's deliverable).** No predecessor exists to inherit.
- **WhatsApp axis:** `BRIDE_TOOLS` = 25 tools at `src/agent/brideTools.js:18–:586`, verified by name: note_to_self · save_wedding_detail · add_event · create_task · list_tasks · complete_task · update_task · delete_task · list_events · update_event · delete_event · add_booking · list_bookings · update_booking · delete_booking · record_payment · save_receipt · list_receipts · delete_receipt · list_muse · delete_muse_save · invite_to_circle · factual_search · list_circle · read_pages. Plus WhatsApp-only behaviors the spec names for extra rows (receipt OCR, nudges) — brideEngine.js (2,281 ln) is their home; enumerating them is P6's work, not this audit's.
- **Bloom axis (write doors reachable from sanctuary today):** via `lib/frost/journey.ts` — circle invite/remove, booking create/update/delete, recordPayment, receipt delete, profile save; via `lib/frost-api/muse.ts` — muse upload/create-from-url/delete/save-vendor; via `lib/frost-api/couple.ts` — 7 write-shaped calls incl. the chat stream; upload paths in `_base.ts`. Crude write-shape floor: 17 POST/PATCH/DELETE/PUT literals across the client files (method: grep; a per-endpoint matrix is P6's).
- **One structural note for P6:** `meridian` renders as a premium bloom (`BASE_SLICES:209`) and `pages`/`moments`/`people` have bloom bodies — rows the matrix will need that have no brideTools twin, i.e., the matrix has gap rows in BOTH directions, not only tool→bloom.

---

## §7 — QUESTIONS FOR CE-30 (relayed as bytes through the founder; FC-1 rules nothing)

**Q-1 — The Discover guardrail.** Spec §4: "discover canvas untouched (07 owns it)." At tip, Discover IS a sanctuary bloom (F-07.43) with choreography interlock at `:4504` and shared photo-room chrome at `:4568`. Fork for the 13 charter: (a) Discover's bloom is extracted like the other eleven under the same two-commit law, its 07-sealed internals (VendorProfileView, photoPager, ImageDots homes) byte-held; (b) Discover's bloom body stays in the conductor as the one un-extracted room, fenced; (c) other. Evidence above; FC-1 proposes nothing.

**Q-2 — The token architecture's target.** Does block 13 (i) keep `lib/frost/tokens.ts` as the frost canon and merely finish the literal→token conversion per the census in §3.4, or (ii) attempt the spec's shared semantic architecture across lanes? The single-theme ruling, F-09.160's five seats, and the vendor lane's own sealed canon (CE-203) all bear on the blast radius. Also within this question: whether the retired SKY_IVORY set remains a build target for the conversion at all.

**Q-3 — 0097's bundling.** The reserved migration couples `landing_slides.audience` (needed for F-2, unblocked) with `couples.theme` (ruling-blocked). Author 0097 audience-only and leave theme to a future ruling's own migration? Split differently? The number's contents are the CE's to re-scope; the hole itself is lawful.

**Q-4 — The two-theme acceptance criteria.** Spec acceptance 3 and the §6 founder smoke require walking both themes. Under the single-theme ruling these are unexecutable as written. Amend the spec's acceptance to Wine-only with the second theme's cells conditional-on-ruling-return, or hold the block until the theme question is re-opened? (This is the §3.5 "spec is amended ONCE" leg's largest single amendment.)

**Q-5 — The dead siblings' sequencing.** If PROPOSED-13.A/B are banked, does their deletion sitting run BEFORE P2 (FC-1's read of the hazard) or ride P2's own charter? Sequencing is the founder's; the hazard evidence is §5's.

---

## §8 — WHAT A P2 EXECUTOR MUST NOT DISCOVER MID-SITTING (the handover-forward list)

1. The choreography is :172–:191 + :4120–:4162 + :4434–:4523 + the 300ms pairs (§2) — freeze exactly these.
2. Discover is inside the subject (Q-1 pending).
3. The theme is ONE, by ruling, at five seats; do not "fix" the no-op writer.
4. Twelve rooms, zero extracted, `components/frost/blooms/` to be born.
5. Two dead sibling trees answer to the same room names (§5 A/B).
6. Write doors live in `lib/frost/journey.ts` at least as much as in `lib/frost-api/*`.
7. The splash foundation is a vendor-lane wordmark hero with an in-file IOU; nothing bride-side exists.
8. `couples` has no theme column on any witness; the settling witness for any schema act is a founder-run `information_schema` SELECT, never this document.

— END TDW_FROST_AUDIT_13 · FC-1 @ dream-os `b2e1601` / dreamos-pwa `7bb6429` —
