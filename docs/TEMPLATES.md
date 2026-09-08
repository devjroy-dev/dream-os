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

### 9 · `circle_place_ready`  — UTILITY · bride line · Meta name **`tdw_circle_place_ready`**
**Added TDW_14 D-2 (2026-08-13) — C-6, the circle lane's first content template.** Variables: `{{1}}` = invitee name (`circle_members.invitee_name` — the name the bride typed, per Q-d), `{{2}}` = bride's name, `{{3}}` = circle join link. Meta template ID **`2069520823656352`**.

> Hi {{1}}, your place in {{2}}'s wedding circle on The Dream Wedding has been created. Open it here to complete your setup: {{3}} — reply here if you need any help.

**Copy provenance:** the FIRST draft (*"your invitation to join {{2}}'s wedding circle … is still open. Tap here to set up your access"*) was **refused by Meta's pre-submission classifier as MARKETING** — verbatim, *"This message template will be rejected."* Three signals: **"invitation"** is an offer, **"is still open"** is urgency, **"set up your access"** implies the recipient has nothing yet. Meta's own dialog defines Utility as messages about *"an existing order or account"*, and §2's three approved UTILITY bodies obey that literally — `demo_invite` (*has been set up and is ready*), `vendor_welcome` (*has been created*), `enquiry_alert_vendor` (*just came in*): each asserts **in past tense a thing that already exists**, then names the action servicing it. `vendor_welcome`'s note records the identical failure one template earlier.

The filed body is **truthful rather than merely compliant**: `invite_circle_member` writes the `circle_members` row — her name, her role, her token — at the moment the bride invites, so *"your place … has been created"* asserts a record that genuinely exists at send time. The template **name** moved with the body (`tdw_circle_invite_reminder` → `tdw_circle_place_ready`) because "invite" was doing part of the damage.

**Wire witness (2026-08-13):** live send on the **bride** PNID `1193630900506451` (the circle rides the bride number, §7.1) → accepted, `wamid.HBgMOTE4NzU3Nzg4NTUwFQIAERgSNjY2MTMxNzg0MkRDNDEwQ0FEAA==`, status callbacks **sent · delivered · read**, and the message **rendered on the founder's handset**. The render is what proves the **slot order**: parameters are positional and Meta only counts them, so a swapped order is accepted, delivered, and silently wrong. `variables` is ordered from the render, never from the filing form. `en` is confirmed correct by the accepted send — the `en`/`en_US` residual named at `enquiry_alert_vendor` is answered for this WABA; `WA_TEMPLATE_LANGUAGE` stays unset.

**No caller ships with this template** (CE-32 ruling ③ — D-2 stops at filing; filing-ahead is P-06.T clause 5's own practice, and `status`+`sendWa`'s gate mean nothing sends unintentionally). **Two findings are recorded at the registry entry for whoever writes that caller: F-14.6** — the window signal on this lane is a trap, because `conversations.last_message_at` is bumped by coplanner **web** sends, so last-inbound must come from `messages`; **F-14.7** — a circle member has no opt-out row of her own, and the ruled cure is `nudge_optout`'s lane vocabulary widened with `'circle'`, owed by the first delivery that sends.

**Spec departure, labelled:** TDW_14 C-6 specified **one** template with a variable slot carrying three different lines (invite · task assigned · poll closing). Superseded at CE-32 with reasons: a body vague enough to carry three meanings cannot earn UTILITY (§6's legacy `tdw_morning_brief_…` is the estate's own evidence — classified Marketing for exactly that), and only one of the three subjects exists today (`circle_activity` writes `save_added` · `comment` · `removed` and nothing else). **Ruled three-over-time:** D-3 files its own for polls, D-4 for delegation, each at its feature's birth.


**Transport (supersession, named):** the spec says "submitted to Twilio same day". That wording predates **P-06.T** and the CE-36 seal and is **historical**. This template is filed **with Meta**, on the marketing line — Twilio is fallback-only at zero balance and M2b deleted the transport (CE-62).

**Governance:** marketing line ⇒ the STOP gate and the 25/day marketing cap apply (spec §3). The registry ships `status: 'pending'` and `sendWa` refuses every non-`approved` template, so **nothing can send until the founder flips it after Meta's word**.

