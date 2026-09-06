# TDW_19 · THE CONTRACT FIELD REGISTER · v2

**Status:** SPEC. Not a lawyer's document.
**Tracks:** `docs/specs/TDW_19_CONTRACT_GENERIC_v4.md` — **the instrument, lawyer-passed at R-40.106, from this cut forward.**
**Seat:** CE-40 · G3.2-pre v4 · Fable-Desk, docs and frames only · 2026-09-06
**Base:** `dream-os @ 85bdac1` — **re-derived at this tip after the lane packets, not re-stamped.** Three files this register cites moved between `95deda5` and `85bdac1` (`src/lib/contractPdf.js`, `src/lib/vendor/contractSource.js`, and `db/migrations/` gained `0141`); every citation and every census below was re-run against the new tip. `docs/db/PUBLIC_SCHEMA.md` did **not** move, so §1–§8's witness lines are unchanged and were re-read to confirm it.
**Supersedes:** `TDW_19_CONTRACT_FIELD_REGISTER_v1.md`, which tracks v3 and stays on the tree unchanged as that instrument's register. **A register pointing at a superseded instrument is worse than no register, because it is confidently wrong** — so v1 is not edited, it is retired in place by this file's existence and by this sentence.

---

## 0 · HOW THIS FILE IS USED, AND ITS TWO LAWS

The instrument carries **168** distinct field tokens — v3's 166, plus `rooms` and `same_venue` at clause 5. **Nothing was retired.**

**Law one: nothing in the instrument is authored by TDW.** Not a price, not a percentage, not a day-count, not a policy. Every token is filled from a column the Vendor owns, from a value she sets once in her own room, or from what she types for this Client. A default named here is *a starting value the Vendor may change*, never a value TDW imposes. R-40.73's two rooms at the same venue is such a default, on exactly the footing of R-40.37's 30% deposit.

**Law two — NEW at v4: nothing leaves as an underscore (R-40.88).** v3's renderer printed `__________` for every unset token, under ratified veto row 23. **R-40.88 supersedes that row.** Every token below now carries an **Omission** class, and the three classes are the whole vocabulary:

| Class | What the document does | What Send does |
|---|---|---|
| **REQUIRED** | Always printed | **Refuses**, and Preview highlights the field |
| **OMIT** | The clause, sub-clause, table row or annex is **absent from the document** | Sends |
| **OMIT-ROW** | The row is absent; the table is not padded and is not drawn when empty | Sends |

There is no fourth class. **`N/A` is not printed, a zero rate is not printed, a greyed dash is not printed, and a blank rule is not printed.** A reader of a v4 agreement cannot tell an omitted clause from a clause the instrument never had — which is the point: a couple should read an agreement, not a form.

### The census is derived, not carried

```
LC_ALL=C; grep -o '{{[a-z0-9_]*}}' docs/specs/TDW_19_CONTRACT_GENERIC_v4.md | sed 's/[{}]//g' | sort -u | wc -l
→ 168
```

Run it before trusting this file. **If the count differs, this register is stale and no seat may read it.** `LC_ALL=C` is not decoration: without it `sort` and `comm` disagree on ordering and a delta comes back wrong.

The delta against v3, derived the same way:

```
LC_ALL=C; comm -13 <(census v3) <(census v4)  → rooms · same_venue
LC_ALL=C; comm -23 <(census v3) <(census v4)  → (empty)
```

### The three classes of source

| Class | Meaning | Where the Vendor meets it |
|---|---|---|
| **DERIVED** | The product already holds it, or computes it from something it holds. Never asked. **34 tokens.** | Nowhere — it fills itself |
| **PROFILE** | Her standing policy or price. Asked **once**, kept, reused, editable. | Her Contracts settings |
| **PER-CONTRACT** | Specific to this Client and this wedding. Asked each time. | The contract composer |

### Formats

- **`Rs`** — Indian grouping, `Rs 1,25,000`. The letters `Rs`, never the rupee sign. Never `K`, `L` or `Cr`. Never truncated. Whole rupees, as `invoices.amount_total` does.
- **date** `D Mon YYYY` IST · **time** `h:mm am/pm` IST · **pct** whole number, the instrument supplies the `%` · **days / hours / months / rooms** whole number · **text** free prose · **one-of** a choice from a stated set.

### SQL provenance — RE-DERIVED AT THIS BASE, NOT CARRIED

