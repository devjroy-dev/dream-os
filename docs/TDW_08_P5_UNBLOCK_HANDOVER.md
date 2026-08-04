# TDW_08 · P5 — HANDOVER: THE UNBLOCK SITTING

**Base:** dream-os `e34e55b` · dreamos-pwa `e3210b5` (**ZERO pwa bytes**).
**Ruled to:** the Session A charter (four items, pre-ruled) · CE ruling R-A1–R-A7
(Session A read-first) · the CE addendum AD-1–AD-4.
**THREE ZIPS, IN ORDER: items 1+2 · the const · the prose.**

---

## 1 · WHAT SHIPPED

| Ruling | File | What |
|---|---|---|
| R-A2 / F-08.87 | `src/agent/engine.js` | the couple lane joins the one date resolver; precision written on BOTH write paths; the year-bump preserved |
| R-A3 / F-08.86 | `src/agent/engine.js` | the vendor alert joins `witnessLine.rupees`; the founder-vetoed range form |
| R-A1 / R-A3 | `scripts/b08_p5_unblock_bench.js` **NEW** | 15 cells · 8 mutation arms |
| R-A6 | `src/agent/souls/closerSoul.js` (ZIP 2) | `SOUL_CHAR_CEILING` 13,850 → 14,300, **its own commit**, ladder + cut order extended |
| R-A6 | `scripts/b08_p5_closer_bench.js` (ZIP 2) | ceiling cell re-pinned, mutation arm re-anchored |
| AD-4 / Rider 1 | `src/agent/souls/closerSoul.js` (ZIP 3) | the on-your-behalf beat, founder's bytes verbatim |
| Rider 1 | `scripts/b08_p5_closer_bench.js` (ZIP 3) | 5 Rider cells · 2 mutation arms · **count 244 → 249 DISCLOSED** |
| AD-2 | this document, §7 | the vendor-alert template draft, submission-ready |

**ZERO SQL. ZERO migrations. ZERO pwa bytes. ZERO template-registry bytes.**

---

## 2 · ⚠ §0.2 — F-08.89 MINTED AGAINST MY OWN BUILD: SITE 2 IS DEAD CODE

**This is the sitting's most important sentence, and it reverses part of a ruling I
had already built.**

The charter and R-A3 name two F-08.86 display sites: `engine.js:366` (the vendor
alert) and `engine.js:696` (`list_leads`). Both render `Rs X.XL` by the same
`toFixed(1)` shape — that half re-derives exactly as the chair verified it, and the
chair's verification was not wrong about anything it asserted.

**But `:696` lives inside `executeTool`, and `executeTool` has ZERO CALLERS.** It sits
below the F-05.56 banner at `engine.js:630` — *"EVERYTHING BELOW THIS LINE HAS ZERO
CALLERS SINCE ARC M5"* — inside the DEFUSED ISLAND. `list_leads` renders `Rs 4.5L`
**to nobody**. No vendor has read that string since Arc M5.

**HOW IT WAS FOUND, and the method is the whole point.** I wrote the cure first. The
floor caught it: `b05_f0550` went **31/0 → 30/1** on `§4.3`, a cell whose entire
purpose is to stop a sitting moving an executable byte inside the island — it diffs
the island against commit `5335bb2` and freezes it pending the deletion ruling.

**THE CURE WAS REVERTED TO BYTE-ORIGINAL RATHER THAN THE BENCH AMENDED.** A bench that
exists to freeze dead code, silenced so that a sitting can tidily cure that dead code,
is the floor working correctly and being overruled for appearance. `b05_f0550` is back
at **31/0** and site 2 ships **uncured, deliberately**.

**F-08.89 IS MINTED FOR IT** (my free mint per R-A5/AD-4): *F-08.86's second display
site is inside the F-05.56 defused island and reaches no wire; the live second carrier
of the L-shorthand on the vendor briefing is elsewhere.* `§4.4` of the new bench
asserts that **state** rather than a cure, so the next sitting that either cures site 2
in place or deletes the island is forced to re-read the paragraph.

