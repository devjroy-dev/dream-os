# TDW · BLOCK 19 · G3.2 SITTING 2 — HANDOVER (dream-os half)

**Derived at `6e590ec`.** Two packets, both applied, pushed and verified at origin:
`8d4b591` (packet 1) and `6e590ec` (packet 2). Migrations `0143` and `0145` founder-run
and verified by predicate. `tdw_contract_copy` **Active · Utility · English · ID
1108780808723101**, Header · Document confirmed on the detail page.

**Nothing sends.** `CONTRACT_COPY_SEND_ENABLED` is unset in every environment and
`CONTRACT_SIGN_SEND_ENABLED` is unchanged. Two gates, and the founder card is what
opens the first.

**The pwa half is a separate seat's**, opened on this sitting's read-first rulings. Nothing
in this document is a claim about it.

---

## 1 · WHAT LANDED

**The instrument.** `contractPdf.js` rebuilt whole to `TDW_19_CONTRACT_GENERIC_v4.md`
(R-40.106, the lawyer's yes) at the geometry of `contract-document-mock.html`. v4 re-voiced
every clause — v3's *we/you* became **the Vendor** and **the Client**, one party comprising
two persons — so not one sentence of the v3 renderer survived. Sixteen clauses and seven
annex pages transcribed verbatim, 168 tokens, sixteen omission classes each read off its own
margin note.

**The annex pages exist for the first time** (F-40.190). The old renderer named its annexes
at clause 2.1 and printed none of them, so a couple could not find what was included in her
own agreement. Each attached annex is now its own titled page with its own letterhead and its
own lettered numbering.

**`BLANK` is retired** (R-40.88). It printed `__________` for an unset field, which put the
product's plumbing into a couple's hand. The replacement is structural rather than 168
conditionals: a tagged template `f` returns `null` when any interpolated value is missing and
`sub(null)` draws nothing, **so there is no code path that renders a sentence with a missing
field**. An underscore cannot leave because the sentence does not exist.

**Gate, then switch — and the order is the ruling.** A clause prints when its GATE is open,
its SWITCH is not off, and its fields are present. The gate is a fact; the switch is the
vendor's. **A switch may close an open gate and can never open a shut one.** Clause 5 is the
specimen: an in-city wedding prints no accommodation clause whatever `clauses.accommodation`
says, and that was witnessed on bytes — a render with the switch explicitly `true` and every
function in the vendor's own city contains no clause 5.

**Clause 10 has no switch and must never gain one.** v4: *a Vendor's toggle governs whether a
clause is printed, never whether the Client's consent is on.* `b56` §2c reds on a mutation
that adds `publication` to `CLAUSE_SWITCHES` or wraps 10.5 in `switchOn`.

**The reference.** `contracts.number`, `DEV440/2026/0001`, allocated in `composeContract`,
padding 4, no yearly reset. Chrome, not an instrument field — it appears in the title block
and in no clause, and is not among v4's 168 tokens.

**Clause 16.2's promise, built.** `contractSend.js` sends the sealed PDF to both parties as a
DOCUMENT header on `tdw_contract_copy`; a row per party per outcome into `contract_sends`;
`relayStatus.js` gains its fourth home. Sitting 1's own comment said *this sitting does not
build that*, and now it does.

**Also:** F-40.222's `clients.js` half (`.is('deleted_at', null)` — `.eq` matches no row
against NULL and would fail as a flood of duplicates rather than an error); F-40.170's two
files were reported and belong to the pwa seat; F-40.199 narrowed from six sites to one.

---

## 2 · THE FONT SAGA — F-40.232 AND F-40.233, ONE ROOT CAUSE

**The root cause is fontkit's woff2 transform.** The mock embeds its faces as woff2; fontkit
reads woff2's transformed `glyf`/`loca` and pdfkit's subsetter re-encodes from that in-memory
table. That path produced both failures, and it took three attempts to see it.

**Symptom one (F-40.232).** Packet 1 certified three faces on a probe that ran `registerFont`,
`text` and `widthOfString` and **stopped one call before `doc.end()`** — which is where
subsetting and embedding happen. Forty DM Sans codepoints threw there: a hyphen, a semicolon,
every accented letter. `("the Vendor");` appears in clause 1.1. Every agreement would have
failed outright at embed.

**The first cure treated a symptom.** Decomposing DM Sans's 75 composite glyphs cleared it,
because composites are what the transform mangles worst — and left the disease in the face
that was not decomposed.

**Symptom two (F-40.233).** Cormorant threw nothing, embedded cleanly, produced bytes, and
**drew nothing.** `pdftoppm` and PyMuPDF independently found zero dark pixels; the letterhead
of every agreement would have been invisible. **The census that certified it asserted a
non-empty buffer, and a PDF whose glyphs are blank still has bytes.**

