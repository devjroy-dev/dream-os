# TDW_09_UIUX_FINAL — The House Style: Nav, Inbox, Voice, Money, and the Vogue Pass
**Block:** 09 · **Repos:** dreamos-pwa (primary), dream-os (inbox feed, Sarvam, Razorpay) · **Depends on:** 01–08 shipped surfaces; founder provisions the Razorpay account + `SARVAM_API_KEY` before P3/P4 sittings
**Feeds:** TDW_11_NATIVE_VENDOR (Phase E's canon + tokens are its foundation — the native track begins when Phase E lands)
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify before any edit)
| File | Verifying |
|---|---|
| `app/vendor/**` post-03/04/07 | Every surface receiving the pass; PeekNav mount; InputBar (mic + tier meter cohabitation) |
| `vendor_activity_log` writes across 02–08 | The inbox's raw feed (llm_cost/harvest excluded from user-facing kinds) |
| z `src/journal.ts` + `src/index.ts` ~1205–1230 + `app/voice.js` | The Sarvam pattern being ported verbatim: REST speech-to-text, `saaras:v3`, `codemix`, raw-body cap, transcribe-and-discard |
| Razorpay Subscriptions API docs (current) + the founder's dashboard plan IDs | Checkout, webhooks (`subscription.activated/charged/halted/cancelled`), offers/coupons mechanics — READ THE LIVE DOCS, pricing/API drift is real |
| SCHEMA §vendors tier/trial fields + the tier rules | Essential 499 / Signature 1,999 / Prestige 3,999; trial law: before Aug 1 2026 = Signature free until Aug 1; after = 30-day trial → Essential |
| `clients`/`couples` join paths | The past-client qualification query (client joined AND sent ≥1 enquiry) |
| `manifest*.json`, `sw.js`, `next.config.ts` | Shell/manifest/offline baseline |
| All components touched by 02/03 (FilingChip, TierMeter, WishboneSheet, SliceShell family, Toast patterns) | Canon consolidation inputs |

## 1. LOCKED FOUNDER DECISIONS (this block)
| # | Ruling |
|---|---|
| U-1 | Bottom nav five doors: **Hub · Ledger · Calendar · Studio · More**; PeekNav demotes to Hub-contextual |
| U-2 | Notifications: in-app inbox universal + capability-detected web push (iOS installed-PWA only), never nagged |
| U-3 | Voice = **Sarvam** (`saaras:v3`, codemix), server endpoint, transcribe-and-discard; founder supplies key |
| U-4 | Razorpay wired in this block (founder provisions account first); vendor subscriptions only — couple one-time purchases belong to the bride blocks |
| U-5 | Discount-loop ladder softened: **5 clients = 5%**, then 10=10%, 20=20%, 30=30%, 40=40%, cap **50=50%**; qualification = past client joined AND sent ≥1 enquiry; loop surfaced with progress bar + share link |
| U-6 | Native track (TDW_11) begins when Phase E lands; Phase E's tokens/canon are written as the future `@tdw/tokens` + component package |

## 2. MIGRATION RESERVATIONS (ladder after 08 = next 0083; LD-8)
| # | File | Adds |
|---|---|---|
| 0083 | `0083_notifications.sql` | `notifications (id uuid pk, vendor_id uuid fk, kind text, title text, body text, deeplink text, ref jsonb, read_at timestamptz, created_at timestamptz default now())` + index (vendor_id, read_at) · `push_subscriptions (id uuid pk, vendor_id uuid fk, endpoint text unique, keys jsonb, created_at)` · `users.notif_prefs jsonb` |
| 0084 | `0084_billing.sql` | `vendors.razorpay_customer_id text` · `vendors.razorpay_subscription_id text` · `vendors.billing_status text check (billing_status in ('trial','active','halted','cancelled')) default 'trial'` · `billing_events (id uuid pk, vendor_id uuid, event text, payload jsonb, created_at)` · `vendors.loop_discount_pct int not null default 0` |

---

## PHASE TABLE (one phase per sitting)

### P1 — The spine (U-1)
`components/vendor/BottomNav.tsx`: five doors, Jost 10 letterspaced, 1px hairline top, active = ink weight shift (NO gold in chrome), safe-area padded, hidden inside full-screen sheets. Route mapping: Hub `/vendor` · Ledger `/vendor/list/[last]` · Calendar `/vendor/calendar` · Studio `/vendor/studio` · More = sheet (Profile Studio, Collab, Couture, Featured, TDS, Contracts, Crew links, Settings; **Advisor-mode chip pinned top** per 06). PeekNav re-mounted as Hub quick-actions only. Transitions: 200ms shared-axis; `prefers-reduced-motion` collapses all motion to opacity. Every page gains bottom padding tokens. Retire nav dead-ends found (the 03 landing redirect precedent).

