# TDW_19 · G3.2 — CONTRACTS & DEPOSITS · dream-os HALF · HANDOVER

**Seat:** CE-40 · G3.2 · LE · 2026-09-06
**Base:** `dream-os 3efa47c`, sibling `dreamos-pwa 6d014ea` (mock banked) → `1fe47b0` (G5.1 pwa).
**Rulings carried:** R-G32.1 – .16 · R-40.37 · R-40.42 · R-40.43 · R-40.46 · R-40.51 · R-40.55 ·
c-40.27 · c-40.29 · F-40.99 (widened) · F-40.112.
**Frames of record:** `docs/mocks/contracts-mock.html@6d014ea+rider`, `S3-paper-first` and
`S3-paper-sign`. **Veto sheet:** `docs/mocks/G32_VETO_SHEET.md`, 72 rows + T1, vetoed
2026-09-06 with R-40.51 on #15 and the chair's rewording of #64.

---

## 1 · WHAT SHIPPED

**Twelve files.** Four edited, six new, one migration, one manifest, this handover.

| File | What it is |
|---|---|
| `db/migrations/0138_contract_fill_and_sign.sql` | **FOUNDER-RUN, BEFORE THE ZIP.** `contract_profiles`, `contract_signatures`, five columns on `contracts` |
| `src/lib/contractPdf.js` | **NEW.** The pure v3 renderer. No DB handle, no DB read, one call site |
| `src/lib/vendor/contractSource.js` | **NEW.** The typed READ home + `renderContract`, the renderer's only caller |
| `src/lib/vendor/dateLock.js` | **NEW.** R-G32.1's derivation, exported once |
| `src/api/sign.js` | **NEW.** The couple's public leaf: `GET /:token`, `/document`, `POST /code`, `/sign` |
| `src/lib/vendor/contracts.js` | F-40.112's cure + eight writers, one per fact |
| `src/api/vendor/contracts.js` | compose · fill · preview · send-to-couple · deposit · profile |
| `src/lib/templates.js` | `contract_sign` (dark) + `contract_sign_otp` (key, R-G32.9) |
| `src/api/router.js` | one line: `/sign` mounted outside `/vendor` |
| `scripts/b56_contract_bench.js` | **NEW.** 99 cells, six mutations both ways |
| `scripts/floor-manifest-g32-dreamos.txt` | the dirty set and the floor |

---

## 2 · THE SHAPE, IN ONE PARAGRAPH EACH

**Fill.** `composeContract` makes a contract from a client (+ event, + invoice) and offers
**30% editable** (R-40.37) — offered by the composer, *never* a database default, because a
default would be TDW authoring a number in an instrument whose one law is that TDW authors
none. `saveContractFill` writes `terms`, `annexes` and `deposit_pct` and **refuses on a signed
contract**: the sealed PDF carries a digest of the bytes she agreed to, and a later edit would
make that digest a claim about a document that no longer exists.

**Render.** `generateContractPdf` is **pure** — it takes no `supabase`, opens no table, and
computes no money. It has **one call site**, which `generateInvoicePdf` does not (three), and
b56 §5 greps the tree and reds at two. The seal block prints **only on a verified signing**;
an unverified one is a code sent and not entered, and b56 asserts the unsigned and in-flight
renders are byte-identical in length. A4 at `{50,50,60,60}` pt — `invoicePdf.js:35`'s own
geometry, which is what the 794×1123 frames are drawn at. **Four pages** on the fixture.

**Send + sign.** `openSigning` mints the token and flips to `sent` — **and mints no code**,
because clause 12 says she reads it, taps *I agree*, and *then* a password reaches her.
`POST /sign/:token/code` is that tap. `verifySignCode` writes `verified_at`, spends the token
(sets it NULL), and **does not reset the attempt count on a correct answer** — 0136's own rule
about the last-four counter. Then: render → SHA-256 → `contracts` bucket at
`<vendor>/<contract>.signed.pdf` → `setSealedPath` → `state='signed'`. **In that order**, so
the seal on the page and the hash in the record describe the same bytes.