**The cure.** All three faces ship as plain decompressed `.ttf` (`TTFont(woff2); flavor =
None`), composites intact, no decomposition — the fewest transformations between the face the
founder ratified and the file that ships. Metrics identical to the mock's own blocks to the
unit: `761 520 332 489 234` (Cormorant), `681 574 312 608 266` (DM Sans 400), `691 587 328
616 256` (DM Sans 500), advances of `H n 1 8 space`.

**Why not instance from upstream.** Pinning `opsz=9, wght=400/500` off the current `google/fonts`
variable font gives `685 578 342 604 269` — the digit **one is 30/1000 em wider** than the
face the frames were shot with. Arm (1) would have shipped a font the founder never ratified,
and the advance-width table is why it was refused.

### R-40.112, final wording — the standing instrument

> A font census asserts OUTLINES from the embedded font and INK from a rasteriser; a green
> NAMES WHICH OF THE TWO IT MEASURED.

`scripts/b60_fonts_bench.js`. Two arms, neither sufficient alone:

- **Outlines** — extracts the embedded `FontFile2` from the generated PDF and asks **fontkit,
  pdfkit's own embedder**, whether every glyph in the subset carries path commands. Not a
  proxy the way bytes-nonempty was: it reads the bytes that reach the page. Pure node.
- **Pixels** — rasterises and counts dark pixels. The couple's view, which no derivation
  substitutes for. Needs poppler, which this repo carries no manifest for.

`FLOOR GREEN` requires both and is asserted under `--check`. A container without poppler
reports `arms run: outlines only (pixels SKIPPED — no rasteriser)` and **FLOOR RED** — a
declared partial, never a green that means less than it says. That fired on the founder's
Codespace, poppler was installed, and the floor was taken there.

**Three further rules the sitting bought the hard way:**

1. **The cell is async.** `doc.end()` emits on the next tick; a synchronous `Buffer.concat`
   measures nothing and reds *everything*, including a face already proved clean. The first
   version of the census did exactly that — F-40.232's shape inverted.
2. **The census reads the directory, not a list.** A hand-kept list is a second home for the
   census, and the face that breaks production is the one somebody added without adding it to
   the list. Driven: dropping the broken woff2 back into `src/assets/fonts/` enrolled itself
   and red at 52/226 outlines and 8/230 pixels.
3. **§0 — the pixel counter proves itself on a blank page before it may speak.** This is the
   third instance of the same error and it was caught by the bench's own mutation in minutes.
   v1 counted PNG **filter bytes** (values 0–4) as ink: a blank page read 21,657 dark pixels.
   v2 skipped the filter byte and stepped by channel and still read **7,199**, because poppler
   emits filters 1 (Sub) and 2 (Up) — the bytes are *deltas from a neighbour*, and a white run
   under Sub is all zeroes. Both times the arm passed a face proved twice to draw nothing. The
   fix was to stop decoding PNG: `pdftoppm -gray` without `-png` writes raw PGM — five header
   tokens, one byte per pixel, no compression, no filters. **There is nothing left to decode
   incorrectly.** §0 now asserts `a SPACE reads exactly zero dark pixels` before any face is
   judged.

**The sentence for the record:** F-40.232 and F-40.233 had one root cause — fontkit's woff2
transform — and two symptoms; the first cure treated a symptom and the census that certified
it measured bytes, not ink.

**And the shape of the error, three times from one direction:** asserting the step *before*
the one that matters. Registration before embedding; bytes before ink; an easy count before
the count that means ink. Each time the assertion was the strongest one visible from where I
stood, and each time the thing that mattered was one step further on.

---

## 3 · THE FOLIO PROOF

`Page n of M`, on all four render cases, asserted **both directions**: the stamped total
against the buffer's real page count, *and* the per-page `n` sequence, so a page stamped twice
or skipped is caught.

```
agreed    real=8  totals=[8]  sequence 1..8   OK
unsigned  real=9  totals=[9]  sequence 1..9   OK
sealed    real=9  totals=[9]  sequence 1..9   OK
in-city   real=8  totals=[8]  sequence 1..8   OK
```

**The mutation was driven, not reasoned about.** Moving `stampFolios` above the annex loop and
re-rendering:

```
mutant-sealed  real=9  stamped_totals=[8]  stamped_pages=8  OK=False
mutant-agreed  real=8  stamped_totals=[7]  stamped_pages=7  OK=False
```

— the pre-annex count stamped, and one page carrying no folio at all. Exactly the bug the
cell guards.

**The folio sits inside the padding box.** `.pg-foot` carries `margin-top: auto` in a column
flex container, so it lands on the padding box's bottom edge — 791.89pt. Measured on `P4-sign`
and `P3-annex`, whose footer ink reads 785.25–791.25pt. The first build drew it at 805.89 and
its ink ran to 813.75, twenty-two points into the margin. *(`P1-first`'s mock footer reads
805.50–811.50 instead — that frame's content overflows the page in the browser and pushes the
footer past the box, so the two frames that fit are the ones that state the rule. Recorded
because a reader comparing to P1 alone would think the line wrong.)*

