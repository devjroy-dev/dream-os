# TDW_03_CRUDS_FINAL — The Private Ledger: Plane-True Slices, Binder Cards, Wishbone, Vogue Mastheads
**Block:** 03 · **Repo:** dreamos-pwa (primary), dream-os (read verification only — zero backend changes except where a PATCH route is proven absent, see P4 note)
**Depends on:** TDW_02 (draft/wishbone wire, undo doors). P1–P2 and P4–P6 may build before 02 ships — draft-dependent rendering is additive and dormant until the wire arrives.
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify against live code before any edit)
| File | Verifying |
|---|---|
| `app/vendor/list/[slice]/page.tsx` (774 ln) | Current slices, `toRows()` mapping, detail sheets, milestones/PDF flows, `aiPrimer`/`deletePrimer`, search at ~ln 214/272 |
| `app/vendor/list/page.tsx` | Static landing to be retired |
| `hooks/vendor/useVendorData.ts`, `hooks/vendor/useLastSlice.ts` | Data hooks per slice; last-slice persistence mechanism (MUST not be localStorage in new code — verify what it uses; if localStorage, leave existing but do not extend the pattern) |
| `lib/vendor/api/vendor.ts` | `getCabinet` → `GET /api/v2/vendor/cabinet/:vendorId` (~ln 72) + `CabinetResponse` type; binder edit doors under `/api/v2/vendor/binders/...` (~ln 129–147) |
| `components/vendor/AddSheet.tsx` (413 ln) | Current create forms per slice |
| `components/vendor/Cabinet.tsx` (414 ln) | Existing cabinet rendering — reuse its column/tone logic, do not fork it |
| dream-os `src/api/vendor/{leads,invoices,expenses,events,clients}.js` | EXACT PATCH/DELETE routes + request field names (protocol §6: read the handler before writing any call). Known from audit: leads `PATCH /:leadId`, `PATCH /:leadId/state`, `DELETE /:leadId`? — VERIFY delete exists; invoices `PATCH /:invoiceId`, `/cancel`, `/payments`, `/pdf`; expenses `PATCH|DELETE /:expenseId`; events `PATCH /:eventId`, `/cancel` |
| dream-os `src/api/landing-slides.js` | `GET /api/v2/landing-slides` response shape (P6 splash source) |
| TDW_02 §P3 | The `draft` wishbone wire + `meta` caps wire this block consumes |

## 1. SCOPE / NON-GOALS
UI/interaction layer of the five slices + app-shell cold-open splash. NO engine changes, NO schema changes, NO WhatsApp surfaces, NO bottom-nav (Block 09), NO calendar redesign (04). Design system locked (protocol §4): cream field, ink text, brass hairlines, ONE gold accent per screen, Cormorant display / Jost labels / DM Sans body, no dark mode.

## 2. LOCKED DECISIONS FOR THIS BLOCK
Clients slice = binder cards from Cabinet (records plane) · swipe defaults as specified in P4 · bulk select IN scope · mastheads as specified in P5 · AddSheet = draft-first with progressive disclosure ("All details" expander) · cold-open hero splash IN scope (P6) · landing page `/vendor/list` retired → redirect to last-used slice.

---

## PHASE TABLE (one phase per sitting)

### P1 — Structural split + landing retirement
New tree (all presentational logic extracted VERBATIM first, refactor second — two commits):
```
components/vendor/slices/
  SliceShell.tsx      // masthead slot + search + FilterRail + list + FAB + skeeleton states
  SliceRow.tsx        // row grammar: primary(Cormorant 17) · secondary/meta(Jost 11 letterspaced) · pill · hairline
  DetailSheet.tsx     // bottom sheet chrome (blur 40px, brass hairline) — content injected per slice
  FilterRail.tsx      // sticky chips under search
  BulkBar.tsx         // bottom action bar in select mode
app/vendor/list/[slice]/
  page.tsx            // thin router: slice → module
  leads.tsx clients.tsx invoices.tsx expenses.tsx events.tsx
```
- `app/vendor/list/page.tsx` → `redirect` to `/vendor/list/${lastSlice}` (default `leads`). Delete the static section page.
- Guardrail: zero behavior change in this phase. Every existing flow (milestones, PDF, schedules, ConversationThread, aiPrimer) works identically. Proof: manual pass of each slice's full detail flow, screenshots in notes.
- `tsc --noEmit` clean.

