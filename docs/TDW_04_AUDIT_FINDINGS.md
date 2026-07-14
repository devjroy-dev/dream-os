# TDW_04_AUDIT_FINDINGS — the §3.5 audit sitting (sitting one), 2026-07-15

**Executor:** TDW_04 session (fresh, inheriting the interrupted sitting's banked rulings)
**Evidence header:** dream-os HEAD `e82b6e2` ("TDW_03 CLOSED at P2…") · dreamos-pwa HEAD `f9872e0` ("TDW_03 R1(b)…") · read-only static audit against fresh clones; no code changed, no DB queried (row-level checks delivered as founder-run SQL, this packet's companion).
**Standard applied:** every ST file:line claim from `docs/SURFACE_TRUTH_AUDIT.md` verified against HEAD; classification per the banked taxonomy — **moved-line** (±few lines / path imprecision, claim substantively true) · **superseded** (code lawfully moved past the claim) · **real-drift** (claim materially wrong → CE). F16 reconciled at the two-independent-readings bar, not re-derived.

---

## 1. HEAD + ladder truths

| # | Finding | Class |
|---|---|---|
| A-1 | dream-os HEAD is **exactly** `e82b6e2` — the pre-classified "expected docs-only delta" past it never materialized (the hotfix-close docs commit `eebb4bf` *predates* `e82b6e2`). Zero delta. Ratified by founder 2026-07-15 as finding, not drift. | finding |
| A-2 | dreamos-pwa HEAD exactly `f9872e0` — as expected. | finding |
| A-3 | Ladder tail `0074_drop_scope_org_id.sql` applied → **0075/0076 free** per L-7; **0077 ruled to this block 2026-07-15** (convergence data migration — v1's third reservation that slipped the consolidation note); 0095 stands reserved (Addendum B). Holes 0068/0073 harmless per LD-8. | verified |
| A-4 | F12 DDL (engine.usage `cache_read_tokens`/`cache_write_tokens`): **APPLIED 2026-07-15, founder-run, verification on record with the CE** (both columns present, integer, nullable). BASELINE rider delivered in this ZIP per founder mandate. Engine-lane sitting reads the columns as live. | verified |

## 2. ST file:line verification — dream-os backend (all claims held)

| Claim | Verified at HEAD | Class |
|---|---|---|
| `core.js:26–37` Phase-4 flip | :25–38 — /today, /cabinet, /binders (×2: binderWrite + ledger), /chat mounted engine-side | moved-line |
| `cabinet.js:46–50` binder read · `:52–55` events · `:69–74` stage-words · `:75` leads remainder · `:80–82` Booked=calendar | :46–50 exact · :51–54 · :68–73 (`CLIENT_STAGE_WORDS`) · :75 exact · :80–83 (`BOOKED_KINDS`) | exact/moved-line |
| `leads.js:59` enum · `:115–116` GET · `:189–202,254` patchLeadSnapshot · `:205–255` PATCH state · `:306–338` soft-delete door · `:325,338` snapshot removes | :58 · :114–116 · :189–203 + call at :254 · :205+ · DELETE :309–344, deleted_at stamp :330–335 · patchNote remove at **:325 (heal path)** and **:338** — exact | exact/moved-line |
| `invoices.js:64–73` deriveInvoiceState (+`:65` comment) · `:76–98` GET · `:214+` create · `:334–396` generateInvoiceForBinder, `:341–383` stale-minting | :66–73 (+:64–65 comment verbatim) · :75–98 · POST at :214 exact · :340–396; "Numbers may inflate per booking; that's accepted" :346–347 verbatim | exact/moved-line |
| `expenses.js:29–56` (+`:29–32` comment) | :28–56, comment :29–32 verbatim | exact |
| `events.js:114–121` GET | :115–126; select at :116 | moved-line |
| `context.js:71,79,89,97` | invoices unpaid/advance_paid :71–76 · events :79–86 · leads new :89–94 · notes :97+ | exact |
| `chat.js translateBeat:54–90` · booking door `~93–215` + lockstep comment `~101` · activity `:560,606` | translateBeat :52+ · **door moved: donna_book_event block :125–199** (resolveBinderForBooking :134–149, bookEvents :150–196, findExistingEvent :203–219); lockstep comment now :132–133 · logActivity provider_downgrade :560/:606 exact | moved-line (v1 line refs stale; content intact) |
| `today.js:49–99` (`:75–82` binder-lead counts) | :49–99; CLIENT_STAGE_WORDS mirror + leadBinders :75–81 | exact |
| `snapshot.js:36–37` window · `:52–82` Myra typed | :36–37 exact · buildVendorSnapshot :43+ all-typed (leads/notes/events/invoices/leads-new) | exact |
| harvest.js activity actions | `harvest_patch` :203/:217 + `harvest_cross_scope` :177/:209 also logged (ST's "only harvest_patch/provider_downgrade" is minutely incomplete — cross_scope is harvest-family; WA `engine.js:268` logs too). Binder/lead doors confirmed **never** log → ST-3d gap real | moved-line |

## 3. ST verification — engine core

| Claim | Verified | Class |
|---|---|---|
| `loop.ts:117` snapshot load · `:210` dynamic assembly · `:5,220–227` no DB tools · `:121–127` retrieval-gap comment | :117 exact · :210 exact (ownerBlock+date+facts+snapshot+donnaMsgs+shelf+cal+activity) · :5 + :220–229 · :121–127 ("the RBI mislabel, 2026-06-11") verbatim | exact |
| **`donna.ts:63–145` rebuildSnapshot — F16 RECONCILIATION** | **TWO READINGS AGREE.** Independent read: public.leads SELECT `id,name,state,budget_max`, vendor-scoped via reverse bridge, `deleted_at IS NULL`, `state NOT IN ('booked','lost')`, limit 12 (:75–83) · facts stated/unsuperseded limit 12 (:95–102) · money_entries expected/overdue limit 20, honest-empty comment :113–115 · **engine.records NEVER read — binders do not rebuild.** Matches FINDINGS_LOG F16's documented read cell-for-cell. Evidence bar met; ST-3a's target precisely located. Also confirmed: `getNote` → rebuild is first-build-only (:149) | exact — F16 CONFIRMED |
| `donna.ts:152–166` patchNote · `:174` header | :153–165 · :174 "kept true for you" exact. Storage truth for the F14 SQL: `engine.agent_snapshot.note` is JSON `{items:[{id:'lead:<uuid>'…}], rebuilt_at}` via readNoteRow/writeNote upsert on agent_id | exact |
| `recordPrimitives.ts:21–45,:34` recordItem · `:125–131,:133–164,:146–155` append · `:406–421` donna_money · `:452–483,:465,:470,:474` donna_money_edit · donna_date `~:190` | :21–45 + :34 exact · ALWAYS_APPEND :124, writeFields :127–164, read-then-append :146–155 · **donna_money :400–425: `if (existing.amount != null)` stamps with NO old≠new guard — ST-6 confirmed** · **donna_money_edit :450–483: money fields confess whenever present in input; `old != null` at :465 is formatting-only; direction guard :470, payment_status guard :474 — asymmetry confirmed exactly** · donna_date :191 | exact — ST-6 targets locked |
| `donnaFind.ts:1–12` records-only · `db.ts:15` schema pin · `harveySoul.ts:99,110` | all exact ("lays the real picture" :110; "the file outranks your memory" :99 — verify-only, prose belongs to 06) | exact |

## 4. ST verification — dreamos-pwa

| Claim | Verified | Class |
|---|---|---|
| `cabinet.ts` phoneKey + disclosure · `:87–90` noteTimeline | phoneKey :98, DISCLOSED LIMITATION :95 · noteTimeline :87–92 | moved-line |
| `Cabinet.tsx:91–94` columns · `:343` "Everything kept" | columns :90–94 (Clients/Leads/**Booked**/Reminders — the L-1 rename target) · :343 exact | exact |
| `studio/page.tsx:41–48` labels | :41–48 exact (five slices + Notes to Self) | exact |
| `leads.tsx:22–24` swipe-delete=PATCH lost · `:30–52` cross-chip | deleteRequest :22–23 — `state:'lost', reason:'Removed from list'` verbatim; **M3 live at HEAD** · chip :28–52 | exact |
| `clients.tsx:2–4,24,25–33` | header comment :2–7 · useCabinetData :23, reverse chip :24–32 | moved-line |
| `page.tsx:85–160,240–320` masthead · `CommandBar.tsx:281–320` | GreetingLine :85+, "invoices remain to be collected" :111, New Enquiries pill :284 · CommandBar metrics :278–325, all context-derived (typed) | moved-line |
| `FilingChip.tsx:1–10` · `BinderCard.tsx:2–8` | both exact (v2 chip, done-means-witnessed; card header comment) | exact |
| glance "last three notes" | **path drift:** lives at dream-os `src/engine/src/core/glance.ts`, not `lib/vendor/glance.ts`; content confirmed (reads each record's note) | moved-line (path) |

## 5. Part B ground truth (v1 READ-FIRST verification)

| # | Finding | Class / action |
|---|---|---|
| B-1 | **THE P1 QUESTION: separate table CONFIRMED.** `availability.js` + `lib/vendor/availability.js` read/write `public.vendor_availability` (insert/delete/list; unique vendor_id+blocked_date, 23505→ALREADY_BLOCKED). P1 does NOT collapse → 0077 is real. **Wire truth for the shape-preserving view:** GET returns `{ok, blocks:[{id, blocked_date, reason, created_at}], total}` — field is `blocked_date`, not v1's illustrative `date`; `total` also rides. PWA `fetchAvailability` keys on `blocked_date` (calendar page :96). | verified — P1 proceeds full |
| B-2 | **Discover/couple availability readers: NONE.** Exhaustive grep (vendor_availability / listBlocks / blocked_date) across src/: only the vendor pair. v1 P1.4's derivation task resolves to a recorded nothing. | superseded (task dissolves) |
| B-3 | **Lockstep already exists both directions at HEAD** — v1 P2's lockstep sub-task is *relocation, not greenfield*: (a) event→binder via `executeAndPatch(donna_date)` inside chat.js mutateEvents :292–297 (witnessed, trail written); (b) binder→event via `lockstepBinderToEvent` :329–350 — but this direction writes `public.events` **raw** (`.update()` direct) with a loop-guard-by-architecture comment. After P2 the raw write must route through eventWrite (guardrail law). (c) **CRUD-side lockstep is genuinely absent** — `events.js` PATCH carries none; v1 P2(b) builds it. Also present and unnamed by the spec: `retroLinkOnFile` (chat.js :220+ — links unlinked events when a client binder files) — must survive relocation. | superseded-in-part; P2 scope sharpened |
| B-4 | Dedupe + backlink sources for eventWrite's verbatim move: `findExistingEvent` :203–219 (same-date + title-hint ilike, single confident match) and `resolveBinderForBooking` :134–149 (explicit binder_id or confident single name-match). | verified |
| B-5 | **Category taxonomy drift (→ CE, question Q-2 below):** `categoryProfiles.js` PROFILES keys are `makeup, photography, designer, jewellery, decor, venue` (+ alias videography→photography; generic 'other' fallback), `timelineType: event|delivery`. C4's default table names photographer/**mua**/decorator/**florist** — key-name mismatches are cosmetic (map keys to code truth), but **florist has no profile** (falls to 'other' → occupancy off + `occupancy_unmapped`, contradicting C4's florist:2 default) and **venue exists with no C4 ruling** (event-type; capacity semantics unruled). planner: no key → 'other' → occupancy off — consistent with C4 by fallback. | **real-drift → CE** |
| B-6 | 0069: `blocked` kind live in the events CHECK (13 values). 0070: `linked_binder_id` + partial index live. `hot_dates` per SCHEMA (shared, read-only). | verified |
| B-7 | `me.js` PATCH ALLOWED_FIELDS (:70) lacks `slot_capacity` — B3's "add to allowlist, smallest change" path confirmed viable. `settings/page.tsx` has no capacity row (expected pre-B3). | verified |
| B-8 | Calendar sight already flows: `fetchCalendarSnapshot` → runTurn's `calendarSnapshot` (chat.js :350,:543,:601; loop.ts :208). P4 verifies against post-engine-lane snapshot shape as amended. | verified |
| B-9 | `schedules.js` milestone shapes present (create/PATCH/`:milestoneId/paid`; PATCH allowlist `milestone_label,due_date,pct`) — B5's source confirmed. | verified |

## 6. Out-of-scope findings (appended to FINDINGS_LOG under this sitting; owners named)

| # | Finding | Owner |
|---|---|---|
| O-1 | **SCHEMA.md doc-lag ×3** (schema never moved; docs lag prod): (a) `invoices.binder_id` exists in prod (used by generateInvoiceForBinder `.eq('binder_id',…)`; BASELINE's 21-column count only reconciles with it) but SCHEMA's invoices table omits it — no live-ladder migration adds it; (b) `events.deleted_at` exists (events.js GET filters on it in prod) — SCHEMA's events table omits it (BASELINE's 14 columns reconcile with it); (c) SCHEMA's events `kind` row says "12 values" and omits `blocked` — 0069 (applied, in the ladder) makes it 13. Proposed one-line riders drafted; CE ratifies, next delivery carries them. | CE ruling → next 04 delivery |
| O-2 | `context.js` typed reads carry **no `deleted_at` filters** (leads-new count, invoices list) — soft-deleted rows can inflate the chat masthead. Dies naturally at A3's repoint (L-4); logged so the repoint's acceptance covers it explicitly. | 04 A3 |
| O-3 | ST's activity-writer census minutely incomplete: `harvest_cross_scope` (harvest.js) and the WA engine (`engine.js:268`) also log. Doesn't alter ST-3d (doors still never log). | record only |
| O-4 | glance path in ST is `lib/vendor/glance.ts`; truth is `src/engine/src/core/glance.ts`. | record only |

## 7. Questions for the Chief Engineer

- **Q-1 (ratify):** the L-9 absorption text and 0077 extension written into the spec (both founder/CE-ruled, dated) — confirm the wording as recorded.
- **Q-2 (B-5, blocks B3):** the category map — rule florist (add a profile key / accept unknown→off until one exists?) and venue (occupancy mode + capacity default, or explicitly OFF pending a ruling?). Key names in B3's map will follow code truth (`photography/makeup/decor/jewellery/designer/venue`).
- **Q-3 (ratify):** O-1's three SCHEMA one-liners — say the word and they ride the next delivery.
- **Q-4 (record):** B-3's sharpened P2 scope (relocate two live lockstep legs + build the missing CRUD leg + preserve retroLinkOnFile) — confirm this reading of "moved, not rewritten" extends to the raw b→e write being re-routed through eventWrite.

## 8. Verification state

Docs-only delivery: no `.js`/`.tsx` touched → node --check / tsc gates N/A this sitting (they gate every code delivery from the engine-lane sitting onward). Companion founder-run SQL (F14 export-then-soft-delete; Ritika & Arjun signature check; vendor_availability row counts) delivered in-chat per the §7 SQL exception.
