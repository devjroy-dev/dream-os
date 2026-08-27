# TDW_19 P0-A LEDGER — GOOGLE BUSINESS PROFILE API ACCESS + META TEMPLATE APPROVALS

**Opened:** 2026-08-28
**Seat:** founder (console actions; no LE seat can take them)
**Governing kickoff:** CE-38, TDW_19 P0-A
**Artifact class:** fill-in ledger. The zero-placeholder law binds test blocks, SQL, and curl fixtures; it does not bind this file (F-19.05, exception granted CE-38). Blank fields below are the work, not a defect.

**State:** OPEN — becomes SEALED when the GBP approval date and both template approval dates are recorded here.

---

## RULINGS APPLIED AT OPEN

| Id | Ruling |
|---|---|
| F-19.01 | Neither template body may end on a variable. Both bodies below end on text; the link rides the button. |
| F-19.02 / R-19.1 | Meta's dynamic URL button is `static base + one appended variable`. No Google `g.page/r/<id>/review` link and no per-vendor subdomain can be expressed in that shape. Two first-party redirects are therefore owed at P1: `thedreamwedding.in/r/{code}` → 302 to the vendor's Google review URL, and `thedreamwedding.in/v/{code}` → the vendor storefront. The per-vendor short code has exactly one home and is the same derivation §2 already owes on the public storefront route — P1 inherits it as a named seam. |
| F-19.03 | The `VENDOR_PHONE_NUMBER_ID` derive is struck from Part B. Template approval is WABA-scoped; the PNID binds at P1 send-time only. |
| F-19.04 | The business name and address submitted in the GBP use-case text are read off the verified Business Profile itself, never typed from memory. |
| F-19.05 | Recorded above. |
| F-19.06 | CLOSED by demonstration at the create screen, 2026-08-28. A URL call-to-action and a quick reply coexist in one template; Meta's own preview rendered both. B2's two-button shape is chosen, not constrained. |
| F-19.07 | Meta's classifier reclassified BOTH templates to MARKETING before submission and both were approved as MARKETING. ONE P1 condition follows (opt-out gating) plus TWO open questions (cost, throttling) — see AMENDMENT 1 as amended by AMENDMENT 2. |
| F-19.09–F-19.13 | Filed during the Part A walk, 2026-08-28 — see AMENDMENT 3. |
| F-19.08 | B2's quick reply is type `Custom`, not Meta's built-in opt-out. Meta forwards the tap as an inbound message and takes no action itself. A handler and a suppression flag are owed at P1 before the P4 cron fires once — see AMENDMENT 1. |

---

## PART A · GOOGLE BUSINESS PROFILE API ACCESS

### A1 · Prerequisites — all true before the form opens

| # | Prerequisite | Witness | Status |
|---|---|---|---|
| 1 | Verified, complete GBP for The Dream Wedding, **60+ days old** | Maps shows "You manage this Business Profile" | **PARTIAL** — created and verified 2026-08-28. Age requirement NOT met; earliest eligible ≈ 2026-10-27. See AMENDMENT 3. |
| 2 | `thedreamwedding.in` live with a visible privacy page naming Google account data | `/privacy` renders; paragraph present | **PARTIAL** — page renders, DPDP-complete, but names no Google data. Paragraph owed (F-19.13). |
| 3 | Submitting email on the website domain and an owner/manager of the GBP above | not a gmail.com address | **MET (domain)** — `dev@thedreamwedding.in`, Google identity on the domain; `hello@` is an alias into the same mailbox. Owner/manager listing NOT yet witnessed. |
| 4 | Google Cloud project under a Cloud Organization (not "No organization") | IAM & Admin → Manage Resources | **MET** — org `thedreamwedding.in`, ID `970665222370`. |
| 5 | Project Number captured (numeric, not the ID) | Console → Dashboard → Project info | **MET** — `214847546988`. |

### A2 · Values derived, not typed (F-19.04)

| Field | Value |
|---|---|
| Business name, verbatim from the GBP | `The Dream Wedding` |
| Address / service area, verbatim from the GBP | **No public street address.** Service-area business; verification address is private and not displayed. A3's address line therefore uses the registered address published on the privacy page: `9/1506, Lotus Boulevard, Sector 100, Noida, Uttar Pradesh, India` (F-19.11). |
| Primary category on the GBP | `Software company` |
| Business Profile ID | `01598190128077173643` |
| Profile verified on | 2026-08-28 (instant; no postcard) |
| Google Cloud Organization | `thedreamwedding.in` · `970665222370` |
| Project name / ID | `tdw-business-solutions` |
| Project Number | `214847546988` |
| Submitting email | `dev@thedreamwedding.in` |
| Railway backend host (for the OAuth redirect) | NOT DERIVED — owed before A-5 |
| OAuth redirect URI submitted | `https://<host>/api/v2/vendor/solutions/google/callback` |

