# TDW_10 · ADMIN P3 · RIDER 3 — THE UNDO, THE WELCOME'S SECOND DOOR, THE DEAD STEP

**Base:** dream-os `03dd194` + the flip (pushed as `b2a978b4` on Railway) · dreamos-pwa `54a090e`
**Founder rulings:** 「 reject-undo needed. and yes to the other two 」 · 「 3 to 5 photo is from the legacy era. it has no bearing whatso ever now 」
**Role:** LE. Nothing pushed.

---

## 0 · TWO ZIPS, NOT ONE — AND WHY I COULD NOT FOLD THEM

The founder asked for one ZIP. **The repo head-guard law (CE-65) makes that impossible**: every delivery's apply block opens with a guard keyed on the witnessed `package.json` name, and a ZIP that applied into both repos would have to fail one of them. F-10.53 spans both — the step lives in the pwa, its server-side validator in dream-os — so it ships as two.

**Reported rather than adapted (§0.2).** The alternative was to leave the dream-os half out, and that is worse: a validator for a field no caller sends is dead code that reads like a live contract.

**The pwa ZIP is the whole user-visible change.** The dream-os ZIP is three lines of deletion and can follow at any distance.

---

## 1 · WHAT SHIPPED

**dreamos-pwa**

| File | What |
|---|---|
| `app/admin/approvals/discover/page.tsx` | **F-10.58** the reject-undo — a held intent, not a compensating write |
| `app/admin/makers/page.tsx` | **F-10.57** `Send welcome` on the row, tap-to-confirm |
| `app/vendor/discover/submit/page.tsx` | **F-10.53** the samples step deleted, 4 → 3 |
| `scripts/tdw10_p3_deck.proof.mjs` | 159 cells (+29), M14/M15/M16 |

**dream-os**

| File | What |
|---|---|
| `src/lib/vendor/discover.js` | the samples validator retired; the field stays accepted-and-ignored |

---

## 2 · THE UNDO IS REAL, AND THAT IS THE DESIGN DECISION

The obvious build is: deny at once, offer an "undo" that grants afterwards. **That is not an undo.** In between, the vendor's screen flips to *Not Approved*; her pitch is already destroyed by the deny (F-10.44); and the audit carries a decision that was retracted.

So **nothing is sent during the window.** The card leaves the deck optimistically, a five-second timer holds the intent, and `denyDiscover` fires only when the window closes. Undo cancels a timer — there is nothing to reverse because nothing happened.

**The danger of that shape is the opposite one: a held intent that never fires.** The founder would believe he had rejected her. So it flushes on **every** exit — the timer, a second decision, unmounting the page, and `beforeunload`. A ref mirrors the state because those handlers run outside React's render and would read a stale closure. The flush clears the intent *before* awaiting, so a race cannot send twice. Eleven cells, and **M14** fires immediately while **M15** removes the unmount flush.

It is a **bar, not a toast**, deliberately: `Toast` auto-dismisses on its own 3s clock, which would leave a countdown the founder could not act on.

---

## 3 · THE WELCOME'S SECOND DOOR

Found the expensive way — the founder **deleted a vendor and re-minted her** to get the button back, because it lived only on the mint's success card.

Now on the Makers row beside `Add to Discover` / `Revoke Access` / `Delete`, calling the same `/mint/welcome/:vendorId` — no second door. **Tap-to-confirm, matching `Delete` on that same row**, and founder-ruled: until this evening the button was harmless because the gate refused everything. `vendor_welcome` is now approved, so one tap sends a real WhatsApp message. On the mint card a bare tap is defensible — you just made the account. In a list of every vendor you have, one mis-tap messages a stranger.

---

## 4 · §0.2 — THE RETIREMENT NEARLY TOOK A NEIGHBOURING GATE WITH IT

Step 3's **Continue** required a non-empty pitch before letting the vendor reach step 4. With step 4 gone, step 3's button became **Submit**, whose only guard was `submitting`.

**Deleting the samples step would have silently deleted the pitch requirement**, and an empty application would have reached the deck with no sentence on the card. Caught by reading the button branch rather than the step block. The gate moved to submit; **M16** removes it again.

Two more things died with the step rather than lingering: the `fetchPortfolio` call whose only consumer was the sample grid, and the `vendorId` prop whose only consumer was that fetch. Wire-or-delete-at-birth, applied to a retirement.

**The server keeps accepting `sample_image_ids` and ignoring it** — an old client cached in a browser must not start 400-ing on our housekeeping. Same shape `rate_max` already has one comment up.

---

## 5 · THREE CELLS RE-AIMED, EACH DISCLOSED

- **the chip reaching the transport** — it now travels via the held intent, so both halves are asserted: the chip is captured, and the flush sends exactly that reason.
- **`names no rgba() ground`** — the first draft matched *any* `rgba(`, which caught the undo bar's `boxShadow` — a shadow, not a ground, and the same value `Toast` has always used. **P1's D-4 again: a label naming a different quantity than the check.** Narrowed to backgrounds.
- **M8's anchor** moved with the `pending` → `pendingList` rename.

---

## 6 · PROOF

`tdw10_p3_deck` **159/159** · `b10_p3_mint_deck_bench` **120/120** · `b10_p2_bridge` **82/82**
pwa floor at exact counts: `p1_shell 53/53` · `p2_retint 76/76` · `roles 130/130` · `home 67/67` · `surface 51/51` · `type 16/16` · `console 55/55` · `prospects_console 54/54` · `f0790 8/8`
`tdw_f0774_stripper 33/35` — **F-10.49, pre-existing, unmoved by this delivery**
tsc 0 on a cleared cache · engine build 0 · `node --check` clean

---

## 7 · WHAT REMAINS

- **Acceptance number 2's live witness** — parked; bench-proven, twelve cells + M1.
- **F-10.52** the frozen ten aesthetic tags — the second finding from that same form, still unruled.
- **F-10.49** the two stripper-rot cells in P1's and P2's own benches.
- **F-10.48** the fourth couple-birth writer · **F-10.44's** full cure (DDL, 0113).
- **Underived:** the DELETE 404 beside a *Photo removed* toast.

Spent here: **F-10.57**, **F-10.58**. Next free: **F-10.59**.

*Sequencing beyond this sitting is the founder's.*
