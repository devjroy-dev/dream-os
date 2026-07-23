# TDW_05 — F-05.18 + F-05.11-γ · EXECUTOR HANDOVER (the onboarding sheet)

**Base:** `dream-os 9538ed3` · `dreamos-pwa 1084089` (both re-derived fetch-first at a fresh
clone; both status-clean at the charter tips).
**Built to:** the CE RULING BLOCK of 2026-07-23 whole, and the veto ledger V1–V4 closed.
**Role:** executor. Nothing here is a CE entry; the chair writes CE-64 after its own
re-derivation.

---

## 1. WHAT SHIPPED

**dream-os (1 modified, 1 new)**
- `src/api/couple/onboarding.js` — the extended field contract (fork A3) + fork B1's
  third write.
- `scripts/b05_f0518_onboarding_bench.js` — NEW, 27 cells, both-ways.

**dreamos-pwa (2 modified, 1 new)**
- `app/(auth)/couple/onboarding/page.tsx` — F-05.18 (a) Bearer attached via
  `getAccessToken()`, (b) `d.ok` dialect + the 401 line, (c) the ruled payload.
- `app/(auth)/couple/pin-reset/page.tsx` — NEW, 437 lines, F-05.11-γ's rail.
- `app/(auth)/couple/pin-login/page.tsx` — the wire + V3's copy.

**WITHHELD, founder-run, in two SEPARATE later messages (conditional-withheld law):**
`0100_couple_onboarding_fields` and the S0.5 state-reset SQL. Neither is in either ZIP,
and they are never handed as two runnable blocks in one message.

---

## 2. THE RULINGS, HONOURED ONE BY ONE

| ruling | what landed |
|---|---|
| **A3 whole** | `0100` adds exactly TWO columns |
| **A3-a** | payload key is `wedding_city`; the existing column adopted; no twin minted |
| **A3-b** | `name` → `users.name`, through me.js:85-91's shape |
| **A3-c / U3** | `user_segment` computed nowhere, sent nowhere, stored nowhere |
| **A-name** | the column is `residence_city`. Screen label unchanged |
| **A chair addition** | `wedding_style` lowercased as sent; NO CHECK constraint; the ten values named in 0100's comment block |
| **B1** | one request, three writes (couples · notes · users), users leg non-fatal |
| **C1** | both surfaces survive; frost's untouched, 0-line diff |
| **D2** | `getAccessToken()` imported across namespaces, with the one comment naming why |
| **E1** | sibling page + inline fetch; declared drift pair, both rails naming each other |
| **G2** | F-05.28 filed, not cured; γ sends `Authorization: Bearer` on set-pin from birth |
| **H** | bench in dream-os, drives the NEW payload, old shape's green retired |
| **Correction №1** | the F-05.24 rider is STRUCK; zero rider code shipped; S6 kept as free regression |

**The veto, executed:** V1 `Session expired. Please sign in again.` lifted verbatim from
`canvas/onboarding:85`; raw `Unauthorised.` never reaches a bride. V2 the couple lane's
`Could not set PIN. Try again.` — the vendor near-twin did NOT cross the lane. V3 both
lanes now read exactly `Forgot PIN?`. V4 the lifted set as tabled; `DREAMER PORTAL`
inherited; Maker/Dreamer left unopened.

---

## 3. THE PROOF

**`b05_f0518_onboarding_bench` — 27 passed, 0 failed.** It drives the REAL router's REAL
layer chain (requireCoupleAuth, then the asyncHandler-wrapped handler) against an
in-memory supabase that RECORDS what production asked it to write. Nothing in the module
under test is replaced. §6 carries the witnessed 21-column list from `PUBLIC_SCHEMA.md`
plus 0100's two, and fails on any unwitnessed key reaching a couples UPDATE.

**BOTH-WAYS, at the uncured origin tree: 21 passed, 6 FAILED** — on exactly the cures:
`3.4` residence_city · `3.5` wedding_style · `4.1` users.name write · `6.2` phantom keys
inert · `7.1`/`7.2` the new trims.

**BY PRODUCTION MUTATION** (each a one-line edit of `onboarding.js`, never of test setup):

| mutation | result |
|---|---|
| **M5** resurrect `wedding_country` as an accepted alias for `wedding_city` | 26/1 — `6.2` REDs |
| **M6** drop `requireCoupleAuth` from the route | bench ABORTS by design with `route layer chain is not [auth, handler]` — it refuses to silently test half a route rather than reporting a cell |
| **M7** make the users-name write fatal | 26/1 — `4.3` REDs |
| **M2/M3/M4** (delete residence_city / wedding_style / the users write) | covered by the uncured run above |

**THE FLOOR — TWELVE FOR TWELVE BYTE-STABLE, counts re-run at delivery:**
crons 48 · sendwa 55 · webhookcore 11 · otp_meta 24 · b0498 58 · punct 17 · movementb 47 ·
transport 10 · m1b 4 · m2 2 · prospect 47 · checker 101. (The b0498 pair needed
`npm run build` first — the D-10 engine-dist lore, as the kickoff said.)