**THE LIVE SECOND CARRIER, DERIVED AND NOT TOUCHED (unruled arm):**
`src/agent/briefing.js:169` renders ``Rs ${(balance/100000).toFixed(1)}L`` on the
vendor briefing and **is live** — `buildBriefing` is required at `src/cron.js:38` and
`src/index.js:19`. It is a different subject (an invoice balance, not a lead budget),
so it is reported, not folded in.

**⚠ ONE MORE THING THE ISLAND SWALLOWS, and the chair should know it.** The vendor
lane's `create_lead` — the resolver call the charter cited as the model for item 1
(`:588-597` at charter base) — is **also inside the island**, at `:692` post-cure. The
cure is unaffected: `resolveWeddingDate`'s home is `src/agent/datePrecision.js`, which
is live and read by `systemPrompt.js:396` and `donnaLead.ts`. But "the vendor lane
resolves it properly" is a statement about **dead code**, and the live vendor-side
resolution runs elsewhere. Named so nobody inherits it as a live claim.

---

## 3 · THE FOUR ITEMS

### ITEM 1 — F-08.87, THE PRECISION DROP (CURED)

**The ruling re-scoped and reported, not re-worded.** The charter ruled the vendor
lane's resolver HOISTS to one home and both lanes call it. Half was already true:
nothing lived inside the vendor lane to hoist — `resolveWeddingDate` has lived at
`src/agent/datePrecision.js` since Patch 8d. **One limb, not two:** this lane joins.

**Three obligations, all carried:**
1. **The year-bump preserved** (§8). The inline parse rolled a past date forward a
   year, twice if needed; the resolver has no such rule (`setFullYear` appears nowhere
   in `datePrecision.js`, asserted at `§2.3`). Applied **after** resolution: the
   sentinel is the 1st for `month` and Jan 1 for `year`, so moving the year leaves both
   sentinels exactly where they were and the derived precision survives untouched.
   **⚠ THE BUMP'S REACH IS TWO YEARS AND THAT IS PRE-EXISTING** — a date more than two
   years stale still files in the past. Carried forward byte-for-byte and **named
   rather than silently widened**; widening it would be an unruled arm.
2. **The update path carries precision**, guarded by the same `if (event_date)` as the
   date — a partial update writes what it knows (F-06.48), and writing precision on a
   dateless turn would re-label a stored date from a sentence that never mentioned it.
3. **Forward-only.** Retroactive repair refused; the refusal is recorded **in the
   file**, not only here, because existing 1st-of-month rows are indistinguishable from
   true 1st-of-month weddings.

**The haystack, ruled at R-A2 and built as ruled:** the couple's own user-role turns
plus this inbound, and **nothing the assistant wrote**. `capture_couple_lead` has no
`raw_message` parameter and the bride commonly names the month several turns before the
capture fires. The exclusion is mechanical and benched: if Eliza's *"so, a December
wedding then?"* entered the haystack, **her rewording would mint a precision the bride
never spoke** — the provenance-hold class. `§2.2` drives exactly that fixture.

**The mechanism is named in-comment per F-06.85**, conditioned on `history`'s role
mapping at `engine.js:95-98` being the sole role source.

### ITEM 2 — F-08.86, THE MONEY REGISTER (CURED AT ONE SITE, SECOND SITE FILED)

Site 1 routes to `witnessLine.rupees` — the CJS wire's one grouped-money home
(TDW_06 M-4, ruling R2-B). **No third formatter.** The estate's own fallback idiom
(`rupees(n) || \`Rs ${n}\``) is used verbatim, as at `harvest.js:311`.

**The `toFixed(1)` rounding is gone and that was the quieter half of the disease:**
`4,55,000` was being read back to the vendor as `4.6L` — a figure the bride never said.
`§4.3` drives it.

Site 2: see §2 above. **F-08.89.**

