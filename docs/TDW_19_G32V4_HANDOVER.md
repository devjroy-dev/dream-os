# TDW_19 · G3.2-pre v4 — HANDOVER

**Seat:** CE-40 · G3.2-pre v4 · Fable-Desk, docs and frames only · 2026-09-06 → 2026-09-07
**Landed:** `dream-os @ d15dd08` · `dreamos-pwa @ 5a99eab`
**Opened at:** `dream-os 95deda5` / `dreamos-pwa bb9a270`; re-pinned once to `85bdac1` / `d4c7efc` after the lane packets, **re-derived rather than re-stamped.**
**Governed by:** R-40.90 (the kickoff) · **R-40.106 (the lawyer's yes on v4)** · the nine forks ruled 2026-09-06 · the veto of 2026-09-06 · R-40.88 · R-40.73 · R-40.43.

---

## 1 · WHAT LANDED

| Artefact | Home | Verified on glass |
|---|---|---|
| **v4, the instrument** | `dream-os docs/specs/TDW_19_CONTRACT_GENERIC_v4.md` | census `168` |
| **The register, re-derived** | `dream-os docs/specs/TDW_19_CONTRACT_FIELD_REGISTER_v2.md` | `NULL` rows `5` |
| **The paper and the tailoring surface** | `dreamos-pwa docs/mocks/contract-document-mock.html` | 9 frames, **19 shots** |
| **The veto sheet** | `dreamos-pwa docs/mocks/G32V4_VETO_SHEET.md` | 43 rows, all YES |

`TDW_19_CONTRACT_GENERIC_v1.md`, `v3` and `FIELD_REGISTER_v1.md` are **unchanged by this arc** — derived, not assumed: their last commit is `5e5c230`, R-40.46's own dating, which predates this seat.

**Two findings were minted by the chair on this seat's read-first and are cured in these bytes, not in code:** **F-40.189** (the ratified paper frames were drawn in px at 0.75 of the renderer's pt) is closed by the redraw; **F-40.190** (the annexes never render) is set out in the instrument and drawn at `P3-annex`, and **its cure in code is sitting 2's**.

---

## 2 · THE STANDING LAW THIS SEAT CHANGED

**R-40.88 supersedes ratified veto row 23.** v3's renderer printed `__________` for every unset token and row 23 had ratified exactly that sentence. The register now carries an **Omission** column on every token, with three classes and no fourth: **REQUIRED** (Send refuses, Preview highlights), **OMIT** (the clause is absent), **OMIT-ROW** (the row is absent and the table is not padded). No `N/A`, no zero rate, no greyed dash, no blank rule.

A later seat reading row 23 in `G32_VETO_SHEET.md` will find a ratified byte that no longer governs. **That is why the supersession is written into the register's §0 rather than left to be inferred from a newer file's existence.**

---

## 3 · WHAT SITTING 2 INHERITS, AND WHAT IT MUST NOT RE-DERIVE

**Already derived — do not spend a cell on these:**

- **The faces exist and `lnum` is in them.** `fontTools` census over the base64 in `contract-document-mock.html`: `GSUB calt ccmp dnom frac liga lnum locl numr tnum`. pdfkit reaches it through `doc.text(…, { features: ['lnum','tnum'] })`. **The ruling's DM Sans fallback is not needed.** dream-os ships no font file today (census at `85bdac1`, zero); sitting 2 ships Cormorant Garamond 500 and DM Sans 400/500 and registers them.
- **The paper's geometry.** A4, margins `{top:50,bottom:50,left:60,right:60}` pt, identical to `invoicePdf.js:35` and to `contractPdf.js`. The mock is declared in pt, so **a size in the frame is the number that goes into `doc.fontSize()`.**
- **The invoice numbering mechanism**, at `invoices.js:75–91`. The part worth copying is that the counter increments **in the UPDATE** and the number is read from **Postgres's answer** — a read-then-increment is two statements with a gap, and the gap is where two agreements get one number.
- **The category domain**, from the founder's production read of 2026-09-07: `makeup 21 · photography 4 · NULL 2 · jewellery 1 · planning 1`.

**Owed to the build, and each is a decision rather than a task:**

