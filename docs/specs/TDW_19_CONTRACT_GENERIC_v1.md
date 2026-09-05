# TDW_19 · THE GENERIC WEDDING-SERVICES CONTRACT · v1

**Status:** DRAFT FOR THE FOUNDER'S LAWYER. Not vendor-facing product copy. Not shipped.
**Seat:** CE-40 · G3.2-pre · Fable-Desk, docs only · 2026-09-05
**Base:** `dream-os @ d91ec6e`
**Rulings this document is drafted under:** R-40.36 (one generic instrument, category clauses as optional annexes) · R-40.37 (deposit 30%, editable) · R-40.38–.39 · R-40.9 (the couple's publication switch, off by default) · R-40.7 (the credit-roll roles) · c-40.20 (this seat's three corrections, owned) · master §7 (the refusals).
**Companion file, same cut:** `docs/specs/TDW_19_CONTRACT_FIELD_REGISTER_v1.md` — every field token below, its meaning, its source column and its format. The lawyer does not need that file; the product does.

---

## VERDICT — v2 · 2026-09-05

**The founder's lawyer has read this instrument and APPROVED it as it stands, as a contract carrying no detrimental liability on the vendor.** No clause was struck, added, reworded or reordered. **This file is therefore v2, and v2 is byte-identical to v1 below this block.** There is no second instrument, because the lawyer moved nothing; a copied file would be a second home for one document.

**This block supersedes four passages below it, which were written before the verdict and are left unrewritten so the record reads in the order it happened.** Where this block and a superseded passage disagree, this block governs.

1. **The Status line above** — no longer "DRAFT FOR THE FOUNDER'S LAWYER … Not shipped." The instrument is **lawyer-passed and cleared for use.** It remains not vendor-facing product copy: see 4 below.
2. **Appendix 2's opening sentence** ("the founder would like the return draft (v2) to answer these seven") — the lawyer returned a **global approval, not seven individual answers.** Appendix 2 stands as the open technical questions, unanswered on the record, and §"WHAT THE APPROVAL DOES NOT COVER" below says what that means.
3. **The closing sentence** ("v2 is the file that comes back from the lawyer") — it came back unchanged, so v2 is this file with this block, at this path.
4. **The closing paragraph's "every byte here is a lawyer's draft"** — read now as *lawyer-passed*. The rest of that paragraph stands unchanged and binds: **no sentence in this file is vendor-facing product copy, none may be lifted into the product, and the product's bytes are minted at G3.2's mock under the copy law's founder veto.** Approval of the instrument is not approval of any surface.

### WHAT THE APPROVAL DOES NOT COVER — stated so the silence is not misread

The verdict recorded is that the contract carries no detrimental liability on the vendor. It is a verdict on the **instrument**, and the following are outside it:

- **Appendix 2's seven questions are not answered.** In particular Q1 (what the clause 18.3 audit record must contain to be admissible, and whether a section 65B certificate is needed), Q3 (the GST block's correctness for a registered and an unregistered vendor) and Q7 (stamp duty in each state a vendor may be in) are technical questions whose answers change what the **product** must store and print, not what this contract says. A global approval does not supply them.
- **Clause 18's mechanism is still not built.** Clause 18.6's paper fallback is the operative path until it is. The approval does not make the flow at 18.2 exist.
- **The blanks are not approved, because they are not filled here.** Every field token in it is the vendor's own number or policy. A cancellation slab or a liability figure a vendor sets is hers, and no verdict on this template reaches it.
- **The annexes are approved as drafted, not as attached.** Which annexes a given contract carries is a per-contract choice, and clause 3.1 governs it.

**A vendor may use this instrument from today**, by uploading it to her Contracts room — the plane already stores a PDF and its state, so this needs no schema byte. The field register's §8 (**F-40.94**) is what G3.2 builds afterwards, to stop her filling the blanks by hand.

---

## HOW TO READ THIS FILE

**It is one instrument, not seven.** Clauses 1–18 apply to every engagement. Annexes A–G are attached only where the service is engaged; an annex not attached is not part of the agreement, and clause 3.1 says so.

**Every number is a blank**, written like `{{deposit_pct}}`. Nothing in this file is a price, a percentage, a date or a day-count that TDW has chosen. The vendor sets each one once, in her own room, and the same values print on every contract she sends thereafter. Where a default is stated it is stated as a default and marked editable.

**Money reads `Rs 1,25,000`.** Indian grouping, the letters `Rs`, and never the rupee sign — not in this file and not in anything generated from it. No `K`, no `L`, no `Cr`, no truncation.

**`[OPTIONAL]` marks a block that is omitted whole** when it does not apply — not greyed out, not marked N/A. A contract for a vendor with no GST registration has no clause 5.2 at all.

### What the lawyer is being asked for

Three things, in this order. First, whether this instrument is enforceable in India as drafted, in particular clause 18's electronic signature. Second, whether any clause is unfair, void or unenforceable against a consumer couple — the cancellation slab at clause 7 and the liability cap at clause 14 are the two the founder is most doubtful of. Third, the seven questions at Appendix 2.

### Two honest statements about the product, so no clause is read as a promise already kept

**The signing mechanism at clause 18 is the agreed design, not shipped behaviour.** At this base the platform's contract plane stores an uploaded PDF and its state (`draft`, `sent`, `signed`, `cancelled`) and nothing else — no signature record, no OTP audit trail, no digest column. The flow described at 18.2 lands at a later phase. Until it does, clause 18.6's fallback is the operative path. This gap is declared here rather than left for a reader to discover.

**The platform is not a party to this agreement.** It transmits the document, and later will seal it. It holds no money, gives no warranty, takes no commission and has no rights in the work. It is named once, at clause 2, and appears again only at 18.5 and 16.2 to say what it does not do.

---

# PART I — THE AGREEMENT

## 1 · PARTIES AND DATE

**1.1** This agreement is made on `{{agreement_date}}` between:

**The Vendor** — `{{vendor_business_name}}`, a `{{vendor_category_words}}` business at `{{vendor_address}}`, `{{vendor_city}}`, acting through `{{vendor_signatory_name}}`, contactable on `{{vendor_phone}}`.

