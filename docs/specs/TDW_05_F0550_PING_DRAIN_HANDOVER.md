# TDW_05 — F-05.50(b) · THE ENQUIRY-PING DRAIN · HANDOVER
**Base `2028a0d`. §11 first motion clean at the charter's tip. Built to CE-68 R1–R9 and the closure addendum (founder: 「 A, WA-only, go 」). Zero migrations. Zero soul bytes.**

## 1. WHAT THE DISEASE ACTUALLY WAS (the kickoff's own sentence, corrected before a byte moved)
The kickoff said *NOTHING performs the passing*. Struck at CE-68. The vendor's **handset** always got the alert — `sendWhatsApp(vendorUser.phone, result.vendorNotification)` fires at all four couple call sites (`vendorInbound.js:419/:527/:630/:747`). What failed was that his **assistant** was blind to it, and for **two independent reasons**, not one: the notice row lands in `public.messages` via the public client (`engine.js:325/:418`), while the engine reads `engine.messages` through a client bound `db:{schema:'engine'}` (`db.ts:16`) — a different table on a different schema — and only *then* does the role filter at `memory.ts:93` apply. `vendorInbound.js:813` states the doctrine in the estate's own words.

**So: the bride's promise was kept on the human wire and broken on the agent wire.** A vendor answering *"tell her we're free"* handed Victor a pronoun with no referent, because `pending_lead_pings` — built for exactly that referent — has had **zero readers** since M5 deleted the orphan holding its only drain.

## 2. THE CURE — `src/lib/vendor/leadPings.js`, the reader that never existed
`fetchLeadPings(supabase, vendorId)`: reads this vendor's active pings (`acknowledged_at IS NULL` AND inside 0050's own ten minutes), renders the founder-ratified block, and **stamps them drained** — R2's shape **L1, surfacing is draining**.

**DOOR-BUILT, AND THAT WAS FORCED, NOT CHOSEN.** The engine's client cannot see `public.pending_lead_pings` at all. The door holds both planes (`vendorInbound.js`: `vendor.id` + `agentId`), so construction sits beside `fetchCalendarSnapshot`/`fetchScratchpad` and `loop.ts` receives an opaque string — `recentActivity`'s exact contract. Engine delta: **one optional arg + one gated line.**

**THE SITING IS THE PROVENANCE PROPERTY.** The block enters Victor's **system dynamic tail** (`pingBlock`, beside `calBlock`/`actBlock`), never the message stream. `vendorWords` (`loop.ts:441-446`) is built from user-role thread messages plus the message in hand — the owner's words only — because F-04.70's ₹50,000 came from exactly the neighbouring blocks. Sited here, a bride's rupee figure can **inform** Victor and can never **vouch** for a write. §2 of the bench lifts the shipped `dynamic` and `vendorWords` expressions out of the compiled dist and evaluates them to prove it.

**GATED ON `estateInRoom`, NOT ITS OWN GATE.** An advisor room loses the estate by ruling A-3 (`loop.ts:246-251`) precisely to remove the donor pool. A ping exempted from that gate would re-open it. **Consequence for the walk: the founder's test vendor must be in BUSINESS mode** — in Advisor the block correctly suppresses and the walk would read as a failure.

## 3. THE NAMED COST OF L1, DISCLOSED IN-FILE
A ping read on an **unrelated** turn inside its window is **spent**. If the vendor texts *"what's my Thursday"* ninety seconds after a bride enquires, the ping surfaces on that turn and is stamped; the pronoun turn that follows will not see it again. Accepted at R2; (L2) stamp-on-act is the faithful cure and was ruled to exceed this micro.

