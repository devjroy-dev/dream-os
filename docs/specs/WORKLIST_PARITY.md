# WORKLIST_PARITY — THE PHASE 0 LEDGER
**dream-os base `b6f049b` · dreamos-pwa inventory tip `28df2b0`** (both fetch-first at origin at authoring; `git fetch -q origin && git rev-parse --short origin/main`)

Phase 0 of `docs/specs/TDW_WORKLIST_ROADMAP.md` (@ `9f329f0`), read with amendments **A-1…A-6** and **R-37.42**. Authored READ-ONLY: this sitting wrote zero production bytes and zero migrations. This file is NEW; it edits nothing.

**Exit condition:** the founder signs this ledger and rules §8 (the SURFACED rows) and §7 (the merge sheet). Phase 1's kickoff is written only after that signature.

---

## §0 · PROVENANCE AND METHOD

Every claim below was derived by a command at the tips named above. Where a claim was **not** derived, it says so in the row. Nothing here is remembered from the app.

**The instruments used, so a reader can re-run them:**

| Question | Command class |
|---|---|
| What pages exist | `find app/vendor -name 'page.tsx'` |
| What each page mounts | `grep -n '^import' <page>` |
| What controls a surface carries | `grep -n 'onClick=\|href=\|aria-label=\|onPointer' <file>` |
| Which route a verb calls | `grep -n 'postJson\|patchJson\|deleteJson' lib/vendor/api/vendor.ts` |
| Which table a route reads | `grep -rn "\.from('<table>')" src/api/vendor/` (dream-os) |
| Whether a column exists | `docs/db/PUBLIC_SCHEMA.md` by line address, plus the staleness check the header itself prescribes |

**Control-inventory clause 3 compliance.** Three surfaces in this ledger render variable-length collections whose shape depends on the account's data: the Business slice lists, the Home "What's waiting" zone, and the Calendar month grid. Each is walked against the primary test account `9888294440`'s data shape and says so **per row**, in the `clause 3` column. Where this container could not reach production data, the row states the shape as **DECLARED-UNDERIVED** and names the founder SELECT that would settle it (§9.4) — it does not guess.

**A-1 recorded where it bears.** The roadmap's test-account-only premise is dead (NOTE 36 §1: the estate is LIVE, ~22 paying vendors). This ledger is written as an inventory of a **live shell serving paying vendors**, not a sandbox. Two roadmap sentences are read as amended and are named at §9.1. The roadmap file itself is byte-untouched by this delivery.

**R-37.42 recorded where it bears.** "Home in the new shell" throughout this document means **a home in the branch PWA** built off the long-lived `worklist` branch of `dreamos-pwa`, served at its own Vercel branch domain with its own manifest. It never means a dial-gated route, and it never means a `/vendor2` tree in production. Production `main` carries zero bytes of the new shell. Tap counts and the merge sheet are unaffected by this change of vocabulary.

---

## §1 · THE SURFACE CENSUS

Derived, not estimated.

```
find app/vendor -name 'page.tsx' | wc -l      →  30
find app/vendor -type f | wc -l               →  37
find app/vendor -name 'layout.tsx'            →  app/vendor/layout.tsx (one)
find components/vendor -type f | wc -l        →  43
wc -l app/vendor/**                           →  11,512 lines
```

**The 30 page files, verbatim from the census:**

`billing` · `calendar` · `collab/[post_id]/responses` · `collab` · `contracts` · `couture` · `discover/leads` · `discover` · `discover/preview` · `discover/profile` · `discover/submit` · `featured` · `list/[slice]` · `list` · `more` · `onboarding` · `page.tsx` (Home) · `pin-login` · `pin-reset` · `pin` · `portfolio` · `settings` · `storefront` · `studio/notes` · `studio` · `studio/tasks` · `studio/team-payments` · `studio/team` · `tds` · `team-hub`

**Three of the 30 are not surfaces.** Derived by reading each file whole:

- `app/vendor/list/page.tsx` (17 lines) — a redirect to `/vendor/list/${readStoredSlice() ?? 'leads'}`. Renders nothing.
- `app/vendor/studio/page.tsx` (29 lines) — a `redirect('/vendor/team-hub')` stub. Its own header records the retirement (F-09.18 arm (a) + R-X8) and where its rows went.
- `app/vendor/list/[slice]/page.tsx` (40 lines) — a thin router, not a screen. It resolves a slug to one of **six** slice modules.

**The slice router expands to six rooms in one file** (`app/vendor/list/[slice]/page.tsx:18-25`, the `MODULES` record, re-checked against a hard-coded membership array at `:33`):

```
leads · clients · invoices · expenses · events · notes
```

Order on the Slice Door chip row is `DOOR_ORDER` at `components/vendor/slices/SliceShell.tsx:73` — the same six, same order.

**Net addressable vendor surfaces: 35.** 30 page files, minus the 3 non-surfaces, plus the 6 slices, plus `collab/[post_id]/responses` already counted as a page. `30 − 3 + 6 = 33` screens, plus 2 modal-only surfaces that carry irreducible jobs and no route of their own (the Header profile drawer; the Calendar day sheet) = **35 addressable job-bearing surfaces**.

**This is not twenty.** See §9.1.

---

## §2 · THE NAVIGATION GRAPH

Three navigation authorities exist, derived by reading each:

**① The five doors** — `components/vendor/BottomNav.tsx:87-95`, the `DOORS` array, which the file's own header names as the single membership + active-state authority. Labels are founder-vetoed bytes and may not drift a character.

| Door | Path | Match rule |
|---|---|---|
| Home | `/vendor` | exact |
| Calendar | `/vendor/calendar` | prefix |
| Business | `/vendor/list` | prefix |
| Storefront | `/vendor/storefront` | prefix set: `storefront`, `portfolio`, `discover`, `collab` |
| More | `/vendor/more` | exact |

The bar is hidden on two conditions, both derived from `app/vendor/layout.tsx`: `onLogin` (root, `/vendor/auth*`, `/vendor/pin*`) and `chromeless` (`/vendor/onboarding*`). It also hides while the chat is risen, via `body.chat-risen` published by the Home page and read by a rule in `globals.css`.

**② The Header profile drawer** — `components/vendor/Header.tsx`, the coin at `:161` opening a card with nine items at `:262, :289, :307, :308, :309, :313, :314, :331, :332`.

**③ The More index** — `app/vendor/more/page.tsx`, nine rows assembled from four arrays (`DISCOVER_ITEMS`, `TEAM_ITEMS`, `FINANCE_ITEMS`, `ACCOUNT_ITEMS`) and rendered as one merged list. The Header calls this page "the exhaustive index" in its own comment.

**Nine of the 35 surfaces sit behind no door at all.** BottomNav's own header states it: *"Screens outside every set (settings, tds, contracts, couture, featured, team-hub, studio leaves) light no tab."* They are reachable only through More or the coin. That is the single largest structural fact this ledger carries, and §7's merge sheet is built on it.

---

## §3 · THE TAP BUDGET — W-1's MEASUREMENT METHOD

**A-2 (W-1), restated as the rule this ledger is measured against:**
- For every job: **taps-in-new-shell ≤ taps-today**.
- For the five top jobs (the D-4 kinds — answer a lead, chase money due, get a contract signed, answer a date-ask, answer a team-ask): **taps-in-new-shell < taps-today**, strictly.
- A shell failing W-1 does not cut over.

**How a tap is counted here.** Origin is a cold open landing on Home (`/vendor`). Taps are counted **to the point of committing the job's verb**, not to the point of seeing the screen. One discrete finger contact = one tap. A swipe that triggers a verb counts as one. Typing into an already-focused field is not a tap; focusing it is. Sheet dismissals are not counted. Every count below is derived by walking the code's actual navigation — the `DOORS` array, the `SliceDoor` chip handler, the day-tap handler, the swipe registries — never estimated from the app's feel.

**The counts are stated as a pair where the path forks on data.** The Home "What's waiting" zone shows a **ceiling of three** lines and then an overflow (`app/vendor/page.tsx:585-586`, `all.slice(0, 3)` and the `…and N more →` button at `:624`). So "answer a lead" has two real paths — the shortcut when the lead is in the top three, and the list path when it is not. Both are counted. **Clause 3 applies here directly and is the reason the pair exists.**

