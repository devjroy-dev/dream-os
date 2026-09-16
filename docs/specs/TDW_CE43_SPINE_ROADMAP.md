# TDW · CE-43 SPINE ROADMAP — the client lifecycle (2026-09-16)

**Written by CE-43 (the chair) at** dream-os `fe35a480425f06087a438d92a086723ef1c7cf33` / dreamos-pwa `89f18af742b59662fa32085f203e471a05058082`, both derived by command at the moment of cutting. **Status:** RATIFIED IN CHAT by the founder 2026-09-16 unless a line is marked *open*. This file is the sequencing authority for CE-43. It stands on `docs/handovers/TDW_CE43_AUDIT1_HANDOVER.md` (F-43.1 to F-43.12, every file:line derived at `17ea09b1` / `89f18af7` from the founder's own rows on account 9888294440) and does not restate its evidence. It supersedes the CE-43 kickoff's item order and `CE_SUCCESSION_CE42_TO_CE43.md` §0 for as long as it is open. It does not amend the master; rulings that touch the master land as an amendment when the first affected packet cuts.

**Why this file exists.** The audit found that the estate runs two client lifecycles side by side with the same words on them: a typed lead plane (`public.leads`, `public.events`, `public.invoices`, `public.clients`) and Victor's binder plane (`engine.records`). Nothing carries a fact from one to the other at the moments a vendor cares about. Three of the four vendor pages read one plane and the fourth reads the other. Every defect the founder saw on glass on 15 September is a symptom of that. This roadmap replaces the two lifecycles with one spine. It changes the shape of the product, so it is committed, not chatted.

---

## §1 · THE DISEASE, IN ONE PARAGRAPH (evidence in AUDIT-1 §3 to §7)

Victor and Donna write a prospect's name, date, stage and money into `engine.records` (`recordPrimitives.ts:171-231`). The Leads page reads `public.leads` (`leads.js:164`), capped at 20 with no paging (F-43.4). The Events page reads `public.events` only (`events.js:257-264`), so a date on a binder or a lead never becomes an event (F-43.1). The Clients page reads binders (`cabinet.js:45-80`) while contract compose writes `public.clients`, which only Contracts reads (F-43.2). A chat-minted invoice carries no due date and no lead or client link (`invoices.js:384`, F-43.5). The only lead-to-client act writes `state` and nothing else (`leads.js:443`, F-43.9). No column links a lead to a binder (F-43.8). "Package" does not exist as an object anywhere. Both WhatsApp and web run the same engine (`vendorInbound.js:187`), so the split is between planes, not lanes (F-43.7).

---

## §2 · FOUNDER RULINGS (his word is the ruling; the chair records)

- **R-43.1** Everything else on the CE-43 board is HELD until LC-1 to LC-4 are walked. No other seat opens; no walk card from the succession note is chartered. The held walks resume after LC-4 in the order the founder then sets.
- **R-43.2** The audit seat reports, the chair bins, the founder sequences the cure. Sequencing beyond any sitting is the founder's.
- **R-43.3** A package is the vendor's **own services only**. TDW seeds every vendor with default package options for their category at sign-up (backfilled for existing vendors). After seeding the rows are the vendor's: add, delete, rename and rewrite description and detail without limit. TDW never edits a vendor's package after seeding. Seed content is **drafted by a seat for the founder's veto**, verbatim, per category; no seat invents vendor-visible copy silently.
- **R-43.4** The seed payment policy on every default package: **30% at booking · 30% one month before the event (optional) · the remainder on delivery.** Per package, vendor-editable. Mechanics ruled by the chair in §4.
- **R-43.5** **No path in the estate creates a client without a lead.** Every client has exactly one lead behind it and one package on it. The Clients Add sheet and Victor's booked-stage hands are promotions of a lead born booked, not a second door.
- **R-43.6** Meta has approved `whatsapp_business_management` and `whatsapp_business_messaging` (founder, 2026-09-16). **Every enquiry that lands on a vendor's WhatsApp line follows the same spine**: it becomes a lead first, never a binder first. The vendor lane inherits the promotion act, the package quote and the invoice discipline unchanged.
- **The founder's standing rules, still binding:** plain, short, direct; ship. A walk is "does it work": if it works on the glass it is closed. Derive the tip by command before every instruction, both repos, every time.

---

## §3 · THE SPINE (one lifecycle, four doors, three moments, three objects)

**Doors.** A prospect enters as a **lead** through any of four doors: a couple messages the vendor's WhatsApp line (R-43.6); Frost or the public `/plan` sheet files an enquiry; the vendor tells Victor; the vendor taps Add on Leads. Every door writes `public.leads`. The WhatsApp door stops writing a binder first (`enquiryToBinder`, `enquiryBinder.js:49`) and writes the lead; the binder comes only through promotion.

**Moment 1 · Enquiry → quote.** The vendor or Victor attaches a **package** to the lead. It starts as a copy of the vendor's default package and is edited per prospect; the copy lives on the lead so a later change to the master never rewrites a quote already sent. Quoting is sending that copy on the vendor's WhatsApp line. No invoice exists yet. If the couple walks away there is nothing to cancel.

**Moment 2 · Booking.** The vendor taps **Booking confirmed** (or **Advance paid**) on the lead, or tells Victor. One act, one write: the lead moves to `booked`; a binder is created in `engine.records` at stage `confirmed booking` and linked to the lead (0167); the event date lands in `public.events` with `linked_lead_id` and `linked_binder_id` set; the package's total and advance become the binder's money figures; **the one and only invoice for this booking is minted from the package's schedule**, its advance milestone marked paid with today's date, the middle milestone (if any) and the final milestone with their dates; its `due_date` is its next unpaid milestone; `lead_id`, `client_id` and `binder_id` are all set. The contract, when composed, composes from the same package to the same binder.

**Moment 3 · Payments.** Each time money arrives the vendor marks that milestone paid, on the PWA or through Victor. The invoice's state derives from its milestones (advance paid · partly paid · paid · overdue). A receipt line goes to the couple on WhatsApp per payment if the vendor wants it. **No second invoice is ever raised for a middle or final instalment**; one document fills up. The manual Add on Invoices stays for off-package cases (an extra day, a print order) and becomes the exception.

**Walk-ins (R-43.5).** The Clients Add sheet asks what the lead detail asks at booking: name, phone, event date, package (defaults to the default), advance received. In one write it creates the lead at `booked` with `source='direct'`, the linked binder, the event row and the invoice. The vendor sees a client a second later; the lead sits under the booked chip where it belongs. Victor gets the same rule: a hand that would create a binder at a booked or confirmed stage with no lead behind it runs the promotion act instead, and if it lacks a package or an advance figure Victor asks rather than filing a half client. If the vendor has neither yet, the honest place for that person is Leads.

**What Victor learns.** Three hands: read the vendor's packages, attach one to a lead, quote it; plus mark a milestone paid. Victor does **not** create or edit packages; that is a deliberate act on the PWA (R-42.8). "Raise an invoice" as a free act on any binder is retired. Any soul copy for the new hands is a **W-1 lift** and goes to the veto slot; the guard stays ARMED.

---

## §4 · CHAIR RULINGS ON MECHANICS (each earned by a line in the audit)

- **C-43.1 · One seam, both lanes.** F-43.7(a) ruled: every cure lands once at the plane seam in dream-os and both lanes inherit. No per-lane cure anywhere.
- **C-43.2 · Whole rupees.** Under R-41.114 every package figure and every milestone is whole rupees. The first two milestones round to the rupee; the final one is **computed, never entered**, and absorbs the difference (₹80,000 → 24,000 · 24,000 · 32,000; ₹1,00,001 → 30,000 · 30,000 · 40,001).
- **C-43.3 · One month before.** Derived from the lead's event date at the moment of booking. If the event is under a month away the middle milestone collapses into the final one **with a tell on the schedule**, never a silent drop.
- **C-43.4 · The optional milestone** is a switch on the package, on by default, and can also be dropped on the copy attached to a lead. Dropping it never changes the total; the remainder grows.
- **C-43.5 · Delivery** is a date on the attached package. *Open:* whether it defaults to the event date, or to the event date plus a category gap. Chair's lean: the event date as the default, the vendor free to move it.
- **C-43.6 · Dates render the full month** on every schedule line (R-42.13). No clock times on any money plane (F-42.120's class).
- **C-43.7 · Backfill.** Binders with no lead behind them (Dholakia `e6aacb34`, Anjali Rao `f9818d27` and their siblings) get one lead minted behind them once, state `booked`, `source='backfill'`, package attached later by the vendor from the binder card. They are not left as orphans. The four contract-compose rows in `public.clients` are resolved to binders in LC-3 and gain leads through the same backfill.
- **C-43.8 · Migration numbers, allocated by the chair:** `0167` the lead ↔ binder link · `0168` `vendor_packages` and the package links on leads, invoices and contracts. No seat claims a number.
- **C-43.9 · F-43.12 stays as ruled** (R-B6-25: past and blocked dates are hidden from the Events list; the "done" chip already exists). Filed so it is not mistaken for loss.

---

## §5 · THE FOUR SITTINGS, IN SEQUENCE (LC-1 → LC-2 → LC-3 → LC-4; none opens before the one ahead is walked)

**LC-1 · The seam.** dream-os only, no migration. Three cures, one packet. F-43.1(a): when a binder gains a booking stage and a date, the door writes a `public.events` row with `linked_binder_id` set; a later date change updates that row (closes F-43.11 for the chat path without a new column). F-43.5(a): the invoice mint copies the binder's `followup_on` into `due_date` and sets `binder_id`; superseded by the schedule once LC-2 lands, but it makes today's rows honest. F-43.4(a): the pwa sends a limit and pages; the server default stays 20 for other callers. **Walk:** Dholakia's date shows on Events; `TDW/DEV440/09` shows its due date; the Leads list shows all 26.

**LC-2 · The package and the promotion.** Both repos; `0167` and `0168`. The `vendor_packages` table (vendor, name, description, line items with detail, total, advance share, schedule, `is_default`, `seeded_from`); seeds per category as data, copied at sign-up and backfilled; the Packages room under the vendor shell (list, add, edit, delete, rename, one default); **Attach package** on the lead detail; the quote send on the vendor line; the **Booking confirmed / Advance paid** act as one write per §3 Moment 2; the Clients Add sheet re-shaped per R-43.5; Victor's three hands plus mark-paid, soul copy to the veto slot; `donna_client`/`donna_stage` at booked stages routed through the promotion act; F-43.3(a) so two Priya Mehtas cannot exist; the backfill of C-43.7. Shell first, whole (R-42.14): the Packages room and the lead's Attach control ship as navigable surfaces before the backend behind them. Seed copy ships **founder-vetoed or not at all**. **Walk:** a fresh lead on a clean number → attach → quote lands on the handset → Booking confirmed → the client, the event and the invoice with three milestones appear without a second tap.

**LC-3 · Clients and contracts on the spine.** Both repos, no migration. F-43.2(b): contract compose resolves to a binder, so a contract client is a Clients row; `public.clients` remains the legal-party table behind Contracts and nothing reads it as a client list. F-43.10: a **Create invoice** control on the binder card, wired to the existing binder door (`invoices.js:413-420`), minting from the attached package. Contracts compose from the attached package. The milestone sheet becomes an edit of a schedule that exists, not the way one is made. **Walk:** compose a contract for the LC-2 booking; it appears on Clients as the same client, not a second one.

**LC-4 · The vendor WhatsApp lane on the spine (R-43.6).** dream-os first, then any pwa tell. An enquiry on the vendor line files `public.leads` and never a binder-first record; `enquiryToBinder` is retired or re-pointed at the lead; Victor's WhatsApp replies quote from the attached package, and the promotion act runs from the lane exactly as from the web. Uses the newly approved Meta permissions where the lane needs them; any new template is a **new filing, never an edit** (R-42.2), rows added to `docs/TEMPLATES.md`. **Walk:** the test handset sends an enquiry to DEV440's line → a lead appears → Victor quotes the package → "booking confirmed" on WhatsApp → client, event, invoice, one act.

**After LC-4:** the held walks (succession note §4 A to G) resume in the founder's order. The Meta approval also re-opens what waited on it (the Sunday brief's live half, the exchange's verification arm 4c-3b-2, R9); they stay held under R-43.1 until then.

---

## §6 · REFERRED AND FILED (no sitting here)

- **F-43.6** Victor claimed an email send no code performs → the **Victor guard sitting** (same class as F-42.152). W-1 holds; nothing in LC-1 to LC-4 touches soul bytes except through the veto slot.
- **F-43.13** `0159:35` added `engine.messages.room` while `ENGINE_SCHEMA.md:13` says the ladder never alters engine → doc gap; rides the `PUBLIC_SCHEMA.md` regeneration already owed at `0166` (twelve migrations stale, not three — c-43.4).
- **F-43.14** admin vendor detail reads `public.leads` with no `deleted_at` filter (`src/admin/router.js:115`) → Block 09.
- **F-43.15** three `public.invoices.pdf_url` values carry signed storage tokens valid about a year → Block 09, security, not urgent, not ignored.
- **F-43.16** `docs/FINDINGS_LOG.md` carries no CE-41 or CE-42 band → G2 owes the bands when it wakes.
- **Mirrors** (AUDIT-1 §9): Frost never sees a Victor booking; admin search never finds a binder. Both cured downstream by LC-1's event row and LC-2's link; no sitting of their own.

---

## §7 · CHAIR CORRECTIONS OWNED (the audit caught the kickoff)

c-43.1 the first AUDIT-1 charter was not to §10 form · c-43.2 the plane list omitted `engine.records` · c-43.3 the lead stage column is `state`, not `stage`/`status` · c-43.4 the snapshot is twelve migrations stale, not three · c-43.5 the planes join through `engine.users`, not `public.users` (a phone match on the engine plane finds nothing on the founder's account, `engine.users.phone` NULL) · c-43.6 the "lane" framing; one engine serves both lanes. Assume the chair's materials are wrong until a seat has checked them, and thank the seat that refuses to build over them.

---

## §8 · OPEN AT COMMIT (founder's, before LC-2 charters)

1. **Delivery default** (C-43.5): event date, or event date plus a category gap?
2. **Seed drafts**: the seat that drafts the eleven categories' default packages hands them to the founder verbatim; nothing ships unvetoed.
3. **Receipt line** copy per payment (Moment 3): wanted at LC-2 or later? Chair's lean: LC-3, once the invoice fills correctly.

Trust evidence over narrative, including this file. Sequencing beyond any sitting is the founder's.
