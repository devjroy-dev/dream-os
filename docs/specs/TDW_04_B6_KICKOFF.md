# TDW_04 — B6 KICKOFF (the closing sitting) — CE-authored 2026-07-17

**CE-22:** dream-os `063d9b0` = `origin/main`, **fetched and re-derived at the moment of writing** per F-04.67's cure (`git fetch -q origin && git rev-parse --short origin/main`) · dreamos-pwa `552646d`, untouched since the B1 seal · Railway green: **NOT CLAIMED** — the CE has no Railway visibility, and this kickoff's own delivery is docs-only, so nothing in production executes anything it carries.

**Chair note:** this is the successor CE's first kickoff. All standing rulings inherited; the succession note's §2 state claims were re-verified at HEAD by command before this was written (2fc60e1 ancestor-verified; `describeDate` confirmed exported with zero callers; the `[handle]` header confirmed live at `fetchCalendarSnapshot`; `recordPrimitives.ts:650/:660` confirmed carrying the ORIGINAL optimistic strings; `me.js` allowlist confirmed twelve entries, zero `slot_capacity`; `SCHEMA.md:5` confirmed stale — cured in this same delivery; the masterplan 04 row confirmed CURRENT at `eb80f97` and struck from the doc-sweep).

---

## §0 — READ LADDER (in order, whole, before any code)

