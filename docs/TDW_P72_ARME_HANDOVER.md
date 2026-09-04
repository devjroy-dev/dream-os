# P7.2 · ARM E — THE dream-os COMPANION · HANDOVER

**Base** dream-os `main` **a0f6fff** (unmoved) · warrant tip dreamos-pwa `worklist` **6e8a22b**.
Three files. `node --check` clean on both sources · **b48 6/6** · dream-os floor measured on a
committed tree: **15 RED + 1 ERROR + 4 REFUSED, SET IDENTICAL before and after**.

> Run `npm run build` before the floor. `src/engine/dist` absent makes the floor STOP with
> twenty-seven false REDs (F-39.p2), and b48 throws on the missing module — that is what it
> does here, not a defect.

## §0 · APPLY — two blocks

```
unzip -o TDW_P72_ARME.zip && cp -r deploy/* . && rm -rf deploy TDW_P72_ARME.zip
```

```
git add -A && git commit -m "P7.2 Arm E: cabinet.js retires paid/owed (readers cured at the shell, FORK 4); pwaPaths collapses leadsList onto the live Leads room and drops the /w/ twins [F-2b2.3 corrected · FORK 5 · b48 §1.4 inverted]" && git push origin main
```

## §1 · THE CABINET SLICES RETIRE, ON A CORRECTED PREMISE

`src/api/vendor-engine/cabinet.js` no longer computes `paid` or `owed`, and the payload and its
`counts` ship the four surviving slices.

**F-2b2.3's premise was wrong and the correction is the warrant.** It listed these for retirement
because their readers were "the old /vendor tree's pages". They were not: the readers were the
**shell's** — `leads/body.tsx`, `events/body.tsx`, and the invoices masthead via `deriveMoney` —
and they were **cured at the shell** in P7.2 ZIP 1, not deleted with the tree.

**The proof, quoted rather than re-asserted:** `tsc --noEmit` on dreamos-pwa at **405f962**, where
dropping `paid`/`owed` from `CabinetResponse` named exactly **one** remaining reader,
`lib/vendor/derive.ts::moneyBinders`, which retired with them. The invoices figure now comes from
`money.js`'s own summary (OUTSTANDING_STATES — one rule, server-side).

**`pendingOf` STAYS.** It is F-04.13's ruled money rule and `today.js` reads it for the Today
feed's `amount_owed`. b48 §1.4 asserts its survival alongside the absence of the two slices.

**b48 §1.4 INVERTED.** It was written as the opposite of a retirement — it *held* the slices in
the payload on F-2b2.3's premise. It now asserts their absence, the four-slice payload, the
absence of their counts, and `pendingOf`'s survival, so they cannot return without a ruling.

## §2 · `pwaPaths.js` — ONE ADDRESS, AND ONE OF THEM WAS BROKEN

**`leadsList` changed value: `/vendor/list/leads` → `/vendor/leads`.** This is not cosmetic. The
flip deleted `/vendor/list/*` (R-39.24), and `src/api/couple/enquire.js:112` sends that address to
a vendor **over WhatsApp** when a couple enquires — a stale spelling there is a 404 in a vendor's
hand, not a broken link on a page. Derived as FORK 5 at P7.2's read-first.

The file's own note said collapsing the two leads keys was "Phase 7's, not this file's". This is
Phase 7. Both keys now name the one live room; they remain two keys because two call sites ask by
two names — the names are a caller's business, the address is this file's, and there is now one.

**The `/w/` twins are DELETED, not uncommented.** The header described a world where the shell
lived at `/w/*` on a branch and production served the old tree, with each path carried twice so a
cutover could switch between them. Arm (a) removed that problem rather than switching between its
horns: the shell **moved onto** `/vendor/*` and the old tree went in the same commit. A commented
`/w/` twin would now be a route nobody can serve, kept alive for a reader to trust by mistake.
The header is re-written to say what is true.

## §3 · FILED, NOT FIXED

**F-39.86 — a cross-repo stale read.** `scripts/b07_p5_bench.js:1096` reads the **pwa's**
`app/vendor/list/[slice]/page.tsx`, deleted at the flip. It sits inside the unchanged base set, so
it is pre-existing rather than caused here, and cross-repo bench surgery is outside Arm E's
radius. Named so the next seat does not read it as new.

## §4 · WALK
Nothing vendor-facing changed in the shell. The one behaviour to confirm is the enquiry link:
a couple enquiry → the WhatsApp message the vendor receives → its Leads link opens
`/vendor/leads` and lands in the room (not a 404). Everything else is asserted by b48.

## §5 · NOT IN THIS ZIP
P7.3 (the demo studio in the Graphite shell) · P7.4 (the merge to `main`, the production walk,
the seal). F-38.50's residue and F-39.85 → Block 09.
