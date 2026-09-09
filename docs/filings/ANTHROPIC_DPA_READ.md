# FILING B4·10 — ANTHROPIC'S DPA · F-41.48 CLOSED · F-41.121's MECHANISM

**Base:** dream-os `e660d0e7401578230555716e4ddf05cafe3c7bd7`
**Seat:** CE-41 LE-B · 2026-09-09 · read against the chair's verbatim transcription of
`anthropic.com/legal/data-processing-addendum`, **Effective 2025-02-24**, incorporated into the
Commercial Terms (effective 2025-06-17) at §C and §M.9.

**CONFLICT DECLARED TWICE.** This seat is made by Anthropic; so is the chair who fetched the
page. Every clause below carries its section number and the document's canonical URL, so the
whole read is checkable in a minute by anyone who is not conflicted. **That is the only defence
either of us has, and it is why the clauses are cited rather than summarised.**

---

## 1 · F-41.48 (ANTHROPIC) — CONFIRMED CLOSED, WITH ONE LIMB NAMED

**Meta Platform Terms §5.a.i** requires a Service Provider to agree **in writing** to:

> *Use Platform and Process Platform Data **solely for you and at your direction** in order to
> provide services you requested in a manner that is consistent with these Terms, all other
> applicable terms and policies, **and your privacy policy**, and **for no other individual or
> entity and for no other purpose, including for the Service Provider's own purposes**.*

Against the DPA, limb by limb:

| §5.a.i limb | Anthropic's clause | Met? |
|---|---|---|
| solely for you, at your direction | **§B.2** — process only to provide or maintain the Services, in compliance with Customer's documented instructions | **yes** |
| for no other purpose, incl. the provider's own | **§B.3.b** — not retain, use or disclose outside the direct business relationship or for any purpose other than Schedule 1 Part B | **yes** |
| for no other individual or entity | **§B.3.c** — no combining with personal data received from or about another person | **yes** |
| not sold or shared | **§B.3.a** | **yes** |
| sub-provider bound in writing | **§C.2** — subprocessors bound by substantially-as-protective terms; Anthropic remains liable | **yes, with a note below** |
| consistent with **your privacy policy** | **not stated** | **see §1a** |

**Plus Commercial Terms §B** — *"Anthropic may not train models on Customer Content from
Services"* — which is the training limb F-41.48 already had.

**F-41.48 IS CLOSED FOR ANTHROPIC.** The artefact producible under Platform Terms §5.a.iv is
the DPA at its URL with its effective date, plus the Console acceptance of the Commercial Terms
that incorporates it at §C.

### 1a · Two refinements, neither of which reopens it

**(i) The privacy-policy limb is not literally matched.** §5.a.i wants processing consistent
with *TDW's own privacy policy*; §B.2 binds Anthropic to *TDW's documented instructions and the
Agreement*, which does not name the policy. **In practice the two converge** — TDW's
instructions cannot lawfully exceed its own policy, and APAC §3.2 independently binds TDW to
process only as its policy describes. **Named because a strict reader comparing the two
documents will see it, and it is better found here than in a Meta audit under §7.c.**

**(ii) Scope: "Customer Personal Data" is narrower than "Platform Data."** Meta's glossary
defines Platform Data to include *anonymized, aggregate, or derived* forms; Anthropic's DPA
governs the **personal-data slice**. The residue is not uncovered — **Commercial Terms §B reaches
all Customer Content, personal or not** — but the two documents cover it *together*, and anyone
citing only the DPA would be citing the narrower one.

---

## 2 · F-41.121 — THE US LEG, AND WHY THE SCCs ARE NOT THE INSTRUMENT

**The chair's reading is confirmed at the clause.** §I.1 incorporates SCC Module Two/Three
*"to the extent required by **Applicable Data Protection Laws**"* — a conditional, GDPR-triggered
incorporation. **Message content collected in India is not GDPR data, so the condition is not
met and the SCCs are not the mechanism for TDW's transfers.**

**What is the mechanism is the DPA itself**, which supplies exactly the standard form an Indian
business relies on under the DPDP Act's regime — transfer permitted except to countries the
central government notifies as restricted, and the United States is not among them:

- **purpose limitation** — §B.2, §B.3
- **security measures** — Schedule 2: AES-256 at rest, TLS 1.2+ in transit, MFA on all systems
  processing Customer Data, least-privilege RBAC, annual third-party audits, annual external
  penetration testing, logical separation of customer data
- **breach notice within 48 hours** — §G.1
- **deletion within 30 days of termination**, subprocessors included — §H.1
- **transfer-impact support** — §I.4, Anthropic to provide information reasonably necessary for
  TDW to complete a transfer impact assessment

**So the answer to "by what instrument did it cross the border" is: a processor contract meeting
the standard form, named and dated.** Not a novel instrument, exactly as the founder ruled.

