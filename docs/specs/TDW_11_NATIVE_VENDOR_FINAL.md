# TDW_11_NATIVE_VENDOR_FINAL (v2) — The Vendor App: Same-Repo Expo, Dual-Rail Money, Store-Ready
**Block:** 11 · **Repo:** `devjroy-dev/dreamos-pwa` — native joins as a workspace (`native/`), the callmeZ precedent; dream-os remains its own terminal per repo law
**Depends on:** TDW_03 (slice modules = screen blueprints), TDW_09 Phase E (tokens + canon), backend APIs 01–10
**Trajectory (masterplan note):** the vendor PWA is a bridge, not a destination — post-native-adoption it sunsets; demo, crew, claim, and admin remain web by constitution
**Author:** Chief Engineer session, 2026-07-14 (v2 same day — v1 retired for embedding unlocked decisions) · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify before any edit)
| Source | Verifying |
|---|---|
| `lib/design/tokens.ts` + DESIGN_CANON.md (09) | Semantic token sets (Porcelain + Midnight) imported DIRECTLY by native — same repo, no sync machinery |
| `lib/vendor/api/*` + `lib/vendor/types/*` | The typed API surface native imports; audit for browser-only code (document/window/cookies) — anything non-isomorphic gets a platform seam, never a fork |
| `src/api/vendor/auth*` (dream-os) + session mechanism | Whether bearer-token auth exists for native (RIDER-1 hangs on this) |
| `src/api/vendor-engine/chat.js` | Streaming transport the Hub reader must match |
| `src/api/landing-slides.js` | The splash carousel source (admin-controlled) |
| 09: notify.js, push_subscriptions (0083), transcribe, Razorpay flow + webhook · 07: Cloudinary signed upload · 04/04.5: day + bands | Consumed surfaces |
| RevenueCat docs (current) + Apple §3.1 + Play Billing/CCI (current) | The dual-rail mechanics — read LIVE |
| Expo monorepo/workspace docs (current SDK) | Workspace layout: `native/` app + shared root packages, Metro config for the monorepo |
| Old Expo commit `c72c863` | REFERENCE ONLY — source of the permanent guardrail; nothing copied |

## 1. LOCKED FOUNDER DECISIONS (only things the founder actually ruled)
| # | Ruling |
|---|---|
| N-1 | Fresh Expo app, full feature surface |
| N-2 | Cold-start splash = the admin-controlled hero carousel with Ken Burns — same `landing-slides` source and choreography as the PWA (crossfade, 4% drift, wordmark, 2.2–4s, tap-skip, cached offline) |
| N-3 | **Same repo:** native lives inside `dreamos-pwa` as a workspace (callmeZ precedent); PWA eventually sunsets in favor of native |
| N-4 | **Dual-rail purchases:** Razorpay on web · Apple IAP for checkouts initiated in the iOS app · Play Billing on Android — per each store's guidelines |
| N-5 | **Parity-and-absorb pricing:** same INR on all rails; Apple/Google cuts absorbed (the DeepSeek margin cushions it) |
| N-6 | Discount loop honors on the **Razorpay rail only** in v1; the app shows earned rungs but never steers to web checkout |
| N-7 | **RevenueCat** adopted as the store-billing layer |
| N-8 | Both themes ship (Porcelain default, Midnight) — 09 Addendum A |
| N-9 | Demo, crew, claim stay web (08 G-6); app links out where relevant |
| N-10 | RIDER-1 approved: additive `Authorization: Bearer` acceptance beside the cookie path (dream-os micro-sitting), if verification finds no existing bearer path |
| N-11 | RIDER-2 approved: account-deletion request endpoint (dream-os micro-sitting), if no existing route serves Apple's requirement |
| N-12 | Push is a LAUNCH feature |
| N-13 | Entitlement conflicts: earlier active grant wins + founder alert |

## 2. PROPOSED — AWAITING FOUNDER RULING
(none — all v2 proposals ruled 2026-07-14 and promoted to §1)

## 3. FOUNDATION ARCHITECTURE (per N-3)
```
dreamos-pwa/
  app/ …                      # the web PWA, untouched by this block
  native/                     # the Expo app (expo-router)
    app/(auth)/ (tabs)/hub ledger calendar studio more
    components/ui/            # the canon in RN primitives
    components/vendor/        # FilingChip TierMeter WishboneSheet SliceShell…
    lib/                      # session (expo-secure-store), stream reader, upload, push, deeplinks, purchases (RevenueCat)
  lib/design/tokens.ts        # SHARED — imported by web and native alike
  lib/vendor/{api,types}/     # SHARED — platform-seamed where browser-bound
```
Workspaces + Metro monorepo config per current Expo docs; EAS and Vercel coexist (Vercel ignores `native/`; EAS builds from it). Shared code law: tokens stay pure consts; the api client becomes isomorphic (fetch-based, auth injected via a platform seam — cookie on web, bearer on native) — **seams, never forks**; a second api client is a failed session.
**Auth:** OTP → PIN against existing routes; session in **expo-secure-store**; MMKV for non-sensitive cache only.
**State:** React Query over the shared api; persisted cache renders offline-stale with the stamp (09 honesty pattern).

