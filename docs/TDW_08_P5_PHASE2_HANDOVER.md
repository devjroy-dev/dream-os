# TDW_08 · P5 · PHASE 2 — S-7, THE TDW MANUAL (executor handover)

**Base:** dream-os `0615f47` · dreamos-pwa `96cda4a` — both re-derived at origin by
`git fetch -q origin && git rev-parse --short origin/main` at sitting open, both
equal to the charter's tip, both trees `git status --porcelain` clean (0 lines).
**Charter:** the twenty-first chair's P5 Phase 2 kickoff, 2026-08-04.
**Ruled to:** the CE's census ruling + the three-founder-answers addendum,
2026-08-04 — FORK A(b)+rider · B(b) at range granularity · C(c) · D(a)+(b).
**Role:** EXECUTOR. Nothing here was pushed; the LE holds no write credentials.

---

## 1 · WHAT SHIPPED

**Phase 2's docs-only expectation was AMENDED BY FOUNDER RULING** 「 collab will be
open to everyone including essential 」 to exactly the collab retirement sites. Both
repos now carry bytes, so this ships as TWO ZIPs.

**dream-os — three files, two new, one modified.**

| File | What |
|---|---|
| `docs/TDW_MANUAL.md` | NEW. S-7. Twelve sections, 3,084 words. `MANUAL_VERSION: v1` + the census-tip hashes per FORK D(a)+(b). |
| `docs/TDW_08_P5_PHASE2_HANDOVER.md` | NEW. This file — the witness table's home per FORK D's re-homing. |
| `src/api/vendor/collab.js` | The tier gate RETIRED (`:389-396` out); the SELECT narrowed to `city`; the ruling cited verbatim in-comment with its date, F-06.85-style. |

**dreamos-pwa — one file modified.**

| File | What |
|---|---|
| `app/vendor/collab/page.tsx` | `canPost` retired WHOLE across all FOUR sites + the `vendorTier` prop. |

**W-1 CLEAN.** Zero soul, prompt, lens or engine bytes — `git status` grep for
soul/lens/prompt/`src/engine/src` returns nothing. The delivery is exactly the four
files above.

---

## 2 · THE WITNESS TABLE — EVERY CLOSER-VISIBLE CLAIM, ITS WITNESS, ITS TENSE

**This table is the Manual's provenance and it is loaded by no agent.** It lives
here rather than in the Manual because witnesses are machinery text and the Manual
is a model-loaded file — F-06.52's label lesson applied. Re-derive this table
before any future Manual edit ships.

**Path-over-range** is used for every pointer meant to outlive a refactor; line
numbers appear only where the claim IS the line.

### §1 — What TDW is

| Claim | Witness | Tense |
|---|---|---|
| The tagline | pwa `app/(landing)/page.tsx:41` `MOTTO` const, rendered `:1202`; also `app/demo/bride/page.tsx:98-99` | LIVE — founder-confirmed current 「 Yes 」 |

### §2 — Pillar 1, the CRM · **LIVE**

| Claim | Witness | Tense |
|---|---|---|
| The record set (leads, clients, invoices, expenses, events, notes, portfolio, crew/bands, contracts, TDS, collab) | `src/api/vendor/core.js` — 27 mounted sub-routers | LIVE |
| Two nav groups; Studio = Calendar/Business/More, Discover = Portfolio/Leads/Collab | pwa `components/vendor/BottomNav.tsx`, `STUDIO_ITEMS` + `DISCOVER_ITEMS` | LIVE |
| Business resolves to four rooms | pwa `app/vendor/list/[slice]/page.tsx` — the slice map | LIVE |
| 29 vendor surfaces | pwa `app/vendor/**/page.tsx` | LIVE |
| Calendar: one writer, block whole or by slot, typed kinds, verdict refusals spoken at the door | `src/lib/eventWrite.js` (sole writer) · `occupancy.js` · `0078`'s (vendor,date,slot) unique key · Block 04 B2/B3/B4 seals | LIVE |

### §3 — Pillar 2, natural-language AI · **LIVE**

