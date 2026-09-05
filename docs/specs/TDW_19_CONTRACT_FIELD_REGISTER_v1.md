# TDW_19 · THE CONTRACT FIELD REGISTER · v1

**Status:** SPEC. Not a lawyer's document. The companion to `docs/specs/TDW_19_CONTRACT_GENERIC_v1.md`, split out of it by chair answer 4 (2026-09-05) so the lawyer receives a clean instrument.
**Seat:** CE-40 · G3.2-pre · Fable-Desk, docs only · 2026-09-05
**Base:** `dream-os @ d91ec6e`
**Read by:** G3.2's mock. This file is what tells the mock which of the instrument's blanks the product already knows, which the vendor must be asked for once, and which are asked per contract.

---

## 0 · HOW THIS FILE IS USED, AND ITS ONE LAW

The instrument carries 202 distinct field tokens. Each is listed below exactly once, with four things: what it means in a sentence, **where the value comes from**, its class, and its format.

**The one law: nothing in the instrument is authored by TDW.** Not a price, not a percentage, not a day-count, not a policy. Every token is filled from a column the vendor owns, from a value she sets once in her own room, or from what she types for this couple. Where a default is named here it is a *starting value the vendor may change*, never a value TDW imposes.

### The token census is derived, not carried

```
grep -o '{{[a-z0-9_]*}}' docs/specs/TDW_19_CONTRACT_GENERIC_v1.md | sort -u | wc -l
→ 202
```

Run it against the instrument before trusting this file. **If the count differs, this register is stale and the mock must not read it.** A field in the instrument with no row here is a blank nobody has decided how to fill.

### The three classes

| Class | Meaning | Where the vendor meets it |
|---|---|---|
| **DERIVED** | The product already holds it. Never asked. | Nowhere — it fills itself |
| **PROFILE** | The vendor's own standing policy or price. Asked **once**, kept, reused on every contract thereafter, editable. | Her Contracts settings, at setup |
| **PER-CONTRACT** | Specific to this couple and this wedding. Asked each time. | The contract composer |

### Formats used below

- **`Rs`** — Indian grouping, `Rs 1,25,000`. The letters `Rs`, never the rupee sign. Never `K`, `L` or `Cr`. Never truncated. Stored as whole rupees, exactly as `invoices.amount_total` does.
- **date** — `D Mon YYYY`, IST, e.g. `22 Nov 2026`.
- **time** — `h:mm am/pm`, IST, e.g. `4:30 pm`.
- **pct** — a whole number followed by `%` in the rendered document; the field itself holds the number only.
- **days / hours / months** — a whole number; the instrument supplies the unit word.
- **text** — free prose the vendor or the composer supplies; rendered as written.
- **one-of** — a choice from a stated set; the composer offers exactly that set.

### SQL provenance

Every DERIVED row names its witness as `PUBLIC_SCHEMA.md:<line>` at base `d91ec6e`. **A column name is never authored from memory.** Where a token has no column at this base, the row says so in the Source cell — those are the fields the G3.2 template plane must carry, and §7 gathers them.

---

## 1 · THE PARTIES AND THE DATE — clause 1, and the signature block

| Token | Meaning | Source | Class | Format |
|---|---|---|---|---|
| `vendor_business_name` | The vendor's trading name | `vendors.business_name` · `PUBLIC_SCHEMA.md:1135` | DERIVED | text |
| `vendor_category_words` | Her trade in plain words, e.g. "wedding photography" | Derived from `vendors.category` · `:1136`, mapped to a phrase; **the column is free text with no CHECK at this base**, so the mock maps known values and falls back to the vendor's own words | DERIVED | text |
| `vendor_address` | Her business address | `vendors.address` · `:1181` | DERIVED | text |
| `vendor_city` | Her city — also the jurisdiction at clause 17.4 | `vendors.city` · `:1138` | DERIVED | text |
| `vendor_signatory_name` | The person signing for the business | No column at this base — §7 | PROFILE | text |
| `vendor_phone` | Her contact number | The vendor's own WhatsApp number on the platform record | DERIVED | phone |
| `partner_1_name` | One of the couple | `clients.name` · `:175`, or the composer | PER-CONTRACT | text |
| `partner_2_name` | The other | No column at this base — §7 | PER-CONTRACT | text |
| `couple_primary_phone` | The number the contract is sent to and the OTP goes to | `clients.phone` · `:176` | PER-CONTRACT | phone |
| `partner_2_phone` | The second signatory's number, where they sign separately | No column at this base — §7 | PER-CONTRACT | phone |
| `couple_email` | Their email, for notices under clause 16 | `clients.email` · `:177` | PER-CONTRACT | email |
| `agreement_date` | The date of the agreement | The date the contract is composed | DERIVED | date |
| `vendor_signed_date` | When the vendor signed | Set at signature | DERIVED | date |
| `couple_signed_date` | When the couple signed | Set at signature | DERIVED | date |

