# TEMPLATES.md — Meta WhatsApp message templates (Block 05, P2)

**Repo:** dream-os · **Chartered by:** TDW_05_WEBHOOK_FINAL §P2, reconciled against **TDW_05_TRANSPORT_RULING (P-06.T)** · **Authored:** Block 05 P2 sitting one
**Status of this file:** PROVISIONAL COPY — every body below is the founder's to veto. These are product / vendor-facing words, not agent voice (W-1 untouched).

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

### 1 · `marketing_opener`  — MARKETING · marketing line
Variables: `{{1}}` = recipient first name.

> Hi {{1}}, this is The Destination Wedding. We run a WhatsApp-based planning assistant that keeps your vendors, payments, and timeline in one place. Reply here and I'll show you how it would work for your wedding. Reply STOP to opt out.

Note: stays factual and warm. The Closer's soul (Block 06) does the selling in-session — the template only opens the door and carries the legally required opt-out.

### 2 · `morning_nudge_vendor`  — UTILITY · vendor line
Variables: `{{1}}` = vendor name, `{{2}}` = single-line day summary (today's functions + dues, assembled by the nudge builder).

> Good morning {{1}}. Here's your day: {{2}}. Reply STOP MORNINGS to pause these updates.

### 3 · `morning_nudge_bride`  — UTILITY · bride line
Variables: `{{1}}` = bride name, `{{2}}` = single-line summary (days-to-wedding + today's items).

> Good morning {{1}} 🌸 Here's where things stand for your wedding: {{2}}. Reply STOP MORNINGS anytime to pause.

### 4 · `crew_assignment`  — UTILITY · vendor line
Variables: `{{1}}` = crew member name, `{{2}}` = event + date, `{{3}}` = crew-page link.

> Hi {{1}}, you're on the crew for {{2}}. Open your crew page for the full details and checklist: {{3}} — reply here if anything's unclear.

### 5 · `payment_reminder`  — UTILITY · vendor line
Variables: `{{1}}` = milestone description (amount + who), `{{2}}` = due timing.

> Reminder: {{1}} is due {{2}}. Reply PAID once it lands and I'll update your books.

### 6 · `demo_invite`  — UTILITY · marketing line
Variables: `{{1}}` = recipient name, `{{2}}` = demo-claim link.

> Hi {{1}}, your demo workspace is ready to explore. Tap here to claim it and take a look: {{2}} — reply with any questions and I'll help.

Note (W-8): the close path is the **demo-claim link**; invite links/codes are retired. This template carries that link and nothing else.

## 3. Submission tracker

Update `status` and `submission date` as Meta processes each. When a template flips to **approved**, mirror the flip in `src/lib/templates.js` (`status: 'approved'`) — that is the switch `sendWa` reads before it will send a business-initiated (out-of-window) message.

| # | name | category | line | variables | status | submission date |
|---|------|----------|------|-----------|--------|-----------------|
| 1 | `marketing_opener` | MARKETING | marketing | name | draft | — (pending founder submission) |
| 2 | `morning_nudge_vendor` | UTILITY | vendor | name, summary | draft | — (pending founder submission) |
| 3 | `morning_nudge_bride` | UTILITY | bride | name, summary | draft | — (pending founder submission) |
| 4 | `crew_assignment` | UTILITY | vendor | member, assignment, link | draft | — (pending founder submission) |
| 5 | `payment_reminder` | UTILITY | vendor | milestone, due | draft | — (pending founder submission) |
| 6 | `demo_invite` | UTILITY | marketing | name, claim link | draft | — (pending founder submission) |

## 4. Language code

All six are authored in English; submit under language `en` (or `en_US` if the WABA prefers the regional variant — pick one and keep the registry's `language` field matching exactly, since Meta references templates by `name` + `language`).
