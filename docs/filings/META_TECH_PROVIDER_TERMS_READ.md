# FILING B4·2 — THE TERMS READ WHOLE · PART 1 OF 2

**Base:** dream-os `2a0d838a4c99cedd5082b49340e5fe80a30da72e`
**Seat:** CE-41 LE-B · 2026-09-08 · roadmap §3 item 10 · master §4 G6 item ZERO
**Held in clone; the freeze holds until the two seals.**

**PART 1 covers what this seat could read at source.** Part 2 covers the three
`facebook.com/legal` documents, which refuse automated access and are held with the founder.
**This file is not the whole read-through and does not pretend to be.**

| Document | Host | State |
|---|---|---|
| Meta Terms for WhatsApp Business | whatsapp.com | **READ WHOLE** · Last Modified 2025-10-15 |
| WhatsApp Business Terms for **Service Providers** | whatsapp.com | **READ WHOLE** · Last Modified 2018-06-12 |
| WhatsApp Business Solution Terms | whatsapp.com | not yet read |
| WhatsApp Business Terms of Service | whatsapp.com | not yet read |
| Meta Business Messaging **Technology Provider Terms** | facebook.com | **BLOCKED — founder** |
| WhatsApp Business Platform Cloud API Terms | facebook.com | **BLOCKED — founder** |
| Meta Hosting Terms for Cloud API | facebook.com | **BLOCKED — founder** |

**THE WHOLE STACK IS BEING REPLACED ON 2026-09-23.** `whatsapp.com/legal` carries the notice
on the index page itself, not just on one document: *"We're updating this page as part of an
update to our terms for WhatsApp for Business. These changes will go into effect on September
23, 2026."* Per the chair: read the current version now, and **repeat this read as a diff when
the new text lands.** Fifteen days.

---

## 1 · THE ORDER OF PRECEDENCE (Meta Terms §4)

Which text wins matters more than any single clause, and Meta states it:

- Meta Terms for WhatsApp Business control over the Meta Terms, Meta Commercial Terms and other
  Meta service terms, as to the WhatsApp Business Solution.
- **WhatsApp Business Solution Terms** govern over the **WhatsApp Business Terms of Service**.
- **WhatsApp Business Terms for SERVICE PROVIDERS** govern over the **Solution Terms**.

So for TDW acting as a Tech Provider, the Service Provider terms sit at the **top** of the
WhatsApp stack. That is the document read below, and it is seven bullets long.

---

## 2 · THE FINDING THAT REFRAMES G6 ITEM ZERO

**These terms describe an architecture TDW does not currently run — and pressing
`Start onboarding` is the act that adopts it.**

Every obligation below is written around **each Client having its own WABA**: *"You are solely
responsible for creating a WABA account for each Client"*, *"you may not create a WABA on behalf
of your Client without that Client's request and consent"*, *"you must not block or prevent a
Client from accessing its WABA."*

TDW today sends everything from **one** WABA — The Dream Wedding Direct, `1739793260373677` —
across lanes it owns. Vendors are users of TDW's software, not Clients holding their own WABAs.
On that reading much of this document does not yet bind, because TDW has no Clients in its
sense.

**`Start onboarding` is what changes that.** It is not a form. It is the point at which vendors
become Clients with their own WABAs, and at which every obligation in §3 attaches. That is a
better reason for G6 item ZERO's caution than "we have not read it": the item is not a reading
formality, it is **the boundary between TDW being a business that messages and TDW being a
provider that is liable for other businesses' messaging.**

R9 — Introductions from her own WABA — is the same boundary approached from the product side.

---

## 3 · THE SERVICE PROVIDER TERMS, CLAUSE BY CLAUSE

Seven bullets. Each is named, then what it binds TDW to, then what it costs.

### 3.1 Scope and conflict
Applies in addition to the Solution Terms if WhatsApp authorises TDW to deploy the Solution on
Clients' behalf; **governs over the Solution Terms on conflict.**

### 3.2 Service Provider Role — **the data restriction**

