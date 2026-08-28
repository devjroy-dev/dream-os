# TDW_09 · M-WORKLIST P3.5 — THE PLANE SPLIT, NAMED
**Over `aeca43f`. Packet `e6ba42d739fe3d8be4859f538602fb321be3ddd5eacab2e43256844365bb5ba8`.**
**Delivered by the dream-os seat under CE-38's kickoff and RELAY #1. Zero DDL, zero migrations, zero predicate change on either plane.**

```
b41_ist_clock_bench      27 cells · exit 0 · both-ways: 12 RED uncured, 0 cured
b39_worklist_today_bench 64 PASS · 0 FAIL  (byte-stable, 64/64)
b15_schema_register      exit 0 · GREEN
b0451_crew_page_bench    111 passed · 0 failed  (the istToday consumer)
b07_f0774_stripper_bench 20/20 GREEN  (convicted b41 once; see §6)
run-floor.sh --delivery  FLOOR = NAMED BASE, no delta · 20 RED · exit 0
node --check             every touched file
```

Every count above re-derived at the moment of writing.

---

## §1 · FILE TABLE

| file | ruling | what changed |
|---|---|---|
| `src/api/vendor-engine/today.js` | R-P3.5.2 | local `istTodayISO`/`istPlusDaysISO` + `IST_OFFSET_MS` deleted; imports the home |
| `src/api/vendor-engine/cabinet.js` | R-P3.5.2 | same, `istTodayISO` only |
| `src/api/vendor/events.js` | R-P3.5.2 | same; `IST_OFFSET_MS` had exactly one reader and went with it |
| `src/api/vendor/context.js` | R-P3.5.2 | same, both functions |
| `src/api/vendor/studio/briefing.js` | R-P3.5.2 | local function **and** the second inline literal at `weekEnd` |
| `src/api/crew.js` | R-P3.5.2 | `istToday` becomes an alias of the home; **export preserved** |
| `src/lib/vendor/istClock.js` | R-P3.5.2 | labelled amendment; the retired paragraph struck |
| `src/api/middleware/resolveVendor.js` | R-P3.5.3 | header rewritten, tombstoned example struck |
| `scripts/b41_ist_clock_bench.js` | R-P3.5.2 | NEW — 27 cells, behaviour-shaped |
| `docs/FINDINGS_LOG.md` | R-P3.5.5 | CE-38 band, after CE-227 |
| `docs/TDW_09_WORKLIST_P3_5_HANDOVER.md` | §5 | this file |

