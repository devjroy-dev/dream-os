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
| F-19.08 | B2's quick reply is type `Custom`, not Meta's built-in opt-out. Meta forwards the tap as an inbound message and takes no action itself. A handler and a suppression flag are owed at P1 before the P4 cron fires once — see AMENDMENT 1. |

---

## PART A · GOOGLE BUSINESS PROFILE API ACCESS

### A1 · Prerequisites — all true before the form opens

| # | Prerequisite | Witness | Status |
|---|---|---|---|
| 1 | Verified, complete GBP for The Dream Wedding, ideally 60+ days old | Maps shows "You manage this Business Profile" | |
| 2 | `thedreamwedding.in` live with a visible privacy page naming Google account data | `/privacy` renders; paragraph present | |
| 3 | Submitting email on the website domain and an owner/manager of the GBP above | not a gmail.com address | |
| 4 | Google Cloud project under a Cloud Organization (not "No organization") | IAM & Admin → Manage Resources | |
| 5 | Project Number captured (numeric, not the ID) | Console → Dashboard → Project info | |

### A2 · Values derived, not typed (F-19.04)

| Field | Value |
|---|---|
| Business name, verbatim from the GBP | |
| Address / service area, verbatim from the GBP | |
| Primary category on the GBP | |
| Project Number | |
| Submitting email | |
| Railway backend host (for the OAuth redirect) | |
| OAuth redirect URI submitted | `https://<host>/api/v2/vendor/solutions/google/callback` |

### A3 · Submission record

| Field | Value |
|---|---|
| Date submitted | |
| Application type | Application for Basic API Access |
| Confirmation screenshot path | |
| Follow-up email received (date) | |

### A4 · Approval record

| Field | Value |
|---|---|
| Approval email date | |
| Quota screenshot path (Console → APIs & Services → Quotas, non-zero for Business Profile APIs) | |
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

- [ ] GBP approval date recorded (A4)
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
