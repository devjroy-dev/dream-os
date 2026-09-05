# TDW_19 · THE CONTRACT FIELD REGISTER · v1

**Status:** SPEC. Not a lawyer's document.
**Tracks:** `docs/specs/TDW_19_CONTRACT_GENERIC_v3.md` — **the simplified instrument, from this cut forward.** `TDW_19_CONTRACT_GENERIC_v1.md` remains on the tree as the record the lawyer approved; it is not a build input, and the 39 blanks R-40.43 retired are not catalogued here.
**Seat:** CE-40 · G3.2-pre · Fable-Desk, docs only · 2026-09-05
**Base:** `dream-os @ 9235849`
**Read by:** G3.2's mock — which of the instrument's blanks the product already knows, which the vendor is asked for once, which are asked per contract.
**Finding:** §8 is the body of **F-40.94** — G3.2's DDL.

---

## 0 · HOW THIS FILE IS USED, AND ITS ONE LAW

The instrument carries **166** distinct field tokens — down from v1's 202 under R-40.43's simplification. Each is listed below exactly once, with what it means, **where the value comes from**, its class, and its format.

**The one law: nothing in the instrument is authored by TDW.** Not a price, not a percentage, not a day-count, not a policy. Every token is filled from a column the vendor owns, from a value she sets once in her own room, or from what she types for this couple. A default named here is a *starting value the vendor may change*, never a value TDW imposes.

### The census is derived, not carried

```
LC_ALL=C; grep -o '{{[a-z0-9_]*}}' docs/specs/TDW_19_CONTRACT_GENERIC_v3.md | sed 's/[{}]//g' | sort -u | wc -l
→ 166
```

Run it before trusting this file. **If the count differs, this register is stale and the mock must not read it.** `LC_ALL=C` is not decoration: without it `sort` and `comm` disagree on ordering and a delta comes back wrong — that happened once at this seat and was caught only because `comm` warned on its own input.

### The three classes

| Class | Meaning | Where the vendor meets it |
|---|---|---|
| **DERIVED** | The product already holds it, or computes it from something it holds. Never asked. **34 tokens.** | Nowhere — it fills itself |
| **PROFILE** | Her standing policy or price. Asked **once**, kept, reused, editable. | Her Contracts settings |
| **PER-CONTRACT** | Specific to this couple and this wedding. Asked each time. | The contract composer |

### Formats

- **`Rs`** — Indian grouping, `Rs 1,25,000`. The letters `Rs`, never the rupee sign. Never `K`, `L` or `Cr`. Never truncated. Whole rupees, as `invoices.amount_total` does.
- **date** `D Mon YYYY` IST · **time** `h:mm am/pm` IST · **pct** whole number, the instrument supplies the `%` · **days / hours / months** whole number · **text** free prose · **one-of** a choice from a stated set.

### SQL provenance

Every DERIVED row names its witness as `PUBLIC_SCHEMA.md:<line>` at base `9235849`. **No column name is authored from memory.** Where a token has no column, the Source cell says so and §8 gathers it.

**⏳ ONE WITNESS IS STALE AT THIS BASE, AND IT IS NAMED RATHER THAN RELIED ON.** `PUBLIC_SCHEMA.md` states its applied ladder tip as `0132`. `db/migrations/0133_guest_leads_and_consent.sql` landed at `9235849` and the snapshot was **not regenerated**, so by that document's own §7 rule it is **STALE for `public.weddings` and `public.leads`.** `0133` only ADDs columns — `weddings.consent_token`, `weddings.consent_sent_at`, `weddings.consent_phone`, `leads.wedding_id` — so **every line this register cites still reads what it read**, and all 39 were re-read at `9235849`. But a reader citing `weddings` from this register must check `db/migrations/` first, exactly as F-09.185 teaches: a document that answers confidently about a table it no longer fully describes is how a handover asserted 18 columns while a migration had made it 20.

---

## 1 · WHO THIS IS BETWEEN — v3 clause 1 and the signature block