## 4. THE RIDERS
- **F-05.56 — DEFUSE-AND-LABEL (R4).** `engine.js:445-1503` (`handleOnboarding` + `executeTool`, ~1,059 lines) went zero-caller when M5 deleted `runAgenticTurn`, their last caller, and was never named. Header shipped: zero-caller-since-M5, the ruling cited, the M5 `classifier.js` precedent governing, a revival-or-deletion pointer. **Comment-only — engine.js's executable lines are byte-identical, asserted at §4.3 by stripped diff against `HEAD`.** Deletion takes its own ruling and is not here.
- **`arc_m5` §3.1 — LABELED AMENDMENT, COUNT PRESERVED (11).** Two words in the old label did work the assertion did not: *"three **live** writers"* (one is dead per F-05.56 — the `create_lead` hand inside `executeTool`) and *"ZERO readers"* (true, and only honest once its **sweep world** is named — the loop reads `src/agent/*.js`, and the drain lives in `lib/vendor` by design). §3.1b now asserts **where the real reader is**, inside the same cell, so the two facts can never be read apart.
- **F-05.57 — `docs/SCHEMA.md` rewritten (R5).** Six phantoms dead (`ping_type`, `bride_name`, `expires_at`, the UNIQUE, two fictional indexes, the 03:30 purge). Rewritten against the two agreeing witnesses (`0050:16-30` + `PUBLIC_SCHEMA.md:723-735/:1502-1508/:2668-2675`), with the writers-and-reader census stated.
- **F-05.58** — untouched, deferred-named to the next witnessed `ENGINE_SCHEMA` regeneration per R6. Never hand-patched.
- **R7 honoured:** `engine.js:353` byte-untouched, asserted at §6.2.
- **R3 honoured:** both `sent_by:'system'` notice rows stand, asserted at §6.3.

## 5. 🛑 DISCLOSED — FOUR THINGS I CHANGED THAT NOBODY ASKED ME TO
1. **THE BENCH'S OWN VACUITY, CAUGHT BY ITS OWN MUTATION HARNESS.** The first draft's `t()` was synchronous while every `§1`/`§3` cell was `async`. It called `f()`, never saw the rejection, and printed `ok` for cells that had run no assertion — **a green over nothing, in the bench built to prove a green over nothing.** Two mutations refused to go RED, which is exactly what §7 exists to notice. `t()` now awaits. **The finder was the harness, not me**, and I record that rather than quietly shipping the fix.
2. **A NO-OP MUTATION, ALSO MINE.** One §7 entry mutated `.eq('vendor_id', vendorId)` to `.eq('vendor_id', vendorId || vendorId)` — identical behaviour, so it could never RED. Replaced with one that actually drops the scope. **Two defects in my own non-vacuity apparatus in one sitting; the register at §8.**
3. **TWO LABELED FLOOR AMENDMENTS — THE BOTH-SIDES CLAUSE (CE-59).** `b0498_fresh_crew_rider_bench` and `b05_m2_vendor_inbound_bench` drive the **real** `processVendorInbound` with their own deps stubs; the door's dep contract gained `fetchLeadPings`, so both went RED on a missing dep. **Counts preserved (58, 2), zero assertion changes** — each stub gains `fetchLeadPings: async () => ''`, which is byte-identically the no-ping world those cells already asserted. **The alternative was to make the dep optional in production** so the old stubs stayed green; that would let a wiring regression land silently, which is the very disease this micro cures. The door fails **loud** and the stubs follow it.
4. **A STALE COUNT CORRECTED IN PASSING.** `index.js`'s deps comment read *"the 24-dep list"*; it was already stale at 27 before this micro added the 28th. Corrected to 28 with the staleness labeled, rather than left one worse than I found it.

**One further deviation, smaller:** `pingAge` reuses the actBlock's arithmetic (`snapshot.js:214-217`) minus its **third** branch — hours, past 90 minutes — which **cannot fire inside a ten-minute window**. Omitted rather than shipped dead (F-05.20's class), with `snapshot.js` named in-file as the sibling to copy whole if the window ever widens. Rendered output is byte-identical for every reachable input, so the veto's bytes are unaffected.

