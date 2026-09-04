# TDW_19 · G1.1 — WEDDING PAGES · THE BUILD SITTING · HANDOVER (dream-os half)

**Seat:** LE, code-capable, one sitting.
**Base:** `dream-os` @ `d58648e`, re-derived at origin at the moment of cutting (R-38.16).
**Sibling:** `dreamos-pwa` @ `ae30180` — byte-clean and **untouched** by this delivery.
**Governing:** kickoff (CE-40, 2026-09-04) · R-40.7/.11/.12/.18/.19/.20/.21/.22/.23/.25 · R-G11.1–.22 · the ratified mock `docs/mocks/wedding-pages-mock.html` @ `ae30180`.
**Workspace:** `/home/claude/g11build/` — one sitting, fresh clones, `git status --porcelain` empty at seating, preflight CLEAR.

---

## H1 · WHAT SHIPPED

| Path | What |
|---|---|
| `db/migrations/0131_wedding_pages.sql` | the three tables — **founder-run, before the pwa apply** |
| `src/lib/cloudinarySign.js` | **new** — the one home for upload signing (R-G11.22) |
| `src/lib/season.js` | **new** — R-40.25's four words, one home |
| `src/lib/vendor/weddings.js` | **new** — sole writer for all three tables |
| `src/lib/vendor/creditInvite.js` | **new** — the dark claim send, two gates |
| `src/api/vendor/studio/weddings.js` | **new** — seven studio doors |
| `src/api/public/weddingPage.js` | **new** — the public page door |
| `src/api/credits.js` | **new** — the public claim pair |
| `scripts/b53_g11_wedding_pages_bench.js` | **new** — 62 cells + 9 mutations |
| `scripts/floor-manifest-g11-dreamos.txt` | **new** — the declared dirt |
| `src/lib/vendor/igImport.js` · `portfolio.js` · `admin/cloudinary.js` | signing delegated; **signatures unchanged** |
| `src/lib/templates.js` | the fifth template, registered `pending` |
| `src/api/router.js` · `src/api/vendor/studio/index.js` | two mount lines |

**Zero pwa bytes. Zero engine bytes. Zero soul bytes** (W-1 needs no lift here).

---

## H2 · THE DOORS

| Method | Path | Auth |
|---|---|---|
| `GET` | `/api/v2/vendor/studio/weddings` | owner |
| `GET` | `/api/v2/vendor/studio/weddings/:id` | owner |
| `POST` | `/api/v2/vendor/studio/weddings` | owner |
| `POST` | `/api/v2/vendor/studio/weddings/:id/credits` | owner |
| `POST` | `/api/v2/vendor/studio/weddings/:id/publish` | owner |
| `POST` | `/api/v2/vendor/studio/weddings/:id/upload-url` | owner |
| `POST` | `/api/v2/vendor/studio/weddings/:id/photos` | owner |
| `GET` | `/api/v2/public/wedding/:code/:slug` | **none** |
| `GET` · `POST` | `/api/v2/credits/:token` · `/claim` · `/decline` | **token only** |

---

## H3 · PROOF

`b53` — **62/62 cells GREEN**, and **9/9 mutations RED with every file restored byte-for-byte**. Every mutation edits production code, never test setup:

| Mutation | Cell it proves |
|---|---|
| slug expands `&` | the ratified addresses |
| the roll is reordered | R-40.7's order |
| a phone joins the public roll | R-G11.6 |
| the consent gate is dropped | R-G11.10 |
| the miss body differs by reason | R-G11.5 |
| the create door stops filtering `deleted_at` | F-40.33 |
| publish implies consent | R-G11.10 |
| a season band is retuned | R-40.25 |
| the dark send loses its flag gate | F-40.21 |

**Signature equivalence (R-G11.22)** was proven against an *independent transcription* of the pre-cure method over four cases, including the wedding folder that did not yet exist — all MATCH. **F-40.34 census by command: 3 `paramsToSign` sites before, 1 after.**

**Floor, by SET, under `--delivery`:** re-derived at the cut and reported in the delivery block. `b07_p4b_body_bench` was A/B'd with `0131` moved aside and back — **75/76 both ways, identical FAIL set** — rather than covered by the base, because its failing cell scans migrations and this delivery adds one.

---

## H4 · WHAT THE FOUNDER MUST DO — NUMBERED

