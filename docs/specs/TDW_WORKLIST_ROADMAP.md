# TDW — THE WORKLIST · Vendor UI Roadmap
Build parallel → test on the three test accounts → cut over or discard. Production untouched until Phase 7.

---

## 0 · Governing decisions (rule before any build)

| # | Decision | Proposed | Why it must be ruled first |
|---|---|---|---|
| D-1 | **Where it lives** | New route tree `app/vendor2/**` in `dreamos-pwa`, gated by `ui.worklist_enabled` (dial, default false). Old `app/vendor/**` untouched. | Lets both shells run on one deploy; test accounts flip the dial, real routes never change. |
| D-2 | **Rooms are reused, not rewritten** | Every existing room page becomes a component mounted inside the new shell. Byte-identical logic; only the shell (nav, header, composer) is new. | R-X30 parity by construction. Avoids two drifting copies of Invoices etc. |
| D-3 | **Today feed is read-only** | New `src/api/vendor/today.js` aggregates from `leads`, `invoices`, `contracts`, `events`, blocks, `team_*`, portfolio/discover meta. Zero writes. Every verb on a Today card calls the room's *existing* write endpoint. | Sole-writer law. Today can never corrupt a table it doesn't own. |
| D-4 | **Ranking order** | Unanswered leads → money due → contracts unsigned → dates asked → team asks → shop nudges → done-today. Ties by age. | Founder ruling; it's the one piece of AI judgement vendors see. |
| D-5 | **Default pinned rooms** | Calendar. (Storefront second, if two.) | Fresh-vendor nav is 2 seats + pins. |
| D-6 | **Composer = Victor, unchanged mind** | Same Victor prefix, same BUS/ADV chip, same tool set. New: replies may carry an **action card** (fixed shape, fixed verbs). No new model-voiced copy without veto. | Copy law. The AI gets no new surface, only a new frame. |
| D-7 | **Money register** | `Rs X,XX,XXX` everywhere in the new shell, one formatter, imported from the existing canonical home (not a 14th `fmtINR`). | F-09.24 class must not be re-minted. |
| D-8 | **Retired links never 404** | On cutover, every `/vendor/*` route becomes a redirect stub to its `/vendor2/*` twin (or the twin takes the old path — see Phase 7 arm choice). | R-35.36 precedent; approved WhatsApp templates carry `/vendor/list/leads`. |

Founder rules D-1…D-8. Kickoff is written only after.

---

## 1 · Phase map

| Phase | Name | Repo | Output | Gate |
|---|---|---|---|---|
| 0 | Inventory & parity ledger | pwa (read) | `docs/specs/WORKLIST_PARITY.md` | Every control CARRIED / RELOCATED / SURFACED |
| 1 | Shell | pwa | `/vendor2` layout, 2-seat nav, pins, composer frame | Renders empty; smoke on 3 accounts |
| 2 | Rooms mounted | pwa | All 20 rooms inside the shell | Both-ways bench: every room's existing tests green under new mount |
| 3 | Today feed (backend) | dream-os | `GET /vendor/today` | Bench: rank order, tier redaction, zero writes |
| 4 | Today feed (UI) + verbs | pwa | Cards, inline verbs, "why", snooze | Every verb hits the room's existing endpoint (traced) |
| 5 | Composer action cards | dream-os + pwa | Victor action-card contract; undo | Copy veto on every fixed line; bench asserts behaviour not wording |
| 6 | Acceptance walks | founder | Two consecutive all-green evenings | M-exit rule (same as M-6) |
| 7 | Cutover or discard | both | Route swap + stubs, or dial stays false and tree is deleted | Founder word only |

Banking at every phase seam. Each phase is its own ZIP with commit hash in line 1.

---

## 2 · Phase detail