### A3 · Submission record

| Field | Value |
|---|---|
| Date submitted | **NOT SUBMITTED** — blocked on the 60-day profile age. Date certain ≈ 2026-10-27. |
| Application type | Application for Basic API Access |
| Confirmation screenshot path | |
| Follow-up email received (date) | |

### A4 · Approval record

| Field | Value |
|---|---|
| Approval email date | |
| Quota screenshot path (Console → APIs & Services → Quotas) | | 
| Approval test, from Google's Prerequisites page verbatim | 0 QPM = not approved · 300 QPM = approved |
| Eight APIs enabled (date) — Account Management, Business Information, Lodging, Place Actions, Notifications, Verifications, Performance, legacy `mybusiness` v4 | |

Q&A API is retired (Nov 2025); nothing in the P1 spec depends on it. Recorded so no later sitting goes looking for it.

### A5 · Environment (Railway) — mark SET/UNSET, never paste values here

| Var | State |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | UNSET |
| `GOOGLE_OAUTH_CLIENT_SECRET` | UNSET |

Consent screen: external. Scopes at P1: `business.manage`. Scopes deferred to P3: `siteverification`, `webmasters.readonly`.

---

## PART B · META WHATSAPP TEMPLATE APPROVALS

Submitted under WABA-DIRECT `1739793260373677`. Category intent UTILITY for both; if Meta reclassifies, the approved category is recorded as approved and not contested.

**Verify at the create screen before pasting (R-19.1):** the URL-button editor shows the exact base + suffix shape it accepts. If the shape differs from what is recorded here, stop and file — do not adapt the body to fit.

### B1 · `tdw_review_request`

| Field | Value |
|---|---|
| Category submitted | UTILITY — reclassified to MARKETING by Meta's classifier at the create screen, accepted by the founder (F-19.07) |
| Category approved | **MARKETING** |
| Language | en |
| Template ID | `1713996623186968` |
| Date submitted | 2026-08-28 |
| Status | APPROVED — `Active – Quality pending` |
| Date approved | 2026-08-28 |
| Rejection reason (if any) | none |

Body as submitted:

```
Hi {{1}}, thank you for choosing {{2}} for your wedding. If you have a minute, a Google review would mean a lot to them.
```

Button as submitted: URL, "Write a Review", base `https://thedreamwedding.in/r/`, dynamic suffix `{{1}}`.

Body as APPROVED, verbatim — **this is the constant**:

```
Hi {{1}}, thank you for choosing {{2}} for your wedding. If you have a minute, a Google review would mean a lot to them.
```

Button as APPROVED, verbatim: URL · button text `Write a Review` · base `https://thedreamwedding.in/r/` · dynamic suffix `{{1}}`.

Byte note: the approved button text is `Write a Review` (capital R). The pre-submission draft in this ledger read `Write a review`. Meta has locked the capitalised form; it is the byte, and P1 authors from here.

### B2 · `tdw_referral_invite`

| Field | Value |
|---|---|
| Category submitted | UTILITY — reclassified to MARKETING, accepted (F-19.07) |
| Category approved | **MARKETING** |
| Language | en |
| Template ID | `1557978505339198` |
| Date submitted | 2026-08-28 |
| Status | APPROVED — `Active – Quality pending` |
| Date approved | 2026-08-28 |
| Rejection reason (if any) | none |

Body as submitted:

```
Hi {{1}}, {{2}} hopes your celebration went beautifully. If a friend is planning a wedding, you can share their page.
```

Buttons as submitted: URL, "Share", base `https://thedreamwedding.in/v/`, dynamic suffix `{{1}}` · Quick reply, "Stop messages".

Body as APPROVED, verbatim — **this is the constant**:

```
Hi {{1}}, {{2}} hopes your celebration went beautifully. If a friend is planning a wedding, you can share their page.
```

Buttons as APPROVED, verbatim, in render order:

1. URL · button text `Share` · base `https://thedreamwedding.in/v/` · dynamic suffix `{{1}}`
2. Quick reply · type `Custom` · button text `Stop messages`

The quick reply survived alongside the CTA — F-19.06 closed. It carries no Meta-side behaviour (F-19.08).

### B3 · `hi` variants

Deferred. Not owed for P1 seal. Record here if and when filed.

---

## PART C · SEAL

