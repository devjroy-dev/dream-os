# TDW_07 P4b SLICE 1 — EXECUTOR HANDOVER

**Seat:** Opus-LE, fresh clone, §11 whole · **Sitting:** 2026-07-30
**Base:** `dream-os 828bab6` · `dreamos-pwa 70f6f82` (both re-derived fetch-first at origin at sitting open AND at build; nothing was pushed past the P4a seal by the retired seat)
**Charter:** the fifteenth chair's P4b kickoff + the CE ruling on the read-first + the CE addendum (founder's 「 ok 」 on H15–H18)

---

## 1 · WHAT SHIPPED

Two files of production movement, two new benches. Nothing else.

| Repo | File | Movement |
|---|---|---|
| dreamos-pwa | `app/vendor/portfolio/page.tsx` | F-07.22 cure (b) + the stuck-button cure at both sites + the H15–H18 veto stamps |
| dream-os | `src/lib/vendor/igOAuth.js` | **comment only** — the amended physics paragraph |
| dreamos-pwa | `scripts/tdw07_p4b_slice1.proof.mjs` | NEW bench, 24 cells |
| dream-os | `scripts/b07_p4b_slice1_bench.js` | NEW bench, 19 cells |

### F-07.22 — the connect navigation, cure (b)

The control is now a real `<a href>` over a URL minted **before render**. There is no handler, no `await`, and nothing at all between the vendor's finger and the navigation.

The old shape was an `async` onClick that awaited `/ig/authorize` and *then* assigned `window.location.href`. The await spends the tap's transient activation, so what reached iOS was a **script-initiated navigation wearing a tap's clothes** — the claimable side of the line rather than the suppressed side.

Supporting machinery:
- `mintIgAuthUrl` — a stable `useCallback`, minting only when the server says the seam is wired AND this vendor still has to connect. A connected vendor arms no nonce.
- `MINT_REFRESH_MS = 8 min`, re-minting on restore when the minted state has aged. The server's `STATE_TTL_MS` is 10 minutes; the bench **derives** the comparison rather than hard-coding it, so a later raise past the TTL reddens instead of passing.
- The unminted state is a **button that re-mints and does not navigate** — an honest second state rather than a hrefless `<a>`, which would be F-07.13's dead control in a link's clothes.

**Fork (a) — the server 302 start route — was refused and NOT built.** The refusal is recorded inside `igOAuth.js` because that is where the argument lives: (a) is the exact hop F-07.23 deleted.

### The stuck-muted Connect button — cured at both sites

`igBusy` was set on connect and never cleared, which is correct while a document unloads and wrong the moment it does not. iOS restores the page from bfcache with React state intact, so an abandoned flow came home to a control muted at 0.4 opacity with no way back but a hard reload.

1. `pageshow` + `visibilitychange` re-arm the restored page.
2. The `?ig=` return effect carries an explicit reset.

**The reset is scoped to `'connect'` at both sites, deliberately.** `igBusy` also guards the picker, the import and the disconnect — in-page async operations that clear themselves. A blanket `setIgBusy(null)` on visibility would re-arm the import button mid-import: a stuck control traded for a double write. `'connect'` is the only value that survives a navigation by design, so it is the only value with business being reset. The bench asserts the scoped form at both sites and would redden on a blanket reset.

### H15–H18 — the veto stamped

The founder's 「 ok 」 discharged all four. They ship **byte-exact as recovered** — no wording moved between draft and final, stated in-file so a later reader does not hunt a diff that is not there. The `// DRAFT — veto owed` markers are replaced with `// VETOED 2026-07-30`.

H18 carries its **presence-mandatory** constraint as a boxed in-file law: the wording may be re-authored freely, the line may not be removed or made conditional beyond the handle existing. The App Review filing states in two places that it is visible.

---

## 2 · PROOF

### Both-ways, non-vacuous

| Bench | Cured tree | Uncured origin |
|---|---|---|
| `tdw07_p4b_slice1` (pwa) | **24/24**, exit 0 | **5/24**, exit 1 |
| `b07_p4b_slice1` (dream-os) | **19/19**, exit 0 | **11/19**, exit 1 |

**The stable greens are disclosed rather than counted as strength.** On the pwa side, 4 of the 5 are the H15–H18 byte-identity cells — by design they assert that nothing moved, so they must pass at both trees; the fifth is H18's render site, which already existed. On the dream-os side all 11 are §2.3 and §3's byte-stability cells, which exist precisely to prove the comment amendment took no mechanism with it. Neither set is evidence of a cure and neither is presented as such.

