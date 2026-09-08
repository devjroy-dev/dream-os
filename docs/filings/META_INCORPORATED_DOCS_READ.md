# FILING B4·7 — F-41.33 · THE INCORPORATED DOCUMENTS, READ WHOLE

**Base:** dream-os `18e46be19684b65ad51ba44049694c389aeb9093`
**Seat:** CE-41 LE-B · 2026-09-08 · **held in clone; the freeze holds.**

Read whole today from the founder's pastes, one sitting:

| Document | Last Updated |
|---|---|
| Meta Business Agents and Platform TOS **+ Business System Integrations Addendum + Exhibit A** | **2026-07-16** |
| Global Data Protection Addendum | 2026-03-20 |
| Meta Global Processor Terms (MGPT) | 2026-03-20 |
| Meta Commercial Terms | effective 2024-03-06 |
| **Meta Platform Terms** | **2026-02-03** |
| Data Security Terms | effective 2023-04-25 |

Plus, read at source earlier today: **WhatsApp Business Solution Terms (2026-03-06)** — which is
where the AI Providers clause actually lives, in force since **15 January 2026**.

**F-41.33 is closed on the reading.** What follows is what was in them.

---

## 0 · A CORRECTION I OWE FIRST

When I handed the founder the six links, I described the **Data Security Terms** as *"the
security standard TDW is measured against if anything ever goes wrong."*

**That is backwards.** Read: *"These Data Security Terms describe the minimum security standards
that **Meta maintains**"* — they are Meta's commitments to TDW about Meta's own data centres,
personnel screening and incident response. They impose nothing on TDW.

**TDW's own security obligations live elsewhere** — Meta Platform Terms §6 and Global DPA §3 —
and they are considerably more demanding than the document I mislabelled. Corrected here rather
than quietly.

---

## 1 · THE FOUR THINGS NOBODY HAS PRICED

### 1.1 · Meta can demand **proof of written agreements** with Anthropic and DeepSeek

**Meta Platform Terms §5.a.i:** TDW *"will not use a Service Provider in connection with your use
of Platform or Processing of Platform Data unless such Service Provider **first agrees in
writing**"* to process Platform Data solely for TDW, at TDW's direction, *"and for no other
individual or entity and for no other purpose, **including for the Service Provider's own
purposes**."*

**And §5.a.iv:** *"Upon our request, you must provide a list of your Service Providers and
Sub-Service Providers including up-to-date contact information for each, **the types and volume
of Platform Data shared, and proof of written agreements** with your Service Providers."*

**This converts B4·4's founder email from prudence into a documented requirement.** The estate
does not need DeepSeek's answer merely to feel comfortable — **Meta can ask for the paper.** The
same applies to Anthropic, where the published commitment is good but is not a written agreement
naming TDW.

**§5.a.v:** Meta may prohibit TDW's use of any Service Provider it believes has violated the
terms, on notice, and TDW must stop promptly. **A provider decision is not wholly TDW's.**

### 1.2 · Per-Client data segregation — an architectural obligation

**Platform Terms §5.b.ii.2:** *"You will ensure that Platform Data you maintain **on behalf of
one Client is maintained separately from that of other Clients**."*

This bites the day R9 J2 makes vendors Clients. TDW runs one Supabase database with vendor rows
in shared tables. **Whether row-level separation satisfies "maintained separately" is a real
question and this seat does not answer it** — but it is an architecture question, not a policy
one, and it should be asked before onboarding rather than after.

**§5.b.ii.1** repeats the standard already found twice today: on behalf of and at the direction
of the Client, *"and not for your own purposes or another Client's or entity's purposes."* Three
documents now say the same thing in different words. **It is the estate's central constraint.**

### 1.3 · Meta's audit rights, and TDW pays if they find something

**Platform Terms §7.c.** Meta or third-party auditors may audit **once a calendar year**, or
more often on a *Necessary Condition* (which includes Meta merely **suspecting** a violation).
Ten business days' notice, or less if Meta decides. TDW must provide *"all necessary physical and
remote access to your IT Systems and Records"*, make knowledgeable personnel available for
questioning, and use commercially reasonable efforts to obtain the same from its Service
Providers.

**§7.c.vi:** *"If an Audit reveals any non-compliance by you or your Service Provider(s) then you
will **reimburse us for all of our reasonable costs and expenses** associated with conducting the
Audit and any related follow-up Audits."*

**§7.c.vii:** audit rights **survive one year past** TDW demonstrating it has stopped processing
and deleted all Platform Data.

**Nothing on the tree has ever mentioned an audit right.** It is not a reason for alarm; it is a
reason the paper at §1.1 should exist before it is asked for.

### 1.4 · Unused permissions can be suspended after **28 days**

**Platform Terms §7.e.iii:** *"We may suspend or end your App's access to any Platform APIs,
permissions, or features that your App has **not used or accessed within a 28-day period** with
or without notice to you."*

**This lands directly on B2's sequencing.** The estate's build-dark law says: build the feature,
walk it, film it, file, then flip on grant. If a permission is granted and then **not exercised
for 28 days** while the flag stays off, Meta may take it back — silently.

**Consequence for B2:** a granted Instagram permission needs a real call inside 28 days, or the
grant is at risk. That argues for flipping each permission's flag on a test account immediately
after grant rather than waiting for the room's release. **Reported for the chair; it may want a
standing rule.**

---

## 2 · THE BUSINESS AGENTS TERMS — the asymmetry, stated plainly

TDW uses no Business Agents. The Tech Provider Terms bind TDW to these anyway. Two clauses
decide whether that should ever change.