P0-A is **OPEN** on this file existing in the tree with both submission dates recorded.

P0-A is **SEALED** when all three land:

- [ ] GBP approval date recorded (A4) — BLOCKED: application not submitted; 60-day profile age clears ≈ 2026-10-27 (AMENDMENT 3)
- [x] `tdw_review_request` approved body verbatim recorded (B1) — 2026-08-28
- [x] `tdw_referral_invite` approved body verbatim recorded (B2) — 2026-08-28

Block 19 P1 charters against the sealed ledger. A chair opening P1 against an unsealed one is routing around a withheld condition (§0.2).

At P1 the approved bodies become the constants in `src/wa/templates/*` — one home, authored from this ledger, never from memory. R-19.1's two redirect routes are owed in the same sitting.

---

## AMENDMENT 1 — 2026-08-28 · PART B SEALED; MARKETING CONSEQUENCES FILED

Labeled amendment, in place, reasoning at site. No line above was removed; blank fields were filled and three ruling rows added.

Both templates approved 2026-08-28 as **MARKETING**, not UTILITY. The kickoff pre-authorised accepting Marketing for B2 only; B1's reclassification was ruled on by the founder at the create screen and accepted. `Active – Quality pending` is the ordinary post-approval state — the template is live and sendable; quality rating accrues once traffic exists.

### Why MARKETING is not a relabel

Three consequences follow. None blocked submission. **As amended by AMENDMENT 2: only the first binds P1 as a condition; the other two are open questions.**

**1 · Opt-out gating is now mandatory, not optional.** Marketing sends respect a per-recipient marketing opt-out. The P1 cron cannot fire `tdw_review_request` blind at `event end + 3 days`, and the P4 cron cannot fire `tdw_referral_invite` blind at `event ended > 30 days`. Both must read a suppression flag first. Firing past an opt-out burns quality rating on exactly the people who asked us to stop.

**2 · Cost.** Marketing is materially dearer per message than Utility on the India rate card. At the 200–500 vendor scale stated in A3 this is a line item, not a rounding error. The rate is not recorded here because it is Meta's to change; derive it from Insights → the cost cards on each template's page before P1 sizes anything.

> **AMENDED 2026-08-28 (AMENDMENT 2) — this is an OPEN QUESTION, not a condition.** The seat asserted the cost differential without reading a rate card. No derive stands behind it. It binds nothing on P1 until a founder-seat read of Meta Insights fills the number in.

**3 · Throttling.** Marketing volume sits under messaging limits and quality-based throttles that Utility largely escapes. A P1 cron that batches sends must tolerate being throttled rather than treating a throttle as an error.

> **AMENDED 2026-08-28 (AMENDMENT 2) — the premise is an OPEN QUESTION; the instruction stands.** The Marketing-versus-Utility throttle difference was not witnessed by this sitting. The instruction it produced — a batching cron tolerates throttles rather than erroring on them — is sound in either category and survives on its own merits.

### The Stop button owes code (F-19.08)

B2's `Stop messages` is a `Custom` quick reply. Meta forwards the tap to our webhook as an inbound message and does nothing else — no suppression, no state, no acknowledgement. As shipped it is a correctly-worded promise with nothing behind it.

P1 owes, before the P4 cron fires once:

- an inbound handler that recognises the `Stop messages` button payload on the vendor lane;
- a suppression flag with **one home**, written by that handler;
- the same flag read by both crons (consequence 1 above).

If Meta also appends its own opt-out to a MARKETING send, there are then two stop paths. Both must write that one flag. Two flags is the disease.

### Send-shape note carried to P1

Meta's sample field took the **full URL** (`https://thedreamwedding.in/r/k7m2qp`). The API parameter at send time is the **suffix only** (`k7m2qp`). Sending the full URL as the parameter yields `https://thedreamwedding.in/r/https://thedreamwedding.in/r/k7m2qp`. Two shapes, one variable — named here so P1 inherits it rather than discovering it.

R-19.1's two redirect routes (`/r/{code}`, `/v/{code}`) and the single-home per-vendor short code remain owed at P1. Until they exist, both approved templates point at 404s.

### Observed, not acted on

Meta's console advertises the Marketing Messages API (formerly MM Lite) as improving marketing delivery over Cloud API. Now that both templates are MARKETING this is a live P1 send-path question. It is recorded as an open question, not a decision — nothing in Block 19 charters against it and no derive was performed.

### Part B state

**SEALED.** Both templates approved, both bodies and button sets recorded verbatim above. Part A remains OPEN; the ledger as a whole is therefore OPEN.

---