**Every witness line below was re-read at `85bdac1`. None is carried from v1's register, and this matters:** the PAIR regen at `5b3f61f` moved every line in `PUBLIC_SCHEMA.md`. v1's register cites `vendors.business_name` at `:1135`; at this base it is `:1203`. **A citation carried across a regen is a citation to nothing.**

**⚠ CITE BY READING THE LINE, NEVER BY COMPUTING IT — a trap this seat walked into and climbed out of.** The ordinals printed in each block are Postgres's `ordinal_position`, and **Postgres does not renumber after `DROP COLUMN`**, so a dropped column leaves a permanent gap. Census at `85bdac1` over all 79 tables: **8 carry ordinal gaps**, and four of them are tables this register cites —

```
public.vendors   printed 49  highest ordinal 57  missing 35–42
public.clients   printed 12  highest ordinal 13  missing 12
public.events    printed 18  highest ordinal 19  missing 13
public.invoices  printed 21  highest ordinal 22  missing 18
(also couple_tasks, expenses, leads, vendor_portfolio)
```

**Every header count matches its printed rows on all 79 tables — nothing is omitted and no count is wrong.** But a reader deriving a witness by arithmetic — `line = blockStart + n` — lands on the wrong column for those eight. This seat did exactly that mid-derivation and briefly took `vendors` for a 57-column table described at 49. **The cure is not a note in a file; it is reading the line you cite.** Every `:nnnn` below was read.

**⏳ THE SNAPSHOT'S STALENESS, MEASURED RATHER THAN ASSUMED.** `PUBLIC_SCHEMA.md` states its applied ladder tip as **`0138`**. `db/migrations/` holds **`0139`, `0140` and `0141`** above it, and `OUT_OF_ORDER.json`'s register is empty, so the arithmetic test is the whole test here. Census of what those three touch:

- `0139_payment_reminders.sql` → `CREATE TABLE public.payment_reminders` and `public.payment_reminder_settings`, both new.
- `0140_date_check_switch.sql` → `ALTER TABLE public.vendors ADD COLUMN date_check_enabled`.
- `0141_lead_alerts.sql` → `CREATE TABLE public.lead_alerts`, new.

**Therefore: the snapshot is a valid witness for `contracts`, `contract_profiles`, `contract_signatures`, `clients`, `events`, `invoices`, `payment_schedules`, `couples`, `weddings`, `wedding_credits` and `users` — every table this register cites but one. It is STALE for `public.vendors`**, which this register cites ten times. `0140` only ADDs one column, so **every `vendors` line cited below still reads what it read**, and all twelve `vendors` lines cited by this file were re-read at `85bdac1`, one by one, and all twelve resolve. A later reader citing `vendors` from this file must check `db/migrations/` first. **The cure is the PAIR regen after `0140`, not an edit here.**

---

## 1 · PARTIES — v4 clause 1 and the execution block

| Token | Meaning | Source | Class | Format | Omission |
|---|---|---|---|---|---|
| `vendor_business_name` | Her trading name | `vendors.business_name` · `:1203` | DERIVED | text | REQUIRED |
| `vendor_category_words` | Her trade in plain words | From `vendors.category` · `:1204`, mapped to a phrase. **The column carries no CHECK at this base**; the map falls back to her own words | DERIVED | text | REQUIRED |
| `vendor_address` | Business address | `vendors.address` · `:1249` | DERIVED | text | OMIT |
| `vendor_city` | Her city — also the jurisdiction at clause 15 | `vendors.city` · `:1206` | DERIVED | text | REQUIRED |
| `vendor_signatory_name` | The person signing for the business | No column — §8 | PROFILE | text | **REQUIRED** |
| `vendor_phone` | Her number | **`users.phone` · `:1070`, through `vendors.user_id` · `:1202`** | DERIVED | phone | REQUIRED |
| `partner_1_name` | One of the two persons | `clients.name` · `:175` | PER-CONTRACT | text | REQUIRED |
| `partner_2_name` | The other | No column — §8 | PER-CONTRACT | text | OMIT |
| `couple_primary_phone` | The number the agreement and the password go to | `clients.phone` · `:176` | PER-CONTRACT | phone | **REQUIRED** |
| `agreement_date` | The date of the agreement | The date it is composed | DERIVED | date | REQUIRED |

