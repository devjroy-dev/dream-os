# TDW_19 · G3.2 SITTING 3 — DREAM-OS PACKET 1 · HANDOVER

**Seat:** designer-LE · Fable · 2026-09-07
**Base:** `dream-os 3b6ded3` (re-derived at open by `git fetch -q origin`; the kickoff named `09b7f2e+`)
**Governed by:** R-40.120 (the founder's yes on the prototype; C1–C9 ruled) · R-40.121 (the lawyer's yes on clause 5) · R-40.118 · R-40.101 (the prototype is the ratified mock) · R-40.88 · R-40.73 · R-40.114 · R-40.27 · R-40.31 · R-40.44 · R-40.65
**Ratified mock:** `G32_S3_PROTOTYPE.html` (delivered 2026-09-07, R-40.120); lands in `dreamos-pwa/docs/mocks/` with the pwa packet.

---

## 1 · WHAT LANDED

| Ruling | Home | Bytes |
|---|---|---|
| **C1** functions on the record for a client with no lead | `contractSource.js manualFunctions` + `functionsForContract` (events first, manual when none) · `contractPdf.js placeOf(e)` (one lookup for both readers: clause 3's table, clause 5's gate) | `terms.functions_manual` gains its writer's shape and both readers |
| **C2** clause 5 as the Vendor's own words | `contractPdf.js` 5.2 one sentence through `ownWords()` (the clause supplies the full stop) · `contractAnnex.js TRADE_BASE.travel_and_stay_terms` seeded with R-40.73's sentence · `TDW_19_CONTRACT_GENERIC_v4.md` clause 5 amended in place, dated, R-40.121 cited · **`TDW_19_CONTRACT_FIELD_REGISTER_v3.md`** (a delta over v2; v2 untouched) · `0146` renames the stored key | 168 → 166 tokens, census by command |
| **C4** this couple only | `contractSource.js effectiveProfile(fields, terms)` — `{...profile, ...terms.policy_overrides}` computed once, handed to both the renderer's `P` and `deriveMoney`'s `P` | `''` wins and omits |
| **C5** the standard agreement before anything exists | `contractSource.js standardAgreementArgs / renderStandardAgreement / STANDARD_PLACEHOLDERS` · `contractPdf.js isPlaceholder` pass-through in `rs()`/`pct()` · **`GET /api/v2/vendor/contracts/standard`** (declared above `/:contractId/…`; writes only the draft PDF, never a row) | `[your fee]` `[the couple's names]` … are the founder's bytes |
| one call site kept | `contractSource.js render(args)` — both renders hand their args to one expression; b56 §5 and a new §15d cell count it | |
| `0146` | data only: rename `travel_terms` → `travel_and_stay_terms`, drop `same_venue`/`rooms` on stored profiles; two COMMENTs naming the new `terms` keys | no DDL |
| **b56 §15** | 36 cells; 272/272 green; five mutation proofs run RED→GREEN at the seat (§4) | |

C3, C6, C7, C8, C9 are pwa bytes and ride the next packet.

---

## 2 · THE ONE THING THIS PACKET FOUND THAT THE KICKOFF DID NOT NAME — candidate finding, chair to allocate

The standard-agreement render was the first render whose source did **not** load the profile into `terms`, and its first page had no Vendor line at 1.1. The census (`grep -o 'T\.[a-z_0-9]*' contractPdf.js` against the register's PROFILE rows) then showed a class, not a specimen:

| Token | Register home | Was read as |
|---|---|---|
| `vendor_signatory_name` | PROFILE v2 :90 | `T.` at **five** sites — 1.1 and the seal (×4) |
| `vendor_category_words` | seeded PROFILE (v2 :87) | `T.` |
| `exclusions` | PROFILE :106 | `T.` |
| `gst_treatment` · `gst_pct` | PROFILE :130–131 | `T.` |
| `gst_amount` · `fee_payable_with_gst` | DERIVED :132–133, `deriveMoney`'s | `T.` |

Nothing writes any of these to `terms`; the profile sheet writes them to `contract_profiles.fields`. **On every composed agreement rendered before this packet: no Vendor line, no vendor name on the seal, no "in particular, the following are not included", no tax block.** b56's fixture carried all seven in `terms`, so 236 cells were green for the wrong reason. Cured at every site to the register's home; the fixture moved to match; §15e holds the reverse proof (a name in `terms` alone is *not* read). Recorded in register v3 §0-bis. Outside the kickoff's named radius, inside its acceptance card — an agreement whose seal names nobody does not pass "sends a real contract".

---

## 3 · WHAT THE FOUNDER RUNS (each block in the packet, zero placeholders)

1. `0146` — four statements, one per paste, **census SELECT first**, verify SELECT after.
2. `node scripts/b56_contract_bench.js` at the applied tree → `272/272 cells green.`
3. The `/standard` door's glass walk lands with the pwa packet (the room's *See the standard agreement* card is the only caller). Its by-command witness here is §15d.

