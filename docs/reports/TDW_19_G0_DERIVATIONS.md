# TDW_19 · G0 — DERIVATIONS

**Seat:** LE, code-capable, one sitting, zero product bytes.
**Base:** `dream-os` @ `c841082` (re-derived at origin at the moment of cutting, R-38.16 — unmoved from charter).
**Sibling tips:** `dreamos-pwa` `main` @ `49e5828` · `worklist` @ `10edd9c`. All three matched the kickoff.
**Governing document:** `docs/specs/TDW_19_V2_BUSINESS_SOLUTIONS_MASTER.md` §4 G0.
**Founder acts consumed:** the two `GET /<waba>/message_templates` lines, run 2026-09-04, both outputs pasted whole. Item (3) is derived from those bytes and from nothing else.

Every item below carries: **the question · the command · the answer · what the command cannot see** (F-39.25). Where a command's failure mode is a silent zero, a second command with a different failure mode is run beside it (the independent-method law).

---

## 0 · CORRECTIONS AGAINST THE CHARTER, OWNED AT THE HEAD

The kickoff's own guardrail sentence is standing. Three claims in it did not survive derivation. All three were relayed to the chair before the report was written and accepted as **c-40.4 (a)(b)(c)**.

| # | Charter said | Derived | Command |
|---|---|---|---|
| ① | read ladder: "`docs/TDW_00_MASTERPLAN.md` (the 19 row)" | **No 19 row exists.** The board's §3 table runs 01→18; the document is titled *Eighteen Blocks*. Block 19 is unentered. | `grep -n '^\| 19 ' docs/TDW_00_MASTERPLAN.md` → 0 hits · `grep -n 'Block 19\|TDW_19\|Business Solutions' …` → 0 hits |
| ② | "Room names are R-40.1 (band 7 §4, founder-ratified)" | `R-40.1` is **not in the tree**; band 7 §4's heading reads *PROPOSED FOR THE FOUNDER'S VETO* and its first sentence is *"nothing here is ruled until he says so"*; band 7's own range line carries R-40 `.1` as next-free. **Chair's record, supplied on relay:** the founder ruled the set in chat 2026-09-04 by his word 「yes」 — that ruling is real and chat-only until banked. | `grep -rn 'R-40\.1' docs/` → 0 hits · `FINDINGS_LOG.md:5008` |
| ③ | item (4): witness columns by ordinal at "`public.leads` at `:1619`, `public.events` at `:1526`" | Those are the **CONSTRAINTS ADDENDUM** blocks — the half the schema header states carries no columns. The column half is `:676` (leads) and `:535` (events). The charter's conclusion *"no source"* was read off a CHECK list, and **absence from a CHECK list is not absence of a column**: `leads.source` exists. | `grep -n '^## public\.\(leads\|events\)' docs/db/PUBLIC_SCHEMA.md` |

Item (1)'s use of the same anchors is **correct** — `:1526+12` really is `events_state_check`, and `:1874`/`:1877`/`:3234` for `vendor_portfolio` all land where the charter says.

Naming convention used throughout: room names are cited as **band 7 §4's set, ratified by the founder in chat 2026-09-04, R-40.1 pending the register.**

---

## 1 · THE DELIVERY PATH — how a gallery reaches a couple today

**The question.** Cloudinary, the portfolio approval gate, and what "delivered" means in `events`.

### 1.1 Cloudinary — the mirror

**Command:** `sed -n '220,278p' src/lib/vendor/igImport.js`

