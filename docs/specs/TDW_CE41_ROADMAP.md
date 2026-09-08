# TDW · CE-41 ROADMAP — the race order (2026-09-08)

**Written by CE-41 (the chair) at** dream-os `73b3a5fcb1f9913635c46c6a36e8336c430e6e52` / dreamos-pwa `966eb1c1e084d2890f00ecfda64c261ce0b61446`, both derived fetch-first by command. **Status:** RATIFIED IN CHAT by the founder 2026-09-08 unless a line below is marked *open*. **Revision 2** (same day): R-41.11–.13 Introductions and the vendor marketing lane; F-41.1 the front door; the vendor PDF and the marketing playbook delivered as founder-held documents (not on the tree). This file is the sequencing authority for CE-41 and supersedes `CE_SUCCESSION_CE40_TO_CE41.md` §6 (proposed, not imposed). It does not amend the master; rulings that touch the master land as Amendment 4 when the first affected packet cuts.

**The founder's framing, verbatim in spirit:** it is a race against time; everything hinges on the third-party filings; he may be without GitHub or a shell for a stretch, so the estate must be steerable from the admin panel alone; Beta is plastered across the PWA and he is personally in touch with every vendor until 500.

---

## §1 · FOUNDER RULINGS FROM THE OPENING DISCUSSION (his word is the ruling; the chair records)

- **R-41.1** Concierge goes first. **Request assistance** is promoted to the bride lane's main screen: a popup on login (behaviour *open*, §6), then reachable from Settings and from Meridian.
- **R-41.2** The offer is a **wedding planning assistant** — TDW, who finds and books vendors for the couple, *including* event/wedding planners. Not "a planner". One sheet: categories with a `Rs` budget each, area, date, the look; one Send. No second intent, no `kind` column. Every byte his veto at the mock.
- **R-41.3** Requests land in the admin panel. TDW forwards them, hand-picked, to vendors **on the platform or outside it** (from Instagram or anywhere). Outsiders see the lead once they join TDW.
- **R-41.4** Templates, three, all on the bride/vendor lines as appropriate: (a) the outside vendor's lead alert ("a couple in {city} wants {category} in {month}, budget around Rs {band} — join to see it"; no phone in the body); (b) the bride's "we found you a vendor" with a URL button to the vendor's TDW storefront `/v/<code>`; (c) the bride's "we found you a vendor" for an **outside** vendor — the IG handle and the TDW WhatsApp link as body text. Categories are the Manager's to decide (R-40.58).
- **R-41.5** The bride lane's *Discover* is labelled **Discover-Storefront** (front-facing only; R-40.111 as amended). Final typography of the label at the mock. Radius derived: `app/(frost)/frost/canvas/sanctuary/page.tsx:162` (`BASE_SLICES`) and `app/components/couple/MuseRow.tsx:69`; admin cockpit strings out of radius.
- **R-41.6** A **filing seat** is chartered in parallel with the concierge seat. It writes every third-party submission (Meta, Google, others) and walks the founder through each; it prioritises the concierge templates first. The screencasts are cut with **Instagram's own editor or InShot (Android)** — the seat writes for that tool, shot lists and on-screen captions included.
- **R-41.7** `9888294440` (DEV440) is the app-role test account for every Development-mode walk (tester/developer on the Meta app; test user on Google). The walk happens before any approval widens a plane; approval never substitutes for the walk (R-40.127 stands).
- **R-41.8 THE SWITCHBOARD (mandatory).** Every gated feature in Business Solutions — templates, Meta permissions, Google scopes, IG planes, influencer, ads, own number, all of it — ships built dark behind one register readable and flippable **from the admin panel**, never only from Railway env or a code push. Where a status is queryable (template status, a permission probe) a sweep flips it to *armed* automatically and tells the founder in admin; his one tap turns it **on for everyone**. Where the founder has already walked the plane in test mode he may pre-authorise the sweep to flip straight to *on*. Home: `admin_config` (exists) + a `capabilities` row per gate (§4).
- **R-41.9** Regen `0139–0147` runs whenever convenient, in parallel; it becomes owed at the first packet that *reads* a table those migrations touched, and that packet's read-first names it.
- **R-41.10** The Victor **draft-and-send** arm (a vendor asks Victor on WhatsApp to draft and send a message to a lead, a client, or a new number) is built and its seat is open; its walk is **owed and on the register** (§5). The chair reminds the founder at each sitting's close until walked.

