# TDW_20 · CONCIERGE — "REQUEST ASSISTANCE" · ROADMAP ENTRY

**Status:** ROADMAP. Founder-ruled **R-40.109** (2026-09-07). Not chartered; not sequenced. The next chair discusses sequencing with the founder (his instruction, 2026-09-07). This file exists so the ruling and its shape sit on the tree rather than in a chat.

**Written by:** CE-40 · **at:** dream-os `adcbc50` · **plane:** the couple lane (bride) + the admin cockpit + the vendor Leads room.

---

## 1 · THE RULING, IN THE FOUNDER'S WORDS MADE PRECISE

A couple on the bride lane gets **Request assistance**. She sets a **budget per category** (photography, makeup, décor, planning, mehendi, …), describes **the look, design and style she wants**, and taps **Send**. The request lands in the **TDW admin panel**. From there **TDW forwards it as a lead to any vendor on the platform** — one or several — and the vendor receives it in her Leads room as a lead from TDW.

## 2 · THE SHAPE, DERIVED AGAINST THE ESTATE AS IT STANDS (2026-09-07)

Almost everything this needs already exists; the new bytes are one couple sheet, one table, one admin queue.

| Piece | Reuses | New |
|---|---|---|
| The couple's sheet | Wine Night tokens (bride lane), the lead sheet's one-question posture (R-G12.10/.16) | one sheet: a category list with a `Rs` budget field each (never `₹`), a free-text brief, **Send**. Consent is the act — she asked. Every byte the founder's veto. |
| The plane | — | `assistance_requests` (`couple_id`, per-category budgets, the brief, `state open\|forwarded\|closed`, `created_at`), **one writer**. A request is **not a lead** until TDW forwards it. |
| The admin queue | the `/admin` cockpit; G5.1 s2's peer-search predicate (`status='active' AND discover_paused=false AND peer_discoverable=true`) with TDW as the actor | one queue: the request, the couple's city/date from her profile, the brief; **Forward to vendor** (search by name/handle, same-category first, alphabetical, no ranking — master §7). |
| The lead | `createLead` (the sole writer), `source` one home (`'tdw_assist'`), the `TDW` badge on the vendor's list, the Utility lead alert (R-40.72 as amended), R-G51.11's tier reading (a couple's stated budget for that trade is the vendor's to see) | a `lead_referrals`-shaped record of what TDW forwarded where, so the exchange is countable if ever wanted. |

**Refusals carried from master §7:** no spend-ranked or volume-ranked forwarding; TDW takes no commission; the couple's phone reaches a vendor only when TDW forwards, and the vendor sees it under her tier's rules; no dashboard.

## 3 · FORKS FOR THE CHAIR THAT CHARTERS IT

1. Fan-out: may one request go to several vendors per category, and what cap (R-40.72's ≤10 is the precedent).
2. Does the couple see which vendor received it, and when.
3. Can a vendor decline and return it to the queue (a state, a byte, a reason).
4. Home: a new Block 20, or the admin side of Block 19 (the nine rooms are vendor-facing; this is couple-facing, which argues for 20).
5. Whether the budget per category is stored as rows or jsonb (the register's provenance law applies either way).
6. The admin actor's identity on the lead (`TDW` as referrer name; the forwarder's user for the audit).

## 4 · WHAT IT MUST NOT BECOME

A directory the couple browses (master §7); a bidding surface; a spend-ranked queue; a second lead writer. The request is one act by the couple and one act by TDW; everything between them is already built.

## 5 · OPEN QUESTIONS THE NEXT CHAIR PUTS TO THE FOUNDER

- Sequencing against Block 19's remaining rooms (R6 Posts & ads, R7 Referrals s3, R8 Open dates & rates, R9 Your own number), G3.1 sittings 2/3 (P3 SEO remainder; P2 own domain — blocked on the ResellerClub account and the invoice pass-through line), G3.4 sitting 2 (F-40.215), G2 sitting 2 (2026-10-27).
- Whether the couple's request is mock-first on the bride lane (it is; the frames are the first deliverable).