**Note (08):** `TDW_08_DEMO_FINAL.md` §P1 amends this body with a remove line ("Don't want this? {remove_link} — one tap, gone.") and re-submits. Not pulled forward; named so 08's executor finds the pointer here.

### 10 · `assist_lead_outside` — **MARKETING** (filed UTILITY) · marketing line · Meta name **`tdw_assist_lead_outside`**
**Added CE-41 seat B (B1, 2026-09-08) — the concierge's outsider lead alert, R-41.4(a).** Variables: `{{1}}` = vendor name as TDW holds it, `{{2}}` = wedding month, `{{3}}` = city, `{{4}}` = category, `{{5}}` = budget figure, digits only. Meta template ID **`1627376372249131`**.

> Hi {{1}}, a couple planning a {{2}} wedding in {{3}} asked The Dream Wedding to find them a {{4}}, and their request has been matched to you with a budget of about Rs {{5}}. The request is held on the page below. Reply STOP REQUESTS if you would rather not receive these.

Button: URL, label `View the request`, base `https://thedreamwedding.in/assist/` with a dynamic suffix (the request token). Fixed domain, one variable at the tail.

**Category provenance — the reclassification, recorded as a decision.** Filed UTILITY and **approved as MARKETING**. Meta's Utility test requires the message be non-promotional **and also** specific to or requested by the recipient — clearly related to *their* order, account, services or transactions. An outside vendor made no request and holds no account, so the second prong fails on the recipient's side no matter how the body is worded. The body asks for nothing, names no benefit and carries no invitation verb (the sketch's "join to see it" was struck at draft precisely because Meta's own guidelines class a request to install or act in an app as App Promotion, which is Marketing); the category still moved. **R-41.30 rules course (a): accept.** No appeal, no re-file, no loop. Reason: an appeal spends goodwill on a loss, and Meta warns then restricts utility messaging for seven days where it judges a business to be pushing marketing content through the utility category — the whole estate's Utility lane is not worth one template's pricing.

**The known hole, and its instrument (R-41.30).** As MARKETING this body is subject to Meta's **per-user marketing template message limits** — a cap on how many marketing templates any one WhatsApp user receives from any business, the `131049` family. Its recipients are, by construction, vendors who have never messaged TDW, which is the most exposed class there is. This is F-40.176's throttle, on the one body the Utility cure could not reach. **It is named, not discovered.** The cure is not a category and not a reword: `131049` returns **synchronously on the send call**, so the forward arm records `status='failed'` and `error_code=131049` on `assistance_forwards` (R-41.15's columns) and the admin queue shows the alert as *not delivered — marketing limit*, distinct from an alert that was delivered and ignored. A throttled outsider is therefore visible and re-forwardable by hand; she is not silently lost.

**DIVERGENCE FOUND AND CORRECTED — 2026-09-09 (F-41.63).** The body and variable order above
are **unchanged and correct**: witnessed at WhatsApp Manager's preview panel, founder's capture
01:30 on 2026-09-09 — this body verbatim, slot order **month · city · category**, the
`STOP REQUESTS` line present, the `View the request` URL button attached.

**The registry disagreed with it.** `src/lib/templates.js:772-784` (at `6c7acdc`) carried a
different body — *"Hello {{1}}, this is The Dream Wedding. A couple in {{2}} is looking for {{3}}
for a wedding in {{4}}…"* — with `variables: ['name','city','category_words','month_year',
'budget_rs']`. **Slots 2, 3 and 4 were permuted against the filing**, the `STOP REQUESTS` line
was absent, the struck *"Join The Dream Wedding to see the request"* phrasing was back, and no
button component was declared.

**It was authored independently of the filing, not derived from it.** Meta holds the filing;
the registry was wrong. The cure is a `src/` byte and is **F-41.63, seat D's** — not this
document's, which was correct throughout.

**What it cost before it was found: a garbled send.** The A10 walk put the registry's order on
the wire against Meta's template, and the message rendered on the founder's handset with the
month, city and category in the wrong slots. **Meta accepted it, delivered it, and it was
nonsense** — parameters are positional and Meta only counts them.

**This is the failure the B1 seal's §5 named as owed, arriving exactly as described.** The seal
said the four templates' slot order was proven only by the Manager's preview, that a swapped
order would be *"accepted, delivered, and silently wrong"*, and that `variables` must be ordered
from the render and never from a second document. A second document was written, it was ordered
from neither the render nor the filing, and the wire showed it.

**Standing consequence, offered for the chair:** §2's body text cannot assert itself, but the
**variable order can**. A cell asserting `templates.js`'s `variables` array against this section,
slot for slot, would have caught this the day the registry entry appeared rather than on a
handset.

**No caller ships with this template** at the seal. The concierge forward arm is seat A's (packet A2), dark behind the switchboard.

### 11 · `assist_found_vendor` — UTILITY · bride line · Meta name **`tdw_assist_found_vendor`**
**Added CE-41 seat B (B1, 2026-09-08) — R-41.4(b).** Variables: `{{1}}` = bride's name, `{{2}}` = category, `{{3}}` = wedding month, `{{4}}` = vendor's display name. Meta template ID **`3160852754105015`**.

> Hi {{1}}, we have matched a {{2}} to the request you sent The Dream Wedding for your {{3}} wedding. {{4}} is on The Dream Wedding, and their recent work and open dates are on the page below.

Button: URL, label `See their page`, base `https://thedreamwedding.in/v/` with a dynamic suffix (the vendor code, R-40.15's address family).

