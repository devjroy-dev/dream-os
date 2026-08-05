# TDW_09 · UX BLUEPRINT · STAGE 1 — THE IA MAP
### Both apps, every route: entry points, edges, depth, orphans, dead ends — with every verdict graded

**Bases:** dream-os `e0ff7d9` · dreamos-pwa `e3210b5`, re-derived at origin fetch-first at session open.
**Authority:** the UX Blueprint kickoff + CE ruling R-X1–R-X5 (2026-08-05). Charter item 1.
**Instrument:** `tools/tdw09_ia_map.py` (ships in this ZIP; `TDW_PWA=<pwa clone> python3 tools/tdw09_ia_map.py`, emits `tools/ia_map.json` with the full per-route record).

**THE ONE QUESTION THIS ARTIFACT EXISTS TO ANSWER** *(the R-U14 standing check)*: can the founder see, on one page, how every screen in both apps is reached and left — and which screens are reached by nothing?
**THE OBSERVATION THAT WOULD PROVE IT FAILED:** the founder navigates to any screen along a path this map does not carry, or a screen this map calls linked turns out unreachable on his phone.

---

## 1 · METHOD AND ITS CONVICTION RECORD — DECLARED FIRST

Three passes, deliberately differing failure modes; UNRESOLVED is never GREEN; orphan/dead-end verdicts are **FLOORS** (no statically visible edge), never convictions — each residue below is hand-classified.