### (A) The template submission — Meta, WhatsApp Manager

The send is **dark**. Until Meta returns Approved, the claim path is walked by pasting the claim URL by hand, and the walk card below does exactly that.

1. Open WhatsApp Manager → **Account tools → Message templates** on WABA **`1739793260373677`** ("The Dream Wedding Direct"). *Not* the other WABA.
2. **Create template**. Name: **`tdw_wedding_credit`** — lowercase, underscores, exactly as spelled.
3. Category: **Utility**. Language: **English**.
4. Body — paste exactly, four variables, typographic apostrophe in `{{3}}’s` and an em dash before *nothing*:

   `{{1}} credited you as {{2}} on {{3}}’s wedding page. Add your name to the page, or decline — nothing is published under your name until you choose.`

   then a blank line, then `{{4}}`.
5. Samples, when Meta asks: `Dev Roy Photography` · `Makeup` · `Priya & Arjun` · `https://thedreamwedding.in/credits/8f2c41a9`
6. Submit. **Do not set any env var yet.**
7. When it returns **Approved**, tell the next seat. Two things flip together: `status: 'pending'` → `'approved'` in `src/lib/templates.js` (a code change, one line, a delivery), and `WEDDING_CREDIT_SEND_ENABLED=1` in Railway. **The flag alone does not open the send, and neither does the approval alone.**

> ⚠ **F-19.07's risk, stated before submission rather than discovered after it.** Meta has reclassified a Utility template on this estate before, and F-40.12 records the review-ask template being classed MARKETING for a similar shape. This message names a specific act by a specific person and carries a decline path, which is the Utility case. If Meta returns MARKETING, that is a finding, not a defect, and it changes the pricing and the opt-out posture — not the code.

### (B) The consent flip

`couple_consent` defaults `false` and **no door in this sitting writes it** (R-G11.10). The fixture carries no couple at all — `couple_id` is NULL on all seven live DEV440 events (F-40.30) — so the page cannot serve until you flip it by hand. **That SQL is withheld behind `0131`** and ships as its own block only once `0131` is witnessed, per the conditional-withheld rule.

---

## H5 · THE FOUNDER'S CARD — you perform, the seat reads

Fixture derived by SELECT, never recalled: owner **DEV440** `Dev Roy Photography`; MUA credit **MAKEUPBYSWATIROY** — the byte is **`Make Up by Swati Roy`**, two words, *not* the mock's placeholder `Makeup by Swati Roy`; wedding **`Verma – reception`, 2026-07-31**, which renders **`Summer 2026`** (R-40.25).

1. Open **Rooms** → *Business Solutions* is the first tile, full width. *(pwa half — not this ZIP.)*
2. Tap it → nine rows, the WhatsApp door at the foot, no old rows.
3. **Wedding pages** → **+** → pick **Verma – reception**. The address derives as **`verma-reception`** and is shown dimmed, not typed.
4. Add two credits: the MUA by handle **`MAKEUPBYSWATIROY`**, and a second by **a number you choose and type yourself** — any number that is not one of the three vendor numbers. **No delivered file and no SQL holds that number** (F-40.32).
5. **Publish.** The room will say the page is waiting on the couple's permission — that is correct and expected. Run the consent-flip block, then reload.
6. Open `/v/dev440/w/verma-reception` **signed out, on a phone**. Expect: the roll in role order, the MUA linked, the typed credit unlinked and **phone-free**.
7. Open the claim URL printed for the typed credit → **Add my name** → the roll updates. Tap again: it shows the terminal state and offers no toggle (R-G11.14).

**Only your device can witness** steps 6 and 7's rendering, the gallery's composition against real frames (CE-116 clause 3 — note DEV440 has **3** approved portfolio images, so there is thin material), and whether the meta line reads well at phone size.

---

## H6 · DISCLOSURE — the errors this seat owns