## 4. THE MONEY (N-4/5/6/7) — the entitlement engine
- **One truth server-side:** `vendors.tier` resolves from the active grant regardless of rail. 0084 (unexecuted — clean amendment, dated note in the migration): `billing_events.provider text check (provider in ('razorpay','revenuecat'))` · `vendors.entitlement_source text`.
- **RevenueCat:** app_user_id = vendor UUID; products = the three tiers monthly on both stores at parity INR (N-5); RC webhooks → `POST /webhook/revenuecat` (signature-verified) → billing_events → the SAME tier-flip function the Razorpay webhook uses (09 P4) — one flip path, two feeders.
- **Trial law stays server-granted** (tier given without purchase until expiry — no store intro-offer machinery involved; the Aug-1 boundary function from 09 is the sole authority).
- **iOS surface:** tier card shows price + `Subscribe` → RevenueCat purchase sheet (StoreKit). Zero mention of web pricing anywhere in the app (anti-steering). Android: same RC flow via Play Billing.
- **Loop (N-6):** rungs earned and displayed on all platforms; the percentage applies via Razorpay offers only (09 P4 unchanged); the app never explains where the discount redeems — the Settings web page may.
- **Conflicts:** per P-d once ruled.

## THE PERMANENT GUARDRAIL (verbatim law; CI-gated)
NO module-level `SplashScreen.preventAutoHideAsync()` · NO `if (!fontsLoaded)` render blocking · NO module-level SDK `configure()` calls · fonts fire-and-forget with immediate system-font fallback. `preventAutoHideAsync` runs inside the root component in try/catch; `hideAsync` fires at first paint; the N-2 carousel is an OVERLAY above the live app, never a render gate. CI grep gate on the three patterns; an injected violation must fail the build (proven in acceptance).

---

## PHASE TABLE (one phase per sitting)

### P1 — Workspace, shell, auth, splash, themes
Expo workspace scaffold inside dreamos-pwa (Metro monorepo config; Vercel ignore verified — a web deploy must not break); tabs mirroring the 09 five doors; canon components in RN against DESIGN_CANON.md; both theme sets live with the Settings switcher writing `vendors.theme`. Auth: OTP → PIN (RIDER-1 first if verification demands — awaiting P-a ruling). **The splash (N-2):** static brand frame (guardrail-safe) → AnimatedSplash overlay: landing-slides fetch (memory + MMKV last-good), 3 slides, 1.4s crossfade, Reanimated Ken Burns 4%, wordmark/eyebrow, min 2200/max 4000ms or boot-ready, tap-skip after min, silent skip on failure. Deep-link scheme registered.
**Proof:** cold start to interactive Hub <4s mid-range Android; admin slide change reflects next cold start with no release; guardrail gate wired.

### P2 — The Hub
Streamed chat against the door (transport-matched): text deltas, FilingChip theatre + 30s undo, view-card carousel with deep links, TierMeter (caps wire), draft cards. Quick actions, Today strip, Cabinet peek. Voice: hold-to-talk expo-av → transcribe endpoint → text into input, never auto-sent; hidden on 503. Advisor/Business chip (server state). Bell → inbox screen with per-kind prefs.

### P3 — The Ledger
Five slices from the 03 blueprints: mastheads with count-ups, FilterRail, search, sort, Gesture-Handler swipes per the approved table, long-press peek, bulk + BulkBar, pull-to-refresh + stamp, draft chips + WishboneSheet (inline PATCH and Tell-Victor both), Clients as binder cards with the story timeline, draft-first AddSheet with `All details`, wa.me replies via Linking.

### P4 — Calendar + bands
Heat grid (three slot pips, hatch, muhurat diamond, interest rings), agenda rail, single-fetch day sheet (bookings, followups, hot note, milestones mark-paid, slot blocks, Move with conflict verdict, Ask Victor), Month·Weddings toggle with band lanes (money whispers, crew rings, gap pips → assign / Post-to-Collab prefill), planner default per category.

### P5 — Studio, Profile, Money, More
Studio (team/tasks/payments incl. By-wedding; crew Send-page via share sheet — crew stays web per N-9). Profile Studio: full controls, expo-image-picker → 07 signed Cloudinary path, drag reorder, 20-cap/6-floor mirrored; **preview opens the WEB VendorProfileView in an in-app browser** — native reimplementation is forbidden drift. Collab (multi-item, roster, first-look). Settings: theme switcher, assistant name, notif prefs, capacity steppers, tier card (trial arc, loop rungs per N-6) → **RevenueCat purchase sheet** per §4. Account deletion surfaced (pending P-b if no route exists).

