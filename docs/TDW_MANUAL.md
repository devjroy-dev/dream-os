# THE TDW MANUAL

**S-7 — the canonical what-it-is / what-it-can-do document. The single source of product truth.**

**MANUAL_VERSION: v1**
**Derived at: dream-os `3b6fa97` · dreamos-pwa `19978c7`**

Every claim in this document was derived from the running product at those two
commits. Nothing here describes something planned, specced, or in progress. When
the product changes, this document is re-derived before it is re-edited — the
witness table for every claim below lives in `docs/TDW_08_P5_PHASE2_HANDOVER.md`,
which no agent loads.

---

## 1 · WHAT THE DREAM WEDDING IS

The Dream Wedding is a Wedding OS — one instrument for the people who make Indian
weddings happen, and one for the couples getting married.

It was built from a simple observation about the trade: a wedding vendor's real
job happens in WhatsApp and their real records live nowhere. The enquiry arrives
at midnight. The advance is never chased. The date gets double-held. Every vendor
already runs a business in their head and a filing system in their thumbs, and
every tool built for them so far has asked them to leave WhatsApp and learn
software instead.

TDW does the opposite. The business runs where the vendor already is.

**Not just happily married. Getting married happily.**

---

## 2 · MANAGE YOUR BUSINESS THROUGH A CRM

This is live today, and it is the floor everything else stands on.

A vendor's account carries their leads, their signed clients, their invoices,
their expenses, their calendar and events, their notes, their portfolio, their
crew and bands, their contracts, their TDS records, and their collaboration
posts. These are not views onto a spreadsheet — each is a real record with its
own doors, and every one of them can be read or written from the app, from
WhatsApp, or by asking Victor.

The app opens into two groups. **Studio** holds the Calendar, the Business list,
and everything else under More. **Discover** holds the Portfolio, the Leads that
arrive from the marketplace, and Collab. The Business list itself resolves into
four rooms a vendor lives in daily: leads, clients, invoices, expenses.

The calendar is the piece vendors test hardest, so it is worth being specific.
It is one writer, one truth. A date can be blocked whole or by slot. Bookings,
shoots, meetings, recces, fittings and ceremonies each have their own kind. When
something conflicts — a date already held, a slot already taken, capacity already
spent — the system refuses and says why, in words, at whichever door the vendor
was standing in. It does not silently accept a double-booking and it does not
pretend a refusal was a success.

---

## 3 · CONTROL IT THROUGH NATURAL-LANGUAGE AI ACCESS

Live today, and this is the part that is genuinely unusual.

Victor is the vendor's advisor. He is one person across every surface — the same
man in the app and on WhatsApp, in a shorter register on the phone. Behind him
works Donna, who keeps the books. The vendor talks to Victor; Victor hands Donna
the work; Donna's hands touch the records.

What that means in practice: a vendor can say *log Meher as a new lead, phone
number, wedding in February, Jaipur* and the lead exists before they have finished
typing the next message. They can say *what's due this week*, *block the 18th*,
*move the Sharma shoot to 9am*, *note that they want a haldi-morning slot*, *raise
the invoice*, *put Ravi on Saturday's crew* — and each of those is a real write to
a real record, not a note in a chat log.

Roughly forty distinct operations are available to him this way, covering leads,
clients, money, dates, events, notes, documents, crew, invoices, and reads across
all of it. The vendor does not learn any of them. They talk.

**The honest part, and TDW puts it first rather than last.** Systems like this
have one characteristic failure: the model says a thing was done when it was not.
TDW spent an entire development block on that single problem and treats it as the
product's central risk rather than an edge case. Victor may only claim what a
witnessed result proved. A filed record carries a visible witness line derived
from the actual write — not from what Victor said he did. Every completion claim
that reaches a vendor passes a guard that intercepts the specific class of lie
this system is prone to; when it fires, the vendor sees an honest failure line and
a Report control rather than a confident falsehood. That guard has caught the
fabrication live in production and replaced it before it reached the vendor.

It is not a claim that the system never gets anything wrong. It is a claim that
when it does, the estate is built to catch it, say so, and be told about it.

---

## 4 · COMMAND IT THROUGH WHATSAPP

Live today, on the vendor's own WhatsApp line, through the official WhatsApp
Business Platform.

WhatsApp is not a notification channel bolted onto an app. It is a full door. The
same Victor, the same Donna, the same records, the same refusals. A vendor who
never opens the app still has a complete business running.

What arrives at the vendor unprompted: morning nudges, crew assignments when
someone is put on a job, payment reminders, and an alert the moment an enquiry
lands from the marketplace.

What the vendor can do by sending a message: everything in section 3.

Two conveniences worth naming. A vendor can forward a message they have received —
a couple's enquiry, a screenshot, a price list — with no instruction at all, and
Victor treats it as a document handed to him: he files it and tells the vendor
what he did and what he made of it, rather than asking what they would like done
with it. And a vendor can switch Victor's room, or start a clean thread, with a
plain word in the chat.

---

## 5 · LET IT TALK TO YOUR PROSPECTS AND TAKE BOOKINGS FOR YOU

