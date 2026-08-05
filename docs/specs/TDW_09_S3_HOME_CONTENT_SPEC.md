# TDW_09 · BLUEPRINT STAGE 3 · THE HOME CONTENT SPEC — R-X23
### 「 THe landing page, shouldnt it have other info as well if we are making it the default landing page? 」

**Base:** dreamos-pwa `e3210b5`. **Under:** R-X22 (Model 1 founder-amended — rise physics, full-clean risen rendering — this spec furnishes the home *beneath* that chat) · R-X23 (this charter). **Render:** the `home` unit in `docs/mocks/tdw09_interaction_models.html` — two frames, Furnished and First-run; the founder vetoes from the render.
**THE TEST EVERY ZONE MUST PASS** (the charter's own words): *does it answer "what happened while I was away?" faster than the vendor could ask Victor?* A zone that fails it is a dashboard relapse — O-B's own "against" arm — and does not ship.

## 1 · THE THREE ZONES, AS CHARTERED

**ZONE 1 — THE STATE LEDGER**, as already mocked and source-anchored: today's letters · money owed (`Rs X,XX,XXX`) · next date — the ◆ strip from `app/vendor/page.tsx:157–215`, unchanged. It passes the test by construction: three glances, three answers.

**ZONE 2 — WHAT'S WAITING.** One to three lines, **only** items needing his hand, each tappable to its act, **absent entirely when empty** (the estate's zero-collapse discipline — an empty waiting zone renders nothing, never a cheerful "all clear" card). **The decisive evidence: the backend already exists.** `GET /api/v2/vendor/today/:vendorId` returns `needs_attention: { overdue_invoices, new_leads, events_today }` (`lib/vendor/types/vendor.ts:134–140`) — the zone is a *wiring act over a shipped endpoint*, not a build. Membership at launch, each traced to a source field: an unanswered enquiry (`needs_attention.new_leads` + age) · an overdue invoice (`overdue_invoices`) · an unconfirmed hold (today's `events_today` pending confirmation) · the storefront pending Discover approval (`/api/v2/vendor/discover/status`, `lib/vendor/api/vendor.ts:904` — shown *only while pending*, zero-collapse again). Ceiling of three; overflow becomes "…and 2 more →" into the Business door.

**ZONE 3 — BOOKS + INPUT FOOT**, as ruled: the brass ⌃ handle and the input bar, per R-X22's amended Model 1.

## 2 · THE CANDIDATES, WEIGHED WITH EVIDENCE — NOT BY DEFAULT

| Candidate | Evidence | Verdict |
|---|---|---|
| **This-week date strip** | `upcoming_events` is **already in the Hub's context payload** (`types/vendor.ts:128`) — zero new reads; a week of dates is the one thing a wedding vendor's "while I was away" always includes | **IN** — one quiet line under zone 2, absent when the week is empty |
| **Last-activity line** ("Victor filed 2 leads overnight") | needs a `vendor_activity_log` read the Hub doesn't make — a new endpoint or the P2 inbox's future feed | **OUT for now** — it duplicates zone 1's letters count at the cost of a new read; re-weighed when the P2 inbox ships its feed for free |
| **Storefront / profile status** | `discover/status` endpoint exists; but a *permanent* status line is dashboard relapse — approved-and-live is not news | **IN only as a zone-2 waiting item while pending**, exactly as §1 places it; never a standing card |

## 3 · THE FIRST-RUN CHAPTER — the empty state as exemplars

The founder's 「 tips/dummy prefed inputs 」 amendment is this spec's empty-state law: on a home with nothing filed, zone 2 renders nothing, the ledger stands honest at zero (`0 · —  · —`, the F-07.90 distinction kept — zero is an answer), and the space carries **labeled examples** — two or three lines each marked `Example`, each tap-to-try seeding the input (*"Hold 14 Dec for the Kapoor mehndi"*, *"What's owed this month?"*), **retiring the moment real data exists**. They are teaching lines, not content, and they say so on their face — the honesty architecture's rendering: nothing pretends to be a lead that isn't. Every exemplar string rides the founder's veto; the mock's two are drafts.

## 4 · WHAT THIS SPEC HANDS THE OPUS O-B BUILD
The amended Model 1 acceptance picture (mock frame 2) · this content inventory with its source anchors · the zero-collapse and exemplar-retirement rules as acceptance cells (a bench that seeds an empty vendor must see the exemplars; a bench that files one lead must see them gone). Copy inventory to the veto, current-vs-proposed, at that build's read-first: the waiting-line verbs (`Reply → / Confirm →`), the exemplar strings, and the input placeholder (current `Ask DreamAi…`, `InputBar.tsx:97`).