**⚠ `vendor_phone` IS NOT ON `public.vendors` AND NEVER HAS BEEN — F-40.159.** v1's register recorded this token as *"her WhatsApp number on the platform record"*, which named no column and was therefore never checkable. The first build read `vendors.whatsapp_number`, the SELECT errored, and a lawyer-passed agreement went out over four pages addressed from **Your Vendor** with nine blank fields. The second cure read `vendors.phone`, which also does not exist — `public.vendors` has forty-nine columns and not one is a number. **The home is `users.phone` through `vendors.user_id`,** where `vendorHandset`, auth and admin/discover have always read it. It is cited here with both line numbers so no third seat rediscovers it.

**`vendor_signatory_name` is REQUIRED at v4 and was not at v3.** Ruling F7 puts it on the seal block. A seal that names the Client and not the Vendor is half a witness.

## 2 · SERVICES AND ANNEXES — v4 clause 2

| Token | Meaning | Source | Class | Format | Omission |
|---|---|---|---|---|---|
| `annexes_attached` | Which annexes form part of this Agreement | The composer's annex selection | PER-CONTRACT | text list | REQUIRED |
| `exclusions` | What is expressly not included | PROFILE default, editable per contract | PROFILE | text | OMIT |

**At least one annex is required at Send.** An agreement with no annex attached describes, under clause 2.2, a service that includes nothing.

## 3 · FUNCTIONS AND DATES — v4 clause 3

*One row per `events` row for this couple; the two rows shown in the instrument are the template, not a limit.*

| Token | Meaning | Source | Class | Format | Omission |
|---|---|---|---|---|---|
| `function_N_name` | Sangeet, mehendi, ceremony | `events.title` · `:573`, with `events.kind` · `:576` where more precise | PER-CONTRACT | text | REQUIRED |
| `function_N_date` | Its date | `events.event_date` · `:574` | PER-CONTRACT | date | **REQUIRED** |
| `function_N_time` | Its start | `events.event_time` · `:575`, or `events.slot` · `:585` | PER-CONTRACT | time | OMIT-ROW cell |
| `function_N_venue` | Where | No column on `events` — §8 | PER-CONTRACT | text | OMIT-ROW cell |
| `function_N_city` | Its city | No column on `events` — §8 | PER-CONTRACT | text | **REQUIRED** |

**`function_N_city` is required at v4 and was not at v3, and clause 5 is why.** Clause 5.1 applies to each function *held outside the Vendor's city*. A function with no city cannot be tested against that condition, so the accommodation clause could neither print nor be omitted honestly. **A field a rule reads is a field the rule requires.**

## 4 · FEES AND PAYMENT — v4 clause 4

| Token | Meaning | Source | Class | Format | Omission |
|---|---|---|---|---|---|
| `fee_total` | The fee | `invoices.amount_total` · `:680`, or the composer | PER-CONTRACT | `Rs` | **REQUIRED** |
| `fee_breakdown` | What it is made of | `invoices.description` · `:679` | PER-CONTRACT | text | OMIT |
| `gst_treatment` | Inclusive or exclusive | PROFILE | PROFILE | one-of: `inclusive` · `exclusive` | **OMIT (4.2 whole)** |
| `gst_pct` | The rate | PROFILE | PROFILE | pct | **OMIT (4.2 whole)** |
| `gst_amount` | The tax | Computed | DERIVED | `Rs` | OMIT (4.2 whole) |
| `fee_payable_with_gst` | Total payable | Computed | DERIVED | `Rs` | OMIT (4.2 whole) |
| `vendor_gstin` | Her GSTIN | `vendors.gstin` · `:1208` | DERIVED | text | **OMIT (4.2 whole)** |
| `deposit_pct` | The share that reserves the dates | PROFILE — **default 30, editable** (R-40.37) | PROFILE | pct | **REQUIRED** |
| `deposit_amount` | That share of the fee | Computed once in `contractSource.js` `deriveMoney` (R-G32.6); equals `payment_schedules.amount_due` · `:865` at `ordinal` · `:870` = 1 | DERIVED | `Rs` | **REQUIRED** |
| `milestone_N_label` | What it is called | `payment_schedules.milestone_label` · `:863` | PER-CONTRACT | text | OMIT-ROW |
| `milestone_N_pct` | Its share | `payment_schedules.pct` · `:864` | PER-CONTRACT | pct | OMIT-ROW |
| `milestone_N_amount` | Its amount | `payment_schedules.amount_due` · `:865` | DERIVED | `Rs` | OMIT-ROW |
| `milestone_N_due` | When due | `payment_schedules.due_date` · `:866` | PER-CONTRACT | date | OMIT-ROW |
| `vendor_upi_id` | UPI ID | `vendors.upi_id` · `:1207` | DERIVED | text | OMIT |
| `vendor_account_name` | Account name | `vendors.account_name` · `:1246` | DERIVED | text | OMIT |
| `vendor_account_number` | Account number | `vendors.account_number` · `:1247` | DERIVED | text | OMIT |
| `vendor_ifsc` | IFSC | `vendors.ifsc` · `:1248` | DERIVED | text | OMIT |
| `overtime_rate` | Charge beyond agreed hours | PROFILE | PROFILE | `Rs` | **OMIT (4.6 whole)** |
| `overtime_unit` | The unit | PROFILE | PROFILE | one-of: `hour` · `half hour` | OMIT (4.6 whole) |
| `late_grace_days` | Grace before a payment is late | PROFILE | PROFILE | days | **OMIT (4.7 whole)** |
| `late_interest_pct` | Monthly interest on overdue | PROFILE | PROFILE | pct | **OMIT (4.7 whole)** |