## 2 · SCOPE AND ANNEXES — clause 3

| Token | Meaning | Source | Class | Format |
|---|---|---|---|---|
| `annexes_attached` | Which annexes form part of this contract | The composer's annex selection | PER-CONTRACT | text list |
| `exclusions` | What is expressly not included | PROFILE default, editable per contract | PROFILE | text |

## 3 · THE DATES — clause 4

*The instrument shows two function rows and says rows repeat. The mock renders one row per `events` row for this couple; the tokens below are the row template, not a limit of two.*

| Token | Meaning | Source | Class | Format |
|---|---|---|---|---|
| `function_1_name` · `function_2_name` | The function's name — sangeet, mehendi, ceremony | `events.title` · `:539` (with `events.kind` · `:542` where it is more precise) | PER-CONTRACT | text |
| `function_1_date` · `function_2_date` | Its date | `events.event_date` · `:540` | PER-CONTRACT | date |
| `function_1_time` · `function_2_time` | Its start time | `events.event_time` · `:541`, or `events.slot` · `:551` where only a slot is known | PER-CONTRACT | time |
| `function_1_venue` · `function_2_venue` | Where it is | No column on `events` at this base — §7 | PER-CONTRACT | text |
| `function_1_city` · `function_2_city` | Its city | No column on `events` at this base — §7 | PER-CONTRACT | text |

## 4 · THE FEE — clause 5

| Token | Meaning | Source | Class | Format |
|---|---|---|---|---|
| `fee_total` | The total fee | `invoices.amount_total` · `:646`, or the composer where no invoice exists yet | PER-CONTRACT | `Rs` |
| `fee_breakdown` | What the fee is made of | `invoices.description` · `:645`, or the composer | PER-CONTRACT | text |
| `gst_treatment` | Whether the fee is inclusive or exclusive of GST | PROFILE | PROFILE | one-of: `inclusive` · `exclusive` |
| `gst_pct` | The rate applying | PROFILE — the vendor's rate for her service | PROFILE | pct |
| `gst_amount` | The tax, computed | Computed from `fee_total` and `gst_pct` | DERIVED | `Rs` |
| `fee_payable_with_gst` | The total payable | Computed | DERIVED | `Rs` |
| `vendor_gstin` | Her GSTIN | `vendors.gstin` · `:1140` | DERIVED | text |
| `vendor_base_city` | The city she works from, for travel purposes | `vendors.city` · `:1138`; `vendors.service_cities` · `:1177` bounds what counts as outstation | DERIVED | text |
| `travel_terms` | How travel and stay are charged | PROFILE | PROFILE | text |
| `overtime_rate` | Charge beyond agreed hours | PROFILE | PROFILE | `Rs` |
| `overtime_unit` | The unit it is charged in | PROFILE | PROFILE | one-of: `hour` · `half hour` |
| `meals_provision` | Who feeds the crew | PROFILE | PROFILE | text |
| `meals_hours` | Function length at which meals become due (clause 10.5) | PROFILE | PROFILE | hours |

**Clause 5.2 is an optional block.** The mock omits it whole when `vendors.gstin` · `:1140` is null. It does not render it greyed, does not print "N/A", and does not print a zero rate.