| Token | Meaning | Source | Class | Format |
|---|---|---|---|---|
| `vendor_business_name` | Her trading name | `vendors.business_name` · `:1135` | DERIVED | text |
| `vendor_category_words` | Her trade in plain words | From `vendors.category` · `:1136`, mapped to a phrase. **The column has no CHECK at this base**; the mock maps known values and falls back to her own words | DERIVED | text |
| `vendor_address` | Business address | `vendors.address` · `:1181` | DERIVED | text |
| `vendor_city` | Her city — also the jurisdiction at clause 11 | `vendors.city` · `:1138` | DERIVED | text |
| `vendor_signatory_name` | The person signing for the business | No column — §8 | PROFILE | text |
| `vendor_phone` | Her number | Her WhatsApp number on the platform record | DERIVED | phone |
| `partner_1_name` | One of the couple | `clients.name` · `:175` | PER-CONTRACT | text |
| `partner_2_name` | The other | No column — §8 | PER-CONTRACT | text |
| `couple_primary_phone` | The number the contract and the OTP go to | `clients.phone` · `:176` | PER-CONTRACT | phone |
| `agreement_date` | The date of the agreement | The date it is composed | DERIVED | date |

**Retired at v3:** `couple_email` (the notices clause went) · `partner_2_phone` (one couple number signs) · `vendor_signed_date` and `couple_signed_date` (the sealed PDF carries the timestamp; a typed date beside it was a second home for one fact).

## 2 · WHAT WE'RE DOING — v3 clause 2

| Token | Meaning | Source | Class | Format |
|---|---|---|---|---|
| `annexes_attached` | Which annexes form part of this contract | The composer's annex selection | PER-CONTRACT | text list |
| `exclusions` | What is expressly not included | PROFILE default, editable per contract | PROFILE | text |

## 3 · THE DATES — v3 clause 3

*One row per `events` row for this couple; the two shown in the instrument are the template, not a limit.*

| Token | Meaning | Source | Class | Format |
|---|---|---|---|---|
| `function_N_name` | Sangeet, mehendi, ceremony | `events.title` · `:539`, with `events.kind` · `:542` where more precise | PER-CONTRACT | text |
| `function_N_date` | Its date | `events.event_date` · `:540` | PER-CONTRACT | date |
| `function_N_time` | Its start | `events.event_time` · `:541`, or `events.slot` · `:551` | PER-CONTRACT | time |
| `function_N_venue` | Where | No column on `events` — §8 | PER-CONTRACT | text |
| `function_N_city` | Its city | No column on `events` — §8 | PER-CONTRACT | text |

## 4 · MONEY — v3 clause 4 (v1's 5 and 6, merged)

| Token | Meaning | Source | Class | Format |
|---|---|---|---|---|
| `fee_total` | The fee | `invoices.amount_total` · `:646`, or the composer | PER-CONTRACT | `Rs` |
| `fee_breakdown` | What it is made of | `invoices.description` · `:645` | PER-CONTRACT | text |
| `gst_treatment` | Inclusive or exclusive | PROFILE | PROFILE | one-of: `inclusive` · `exclusive` |
| `gst_pct` | The rate | PROFILE | PROFILE | pct |
| `gst_amount` | The tax | Computed | DERIVED | `Rs` |
| `fee_payable_with_gst` | Total payable | Computed | DERIVED | `Rs` |
| `vendor_gstin` | Her GSTIN | `vendors.gstin` · `:1140` | DERIVED | text |
| `deposit_pct` | The share that holds the dates | PROFILE — **default 30, editable** (R-40.37) | PROFILE | pct |
| `deposit_amount` | That share of the fee | Computed; equals `payment_schedules.amount_due` · `:818` at `ordinal` · `:823` = 1 | DERIVED | `Rs` |
| `milestone_N_label` | What it is called | `payment_schedules.milestone_label` · `:816` | PER-CONTRACT | text |
| `milestone_N_pct` | Its share | `payment_schedules.pct` · `:817` | PER-CONTRACT | pct |
| `milestone_N_amount` | Its amount | `payment_schedules.amount_due` · `:818` | DERIVED | `Rs` |
| `milestone_N_due` | When due | `payment_schedules.due_date` · `:819` | PER-CONTRACT | date |
| `vendor_upi_id` | UPI ID | `vendors.upi_id` · `:1139` | DERIVED | text |
| `vendor_account_name` | Account name | `vendors.account_name` · `:1178` | DERIVED | text |
| `vendor_account_number` | Account number | `vendors.account_number` · `:1179` | DERIVED | text |
| `vendor_ifsc` | IFSC | `vendors.ifsc` · `:1180` | DERIVED | text |
| `vendor_base_city` | Where she works from | `vendors.city` · `:1138`; `vendors.service_cities` · `:1177` bounds what counts as outstation | DERIVED | text |
| `travel_terms` | How travel and stay are charged | PROFILE | PROFILE | text |
| `overtime_rate` | Charge beyond agreed hours | PROFILE | PROFILE | `Rs` |
| `overtime_unit` | The unit | PROFILE | PROFILE | one-of: `hour` · `half hour` |
| `meals_provision` | Who feeds the crew | PROFILE | PROFILE | text |
| `late_grace_days` | Grace before a payment is late | PROFILE | PROFILE | days |
| `late_interest_pct` | Monthly interest on overdue | PROFILE | PROFILE | pct |

