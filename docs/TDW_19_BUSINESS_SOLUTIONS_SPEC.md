# TDW_19 · BUSINESS SOLUTIONS — THE VENDOR'S MARKETING DESK
**Spec v1 · authored by CE-38 · 2026-08-28 · founder-approved scope (six lines, one word: 「approved」) · status: SPEC READY, not chartered**

> Reader: this document is written for an LE seat that has never met the estate, building under a chair who has never met this block. Every claim marked **DERIVE** is a claim the seat re-derives at origin by command before writing a byte; nothing here is a column witness (SQL-provenance law: never author a column from memory — `docs/SCHEMA.md` is the witness, this spec is not). Founder holds veto over every vendor-facing byte; every string in §9 ships only after his one pass.

---

## §0 · WHY THIS BLOCK EXISTS

The listing marketplaces (WedMeGood, WeddingWire India, Justdial) sell vendors *visibility* — paid tiers, lead volume, badges — and hold none of the vendor's work. The CRM tools (HoneyBook and kin) hold the work and sell no visibility. Website builders (Wix, Canva) hold neither. TDW holds the vendor's bookings, money, portfolio, enquiries and calendar under a zero-commission subscription. Business Solutions is the set of things **only a platform holding that data can do for a vendor**, offered as rows under the existing `Business Solutions` tile.

**The doctrine, binding on every phase:** we sell nothing that a generic tool does as well. No drag-and-drop site builder. No "SEO score out of 100." No directory listing we don't own. Each row below is a thing that reads the vendor's own ledger, calendar or portfolio and does work on their behalf that they currently do by hand or not at all.

**Six rows, founder-approved, in delivery order:**

| Row | One line | Phase |
|---|---|---|
| **Google page** | Their Google Business Profile claimed, kept in sync, reviews arriving on schedule | P1 |
| **Website** | Their storefront on their own domain, bought and wired in one tap | P2 |
| **SEO** | The storefront indexed, structured, fast, and reported on — real, not a number | P3 |
| **Marketing** | Ads and posts authored from their own portfolio and calendar | P4 |
| **Proof** | Rate card, one-page profile, Q&A — the things they send fifty times a month | P5 |
| **Benchmarks** | How they compare with their category in their city — only the marketplace can say it | P6 |

---

## §1 · SEQUENCING (the founder's question, answered on the record)

Block 09 is `UIUX + SOUL` (masterplan row 09): its UIUX half is M-WORKLIST (the shell, M-FINISH, Phase 4 Today, Phase 7 cutover); its SOUL half is the Victor-intro and Mira soul sittings, which are WhatsApp-side engine work.

**Ruling proposed for the founder (his word seals it):** Business Solutions becomes **Block 19**, and it opens **after Block 09's UIUX half seals (Phase 7 cutover)** and **in parallel with, not after, Block 09's SOUL half.** Reasons:
1. Every Business Solutions row is a surface inside the shell. Building rows into a shell that is still moving is the sweep-over-a-façade disease F-38.1 just cured. The cutover is the prerequisite.
2. The soul sittings touch `src/agent/*` and the WhatsApp lanes; this block touches `src/api/vendor/*`, the storefront, and external APIs. Different repos' regions, different seats. They do not contend.
3. P1 (Google page) and P2 (Website) are **acquisition levers** — a vendor with a claimed Google page and a real domain is a vendor who stays. Pre-revenue, that outranks polish on the WhatsApp voice.

Order of phases inside the block is fixed as listed; P1 and P2 may run on two seats concurrently after P0. Founder re-sequences at will.

---

## §2 · WHAT IS ALREADY IN THE TREE (the seams) — all **DERIVE** at seat time