### ITEM 3 — F-08.85, THE OUT-OF-WINDOW RELAY (DERIVATION-ONLY, ZERO CURE BYTES)

**The mechanism exists and the relay does not use it.** `sendWa` has a live template
path (`sendWa.js:213-240`) and `enquiry_alert_vendor` is registered `status: 'approved'`.
But the relay calls `sendWhatsApp`, which at `whatsapp.js:141` calls `sendMetaText`
**unconditionally** — no window check, no template fallback. Outside the 24h window
Meta rejects the send and **the vendor never learns a lead arrived**.

**The approved body cannot carry the brief.** Bytes, verbatim:

> `Hi {{1}}, a new enquiry just came in from {{2}} on The Dream Wedding. Open your Leads to see the details: {{3}} — reply here if you need any help.`

Three variables: vendor name · bride name · link. The brief is name · occasion · date ·
city · budget · enrichment. **There is no slot for any of it.** Stuffing `{{2}}` renders
*"an enquiry just came in from Priya — wedding, Dec 2026, Jaipur, Rs 4,50,000 on The
Dream Wedding"* — a broken sentence and a copy act that is the founder's.

Per the charter's own arm and R-A4: **closes derivation-only.** The rider (wiring the
relay to a template when the window is shut) is chartered after approval lands. This
section is the rider's evidence file.

### ITEM 4(b) — THE DOUBLE-HOLD (SETTLED; MIRA KEEPS HER SENTENCE)

**A mechanical clash-check EXISTS**, three-site chain, all derived by command:
`capacityCheck` at `occupancy.js:734` → classified a refusal at `occupancy.js:237`
(`REFUSAL_KINDS = ['capacity','date_blocked']`) → enforced at the gate
`eventWrite.js:613`.

**THE THREE QUALIFICATIONS, entered as witness per R-A5:**
1. **Capacity-based, not identity-based.** `CATEGORY_CAPACITY = { photography: 1,
   makeup: 2, decor: 1, venue: 1 }` (`occupancy.js:279`). A makeup artist's *second*
   hold on one date lands; the third is refused.
2. **OFF entirely where capacity is null.** `if (capacity == null) return null` —
   designer, jewellery and the synthetic `other` are unmapped; `planning` is in
   `RULED_OFF`. For those vendors nothing refuses anything.
3. **Force-overridable.** `NON_OVERRIDABLE = ['date_blocked']` only. A forced booking
   past a full slot lands and records the clash (`eventWrite.js:624`).

So her *"can't be"* is stronger than the mechanism. **Recorded watch-only, not
trimmed** — the trim arm did not fire. If a live wire ever shows her refusing where the
mechanism would have allowed, that specimen files then.

### ITEM 4(a) — MIRA RIDER 1 (SHIPPED, CONST-FIRST)

**MEASURED 13,817 + 305 = 14,122. RATIFIED 14,300. HEADROOM 178.**

ZIP 2 carries the const alone: the ceiling, its full arithmetic, its fallback cut order
and the ladder entry citing **CE ruling R-A6**. The prose is byte-untouched in that
ZIP, so that commit changes no wire. ZIP 3 carries the prose.

**Placement (R-A6, approved):** after the four-things enumeration, before
`Lead with ONE`. The beat **amplifies the third** of the four, so the paragraph's
*"Four things"* stays honest — a soul saying four and listing five hands the model a
contradiction, which is the F-08.66/F-08.67 class in prose. `§RIDER 1` asserts the
ordering and the count.

**Both clauses present-tense witnessed, benched from the shipped sources:** the couple
assistant answers and files live (`runCoupleAgenticTurn` → `capture_couple_lead`), and
`donna_book_event` holds on one sentence (`recordPrimitives.ts`). She is not selling a
roadmap.

**The Rider bytes are pinned LITERALLY in the bench**, exactly as the sealed-byte cells
are — a cell reading the sentence out of the soul and asserting it against itself moves
with any edit and sees nothing (Phase 4 §4(b), `honesty_byte_drifts` at 28/0).

