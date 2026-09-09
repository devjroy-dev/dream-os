# FILING B1 — THE CONCIERGE TEMPLATES AND THE INTRODUCTION · SEALED

**Base:** dream-os `33f8c15bce86ebdc7184a1d7813058ff917a54b8`
**Seat:** CE-41 LE-B (the filing seat) · **Sealed by the chair 2026-09-08, 12:27 IST**
**WABA:** The Dream Wedding Direct `1739793260373677` · business portfolio `995204059832918`
**Rulings applied:** R-41.4 (a/b/c) · R-41.11 · R-41.13 · R-41.30 · R-41.31 · R-40.58 · R-40.128 n/a
**Nothing here is code.** No send arm exists for any of the four. Every one is dark by absence,
not by gate — which is a gap, not a comfort, and is named again at §5.

---

## 1 · WHAT WAS FILED, AND WHAT STANDS

Four bodies, drafted by this seat against R-41.4/.11, vetoed and filed by the founder from
WhatsApp Manager on his own glass, 2026-09-08. All four **Active** at 12:27 IST.

| Meta name | Filed as | Stands as | Status | Meta ID | Lane |
|---|---|---|---|---|---|
| `tdw_assist_lead_outside` | UTILITY | **MARKETING** | Active – Quality pending | `1627376372249131` | marketing (R-41.13) |
| `tdw_assist_found_vendor` | UTILITY | UTILITY | Active – Quality pending | `3160852754105015` | bride |
| `tdw_assist_found_outside` | UTILITY | UTILITY | Active – Quality pending | `3115277355330375` | bride |
| `tdw_introduction` | MARKETING | MARKETING | Active – Quality pending | `1757650692328688` | her WABA on R9; vendor line for J1 |

Bodies, variables, buttons and the per-body compliance provenance are in
`docs/TEMPLATES.md` §2 entries **10–13**; the tracker rows are §3 rows **10–13**.
One template moved category at review. One was filed Marketing by design. Two held Utility.

**The Manager banner is not about these.** *"2 of your utility templates were flagged or
reclassified as marketing"* names **earlier submissions**, founder-confirmed. There is no
24-hour clock on B1 and no appeal is owed. Recorded because the banner is standing and will
be read again by someone who does not know this.

---

## 2 · THE KNOWN HOLE, AND ITS INSTRUMENT (R-41.30)

**Course (a) is ruled: accept Marketing on `tdw_assist_lead_outside`.** No appeal, no re-file,
no loop. The chair's reason, recorded as the reason: Meta's Utility definition needs a
transaction or a request *the recipient made*, and an outsider vendor made none. The body is
honest; the category is Meta's.

**The hole.** As MARKETING, the outsider lead alert is subject to Meta's per-user marketing
template message limits — the `131049` family, a cap on how many marketing templates any one
WhatsApp user receives from any business. Its recipients have, by construction, never messaged
TDW. That is the most exposed class there is, and it is the exact failure F-40.176 was opened
against: **the throttle hits hardest the vendors who most need the alert.** For this one body
the Utility cure that answered F-40.176 is unavailable at any wording.

**The instrument.** `131049` returns **synchronously on the send call** — it is not a webhook
receipt and does not need the router. Therefore the concierge forward arm (seat A, packet A2)
records on `assistance_forwards`, per R-41.15's columns:

- `status = 'failed'`
- `error_code = 131049`

and the admin queue renders that row as **not delivered — marketing limit**, a state distinct
from *delivered* and distinct from *delivered and ignored*. A throttled outsider is visible in
the queue and re-forwardable by the founder's hand. She is not silently lost.

**The second cost on the same ruling — the price (chair's addition to R-41.30's record).**
Derived at Meta's own pricing page 2026-09-08 (`developers.facebook.com/docs/whatsapp/pricing`):
per-message pricing since 2025-07-01; **utility templates delivered inside an open customer
service window are free**; **marketing is charged on every delivery**; and **volume tiers exist
for utility and authentication only — marketing carries no discount at any scale.** India moved
to INR billing in January 2026, which the Manager panel confirms.

The rupee figures are **not** derived at Meta — the rate card renders as an interactive element
that did not yield numbers to this seat. Four independent BSP rate cards fetched the same day
agree on India 2026: utility `Rs 0.12` per delivered message, marketing `Rs 0.86`. **The
estate's own panel corroborates the utility figure to the paisa** — `tdw_referral_alert` shows
`Rs 0.23` spent across 2 delivered, which is `Rs 0.12` each, the published list rate.