### P2 — The inbox (U-2)
**Backend:** `src/lib/notify.js` — the one writer: `notify(vendorId, kind, {title, body, deeplink, ref})` → inserts 0083 row + fires push where subscribed. Wire the existing moments: hot-lead brief (06) · crew decline (04.5) · collab response/accept (04.5) · discover approved/paused (07) · demo claimed (08, admin-side too) · payment received (05 PAID) · trial milestones (14/3/1 days). Routes: list (paged), `mark-read`, `mark-all`, prefs PATCH.
**Frontend:** bell + unread dot in the top bar → sheet: day-grouped rows (kind glyph, title DM Sans 14, body 13 dim, relative time Jost 10), tap = deep link + read, swipe = read, `Mark all`. Empty state: "Quiet, as it should be."
**Push:** VAPID web-push; capability detection (iOS = installed PWA 16.4+); a single quiet inline offer inside the inbox ("Get these on your lock screen") — once, dismissible, never a modal. Server sends only kinds the user's prefs allow; prefs UI in Settings (per-kind toggles).

### P3 — The voice (U-3, the z port)
**Backend:** `POST /api/v2/vendor/transcribe` — vendor-auth, raw `audio/*` body, 2MB/60s cap, forwards to Sarvam REST speech-to-text (`saaras:v3`, `mode: codemix`), returns `{text}` — **stores nothing** (the z law: transcribe and discard). Typed errors; absent `SARVAM_API_KEY` → 503 the FE reads as "voice unavailable."
**Frontend:** mic glyph in InputBar (right of field, left of send): hold-to-talk (MediaRecorder, webm/opus with mp4 fallback for iOS Safari — verify codec per browser), releasing posts → returned text lands IN the input for review (never auto-sends — the vendor owns the words), brass pulse while recording, honest failure toast. Mic hidden where MediaRecorder or the key is unavailable. Works in Business and Advisor modes alike.

### P4 — The money (U-4, U-5)
**Checkout:** Settings tier masthead (tier in Cormorant, trial arc, price line) → `Upgrade` → backend `POST /billing/checkout` creates/reuses razorpay customer + subscription (plan IDs from env, founder's dashboard), Razorpay Checkout JS drop-in → success returns to a confirmation sheet. **The webhook is the truth:** `POST /webhook/razorpay` (signature-verified) → billing_events ledger → `subscription.activated/charged` flips `vendors.tier` + `billing_status`; `halted/cancelled` downgrades per the tier law (trial rules re-verified against today's date at build). UI never flips tier itself — it reflects the webhook.
**Trial law encoded server-side:** the Aug-1-2026 boundary logic in one function with unit tests either side of the date.
**The loop (U-5):** nightly entitlement job — qualified past clients (joined AND ≥1 enquiry, via the couples/enquiries join verified in read-first) → ladder (5→5, 10→10, 20→20, 30→30, 40→40, 50→50 cap) → `loop_discount_pct`; applied via Razorpay offer/coupon on the subscription where the API allows, else as a next-cycle adjustment — executor reads the live API and records which path, honestly, in the handover. **Surface:** Settings card — progress bar to the next rung ("7 qualified — 3 more to 10%"), the earned % in ink (gold only at 50), and a share affordance (wa.me with a personal invite line + their routing handle) so vendors recruit their own past clients. Every number traces to the job's rows.