**This is the pillar where TDW is thinnest today, and the Manual says so.**

What is live: when a couple messages a vendor's TDW line, an assistant answers on
the vendor's behalf. It is warm, it is brief, it takes a short qualified enquiry —
what the wedding is, when, where, roughly what they are looking for — and it hands
off. The vendor receives the enquiry as a real lead on their board, and an alert
on WhatsApp, without having answered anything at midnight.

What that assistant deliberately does not do: it does not quote prices the vendor
has not published, and it does not promise availability. It cannot see the
vendor's calendar and it does not pretend to.

**So the booking itself is the vendor's.** The couple's conversation produces a
qualified lead; the vendor takes the booking — by a tap in the app or by telling
Victor. TDW takes the enquiry off the vendor's hands. It does not yet close the
sale on their behalf.

A fuller couple-facing assistant is being built. Until she ships, the sentence
above is the true one, and a prospect should be told exactly that.

---

## 6 · ADVISE YOU ON SOCIAL MEDIA GROWTH, AND BUSINESS ADVISORY

Live today, as a second room rather than a second product.

Victor has a mode. In Business mode he files, books, chases and keeps the ledger.
Flipped to Advisor, he stops filing entirely and becomes a social-media and
business counsel calibrated to the vendor's specific trade — what a photographer
posts versus what a decorator does, reel and portfolio judgement, turning an
enquiry into a conversation, the seasonal rhythm of the Indian wedding calendar as
content moments, and honest platform mechanics.

The flip is a chip in the app or a plain word on WhatsApp, and it holds until it
is flipped back.

**Two honest notes.** Filing genuinely pauses in the Advisor room — that is the
design, so counsel and bookkeeping never contaminate each other — though good
advice is captured to the vendor's notes so it is not lost. And when a vendor
raises an operational matter while in the Advisor room, Victor is meant to
redirect them rather than silently drop it. That redirect is not yet perfectly
reliable, is under active measurement, and a vendor who wants something filed
should flip back to Business first.

---

## 7 · A MARKETPLACE FOR THE CRÈME DE LA CRÈME

Live today, on the couple-facing side of TDW.

Vendors on TDW get a storefront that renders as a real profile — the business
name, the category, the city, the portfolio, the aesthetic tags, the written
about, the Instagram handle, a starting price where the vendor chooses to show
one, and a direct enquire link. Enquiries from that link arrive as leads on the
vendor's board and as an alert on their phone.

The premise: a great gallery currently lives scattered across Instagram, where it
competes with everything else on the platform and converts through DMs that get
lost. A storefront is the same work, presented, in a place where the person
looking at it is already getting married.

Approval is not automatic and the bar is deliberate. A profile needs a hero image,
a written about, at least six approved photographs, at least three aesthetic tags,
a stated rate, an Instagram handle, and travel terms. The portfolio holds up to
twenty images. Vendors see exactly which of those they are missing, ranked by what
would improve their profile most.

There is also a **Featured** pipeline — promoted placement, submitted for a
specific slot and date window, reviewed rather than bought automatically.
Submission works today; **paid placement is not switched on yet**, so a Featured
submission currently goes through review without a payment step.

---

## 8 · THE COUPLE SIDE

TDW is two instruments, not one with a public face. The vendor's half is sections
2 through 7. This is the other half, and a vendor should understand it for one
practical reason: it is why an enquiry from The Dream Wedding is not the same
object as an enquiry from an Instagram DM.

### The Sanctuary

A couple's home on TDW is not a dashboard. It opens on the arc between the two
days that matter — how many have passed since she said yes, and how many remain
until the wedding — drawn as a single progress arc, with the day's date written
out in full, a line of prose, and a poem that changes daily. The screen shifts
between light and dark with the time of day, unless she has chosen for herself, in
which case her choice is respected permanently.

It is deliberately the opposite of a project-management tool. The planning is all
there; it is one tap below, not in her face on a Tuesday morning.

### Her instruments

Beneath the Sanctuary sits her canvas, in rooms:

- **Functions and events** — the whole wedding, not one day. Every function with
  its own date.
- **People** — who is coming.
- **Vendors** — who she has booked, who she is talking to, what is still open.
- **Expenses** — what has been spent, with receipts.
- **Moments** — the wedding as it is remembered, not only as it is scheduled.
- **Reminders** — what is due next.
- **The Circle** — her people, below.
- **Muse** — the inspiration board, where she saves what she loves.

### Mira

She has her own assistant on her own WhatsApp line, and Mira is not a smaller
Victor. She is written as the friend with a perfect memory — not a therapist, not
a cheerleader, not a corporate assistant. She says her name plainly the first time
they meet and any time she is asked who she is, and then never announces herself
again, because a friend who introduces herself at the top of every message is a
switchboard.

What Mira actually does, in her own hands: saves wedding details as they are
mentioned, keeps notes, adds and moves and cancels events, creates and completes
and updates tasks, records bookings and payments, files receipts, reads back the
muse board, invites people into the Circle, and looks things up. Around two dozen
real operations, none of which a couple has to learn — she texts Mira the way she
would text a friend, and the record is correct afterwards.

