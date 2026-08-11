# repo: dream-os @ 31eaa68
# TDW_FROST_AUDIT_15 — Block 15 (ROOMS) Ground-Truth Inventory
**Authored by:** FC-1, the First Frost Chair (parallel audit line, R-30.17) · **Date:** 2026-08-12
**Derivation tips:** dream-os **`31eaa68`** · dreamos-pwa **`c0faa4e`** — identical to Report B's tips (re-fetched before this report; TDW_FROST_AUDIT_14's banking is in flight, founder-sequenced, and nothing in its docs-only radius touches this report's subjects).
**Witness grades:** [PUBLIC-0099] (+[LADDER] to committed tip `0119`) as in Reports A/B; settling witness = founder-run `information_schema` SELECT.
**THE MOVING-GROUND CLAUSE APPLIES IN FULL:** the relay arc (`src/lib/vendor/{relaySeat,relayToCouple,coupleDrafts,coupleWaWindow}.js`, `0117/0118`, the `couple_thread` writers in `vendorInbound.js`) is LIVE production machinery shipped this week and still moving; every §5 claim below is stamped at these tips and any collision between block-15 assumptions and that radius is relayed as a QUESTION, never ruled here.
**Method:** every claim by FC-1's own command or marked UNDERIVED; defects PROPOSED un-numbered; forks are QUESTIONS.

---

## §0 — EXECUTIVE SHAPE (one screen)

Block 15's spec stands on four legs. At these tips:

1. **Its contract does not exist and cannot yet.** R-1 makes `BRIDE_PARITY_MATRIX.md` "THE CONTRACT"; the matrix is block-13 P6's unbuilt deliverable (Report A §6). Block 15 is charter-blocked on 13 by its own first sentence — expected structure, stated so nobody charters around it.
2. **The inbox leg (R-5) stands on machinery that was never built AND a migration number that was spent elsewhere.** There is NO `notify()` (`src/lib/notify.js` absent; zero webpush/push_subscriptions code anywhere in src — grep empty), NO `notifications` table, NO `push_subscriptions` table on any witness — and **`0083` is `0083_failed_turns.sql`** (webhookCore's dead-letter table, CE-27 era), not the spec's "notifications/push_subscriptions (0083, execution state CHECKED)". The spec's conditional 0089 ("IF 0083 already executed… ELSE amend 0083") is unexecutable in BOTH arms: the 0083 it imagines never existed. R-5 is a from-zero build wearing an extend-the-existing costume. §4, PROPOSED-15.A.
3. **The relay arc got to the "enquiry replied" moment first — on WhatsApp.** P5's flagship wired event ("enquiry replied — vendor/concierge reply lands") now has a LIVE production path this spec predates entirely: the vendor's agent composes → `pending_couple_drafts` (0117/0118) stages → window-first send → `tdw_enquiry_reply_couple` / `tdw_enquiry_update_couple` (both Meta-approved, mapped in `templates.js:83–:199`) deliver to the bride's handset. A PWA inbox bell for the same event is a SECOND delivery surface for a message the estate already delivers — coherence between them (dedup, read-state, the drafts store as the tray's source-of-truth candidate) is a design fork that did not exist on 2026-07-14. §5, Q-2.
4. **Several parity rows the spec plans to build are ALREADY CLOSED by the 07-era sanctuary work** — the bookings write set, recordPayment, receipts delete, enquiries read, circle invite/remove all ride `lib/frost/journey.ts` into live blooms (Report A §6). P1's build list overlaps shipped product; the sitting's real work is the DELTA, which only the 13-P6 matrix can state precisely. §3.

Meridian is the one leg that verified almost clean: 204 lines exactly as the spec cites, haiku-always in ink, `kind='meridian_self'` live. §3.4.

---

## §1 — SPEC §0 "READ FIRST" TABLE, GRADED