**Copy provenance:** the verb **found** is deliberately absent. Meta's categorisation guide lists under *Retargeting* — which is Marketing **even where the user asked for it** — the example *"We found a {{car}} that meets your saved search."* The filed body leads instead with *the request you sent*, which names the bride's own action and puts the message inside Meta's second Utility prong. Approved UTILITY as filed; the manoeuvre held.

### 12 · `assist_found_outside` — UTILITY · bride line · Meta name **`tdw_assist_found_outside`**
**Added CE-41 seat B (B1, 2026-09-08) — R-41.4(c).** Variables: `{{1}}` = bride's name, `{{2}}` = wedding month, `{{3}}` = category, `{{4}}` = Instagram handle. Meta template ID **`3115277355330375`**. **No button.**

> Hi {{1}}, the request you sent The Dream Wedding for your {{2}} wedding has been matched to a {{3}}, and their work is on Instagram at {{4}} — reply here and we will arrange the introduction.

**Two departures from R-41.4(c) as written, both deliberate, both filed and approved.** *One:* the ruling names "the IG handle **and the TDW WhatsApp link**" as body text. The link was dropped — she is reading this on the bride line, so *reply here* reaches TDW with no link at all, and a link buys nothing while carrying a non-zero flag risk. *Two:* the opening clause is inverted relative to entry 11 so the two bodies are not near-duplicates; Meta rejects a template whose body duplicates an existing one, and `circle_place_ready` records the estate losing a cycle to the pre-submission classifier already. Both accepted; neither was refused as duplicate content.

**WITNESSED AT THE MANAGER — 2026-09-09.** Founder's capture of the preview panel, sample values
as filed: *"Hi Priya, the request you sent The Dream Wedding for your November wedding has been
matched to a makeup artist, and their work is on Instagram at @makeupbyswatiroy — reply here and
we will arrange the introduction."*

**It agrees with this entry on every point that can be got wrong.** Read against the sample
values: `{{1}}` name (Priya) · `{{2}}` month (November) · `{{3}}` category (makeup artist) ·
`{{4}}` handle (@makeupbyswatiroy). **Four variables, slot order name · month · category ·
handle, no button in the preview** — the body verbatim, the count, the order and the absence of
a button all as filed. Nothing is corrected here; the witness is recorded.

**Why that is worth a paragraph rather than a tick.** Row 10's entry read equally settled until
a second document was written beside it, and the divergence surfaced on a handset rather than in
either document. This row is now witnessed **at the source**, so a future registry entry for
`assist_found_outside` must be **derived from this reading**, not authored next to it. Under
R-41.97 the bench cell asserts `templates.js`'s `variables` array against this section slot for
slot, which is what makes the derivation checkable rather than merely intended.

