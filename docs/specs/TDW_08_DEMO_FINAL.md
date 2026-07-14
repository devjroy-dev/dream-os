# TDW_08_DEMO_FINAL — The Gift Account: Lifecycle, Self-Serve Claim, and the Demo Factory
**Block:** 08 · **Repos:** dream-os + dreamos-pwa · **Depends on:** TDW_05 (prospects, sendWa, governance), TDW_06 (Closer context, signup/consult machinery), TDW_07 (demo_lead_alert relay, VendorProfileView, warm-prospect convention)
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify before any edit)
| File | Verifying |
|---|---|
| migrations 0056–0058 + SCHEMA §demo | `demo_vendors`/`demo_leads`/`demo_muse_pool` (ZERO FK to real tables — the 0056 lesson is law), `demo_claim_requests`, otp_sessions purpose CHECK list |
| `src/api/admin/demoAdmin.js` | Existing routes incl. `/claims/:id/contacted` (the manual flow being retired), cloudinary-sign, discover-grant/revoke |
| `app/demo/vendor/[handle]/*` (dreamos-pwa) | The mirrored app shell (kept as secondary tour); `page.tsx` landing being restructured; the ZERO-localStorage demo path (May 29 resolution — MUST NOT regress) |
| `middleware.ts` | Demo subdomain/path rewrites |
| `src/engine/src/core/signup.ts` + the vendor provisioning path (`api/vendor/auth`/provision — map it) | How a real TDW vendor account mints: users + vendors + agents + agent_owner; the claim rides this exactly |
| `components/shared/VendorProfileView.tsx` (07 P4) | The demo-mode mount |
| `prospects` (0078) + `demo_vendor_ref` + warm-note convention (07 P5) | The linkage the factory and Closer surface |
| `src/lib/templates.js` | `demo_lead_alert` (07), `demo_invite` (05) — footer gains the remove link (P1) |
| n8n Vendor Pipeline contract | Sheet fields: phone, IG handle, name, category, city — the bulk-build input shape |

## 1. LOCKED FOUNDER DECISIONS (this block)
| # | Ruling |
|---|---|
| G-1 | Window = **72h** from template send; **first open grants one +72h extension**; **an enquiry mid-window refreshes the clock**; instant deactivation via STOP or the footer remove-link |
| G-2 | Unclaimed demos **sunset from Discover after 30 days** (quiet rotation, resurrectable by a future wave); takedown requests honored instantly, always |
| G-3 | **Self-serve OTP claim**, discover approval **automatic** on claim (content was admin-curated at build) |
| G-4 | Lead tease: **month + city visible; contact + budget blurred** until claim |
| G-5 | Landing order: profile-view → tease → claim CTA; the mirrored app rooms demoted to secondary "explore your studio" |
| G-6 | **PWA-only, constitutionally:** the entire demo experience including claim completes in the mobile browser; no install prompt, no app requirement, no login wall before claim; store links appear only post-claim |

## 2. MIGRATION RESERVATIONS (ladder after 07 = next 0082; LD-8)
| # | File | Adds |
|---|---|---|
| 0082 | `0082_demo_lifecycle.sql` | On `demo_vendors`: `state text not null default 'built' check (state in ('built','invited','opened','engaged','claimed','expired','removed'))` · `invited_at, opened_at, engaged_at, claimed_at, removed_at timestamptz` · `expires_at timestamptz` · `extension_used boolean not null default false` · `claim_token uuid not null default gen_random_uuid()` unique · `claimed_vendor_id uuid` (soft ref, set on conversion — still no FK) · widen `otp_sessions.purpose` CHECK to add `'demo_claim'` · on `demo_leads`: `converted_lead_id uuid` soft ref |

---

## PHASE TABLE (one phase per sitting)