### P2 — Clients → binder cards (the crown jewel)
Data: `getCabinet(vendorId)` (existing). Reuse `Cabinet.tsx` column/tone logic — extract shared pieces into `lib/vendor/cabinet.ts` rather than duplicating; `Cabinet.tsx` (Hub) and `clients.tsx` (slice) both consume.
Card anatomy (full-width, hairline-bounded, NO card chrome/shadows):
- Line 1: client name — Cormorant 19.
- Line 2: THE money story — amount in words-adjacent form (`₹2.5L`), direction glyph, then a 2px progress hairline: received (brass) vs pending (ink-dim), amounts in Jost 10 at ends.
- Line 3: stage word (manifest tone colors: warm/go/cool) + last-touched relative date.
- Missing cells (02 wire) render as chips per P3.
- Expand (tap): the **story timeline** — the growing note parsed by its accumulation breaks (Donna appends beneath what stands; render each append as a timeline entry, newest last), plus the confession trail lines for money edits verbatim (they're already sentences). Actions row: `Ask Victor` (aiPrimer) · `Edit` (binder edit door sheet) · linked calendar chip if `linked_binder_id` reverse-lookup is in the cabinet payload (verify; if absent, omit — never invent).
Empty state: "Your client stories live here. Tell Victor about a client — even just a name — and a binder opens." + Add.

### P3 — Draft chips + the wishbone sheet (consumes 02 wire)
- `SliceRow` + binder cards: when `draft` present on a row/record, render missing fields as chips — Jost 10, ink-dim border, e.g. `+ date` `+ city`. Max 3 shown, `+2 more` overflows into the sheet.
- Tap chip → `WishboneSheet.tsx`: field name as Cormorant title, then two equal affordances:
  - **Complete here** — the field's input (date picker / numeric pad / text), submits to `draft.complete_inline` {method,path} with the ONE field; optimistic; success = chip dissolves with a 200ms fade; failure = terracotta hairline + retry.
  - **Tell Victor** — router push to `/vendor?primer=<encoded draft.tell_victor.primer>` (verify Hub's existing primer/autoSend query handling in `app/vendor/page.tsx` — it exists; match its param name exactly).
- Rows with `draft` also carry a whisper-pill `Draft` (ink-dim, never gold).
- Dormancy: absent `draft` field on wire (02 not shipped) → nothing renders. Zero coupling failures.

### P4 — Interaction layer
**Swipe (pointer/touch translateX, threshold 96px, spring back; pure presentational — ports to RN Gesture Handler 1:1):**
| Slice | Swipe right (positive) | Swipe left |
|---|---|---|
| leads | state → booked | `Call` (tel:) if phone, else state → lost (confirm) |
| clients | Ask Victor | Call |
| invoices | mark fully paid (via payments door — verify request shape) | cancel (confirm) |
| expenses | repeat last (prefilled AddSheet) | delete (confirm) |
| events | state → done | cancel (confirm) |
Every destructive swipe = confirm sheet; every write = optimistic + undo toast riding 02's undo doors where they exist, plain toast where not.
**FilterRail chips per slice:** leads = state segments (`new contacted quoted booked lost`) with counts; invoices = `overdue unpaid part-paid paid`; expenses = month chips (last 6); events = `this week · later · done`; clients = manifest columns (the cabinet's own grouping words). Single-select, tap again to clear.
**Sort toggle** (masthead right, Jost caret): recent · amount · date (per-slice applicable subset).
**Bulk select:** long-press row → select mode (leading checkmarks, brass); `BulkBar` actions: leads `mark contacted / lose`; invoices `mark paid`; expenses `delete`; events `mark done`. Sequential API calls with per-row result; summary toast `4 done · 1 failed (retry)`.
**Pull-to-refresh** with `Updated 2m ago` stamp in masthead (Jost 10, ink-dim).
**Row overflow (⋯):** `Ask Victor about this` (aiPrimer) everywhere · slice-specific extras preserved (PDF, schedule, thread).
**Leads extra:** one-tap wa.me reply — FE-built `https://wa.me/<phone>?text=<encodeURIComponent(template)>`, template: `Hi <name>, thank you for your enquiry — this is <vendor name> from The Dream Wedding.` Only when `phone` present.
**Backend note:** if any assumed PATCH/DELETE route is absent on verification, do NOT build it here — stub the action disabled with a tooltip and log the gap in handover for a 10-minute backend rider approved by founder.

### P5 — Mastheads, AddSheet draft-first, skeletons
**Masthead (SliceShell top, full-bleed cream, no image):** slice name Cormorant italic 13 letterspaced eyebrow → THE number, Cormorant 44: leads = pipeline value (Σ budget_max over states new/contacted/quoted) · invoices = outstanding (Σ pending) · expenses = this month · clients = active engagements (non-archived binders) · events = count this week. Sub-line Jost 10 naming the figure. Number animates (300ms count-up) once per mount.
**AddSheet rebuild (draft-first, progressive disclosure):** opens with ONLY the essential field(s): lead → name OR paste-enquiry textarea; invoice → client + amount; expense → amount; event → title; client → name (opens a binder via Victor primer — binders are Donna's; the sheet's `Create` for clients routes the primer `Open a binder for <name>` to the Hub, auto-send). Big `Create`. On success the sheet stays, missing-field chips (same WishboneSheet inline inputs) appear beneath a brass hairline: fill any, or `Done`. `All details ↓` expander reveals the current full form for control-minded vendors. Toast on close: `Filed — 2 details pending` when draft.
**Skeletons:** shimmer rows (brass-hairline pulse, 3 rows) replace all spinners in slices. Empty states per slice teach the exact Victor phrase (copy table in appendix A).

### P6 — Cold-open hero splash (founder order)
`components/AppSplash.tsx`, mounted in the vendor root layout (design ready for frost reuse in the bride block):
- Shows ONLY on cold start: module-scope `let shown = false` flag (resets on real reload; survives client-side nav; NO localStorage/sessionStorage — native clause).
- Content: full-bleed crossfade of landing hero images — `GET /api/v2/landing-slides` (verify shape; cache response in module scope), first 3 images, 1.4s crossfade cycle, Ken-Burns 4% scale drift; wordmark `The Dream Wedding` Cormorant italic 300 over a bottom scrim, eyebrow `INDIA'S FIRST WEDDING OS` Jost letterspaced.
- Timing: minimum 2200ms, maximum 4000ms or app-boot-ready (session resolved + first data fetch fired), whichever later within the max; 400ms fade-out. Tap skips after minimum.
- MUST be an overlay above the booting app — never a render gate; fonts fire-and-forget (login-crash guardrail); images `loading=eager` but failure = skip splash silently (offline cold start never blocks on it).
- First-frame safety: render brand cream + wordmark instantly; images fade in as they arrive.

---

## 3. GUARDRAILS
No behavior loss from the monofile split (P1 proof gate) · Cabinet stays read-only — every records mutation goes through binder doors · no new gold beyond one per screen (masthead number is ink, not gold) · no localStorage in new code · never a false "done": optimistic UI always reconciles and confesses failure · WhatsApp untouched · `aiPrimer` grammar preserved (Hub depends on it).

## 4. ACCEPTANCE CRITERIA
1. P1: five slices function identically post-split (checklist per flow in notes); `/vendor/list` redirects to last slice.
2. Clients renders binder cards from Cabinet with money hairline + story timeline; a Donna money edit's confession appears verbatim in the timeline.
3. Draft chips render only when wire present; both wishbone paths work end-to-end (inline patch persists; Tell Victor lands in Hub with primer populated and auto-sent per existing param behavior).
4. Every swipe action commits, confirms when destructive, undoes where an honest door exists.
5. Bulk: 5-row mixed-result run shows `n done · m failed (retry)` and retry works.
6. Mastheads reconcile by hand against the API data for the test vendor.
7. AddSheet: creating a lead with only a name → row exists instantly, chips offered, `All details` reveals full form.
8. Splash: cold open shows carousel ≥2.2s with wordmark; client-side nav never re-triggers; offline cold start skips silently; tap-skip works after minimum.
9. `tsc --noEmit` zero new errors; Lighthouse PWA pass unchanged or better.

## 5. FOUNDER SMOKE (phone)
Cold-open (watch splash) → Leads: swipe a lead to booked, undo → filter `quoted` → bulk-lose two → open a draft lead, complete `city` inline, then `Tell Victor` for budget → Clients: read one full story timeline → Invoices: mark paid by swipe, share a PDF → AddSheet: expense with amount only → pull-to-refresh anywhere.

## 6. NATIVE-IMPLICATIONS CLAUSE
Slices become the RN screens 1:1 (SliceShell/Row/Sheet map to RN primitives; swipe → Gesture Handler; splash → expo-splash-screen + the same carousel component). The P1 split IS the port preparation. All data access stays in `lib/vendor/api` — no fetch calls inside components beyond existing hooks.

## Appendix A — empty-state teaching copy
leads: "No enquiries yet. Forward one to Victor — *got an enquiry from Priya, 98…* — and it files itself." · clients: (P2 copy) · invoices: "Say *invoice Priya 2.5L* to Victor, or add one here." · expenses: "*spent 3,500 on travel* — that's all Victor needs." · events: "*shoot on the 14th at Taj Lands End* — filed to your calendar."

## 7. SESSION BOUNDARIES
Six sittings, P1→P6; P6 may run any time after P1. Handover per protocol §7 each sitting; MASTERPLAN status updated; any discovered backend route gaps listed for founder-approved riders, never built ad hoc.


---

## ADDENDUM (2026-07-14, from TDW_13 F-3): P6 splash source amended — vendor splash becomes PORTFOLIO-FIRST: the vendor's own portfolio covers (first 3 by order, card variants); fewer than 3 usable images → the admin `vendor_fallback` slide collection (landing_slides.audience, migration 0086). Selection logic is a shared pure function. Landing-page slides continue serving audience='landing' unchanged.


## ADDENDUM (2026-07-14, Q1) — ✅ EXECUTED BY CE 2026-07-14, no longer P1's duty: the USE_MOCKS excision — remove all `NEXT_PUBLIC_USE_MOCKS` branches and the mock import from `lib/vendor/api/vendor.ts` (~25 call sites), then delete `lib/vendor/mocks/vendor.ts`. tsc gate applies. This closes the declared gap recorded in the 01 handover.