**Roadmap §7 held:** the outsider's phone does not appear, and the handle is the only identifier that leaves. The couple reaches an outside vendor only after that vendor joins.

### 13 · `introduction` — MARKETING · her own WABA on R9; the vendor line for the J1 walk · Meta name **`tdw_introduction`**
**Added CE-41 seat B (B1, 2026-09-08) — R-41.11, Victor as her closer.** Variables: `{{1}}` = recipient's name, `{{2}}` = vendor or business name, `{{3}}` = where they met. Meta template ID **`1757650692328688`**.

> Hi {{1}}, this is {{2}}, and we met at {{3}} — I wanted to send you my work, so here is my page with recent weddings and my open dates. Reply STOP and I will not message you again.

Button: URL, label `See my work`, base `https://thedreamwedding.in/v/` with a dynamic suffix (her storefront, wedding page or reel — all under the fixed domain).

**Category, argued and not argued down.** MARKETING **as filed**, not a reclassification. A vendor sending a stranger her portfolio is promotional in Meta's frame and in plain English; arguing Utility here is the misuse that earns a written warning and a seven-day utility-messaging restriction on the WABA. Hence the opt-out sentence, present and mandatory.

**What the marketing throttle means here.** Every recipient of an introduction has, by construction, never messaged that WABA, so a share of introductions will be silently withheld under the per-user marketing cap — and R-41.11 forbids any follow-up to an unanswered introduction. **A throttled introduction and an ignored introduction are indistinguishable to the vendor unless the send arm says otherwise.** The Utility cure that answered F-40.176 is not available to this body at any wording. R-41.30's instrument is therefore owed on J1's arm too: the error code recorded per send, and the vendor told *not delivered*, never left to read Meta's silence as the person's answer.

**Open at the seal (R-41.31):** the handle-only shape of R-41.11 has no template. A body either carries a URL button or it does not, so a second template **`tdw_introduction_handle`** — no button, the handle as a variable in the body — is chartered for a B1b packet at the founder's next Manager session. Not blocking; R9 is gated regardless.

### 14 · `referral_alert` — UTILITY · vendor line · Meta name **`tdw_referral_alert`**
**Added CE-41 seat B (2026-09-08), F-41.6's first cure — the template existed, was filed,
was sent, and appeared in this document nowhere.** G5.1's peer forward, founder-vetoed
2026-09-07 (G51_S2_VETO_SHEET row T2). Variables: `{{1}}` = the vendor being told,
`{{2}}` = the vendor who referred, `{{3}}` = leads link. Meta template ID **`1526630866155035`**.

> Hi {{1}}, {{2}} just passed you an enquiry on The Dream Wedding. Open your Leads to see it: {{3}} — reply here if you need a hand.

Registry witness: `src/lib/templates.js:802-820` at `e62ba2a` — `name`, `line: 'vendor'`,
`category: 'UTILITY'`, `variables: ['vendor_name', 'referrer_name', 'leads_link']`,
`status: 'approved'`. The registry string and the filed string agree character for character,
which is the condition that entry's own comment at `:810-814` exists to protect: Meta holds the
body exactly, and a registry that has drifted builds a payload Meta rejects at send time.

**Wire witness (2026-09-08, Manager panel, founder-supplied):** Active – Quality pending ·
**2 sent · 2 delivered · 2 read (100%) · 0 unique replies** · amount spent `Rs 0.23` · cost per
message delivered `Rs 0.12`.

**Slot order proven by render, not by the form.** The panel renders *"Hi Make Up by Swati Roy,
Dev Roy Photography just passed you an enquiry…"* — `{{1}}` the vendor being told, `{{2}}` the
vendor who referred. Reversed, the message tells Swati that she passed Dev an enquiry.
Parameters are positional and Meta only counts them, so the swap would have been accepted,
delivered and silently wrong. It was not.