**Three rules the mock must honour.**

1. **The deposit is milestone 1, not a second concept.** `deposit_pct` and `payment_schedules.pct` · `:817` at `ordinal` = 1 are **one number with one home.** Never a second percentage, never the word "retainer".
2. **The rails are hers.** UPI, account and IFSC print for the couple to pay direct. No pay link, no platform account, no commission (master §7).
3. **Clause 4's GST block is optional and omitted whole** when `vendors.gstin` · `:1140` is null — not greyed, not "N/A", not a zero rate.

**Retired at v3:** `meals_hours` · `late_notice_days` · `late_no_suspend_days` · `withhold_threshold`. Late payment is now one sentence with a fixed "never in the week before a function", so three of the four day-counts had nothing left to parameterise.

## 5 · IF PLANS CHANGE — v3 clause 5 (v1's 7 and 8, merged)

| Token | Meaning | Class | Format |
|---|---|---|---|
| `postpone_notice_days` | Notice to transfer dates | PROFILE | days |
| `postpone_window_months` | How far ahead the transfer may go | PROFILE | months |
| `cancel_tier_1_days` · `cancel_tier_2_days` · `cancel_tier_3_days` | The notice thresholds | PROFILE | days |
| `cancel_tier_1_pct` … `cancel_tier_4_pct` | Payable at each tier | PROFILE | pct |
| `deposit_refundable` | The one-sentence answer | PROFILE | text — one sentence, never a symbol |
| `refund_days` | Days for any refund — clause 5, clause 9, Annex C, Annex F | PROFILE | days |

**Retired at v3:** `repricing_days` — the seasonal-difference sentence no longer sets a clock.

## 6 · WHAT YOU GET — v3 clause 6

| Token | Meaning | Class | Format |
|---|---|---|---|
| `delivery_days` | Days from the last function | PROFILE | days |
| `delivery_method` | How it is handed over | PROFILE | text |
| `link_live_days` | How long a download link lives | PROFILE | days |
| `revision_rounds` | Rounds included | PROFILE | number |
| `revision_rate` | Charge per further round | PROFILE | `Rs` |
| `archive_months` | How long originals are kept | PROFILE | months |

**Retired at v3:** `revision_window_days` · `revision_scope` · `uncollected_days`.

## 7 · THE REST OF THE INSTRUMENT — v3 clauses 7 to 12

| Token | Meaning | Source | Class | Format |
|---|---|---|---|---|
| `takedown_days` | Days to take something down — clause 8, three times | PROFILE | PROFILE | days |
| `vendor_credit_role` | How she is credited on a wedding page | `wedding_credits.role` · `:1203`; vocabulary is R-40.7's ten | DERIVED | one-of: R-40.7's roles |
| `fm_window_months` | Months to find new dates before either party may end it | PROFILE | PROFILE | months |
| `named_professional` | The individual the booking depends on (optional block) | No column — §8 | PER-CONTRACT | text |