| Pass | Derives | Failure mode, named |
|---|---|---|
| **P-A** route walk of `app/**/page.*` | 124 surfaces (cross-checks Paper 1's census by an independent method — same figure) | silent on non-app-router mounts; blind to `middleware.ts` rewrites, which were **read by hand** instead (§2) |
| **P-B** edge extraction — `router.push/replace`, `<Link>`, `<a>`, `window.location` (assignment **and** `.replace()/.assign()`), `redirect()`, object-property `href:/path:/route:/deeplink:`, variable-prefix templates | 1,401 resolved edges | blind to hrefs assembled in variables before the call site (16 computed-nav sites counted, not resolved); blind to server-driven navigation |
| **P-C** resolution — pattern match; variable-prefix templates by **unique literal-suffix** match, lane-context tiebreak, ambiguity → UNRESOLVED | the graph | runtime-conditional targets emit UNRESOLVED (8); targets matching no route emit MISS (13) and are hand-classified in §6 |

**The instrument was wrong four times during construction, each caught by hand-reading source against its output, each rewritten rather than tuned** — published because a map that hides its conviction record is asking to be trusted on the wrong grounds:

1. **The literal-only Link scan** missed the estate's dominant idiom — nav config objects (`{ href: '/vendor/calendar' }` in `components/vendor/BottomNav.tsx:94`) — and reported 89 orphans. Object-property extraction added; 89 → 45.
2. **The suffix resolver's first draft let route-side `[param]`s swallow literal segments** — `/crew/[token]` "matched" `` `${base}/list` ``. Hand-replicated, tightened to literal-vs-literal; demo-mirror false orphans died.
3. **`window.location.replace('/frost/canvas/onboarding')` is a call, not an assignment**, and the first `loc` pattern missed it (`sanctuary/page.tsx:3998`). Pattern added.
4. **The scanner read comments** and resurrected a deliberately retired tab (`app/coplanner/TabBar.tsx:7`'s "WHAT STOOD HERE" block) into the graph as a broken link. Comments now stripped before scanning — the estate documents its dead verbatim, and a scanner that reads epitaphs as edges convicts the graveyard.

Two structural attributions, stated so nobody reads more than was measured: **layout-borne edges** (e.g. `app/admin/layout.tsx`'s 22-entry NAV) are attributed to every route the layout wraps — a persistent sidebar is on every screen beneath it; and **layout-imported chrome** (BottomNav imported by `app/vendor/layout.tsx`) spreads the same way, resolved one import hop deep, literal specifiers only.

---

## 2 · ENTRY POINTS — HOW ANYONE GETS IN AT ALL

Derived from `middleware.ts` (hand-read), the auth flow, and the external-link census:

| Entry | Mechanism | Lands on |
|---|---|---|
| `thedreamwedding.in` | root | `/` — the eleven-screen landing machine (Paper 2) |
| `demo.thedreamwedding.in/vendor/[handle]` | `middleware.ts` subdomain rewrite | `/demo/vendor/[handle]` — the tease |
| `demodreamer.thedreamwedding.in` | rewrite | `/frost` → redirects `/frost/canvas/sanctuary` (`frost/page.tsx:11`, per sanctuary's own comment at `:1663`) |
| `demodiscover.thedreamwedding.in` | rewrite | `/demodiscover` |
| `demobride.…` | rewrite | `/demo/bride` |
| WhatsApp circle invite | external link | `/circle/join/[token]` — deliberately terminal entry |
| WhatsApp crew link | external link | `/crew/[token]` — deliberately terminal entry (F-04.123 item 2's phishing-look debt stands, founder DNS act) |
| Post-auth vendor | landing `:517` computed push | `/vendor/pin` or `/vendor/pin-login` |

The subdomain and token screens **are not orphans** — they are doors. The instrument cannot see middleware, which is why middleware was read by hand and is listed here rather than silently trusted to the graph.

---

## 3 · THE LANE MAPS — every screen, its purpose in one plain sentence

Grade per row: **[D]** purpose derived from the screen's source this sitting · **[C]** carried from a Phase 1/Block 08 derivation, cited · **[N]** stated from route name + lane context, owed a walk. A screen whose purpose cannot be stated in one honest sentence is a finding, and two below are.

### 3.1 · VENDOR (29 surfaces) — hub-and-spoke off BottomNav's two modes

The nav is **one bar, two item-sets**: mode `studio` shows Calendar · Business · More; mode `discover` shows Portfolio · Leads · Collab (`BottomNav.tsx:93–105`), switched by the Header's ModePill — and switching to studio-mode navigates to `/vendor/calendar` (`Header.tsx:77`). **The word "Studio" in the nav is a mode; the route `/vendor/studio` is a different thing entirely and nothing links to it — §5, F-09.18.**

| Route | Purpose, one sentence | Grade |
|---|---|---|
| `/vendor` | The Hub — today's state and quick actions on open. | [D] |
| `/vendor/calendar` | See and hold wedding dates. | [C] |
| `/vendor/list` → `/vendor/list/[slice]` | The Business ledger — leads, clients, invoices, expenses, events, one slice at a time. | [D] |
| `/vendor/more` | The overflow sheet-as-page: every destination the bar doesn't carry. | [D] |
| `/vendor/portfolio` | Manage the photos Discover shows. | [C] |
| `/vendor/discover` | See and control how the vendor appears on the couple marketplace. | [C] |
| `/vendor/discover/leads` | Enquiries arriving from Discover. | [C] |
| `/vendor/discover/preview` | See your own card as a couple sees it. | [N] |
| `/vendor/collab` | Work shared weddings with other vendors. | [C] |
| `/vendor/couture` | Invite-only appointment book. | [C] |
| `/vendor/featured` | Buy the promoted slot (`Rs 3,000 / week`, compliant register — Paper 4 §6). | [C] |
| `/vendor/team-hub` | The team door: crew, tasks, payments in one place. | [C] |
| `/vendor/studio` | **Cannot be stated in one honest sentence** — its own comment calls it Studio Suite, Paper 5 §2 calls it Team Hub's second entry, the nav calls a different thing "Studio", and nothing links to it. F-09.18. | [D] |
| `/vendor/studio/team` · `/tasks` · `/team-payments` | Crew roster · task board · payout ledger (Prestige-gated leaves). | [C] |
| `/vendor/tds` · `/contracts` | Tax-deduction records · signed agreements. | [N] |
| `/vendor/settings` | Account, tier, and preferences. | [N] |
| `/vendor/pin` · `/vendor/pin-login` · `/vendor/pin-reset` | Set PIN (first time) · enter PIN · recover PIN. | [D] |
| `/vendor/auth/handoff` | Cross-surface session handoff target; **zero in-app inbound and zero external-link witness derivable from this container** — reached, if at all, by a backend-sent URL. Owed one founder sentence: is this door live? | [D] |

### 3.2 · COUPLE / FROST (17 surfaces) — one mega-room and its absorbed siblings

The bride app's real architecture, in its own words: `sanctuary/page.tsx:7` — *"Every slice opens IN THIS PAGE. No router.push. No history stack."* Sanctuary is a **3,900-line single-page state machine**; the sibling canvases are its history. `sanctuary:26` states plainly: *"/frost/canvas/discover is dead."*

| Route | Purpose, one sentence | Grade |
|---|---|---|
| `/frost` | Redirect to sanctuary. | [D] |
| `/frost/canvas/sanctuary` | The bride's whole app: feed, slices, journey, everything, in one page. | [D] |
| `/frost/canvas/muse` | The saved-inspiration board (Muse — charter item 6's subject). | [C] |
| `/frost/canvas/onboarding` | First-run identity + wedding facts; sanctuary hard-navigates here when the session lacks them (`:3998`). | [D] |
| `/frost/canvas/discover` | **Declared dead by the estate's own comment** (`sanctuary:26`); orphaned; renderer extracted into sanctuary at P4b. §5. | [D] |
| `/frost/canvas/dream` · `/frost/canvas/journey` | Orphaned siblings of the same absorption; journey's four **leaves** (`events` · `moments` · `reminders` · `circle/[memberId]`) remain linked from sanctuary and are legitimate spokes. | [D] |
| `/frost/canvas/surprise` | Editorial surprise-me feed. | [N] |
| journey leaves (4) | Wedding events · captured moments · reminders · a circle member's page. | [N] |
| `/circle/join/[token]` | A guest joins the couple's circle from a WhatsApp link — terminal entry by design. | [C] |

### 3.3 · ADMIN (42 surfaces) — a 22-door sidebar over a 42-room house

`app/admin/layout.tsx:96`'s NAV names **22 destinations**. The lane has **42 routed surfaces**. The 17 unlinked screens the graph surfaces (§5) are **F-07.95's phantom-surface population re-derived by an independent method** — the finding's "17 screens" figure now has a second witness with a different failure mode. Not re-minted; corroboration recorded here and the list stays Block 10's.

Linked rooms, purposes compressed (all [N] except where marked): `admin` dashboard-hub [D] · makers / dreamers / invites / invite-requests×2 (people + access) · vendors/portfolio (photo review) · content×6 (landing · exploring · heroes [retiring at the spotlight consolidation — marked RETIRING per R-X5] · spotlight · muse-pool · surprise-me) · approvals×2 (photos · discover) · conversations×2 (vendor · bride transcripts) · couture · hot-dates · demo (the factory, [C]) · prospects · config.

### 3.4 · DEMO (20) · COPLANNER (5) · AUTH (4) · LANDING (3) · singletons (4)

**Demo:** the tease (`/demo/vendor/[handle]`) fans out to a faithful vendor-app mirror (list/[slice] · calendar · discover · studio+leaves · more · portfolio · couture · featured · business · tds · contracts · settings), navigated by `DemoNav`'s four tabs plus the tease's tour chips (the `${base}${chip.path}` join — the two-variable `list/[slice]` residue in §5 is this idiom one level deeper). Purpose, one sentence for the lane: *let an invited vendor walk her own storefront before claiming it.* [C]
**Coplanner:** threads (list + `[threadId]`) · muse · settings · home — the couple's collaborators lane. `/coplanner/muse` is a **dead end by instrument** (outbound zero): its back-path is `router.back()`, which is history-navigation, not an edge — named as the instrument's boundary, walk owed. [N]
**Auth:** couple pin / pin-login / pin-reset / onboarding — the couple mirror of the vendor rail. [C]
**Landing:** `/` (the eleven-screen machine, Paper 2) · `/discover` (the public discover feed — **carries F-09.17, §6**) · `/about` (orphaned, §5).
**Singletons:** `/privacy` (orphaned+terminal, §5) · `/demodiscover` (subdomain door) · `/crew/[token]` · `/circle/join/[token]`.

---

## 4 · DEPTH AND DUPLICATE PATHS

**Depth:** no linked screen in either app sits more than **3 taps** from its lane's entry (vendor: entry → nav/More → leaf; the Prestige leaves are entry → More → Team Hub → leaf = 3). The IA disease is not nesting depth — it is **membership**: screens outside the graph entirely (§5), and one lane whose 22-door sidebar under-describes its 42-room house.

**Duplicate paths, derived:** Team Hub's three vendor entries (Paper 5 §2, F-09.10 — unchanged, founder pin still owed) · the demo mirror reaches `studio` from four siblings (tease, calendar, list, list/[slice] — DemoNav's persistent tab, correct hub behavior, not a defect) · `/admin` is reachable from every admin room (sidebar home, correct) · **`/vendor/calendar` is both a destination and the studio-mode's landing** (`Header.tsx:77`) — one screen, two roles, feeding the mode-controls confusability audit (R-U17, stage 3).

---

## 5 · THE ORPHAN FLOOR — 29, EVERY ONE CLASSIFIED

| Class | Routes | Verdict |
|---|---|---|
| **F-07.95 corroboration** | 17 admin screens (approvals · collab · control-room · couples · dashboard · data · discover-heroes · exploring · featured · health · money · photos · preview · revenue · subscriptions · vendors — and discover-heroes is additionally F-09.8's link-orphaned screen 1, retiring) | Block 10's; second independent witness recorded |
| **Doors, not orphans** | `/demo/bride` · `/demodiscover` · `/circle/join/[token]` · `/crew/[token]` | middleware/external entries, §2 |
| **Computed-nav reachable** | `/vendor/pin` (landing `:517`, ternary push — hand-verified) · `/demo/vendor/[handle]/list/[slice]` (two-variable template) | instrument limit working as declared |
| **Absorbed by sanctuary** | `/frost/canvas/discover` (declared dead in source) · `/frost/canvas/dream` · `/frost/canvas/journey` (parent shell; its leaves are linked) | the bride-app IA question in miniature — the single-page absorption is the architecture the Blueprint's later stages must either ratify or unwind, and these husks are its exhaust |
| **REAL, NEW** | `/vendor/studio` — **F-09.18** · `/about` + `/privacy` — **F-09.19** · `/vendor/auth/handoff` — one founder sentence owed (live door or dead rail?) | filed below |

**F-09.18 — THE STUDIO SUITE DOOR IS LINK-ORPHANED, AND THE NAV USES ITS NAME FOR SOMETHING ELSE.** `app/vendor/studio/page.tsx` (Studio Suite; Paper 5 §2's Team Hub entry #2) has **zero inbound edges** — `grep -rn "'/vendor/studio'"` across `app`, `components`, `lib` returns nothing (independent method: raw grep beside the instrument, same answer, different failure mode). The More sheet links `/vendor/team-hub` directly (`more/page.tsx:66`); the bar's "Studio" is a *mode* whose activation navigates to `/vendor/calendar` (`Header.tsx:77`). A Prestige vendor can reach the Suite only by typing the URL, and a vendor who taps the thing labelled Studio lands on the calendar. Recognition-over-recall fails twice on one word. **Cure shapes for the founder's ruling, not built:** (a) retire the door — the More sheet already reaches its leaves through Team Hub, so delete the page and the ambiguity with it; (b) link it — one More-sheet row, and the naming collision stays; (c) the naming collision resolves at the O-B/mode-seam work already in the Opus queue, and this door's fate rides that ruling. **The mode/route collision itself feeds the R-U17 confusability audit (stage 3) and is not separately minted.**

**F-09.19 — THE PUBLIC LEGAL AND BRAND PAGES ARE UNREACHABLE FROM INSIDE EITHER APP.** `/about` and `/privacy`: zero inbound edges, both instruments. A privacy policy no screen links to fails the purpose it exists for the day a store review, a WABA verification, or a user asks where it is — and `/about` is brand copy nobody can find. One-line cures (a footer link on the landing entry panel and the More/settings sheets); filed for the cure queue, severity low, effort trivial, visibility-per-byte high.

---

## 6 · THE MISS CLASS — LINKS TO ROUTES THAT DO NOT EXIST

13 raw sites; hand-classified: **7** are the demo tease's `CHIPS` suffixes (`path:'/portfolio'` joined onto `${base}` at the push site — resolved at runtime, correctly excluded from the graph rather than guessed) · **1** was the coplanner comment specimen (conviction №4, now stripped) · **1** is a dead component (below) · **1** is live and public:

**F-09.17 — THE PUBLIC DISCOVER FEED'S SIGNUP CTA NAVIGATES TO A ROUTE THAT DOES NOT EXIST.** `app/(landing)/discover/DiscoverFeed.tsx:182`: the `SignupNudge`'s CTA runs `window.location.href = "/auth/signup"`. The `(auth)` group contains `couple/pin`, `couple/pin-login`, `couple/pin-reset`, `couple/onboarding` — **no `/auth/signup` exists at `e3210b5`**, and route-group parentheses never appear in URLs anyway. A visitor who taps the nudge on a public acquisition surface gets the 404, at the exact moment they decided to convert. `/discover` is linked (inbound from the demo tease) and publicly routed, so this is a live conversion break, not a dead file. **Cure shape:** point the CTA at the landing machine's entry (`/`) or its invite path — a one-line fork for the founder's word on *which*, since it decides whether a discover-convert is treated as couple-first.

**Dead component, census item (no mint):** `components/discovery/Discovery.tsx` has zero importers and carries a `/couple/login` edge to nowhere — the F-05.56 labeled-defused class; listed for the polish queue's deletion sweep, not the nav map.

---

## 7 · THE DEAD-END FLOOR — 10, CLASSIFIED

Terminal-by-design: `/crew/[token]` · `/privacy` (once linked per F-09.19) · the subdomain doors (`/demo/bride`, `/demodiscover` — single-purpose rooms). Back-nav-by-history (edges the instrument cannot see, walk owed): `/coplanner/muse` · the four frost journey leaves. **Worth the founder's eye:** `/discover` — the public feed's only in-graph exit is the broken F-09.17 CTA, so for a visitor who arrives there, the *entire product* is one tap away through a door that 404s; and `/frost/canvas/journey/circle/[memberId]` — an empty-state audit target for stage 2 (a member page with no next action is the states census's opening specimen).

---

## 8 · WHAT THIS STAGE HANDS FORWARD

To **stage 2** (heuristic + states + touch): the `/discover` dead-end pairing with F-09.17 · the journey leaves' empty states · `/vendor/list`'s slice machine as the recognition-over-recall specimen. To **stage 3** (fork papers): §4's calendar-as-mode-landing datum and F-09.18's collision, both feeding R-U17 and the interaction models. To the **cure queue**: F-09.17 (one line, live public break — the queue's likely head), F-09.19 (two lines), F-09.18 (founder fork). To the **Opus sitting**: nothing in this stage touches its files; the heroes screen is marked RETIRING in §3.3 per R-X5.

## 9 · FINDINGS MINTED IN THIS PAPER

**F-09.17** — the public discover feed's signup CTA targets nonexistent `/auth/signup`; live conversion 404. **F-09.18** — the Studio Suite door is link-orphaned while the nav uses "Studio" for a mode that lands on the calendar. **F-09.19** — `/about` and `/privacy` unreachable from any screen in either app.

**Range used to date: F-09.16 (filed at the read-first, anchor: the baseline class) + .17–.19. Next free: F-09.20.**