- `dreamos-pwa/lib/worklist/rooms.ts` — the `support` room, label `Business Solutions`, `href: '/w/support'`, `pinnable: false`. The rows land inside `app/w/support/page.tsx`, one row per approved line, each row a `<Link>` to `/w/support/<row>`.
- `dreamos-pwa/app/demo/vendor/[handle]/*` — the demo studio, rendered from `demo_vendors` (Block 08). **DERIVE whether a live (non-demo) public storefront route exists.** If it does not, P2's first motion is to ship one; the Discover card + RevealSheet (`app/(landing)/discover/*`) is the only public vendor surface the chair could find at 6b28864.
- `dream-os/src/api/vendor/*` — the vendor API plane. `portfolio.js`, `couture.js`, `roster.js`, `availability.js`, `events.js`, `invoices.js`, `leads.js`, `me.js`, `billing.js` are the readers each phase composes from. Business Solutions **never writes** to a room's table; it reads through the room's existing endpoint or a new read-only door.
- `dream-os/docs/SCHEMA.md` — the column witness. Known at authoring: `vendors.routing_handle` (text UNIQUE, e.g. `DEV550`), `vendors.instagram_handle`. **DERIVE** `vendors` whole before P1.
- `docs/PUBLIC_SCHEMA.md` regeneration is owed (several migrations behind). **P0 regenerates it.** No phase opens against a stale schema doc.
- Money register everywhere: `Rs X,XX,XXX`; no `₹`, no `k/L/Cr`. Persona names never in chrome. Type scale and register per R-38.4/R-38.6 — the rows are functional chrome, not brochure.

---

## §3 · P0 — DERIVATIONS AND THE CONTRACT (one sitting, zero product bytes)

Outputs, all docs:
1. `docs/PUBLIC_SCHEMA.md` regenerated from the live migration set; diff to the old file filed as a finding list.
2. `docs/specs/TDW_19_P0_SEAMS.md` — the answers to every **DERIVE** in this document, each with the command that produced it.
3. `docs/specs/TDW_19_COPY_REGISTER.md` — every vendor-facing string in §9, `proposed` column filled, `approved` column empty, for the founder's one pass.
4. The env-var ledger (§8) with each key's owner, where it is set (Railway / Vercel), and whether it exists yet.
5. A ruled answer to the storefront question (§2, bullet 2).

P0 seals when the chair has re-derived (2) by command at three sampled lines and the founder has passed (3).

---

## §4 · P1 — GOOGLE PAGE (Google Business Profile)

**Outcome:** the vendor taps once, TDW holds an OAuth grant to their Google Business Profile, keeps name / category / hours / services / photos in sync from the Storefront, Portfolio and Couture rooms, and fires a review request to each couple after their event date via WhatsApp, landing on the vendor's Google review link.

**Mechanism:**
- Google Business Profile APIs (Business Information, Account Management, Reviews/Performance). Access requires a Google Cloud project with GBP API **quota approval** — a Google-side application with review time. **This is the long pole of the whole block; the founder files the quota request in P0, not P1.** Until quota lands, P1 builds against the API's sandbox shape with the OAuth flow real and the sync calls fully commented (conditional-withheld rule).
- OAuth: standard code flow, scope `https://www.googleapis.com/auth/business.manage`. Refresh token encrypted at rest. One grant per vendor.
- Sync is **one-directional, TDW → Google**, on a cron (P4 of Block 05 owns crons — reuse its runner, **DERIVE** its file) and on Storefront save. Never Google → TDW; the estate's rooms stay the source of truth.
- Reviews: on `events.end_date + 3 days` for events with a linked couple phone, send the `review_request` WhatsApp template (Meta Cloud API direct, vendor lane) carrying the vendor's short review URL (`https://search.google.com/local/writereview?placeid=…`). One send per couple per event; opt-out honoured. Template text is a founder byte (§9).
- Not-claimed path: if the vendor has no profile, the row shows the claim steps as a three-line checklist deep-linking to Google's claim flow, and TDW polls for the grant. We do not create profiles on their behalf (Google policy).