and

**The Couple** — `{{partner_1_name}}` and `{{partner_2_name}}`, contactable on `{{couple_primary_phone}}` and at `{{couple_email}}`.

**1.2** Where this agreement gives the Couple a right or an obligation, either of them may exercise it and either of them may be held to it. An instruction from one is an instruction from both, unless the Couple has told the Vendor in writing that a named person is the only one who may instruct.

**1.3** Both parties are entering this agreement as adults competent to contract under the Indian Contract Act, 1872.

## 2 · WHAT THE WORDS MEAN

**2.1** **The Wedding** — the celebration described at clause 4, taken as a whole.

**2.2** **A Function** — a single occasion within the Wedding: the sangeet, the mehendi, the haldi, the ceremony, the reception, or any other listed at clause 4.1.

**2.3** **The Services** — what the Vendor has agreed to do, described at clause 3 and detailed in the attached Annexes.

**2.4** **The Deliverables** — what the Couple receives afterwards: photographs, films, albums, drawings, or whatever the attached Annex names.

**2.5** **The Deposit** — the amount at clause 6.1. It is the money that holds the dates. There is no separate retainer, booking amount or advance under this agreement: the Deposit is that money, under that one name.

**2.6** **The Balance** — the Fee less the Deposit and less anything already paid.

**2.7** **The Platform** — The Dream Wedding, the service through which this agreement is sent, signed and delivered. **The Platform is not a party to this agreement.** It has no rights under it and owes no obligations under it.

**2.8** **The Wedding Page** — a page on the Platform showing photographs from the Wedding and crediting the people who worked on it. It exists only if the Couple switches it on, and clause 11.3 governs it.

**2.9** **Working Day** — Monday to Saturday, excluding public holidays in `{{vendor_city}}`.

**2.10** **In Writing** — includes WhatsApp and email to the numbers and addresses at clause 1.1, per clause 16.

## 3 · WHAT THE VENDOR WILL DO

**3.1** The Vendor will provide the Services described in the Annexes attached to this agreement and listed here: `{{annexes_attached}}`. **An Annex not attached is not part of this agreement, and no service described in it has been agreed.**

**3.2** The Vendor will bring the skill, care and professional judgment ordinarily expected of a `{{vendor_category_words}}` business of her standing, and will perform the Services herself or through the team described at clause 13.

**3.3 What is not included.** Anything not written in this agreement or an attached Annex is not included. In particular, and without narrowing that sentence: `{{exclusions}}`.

**3.4 Changes.** Either party may propose a change to the Services. A change takes effect only when both have agreed it In Writing **and** the Vendor has stated the price of it In Writing and the Couple has accepted that price. Work already done to the original scope is not undone without a further agreement.

**3.5** The Vendor may decline a request that would require her to work in unsafe conditions, to break the law, or to breach a venue's rules. Declining on any of those grounds is not a breach of this agreement.

## 4 · THE DATES

**4.1** The Vendor is engaged for the following:

| # | Function | Date | Time | Venue | City |
|---|----------|------|------|-------|------|
| 1 | `{{function_1_name}}` | `{{function_1_date}}` | `{{function_1_time}}` | `{{function_1_venue}}` | `{{function_1_city}}` |
| 2 | `{{function_2_name}}` | `{{function_2_date}}` | `{{function_2_time}}` | `{{function_2_venue}}` | `{{function_2_city}}` |
| … | *(rows repeat as needed; a contract with one Function has one row)* | | | | |

**4.2 The dates are the point of this agreement.** From the moment the Deposit is received under clause 6.1, the Vendor holds these dates for this Couple and will not accept another engagement that prevents her from performing them. Before the Deposit is received she holds nothing, and the dates remain open to others.

**4.3** The Vendor will be present and ready to work from the time stated for each Function. If the Function starts late through no fault of the Vendor, the Vendor stays for the hours she agreed, counted from the agreed start time, and clause 5.3's overtime rate applies to anything beyond.

**4.4** A change of date is a postponement and clause 8 governs it. A change of venue within the same city is a change under clause 3.4. A change of city is a postponement.

## 5 · THE FEE

**5.1 The fee.** The total fee for the Services is **`Rs {{fee_total}}`**, made up as follows: `{{fee_breakdown}}`.

**5.2 [OPTIONAL — attach only if the Vendor is registered under GST]**
The fee at 5.1 is **`{{gst_treatment}}`** of Goods and Services Tax. GST at `{{gst_pct}}%` applies, being `Rs {{gst_amount}}`, making the amount payable `Rs {{fee_payable_with_gst}}`. The Vendor's GSTIN is `{{vendor_gstin}}` and she will issue a tax invoice for each payment received. If the rate of GST changes by law before the Wedding, the amount payable changes with it and neither party is in breach.

**5.3 Travel, stay and overtime.**
(a) For any Function outside `{{vendor_base_city}}`, the Couple pays travel and accommodation as follows: `{{travel_terms}}`.
(b) Hours beyond those agreed in the Annex are charged at `Rs {{overtime_rate}}` per `{{overtime_unit}}`, and the Vendor will tell the Couple before the overtime begins wherever it is practical to do so.
(c) Meals for the Vendor's team on a working day are `{{meals_provision}}`.

**5.4 Costs paid to others.** Where the Vendor pays a third party on the Couple's behalf — a printer, a rental, a permission, a hotel — the Couple reimburses the actual amount. The Vendor will show the bill on request and adds no margin to it unless clause 5.1's breakdown says she does and states the margin.

**5.5** All amounts in this agreement are in Indian Rupees.

## 6 · WHAT IS PAID, AND WHEN