So the reclassification's price is not simply 7.5×. It is: charged on **every** send with no
window that can ever make it free — and the recipient is a stranger, so no customer service
window can exist by construction; **no volume discount ever**; against a Utility alternative
that would often have been **nothing at all**, since the concierge's on-platform recipients are
frequently inside an open window. At roadmap §6's proposed three-vendor fan-out that is
`Rs 2.59` per category per request where Utility would have been `Rs 0.35` or free.

**The ruling does not move on price.** The category is Meta's, not ours, and delivery was
always the argument. This is the record being complete.

**This is the whole of the cure and it is deliberately small.** It does not stop the throttle;
it makes the throttle legible. The walk that would close this remains what the G13_R5 veto
document said it was, and it is **not** the approval mail: *a real alert arriving on the handset
of an outsider who has not messaged us in a fortnight.*

**Owed to J1 (R-41.11), by the same reasoning.** `tdw_introduction` is Marketing by design and
every recipient is a stranger to the WABA, so the identical instrument is owed on the
Introductions arm — the error code recorded per send, and the vendor told *not delivered*.
R-41.11 forbids follow-up to an unanswered introduction; without the instrument she reads
Meta's silence as the person's answer. Named here for J1's seat.

---

## 3 · ROWS FOR MASTER §6 (the chair writes the table; the seat hands the rows)

| Gate | Blocks | State 2026-09-08 |
|---|---|---|
| Template `tdw_assist_lead_outside` (`1627376372249131`) | Concierge outsider forward (A2) | Filed and Active 09-08. Filed UTILITY, **approved MARKETING**. R-41.30 course (a): accepted, no appeal. `131049` exposure named; instrument = `status`/`error_code` on `assistance_forwards`. |
| Template `tdw_assist_found_vendor` (`3160852754105015`) | Concierge bride reply, on-platform (A2) | Filed and Active 09-08, UTILITY as filed. |
| Template `tdw_assist_found_outside` (`3115277355330375`) | Concierge bride reply, outsider (A2) | Filed and Active 09-08, UTILITY as filed. No button; handle only, no phone (roadmap §7). |
| Template `tdw_introduction` (`1757650692328688`) | R9 J1 Introductions | Filed and Active 09-08, MARKETING as filed (R-41.11). Handle-only twin chartered, unfiled (R-41.31). |
| Template `tdw_introduction_handle` | R9 J1 Introductions, handle shape | **Not filed** — B1b packet, at the founder's next Manager session (R-41.31). |

Master §6's table header still reads *State 2026-09-02* and predates Amendment 3; the four rows
above are current as of 2026-09-08.

---

## 4 · WHAT THE FILING SETTLED, AND WHAT IT DID NOT

**Settled by the act of filing** — the bodies went in as drafted, so four opens from Record
Note 00 are answered: the budget renders as a single figure in `Rs X,XX,XXX` grouping (wallet
law held on the panel render, *Rs 1,50,000*); the WhatsApp link in `assist_found_outside` stays
dropped; `STOP REQUESTS` stays on the outsider alert; and the near-duplicate risk between the
two `found_` bodies cleared — both accepted, neither refused as duplicate content.

**Not settled.**
1. **§1's true text** — chair-owned at c-41.4, and F-40.220's disposal rides on it.
2. **The outsider's opt-in.** Approval is not consent. Meta's Business Messaging Policy wants a
   prior opt-in for any business-initiated template, and an outsider sourced from Instagram gave
   TDW nothing. Raised once at Record Note 00, unruled, and unchanged by the filing. The
   instrument that would show damage is the WABA's quality rating, not the template's status.
3. **Slot order** — see §5.

---

## 5 · WHAT THIS SEAL DOES NOT PROVE

**No message has been sent.** Unlike `circle_place_ready`, whose entry in `TEMPLATES.md` was
authored from a wire witness — accepted, delivered, read, and **rendered on the founder's
handset** — these four are witnessed only by the Manager's own preview.

That matters for one specific reason, which `circle_place_ready`'s note states and this seal
repeats: **parameters are positional and Meta only counts them.** A swapped order is accepted,
delivered, and silently wrong. The render is the only thing that proves the slot order, and the
render this seal has is the Manager's, not a handset's.