**Storage — candidate DDL, chair-ruled, columns from the migration not from this page:**
`vendor_integrations (id, vendor_id → vendors, provider text CHECK IN ('google_business'), external_account_id text, external_location_id text, refresh_token_enc bytea, scopes text[], status text CHECK IN ('pending','active','revoked','error'), last_synced_at timestamptz, last_error text, created_at, updated_at)` — one row per (vendor, provider) UNIQUE.
`review_requests (id, vendor_id, event_id → events, couple_phone text, sent_at timestamptz, channel text, template_name text, status text)` — the sole audit of what was sent.

**Endpoints (read-only doors except the OAuth pair):** `GET /api/v2/vendor/solutions/google` (status, profile summary, last sync, review count) · `POST /api/v2/vendor/solutions/google/connect` (returns the OAuth URL) · `GET /api/v2/vendor/solutions/google/callback` · `DELETE …/google` (revoke). All behind the vendor session middleware (`resolveVendor.js`, **DERIVE** its current header).

**PWA surface:** `/w/support/google` — state chip (Not connected / Connected / Needs attention), last sync line, review count, one button. Type scale t2/t3/t4 only.

**Bench (`scripts/b40_solutions_google_bench.js`):** OAuth URL shape · callback stores an encrypted token and never logs it · sync payload built from the rooms' endpoints and diffed against a fixture · review request fires exactly once per (couple, event) and not before `end_date + 3d` · revoke tombstones the token. Both-ways by mutating production source. Floor-method: exit code is the verdict.

**Founder walk:** on `9888294440`, connect a test GBP (the founder's own test business), save a Storefront change, witness the sync row; SQL fixture SELECTs authored by the chair, curl card authored from his pasted rows.

**Refusals:** no Google → TDW sync · no review solicitation to a couple with no linked event · no photo upload of media the vendor has not marked public in Portfolio.

---

## §5 · P2 — WEBSITE (own domain, one tap)

**Outcome:** every vendor has `<handle>.thedreamwedding.in` the day they sign up; the Website row lets them type a name, see what is available, and own `<name>.in` with the storefront live on it — no registrar login, no DNS, no card entry. The domain is registered in **the vendor's name** so it leaves with them.

**Mechanism:**
- **Hosting is already solved:** the storefront is a Next route on Vercel. Wildcard `*.thedreamwedding.in` → Vercel; a middleware maps host → vendor handle. **DERIVE** whether `middleware.ts` already does host-based rewriting for demos.
- **Registrar:** ResellerClub (India; `.in` in INR; reseller API for availability, register, contact records, nameserver set, free email forwarding). Fallback if refused: Vercel Domains API (weaker `.in` pricing, no INR). Domain cost is a **pass-through line on the vendor's next TDW invoice**, at cost, marked as such (R-38.6 register: "Domain · Rs 799 / year · billed at cost").
- **Wiring:** after registration, TDW adds the domain to the Vercel project via the Domains API, sets the registrar nameservers / A record per Vercel's returned verification, and polls until Vercel reports verified + SSL issued. The vendor sees a progress chip for the ~10–40 minutes this takes.
- **Ownership honesty:** registrant contact = the vendor's name, phone, email from `vendors` (**DERIVE** columns); TDW is technical contact only. The row states in one sentence that the domain is theirs.
- **Email:** `hello@<domain>` forwarded to the vendor's email via the registrar's forwarding. No mailbox hosting.

**Storage — candidate DDL:** `vendor_domains (id, vendor_id, domain text UNIQUE, registrar text, registrar_order_id text, registered_at, expires_at, auto_renew bool, status text CHECK IN ('searching','registering','wiring','live','expired','error'), vercel_domain_id text, dns_verified_at, ssl_issued_at, forward_email text, created_at, updated_at)`.

**Endpoints:** `GET /api/v2/vendor/solutions/domain` · `GET …/domain/search?q=` (availability + INR price, ≤5 suggestions) · `POST …/domain/register` (idempotent on `domain`) · `POST …/domain/renew` · `GET …/domain/status`.

**PWA surface:** `/w/support/website` — current address (subdomain by default), search field, results as rows `name · Rs 799 / year · Get`, progress chip during wiring, live link when done.

**Bench (`b41`):** search returns ≤5 and never suggests a taken name · register is idempotent · the Vercel add + verify + SSL state machine advances only on the registrar/Vercel fakes' real responses (fake refuses unknown fields, per P3's lesson) · registrant is the vendor, not TDW · pass-through invoice line lands in `invoices` through **the room's own write door**, never a direct insert.