**Four rules the build must honour.**

1. **The deposit is instalment one, not a second concept.** `deposit_pct` and `payment_schedules.pct` · `:864` at `ordinal` = 1 are **one number with one home**, computed once in `deriveMoney` under R-G32.6. Never a second percentage, never the word "retainer".
2. **The rails are hers.** UPI, account and IFSC print for the Client to pay direct. No pay link, no platform account, no commission (master §7).
3. **Clause 4.2 is omitted whole** when `vendors.gstin` · `:1208` is null — not greyed, not `N/A`, not a zero rate, and not a struck line.
4. **4.5 prints the rails it has.** Where only UPI is set, the sentence names UPI and cash; where only bank is set, it names the bank and cash. It never prints an empty account number, and it never prints the sentence with a hole in it.

## 5 · ACCOMMODATION AND TRAVEL — v4 clause 5 · NEW · R-40.73

| Token | Meaning | Source | Class | Format | Omission |
|---|---|---|---|---|---|
| `vendor_base_city` | Where she works from — the city clause 5.1 tests against | `vendors.city` · `:1206`; `vendors.service_cities` · `:1245` bounds what counts as outstation | DERIVED | text | OMIT (5 whole) |
| `same_venue` | Where the team stays | PROFILE — **default *the same venue or hotel as the Client*** (R-40.73), editable | PROFILE | text | **OMIT (5 whole)** |
| `rooms` | How many rooms | PROFILE — **default 2** (R-40.73), editable | PROFILE | rooms | **OMIT (5 whole)** |
| `travel_terms` | How travel is provided or reimbursed | PROFILE | PROFILE | text | OMIT (5 whole) |

**`same_venue` and `rooms` are the only two tokens v4 adds.** `travel_terms` and `vendor_base_city` **moved** here from v3's clause 4 — moved, never duplicated. `vendor_base_city` and `vendor_city` are the same column read for two purposes and are **not** two homes: one is the jurisdiction at clause 15, one is the test at clause 5.1, and both resolve to `vendors.city` · `:1206`.

**The clause is omitted whole in two independent cases**, and the build must test both: **(a)** every function's `function_N_city` equals `vendor_base_city`, so there is nothing to accommodate; **(b)** the clause's own fields are unset. Case (a) is why `function_N_city` became REQUIRED at §3.

**R-40.73's defaults are the Vendor's starting values, not TDW's terms.** Two rooms at the Client's own hotel is what the founder ruled the clause should say when she has not said otherwise. She may change either. Law one is not suspended for this clause.

## 6 · POSTPONEMENT AND CANCELLATION — v4 clause 6

| Token | Meaning | Class | Format | Omission |
|---|---|---|---|---|
| `postpone_notice_days` | Notice to transfer dates | PROFILE | days | OMIT (6.1 whole) |
| `postpone_window_months` | How far ahead the transfer may go | PROFILE | months | OMIT (6.1 whole) |
| `cancel_tier_1_days` · `cancel_tier_2_days` · `cancel_tier_3_days` | The notice thresholds | PROFILE | days | OMIT-ROW |
| `cancel_tier_1_pct` … `cancel_tier_4_pct` | Payable at each tier | PROFILE | pct | OMIT-ROW |
| `deposit_refundable` | The one-sentence answer | PROFILE | text — one sentence, never a symbol | OMIT (6.6) |
| `refund_days` | Days for any refund — clauses 6, 11, Annex C.4, Annex F.4 | PROFILE | days | OMIT |

**The slab table is not drawn at all when every tier is unset**, and a tier whose days or percentage is missing takes neither row nor a padded one. A cancellation table with three of its four rows blank tells a Client less than no table.