### Floor at delivery — chair-reproducible

Identical counts at the cured tree and at pristine origin, so the delta moved nothing:

| Bench | Cured | Origin |
|---|---|---|
| `b07_p1_bench` | 72/72 | 72/72 |
| `b07_p2_bench` | 48/48 | 48/48 |
| `b07_p3_bench` | 50/50 | 50/50 |
| `b07_p4a_ig_bench` | 107/107 | 107/107 |

**Known-reds, named:** `b05_f0555_media_dedupe_bench` **22/23** — reproduced exactly, F-07.11's known red, unchanged.

**SKIPPED, with reason (floor-method law):** `b06_meter_bench` could not be read cleanly in this container — the compiled engine `dist` is absent, so the bench degrades to a dist-skip path and reports a section count, not its floor. Its named known-red of 28/29 is therefore **NOT verified by me**; I decline to assert it from the log. My delta touches zero engine bytes, so the bench is not adjacent to this work — but the count travels unwitnessed and should be read in the founder's or the chair's terminal.

### Gates

- `node --check` clean on both touched/new `.js` files
- **pwa `tsc --noEmit` whole-tree, cleared `.next`: ZERO errors**
- **W-1 CLEAN** — zero soul, prompt, lens or engine bytes. Derived by directory diff, not asserted.
- **The `igOAuth.js` change is COMMENT-ONLY, proven mechanically:** comment-stripped source is byte-identical between origin and the cured tree. Zero executable bytes moved.
- Delta vs origin is exactly the four files in §1. Nothing else differs.

---

## 3 · EXECUTOR DISCLOSURES

1. **My own bench defect, filed not papered.** `b07_p4b_slice1_bench` §3.8's first take stripped the opening quote of each route literal and not the closing one, so it reddened at *both* trees over a bench bug while the route set was correct throughout. Fixed properly and recorded in-cell — a cell that fails identically at both trees is exactly the shape that gets waved through as a known red if nobody reads it.

2. **The P4a handover is NOT in this ZIP, and the reason is a §0.2 report.** The ruling says to carry the retired session's handover text *verbatim*. **I have never seen that text.** It was never inked at origin, and my read-first established that it does not exist in the repo. I can reconstruct a P4a handover from the five commit messages and the code at the tip — but a reconstruction stamped "verbatim from the retired seat" would be the costume class applied to the handover ledger. It therefore rides P4b's body ZIP, **authored by me and labelled a reconstruction with its sources named**, unless the chair rules otherwise or the retired seat's text surfaces.

3. **A floor drift found in passing.** `b07_p3_bench` reads **50/50** at origin, but the committed P3 seal line in `FINDINGS_LOG.md` records `b07_p3 49/49`. `git log` shows `598c2d7` (a P4a commit) touched `scripts/b07_p3_bench.js` — so a cell was added during P4a and the count moved undisclosed. Not my delta, harmless in substance, but the floor-method law says counts are disclosed rather than preserved silently. Filed for the chair as a candidate finding.

4. **The re-mint hazard is named, not discovered.** `/ig/authorize` arms a nonce server-side and each mint overwrites the last, so exactly one state is live per vendor. Re-minting mid-flow would make the returning callback look like a replay. The re-mint therefore fires only when the tab is **visible** — a vendor sitting on Instagram's consent screen has this tab hidden, so their armed state is never pulled from under them. Stated in-file at the cure site.

5. **This bench proves wiring, never iOS.** Whether navigation form was the disease is decidable only on the founder's handset. Per the provable-equivalent doctrine, that truth is named on the smoke card as his alone.

---

## 4 · WHAT THIS DOES NOT CLAIM

The cure ships as a **hypothesis with a mechanism**, exactly as `igOAuth.js` has done twice now. If the founder's one-tap retest still fails, navigation form is **cleanly eliminated** as a variable — and that is a FINDING, not a failure. The comment says so at both sites and asks to be amended rather than left standing.

Manual upload remains the permanent fallback. Nothing here assumes a Safari session or a completed flow.

---

## 5 · NEXT

P4b's body, per the settled ledger: the widened F4 (one `rateMet` predicate across all three sites, the pwa field trimmed) · `VendorProfileView` the one renderer · the shaper · the preview · F-07.15's death · the five money sites + the register cell · the reconstructed P4a handover.

**HELD, not forgotten:** the five P4b strings (founder's pending word) · the walk card (his query-B paste, fixture law) · the schema dump refresh (five migrations behind) · the chair's CE-116 findings band + masterplan ink.