## 5 · DEPOSIT AND SCHEDULE — clause 6

| Token | Meaning | Source | Class | Format |
|---|---|---|---|---|
| `deposit_pct` | The share that holds the dates | PROFILE — **default 30, editable** (R-40.37) | PROFILE | pct |
| `deposit_amount` | That share of the fee | Computed; equals `payment_schedules.amount_due` · `:818` at `ordinal` · `:823` = 1 | DERIVED | `Rs` |
| `milestone_2_label` · `milestone_3_label` | What the milestone is called | `payment_schedules.milestone_label` · `:816` | PER-CONTRACT | text |
| `milestone_2_pct` · `milestone_3_pct` | Its share | `payment_schedules.pct` · `:817` | PER-CONTRACT | pct |
| `milestone_2_amount` · `milestone_3_amount` | Its amount | `payment_schedules.amount_due` · `:818` | DERIVED | `Rs` |
| `milestone_2_due` · `milestone_3_due` | When it falls due | `payment_schedules.due_date` · `:819` | PER-CONTRACT | date |
| `vendor_upi_id` | Her UPI ID | `vendors.upi_id` · `:1139` | DERIVED | text |
| `vendor_account_name` | Bank account name | `vendors.account_name` · `:1178` | DERIVED | text |
| `vendor_account_number` | Bank account number | `vendors.account_number` · `:1179` | DERIVED | text |
| `vendor_ifsc` | IFSC | `vendors.ifsc` · `:1180` | DERIVED | text |
| `late_grace_days` | Grace before a milestone is late | PROFILE | PROFILE | days |
| `late_interest_pct` | Monthly interest on overdue amounts | PROFILE | PROFILE | pct |
| `late_notice_days` | Notice before work is suspended | PROFILE | PROFILE | days |
| `late_no_suspend_days` | Window before a function in which work is never suspended | PROFILE | PROFILE | days |
| `withhold_threshold` | Overdue amount above which a partial delivery is withheld | PROFILE | PROFILE | `Rs` |

**Three notes the mock must honour.**

1. **The deposit is milestone 1, not a separate concept.** Chair answer 1 (2026-09-05): the deposit *is* the retainer; master §4 G3.3's "default retainer 10%" is superseded. `deposit_pct` and `payment_schedules.pct` · `:817` at `ordinal` = 1 are **one number with one home**. The mock never shows a second percentage and never prints the word "retainer".
2. **The rails are hers.** `vendor_upi_id`, `vendor_account_name`, `vendor_account_number`, `vendor_ifsc` are printed for the couple to pay direct. No pay link, no platform account, no commission (master §7).
3. **The milestone rows repeat.** Two are shown in the instrument; the mock renders one row per `payment_schedules` row for this contract's invoice, in `ordinal` · `:823` order.

## 6 · POLICY FIELDS — clauses 7 to 17

*Almost all of these are PROFILE: the vendor's standing policy, asked once at setup, printed identically on every contract until she changes it.*

### Cancellation — clause 7

| Token | Meaning | Class | Format |
|---|---|---|---|
| `cancel_tier_1_days` · `cancel_tier_2_days` · `cancel_tier_3_days` | The notice thresholds | PROFILE | days |
| `cancel_tier_1_pct` · `cancel_tier_2_pct` · `cancel_tier_3_pct` · `cancel_tier_4_pct` | What is payable at each tier | PROFILE | pct |
| `deposit_refundable` | The one-sentence answer at clause 7.2 | PROFILE | text — one sentence, never a symbol |
| `refund_days` | Days within which any refund is made — used at 7.1, 7.3, 8.3, 12.3, C9, F9 | PROFILE | days |

### Postponement — clause 8

| Token | Meaning | Class | Format |
|---|---|---|---|
| `postpone_notice_days` | Notice required to transfer dates | PROFILE | days |
| `postpone_window_months` | How far ahead the transfer may go | PROFILE | months |
| `repricing_days` | Days in which the vendor states a seasonal difference | PROFILE | days |

### Deliverables — clause 9