**Founder walk:** search on `9888294440`, register one throwaway `.in` (founder's card on ResellerClub; cost noted), witness the storefront live on it with SSL.

**Refusals:** no page builder · no themes · no domain in TDW's name · no auto-renew without a visible toggle.

---

## §6 · P3 — SEO (real work, not a score)

**Outcome:** the storefront, on subdomain or own domain, is what Google expects a local business page to be — and the vendor can see impressions and clicks inside TDW.

**Mechanism, all automated, none vendor-visible except the report:**
- Per-storefront `<title>` / `<meta description>` / OpenGraph authored from Storefront fields in the functional register (template strings are founder bytes, §9).
- `LocalBusiness` + `Service` + `ImageObject` JSON-LD from Storefront, Couture, Portfolio.
- Image `alt` from Portfolio captions; WebP/AVIF via Next image; a Lighthouse-mobile floor cell of ≥90 performance on the storefront, in the pwa floor.
- `sitemap.xml` per domain, `robots.txt`, canonical tags (subdomain canonicalises to own domain when one is live).
- **Search Console** verification via the Site Verification API using the same Google OAuth grant as P1 (add scope `siteverification` + `webmasters.readonly`); a weekly pull of impressions/clicks/top queries into a read table for the row's report.
- **TDW's own authority:** `/discover/<city>/<category>` landing pages on `thedreamwedding.in`, statically generated from live supply, each linking down to storefronts. **DERIVE** whether the landing Discover already has city/category routes; if so, this is metadata + links, not new pages.

**Storage:** `search_console_daily (vendor_id, date, impressions int, clicks int, position numeric, top_queries jsonb)` PK `(vendor_id, date)`.

**PWA surface:** `/w/support/seo` — four numbers in t2 tabular (impressions / clicks this month, vs last), five top queries as rows, a checklist of what is live (structured data ✓, sitemap ✓, own domain ✓/—). **No score.**

**Bench (`b42`):** JSON-LD validates against schema.org shapes for a fixture vendor · sitemap lists exactly the public vendors and no draft/demo · canonical points where ruled · Search Console rows are day-idempotent.

---

## §7 · P4 — MARKETING (from their own data), P5 — PROOF, P6 — BENCHMARKS

**P4 Marketing.** Three tools, each a read of the rooms plus one model call (Anthropic, Haiku, same cached-prefix discipline as Victor; provider per Block 06's tier×role table — **DERIVE**):
- *Post* — an Instagram/WhatsApp-status caption + image pick from the last event's Portfolio uploads, offered the day after the event. Vendor copies or shares; TDW does not post to Instagram (Graph API publishing needs a business account link — deferred, named).
- *Referral broadcast* — a WhatsApp template to past couples (event ended > 30 days) inviting referrals, once per couple per year; audited in `review_requests`' sibling `broadcasts`.
- *Ad brief* — a Meta Ads-ready brief (audience: city + 25–45 + engaged-life-event; creative: three portfolio images; copy in register) exported as a PDF; TDW does not spend their money (Marketing API ad creation is deferred, named).
Copy law binds: the model writes in the vendor's voice from the vendor's own descriptions; benches assert behaviour (no persona names, no `₹`, ≤ length), never wording.

**P5 Proof.** Three PDFs from the `pdf` skill's discipline, each a read: *Rate card* (Couture packages, `Rs X,XX,XXX`, validity date) · *Profile one-pager* (Storefront + three Portfolio images + Google rating if P1 is live + QR to the storefront) · *Q&A* (the ten questions couples actually asked this vendor, from `leads`' raw messages, with the vendor's answers pulled from Notes or left blank for them to fill). Stored to Supabase storage under the vendor's prefix; regenerated on demand, never cached stale past a Couture change.

**P6 Benchmarks.** One nightly job computing, per (city, category): median first-reply time, reply rate, enquiries per month, conversion to booking — from `leads` and `events` on the typed plane (**F-P3.11 must be diagnosed first; benchmarks never read the engine plane**). Each vendor sees *their* number beside the category median as two t2 numerals and a one-word direction. Minimum cohort of 5 vendors before a median is shown; below that the row reads "Not enough vendors in <city> yet." Never shows another vendor's number.

**Storage:** `category_benchmarks (city, category, metric, median numeric, cohort int, computed_at)` PK `(city, category, metric)`.

---

## §8 · ENVIRONMENT, CREDENTIALS, COST

| Key | Owner | Set at | Phase |
|---|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` | founder (GCP project) | Railway | P1 |
| `GBP_QUOTA_APPROVED` (bool gate) | founder | Railway | P1 — sync calls withheld until true |
| `INTEGRATION_TOKEN_KEY` (AES-256, 32B) | founder | Railway | P1 |
| `RESELLERCLUB_USER_ID` / `_API_KEY` | founder | Railway | P2 |
| `VERCEL_TOKEN` / `VERCEL_PROJECT_ID` / `VERCEL_TEAM_ID` | founder | Railway | P2 |
| `STOREFRONT_ROOT_DOMAIN=thedreamwedding.in` | founder | Railway + Vercel | P2 |

Costs to state to the founder before P1 opens: GCP project (free tier suffices) · ResellerClub reseller deposit (prepaid, ~Rs 5,000 minimum, **DERIVE current**) · Vercel domains/wildcard on the current plan (**DERIVE**) · Haiku calls for P4/P5 at the Block 06 cap discipline.

---

## §9 · COPY REGISTER (founder passes once; ships only the approved column)

Row labels: `Google page` · `Website` · `SEO` · `Marketing` · `Proof` · `Benchmarks` (nouns, ≤2 words).
State chips: `Not connected` · `Connected` · `Needs attention` · `Searching` · `Live` · `Expired`.
Buttons: `Connect` · `Disconnect` · `Get` · `Renew` · `Make` · `Share`.
Sentences that must exist (proposed; founder's bytes replace them): domain-ownership line · review-request WhatsApp template · referral-broadcast template · below-cohort benchmark line · cost pass-through line.
Templates registered with Meta (P1 review request, P4 referral) need Meta approval — filed alongside the GBP quota request in P0.

---

## §10 · LAWS THAT BIND EVERY PHASE OF THIS BLOCK

Verify-never-trust · report-never-adapt (§0.2) · SQL-provenance (every column names its `SCHEMA.md` line) · sole-writer law (Business Solutions never writes a room's table; invoices via `invoices.js`'s door, events via `eventWrite.js`) · one home per constant · conditional-withheld (Google sync, Instagram publish, Meta ad creation ship commented until their gate flips) · both-ways benches, floor exit-code verdict, non-vacuity by mutating production source · money register `Rs X,XX,XXX` · no persona names in chrome · founder veto on every byte · delivery as `deploy/` ZIPs with named-files commit and STOP before the git line · LE never pushes · zero DDL without a chair ruling, and every migration named in `SCHEMA.md` the same ZIP.

---

## §11 · OPEN QUESTIONS FOR THE CHAIR WHO CHARTERS THIS BLOCK
1. Block number: 19 proposed (18 is TROUSSEAU). Founder's word.
2. The public storefront route (§2) — exists or not; if not, whether it is Block 19 P2's or Block 07's.
3. Whether Business Solutions is a tier feature (Signature+) or every tier — billing rail dependency (Block 09 P4 / Razorpay). Chair's read: Google page and subdomain on every tier; own domain, Marketing, Proof, Benchmarks on Signature+. **Founder's word.**
4. F-P3.11's diagnosis, prerequisite to P6.