---

## 4 · COPY INVENTORY

**FOUNDER-VETOED THIS SITTING, verbatim 「 yes 」 (AD-1) — the range byte:**

| | |
|---|---|
| was | `Rs 4.5L-6.0L` |
| now | `Rs 4,50,000-Rs 6,00,000` |

Separator byte preserved exactly. `Rs` repeats on the second bound because the home
emits its own prefix and stripping it would be a third formatter wearing a substring's
clothes.

**MODEL-VOICED, founder-ordered, byte-frozen and pinned:** Rider 1's two sentences,
303 characters, exactly as passed.

**ONE NEW OPERATOR LOG LINE** (not user-facing): `[couple-agent:capture] precision=…`,
deliberately parallel to the vendor lane's existing `[tool:create_lead] precision=…`.

**ZERO other vendor-facing bytes. ZERO bride-facing bytes. ZERO template bytes.**

---

## 5 · THE FLOOR — PAIRED, BOTH REPOS, TRIPLE-RUN (R-A1)

Every bench run **three times**, counts identical on all three runs:

```
dream-os
  b08_p5_closer               249  ⚠ 244 -> 249 DISCLOSED (5 Rider cells)
  b08_p5_unblock               15  NEW · 8 mutations, 8 clean reds, ZERO stale
  b06_m4  33 · b06_m4c  20 · b06_m4d  16 · b05_couple_soul  21
  b05_arc_m4  19 · b05_arc_m5  11 · b05_f0532_haiku_ceiling   9
  b08_p5_eliza  29 · b06_m0  50 · b05_f0550  31 (29 dist-absent, skip stated) · b08_p5_prospect_intake  13
  node --check clean on all 4 touched .js · engine tsc clean
dreamos-pwa (ZERO bytes)
  29/29 .mjs · 7/7 .ts · tsc 0 lines on a cleared .next · tree clean
```

**⚠ `b05_f0550` IS DIST-GATED, AND THE COUNT MOVES WITH THE CLONE — DISCLOSED, NOT A
FLAKE.** It reads **31** where `src/engine/dist` exists and **29** where it does not,
because `§2.2`/`§2.3` drive the TS engine's compiled expressions. **The bench declares
its own skip in-band** — *"dist absent (clean clone) — the dist-driven assertions SKIP,
stated… §2.1 carries the source truth"* — which is the floor-method law working exactly
as written. Zero reds in either state. **I initially suspected this was F-08.88's family
(a count that varies with the desk) and I was wrong**: F-08.88 is a count that varies
with nothing, and this one varies with a stated precondition. Recorded because the next
executor will see 29 on a fresh clone and should not go hunting.

**F-08.88 — THE FLAKE, MINTED AT R-A1 AND RECORDED HERE PER THAT RULING.**
`b06_m4_bench.js` read **29/4** once at a clean `48d0395` and **33/0** on every re-run
since — six at my desk, six at the chair's. It mutates production files
(`write` at `:405`, restore at `:413`); a mutation-restore bench is race-capable.
**Watch-only, uncharacterized, nobody's sitting until the founder sequences it.**

**THE FIVE INHERITED NON-GREENS** (`b06_meter_bench`, `b05_f0555_media_dedupe`,
`b07_f0772_circle_auth §12.14`, `b07_p4b_body_bench §5.26`, `b5b_movementb_bench`) are
untouched and unattributed-to-me; the Phase 4 handover §6 carries their evidence. **My
delta moves none of them** — none of the four files I touch is in any of their scopes.

---

## 6 · WHAT THE FOUNDER DOES

**Nothing in a console. Zero SQL, zero dashboard steps, zero env vars.** The
`wedding_date_precision` column already exists and already carries its CHECK. Three
ZIPs, three pushes, in order.

**The parent arc's unblock is ZIP 1.** Items 1 and 2 are what the Phase 4 ×3 was
waiting on; ZIP 2 and ZIP 3 are the Rider and are independent of it.

---