### P1 — The lifecycle engine (G-1, G-2)
**New:** `src/lib/demoLifecycle.js` — the only writer of demo state:
- Transitions: `built →(template send) invited [expires_at = now+72h] →(first link open) opened [if !extension_used: expires_at = now+72h, extension_used=true] →(enquiry lands) engaged [expires_at = now+72h] → claimed | expired | removed`. Every transition logged (timestamped columns) — the analytics spine.
- **Open tracking:** the landing page fires `POST /api/v2/demo/:handle/opened` (no auth, idempotent, rate-limited) — stamps + extends per rule.
- **Enquiry refresh:** the 07 relay path calls `demoLifecycle.onEnquiry(demoVendorId)` — engaged + refresh.
- **Instant deactivation:** (a) STOP on any line (05 armor) matched to a prospect with `demo_vendor_ref` → `removed`; (b) footer remove-link `GET /demo/remove/:claim_token` → one-tap confirm page → `removed`. Removed = out of feed same request, Cloudinary assets queued for deletion (P6 executes), prospect `opted_out`.
- **Jobs (cron, IST):** hourly expiry sweep (`invited/opened/engaged` past `expires_at` → `expired`; stays in Discover until sunset); nightly **30-day sunset** (`expired`/never-claimed older than 30d since `invited_at` → removed-from-feed flag, content retained 7 more days then deletion queue — resurrectable within that week).
- Template footers: `demo_invite` + `demo_lead_alert` bodies amended with the remove line ("Don't want this? {remove_link} — one tap, gone.") — re-submission to Twilio same sitting.