| Token | Meaning | Class | Format |
|---|---|---|---|
| `delivery_days` | Days from the last function to delivery | PROFILE | days |
| `delivery_method` | How the deliverables are handed over | PROFILE | text |
| `link_live_days` | How long a download link stays live | PROFILE | days |
| `revision_rounds` | Rounds of changes included | PROFILE | number |
| `revision_window_days` | Window in which they may be asked for | PROFILE | days |
| `revision_scope` | What a round means | PROFILE | text |
| `revision_rate` | Charge per further round | PROFILE | `Rs` |
| `archive_months` | How long originals are kept | PROFILE | months |
| `uncollected_days` | Days after which an uncollected delivery is treated as delivered | PROFILE | days |

### The couple's obligations — clause 10

| Token | Meaning | Class | Format |
|---|---|---|---|
| `contact_notice_days` | Notice for naming the on-day contact | PROFILE | days |

### Rights and publication — clause 11

| Token | Meaning | Source | Class | Format |
|---|---|---|---|---|
| `takedown_days` | Days to take something down on request — 11.3, 11.4, 11.7 | PROFILE | PROFILE | days |
| `vendor_credit_role` | How she is credited on a wedding page | `wedding_credits.role` · `PUBLIC_SCHEMA.md:1203`; the role vocabulary is R-40.7's ten | DERIVED | one-of: R-40.7's roles |

**Clause 11.4 is bound to two columns and writes to neither.** `couples.publish_weddings` · `:388`, default `false`, and `weddings.couple_consent` · `:1235`, default `false`. **Signing a contract must not write either column.** The instrument says publication is switched on only by the couple, in their own Settings room, under the vetoed words "Publish our wedding" (R-40.9, chair change 2 of 2026-09-05). A composer that flips a consent flag on signature would make the instrument's own sentence false and the default decorative.

### Force majeure — clause 12

| Token | Meaning | Class | Format |
|---|---|---|---|
| `fm_window_months` | Months to find new dates before either party may end the agreement | PROFILE | months |

### Team — clause 13

| Token | Meaning | Class | Format |
|---|---|---|---|
| `named_professional` | The individual the booking depends on | PER-CONTRACT | text |
| `named_professional_role` | What they personally do | PER-CONTRACT | text |
| `named_professional_functions` | At which functions | PER-CONTRACT | text |

**Clause 13.2 is optional.** Omitted whole where no individual is named.

### Liability — clause 14

| Token | Meaning | Class | Format |
|---|---|---|---|
| `insurance_cover` | Cover held, where 14.7 is attached | PROFILE | `Rs` |

### Disputes — clause 17

| Token | Meaning | Source | Class | Format |
|---|---|---|---|---|
| `dispute_talk_days` | Days for good-faith discussion | PROFILE | PROFILE | days |
| `mediator_appointer` | Who appoints a mediator if the parties cannot agree | PROFILE | PROFILE | text |

`vendor_city` at clauses 17.3 and 17.4 is the same DERIVED field as §1 — `vendors.city` · `:1138`. **One home.** The jurisdiction is not a separate field and is never typed a second time.

## 7 · ANNEX FIELDS

All PROFILE or PER-CONTRACT; none is DERIVED at this base, because no annex plane exists yet.

### Annex A — photography and film

