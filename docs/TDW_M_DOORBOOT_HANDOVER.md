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

**⑥ `wedding_date_precision` IS IN THE RETURN SHAPE AND NOT IN THE ENRICH SET.** It is not a `createLead` parameter at all (it lives only in `updateLead`'s EDITABLE list), so it is outside the 12-key bound by construction. A bride posting a month-known date still lands a fake-exact day on the create path — pre-existing, unmoved, named so the next reader does not read its absence as a decision made here.

---

## 9 · THE SMOKE CARD

**Fixture-state law: the SELECT ships FIRST and the card is authored from the pasted rows — not the other order.** The standing Sarah row is the natural fixture, but this container cannot reach production, so **BLOCK 1 below is run before the card's write-path steps are finalised.** What is already fixed: write-path steps precede UI steps (the banked sequencing law), and the visible tell is the disappearance of the `+ Budget Max` chip on her card.

**BLOCK 1 — run first, paste the rows back.** Zero placeholders; self-contained.

```sql
-- M-DOORBOOT walk fixture. Columns witnessed against docs/db/PUBLIC_SCHEMA.md,
-- public.leads (27 columns, ladder tip 0125; 0126-0129 alter no leads column).
select
  l.id,
  l.name,
  l.phone,
  l.wedding_date,
  l.wedding_city,
  l.budget_min,
  l.budget_max,
  l.event_types,
  l.source,
  l.state,
  l.draft_meta,
  l.created_at
from public.leads l
where l.vendor_id = '23165e38-6510-4639-ab6a-9f35bab93742'
  and l.deleted_at is null
  and l.budget_max is null
  and l.phone is not null
order by l.created_at desc
limit 10;
```

**The walk, once BLOCK 1's rows land** (Railway green first; nothing below means anything otherwise):

1. **Deploy green.** Evidence: the Railway banner.
2. **WRITE PATH.** Re-enquire from the named row's phone on the Discover feed, choosing a budget band with a ceiling. Evidence: the response body — expect `"lead_created": false`, `"lead_enriched": true`, and **`"ok": true`**.
3. **THE ROW.** Re-run BLOCK 1. Evidence: pasted rows. Expect **`budget_max` filled** on that lead and **`name`, `wedding_date`, `wedding_city`, `budget_min`, `source` all unchanged** — the whole ruling in one diff.
4. **UI.** Open that lead's card in Business Leads. Evidence: screenshot. Expect the **`+ Budget Max` chip GONE** and the budget rendering the filled ceiling.
5. **THE NEGATIVE HALF, which is what makes the rest mean anything.** Re-enquire once more from the same phone, this time choosing a **different** band. Evidence: response body plus one re-run of BLOCK 1. Expect **`"lead_enriched": false`** and **`budget_max` UNCHANGED** — the estate declining to overwrite what she already told it.

**Steps with no thumb-path, named:** none. **Veto slot: empty** — no copy in this delivery.

---

## 10 · WHAT THE NEXT SITTING PICKS UP

1. **The walk**, then deviation ① ratified or reverted.
2. **The pwa half of the R-37.36 census** — `lead_created` / `lead_enriched` consumers in `dreamos-pwa`; the chair found one comment at `discover.tsx:562`, unverified from here.
3. **The found-mutation trace at §7** — whether a severed predecessor sat in this container.
4. **F-16.30's remaining siblings**: the badge (F-16.21) and the second stamp (F-16.22) were cured at their own homes; this cure means a fourth field arriving at the dedupe now has a table to join rather than a wall to hit. That is the class closed, not one more field patched.
5. Unmoved and located: F-05.84 · F-05.85/.86/.88 · F-08.103 · F-08.105 · F-10.122 · F-16.19 · F-SW.10 · the `budget_total` phantom · the name-column contact finding from Seat A′.