| Claim | Witness | Tense |
|---|---|---|
| Victor + Donna, two agents one loop | `src/engine/src/core/loop.ts` · `donna.ts` | LIVE |
| One self across surfaces | `harveySoul.ts`; WA seat `src/index.js` `runTurn` | LIVE |
| "Roughly forty distinct operations" | 38 by dedupe across `src/engine/src/core/tools/*.ts` | LIVE — **stated as "roughly forty", deliberately not "38"; see §4(b)** |
| The witness line derived from the actual write, not from prose | `chat.js` `deriveFiling`/`chipFiling` (D-2, Block 06 sitting 0) | LIVE |
| The interceptor, and its live catch | wire guard Stage 2 on both doors (`vendorInbound.js` WA seat; PWA-JSON); catch recorded at CE-112 | LIVE |
| The Report control | pwa route + chip, CE-107 Slots One–Five | LIVE |

### §4 — Pillar 3, WhatsApp · **LIVE**

| Claim | Witness | Tense |
|---|---|---|
| Official WhatsApp Business Platform, Meta Cloud API direct | `src/lib/metaCloud.js`; WABA `1739793260373677`; Twilio sunset CE-62 | LIVE |
| Full door — same engine as the app | `src/index.js` → `runTurn`, the shared turn core | LIVE |
| Unprompted sends: morning nudge, crew assignment, payment reminder, enquiry alert | `src/lib/templates.js` keys `morning_nudge_vendor` · `crew_assignment` · `payment_reminder` · `enquiry_alert_vendor`; **sender for the nudge: `src/cron.js:93`** (`_sendWa`, `line:'vendor'`, `nudgeClass`) | LIVE — **template approval founder-witnessed on Meta 2026-08-04 (CE addendum §2)** |
| Forwarded-message discernment | `harveySoul.ts` (S-11, shipped at 06 P4) | LIVE |
| Mode word + fresh-thread word on WA | `src/api/vendor-engine/vendorMode.js`, imported at `src/index.js` | LIVE |

### §5 — Pillar 4, prospects and bookings · **PARTIAL**