### P2 — Self-serve claim (G-3; retires the manual flow)
**Route:** `app/demo/claim/[claim_token]/page.tsx` (PWA, logged-out reachable):
1. Phone prefilled (masked) from the demo record; OTP sent (purpose `demo_claim` — never confusable with login); verify.
2. Mint the real account through the EXACT existing provisioning path (mapped in read-first — users + vendors row with category/city/IG from the demo, agents + agent_owner via signup machinery, `consult_done=false` so Victor's 06 consult greets them). PIN set in the same screen (existing pattern).
3. **Carry-over, copy-never-link:** portfolio photos re-registered to the real vendor's portfolio (Cloudinary public_ids copied/re-tagged; demo rows untouched until deletion) · profile fields copied · `demo_leads` → `public.leads` (source `discover`, `draft_meta` per contracts, timestamps preserved) with `converted_lead_id` stamped · `discover_eligible=true` automatically (G-3) with the demo card atomically swapped for the real card (no double listing — the feed excludes claimed demos).
4. State `claimed`; prospect `converted` (05's nightly matcher becomes instant here); `demo_claim_requests` marked superseded. `/claims/:id/contacted` admin flow retired to archive.
5. Landing after claim: straight into the real vendor PWA session (existing cookie pattern) — Victor's first words carry the consult AND the waiting lead: the 06 context block reads converted leads at first turn.
**Proof curls:** full claim on the test demo → vendors/users/agents/agent_owner rows, leads converted with drafts, feed swap verified, prospect converted.

### P3 — The landing restructure (G-4, G-5, G-6)
`app/demo/vendor/[handle]/page.tsx` rebuilt in three movements:
1. **The mirror:** `VendorProfileView` in `mode='demo'` — full-bleed, their name in Cormorant italic, eyebrow: *"This is how couples see you. You're live in Discover now."*
2. **The tease (G-4):** waiting enquiries as cards — month + city + function words visible; contact + budget under a brass-shimmer blur (CSS, not fake data); count line ("2 couples are waiting"). Zero enquiries → the card slot shows Discover-presence proof instead ("Couples in {city} are browsing your work this week") — truthful (feed impressions if tracked; else omit the line, never invent).
3. **The claim CTA** — the page's one gold, fixed bottom: `Claim your studio — 90 seconds`. Below the fold: the mirrored app rooms as "Explore your studio" tour chips (existing shell, unchanged routes).
**PWA-only discipline (G-6):** logged-out, cookie-free until claim (the May-29 zero-localStorage architecture preserved verbatim), LQIP images, sub-2.5s LCP on mid-range Android over 4G (measured), no install prompts, iOS Safari + Android Chrome + in-app IG browser all verified (vendors will open this from an IG DM); the remove link works in all three.

### P4 — The demo factory (admin)
`app/admin/demos/page.tsx` rebuilt around the lifecycle:
- **One-screen builder:** IG handle in → pipeline fetch (the n8n/RapidAPI contract; manual photo-URL paste fallback) → photo picker (choose ≤20, min 6 to publish — same floor as real) → category/city/name/phone → publish (`built`).
- **Bulk build:** sheet-shaped `POST /api/v2/admin/demos/bulk` (same fields as the prospects bulk — one upload can feed both, checkbox "also create prospects").
- **Lifecycle board:** columns per state with counts + age; per-card actions: send invite (respects the 25/day marketing governance and prospect state), re-send (only to `expired`, new 72h window), remove, view conversation (prospect linkage), open landing.
- **Claim-rate analytics:** conversion funnel per category × city (built→invited→opened→engaged→claimed), 30-day trend — the growth dashboard Block 10 inherits as a widget.
- Prospect ↔ demo linkage rendered on both boards (the Closer, the demo, and the founder all speak of the same human).

### P5 — The Closer + relay integration
- Closer's dynamic context (06) gains the demo block when `demo_vendor_ref` present: state, waiting-enquiry count, days left on the clock — so he sells with the live fact ("your demo's holding two enquiries and expires Thursday").
- 07's relay batching + warm-note convention verified against the new lifecycle (engaged transitions firing, one alert per enquiry with 48h batching intact).
- `demo_invite` sends move onto the lifecycle (invited transition IS the send) — one path, no drift.

### P6 — Deletion, truth, and sweep
- **Deletion queue executes:** removed/sunset content — Cloudinary destroys (admin API), demo rows purged after the 7-day resurrect window; a `docs/SCHEMA.md` note records the retention policy in plain words.
- Truth audit: every number on the landing and in Closer context traces to a real row (no invented impressions, no fake counts) — grep-and-verify pass.
- Full acceptance sweep + PWA performance re-measure post-build.

---

## 3. GUARDRAILS
Zero FK between demo and real tables — conversion copies, never links (the 0056 catastrophe is doctrine) · demo surfaces stay session-free until the claim OTP; no vendor JWT is ever reachable from a demo route · demoLifecycle is the only state writer · sendWa the only outbound; STOP sacred; 25/day governance owns invite volume · VendorProfileView remains the single profile renderer · one gold per screen (the claim CTA owns the landing) · no localStorage anywhere on demo paths · design system throughout · removed means removed — feed, content, and outreach all honor it.

## 4. ACCEPTANCE CRITERIA
1. Full lifecycle on a test demo: send → invited(+72h) → open on phone → extension applied exactly once → enquiry → engaged + refresh → expire (clock forced) → re-send → claim. Every timestamp lands.
2. STOP and the remove link both yield `removed` + feed disappearance in the same minute + opted_out prospect; resurrect window honored; day-8 deletion verified in Cloudinary.
3. Sunset job rotates a 31-day unclaimed demo out of the feed; takedown request path documented and instant.
4. Claim mints the full account quartet, carries photos + leads (drafts intact), swaps the feed card atomically, flips the prospect to converted, and Victor's first turn names the waiting couple.
5. Tease shows month+city and truly blurs the rest (view-source check — blurred data absent from payload, not CSS-hidden).
6. Landing LCP <2.5s on mid-range Android 4G; flows verified in iOS Safari, Chrome, and the Instagram in-app browser; zero storage APIs on demo paths (audit).
7. Factory: bulk sheet builds N demos + optional prospects; board actions respect governance; funnel numbers reconcile by hand.
8. Closer references live demo facts in a bench transcript.
9. `node --check` + tsc clean; 0082 proven; templates re-submitted with footers; MASTERPLAN gains G-1…G-6.

## 5. FOUNDER SMOKE (phone)
Build a demo from a real IG handle in the factory → send yourself the invite → open from the IG in-app browser, watch the mirror + tease → enquire from your test bride and watch the clock refresh + the alert land → claim in 90 seconds → hear Victor greet you with the consult and the waiting couple → STOP a second demo and watch it vanish.

## 6. NATIVE-IMPLICATIONS CLAUSE
G-6 makes this block native-independent by constitution: the demo is and remains a web surface; the native app is a post-claim destination only (store links surface in post-claim onboarding). Nothing here ports; nothing here blocks the port.

## 7. SESSION BOUNDARIES
Six sittings P1→P6; template footer re-submission rides P1's sitting (approval latency); P2 requires P1's token + states; P3 may parallel P2. Handover per protocol; Block 10 receives the funnel widget contract; MASTERPLAN updated.