## AMENDMENT 2 — 2026-08-28 · F-19.07 RESTATED · TWO LEGS DEMOTED TO OPEN QUESTIONS

Labeled amendment, in place, reasoning at site. Nothing removed. AMENDMENT 1's text stands as written; three sites inside it now carry a supersession note, and F-19.07's row in the rulings table is restated to match. A reader arriving at any of the four sites learns of this amendment there, without reaching the end of the file.

### What changed and why

CE-38 ruled on the seat's own disclosure that F-19.07's three legs did not have equal derives behind them.

**Consequence 1 — opt-out gating — remains a CONDITION on P1.** It follows from what the console showed. Meta's classifier moved both templates to MARKETING precisely because their content is promotional, and MARKETING sends honour a per-recipient opt-out. Both crons read the suppression flag before firing, or they do not fire.

**Consequence 2 — cost — becomes an OPEN QUESTION.** The seat asserted that Marketing is materially dearer than Utility on the India rate card without reading one. Directionally it is the seat's understanding; it is not a derived fact, and an undived claim does not get to bind a charter. It binds nothing until a founder-seat read of Meta Insights → the cost cards on each template's page produces a number. Filed here when he does it.

**Consequence 3 — throttling — becomes an OPEN QUESTION, but its instruction survives.** The claim that MARKETING volume is throttled differently from UTILITY was not witnessed by this sitting. The instruction it produced — a batching cron tolerates being throttled rather than treating a throttle as an error — is correct in either category, because any WhatsApp send path sits under messaging limits. P1 builds to the instruction; P1 does not build to the premise.

### The distinction being drawn

A finding that names what the console showed is a condition. A finding that names what the seat believes is an open question. Both belong in the ledger; only the first binds a charter. The seat disclosed which legs were which unprompted, and that disclosure is the reason this amendment exists rather than a P1 sitting building against an unverified rate card.

### P1 inheritance after this amendment

| Item | Class | Source |
|---|---|---|
| Opt-out suppression flag read by both crons | CONDITION | F-19.07 c1 |
| `Stop messages` inbound handler + one-home suppression flag | CONDITION | F-19.08 |
| Two redirect routes `/r/{code}`, `/v/{code}` + one-home short code | CONDITION | R-19.1 |
| Send parameter is the suffix, never the full URL | CONDITION | AMENDMENT 1, send-shape note |
| Batching cron tolerates throttles rather than erroring | INSTRUCTION | F-19.07 c3, premise struck |
| Marketing-vs-Utility rate differential | OPEN QUESTION | F-19.07 c2 — owes a founder-seat Insights read |
| Marketing-vs-Utility throttle differential | OPEN QUESTION | F-19.07 c3 |
| Marketing Messages API as the P1 send path | OPEN QUESTION | AMENDMENT 1, observed-not-acted-on |

P1 charters against this table, not against the kickoff's text. Where the two disagree — the UTILITY category assumption above all — the ledger governs (CE-38, this sitting).

---

## AMENDMENT 3 — 2026-08-28 · PART A WALKED · PROFILE CREATED · APPLICATION BLOCKED ON AGE

Labeled amendment, in place, reasoning at site. Part A's tables above are filled from a live guided walk; every value was read off the founder's screen, none typed from memory (F-19.04).

### What was created tonight

A Google Business Profile for The Dream Wedding did not exist. It does now, created and verified 2026-08-28 in one sitting, no postcard step. Category `Software company` — chosen over the kickoff's suggested `Wedding planner` because TDW sells vendor software and a category that disagrees with the application is what stalls a legitimacy review. Service-area business, no public street address. Hours set seven days. Description authored to match A3's account of the business, with no persona names and no claims about scale.

The Cloud side was already in place: an Organization on `thedreamwedding.in` existed, so no Cloud Identity detour was needed. Project `tdw-business-solutions` created under it today.

### Why the application was NOT submitted

Google's Prerequisites page, read at origin, states the requirement as a threshold: a Business Profile **verified and active for 60+ days**. The profile is hours old. The page also states that a rejected application should be corrected and re-applied, and that a follow-up email follows review either way — it does not describe a stage at which supporting documents are requested.

The founder proposed submitting now and supplying registration documents if asked. The seat's counter, and the ruling: no document ages a profile. Incorporation or Udyam registration proves TDW is a real business, which is not what the 60-day rule tests. The rule tests track record, and only time supplies it.

**Ruled by the founder: wait. Submit after the profile clears 60 days — earliest ≈ 2026-10-27.**

### The client-profile route, recorded for completeness