**This template is F-40.220's specimen and its disposal.** §1 as written requires real words
between every variable pair; this body separates `{{1}}` and `{{2}}` with a comma. Meta's own
adjacency test is whitespace (`{{1}} {{2}}`), which a comma clears — the estate wrote its rule
stricter than Meta's. Meta accepted the filing, and the wire has now delivered and been read
twice. The house-style red carried no behavioural cost and there is a witness for it rather
than an argument. Disposed under c-41.4; `b51` §14 retired by ruling.

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
| 8 | `vendor_welcome` | `tdw_vendor_welcome` | UTILITY | **approved** | 2026-08-06 — filed by the founder for TDW_10 ADMIN P3's mint. The FIRST draft was refused by Meta's own pre-submission classifier as Marketing (「 so couples can find you 」 is a benefit claim); the filed body follows `demo_invite`'s Utility-earning precedent — an account that EXISTS and the action that services it, promising nothing. Dashboard: Active – Quality pending. Flipped in `src/lib/templates.js` at the P3 close. |
| 9 | `circle_place_ready` | `tdw_circle_place_ready` | UTILITY | **approved** | 2026-08-13 — TDW_14 D-2. First draft refused by Meta's pre-submission classifier as Marketing; rewritten on `vendor_welcome`'s Utility-earning precedent and filed. Dashboard: **Active – Quality pending** (Active is the approval; "Quality pending" is the quality rating — the same reading `demo_lead_alert` and `enquiry_alert_vendor` carry). Meta ID `2069520823656352`. Wire-witnessed live: accepted, delivered, read, and rendered on the handset. |

| 10 | `assist_lead_outside` | `tdw_assist_lead_outside` | **MARKETING** (filed UTILITY) | **approved** | 2026-09-08 — CE-41 B1. Filed UTILITY, **approved as MARKETING**; the category moved at review, not after. Dashboard: Active – Quality pending. Meta ID `1627376372249131`. R-41.30: accept, no appeal. The `131049` hole and its instrument are recorded at the §2 entry. |
| 11 | `assist_found_vendor` | `tdw_assist_found_vendor` | UTILITY | **approved** | 2026-09-08 — CE-41 B1. Approved UTILITY as filed. Dashboard: Active – Quality pending. Meta ID `3160852754105015`. |
| 12 | `assist_found_outside` | `tdw_assist_found_outside` | UTILITY | **approved** | 2026-09-08 — CE-41 B1. Approved UTILITY as filed. Dashboard: Active – Quality pending. Meta ID `3115277355330375`. |
| 13 | `introduction` | `tdw_introduction` | MARKETING | **approved** | 2026-09-08 — CE-41 B1. MARKETING **as filed** (R-41.11), not a reclassification. Dashboard: Active – Quality pending. Meta ID `1757650692328688`. Its handle-only twin is chartered but unfiled (R-41.31). |

**Reading of the four (CE-41 B1, 2026-09-08).** All four filed and Active on **The Dream Wedding Direct** (`1739793260373677`) on one day, language `en`, from WhatsApp Manager by the founder. **Wire-unwitnessed:** no send arm exists for any of them, so unlike `circle_place_ready` the slot order here is proven only by the Manager's own preview render, never by a message on a handset. The first send on each is therefore also its first order proof — `variables` is ordered from the render, never from the filing form, and that reading is still owed for all four.

**Two records this file does not carry, named so the next reader does not mistake absence for cleanliness.** (i) §2 has no entry **8** — `vendor_welcome` appears in this tracker as row 8 but was never given a body entry above. (ii) This file documents thirteen templates; the WABA holds nineteen Active. §2 and §3 are behind the WABA and have been since Block 10. Neither is CE-41 seat B's to repair, and neither was repaired here.

**A note on §1 and this cut.** Seat B wrote §2 and §3 only. **§1 is the chair's** at this seal (c-41.4): `FINDINGS_LOG:5057` banks an amendment — *real words or a comma-separated clause between variable pairs* — that line 20 of this file never received, and F-40.220's disposal rides on it. The four bodies above obey the **stricter** unamended reading regardless, so they are compliant under either text. **If this packet and the chair's §1 edit are in flight together, apply this one first**; two writers on one file is the collision that R-40.82 exists to catch.

| 14 | `referral_alert` | `tdw_referral_alert` | UTILITY | **approved** | 2026-09-08 recorded (filed 2026-09-07) — CE-41 F-41.6's first cure. Active – Quality pending. Meta ID `1526630866155035`. Wire-witnessed: 2 sent, 2 delivered, 2 read. Slot order proven by render. |

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

