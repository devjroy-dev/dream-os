# TDW_19 · G3.2 — CONTRACTS & DEPOSITS · SITTING 1 · HANDOVER

**Seat:** CE-40 · G3.2 · LE · 2026-09-06 → 2026-09-07
**Closing tips:** `dream-os 81eaf8f` · `dreamos-pwa 5a99eab7`
**Migration:** `0138_contract_fill_and_sign.sql`, applied and witnessed in production
**Benches:** `b56_contract_bench` 175/175 · `b57_contracts_wiring_bench` 61/61
**Frames:** `docs/mocks/contracts-mock.html`, 16 frames, 30 shots
**Veto sheet:** `docs/mocks/G32_VETO_SHEET.md` — 72 rows + T1 + rider 1 (R1–R8) + rider 2 (P1–P4, Q1–Q10)

---

## 1 · WHAT THIS SITTING WAS FOR, AND WHETHER IT DID IT

The charter: make the lawyer-passed v3 **a document the product fills, sends, and gets signed.**

**It does.** On 2026-09-06 at 18:14:58Z a real couple, on a real phone, read a real agreement and
signed it with a one-time password. The signature row, the sealed PDF and its fingerprint all exist
in production. Every ruling of the arc has been witnessed on glass rather than on a double.

**The founder card ran green end to end, eleven steps:** compose → promote-on-pick → fill → preview
→ send → the leaf → the OTP → the signature → the sealed copy → **an independent digest check** →
the deposit → *The date is held.*

---

## 2 · WHAT LANDED

### dream-os

| | |
|---|---|
| `db/migrations/0138_…` | `contract_profiles`, `contract_signatures`, five columns on `contracts` |
| `src/lib/contractPdf.js` | **NEW.** The pure v3 renderer. No DB handle, one call site, `sealed` as a third state |
| `src/lib/vendor/contractSource.js` | **NEW.** The typed read home; `renderContract`, the renderer's only caller |
| `src/lib/vendor/dateLock.js` | **NEW.** R-G32.1's derivation, exported once |
| `src/api/sign.js` | **NEW.** The couple's leaf: `GET /:token`, `/document`, `POST /code`, `/sign` |
| `src/lib/vendor/contracts.js` | F-40.112's cure + eleven writers, one per fact |
| `src/api/vendor/contracts.js` | compose · fill · preview · send · deposit · profile |
| `src/lib/metaCloud.js` | R-40.91's E.164 guard at `postMessage` |
| `src/lib/templates.js` | `contract_sign` (Active) + `contract_sign_otp` (Active) |

### dreamos-pwa

| | |
|---|---|
| `app/sign/[token]/page.tsx` | **NEW.** The fourth capability leaf. **Terminal.** |
| `lib/public/signCopy.ts` | **NEW.** Nine bytes, closed set |
| `app/vendor/(shell)/contracts/screen.tsx` | The room: four states, the union picker, the record, the phone field, F12's refusal |
| `lib/solutions/routes.ts` · `support/page.tsx` | The hub row — the **fourth of nine** to open |

---

## 3 · THE LAWS THIS ARC IS BUILT ON

**The instrument constrains the surface, not the reverse.** Clause 12 says the couple *taps "I
agree"*, so the button says exactly that. Clause 12 promises a one-time password, so the leaf sends
one — `/consent/`'s last-four friction check was refused for this act. When the instrument and the
product disagreed, the product moved.

**A blank prints as a blank.** Never `N/A`, never a greyed zero. `contracts_deposit_pct_check`
forbids zero precisely so *not set* and *zero* cannot be confused.

**`events.state` was never widened.** R-G32.1: a locked date is an upcoming event whose contract
carries `deposit_received_at`, derived once in `dateLock.js`. Master §4 G3.3's `'booked'` describes a
write the database refuses, and it was superseded rather than forced.

**No money moves through this platform.** The deposit is vendor-marked, the rails are hers, and the
instrument says so in her own room (veto row 51).

**One home per fact.** `contracts.deposit_pct` is the deposit; `clients.phone` is the number;
`users.phone` is the vendor's; `renderContract` is the only caller of the renderer.

---

## 4 · WHAT IS OWED — SITTING 2 INHERITS THESE

### (a) THE PROFILE SHEET — the largest gap

**Q1–Q10 are drawn, vetoed and unbuilt.** Twenty-eight labels across six sections, every one a
PROFILE token of F-40.94's 132.

**Every `__________` on the signed agreement is one of them** — the signatory's name, what the
business does, the exclusions, the meals line, the cancellation slab, the delivery terms, the credit
role. The instrument is correct in substance and blank in policy, and it will stay blank until this
sheet has a surface. `GET`/`POST /api/v2/vendor/contracts/profile/fields` ship with **no pwa
caller** — a declared server-side orphan, named so it is not discovered as a defect.

### (b) F-40.196 · CLAUSE 12'S WHATSAPP COPY

Clause 12 promises *both of us get that PDF on WhatsApp.* Unbuilt. The couple's copy is a ten-minute
signed link on the done screen; the vendor's is `Download the signed copy`, which is permanent.
**The instrument runs ahead of the product and this is where.** A ninth template and its own veto.

### (c) F-40.197 · ESCAPED UNICODE ON A VENDOR'S SCREEN