- **e-1 · the fixture SELECT's first cut destroyed its own field-to-row association.** Long format keyed on `(ord, section, field)` with a *static* section string; two vendors matched and sixteen rows sorted into eight unattributable pairs. Caught by the output contradicting itself (a makeup artist with `category=photography`), not by luck. Cured by a wide-format second cut, one row per record. **The working assumption that `DROY550` *is* `makeupbyswatiroy` was wrong** — there are three vendors — which is precisely why the SELECT precedes the authoring.
- **e-2 · a hollow green, almost written down.** The first post-cure floor read `AFTER: 0 non-green` and I nearly recorded a sweep. It was a **STOP**: `run-floor.sh` refused a dirty tree and emitted zero result lines, and my `grep -c '^RED:'` counted a refusal as a clean floor. The instrument was right and the reading was the defect. Cured lawfully by F-14.16's declared-dirt manifest, not by working around the guard.
- **e-3 · the slug rule contradicted the ratified mock.** My first cut expanded `&` to ` and `, which would have shipped `priya-and-arjun` while every ratified frame draws `priya-arjun` — every address wrong on the first walk. The mock outranks the tidier rule. Now a both-ways cell.
- **F-40.36 / R-G11.23 · A BENCH WAS AMENDED IN THE SITTING WHOSE CODE REDDENED IT — read this one rather than trust it.** `bOB_taxonomy_bench` cell 6.1 went RED because four of R-40.7's ascii role keys (`makeup`, `decor`, `venue`, `mehendi`) are also vendor-taxonomy tokens. **The cell was right to red**, and only the SET comparison surfaced it — a count would have hidden it (R-38.19). Ruled arm (a): a declared exclusion on 6.1b's own precedent, argued in-file, with the no-join derivation stated. Two arms were refused and are named in-file so they are not re-proposed: prefixing the keys contorts a schema to satisfy a lint, and importing `categories.js` would assert the very conflation the bench forbids.
  **The exclusion SUBTRACTS four tokens; it does NOT exempt the file.** My first cut did exempt the file, and this delivery's own non-vacuity mutation caught within minutes that a genuine private taxonomy copy pasted into `weddings.js` then passed unseen — a loosened detector with a comment on it. Narrowed to token-subtraction, and proven able to red in **three** directions: `ROLE_KEYS` drifting from `0131`'s CHECK, a role/category join added to the public door, and a real private copy. All restored byte-for-byte.
  **Filed, not fixed:** the pre-existing bride-namespace exclusion at `:243` has the same file-exempt shape mine started with. I did not touch it — it is not this sitting's, and narrowing it is a change to an instrument on someone else's charter.
- **e-4 · two `b53` cells were wrong about the tree, and the tree was right.** One regex demanded single-space DDL where the file is column-aligned; one storage cell read the claim lane's own comment *forbidding* storage and reported the prohibition as a breach. Both cured in the cells. The mutation harness also caught a mutation site with the wrong indent and **refused to edit rather than silently matching nothing** — which is the guard working.

---

## H7 · OPEN, HANDED FORWARD

- **F-40.28** — `GET /api/v2/vendor/solutions` has zero product readers after the pwa half, but **eight routes, three files, one green bench (`b43`) and one comment reference**. R-G11.18's condition fails; nothing deleted; post-beta.
- **F-40.29–.33** — the fixture findings: no wedding on DEV440, no `couple_id`, nothing `done`, no untagged number, the soft-deleted event still reading `upcoming`.
- **F-40.35** — three of the four season words were unauthored until R-40.25. Now vetoed and frozen.
- **The PAIR regen is OWED** once `0131` runs: `docs/db/PUBLIC_SCHEMA.md` knows none of the three tables and `0131` is their sole witness under the SQL-provenance law.
- **The no-event create** (`event_id` nullable, door closed) is chartered to **G1.2** with its own mock and strings.
- **The couple's consent switch** — G1.2's, and the only writer `couple_consent` will ever have.

---

## H8 · PROTOCOL ATTESTATION

`docs/TDW_BUILD_PROTOCOL.md` §7 and §11 opened at `dream-os d58648e` and read in full. The §7 apply chain, verbatim:

```
unzip -o FILE.zip && cp -r deploy/* . && rm -rf deploy FILE.zip
```

No dotfile is placed inside `deploy/`. `docs/db/PUBLIC_SCHEMA.md` and `docs/db/ENGINE_SCHEMA.md` both opened; **this sitting reads and writes the `public` plane only** and touches no `engine` byte. Every column in `0131` and in every SELECT is witnessed by ordinal, with the `vendors` staleness named and settled against `information_schema`. LE holds no write credentials; nothing here is banked until the founder pushes.

**Sequencing beyond this sitting is the founder's.**
