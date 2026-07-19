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

## 2. The six bodies

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
Note (category): copy was **tightened at submission** to earn UTILITY — Meta's pre-check flagged the original "ready to explore / take a look" wording as Marketing. Filed as UTILITY; if Meta's final verdict bumps it to MARKETING, flip `category` in the registry to match (a 60-day category-review appeal is available in WhatsApp Manager).

## 3. Submission tracker

All six were filed with Meta on **2026-07-19** (WhatsApp Manager UI, WABA "The Dream Wedding", language `en`). `status` mirrors the registry's `status` field in `src/lib/templates.js`. As Meta review completes, flip `submitted → approved` (or `→ rejected`) in **both** this table and the registry — the registry's `approved` flag is the switch `sendWa` reads before it will send a business-initiated (out-of-window) message. Two were already **approved** at filing time.

| # | registry key | Meta name | category | status | submission date |
|---|------|------|----------|--------|-----------------|
| 1 | `marketing_opener` | `tdw_marketing_opener` | MARKETING | submitted (in review) | 2026-07-19 |
| 2 | `morning_nudge_vendor` | `tdw_morning_nudge_vendor` | UTILITY | **approved** | 2026-07-19 |
| 3 | `morning_nudge_bride` | `tdw_morning_nudge_bride` | UTILITY | submitted (in review) | 2026-07-19 |
| 4 | `crew_assignment` | `tdw_crew_assignment` | UTILITY | **approved** | 2026-07-19 |
| 5 | `payment_reminder` | `tdw_payment_due` | UTILITY | submitted (in review) | 2026-07-19 |
| 6 | `demo_invite` | `tdw_demo_invite` | UTILITY (pending — may bump to MARKETING) | submitted (in review) | 2026-07-19 |

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