### P5 — The Vogue pass + the canon (U-6 — the native foundation)
1. **Tokens:** `lib/design/tokens.ts` — color (ink/gold/cream + the derived dims), type scale (Cormorant 44/32/24 · Jost 11/10/9 · DM Sans 15/13), 4px spacing scale, radii, hairline, motion durations/easings. Written dependency-free (plain exported consts) — this file IS the seed of `@tdw/tokens`.
2. **Canon:** `components/vendor/ui/` — Button, Sheet, Row, Chip, Pill, Toast (unifying the 02/03 undo toasts), Meter, SectionHeader, EmptyState, Skeleton — each consuming tokens only. Existing components (FilingChip, TierMeter, SliceShell family, WishboneSheet) refactored onto the canon, no visual regression (screenshot pass).
3. **The audits, enforced by grep + eye:** gold ≤3/screen with one dominant (fix violations) · ad-hoc font sizes → scale · dividers → hairline only · icon set unified at 1.5-stroke (one library, tree-shaken) · motion outside the language removed · **gold is never text** (contrast law).
4. Every surface from 01–08 walked against the canon; drift fixed; the pass documented as `docs/DESIGN_CANON.md` (the native track's brief).

### P6 — Micro-craft, shell, and the gates
Pressed states (scale .98, 80ms) · 48px target audit · safe-area everywhere · one money formatter (`₹2,50,000` Indian grouping, `₹2.5L` compact — lib function, greps replace ad-hoc) · one date voice ("Thu, 14 Dec", IST) · focus-visible rings · reduced-motion audit · manifest polish (maskable icons, cream theme-color, iOS splash set) · offline shell (SW caches the skeleton + last payloads render with the stale stamp; writes queue nothing — honesty over magic) · route-split + prefetch-on-intent audit · **gates:** Lighthouse PWA installable, LCP <2.5s, CLS <0.1 on Hub/Ledger/Calendar/Discover-preview, mid-range Android. Full acceptance sweep.

---

## 3. GUARDRAILS
No gold in chrome; the canon's tokens are the only source of style values in new/refactored code (hex literals outside tokens.ts fail review) · push never modal-begs; one inline offer, once · voice audio is never stored, never logged (body excluded from request logging — verify) · tier changes flow ONLY from the Razorpay webhook · the discount job's numbers must reconcile to real rows — no optimistic display · no localStorage (push subscription state lives server-side; SW cache is not storage-API use) · WhatsApp engines + souls untouched · every refactor screenshot-diffed; regressions are failed sessions.

## 4. ACCEPTANCE CRITERIA
1. Five-door nav on every vendor surface; More sheet complete; Advisor chip works; reduced-motion collapses transitions.
2. Each wired event lands one inbox row with a working deep link; push arrives on installed-PWA iOS and Android Chrome; prefs silence a kind end-to-end.
3. Hold-to-talk on iOS Safari + Android Chrome yields codemix text into the input (Hinglish test line transcribed correctly); nothing stored server-side (log audit); keyless env hides the mic.
4. Sandbox Razorpay: upgrade → webhook flips tier; halted → downgrade per law; billing_events ledgers every event; trial boundary unit tests pass both sides of Aug 1.
5. Discount job: seeded fixture (7 qualified) → 5% applied at Razorpay (or adjustment path recorded), bar shows "3 more to 10%"; share link opens wa.me with the personal line.
6. tokens.ts + canon exist; zero hex literals outside tokens in refactored surfaces (grep gate); DESIGN_CANON.md written; screenshot pass clean.
7. Money formatter + date voice universal (grep gate on ₹ and toLocaleDateString stragglers).
8. Lighthouse gates green; offline cold-open renders the shell + stale data with stamp.
9. `node --check` + tsc clean; 0083/0084 proven; MASTERPLAN gains U-1…U-6 and the native-track start declaration.

## 5. FOUNDER SMOKE (phone)
Install the PWA → cold-open (03's splash into the new nav) → hold the mic and speak a Hinglish expense, watch the text land, send → a lead arrives: lock-screen push → inbox → deep link to the row → open Settings: watch the trial arc, upgrade on sandbox, see tier flip after webhook → check the loop bar, tap share, see your invite line → airplane mode, reopen: the shell + stale stamp.

## 6. NATIVE-IMPLICATIONS CLAUSE (this block IS the clause)
Phase E is the port's foundation by design: tokens.ts → `@tdw/tokens`; the canon's component grammar maps 1:1 to RN primitives; Sarvam/Razorpay/notify are pure APIs (native swaps MediaRecorder→expo-av, web-push→expo-notifications, Checkout JS→Razorpay RN SDK against identical backends). TDW_11_NATIVE_VENDOR begins the sitting after Phase E ships.

## 7. SESSION BOUNDARIES
Six sittings P1→P6. P3 blocks on `SARVAM_API_KEY`; P4 blocks on the founder's Razorpay account + plan IDs — either may swap later in the order if provisioning lags (the only permitted reorders). Handover per protocol; DESIGN_CANON.md + tokens contract handed to the native track; MASTERPLAN updated.

---

## ADDENDUM A — The Two-Theme Doctrine (founder rulings, 2026-07-14; amends P5, 0083, acceptance)
**LD-9 is formally amended in MASTERPLAN:** vendor side carries exactly two curated themes — **Midnight** and **Porcelain** — espresso retired and deleted; generic dark mode remains forbidden; the bride PWA keeps its existing TWO themes (blue-and-white, and red) untouched by this block.

| Ruling | Value |
|---|---|
| Porcelain (DEFAULT) | surface `#F8F7F5`, ink `#0C0A09`, **accent = oxblood `#5E1A24` (sole accent)**; gold `#C9A84C` demoted to wordmark + premium metal only (Prestige badge) |
| Midnight | surface `#0B1526→#0E1B2C`, text warm ivory `#F5F1E8`, hairline slate `#2A3A50`, **accent = gold `#C9A84C`** |
| Accent law | "≤3 accent per screen, one dominant" — theme-agnostic, enforced in the P5 grep audit against the semantic accent token |
| Persistence | `vendors.theme text check (theme in ('porcelain','midnight')) default 'porcelain'` — ADDED TO 0083 (spec unexecuted; amendment clean). Server-persisted; no storage APIs |

**P5 amendments:** tokens.ts becomes SEMANTIC (`surface/ink/accent/hairline/dim/…`) with two authored sets; components consume semantics only (theme = set swap; native inherits both); `lib/vendor/theme.ts` + ThemeContext + useVendorTheme rebuilt onto the sets; espresso values and the globals.css espresso/bone + navy/ember atmospheres DELETED, not overridden; Settings gains the two-swatch theme switcher.
**Acceptance additions:** (10) screenshot pass runs in BOTH themes — zero espresso remnants (grep `espresso` = 0 hits); (11) accent audit passes per theme (oxblood sole accent in Porcelain; gold only in wordmark/Prestige contexts); (12) theme survives re-login and a second device (server persistence proof).