1. `docs/TDW_BUILD_PROTOCOL.md` — **including the new §9** (promoted at this block close; each law was paid for in this block's record).
2. `docs/TDW_00_MASTERPLAN.md`.
3. `docs/specs/TDW_04_CALENDAR_FINAL.md` — **whole**, with P4/P5 read twice. It is 42 lines of spec the B5 executor never opened; three of the surfaces packet's eight items live in it verbatim.
4. **Your charter:** `docs/specs/TDW_04_B5_TO_B6_HANDOFF.md`, whole. Then this kickoff's §2 (CE addendum), which post-dates it and rules on its open items.
5. The discipline spine: `TDW_04_B3_TO_SPINE_HANDOFF.md` §0 · `TDW_04_SPINE_TO_CHECKER_HANDOFF.md` §0 · `TDW_04_CHECKER_TO_B4_HANDOFF.md` §4 · `TDW_04_B4_TO_B5_HANDOFF.md` §4. Four sittings of the same lesson: **tool-verified work holds; authored work drifts; not one drift was caught by re-reading.**
6. `docs/FINDINGS_LOG.md` — the F-04.41 → F-04.67 band whole.
7. **Before the surfaces paper (item 3) and not before code items 1–2:** `docs/TDW_03_CROSSPLANE_CENSUS.md` whole · `docs/db/PUBLIC_SCHEMA.md` (the `vendors` and `events` tables + constraints addendum at minimum, whole if fresh) · `docs/db/ENGINE_SCHEMA.md` · `docs/specs/TDW_04_LEDGER_AND_CALENDAR_FINAL.md` · `docs/TDW_04_AUDIT_FINDINGS.md` · `src/lib/vendor/eventWrite.js` whole · both doors whole · `dreamos-pwa app/vendor/calendar/page.tsx` (READ-ONLY — no PWA file is EDITED before the surfaces plan is ruled). **This is Q-B5-4's ladder, ruled "finish," undischarged for two sittings. It finishes here, and your first message states which of these you have read.**

## §1 — GROUND RULES (unchanged, restated because each one bit someone)

One sitting = one session; bank at the first authored-drift tell (handoff note, reincarnate). Verify never trust — every table, column, route, and line number checked against HEAD before use; line numbers in this kickoff are given once and then grepped, never relied on. `eventWrite` is the only writer of `public.events` on vendor paths; the census of record is spec §3.1. Four kind lists live in that neighbourhood; unify none. The ternary is ratified (3/8/2=13); membership asked positively. Force semantics have one home (`occupancy.js`'s `isRefusal`/`isOverridable`); `isOverridable` never rides the wire. Deliveries: `deploy/`-prefixed ZIPs, `unzip -l`-verified, zero dotfiles, apply block targeting `/workspaces/dream-os`, `# repo: dream-os` as line 1, every founder line pty-rehearsed in its exact shape. Gates: `node --check` every touched `.js`; engine touches add `tsc` + `npm run build` + `node src/engine/smoke.js` + tombstone bench 15/15; **all three benches green in the founder's exact verify string** (`node scripts/checker_bench.js | grep "══" && node scripts/b3_rider_bench.js | grep "══" && node scripts/b5_describe_bench.js | grep "══"` → 101/101 · 20/20 · 18/18). WhatsApp engines untouched (`calendarSignals.js` exempt until 05 — F-04.65 stays named, not touched).

## §2 — CE ADDENDUM: RULINGS (post-handoff; citable as R-B6-n)

**R-B6-1 — F-04.66's cure is RULED: the proposed shape is ADOPTED. P4.1 and the cure ship as one ZIP.**
The ids leave `fetchCalendarSnapshot`'s prose and the word *handle* leaves with them. The snapshot's lines become referents Victor can SAY — title + date (`- 2026-11-22 · Meera Kapoor - wedding shoot (shoot)`) — and the same edit adds P4.1's date-pressure line per spec P4.1's own words (next 30 days: occupied slots · blocked days · muhurat · lead-interest dates; one dense line, words not tables), fed by `describeDate` (its chartered caller at last; the eleven-null warrant in its header governs — OFF is spoken as OFF, never as free). Siting stands as re-ruled at B4 §3: `fetchCalendarSnapshot`, one home, door-fed — not `donna.ts`.
**The known second half, ruled in scope:** the mutation path's resolution gate (grep `UUID_RE` in `chat.js` — the "full valid handle" branch) currently requires a UUID; strip the snapshot's ids without extending it and every edit/cancel reference strands. The gate gains a **sayable-referent leg**: vendor-scoped resolution on exact `event_date` + title match (prefix-tolerant), live rows only (`deleted_at is null`, `state <> 'cancelled'` — the covenant). **Ambiguity resolves to honesty, never to a guess:** two candidates → "tell me which one," listing both by title + date. `resolveClientReference.js` is the precedent to read first, not necessarily the code to reuse — if one home for reference-resolution is achievable without forking a rule (F-04.36's shape), take it; if not, say why in the diff header.
**§0.2 applies in full:** run this ruling against the code before building it. If it cannot execute as worded — if the UUID gate serves callers the CE has not seen, if the snapshot feeds a consumer beyond Victor's context — STOP and report with the evidence. The report costs one round trip.
**Bench (extends `b5_describe_bench` or a sibling):** (a) no UUID pattern appears in any snapshot string, asserted by regex against the built output; (b) the resolution leg's exact-match, prefix, ambiguity, and zero-match cases; (c) the date-pressure line renders OFF-honest for a `RULED_OFF` category. **The soul half stays 06's** — whether Victor should voice an internal handle even when handed one is not this sitting's question; after this ZIP he is no longer handed one.

**R-B6-2 — The surfaces packet is PAPER FIRST, census-read, ruled before built.**
Q-B5-4's ladder (§0 item 7) finishes before the paper is authored. The paper enumerates the eight named items — per-slot STOP + `0078` · the capacity settings row (`me.js` allowlist + P3's "Working capacity" stepper) · the horizon contract (Q-B3-12; `DEFAULT_WINDOW_DAYS=400` is an interim and `HARD_CAP .limit(200)` silently truncates a busy studio) · the day sheet's inline conflict verdict on Move (rides the 409 body whole; a force affordance, if proposed, exposes a checker-computed boolean, never the rule) · the `reason:'Blocked'` pill default · AddSheet's Block offer (F-04.37's CRUD-door class) · the 57-reader census with the 5:3 blocked-majority ratio re-derived from the census file, not the charter · what ships vs. hands forward — with a split proposal (what is one sitting, what is two). Subset-proposal pattern: paper → CE ruling → build. **No PWA file is edited before the ruling.** F-04.63's `0078` is **NOT chartered at B6** — it belongs to the surfaces build sitting, after the paper is ruled, one founder-run migration per sitting.

**R-B6-3 — Q-B4-6(b) charter CONFIRMED:** the composed-reply save, its own ZIP, **after** R-B6-1's green. Engine touch: full engine gates. Until it lands, the thread preserves the fabricated half of F-04.55's contradiction and the door's honest half evaporates on refresh — it is the cure; the softened strings are not.

**R-B6-4 — The softened tool strings (`recordPrimitives.ts:650/:660`) ship in R-B6-1's ZIP if and only if the founder's veto slot below reads YES.** They are vendor-visible through the model; utility copy ships founder-vetoed or not at all. The kickoff carries the veto verbatim (§4). If NO, the originals stand and the fact is recorded here.

**R-B6-5 — Q-B5-3 is answered by scheduling, not by memory** (the Rahul Sharma precedent: memory ruled unavailable, the record decides). F-04.42, F-04.44, and T12 ride B6's founder smoke card (§3) as three plain steps. Six sittings unwitnessed ends at B6 or the count becomes seven **on the record**, stated in the handover either way. The evidence reader is the executor (log lines for .42, snapshot text for .44, `linked_binder_id` for T12); the founder only performs the steps and pastes.

**R-B6-6 — T19 at block close:** founder-run, green banner, full header + pasted rows, **re-derived — the triple is never carried** (the charter's `/4`, the census's `/1`, and the masterplan's `/1` disagree; the run settles it and the discrepancy is EXPLAINED or FILED, not averaged). The census doc and masterplan row update to whatever the run says, in the same delivery. **A green oracle is not a clean estate** — the sentence rides the entry verbatim.

**R-B6-7 — Doc-sweep, re-scoped by verification:** `SCHEMA.md:5` — **CURED in this kickoff's own delivery** (front page now points at the witnessed schema docs; the ladder line reads 0077). Masterplan 04 row — **current at `eb80f97`, STRUCK from the sweep.** `events_vendor_date_blocked_idx` — stays "someone should look"; DDL still NOT proposed; if the surfaces census (R-B6-2) happens to witness the read paths, the finding gains its evidence there, free.

**R-B6-8 — Block close and what closes it.** TDW_04 closes when R-B6-1 is founder-witnessed live, the surfaces paper is ruled, T19 is re-derived green, the smoke card's three inherited items are witnessed (or their seventh-sitting status stated), and the block handover is written. B7/B8 (imports + Snap-a-Date, `0095`) stay 04's parked tail, chartered separately. **Priority order for the sitting: (1) R-B6-1's ZIP → (2) §0 item 7's ladder → (3) the surfaces paper → (4) T19 + smoke card → (5) Q-B4-6(b) if the session is still fresh.** Banking mid-list is lawful and expected; a banked item hands forward by name.

**R-B6-9 — After 04 closes, the founder-ruled sequence stands:** 06 (the soul block, pulled forward — its packet assembles at ITS kickoff from the succession note §6 + FINDINGS_LOG's routed items; nothing in B6 pre-empts it) → 05 (F-04.65's cure) → 16 (identity spine, with its §3.5-style audit) → 07–15 by business pressure.

## §3 — THE FOUNDER SMOKE CARD (plain steps; the executor reads the evidence)

Run after R-B6-1's ZIP is applied and deploys are green. Paste what each step shows.

1. **The handle test (R-B6-1's witness):** open the vendor chat, ask Victor *"what's on my calendar?"* — his answer must contain **no long letter-number codes** anywhere. Then: *"move [any booking he named] to [a new date]"* using only its name — it should move, and he should confirm by name and date.
2. **F-04.42 (six sittings owed):** ask Victor to move any booking from one date to another. That is all — the executor reads the turn log; no `donna_unblock_date` may appear in it.
3. **F-04.44 (six sittings owed):** in chat, add a new enquiry with a budget (e.g. *"new lead, Ritu Malhotra, budget 2 lakh"*). Then from the list page, edit any single field on that lead. The executor reads the snapshot both times; the figure must appear in both.
4. **T12 (three blocks running):** ask Victor to put a calendar entry on a date for a **brand-new couple name** he has never heard. Then, in a later message, file a lead for that same name. The executor checks the event gained its binder link.
5. **The date-pressure line (P4.1's witness):** ask Victor *"how's my month looking?"* — his answer should speak of held and open days in his own voice, no tables, no codes.

## §4 — FOUNDER VETO SLOT (utility copy, verbatim; R-B6-4 executes the answer)

Current (what the calendar tool tells Victor the instant he asks, before the calendar has decided): `Booking requested: … — it is being placed on the calendar.` / `Block requested for … — the day is being taken off the calendar.`
Proposed: `Booking requested: … — sent to the calendar; it will confirm or refuse.` / `Block requested for … — sent to the calendar; it will confirm or refuse.`
**Founder's answer: ____ (YES = ship proposed / NO = keep current).** Recorded here by the executor at sitting open.

## §5 — WHAT THIS KICKOFF'S OWN DELIVERY CHANGED (so B6 does not re-do it)

`docs/TDW_BUILD_PROTOCOL.md` gained §9 (the block's promoted laws — the succession note §5 list, CE wording). `docs/SCHEMA.md`'s front page was corrected (0077; witnessed-docs pointer). This file was created. **No code, no migrations, no PWA files** — three docs, `node --check` N/A, benches unaffected by construction.