**Deposit + lock.** `markDepositReceived` is the only writer, **vendor-marked only**, and
refuses on anything but a signed contract. `events.state` is **not widened** and `public.events`
gains **no column and takes no write** — a locked date is an upcoming event whose contract
carries `deposit_received_at`, derived once in `dateLock.js`. `occupancy.js`'s own header warns
that unifying two of the five lists in that neighbourhood is the F-04.36 regression *and that
it has already happened once*; ten calendar readers each re-deriving this would be that same
mistake in a new coat.

---

## 3 · THE FINDING REGISTER — the pocket, spent

The chair issued F-40.114–.118 as this seat's pocket. All five are used:

| # | What | State |
|---|---|---|
| **F-40.114** | `otp_sessions` PK is `phone` — a couple mid-login and mid-signing overwrite one another's code, silently | **CURED by design.** R-G32.10: the witness lives on the `contract_signatures` row, bound to one contract. No CHECK widened, collision cannot arise. Cited in `0138`, `contracts.js`, `sign.js` |
| **F-40.115** | The list door hid cancelled contracts, which the four-state room needs | **CURED.** `include_cancelled=1` relaxes it *behind a param*; every existing caller keeps the old shape |
| **F-40.116** | The room prints `{c.state}` raw, so it says `draft` while the invoice document says `Unpaid` | **OPEN — pwa half.** Veto rows 1–4 are the cure; it is a `screen.tsx` byte and rides the pwa ZIP |
| **F-40.117** | A client promoted without a lead reaches no events, so clause 3's table is empty | **DECLARED, not cured.** `events` has no `client_id`; the only path is `leads.client_id → events.linked_lead_id`. The composer's answer is typed rows in `terms`; the renderer's is a sentence instead of an empty grid. b56 §8 asserts the empty case |
| **F-40.118** | T1 opened on `{{1}}`; Meta refuses a leading variable (F-40.91) | **CLOSED by R-40.55.** See §5 |

**The masthead fabrication takes F-40.122** (`.119` is G5.1's, and the pocket is spent).
It is a **pwa-side** defect in `docs/mocks/contracts-mock.html`, cured in the rider that
rides the pwa ZIP; it is registered here because this handover is where the arc's findings
are read, and a finding filed only in the repo that carries it is a finding a chair misses.

---

## 4 · WHAT THE SEAT GOT WRONG, RECORDED

**Two, both caught, neither smoothed.**

**(a) The masthead — F-40.122.** The mock's shell CSS was lifted from
`books-register-mock.html` and its **contents were then invented**: a four-seat nav reading
`Today · Business · Diary · Studio`, the estate's name replaced by the room's, the room's by
the vendor's, and a **count** in the medallion. The tree says two seats (`Rooms`, `Today`;
R-37.64 — *there is no third*), `The Dream Wedding`, the room name plus the beta mark, and
**derived initials** (R-37.79). **The correct answer was inside the file being copied from**
— it renders `Rooms`/`Today`/`The Dream Wedding`/`Books`/`DR`. The seat read its stylesheet
and skipped its markup. That is the F-04.71 costume class on a ratified surface. Found by the
founder on the glass, inside the hour; re-derived from `WorklistShell.tsx:139-196` and
`copy.ts:113-114`, with the `wl-lblrow`/`wl-beta` rules lifted verbatim from
`flip-beta-mock.html`. **The 72 vetoes stand whole** — every one is a string, none is chrome.

**(b) Two vacuous cells.** b56 §6's count cell asserted `=== 1` after *one* wrong answer,
which a mutation setting `next = 1` satisfied; §6b had no expiry cell at all. Both were caught
by **driving** the mutations, not by reading the assertions. A second wrong answer and a whole
§6b are what catch them now.

**(c) A destructive revert.** `git checkout src/lib/vendor/contracts.js` was used to undo a
mutation on an **uncommitted** file and wiped the sitting's work on it. Rebuilt from the patch;
every later mutation reverted by restoring a saved string, never by git. Not a finding against
the estate — a note against this seat's method, kept because the next seat will be tempted the
same way.

---

## 5 · T1, AND WHY THE RED WAS CARRIED