---

## 4 · MUTATION PROOFS, RUN AT THE SEAT (RED then reverted by reversing the edit — R-40.65)

| # | Mutation | FAIL count |
|---|---|---|
| 15a | `${P.rooms} room(s) at ${P.same_venue}.` back into 5.2 | 5 |
| 15b | `functionsForContract` returns `[]` on no lead | 1 |
| 15c | `effectiveProfile` drops the override spread | 2 |
| 15d | `rs()` loses its `isPlaceholder` branch | 1 |
| 15e | 1.1 reads `T.vendor_signatory_name` again | 3 |
| restored | | 0 · 272/272 |

Ten other benches are red at this tree **and identically red at `3b6ded3`** in a second clone (`b05_f0555` 1 · `b06_m0` 2 · `b07_f0772` 1 · `b07_p4b` 1 · `b10_p2` 9 · `b10_p3` 2 · `b51` 5 · `bOB_taxonomy` RED · `b55` no verdict line · `tdw10_combined_cap` crashes). Not this packet's; named, not cured.

`tsc -p src/engine/tsconfig.json --noEmit` clean. `node --check` clean on every touched file.

---

## 5 · OWED — stated, not closed quietly

- **The pwa packet**: the room replaced to the prototype (`screen.tsx` whole), `lib/vendor/api/vendor.ts` gains `fetchStandardAgreement`, `screen.tsx:192`'s `travel_terms` key → `travel_and_stay_terms`, the meaning lines, the *Someone new* door, the progress line, autosave, `next build` at apply (R-40.66).
- **F-40.245** (composed `sent` contracts route to the record, post-send states unreachable) — pwa.
- **The register's census line** in v2 :13/:31/:324 still says 168; v3 §0 supersedes it and says so. v2 is not edited.
- **`PUBLIC_SCHEMA.md`** is stale for 0139–0146; the two comments in `0146` are the regen's input, not a substitute for it.
- **`functions_manual` at Send**: the room's `requiredRows` "Functions and dates" row must count manual rows — pwa. The door refuses on nothing yet (sitting 2's note stands).

---

## 6 · THE CHAIN

`git fetch` → tips re-derived (`3b6ded3` / `82612b38`) → read: room, annex, source, renderer, doors, register, bench → census of every reader of `travel_terms`/`same_venue`/`rooms`/`T.functions` → edits → standard render found the §2 class → census of `T.*` against the register → cure at every site → fixture moved → §15 authored → five mutations RED, restored GREEN → ten pre-existing reds re-run at a clean clone of the tip → `0146` → register v3 → this note.

`git status --short` at the cut: six modified, three new (`0146`, register v3, this file). Nothing pushed — the founder pushes.

---

# PACKET 2 · THE PWA — THE ROOM REPLACED TO THE PROTOTYPE (and a one-line dream-os rider)

