# M-LEADGATE-RECUT · SEAT A′ — EXECUTOR HANDOVER

**Seat:** LE · **Repo:** `dream-os` ONLY · **Base:** `5be80d6` (fetch-first at this seat's own clone, equal to `origin/main` at read-first and re-derived at delivery) · **Rulings executed:** R-36.13 · R-37.4 → R-37.13 · **Chair corrections raised by this seat:** c-A′.1 · c-A′.2 · c-A′.3

**Relay guard:** clean. `origin/main` was the charter's tip exactly; no build for this scope existed beyond it.

---

## 1 · WHAT SHIPPED

| File | State | What |
|---|---|---|
| `src/lib/vendor/leadSerializer.js` | **RE-AUTHORED** | The connect gate. Allowlist → `{phone, email}` strip (R-37.4). `client` allowlist (R-37.7). `conversation`/`invoices`/`events` ride (R-37.6/.8/.9). The census constants (R-37.4's second half). |
| `src/api/vendor/leads.js` | modified | **BOTH DOORS RE-LAND.** List page and detail envelope serialize through the gate, mapper-first, gate-last. |
| `src/api/couple/enquire.js` | modified | The in-window basic alert **mirrors the card** — arm α, her name and the month (R-37.12). The null-name arm. The one-voice paragraph retired in place with its reason (R-37.5). |
| `scripts/b36_leadgate_a_bench.js` | **RE-FOUNDED** | 60 → 94 cells. §9 census guard new whole. |
| `scripts/floor-manifest-m-leadgate-recut.txt` | **NEW** | This delivery's declared-dirt table. |
| `docs/TDW_M_LEADGATE_RECUT_A_HANDOVER.md` | **NEW** | This file. |

**No migration. No DDL. No founder SQL in this delivery.** `0130` remains next-free. Plane read: `public` only.

**W-1 clean, proven by command:** `harveySoul.js`, `donnaSoul.ts`, `loop.ts` — zero diff. Also zero-diff: `eventWrite.js`, `templates.js`, `src/lib/vendor/leads.js`. **`dreamos-pwa` untouched** — Seat B′'s.

---

## 2 · THE ARCHITECTURE, AND THE ONE THING THAT MADE IT WORTH ARGUING

R-37.4 flipped the gate from an **allowlist over an existence-only wire** to a **strip of the connect-set**. The reason is not that a strip is simpler. It is that under R-36.13 the two architectures fail in opposite directions:

- an **allowlist** silently WITHHOLDS any column a future migration adds — which now fails closed **against the founder's own ruling** ("let it all be there");
- a **strip** silently PASSES any newly-named contact column.

Both failures are silent, and silence is the actual defect. So the strip ships with **§9, the census guard**: this sitting's dispositioned column and key sets are committed as constants in the serializer, and four independent extractors — the witnessed schema doc, each door's SELECT literal, the list mapper's emitted keys, the detail envelope's own return keys — diff the live tree against them and **red by name**. A strip that fails loudly is what the allowlist was actually buying, and this buys it without fighting the ruling.

**Every extractor REFUSES on a missing anchor** rather than returning an empty set. A check whose failure mode is a silent zero is not a check.

---

## 3 · PROOF

**`b36_leadgate_a_bench` 94/94** at the cured tree · **52/94 at the uncured tree `5be80d6`** — **42 cells red**, run on a control clone with only the bench copied across, then discarded.

**Non-vacuity by ELEVEN mutations of PRODUCTION code** (never test setup), each biting only its own cure, the tree restored byte-exact and re-verified at 0 reds after every one:

| Mutation | Cells bitten |
|---|---|
| M1 doors reverted (require + both calls removed) | 4 — the whole §0 wiring block |
| M2 connect-set narrowed to `{phone}` — email leaks | 3 |
| M3 over-redaction — `name` joins the strip | 4 — incl. the R-36.13 presence half |
| M4 the gate redacts EVERY tier | 8 — the essential+ regression |
| M5 the serializer mutates its input | 4 — history destroyed at read time |
| M6 `client` passed whole (R-37.7 defeated) | 2 |
| M7 `events` dropped (c-A′.2 regressed) | 3 |
| M8 the alert loses her name (arm α defeated) | 2 |
| M9 the list door selects an unclassified column | 1 — §9 leg B1, the census alarm firing |
| M10 `conversation` withheld again (R-37.8 defeated) | 1 |
| M11 the null-name arm invents a placeholder | 4 |

**PRESENCE IS PROVEN AS HARD AS ABSENCE.** Under R-36.13 an absence-only bench would green over a cure that quietly withheld her name, so her name is searched for **in the serialized bytes** and must be FOUND — on the list row, in the detail envelope, and in the in-window alert. M3 is the mutation that proves those cells are load-bearing.

**FLOOR: NAMED BASE, no delta.** Measured twice — once at the untouched tip before a byte was written (`FLOOR = NAMED BASE, no delta`, 20 REDs by name), and once **LAST**, in `--delivery` mode against `scripts/floor-manifest-m-leadgate-recut.txt`, on the tree that actually goes into the ZIP.

**Engine gate green** (`npm run build:engine`, RC=0, run before and after). `node --check` clean on all four touched `.js` files.

### THE VACUITY HOLE THIS SEAT FOUND IN ITS OWN BENCH, AND OWNS

§7's first draft rendered the alert body by **string-substituting** `${nameClause}` with a value the bench itself computed. The cells looked right and were hollow: M8 bit **one** cell where it should have bitten four, and M11 bit **one** where it should have bitten two. That is the INDEPENDENT-METHOD LAW clause 1 — a verification reproducing the method under test — and **it was found by running the mutations, not by reading the file.**

Cured: `renderBasicBody` now **compiles and executes the shipped literals** with the door's own variable names in scope. M8 rose 1 → 2 and M11 rose 1 → 4. The incident is written into the function's own comment so the next reader cannot re-introduce the substitution as a simplification.

The A-cut's §7 had the same shape (it retyped the composition into the bench). It is retired here.

---

## 4 · THE THREE CORRECTIONS RAISED AT READ-FIRST, AND WHERE THEY LANDED

**c-A′.1 — a cite that was false the day it was written.** The A-cut's comments pointed at `src/api/couple/enquire.js:504` for the `raw_message` composition. Derived across the arc: the line was `:504` at `ec828c8` and **`:580` at `7d625e8` — the A-cut's own commit moved it and wrote `:504` into three places.** This sitting's kickoff inherited it twice. Cured here by the **PATH-OVER-RANGE law**: every cross-file pointer in the serializer now names a FILE and a SYMBOL, which fails loudly instead of drifting quietly. **`docs/TDW_M_LEADGATE_A_HANDOVER.md` still carries the stale cites at `:55/:57/:58` and this seat did NOT edit them** — that file is the A-sitting's own record and rewriting another seat's history is not this seat's to do. Named here so the band can carry the correction.

**c-A′.2 — a block that vanished silently.** `getLeadDetail` returns `events`; the A-cut's `serializeLeadDetail` had **no `events` key at all**, so a basic vendor's detail envelope lost the linked-calendar block with no tell and no inventory line anywhere. Cured by R-37.9, and a cell now asserts the basic envelope carries **every key the ungated envelope carries**, so the class cannot return by omission.

**c-A′.3 — a phantom in the allowlist.** `wedding_date_precision` sat in `BASIC_DETAIL_FIELDS` while the detail SELECT has never carried it, so the entry could never match. It died with the allowlist, per R-37.11.

---

## 5 · DECLARED DEVIATIONS AND GAPS — ratify or revert

**① THE VETOED BYTE SHIPS WITH ITS NEWLINES, NOT AS ONE LINE.** The veto slot displayed both current and proposed strings **flattened** — `✶ New enquiry from The Dream Wedding — Hi {business_name}, …`. The shipped body has always been three blocks separated by `\n\n`, and the flattening was this seat's rendering in chat, not a proposed reformat. Since current and proposed were flattened identically, the delta the founder approved is unambiguously **the name clause and nothing else**, so the shipped string keeps `\n\n` and changes only the clause. **This is a declared deviation from the literal veto string; ratify or revert.** The bench pins the null-name arm to today's byte character-for-character, so if this reading is wrong the correction is one word in one expression.

**② `conversation` is the envelope's largest leak surface, and it now rides.** R-37.8 ruled it present on committed law and the chair flagged it to the founder with amendment power standing. Stated again here at full weight: up to twenty raw couple-thread message bodies now reach a basic vendor. Nothing in this build depends on the ruling holding — reverting it is one line in `serializeLeadDetail` plus one re-founded cell — but it should be reverted **deliberately**, with a `conversation_withheld` tell, because an empty array on a thread that exists is the "no messages yet" lie the A-cut's own comment warned about.

**③ F-10.122 STANDS OPEN AND THIS SITTING DID NOT MOVE IT.** The agent lane still does not read this gate — re-derived at this tree, and now a **bench cell** (§9) asserts it, so the day someone wires it, the bench reds and the sequencing law gets a ruling instead of a silent update. **`vendor_ai_daily_basic` does not move off zero.** This binds the founder's own hand at the admin console.

**④ Meta's live `Active` status for `tdw_lead_alert_basic` is NOT asserted by this seat.** It is not derivable from this container. It is a one-glance step on the card, never a claim of mine. The registry's pinned shape (name, 127 bytes, the F-08.104 quote, the three variables in order) IS asserted, at fourteen cells.

**⑤ `ENGINE_SCHEMA.md`'s freshness rule is falsified at tip** — its header states the ladder has never created or altered an `engine` table, and `0129` creates a unique index on `engine.agents`. Reported at read-first, minted by the chair as **F-SW.10**, out of this seat's radius, untouched here.

**⑥ The `budget_total` phantom is restated, not chased.** On the list wire `budget_total` is a **mapper alias** of `budget_max`, not a column. The real phantom is `snapshot.js` SELECTing `budget_total` from `public.leads`, which the witnessed 27 columns do not carry. §9 now has a cell that reds if either **leads door** ever acquires the same class.

---

## 6 · THE SMOKE CARD — NOT IN THIS ZIP, AND DELIBERATELY

**The build does not wait on rows; the card does.** BLOCK 3 (the walk-row picker) has not been run — the founder's paste returned BLOCK 1, BLOCK 2 and BLOCK 3's *text*, not its output. Under the FIXTURE-STATE LAW the card is authored **from the pasted rows and not before**, so no card ships here.

**What BLOCK 1 already settles, and what it does to the card:**

- The walk vendor is `Dev Roy Photography` / `23165e38-…3742`, **already `basic`** — no hand-flip is needed to enter basic. The flip SQL is for the essential+ control and the flip-back only, and it travels **with the card, conditional-withheld**, never beside this build.
- **`leads_with_email = 0`.** No basic lead carries an email at all, so **the email half has no thumb-path on production**. It is bench-only, proven at the payload, and the card will say so rather than let a green stand for something the eye cannot discriminate.
- **`leads_with_phone = 3` of 12.** Nine rows show no phone at any tier. **The card must name one of the three**, which is exactly what BLOCK 3 picks out.
- **`leads_with_name = 12` of 12** — the R-36.13 presence half is walkable on any row, and those twelve rows are the exact live blast radius of the `Unknown` class the A-cut's walk exposed.
- Newest lead is **2026-08-11**, so no 24h window is open; the in-window alert step needs the fresh enquiry the card already creates.

**Walk shape, once BLOCK 3's rows land:** the named lead's **list door** (her name, date, city, budget visible; **no phone**) · the same lead's **detail door** (name, free text, notes, invoice, events, thread all present; **no phone, no email**) · **one in-window basic alert on the founder's own handset carrying her name and the month** · then the flip to a paying tier, reload, contact returns; flip back.

**Walk B (the OOW template leg) stays HELD** and was not fired.

---

## 7 · WHAT THE NEXT SITTING PICKS UP

1. **BLOCK 3's rows → the smoke card → the founder's walk.** The card is the only thing owed before this arc is witnessed.
2. **Seat B′ (`dreamos-pwa`)** — the connect slot where the contact buttons sit, two vendor-facing copy bytes to veto. The wire is ready for it: `redacted: true` rides every basic row and envelope, and the contact buttons at `SliceRow` become tier-true automatically because the wire simply stops carrying phone. **Absent is truthful; that is the whole design.**
3. **F-08.104's micro** (the approved template's stray quote — the obvious fix is a trap; the cure is a real trailing clause, and it re-submits the template to review).
4. The deviations at §5 ① and ②, ratified or reverted.

**Copy inventory for this seat: exactly one vendor-facing string changed** — the in-window basic alert body. Zero persona names in product chrome. **No live surface was rewritten** — the two doors are mappers, not pages.