`a_coverage_hours` (hours, PROFILE) · `a_photographers` `a_cinematographers` `a_assistants` `a_backup_bodies` (number, PER-CONTRACT) · `a_drone` (one-of: engaged / not engaged, PER-CONTRACT) · `a_edited_count` (number, PER-CONTRACT) · `a_photo_format` (text, PROFILE) · `a_teaser` `a_full_film` `a_album` (one-of: included / not included, PER-CONTRACT) · `a_teaser_minutes` `a_full_minutes` `a_teaser_days` (number, PROFILE) · `a_album_spec` `a_album_pages` (text / number, PER-CONTRACT) · `a_raw_files` (text — the vendor's plain answer, PROFILE) · `a_selection_days` (days, PROFILE) · `a_backup_scheme` `a_backup_hours` (text / hours, PROFILE)

### Annex B — makeup and hair

`b_persons` (number, PER-CONTRACT) · `b_persons_named` (text, PER-CONTRACT) · `b_looks` (number, PER-CONTRACT) · `b_artist_name` `b_assistants` (text / number, PER-CONTRACT) · `b_trial` (one-of: included / at a price / not offered, PROFILE) · `b_trial_hours` `b_trial_notice_days` (number, PROFILE) · `b_trial_location` `b_trial_included` (text, PROFILE) · `b_product_brands` `b_technique` `b_included` `b_extras` (text, PROFILE) · `b_time_per_person` `b_arrival_before` (text, PROFILE) · `b_disclosure_days` (days, PROFILE) · `b_travel_between` (text, PROFILE)

### Annex C — décor and production

`c_areas` (text, PER-CONTRACT) · `c_drawings` (number, PER-CONTRACT) · `c_drawings_date` `c_approval_date` `c_survey_date` (date, PER-CONTRACT) · `c_survey_venues` (text, PER-CONTRACT) · `c_setup_hours` `c_strike_hours` (hours, PER-CONTRACT) · `c_inventory` (text, PER-CONTRACT) · `c_damage_basis` (text, PROFILE) · `c_security_deposit` (`Rs`, PER-CONTRACT)

### Annex D — planning and coordination

`d_service_level` (one-of: full planning / partial planning / on-day coordination, PER-CONTRACT) · `d_scope` (text, PER-CONTRACT) · `d_own_account_suppliers` `d_pass_through` (text, PER-CONTRACT) · `d_authority_limit` (`Rs`, PER-CONTRACT) · `d_onday_team` (number, PER-CONTRACT) · `d_onday_start` `d_onday_end` (time, PER-CONTRACT) · `d_runsheet_date` `d_runsheet_approval_date` (date, PER-CONTRACT)

### Annex E — mehendi

`e_bride` (text, PER-CONTRACT) · `e_guests` (number, PER-CONTRACT) · `e_design_complexity` `e_bride_coverage` `e_guest_design` (text, PER-CONTRACT) · `e_bride_hours` `e_guest_total_hours` `e_paste_hours` (hours, PROFILE) · `e_guest_minutes` (minutes, PROFILE) · `e_artist_count` `e_artist_names` (number / text, PER-CONTRACT) · `e_patch_days` (days, PROFILE)

### Annex F — venue

`f_spaces` (text, PER-CONTRACT) · `f_hours_from` `f_hours_to` `f_music_curfew` (time, PER-CONTRACT) · `f_capacity` `f_parking` `f_guaranteed_minimum` (number, PER-CONTRACT) · `f_headcount_date` `f_final_headcount_date` `f_menu_date` `f_deposit_date` (date, PER-CONTRACT) · `f_inclusions` `f_exclusions` `f_catering` `f_outside_vendor_policy` `f_outside_vendor_charges` `f_venue_licences` `f_couple_licences` `f_cancellation_slab` (text, PROFILE) · `f_per_plate` `f_security_deposit` `f_overstay_rate` (`Rs`, PER-CONTRACT)

### Annex G — other services

`g_service_name` `g_service_description` (text, PER-CONTRACT) · `g_functions` (text, PER-CONTRACT) · `g_hours` (hours, PER-CONTRACT) · `g_start_time` (time, PER-CONTRACT) · `g_team_count` `g_team_named` (number / text, PER-CONTRACT) · `g_deliverables` `g_delivery_method` `g_delivery_trigger` (text, PER-CONTRACT) · `g_delivery_days` (days, PER-CONTRACT) · `g_vendor_provides` `g_couple_provides` `g_hired_items` (text, PER-CONTRACT) · `g_fittings` (one-of: included / not included, PER-CONTRACT) · `g_fittings_count` `g_fittings_notice_days` (number, PER-CONTRACT) · `g_fittings_location` (text, PER-CONTRACT) · `g_alteration_rate` (`Rs`, PROFILE) · `g_special_terms` (text, PER-CONTRACT)

**Annex G exists by chair answer 3 (2026-09-05)**, covering `designer · jewellery · performer · content_creator` and anything else the eleven-value category CHECK names that A–F do not. The witnessed enumeration is `couple_bookings_category_check` · `PUBLIC_SCHEMA.md:1437` and `engagements_category_check` · `:1554`, both `planning · designer · photography · makeup · hairstylist · jewellery · decor · venue_catering · performer · content_creator · other`. **`vendors.category` · `:1136` itself carries no CHECK at this base**, so the mock's annex-selection map is not enforced by the database and must not assume it is.

---

## 8 · WHAT THE PRODUCT CANNOT FILL YET — **F-40.94**

Eight token families above have no column at base `d91ec6e`. They are gathered here because they, and not the clause text, are G3.2's schema work, and they carry a number — **F-40.94**, allocated by the chair on 2026-09-05 — so that the DDL is tracked as a finding and not as a paragraph inside a spec. This section is the finding's body; the finding itself is filed in `docs/FINDINGS_LOG.md` by the chair's own cut.

| Token | Wanted for | Nearest existing home |
|---|---|---|
| `vendor_signatory_name` | Clause 1.1 and the signature block | — a vendor-profile column |
| `partner_2_name` | Clause 1.1 and the second signature | `clients` · head `:169` holds one `name` · `:175` |
| `partner_2_phone` | The second signature | `clients` holds one `phone` · `:176` |
| `function_N_venue` | Clause 4.1's table | `events` · head `:534` has no venue column; `weddings.venue` · `:1232` exists but the wedding row is created after delivery, not at contract time |
| `function_N_city` | Clause 4.1's table | `weddings.city` · `:1233`, same timing problem |
| Every PROFILE token in §6 | The vendor's standing policy | No home at all — this is the `contract_templates.fields` json of master §4 G3.2 |
| Every annex token in §7 | The attached annexes | Same |
| The signature record | Clause 18.3 | `contracts` · head `:232` has `signed_at` · `:247` and nothing else — no signer, no digest, no audit trail |

**The contract plane today is an upload plane.** `contracts` carries `title` · `:240`, `storage_path` · `:241`, `state` · `:245` under `contracts_state_check` · `:1402` (`draft | sent | signed | cancelled`), `sent_at` · `:246`, `signed_at` · `:247`, `notes` · `:244` and four FKs. There is no body, no `template_id`, no `terms`, no `signer_phone`, no `signature_hash`, no `pdf_url`. The room at `dreamos-pwa app/vendor/(shell)/contracts/screen.tsx` shows a list, an upload sheet taking a title and a PDF, and a detail sheet offering Download, Mark Sent, Mark Signed and Cancel.

**This is not a blocker for v2.** The lawyer-passed contract is a PDF, and a PDF is exactly what the plane already stores. From the day v2 comes back the vendor uploads it and sends it, with no schema byte and no new door. Everything in this register is what G3.2 builds **after** that, to stop her filling the blanks by hand.

---

## 9 · STATUS

Derived at `dream-os @ d91ec6e`. Every DERIVED row names its `PUBLIC_SCHEMA.md` line at that base; nothing here is authored from memory.

**No byte in this file is vendor-facing copy**, and no label here may be lifted into a surface. The mock reads this file for *which* fields exist and *where* they come from; the words a vendor reads beside each field are minted at G3.2's mock and pass the founder's veto there.

This register tracks `TDW_19_CONTRACT_GENERIC_v1.md`. **When the lawyer's v2 lands, this file is re-derived against v2 and reissued at the same version** — a register pointing at a superseded instrument is worse than no register, because it is confidently wrong.

**2026-09-05 · v2 · re-derived, no change.** The lawyer approved the instrument as it stood and moved no clause, so v2 is v1 plus a dated verdict block in its front matter, at the same path. The census was re-run against v2 and returns **202** — the same 202 tokens, none added, none renamed, none retired. **Every row above therefore stands unamended, and all 39 `PUBLIC_SCHEMA.md` witness lines were re-read at base `012374c` before this line was written; `PUBLIC_SCHEMA.md` did not move between `d91ec6e` and `012374c`, verified by `git diff --stat`.** The register is not stale.