**Base:** `dreamos-pwa 82612b38` (re-derived at open; unchanged since the room read) · `dream-os 8c262cc` (packet 1, fresh clone). **Governed by:** R-40.120 C3, C6–C9 · R-40.101 · R-40.117 (s2's sheet mechanics carried by name) · R-40.118 · R-40.66 · F-40.242 · F-40.243 · F-40.245 · F-40.246 · F-40.252.

## 7 · WHAT LANDED (pwa)

| | Home | Bytes |
|---|---|---|
| **The room, replaced whole** | `app/vendor/(shell)/contracts/screen.tsx` | eight screens as one tree: Room (policies card first, C3) · Your contract policies (28 rows, a meaning line on every one, `You deliver on the day, so there's nothing to set here`) · Someone new (name + number → `composeContract({name, phone})`, R-G32.17) · From a client · The agreement (progress thread, functions she adds herself → `terms.functions_manual`, fee/deposit, what's included with the trade's annex attached by default (C7), *These are your policies* → `terms.policy_overrides` (C4), what's printed) · Preview and send (the missing rows named from `requiredRows`, no per-field sentences) · After sending (sent → signed → deposit received → the date is held, F-40.245) |
| Autosave on blur | fee, deposit, partner, number (the number to the client, only when changed) | `Save and finish later` retired; the record is a screen, no scrim can drop typing (C9, F-40.246) |
| The standard door's caller | `lib/vendor/api/vendor.ts fetchStandardAgreement()` · the card's *See the standard agreement* and the fork's *Read it* | asks the door, opens `pdf_url` (F-40.152's posture) |
| Register v3 on the surface | `travel_and_stay_terms` as a textarea; no retired token | |
| The dead pair | Venue/City on the record gone (F-40.242) | functions carry their own venue and city |
| **The mock filed** | `docs/mocks/G32_S3_PROTOTYPE.html` | R-40.101 |
| **b57** | 22 byte pins re-cut under R-40.120 (each marked at the cell); the structural pins moved to the replaced room's shape; **§11**, 31 cells; **183/183** | six mutations RED → GREEN (§9 below) |
| dream-os rider | `contractSource.js:191` — the stale `F-40.117` citation → **F-40.243** | one comment, b56 272/272 |

**Carried from sitting 2 by name, not re-derived (R-40.117):** `{ ...seedsNow, ...stored }` under her answers; `savedKeys` provenance; `ChoiceRow` closed vocabularies; placeholders from the door with `{name}` from the session; `omitted` rows and `requiredRows(…, basis)`. **One thing I first got wrong and corrected before the cut:** the first draft showed seeds as placeholders and posted only what she typed. The renderer reads `contract_profiles.fields` alone, so a seed she never saves never reaches paper — s2's design (post the merge whole, mark seeds *Suggested*) is the one that puts R-40.114's seeds on the agreement, and it is restored.

## 8 · TWO BYTES NOT ON THE PROTOTYPE — ⚠ VETO ON THE GLASS

The prototype drew the mapped trade and never the clause-10 line. The room needs both:

1. **The unmapped trade** (2 of 29 vendors have no category): under *What's included* — *We don't have your trade on file yet, so nothing is attached. Pick what you provide.* — all seven, none attached.
2. **Clause 10 has no switch anywhere in the estate** (the renderer's header; b56 reds on a mutation that adds one). Under *What's printed* — *The wedding page isn't a switch here — that one is Priya's, in her own account.*

Both marked `⚠ VETO` in the source at the byte.

## 9 · MUTATION PROOFS (pwa), RED then reverted by reversing the edit

| # | Mutation | real FAILs |
|---|---|---|
| 11a | `doStandard` opens a URL literal instead of the door's `pdf_url` | 2 |
| 11c | `fnPlaces` drops the manual rows | 1 |
| 11d | overrides posted through `saveContractProfile` | 1 |
| 11e | the fee Field loses its `onBlur` | 1 |
| 11f | every composed contract routes to `record` | 1 |
| 11g | the sheet's key back to `travel_terms` | 2 |
| restored | | 0 · 183/183 |

`tsc --noEmit` clean (the in-seat sweep, R-40.66); `eslint` clean on the room and the client (b57's own two `require()` lines are pre-existing). **`next build` is the founder's gate at apply** — seat containers cannot fetch Google Fonts.

## 10 · OWED AFTER THIS PACKET

- The founder's walk: Swati's phone → a new number → sent in under five minutes without asking what a word means. **That is the card (kickoff §5).**
- The `/standard` door's first glass read (card → *See the standard agreement*).
- The Send door still refuses on none of the six required fields; the room is the one home for the rule (sitting 2's note stands).
- `PUBLIC_SCHEMA.md` regen for 0139–0146.
- `G32V4_VETO_SHEET.md` rows the prototype superseded are not edited; the prototype is the sheet from R-40.120.

---

# PACKET 3 · THE FOUNDER'S WALK (DEV440, 2026-09-07 20:47–20:56) — what it found, what this packet cures

**Bases:** `dream-os ae781f5` · `dreamos-pwa 10dbce8`. The walk itself: `+ New contract → Someone new → 8595356978 → record → Add a function (Sangeet, 2026-09-08) → Preview and send → Send`, on a photography vendor. Railway: `[clients:resolveOrCreate] created new client 27a25f43 … for vendor 23165e38`. The card's mechanism held end to end; three things did not.

## 11 · THE WHATSAPP THAT NEVER LEFT — the door had no send arm

`POST /:id/send-to-couple` opened the signing and returned `sent: false` under **both** flag states; with `CONTRACT_SIGN_SEND_ENABLED=1` (set in production — a fact this seat had carried as "unset" from sitting 2's note and stated as current, F-40.130's shape, on record) it returned a hardcoded sentence about the template. Census at `ae781f5`: **no `sendWa` call for `tdw_contract_sign` anywhere in `src/`.** The template has been Active since 2026-09-06 (b56 §10). The room did the honest thing with what the door gave it: *Link copied — sending is not open yet*.

**Cure:** `contractSend.js sendSignLink` — vendor lane, `tdw_contract_sign` (`owner · functions · link`), the number to **E.164 through `toE164`** (F-40.185's cousin: ten digits typed), one `contract_sends` row per attempt with the reason as `status`. The door calls it when the flag is on and returns the send's own answer. b56 §16, ten cells, three mutations RED→GREEN; **282/282**. Candidate finding — chair to allocate.

## 12 · THE ESCAPE BLEED — F-40.199's class, 35 sites

JSX text and JSX attribute strings do not interpret backslash-u escapes; the room's first cut used them in both. A vendor read `It\u2019s saved` on her own screen. Cure: every escape in the file is now the character itself (82 replaced, string literals included; `split(' — ')` byte-identical). b57 §11 reds on any escape returning; the mutation was run. Candidate finding — chair to allocate.

## 13 · THE FOUNDER'S RULING ON THE GLASS — the missing rows are doors

*Before you can send* now lists each blank as a tap: record rows open the record, policy rows open her policies (and come back). `requiredRows` carries `where`. Ruled by the founder on the walk, 2026-09-07.

## 14 · WHAT THE WALK PROVED

Compose from a name and a number, the manual function on the record, autosave, the thread, the checklist naming `Your fee` and `Who signs for you`, Send appearing once both were filled, the sent state opening on *Waiting for …*: all on glass. b57 187/187, b56 282/282.

---

# PACKET 4a · DREAM-OS — F-40.257 AND F-40.258 (the first signature's two `meta_send_failed` rows)

**Base:** `dream-os 52f0b2f`. **Governed by:** R-40.124–.127 (recorded), the founder's SELECT on `contract_sends` for contract `5e21c3dc…`.

## 15 · WHAT THE ROWS SAID, AND WHAT EACH ONE MEANT

| Row | Reason | Cause, derived | Cure |
|---|---|---|---|
| `client · 8595356978 · contract_copy` | `recipient is not E.164 (got 10 digit(s))` — refused by `sendWa` before Meta | `sendOne` passed `clients.phone` as typed; `sendSignLink` (packet 3) normalises, the older arm never did | `toE164` in `sendOne` — the one home, the whole arm |
| `vendor · +919888294440 · contract_copy` | Meta `400 (#132018) There's an issue with the parameters in your template` | the document header linked a **signed URL on the private `contracts` bucket** (`…/object/sign/…?token=<jwt>`, 600 s). Every other byte the estate hands Meta to fetch rides the **public `wa-media` bucket at an unguessable path** (`metaMedia.js`, F1); this header was the one exception | `publishSealedForMeta`: the sealed PDF is copied to `wa-media/contracts/<ts>-<uuid>.pdf` as `application/pdf` and the header links the public URL. The private object stays the record. A failed rehost refuses both sends as `rehost_failed` |

**What this cure does not prove.** #132018 also fires on a shape mismatch between the payload and the template as filed at Meta. The payload here is one body `{{1}}` plus a document header (`buildTemplatePayload`, unchanged). **R-40.71 — the founder reads `tdw_contract_copy`'s detail page:** header = Document, body = one variable. If the glass says otherwise, that is the residue and it is a template question, not a code one.

## 16 · F-40.258 — the OTP send has a row

`api/sign.js`'s OTP door now writes `contract_sends` (`recipient client · template_key contract_sign_otp · wamid`) on success and the refusal's reason on failure, through `recordOtpSend` in the send home. The receipt router's `home=none matched=0 — NO ROW CARRIES THIS SID` for the OTP wamid ends here (the router's own matching is unchanged; it reads `contract_sends.wamid`).

## 17 · BENCH

b56 §17, twelve cells: E.164 in `sendOne` (driven through `sendSealedCopy` with the flag on and a fake storage), the rehost by function (download from `contracts`, upload to `wa-media` as PDF, public URL with no token), both refusal shapes, the OTP row on success and before rethrow. **294/294**; three mutations RED → GREEN.

## 18 · THE RE-WALK (after Railway is Active)

Open *Swati Roy Test Contract* (`Signed`) — the copy send fires only at signing, so: **Cancel** → *+ New contract → Someone new → 8595356978* → function → fee → Send → OTP → sign. Expect on both handsets (DEV440's +91 98882 94440 and 8595356978): *Your signed agreement with … is attached* with the PDF. Then the SELECT:
`SELECT created_at, recipient, to_phone, template_key, status, wamid, error_code, error_title FROM public.contract_sends ORDER BY created_at DESC LIMIT 6;`
Expect `contract_sign · delivered`, `contract_sign_otp · sent/delivered` with a wamid, `contract_copy × 2 · sent/delivered`. Any `#132018` surviving → the template's detail page (R-40.71).

---

# PACKET 4b · DREAM-OS — F-40.264, ONE TAXONOMY

**Base:** `dream-os eefdd68`. **Governed by:** R-31.1 (nobody else holds a copy), the chair's relay of 2026-09-07.

## 19 · WHAT WAS THERE, WHAT IS NOW

`contractAnnex.js` keyed `CATEGORY_ANNEXES` and `TRADE_DEFAULTS` on **fourteen** keys of its own against a taxonomy of **eleven** (`src/agent/categories.js VENDOR_CATEGORIES`): four — `mehendi`, `choreographer`, `invitations`, `cake` — are tokens the taxonomy retired or folded into `other` / `performer`. Both readers matched the **raw** string, so an alias (`videographer`, `Photography`, `caterer`) fell to the unmapped branch. `bOB_taxonomy_bench` §6.1 had been red on main since the s2 rider.

Now: the eleven and `normaliseCategory` come in **by import** (`../agent/categories`, `./vendor/categoryFraming`); one `tradeKey(category)` — null first, normalise, `other` is not a trade — feeds both readers; the four folded rows are gone and their trades read the unmapped branch as the taxonomy already says (mehendi's annex E stays in `ANNEXES`, offered under unmapped). `annexesFor`'s contract (`mapped`, `offered`, `others`) is unchanged.

**Proofs:** `bOB_taxonomy_bench` **GREEN** (77 → 78/78). b56 **§18**, nine cells (every key of both tables ∈ the eleven by census, aliases reach their trade, folded tokens read unmapped, null first, both readers through `tradeKey`); **304/304**; two mutations RED → GREEN. One note on the proofs: bOB §6.1 tests for the import, so a stray key added back reddens **b56 §18**, not bOB — the census cell is the standing guard.

**Radius by census:** `tradeDefaultsFor` / `annexesFor` / `omittedFor` callers (`contracts.js` annex-map door, `contractSource.standardAgreementArgs`) receive the same shapes; the pwa room reads `mapped`/`offered`/`others`/`defaults`/`delivery_basis` unchanged. A vendor stored as an alias now sees her trade's annex attached by default where before she saw all seven.

---

# PACKET 4 (pwa) · R-40.124–.126 AND F-40.256

**Base:** `dreamos-pwa bfa3197`. Two files.

| Ruling / finding | What landed |
|---|---|
| **R-40.124** a Needed row is filled where it is named | `neededField(r)` on *Preview and send*: one control per blank with the same meaning line and the **same writer** as the record — number to the client on blur, fee/deposit through `/fill` on blur, a function through the sheet. `requiredRows` rows carry a `key`. |
| **R-40.125** a Needed policy row opens only that row | a policy blank is **one Field / ChoiceRow** from `PROFILE_SECTIONS`'s own register, saved on blur through `savePolicyRow` as `{ ...seeds, ...profile, [key]: v }` (R-40.114's merge rides with it); the sheet is never opened from the list. |
| **R-40.126** the per-couple policies are one prominent tap | the section is a **card** (Cormorant title, CTA button *See or change them for {name}*), and when a policy blank still blocks Send the card says so on the record: *Still needed to send: Who signs for you.* — before Preview finds it. |
| **F-40.256** `Rs Rs` | the four `Rs ${formatRs(…)}` sites now call `formatRs` alone (R-U25's one money home). |

b57: five packet-3 pins re-cut under the rulings; four proof cells added (inline fill, single-row policy save with no `openProfile` in the branch, the card's CTA and gap line, no `Rs` beside `formatRs`); **190/190**; three mutations RED → GREEN. `tsc --noEmit` clean, eslint clean; `next build` at apply (R-40.66).

**Not in this packet, named for the chair:** the sealed-copy paper defects (6.4 empty slabs — dream-os seeds + a sheet row; 12.2 with no name home — ruling; `shot_by` in 10.6 — ruling; the `_draft` name on a signed download — pwa one branch).

---

# PACKET 4b (final cut) · DREAM-OS ON `c4145c8ab3cace992f08f2034588b6a92422eb09` — F-40.264 + THE SEALED COPY'S FOUR

Re-derived on `c4145c8` (G2's `base_guard` cure on top of G3.1 s2's `0147`; none of this packet's files moved under either — `git diff --stat a4fdc92..HEAD` on the seven is empty). The `eefdd68` and `a4fdc92` cuts are withdrawn. F-40.258 (the OTP row) is already on main at `52f0b2f`, verified by the founder's SELECT (`contract_sign_otp · delivered` with a wamid); nothing further rides here for it. No column is needed; no `0148` (R-40.44).

| Finding | Home | Bytes |
|---|---|---|
| **F-40.264** | `contractAnnex.js` | keyed on the eleven by import; `tradeKey()` normalises; four folded rows gone (§19 above) |
| **F-40.265** | `contractAnnex.js TRADE_BASE` | `cancel_tier_1/2/3_days` seeded 90/60/30; OMIT-ROW (the class the chair named) unchanged and now has rows to print |
| **F-40.266** | `contractPdf.js` 12.2 | reads `P.named_professional` (PROFILE beside the signatory, register v3 §0-ter); the sheet's row rides the pwa rider |
| **F-40.267** | `contractSource.js withCreditLabel` at both places `P` is built | the key resolves to `ROLE_LABEL` (*Shot by*), a phrase prints as written; the renderer stays pure (b56 §5's no-db law kept — the first cut put the require in the renderer and §5 reddened it) |
| **F-40.268** | `contracts.js POST /:id/preview` | a `signed` contract returns a signed URL to `contract_signatures.sealed_path` (`<id>.signed.pdf`) with `sealed: true`; nothing is re-rendered under `.draft`; a draft still renders |

**Proofs:** bOB GREEN 78/78 · b56 **314/314**: §18 (nine, F-40.264) and **§19** (ten — the seeded slabs print by render length, 12.2 prints from the profile and the old plane is dead by reverse proof, the label at both build sites, the signed branch and the draft fallthrough); six mutations RED → GREEN across §18/§19.

**Owed on the pwa (a rider in the pwa lane, behind G2 and G3.1):** the sheet's *Who attends* row for `named_professional` under *Your business*; the *After* screen already reads the sealed object through the same preview call, so nothing changes there for F-40.268.

**Then:** the founder's walk of R-40.124–.126 on glass, and one signing → `contract_copy × 2 · delivered` (`tdw_contract_copy` Active with the document header since 23:21).

---

# PACKET 4c · DREAM-OS RIDER ON `7e0b6eba578f6fd397a2700f7f99f3428cfc229b` — THE VENDOR'S 131053

**The founder's second signing (2026-09-07 20:35–20:37, client 8757788550):** `contract_sign · read` → `contract_sign_otp · read` → `contract_copy · client · read` — the couple received and opened the signed PDF (F-40.257's client half closed on data; the #132018 was the missing Document header, cured at Meta 23:21). **`contract_copy · vendor · failed · 131053 Media upload error`** — Meta accepted the message (a wamid) and could not fetch the document at `:04.5`; the couple's copy on the **same URL** at `:05.5` was read. The object was not yet readable on the public CDN at the instant of the first fetch.

**Cure, in the send home:** `publishSealedForMeta` hands the link on only after `awaitReadable` — a HEAD that must answer `200`, five tries with a 200→1600 ms backoff — and refuses by name (`rehost_failed`, both copies) if it never does. `deps.fetch`/`deps.sleep` are injectable so the bench drives it without a network. b56 **§20**, four cells; §17's rehost cells stub the fetch; **318/318**; two mutations RED → GREEN. Candidate finding — chair to allocate.

**Then:** one more signing → `contract_copy × 2 · read/delivered` and the PDF on both phones. That closes the card.

**Also recorded:** the founder's screenshot of the sign link opening on the desktop showed the vendor's *Preview and send* screen, not `/sign/…`. The signing succeeded from the couple's phone (the OTP row proves it), so the desktop had a vendor session; whether `middleware.ts` redirects an authenticated vendor away from `/sign/<token>` is a read this seat has not made — named, not concluded.