---

## 8. Registry census — the estate's template truth (F-41.6, closed)

**Derived by command at dream-os `534059f87527f6b0a3fd8c05167eed3042a2da16`**, joining two
sources and nothing else:

- **the WABA**, via seat C's listing door — `read_at 2026-09-08T10:25:12Z`, 38 templates,
  1 page, `truncated: false`;
- **the registry**, `src/lib/templates.js` at this commit — 29 `tdw_` entries.

**Regenerate it the same way. Do not hand-edit it, and do not read it as evidence** — see the
measurement note below.

**39 distinct names. 38 on the WABA, 29 in the registry, 19 with no §2 entry and no §3 row.**

| Meta name | Meta ID | Meta category | Meta status | registry key | lane | §2/§3 entry |
|---|---|---|---|---|---|---|
| `booking_confirmed_v1` | `2171941953351762` | UTILITY | APPROVED | **none** | — | **no** |
| `tdw_admin_assist_request` | **not in snapshot** | — | — | `admin_assist_request` | vendor | **no** |
| `tdw_admin_signup_alert` | `1527889481998455` | MARKETING | APPROVED | **none** | — | **no** |
| `tdw_admin_signup_alert_v2` | `1079154258018145` | UTILITY | APPROVED | **none** | — | **no** |
| `tdw_assist_found_outside` | `3115277355330375` | UTILITY | APPROVED | **none** | — | yes |
| `tdw_assist_found_vendor` | `3160852754105015` | UTILITY | APPROVED | **none** | — | yes |
| `tdw_assist_lead_outside` | `1627376372249131` | MARKETING | APPROVED | **none** | — | yes |
| `tdw_bride_welcome` | `1771465944006011` | MARKETING | APPROVED | **none** | — | **no** |
| `tdw_bride_welcome_v2` | `2509139082925568` | MARKETING | APPROVED | **none** | — | **no** |
| `tdw_circle_join_otp` | `1045197921243934` | AUTHENTICATION | APPROVED | `circle_join_otp` | bride | yes |
| `tdw_circle_place_ready` | `2069520823656352` | UTILITY | APPROVED | `circle_place_ready` | bride | yes |
| `tdw_contract_copy` | `1108780808723101` | UTILITY | APPROVED | `contract_copy` | vendor | **no** |
| `tdw_contract_sign` | `1599338985536926` | UTILITY | APPROVED | `contract_sign` | vendor | **no** |
| `tdw_contract_sign_otp` | `1790948108915173` | AUTHENTICATION | APPROVED | `contract_sign_otp` | vendor | **no** |
| `tdw_couple_login_otp` | `1807080077120201` | AUTHENTICATION | APPROVED | `couple_login_otp` | bride | yes |
| `tdw_couple_reset_otp` | `897152556224351` | AUTHENTICATION | APPROVED | `couple_reset_otp` | bride | yes |
| `tdw_crew_assignment` | `1586609669515026` | UTILITY | APPROVED | `crew_assignment` | vendor | yes |
| `tdw_demo_invite` | `1460307722523713` | UTILITY | APPROVED | `demo_invite` | marketing | yes |
| `tdw_demo_lead_alert` | `1014192204719385` | UTILITY | APPROVED | `demo_lead_alert` | marketing | yes |
| `tdw_enquiry_alert_vendor` | `1569931651247221` | UTILITY | APPROVED | `enquiry_alert_vendor` | vendor | **no** |
| `tdw_enquiry_brief_vendor` | `980859458308932` | UTILITY | APPROVED | `enquiry_brief_vendor` | vendor | **no** |
| `tdw_enquiry_reply_couple` | `1739980970608062` | UTILITY | APPROVED | `enquiry_reply_couple` | vendor | **no** |
| `tdw_enquiry_update_couple` | `2548033538980046` | UTILITY | APPROVED | `enquiry_update_couple` | vendor | **no** |
| `tdw_introduction` | `1757650692328688` | MARKETING | APPROVED | **none** | — | yes |
| `tdw_lead_alert_basic` | `966395332526543` | MARKETING | APPROVED | `lead_alert_basic` | vendor | **no** |
| `tdw_lead_alert_utility` | `1753685715867036` | UTILITY | APPROVED | `lead_alert_utility` | vendor | **no** |
| `tdw_marketing_opener` | `1336770165243551` | MARKETING | APPROVED | `marketing_opener` | marketing | yes |
| `tdw_morning_nudge_bride` | `1011828918129845` | UTILITY | APPROVED | `morning_nudge_bride` | bride | yes |
| `tdw_morning_nudge_vendor` | `1561878605718468` | UTILITY | APPROVED | `morning_nudge_vendor` | vendor | yes |
| `tdw_payment_due` | `1933718834006817` | UTILITY | APPROVED | `payment_reminder` | vendor | yes |
| `tdw_payment_reminder` | `1781270206634381` | UTILITY | APPROVED | `payment_reminder_couple` | bride | yes |
| `tdw_referral_alert` | `1526630866155035` | UTILITY | APPROVED | `referral_alert` | vendor | yes |
| `tdw_referral_invite` | `1557978505339198` | MARKETING | APPROVED | **none** | — | **no** |
| `tdw_review_request` | `1713996623186968` | MARKETING | APPROVED | `review_request` | bride | **no** |
| `tdw_vendor_login_otp` | `889453490444121` | AUTHENTICATION | APPROVED | `vendor_login_otp` | vendor | yes |
| `tdw_vendor_reset_otp` | `2141803752887353` | AUTHENTICATION | APPROVED | `vendor_reset_otp` | vendor | yes |
| `tdw_vendor_welcome` | `2269742787193968` | UTILITY | APPROVED | `vendor_welcome` | vendor | yes |
| `tdw_wedding_consent` | `2247847469383400` | UTILITY | APPROVED | `wedding_consent` | vendor | **no** |
| `tdw_wedding_credit` | `2392820361246855` | UTILITY | APPROVED | `wedding_credit` | vendor | **no** |

