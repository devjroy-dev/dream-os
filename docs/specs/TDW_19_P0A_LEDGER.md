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
| Category submitted | UTILITY |
| Category approved | |
| Language | en |
| Date submitted | |
| Status | |
| Date approved | |
| Rejection reason (if any) | |

Body as submitted:

```
Hi {{1}}, thank you for choosing {{2}} for your wedding. If you have a minute, a Google review would mean a lot to them.
```

Button as submitted: URL, "Write a review", base `https://thedreamwedding.in/r/`, dynamic suffix `{{1}}`.

Body as APPROVED, verbatim (fill on approval — this is what becomes the constant):

```

```

### B2 · `tdw_referral_invite`

| Field | Value |
|---|---|
| Category submitted | UTILITY |
| Category approved | |
| Language | en |
| Date submitted | |
| Status | |
| Date approved | |
| Rejection reason (if any) | |

Body as submitted:

```
Hi {{1}}, {{2}} hopes your celebration went beautifully. If a friend is planning a wedding, you can share their page.
```

Buttons as submitted: URL, "Share", base `https://thedreamwedding.in/v/`, dynamic suffix `{{1}}` · Quick reply, "Stop messages".

Body as APPROVED, verbatim (fill on approval):

```

```

Buttons as APPROVED (record whether the quick reply survived):

```

```

### B3 · `hi` variants

Deferred. Not owed for P1 seal. Record here if and when filed.

---

## PART C · SEAL

P0-A is **OPEN** on this file existing in the tree with both submission dates recorded.

P0-A is **SEALED** when all three land:

- [ ] GBP approval date recorded (A4)
- [ ] `tdw_review_request` approved body verbatim recorded (B1)
- [ ] `tdw_referral_invite` approved body verbatim recorded (B2)

Block 19 P1 charters against the sealed ledger. A chair opening P1 against an unsealed one is routing around a withheld condition (§0.2).

At P1 the approved bodies become the constants in `src/wa/templates/*` — one home, authored from this ledger, never from memory. R-19.1's two redirect routes are owed in the same sitting.