## 6. SCOPE HELD
- **WA-ONLY, as ruled.** The PWA door (`api/vendor-engine/chat.js:1457/:1550`) passes `recentActivity` and would pass this identically — **DEFERRED-NAMED, zero bytes now**, asserted at §5.3.
- **Shape (A), as ruled.** No `leads` join, no budget figure. `witnessLine.js`'s `rupees()` therefore has **no subject** and is **deliberately not imported** — a decorative import of a formatter with nothing to format is F-05.20's disease. §1.8 asserts the absence. If a future ruling puts a numeric budget in the block, `rupees` at `witnessLine.js:295` is the ONE home; never a second grouping function, never `Intl`.
- **Grazed, named, not touched:** F-05.53/54 (`enquiryToBinder` is the enquiry's other write; the drain adds no third writer of that fact) · F-05.48 (all four notification sends discard `sendWhatsApp`'s refusal sentinels, so *"the vendor got the message"* is an **unproven premise** at exactly those sites — not this micro's sweep) · F-05.55 (untouched) · `prospectCopy.js` (0-line).
- **An asymmetry named in the read-first and still true:** `enquiryToBinder` fires only on the TDW-code branch (`:597`, `:635`). Sites 1, 2 and 4 leave no engine-plane trace of the enquiry at all. Out of scope; recorded so it is not rediscovered.

## 7. PROVEN
`b05_f0550_ping_drain_bench` **31/31**, **five production mutations RED on their named cells** (the block leaving the dynamic tail · the A-3 gate going optional · the stamp disappearing · the vendor scope dropping · the door ceasing to hand it over), every mutated file restored byte-identical.

**THE FLOOR AT DELIVERY — 23 harnesses, all rc=0** (`npm run build` first; `arc_m2`/`m3`/`m4` and `b0498` are dist-dependent and RED at a fresh clone pre-build):
`arc_m1 53 · arc_m2 27 · arc_m3 11 · arc_m4 18 · arc_m5 11 (amended-labeled) · arc_m6 20 · crons 48 · sendwa 55 · webhookcore 11 · otp_meta 24 · b0498 58 (amended-labeled) · punct 17 · movementb 47 · transport 10 · m1b 4 · m2 2 (amended-labeled) · prospect 47 · checker 101 · onboarding 27 · couple_soul 21 · f0532 9 · media_shim 14 · f0550 31.`

**THREE LABELED FLOOR MOVES, the complete list:** `arc_m5 §3.1` (chartered, R4) · `b0498` + `m2` deps stubs (**unchartered, forced by the both-sides clause, disclosed at §5.3 above**). All three preserve their counts.
W-1 clean. `node --check` clean on all touched sources. `tsc` clean (`npm run build`). SQL: **zero** — no migration, no founder-run DDL, `0101` unreserved.

## 8. THE EXECUTOR'S REGISTER — ONE CLASS, TWO INSTANCES, BOTH MINE
**"The apparatus that proves the work must itself be proven."** A bench whose runner cannot see an async failure, and a mutation that mutates nothing, are the same defect wearing two costumes: **machinery that reports success without performing the test.** That is precisely the disease of this micro — three writers, zero readers, a promise with no machinery — and I built two miniature copies of it inside the cure for it. Both were caught by the one part of the apparatus that was working. The estate's sentence covers it: **trust evidence over narrative, including your own.**

## 9. THE FOUNDER'S STEPS
1. Apply the ZIP (block below), run the verify, push on green.
2. Railway redeploys the vendor service and rebuilds `dist` (the `pingBlock` seam ships as source; `src/engine/dist/` is gitignored and is never in the ZIP).
3. **Paste the read-only SELECT** (its own block). It is handed **first**, per R9 — the smoke card is authored against its result, never before it.
4. Walk the card **once**, after proof. **The test vendor must be in Business mode, not Advisor** (§2 above), or the block correctly suppresses and the walk reads as a failure.

## 10. NEXT
The post-arc shelf as the founder sequences it: F-05.42+F-05.39 · F-05.55 media dedupe · the auth sitting (F-05.13+28+30) · F-05.52 · F-05.53+54 · F-05.48 sweep · **F-05.56's deletion ruling** (new to the shelf this sitting) · then Block 06 to M-6 exit.
