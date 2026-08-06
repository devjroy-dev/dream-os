# TDW_10 · ADMIN P3 · RIDER 1 — THREE DEFECTS FROM THE FOUNDER'S WALK

**Base:** dream-os `800d7a1` · dreamos-pwa (P3 ZIP applied, unpushed at time of writing)
**Origin:** the founder's live walk, 2026-08-06. All three were found by his handset and his console, none by a cell.
**Role:** LE. Nothing pushed. Two ZIPs, own guards, founder-sequenced.

---

## 0 · THE BLOCKER IS NOT IN THIS RIDER — READ THIS FIRST

The console shows **404** on both `GET /api/v2/admin/mint/welcome-status` and `POST /api/v2/admin/mint/vendor`.

**The mount is correct at origin.** Derived at `800d7a1`: `src/api/router.js` carries
`router.use('/admin/mint', require('./admin/mint'))` **above** the broad `/admin` content mount, and `src/index.js:160` mounts that router at `/api/v2`. So `/api/v2/admin/mint/vendor` resolves in the code the founder pushed.

**Therefore Railway is not serving `800d7a1`.** Corroborated by the same console frame: the Bridge p50 table (`wall 610 / server 380`) is P2 code running fine, and `/admin/makers` loads — so the container is alive on an OLDER build. A 404 on *only* the new routes, with every pre-existing route healthy, is the signature of a deploy that has not landed rather than of a routing defect.

**Founder step, before anything in this rider matters:** open Railway → service `dream-os` → Deployments, and check whether a deploy for `800d7a1` succeeded, is still building, or **failed and left the previous deployment active**. If it failed, the build log is the evidence and I will read it. A one-line probe once you believe it is live:

```
curl -s https://dream-os-production.up.railway.app/api/v2/admin/mint/welcome-status -o /dev/null -w '%{http_code}\n'
```

**401 is the correct answer** — that is `requireAdmin` refusing an unauthenticated probe, which proves the route exists. **404 means the build is still old.**

This rider ships now because its three defects are real regardless, and two of them are mine.

---

## 1 · F-10.50 — THE MINT DID NOT NORMALISE THE PHONE

`src/lib/phone.js` is **the one home** for phone normalisation, hoisted at F-04.109 precisely because three divergent copies were splitting one person into two rows. It had three callers. **The mint I shipped was not one of them** — it stored `String(phone).trim()` verbatim, and I never went looking for the normaliser.

What it cost, derived:

- Bare digits land in `users.phone` as `9431101193` while every other row is `+91…`.
- Vendor login enforces `/^\+[0-9]{8,15}$/` and matches on exact equality (`src/api/vendor/auth.js`, symbol `sendOtp`). That row is **unreachable**.
- Worse: `send-otp` self-mints on a phone it does not find, so the vendor's first sign-in would create a **second `users` row** for the same person — exactly the divergence `phone.js`'s header exists to prevent.
- And it partly defeated **F-10.47**: the collision check is `.eq('phone', cleanPhone)`, so minting bare digits against a stored `+91` row read as **virgin**, called the RPC, and reached the clobber clause the cure was built to make unreachable.

**Cure:** `toE164` on both mint handlers, before the existence lookup and before the RPC. Six new cells, including a bare-digit mint of a stored `+91` number that must report `existing`, and an assertion that the RPC receives the E.164 form. **M11** strips the call and watches a bare-digit mint read as virgin again.

**The founder's own candidate check is what surfaced this.** The virgin-phone query matched on `regexp_replace(u.phone, '\D', '', 'g')`, so bare digits found a row stored as `+91…`. Written the obvious way it would have reported the number free.

---

## 2 · THE CTA WAS ROSE, AND MY OWN GATE COULD NOT SEE IT

`MintSheet.tsx` rendered its primary button through `GoldBtn`, whose colour is `AdminUI`'s `T.gold` — **`#C44058`, the rose CE-199 retired from the rebuilt set on the founder's word 「 GOld ratified/. 」**. So a new P3 surface painted a retired accent, and **the hex-zero cell passed**, because the literal lives one import away in a file the bench does not read.

That is CE-115 clause 2 one layer up: a property living above a component is invisible to cells that only inspect the component. **The founder saw it on his handset before any instrument did.**

**Cure:** the CTA is now a local button on `var(--admin-metal)`, and the gate **walks each surface's own import statements** — derived, never hand-listed (F-10.46's lesson applied at its first opportunity). A non-vacuity cell asserts `GoldBtn` really does still carry the rose, so the guard is not protecting a ghost. **M9** re-imports `GoldBtn` and watches it redden.

Filed as **F-10.51** — the gate class, not the one button.

---

## 3 · A-4 — THE BUTTON THE FOUNDER COULD NOT SEE

`BottomSheet` reserves `calc(env(safe-area-inset-bottom) + 28px)`. The mobile domain bar (`app/admin/layout.tsx`, `#m-domains`) is `position:fixed; bottom:0`, roughly 60px tall plus its own safe-area inset — **more than twice the sheet's reserve**. The last control in the sheet therefore lands underneath the bar on a real handset, and the last control was the primary action.

**One thing derived and one thing not, stated apart.** The arithmetic is certain. What I could **not** witness from this container is whether z-index also plays a part: the sheet is `z-301` and the bar `z-195`, so the sheet should paint over it, yet the founder's frame shows the bar on top — which implies an ancestor stacking context capping the sheet. Reserving the bar's height cures the symptom under **either** cause, and is the right shape regardless: a primary action should never sit over a nav bar even when it paints above one. **The stacking question is filed, not guessed at** — it belongs to P6's mobile pass, where the whole admin gets thumb-tested.

**Fixed in `MintSheet.tsx`, not in `BottomSheet`** — that component is shared by other admin screens whose content is short, and widening a shared component to cure one caller's overflow is a change nobody ruled.

Two cells assert the reserve on **both** panes (the form and the success card, which has controls too); **M10** removes it.

---

## 4 · PROOF

- `b10_p3_mint_deck_bench` **110/110** (was 101; +9 for F-10.50, incl. M11)
- `tdw10_p3_deck` **113/113** (was 104; +9 for F-10.51 and A-4, incl. M9/M10)
- dream-os floor: `b10_p2_bridge 82/82` · `b10_p1_search 45/45` · `tdw09_micro 23/23` · engine build exit 0 · `node --check` clean
- pwa floor: `p1_shell 53/53` · `p2_bridge 44/44` · `p2_retint 76/76` · `roles 130/130` · tsc 0 on a cleared cache

---

## 5 · WHAT THIS RIDER DOES NOT FIX

- **The 404.** §0 — a deploy question, and yours.
- **The stacking-context question** behind defect 3 — filed for P6's mobile pass.
- **F-10.49** (the two pre-existing stripper-rot cells) and **F-10.48** (the fourth couple-birth writer) are untouched and still want rulings.

**Findings this rider spends: F-10.50, F-10.51. Next free: F-10.52.**

*Sequencing beyond this sitting is the founder's.*
