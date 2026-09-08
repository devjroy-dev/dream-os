# FILING B4·2 — THE TERMS READ WHOLE · PART 2 OF 2

**Base:** dream-os `2a0d838a4c99cedd5082b49340e5fe80a30da72e`
**Seat:** CE-41 LE-B · 2026-09-08 · master §4 G6 item ZERO
**Held in clone; the freeze holds.**

**Read whole today, from the founder's pastes** (facebook.com/legal refuses automated access):

| Document | Last Updated | State |
|---|---|---|
| Meta Business Messaging **and Meta Business Agent** Technology Provider Terms | **2026-07-31** | READ WHOLE |
| WhatsApp Business Platform Cloud API Terms + Exhibits A & B | 2026-04-02 | READ WHOLE |
| **Meta Terms for WhatsApp Business Platform — the 09-23 replacement** | **2026-09-23** | READ WHOLE |
| Meta Hosting Terms for Cloud API | — | **MERGED — see below** |

**The third paste is the preview of the text that replaces the stack on 2026-09-23.** The chair
scheduled the diff for that date; it can be done now, and §5 does it. **Fifteen days.**

---

## 1 · THE FINDING THAT OUTRANKS EVERYTHING ELSE IN THIS CHARTER

### §4.7 of the 2026-09-23 Meta Terms — **AI Providers**

Two prohibitions, both new, both effective in fifteen days, both surviving termination.

**(a) The eligibility prohibition.**

> *Providers and developers of artificial intelligence or machine learning technologies … are
> strictly prohibited from accessing or using the WhatsApp Business Platform, whether directly
> or indirectly, for the purposes of providing, delivering, offering, selling, or otherwise
> making available such technologies **when such technologies are the primary (rather than
> incidental or ancillary) functionality being made available for use, as determined by Meta in
> its sole discretion**.*

**TDW's entire vendor surface is Victor on WhatsApp.** Whether the AI is *primary* or
*ancillary* is the question this clause turns on, and **Meta decides it in its sole
discretion** — not TDW, and not on TDW's framing.

The estate's own north star is the argument for *ancillary*: **TDW sells business
infrastructure — leads, contracts, payments, portfolio, reviews — and the assistant is the
interface to it, not the product.** That is a real and honest position. It is not a
guaranteed one.

**This is not a filing question and this seat cannot resolve it.** It is named because the
answer decides whether the estate has a WhatsApp channel at all, and because nothing on the
tree has ever considered it.

**(b) The data prohibition, and it is the operational one.**

> *you may not directly or indirectly allow WhatsApp Business Platform Data, including any
> anonymous, aggregate, or derived forms … to be used to create, develop, train, or improve any
> machine learning or artificial intelligence systems, models, or technologies, including large
> language models … provided that you may use WhatsApp Business Platform Data to fine-tune an AI
> Model **that is for your exclusive use**, so long as this does not result in [it] being used
> to create, develop, train, or improve any other AI Models. **This Section survives
> termination.**

TDW sends vendor and couple message content to **Anthropic** (Victor/Harvey) and **DeepSeek**
(Donna, harvest). Compliance therefore rests entirely on **what those providers do with API
inputs** — which is a question about their terms, not about TDW's code.

**OWED, and it is the single most important thing in this file:** a derived reading of each
model provider's data-retention and training terms, on the record, with dates. If any provider
trains on API inputs by default, the estate is on the wrong side of a clause that survives
termination — and the cure is a contract term or a provider change, not a code change.

**This seat has not read those terms and will not assert what they say.** It is B4·4.

### And §4.7 names the structural answer

> *Notwithstanding the foregoing, **you may retain an AI Provider as your Solution Provider**.*

Meta's own text contemplates the lawful shape: the AI provider is designated a Solution
Provider rather than an undeclared third-party recipient. Whether that is available or
appropriate for Anthropic or DeepSeek is a question for the chair and counsel. Recorded because
Meta wrote the escape hatch into the same clause as the prohibition, which is rarely accidental.

### The clause that makes it sharper — §4.1(b)

> *You must not … share, transfer, sell, license, or distribute WhatsApp Business Platform Data,
> **including any anonymous, aggregate, or derived forms**, to any third parties, **except to a
> Solution Provider** in accordance with these Terms.*

There is **no carve-out for processors acting on TDW's behalf.** The only named exception is a
Solution Provider. On a plain reading, sending message content to a model API is a disclosure to
a third party, and §4.1 survives termination too.

**Reported, not ruled.** But note the shape: §4.1(b) and §4.7 both point at the same remedy, and
neither is a code change.

---

## 2 · THE TECH PROVIDER TERMS — WHAT `START ONBOARDING` ACCEPTS

**R-41.57 is confirmed by the document's own words.** These terms *"take effect when you click
an 'Accept' button or checkbox … (the 'Effective Date')."* `Start onboarding` is the click.