## 7 · DELIVERABLES AND DELIVERY — v4 clause 7

| Token | Meaning | Class | Format | Omission |
|---|---|---|---|---|
| `delivery_days` | Days from the last function | PROFILE | days | **REQUIRED** |
| `delivery_method` | How it is handed over | PROFILE | text | OMIT |
| `link_live_days` | How long a download link lives | PROFILE | days | OMIT (7.3 sentence) |
| `revision_rounds` | Rounds included | PROFILE | number | OMIT (7.4 whole) |
| `revision_rate` | Charge per further round | PROFILE | `Rs` | OMIT (7.4 whole) |
| `archive_months` | How long originals are kept | PROFILE | months | OMIT (7.5 sentence) |

**`delivery_days` is REQUIRED at v4 and was not at v3.** Clause 4.7 and clause 11 both add days *to the period stated in clause 7.2*. A period that is absent cannot be added to, so two other clauses would refer to nothing.

## 8 · THE CLIENT'S OBLIGATIONS, VENUE, AND THE REST — v4 clauses 8 to 16

| Token | Meaning | Source | Class | Format | Omission |
|---|---|---|---|---|---|
| `meals_provision` | Who feeds the crew | PROFILE | PROFILE | text | OMIT (8.3 terms) |
| `takedown_days` | Days to take something down — clause 10, three times | PROFILE | PROFILE | days | OMIT |
| `vendor_credit_role` | How she is credited on a wedding page | `wedding_credits.role` · `:1271`; vocabulary is R-40.7's ten | DERIVED | one-of: R-40.7's roles | OMIT |
| `fm_window_months` | Months to find new dates before either party may end it | PROFILE | PROFILE | months | OMIT |
| `named_professional` | The individual the booking depends on | No column — §9 | PER-CONTRACT | text | **OMIT (12.2 whole)** |

**Clause 9 carries no tokens, and that is deliberate.** It states obligations — obtain permission, notify a restriction, procure access — and **an obligation is not a parameter.** Where the venue's own licences need naming, Annex F.5 names them; where Annex F is not attached, clause 9.5 is absent.

**Clause 10 is bound to two columns and writes to neither.** `couples.publish_weddings` · `:422`, default `false`, and `weddings.couple_consent` · `:1303`, default `false`. **Signature must not write either.** Clause 10.5 states that publication is enabled only by the Client, under the vetoed words "Publish our wedding" (R-40.9). A composer that flipped a consent flag on signature would make the instrument's own sentence false.

**And clause 10 has no omission switch — ruling F6.** The tailoring surface carries no toggle beside it. A Vendor's switch governs whether a clause is *printed*, never whether the Client's consent is on; clause 10.5 is the sentence that tells the Client so, and a document that omits it is a document that has removed the Client's own notice of her own switch.

**`vendor_city` at clause 15 is the same DERIVED field as §1** — `vendors.city` · `:1206`. **One home.** The jurisdiction is never typed a second time.

---

## 9 · THE CATEGORY → ANNEX MAP — NEW, ruling F8

**This map had no home. Not in `contracts.js`, not anywhere.** `screen.tsx:56` (re-derived at `d4c7efc`) *describes* it — *"the map from category to annex is not database-enforced… a suggestion the room offers"* — and then `ANNEXES` is a flat list of seven with no category keying at all. R-G32.13 has governed a map that was never built. It is defined here and built by sitting 2 in **one dream-os home served to the room**, because the seven annex headings are presently authored twice (`contractPdf.js:535` and `screen.tsx:60`, both re-derived at the new tips) in a file whose own comment says a name typed twice would be two homes for one heading.

**⚠ THE KEY DOMAIN IS NOW DERIVED — founder-run, production, 2026-09-07.** `vendors.category` · `:1204` **carries no CHECK**, so the eleven values of `couple_bookings_category_check` and `engagements_category_check` were never its domain — they are a neighbouring table's. F-40.172 is the proof it mattered: `capacityFacts` and `describeDate` answered one question from two ladders and **disagreed on seven categories**, every one a live value outside that list. The table below is completed against the answer, not against the CHECK.

```sql
SELECT category, count(*) AS vendors
FROM public.vendors
GROUP BY category
ORDER BY vendors DESC, category;
```

| `category` | vendors |
|---|---|
| `makeup` | **21** |
| `photography` | 4 |
| **`NULL`** | **2** |
| `jewellery` | 1 |
| `planning` | 1 |
| | **29 rows, 5 distinct values** |