---

## §4 · THE CONTROL LEDGER

One row per control. States are **CARRIED** (same component, same job, new frame), **RELOCATED** (new home named), **SURFACED** (needs the founder's ruling). No fourth state. Write endpoints are in §5 and referenced by name.

**A-5 is binding on every row here:** no control may be marked CARRIED-via-composer-card. Where a control's only proposed home is a Victor action card, its state is **SURFACED**, because Phase 5 is decidable and not assumed.

### 4.1 · The shell itself

| # | Control | Verb | Home today | Taps today | Proposed home (branch PWA) | Taps proposed | State | Endpoint | clause 3 |
|---|---|---|---|---|---|---|---|---|---|
| S-1 | Home door | navigate | BottomNav | 1 | WorklistNav seat 1 (Today) | 1 | CARRIED | — | n/a |
| S-2 | Calendar door | navigate | BottomNav | 1 | pin (D-5 default) | 1 | CARRIED | — | n/a |
| S-3 | Business door | navigate | BottomNav | 1 | WorklistNav seat 2 (Rooms) | 1 | RELOCATED | — | n/a |
| S-4 | Storefront door | navigate | BottomNav | 1 | Rooms → Storefront | 2 | **SURFACED** | — | n/a |
| S-5 | More door | navigate | BottomNav | 1 | dissolved into Rooms | 1 | RELOCATED | — | n/a |
| S-6 | Profile coin | open drawer | Header (23 surfaces) | 1 | Rooms header, same coin | 1 | CARRIED | — | n/a |
| S-7 | Splash cold-open | — | layout | 0 | same | 0 | CARRIED | — | n/a |
| S-8 | Theme atmosphere by route | — | layout `roomClassForPath` | 0 | same fn, new prefixes | 0 | **SURFACED** | — | n/a |
| S-9 | Onboarding mandatory redirect | guard | layout `useOnboardingGuard` | 0 | same guard, branch layout | 0 | CARRIED | `GET /api/v2/vendor/me` | n/a |

**S-4's warrant.** Storefront is a door today (1 tap) and a room tomorrow (2 taps). That is a **W-1 violation on a non-top-five job** — permitted by A-2's ≤ clause only if it stays ≤, and 2 > 1. Either Storefront is a pin, or W-1 is ruled to exempt door-to-room demotions. Ruling required; see §8.

**S-8's warrant.** `roomClassForPath` keys atmospheres off path prefixes (`ROOM_DISCOVER_PREFIXES` at `layout.tsx`). Under a rooms model those prefixes change shape. The function is the atmosphere authority and nothing else answers nav questions — but its input vocabulary is being replaced, and a silent re-key of a live visual is not an executor's call.

### 4.2 · Home (`app/vendor/page.tsx`, 1,263 lines)

| # | Control | Verb | Taps today | Proposed home | Taps proposed | State | Endpoint | clause 3 |
|---|---|---|---|---|---|---|---|---|
| H-1 | "Open your books" (Cabinet) | open cabinet | 1 | Rooms grid | 1 | RELOCATED | read-only | n/a |
| H-2 | "What's waiting" line — enquiry | `Reply →` seeds a Victor draft | **1** | Today card `lead_unanswered`, inline verb | 1 | **SURFACED** | `POST /api/v2/vendor/chat` | list of `today.needs_attention.new_leads`, ceiling 3; DECLARED-UNDERIVED at `9888294440` — §9.4 fixture SELECT ① settles it |
| H-3 | "What's waiting" line — overdue invoice | `Remind →` seeds a Victor draft | **1** | Today card `invoice_due` | 1 | **SURFACED** | `POST /api/v2/vendor/chat` | `overdue_invoices`, same ceiling; §9.4 ② |
| H-4 | "What's waiting" line — hold | `Confirm →` seeds a Victor draft | **1** | Today card, date verbs | 1 | **SURFACED** | `POST /api/v2/vendor/chat` | `events_today`; §9.4 ③ |
| H-5 | "What's waiting" line — Discover pending | opens `/vendor/discover` | 1 | Today card `shop_nudge` | 1 | RELOCATED | `GET /discover/status` | renders only while state = `requested` |
| H-6 | `…and N more →` overflow | opens `/vendor/list/leads` | 1 | Today "see all" | 1 | CARRIED | — | renders only when lines > 3 |
| H-7 | Chat input bar | send to Victor | 1 (focus) + send | Composer frame, unchanged mind | same | CARRIED | `POST /api/v2/vendor/chat` (stream variant at `vendor.ts:349`) | n/a |
| H-8 | Suggestion chips | seed a draft | 1 | Composer | 1 | CARRIED | — | first-run only |
| H-9 | Victor mode chip (BUS/ADV) | flip mode, reset thread | 2 (rise chat, tap chip) | Composer frame | 2 | CARRIED | `PATCH /api/v2/vendor-e/mode` | n/a |
| H-10 | Fresh-thread control | start a clean thread | 2 | Composer overflow | 2 | CARRIED | `POST /api/v2/vendor/chat/thread/fresh` | n/a |
| H-11 | Report-glitch chip | file a glitch | 2 | Composer overflow | 2 | CARRIED | `POST /api/v2/vendor/chat/glitch-report` | n/a |
| H-12 | Chat close handle | lower the chat | 1 | same | 1 | CARRIED | — | risen only |
| H-13 | Tier upgrade link (`meta.upgrade.href`) | navigate to billing | 1 | Today, tier wall | 1 | CARRIED | — | renders on ceiling only |
| H-14 | Onboarding overlay tour | walk the tour | 1 | branch shell tour | 1 | **SURFACED** | — | first-run only; the tour's anchors (`data-tour="bottom-nav"`, `data-tour="profile-coin"`) point at chrome the new shell replaces |
| H-15 | Retry-last | resend the last user turn | 1 | Composer | 1 | CARRIED | `POST /api/v2/vendor/chat` | `ChatThread` `onRetryLast` at `page.tsx:1154`; renders only after a failed turn |

**H-2/H-3/H-4 are the ledger's most consequential rows and the reason W-1 needs a ruling.** These three jobs already cost **one tap** on the top-three path. A-2 demands *strictly fewer* taps for the top five D-4 kinds. One is the floor; strictly fewer than one is not a number. Three readings are available and the founder rules among them at §8.1 — this desk proposes and does not pick.

**H-14's warrant.** The tour is anchored to `data-tour` attributes on BottomNav and the profile coin. The new shell replaces the bar. A tour that points at chrome which no longer exists is a first-run experience that breaks for every new paying vendor on cutover day — and A-1 makes that a live-estate consequence, not a test-account one.

### 4.3 · Business — the six slices (`SliceShell.tsx`, 64,599 bytes; six modules)

The shell is one component parameterised six ways. Its controls are therefore **six-fold**, and this ledger counts them once with the slice-varying behaviour named.

| # | Control | Verb | Home today | Taps today | Proposed home | Taps proposed | State | Endpoint | clause 3 |
|---|---|---|---|---|---|---|---|---|---|
| B-1 | Slice Door chip row | switch slice | `SliceShell.tsx:100` | 2 (Business, chip) | Room header pills | 2 | CARRIED | — | six fixed chips, not data-driven |
| B-2 | Back caret | `onBack` | `:166` | 1 | Room header `‹ Rooms` | 1 | CARRIED | — | n/a |
| B-3 | Search field | filter rows | `:190` | 2 | same | 2 | CARRIED | client-side | n/a |
| B-4 | Filter rail chips | filter by badge/month | `:391-405` | 3 | same | 3 | CARRIED | client-side | **chip set is DATA-DERIVED** — counts computed from the loaded rows; empty account renders zero chips. §9.4 ④ |
| B-5 | Sort control | cycle recent→amount→date | `:983` | 3 | same | 3 | CARRIED | client-side | n/a |
| B-6 | Brass-key FAB `+` | open AddSheet | `:242` | 2 | Room FAB | 2 | CARRIED | per-slice create, §5 | n/a |
| B-7 | Row tap | open DetailSheet | `SliceRow` | 3 | same | 3 | CARRIED | read | list length data-derived; §9.4 ① |
| B-8 | Swipe-right — leads | **Booked** | `:540` | 3 (gesture) | Today verb + room swipe | 1 | RELOCATED | `PATCH /leads/:id/state` | requires ≥1 lead row |
| B-9 | Swipe-left — leads, with phone | **Call** (`tel:`) | `:571` | 3 | room swipe | 3 | CARRIED | none (`tel:` handoff) | **branch on `row.phone`** — under M-LEADGATE a Basic vendor's redacted row has no phone, and R-37.22 suppresses left-swipe on redacted rows |
| B-10 | Swipe-left — leads, no phone | **Mark lost** | `:572` | 3 | room swipe | 3 | CARRIED | `PATCH /leads/:id/state` | same branch, other arm |
| B-11 | Swipe-right — invoices | **Mark paid** | `:575` | 3 | Today verb + room swipe | 1 | RELOCATED | binder `money-edit`, §5 | requires ≥1 invoice |
| B-12 | Swipe-left — invoices | **Cancel** | `:583` | 3 | room swipe | 3 | CARRIED | `PATCH /invoices/:id/cancel` | — |
| B-13 | Swipe-right — expenses | **Repeat** | `:586` | 3 | room swipe | 3 | **SURFACED** | **none** — shows a toast only | — |
| B-14 | Swipe-left — expenses | **Delete** | `:587` | 3 | room swipe | 3 | CARRIED | binder `hide`, §5 | — |
| B-15 | Swipe-right — events | **Done** | `:593` | 3 | Today verb + room swipe | 1 | RELOCATED | `PATCH /events/:id` | — |
| B-16 | Swipe-left — events | **Cancel** | `:597` | 3 | room swipe | 3 | CARRIED | `PATCH /events/:id/cancel` | — |
| B-17 | Bulk bar — leads | Mark contacted · Lose | `:675` | 4 | room bulk bar | 4 | CARRIED | `PATCH /leads/:id/state` | multi-select; needs ≥2 rows to be meaningful |
| B-18 | Bulk bar — invoices | Mark paid | `:676` | 4 | same | 4 | CARRIED | §5 | — |
| B-19 | Bulk bar — expenses | Delete | `:677` | 4 | same | 4 | CARRIED | §5 | — |
| B-20 | Bulk bar — events | Mark done | `:678` | 4 | same | 4 | CARRIED | `PATCH /events/:id` | — |
| B-21 | Detail sheet — wishbone chip | open WishboneSheet | `:719` | 4 | same | 4 | CARRIED | read | leads only |
| B-22 | Detail sheet — download invoice PDF | fetch + open | `:732` | 4 | same | 4 | CARRIED | `GET /invoices/:id/pdf` | invoices only |
| B-23 | Detail sheet — payment schedule | open schedule builder | `:782` | 4 | same | 4 | CARRIED | `POST /invoices/:id/schedule` | invoices only; renders on `has_schedule` |
| B-24 | Schedule builder — add/remove milestone, save | build a schedule | `:1059, :1079, :1103` | 6 | same | 6 | CARRIED | `POST /invoices/:id/schedule` | milestone list is user-built, variable |
| B-25 | Milestone mark-paid | settle a milestone | `:810` | 5 | Today verb candidate | 1 | **SURFACED** | `POST /schedules/:id/paid` | only where a schedule exists |
| B-26 | Detail sheet — Mark lost + confirm | lose a lead | `:844, :872` | 5 | same | 5 | CARRIED | `PATCH /leads/:id/state` | leads only |
| B-27 | Undo toast action | reverse the last mutation | 1 | Today/room shared toast | 1 | CARRIED | inverse of the origin route | appears after a mutation only |

**B-13 is a dead control on a live surface.** `SliceShell.tsx:586` — the swipe-right "Repeat" on expenses calls `showToast('Repeat-last lands with the AddSheet rebuild (A4).', 'success')` and nothing else. It writes nothing, it navigates nowhere, and it reports **success**. Under the never-a-false-done house law that is a control telling a paying vendor a thing happened when nothing did. It is filed at §9.2 and it needs a ruling, not a port.

### 4.4 · Calendar (`app/vendor/calendar/page.tsx`, 743 lines)

| # | Control | Verb | Line | Taps today | Proposed home | Taps proposed | State | Endpoint | clause 3 |
|---|---|---|---|---|---|---|---|---|---|
| C-1 | Month · Weddings toggle | switch view | `:303` | 2 | same, room header | 2 | CARRIED | — | fixed two-way |
| C-2 | Previous month | navigate | `:331` | 2 | same | 2 | CARRIED | — | — |
| C-3 | Next month | navigate | `:351` | 2 | same | 2 | CARRIED | — | — |
| C-4 | Hot Dates toggle | overlay hot dates | `:406` | 2 | same | 2 | CARRIED | `GET /hot-dates` | overlay set is data-derived |
| C-5 | Day cell tap | open the day sheet | `:500` | 2 | same | 2 | CARRIED | `GET /vendor/day/:vendorId` | **42 cells, per-cell state from `byDate`, `blockMap`, `hotSet`** — every cell's badges depend on the account's rows; §9.4 ⑤ |
| C-6 | Add-event FAB | open AddSheet (event) | `:682` | 2 | Room FAB | 2 | CARRIED | `POST /events` | — |
| C-7 | Day sheet — block a date | block full-day or slot | `CalendarBlockSheet.tsx` | 4 | Today card `date_asked` verb | 1 | RELOCATED | `POST /availability` | — |
| C-8 | Day sheet — unblock | remove a block | `CalendarBlockSheet.tsx` | 4 | room | 4 | CARRIED | `DELETE /availability/:id` | only where a block exists |
| C-9 | Day sheet — crew assignment | assign members | `CalendarCrewSheet.tsx` | 4 | room | 4 | CARRIED | `PATCH /events/:id` | Prestige-tier surface |
| C-10 | Bands board | wedding-band view | `CalendarBands.tsx` | 2 | room | 2 | CARRIED | `GET /bands` | band rows data-derived |

**C-5 is the ledger's densest clause-3 row.** A month grid is 42 cells and each one's rendered state — event count, block badge, hot-date dot, today ring, selection — is computed from three maps built from the account's own rows. A fixture with one event proves one cell. §9.4 ⑤ is the SELECT that describes the real grid.

### 4.5 · Storefront and its three sections

| # | Control | Verb | Home today | Taps today | Proposed home | Taps proposed | State | Endpoint | clause 3 |
|---|---|---|---|---|---|---|---|---|---|
| ST-1 | Portfolio row | navigate | `storefront:96` | 2 | Rooms → Storefront → Portfolio | 3 | **SURFACED** | — | fixed 3 rows |
| ST-2 | Discover row | navigate | `:97` | 2 | same +1 | 3 | **SURFACED** | — | — |
| ST-3 | Collab row | navigate | `:98` | 2 | same +1 | 3 | **SURFACED** | — | — |
| ST-4 | Discover Profile link | navigate | `:250` | 2 | same | 3 | **SURFACED** | — | — |
| P-1…P-22 | Portfolio controls | upload, caption, cover, reorder, delete, IG connect/import/disconnect, filter, preview | `portfolio/page.tsx:254…1456` (22 `onClick`) | 3–6 | Storefront room, unchanged body | 4–7 | CARRIED | §5 portfolio + ig block | **grid length = image count; `full` gates the upload button on a cap** — §9.4 ⑥ |
| P-X | IG auth probe buttons A/B/C/D + "Refresh the link" | four competing auth launches | `:1226-1244` | 4 | — | — | **SURFACED** | `GET /ig/authorize-url` | debug scaffolding on a live surface — §9.3 |
| D-1…D-8 | Discover status controls | submit, withdraw, jump to portfolio, jump to profile | `discover/page.tsx:187…468` | 3–4 | Storefront room | 4–5 | CARRIED | §5 discover block | state-gated on `discover_request_state` |
| DP-1…DP-6 | Discover profile editor | edit and save the public profile | `discover/profile/page.tsx` | 3–4 | same | 4–5 | CARRIED | `PATCH /vendor/me` + discover block | — |
| CO-1…CO-19 | Collab controls | post, respond, manage responses | `collab/page.tsx` (19) + `responses/page.tsx` (6) | 3–5 | same | 4–6 | CARRIED | §5 collab block | post list + response list both data-derived |

**ST-1…ST-4 all breach W-1's ≤ clause by exactly one tap**, for the same structural reason as S-4: a door becomes a room, and everything behind it inherits the extra hop. They are grouped as one ruling at §8.2 rather than four.

### 4.6 · The nine door-less surfaces (More + coin only)

These are the surfaces BottomNav's own header names as lighting no tab. Their tap counts are the ledger's worst, and they are the merge sheet's raw material.

| # | Surface | Job | Path today | Taps to the job | Proposed home | Taps proposed | State | Endpoint |
|---|---|---|---|---|---|---|---|---|
| M-1 | Couture | manage appointment slots | More → Couture | 2 → 3 to act | Rooms → Couture | 2 → 3 | CARRIED | §5 couture block |
| M-2 | Featured | submit for a promoted slot | More → Featured | 2 → 3 | Rooms → Featured | 2 → 3 | CARRIED | `POST /featured/submit` |
| M-3 | Team Hub | reach Team/Tasks/Payments | More → Team Hub | 2 | Rooms → Team | 2 | CARRIED | read |
| M-4 | Team (roster) | add/edit/remove a member | More → Team Hub → Team | 3 → 4 | Rooms → Team → roster | 3 → 4 | CARRIED | §5 team block |
| M-5 | Tasks | assign, complete, delete a task | More → Team Hub → Tasks | 3 → **4** | Today card `team_ask` verb | **1** | RELOCATED | `POST/PATCH /studio/tasks` |
| M-6 | Team Payments | log and settle crew payments | More → Team Hub → Payments | 3 → 4 | Rooms → Team → Payments | 3 → 4 | CARRIED | §5 payments block |
| M-7 | TDS | add, delete, export entries | More → TDS | 2 → **3** | Rooms → TDS | 2 → 3 | CARRIED | §5 tds block |
| M-8 | Contracts | upload, send, mark signed, cancel | More → Contracts | 2 → **4** | Today card `contract_unsigned` verb | **1** | RELOCATED | §5 contracts block |
| M-9 | Notes to Self | jot and delete notes | More → Notes | 2 → 3 | Rooms → Notes (merges with the Notes slice — §7.3) | 2 → 3 | **SURFACED** | `POST/DELETE /notes` |
| M-10 | Settings | edit profile, UPI, GSTIN, handle, invoice prefix, slot capacity | More → Settings, or coin → Settings | 2 → 3 | Rooms → Settings | 2 → 3 | CARRIED | §5 me block |
| M-11 | Billing | subscribe, upgrade, cancel | More → Billing, or coin → Billing | 2 → 3 | Rooms → Billing | 2 → 3 | CARRIED | §5 billing block |
| M-12 | Sign Out | end the session | More → Sign Out, or coin → Sign Out | 2 | Rooms footer + coin | 2 | CARRIED | client-side `clearVendorSession` |

**M-8 is the W-1 headline.** Getting a contract signed — one of A-2's named top five — costs **four taps** today, and every one of them is through an unlabelled overflow index. A Today card with an inline verb is one. That is the single clearest case in this ledger for the whole worklist premise.

### 4.7 · The coin drawer (9 items, 23 surfaces)

| # | Item | Verb | Line | State | Note |
|---|---|---|---|---|---|
| K-1 | Discover Profile | push `/vendor/discover/profile` | `Header:262` | CARRIED | — |
| K-2 | Settings | push `/vendor/settings` | `:289` | CARRIED | duplicate of M-10 by ruling (F-09.118 C2, founder-approved) |
| K-3 | Billing | push `/vendor/billing` | `:307` | CARRIED | duplicate of M-11 by ruling |
| K-4 | The Dream Wedding | open the marketing site | `:308` | CARRIED | external |
| K-5 | Tips & Features | open TipsCarousel | `:309` | CARRIED | mini manual |
| K-6 | Dark (Espresso) | set theme | `:313` | **SURFACED** | see §9.5 — the theme set may have moved under this control |
| K-7 | Light (Parchment) | set theme | `:314` | **SURFACED** | same |
| K-8 | DreamAi on WhatsApp | open `wa.me` | `:331` | CARRIED | external, hard-coded number |
| K-9 | Sign Out | end session | `:332` | CARRIED | duplicate of M-12 |

### 4.8 · Auth and onboarding (chromeless, outside the shell)

| # | Surface | Controls | State | Endpoint |
|---|---|---|---|---|
| A-1 | `pin` | PIN entry keypad | CARRIED | `POST /auth/set-pin` |
| A-2 | `pin-login` | PIN entry, forgot link | CARRIED | `POST /auth/pin-login` |
| A-3 | `pin-reset` | OTP request, verify, new PIN | CARRIED | `POST /auth/forgot-pin`, `/auth/verify-otp`, set-pin-with-token |
| A-4 | `onboarding` | the mandatory form, 5 controls | CARRIED | onboarding block |
| A-5 | `discover/leads` | zero controls — a readout | CARRIED | read |
| A-6 | `discover/preview` | back, open public view | CARRIED | `GET /discover/preview` |
| A-7 | `discover/submit` | the submission form | CARRIED | `POST /discover/request` |

**These seven are outside the worklist's frame** and travel unchanged. They are recorded so the census is complete and so nobody later mistakes their absence from the merge sheet for an oversight.

---

## §5 · THE WRITE-ENDPOINT MAP — PHASE 4'S TRACE-BENCH INPUT

Every write the vendor shell can perform, derived from `lib/vendor/api/vendor.ts` by call site. **Phase 4's bench asserts that each Today verb hits the route named here and no other.** A verb that invents a new write is a Phase 4 failure by construction.

**Leads** — `POST /api/v2/vendor/leads` (`:579`) · `PATCH /api/v2/vendor/leads/:id` (`:605`) · `PATCH /api/v2/vendor/leads/:id/state` (`:232`) · `DELETE /api/v2/vendor/leads/:id` (`:586`)

**Clients (binder plane)** — `POST {binderBase}` (`:625`) · `POST {binderBase}/:id/edit` (`:636`) · `POST {binderBase}/:id/hide` (`:647`)

**Invoices** — `POST {binderBase}` (`:665`) · `POST {binderBase}/:id/money-edit` (`:672, :700, :726`) · `POST {binderBase}/:id/edit` (`:685`) · `PATCH /api/v2/vendor/invoices/:id/cancel` (`:740`)

**Expenses** — `POST {binderBase}` (`:749`) · `POST {binderBase}/:id/edit` (`:762`) · `POST {binderBase}/:id/money-edit` (`:769`) · `POST {binderBase}/:id/hide` (`:781`)

**Events** — `POST /api/v2/vendor/events` (`:789`) · `PATCH /api/v2/vendor/events/:id` (`:793`) · `PATCH /api/v2/vendor/events/:id/cancel` (`:801`) · `DELETE /api/v2/vendor/events/:id` (`:797`)

**Availability** — `POST /api/v2/vendor/availability` (`:861`) · `DELETE /api/v2/vendor/availability/:id` (`:865`)

**Schedules** — `POST /api/v2/vendor/invoices/:id/schedule` (`:1156`) · `POST /api/v2/vendor/schedules/:id/paid` (`:1159`) · `DELETE /api/v2/vendor/invoices/:id/schedule` (`:1162`)

**Contracts** — `POST /api/v2/vendor/contracts/upload-url` (`:1171`) · `POST /api/v2/vendor/contracts/:id/finalize` (`:1174`) · `PATCH /api/v2/vendor/contracts/:id` (`:1177`) · `POST /api/v2/vendor/contracts/:id/send` (`:1180`) · `DELETE /api/v2/vendor/contracts/:id` (`:1186`)

**TDS** — `POST /api/v2/vendor/tds` (`:1202`) · `PATCH /api/v2/vendor/tds/:id` (`:1205`) · `DELETE /api/v2/vendor/tds/:id` (`:1208`)

**Team** — `POST /api/v2/vendor/studio/team` (`:1063`) · `PATCH /api/v2/vendor/studio/team/:id` (`:1068`) · `DELETE /api/v2/vendor/studio/team/:id` (`:1071`) · `POST /api/v2/vendor/studio/team/:id/rotate-token` (`:1079`)

**Tasks** — `POST /api/v2/vendor/studio/tasks` (`:1091`) · `PATCH /api/v2/vendor/studio/tasks/:id` (`:1097`) · `DELETE /api/v2/vendor/studio/tasks/:id` (`:1100`)

**Team messages** — `POST /api/v2/vendor/studio/messages` (`:1122`) · `PATCH /api/v2/vendor/studio/messages/:id/pin` (`:1125`)

**Team payments** — `POST /api/v2/vendor/studio/team-payments` (`:1140`) · `PATCH /api/v2/vendor/studio/team-payments/:id/mark-paid` (`:1145`)

**Notes** — `POST /api/v2/vendor/notes` (`:1109`) · `DELETE /api/v2/vendor/notes/:id` (`:1112`)

**Portfolio** — `POST /api/v2/vendor/portfolio/upload-url` (`:901`) · `POST /api/v2/vendor/portfolio` (`:907`) · `PATCH /api/v2/vendor/portfolio/:id` (`:917`) · `PATCH /api/v2/vendor/portfolio/:id/hero` (`:921`) · `PATCH /api/v2/vendor/portfolio/reorder` (`:932`) · `DELETE /api/v2/vendor/portfolio/:id` (`:925`)

**Instagram** — `POST /api/v2/vendor/ig/import` (`:994`) · `DELETE /api/v2/vendor/ig/disconnect` (`:998`)

**Discover** — `POST /api/v2/vendor/discover/request` (`:1008`) · `POST /api/v2/vendor/discover/withdraw` (`:1012`)

**Couture** — `POST /api/v2/vendor/couture/availability` (`:1020`) · `DELETE /api/v2/vendor/couture/availability/:id` (`:1024`) · `PATCH /api/v2/vendor/couture/appointments/:id` (`:1032`)

**Featured** — `POST /api/v2/vendor/featured/submit` (`:1043`)

**Identity** — `PATCH /api/v2/vendor/me` (`:807`) · `PATCH /api/v2/vendor/me/routing-handle` (`:811`) · `PATCH /api/v2/vendor/me/invoice-prefix` (`:815`)

**Billing** — `POST /api/v2/vendor/billing/subscribe` (`:839`) · `POST /api/v2/vendor/billing/upgrade` (`:843`) · `POST /api/v2/vendor/billing/cancel` (`:847`)

**Chat / Victor** — `POST /api/v2/vendor/chat` (`:289`) · `PATCH /api/v2/vendor-e/mode` (`:34`) · `POST /api/v2/vendor/chat/thread/fresh` (`:203`) · `POST /api/v2/vendor/chat/glitch-report` (`:212`)

**Auth** — `POST /api/v2/vendor/auth/send-otp` · `/verify-otp` · `/pin-login` · `/set-pin` · `/forgot-pin` (`:481-509`)

**Count: 62 distinct write routes.** The sole-writer law's Phase 3 consequence is stated plainly: `GET /vendor/today` must call **none** of them.

---

## §6 · THE D-4 KIND → SOURCE MAPPING

D-4's rank order is: unanswered leads → money due → contracts unsigned → dates asked → team asks → shop nudges → done-today; ties by age. This section names, for each kind, **the query that answers it** and witnesses every column.

**Schema staleness, checked per the header's own rule before any column below was written.** `PUBLIC_SCHEMA.md` was generated at applied ladder tip `0125`. `ls db/migrations/` shows four files above it — `0126_couple_booking_taxonomy_eleven`, `0127_engagements_pair_key`, `0128_engagements_lead_idx`, `0129_agents_user_id_unique`. Grepped for the D-4 tables, exactly one touches them: **`0128` creates an index on `public.engagements(vendor_id, lead_id)` and adds no column to any table below.** `OUT_OF_ORDER.json` carries no outstanding record. **The document is therefore a sound witness for every column cited here**, and that conclusion is derived rather than assumed.

**One doc-gap found and filed:** `public.engagements` exists in the database (0127/0128 operate on it) and appears **nowhere** in `PUBLIC_SCHEMA.md`. The Business leads handler reads it for the TDW badge. Filed at §9.6.

### 6.1 · `lead_unanswered`

**The query that answers it.** Two candidate sources exist and they disagree; this is the mapping's most important finding.

- **Candidate A — `public.leads` by state.** `src/api/vendor/leads.js:163` reads `supabase.from('leads').select(dataSelect).eq('vendor_id', vendor.id).is('deleted_at', null)`, with the state vocabulary declared at `:16` as `{new, contacted, quoted, booked, lost}`. Columns witnessed at `PUBLIC_SCHEMA.md:658-689` — `id`(1) `vendor_id`(2) `name`(3) `phone`(4) `email`(5) `wedding_date`(6) `wedding_city`(7) `budget_min`(9) `budget_max`(10) `source`(11) `state`(13) `raw_message`(14) `notes`(15) `created_at`(16) `deleted_at`(20) `draft_meta`(28). **There is no `answered_at`, `replied_at`, or equivalent column on this table.** State `new` is the closest available proxy and it is a proxy, not the fact.
- **Candidate B — `public.pending_lead_pings.acknowledged_at`.** Columns witnessed at `PUBLIC_SCHEMA.md:840-853` — `id`(1) `vendor_id`(2) `lead_id`(3) `lead_name`(4) `bride_message`(5) `intent_summary`(6) `source`(7) `created_at`(8) **`acknowledged_at`(9)**. This table carries an explicit acknowledgement timestamp, which is the nearest thing in the estate to a literal answer of "unanswered".

**Proposed mapping, for the founder's ruling (§8.4):**

```sql
-- lead_unanswered, candidate A (state proxy)
SELECT id, name, wedding_date, wedding_city, budget_min, budget_max, state, created_at
  FROM public.leads
 WHERE vendor_id = $1
   AND deleted_at IS NULL
   AND state = 'new'
 ORDER BY created_at ASC;    -- D-4's tie rule: oldest first

-- lead_unanswered, candidate B (acknowledgement fact)
SELECT p.lead_id, p.lead_name, p.intent_summary, p.created_at
  FROM public.pending_lead_pings p
 WHERE p.vendor_id = $1
   AND p.acknowledged_at IS NULL
 ORDER BY p.created_at ASC;
```

**Tier note, non-negotiable:** D-3 requires that Basic-tier lead cards go through the **existing** M-LEADGATE serializer (`src/lib/vendor/leadSerializer.js`, withheld set `{phone, email}` per R-36.13), never a second redaction path. Both candidates above are pre-serializer reads.

### 6.2 · `invoice_due`

Source: **`public.invoices`**, columns witnessed at `PUBLIC_SCHEMA.md:619-644` — `id`(1) `vendor_id`(2) `lead_id`(3) `invoice_number`(4) `client_name`(5) `amount_total`(8) `amount_advance`(9) `amount_paid`(10) `due_date`(11) `state`(12) `last_payment_at`(19) `deleted_at`(20) `has_schedule`(21) `binder_id`(22).

```sql
SELECT id, invoice_number, client_name,
       (amount_total - amount_paid) AS amount_owed,
       due_date, state
  FROM public.invoices
 WHERE vendor_id = $1
   AND deleted_at IS NULL
   AND state <> 'paid'
   AND due_date <= CURRENT_DATE
 ORDER BY due_date ASC;
```

**Plane warning.** The Home zone's overdue lines do **not** come from this table today. See §6.8.

### 6.3 · `contract_unsigned`

Source: **`public.contracts`**, columns witnessed at `PUBLIC_SCHEMA.md:232-251` — `id`(1) `vendor_id`(2) `client_id`(3) `lead_id`(4) `invoice_id`(5) `title`(6) `state`(11) `sent_at`(12) `signed_at`(13) `created_at`(14).

```sql
SELECT id, title, client_id, lead_id, sent_at, state, created_at
  FROM public.contracts
 WHERE vendor_id = $1
   AND signed_at IS NULL
   AND state NOT IN ('cancelled')
 ORDER BY COALESCE(sent_at, created_at) ASC;
```

`contracts` carries **no `deleted_at`** — witnessed by its absence from the 15-column list. Cancellation is carried in `state`. A Phase 3 filter written on `deleted_at` here would fail; the column does not exist.

### 6.4 · `date_asked`

Source: **`public.events`**, columns witnessed at `PUBLIC_SCHEMA.md:517-539` — `id`(1) `vendor_id`(2) `title`(3) `event_date`(4) `event_time`(5) `kind`(6) `linked_lead_id`(7) `state`(8) `created_at`(10) `deleted_at`(14) `slot`(16) `assigned_member_ids`(18).

The availability handler writes blocks into this same table (`src/api/vendor/availability.js:93` reads `.from('events')`), so holds, weddings and blocks share one table distinguished by `kind` and `slot`.

```sql
SELECT id, title, kind, event_date, event_time, slot, state, linked_lead_id
  FROM public.events
 WHERE vendor_id = $1
   AND deleted_at IS NULL
   AND state = 'upcoming'
   AND event_date >= (CURRENT_DATE AT TIME ZONE 'Asia/Kolkata')::date
 ORDER BY event_date ASC, event_time ASC NULLS FIRST;
```

`public.hot_dates` (`:582-594`) is **not** vendor-scoped — it carries `date`, `region`, `label`, `intensity`, `active` and no `vendor_id`. It is an overlay, never a source for this kind.

### 6.5 · `team_ask`

Source: **`public.team_tasks`**, columns witnessed at `PUBLIC_SCHEMA.md:972-994` — `id`(1) `vendor_id`(2) `assigned_to_member_id`(3) `linked_event_id`(4) `title`(5) `due_date`(7) `priority`(8) `state`(9) `completed_at`(10) `deleted_at`(11) `created_at`(12).

```sql
SELECT id, title, assigned_to_member_id, linked_event_id, due_date, priority, created_at
  FROM public.team_tasks
 WHERE vendor_id = $1
   AND deleted_at IS NULL
   AND state = 'open'
 ORDER BY COALESCE(due_date, created_at::date) ASC;
```

Two adjacent tables are **candidates the founder may want folded into this kind** and are named rather than assumed: `public.team_messages` (`:942-953`, has `pinned`, no state) and `public.team_payments` (`:954-971`, `state` default `'owed'`, `paid_at`). A crew member owed money is arguably a "team ask". Ruled at §8.5.

### 6.6 · `shop_nudge`

**No single table answers this kind.** Derived by search: the nudge concept is assembled client-side today from at least three unrelated reads — `GET /discover/status` (`discover_request_state`, vocabulary `not_requested | requested | approved | denied | revoked`, witnessed in the writers at `src/api/vendor/discover.js:80,131` and `src/api/admin/discover.js:52,65,78`), the portfolio image count, and the profile meter. `public.nudge_optout` exists (`:761-772`) but is an opt-out register, not a nudge source.

**This kind is SURFACED, not mapped.** A ranking slot with no source query is a card that cannot be built. §8.6.

### 6.7 · `done_today`

Source: a union over the completion timestamps of the kinds above — `leads.state IN ('booked','lost')` with no completion timestamp available, `invoices.last_payment_at`, `contracts.signed_at`, `events.state='done'` with no timestamp, `team_tasks.completed_at`. **Two of the five have no completion timestamp at all**, witnessed by their absence from the column lists. A `done_today` list built on state alone cannot answer "today" for leads or events. §8.7.

### 6.8 · THE PLANE SPLIT — the finding this section exists to surface

**The live `/api/v2/vendor/today` route does not read the typed tables the D-4 kinds are defined on.**

Derived: `src/api/vendor/core.js:26` mounts `/today` at `require('../vendor-engine/today')`. That file's own header states the mechanism and the reason. Its reads are `engine.records` — `eng.from('records').select(RECORD_SELECT).eq('agent_id', agentId).eq('hidden', false)` at `src/api/vendor-engine/today.js:61-64` — and it **re-derives** the response shape from the binder ledger:

- `overdue_invoices` ← binders with `amount_pending > 0` and a past date
- `new_leads` ← lead-stage binders
- `money_snapshot` ← summed from `amount_received` / `amount_pending`

Only the calendar slices read `public.events`. Meanwhile the Business rooms read the **typed** plane: `src/api/vendor/leads.js:163` is `public.leads`, `src/api/vendor/invoices.js:192` is `public.invoices` — and `lib/vendor/api/vendor.ts:220-224` records the TDW_03 (A) CE ruling that made it so, LD-1: *typed tables own leads*.

**Consequence, stated plainly:** Home's "What's waiting" and the Business Leads room can disagree about what is waiting, because they are reading two different planes. Phase 3 must rule which plane `GET /vendor/today` reads before a line of it is written, and D-4's kinds as defined in §6.1–§6.7 are **typed-plane** definitions.

**And D-3 names a file that is a tombstone.** The roadmap proposes `src/api/vendor/today.js`. That path does not exist:

```
ls src/api/vendor/today.js        → No such file or directory
git log --oneline -1 -- src/api/vendor/today.js
  → f47c732  … F-09.50 the dead reader deleted with F-09.63 its lying header …
```

It was deleted precisely because a comment there called it live long after the Phase-4 flip had unmounted it. **Re-minting a module at the exact path of a file deleted for lying about being live is a name collision with a documented history**, and Phase 3's kickoff should choose a different path or state the reuse deliberately. §8.8.

---

## §7 · THE MERGE SHEET (W-2) — PROPOSALS, NOT PICKS

A-3 amends this sheet to consolidate the **real** enumerated surface set, not the roadmap's twenty. Each proposal below carries its jobs-per-room evidence. **This desk proposes; the founder rules. Nothing here is decided.**

**The measure used:** a room earns its own seat if it carries **≥3 distinct jobs** a vendor performs in a normal month, or if it carries a **money or legal fact** (which must never be nested behind a general room), or if it is **reached from outside the app** (a WhatsApp template deep link). Rooms below the bar are proposed for folding.

### 7.1 · Proposal M-α — Fold the four Storefront sections into one room with pills

**Rooms folded:** Portfolio · Discover · Discover Profile · Collab · Discover Preview · Discover Submit · Discover Leads (7 surfaces → 1 room, 4 pills).
**Jobs-per-room evidence:** Portfolio carries 22 controls / ~9 distinct jobs. Discover carries 8 controls / 3 jobs (submit, withdraw, check state). Discover Profile carries 6 / 1 job (edit and save). Collab carries 25 across two pages / 4 jobs. Preview, Submit and Leads carry 2, 5 and **0** controls respectively — Leads is a pure readout.
**Argument for:** the Storefront door already names them; Paper A already seated them there; four pills is the pattern the Business door already proves at six.
**Argument against:** it costs every one of them one tap (ST-1…ST-4 above), and Portfolio is a heavy, frequently-visited surface that arguably deserves a pin rather than a nesting.
**Cheapest alternative:** Portfolio becomes a pinnable room in its own right; the other six fold.

### 7.2 · Proposal M-β — Fold Team Hub's three leaves into one room with pills

**Rooms folded:** Team Hub · Team · Tasks · Team Payments (4 surfaces → 1 room, 3 pills).
**Jobs-per-room evidence:** Team Hub itself carries **zero controls** — it is a menu of three rows and a tier wall. Team carries 11 controls / 4 jobs. Tasks 13 / 4. Team Payments 11 / 3.
**Argument for:** Team Hub is a menu whose only job is to point at three things; a pill row does that job with one fewer screen. It removes a whole tap from M-5's four.
**Argument against:** none identified. The tier gate rides the room, unchanged.
**This desk's read:** the strongest proposal on the sheet. A zero-control screen whose entire purpose is a three-item menu is the clearest fold in the estate.

### 7.3 · Proposal M-γ — Merge "Notes to Self" with the Notes slice

**Rooms folded:** `/vendor/studio/notes` · the `notes` slice inside Business (2 surfaces → 1).
**Jobs-per-room evidence:** both are a list of the vendor's own jotted notes. `POST /api/v2/vendor/notes` (`vendor.ts:1109`) and `DELETE /api/v2/vendor/notes/:id` (`:1112`) are the writes for one of them.
**The evidence gap, declared:** this desk did **not** derive whether the two surfaces read the same rows. `public.notes` (`:749-760`) carries `vendor_id`, `conversation_id`, `content`, `tags[]`, `couple_id` — the `tags[]` column is how the leads state-change trail is filed (`src/api/vendor/leads.js:399-405`), so `public.notes` is **also** an audit log. Whether the two surfaces filter it differently is unresolved. **This proposal must not be ruled until that is derived** — Phase 1's first read.

### 7.4 · Proposal M-δ — Fold Couture and Featured into a "Growth" room

**Rooms folded:** Couture · Featured (2 → 1, 2 pills).
**Jobs-per-room evidence:** Couture 7 controls / 3 jobs (add slot, remove slot, respond to an appointment). Featured 5 / 1 job (submit).
**Argument for:** Featured is a one-job surface with its own top-level seat in More; a one-job surface rarely earns a room.
**Argument against:** the two share no vocabulary. "Growth" is a word neither surface uses today, and A-5's spirit — no new copy without a veto — reaches a room name.
**Blocked on copy:** the room's name is a founder byte. This desk proposes the fold and **not** the word.

### 7.5 · Proposal M-ε — Money and legal rooms stay unfolded

**Rooms kept whole:** Invoices · Expenses · TDS · Contracts · Billing · Team Payments (as a pill of M-β).
**Evidence:** every one carries a money or legal fact. TDS carries 8 controls including a CSV export the vendor files taxes from. Contracts carries 13 controls and the `signed_at` fact. Under the house money-register law and the live-estate premise, nesting a legal record behind a general room to save a tap is a trade this desk will not propose.

### 7.6 · What the sheet does to the count

| | Today | Under the full sheet |
|---|---|---|
| Addressable surfaces | 35 | 35 (nothing is deleted) |
| Top-level rooms | 9 door-less + 5 doors + 6 slices = 20 seats, unevenly reachable | **11 rooms + 2 nav seats + pins** |
| Deepest job | 4 taps (contract signed, task assigned) | 1 tap via Today; 3 via room |

**⛔ STOP — D-10.**
**The merge sheet ends here. Nothing in §7 is decided. §7.1 through §7.5 are five proposals awaiting the founder's ruling, and §7.3 carries a declared evidence gap that must be closed before it can be ruled at all. No Phase 1 byte may assume any of them.**

> **AMENDED 2026-08-27 (CE-37):** the rulings this STOP awaited are now TAKEN and recorded at §11 below. The STOP is preserved unedited as the record of the gate it was.


---

## §8 · THE SURFACED ROWS — WHAT THE FOUNDER RULES

Every SURFACED row in §4, gathered. Each carries a **proposed** word and no taken one.

**8.1 · W-1's floor collision (rows H-2, H-3, H-4).** Three of A-2's top five already cost one tap on the top-three Home path. Strictly-fewer-than-one does not exist. *Proposed:* measure W-1 against the **full-list path** (3 taps for a lead outside the top three), and record the top-three shortcut as already-at-floor with a ≤ obligation. *Alternatives:* relax W-1 to ≤ for these three rows; or rule that the Today feed's uncapped list replaces the ceiling-of-three, which changes the job rather than the count.

**8.2 · The door-to-room demotion (rows S-4, ST-1…ST-4).** Storefront and its three sections each gain one tap. *Proposed:* Storefront is a **default pin** alongside Calendar, which restores the count exactly. *Alternative:* accept the +1 and rule W-1's ≤ clause to exempt demotions from a door to a room.

**8.3 · The expenses "Repeat" control (row B-13).** It writes nothing and reports success. *Proposed:* **REMOVED-BY-RULING** — do not port it. *Alternative:* build the repeat-last job in Phase 2 and port it working. What must not happen is a byte-for-byte carry of a control that lies.

**8.4 · `lead_unanswered`'s source (§6.1).** Two candidates, one a state proxy and one an acknowledgement fact. *Proposed:* **Candidate A** (`leads.state = 'new'`), because it is the plane the Business room already reads and the serializer already guards, with Candidate B held as a Phase 3 enrichment. *Alternative:* B as primary, which is truer to the word "unanswered" but reads a table with no serializer path.

**8.5 · `team_ask`'s membership (§6.5).** *Proposed:* `team_tasks` only. *Alternative:* include `team_payments` where `state = 'owed'`, which folds a money fact into a team kind — this desk flags that as a category mix and does not recommend it.

**8.6 · `shop_nudge` has no source query (§6.6).** *Proposed:* **park the kind** for Phase 3 and ship six of the seven; re-open it when a single source exists. *Alternative:* define it in Phase 3 as a client-side derivation over three reads, which puts judgement in the UI layer.

**8.7 · `done_today` cannot answer "today" for two kinds (§6.7).** Leads and events carry no completion timestamp. *Proposed:* `done_today` covers only the three kinds that can prove it (invoices, contracts, tasks) and says so on the card. *Alternative:* a migration adding completion timestamps — out of Phase 0's scope and named, not authored.

**8.8 · Phase 3's module path (§6.8).** D-3 names `src/api/vendor/today.js`, a path deleted for carrying a false liveness claim. *Proposed:* Phase 3 builds at a fresh path and the roadmap's D-3 sentence is amended at the next seam. *Alternative:* reuse the path deliberately with a header that records the tombstone.

**8.9 · The plane split (§6.8).** Home and Business disagree by construction. *Proposed:* `GET /vendor/today` reads the **typed** plane, matching the rooms, and the engine-backed reader is retired at the same seam. *Alternative:* keep the engine reader and accept that Today and the rooms count differently — this desk names that as the disease and does not recommend it.

**8.10 · The onboarding tour's anchors (row H-14).** `data-tour` hooks point at chrome the new shell replaces. *Proposed:* the branch shell carries equivalent anchors from Phase 1 so the tour is never broken in the same commit as the nav. *Alternative:* the tour is re-authored in Phase 2, with its copy re-vetoed.

**8.11 · The theme control set (rows K-6, K-7).** The coin offers Dark (Espresso) and Light (Parchment). `TDW_09_UIUX_FINAL.md:94` records that LD-9 was amended so the vendor side carries exactly two curated themes, **Midnight and Porcelain**, with espresso retired and deleted. The coin's two items name neither. *This desk did not derive which is true at tip* and states that rather than guessing. *Proposed:* Phase 1's read-first settles it by command before either theme control is ported.

**8.12 · The IG auth probe buttons (row P-X).** `portfolio/page.tsx:1226-1244` ships four labelled probe launches — "A — plain link", "B — link, new tab", "C — window.open", "D — location.href" — plus a "Refresh the link" button. *Proposed:* **do not port**; the branch carries the one arm that works. *Alternative:* keep them if the IG auth question is still open, in which case they need a gate. Under A-1 these are visible to paying vendors today. §9.3.

**8.13 · Room atmospheres (row S-8).** `roomClassForPath`'s prefix vocabulary is replaced by the rooms model. *Proposed:* the branch keeps the same two atmospheres keyed to the merged rooms' own prefixes, zero visual delta, cell-asserted — the same discipline the last re-key used. *Alternative:* atmospheres retire with the doors.

**8.14 · Notes duplication (rows M-9, §7.3).** Blocked on the evidence gap named in §7.3. *Proposed:* derive first, rule second.

---

## §9 · DRIFT AND FINDINGS FILED

**9.1 · The roadmap's room list is inaccurate in both directions — RATIFIED at A-3.**
Phase 2 says *"For each of the 20 rooms"* and names them. Derived against the tree:
- **Named as rooms but not routes:** *Plan*, *Theme*, *PIN*, *Glitch*, *Sign out*. Theme and Sign out are coin items; Glitch is a chip inside the risen chat; PIN is an auth surface outside the shell; **no surface named "Plan" exists under `app/vendor/**` at `28df2b0`**.
- **Routes the list never names:** `billing`, `onboarding`, `more`, `discover/leads`, `discover/preview`, `discover/profile`, `discover/submit`, `studio/tasks`, `studio/team-payments`, `pin-login`, `pin-reset`, `collab/[post_id]/responses` — twelve.
- **The roadmap's own stale premise:** its subtitle (*"test on the three test accounts"*) and Phase 6's gate are read as amended per A-1. The file is byte-untouched by this delivery.

**9.2 · `SliceShell.tsx:586` — a control that reports success and writes nothing.**
Swipe-right on an expense row fires `showToast('Repeat-last lands with the AddSheet rebuild (A4).', 'success')`. No endpoint, no navigation, `'success'` register. Under the never-a-false-done house law this is a live surface confirming an act that did not occur, to a paying vendor. Ruling at §8.3.

**9.3 · `portfolio/page.tsx:1226-1244` — four auth probes and a refresh button, shipped.**
Labelled A/B/C/D by mechanism. This is diagnostic scaffolding on a surface ~22 paying vendors can open. Not a Phase 0 cure; filed because A-1 changes what it costs. Ruling at §8.12.

**9.4 · Fixture-state SELECTs — the clause-3 rows this container could not settle.**
Six rows above are marked DECLARED-UNDERIVED because production data is unreachable from an LE container. Per the fixture-state law, the SELECTs ship **first** and the Phase 1 walk card is authored from the pasted rows, never the other order. They are **not** delivered in this ZIP: this is a read-only docs sitting and a runnable block travelling beside an unruled ledger is the conditional-withheld class. They are named here by shape and ship in Phase 1's kickoff:
① lead counts by `state` for vendor `9888294440` · ② unpaid invoice count and oldest `due_date` · ③ upcoming `events` in the next 7 days · ④ distinct badge values across each slice · ⑤ the current month's per-day event/block/hot-date counts · ⑥ the portfolio image count against the tier cap.

**9.5 · The theme vocabulary may have moved under the coin.** See §8.11. Stated as an open question, not a finding — this desk did not run the command that would settle it.

**9.6 · Doc-gap: `public.engagements` is absent from `PUBLIC_SCHEMA.md`.**
Migrations `0127` and `0128` operate on it; `0128`'s own comment describes the Business leads handler querying it per page. The snapshot at tip `0125` predates the table. Filed as a doc-gap for the next regen, per the SQL-provenance law's standing clause. No column of it is cited anywhere in this ledger.

**9.7 · `contracts` has no `deleted_at`.** Witnessed by absence from its 15-column list. Recorded because four sibling tables have one and a Phase 3 filter written from habit would fail here.

---

## §10 · THE SIGNATURE BLOCK

This ledger is complete when the founder rules:

1. **§8.1** — W-1's floor collision on the three one-tap Home jobs.
2. **§8.2** — the door-to-room demotion, Storefront and its three sections.
3. **§8.3 · §8.12** — the two live controls that should not be ported as they stand.
4. **§8.4 · §8.5 · §8.6 · §8.7** — the four D-4 kinds whose sources are contested, absent, or partial.
5. **§8.8 · §8.9** — Phase 3's module path and the plane split.
6. **§8.10 · §8.11 · §8.13 · §8.14** — the tour anchors, the theme set, the atmospheres, the notes duplication.
7. **§7.1 through §7.5** — the merge sheet, five proposals, none taken. §7.3 is blocked on the evidence gap it declares.

**Phase 1's kickoff is written only after that signature.** Phase 1 carries the branch mechanics, the founder's Vercel and CORS steps, and the manifest-name veto per R-37.42 — none of which is this sitting's work.

Sequencing beyond this sitting is the founder's.

> **SIGNED 2026-08-27 (CE-37, founder words of 2026-08-26 quoted at §11):** every item enumerated above now carries a taken ruling at §11. Phase 1 opens.



---

## §11 · THE SIGNATURE — RULINGS TAKEN (amendment, CE-37, 2026-08-27)

Filed to cure the disease a Phase 1 seat convicted at this file's own hash: the rulings below were taken in the founder's chat on 2026-08-26 and lived nowhere a fresh clone could read. They land here verbatim-anchored. Founder words are quoted where they are the authority; everything else is the chair's ruling under them. Nothing in §7/§8 above is rewritten — this section is the signature §10 awaited.

**The founder's words of record, 2026-08-26:** 「1-5 as recommended」 (ruling §7.1-alt, §7.2, §7.4-fold, §7.5, §8.2 in one stroke) · 「couture with a featured list」 (the §7.4 room name) · 「yes on hygiene micro」 (§8.3's execution order).