**Clause 8 is bound to two columns and writes to neither.** `couples.publish_weddings` · `:388`, default `false`, and `weddings.couple_consent` · `:1235`, default `false`. **Signing must not write either.** The instrument says publication is switched on only by the couple, under the vetoed words "Publish our wedding" (R-40.9). A composer that flipped a consent flag on signature would make the instrument's own sentence false.

**`vendor_city` at clause 11 is the same DERIVED field as §1** — `vendors.city` · `:1138`. **One home.** The jurisdiction is never typed a second time.

**Retired at v3:** `contact_notice_days` · `insurance_cover` · `dispute_talk_days` · `mediator_appointer` · `named_professional_role` · `named_professional_functions`. The mediation ladder and the optional insurance line went with v1's clauses 17 and 14.7; clause 10 names the person and stops.

## 8 · WHAT THE PRODUCT CANNOT FILL YET — **F-40.94**

**F-40.94** was allocated by the chair on 2026-09-05 so that G3.2's DDL is tracked as a finding rather than a paragraph inside a spec. This section is the finding's body; the finding itself is filed in `docs/FINDINGS_LOG.md` by the chair's own cut.

### The bill, re-derived at v3

| | v1 | v3 | |
|---|---|---|---|
| Tokens in the instrument | 202 | **166** | −36 |
| Of those, fillable today (DERIVED) | 37 | **34** | −3 |
| **Tokens with no storage home — F-40.94's bill** | 165 | **132** | **−33** |

*Derived by command at `9235849` under `LC_ALL=C`, not by arithmetic: the DERIVED set is the rows above whose Source cell names a column or a computation, and the bill is the census minus that set.*

**The shrink is real but it is not the shape of the work.** Thirty-three fewer blanks is thirty-three fewer inputs, and it removes not one table. What must still be built:

| Wanted for | Nearest existing home |
|---|---|
| `vendor_signatory_name` | — a vendor-profile column |
| `partner_2_name` | `clients` · head `:169` holds one `name` · `:175` |
| `function_N_venue` · `function_N_city` | `events` · head `:534` has neither; `weddings.venue` · `:1232` and `weddings.city` · `:1233` exist, but the wedding row is created after delivery, not at contract time |
| `named_professional` | No home |
| **Every PROFILE token** across §§2–7 and the annexes | No home at all. This is the `contract_templates.fields` json of master §4 G3.2 |
| **Every annex token** | Same |
| **The signature record** | `contracts` · head `:232` has `signed_at` · `:247` and nothing else — no signer, no digest, no audit trail, against a clause 12 that promises all three |

**The contract plane today is an upload plane.** `contracts` carries `title` · `:240`, `storage_path` · `:241`, `state` · `:245` under `contracts_state_check` · `:1402` (`draft | sent | signed | cancelled`), `sent_at` · `:246`, `signed_at` · `:247`, `notes` · `:244` and four FKs. No body, no `template_id`, no `terms`, no `signer_phone`, no `signature_hash`, no `pdf_url`. The room at `dreamos-pwa app/vendor/(shell)/contracts/screen.tsx` shows a list, an upload sheet taking a title and a PDF, and a detail sheet offering Download, Mark Sent, Mark Signed and Cancel.

**Still not a blocker on use.** v3 is a PDF and the plane stores a PDF. A vendor can upload and send it the day the lawyer says yes, with no schema byte and no new door. F-40.94 is what stops her filling 132 blanks by hand.

## 9 · THE ANNEX FIELDS

All PROFILE or PER-CONTRACT; none DERIVED, because no annex plane exists.

**A — photography and film.** `a_team` `a_coverage_hours` `a_drone` `a_edited_count` `a_photo_format` `a_film` `a_album` `a_teaser_days` `a_selection_days` `a_extras` `a_raw_files` `a_backup_scheme` — *12, from v1's 20*

**B — makeup and hair.** `b_persons` `b_persons_named` `b_looks` `b_artist_name` `b_assistants` `b_trial` `b_product_brands` `b_included` `b_extras` `b_time_per_person` `b_arrival_before` `b_disclosure_days` — *12, from 18*