**"Rights You Provide Meta":** *"you grant to Meta … a **perpetual**, worldwide, non-exclusive,
fully paid and royalty-free license to use any Input for the purposes described in these Terms.
**This license survives termination** of these Terms by any party, for any reason."*

And Meta may use Content *"to provide, develop, improve and maintain Meta services and features
(for example, **to improve our artificial intelligence models and algorithms**, including
Business Agents…)"* — through automated **or human** review, and through third-party vendors.

**Set that beside the Solution Terms' AI clause and the asymmetry is exact:**

> TDW **may not** let WhatsApp Business Solution Data — including derived forms — be used to
> train or improve **any** AI model.
> Meta **may** use Input from Business Agents to improve **Meta's** AI models, perpetually,
> surviving termination.

**That is not a contradiction and not a grievance — it is the deal.** But it means enabling
Business Agents is a decision about whose models learn from TDW's vendors' words, and it should
be made with that sentence in front of the founder.

**Three more, from the same document:**
- **Meta may suppress TDW's own web chat** in interfaces where Business Agents are deployed, and
  **message TDW's end-users proactively on TDW's behalf.**
- The Addendum defines *Business System Data* to include *"Company's contact lists and **prior
  chat history on the WhatsApp Business app**"* — onboarding hands Meta the history.
- **Liability cap: the greater of $100 or what TDW has paid Meta in the past twelve months.**
  The same cap appears in the Commercial Terms.

---

## 3 · THE DPA, THE MGPT, AND WHICH HAT TDW WEARS

**Global DPA §1.4:** Company is deemed a **Service Provider and Processor** *"save to the extent
where Company is identified only as a 'Third Party' or 'Controller' in the Agreement."* The Tech
Provider Terms §2.3 say TDW **is deemed a "Third Party"** — so **DPA §2.3 governs**, not §2.2:

- Meta may take enforcement action — limit, suspend or terminate access — on its own **reasonable
  discretion** that TDW violated the Meta Terms.
- **Annual certification on request:** TDW must certify its purposes and uses for Meta Platforms
  Data and that each complies.
- **Regular monitoring**, with which TDW must promptly cooperate.
- **Data Incident notice to `vendor-incident@meta.com` without undue delay** — that address is
  now the estate's incident channel and appears nowhere on the tree.

**The MGPT is the other direction:** it governs **Meta as processor of TDW's** data. Its live
obligation on TDW is §2.2 — **do not send Meta data about children under 13, health data,
financial data or other sensitive categories.** A wedding platform handles dates, budgets and
photographs; that is fine, but the couple's data is the one to watch.

**Note the retention default:** under MGPT §2.1(d), if TDW does not give **written notification
within 30 days** of termination requesting return of its data, Meta deletes it per its own
retention policies. **A 30-day window nobody has diarised.**

---

## 4 · THE COMMERCIAL TERMS — where a dispute goes

TDW is in India, so the US arbitration clause does not apply. Instead:
- against **Meta Platforms Ireland Limited** → exclusively **the courts of the Republic of
  Ireland**, Irish law;
- against **Meta Platforms, Inc.** → **N.D. Cal. or San Mateo County**, California law;
- against **both** → California.

**Liability cap: the greater of USD 100 or what TDW paid Meta in the past twelve months.** At
current WhatsApp spend that is USD 100.

---

## 5 · WHAT F-41.33 LEAVES OPEN

1. **Does row-level separation satisfy §5.b.ii.2?** Architecture, not policy. Ask before
   onboarding.
2. **The 28-day rule (§1.4)** — does the chair want a standing rule that every granted permission
   is exercised inside 28 days?
3. **The written Service Provider agreements** with Anthropic and DeepSeek (§1.1). The founder's
   emails are the first step; a written term naming TDW is the artifact.
4. **`vendor-incident@meta.com`** belongs in the estate's incident runbook, which does not exist.
5. **Unread and still incorporated:** the DPA's four jurisdiction-specific annexes (**APAC applies
   to India**), the Global Data Transfer Addendum, the Business Tools Terms, the Lead Ad Terms,
   the Meta Terms of Service, and the WhatsApp Business Messaging Policy. **Incorporation by
   reference does not bottom out** — it is turtles down. The chair should decide where to stop.

---

## 6 · RECORD LINE

```
B4·7 · F-41.33 · six documents read whole from founder's pastes, 2026-09-08
CORRECTED BY THIS SEAT: Data Security Terms are META's commitments to TDW, not TDW's
  obligations. TDW's security duties are Platform Terms §6 + Global DPA §3.
FINDINGS:
  Platform §5.a.iv — Meta may demand PROOF OF WRITTEN AGREEMENTS with Anthropic/DeepSeek
  Platform §5.b.ii.2 — per-Client data segregation; architectural, bites at R9 J2
  Platform §7.c — annual audit, TDW reimburses costs if non-compliance found, survives +1yr
  Platform §7.e.iii — permissions unused for 28 DAYS may be suspended; lands on B2 sequencing
  Business Agents — Meta gets a PERPETUAL licence to Input, surviving termination, expressly
    to improve Meta's AI models; the exact mirror of what TDW is forbidden
  DPA §2.3 — TDW is a "Third Party": annual certification, regular monitoring,
    incident notice to vendor-incident@meta.com
  MGPT §2.1(d) — 30-day written window post-termination or Meta deletes on its own schedule
  Commercial Terms — India: Ireland courts vs Meta Ireland; liability cap USD 100
OPEN: row-level separation question · a 28-day standing rule · the written provider terms ·
  an incident runbook · APAC annex and five further incorporated documents
```