### Phase 0 — Inventory & parity ledger (read-only, CE sitting)
- Derive by command at HEAD: every `page.tsx` under `app/vendor/**`, every nav entry, every button/link/verb on each page (the control-inventory-with-verbs clause).
- Write `WORKLIST_PARITY.md`: one row per control → its home in the new shell → tap count. States: **CARRIED** (same component), **RELOCATED** (new home named), **SURFACED** (needs your ruling). No fourth state.
- Output also: the list of write endpoints each verb must call (this becomes Phase 4's trace bench).
- Exit: you sign the ledger. Anything SURFACED is ruled or parked explicitly.

### Phase 1 — The shell
- `app/vendor2/layout.tsx`: theme provider (existing), Splash cold-open (existing), new `WorklistNav` (Today · Rooms · [pins]), new `Composer` frame (input + mic + BUS/ADV chip; wired to the existing Victor chat hook, no behaviour change yet).
- `app/vendor2/page.tsx` = Today (placeholder), `app/vendor2/rooms/page.tsx` = Rooms grid (static list of 20, badges wired later).
- Pins: `vendor_prefs.pinned_rooms` (new column, migration authored against `PUBLIC_SCHEMA.md`, founder runs). Long-press = pin/unpin.
- Gate: `ui.worklist_enabled` read in the vendor layout; false → `/vendor2/*` redirects to `/vendor`.
- Design tokens: existing Wine Night / Espresso / Paper sets; 44px targets and pressed states via the canon primitives (F-09.21/.22 already in tree). No new hex literals.
- Exit: shell renders on the 3 test accounts with the dial true; `/vendor` unchanged with dial false.

### Phase 2 — Rooms mounted
- For each of the 20 rooms: extract the existing page body into a component if not already one; mount at `app/vendor2/rooms/<room>/page.tsx` with the new header (title · ‹ Rooms · pills).
- Rooms: Leads, Clients, Invoices, Expenses, Events, Contracts, TDS, Notes, Team hub, Storefront (preview + Portfolio/Discover/Collab/Featured/Couture as pills), Calendar, Plan, Settings, Theme, PIN, Glitch, Sign out.
- Couple file: Clients → couple opens the existing detail views composed into one timeline (this is the only new composition; data is unchanged).
- Bench: `b_worklist_rooms` — every room route resolves; every existing room test still green when the component is mounted in the new shell; the old `/vendor` routes still resolve (stub-free at this phase).
- Exit: you can do every job in the parity ledger through `/vendor2`, at the listed tap count.

### Phase 3 — Today feed, backend
- `src/api/vendor/today.js`: one read module. Inputs: vendor_id, tier. Output: ordered array of `{kind, id, ts, title, meta, verbs[], why}`.
- Kinds (D-4 order): `lead_unanswered`, `invoice_due`, `contract_unsigned`, `date_asked`, `team_ask`, `shop_nudge`, `done_today`.
- Tier: Basic → lead cards go through the **existing** M-LEADGATE serializer (withheld set `{phone, email}`), never a second redaction path.
- `why` is a fixed template per kind, founder-vetoed once.
- Snooze: `vendor_snoozes` table (migration), read by the feed; writes via its own tiny endpoint (sole writer).
- Bench: `b_worklist_today` — rank order under a fixture with all 7 kinds; Basic vs Essential redaction; **mutation cell proves zero writes** (wrap in a read-only transaction; any write reddens).
- Exit: `curl` batch against `9888294440` returns the fixture feed, pasted back.

### Phase 4 — Today feed, UI + verbs
- Card component per kind; verbs map 1:1 to existing endpoints (from Phase 0's list). No verb invents a new write.
- "Why is this here?" sheet on long-press; Snooze; Reorder (writes `vendor_prefs.rank_override`, feed respects it).
- Calendar card: tap-to-flip calls the existing block endpoint.
- Bench: `b_worklist_verbs` — a trace cell per verb asserting the network call hits the expected existing route (both-ways: point a verb at a wrong route, cell reds).
- Exit: evening walk card on the test vendor: every card kind appears from its fixture, every verb lands, every result visible in the room it belongs to.

### Phase 5 — Composer action cards
- Contract: Victor may return `{text, card?: {kind, id, verbs[]}}`; the PWA renders the same card components as Today. Kinds limited to the Phase 4 set + `undo`.
- Undo: every action card carries the inverse endpoint; 5-minute window; bench asserts the inverse is called.
- Mode chip: unchanged behaviour. ADV replies may carry cards that hand back to BUS verbs.
- Copy: every fixed card line and every `why` template listed in one veto sheet; you veto once; hash carried.
- Bench extends `b_worklist_verbs`; soul benches assert behaviour (a card appears, undo lands), never wording.
- Exit: Victor chat lines batch (zero placeholders) against the test vendor, results pasted.

### Phase 6 — Acceptance
- Two consecutive all-green evening walks on the three test accounts, one step at a time, founder pastes results.
- Walk covers: cold open → Today → each verb → each room → couple file → storefront edit → composer do/advise/undo → pins → Basic wall → theme flip → glitch report → sign out → old `/vendor` still intact.
- Any RED resets the clock (same rule as M-6).

### Phase 7 — Cutover or discard
**Discard:** dial stays false; delete `app/vendor2/**`, the two migrations stay (harmless) or are reverted. One ZIP.

**Cutover, two arms — you choose:**
- **(a) Path swap.** `app/vendor2/**` moves to `app/vendor/**`; the old tree moves to `app/vendor_legacy/**` for one release, then deleted. Every old deep path that changes gets a redirect stub (never 404). Templates keep working because `/vendor/list/leads` is preserved as the Leads room's path or stubbed to it.
- **(b) Flag flip.** Dial true for all; `/vendor/*` becomes stubs to `/vendor2/*`. Cheaper, but the URL changes and every approved template carrying `/vendor/...` must be re-verified in `b07_p5 §12`.
Recommendation: (a). URLs are part of the product's promises.

Rollback: flip the dial false. Both trees live for one release.

---

## 3 · What you rule, and when
- Before Phase 0: D-1 … D-8.
- After Phase 0: the parity ledger's SURFACED rows.
- Before Phase 3: the `why` templates and card copy (one veto sheet).
- Before Phase 7: arm (a) or (b), and the release date of the legacy delete.

## 4 · What you run
- Two migrations (`vendor_prefs`, `vendor_snoozes`) — authored against `PUBLIC_SCHEMA.md`, delivered as separate blocks.
- Dial `ui.worklist_enabled` for the three test accounts.
- Every ZIP apply, every push, every walk paste.

## 5 · Estimate (LE sittings, not calendar)
Phase 0: 1 · Phase 1: 1 · Phase 2: 2–3 · Phase 3: 1 · Phase 4: 2 · Phase 5: 1–2 · Phase 6: founder · Phase 7: 1.
Roughly 9–11 sittings to a decidable build.

## 6 · Risks, named
- **Two shells drift** between Phase 2 and 7 if a room is edited in `/vendor` only. Cure: rooms are components with one home; both shells import the same file. Bench cell asserts no room body exists twice.
- **Feed ranking distrusted.** Cure is Phase 4's "why" + snooze + reorder, shipped with the feed, not after.
- **Today becomes a write path.** Cure is Phase 3's zero-write mutation cell; it stays in the floor forever.
- **Copy leaks through Victor cards.** Cure: card kinds are closed; free text stays in the bubble, never on the card.