`ensureCloudinary()` at **`src/lib/vendor/igImport.js:225`** throws unless `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are both set. `mirrorOne(vendorId, sourceUrl)` at **`:241`** is the estate's one ingestion path for external image bytes. Its posture, from the file's own comment block at `:229–:239`:

- **Import-and-mirror, never hotlink** — Cloudinary fetches the source server-side and stores the bytes as an estate asset; the persisted URL is the estate's, so a lapsed token or an expired Meta CDN link leaves the storefront untouched.
- No browser is in the path, which is why it does not reuse the pwa's two-phase `adminUploadFile` shape.
- The upload is **signed**: `sha256` over `folder=…&public_id=…&timestamp=…` plus the secret, the same signing as `src/lib/vendor/portfolio.js`.
- Destination is **`vendor_portfolio/${vendorId}`** with `public_id` = `ig-<6 random bytes hex>`.

The folder contract is therefore **per vendor, not per wedding or per couple.**

### 1.2 The approval gate

**Commands:** `sed -n '1087,1105p'` · `sed -n '1874,1880p'` · `sed -n '3230,3242p' docs/db/PUBLIC_SCHEMA.md`

`public.vendor_portfolio` · 14 columns, block at **`:1087`**. `approval_state` is ordinal 8, **`text NOT NULL default 'pending'::text`**, at `:1094`. Its CHECK at **`:1877`**:

```
CHECK ((approval_state = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
```

The partial index at **`:3234`**:

```
CREATE INDEX idx_vendor_portfolio_approved ON public.vendor_portfolio USING btree (vendor_id) WHERE (approval_state = 'approved'::text)
```

with a sibling `vendor_portfolio_pending_idx` on `(approval_state, created_at) WHERE approval_state = 'pending'` — the admin queue's own index. The table also carries `reviewed_by_admin` (12), `reviewed_at` (13), `rejection_reason` (14), and the `is_hero` / `in_carousel` / `position` curation switches (5, 6, 15).

**Every image on this plane passes a human admin gate before any couple sees it.**

### 1.3 What "delivered" means in `events` — the gap, stated, nothing proposed

**Commands:** `sed -n '535,556p' docs/db/PUBLIC_SCHEMA.md` · `sed -n '1538p' …` · `grep -n 'delivered_at' docs/db/PUBLIC_SCHEMA.md`

`public.events` · **18 columns**, block at `:535` (ordinal 13 absent — the header's own ordinal-gap note names `events` as skipping 13 of 19; a gap is a dropped column's fingerprint, not an error). The state CHECK at **`:1538`**:

```
CHECK ((state = ANY (ARRAY['upcoming'::text, 'done'::text, 'cancelled'::text])))
```

**There is no `delivered` state.** `grep -n 'delivered_at'` over the whole 3,293-line snapshot returns **zero hits** — not on `events`, not on any of the 71 tables. The witnessed block confirms the charter's statement exactly. **No cure is proposed here; the arms are enumerated as FORK A in §8.**

### 1.4 The finding this item actually produced

The charter asks how a gallery reaches a couple. Derived by tracing every reader rather than by assuming one:

**Command:** `grep -rn "from('vendor_portfolio')" src/` — twenty hits across six files. **Second command, different failure mode:** `grep -rn 'gallery' src/ --include='*.js'` — two hits, one a regex noun-list in `closerEngine.js:952`, one an editorial mood board in `exploring-photos.js:6`.

The readers, classified:

| Reader | Audience | Class |
|---|---|---|
| `src/api/admin/photos.js` · `src/api/admin/vendorPortfolio.js` | admin | the approval gate |
| `src/api/public/vendorCard.js:338` | anyone with the `/v/` link | marketing |
| `src/api/couple/discover.js:109`, `:511` · `src/api/couple/taste.js:104` | a browsing couple | marketing |
| `src/lib/vendor/portfolio.js` | the vendor | authoring |

**A gallery does not reach a couple today, because no delivery path exists.** What exists is a *portfolio* path: a per-vendor, admin-approved, marketing-facing image set with no association to an event, a couple, or a wedding. Nothing in the tree links `vendor_portfolio` rows to `events.id` or `couples.id`. G1.1's premise — *"when an event is marked delivered, the photographer uploads the gallery (or designates the portfolio set)"* — rests on two things that do not exist: the delivered mark (§1.3) and the association.

**What the commands cannot see.** Whether Cloudinary's account holds assets outside `vendor_portfolio/` folders (a console fact); whether any vendor has ever shared a gallery outside the product, by WhatsApp or a third-party link, which is almost certainly how delivery happens today and is invisible to the repo; and the current Cloudinary plan's storage and transformation ceilings, which master §8.3 asks about and no command in this repo can answer.

---

## 2 · THE RENDER ARM

### 2.1 `mock_shot.cjs` read whole

**Command:** `cat -n /tmp/pwaprobe/tools/mock_shot.cjs` — 170 lines, read end to end, including the 68-line comment block the PATH-OVER-RANGE and READ-PAST-THE-CITE laws exist to make me finish.

**Its Chromium.** `puppeteer-core` + `require('@sparticuz/chromium').default`, launched `headless: 'shell'` with `chromium.args` plus `--no-sandbox --disable-dev-shm-usage`, `executablePath: await chromium.executablePath()`. Versions from `dreamos-pwa/package.json`: **`@sparticuz/chromium` 149.0.0**, **`puppeteer-core` 25.9.0**. The file states the reason at `:23–:27`: *Playwright's CDN and Google's storage host are both denied at this estate's egress and no system chromium exists in the build container*; `@sparticuz/chromium` ships the binary inside its npm tarball and npm is allow-listed. The pair was already present for `wl_render.cjs`; this file reuses it rather than adding a third way to get a browser.

**Its input contract.**

- `argv[2]` is a single `-mock.html` file **or a directory**, default `docs/mocks`. A directory is filtered to `*-mock.html` (`mocksIn`, `:78`).
- Frames are **read out of the file**, never passed in: every `data-frame="<id>"` occurrence, in document order (`framesOf`, `:86`). The comment at `:83` gives the reason — a frame list beside the mock is a second home for the mock's own structure.
- **PRIMARY** = the first frame of each id **shape-prefix** (`id.split('-')[0]`), so `A1-…`, `A2-…`, `B1-…` (`primaryOf`, `:116`).
- Geometry is an **opt-in read off the same element**, via a 400-character window after the id rather than a DOM parse (`shotOf`, `:97`): `data-shot-width`, `data-shot-height`, `data-shot-modes`. Any may be absent, in any order. The file states it will not validate a mode vocabulary it does not own (`:55–:57`).
- Fonts must be **embedded as data URIs in the mock itself** (`:29–:34`) — the container reaches no font host, so a linked face silently composites DejaVu.

**Its output sizes.**

- Default, per frame: widths `[374]`, or `[374, 390]` if PRIMARY; height `844`; modes `['dark','light']`; **`deviceScaleFactor: 2`**.
- A declared `data-shot-width` **overrides the primary rule as well as the width** (`:145–:147`) — a sheet of paper has no second width. The A4 opt-in in use is `794 × 1123`, `modes="paper"`.
- Filename `stem__id__mode__w.png`, written **into the source file's own directory** (`:159`). The shape is frozen and asserted by `scripts/tdw_f3957_shot_arm.proof.mjs` over 78 shas.
- Navigation is `file://` + `#solo=<id>&mode=<mode>`, and it waits on `document.fonts.ready` explicitly rather than sleeping (`:155–:158`).

### 2.2 Fitness for post cards, story cards, tent cards

**Fit, for mock-first drawing.** Arbitrary geometry is already proven in production use by the A4 opt-in: a 1080×1080 post card or a 1080×1920 story card is `data-shot-width`/`data-shot-height` and nothing else. `deviceScaleFactor: 2` gives 2160×2160 / 2160×3840 actual pixels. This satisfies c-39.26's mock-first law for every Block 19 surface that needs a picture before a byte ships.

**Not fit, as a runtime renderer, on four derived counts:**

1. **No output path.** The PNG is written beside its source (`:159`). There is no argument for a destination, and a per-request render cannot write into `docs/mocks/`.
2. **No per-request input.** The input is a file on disk whose fonts are already inlined. A vendor's post card is data-driven; nothing here templates.
3. **No server.** It is a `#!/usr/bin/env node` CLI that launches a browser, loops, and exits.
4. **Wrong repo, wrong runtime.** It lives in `dreamos-pwa/tools/` (Vercel). `dream-os` (Railway) carries **no** `puppeteer-core`, no `@sparticuz/chromium`, no `playwright` — confirmed by `grep -n 'puppeteer\|sparticuz\|playwright' package.json` → zero hits. **The backend that would serve a render request has no browser.**

**The tent card is a different arm and it already exists.** `dream-os/package.json` carries **`pdfkit` ^0.18.0** and **`qrcode` ^1.5.4** as dependencies. G1.3's *"tent card and thank-you insert carrying the credit-roll QR, rendered … to PDF for her printer"* is reachable server-side today without Chromium. That is a fact about the tree, not a recommendation.

### 2.3 Reels — is ffmpeg in the dream-os image?

The charter is explicit that grep alone does not settle this and that I must open whatever builds the image. **I did, and what I found is that nothing in the repo builds it.**

**Command:** `for f in Dockerfile Dockerfile.* nixpacks.toml railway.json railway.toml Procfile .nixpacks; do [ -e "$f" ] && echo PRESENT || echo absent; done` — plus a full `ls -a` of the repo root.

**Every one absent.** The repo root holds `.gitignore`, two handover markdowns, `README.md`, `db/`, `docs/`, nine stray `e7_card*` fixtures, `githooks/`, `package-lock.json`, `package.json`, `scripts/`, `src/`, `tools/`. **There is no image-build artifact of any kind in `dream-os`.**

`package.json` was opened whole: `"name": "dream-os-backend"`, `engines.node >= 22.0.0`, `start: node src/index.js`, thirteen runtime dependencies. **No ffmpeg, no fluent-ffmpeg, no ffmpeg-static.**

**Command, second failure mode:** `grep -rn 'ffmpeg' .` over the whole tree excluding `.git` — **exactly one hit**, and it is the master's own question at `docs/specs/TDW_19_V2_BUSINESS_SOLUTIONS_MASTER.md:73`.

**The answer, stated as what it is:** the question cannot be answered from this repo, and no amount of reading will make it answerable. The image is built by **Railway's Nixpacks auto-detection off `package.json` alone**. Whether the Nixpacks Node-22 base image happens to carry an `ffmpeg` binary is a **runtime fact about a provider's image**, not a repo fact — and it is a fact that can change under the estate without a commit, which is precisely the class R-38.22 was minted for. It needs one founder-run command on the Railway service; that command is in the handover, §H2.

**What the commands cannot see.** Whether a Railway service-level Nixpacks override (`NIXPACKS_PKGS`) or a build command is configured **in the Railway dashboard** rather than in the repo — dashboard state is invisible to every command available to this seat, and if such an override exists it is a second, unversioned home for the image's contents.

---

## 3 · THE TEMPLATE INVENTORY — both WABAs, from the founder's paste

**Founder command (run 2026-09-04):**

```
curl -s "https://graph.facebook.com/v25.0/<waba>/message_templates?fields=name,category,status,language&limit=200" -H "Authorization: Bearer $META_TOKEN"
```

Token supplied by hidden `read`, referenced never printed (§9 secrets law). Both responses returned `data` arrays with a `paging.cursors` object and **no `paging.next`** — the lists below are complete, not first pages.

### 3.1 WABA-DIRECT `1739793260373677` — the sending WABA of record · **26 templates, all APPROVED, all `en`**

| # | Name | Category |
|---|---|---|
| 1 | `booking_confirmed_v1` | UTILITY |
| 2 | `tdw_referral_invite` | MARKETING |
| 3 | `tdw_review_request` | MARKETING |
| 4 | `tdw_lead_alert_basic` | MARKETING |
| 5 | `tdw_circle_place_ready` | UTILITY |
| 6 | `tdw_admin_signup_alert_v2` | UTILITY |
| 7 | `tdw_bride_welcome_v2` | MARKETING |
| 8 | `tdw_admin_signup_alert` | MARKETING |
| 9 | `tdw_bride_welcome` | MARKETING |
| 10 | `tdw_enquiry_reply_couple` | UTILITY |
| 11 | `tdw_enquiry_update_couple` | UTILITY |
| 12 | `tdw_vendor_welcome` | UTILITY |
| 13 | `tdw_enquiry_brief_vendor` | UTILITY |
| 14 | `tdw_enquiry_alert_vendor` | UTILITY |
| 15 | `tdw_demo_lead_alert` | UTILITY |
| 16 | `tdw_demo_invite` | UTILITY |
| 17 | `tdw_payment_due` | UTILITY |
| 18 | `tdw_crew_assignment` | UTILITY |
| 19 | `tdw_morning_nudge_bride` | UTILITY |
| 20 | `tdw_morning_nudge_vendor` | UTILITY |
| 21 | `tdw_marketing_opener` | MARKETING |
| 22 | `tdw_circle_join_otp` | AUTHENTICATION |
| 23 | `tdw_couple_reset_otp` | AUTHENTICATION |
| 24 | `tdw_couple_login_otp` | AUTHENTICATION |
| 25 | `tdw_vendor_reset_otp` | AUTHENTICATION |
| 26 | `tdw_vendor_login_otp` | AUTHENTICATION |

Split: **14 UTILITY · 7 MARKETING · 5 AUTHENTICATION.** `tdw_*`-prefixed: **25** (only `booking_confirmed_v1` is not).

### 3.2 WABA `1299109268220358` — **15 templates, all APPROVED, all `en`**

| # | Name | Category | Also on Direct? |
|---|---|---|---|
| 1 | `booking_confirmed_v1` | UTILITY | yes (different id) |
| 2 | `tdw_vendor_reset_otp` | AUTHENTICATION | yes |
| 3 | `tdw_vendor_login_otp` | AUTHENTICATION | yes |
| 4 | `tdw_circle_join_otp` | AUTHENTICATION | yes |
| 5 | `tdw_couple_reset_otp` | AUTHENTICATION | yes |
| 6 | `tdw_couple_login_otp` | AUTHENTICATION | yes |
| 7 | `tdw_marketing_opener` | MARKETING | yes |
| 8 | `tdw_demo_invite` | UTILITY | yes |
| 9 | `tdw_crew_assignment` | UTILITY | yes |
| 10 | `tdw_payment_due` | UTILITY | yes |
| 11 | `tdw_morning_nudge_bride` | UTILITY | yes |
| 12 | `tdw_morning_nudge_vendor` | UTILITY | yes |
| 13 | `tdw_payment_reminder_hx7acf148bbdcf47af7057543ab1529d65` | UTILITY | **no** |
| 14 | `tdw_reactivation_hx336a98a494d7b5773bcaaf4e962a46ec` | MARKETING | **no** |
| 15 | `tdw_morning_brief_hx3ead564d5a9fca9b2de238dd1ff05b26` | MARKETING | **no** |

### 3.3 F-K4.1's open half is now DERIVED: **duplicate, not split**

Band 5 §3's K-band left it as *"DUPLICATE-OR-SPLIT NOT DERIVED, and a send against a template the account does not hold fails. One screen settles it; live-lane risk."* Two screens settled it.

**Twelve of the fifteen names on `1299109268220358` also exist on Direct**, each with a different template id — duplicates, not a split inventory. The **three unique to the old WABA are the `_hx` Twilio legacies**, whose `hx…` suffixes are Twilio content SIDs and which the masterplan's CE-38/39 row already names for retirement in M2b-expanded ("`_hx` legacies [veto]"). **Nothing the estate sends today lives only on the old WABA**, so the live-lane risk F-K4.1 named is real in shape and empty in fact.

**A corroborating detail, unlooked-for.** Band 5 §6 records a template created on camera during the App Review shoot — `booking_confirmed_v1`, id `2171941953351762` on Direct, with an *"orphan `3679728615512526` on `1299109268220358` from the discarded take."* Both ids appear in the pastes, on exactly those two WABAs. The register's account of that evening is corroborated at the API.

### 3.4 On band 6's "19/19" — re-derived, not carried, and it does not reproduce

The charter is explicit: *"Band 6 says F-K4.1 closed with 19/19 on Direct; re-derive, do not carry."* Re-derived, the endpoint returns **26**.

I do not treat this as a contradiction to be resolved in the register's favour or mine. Band 6 §1 phrases it as *"template parity 19/19 on WABA `1739793260373677` Direct"* — **parity** is a comparison between two sets, not a census of one. The likely second set is the estate's own template registry in code, and 19 present-and-Active out of 19 registered is fully consistent with a WABA holding 26. Band 5 §3, measuring the WABA itself rather than parity, recorded *"`1739793260373677` returns 25 `tdw_*` by API"* — and **25 is exactly the `tdw_*` count I derive.** Two bands, two different measurements, both reproduced.

**What this report carries forward is the census: 26 templates on Direct, 25 of them `tdw_*`.** The parity figure belongs to whatever registry it was measured against; deriving that registry's contents was not this sitting's task and is not asserted here.

### 3.5 The four templates the block needs, by name, on the sending WABA

Master §6's gate row: *"Utility templates on the sending WABA (review ask · collector · reminder · missed-call)."*

| The block needs | On Direct? | Name · id | Category | Verdict |
|---|---|---|---|---|
| **Review ask** (G2, master §4 G2) | **yes** | `tdw_review_request` · `1713996623186968` | **MARKETING** | Present, **but not Utility** |
| **Collector** (G3.4, the polite collector) | **yes** | `tdw_payment_due` · `1933718834006817` | UTILITY | Present; the only candidate |
| **Milestone reminder** (G3.4) | **no separate template** | — | — | `tdw_payment_due` is the sole candidate; whether collector and reminder are one template or two is a charter question |
| **Missed-call** (K-1 F3, the 「you called」 bridge) | **no** | — | — | **ABSENT on both WABAs.** Must be authored, vetoed and filed |

Two consequences, both already anticipated in the register rather than new:

- **The review ask is MARKETING, and the gate row's word "Utility" is not met for it.** This is not a surprise: `TDW_19_P0A_LEDGER.md` B1 records the category as submitted UTILITY, *"reclassified to MARKETING by Meta's classifier at the create screen, accepted by the founder (F-19.07)"*, approved 2026-08-28. The ledger's Amendment 2 governs the consequences, and its P1 inheritance table makes **opt-out gating a CONDITION**, with cost and throttling demoted to OPEN QUESTIONS. Part C's rule stands: *"P1 charters against this ledger, not against the kickoff."* Master §6's gate row should be read as amended by the ledger, and I flag the wording mismatch rather than reconcile it — that is a chair act.
- **`tdw_referral_invite` · `1557978505339198` · MARKETING** is also present on Direct, which is G4.3's referral broadcast and the ledger's B2, carrying the `Stop messages` custom quick reply whose handler F-19.08 still owes.

**What the command cannot see, and it matters.** I requested `fields=name,category,status,language`. The response therefore carries **no `components`** — no bodies, no button definitions, no variable counts. I have derived that `tdw_payment_due` **exists and is Utility**; I have **not** derived what it says, how many variables it takes, or whether its body fits G3.4's collector at all. Also invisible: per-template quality ratings, the India rate card the ledger's Amendment 2 still wants a number for, and whether the vendor lane's `VENDOR_PHONE_NUMBER_ID` `1197664646766743` is attached to Direct (F-19.03 struck that derive from Part B as WABA-scoped, and it remains true that this endpoint cannot show it).

A `fields=components` GET is owed before any phase authors a constant — **and even then the ledger, not a live GET, is the authoring source** for `tdw_review_request` and `tdw_referral_invite`, whose approved bodies are recorded verbatim at `TDW_19_P0A_LEDGER.md` B1/B2 with the byte note that Meta locked `Write a Review` with a capital R.

---

## 4 · THE TWO DB HOOKS

### 4.1 `leads.source` — **EXISTS**

**Command (numbered read, not arithmetic over a window):**

```
awk 'NR>=676 && NR<=712 && /^11\. source/ {print NR": "$0}' docs/db/PUBLIC_SCHEMA.md
```

```
689: 11. source text default 'whatsapp'::text
```

`public.leads` · **27 columns**, block at `:676`; `source` is **ordinal 11**, `text`, nullable, default `'whatsapp'::text`, witnessed at **`docs/db/PUBLIC_SCHEMA.md:689`**. (The block's ordinals run 1–28 with 19 absent, which the schema header's own ordinal-gap paragraph names for `leads`: *skips ordinal 19 of 28*.)

**It carries no CHECK.** `leads`' entire constraint block at `:1619` holds exactly one CHECK — `leads_wedding_date_precision_check` at `:1622` — plus the primary key. So `source` is a free-text column with a default and **no enumeration guard**. G1.2's `source='wedding_guest'` needs **no DDL**; it also gets **no protection**. That is FORK C.

### 4.2 `events.delivered_at` — **ABSENT**

**Command, whose failure mode is a silent zero:** `grep -n 'delivered_at' docs/db/PUBLIC_SCHEMA.md` → **0 hits** across 3,293 lines and 71 tables.
**Second command, different failure mode — a positive enumeration:** `sed -n '535,556p'` prints all 18 columns of `public.events`; none is named `delivered_at`. The two agree.

### 4.3 Staleness, settled the way the Victor seat did it

The schema header states the test itself: *"If `db/migrations/` holds any file newer than the ladder tip named above, this document is STALE for any table those migrations touch."* It then names the blind spot — 16 reserved-but-empty numbers **below** the tip — and the standing cure, `db/migrations/OUT_OF_ORDER.json`.

**Both halves run.**

- **Ladder tip at snapshot:** `0129` (header). **Snapshot:** 2026-08-28, 71 tables / 807 columns, guard passed (`tables_expected` 71 = 71 rows returned).
- **Arithmetic half:** `ls db/migrations/ | sort | tail` → the only file above `0129` is **`0130_vendor_payment_rails.sql`**. One migration ahead.
- **Out-of-order half:** `cat db/migrations/OUT_OF_ORDER.json` → the register holds **one** record, `0090_engagements.sql`, stale-for `engagements`, state OUTSTANDING.

`0130` is the four vendor payment-rail columns from band 6's S2 (`me.js`'s door, F-39.63/R-39.20) — **vendors-only**, as the charter states. Neither `0130` nor `0090` touches `leads` or `events`.

**Therefore the snapshot governs both tables and both readings above are witnessed, not inferred.**

**What the commands cannot see.** Whether `0130` was actually **applied in production** — the ladder holds the file; only the database knows if it ran. Nothing in this item depends on it. And a column added by a migration that neither entered the ladder above `0129` nor filed an `OUT_OF_ORDER.json` record would be invisible to both halves of this test; the register's cure is a convention, and a convention has no enforcement in the tree.

---

## 5 · THE INSTAGRAM PLUMBING, AND WHAT §5 EXTENDS

**Command:** `ls -la` the five named files, then `grep -n '^async function \|^function \|^router\.\|module.exports'` over each.

| File | Bytes | Role |
|---|---|---|
| `src/api/vendor/ig.js` | 21,882 | the router — nine routes |
| `src/lib/vendor/igOAuth.js` | 19,902 | the OAuth flow + token lifecycle |
| `src/lib/vendor/igImport.js` | 18,499 | media read + the Cloudinary mirror |
| `src/lib/vendor/igConnection.js` | 7,471 | the token store |
| `src/lib/vendor/igSignedRequest.js` | 3,608 | Meta's signed-request parser |

### 5.1 The OAuth flow

`igOAuth.js`: `mintState` `:197` / `verifyState` `:209` (HMAC-signed state on `stateSecret()` `:169`, base64url helpers `:179`/`:184`, `sign` `:189`) · `authorizeUrl` `:237` · `exchangeCode` `:264` · `exchangeForLongLived` `:292` · `refreshLongLived` `:313` · `fetchProfile` `:346` · `refreshDecision` `:368` (pure, given `expiresAt`/`connectedAt`/`now`) · `metaRefusal` `:250`.

Two constants that govern everything §5 wants to add:

- **`GRAPH_HOST = 'https://graph.instagram.com'`** at **`:124`** — this is the **Instagram Login** flow, not Facebook Login for Business on `graph.facebook.com`.
- **`IG_SCOPE = 'instagram_business_basic'`** at **`:132`** — **one scope**, and the comment at `:127–:131` states why: *"Requesting a permission the App Review screencast does not visibly exercise is a documented rejection axis, and every extra scope is another…"*

`IG_CALLBACK_PATH = '/api/v2/vendor/ig/callback'` at `:115`; `redirectMatchesCanonicalPath` at `igImport.js:189` compares on the **parsed pathname**, not `endsWith` on a raw string, and refuses loudly on mismatch (the dead-control law applied to configuration, F-07.13's family).

### 5.2 The token store and the media read

`igConnection.js`: `getConnection` `:33` · `readToken` `:45` · `armState` `:65` / `spendState` `:81` (single-use nonce) · `saveToken` `:99` · `updateToken` `:116` · `disconnect` `:136` · `findByIgUserId` `:151`.

`igImport.js`: `listInstagramMedia` **`:116`** — refuses with `ok:false` on a network failure so that *"only a genuinely empty account returns an empty list, and the caller can tell the two apart"* (`:110–:115`, F-04.113's class) · `isConfigured` `:201` · `ensureCloudinary` `:225` · `mirrorOne` `:241` · `isEstateUrl` `:279` · `importSelected` `:288`, which composes `canAcceptMore` / `registerImage` / `MAX_PORTFOLIO_IMAGES` from `./portfolio` — the cap and the write door are the portfolio room's, not this file's.

`igSignedRequest.js`: `parseSignedRequest` `:37` on `IG_APP_SECRET`.

**The router**, `src/api/vendor/ig.js`: `/status` `:58` · `/authorize` `:91` · `/callback` `:108` · `/media` `:196` · `/import` `:213` · `DELETE /disconnect` `:237` · `POST /deauthorize` `:268` · `POST /data-deletion` `:321` · `/deletion-status` `:364`. All vendor routes behind `requireAuth` + `resolveVendor()`; the three Meta-facing callbacks deliberately outside them. `tokenForCall` `:174` is the refresh-on-read seam.

### 5.3 Master §5's rows I1–I8, mapped

| Row | Feature | Permission | Verdict | Evidence |
|---|---|---|---|---|
| **I1** | Portfolio import | `instagram_business_basic` | **EXISTS** | The whole flow above, including deauthorize + data-deletion + deletion-status. Only Video C and the filing are owed (ledger: NOT FILED) |
| **I2** | The DM bridge | `instagram_business_manage_messages` | **NEW** | Zero messaging code. No IG webhook subscription anywhere; the estate's Meta webhook plumbing is WhatsApp-lane only |
| **I3** | Sunday brief · reach cards | `instagram_manage_insights` | **EXTENDS** | A new read on the existing token, in `listInstagramMedia`'s shape; `IG_SCOPE:132` widens |
| **I4** | Publishing from TDW | `instagram_business_content_publish` | **NEW** | Nothing in the tree writes to Instagram. `igImport` is read-and-mirror in one direction only |
| **I5** | Comments as first reply | `instagram_business_manage_comments` | **NEW** | No comment read or write |
| **I6** | Mentions become credits | mentions webhook | **NEW** | No webhook receiver for the IG product |
| **I7** | Peer posting benchmarks | Business Discovery | **EXTENDS** | A read using the existing token against a public account |
| **I8** | Engagement | `instagram_manage_engagement` | **NEW** | No like/hide/delete paths |

**Two structural facts the mapping turns up.**

1. **The scope has exactly one home** — `IG_SCOPE` at `igOAuth.js:132`, consumed once at `authorizeUrl:241` and re-exported at `:386`. Every added permission is an edit at one line. That is the good news, and it is the estate's one-home law already paid for.
2. **The host may not carry the rows.** `GRAPH_HOST` is `graph.instagram.com`. Whether the Instagram-Login flow can be granted `instagram_business_manage_messages`, `instagram_business_content_publish` and `instagram_business_manage_comments` at all — or whether those require the Facebook-Login-for-Business flow against `graph.facebook.com` with a Page link — **is not derivable from this tree**. If it is the latter, I2/I4/I5 are not scope-widenings on the existing flow but a **second OAuth flow beside it**, and the "EXTENDS" verdicts above would be wrong for I3 and I7 too. This is FORK E; it is a Meta-documentation question, and it is the single largest unknown in §5's plan.

**What the commands cannot see.** Which permissions App-LIVE `1425513376067685` currently holds in Advanced Access (a console fact); whether `IG_APP_SECRET` and the OAuth client are set on Railway; and whether any vendor has actually completed the flow in production.

---

## 6 · BLOCK 05 SEALED WHOLE? · GBP ELIGIBILITY

**Command:** `grep -n 'BLOCK 05' docs/FINDINGS_LOG.md` — three hits, read at each site.

- `FINDINGS_LOG.md:2371` — CE-26, sitting 1 sealed.
- **`FINDINGS_LOG.md:2828`** — CE-65, tenth chair, 2026-07-23: *"THE SITTING SEALS. The couple soul was the block's chartered CLOSING sitting: **BLOCK 05 IS WHOLE**."*
- **`FINDINGS_LOG.md:2892`** — CE-69, eleventh chair, 2026-07-24, header **"BLOCK 05 CLOSES"**, body: *"**BLOCK 05 IS CLOSED.** Its own shelf is EMPTY — every open item re-homed by name to the POST-BLOCK LEDGER."*

**Answer: YES, by the log's own band headers, derived by command and not from memory. F8's gate — master §6's "Block 05 sealed whole" row, and Addendum K-1 §3's "Remaining gate for Embedded Signup: Block 05 sealed whole (chair derives)" — is MET.**

**GBP eligibility — restated from the road, nothing derived.** `2026-10-27`. Master §6's gates table row *"GBP API eligibility (60-day profile age) | G2 | 2026-10-27"*; `TDW_19_P0A_LEDGER.md` A1 prerequisite 1 (*"created and verified 2026-08-28. Age requirement NOT met; earliest eligible ≈ 2026-10-27"*), A3 (*"NOT SUBMITTED — blocked on the 60-day profile age"*), and Amendment 3's founder ruling (*"wait. Submit after the profile clears 60 days"*).

**What the command cannot see.** "Sealed whole" is a statement about the block, not about its residuals: CE-69 re-homed twelve named items to a post-block ledger, and whether any were discharged is not something a band header can answer. F8's gate is about the seal, and the seal is derived. Also invisible: the two remaining F8 item-ZERO obligations — the Tech Provider Terms read in full (F-K3.13, **NOT DERIVED** per band 5) and the customer-terms flow-down amendment (F-K3.12) — neither of which Block 05's seal touches.

---

## 7 · THE COUPLE-SIDE CONSENT SURFACE

**The question, from master §8.9:** where would a couple's "publish our wedding" switch live on the Frost/Bride lane, and does a per-couple switch table exist? **Facts, not a design.**

### 7.1 The settings home — it exists, and it is one place

**Commands:** `find app -type d -name settings` · `find 'app/(frost)' -name page.tsx` · `grep -n "Settings" 'app/(frost)/frost/canvas/sanctuary/page.tsx'`

`find app -type d -name 'settings'` returns three, and **none of them is the couple's**: `app/coplanner/settings`, `app/demo/vendor/[handle]/settings`, `app/vendor/(shell)/settings`. The couple's settings is **not a route**. It is a room inside the sanctuary:

- **`components/frost/blooms/settings.tsx`** — `export function SettingsRoom({ dark, accent, signal })` at **`:25`**; 263 lines. The file's own header at `:21`: *"Profile info + mode toggle + WA DreamAI shortcut. Sanctuary bg."*
- Mounted at **`app/(frost)/frost/canvas/sanctuary/page.tsx:1145`**, `<SettingsRoom dark={dark} accent={accent} signal={signal}/>`, gated on `activeRoom==='settings'` at `:1144`.
- Registered as a `RoomKey` at **`:78`** and in the room list at **`:172`** (`{key:'settings', label:'Settings', candle:false, premium:false}`), with the room tagline **`settings:'Your wedding, your way'`** at **`:944`**.

**Its write door**, named in the component's own comment at `:44`: **`PATCH /api/v2/couple/me/:id`** — and the comment records that the door *"was already built and never opened"*, with `:49` explaining that budget is deliberately read-only through it.

**What it holds today:** `Row label="Wedding date"` at `:157` and `Row label="Total budget"` at `:165`, both opening editors. And at **`:167`**, in the file, this: *"Mode toggle — REMOVED BY FOUNDER RULING (2026-08-07…)"*.

**The couple's settings room therefore holds zero boolean switches. The only one it ever had was removed on a founder ruling.** A "publish our wedding" switch would be the first switch the couple lane has ever owned.

### 7.2 The per-couple switch table — **none exists**

**Command, silent-zero failure mode:** `grep -n 'consent' docs/db/PUBLIC_SCHEMA.md` → **0 hits** on the whole plane.
**Second command, positive enumeration:** `grep -n '^## public\.' docs/db/PUBLIC_SCHEMA.md | grep -i 'couple\|consent\|pref\|setting'` → eight tables, every one read:

| Table | Line | Cols | Carries a switch? |
|---|---|---|---|
| `couple_ai_usage` | `:271` | 14 | metering |
| `couple_bookings` | `:290` | 14 | — |
| `couple_enquiries` | `:309` | 9 | — |
| `couple_receipts` | `:323` | 12 | — |
| `couple_state` | `:340` | 5 | `couple_id`, `summary`, `vendor_shortlist`, `taste_notes`, `updated_at` — no boolean |
| `couple_tasks` | `:350` | 9 | — |
| **`couples`** | **`:364`** | **23** | one boolean: `taste_quiz_done` (ordinal 16) |
| `pending_couple_drafts` | `:829` | 11 | the relay's draft store |

`public.couples`' 23 columns were read whole at `:364`. **No consent column, no publication column, no visibility column, no preferences jsonb.** The one boolean on the couple's own row is `taste_quiz_done`.

**The answer to master §8.9, as facts:** the couple lane has exactly one settings home (`SettingsRoom`, mounted at `sanctuary/page.tsx:1145`) with one write door (`PATCH /api/v2/couple/me/:id`), currently holding two editable fields and zero switches; and there is **no per-couple switch table and no consent column anywhere on the public plane**. A "publish our wedding" switch has neither a home in the schema nor a precedent in the UI. Where it goes and what it defaults to are the founder's, per master §8.9 and law §2.4 (*"Consent is a switch the vendor or couple owns, one home each, read everywhere; silence never means yes"*).

**What the commands cannot see.** Whether `PATCH /api/v2/couple/me/:id` has an `ALLOWED_FIELDS` allowlist that a new column would have to join — `grep 'ALLOWED_FIELDS' src/api/couple/me.js` returned nothing, which means either the door does not use that pattern or it names it otherwise; deriving the door's actual write contract is a read of `me.js` whole, which G1's charter should require before any consent column is proposed. Also invisible: `couple_state`'s `updated_at`-only shape gives no hint whether it is intended as the couple's kv store or as the agent's scratchpad.

---

## 8 · FORKS SURFACED FOR G1's CHARTER — enumerated with evidence, not ruled

The three the charter names, plus two the derivations produced. **Nothing here is picked.** The master's §7 refusals are not re-proposed in any arm.

### FORK A · Where "delivered" lives

- **(a) A fourth `events.state` value.** Cheapest to read; every existing consumer of `state` already switches on it. **The cost, derived:** `events_state_check` at `:1538` is a CHECK on the sole calendar plane, and `eventWrite.js` is its sole writer by B2's ratified census. A state widening reaches the occupancy checker's four verdicts, `describeDate`, the day sheet, and every bench keyed to the three-value list. It also conflates *the shoot happened* (`done`) with *the files reached the couple* — two events that can be months apart.
- **(b) An `events.delivered_at timestamptz` column.** Additive, no CHECK to widen, no existing reader disturbed; `done` keeps its meaning and delivery gets its own timestamp. Requires a migration on the calendar's own table, which is the plane B2 spent a sitting making single-writer.
- **(c) `weddings.delivered_at`, on G1.1's own new row.** The master's own G1.1 DDL already proposes `weddings (…, delivered_at, gallery_ref, …)`. Touches no existing table; costs a join for any calendar-side question, and creates a second place where a date about an event lives.

**Evidence bearing on the choice:** `delivered_at` has zero hits plane-wide (§4.2), so no half-built home exists to inherit; and §1.4 found that no delivery path exists at all, so whichever arm is picked is being built from nothing rather than fitted to an existing flow.

### FORK B · Where the gallery ref points

- **(a) A Cloudinary folder or tag set.** `mirrorOne` already writes to `vendor_portfolio/${vendorId}` (`igImport.js:241`); a per-wedding folder is a small change at one line. **The cost:** it breaks the existing folder contract that every mirrored asset shares, and Cloudinary becomes the association's home — an external service holding a structural fact about the estate's data.
- **(b) `vendor_portfolio` rows selected into a set.** Reuses the approval gate, the curation switches and the CDN posture already built. **The cost, derived at §1.2:** every row on that table passes a **human admin approval gate**, and a delivered client gallery is not marketing material. Routing a couple's own wedding photographs through TDW's admin queue is a product decision, not a plumbing one — and at 400–800 images per wedding, `MAX_PORTFOLIO_IMAGES` (`portfolio.js`) is a ceiling built for a portfolio, not a gallery.
- **(c) A new asset plane** with its own table and its own gate (or no gate). Costs a second ingestion path beside `mirrorOne`; the master's own §7 refusal *"no third stripper, no second writer home"* is the law that arm has to answer to.

### FORK C · `leads.source` — column or CHECK'd enum

Derived state: **a column, `text`, default `'whatsapp'`, no CHECK** (§4.1).

- **(a) Leave it free text.** G1.2's `source='wedding_guest'` needs no DDL and ships immediately. `leads.state` — the column the whole lead lifecycle turns on — also carries no CHECK, so this is the table's own precedent.
- **(b) Add a CHECK.** Makes the vocabulary legible and stops a typo becoming a silent third source. **The cost:** a CHECK on an existing column fails on any row already holding a value outside the list, so a founder-run census of the live distinct values is owed **before** the migration is authored, not after — and this seat has no database reach, so that SELECT is a founder act whose result the DDL is authored from (SQL-provenance law, the derivation shown never claimed).

### FORK D · Where the render service lives *(not in the charter's list — disclosed as this seat's addition)*

§2 produced three outputs needing three different arms in two different runtimes: **PDF** (`pdfkit` + `qrcode`, already in `dream-os`) · **PNG cards** (Chromium, only in `dreamos-pwa/tools/`, and a desk instrument with no output path or server) · **reels** (ffmpeg, declared nowhere and undeclarable in a repo that builds no image). G1.3 and G4.2 both need at least two of the three. **A charter that assumes "the render arm" is one thing will discover it is three.**

### FORK E · The Instagram OAuth host *(not in the charter's list — disclosed as this seat's addition)*

§5.3's mapping assumes the existing `graph.instagram.com` Instagram-Login flow can be widened to messaging, publishing and comments by editing `IG_SCOPE:132`. **If those permissions require Facebook-Login-for-Business against `graph.facebook.com` with a linked Page, then I2/I4/I5 are a second OAuth flow, and the EXTENDS verdicts for I3 and I7 need re-deriving too.** This is a Meta-documentation question, answerable in one reading, and it should be answered before §5's filing order is committed to.

---

## 9 · THE FOUNDER'S NINE QUESTIONS (master §8), WITH THE FACTS NOW UNDER THEM

**Q1 (room names) is STRUCK** — answered by band 7 §4's set, ratified by the founder in chat 2026-09-04; R-40.1 pending the register.

**Q2 · Credit-roll roles.** No fact derived. The fixed list is unconstrained by anything in the tree — no table, no CHECK, no existing vocabulary to collide with. Purely the founder's.

**Q3 · Gallery hosting.** Cloudinary is the estate's only image host and its posture is import-and-mirror with signed uploads into `vendor_portfolio/${vendorId}` (`igImport.js:225`/`:241`). **The plan's ceilings are a console fact no repo command can reach**, and at wedding-gallery volumes (hundreds of full-resolution images per event, against a portfolio ceiling built for twenty) this is the question most likely to change G1's shape. Pairs with FORK B.

**Q4 · Contract template.** No fact derived — `public.contracts` exists (15 columns, `:234`) with vendor/lead/invoice/client indexes at `:2586–:2598`, so the table is real and G3.2's additive columns land on something. The one-generic-vs-per-category call and the lawyer pass are the founder's.

**Q5 · Retainer default.** No fact derived this sitting.

**Q6 · Account kinds** (stylist, influencer, venue coordinator). No fact derived. Note only that K-1 §5 already homes the Collab extension to the Collab room's own arc, post-cutover.

**Q7 · Panchang source.** No fact derived; `hot_dates` exists per master §9's "already specced" list and its admin override stays.

**Q8 · Which of G1–G5 the first beta vendors see.** Two facts now bear on it: **G2's review ask is filed and approved** (`tdw_review_request`, §3.5) but its GBP half is **blocked until ≈2026-10-27**; and **G1 has no foundation at all** — no delivered mark, no delivery path, no gallery association (§1.3, §1.4). The pitch's fifth line is the most expensive of the five to stand up.

**Q9 · Couple consent — where the switch lives and its default.** **Now answered with facts, §7:** the only home is `SettingsRoom` (`components/frost/blooms/settings.tsx:25`, mounted `sanctuary/page.tsx:1145`, write door `PATCH /api/v2/couple/me/:id`); it holds **zero switches** today and the only one it ever had was removed by founder ruling 2026-08-07; and **no consent column or per-couple switch table exists anywhere on the public plane** (`grep 'consent'` → 0 hits). The switch has neither a schema home nor a UI precedent. Its default is the founder's, bound by law §2.4 — *silence never means yes*.

---

## 10 · PROTOCOL ATTESTATION

**§7 and §11 opened at my own tip** (`dream-os` @ `c841082`), read in full, not from memory.

**The §7 apply chain, copied from `docs/TDW_BUILD_PROTOCOL.md:104` at the moment of writing, quoted back verbatim:**

```
unzip -o FILE.zip && cp -r deploy/* . && rm -rf deploy FILE.zip
```

**§11 acknowledged:** one sitting = one fresh workspace (fresh clones of both repos, `/tmp/dosprobe` and `/tmp/pwaprobe`, made at sitting open); **LE never pushes** — this container holds no write credentials and the git line below is the founder's hand; the tree was clean at open and no product byte was written in either repo.

**§12 acknowledged:** R-38.15 base-pinned ZIP with the guard first; R-38.16 the tip re-derived at the cut (`c841082`, unmoved); R-38.20's guard lives in the tree and is the apply block's first command; R-38.21.1 one command per founder-bound paste block.

**`docs/db/PUBLIC_SCHEMA.md` opened**, header whole (snapshot provenance, ladder tip `0129`, the staleness rule, the out-of-order blind spot and its register, the scope note separating the column half from the constraints half, the ordinal-gap paragraph) plus the five named table blocks in **both** halves. **Every column cited in this report carries its line:** `leads.source` `:689` · `public.events` columns `:535` · `events_state_check` `:1538` · `vendor_portfolio` columns `:1087`, `approval_state` `:1094`, its CHECK `:1877`, its partial index `:3234` · `public.couples` `:364` · `public.couple_state` `:340` · `leads_wedding_date_precision_check` `:1622` · `public.contracts` `:234` · `public.payment_schedules` `:811`.

**Planes read:** the **public** plane only. No engine-plane column is cited. **No SQL was authored this sitting** — the only founder-run commands are the two template GETs (consumed) and the one Railway check in §H2, neither of which touches the database.

**W-1:** zero soul, prompt or engine bytes. `src/engine/src/**` and `src/lib/vendorInbound.js` — the Victor seat's radius, named in the charter — were **not opened**; §5's derivations needed none of them.

**Zero product bytes.** The delta of this delivery is one file: `docs/reports/TDW_19_G0_DERIVATIONS.md`.

---

## H · HANDOVER (this seat's, riding the ZIP — not a CE-numbered entry, not `FINDINGS_LOG`)

### H1 · What this sitting produced

All seven G0 items derived by command at `c841082`. Three charter corrections filed and accepted as c-40.4(a)(b)(c). Five forks enumerated for G1's charter, three from the charter's list and **two added by this seat and disclosed as additions** (FORK D the render service's home, FORK E the Instagram OAuth host). **F-K4.1's open half is closed** by derivation: the two WABAs hold duplicates, not a split, and the three names unique to the old WABA are the `_hx` Twilio legacies already marked for retirement.

### H2 · The one founder act still owed by §2.3

The ffmpeg question cannot be answered from the repo, because `dream-os` contains **no image-build artifact of any kind** and Railway's Nixpacks builds from `package.json` alone. One command on the Railway service settles it — run it in the service shell for whichever service would render:

```
ffmpeg -version
```

`command not found` is the answer as much as a version banner is; either way it is a runtime fact about a provider image, and per R-38.22's spirit it should be re-checked rather than remembered when G1.3 or G4.2 charters.

### H3 · Owed before any Block 19 phase authors a template constant

A second GET with `fields=components` on WABA `1739793260373677`, to derive bodies and button shapes for `tdw_payment_due` and any other template a phase intends to send. **Note the standing rule this does not displace:** for `tdw_review_request` and `tdw_referral_invite` the authoring source is `TDW_19_P0A_LEDGER.md` B1/B2's verbatim approved bodies, never a live GET — including the byte note that Meta locked `Write a Review` with a capital R.

### H4 · Named gaps carried forward, none cured here

- The **missed-call template** (K-1 F3, 「you called」) does not exist on either WABA and must be authored, vetoed and filed.
- **Master §6's gate row says "Utility" for the review ask; the approved template is MARKETING.** The ledger's Amendment 2 already governs; the master's wording has not caught up. A chair act.
- `docs/TDW_00_MASTERPLAN.md` has **no Block 19 row**; the board is titled *Eighteen Blocks*.
- **R-40.1** (room names), **R-40.2** (the Victor sitting's vetoed lines) and the 19 row are the next docs-only cut, per the chair's relay. This report does not wait on them and cites the names as chat-ratified.

### H5 · Executor errors this sitting

One, owned. My first message stated the read ladder was discharged before I had opened `docs/marketing/TDW_INSTAGRAM_BIBLE.md` to its end; I read §8's topic bank and §§9–10 after sending, and the statement was true only at the moment it was checked, not at the moment it was written. No derivation in this report depends on the bible; the correction is procedural and is recorded because a read statement is a claim like any other.

### H6 · What G1's charter should carry that this sitting could not settle

FORK B's cost turns on **Cloudinary plan ceilings** (master §8.3) — a console fact. FORK C(b) needs a **founder-run census of `leads.source`'s live distinct values** before any CHECK is authored. FORK E needs **one reading of Meta's current Instagram permission matrix**. And the couple-consent write door `PATCH /api/v2/couple/me/:id` should be **read whole** before a consent column is proposed, because its allowlist pattern did not surface under grep and a new column may or may not need to join one.

*Sequencing beyond this sitting is the founder's.*

---
---

# ADDENDUM A — FORK E ANSWERED · THE TWO INSTAGRAM LOGIN FLOWS

**Appended 2026-09-04 beneath this report's own last line, per R-40.3.** Docs-only, same file, same base `dream-os @ c841082`. Nothing above this line is rewritten.

**The question R-40.3 puts:** for each permission master §5 names, does the estate's existing **Instagram Login** flow carry it, or does it need **Facebook Login for Business with a linked Page**? It decides the class of three §5 rows and two of §5.3's EXTENDS verdicts before the filing order is committed.

**Method.** Meta's own current documentation, read at the URLs cited beneath each answer. Where a permission's name in master §5 differs from the name Meta uses on the flow that carries it, the difference is stated rather than reconciled silently. **This addendum overturns two of this seat's own verdicts; both are owned in §A.5.**

---

## A.1 · THE TWO FLOWS, AND WHICH ONE THE ESTATE IS ON

Meta operates the Instagram Platform as two API setups, distinguished by login type, host and permission family.

| | **Instagram API with Instagram Login** | **Instagram API with Facebook Login** |
|---|---|---|
| Login | Business Login for Instagram | Facebook Login for Business |
| Host | `graph.instagram.com` | `graph.facebook.com` |
| Token | Instagram User access token | Facebook User / Page access token |
| Facebook Page required | **No** | **Yes** — the IG professional account must be linked to a Page |
| Permission family | `instagram_business_*` | `instagram_*` + `pages_*` |

Sources: `https://developers.facebook.com/docs/instagram-platform` · `https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login` · `https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-facebook-login.md`

**The estate is on Instagram Login, and the tree proves it without a console:** `src/lib/vendor/igOAuth.js:124` sets `GRAPH_HOST = 'https://graph.instagram.com'` and `:132` sets `IG_SCOPE = 'instagram_business_basic'`. Both are the Instagram-Login family. This is a repo fact, derived in §5.1 of this report, and it is what makes the rest of this addendum decidable.

**Instagram Login's own scope set**, per Meta: `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_messages`, `instagram_business_manage_comments` — the values that replaced the older `business_*` spellings, the old ones dead since 2025-01-27. Insights joined later under its own name (§A.2, I3).

---

## A.2 · THE ANSWER, PER PERMISSION

### I1 · Portfolio import — `instagram_business_basic`
**INSTAGRAM LOGIN CARRIES IT.** It is the flow's base scope and the estate's live one. No change. Verdict **EXISTS** stands.

### I2 · The DM bridge — `instagram_business_manage_messages`
**INSTAGRAM LOGIN CARRIES IT.** Messaging is one of the five capabilities Meta lists for this setup, and Meta states plainly that this setup does not require a Facebook Page to be linked. Meta's own app-creation guide records that `instagram_business_basic` and `instagram_business_manage_messages` are the two permissions added by default when the Instagram-Login setup is configured — messaging is the setup's default posture, not an exception to it.

Since July 2024 an Instagram professional account no longer needs a linked Page to hold conversations, manage comments or publish media.

Sources: `https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login` · `https://developers.facebook.com/documentation/development/create-an-app/instagram-use-case` · `https://developers.facebook.com/docs/messenger-platform/instagram/get-started`

**Verdict NEW stands, and it is a scope-widening on the existing flow — not a second OAuth flow.** FORK E's worst case does not obtain for I2.

### I3 · The Sunday brief and influencer reach cards — master names `instagram_manage_insights`
**INSTAGRAM LOGIN CARRIES IT — UNDER A DIFFERENT NAME. The master's permission string is the Facebook-Login one.**

The correct scope on the estate's flow is **`instagram_business_manage_insights`**, introduced in March 2025 when Meta brought user and media insights to the Instagram-Login setup. Meta's insights reference tabulates the two flows side by side: `instagram_business_basic` + `instagram_business_manage_insights` on `graph.instagram.com`, versus `instagram_basic` + `instagram_manage_insights` + `pages_read_engagement` on `graph.facebook.com`.

Two facts that bear on G4.1 and G5.3:

- The insights reachable this way include per-media views, profile visits and account interactions, and **follower trends including top follower locations and age demographics** — which is exactly master §5's *"audience demographics (age, gender, top 45 cities) at 100+ followers"* and exactly what a G5.3 reach card needs.
- **Advanced Access is required to request the permission from any app user.** Standard Access covers only accounts the app owns or manages. This is the same gate class as F-K3.8.

Named limitations from the same references, carried so a later sitting does not rediscover them: `follower_count` and `online_followers` are unavailable below 100 followers; demographic metrics return only the top 45 performers; and the **insights webhook is not supported on the Instagram-Login setup** — the Sunday brief is a pull on a cron, never a push.

Sources: `https://developers.facebook.com/blog/post/2025/03/24/user-and-media-insights-on-instagram-api-with-instagram-login/` · `https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights` · `https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights`

**Verdict EXTENDS UPHELD**, with the permission string corrected. Master §5's I3 row should read `instagram_business_manage_insights`.

### I4 · Publishing from TDW — `instagram_business_content_publish`
**INSTAGRAM LOGIN CARRIES IT.** Content publishing is one of the five listed capabilities and the scope is in the flow's own set. Verdict **NEW** stands, as a scope-widening on the existing flow.

**One residual, flagged not asserted.** The Instagram-Login overview's Limitations line states that this API setup cannot access ads or **tagging**. Master §5 claims publishing with *"user tagging on reels"*, and G1.3 wants the reel published with *"credits tagged"* — the credit roll's amplifier on Instagram. Whether Meta's word "tagging" there means product tagging, the `/tags` edge (media the user is tagged in), user tagging at publish time, or all three **is not resolved by that one line**, and this seat will not assert a reading of a four-word limitation. **It is a named residual for I4's charter**, and it matters more than its size suggests: if user tagging at publish is excluded, G1.3's reel ships without the credit roll attached and the acquisition loop loses its Instagram limb.

Source: `https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login`

### I5 · Comments as the first reply — `instagram_business_manage_comments`
**INSTAGRAM LOGIN CARRIES IT.** In the flow's own scope set; comment moderation is a listed capability. Verdict **NEW** stands, as a scope-widening.

### I6 · Mentions become credits — the mentions webhook
**INSTAGRAM LOGIN CARRIES IT.** Mentions — identifying media where the account was @mentioned — is a listed capability of the Instagram-Login setup, and Meta's webhook table shows the Instagram-Login comment and messaging webhook subscriptions taking `instagram_business_*` fields. Verdict **NEW** stands; the estate still has no IG webhook receiver, which was the basis of the verdict and is unchanged.

Sources: `https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login` · `https://developers.facebook.com/documentation/instagram-platform/self-messaging`

### I7 · Peer posting benchmarks — Business Discovery
**FACEBOOK LOGIN ONLY. THIS SEAT'S "EXTENDS" VERDICT WAS WRONG.**

Meta's Business Discovery reference states the availability in one line — available for the Instagram API with **Facebook Login** — and its permission block requires a **Facebook User access token** carrying `instagram_basic`, `instagram_manage_insights` and `pages_read_engagement`, with `ads_management` or `ads_read` additionally where the user's Page role came via Business Manager. The call is made against `graph.facebook.com` on the app user's own IG account id, naming the target by username.

Business Discovery appears in Meta's capability list for the Facebook-Login setup and **does not appear** in the Instagram-Login setup's list. The same asymmetry covers **hashtag search**, which master §5 already refuses on other grounds.

Sources: `https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/business_discovery` · `https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-facebook-login/business-discovery.md` · `https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-facebook-login.md`

**Reclassified: I7 is not an extension of anything the estate has. It is a second login flow, a linked Facebook Page per vendor, and a different permission family.**

### I8 · Engagement — `instagram_manage_engagement`
**FACEBOOK LOGIN ONLY.** Meta's April 2026 announcement of the like/unlike capability for feed posts, reels, comments and replies states that the update set is delivered through the Instagram API with **Facebook Login**, and names `instagram_manage_engagement` as the new permission it requires. Stories and private-account content are excluded.

Source: `https://developers.facebook.com/blog/post/2026/04/22/instagram-api-updates-for-partnerships-metrics-collaboration-and-engagement/`

**Verdict NEW stands, but for a stronger reason than the one given**: not merely that no code exists, but that the permission is on the other flow entirely. Master §5 already ranks I8 last and lowest-value, which this does not disturb.

---

## A.3 · THE STRUCTURAL CONSEQUENCE — ONE INSTAGRAM SETUP PER APP

The per-row answers do not compose the way a permission list would suggest, because of a constraint on the **app**, not on any permission.

**Meta's app-creation documentation states that only one API setup may be added per app, and that implementing both setups requires a separate app for each.** It appears twice in Meta's own pages, in the same words.

Source: `https://developers.facebook.com/docs/instagram-platform/create-an-instagram-app/` · `https://developers.facebook.com/documentation/development/create-an-app/instagram-use-case`

**Applied to the estate, using facts already derived:**

App-LIVE `1425513376067685` is configured with the **Instagram Login** setup — proven by `igOAuth.js:124` and `:132`, and by the fact that I1's live import runs against `graph.instagram.com` today. Therefore:

- **I2, I3, I4, I5, I6 are all reachable on App-LIVE**, as scope widenings at `IG_SCOPE`'s one home (`igOAuth.js:132`), with no second OAuth flow, no Facebook Page requirement, and no new app. **Five of the eight rows are clean.**
- **I7 and I8 are not reachable on App-LIVE at all** — not by widening a scope, not by adding a permission, not on any timeline — because they live on a setup the app cannot simultaneously hold. Reaching them means either **switching App-LIVE's Instagram setup to Facebook Login**, which would break the live I1 flow and orphan its App Review filing, or **a third Meta app**.

**A third app is not in the estate's law.** Master §2.3 and `TDW_06.5_GROWTH_SUITE_PARKED.md` §3 together state a two-app world: WhatsApp and Instagram permissions on App-LIVE `1425513376067685`; ads permissions on the second app under portfolio `995204059832918`, never App-LIVE. **A third app for a Facebook-Login Instagram setup is a charter question and is not ruled here.**

**And it reaches a refusal.** Master §7 refuses scraping and permits public peer data by exactly one named mechanism — Business Discovery. Master §4 G7 rests peer posting benchmarks on the same mechanism. **The sanctioned mechanism sits on the flow the estate is not on.** G7's benchmark limb is unreachable as currently architected; the refusal it serves is untouched and is not re-proposed here in any arm.

---

## A.4 · WHAT THIS MEANS FOR §5's FILING ORDER

Stated as consequence, not as a sequencing proposal — sequencing is the founder's.

- **One basket is now visibly coherent.** I2 · I3 · I4 · I5 · I6 are one flow, one app, one permission family, one token store, one scope constant. Master §5's filing law (one submission per permission or a small basket, each with its own screen recording) applies to them without qualification, and I2's stated priority — *file first after the WhatsApp pair returns* — is unobstructed.
- **The permission string for I3 must be corrected in master §5 before it is filed.** Filing `instagram_manage_insights` against an Instagram-Login app is filing a permission the app's setup does not offer.
- **I7 and I8 cannot be filed on App-LIVE in any order**, and no screencast can change that. They are blocked on a decision, not on a review.
- **The build-dark law (§2.2) still holds for I2–I6** and is unaffected by any of this: built whole, walked on a test account, one flag per permission, flipped on grant.

---

## A.5 · CORRECTIONS THIS SEAT OWNS

**e-G0.1 — the I7 EXTENDS verdict was wrong.** §5.3 classed Business Discovery as EXTENDS on the reasoning that it is *"a read using the existing token against a public account."* The token is the wrong token: Business Discovery requires a Facebook User access token on `graph.facebook.com`. The error is the one FORK E was raised to catch, and it was caught by the reading FORK E asked for — which is the argument for R-40.3 having been ruled into G0 rather than deferred.

**e-G0.2 — the I8 NEW verdict was right for an incomplete reason.** §5.3 gave the basis as *"no like/hide/delete paths"* in the tree. True, and not the binding constraint: the permission is on the other login flow.

**e-G0.3 — §5.3's I3 row reproduced the master's permission string without checking it against the flow the estate runs on.** The row was mapped correctly as EXTENDS and named with a permission that does not exist on `graph.instagram.com`. A name copied from a spec is a claim like any other; this one went unchecked until this addendum.

**Not corrected, because it held:** I2, I4, I5 and I6 were each classed NEW on the tree's own silence, and the classification survives the reading. FORK E's stated worst case — that three rows become a second OAuth flow — **does not obtain.** It obtains for I7 and I8, which FORK E did not name.

---

## A.6 · WHAT THIS ADDENDUM CANNOT SEE

Meta's documentation is the witness here, and it has three blind spots this seat will not paper over.

1. **Which permissions App-LIVE currently holds in Advanced Access** — a console fact. The founder's App Review submission `1461935125758843` covers the WhatsApp pair only; `instagram_business_basic` is NOT FILED per band 6's Meta ledger.
2. **Whether App-LIVE's Instagram use case is formally configured with the Instagram-Login setup in the App Dashboard.** The tree proves the *code* calls `graph.instagram.com` with an `instagram_business_*` scope, which cannot function against a Facebook-Login setup — so the inference is strong. **It is an inference, and the App Dashboard is the witness.** One screen settles it, in the manner F-K4.1 was settled.
3. **The meaning of "tagging" in the Instagram-Login limitation line** (§A.2, I4) — one further reading of the content-publishing reference, owed at I4's charter.

Meta revises this surface frequently: the `business_*` scopes were replaced and deprecated inside six months, insights arrived on this flow eight months after the flow itself, and the engagement permission is five months old. **Every answer above carries its date. Re-derive at the charter of the phase that files it.**

*Addendum A closes FORK E. G0 seals on it, per R-40.3. Sequencing beyond this sitting is the founder's.*