**6.1 The Deposit.** The Couple pays a deposit of **`{{deposit_pct}}%` of the fee, being `Rs {{deposit_amount}}`**, on signing this agreement. *(The Vendor sets this percentage; the Platform's default is 30%.)*

**The booking is confirmed when the Deposit is received — not when this agreement is signed.** Until then the Vendor holds no dates for the Couple, and clause 4.2 says the same thing from the other side.

**6.2 The rest.** The Balance is paid as follows:

| # | Milestone | Share | Amount | Due |
|---|-----------|-------|--------|-----|
| 1 | Deposit — on signing | `{{deposit_pct}}%` | `Rs {{deposit_amount}}` | On signing |
| 2 | `{{milestone_2_label}}` | `{{milestone_2_pct}}%` | `Rs {{milestone_2_amount}}` | `{{milestone_2_due}}` |
| 3 | `{{milestone_3_label}}` | `{{milestone_3_pct}}%` | `Rs {{milestone_3_amount}}` | `{{milestone_3_due}}` |
| … | *(rows repeat as needed)* | | | |

The Deposit is milestone 1. It is not additional to the schedule; it is the first line of it.

**6.3 How payment is made.** Payments are made directly to the Vendor:

> UPI: `{{vendor_upi_id}}`
> Account name: `{{vendor_account_name}}`
> Account number: `{{vendor_account_number}}`
> IFSC: `{{vendor_ifsc}}`
> Cash, against a receipt, is also accepted.

**No money under this agreement passes through the Platform.** The Platform does not collect, hold, route or refund any payment, and takes no commission on any amount named here.

**6.4 Late payment.** If a milestone is more than `{{late_grace_days}}` days late, the Vendor may (a) charge interest at `{{late_interest_pct}}%` per month on the overdue amount, and (b) after telling the Couple In Writing and giving them `{{late_notice_days}}` days to pay, suspend work until it is paid. Time lost to a suspension is added to the delivery timeline at clause 9.2. The Vendor will not suspend work within `{{late_no_suspend_days}}` days of a Function; her remedy in that window is interest and clause 6.5.

**6.5 Before delivery.** The Deliverables are handed over after the full fee has been received. Where an Annex names a partial delivery — a preview set, a teaser — that partial delivery is not withheld for payment unless the amount overdue exceeds `Rs {{withhold_threshold}}`.

## 7 · CANCELLATION

**7.1 If the Couple cancels.** The Couple may cancel at any time by telling the Vendor In Writing. The date of that notice is the date of cancellation. The Couple then owes:

| Notice given before the first Function | The Couple pays |
|---|---|
| More than `{{cancel_tier_1_days}}` days | `{{cancel_tier_1_pct}}%` of the fee |
| `{{cancel_tier_2_days}}`–`{{cancel_tier_1_days}}` days | `{{cancel_tier_2_pct}}%` of the fee |
| `{{cancel_tier_3_days}}`–`{{cancel_tier_2_days}}` days | `{{cancel_tier_3_pct}}%` of the fee |
| Fewer than `{{cancel_tier_3_days}}` days | `{{cancel_tier_4_pct}}%` of the fee |

Amounts already paid are set against what is owed. If more has been paid than is owed, the Vendor refunds the difference within `{{refund_days}}` days. If less, the Couple pays the difference within `{{refund_days}}` days.

**7.2 Is the Deposit refundable?** **`{{deposit_refundable}}`.** *(The Vendor states this in one word — "No, the deposit is not refundable" or "Yes, up to the tier at 7.1" — and it is printed here in that form. It is never left to be worked out from the table above.)*

**7.3 If the Vendor cancels.** The Vendor may cancel only for a reason at clause 12 (force majeure), or under clause 6.4 for non-payment, or if performing would be unlawful or unsafe. If she cancels for any other reason she will (a) refund everything the Couple has paid, within `{{refund_days}}` days, and (b) make reasonable efforts to find the Couple an equivalent professional for the same dates at no worse a price, though she does not guarantee she will succeed and is not liable if she cannot.

**7.4** Cancellation does not end clauses 11, 14, 15 or 17, which continue.

## 8 · POSTPONEMENT

**8.1** Weddings move. If the Couple postpones by telling the Vendor In Writing at least `{{postpone_notice_days}}` days before the first Function, the Vendor will transfer the Deposit and everything else paid to new dates within `{{postpone_window_months}}` months, provided she is free on those dates.

**8.2** This transfer is available **once**. A second postponement is treated as a cancellation under clause 7 unless the Vendor agrees otherwise In Writing.

**8.3** If the Vendor is not free on the new dates, the Couple may (a) keep the money on account for `{{postpone_window_months}}` months against any dates she is free for, or (b) treat the postponement as a cancellation under clause 7, at the tier that applies to the date the postponement was notified — not the date of the original Function.

**8.4** If the new dates fall in a higher-priced season under the Vendor's published rates, the difference is payable; if lower, no reduction is due. The Vendor states any such difference In Writing within `{{repricing_days}}` days of the postponement request, before the Couple commits.

**8.5** A postponement caused by an event at clause 12 is governed by clause 12, not by this clause.

## 9 · THE DELIVERABLES

**9.1** The Vendor will deliver what the attached Annexes list, and nothing in this clause adds to or narrows that list.

**9.2 When.** Delivery is within **`{{delivery_days}}` days** of the last Function, unless an Annex states a different period for a particular item, in which case the Annex governs that item. Days lost to clause 6.4 or clause 12 are added to this period.

**9.3 How.** Deliverables are handed over `{{delivery_method}}`. Where they are delivered by a download link, the link stays live for **`{{link_live_days}}` days**, and the Couple is told the date it expires when it is sent.

**9.4 Changes after delivery.** The Couple may ask for `{{revision_rounds}}` round(s) of changes, within `{{revision_window_days}}` days of delivery. A round of changes means `{{revision_scope}}`. Changes beyond that are charged at `Rs {{revision_rate}}` per round.

**9.5 Keeping the originals.** The Vendor keeps the original files for **`{{archive_months}}` months** after delivery and then may delete them. **The Couple should take and keep their own copy.** The Vendor is not a backup service and is not liable for loss of anything after that period, or for loss of a copy in the Couple's own keeping.

**9.6** Where the Couple has not collected or downloaded a Deliverable within `{{uncollected_days}}` days of being told it is ready, the Vendor has done what clause 9.2 requires of her, and clause 9.5's period runs from that date.

## 10 · WHAT THE COUPLE WILL DO

**10.1** Give the Vendor a single named contact for each Function, and that person's phone number, at least `{{contact_notice_days}}` days beforehand.

**10.2** Obtain the venue's permission for the Vendor and her team to work, including any permission needed for equipment, lighting, power, rigging or a drone, and tell the Vendor In Writing of any restriction the venue imposes, as soon as they know of it.

**10.3** Give the Vendor safe access to the spaces she needs, at the times agreed, and reasonable working conditions — including somewhere to keep equipment securely, and power where an Annex says power is needed.

**10.4** Give information, approvals and choices when the Vendor asks for them. Where the Couple's delay pushes a deadline, clause 9.2's period extends by the length of the delay.

**10.5** Where a Function runs more than `{{meals_hours}}` hours, provide meals and drinking water for the Vendor's team, unless clause 5.3(c) says otherwise.

**10.6** Tell the Vendor of anything that affects her safety or her work — a hazard at the venue, a restriction on where she may stand, a person who must not be photographed, a family circumstance she should know of.

**10.7** Treat the Vendor and her team with courtesy. The Vendor may withdraw her team from a Function, without that being a breach, if a member of it is assaulted, threatened, or subjected to harassment, and she will tell the Couple's contact why at the time.

## 11 · THE WORK, ITS CREDIT, AND THE WEDDING PAGE

**11.1 Who owns the work.** The Vendor owns the copyright in everything she creates under this agreement. On payment of the full fee, the Couple receives a **permanent, worldwide, non-exclusive licence to use the Deliverables for their own personal and family purposes** — printing, sharing, framing, posting on their own accounts — for as long as they wish, at no further cost.

**11.2** The Couple may not sell the Deliverables, license them to anyone else, enter them in a competition as their own, or allow them to be used in advertising, without the Vendor's written permission. The Couple may share them with family and friends freely. A guest who receives a photograph receives it on the same personal-use terms.

**11.3 [OPTIONAL — the Vendor's portfolio]**
The Vendor may show the work in her own portfolio, on her website, on her social media and to prospective clients. **The Couple may opt out of this** by telling the Vendor In Writing at any time, and the Vendor will stop using the work in that way within `{{takedown_days}}` days of being told, though she is not required to recall anything already printed or already published by someone else.
**[The whole of 11.3 is omitted if the Couple does not agree to it.]**

**11.4 [OPTIONAL — the Wedding Page]**
The Platform can publish a page for the Wedding, showing selected photographs and crediting the professionals who worked on it.

**This is not switched on by this agreement, and signing this agreement does not switch it on.** It is switched on only by the Couple, in their own account on the Platform, using the setting called **"Publish our wedding"**. That setting is **off unless the Couple turns it on**, and the Couple may turn it off again at any time, for any reason, without asking anyone. When it is turned off the page stops being public within `{{takedown_days}}` days.

Nothing in clause 11.3 or anywhere else in this agreement overrides that setting, and neither the Vendor nor the Platform may publish a Wedding Page while it is off.
**[The whole of 11.4 is omitted if no Wedding Page is contemplated.]**

**11.5 The credit.** Where a Wedding Page is published under 11.4, every professional who worked on the Wedding is credited by their role. The Vendor will be credited as `{{vendor_credit_role}}`, and she will name the others she worked with so they can be credited too. **No one pays to be credited, and no credit is ranked, promoted or placed by payment.**

**11.6 The Couple's own images.** Where the Couple supplies photographs, music, artwork or text for the Vendor to use, the Couple confirms they have the right to let her use it, and will meet any claim that they did not.

**11.7 Faces.** Neither the Vendor nor the Platform will identify a guest by name in anything published under 11.3 or 11.4 without that guest's own agreement. A guest who asks to be removed from a published image will be removed within `{{takedown_days}}` days of the Vendor being told.

## 12 · WHEN NEITHER SIDE IS AT FAULT

**12.1** Neither party is in breach of this agreement, and neither owes the other damages, where performance is prevented by something outside their reasonable control. This includes: an act of God, flood, earthquake, storm or fire; an epidemic, a pandemic, or a public-health restriction; an order, restriction, curfew or prohibition by any government or authority; war, riot, civil unrest or terrorism; a strike or a failure of transport, power or telecommunications that could not reasonably have been worked around; the serious illness or injury of the Vendor or her key team member; and a death in the immediate family of either the Vendor or the Couple.

**12.2 What happens first — the Wedding moves, it does not disappear.** Where an event at 12.1 prevents a Function, the parties will first try to move it under clause 8, and clause 8.2's once-only limit does not apply to a postponement under this clause. Amounts already paid transfer to the new dates.

**12.3 If it cannot be moved.** If, after genuine effort, no new dates can be agreed within `{{fm_window_months}}` months, either party may end this agreement In Writing. On ending:
(a) the Vendor keeps the value of work already done and costs already committed and not recoverable, which she will itemise;
(b) she refunds the rest within `{{refund_days}}` days;
(c) neither party owes the other anything further.

**12.4** Clause 12 is not available to a party who could have performed and chose not to, nor to the Couple where the only difficulty is a change of plan, a change of mind, or a shortage of money.

**12.5** A party relying on this clause tells the other as soon as they reasonably can, and says what they are doing about it.

## 13 · THE TEAM, AND SUBSTITUTION

**13.1** The Vendor may use employees, assistants, freelancers and subcontractors. She stays responsible to the Couple for their work and their conduct as if it were her own.

**13.2 [OPTIONAL — where a named person is the reason for the booking]**
`{{named_professional}}` will personally `{{named_professional_role}}` at `{{named_professional_functions}}`. If illness, injury or an event at clause 12 prevents this, the Vendor will provide a substitute of comparable skill and experience at no extra cost, and will tell the Couple as soon as she knows. If the Couple does not accept the substitute, they may cancel that Function and the Vendor refunds the amount attributable to it, and clause 7's slab does not apply to that refund.
**[Omitted where no individual is named.]**

**13.3** Where no individual is named, the Vendor may allocate her team as she judges best, provided the number of people stated in the attached Annex is present.

**13.4** The Vendor may not assign this agreement as a whole to another business without the Couple's written consent. The Couple may not assign it at all.

## 14 · LIABILITY

**14.1** The Vendor will do her work with reasonable skill and care, and this clause does not reduce that.

**14.2 The cap.** The Vendor's total liability under this agreement, for any and all claims, is limited to **the total fee she has actually received under it**.

**14.3** Neither party is liable to the other for indirect or consequential loss, or for loss of profit, opportunity or reputation.

**14.4 The honest sentence about equipment and media.** Cameras fail, lights fail, cards corrupt and files are lost, and the Vendor cannot promise otherwise. She will use professional equipment, keep backups where her Annex says she does, and work in a way that reduces the risk. If, despite that, some part of the work is lost through equipment or media failure and not through her carelessness, her liability is limited to a fair refund of the part of the fee attributable to what was lost, and clause 14.2's cap still applies.

**14.5** The Vendor is not liable for anything caused by a third party she did not engage, by the venue, by weather, by a guest, or by a restriction imposed on her at the venue that she told the Couple about or that the Couple should have obtained permission for under clause 10.2.

**14.6** Nothing in this clause limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot be limited by law in India.

**14.7 [OPTIONAL]** The Vendor holds professional indemnity and public liability insurance to `Rs {{insurance_cover}}` and will show the certificate on request.

## 15 · PRIVACY AND CONFIDENCE

**15.1** The Vendor will keep the Couple's personal information, their guest list, their addresses, their family circumstances and the details of the Wedding confidential, and will use them only to perform this agreement.

**15.2** The Vendor handles personal data in accordance with the **Digital Personal Data Protection Act, 2023**. She collects only what she needs, keeps it only as long as clause 9.5 and her legal obligations require, and does not sell it or share it for marketing.

**15.3** The Couple may ask the Vendor what personal data she holds about them, ask her to correct it, and ask her to erase it — subject to clause 11.1's licence, to anything she must keep by law, and to anything already published under a consent given at clause 11.

**15.4** The Vendor will not publish or repeat anything told to her in confidence in the course of the work.

**15.5** Where the Vendor uses the Platform to perform this agreement, the Couple's information passes through it for that purpose. The Platform does not sell it, and does not use it to advertise to the Couple.

**15.6** This clause survives the end of this agreement.

## 16 · NOTICES, AND THE REST OF THE MECHANICS

**16.1 How to say something formally.** A notice under this agreement is given In Writing, by WhatsApp or email, and is treated as received when it is delivered.

**16.2 Where to send it.** To the phone numbers and email addresses at clause 1.1 — **or** to the number the Platform holds on its record for that party at the time the notice is sent. A party who changes their number should tell the other, but a notice sent to the number on the Platform's record is good notice even if they did not. This exists so that a changed number does not leave a notice unsent.

**16.3 This is the whole agreement.** This document and its attached Annexes are the entire agreement between the parties about the Wedding. Anything said in conversation, on a call or in a message before signing, and not written here, is not part of it.

**16.4 Changing it.** A change to this agreement is valid only In Writing and agreed by both.

**16.5 If one clause fails.** If any clause is held to be unenforceable, it is severed and the rest of the agreement continues.

**16.6 Waiver.** If a party does not enforce a right on one occasion, that does not stop them enforcing it later.

**16.7 No partnership.** Nothing here makes the parties partners, or makes either the agent or employee of the other.

**16.8 No third-party rights.** No one other than the Vendor and the Couple may enforce this agreement. **This includes the Platform, which is not a party to it.**

**16.9 Counterparts.** This agreement may be signed in counterparts, including electronically, and together they make one agreement.

## 17 · LAW AND DISPUTES

**17.1** This agreement is governed by the laws of India.

**17.2 Talk first.** If a dispute arises, the parties will first try to settle it by discussion in good faith, within `{{dispute_talk_days}}` days of one telling the other In Writing that there is a dispute.

**17.3 Then mediation.** If discussion fails, the parties will refer the dispute to a single mediator at `{{vendor_city}}`, agreed between them or, failing agreement, appointed by `{{mediator_appointer}}`. Each bears its own costs and they share the mediator's fee equally.

**17.4 Then the courts.** If mediation fails, the courts at **`{{vendor_city}}`** have exclusive jurisdiction.

**17.5** Nothing in 17.2 or 17.3 stops either party applying to a court urgently to protect a right that cannot wait.

## 18 · SIGNING

**18.1 Signing electronically.** The parties agree to sign this agreement electronically, and agree that an electronic signature made in the way described below binds them exactly as a signature on paper would. This is done under **section 10A of the Information Technology Act, 2000**, which gives contracts formed by electronic means the same validity as any other contract.

**18.2 How the signature is made.** The Couple receives a link to this agreement on the phone number at clause 1.1. They read it on their own device. A one-time password is sent to that same number. Entering that password and choosing **"I agree"** completes the signature. The Platform then produces a PDF of the agreement as signed, carrying the date and time of signature, both parties' phone numbers, and a SHA-256 digest of the document, and sends that PDF to both parties on WhatsApp.

**18.3 What counts as the signature, and what proves it.** The signature is the affirmative act at 18.2 by a person in possession of the phone number at clause 1.1. The record kept by the Platform — the number, the time, the digest, and the fact of the one-time password being verified — is the evidence of it, and both parties agree it may be produced as such.

**18.4** No Aadhaar-based electronic signature is used, and no digital signature certificate is required. Neither party will later dispute the validity of this agreement on the sole ground that it was signed in the way described at 18.2.

**18.5 The Platform's position.** The Platform transmits this agreement, verifies the one-time password, and keeps the record described at 18.3. It is **not a party to this agreement**, does not advise either party on it, holds no money under it, gives no warranty as to it, and has no liability under it.

**18.6 On paper instead.** Either party may ask to sign on paper rather than electronically, and the other will not refuse. A signed paper copy has exactly the same effect as a signature under 18.2. **Until the mechanism at 18.2 is live on the Platform, this is how this agreement is signed.**

---

**Signed by the Vendor**

`{{vendor_signatory_name}}`, for `{{vendor_business_name}}`
Phone: `{{vendor_phone}}`
Date: `{{vendor_signed_date}}`

**Signed by the Couple**

`{{partner_1_name}}`
Phone: `{{couple_primary_phone}}`
Date: `{{couple_signed_date}}`

`{{partner_2_name}}`
Phone: `{{partner_2_phone}}`
Date: `{{couple_signed_date}}`

**Annexes attached to and forming part of this agreement:** `{{annexes_attached}}`

---

# PART II — THE ANNEXES

*Attach only what is engaged. An annex not attached is not part of this agreement (clause 3.1).*

## ANNEX A — PHOTOGRAPHY AND FILM · [ATTACH ONLY IF ENGAGED]

**A1 · Coverage.** For each Function at clause 4.1: `{{a_coverage_hours}}` hours, starting at the time stated there.

**A2 · The team.** `{{a_photographers}}` photographer(s), `{{a_cinematographers}}` cinematographer(s), `{{a_assistants}}` assistant(s) per Function.

**A3 · Equipment.** Professional cameras and lenses, with `{{a_backup_bodies}}` backup body/bodies on site. Lighting as the Vendor judges necessary. Dual-card recording where the camera supports it.

**A4 · Drone.** `{{a_drone}}`. Where a drone is engaged, it flies only where the law and the venue permit. The Couple obtains the venue's permission under clause 10.2; the Vendor obtains any permission the law requires of the operator. If permission is refused or conditions make flying unsafe, the drone does not fly, no part of the fee is refunded on that ground alone, and this is not a breach.

**A5 · What is delivered.**
(a) `{{a_edited_count}}` edited photographs, colour-corrected, delivered `{{a_photo_format}}`.
(b) `{{a_teaser}}` — a teaser film of about `{{a_teaser_minutes}}` minutes, within `{{a_teaser_days}}` days of the last Function.
(c) `{{a_full_film}}` — a full film of about `{{a_full_minutes}}` minutes.
(d) `{{a_album}}` — an album, `{{a_album_spec}}`, `{{a_album_pages}}` pages, after the Couple approves the layout.
(e) Raw and unedited files: **`{{a_raw_files}}`**. *(The Vendor states plainly whether raw files are given at all, and at what price if they are.)*

**A6 · Selection.** Where the Couple selects images for an album, they select within `{{a_selection_days}}` days of being sent the gallery. Clause 10.4 governs delay beyond that.

**A7 · Music in films.** The Vendor uses licensed or royalty-free music. If the Couple asks for a specific commercial track, the Couple is responsible for any licence it requires, and the Vendor may decline to use it. A film using an unlicensed track is not published under clause 11.

**A8 · Backups.** Files are backed up to `{{a_backup_scheme}}` within `{{a_backup_hours}}` hours of each Function.

**A9** Clause 14.4 applies to everything in this Annex.

## ANNEX B — MAKEUP AND HAIR · [ATTACH ONLY IF ENGAGED]

**B1 · Who is done.** `{{b_persons}}` person(s), being: `{{b_persons_named}}`.

**B2 · How many looks.** `{{b_looks}}` look(s) per person per Function, as listed at clause 4.1.

**B3 · The artist.** The service is performed by `{{b_artist_name}}`, with `{{b_assistants}}` assistant(s). Clause 13.2 governs substitution.

**B4 · Trial.** `{{b_trial}}` — a trial of `{{b_trial_hours}}` hours at `{{b_trial_location}}`, on a date agreed at least `{{b_trial_notice_days}}` days beforehand. `{{b_trial_included}}`.

**B5 · Products.** Professional-grade products are used, `{{b_product_brands}}`. Brushes and tools are sanitised between clients. Disposable applicators are used for lips and eyes.

**B6 · Technique.** `{{b_technique}}` (for example: HD, airbrush, or as the Vendor judges best for the look and the light).

**B7 · What is included and what is not.** Included: `{{b_included}}`. Not included, and charged separately if wanted: `{{b_extras}}` — which may cover hair extensions, hairpieces, draping of the saree or dupatta, nail work, and lashes beyond the first pair.

**B8 · Timing.** The Vendor needs `{{b_time_per_person}}` per person and will arrive `{{b_arrival_before}}` before the Couple's stated ready-by time. The Couple provides a clean, well-lit space with a plug point and a chair at a workable height.

**B9 · Skin, allergies and patch tests.** The Couple tells the Vendor of any allergy, skin condition, recent treatment or medication that affects the skin, before the trial or, if there is no trial, at least `{{b_disclosure_days}}` days before the first Function. **A patch test is available on request and is strongly recommended.** The Vendor is not liable for a reaction to a product where the Couple did not disclose a known condition or declined an offered patch test.

**B10 · Travel.** Clause 5.3(a) applies. Where the Vendor travels between two venues on the same day, `{{b_travel_between}}`.

## ANNEX C — DÉCOR AND PRODUCTION · [ATTACH ONLY IF ENGAGED]

**C1 · Scope.** Décor for: `{{c_areas}}`, at the Functions listed at clause 4.1.

**C2 · Design and approval.** The Vendor provides `{{c_drawings}}` drawings or renders by `{{c_drawings_date}}`. The Couple approves In Writing by `{{c_approval_date}}`. **After approval, a change is a change under clause 3.4 and is priced before it is made.** The rendered image is an impression of the design, not a photograph of the finished setup; the finished setup will differ in detail.

**C3 · Site survey.** A site survey at `{{c_survey_venues}}` on `{{c_survey_date}}`, which the Couple arranges access for under clause 10.2.

**C4 · Setup and strike.** Setup begins `{{c_setup_hours}}` hours before the Function and the Couple secures the venue's agreement to that access. The Vendor strikes and clears within `{{c_strike_hours}}` hours after it ends. Where the venue restricts either window and the Vendor was not told before the price was set, clause 3.4 applies.

**C5 · What is owned and what is hired.** Items marked hired in `{{c_inventory}}` return to the Vendor or her supplier after the Function. Items marked purchased remain with the Couple. Nothing not listed becomes the Couple's property.

**C6 · Flowers.** Flowers are a natural product and their availability, colour and size vary by season, by market and by the day. **The Vendor may substitute a flower of equivalent quality, colour and value without asking**, and will tell the Couple where the substitution is significant. This is not a breach and is not a ground for a reduction.

**C7 · Power, rigging and safety.** The Couple secures the venue's permission for power load, rigging points, open flame and anything else the design requires, under clause 10.2, and tells the Vendor of any restriction as soon as they know of it. Where the venue refuses a permission after the design is approved, the Vendor will offer the nearest workable alternative and clause 3.4 prices it.

**C8 · Damage and breakage.** The Couple is responsible for damage to the Vendor's hired or owned items caused by the Couple, their guests or their other suppliers, at `{{c_damage_basis}}`. Ordinary wear is not damage. The Vendor is responsible for damage she or her team causes to the venue.

**C9 · Deposit for hired items.** `{{c_security_deposit}}`, refundable within `{{refund_days}}` days of the items being returned undamaged.

## ANNEX D — PLANNING AND COORDINATION · [ATTACH ONLY IF ENGAGED]

**D1 · Level of service.** `{{d_service_level}}` — full planning, partial planning, or on-day coordination, as stated here and detailed at D2.

**D2 · What is included.** `{{d_scope}}`.

**D3 · How other suppliers are engaged.** **The Vendor engages other suppliers as the Couple's agent, in the Couple's name, and the Couple contracts directly with each.** The Vendor is not liable for another supplier's default, delay or bad work unless she contracted with that supplier in her own name and on her own account, in which case she is.
**[Where the Vendor does contract in her own name for a particular supplier, name that supplier here: `{{d_own_account_suppliers}}`.]**

**D4 · Money.** The Vendor may commit up to `Rs {{d_authority_limit}}` on the Couple's behalf without asking each time. Above that, she asks first, In Writing. She does not hold the Couple's money; payments to suppliers are made by the Couple direct, unless D5 says otherwise for a named item.

**D5 · Where the Vendor does pay a supplier.** `{{d_pass_through}}`. Clause 5.4 governs it.

**D6 · The team on the day.** `{{d_onday_team}}` coordinator(s) present from `{{d_onday_start}}` to `{{d_onday_end}}` at each Function.

**D7 · The run-sheet.** The Vendor issues a run-sheet by `{{d_runsheet_date}}`. The Couple approves it In Writing by `{{d_runsheet_approval_date}}`. The approved run-sheet is what the Vendor works to.

**D8 · Decisions on the day.** Where a decision cannot wait and the Couple's contact under clause 10.1 cannot be reached, the Vendor may decide in the Couple's best interests, and is not liable for a reasonable decision made that way.

## ANNEX E — MEHENDI · [ATTACH ONLY IF ENGAGED]

**E1 · Who is done.** `{{e_bride}}` and `{{e_guests}}` guest(s).

**E2 · The design.** `{{e_design_complexity}}` — for the bride, covering `{{e_bride_coverage}}` (for example, hands to elbow and feet to mid-calf), taking about `{{e_bride_hours}}` hours. Guests receive `{{e_guest_design}}`, for `{{e_guest_minutes}}` minutes each, within a total of `{{e_guest_total_hours}}` hours.

**E3 · The artist.** `{{e_artist_count}}` artist(s), being `{{e_artist_names}}`.

**E4 · The cone.** The Vendor uses **natural henna cones, prepared fresh, containing henna, essential oil, sugar and lemon and nothing else.** She does **not** use black henna or any cone containing PPD (para-phenylenediamine), and will say so to any guest who asks.

**E5 · Stain — what to expect, honestly.** Henna stains differently on every person. Colour depends on body heat, skin, how long the paste is left on, aftercare and the weather. The Vendor gives written aftercare instructions and will tell the Couple what to expect. **She cannot guarantee a particular shade or a particular depth of colour, and a lighter stain than hoped for is not a defect and not a ground for a refund.**

**E6 · Aftercare.** Paste is left on for at least `{{e_paste_hours}}` hours. The Couple follows the aftercare given. Where they do not, E5 applies with more force.

**E7 · Patch test.** Available on request, at least `{{e_patch_days}}` days beforehand, and recommended for anyone who has not had henna before or who has sensitive skin. Clause B9's last sentence applies here too.

**E8 · Conditions.** The Couple provides good light, comfortable seating for the artist at a workable height, a footrest where feet are being done, and somewhere the bride can sit still without being moved.

**E9 · Overtime.** Guests beyond `{{e_guests}}`, or time beyond `{{e_guest_total_hours}}`, are charged under clause 5.3(b).

## ANNEX F — VENUE · [ATTACH ONLY IF ENGAGED]

**F1 · What is hired.** `{{f_spaces}}`, on the dates and for the hours at clause 4.1, specifically `{{f_hours_from}}` to `{{f_hours_to}}`.

**F2 · Capacity.** Up to `{{f_capacity}}` guests. The Couple tells the Vendor the expected number by `{{f_headcount_date}}`, and the final number by `{{f_final_headcount_date}}`.

**F3 · What is included.** `{{f_inclusions}}` — which may cover tables, chairs, basic lighting, power to a stated load, parking for `{{f_parking}}` cars, staff, cleaning and washrooms.

**F4 · What is not.** `{{f_exclusions}}`.

**F5 · [OPTIONAL] Catering.** `{{f_catering}}`. Where catering is by the venue, the menu is agreed by `{{f_menu_date}}` and priced per plate at `Rs {{f_per_plate}}`, charged on the guaranteed minimum of `{{f_guaranteed_minimum}}` or the final number, whichever is higher.

**F6 · Outside suppliers.** The Couple's other suppliers may work at the venue subject to `{{f_outside_vendor_policy}}`. Any royalty or access charge is `{{f_outside_vendor_charges}}` and is stated here rather than raised later.

**F7 · Licences.** The venue holds `{{f_venue_licences}}`. The Couple is responsible for `{{f_couple_licences}}` — which may include music performance rights, a liquor permit, and any permission for fireworks or open flame. Where a licence is not obtained, the venue may stop that activity, and this is not a breach by either party.

**F8 · Noise and closing time.** Amplified music stops at `{{f_music_curfew}}` as the law or the venue requires. The Vendor will enforce this and the Couple will not ask her not to.

**F9 · Security deposit.** `Rs {{f_security_deposit}}`, payable by `{{f_deposit_date}}`, refundable within `{{refund_days}}` days after the Function, less the cost of any damage, of any overstay beyond F1's hours at `Rs {{f_overstay_rate}}` per hour, and of any cleaning beyond the ordinary.

**F10 · Cancellation.** Clause 7 applies, with the venue's own slab at `{{f_cancellation_slab}}` where it differs and is stated here.

## ANNEX G — OTHER SERVICES · [ATTACH ONLY IF ENGAGED]

*This annex covers a service that Annexes A–F do not — for example a designer or couturier, a jeweller, a performer or a content creator. It is deliberately short and generic; where the service needs terms this annex does not carry, they are added at G7 rather than assumed.*

**G1 · The service.** `{{g_service_name}}` — `{{g_service_description}}`.

**G2 · Where and when.** At the Functions listed at clause 4.1, specifically `{{g_functions}}`, for `{{g_hours}}` hours each, from `{{g_start_time}}`.

**G3 · The team.** `{{g_team_count}}` person(s), being `{{g_team_named}}`. Clause 13 governs substitution.

**G4 · What is delivered.** `{{g_deliverables}}`, delivered `{{g_delivery_method}}` within `{{g_delivery_days}}` days of `{{g_delivery_trigger}}`.

**G5 · Materials and equipment.** The Vendor provides `{{g_vendor_provides}}`. The Couple provides `{{g_couple_provides}}`. Items hired rather than sold are listed at `{{g_hired_items}}` and return to the Vendor afterwards; Annex C8 applies to damage to them.

**G6 · Fittings, rehearsals or trials.** `{{g_fittings}}` — `{{g_fittings_count}}` session(s) at `{{g_fittings_location}}`, on dates agreed at least `{{g_fittings_notice_days}}` days beforehand. Alterations after the final fitting are charged at `Rs {{g_alteration_rate}}`.

**G7 · Terms particular to this service.** `{{g_special_terms}}`.

---

# APPENDIX 2 — NOTES FOR THE LAWYER

The founder would like the return draft (v2) to answer these seven, marked in the margin against the clause each concerns.

**Q1 · Clause 18 — the electronic signature.** Is a one-time password sent to a phone number, followed by an affirmative "I agree", a valid signature for a contract of this kind in India? Section 10A of the IT Act, 2000 is relied on. Should this be described as an *electronic signature* under section 3A, or only as a contract *formed by electronic means* under section 10A — and does the difference matter for proof? What exactly must the audit record at 18.3 contain to be admissible under section 65B of the Evidence Act (now the Bharatiya Sakshya Adhiniyam, 2023), and does anyone need to sign a section 65B certificate? Is a wet-signature fallback needed permanently, or only until the mechanism is live?

**Q2 · Clause 7 — the cancellation slab.** Is a graduated forfeiture of this kind enforceable against a consumer couple, or is it liable to be read down as a penalty under section 74 of the Contract Act? Should the slab be recast as *the vendor's genuine pre-estimate of loss*, and if so, should the contract say so on its face and record how each tier was arrived at? Does the Consumer Protection Act, 2019 and the unfair-contract-terms jurisprudence under it put a ceiling on any of these tiers?

**Q3 · Clause 5.2 — the GST block.** Is the optional block correct for both cases — a vendor registered under GST, and one below the threshold and not registered? Is the switch at `{{gst_treatment}}` (inclusive or additional) the right way to express it? What must a tax invoice carry that this contract should therefore not contradict? And is the "if the rate changes by law" sentence sound?

**Q4 · Clause 14 — the liability cap.** Is a cap at the fee received enforceable? Is 14.4's equipment-and-media sentence enforceable, or does it try to exclude liability for the very thing the couple is paying for? Is 14.6's carve-out drafted widely enough for Indian law?

**Q5 · Clause 11 — the credit roll and the wedding page.** Clause 11.4 makes publication depend on a switch in the couple's own account, off by default, withdrawable at any time. Clause 11.5 credits every professional who worked on the wedding, by role. Does 11.5 need its own consent from the couple, or does 11.4's switch cover it? Does the vendor need consent from *other vendors* to name them in a credit — and if so, should this contract carry a clause obliging her to obtain it? What does clause 11.7 need to say for a guest's image to be published lawfully?

**Q6 · Clause 15 — data protection.** Under the DPDP Act, 2023, is the vendor a Data Fiduciary in respect of the couple's and the guests' data? What notice and consent must she give and obtain, and does any of it need to appear in this contract rather than in a separate notice? Where the platform processes the data on her behalf, what must the vendor–platform arrangement contain, and does this contract need to say anything about it beyond clause 15.5?

**Q7 · Stamp duty.** Is a services agreement of this kind chargeable with stamp duty in any Indian state a vendor is likely to be in — Delhi, Maharashtra, Karnataka, Punjab, Haryana, West Bengal, Tamil Nadu? If it is, what is payable, who pays it, and does an electronically signed contract change the answer? If it is chargeable and unstamped, what is the consequence for enforceability?

**One request beyond the seven.** Where a clause is drafted more heavily than it needs to be, the founder would rather have it lighter. This document is read on a phone by a couple planning a wedding. Plain sentences beat complete ones.

---

## PROVENANCE AND STATUS

Drafted at `dream-os @ d91ec6e` by the CE-40 G3.2-pre docs seat, on the outline ratified by the chair on 2026-09-05, with the chair's four answers and three clause changes applied: clause 4.2 turns on receipt of the deposit rather than on signature (agreeing with 6.1); clause 11.4 names the couple's switch in the vetoed words "Publish our wedding"; clause 16.2 allows notice to the number on the Platform's record.

**Every byte here is a lawyer's draft.** No sentence in this file is vendor-facing product copy, and none may be lifted into the product. The product's bytes are minted at G3.2's mock from the vetted v2, under the copy law's founder veto.

**v2 is the file that comes back from the lawyer**, dated, from this same seat, and it is v2 — not this — that a vendor uploads to her Contracts room.