**ZIP 2 adds:** `docs/db/PUBLIC_SCHEMA.md` (regenerated, +1 table), `docs/db/ENGINE_SCHEMA.md` (re-verified, body untouched), `src/api/vendor/worklistToday.js` (F-P3.12's one-liner).

**ZIP 3 completes R-P3.5.4:** the CONSTRAINTS ADDENDUM regenerated at **178 · 109 · 258**, all three guards passing, after the founder re-ran §1 above the editor's cap. See §8 and §9.

---

## §2 · R-P3.5.2 — SIX SITES, NOT FIVE, AND THE ONE THAT HID

The kickoff's ladder named six `istTodayISO` homes. Two of the six names were wrong in opposite directions and the correction is the finding:

- **`worklistToday.js` was never a home.** It has imported from `istClock.js` since Phase 3, at `:159`.
- **`crew.js:227` always was one**, and spelled itself `istToday`. Every census keyed on the symbol `istTodayISO` — including R-P3.5.2's own chartered grep cell — was structurally blind to it. `istClock.js`'s header caught it because a header names **sites**; a grep names **spellings**.

**A duplicate that renames itself defeats a grep.** Banked as a law-candidate in the CE-38 band.

`crew.js`'s export is load-bearing and survives: `src/api/vendor/studio/team.js:19` imports `istToday`, and `scripts/b0451_crew_page_bench.js:84` imports it and asserts the 18:30Z boundary at its §12. b41 §2.7 and §2.8 hold that contract; b0451 re-run 111/111.

`briefing.js` carried the offset **twice** — once inside its local function, once written out inline for `weekEnd`, which is `istPlusDaysISO(7)` spelled long. Its local used `.slice(0, 10)` where the others used `.split('T')[0]`; b41 §1.4 asserts those are the same ten characters rather than asking a reader to take a comment's word for it.

---

## §3 · THE DIAGNOSIS — F-P3.11, WITH THE FOUNDER'S ROWS AS WITNESS

Three founder-run blocks against `9888294440`, plus one probe. Predicates transcribed from `src/api/vendor-engine/today.js` and `src/api/vendor/worklistToday.js`; every column named its schema-doc line.

### The rows

**(a) engine reader — `open_leads_count` = 12**

```
12, f039b198, Verma,                 phone null, stage null, direction null,  2026-07-22 22:27:31.022958+00
12, c9b66b36, Meera,                 phone null, stage null, direction 'in',  2026-07-23 16:31:02.862367+00
                                     amount 200000 · received 200000 · pending 0 · payment_status 'paid'
12, 94d81734, Dev Test 23,           +919625759924, stage 'lead',             2026-07-24 08:38:51.162932+00
12, f7343fe3, Dev Test 23,           stage 'lead',                            2026-07-31 09:51:49.561471+00
12, 78452721, Dev Test 23,           stage 'lead',                            2026-07-31 09:53:06.803500+00
12, 2a617989, Dev Test 23,           stage 'lead',                            2026-07-31 09:53:14.516926+00
12, 29b99c77, Dream Wedding enquiry, stage 'lead',                            2026-07-31 10:15:43.601320+00
12, 6eede8eb, Dream Wedding enquiry, stage 'lead',                            2026-07-31 10:15:50.063009+00
12, 6d62b078, Dream Wedding enquiry, stage 'lead',                            2026-07-31 10:56:08.034472+00
12, db3e2bf2, Dream Wedding enquiry, stage 'lead',                            2026-07-31 10:56:41.063922+00
12, bc9669c0, Dream Wedding enquiry, stage 'lead',                            2026-07-31 14:37:09.241572+00
12, f593c338, Dream Wedding enquiry, stage 'lead',                            2026-07-31 14:43:12.754502+00
```

**(b) typed door — `lead_unanswered` = 11**

```
11, 41a706d7, Kunal Dhillon,         Jodhpur, 2027-03-07, state 'new', 2026-07-29 12:23:14.258074+00
11, 45a6ebca, Dev Test 23,           Delhi,               state 'new', 2026-07-31 09:51:48.909006+00
11, 5998610d, Dev Test 23,           Delhi,               state 'new', 2026-07-31 09:53:06.060005+00
11, 5b9e126d, Dev Test 23,           Delhi,               state 'new', 2026-07-31 09:53:13.929483+00
11, 5069d406, Dream Wedding enquiry, Delhi,               state 'new', 2026-07-31 10:15:42.921165+00
11, a27c3492, Dream Wedding enquiry, Delhi,               state 'new', 2026-07-31 10:15:49.392882+00
11, 6250fa1a, Dream Wedding enquiry, Delhi,               state 'new', 2026-07-31 10:56:07.022193+00
11, 2c5d70a8, Dream Wedding enquiry, Delhi, 2026-09-23, budget_max 300000, 2026-07-31 10:56:40.464709+00
11, bab5010d, Dream Wedding enquiry, Delhi, 2026-12-03,  state 'new', 2026-07-31 14:37:08.124402+00
11, 75002b1e, Dream Wedding enquiry, Delhi, 2026-12-04,  state 'new', 2026-07-31 14:43:11.821486+00
11, 88dbb52b, Sarah,                 Delhi, 2026-12-22, budget_min 1000000, 2026-08-26 18:48:54.544180+00
```

**(c) side-by-side — zero `BOTH` rows.** Twelve `ENGINE ONLY`, eleven `TYPED ONLY`.

**(probe) `engine.records` since 2026-08-01 — one row.**

```
1248902e, Expense, phone null, stage 'expense', direction 'out', hidden false, 2026-08-26 18:15:51.286171+00
```

### The mechanism

Nine of the twelve engine rows are echoes of nine of the eleven typed rows, each lagging its typed source by **0.588–1.118s**, all on 2026-07-31:

| typed | engine | lag |
|---|---|---|
| 09:51:48.909 | 09:51:49.561 | 0.652s |
| 09:53:06.060 | 09:53:06.804 | 0.744s |
| 09:53:13.929 | 09:53:14.517 | 0.588s |
| 10:15:42.921 | 10:15:43.601 | 0.680s |
| 10:15:49.393 | 10:15:50.063 | 0.670s |
| 10:56:07.022 | 10:56:08.034 | 1.012s |
| 10:56:40.465 | 10:56:41.064 | 0.599s |
| 14:37:08.124 | 14:37:09.242 | 1.118s |
| 14:43:11.821 | 14:43:12.755 | 0.934s |

**12 − 3 = 9 = 11 − 2. THERE IS NO TWELFTH ROW.** The sets are three-and-two apart; the difference of one is arithmetic coincidence — two independent divergences in opposite directions landing within one of each other on this account. On another account the same two defects produce any gap at all, including zero. A masthead built on either number would have looked correct on the day it shipped and drifted silently forever after.

**F-P3.11.a** — the planes share no key. **F-P3.11.b** — `isClientStage` reads `stage` alone, so a NULL stage counts as a lead: `f039b198` is an unclassified binder and **`c9b66b36` is a settled client, paid in full, counted as an open lead**, with `payment_status`(20) and `amount_pending`(19) sitting beside `stage`(10) in the row the predicate already holds. **F-P3.11.c** — the mirror is one-directional and lossy: `94d81734` has no typed row; `41a706d7` (source `victor`) and `88dbb52b` (Sarah, `discover`, the newest lead on the account) have no engine echo. The probe kills "the write path is dark" — one engine row landed **33 minutes before Sarah on the same day** — and leaves two unseparated sub-readings. **No cause is named.** **F-P3.11.d** — the ruled join was vacuous: `phone` is NULL on 21 of 23 rows, so **the pairing above is the seat's, by inspection, not machine-derived.**

Looked for and **not found in this data**, recorded so absence is not read as clearance: the `new`-vs-any-non-client vocabulary gap; the `deleted_at`/`hidden` asymmetry; and `'paid'` as a substring matching `unpaid`. All three are live; none is exercised here.

---

## §4 · R-P3.5.3 — WHY THE HEADER NAMES NO LIST

`grep -rln "require(.*middleware/resolveVendor')" src --include=*.js` at `aeca43f`: **36 files, 104 call sites** (65 no-param, 20 `paramName`, 19 `via`).

**The seat's first relay said 48. That was wrong and it is owned in the band.** It was a *mention* count and swept in `src/lib/billing/tierFlip.js`'s unrelated function of the same name. A census keyed on a symbol counts homonyms — the same class as `crew.js`'s hidden clock, one census up.

The tombstoned example `GET /api/v2/vendor/today/:vendorId` is struck. The address is still served, but the reader behind it retires at the §8.9 seam and P3.5 has just shown its count wrong by three in twelve. Mode 2's example is now `/cabinet/:vendorId`. The header carries the deriving command and its tip instead of a roll-call: **a header that lists 36 files is the next stale header.**

---

## §5 · F-P3.13 — THE SEVENTEEN, WITH ADDRESSES

Outside the worklist plane, uncured by ruling:

```
src/admin/router.js:99            src/agent/briefing.js:51
src/agent/engine.js:1209          src/agent/engine.js:1462
src/agent/brideSystemPrompt.js:247 src/agent/brideNudge.js:42
src/api/vendor-engine/chat.js:2687 src/brideIndex.js:73
src/brideCron.js:43               src/lib/vendorInbound.js:410
src/lib/istDay.js:61              src/lib/coupleAiCap.js:427
src/api/admin/bridge.js:109       ← IST_OFFSET_MIN = 330, the same constant in minutes
```

Plus prose occurrences at `src/engine/src/core/today.ts:58`, `src/engine/dist/core/today.js:62` and `src/api/admin/bridge.js:107`, which are comments and are **not** defects.

`bridge.js:109` is the one that matters for method: no grep for `19800` or `+05:30` can see it. The chartered cell would have gone green over a live duplicate.

---

## §6 · WHAT WENT WRONG IN THIS SITTING, OWNED

**① b41's first cut broke the one-home law.** §3.1 hand-rolled a comment strip so the cell would not RED on prose. `b07_f0774_stripper_bench` §4.3 convicted it on the first floor run — *nobody else defines a stripper any more.* **An existing bench caught a new bench**, which is the law working. Cured: imports `scripts/lib/stripComments`, carries `TDW_STRIPPER_CANARY`, and adds a **§0.Z INVOCATION** cell proving the call happens and bites (F-07.99). The naive rule was also genuinely wrong here — it eats a `/*` inside a regex literal, and this file is full of them.

**② b41 §2.7's first cut was itself presence-shaped.** It asserted `crew.istToday === home.istTodayISO`. That failed against a correct tree, because `fresh()` clears the require cache and re-loading mints a new function object — and worse, it would have **passed** against a `crew.js` that re-implemented the arithmetic in the same cache generation. **Reference identity is a presence claim wearing a behaviour claim's clothes.** Replaced with the four instants. Caught by running it: D-38.1 oblige ⑤.

**③ A killed floor run left a mutation on disk.** An interrupted `run-floor.sh` left `src/engine/src/core/tools/recordPrimitives.ts` mutated — `b06_m4_bench.js:410`'s non-vacuity arm, whose `finally` never executed. Restored and re-run clean. The tree did not do this; a killed process did. Banked as a law-candidate: **a mutation-restore `finally` does not survive a killed process**, so an interrupted floor run must be re-run on a restored tree before its output is read as a measurement.

---

## §7 · OPEN AT THIS SEAM

**R-P3.5.4** — the register regeneration. Three founder-run dump blocks issued; `docs/db/PUBLIC_SCHEMA.md` and `ENGINE_SCHEMA.md` regenerate on his paste, next ZIP. **F-P3.12** rides that regeneration as a generator fix **only if the fix is a one-liner**; otherwise filed, not cured.

**F-P3.11.c** — the discover door's mirror leg. Source read of the write path, next backend sitting. Two sub-readings unseparated.

**R-P3.5.6 ③** — before the §8.9 seam, a seat derives every reader of the engine plane and rules on `94d81734`'s class: a real lead that dies with the reader unless mirrored.

**F-P3.13** — the seventeen. **F-P3.7's CHECK and `engine.records.lead_id`** — both priced and shelved.


---

## §8 · R-P3.5.4 — WHAT REGENERATED AND WHAT DID NOT

### Guards, all five checked mechanically

| block | rows | guard | verdict |
|---|---|---|---|
| public columns | 71 | 71 | COMPLETE |
| engine columns | 25 | 25 | COMPLETE |
| constraints §1 CHECK/UNIQUE/PK | **100** | **178** | **THE CAP BIT** |
| constraints §2 foreign keys | 109 | 109 | COMPLETE |
| constraints §3 indexes | 258 | 258 | COMPLETE |

### `PUBLIC_SCHEMA.md` — regenerated. THE DIFF IS ONE TABLE.

**71 tables, 807 columns** (was 70 / 796, tip `0125`, 2026-08-15 — four migrations stale).

**The only new section is `public.engagements · 11 columns`** — `id · couple_id · vendor_id · category · status · source · enquiry_id · couple_booking_id · lead_id · created_at · updated_at`. That closes by name the doc-gap `worklistToday.js`'s own header §9.6 declared: *`public.engagements` is absent from the snapshot… If a future kind needs it, that is a §0.2 report, not an inference.* A future kind may now read it from a witnessed list. **No column appeared or vanished on any other table**, and no column changed type, nullability or default. The ladder-hole count moved 17 → 16 because `0090` now carries a file.

### `ENGINE_SCHEMA.md` — re-verified current. ZERO DRIFT.

25 tables, 244 columns, parsed back out of the document and diffed against the CSV column by column: **no section on one side only, no line different.** The body was not re-authored because there was nothing to re-author. Header updated to 2026-08-28 / `0129` / `aeca43f`, with the superseded 2026-08-13 line kept in prose so the fifteen-day unmeasured interval stays readable.

**One disclosed uncertainty retired:** this run used `format_type(atttypid, atttypmod)` where `engine_schema_dump.sql` still uses `data_type`. CE-32 disclosed that the departure might widen a diff with modifiers `data_type` drops. **On this plane it widened nothing.** The engine plane is now witnessed as holding no arrays and no modified numerics or varchars. Adoption into the dump file still rides F-SW.1.

### CONSTRAINTS ADDENDUM — NOT REGENERATED, AND THE ADDENDUM IN THE TREE IS STALE

The preserved addendum records §1 **173/173** · §2 **104/104** · §3 **253/253**. Live is **178 · 109 · 258** — five more in each. **The addendum is five constraints, five foreign keys and five indexes behind, and this delivery does not fix that**, because `append_constraints_to_public_schema.js` takes all three CSVs and one of them is truncated. A capped constraints list reports absence where there is only truncation, and absence is the fact that document exists to establish.

**F-P3.14 is filed:** the columns dump is immune to the cap by construction (one row per table, `string_agg`); §1 of the constraints dump is one row per constraint and has now outgrown the editor's default. Its only remedy is a human remembering a toolbar. §3 already returns 258 and survives only because the founder raises the Limit each run.

### F-P3.12 — DOWNGRADED, AND THE SEAT WAS WRONG

Filed against the register generator on the reading that gapped ordinals are a lying witness. **The regen falsifies it.** `public.leads` came back from live production with ordinals 1–18, 20–28 and `public.vendors` with 1–34, 43–53 — **identical to the document.** The generator emits `ordinal_position` verbatim; Postgres leaves holes where columns were dropped; the dump's own footer predicts exactly this. The register is honest.

What survives is smaller and real: `worklistToday.js` cites `deleted_at(20)` and a reader counting to the twentieth *line* gets `vendor_summary`. An ambiguity in a convention. **Cured as the ruled one-liner** — six comment lines at the source map saying the ordinals are `ordinal_position`, not list positions, and to match on the number rather than count.

**The class:** a seat convicted a generator on a document's shape without re-deriving the shape at origin. Verify-never-trust binds a seat's own findings, not only inherited ones.

### F-P3.15 — A COLLISION THE SEAT DID NOT RESOLVE

`OUT_OF_ORDER.json`'s `_README` says remove a record once the regen it is owed has run and the body describes the table. It has, and the body does. **But `b16_p1_engagements_bench.js` §1.11 pins `register.length === 1 && number === 90`, so removing the paid record REDDENS a green Block 16 bench** — witnessed here, then reverted.

**The record is left in place.** Removing it contaminates a P3.5 delivery with a Block 16 red; the alternative is a register row the document beneath it visibly refutes, which is self-disclosing and reversible by one ruling. Amending another block's bench is not this sitting's licence. Proposed: §1.11 asserts its real subject — `0127` takes no register row, and no record names a table the snapshot already describes.


---

## §9 · THE ADDENDUM, AND WHAT IT HAD BEEN HIDING

§1 re-run above the cap: **178/178**. With §2 **109/109** and §3 **258/258**, `append_constraints_to_public_schema.js` ran and replaced the addendum. Previous: 173 · 104 · 253. **R-P3.5.4 is discharged whole.**

Five new in each section. Four of §1's five are `public.engagements`'s own, arriving with the table — its category, status and source CHECKs and the `(couple_id, vendor_id)` UNIQUE. §2 gains its five FKs (`couple_id` and `vendor_id` CASCADE; `enquiry_id`, `couple_booking_id`, `lead_id` SET NULL — the engagement outliving its artifacts, per fork 6). §3 gains its five indexes, including the partial `engagements_lead_idx … WHERE (lead_id IS NOT NULL)`.

**The fifth §1 line is not an addition. It is a replacement, and it is F-P3.16.**

`couple_bookings_category_check` moved from the pre-0123 eleven (`photographer · videographer · mua · designer · venue · caterer · decor · florist · music · planner · other`) to ARC OB's canonical eleven (`planning · designer · photography · makeup · hairstylist · jewellery · decor · venue_catering · performer · content_creator · other`). **F-15.10's micro has landed.**

`src/api/couple/envelopes.js:22` still says it hasn't — that an envelope named `jewellery` *cannot match a booking today, because she cannot categorise a booking as `jewellery` at all*. It can now. `src/api/couple/bookings.js:12` already reads the new eleven, so two doors on one table disagree in prose about what that table accepts.

**Not cured here**, and deliberately: whether the micro also backfilled live rows is unknown to this seat, and a comment rewritten on half the facts is the disease it would be curing. Filed with its address and two questions for the chair, both answerable by one SELECT.

**The lesson the interval teaches:** the addendum went thirteen days unregenerated and in that window a CHECK three files reason about changed vocabulary entirely. A constraints addendum is not documentation — under the SQL-provenance law it is the *only* witness for what values a column will accept.