## 7 · AD-2 — THE VENDOR-ALERT TEMPLATE DRAFT (DOCS ONLY, NOT WIRED)

Founder's words: 「 Le can give me the tempelate and the content. ill submit it 」.
**Drafted here; the founder files it. His veto is exercised by his submission act.**

**No registry entry ships in this sitting.** When one is authored later it ships
`status: 'pending'` — the name-vs-wire class (F-08.75) stays dead, and nothing carries
`'approved'` until Meta is witnessed saying so.

### The submission form, complete

| Field | Value |
|---|---|
| **Name** | `tdw_enquiry_brief_vendor` |
| **Category** | UTILITY |
| **Language** | English — file as **`en`**, matching `TEMPLATE_LANGUAGE`'s default and `demo_lead_alert`'s live value |
| **Header** | none |
| **Footer** | none |
| **Buttons** | none |

**BODY (the bytes to paste into Meta's form):**

```
Hi {{1}}, a new enquiry just came in on The Dream Wedding. It's from {{2}}, and here's what they shared: {{3}}. Open your Leads at {{4}} to see everything and reply.
```

**HOW THE EMPTY-VARIABLE PROBLEM IS SOLVED, since AD-2 asks me to say which I did:**
**I collapsed the whole brief into ONE composite variable, `{{3}}`, built code-side.**
The alternative — a variable per field — cannot work: Meta rejects a template whose
variable can render empty, and occasion, date, city and budget are each **routinely
absent** (the Phase 4 walk card records 8 of 9 leads on the walked account carrying no
date). A per-field shape would need four fallback words, each of them a copy act, and
would still read as a form with blanks filled in. One composite variable collapses
gracefully: the code joins whichever fields exist, and falls back to
`Details still being collected` — the string the relay **already** uses at
`engine.js:369` when it has nothing, so no new copy is invented.

`{{1}}`, `{{2}}` and `{{4}}` cannot be empty either: the vendor's name falls back to the
business name, the couple's to `A couple`, and the link is a constant.

**Shaping honored** (`docs/TEMPLATES.md §1, via templates.js:206-208`): single line · no
two variables adjacent · none at body start or end.

### Sample values for the review form

| Var | Sample |
|---|---|
| `{{1}}` | `Swati` |
| `{{2}}` | `Priya` |
| `{{3}}` | `wedding in Jaipur, Dec 2026, budget Rs 4,50,000` |
| `{{4}}` | `https://thedreamwedding.in/vendor/leads` |

**The money sample is in the house register** — `Rs 4,50,000`, never `4.5L`, `450k` or
the glyph. That is deliberate: the sample is what Meta's reviewer reads, and a
submission that shows the forbidden form teaches the reviewer the wrong product.

**Copy-honesty bounds held:** no urgency theater, no deadline, no claim the product does
not keep. It says an enquiry arrived, who from, what they shared, and where to read it —
every clause true at the instant it sends.

**⚠ NOT IN THIS SITTING, by ruling:** the registry entry, the `{{3}}` builder, and the
relay wiring that reaches for a template when the window is shut. Those are the rider,
chartered after approval lands.

---

## 8 · WHAT THE NEXT SITTING PICKS UP

1. **F-08.89** — the live second L-carrier (`briefing.js:169`), plus the standing
   question the island raises: `executeTool` and `handleOnboarding` are dead and their
   deletion ruling is still unwritten. Curing anything inside the island is blocked
   until it is.
2. **F-08.85's rider** — the relay wiring, once Meta approves §7's template.
3. **F-08.88** — the `b06_m4` flake, if the founder ever sequences it.
4. **The three-year date** — the two-bump ceiling is pre-existing and named; widening
   it is a ruling, not a tidy-up.
5. **Unchanged from Phase 4 §11:** the HARD RULES dissolution rider, the two Manual
   micros, the two schedule-guards, and **the floor runner that fails loudly on any
   non-green bench** — which this sitting is the fifth to wish for and the second to be
   saved by the absence of.
