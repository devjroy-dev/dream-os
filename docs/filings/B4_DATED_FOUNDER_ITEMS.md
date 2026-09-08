# FILING B4·1 — THE DATED FOUNDER ITEMS

**Base:** dream-os `68d92c0f51f3c59e7104881f582d37fa49c3480e`
**Seat:** CE-41 LE-B · 2026-09-08 · roadmap §3 item 11
**On the tree at this base.**

**This is not a filing.** It is the dated checklist the roadmap asks for: what each item needs
from the founder, and nothing else. No item here is delegable to a seat — every one is an
account, a card or a console tap only he holds.

**The rest of B4 — the Tech Provider Terms read-through (G6 item ZERO), the customer-terms
flow-down, Embedded Signup v4's prerequisites, ResellerClub — is NOT in this file.** That work
requires reading Meta's Tech Provider Terms in full and summarising every clause that binds TDW
and every flow-down it imposes on the vendor. It gets its own sitting and its own packet
(B4·2). Sketching it here would be the opposite of what "read in full" means, and the estate's
own ruling is that no terms acceptance happens on a document nobody has read whole.

---

## The dates, in order

| Date | Item | What it needs from the founder | If it slips |
|---|---|---|---|
| **THIS WEEK — ranked first, ahead of its own date** | **RBI e-mandate — Google Cloud billing (prepare now, due 10-01)** | Confirm the mandate on the card backing `tdw-business-solutions` can be re-authorised, and diarise 10-01. **Also: keep the WhatsApp credit line well above monthly spend (F-41.32).** | **This is the only item on this list that stops something already running, and it stops it quietly** — a lapsed Indian mandate is a declined charge, not an alert. Read against Meta Terms §3.5–3.8 (invoiced/non-invoiced at Meta's sole discretion; credit report; suspension) and the 09-23 change that lets Meta **suspend on *approaching* the credit limit**, not only on non-payment: a failed charge is grounds to suspend the API the whole estate runs on. |
| **2026-09-25** | **Meta pricing re-check (F-41.9)** | Open `developers.facebook.com/docs/whatsapp/pricing`. Read whether utility and service messages inside the customer service window become chargeable on 1 October. Report yes/no to the chair. | Nothing breaks. But the free-window claim is unverified, and if it is true the estate's whole nudge-and-reminder economy gains a per-message cost with no notice. Five minutes. |
| **when B3·2 runs** | **Brand-verify and publish in ONE sitting** | Google's compliant verification result is valid **seven days**. Verify branding, read the result, and press **Publish branding** in the same sitting — then move Publishing status to In production. | The status reverts to *Need to re-verify* and the check runs again for nothing. Verify on a Friday, publish the Monday week, and the week is lost. |
| **2026-10-01** | **RBI e-mandate — Google Cloud billing** | Reauthorise the billing mandate on the card backing `tdw-business-solutions`. Indian recurring-payment rules require re-authorisation; it does not renew itself. | **Payments lapse under the project.** APIs stop. This is the one on this list that breaks something already running. |
| **2026-10-15** | **Embedded Signup v2 ends** | Nothing, if F8 is built on **v4** as ruled. Recorded so nobody builds on v2 in the interim. | A build on v2 is dead on this date. Master §4 G6 already rules v4; this is the date behind that ruling. |
| **2026-10-20** | **Google Cloud console MFA** | Enrol MFA on `dev@thedreamwedding.in`. Also enrol on any account holding Owner or Editor on the project. | **Locked out of the console.** Note the ordering: this falls **seven days before** GBP eligibility. Locked out on the 20th means locked out through the 27th — the exact week the thing you have waited two months for unblocks. Enrol early; there is no reason to wait. |
| **2026-10-27** | **GBP API quota application** | Google Business Profile hits the 60-day profile age. Apply for API quota. Then enable the legacy **Google My Business API (v4)** — `TDW_INFRA_GOOGLE_OAUTH.md` §4 item 4 records it as **invisible in the API Library until quota is approved**, so it cannot be enabled in advance. | G2 s2 does not open. Also the trigger for **B3·3**: `business.manage` is re-declared then, under R-41.47, in its own packet. |

---

## Two things about this list

**The MFA date is the one worth moving.** Every other item has a reason to happen on its date.
MFA has no reason to wait and one sharp reason not to: it sits seven days before the only date
on this list the estate has been counting toward since August. Enrolling it this week costs ten
minutes and removes the single most annoying way October could go wrong.

**The RBI mandate is the only item that breaks a running thing — hence its re-rank to the head of the table.** The others block something
from starting. This one stops something already working, and it stops it quietly — a lapsed
mandate is a declined charge, not an alert.

---

## RECORD LINE

```
B4·1 · dated founder items
B3·2 day   brand-verify + publish, one sitting  done <DATE>  within 7-day window: <yes/no>
2026-09-25  Meta pricing re-check (F-41.9)      done <DATE>  result: <chargeable yes/no>
2026-10-01  RBI e-mandate reauthorised          done <DATE>
2026-10-15  ES v2 ends — building on v4         confirmed <DATE>
2026-10-20  console MFA enrolled                done <DATE>  accounts: <list>
2026-10-27  GBP quota applied                   done <DATE>  · GMB API v4 enabled <DATE>
                                                → triggers B3·3 (business.manage)
```