- **R-41.11 INTRODUCTIONS — Victor as her closer, on her own number.** A vendor hands Victor a number she met (typed, a shared contact, later a missed call) and what to send: a wedding page, a reel, her storefront, **or her Instagram handle** (page/reel/storefront as a URL button on `thedreamwedding.in`; the handle as body text). Victor drafts one message in her voice naming where they met; she approves every one; the recipient gets the work, not a pitch. A reply is an enquiry (`createLead`, `source='introduction'`, the meeting place in `notes`); no reply, no follow-up, ever. Governance ported from Mira's line: a daily cap (chair proposes 10; *open*), STOP honoured forever, a Marketing-category template so it never touches the Utility lines, and the switchboard disarms the lane if her WABA quality rating drops. Cold numbers refused. Home: R9 *Your own number*, its outbound arm; built dark now and walked on the test line (DEV440 → the founder's handset); live from her WABA when Embedded Signup lands. *Open:* whether it may run from TDW's line in her name before R9 (chair leans no); the surface name (*Introductions* / *Reach out*).
- **R-41.12** There is no vendor marketing lane in the nine rooms today — Mira's marketing line is TDW's own (prospects, the 10:00 IST opener, 25/day, STOP). The vendor's outbound to her **warm** list is R-41.11 plus R8's open-date offers and R6's past-couple broadcast; cold outreach stays refused. *Open:* whether Introductions is R9's arm (as ruled above) or a tenth room named *Marketing*; the chair leans a tenth room by name once R9 lands, so a vendor finds the word.
- **R-41.13** The concierge outsider forward rides Mira's marketing line — `prospects` is the outsider, the closer's governance is the governance. One lane, not a second writer.

---

## §1a · FINDINGS OPENED THIS SITTING

- **F-41.1 The front door ignores an existing session.** `app/(landing)/page.tsx` writes `vendor_session`/`couple_session` on sign-in and never reads either on mount; `middleware.ts` rewrites hosts only. A signed-in vendor who types the domain lands on the marketing page (its own comment at `:645` names the cure and defers it to a dream-os byte never built). **Cure, one rider on packet A3:** on mount at `/`, a present vendor session → `router.replace('/vendor/rooms')`, a couple → `/frost`; and `/auth/pin-status` answering for both roles in one call (dream-os, packet A2) so a returning member is never asked which they are. *Open:* whether Back from `/vendor/rooms` stays inside the shell.

---

## §2 · THE SESSIONS, IN RACE ORDER

Three seats at most at once (succession §6). Two lanes per seat, one packet at a time, the seat re-pins at the tip, named files, full hashes, §7 packets only. The founder relays.

