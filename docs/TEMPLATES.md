# TEMPLATES.md — Meta WhatsApp message templates (Block 05, P2)

**Repo:** dream-os · **Chartered by:** TDW_05_WEBHOOK_FINAL §P2, reconciled against **TDW_05_TRANSPORT_RULING (P-06.T)** · **Authored:** Block 05 P2 sitting one · **Filed with Meta:** 2026-07-19 (P2 submission-guide sitting)
**Status of this file:** FOUNDER-APPROVED & FILED. All six bodies below are the copy as submitted to Meta on 2026-07-19 (founder-vetoed; `marketing_opener` corrected to name **Mira** per founder). Product / vendor-facing words, not agent voice (W-1 untouched). Live per-template review status is in §3.

---

## 0. Transport reconciliation (read before submitting)

The webhook spec (`TDW_05_WEBHOOK_FINAL.md`, authored 2026-07-14) described **Twilio** submission and a `twilioTemplateSid` per key. That language is **stale**. P-06.T (settled 2026-07-18) rules **Meta WhatsApp Cloud API, direct, TDW as Tech Provider on its own WABA** (Twilio is fallback-only, balance 0). Therefore, for submission:

- Templates are filed **directly with Meta** — WhatsApp Manager UI, or Cloud API `POST /{waba-id}/message_templates`. **No** Twilio Content Template Builder, **no** Content SIDs, **no** BSP.
- The registry identity is **`name` + `language`** (how Meta references a template on the WABA). There is **no** `twilioTemplateSid` field anywhere.
- File all six **same-day** so Meta's approval latency runs in the background off the critical path (P-06.T clause 5; the fifth chair's charter at `6524306`).

## 1. Meta compliance rules these bodies already honor

- Variables are `{{1}}`, `{{2}}`, … numbered sequentially from 1, no gaps.
- No body **begins or ends** with a variable.
- No two variables are **adjacent** — every pair is separated by real words.
- Bodies are **single-line** — no line breaks at all, so no double line break (`\n\n`) can ever be rejected.
- Category is **UTILITY** for every transactional template (nudges, reminder, crew, demo) and **MARKETING** only for `marketing_opener`.
- The **opt-out line** (`Reply STOP to opt out.`) is present on `marketing_opener` only. The nudges carry a functional pause instruction (`STOP MORNINGS`), which is a service control, not a marketing opt-out.
- Variable **values** supplied at send time must themselves contain no newline, tab, or run of 4+ spaces (Meta rejects those in parameters). The registry's summary vars are built as single-line strings for this reason.

## 2. The bodies (six from Block 05 P2, plus `demo_lead_alert` from Block 07 P1)

### 1 · `marketing_opener`  — MARKETING · marketing line · Meta name **`tdw_marketing_opener`**
Variables: `{{1}}` = recipient first name.

> Hi {{1}}, this is Mira from The Dream Wedding. We keep your vendors, payments, and timeline in one place. Reply here and I'll show you how it would work for your wedding. Reply STOP to opt out.

Note: stays factual and warm. **Mira** is the couple-facing agent (see §5); this template introduces her by name. The Closer's soul (Block 06) does the selling in-session — the template only opens the door and carries the legally required opt-out.