The chair vetoed T1 as proposed. It opened on `{{1}}`, and **Meta refuses that** — the founder
hit the wall in the Manager on 2026-09-05 with `wedding_credit`, and `b53_g11_wedding_pages_bench`
has held a registry-wide cell for it ever since. The moment the entry landed, **b53 reddened**
— a sibling's bench, on this seat's work, correctly.

**The seat did not silently re-author a vetoed byte.** F-40.118 was filed, the red was carried
into the floor loudly, the candidate rode the message, and the founder re-vetoed under
**R-40.55**. c-40.29 is the chair's own note that the veto was given against a rule the estate
already had a bench for.

The body now in the registry is **R-40.55's, verbatim**, and it is what the founder files with
Meta — the registry and the Manager must never hold different words under one template name.
b56 §10 asserts the rule a second time, in this seat's own bench, so a body added here reds here.

---

## 6 · THE FOUNDER'S STEPS

**1 · SQL first, in the Supabase editor, before the ZIP is applied.** Paste
`db/migrations/0138_contract_fill_and_sign.sql` whole; it runs in one transaction and returns
no result set. Then the witness SELECT at the foot of the file, **in its own paste block**
(R-40.31 — the editor shows only the last result).

**2 · Apply the ZIP**, then the git line as its own paste block. Named files only.

**3 · Submit the eighth template** from WhatsApp Manager on Direct `1739793260373677`:
name `tdw_contract_sign`, category **Utility**, language as the registry's, three variables
(`owner`, `functions`, `link`), body **exactly R-40.55's bytes** from
`src/lib/templates.js`. When Meta returns Approved, flip `status: 'draft'` → `'approved'`
in that one field. **The send stays shut** until `CONTRACT_SIGN_SEND_ENABLED=1` — two gates,
neither alone opens it.

**4 · Submit `tdw_contract_sign_otp`** (Authentication, one `code` variable, Meta's preset
body) in parallel. Until it returns, `contract_sign_otp` points at the already-approved
`tdw_vendor_login_otp`, **so the walk runs today with no new Meta dependency**. On approval,
change that one `name` and nothing else (R-G32.9).

**5 · The walk is the pwa half's.** Nothing here is walkable on glass alone.

---

## 7 · THE FLOOR

```
THIS TREE    GREEN 110  RED 49  TOTAL 159
NAMED BASE   GREEN 109  RED 49  TOTAL 158    (3efa47c, work stashed -u)
DELTA        ZERO
```

49 RED at both trees, inherited, file for file. b56 **99/99** with six production mutations
proven both ways. The full derivation, including the two benches that reddened before R-40.55
and the two cells that were vacuous before they were driven, is in
`scripts/floor-manifest-g32-dreamos.txt`.

**LIVE WITNESS: OWED.** Not one byte of this delivery has been seen on production. Every claim
above is a claim about code and a bench, and the founder's card is what turns it into a claim
about the product.

**PAIR REGEN: OWED.** `PUBLIC_SCHEMA.md` sits at `d91ec6e`, ladder `0132`, and is now stale by
**five** — `0133`–`0136` (F-40.99 as widened) plus `0138`. `contractSource.js` carries the
standing note that its 0138 column citations are witnessed by the migration and not yet by the
snapshot, exactly as `invoicePdfSource` carries it for 0130's four.

---

## 8 · WHAT THE pwa HALF OWES

- The room: the four-state list with cancelled at the foot (**F-40.116**'s cure), the deposit
  line beside the chip, the `New contract` fork.
- The record: the composer, the preview, the send, the signature panel with **F12's refusal
  line**, the deposit line.
- `app/sign/[token]/` on the `lib/public/token.ts` constitution — **terminal**, unlike
  `/consent/`.
- The mock rider: **F-40.122**'s cure (re-derived masthead, 11 frames, 20 shots re-cut) and
  the two vetoed rewordings (**R-40.51** on #15, the chair's on #64) into the ratified frame,
  so *match the mock@hash* stays true.
- The hub row flip — G5.1's hub landed at `1fe47b0`, so it rides with the pwa ZIP rather than
  waiting for a rider.
- `next build`, and the floor by SET.

**Sequencing beyond this is the founder's.**