**pwa `tsc --noEmit` whole-tree: exit 0**, run against a cleared `.next`.

**Delta discipline:** dream-os = `onboarding.js` + the new bench, nothing else.
pwa = the three files above; `(landing)/page.tsx`, `(auth)/couple/pin/page.tsx` and
`(frost)/frost/canvas/onboarding/page.tsx` are 0-line.

---

## 4. WHAT I DECIDED THAT NOBODY RULED (disclosed, each one-word vetoable)

1. **No `notes` rows for the two new columns.** The four originals keep theirs byte-exact.
   Note contents are agent-surfaced strings and the veto closed at zero new words; minting
   `Lives in: Mumbai` would ship unvetoed copy under cover of a schema change.
2. **The 73-city `INDIA_CITY_SET` is kept, dormant, with a comment** rather than deleted —
   it is the witnessed vocabulary a server-side derivation must port on the day a
   `user_segment` reader is born, and that port was priced to THAT sitting.
3. **The γ affordance does NOT clear the session** on the way to the rail (the old one
   did). The rail prefills the phone from it, and a mis-tap is recoverable via "Back to
   PIN entry" without a re-login.
4. **`residence_city` caps at 80** (wedding_city's cap, same dropdown); `wedding_style`
   caps at 40.
5. **A missing token on the onboarding submit** shows the V1 line and returns to landing
   rather than posting an unauthenticated request that would 401 anyway.

---

## 5. BANKED BY NAME, so nothing surprises a later chair

- **The C1 asymmetry:** a bride who somehow reaches the frost onboarding surface first is
  never asked residence or style. Acceptable at current routing, where `(auth)` is
  strictly first (`(landing):513`). Named so it cannot ship silent.
- **`user_segment`'s future:** when a reader is born, derive-on-read is chartered THEN and
  the city-set port is priced THEN. Neither is done here.
- **The three extended fields have ZERO readers today** — a census across both repos and
  both planes. The founder ruled EXTEND; this is the honest state of what EXTEND bought.
- **F-05.28 (filed, uncured):** `couple/auth.js:353` `POST /set-pin` is unauthenticated,
  bare `couple_id`, the comment at `:355-356` confessing it. Its caller
  `(auth)/couple/pin/page.tsx:81` posts bare. Cures in its own coordinated sitting paired
  with F-05.13's vendor half.
- **Adjacent, out of scope, reported not cured:** `sanctuary/page.tsx:561` hardcodes
  `wa.me/917982159047` inline instead of `waNumberFor('vendor')`. The number is CORRECT,
  so no dead link — but it is F-05.24's structural class surviving one site.
- **The pwa half of this cure has no bench anywhere in this estate.** `tsc` and the
  founder's thumb are its floor. That is why the card below is proof, not ceremony.

---

## 6. THE SMOKE CARD — the founder performs, the executor reads the evidence

**Run the two SQL blocks first, each from its own message. Then walk once, in order.**

**S0 — run `0100` in the Supabase SQL editor.**
Paste back the readback rows. *Looking for: `residence_city` and `wedding_style` present on
`couples`.*

**S0.5 — run the STATE RESET block** (arrives separately).
*This puts the test bride back to "never onboarded" so the broken screen is reachable at
all. Without it you land on PIN entry and never see the thing we fixed.*

**S1 — open the site and sign in with the invite/OTP path, NOT PIN entry.**
Use `+919431101193`. *You should land on the "Let's get to know you." screen.*
*Looking for: you got there at all.*

**S2 — fill it in and tap "Let's go →".** Put a real city in both place questions and pick
a wedding style. *Looking for: no error toast, and it moves you to the PIN screen.*
Then run the SELECT that arrives with the card and paste the row.
*Looking for: your name on `users`, the four originals plus `residence_city` and
`wedding_style` on `couples`, `onboarding_state = 'complete'`, and the notes rows.*

**S2.5 — set a PIN** (the screen you just landed on). Any four digits.

**S3 — sign out, then tap "Forgot PIN?" on the PIN screen.**
*Looking for: it opens a reset screen — not the front page. Enter the number, and the code
should arrive on WhatsApp from **+917011788380** (Mira's line), not the vendor number.*

**S4 — type the code, set a new PIN, confirm it.**
*Looking for: it takes you straight in. If it throws you back to the front page, that is
the δ defect and I want to know immediately.*

**S5 — close the browser completely, reopen the site.**
*Looking for: still signed in. No PIN, no re-login.*

**S6 — open the sanctuary page and tap the WhatsApp link.** *(Free regression — this was
fixed last sitting and has never been tapped live.)*
*Looking for: Mira's chat opens on +917011788380.*

**If any step goes wrong, stop and paste what you saw.** Do not run the git line on a red
verify.

---

## 7. WHAT THE NEXT SITTING PICKS UP

The couple soul (05's chartered closing sitting), on the founder's sequence. F-05.28 and
F-05.13's coordinated pass remain open and unscheduled. Sequencing beyond this sitting is
the founder's.

---

## 8. THE RUN RECORD — appended after the founder's walk, 2026-07-23

**The walk went S0 → S6. Six green, one red, and the red was not on delivered code.**

| step | result |
|---|---|
| S0 | 🟢 `0100` applied. Readback 23 rows; the first 21 matched the witnessed list one-for-one in order, every default included. |
| S0.5 | 🟢 Both test accounts reset, one row each, verified. |
| S1 | 🟢 Invite/OTP path reached the onboarding screen. OTP from the bride line as `tdw_couple_login_otp`. |
| S2 | 🟢 The contract landed on three planes — see the row below. |
| S2.5 | 🟢 PIN set. |
| S3 | 🟢 The rail exists. Affordance reads exactly `Forgot PIN?`; `/couple/pin-reset` opened with the number prefilled; reset OTP from the bride line as `tdw_couple_reset_otp`. |
| S4 | 🟢 **F-05.11-δ holding on the couple lane** — new PIN, landed sanctuary, no 401, no bounce. |
| S5 | 🔴 **F-05.29**, below. Delivered code exonerated. |
| S6 | 🟢 Free regression: sanctuary `wa.me` → the bride line. First live tap of CE-63's F-05.24 cure. |

**The witnessed row (`+919625759924`):**

```
user_name        Dev Test 23     ← fork B1's third write, on users.name
residence_city   Delhi           ← 0100, new
wedding_style    hindu           ← 0100, new, lowercased as sent
wedding_city     Mumbai          ← overwrote 'Delhi for sure'
onboarding_state complete
budget_total     2000000         ← UNTOUCHED
```

`notes` carried exactly **one** new row — `Wedding city: Mumbai` — and nothing naming
residence or style. §4's disclosed silence, visible in production data.

**The cell nobody designed.** `budget_total` survived a full write at 20,00,000. The web
form has no budget field and sends none; that value came from an earlier WhatsApp
onboarding. The all-optional contract updated what it was given and blanked nothing it
wasn't. It became testable only when the founder explained where two earlier `notes` rows
came from — it was not in the card. Equally: **Delhi in residence, Mumbai in wedding, not
crossed** — two identical-looking dropdowns three keys apart, where a swap would have been
invisible to every green thing in §3.

---

### F-05.29 — FILED, NOT CURED (found by the smoke, out of this sitting's scope)

**The bride surface's front door ignores the cookie mirror the whole lane maintains.**

`sanctuary/page.tsx:181–182` reads localStorage only, on both legs, with no cookie
fallback. Meanwhile `lib/frost-api/_base.ts:134` **writes** `tdw_couple_token` on every
token read and `:138` reads it back — precisely so iOS Safari's ITP cannot strand a bride.

**Evidence:** after `localStorage.clear()`, `document.cookie` still carried
`tdw_couple_token` — the mirror survived — and the guard bounced to landing anyway.

**Consequence:** an iPhone bride who does not open the app for seven days is signed out
while holding valid credentials. A seatbelt bolted to a car with no seat.

**Scope:** `sanctuary/page.tsx` is 0-line in both ZIPs of this delivery; the guard predates
the sitting. The cookie's own survival is what exonerates the reset rail's session write.
The cure is small — give the guard the fallback `getAccessToken()` already has — but it
touches the front door of the entire bride surface, so it is a ruling, not an executor's
improvisation.

**Observation riding alongside, chair to rule whether it is a finding at all:** three sites
carry a cross-lane cookie fallback — `_base.ts:138`, `requireCoupleAuth.js:14`,
`requireAuth.js:18`. Server-side this is defensible (the token resolves to a user, a
vendor-only identity gets 403, and one human being both vendor and couple is a supported
state). Client-side, after an ITP wipe, `getAccessToken()` falls through to the **vendor**
cookie and sends that JWT to couple endpoints — on a shared device, one person's token
driving another person's session. Narrow, real, and it reads as a convenience rather than
a decision.

---

### Also banked from the walk

- **Canonical test account changed, founder-directed:** `+919625759924` (user `2900c661` /
  couple `9f1f84d5`) **supersedes** `+919431101193` from CE-54. The bride-cutover charter
  and every smoke card lean on that fact.
- **The register divergence, witnessed twice:** the bride agent writes conversational prose
  into a typed column (`Delhi for sure`) while the web form writes a clean dropdown value
  (`Mumbai`). Not a defect — the column is free text and always was. It **is** evidence the
  `user_segment` sitting needs: `isIndiaCity('Delhi for sure')` returns false, so a Delhi
  bride would derive as `global`. Derive-on-read must cope with two registers in one column.
- **Two lanes, one notes plane:** WhatsApp onboarding and web onboarding write the same
  `['onboarding','city']` tag vocabulary. Nobody designed that; it holds.
- **The 503:** one occurrence on the first sanctuary load, in a preserved-log buffer that
  never gained a second across five subsequent loads. Consistent with Railway rebuilding
  from the push. Named, not closed.