### 2 · `morning_nudge_vendor`  — UTILITY · vendor line · Meta name **`tdw_morning_nudge_vendor`**
Variables: `{{1}}` = vendor name, `{{2}}` = single-line day summary (today's functions + dues, assembled by the nudge builder).

> Good morning {{1}}. Here's your day: {{2}}. Reply STOP MORNINGS to pause these updates.

### 3 · `morning_nudge_bride`  — UTILITY · bride line · Meta name **`tdw_morning_nudge_bride`**
Variables: `{{1}}` = bride name, `{{2}}` = single-line summary (days-to-wedding + today's items). First-person "Here's where things stand" is **Mira's** voice (§5).

> Good morning {{1}} 🌸 Here's where things stand for your wedding: {{2}}. Reply STOP MORNINGS anytime to pause.

### 4 · `crew_assignment`  — UTILITY · vendor line · Meta name **`tdw_crew_assignment`**
Variables: `{{1}}` = crew member name, `{{2}}` = event + date, `{{3}}` = crew-page link.

> Hi {{1}}, you're on the crew for {{2}}. Open your crew page for the full details and checklist: {{3}} — reply here if anything's unclear.

### 5 · `payment_reminder`  — UTILITY · vendor line · Meta name **`tdw_payment_due`**
Variables: `{{1}}` = milestone description (amount + who), `{{2}}` = due timing.
Registry **key** stays `payment_reminder`; the Meta **name** is `tdw_payment_due` to avoid colliding with the pre-existing approved `tdw_payment_reminder` already on the WABA (see §6).

> Reminder: {{1}} is due {{2}}. Reply PAID once it lands and I'll update your books.

### 6 · `demo_invite`  — UTILITY · marketing line · Meta name **`tdw_demo_invite`**
Variables: `{{1}}` = recipient name, `{{2}}` = demo-claim link. First-person "reply here if you need any help" is **Mira's** voice (§5).

> Hi {{1}}, your demo workspace has been set up and is ready. Open it here to access your account: {{2}} — reply here if you need any help.

Note (W-8): the close path is the **demo-claim link**; invite links/codes are retired. This template carries that link and nothing else.
Note (category): copy was **tightened at submission** to earn UTILITY — Meta's pre-check flagged the original "ready to explore / take a look" wording as Marketing. The tightened "set up / access your account" copy was **approved as UTILITY** on 2026-07-19; no reconciliation needed. (If Meta ever reclassifies it later, a 60-day category-review appeal is available in WhatsApp Manager.)

### 7 · `demo_lead_alert`  — UTILITY · marketing line · Meta name **`tdw_demo_lead_alert`**
**Added TDW_07 P1 (Block 07 sitting one, 2026-07-29) — D-6's demo-lead relay.** Variables: `{{1}}` = vendor name, `{{2}}` = wedding month, `{{3}}` = demo-claim link.

> Hi {{1}}, a couple just asked about your work for their {{2}} wedding on The Dream Wedding. Their enquiry is waiting in your ready account: {{3}} — reply here if you need any help.

**Copy provenance:** founder-vetoed 2026-07-29, draft (a), verbatim 「 1. the first one 」. The spec's own draft (`TDW_07_DISCOVER_FINAL.md` §P5.2) **opened on a variable** and would have been filed against §1's third rule; the veto took the compliant draft. Recorded so the divergence from the spec is a decision on the record, not a drift.

**Transport (supersession, named):** the spec says "submitted to Twilio same day". That wording predates **P-06.T** and the CE-36 seal and is **historical**. This template is filed **with Meta**, on the marketing line — Twilio is fallback-only at zero balance and M2b deleted the transport (CE-62).

**Governance:** marketing line ⇒ the STOP gate and the 25/day marketing cap apply (spec §3). The registry ships `status: 'pending'` and `sendWa` refuses every non-`approved` template, so **nothing can send until the founder flips it after Meta's word**.

**Note (08):** `TDW_08_DEMO_FINAL.md` §P1 amends this body with a remove line ("Don't want this? {remove_link} — one tap, gone.") and re-submits. Not pulled forward; named so 08's executor finds the pointer here.

## 3. Submission tracker

All six were filed with Meta on **2026-07-19** (WhatsApp Manager UI, WABA "The Dream Wedding", language `en`) and **all six were approved the same day** (the four in review cleared within minutes). `status` mirrors the registry's `status` field in `src/lib/templates.js`; all six read `approved`. `demo_invite` was approved as **UTILITY** — the tightened copy held, so no category reconciliation was needed.

| # | registry key | Meta name | category | status | submission date |
|---|------|------|----------|--------|-----------------|
| 1 | `marketing_opener` | `tdw_marketing_opener` | MARKETING | **approved** | 2026-07-19 |
| 2 | `morning_nudge_vendor` | `tdw_morning_nudge_vendor` | UTILITY | **approved** | 2026-07-19 |
| 3 | `morning_nudge_bride` | `tdw_morning_nudge_bride` | UTILITY | **approved** | 2026-07-19 |
| 4 | `crew_assignment` | `tdw_crew_assignment` | UTILITY | **approved** | 2026-07-19 |
| 5 | `payment_reminder` | `tdw_payment_due` | UTILITY | **approved** | 2026-07-19 |
| 6 | `demo_invite` | `tdw_demo_invite` | UTILITY (approved as filed) | **approved** | 2026-07-19 |
| 7 | `demo_lead_alert` | `tdw_demo_lead_alert` | UTILITY | **approved** | 2026-07-29 — Meta approved ~17:31 UTC, Utility retained (dashboard: Active – Quality pending). Flipped in `src/lib/templates.js` at TDW_07 P2. |

## 4. Language code

Filed under language **`en`** (matching the three pre-existing WABA templates, which display as plain "English"). The registry's `language` field resolves to `en` via `WA_TEMPLATE_LANGUAGE || 'en'`; keep it matching, since Meta references templates by `name` + `language`.

## 5. Mira — the couple-facing agent

The couple-facing agent is named **Mira**. `tdw_marketing_opener` introduces her by name ("this is Mira from The Dream Wedding"), and the first-person lines in `tdw_morning_nudge_bride` ("Here's where things stand") and `tdw_demo_invite` ("reply here if you need any help") are Mira's voice. This note records the name as it appears in **product copy only**. The agent's in-session persona / system prompt is **not** set from here and was not changed in this session — reconciling the couple-agent persona to "Mira" is a soul-scoped item handed to whoever owns that work (W-1 boundary; see HANDOVER).

## 6. Pre-existing templates on the WABA (reconciliation)

At filing time the WABA already held three approved templates from 2026-05 (older "DreamAi"/✦ branding), which we left untouched:
- `tdw_payment_reminder` — UTILITY, 4 vars ("Hi {{1}}, a payment of Rs. {{2}} to {{3}} is due on {{4}}…"). More structured than our 2-var `payment_reminder`, but reusing it needs a registry/caller rewire (2→4 vars) that is out of this session's scope. **Decision:** file ours now under the non-colliding name `tdw_payment_due`; a future sitting may consolidate onto the 4-var shape (logged in HANDOVER). Ours keeps the "Reply PAID" confirmation loop the legacy one lacks.
- `tdw_morning_brief_…` — MARKETING, 1 var ("Good morning! ✦ Your wedding day is {{1}} away…"). Overlaps our bride nudge in intent only; ours is UTILITY, 2 vars, and is the one the bride cron calls by name. Legacy one left as-is (pausing it is not a job for this session).
- `tdw_reactivation_hx` — MARKETING, 1 var. Maps to none of our six; untouched.

That Meta classified the legacy "Good morning! ✦ … reply with anything" as **Marketing** is the signal that validated keeping our nudges plain and status-bearing to hold UTILITY.

## 7. Authentication templates (OTP over Meta) — filing specs

**Status of this section:** DRAFT filing specs for the five `AUTHENTICATION`-category OTP keys added to the registry in Block 05 (F-05.6 fix (a), CE-35 / CE-36 seal). Unlike §2, **these are not authored bodies** — Meta AUTHENTICATION templates have a **preset, non-editable body**; the business supplies only the one-time code plus a few filed add-ons. This section is the **filing spec** per key (name, language, category, add-ons, button, rendered preview) — everything the founder needs to file + approve each on the WABA without reading code. Registry source: `src/lib/templates.js` (the five keys + `buildAuthTemplatePayload`); send routing: `src/lib/otpSend.js`.

### 7.0 Why these differ from §2 (read first)

- The body is **Meta-preset**: "`{{1}}` is your verification code." You do **not** write or veto body prose. `{{1}}` is the one-time code, threaded by `buildAuthTemplatePayload`.
- **Brand cannot go in an auth body.** Meta forbids free-form / brand text in AUTHENTICATION bodies. Brand is carried by the **sending number's WhatsApp display name** (§7.1) — a founder decision, not a copy choice.
- The only vetoable choices are the **filed add-ons** (§7.3) and the **button type** (§7.3).
- AUTHENTICATION templates are **opt-out-exempt** (no `Reply STOP`) and un-gated by the F-05.2 marketing opt-out by construction (`otpSend.js` calls Meta directly — see HANDOVER §"F-05.2 opt-out bypass").

### 7.1 Brand rides the display name (FOUNDER DECISION)

Brand is set **once per sending number**, in WhatsApp Manager → Phone numbers → (number) → Profile → **Display name**. It is **not** in any template body.

| lane | sending number | display name to set | who sees it | serves keys |
|---|---|---|---|---|
| bride | `+14787788550` (`BRIDE_WA_NUMBER`) | **The Dream Wedding** | couples, circle members | `couple_login_otp`, `couple_reset_otp`, `circle_join_otp` |
| vendor | `+917982159047` (`TDW_WA_NUMBER`) | **DreamAI** | vendors | `vendor_login_otp`, `vendor_reset_otp` |

The recipient sees the display name as the chat sender; the auth body carries only the code. Confirm both display names are set before the first live OTP on each lane.

### 7.2 The five filing specs

All five are **identical in form** — one preset body, same add-ons — differing only in registry key, proposed Meta name, and lane. Add-on defaults (§7.3) apply to all five.

**Common to all five:**
- language `en` · category `AUTHENTICATION`
- body variable `{{1}}` = the one-time code (nothing else)
- add-ons: security-recommendation line **ON**; code-expiry footer **5 minutes** (matches `OTP_TTL_MS = 5 × 60 × 1000` in `couple/auth.js`, `circle/join.js`, `vendor/auth.js`)
- button: **COPY_CODE**, text "Copy code"

**Rendered preview (what the recipient sees — example code `483920`):**

> **The Dream Wedding**  *(the display name — or DreamAI on the vendor lane)*
> 483920 is your verification code. For your security, do not share this code.
> This code expires in 5 minutes.
> `[ Copy code ]`

Per-key filing table:

| # | registry key | proposed Meta name | lane | send site | display-name brand |
|---|---|---|---|---|---|
| 1 | `couple_login_otp` | `tdw_couple_login_otp` | bride | `src/api/couple/auth.js` (login) | The Dream Wedding |
| 2 | `couple_reset_otp` | `tdw_couple_reset_otp` | bride | `src/api/couple/auth.js` (forgot-pin) | The Dream Wedding |
| 3 | `circle_join_otp` | `tdw_circle_join_otp` | bride | `src/api/circle/join.js` | The Dream Wedding |
| 4 | `vendor_login_otp` | `tdw_vendor_login_otp` | vendor | `src/api/vendor/auth.js` (login) | DreamAI |
| 5 | `vendor_reset_otp` | `tdw_vendor_reset_otp` | vendor | `src/api/vendor/auth.js` (forgot-pin) | DreamAI |

Names are **PROPOSED** (`tdw_` convention) and founder-final on the WABA. File under these and no registry edit is needed; file under a different name and it is a one-line `name:` change on that key.

### 7.3 Add-on & button defaults (PROPOSED — founder veto)

Filed on the WABA (not shipped as copy here):

| add-on | default | renders |
|---|---|---|
| security recommendation | **ON** | "For your security, do not share this code." |
| code-expiry footer | **5 minutes** | "This code expires in 5 minutes." |
| OTP button | **COPY_CODE**, "Copy code" | tapping copies the code into the clipboard |

**Button type — recommended: COPY_CODE.** `buildAuthTemplatePayload` currently emits Meta's `sub_type:'url'` OTP-button form, which pairs with a **COPY_CODE** filed button. A newer `copy_code` / `coupon_code` param form exists for some stacks; if the first live OTP is rejected on the button component, a **single-function flip** in `buildAuthTemplatePayload` switches to it (F-05.6 read-first #1, HANDOVER). File **COPY_CODE**; the flip is ready and needs no re-file.

### 7.4 Submission tracker (draft)

Mirrors §3; all five start `draft`, matching the registry `status` field in `src/lib/templates.js`. Founder flips each to `approved` after Meta approves (auth templates typically clear in minutes).

| # | registry key | Meta name | category | status | filed |
|---|---|---|---|---|---|
| 1 | `couple_login_otp` | `tdw_couple_login_otp` | AUTHENTICATION | **draft** | — |
| 2 | `couple_reset_otp` | `tdw_couple_reset_otp` | AUTHENTICATION | **draft** | — |
| 3 | `circle_join_otp` | `tdw_circle_join_otp` | AUTHENTICATION | **draft** | — |
| 4 | `vendor_login_otp` | `tdw_vendor_login_otp` | AUTHENTICATION | **draft** | — |
| 5 | `vendor_reset_otp` | `tdw_vendor_reset_otp` | AUTHENTICATION | **draft** | — |

### 7.5 Collapse decision — file 5, or fewer? (FOUNDER DECISION)

All five specs are byte-identical in what Meta stores (same preset body, add-ons, button; language `en`), so the founder may:

- **Option A — file 5 (one per key).** Cleanest per-site tracking + founder veto; matches the proposed names as-is; **zero registry edits**. More templates to approve (each trivial).
- **Option B — collapse to fewer** (e.g. one per lane = 2, or one shared = 1). Fewer WABA templates to manage. Requires pointing the collapsed keys at the shared filed `name`: edit the `name:` field on each collapsed key in `src/lib/templates.js` so they share one name (e.g. the three bride keys → `tdw_bride_otp`). Lane routing is unaffected — the lane is resolved from the **call site**, not the template name (`otpSend.js`).

Either is correct. The collapse/sequencing call is the founder's; the registry supports both with only `name:` edits.

### 7.6 WhatsApp Manager walkthrough (founder runs — no code read needed)

Per template (repeat for each key you file per §7.5):

1. WhatsApp Manager → **Account tools → Message templates → Create template**.
2. **Category: Authentication.**
3. **Name:** the proposed `tdw_…_otp` from §7.2 · **Language: English (en)**.
4. In the Authentication settings:
   - **Code delivery / button:** choose **Copy code** (COPY_CODE). Button text defaults to "Copy code".
   - **Add security recommendation:** toggle **ON**.
   - **Add expiration time for the code:** **ON → 5 minutes.**
5. Check the preview matches §7.2, then **Submit**. Meta usually approves auth templates within minutes.
6. **After approval, per key:** if you filed under a name different from the proposed one, update that key's `name:` in `src/lib/templates.js`; then flip its `status` from `'draft'` to `'approved'` (same convention as the six in §3).
7. **Provision the lane's phone-number-id in Railway:** `BRIDE_PHONE_NUMBER_ID` before the **bride** cutover (keys 1–3); `VENDOR_PHONE_NUMBER_ID` before the **vendor** cutover (keys 4–5). From that moment OTP on that lane rides Meta automatically; leave it unset and OTP stays on the sealed Twilio fallback (F-05.6 fix (b), `OTP_WA_NUMBER`).
8. **Set both display names** (§7.1) before the first live OTP on each lane.

**Not a template task (staged separately):** `tdw_marketing_opener` (§2 #1) is **already approved + filed** — do **not** re-file it. What remains open is its **live send test** on the real number (CE-30); stage that as a founder step alongside the first cutover, not as a template action here.