**Three things the answer changed, and each is stated rather than absorbed.**

**1 · `NULL` IS A LIVE VALUE, AND IT IS NOT "UNMAPPED".** Two vendor rows carry no category at all. An unmapped category is a value the map does not name; `NULL` is the *absence* of a value, and code that reaches for `MAP[category]` on `null` does not fall through a default — it reads a property of nothing. **The map names `NULL` explicitly, on its own row, and does not rely on a fallback to catch it.** This is the same class as G3.1's fail-closed hook defaults: an unreadable answer is answered, never assumed.

**2 · SEVEN OF F-40.172's CATEGORIES HAVE ZERO ROWS TODAY.** `hairstylist`, `performer`, `content_creator`, `choreographer`, `mehendi`, `invitations` and `cake` are live *in code* and absent *from the data*. **They stay in the map.** A map built only from today's census breaks on tomorrow's first signup, and the cost of naming a category with no rows is one line; the cost of missing one is a vendor meeting a screen with nothing to attach. The table marks which rows the census witnessed and which are anticipated, so a later reader can tell the two apart.

**3 · `makeup` IS 21 OF 29 — AND THE RATIFIED FRAME DRAWS ANNEX A.** `T2-annexes` shows a photographer attaching Annex A, which is 4 of 29. The frame is not wrong — it matches `P1`–`P4`'s worked example — but **the annex that will actually be attached most often is B, makeup and hair**, and the founder should know the drawing he ratified is not the modal case. No byte changes; this is a sentence so that nobody later infers a priority from a mock's choice of example.

**The map, completed.** ✅ = witnessed by the census; ○ = anticipated, no rows today.

| `vendors.category` | Annexes offered | Census |
|---|---|---|
| `makeup` | **B** | ✅ 21 |
| `photography` | **A** | ✅ 4 |
| **`NULL`** | **all seven**, G first | ✅ 2 — *she has not told us her trade; the room offers everything rather than guessing* |
| `jewellery` | **G** | ✅ 1 |
| `planning` | **D** | ✅ 1 — ⚠ `planning` normalises to `planning` and **keys to `other`** in `capacityVerdict`, F-40.172's own load-bearing branch order. This map keys it to D directly and does not reuse that ladder |
| `hairstylist` | **B** | ○ |
| `mehendi` | **E** | ○ |
| `decor` | **C** | ○ |
| `venue_catering` | **F** | ○ |
| `content_creator` | **A** | ○ |
| `designer` · `performer` · `choreographer` · `invitations` · `cake` | **G** | ○ |
| `other`, and any value not named above | **all seven**, G first | ○ |

**Three laws on this map.**

1. **It is a suggestion the room offers and never a rule it applies.** She may attach any annex, in any combination, whatever her category. The map decides which list is shown first, and nothing else.
2. **An unmapped or NULL category offers all seven and never an empty list.** A vendor whose trade the map does not name must not meet a screen that says she has nothing to attach — that is F-40.138's shape, one plane over. **And the surface changes shape, not only its contents:** `T2-annexes` splits into *Offered for your trade* and *Add another*, and for these vendors the first section would be an empty heading. Frame **`T2-unmapped`** draws that state as **one list under `All annexes`**, with no first section to be empty. It is two new bytes and they are on the veto sheet.
3. **One home.** The map and the seven headings live in a single dream-os constant, served to the room. The two literals that exist today are collapsed into it by sitting 2, not duplicated a third time.

---

## 9A · THE AGREEMENT'S REFERENCE — `contracts.number` · RULED (chair, option 1)

**This is chrome, not an instrument field.** It appears in the paper's title block, never in v4's clause text, so it is **not in the 168** — the folio and the eyebrow are not in the census either, and for the same reason. It is catalogued here because it now has a ruled home and therefore a DDL.

| Field | Meaning | Source | Class | Format |
|---|---|---|---|---|
| *(chrome)* `contract_number` | The agreement's reference, in the title block | **`contracts.number`** — no column yet, §11 | DERIVED | text |

**The mechanism is the invoice's, and it is stated here because the ruling names it.** Derived at `85bdac1` from `src/lib/vendor/invoices.js:75–91`:

- `vendors.invoice_prefix` · `:1220` is set once, on first use, to `'TDW/' + routing_handle`.
- `vendors.invoice_counter` · `:1221` (`integer NOT NULL default 0`) is incremented **in the UPDATE**, and the number is read from **Postgres's answer** (`.update({counter: v.counter + 1}).select('invoice_counter').single()`) — never from the value the process read a moment earlier. That read-after-write is the whole of the guarantee and it is the part sitting 2 must copy.
- The number is `prefix + '/' + String(counter).padStart(2, '0')`.

**Contracts take the same shape with their own pair** — `vendors.contract_prefix` and `vendors.contract_counter` — because a contract sequence sharing the invoice counter would make invoice 7 and contract 7 impossible to hold at once, and a shared counter is a second meaning for one number.

**⚠ TWO THINGS THE RULING DOES NOT DETERMINE, HELD RATHER THAN CHOSEN.** The vetoed reference is `DEV440/2026/0007`. The invoice mechanism produces `<prefix>/<counter:2>` and has **no year segment and no reset**:

1. **Does the counter reset each year?** If it does not, the first agreement of 2027 reads `DEV440/2027/0012` — a string shaped like a year sequence that is not one. If it does, the sequence is per-vendor-**per-year**, which is a different concept from the invoice's and needs its own column or a derivation from `created_at`.
2. **The padding is 4 here and 2 on invoices.** Stated so the difference is a decision rather than a drift.

**⚠ AND ONE CANDIDATE FINDING, FOR THE CHAIR TO MINT OR DISMISS.** The ratified invoice frames (`invoice-document-mock.html`, `S2-addr`) print `TDW/2026/0041`. The mechanism above **cannot produce that string** — it produces `TDW/DEV440/01`. The founder has been reading an invoice reference in a shape the generator does not emit. This seat does not self-mint a number; it is recorded here with its derivation so the chair can allocate one or rule it a mock's licence.

---

## 10 · THE ANNEX FIELDS

All PROFILE or PER-CONTRACT; none DERIVED, because no annex plane exists. **95 tokens, unchanged from v3 in name and in count.** Their omission class is uniform and is stated once rather than 95 times: **an annex that is not attached is absent from the document, and within an attached annex a sub-clause whose fields are unset is absent from that annex.** No annex field is REQUIRED.

**A — photography and film.** `a_team` `a_coverage_hours` `a_drone` `a_edited_count` `a_photo_format` `a_film` `a_album` `a_teaser_days` `a_selection_days` `a_extras` `a_raw_files` `a_backup_scheme` — *12*

**B — makeup and hair.** `b_persons` `b_persons_named` `b_looks` `b_artist_name` `b_assistants` `b_trial` `b_product_brands` `b_included` `b_extras` `b_time_per_person` `b_arrival_before` `b_disclosure_days` — *12*

**C — décor and production.** `c_areas` `c_drawings` `c_drawings_date` `c_approval_date` `c_setup_hours` `c_strike_hours` `c_inventory` `c_damage_basis` `c_security_deposit` — *9*

**D — planning and coordination.** `d_service_level` `d_scope` `d_own_account_suppliers` `d_pass_through` `d_authority_limit` `d_onday_team` `d_onday_start` `d_onday_end` `d_runsheet_date` `d_runsheet_approval_date` — *10*

**E — mehendi.** `e_bride` `e_guests` `e_design_complexity` `e_bride_coverage` `e_guest_design` `e_bride_hours` `e_guest_total_hours` `e_paste_hours` `e_guest_minutes` `e_artist_count` `e_artist_names` `e_patch_days` — *12*

**F — venue.** `f_spaces` `f_hours_from` `f_hours_to` `f_music_curfew` `f_capacity` `f_parking` `f_guaranteed_minimum` `f_headcount_date` `f_final_headcount_date` `f_menu_date` `f_deposit_date` `f_inclusions` `f_exclusions` `f_catering` `f_outside_vendor_policy` `f_outside_vendor_charges` `f_venue_licences` `f_couple_licences` `f_per_plate` `f_security_deposit` `f_overstay_rate` — *21*

**G — other services.** `g_service_name` `g_service_description` `g_functions` `g_hours` `g_start_time` `g_team_count` `g_team_named` `g_deliverables` `g_delivery_method` `g_delivery_trigger` `g_delivery_days` `g_vendor_provides` `g_couple_provides` `g_hired_items` `g_fittings` `g_fittings_count` `g_fittings_location` `g_alteration_rate` `g_special_terms` — *19*