### P6 — Push, offline, the stores
Push registration → 0083 subscriptions (platform column — dated amendment note in the unexecuted migration); notify() fans out web-push | Expo push; taps deep-link to the owning screen; prefs honored server-side. Offline: stale-with-stamp; mutations fail honestly, never queue silently. Store prep: icons/adaptive/splash assets, EAS profiles, privacy + data-safety forms from real behavior (voice never stored — stated proudly), Apple dry-run (demo login = test vendor; deletion visible; anti-steering string audit), Play internal track first; store links hand to the Closer + claim onboarding per W-8 on approval. Full sweep on physical iPhone + mid-range Android.

---

## 5. GUARDRAILS
The permanent guardrail + CI gate · the shared api is the only network layer (a native-side fetch outside it is a failed session) · seams never forks in shared code · shapes verified against live handlers across repos (protocol §6) · both themes on every screen (double screenshot pass) · accent law per theme · secure-store for secrets, MMKV cache-only, no AsyncStorage secrets · zero web-pricing mentions in the iOS binary (string audit) · one tier-flip function, two webhook feeders · demo/crew/claim link out, never re-implement · dream-os untouched beyond ruled riders · voice audio never persisted anywhere.

## 6. ACCEPTANCE CRITERIA
1. Admin slide change → next cold start shows it, no release; carousel honors min/max/tap-skip; offline uses cached slides or skips silently; cold start <4s.
2. Guardrail CI gate proven by an injected violation failing the build.
3. Web deploy (Vercel) green with `native/` present; EAS builds green — the workspace hurts neither.
4. Session survives restart via secure-store; PIN unlock <1s.
5. Hub: filing chips live mid-stream, undo restores, Hinglish voice lands as text, caps meter states correct, mode chip flips server state.
6. Ledger: all swipes/bulk/wishbone-both-paths on device; confessions verbatim in the timeline.
7. Calendar/bands full pass incl. Move conflict verdict and gap→Collab prefill.
8. Profile: 20-photo Cloudinary round-trip; web preview matches Frost (screenshot spot); pause/rate reflect truthfully.
9. **Money:** sandbox IAP via RevenueCat flips tier through the same function as a sandbox Razorpay upgrade (both webhooks → one flip, ledger shows both providers); prices at parity; loop rung visible in-app with zero steering strings; trial expiry downgrades per the boundary function.
10. Push on physical iOS + Android deep-links to the exact row; a silenced kind stays silent; web push unaffected.
11. Offline honesty: stale stamps render; a mutation reports failure plainly.
12. EAS production builds complete; both review checklists filled; `node --check`/tsc clean across the workspace; MASTERPLAN gains N-1…N-9 + §2 rulings as they land.

## 7. FOUNDER SMOKE (physical phones, both platforms)
Change the landing slides in admin → cold-open, watch your images Ken-Burns → speak an expense → swipe a lead, undo → fill a gap pip from a band → upload photos, preview = Frost → subscribe via the Apple sheet on sandbox, watch the tier flip land in billing_events beside your Razorpay test → tap a lock-screen push into the exact lead → airplane mode: honest staleness → Midnight theme, walk every tab.

## 8. SESSION BOUNDARIES
Six sittings P1→P6, strictly ordered. §2 items must be ruled before their blocking phases. Handover per protocol; MASTERPLAN updated each sitting; TDW_12_NATIVE_BRIDE reserves its number, gated on the bride blocks + the sanctuary extraction.


---

## ADDENDUM (2026-07-14, from TDW_13): (1) N-2 amended — the native vendor splash is PORTFOLIO-FIRST with the `vendor_fallback` collection as fallback (F-3), same shared selection function as the PWA. (2) §3 architecture amended per F-6 — TWO STORE LISTINGS, ONE CODEBASE: `native/vendor/` and `native/bride/` as thin app targets over the shared workspace foundation; a future universal-listing merge remains a routing change by design. TDW_12_NATIVE_BRIDE builds the second target once TDW_13 satisfies its gate.


---

## ADDENDUM (2026-07-14, founder-approved) — Social sign-in: Google + Apple, phone-spine law
Rulings: NO Meta · Google + Apple ship TOGETHER on every surface (Apple guideline 4.8 pairing) · **mandatory, unskippable phone-verify beat** immediately after any social door, in the house voice ("WhatsApp is where your assistant lives — verify your number"), before the product opens · **phone is the identity spine and the merge key**: a social sign-in matching a verified phone LINKS to the existing account, never duplicates.
P1 amendments: auth screens gain Continue-with-Google / Continue-with-Apple above the OTP path; provider SDKs are **lazy-initialized inside the auth flow** — the permanent guardrail's third law (no module-level configure()) exists BECAUSE of this feature's ancestor; the CI grep gate already forbids the fatal pattern and this addendum restates it as the implementation contract. Backend: one dream-os auth rider (RIDER-3, founder-approved): Supabase OAuth providers (Google, Apple) enabled + a link-by-verified-phone resolution in the provision path — social identities attach to the phone-keyed account, additive, cookie/bearer paths untouched. Acceptance additions: Google door on Android + Apple door on iOS each reach the phone-verify beat and cannot bypass it; a social sign-in with an already-verified phone lands in the EXISTING account (no duplicate row, audit); iOS binary carries both doors or neither (4.8 audit).
