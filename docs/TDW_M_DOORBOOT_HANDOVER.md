# M-DOORBOOT · F-16.29 HARNESS + R-37.32 ENRICH-ON-DEDUPE — EXECUTOR HANDOVER

**Seat:** LE · **Repo:** `dream-os` ONLY · **Base:** `1c7f3a5` (fetch-first at this seat's own clone at read-first, re-derived fetch-first at delivery, equal to `origin/main` both times) · **Rulings executed:** R-37.33 · R-37.34 · R-37.35 · R-37.36 · R-37.37 · **Corrections raised by this seat:** c-D.1 (adopted by the chair as c-37.5) · c-D.2 · **Reported, unowned:** the found mutation at §7.

**Relay guard:** clean. `origin/main` was the charter's tip exactly; `1c7f3a5`'s only child is nothing, its parent is `673831a`, and no build for this scope existed beyond the tip.

---

## 1 · WHAT SHIPPED

| File | State | What |
|---|---|---|
| `src/lib/vendor/leads.js` | modified | The dedupe branch stops discarding her answers. The disposition table as CODE. `LEAD_RETURN_SELECT` lifted to one home. The two asymmetric absence tests. The write DELEGATED to `updateLead`. |
| `src/api/couple/enquire.js` | modified | The enrich set passed UNCOALESCED (R-37.37's only enforceable home). `lead_enriched` minted; `lead_created` stops lying; `ok` held byte-stable. |
| `scripts/b38_doorboot_enrich_bench.js` | **NEW** | **43 cells.** The estate's first instrument that EXECUTES the enquiry door. |
| `scripts/floor-manifest-m-doorboot.txt` | **NEW** | This delivery's declared dirt — five paths. |
| `docs/TDW_M_DOORBOOT_HANDOVER.md` | **NEW** | This file. |

**No migration. No DDL. No founder SQL beyond the walk's own fixture SELECT.** `0130` remains next-free. Plane read: `public` only. Verified zero migrations needed: `0126`–`0129` are post-snapshot but none alters `public.leads`, so the 27-column witness at ladder tip `0125` is still the settling one, and `OUT_OF_ORDER.json` carries no outstanding record.

**W-1 clean, proven by command:** `harveySoul.js`, `donnaSoul.ts`, `loop.ts` — zero diff. Also zero-diff: `eventWrite.js`, `templates.js`, `leadSerializer.js`, `src/api/vendor/leads.js`. **`dreamos-pwa` untouched** — this sitting is dream-os alone.

**COPY INVENTORY: ZERO. VETO SLOT: EMPTY.** No vendor-facing or model-voiced byte is added, changed or removed. The two alert bodies in `enquire.js` are byte-unmoved and a cell drives the door on the enrichment path to prove the vendor is still alerted.

---

## 2 · THE HARNESS — WHAT F-16.29 ACTUALLY COST, AND WHAT ENDS HERE

No instrument in this repo executed the enquiry door. The decisive search, named so it can be re-run: `grep -rnE "require\([^)]*enquire" scripts/` returns **zero**; estate-wide, `require(…couple/enquire…)` resolves to **one line**, `src/api/router.js:67`, the production mount. Every one of the ~60 references in `scripts/` is `read()` / `readRaw()` / `mutateSrc()` — text. Same for the dedupe home: zero instrument requires `src/lib/vendor/leads`.

So four green instruments passed over a door that threw on every real Discover enquiry. Each was doing its job and none could have seen it: `node --check` parses and does not run; `b37`'s door cells grep the SOURCE for `budget_min: postedBudgetMin`, and **that string is present in both trees**, so no possible grep could distinguish them; the engine gate is a different plane; the floor runs the benches.

**The bar this sitting was given, and met: door cells EXECUTE.** The harness boots the real express router on an ephemeral loopback port against a recording in-memory supabase fake, with `sendWa` stubbed at the module registry. No DB, no network, no live credential — the two env values are placeholder literals inside the bench, never a read of a real environment. It needs the engine built, which is already the delivery gate, and **it runs on a dirty tree**, so the founder's verify line is satisfiable at his apply moment before any commit (the F-05.89 seat's banked lesson).

---

## 3 · c-37.5 — THE P0's OWN RECORD ASSERTS WHAT NO INSTRUMENT OBSERVED

The kickoff's §2(a) and `1c7f3a5`'s pushed commit message both state the pre-cure door *"threw ReferenceError and returned 500."* **It did not.** The reference at the `budget_min` line sits inside the `try` that wraps the `createLead` call, so the throw is caught and the handler proceeds:

```
[enquire] createLead threw: postedBudgetMin is not defined
HTTP 200   {"ok":false,...,"lead_created":false}   leads inserts: 0
```

`ok: leadCreated` was what the sheet read. The door answered **200 and lost the lead in silence** — worse than the failure that was claimed, and claimed by a record no instrument had ever observed. The commit cannot be amended post-push; the correction banks at the chair. **Cell 1.2 pins it permanently**, using the door's one genuine 4xx path (an unknown vendor → 404) as the contrast, so a future reader cannot re-acquire the belief that this door 500s.

---

## 4 · c-D.2 — MY OWN MISCOUNT, AND THE CHAIR'S VERIFICATION OF IT

My read-first said `createLead`'s parameter bound was **thirteen**. The chair's verification pass confirmed "the 13-key bound." **Both wrong: it is TWELVE.** Derived mechanically rather than recounted by eye:

```
name, phone, email, wedding_date, wedding_city, event_types,
budget_min, budget_max, source, referrer_name, raw_message, notes   →  12
```

`enrich` is the thirteenth parameter and it is an OPTION, not a column — which is very likely how the number went wrong, since it was added during this build and the count was carried from a reading taken before it existed. **Cell 10.2 pins twelve, re-derived by parsing the destructure at run time**, and names this correction in-cell so nobody inherits the number.

Worth saying plainly: this is the second time in one sitting that a claim survived two readers and died to a command. That is the sitting's whole thesis.

---

## 5 · THE ARCHITECTURE, AND THE ONE DECISION THAT CARRIES THE RULING

R-37.37 says *enrich only from her word, never from a fallback.* **That law could not have been enforced inside `createLead`,** and noticing why is the load-bearing part of this build.

By the time parameters reach `createLead` they are already coalesced by the caller: `wedding_city` arrives as `city || vendor.city || null` and `name` as `brideNameFinal || 'Dream Wedding enquiry'`. From inside that function **the vendor's own city is indistinguishable from the bride's typing.** A boolean `enrich: true` flag would therefore have produced a build where the law lived in a comment while the code filled her empty columns with the vendor's city, in her voice, on a money surface — R-37.27's `Unknown` class wearing a different coat.

So the option **carries the values**, uncoalesced, and the caller is the only place that can supply them. The law is structural: this function can only ever write what she actually said. Cells 5.1 and 5.2 drive the real door to prove it, and they are the cells that go red the moment anyone "simplifies" the option back to a flag.

The rest follows the rulings without argument: the write is **delegated to `updateLead`** so `draft_meta`'s recompute keeps one home (a raw UPDATE would fill `wedding_date` and leave `draft_meta` still asserting it missing — a second writer disagreeing with the first); the dedupe read widens to the full return shape for **both** callers, because the snapshot money-loss lives on the vendor-POST caller that R-37.34 carves out of the enrichment; and the disposition table ships as exported constants so §10 can red on an undispositioned key rather than a comment going stale.

---

## 6 · PROOF

**`b38_doorboot_enrich_bench` 43/43** at the cured tree · **15/43 at the uncured tree `673831a`** — **28 cells red**, run on a control worktree with only the bench copied across, then discarded and the tree re-verified clean.

**The founding both-ways, quoted in the bench's own header as its provenance:**

| tree | result |
|---|---|
| `673831a` | **RED** — `createLead threw: postedBudgetMin is not defined` · HTTP 200 · 0 inserts |
| `1c7f3a5` | **GREEN** — HTTP 200 · 1 insert · `budget_min 1000000` · `budget_max null` |

**Non-vacuity by FOURTEEN mutations of PRODUCTION code** (never test setup), each restored byte-exact with the bench re-verified at 0 reds after every one:

| # | Mutation | Cells bitten |
|---|---|---|
| M1 | F-16.30 itself restored — the dedupe returns untouched | **16** |
| M2 | the null-only guard dies — enrichment overwrites held values | 8 |
| M3 | the COALESCED city is handed to the enrich set (R-37.37 defeated) | 1 |
| M4 | the stock literal becomes her name (R-37.37 defeated the other way) | 1 |
| M5 | `source` joins ENRICH_KEYS — the retired signal resurrected | 1 |
| M6 | `''` becomes an answer and writes into a null | 1 |
| M7 | the three-column dedupe read returns — snapshot money lost again | 9 |
| M8 | the return projection dies — the two shapes drift | 2 |
| M9 | `ok` re-fused to `lead_created` — the returning bride told she failed | 1 |
| M10 | `lead_created` lies again on a dedupe hit | 2 |
| M11 | the delegation dropped for a raw UPDATE — `draft_meta` goes stale | 2 |
| M12 | an empty array counts as held and her functions are discarded | 1 |
| M13 | the F3 guard falls — the vendor-POST caller enriches from its params | 1 |
| M14 | the door hands `source` into the enrich object | **0 alone** — see below |

### THE SYNTHESIS CELL, FOUND BY BEING UNABLE TO KILL IT

**M14 came back INERT and I did not drop it.** Cell 6.1 (`source` is never enriched) looks like a duplicate of 6.3 and is not: **two independent things** keep the retired badge signal off a returning bride's row — the table refuses `source`, AND the door never hands it over. Mutating either alone leaves 6.1 green. Only **M15 = M5 + M14 together** reddens it:

```
M15 (two files)  →  RED 6.1 · RED 6.3   ·   41/43, restored to 43/43
```

That is §9's both-sides / synthesis law in miniature — F-04.43's *"each half worked; together they destroyed a booking."* **6.1 is the only cell in this file whose defect requires two hands**, and I learned that by running mutations and failing to make it red, not by reading it. M13's first draft was also inert, for a duller reason (it mutated a line made unreachable by the guard above it); it was re-aimed at the guard itself and bites.

### THE VACUITY HOLE IN MY OWN FAKE, FOUND BY EXECUTION

The first draft of the supabase fake **ignored `.select()` projection**, returning whole stored rows where the real PostgREST client returns the requested columns. Cell 7.1 went **RED against correct production code**, because the create side came back carrying `vendor_id`, `notes` and `raw_message` no real caller would ever receive.

A false red is the lucky direction. **The same infidelity would have made any cell asserting a column's ABSENCE from a wire green over a genuine leak** — and which columns reach which caller is this bench's entire subject, one door away from the connect-set gate. Cured by making the fake project as the real client does; recorded in the fake's own comment so it is not re-simplified. The F-05.89 seat paid for this same lesson one recorder over, and its `Object.keys`-off-the-live-object cure is imported here rather than re-earned.

**FLOOR: NAMED BASE, no delta** — measured **LAST**, in `--delivery --check` mode against `scripts/floor-manifest-m-doorboot.txt`, on the exact tree in the ZIP, with the handover and the manifest both already written and both on the manifest's list.

**Engine gate green** (`npm run build:engine`, RC=0, run before and after). `node --check` clean on both touched `.js` files.

---

## 7 · FOUND DIRT, REPORTED — AND ITS CLASS IS ALREADY LAW

At the fetch that opened the build, `git status` came back dirty on **`src/engine/src/core/today.ts`**: `arrivalStamp`'s `Intl.DateTimeFormat` IST derivation replaced by a hand-slice of the UTC string. Held, identified, restored, re-verified byte-exact to `origin/main`, engine rebuilt green — before any byte of this build was written.

**Author identified by byte:** `scripts/b06_m1_bench.js:368`, mutation §5.1, which restores in a `finally`. **And the class is documented, not new** — I proposed it as a finding at the time and withdraw that: `scripts/run-floor.sh`'s own **LESSON 3** describes this incident by name, by file path, and by mechanism (a per-bench `timeout` sends SIGTERM, node dies, the `finally` never runs), which is why `BENCH_TIMEOUT` is unset by default and why the post-run dirt check is a guard with an exit code. My restore was exactly the documented cure.

**What stays unexplained, stated rather than papered over:** I did not run the floor or that bench, no command in my transcript writes that file, and the tree was verified clean at first motion and again after my read-first probes. The mutation's mtime falls inside my session but after my engine build, and `src/engine/dist` was clean of it — so nothing I ran executed the mutated clock. **I cannot attribute it and I am not going to invent a cause.** Flagged for the chair as a possible severed-predecessor trace in this container; the delivered tree is provably unaffected.

---

## 8 · DECLARED DEVIATIONS AND GAPS — ratify or revert

**① `ok` MOVED ITS EXPRESSION TO HOLD ITS VALUE. This is the one place I acted on a reading the ruling did not state, and I am naming it rather than burying it.** R-37.36 redefines `lead_created` to mean "a row was INSERTED". The response read `ok: leadCreated`. Leaving that expression untouched would have silently changed `ok` — and a returning bride whose enquiry landed perfectly on an existing lead would have been told, by the sheet's own check, that it failed. **A false statement to a bride, caused by a cure for false statements.** So the expression moves in order to keep the VALUE identical in every case, and `ok` keeps the meaning `enquire.js`'s own header has always given it: *the enquiry EXISTS where the vendor will find it (the row).* Cell 8.4 pins it against the pre-arc truth table in all states. **I read the ruling's silence as a requirement not to change the wire, not a licence to. If the chair reads it the other way, the correction is one identifier.**

**② THE `enriched_fields` KEY IS NEW ON `createLead`'s RETURN AND HAS NO CONSUMER.** It exists so the vendor-POST door's activity line and any future surface can say *what* was filled rather than *that* something was. Nothing reads it today. Additive; delete-safe.

**③ THE R-37.36 RE-CENSUS THE CHAIR REQUIRED WAS RUN, AND FOUND NOTHING.** `grep -rn "lead_created\|lead_enriched" src/ scripts/` returns one hit outside the door: `scripts/b07_p5_bench.js:279`, a source-grep cell asserting the string's presence in the file. Still present, still green. **No code consumer in `dream-os`; no §0.2 STOP.** The pwa half is the chair's own census and is unverified from this container.

**④ THE CREATE PATH'S FALLBACKS ARE DELIBERATELY UNMOVED.** `vendor.city` and `'Dream Wedding enquiry'` still reach a genuinely new lead's INSERT, and cell 2.2 asserts that on purpose. R-37.37 governs the ENRICH set; the create path's coalescing is old, ruled elsewhere, and out of radius. **Named because the asymmetry looks like an oversight and is not.**

**⑤ `logActivity`'s dedupe summary is now incomplete, not wrong.** `src/api/vendor/leads.js` writes *"— deduped onto existing"* on a dedupe hit. Under the carve-out that caller never enriches, so the sentence stays true. If F3 is ever re-ruled to include the vendor POST, that string needs a word for the new case. Untouched here; filed.

**⑥ c-D.3 — I READ A PLACEHOLDER AS ROW EVIDENCE. [added by ZIP 2]** Walk one's finding on `event_types` was filed with the sentence *"she selected Mehendi and Sangeet"*, taken off the sheet in a screenshot. R-37.40's derivation is that the functions row was a **placeholder wearing a value's clothes** — greyed suggestion text that reads as a selection. If so she selected nothing, and I asserted a bride's action from a screenshot rather than from a row, a `tool_calls` trail, or a witnessed code path. **In the sitting whose entire subject is claims that outrun their instruments, that is the disease in the cure's uniform.** The finding's CONCLUSION may survive — `event_types` demonstrably never lands — but its stated MECHANISM does not, and F-16.32's live probe exists because neither chair nor executor can presently tell typed-and-died from never-typed. Owned, not softened.

**⑦ c-D.5 AND c-D.6 — TWO MORE MISREADS, BOTH MINE. [added by ZIP 4]** **c-D.5:** walk three's leg A was authored so that its PASS state (nothing moves) is byte-indistinguishable from the step never having run — I asked for evidence that could not tell the two apart, and only the founder's pre/post screenshot pair closed it. A step whose success looks identical to its absence is c-D.4 wearing a different coat, one walk later. **c-D.6:** on the alert failure I named marketing opt-out as the mechanism and stated it with more confidence than the evidence carried; the operative branch is the door's window test, which I derived only AFTER the founder observed that `hi` restored delivery. **His observation was the discriminating test and my hypothesis was the non-discriminating one** — the same asymmetry the whole sitting is about, with the roles reversed.

**⑧ `wedding_date_precision` IS IN THE RETURN SHAPE AND NOT IN THE ENRICH SET.** It is not a `createLead` parameter at all (it lives only in `updateLead`'s EDITABLE list), so it is outside the 12-key bound by construction. A bride posting a month-known date still lands a fake-exact day on the create path — pre-existing, unmoved, named so the next reader does not read its absence as a decision made here.

---

## 9 · THE WALKS — ONE GREEN, ONE VOID AND WHY, AND THE CARD FOR THREE LEGS [AMENDED BY ZIP 3, R-37.40]

### 9.1 · WALK ONE — 26 AUG, FOUNDER-WITNESSED, GREEN AND STANDING

Against the standing Sarah row `b17ae785-…`, administered live, write-path before UI.

| step | ruling | witnessed |
|---|---|---|
| write path | fill what it lacks | `budget_max` filled; the `+ Budget Max` chip gone |
| wire | **deviation ①**, `ok` held | *"Enquiry sent ✦ saved in Vendors"* — the returning bride was not told she failed |
| the row | never move what it holds | posted `25/12/2026` + `delhi`; row held `2026-12-22` + `Jaipur` |
| refused keys | the table governs | `source`, `raw_message`, `notes` byte-unmoved |
| **`draft_meta` → `NULL`** | **R-37.34's delegation** | the promotion only `updateLead`'s recompute can do. Cell 7.5 on production data. |
| **the negative half** | a no-op writes NOTHING | second enquiry, contradicting date/city/band → **`updated_at` byte-identical to the microsecond** |

**These stand.** Deviation ① is witnessed live and is asked to be RATIFIED.

### 9.2 · WALK TWO — I CLAIMED A GREEN FROM A CELL THAT COULD NOT FAIL [c-D.4]

**The grading, in the same terms this bench uses on everything else.**

Walk two was designed by me to test F-16.31 and **its leg A was non-discriminating by construction.** The fixture was a **both-null** lead. From both-null, per-column fill-when-absent and unit-band semantics produce the **identical row**: both bounds fill. There is no observation at that starting state that separates them. I ran it, saw `500000 / 1000000`, and wrote *"F-16.31 narrowed to the one-held-one-null case."*

**That is a conclusion drawn from a test incapable of producing the opposite result** — the vacuity class this entire sitting was chartered to end, committed by the executor who wrote the charter's benches. It is the same shape as the `b37` door cells that greened over a throw: the assertion was true, and it was true of a tree that had the defect. §11.1's existence is the proof of the gap — **it REDS at the very tree walk two called green**, while §3.1's both-null cell greens at that same tree. That contrast is c-D.4 mechanised, and it is why §11 leads with the one-held-one-null case and says so in its header.

**WHAT THE RELAY GOT WRONG, DERIVED RATHER THAN ARGUED.** The relay that voided this walk also stated *"no ZIP was delivered, no cure landed."* **That is false and the record should not carry it.** At `origin`: `ENRICH_KEYS` at `leads.js:51`, the enrich branch at `:151`, `enriched_fields` at `:180`, and the pre-cure discard byte `return { ok: true, lead: existing, deduped: true };` occurring **zero times**. `458126f` sits in `origin/main`'s history beneath `b6f049b`. The relay's own next clause — *"production serves ZIP 1's per-column behavior"* — is correct and contradicts it.

**So the void is real but narrower than stated.** Walk two witnessed ZIP 1's cure working: enrichment ran at all, `draft_meta` promoted from a three-cell `missing` list, refused keys froze including F-16.33's wrong `source`, and the vendor-POST door minted without enriching. None of that is possible at the pre-ZIP-1 tree. **What is void is my atomic-pair conclusion, not the walk and not the landing.** Recording both halves, because a correction that overshoots is the same failure with better manners.

### 9.3 · WALK THREE — THE CARD, THREE LEGS

**ADMINISTRATION LAW: the seat issues ONE step, waits for the founder's paste, confirms green or STOPS, then issues the next. Never the whole card at once. Write-path steps precede UI steps. Fixture SELECTs are authored and run BEFORE each write step and the card is built from pasted rows.**

**Preconditions:** founder's push landed AND Railway green. Nothing below means anything otherwise.

**The founder types nothing into the functions row unless a step explicitly says to** — F-16.32's specimen is closed by his answer and re-probing it here would only re-open a question already settled.

**LEG A — the top-band fixture.** A lead holding `budget_min` with a null ceiling: the founder-witnessed Sarah state, and the only state where the two semantics disagree. A re-enquiry with a **bounded** band must move **NOTHING** — floor stays, ceiling stays null, `lead_enriched: false`. Under ZIP 1 this filled the ceiling and minted a degenerate band. §11.1 is this leg.

**LEG B — re-enquire with the full band on a both-null lead.** Both bounds must land **together** as the band she chose. This leg is **non-discriminating for F-16.31** and is included as a regression guard only, labelled as such so no one reads it as cure evidence twice. §3.1 and §11.5 are this leg.

**LEG C — nothing moves.** A third enquiry against the now-complete row: `lead_enriched: false`, and `updated_at` byte-identical. The no-op guard, which is what makes legs A and B mean anything.

**The visible tell across all three** is the `+ Budget Max` chip: present in leg A **and still present after it** (because nothing filled), gone after leg B.

### 9.4 · WALK THREE — RUN 26 AUG, FOUNDER-WITNESSED, ALL THREE LEGS GREEN [ZIP 4]

Administered live, one step at a time, fixtures minted through real doors and never by SQL.

| leg | fixture | posted | result |
|---|---|---|---|
| **A — DISCRIMINATING** | `1000000 / null` (held floor, minted by a top-band Discover enquiry) | `Rs 3,00,000–5,00,000` | **nothing moved.** `updated_at` unchanged. Under ZIP 1 this wrote `budget_max 500000` — a bracket whose floor exceeds its ceiling |
| **B — regression guard** | `null / null` (minted through the vendor-POST door) | `Rs 3,00,000–5,00,000` | both bounds landed **together**; `draft_meta` promoted from a three-cell `missing` list |
| **C — the no-op** | `300000 / 500000` (complete) | `Rs 5,00,000–10,00,000` | **no write at all** — `updated_at` byte-identical to the microsecond |

**Leg A is the only one that proves anything about R-37.40**, and the founder's choice of a band DISJOINT from the held floor is what makes it airtight: `500000` could not have arrived by coincidence. B and C are labelled guards; counting them as cure evidence would be c-D.4 again.

**WHAT WALK THREE DID NOT TEST, stated so a later reader cannot mistake it.** Midway through, the founder sent `hi` from the vendor number to diagnose F-16.35. That opened the 24-hour service window, so every leg took the door's IN-WINDOW free-form leg. **The template path never fired once.** Walk three green says nothing whatever about alert deliverability.

---

## 10 · WHAT THE NEXT SITTING PICKS UP

**MINTED BY WALK ONE [added by ZIP 2]:**

**F-16.31 — THE BUDGET BAND IS AN ATOMIC PAIR AND THE CENSUS TREATED IT AS TWO COLUMNS.** `budget_min` and `budget_max` jointly encode ONE answer; fill-when-absent reasons per column. When a row holds one bound and lacks the other, enrichment produces a band the bride never chose (witnessed: `1000000 / 1000000`). Every column obeyed R-37.32 exactly; the pair did not. **The gap is in my own disposition table** — it asked what each row should do and never asked whether any two rows were one fact. It is the only atomic pair in the enrich set. Unruled: does a band enrich **as a unit or not at all**? Still strictly better than the disease, which discarded her answer whole and left `Rs —`.

**F-16.32 — `event_types` NEVER LANDS, AND IT DIES BEFORE THE DEDUPE.** The row's `event_types` was already `NULL` when it was born on the **create path**, which writes the same `event_types: postedFunctions`. `normalizeFunctions` returns null unless handed an array, so it has been receiving a non-array on this door since before this sitting. The enrichment behaved correctly on a null input — never write emptiness into a null. **This is F-16.30's fifth field, but it dies one layer upstream where R-37.32 structurally cannot reach it.** The pwa half is outside this repo and unverified from this seat; walk two's probe is the instrument.

**F-16.31 — AMENDED AND CURED BY ZIP 3 [R-37.40].** The band is ONE answer in two columns; reasoned per column it minted a degenerate band from a one-held-one-null row. **Cured**: the pair settles as a unit — absent iff BOTH bounds are null, held if EITHER is. Two amendments the walk forced: (a) **`min == max` is NOT a signature of this defect** — `8df93b99` (Priya, 5 Aug, `source whatsapp`) carries `450000/450000` and predates enrichment by three weeks, so a census hunting the shape will over-report and a chair reading such a count as damage would be reading point-estimates as corruption; (b) the both-null case never demonstrated anything (c-D.4, §9.2).

**F-16.33 — `source: source || 'whatsapp'` at `src/lib/vendor/leads.js`.** A lead hand-typed in the vendor PWA is stamped as having arrived over WhatsApp. Convicted from code, founder-noticed on the card. Same class as R-37.27's `Unknown` and the `'Dream Wedding enquiry'` literal — a hardcoded default masquerading as a provenance record — but living on the CREATE path, which R-37.37 deliberately does not govern. The estate already distrusts this column: `src/api/vendor/leads.js` carries a comment that the TDW badge reads from the engagements home and **never off `leads.source`**. **Unruled, untouched.**

**F-16.30's RADIUS BOUNDARY, witnessed.** The dedupe is gated on `if (phone)`. Nine live leads on the test vendor carry `phone: null`, seven of them named `Dream Wedding enquiry`. Enrich-on-dedupe structurally cannot reach any of them, and each new phoneless enquiry mints another row. A scope boundary of what shipped, not a regression.

**THE PREFILL DERIVATION, now supported.** Walk two's sheet returned `22 Dec 2026 / Jaipur` unprompted — the first direct evidence for the chair's couple-profile prefill claim, which §9.2 of the prior rider recorded as LE-underived. The date/city fills in that leg were prefill-sourced, not typed.

**F-16.34 — THE VENDOR LANE HAS NO DELIVERY TELEMETRY. Founder-surfaced, and the most expensive finding of the sitting.** `src/lib/vendor/relayStatus.js:76` logs `status=` and `matched=` and **discards Meta's `errors[]` array** — the code, title and message that say WHY a send failed. It is logged nowhere else in the estate; `sendWa` does not capture it either. Compounding it, every status webhook reports `matched=0 — NO ROW CARRIES THIS SID`, so no row records the send at all. **Consequence: every vendor alert could fail indefinitely and the only detection path is a founder checking his phone** — which is exactly how this was found. On a live estate with paying basic-tier vendors this is silent revenue loss. Unruled. The cure is small (log `errors[0].code` and `.title`) and would have turned an evening of inference into a diagnosis.

**F-16.35 — THE BASIC TIER'S ALERT IS CATEGORISED `MARKETING` AND ONLY FIRES OUT-OF-WINDOW.** `lead_alert_basic` is `MARKETING`; its paid twin `enquiry_alert_vendor` is `UTILITY`; twelve of the registry's fourteen templates are UTILITY. The door sends free-form text in-window and falls back to the template ONLY when the window is closed — so **the basic tier's alert is structurally undeliverable in the exact condition it exists for: a vendor who has gone quiet.**

*Evidence, and it is deliberately separated from the explanation:* three sends, three same-second `failed` statuses, **wamids issued** — so Meta ACCEPTED the payload (a bad template name, unapproved status or wrong parameter count fails synchronously with a 400 and no wamid). Other messages to that number read normally. Delivery resumed after the founder sent `hi`, which both opened the window and supplied an engagement signal.

*Founder hypothesis, recorded AS hypothesis:* Meta withheld the marketing template under per-recipient engagement pacing (the 131049 class) because the vendor never replies to alerts. **UNCONFIRMED — the error code was discarded by F-16.34 and was never captured. Under observation.** The executor's earlier account named opt-out as the mechanism and derived the window branch only after the founder's `hi`; see c-D.6.

**F-16.33 — CURED BY ZIP 4, and the census was wrong about its size.** `source` defaulted to `'whatsapp'`, so a lead the vendor typed with his own thumbs claimed it arrived over WhatsApp. **Cured at the vendor-POST door** — which knows the answer — and deliberately NOT in `createLead`'s shared fallback, where `'whatsapp'` is correct for Victor and harvest; §12.3 is the guard on that reasoning and reds if a later reader tidies the two into one place. Founder-vetoed copy: **`self`**, rendering as `SOURCE: Self`. *Two gaps named rather than closed:* (a) `public.leads.source` also carries a **database-level default of `'whatsapp'`**, untouched and unruled — this path always passes a value so the default never fires for it, but any INSERT omitting the column is still stamped by Postgres; (b) the card's capitalisation lives in `dreamos-pwa`, unverified from this seat — `Discover` and `Whatsapp` are plain capitalisations of stored values, which is evidence but not proof that `self` renders as `Self`.

**OBSERVATION, not a finding.** The add-lead toast reads *"Filed — 5 details pending"* while the same row's `draft_meta.missing` lists **three**. Two counts of one emptiness from two code paths. Cosmetic, out of radius, recorded so neither number is later read as authoritative.

**STANDING:**

1. **Walk two**, administered live per §9.3; then deviation ① ratified or reverted.
2. **The pwa half of the R-37.36 census** — `lead_created` / `lead_enriched` consumers in `dreamos-pwa`; the chair found one comment at `discover.tsx:562`, unverified from here.
3. **The found-mutation trace at §7** — whether a severed predecessor sat in this container.
4. **F-16.30's class, closed rather than patched:** the badge (F-16.21) and the second stamp (F-16.22) were cured at their own homes. A sixth field arriving at the dedupe now has a table to join rather than a wall to hit — but F-16.32 shows the wall was never the only place fields die.
5. Unmoved and located: F-05.84 · F-05.85/.86/.88 · F-08.103 · F-08.105 · F-10.122 · F-16.19 · F-SW.10 · the `budget_total` phantom · the name-column contact finding from Seat A′.