Mira ships under the same honesty discipline as Victor: she may state that
something was done only when a result proved it.

### The Circle

Weddings are not planned alone, and TDW is built on that rather than around it.

A couple invites family and friends in by name. They join through their own
invitation, verify their own number, and hold their own access — they are members
in their own right, not people borrowing her login. Inside, they see her circle
feed, they talk in threads, and they save and comment on the muse board with her.

The sovereignty rule runs the other way from what people expect: the Circle sees
only what she chooses to reveal. Her mother being in the Circle does not make her
mother an administrator of the wedding.

### Discover, from her chair

She browses vendors as a marketplace — approved profiles, real portfolios, real
cities, ranked by how complete and real the supply is rather than by who paid.

When she taps enquire, the enquiry that reaches the vendor carries her name, her
wedding date, her city, her functions, and her budget as a band — because she has
already told TDW all of it, once, in her own instrument. She is not filling in a
contact form. **That is the whole reason a Discover lead lands warmer than a DM:
the context was already hers before the vendor ever saw it.**

### What it costs her

Today a couple is charged nothing to plan a wedding on TDW, and there is no
paywall anywhere on her side.

---

## 9 · TIERS AND PRICING

TDW is a subscription. Four tiers exist: **Trial**, **Essential**, **Signature**,
and **Prestige**.

Plans range from Rs 999 to Rs 5,999 per month.

What actually differs between them today, stated plainly:

- **The Studio** — team management, task assignment, team payments, briefings and
  team messages — is Prestige.
- **Everything else in this document is available at every tier** — the CRM,
  Victor and Donna, the full WhatsApp door, the Advisor room, the calendar, the
  marketplace storefront, and the Collab board.

No asterisks, and the sentence is shorter than most vendors expect: there is
exactly one capability behind a tier, and it is named above. No throttled core, no
metered assistant, no feature held back to force an upgrade.

For the current price of a specific tier, for anything about the trial's terms, or
for anything this document does not answer, the answer is the founder's and the
question should go to him rather than be guessed at.

---

## 10 · THE DEMO MECHANIC

Some vendors discover TDW by being shown their own account.

TDW builds demonstration studios for vendors who are not customers yet — the
vendor's real Instagram work, their real category and city, arranged into a real
storefront on the real marketplace, so they see the product with their own gallery
in it rather than a screenshot of somebody else's. It is a demonstration, not a
free account, and it expires.

A vendor who wants it claims it. The claim is one action from their own demo page,
and it reaches the team immediately.

Demo studios are deliberately thinner than a real profile — no enquire link, no
starting price, no aesthetic tags. They show the shape of the thing, honestly
labelled as a demo.

---

## 11 · OBJECTIONS, ANSWERED HONESTLY

**"I already have a manager."**
Victor does not replace her. He removes the part of her job that is transcription —
the filing, the chasing, the ledger, the double-checking of dates. She keeps the
part that is judgement and relationships.

**"Not another app."**
The app is optional depth. WhatsApp is the product. A vendor can run a complete
business on TDW without ever opening the app, and many will. The app is there for
the days when someone wants to see everything at once.

**"What about my data?"**
The vendor's records are theirs. A couple's contact details reach a vendor when she
enquires and not before — that act is the door she opens — and on a demo profile
they are withheld entirely. Images a vendor sends in are stored, not discarded:
they are re-hosted to a durable address so the record that references them does not
break later, and the address is unguessable. There is no scraping of a vendor's
private conversations for anything other than running their own business.

**"What if I leave?"**
There is no lock-in and no exit penalty. A vendor's clients, calendar and records
are their own and leaving does not hold them hostage.

**"How do I know it isn't just making things up?"**
This is the right question to ask of any AI product and TDW's answer is section 3.
Short version: a claim that something was done must carry the receipt of it having
actually been done, and the specific lie this class of system tells is intercepted
before it reaches the vendor. It has been caught doing so in production.

---

## 12 · WHAT THE DREAM WEDDING DOES NOT DO

This section exists because a vendor deciding whether to trust a platform is
better served by a straight list than by a careful silence.

- **No fake reviews.** There is no review-generation, no seeding, no incentivised
  ratings.
- **No pay-for-ranking.** Placement in Discover is earned by profile completeness
  and real supply. The one paid surface is Featured, and it is clearly marked as
  promoted wherever it appears.
- **No lock-in.** No exit fee, no data hostage, no contract that outlives the
  vendor's interest.
- **No closing the sale for you, yet.** The couple-facing assistant qualifies an
  enquiry and hands off. It does not quote, it does not promise a date, and it
  does not book.
- **No paid Featured placement yet.** Submission works; the payment step is not
  switched on.
- **No stated trial duration in this document.** The Trial tier exists and its
  capabilities are named in section 9; anything about its length or terms is the
  founder's answer, not this document's.

**And one present-tense truth about the product itself:** The Dream Wedding is in
active development and is getting materially better on a weekly cadence. This
document describes what works today, deliberately and only. A question it cannot
answer is a question for the founder — and getting the real answer is better for
everybody than getting a confident one.