### Three clean results, and they had never been checked (R-41.56)

- **Every registry name exists at Meta.** No send can fail on a name Meta does not hold.
- **Category agrees, registry against Meta, on all 28 names present in both** — including the
  ones that moved: `tdw_lead_alert_basic` MARKETING, `tdw_review_request` MARKETING,
  `tdw_lead_alert_utility` UTILITY. The code believes exactly what Meta holds.
- **All 38 on the WABA are APPROVED.** Nothing paused, rejected or pending.

### The one row where the two sources disagree, and why that is correct

`tdw_admin_assist_request` is **in the registry and not in the WABA snapshot**. It is not a
drift: it arrived with seat A's A6 (`534059f`, F-41.26, Utility per R-41.63) **after** the
listing door was read at 10:25. **The snapshot is one template behind the registry, by clock,
not by error.** Re-run the door and the row fills.

**This is the census working.** A join between two independently derived sources shows its own
staleness; a hand-kept list does not.

### The measurement note (c-41.15) — read before testing coverage against this file

The seat that opened F-41.6 reported **six** templates absent from this document. It tested
*"does this name appear anywhere in `TEMPLATES.md`"* — **but this census lists every name, so
the test was reading its own table.** Circular.

Run against the file **before** this section, the answer is **19**, not six, and not the 13 that
a registry-only count gave earlier. **Any future check of document coverage must run against
the prose sections (§2 and §3), never against §8.**

The class is general and worth carrying: **an instrument must not score the artefact it wrote.**

### What the census is, and what it is not

The `Meta ID`, `Meta category` and `Meta status` columns are the **WABA's** word. The
`registry key` and `lane` columns are the **code's**. Where a row says `**none**` under registry
key, no shipped code calls that template — see the orphan finding (F-41.20).

**Nineteen names still have no §2 entry.** They are not written here as prose, deliberately: a
§2 entry's value is *provenance* — why this body, what Meta refused first, what the wire
witnessed — and for those nineteen this seat has none. Restating registry bodies in longer form
would be volume, not coverage. **§2 remains the place where a body with a story gets its story
told; §8 is where every template is accounted for.**

**The tree's own count was badly stale.** Amendment 3 and the succession both read
"templates 19/19 Active on Direct." The WABA holds thirty-eight. The count had doubled and no
document noticed, because the only instrument was a human counting rows in a panel.
