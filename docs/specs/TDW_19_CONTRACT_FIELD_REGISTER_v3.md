# TDW_19 · CONTRACT FIELD REGISTER · v3 — A DELTA OVER v2

**Seat:** G3.2 sitting 3 (designer-LE, Fable) · 2026-09-07
**Governed by:** R-40.120 (the founder's yes on the contracts-room prototype; C1–C9 ruled) · **R-40.121 (the lawyer's yes on clause 5 as the Vendor's own words)** · R-40.118 · R-40.88 · R-40.73 · R-40.114.
**Base:** `TDW_19_CONTRACT_FIELD_REGISTER_v2.md` at `3b6ded3`. **v2 stays on the tree, untouched.** Everything v2 says still governs except where a row below says otherwise. This file is the delta and nothing else: a reader wanting the whole register reads v2 and then this.

---

## 0 · THE COUNT

| | v2 | v3 | Δ |
|---|---|---|---|
| Tokens in the instrument | 168 | **166** | −2 |

`same_venue` and `rooms` retire. `travel_terms` is renamed. No other token moves. The census line is `grep -o '{{[a-z_0-9]*}}' TDW_19_CONTRACT_GENERIC_v4.md | sort -u | wc -l`, run after the clause 5 amendment of 2026-09-07 — cite by reading the line, never by computing it.

---

## §5 · ACCOMMODATION AND TRAVEL — superseding v2 :162–170

| Token | Plain meaning | Home | Class | Type | Omission |
|---|---|---|---|---|---|
| `travel_and_stay_terms` | Travel and stay, in the Vendor's own words, printed as written | PROFILE — **seeded per trade** (`contractAnnex.js TRADE_BASE`): *Travel at actual cost, agreed first. Stay in the same hotel as the couple, two rooms.* | PROFILE | text | **OMIT (5 whole)** |
| ~~`same_venue`~~ | — | — | RETIRED | — | — |
| ~~`rooms`~~ | — | — | RETIRED | — | — |
| ~~`travel_terms`~~ | — | renamed → `travel_and_stay_terms` | — | — | — |

**Why one field.** The founder's brief (kickoff §2): *travel and accommodation are one field she writes in her own words … not a rooms counter and a yes/no.* The lawyer's yes (R-40.121): clause 5's accommodation terms are the Vendor's own words. **R-40.73 is not overturned** — *two rooms at the same hotel* is what the clause says when she has not said otherwise; it is now the seed sentence rather than two tokens. Law one holds: TDW authors no value; the seed is a starting sentence she may change.

**The full stop is the clause's, not hers.** `contractPdf.js ownWords()` strips a terminal `.` `!` `?` from her sentence and the clause supplies one; *…two rooms.* prints once.

**The gate is unchanged**: clause 5 prints only where a function's city differs from `vendors.city` (v2 :168 case (a)), and now a **manual** function's city opens it too (§3 below).

**F-40.244 closes here.** v2's `same_venue` and `rooms` were never asked by the profile sheet, so 5.2 was omitted on every agreement rendered before this date.

**Existing stored values.** `contract_profiles.fields->>'travel_terms'` on any row is renamed by migration `0146` (data only, idempotent). Production census at the time of writing: three test accounts, no vendor rows; the founder runs the SELECT in the packet before the UPDATE.

---

## §3 · FUNCTIONS AND DATES — an arm added, no token changed (R-40.118, C1)

v2 :122 made `function_N_city` REQUIRED and named the events path as clause 3's only source. It still is, **when it returns rows**. Where a contract reaches no events — a client made from a name and a number (no lead), or a lead with no event yet — the row's own list stands in:

| Key (on `contracts.terms`) | Shape | Read by |
|---|---|---|
| `functions_manual` | `[{ title, date, time?, venue?, city? }]` — `date` ISO `YYYY-MM-DD`, `time` `HH:MM` | `contractSource.manualFunctions` → normalised to the events row shape (`id: m0…`, `event_date`, `event_time`, `venue`, `city` **on the row**) → the renderer's `placeOf(e)` |
| `functions` | `{ [event_id]: { venue, city } }` — unchanged | `placeOf(e)` first; the manual row's own `venue`/`city` when there is no entry |

**Precedence is events-then-manual, never both.** The calendar's rows are the fact; the manual list is a stand-in for their absence, and a contract that has real events ignores its manual rows rather than doubling clause 3.

**The register's `function_N_*` tokens are unchanged.** They were always filled from a row shape; this adds a second producer of that shape, in the one home that already produced it (`functionsForContract`).

**F-40.243 closes here** — Send was unreachable for every such contract because `Functions and dates` could not be filled from any surface.

---

## §9B · PER-COUPLE POLICY OVERRIDES (R-40.120, C4) — new

| Key (on `contracts.terms`) | Shape | Read by |
|---|---|---|
| `policy_overrides` | `{ [any PROFILE token]: value }` | `contractSource.effectiveProfile(fields, terms)` = `{ ...contract_profiles.fields, ...terms.policy_overrides }` — computed **once** and handed to both the renderer's `P` and `deriveMoney`'s `P` |

**An override set to `''` wins and omits.** `present('')` is false, so a policy blanked for one couple leaves that clause out of that agreement and touches no other (R-40.88's own shape).

**The profile stays the one home for her policies.** The override is this couple's; the room labels it *These are your policies. Changes here apply to this agreement only.* (R-40.120, the founder's byte).

---

## §9C · THE STANDARD AGREEMENT DOOR (R-40.120, C5) — new

`GET /api/v2/vendor/contracts/standard` renders v4 through the one call (`contractSource.render`) from a **placeholder source**: her real vendor row, `effectiveProfile` of her stored fields over the trade seeds, and a `[labelled placeholder]` for every value only a couple, a fee or a date can supply. **No `contracts` row is created**; the only write is the draft PDF, upserted at `contracts/<vendor_id>/STANDARD-AGREEMENT.draft.pdf`.

The labels are surface bytes, vetoed on the prototype: `[the couple's names]` · `[their number]` · `[each function]` · `[date and time]` · `[venue]` · `[city]` · `[your fee]` · `[the deposit %]` · `[the deposit amount]` · `[who signs for you]` · `[yes or no]` · `[included or added on top]` · `[your GST rate]` · `[agreement number]`. They live at `contractSource.STANDARD_PLACEHOLDERS` and `standardAgreementArgs`.

`contractPdf.js rs()` and `pct()` pass a `[…]`-shaped string through unformatted. Nothing outside the placeholder source can produce that shape: fee and deposit are numeric at the fill door and the money home.

---

## §0-bis · A CORRECTION TO THE RENDERER, RECORDED HERE BECAUSE THE REGISTER IS WHERE HOMES ARE NAMED

The standard render (§9C) was the first render whose fixture did not load the profile into `terms`, and it showed that `contractPdf.js` read **four PROFILE tokens and two DERIVED tokens off the wrong plane**:

| Token | Register home (v2 line) | Was read as | Now read as |
|---|---|---|---|
| `vendor_signatory_name` | PROFILE :90 | `T.` (5 sites: 1.1, the seal ×4) | `P.` |
| `vendor_category_words` | derived from `vendors.category` :87, seeded into PROFILE by the annex map | `T.` | `P.` (falls back to `vendor.category`) |
| `exclusions` | PROFILE :106 | `T.` | `P.` |
| `gst_treatment` · `gst_pct` | PROFILE :130–131 | `T.` | `P.` |
| `gst_amount` · `fee_payable_with_gst` | DERIVED :132–133 (`deriveMoney`) | `T.` | `M.` |

Nothing writes these keys to `terms`; the profile sheet writes them to `contract_profiles.fields`. So on every composed agreement rendered before this date: **no Vendor line at 1.1, no vendor name on the seal, no "in particular, the following are not included" sentence, no tax block** — regardless of what she had filled. `b56`'s fixture carried all of them in `terms`, which is why 236 cells were green. The fixture now carries them where the register puts them, and §15 holds a both-ways cell for each plane. **Candidate finding; this seat does not mint the number.**

---

## WHAT DID NOT CHANGE

Every other row of v2. The Omission column's three classes. R-40.88. The annex tokens. §9A's number. The category → annex map. The register's law one.

---

## §0-ter · TWO ROWS MOVED BY THE SEALED COPY (2026-09-08, the founder's first signed agreement)

| Token | Was | Now | Ruling |
|---|---|---|---|
| `named_professional` | PER-CONTRACT, "No home" (v2 :206, :336) — the renderer read `T.named_professional`, which no surface wrote, so 12.2 never printed while its switch said Printed | **PROFILE**, beside `vendor_signatory_name`; read as `P.named_professional`; the sheet gains its row under *Your business* (pwa rider) | F-40.266 |
| `vendor_credit_role` | printed as stored — the credits' ROLE KEY (`shot_by`) | stored as the key; **rendered through `ROLE_LABEL`** (`weddings.js`, R-40.7's own words) at the source where `P` is built; a value that is not a key prints as written | F-40.267 |
| `cancel_tier_1/2/3_days` | PROFILE, OMIT-ROW, **no seed** — every row omitted, 6.4's lead dangled | seeded **90 / 60 / 30** in `TRADE_BASE` (the slab labels the founder vetoed); OMIT-ROW unchanged | F-40.265 |