Six sites in `screen.tsx` carry `\u2014` and `\u00b7` as escapes inside `.tsx` strings, where nothing
interprets them. A vendor is reading **`She pays you directly \u2014 UPI or bank`**. Introduced by
patching through Python; the escape survived into the source instead of becoming the character.
Cheap, and visible.

### (d) F-40.198 · PROMOTE-ON-PICK DEDUPS ON AN EDITABLE FIELD

`resolveOrCreateClient` minted a **second** `Slide Test 1` beside the existing one, then the save
409'd on `PHONE_COLLISION`. The dedup key is **phone**; the first row's phone had been changed, so
the binder's number matched nothing and a new client was created.

**This is R-G32.17's blind spot, not a defect in its implementation.** Phone is the right key when
it is stable and the wrong key when a vendor can retype it. The options are different products, not
different lines: match on binder id as well as phone; warn on a name collision; or accept duplicates
and offer a merge. **Held for a ruling.**

### (e) TYPOGRAPHY — the founder's note

*The words in the contract read funny in terms of how they look.* The v4 seat's, under R-40.88–.90.
Substance is right; setting is not.

### (f) SMALLER

- **`R4-start`** is an eleventh frame the charter did not ask for; it lives by R-G32.16.
- **`Mark Signed`** is refused on composed contracts and kept for uploaded ones (R-G32.14).
- **`CONTRACT_SIGN_SEND_ENABLED` stays SET** — R-40.94. The build-dark law's conditions are
  discharged and the Beta mark is on every masthead.

---

## 5 · WHAT THIS SEAT GOT WRONG

Recorded in full because the pattern matters more than any single instance.

**F-40.162 — a precedent's mechanism taken without its lesson. Five specimens, all mine:**

1. **`whatsapp_number`** — a column written from what a vendors table *ought* to have, by the file
   that cites the SQL-provenance law twelve lines above. It errored, the read was destructured
   without an error check, and a lawyer-passed agreement printed four pages addressed from **`Your
   Vendor`** with nine blank fields. **And the first cure was a second fabrication** — `phone`, also
   not on that table. R-40.80's cell, written in the same hour, caught it before it shipped.
2. **The signed URL without the naming** — `getDownloadUrl`'s mechanism taken, `INVOICE-05.pdf`'s
   naming left, so a vendor's Downloads folder received a uuid.
3. **`/clients/:vendorId/:clientId`** — pattern-matched from the list door on the same router; the
   patch door is `/clients/:clientId`.
4. **`toE164` unimported** — `src/lib/phone.js`'s own header says it was hoisted so nobody would
   write a fourth copy. Six files import it; the sign door didn't, and Meta answered **200 with a
   wamid** to a number with no country code.
5. **The digest printed from the column it was compared against** — a check that could not fail,
   written into the acceptance card by the seat the card was meant to test.

**F-40.122 and F-40.139 — building where a fork belonged.** The masthead was invented rather than
derived, in a delivery whose first law is mock-first; the client picker was built with no ratified
frame, and its unratified `Loading…` turned out to be a lie. **A frame costs an hour. An unratified
surface cost most of a sitting.**

**A false premise given to the chair.** Five reddened benches were reported as toy fixtures. **Four
were not** — the guard had been placed in `normalizeTo`, which has eight non-send callers. The
benches were right; the warrant was granted on my error. Moving the guard to `postMessage` turned
four green untouched.

**Two vacuous cells and two badly chosen mutations**, each caught by driving rather than reading.
**And a mutation harness that counted only FAIL lines** — a crash read as zero red for most of the
sitting.

**A destructive `git checkout`** on an uncommitted file, which wiped a sitting's work.

---

## 6 · WHAT SITTING 2 SHOULD KNOW BEFORE IT STARTS

**The benches cannot see the database.** `b56` drives an in-memory double that answers any column
asked of it. R-40.80's cell — reading `PUBLIC_SCHEMA.md` and asserting every selected name — is the
only thing standing between a fabricated column and a document a couple would sign. **It asserts the
ladder tip it reads against**, because the snapshot went stale within hours of the ruling.

**The renderer is not byte-deterministic.** Exactly 54 bytes differ between two renders of identical
input: pdfkit's random `/ID` and the `/Info` date. **`document_sha256` is checkable against the
stored `.agreed.pdf` and NOT against a re-render.** A future seat that tries to verify by
re-rendering will get a mismatch and conclude, wrongly, that the seal is broken.

**Every send now logs its recipient and wamid** (R-40.92) and refuses non-E.164 at `postMessage`
(R-40.91). A send with no trace cannot be walked — that lesson cost an hour of this sitting.

**The founder card's checks must be written to fail** (R-40.93). Each names an independent witness —
a recomputation, a second SELECT, a different door — never a value compared to its own source.

---

## 7 · THE STANDING STATE

| | |
|---|---|
| Meta | `tdw_contract_sign` **Active** (Utility) · `tdw_contract_sign_otp` **Active** (Authentication) |
| Flag | `CONTRACT_SIGN_SEND_ENABLED` **set** — R-40.94 |
| Hub | Contracts & deposits **Open** — fourth of nine |
| Schema | `0138` applied; `PUBLIC_SCHEMA.md` regenerated at `5b3f61f`, now trailing `0140` |
| Live witness | **No longer owed.** Every claim in this arc has been seen working on production |

**Sitting 2 opens on v4's frames.** The profile sheet is the work that makes the instrument whole;
everything else on this list is smaller than it.