**⚠ AND NOT ONE OF THESE 95 RENDERS TODAY — F-40.190.** Census **re-run at `85bdac1`**, because `contractPdf.js` moved under this packet: `grep -c 'a_team\|a_coverage_hours\|b_looks\|c_areas\|e_bride\|f_spaces\|g_service_name' src/lib/contractPdf.js` → **still 0**. `annexList()` is now at `:533` and its `NAMES` literal at `:535` (`:510`/`:512` at the prior tip — the file moved, the defect did not); it emits the seven *names* and nothing more, so the sealed PDF says *Annex A — Photography and film* forms part of the Agreement and then contains no Annex A. Clause 2.2's next sentence makes that load-bearing: **a Client cannot find what is included in her own agreement.** v4 sets the annexes out in full and frame `P3-annex` draws one; sitting 2 makes the renderer print them.

---

## 11 · WHAT THE PRODUCT CANNOT FILL YET — **F-40.94**, re-derived at v4

| | v1 | v3 | v4 | |
|---|---|---|---|---|
| Tokens in the instrument | 202 | 166 | **168** | +2 |
| Of those, fillable today (DERIVED) | 37 | 34 | **34** | — |
| **Tokens with no storage home — F-40.94's bill** | 165 | 132 | **134** | **+2** |

*Derived by command at `85bdac1` under `LC_ALL=C`, not by arithmetic: the DERIVED set is the rows above whose Source cell names a column or a computation, and the bill is the census minus that set.*

**`0138` paid part of this bill and the register must say which part.** `contract_profiles.fields` (head `:232`) is the PROFILE home; `contracts.terms` and `contracts.annexes` (head **`:261`** — the regen moved it from `:232`) are the PER-CONTRACT home; `contract_signatures` (head `:241`, fifteen columns) is the signature record clause 16 promises. **What is still unhoused:**

| Wanted for | Nearest existing home |
|---|---|
| `partner_2_name` | `clients` · head `:169` holds one `name` · `:175` |
| `function_N_venue` · `function_N_city` | `events` · head `:568` has neither; `weddings.venue` · `:1300` and `weddings.city` · `:1301` exist, but the wedding row is created after delivery, not at contract time. **And `function_N_city` is REQUIRED at v4**, so this is no longer a convenience — clause 5 cannot be omitted honestly without it. |
| `named_professional` | No home |
| **The category → annex map** | No home at all — §9 |
| **`contracts.number`** and the vendor pair | No column — §9A. `contracts` head `:261` has no number column, which is the same fact **R-40.82** met from the other direction when it put an id suffix on the draft object's filename, because two contracts for one Client share a generated title and `upsert` would otherwise overwrite one silently |

**F-40.94's bill and F-40.190's cure are the two halves of sitting 2's DDL**, and they are not the same work: the bill is about where a value is *kept*, and F-40.190 is about whether it is ever *printed*.

---

## 12 · STATUS

Re-derived at `dream-os @ 85bdac1` against `TDW_19_CONTRACT_GENERIC_v4.md`. **Every witness line was re-read at this base; not one is carried from v1's register, and every line that moved between `95deda5` and `85bdac1` was re-derived rather than re-stamped**, because the `5b3f61f` regen moved all of them. The census, the delta and the annex-render census were each run by command and their commands are printed above.

**⚠ THE MIGRATION SLOT IS NOT ALLOCATED HERE.** `db/migrations/` holds `0141` at this tip, so the arithmetic next-free is `0142` — **and R-40.44 gives allocation to the chair across concurrent seats**, with G5.1 s2 possibly taking `0142`. This register names no number; sitting 2's charter does.

**One thing this file no longer holds:** §9's key domain was ⏳ at the first cut and is **derived** at this one, from the founder's own production read of 2026-09-07. The census counts **rows in `public.vendors`**, which is what it says and no more — this seat does not know the provenance of those 29 rows and does not guess at it.

**Two things this file states rather than assumes:** `PUBLIC_SCHEMA.md` is stale for `public.vendors` at ladder `0140` (and for `lead_alerts`, `payment_reminders` and `payment_reminder_settings`, which it does not describe at all), and the category domain at §9 is **held for the founder's SELECT** rather than filled from a neighbouring table's CHECK.

**No byte here is vendor-facing copy**, and no label may be lifted into a surface. The build reads this for *which* fields exist, *where* they come from and *what happens when they are unset*; the words a Vendor reads are minted at `docs/mocks/contract-document-mock.html` under the founder's veto, on `docs/mocks/G32V4_VETO_SHEET.md`.

**This register tracks v4, and the lawyer has answered — R-40.106, 2026-09-07.** It is re-derived again when the instrument next moves, and not before.