| Owed | Where it is specified |
|---|---|
| The renderer redesigned to the ratified paper, faces embedded | `P1`–`P4`, `P4-sign-unsigned` · veto sheet §1, §6 |
| **The annex pages** — F-40.190's cure in code | v4's annexes A–G · `P3-annex` |
| The clause list, the annex chooser, *What the Client will receive* | `T1`, `T2`, **`T2-unmapped`**, `T3` · veto rows 16–43 |
| The profile sheet — the PROFILE tokens' first surface | ratified `R4-profile`, rows Q1–Q10 |
| Send refusing on required fields, **with no control to press** | register Omission column · veto row 41 |
| `contracts.number` and the vendor pair | register §9A |
| The category → annex map in **one** dream-os home, served to the room | register §9 |

---

## 4 · WHAT IS STILL OPEN, STATED RATHER THAN CLOSED QUIETLY

**Two sub-details of the reference ruling.** The vetoed string `DEV440/2026/0007` carries a year; the invoice mechanism has none and never resets. **(a)** Does the counter reset yearly? If not, the first agreement of 2027 reads `DEV440/2027/0012` — a string shaped like a year sequence that is not one. **(b)** Padding is 4 here and 2 on invoices. Both are named in register §9A and veto sheet §7.

**One candidate finding, recorded and not minted.** The ratified invoice frames print `TDW/2026/0041`. The mechanism at `invoices.js:75–91` **cannot produce that string** — it produces `TDW/DEV440/01`. The founder has been reading an invoice reference in a shape the generator does not emit. **This seat does not self-mint a finding number.** Chair to allocate or to rule it a mock's licence.

**Two frames drawn and cut from `T1`.** `A named professional` and `Portfolio use` are real optional clauses with no home on the tailoring surface; the list ran past the fold and a ratified frame that scrolls is a frame whose decision cannot be seen. Either they join the list and something else goes, or the list scrolls. Veto sheet §2.

**`T3` lists two required fields; the register names six.** Parties, functions and dates, fee, deposit, delivery period and the signatory are all REQUIRED at Send. The frame shows the two a real composer most often lacks. Whether the surface should list all six is on the sheet at §4.

**The modal case is not the one drawn.** `makeup` is 21 of 29 and the frames draw a photographer attaching Annex A (4 of 29). No byte changes; it is recorded so nobody later infers a priority from a mock's choice of example.

**`PUBLIC_SCHEMA.md` is stale** for `public.vendors` at ladder `0140`, and describes neither `0139`'s nor `0141`'s tables. `OUT_OF_ORDER.json`'s register is empty, so the arithmetic test is the whole test. The cure is the PAIR regen, not an edit.

**No migration number is allocated by this seat.** `0142` is the arithmetic next-free at `d15dd08`; **R-40.44 gives allocation to the chair**, and G5.1 s2 may take it.

---

## 5 · TWO THINGS THIS SEAT GOT WRONG, KEPT ON RECORD

**It computed a witness line instead of reading one.** Mid-derivation this seat read `public.vendors` as a 57-column table described at 49 and began writing it up as a defect. It is not one: **Postgres does not renumber after `DROP COLUMN`**, so printed ordinals carry permanent gaps — 8 of 79 tables, four of them cited by this register — and every header count matches its printed rows. The rule is in the register's §0: **cite by reading the line, never by computing it.** A second seat would have filed the finding.

**It drew a surface for the mapped case only.** `T2-annexes` splits into two sections, and the founder's census then returned `NULL` on 2 of 29 rows — a vendor whose trade is not on file would have met an empty heading under a section head, which is F-40.138's shape wearing different chrome. `T2-unmapped` was added after the veto. **The census was always the gate; the frame should have been drawn against both branches of the rule this seat itself wrote.**

---

## 6 · THE CHAIN

Read-first (`95deda5`) → nine forks ruled → outline → full draft → founder veto, 43 rows → **R-40.106, the lawyer's yes** → re-pin to `85bdac1`/`d4c7efc`, every moved citation re-derived → the founder's category SELECT → rider 1, `T2-unmapped` and the map completed → applied, verified on glass, pushed at `d15dd08` / `5a99eab`.

**Zero product bytes at every step.** Both clones read-only throughout; `git status --short` empty at each close. Every census, sweep and shot was run by command, and the two that came back against this seat are in §5 rather than absent.