**C — décor and production.** `c_areas` `c_drawings` `c_drawings_date` `c_approval_date` `c_setup_hours` `c_strike_hours` `c_inventory` `c_damage_basis` `c_security_deposit` — *9, from 11*

**D — planning and coordination.** `d_service_level` `d_scope` `d_own_account_suppliers` `d_pass_through` `d_authority_limit` `d_onday_team` `d_onday_start` `d_onday_end` `d_runsheet_date` `d_runsheet_approval_date` — *10, unchanged*

**E — mehendi.** `e_bride` `e_guests` `e_design_complexity` `e_bride_coverage` `e_guest_design` `e_bride_hours` `e_guest_total_hours` `e_paste_hours` `e_guest_minutes` `e_artist_count` `e_artist_names` `e_patch_days` — *12, unchanged*

**F — venue.** `f_spaces` `f_hours_from` `f_hours_to` `f_music_curfew` `f_capacity` `f_parking` `f_guaranteed_minimum` `f_headcount_date` `f_final_headcount_date` `f_menu_date` `f_deposit_date` `f_inclusions` `f_exclusions` `f_catering` `f_outside_vendor_policy` `f_outside_vendor_charges` `f_venue_licences` `f_couple_licences` `f_per_plate` `f_security_deposit` `f_overstay_rate` — *21, from 22*

**G — other services.** `g_service_name` `g_service_description` `g_functions` `g_hours` `g_start_time` `g_team_count` `g_team_named` `g_deliverables` `g_delivery_method` `g_delivery_trigger` `g_delivery_days` `g_vendor_provides` `g_couple_provides` `g_hired_items` `g_fittings` `g_fittings_count` `g_fittings_location` `g_alteration_rate` `g_special_terms` — *19, from 20*

**Three tokens are new at v3**, all in Annex A, each replacing a cluster: `a_team` (was `a_photographers` + `a_cinematographers` + `a_assistants` + `a_backup_bodies`), `a_film` (was `a_teaser` + `a_teaser_minutes` + `a_full_film` + `a_full_minutes`), and `a_extras`, a named extras line v1 had nowhere. `a_album` survives with `a_album_spec` and `a_album_pages` folded into it.

**Annex G exists by chair answer 3 (2026-09-05)**, covering `designer · jewellery · performer · content_creator` and anything the eleven-value category CHECK names that A–F do not. Witnessed at `couple_bookings_category_check` · `:1437` and `engagements_category_check` · `:1554`, both `planning · designer · photography · makeup · hairstylist · jewellery · decor · venue_catering · performer · content_creator · other`. **`vendors.category` · `:1136` carries no CHECK**, so the annex-selection map is not database-enforced and the mock must not assume it is.

---

## 10 · STATUS

Re-derived at `dream-os @ 9235849` against `TDW_19_CONTRACT_GENERIC_v3.md`. Every DERIVED row names its `PUBLIC_SCHEMA.md` line at that base; nothing is authored from memory. All 39 witness lines were re-read at `9235849` and all 39 resolve.

**`PUBLIC_SCHEMA.md` itself has not moved since `d91ec6e` — and that sentence is true in a way that misleads, which is why it is not left alone.** The *document* is unchanged; the *schema* is not. `0133` landed at `9235849` without a regen, so the snapshot is stale for `weddings` and `leads` (§0). The cure is a PAIR regen, not an edit here.

**2026-09-05 · re-derived against v3 under R-40.43.** Census **202 → 166**: 39 tokens retired, 3 new, each named in the section it left or joined. F-40.94's bill falls **165 → 132**. Every retired token is listed against its own section, so a reader sees what went and why rather than inferring it from a shorter list.

**No byte here is vendor-facing copy**, and no label may be lifted into a surface. The mock reads this for *which* fields exist and *where* they come from; the words a vendor reads are minted at G3.2's mock under the founder's veto.

**This register tracks v3.** When the lawyer answers on v3, it is re-derived again. A register pointing at a superseded instrument is worse than no register, because it is confidently wrong.