**THE MERGE SHEET (§7), ruled:**
- **§7.1 M-α → THE ALTERNATIVE ARM.** Portfolio is its own pinnable room; the other six Storefront surfaces fold into one room with pills. [R-37.43]
- **§7.2 M-β → FOLD.** Team Hub's zero-control menu dies; one room, three pills, tier gate rides. [R-37.43]
- **§7.3 M-γ → RESOLVED BY DERIVATION, no merge exists to perform.** Both doors render the shared `NotesBody` → `GET /api/v2/vendor/notes` → `owner_notes`; `public.notes` is touched by neither (it is the agent-context and leads-trail plane). One Notes room in the shell; the second door drops. Evidence: the Phase 1 seat's read-first at `aae3f99`/`c1d35cb`, chair-verified. [R-37.54]
- **§7.4 M-δ → FOLD.** The room is **Couture**; **Featured** is a pill inside it. Founder byte verbatim above; zero new copy. [R-37.44]
- **§7.5 M-ε → CONFIRMED.** Money and legal rooms stay whole.

**THE SURFACED ROWS (§8), ruled — each per its own *Proposed* arm unless stated:**
- **§8.1** W-1 measures the full-list path; the top-three Home jobs record at-floor with a ≤ obligation. [R-37.43]
- **§8.2** Storefront joins Calendar as a default pin. [R-37.43]
- **§8.3** REMOVED-BY-RULING — **EXECUTED**, dreamos-pwa `aae3f99` (M-HYGIENE). [R-37.43]
- **§8.4** Candidate A (`leads.state = 'new'`), B held as Phase 3 enrichment. **§8.5** `team_tasks` only. **§8.6** `shop_nudge` parked; six kinds ship. **§8.7** `done_today` covers the three provable kinds and says so on the card. **§8.8** fresh module path; the roadmap's D-3 sentence amends at the next seam. **§8.9** the typed plane; the engine-backed reader retires at the same seam. **§8.10** the branch shell carries equivalent tour anchors from Phase 1. [all R-37.43]
- **§8.11** SETTLED BY COMMAND: `lib/vendor/theme.ts:219` (Addendum A — Espresso + Editorial Paper) supersedes `TDW_09_UIUX_FINAL.md:94`; K-6/K-7 are CARRIED. The coin's "Parchment" subtitle is filed as **F-09.189** (vendor-facing vocabulary drift; cure-word is the founder's; main-side micro, outside this arc). [R-37.43]
- **§8.12** Do-not-port RULED. The live `?igprobe=1` ladder is URL-gated (`portfolio/page.tsx:349`, chair-derived, correcting an earlier over-grade owned as c-37.7); its retirement wants R-1 as predicate and stays queued. [R-37.43]
- **§8.13** Atmospheres re-key to the merged rooms' prefixes, zero visual delta, cell-asserted. [R-37.43]
- **§8.14** → §7.3 above. [R-37.54]

**Standing beside these:** R-37.41 (D-1…D-8 adopted as proposed; amendments A-1…A-6 as recorded in §0/§3 of this ledger) · R-37.42 (the branch-PWA model, already woven through this file) · the full R-37 register banks in FINDINGS_LOG at CE-227, which supersedes this section as the register of record when it lands.

**Phase 1 is OPEN against this file at its post-amendment hash.**