**Geometry against the frames, by number:**

| | mock ink rows | render | cols (both) |
|---|---|---|---|
| `P1-first` | 51.00–811.50\* | 51.00–791.25 | 60.00–534.75 |
| `P4-sign` | 51.00–791.25 | 57.75–791.25 | 60.00–534.75 |
| `P3-annex` | 51.00–791.25 | 51.00–791.25 | 60.00–534.75 |

**The rhythm is the CSS box model, not accumulated `doc.y`.** The first build drifted 70pt down
the page by the gold rule because CSS `margin-top: 7pt` is measured between *box edges* while
`doc.y` sits at the top of the next *line box*. The model: `lineGap = cssLineHeight × size −
naturalLineHeight`, and CSS half-leading means the y passed in is `boxTop + gap/2` with `doc.y`
pulled back by the same half afterwards. One home — `block()` — and no caller adds a bare
number to `doc.y`.

---

## 4 · THE SEAL — F-40.234, AND c-40.49

**F-40.234.** The seal's three value lines were **authored from memory** — `On {date} at
{time}`, `By the Client, from {phone}`, `One-time password, clause 16.1` — after sixteen
clauses and seven annexes had been transcribed verbatim. The copy law broken at the *end* of a
long faithful pass, in the one block the founder read most closely. Cured to `P4-sign`'s own
bytes in the same edit.

The ratified seal is four lines and nothing else:

```
Signed electronically
<Client> · <number> · <date>, <time> IST
Confirmed by one-time password sent to that number.
<signatory>, for <business> · <vendor number>
Document fingerprint · SHA-256
```

**c-40.49.** The chair's *"of the pages before this one"* was R-G32.19's own sentence, never
vetoed onto a frame; zero matches across the mock and both veto sheets. The label **stands
alone**. Which bytes are hashed is a fact for the register and this handover — the digest is
over `.agreed.pdf`, R-G32.19 — and not for the paper: the couple reads a fingerprint, the
estate reads a definition. `b56`'s v3 pin on `PAGES BEFORE THIS ONE` is retired at the cell
with the supersession recorded there.

**Three seal states, each asserted** (`b56` §2, amended by label):

- `sealed:false` → **no block at all**. These are the bytes `document_sha256` hashes; a seal
  inside them could not describe them. Witnessed by the absence of any Courier face in the
  document.
- `sealed:true`, signature null → **labels and no values**, `P4-sign-unsigned`. A cell asserts
  a null signature never prints a digest. The Vendor's signatory line is an em-dash too — a
  populated vendor line beside two dashes would read as half-signed from across a room.
- `sealed:true`, signature set → **values**, and the digest label asserted byte for byte.

The old cell compared two buffer lengths and could not tell an empty seal from a populated
one. The amendment tightens.

---

## 5 · THE BENCHES, AND WHAT EACH ONE MEASURES

| bench | result | what it now guards |
|---|---|---|
| `b60_fonts_bench --check` | **21 GREEN 0 RED**, both arms | R-40.112; §0 proves the counter first |
| `b56_contract_bench` | **205/205** | §2a fixture render, §2b token diff, §2c clause 10, §2/§10 the three seal states |
| `b55_g2_reviews_bench` | **50 GREEN 0 RED** | amended by label: every entry declares its components |
| `b51_referrals_bench` §17 | green on `contract_sends` | G5.1's cell, taken rather than duplicated |
| `b57_g13_team_bench` | 137/137 | untouched |

**`b56` §2a exists because the bench used to pass on Helvetica.** Every render cell ran against
the v3 renderer, which named no font file — so a face that could not embed, or embedded and
drew nothing, would never have reddened there. Both font findings slipped past a green bench
for exactly that reason. §2a renders the founder-card fixture through the real faces and
asserts Cormorant and DM Sans are embedded and no standard-font fallback took the body.

**`b56` §2b — the token diff, both directions.** The set comes from the source that defines
it: v4's own `{{tokens}}`, diffed against what the renderer reaches. It turns *did I transcribe
all of v4* from an audit into a red/green. Its alias map names where each token lives; **an
entry added to silence a genuinely missing field is one line visible in this file's diff.** The
first cut of the lookup red on 22 tokens the renderer does carry — fixed by resolving the
alias, never by widening the map.

Two cells were dropped rather than satisfied: one asked for a sentence in a plane `code()` had
already stripped (a comment is where the reason belongs), and `b56`'s `ok` takes only
`(label, cond)`, so a third detail argument was silently dropped — the detail now lives in the
label, because **a cell whose evidence never prints tells a reader to go and re-derive it.**

---

## 6 · WHAT IS OWED, AND TO WHOM

**Not this seat's:**

- **F-40.228** (`reviews_asked`) and **F-40.229** (`payment_reminders`) — both orphaned from
  the receipt router and both without a partial UNIQUE on their wamid. Allocated to G2 s2 and
  G3.4 s2. `payment_reminders` is the cheap moment: its flag is dark, so it can be cured
  before it ever sends.
- **F-40.223** — the invoice PDF has never reached anyone on the Meta transport.
  `engine.js:1753`'s `attachments` ride `whatsapp.js:135–139`'s refusal
  (`meta_media_unsupported`, M1's declared gap). Block 09.
- **F-40.218** — `TDW/2026/0041` on the ratified invoice frames is un-producible by
  `invoices.js`. Block 09's invoice pass. The contract line takes the handle it was drawn
  with (`DEV440/2026/0001`) rather than inheriting the invoice prefix's `TDW/`.
- **F-40.220** — `b51`'s declared red, G5.1's.
- **The pwa half** — the profile sheet (Q1–Q10), the tailoring surface (T1's six switches now
  the list scrolls, T2's annex chooser off `GET /annex-map`, T2-unmapped, T3's checklist with
  Send absent until the six required fields are filled), F-40.199's one site at
  `screen.tsx:825`, F-40.170's two files (`routes.ts` **and** `support/page.tsx`, whose
  `ROOM_HREFS.contracts` reads `roomHref('contracts')`).

**Recorded, no action:** v4 places the annexes **after** execution — clause 16 signs the
agreement and the annexes are attached to it — so the execution block and seal land on page 8
of 9 and `P4-sign`'s `Page 9 of 9` is a mock artefact of a fixture that put the annexes first.
The signed order stands; no reorder.

**Done at this sitting's first docs touch:** the three wrong numbers in
`TDW_19_G32_S1_HANDOVER.md` corrected in place (F-40.197→.199, F-40.198→.200, R-40.94→.96)
with the correction recorded at the head; register §9A amended by label for F-40.221 — the
invoice counter's guarantee is `invoices_vendor_number_unique`, not the read-after-write.

---

## 7 · THE ARM

Two gates, and both must move:

1. **`tdw_contract_copy`** — Active at Meta. Done.
2. **`CONTRACT_COPY_SEND_ENABLED`** — unset in every environment. **This is the founder's.**

Arm it only after the card. `contractSend.js` writes **no rows** while the flag is dark: a
switched-off feature should not fill a table with evidence of nothing, and the rows that exist
should all be about real attempts.

Once armed and a contract is signed, expect **two rows** in `contract_sends` — one `vendor`,
one `client` — each carrying a wamid at `out.result.wamid`, and Meta's receipts advancing
`status` through `relayStatus.js`'s fourth home. A party with no number on file gets a row
reading `no_phone`, which is the durable evidence she was skipped for a reason rather than
missed.

---

## 8 · WHAT THIS SEAT GOT WRONG, IN FULL

1. **F-40.232** — three faces certified on a probe that stopped one call before the step that
   embeds. Shipped in packet 1 and pushed.
2. **The first font cure treated a symptom.** Decomposition cleared DM Sans and left Cormorant
   drawing nothing, because the root cause was never diagnosed before curing.
3. **F-40.233** — the census that certified it measured bytes, not ink. Two rasterisers had to
   disagree with my own bench before I looked.
4. **The census inverted.** Its first version asserted a synchronous `Buffer.concat` after an
   async `end()` and red every codepoint of a face already proved clean. A false catastrophe
   is the same disease as a false green.
5. **The pixel counter, twice.** Filter bytes counted as ink, then filter *deltas* counted as
   ink — the second after I thought I had fixed the first. Caught by the bench's own mutation,
   which is the only reason it is not in production.
6. **F-40.234** — the seal's four lines authored from memory at the end of a faithful pass.
7. **A band mislabelled.** I reported a 36.8pt letterhead drift from a band that was the ident
   line; an 8pt-tall band could never have been a 24pt title, and I should have caught it from
   the height at the time.
8. **`&&`-chained two benches in a founder-bound block**, so a floor-red on the first swallowed
   the second and the founder had no `b56` result until it was re-run.
9. **Two cells written against the wrong plane** — one demanding a comment from
   comment-stripped code, one passing a detail argument `ok` does not take.

The thread through 1, 3 and 5 is one habit: **asserting the step before the one that
matters.** It was caught three times because each cure built a stronger instrument than the
last, and the third catch came from the instrument rather than from a rasteriser or a founder
card. That is the argument for the two-arm design, and it is why §0 exists.

---

**Closed at `6e590ec`.** Sequencing beyond this sitting is the founder's.