| Claim | Witness | Tense |
|---|---|---|
| A couple messaging a vendor's line is answered by an assistant | `src/lib/vendorInbound.js:565` → `runCoupleAgenticTurn` (`src/agent/engine.js`) | LIVE |
| It takes a short qualified enquiry then hands off | `src/agent/coupleSystemPrompt.js` — the stated goal | LIVE |
| It does not quote price or promise availability | `coupleSystemPrompt.js` rule 5 | LIVE |
| Enquiry lands as a real lead + a WhatsApp alert | `src/api/couple/enquire.js` · `templates.js` `enquiry_alert_vendor` | LIVE |
| Booking hands are the vendor's, not the couple's | `recordPrimitives.ts` — `donna_book_event` et al. are vendor-lane tools | LIVE |
| "A fuller couple-facing assistant is being built" | S-2/S-3; `vendors.assistant_name` from `0080`, **zero readers by command** | **ABSENT — this is the one sentence that flips when Phase 4 ships** |
| The Closer (TDW's own prospects) | `src/lib/prospects.js:5` — the seam's own words; zero model calls across `marketingIndex.js` + `prospects.js` | **ABSENT — deliberately not mentioned in the Manual at all** |

### §6 — Pillar 5, advisory · **LIVE, with a disclosed reliability finding**

| Claim | Witness | Tense |
|---|---|---|
| The Advisor room, category-calibrated | `src/engine/src/core/advisorLens.ts` | LIVE |
| Gated on `victor_mode='advisor'` | `loop.ts` — the read site | LIVE |
| Reachable both doors: chip + WA word | pwa `components/vendor/VictorModeChip.tsx`, mounted `app/vendor/page.tsx`; `vendorMode.js` | LIVE |
| Filing pauses; `jot_advice` captures counsel | `advisorLens.ts` (no Donna by construction) · `tools/jotAdvice.ts` | LIVE |
| **"not yet perfectly reliable, under active measurement"** | **F-06.4 UN-PARKED (CE-99, two specimens); CE-112 production watch №1** | LIVE — **the constraint the CE ordered honored; the Manual never says "always redirects cleanly"** |

### §7 — Pillar 6, the marketplace · **LIVE, one PARTIAL named**

| Claim | Witness | Tense |
|---|---|---|
| The thirteen rendered storefront fields | `src/lib/discover/shapeVendor.js` — the shaped row | LIVE |
| Enquiries arrive as leads + alert | `src/api/couple/enquire.js`; `demoLeadAlert.js` for the demo plane | LIVE |
| Floor: hero · about · 6 photos · 3 tags · rate · IG · travel | `src/lib/vendor/profileScore.js` — `SECTION_ORDER`, `MIN_TAGS`; `MIN_PORTFOLIO_IMAGES = 6` at `src/lib/vendor/discover.js` | LIVE |
| Cap 20 images | `MAX_PORTFOLIO_IMAGES = 20`, `src/lib/vendor/portfolio.js` | LIVE |
| Vendors see what they are missing, ranked by weight × gap | `profileScore.js` — the hint ordering | LIVE |
| Featured: submit + review, **payment not switched on** | `src/lib/vendor/featured.js` — `RAZORPAY_LIVE !== 'true'` mints `stub_${Date.now()}`; the live branch is `null // TODO` | **PARTIAL — stated as partial in the Manual body AND in §12** |

### §8 — The couple side · **LIVE** (expanded by founder ruling, 2026-08-04)

| Claim | Witness | Tense |
|---|---|---|
| **The countdown arc — days since the engagement beside days to the wedding, on one progress arc** | `src/api/couple/profile.js` · `today.js` · `meridian.js` compute `days_until_wedding`; pwa `sanctuary/page.tsx` calls `daysUntil(weddingDate)` AND `daysSince(engagementDate)` into `arcProgress`; `lib/frost/tokens.ts` `daysUntil` | LIVE — **the founder's "arc between I will and I do" is two variables on one arc, not a metaphor** |
| Daily poem · prose line · written-out date · auto light/dark respecting a manual choice | pwa `sanctuary/page.tsx` — `getDailyPoetry`, `prose(d)`, the day-name table, `@frost.home_mode_manual` | LIVE |
| The canvas rooms: functions/events · people · vendors · expenses · moments · reminders · circle · muse | pwa `app/(frost)/frost/canvas/journey/{events,people,vendors,expenses,moments,reminders,circle,settings}` + `muse`; `src/api/couple/**` — 22 routers | LIVE |
| Mira on the couple's own WhatsApp line | `src/agent/miraSoul.js` (sealed CE-65); bride lane live on Meta, CE-54 | LIVE |
| "Around two dozen real operations" | `src/agent/brideTools.js` — **25 declared tools** | LIVE — approximate form, same reasoning as §4(b) |
| "Says her name plainly the first time… then never announces herself again… a switchboard" | `miraSoul.js` — her own bytes, paraphrased close | LIVE |
| Mira under the claim doctrine | `miraSoul.js` header — the claim doctrine bound in at CE-65 | LIVE |
| Circle: invited by name → own invitation → own number verified → own access | `src/api/circle/join.js` — validate · send-otp · accept · set-pin; `role` defaults `family` | LIVE |
| Circle feed · threads · muse save and comment | `src/api/circle/{feed,threads,messages,muse}.js` | LIVE |
| **"The Circle sees only what she chooses to reveal"** | MASTERPLAN §2 sovereignty set — **a standing law. `feed.js` proves dual-lane auth, NOT payload filtering; no resolver was derivable.** | **LAW-WITNESSED, NOT CODE-WITNESSED — flagged, same class as B-3. A future sitting should derive the resolver or the sentence should soften.** |
| The enquiry carries name · wedding date · city · functions · budget band | `src/api/couple/enquire.js` payload; `src/lib/discover/enquiryFields.js` — `bandCeiling`, `normalizeFunctions` | LIVE — the section's strongest sentence |
| "Today a couple is charged nothing… no paywall anywhere on her side" | `Full Table` / `full_table` / `fullTable` — **zero hits both repos**; no seat cap shipped | LIVE — **tense-guarded deliberately: E-9 makes The Full Table (Rs 999 one-time) standing law, so this is TRUE TODAY and will flip. Written as a today-sentence, not a promise.** |

### §9 — Tiers and pricing

| Claim | Witness | Tense |
|---|---|---|
| Four tiers: Trial · Essential · Signature · Prestige | `src/api/vendor-engine/chat.js:2408` `ENGINE_TIER_MAP` — the four keys | LIVE |
| **Collab available at EVERY tier** | `src/api/vendor/collab.js` — **the gate RETIRED in this delivery** under 「 collab will be open to everyone including essential 」; the client duplicate `canPost` retired with it. See §2A. | LIVE **as of this ZIP** — the Manual sentence and the code moved in one act, never the Manual first |
| Studio is Prestige | `requirePrestige` applied at `src/api/vendor/studio/{payments,briefing,messages,tasks,team}.js`; `src/api/middleware/requirePrestige.js` returns `TIER_PRESTIGE_REQUIRED` | LIVE |
| **"there is exactly one capability behind a tier"** | **After the collab retirement, `requirePrestige` is the ONLY tier gate left in the estate, derived by command** | LIVE |
| `Plans range from Rs 999 to Rs 5,999 per month.` | **NO CODE WITNESS. Zero price constants exist in either repo.** Founder's own bytes, CE addendum §1. | **FOUNDER-ASSERTED, NOT DERIVED — see §5(a)** |
| No trial duration claimed | `trial_ends` / `trial_expires` / `trial_started` — **zero hits both repos**; `trial` is a tier name, not a clock | LIVE — the absence is why no duration sentence exists |

### §10 — The demo mechanic

| Claim | Witness | Tense |
|---|---|---|
| Demo studios built from the vendor's real IG work | Block 08 P4 factory; `demo_vendors` | LIVE |
| Live countdown; it sunsets | `demoLifecycle.js`; `0107` `sunset_at`; **G-2 AMENDED 30 → 90 days** | LIVE — **the Manual states "carries a live countdown… it sunsets" and names NO number, so the amended window needs no Manual edit** |
| Claim in one action, reaching the team immediately | `POST /demo/vendor/:handle/claim`, `src/api/demo/vendor.js`; inserts `demo_claim_requests` | LIVE |
| Thinner than a real profile — no enquire link, no starting price, no tags | `src/lib/discover/shapeDemoRow.js` — `enquire_link` null, `starting_price` null, `vibe_tags` empty | LIVE |

### §11–§12 — Objections and the honesty section

| Claim | Witness | Tense |
|---|---|---|
| Ranking earned by completeness + real supply; Featured the one paid surface, marked | `src/lib/discover/ranking.js`; Block 07 P1 | LIVE |
| ~~"No pretending to be human"~~ | S-2 alone | **STRUCK from v1 (bounce cure 3). Sentence-in-waiting №1 — returns at Phase 4's seal. See §3.** |
| ~~"Voice notes and photographed dates… discarded rather than stored"~~ | — | **STRUCK (bounce cure 2). FALSE both halves: voice is unprocessed (`vendorInbound.js:436`), images are STORED.** |
| "Images a vendor sends in are stored, not discarded… re-hosted to a durable address… unguessable" | `src/lib/metaMedia.js` — re-hosts bytes to a public bucket at an unguessable path, returns a durable plain-GET url, two persisted audit columns (`source_image_url`, `media_url`) | LIVE — **authored FROM the code truth, which is what the cure ordered** |
| "A couple's contact details reach a vendor when she enquires and not before — that act is the door — and on a demo profile they are withheld entirely" | **WITNESSED BY ROUTE, not doctrine:** `src/api/couple/enquire.js:303` puts `Contact: {phone}` in the vendor's ping and `:458`/`:491` into the lead — **only on the couple-initiated enquire route**; the demo leg masks it at one home (`src/lib/demo/maskDemoLead.js`, "bride_phone reaches none") | LIVE — **the vague form was replaced: it could have been misread as "vendors never get her number," which is false. The enquiry IS the door, and the sharpened sentence says so.** |
| ~~"Most managers… ask for their own login"~~ | — | **STRUCK (bounce cure 4). Unwitnessed statistical claim at a three-account population.** |
| "TDW is in active development" — the FORK A(b) honesty rider | The rider itself, CE ruling §2 | LIVE — present tense, no roadmap |

---

## 2A · THE COLLAB RETIREMENT — FOUR SITES, AND WHY THE COUNT MATTERS

**FOUNDER RULING, verbatim: 「 collab will be open to everyone including essential 」**
(2026-08-04). Posting a collab requirement moves from three tiers to four. **That
verb IS the ruling** (CE-115 clause 2).

**The gate had FOUR client sites, not the two the server's vocabulary made
visible.** The first census grepped `upgrade_required` and the copy string —
server words — and never the client's own predicate, so `canPost` and its submit
short-circuit were invisible to that command. Retiring only the two named sites
would have shipped **an open server behind a closed UI**: the compose form still
hidden, the submit still returning before a request left the browser.

| Site | What it was | Disposition |
|---|---|---|
| `collab.js:389-396` | server allowlist + 403 `upgrade_required` | RETIRED; ruling cited in-comment |
| `collab.js:383` | `.select('tier, city')` | NARROWED to `'city'` — `tier` was read only by the retired check. **`me.city` remains load-bearing at the insert's city fallback and the fetch survives.** |
| `page.tsx:654` | `canPost` — the client's duplicate allowlist | RETIRED |
| `page.tsx:681` | `if (!canPost) return;` submit short-circuit | RETIRED |
| `page.tsx:715` | `upgrade_required` error mapping | RETIRED with the error it mapped |
| `page.tsx:760-767` | the rendered upgrade block | REMOVED-BY-RULING; ternary unwrapped |
| `page.tsx:226/648-649` | the `vendorTier` prop + its type | REMOVED — **zero other readers derived by command before removal, as ordered** |

**CONTROL INVENTORY (CE-115), `PostCollabForm`:** upgrade banner **REMOVED-BY-RULING**
· compose fields, add/remove-requirement, date, city, budget, payment period,
submit — **KEPT, now reachable at every tier** · close `×` — KEPT.

**DISCLOSED, NOT BUILT.** `CollabScreen`'s own `tier` prop (`page.tsx:103`, `:119`)
now has zero readers, its only consumer having been the removed `vendorTier` pass.
Removing it touches the parent's signature and its call site, which the ruling did
not reach. **tsc is clean with it retained**, so it is named here rather than
taken — an unruled arm.

**COPY INVENTORY — TWO removals, not one.** The removed block carried two
sentences, and an inventory that named one while the deletion took two is the
F-08.50 shape:

> `Upgrade to Signature to post collab requirements.`
> `You can still browse and respond to others' posts.`

Both are on the veto list at §7 as removals. Nothing minted.

**THE FINDING-SHAPED SENTENCE, per the CE's §3 — recorded for whoever writes the
first collab bench: NO BENCH AND NO PROOF ASSERTED THIS GATE AT EITHER TREE.**
`allowedTiers` · `upgrade_required` · `canPost` · the copy string returned zero
hits across `dream-os/scripts/` and `dreamos-pwa/scripts/`. That is why the floor
is byte-stable through a behaviour change — **and it is also why nothing existed
that would have caught the four-site gap.** A collab bench's first cell owes the
tier-openness assertion.

---

## 3 · THE ONE SENTENCE IN THE MANUAL THAT THE CODE CONTRADICTS TODAY

**F-08.52, widened per CE correction №1 and re-verified at my own tip.**

`src/agent/coupleSystemPrompt.js` carries the instruction at **two** sites:

- `:30` — `6. Never mention that you are an AI. You are ${vendorName}'s assistant.`
- `:130` — `5. Never mention you are an AI. You are ${vendorName}'s assistant.`

My census cited `:29` and one site. **Both wrong; both corrections verified by
command before acceptance and owned here.** The off-by-one came from reading a
`sed` window offset rather than a numbered read — INDEPENDENT-METHOD clause 1
against my own bench.

**Why this matters to THIS deliverable and not just to Phase 4:** the Manual's
§12 ends with *"No pretending to be human. Asked directly, the honest answer is
given."* That is S-2, it is the ruled behaviour, and it is what the Closer should
say. **It is not what the live couple-facing agent is instructed to do today.**

I have shipped the sentence, because the CE ruled the finding waits for Phase 4
and because a Manual that omitted the honesty line would be selling a weaker
product than the one that ships two sittings from now. **But it is the single
claim in this document whose witness is a ruling rather than the code**, and it is
recorded here in those words so that Phase 4's sitting is forced to close it and
so that nobody reads the Manual as having derived it.

**If the founder sequences F-08.52 sooner, this row turns green and this section
deletes.** Until then it is a declared gap in the Manual's own provenance.

---

## 4 · DEVIATIONS, DISCLOSED (§0.2 — reported, never worked around)

**(a) LENGTH: 2,596 words against the spec's ~3,500–4,500 band. Disclosed, not
padded.** The band was authored 2026-07-14 for the spec's eight-section shape;
FORK C(c) ruled a different spine. Every section the spec named survives — its §2
"day in the life" is distributed across pillars 2 and 3 rather than standing alone,
and its §3 "surfaces" is folded into pillar 1, because a pillar spine that also
carried a parallel surfaces list would say each thing twice. **The Manual also
rides the Closer's cached static prefix, where every word is paid for on every
cold window.** I did not pad to hit a number authored for another shape. **If the
CE wants the band met, the honest expansion is a narrated day-in-the-life section
restored as its own — it is the one piece of the spec's shape that genuinely lost
something, and it is sellable prose rather than filler.** Ruling requested.

**(b) "Roughly forty distinct operations", not "38".** The derived count is 38.
I wrote the approximate form deliberately: an exact number in a model-loaded file
becomes a fact the Closer will state, and it drifts the first time a tool is added
or retired — with nothing to catch it, because no bench reads this document.
**"Roughly forty" is true at 38 and stays true across ordinary movement.** The
exact figure lives in this handover, where a re-derivation will catch it.

**(c) The Manual carries NO file paths, NO line numbers, NO internal component
names, and NO tool names.** Not an omission — F-06.52's donor mechanism. The
business room once injected a machinery label two inches above the law forbidding
those words, and every specimen was the label echoed. This document loads into a
model that talks to strangers about the product; every witness lives in §2 above.

**(d) The demo sunset window is described without a number.** G-2 was amended
30 → 90 days. Rather than state 90 and create a second place for it to drift, the
Manual says the demo carries a live countdown and sunsets. **The window can be
re-dialled by config without a Manual edit.** Deliberate; flagged in case the CE
wants the number stated.

**(e) The pricing fence is STRUCK, per the standing rider** — the founder's
whole-document veto doubles as the byte-confirm, so the HTML comment came out
rather than shipping machinery text into a model-loaded file. The sentence stands
bare at its site: `Plans range from Rs 999 to Rs 5,999 per month.`

**(f) I did not restore the spec's "invite codes retired (W-8)" or any S-6 close
mechanics.** Those are the Closer's behaviour, not product facts a vendor reads.
The Manual is what TDW IS; how the Closer closes is his soul's, Phase 3's.

---

## 5 · WHAT A FUTURE READER MUST NOT MISREAD

**(a) The pricing sentence is the founder's word and NO CODE ENFORCES IT.**
Zero price constants exist in either repo. There is no subscription billing rail:
Razorpay appears only as a stub in the Featured path. A future census will find
the same absence and must not read the Manual's own sentence as its witness —
**that is the circularity this table exists to prevent.** Per-tier pricing enters
the Manual the day Block 09 P4's billing rail lands and the numbers become
derivable (FORK B arm (c), deferred-named).

**(b) Tier does NOT change the model.** The four product tiers map to routing
tiers at `chat.js:2408`, but E-4 unified every tier onto the same split. The live
matrix is `admin_config` rows, unreadable from an executor container. **The Manual
therefore claims no AI-quality difference by tier, and no future edit should add
one without reading the live config.** The two gates in §9 are the whole tier
story as derived.

**(c) The six `PROPOSED — founder-final on the WABA` comments in `templates.js`
are STALE**, founder-witnessed against Meta 2026-08-04. Six, not five — my census
missed `:301` `tdw_vendor_reset_otp`, caught by the chair (CE correction №2), the
CE-183 species with the bench as its subject this time. **The comment strip is
chartered as a rider on Phase 3's delivery**, zero-behaviour, each replacement
citing: *approved, founder-witnessed on Meta, 2026-08-04*. It did not ride Phase 2
because Phase 2 is docs-only with an expected-zero on `src/`, and that expectation
does not bend for convenience.

---

## 6 · THE FLOOR, PAIRED

Docs-only; expected movement is **zero**. Run at delivery, both sides stated.

| | base `0615f47` | delivered | |
|---|---|---|---|
| selftest | 386 | 386 | byte-stable |
| b07_p1 · b07_p5 · b07_f0774 · b07_p6 · b07_f0784_panel | 75 · 136 · 20 · 29 · 59 | identical | byte-stable |
| b08_p1_lifecycle · b08_p3 · b08_console | 106 · 61 · 71 | identical | byte-stable |
| b08_p4_factory | 83 | 83 | byte-stable |
| b08_p5_invite | 35 | 35 | byte-stable |
| b07_f0789_phantom_columns | 19 | 19 | byte-stable |
| pwa tsc | 0 lines | 0 lines | cleared `.next` both runs |
| pwa named counts | 45 · 88 · 133 · 82 · 43 · 68 · 57 | identical | byte-stable |
| pwa tdw08_p5_invite_spent | 14 | 14 | byte-stable |

**All twelve dream-os rows above were run TWICE — once at the cured tree, once at
`0615f47` via `git stash` — and `diff` of the two runs is EMPTY.** Behaviour
changed and no bench moved, which is exactly what §2A's no-bench sentence predicts
and is itself the evidence for it.

**pwa, both sides, deps installed and `.next` cleared on every run:** tsc **0 lines
at base and 0 lines cured** · **23 `.mjs` proofs rc=0** · `tdw08_p5_invite_spent`
**14/14** · `tdw08_p4_factory` **45/45**.

**Floor-method disclosures, three:**
1. **The first tsc run of this sitting reported 15 errors and was DISCARDED, not
   reported** — `node_modules` was absent on the fresh clone, so every error was
   `Cannot find module 'next'`-class. Those were the container's numbers, not the
   tree's. Deps were installed and both sides re-run. Phase 1's disclosure ② is the
   precedent and this is its second instance.
2. **The engine has no `npm run build`** — `scripts` is empty. The dist is built by
   `npx tsc -p tsconfig.json` from `src/engine`, derived by reading the package
   rather than authored from the shorthand, and recorded here because the next
   sitting will need it.
3. **`npm install` created `src/engine/package-lock.json`, untracked. It was
   DELETED before packaging and is not in either ZIP.** A container artifact in a
   delivery is a byte nobody ruled.

---

## 7 · THE VETO LIST

**The whole document is copy and the veto is whole-document, the founder's,
executed before commit.** Nothing in `docs/TDW_MANUAL.md` is exempt.

| Item | Status |
|---|---|
| The six pillar headings | HIS words, transcribed as given |
| The tagline | CONFIRMED CURRENT 「 Yes 」 |
| `Plans range from Rs 999 to Rs 5,999 per month.` | Fence STRUCK — the whole-document veto doubles as the byte-confirm per the standing rider. Register clean by command. |
| **REMOVED — `Upgrade to Signature to post collab requirements.`** | Deletion of a now-false sentence, three sites. For the founder's eye. Nothing minted. |
| **REMOVED — `You can still browse and respond to others' posts.`** | The second sentence in the same block. **The inventory named one; the deletion took two.** Corrected here per F-08.50's framing. |
| Everything else | The executor's prose, whole-document veto owed |

**Money-register verification, by command at delivery:** zero rupee glyphs · zero
`k`/`L`/`Cr` shorthand · the one money site is `Rs 999` / `Rs 5,999`. **The glyph
is named in words, never minted** — the first draft of this very line carried the
character it forbids and tripped its own check. Self-caught, recorded.

---

## 8 · WHAT THE NEXT SITTING PICKS UP

- **The founder's whole-document veto** — it doubles as the pricing byte-confirm,
  and it is the last gate before commit. The optional day-in-the-life section is
  his add at veto, not restored by default.
- **Phase 3 — the Closer.** He now has S-7. His soul is authored against this
  document and nothing else; where he wants a fact this Manual does not carry,
  that is a Manual question, not a soul question.
- **The `templates.js` comment-strip rider** rides Phase 3's delivery (§5(c)).
- **Phase 4 — Eliza — MUST close F-08.52** at BOTH sites (`:30` and `:130`), which
  is what returns sentence-in-waiting №1 to the Manual.
- **Row 09's voice work returns sentence-in-waiting №2.**
- **A collab bench, whenever one is written, owes the tier-openness cell** (§2A).
- **The Circle-sovereignty sentence is law-witnessed, not code-witnessed** — derive
  the resolver or soften the sentence.
- **This witness table is re-derived before any Manual edit ships.** Not read —
  re-run. A Manual whose claims were true at `0615f47` is a document with a
  documented drift history, and F-08.51 exists because six chairs inherited one.