> *You will use the WhatsApp Business Solution, and any and all data derived therefrom, solely
> for the benefit of each of your Clients. This provision survives any termination.*

**This is the clause the tree has been pointing at, and it is broader than "don't sell data."**
Three things follow, and each is a live design question, not a hypothetical:

1. **"Solely for the benefit of EACH of your Clients"** — singular, per Client. Data derived
   from vendor A's WhatsApp traffic used to benefit vendor B is outside it on a plain reading.
   **The concierge fan-out and peer referrals both move information between vendors.** Whether
   they move *Solution-derived data* or only TDW's own platform data is the question, and it is
   answerable only by looking at what the arms actually read.
2. **Aggregate analytics and any cross-vendor benchmark** sit in the same place.
3. **Model prompts.** R-41.49 already rules that no Google-sourced data enters any model prompt.
   This clause raises the identical question for WhatsApp-derived data and the estate's
   processors. A prompt built from one vendor's messages, serving that vendor, is squarely
   "for the benefit of" that Client. A shared context, a fine-tune, or a cross-vendor retrieval
   is not.
   **Reported, not ruled. This seat does not know what the agent arms read**, and guessing at a
   compliance conclusion from a spec rather than from code is the failure this seat has already
   named twice.
4. **It survives termination.** A vendor who leaves does not release TDW from it.

### 3.3 Client Management — **the flow-down (F-K3.12), and it is severe**

TDW **must ensure every Client has accepted the WhatsApp Business Solution Terms.** If TDW has
not:

> *you represent and warrant that you have accepted the WhatsApp Business Solution Terms on
> behalf of your Client, that you are authorized by your Client to do so, and that you are
> **jointly and severally liable** for, and will indemnify us for any harm that results from,
> your Client's acts and omissions … **as if your Client's acts and omissions were your own.***

**TDW becomes liable for every vendor's messaging behaviour as though TDW sent it.** One vendor
spamming from her own WABA is TDW's act, in Meta's eyes, unless she has accepted the Solution
Terms herself.

Also in this bullet:
- May not assist or encourage a Client to breach the Solution Terms.
- **Must timely notify WhatsApp** on knowing or reasonably surmising a Client has breached. An
  affirmative reporting duty about TDW's own customers.
- **May not create a WABA for a Client without that Client's request and consent.**
- **May not create a WABA intending it for a future Client** without written consent — no
  pre-provisioning.
- Must not block a Client from its own WABA; **must** block, disable or delete one on WhatsApp's
  written request.
- Only allow WABA access to those the Client authorises.

**WHAT THE CUSTOMER TERMS MUST CARRY** — the flow-down, as a spec, not as copy. This seat drafts
words only when asked and this has not been asked:
1. Each vendor **accepts the WhatsApp Business Solution Terms** by name and link, as her own act.
2. She acknowledges TDW **must report** a suspected breach to WhatsApp.
3. She **requests and consents** to a WABA being created for her — explicit, logged, dated.
4. She may **take her WABA elsewhere** (see 3.6) and TDW will assist within 30 days.
5. TDW may **suspend or delete** her WABA where WhatsApp requires it.

### 3.4 Technical Integration
TDW is solely responsible for creating each Client's WABA, for **front-line technical and
customer support** with escalation to Meta only for what it cannot address, and for all network
infrastructure, TLS and APIs between the Client and WhatsApp. WhatsApp owns only the network,
the Business Client and the APIs. **Support is an obligation, not a courtesy.**

### 3.5 Price Transparency — **and it collides with the subscription model**

TDW may charge what it likes, bundled or not. **But:**

> *you will clearly disclose to each Client, separate from your fees, the amount that Facebook
> charged you for the Client's use of the WhatsApp Business APIs, and the amount that you charge
> the Client for its use.*

The estate's north star is a **zero-commission software subscription** — one price, no
per-message billing to the vendor. That is permitted. **What is not optional is the disclosure:
even inside a bundle, each Client must be shown, separately, what Meta charged for her usage.**