**Z.ai's DPA sits beside it** for the Singapore leg (F-41.34 — processor only on customer
instruction, content not stored, §3 Singapore), **though B4·5 found no live `glm` route**, so
that leg may currently carry nothing.

**DeepSeek remains the gap.** No DPA was found; the estate has no processor contract, no
security schedule, no breach clock and no deletion term for that leg. **F-41.121's remainder and
F-41.48's open half are the same missing document, and it is the same unanswered email.**

### One operational fact worth the founder knowing

**Two 48-hour clocks sit in series.** Anthropic notifies TDW within 48 hours of becoming aware
(§G.1); TDW notifies Meta within 48 hours under APAC §3.6, running from **TDW's own** awareness.
**There is no cascade failure** — TDW's clock starts when TDW learns. But the elapsed time from
incident to Meta can be roughly **four days**, which is a fact to plan around rather than a
breach to fix.

---

## 3 · THE TRANSFER PARAGRAPH — DRAFTED, NOT VETOED

**PROPOSED. NOT ON ANY SURFACE.** For `/privacy`, beside §5's Google section that A4 cut. One
paragraph, plain, for a wedding vendor to read. **The founder rules the words.**

> **Where your information is processed**
>
> The Dream Wedding is based in India and stores your information in India. To provide some
> features — such as the assistant that helps you write and reply — we send the necessary
> information to specialist technology providers outside India, who process it only on our
> instructions and only to provide that feature. They are not permitted to use it for their own
> purposes, to share it, or to train their AI models on it, and they are required to protect it
> with encryption, access controls and independent security audits, to tell us quickly if
> anything goes wrong, and to delete it when we ask. We choose providers who commit to this in
> writing, and we do not send your information to any country the Indian government has
> restricted.

**Why each clause is there:**

| Clause | Discharges |
|---|---|
| based in India, stores in India | sets the baseline the transfer departs from |
| *the necessary information*, *only to provide that feature* | purpose limitation, §B.2 — and it is also APAC §3.2's boundary: the policy is what the estate may then do |
| not for their own purposes, not shared, **not to train their AI models** | §B.3.a/b, Commercial Terms §B — **and R-41.49, which is estate law** |
| encryption, access controls, independent audits | Schedule 2, in a vendor's words |
| tell us quickly if anything goes wrong | §G.1 |
| delete it when we ask | §H.1 |
| **commit to this in writing** | Platform Terms §5.a.i — the sentence that makes the paragraph true only while it is true |
| no restricted country | the DPDP regime, stated without naming a statute |

**Three notes before the veto.**

1. **The paragraph is drafted to be true of Anthropic and Z.ai and NOT YET true of DeepSeek.**
   *"We choose providers who commit to this in writing"* is a claim about every provider. **If
   DeepSeek carries WhatsApp-derived content when this ships and has no written term, the
   sentence is false and the policy becomes the violation** — the same trap R-41.49's AI line
   carries. **The paragraph should ship after the DeepSeek answer, or the sentence softened.**
   This seat will not soften it silently.
2. **No provider is named.** Naming them is defensible and some policies do it, but it commits
   the estate to amending the page on every provider change. The obligations are named instead,
   which is what a reader needs.
3. **It says nothing the estate does not do.** No claim of certification, no standard the
   providers have not actually given.

---

## 4 · RECORD LINE

```
B4·10 · Anthropic DPA read, 2026-09-09, chair's verbatim transcription at source
  anthropic.com/legal/data-processing-addendum · Effective 2025-02-24 · Commercial Terms §C
F-41.48 (ANTHROPIC) CLOSED. §B.2 + §B.3.a/b/c + §C.2 + Commercial Terms §B satisfy Platform
  Terms §5.a.i. Artefact = the DPA URL + effective date + Console acceptance.
  NAMED, not reopening: the "consistent with your privacy policy" limb is not literally
  matched (§B.2 says documented instructions); and "Customer Personal Data" is narrower
  than Meta's "Platform Data" — Commercial Terms §B covers the residue.
F-41.121 US LEG: the SCCs are NOT the instrument (§I.1 is GDPR-conditional; India-collected
  data does not trigger it). THE DPA ITSELF IS THE MECHANISM — purpose limitation,
  Schedule 2 security, §G.1's 48h breach notice, §H.1's 30-day deletion, §I.4 TIA support.
  Z.ai's DPA beside it for Singapore (though no live glm route). DEEPSEEK IS THE GAP —
  same missing document as F-41.48's open half, same unanswered email.
TWO 48-HOUR CLOCKS IN SERIES: Anthropic→TDW (§G.1), TDW→Meta (APAC §3.6). No cascade
  failure; incident-to-Meta can be ~4 days. Plan around it.
TRANSFER PARAGRAPH DRAFTED for /privacy, founder's veto. SHIPS AFTER THE DEEPSEEK ANSWER
  or the "commit to this in writing" sentence is softened — not silently.
```