| # | Seat | Runs | Packets, in order | Done when |
|---|---|---|---|---|
| **A** | **Concierge s1** | now | A1 journey mock (popup + sheet + admin queue + the three template bodies) as files → founder veto · A2 dream-os: migration, the sole writer `createAssistanceRequest`, three doors (bride PWA · admin-typed · *public link reserved for s2*), the forward arm (on-platform via `createLead` `source='tdw_assist'`; outsider via a `prospects` row), send arms **dark behind the switchboard** · A3 pwa: sheet, popup, Settings entry, Meridian folded, **Discover-Storefront rider**, **F-41.1 rider** (the front door reads the session) | walked on the test couple `9625759924` → MAKEUPBYSWATIROY receives; an outsider number receives the dark-arm's log line; the founder forwards from admin on his own glass |
| **B** | **Filing** | now, parallel to A | B1 the three concierge templates (bodies from A1) filed on The Dream Wedding Direct · B2 Meta: the WhatsApp pair status, `instagram_business_basic` (Video C), `manage_messages`, `manage_insights`, `content_publish`, `manage_comments`, the second app for `ads_read`/`business_management`; each with use-case text, shot list for IG editor/InShot, captions, test-user setup · B3 Google: `api.thedreamwedding.in` (R-40.128), Search Console verification, restricted-scope review, publish from Testing · B4 the Tech Provider Terms read-through and the customer-terms flow-down (G6 item ZERO); ResellerClub; RBI e-mandate before 10-01; console MFA before 10-20 | every filing submitted and its id on `master §6`'s gates table; nothing built, only filed |
| **C** | **The switchboard** | opens the day A2 cuts; third seat | C1 dream-os: `capabilities` (§4), the sweep (template status via the WABA's `message_templates`; permission probes), the `cap.on()` read at every Business Solutions send arm and gated door, the env `*_SEND_ENABLED` flags migrated in as seed rows (one home, R-40.96 preserved as the *armed→on* step) · C2 pwa: the admin **Switchboard** card — every gate, its status, its evidence line, one tap to on/off, the pre-authorise toggle | the founder flips a walked plane on and off from his phone with no shell open; a template's Meta status changes and admin shows it within the sweep's window |
| **D** | **Concierge s2** | after A + C1 | the public intake link (a caller fills the sheet, lands as a couple), vendor decline back to the queue, the forward register countable, the bride templates' send arms, the outsider join-key materialisation (`prospects.phone` → `createLead` on signup, last-ten law) | a caller who never had the app is a couple with a request; an outsider who joins finds the lead in her Leads room |
| **E** | **Wedding-pages pass + G3.4 s2** | after D or in A's gap | R-40.134 editor door (`?open=<slug>`), F-40.113/.164/.249/.275/.270/.104; G3.4: F-40.215 edit/remove (frame first), F-40.229 router arm + partial UNIQUE (R-40.110) | walked rooms with no known holes |
| **F** | **R8 Open dates & rates** | after E | the muhurat list (founder's, R-40.38) as the hot-dates source, demand pulse from `date_checks` (`0140`), Victor's open-date selling, rate nudges; ungated | walked on DEV440 |
| **G** | **G2 s2** | on its date, ~2026-10-27 | F-40.107 heartbeat, F-40.228 router arm + partial UNIQUE, F-40.238 key on `to_phone`, **then** `REVIEW_ASK_SEND_ENABLED` via the switchboard; the GBP claim/sync | first review ask on a real handset |
| **H** | **R6 Posts & ads** | rung 1 now, rung 2 on grant | G4.2 content cards rendered in-house (ungated), G4.3 broadcasts with fees shown (ungated), G4.1 Sunday brief and G4.5 ads dark behind the switchboard | dark planes flip on the day Meta grants |
| **I** | **R7 s3** | after H or parallel | G5.2 shoot board, G5.3 influencer exchange (dark, insights-gated), G5.4 venue pages + team bundles | |
| **J** | **R9 Your own number** | outbound arm now (dark); inbound on Advanced Access | **J1 Introductions (R-41.11)** — dream-os: the one writer, the closer soul ported from Mira in her voice, the Marketing template filed by seat B, the cap/STOP/quality-rating arm on the switchboard; pwa: the Victor chat lines only (no chrome); walked on the test line · **J2** G6 as specced, Embedded Signup **v4** (v2 ends 2026-10-15); item ZERO is B4 | J1: DEV440 hands Victor a number, approves, the founder's handset receives the page and the handle; a reply lands as an `introduction` lead · J2: her own WABA answers |
| **K** | **G7 benchmarks · G8 cold walk · R-40.135 city/trade pages** | when the cohort exists / after everything | | |
| — | **The runner charter** | beside G2 s2 | F-40.63/.69/.70/.71/.128/.149/.216/.217/.225/.271, R-40.62, R-40.105, the pwa floor base re-base (chair's act) | |
| — | **Block 09's list** | interleaved, never a seat of its own | F-40.9/.86/.87/.101/.125/.148/.151/.212/.218/.220/.223/.262 | |

**J1 runs beside F (R8):** the two share the open-date arm and Victor's outbound voice; one seat can carry both after E. J2 waits on Meta.

**Why C is third and not later:** the founder may lose shell and GitHub access mid-block. After C every walked plane is his to flip from admin; before C every flip is a Railway env edit or a push. C is the insurance and it ships before D, E, F.

---

## §3 · THE FILING ORDER (seat B's spine; each unblocks the next)

1. The three concierge templates (A1 bodies → Meta; Utility argued, Manager decides). **1a.** The Introductions template (R-41.11; Marketing category by intent, one URL button on `thedreamwedding.in`, body text for the handle).
2. WhatsApp pair — submission `1461935125758843`, in review since 09-02; chase, do not re-file.
3. `instagram_business_basic` — Video C; unblocks every IG plane.
4. `instagram_business_manage_messages` (the DM bridge, I2 — the largest uncaptured enquiry source).
5. `instagram_business_manage_insights` (Sunday brief, reach cards).
6. `instagram_business_content_publish`, then `manage_comments`.
7. Second Meta app + `ads_read` / `business_management`.
8. Google: `api.thedreamwedding.in` → Search Console verification → restricted-scope review → publish out of Testing (kills the 7-day refresh).
9. Tech Provider Terms (read in full) → customer terms flow-down → `Start onboarding` as Independent Tech Provider.
10. ResellerClub (`.in` in INR) for R3 P2.
11. Founder-only, dated: RBI e-mandate (10-01), console MFA (10-20), GBP eligibility (10-27).

Every submission's id, date and state goes on the master §6 gates table in the same packet as the filing (the chair keeps that table current; the seat hands the chair the row).

---

## §4 · THE SWITCHBOARD — shape (seat C charters the detail; forks marked)

- **Plane:** `public.capabilities` — `key` (one home per gate, e.g. `template.tdw_assist_lead_outside`, `perm.instagram_business_manage_insights`, `scope.google.webmasters.readonly`, `flag.review_ask_send`), `kind` (`template|permission|scope|flag`), `status` (`pending|approved|rejected|armed|on|off`), `evidence` (the sweep's last reading, verbatim), `checked_at`, `flipped_at`, `flipped_by`, `auto_on` (the founder's pre-authorisation for a plane he has walked). One writer: the sweep for `status ≤ armed`, the admin door for `armed→on|off`. Provenance: a new table; FKs none; the regen is owed by this packet if it reads any `0139–0147` table (it should not).
- **The sweep:** nightly and on-demand from admin. Templates: the WABA's `message_templates` filtered by name → APPROVED/PENDING/REJECTED. Permissions: a probe call per plane (an insights read, a publish dry-run) → 200 or Meta's code 10/200-class refusal; the refusal text is the evidence. Google scopes: a token-info read. A status change that reaches *armed* sends the founder one Utility message on his admin number (the existing `ADMIN_PHONE` decision, F-07.76) and shows in the admin card.
- **The read:** every Business Solutions send arm and gated door reads `cap.on(key)` at the door — never an env var, never a literal. The existing env flags (`CONTRACT_SIGN_SEND_ENABLED`, `CONTRACT_COPY_SEND_ENABLED`, `PAYMENT_REMINDER_SEND_ENABLED`, `REFERRAL_ALERT_SEND_ENABLED`, `WEDDING_CREDIT/CONSENT_SEND_ENABLED`, `REVIEW_ASK_SEND_ENABLED`) become seed rows at C1's migration with their current values; the env read is deleted in the same packet (one home). `laneFlags.js` (model-facing lanes, F-08.56) is **out of radius** — that law is about push-is-not-speak and stays as it is.
- **The card (pwa admin):** one row per gate — name in plain words, status chip, evidence line, `On`/`Off`, `Flip on automatically when approved` toggle, `Check now`. Seven-ink law (R-40.129). No persona names.
- **Forks for C's kickoff:** (i) probe frequency vs Meta rate limits; (ii) whether a REJECTED template auto-disarms a plane that is `on` (chair leans yes, with the founder told); (iii) whether `auto_on` requires a recorded walk id (chair leans yes: the walk's seal hash on the row).

---

## §5 · WALKS OWED (the register the chair reads at every close)

| Walk | Needs | State |
|---|---|---|
| Victor steps 3–4 (R-40.16) | a virgin number — neither a vendor's nor a registered couple's | owed by the founder when he chooses |
| **Victor draft-and-send** (R-41.10) — vendor asks Victor to draft and send to a lead / client / new number | DEV440 as vendor; a receiving number | **owed; seat open; remind every close** |
| Concierge s1 | test couple `9625759924` → MAKEUPBYSWATIROY; an outsider number for the dark arm's log | after A3 deploys |
| Concierge outsider template on a real outsider | the same virgin number | after B1 approves + D |
| Switchboard flip on/off | any walked plane | after C2 |
| Introductions (J1) | DEV440 as vendor; the founder's own handset as the person she met | after J1 deploys |
| F-41.1 the front door | type the domain while signed in on vendor and couple | after A3 deploys |

---

## §6 · OPEN — the founder rules these at the concierge mock (A1)

1. **The popup:** chair proposes once per login, dismissable, never again after her first request. *Open.*
2. **Fan-out default:** chair proposes 3 vendors per category, founder override in the admin queue; ≤10 is the precedent (R-40.72). *Open.*
3. **What she sees after Send:** "Sent to N vendors" + the TDW vendors' names; outsiders unnamed until they join. *Open.*
4. **The label's typography:** `Discover-Storefront` / `Discover · Storefront`. *Open at the frame.*
5. **Introductions:** the surface name; TDW's line before R9 (chair leans no); the daily cap (chair proposes 10). *Open.*
6. **F-41.1:** Back from `/vendor/rooms` stays in the shell? *Open.*
7. **The assistant's name on the surface** (TDW, "your wedding assistant", a persona?) — copy law: persona names never in chrome. *Open.*

---

## §7 · WHAT THIS ROADMAP REFUSES (carried, not re-argued)

No commission; no spend-ranked forwarding; no bidding surface; no couple-browsable vendor directory beyond Discover; the couple's phone reaches an outside vendor **only after she joins TDW** (the template carries no phone); no auto-flip that skips the walk — *armed* is automatic, *on* is a hand or a pre-authorised walked plane; no third writer for leads (`createLead` is the sole writer; the outsider path materialises through it on join); no persona name in product chrome; no cold outreach from a vendor's number — Introductions names the place they met or it does not send; no follow-up to an unanswered introduction.