So: **`variables` is ordered from the render, never from the filing form**, and for all four the
handset render is still owed. The first live send on each is also its first order proof. Seat A's
walk (test couple `9625759924` → MAKEUPBYSWATIROY) is where three of the four get it; J1's walk
(DEV440 → the founder's handset) is where the fourth does.

---

## 5a · SLOT ORDER — WITNESSED, AND THE WARNING PAID OUT (2026-09-09)

§5 above said the four templates' slot order was proven only by the Manager's preview, that a
swapped order would be **accepted, delivered, and silently wrong**, and that `variables` must be
ordered from the render and never from a filing form or a second document.

**Both halves are now witnessed on `tdw_assist_lead_outside`.**

- **At the Manager:** founder's capture, 01:30 2026-09-09 — the filed body verbatim, slot order
  **month · city · category**, `STOP REQUESTS` present, the URL button attached. The filing
  document was right.
- **On the wire, in the wrong order:** the A10 send used the registry's permuted
  `variables` array (`src/lib/templates.js:772-784`) and **rendered garbled on the founder's
  handset.** Accepted by Meta, delivered, and wrong — the exact failure this section described
  before it happened.

**The cause was a second document, not a bad reading.** The registry entry was authored
independently of the filing rather than derived from it. Cure is `src/`, F-41.63, seat D's.

**Witnessed at source, 2026-09-09 — two of four.**

| Template | At the Manager | On the wire |
|---|---|---|
| `tdw_assist_lead_outside` | **witnessed** — filing correct | **witnessed WRONG** (A10, registry's order, garbled) |
| `tdw_assist_found_outside` | **witnessed** — body, 4 variables, order name · month · category · handle, no button, all as filed | not sent |
| `tdw_assist_found_vendor` | preview only | not sent |
| `tdw_introduction` | preview only | not sent |

**What this changes for the other two.** `tdw_assist_found_vendor` and `tdw_introduction` remain
**unwitnessed on the wire**, and their registry entries — whenever written — must be derived from
the Manager, not authored beside it. **The first live send on each is still its first order
proof, and that sentence has now cost the estate one garbled message.**

## 5b · THREE FAILURES ON FOUR TEMPLATES, AND THEY ARE ONE SHAPE

Set down now that the third has closed, because they are the same failure wearing three costumes:

| | What disagreed | Caught by |
|---|---|---|
| **F-41.63** | the **registry** disagreed with the filing about **slot order** | a garbled message on the founder's handset |
| **F-41.114** | **this document** disagreed with the filing about a **button type** | the Edit screen, a day later |
| **F-41.80** | a **constant** disagreed with the body about who supplies **the article** | every outsider alert reading *"a a makeup artist"* |

**Every one is a second place holding a fact the filing already held, authored beside it rather
than derived from it. None was caught by the document that was wrong.** Two were caught on a
handset; one on a screen.

**R-41.97's cell closes the registry-versus-document gap** — it asserts `templates.js`'s
`variables` array against §2, literal subsequence for literal subsequence.

**Nothing closes the document-versus-Meta gap, and R-41.116 is why.** Components — whether a
button is a URL or a quick-reply, and what it targets — are visible only on the Edit screen,
which no cell can read. **That gap is structural.** The honest cure is not an instrument but a
habit: **the Edit screen read once per template at filing, recorded, and never inferred from a
preview again.**

**The habit's first test, and it passed.** Row 10a (`tdw_assist_lead_outside_v2`) was witnessed
twice on 2026-09-09: **the preview at 07:42** for body and slots, **the Edit screen at 07:53**
for components — URL, dynamic, base `https://thedreamwedding.in/r/` + `{{1}}`. The preview
rendered that button as *Visit website* with a link icon, **which is the same chrome a
quick-reply would have shown**. F-41.114 is what happens when that chrome is read as a witness.
**Two readings, eleven minutes apart, and the entry is complete rather than plausible.**

**Currently owed under the habit:** row 10's button type and target, still held with the founder.
Nothing else.

**And the habit paid for itself immediately.** Because row 10a's body was left OWED rather than
inferred from v1, the transcription that arrived could be compared against v1 line by line — and
that comparison is what established that **no fact was lost**, only the framing moved from
invitation to notice. Had a plausible body been written first, the comparison would have been
against this seat's guess, and R-41.118 would have been ruled on a fiction.

## 6 · THE RECORD LINE

```
B1 · CE-41 · SEALED 2026-09-08
tdw_assist_lead_outside   1627376372249131  MARKETING (filed UTILITY)  Active
tdw_assist_found_vendor   3160852754105015  UTILITY                    Active
tdw_assist_found_outside  3115277355330375  UTILITY                    Active
tdw_introduction          1757650692328688  MARKETING (as filed)       Active
WABA 1739793260373677 · en · no send arm on any · slot order unwitnessed on a handset
R-41.30 accepted · R-41.31 chartered unfiled · banner's "2" = earlier submissions, not these
```