Note the title has changed since anything on the tree: **Meta Business Messaging *and Meta
Business Agent* Technology Provider Terms**, Last Updated 2026-07-31. Accepting binds TDW to the
**Business Agents Terms** as well, which is a second product surface nobody has read.

### §2.2 Your Obligations to Customers — **stricter than the 2018 Service Provider clause**

> *You shall use the Applicable Platform(s) solely for the benefit of your Customers. You may
> only (i) access, use, and process any data obtained via … the Applicable Platform(s)
> ("Applicable Platform Data") **on behalf of the applicable Customer pursuant to their
> instructions**, and (ii) disclose Applicable Platform Data **solely to, or on behalf of, such
> Customer** … **You may not use Applicable Platform Data for any other purpose, including for
> your own purpose, or disclose it to any other third parties**, except as expressly permitted.*

Part 1 read the 2018 Service Provider clause as *"solely for the benefit of each of your
Clients."* This is that plus three teeth: **pursuant to their instructions**, **disclosure only
to or on behalf of that Customer**, and **an express bar on TDW's own purposes**.

F-41.22's arms reading is unchanged in scope but harder in standard: it is not enough that a
feature benefits the vendor — it must be **on her instruction**.

### §2.1 Onboarding · §2.3 Global DPA · §2.4 Customer Suspension · §2.5 Support

- No Customer may access the Platform until they have **accepted the WhatsApp Business Platform
  Terms** — *"for example, via embedded signup"*. **Embedded Signup is the acceptance
  mechanism**, which is why F8 rides v4 and why the flow-down (R-41.58) has a natural home.
- *"Company is responsible for its Customers' use … as if it was Company's own. Company and its
  Customers are **jointly and severally liable** for all acts and omissions."* Note this is
  **unconditional** here — the 2018 text made joint liability contingent on the Client not
  having accepted. This version does not.
- **The Global DPA is incorporated and TDW is deemed a "Third Party" thereunder.** Unread.
- **TDW must maintain an up-to-date list of every Customer and supply it on Meta's request.**
- Front-line support for the WhatsApp Business Platform is TDW's obligation, escalation only for
  what it cannot reasonably address.

### §5 No Resale — **and this corrects Part 1**

> *you will not … (i) resell Applicable Platforms, including … **charging a fee for your
> Customers' use of the WhatsApp Business Platform** (but this does not prohibit you from
> charging for any of your other products and services **unrelated to the use of the WhatsApp
> Business Platform**) … **You will expressly prohibit such activities under your agreement with
> your Customer.***

**PART 1 §3.5 IS WRONG AND I OWN IT.** Part 1 read the 2018 Price Transparency clause as
permitting a bundled charge subject to per-Client disclosure of Meta's cost. Read against the
current Tech Provider Terms and Cloud API §3.2, that is backwards:

- **Cloud API §3.2** permits charging Clients for Cloud API use **only** *"if you are authorized
  to resell Cloud API under separate agreement with Meta"* — and the disclosure obligation is a
  condition **of that authorization**, not a general permission.
- **Tech Provider §5** prohibits resale outright, absent such an agreement.

So **F-41.23 as chartered — the per-vendor "what Meta charged for your messages" line — is
premised on a permission TDW does not have.** It is not owed unless TDW is authorised to resell.

**The live question is the opposite one, and it is bigger:** the zero-commission **subscription**
must be for products *unrelated to the use of the WhatsApp Business Platform*. TDW's
subscription buys business infrastructure whose primary surface is WhatsApp. **Whether that is
"unrelated" is the same judgement as §4.7's primary-versus-ancillary, and it lands on the same
person: Meta, in its discretion.**

And §5's last sentence is a flow-down: **TDW must expressly prohibit resale in the vendor
agreement.** That is a sixth item for R-41.58's spec.

### §4.1, §6, §7 in brief
No holding out as Meta's agent; anti-corruption; Meta may modify at any time by posting;
termination for convenience on 30 days either way; **termination for cause immediately, with or
without notice, at Meta's sole discretion**; on termination TDW must immediately deactivate all
Technical Solutions.

---

## 3 · CLOUD API TERMS — the data posture, and one useful clarity

- **§4.2 · TDW is the Controller; Meta is the Processor.** Company Personal Data expressly
  includes *phone numbers, message content, personal identifiers, and message details.*
- TDW **instructs** Meta to aggregate and anonymise that data for Meta's own product
  benchmarking and analytics. Worth knowing when telling a vendor what happens to her data.
- **§4.5** — Meta deletes remaining Company Content within **90 days** of ceasing use.
  *"Meta does not provide an archiving service or any backup functionality, and you are solely
  responsible for creating backups."*
- **§4.4 Prohibited Data** — Cloud API is **not HIPAA compliant**; no data carrying statutory
  distribution limits. Low exposure for a wedding platform; recorded for completeness.