So the vendor's billing surface owes a line the estate has never designed: *what Meta charged
for your messages this month*. At `Rs 0.12` utility and `Rs 0.86` marketing, that is a real
number per vendor per month, and it needs the per-send cost data the receipt arms already hold.

**Also:** *"If a Client requests that we send them any information (including billing
information) related to their WABA, we reserve the right to do so."* Meta may tell a vendor
directly what her usage cost. **A vendor can therefore check TDW's disclosure against Meta's.**
Another reason the number must be right rather than approximate.

### 3.6 Portability — **and it is a deletion obligation**

On a Client's request, within **30 calendar days**, TDW must assist the transfer of her WABA
**and all related data** to her chosen new provider or her own systems; then relinquish all
control; **and promptly delete any WABA data and information from TDW's own systems** unless
Meta or the Client says otherwise.

**That is an export path and a purge path that do not exist.** It is not a policy line — it is
an engineering obligation with a 30-day clock, and it attaches the moment vendors hold their own
WABAs. Naming it now because it is the kind of thing that gets discovered when the first vendor
asks.

### 3.7 Change
WhatsApp may update these terms; continued use is consent. **No notice period is promised here**
— unlike Meta Terms §7.1, which says Meta will notify before a Change unless law requires
otherwise. Worth knowing which document is being read when someone says "they have to tell us."

---

## 4 · FROM THE META TERMS, THE THREE THAT COMBINE

Read whole; most of it belongs to B4·3. Three clauses combine into one risk:

- **§5.4 / §5.6** — Meta classifies a business as invoiced or non-invoiced **at its sole
  discretion**. Non-invoiced means a funding instrument is charged directly.
- **§5.7** — *"You agree that we may obtain your business credit report from a credit bureau."*
- **§5.8** — non-payment permits **suspension of API access**, with notice only *endeavored*.

Set beside B4·1's **RBI e-mandate on 2026-10-01**: a lapsed Indian recurring mandate is a failed
charge on a funding instrument, and a failed charge is grounds to suspend the API the whole
estate runs on. **That item is not billing admin. It is the one that can turn the lights off**,
and B4·1 is re-marked accordingly.

---

## 5 · WHAT PART 2 NEEDS FROM THE FOUNDER

`facebook.com/legal/*` is robots-disallowed — a hard block, not a routing failure. This seat
will not read a document the estate is about to **accept** from a BSP's mirror; a third party's
copy of a legal text drifts a version behind, and G6 item ZERO exists because nobody had read
the real one.

Open each, select all, paste back or save and upload:

```
https://www.facebook.com/legal/BM-tech-provider-terms
https://www.facebook.com/legal/WhatsApp-Business-Platform-Cloud-API
https://www.facebook.com/legal/Meta-Hosting-Terms-Cloud-API
```

And, if it will render, the preview of the text that replaces all of this on 09-23:

```
https://www.facebook.com/legal/Meta-Terms-for-WhatsApp-Business-Platform-preview
```

**Still unread and reachable by this seat** — the Solution Terms and the Business Terms of
Service, both on whatsapp.com. They come in Part 2 alongside the pasted three, so the
read-through is one document rather than three fragments.

---

## 6 · RECORD LINE

```
B4·2 · the terms read whole · PART 1
read whole 2026-09-08: Meta Terms for WhatsApp Business (mod 2025-10-15);
                       WhatsApp Business Terms for Service Providers (mod 2018-06-12)
blocked, held with founder: BM-tech-provider-terms · Cloud-API · Meta-Hosting-Terms
unread, reachable: Business Solution Terms · Business Terms of Service
WHOLE STACK REPLACED 2026-09-23 — this read repeats as a diff when it lands
findings raised: the Start-onboarding boundary (§2) · "solely for the benefit of each
  Client", survives termination (§3.2) · joint and several liability flow-down (§3.3) ·
  per-Client Meta-cost disclosure inside a bundle (§3.5) · 30-day WABA export + purge (§3.6)
NOT RULED by this seat: whether any agent arm or cross-vendor feature reads
  Solution-derived data. Requires reading the arms, not the specs.
```