| Spec row | Grade | Evidence |
|---|---|---|
| `docs/BRIDE_PARITY_MATRIX.md` (13 P6) — THE CONTRACT | **ABSENT (upstream deliverable)** | Report A §6; charter-blocking by R-1's own words |
| `docs/FROST_BLOOMS.md` (13 P3) | **ABSENT (upstream deliverable)** | Report A §1 |
| BRIDE_AUDIT §1 + the ⚠ items | **EXISTS (moved: `docs/specs/BRIDE_AUDIT.md`)**; the ⚠ "bride-expense table identity" is ANSWERED by witness below | §2 |
| `src/api/couple/meridian.js` (204 ln) | **VERIFIED to the line** | 204 ln; header identity verbatim ("personal concierge — skin, mind, body, decisions. Separate from DreamAi"); `Model: claude-haiku-4-5-20251001. Always. NEVER Sonnet.` (:7, `MODEL` :16); `kind='meridian_self'` find-or-create :101–:112; SSE stream, MAX_HIST 20 |
| `src/api/couple/taste.js` /surprise + `src/api/admin/surprisePool.js` | **VERIFIED (139 + 71 ln)** | surprise = curated pool-by-tags: `vendor_portfolio WHERE aesthetic_tags && her tags AND approved` (taste.js:15's own doc); 15-tag vocabulary shared with vendors (:8). No Haiku web layer, no seen-tracking — R-3's additions are cleanly unbuilt on a clean floor |
| `src/agent/brideTools.js` + executors | **VERIFIED (25 tools, Report A)** | no envelope params anywhere (grep `envelope` in brideTools/brideEngine: zero) — P2's additions unbuilt as expected |
| `src/lib/notify.js` + `notifications`/`push_subscriptions` (0083) | **ABSENT ×3 + WRONG-NUMBER premise** | §0.2; `0083_failed_turns.sql` [LADDER]; zero table hits on [PUBLIC-0099]; zero push code in src |
| `src/lib/llm.js` + cost meter | **EXISTS (132 ln); bride surfaces DON'T USE IT** | facade adopters: `engine.js`, `closerEngine.js`, `harvest.js` only (grep). `brideEngine`/`circleEngine`/`meridian.js`/chat all run direct anthropic clients; zero `engine.usage` writes from any couple/*.js (grep empty). P6's facade+INR item is a real, whole gap — and overlaps the spend census handed to CE-30 at Report B §5 (named, not proposed) |
| Frost image helper (07) + AppSplash | **helper EXISTS (`lib/frost-api/img.ts`) · AppSplash ABSENT** | Report A §4's compound absence reaches P4's reveal ceremony |

---

## §2 — THE MONEY ROOMS' GROUND (P1/P2's subject)

- **The ⚠ answered:** the bride-expense plane is **`public.couple_receipts` (11 cols)** [PUBLIC-0099:240–:254] — `public.expenses` (12 cols, :441–:456) is VENDOR-side (`vendor_id NOT NULL`, `linked_lead_id`), not hers. 0088's "the bride-expense table's envelope_id (exact table per the audit's ⚠)" resolves to couple_receipts alone; there is no second bride expense table to also tag. One grep the P2 sitting no longer needs to run.
- **Envelopes: fully unbuilt.** No `budget_envelopes` table, no `envelope_id` on couple_receipts [PUBLIC-0099 + LADDER], no tool params (§1). **0088 and 0089 are open holes on the ladder** (`ls db/migrations | grep -E '0088|0089'` = empty) — but note the spec's own ladder sentence ("after 0087 = next 0088") predates the CE-59 re-homing world; whether these two numbers are RESERVED to block 15 or merely unspent is a register question FC-1 cannot settle from the tree (the 0097/0098 reservations are chair-ruled in ink at 0099's header :10; no equivalent ink names 0088/0089). Q-1.
- **The bookings door EXISTS and is CONSUMED:** `POST /:bookingId/payment` via `record_payment()` RPC (`bookings.js:165–:191`, amount_paid deliberately unwritable at PATCH :82) — and sanctuary already imports `recordPayment`/`createBooking`/`updateBooking`/`deleteBooking` through `lib/frost/journey.ts` (Report A). P1.2's "record-payment affordance" is at least partially SHIPPED; the matrix will say how much of the sheet/optimistic/honest-failure shape remains.
- **The milestone mirror's join DOES NOT EXIST as a direct path — the spec's verify-clause fires.** `couple_bookings` (14 cols, :207–:224): has nullable `vendor_id`, NO invoice/lead/schedule linkage. `payment_schedules` (13 cols, :692–:708): keys `invoice_id` + `vendor_id`, NO couple/booking column. `invoices` carries `lead_id` (nullable) + client fields. The only derivable chain is couple_bookings.vendor_id → invoices(vendor, matched-by-what?) → payment_schedules — with no committed matching rule. The spec anticipated exactly this ("verify the join exists, wire the smallest read endpoint if not, recorded"); the answer is: it does not, and the matching rule (lead? client_phone? explicit new FK?) is a design fork for the charter, not a wire. PROPOSED-15.B carries the evidence.
- **Receipts room:** add/delete live (`receipts.js` 93 ln; journey.ts's deleteReceipt consumed); tags array exists on the row; Vision-classify ingest path UNDERIVED this audit (named for the P1 read-first).

## §3 — THE QUIET ROOMS + THE CONCIERGE (P3/P4's ground)

- **today.js** 105 ln EXISTS (masthead input). **Dream masthead:** the live Dream bloom is the sanctuary chat room (Report A §2.5); P3.1's "Dream bloom rebuilt as the masthead" therefore rebuilds a LIVE AI surface inside the un-extracted 4,912-line file — sequencing against 13's P2/P3 extraction is load-bearing (build the masthead before extraction and the extraction's "verbatim relocation" law collides with fresh feature work; after, it's a bloom-file edit). Q-3.
- **briefing.js is VENDOR machinery, not hers.** `src/agent/briefing.js` header: "morning briefing builder — called by src/cron.js at 8am IST"; consumers = `cron.js:38`, `index.js:19` (vendor WA lanes) + a studio surface. P3.1's "briefing.js finally consumed visibly [on the bride masthead]" would point a VENDOR-window-aware WhatsApp composer at a bride screen — grade the spec sentence **MISDIRECTED**; the bride line's actual morning machinery is `brideCron`/nudge class (05 P4), a different organ. PROPOSED-15.C.
- **Pages:** mood + mood_color + body live (`pages.js:29,:76–:82`); **NO media/photo support** (grep image/photo: zero beyond mood fields) — P3.2's "smallest addition if absent" arm is the live arm.
- **Moments:** 42-ln router; grid is sanctuary's photo-room set (Report A `:4568`).
- **Meridian (R-2):** verified §1; polish-only is honest to the tree. One adjacency the spec doesn't know: **`concierge.js`** — "Ask a Personal Concierge" INSIDE Meridian, logging to admin + WA-notifying the admin, "No gate — all brides. Later tier-gate via couples.tier" (:1–:5). A human-concierge hand living in Meridian's room; P4's prompt polish and any R-2 bench should name it so the two concierges (AI Meridian, human request) don't blur in copy. Also: Meridian's history is on the SAME `conversations` table by kind (`meridian_self`) — the kind-vocabulary adjacency of §5 applies here too.
- **Surprise (R-3):** pool mechanics verified clean and thin (§1) — the floor R-3 builds on is real; nothing pre-empts it.

## §4 — THE BRIDE INBOX (R-5): A FROM-ZERO BUILD, MISLABELED AS AN EXTENSION

Derived absences, each by command: `src/lib/notify.js` — no such file; `find src -name "notify*"` → nothing bride-relevant; `grep -rln push_subscriptions|webpush src/` → empty; [PUBLIC-0099] carries neither table; [LADDER] adds neither through 0119; **`0083` = failed_turns** (webhookCore dead-letters). Consequences, stated plainly for the charter:
- 0089's BOTH conditional arms are void (nothing to extend, nothing to amend).
- The "notify() remains the single notification writer" guardrail guards a writer that doesn't exist; the true current single-notification-writer for couples is the WhatsApp lane via `sendWa`/templates.
- The 09 masterplan row's "notify()" reference (which this spec leans on) describes intended machinery, not shipped machinery, at these tips. If a notify home exists in some form FC-1's greps missed under another name, the P5 read-first should find it — but three independent probes (filename, table witness, API usage) all returned zero.

## §5 — THE RELAY SEAM (moving ground, stamped at `31eaa68`/`c0faa4e`)

What LIVE machinery already occupies the ground P5's wired events name:
- **"Enquiry replied" is DELIVERED today, on WhatsApp:** the hand arc (CE-213→CE-215 + the OOW completion) ships composed vendor→bride messages through door-owned staging (`0117_pending_couple_drafts`, five-state CHECK + 24h expiry; `0118` adds refusal_reason), window-first (`coupleWaWindow.js`, pair-contract predicate, `VENDOR_LANE_KINDS` the kind→lane first home), with OOW content legs `tdw_enquiry_reply_couple` (`{{3}} === body` byte-exact) and `tdw_enquiry_update_couple` — both Meta-approved, wire-witnessed, mapped at `templates.js:83–:199`. First receipts have reached a vendor handset; auto-send exists; the expiry cron speaks the clock.
- **The `couple_thread` writers in `vendorInbound.js` and the merge-not-drop/attribution cures (F-06.151/.152) own her thread's assembly.** Any P5 "reply lands → bell rings" wiring that reads or annotates her thread must go through that seam's laws, not beside them.
- **The proposals tray (P5's reserved slot for 16)** now has TWO staging candidates in the estate: `pending_event_proposals` (the register-constraining precedent 0117's own comment cites) and `pending_couple_drafts` (the relay's store, shown-bytes=sent-bytes by equality). A tray designed without naming which store feeds it will fork the staging model.
- **Kind-vocabulary adjacency:** her `conversations` rows already speak `meridian_self`, `circle_thread`/`dm:` + discriminator (Report B §4), and the vendor-lane kinds map. P5's inbox kinds/prefs taxonomy is a NEW vocabulary entering a table with three live ones and one first-home map.
FC-1 asserts only what IS at these tips; every "should" above is phrased as collision-radius for Q-2, not design.

## §6 — RULINGS R-1…R-6, GRADED

| # | Grade | One line |
|---|---|---|
| R-1 parity law | **CHARTER-BLOCKED upstream** | the contract is 13-P6's unbuilt matrix; several rows pre-closed by shipped sanctuary doors (§2) — the matrix must be built to know the delta |
| R-2 Meridian | **VERIFIED; polish-only honest** | + the concierge.js adjacency named |
| R-3 Surprise v2 | **CLEAN FLOOR** | pool-by-tags live; Haiku layer/seen-tracking/ceremony unbuilt; ceremony's splash ingredient absent (Report A §4) |
| R-4 envelopes | **UNBUILT WHOLE** | table/column/tools all absent; ⚠ answered (couple_receipts); ladder-number provenance open (Q-1) |
| R-5 inbox | **PREMISE-BROKEN** | §4; from-zero build; 0089 void both arms; the relay arc owns the flagship event's live delivery (§5) |
| R-6 enrichments | **SPLIT** | payment affordance partly shipped; milestone mirror's join ABSENT with no committed matching rule; masthead collides with 13's extraction sequencing; briefing.js pointer misdirected |

## §7 — PROPOSED DEFECTS (no numbers; CE-30 banks)

**PROPOSED-15.A — R-5's foundation premise is false in the spec's own ink.** The spec asserts notify()+two tables at "0083, execution state CHECKED"; 0083 is failed_turns [LADDER], the tables are on no witness, the writer doesn't exist, and 0089's conditional cannot execute in either arm. The §3.5 amend-once pass must re-found R-5 as a new-machinery charter (or re-point it at machinery FC-1 could not find — three probes empty, stated).

**PROPOSED-15.B — The milestone mirror's join is ABSENT and the spec's fallback ("wire the smallest read endpoint") under-states the gap:** there is no matching RULE, not just no endpoint — couple_bookings↔invoices have no committed key (evidence §2). Wiring "smallest" without ruling the key would mint a heuristic join over money display. Fork (explicit FK migration / lead-based match / phone-based match / defer the mirror) is the CE's.

**PROPOSED-15.C — P3's briefing.js instruction points a vendor-lane WA composer at the bride masthead** (consumers derived: vendor cron + vendor index + studio). As written it would either drag vendor-window logic into her room or be silently reinterpreted by an executor — the exact class §3.5 exists to catch pre-build.

**PROPOSED-15.D — P6's facade/INR premise ("confirm done or close it") will find NOTHING done on bride surfaces:** facade adopters are three files, none couple-side; zero usage rows written by any couple router (derivations §1). Real scope is an adoption arc across chat/meridian/brideEngine (+ circleEngine per Report B) — and it overlaps the CE-30 spend charter; the two must be sequenced as one subject or explicitly split, lest two sittings meter the same lane twice differently.

*(Not proposed: the matrix's absence — upstream deliverable; the relay arc's occupancy of "enquiry replied" — shipped, ruled product; the 0088/0089 holes — lawful; splash absence — Report A's.)*

## §8 — QUESTIONS FOR CE-30

**Q-1 — 0088/0089's register status:** are these numbers RESERVED to block 15 in any chair record FC-1 lacks, or free? (0097/0098 have ink at 0099:10; these don't.) Determines whether P2/P5's DDL keeps the numbers or takes next-free above 0119.

**Q-2 — The inbox×relay design fork (the report's largest):** does R-5's bell for "enquiry replied" (a) mirror the WA delivery as a second surface with the drafts store as source-of-truth, (b) subscribe to her `couple_thread` writes at the F-06.151 seam, (c) defer the event to block 16's signal as the spec's tray-slot language half-suggests, or (d) other? Every arm touches live moving ground; FC-1 maps the radius (§5) and proposes nothing.

**Q-3 — Masthead sequencing vs 13's extraction:** P3.1 before or after the Dream bloom extracts? (Evidence §3; pure sequencing, founder's word.)

**Q-4 — Does R-5 still target web-push at all** given the estate's delivery organ is WhatsApp-first and no push machinery exists — or does the "bell" re-scope to an in-app inbox sheet + WA, with push a later block? (Names the cost of the from-zero build honestly before it's chartered.)

## §9 — WHAT A 15 EXECUTOR MUST NOT DISCOVER MID-SITTING
1. No matrix yet — the contract is upstream (13 P6).
2. Her expense plane is `couple_receipts`; `expenses` is the vendor's.
3. The payment door exists and sanctuary consumes it; the milestone mirror has NO join and NO rule.
4. notify()/notifications/push_subscriptions: none exist; 0083 is failed_turns.
5. "Enquiry replied" already reaches her handset via the relay arc; the drafts store constrains its register; her thread has assembly laws (F-06.151/.152).
6. Meridian is exactly as documented — haiku-always is ink; concierge.js shares its room.
7. briefing.js is vendor machinery.
8. brideTools has no envelope vocabulary; the soul learns it in ONE woven line per the spec — a W-1-adjacent act needing its own veto.

— END TDW_FROST_AUDIT_15 · FC-1 @ dream-os `31eaa68` / dreamos-pwa `c0faa4e` —