- **§7.1/§7.2/§7.3** repeat the Solution Provider obligations already covered.
- **Exhibit B** names sixteen sub-processors across the US, Ireland, Sweden and Denmark, with
  AWS only where Cloud API Local Storage is elected. **Relevant to any Indian data-residency
  question**, which no document on the tree has raised.

---

## 4 · THE MONEY CLAUSES, RE-READ AGAINST 09-23

Part 1 §4 flagged three clauses combining into a suspension risk. The new terms keep all three
and add two:

- **§3.8** Credit report — retained, and the *"during the term of this Agreement"* qualifier is
  **gone**.
- **§3.5–3.7** invoiced vs non-invoiced at Meta's sole discretion; funding instrument charged
  directly — retained.
- **§3.2** Suspension for non-payment **or for approaching the credit-line limit** — the
  approach-the-limit trigger is new.
- **§3.4 Service Credits** — new prepaid mechanism; credits are non-refundable and carry no
  monetary value.
- **§7.9 Reporting** — new: TDW must supply usage reports on request **within 30 days**.

**B4·1's RBI e-mandate item stands re-ranked to the top**: a lapsed Indian mandate is a failed
charge, and a failed charge is grounds to suspend the API the estate runs on.

---

## 5 · THE 09-23 DIFF — done now rather than on the day

| | Current (2025-10-15) | 2026-09-23 |
|---|---|---|
| Name | Meta Terms for WhatsApp **Business** | Meta Terms for WhatsApp Business **Platform** |
| Account model | business portfolio + WABA | business portfolio + WABA **+ "Messaging Account"** — new object, invoicing and currency attach to it |
| **AI** | silent | **§4.7 — the whole of §1 above** |
| Platform-data restrictions | silent | **§4.1 — no profiling of WhatsApp Users; no distribution of Platform Data incl. derived forms; survives termination** |
| Security | silent | **§2.3 — industry-standard security duty; Meta may compel deletion of user info on a determined breach** |
| Termination for convenience | 30 days' notice, up to 3 months' wind-down | **notice only — the wind-down is gone** |
| Governing law | California, N.D. Cal. / San Mateo | **clause absent from the preview** |
| Reporting | none | **§7.9 — usage reports within 30 days of request** |
| Beta / Feedback | none | **§4.5 — feedback assigned to Meta** |
| Deletion | Meta deletes on termination | **plus: Meta returns all Personal Data on request** |

**The two that matter are §4.7 and the loss of the wind-down period.** The first may decide
whether TDW may use the platform at all. The second means a termination for convenience now
stops the estate's messaging on notice, with no three-month tail to migrate in.

---

## 6 · WHAT THIS FILE OWES

1. **Meta Hosting Terms for Cloud API — DISCHARGED, 2026-09-08.** That URL now **301s to**
   `/legal/WhatsApp-Business-Platform-Cloud-API`, which is the text read above. **Meta has
   merged the hosting terms into the Cloud API Terms at its own redirect**, so the fourth
   document is not missing — it is the third. Recorded with today's date because a later reader
   finding the old URL in a citation will otherwise go looking for a document that no longer
   exists separately. **Nothing further owed from the founder on B4·2.**
2. **B4·4 — the model-provider read.** Anthropic's and DeepSeek's data-retention and training
   terms, derived and dated, against §4.7(b). **This is now the highest-value unstarted work in
   this seat's charter.**
3. **Unread and incorporated:** the Global DPA (TDW deemed a "Third Party"), the Meta Platform
   Terms, the Meta Commercial Terms, the Business Agents Terms, the MGPT, Meta's Data Security
   Terms, the WhatsApp Business Messaging Policy. **Incorporation by reference is not a
   formality**; §4.7 was invisible until someone read the document it lives in.

---

## 7 · RECORD LINE

```
B4·2 · PART 2 · read whole 2026-09-08 from founder's pastes
  Tech Provider Terms (2026-07-31) · Cloud API Terms + Exhibits (2026-04-02)
  Meta Terms for WhatsApp Business PLATFORM (2026-09-23 preview) — diff done, §5
still owed: Meta Hosting Terms for Cloud API
FINDINGS RAISED:
  §4.7(a) AI-Provider eligibility — is Victor primary or ancillary? Meta's sole discretion
  §4.7(b) no Platform Data to train/improve any AI model; survives termination → B4·4
  §4.1(b) no distribution of Platform Data to third parties, derived forms included,
          only exception a Solution Provider
  Tech Provider §2.2 — on the Customer's INSTRUCTION, not merely for her benefit
  Tech Provider §5 No Resale — CORRECTS Part 1 §3.5; F-41.23's premise fails
  §5 flow-down: vendor agreement must expressly prohibit resale (6th item for R-41.58)
  joint and several liability is UNCONDITIONAL in the 2026 text
  09-23: wind-down period gone; Messaging Account introduced; §7.9 reporting duty
CORRECTED BY THIS SEAT: Part 1 §3.5 (price transparency read backwards)
```
