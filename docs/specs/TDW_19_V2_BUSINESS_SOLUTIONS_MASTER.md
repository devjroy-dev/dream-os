# TDW_19 v2 — BUSINESS SOLUTIONS · THE MASTER DOCUMENT
**Authored by CE-39 on the founder's brief of 2026-09-02. Supersedes the sequencing in TDW_19_BUSINESS_SOLUTIONS_SPEC.md §1 and Addendum K-1 §7; every mechanism in that spec (P0–P7, 7b/7c/7d, K-1's rows) stands and is referenced here by name. This document is the block's constitution: any chair who charters a Block 19 sitting reads it whole first.**

---

## 0 · THE VISION, IN THE FOUNDER'S OWN TERMS

TDW is not a wedding marketplace. Every wedding platform in India runs on commission and sells vendors *visibility* — paid tiers, lead volume, badges — and a good artist ends up beside a rich one who bought the placement. TDW sells a vendor **her own business infrastructure plus the means to scale it**, at a monthly price below what the messaging layer alone costs elsewhere (AiSensy and its kind charge two to three times TDW's highest tier for a fraction of this). Leads are a by-product. The platform wins when the vendor's business runs well, not when a lead converts.

The pitch, as the founder will say it to a vendor:
1. **It takes care of the three things that matter:** who owes you money · who your potential clients are · what dates you're working. Money, leads, calendar.
2. **A personal assistant on WhatsApp**, always there — takes bookings on your behalf, drafts replies, sends them when you approve.
3. **Your whole business, run in plain language on WhatsApp.**
4. **A storefront that does justice to your work** — stunning, not chaotic, and free of commission and paid placement.
5. **And this block adds the fifth line: every wedding you shoot brings you the next one.**

Why Block 19 comes before Block 09 (founder's ruling, 2026-09-02): vendors will not switch their business onto software that is half of what they need. The product is finished before it is sold, so onboarding is an *explanation*, not an *installation*. **Block 09 (UI/UX, soul, `log_expense`, Victor analytics) does not open until every feature in this document is built** — with one exception: features gated on a Meta review are built fully on our side, tested on Meta's development/test accounts, and go live the moment the grant lands. Nothing waits on Meta except the switch.

The standard this block is held to: **business solutions no one company offers — and where one does, it charges exorbitantly and the work is poor beside ours.**

---

## 1 · THE THESIS THAT SHAPES EVERY FEATURE

**The wedding is the ad.** A vendor works a wedding of four hundred guests. Twenty of them are engaged or about to be. She spends nothing on them — then goes home and pays Instagram to reach strangers. Her single largest untapped channel is the wedding she just worked, and the proof of her work leaves the venue in four hundred phones and never comes back. This block brings it back, credits it, and lets it sell.

Three consequences, binding on every room:
- **Every feature starts from a wedding that already happened**, or from the vendor's own data (calendar, books, leads, portfolio). Nothing is bought, scraped or invented.
- **Nothing arrives as a dashboard.** Every output is a WhatsApp message to the vendor, or a page a couple sees. If a feature needs the vendor to open a screen and study it, it is not a TDW feature.
- **No commission, no paid placement, no ranking by spend, anywhere.** Not on the storefront, not on the credit roll, not on venue pages, not on the partner network. The date-lock retainer passes Razorpay's cost through at cost, shown before payment, and is the only money that ever moves on the platform.

The three-role ecosystem this block builds for, beyond the vendor herself:
- **The stylist** — the network's switchboard. She knows every MUA, hairstylist and photographer, and she is the one who makes a shoot happen. She is not a vendor category; she is a node, and she gets an account of a new kind.
- **The influencer** — the model at the styled shoot, trading content for reach. Her Instagram reach, consented, becomes a card vendors pick her by.
- **The venue coordinator** — the most powerful referrer in the industry, with no tool. Couples pick the venue first and ask "who do you recommend?"

---

## 2 · LAWS THAT BIND THIS BLOCK (in addition to the spec's §10 and the estate's standing laws)

1. **Mock-first** for every vendor-facing and couple-facing surface; founder veto on every byte; copy law (no persona names in chrome, `Rs X,XX,XXX`, no ₹).
2. **Build-dark law for Meta-gated features:** a feature whose runtime needs a permission not yet granted is built whole, benched, and walked on Meta's test/development accounts; it ships behind ONE named flag per permission with the go-live step stated in the code and the charter; the grant flips the flag and nothing else. Exception, derived and recorded (F-K3.8): Embedded Signup cannot be exercised before Advanced Access because the gate is App-LIVE's Live mode, not a missing test account — F8 alone is sequenced strictly after the grant.
3. **Two Meta apps, by law (06.5 §3):** WhatsApp and Instagram permissions ride App-LIVE (`1425513376067685`); ads permissions ride the second app under portfolio `995204059832918`, never App-LIVE. Production messaging's policy fate is never put in an ads review basket.
4. **Consent is a switch the vendor or couple owns**, one home each, read everywhere: publication of a wedding, guest-lead capture, review requests, reach cards, credit tags. Silence never means yes.
5. **The vendor's rails are hers.** UPI ID, UPI QR, bank details and GSTIN print on her invoice; TDW never inserts a payment link that routes money through TDW (founder's ruling: cash-driven industry, tax visibility, platform leakage).
6. **One home per table, `tsc` is the sweep, floors by SET** — every sitting in this block inherits CE-39's instrument laws (FINDINGS_LOG band 5 §2).
7. **The founder's word on names:** room names are working labels in this document; the founder rules the final vocabulary (business language, no poetry, tiles say what is inside).

---

## 3 · THE ROOMS — nine rooms under Business Solutions (working names; founder rules the final set)

| # | Working name | What a vendor gets | Absorbs from the spec |
|---|---|---|---|
| R1 | **Wedding credits** | Every delivered wedding becomes a page, a guest gallery, a credit roll for every vendor on it, a printed QR unit, a reel — and a source of leads with a date attached | NEW; P3 SEO becomes a property here; P5's printed unit |
| R2 | **Google search** | Her Google Business Profile claimed and synced; a review asked for after every wedding; the verified seal | P1 |
| R3 | **Site & domain** | Her website on her own `.in`, filled by her (7d editor), showing real weddings, packages, testimonials, venue chips — and live "check my date" | P2, P2-B (7d), P5 rate card + one-pager |
| R4 | **Contracts & retainers** | A contract she sends, the couple signs on WhatsApp by OTP, a sealed PDF, a retainer that locks the date; appointments booked into her calendar | NEW (the roadmap's "appointments" and "date lock") |
| R5 | **Money owed to you** | Milestone reminders to the couple in her voice; the five-year couple (anniversary, maternity, newborn nudges) | NEW |
| R6 | **Content & ads** | The weekly Instagram brief; post cards, story cards and reels rendered in-house from her own work; broadcasts; referral broadcast; ads at rung 2 (Reading B) | P4, K-1 F6/F1/F1b/F7 |
| R7 | **Partners & collabs** | Overflow-lead exchange with peers; the stylist-run shoot board with influencers as models; reach-verified influencer exchange; venue pages; "book the same team" bundles | K-1 F4, the Collab room |
| R8 | **Open dates & pricing** | Hot dates fed from a panchang source; demand pulse on the storefront; open-date selling by Victor; rate nudges; benchmarks and, later, pricing intelligence | Hot dates (exists), P6 |
| R9 | **Your own number** | Her number as a WABA under TDW's Tech Provider portfolio, Victor answering on it; enquiry routing; the missed-call bridge; Embedded Signup | 7b, 7c, K-1 F3, F8 |

---

## 4 · THE PHASES — build order by growth-per-sitting, gates respected

Each phase states: outcome · mechanism · data (candidate DDL, chair-ruled at charter, founder-run in the Supabase editor, migrations append-only) · doors · the WhatsApp surface · the Instagram surface where one exists · gate · founder walk. Every phase is one to four seats' work; each seat gets its own §10-shaped kickoff from this document.

### G0 · DERIVATIONS (one sitting, zero product bytes)
- The delivery path today: how a gallery reaches a couple (Cloudinary, portfolio approval gate, what "delivered" means in `events`).
- The render arm's fitness for post cards, story cards, tent cards (Chromium via `mock_shot.cjs`) and reels (is ffmpeg present in the container/Railway image?).
- The template inventory on WABA `1739793260373677` vs `1299109268220358` (F-K4.1) — the collector, the review ask and the reminder each need an approved Utility template on the sending WABA.
- Two DB hooks: `leads.source` (exists?) and `events.delivered_at` (exists?). Column-witnessed by ordinal.
- The Instagram plumbing already in the tree (Block 07's import: OAuth, token refresh, media read) — what §5 extends.
- Block 05 sealed whole? (F8's gate.) GBP eligibility date (2026-10-27).
- The couple-side consent surfaces: where a couple's "publish our wedding" switch would live (Frost/Bride lane).

### G1 · WEDDING CREDITS (R1) — 3 sittings — no external gate
**G1.1 The gallery and the credit roll.** When an event is marked delivered, the photographer uploads the gallery (or designates the portfolio set). TDW publishes `/w/<handle>/<wedding-slug>` — hero, gallery, venue, city, season — and the **credit roll**: *shot by · makeup · hair · décor · mehendi · planner · styled by · wearing · venue*, each a link to that vendor's storefront. Untagged credits get a WhatsApp from TDW: "You're credited on Priya & Arjun's wedding — claim your page." **This is the acquisition loop: one photographer brings the whole roll.**
- Data: `weddings (id, owner_vendor_id, event_id, slug UNIQUE, title, venue_id NULL, city, season, delivered_at, gallery_ref, couple_consent bool, visibility CHECK)` · `wedding_credits (wedding_id, role CHECK(list), vendor_id NULL, phone, name, status CHECK('tagged','claimed','declined'))`.
- Doors: `GET /v/w/:slug` public · `POST /studio/weddings` · `POST /studio/weddings/:id/credits` · `POST /credits/:token/claim` public.
- WhatsApp: the day after delivery Victor asks, "Priya & Arjun's gallery is up — who else was on the team?" and takes handles or numbers.
- Instagram: mentions webhook (§5) attaches tags to the roll once granted.
- Refusals: no editing another vendor's credit; the couple's consent switch governs publication; the roll is never ordered by anything but role.

**G1.2 The guest gallery and leads with a date.** The couple shares the gallery; a guest enters her phone to download; one question: *"Planning a wedding? When?"* A yes with a month writes a `lead` (`source='wedding_guest'`, `wedding_id`, `intent_month`) for **every credited vendor**, with the date, at the moment of maximum proof. Victor's first reply follows as usual.
- Data: `leads.source`, `leads.wedding_id`, `leads.intent_month`.
- Refusals: the guest's phone reaches no vendor until she opts in to be contacted; one question, never a form.

**G1.3 The printed unit, the reel, the team.** Tent card and thank-you insert carrying the credit-roll QR, rendered in the vendor's tokens to PDF for her printer. A 15-second reel cut from the gallery in-house, caption drafted, credits tagged, handed to her to post. **"Book the same team"** on the roll: one enquiry to every credited vendor.
- Walk: founder marks DEV440's fixture wedding delivered, tags two credits, downloads as a guest, a lead with a date lands on both vendors, the tent-card PDF renders.

### G2 · GOOGLE SEARCH (R2) — 2 sittings — gated on 2026-10-27
- P1 as specced (claim, sync hours/areas from the 7d editor).
- **The review ask:** after every delivered wedding, one Utility template to the couple with the GBP review link; the review, when it lands, feeds the storefront's testimonials (7d §6) and the seal. Once per couple, ever.
- **The verified seal:** `TDW-verified · N weddings · rating · delivers in D days` computed nightly from `events` (delivered), `contracts` (signed), reviews. On the storefront and the invoice. Not editable. Not shown under three weddings.
- Data: `vendor_seal (vendor_id PK, weddings int, rating numeric, delivery_days int, computed_at)`.

### G3 · SITE & DOMAIN, CONTRACTS & RETAINERS, MONEY OWED (R3 · R4 · R5) — 4 sittings
**G3.1 Site & domain grows.** 7d's editor as specced, plus **live availability** — "check my date" reads the calendar's occupancy checker and answers free / held / booked, never a client's name — plus real-wedding sections auto-fed from G1, venue chips, the seal, packages with `Rs` bands under her `rate_display` switch. SEO is a property of these pages: `LocalBusiness` and `Event` schema, per-wedding pages, venue and city in titles. No score, no report, no promise that platform traffic exists.

**G3.2 Contracts.** One generic template per category, founder-vetoed and lawyer-passed once (scope · dates · deliverables · payment schedule · cancellation · refund · usage rights · force majeure); the vendor customises once (her prices, her policies) and reuses. Flow: Victor sends the couple a link → she reads on her phone → OTP to her number → *I agree* → TDW seals a PDF with SHA-256, timestamp and both phone numbers → both parties receive it on WhatsApp → `contracts.state='signed'`. IT Act 2000 §10A click-wrap with audit trail; no Aadhaar eSign. TDW is never a party.
- Data: `contract_templates (id, category, version, body_md, fields json)` · `contracts` gains `template_id, terms json, signed_at, signer_phone, signature_hash, pdf_url`.
- Doors: `POST /studio/contracts` · public `GET /c/:token` · `POST /c/:token/otp` · `POST /c/:token/sign`.

**G3.3 Retainers and appointments** (the roadmap's two items, now specced). Contract signed → retainer requested (Razorpay link; the founder's rule: Razorpay's cost passed through at cost, shown before payment, never a commission) → on success `events.state='booked'` and the date locks; default retainer 10% (founder rules the default and whether it is per-vendor editable). Appointments: a couple books a consultation slot from the storefront into the calendar (occupancy-checked); Victor confirms both sides.

**G3.4 Money owed to you.** The **polite collector**: milestone reminders to the couple in the vendor's voice from `payment_schedules` (Utility template; "UPI or cash, whichever suits"); the vendor approves the first, then a standing switch. The **five-year couple**: cron on `events.event_date` anniversaries → Victor to the vendor: "Priya & Arjun's first anniversary is next week — send a wish? offer a shoot?" Wedding → anniversary → maternity → newborn → first birthday: five shoots from one CRM row, zero acquisition cost.
- Gate: two Utility templates approved on the sending WABA.

### G4 · CONTENT & ADS, OPEN DATES & PRICING (R6 · R8) — 4 sittings
**G4.1 The weekly Instagram brief** (needs `instagram_manage_insights`, §5): Sunday, one message — reach, follower change, the post that did best and *why* (saves and shares, not likes), the hour her followers are online → "post Tuesday at 8pm." Built dark, live on grant.
**G4.2 In-house content.** Post card + caption drafted from the last gallery; WhatsApp status card; story card; all rendered through the render arm in her tokens; she posts (rung 1). Rung 2 — TDW publishes with the credit roll tagged — on `content_publish` (§5). **Canva is refused:** its Autofill API requires the acting user to be on Canva Enterprise.
**G4.3 Broadcasts** (K-1 F1) with Meta's per-conversation fees passed through at cost and shown before send; the **referral broadcast** to past couples once a year; catalog messages (F1b) after the storefront work.
**G4.4 Open dates & pricing.** Hot dates fed from a panchang source (admin override stays); **demand pulse** ("3 brides checked Nov 22 on your page this week"); **open-date selling** — Victor weekly: "Nov 22 and Dec 6 are open. Four enquiries asked about November — offer them?" one tap, four messages in her voice; **rate nudges** on demand ("three enquiries on Nov 22 — consider Rs 1,60,000"). Say "yield management" once when explaining it; never put it on a tile.
- Data: `date_checks (vendor_id, date, checked_at)` · `hot_dates` (exists; gains `source`).
**G4.5 Ads at rung 2 — Reading B** (K-1 F7 as ruled): TDW composes creative and audience from her own ledger and portfolio; she builds and publishes in Ads Manager; TDW reads results. Needs the second Meta app and `ads_read` + `business_management`. Managed spend is refused forever.

### G5 · PARTNERS & COLLABS (R7) — 4 sittings — on the Collab room's arc
**G5.1 The overflow exchange.** A booked vendor forwards an enquiry she can't take to a trusted peer in one tap, with a note; TDW keeps the reciprocal balance ("sent 3 · received 1"); the peer's Victor takes it from there. Commission-free by law; the balance is the only currency.
- Data: `lead_referrals (id, lead_id, from_vendor_id, to_vendor_id, note, created_at, outcome CHECK)`.
**G5.2 The shoot board, stylist-run.** The stylist account (K-1 F4's new account kind; name and price the founder's) posts a concept — theme · date · city · mood — and the roles it needs, including the model. Vendors offer; the stylist casts; TDW writes the date into every calendar; the gallery publishes with the credit roll, *styled by* first. One shoot, seven growth pages, zero commission.
**G5.3 The influencer exchange.** The influencer account: consented IG insights (§5) → a **reach card** — audience by city, age, gender; never follower identities. Vendors pick models by audience fit, not follower count; content-for-reach terms are stated on the board.
**G5.4 Venue pages and team bundles.** Venues tagged on weddings get a page — "vendors who've worked here" — and a free coordinator account; the coordinator hands the page to couples. "Book the same team" grows into vendor-declared bundles with a bundle price.
- Refusals: no paid placement on any page; no ranking by spend; TDW never brokers payment between vendors or between vendor and influencer.

### G6 · YOUR OWN NUMBER (R9) — as specced — gated on Meta's Advanced Access grant
7b / 7c / K-1 F3 / F8 unchanged. **F8 item ZERO** (before a byte): read the Tech Provider Terms in full (F-K3.13, §5.2 data restrictions against the estate's model providers), amend the customer terms page for §6's flow-down (F-K3.12) before the first onboarded vendor, then press `Start onboarding` as an Independent Tech Provider. F8 builds on Embedded Signup **v4** (v2 deprecates 2026-10-15), subscribes the `account_update` webhook, registers the domain in both Allowed domains and Valid OAuth redirect URIs, and introduces the **business-token model** beside the system user (F-K3.10). Developer-app WABAs cannot be onboarded through ES; none of the estate's three is a migration path.

### G7 · BENCHMARKS AND PRICING INTELLIGENCE (R8) — when the cohort exists
P6 as specced (per city and category: median first-reply time, reply rate, enquiries per month, conversion), plus anonymised, consented rate bands per (city, category, tier) from the platform's own invoices — "photographers at your tier in Delhi quote Rs 1,40,000–1,90,000 for two days." Requires ≥20 consenting vendors per cell; never a single vendor's number; Business Discovery (public counts) gives honest peer posting benchmarks without touching anything private.

### G8 · THE COLD WALK (R-39.19) — after every phase above
A friend who has never seen the product signs up cold on production and narrates every pause. That reading feeds Block 09. It happens after Block 19, not after the flip — a one-shot instrument spent when the vendor's whole offer is standing.

---

## 5 · THE INSTAGRAM PLAN — the shop window; WhatsApp is the counter

Instagram is where the footfall happens — profile visits, reels, DMs. WhatsApp is where the business runs. This block's job is to **walk the couple from the window to the counter** and to make Instagram feed the wedding credits rather than compete with them.

**What Instagram's API permits a third party to do for a Business/Creator account that has authorised the app (Graph v25, verified 2026-09-02):** read her posts, reels and stories with per-item metrics (reach, views, saves, shares, profile visits, link taps) and account analytics split by follower vs non-follower; audience demographics (age, gender, top 45 cities) at 100+ followers; comments on her posts; @mentions of her by webhook; other business accounts' *public* counts (Business Discovery). Write: publish images, reels, carousels and stories (50/day, user tagging on reels); reply to, hide, delete comments; like posts and comments (`instagram_manage_engagement`, new April 2026). Message: the Instagram Messaging API — read and send DMs, 200 automated/hour, inside 24 hours of her message (7 days with the human-agent tag). **Not permitted:** anyone's private data, follower lists, scraping, personal accounts, hashtag streams beyond 30 lookups a week.

**The features, in the order their permissions file:**
| # | Feature | Permission | Room | Notes |
|---|---|---|---|---|
| I1 | Portfolio import (exists) — the re-record | `instagram_business_basic` | R3 | Video C owed; legibility is the whole cure (K-3 correction 7) |
| I2 | **The DM bridge** — Victor answers IG DMs in her voice, checks the calendar, moves the lead to WhatsApp where it is captured | `instagram_business_manage_messages` | R6/R9 | the single biggest uncaptured enquiry source; **file first after the WhatsApp pair returns** |
| I3 | The Sunday brief; influencer reach cards | `instagram_manage_insights` | R6, R7 | built dark, live on grant |
| I4 | Publishing from TDW — post cards, reels with the credit roll tagged, **open-date stories** with a reply sticker | `instagram_business_content_publish` | R6, R8 | rung 2 of F6; 50/day |
| I5 | Comments as the first reply — "price?" → "sent you a DM" → Victor | `instagram_business_manage_comments` | R6 | with I2 |
| I6 | Mentions become credits — a tag by a bride, venue or vendor attaches to the roll | mentions webhook (with I1/I5) | R1 | |
| I7 | Peer posting benchmarks | Business Discovery (with I1) | R8 | public counts only |
| I8 | Engagement (like the comment that becomes a lead) | `instagram_manage_engagement` | R6 | last; lowest value |

**The bio link** — the one thing Instagram cannot do — points to her storefront with live "check my date" (G3.1). No competitor can put availability behind a bio link because none owns the calendar.

**Filing law for this table:** all on App-LIVE (the IG-import precedent, TDW_07 §2), never on the ads app; one submission per permission or a small basket; each with its own per-permission screen recording under the K-3 legibility law (font size up, show taps, zoom to the copy, English UI, no audio); use-case texts that describe only what the code does (K-3 law two); the system-user declaration where a field exists. **Build-dark law (§2.2) applies to every row:** the feature is built whole and walked on a test/developer-role account, ships behind one flag per permission, and flips on grant.

---

## 6 · GATES AND EXTERNAL DEPENDENCIES (dated; the chair keeps this table current)
| Gate | Blocks | State 2026-09-02 |
|---|---|---|
| Meta App Review — WhatsApp pair, submission `1461935125758843` | G6 (F8), business tokens | Filed 2026-09-02 03:53 IST; Review in progress (~20 days) |
| Meta App Review — `instagram_business_basic` | I1 | Not filed; Video C owed |
| Meta App Review — `instagram_business_manage_messages` | I2 | Not filed; next after the pair |
| Meta App Review — `instagram_manage_insights` | I3, G5.3 | Not filed |
| Meta App Review — `instagram_business_content_publish` | I4 | Not filed |
| Meta App Review — `instagram_business_manage_comments` | I5 | Not filed |
| Second Meta app + `ads_read` / `business_management` | G4.5 | App not created |
| GBP API eligibility (60-day profile age) | G2 | 2026-10-27 |
| Block 05 sealed whole | G6 F8 | chair derives |
| Utility templates on the sending WABA (review ask · collector · reminder · missed-call) | G2, G3.4, G6 | F-K4.1 split to be derived in G0 |
| ResellerClub reseller account (`.in` in INR) | R3 domains | as specced |
| Panchang data source | G4.4 | founder picks; admin override stays |
| Tech Provider Terms read in full; customer terms amended (§6 flow-down) | G6 item ZERO | owed before F8 |
| Embedded Signup v2 deprecation | G6 | build on v4; v2 ends 2026-10-15 |

---

## 7 · REFUSALS (binding; each was decided with a reason, recorded here so it is not re-proposed)
- **No commission, ever, on anything.** Vendors leave platforms that tax them.
- **No pay-link on the invoice that routes money through TDW.** UPI ID, UPI QR, bank details and GSTIN are the vendor's own rails, printed on her document. Reason: cash-driven industry, tax visibility, platform leakage (founder, 2026-09-02).
- **No Canva.** The Autofill API requires Canva Enterprise for the acting user. Render in-house.
- **No platform-traffic SEO claims** ("optimise for our marketplace"). Real-wedding pages are the SEO; it works at one vendor.
- **No paid placement, no spend-ranked surface**, on the storefront, the credit roll, venue pages or the partner board.
- **No dashboards.** WhatsApp messages and pages a couple sees.
- **No scanning of paper contracts.** The contract is a WhatsApp flow with OTP e-sign.
- **No scraping of anyone's Instagram.** Consented accounts only; public counts only via Business Discovery.
- **No guest phone exposure** without the guest's opt-in.
- **No managed ad spend** (K-1 refusal); no influencer marketplace with TDW as broker; no reseller purchase; no multi-platform ad analytics.
- **No third stripper, no second writer home, no hand-rolled instrument** — the estate's own laws.

---

## 8 · OPEN FOUNDER QUESTIONS (ruled at charter of the phase that needs them)
1. **Room names** — the founder rules the final vocabulary (business language; tiles say what is inside).
2. **Credit-roll roles** — the fixed list (shot by · makeup · hair · décor · mehendi · planner · styled by · wearing · model · venue): add or strike.
3. **Gallery hosting** — Cloudinary at the current plan, or a storage tier per vendor (cost per wedding).
4. **Contract template** — one generic with category riders, or one per category; who passes the first draft (founder + lawyer).
5. **Retainer default** — 10%? Editable per vendor?
6. **Account kinds** — stylist, influencer, venue coordinator: names, and free at launch or priced.
7. **Panchang source** for hot dates.
8. **Which of G1–G5 the first beta vendors see** — the pitch's fifth line.
9. **Couple consent** — where the "publish our wedding" switch lives on the couple lane, and its default.

---

## 9 · ALREADY SPECCED vs NEW — so nothing is built twice
**Existing and unchanged:** P1 Google page · P2 domains (ResellerClub + Vercel) · 7b own number · 7c enquiry routing (three rungs) · 7d page editor (nine sections) · K-1 F1 Broadcasts, F1b catalog, F3 missed-call under 7b, F6 Posts authored, F7 Ads Reading B, F8 Embedded Signup · hot dates (admin-fed) · the Collab board · payment schedules and milestones · UPI ID + QR on the invoice · the calendar's occupancy checker · crew and crew pages · the demo lifecycle · Block 07's IG import.
**New in this document:** wedding pages + credit roll · guest gallery + date-attached leads · printed QR unit · reels from the gallery · book-the-same-team · the review ask + the verified seal · live availability on the storefront · contracts flow with OTP e-sign · retainers + appointments (roadmap items, now specced) · the polite collector · the five-year couple · the Sunday Instagram brief · in-house content rendering · panchang auto-feed · demand pulse · open-date selling + rate nudges · the overflow exchange · the stylist-run shoot board · the influencer exchange with reach cards · venue pages + team bundles · pricing intelligence · the DM bridge, comments-as-first-reply, mentions-as-credits, open-date stories · the build-dark law.

---

## 10 · HOW THIS BLOCK SEALS
Block 19 is SEALED when every phase G0–G7 is built and walked on the founder's glass, with every Meta-gated feature either live on grant or built dark behind its named flag with its go-live step recorded; when the gates table (§6) shows every filing filed; and when the cold walk (G8) has been run and its reading handed to Block 09. **Block 09 opens the day after.** The chair who seals it cuts the register band that says so, and the P0-A ledger carries every Meta grant date.

---

## 11 · A GLOSSARY FOR THE VENDOR CONVERSATION (the power move: the term, then the plain sentence)
- **Attribution** — every wedding credits everyone who worked it, and every guest who downloads a photo sees who to book.
- **Yield management** — pricing empty dates by demand, the way hotels price rooms; "which dates to push, which to price up."
- **Retainer** — the deposit that holds a date; "signed on WhatsApp, date locked."
- **Receivables** — money owed to you; "a polite reminder goes out in your voice so you never chase."
- **Local SEO / the map pack** — the three businesses Google shows on the map; "your reviews decide if you're one of them."
- **Reach card** — an influencer's audience, verified: "62% of her followers are 22–34 in Delhi."
- **Overflow** — the enquiry you can't take; "send it to a peer, get theirs back, we keep score."
- **The DM bridge** — "your Instagram brings them to the door; we answer it."

*This document is the record of the founder's vision for Block 19 as of 2026-09-02. A future chair changes it only by a dated amendment beneath this line, never by rewriting above it.*

---
## AMENDMENT 1 · 2026-09-04 (CE-40; founder-ruled in chat, banked in FINDINGS_LOG band 7 §5)
- **§3 room names are RULED (R-40.1):** R1 Wedding pages · R2 Google reviews · R3 Your website · R4 Contracts & deposits · R5 Payment reminders · R6 Posts & ads · R7 Referrals & partners · R8 Open dates & rates · R9 Your own number. The §3 table's "Working name" column is superseded by this list; its other columns stand.
- **§4 G1.1's address** `/w/<handle>/<wedding-slug>` predates the flip (`/w/` retired into `/vendor/` 2026-09-04). Wedding pages live at **`/v/<code>/w/<slug>`** (R-40.15). Its door `GET /v/w/:slug` reads accordingly.
- **§4 G1.1 data:** `delivered_at` lives on the `weddings` row, never on `events` (R-40.11). The gallery is a new asset plane with the signed-upload primitive of `igImport.js:241` extracted to one exported home (R-40.12). `leads.source` stays free text (R-40.13). G1.1 ships zero render bytes (R-40.14).
- **§5 I3 permission string** is `instagram_business_manage_insights` (R-40.6). **I7 and I8 are PARKED** to G7's charter — Facebook-Login-only under Meta's one-IG-setup-per-app rule; no third app (R-40.5, 06.5 §3 stands).
- **§8 answered:** 1 (R-40.1) · 2 roles fixed: shot by · makeup · hair · décor · mehendi · planner · styled by · wearing · model · venue (R-40.7) · 3 Cloudinary at the current plan (R-40.8) · 8 G1.1 → G1.2 → G1.3 (R-40.10) · 9 the switch lives in the couple's Settings room, OFF by default (R-40.9). Open: 4, 5, 6, 7.
- **§6 gates:** F-K4.1 CLOSED as duplicate (G0); the review-ask template is MARKETING (F-40.12); no missed-call template exists (F-40.13); ffmpeg unproven (F-40.16) — reels build dark.