Google's same sentence permits the qualifying profile to belong to "one of the clients they manage." This is a real alternative route and would unblock the application immediately. It requires a vendor with a Business Profile already verified and 60+ days old who adds `dev@thedreamwedding.in` as a manager on it. That is the vendor's action, granted from their end — TDW cannot arrange it unilaterally, and manufacturing one would defeat the check the rule exists to perform. Not taken tonight; available if a genuine vendor relationship of that shape arises before October.

### Founder's note to CE — free profile creation as a vendor service

The founder raised offering Business Profile creation to vendors free of charge, as an onboarding service. Recorded as his proposal, with three observations the seat can make and one it cannot:

- Google permits a profile to be created by the business owner **or an authorised representative**. Doing this for a vendor is allowed with their knowledge and authorisation; doing it silently on their behalf is not.
- It collides directly with A3's draft text, which currently reads "We never create profiles." That sentence must change before submission if this becomes a real offer, or the application will describe a business TDW is not running.
- It is also a strong answer to the 60-day problem in the long run: vendors whose profiles TDW helped create and manages are exactly the client profiles the prerequisite contemplates.
- **Not derived:** whether the Business Profile API can create locations programmatically, or whether creation remains a console-only action. The seat's understanding is the latter, but no derive stands behind it. If the service is offered at scale this needs answering before it is designed.

### Findings filed tonight

| Id | Finding | State |
|---|---|---|
| F-19.09 | `9888294440` is simultaneously TDW's public phone, TDW's public WhatsApp (via `wa.me` click-to-chat on the profile), and the standing test vendor fixture that every evening-walk SQL, virgin check and curl batch is authored against. The founder rules the number is TDW's permanently. The fixture must therefore move to a different number before the profile draws real inbound, and every bench and SQL block naming it amended in one labeled pass. | OPEN — ruling on timing owed |
| F-19.10 | The published privacy policy names `help@thedreamwedding.in` four times — for rights requests, opt-out, and the statutory DPDP grievance channel. That address does not exist; the domain has `dev@` and `hello@`. The grievance channel is dead as published. Cure: add `help@` as an alias immediately (costs nothing, makes the page true), then correct the page to `hello@` in the next pwa docs ZIP and keep the alias. | OPEN |
| F-19.11 | TDW's registered address is published on the privacy page: `9/1506, Lotus Boulevard, Sector 100, Noida`. It is therefore already public, and supplies A3's address line from a witnessed source. The GBP verification address is separate and private. | CLOSED — recorded |
| F-19.12 | The privacy policy §7 already promises that replying STOP halts messages. That promise predates template B2 and is live today. F-19.08's handler is therefore not new work created by the referral template — the template makes an existing unmet obligation visible. Strengthens the P1 condition; adds none. | OPEN — merged into F-19.08 |
| F-19.13 | The privacy page mentions no Google data anywhere. A GBP reviewer looks for exactly this. A ≤120-word paragraph was drafted for the founder covering: consent-gated access via official APIs, what is read, what is written, one-directional sync, encrypted tokens, and revocation from both sides. It is a pwa byte under his veto and ships in the next pwa docs ZIP. | OPEN — owed before submission ≈ 2026-10-27 |

### Also outstanding, not findings

- The profile's phone number did not persist through creation; the panel shows "Add place's phone number". Dashboard fix, F-19.09's number.
- Photos: none. The storefront-photo step was skipped deliberately — TDW has no premises, and the step warns that photo location metadata may update the business location in Maps, which would have exposed the private verification address. Logo and app screenshots should be added from the dashboard instead, with metadata stripped.
- `dev@thedreamwedding.in` is not yet witnessed as an owner/manager on the profile. Almost certainly true since it created the profile; A-4 requires it witnessed, not assumed.
- The Railway backend host for the OAuth redirect URI is not derived.
- A near-identical domain, `thedreamswedding.in` (with an S), belongs to an unrelated Delhi wedding-photography business and ranks for "The Dream Wedding". A3 should state TDW's domain explicitly to pre-empt reviewer confusion.

### Part A state

**OPEN, blocked with a date certain.** Prerequisites 4 and 5 met. Prerequisite 1 met except for age, clearing ≈ 2026-10-27. Prerequisites 2 and 3 partially met with named cures. The eight-week wait is not idle time: F-19.13, the phone number, the photos, and profile completeness all have a deadline they did not have this morning.

### Ledger state

**OPEN.** Part B sealed. Part A blocked on age. P0-A's done condition — both submissions dated — is not met and cannot be met before late October. A chair opening P1 does so against a sealed Part B and an open Part A, and Part C's rule stands: P1 charters against this ledger, not against the kickoff.
